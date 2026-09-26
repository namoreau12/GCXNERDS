const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gameboyPath = path.join(rootDir, "data", "games", "gameboy.json");
const manifestPath = path.join(rootDir, "data", "games", "gameboy-manifest.json");

const weakPatterns = [
  /\bRock Band Track Packs\b/i,
  /\b(the series contains|series of|franchise of|library of|catalogue of|catalog of|media franchise)\b/i,
  /\bwas a Japanese video game developer\b/i,
  /\bdeveloper founded in\b/i,
  /\bThis list\b/i,
  /\bprovides an index\b/i,
  /\bwas a professional wrestling promotion\b/i,
  /\bJapanese CGI anime film\b/i,
  /\banime film written by\b/i,
  /\btelevision series which was broadcast\b/i,
  /\bhas received a lukewarm reception\b/i,
  /\bpositive sales figures\b/i,
  /\bis a light novel series written by\b/i,
  /^Downloadable content for\b/i,
  /^(critics|reviewers) (gave|praised|criticized|criticised) the series\b/i,
  /^A-Train\b.*\bseries of business simulation video games\b/i,
  /^Several soundtrack albums were released\b/i,
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfExists(filePath, fallback) {
  return fs.existsSync(filePath) ? readJson(filePath) : fallback;
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function updateSearchText(game) {
  const base = [game.title, game.platform, ...(game.publishers || []), ...(game.developers || []), ...(game.genres || [])]
    .filter(Boolean)
    .join(" ");
  game.searchText = normalizeText(base);
}

function statusCounts(games) {
  return games.reduce((counts, game) => {
    const status = game.overviewStatus || "unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

function providerCounts(games) {
  return games.reduce((counts, game) => {
    const provider = game.descriptionProvider || "none";
    counts[provider] = (counts[provider] || 0) + 1;
    return counts;
  }, {});
}

function resetOverview(game, reason, removed) {
  if (game.descriptionProvider !== "Wikipedia direct article overview") return false;
  removed.push({ id: game.id, title: game.title, reason });
  game.description = "";
  delete game.descriptionProvider;
  delete game.descriptionSourceUrl;
  game.overviewStatus = "needs_editorial";
  updateSearchText(game);
  return true;
}

const games = readJson(gameboyPath);
const manifest = readJsonIfExists(manifestPath, {});
const removed = [];

for (const game of games) {
  const description = game.description || "";
  if (game.descriptionProvider !== "Wikipedia direct article overview") continue;
  if (weakPatterns.some((pattern) => pattern.test(description))) {
    resetOverview(game, "weak broad/article-series description", removed);
  }
}

const duplicateGroups = new Map();
for (const game of games) {
  if (game.descriptionProvider !== "Wikipedia direct article overview") continue;
  const key = normalizeText(game.description).slice(0, 260);
  if (!key) continue;
  if (!duplicateGroups.has(key)) duplicateGroups.set(key, []);
  duplicateGroups.get(key).push(game);
}

for (const group of duplicateGroups.values()) {
  if (group.length < 2) continue;
  group.forEach((game) => resetOverview(game, "duplicate Wikipedia overview", removed));
}

writeJson(gameboyPath, games);
writeJson(manifestPath, {
  ...manifest,
  weakWikipediaOverviewCleanedAt: new Date().toISOString(),
  weakWikipediaOverviewRemovedCount: removed.length,
  weakWikipediaOverviewRemovedSample: removed.slice(0, 40),
  overviewStatusCounts: statusCounts(games),
  descriptionProviderCounts: providerCounts(games),
});

console.log(`Removed ${removed.length} weak or duplicate GAMEBOY overviews.`);
console.log(`Published GAMEBOY overviews: ${statusCounts(games).published || 0}/${games.length}.`);
console.log(`Still needing editorial: ${statusCounts(games).needs_editorial || 0}.`);
