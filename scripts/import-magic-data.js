const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const readline = require("node:readline");
const { pipeline } = require("node:stream/promises");
const { guardCardsForImport } = require("./tcg-card-pipeline-utils");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "magic");
const cardsBySetDir = path.join(outputDir, "cards-by-set");
const scratchDir = path.join(rootDir, ".cache", "magic");
const bulkType = "default-cards";
const scryfallApiBase = "https://api.scryfall.com";
const releasedThrough = new Date().toISOString().slice(0, 10);

function ensureDirs() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(cardsBySetDir, { recursive: true });
  fs.mkdirSync(scratchDir, { recursive: true });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "GamesCardsExchange/0.1 (local Magic importer)",
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Scryfall returned ${response.status}: ${text.slice(0, 160)}`);
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(1000 * attempt);
    }
  }
  throw lastError;
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

async function downloadFile(url, destination) {
  const response = await fetch(url, {
    headers: { "User-Agent": "GamesCardsExchange/0.1 (local Magic importer)" },
  });
  if (!response.ok || !response.body) throw new Error(`Could not download Scryfall bulk file: ${response.status}`);
  await pipeline(response.body, fs.createWriteStream(destination));
}

function imageUris(card) {
  if (card.image_uris) return card.image_uris;
  const firstFace = (card.card_faces || []).find((face) => face.image_uris);
  return firstFace?.image_uris || {};
}

function faceNames(card) {
  return (card.card_faces || []).map((face) => face.name).filter(Boolean);
}

function compactCard(card) {
  const images = imageUris(card);
  return {
    id: card.id,
    oracleId: card.oracle_id || "",
    name: card.name,
    set: card.set,
    setName: card.set_name,
    setType: card.set_type || "",
    collectorNumber: card.collector_number || "",
    releasedAt: card.released_at || "",
    rarity: card.rarity || "",
    lang: card.lang || "",
    layout: card.layout || "",
    manaCost: card.mana_cost || "",
    typeLine: card.type_line || "",
    oracleText: card.oracle_text || "",
    power: card.power || "",
    toughness: card.toughness || "",
    colors: card.colors || [],
    colorIdentity: card.color_identity || [],
    artist: card.artist || "",
    prices: card.prices || {},
    legalities: card.legalities || {},
    finishes: card.finishes || [],
    games: card.games || [],
    promo: Boolean(card.promo),
    digital: Boolean(card.digital),
    foil: Boolean(card.foil),
    nonfoil: Boolean(card.nonfoil),
    reserved: Boolean(card.reserved),
    reprint: Boolean(card.reprint),
    variation: Boolean(card.variation),
    booster: Boolean(card.booster),
    imageUris: {
      small: images.small || "",
      normal: images.normal || "",
      large: images.large || "",
      png: images.png || "",
      artCrop: images.art_crop || "",
    },
    cardFaces: (card.card_faces || []).map((face) => ({
      name: face.name || "",
      manaCost: face.mana_cost || "",
      typeLine: face.type_line || "",
      oracleText: face.oracle_text || "",
      power: face.power || "",
      toughness: face.toughness || "",
      imageUris: face.image_uris
        ? {
            small: face.image_uris.small || "",
            normal: face.image_uris.normal || "",
            large: face.image_uris.large || "",
            png: face.image_uris.png || "",
            artCrop: face.image_uris.art_crop || "",
          }
        : null,
    })),
    scryfallUri: card.scryfall_uri || "",
    rulingsUri: card.rulings_uri || "",
    purchaseUris: card.purchase_uris || {},
    searchText: [
      card.name,
      faceNames(card).join(" "),
      card.set,
      card.set_name,
      card.collector_number,
      card.rarity,
      card.type_line,
      card.artist,
      card.lang,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

function isReleased(dateValue) {
  return !dateValue || dateValue <= releasedThrough;
}

function compactSearchCard(card) {
  const images = imageUris(card);
  return {
    id: card.id,
    name: card.name,
    set: card.set,
    setName: card.set_name,
    collectorNumber: card.collector_number || "",
    releasedAt: card.released_at || "",
    rarity: card.rarity || "",
    typeLine: card.type_line || "",
    imageUrl: images.small || images.normal || "",
    searchText: [
      card.name,
      faceNames(card).join(" "),
      card.set,
      card.set_name,
      card.collector_number,
      card.rarity,
      card.type_line,
      card.oracle_text,
      card.artist,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

function normalizeMagicCardForGuard(card) {
  const image = card.imageUrl || card.imageUris?.normal || card.imageUris?.small || card.imageUris?.large || "";
  return {
    franchise: "magic",
    cardId: card.id || "",
    setCode: card.set || "",
    setName: card.setName || "",
    cardNumber: card.collectorNumber || "",
    cardName: card.name || "",
    variant: [card.rarity, card.layout, ...(card.finishes || []), card.promo ? "promo" : "", card.variation ? "variation" : ""].filter(Boolean).join(" / "),
    language: card.lang || "en",
    imageFront: image,
    imageThumbnail: card.imageUrl || card.imageUris?.small || image,
    rarity: card.rarity || "",
  };
}

function collectorNumberSortValue(value) {
  const text = String(value || "");
  const numeric = text.match(/\d+/)?.[0];
  return numeric ? Number(numeric) : Number.MAX_SAFE_INTEGER;
}

function sortCards(a, b) {
  const numberDiff = collectorNumberSortValue(a.collectorNumber) - collectorNumberSortValue(b.collectorNumber);
  if (numberDiff) return numberDiff;
  return String(a.collectorNumber).localeCompare(String(b.collectorNumber), undefined, { numeric: true }) || a.name.localeCompare(b.name);
}

async function fetchSets() {
  const result = await fetchJson(`${scryfallApiBase}/sets`);
  return (result.data || [])
    .filter((set) => isReleased(set.released_at))
    .map((set) => ({
      id: set.id,
      code: set.code,
      mtgoCode: set.mtgo_code || "",
      arenaCode: set.arena_code || "",
      tcgplayerId: set.tcgplayer_id || "",
      name: set.name,
      setType: set.set_type,
      releasedAt: set.released_at || "",
      blockCode: set.block_code || "",
      block: set.block || "",
      parentSetCode: set.parent_set_code || "",
      cardCount: set.card_count || 0,
      printedSize: set.printed_size || 0,
      digital: Boolean(set.digital),
      foilOnly: Boolean(set.foil_only),
      nonfoilOnly: Boolean(set.nonfoil_only),
      iconSvgUri: set.icon_svg_uri || "",
      scryfallUri: set.scryfall_uri || "",
      searchUri: set.search_uri || "",
    }))
    .sort((a, b) => new Date(b.releasedAt || 0) - new Date(a.releasedAt || 0) || a.name.localeCompare(b.name));
}

async function processBulkFile(gzipPath) {
  const bySet = new Map();
  const searchCards = [];
  let cardCount = 0;
  let imageCount = 0;

  const stream = fs.createReadStream(gzipPath).pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const raw = JSON.parse(trimmed);
    if (!isReleased(raw.released_at)) continue;
    const card = compactCard(raw);
    if (card.imageUris.small || card.imageUris.normal || card.cardFaces.some((face) => face.imageUris?.small || face.imageUris?.normal)) {
      imageCount += 1;
    }
    if (!bySet.has(card.set)) bySet.set(card.set, []);
    bySet.get(card.set).push(card);
    searchCards.push(compactSearchCard(raw));
    cardCount += 1;
    if (cardCount % 25000 === 0) console.log(`Processed ${cardCount} Magic cards...`);
  }

  return { bySet, searchCards, cardCount, imageCount };
}

async function main() {
  ensureDirs();
  const importedAt = new Date().toISOString();
  console.log("Fetching Magic set metadata from Scryfall...");
  const sets = await fetchSets();
  writeJson(path.join(outputDir, "sets.json"), sets);
  console.log(`Found ${sets.length} Magic sets.`);

  console.log("Resolving Scryfall default-cards bulk file...");
  const bulk = await fetchJson(`${scryfallApiBase}/bulk-data/${bulkType}`);
  const downloadUri = bulk.jsonl_download_uri || bulk.download_uri;
  if (!downloadUri) throw new Error("Scryfall bulk metadata did not include a download URI.");

  const gzipPath = path.join(scratchDir, `scryfall-${bulkType}.jsonl.gz`);
  console.log(`Downloading ${bulk.name} (${Math.round((bulk.compressed_size || 0) / 1024 / 1024)} MB compressed)...`);
  await downloadFile(downloadUri, gzipPath);

  console.log("Processing Magic cards by set...");
  const { bySet, searchCards, cardCount, imageCount } = await processBulkFile(gzipPath);

  const perSetSummaries = [];
  const validSetCodes = new Set(sets.map((set) => set.code));
  for (const fileName of fs.readdirSync(cardsBySetDir)) {
    if (!fileName.endsWith(".json")) continue;
    const setCode = fileName.replace(/\.json$/, "");
    if (!validSetCodes.has(setCode)) fs.unlinkSync(path.join(cardsBySetDir, fileName));
  }
  for (const set of sets) {
    const guarded = guardCardsForImport(bySet.get(set.code) || [], normalizeMagicCardForGuard, {
      includeVariant: true,
      strictCodes: ["MISSING_CARD_ID", "MISSING_SET_ASSOCIATION", "MISSING_CARD_NUMBER"],
    });
    if (guarded.strictFailures.length) {
      throw new Error(`Magic import validation failed for ${set.code}: ${guarded.strictFailures.length} required identity issues`);
    }
    if (guarded.duplicates.length) {
      console.log(`  ${set.code}: hidden duplicate card records before write: ${guarded.duplicates.length}`);
    }
    const cards = guarded.data.sort(sortCards);
    writeJson(path.join(cardsBySetDir, `${set.code}.json`), cards);
    perSetSummaries.push({ code: set.code, name: set.name, cardCount: cards.length, imageCount: cards.filter((card) => card.imageUris.small || card.imageUris.normal).length });
  }

  const guardedSearchCards = guardCardsForImport(searchCards, normalizeMagicCardForGuard, {
    includeVariant: true,
    strictCodes: ["MISSING_CARD_ID", "MISSING_SET_ASSOCIATION", "MISSING_CARD_NUMBER"],
  });
  if (guardedSearchCards.strictFailures.length) {
    throw new Error(`Magic search import validation failed: ${guardedSearchCards.strictFailures.length} required identity issues`);
  }

  writeJson(
    path.join(outputDir, "cards-search.json"),
    guardedSearchCards.data.sort((a, b) => a.name.localeCompare(b.name) || a.set.localeCompare(b.set) || String(a.collectorNumber).localeCompare(String(b.collectorNumber), undefined, { numeric: true }))
  );
  writeJson(path.join(outputDir, "manifest.json"), {
    importedAt,
    source: "Scryfall API default-cards bulk data and sets API",
    sourceUrls: ["https://scryfall.com/docs/api/bulk-data", "https://scryfall.com/docs/api/sets"],
    bulkType,
    bulkUpdatedAt: bulk.updated_at,
    releasedThrough,
    bulkDownloadUri: downloadUri,
    setCount: sets.length,
    cardCount,
    imageCount,
    missingImageCount: cardCount - imageCount,
    cardsBySetCount: bySet.size,
    setSummaries: perSetSummaries,
  });

  console.log(`Imported ${cardCount} Magic card printings across ${sets.length} sets.`);
  console.log(`Cards with images: ${imageCount}/${cardCount}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
