const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "outputs", "overlap-audit");
const baseUrl = process.env.GCX_BASE_URL || "http://localhost:3000";

const pages = [
  {
    name: "news",
    path: "/news.html",
    hero: ".news-hero",
    firstSection: ".news-toolbar",
  },
  {
    name: "social",
    path: "/community.html",
    hero: ".community-hero",
    firstSection: ".community-layout",
  },
  {
    name: "streamers",
    path: "/streamers.html",
    hero: ".streamer-hero",
    firstSection: ".creator-live-stage-section",
  },
];

const viewports = [
  { width: 390, height: 900 },
  { width: 768, height: 980 },
  { width: 1280, height: 900 },
];

function overlaps(a, b, buffer = 1) {
  return (
    a.left < b.right - buffer &&
    a.right > b.left + buffer &&
    a.top < b.bottom - buffer &&
    a.bottom > b.top + buffer
  );
}

async function auditPage(page, target, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${baseUrl}${target.path}`, { waitUntil: "networkidle" });

  return page.evaluate(({ target }) => {
    function rectFor(element) {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    }

    const hero = document.querySelector(target.hero);
    const firstSection = document.querySelector(target.firstSection);
    const failures = [];

    if (!hero) {
      failures.push({ code: "missing-hero", selector: target.hero });
      return { failures };
    }

    const heroRect = rectFor(hero);
    const textColumn = hero.querySelector(":scope > div:first-child");
    const visibleTextBlocks = textColumn
      ? [...textColumn.children].filter((child) => {
          const style = window.getComputedStyle(child);
          const rect = child.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        })
      : [];

    const textRects = visibleTextBlocks.map((child) => ({
      tag: child.tagName.toLowerCase(),
      className: child.className || "",
      text: (child.textContent || "").trim().slice(0, 80),
      rect: rectFor(child),
    }));

    for (let index = 0; index < textRects.length - 1; index += 1) {
      const current = textRects[index];
      const next = textRects[index + 1];
      if (current.rect.bottom > next.rect.top - 1) {
        failures.push({
          code: "hero-text-vertical-overlap",
          current,
          next,
        });
      }
    }

    const heroChildren = [...hero.children]
      .map((child) => ({ selector: child.className || child.tagName.toLowerCase(), rect: rectFor(child) }))
      .filter((child) => child.rect.width > 0 && child.rect.height > 0);

    for (let outer = 0; outer < heroChildren.length; outer += 1) {
      for (let inner = outer + 1; inner < heroChildren.length; inner += 1) {
        const first = heroChildren[outer];
        const second = heroChildren[inner];
        if (first.rect.width < heroRect.width * 0.95 && second.rect.width < heroRect.width * 0.95) {
          const hasMeaningfulOverlap =
            first.rect.left < second.rect.right - 2 &&
            first.rect.right > second.rect.left + 2 &&
            first.rect.top < second.rect.bottom - 2 &&
            first.rect.bottom > second.rect.top + 2;
          if (hasMeaningfulOverlap) {
            failures.push({ code: "hero-column-overlap", first, second });
          }
        }
      }
    }

    if (firstSection) {
      const sectionRect = rectFor(firstSection);
      if (heroRect.bottom > sectionRect.top - 1) {
        failures.push({
          code: "hero-overlaps-next-section",
          hero: heroRect,
          section: sectionRect,
        });
      }
    }

    const overflowing = [...document.querySelectorAll("body *")]
      .map((element) => ({ tag: element.tagName.toLowerCase(), className: element.className || "", rect: rectFor(element) }))
      .filter((item) => item.rect.width > 0 && item.rect.right > window.innerWidth + 1)
      .slice(0, 10);

    if (overflowing.length) {
      failures.push({ code: "horizontal-overflow", overflowing });
    }

    return {
      hero: heroRect,
      textRects,
      failures,
    };
  }, { target });
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || process.env.CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  const results = [];

  try {
    for (const viewport of viewports) {
      for (const target of pages) {
        const result = await auditPage(page, target, viewport);
        const screenshotPath = path.join(outputDir, `${target.name}-${viewport.width}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        results.push({
          page: target.name,
          viewport,
          screenshotPath,
          ...result,
        });
      }
    }
  } finally {
    await browser.close();
  }

  const failures = results.flatMap((result) =>
    result.failures.map((failure) => ({
      page: result.page,
      viewport: result.viewport,
      ...failure,
    }))
  );

  const report = {
    ok: failures.length === 0,
    checked: results.length,
    failures,
    screenshots: results.map((result) => result.screenshotPath),
  };

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
