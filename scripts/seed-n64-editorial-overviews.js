const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const n64Path = path.join(rootDir, "data", "games", "n64.json");
const manifestPath = path.join(rootDir, "data", "games", "n64-manifest.json");

const overviewsById = {
  "n64-paper-mario":
    "Paper Mario is a story-driven RPG that gives Mario's world a pop-up paper look, turn-based battles, timed button commands, and partner characters with unique field abilities. Its humor, approachable combat, and collectible badges make it one of the N64 library's signature late-era role-playing games.",
  "n64-pilotwings-64":
    "Pilotwings 64 is a flight-skill game built around hang gliders, rocket belts, gyrocopters, and other aerial challenges. It emphasizes smooth control, target landing, exploration, and score-based objectives while showing off the Nintendo 64's open 3D spaces.",
  "n64-battletanx":
    "BattleTanx is a vehicular combat game where players control tanks through city arenas, missions, and multiplayer battles. Its arcade-style destruction and four-player support give it a distinct place among N64 action games.",
  "n64-battletanx-global-assault":
    "BattleTanx: Global Assault expands the tank-combat formula with more vehicles, larger battlefields, mission variety, and multiplayer modes. It is the broader and more feature-rich sequel for collectors interested in the series.",
  "n64-duke-nukem-64":
    "Duke Nukem 64 adapts Duke Nukem 3D for Nintendo 64 with console-focused controls, altered content, and split-screen multiplayer. It remains notable as one of the system's mature first-person shooter ports.",
  "n64-gauntlet-legends":
    "Gauntlet Legends brings Midway's arcade dungeon-crawling action to Nintendo 64 with character classes, monster-filled stages, loot, leveling, and cooperative multiplayer. It is a strong fit for players looking for couch co-op action on the platform.",
  "n64-command-and-conquer":
    "Command & Conquer on Nintendo 64 adapts the real-time strategy classic to console play, with base building, resource harvesting, unit production, and campaign missions. Its cartridge release is notable because traditional RTS games were uncommon on the system.",
  "n64-dobutsu-no-mori":
    "Dōbutsu no Mori is the original Japanese Nintendo 64 version of what became Animal Crossing. Players move into a village of animal neighbors, decorate a home, collect items, and experience daily life tied to the real-world clock.",
  "n64-clayfighter-sculptor-s-cut":
    "ClayFighter: Sculptor's Cut is an expanded version of ClayFighter 63 1/3 with additional characters and content. Its limited rental-exclusive distribution made it one of the most valuable and heavily watched cartridges in the N64 collector market.",
  "n64-asteroids-hyper-64":
    "Asteroids Hyper 64 reworks Atari's classic asteroid-blasting arcade formula for the Nintendo 64 with 3D visuals, weapon upgrades, and arena-style space combat. It is a later-era example of an arcade classic being rebuilt for 3D hardware.",
  "n64-bakuretsu-muteki-bangaio":
    "Bakuretsu Muteki Bangaiō is the Japanese Nintendo 64 version of Bangai-O, a chaotic Treasure-developed action shooter built around missile barrages, tight arenas, and explosive screen-filling combat. Its limited regional release gives it extra collector interest.",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function main() {
  const games = readJson(n64Path);
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};
  let updated = 0;

  games.forEach((game) => {
    const overview = overviewsById[game.id];
    if (!overview) return;
    game.description = overview;
    game.descriptionProvider = "GCX editorial seed";
    game.descriptionSourceUrl = game.articleUrl || game.sourceUrl;
    game.overviewStatus = "published";
    updated += 1;
  });

  writeJson(n64Path, games);
  writeJson(manifestPath, {
    ...manifest,
    gcxEditorialSeededAt: new Date().toISOString(),
    gcxEditorialSeedCount: Object.keys(overviewsById).length,
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "unknown";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
    descriptionProviderCounts: games.reduce((counts, game) => {
      const provider = game.descriptionProvider || "none";
      counts[provider] = (counts[provider] || 0) + 1;
      return counts;
    }, {}),
  });

  console.log(`Seeded ${updated} N64 editorial overviews.`);
}

main();
