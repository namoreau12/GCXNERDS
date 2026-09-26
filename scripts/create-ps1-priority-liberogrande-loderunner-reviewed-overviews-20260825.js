const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-liberogrande-loderunner-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-liberogrande-international",
    sourceUrl: "https://psxdatacenter.com/games/P/L/SCES-03254.html",
    overview:
      "Liberogrande International is Namco's sequel to LiberoGrande, the soccer series built around controlling one selected player from a close third-person view instead of commanding the whole team at once. This update adds create-a-player editing, friendly matches, cup play, a world-league mode, split-screen play, and post-match grading with statistical graphs. Its identity is the on-pitch role-playing feel: calling for passes, choosing when to shoot or intercept, and influencing the match from a single position.",
  },
  {
    id: "ps1-lifescape-2-bosy-bionics",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-00629.html",
    overview:
      "LifeScape 2: Body Bionics is a Japanese educational PlayStation release that turns human biology into a small sci-fi action scenario. The player controls a robot sent inside a human body by a doctor to cure illnesses, destroying hazards and enemies from within. It is not a traditional adventure; the hook is the odd mix of medical learning, futuristic body exploration, and simple shooting sequences inside organs and biological systems.",
  },
  {
    id: "ps1-light-fantasy-gaiden-nyanyan-ga-nyan",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02336.html",
    overview:
      "Light Fantasy Gaiden: Nyanyan ga Nyan is a Tonkin House spin-off that follows a young cat-tribe girl on a quest for a crystal ball. The adventure sends her through a fantasy journey where she meets other characters, faces danger, and changes outfits along the way. Compared with the main Light Fantasy RPG line, this PlayStation side story is most useful to collectors as a cute, character-driven import with a specific fairy-tale quest rather than a generic party-building epic.",
  },
  {
    id: "ps1-ling-rise",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-01769.html",
    overview:
      "Ling Rise is a Japan-only PlayStation action RPG from Atelier Double and Epoch, classified by PSXDataCenter as a blend of action, platforming, and RPG play. That mix matters: it suggests a more active, movement-heavy approach than a menu-only role-playing release. For players browsing imports, the draw is its late-1999 PS1 style, anime-fantasy presentation, and hybrid structure where exploration and action sit alongside character progression.",
  },
  {
    id: "ps1-lion-and-the-king",
    sourceUrl: "https://psxdatacenter.com/games/P/L/SLES-02953.html",
    overview:
      "Lion and the King is a PAL budget activity disc from The Code Monkeys and Midas Interactive, loosely built around a lion-prince story rather than Disney's official Lion King license. PSXDataCenter describes a cartoon film about Robin, son of the lion king, searching for the Black Panther's treasure, plus jigsaw puzzles and a colouring mode. It is best understood as an interactive children's storybook and activity release, not an RPG.",
  },
  {
    id: "ps1-lion-and-the-king-2",
    sourceUrl: "https://psxdatacenter.com/games/P/L/SLES-04065.html",
    overview:
      "Lion And The King 2 is a Phoenix Games PAL activity release developed by The Code Monkeys, continuing the same budget interactive-cartoon format as the first game. The package is built around simple children's activities such as puzzle and colouring-book play tied to a Dingo Pictures-style animated story. Its appeal is mostly historical and collector-focused: it belongs to the unusual late PS1 European budget wave, where movie-like playback and basic minigames replaced conventional action.",
  },
  {
    id: "ps1-little-lovers-she-so-game",
    sourceUrl: "https://kotaku.com/games/little-lovers-she-so-game",
    overview:
      "Little Lovers: She So Game is a board-game-style spin-off from NTT's Little Lovers series, built around social competition rather than a straight visual novel route. Players move around a virtual board and compete over three in-game years to win the affection of one of six high-school girls. It keeps the character-interaction focus of the franchise, but the structure is closer to a dating-sim party board game with dice movement and event spaces.",
  },
  {
    id: "ps1-lode-runner-extra",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-00641.html",
    overview:
      "Lode Runner Extra is a PlayStation puzzle-platform expansion to the Lode Runner: The Legend Returns style of play. Jake must collect treasure and escape caverns while outwitting Mad Monks and rival Lode Runners, but this version adds tools such as bombs, goo, and teleporters to the familiar digging-and-escape formula. The challenge is less about speed than route planning, trap use, and reading each stage's layout before enemies close in.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on catalog, database, review, and specialist gameplay sources.",
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
