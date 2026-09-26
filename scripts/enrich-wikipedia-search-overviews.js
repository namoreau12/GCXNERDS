const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sample = args.includes("--sample");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;
const platforms = args.filter((arg) => !arg.startsWith("--"));

const gameSignals =
  /video game|computer game|console game|arcade game|role-playing|role playing|rpg|action-adventure|platform game|platformer|shooter|shoot 'em up|fighting game|racing game|sports game|simulation|visual novel|adventure game|survival horror|strategy game|tactical|rhythm game|puzzle game|beat 'em up|hack and slash/i;

const rejectSignals =
  /\b(list of|discography|film|television series|anime television series|manga series|light novel series|novel|soundtrack|album|company|developer|publisher|franchise)\b/i;

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "game",
  "games",
  "edition",
  "version",
  "portable",
  "plus",
  "special",
  "collection",
  "series",
  "volume",
  "vol",
  "playstation",
  "nintendo",
  "xbox",
]);

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleWords(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .filter((word) => !stopWords.has(word))
    .filter((word) => !/^\d+$/.test(word));
}

function hasUsefulOverview(game) {
  return [game.description, game.gcxOverview, game.overview].some((overview) => {
    const text = String(overview || "").trim();
    if (text.length < 80) return false;
    return !/(officially released|official release|game record|licensed north american|software list|cataloged nes release|catalogued nes release)/i.test(text);
  });
}

function cleanExtract(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let overview = "";
  for (const sentence of sentences) {
    const next = `${overview} ${sentence.trim()}`.trim();
    if (next.length > 620 && overview) break;
    overview = next;
    if (overview.length >= 260) break;
  }
  return overview;
}

function pageLooksLikeTitle(gameTitle, pageTitle, extract) {
  const gameNorm = normalize(gameTitle);
  const pageNorm = normalize(pageTitle.replace(/\s*\([^)]*\)\s*/g, " "));
  if (!gameNorm || !pageNorm) return false;
  if (pageNorm === gameNorm) return true;
  if (pageNorm.includes(gameNorm) && gameNorm.length >= 8) return true;

  const gameWords = Array.from(new Set(titleWords(gameTitle)));
  if (!gameWords.length) return false;
  const combined = normalize(`${pageTitle} ${extract}`);
  const overlap = gameWords.filter((word) => combined.includes(word)).length;
  return overlap >= Math.min(2, gameWords.length);
}

function isUsefulExtract(game, pageTitle, extract) {
  if (!extract || extract.length < 100) return false;
  const opening = extract.slice(0, 420);
  if (rejectSignals.test(opening) && !gameSignals.test(opening)) return false;
  if (!gameSignals.test(extract)) return false;
  return pageLooksLikeTitle(game.title, pageTitle, extract);
}

async function fetchJson(url, label) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "GamesCardsExchange/0.1 local Wikipedia search overview enrichment",
        },
      });
      if (response.ok) return response.json();
      if (response.status !== 429 && response.status < 500) throw new Error(`${label} returned ${response.status}`);
    } catch (error) {
      if (attempt === 1) throw error;
    } finally {
      clearTimeout(timeout);
    }
    await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
  }
  throw new Error(`${label} failed repeatedly.`);
}

async function searchWikipedia(game) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", `${game.title} video game`);
  url.searchParams.set("srlimit", "3");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  const result = await fetchJson(url, "Wikipedia search");
  return result.query?.search || [];
}

async function fetchExtract(pageTitle) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "extracts|pageimages");
  url.searchParams.set("exintro", "1");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("piprop", "thumbnail|original");
  url.searchParams.set("pithumbsize", "500");
  url.searchParams.set("titles", pageTitle);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  const result = await fetchJson(url, "Wikipedia extract");
  const page = Object.values(result.query?.pages || {})[0];
  if (!page || page.missing) return null;
  return {
    title: page.title,
    extract: page.extract || "",
    imageUrl: page.thumbnail?.source || page.original?.source || "",
    sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
  };
}

function updateSearchText(game) {
  game.searchText = normalize([
    game.title,
    game.platform,
    ...(game.publishers || []),
    ...(game.developers || []),
    ...(game.genres || []),
    game.publisher,
    game.developer,
    game.description,
  ].filter(Boolean).join(" "));
}

async function enrichPlatform(platform) {
  const dataPath = path.join(gamesDir, `${platform}.json`);
  const manifestPath = path.join(gamesDir, `${platform}-manifest.json`);
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) return null;

  let targets = games.filter((game) => !hasUsefulOverview(game));
  if (limit > 0) targets = targets.slice(0, limit);
  const stats = { platform, targets: targets.length, matched: 0, images: 0, failed: 0, samples: [], errors: [] };
  console.log(`${dryRun ? "Dry-run " : ""}${platform}: checking ${targets.length} missing overview records.`);

  for (const [index, game] of targets.entries()) {
    try {
      const searchResults = await searchWikipedia(game);
      for (const result of searchResults) {
        const detail = await fetchExtract(result.title);
        if (!detail || !isUsefulExtract(game, detail.title, detail.extract)) continue;
        const overview = cleanExtract(detail.extract);
        if (!overview) continue;
        stats.matched += 1;
        if (stats.samples.length < 30) stats.samples.push({ title: game.title, pageTitle: detail.title, overview });
        if (!dryRun) {
          game.description = overview;
          game.overviewStatus = "published";
          game.descriptionProvider = "Wikipedia search overview";
          game.descriptionSourceUrl = detail.sourceUrl;
          game.healthUpdatedAt = new Date().toISOString();
          if (detail.imageUrl && !game.imageUrl && !game.coverUrl && !game.boxArtUrl && !game.coverImage && !game.thumbnailUrl) {
            game.imageUrl = detail.imageUrl;
            game.imageSourceUrl = detail.sourceUrl;
            game.imageProvider = "Wikipedia page image via search";
            stats.images += 1;
          }
          updateSearchText(game);
        }
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (error) {
      stats.failed += 1;
      if (stats.errors.length < 5) stats.errors.push({ title: game.title, message: error.message || String(error) });
    }
    if ((index + 1) % 10 === 0 || index + 1 === targets.length) {
      console.log(`${platform}: checked ${index + 1}/${targets.length}; matched ${stats.matched}; failed ${stats.failed}.`);
    }
  }

  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      wikipediaSearchOverviewEnrichedAt: new Date().toISOString(),
      wikipediaSearchOverviewStats: stats,
    });
  }
  return stats;
}

async function main() {
  const targets = platforms.length ? platforms : ["ds", "ps1", "3ds", "ps2", "gameboy", "ps3", "psp", "nes"];
  const results = [];
  for (const platform of targets) results.push(await enrichPlatform(platform));
  console.table(results.map(({ platform, targets, matched, images, failed }) => ({ platform, targets, matched, images, failed })));
  if (sample || dryRun) {
    results.forEach((result) => {
      if (result.samples.length) {
        console.log(`\n${result.platform} samples:`);
        result.samples.slice(0, 12).forEach((item) => console.log(`- ${item.title} => ${item.pageTitle}: ${item.overview}`));
      }
      if (result.errors.length) console.log(`${result.platform} errors: ${JSON.stringify(result.errors, null, 2)}`);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
