const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "ps2.json");
const manifestPath = path.join(outputDir, "ps2-manifest.json");
const sourcePages = [
  {
    pageTitle: "List_of_PlayStation_2_games_%28A%E2%80%93K%29",
    label: "List of PlayStation 2 games (A-K)",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28A%E2%80%93K%29",
  },
  {
    pageTitle: "List_of_PlayStation_2_games_%28L%E2%80%93Z%29",
    label: "List of PlayStation 2 games (L-Z)",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28L%E2%80%93Z%29",
  },
];

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
  const title = stripTags(link[2]) || fallbackTitle;
  const articleUrl = href.startsWith("/wiki/") && !href.includes("redlink=1") ? `https://en.wikipedia.org${href}` : "";

  return { title, articleUrl };
}

function cleanPartyCell(cellHtml) {
  return stripTags(cellHtml)
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function cleanDate(cellHtml) {
  const text = stripTags(cellHtml).replace(/\b(JP|EU|PAL|NA|AS)\b/g, "").trim();
  if (!text || /unreleased|cancelled|canceled|tba/i.test(text)) return "";
  return text;
}

function hasReleaseMarker(cellHtml) {
  return /table-yes|data-sort-value="Yes"|alt="Yes"|title="Yes"|>\s*(Ya|Yes)\s*</i.test(cellHtml) || /\b(Ya|Yes)\b/i.test(stripTags(cellHtml));
}

function extractYears(values) {
  const years = new Set();
  values.forEach((value) => {
    for (const match of String(value || "").matchAll(/\b(19[89]\d|20\d\d)\b/g)) years.add(match[1]);
  });
  return Array.from(years).sort();
}

async function fetchSoftwareTableHtml(page) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${page.pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local official PS2 importer)",
    },
  });

  if (!response.ok) throw new Error(`Wikipedia returned ${response.status} for ${page.label}`);

  const result = await response.json();
  if (!result.parse?.text?.["*"]) throw new Error(`Could not parse ${page.label}`);
  const html = result.parse.text["*"];
  const tableMarker = html.indexOf('id="softwarelist"');
  if (tableMarker === -1) throw new Error(`Could not find softwarelist table for ${page.label}.`);

  const tableStart = html.lastIndexOf("<table", tableMarker);
  const tableEnd = html.indexOf("</table>", tableMarker);
  return html.slice(tableStart, tableEnd + "</table>".length);
}

function parseSoftwareRows(tableHtml, page) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];

  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 7) return;

    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const developer = cleanPartyCell(cells[1]);
    const publisher = cleanPartyCell(cells[2]);
    const firstReleased = cleanDate(cells[3]);
    const releases = {
      japan: hasReleaseMarker(cells[4]) ? "Released" : "",
      pal: hasReleaseMarker(cells[5]) ? "Released" : "",
      northAmerica: hasReleaseMarker(cells[6]) ? "Released" : "",
    };
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);

    if (!title || !firstReleased || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }

    games.push({
      id: `ps2-${slugify(title)}`,
      title,
      aliases: [],
      platform: "PlayStation 2",
      platforms: ["PlayStation 2", "PS2"],
      era: "Retro",
      format: "PlayStation 2 DVD/CD-ROM",
      generation: "Sixth",
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased,
      releases,
      releasedRegions,
      releaseYears: extractYears([firstReleased]),
      genres: [],
      description: "",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl: page.sourceUrl,
      source: `${page.label} software list`,
      tags: ["ps2", "playstation 2", "sony playstation", "official release", "retro", "dvd", "cd-rom"],
      demandTier: "Official PlayStation 2 library",
      tradeNotes:
        "Verify region, disc condition, case/manual completeness, black-label versus Greatest Hits/Platinum status, resurfacing, bonus discs, memory-card dependencies, and whether the copy is loose disc, complete-in-box, or sealed.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        developer,
        publisher,
        firstReleased,
        releasedRegions.join(" "),
        "ps2 playstation 2 sony official release retro dvd cd-rom",
      ].join(" ").toLowerCase(),
    });
  });

  return { games, skipped };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("Importing official PlayStation 2 software lists...");

  const allGames = [];
  const allSkipped = [];
  for (const page of sourcePages) {
    const tableHtml = await fetchSoftwareTableHtml(page);
    const { games, skipped } = parseSoftwareRows(tableHtml, page);
    allGames.push(...games);
    allSkipped.push(...skipped);
  }

  const unique = new Map();
  allGames.forEach((game) => {
    if (!unique.has(game.id)) unique.set(game.id, game);
  });
  const games = Array.from(unique.values()).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));

  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia PlayStation 2 software lists",
        sourceUrls: sourcePages.map((page) => page.sourceUrl),
        scope:
          "Rows from the two PlayStation 2 softwarelist tables with a first-release date and at least one JP, EU/PAL, or NA release marker. Excludes the separate applications tables.",
        gameCount: games.length,
        skippedRows: allSkipped.length,
        articleCount: games.filter((game) => game.articleUrl).length,
        imageCount: 0,
        missingImageCount: games.length,
        overviewStatusCounts: { needs_editorial: games.length },
      },
      null,
      2
    )
  );

  console.log(`Imported ${games.length} official PlayStation 2 records.`);
  console.log(`Skipped ${allSkipped.length} rows without release markers or first-release dates.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
