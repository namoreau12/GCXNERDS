const fs = require("node:fs");
const path = require("node:path");
const { writeJsonAtomic } = require("./game-dataset-utils");
const {
  buildGameSearchText,
  gameSearchIndexIssue,
  readGameDatasets,
  rootDir,
  visibleOverviewFor,
} = require("./game-search-index-utils");

const reportPath = path.join(rootDir, "data", "games", "game-search-index-cleanup-report.json");

function main() {
  const summary = [];
  const fixedRows = [];
  let scannedGames = 0;

  for (const dataset of readGameDatasets()) {
    let updated = 0;
    for (const game of dataset.games) {
      scannedGames += 1;
      const issue = gameSearchIndexIssue(game, dataset.fileName);
      if (!issue) continue;
      const nextSearchText = buildGameSearchText(game, visibleOverviewFor(game));
      if (game.searchText !== nextSearchText) {
        game.searchText = nextSearchText;
        game.healthUpdatedAt = new Date().toISOString();
        updated += 1;
        fixedRows.push(issue);
      }
    }
    if (updated) {
      writeJsonAtomic(fs, dataset.filePath, dataset.games);
      summary.push({ fileName: dataset.fileName, updated });
    }
  }

  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    scannedGames,
    fixedRows: fixedRows.length,
    summary,
    samples: fixedRows.slice(0, 25),
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.table(summary);
  console.log(`Cleaned ${fixedRows.length.toLocaleString()} repeated game search-index row(s).`);
  console.log(JSON.stringify(report, null, 2));
}

main();
