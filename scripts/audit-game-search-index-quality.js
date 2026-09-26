const fs = require("node:fs");
const path = require("node:path");
const { gameSearchIndexIssue, readGameDatasets, rootDir } = require("./game-search-index-utils");

const outputPath = path.join(rootDir, "data", "launch-readiness", "game-search-index-quality.json");

function main() {
  const issues = [];
  let scannedGames = 0;

  for (const dataset of readGameDatasets()) {
    for (const game of dataset.games) {
      scannedGames += 1;
      const issue = gameSearchIndexIssue(game, dataset.fileName);
      if (issue) issues.push(issue);
    }
  }

  const report = {
    ok: issues.length === 0,
    generatedAt: new Date().toISOString(),
    scannedGames,
    repeatedOverviewSearchRows: issues.length,
    samples: issues.slice(0, 25),
    message: issues.length
      ? `${issues.length.toLocaleString()} game search-index row(s) repeat the same overview multiple times. Run scripts/cleanup-game-search-index-quality.js.`
      : `${scannedGames.toLocaleString()} game search-index row(s) checked with no repeated overview blobs.`,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
