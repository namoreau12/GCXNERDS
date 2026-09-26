const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-debtor-divide-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-debtor",
    overview:
      "Debtor is a compact puzzle-platformer about clearing small, trap-filled stages through careful jumps, object use, and route planning. It plays like a bite-sized precision challenge, asking players to read each room, grab what they need, and escape cleanly rather than relying on speed alone. On PS4 it fits best as a short-session indie platformer for players who enjoy simple controls, escalating stage gimmicks, and replaying levels until the solution feels neat.",
  },
  {
    id: "ps4-decay-of-logos",
    overview:
      "Decay of Logos is an action RPG built around a young adventurer and her elk companion crossing a hostile fantasy world after her village is destroyed. Combat is deliberate, with stamina management, dodges, weapon timing, and enemy reads carrying more weight than button-mashing. Its appeal is the mix of exploration, dungeon-like areas, loot, and somber atmosphere, especially for players who like slower, riskier fantasy adventures with a lonely road-trip feel.",
  },
  {
    id: "ps4-deception-iv-the-nightmare-princess",
    overview:
      "Deception IV: The Nightmare Princess is a trap-combo strategy action game where the player defeats intruders by luring them into elaborate, often theatrical hazards. Instead of fighting directly, stages become puzzle arenas built around spikes, rolling boulders, springboards, ceiling traps, and chained setups that reward planning. The PS4 version expands Deception IV with new quests and content, making it a good fit for players who want something stranger and more systems-driven than a standard action game.",
    sourceUrl: "https://en.wikipedia.org/wiki/Deception_IV:_The_Nightmare_Princess",
  },
  {
    id: "ps4-defenders-of-ekron",
    overview:
      "Defenders of Ekron is a top-down shoot-'em-up that mixes arcade firing patterns with adventure-game structure and upgrade progression. Players pilot a combat craft through missions that lean on dodging, special abilities, boss patterns, and story-driven objectives rather than pure score chasing. It stands out from more traditional shooters by giving the campaign a larger narrative wrapper and by asking players to manage offensive and defensive tools across increasingly busy encounters.",
  },
  {
    id: "ps4-deiland",
    overview:
      "Deiland is a gentle adventure RPG and life-sim about shaping a tiny planet into a home. Players farm crops, craft tools, cook, trade, complete quests, and defend the world from occasional threats while gradually meeting visitors from beyond the planet. Its rhythm is relaxed and collectible-driven, closer to a cozy resource loop than a combat-heavy RPG, making it useful for players looking for light exploration, crafting, and storybook presentation.",
  },
  {
    id: "ps4-deleveled",
    overview:
      "Deleveled is a minimalist puzzle-platformer built around momentum without a jump button. Players control paired blocks and use gravity, switches, and rebound force to move through compact challenge rooms. The fun comes from understanding how the two blocks affect one another, then executing the solution with clean timing. It is best suited to players who like abstract puzzle design, quick resets, and stages that teach a single mechanical idea before twisting it.",
  },
  {
    id: "ps4-demon-gaze-extra",
    overview:
      "Demon Gaze Extra is an enhanced version of Experience's first-person dungeon-crawling RPG, centered on mapping labyrinths, building a party, and capturing powerful demons. The structure is classic DRPG: explore grid-based dungeons, return to town, strengthen the group, and push deeper into dangerous territory. This version refreshes the original Demon Gaze with quality-of-life updates and added content, giving PS4 players a sharper route into its monster-collecting and party-building loop.",
  },
  {
    id: "ps4-demon-gaze-ii",
    overview:
      "Demon Gaze II continues the first-person dungeon crawler formula with a new city, new demons, and a stronger emphasis on character bonds. Players build a party, explore maze-like areas, fight turn-based battles, and use captured demon allies as both story characters and tactical tools. It is a niche but sturdy fit for fans of grid-mapping RPGs who enjoy gradual team optimization, anime-style presentation, and dungeon runs that reward preparation.",
  },
  {
    id: "ps4-demon-s-tier",
    overview:
      "Demon's Tier+ is a roguelite dungeon crawler that blends twin-stick action, loot collection, and arcade-style runs through monster-filled floors. Players descend into procedurally arranged areas, gather coins and gear, defeat bosses, and try to carry long-term progress into future attempts. Its PS4 appeal is direct and repeatable: quick combat, character classes, permanent upgrades, and the constant push to survive one floor deeper than the last run.",
  },
  {
    id: "ps4-demons-age",
    overview:
      "Demons Age is a party-based fantasy RPG inspired by older computer role-playing games, with tactical battles, recruitable companions, and quest decisions across a dark medieval setting. Players assemble a group, manage skills and equipment, and move through dungeons and towns while uncovering a demonic threat. It is aimed less at fast action and more at players who want character sheets, turn-based planning, and a campaign shaped by classic RPG structure.",
  },
  {
    id: "ps4-derelict-fleet",
    overview:
      "Derelict Fleet is an arcade-style space action game built around piloting through hostile sectors, destroying enemy ships, and surviving dense combat encounters. The experience is straightforward and score-minded, with the player's attention split between positioning, weapon fire, and avoiding incoming attacks. It fits the PS4 library as a small-scale sci-fi action release for players who want quick missions, direct ship control, and a lighter alternative to larger space sims.",
  },
  {
    id: "ps4-destiny-connect-tick-tock-travelers",
    overview:
      "Destiny Connect: Tick-Tock Travelers is a colorful turn-based RPG about a girl named Sherry, her friends, and a robot named Isaac investigating why time has stopped in their town. Battles are approachable, with Isaac's forms giving the party different tactical options as the story moves through different eras. Its tone is lighter than many PS4 RPGs, mixing family-friendly adventure, time-travel mystery, and traditional combat in a compact campaign.",
  },
  {
    id: "ps4-devious-dungeon",
    overview:
      "Devious Dungeon is a side-scrolling action platformer about fighting through randomized castle floors, defeating monsters, collecting loot, and upgrading a knight between runs. Each stage asks for simple but steady control of jumps, attacks, hazards, and enemy spacing. It is designed for quick progression and repeat attempts rather than a sprawling platform campaign, making it a straightforward pick for players who enjoy light roguelite structure and old-school dungeon themes.",
  },
  {
    id: "ps4-devious-dungeon-2",
    overview:
      "Devious Dungeon 2 builds on the first game's compact action-platformer loop with multiple playable heroes, randomized dungeon layouts, equipment upgrades, and boss fights. Players push through short stages, earn currency, improve their character, and try to survive deeper into the dungeon. The sequel keeps the same simple pick-up-and-play rhythm while adding more class identity, so it works well as a casual roguelite platformer with steady progression.",
  },
  {
    id: "ps4-die-for-valhalla",
    overview:
      "Die for Valhalla! is a Norse-themed beat-'em-up where a Valkyrie possesses fallen warriors, monsters, and other bodies to keep fighting through chaotic side-scrolling battles. The possession mechanic gives the brawler its hook, letting players swap into different forms with distinct attacks instead of controlling one fixed hero. It is built for arcade action, local co-op energy, and repeatable stages, with humor and mythology giving the combat a playful edge.",
  },
  {
    id: "ps4-disciples-liberation",
    overview:
      "Disciples: Liberation is a dark fantasy tactical RPG that combines turn-based battles with faction choices, base growth, quests, and companion management. Players lead Avyanna through a divided world, recruiting allies and resolving conflicts that can shift relationships with different powers. The combat is grid-based and party-focused, while the campaign emphasizes morally messy decisions and long-term progression, making it a larger strategy-RPG entry within the PS4 library.",
  },
  {
    id: "ps4-disgaea-1-complete",
    overview:
      "Disgaea 1 Complete is a remastered version of the original tactical RPG about Laharl, Etna, and Flonne battling through the Netherworld. It keeps the series' signature grid combat, outrageous level caps, item worlds, team attacks, and absurd damage scaling, while updating the presentation for newer hardware. For PS4 owners, it is the cleanest way to play the game that established Disgaea's mix of strategy, comedy, grinding, and over-the-top systems.",
  },
  {
    id: "ps4-distraint",
    overview:
      "Distraint is a short psychological horror adventure following Price, a man who seizes property for a living and begins to confront the human cost of his choices. The game uses side-scrolling exploration, simple puzzles, unsettling imagery, and a bleak soundscape rather than combat. Its strength is mood and moral discomfort, making it a compact story piece for players who like horror built around guilt, symbolism, and oppressive atmosphere.",
  },
  {
    id: "ps4-distraint-2",
    overview:
      "Distraint 2 continues Price's story with another side-scrolling psychological horror adventure focused on grief, recovery, and the consequences of the first game. Players explore distorted spaces, solve light environmental puzzles, and move through surreal scenes that are more emotional than action-oriented. It is best approached as a narrative follow-up, using compact horror imagery and quiet dread to finish the character arc rather than reinvent the gameplay.",
  },
  {
    id: "ps4-divide",
    overview:
      "Divide is a sci-fi action-adventure with an isometric viewpoint, following a father pulled into a mysterious corporate world after a violent intrusion changes his life. Players explore industrial environments, fight security forces, uncover documents, and piece together the setting through atmosphere and worldbuilding. Its pace is slower and moodier than a pure shooter, aiming for a blend of exploration, narrative discovery, and tense combat across a retro-futuristic space.",
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
