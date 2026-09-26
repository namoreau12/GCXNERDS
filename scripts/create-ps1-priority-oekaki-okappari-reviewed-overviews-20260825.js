const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-oekaki-okappari-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps1.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ps1-oekaki-puzzle",
    title: "Oekaki Puzzle",
    sourceUrl: "https://psxdatacenter.com/games/J/S/SLPS-02068.html",
    newOverview:
      "Oekaki Puzzle is the first SuperLite 1500 Series entry in Success's PlayStation nonogram line. It gives players more than 200 picture-logic puzzles across multiple grid sizes, with a tutorial for learning the number-clue rules. GCX should file it as a budget Japanese Picross-style release: simple presentation, dense puzzle value, and collectible interest tied to Success's run of low-price logic games.",
  },
  {
    gameId: "ps1-oekaki-puzzle-2",
    title: "Oekaki Puzzle 2",
    sourceUrl: "https://psxdatacenter.com/games/J/S/SLPM-86955.html",
    newOverview:
      "Oekaki Puzzle 2 continues Success's SuperLite nonogram formula on PlayStation, built around completing picture grids by reading row and column clues. The later three-in-one release groups the first three Oekaki Puzzle games together and describes each as carrying more than 200 puzzles with 5x5, 10x10, 15x15, and 20x20 grids. GCX should distinguish it as a straight sequel for players who want more handcrafted logic boards rather than new systems.",
  },
  {
    gameId: "ps1-oekaki-puzzle-3",
    title: "Oekaki Puzzle 3",
    sourceUrl: "https://psxdatacenter.com/games/J/S/SLPM-86955.html",
    newOverview:
      "Oekaki Puzzle 3 is another Success SuperLite 1500 Series nonogram release, later bundled with the first two games in Oekaki Puzzle Syuu. Its appeal is volume and portability within a home-console library: hundreds of short picture-logic puzzles, escalating grid sizes, and a clean ruleset that works well for repeated sessions. GCX should present it as a completionist entry in the Success Oekaki run, not a story-driven puzzle adventure.",
  },
  {
    gameId: "ps1-oekaki-puzzle-4",
    title: "Oekaki Puzzle 4",
    sourceUrl: "https://psxdatacenter.com/games/J/S/SLPM-86675.html",
    newOverview:
      "Oekaki Puzzle 4 is the fourth PlayStation nonogram game in Success's SuperLite 1500 Series. PSX DataCenter lists the same core structure that defines the line: more than 200 picture puzzles, several board sizes, and tutorial support for players learning nonogram logic. GCX should frame this as the series settling into a reliable low-cost puzzle format, useful for collectors tracking Japanese budget logic releases.",
  },
  {
    gameId: "ps1-oekaki-puzzle-5",
    title: "Oekaki Puzzle 5",
    sourceUrl: "https://psxdatacenter.com/games/J/S/SLPM-86800.html",
    newOverview:
      "Oekaki Puzzle 5 closes out the numbered Success Oekaki Puzzle run on the original PlayStation. Like the earlier volumes, it centers on solving nonogram grids to reveal images, with hundreds of boards and multiple puzzle sizes rather than arcade spectacle or narrative hooks. GCX should describe it as a late-series SuperLite puzzle volume for nonogram fans who want breadth and routine challenge.",
  },
  {
    gameId: "ps1-oh-no",
    title: "Oh No!",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-02764.html",
    newOverview:
      "Oh No! is an Asmik Ace PlayStation release cataloged by PSX DataCenter as an action/racing game, not the adventure title its old metadata implied. The Japanese release profile points to a playful, arcade-style oddity from late 2000, with Asmik Ace both developing and publishing. GCX should keep the description conservative: this is an obscure import where the value is the unusual action/racing identity and Asmik Ace provenance more than a widely documented feature set.",
  },
  {
    gameId: "ps1-oha-star-dance-dance-revolution",
    title: "Oha Star Dance Dance Revolution",
    sourceUrl: "https://en.wikipedia.org/wiki/Oha_Suta_Dance_Dance_Revolution",
    newOverview:
      "Oha Star Dance Dance Revolution is a Konami PlayStation DDR spin-off built around the Japanese children's TV program Oha Suta. It uses the DDR 3rdMix engine, has no arcade counterpart, and mixes Oha Suta songs with Konami originals and tracks from earlier DDR releases. GCX should pitch it as a Japan-only rhythm collectible: familiar dance-pad scoring, but with a TV tie-in song list that makes it distinct from the main DDR console line.",
  },
  {
    gameId: "ps1-oja-majo-do-re-mi-mahodou-dance-carnival",
    title: "Oja Majo Do-Re-Mi #: Mahodou Dance Carnival!",
    sourceUrl: "https://www.mobygames.com/game/214430/ojamajo-doremi-sharp-maho-do-dance-carnival/",
    newOverview:
      "Oja Majo Do-Re-Mi #: Mahodou Dance Carnival! turns the magical-girl anime into a Kids Station rhythm game for PlayStation. MobyGames describes it as an Ojamajo Doremi Sharp tie-in using the Kids Station controller, while franchise documentation places it among the PlayStation games based on the series. GCX should present it as a character-branded children's dance game, valuable to anime and peripheral collectors as much as rhythm-game fans.",
  },
  {
    gameId: "ps1-ojyousama-express",
    title: "Ojyousama Express",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-01495.html",
    newOverview:
      "Ojyousama Express is a MediaWorks love-adventure game set aboard a luxury express train traveling around Japanese islands toward Tokyo. PSX DataCenter describes the player as a young boy meeting passengers and train employees during the journey, while catalog records place the Japanese PlayStation release in July 1998. GCX should frame it as a travel-romance visual adventure import where setting, cast interaction, and language access define the experience.",
  },
  {
    gameId: "ps1-okada-toshi-no-tsume-shougi-kyoushitsu-nintei-ou",
    title: "Okada Toshi no Tsume Shougi Kyoushitsu Nintei-Ou",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01757.html",
    newOverview:
      "Okada Toshi no Tsume Shougi Kyoushitsu Nintei-Ou is a PlayStation shogi-training title endorsed by Toshi Okada, then president of the Japan Shogi Federation. PSX DataCenter describes more than 180 tsume shogi problems and a certification-style structure across three stages, with play focused on finding the correct moves from set positions rather than completing full matches. GCX should list it as a serious shogi study import, not a generic puzzle game.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing PS1 game record for ${gameId}`);
  return game.description || game.gcxOverview || game.overview || "";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const header = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];
const csv = [
  header.join(","),
  ...rows.map((row) =>
    [
      "ps1",
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority PS1 weak-template replacement with source-backed GCX editorial overview.",
      row.newOverview,
      "approved",
      "GCX Editorial",
    ]
      .map(csvCell)
      .join(",")
  ),
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rowCount: rows.length }, null, 2));
