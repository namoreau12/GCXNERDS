const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const args = process.argv.slice(2);

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const platform = getArg("platform", process.env.GCX_GAME_IMAGE_RENDER_PLATFORM || "ps2");
const baseUrl = getArg("base-url", process.env.GCX_AUDIT_BASE_URL || "http://localhost:3018");
const limit = Number(getArg("limit", process.env.GCX_GAME_IMAGE_RENDER_LIMIT || "25"));
const chromePath = getArg("chrome", "C:/Program Files/Google/Chrome/Application/chrome.exe");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-detail-image-rendering.json");

const dataPath = path.join(rootDir, "data", "games", `${platform}.json`);
if (!fs.existsSync(dataPath)) {
  console.error(`Missing game data file: ${dataPath}`);
  process.exit(1);
}

const games = JSON.parse(fs.readFileSync(dataPath, "utf8"))
  .filter((game) => game && game.id && game.imageUrl)
  .slice(0, limit);

async function inspectGame(page, game) {
  const pageUrl = `${baseUrl}/${platform}-game.html?id=${encodeURIComponent(game.id)}`;
  const errors = [];
  page.removeAllListeners("console");
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForFunction((title) => document.body.innerText.includes(title), game.title, { timeout: 15000 });

  const result = await page.evaluate((expectedUrl) => {
    const normalize = (value) => String(value || "").replace(/^http:\/\//, "https://");
    const expected = normalize(expectedUrl);
    const images = Array.from(document.images).map((img) => ({
      src: normalize(img.currentSrc || img.src),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      alt: img.alt || "",
      complete: img.complete,
    }));
    const matching = images.find((img) => img.src === expected || img.src.includes(expectedUrl));
    const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
    return {
      matchingImage: matching || null,
      hasHorizontalOverflow,
      imageCount: images.length,
    };
  }, game.imageUrl);

  const matchingImage = result.matchingImage;
  const imageLoaded = Boolean(
    matchingImage &&
      matchingImage.complete &&
      matchingImage.naturalWidth > 0 &&
      matchingImage.naturalHeight > 0
  );

  return {
    id: game.id,
    title: game.title,
    pageUrl,
    imageUrl: game.imageUrl,
    ok: imageLoaded && !result.hasHorizontalOverflow && errors.length === 0,
    imageLoaded,
    matchingImage,
    hasHorizontalOverflow: result.hasHorizontalOverflow,
    consoleErrors: errors.slice(0, 5),
  };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const results = [];

  for (const game of games) {
    try {
      results.push(await inspectGame(page, game));
    } catch (error) {
      results.push({
        id: game.id,
        title: game.title,
        pageUrl: `${baseUrl}/${platform}-game.html?id=${encodeURIComponent(game.id)}`,
        imageUrl: game.imageUrl,
        ok: false,
        imageLoaded: false,
        error: error.message,
      });
    }
  }

  await browser.close();

  const report = {
    ok: results.every((result) => result.ok),
    generatedAt: new Date().toISOString(),
    platform,
    baseUrl,
    checked: results.length,
    failures: results.filter((result) => !result.ok),
    samples: results.slice(0, 10),
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
