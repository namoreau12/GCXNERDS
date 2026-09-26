const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "switch.json");
const manifestPath = path.join(outputDir, "switch-manifest.json");
const cutoffDate = new Date("2026-08-15T23:59:59.999Z");
const sourcePages = [
  "List_of_Nintendo_Switch_games_(0%E2%80%939)",
  "List_of_Nintendo_Switch_games_(A%E2%80%93Am)",
  "List_of_Nintendo_Switch_games_(An%E2%80%93Az)",
  "List_of_Nintendo_Switch_games_(B)",
  "List_of_Nintendo_Switch_games_(C%E2%80%93G)",
  "List_of_Nintendo_Switch_games_(H%E2%80%93P)",
  "List_of_Nintendo_Switch_games_(Q%E2%80%93Z)",
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
  const header = rowHtml.match(/<th\b[^>]*scope="row"[^>]*>([\s\S]*?)<\/th>/i);
  const cells = Array.from(rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((match) => match[1]);
  return header ? [header[1], ...cells] : cells;
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
  return stripTags(cellHtml).replace(/\s+/g, " ").trim();
}

function parseReleaseDate(value) {
  const cleaned = String(value || "").replace(/\([^)]*\)/g, "").trim();
  const parsed = new Date(`${cleaned} UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateDisplay(date) {
  return date.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });
}

async function fetchOfficialTableHtml(pageTitle) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local Switch importer)",
    },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status} for ${pageTitle}`);
  const html = (await response.json()).parse.text["*"];
  const marker = html.indexOf('id="softwarelist"');
  if (marker === -1) throw new Error(`Could not find Switch softwarelist table for ${pageTitle}.`);
  const tableStart = html.lastIndexOf("<table", marker);
  const tableEnd = html.indexOf("</table>", marker);
  return html.slice(tableStart, tableEnd + "</table>".length);
}

function parseOfficialRows(tableHtml, sourceUrl) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = { badRows: 0, unreleasedOrFuture: 0 };

  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 5) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const aliases = extractAliases(cells[0], title);
    const developer = cleanPartyCell(cells[1]);
    const publisher = cleanPartyCell(cells[2]);
    const releaseDateDisplay = cleanDate(cells[3]);
    const releaseDate = parseReleaseDate(releaseDateDisplay);

    if (!title || !releaseDate) {
      skipped.badRows += 1;
      return;
    }
    if (releaseDate > cutoffDate) {
      skipped.unreleasedOrFuture += 1;
      return;
    }

    const releaseYear = releaseDate.getUTCFullYear();
    games.push({
      id: `switch-${slugify(title)}`,
      title,
      aliases,
      platform: "Nintendo Switch",
      platforms: ["Nintendo Switch", "Switch", "Nintendo Switch OLED", "Nintendo Switch Lite"],
      era: "Modern",
      format: "Nintendo Switch game card / Nintendo eShop release",
      generation: "Eighth/Ninth",
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased: String(releaseYear),
      releaseDate: releaseDate.toISOString(),
      releaseDateDisplay: dateDisplay(releaseDate),
      releaseYears: [String(releaseYear)],
      genres: [],
      description: "Officially released Nintendo Switch game record.",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia Nintendo Switch software list",
      tags: ["nintendo switch", "switch", "official release", "modern", "game card", "eshop"],
      demandTier: "Official Nintendo Switch library",
      tradeNotes:
        "Verify region, physical cartridge versus download code, case/manual/inserts where applicable, code redemption status, DLC inclusion, and whether the copy is loose, complete-in-box, sealed, or a later print.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        aliases.join(" "),
        developer,
        publisher,
        releaseDateDisplay,
        "nintendo switch official release modern game card eshop",
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
  const skipped = { badRows: 0, unreleasedOrFuture: 0 };

  for (const pageTitle of sourcePages) {
    const sourceUrl = `https://en.wikipedia.org/wiki/${pageTitle}`;
    const tableHtml = await fetchOfficialTableHtml(pageTitle);
    const parsed = parseOfficialRows(tableHtml, sourceUrl);
    collected.push(...parsed.games);
    skipped.badRows += parsed.skipped.badRows;
    skipped.unreleasedOrFuture += parsed.skipped.unreleasedOrFuture;
  }

  const unique = new Map();
  collected.forEach((game) => {
    if (!unique.has(game.id)) {
      unique.set(game.id, game);
      return;
    }
    const existing = unique.get(game.id);
    game.aliases.forEach((alias) => {
      if (!existing.aliases.includes(alias)) existing.aliases.push(alias);
    });
  });

  const games = Array.from(unique.values()).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia List of Nintendo Switch games",
        sourceUrls: sourcePages.map((pageTitle) => `https://en.wikipedia.org/wiki/${pageTitle}`),
        scope:
          "Rows from the Nintendo Switch softwarelist tables with a parseable release date on or before 2026-08-15. Excludes future releases, unparseable placeholder dates, Nintendo Switch 2-only records, and pages outside the main software list.",
        releaseCutoffDate: "2026-08-15",
        gameCount: games.length,
        skippedRows: skipped.badRows,
        skippedFutureRows: skipped.unreleasedOrFuture,
        articleCount: games.filter((game) => game.articleUrl).length,
        imageCount: 0,
        missingImageCount: games.length,
        overviewStatusCounts: { needs_editorial: games.length },
      },
      null,
      2
    )
  );
  console.log(`Imported ${games.length} official Nintendo Switch records.`);
  console.log(`Skipped ${skipped.badRows} unparseable rows and ${skipped.unreleasedOrFuture} future rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
