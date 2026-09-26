const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const nesPath = path.join(rootDir, "data", "games", "nes.json");
const manifestPath = path.join(rootDir, "data", "games", "nes-manifest.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function titleFromArticleUrl(articleUrl) {
  if (!articleUrl) return "";

  try {
    return decodeURIComponent(new URL(articleUrl).pathname.replace(/^\/wiki\//, ""));
  } catch (error) {
    return "";
  }
}

function cleanSummary(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, attempts = 4) {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, options);
    if (response.ok || response.status !== 429 || attempt === attempts) return response;

    lastStatus = response.status;
    const waitMs = 5000 * attempt;
    console.warn(`Wikipedia returned ${lastStatus}; retrying in ${Math.round(waitMs / 1000)}s...`);
    await sleep(waitMs);
  }
}

async function fetchSummaryBatch(titles) {
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
  const response = await fetchWithRetry(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1 (local NES batch description enrichment)",
    },
  });

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
  const pages = Object.values(result.query?.pages || {});
  const pageByTitle = new Map(pages.map((page) => [page.title, page]));
  const summaries = new Map();

  titles.forEach((title) => {
    const normalized = normalizedMap.get(title) || title;
    const redirected = redirectMap.get(normalized) || redirectMap.get(title) || normalized;
    const page = pageByTitle.get(redirected) || pageByTitle.get(normalized) || pageByTitle.get(title);
    const summary = cleanSummary(page?.extract);

    if (!summary || /may refer to:/i.test(summary)) return;

    summaries.set(title, {
      description: summary,
      descriptionSourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
    });
  });

  return summaries;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const games = readJson(nesPath);
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};
  let enriched = 0;
  const titleToGames = new Map();

  games.forEach((game) => {
    const title = titleFromArticleUrl(game.articleUrl);
    if (!title) return;
    if (!titleToGames.has(title)) titleToGames.set(title, []);
    titleToGames.get(title).push(game);
  });

  const titles = Array.from(titleToGames.keys());
  const batchSize = 15;

  for (let index = 0; index < titles.length; index += batchSize) {
    const batch = titles.slice(index, index + batchSize);
    const summaries = await fetchSummaryBatch(batch);

    summaries.forEach((summary, title) => {
      titleToGames.get(title).forEach((game) => {
        game.description = summary.description;
        game.descriptionSourceUrl = summary.descriptionSourceUrl;
        game.descriptionProvider = "Wikipedia extract";
        enriched += 1;
      });
    });

    await sleep(2500);
  }

  if (dryRun) {
    console.log(`Dry-run would update ${enriched} NES descriptions.`);
    return;
  }

  writeJson(nesPath, games);
  writeJson(manifestPath, {
    ...manifest,
    descriptionEnrichedAt: new Date().toISOString(),
    descriptionProvider: "Wikipedia page extracts",
    descriptionCount: games.filter((game) => game.descriptionProvider).length,
    missingDescriptionCount: games.filter((game) => !game.descriptionProvider).length,
  });

  console.log(`Descriptions available for ${games.filter((game) => game.descriptionProvider).length}/${games.length} NES records.`);
  console.log(`Updated ${enriched} NES descriptions.`);
  console.log(`Records still missing descriptions: ${games.filter((game) => !game.descriptionProvider).length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
