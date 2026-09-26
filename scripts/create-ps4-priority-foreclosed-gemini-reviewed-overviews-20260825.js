const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-foreclosed-gemini-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-foreclosed",
    overview:
      "Foreclosed is a cyberpunk action shooter framed like an interactive graphic novel, with panels, sharp color blocking, and comic-book transitions driving the presentation. Players guide Evan Kapnos through a corporate conspiracy using cover shooting, stealth touches, hacking abilities, and upgrades tied to his identity implants. It is a compact, style-forward sci-fi game for players who want a brisk narrative action experience rather than a sprawling open-world shooter.",
  },
  {
    id: "ps4-foregone",
    overview:
      "Foregone is a side-scrolling action platformer about a powerful Arbiter cutting through corrupted enemies in fast, loot-driven stages. It mixes melee combos, firearms, air dashes, and upgradeable gear with a campaign structure built around repeated combat rooms and boss encounters. The appeal is immediate movement and weapon feel: players are constantly swapping attacks, reading enemy patterns, and pushing through a colorful fantasy-sci-fi battlefield.",
  },
  {
    id: "ps4-forma-8",
    overview:
      "Forma.8 is an atmospheric exploration adventure starring a small probe stranded on an alien planet. Instead of emphasizing dialogue or heavy combat, it leans into lonely movement, environmental puzzles, hidden paths, and a minimalist art style that makes the world feel strange and quiet. Players who enjoy metroidvania-like discovery, abstract storytelling, and floating through interconnected spaces will understand its slower, more meditative rhythm.",
  },
  {
    id: "ps4-four-sided-fantasy",
    overview:
      "Four Sided Fantasy is a puzzle platformer built around screen wrapping: players move through one edge of the screen and emerge from the opposite side, turning the display itself into part of the level design. The game uses that idea for traversal, timing challenges, and spatial puzzles across a gentle seasonal presentation. It is a short, elegant entry for players who like platformers that ask them to rethink boundaries rather than simply jump faster.",
  },
  {
    id: "ps4-fractured-minds",
    overview:
      "Fractured Minds is a brief first-person adventure that uses surreal rooms and simple interactions to represent anxiety, isolation, and mental-health struggles. Each chapter presents a symbolic situation to move through, with puzzles and environmental changes serving the emotional point more than mechanical complexity. It is best understood as a personal, message-driven experience: small in scope, but built to communicate a specific feeling through play.",
  },
  {
    id: "ps4-frane-dragons-odyssey",
    overview:
      "Frane: Dragons' Odyssey is a Kemco-published action RPG with anime fantasy characters, real-time battles, dungeon exploration, and relationship-driven story beats. Players guide Kunah through a world connected to dragons and gods, collecting gear, fighting monsters, and progressing through a traditional handheld-style RPG structure. It is aimed at players who enjoy lighter Japanese RPG adventures with quick combat and character-focused progression.",
  },
  {
    id: "ps4-frantics",
    overview:
      "Frantics is a PlayLink party game where players use phones as controllers in a collection of competitive mini-games. Matches are built around sabotage, bluffing, and quick reactions, with the fox host stirring up deals and betrayals between rounds. It works best as a couch-party game: simple controls, short events, and enough mischief that the funniest moments often come from friends turning on each other at exactly the wrong time.",
  },
  {
    id: "ps4-freakout-calamity-tv-show",
    overview:
      "FreakOut: Calamity TV Show is a twin-stick shooter about surviving a violent televised arena while enemies flood the screen. Players dodge swarms, fire in all directions, grab weapons, and clear rooms that escalate into chaotic bullet-heavy encounters. Its pitch is deliberately arcade-like: fast deaths, quick restarts, loud presentation, and a focus on constant movement rather than careful cover-based shooting.",
  },
  {
    id: "ps4-freddy-spaghetti",
    overview:
      "Freddy Spaghetti is a physics comedy game about controlling a sentient strand of pasta through awkward everyday challenges. Movement is intentionally clumsy, with players wriggling, flinging, and stumbling through tasks that turn simple navigation into slapstick. It is a novelty-driven release for players who enjoy absurd control schemes, short levels, and watching a basic objective fall apart because the protagonist is, quite literally, spaghetti.",
  },
  {
    id: "ps4-freedom-finger",
    overview:
      "Freedom Finger is a side-scrolling shoot 'em up built around a flying hand that can punch, shoot, and grab enemy craft to use their weapons. It combines arcade action with a loud satirical tone, licensed music, and a campaign that keeps changing the visual and enemy rhythm. The result is a shooter for players who want personality alongside patterns: dodging fire, stealing tools, and leaning into the joke without losing the challenge.",
  },
  {
    id: "ps4-full-metal-panic-fight-who-dares-wins",
    overview:
      "Full Metal Panic! Fight! Who Dares Wins adapts the anime series into a tactical mecha RPG with grid-based battles and story scenes centered on Sousuke, Kaname, and the Arm Slave units. Players position machines, choose attacks, manage upgrades, and work through scenarios that lean on the source material's military-school sci-fi conflict. It is mainly for fans who want a strategy-game version of the series rather than a general-purpose mecha action game.",
  },
  {
    id: "ps4-full-mojo-rampage",
    overview:
      "Full Mojo Rampage is a voodoo-themed action roguelite where players fight through procedurally arranged stages, collect charms, and build power through repeated runs. Combat is direct and arcade-like, with bosses, traps, co-op options, and unlocks giving each run a different rhythm. It fits players who enjoy top-down action RPGs where the fun comes from experimenting with upgrades, surviving messy rooms, and starting over stronger.",
  },
  {
    id: "ps4-fury-unleashed",
    overview:
      "Fury Unleashed is a comic-book action platformer where each page becomes a battlefield of enemies, traps, and loot. Players chain kills to keep combos alive, switch between guns and melee attacks, and unlock permanent upgrades between roguelite runs. Its hook is momentum: the game rewards aggressive movement and stylish clears, making it a strong fit for players who like run-based action with a Saturday-morning-comic look.",
  },
  {
    id: "ps4-future-unfolding",
    overview:
      "Future Unfolding is an exploration puzzle game set in a colorful wilderness where animals, symbols, and shifting paths guide progress. Players move through forests, caves, and strange natural spaces without traditional combat or heavy instruction, learning rules by observing the world. It is quiet and experimental, best for players who enjoy discovery, environmental logic, and games that make navigation itself feel mysterious.",
  },
  {
    id: "ps4-futuregrind",
    overview:
      "FutureGrind is a stunt platformer about riding a futuristic bike across rails, matching wheel colors, flipping for score, and surviving increasingly technical tracks. The challenge comes from clean execution: landing on the right rail, controlling rotation, and keeping a risky combo alive without crashing. It has the quick-retry appeal of a Trials-style skill game, but with a neon rail-grinding identity of its own.",
  },
  {
    id: "ps4-fuuraiki-4",
    overview:
      "Fuuraiki 4 is a travel-focused adventure game about touring Japan's Gifu region, visiting real locations, taking in scenery, and meeting characters along the route. Rather than action or combat, it emphasizes road-trip atmosphere, photography-like observation, conversations, and a sense of place. It is a niche story-and-travel title for players interested in slower Japanese adventures that treat landscape and local detail as the main attraction.",
  },
  {
    id: "ps4-fuyu-kiss",
    overview:
      "Fuyu Kiss is a Japanese visual novel centered on winter romance, character routes, and choice-driven relationship scenes. Players read through illustrated story sequences, make dialogue and route decisions, and follow how different heroines' stories unfold. Its audience is the visual-novel crowd: readers looking for character chemistry, seasonal mood, and branching romantic outcomes rather than puzzles, combat, or open-ended exploration.",
  },
  {
    id: "ps4-gal-gunvolt",
    overview:
      "Gal Gunvolt is a retro-styled 2D action platformer from Inti Creates that turns characters from Gal Gun and Azure Striker Gunvolt into compact side-scrolling stages. Players run, jump, shoot, and learn enemy patterns in a deliberately old-school structure. It is a small arcade-like release, appealing most to fans of Inti Creates' crisp action design and players who want a quick, simple platform-shooter challenge.",
  },
  {
    id: "ps4-gal-gunvolt-burst",
    overview:
      "Gal Gunvolt Burst expands the retro platform-shooter idea with more elaborate stages, boss fights, and customization built around a burst-shot scoring hook. Players control crossover characters, tune shots, and work through levels that reward getting close to enemies before firing. It keeps the 8-bit-inspired look, but adds more systems for players who want a meatier version of the compact Gal Gunvolt formula.",
  },
  {
    id: "ps4-galacide",
    overview:
      "Galacide blends horizontal shoot 'em up action with color-matching puzzle pressure, asking players to blast enemies while also clearing blocks that clog the scrolling path. The screen can become dangerous from bullets and from the puzzle field itself, so survival depends on aiming, route clearing, and priority decisions. It is an unusual arcade hybrid for players who like shooters but want something more strategic than pure dodging.",
  },
  {
    id: "ps4-galaxy-squad",
    overview:
      "Galaxy Squad is a space-themed tactical roguelite about recruiting a crew, exploring star systems, and surviving turn-based battles against hostile forces. Players manage characters, equipment, random events, and mission choices across runs where decisions can reshape the squad's chances. It is built for players who enjoy lightweight strategy campaigns, sci-fi travel, and the pressure of making imperfect choices with limited resources.",
  },
  {
    id: "ps4-game-tengoku-cruisnmix",
    overview:
      "Game Tengoku CruisnMix is a revival of Jaleco's parody shoot 'em up, built around arcade-style vertical shooting, eccentric characters, and playful references to older game culture. Players dodge dense patterns, use character-specific attacks, and chase score through stages that treat the genre with a wink. It is primarily for shmup fans and retro collectors who want a quirky, self-aware shooter rather than a modern cinematic action game.",
  },
  {
    id: "ps4-ganbare-super-strikers",
    overview:
      "Ganbare! Super Strikers turns soccer into a tactical RPG, with grid movement, turn-based passing, special skills, and team development replacing real-time sports controls. Players build a squad, position teammates, and use RPG-style abilities to create scoring chances or shut down attacks. It is a smart fit for players who like soccer strategy and team growth but prefer planning turns over mastering analog dribbling.",
  },
  {
    id: "ps4-gemini-heroes-reborn",
    overview:
      "Gemini: Heroes Reborn is a first-person action-adventure tied to the Heroes television universe, centered on a young woman uncovering powers inside a secret facility. Players use telekinesis and time-shifting abilities to solve traversal puzzles, fight guards, and move through a compact sci-fi story. Its strengths are the power fantasy and environmental ability use, especially for players interested in a short companion piece to the show's world.",
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
