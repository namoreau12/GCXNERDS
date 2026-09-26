const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "gamecube.json");
const manifestPath = path.join(rootDir, "data", "games", "gamecube-manifest.json");

const seeds = {
  "gamecube-super-smash-bros-melee":
    "Super Smash Bros. Melee turned Nintendo's crossover fighter into a GameCube institution, with faster movement, deeper competitive techniques, a huge single-player suite, and a roster that became central to local multiplayer culture. Its staying power makes it one of the platform's defining collector titles.",
  "gamecube-super-mario-sunshine":
    "Super Mario Sunshine sends Mario to Isle Delfino with FLUDD, water-based platforming, open resort hubs, and some of the series' strangest challenge stages. Its tropical personality and unusual mechanics make it one of the most distinctive 3D Mario games.",
  "gamecube-the-legend-of-zelda-the-wind-waker":
    "The Legend of Zelda: The Wind Waker reimagines Hyrule as a cel-shaded ocean adventure, sending Link across islands, dungeons, and sea routes with expressive animation and a bold visual style. Its reputation has only grown as one of GameCube's signature first-party releases.",
  "gamecube-metroid-prime":
    "Metroid Prime translates Metroid into first-person exploration without losing the series' isolation, scanning, upgrade gates, and environmental storytelling. Retro Studios' Tallon IV became one of the GameCube's most atmospheric and technically impressive worlds.",
  "gamecube-metroid-prime-2-echoes":
    "Metroid Prime 2: Echoes builds a darker sequel around light and dark worlds, tougher combat, and more intricate environmental routing. Its difficulty and atmosphere make it a major GameCube entry for Metroid collectors.",
  "gamecube-luigi-s-mansion":
    "Luigi's Mansion launched the GameCube with a compact haunted-house adventure built around flashlight timing, ghost capturing, room-by-room exploration, and expressive animation. Its personality helped turn Luigi into a stronger solo lead.",
  "gamecube-paper-mario-the-thousand-year-door":
    "Paper Mario: The Thousand-Year Door combines turn-based timing battles, paper-themed abilities, party partners, and sharp comedy across Rogueport and its surrounding chapters. It is one of the GameCube's most beloved RPGs and a major collector target.",
  "gamecube-mario-kart-double-dash":
    "Mario Kart: Double Dash gives each kart two riders, character-specific items, and a co-op driving hook that makes it feel unlike any other mainline Mario Kart. Its tracks, battle modes, and local multiplayer keep it central to GameCube collecting.",
  "gamecube-eternal-darkness-sanity-s-requiem":
    "Eternal Darkness: Sanity's Requiem is a psychological horror adventure built around multiple protagonists, ancient artifacts, sanity effects, and puzzle-heavy exploration across centuries. Its Nintendo-published horror identity makes it one of GameCube's most distinctive exclusives.",
  "gamecube-pikmin":
    "Pikmin introduces Captain Olimar and a tiny real-time strategy adventure about commanding plantlike creatures, collecting ship parts, and managing daylight. Its gentle presentation hides a tight, time-conscious design that gave GameCube a new Nintendo series.",
  "gamecube-pikmin-2":
    "Pikmin 2 expands the original with two captains, cave expeditions, treasure collecting, and a less restrictive campaign structure. Its deeper systems and broader creature variety make it one of the GameCube's strongest strategy-adventure games.",
  "gamecube-animal-crossing":
    "Animal Crossing turns village life into a real-time routine of errands, decorating, collecting, letters, holidays, and neighbor interactions. On GameCube, it established the laid-back social simulation loop that would become one of Nintendo's most important series.",
  "gamecube-resident-evil-4":
    "Resident Evil 4 reinvented Capcom's horror series with over-the-shoulder aiming, tense action encounters, a hostile village, and the merchant-driven upgrade loop. Its GameCube release is one of the console's landmark third-party exclusives-turned-classics.",
  "gamecube-resident-evil":
    "Resident Evil on GameCube remakes the survival-horror original with atmospheric pre-rendered backgrounds, new areas, crimson heads, and a much more polished mansion. It remains one of the most respected horror remakes on the system.",
  "gamecube-resident-evil-zero":
    "Resident Evil Zero is a prequel built around Rebecca Chambers and Billy Coen, item-dropping, character switching, and classic survival-horror resource management. Its train opening and dual-character systems give it a distinct GameCube identity.",
  "gamecube-star-wars-rogue-squadron-ii-rogue-leader":
    "Star Wars Rogue Squadron II: Rogue Leader was an early GameCube showcase, delivering fast arcade space combat, detailed ships, and missions that recreated iconic Original Trilogy battles. It remains one of the system's strongest launch-window technical flexes.",
  "gamecube-star-wars-rogue-squadron-iii-rebel-strike":
    "Star Wars Rogue Squadron III: Rebel Strike expands the space-combat formula with more vehicles, co-op versions of Rogue Leader missions, and experimental on-foot sequences. Its best moments are still rooted in Factor 5's impressive aerial battles.",
  "gamecube-f-zero-gx":
    "F-Zero GX pushes GameCube racing to extreme speed with Amusement Vision's arcade edge, brutal track design, and a demanding story mode. It is one of the console's most technically dazzling and challenging racers.",
  "gamecube-fire-emblem-path-of-radiance":
    "Fire Emblem: Path of Radiance brings Nintendo's tactical RPG series to GameCube with Ike's story, grid-based battles, support conversations, and permanent-death stakes. Its limited availability and series importance make it a high-profile collector title.",
  "gamecube-baten-kaitos-eternal-wings-and-the-lost-ocean":
    "Baten Kaitos: Eternal Wings and the Lost Ocean is a card-driven RPG with pre-rendered worlds, a floating-islands setting, and a battle system built around Magnus cards. Its unusual mechanics and Monolith Soft pedigree give it lasting cult appeal.",
  "gamecube-baten-kaitos-origins":
    "Baten Kaitos Origins refines the first game's card-based RPG systems with faster battles, a prequel story, and a smaller central party. Its late release and cult reputation make it one of the GameCube's notable RPG collector pieces.",
  "gamecube-skies-of-arcadia-legends":
    "Skies of Arcadia Legends brings Sega's Dreamcast RPG to GameCube with airship exploration, sky-pirate adventure, turn-based battles, and extra content. It is one of the platform's most sought-after role-playing games.",
  "gamecube-tales-of-symphonia":
    "Tales of Symphonia gives GameCube a large action RPG with real-time battles, party relationships, world regeneration themes, and a lengthy campaign. It became one of the console's most visible Japanese RPGs.",
  "gamecube-pokemon-colosseum":
    "Pokémon Colosseum offers a darker console RPG built around snagging and purifying Shadow Pokémon in the Orre region. Its story mode, double battles, and Game Boy Advance connectivity make it a major Pokémon collector title.",
  "gamecube-pokemon-xd-gale-of-darkness":
    "Pokémon XD: Gale of Darkness expands the Orre concept with a new Shadow Pokémon story, more purification tools, and deeper Game Boy Advance connectivity. It is one of the key GameCube games for Pokémon collectors.",
  "gamecube-the-legend-of-zelda-twilight-princess":
    "The Legend of Zelda: Twilight Princess closes GameCube's Nintendo-published era with a darker Hyrule, wolf transformation, large dungeons, and a more traditional 3D Zelda structure. The GameCube version is especially notable for its limited release and original controller layout.",
  "gamecube-soulcalibur-ii":
    "Soulcalibur II became a GameCube favorite thanks to tight weapon-based fighting and Link as the platform-exclusive guest character. Its arcade-quality combat and Nintendo crossover appeal make it one of the system's standout fighters.",
  "gamecube-sonic-adventure-2-battle":
    "Sonic Adventure 2 Battle brings Sega's Dreamcast-era Sonic action to GameCube with Hero and Dark campaigns, Chao raising, multiplayer tweaks, and fast character-specific stages. It was a major Sonic entry for Nintendo players.",
  "gamecube-sonic-adventure-dx-director-s-cut":
    "Sonic Adventure DX: Director's Cut updates Sonic's first 3D adventure for GameCube with extra missions, Game Gear unlockables, and a broad cast of playable styles. It is a key bridge between Sega's Dreamcast history and Nintendo's audience.",
  "gamecube-viewtiful-joe":
    "Viewtiful Joe is a stylish side-scrolling action game built around film powers, slow motion, fast-forward, and comic-book presentation. Its difficulty, look, and Capcom energy made it one of GameCube's defining cult action games.",
  "gamecube-ikaruga":
    "Ikaruga is a precision shoot-'em-up built around black-and-white polarity switching, bullet routing, and score-chaining discipline. Its GameCube release brought Treasure's arcade design to a small but devoted collector audience.",
  "gamecube-killer7":
    "Killer7 is a surreal action-adventure from Grasshopper Manufacture, mixing rail-like movement, assassins with distinct abilities, political horror, and striking cel-shaded presentation. It is one of GameCube's strangest and most collectible mature releases.",
  "gamecube-cubivore-survival-of-the-fittest":
    "Cubivore: Survival of the Fittest is an odd, minimalist action RPG about eating, mutating, mating, and climbing the food chain. Its low print profile and strange design have made it one of the GameCube's most famous collector curiosities.",
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
if (!Array.isArray(games)) throw new Error("Run scripts/import-gamecube-official-list.js first.");

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

console.log(`Seeded ${seeded} GameCube editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
