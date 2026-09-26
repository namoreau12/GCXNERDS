const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-marsmoose-cosmic-walkabout-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-mars-moose-cosmic-quest-1-city-sights",
    sourceUrl: "https://psxdatacenter.com/games/U/L/LSP-010170.html",
    overview:
      "Mars Moose Cosmic Quest 1: City Sights is part of Lightspan's school-focused PlayStation learning line. The disc sends Mars Moose through city scenes built around new vocabulary, reading practice, and child-friendly point-and-click exploration. It is best understood as classroom educational software with short activities and guided language goals, not a commercial platform adventure.",
  },
  {
    id: "ps1-mars-moose-cosmic-quest-2-fairy-tale-island",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/163472-mars-moose-cosmic-quest-2-fairy-tale-island",
    overview:
      "Mars Moose Cosmic Quest 2: Fairy Tale Island is an early-childhood Lightspan reading adventure. Mars searches Fairy Tale Island for pieces of a torn map that can help find Cosmo, while the player completes rhyming and phonogram-family activities. The game is built around literacy objectives such as identifying rhyming words and extending word patterns, wrapped in simple storybook exploration.",
  },
  {
    id: "ps1-mars-moose-cosmic-quest-3-race-through-france",
    sourceUrl: "https://www.mobygames.com/game/150711/a-mars-moose-adventure-cosmic-quest-3-race-through-france/",
    overview:
      "Mars Moose Cosmic Quest 3: Race Through France turns a school report on France into a Lightspan learning trip. Mars and Starboard join an international bicycle race across French countryside locations, visiting areas such as farms, a circus, and mountain trails while practicing alphabetizing and language skills. It plays as an educational minigame adventure rather than a conventional racing title.",
  },
  {
    id: "ps1-mars-moose-stay-and-play-1-in-the-clubhouse",
    sourceUrl: "https://gamesdb.launchbox-app.com/publishers/games/7213-lightspan",
    overview:
      "Mars Moose Stay & Play 1: In the Clubhouse is a Lightspan educational disc centered on science concepts and vocabulary development. Instead of a traditional score-driven structure, it uses Mars Moose and supporting characters to guide children through classroom-style activities inside a clubhouse setting. The title matters for PS1 collectors as part of the unusual school-distributed Lightspan library.",
  },
  {
    id: "ps1-mars-moose-stay-and-play-2-in-mars-bedroom",
    sourceUrl: "https://psxdatacenter.com/games/U/L/LSP-010260.html",
    overview:
      "Mars Moose Stay & Play 2: In Mars' Bedroom shifts the Lightspan formula toward reading and language arts. The bedroom setting frames simple interactive activities that ask young players to practice vocabulary, listening, and early literacy skills. Like other Lightspan discs, its design is closer to a guided classroom software lesson than a normal retail PlayStation game.",
  },
  {
    id: "ps1-mars-moose-stay-and-play-3-in-lonnie-s-classroom",
    sourceUrl: "https://psxdatacenter.com/games/U/L/LSP-010360.html",
    overview:
      "Mars Moose Stay & Play 3: In Lonnie's Classroom casts the child as a world explorer while building science, map geography, reading-comprehension, and vocabulary skills. The PlayStation disc uses the Lightspan formula of short narrated tasks and gentle exploration instead of action challenges. Its value is mostly educational-history and Lightspan-library context.",
  },
  {
    id: "ps1-mars-moose-walkabout-1-the-natural-history-museum",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/96289-mars-moose-adventure-walkabout-1-the-natural-history-museum",
    overview:
      "Mars Moose Walkabout 1: The Natural History Museum is a Lightspan reading-comprehension adventure set around a museum mystery. Players help Lonnie find missing Tyrannosaurus rex bones while practicing nonfiction reading, listening, problem-solving, letters, shapes, colors, and wildlife vocabulary. The first-person presentation is simple, with learning objectives driving the interaction.",
  },
  {
    id: "ps1-mars-moose-walkabout-2-the-shakespeare-festival",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/163468-mars-moose-adventure-walkabout-2-the-shakespeare-festival",
    overview:
      "Mars Moose Walkabout 2: The Shakespeare Festival moves the Lightspan lessons into a stage-production setting. Mars and the Adams Street Rangers organize props, scripts, and orchestra instruments while the player practices story structure, vocabulary, sound matching, sorting, and classification. It is a literacy-and-arts learning title, notable mainly as part of the niche PlayStation Lightspan catalog.",
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
    if (!game) throw new Error(`Missing PS1 game ${rewrite.id}`);
    rows.push([
      "ps1",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on Lightspan catalog, specialist database, and gameplay-description sources.",
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
