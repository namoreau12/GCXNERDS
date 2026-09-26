const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const n64Path = path.join(rootDir, "data", "games", "n64.json");
const manifestPath = path.join(rootDir, "data", "games", "n64-manifest.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      .replace(/<table[\s\S]*?<\/table>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWords(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter((word) => !["nintendo", "game", "games", "world"].includes(word));
}

function cleanArticleUrl(articleUrl) {
  if (!articleUrl || /redlink=1|\/w\/index\.php/i.test(articleUrl)) return "";
  try {
    const url = new URL(articleUrl, "https://en.wikipedia.org");
    if (url.hostname !== "en.wikipedia.org" || !url.pathname.startsWith("/wiki/")) return "";
    if (url.hash && process.env.N64_INCLUDE_ANCHORS !== "1") return "";
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch (error) {
    return "";
  }
}

function isUsefulParagraph(text, game) {
  if (!text || text.length < 90) return false;
  if (/may refer to:|can refer to:|list of|redirects here/i.test(text)) return false;
  const lower = text.toLowerCase();
  const titleWords = Array.from(new Set(normalizeWords(game.title))).slice(0, 5);
  const titleMatch = titleWords.length === 0 || titleWords.some((word) => lower.includes(word));
  const gameSignals = /video game|platform game|role-playing|rpg|shooter|fighting game|puzzle|racing|sports|simulation|adventure|beat 'em up|strategy|party game|first-person/i.test(text);
  return titleMatch && gameSignals;
}

function firstUsefulOverview(html, game) {
  const paragraphs = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
  const paragraph = paragraphs.find((text) => isUsefulParagraph(text, game));
  if (!paragraph) return "";
  const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
  let overview = "";
  for (const sentence of sentences) {
    const next = `${overview} ${sentence.trim()}`.trim();
    if (next.length > 420 && overview) break;
    overview = next;
    if (overview.length >= 180) break;
  }
  return overview || paragraph.slice(0, 420).trim();
}

function save(games, manifest, stats) {
  writeJson(n64Path, games);
  writeJson(manifestPath, {
    ...manifest,
    directArticleOverviewEnrichedAt: new Date().toISOString(),
    directArticleOverviewStats: stats,
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "unknown";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
    descriptionProviderCounts: games.reduce((counts, game) => {
      const provider = game.descriptionProvider || "none";
      counts[provider] = (counts[provider] || 0) + 1;
      return counts;
    }, {}),
  });
}

async function fetchOverview(game) {
  const articleUrl = cleanArticleUrl(game.articleUrl);
  if (!articleUrl) return null;
  const response = await fetch(articleUrl, {
    headers: {
      Accept: "text/html",
      "User-Agent": "GamesCardsExchange/0.1 (local N64 direct article overview enrichment)",
    },
  });
  if (!response.ok) return null;
  const overview = firstUsefulOverview(await response.text(), game);
  return overview ? { overview, sourceUrl: articleUrl } : null;
}

async function main() {
  const games = readJson(n64Path);
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};
  const stats = { attempted: 0, enriched: 0, skippedNoSource: 0, skippedNoOverview: 0, failed: 0 };
  const targets = games.filter((game) => game.overviewStatus !== "published" && cleanArticleUrl(game.articleUrl));
  const concurrency = 4;
  let cursor = 0;
  console.log(`Direct article targets: ${targets.length}`);

  while (cursor < targets.length) {
    const batch = targets.slice(cursor, cursor + concurrency);
    const results = await Promise.allSettled(batch.map((game) => fetchOverview(game)));
    results.forEach((result, index) => {
      const game = batch[index];
      stats.attempted += 1;
      if (result.status !== "fulfilled") {
        stats.failed += 1;
        return;
      }
      if (!result.value) {
        stats.skippedNoOverview += 1;
        return;
      }
      game.description = result.value.overview;
      game.descriptionProvider = "Wikipedia direct article overview";
      game.descriptionSourceUrl = result.value.sourceUrl;
      game.overviewStatus = "published";
      stats.enriched += 1;
    });
    cursor += concurrency;
    if (cursor % 80 === 0 || cursor >= targets.length) {
      stats.skippedNoSource = games.filter((game) => game.overviewStatus !== "published" && !cleanArticleUrl(game.articleUrl)).length;
      save(games, manifest, stats);
      console.log(`Processed ${cursor}/${targets.length}; published ${games.filter((game) => game.overviewStatus === "published").length}/${games.length}.`);
    }
    await sleep(350);
  }

  stats.skippedNoSource = games.filter((game) => game.overviewStatus !== "published" && !cleanArticleUrl(game.articleUrl)).length;
  save(games, manifest, stats);
  console.log(`Published overviews: ${games.filter((game) => game.overviewStatus === "published").length}/${games.length}.`);
  console.log(`Still needing editorial: ${games.filter((game) => game.overviewStatus !== "published").length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
