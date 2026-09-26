const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "gameboy.json");
const manifestPath = path.join(rootDir, "data", "games", "gameboy-manifest.json");
const libretroIndexPath = path.join(rootDir, "data", "games", "gameboy-libretro-boxarts.json");
const repos = {
  gb: "Nintendo_-_Game_Boy",
  gbc: "Nintendo_-_Game_Boy_Color",
};
const branch = "master";

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
    .replace(/\b(game boy color|game boy|gbc|gb)\b/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\band\b/g, "&")
    .replace(/[^a-z0-9&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const commaArticle = normalized.match(/^(.+), (the|a|an)$/);
  if (commaArticle) normalized = `${commaArticle[2]} ${commaArticle[1]}`.replace(/\bthe\b|\ba\b|\ban\b/g, "").trim();
  return normalized;
}

function titleKeys(value) {
  const normalized = normalizeTitle(value);
  return Array.from(new Set([
    normalized,
    normalized.replace(/[\s&]+/g, ""),
    normalizeTitle(String(value || "").split(":")[0]),
    normalizeTitle(String(value || "").split(" - ")[0]),
  ].filter(Boolean)));
}

function strictTitleKeys(value) {
  const normalized = normalizeTitle(value);
  return Array.from(new Set([normalized, normalized.replace(/[\s&]+/g, "")].filter(Boolean)));
}

function titleTokens(value) {
  return normalizeTitle(value).split(/\s+/).filter((token) => token.length > 2).filter((token) => !["version"].includes(token));
}

function regionScore(fileName, game) {
  const value = fileName.toLowerCase();
  if (game.releasedRegions?.includes("northAmerica") && /\((usa|usa, europe|world)\)/i.test(value)) return 55;
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
  if (value.includes("(sample)") || value.includes("(proto)") || value.includes("(prototype)")) penalty += 90;
  if (value.includes("(beta)") || value.includes("(demo)") || value.includes("(aftermarket)") || value.includes("(unl)")) penalty += 90;
  if (value.includes("(rev ") || value.includes("(revision")) penalty += 10;
  return penalty;
}

function sourceUrlFromPath(filePath, repo, raw = false) {
  const base = raw
    ? `https://raw.githubusercontent.com/libretro-thumbnails/${repo}/${branch}/`
    : `https://github.com/libretro-thumbnails/${repo}/blob/${branch}/`;
  return `${base}${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

async function fetchRepoFiles(repo) {
  const rootResponse = await fetch(`https://api.github.com/repos/libretro-thumbnails/${repo}/git/trees/${branch}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "GamesCardsExchange/0.1 (local Game Boy box art enrichment)" },
  });
  if (!rootResponse.ok) throw new Error(`GitHub returned ${rootResponse.status} for ${repo}`);
  const root = await rootResponse.json();
  const folder = (root.tree || []).find((entry) => entry.type === "tree" && entry.path === "Named_Boxarts");
  if (!folder?.sha) throw new Error(`Could not find Named_Boxarts in ${repo}`);
  const response = await fetch(`https://api.github.com/repos/libretro-thumbnails/${repo}/git/trees/${folder.sha}?recursive=1`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "GamesCardsExchange/0.1 (local Game Boy box art enrichment)" },
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status} for ${repo} boxarts`);
  const result = await response.json();
  return (result.tree || [])
    .filter((entry) => entry.type === "blob")
    .filter((entry) => /\.(png|jpg|jpeg|webp)$/i.test(entry.path))
    .map((entry) => {
      const filePath = `Named_Boxarts/${entry.path}`;
      const fileName = path.basename(entry.path);
      return {
        repo,
        fileName,
        path: filePath,
        tokens: Array.from(new Set(titleTokens(fileName))),
        rawUrl: sourceUrlFromPath(filePath, repo, true),
        sourceUrl: sourceUrlFromPath(filePath, repo, false),
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

function findBestMatch(game, files, index) {
  const candidates = [game.title, ...(game.aliases || [])].flatMap(titleKeys).flatMap((key) => index.get(key) || []);
  if (!candidates.length) return findFuzzyMatch(game, files);
  return candidates
    .map((file) => ({ file, score: regionScore(file.fileName, game) - variantPenalty(file.fileName) }))
    .sort((a, b) => b.score - a.score || a.file.fileName.localeCompare(b.file.fileName))[0].file;
}

async function main() {
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Run scripts/import-gameboy-official-list.js before enriching images.");
  const gbFiles = await fetchRepoFiles(repos.gb);
  const gbcFiles = await fetchRepoFiles(repos.gbc);
  const filesByKind = {
    gb: gbFiles,
    gbc: gbcFiles,
  };
  const indexByKind = {
    gb: buildIndex(gbFiles),
    gbc: buildIndex(gbcFiles),
  };
  let matched = 0;
  games.forEach((game) => {
    const kind = game.id.startsWith("gbc-") ? "gbc" : "gb";
    const match = findBestMatch(game, filesByKind[kind], indexByKind[kind]);
    if (!match) return;
    game.imageUrl = match.rawUrl;
    game.imageSourceUrl = match.sourceUrl;
    game.imageProvider = "libretro-thumbnails";
    matched += 1;
  });
  const imageCount = games.filter((game) => game.imageUrl).length;
  writeJson(libretroIndexPath, {
    indexedAt: new Date().toISOString(),
    sources: [
      { source: "libretro-thumbnails Nintendo - Game Boy Named_Boxarts", fileCount: gbFiles.length },
      { source: "libretro-thumbnails Nintendo - Game Boy Color Named_Boxarts", fileCount: gbcFiles.length },
    ],
  });
  writeJson(dataPath, games);
  writeJson(manifestPath, {
    ...manifest,
    libretroImageEnrichedAt: new Date().toISOString(),
    libretroBoxArtFileCount: gbFiles.length + gbcFiles.length,
    libretroImageMatchCount: matched,
    imageCount,
    missingImageCount: games.length - imageCount,
  });
  console.log(`Indexed ${gbFiles.length + gbcFiles.length} Game Boy/GBC box-art files.`);
  console.log(`Images available for ${imageCount}/${games.length} Game Boy records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
