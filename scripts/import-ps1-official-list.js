const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "ps1.json");
const manifestPath = path.join(outputDir, "ps1-manifest.json");
const sourcePages = [
  {
    pageTitle: "List_of_PlayStation_%28console%29_games_%28A%E2%80%93L%29",
    label: "List of PlayStation (console) games (A-L)",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_%28console%29_games_%28A%E2%80%93L%29",
  },
  {
    pageTitle: "List_of_PlayStation_%28console%29_games_%28M%E2%80%93Z%29",
    label: "List of PlayStation (console) games (M-Z)",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_%28console%29_games_%28M%E2%80%93Z%29",
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

async function fetchSoftwareTableHtml(page) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${page.pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local official PS1 importer)",
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
    if (cells.length < 6) return;

    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const developer = cleanPartyCell(cells[1]);
    const publisher = cleanPartyCell(cells[2]);
    const releases = {
      japan: cleanDate(cells[3]),
      pal: cleanDate(cells[4]),
      northAmerica: cleanDate(cells[5]),
    };
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);

    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }

    const releaseYears = extractYears(Object.values(releases));

    games.push({
      id: `ps1-${slugify(title)}`,
      title,
      aliases: [],
      platform: "PlayStation",
      platforms: ["PlayStation", "PS1", "PSone"],
      era: "Retro",
      format: "PlayStation CD-ROM",
      generation: "Fifth",
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased: releaseYears[0] || "",
      releases,
      releasedRegions,
      releaseYears,
      genres: [],
      description: "",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl: page.sourceUrl,
      source: `${page.label} software list`,
      tags: ["ps1", "playstation", "sony playstation", "official release", "retro", "cd-rom"],
      demandTier: "Official PlayStation library",
      tradeNotes:
        "Verify region, disc condition, case/manual completeness, registration cards, black-label versus Greatest Hits/Platinum status, resurfacing, and whether the listing is loose disc, complete-in-box, or sealed.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        developer,
        publisher,
        Object.values(releases).join(" "),
        releasedRegions.join(" "),
        "ps1 playstation sony official release retro cd-rom",
      ].join(" ").toLowerCase(),
    });
  });

  return { games, skipped };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("Importing official PlayStation software lists...");

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
        source: "Wikipedia PlayStation (console) software lists",
        sourceUrls: sourcePages.map((page) => page.sourceUrl),
        scope:
          "Rows from the two PlayStation softwarelist tables with at least one Japan, North America, or PAL release date. Excludes the separate applications and bundles tables.",
        gameCount: games.length,
        skippedUnreleasedOrCancelledRows: allSkipped.length,
        articleCount: games.filter((game) => game.articleUrl).length,
        imageCount: 0,
        missingImageCount: games.length,
        overviewStatusCounts: { needs_editorial: games.length },
      },
      null,
      2
    )
  );

  console.log(`Imported ${games.length} official PlayStation records.`);
  console.log(`Skipped ${allSkipped.length} unreleased/cancelled-only rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
