const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ps2.json");
const manifestPath = path.join(rootDir, "data", "games", "ps2-manifest.json");
const reportPath = path.join(rootDir, "data", "games", "ps2-libretro-enhanced-report.json");

const repoOwner = "libretro-thumbnails";
const repoName = "Sony_-_PlayStation_2";
const branch = "master";
const rawBaseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/`;
const htmlBaseUrl = `https://github.com/${repoOwner}/${repoName}/blob/${branch}/`;
const rejectedTitles = new Set(["saiyuki reload", "shogi 4"]);

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
  return stripDiacritics(String(value || "").toLowerCase())
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(playstation 2|ps2)\b/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\band\b/g, "&")
    .replace(/[^a-z0-9&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phoneticToken(token) {
  return token
    .replace(/ou/g, "o")
    .replace(/uu/g, "u")
    .replace(/oo/g, "o")
    .replace(/shi/g, "si")
    .replace(/chi/g, "ti")
    .replace(/tsu/g, "tu");
}

function compact(value) {
  return normalizeTitle(value).replace(/[\s&]+/g, "");
}

function phoneticCompact(value) {
  return tokens(value).map(phoneticToken).join("");
}

function tokens(value) {
  return normalizeTitle(value)
    .split(/\s+/)
    .filter((token) => token.length > 1)
    .concat(
      normalizeTitle(value)
        .split(/\s+/)
        .filter((token) => /^\d+$|^[xiv]+$/.test(token))
    )
    .filter((token) => !["vol", "volume", "disc", "disk", "part", "series"].includes(token));
}

function regionScore(fileName, game) {
  const value = fileName.toLowerCase();
  if (game.releasedRegions?.includes("northAmerica") && /\((usa|usa, canada|usa, europe|world)\)/i.test(value)) return 35;
  if (game.releasedRegions?.includes("pal") && /\((europe|europe, australia|france|germany|spain|italy|usa, europe|world)\)/i.test(value)) return 30;
  if (game.releasedRegions?.includes("japan") && /\((japan|japan, asia|world)\)/i.test(value)) return 30;
  if (/\((usa|usa, canada|usa, europe|world)\)/i.test(value)) return 12;
  if (/\((europe|europe, australia|france|germany|spain|italy)\)/i.test(value)) return 10;
  if (/\((japan)\)/i.test(value)) return 10;
  return 0;
}

function variantPenalty(fileName) {
  const value = fileName.toLowerCase();
  let penalty = 0;
  if (value.includes("(sample)") || value.includes("(proto)") || value.includes("(prototype)")) penalty += 100;
  if (value.includes("(beta)") || value.includes("(demo)") || value.includes("(unl)") || value.includes("(aftermarket)")) penalty += 100;
  if (value.includes("(taikenban)") || value.includes("(trial)") || value.includes("(preview)")) penalty += 100;
  if (value.includes("(rev ") || value.includes("(revision") || value.includes("(v1.")) penalty += 8;
  if (value.includes("(best version)") || value.includes("(ultimate hits)") || value.includes("(playstation 2 the best)")) penalty += 3;
  return penalty;
}

function sourceUrlFromPath(filePath, baseUrl) {
  return `${baseUrl}${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

async function fetchLibretroIndex() {
  const rootResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "GamesCardsExchange/0.1 (local PS2 enhanced image enrichment)" },
  });
  if (!rootResponse.ok) throw new Error(`GitHub returned ${rootResponse.status}`);
  const root = await rootResponse.json();
  const folder = (root.tree || []).find((entry) => entry.type === "tree" && entry.path === "Named_Boxarts");
  if (!folder?.sha) throw new Error("Could not find Libretro PS2 Named_Boxarts folder.");
  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${folder.sha}?recursive=1`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "GamesCardsExchange/0.1 (local PS2 enhanced image enrichment)" },
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
        normalized: normalizeTitle(fileName),
        compact: compact(fileName),
        tokens: tokens(fileName),
        phoneticTokens: tokens(fileName).map(phoneticToken),
        rawUrl: sourceUrlFromPath(filePath, rawBaseUrl),
        sourceUrl: sourceUrlFromPath(filePath, htmlBaseUrl),
      };
    });
}

function scoreFile(game, file) {
  const title = normalizeTitle(game.title);
  if (rejectedTitles.has(title)) return -1;
  const titleCompact = compact(game.title);
  const titlePhoneticCompact = phoneticCompact(game.title);
  const filePhoneticCompact = file.phoneticTokens.join("");
  const titleTokens = tokens(game.title);
  const titlePhoneticTokens = titleTokens.map(phoneticToken);
  if (!title || !titleTokens.length) return -1;

  let score = regionScore(file.fileName, game) - variantPenalty(file.fileName);
  let accepted = false;
  if (file.normalized === title || file.compact === titleCompact || filePhoneticCompact === titlePhoneticCompact) {
    score += 130;
    accepted = true;
  }
  if (
    file.normalized.startsWith(`${title} `) &&
    title.length >= 5 &&
    (titleTokens.length > 1 || file.tokens.length - titleTokens.length <= 2)
  ) {
    score += 112;
    accepted = true;
  }
  if (
    filePhoneticCompact.startsWith(titlePhoneticCompact) &&
    titlePhoneticCompact.length >= 8 &&
    titleTokens.length >= 3 &&
    !titleTokens.some((token) => /^\d+$/.test(token) && !file.tokens.includes(token))
  ) {
    score += 106;
    accepted = true;
  }
  if (file.normalized.endsWith(` ${title}`) && titleTokens.length >= 2) {
    score += 95;
    accepted = true;
  }
  if (file.compact.includes(titleCompact) && titleCompact.length >= 10) {
    score += 82;
    accepted = true;
  }
  const overlap = titlePhoneticTokens.filter((token) => file.phoneticTokens.includes(token)).length;
  const coverage = overlap / titlePhoneticTokens.length;
  const extraTokens = Math.max(0, file.tokens.length - overlap);

  if (
    titleTokens.length >= 2 &&
    coverage >= 0.85 &&
    !titleTokens.some((token) => /^\d+$/.test(token) && !file.tokens.includes(token))
  ) {
    score += overlap * 18 + Math.round(coverage * 45) - extraTokens * 2;
    accepted = true;
  } else if (title[0] === "_" && file.normalized.includes(title.replace(/^_+/, ""))) {
    score += 85;
    accepted = true;
  } else if (titleTokens[0]?.length >= 6 && file.phoneticTokens.includes(titlePhoneticTokens[0])) {
    score += 52 - extraTokens * 2;
    accepted = file.normalized.startsWith(titleTokens[0]) || file.normalized.endsWith(titleTokens[0]);
  }

  return accepted ? score : -1;
}

function findBestMatch(game, files) {
  const ranked = files
    .map((file) => ({ file, score: scoreFile(game, file) }))
    .filter((item) => item.score >= 90)
    .sort((a, b) => b.score - a.score || a.file.fileName.localeCompare(b.file.fileName));

  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;
  if (second && best.score - second.score < 8 && best.file.normalized !== normalizeTitle(game.title)) return null;
  return best;
}

function parseArgs() {
  const args = new Map();
  process.argv.slice(2).forEach((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    args.set(key, value || "true");
  });
  return {
    dryRun: args.has("dry-run"),
    limit: Number(args.get("limit") || 0),
  };
}

async function main() {
  const { dryRun, limit } = parseArgs();
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Run scripts/import-ps2-official-list.js before enriching images.");

  const files = await fetchLibretroIndex();
  const candidates = games.filter((game) => !game.imageUrl).slice(0, limit || undefined);
  const matches = [];
  const uncertain = [];

  candidates.forEach((game) => {
    const match = findBestMatch(game, files);
    if (!match) return;
    matches.push({ title: game.title, matchedTitle: match.file.fileName, score: match.score });
    if (match.score < 95 && uncertain.length < 50) uncertain.push({ title: game.title, matchedTitle: match.file.fileName, score: match.score });
    if (!dryRun) {
      game.imageUrl = match.file.rawUrl;
      game.imageSourceUrl = match.file.sourceUrl;
      game.imageProvider = "libretro-thumbnails enhanced";
      game.imageMatchedTitle = match.file.fileName;
      game.imageMatchScore = match.score;
      game.healthUpdatedAt = new Date().toISOString();
    }
  });

  const imageCount = games.filter((game) => game.imageUrl).length;
  const report = {
    generatedAt: new Date().toISOString(),
    source: "libretro-thumbnails Sony - PlayStation 2 Named_Boxarts enhanced matching",
    fileCount: files.length,
    candidates: candidates.length,
    matched: matches.length,
    dryRun,
    samples: matches.slice(0, 80),
    uncertain,
  };

  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      libretroEnhancedImageEnrichedAt: new Date().toISOString(),
      libretroEnhancedImageMatchCount: matches.length,
      imageCount,
      missingImageCount: games.length - imageCount,
    });
    writeJson(reportPath, report);
  }

  console.log(`Enhanced Libretro PS2 images matched ${matches.length}/${candidates.length}.`);
  console.log(`Images available for ${imageCount}/${games.length} PS2 records.`);
  console.log(JSON.stringify(report.samples.slice(0, 100), null, 2));
  if (uncertain.length) console.log(`Uncertain samples: ${JSON.stringify(uncertain.slice(0, 10), null, 2)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
