const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const switch2Path = path.join(rootDir, "data", "games", "switch2.json");
const manifestPath = path.join(rootDir, "data", "games", "switch2-manifest.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function isGenericImportDescription(value) {
  return /Nintendo Store-recognized Nintendo Switch 2 game record imported from the official Switch 2 games catalog\./i.test(
    String(value || "")
  );
}

function main() {
  const games = readJson(switch2Path);
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};
  let changed = 0;

  games.forEach((game) => {
    if (isGenericImportDescription(game.description)) {
      game.description = "";
      delete game.descriptionProvider;
      delete game.descriptionSourceUrl;
      changed += 1;
    }

    if (isGenericImportDescription(game.importDescription)) {
      delete game.importDescription;
    }

    if (!game.descriptionProvider) {
      game.overviewStatus = "needs_editorial";
    }
  });

  writeJson(switch2Path, games);
  writeJson(manifestPath, {
    ...manifest,
    overviewStatusUpdatedAt: new Date().toISOString(),
    overviewRule:
      "Generic imported-record descriptions are hidden from public overview display. Titles without reviewed/source-backed copy are marked needs_editorial.",
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "published";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
    genericDescriptionsRemoved: changed,
  });

  console.log(`Removed ${changed} generic Switch 2 descriptions.`);
  console.log(
    `Switch 2 titles needing editorial overview: ${games.filter((game) => game.overviewStatus === "needs_editorial").length}/${games.length}.`
  );
}

main();
