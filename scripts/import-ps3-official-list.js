const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "ps3.json");
const manifestPath = path.join(outputDir, "ps3-manifest.json");
const sourcePages = [
  ["A-C", "List_of_PlayStation_3_games_%28A%E2%80%93C%29", "https://en.wikipedia.org/wiki/List_of_PlayStation_3_games_%28A%E2%80%93C%29"],
  ["D-I", "List_of_PlayStation_3_games_%28D%E2%80%93I%29", "https://en.wikipedia.org/wiki/List_of_PlayStation_3_games_%28D%E2%80%93I%29"],
  ["J-P", "List_of_PlayStation_3_games_%28J%E2%80%93P%29", "https://en.wikipedia.org/wiki/List_of_PlayStation_3_games_%28J%E2%80%93P%29"],
  ["Q-Z", "List_of_PlayStation_3_games_%28Q%E2%80%93Z%29", "https://en.wikipedia.org/wiki/List_of_PlayStation_3_games_%28Q%E2%80%93Z%29"],
].map(([range, pageTitle, sourceUrl]) => ({
  range,
  pageTitle,
  label: `List of PlayStation 3 games (${range})`,
  sourceUrl,
}));

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

function cleanDate(cellHtml) {
  const text = stripTags(cellHtml);
  if (!text || /unreleased|cancelled|canceled|tba/i.test(text)) return "";
  return text;
}

function cleanPartyCell(cellHtml) {
  return stripTags(cellHtml)
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function extractYears(values) {
  const years = new Set();
  values.forEach((value) => {
    for (const match of String(value || "").matchAll(/\b(20\d\d)\b/g)) years.add(match[1]);
  });
  return Array.from(years).sort();
}

function cleanOptions(cellHtml) {
  const text = stripTags(cellHtml).replace(/\s+/g, " ").trim();
  const options = [];
  if (/\bD\b|Digital/i.test(text)) options.push("Digital only");
  if (/3D/.test(text)) options.push("3D");
  if (/\bM\b|Move/i.test(text)) options.push("PlayStation Move");
  if (/F2P|Free-to-play/i.test(text)) options.push("Free-to-play");
  if (/\bE\b|Eye/i.test(text)) options.push("PlayStation Eye");
  if (/SV|SimulView/i.test(text)) options.push("SimulView");
  return Array.from(new Set(options));
}

async function fetchSoftwareTableHtml(page) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${page.pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local official PS3 importer)",
    },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status} for ${page.label}`);
  const result = await response.json();
  const html = result.parse?.text?.["*"];
  if (!html) throw new Error(`Could not parse ${page.label}`);
  const marker = html.indexOf('id="softwarelist"');
  if (marker === -1) throw new Error(`Could not find softwarelist table for ${page.label}`);
  const start = html.lastIndexOf("<table", marker);
  const end = html.indexOf("</table>", marker);
  return html.slice(start, end + "</table>".length);
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
    const releases = {
      japan: cleanDate(cells[2]),
      pal: cleanDate(cells[3]),
      northAmerica: cleanDate(cells[4]),
    };
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);
    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }
    const releaseYears = extractYears(Object.values(releases));
    const options = cleanOptions(cells[5]);

    games.push({
      id: `ps3-${slugify(title)}`,
      title,
      aliases: [],
      platform: "PlayStation 3",
      platforms: ["PlayStation 3", "PS3"],
      era: "Modern retro",
      format: options.includes("Digital only") ? "PlayStation Network download" : "PlayStation 3 Blu-ray/DVD or digital",
      generation: "Seventh",
      developer,
      publisher: "",
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: [],
      firstReleased: releaseYears[0] || "",
      releases,
      releasedRegions,
      releaseYears,
      options,
      genres: [],
      description: "",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl: page.sourceUrl,
      source: `${page.label} software list`,
      tags: ["ps3", "playstation 3", "sony playstation", "official release", "blu-ray", "digital"],
      demandTier: "Official PlayStation 3 library",
      tradeNotes:
        "Verify region, disc condition, case/manual completeness, Greatest Hits/Platinum status, DLC voucher status, installation or online dependencies, and whether the copy is loose disc, complete-in-box, sealed, or digital-only.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        developer,
        Object.values(releases).join(" "),
        releasedRegions.join(" "),
        options.join(" "),
        "ps3 playstation 3 sony official release blu-ray digital",
      ].join(" ").toLowerCase(),
    });
  });
  return { games, skipped };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("Importing official PlayStation 3 software lists...");
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
        source: "Wikipedia PlayStation 3 software lists",
        sourceUrls: sourcePages.map((page) => page.sourceUrl),
        scope:
          "Rows from the four PlayStation 3 softwarelist tables with at least one JP, PAL, or NA release date. The source excludes PlayStation minis, PS one Classics, and PS2 Classics.",
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
  console.log(`Imported ${games.length} official PlayStation 3 records.`);
  console.log(`Skipped ${allSkipped.length} unreleased-only rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
