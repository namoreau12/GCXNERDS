const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "genesis.json");
const manifestPath = path.join(outputDir, "genesis-manifest.json");
const pageTitle = "List_of_Sega_Genesis_games";
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
  const text = stripTags(cellHtml);
  if (!text || /unreleased|cancelled|canceled/i.test(text)) return "";
  return text;
}

function extractYears(values) {
  const years = new Set();
  values.forEach((value) => {
    for (const match of String(value || "").matchAll(/\b(19[89]\d|20\d\d)\b/g)) {
      years.add(match[1]);
    }
  });
  return Array.from(years).sort();
}

async function fetchOfficialTableHtml() {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local Genesis importer)",
    },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
  const html = (await response.json()).parse.text["*"];
  const tableStart = html.indexOf('<table class="wikitable plainrowheaders sortable sticky-header-multi" id="softwarelist"');
  if (tableStart === -1) throw new Error("Could not find Genesis softwarelist table.");
  const tableEnd = html.indexOf("</table>", tableStart);
  return html.slice(tableStart, tableEnd + "</table>".length);
}

function parseOfficialRows(tableHtml) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];

  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 7) return;

    const titleCell = cells[0];
    const { title, articleUrl } = extractFirstArticle(titleCell);
    const aliases = extractAliases(titleCell, title);
    const developer = cleanPartyCell(cells[1]);
    const publisher = cleanPartyCell(cells[2]);
    const releases = {
      japan: cleanDate(cells[3]),
      northAmerica: cleanDate(cells[4]),
      pal: cleanDate(cells[5]),
      other: cleanDate(cells[6]),
    };
    const releasedRegions = Object.entries(releases)
      .filter(([, date]) => Boolean(date))
      .map(([region]) => region);

    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }

    const releaseYears = extractYears(Object.values(releases));
    games.push({
      id: `genesis-${slugify(title)}`,
      title,
      aliases,
      platform: "Sega Genesis",
      platforms: ["Sega Genesis", "Mega Drive", "Sega Mega Drive"],
      era: "Retro",
      format: "Sega Genesis cartridge",
      generation: "Fourth",
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
      description: "Officially released Sega Genesis/Mega Drive game record.",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl,
      source: "Wikipedia Sega Genesis licensed software list",
      tags: ["sega genesis", "mega drive", "official release", "retro", "cartridge"],
      demandTier: "Official Genesis/Mega Drive library",
      tradeNotes:
        "Verify region, cartridge shell, label condition, manual, clamshell or cardboard box, inserts, board authenticity, and whether the copy is loose, complete-in-box, or sealed.",
      overviewStatus: "needs_editorial",
      searchText: [
        title,
        aliases.join(" "),
        developer,
        publisher,
        Object.values(releases).join(" "),
        releasedRegions.join(" "),
        "sega genesis mega drive official release retro cartridge",
      ]
        .join(" ")
        .toLowerCase(),
    });
  });

  const unique = new Map();
  games.forEach((game) => {
    if (!unique.has(game.id)) {
      unique.set(game.id, game);
      return;
    }
    const existing = unique.get(game.id);
    game.aliases.forEach((alias) => {
      if (!existing.aliases.includes(alias)) existing.aliases.push(alias);
    });
    Object.entries(game.releases).forEach(([region, date]) => {
      if (date && !existing.releases[region]) existing.releases[region] = date;
    });
    existing.releasedRegions = Array.from(new Set([...existing.releasedRegions, ...game.releasedRegions]));
    existing.releaseYears = Array.from(new Set([...existing.releaseYears, ...game.releaseYears])).sort();
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
        source: "Wikipedia List of Sega Genesis games",
        sourceUrl,
        scope:
          "Rows from the Licensed games softwarelist table with at least one JP, NA, PAL, or Other release marker. Excludes Sega CD, 32X, compilations outside the main licensed table, and rows unreleased in every region.",
        gameCount: games.length,
        skippedUnreleasedRows: skipped.length,
        articleCount: games.filter((game) => game.articleUrl).length,
        imageCount: 0,
        missingImageCount: games.length,
        overviewStatusCounts: { needs_editorial: games.length },
      },
      null,
      2
    )
  );
  console.log(`Imported ${games.length} official Genesis/Mega Drive records.`);
  console.log(`Skipped ${skipped.length} unreleased-only rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
