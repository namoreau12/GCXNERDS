const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "vita.json");
const manifestPath = path.join(rootDir, "data", "games", "vita-manifest.json");
const cacheDir = path.join(rootDir, ".cache", "vita-playstation-chihiro-images");
const cachePath = path.join(cacheDir, "search-cache.json");

const regions = [
  { code: "US", language: "en", store: "en-us", label: "US" },
  { code: "GB", language: "en", store: "en-gb", label: "GB" },
  { code: "HK", language: "en", store: "en-hk", label: "HK" },
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

function compactProduct(product) {
  return {
    id: product.id,
    name: product.name,
    title_name: product.title_name,
    short_name: product.short_name,
    game_contentType: product.game_contentType,
    top_category: product.top_category,
    playable_platform: product.playable_platform,
    platforms: product.platforms,
    images: (product.images || []).map((image) => ({ type: image.type, url: image.url })).filter((image) => image.url),
    default_sku: product.default_sku
      ? {
          name: product.default_sku.name,
          platforms: product.default_sku.platforms,
        }
      : undefined,
    metadata: Object.fromEntries(
      [
        "playable_platform",
        "product_type",
        "store_display_classification",
        "secondary_classification",
        "top_category",
      ]
        .map((key) => [key, product.metadata?.[key]])
        .filter(([, value]) => value)
    ),
  };
}

function compactCache(cache) {
  let changed = false;
  for (const entry of Object.values(cache)) {
    if (!Array.isArray(entry?.hits)) continue;
    const compactHits = entry.hits.map(compactProduct);
    if (JSON.stringify(compactHits) !== JSON.stringify(entry.hits)) changed = true;
    entry.hits = compactHits;
  }
  return changed;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function asyncPool(items, worker, concurrency = 6) {
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

function normalizeTitle(value) {
  return String(value || "")
    .replace(/[™®©]/g, "")
    .replace(/[â„¢Â®Â©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/＆/g, "&")
    .replace(/&/g, " and ")
    .replace(/\b(ps vita|playstation vita|vita|psn|download|digital)\b/gi, "")
    .replace(/\b(edition|standard|full game|game)\b/gi, "")
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
  const values = [game.title, ...(game.aliases || [])];
  for (const value of values) {
    const compact = compactQuery(value);
    if (!compact) continue;
    variants.add(compact);
    variants.add(compact.replace(/[#:]/g, " ").replace(/\s+/g, " ").trim());
    variants.add(compact.replace(/[^a-z0-9]+/gi, "").trim());
  }
  return Array.from(variants).filter(Boolean).slice(0, 2);
}

function regionsForGame(game) {
  const releasedRegions = game.releasedRegions || [];
  const selected = [];
  if (releasedRegions.includes("northAmerica")) selected.push(regions[0]);
  if (releasedRegions.includes("europe")) selected.push(regions[1]);
  if (releasedRegions.includes("asia") || releasedRegions.includes("asiaJapan") || releasedRegions.includes("japan")) selected.push(regions[2]);
  if (!selected.length) selected.push(regions[0]);
  return selected;
}

function metadataValues(product, key) {
  const entry = product?.metadata?.[key];
  return Array.isArray(entry?.values) ? entry.values : [];
}

function hasVitaPlatform(product) {
  const values = [
    ...(product.platforms || []),
    ...(product.playable_platform || []),
    ...(product.default_sku?.platforms || []),
    ...metadataValues(product, "playable_platform"),
  ].map((value) => String(value).toLowerCase());
  if (values.some((value) => value.includes("vita"))) return true;
  return /^([A-Z]{2}\d{4}-)?PC[SAEBIJH]\d{5}_00-/i.test(product.id || "");
}

function isFullGame(product) {
  const productTypes = [
    product.game_contentType,
    product.top_category,
    product.default_sku?.name,
    ...metadataValues(product, "product_type"),
    ...metadataValues(product, "store_display_classification"),
    ...metadataValues(product, "secondary_classification"),
    ...metadataValues(product, "top_category"),
  ]
    .filter(Boolean)
    .join(" ");
  return /game|full.?game|premium.?game|downloadable.?game/i.test(productTypes);
}

function isLikelyNonGameProduct(product, game) {
  const name = normalizeTitle(product.name);
  const gameTitle = normalizeTitle(game.title);
  const terms = [
    "avatar",
    "costume",
    "demo",
    "dlc",
    "dynamic theme",
    "episode",
    "expansion",
    "map pack",
    "minion",
    "pack",
    "soundtrack",
    "theme",
    "trailer",
  ];
  return terms.some((term) => name.includes(term) && !gameTitle.includes(term));
}

function scoreProduct(game, product, regionLabel) {
  if (!product?.name || !product?.id) return -1;
  if (!hasVitaPlatform(product)) return -1;
  if (!isFullGame(product)) return -1;
  if (isLikelyNonGameProduct(product, game)) return -1;

  const productTitle = normalizeTitle(product.title_name || product.name);
  const candidates = [game.title, ...(game.aliases || [])].map(normalizeTitle).filter(Boolean);
  if (!productTitle || !candidates.length) return -1;

  const exact = candidates.includes(productTitle);
  const safeEdition = candidates.some((title) => {
    if (!productTitle.startsWith(title) || title.length < 5) return false;
    const suffix = productTitle.slice(title.length).trim();
    return /^(complete|deluxe|limited|ultimate|remastered|anniversary|plus|the complete)\b/i.test(suffix);
  });
  const safeShort = candidates.some((title) => {
    if (!title.startsWith(productTitle) || productTitle.length < 8) return false;
    const suffix = title.slice(productTitle.length).trim();
    if (/^(\d+|[ivxlcdm]+)\b/i.test(suffix)) return false;
    return productTitle.length / title.length >= 0.68;
  });

  if (!exact && !safeEdition && !safeShort) return -1;

  let score = 0;
  if (exact) score += 1000;
  if (safeEdition) score += 760;
  if (safeShort) score += 730;
  if (regionLabel === "US" && (game.releasedRegions || []).includes("northAmerica")) score += 80;
  if (regionLabel === "GB" && (game.releasedRegions || []).includes("europe")) score += 80;
  if (/^([A-Z]{2}\d{4}-)?PC[SAEB]\d{5}_00-/i.test(product.id)) score += 90;
  if (/full.?game|premium.?game/i.test(JSON.stringify(product.metadata || {}))) score += 40;
  if ((product.playable_platform || []).length === 1) score += 25;
  return score;
}

function chooseImage(product) {
  const images = (product.images || []).filter((image) => image?.url);
  const preference = [1, 10, 2, 9, 13, 12];
  for (const type of preference) {
    const image = images.find((candidate) => Number(candidate.type) === type);
    if (image) return { url: image.url, type };
  }
  const fallback = images[0];
  return fallback ? { url: fallback.url, type: fallback.type || "unknown" } : null;
}

function productSourceUrl(product, region) {
  return `https://store.playstation.com/${region.store}/product/${encodeURIComponent(product.id)}`;
}

async function searchChihiro(region, query) {
  const url = `https://store.playstation.com/store/api/chihiro/00_09_000/search/${region.code}/${region.language}/19/${encodeURIComponent(
    query
  )}?size=50&start=0`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local Vita PlayStation Store image enrichment)",
    },
  });
  const text = await response.text();
  if (response.status === 400 || response.status === 404) return { url, hits: [] };
  if (!response.ok) throw new Error(`PlayStation Chihiro search returned ${response.status} for ${url}: ${text.slice(0, 180)}`);
  return { url, hits: (JSON.parse(text).links || []).map(compactProduct) };
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
  const cacheCompacted = compactCache(cache);
  if (!Array.isArray(games)) throw new Error("Vita game data was not found. Run the Vita importer first.");
  if (cacheCompacted && !dryRun) writeJson(cachePath, cache);

  const candidates = games.filter((game) => force || !game.imageUrl).slice(0, limit || undefined);
  let searched = 0;
  let cached = 0;
  let matched = 0;
  let skipped = 0;
  const unmatched = [];
  const noImage = [];
  const uncertain = [];

  for (let index = 0; index < candidates.length; index += 24) {
    const batch = candidates.slice(index, index + 24);
    const requests = [];

    for (const game of batch) {
      for (const region of regionsForGame(game)) {
        for (const query of queryVariants(game)) {
          const cacheKey = `${region.code}:${region.language}:${query}`;
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
        const result = await searchChihiro(region, query);
        cache[cacheKey] = {
          savedAt: new Date().toISOString(),
          sourceUrl: result.url,
          hits: result.hits,
        };
      },
      6
    );
    if (requests.length) {
      searched += requests.length;
      writeJson(cachePath, cache);
      await wait(160);
    }

    for (const game of batch) {
      const ranked = [];
      for (const region of regionsForGame(game)) {
        for (const query of queryVariants(game)) {
          const cacheKey = `${region.code}:${region.language}:${query}`;
          for (const product of cache[cacheKey]?.hits || []) {
            const image = chooseImage(product);
            const score = scoreProduct(game, product, region.label);
            if (score >= 720) ranked.push({ product, image, score, region, query, cacheKey });
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
        game.imageProvider = "PlayStation Store Chihiro official catalog";
        game.imageMatchedTitle = best.product.name;
        game.imageMatchScore = best.score;
        game.imageRole = `chihiro-type-${best.image.type}`;
        game.playStationStoreProductId = best.product.id;
        game.playStationStoreRegion = best.region.label;
        game.healthUpdatedAt = new Date().toISOString();
      }
    }

    console.log(`Processed ${Math.min(index + batch.length, candidates.length)}/${candidates.length} Vita image candidates...`);
  }

  const imageCount = games.filter((game) => game.imageUrl).length;
  const report = {
    ...manifest,
    playStationChihiroImageEnrichedAt: new Date().toISOString(),
    playStationChihiroImageSource: "Sony PlayStation Store Chihiro public catalog search",
    playStationChihiroImagePolicy:
      "Images are applied only to confident Chihiro products with PS Vita platform metadata and full-game style classification. Themes, avatars, demos, DLC, packs, trailers, and ambiguous title matches are left blank.",
    playStationChihiroImageStats: {
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
    playStationChihiroImageSamples: {
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

  console.log(`Matched PlayStation Chihiro Vita images: ${matched}/${candidates.length}.`);
  console.log(`Vita images available: ${imageCount}/${games.length}.`);
  console.log(`Still missing images: ${games.length - imageCount}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
