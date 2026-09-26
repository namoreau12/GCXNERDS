const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "psp.json");
const manifestPath = path.join(outputDir, "psp-manifest.json");
const pageTitle = "List_of_PlayStation_Portable_games";
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

async function fetchMainTableHtml() {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "GamesCardsExchange/0.1 (local PSP importer)" },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
  const html = (await response.json()).parse.text["*"];
  const table = Array.from(html.matchAll(/<table\b[\s\S]*?<\/table>/gi)).map((match) => match[0])[0];
  if (!table) throw new Error("Could not find PSP main games table.");
  return table;
}

function parseRows(tableHtml) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];

  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 7) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const releases = {
      northAmerica: cleanDate(cells[1]),
      europe: cleanDate(cells[2]),
      asiaJapan: cleanDate(cells[3]),
      australia: cleanDate(cells[4]),
    };
    const developer = cleanCell(cells[5]);
    const publisher = cleanCell(cells[6]);
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);
    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }

    const releaseYears = extractYears(Object.values(releases));
    games.push({
      id: `psp-${slugify(title)}`,
      title,
      aliases: [],
      platform: "PSP",
      platforms: ["PSP", "PlayStation Portable"],
      era: "Modern Retro",
      format: "UMD / PlayStation Store",
      generation: "Seventh",
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
      description: "Officially released PSP game record.",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia PlayStation Portable games list",
      tags: ["psp", "playstation portable", "sony", "official release", "modern retro", "umd"],
      demandTier: "Official PSP library",
      tradeNotes:
        "Verify region, UMD shell and disc condition, case/manual/inserts, Greatest Hits or Essentials status, download-voucher contents, memory-stick needs, and whether the copy is loose, complete-in-box, sealed, or digital-only.",
      overviewStatus: "needs_editorial",
      searchText: [title, developer, publisher, Object.values(releases).join(" "), releasedRegions.join(" "), "psp playstation portable sony official release umd"].join(" ").toLowerCase(),
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
  const { games, skipped } = parseRows(await fetchMainTableHtml());
  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia List of PlayStation Portable games",
        sourceUrl,
        scope:
          "Rows from the main PSP games table with at least one North America, Europe, Asia/Japan, or Australia release date. Excludes the separate non-game/downloadable software table and navbox content.",
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
  console.log(`Imported ${games.length} official PSP records.`);
  console.log(`Skipped ${skipped.length} PSP rows without release dates.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
