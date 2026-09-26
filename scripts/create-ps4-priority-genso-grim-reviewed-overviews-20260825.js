const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-genso-grim-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-genso-no-rondo",
    overview:
      "Gensō No Rondo is a Touhou Project fan-game arena fighter that blends one-on-one duels with bullet-hell pressure. Players choose characters, manage distance, fire patterns, and special attacks while trying to read the opponent through a screen full of projectiles. Its appeal is very specific: part fighting game, part danmaku shooter, and best suited to players who enjoy matchup learning, dodging, and Touhou's character-driven world.",
  },
  {
    id: "ps4-ghost-blade-hd",
    overview:
      "Ghost Blade HD is a vertically scrolling shoot 'em up descended from Dreamcast-style arcade design, with compact stages, dense enemy waves, and score-focused play. Players choose ships, weave through bullet patterns, use bombs, and replay stages to improve routes and survival. It is a straightforward shmup for players who want quick runs, readable patterns, and old-school arcade pressure rather than a story-heavy action game.",
  },
  {
    id: "ps4-ghostbusters-the-video-game-remastered",
    overview:
      "Ghostbusters: The Video Game Remastered updates the 2009 action-adventure with the original cast's voices, proton-pack combat, ghost trapping, and a story that plays like a lost film sequel. Players explore haunted locations, wrangle spirits with beams and traps, and work alongside the team through set-piece missions. It is strongest as fan-service: a playable Ghostbusters adventure with jokes, gadgets, and recognizable supernatural chaos.",
  },
  {
    id: "ps4-ghoulboy-dark-sword-of-goblin",
    overview:
      "Ghoulboy: Dark Sword of Goblin is a retro action platformer about fighting through monsters, traps, and side-scrolling stages with swords, spears, and thrown weapons. It leans on familiar 16-bit-era rhythms: cautious jumps, enemy placement, boss fights, and a fantasy-horror look. Players looking for a modest, traditional platform adventure will find a game built around simple combat, stage memorization, and steady forward progress.",
  },
  {
    id: "ps4-ginga-force",
    overview:
      "Ginga Force is a story-structured vertical shoot 'em up from Qute, built around mission stages, selectable weapons, and a sci-fi conflict on the planet Seventia. Unlike many pure arcade shooters, it gives players loadout decisions and campaign progression alongside bullet patterns and boss fights. It fits shmup fans who want route learning and dodging, but also like tinkering with ship equipment between runs.",
  },
  {
    id: "ps4-glass-masquerade",
    overview:
      "Glass Masquerade is a stained-glass jigsaw puzzle game built around ornate clock faces inspired by countries around the world. Players rotate and place irregular glass pieces into circular designs, slowly revealing bright art-deco images. The appeal is calm concentration rather than difficulty spikes: it is a polished, meditative puzzle game for players who enjoy visual assembly, elegant presentation, and low-pressure completion.",
  },
  {
    id: "ps4-glass-masquerade-2",
    overview:
      "Glass Masquerade 2 continues the stained-glass puzzle format with a darker, more dreamlike tone and new elaborate circular images to assemble. Players fit oddly shaped pieces into intricate designs, using color, silhouette, and pattern recognition instead of timers or action pressure. It is a good follow-up for fans of the first game who want the same quiet puzzle ritual with moodier art and a slightly stranger atmosphere.",
  },
  {
    id: "ps4-god-s-trigger",
    overview:
      "God's Trigger is a fast top-down shooter where an angel and a demon tear through rooms of enemies in violent, one-hit-kill encounters. Players dodge, slash, shoot, teleport, and combine character abilities to clear stages with speed and precision. It has the Hotline Miami-style rhythm of planning, failing, and instantly retrying, with co-op adding an extra layer of coordination to the chaos.",
  },
  {
    id: "ps4-gods-will-fall",
    overview:
      "Gods Will Fall is an action-adventure roguelite about a band of Celtic warriors trying to kill cruel gods in their own dangerous realms. Each warrior has different traits and morale, and losing one can permanently reshape the campaign. The game is about risk and commitment: choosing who enters a god's lair, learning that realm's hazards, and accepting that a failed battle can cost more than a simple restart.",
  },
  {
    id: "ps4-going-under",
    overview:
      "Going Under is a satirical dungeon crawler set in failed tech startups, where unpaid interns smash through office-themed monsters with keyboards, coffee mugs, and whatever else is lying around. Players explore procedurally arranged dungeons, learn skills from mentors, and turn workplace absurdity into brawling comedy. It stands out through its visual style and jokes, but underneath is a readable action roguelite about improvising with temporary weapons.",
  },
  {
    id: "ps4-golf-zero",
    overview:
      "Golf Zero turns golf into a precision platformer, asking players to jump through hazards and hit shots in midair before landing or dying. Each compact stage mixes timing, movement, and ball placement, so clearing a hole feels more like solving an action puzzle than lining up a quiet putt. It is a small, clever game for players who enjoy quick retries, absurd sports hybrids, and bite-sized challenge rooms.",
  },
  {
    id: "ps4-gonner",
    overview:
      "GoNNER is a tough roguelike platform shooter with a loose, surreal art style and runs built around heads, weapons, backpacks, and fast improvisation. Players guide Ikk through shifting levels, chaining kills and adapting to pickups while death resets the run. It is intentionally strange and demanding, rewarding players who can read chaotic rooms, keep moving, and turn odd equipment combinations into momentum.",
  },
  {
    id: "ps4-gonner-2",
    overview:
      "GoNNER2 expands the original's surreal roguelike platforming with bigger spaces, brighter chaos, and more ways for a run to spiral out of control. Players jump, shoot, swap gear, and fight through unpredictable rooms where survival depends on motion and quick adaptation. It keeps the first game's abstract personality while making the action feel busier, looser, and more explosive.",
  },
  {
    id: "ps4-goosebumps-the-game",
    overview:
      "Goosebumps: The Game is a point-and-click adventure built around R.L. Stine's horror-for-kids universe, with familiar monsters, item puzzles, and a creepy suburban setup. Players investigate locations, collect objects, solve adventure-game logic chains, and try to survive encounters with creatures pulled from the books. It works best for Goosebumps fans and players who enjoy light puzzle adventures with spooky charm rather than fast action.",
  },
  {
    id: "ps4-gothic-murder-adventure-that-changes-destiny",
    overview:
      "Gothic Murder: Adventure That Changes Destiny is a visual-novel mystery about a maid trying to prevent her master's foretold death in a gothic mansion setting. Players read scenes, make choices, inspect clues, and steer the investigation toward different outcomes. Its focus is suspense and deduction through branching story decisions, making it a better fit for mystery readers than players looking for mechanical puzzles or combat.",
  },
  {
    id: "ps4-grab-the-bottle",
    overview:
      "Grab the Bottle is a puzzle game about stretching an endlessly winding arm through obstacle-filled rooms to reach a bottle without hitting hazards. Each stage asks players to plan a path, thread through tight spaces, trigger mechanisms, and avoid trapping the arm. The odd premise gives it personality, but the main hook is spatial problem solving: figuring out how one absurdly long reach can snake through the level cleanly.",
  },
  {
    id: "ps4-grand-ages-medieval",
    overview:
      "Grand Ages: Medieval is a large-scale strategy game about expanding a medieval realm through trade routes, city growth, diplomacy, research, and warfare. Players manage settlements, connect economies, recruit armies, and push influence across a broad map. It is slower and more systemic than a battle-first strategy game, aimed at players who enjoy watching logistics, commerce, and territorial planning turn into power over time.",
  },
  {
    id: "ps4-grand-prix-rock-n-racing",
    overview:
      "Grand Prix Rock N Racing is an arcade-style racing game with a top-down view, simple handling, and a focus on quick championship events. Players steer through crowded tracks, manage corners, and try to climb the field without the complexity of a full racing sim. It is best approached as a lightweight local-arcade racer: direct, modest, and built around short sessions rather than deep car tuning.",
  },
  {
    id: "ps4-gravity-heroes",
    overview:
      "Gravity Heroes is an arena shoot 'em up where players can shift gravity to fight on floors, walls, and ceilings while enemies attack from every direction. The gravity-switching mechanic turns each battle into a movement puzzle as much as a shooting challenge. It supports solo and multiplayer play, making it a strong fit for players who like chaotic arcade combat with a clear mechanical twist.",
  },
  {
    id: "ps4-grey-skies-a-war-of-the-worlds-story",
    overview:
      "Grey Skies: A War of the Worlds Story is a small-scale action-adventure inspired by H.G. Wells' alien invasion, following a survivor through a bleak countryside under Martian threat. Players sneak, scavenge, solve light puzzles, and push through tense story sequences while avoiding overwhelming machines. Its rough edges are part of a modest indie scope, but the appeal is the grounded survival mood of a classic sci-fi disaster.",
  },
  {
    id: "ps4-gridd-retroenhanced",
    overview:
      "Gridd: Retroenhanced is a neon tunnel shooter about breaking into a digital security system while dodging barriers, blasting defenses, and chasing high scores. The game moves quickly down a track, asking players to react to patterns, collect power, and survive escalating electronic hazards. It is a pure arcade entry for players who like synth-heavy presentation, simple controls, and the pressure of one more run.",
  },
  {
    id: "ps4-grim-legends-2-song-of-the-dark-swan",
    overview:
      "Grim Legends 2: Song of the Dark Swan is a hidden-object fantasy adventure about a healer drawn into a kingdom's curse, missing children, and a royal mystery. Players search detailed scenes, solve inventory puzzles, and move through painted storybook locations in Artifex Mundi's accessible adventure style. It is built for players who want a compact fairy-tale mystery with clear puzzle flow and a steady supernatural plot.",
  },
  {
    id: "ps4-grim-legends-3-the-dark-city",
    overview:
      "Grim Legends 3: The Dark City follows a monster hunter investigating a city threatened by dark forces, shifting the series toward a gothic detective-fantasy tone. Players examine hidden-object scenes, solve puzzles, collect clues, and unravel a case through lavishly illustrated locations. It is a casual adventure for players who enjoy supernatural mysteries, readable objectives, and puzzle variety without heavy mechanical friction.",
  },
  {
    id: "ps4-grim-legends-the-forsaken-bride",
    overview:
      "Grim Legends: The Forsaken Bride is a hidden-object adventure set around a wedding, an old village legend, and a missing bride. Players explore fairy-tale environments, gather items, solve scene puzzles, and uncover the curse-like mystery behind the celebration. It is one of Artifex Mundi's classic-style casual adventures, best for players who want atmospheric fantasy, approachable puzzles, and a self-contained story.",
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
