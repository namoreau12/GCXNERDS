const fs = require("node:fs");
const path = require("node:path");
const { guardCardsForImport } = require("./tcg-card-pipeline-utils");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "yugioh");
const cardsBySetDir = path.join(outputDir, "cards-by-set");
const ygoprodeckApiBase = "https://db.ygoprodeck.com/api/v7";
const releasedThrough = new Date().toISOString().slice(0, 10);

function ensureDirs() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(cardsBySetDir, { recursive: true });
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
          "User-Agent": "GamesCardsExchange/0.1 (local Yu-Gi-Oh importer)",
        },
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`YGOPRODeck returned ${response.status}: ${text.slice(0, 160)}`);
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

function slugify(value) {
  return String(value || "unknown-set")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "unknown-set";
}

function isReleased(dateValue) {
  return !dateValue || dateValue <= releasedThrough;
}

function setYear(dateValue) {
  return dateValue ? String(dateValue).slice(0, 4) : "Date Unknown";
}

function firstImage(card) {
  return card.card_images?.[0] || {};
}

function firstPrice(card) {
  return card.card_prices?.[0] || {};
}

function compactPrices(card) {
  const prices = firstPrice(card);
  return {
    cardmarket: prices.cardmarket_price || "",
    tcgplayer: prices.tcgplayer_price || "",
    ebay: prices.ebay_price || "",
    amazon: prices.amazon_price || "",
    coolstuffinc: prices.coolstuffinc_price || "",
  };
}

function compactBanlist(card) {
  return {
    tcg: card.banlist_info?.ban_tcg || "",
    ocg: card.banlist_info?.ban_ocg || "",
    goat: card.banlist_info?.ban_goat || "",
  };
}

function statLine(card) {
  return [
    card.atk !== undefined ? `ATK ${card.atk}` : "",
    card.def !== undefined ? `DEF ${card.def}` : "",
    card.level ? `Level ${card.level}` : "",
    card.linkval ? `Link ${card.linkval}` : "",
    card.scale ? `Scale ${card.scale}` : "",
  ].filter(Boolean);
}

function compactVariant(cardSet) {
  return {
    setName: cardSet.set_name || "",
    setCode: cardSet.set_code || "",
    rarity: cardSet.set_rarity || "",
    rarityCode: cardSet.set_rarity_code || "",
    price: cardSet.set_price || "",
  };
}

function compactPrinting(card, cardSet, set) {
  const image = firstImage(card);
  const setCode = cardSet?.set_code || "";
  const setName = cardSet?.set_name || set?.name || "Database Only";
  const setId = set?.id || slugify(setName);
  const printingKey = `${card.id}-${setCode || setId}`;

  return {
    id: String(card.id),
    printingId: printingKey,
    name: card.name || "",
    type: card.type || "",
    frameType: card.frameType || "",
    description: card.desc || "",
    race: card.race || "",
    attribute: card.attribute || "",
    archetype: card.archetype || "",
    atk: card.atk ?? "",
    def: card.def ?? "",
    level: card.level ?? "",
    linkval: card.linkval ?? "",
    scale: card.scale ?? "",
    linkmarkers: card.linkmarkers || [],
    setId,
    setName,
    setCode,
    setRarity: cardSet?.set_rarity || "",
    setRarityCode: cardSet?.set_rarity_code || "",
    setPrice: cardSet?.set_price || "",
    tcgDate: set?.tcgDate || "",
    year: setYear(set?.tcgDate),
    prices: compactPrices(card),
    banlist: compactBanlist(card),
    legalities: compactBanlist(card),
    variants: (card.card_sets || []).map(compactVariant),
    images: {
      small: image.image_url_small || "",
      normal: image.image_url || "",
      cropped: image.image_url_cropped || "",
    },
    ygoprodeckUrl: card.ygoprodeck_url || "",
    searchText: [
      card.name,
      card.type,
      card.frameType,
      card.desc,
      card.race,
      card.attribute,
      card.archetype,
      setName,
      setCode,
      cardSet?.set_rarity,
      cardSet?.set_rarity_code,
      statLine(card).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

function compactSearchCard(card, cardSet, set) {
  const image = firstImage(card);
  const setCode = cardSet?.set_code || "";
  const setName = cardSet?.set_name || set?.name || "Database Only";
  const setId = set?.id || slugify(setName);

  return {
    id: String(card.id),
    printingId: `${card.id}-${setCode || setId}`,
    name: card.name || "",
    type: card.type || "",
    race: card.race || "",
    attribute: card.attribute || "",
    archetype: card.archetype || "",
    setId,
    setName,
    setCode,
    setRarity: cardSet?.set_rarity || "",
    setPrice: cardSet?.set_price || "",
    tcgDate: set?.tcgDate || "",
    imageUrl: image.image_url_small || image.image_url || "",
    searchText: [
      card.name,
      card.type,
      card.frameType,
      card.desc,
      card.race,
      card.attribute,
      card.archetype,
      setName,
      setCode,
      cardSet?.set_rarity,
      cardSet?.set_rarity_code,
      statLine(card).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

function normalizeYugiohCardForGuard(card) {
  const image = card.imageUrl || card.images?.normal || card.images?.small || "";
  return {
    franchise: "yugioh",
    cardId: card.printingId || card.id || "",
    setCode: card.setCode || card.setId || "",
    setName: card.setName || "",
    cardNumber: card.setCode || "",
    cardName: card.name || "",
    variant: [card.setRarity, card.race, card.attribute].filter(Boolean).join(" / "),
    language: "en",
    imageFront: image,
    imageThumbnail: card.imageUrl || card.images?.small || image,
    rarity: card.setRarity || "",
  };
}

function sortSets(a, b) {
  return new Date(b.tcgDate || 0) - new Date(a.tcgDate || 0) || a.name.localeCompare(b.name);
}

function sortCards(a, b) {
  return (
    String(a.setCode || "").localeCompare(String(b.setCode || ""), undefined, { numeric: true }) ||
    a.name.localeCompare(b.name)
  );
}

function sortSearchCards(a, b) {
  return a.name.localeCompare(b.name) || a.setName.localeCompare(b.setName) || String(a.setCode).localeCompare(String(b.setCode), undefined, { numeric: true });
}

async function main() {
  ensureDirs();
  const importedAt = new Date().toISOString();

  console.log("Fetching Yu-Gi-Oh set metadata from YGOPRODeck...");
  const rawSets = await fetchJson(`${ygoprodeckApiBase}/cardsets.php`);
  const setsByName = new Map();
  for (const rawSet of rawSets) {
    const tcgDate = rawSet.tcg_date || "";
    if (!isReleased(tcgDate)) continue;
    const name = rawSet.set_name || "";
    const set = {
      id: slugify(name),
      name,
      setCode: rawSet.set_code || "",
      tcgDate,
      year: setYear(tcgDate),
      expectedCardCount: rawSet.num_of_cards || 0,
      cardCount: 0,
      imageUrl: rawSet.set_image || "",
    };
    setsByName.set(name, set);
  }

  console.log("Fetching Yu-Gi-Oh card catalog from YGOPRODeck...");
  const rawCardsResult = await fetchJson(`${ygoprodeckApiBase}/cardinfo.php`);
  const rawCards = rawCardsResult.data || [];
  const bySet = new Map();
  const searchCards = [];
  let cardCount = 0;
  let imageCount = 0;
  let databaseOnlyCount = 0;

  const databaseOnlySet = {
    id: "database-only",
    name: "Database Only",
    setCode: "",
    tcgDate: "",
    year: "Date Unknown",
    expectedCardCount: 0,
    cardCount: 0,
    imageUrl: "",
  };

  for (const card of rawCards) {
    const cardSets = Array.isArray(card.card_sets) && card.card_sets.length ? card.card_sets : [null];
    for (const cardSet of cardSets) {
      const sourceSet = cardSet ? setsByName.get(cardSet.set_name) : databaseOnlySet;
      if (sourceSet?.tcgDate && !isReleased(sourceSet.tcgDate)) continue;
      const set = sourceSet || {
        id: slugify(cardSet.set_name),
        name: cardSet.set_name,
        setCode: "",
        tcgDate: "",
        year: "Date Unknown",
        expectedCardCount: 0,
        cardCount: 0,
        imageUrl: "",
      };

      const printing = compactPrinting(card, cardSet, set);
      if (!bySet.has(printing.setId)) bySet.set(printing.setId, []);
      bySet.get(printing.setId).push(printing);
      searchCards.push(compactSearchCard(card, cardSet, set));
      if (printing.images.small || printing.images.normal) imageCount += 1;
      if (!cardSet) databaseOnlyCount += 1;
      cardCount += 1;
    }
  }

  if (databaseOnlyCount) setsByName.set(databaseOnlySet.name, databaseOnlySet);

  const sets = Array.from(setsByName.values())
    .map((set) => ({
      ...set,
      cardCount: bySet.get(set.id)?.length || 0,
    }))
    .filter((set) => set.cardCount > 0)
    .sort(sortSets);

  const validSetIds = new Set(sets.map((set) => set.id));
  for (const fileName of fs.readdirSync(cardsBySetDir)) {
    if (!fileName.endsWith(".json")) continue;
    const setId = fileName.replace(/\.json$/, "");
    if (!validSetIds.has(setId)) fs.unlinkSync(path.join(cardsBySetDir, fileName));
  }

  const setSummaries = [];
  for (const set of sets) {
    const guarded = guardCardsForImport(bySet.get(set.id) || [], normalizeYugiohCardForGuard, {
      includeVariant: true,
      strictCodes: ["MISSING_CARD_ID", "MISSING_SET_ASSOCIATION"],
    });
    if (guarded.strictFailures.length) {
      throw new Error(`Yu-Gi-Oh import validation failed for ${set.id}: ${guarded.strictFailures.length} required identity issues`);
    }
    if (guarded.duplicates.length) {
      console.log(`  ${set.id}: hidden duplicate card records before write: ${guarded.duplicates.length}`);
    }
    const cards = guarded.data.sort(sortCards);
    writeJson(path.join(cardsBySetDir, `${set.id}.json`), cards);
    setSummaries.push({
      id: set.id,
      name: set.name,
      tcgDate: set.tcgDate,
      cardCount: cards.length,
      imageCount: cards.filter((card) => card.images.small || card.images.normal).length,
    });
  }

  const guardedSearchCards = guardCardsForImport(searchCards, normalizeYugiohCardForGuard, {
    includeVariant: true,
    strictCodes: ["MISSING_CARD_ID", "MISSING_SET_ASSOCIATION"],
  });
  if (guardedSearchCards.strictFailures.length) {
    throw new Error(`Yu-Gi-Oh search import validation failed: ${guardedSearchCards.strictFailures.length} required identity issues`);
  }

  writeJson(path.join(outputDir, "sets.json"), sets);
  writeJson(path.join(outputDir, "cards-search.json"), guardedSearchCards.data.sort(sortSearchCards));
  writeJson(path.join(outputDir, "manifest.json"), {
    importedAt,
    source: "YGOPRODeck API cardinfo and cardsets endpoints",
    sourceUrls: ["https://ygoprodeck.com/api-guide/", "https://db.ygoprodeck.com/api/v7/cardinfo.php", "https://db.ygoprodeck.com/api/v7/cardsets.php"],
    releasedThrough,
    setCount: sets.length,
    cardCount,
    uniqueCardCount: rawCards.length,
    imageCount,
    missingImageCount: cardCount - imageCount,
    databaseOnlyCount,
    setSummaries,
  });

  console.log(`Imported ${cardCount} Yu-Gi-Oh card printings (${rawCards.length} unique cards) across ${sets.length} sets.`);
  console.log(`Cards with images: ${imageCount}/${cardCount}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
