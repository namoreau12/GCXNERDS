const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "gba.json");
const manifestPath = path.join(outputDir, "gba-manifest.json");
const pageTitle = "List_of_Game_Boy_Advance_games";
const sourceUrl = "https://en.wikipedia.org/wiki/List_of_Game_Boy_Advance_games";

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
  return Array.from(rowHtml.matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi)).map((match) => match[2]);
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
  return stripTags(cellHtml).split("\n").map((part) => part.trim()).filter(Boolean).join(", ");
}

function cleanDateCell(cellHtml) {
  const text = stripTags(cellHtml);
  if (!text || /unreleased|cancelled|canceled|tba/i.test(text)) return "";
  return text;
}

function hasYes(cellHtml) {
  return /table-yes|data-sort-value="Yes"|alt="Yes"|title="Yes"|>\s*(Yes|Ya)\s*</i.test(cellHtml) || /\b(Yes|Ya)\b/i.test(stripTags(cellHtml));
}

function extractYears(values) {
  const years = new Set();
  values.forEach((value) => {
    for (const match of String(value || "").matchAll(/\b(20\d\d|19[89]\d)\b/g)) years.add(match[1]);
  });
  return Array.from(years).sort();
}

async function fetchOfficialTableHtml() {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local official GBA importer)",
    },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
  const result = await response.json();
  const html = result.parse?.text?.["*"];
  const marker = html?.indexOf('id="softwarelist"') ?? -1;
  if (marker === -1) throw new Error("Could not find GBA softwarelist table.");
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
    if (cells.length < 9) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const developer = cleanCellList(cells[1]);
    const publisher = cleanCellList(cells[2]);
    const releaseDates = cleanDateCell(cells[3]);
    const releases = {
      japan: hasYes(cells[4]) ? "Released" : "",
      northAmerica: hasYes(cells[5]) ? "Released" : "",
      pal: hasYes(cells[6]) ? "Released" : "",
      australia: hasYes(cells[7]) ? "Released" : "",
      korea: hasYes(cells[8]) ? "Released" : "",
    };
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);
    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }
    const releaseYears = extractYears([releaseDates]);
    games.push({
      id: `gba-${slugify(title)}`,
      title,
      aliases: [],
      platform: "Game Boy Advance",
      platforms: ["Game Boy Advance", "GBA"],
      era: "Retro",
      format: "Game Boy Advance cartridge",
      generation: "Sixth",
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased: releaseYears[0] || "",
      releaseDates,
      releases,
      releasedRegions,
      releaseYears,
      genres: [],
      description: "",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia List of Game Boy Advance games software list",
      tags: ["game boy advance", "gba", "nintendo", "official release", "retro", "cartridge"],
      demandTier: "Official Game Boy Advance library",
      tradeNotes:
        "Verify region, cartridge shell, label condition, board authenticity, battery-backed save status, box/manuals, inserts, and whether the copy is loose, complete-in-box, sealed, or a later reprint.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        developer,
        publisher,
        releaseDates,
        releasedRegions.join(" "),
        "game boy advance gba nintendo official release retro cartridge",
      ].join(" ").toLowerCase(),
    });
  });
  return { games, skipped };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("Importing official Game Boy Advance list...");
  const { games, skipped } = parseRows(await fetchOfficialTableHtml());
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
        source: "Wikipedia List of Game Boy Advance games",
        sourceUrls: [sourceUrl],
        scope:
          "Rows from the main Game Boy Advance softwarelist table with at least one JP, NA, PAL, AU, or KOR release marker. Excludes unrelated lists outside the main software table.",
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
  console.log(`Imported ${finalGames.length} official Game Boy Advance records.`);
  console.log(`Skipped ${skipped.length} rows without release markers.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
