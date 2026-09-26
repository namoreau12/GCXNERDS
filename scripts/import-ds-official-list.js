const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "ds.json");
const manifestPath = path.join(outputDir, "ds-manifest.json");
const sourcePages = [
  "List_of_Nintendo_DS_games_(0%E2%80%93C)",
  "List_of_Nintendo_DS_games_(D%E2%80%93I)",
  "List_of_Nintendo_DS_games_(J%E2%80%93P)",
  "List_of_Nintendo_DS_games_(Q%E2%80%93Z)",
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

function hasReleaseFlag(cellHtml) {
  const sortValue = cellHtml.match(/data-sort-value="([^"]+)"/i)?.[1] || "";
  if (/yes/i.test(sortValue)) return true;
  if (/no/i.test(sortValue)) return false;
  return /title="Yes"|alt="Yes"|Check-green/i.test(cellHtml);
}

function extractYears(values) {
  const years = new Set();
  values.forEach((value) => {
    for (const match of String(value || "").matchAll(/\b(20\d\d|19\d\d)\b/g)) {
      years.add(match[1]);
    }
  });
  return Array.from(years).sort();
}

async function fetchOfficialTableHtml(pageTitle) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local DS importer)",
    },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status} for ${pageTitle}`);
  const html = (await response.json()).parse.text["*"];
  const marker = html.indexOf('id="softwarelist"');
  if (marker === -1) throw new Error(`Could not find DS softwarelist table for ${pageTitle}.`);
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
    if (cells.length < 8) return;

    const titleCell = cells[0];
    const { title, articleUrl } = extractFirstArticle(titleCell);
    const aliases = extractAliases(titleCell, title);
    const developer = cleanPartyCell(cells[1]);
    const publisher = cleanPartyCell(cells[2]);
    const firstReleased = cleanDate(cells[3]);
    const releases = {
      japan: hasReleaseFlag(cells[4]) ? "Released" : "",
      northAmerica: hasReleaseFlag(cells[5]) ? "Released" : "",
      europe: hasReleaseFlag(cells[6]) ? "Released" : "",
      australia: hasReleaseFlag(cells[7]) ? "Released" : "",
    };
    const releasedRegions = Object.entries(releases)
      .filter(([, release]) => Boolean(release))
      .map(([region]) => region);

    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }

    games.push({
      id: `ds-${slugify(title)}`,
      title,
      aliases,
      platform: "Nintendo DS",
      platforms: ["Nintendo DS", "DS", "Nintendo DS Lite", "Nintendo DSi"],
      era: "Retro",
      format: "Nintendo DS Game Card",
      generation: "Seventh",
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased,
      releaseDates: firstReleased,
      releases,
      releasedRegions,
      releaseYears: extractYears([firstReleased]),
      genres: [],
      description: "Officially released Nintendo DS game record.",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia Nintendo DS software list",
      tags: ["nintendo ds", "ds", "official release", "retro", "game card"],
      demandTier: "Official Nintendo DS library",
      tradeNotes:
        "Verify region, cartridge label, contacts, case/manual/inserts, serial code, save data behavior, and whether the copy is loose, complete-in-box, sealed, or a later print.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        aliases.join(" "),
        developer,
        publisher,
        firstReleased,
        releasedRegions.join(" "),
        "nintendo ds official release retro game card",
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
    if (!unique.has(game.id)) {
      unique.set(game.id, game);
      return;
    }
    const existing = unique.get(game.id);
    game.aliases.forEach((alias) => {
      if (!existing.aliases.includes(alias)) existing.aliases.push(alias);
    });
    existing.releasedRegions = Array.from(new Set([...existing.releasedRegions, ...game.releasedRegions]));
    existing.releaseYears = Array.from(new Set([...existing.releaseYears, ...game.releaseYears])).sort();
  });

  const games = Array.from(unique.values()).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia List of Nintendo DS games",
        sourceUrls: sourcePages.map((pageTitle) => `https://en.wikipedia.org/wiki/${pageTitle}`),
        scope:
          "Rows from the Nintendo DS softwarelist tables with at least one JP, NA, EU, or AU release flag. Excludes 3DS, DSiWare-only lists, and rows unreleased in every region.",
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
  console.log(`Imported ${games.length} official Nintendo DS records.`);
  console.log(`Skipped ${skipped.length} rows without release flags.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
