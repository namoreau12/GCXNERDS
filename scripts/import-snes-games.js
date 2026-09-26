const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "snes.json");
const manifestPath = path.join(outputDir, "snes-manifest.json");
const wikidataEndpoint = "https://query.wikidata.org/sparql";

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addUnique(target, value) {
  if (value && !target.includes(value)) {
    target.push(value);
  }
}

function yearFromDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : String(date.getUTCFullYear());
}

async function fetchSnesRows() {
  const query = `
SELECT ?game ?gameLabel ?description ?publicationDate ?genreLabel ?developerLabel ?publisherLabel ?image ?article WHERE {
  ?game wdt:P31/wdt:P279* wd:Q7889;
        wdt:P400 wd:Q183259.
  OPTIONAL { ?game schema:description ?description FILTER(LANG(?description) = "en") }
  OPTIONAL { ?game wdt:P577 ?publicationDate. }
  OPTIONAL { ?game wdt:P136 ?genre. }
  OPTIONAL { ?game wdt:P178 ?developer. }
  OPTIONAL { ?game wdt:P123 ?publisher. }
  OPTIONAL { ?game wdt:P18 ?image. }
  OPTIONAL {
    ?article schema:about ?game;
             schema:isPartOf <https://en.wikipedia.org/>.
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
  const url = `${wikidataEndpoint}?format=json&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "GamesCardsExchange/0.1 (local SNES importer)",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata returned ${response.status}`);
  }

  const result = await response.json();
  return result.results.bindings;
}

function mergeRows(rows) {
  const byQid = new Map();

  rows.forEach((row) => {
    const wikidataUrl = row.game?.value || "";
    const wikidataId = wikidataUrl.split("/").pop();
    const title = row.gameLabel?.value || wikidataId;

    if (!byQid.has(wikidataId)) {
      byQid.set(wikidataId, {
        id: `snes-${slugify(title)}-${wikidataId.toLowerCase()}`,
        title,
        platform: "Super Nintendo Entertainment System",
        platforms: ["Super Nintendo Entertainment System", "Super NES", "SNES", "Super Famicom"],
        era: "Retro",
        format: "Super NES Game Pak",
        generation: "Fourth",
        releaseYears: [],
        genres: [],
        developers: [],
        publishers: [],
        description: row.description?.value || "",
        imageUrl: row.image?.value || "",
        articleUrl: row.article?.value || "",
        wikidataId,
        wikidataUrl,
        tags: ["snes", "super nintendo", "super famicom", "retro", "cartridge"],
        demandTier: "SNES library",
        tradeNotes:
          "Verify region, label condition, cartridge authenticity, save battery when applicable, box/manuals, and whether the copy is loose or complete-in-box.",
      });
    }

    const game = byQid.get(wikidataId);

    if (!game.description && row.description?.value) game.description = row.description.value;
    if (!game.imageUrl && row.image?.value) game.imageUrl = row.image.value;
    if (!game.articleUrl && row.article?.value) game.articleUrl = row.article.value;

    addUnique(game.releaseYears, yearFromDate(row.publicationDate?.value));
    addUnique(game.genres, row.genreLabel?.value);
    addUnique(game.developers, row.developerLabel?.value);
    addUnique(game.publishers, row.publisherLabel?.value);
  });

  return Array.from(byQid.values())
    .map((game) => ({
      ...game,
      releaseYears: game.releaseYears.filter(Boolean).sort(),
      genres: game.genres.sort(),
      developers: game.developers.sort(),
      publishers: game.publishers.sort(),
      searchText: [
        game.title,
        game.platforms.join(" "),
        game.releaseYears.join(" "),
        game.genres.join(" "),
        game.developers.join(" "),
        game.publishers.join(" "),
        game.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase(),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("Importing SNES games from Wikidata...");
  const rows = await fetchSnesRows();
  console.log(`Fetched ${rows.length} rows.`);
  const games = mergeRows(rows);

  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikidata Query Service",
        platform: "Super Nintendo Entertainment System",
        rowCount: rows.length,
        gameCount: games.length,
        imageCount: games.filter((game) => game.imageUrl).length,
        articleCount: games.filter((game) => game.articleUrl).length,
      },
      null,
      2
    )
  );

  console.log(`Imported ${games.length} unique SNES games.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
