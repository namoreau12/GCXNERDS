const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");

const sourceRepairs = new Map([
  [
    "ps1-anastasia",
    {
      descriptionSourceUrl: "https://psxdatacenter.com/games/P/A/SLES-02961.html",
      articleUrl: "https://www.mobygames.com/game/158233/anastasia/",
    },
  ],
]);

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  let changed = 0;

  games.forEach((game) => {
    const repair = sourceRepairs.get(game.id);
    if (!repair) return;
    Object.entries(repair).forEach(([key, value]) => {
      if (game[key] !== value) {
        game[key] = value;
        changed += 1;
      }
    });
  });

  fs.writeFileSync(gamesPath, `${JSON.stringify(games, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ changed, repairedIds: [...sourceRepairs.keys()] }, null, 2));
}

main();
