const { chromium } = require("./playwright-loader");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "prominent-news-official-media.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function storyHeroImageUrl(story) {
  return story?.heroImage || story?.imageUrl || "";
}

function storyHeroMediaType(story) {
  return normalize(story?.mediaType || story?.leadMediaType || story?.imageType || "screenshot") || "screenshot";
}

function isGamingStory(story) {
  return normalize(story?.category || story?.type).includes("gaming");
}

function storyHasOfficialMedia(story) {
  const imageUrl = storyHeroImageUrl(story);
  const mediaType = storyHeroMediaType(story);
  const credit = normalize(story?.heroImageCredit || story?.imageCredit);
  const source = normalize(story?.heroImageSource || story?.sourceName);
  const sourceUrl = normalize(story?.heroImageSourceUrl || story?.imageSourceUrl || "");
  if (!imageUrl) return false;
  if (/\.svg(?:\?|$)/i.test(imageUrl)) return false;
  if (["graphic", "chart", "diagram", "infographic", "fallback", "placeholder"].includes(mediaType)) return false;
  if (/\b(fallback|pending|required|review)\b/.test(`${credit} ${source} ${sourceUrl}`)) return false;
  return /official|publisher|developer|press|square enix|capcom|xbox|playstation|nintendo|fromsoftware|cd projekt|rockstar/.test(
    `${credit} ${source} ${sourceUrl}`
  );
}

async function fetchStories() {
  const response = await fetch(`${base}/api/news?limit=50`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`/api/news returned ${response.status}`);
  const result = await response.json();
  return Array.isArray(result.data) ? result.data : [];
}

function storyKey(story) {
  return normalize([story?.title, story?.seoTitle, story?.homeTitle].filter(Boolean).join(" "));
}

function findStoryForCheck(stories, check) {
  const title = normalize(check.title);
  return (
    stories.find((story) => story.id && check.href && check.href.includes(encodeURIComponent(story.id))) ||
    stories.find((story) => title && storyKey(story).includes(title)) ||
    stories.find((story) => title && title.includes(normalize(story.title)))
  );
}

function writeJson(value) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, outputPath);
}

async function inspectPage(page, targetPath, viewport) {
  await page.setViewportSize(viewport);
  const response = await page.goto(`${base}${targetPath}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page
    .waitForResponse((res) => res.url().includes("/api/news") && res.status() < 500, { timeout: 10000 })
    .catch(() => {});
  await page.waitForTimeout(1200);

  const checks = await page.evaluate(() => {
    const imageSource = (element) => {
      const image = element.querySelector("img");
      return image?.currentSrc || image?.getAttribute("src") || "";
    };
    const mediaType = (element) =>
      String(element.dataset.mediaType || element.querySelector("[data-media-type]")?.dataset.mediaType || "").toLowerCase();
    const title = (element) => element.querySelector("h1, h2, h3")?.innerText?.trim() || "";
    const hasOfficialWarning = (element) => Boolean(element.querySelector(".official-media-warning"));
    const isSvg = (element) => /\.svg(?:\?|$)/i.test(imageSource(element));
    const isFallback = (element) =>
      hasOfficialWarning(element) || ["fallback", "placeholder"].includes(mediaType(element)) || /fallback|placeholder/i.test(imageSource(element));

    const candidates = [
      ...Array.from(document.querySelectorAll("#home-lead-story")).map((element) => ({ slot: "home-lead", element })),
      ...Array.from(document.querySelectorAll(".news-lead")).map((element) => ({ slot: "news-lead", element })),
      ...Array.from(document.querySelectorAll(".news-feature-stack .news-compact")).map((element, index) => ({
        slot: `news-feature-stack-${index + 1}`,
        element,
      })),
    ];

    return candidates.map(({ slot, element }) => ({
      slot,
      title: title(element),
      href: element.querySelector("a[href]")?.getAttribute("href") || "",
      mediaType: mediaType(element),
      imageUrl: imageSource(element),
      hasOfficialWarning: hasOfficialWarning(element),
      usesSvg: isSvg(element),
      usesFallback: isFallback(element),
      ok: !isFallback(element) && !isSvg(element),
    }));
  });

  return {
    path: targetPath,
    viewport: `${viewport.width}x${viewport.height}`,
    status: response?.status() || 0,
    checks,
  };
}

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  const stories = await fetchStories();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    const viewports = [
      { width: 390, height: 900 },
      { width: 1280, height: 900 },
    ];
    const paths = ["/", "/news.html"];
    const results = [];
    for (const viewport of viewports) {
      for (const targetPath of paths) {
        results.push(await inspectPage(page, targetPath, viewport));
      }
    }

    const enrichedResults = results.map((result) => ({
      ...result,
      checks: result.checks.map((check) => {
        const story = findStoryForCheck(stories, check);
        const officialByMetadata = story ? storyHasOfficialMedia(story) : null;
        const isProminentGamingStory = story ? isGamingStory(story) : false;
        return {
          ...check,
          storyId: story?.id || "",
          officialByMetadata,
          isProminentGamingStory,
          ok: check.ok && (!isProminentGamingStory || officialByMetadata === true),
        };
      }),
    }));

    const failures = enrichedResults.flatMap((result) =>
      result.checks
        .filter((check) => !check.ok)
        .map((check) => ({
          path: result.path,
          viewport: result.viewport,
          ...check,
        }))
    );
    const ok = enrichedResults.every((result) => result.status === 200) && failures.length === 0 && consoleErrors.length === 0;
    const report = {
      ok,
      generatedAt: new Date().toISOString(),
      base,
      storyCount: stories.length,
      checkedPages: paths.length,
      checkedViewportCount: viewports.length,
      prominentSlotCount: enrichedResults.reduce((sum, result) => sum + result.checks.length, 0),
      failures,
      consoleErrors,
      results: enrichedResults,
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
