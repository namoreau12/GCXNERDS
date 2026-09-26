const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "nes.json");
const manifestPath = path.join(outputDir, "nes-manifest.json");
const pageTitle = "List_of_Nintendo_Entertainment_System_games";
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

function repairMojibake(value) {
  const text = String(value || "");
  if (!/[ÃÅÂ]/.test(text)) return text;

  const repaired = Buffer.from(text, "latin1").toString("utf8");
  return repaired.includes("\uFFFD") ? text : repaired;
}

function stripTags(value) {
  return repairMojibake(decodeHtml(
    String(value || "")
      .replace(/<sup[\s\S]*?<\/sup>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  ))
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
  return Array.from(rowHtml.matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)).map((match) => match[1]);
}

function extractFirstArticle(cellHtml) {
  const link = cellHtml.match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  if (!link) return { title: stripTags(cellHtml).split("\n")[0], articleUrl: "" };

  const href = decodeHtml(link[1]);
  const title = stripTags(link[2]);

  return {
    title,
    articleUrl: href.startsWith("/wiki/") ? `https://en.wikipedia.org${href}` : href,
  };
}

function extractAliases(cellHtml, primaryTitle) {
  const text = stripTags(cellHtml);
  return text
    .split("\n")
    .map((part) => part.replace(/^[*.-]\s*/, "").replace(/\^[A-Z, ]+$/g, "").trim())
    .filter(Boolean)
    .filter((part) => part !== primaryTitle);
}

function cleanPartyCell(cellHtml) {
  const text = stripTags(cellHtml);
  return text
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

function extractTables(html) {
  const softwareTables = [];
  const tableMatches = Array.from(html.matchAll(/<table\b[^>]*id="softwarelist"[^>]*>/gi));

  tableMatches.forEach((match) => {
    const tableEnd = html.indexOf("</table>", match.index);
    if (tableEnd === -1) return;
    softwareTables.push(html.slice(match.index, tableEnd + "</table>".length));
  });

  return softwareTables;
}

async function fetchOfficialTablesHtml() {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local official NES importer)",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikipedia returned ${response.status}`);
  }

  const result = await response.json();
  const html = result.parse.text["*"];
  const tables = extractTables(html);

  if (!tables.length) {
    throw new Error("Could not find licensed NES software tables.");
  }

  return tables;
}

function parseOfficialRows(tableHtmlList) {
  const games = [];
  const skipped = [];

  tableHtmlList.forEach((tableHtml) => {
    const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);

    rows.forEach((rowHtml) => {
      const cells = extractCells(rowHtml);
      if (cells.length < 7) return;

      const titleCell = cells[0];
      const { title, articleUrl } = extractFirstArticle(titleCell);
      const aliases = extractAliases(titleCell, title);
      const developer = cleanPartyCell(cells[1]);
      const publisher = cleanPartyCell(cells[2]);
      const firstReleased = cleanDate(cells[3]);
      const releases = {
        japan: cleanDate(cells[4]),
        northAmerica: cleanDate(cells[5]),
        pal: cleanDate(cells[6]),
      };
      const releasedRegions = Object.entries(releases)
        .filter(([, date]) => Boolean(date))
        .map(([region]) => region);

      if (!title || !releases.northAmerica) {
        skipped.push(title || "Untitled row");
        return;
      }

      games.push({
        id: `nes-${slugify(title)}`,
        title,
        aliases,
        platform: "Nintendo Entertainment System",
        platforms: ["Nintendo Entertainment System", "NES"],
        era: "Retro",
        format: "NES Game Pak cartridge",
        generation: "Third",
        developer,
        publisher,
        developers: developer ? developer.split(", ").filter(Boolean) : [],
        publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
        firstReleased,
        releases,
        releasedRegions,
        releaseYears: extractYears([firstReleased, ...Object.values(releases)]),
        genres: [],
        description: "Licensed North American Nintendo Entertainment System game record.",
        imageUrl: "",
        imageSourceUrl: "",
        articleUrl,
        sourceUrl,
        source: "Wikipedia licensed NES software list",
        tags: ["nes", "nintendo entertainment system", "official release", "licensed", "retro", "cartridge"],
        demandTier: "Licensed NES library",
        tradeNotes:
          "Verify region, label condition, cartridge authenticity, pins, 5-screw or 3-screw shell, box/manuals, and whether the copy is loose or complete-in-box.",
        searchText: [
          title,
          aliases.join(" "),
          developer,
          publisher,
          firstReleased,
          Object.values(releases).join(" "),
          releasedRegions.join(" "),
          "nes nintendo entertainment system official licensed retro cartridge",
        ]
          .join(" ")
          .toLowerCase(),
      });
    });
  });

  const unique = new Map();
  games.forEach((game) => {
    const key = game.id;
    if (!unique.has(key)) {
      unique.set(key, game);
      return;
    }

    const existing = unique.get(key);
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

  console.log("Importing licensed North American NES release list...");
  const tables = await fetchOfficialTablesHtml();
  const { games, skipped } = parseOfficialRows(tables);

  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia List of Nintendo Entertainment System games",
        sourceUrl,
        scope:
          "Rows from the page's licensed software tables with a North American release date. Excludes Famicom-only rows, PAL-only rows, championship/special hardware tables, unreleased rows, and the unlicensed games sections.",
        gameCount: games.length,
        skippedNonNorthAmericanOrUnreleasedRows: skipped.length,
        articleCount: games.filter((game) => game.articleUrl).length,
        imageCount: 0,
        missingImageCount: games.length,
      },
      null,
      2
    )
  );

  console.log(`Imported ${games.length} licensed North American NES records.`);
  console.log(`Skipped ${skipped.length} non-North-American or unreleased rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
