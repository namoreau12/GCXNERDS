const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const ps1Path = path.join(rootDir, "data", "games", "ps1.json");
const manifestPath = path.join(rootDir, "data", "games", "ps1-manifest.json");
const maxArticles = Number(process.env.PS1_OVERVIEW_LIMIT || 900);

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
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
      .replace(/<table[\s\S]*?<\/table>/gi, "")
      .replace(/<figure[\s\S]*?<\/figure>/gi, "")
      .replace(/<span class="mw-editsection"[\s\S]*?<\/span>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromUrl(url) {
  const match = String(url || "").match(/\/wiki\/([^#?]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map((sentence) => sentence.trim()) || [];
}

function usefulParagraph(text, title) {
  if (!text || text.length < 100) return false;
  if (/may refer to|is a list of|this is a list|the following is/i.test(text)) return false;
  const lowered = text.toLowerCase();
  const titleTokens = String(title || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2)
    .filter((token) => !["the", "and", "for", "with"].includes(token));
  const hasTitleSignal = titleTokens.some((token) => lowered.includes(token));
  const hasGameSignal = /\b(video game|playstation|developed by|published by|released for)\b/i.test(text);
  return hasTitleSignal && hasGameSignal;
}

function makeOverview(paragraphs, title) {
  const paragraph = paragraphs.find((text) => usefulParagraph(text, title));
  if (!paragraph) return "";
  const sentences = splitSentences(paragraph).slice(0, 3).join(" ");
  return sentences.length > 520 ? `${sentences.slice(0, 517).trim()}...` : sentences;
}

async function fetchArticleOverview(game) {
  const articleTitle = titleFromUrl(game.articleUrl);
  if (!articleTitle) return "";
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(articleTitle)}&format=json&origin=*`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local PS1 overview enrichment)",
    },
  });
  if (!response.ok) return "";
  const result = await response.json();
  const page = Object.values(result.query?.pages || {})[0];
  const extract = page?.extract || "";
  const paragraphs = [
    extract.replace(/\n+/g, " ").replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim(),
    ...extract.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean),
  ].filter(Boolean);
  return makeOverview(paragraphs, game.title);
}

function shouldTry(game) {
  if (!game.articleUrl || !game.articleUrl.includes("wikipedia.org/wiki/")) return false;
  if (game.articleUrl.includes("#")) return false;
  if (game.description && game.overviewStatus === "published") return false;
  return true;
}

async function main() {
  const games = readJsonIfExists(ps1Path, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Run scripts/import-ps1-official-list.js before enriching overviews.");

  const targets = games.filter(shouldTry).slice(0, maxArticles);
  let updated = 0;
  for (let index = 0; index < targets.length; index += 1) {
    const game = targets[index];
    if (index > 0 && index % 50 === 0) console.log(`Fetched ${index}/${targets.length} PS1 article candidates...`);
    const overview = await fetchArticleOverview(game);
    if (!overview) continue;
    game.description = overview;
    game.descriptionProvider = "Wikipedia direct article overview";
    game.descriptionSourceUrl = game.articleUrl;
    game.overviewStatus = "published";
    game.searchText = `${game.searchText || ""} ${overview}`.toLowerCase();
    updated += 1;
  }

  const overviewStatusCounts = games.reduce((totals, game) => {
    const status = game.overviewStatus || "needs_editorial";
    totals[status] = (totals[status] || 0) + 1;
    return totals;
  }, {});

  writeJson(ps1Path, games);
  writeJson(manifestPath, {
    ...manifest,
    directArticleOverviewEnrichedAt: new Date().toISOString(),
    directArticleOverviewLimit: maxArticles,
    directArticleOverviewUpdatedCount: updated,
    overviewStatusCounts,
  });

  console.log(`Direct article targets: ${targets.length}.`);
  console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
  console.log(`Needs editorial: ${overviewStatusCounts.needs_editorial || 0}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
