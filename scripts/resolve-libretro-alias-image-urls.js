const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const repoOwner = "libretro-thumbnails";
const branch = "master";
const dryRun = process.argv.includes("--dry-run");
const limit = Number((process.argv.find((arg) => arg.startsWith("--limit=")) || "").split("=")[1] || 0);
const onlyFailures = process.argv.includes("--from-health-report");

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

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, label) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "GamesCardsExchange/0.1 local Libretro alias resolver" };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { headers });
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) throw new Error(`${label} returned ${response.status}`);
    await sleep(1500 * (attempt + 1));
  }
  throw new Error(`${label} failed repeatedly.`);
}

async function fetchTextWithRetry(url) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "GamesCardsExchange/0.1 local Libretro alias resolver" } });
      if (response.ok) return response.text();
      if (response.status !== 429 && response.status < 500) return "";
    } catch {
      // Retry transient connection failures.
    }
    await sleep(1200 * (attempt + 1));
  }
  return "";
}

async function fetchImageSignature(url) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "GamesCardsExchange/0.1 local Libretro alias resolver" } });
      if (!response.ok) return "";
      const contentType = response.headers.get("content-type") || "";
      if (/^image\//i.test(contentType)) return contentType.replace(/^image\//i, "").split(";")[0] || "image";
      const buffer = new Uint8Array(await response.arrayBuffer());
      return imageSignature(buffer.slice(0, 16));
    } catch {
      // Retry transient connection failures.
    }
    await sleep(1200 * (attempt + 1));
  }
  return "";
}

function imageSignature(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "webp";
  return "";
}

function sourceUrlFromPath(filePath, baseUrl) {
  return `${baseUrl}${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

async function fetchLibretroEntries(repoName) {
  const root = await fetchJsonWithRetry(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}`, `${repoName} root tree`);
  const folder = (root.tree || []).find((entry) => entry.type === "tree" && entry.path === "Named_Boxarts");
  if (!folder?.sha) throw new Error(`Could not find ${repoName} Named_Boxarts folder.`);
  const result = await fetchJsonWithRetry(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${folder.sha}?recursive=1`, `${repoName} boxarts`);
  const entries = new Map();
  for (const entry of result.tree || []) {
    if (entry.type !== "blob" || !/\.(png|jpg|jpeg|webp)$/i.test(entry.path)) continue;
    const filePath = `Named_Boxarts/${entry.path}`;
    entries.set(filePath, { ...entry, filePath });
  }
  return entries;
}

function rawPathFromUrl(url, repoName) {
  const prefix = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/`;
  if (!String(url || "").startsWith(prefix)) return "";
  try {
    return decodeURIComponent(String(url).slice(prefix.length));
  } catch {
    return String(url).slice(prefix.length);
  }
}

function aliasTargetPath(currentPath, text) {
  const trimmed = String(text || "").trim();
  if (!/^[^<>:"|?*]+?\.(png|jpg|jpeg|webp)$/i.test(trimmed)) return "";
  return `${path.posix.dirname(currentPath)}/${trimmed}`.replace(/^\.\//, "");
}

function stripDiacritics(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function stripDecorations(value) {
  return String(value || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ");
}

function titleKey(value) {
  return stripDiacritics(stripDecorations(value))
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, "")
    .trim();
}

function titleLooksAligned(game, filePath) {
  const keys = [game.title, ...(game.aliases || [])].map(titleKey).filter(Boolean);
  const fileKey = titleKey(path.basename(filePath));
  return keys.some((key) => key && fileKey && (key === fileKey || fileKey.startsWith(key) || key.startsWith(fileKey)));
}

function isLibretroGame(game) {
  return /libretro/i.test(String(game.imageProvider || "")) && /raw\.githubusercontent\.com\/libretro-thumbnails/i.test(String(game.imageUrl || ""));
}

function healthReportFailureIds(slug) {
  if (!onlyFailures) return null;
  const report = readJsonIfExists(path.join(gamesDir, "image-url-health-report.json"), {});
  return new Set((report.failures || []).filter((item) => item.platform === slug).map((item) => item.id));
}

async function resolvePlatform(slug) {
  const repoName = repoNames[slug];
  if (!repoName) return null;
  const dataPath = path.join(gamesDir, `${slug}.json`);
  const manifestPath = path.join(gamesDir, `${slug}-manifest.json`);
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) return null;

  const rawBaseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/`;
  const htmlBaseUrl = `https://github.com/${repoOwner}/${repoName}/blob/${branch}/`;
  const failureIds = healthReportFailureIds(slug);
  const candidates = games
    .filter(isLibretroGame)
    .filter((game) => !failureIds || failureIds.has(game.id))
    .slice(0, limit || undefined);
  let checkedSmall = 0;
  let resolved = 0;
  let cleared = 0;
  const samples = [];

  for (const game of candidates) {
    const currentPath = rawPathFromUrl(game.imageUrl, repoName);
    const text = await fetchTextWithRetry(game.imageUrl);
    const targetPath = aliasTargetPath(currentPath, text);
    if (!targetPath) continue;
    checkedSmall += 1;
    const aligned = titleLooksAligned(game, currentPath) || titleLooksAligned(game, targetPath);
    const targetUrl = sourceUrlFromPath(targetPath, rawBaseUrl);
    const signature = aligned ? await fetchImageSignature(targetUrl) : "";
    if (signature) {
      if (!dryRun) {
        game.imageUrl = targetUrl;
        game.imageSourceUrl = sourceUrlFromPath(targetPath, htmlBaseUrl);
        game.imageResolvedFromAlias = path.basename(currentPath);
        game.healthUpdatedAt = new Date().toISOString();
      }
      resolved += 1;
      if (samples.length < 40) samples.push({ title: game.title, from: path.basename(currentPath), to: path.basename(targetPath) });
    } else if (text && aligned && !dryRun) {
      delete game.imageUrl;
      delete game.imageSourceUrl;
      delete game.imageProvider;
      delete game.imageMatchedTitle;
      game.imageQualityNote = "Cleared unresolved Libretro alias-text image URL.";
      game.healthUpdatedAt = new Date().toISOString();
      cleared += 1;
    } else if (text && aligned) {
      cleared += 1;
    }
  }

  if (!dryRun && (resolved || cleared)) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      libretroAliasResolvedAt: new Date().toISOString(),
      libretroAliasStats: { checkedSmall, resolved, cleared },
    });
  }

  return { platform: slug, candidates: candidates.length, checkedSmall, resolved, cleared, samples };
}

async function main() {
  const platforms = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const targets = platforms.length ? platforms : Object.keys(repoNames);
  const results = [];
  for (const platform of targets) {
    const result = await resolvePlatform(platform);
    if (result) results.push(result);
  }
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    results,
  };
  writeJson(path.join(gamesDir, "libretro-alias-resolution-report.json"), report);
  console.table(results.map(({ platform, candidates, checkedSmall, resolved, cleared, skipped, error }) => ({ platform, candidates, checkedSmall, resolved, cleared, skipped: Boolean(skipped), error: error || "" })));
  for (const result of results) {
    if (!result.samples.length) continue;
    console.log(`\n${result.platform} samples:`);
    result.samples.slice(0, 12).forEach((sample) => console.log(`- ${sample.title}: ${sample.from} -> ${sample.to}`));
  }
  if (dryRun) console.log("Dry run only; no files were changed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
