const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const ps5Path = path.join(rootDir, "data", "games", "ps5.json");
const manifestPath = path.join(rootDir, "data", "games", "ps5-manifest.json");

const seeds = {
  "ps5-astro-bot":
    "Astro Bot is a bright, precision-built PS5 platformer that turns PlayStation history, DualSense feedback, and inventive stage gimmicks into a full-scale adventure. Its playful level design and tactile presentation made it one of the clearest showcases for Sony's current hardware.",
  "ps5-astro-s-playroom":
    "Astro's Playroom comes preinstalled on PS5 as both a charming platformer and a DualSense demonstration, using haptics, adaptive triggers, motion, and touchpad interactions across PlayStation-themed worlds. It is short, polished, and important as the console's first built-in experience.",
  "ps5-demon-s-souls":
    "Demon's Souls on PS5 remakes FromSoftware's cult action RPG with Bluepoint's lavish visuals, faster loading, and preserved risk-heavy combat. Its kingdom of Boletaria, boss structure, and unforgiving systems remain foundational to the Souls lineage.",
  "ps5-marvel-s-spider-man-2":
    "Marvel's Spider-Man 2 expands Insomniac's superhero series with Peter Parker and Miles Morales sharing a larger New York, faster traversal, symbiote abilities, and cinematic villain arcs. It is one of PS5's central first-party action showcases.",
  "ps5-god-of-war-ragnarok":
    "God of War Ragnarök continues Kratos and Atreus's Norse saga with broader realms, sharper companion combat, and a story about fate, family, and war. On PS5 it benefits from smoother performance, richer presentation, and one of Sony's strongest modern action-adventure campaigns.",
  "ps5-final-fantasy-vii-rebirth":
    "Final Fantasy VII Rebirth opens the remake trilogy into wider regions beyond Midgar, mixing action RPG combat, party synergy, exploration, minigames, and a more playful road-trip structure. It is one of PS5's major RPG centerpieces.",
  "ps5-baldur-s-gate-iii":
    "Baldur's Gate III brings Larian's choice-heavy Dungeons & Dragons RPG to PS5 with tactical combat, branching quests, companion relationships, and unusually flexible problem solving. Its scale and reactivity make it one of the platform's most important role-playing games.",
  "ps5-elden-ring":
    "Elden Ring brings FromSoftware's Souls design into a vast open world shaped by dungeons, bosses, hidden routes, and flexible character builds. Its sense of discovery and challenge made it a generation-defining action RPG on PS5.",
  "ps5-ratchet-and-clank-rift-apart":
    "Ratchet & Clank: Rift Apart uses PS5's SSD and visual horsepower for fast dimension-hopping, dense animation, weapon upgrades, and colorful planet-hopping action. It remains one of the console's cleanest technical showcases.",
  "ps5-returnal":
    "Returnal blends Housemarque's arcade shooting with roguelike structure, psychological sci-fi horror, and precise DualSense feedback. Its looping planet, bullet patterns, and high-stakes runs made it one of PS5's early identity pieces.",
  "ps5-helldivers-ii":
    "Helldivers II turns cooperative alien warfare into chaotic extraction shooter comedy, with friendly fire, stratagem inputs, shifting galactic fronts, and squad improvisation at the center. It became one of PS5's biggest live-service breakout hits.",
  "ps5-horizon-forbidden-west":
    "Horizon Forbidden West sends Aloy across a larger machine-filled frontier with underwater exploration, expanded traversal, deeper combat tools, and a stronger visual identity. On PS5 it is a major first-party open-world showcase.",
  "ps5-gran-turismo-7":
    "Gran Turismo 7 brings Sony's racing sim back to car culture, license tests, tuning, photo modes, and long-term collecting. Its PS5 version emphasizes faster loading, DualSense feedback, and a polished driving presentation.",
  "ps5-the-last-of-us-part-i":
    "The Last of Us Part I rebuilds Naughty Dog's original survival drama with modern visuals, animation, accessibility features, and PS5 performance. It keeps Joel and Ellie's journey intact while presenting it closer to the studio's newer technology.",
  "ps5-the-last-of-us-part-ii-remastered":
    "The Last of Us Part II Remastered enhances Naughty Dog's sequel with PS5 performance options, extra modes, lost levels, and the roguelike No Return mode. It is the most complete current-console version of the divisive narrative action game.",
  "ps5-final-fantasy-xvi":
    "Final Fantasy XVI shifts the series toward character-action combat, political fantasy, Eikon battles, and a darker story centered on Clive Rosfield. Its spectacle and combat focus make it a major PS5-era Final Fantasy entry.",
  "ps5-stellar-blade":
    "Stellar Blade is a stylish action game built around precise dodges, parries, combo timing, and post-apocalyptic science-fiction presentation. Its combat feel and visual polish quickly made it a notable PS5 exclusive.",
  "ps5-death-stranding-2-on-the-beach":
    "Death Stranding 2: On the Beach continues Hideo Kojima's strange traversal-focused science-fiction world with broader environments, cinematic storytelling, and systems built around connection, cargo, and survival.",
  "ps5-silent-hill-2":
    "Silent Hill 2 on PS5 remakes the psychological horror classic with modern visuals, over-the-shoulder exploration, and a renewed focus on James Sunderland's guilt-soaked journey through the town. It is a major horror collector title for the platform.",
  "ps5-resident-evil-4":
    "Resident Evil 4 on PS5 modernizes Capcom's action-horror landmark with sharper combat, expanded characterization, and dense encounter design. It keeps Leon's rescue mission recognizable while making the village, castle, and island feel newly dangerous.",
  "ps5-resident-evil-village":
    "Resident Evil Village follows Ethan Winters through a gothic European nightmare of castles, factories, monsters, and family horror. Its PS5 version highlights fast loading, atmospheric visuals, and a blend of survival horror with action spectacle.",
  "ps5-alan-wake-2":
    "Alan Wake 2 is a survival-horror mystery split between Alan Wake and FBI agent Saga Anderson, combining investigation, shifting realities, live-action flourishes, and dense atmosphere. It became one of PS5's strongest narrative horror showcases.",
  "ps5-cyberpunk-2077":
    "Cyberpunk 2077 on PS5 presents Night City with smoother performance, major systemic updates, and the strongest console version of CD Projekt Red's open-world RPG. Its quests, builds, and city atmosphere make it a major current-generation redemption story.",
  "ps5-dragon-s-dogma-2":
    "Dragon's Dogma 2 expands Capcom's action RPG formula with pawn companions, emergent travel, dangerous wilderness, and physics-driven monster battles. Its appeal comes from unpredictable adventures as much as scripted quests.",
  "ps5-monster-hunter-wilds":
    "Monster Hunter Wilds pushes Capcom's hunting series into larger, more dynamic ecosystems with changing weather, mount traversal, and massive monsters built around preparation and weapon mastery.",
  "ps5-tekken-8":
    "Tekken 8 brings Bandai Namco's 3D fighter to PS5 with aggressive Heat systems, cinematic story presentation, rollback-focused online play, and a roster built for both legacy fans and new competitors.",
  "ps5-street-fighter-6":
    "Street Fighter 6 gives Capcom's flagship fighter a bold visual identity, modern controls, World Tour, Battle Hub, and the Drive system. It is one of PS5's key competitive fighting games.",
  "ps5-mortal-kombat-1":
    "Mortal Kombat 1 reboots NetherRealm's fighting universe with a new timeline, Kameo assists, cinematic story chapters, and the series' expected violent spectacle. Version and DLC clarity matter for collectors.",
  "ps5-armored-core-vi-fires-of-rubicon":
    "Armored Core VI: Fires of Rubicon revives FromSoftware's mech-action series with fast assembly-driven combat, mission structure, and demanding boss fights. It rewards players who tune their machine as carefully as they pilot it.",
  "ps5-metaphor-refantazio":
    "Metaphor: ReFantazio is a fantasy RPG from Persona veterans, mixing social scheduling, archetype-based combat, political stakes, and a road-trip tournament across a troubled kingdom. It is one of PS5's major modern JRPGs.",
  "ps5-clair-obscur-expedition-33":
    "Clair Obscur: Expedition 33 is a stylish turn-based RPG with real-time defensive inputs, painterly art direction, and a dark fantasy premise about a doomed expedition. It quickly became one of PS5's notable newer RPGs.",
  "ps5-assassin-s-creed-shadows":
    "Assassin's Creed Shadows brings Ubisoft's open-world stealth action to feudal Japan with dual protagonists, samurai and shinobi play styles, and a heavier focus on castles, infiltration, and regional conflict.",
  "ps5-black-myth-wukong":
    "Black Myth: Wukong adapts Journey to the West into a visually rich action RPG focused on staff combat, transformations, boss fights, and mythic creatures. It became one of PS5's most visible global action releases.",
  "ps5-sonic-x-shadow-generations":
    "Sonic X Shadow Generations pairs a remastered version of Sonic Generations with a new Shadow-focused campaign, blending high-speed 2D and 3D stages with modern series callbacks.",
  "ps5-star-wars-jedi-survivor":
    "Star Wars Jedi: Survivor continues Cal Kestis's action-adventure story with lightsaber stances, Force traversal, Metroidvania exploration, and larger planets. It is a major PS5 Star Wars release for action-adventure fans.",
  "ps5-hogwarts-legacy":
    "Hogwarts Legacy lets players explore Hogwarts and the surrounding wizarding world through spell combat, classes, beasts, crafting, and open-world quests. It became one of PS5's highest-profile licensed RPGs.",
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

const games = readJsonIfExists(ps5Path, null);
const manifest = readJsonIfExists(manifestPath, {});
if (!Array.isArray(games)) throw new Error("Run scripts/import-ps5-official-list.js first.");

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

writeJson(ps5Path, games);
writeJson(manifestPath, {
  ...manifest,
  editorialSeededAt: new Date().toISOString(),
  editorialSeedCount: seeded,
  overviewStatusCounts,
});

console.log(`Seeded ${seeded} PS5 editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
