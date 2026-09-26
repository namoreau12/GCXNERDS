const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "n64.json");
const manifestPath = path.join(outputDir, "n64-manifest.json");
const pageTitle = "List_of_Nintendo_64_games";
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
  if (!link) return { title: stripTags(cellHtml).split("\n")[0], articleUrl: "" };

  const href = decodeHtml(link[1]);
  const title = stripTags(link[2]);

  return {
    title,
    articleUrl: href.startsWith("/wiki/") ? `https://en.wikipedia.org${href}` : href,
  };
}

function cleanPartyCell(cellHtml) {
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
    for (const match of String(value || "").matchAll(/\b(19[89]\d|20\d\d)\b/g)) years.add(match[1]);
  });
  return Array.from(years).sort();
}

async function fetchOfficialTableHtml() {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local official N64 importer)",
    },
  });

  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);

  const result = await response.json();
  const html = result.parse.text["*"];
  const tableStart = html.indexOf('id="softwarelist"');
  if (tableStart === -1) throw new Error("Could not find N64 softwarelist table.");

  const actualStart = html.lastIndexOf("<table", tableStart);
  const tableEnd = html.indexOf("</table>", tableStart);
  return html.slice(actualStart, tableEnd + "</table>".length);
}

function parseOfficialRows(tableHtml) {
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
      japan: cleanDate(cells[4]),
      northAmerica: cleanDate(cells[5]),
      pal: cleanDate(cells[6]),
    };
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);

    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }

    games.push({
      id: `n64-${slugify(title)}`,
      title,
      aliases: [],
      platform: "Nintendo 64",
      platforms: ["Nintendo 64", "N64"],
      era: "Retro",
      format: "Nintendo 64 cartridge",
      generation: "Fifth",
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased,
      releases,
      releasedRegions,
      releaseYears: extractYears([firstReleased, ...Object.values(releases)]),
      genres: [],
      description: "",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia official Nintendo 64 software list",
      tags: ["n64", "nintendo 64", "official release", "retro", "cartridge"],
      demandTier: "Official N64 library",
      tradeNotes:
        "Verify region, cartridge authenticity, label condition, back label, board photos for high-value titles, box/manuals, and whether the copy is loose or complete-in-box.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        developer,
        publisher,
        firstReleased,
        Object.values(releases).join(" "),
        releasedRegions.join(" "),
        "n64 nintendo 64 official release retro cartridge",
      ].join(" ").toLowerCase(),
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
  console.log("Importing official Nintendo 64 release list...");
  const tableHtml = await fetchOfficialTableHtml();
  const { games, skipped } = parseOfficialRows(tableHtml);

  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia List of Nintendo 64 games",
        sourceUrl,
        scope:
          "Rows from the official software list with at least one Japan, North America, or PAL release date. Excludes the separate cancelled, unreleased, and aftermarket table.",
        gameCount: games.length,
        skippedUnreleasedOrCancelledRows: skipped.length,
        articleCount: games.filter((game) => game.articleUrl).length,
        imageCount: 0,
        missingImageCount: games.length,
        overviewStatusCounts: { needs_editorial: games.length },
      },
      null,
      2
    )
  );

  console.log(`Imported ${games.length} official Nintendo 64 records.`);
  console.log(`Skipped ${skipped.length} unreleased/cancelled-only rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
