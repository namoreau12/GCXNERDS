const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ps5.json");
const manifestPath = path.join(rootDir, "data", "games", "ps5-manifest.json");
const cacheDir = path.join(rootDir, ".cache", "ps5-playstation-store-images");
const cachePath = path.join(cacheDir, "search-cache.json");
const searchHash = "4df6284f982e57bec70f23c77e2c219dc792eb19af7fb3d3a81767aa3f1958aa";
const searchEndpoint = "https://web.np.playstation.com/api/graphql/v1//op";

const regions = [
  { countryCode: "US", languageCode: "en", locale: "en-us", label: "US" },
  { countryCode: "GB", languageCode: "en", locale: "en-gb", label: "GB" },
];

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

function compactProduct(product) {
  return {
    __typename: product.__typename,
    id: product.id,
    name: product.name,
    npTitleId: product.npTitleId,
    platforms: product.platforms,
    storeDisplayClassification: product.storeDisplayClassification,
    localizedStoreDisplayClassification: product.localizedStoreDisplayClassification,
    media: (product.media || [])
      .filter((item) => item.type === "IMAGE" && item.url)
      .map((item) => ({ type: item.type, role: item.role, url: item.url })),
  };
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
    .replace(/[â„¢Â®Â©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(ps5|playstation 5|ps4|playstation 4|digital|download)\b/gi, "")
    .replace(/\b(edition|bundle|standard|game of the year|goty|full game)\b/gi, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function compactQuery(value) {
  return String(value || "")
    .replace(/[™®©]/g, "")
    .replace(/[â„¢Â®Â©]/g, "")
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function queryVariants(game) {
  const variants = new Set();
  for (const value of [game.title, ...(game.aliases || [])]) {
    const compact = compactQuery(value);
    if (!compact) continue;
    variants.add(compact);
    variants.add(compact.replace(/[#:]/g, " ").replace(/\s+/g, " ").trim());
    variants.add(replaceRomanNumerals(compact).replace(/\s+/g, " ").trim());
  }
  return Array.from(variants).filter(Boolean).slice(0, 3);
}

function regionsForGame(game) {
  const released = game.releasedRegions || [];
  const selected = [];
  if (released.includes("northAmerica")) selected.push(regions[0]);
  if (released.includes("pal")) selected.push(regions[1]);
  if (!selected.length) selected.push(regions[0]);
  return selected;
}

function isPs5FullGame(product) {
  const platforms = product.platforms || [];
  const classification = String(product.storeDisplayClassification || product.localizedStoreDisplayClassification || "");
  const name = String(product.name || "");
  return platforms.includes("PS5") && /full.?game|premium.?edition|game.?bundle/i.test(classification) && !/\bupgrade\b/i.test(name);
}

function isLikelyNonGameProduct(product, game) {
  const name = normalizeTitle(product.name);
  const gameTitle = normalizeTitle(game.title);
  const terms = [
    "add on",
    "avatar",
    "beta",
    "costume",
    "currency",
    "demo",
    "deluxe upgrade",
    "dlc",
    "episode",
    "expansion",
    "pack",
    "season pass",
    "soundtrack",
    "theme",
    "trial",
    "upgrade",
    "virtual currency",
  ];
  return terms.some((term) => name.includes(term) && !gameTitle.includes(term));
}

function scoreProduct(game, product, regionLabel) {
  if (!product?.name) return -1;
  if (product.__typename !== "Product") return -1;
  if (!isPs5FullGame(product)) return -1;
  if (isLikelyNonGameProduct(product, game)) return -1;

  const productTitle = normalizeTitle(product.name);
  const candidates = [game.title, ...(game.aliases || [])].map(normalizeTitle).filter(Boolean);

  const exact = candidates.includes(productTitle);
  const safeEdition = candidates.some((title) => {
    if (!productTitle.startsWith(title) || title.length < 5) return false;
    const suffix = productTitle.slice(title.length).trim();
    return /^(deluxe|complete|ultimate|royal|remastered|definitive|anniversary|special|premium|gold|collector)\b/i.test(suffix);
  });
  const safeShort = candidates.some((title) => {
    if (!title.startsWith(productTitle) || productTitle.length < 8) return false;
    const suffix = title.slice(productTitle.length).trim();
    if (/^(\d+|[ivxlcdm]+|sequel|prequel)\b/i.test(suffix)) return false;
    return productTitle.length / title.length >= 0.66;
  });
  const safeSubtitle = candidates.some((title) => {
    if (!productTitle.startsWith(title) || title.length < 5) return false;
    const suffix = productTitle.slice(title.length).trim();
    if (!suffix) return false;
    if (/^(demo|trial|beta|soundtrack|avatar|theme|currency|add on|dlc|season pass|upgrade)\b/i.test(suffix)) return false;
    if (/^(\d+|[ivxlcdm]+|sequel|prequel)\b/i.test(suffix)) return false;
    return /^[-:]/.test(String(product.name || "").slice(String(game.title || "").length).trim()) || suffix.length <= 34;
  });

  if (!exact && !safeEdition && !safeShort && !safeSubtitle) return -1;

  let score = 0;
  if (exact) score += 1000;
  if (safeEdition) score += 720;
  if (safeShort) score += 760;
  if (safeSubtitle) score += 710;
  if ((product.platforms || []).length === 1 && product.platforms[0] === "PS5") score += 110;
  if ((product.platforms || []).includes("PS5")) score += 130;
  if (/full.?game/i.test(product.storeDisplayClassification || "")) score += 50;
  if (regionLabel === "US" && (game.releasedRegions || []).includes("northAmerica")) score += 50;
  if (regionLabel === "GB" && (game.releasedRegions || []).includes("pal")) score += 50;
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

function productSourceUrl(product, region) {
  return `https://store.playstation.com/${region.locale}/product/${encodeURIComponent(product.id)}`;
}

async function searchPlayStationStore(query, region) {
  const variables = {
    countryCode: region.countryCode,
    languageCode: region.languageCode,
    nextCursor: "",
    pageOffset: 0,
    pageSize: 16,
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
      "x-psn-store-locale-override": `${region.languageCode}-${region.countryCode}`,
      "x-psn-app-ver": "@sie-ppr-web-store/app/0.113.0-",
      "apollographql-client-name": "@sie-ppr-web-store/app",
      "apollographql-client-version": "0.113.0",
      referer: "https://store.playstation.com/",
      "User-Agent": "GamesCardsExchange/0.1 (local PS5 PlayStation Store image enrichment)",
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`PlayStation Store search returned ${response.status}: ${text.slice(0, 180)}`);
  return (JSON.parse(text).data?.universalSearch?.results || []).map(compactProduct);
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
  if (!Array.isArray(games)) throw new Error("PS5 game data was not found. Run the PS5 importer first.");

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
    const requests = [];

    for (const game of batch) {
      for (const region of regionsForGame(game)) {
        for (const query of queryVariants(game)) {
          const cacheKey = `${region.countryCode}:${query}`;
          if (cache[cacheKey]) {
            cached += 1;
          } else {
            requests.push({ cacheKey, region, query });
          }
        }
      }
    }

    await asyncPool(
      requests,
      async ({ cacheKey, region, query }) => {
        cache[cacheKey] = {
          savedAt: new Date().toISOString(),
          hits: await searchPlayStationStore(query, region),
        };
      },
      8
    );
    if (requests.length) {
      searched += requests.length;
      writeJson(cachePath, cache);
      await wait(120);
    }

    for (const game of batch) {
      const ranked = [];
      for (const region of regionsForGame(game)) {
        for (const query of queryVariants(game)) {
          const cacheKey = `${region.countryCode}:${query}`;
          for (const product of cache[cacheKey]?.hits || []) {
            const score = scoreProduct(game, product, region.label);
            const image = chooseImage(product);
            if (score >= 700) ranked.push({ product, score, image, region, query });
          }
        }
      }
      ranked.sort((a, b) => b.score - a.score);

      const best = ranked[0];
      if (!best) {
        skipped += 1;
        if (unmatched.length < 60) unmatched.push(game.title);
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
        game.imageSourceUrl = productSourceUrl(best.product, best.region);
        game.imageProvider = "PlayStation Store official search";
        game.imageMatchedTitle = best.product.name;
        game.imageMatchScore = best.score;
        game.imageRole = best.image.role;
        game.playStationStoreProductId = best.product.id;
        game.playStationStoreRegion = best.region.label;
        game.playStationNpTitleId = best.product.npTitleId || "";
        game.healthUpdatedAt = new Date().toISOString();
      }
    }

    console.log(`Processed ${Math.min(index + batch.length, candidates.length)}/${candidates.length} PS5 image candidates...`);
  }

  const imageCount = games.filter((game) => game.imageUrl).length;
  const report = {
    ...manifest,
    playStationStoreImageEnrichedAt: new Date().toISOString(),
    playStationStoreImageSource: "Sony PlayStation Store public search GraphQL",
    playStationStoreImagePolicy:
      "Images are applied only to confident PlayStation Store Product results with PS5 in the platform list and full-game style classification. DLC, themes, currency, demos, trials, upgrades, and ambiguous matches are left blank.",
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

  console.log(`Matched PlayStation Store PS5 images: ${matched}/${candidates.length}.`);
  console.log(`PS5 images available: ${imageCount}/${games.length}.`);
  console.log(`Still missing images: ${games.length - imageCount}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
