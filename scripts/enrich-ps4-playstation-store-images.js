const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ps4.json");
const manifestPath = path.join(rootDir, "data", "games", "ps4-manifest.json");
const cacheDir = path.join(rootDir, ".cache", "ps4-playstation-store-images");
const cachePath = path.join(cacheDir, "search-cache.json");
const searchHash = "4df6284f982e57bec70f23c77e2c219dc792eb19af7fb3d3a81767aa3f1958aa";
const searchEndpoint = "https://web.np.playstation.com/api/graphql/v1//op";

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

async function asyncPool(items, worker, concurrency = 8) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

function replaceRomanNumerals(value) {
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

function normalizeTitle(value) {
  return replaceRomanNumerals(value)
    .replace(/[™®©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(ps4|playstation 4|playstation hits|digital|download)\b/gi, "")
    .replace(/\b(edition|bundle|standard|game of the year|goty)\b/gi, "")
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

function isPs4FullGame(product) {
  const platforms = product.platforms || [];
  const classification = String(product.storeDisplayClassification || product.localizedStoreDisplayClassification || "");
  const name = String(product.name || "");
  return (
    platforms.includes("PS4") &&
    /full.?game|premium.?edition|game.?bundle/i.test(classification) &&
    !(/\bps5\b/i.test(name) && !/\bps4\b/i.test(name))
  );
}

function isLikelyNonGameProduct(product, game) {
  const name = normalizeTitle(product.name);
  const gameTitle = normalizeTitle(game.title);
  const terms = [
    "add on",
    "avatar",
    "comic",
    "currency",
    "deluxe upgrade",
    "dlc",
    "episode",
    "expansion",
    "pack",
    "season pass",
    "soundtrack",
    "theme",
    "upgrade",
    "virtual currency",
  ];
  return terms.some((term) => name.includes(term) && !gameTitle.includes(term));
}

function scoreProduct(game, product) {
  if (!product?.name) return -1;
  if (product.__typename !== "Product") return -1;
  if (!isPs4FullGame(product)) return -1;
  if (isLikelyNonGameProduct(product, game)) return -1;

  const gameTitle = normalizeTitle(game.title);
  const productTitle = normalizeTitle(product.name);
  const aliases = (game.aliases || []).map(normalizeTitle).filter(Boolean);
  const candidates = [gameTitle, ...aliases];
  let score = 0;

  const exact = candidates.includes(productTitle);
  const safeEdition = candidates.some((title) => {
    if (!productTitle.startsWith(title) || title.length < 5) return false;
    const suffix = productTitle.slice(title.length).trim();
    return /^(deluxe|complete|ultimate|royal|remastered|definitive|anniversary|special|premium)\b/i.test(suffix);
  });
  const safeShort = candidates.some((title) => {
    if (!title.startsWith(productTitle) || productTitle.length < 8) return false;
    const suffix = title.slice(productTitle.length).trim();
    if (/^(\d+|[ivxlcdm]+|sequel|prequel)\b/i.test(suffix)) return false;
    return productTitle.length / title.length >= 0.6;
  });
  const safeSubtitle = candidates.some((title) => {
    if (!productTitle.startsWith(title) || title.length < 5) return false;
    const suffix = productTitle.slice(title.length).trim();
    if (!suffix) return false;
    if (/^(demo|trial|beta|soundtrack|avatar|theme|currency|add on|dlc|season pass)\b/i.test(suffix)) return false;
    if (/^(\d+|[ivxlcdm]+|sequel|prequel)\b/i.test(suffix)) return false;
    return /^[-:]/.test(String(product.name || "").slice(String(game.title || "").length).trim()) || suffix.length <= 32;
  });

  if (!exact && !safeEdition && !safeShort && !safeSubtitle) return -1;
  if (exact) score += 1000;
  if (safeEdition) score += 720;
  if (safeShort) score += 760;
  if (safeSubtitle) score += 710;
  if ((product.platforms || []).length === 1 && product.platforms[0] === "PS4") score += 80;
  if ((product.platforms || []).includes("PS4")) score += 120;
  if (/full.?game/i.test(product.storeDisplayClassification || "")) score += 40;

  const publisher = normalizeTitle(game.publisher);
  const storeName = normalizeTitle(product.name);
  if (publisher && storeName.includes(publisher)) score += 5;

  return score;
}

function chooseImage(product) {
  const media = (product.media || []).filter((item) => item.type === "IMAGE" && item.url);
  const roles = ["GAMEHUB_COVER_ART", "EDITION_KEY_ART", "MASTER", "PORTRAIT_BANNER", "FOUR_BY_THREE_BANNER", "BACKGROUND"];
  for (const role of roles) {
    const item = media.find((candidate) => candidate.role === role);
    if (item) return { url: item.url, role };
  }
  const fallback = media.find((item) => !/SCREENSHOT|LOGO/i.test(item.role || ""));
  return fallback ? { url: fallback.url, role: fallback.role || "IMAGE" } : null;
}

function productSourceUrl(product) {
  return `https://store.playstation.com/en-us/product/${encodeURIComponent(product.id)}`;
}

async function searchPlayStationStore(query) {
  const variables = {
    countryCode: "US",
    languageCode: "en",
    nextCursor: "",
    pageOffset: 0,
    pageSize: 12,
    searchTerm: query,
  };
  const extensions = {
    persistedQuery: {
      version: 1,
      sha256Hash: searchHash,
    },
  };
  const params = new URLSearchParams({
    operationName: "getSearchResults",
    variables: JSON.stringify(variables),
    extensions: JSON.stringify(extensions),
  });
  const response = await fetch(`${searchEndpoint}?${params}`, {
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-psn-store-locale-override": "en-US",
      "x-psn-app-ver": "@sie-ppr-web-store/app/0.113.0-",
      "apollographql-client-name": "@sie-ppr-web-store/app",
      "apollographql-client-version": "0.113.0",
      referer: "https://store.playstation.com/",
      "User-Agent": "GamesCardsExchange/0.1 (local PS4 PlayStation Store image enrichment)",
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`PlayStation Store search returned ${response.status}: ${text.slice(0, 180)}`);
  return JSON.parse(text).data?.universalSearch?.results || [];
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
  if (!Array.isArray(games)) throw new Error("PS4 game data was not found. Run the PS4 importer first.");

  const candidates = games.filter((game) => force || !game.imageUrl).slice(0, limit || undefined);
  let searched = 0;
  let cached = 0;
  let matched = 0;
  let skipped = 0;
  const unmatched = [];
  const noImage = [];
  const uncertain = [];

  for (let index = 0; index < candidates.length; index += 32) {
    const batch = candidates.slice(index, index + 32);
    const toFetch = [];

    for (const game of batch) {
      const query = compactQuery(game.title);
      if (cache[query]) {
        cached += 1;
      } else {
        toFetch.push(query);
      }
    }

    await asyncPool(
      toFetch,
      async (query) => {
        cache[query] = {
          savedAt: new Date().toISOString(),
          hits: await searchPlayStationStore(query),
        };
      },
      8
    );
    if (toFetch.length) {
      searched += toFetch.length;
      writeJson(cachePath, cache);
      await wait(120);
    }

    for (const game of batch) {
      const query = compactQuery(game.title);
      const hits = cache[query]?.hits || [];
      const ranked = hits
        .map((product) => ({ product, score: scoreProduct(game, product), image: chooseImage(product) }))
        .filter((item) => item.score >= 700)
        .sort((a, b) => b.score - a.score);

      const best = ranked[0];
      if (!best) {
        skipped += 1;
        if (unmatched.length < 40) unmatched.push(game.title);
        continue;
      }
      if (!best.image) {
        skipped += 1;
        if (noImage.length < 40) noImage.push({ title: game.title, matchedTitle: best.product.name });
        continue;
      }
      if (best.score < 900 && uncertain.length < 40) {
        uncertain.push({ title: game.title, matchedTitle: best.product.name, score: best.score });
      }

      matched += 1;
      if (!dryRun) {
        game.imageUrl = best.image.url;
        game.imageSourceUrl = productSourceUrl(best.product);
        game.imageProvider = "PlayStation Store official search";
        game.imageMatchedTitle = best.product.name;
        game.imageMatchScore = best.score;
        game.imageRole = best.image.role;
        game.playStationStoreProductId = best.product.id;
        game.playStationNpTitleId = best.product.npTitleId || "";
        game.healthUpdatedAt = new Date().toISOString();
      }
    }

    console.log(`Processed ${Math.min(index + batch.length, candidates.length)}/${candidates.length} PS4 image candidates...`);
  }

  const imageCount = games.filter((game) => game.imageUrl).length;
  const report = {
    ...manifest,
    playStationStoreImageEnrichedAt: new Date().toISOString(),
    playStationStoreImageSource: "Sony PlayStation Store public search GraphQL",
    playStationStoreImagePolicy:
      "Images are applied only to confident PlayStation Store full-game Product results with PS4 in the platform list. DLC, themes, comics, currency, upgrades, and ambiguous matches are left blank.",
    playStationStoreImageStats: {
      total: games.length,
      candidates: candidates.length,
      searched,
      cached,
      matched,
      skipped,
      images: imageCount,
      missingImages: games.length - imageCount,
      dryRun,
    },
    playStationStoreImageSamples: {
      unmatched,
      noImage,
      uncertain,
    },
    imageCount,
    missingImageCount: games.length - imageCount,
  };

  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, report);
    writeJson(cachePath, cache);
  }

  console.log(`Matched PlayStation Store images: ${matched}/${candidates.length}.`);
  console.log(`PS4 images available: ${imageCount}/${games.length}.`);
  console.log(`Still missing images: ${games.length - imageCount}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
