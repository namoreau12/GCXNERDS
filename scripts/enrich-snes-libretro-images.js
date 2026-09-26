const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const snesPath = path.join(rootDir, "data", "games", "snes.json");
const manifestPath = path.join(rootDir, "data", "games", "snes-manifest.json");
const libretroIndexPath = path.join(rootDir, "data", "games", "snes-libretro-boxarts.json");

const repoOwner = "libretro-thumbnails";
const repoName = "Nintendo_-_Super_Nintendo_Entertainment_System";
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

function stripDiacritics(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeTitle(value) {
  let normalized = stripDiacritics(String(value || "").toLowerCase());

  normalized = normalized
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(super nintendo|snes|super famicom)\b/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\band\b/g, "&")
    .replace(/[^a-z0-9&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const commaArticle = normalized.match(/^(.+), (the|a|an)$/);
  if (commaArticle) {
    normalized = `${commaArticle[2]} ${commaArticle[1]}`.replace(/\bthe\b|\ba\b|\ban\b/g, "").trim();
  }

  return normalized;
}

function romanNumberVariant(value) {
  return value
    .replace(/\b2\b/g, "ii")
    .replace(/\b3\b/g, "iii")
    .replace(/\b4\b/g, "iv")
    .replace(/\b5\b/g, "v")
    .replace(/\b6\b/g, "vi")
    .replace(/\b7\b/g, "vii")
    .replace(/\b8\b/g, "viii")
    .replace(/\b9\b/g, "ix")
    .replace(/\bii\b/g, "2")
    .replace(/\biii\b/g, "3")
    .replace(/\biv\b/g, "4")
    .replace(/\bv\b/g, "5")
    .replace(/\bvi\b/g, "6")
    .replace(/\bvii\b/g, "7")
    .replace(/\bviii\b/g, "8")
    .replace(/\bix\b/g, "9");
}

function titleKeys(value) {
  const normalized = normalizeTitle(value);
  const compact = normalized.replace(/[\s&]+/g, "");
  const colonBase = normalizeTitle(String(value || "").split(":")[0]);
  const dashBase = normalizeTitle(String(value || "").split(" - ")[0]);
  const romajiSimple = normalized
    .replace(/ou/g, "o")
    .replace(/oo/g, "o")
    .replace(/uu/g, "u")
    .replace(/aa/g, "a")
    .replace(/ii/g, "i")
    .replace(/ee/g, "e");
  const romanVariant = romanNumberVariant(normalized);

  return Array.from(new Set([
    normalized,
    compact,
    colonBase,
    dashBase,
    romajiSimple,
    romajiSimple.replace(/[\s&]+/g, ""),
    romanVariant,
    romanVariant.replace(/[\s&]+/g, ""),
  ].filter(Boolean)));
}

function regionScore(fileName, game) {
  const value = fileName.toLowerCase();

  if (game.releasedRegions?.includes("northAmerica") && /\((usa|usa, europe|world)\)/i.test(value)) return 50;
  if (game.releasedRegions?.includes("pal") && /\((europe|usa, europe|world)\)/i.test(value)) return 40;
  if (game.releasedRegions?.includes("japan") && /\((japan|world)\)/i.test(value)) return 30;
  if (/\((usa|usa, europe|world)\)/i.test(value)) return 25;
  if (/\((europe)\)/i.test(value)) return 20;
  if (/\((japan)\)/i.test(value)) return 15;

  return 0;
}

function variantPenalty(fileName) {
  const value = fileName.toLowerCase();
  let penalty = 0;

  if (value.includes("(sample)") || value.includes("(proto)") || value.includes("(prototype)")) penalty += 80;
  if (value.includes("(beta)") || value.includes("(demo)")) penalty += 80;
  if (value.includes("(switch online)") || value.includes("(virtual console)")) penalty += 60;
  if (value.includes("(rev ") || value.includes("(revision")) penalty += 10;

  return penalty;
}

function sourceUrlFromPath(filePath, baseUrl) {
  return `${baseUrl}${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

function titleTokens(value) {
  const normalized = normalizeTitle(value);
  const romajiSimple = normalized
    .replace(/ou/g, "o")
    .replace(/oo/g, "o")
    .replace(/uu/g, "u")
    .replace(/aa/g, "a")
    .replace(/ii/g, "i")
    .replace(/ee/g, "e");
  const romanVariant = romanNumberVariant(normalized);

  return [normalized, romajiSimple, romanVariant]
    .flatMap((key) => key.split(/\s+/))
    .filter((token) => token.length > 2)
    .filter((token) => !["vol", "volume", "part"].includes(token));
}

async function fetchLibretroIndex() {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}?recursive=1`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "GamesCardsExchange/0.1 (local SNES box art enrichment)",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}`);
  }

  const result = await response.json();

  return (result.tree || [])
    .filter((entry) => entry.type === "blob")
    .filter((entry) => entry.path.startsWith("Named_Boxarts/"))
    .filter((entry) => /\.(png|jpg|jpeg|webp)$/i.test(entry.path))
    .map((entry) => {
      const fileName = path.basename(entry.path);
      return {
        fileName,
        path: entry.path,
        normalizedTitle: normalizeTitle(fileName),
        tokens: Array.from(new Set(titleTokens(fileName))),
        rawUrl: sourceUrlFromPath(entry.path, rawBaseUrl),
        sourceUrl: sourceUrlFromPath(entry.path, htmlBaseUrl),
      };
    });
}

function buildIndex(files) {
  return files.reduce((index, file) => {
    titleKeys(file.fileName).forEach((key) => {
      if (!index[key]) index[key] = [];
      index[key].push(file);
    });
    return index;
  }, {});
}

function findFuzzyMatch(game, files) {
  const gameTokens = Array.from(new Set(titleTokens(game.title)));
  if (gameTokens.length < 2) return null;

  const scored = files
    .map((file) => {
      const overlap = gameTokens.filter((token) => file.tokens.includes(token)).length;
      const coverage = overlap / gameTokens.length;
      const extraTokens = Math.max(0, file.tokens.length - overlap);

      return {
        file,
        overlap,
        coverage,
        score: overlap * 12 + regionScore(file.fileName, game) - variantPenalty(file.fileName) - extraTokens,
      };
    })
    .filter((candidate) => candidate.overlap >= 2)
    .filter((candidate) => (
      candidate.coverage >= 0.74 ||
      (gameTokens.length >= 5 && candidate.coverage >= 0.66) ||
      (gameTokens.length >= 4 && candidate.overlap >= 3 && candidate.coverage >= 0.5)
    ))
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage);

  if (!scored.length) return null;

  const best = scored[0];
  if (best.score < 15) return null;

  return best.file;
}

function findBestMatch(game, index, files) {
  const candidateTitles = [game.title, ...(game.aliases || [])].flatMap(titleKeys).filter(Boolean);
  const candidates = candidateTitles.flatMap((title) => index[title] || []);

  if (!candidates.length) return findFuzzyMatch(game, files);

  return candidates
    .map((file) => ({
      file,
      score: regionScore(file.fileName, game) - variantPenalty(file.fileName),
    }))
    .sort((a, b) => b.score - a.score || a.file.fileName.localeCompare(b.file.fileName))[0].file;
}

async function main() {
  const games = readJsonIfExists(snesPath, null);
  const manifest = readJsonIfExists(manifestPath, {});

  if (!Array.isArray(games)) {
    throw new Error("Run scripts/import-snes-official-list.js before enriching images.");
  }

  const files = await fetchLibretroIndex();
  const index = buildIndex(files);
  let matched = 0;

  games.forEach((game) => {
    if (game.imageUrl) return;

    const match = findBestMatch(game, index, files);
    if (!match) return;

    game.imageUrl = match.rawUrl;
    game.imageSourceUrl = match.sourceUrl;
    game.imageProvider = "libretro-thumbnails";
    matched += 1;
  });

  const imageCount = games.filter((game) => game.imageUrl).length;
  const libretroImageCount = games.filter((game) => game.imageProvider === "libretro-thumbnails").length;

  writeJson(libretroIndexPath, {
    indexedAt: new Date().toISOString(),
    source: "libretro-thumbnails Nintendo - Super Nintendo Entertainment System Named_Boxarts",
    sourceUrl: `https://github.com/${repoOwner}/${repoName}/tree/${branch}/Named_Boxarts`,
    fileCount: files.length,
  });
  writeJson(snesPath, games);
  writeJson(manifestPath, {
    ...manifest,
    libretroImageEnrichedAt: new Date().toISOString(),
    libretroBoxArtFileCount: files.length,
    libretroImageMatchCount: matched,
    libretroImageCount,
    imageCount,
    missingImageCount: games.length - imageCount,
  });

  console.log(`Indexed ${files.length} Libretro SNES box-art files.`);
  console.log(`Matched ${matched} additional SNES records.`);
  console.log(`Images available for ${imageCount}/${games.length} SNES records.`);
  console.log(`Records still missing images: ${games.length - imageCount}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
