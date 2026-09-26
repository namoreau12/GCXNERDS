const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "3ds.json");
const manifestPath = path.join(rootDir, "data", "games", "3ds-manifest.json");
const cacheDir = path.join(rootDir, ".cache", "3ds-nintendo-eu-images");
const cachePath = path.join(cacheDir, "search-cache.json");
const searchEndpoint = "https://searching.nintendo-europe.com/en/select";
const nintendoBaseUrl = "https://www.nintendo.com";

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

function normalizeTitle(value) {
  return String(value || "")
    .replace(/[™®©]/g, "")
    .replace(/[â„¢Â®Â©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(nintendo|3ds|2ds|download software|download|software|game card|eshop)\b/gi, "")
    .replace(/\b(edition|standard|bundle|collection)\b/gi, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function compactQuery(value) {
  return String(value || "")
    .replace(/[™®©]/g, "")
    .replace(/[â„¢Â®Â©]/g, "")
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
    const noSubtitle = compact.split(":")[0].trim();
    if (noSubtitle.length >= 6) variants.add(noSubtitle);
  }
  return Array.from(variants).filter(Boolean).slice(0, 3);
}

function compactDoc(doc) {
  return {
    title: doc.title,
    title_master_s: doc.title_master_s,
    sorting_title: doc.sorting_title,
    system_names_txt: doc.system_names_txt,
    type: doc.type,
    pg_s: doc.pg_s,
    url: doc.url,
    image_url: doc.image_url,
    image_url_sq_s: doc.image_url_sq_s,
    image_url_h2x1_s: doc.image_url_h2x1_s,
    image_url_h16x9_s: doc.image_url_h16x9_s,
    date_from: doc.date_from,
  };
}

function is3dsGame(doc) {
  return (
    doc.type === "GAME" &&
    doc.pg_s === "GAME" &&
    (doc.system_names_txt || []).some((system) => String(system).toLowerCase() === "nintendo 3ds")
  );
}

function chooseImage(doc) {
  const candidates = [doc.image_url_sq_s, doc.image_url, doc.image_url_h16x9_s, doc.image_url_h2x1_s].filter(Boolean);
  const image = candidates.find((url) => !/NintendoLogo|generic/i.test(url));
  return image || "";
}

function scoreDoc(game, doc) {
  if (!is3dsGame(doc)) return -1;
  if (!chooseImage(doc)) return -1;

  const docTitle = normalizeTitle(doc.title_master_s || doc.title);
  const candidates = [game.title, ...(game.aliases || [])].map(normalizeTitle).filter(Boolean);
  if (!docTitle || !candidates.length) return -1;

  const exact = candidates.includes(docTitle);
  const safeEdition = candidates.some((title) => {
    if (!docTitle.startsWith(title) || title.length < 5) return false;
    const suffix = docTitle.slice(title.length).trim();
    return /^(deluxe|complete|special|ultimate|plus|dx|remastered)\b/i.test(suffix);
  });
  const safeShort = candidates.some((title) => {
    if (!title.startsWith(docTitle) || docTitle.length < 8) return false;
    const suffix = title.slice(docTitle.length).trim();
    if (/^(\d+|[ivxlcdm]+)\b/i.test(suffix)) return false;
    return docTitle.length / title.length >= 0.72;
  });
  const safeSubtitle = candidates.some((title) => {
    if (!docTitle.startsWith(title) || title.length < 5) return false;
    const suffix = docTitle.slice(title.length).trim();
    if (!suffix) return false;
    if (/^(\d+|[ivxlcdm]+)\b/i.test(suffix)) return false;
    return suffix.length <= 34;
  });

  if (!exact && !safeEdition && !safeShort && !safeSubtitle) return -1;

  let score = 0;
  if (exact) score += 1000;
  if (safeEdition) score += 740;
  if (safeShort) score += 760;
  if (safeSubtitle) score += 720;
  if ((doc.system_names_txt || []).length === 1) score += 90;
  if (String(doc.url || "").includes("/Nintendo-3DS")) score += 80;
  if (String(doc.url || "").includes("download-software")) score += 30;
  if ((game.releasedRegions || []).includes("europe")) score += 40;
  if (doc.image_url_sq_s && !/NintendoLogo|generic/i.test(doc.image_url_sq_s)) score += 30;
  return score;
}

function sourceUrl(doc) {
  if (!doc.url) return "https://www.nintendo.com/en-gb/";
  if (/^https?:\/\//i.test(doc.url)) return doc.url;
  return `${nintendoBaseUrl}${doc.url}`;
}

async function searchNintendoEurope(query) {
  const params = new URLSearchParams({
    q: query,
    fq: "type:GAME AND sorting_title:* AND *:*",
    rows: "16",
    start: "0",
    wt: "json",
    sort: "score desc, date_from desc",
  });
  const response = await fetch(`${searchEndpoint}?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local 3DS Nintendo Europe image enrichment)",
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Nintendo Europe search returned ${response.status}: ${text.slice(0, 180)}`);
  return (JSON.parse(text).response?.docs || []).map(compactDoc);
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
  if (!Array.isArray(games)) throw new Error("Run scripts/import-3ds-official-list.js before enriching images.");

  const candidates = games.filter((game) => force || !game.imageUrl).slice(0, limit || undefined);
  let searched = 0;
  let cached = 0;
  let matched = 0;
  let skipped = 0;
  const unmatched = [];
  const uncertain = [];

  for (let index = 0; index < candidates.length; index += 32) {
    const batch = candidates.slice(index, index + 32);
    const requests = [];

    for (const game of batch) {
      for (const query of queryVariants(game)) {
        if (cache[query]) {
          cached += 1;
        } else {
          requests.push(query);
        }
      }
    }

    await asyncPool(
      requests,
      async (query) => {
        cache[query] = {
          savedAt: new Date().toISOString(),
          hits: await searchNintendoEurope(query),
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
      for (const query of queryVariants(game)) {
        for (const doc of cache[query]?.hits || []) {
          const score = scoreDoc(game, doc);
          if (score >= 700) ranked.push({ doc, score, query });
        }
      }
      ranked.sort((a, b) => b.score - a.score);
      const best = ranked[0];
      if (!best) {
        skipped += 1;
        if (unmatched.length < 80) unmatched.push(game.title);
        continue;
      }
      if (best.score < 900 && uncertain.length < 50) {
        uncertain.push({ title: game.title, matchedTitle: best.doc.title, score: best.score });
      }

      matched += 1;
      if (!dryRun) {
        game.imageUrl = chooseImage(best.doc);
        game.imageSourceUrl = sourceUrl(best.doc);
        game.imageProvider = "Nintendo Europe official search";
        game.imageMatchedTitle = best.doc.title;
        game.imageMatchScore = best.score;
        game.healthUpdatedAt = new Date().toISOString();
      }
    }

    console.log(`Processed ${Math.min(index + batch.length, candidates.length)}/${candidates.length} 3DS image candidates...`);
  }

  const imageCount = games.filter((game) => game.imageUrl).length;
  const report = {
    ...manifest,
    nintendoEuropeImageEnrichedAt: new Date().toISOString(),
    nintendoEuropeImageSource: "Nintendo Europe official site Solr search",
    nintendoEuropeImagePolicy:
      "Images are applied only to confident Nintendo Europe GAME results with Nintendo 3DS in system_names_txt. Generic Nintendo-logo placeholders and ambiguous title matches are left blank.",
    nintendoEuropeImageStats: {
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
    nintendoEuropeImageSamples: {
      unmatched,
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

  console.log(`Matched Nintendo Europe 3DS images: ${matched}/${candidates.length}.`);
  console.log(`3DS images available: ${imageCount}/${games.length}.`);
  console.log(`Still missing images: ${games.length - imageCount}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
