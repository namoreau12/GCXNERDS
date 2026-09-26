const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "games");
const outputPath = path.join(outputDir, "gameboy.json");
const manifestPath = path.join(outputDir, "gameboy-manifest.json");
const sources = {
  gb: {
    pageTitle: "List_of_Game_Boy_games",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Game_Boy_games",
    tableId: "softwarelist",
    source: "Wikipedia List of Game Boy games",
  },
  gbc: {
    pageTitle: "List_of_Game_Boy_Color_games",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Game_Boy_Color_games",
    tableId: "list",
    source: "Wikipedia List of Game Boy Color games",
  },
};

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

function hasYes(cellHtml) {
  const text = stripTags(cellHtml);
  return /table-yes|data-sort-value="Yes"|alt="Yes"|title="Yes"|>\s*(Ya|Yes)\s*</i.test(cellHtml) || /\b(Ya|Yes)\b/i.test(text);
}

function yesNo(cellHtml) {
  if (hasYes(cellHtml)) return "Yes";
  if (/\bNo\b/i.test(stripTags(cellHtml)) || /table-no/i.test(cellHtml)) return "No";
  return "";
}

function extractYears(values) {
  const years = new Set();
  values.forEach((value) => {
    for (const match of String(value || "").matchAll(/\b(19[89]\d|20\d\d)\b/g)) years.add(match[1]);
  });
  return Array.from(years).sort();
}

async function fetchTableHtml(source) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${source.pageTitle}&prop=text&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local Game Boy importer)",
    },
  });
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status} for ${source.pageTitle}`);
  const result = await response.json();
  const html = result.parse?.text?.["*"];
  const marker = html?.indexOf(`id="${source.tableId}"`) ?? -1;
  if (marker === -1) throw new Error(`Could not find table ${source.tableId}`);
  const start = html.lastIndexOf("<table", marker);
  const end = html.indexOf("</table>", marker);
  return html.slice(start, end + "</table>".length);
}

function parseGbRows(tableHtml) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];
  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 6) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const developer = cleanCellList(cells[1]);
    const publisher = cleanCellList(cells[2]);
    const releases = {
      japan: cleanDate(cells[3]),
      northAmerica: cleanDate(cells[4]),
      pal: cleanDate(cells[5]),
    };
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);
    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }
    games.push({
      id: `gb-${slugify(title)}`,
      title,
      aliases: [],
      platform: "Game Boy",
      platforms: ["Game Boy"],
      era: "Retro",
      format: "Game Boy cartridge",
      generation: "Fourth",
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased: extractYears(Object.values(releases))[0] || "",
      releases,
      releasedRegions,
      releaseYears: extractYears(Object.values(releases)),
      genres: [],
      description: "",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl: sources.gb.sourceUrl,
      source: sources.gb.source,
      tags: ["game boy", "gb", "nintendo", "official release", "retro", "cartridge"],
      demandTier: "Official Game Boy library",
      tradeNotes:
        "Verify region, cartridge shell, label condition, board photos for high-value titles, battery-backed save status, box/manuals, inserts, and whether the copy is loose or complete-in-box.",
      overviewStatus: "needs_editorial",
      searchText: [title, developer, publisher, Object.values(releases).join(" "), "game boy gb nintendo official release retro cartridge"].join(" ").toLowerCase(),
    });
  });
  return { games, skipped };
}

function parseGbcRows(tableHtml) {
  const rows = Array.from(tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1]);
  const games = [];
  const skipped = [];
  rows.forEach((rowHtml) => {
    const cells = extractCells(rowHtml);
    if (cells.length < 9) return;
    const { title, articleUrl } = extractFirstArticle(cells[0]);
    const dualMode = yesNo(cells[1]);
    const cartridgeFeature = cleanCellList(cells[2]).replace(/^—$|^N\/a$/i, "");
    const developer = cleanCellList(cells[3]);
    const publisher = cleanCellList(cells[4]);
    const firstReleased = cleanDate(cells[5]);
    const releases = {
      japan: hasYes(cells[6]) ? "Released" : "",
      northAmerica: hasYes(cells[7]) ? "Released" : "",
      pal: hasYes(cells[8]) ? "Released" : "",
    };
    const releasedRegions = Object.entries(releases).filter(([, date]) => Boolean(date)).map(([region]) => region);
    if (!title || !releasedRegions.length) {
      skipped.push(title || "Untitled row");
      return;
    }
    const platform = dualMode === "Yes" ? "Game Boy Color / Game Boy" : "Game Boy Color";
    games.push({
      id: `gbc-${slugify(title)}`,
      title,
      aliases: [],
      platform,
      platforms: dualMode === "Yes" ? ["Game Boy Color", "Game Boy"] : ["Game Boy Color"],
      era: "Retro",
      format: dualMode === "Yes" ? "Dual Mode Game Boy Color cartridge" : "Game Boy Color cartridge",
      generation: "Fifth",
      developer,
      publisher,
      developers: developer ? developer.split(", ").filter(Boolean) : [],
      publishers: publisher ? publisher.split(", ").filter(Boolean) : [],
      firstReleased,
      releases,
      releasedRegions,
      releaseYears: extractYears([firstReleased]),
      dualMode,
      cartridgeFeature,
      genres: [],
      description: "",
      imageUrl: "",
      imageSourceUrl: "",
      articleUrl,
      sourceUrl: sources.gbc.sourceUrl,
      source: sources.gbc.source,
      tags: ["game boy color", "gbc", "nintendo", "official release", "retro", "cartridge", dualMode === "Yes" ? "dual mode" : ""].filter(Boolean),
      demandTier: "Official Game Boy Color library",
      tradeNotes:
        "Verify region, cartridge color, label condition, shell authenticity, battery-backed save status, box/manuals, inserts, and whether the copy is loose, complete-in-box, or sealed.",
      overviewStatus: "needs_editorial",
      searchText: [title, developer, publisher, firstReleased, releasedRegions.join(" "), dualMode, cartridgeFeature, "game boy color gbc nintendo official release retro cartridge"].join(" ").toLowerCase(),
    });
  });
  return { games, skipped };
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("Importing official Game Boy and Game Boy Color lists...");
  const gb = parseGbRows(await fetchTableHtml(sources.gb));
  const gbc = parseGbcRows(await fetchTableHtml(sources.gbc));
  const games = [...gb.games, ...gbc.games].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }) || a.id.localeCompare(b.id));
  fs.writeFileSync(outputPath, JSON.stringify(games, null, 2));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        importedAt: new Date().toISOString(),
        source: "Wikipedia Game Boy and Game Boy Color released/licensed lists",
        sourceUrls: [sources.gb.sourceUrl, sources.gbc.sourceUrl],
        scope:
          "Rows from the released Game Boy software table and licensed released Game Boy Color table. Excludes cancelled, unlicensed, aftermarket, and separate Nintendo Power-only tables.",
        gameCount: games.length,
        gameBoyCount: gb.games.length,
        gameBoyColorCount: gbc.games.length,
        skippedRows: gb.skipped.length + gbc.skipped.length,
        articleCount: games.filter((game) => game.articleUrl).length,
        imageCount: 0,
        missingImageCount: games.length,
        overviewStatusCounts: { needs_editorial: games.length },
      },
      null,
      2
    )
  );
  console.log(`Imported ${games.length} official Game Boy/Game Boy Color records.`);
  console.log(`Game Boy: ${gb.games.length}. Game Boy Color: ${gbc.games.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
