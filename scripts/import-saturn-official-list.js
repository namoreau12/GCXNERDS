const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "saturn.json");
const manifestPath = path.join(outputDir, "saturn-manifest.json");
const pageTitle = "List_of_Sega_Saturn_games";
const sourceUrl = `https://en.wikipedia.org/wiki/${pageTitle}`;

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

function stripTags(value) {
  return decodeHtml(
    String(value || "")
      .replace(/<sup[\s\S]*?<\/sup>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/ul>/gi, "\n")
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
  const header = rowHtml.match(/<th\b[^>]*scope="row"[^>]*>([\s\S]*?)<\/th>/i);
  const cells = Array.from(rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((match) => match[1]);
  return header ? [header[1], ...cells] : cells;
}

function extractFirstArticle(cellHtml) {
  const link = cellHtml.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  if (!link) return { title: stripTags(cellHtml).split("\n")[0], articleUrl: "" };
  const href = decodeHtml(link[1]);
  return {
    title: stripTags(link[2]),
    articleUrl: href.startsWith("/wiki/") ? `https://en.wikipedia.org${href}` : href,
  };
}

function extractAliases(cellHtml, primaryTitle) {
  return stripTags(cellHtml)
    .split("\n")
    .map((part) => part.replace(/^[*\-]\s*/, "").replace(/\b(NA|JP|PAL|EU)\b$/g, "").trim())
    .filter(Boolean)
    .filter((part) => part !== primaryTitle);
}

function cleanListCell(cellHtml) {
  return stripTags(cellHtml)
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function cleanDate(cellHtml) {
  const text = stripTags(cellHtml);
  if (!text || /unreleased|cancelled|canceled/i.test(text)) return "";
  return text;
}

function extractYears(values) {
  const years = new Set();
  values.forEach((value) => {
    for (const match of String(value || "").matchAll(/\b(20\d\d|19\d\d)\b/g)) years.add(match[1]);
  });
  return Array.from(years).sort();
}

async function fetchOfficialTableHtml() {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "GamesCardsExchange/0.1 (local Saturn importer)" },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
  const html = (await response.json()).parse.text["*"];
  const tables = Array.from(html.matchAll(/<table\b[\s\S]*?<\/table>/gi)).map((match) => match[0]);
  const licensedTable = tables[0];
  if (!licensedTable) throw new Error("Could not find Sega Saturn licensed games table.");
  return licensedTable;
}

function parseOfficialRows(tableHtml) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];

  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 6) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const aliases = extractAliases(cells[0], title);
    const developer = cleanListCell(cells[1]);
    const publisher = cleanListCell(cells[2]);
    const releases = {
      northAmerica: cleanDate(cells[3]),
      pal: cleanDate(cells[4]),
      japan: cleanDate(cells[5]),
    };
    const releasedRegions = Object.entries(releases)
      .filter(([, date]) => Boolean(date))
      .map(([region]) => region);

    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }

    const releaseYears = extractYears(Object.values(releases));
    games.push({
      id: `saturn-${slugify(title)}`,
      title,
      aliases,
      platform: "Saturn",
      platforms: ["Saturn", "Sega Saturn"],
      era: "Retro",
      format: "CD-ROM",
      generation: "Fifth",
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased: releaseYears[0] || "",
      releaseDates: Object.values(releases).filter(Boolean).join("\n"),
      releases,
      releasedRegions,
      releaseYears,
      genres: [],
      description: "Officially released Sega Saturn game record.",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia Sega Saturn licensed games list",
      tags: ["saturn", "sega saturn", "sega", "official release", "retro", "cd-rom"],
      demandTier: "Official Sega Saturn library",
      tradeNotes:
        "Verify region, disc condition, longbox or jewel-case style, manual, spine card or registration inserts, SegaNetLink or RAM cartridge support, and whether the copy is loose, complete-in-box, or sealed.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        aliases.join(" "),
        developer,
        publisher,
        Object.values(releases).join(" "),
        releasedRegions.join(" "),
        "saturn sega saturn sega official release retro cd-rom",
      ]
        .join(" ")
        .toLowerCase(),
    });
  });

  const unique = new Map();
  games.forEach((game) => {
    if (!unique.has(game.id)) unique.set(game.id, game);
  });
  return {
    games: Array.from(unique.values()).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true })),
    skipped,
  };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const tableHtml = await fetchOfficialTableHtml();
  const { games, skipped } = parseOfficialRows(tableHtml);
  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia List of Sega Saturn games",
        sourceUrl,
        scope:
          "Rows from the main licensed Sega Saturn games table with at least one North America, PAL, or Japan release date. Excludes the non-game software and compilations table plus navbox content.",
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
  console.log(`Imported ${games.length} official Sega Saturn records.`);
  console.log(`Skipped ${skipped.length} rows without regional release dates.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
