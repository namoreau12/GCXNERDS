const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "saturn.json");
const manifestPath = path.join(rootDir, "data", "games", "saturn-manifest.json");

const seeds = {
  "saturn-nights-into-dreams":
    "Nights into Dreams is the Saturn's signature original, built around flight, score-chasing, dreamlike stages, and analog control. It captures Sega's arcade energy in a form that feels unlike a standard platformer.",
  "saturn-christmas-nights":
    "Christmas Nights is a compact seasonal companion to Nights into Dreams with holiday presentation, bonus unlocks, and collector appeal beyond its size. It is especially important to verify because it was distributed differently by region.",
  "saturn-panzer-dragoon":
    "Panzer Dragoon is a rail shooter with lock-on targeting, sweeping camera movement, and a striking post-apocalyptic fantasy world. It helped define the Saturn's early identity as a home for Sega's arcade-style spectacle.",
  "saturn-panzer-dragoon-ii-zwei":
    "Panzer Dragoon II Zwei expands the original with branching routes, dragon evolution, stronger pacing, and more confident set pieces. It is one of the Saturn's best pure action showcases.",
  "saturn-panzer-dragoon-saga":
    "Panzer Dragoon Saga turns Sega's rail-shooter world into a cinematic RPG with strategic battles, flight exploration, and a rare four-disc release. Its scarcity and reputation make authenticity and completeness especially important.",
  "saturn-guardian-heroes":
    "Guardian Heroes is Treasure's branching beat-'em-up with RPG growth, multiple paths, huge sprite battles, and chaotic multiplayer. It is one of the Saturn's most celebrated action games.",
  "saturn-radiant-silvergun":
    "Radiant Silvergun is Treasure's dense vertical shooter built around weapon mastery, enemy chaining, and elaborate boss encounters. The Saturn version is a centerpiece for shooter collectors.",
  "saturn-sega-rally-championship":
    "Sega Rally Championship brings Sega's arcade rally racing home with loose surfaces, tight handling, and memorable courses. It remains one of the system's defining arcade conversions.",
  "saturn-daytona-usa":
    "Daytona USA was an early Saturn attempt to bring Sega's massive arcade racer home, preserving the music, broad handling, and stock-car chaos. Its technical compromises make later editions useful comparison points.",
  "saturn-daytona-usa-championship-circuit-edition":
    "Daytona USA: Championship Circuit Edition revises the Saturn racer with improved presentation, additional tracks, and more home-console polish. It is the cleaner Saturn option for many Daytona collectors.",
  "saturn-virtua-fighter":
    "Virtua Fighter gave the Saturn its first major 3D fighting showcase, translating Sega's polygonal arcade landmark to the launch-era console. It matters historically even beside later improved versions.",
  "saturn-virtua-fighter-remix":
    "Virtua Fighter Remix updates the original fighter with textured characters and revised presentation. It is a key Saturn variant for collectors comparing Sega's early 3D fighter releases.",
  "saturn-virtua-fighter-2":
    "Virtua Fighter 2 is one of the Saturn's most impressive arcade conversions, with fast 3D fighting, crisp animation, and a strong home port reputation. It became a technical statement for the console.",
  "saturn-virtua-cop":
    "Virtua Cop brings Sega's light-gun arcade shooter home with polygon enemies, quick target priority, and branching routes. Complete listings should call out light-gun compatibility and regional display considerations.",
  "saturn-virtua-cop-2":
    "Virtua Cop 2 expands Sega's light-gun formula with more routes, larger scenes, and stronger pacing. It is one of the Saturn's most approachable arcade-action staples.",
  "saturn-dragon-force":
    "Dragon Force mixes grand strategy, real-time army clashes, kingdom management, and character-driven campaigns. It is one of the Saturn's most important RPG-strategy releases in North America.",
  "saturn-dragon-force-ii-kamisarishi-daichi-ni":
    "Dragon Force II continues the large-scale strategy RPG formula with new factions, scenarios, and Japan-only collector interest. It is a major import target for Saturn strategy fans.",
  "saturn-shining-force-iii":
    "Shining Force III brings Sega's tactical RPG series to Saturn with grid battles, 3D presentation, relationship context, and a story designed to continue across multiple scenarios.",
  "saturn-shining-force-iii-scenario-2-nerewareta-miko":
    "Shining Force III Scenario 2 continues the Saturn tactical RPG trilogy from another perspective, adding party continuity and broader political context. Its Japan-only status makes it a notable import piece.",
  "saturn-shining-force-iii-scenario-3-hyouheki-no-jashinguu":
    "Shining Force III Scenario 3 completes the Saturn trilogy with the final campaign arc and high collector importance. Complete-condition imports are especially meaningful for series collectors.",
  "saturn-shining-the-holy-ark":
    "Shining the Holy Ark is a first-person dungeon RPG with party progression, fairy assists, and a darker fantasy tone. It is one of the Saturn's stronger traditional RPG releases.",
  "saturn-shining-wisdom":
    "Shining Wisdom shifts the Shining name into action-adventure territory with top-down exploration, dungeons, and item-based progression. It is useful for collectors tracking Sega's broader RPG experiments.",
  "saturn-burning-rangers":
    "Burning Rangers is a late Sonic Team action game about futuristic firefighters navigating burning structures, rescuing survivors, and using voice guidance. Its rarity and distinctive premise make it a Saturn standout.",
  "saturn-saturn-bomberman":
    "Saturn Bomberman is one of the platform's legendary multiplayer games, supporting large player counts, classic maze battles, and strong party play. It is a natural marketplace draw when multitap accessories are included.",
  "saturn-fighters-megamix":
    "Fighters Megamix crosses Virtua Fighter and Fighting Vipers characters in a fast 3D fighter packed with unlockables. It is one of Sega's most fan-service-heavy Saturn exclusives.",
  "saturn-fighting-vipers":
    "Fighting Vipers is Sega AM2's armor-breaking 3D fighter, built around enclosed arenas, impact-heavy attacks, and a flashier style than Virtua Fighter. It helped broaden the Saturn's fighting-game identity.",
  "saturn-last-bronx":
    "Last Bronx is a weapon-based 3D fighter set around Tokyo street gangs, with Sega arcade roots and a distinctive late-1990s style. It is a solid Saturn fighter for collectors beyond the usual headliners.",
  "saturn-die-hard-arcade":
    "Die Hard Arcade is a Sega beat-'em-up with quick combat, weapon pickups, and cinematic action scenes loosely tied to the film license. It is one of the Saturn's best arcade brawlers.",
  "saturn-clockwork-knight":
    "Clockwork Knight is a toy-themed side-scrolling platformer that shows the Saturn's early mix of pre-rendered visuals and traditional action design. It is a useful launch-era collector title.",
  "saturn-clockwork-knight-2":
    "Clockwork Knight 2 continues the toy-box platforming with more polished stage ideas and colorful presentation. It is a straightforward Saturn sequel that pairs naturally with the first game.",
  "saturn-astal":
    "Astal is a vivid 2D platformer with large sprites, hand-painted style, and companion-based abilities. It remains one of the Saturn's prettier early side-scrollers.",
  "saturn-bug":
    "Bug! is an early Saturn platformer built around isometric stage paths, cartoon animation, and mascot-era attitude. It represents Sega's initial push to give Saturn a character-driven platform presence.",
  "saturn-albert-odyssey-legend-of-eldean":
    "Albert Odyssey: Legend of Eldean is a Working Designs-localized RPG with traditional turn-based battles, bright fantasy presentation, and strong collector demand. Complete packaging is especially important.",
  "saturn-dark-savior":
    "Dark Savior is an isometric action RPG with branching parallel scenarios, real-time encounters, and unusual structure. It is one of the Saturn's more distinctive adventure releases.",
  "saturn-enemy-zero":
    "Enemy Zero is a Kenji Eno survival-horror game about invisible enemies, sound-based tracking, and tense limited-ammo encounters. Its multi-disc presentation and unusual design make it a notable Saturn cult title.",
  "saturn-d":
    "D is a cinematic horror adventure from Kenji Eno, built around pre-rendered exploration, time pressure, and surreal mystery. The Saturn version is part of the platform's important FMV-era horror library.",
  "saturn-resident-evil":
    "Resident Evil on Saturn brings Capcom's survival-horror landmark to Sega's console with mansion exploration, fixed-camera tension, and Saturn-specific extras. It is a key third-party release for horror collectors.",
  "saturn-tomb-raider":
    "Tomb Raider arrived on Saturn before becoming a PlayStation phenomenon, offering 3D exploration, puzzle ruins, and Lara Croft's early breakout adventure. Its platform history gives the Saturn version extra interest.",
  "saturn-grandia":
    "Grandia is a Game Arts RPG with adventurous pacing, expressive characters, and a battle system built around timing and interruption. Its Saturn release is central to the system's Japan-only RPG reputation.",
  "saturn-magic-knight-rayearth":
    "Magic Knight Rayearth is a late Saturn action RPG localized by Working Designs, blending anime source material, real-time combat, and colorful exploration. It is one of the final North American Saturn releases.",
  "saturn-street-fighter-alpha-warriors-dreams":
    "Street Fighter Alpha: Warriors' Dreams brings Capcom's younger, faster Street Fighter branch to Saturn with air blocking, Alpha Counters, and anime-influenced presentation.",
  "saturn-street-fighter-alpha-2":
    "Street Fighter Alpha 2 is one of the Saturn's strongest 2D fighters, with refined systems, a large roster, and excellent sprite work. It helped prove the machine's strength with arcade fighting games.",
  "saturn-x-men-vs-street-fighter":
    "X-Men vs. Street Fighter is a tag-team Capcom fighter that shines on Saturn with RAM cartridge support and arcade-faithful animation. Accessory requirements are important for accurate listings.",
  "saturn-marvel-super-heroes-vs-street-fighter":
    "Marvel Super Heroes vs. Street Fighter continues Capcom's crossover fighting run with tag mechanics, comic-book spectacle, and Saturn import appeal. RAM cartridge compatibility is a major collector note.",
  "saturn-vampire-savior-the-lord-of-vampire":
    "Vampire Savior: The Lord of Vampire is a fast, stylish Darkstalkers fighter with dense animation and strong Saturn import reputation. It is one of the platform's prized Capcom 2D releases.",
  "saturn-the-king-of-fighters-95":
    "The King of Fighters '95 brings SNK's team fighter to Saturn with its three-on-three structure and character crossover appeal. Cartridge support and regional packaging matter for collectors.",
  "saturn-metal-slug":
    "Metal Slug on Saturn delivers SNK's detailed run-and-gun arcade action with animation-heavy combat, vehicles, and explosive stage design. It is a high-interest import release.",
  "saturn-sonic-r":
    "Sonic R is a Sonic-themed racer with exploratory tracks, collectible paths, and a famously energetic soundtrack. It is one of the few Saturn-era Sonic-branded games with fully 3D action.",
  "saturn-sonic-jam":
    "Sonic Jam collects the Genesis Sonic games while adding a 3D Sonic World museum area. It is important because it preserves classic Sonic on Saturn while hinting at Sega's experiments with 3D Sonic presentation.",
  "saturn-the-house-of-the-dead":
    "The House of the Dead brings Sega's arcade horror light-gun shooter to Saturn with branching routes, quick target priority, and monster-movie pacing. Listings should clearly note light-gun setup and display compatibility.",
  "saturn-quake":
    "Quake on Saturn is a technically ambitious conversion of id Software's gothic 3D shooter, with unique handling by Lobotomy Software. It is a notable late Saturn shooter port.",
  "saturn-powerslave":
    "PowerSlave is a Lobotomy Software first-person shooter with Egyptian ruins, nonlinear exploration, and impressive Saturn 3D work. It is a strong collector title among Saturn action fans.",
  "saturn-duke-nukem-3d":
    "Duke Nukem 3D on Saturn adapts the PC shooter with Lobotomy's engine work, controller-focused play, and console-specific features. It is one of the platform's better-known FPS conversions.",
  "saturn-layer-section":
    "Layer Section, known as Galactic Attack in North America, is a Taito vertical shooter built around lock-on targeting across foreground and background layers. It is one of the Saturn's essential shmups.",
  "saturn-silhouette-mirage":
    "Silhouette Mirage is a Treasure action game built around color polarity, side-scrolling combat, and strange character design. The Saturn release is a prized import for fans of Treasure's experimental catalog.",
  "saturn-policenauts":
    "Policenauts is Hideo Kojima's cinematic sci-fi adventure about detectives, space colonies, and conspiracy. Its Saturn release is important for import collectors and visual-novel adventure fans.",
  "saturn-lunar-silver-star-story":
    "Lunar Silver Star Story updates Game Arts' RPG with animated cutscenes, revised story presentation, and classic turn-based adventure structure. It is a significant Saturn RPG import.",
  "saturn-lunar-2-eternal-blue":
    "Lunar 2: Eternal Blue continues the Lunar RPG line with animated storytelling, character-focused adventure, and strong Saturn-era presentation. It is a key import companion to Silver Star Story.",
  "saturn-bulk-slash":
    "Bulk Slash is a Japan-only 3D action game about transforming mecha, city combat, and mission-based objectives. Its reputation has grown among Saturn collectors looking beyond the obvious headliners.",
  "saturn-mr-bones":
    "Mr. Bones is an offbeat multimedia action game about a skeletal musician moving through varied stage types. Its strange structure and two-disc package make it one of the Saturn's more memorable oddities.",
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
if (!Array.isArray(games)) throw new Error("Run scripts/import-saturn-official-list.js first.");

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

console.log(`Seeded ${seeded} Sega Saturn editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
