const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");

const platformQids = {
  "3ds": ["Q203597"],
  dreamcast: ["Q184198"],
  ds: ["Q170323"],
  gameboy: ["Q186437"],
  gamecube: ["Q182172"],
  gba: ["Q188642"],
  genesis: ["Q10676", "Q201652"],
  n64: ["Q184839"],
  nes: ["Q172742"],
  ps1: ["Q10677"],
  ps2: ["Q10680"],
  ps3: ["Q10683"],
  ps4: ["Q5014725"],
  ps5: ["Q63184502"],
  psp: ["Q170325"],
  saturn: ["Q200912"],
  snes: ["Q183259"],
  switch: ["Q19610114"],
  switch2: ["Q120525523"],
  vita: ["Q188808"],
  wii: ["Q8079"],
  xbox: ["Q132020"],
  xbox360: ["Q48263"],
};

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const requestedPlatforms = args.filter((arg) => !arg.startsWith("--"));
const dryRun = flags.has("--dry-run");
const strict = !flags.has("--loose");
const limit = Number((args.find((arg) => arg.startsWith("--limit=")) || "").split("=")[1] || 0);
const batchSize = Number((args.find((arg) => arg.startsWith("--batch-size=")) || "").split("=")[1] || 8);

function readJson(filePath, fallback = null) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function queryValuesForGame(game) {
  const values = new Set();
  for (const value of [game.title, ...(game.aliases || [])]) {
    const normalized = normalize(value);
    if (normalized.length >= 3) values.add(normalized);
  }
  return Array.from(values);
}

function hasImage(game) {
  return Boolean(game.imageUrl || game.boxArtUrl || game.coverUrl || game.coverImage || game.thumbnailUrl);
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

async function fetchSparql(query) {
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
  const maxAttempts = 2;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent": "GamesCardsExchange/0.1 local Wikidata image enrichment",
        },
        signal: controller.signal,
      });
      const text = await response.text();
      if (response.ok) return JSON.parse(text);
      if (response.status !== 429 && response.status < 500) throw new Error(`Wikidata SPARQL returned ${response.status}: ${text.slice(0, 180)}`);
      const retryAfter = Number(response.headers.get("retry-after") || 0);
      await sleep((retryAfter ? retryAfter * 1000 : 1800 * (attempt + 1)) + 300);
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
      await sleep(1800 * (attempt + 1));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("Wikidata SPARQL failed repeatedly.");
}

function makeQuery(platformIds, wantedTitles) {
  const platformValues = platformIds.map((qid) => `wd:${qid}`).join(" ");
  const titleValues = wantedTitles.map((title) => JSON.stringify(title)).join(" ");
  return `
SELECT ?item ?label ?image WHERE {
  VALUES ?platform { ${platformValues} }
  VALUES ?wanted { ${titleValues} }
  ?item wdt:P31/wdt:P279* wd:Q7889;
        wdt:P400 ?platform;
        wdt:P18 ?image;
        rdfs:label ?label.
  FILTER(LANG(?label) = "en")
  BIND(LCASE(REPLACE(REPLACE(REPLACE(STR(?label), "&", " and "), "[^A-Za-z0-9]+", " "), "^(the|a|an) ", "")) AS ?cleanLabel)
  FILTER(?cleanLabel = ?wanted)
}
LIMIT 200
`;
}

async function enrichPlatform(slug) {
  const platformIds = platformQids[slug];
  if (!platformIds) throw new Error(`Unsupported platform: ${slug}`);

  const dataPath = path.join(gamesDir, `${slug}.json`);
  const manifestPath = path.join(gamesDir, `${slug}-manifest.json`);
  const games = readJson(dataPath, null);
  const manifest = readJson(manifestPath, {});
  if (!Array.isArray(games)) return null;

  let candidates = games.filter((game) => !hasImage(game));
  if (limit) candidates = candidates.slice(0, limit);

  const titleToGames = new Map();
  for (const game of candidates) {
    for (const value of queryValuesForGame(game)) {
      if (!titleToGames.has(value)) titleToGames.set(value, []);
      titleToGames.get(value).push(game);
    }
  }

  let matched = 0;
  let checked = 0;
  const samples = [];
  const ambiguous = [];

  for (const titleGroup of chunk(Array.from(titleToGames.keys()), batchSize)) {
    const query = makeQuery(platformIds, titleGroup);
    let result;
    try {
      result = await fetchSparql(query);
    } catch (error) {
      console.warn(`${slug}: skipped a Wikidata batch after repeated failures: ${error.message}`);
      checked += titleGroup.length;
      await sleep(1200);
      continue;
    }
    const rows = result.results?.bindings || [];
    for (const row of rows) {
      const label = row.label?.value || "";
      const cleanLabel = normalize(label);
      const imageUrl = row.image?.value || "";
      const itemUrl = row.item?.value || "";
      const gamesForTitle = titleToGames.get(cleanLabel) || [];
      if (!imageUrl || gamesForTitle.length !== 1) {
        if (gamesForTitle.length > 1 && ambiguous.length < 30) ambiguous.push({ label, count: gamesForTitle.length });
        continue;
      }
      const game = gamesForTitle[0];
      if (strict && normalize(game.title) !== cleanLabel && !(game.aliases || []).some((alias) => normalize(alias) === cleanLabel)) continue;
      if (!dryRun) {
        game.imageUrl = imageUrl;
        game.imageSourceUrl = itemUrl;
        game.imageProvider = "Wikidata P18 image";
        game.imageMatchedTitle = label;
        game.healthUpdatedAt = new Date().toISOString();
      }
      matched += 1;
      if (samples.length < 20) samples.push({ title: game.title, matchedTitle: label, imageUrl });
    }
    checked += titleGroup.length;
    if (checked % 300 === 0) console.log(`Checked ${checked}/${titleToGames.size} ${slug} Wikidata title keys...`);
    await sleep(900);
  }

  const imageCount = games.filter(hasImage).length;
  if (!dryRun && matched) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      wikidataImageEnrichedAt: new Date().toISOString(),
      wikidataImageMatchCount: (manifest.wikidataImageMatchCount || 0) + matched,
      imageCount,
      missingImageCount: games.length - imageCount,
    });
  }

  return { platform: slug, candidates: candidates.length, matched, imageCount, total: games.length, samples, ambiguous };
}

async function main() {
  const platforms = requestedPlatforms.length ? requestedPlatforms : Object.keys(platformQids);
  const results = [];
  for (const platform of platforms) {
    results.push(await enrichPlatform(platform));
  }
  console.table(results.map(({ platform, candidates, matched, imageCount, total }) => ({ platform, candidates, matched, imageCount, total, missing: total - imageCount })));
  for (const result of results) {
    if (!result.samples.length) continue;
    console.log(`\n${result.platform} samples:`);
    result.samples.forEach((sample) => console.log(`- ${sample.title} => ${sample.matchedTitle} | ${sample.imageUrl}`));
    if (result.ambiguous.length) console.log(`${result.platform} ambiguous: ${JSON.stringify(result.ambiguous.slice(0, 10), null, 2)}`);
  }
  if (dryRun) console.log("Dry run only; no files were changed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
