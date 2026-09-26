const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "xbox.json");
const manifestPath = path.join(rootDir, "data", "games", "xbox-manifest.json");

const seeds = {
  "xbox-halo-combat-evolved":
    "Halo: Combat Evolved gave the Original Xbox its defining launch identity with console-friendly first-person shooting, rechargeable shields, vehicles, co-op campaign play, and unforgettable LAN multiplayer.",
  "xbox-halo-2":
    "Halo 2 turned Xbox Live into a mainstream console multiplayer destination with matchmaking, party systems, dual wielding, new vehicles, and a cliffhanger campaign. It is the Original Xbox's most important online-era release.",
  "xbox-fable":
    "Fable is Lionhead's action RPG about hero growth, moral choices, reputation, property, and a fantasy world that reacts to the player's behavior. It became one of Xbox's signature first-party RPGs.",
  "xbox-fable-the-lost-chapters":
    "Fable: The Lost Chapters expands the original with new areas, quests, enemies, spells, and story content. It is often the preferred Xbox version for collectors who want the fullest physical release.",
  "xbox-forza-motorsport":
    "Forza Motorsport launched Microsoft's sim-racing series with licensed cars, tuning, damage, assists, and track racing built to rival Gran Turismo. It is a cornerstone Original Xbox exclusive.",
  "xbox-project-gotham-racing":
    "Project Gotham Racing is a stylish street racer built around Kudos scoring, real-world city courses, and clean arcade handling. It helped define the Xbox launch racing lineup.",
  "xbox-project-gotham-racing-2":
    "Project Gotham Racing 2 expands the series with more cities, cars, Xbox Live play, and a deeper Kudos structure. It is one of the Original Xbox's strongest racing games.",
  "xbox-ninja-gaiden":
    "Ninja Gaiden revived Ryu Hayabusa with demanding 3D action, fast combat, weapon mastery, and a level of challenge that made it an Xbox showcase. It is one of the system's essential action titles.",
  "xbox-ninja-gaiden-black":
    "Ninja Gaiden Black refines the original with extra missions, difficulty modes, balance changes, and added content. It is widely treated as the definitive Original Xbox Ninja Gaiden release.",
  "xbox-star-wars-knights-of-the-old-republic":
    "Star Wars: Knights of the Old Republic is a BioWare RPG built around party choices, Force alignment, turn-based combat under the hood, and one of Star Wars gaming's most famous story twists.",
  "xbox-star-wars-knights-of-the-old-republic-ii-the-sith-lords":
    "Star Wars Knights of the Old Republic II: The Sith Lords takes the RPG series into darker moral territory with a more philosophical story, new companions, and Obsidian's character writing.",
  "xbox-the-elder-scrolls-iii-morrowind":
    "The Elder Scrolls III: Morrowind brought a vast PC-style open-world RPG to console with factions, spells, exploration, and Vvardenfell's alien landscape. It is a major Original Xbox RPG milestone.",
  "xbox-tom-clancy-s-splinter-cell":
    "Tom Clancy's Splinter Cell gave Xbox a stealth showcase with light-and-shadow mechanics, gadgets, precise movement, and Sam Fisher's modern espionage tone.",
  "xbox-tom-clancy-s-splinter-cell-chaos-theory":
    "Splinter Cell: Chaos Theory refines the series with flexible stealth tools, stronger level design, co-op missions, and a standout presentation for the hardware.",
  "xbox-crimson-skies-high-road-to-revenge":
    "Crimson Skies: High Road to Revenge is an arcade air-combat adventure with pulp style, dogfights, zeppelins, and Xbox Live multiplayer. It is one of the console's best cult exclusives.",
  "xbox-jet-set-radio-future":
    "Jet Set Radio Future brings Sega's cel-shaded skating, graffiti, and music-driven style to Xbox with larger levels and smoother movement. It is one of the platform's most sought-after Sega exclusives.",
  "xbox-panzer-dragoon-orta":
    "Panzer Dragoon Orta revives Sega's rail-shooter series with branching routes, dragon forms, dramatic art direction, and demanding score-chasing. It is a major Original Xbox collector title.",
  "xbox-otogi-myth-of-demons":
    "Otogi: Myth of Demons is a FromSoftware action game with destructible stages, mythic Japanese style, and aerial combat. It is one of the Xbox library's distinctive cult releases.",
  "xbox-otogi-2-immortal-warriors":
    "Otogi 2: Immortal Warriors expands the first game's supernatural action with multiple playable warriors, destructible arenas, and more elaborate combat encounters.",
  "xbox-mechassault":
    "MechAssault brought BattleTech-style mech combat to Xbox with destructive arenas, approachable controls, and early Xbox Live multiplayer importance.",
  "xbox-mechassault-2-lone-wolf":
    "MechAssault 2: Lone Wolf expands the mech-combat formula with new vehicles, armor suits, hijacking, and broader multiplayer modes.",
  "xbox-psychonauts":
    "Psychonauts is a Double Fine platform adventure about psychic summer camp, mental worlds, clever writing, and imaginative level concepts. Its reputation grew well beyond its original sales.",
  "xbox-burnout-3-takedown":
    "Burnout 3: Takedown turns arcade racing into aggressive crash-driven competition with takedowns, boost chaining, Road Rage, and spectacular wrecks. It is one of the console's best racers.",
  "xbox-burnout-revenge":
    "Burnout Revenge pushes the series toward faster, more destructive racing with traffic checking, Revenge rivals, and dense crash events. It is a standout late Original Xbox racing release.",
  "xbox-doom-3":
    "Doom 3 brings id Software's horror-heavy shooter to Xbox with dark corridors, monster ambushes, co-op support, and a technically ambitious console conversion.",
  "xbox-half-life-2":
    "Half-Life 2 on Xbox compresses Valve's physics-driven shooter onto the console, preserving City 17, gravity gun puzzles, and cinematic first-person storytelling.",
  "xbox-the-chronicles-of-riddick-escape-from-butcher-bay":
    "The Chronicles of Riddick: Escape from Butcher Bay blends stealth, melee combat, shooting, and prison-break storytelling into one of the era's best licensed games.",
  "xbox-jade-empire":
    "Jade Empire is a BioWare action RPG with martial-arts combat, companion choices, morality systems, and a mythic world inspired by Chinese fantasy traditions.",
  "xbox-conker-live-and-reloaded":
    "Conker: Live & Reloaded remakes Rare's adult comedy platformer with upgraded visuals and adds class-based Xbox Live multiplayer. It is one of the console's notable Rare collectibles.",
  "xbox-dead-or-alive-3":
    "Dead or Alive 3 was an Xbox launch fighting showcase with fast counters, interactive arenas, and detailed character models. It helped establish Team Ninja's importance on the platform.",
  "xbox-oddworld-stranger-s-wrath":
    "Oddworld: Stranger's Wrath mixes first-person bounty hunting, third-person traversal, and live-ammo creature weapons with a western tone. It is one of the Xbox's most inventive exclusives.",
  "xbox-blinx-the-time-sweeper":
    "Blinx: The Time Sweeper is a mascot platformer built around time-control mechanics, vacuum collection, and Microsoft's early push for an Xbox character platformer.",
  "xbox-steel-battalion":
    "Steel Battalion is a mech simulation famous for its massive dedicated controller, simulation-heavy cockpit systems, and unusual physical setup. Complete copies must verify the controller and all components.",
  "xbox-tony-hawk-s-pro-skater-3":
    "Tony Hawk's Pro Skater 3 brings the series' combo-driven skating to Xbox with tight objectives, expanded levels, and strong performance. It is a key early sports title on the system.",
  "xbox-grand-theft-auto-san-andreas":
    "Grand Theft Auto: San Andreas brings Rockstar's huge crime sandbox to Xbox with Los Santos, San Fierro, Las Venturas, RPG-like character systems, and a massive soundtrack-driven world.",
  "xbox-shenmue-ii":
    "Shenmue II continues Ryo Hazuki's cinematic adventure across Hong Kong and beyond, combining exploration, conversations, minigames, and martial-arts drama. It is an important Sega title for Xbox collectors.",
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
if (!Array.isArray(games)) throw new Error("Run scripts/import-xbox-official-list.js first.");

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

console.log(`Seeded ${seeded} Original Xbox editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
