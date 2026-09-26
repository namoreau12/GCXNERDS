const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "performance-image-basics.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const maxNewsImageBytes = 650 * 1024;
const oversizedSourceThreshold = 1024 * 1024;
const optimizedNewsImages = new Set([
  "assets/news/gamescom-2026-showcase.jpg",
  "assets/news/gta-vi-leak-editorial.jpg",
  "assets/news/horizon-hunters-gathering.jpg",
  "assets/news/next-gen-console-pricing.jpg",
  "assets/news/phantom-blade-zero-preview.jpg",
  "assets/news/pokemon-tcg-30th-celebration.jpg",
]);

const pages = [
  "/",
  "/news.html",
  "/article.html?id=gcx-newsroom-pokemon-tcg-30th-celebration-complete-guide",
  "/games.html",
  "/pokemon.html",
  "/magic.html",
  "/yugioh.html",
  "/community.html",
  "/streamers.html",
  "/sponsors.html",
  "/search.html",
];

function normalizeLocalAsset(assetPath) {
  return assetPath.replace(/^\/+/, "").replace(/\\/g, "/");
}

function listReferencedNewsImages() {
  const files = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(html|js|json)$/i.test(entry.name))
    .map((entry) => path.join(rootDir, entry.name));

  const scriptsDir = path.join(rootDir, "scripts");
  if (fs.existsSync(scriptsDir)) {
    for (const entry of fs.readdirSync(scriptsDir, { withFileTypes: true })) {
      if (entry.isFile() && /\.js$/i.test(entry.name)) files.push(path.join(scriptsDir, entry.name));
    }
  }

  const dataDir = path.join(rootDir, "data");
  if (fs.existsSync(dataDir)) {
    for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
      if (entry.isFile() && /\.json$/i.test(entry.name)) files.push(path.join(dataDir, entry.name));
    }
  }

  const references = new Map();
  const imagePattern = /assets\/news\/[^"')\s<>]+\.(?:png|jpe?g|webp)/gi;
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(imagePattern)) {
      const asset = normalizeLocalAsset(match[0]);
      if (!references.has(asset)) references.set(asset, new Set());
      references.get(asset).add(path.relative(rootDir, file));
    }
  }
  return references;
}

function auditLocalNewsAssets() {
  const references = listReferencedNewsImages();
  const failures = [];
  const assets = [];

  for (const [asset, sourceFiles] of references) {
    const assetPath = path.join(rootDir, asset);
    if (!fs.existsSync(assetPath)) {
      failures.push({ asset, reason: "missing referenced asset", sourceFiles: Array.from(sourceFiles) });
      continue;
    }

    const size = fs.statSync(assetPath).size;
    assets.push({ asset, size, sourceFiles: Array.from(sourceFiles) });

    if (asset.endsWith(".png") && size > oversizedSourceThreshold) {
      failures.push({ asset, size, reason: "large PNG is still referenced", sourceFiles: Array.from(sourceFiles) });
    }
    if (optimizedNewsImages.has(asset) && size > maxNewsImageBytes) {
      failures.push({ asset, size, reason: "optimized news image exceeds budget", maxNewsImageBytes });
    }
  }

  return { assets: assets.sort((a, b) => b.size - a.size), failures };
}

async function auditRenderedImages() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const consoleErrors = [];
  const results = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`${page.url()} :: ${message.text()}`);
  });
  page.on("pageerror", (error) => consoleErrors.push(`${page.url()} :: ${error.message}`));

  try {
    for (const pagePath of pages) {
      const response = await page.goto(`${base}${pagePath}`, { waitUntil: "domcontentloaded", timeout: 25000 });
      await page.waitForTimeout(1200);
      const rendered = await page.evaluate(() => {
        const images = Array.from(document.images);
        return {
          overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1,
          imageCount: images.length,
          brokenImages: images
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => image.currentSrc || image.src || image.getAttribute("src"))
            .slice(0, 8),
          imagesMissingLoading: images
            .filter((image) => !image.hasAttribute("loading"))
            .map((image) => image.currentSrc || image.src || image.getAttribute("src"))
            .slice(0, 8),
          imagesMissingDecoding: images
            .filter((image) => !image.hasAttribute("decoding"))
            .map((image) => image.currentSrc || image.src || image.getAttribute("src"))
            .slice(0, 8),
          imagesMissingDimensions: images
            .filter((image) => !image.hasAttribute("width") || !image.hasAttribute("height"))
            .map((image) => image.currentSrc || image.src || image.getAttribute("src"))
            .slice(0, 8),
        };
      });
      results.push({ path: pagePath, status: response?.status(), ...rendered });
    }
  } finally {
    await browser.close();
  }

  return { pages: results, consoleErrors };
}

async function main() {
  const assetAudit = auditLocalNewsAssets();
  const renderedAudit = await auditRenderedImages();
  const failingPages = renderedAudit.pages.filter(
    (result) =>
      result.status !== 200 ||
      result.overflow ||
      result.brokenImages.length ||
      result.imagesMissingLoading.length ||
      result.imagesMissingDecoding.length ||
      result.imagesMissingDimensions.length
  );

  const result = {
    generatedAt: new Date().toISOString(),
    ok: assetAudit.failures.length === 0 && failingPages.length === 0 && renderedAudit.consoleErrors.length === 0,
    base,
    imageBudgetBytes: maxNewsImageBytes,
    assetCount: assetAudit.assets.length,
    largestAssets: assetAudit.assets.slice(0, 8),
    assetFailures: assetAudit.failures,
    pages: renderedAudit.pages,
    consoleErrors: renderedAudit.consoleErrors,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
