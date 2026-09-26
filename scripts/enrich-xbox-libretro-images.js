const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "xbox.json");
const manifestPath = path.join(rootDir, "data", "games", "xbox-manifest.json");
const libretroIndexPath = path.join(rootDir, "data", "games", "xbox-libretro-boxarts.json");

const repoOwner = "libretro-thumbnails";
const repoName = "Microsoft_-_Xbox";
const branch = "master";
const rawBaseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/`;
const htmlBaseUrl = `https://github.com/${repoOwner}/${repoName}/blob/${branch}/`;

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function normalizeTitle(value) {
  let normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(xbox|360|xbla|live arcade|microsoft)\b/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\band\b/g, "&")
    .replace(/[^a-z0-9&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const commaArticle = normalized.match(/^(.+), (the|a|an)$/);
  if (commaArticle) normalized = `${commaArticle[2]} ${commaArticle[1]}`.replace(/\bthe\b|\ba\b|\ban\b/g, "").trim();
  return normalized;
}

function romanNumberVariant(value) {
  return value
    .replace(/\b2\b/g, "ii").replace(/\b3\b/g, "iii").replace(/\b4\b/g, "iv").replace(/\b5\b/g, "v")
    .replace(/\b6\b/g, "vi").replace(/\b7\b/g, "vii").replace(/\b8\b/g, "viii").replace(/\b9\b/g, "ix")
    .replace(/\bii\b/g, "2").replace(/\biii\b/g, "3").replace(/\biv\b/g, "4").replace(/\bv\b/g, "5")
    .replace(/\bvi\b/g, "6").replace(/\bvii\b/g, "7").replace(/\bviii\b/g, "8").replace(/\bix\b/g, "9");
}

function titleKeys(value) {
  const normalized = normalizeTitle(value);
  const romanVariant = romanNumberVariant(normalized);
  return Array.from(new Set([
    normalized,
    normalized.replace(/[\s&]+/g, ""),
    normalizeTitle(String(value || "").split(":")[0]),
    normalizeTitle(String(value || "").split(" - ")[0]),
    romanVariant,
    romanVariant.replace(/[\s&]+/g, ""),
  ].filter(Boolean)));
}

function strictTitleKeys(value) {
  const normalized = normalizeTitle(value);
  const romanVariant = romanNumberVariant(normalized);
  return Array.from(new Set([normalized, normalized.replace(/[\s&]+/g, ""), romanVariant, romanVariant.replace(/[\s&]+/g, "")].filter(Boolean)));
}

function titleTokens(value) {
  return [normalizeTitle(value), romanNumberVariant(normalizeTitle(value))]
    .flatMap((key) => key.split(/\s+/))
    .filter((token) => token.length > 2)
    .filter((token) => !["edition", "version", "game"].includes(token));
}

function regionScore(fileName, game) {
  const value = fileName.toLowerCase();
  if (game.releasedRegions?.includes("northAmerica") && /\((usa|usa, europe|world)\)/i.test(value)) return 55;
  if (game.releasedRegions?.includes("europe") && /\((europe|usa, europe|world)\)/i.test(value)) return 40;
  if (game.releasedRegions?.includes("japan") && /\((japan|world)\)/i.test(value)) return 30;
  if (/\((usa|usa, europe|world)\)/i.test(value)) return 25;
  if (/\((europe)\)/i.test(value)) return 20;
  if (/\((japan)\)/i.test(value)) return 15;
  return 0;
}

function variantPenalty(fileName) {
  const value = fileName.toLowerCase();
  let penalty = 0;
  if (value.includes("(sample)") || value.includes("(proto)") || value.includes("(prototype)")) penalty += 90;
  if (value.includes("(beta)") || value.includes("(demo)") || value.includes("(kiosk)") || value.includes("(unl)")) penalty += 90;
  if (value.includes("(rev ") || value.includes("(revision")) penalty += 10;
  return penalty;
}

function sourceUrlFromPath(filePath, baseUrl) {
  return `${baseUrl}${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

async function fetchLibretroIndex() {
  const rootResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "GamesCardsExchange/0.1 (local Original Xbox box art enrichment)" },
  });
  if (!rootResponse.ok) throw new Error(`GitHub returned ${rootResponse.status}`);
  const root = await rootResponse.json();
  const boxArtFolder = (root.tree || []).find((entry) => entry.type === "tree" && entry.path === "Named_Boxarts");
  if (!boxArtFolder?.sha) throw new Error("Could not find Libretro Original Xbox Named_Boxarts folder.");
  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${boxArtFolder.sha}?recursive=1`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "GamesCardsExchange/0.1 (local Original Xbox box art enrichment)" },
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  const result = await response.json();
  return (result.tree || [])
    .filter((entry) => entry.type === "blob")
    .filter((entry) => /\.(png|jpg|jpeg|webp)$/i.test(entry.path))
    .map((entry) => {
      const fileName = path.basename(entry.path);
      const filePath = `Named_Boxarts/${entry.path}`;
      return {
        fileName,
        path: filePath,
        tokens: Array.from(new Set(titleTokens(fileName))),
        rawUrl: sourceUrlFromPath(filePath, rawBaseUrl),
        sourceUrl: sourceUrlFromPath(filePath, htmlBaseUrl),
      };
    });
}

function buildIndex(files) {
  return files.reduce((index, file) => {
    strictTitleKeys(file.fileName).forEach((key) => {
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(file);
    });
    return index;
  }, new Map());
}

function findFuzzyMatch(game, files) {
  const gameTokens = Array.from(new Set(titleTokens(game.title)));
  if (gameTokens.length < 2) return null;
  const scored = files
    .map((file) => {
      const overlap = gameTokens.filter((token) => file.tokens.includes(token)).length;
      const coverage = overlap / gameTokens.length;
      const extraTokens = Math.max(0, file.tokens.length - overlap);
      return { file, overlap, coverage, score: overlap * 12 + regionScore(file.fileName, game) - variantPenalty(file.fileName) - extraTokens };
    })
    .filter((candidate) => candidate.overlap >= 2)
    .filter((candidate) => candidate.coverage >= 0.75 || (gameTokens.length >= 4 && candidate.overlap >= 3))
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage);
  return scored[0]?.score >= 15 ? scored[0].file : null;
}

function findBestMatch(game, index, files) {
  const candidates = [game.title, ...(game.aliases || [])].flatMap(titleKeys).flatMap((key) => index.get(key) || []);
  if (!candidates.length) return findFuzzyMatch(game, files);
  return candidates
    .map((file) => ({ file, score: regionScore(file.fileName, game) - variantPenalty(file.fileName) }))
    .sort((a, b) => b.score - a.score || a.file.fileName.localeCompare(b.file.fileName))[0].file;
}

async function main() {
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Run scripts/import-xbox-official-list.js before enriching images.");
  const files = await fetchLibretroIndex();
  const index = buildIndex(files);
  let matched = 0;
  games.forEach((game) => {
    const match = findBestMatch(game, index, files);
    if (!match) return;
    game.imageUrl = match.rawUrl;
    game.imageSourceUrl = match.sourceUrl;
    game.imageProvider = "libretro-thumbnails";
    matched += 1;
  });
  const imageCount = games.filter((game) => game.imageUrl).length;
  writeJson(libretroIndexPath, {
    indexedAt: new Date().toISOString(),
    source: "libretro-thumbnails Microsoft Original Xbox Named_Boxarts",
    sourceUrl: `https://github.com/${repoOwner}/${repoName}/tree/${branch}/Named_Boxarts`,
    fileCount: files.length,
  });
  writeJson(dataPath, games);
  writeJson(manifestPath, {
    ...manifest,
    libretroImageEnrichedAt: new Date().toISOString(),
    libretroBoxArtFileCount: files.length,
    libretroImageMatchCount: matched,
    imageCount,
    missingImageCount: games.length - imageCount,
  });
  console.log(`Indexed ${files.length} Libretro Original Xbox box-art files.`);
  console.log(`Images available for ${imageCount}/${games.length} Original Xbox records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
