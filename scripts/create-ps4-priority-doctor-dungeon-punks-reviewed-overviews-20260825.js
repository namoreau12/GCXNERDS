const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-doctor-dungeon-punks-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-doctor-who-the-edge-of-reality",
    overview:
      "Doctor Who: The Edge of Reality is a first-person adventure built around mystery solving, familiar Doctor Who threats, and environmental puzzles rather than combat. Players move through story scenes tied to the Thirteenth and Tenth Doctors, investigate strange locations, and use series knowledge as part of the appeal. It works best for fans who want a playable episode-style experience with Daleks, Cybermen, and sci-fi problem solving at the center.",
  },
  {
    id: "ps4-dodgeball-academia",
    overview:
      "Dodgeball Academia turns school sports into a bright RPG adventure, following Otto as he trains, recruits teammates, and battles rival students through dodgeball matches. The game blends exploration, quests, equipment, and character growth with real-time dodgeball action where positioning, catches, charged throws, and special moves matter. Its charm comes from treating a playground sport like a full shonen campaign, making it approachable but much more structured than a simple sports minigame.",
  },
  {
    id: "ps4-dogos",
    overview:
      "Dogos is a vertical shoot-'em-up with free-scrolling movement, letting players fly across large combat zones instead of being locked to a narrow lane. Missions send the ship through enemy bases, heavy fire, ground targets, and boss encounters, with weapon upgrades shaping how each run feels. It is a straightforward arcade shooter for players who enjoy constant movement, screen-filling attacks, and a sci-fi resistance story wrapped around the action.",
  },
  {
    id: "ps4-dokapon-up-mugen-no-roulette",
    overview:
      "Dokapon Up! Mugen no Roulette mixes Dokapon's friendship-testing board-game structure with characters and setting from Utawarerumono. Players move around a board, battle enemies, collect money, interfere with rivals, and chase objectives that can swing wildly based on rolls and combat outcomes. Its appeal is multiplayer chaos: it is part RPG-lite, part party board game, and part sabotage engine for groups that enjoy competitive unpredictability.",
  },
  {
    id: "ps4-dollhouse",
    overview:
      "Dollhouse is a psychological horror adventure about piecing together a fragmented past while being hunted through shifting noir-inspired environments. The game leans on stealth, exploration, clues, and unsettling imagery rather than direct confrontation. Its distinctive hook is the way memory, identity, and pursuit mechanics blur together, giving it the feel of a stylized horror mystery where the player is always trying to understand both the house and the person trapped inside it.",
  },
  {
    id: "ps4-don-t-starve-together",
    overview:
      "Don't Starve Together brings Klei's bleak survival sandbox into multiplayer, asking players to gather resources, craft tools, manage hunger and sanity, and survive seasonal threats in a hostile wilderness. Cooperation matters because exploration, base building, food production, and monster defense can quickly overwhelm an unprepared group. On PS4 it is a long-tail survival game built for repeated worlds, hard lessons, and stories created by things going wrong at the worst possible time.",
  },
  {
    id: "ps4-doodle-devil",
    overview:
      "Doodle Devil is a combination puzzle game where players create new concepts by pairing elements, leaning into darker and more mischievous themes than Doodle God. Progress comes from experimenting with categories, reading the logic behind each pairing, and unlocking reactions that expand the available set. It is a low-pressure puzzle release for players who like checklist completion, playful word association, and discovering chains of small surprises rather than reflex-based challenges.",
  },
  {
    id: "ps4-doodle-god-evolution",
    overview:
      "Doodle God Evolution packages JoyBits' element-combining puzzle formula around creation, discovery, and civilization-building themes. Players match basic elements to unlock new materials, creatures, ideas, and technologies, gradually filling out a web of combinations. The PS4 version is best understood as a casual logic and collection game: the satisfaction is in testing associations, completing groups, and seeing the world expand one successful combination at a time.",
  },
  {
    id: "ps4-doughlings-arcade",
    overview:
      "Doughlings: Arcade reimagines the brick-breaking formula with colorful characters, special abilities, and boss-like stage designs. Players bounce a ball to clear enemies and obstacles, while different forms change how shots, powers, and rescues work. It feels more active than a plain Breakout clone because timing, transformations, and stage hazards all matter, making it a cheerful arcade release for score chasers and players who enjoy compact level-based challenges.",
  },
  {
    id: "ps4-dragon-marked-for-death",
    overview:
      "Dragon Marked for Death is a side-scrolling action RPG from Inti Creates built around distinct character classes, mission-based progression, and cooperative play. Each hero has different movement, attack options, and dragon-powered abilities, so stages feel different depending on the party makeup. It appeals to players who like action-platforming with RPG growth, loot, repeatable quests, and boss fights that reward learning patterns across multiple runs.",
  },
  {
    id: "ps4-dragonfangz-the-rose-and-dungeon-of-time",
    overview:
      "DragonFangZ: The Rose & Dungeon of Time is a roguelike dungeon crawler where every move matters, from positioning around enemies to deciding when to use items or special powers. Players guide Rose through changing floors, collect fangs from defeated monsters, and use those abilities to survive deeper attempts. It is best suited to players who enjoy traditional mystery-dungeon tension, turn-by-turn risk management, and runs that can collapse from one bad decision.",
  },
  {
    id: "ps4-draw-a-stickman-epic-2",
    overview:
      "Draw a Stickman: Epic 2 is an adventure puzzle game built around drawing objects and using them to solve problems across storybook-like stages. Players sketch tools, interact with the environment, battle simple enemies, and uncover collectibles as the hand-drawn world changes around them. Its main appeal is playful creativity rather than difficulty, making it a family-friendly PS4 entry for players who like light puzzles and a personalized art gimmick.",
  },
  {
    id: "ps4-drawful-2",
    overview:
      "Drawful 2 is a party game about making terrible drawings and convincing everyone else that your fake caption is the real prompt. Players use phones or tablets as controllers, submit drawings, write decoy answers, and score points by fooling the room. It is one of Jackbox's simplest and most replayable social games, built for jokes, misread art, and groups that care more about laughter than traditional competition.",
  },
  {
    id: "ps4-dread-nautical",
    overview:
      "Dread Nautical is a tactical survival RPG set on a cruise ship overrun by supernatural threats. Players gather survivors, scavenge supplies, manage limited resources, and fight turn-based battles on grid-based maps while trying to keep the group alive. Its pressure comes from attrition and planning: every weapon, meal, and recruited passenger matters, giving the game a compact strategy-horror loop with a strong disaster-at-sea premise.",
  },
  {
    id: "ps4-dreamwalker-never-fall-asleep",
    overview:
      "Dreamwalker: Never Fall Asleep is a hidden-object adventure about entering dreams to investigate a town's strange sleeping sickness. Players search detailed scenes, solve inventory puzzles, and move through surreal locations that shift between mystery and light horror. As with many Artifex Mundi releases, the draw is relaxed puzzle flow and atmospheric story presentation, making it a good fit for players who want a guided adventure rather than an open-ended challenge.",
  },
  {
    id: "ps4-dreii",
    overview:
      "Dreii is a quiet physics puzzle game about building structures from awkward shapes, often while cooperating with other players online. The challenge is not just knowing where pieces should go, but balancing them carefully enough that the whole construction holds. Its minimalist style gives the game a calm, almost meditative tone, while the multiplayer element turns simple block placement into a shared test of patience, communication, and spatial judgment.",
  },
  {
    id: "ps4-driveclub-bikes",
    overview:
      "Driveclub Bikes expands Evolution Studios' racing platform with motorcycle events, superbike handling, and the same club-focused progression that defined the original Driveclub. Races emphasize speed, clean lines, weather, track familiarity, and social challenges rather than deep mechanical tuning. It is a polished arcade-leaning bike racer for PS4 players who want fast events, strong presentation, and leaderboard competition tied to real-world-style machines.",
  },
  {
    id: "ps4-duck-dynasty",
    overview:
      "Duck Dynasty adapts the reality-TV series into a light outdoor activity game built around hunting, fishing, driving, and scripted family moments. Players complete simple missions inspired by the show's personalities and Louisiana setting, with duck calls and target shooting forming much of the loop. Its value is mainly as a licensed curiosity for fans of the series rather than as a deep hunting sim or open-world outdoor game.",
  },
  {
    id: "ps4-dungeon-encounters",
    overview:
      "Dungeon Encounters is a minimalist Square Enix dungeon RPG that strips exploration down to numbered tiles, mapping, and turn-based battles. Players descend through a massive grid, manage party composition, track events, and survive encounters where information and preparation matter more than spectacle. Its austere presentation is the point: this is a systems-first RPG for players who enjoy mapping, optimization, and clean tactical problem solving.",
  },
  {
    id: "ps4-dungeon-punks",
    overview:
      "Dungeon Punks is a side-scrolling brawler with RPG progression, tag-team characters, and spell-heavy combat. Players fight through fantasy stages, swap between party members, unlock abilities, and chase loot while the action stays closer to arcade beat-'em-ups than traditional menu-driven RPGs. It is built for players who want colorful co-op-friendly combat, character growth, and a lighter alternative to more serious dungeon crawlers.",
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
  fs.writeFileSync(outputPath, rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n", "utf8");
  console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rows: rewrites.length }, null, 2));
}

main();
