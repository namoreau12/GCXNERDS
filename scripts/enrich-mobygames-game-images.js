const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const envPath = path.join(rootDir, ".env");

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const requestedPlatforms = args.filter((arg) => !arg.startsWith("--"));
const dryRun = flags.has("--dry-run");
const sample = flags.has("--sample");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;
const checkpointEveryArg = args.find((arg) => arg.startsWith("--checkpoint-every="));
const checkpointEvery = Math.max(1, Number(checkpointEveryArg?.split("=")[1] || 20));

const platformAliases = {
  "3ds": ["nintendo 3ds"],
  dreamcast: ["dreamcast"],
  ds: ["nintendo ds"],
  gameboy: ["game boy", "game boy color"],
  gamecube: ["gamecube", "game cube"],
  gba: ["game boy advance"],
  genesis: ["genesis", "mega drive"],
  n64: ["nintendo 64"],
  nes: ["nes", "nintendo entertainment system"],
  ps1: ["playstation"],
  ps2: ["playstation 2"],
  ps3: ["playstation 3"],
  ps4: ["playstation 4"],
  ps5: ["playstation 5"],
  psp: ["playstation portable", "psp"],
  saturn: ["saturn"],
  snes: ["snes", "super nintendo"],
  switch: ["nintendo switch"],
  vita: ["playstation vita", "ps vita"],
  wii: ["wii"],
  xbox: ["xbox"],
  xbox360: ["xbox 360"],
};

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) return;
      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    });
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleKey(value) {
  return normalize(value)
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleLooksExact(localTitle, remoteTitle) {
  const local = titleKey(localTitle);
  const remote = titleKey(remoteTitle);
  if (!local || !remote) return false;
  if (local === remote) return true;
  return local.length > 8 && (remote.startsWith(`${local} `) || local.startsWith(`${remote} `));
}

function hasImage(game) {
  return Boolean(game.imageUrl || game.boxArtUrl || game.coverUrl || game.coverImage || game.thumbnailUrl);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMobyJson(url, label) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "GamesCardsExchange/0.1 local MobyGames image enrichment",
        },
      });
    } catch {
      await sleep(1800 * (attempt + 1));
      continue;
    }
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) throw new Error(`${label} returned ${response.status}`);
    await sleep(1800 * (attempt + 1));
  }
  throw new Error(`${label} failed repeatedly.`);
}

function platformName(value) {
  return normalize(value?.platform_name || value?.name || value?.platform || value || "");
}

function matchingPlatform(gameResult, slug) {
  const wanted = (platformAliases[slug] || []).map(normalize);
  if (!wanted.length) return null;
  const platforms = gameResult.platforms || [];
  return platforms.find((platform) => {
    const name = platformName(platform);
    return wanted.some((alias) => name === alias || name.includes(alias) || alias.includes(name));
  }) || null;
}

function gameId(gameResult) {
  return gameResult.game_id || gameResult.id || gameResult.moby_id || "";
}

function platformId(platform) {
  return platform?.platform_id || platform?.id || "";
}

function resultUrl(gameResult) {
  return gameResult.moby_url || gameResult.url || (gameId(gameResult) ? `https://www.mobygames.com/game/${gameId(gameResult)}/` : "https://www.mobygames.com/");
}

async function searchMobyGames(game, slug, apiKey) {
  const url = new URL("https://api.mobygames.com/v1/games");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("title", game.title || "");
  url.searchParams.set("limit", "10");

  const result = await fetchMobyJson(url, "MobyGames search");
  const games = result.games || result.results || [];
  for (const candidate of games) {
    if (!titleLooksExact(game.title, candidate.title || candidate.name)) continue;
    const platform = matchingPlatform(candidate, slug);
    if (!platform) continue;
    return { game: candidate, platform };
  }
  return null;
}

function coverImageFromSearch(match) {
  const cover = match.game.sample_cover || match.game.cover || match.game.cover_image;
  if (!cover) return null;
  const url = cover.image_url || cover.url || cover.thumbnail_image_url || cover.thumbnail_url || "";
  if (!url) return null;
  return { url, role: cover.scan_of || cover.type || "sample cover" };
}

async function fetchCoverImage(match, apiKey) {
  const gid = gameId(match.game);
  const pid = platformId(match.platform);
  if (!gid || !pid) return null;

  const url = new URL(`https://api.mobygames.com/v1/games/${gid}/platforms/${pid}/covers`);
  url.searchParams.set("api_key", apiKey);
  const result = await fetchMobyJson(url, "MobyGames covers");
  const groups = result.cover_groups || result.covers || [];
  const frontLike = [];
  const fallback = [];

  for (const group of groups) {
    for (const image of group.images || group.cover_images || []) {
      const imageUrl = image.image_url || image.url || image.thumbnail_image_url || image.thumbnail_url || "";
      if (!imageUrl) continue;
      const role = normalize(image.scan_of || group.scan_of || image.type || group.type || "");
      const item = { url: imageUrl, role: role || "cover" };
      fallback.push(item);
      if (/front|box|cover/.test(role)) frontLike.push(item);
    }
  }

  return frontLike[0] || fallback[0] || coverImageFromSearch(match);
}

function imageCount(games) {
  return games.filter(hasImage).length;
}

async function enrichPlatform(slug, apiKey) {
  const dataPath = path.join(gamesDir, `${slug}.json`);
  const manifestPath = path.join(gamesDir, `${slug}-manifest.json`);
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) return null;

  let targets = games.filter((game) => !hasImage(game));
  if (limit > 0) targets = targets.slice(0, limit);

  const stats = { platform: slug, targets: targets.length, matched: 0, images: 0, skippedNoMatch: 0, skippedNoImage: 0, failed: 0 };
  const samples = [];
  let changedSinceCheckpoint = 0;

  function checkpoint() {
    if (dryRun || !changedSinceCheckpoint) return;
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      mobyGamesEnrichedAt: new Date().toISOString(),
      mobyGamesStats: stats,
      imageCount: imageCount(games),
      missingImageCount: games.length - imageCount(games),
    });
    changedSinceCheckpoint = 0;
  }

  for (const game of targets) {
    try {
      const match = await searchMobyGames(game, slug, apiKey);
      if (!match) {
        stats.skippedNoMatch += 1;
        await sleep(250);
        continue;
      }
      stats.matched += 1;

      const image = await fetchCoverImage(match, apiKey);
      if (!image?.url) {
        stats.skippedNoImage += 1;
        await sleep(250);
        continue;
      }

      if (!dryRun) {
        game.imageUrl = image.url;
        game.imageSourceUrl = resultUrl(match.game);
        game.imageProvider = "MobyGames";
        game.imageMatchedTitle = match.game.title || match.game.name || "";
        game.imageRole = image.role;
        game.mobyGamesId = gameId(match.game);
        game.mobyGamesPlatformId = platformId(match.platform);
        game.healthUpdatedAt = new Date().toISOString();
      }
      changedSinceCheckpoint += 1;
      stats.images += 1;

      if (sample && samples.length < 10) {
        samples.push({
          title: game.title,
          mobyTitle: match.game.title || match.game.name || "",
          image: image.url,
          platform: platformName(match.platform),
        });
      }
    } catch {
      stats.failed += 1;
    }

    if (changedSinceCheckpoint >= checkpointEvery) checkpoint();
    await sleep(450);
  }

  checkpoint();
  if (!dryRun && stats.images) {
    writeJson(manifestPath, {
      ...manifest,
      mobyGamesEnrichedAt: new Date().toISOString(),
      mobyGamesStats: stats,
      imageCount: imageCount(games),
      missingImageCount: games.length - imageCount(games),
    });
  }

  if (sample && samples.length) console.table(samples);
  return stats;
}

async function main() {
  loadEnvFile();
  const apiKey = process.env.MOBYGAMES_API_KEY;
  if (!apiKey) {
    console.error("Missing MOBYGAMES_API_KEY in .env. Add a MobyGames API key before running this importer.");
    process.exitCode = 1;
    return;
  }

  const platforms = requestedPlatforms.length ? requestedPlatforms : Object.keys(platformAliases);
  const results = [];
  for (const slug of platforms) {
    const result = await enrichPlatform(slug, apiKey);
    if (result) results.push(result);
  }
  console.table(results);
  if (dryRun) console.log("Dry run only; no files were changed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
