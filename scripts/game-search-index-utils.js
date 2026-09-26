const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");

function normalizedText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedSearchText(value) {
  return normalizedText(value).toLowerCase();
}

function arrayValues(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function firstFilled(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim()) || "";
}

function visibleOverviewFor(game) {
  return normalizedText(firstFilled(game.description, game.gcxOverview, game.overview));
}

function buildGameSearchText(game, overview = visibleOverviewFor(game)) {
  return normalizedSearchText(
    [
      game.title,
      game.name,
      game.developer,
      game.publisher,
      ...arrayValues(game.developers),
      ...arrayValues(game.publishers),
      game.firstReleased,
      game.year,
      ...arrayValues(game.releasedRegions),
      ...arrayValues(game.releaseYears),
      game.platform,
      ...arrayValues(game.platforms),
      ...arrayValues(game.tags),
      overview,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function countNeedle(haystack, needle) {
  if (!haystack || !needle || needle.length < 80) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index >= 0) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

function gameSearchIndexIssue(game, fileName) {
  const overview = visibleOverviewFor(game);
  const searchText = normalizedSearchText(game.searchText);
  const occurrenceCount = countNeedle(searchText, normalizedSearchText(overview));
  if (occurrenceCount <= 1) return null;
  return {
    fileName,
    id: game.id || "",
    title: game.title || game.name || "",
    occurrenceCount,
    currentSearchLength: searchText.length,
    rebuiltSearchLength: buildGameSearchText(game, overview).length,
  };
}

function readGameDatasets() {
  return fs
    .readdirSync(gamesDir)
    .filter(isGameDatasetFile)
    .map((fileName) => {
      const filePath = path.join(gamesDir, fileName);
      return {
        fileName,
        filePath,
        games: JSON.parse(fs.readFileSync(filePath, "utf8")),
      };
    })
    .filter((dataset) => Array.isArray(dataset.games));
}

module.exports = {
  buildGameSearchText,
  gameSearchIndexIssue,
  gamesDir,
  readGameDatasets,
  rootDir,
  visibleOverviewFor,
};
