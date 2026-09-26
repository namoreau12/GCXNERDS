const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const snesPath = path.join(rootDir, "data", "games", "snes.json");
const manifestPath = path.join(rootDir, "data", "games", "snes-manifest.json");

const overviewsById = {
  "snes-super-mario-world":
    "Mario and Luigi travel through Dinosaur Land to rescue Princess Peach from Bowser, with Yoshi making his series debut as a ridable companion. Super Mario World is a polished side-scrolling platformer built around secret exits, branching map routes, cape-powered movement, and tight level design that made it a defining SNES launch-era game.",
  "snes-super-mario-world-2-yoshi-s-island":
    "Yoshi's Island shifts the focus from Mario to Yoshi, who carries Baby Mario through hand-drawn platform stages filled with transformations, collectibles, and playful hazards. Its crayon-like art style, inventive boss fights, and egg-throwing mechanics give it a very different identity from the main Mario platformers.",
  "snes-the-legend-of-zelda-a-link-to-the-past":
    "A Link to the Past sends Link across the Light World and Dark World in a top-down adventure built around dungeons, hidden items, puzzle solving, and exploration. It established many Zelda staples, including parallel worlds, major equipment progression, and a dense overworld full of secrets.",
  "snes-super-metroid":
    "Super Metroid follows Samus Aran back to planet Zebes in a moody side-scrolling action-adventure built around exploration, upgrades, and environmental storytelling. Its interconnected map, hidden routes, and gradual ability progression helped define the Metroidvania structure.",
  "snes-chrono-trigger":
    "Chrono Trigger is a time-travel RPG about Crono and his allies trying to prevent a future catastrophe. It is known for fast-paced Active Time Battle combat, visible enemy encounters, multiple eras to explore, memorable party members, and multiple endings shaped by player progress.",
  "snes-earthbound":
    "EarthBound is a modern-day RPG starring Ness and a group of kids on a strange, funny, and often surreal journey to stop an alien threat. Its contemporary setting, offbeat writing, rolling HP meter, and cult reputation make it one of the SNES library's most distinctive and collectible RPGs.",
  "snes-final-fantasy-vi":
    "Final Fantasy VI is a large ensemble RPG about rebellion, magic, and a world pushed toward ruin by the Empire and Kefka. It blends cinematic storytelling, character-specific abilities, Active Time Battle combat, and one of the most celebrated soundtracks of the 16-bit era.",
  "snes-secret-of-mana":
    "Secret of Mana is an action RPG with real-time combat, ring menus, magic, and cooperative multiplayer for up to three players with the proper adapter. Its colorful world, memorable music, and blend of adventure and action made it one of Square's signature SNES releases.",
  "snes-super-mario-rpg-legend-of-the-seven-stars":
    "Super Mario RPG blends Mario characters and humor with Square-style role-playing systems. Players guide Mario and allies through turn-based battles with timed hits, isometric exploration, and a story that introduced fan-favorite characters like Geno and Mallow.",
  "snes-donkey-kong-country":
    "Donkey Kong Country is a side-scrolling platformer built around Donkey Kong and Diddy Kong recovering their stolen banana hoard from King K. Rool. Its pre-rendered visual style, animal buddies, hidden bonus rooms, and momentum-heavy platforming helped make it a major late-generation SNES showcase.",
  "snes-donkey-kong-country-2-diddy-s-kong-quest":
    "Diddy's Kong Quest puts Diddy and Dixie Kong in the lead as they explore pirate-themed worlds to rescue Donkey Kong. It expands the first game's platforming with stronger level variety, Dixie’s hover ability, more secrets, and a moodier soundtrack.",
  "snes-donkey-kong-country-3-dixie-kong-s-double-trouble":
    "Dixie Kong's Double Trouble follows Dixie and Kiddy Kong through the Northern Kremisphere in a platforming adventure with overworld exploration, vehicle travel, animal buddies, and collectible-driven secrets. It is the final main Donkey Kong Country entry on SNES.",
  "snes-super-mario-kart":
    "Super Mario Kart turns the Mario cast into kart racers across flat Mode 7 tracks filled with items, hazards, and tight cornering. It established the core formula for the Mario Kart series, including Grand Prix cups, battle mode, character handling differences, and item-based racing.",
  "snes-street-fighter-ii-the-world-warrior":
    "Street Fighter II brought Capcom's arcade fighting phenomenon to SNES with a roster of world warriors, special moves, and one-on-one competitive play. Its home release helped make fighting games a major console genre and remains a cornerstone title for collectors.",
  "snes-street-fighter-ii-turbo-hyper-fighting":
    "Street Fighter II Turbo builds on The World Warrior with faster game speed, playable boss characters, balance changes, and additional move options. For SNES players, it became one of the strongest home versions of Capcom's landmark competitive fighter.",
  "snes-super-street-fighter-ii-the-new-challengers":
    "Super Street Fighter II adds new fighters, stages, move updates, and presentation upgrades to Capcom's SNES fighting lineup. It is valued as a later, expanded version of Street Fighter II with more matchups and a broader roster.",
  "snes-mega-man-x":
    "Mega Man X reimagines Capcom's run-and-gun platforming for the SNES with faster movement, wall-jumping, armor upgrades, and a darker future setting. Its Mavericks, upgrade routes, and precise action made it one of the system's essential action games.",
  "snes-mega-man-x2":
    "Mega Man X2 continues X's fight against the Mavericks with new bosses, armor upgrades, ride armor sections, and optional X-Hunter encounters. It keeps the first game's fast action while adding more hidden objectives for completion-minded players.",
  "snes-mega-man-x3":
    "Mega Man X3 expands the series with more upgrades, hidden armor systems, and limited playable Zero segments. Its late-SNES release and higher collector demand make it one of the more notable Mega Man cartridges on the platform.",
  "snes-super-castlevania-iv":
    "Super Castlevania IV retells Simon Belmont's battle against Dracula with atmospheric stages, flexible whip control, and SNES visual effects. Its soundtrack, gothic presentation, and smoother movement make it one of the most approachable classic Castlevania entries.",
  "snes-contra-iii-the-alien-wars":
    "Contra III is a high-intensity run-and-gun action game where commandos fight an alien invasion across side-scrolling and overhead stages. It is known for aggressive pacing, large bosses, weapon swapping, and two-player co-op.",
  "snes-f-zero":
    "F-Zero is a futuristic racing game built around high-speed hovercraft, sharp track design, and Mode 7 scaling. It introduced Captain Falcon's universe and gave the SNES one of its earliest showcases for speed and pseudo-3D presentation.",
  "snes-star-fox":
    "Star Fox is a rail shooter starring Fox McCloud and the Star Fox team in polygonal space combat powered by the Super FX chip. Its 3D presentation, branching route structure, and radio chatter made it one of the SNES library's technical landmarks.",
  "snes-kirby-super-star":
    "Kirby Super Star is a collection of Kirby adventures and modes that mix platforming, copy abilities, boss rushes, treasure hunting, and cooperative play. Its variety and replay value make it one of Kirby's standout SNES releases.",
  "snes-super-mario-all-stars":
    "Super Mario All-Stars remakes the NES Super Mario Bros. games with updated SNES graphics, music, save features, and presentation. It is an important compilation for players who want the early Mario platformers in one cartridge.",
  "snes-super-mario-all-stars-super-mario-world":
    "Super Mario All-Stars + Super Mario World combines the updated NES Mario collection with Super Mario World on one cartridge. It is a practical and collectible SNES release because it gathers several core Mario platformers in a single package.",
  "snes-actraiser":
    "ActRaiser mixes side-scrolling action stages with town-building simulation. Players guide a divine warrior through monster-filled areas, then help rebuild settlements, making it one of the SNES library's more unusual genre hybrids.",
  "snes-illusion-of-gaia":
    "Illusion of Gaia is an action RPG about a young hero traveling through ruins and historical landmarks while uncovering a larger supernatural mystery. It emphasizes real-time combat, puzzle-like dungeons, and a more story-driven adventure structure.",
  "snes-terranigma":
    "Terranigma is an action RPG about restoring continents, life, and civilization to a ruined world. Its real-time combat, world-building structure, and limited regional availability have made it one of the SNES/Super Famicom era's most discussed collector targets.",
  "snes-teenage-mutant-ninja-turtles-iv-turtles-in-time":
    "Teenage Mutant Ninja Turtles: Turtles in Time is a side-scrolling beat 'em up that sends the turtles through time-themed stages against Foot Clan enemies and classic bosses. The SNES version is a beloved co-op action game with colorful presentation and strong arcade roots.",
  "snes-harvest-moon":
    "Harvest Moon is a farming and life-sim game about restoring a neglected farm while balancing crops, animals, relationships, and the rhythm of the seasons. Its slower pace and long-term routine made it stand apart from the action-heavy SNES library.",
  "snes-ogre-battle-the-march-of-the-black-queen":
    "Ogre Battle: The March of the Black Queen is a tactical RPG that mixes squad management, branching story paths, and real-time strategy-style movement across large maps. Its alignment system, hidden characters, and multiple endings give it strong replay and collector appeal.",
  "snes-zombies-ate-my-neighbors":
    "Zombies Ate My Neighbors is a top-down action game where players rescue neighbors from horror-movie monsters using improvised weapons and power-ups. Its co-op play, campy tone, and maze-like stages have made it a cult favorite on SNES.",
  "snes-nba-jam":
    "NBA Jam turns basketball into a fast, exaggerated two-on-two arcade game with huge dunks, secret players, and catchphrases. The SNES version brought the arcade hit home and remains one of the system's most recognizable sports games.",
  "snes-nba-jam-tournament-edition":
    "NBA Jam Tournament Edition expands the original arcade basketball formula with more players, updated rosters, hidden characters, and tournament-style options. It is the preferred SNES Jam release for many collectors who want the fuller version.",
  "snes-mortal-kombat-ii":
    "Mortal Kombat II is a one-on-one fighting game known for digitized characters, special moves, fatalities, and a darker tournament setting. The SNES version was a major home release because it retained the series' violent identity more fully than the first SNES Mortal Kombat.",
  "snes-super-ghouls-n-ghosts":
    "Super Ghouls 'n Ghosts is a tough side-scrolling action game starring Arthur on a monster-filled rescue mission. It is known for demanding jumps, armor upgrades, double-jump movement, and the high difficulty associated with Capcom's Ghosts 'n Goblins series.",
  "snes-pilotwings":
    "Pilotwings is a flight-based skill game that asks players to master light plane, skydiving, rocket belt, and hang glider challenges. Its Mode 7 presentation made it an early SNES showcase and a distinctive first-party launch-window title.",
  "snes-simcity":
    "SimCity on SNES adapts the city-building simulation for console play, with players zoning land, managing budgets, responding to disasters, and growing a city over time. Nintendo's version adds a friendlier interface and presentation built around Dr. Wright.",
  "snes-tetris-attack":
    "Tetris Attack is a fast puzzle game built around swapping blocks to create horizontal or vertical matches while chains and combos pressure the opponent. Despite the Tetris name, it plays as Panel de Pon and became one of the SNES library's best competitive puzzlers.",
  "snes-lufia-ii-rise-of-the-sinistrals":
    "Lufia II: Rise of the Sinistrals is a turn-based RPG with puzzle-heavy dungeons, a prequel story, and a party-driven adventure against the Sinistrals. Its dungeon design and optional Ancient Cave mode have helped it earn a lasting reputation among SNES RPG fans.",
  "snes-breath-of-fire":
    "Breath of Fire is a traditional turn-based RPG from Capcom about Ryu, a dragon-blooded hero, and a party of allies confronting an empire. It combines overworld exploration, character-specific field abilities, and classic 16-bit fantasy progression.",
  "snes-breath-of-fire-ii":
    "Breath of Fire II continues Capcom's fantasy RPG series with a larger story, town-building systems, party transformations, and dragon powers. It is remembered for its ambitious structure and as one of the SNES library's notable role-playing sequels.",
  "snes-gradius-iii":
    "Gradius III is a horizontal shoot 'em up where players pilot the Vic Viper through enemy waves, hazards, and boss encounters. Its selectable weapon loadouts and demanding difficulty make it a key SNES entry for shooter collectors.",
  "snes-axelay":
    "Axelay is a Konami shoot 'em up that alternates between vertical and horizontal stages with layered visuals, heavy weapon variety, and cinematic boss fights. It is often singled out for its presentation and technical showmanship on SNES.",
  "snes-r-type-iii-the-third-lightning":
    "R-Type III: The Third Lightning is a side-scrolling shooter built around careful positioning, charge shots, and the Force pod system. Its SNES-exclusive design and challenge make it a standout for fans of methodical shoot 'em ups.",
  "snes-super-punch-out":
    "Super Punch-Out!! is an arcade-style boxing game focused on timing, pattern recognition, dodging, and counterpunching colorful opponents. Its quick matches and sharp animation make it one of the SNES library's most replayable sports-action games.",
  "snes-killer-instinct":
    "Killer Instinct is a combo-heavy fighting game with flashy characters, long attack strings, and a distinctive arcade style. The SNES version became a major collector title partly because of its black cartridge and strong home conversion reputation.",
  "snes-uniracers":
    "Uniracers is a fast side-scrolling racing game where riderless unicycles perform tricks for speed boosts across looping tracks. Its unusual premise, high speed, and competitive focus make it one of the SNES library's stranger cult favorites.",
  "snes-demon-s-crest":
    "Demon's Crest stars Firebrand in a dark action-platform adventure built around forms, powers, exploration, and boss battles. Its gothic atmosphere and late-generation Capcom polish make it a premium SNES collector target.",
  "snes-kirby-s-dream-course":
    "Kirby's Dream Course mixes Kirby with miniature golf, asking players to launch Kirby through isometric courses, defeat enemies, and sink into the goal. It is a creative spin-off that turns copy abilities and course routing into a puzzle-sports format.",
  "snes-super-bomberman":
    "Super Bomberman brings Hudson's maze-bombing multiplayer action to SNES, with players placing bombs, collecting power-ups, and trapping rivals. Its battle mode helped make it a party staple when played with a multitap.",
  "snes-secret-of-evermore":
    "Secret of Evermore is an action RPG about a boy and his dog traveling through strange worlds inspired by pulp adventure, prehistoric fantasy, and science fiction. It uses real-time combat, alchemy-based magic, and a tone that differs from Square's Japanese-developed SNES RPGs.",
  "snes-mario-paint":
    "Mario Paint is a creative software title bundled around the SNES Mouse, giving players tools for drawing, animation, music-making, and minigames. It is less a traditional game than an early console creativity suite with strong nostalgia value.",
  "snes-actraiser-2":
    "ActRaiser 2 focuses on side-scrolling action, replacing the first game's town-building layer with larger combat stages and more elaborate movement. It is known for its darker tone, winged protagonist, and higher difficulty.",
  "snes-soul-blazer":
    "Soul Blazer is an action RPG where players defeat monsters to restore towns, people, and parts of the world. Its structure blends dungeon combat with gradual reconstruction, making it an important early entry in Quintet's loose SNES action-RPG trilogy.",
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
  const games = readJson(snesPath);
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

  writeJson(snesPath, games);
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

  console.log(`Seeded ${updated} SNES editorial overviews.`);
}

main();
