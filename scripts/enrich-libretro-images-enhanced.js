const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const repoOwner = "libretro-thumbnails";
const branch = "master";

const repoNames = {
  "3ds": "Nintendo_-_Nintendo_3DS",
  dreamcast: "Sega_-_Dreamcast",
  ds: "Nintendo_-_Nintendo_DS",
  gameboy: "Nintendo_-_Game_Boy",
  gamecube: "Nintendo_-_GameCube",
  gba: "Nintendo_-_Game_Boy_Advance",
  genesis: "Sega_-_Mega_Drive_-_Genesis",
  n64: "Nintendo_-_Nintendo_64",
  nes: "Nintendo_-_Nintendo_Entertainment_System",
  ps1: "Sony_-_PlayStation",
  ps2: "Sony_-_PlayStation_2",
  ps3: "Sony_-_PlayStation_3",
  ps4: "Sony_-_PlayStation_4",
  psp: "Sony_-_PlayStation_Portable",
  saturn: "Sega_-_Saturn",
  snes: "Nintendo_-_Super_Nintendo_Entertainment_System",
  vita: "Sony_-_PlayStation_Vita",
  wii: "Nintendo_-_Wii",
  xbox: "Microsoft_-_Xbox",
  xbox360: "Microsoft_-_Xbox_360",
};

const rejectedTitles = new Set([
  "saiyuki reload",
  "shogi 4",
]);

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
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeTitle(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(playstation|portable|psp|vita|ps1|ps2|ps3|ps4|xbox|360|nintendo|switch|3ds|ds|wii|gamecube|game boy|gameboy|advance|color|snes|nes|saturn|dreamcast|genesis|mega drive)\b/g, " ")
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
    .replace(/tsu/g, "tu")
    .replace(/jyo/g, "jo")
    .replace(/kyo/g, "kio")
    .replace(/ryo/g, "rio");
}

function tokens(value) {
  return normalizeTitle(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 || /^\d+$|^[xiv]+$/.test(token))
    .filter((token) => !["vol", "volume", "disc", "disk", "part", "series", "edition", "version", "special", "plus"].includes(token));
}

function compact(value) {
  return normalizeTitle(value).replace(/[\s&]+/g, "");
}

function phoneticCompact(value) {
  return tokens(value).map(phoneticToken).join("");
}

function regionScore(fileName, game) {
  const value = fileName.toLowerCase();
  const regions = game.releasedRegions || game.regions || [];
  if (regions.includes("northAmerica") && /\((usa|usa, canada|usa, europe|world)\)/i.test(value)) return 35;
  if (regions.includes("pal") && /\((europe|europe, australia|france|germany|spain|italy|usa, europe|world)\)/i.test(value)) return 30;
  if (regions.includes("japan") && /\((japan|japan, asia|world)\)/i.test(value)) return 30;
  if (/\((usa|usa, canada|usa, europe|world)\)/i.test(value)) return 12;
  if (/\((europe|europe, australia|france|germany|spain|italy)\)/i.test(value)) return 10;
  if (/\((japan|japan, asia)\)/i.test(value)) return 10;
  return 0;
}

function variantPenalty(fileName) {
  const value = fileName.toLowerCase();
  let penalty = 0;
  if (/\((sample|proto|prototype|beta|demo|unl|aftermarket|taikenban|trial|preview|promo)\)|\[(t-|t\+|tr|translation|hack|h\]|n\])/i.test(value)) penalty += 100;
  if (/\((rev |revision|v1\.)/i.test(value)) penalty += 8;
  if (/\((best version|ultimate hits|greatest hits|platinum|the best)\)/i.test(value)) penalty += 3;
  return penalty;
}

function rejectedVariant(fileName) {
  return /\((sample|proto|prototype|beta|demo|unl|aftermarket|taikenban|trial|preview|promo)\)|\[(t-|t\+|tr|translation|hack|h\]|n\])/i.test(String(fileName || ""));
}

function sourceUrlFromPath(filePath, baseUrl) {
  return `${baseUrl}${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, label) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "GamesCardsExchange/0.1 local enhanced box art enrichment" };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers });
      if (response.ok) return response.json();
      if (response.status !== 429 && response.status < 500) throw new Error(`${label} returned ${response.status}`);
      const retryAfter = Number(response.headers.get("retry-after") || 0);
      await sleep((retryAfter ? retryAfter * 1000 : 1500 * (attempt + 1)) + 250);
    } catch (error) {
      if (attempt === 4) throw error;
      await sleep(1500 * (attempt + 1));
    }
  }
  throw new Error(`${label} failed repeatedly.`);
}

function parseGitHubHtmlTree(html, repoName) {
  const matches = Array.from(String(html || "").matchAll(/<script type="application\/json" data-target="react-app\.embeddedData">([\s\S]*?)<\/script>/g));
  for (const match of matches) {
    const jsonText = match[1]
      .replace(/&quot;/g, "\"")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    try {
      const data = JSON.parse(jsonText);
      const items = data.payload?.codeViewTreeRoute?.tree?.items;
      if (Array.isArray(items)) return items;
    } catch {
      // Try the next embedded JSON block.
    }
  }
  throw new Error(`Could not parse ${repoName} GitHub HTML tree.`);
}

async function fetchGitHubHtmlIndex(repoName) {
  const url = `https://github.com/${repoOwner}/${repoName}/tree/${branch}/Named_Boxarts`;
  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "GamesCardsExchange/0.1 local enhanced box art enrichment",
    },
  });
  if (!response.ok) throw new Error(`${repoName} HTML tree returned ${response.status}`);
  return parseGitHubHtmlTree(await response.text(), repoName);
}

async function fetchLibretroIndex(repoName) {
  const rawBaseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/`;
  const htmlBaseUrl = `https://github.com/${repoOwner}/${repoName}/blob/${branch}/`;
  let entries;
  try {
    const root = await fetchJsonWithRetry(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}`, `${repoName} root tree`);
    const folder = (root.tree || []).find((entry) => entry.type === "tree" && entry.path === "Named_Boxarts");
    if (!folder?.sha) throw new Error(`Could not find ${repoName} Named_Boxarts folder.`);
    const result = await fetchJsonWithRetry(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${folder.sha}?recursive=1`, `${repoName} boxarts`);
    entries = (result.tree || []).filter((entry) => entry.type === "blob");
  } catch (error) {
    console.warn(`${repoName}: GitHub API unavailable (${error.message}); using HTML tree fallback.`);
    entries = await fetchGitHubHtmlIndex(repoName);
  }
  return entries
    .filter((entry) => (entry.type === "blob" || entry.contentType === "file") && /\.(png|jpg|jpeg|webp)$/i.test(entry.path || entry.name))
    .map((entry) => {
      const fileName = entry.name || path.basename(entry.path);
      const filePath = entry.path?.startsWith("Named_Boxarts/") ? entry.path : `Named_Boxarts/${entry.path || fileName}`;
      const fileTokens = tokens(fileName);
      return {
        fileName,
        path: filePath,
        normalized: normalizeTitle(fileName),
        compact: compact(fileName),
        tokens: fileTokens,
        phoneticTokens: fileTokens.map(phoneticToken),
        rawUrl: sourceUrlFromPath(filePath, rawBaseUrl),
        sourceUrl: sourceUrlFromPath(filePath, htmlBaseUrl),
      };
    });
}

function scoreFile(game, file) {
  const title = normalizeTitle(game.title);
  if (!title || rejectedTitles.has(title)) return -1;
  if (rejectedVariant(file.fileName)) return -1;
  const titleTokens = tokens(game.title);
  if (!titleTokens.length) return -1;

  const titleCompact = compact(game.title);
  const titlePhoneticCompact = phoneticCompact(game.title);
  const filePhoneticCompact = file.phoneticTokens.join("");
  const titlePhoneticTokens = titleTokens.map(phoneticToken);
  let score = regionScore(file.fileName, game) - variantPenalty(file.fileName);
  let accepted = false;

  if (file.normalized === title || file.compact === titleCompact || filePhoneticCompact === titlePhoneticCompact) {
    score += 140;
    accepted = true;
  }

  if (file.normalized.startsWith(`${title} `) && title.length >= 5 && (titleTokens.length > 1 || file.tokens.length - titleTokens.length <= 2)) {
    score += 116;
    accepted = true;
  }

  if (file.normalized.endsWith(` ${title}`) && titleTokens.length >= 2) {
    score += 96;
    accepted = true;
  }

  if (file.compact.includes(titleCompact) && titleCompact.length >= 11) {
    score += 86;
    accepted = true;
  }

  if (filePhoneticCompact.startsWith(titlePhoneticCompact) && titlePhoneticCompact.length >= 9 && titleTokens.length >= 3) {
    score += 108;
    accepted = true;
  }

  const overlap = titlePhoneticTokens.filter((token) => file.phoneticTokens.includes(token)).length;
  const coverage = overlap / titlePhoneticTokens.length;
  const extraTokens = Math.max(0, file.tokens.length - overlap);
  const missingNumbers = titleTokens.some((token) => /^\d+$/.test(token) && !file.tokens.includes(token));
  const titleNumberSet = new Set(titleTokens.filter((token) => /^\d+$/.test(token)));
  const extraNumbers = file.tokens.filter((token) => /^\d+$/.test(token) && !titleNumberSet.has(token));
  const hasTitleNumber = titleTokens.some((token) => /^\d+$/.test(token));

  if (extraNumbers.length) return -1;
  if (!hasTitleNumber && titleTokens.length <= 2 && file.normalized.endsWith(` ${title}`) && file.normalized !== title) return -1;
  if (titleTokens.length <= 2 && extraTokens > 3 && file.normalized !== title) return -1;
  if (titleTokens.length <= 2 && extraTokens > 1 && file.normalized !== title && !file.normalized.startsWith(`${title} `)) return -1;
  if (titleTokens.length <= 3 && extraTokens > 2 && file.normalized !== title && !file.normalized.startsWith(`${title} `)) return -1;

  if (titleTokens.length >= 2 && coverage >= 0.88 && !missingNumbers) {
    score += overlap * 18 + Math.round(coverage * 45) - extraTokens * 2;
    accepted = true;
  }

  return accepted ? score : -1;
}

function findBestMatch(game, files) {
  const ranked = files
    .map((file) => ({ file, score: scoreFile(game, file) }))
    .filter((item) => item.score >= 96)
    .sort((a, b) => b.score - a.score || a.file.fileName.localeCompare(b.file.fileName));
  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;
  if (second && best.score - second.score < 8 && best.file.normalized !== normalizeTitle(game.title)) return null;
  return best;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  return {
    platforms: args.filter((arg) => !arg.startsWith("--")),
    dryRun: flags.has("--dry-run"),
    limit: Number((args.find((arg) => arg.startsWith("--limit=")) || "").split("=")[1] || 0),
    minScore: Number((args.find((arg) => arg.startsWith("--min-score=")) || "").split("=")[1] || 96),
  };
}

async function enrichPlatform(slug, { dryRun, limit, minScore }) {
  const repoName = repoNames[slug];
  if (!repoName) throw new Error(`Unsupported platform: ${slug}`);
  const dataPath = path.join(gamesDir, `${slug}.json`);
  const manifestPath = path.join(gamesDir, `${slug}-manifest.json`);
  const reportPath = path.join(gamesDir, `${slug}-libretro-enhanced-report.json`);
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) return null;

  const files = await fetchLibretroIndex(repoName);
  const candidates = games.filter((game) => !game.imageUrl && !game.coverUrl && !game.boxArtUrl && !game.coverImage && !game.thumbnailUrl).slice(0, limit || undefined);
  const matches = [];
  const uncertain = [];

  candidates.forEach((game) => {
    const match = findBestMatch(game, files);
    if (match && match.score < minScore) return;
    if (!match) return;
    matches.push({ title: game.title, matchedTitle: match.file.fileName, score: match.score });
    if (match.score < 105 && uncertain.length < 40) uncertain.push({ title: game.title, matchedTitle: match.file.fileName, score: match.score });
    if (!dryRun) {
      game.imageUrl = match.file.rawUrl;
      game.imageSourceUrl = match.file.sourceUrl;
      game.imageProvider = "libretro-thumbnails enhanced";
      game.imageMatchedTitle = match.file.fileName;
      game.imageMatchScore = match.score;
      game.healthUpdatedAt = new Date().toISOString();
    }
  });

  const imageCount = games.filter((game) => game.imageUrl || game.coverUrl || game.boxArtUrl || game.coverImage || game.thumbnailUrl).length;
  const report = {
    generatedAt: new Date().toISOString(),
    source: `libretro-thumbnails ${repoName} Named_Boxarts enhanced matching`,
    fileCount: files.length,
    candidates: candidates.length,
    matched: matches.length,
    dryRun,
    samples: matches.slice(0, 100),
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

  return { platform: slug, candidates: candidates.length, matched: matches.length, imageCount, total: games.length, samples: report.samples.slice(0, 15), uncertain };
}

async function main() {
  const options = parseArgs();
  const platforms = options.platforms.length ? options.platforms : Object.keys(repoNames);
  const results = [];
  for (const platform of platforms) {
    try {
      results.push(await enrichPlatform(platform, options));
    } catch (error) {
      console.warn(`${platform}: skipped enhanced Libretro image pass: ${error.message}`);
    }
  }
  console.table(results.map(({ platform, candidates, matched, imageCount, total }) => ({ platform, candidates, matched, imageCount, total, missing: total - imageCount })));
  results.forEach((result) => {
    if (!result.samples.length) return;
    console.log(`\n${result.platform} samples:`);
    result.samples.forEach((sample) => console.log(`- ${sample.title} => ${sample.matchedTitle} (${sample.score})`));
    if (result.uncertain.length) console.log(`${result.platform} uncertain: ${JSON.stringify(result.uncertain.slice(0, 10), null, 2)}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
