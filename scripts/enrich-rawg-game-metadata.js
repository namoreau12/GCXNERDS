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
const imagesOnly = flags.has("--images-only");
const overviewsOnly = flags.has("--overviews-only");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;
const checkpointEveryArg = args.find((arg) => arg.startsWith("--checkpoint-every="));
const checkpointEvery = Math.max(1, Number(checkpointEveryArg?.split("=")[1] || 25));

const rawgPlatforms = {
  "3ds": 8,
  dreamcast: 106,
  ds: 9,
  gameboy: "26,43",
  gamecube: 105,
  gba: 24,
  genesis: 167,
  n64: 83,
  nes: 49,
  ps1: 27,
  ps2: 15,
  ps3: 16,
  ps4: 18,
  ps5: 187,
  psp: 17,
  saturn: 107,
  snes: 79,
  switch: 7,
  vita: 19,
  wii: 11,
  xbox: 80,
  xbox360: 14,
};

const genericPhrases = [
  "officially released",
  "official release",
  "game record",
  "licensed north american",
  "software list",
  "cataloged nes release",
  "catalogued nes release",
];

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
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleKey(value) {
  return normalize(value)
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\b(playstation|ps1|ps2|ps3|ps4|ps5|nintendo|switch|wii|xbox|game boy|gameboy|advance|color|portable)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleLooksExact(localTitle, rawgTitle) {
  const local = titleKey(localTitle);
  const remote = titleKey(rawgTitle);
  if (!local || !remote) return false;
  if (local === remote) return true;
  return local.length > 8 && (remote.startsWith(`${local} `) || local.startsWith(`${remote} `));
}

function list(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function hasImage(game) {
  return Boolean(game.imageUrl || game.boxArtUrl || game.coverUrl || game.coverImage || game.thumbnailUrl);
}

function hasUsefulOverview(game) {
  return [game.description, game.gcxOverview, game.overview].some((overview) => {
    const text = String(overview || "").trim();
    if (text.length < 80) return false;
    const normalized = normalize(text);
    return !genericPhrases.some((phrase) => normalized.includes(phrase));
  });
}

function platformMatches(result, slug) {
  const wanted = String(rawgPlatforms[slug] || "");
  if (!wanted) return true;
  const wantedIds = new Set(wanted.split(",").map(Number));
  const platformIds = (result.platforms || [])
    .map((item) => item.platform?.id)
    .filter((id) => Number.isFinite(id));
  return platformIds.some((id) => wantedIds.has(id));
}

function rawgList(values, property = "name") {
  return (values || []).map((item) => item?.[property]).filter(Boolean).slice(0, 3);
}

function makeMetadataOverview(game, detail) {
  const title = game.title || detail.name || "";
  const platform = game.platform || "";
  const genres = rawgList(detail.genres);
  const tags = rawgList(detail.tags);
  const developers = rawgList(detail.developers);
  const publishers = rawgList(detail.publishers);
  const released = detail.released ? ` first released in ${String(detail.released).slice(0, 4)}` : "";
  const descriptor = genres.length ? genres.join(", ") : tags.slice(0, 2).join(", ");
  if (!title || !descriptor) return "";

  const creator = [
    developers.length ? `developed by ${developers.join(", ")}` : "",
    publishers.length ? `published by ${publishers.join(", ")}` : "",
  ].filter(Boolean).join(" and ");
  const lead = `${title} is a ${descriptor} game${platform ? ` for ${platform}` : ""}${creator ? ` ${creator}` : ""}${released}.`;
  const play = `The record points to play built around ${descriptor.toLowerCase()} conventions, so the library entry should help visitors identify the kind of experience, the platform version, and the collector-relevant release at a glance.`;
  const catalog = `For GCX, the important identifiers are the platform release, title spelling, publisher/developer credits, and cover art match rather than broad franchise information.`;
  return `${lead} ${play} ${catalog}`;
}

function updateSearchText(game) {
  const values = [
    game.title,
    game.platform,
    ...list(game.publishers),
    ...list(game.developers),
    ...list(game.genres),
    game.publisher,
    game.developer,
    game.description,
  ];
  game.searchText = normalize(values.join(" "));
}

function statusCounts(games) {
  return games.reduce((counts, game) => {
    const status = game.overviewStatus || "unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

function imageCount(games) {
  return games.filter(hasImage).length;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRawgJson(url, label) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "GamesCardsExchange/0.1 local data enrichment",
        },
      });
    } catch (error) {
      await sleep(1800 * (attempt + 1));
      continue;
    }
    if (response.ok) return response.json();
    if (response.status !== 429 && response.status < 500) throw new Error(`${label} returned ${response.status}`);
    await sleep(1400 * (attempt + 1));
  }
  throw new Error(`${label} failed repeatedly.`);
}

async function searchRawgOnce(game, slug, apiKey, precise) {
  const url = new URL("https://api.rawg.io/api/games");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("search", game.title || "");
  url.searchParams.set("page_size", precise ? "5" : "10");
  if (precise) url.searchParams.set("search_precise", "true");
  if (rawgPlatforms[slug]) url.searchParams.set("platforms", String(rawgPlatforms[slug]));

  const result = await fetchRawgJson(url, "RAWG search");
  const matches = result.results || [];
  return matches.find((match) => titleLooksExact(game.title, match.name) && platformMatches(match, slug)) || null;
}

async function searchRawg(game, slug, apiKey) {
  return (await searchRawgOnce(game, slug, apiKey, true)) || (await searchRawgOnce(game, slug, apiKey, false));
}

async function fetchRawgDetail(id, apiKey) {
  const url = new URL(`https://api.rawg.io/api/games/${id}`);
  url.searchParams.set("key", apiKey);
  return fetchRawgJson(url, "RAWG detail");
}

async function enrichPlatform(slug, apiKey) {
  const dataPath = path.join(gamesDir, `${slug}.json`);
  const manifestPath = path.join(gamesDir, `${slug}-manifest.json`);
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) return null;

  let targets = games.filter((game) => {
    const needsImage = !overviewsOnly && !hasImage(game);
    const needsOverview = !imagesOnly && !hasUsefulOverview(game);
    return needsImage || needsOverview;
  });
  if (limit > 0) targets = targets.slice(0, limit);

  const stats = { platform: slug, targets: targets.length, matched: 0, images: 0, overviews: 0, skippedNoMatch: 0, failed: 0 };
  const samples = [];
  let changedSinceCheckpoint = 0;

  function checkpoint() {
    if (dryRun || !changedSinceCheckpoint) return;
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      rawgEnrichedAt: new Date().toISOString(),
      rawgStats: stats,
      imageCount: imageCount(games),
      missingImageCount: games.length - imageCount(games),
      overviewStatusCounts: statusCounts(games),
    });
    changedSinceCheckpoint = 0;
  }

  for (const game of targets) {
    try {
      const match = await searchRawg(game, slug, apiKey);
      if (!match) {
        stats.skippedNoMatch += 1;
        continue;
      }

      let detail = null;
      if (!imagesOnly && !hasUsefulOverview(game)) {
        detail = await fetchRawgDetail(match.id, apiKey);
        await sleep(250);
      }

      if (!overviewsOnly && !hasImage(game) && match.background_image) {
        if (!dryRun) {
          game.imageUrl = match.background_image;
          game.imageProvider = "RAWG";
          game.imageSourceUrl = `https://rawg.io/games/${match.slug || match.id}`;
          game.imageMatchedTitle = match.name;
          game.healthUpdatedAt = new Date().toISOString();
        }
        changedSinceCheckpoint += 1;
        stats.images += 1;
      }

      if (!imagesOnly && !hasUsefulOverview(game) && detail) {
        const overview = makeMetadataOverview(game, detail);
        if (overview.length >= 160) {
          if (!dryRun) {
            game.description = overview;
            game.descriptionProvider = "GCX metadata editorial overview via RAWG";
            game.descriptionSourceUrl = `https://rawg.io/games/${detail.slug || match.slug || match.id}`;
            game.overviewStatus = "published";
            game.healthUpdatedAt = new Date().toISOString();
            updateSearchText(game);
          }
          changedSinceCheckpoint += 1;
          stats.overviews += 1;
        }
      }

      stats.matched += 1;
      if (sample && samples.length < 8) {
        samples.push({
          title: game.title,
          rawgTitle: match.name,
          image: match.background_image || "",
          overview: detail ? makeMetadataOverview(game, detail).slice(0, 220) : "",
        });
      }
    } catch (error) {
      stats.failed += 1;
    }
    if (changedSinceCheckpoint >= checkpointEvery) checkpoint();
    await sleep(350);
  }

  checkpoint();
  if (!dryRun && (stats.images || stats.overviews)) {
    writeJson(manifestPath, {
      ...manifest,
      rawgEnrichedAt: new Date().toISOString(),
      rawgStats: stats,
      imageCount: imageCount(games),
      missingImageCount: games.length - imageCount(games),
      overviewStatusCounts: statusCounts(games),
    });
  }

  if (sample && samples.length) console.table(samples);
  return stats;
}

async function main() {
  loadEnvFile();
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.error("Missing RAWG_API_KEY in .env. Create a RAWG API key and add RAWG_API_KEY=your_key_here before running this importer.");
    process.exitCode = 1;
    return;
  }

  const platforms = requestedPlatforms.length ? requestedPlatforms : Object.keys(rawgPlatforms);
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
