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

const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = Number(limitArg?.split("=")[1] || 0);
const requestedPlatforms = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function stripDiacritics(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function stripFileDecorations(value) {
  return String(value || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ");
}

function normalizeTitle(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function exactKey(value) {
  return normalizeTitle(value).replace(/\s+/g, "");
}

function rejectedVariant(fileName) {
  return /\((sample|proto|prototype|beta|demo|unl|aftermarket|taikenban|trial|preview|promo)\)|\[(t-|t\+|tr|translation|hack|h\]|n\])/i.test(String(fileName || ""));
}

function sourceUrlFromPath(filePath, baseUrl) {
  return `${baseUrl}${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

function indexBaseUrl(repoName) {
  return `https://thumbnails.libretro.com/${repoName.replace(/_/g, "%20").replace(/%20-%20/g, "%20-%20")}/Named_Boxarts/`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, label) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "GamesCardsExchange/0.1 local exact Libretro box art enrichment" };
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

async function fetchLibretroIndex(repoName) {
  const indexUrl = indexBaseUrl(repoName);
  try {
    const response = await fetch(indexUrl, {
      headers: { "User-Agent": "GamesCardsExchange/0.1 local exact Libretro box art enrichment" },
    });
    if (response.ok) {
      const html = await response.text();
      return Array.from(html.matchAll(/href="([^"]+\.(?:png|jpg|jpeg|webp))"/gi))
        .map((match) => decodeURIComponent(match[1]).replace(/^\.\//, ""))
        .map((fileName) => ({
          fileName,
          key: exactKey(stripFileDecorations(fileName)),
          rawUrl: `${indexUrl}${fileName.split("/").map(encodeURIComponent).join("/")}`,
          sourceUrl: `${indexUrl}${fileName.split("/").map(encodeURIComponent).join("/")}`,
        }))
        .filter((file) => file.key && !rejectedVariant(file.fileName));
    }
    console.warn(`${repoName} public thumbnail index returned ${response.status}; falling back to GitHub API.`);
  } catch (error) {
    console.warn(`${repoName} public thumbnail index failed; falling back to GitHub API. ${error.message}`);
  }

  const rawBaseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/`;
  const htmlBaseUrl = `https://github.com/${repoOwner}/${repoName}/blob/${branch}/`;
  const root = await fetchJsonWithRetry(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}`, `${repoName} root tree`);
  const folder = (root.tree || []).find((entry) => entry.type === "tree" && entry.path === "Named_Boxarts");
  if (!folder?.sha) throw new Error(`Could not find ${repoName} Named_Boxarts folder.`);
  const result = await fetchJsonWithRetry(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${folder.sha}?recursive=1`, `${repoName} boxarts`);
  return (result.tree || [])
    .filter((entry) => entry.type === "blob" && /\.(png|jpg|jpeg|webp)$/i.test(entry.path))
    .map((entry) => {
      const fileName = path.basename(entry.path);
      const filePath = `Named_Boxarts/${entry.path}`;
      return {
        fileName,
        key: exactKey(stripFileDecorations(fileName)),
        rawUrl: sourceUrlFromPath(filePath, rawBaseUrl),
        sourceUrl: sourceUrlFromPath(filePath, htmlBaseUrl),
      };
    })
    .filter((file) => file.key && !rejectedVariant(file.fileName));
}

function hasImage(game) {
  return Boolean(game.imageUrl || game.coverUrl || game.boxArtUrl || game.coverImage || game.thumbnailUrl);
}

function candidateKeys(game) {
  return [game.title, ...(game.aliases || [])]
    .map(exactKey)
    .filter(Boolean);
}

function chooseExactFile(game, byKey) {
  for (const key of candidateKeys(game)) {
    const files = byKey.get(key) || [];
    if (files.length === 1) return files[0];
  }
  return null;
}

async function enrichPlatform(slug) {
  const repoName = repoNames[slug];
  if (!repoName) throw new Error(`Unsupported platform: ${slug}`);
  const dataPath = path.join(gamesDir, `${slug}.json`);
  const manifestPath = path.join(gamesDir, `${slug}-manifest.json`);
  const reportPath = path.join(gamesDir, `${slug}-libretro-exact-report.json`);
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) return null;

  const files = await fetchLibretroIndex(repoName);
  const byKey = new Map();
  files.forEach((file) => {
    if (!byKey.has(file.key)) byKey.set(file.key, []);
    byKey.get(file.key).push(file);
  });

  const candidates = games.filter((game) => !hasImage(game)).slice(0, limit || undefined);
  const matches = [];
  for (const game of candidates) {
    const file = chooseExactFile(game, byKey);
    if (!file) continue;
    matches.push({ title: game.title, matchedTitle: file.fileName });
    if (!dryRun) {
      game.imageUrl = file.rawUrl;
      game.imageSourceUrl = file.sourceUrl;
      game.imageProvider = "libretro-thumbnails exact";
      game.imageMatchedTitle = file.fileName;
      game.imageMatchScore = 1000;
      game.healthUpdatedAt = new Date().toISOString();
      delete game.imageQualityNote;
    }
  }

  const imageCount = games.filter(hasImage).length;
  const report = {
    generatedAt: new Date().toISOString(),
    source: `libretro-thumbnails ${repoName} Named_Boxarts exact title matching`,
    dryRun,
    fileCount: files.length,
    candidates: candidates.length,
    matched: matches.length,
    samples: matches.slice(0, 120),
  };

  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      libretroExactImageEnrichedAt: new Date().toISOString(),
      libretroExactImageMatchCount: matches.length,
      imageCount,
      missingImageCount: games.length - imageCount,
    });
    writeJson(reportPath, report);
  }

  return { platform: slug, candidates: candidates.length, matched: matches.length, imageCount, total: games.length, samples: report.samples.slice(0, 12) };
}

async function main() {
  const platforms = requestedPlatforms.length ? requestedPlatforms : Object.keys(repoNames);
  const results = [];
  for (const platform of platforms) {
    try {
      results.push(await enrichPlatform(platform));
    } catch (error) {
      console.warn(`${platform}: skipped Libretro exact image pass: ${error.message}`);
      results.push({ platform, candidates: 0, matched: 0, imageCount: 0, total: 0, samples: [] });
    }
  }
  console.table(results.map(({ platform, candidates, matched, imageCount, total }) => ({ platform, candidates, matched, imageCount, total, missing: total - imageCount })));
  for (const result of results) {
    if (!result.samples.length) continue;
    console.log(`\n${result.platform} samples:`);
    result.samples.forEach((sample) => console.log(`- ${sample.title} => ${sample.matchedTitle}`));
  }
  if (dryRun) console.log("Dry run only; no files were changed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
