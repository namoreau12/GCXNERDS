const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "gba.json");
const manifestPath = path.join(rootDir, "data", "games", "gba-manifest.json");

const seeds = {
  "gba-metroid-fusion":
    "Metroid Fusion sends Samus through the BSL research station in a tighter, more story-driven adventure built around the X Parasite and the terrifying SA-X. Its guided structure, atmosphere, and upgraded movement made it one of the Game Boy Advance's defining action games.",
  "gba-metroid-zero-mission":
    "Metroid: Zero Mission remakes the original Metroid with modernized movement, cleaner map design, new areas, and a late-game stealth sequence. It is one of the best examples of the GBA turning an NES classic into a sharper portable adventure.",
  "gba-the-legend-of-zelda-the-minish-cap":
    "The Legend of Zelda: The Minish Cap gives the GBA an original Zelda adventure centered on shrinking, kinstone fusions, clever dungeons, and bright Capcom-made presentation. Its charm and late-platform polish make it a major collector title.",
  "gba-mario-kart-super-circuit":
    "Mario Kart: Super Circuit brings Nintendo's kart racing to GBA with original tracks, SNES course callbacks, drifting, items, and link-cable multiplayer. It is an important handheld bridge between classic 2D Mario Kart and later portable entries.",
  "gba-advance-wars":
    "Advance Wars introduced many players to Intelligent Systems' turn-based military strategy, using commanding officers, terrain, unit matchups, and campaign puzzles to make tactics readable and addictive on GBA.",
  "gba-advance-wars-2-black-hole-rising":
    "Advance Wars 2: Black Hole Rising expands the first game's strategy with new CO powers, tougher maps, and a larger campaign against the Black Hole army. It is a cornerstone GBA tactics game for collectors.",
  "gba-fire-emblem":
    "Fire Emblem brought Nintendo's tactical RPG series to many Western players for the first time, pairing grid battles, permanent death, support conversations, and character-driven fantasy drama. It remains one of the GBA's most important strategy RPGs.",
  "gba-fire-emblem-the-sacred-stones":
    "Fire Emblem: The Sacred Stones adds a world map, branching promotions, monster battles, and a more flexible campaign structure to the GBA formula. Its accessibility and replay value make it a strong follow-up for tactical RPG fans.",
  "gba-pokemon-ruby":
    "Pokémon Ruby begins the Hoenn generation with double battles, abilities, natures, secret bases, contests, and a new roster of Pokémon. Its version exclusives and legendary focus make it a key GBA collecting piece.",
  "gba-pokemon-sapphire":
    "Pokémon Sapphire pairs with Ruby as Hoenn's companion version, offering its own version exclusives, Team Aqua story focus, and Kyogre as the marquee legendary. It helped define Pokémon's move into the GBA era.",
  "gba-pokemon-emerald":
    "Pokémon Emerald refines Ruby and Sapphire with animated sprites, Battle Frontier, story changes, and both major Hoenn legendary conflicts. It is the most feature-rich Hoenn release on Game Boy Advance and a major collector target.",
  "gba-pokemon-firered":
    "Pokémon FireRed remakes the original Kanto adventure with GBA visuals, updated mechanics, wireless adapter support, and the Sevii Islands. It is one half of the definitive portable return to Pokémon's first generation.",
  "gba-pokemon-leafgreen":
    "Pokémon LeafGreen complements FireRed with version-exclusive Pokémon and the same updated Kanto structure, modern mechanics, and Sevii Islands content. It remains essential for collectors building out the GBA Pokémon set.",
  "gba-pokemon-mystery-dungeon-red-rescue-team":
    "Pokémon Mystery Dungeon: Red Rescue Team turns Pokémon into a dungeon-crawling RPG where players become Pokémon, recruit partners, and explore randomized rescue missions. It is one of the GBA's most distinctive Pokémon spinoffs.",
  "gba-pokemon-pinball-ruby-and-sapphire":
    "Pokémon Pinball: Ruby & Sapphire mixes pinball tables with catching, evolving, and collecting Pokémon from the Hoenn era. Its rumble support and arcade loop make it a memorable GBA spinoff.",
  "gba-mario-and-luigi-superstar-saga":
    "Mario & Luigi: Superstar Saga launches the handheld RPG series with timed attacks, brother-based field moves, slapstick comedy, and a Beanbean Kingdom adventure. Its writing and battle rhythm make it one of the GBA's standout RPGs.",
  "gba-golden-sun":
    "Golden Sun is a showcase GBA RPG built around elemental Djinn, puzzle-heavy dungeons, summon attacks, and a big fantasy quest from Camelot. Its visuals and battle effects made the handheld feel surprisingly capable.",
  "gba-golden-sun-the-lost-age":
    "Golden Sun: The Lost Age continues the first game's story from a new perspective, expanding the world, Djinn combinations, puzzles, and party options. Together, the two games form one of the GBA's signature RPG sagas.",
  "gba-castlevania-aria-of-sorrow":
    "Castlevania: Aria of Sorrow is a compact exploratory action RPG built around Soma Cruz's soul-collecting system, tight castle layout, and strong pacing. It is widely regarded as one of the best Castlevania games on GBA.",
  "gba-castlevania-circle-of-the-moon":
    "Castlevania: Circle of the Moon launched the GBA with a darker castle adventure, card-based magic combinations, and tough action RPG progression. Its challenge and launch status make it an important handheld Castlevania.",
  "gba-castlevania-harmony-of-dissonance":
    "Castlevania: Harmony of Dissonance emphasizes speed, magic, and layered castle exploration with Juste Belmont. It sits between Circle of the Moon and Aria of Sorrow as part of the GBA's strong Castlevania run.",
  "gba-mario-vs-donkey-kong":
    "Mario vs. Donkey Kong revives puzzle-platform ideas from the Game Boy Donkey Kong line, combining switches, keys, Mini-Marios, and careful movement through compact stages. It became the start of its own subseries.",
  "gba-wario-land-4":
    "Wario Land 4 is a sharp treasure-hunting platformer built around transformations, timed escapes, expressive animation, and compact stages. It is one of the GBA's best pure platform games.",
  "gba-warioware-inc-mega-microgame":
    "WarioWare, Inc.: Mega Microgame$! turns five-second microgames into a frantic comedy rhythm of reflexes, weird prompts, and escalating speed. It introduced one of Nintendo's strangest and most enduring handheld ideas.",
  "gba-kirby-and-the-amazing-mirror":
    "Kirby & the Amazing Mirror turns Kirby into a more open, maze-like adventure with copy abilities, multiple Kirbys, and interconnected areas. Its structure makes it one of the more unusual handheld Kirby games.",
  "gba-kirby-nightmare-in-dream-land":
    "Kirby: Nightmare in Dream Land remakes Kirby's Adventure with colorful GBA visuals, copy abilities, minigames, and Meta Knightmare mode. It is a polished portable version of one of Kirby's foundational adventures.",
  "gba-final-fantasy-tactics-advance":
    "Final Fantasy Tactics Advance brings tactical RPG battles to Ivalice with job systems, laws, clans, and a storybook framing. Its customization and long mission list made it one of the GBA's major strategy RPGs.",
  "gba-final-fantasy-vi-advance":
    "Final Fantasy VI Advance gives the SNES RPG classic a portable release with added content, updated localization, and the same ensemble story of rebellion, magic, and ruin. It is one of the GBA's most important RPG ports.",
  "gba-mother-3":
    "Mother 3 is a Japan-only RPG known for emotional storytelling, rhythm-based battles, family tragedy, and the strange humor associated with the Mother series. Its official cartridge is one of the GBA's most discussed import collector pieces.",
  "gba-drill-dozer":
    "Drill Dozer is a late GBA action-platformer from Game Freak built around a rumble-equipped cartridge and drill-based movement, combat, and puzzles. Its physical gimmick and polished design make it a notable collector title.",
};

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

const games = readJsonIfExists(dataPath, null);
const manifest = readJsonIfExists(manifestPath, {});
if (!Array.isArray(games)) throw new Error("Run scripts/import-gba-official-list.js first.");

let seeded = 0;
games.forEach((game) => {
  const overview = seeds[game.id];
  if (!overview) return;
  game.description = overview;
  game.descriptionProvider = "GCX editorial seed";
  game.descriptionSourceUrl = "";
  game.overviewStatus = "published";
  game.searchText = `${game.searchText || ""} ${overview}`.toLowerCase();
  seeded += 1;
});

const overviewStatusCounts = games.reduce((totals, game) => {
  const status = game.overviewStatus || "needs_editorial";
  totals[status] = (totals[status] || 0) + 1;
  return totals;
}, {});

writeJson(dataPath, games);
writeJson(manifestPath, {
  ...manifest,
  editorialSeededAt: new Date().toISOString(),
  editorialSeedCount: seeded,
  overviewStatusCounts,
});

console.log(`Seeded ${seeded} GBA editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
