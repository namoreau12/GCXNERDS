const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-maboroshi-magicalmedical-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-maboroshi-tsukiyo",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03143.html",
    overview:
      "Maboroshi Tsukiyo is a Japanese visual novel adventure about Takashi Tanaka, a student whose summer is disrupted when he meets a ghostly girl in a park. The story unfolds through first-person reading, character conversations, romance and mystery choices, and a day-by-day calendar structure between June and September. It is a language-heavy import whose appeal comes from mood, supernatural drama, and branching story atmosphere rather than simulation systems.",
  },
  {
    id: "ps1-mad-panic-coaster",
    sourceUrl: "https://www.hardcoregaming101.net/mad-panic-coaster/",
    overview:
      "Mad Panic Coaster is a strange PlayStation action game about surviving unsafe roller-coaster tracks rather than traditional racing. Players guide Bakuyan and Kyako through 15 hazard-filled courses, jumping gaps, dodging obstacles, shooting enemies, and fighting bosses while the cart barrels forward. Its collector appeal comes from the odd premise and frantic on-rails design: it feels closer to an obstacle-course action game than a normal driving title.",
  },
  {
    id: "ps1-madden-nfl-2004",
    sourceUrl: "https://www.gamestop.com/video-games/retro-gaming/products/madden-nfl-2004---playstation-1/20030882.html",
    overview:
      "Madden NFL 2004 is one of the final Madden releases on the original PlayStation, bringing the 2003 NFL season, Michael Vick cover-era rosters, and a familiar broadcast-style football package to aging hardware. The PS1 version keeps the core play-calling, passing, running, defensive reads, season play, and franchise structure, but presents them in a more stripped-down form than the newer-console versions that defined Owner Mode hype.",
  },
  {
    id: "ps1-magical-dice-kids",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SCPS-10135.html",
    overview:
      "Magical Dice Kids is a Sony-published Japanese board game built around dice rolls, event spaces, shops, items, and turn-based movement across 3D boards. Story mode follows a young character through four board stages, while versus play supports multiple players through the PlayStation multitap. It belongs with party-style board games: the fun comes from route luck, space effects, and item use rather than action or puzzle solving.",
  },
  {
    id: "ps1-magical-drop-f-daibouken-mo-rakujyanai",
    sourceUrl: "https://en.wikipedia.org/wiki/Magical_Drop_F%3A_Daib%C5%8Dken_Mo_Rakujyanai%21",
    overview:
      "Magical Drop F: Daibouken Mo Rakujyanai! is the PlayStation-only fourth entry in Data East's fast competitive puzzle series. The familiar playfield has players grab colored drops from a descending stack and return them in matching groups to trigger clears and chains. What makes this entry distinct is its RPG-style mode, where Justice travels through villages, challenges characters, and collects items and power-ups while searching for seven Magical Drops.",
  },
  {
    id: "ps1-magical-drop-iii",
    sourceUrl: "https://en.wikipedia.org/wiki/Magical_Drop_III",
    overview:
      "Magical Drop III brings Data East's arcade puzzle format to PlayStation with quick reactions, chain-heavy clearing, and competitive pressure. Players move along the bottom of the playfield, pull colored drops from a falling stack, then throw them back to form vertical matches of three or more. The PlayStation release is important because it preserves both fast versus play and the board-style Magical Journey mode built around the series' tarot-inspired cast.",
  },
  {
    id: "ps1-magical-drop-iii-yokubari-tokudaigou",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-86051.html",
    overview:
      "Magical Drop III: Yokubari Tokudaigou! is the Japanese PlayStation version of Magical Drop III, packaging the arcade puzzle formula with console extras and tuning. The core remains frantic drop grabbing and column matching, where chains push pressure back onto the rival field. This version is notable for giving players a home-port take on Data East's late arcade hit, including competitive modes and the adventurous board-game side mode.",
  },
  {
    id: "ps1-magical-medical",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-86099.html",
    overview:
      "Magical Medical is a Konami PlayStation RPG with an unusual body-invasion premise. Players enter patients' bodies, viewed from an isometric perspective, and fight virus-like enemies through stage-based areas while working to cure six different patients. Its draw is the medical fantasy filtered through light dungeon-crawling: explore internal spaces, defeat threats, and push each treatment scenario toward recovery.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on review, database, retail, and specialist gameplay sources.",
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
