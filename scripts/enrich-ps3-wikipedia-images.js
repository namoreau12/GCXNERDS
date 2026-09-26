const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const ps3Path = path.join(rootDir, "data", "games", "ps3.json");
const manifestPath = path.join(rootDir, "data", "games", "ps3-manifest.json");

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function titleFromUrl(url) {
  const match = String(url || "").match(/\/wiki\/([^#?]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPageImages(titles) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail|original&pithumbsize=500&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles.join("|"))}`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "GamesCardsExchange/0.1 (local PS3 image enrichment; contact: local-dev)",
      },
    });
    if (response.ok) {
      const result = await response.json();
      return Object.values(result.query?.pages || {});
    }
    if (response.status !== 429 && response.status < 500) throw new Error(`Wikipedia returned ${response.status}`);
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    await sleep((retryAfter ? retryAfter * 1000 : 1500 * (attempt + 1)) + 250);
  }
  throw new Error("Wikipedia image request kept getting rate-limited.");
}

async function main() {
  const games = readJsonIfExists(ps3Path, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Run scripts/import-ps3-official-list.js before enriching images.");

  const candidates = games
    .filter((game) => !game.imageUrl)
    .map((game) => ({ game, title: titleFromUrl(game.articleUrl) }))
    .filter((item) => item.title);

  let matched = 0;
  let processed = 0;
  const byTitle = new Map(candidates.map((item) => [item.title.replace(/_/g, " "), item.game]));
  for (const group of chunk(candidates.map((item) => item.title), 40)) {
    const pages = await fetchPageImages(group);
    pages.forEach((page) => {
      const game = byTitle.get(page.title);
      const imageUrl = page.thumbnail?.source || page.original?.source || "";
      if (!game || !imageUrl) return;
      game.imageUrl = imageUrl;
      game.imageSourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
      game.imageProvider = "Wikipedia page image";
      matched += 1;
    });
    processed += group.length;
    if (processed % 400 === 0) console.log(`Checked ${processed}/${candidates.length} PS3 article images...`);
    await sleep(650);
  }

  const imageCount = games.filter((game) => game.imageUrl).length;
  writeJson(ps3Path, games);
  writeJson(manifestPath, {
    ...manifest,
    wikipediaImageEnrichedAt: new Date().toISOString(),
    wikipediaImageCandidateCount: candidates.length,
    wikipediaImageMatchCount: matched,
    imageCount,
    missingImageCount: games.length - imageCount,
  });

  console.log(`Wikipedia page images matched ${matched} PS3 records.`);
  console.log(`Images available for ${imageCount}/${games.length} PS3 records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
