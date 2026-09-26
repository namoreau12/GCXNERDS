const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const outputPath = path.join(rootDir, "data", "launch-readiness", "article-image-duplicates.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function normalizeRenderedSrc(value) {
  try {
    const url = new URL(value || "", base);
    if (url.pathname === "/api/image-proxy" && url.searchParams.get("url")) {
      return `image-proxy:${url.searchParams.get("url")}`;
    }
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return String(value || "").split(/[?#]/)[0];
  }
}

function isIgnorableConsoleMessage(message) {
  return /Permissions policy violation: compute-pressure is not allowed/i.test(message);
}

async function inspectArticle(page, story) {
  const articlePath = `/article.html?id=${encodeURIComponent(story.id)}`;
  const response = await page.goto(`${base}${articlePath}`, { waitUntil: "networkidle" });
  const result = await page.evaluate(() => {
    const imageSelectors = [
      ".article-hero-image",
      ".editorial-media img",
      ".editorial-gallery img",
      ".pikachu-card img",
    ].join(", ");
    const images = Array.from(document.querySelectorAll(imageSelectors)).map((image) => ({
      src: image.currentSrc || image.src || image.getAttribute("src") || "",
      alt: image.getAttribute("alt") || "",
      className: image.className || "",
    }));
    return {
      imageCount: images.length,
      images,
      brokenImages: images.filter((image) => {
        const element = Array.from(document.images).find((candidate) => (candidate.currentSrc || candidate.src || candidate.getAttribute("src")) === image.src);
        return element?.complete && element.naturalWidth === 0;
      }),
    };
  });

  const counts = new Map();
  result.images.forEach((image) => {
    const key = normalizeRenderedSrc(image.src);
    if (!key) return;
    if (!counts.has(key)) counts.set(key, []);
    counts.get(key).push(image);
  });

  return {
    storyId: story.id,
    title: story.title,
    path: articlePath,
    status: response?.status() || 0,
    imageCount: result.imageCount,
    duplicateImages: [...counts.entries()]
      .filter((entry) => entry[1].length > 1)
      .map(([src, images]) => ({ src, count: images.length, images })),
    brokenImages: result.brokenImages,
  };
}

async function main() {
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8")).filter((story) => story?.id);
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  const results = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`${page.url()} :: ${message.text()}`);
  });

  for (const story of stories) {
    results.push(await inspectArticle(page, story));
  }

  await browser.close();

  const failures = [];
  results.forEach((result) => {
    if (result.status !== 200) failures.push({ storyId: result.storyId, issue: `Article returned ${result.status}` });
    result.duplicateImages.forEach((duplicate) => failures.push({ storyId: result.storyId, issue: "Duplicate article image rendered.", src: duplicate.src, count: duplicate.count }));
    result.brokenImages.forEach((image) => failures.push({ storyId: result.storyId, issue: "Broken article image rendered.", src: image.src }));
  });
  consoleErrors
    .filter((message) => !isIgnorableConsoleMessage(message))
    .forEach((message) => failures.push({ issue: "Browser console error", message }));

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    base,
    storyCount: stories.length,
    checkedImageCount: results.reduce((sum, result) => sum + result.imageCount, 0),
    results,
    failures,
  };

  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  const report = {
    ok: false,
    generatedAt: new Date().toISOString(),
    base,
    storyCount: 0,
    checkedImageCount: 0,
    results: [],
    failures: [{ issue: error.message || String(error) }],
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
