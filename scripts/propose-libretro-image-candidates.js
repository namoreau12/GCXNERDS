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

const args = process.argv.slice(2);
const finishable = args.includes("--finishable");
const loose = args.includes("--loose");
const requestedPlatforms = args.filter((arg) => !arg.startsWith("--"));
const limit = Number((args.find((arg) => arg.startsWith("--limit=")) || "").split("=")[1] || 0);
const minScore = Number((args.find((arg) => arg.startsWith("--min-score=")) || "").split("=")[1] || 70);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasImage(game) {
  return Boolean(game.imageUrl || game.coverUrl || game.boxArtUrl || game.coverImage || game.thumbnailUrl);
}

function stripDiacritics(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenFix(token) {
  return token
    .replace(/ou/g, "o")
    .replace(/oo/g, "o")
    .replace(/uu/g, "u")
    .replace(/sh/g, "s")
    .replace(/ch/g, "t")
    .replace(/ts/g, "t")
    .replace(/ry/g, "r")
    .replace(/ky/g, "k")
    .replace(/gy/g, "g")
    .replace(/jy/g, "j");
}

function tokens(value) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 1 || /^\d+$|^[xiv]+$/.test(token))
    .filter((token) => !["edition", "version", "disc", "disk", "vol", "volume"].includes(token));
}

function compact(value) {
  return tokens(value).join("");
}

function fixedCompact(value) {
  return tokens(value).map(tokenFix).join("");
}

function sourceUrlFromPath(filePath, baseUrl) {
  return `${baseUrl}${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

function badFileName(fileName) {
  return /\((sample|proto|prototype|beta|demo|unl|aftermarket|trial|preview|promo|program|bios)\)|\[(t-|tr|translation|hack|h\])/i.test(fileName);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "GamesCardsExchange/0.1 local Libretro candidate proposal",
    },
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function fetchFiles(repoName) {
  const root = await fetchJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}`);
  const folder = (root.tree || []).find((entry) => entry.type === "tree" && entry.path === "Named_Boxarts");
  if (!folder?.sha) throw new Error(`Could not find ${repoName} Named_Boxarts.`);
  const tree = await fetchJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${folder.sha}?recursive=1`);
  const rawBaseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/`;
  const indexBaseUrl = `https://thumbnails.libretro.com/${repoName.replace(/_/g, "%20").replace(/%20-%20/g, "%20-%20")}/Named_Boxarts/`;
  return (tree.tree || [])
    .filter((entry) => entry.type === "blob" && /\.(png|jpg|jpeg|webp)$/i.test(entry.path))
    .map((entry) => {
      const fileName = path.basename(entry.path);
      const filePath = `Named_Boxarts/${entry.path}`;
      return {
        fileName,
        rawUrl: sourceUrlFromPath(filePath, rawBaseUrl),
        indexUrl: indexBaseUrl,
        tokens: tokens(fileName),
        compact: compact(fileName),
        fixed: fixedCompact(fileName),
      };
    })
    .filter((file) => !badFileName(file.fileName));
}

function score(game, file) {
  const titleValues = [game.title, ...(game.aliases || [])].filter(Boolean);
  let best = 0;
  for (const title of titleValues) {
    const titleTokens = tokens(title);
    if (!titleTokens.length) continue;
    const titleCompact = titleTokens.join("");
    const titleFixed = titleTokens.map(tokenFix).join("");
    const fileTokenSet = new Set(file.tokens.map(tokenFix));
    const overlap = titleTokens.map(tokenFix).filter((token) => fileTokenSet.has(token)).length;
    const coverage = overlap / titleTokens.length;
    const extra = Math.max(0, file.tokens.length - overlap);
    const titleNumbers = titleTokens.filter((token) => /^\d+$/.test(token));
    const fileNumbers = file.tokens.filter((token) => /^\d+$/.test(token));
    if (titleNumbers.some((number) => !fileNumbers.includes(number))) continue;

    let current = 0;
    if (file.compact === titleCompact || file.fixed === titleFixed) current += 130;
    if (file.compact.startsWith(titleCompact) || file.fixed.startsWith(titleFixed)) current += 95;
    if (file.compact.includes(titleCompact) && titleCompact.length >= 9) current += 80;
    if (coverage >= 0.8) current += Math.round(coverage * 70) - extra * 5;
    if (/\((usa|europe|japan|world)\)/i.test(file.fileName)) current += 10;
    best = Math.max(best, current);
  }
  return best;
}

function safeTitleShape(game, file) {
  const titleValues = [game.title, ...(game.aliases || [])].filter(Boolean);
  for (const title of titleValues) {
    const titleTokens = tokens(title);
    if (!titleTokens.length) continue;

    const titleFixedTokens = titleTokens.map(tokenFix);
    const fileFixedTokens = file.tokens.map(tokenFix);
    const titleFixed = titleFixedTokens.join("");
    const fileFixed = fileFixedTokens.join("");

    if (fileFixed === titleFixed) return true;

    const startsWithTitleTokens = titleFixedTokens.every((token, index) => fileFixedTokens[index] === token);
    if (!startsWithTitleTokens) continue;

    const extraTokens = fileFixedTokens.slice(titleFixedTokens.length);
    const titleNumbers = titleTokens.filter((token) => /^\d+$/.test(token));
    const extraNumbers = extraTokens.filter((token) => /^\d+$/.test(token));
    if (extraNumbers.some((number) => !titleNumbers.includes(number))) continue;

    const toleratedSuffixes = new Set(["gb", "gba", "dc", "sfc", "smc"]);
    if (extraTokens.length <= 1 && extraTokens.every((token) => toleratedSuffixes.has(token))) return true;
  }
  return false;
}

function finishablePlatforms() {
  const queuePath = path.join(gamesDir, "finishable-image-queue.json");
  if (!fs.existsSync(queuePath)) return [];
  const queue = readJson(queuePath);
  return (queue.platforms || []).map((platform) => platform.slug).filter((slug) => repoNames[slug]);
}

async function proposePlatform(platform) {
  const repoName = repoNames[platform];
  if (!repoName) throw new Error(`Unsupported platform ${platform}`);
  const games = readJson(path.join(gamesDir, `${platform}.json`));
  const missing = games.filter((game) => !hasImage(game)).slice(0, limit || undefined);
  const files = await fetchFiles(repoName);
  console.log(`\n${platform}: ${missing.length} missing, ${files.length} indexed box-art files`);
  for (const game of missing) {
    const ranked = files
      .map((file) => ({ file, score: score(game, file) }))
      .filter((item) => item.score >= minScore)
      .filter((item) => loose || safeTitleShape(game, item.file))
      .sort((a, b) => b.score - a.score || a.file.fileName.localeCompare(b.file.fileName))
      .slice(0, 5);
    if (!ranked.length) continue;
    console.log(`\n${game.id}\t${game.title}`);
    ranked.forEach((item) => console.log(`  ${item.score}\t${item.file.fileName}\t${item.file.rawUrl}`));
  }
}

async function main() {
  const platforms = requestedPlatforms.length ? requestedPlatforms : finishable ? finishablePlatforms() : Object.keys(repoNames);
  for (const platform of platforms) await proposePlatform(platform);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
