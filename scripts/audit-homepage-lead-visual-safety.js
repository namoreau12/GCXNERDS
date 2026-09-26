const { chromium } = require("./playwright-loader");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "homepage-lead-visual-safety.json");

function writeJson(value) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, outputPath);
}

async function inspectHomepageLead(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${base}/?audit=homepage-lead-visual-safety`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.locator("#home-lead-story img").waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);

  return page.evaluate(() => {
    const hero = document.querySelector("#home-lead-story");
    const copy = hero?.querySelector(".hero-copy");
    const image = hero?.querySelector("img");
    const title = copy?.querySelector("h1");
    const cta = copy?.querySelector(".button");
    const rect = (element) => {
      const bounds = element.getBoundingClientRect();
      return {
        top: Math.round(bounds.top),
        right: Math.round(bounds.right),
        bottom: Math.round(bounds.bottom),
        left: Math.round(bounds.left),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      };
    };
    const copyStyle = copy ? getComputedStyle(copy) : null;
    const titleStyle = title ? getComputedStyle(title) : null;
    const imageStyle = image ? getComputedStyle(image) : null;
    const heroRect = hero ? rect(hero) : null;
    const copyRect = copy ? rect(copy) : null;
    const titleRect = title ? rect(title) : null;
    const ctaRect = cta ? rect(cta) : null;
    const imageRect = image ? rect(image) : null;
    const isGraphic = hero?.dataset.mediaType === "graphic";
    const usesOverlayCopy = copyStyle?.position === "absolute";
    const titleInsideCopy =
      Boolean(copyRect && titleRect) && titleRect.top >= copyRect.top && titleRect.bottom <= copyRect.bottom;
    const ctaInsideHero =
      Boolean(heroRect && ctaRect) && ctaRect.top >= heroRect.top && ctaRect.bottom <= heroRect.bottom;
    const graphicHasSeparatedCopy =
      !isGraphic ||
      (copyStyle?.position !== "absolute" &&
        imageStyle?.objectFit === "contain" &&
        imageRect &&
        copyRect &&
        imageRect.bottom <= copyRect.top + 1);
    const mediaHasSeparatedCopy =
      copyStyle?.position !== "absolute" && imageRect && copyRect && imageRect.bottom <= copyRect.top + 1;
    const usesSvgLead = /\.svg(\?|$)/i.test(image?.getAttribute("src") || "");
    const heroFitsViewport = Boolean(heroRect) && heroRect.bottom <= window.innerHeight + 1;

    const copyClipped = copy ? copy.scrollHeight > copy.clientHeight + 1 : true;

    return {
      mediaType: hero?.dataset.mediaType || "",
      imageUrl: image?.getAttribute("src") || "",
      title: title?.innerText || "",
      hero: heroRect,
      image: imageRect,
      copy: copyRect,
      titleBounds: titleRect,
      cta: ctaRect,
      copyPosition: copyStyle?.position || "",
      copyClipped,
      titleInsideCopy,
      ctaInsideHero,
      imageObjectFit: imageStyle?.objectFit || "",
      graphicHasSeparatedCopy,
      mediaHasSeparatedCopy,
      usesOverlayCopy,
      usesSvgLead,
      heroFitsViewport,
      ok: Boolean(hero && copy && image && title && cta) &&
        !copyClipped &&
        titleInsideCopy &&
        ctaInsideHero &&
        mediaHasSeparatedCopy &&
        graphicHasSeparatedCopy &&
        !usesOverlayCopy &&
        !usesSvgLead &&
        heroFitsViewport,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    const viewports = [
      { width: 390, height: 900 },
      { width: 820, height: 900 },
      { width: 1280, height: 900 },
      { width: 1586, height: 987 },
    ];
    const checks = [];
    for (const viewport of viewports) {
      checks.push({ viewport, ...(await inspectHomepageLead(page, viewport)) });
    }
    const ok = checks.every((check) => check.ok);
    const report = {
      generatedAt: new Date().toISOString(),
      base,
      ok,
      checks,
      consoleErrors,
    };
    writeJson(report);
    console.log(JSON.stringify(report, null, 2));
    process.exit(ok ? 0 : 1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
