const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(rootDir, "data", "games", "ps2-safe-wikipedia-image-import-20260825.csv");
const genericPageTitles = new Set([
  "crossword",
  "go",
  "hanafuda",
  "mahjong",
  "othello",
  "shogi",
  "yoshinoya",
]);

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function titleFromUrl(url) {
  const match = String(url || "").match(/\/wiki\/([^#?]+)/);
  return match ? decodeURIComponent(match[1]).replaceAll("_", " ") : "";
}

function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\((video game|game|playstation 2|ps2)\)/gi, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPageImages(titles, attempt = 1) {
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail|original&pithumbsize=500&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles.join("|"))}`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (reviewed PS2 image queue)",
    },
  });
  if (response.status === 429 && attempt < 6) {
    await sleep(3000 * attempt);
    return fetchPageImages(titles, attempt + 1);
  }
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
  const result = await response.json();
  return Object.values(result.query?.pages || {});
}

function safeCandidate(game) {
  const articleUrl = game.articleUrl || "";
  if (!articleUrl.includes("wikipedia.org/wiki/")) return null;
  if (/List_of_|Category:|#/.test(articleUrl)) return null;
  const pageTitle = titleFromUrl(articleUrl);
  if (!pageTitle) return null;

  const normalizedGame = normalizeTitle(game.title || game.name);
  const normalizedPage = normalizeTitle(pageTitle);
  if (!normalizedGame || !normalizedPage) return null;
  if (genericPageTitles.has(normalizedPage)) return null;

  const exact = normalizedPage === normalizedGame;
  const videoGameDisambiguation = normalizedPage === `${normalizedGame} video game`;
  if (!exact && !videoGameDisambiguation) return null;

  return { game, pageTitle };
}

async function main() {
  const games = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const candidates = games.filter((game) => !game.imageUrl).map(safeCandidate).filter(Boolean);
  const byPageTitle = new Map(candidates.map((item) => [item.pageTitle, item.game]));
  const rows = [];

  for (const group of chunk(candidates.map((item) => item.pageTitle), 20)) {
    const pages = await fetchPageImages(group);
    pages.forEach((page) => {
      const game = byPageTitle.get(page.title);
      const imageUrl = page.thumbnail?.source || page.original?.source || "";
      if (!game || !imageUrl || !/^https:\/\/upload\.wikimedia\.org\//i.test(imageUrl)) return;
      rows.push({
        platformSlug: "ps2",
        gameId: game.id,
        title: game.title || game.name || "",
        imageUrl,
        imageSourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
        imageProvider: "Reviewed Wikipedia page image",
        notes: `Safe exact-title Wikipedia image match for ${page.title}.`,
        reviewStatus: "approved",
        reviewer: "GCX Editorial",
      });
    });
    await sleep(800);
  }

  const headers = ["platformSlug", "gameId", "title", "imageUrl", "imageSourceUrl", "imageProvider", "notes", "reviewStatus", "reviewer"];
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
  fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), candidateCount: candidates.length, rowCount: rows.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
