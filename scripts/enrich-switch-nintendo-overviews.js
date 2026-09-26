const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "switch.json");
const manifestPath = path.join(rootDir, "data", "games", "switch-manifest.json");
const cacheDir = path.join(rootDir, ".cache", "switch-nintendo-overviews");
const cachePath = path.join(cacheDir, "title-cache.json");
const pageCachePath = path.join(cacheDir, "product-page-cache.json");
const algoliaAppId = "U3B6GR4UA3";
const algoliaApiKey = "a29c6927638bfd8cee23993e51e721c9";
const algoliaIndex = "store_game_en_us";
const algoliaUrl = `https://${algoliaAppId}-dsn.algolia.net/1/indexes/*/queries`;
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

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value) {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
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
  return (
    (hit.corePlatforms || []).some((platform) => normalizeTitle(platform) === "nintendo") ||
    hit.platformCode === "NINTENDO_SWITCH" ||
    normalizeTitle(hit.platform) === "nintendo"
  );
}

function isLikelyAddOn(hit, game) {
  const title = normalizeTitle(hit.title);
  const gameTitle = normalizeTitle(game.title);
  const addOnTerms = ["upgrade pack", "expansion pass", "dlc", "bonus pack", "add on", "currency", "coins", "crystals"];
  return addOnTerms.some((term) => title.includes(term) && !gameTitle.includes(term));
}

function productSourceUrl(hit) {
  if (hit.url) return hit.url.startsWith("http") ? hit.url : `https://www.nintendo.com${hit.url}`;
  if (hit.slug) return `${sourceBaseUrl}${hit.slug}/`;
  if (hit.titleKey) return `${sourceBaseUrl}${hit.titleKey}/`;
  return "https://www.nintendo.com/us/store/games/";
}

function productSlug(hit) {
  const sourceUrl = productSourceUrl(hit);
  const match = sourceUrl.match(/\/products\/([^/?#]+)\/?/i);
  return normalizeTitle(match?.[1] || hit.slug || hit.titleKey || "");
}

function scoreHit(game, hit) {
  if (!hit?.title) return -1;
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

function isGenericImportDescription(value) {
  return /^Officially released Nintendo Switch game record\.?$/i.test(String(value || "").trim());
}

function clearAutomatedOverview(game) {
  game.description = "";
  delete game.descriptionProvider;
  delete game.descriptionSourceUrl;
  delete game.descriptionMatchedTitle;
  delete game.descriptionMatchScore;
  game.overviewStatus = "needs_editorial";
}

function isWeakStoreDescription(value) {
  const text = String(value || "").trim();
  const letters = (text.match(/[a-z]/gi) || []).length;
  const digits = (text.match(/\d/g) || []).length;
  const words = text.split(/\s+/).filter(Boolean);
  return (
    text.length < 70 ||
    /^Shop .+ for Nintendo Switch at Nintendo Store/i.test(text) ||
    /nintendo official site/i.test(text) ||
    /whoops/i.test(text) ||
    digits > letters * 0.22 ||
    words.some((word) => word.length > 34)
  );
}

function firstUsefulSentences(value, maxLength = 420) {
  const text = stripHtml(value)
    .replace(/\.\s+(hack)/gi, ".$1")
    .replace(/\bG\.\s*U\./g, "G.U.")
    .replace(/\s+([,.!?;:])/g, "$1");
  if (!text || isWeakStoreDescription(text)) return "";

  const sentences = text.match(/[^.!?]+[.!?]+(?=\s+["'A-Z0-9]|\s*$)/g) || [text];
  let output = "";

  for (const sentence of sentences) {
    const clean = sentence.trim();
    if (!clean || /^(buy|pre-order|download|purchase)\b/i.test(clean)) continue;
    const next = `${output} ${clean}`.trim();
    if (next.length > maxLength && output) break;
    output = next;
    if (output.length >= 180) break;
  }

  return output || text.slice(0, maxLength).trim();
}

function normalizeOverviewForGame(game, overview) {
  const text = String(overview || "").trim();
  if (/^[,;:]/.test(text)) return `${game.title}${text}`;
  if (/^[.!?]/.test(text)) return `${game.title}${text.slice(1)}`;
  return text;
}

function overviewFromHit(hit) {
  const fields = [
    hit.description,
    hit.overview,
    hit.productDescription,
    hit.blurb,
    hit.headline,
    hit.shortDescription,
  ];

  for (const field of fields) {
    const overview = firstUsefulSentences(field);
    if (overview && !isWeakStoreDescription(overview)) return overview;
  }

  return "";
}

function productDescriptionFields(product) {
  if (!product || typeof product !== "object") return [];
  return Object.entries(product)
    .filter(([key, value]) => /description|headline|summary/i.test(key) && typeof value === "string")
    .map(([, value]) => value);
}

function scoreProduct(product, hit) {
  const hitTitle = normalizeTitle(hit.title);
  const name = normalizeTitle(product?.name || product?.title || "");
  const urlKey = normalizeTitle(product?.urlKey || "");
  const slug = productSlug(hit);
  let score = 0;

  if (name && name === hitTitle) score += 1000;
  if (name && (name.startsWith(hitTitle) || hitTitle.startsWith(name))) score += 700;
  if (urlKey && slug && urlKey === slug) score += 1000;
  if (urlKey && slug && (urlKey.startsWith(slug) || slug.startsWith(urlKey))) score += 650;
  if (product?.platform === "Nintendo Switch") score += 100;
  if (product?.visibleInSearch) score += 20;

  return score;
}

function productOverviewFromHtml(html, hit) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return "";

  const data = JSON.parse(match[1]);
  const apolloState = data.props?.pageProps?.initialApolloState || {};
  const products = Object.entries(apolloState)
    .filter(([key]) => key.startsWith("Product:"))
    .map(([, value]) => value)
    .filter(Boolean);

  const ranked = products
    .map((product) => ({ product, score: scoreProduct(product, hit) }))
    .filter((item) => item.score >= 650)
    .sort((a, b) => b.score - a.score);

  const candidates = ranked.length ? ranked.map((item) => item.product) : products;
  for (const product of candidates) {
    for (const field of productDescriptionFields(product)) {
      const overview = firstUsefulSentences(field);
      if (overview && !isWeakStoreDescription(overview)) return overview;
    }
  }

  return "";
}

async function fetchProductOverview(hit, pageCache) {
  const sourceUrl = productSourceUrl(hit);
  if (!sourceUrl || !/^https:\/\/www\.nintendo\.com\/us\/store\/products\//i.test(sourceUrl)) return "";
  if (pageCache[sourceUrl]) return pageCache[sourceUrl].overview || "";

  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "text/html",
      "User-Agent": "GamesCardsExchange/0.1 (local Switch Nintendo product overview enrichment)",
    },
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`Nintendo product page returned ${response.status}: ${sourceUrl}`);

  const overview = productOverviewFromHtml(html, hit);
  pageCache[sourceUrl] = {
    savedAt: new Date().toISOString(),
    overview,
  };
  return overview;
}

async function algoliaMultiQuery(titles) {
  const response = await fetch(algoliaUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Algolia-API-Key": algoliaApiKey,
      "X-Algolia-Application-Id": algoliaAppId,
      "User-Agent": "GamesCardsExchange/0.1 (local Switch Nintendo overview enrichment)",
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
            "description",
            "overview",
            "productDescription",
            "blurb",
            "headline",
            "shortDescription",
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
  const pageCache = readJsonIfExists(pageCachePath, {});

  if (!Array.isArray(games)) throw new Error("Switch game data was not found. Run the Switch importer first.");

  let clearedGeneric = 0;
  for (const game of games) {
    if (isGenericImportDescription(game.description)) {
      clearAutomatedOverview(game);
      clearedGeneric += 1;
    } else if (force && game.descriptionProvider === "Nintendo official store overview") {
      clearAutomatedOverview(game);
    }
  }

  const candidates = games
    .filter((game) => game.descriptionProvider !== "GCX editorial seed")
    .filter((game) => force || game.overviewStatus !== "published" || !game.descriptionProvider || !game.description)
    .slice(0, limit || undefined);

  let searched = 0;
  let matched = 0;
  let skipped = 0;
  let cached = 0;
  const unmatched = [];
  const noOverview = [];
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

    await asyncPool(batch, async (game) => {
      const query = compactQuery(game.title);
      const hits = cache[query]?.hits || [];
      const ranked = hits
        .map((hit) => ({ hit, score: scoreHit(game, hit), overview: overviewFromHit(hit) }))
        .filter((item) => item.score >= 700)
        .sort((a, b) => b.score - a.score);

      const best = ranked[0];
      if (!best) {
        skipped += 1;
        if (unmatched.length < 40) unmatched.push(game.title);
        return;
      }

      if (!best.overview) {
        best.overview = await fetchProductOverview(best.hit, pageCache);
      }

      best.overview = normalizeOverviewForGame(game, best.overview);

      if (!best.overview) {
        skipped += 1;
        if (noOverview.length < 40) noOverview.push({ title: game.title, matchedTitle: best.hit.title });
        return;
      }

      if (best.score < 900 && uncertain.length < 40) {
        uncertain.push({ title: game.title, matchedTitle: best.hit.title, score: best.score });
      }

      matched += 1;
      if (!dryRun) {
        game.description = best.overview;
        game.descriptionProvider = "Nintendo official store overview";
        game.descriptionSourceUrl = productSourceUrl(best.hit);
        game.descriptionMatchedTitle = best.hit.title;
        game.descriptionMatchScore = best.score;
        game.overviewStatus = "published";
        game.healthUpdatedAt = new Date().toISOString();
      }
    }, 8);

    console.log(`Processed ${Math.min(index + batch.length, candidates.length)}/${candidates.length} Switch overview candidates...`);
    writeJson(cachePath, cache);
    writeJson(pageCachePath, pageCache);
  }

  const overviewStatusCounts = games.reduce((counts, game) => {
    const status = game.overviewStatus || "unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});

  const report = {
    ...manifest,
    switchOverviewEnrichedAt: new Date().toISOString(),
    switchOverviewSource: "Nintendo official store Algolia search index",
    switchOverviewPolicy:
      "Generic imported-record descriptions are hidden. Existing GCX editorial seeds are preserved; Nintendo Store overviews are applied only after a Nintendo Switch title match.",
    switchOverviewStats: {
      total: games.length,
      candidates: candidates.length,
      clearedGeneric,
      searched,
      cached,
      matched,
      skipped,
      published: overviewStatusCounts.published || 0,
      needsEditorial: overviewStatusCounts.needs_editorial || 0,
      dryRun,
    },
    switchOverviewSamples: {
      unmatched,
      noOverview,
      uncertain,
    },
    overviewStatusCounts,
  };

  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, report);
  }

  console.log(`Cleared generic placeholders: ${clearedGeneric}.`);
  console.log(`Matched Nintendo overviews: ${matched}/${candidates.length}.`);
  console.log(`Published Switch overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
  console.log(`Still needing editorial: ${overviewStatusCounts.needs_editorial || 0}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
