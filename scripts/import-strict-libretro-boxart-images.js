const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

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

const requestedPlatforms = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");
const allowUniquePrefix = process.argv.includes("--allow-unique-prefix");
const targetPlatforms = requestedPlatforms.length ? requestedPlatforms : Object.keys(repoNames);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function hasImage(game) {
  return Boolean(game.imageUrl || game.coverUrl || game.boxArtUrl || game.coverImage || game.thumbnailUrl);
}

function stripDiacritics(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function roman(value) {
  return String(value || "")
    .replace(/\bVIII\b/gi, "8")
    .replace(/\bVII\b/gi, "7")
    .replace(/\bVI\b/gi, "6")
    .replace(/\bIV\b/gi, "4")
    .replace(/\bIII\b/gi, "3")
    .replace(/\bII\b/gi, "2")
    .replace(/\bIX\b/gi, "9")
    .replace(/\bX\b/gi, "10")
    .replace(/\bV\b/gi, "5");
}

function normalize(value) {
  return stripDiacritics(roman(value))
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

function compact(value) {
  return normalize(value).replace(/\s+/g, "");
}

function tokenFix(value) {
  return String(value)
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

function fixedCompact(value) {
  return compact(value).split(/\s*/).map(tokenFix).join("");
}

function normalizedTokens(value) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function safePrefixSuffix(fileName, title) {
  const titleTokens = normalizedTokens(title);
  const fileTokens = normalizedTokens(fileName);
  if (titleTokens.length < 2) return false;
  if (titleTokens.join("") !== fileTokens.slice(0, titleTokens.length).join("")) return false;

  const suffixTokens = fileTokens.slice(titleTokens.length);
  if (!suffixTokens.length) return false;
  const safeLead = new Set([
    "anniversary",
    "arcade",
    "classic",
    "classics",
    "collection",
    "complete",
    "definitive",
    "deluxe",
    "directors",
    "edition",
    "enhanced",
    "final",
    "game",
    "gold",
    "greatest",
    "hd",
    "international",
    "limited",
    "platinum",
    "premium",
    "remaster",
    "remastered",
    "ultimate",
    "version",
  ]);
  return safeLead.has(suffixTokens[0]);
}

function badFileName(fileName) {
  return /\((sample|proto|prototype|beta|demo|unl|aftermarket|trial|preview|promo|program|bios)\)|\[(t-|tr|translation|hack|h\])/i.test(fileName);
}

function regionRank(fileName) {
  if (/\(USA\)|\(World\)/i.test(fileName)) return 0;
  if (/\(Europe\)/i.test(fileName)) return 1;
  if (/\(Japan\)/i.test(fileName)) return 2;
  return 3;
}

function sourceUrlFromPath(filePath, baseUrl) {
  return `${baseUrl}${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

function indexBaseUrl(repoName) {
  return `https://thumbnails.libretro.com/${repoName.replace(/_/g, "%20").replace(/%20-%20/g, "%20-%20")}/Named_Boxarts/`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "GamesCardsExchange/0.1 local strict Libretro importer",
    },
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function fetchFilesFromIndex(repoName) {
  const baseUrl = indexBaseUrl(repoName);
  const response = await fetch(baseUrl, {
    headers: {
      "User-Agent": "GamesCardsExchange/0.1 local strict Libretro importer",
    },
  });
  if (!response.ok) throw new Error(`${baseUrl} returned ${response.status}`);
  const html = await response.text();
  return Array.from(html.matchAll(/href="([^"]+\.(?:png|jpg|jpeg|webp))"/gi))
    .map((match) => decodeURIComponent(match[1]).replace(/^\.\//, ""))
    .map((fileName) => ({
      fileName,
      rawUrl: `${baseUrl}${fileName.split("/").map(encodeURIComponent).join("/")}`,
      compact: compact(fileName),
      fixed: fixedCompact(fileName),
      rank: regionRank(fileName),
    }))
    .filter((file) => !badFileName(file.fileName));
}

async function fetchFiles(repoName) {
  try {
    return await fetchFilesFromIndex(repoName);
  } catch (error) {
    console.warn(`Index fetch failed for ${repoName}; falling back to GitHub API. ${error.message}`);
  }
  const root = await fetchJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${branch}`);
  const folder = (root.tree || []).find((entry) => entry.type === "tree" && entry.path === "Named_Boxarts");
  if (!folder?.sha) throw new Error(`Could not find ${repoName} Named_Boxarts.`);
  const tree = await fetchJson(`https://api.github.com/repos/${repoOwner}/${repoName}/git/trees/${folder.sha}?recursive=1`);
  const rawBaseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/`;
  return (tree.tree || [])
    .filter((entry) => entry.type === "blob" && /\.(png|jpg|jpeg|webp)$/i.test(entry.path))
    .map((entry) => {
      const fileName = path.basename(entry.path);
      const filePath = `Named_Boxarts/${entry.path}`;
      return {
        fileName,
        rawUrl: sourceUrlFromPath(filePath, rawBaseUrl),
        compact: compact(fileName),
        fixed: fixedCompact(fileName),
        rank: regionRank(fileName),
      };
    })
    .filter((file) => !badFileName(file.fileName));
}

function matchForGame(game, files) {
  const titles = [game.title, ...(game.aliases || [])].filter(Boolean);
  const titleKeys = titles
    .flatMap((title) => [compact(title), fixedCompact(title)])
    .filter(Boolean);
  const titleKeySet = new Set(titleKeys);
  let matches = files
    .filter((file) => titleKeySet.has(file.compact) || titleKeySet.has(file.fixed))
    .sort((a, b) => a.rank - b.rank || a.fileName.localeCompare(b.fileName));
  if (matches.length) return matches[0];
  if (!allowUniquePrefix) return null;

  matches = files
    .filter((file) =>
      titles.some((title) => {
        const key = compact(title);
        const fixedKey = fixedCompact(title);
        if (key.length < 7) return false;
        if (!safePrefixSuffix(file.fileName, title)) return false;
        return file.compact.startsWith(key) || file.fixed.startsWith(fixedKey);
      })
    )
    .sort((a, b) => a.rank - b.rank || a.fileName.localeCompare(b.fileName));
  return matches.length === 1 ? matches[0] : null;
}

function runNode(script) {
  const result = spawnSync(process.execPath, [script], {
    cwd: rootDir,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

async function main() {
  const summary = [];
  const importedRows = [];

  for (const platform of targetPlatforms) {
    const repoName = repoNames[platform];
    if (!repoName) throw new Error(`Unsupported platform ${platform}`);
    const dataPath = path.join(gamesDir, `${platform}.json`);
    const games = readJson(dataPath);
    const files = await fetchFiles(repoName);
    let updated = 0;

    for (const game of games) {
      if (hasImage(game)) continue;
      const match = matchForGame(game, files);
      if (!match) continue;
      updated += 1;
      importedRows.push({
        platform,
        gameId: game.id,
        title: game.title,
        fileName: match.fileName,
        imageUrl: match.rawUrl,
      });
      if (!dryRun) {
        game.imageUrl = match.rawUrl;
        game.imageSourceUrl = match.rawUrl;
        game.imageProvider = "Libretro thumbnails exact box-art match";
        game.imageMatchedTitle = match.fileName;
        game.imageImportNotes = "Strict exact-title Named_Boxarts import; sample/prototype/demo/unlicensed/translation/hack files excluded.";
        game.healthUpdatedAt = new Date().toISOString();
      }
    }

    if (!dryRun && updated) writeJson(dataPath, games);
    summary.push({ platform, updated });
  }

  console.table(summary);
  console.log(`${dryRun ? "Would import" : "Imported"} ${summary.reduce((sum, item) => sum + item.updated, 0)} strict Libretro box-art URLs.`);
  if (allowUniquePrefix) console.log("Unique-prefix mode was enabled; only one non-rejected prefix candidate per game was accepted.");
  console.table(importedRows.slice(0, 80));

  if (!dryRun) {
    fs.writeFileSync(
      path.join(gamesDir, "last-strict-libretro-image-import-report.json"),
      `${JSON.stringify({ importedAt: new Date().toISOString(), summary, importedRows }, null, 2)}\n`
    );
    runNode(path.join("scripts", "audit-game-library-completeness.js"));
    runNode(path.join("scripts", "build-data-health-cleanup-queue.js"));
    runNode(path.join("scripts", "export-game-image-queues.js"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
