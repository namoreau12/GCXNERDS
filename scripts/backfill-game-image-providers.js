const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function imageUrlFor(game) {
  return game.imageUrl || game.boxArtUrl || game.coverUrl || game.coverImage || game.thumbnailUrl || "";
}

function inferProvider(game) {
  const text = `${imageUrlFor(game)} ${game.imageSourceUrl || ""}`.toLowerCase();
  if (!text.trim()) return "";
  if (text.includes("assets.nintendo.com") || text.includes("atum-img-lp1.cdn.nintendo.net")) return "Nintendo official store image";
  if (text.includes("upload.wikimedia.org") || text.includes("wikipedia.org")) return "Wikipedia image";
  if (text.includes("raw.githubusercontent.com/libretro-thumbnails") || text.includes("github.com/libretro-thumbnails")) return "Libretro thumbnails";
  if (text.includes("image.api.playstation.com") || text.includes("store.playstation.com")) return "PlayStation official catalog image";
  if (text.includes("xbox") || text.includes("microsoft.com")) return "Microsoft official catalog image";
  return "";
}

function main() {
  const updates = [];
  const files = fs.readdirSync(gamesDir).filter(isGameDatasetFile).sort();

  files.forEach((fileName) => {
    const filePath = path.join(gamesDir, fileName);
    const games = readJson(filePath);
    if (!Array.isArray(games)) return;
    let changed = false;

    games.forEach((game) => {
      if (!imageUrlFor(game) || String(game.imageProvider || "").trim()) return;
      const provider = inferProvider(game);
      if (!provider) return;
      game.imageProvider = provider;
      game.imageProviderBackfilledAt = new Date().toISOString();
      updates.push({
        platform: fileName.replace(/\.json$/, ""),
        id: game.id || "",
        title: game.title || game.name || "",
        provider,
      });
      changed = true;
    });

    if (changed) writeJsonAtomic(fs, filePath, games);
  });

  const report = {
    generatedAt: new Date().toISOString(),
    updated: updates.length,
    updates: updates.slice(0, 100),
    truncatedUpdates: Math.max(0, updates.length - 100),
  };
  const reportPath = path.join(gamesDir, "image-provider-backfill-report.json");
  writeJsonAtomic(fs, reportPath, report);
  console.log(JSON.stringify(report, null, 2));
}

main();
