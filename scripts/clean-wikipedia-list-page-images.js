const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  writeJsonAtomic(fs, filePath, value);
}

function gameFiles() {
  return fs
    .readdirSync(gamesDir)
    .filter(isGameDatasetFile)
    .sort();
}

function main() {
  const summary = [];

  for (const fileName of gameFiles()) {
    const dataPath = path.join(gamesDir, fileName);
    const games = readJson(dataPath);
    if (!Array.isArray(games)) continue;

    let cleaned = 0;
    for (const game of games) {
      const isBadListImage =
        game.imageProvider === "Wikipedia page image" &&
        /\/wiki\/List_of_/i.test(String(game.imageSourceUrl || ""));
      if (!isBadListImage) continue;

      delete game.imageUrl;
      delete game.imageSourceUrl;
      delete game.imageProvider;
      delete game.imageMatchedTitle;
      delete game.healthUpdatedAt;
      cleaned += 1;
    }

    if (cleaned) {
      writeJson(dataPath, games);
      summary.push({ platform: fileName.replace(/\.json$/, ""), cleaned });
    }
  }

  console.table(summary);
  console.log(`Removed ${summary.reduce((sum, item) => sum + item.cleaned, 0)} Wikipedia list-page image assignments.`);
}

main();
