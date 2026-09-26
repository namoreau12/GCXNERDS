const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "ps5.json");
const manifestPath = path.join(outputDir, "ps5-manifest.json");
const sourceUrl = "https://en.wikipedia.org/wiki/List_of_PlayStation_5_games";
const pageTitle = "List_of_PlayStation_5_games";
const today = new Date("2026-08-15T23:59:59-04:00");

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

function extractRowCells(rowHtml) {
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

function dateIsReleased(dateText) {
  if (!dateText) return false;
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) {
    const year = dateText.match(/\b(20\d\d)\b/)?.[1];
    return year ? Number(year) <= today.getFullYear() : false;
  }
  return parsed <= today;
}

function extractYears(values) {
  const years = new Set();
  values.forEach((value) => {
    for (const match of String(value || "").matchAll(/\b(20\d\d)\b/g)) years.add(match[1]);
  });
  return Array.from(years).sort();
}

function cleanAddons(cellHtml) {
  const text = stripTags(cellHtml).replace(/\s+/g, " ").trim();
  const addons = [];
  if (/\bCB\b|cross-buy/i.test(text)) addons.push("Cross-buy");
  if (/\bCP\b|cross-play/i.test(text)) addons.push("Cross-play");
  if (/\bP\b|Pro enhanced/i.test(text)) addons.push("PS5 Pro enhanced");
  return Array.from(new Set(addons));
}

async function fetchSoftwareTableHtml() {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local official PS5 importer)",
    },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
  const result = await response.json();
  const html = result.parse?.text?.["*"];
  if (!html) throw new Error("Could not parse PlayStation 5 list");
  const marker = html.indexOf('id="softwarelist"');
  if (marker === -1) throw new Error("Could not find softwarelist table");
  const start = html.lastIndexOf("<table", marker);
  const end = html.indexOf("</table>", marker);
  return html.slice(start, end + "</table>".length);
}

function parseSoftwareRows(tableHtml) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];
  rows.forEach((rowHtml) => {
    const cells = extractRowCells(rowHtml);
    if (cells.length < 8) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const genre = cleanCellList(cells[1]);
    const developer = cleanCellList(cells[2]);
    const publisher = cleanCellList(cells[3]);
    const regionalDates = {
      japan: cleanDate(cells[4]),
      northAmerica: cleanDate(cells[5]),
      pal: cleanDate(cells[6]),
    };
    const releases = Object.fromEntries(
      Object.entries(regionalDates).map(([region, date]) => [region, dateIsReleased(date) ? date : ""])
    );
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);
    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }
    const releaseYears = extractYears(Object.values(releases));
    const addons = cleanAddons(cells[7]);

    games.push({
      id: `ps5-${slugify(title)}`,
      title,
      aliases: [],
      platform: "PlayStation 5",
      platforms: ["PlayStation 5", "PS5"],
      era: "Current",
      format: "PlayStation 5 Ultra HD Blu-ray or PlayStation Store download",
      generation: "Ninth",
      genre,
      genres: genre ? genre.split(", ").filter(Boolean) : [],
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased: releaseYears[0] || "",
      releases,
      releasedRegions,
      releaseYears,
      addons,
      description: "",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia List of PlayStation 5 games software list",
      tags: ["ps5", "playstation 5", "sony playstation", "official release", "ultra hd blu-ray", "digital"],
      demandTier: "Official PlayStation 5 library",
      tradeNotes:
        "Verify region, disc condition, case completeness, edition, DLC voucher status, upgrade path, online dependencies, PS5 Pro notes, and whether the copy is physical, sealed, complete-in-box, or digital-only.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        genre,
        developer,
        publisher,
        Object.values(releases).join(" "),
        releasedRegions.join(" "),
        addons.join(" "),
        "ps5 playstation 5 sony official release ultra hd blu-ray digital",
      ].join(" ").toLowerCase(),
    });
  });
  return { games, skipped };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("Importing official PlayStation 5 software list...");
  const tableHtml = await fetchSoftwareTableHtml();
  const { games, skipped } = parseSoftwareRows(tableHtml);
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
        source: "Wikipedia List of PlayStation 5 games",
        sourceUrls: [sourceUrl],
        scope:
          "Rows from the PlayStation 5 softwarelist table with at least one JP, NA, or PAL release date on or before August 15, 2026. The source includes native PS5 games and excludes PlayStation VR2 and backwards-compatible games.",
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
  console.log(`Imported ${finalGames.length} official PlayStation 5 records.`);
  console.log(`Skipped ${skipped.length} unreleased/future-only rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
