const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-i-irony-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-i-ai",
    overview:
      "I, AI is a vertical shoot 'em up about an artificial intelligence fighting its way out of a weapons station and into open space. Players dodge enemy fire, collect upgrades, improve weapons, and push through arcade stages built around constant forward pressure. It is a modest but direct shmup for players who want simple progression, bright sci-fi visuals, and quick action rather than dense bullet-hell complexity.",
  },
  {
    id: "ps4-illusion-of-l-phalcia",
    overview:
      "Illusion of L'Phalcia is a Kemco-published JRPG from Exe Create about a search for the legendary Sword of Amal through a fantasy world of guilds, ruins, and party battles. Players build a team, fight turn-based encounters, learn skills, and follow a traditional character-driven quest. It is aimed at players who enjoy compact, classic-style RPGs with familiar systems and a steady adventure structure.",
  },
  {
    id: "ps4-immortal-planet",
    overview:
      "Immortal Planet is a cold, deliberate action RPG built around stamina management, careful dodging, and learning enemy attack patterns on a frozen world of sleeping immortals. Players explore connected areas, recover resources after death, and fight with a measured pace closer to a compact Soulslike than a loot-heavy RPG. Its appeal is patience: reading threats, committing to attacks, and surviving tense one-on-one encounters.",
  },
  {
    id: "ps4-immortal-redneck",
    overview:
      "Immortal Redneck is a roguelite first-person shooter about a tourist resurrected as a mummy and sent through procedurally arranged Egyptian pyramids. Players blast enemies, collect scroll modifiers, unlock classes, and build permanent upgrades between runs. It mixes arena-shooter speed with roguelite progression, making it a good fit for players who want fast strafing, random modifiers, and a goofy premise.",
  },
  {
    id: "ps4-impact-winter",
    overview:
      "Impact Winter is a survival strategy adventure about leading a small group through the aftermath of an asteroid-driven ice age while waiting for rescue. Players manage shelter, supplies, morale, exploration, and the countdown to possible evacuation. It is slower and more managerial than an action survival game, built around hard choices, resource planning, and keeping a fragile community alive in a frozen world.",
  },
  {
    id: "ps4-in-between",
    overview:
      "In Between is a gravity-shifting puzzle platformer about a dying man moving through symbolic stages tied to grief, memory, and acceptance. Players alter gravity, avoid hazards, and solve rooms where movement rules keep changing. It uses platforming as metaphor as much as challenge, making it a thoughtful fit for players who like precision puzzles with a clear emotional frame.",
  },
  {
    id: "ps4-in-celebration-of-violence",
    overview:
      "In Celebration of Violence is a harsh roguelike action RPG with slow melee combat, procedural danger, and a deliberately unforgiving tone. Players explore hostile areas, manage weapons and stats, and learn through failure as enemies punish careless movement. It is not a breezy hack-and-slash; it is aimed at players who enjoy opaque systems, risky exploration, and the satisfaction of surviving by understanding its rules.",
  },
  {
    id: "ps4-in-rays-of-the-light",
    overview:
      "In Rays of the Light is a quiet first-person exploration game set in an abandoned post-Soviet location, built around atmosphere, environmental storytelling, and light puzzle solving. Players move through empty rooms, observe decay, and piece together meaning from spaces rather than dialogue-heavy scenes. It is a short mood piece for players who enjoy reflective walking-sim experiences with a lonely, ruined-world tone.",
  },
  {
    id: "ps4-inertial-drift",
    overview:
      "Inertial Drift is an arcade racing game with a distinctive twin-stick drift system, using one stick for steering and the other to control the slide. Players learn each car's handling personality, attack corners, and chase clean lines through neon-styled tracks. Its strength is feel: drifting becomes a skill to sculpt rather than a simple brake tap, giving racing fans a fresh control challenge.",
  },
  {
    id: "ps4-inferno-2",
    overview:
      "Inferno 2 is a twin-stick shooter from Radiangames that sends players through neon maze-like levels filled with enemies, keys, upgrades, and branching rooms. The structure mixes arcade shooting with light exploration and RPG-style weapon growth. It is clean, fast, and readable, making it a strong fit for players who like compact twin-stick action with a steady sense of build progression.",
  },
  {
    id: "ps4-inferno-climber-reborn",
    overview:
      "Inferno Climber: Reborn is a rough-edged action RPG about exploring dangerous fantasy environments, managing survival needs, and pushing deeper into hostile areas with limited resources. Players fight monsters, solve environmental problems, and build a character through equipment and stats. It is a niche dungeon adventure for players who enjoy strange, demanding systems and do not mind a less polished presentation.",
  },
  {
    id: "ps4-infinite-minigolf",
    overview:
      "Infinite Minigolf is a colorful mini-golf game from Zen Studios built around themed courses, character customization, power-ups, and a large supply of user-created holes. Players line up shots, manage slopes and obstacles, and share or play community courses beyond the built-in content. It is an accessible sports-puzzle game for families, party sessions, or anyone who enjoys playful course design.",
  },
  {
    id: "ps4-infliction-extended-cut",
    overview:
      "Infliction: Extended Cut is a first-person psychological horror game set inside a suburban home scarred by domestic tragedy and supernatural activity. Players explore rooms, solve light puzzles, avoid threats, and uncover the story through objects and environmental clues. It is aimed at horror fans who prefer oppressive atmosphere, haunted-house tension, and narrative discovery over combat-heavy survival horror.",
  },
  {
    id: "ps4-inuwashi-urabure-tantei-to-ojou-sama-keiji-no-ikebukuro-jiken-file",
    overview:
      "Inuwashi: Urabure Tantei to Ojou-sama Keiji no Ikebukuro Jiken File is a Japanese visual novel mystery about an unlikely detective partnership working through cases in Ikebukuro. Players read dialogue, follow investigation scenes, and make choices that shape the route through the story. It is a text-forward release for readers interested in crime drama, character banter, and mystery structure rather than action systems.",
  },
  {
    id: "ps4-invector",
    overview:
      "Invector is a rhythm game built around piloting through glowing tracks in sync with electronic pop music, originally tied closely to Avicii's catalog. Players hit notes, switch lanes, and ride beat-driven courses that turn songs into fast visual tunnels. Its appeal is the blend of music and motion, making it a strong pick for players who want rhythm action with a sleek, festival-like energy.",
  },
  {
    id: "ps4-inversus",
    overview:
      "Inversus is a minimalist action-puzzle arena game where players can only move across tiles of their own color, and every shot flips the board's black-and-white space. Matches become fights over territory as much as aim, with each bullet opening routes while closing others. It shines in competitive play, where simple rules create clever traps, escapes, and sudden reversals.",
  },
  {
    id: "ps4-invisible-inc",
    overview:
      "Invisible, Inc. is a turn-based stealth tactics game from Klei about corporate espionage, hacking, and extracting agents before security systems overwhelm the mission. Players move operatives through guarded facilities, manage action points, steal resources, and decide when to risk one more room. It is tense and elegant, built for players who like careful planning, procedural pressure, and escaping after a plan almost falls apart.",
  },
  {
    id: "ps4-invisigun-reloaded",
    overview:
      "Invisigun Reloaded is a competitive arena game where every player is invisible unless they shoot, bump into objects, or reveal themselves through environmental clues. Players track footsteps, watch subtle movement, and fire based on deduction instead of constant visibility. It is a clever multiplayer action game for groups who enjoy mind games, prediction, and the comedy of hiding in plain sight.",
  },
  {
    id: "ps4-io",
    overview:
      "iO is a physics puzzle platformer about a rolling object that can grow or shrink to change speed, weight, and jump behavior. Players use size shifts to cross gaps, climb, launch, and squeeze through abstract levels. It is a clean mechanics-first puzzle game, best for players who enjoy experimenting with momentum and solving stages through movement rules rather than story or combat.",
  },
  {
    id: "ps4-ion-driver",
    overview:
      "Ion Driver is a futuristic arcade racer about high-speed hover vehicles, tight tracks, and quick reaction driving. Players compete across sci-fi circuits where handling, acceleration, and avoiding mistakes matter more than simulation realism. It is a small racing release for players who like anti-gravity speed, local competition, and direct arcade handling without a large career mode.",
  },
  {
    id: "ps4-iris-fall",
    overview:
      "Iris.Fall is a puzzle adventure with a monochrome, theatrical art style built around shifting between light, shadow, and physical space. Players guide Iris through strange rooms, manipulate shadows, and solve visual logic puzzles that feel like stage illusions. It is a compact atmospheric game for players who enjoy eerie presentation, quiet storytelling, and puzzles that use perspective as their main trick.",
  },
  {
    id: "ps4-iron-crypticle",
    overview:
      "Iron Crypticle is an arcade dungeon shooter inspired by twin-stick action, old fantasy coin-op games, and score-chasing survival. Players fight through rooms, collect food and treasure, upgrade shots, and try to keep momentum alive against swarms of enemies. It is best with players who enjoy retro co-op chaos, simple RPG flavor, and frantic screen-clearing action.",
  },
  {
    id: "ps4-iron-sea-defenders",
    overview:
      "Iron Sea Defenders is a naval-themed tower-defense game about protecting routes from waves of enemy ships using cannons, mines, and other defenses. Players place and upgrade weapons, read enemy paths, and adjust strategy as stages add pressure. It is a straightforward defensive puzzle for players who enjoy lane planning and incremental upgrades in a maritime setting.",
  },
  {
    id: "ps4-irony-curtain-from-matryoshka-with-love",
    overview:
      "Irony Curtain: From Matryoshka with Love is a satirical point-and-click adventure from Artifex Mundi set in a fictional communist state full of bureaucracy, propaganda, and absurd rules. Players solve inventory puzzles, talk through comic situations, and unravel a political farce as a naive journalist. It is a strong fit for adventure-game fans who enjoy satire, wordplay, and old-school puzzle chains.",
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
