const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const snesPath = path.join(rootDir, "data", "games", "snes.json");
const manifestPath = path.join(rootDir, "data", "games", "snes-manifest.json");
const imageCachePath = path.join(rootDir, "data", "games", "snes-image-cache.json");

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
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

async function fetchPageImages(titles, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const url = new URL("https://en.wikipedia.org/w/api.php");
      url.searchParams.set("action", "query");
      url.searchParams.set("format", "json");
      url.searchParams.set("origin", "*");
      url.searchParams.set("prop", "pageimages|images|info");
      url.searchParams.set("inprop", "url");
      url.searchParams.set("piprop", "thumbnail|original");
      url.searchParams.set("pithumbsize", "420");
      url.searchParams.set("imlimit", "50");
      url.searchParams.set("titles", titles.join("|"));

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "GamesCardsExchange/0.1 (local SNES batch image enrichment)",
        },
      });

      if (response.status === 429) {
        const error = new Error("Wikipedia rate limited the request");
        error.rateLimited = true;
        throw error;
      }

      if (!response.ok) {
        throw new Error(`Wikipedia returned ${response.status}`);
      }

      const result = await response.json();
      return Object.values(result.query?.pages || {});
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(500 * attempt);
      }
    }
  }

  throw lastError;
}

async function fetchFileImages(fileTitles, attempts = 3) {
  if (!fileTitles.length) return [];

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const url = new URL("https://en.wikipedia.org/w/api.php");
      url.searchParams.set("action", "query");
      url.searchParams.set("format", "json");
      url.searchParams.set("origin", "*");
      url.searchParams.set("prop", "imageinfo");
      url.searchParams.set("iiprop", "url|mime|size");
      url.searchParams.set("iiurlwidth", "420");
      url.searchParams.set("titles", fileTitles.join("|"));

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "GamesCardsExchange/0.1 (local SNES batch image enrichment)",
        },
      });

      if (response.status === 429) {
        const error = new Error("Wikipedia rate limited the request");
        error.rateLimited = true;
        throw error;
      }

      if (!response.ok) {
        throw new Error(`Wikipedia returned ${response.status}`);
      }

      const result = await response.json();
      return Object.values(result.query?.pages || {});
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(700 * attempt);
      }
    }
  }

  throw lastError;
}

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function scoreImageTitle(title) {
  const value = title.toLowerCase();
  let score = 0;

  if (/\.(jpg|jpeg|png|webp)$/i.test(value)) score += 10;
  if (value.includes("cover")) score += 50;
  if (value.includes("box")) score += 40;
  if (value.includes("front")) score += 35;
  if (value.includes("title")) score += 15;
  if (value.includes("logo")) score -= 20;
  if (value.includes("svg")) score -= 40;
  if (value.includes("question book") || value.includes("wiki letter")) score -= 100;

  return score;
}

function pickBestFileTitle(page) {
  const images = (page?.images || []).filter((image) => image.title?.startsWith("File:"));
  if (!images.length) return "";

  return images
    .map((image) => ({ title: image.title, score: scoreImageTitle(image.title) }))
    .sort((a, b) => b.score - a.score)[0]?.title || "";
}

async function main() {
  const games = readJsonIfExists(snesPath, null);
  const cache = readJsonIfExists(imageCachePath, {});
  const manifest = readJsonIfExists(manifestPath, {});

  if (!Array.isArray(games)) {
    throw new Error("Run scripts/import-snes-games.js before enriching images.");
  }

  const candidates = games
    .filter((game) => !game.imageUrl && game.articleUrl && !game.articleUrl.includes("redlink=1"))
    .filter((game) => !cache[game.id]?.imageUrl)
    .map((game) => ({
      game,
      title: titleFromArticleUrl(game.articleUrl),
    }))
    .filter((item) => item.title);
  const batches = chunk(candidates, 25);
  let lookedUp = 0;

  for (const [batchIndex, batch] of batches.entries()) {
    try {
      const pages = await fetchPageImages(batch.map((item) => item.title));
      const byTitle = new Map(pages.map((page) => [page.title, page]));
      const fileLookups = [];
      const fileTitleByGameId = new Map();

      batch.forEach(({ game, title }) => {
        const page = byTitle.get(title.replaceAll("_", " ")) || byTitle.get(title);
        const imageUrl = page?.thumbnail?.source || page?.original?.source || "";
        const sourceUrl = page?.fullurl || game.articleUrl;
        const fileTitle = imageUrl ? "" : pickBestFileTitle(page);

        cache[game.id] = {
          imageUrl,
          sourceUrl,
          missing: !imageUrl,
          checkedWith: "pageimages",
        };

        if (imageUrl) {
          game.imageUrl = imageUrl;
          game.imageSourceUrl = sourceUrl;
        } else if (fileTitle) {
          fileTitleByGameId.set(game.id, fileTitle);
          fileLookups.push(fileTitle);
        }
      });

      if (fileLookups.length) {
        await wait(500);
        const filePages = await fetchFileImages(Array.from(new Set(fileLookups)));
        const filesByTitle = new Map(filePages.map((page) => [page.title, page]));

        batch.forEach(({ game }) => {
          if (game.imageUrl) return;

          const fileTitle = fileTitleByGameId.get(game.id);
          const filePage = filesByTitle.get(fileTitle);
          const info = filePage?.imageinfo?.[0];
          const imageUrl = info?.thumburl || info?.url || "";

          if (!imageUrl || info?.mime === "image/svg+xml") return;

          game.imageUrl = imageUrl;
          game.imageSourceUrl = info.descriptionurl || cache[game.id]?.sourceUrl || game.articleUrl;
          cache[game.id] = {
            imageUrl,
            sourceUrl: game.imageSourceUrl,
            fileTitle,
            missing: false,
            checkedWith: "imageinfo",
          };
        });
      }

      lookedUp += batch.length;
      console.log(`[${batchIndex + 1}/${batches.length}] checked ${batch.length} pages`);
      writeJson(imageCachePath, cache);
      writeJson(snesPath, games);
      await wait(1200);
    } catch (error) {
      if (error.rateLimited) {
        console.log("Wikipedia rate limit reached. Stop now and rerun this script later.");
        break;
      }

      console.log(`[${batchIndex + 1}/${batches.length}] failed: ${error.message}`);
      await wait(1500);
    }
  }

  games.forEach((game) => {
    if (!game.imageUrl && cache[game.id]?.imageUrl) {
      game.imageUrl = cache[game.id].imageUrl;
      game.imageSourceUrl = cache[game.id].sourceUrl || game.articleUrl;
    }
  });

  const imageCount = games.filter((game) => game.imageUrl).length;
  const articleCount = games.filter((game) => game.articleUrl).length;

  writeJson(snesPath, games);
  writeJson(manifestPath, {
    ...manifest,
    imageEnrichedAt: new Date().toISOString(),
    imageCount,
    articleCount,
    missingImageCount: games.length - imageCount,
    imageLookupCount: lookedUp,
  });

  console.log(`Images available for ${imageCount}/${games.length} SNES records.`);
  console.log(`Records still missing images: ${games.length - imageCount}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
