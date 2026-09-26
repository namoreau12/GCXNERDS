const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "vita.json");
const manifestPath = path.join(outputDir, "vita-manifest.json");
const sourcePages = [
  "List_of_PlayStation_Vita_games_(A%E2%80%93D)",
  "List_of_PlayStation_Vita_games_(E%E2%80%93H)",
  "List_of_PlayStation_Vita_games_(I%E2%80%93L)",
  "List_of_PlayStation_Vita_games_(M%E2%80%93O)",
  "List_of_PlayStation_Vita_games_(P%E2%80%93R)",
  "List_of_PlayStation_Vita_games_(S)",
  "List_of_PlayStation_Vita_games_(T%E2%80%93V)",
  "List_of_PlayStation_Vita_games_(W%E2%80%93Z)",
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeHtml(
    String(value || "")
      .replace(/<sup[\s\S]*?<\/sup>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractCells(rowHtml) {
  return Array.from(rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((match) => match[1]);
}

function extractFirstArticle(cellHtml) {
  const link = cellHtml.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  const fallbackTitle = stripTags(cellHtml).split("\n")[0];
  if (!link) return { title: fallbackTitle, articleUrl: "" };
  const href = decodeHtml(link[1]);
  return {
    title: stripTags(link[2]) || fallbackTitle,
    articleUrl: href.startsWith("/wiki/") ? `https://en.wikipedia.org${href}` : href,
  };
}

function cleanCell(cellHtml) {
  return stripTags(cellHtml)
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function cleanDate(cellHtml) {
  const text = stripTags(cellHtml);
  if (!text || /unreleased|cancelled|canceled|tba/i.test(text)) return "";
  return text;
}

function extractYears(values) {
  const years = new Set();
  values.forEach((value) => {
    for (const match of String(value || "").matchAll(/\b(20\d\d|19\d\d)\b/g)) years.add(match[1]);
  });
  return Array.from(years).sort();
}

function isGameGenre(genre) {
  return !/\b(application|app|system software|utility)\b/i.test(genre);
}

async function fetchFirstTableHtml(pageTitle) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "GamesCardsExchange/0.1 (local Vita importer)" },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status} for ${pageTitle}`);
  const result = await response.json();
  const html = result.parse.text["*"];
  const table = Array.from(html.matchAll(/<table\b[\s\S]*?<\/table>/gi)).map((match) => match[0])[0];
  if (!table) throw new Error(`Could not find Vita games table for ${pageTitle}.`);
  return table;
}

function parseRows(tableHtml, sourceUrl) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];

  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 8) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const genre = cleanCell(cells[1]);
    const developer = cleanCell(cells[2]);
    const publisher = cleanCell(cells[3]);
    const releases = {
      northAmerica: cleanDate(cells[4]),
      europe: cleanDate(cells[5]),
      japan: cleanDate(cells[6]),
    };
    const psTvCompatible = cleanCell(cells[7]);
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);
    if (!title || !releasedRegions.length || !isGameGenre(genre)) {
      skipped.push(title || "Untitled row");
      return;
    }

    const releaseYears = extractYears(Object.values(releases));
    games.push({
      id: `vita-${slugify(title)}`,
      title,
      aliases: [],
      platform: "PS Vita",
      platforms: ["PS Vita", "PlayStation Vita", "PlayStation TV"],
      era: "Modern Retro",
      format: "PS Vita Card / PlayStation Store",
      generation: "Eighth",
      genre,
      genres: genre ? genre.split(", ").filter(Boolean) : [],
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased: releaseYears[0] || "",
      releaseDates: Object.values(releases).filter(Boolean).join("\n"),
      releases,
      releasedRegions,
      releaseYears,
      psTvCompatible,
      description: "Officially released PlayStation Vita game record.",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia PlayStation Vita games list",
      tags: ["vita", "playstation vita", "ps vita", "sony", "official release", "modern retro"],
      demandTier: "Official PS Vita library",
      tradeNotes:
        "Verify region, Vita card label and contacts, case/manual/inserts, Limited Run or Asian-English print status, DLC or online dependency, PlayStation TV compatibility, and whether the copy is loose, complete-in-box, sealed, or digital-only.",
      overviewStatus: "needs_editorial",
      searchText: [title, genre, developer, publisher, Object.values(releases).join(" "), releasedRegions.join(" "), psTvCompatible, "ps vita playstation vita sony official release"].join(" ").toLowerCase(),
    });
  });

  return { games, skipped };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const collected = [];
  const skipped = [];
  for (const [index, pageTitle] of sourcePages.entries()) {
    if (index) await delay(900);
    const sourceUrl = `https://en.wikipedia.org/wiki/${pageTitle}`;
    const parsed = parseRows(await fetchFirstTableHtml(pageTitle), sourceUrl);
    collected.push(...parsed.games);
    skipped.push(...parsed.skipped);
  }

  const unique = new Map();
  collected.forEach((game) => {
    if (!unique.has(game.id)) unique.set(game.id, game);
  });
  const games = Array.from(unique.values()).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia PlayStation Vita games lists",
        sourceUrls: sourcePages.map((pageTitle) => `https://en.wikipedia.org/wiki/${pageTitle}`),
        scope:
          "Rows from the PlayStation Vita A-Z games tables with at least one North America, Europe, or Japan release date. Excludes rows marked as applications/utilities and navbox content.",
        gameCount: games.length,
        skippedRows: skipped.length,
        articleCount: games.filter((game) => game.articleUrl).length,
        imageCount: 0,
        missingImageCount: games.length,
        overviewStatusCounts: { needs_editorial: games.length },
      },
      null,
      2
    )
  );
  console.log(`Imported ${games.length} official PS Vita records.`);
  console.log(`Skipped ${skipped.length} Vita rows without release dates or game genres.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
