const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const platformArg = argValue("platforms");
const limit = Number(argValue("limit") || 0);
const batchSize = Number(argValue("batch-size") || 20);
const requestDelayMs = Number(argValue("delay-ms") || 1200);
const platformFilter = new Set(
  platformArg
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return readJson(filePath);
}

function writeJson(filePath, value) {
  writeJsonAtomic(fs, filePath, value);
}

function hasImage(game) {
  return Boolean(game.imageUrl || game.boxArtUrl || game.coverUrl || game.coverImage || game.thumbnailUrl);
}

function wikipediaTitleFromUrl(url) {
  const match = String(url || "").match(/https?:\/\/(?:[a-z]+\.)?wikipedia\.org\/wiki\/([^#?]+)/i);
  if (!match) return "";
  if (/\/wiki\/List_of_/i.test(String(url || ""))) return "";
  try {
    return decodeURIComponent(match[1]).replace(/_/g, " ");
  } catch {
    return match[1].replace(/_/g, " ");
  }
}

function sourceWikipediaTitle(game) {
  return (
    wikipediaTitleFromUrl(game.articleUrl) ||
    wikipediaTitleFromUrl(game.descriptionSourceUrl) ||
    wikipediaTitleFromUrl(game.sourceUrl)
  );
}

function pageKey(title) {
  return String(title || "").replace(/_/g, " ").trim().toLowerCase();
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
  const params = new URLSearchParams({
    action: "query",
    prop: "pageimages",
    piprop: "thumbnail|original",
    pithumbsize: "700",
    redirects: "1",
    format: "json",
    origin: "*",
    titles: titles.join("|"),
  });
  let response;
  try {
    response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "GamesCardsExchange/0.1 local Wikipedia game image enrichment",
      },
    });
  } catch (error) {
    if (attempt < 12) {
      await sleep(5000 * attempt);
      return fetchPageImages(titles, attempt + 1);
    }
    throw error;
  }
  if ((response.status === 429 || response.status >= 500) && attempt < 12) {
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    const waitMs = retryAfter > 0 ? retryAfter * 1000 : 5000 * attempt;
    await sleep(waitMs);
    return fetchPageImages(titles, attempt + 1);
  }
  if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
  return response.json();
}

function pageMapFromResponse(result) {
  const pages = Object.values(result.query?.pages || {});
  const redirectTargetByFrom = new Map(
    (result.query?.redirects || []).map((redirect) => [pageKey(redirect.from), pageKey(redirect.to)])
  );
  const normalizedTargetByFrom = new Map(
    (result.query?.normalized || []).map((normalized) => [pageKey(normalized.from), pageKey(normalized.to)])
  );
  const pagesByKey = new Map(pages.map((page) => [pageKey(page.title), page]));

  for (const [from, to] of redirectTargetByFrom) {
    const page = pagesByKey.get(to);
    if (page) pagesByKey.set(from, page);
  }
  for (const [from, to] of normalizedTargetByFrom) {
    const page = pagesByKey.get(to);
    if (page) pagesByKey.set(from, page);
  }

  return pagesByKey;
}

function imageFromPage(page) {
  return page?.thumbnail?.source || page?.original?.source || "";
}

function gameFiles() {
  return fs
    .readdirSync(gamesDir)
    .filter(isGameDatasetFile)
    .filter((fileName) => {
      if (!platformFilter.size) return true;
      return platformFilter.has(fileName.replace(/\.json$/, ""));
    })
    .sort();
}

async function enrichFile(fileName) {
  const slug = fileName.replace(/\.json$/, "");
  const dataPath = path.join(gamesDir, fileName);
  const manifestPath = path.join(gamesDir, `${slug}-manifest.json`);
  const games = readJson(dataPath);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) return null;

  const candidates = games
    .filter((game) => force || !hasImage(game))
    .map((game) => ({ game, title: sourceWikipediaTitle(game) }))
    .filter((item) => item.title)
    .slice(0, limit || undefined);

  let matched = 0;
  let processed = 0;
  const now = new Date().toISOString();

  for (const group of chunk(candidates, batchSize)) {
    const result = await fetchPageImages(group.map((item) => item.title));
    const pagesByKey = pageMapFromResponse(result);
    let batchMatched = 0;
    for (const item of group) {
      const page = pagesByKey.get(pageKey(item.title));
      const imageUrl = imageFromPage(page);
      if (!page || !imageUrl) continue;
      if (!dryRun) {
        item.game.imageUrl = imageUrl;
        item.game.imageSourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
        item.game.imageProvider = "Wikipedia page image";
        item.game.imageMatchedTitle = page.title;
        item.game.healthUpdatedAt = now;
      }
      batchMatched += 1;
      matched += 1;
    }
    processed += group.length;
    if (!dryRun && batchMatched) writeJson(dataPath, games);
    if (processed % 350 === 0 || processed === candidates.length) {
      console.log(`${slug}: checked ${processed}/${candidates.length}, matched ${matched}`);
    }
    await sleep(requestDelayMs);
  }

  const imageCount = games.filter(hasImage).length;
  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      wikipediaImageEnrichedAt: now,
      wikipediaImageCandidateCount: candidates.length,
      wikipediaImageMatchCount: matched,
      imageCount,
      missingImageCount: games.length - imageCount,
    });
  }

  return {
    platform: slug,
    candidates: candidates.length,
    matched,
    imageCount,
    total: games.length,
    missing: games.length - imageCount,
  };
}

async function main() {
  const results = [];
  for (const fileName of gameFiles()) {
    const result = await enrichFile(fileName);
    if (result) results.push(result);
  }
  console.table(results);
  if (dryRun) console.log("Dry run only. No files were changed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
