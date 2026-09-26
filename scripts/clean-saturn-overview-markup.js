const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const saturnPath = path.join(rootDir, "data", "games", "saturn.json");
const manifestPath = path.join(rootDir, "data", "games", "saturn-manifest.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
  const base = [game.title, game.platform, ...(game.publishers || []), ...(game.developers || []), ...(game.genres || []), game.description || ""]
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

function cleanDescription(value) {
  return String(value || "")
    .replace(/^.*?'>\s*(?=[A-Z0-9_Æ])/u, "")
    .replace(/"\}\]\],"parts":\}'>/g, "")
    .replace(/literal translation<\/span>/gi, "lit. ")
    .replace(/\s*;\s*lit\.\s*lit\./gi, "; lit.")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(")
    .replace(/\s+/g, " ")
    .trim();
}

const games = readJson(saturnPath);
const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};

let fixed = 0;
let reset = 0;

for (const game of games) {
  if (game.description) {
    const cleaned = cleanDescription(game.description);
    if (cleaned !== game.description) {
      game.description = cleaned;
      fixed += 1;
      updateSearchText(game);
    }
  }

  if (game.overviewStatus === "published" && (!game.description || !game.descriptionProvider)) {
    game.description = "";
    delete game.descriptionProvider;
    delete game.descriptionSourceUrl;
    game.overviewStatus = "needs_editorial";
    reset += 1;
    updateSearchText(game);
  }
}

writeJson(saturnPath, games);
writeJson(manifestPath, {
  ...manifest,
  saturnOverviewMarkupCleanedAt: new Date().toISOString(),
  saturnOverviewMarkupFixedCount: fixed,
  saturnOverviewEmptyPublishedResetCount: reset,
  overviewStatusCounts: statusCounts(games),
  descriptionProviderCounts: providerCounts(games),
});

console.log(`Fixed ${fixed} SATURN overview markup fragments.`);
console.log(`Reset ${reset} empty published SATURN records.`);
console.log(`Published SATURN overviews: ${statusCounts(games).published || 0}/${games.length}.`);
