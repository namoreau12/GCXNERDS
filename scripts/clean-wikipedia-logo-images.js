const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const dryRun = process.argv.includes("--dry-run");

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

function isWikipediaImage(game) {
  return /wikipedia/i.test(String(game.imageProvider || "")) || /wikipedia\.org/i.test(String(game.imageSourceUrl || ""));
}

const platformConflictTerms = {
  "3ds": ["ps2", "ps3", "ps4", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  dreamcast: ["saturn", "genesis", "ps2", "ps3", "ps4", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  ds: ["3ds", "psp", "vita", "ps2", "ps3", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  gameboy: ["gba", "3ds", "ds", "psp", "vita", "ps2", "ps3", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  gamecube: ["ps2", "ps3", "ps4", "psp", "vita", "xbox", "xbox 360", "wii", "switch"],
  gba: ["gamecube", "3ds", "ds", "psp", "vita", "ps2", "ps3", "xbox", "xbox 360", "wii", "switch"],
  genesis: ["saturn", "dreamcast", "ps2", "ps3", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  n64: ["gamecube", "wii", "switch", "ps2", "ps3", "psp", "vita", "xbox", "xbox 360"],
  nes: ["snes", "n64", "gameboy", "gamecube", "wii", "switch", "playstation", "ps2", "ps3", "psp", "vita", "xbox", "xbox 360"],
  ps1: ["ps2", "ps3", "ps4", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  ps2: ["ps3", "ps4", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  ps3: ["ps2", "ps4", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  ps4: ["ps2", "ps3", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  ps5: ["ps2", "ps3", "ps4", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  psp: ["ps2", "ps3", "ps4", "ps5", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  saturn: ["genesis", "dreamcast", "ps2", "ps3", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  snes: ["nes", "n64", "gameboy", "gamecube", "wii", "switch", "playstation", "ps2", "ps3", "psp", "vita", "xbox", "xbox 360"],
  switch: ["ps2", "ps3", "ps4", "ps5", "psp", "vita", "xbox", "xbox 360", "gamecube", "wii"],
  vita: ["ps2", "ps3", "ps4", "ps5", "psp", "xbox", "xbox 360", "gamecube", "wii", "switch"],
  wii: ["wiiu", "wii u", "gamecube", "switch", "ps2", "ps3", "ps4", "psp", "vita", "xbox", "xbox 360"],
  xbox: ["xbox 360", "ps2", "ps3", "ps4", "psp", "vita", "gamecube", "wii", "switch"],
  xbox360: ["ps2", "ps3", "ps4", "ps5", "psp", "vita", "gamecube", "wii", "switch"],
};
const nonConsoleCoverTerms = ["zx spectrum", "spectrum", "amiga", "commodore", "c64", "ms dos", "dos", "windows pc", "pc cover"];

function compactImageText(value) {
  return decodeURIComponent(String(value || ""))
    .toLowerCase()
    .replace(/[_\-+.]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPlatformConflict(slug, game) {
  const terms = platformConflictTerms[slug] || [];
  if (!terms.length) return false;
  const haystack = compactImageText([game.imageUrl, game.imageSourceUrl, game.imageMatchedTitle].join(" "));
  return [...terms, ...nonConsoleCoverTerms].some((term) => {
    const compactTerm = compactImageText(term);
    return compactTerm && new RegExp(`(^| )${compactTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`, "i").test(haystack);
  });
}

function isObviousLogoOrListImage(game) {
  const haystack = [
    game.imageUrl,
    game.imageSourceUrl,
    game.imageMatchedTitle,
    game.imageRole,
  ].join(" ");

  if (/\/wiki\/List_of_/i.test(String(game.imageSourceUrl || ""))) return true;
  if (/Nintendo_3DS_case_banners|case_banners/i.test(haystack)) return true;
  if (/(logo|banner|flyer|arcadeflyer|arcadegame|promo|promotion|tokuten)/i.test(haystack)) return true;
  if (/\.(svg)(\.png)?(\?|$)/i.test(String(game.imageUrl || ""))) return true;
  return false;
}

function isNoisyWikipediaPageImage(game) {
  if (game.imageProvider !== "Wikipedia page image") return false;
  const imageText = compactImageText(game.imageUrl || "");
  if (/\b(cover|box art|boxart|cover art|game cover)\b/i.test(imageText)) return false;
  return true;
}

function clearImage(game) {
  delete game.imageUrl;
  delete game.imageSourceUrl;
  delete game.imageProvider;
  delete game.imageMatchedTitle;
  delete game.imageMatchScore;
  delete game.imageRole;
  game.imageQualityNote = "Cleared Wikipedia logo, banner, SVG, or list-page image assignment; needs cover/key art.";
  game.healthUpdatedAt = new Date().toISOString();
}

function main() {
  const summary = [];
  const samples = [];

  for (const fileName of gameFiles()) {
    const slug = fileName.replace(/\.json$/, "");
    const dataPath = path.join(gamesDir, fileName);
    const games = readJson(dataPath);
    if (!Array.isArray(games)) continue;

    let cleaned = 0;
    for (const game of games) {
      if (
        !isWikipediaImage(game) ||
        (!isObviousLogoOrListImage(game) && !hasPlatformConflict(slug, game) && !isNoisyWikipediaPageImage(game))
      ) {
        continue;
      }
      if (samples.length < 80) {
        samples.push({
          platform: slug,
          title: game.title,
          provider: game.imageProvider || "",
          imageUrl: game.imageUrl || "",
          imageSourceUrl: game.imageSourceUrl || "",
          matchedTitle: game.imageMatchedTitle || "",
        });
      }
      if (!dryRun) clearImage(game);
      cleaned += 1;
    }

    if (cleaned) {
      if (!dryRun) writeJson(dataPath, games);
      summary.push({ platform: slug, cleaned });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    totalCleaned: summary.reduce((sum, item) => sum + item.cleaned, 0),
    summary,
    samples,
  };
  fs.writeFileSync(path.join(gamesDir, "wikipedia-logo-image-cleanup-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.table(summary);
  console.log(`${dryRun ? "Would clear" : "Cleared"} ${report.totalCleaned} Wikipedia logo/list/flyer/wrong-platform image assignments.`);
}

main();
