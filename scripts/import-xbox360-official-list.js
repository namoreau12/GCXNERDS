const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "xbox360.json");
const manifestPath = path.join(outputDir, "xbox360-manifest.json");
const sourcePages = ["List_of_Xbox_360_games_(A%E2%80%93L)", "List_of_Xbox_360_games_(M%E2%80%93Z)"];

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

function extractFlags(cellHtml) {
  const text = stripTags(cellHtml);
  const flags = [];
  if (/\bXBLA\b/i.test(text)) flags.push("XBLA");
  if (/\bKinect\b/i.test(text)) flags.push("Kinect");
  if (/\bXBO\b/i.test(text)) flags.push("Xbox One backward compatible");
  return flags;
}

async function fetchOfficialTableHtml(pageTitle) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: { Accept: "application/json", "User-Agent": "GamesCardsExchange/0.1 (local Xbox 360 importer)" },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status} for ${pageTitle}`);
  const html = (await response.json()).parse.text["*"];
  const marker = html.indexOf('id="softwarelist"');
  if (marker === -1) throw new Error(`Could not find Xbox 360 softwarelist table for ${pageTitle}.`);
  const tableStart = html.lastIndexOf("<table", marker);
  const tableEnd = html.indexOf("</table>", marker);
  return html.slice(tableStart, tableEnd + "</table>".length);
}

function parseOfficialRows(tableHtml, sourceUrl) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];

  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 11) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const genre = cleanListCell(cells[1]);
    const developer = cleanListCell(cells[2]);
    const publisher = cleanListCell(cells[3]);
    const releases = {
      northAmerica: cleanDate(cells[4]),
      europe: cleanDate(cells[5]),
      japan: cleanDate(cells[6]),
      australia: cleanDate(cells[7]),
    };
    const releasedRegions = Object.entries(releases)
      .filter(([, date]) => Boolean(date))
      .map(([region]) => region);

    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }

    const releaseYears = extractYears(Object.values(releases));
    const featureFlags = [...extractFlags(cells[8]), ...extractFlags(cells[9])];
    const isXbla = featureFlags.includes("XBLA");
    games.push({
      id: `xbox360-${slugify(title)}`,
      title,
      aliases: [],
      platform: "Xbox 360",
      platforms: ["Xbox 360", "Xbox Live Arcade", "Xbox One backward compatible"],
      era: "Retro",
      format: isXbla ? "Xbox Live Arcade / Xbox 360 release" : "Xbox 360 disc / digital release",
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
      genres: genre ? genre.split(", ").filter(Boolean) : [],
      description: "Officially released Xbox 360 game record.",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia Xbox 360 software list",
      tags: ["xbox 360", "microsoft", "official release", "retro", isXbla ? "xbla" : "disc"],
      featureFlags,
      demandTier: "Official Xbox 360 library",
      tradeNotes:
        "Verify region, disc condition, case/manual/inserts, Platinum Hits or special edition status, DLC/code redemption, installation behavior, and whether the copy is loose, complete-in-box, sealed, or digital-only XBLA.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        genre,
        developer,
        publisher,
        Object.values(releases).join(" "),
        releasedRegions.join(" "),
        featureFlags.join(" "),
        "xbox 360 microsoft official release retro disc xbla",
      ]
        .join(" ")
        .toLowerCase(),
    });
  });

  return { games, skipped };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const collected = [];
  const skipped = [];
  for (const pageTitle of sourcePages) {
    const sourceUrl = `https://en.wikipedia.org/wiki/${pageTitle}`;
    const tableHtml = await fetchOfficialTableHtml(pageTitle);
    const parsed = parseOfficialRows(tableHtml, sourceUrl);
    collected.push(...parsed.games);
    skipped.push(...parsed.skipped);
  }
  const unique = new Map();
  collected.forEach((game) => {
    if (!unique.has(game.id)) unique.set(game.id, game);
  });
  const games = Array.from(unique.values()).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia List of Xbox 360 games",
        sourceUrls: sourcePages.map((pageTitle) => `https://en.wikipedia.org/wiki/${pageTitle}`),
        scope:
          "Rows from the Xbox 360 softwarelist tables with at least one NA, EU, JP, or AU release date. Includes retail and Xbox Live Arcade entries listed in the main software tables; excludes rows unreleased in every region and non-softwarelist tables.",
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
  console.log(`Imported ${games.length} official Xbox 360 records.`);
  console.log(`Skipped ${skipped.length} rows without regional release dates.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
