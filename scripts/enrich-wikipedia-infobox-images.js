const fs = require("node:fs");
const path = require("node:path");

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/enrich-wikipedia-infobox-images.js <library-slug> [--article-only] [--dry-run]");
  process.exit(1);
}

const flags = new Set(process.argv.slice(3));
const articleOnly = flags.has("--article-only");
const dryRun = flags.has("--dry-run");
const strictTitle = flags.has("--strict-title");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const batchSizeArg = process.argv.find((arg) => arg.startsWith("--batch-size="));
const delayArg = process.argv.find((arg) => arg.startsWith("--delay-ms="));
const limit = Number(limitArg?.split("=")[1] || 0);
const batchSize = Number(batchSizeArg?.split("=")[1] || 20);
const delayMs = Number(delayArg?.split("=")[1] || 700);

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", `${slug}.json`);
const manifestPath = path.join(rootDir, "data", "games", `${slug}-manifest.json`);

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

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleLooksExact(gameTitle, pageTitle) {
  const game = normalizeTitle(gameTitle);
  const page = normalizeTitle(pageTitle);
  if (!game || !page) return false;
  if (page === game) return true;
  if (!page.startsWith(`${game} `)) return false;
  const suffix = page.slice(game.length).trim();
  return /^(video game|game|arcade game|console game)$/.test(suffix);
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
  const file = cleanWikiValue(value)
    .replace(/^\[\[(?:File|Image):/i, "")
    .replace(/^\s*(?:File|Image):/i, "")
    .split("|")[0]
    .replace(/\]\]$/g, "")
    .trim();
  if (!/\.(png|jpe?g|webp)$/i.test(file)) return "";
  return `File:${file.replace(/ /g, "_")}`;
}

function acceptedCoverImageTitle(fileTitle) {
  const value = String(fileTitle || "");
  if (/(logo|banner|screenshot|gameplay|screen|photo|flyer|arcadeflyer|arcadegame|promo|promotion|tokuten)|\.svg$/i.test(value)) return false;
  return /(^|[_\-/\s])(cover|box|boxart|front|packshot|package)([_\-/\s.]|$)/i.test(value);
}

function acceptableInfoboxImageTitle(fileTitle) {
  const value = String(fileTitle || "");
  return Boolean(value && !/(logo|banner|screenshot|gameplay|screen|photo|flyer|arcadeflyer|arcadegame|promo|promotion|tokuten)|\.svg$/i.test(value));
}

const platformConflictTerms = {
  "3ds": ["ps2", "ps3", "ps4", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  dreamcast: ["saturn", "genesis", "ps2", "ps3", "ps4", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  ds: ["3ds", "psp", "vita", "ps2", "ps3", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  gameboy: ["gba", "3ds", "ds", "psp", "vita", "ps2", "ps3", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  gamecube: ["ps2", "ps3", "ps4", "psp", "vita", "xbox", "xbox 360", "wii", "switch"],
  gba: ["gamecube", "3ds", "ds", "psp", "vita", "ps2", "ps3", "xbox", "xbox 360", "wii", "switch"],
  genesis: ["saturn", "dreamcast", "ps2", "ps3", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  n64: ["gamecube", "wii", "switch", "ps2", "ps3", "psp", "vita", "xbox", "xbox 360"],
  nes: ["snes", "n64", "gameboy", "gamecube", "wii", "switch", "playstation", "ps2", "ps3", "psp", "vita", "xbox", "xbox 360"],
  ps1: ["ps2", "ps3", "ps4", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  ps2: ["ps3", "ps4", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  ps3: ["ps2", "ps4", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  ps4: ["ps2", "ps3", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  ps5: ["ps2", "ps3", "ps4", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  psp: ["ps2", "ps3", "ps4", "ps5", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  saturn: ["genesis", "dreamcast", "ps2", "ps3", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  snes: ["nes", "n64", "gameboy", "gamecube", "wii", "switch", "playstation", "ps2", "ps3", "psp", "vita", "xbox", "xbox 360"],
  switch: ["ps2", "ps3", "ps4", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii"],
  vita: ["ps2", "ps3", "ps4", "ps5", "psp", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  wii: ["wiiu", "wii u", "gamecube", "switch", "ps2", "ps3", "ps4", "psp", "vita", "xbox", "xbox 360"],
  xbox: ["xbox 360", "ps2", "ps3", "ps4", "psp", "vita", "gamecube", "wii", "switch"],
  xbox360: ["ps2", "ps3", "ps4", "ps5", "psp", "vita", "gamecube", "wii", "switch"],
};
const nonConsoleCoverTerms = ["zx spectrum", "spectrum", "amiga", "commodore", "c64", "ms dos", "dos", "windows pc", "pc cover"];

function compactImageText(value) {
  return decodeURIComponent(String(value || ""))
    .toLowerCase()
    .replace(/[_\-+.]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPlatformConflict(game, fileTitle, imageUrl) {
  const terms = platformConflictTerms[slug] || [];
  const haystack = compactImageText([fileTitle, imageUrl, game.imageMatchedTitle].join(" "));
  return [...terms, ...nonConsoleCoverTerms].some((term) => {
    const compactTerm = compactImageText(term);
    return compactTerm && new RegExp(`(^| )${compactTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`, "i").test(haystack);
  });
}

function extractInfoboxImage(wikitext, { allowGenericInfoboxImage = false } = {}) {
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
    if (title && acceptedCoverImageTitle(title)) return title;
    if (title && allowGenericInfoboxImage && acceptableInfoboxImageTitle(title)) return title;
  }

  const fileMatch = text.match(/\[\[(?:File|Image):([^\]|]+\.(?:png|jpe?g|webp))/i);
  const fallbackTitle = fileMatch ? normalizeFileTitle(fileMatch[1]) : "";
  return fallbackTitle && acceptedCoverImageTitle(fallbackTitle) ? fallbackTitle : "";
}

async function fetchJson(apiUrl, label) {
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": `GamesCardsExchange/0.1 (local ${slug} infobox image enrichment)`,
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
  if (!Array.isArray(games)) throw new Error(`Missing data/games/${slug}.json.`);

  const candidates = games
    .filter((game) => !game.imageUrl)
    .map((game) => ({ game, title: titleFromUrl(articleOnly ? game.articleUrl : game.articleUrl || game.sourceUrl) }))
    .filter((item) => item.title)
    .slice(0, limit || undefined);

  let matched = 0;
  let processed = 0;
  const samples = [];
  const gameByArticleTitle = new Map();
  const assignedImages = new Map();
  candidates.forEach((item) => {
    gameByArticleTitle.set(item.title, item.game);
    gameByArticleTitle.set(normalizeTitle(item.title), item.game);
  });

  for (const group of chunk(candidates.map((item) => item.title), batchSize)) {
    const pages = await fetchWikiTextPages(group);
    const pageMatches = [];
    pages.forEach((page) => {
      const game = gameByArticleTitle.get(page.title) || gameByArticleTitle.get(normalizeTitle(page.title));
      if (strictTitle && game && !titleLooksExact(game.title, page.title)) return;
      const content = page.revisions?.[0]?.slots?.main?.["*"];
      const fileTitle = extractInfoboxImage(content, { allowGenericInfoboxImage: strictTitle });
      if (game && fileTitle) pageMatches.push({ game, pageTitle: page.title, fileTitle });
    });

    const infoByTitle = await fetchImageInfo(Array.from(new Set(pageMatches.map((item) => item.fileTitle))));
    pageMatches.forEach(({ game, pageTitle, fileTitle }) => {
      const imageUrl = infoByTitle.get(fileTitle);
      if (!imageUrl || game.imageUrl || assignedImages.has(game.id)) return;
      if (!acceptedCoverImageTitle(fileTitle) && /upload\.wikimedia\.org\/wikipedia\/commons\//i.test(imageUrl)) return;
      if (hasPlatformConflict(game, fileTitle, imageUrl)) return;
      const assignment = {
        imageUrl,
        imageSourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`,
        imageProvider: "Wikipedia infobox image",
        imageMatchedTitle: pageTitle,
        healthUpdatedAt: new Date().toISOString(),
      };
      assignedImages.set(game.id, assignment);
      if (!dryRun) Object.assign(game, assignment);
      matched += 1;
      if (samples.length < 10) samples.push({ title: game.title, pageTitle, imageUrl });
    });

    processed += group.length;
    if (processed % 200 === 0) console.log(`Checked ${processed}/${candidates.length} ${slug} infobox images...`);
    await sleep(delayMs);
  }

  const imageCount = games.filter((game) => game.imageUrl).length + (dryRun ? assignedImages.size : 0);
  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      wikipediaInfoboxImageEnrichedAt: new Date().toISOString(),
      wikipediaInfoboxImageCandidateCount: candidates.length,
      wikipediaInfoboxImageMatchCount: matched,
      imageCount,
      missingImageCount: games.length - imageCount,
    });
  }

  if (samples.length) console.table(samples);
  if (dryRun) console.log("Dry run only; no files were changed.");
  if (articleOnly) console.log("Article-only mode used; sourceUrl-only records were skipped.");
  if (strictTitle) console.log("Strict title mode used; broad series/franchise pages were skipped.");
  console.log(`Wikipedia infobox images matched ${matched} ${slug} records.`);
  console.log(`Images available for ${imageCount}/${games.length} ${slug} records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
