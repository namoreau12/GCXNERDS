const fs = require("node:fs");
const path = require("node:path");
const { guardCardsForImport } = require("./tcg-card-pipeline-utils");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const outputDir = path.join(rootDir, "data", "pokemon");
const cardsBySetDir = path.join(outputDir, "cards-by-set");
const pokemonApiBase = "https://api.pokemontcg.io/v2";
const pageSize = 100;

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) return;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchJsonWithRetry(url, attempts = 5) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const headers = {
        Accept: "application/json",
        "User-Agent": "GamesCardsExchangeImporter/0.1",
      };

      if (process.env.POKEMON_TCG_API_KEY) {
        headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
      }

      const response = await fetch(url, { headers });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Pokemon API returned ${response.status}: ${text.slice(0, 120)}`);
      }

      return JSON.parse(text);
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await wait(750 * attempt);
      }
    }
  }

  throw lastError;
}

function sortByReleaseDateDesc(a, b) {
  return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
}

function normalizePokemonDate(value) {
  return String(value || "").replace(/\/0{2,}(\d)/g, "/0$1");
}

function normalizeSetMetadata(set) {
  return {
    ...set,
    releaseDate: normalizePokemonDate(set.releaseDate),
    updatedAt: normalizePokemonDate(set.updatedAt),
  };
}

function sortCards(a, b) {
  if (a.set?.id !== b.set?.id) {
    return String(a.set?.id || "").localeCompare(String(b.set?.id || ""));
  }

  return String(a.number || "").localeCompare(String(b.number || ""), undefined, { numeric: true });
}

function normalizePokemonCardForGuard(card) {
  return {
    franchise: "pokemon",
    cardId: card.id || "",
    setCode: card.set?.id || "",
    setName: card.set?.name || "",
    cardNumber: card.number || "",
    cardName: card.name || "",
    variant: [card.rarity, ...(card.subtypes || [])].filter(Boolean).join(" / "),
    language: "en",
    imageFront: card.images?.large || card.images?.small || "",
    imageThumbnail: card.images?.small || card.images?.large || "",
    rarity: card.rarity || "",
  };
}

async function fetchAllSets() {
  const result = await fetchJsonWithRetry(`${pokemonApiBase}/sets?orderBy=-releaseDate`);
  return (result.data || []).map(normalizeSetMetadata).sort(sortByReleaseDateDesc);
}

async function fetchCardsForSet(set) {
  const cards = [];
  let page = 1;
  let totalCount = Infinity;

  while (cards.length < totalCount) {
    const result = await fetchJsonWithRetry(
      `${pokemonApiBase}/cards?q=${encodeURIComponent(`set.id:${set.id}`)}&orderBy=number&pageSize=${pageSize}&page=${page}`
    );
    const pageCards = result.data || [];
    cards.push(...pageCards);
    totalCount = result.totalCount || pageCards.length;

    if (pageCards.length < pageSize) {
      break;
    }

    page += 1;
    await wait(150);
  }

  return cards;
}

function writeJson(filename, value) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(value, null, 2));
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeSetCards(setId, cards) {
  fs.mkdirSync(cardsBySetDir, { recursive: true });
  const guarded = guardCardsForImport(cards, normalizePokemonCardForGuard, {
    includeVariant: true,
    strictCodes: ["MISSING_CARD_ID", "MISSING_SET_ASSOCIATION", "MISSING_CARD_NUMBER"],
  });
  if (guarded.strictFailures.length) {
    throw new Error(`Pokemon import validation failed for ${setId}: ${guarded.strictFailures.length} required identity issues`);
  }
  if (guarded.duplicates.length) {
    console.log(`  hidden duplicate card records before write: ${guarded.duplicates.length}`);
  }
  fs.writeFileSync(path.join(cardsBySetDir, `${setId}.json`), JSON.stringify(guarded.data, null, 2));
}

function readSetCards(setId) {
  return readJsonIfExists(path.join(cardsBySetDir, `${setId}.json`));
}

function combineImportedCards(sets) {
  const cards = [];
  const missingSets = [];

  sets.forEach((set) => {
    const setCards = readSetCards(set.id);

    if (Array.isArray(setCards)) {
      cards.push(...setCards);
    } else {
      missingSets.push(set.id);
    }
  });

  return {
    cards: guardCardsForImport(cards, normalizePokemonCardForGuard, {
      includeVariant: true,
      strictCodes: ["MISSING_CARD_ID", "MISSING_SET_ASSOCIATION", "MISSING_CARD_NUMBER"],
    }).data.sort(sortCards),
    missingSets,
  };
}

async function main() {
  loadEnvFile();

  const importedAt = new Date().toISOString();
  console.log("Importing Pokemon TCG sets...");
  const existingSets = readJsonIfExists(path.join(outputDir, "sets.json"));
  const sets = (Array.isArray(existingSets) ? existingSets : await fetchAllSets()).map(normalizeSetMetadata);
  writeJson("sets.json", sets);
  console.log(`Found ${sets.length} sets.`);

  const failures = [];

  for (const [index, set] of sets.entries()) {
    try {
      const existingCards = readSetCards(set.id);

      if (Array.isArray(existingCards) && existingCards.length) {
        console.log(`[${index + 1}/${sets.length}] ${set.name} (${set.id}) - already imported`);
        continue;
      }

      console.log(`[${index + 1}/${sets.length}] ${set.name} (${set.id})`);
      const cards = await fetchCardsForSet(set);
      writeSetCards(set.id, cards);
      console.log(`  ${cards.length} cards`);
    } catch (error) {
      failures.push({
        setId: set.id,
        setName: set.name,
        error: error.message,
      });
      console.log(`  failed: ${error.message}`);
    }
  }

  const combined = combineImportedCards(sets);

  writeJson("cards.json", combined.cards);
  writeJson("manifest.json", {
    importedAt,
    setCount: sets.length,
    cardCount: combined.cards.length,
    completedSetCount: sets.length - combined.missingSets.length,
    missingSetCount: combined.missingSets.length,
    missingSets: combined.missingSets,
    failedSetCount: failures.length,
    failures,
  });

  console.log(`Imported ${combined.cards.length} cards across ${sets.length - combined.missingSets.length}/${sets.length} sets.`);

  if (failures.length || combined.missingSets.length) {
    console.log(`Re-run the importer to fill ${combined.missingSets.length} missing sets and ${failures.length} failed sets.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
