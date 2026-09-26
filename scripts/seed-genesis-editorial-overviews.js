const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "genesis.json");
const manifestPath = path.join(rootDir, "data", "games", "genesis-manifest.json");

const seeds = {
  "genesis-sonic-the-hedgehog":
    "Sonic the Hedgehog gave the Genesis its defining mascot, built around speed, loop-heavy stages, rings, and bold Sega attitude. Green Hill Zone became one of the clearest statements of what the 16-bit console could do.",
  "genesis-sonic-the-hedgehog-2":
    "Sonic the Hedgehog 2 sharpens the original with Tails, the spin dash, faster stage flow, and one of the Genesis library's most recognizable soundtracks. It is a cornerstone release for both players and collectors.",
  "genesis-sonic-the-hedgehog-3":
    "Sonic the Hedgehog 3 adds larger zones, save support, elemental shields, more story presentation, and Knuckles as a rival. It forms one half of Sega's most ambitious 16-bit Sonic project.",
  "genesis-sonic-and-knuckles":
    "Sonic & Knuckles is famous for its lock-on cartridge, letting players connect earlier Sonic games while also delivering Knuckles-focused routes, tougher stages, and the second half of Sonic 3's expanded adventure.",
  "genesis-streets-of-rage":
    "Streets of Rage is Sega's signature urban beat-'em-up, pairing cooperative brawling with Yuzo Koshiro's club-influenced soundtrack. It helped give the Genesis a tougher arcade identity.",
  "genesis-streets-of-rage-2":
    "Streets of Rage 2 expands the first game's brawling with bigger sprites, four distinct fighters, smoother combat, and one of the most celebrated soundtracks on the system. It remains a Genesis essential.",
  "genesis-streets-of-rage-3":
    "Streets of Rage 3 pushes the series with faster movement, branching routes, hidden characters, and more complex enemy patterns. Its difficulty and regional differences make it especially important for collectors to identify correctly.",
  "genesis-phantasy-star-ii":
    "Phantasy Star II is an early Genesis RPG known for its science-fantasy world, maze-like dungeons, difficult battles, and unusually dramatic story beats. It showed the console could support large, serious role-playing games.",
  "genesis-phantasy-star-iv-the-end-of-the-millennium":
    "Phantasy Star IV closes Sega's classic RPG saga with comic-panel cutscenes, fast battles, combination attacks, and a confident blend of sci-fi and fantasy. It is one of the Genesis library's premier RPGs.",
  "genesis-shining-force":
    "Shining Force mixes tactical grid battles with explorable towns, recruitable characters, and approachable fantasy RPG pacing. It became one of the Genesis library's clearest answers to strategy RPG fans.",
  "genesis-shining-force-ii":
    "Shining Force II expands the tactical RPG formula with a larger quest, more flexible progression, secret characters, and stronger scenario design. It is a major collector title among Genesis RPGs.",
  "genesis-gunstar-heroes":
    "Gunstar Heroes is Treasure's explosive run-and-gun debut, built around weapon mixing, huge bosses, co-op action, and constant technical showmanship. It is one of the Genesis games most often cited as a pure action showcase.",
  "genesis-herzog-zwei":
    "Herzog Zwei blends shooter control with real-time strategy, asking players to deploy units, capture bases, and fight directly from a transforming aircraft. Its influence makes it one of the system's most historically important oddities.",
  "genesis-ecco-the-dolphin":
    "Ecco the Dolphin turns ocean exploration into a strange, atmospheric adventure about sonar, currents, puzzles, and alien mystery. Its beauty and difficulty make it one of Sega's most distinctive 16-bit games.",
  "genesis-ecco-the-tides-of-time":
    "Ecco: The Tides of Time builds on the original with more surreal environments, time travel, transformation sequences, and ambitious level ideas. It is a memorable follow-up for collectors who like Sega's weirder side.",
  "genesis-castlevania-bloodlines":
    "Castlevania: Bloodlines brings Konami's gothic action to Genesis with two playable heroes, weapon-specific routes, and a globe-trotting Dracula story. It is one of the most sought-after licensed Genesis action games.",
  "genesis-contra-hard-corps":
    "Contra: Hard Corps turns the series into a high-speed Genesis spectacle with multiple characters, branching paths, huge bosses, and relentless difficulty. It is a major action collector piece on the platform.",
  "genesis-musha":
    "MUSHA is a vertical shooter from Compile known for fast scrolling, metallic Japanese fantasy style, strong weapon systems, and high collector demand. Authentic copies are especially worth careful verification.",
  "genesis-thunder-force-iii":
    "Thunder Force III gives the Genesis a fast, confident horizontal shooter with selectable stages, layered parallax, and a strong weapon lineup. It helped establish the console's reputation for shoot-'em-ups.",
  "genesis-thunder-force-iv":
    "Thunder Force IV, released as Lightening Force in North America, pushes the Genesis hard with dense parallax, aggressive bosses, heavy music, and demanding shooter design. It is a showpiece for the system.",
  "genesis-ristar":
    "Ristar is a late Genesis platformer built around stretching arms, grabbing enemies, and swinging through bright, expressive stages. Its polish and relative rarity make it a favorite among Sega collectors.",
  "genesis-beyond-oasis":
    "Beyond Oasis is an action RPG with fluid combat, elemental spirits, puzzle dungeons, and colorful presentation. It stands out as one of the Genesis library's strongest Zelda-like adventures.",
  "genesis-aladdin":
    "Aladdin is a Disney platformer remembered for expressive animation, swordplay, apple throwing, and stage designs based on the film. It became one of the Genesis system's mainstream hits.",
  "genesis-earthworm-jim":
    "Earthworm Jim mixes run-and-gun platforming with surreal comedy, unusual stage gimmicks, and fluid character animation. It became one of the clearest examples of the Genesis era's oddball mascot boom.",
  "genesis-earthworm-jim-2":
    "Earthworm Jim 2 leans harder into variety with bizarre minigame-like stages, stranger objectives, and more animated absurdity. It is a notable sequel for collectors who want the full Shiny Entertainment run.",
  "genesis-toejam-and-earl":
    "ToeJam & Earl is a slow-burn roguelike comedy adventure about exploring random floating islands, collecting ship pieces, and avoiding strange Earthlings. Its two-player personality makes it a cult Genesis classic.",
  "genesis-vectorman":
    "Vectorman is a late Genesis action-platformer using pre-rendered character animation, weapon pickups, and environmental set pieces. It was Sega's technical flex near the end of the console's retail life.",
  "genesis-road-rash-ii":
    "Road Rash II combines motorcycle racing with brawling, traffic dodging, and split-screen play. Its speed, crashes, and attitude made it one of the Genesis library's defining sports-action hybrids.",
  "genesis-golden-axe":
    "Golden Axe brings Sega's arcade fantasy beat-'em-up home with Ax Battler, Tyris Flare, Gilius Thunderhead, magic attacks, mounts, and co-op combat. It is one of the console's foundational arcade conversions.",
  "genesis-shinobi-iii-return-of-the-ninja-master":
    "Shinobi III: Return of the Ninja Master refines Sega's ninja action with wall jumps, horse and surfboard stages, sharp boss fights, and fast animation. It is one of the system's best pure action games.",
  "genesis-the-revenge-of-shinobi":
    "The Revenge of Shinobi helped define early Genesis action with cinematic ninja pacing, magic attacks, Joe Musashi's moveset, and a moody Yuzo Koshiro score. Its revisions are important to collectors.",
  "genesis-landstalker-the-treasures-of-king-nole":
    "Landstalker is an isometric action RPG about treasure hunting, platforming, and puzzle-heavy dungeons. Its perspective can be demanding, but its adventure structure gives the Genesis a distinct RPG identity.",
  "genesis-rocket-knight-adventures":
    "Rocket Knight Adventures stars Sparkster in a fast Konami action-platformer built around jetpack charges, sword attacks, and inventive stage set pieces. It is one of the Genesis library's strongest mascot-era originals.",
  "genesis-comix-zone":
    "Comix Zone sends its hero through comic-book panels, using hand-drawn presentation, beat-'em-up combat, and page-turning stage structure. Its style and late release make it a standout Genesis collectible.",
  "genesis-nhl-94":
    "NHL '94 is one of the most beloved 16-bit sports games, remembered for quick pace, one-timers, season-era rosters, and instantly readable hockey action. It remains a high-demand Genesis sports title.",
  "genesis-mortal-kombat":
    "Mortal Kombat on Genesis became famous for bringing the arcade fighter home with a blood code, digitized characters, and controversial finishing moves. Its cultural footprint is larger than its technical compromises.",
  "genesis-street-fighter-ii-special-champion-edition":
    "Street Fighter II': Special Champion Edition gave Genesis owners a major version of Capcom's landmark fighting game, with playable bosses, speed options, and six-button controller support for serious play.",
  "genesis-strider":
    "Strider is an important Genesis arcade conversion, delivering Hiryu's acrobatic sword action, Cold War sci-fi style, and large set pieces. It helped show the system could handle premium arcade action at home.",
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
if (!Array.isArray(games)) throw new Error("Run scripts/import-genesis-official-list.js first.");

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

console.log(`Seeded ${seeded} Genesis editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
