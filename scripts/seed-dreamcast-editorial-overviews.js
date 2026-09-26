const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "dreamcast.json");
const manifestPath = path.join(rootDir, "data", "games", "dreamcast-manifest.json");

const seeds = {
  "dreamcast-sonic-adventure":
    "Sonic Adventure launched Sega's mascot into full 3D with fast character stages, hub exploration, Chaos raising, and multiple story paths. It is one of the Dreamcast's defining early showcases, especially for players tracking Sega's arcade-to-console transition.",
  "dreamcast-sonic-adventure-2":
    "Sonic Adventure 2 splits its campaign between hero and dark storylines, mixing speed stages, treasure hunting, mech shooting, and Chao raising. Its soundtrack, Shadow debut, and final Dreamcast-era Sonic status keep it central to Sega collecting.",
  "dreamcast-shenmue":
    "Shenmue is Yu Suzuki's ambitious life-simulation adventure, built around Yokosuka exploration, martial-arts mystery, voiced NPC schedules, arcade diversions, and cinematic pacing. It became one of the Dreamcast's signature prestige releases.",
  "dreamcast-shenmue-ii":
    "Shenmue II expands Ryo's search into Hong Kong and Kowloon with denser city spaces, faster pacing, more martial-arts encounters, and larger narrative momentum. Its regional release history makes it an important Dreamcast collector title.",
  "dreamcast-crazy-taxi":
    "Crazy Taxi turns arcade driving into a score-attack sprint through steep hills, traffic, shortcuts, and loud licensed music. The Dreamcast version became one of the system's most recognizable pick-up-and-play games.",
  "dreamcast-crazy-taxi-2":
    "Crazy Taxi 2 moves the series to a New York-inspired city, adds multiple passengers, and introduces the Crazy Hop for more vertical route planning. It keeps the original's arcade pressure while giving Dreamcast owners a console-focused sequel.",
  "dreamcast-jet-set-radio":
    "Jet Set Radio blends graffiti tagging, inline skating, police chases, and cel-shaded style into one of Sega's boldest original worlds. Its music, fashion, and visual language make it a Dreamcast identity piece.",
  "dreamcast-de-la-jet-set-radio":
    "De La Jet Set Radio is an expanded Japanese edition of Jet Set Radio with additional content and refinements. It is useful for collectors comparing regional variants of one of the Dreamcast's most stylish exclusives.",
  "dreamcast-skies-of-arcadia":
    "Skies of Arcadia is a bright airship RPG about exploration, sky pirates, ship battles, and discovering a world above the clouds. It is one of the Dreamcast's most beloved role-playing games and a major collector target.",
  "dreamcast-soulcalibur":
    "Soulcalibur arrived on Dreamcast as a landmark weapon fighter, widely praised for going beyond the arcade original with sharp visuals, fluid movement, and deep single-player content. It remains one of the system's essential showpieces.",
  "dreamcast-resident-evil-code-veronica":
    "Resident Evil - Code: Veronica advances the series with fully 3D environments, Claire and Chris Redfield storylines, and a larger gothic conspiracy. On Dreamcast it was treated as a major mainline survival-horror release.",
  "dreamcast-resident-evil-2":
    "Resident Evil 2 on Dreamcast brings Capcom's survival-horror sequel to Sega's hardware with cleaner presentation and the dual Leon and Claire scenario structure intact. It matters to collectors as part of the system's strong Capcom support.",
  "dreamcast-resident-evil-3-nemesis":
    "Resident Evil 3: Nemesis adds relentless pursuit pressure to Raccoon City survival horror, with Jill Valentine, live selections, ammo crafting, and the Nemesis threat. The Dreamcast version is a notable late-era Capcom release.",
  "dreamcast-marvel-vs-capcom-2-new-age-of-heroes":
    "Marvel vs. Capcom 2 is a fast three-on-three crossover fighter with a massive roster, assist-heavy team building, and chaotic arcade energy. The Dreamcast version is one of the most prized home versions for fighting-game fans.",
  "dreamcast-power-stone":
    "Power Stone is a 3D arena fighter built around weapons, hazards, transformation gems, and fast positional chaos. It captures Capcom's arcade experimentation and remains one of the Dreamcast's most distinctive party-fighting games.",
  "dreamcast-power-stone-2":
    "Power Stone 2 expands the arena fighter into four-player stages with moving environments, item crafting, and bigger set pieces. It is a high-demand Dreamcast title because of its multiplayer strength and Capcom pedigree.",
  "dreamcast-phantasy-star-online":
    "Phantasy Star Online brought Sega's RPG legacy online with cooperative dungeon runs, loot hunting, chat tools, and persistent character progress. It is historically important as one of console gaming's early online RPG milestones.",
  "dreamcast-phantasy-star-online-ver-2":
    "Phantasy Star Online Ver. 2 adds higher-level play, extra content, balance changes, and continued online support to Sega's console RPG experiment. It is the version many collectors seek when building a serious Dreamcast RPG shelf.",
  "dreamcast-seaman":
    "Seaman is an odd microphone-driven virtual pet and conversation game narrated by Leonard Nimoy in North America. Its accessory dependence and bizarre personality make complete copies especially important to verify.",
  "dreamcast-chuchu-rocket":
    "ChuChu Rocket! is a compact puzzle-action game about placing arrows to guide mice away from cats and into rockets. It became a Dreamcast staple because of its multiplayer chaos and early online play.",
  "dreamcast-space-channel-5":
    "Space Channel 5 is a rhythm game about matching commands, dancing through sci-fi broadcasts, and rescuing hostages as reporter Ulala. Its music-video style makes it one of the Dreamcast's most recognizable Sega originals.",
  "dreamcast-space-channel-5-part-2":
    "Space Channel 5: Part 2 expands Ulala's rhythm adventure with more elaborate performances, sharper presentation, and bigger set pieces. It is a standout follow-up for collectors tracking Sega's music-game output.",
  "dreamcast-the-house-of-the-dead-2":
    "The House of the Dead 2 brings Sega's arcade light-gun horror home with branching routes, quick enemy waves, and memorably strange voice acting. Complete light-gun setup details matter when trading or selling it.",
  "dreamcast-virtua-tennis":
    "Virtua Tennis turns Sega's arcade sports design into quick, readable rallies with strong animation and approachable depth. It became one of the Dreamcast's best examples of arcade-perfect sports fun.",
  "dreamcast-virtua-tennis-2":
    "Virtua Tennis 2 adds women players, improved doubles, and deeper tour structure while preserving the original's crisp rally flow. It is a polished sports sequel with long-term Dreamcast appeal.",
  "dreamcast-metropolis-street-racer":
    "Metropolis Street Racer is a city racing game built around real-world locations, day-night timing, licensed music, and Kudos-style driving rewards. Its ideas later fed directly into the Project Gotham Racing lineage.",
  "dreamcast-ikaruga":
    "Ikaruga is Treasure's polarity-based vertical shooter, asking players to switch colors to absorb bullets and chain enemies. The Dreamcast release is a serious collector piece and a precision shooter benchmark.",
  "dreamcast-grandia-ii":
    "Grandia II is a character-driven RPG with a flexible battle system built around timing, interrupts, and positioning. It gave the Dreamcast one of its strongest traditional role-playing adventures.",
  "dreamcast-samba-de-amigo":
    "Samba de Amigo turns rhythm play into maraca shaking, pose matching, and bright Sega arcade spectacle. Because the controller bundle defines the experience, accessory completeness matters heavily for marketplace listings.",
  "dreamcast-samba-de-amigo-ver-2000":
    "Samba de Amigo Ver. 2000 adds more songs, modes, and refinements to Sega's maraca rhythm game. It is especially relevant for collectors comparing Japanese Dreamcast rhythm releases.",
  "dreamcast-the-typing-of-the-dead":
    "The Typing of the Dead transforms House of the Dead 2 into a keyboard typing shooter, replacing light-gun shots with words and phrases. It is one of the Dreamcast's strangest and most beloved experiment games.",
  "dreamcast-rez":
    "Rez combines rail shooting, electronic music, lock-on rhythm, and abstract visual design into a hypnotic sensory action game. Its late Dreamcast release and lasting reputation make it a standout collector title.",
  "dreamcast-daytona-usa-2001":
    "Daytona USA 2001 revisits Sega's arcade stock-car racer with updated visuals, new tracks, and home-console structure. It is a key Dreamcast title for players following Sega's racing arcade heritage.",
  "dreamcast-dead-or-alive-2":
    "Dead or Alive 2 is a fast 3D fighter with counters, multi-tier stages, tag play, and smooth character animation. The Dreamcast version helped show the console's strength with arcade fighting games.",
  "dreamcast-capcom-vs-snk-millennium-fight-2000":
    "Capcom vs. SNK: Millennium Fight 2000 stages Capcom and SNK characters against each other with groove-based systems and arcade fighting polish. Its Dreamcast release is a major crossover fighter entry.",
  "dreamcast-capcom-vs-snk-2-millionaire-fighting-2001":
    "Capcom vs. SNK 2 greatly expands the crossover with more characters, six grooves, and a flexible ratio system. It is one of the Dreamcast's deepest fighting games and a high-interest import title.",
  "dreamcast-ready-2-rumble-boxing":
    "Ready 2 Rumble Boxing is an arcade boxing game built around exaggerated fighters, taunts, combo momentum, and immediate couch-play appeal. It was one of the Dreamcast's most visible launch-window sports games.",
  "dreamcast-toy-commander":
    "Toy Commander turns a house into a battlefield for miniature vehicles, planes, tanks, and toys. Its mission variety and playful scale make it one of the Dreamcast's more inventive original releases.",
  "dreamcast-ecco-the-dolphin-defender-of-the-future":
    "Ecco the Dolphin: Defender of the Future reimagines Sega's underwater adventure in 3D, emphasizing exploration, sonar, alien mystery, and difficult navigation. It is a visually striking Dreamcast continuation of a cult Sega series.",
  "dreamcast-maken-x":
    "Maken X is a first-person Atlus action game about psychic sword combat, body-hopping, and branching story choices. Its style and publisher history make it a notable Dreamcast oddity.",
  "dreamcast-legacy-of-kain-soul-reaver":
    "Legacy of Kain: Soul Reaver brings Raziel's gothic action-adventure to Dreamcast with improved presentation and spectral-realm puzzle design. It is a strong third-party entry for action-adventure collectors.",
  "dreamcast-cannon-spike":
    "Cannon Spike is a Capcom arena shooter featuring characters from multiple Capcom series, fast lock-on action, and short arcade stages. Its scarcity and crossover roster make it a major Dreamcast collector target.",
  "dreamcast-illbleed":
    "Illbleed is a bizarre horror game about surviving theme-park attractions by detecting traps, managing senses, and enduring absurd gore comedy. Its unusual design gives it major cult collector value.",
  "dreamcast-d2":
    "D2 is Kenji Eno's cinematic survival adventure set in a snowy wilderness, blending exploration, real-time combat, FMV storytelling, and psychological horror. It is one of the Dreamcast's stranger auteur releases.",
  "dreamcast-record-of-lodoss-war-advent-of-cardice":
    "Record of Lodoss War: Advent of Cardice is an action RPG with loot, dungeon crawling, and character building tied to the fantasy anime license. It is one of the Dreamcast's stronger RPG-adjacent collector titles.",
  "dreamcast-bangai-o":
    "Bangai-O is Treasure's explosive multidirectional shooter about tiny spaces, missile storms, and puzzle-like stage layouts. Its Dreamcast version is prized for its arcade energy and cult pedigree.",
  "dreamcast-giga-wing":
    "Giga Wing is a vertical shooter built around reflect-force mechanics, huge score values, and dense bullet patterns. It is one of the Dreamcast's important arcade shooter releases.",
  "dreamcast-giga-wing-2":
    "Giga Wing 2 expands the shooter with 3D backgrounds, four-player support, and more screen-filling scoring chaos. It is a notable Dreamcast entry for fans building a shmup-focused library.",
  "dreamcast-hydro-thunder":
    "Hydro Thunder brings Midway's arcade boat racing home with boost management, hidden shortcuts, dramatic water physics, and loud track design. It is a strong fit for Dreamcast arcade-racing collectors.",
  "dreamcast-tokyo-xtreme-racer":
    "Tokyo Xtreme Racer focuses on highway duels, tuning, and rival battles across nighttime expressways. It helped establish the Dreamcast as a home for stylish street-racing games.",
  "dreamcast-tokyo-xtreme-racer-2":
    "Tokyo Xtreme Racer 2 expands the highway-racing formula with more rivals, deeper car progression, and a larger road network. It is one of the system's key tuning and import-racing titles.",
  "dreamcast-rayman-2-the-great-escape":
    "Rayman 2: The Great Escape is a polished 3D platform adventure with strong level pacing, expressive animation, and atmospheric fantasy worlds. The Dreamcast version is often considered one of its best console releases.",
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
if (!Array.isArray(games)) throw new Error("Run scripts/import-dreamcast-official-list.js first.");

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

console.log(`Seeded ${seeded} Dreamcast editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
