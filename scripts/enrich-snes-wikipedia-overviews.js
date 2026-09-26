const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const snesPath = path.join(rootDir, "data", "games", "snes.json");
const manifestPath = path.join(rootDir, "data", "games", "snes-manifest.json");

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

function titleFromArticleUrl(articleUrl) {
  if (!articleUrl) return "";

  try {
    const url = new URL(articleUrl, "https://en.wikipedia.org");
    if (url.hostname !== "en.wikipedia.org" || !url.pathname.startsWith("/wiki/") || url.hash) return "";
    return decodeURIComponent(url.pathname.replace(/^\/wiki\//, ""));
  } catch (error) {
    return "";
  }
}

function cleanExtract(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

function isUsefulOverview(value, game) {
  const text = cleanExtract(value);
  if (!text || text.length < 70) return false;
  if (/may refer to:|can refer to:/i.test(text)) return false;

  const normalizedText = text.toLowerCase();
  const titleWords = game.title
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 4);

  return titleWords.length === 0 || titleWords.some((word) => normalizedText.includes(word));
}

function firstParagraph(value) {
  return cleanExtract(String(value || "").split(/\n\s*\n/)[0]);
}

async function fetchBatch(titles) {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    format: "json",
    origin: "*",
    titles: titles.join("|"),
  });
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local SNES overview enrichment)",
    },
  });

  if (response.status === 429) {
    throw new Error("Wikipedia returned 429 rate limit.");
  }

  if (!response.ok) {
    throw new Error(`Wikipedia returned ${response.status}`);
  }

  const text = await response.text();
  if (!text.trim().startsWith("{")) {
    throw new Error(text.trim().slice(0, 120));
  }

  const result = JSON.parse(text);
  const redirectMap = new Map((result.query?.redirects || []).map((redirect) => [redirect.from, redirect.to]));
  const normalizedMap = new Map((result.query?.normalized || []).map((normalized) => [normalized.from, normalized.to]));
  const pageByTitle = new Map(Object.values(result.query?.pages || {}).map((page) => [page.title, page]));
  const summaries = new Map();

  titles.forEach((title) => {
    const normalized = normalizedMap.get(title) || title;
    const redirected = redirectMap.get(normalized) || redirectMap.get(title) || normalized;
    const page = pageByTitle.get(redirected) || pageByTitle.get(normalized) || pageByTitle.get(title);
    if (!page || page.missing) return;

    summaries.set(title, {
      description: firstParagraph(page.extract),
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
    });
  });

  return summaries;
}

async function main() {
  const games = readJson(snesPath);
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};
  const titleToGames = new Map();
  let clearedGeneric = 0;

  games.forEach((game) => {
    if (/Officially released Super Nintendo\/Super Famicom game record\./i.test(game.description || "")) {
      game.description = "";
      clearedGeneric += 1;
    }

    if (!game.descriptionProvider) {
      game.overviewStatus = "needs_editorial";
    }

    if (game.overviewStatus === "published" && game.descriptionProvider) return;

    const title = titleFromArticleUrl(game.articleUrl);
    if (!title) return;
    if (!titleToGames.has(title)) titleToGames.set(title, []);
    titleToGames.get(title).push(game);
  });

  const titles = Array.from(titleToGames.keys());
  const batchSize = 25;
  let enriched = 0;

  function saveProgress() {
    writeJson(snesPath, games);
    writeJson(manifestPath, {
      ...manifest,
      overviewEnrichedAt: new Date().toISOString(),
      overviewProvider: "Wikipedia page extracts",
      genericDescriptionsRemoved: clearedGeneric,
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

  for (let index = 0; index < titles.length; index += batchSize) {
    const batch = titles.slice(index, index + batchSize);
    let summaries;

    try {
      summaries = await fetchBatch(batch);
    } catch (error) {
      saveProgress();
      throw error;
    }

    summaries.forEach((summary, title) => {
      titleToGames.get(title).forEach((game) => {
        if (!isUsefulOverview(summary.description, game)) return;

        game.description = summary.description;
        game.descriptionProvider = "Wikipedia page extract";
        game.descriptionSourceUrl = summary.sourceUrl;
        game.overviewStatus = "published";
        enriched += 1;
      });
    });

    saveProgress();
    console.log(`Processed ${Math.min(index + batchSize, titles.length)}/${titles.length} article titles.`);
    await sleep(3500);
  }

  saveProgress();

  console.log(`Removed ${clearedGeneric} generic SNES descriptions.`);
  console.log(`Published sourced overviews for ${games.filter((game) => game.overviewStatus === "published").length}/${games.length} SNES records.`);
  console.log(`Still needing editorial overviews: ${games.filter((game) => game.overviewStatus === "needs_editorial").length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
