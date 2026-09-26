const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "wii.json");
const manifestPath = path.join(outputDir, "wii-manifest.json");
const pageTitle = "List_of_Wii_games";
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
  return {
    title: stripTags(link[2]),
    articleUrl: href.startsWith("/wiki/") ? `https://en.wikipedia.org${href}` : href,
  };
}

function extractAliases(cellHtml, primaryTitle) {
  return stripTags(cellHtml)
    .split("\n")
    .map((part) => part.replace(/^[*\-]\s*/, "").replace(/\^[A-Z, /]+$/g, "").trim())
    .filter(Boolean)
    .filter((part) => part !== primaryTitle);
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
    headers: { Accept: "application/json", "User-Agent": "GamesCardsExchange/0.1 (local Wii importer)" },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
  const html = (await response.json()).parse.text["*"];
  const marker = html.indexOf('id="softwarelist"');
  if (marker === -1) throw new Error("Could not find Wii softwarelist table.");
  const tableStart = html.lastIndexOf("<table", marker);
  const tableEnd = html.indexOf("</table>", marker);
  return html.slice(tableStart, tableEnd + "</table>".length);
}

function parseOfficialRows(tableHtml) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];

  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 8) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const aliases = extractAliases(cells[0], title);
    const developer = cleanPartyCell(cells[1]);
    const publisher = cleanPartyCell(cells[2]);
    const firstReleased = cleanDate(cells[3]);
    const releases = {
      japan: cleanDate(cells[4]),
      northAmerica: cleanDate(cells[5]),
      australasia: cleanDate(cells[6]),
      europe: cleanDate(cells[7]),
    };
    const releasedRegions = Object.entries(releases)
      .filter(([, date]) => Boolean(date))
      .map(([region]) => region);

    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }

    const releaseYears = extractYears([firstReleased, ...Object.values(releases)]);
    games.push({
      id: `wii-${slugify(title)}`,
      title,
      aliases,
      platform: "Nintendo Wii",
      platforms: ["Nintendo Wii", "Wii"],
      era: "Retro",
      format: "Wii optical disc",
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
      description: "Officially released Nintendo Wii game record.",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia Wii software list",
      tags: ["nintendo wii", "wii", "official release", "retro", "disc", "motion controls"],
      demandTier: "Official Wii library",
      tradeNotes:
        "Verify region, disc condition, case/manual/inserts, controller accessory requirements, save/peripheral support, and whether the copy is loose, complete-in-box, sealed, or a later print.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        aliases.join(" "),
        developer,
        publisher,
        firstReleased,
        Object.values(releases).join(" "),
        releasedRegions.join(" "),
        "nintendo wii official release retro disc motion controls",
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
        source: "Wikipedia List of Wii games",
        sourceUrl,
        scope:
          "Rows from the Wii softwarelist table with at least one Japan, North America, Australasia, or Europe release date. Excludes WiiWare-only lists and rows unreleased in every region.",
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
  console.log(`Imported ${games.length} official Wii records.`);
  console.log(`Skipped ${skipped.length} rows without regional release dates.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
