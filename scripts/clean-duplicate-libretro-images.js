const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const dryRun = process.argv.includes("--dry-run");
const minDuplicatesArg = process.argv.find((arg) => arg.startsWith("--min="));
const minDuplicates = Math.max(2, Number(minDuplicatesArg?.split("=")[1] || 5));

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

function isLibretroImage(game) {
  return /libretro/i.test(String(game.imageProvider || "")) && /libretro-thumbnails/i.test(String(game.imageUrl || ""));
}

function clearImage(game) {
  delete game.imageUrl;
  delete game.imageSourceUrl;
  delete game.imageProvider;
  delete game.imageMatchedTitle;
  delete game.imageMatchScore;
  delete game.imageRole;
  game.imageQualityNote = "Cleared duplicated Libretro image assignment; needs a unique cover match.";
  game.healthUpdatedAt = new Date().toISOString();
}

function main() {
  const summary = [];
  const groups = [];

  for (const fileName of gameFiles()) {
    const slug = fileName.replace(/\.json$/, "");
    const dataPath = path.join(gamesDir, fileName);
    const games = readJson(dataPath);
    if (!Array.isArray(games)) continue;

    const byUrl = new Map();
    for (const game of games) {
      if (!isLibretroImage(game)) continue;
      const url = game.imageUrl;
      if (!byUrl.has(url)) byUrl.set(url, []);
      byUrl.get(url).push(game);
    }

    let cleaned = 0;
    for (const [url, records] of byUrl) {
      if (records.length < minDuplicates) continue;
      groups.push({
        platform: slug,
        count: records.length,
        imageUrl: url,
        titles: records.slice(0, 12).map((game) => game.title),
      });
      for (const game of records) {
        if (!dryRun) clearImage(game);
        cleaned += 1;
      }
    }

    if (cleaned) {
      if (!dryRun) writeJson(dataPath, games);
      summary.push({ platform: slug, cleaned });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    minDuplicates,
    totalCleaned: summary.reduce((sum, item) => sum + item.cleaned, 0),
    summary,
    groups,
  };
  fs.writeFileSync(path.join(gamesDir, "duplicate-libretro-image-cleanup-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.table(summary);
  console.log(`${dryRun ? "Would clear" : "Cleared"} ${report.totalCleaned} duplicated Libretro image assignments.`);
}

main();
