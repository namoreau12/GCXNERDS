const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const ps5Path = path.join(rootDir, "data", "games", "ps5.json");
const manifestPath = path.join(rootDir, "data", "games", "ps5-manifest.json");

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

async function fetchPageImages(titles, attempt = 1) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail|original&pithumbsize=500&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles.join("|"))}`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local PS5 image enrichment)",
    },
  });
  if (response.status === 429 && attempt < 4) {
    await sleep(2500 * attempt);
    return fetchPageImages(titles, attempt + 1);
  }
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
  const result = await response.json();
  return Object.values(result.query?.pages || {});
}

async function main() {
  const games = readJsonIfExists(ps5Path, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Run scripts/import-ps5-official-list.js before enriching images.");

  const candidates = games
    .filter((game) => !game.imageUrl)
    .map((game) => ({ game, title: titleFromUrl(game.articleUrl) }))
    .filter((item) => item.title);

  let matched = 0;
  let processed = 0;
  const byTitle = new Map(candidates.map((item) => [item.title.replace(/_/g, " "), item.game]));
  for (const group of chunk(candidates.map((item) => item.title), 20)) {
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
    if (processed % 200 === 0) console.log(`Checked ${processed}/${candidates.length} PS5 article images...`);
    await sleep(350);
  }

  const imageCount = games.filter((game) => game.imageUrl).length;
  writeJson(ps5Path, games);
  writeJson(manifestPath, {
    ...manifest,
    wikipediaImageEnrichedAt: new Date().toISOString(),
    wikipediaImageCandidateCount: candidates.length,
    wikipediaImageMatchCount: matched,
    imageCount,
    missingImageCount: games.length - imageCount,
  });

  console.log(`Wikipedia page images matched ${matched} PS5 records.`);
  console.log(`Images available for ${imageCount}/${games.length} PS5 records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
