const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "switch.json");
const manifestPath = path.join(rootDir, "data", "games", "switch-manifest.json");
const cacheDir = path.join(rootDir, ".cache", "switch-nintendo-images");
const cachePath = path.join(cacheDir, "title-cache.json");
const algoliaAppId = "U3B6GR4UA3";
const algoliaApiKey = "a29c6927638bfd8cee23993e51e721c9";
const algoliaIndex = "store_game_en_us";
const algoliaUrl = `https://${algoliaAppId}-dsn.algolia.net/1/indexes/*/queries`;
const imageBaseUrl = "https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.5/c_scale,w_500/";
const sourceBaseUrl = "https://www.nintendo.com/us/store/products/";

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function ensureDirs() {
  fs.mkdirSync(cacheDir, { recursive: true });
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeTitle(value) {
  return String(value || "")
    .replace(/[™®©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\btm\b/gi, "")
    .replace(/\bneo\s*geo\b/gi, "neogeo")
    .replace(/&/g, " and ")
    .replace(/\b(nintendo switch|switch)\b/gim, "")
    .replace(/\b(edition|digital|download)\b/gim, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function compactQuery(value) {
  return String(value || "")
    .replace(/[™®©]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasNintendoSwitchPlatform(hit) {
  return (hit.corePlatforms || []).some((platform) => normalizeTitle(platform) === "nintendo") || hit.platformCode === "NINTENDO_SWITCH" || normalizeTitle(hit.platform) === "nintendo";
}

function isLikelyAddOn(hit, game) {
  const title = normalizeTitle(hit.title);
  const gameTitle = normalizeTitle(game.title);
  const addOnTerms = ["upgrade pack", "expansion pass", "dlc", "bonus pack", "add on", "currency", "coins", "crystals"];
  return addOnTerms.some((term) => title.includes(term) && !gameTitle.includes(term));
}

function productImageUrl(publicId) {
  if (!publicId) return "";
  return `${imageBaseUrl}${String(publicId).replace(/^\/+/, "")}`;
}

function productSourceUrl(hit) {
  if (hit.url) return hit.url.startsWith("http") ? hit.url : `https://www.nintendo.com${hit.url}`;
  if (hit.slug) return `${sourceBaseUrl}${hit.slug}/`;
  if (hit.titleKey) return `${sourceBaseUrl}${hit.titleKey}/`;
  return "https://www.nintendo.com/us/store/games/";
}

function scoreHit(game, hit) {
  if (!hit?.title || !hit.productImage) return -1;
  if (!hasNintendoSwitchPlatform(hit)) return -1;
  if (isLikelyAddOn(hit, game)) return -1;

  const gameTitle = normalizeTitle(game.title);
  const hitTitle = normalizeTitle(hit.title);
  const aliases = (game.aliases || []).map(normalizeTitle).filter(Boolean);
  const candidateTitles = [gameTitle, ...aliases];
  let score = 0;
  const exactMatch = candidateTitles.includes(hitTitle);
  const safeShortTitle = candidateTitles.some((title) => {
    if (!title.startsWith(hitTitle) || hitTitle.length < 8) return false;
    const suffix = title.slice(hitTitle.length).trim();
    if (!suffix) return false;
    if (/^(sequel|prequel|\d+|[ivxlcdm]+)\b/i.test(suffix)) return false;
    return hitTitle.length / title.length >= 0.55;
  });
  const safeEditionTitle = candidateTitles.some((title) => {
    if (!hitTitle.startsWith(title) || title.length < 5) return false;
    const suffix = hitTitle.slice(title.length).trim();
    return /^(cloud|cloud version|deluxe|ultimate|complete|anniversary|definitive|remastered|remake|special)\b/i.test(suffix);
  });

  if (!exactMatch && !safeShortTitle && !safeEditionTitle) return -1;

  if (exactMatch) score += 1000;
  if (safeShortTitle) score += 760;
  if (safeEditionTitle) score += 720;
  if (hit.platformCode === "NINTENDO_SWITCH") score += 120;
  if ((hit.corePlatforms || []).includes("Nintendo Switch")) score += 100;
  if (normalizeTitle(hit.platform) === "nintendo") score += 30;
  if (hit.stockStatus === "IN_STOCK") score += 10;

  const gamePublisher = normalizeTitle(game.publisher);
  const hitPublisher = normalizeTitle(hit.publisher || hit.publishers?.[0] || "");
  if (gamePublisher && hitPublisher && (gamePublisher.includes(hitPublisher) || hitPublisher.includes(gamePublisher))) score += 25;

  return score;
}

async function algoliaMultiQuery(titles) {
  const response = await fetch(algoliaUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Algolia-API-Key": algoliaApiKey,
      "X-Algolia-Application-Id": algoliaAppId,
      "User-Agent": "GamesCardsExchange/0.1 (local Switch Nintendo image enrichment)",
    },
    body: JSON.stringify({
      requests: titles.map((title) => ({
        indexName: algoliaIndex,
        query: title,
        params: new URLSearchParams({
          hitsPerPage: "8",
          filters: 'corePlatforms:"Nintendo Switch"',
          attributesToRetrieve: [
            "objectID",
            "title",
            "titleKey",
            "slug",
            "url",
            "productImage",
            "platform",
            "platformCode",
            "corePlatforms",
            "publisher",
            "publishers",
            "releaseDate",
            "releaseDateDisplay",
            "stockStatus",
            "topLevelCategory",
            "topLevelFilters",
          ].join(","),
        }).toString(),
      })),
    }),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`Nintendo Algolia search returned ${response.status}: ${text.slice(0, 160)}`);
  return JSON.parse(text).results || [];
}

function parseArgs() {
  const args = new Map();
  process.argv.slice(2).forEach((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    args.set(key, value || "true");
  });
  return {
    limit: Number(args.get("limit") || 0),
    force: args.has("force"),
    dryRun: args.has("dry-run"),
  };
}

async function main() {
  ensureDirs();
  const { limit, force, dryRun } = parseArgs();
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  const cache = readJsonIfExists(cachePath, {});

  if (!Array.isArray(games)) throw new Error("Switch game data was not found. Run the Switch importer first.");

  const candidates = games.filter((game) => force || !game.imageUrl).slice(0, limit || undefined);
  let searched = 0;
  let matched = 0;
  let skipped = 0;
  let cached = 0;
  const unmatched = [];
  const uncertain = [];

  for (let index = 0; index < candidates.length; index += 25) {
    const batch = candidates.slice(index, index + 25);
    const toFetch = [];

    for (const game of batch) {
      const query = compactQuery(game.title);
      if (cache[query]) {
        cached += 1;
        continue;
      }
      toFetch.push(query);
    }

    if (toFetch.length) {
      const results = await algoliaMultiQuery(toFetch);
      toFetch.forEach((query, resultIndex) => {
        cache[query] = {
          savedAt: new Date().toISOString(),
          hits: results[resultIndex]?.hits || [],
        };
      });
      searched += toFetch.length;
      await wait(120);
    }

    for (const game of batch) {
      const query = compactQuery(game.title);
      const hits = cache[query]?.hits || [];
      const ranked = hits
        .map((hit) => ({ hit, score: scoreHit(game, hit) }))
        .filter((item) => item.score >= 700)
        .sort((a, b) => b.score - a.score);

      const best = ranked[0];
      if (!best) {
        skipped += 1;
        if (unmatched.length < 40) unmatched.push(game.title);
        continue;
      }

      if (best.score < 900 && uncertain.length < 40) {
        uncertain.push({ title: game.title, matchedTitle: best.hit.title, score: best.score });
      }

      matched += 1;
      if (!dryRun) {
        game.imageUrl = productImageUrl(best.hit.productImage);
        game.imageSourceUrl = productSourceUrl(best.hit);
        game.imageProvider = "Nintendo official store search";
        game.imageMatchedTitle = best.hit.title;
        game.imageMatchScore = best.score;
        game.nintendoStoreObjectId = best.hit.objectID || "";
        game.healthUpdatedAt = new Date().toISOString();
      }
    }

    console.log(`Processed ${Math.min(index + batch.length, candidates.length)}/${candidates.length} Switch image candidates...`);
    writeJson(cachePath, cache);
  }

  const imageCount = games.filter((game) => game.imageUrl).length;
  const report = {
    ...manifest,
    nintendoImageEnrichedAt: new Date().toISOString(),
    nintendoImageSource: "Nintendo official store Algolia search index",
    nintendoImageSourceUrl: "https://www.nintendo.com/us/store/games/",
    nintendoImageCandidates: candidates.length,
    nintendoImageSearched: searched,
    nintendoImageCacheHits: cached,
    nintendoImageLatestRunMatchCount: matched,
    nintendoImageTotalProviderCount: games.filter((game) => game.imageProvider === "Nintendo official store search").length,
    nintendoImageSkippedCount: skipped,
    nintendoImageUnmatchedSamples: unmatched,
    nintendoImageUncertainSamples: uncertain,
    imageCount,
    missingImageCount: games.length - imageCount,
  };

  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, report);
  }

  console.log(JSON.stringify({
    dryRun,
    candidates: candidates.length,
    searched,
    cached,
    matched,
    skipped,
    imageCount,
    missingImageCount: games.length - imageCount,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
