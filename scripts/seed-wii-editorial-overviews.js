const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "wii.json");
const manifestPath = path.join(rootDir, "data", "games", "wii-manifest.json");

const seeds = {
  "wii-wii-sports":
    "Wii Sports is the defining pack-in for Nintendo's motion-control era, built around bowling, tennis, baseball, golf, and boxing that anyone could understand immediately. Its standalone and pack-in variants are important for collectors to distinguish.",
  "wii-wii-sports-resort":
    "Wii Sports Resort expands the original with Wii MotionPlus support, a resort setting, swordplay, archery, basketball, table tennis, and more precise motion controls. Complete listings should mention whether MotionPlus accessories are included.",
  "wii-wii-fit":
    "Wii Fit turns the Balance Board into a fitness platform with yoga, strength, aerobics, balance games, and daily tracking. Marketplace listings should clearly state whether the Balance Board is included and tested.",
  "wii-wii-fit-plus":
    "Wii Fit Plus adds more routines, minigames, calorie tracking, and custom workouts to the Balance Board formula. It is one of the Wii's most recognizable lifestyle releases.",
  "wii-super-mario-galaxy":
    "Super Mario Galaxy sends Mario through spherical planets, gravity puzzles, pointer-based star bits, and orchestral set pieces. It is one of the Wii library's defining platform games.",
  "wii-super-mario-galaxy-2":
    "Super Mario Galaxy 2 builds a denser sequel around Yoshi, sharper stage ideas, harder challenges, and a more streamlined map structure. It is one of Nintendo's strongest 3D platformers on Wii.",
  "wii-new-super-mario-bros-wii":
    "New Super Mario Bros. Wii brings four-player side-scrolling Mario to the console with chaotic co-op, power-ups, hidden exits, and classic world-map pacing. It became one of the Wii's biggest family multiplayer games.",
  "wii-mario-kart-wii":
    "Mario Kart Wii pairs motion steering with motorcycles, online racing, 12-player grids, and a huge casual-to-competitive community. Wheel bundles and disc condition matter for marketplace listings.",
  "wii-super-smash-bros-brawl":
    "Super Smash Bros. Brawl expands Nintendo's crossover fighter with online play, Final Smashes, guest characters, stage building, and the Subspace Emissary adventure mode. It is one of the Wii's most important multiplayer titles.",
  "wii-the-legend-of-zelda-twilight-princess":
    "The Legend of Zelda: Twilight Princess launched on Wii with mirrored motion-control swordplay, wolf transformations, large dungeons, and a darker Hyrule tone. It is a key cross-generation Zelda release.",
  "wii-the-legend-of-zelda-skyward-sword":
    "The Legend of Zelda: Skyward Sword centers on Wii MotionPlus sword control, sky exploration, puzzle-dense dungeons, and the earliest point in Zelda's timeline. Complete copies may include soundtrack or controller bundles.",
  "wii-metroid-prime-3-corruption":
    "Metroid Prime 3: Corruption adapts first-person Metroid exploration to Wii pointer aiming, planet-hopping missions, and a more cinematic Galactic Federation conflict. It is a major first-party action-adventure release.",
  "wii-metroid-other-m":
    "Metroid: Other M is a divisive action-focused entry that blends third-person combat, first-person aiming, and heavy story presentation. Its place in the series makes it important for full Metroid collections.",
  "wii-donkey-kong-country-returns":
    "Donkey Kong Country Returns revives the side-scrolling series with tough platforming, mine carts, silhouettes, co-op play, and Retro Studios' dense stage design. It is one of the Wii's strongest 2D platformers.",
  "wii-kirby-s-epic-yarn":
    "Kirby's Epic Yarn reimagines Kirby as a yarn-and-fabric platformer with transformation stages, co-op play, and collectible room decorating. Its art direction makes it one of the Wii's most charming exclusives.",
  "wii-kirby-s-return-to-dream-land":
    "Kirby's Return to Dream Land brings traditional copy abilities and four-player co-op back to console Kirby. It is a key Wii-era Kirby release and a strong collector target.",
  "wii-kirby-s-dream-collection-special-edition":
    "Kirby's Dream Collection Special Edition celebrates Kirby's anniversary with classic games, challenge stages, and bonus materials. Complete copies are especially important because inserts and soundtrack contents drive collector value.",
  "wii-xenoblade-chronicles":
    "Xenoblade Chronicles is a vast Monolith Soft RPG with open zones, real-time party combat, affinity systems, and a story built around the Bionis and Mechonis. Its North American release history made it a major Wii collector title.",
  "wii-fire-emblem-radiant-dawn":
    "Fire Emblem: Radiant Dawn continues Path of Radiance with multiple armies, large tactical maps, permanent death, and Tellius political drama. It is one of the Wii's most sought-after strategy RPGs.",
  "wii-animal-crossing-city-folk":
    "Animal Crossing: City Folk brings the life-sim series to Wii with town routines, city shops, holidays, collecting, and WiiConnect24 features. Complete listings should note microphone or accessory bundles if present.",
  "wii-rhythm-heaven-fever":
    "Rhythm Heaven Fever turns simple button inputs into a parade of precise musical microgames with oddball comedy and strict timing. It is one of the Wii's most beloved late-platform cult releases.",
  "wii-sin-and-punishment-star-successor":
    "Sin & Punishment: Star Successor is a fast Treasure rail shooter built around pointer aiming, dodges, sword attacks, and constant boss pressure. It is a standout action game for dedicated Wii collectors.",
  "wii-warioware-smooth-moves":
    "WarioWare: Smooth Moves uses the Wii Remote as a comedy prop across rapid-fire microgames, poses, and party scenarios. It is one of the clearest examples of Nintendo designing around motion-control weirdness.",
  "wii-super-paper-mario":
    "Super Paper Mario blends RPG writing with platforming and a 2D-to-3D flip mechanic. It stands apart from other Paper Mario games and remains one of the Wii's key Mario spinoffs.",
  "wii-punch-out":
    "Punch-Out!! revives Nintendo's boxing puzzle-action series with expressive opponents, pattern recognition, and optional motion controls. It is one of the Wii's strongest classic-franchise updates.",
  "wii-no-more-heroes":
    "No More Heroes is a stylish Grasshopper Manufacture action game about Travis Touchdown, beam-katana fights, ranked assassins, and punk presentation. It is one of the Wii's signature mature cult games.",
  "wii-no-more-heroes-2-desperate-struggle":
    "No More Heroes 2: Desperate Struggle tightens the first game's action, adds new playable characters, and leans harder into stylized boss fights. It is a major Wii collector title for cult-action fans.",
  "wii-madworld":
    "MadWorld is a black-and-white PlatinumGames brawler with violent arena objectives, comic-book presentation, and arcade-style scoring. It is one of the Wii's most visually distinct mature releases.",
  "wii-red-steel":
    "Red Steel was an early Wii showcase built around pointer shooting, sword fights, and Ubisoft's launch-window motion-control ambitions. Its historical value is stronger than its polish.",
  "wii-red-steel-2":
    "Red Steel 2 rebuilds the series around Wii MotionPlus swordplay, cel-shaded western-samurai style, and tighter first-person combat. It is a more polished motion-control action game than the original.",
  "wii-resident-evil-4-wii-edition":
    "Resident Evil 4: Wii Edition adapts Capcom's action-horror classic with pointer aiming, motion knife attacks, and extra content from prior editions. It is one of the most respected third-party Wii ports.",
  "wii-resident-evil-the-umbrella-chronicles":
    "Resident Evil: The Umbrella Chronicles turns series history into a light-gun-style rail shooter with co-op, pointer aiming, and familiar scenarios. It is a natural fit for Wii Zapper-style play.",
  "wii-monster-hunter-tri":
    "Monster Hunter Tri brings Capcom's hunting series to Wii with underwater combat, village progression, online hunts, and a focused monster roster. It is a major third-party Wii release.",
  "wii-mario-party-8":
    "Mario Party 8 brings the board-game series to Wii with motion-control minigames, themed boards, and local party play. It is one of the system's core family multiplayer titles.",
  "wii-mario-party-9":
    "Mario Party 9 changes the formula with shared vehicle movement, boss minigames, and a more streamlined board structure. It is important to distinguish from the classic-style Mario Party entries.",
  "wii-epic-mickey":
    "Epic Mickey gives Wii an ambitious Disney adventure about paint, thinner, forgotten characters, and morality-tinged choices. It is one of the platform's most recognizable third-party exclusives.",
  "wii-sonic-colors":
    "Sonic Colors pairs fast 3D/2D Sonic stages with Wisps, bright amusement-park worlds, and a cleaner tone than many prior 3D Sonic games. It is one of Sonic's strongest Wii-era releases.",
  "wii-zack-and-wiki-quest-for-barbaros-treasure":
    "Zack & Wiki: Quest for Barbaros' Treasure is a Capcom puzzle adventure built around point-and-click logic, motion gestures, and clever room solutions. It is a cult favorite among Wii collectors.",
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
if (!Array.isArray(games)) throw new Error("Run scripts/import-wii-official-list.js first.");

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

console.log(`Seeded ${seeded} Wii editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
