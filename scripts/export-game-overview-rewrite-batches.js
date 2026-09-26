const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputDir = path.join(gamesDir, "overview-rewrite-batches");
const indexPath = path.join(gamesDir, "overview-rewrite-batches.json");

const args = process.argv.slice(2);
const limitPlatforms = Number((args.find((arg) => arg.startsWith("--limit-platforms=")) || "").split("=")[1] || 8);
const limitRecords = Number((args.find((arg) => arg.startsWith("--limit-records=")) || "").split("=")[1] || 100);

const weakPatterns = [
  /officially released/i,
  /official release/i,
  /game record/i,
  /licensed north american/i,
  /software list/i,
  /\bbelongs to the .{0,80}\blibrary published by .{0,160}\bfirst appearing in \d{4}\b/i,
  /\bits identity comes from the .{0,80}\bcatalog'?s mix of handheld spin-offs, imports, ports, compilations, and smaller experiments\b/i,
  /\bregion, exact edition, manual, and cover-art details\b/i,
  /\bwhere publisher context, region, and\b/i,
  /\bfor players comparing listings,? the important checks are\b/i,
  /\bfor trading,? the safest listing should spell out region, format, edition, included extras, condition\b/i,
  /\bit translates (?:a sport|sports|a hobby|hobby) (?:or hobby )?into\b/i,
  /for collectors,? the key identifiers are/i,
  /released around \d{4}/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action) game for/i,
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function firstFilled(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim()) || "";
}

function overviewFor(game) {
  return firstFilled(game.description, game.gcxOverview, game.overview);
}

function providerFor(game) {
  return game.descriptionProvider || game.overviewProvider || "Unrecorded";
}

function sourceFor(game) {
  return game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "";
}

function rewriteReason(game) {
  const overview = overviewFor(game);
  const provider = providerFor(game);
  if (provider === "GCX metadata editorial overview") return "metadata-template";
  const pattern = weakPatterns.find((item) => item.test(overview));
  if (pattern) return "weak-template-phrase";
  if (String(overview).trim().length < 120) return "short-overview";
  return "";
}

function summarizeGame(slug, game, rank) {
  return {
    priorityRank: rank,
    platformSlug: slug,
    gameId: game.id || "",
    title: game.title || game.name || "",
    platform: game.platform || slug.toUpperCase(),
    releaseDate: game.releaseDate || "",
    publishers: (game.publishers || []).join("; "),
    developers: (game.developers || []).join("; "),
    genres: (game.genres || []).join("; "),
    currentProvider: providerFor(game),
    sourceUrl: sourceFor(game),
    reason: rewriteReason(game),
    currentOverview: overviewFor(game),
    rewriteNotes: "",
    newOverview: "",
    reviewStatus: "",
    reviewer: "",
  };
}

function csvRows(records) {
  const headers = [
    "priorityRank",
    "platformSlug",
    "gameId",
    "title",
    "platform",
    "releaseDate",
    "publishers",
    "developers",
    "genres",
    "currentProvider",
    "sourceUrl",
    "reason",
    "currentOverview",
    "rewriteNotes",
    "newOverview",
    "reviewStatus",
    "reviewer",
  ];
  return `\uFEFF${[headers, ...records.map((record) => headers.map((header) => record[header]))]
    .map((row) => row.map(csvCell).join(","))
    .join("\n")}\n`;
}

function platformQueue(fileName) {
  const slug = fileName.replace(/\.json$/, "");
  const games = readJson(path.join(gamesDir, fileName));
  if (!Array.isArray(games)) return null;
  const seenIds = new Set();
  const records = games
    .map((game) => ({ game, reason: rewriteReason(game) }))
    .filter((item) => item.reason)
    .filter((item) => {
      const gameId = item.game.id || "";
      const key = `${slug}:${gameId || item.game.title || item.game.name || ""}`;
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    })
    .map((item, index) => summarizeGame(slug, item.game, index + 1));
  return {
    slug,
    label: `${slug.toUpperCase()} Games`,
    weakOverviewCount: records.length,
    records,
  };
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const platforms = fs
    .readdirSync(gamesDir)
    .filter(isGameDatasetFile)
    .sort()
    .map(platformQueue)
    .filter((platform) => platform && platform.weakOverviewCount > 0)
    .sort((a, b) => b.weakOverviewCount - a.weakOverviewCount || a.slug.localeCompare(b.slug));

  const batches = platforms.slice(0, limitPlatforms).map((platform, index) => {
    const records = platform.records.slice(0, limitRecords);
    const fileName = `${platform.slug}-overview-rewrite-batch.csv`;
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, csvRows(records));
    return {
      platformSlug: platform.slug,
      platformLabel: platform.label,
      priorityRank: index + 1,
      weakOverviewCount: platform.weakOverviewCount,
      records: records.length,
      path: `data/games/overview-rewrite-batches/${fileName}`,
      generatedAt: new Date().toISOString(),
    };
  });

  const index = {
    generatedAt: new Date().toISOString(),
    batchMode: "overview-rewrite-priority",
    limitPlatforms,
    limitRecords,
    totalWeakOverviews: platforms.reduce((sum, platform) => sum + platform.weakOverviewCount, 0),
    totalRecords: batches.reduce((sum, batch) => sum + batch.records, 0),
    batches,
  };
  writeJsonAtomic(fs, indexPath, index);
  console.table(batches.map(({ platformSlug, weakOverviewCount, records, path }) => ({ platformSlug, weakOverviewCount, records, path })));
  console.log(`Wrote ${batches.length} overview rewrite batches to ${path.relative(rootDir, outputDir)}.`);
  console.log(`Wrote ${path.relative(rootDir, indexPath)}.`);
}

main();
