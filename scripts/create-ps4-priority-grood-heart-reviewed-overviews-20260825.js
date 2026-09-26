const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-grood-heart-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-grood",
    overview:
      "Grood is a compact shoot 'em up with a grimy sci-fi look, pulsing music, and waves of enemies that pressure the player through constant movement. Players pilot through hostile stages, dodge fire, collect power, and push toward bosses in a structure built for short arcade runs. It is a straightforward indie shmup for players who want a dark visual style, quick retries, and score-chasing intensity over elaborate story systems.",
  },
  {
    id: "ps4-grounded",
    overview:
      "Grounded is Obsidian's backyard survival adventure, shrinking players to insect size and turning grass, ants, spiders, and household debris into a dangerous open-world ecosystem. Players gather materials, build bases, craft gear, explore landmarks, and uncover why they were miniaturized. On PS4, it brings a major co-op survival game to the library, with the hook coming from familiar suburban spaces made strange, huge, and threatening.",
  },
  {
    id: "ps4-guacamelee-super-turbo-championship-edition",
    overview:
      "Guacamelee! Super Turbo Championship Edition is a colorful metroidvania brawler where a luchador fights through living and dead worlds with wrestling moves, platforming upgrades, and dimension-swapping puzzles. Players unlock new attacks that double as traversal tools, then revisit areas to find secrets and tougher challenges. It is fast, funny, and expressive, especially for players who like combo-heavy combat wrapped around exploration.",
  },
  {
    id: "ps4-guard-duty",
    overview:
      "Guard Duty is a point-and-click adventure that starts as a medieval comedy about a distracted castle guard and expands into a time-hopping story with sci-fi consequences. Players talk to characters, collect items, solve classic adventure puzzles, and follow two connected timelines. It is made for players who enjoy old-school adventure-game logic, dry humor, and a compact story that uses its modest presentation with charm.",
  },
  {
    id: "ps4-guardians-of-the-galaxy-the-telltale-series",
    overview:
      "Guardians of the Galaxy: The Telltale Series turns Marvel's spacefaring team into an episodic choice-driven adventure built around dialogue, quick-time action, and character conflict. Players guide Star-Lord through decisions that affect team relationships while the group deals with a powerful artifact and personal baggage. It is more interactive comic drama than action game, aimed at fans who want banter, choices, and Telltale-style branching scenes.",
  },
  {
    id: "ps4-guilty-gear-xrd-revelator",
    overview:
      "Guilty Gear Xrd: Revelator expands Arc System Works' 2.5D fighting game with more characters, refined systems, and the series' wild anime-metal presentation. Players dig into fast movement, Roman Cancels, air options, character-specific pressure, and a high-skill competitive structure. It is one of PS4's strongest technical fighters for players who want expressive offense, deep lab work, and a cast where every matchup feels distinct.",
  },
  {
    id: "ps4-guilty-gear-xrd-sign",
    overview:
      "Guilty Gear Xrd: Sign brought the series' hand-drawn fighting style into 3D models that still look like animated illustrations, while keeping the speed and complexity fans expect. Players learn character-specific tools, aggressive movement, combo routes, and defensive systems across a striking roster. It is both a visual reset and a serious fighting game, best for players ready to invest in Arc System Works' layered combat language.",
  },
  {
    id: "ps4-guns-gore-and-cannoli",
    overview:
      "Guns, Gore and Cannoli is a side-scrolling run-and-gun game set in a cartoon 1920s gangster world overrun by zombies. Players blast through mobs with tommy guns, shotguns, explosives, and platforming hazards while the game leans into slapstick violence. It is a strong couch-action pick for players who like Metal Slug-style pacing, readable chaos, and a pulpy mobster horror tone.",
  },
  {
    id: "ps4-guns-gore-and-cannoli-2",
    overview:
      "Guns, Gore and Cannoli 2 continues the undead gangster action with World War II-era chaos, improved aiming, and bigger set pieces. Players move, roll, shoot in multiple directions, and fight through soldiers, zombies, bosses, and environmental hazards. It keeps the first game's hand-drawn comic violence but feels more flexible in combat, making it a good sequel for players who wanted smoother control and more spectacle.",
  },
  {
    id: "ps4-gunscape",
    overview:
      "Gunscape is a first-person shooter built around both playing and creating levels, with tools inspired by classic arena shooters and block-based construction. Players can build maps, place enemies and weapons, then share or play through custom scenarios in solo, co-op, or competitive modes. Its identity is less about a single campaign and more about a toolkit for players who enjoy shooter sandboxes and user-made challenges.",
  },
  {
    id: "ps4-gunvolt-chronicles-luminous-avenger-ix",
    overview:
      "Gunvolt Chronicles: Luminous Avenger iX is a fast 2D action platformer starring Copen, whose dash-lock-on combat rewards tagging enemies before unleashing precise shots. Players speed through stages, chase ranks, fight bosses, and use mobility to stay airborne and aggressive. It is a crisp Inti Creates action game for players who enjoy Mega Man-style stage structure with flashier movement and score-minded execution.",
  },
  {
    id: "ps4-gunvolt-chronicles-luminous-avenger-ix-2",
    overview:
      "Gunvolt Chronicles: Luminous Avenger iX 2 changes Copen's rhythm with a heavier melee-focused saw weapon, new traversal tools, and boss-driven stages. Players still dash, lock on, and chase clean clears, but the sequel asks for closer-range decisions and more deliberate use of its Break-Shift systems. It is best for fans of precise 2D action who want a different spin on the first Luminous Avenger's speed.",
  },
  {
    id: "ps4-hakoniwa-company-works",
    overview:
      "Hakoniwa Company Works is a Nippon Ichi sandbox RPG that mixes blocky terrain building with tactical combat and quirky party progression. Players explore voxel-like worlds, collect materials, customize spaces, and fight through RPG encounters with a crafting-heavy structure. It is a niche import-flavored PS4 entry for players interested in the overlap between light strategy RPG systems and building-game experimentation.",
  },
  {
    id: "ps4-hamidashi-creative",
    overview:
      "Hamidashi Creative is a Japanese visual novel about student council life, character routes, and romantic comedy built around a group of expressive heroines. Players read through story scenes, make choices, and follow different relationship paths rather than solving mechanical puzzles. It is aimed squarely at visual-novel readers who want school-life banter, route structure, and character-focused drama in a largely text-driven format.",
  },
  {
    id: "ps4-handball-16",
    overview:
      "Handball 16 is a licensed handball sports game from Eko Software and Bigben, built around passing, shooting, defensive positioning, and team play rather than the rhythms of soccer or basketball. Players control club teams through matches and try to manage the speed and physicality of indoor handball. Its value is mainly for fans of the sport who want a playable console version of a rarely represented competition.",
  },
  {
    id: "ps4-handball-17",
    overview:
      "Handball 17 follows the same niche sports lane with updated teams and another attempt to translate indoor handball's fast passing lanes, contact, and quick shots to PS4 controls. Players work possessions, defend the arc, and look for clean shooting angles under pressure. It is a specialized release, best judged as a handball option for fans rather than a broad sports-game rival to larger franchises.",
  },
  {
    id: "ps4-handball-21",
    overview:
      "Handball 21 is a later Nacon-published handball sim with a bigger presentation push, team licenses, and a focus on tactical passing, shot timing, and defensive structure. Players move the ball around compact courts, create openings, and handle the sport's quick turnovers. It is still a niche sports game, but it gives handball fans a more modern PS4 entry with clearer match flow than the earlier releases.",
  },
  {
    id: "ps4-hardcore-mecha",
    overview:
      "Hardcore Mecha is a side-scrolling mecha action game with campaign missions, arena-style battles, and highly mobile robots armed with guns, blades, boosters, and special attacks. Players dash through stages, fight rival machines, and manage a flexible move set that makes combat feel more like an anime robot duel than a simple shooter. It is a strong fit for players who want stylish 2D mech action with real momentum.",
  },
  {
    id: "ps4-harvest-moon-mad-dash",
    overview:
      "Harvest Moon: Mad Dash turns the farming series into a fast puzzle-action spinoff about matching crops, animals, and resources under time pressure. Players clear stage objectives by moving items around small boards instead of settling into a full farming life sim. It is best approached as a light arcade puzzle game using Harvest Moon imagery, not as a replacement for the slower planting, relationship, and town-building loop fans may expect.",
  },
  {
    id: "ps4-harvest-moon-one-world",
    overview:
      "Harvest Moon: One World is a farming life sim built around traveling across different regions to restore lost crops and help towns recover their agricultural identity. Players plant seeds, raise animals, complete requests, meet villagers, and expand what can be grown by exploring the world. It keeps the familiar cozy routine, but its travel structure gives the PS4 entry a broader map-driven hook than a single-village farm.",
  },
  {
    id: "ps4-hashiwokakero",
    overview:
      "Hashiwokakero is a digital version of the Japanese logic puzzle also known as Bridges, where numbered islands must be connected by lines under strict placement rules. Players solve grids by reading constraints, testing connections, and gradually proving where every bridge belongs. It is a pure puzzle release for players who like sudoku-adjacent deduction, clean rules, and quiet problem solving without story or action elements.",
  },
  {
    id: "ps4-headliner-novinews",
    overview:
      "Headliner: NoviNews is a narrative simulation about controlling a news feed in a divided society and watching public opinion shift around your editorial choices. Players approve or reject stories, then see how family, politics, health, and social tension respond. It is a compact but pointed game about media responsibility, bias, and consequences, built for players who enjoy choice-driven social commentary more than traditional action.",
  },
  {
    id: "ps4-headsnatchers",
    overview:
      "Headsnatchers is a chaotic party action game about stealing opponents' heads and using them to score across strange arenas and mini-games. Players brawl, grab, throw, and scramble through modes designed for noisy local or online multiplayer confusion. It is not trying to be a serious fighter; its appeal is absurd competitive energy, quick rounds, and the comedy of everyone losing track of whose head went where.",
  },
  {
    id: "ps4-heart-and-slash",
    overview:
      "Heart&Slash is a 3D roguelite brawler about a robot fighting through a post-human world full of hostile machines, randomized gear, and fast melee combat. Players chain attacks, dodge, equip new parts, and restart after defeat with a different build. It is scrappy but distinctive, aimed at players who like action games with expressive movement, run-based progression, and a bright cartoon-robot identity.",
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
