const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "gamecube.json");
const manifestPath = path.join(outputDir, "gamecube-manifest.json");
const pageTitle = "List_of_GameCube_games";
const sourceUrl = "https://en.wikipedia.org/wiki/List_of_GameCube_games";

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
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
    articleUrl: href.startsWith("/wiki/") && !href.includes("redlink=1") ? `https://en.wikipedia.org${href}` : "",
  };
}

function cleanCellList(cellHtml) {
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
    for (const match of String(value || "").matchAll(/\b(20\d\d)\b/g)) years.add(match[1]);
  });
  return Array.from(years).sort();
}

async function fetchOfficialTableHtml() {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local official GameCube importer)",
    },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
  const result = await response.json();
  const html = result.parse?.text?.["*"];
  if (!html) throw new Error("Could not parse GameCube list");
  const marker = html.indexOf('id="softwarelist"');
  if (marker === -1) throw new Error("Could not find GameCube softwarelist table");
  const start = html.lastIndexOf("<table", marker);
  const end = html.indexOf("</table>", marker);
  return html.slice(start, end + "</table>".length);
}

function parseRows(tableHtml) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];
  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 7) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const developer = cleanCellList(cells[1]);
    const publisher = cleanCellList(cells[2]);
    const firstReleased = cleanDate(cells[3]);
    const releases = {
      japan: cleanDate(cells[4]),
      northAmerica: cleanDate(cells[5]),
      pal: cleanDate(cells[6]),
    };
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);
    if (!title || !firstReleased || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }

    games.push({
      id: `gamecube-${slugify(title)}`,
      title,
      aliases: [],
      platform: "Nintendo GameCube",
      platforms: ["Nintendo GameCube", "GameCube", "GCN"],
      era: "Retro",
      format: "Nintendo GameCube optical disc",
      generation: "Sixth",
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
      source: "Wikipedia List of GameCube games software list",
      tags: ["gamecube", "nintendo gamecube", "gcn", "nintendo", "official release", "retro", "optical disc"],
      demandTier: "Official GameCube library",
      tradeNotes:
        "Verify region, disc condition, case/manual completeness, inserts, Player's Choice status, resurfacing, and whether the copy is loose disc, complete-in-box, sealed, or includes bonus materials.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        developer,
        publisher,
        firstReleased,
        Object.values(releases).join(" "),
        releasedRegions.join(" "),
        "gamecube nintendo gamecube gcn official release retro optical disc",
      ].join(" ").toLowerCase(),
    });
  });
  return { games, skipped };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("Importing official GameCube list...");
  const tableHtml = await fetchOfficialTableHtml();
  const { games, skipped } = parseRows(tableHtml);
  const unique = new Map();
  games.forEach((game) => {
    if (!unique.has(game.id)) unique.set(game.id, game);
  });
  const finalGames = Array.from(unique.values()).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  fs.writeFileSync(outputPath, JSON.stringify(finalGames, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia List of GameCube games",
        sourceUrls: [sourceUrl],
        scope:
          "Rows from the main GameCube softwarelist table with a first-release date and at least one JP, NA, or PAL release date. Excludes separate bonus discs, demo discs, cancelled games, and unreleased-only records.",
        gameCount: finalGames.length,
        skippedRows: skipped.length,
        articleCount: finalGames.filter((game) => game.articleUrl).length,
        imageCount: 0,
        missingImageCount: finalGames.length,
        overviewStatusCounts: { needs_editorial: finalGames.length },
      },
      null,
      2
    )
  );
  console.log(`Imported ${finalGames.length} official GameCube records.`);
  console.log(`Skipped ${skipped.length} rows without release markers or first-release dates.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
