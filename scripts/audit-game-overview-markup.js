const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-overview-markup.json");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function hasMarkup(value) {
  return /\{\{|\}\}|<\/ref>|\[\[|\]\]|\|title=|\|url=|'''|"\}\}|literal translation<\/span>/i.test(String(value || ""));
}

function main() {
  const files = fs.readdirSync(gamesDir).filter((file) => file.endsWith(".json") && !file.includes("manifest"));
  const offenders = [];
  let scannedGames = 0;

  files.forEach((file) => {
    const games = JSON.parse(fs.readFileSync(path.join(gamesDir, file), "utf8"));
    if (!Array.isArray(games)) return;
    scannedGames += games.length;
    games.forEach((game) => {
      const overview = game.description || game.gcxOverview || game.overview || "";
      if (hasMarkup(overview)) {
        offenders.push({
          file,
          id: game.id,
          title: game.title,
          provider: game.descriptionProvider || game.overviewProvider || "",
        });
      }
    });
  });

  const report = {
    ok: offenders.length === 0,
    generatedAt: new Date().toISOString(),
    scannedGames,
    offenderCount: offenders.length,
    offenders,
  };

  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
