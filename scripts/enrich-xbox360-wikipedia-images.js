const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "xbox360.json");
const manifestPath = path.join(rootDir, "data", "games", "xbox360-manifest.json");

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function titleFromArticleUrl(articleUrl) {
  if (!articleUrl) return "";
  try {
    return decodeURIComponent(new URL(articleUrl).pathname.replace(/^\/wiki\//, ""));
  } catch (error) {
    return "";
  }
}

async function fetchSummaryImage(game) {
  const title = titleFromArticleUrl(game.articleUrl);
  if (!title || game.imageUrl) return null;
  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
    headers: { Accept: "application/json", "User-Agent": "GamesCardsExchange/0.1 (local Xbox 360 image enrichment)" },
  });
  if (!response.ok) return null;
  const summary = await response.json();
  const imageUrl = summary.thumbnail?.source || summary.originalimage?.source || "";
  if (!imageUrl) return null;
  return {
    imageUrl,
    imageSourceUrl: summary.content_urls?.desktop?.page || game.articleUrl,
    imageProvider: "Wikipedia page summary",
  };
}

async function mapLimit(items, limit, mapper) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function main() {
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Run scripts/import-xbox360-official-list.js before enriching images.");
  const candidates = games.filter((game) => game.articleUrl && !game.imageUrl);
  let matched = 0;
  await mapLimit(candidates, 8, async (game) => {
    const image = await fetchSummaryImage(game);
    if (!image) return;
    game.imageUrl = image.imageUrl;
    game.imageSourceUrl = image.imageSourceUrl;
    game.imageProvider = image.imageProvider;
    matched += 1;
  });
  const imageCount = games.filter((game) => game.imageUrl).length;
  writeJson(dataPath, games);
  writeJson(manifestPath, {
    ...manifest,
    wikipediaImageEnrichedAt: new Date().toISOString(),
    wikipediaImageCandidates: candidates.length,
    wikipediaImageMatchCount: matched,
    imageCount,
    missingImageCount: games.length - imageCount,
  });
  console.log(`Wikipedia summary images available for ${imageCount}/${games.length} Xbox 360 records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
