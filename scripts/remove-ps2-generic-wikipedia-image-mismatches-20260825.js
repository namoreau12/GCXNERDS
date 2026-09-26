const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ps2.json");
const reportPath = path.join(rootDir, "data", "launch-readiness", "ps2-generic-wikipedia-image-cleanup-20260825.json");
const mismatchedIds = new Set(["ps2-mahjong", "ps2-othello"]);

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

const games = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const cleaned = [];

games.forEach((game) => {
  if (!mismatchedIds.has(game.id)) return;
  if (game.imageProvider !== "Reviewed Wikipedia page image") return;
  cleaned.push({
    id: game.id,
    title: game.title || game.name || "",
    previousImageUrl: game.imageUrl || "",
    previousImageSourceUrl: game.imageSourceUrl || "",
  });
  delete game.imageUrl;
  delete game.imageSourceUrl;
  delete game.imageProvider;
  delete game.imageMatchedTitle;
  delete game.imageImportNotes;
  delete game.imageReviewStatus;
  delete game.imageReviewer;
  game.healthUpdatedAt = new Date().toISOString();
});

writeJson(dataPath, games);
writeJson(reportPath, {
  ok: true,
  generatedAt: new Date().toISOString(),
  cleanedCount: cleaned.length,
  cleaned,
});

console.log(JSON.stringify({ cleanedCount: cleaned.length, reportPath: path.relative(rootDir, reportPath) }, null, 2));
