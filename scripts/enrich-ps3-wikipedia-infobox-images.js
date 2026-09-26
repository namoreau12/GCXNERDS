const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ps3.json");
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
  return match ? decodeURIComponent(match[1]).replace(/_/g, " ") : "";
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanWikiValue(value) {
  return String(value || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .trim();
}

function normalizeFileTitle(value) {
  let file = cleanWikiValue(value)
    .replace(/^\[\[(?:File|Image):/i, "")
    .replace(/^\s*(?:File|Image):/i, "")
    .split("|")[0]
    .replace(/\]\]$/g, "")
    .trim();
  if (!/\.(png|jpe?g|webp)$/i.test(file)) return "";
  return `File:${file.replace(/ /g, "_")}`;
}

function extractInfoboxImage(wikitext) {
  const text = String(wikitext || "");
  const fieldPatterns = [
    /^\|\s*image\s*=\s*(.+)$/im,
    /^\|\s*cover\s*=\s*(.+)$/im,
    /^\|\s*boxart\s*=\s*(.+)$/im,
    /^\|\s*image_name\s*=\s*(.+)$/im,
  ];

  for (const pattern of fieldPatterns) {
    const match = text.match(pattern);
    const title = normalizeFileTitle(match?.[1] || "");
    if (title) return title;
  }

  const fileMatch = text.match(/\[\[(?:File|Image):([^\]|]+\.(?:png|jpe?g|webp))/i);
  return fileMatch ? normalizeFileTitle(fileMatch[1]) : "";
}

async function fetchJson(apiUrl, label) {
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "GamesCardsExchange/0.1 (local PS3 infobox image enrichment)",
      },
    });
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) throw new Error(`${label} returned ${response.status}`);
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    await sleep((retryAfter ? retryAfter * 1000 : 2500 * (attempt + 1)) + 250);
  }
  throw new Error(`${label} kept getting rate-limited.`);
}

async function fetchWikiTextPages(titles) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles.join("|"))}`;
  const result = await fetchJson(apiUrl, "Wikipedia revisions API");
  return Object.values(result.query?.pages || {});
}

async function fetchImageInfo(fileTitles) {
  if (!fileTitles.length) return new Map();
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json&origin=*&titles=${encodeURIComponent(fileTitles.join("|"))}`;
  const result = await fetchJson(apiUrl, "Wikipedia imageinfo API");
  const images = new Map();
  Object.values(result.query?.pages || {}).forEach((page) => {
    const info = page.imageinfo?.[0];
    const url = info?.thumburl || info?.url || "";
    if (page.title && url) {
      images.set(page.title, url);
      images.set(page.title.replace(/ /g, "_"), url);
    }
  });
  return images;
}

async function main() {
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Run scripts/import-ps3-official-list.js before enriching images.");

  const candidates = games
    .filter((game) => !game.imageUrl)
    .map((game) => ({ game, title: titleFromUrl(game.articleUrl) }))
    .filter((item) => item.title);

  let matched = 0;
  let processed = 0;
  const gameByArticleTitle = new Map(candidates.map((item) => [item.title, item.game]));

  for (const group of chunk(candidates.map((item) => item.title), 20)) {
    const pages = await fetchWikiTextPages(group);
    const pageMatches = [];
    pages.forEach((page) => {
      const game = gameByArticleTitle.get(page.title);
      const content = page.revisions?.[0]?.slots?.main?.["*"];
      const fileTitle = extractInfoboxImage(content);
      if (game && fileTitle) pageMatches.push({ game, pageTitle: page.title, fileTitle });
    });

    const infoByTitle = await fetchImageInfo(Array.from(new Set(pageMatches.map((item) => item.fileTitle))));
    pageMatches.forEach(({ game, pageTitle, fileTitle }) => {
      const imageUrl = infoByTitle.get(fileTitle);
      if (!imageUrl || game.imageUrl) return;
      game.imageUrl = imageUrl;
      game.imageSourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`;
      game.imageProvider = "Wikipedia infobox image";
      game.imageMatchedTitle = pageTitle;
      game.healthUpdatedAt = new Date().toISOString();
      matched += 1;
    });

    processed += group.length;
    if (processed % 200 === 0) console.log(`Checked ${processed}/${candidates.length} PS3 infobox images...`);
    await sleep(700);
  }

  const imageCount = games.filter((game) => game.imageUrl).length;
  writeJson(dataPath, games);
  writeJson(manifestPath, {
    ...manifest,
    wikipediaInfoboxImageEnrichedAt: new Date().toISOString(),
    wikipediaInfoboxImageCandidateCount: candidates.length,
    wikipediaInfoboxImageMatchCount: matched,
    imageCount,
    missingImageCount: games.length - imageCount,
  });

  console.log(`Wikipedia infobox images matched ${matched} PS3 records.`);
  console.log(`Images available for ${imageCount}/${games.length} PS3 records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
