const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-heavenly-hyper-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-heavenly-bodies",
    overview:
      "Heavenly Bodies is a physics-driven space simulation about performing delicate tasks in zero gravity with deliberately awkward astronaut controls. Players move individual limbs, grab surfaces, operate equipment, and wrestle with momentum while trying to complete repairs and experiments. Its charm comes from the struggle: simple actions become funny, tense, and surprisingly satisfying because the body itself is the puzzle.",
  },
  {
    id: "ps4-hellfront-honeymoon",
    overview:
      "Hellfront: Honeymoon is a fast twin-stick action game that mixes shooting with tiny real-time strategy skirmishes on compact maps. Players capture buildings, spawn units, and fight directly while matches turn into quick territory battles. It works best as a local multiplayer or arcade-session game, where the fun comes from sudden reversals, simple controls, and a constant tug-of-war over the map.",
  },
  {
    id: "ps4-hellmut-the-badass-from-hell",
    overview:
      "Hellmut: The Badass from Hell is a chaotic roguelike shooter where players transform into different mutant forms, each with distinct weapons and attack rhythms. Runs are built around clearing rooms, collecting upgrades, and surviving fast enemy swarms with whatever form the game gives you. It is loud, gory, and run-based, aimed at players who enjoy arcade shooting with constant mutation and quick restarts.",
  },
  {
    id: "ps4-here-they-lie",
    overview:
      "Here They Lie is a first-person psychological horror game from Sony and Tangentlemen, built around surreal city spaces, masked figures, and a dreamlike descent through fear and obsession. Players explore unsettling environments more than they fight, with the experience leaning into mood, disorientation, and disturbing imagery. It is a horror title for players who want atmosphere and interpretation rather than weapon-heavy survival mechanics.",
  },
  {
    id: "ps4-hero-defense",
    overview:
      "Hero Defense is a tower-defense strategy game where vampire-hunting heroes act as movable defensive units instead of static towers. Players position characters, upgrade skills, manage lanes, and respond to waves of monsters across gothic maps. The hook is party management inside a tower-defense frame: success depends on placing the right hero in the right spot and improving the group between battles.",
  },
  {
    id: "ps4-heroes-of-hammerwatch-ultimate-edition",
    overview:
      "Heroes of Hammerwatch: Ultimate Edition is a top-down roguelite action RPG about repeatedly delving into dungeons, gathering gold and ore, and upgrading a town that strengthens future runs. Players pick classes, fight hordes, collect loot, and gradually build long-term power outside the dungeon. It is especially good for players who like co-op-friendly run structure with persistent progression and old-school dungeon-crawling energy.",
  },
  {
    id: "ps4-heroland",
    overview:
      "Heroland is a quirky RPG set in a theme park where guests pay to become fantasy heroes, while the player works as a guide helping them survive staged adventures. Battles play out with indirect party support, comedic writing, and a colorful cast from creators associated with cult Japanese RPGs. It is a strange, charming game for players who enjoy satire, character banter, and RPG systems that do not follow the usual hero fantasy.",
  },
  {
    id: "ps4-heyawake",
    overview:
      "Heyawake is a digital logic puzzle from Hamster based on the Japanese room-partition puzzle of the same name. Players shade cells according to numbered-room constraints while making sure the board follows strict connectivity and adjacency rules. It is a pure deduction game: no story, no action, just clean puzzle grids for players who like careful reasoning and compact brain-teasers.",
  },
  {
    id: "ps4-hidden-through-time",
    overview:
      "Hidden Through Time is a hidden-object puzzle game built around playful, hand-drawn historical scenes full of tiny characters, animals, buildings, and jokes. Players use clues to find specific objects across Stone Age, Egyptian, medieval, and western-themed maps, with a level editor extending the search beyond the campaign. It is calm, charming, and ideal for players who like scanning busy illustrations at their own pace.",
  },
  {
    id: "ps4-hide-and-dance",
    overview:
      "Hide & Dance! is a small rhythm-comedy game from hap inc. about dancing when nobody is looking and stopping before being caught. Players follow timing prompts and react to the joke-like setup as the scene changes around them. It is less a traditional music game and more a quirky timing gag, suited to players who enjoy short, oddball Japanese indie releases with simple inputs and silly presentation.",
  },
  {
    id: "ps4-holy-potatoes-a-weapon-shop",
    overview:
      "Holy Potatoes! A Weapon Shop?! is a comedic management sim about running a blacksmith shop staffed by potato people. Players craft weapons, hire and train smiths, manage materials, sell gear to adventurers, and expand the business across a parody fantasy world. The appeal is light resource management with constant jokes, making it a good fit for players who want a playful shop sim rather than a serious economic sandbox.",
  },
  {
    id: "ps4-holy-potatoes-we-re-in-space",
    overview:
      "Holy Potatoes! We're in Space?! moves the series into sci-fi exploration, combining ship management, crew upgrades, and turn-based space combat with the franchise's potato-heavy humor. Players travel between planets, craft weapons, recruit crew, and fight enemy ships while chasing a story across the galaxy. It is a light strategy adventure for players who like resource decisions, silly writing, and manageable tactical battles.",
  },
  {
    id: "ps4-holy-potatoes-what-the-hell",
    overview:
      "Holy Potatoes! What the Hell?! is a cooking-and-management spinoff set in the afterlife, where players process sinners into ingredients for mythological judges. The premise is intentionally absurd, but the play loop is about managing stations, recipes, timing, and upgrades under pressure. It is a darkly comic management game for players who enjoy frantic production chains wrapped in ridiculous presentation.",
  },
  {
    id: "ps4-home-a-unique-horror-adventure",
    overview:
      "Home: A Unique Horror Adventure is a minimalist pixel-art horror story where players explore a dark house and nearby locations while piecing together what happened. Choices, observations, and interpretation shape the ending, making the mystery feel personal and uncertain. It is short and atmospheric, best for players who like low-fi horror, branching narrative details, and stories that leave room for doubt.",
  },
  {
    id: "ps4-hopiko",
    overview:
      "HoPiKo is a twitch platformer about launching a tiny character between nodes at high speed while avoiding traps, timing hazards, and corrupted circuitry. Levels are short, harsh, and built around instant retries, with the challenge coming from reading the route and committing to quick inputs. It is a sharp fit for players who enjoy precision-platformer pressure in bite-sized bursts.",
  },
  {
    id: "ps4-horned-knight",
    overview:
      "Horned Knight is a retro action platformer focused on tight jumps, enemy placement, spikes, and quick stage clears. Players run, slash, double-jump, and work through compact levels that draw from 8-bit and 16-bit challenge design. It is a modest but clear throwback, best for players who want simple controls, old-school difficulty, and a straightforward fantasy platforming loop.",
  },
  {
    id: "ps4-horror-break",
    overview:
      "Horror Break is an arcade brick-breaker with spooky theming, turning the familiar paddle-and-ball format toward haunted backdrops and simple score chasing. Players clear blocks, keep the ball alive, and work through stages built for quick sessions. It is not a full horror adventure; it is a lightweight arcade release using horror flavor for players who want familiar Breakout-style play.",
  },
  {
    id: "ps4-horror-break-head-to-head",
    overview:
      "Horror Break: Head to Head adds a competitive spin to Smobile's horror-themed brick-breaking formula. Players bounce shots, clear blocks, and try to outlast or outscore the opposing side in compact arcade matches. Like the original, it is best understood as a small, simple Breakout-style game with spooky dressing rather than a narrative horror experience.",
  },
  {
    id: "ps4-hot-wheels-monster-trucks-stunt-mayhem",
    overview:
      "Hot Wheels Monster Trucks: Stunt Mayhem is an arcade driving game built around oversized trucks, arenas, ramps, destruction, and stunt scoring. Players perform flips, smash objects, and chase event goals using toy-branded monster trucks rather than realistic racing lines. It is aimed at younger players and Hot Wheels fans who want loud, accessible stunt play over simulation handling.",
  },
  {
    id: "ps4-hotel-life-a-resort-simulator",
    overview:
      "Hotel Life: A Resort Simulator is a business sim about running a holiday resort, handling guest needs, staff work, rooms, amenities, and day-to-day service tasks. Players balance management goals with hands-on chores around the property, trying to keep visitors happy while improving the resort. It is a niche sim for players who like service-industry management and light operational routines.",
  },
  {
    id: "ps4-how-to-survive-2",
    overview:
      "How to Survive 2 is a zombie survival action RPG with crafting, base building, co-op play, and mission-based scavenging in a Louisiana setting. Players gather materials, make weapons, improve camps, and fight infected while managing survival needs. It expands the first game's formula with more persistent progression and a stronger community-camp structure, making it useful for players who want survival systems in a top-down action format.",
  },
  {
    id: "ps4-how-to-survive-storm-warning-edition",
    overview:
      "How to Survive: Storm Warning Edition packages the original zombie survival action RPG with added content, sending players through island environments full of undead threats, crafting materials, hunger, thirst, and danger. The loop is about scavenging, building tools, learning survival rules, and fighting from an overhead perspective. It is a practical, systems-driven zombie game rather than a cinematic horror story.",
  },
  {
    id: "ps4-huntdown",
    overview:
      "Huntdown is a side-scrolling arcade shooter about bounty hunters cleaning up gang-controlled streets in a neon, 1980s-inspired future. Players take cover, throw weapons, blast enemies, and fight memorable bosses across tightly paced stages. It stands out through chunky pixel art, sharp humor, and excellent run-and-gun feel, making it one of the stronger retro action homages on PS4.",
  },
  {
    id: "ps4-hyper-jam",
    overview:
      "Hyper Jam is a neon arena brawler where players dash, slash, throw weapons, and collect perks between rounds that reshape each match. Combat is quick and readable, with the real tension coming from perk builds, sudden reversals, and local multiplayer mind games. It is a stylish party-fighting pick for players who want short competitive rounds with enough strategy to keep rematches interesting.",
  },
];

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = [
    [
      "platformSlug",
      "gameId",
      "title",
      "currentOverview",
      "sourceUrl",
      "rewriteNotes",
      "newOverview",
      "reviewStatus",
      "reviewer",
    ],
  ];

  rewrites.forEach((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    rows.push([
      "ps4",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl || game.descriptionSourceUrl || "",
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on available platform, genre, publisher, developer, and known game identity.",
      rewrite.overview,
      "reviewed",
      "GCX editorial cleanup",
    ]);
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rows: rewrites.length }, null, 2));
}

main();
