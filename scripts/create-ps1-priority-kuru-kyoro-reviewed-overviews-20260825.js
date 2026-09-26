const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-kuru-kyoro-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-kuru-kuru-cube",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/135818-kuru-kuru-cube",
    overview:
      "Kuru Kuru Cube is a PlayStation puzzle game featuring characters from the Iwatobi Penguin Rocky x Hopper series. The core idea is not simple tile matching: players move a cursor over falling pieces to rotate them, then rotate the whole cube in four directions to line up four matching colors. With difficulty and speed settings plus multiple modes, it plays like a spatial color-matching puzzle built around orientation control rather than a flat falling-block board.",
  },
  {
    id: "ps1-kuru-kuru-panic",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-00651.html",
    overview:
      "Kuru Kuru Panic is a competitive color-matching puzzle game built around a rotating wheel. Colored drops fall toward the playfield, and the player turns the wheel to connect three or more matching drops before rows build up to the edge. Its twist is the circular arena: instead of sliding blocks left and right, players manage spacing around a wide wheel while reacting to drops that can land in different locations in quick succession.",
  },
  {
    id: "ps1-kurukuru-marumaru",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/93834-kuru-kuru-marumaru",
    overview:
      "KuruKuru MaruMaru is a Hudson and Japan Art Media PlayStation game with a cartoony driving-school premise. Rather than a standard racing title, it presents a string of school tests with instructors, date-like character scenes, and repeated trials after each lesson is cleared. The game is best treated as a quirky Japanese driving/action import, notable for its playful structure and Supernova music more than for serious vehicle simulation.",
  },
  {
    id: "ps1-kurukuru-twinkle-onegai-ohoshisama",
    sourceUrl: "https://puzzlechronicle.neocities.org/games/kurukuru",
    overview:
      "KuruKuru Twinkle: Onegai Ohoshisama is a Tomcat System color-matching puzzle game with a cute nighttime look and zodiac-themed cast. Puzzle Chronicle compares its feel to Panel de Pon: players use a two-by-two cursor to swap pieces horizontally or vertically, build combos, clear steel blocks, and spend stars on spell effects. It has more character and tactical texture than the old generic summary suggested, especially in versus play.",
  },
  {
    id: "ps1-kurumi-miracle",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-00786.html",
    overview:
      "Kurumi Miracle is a Banpresto adventure/simulation game about a young witch sent to an island for 100 days of training. Progress comes from talking to townspeople, clearing events, and using magic to help villagers rather than fighting through action stages. The countdown structure gives it a life-sim rhythm: explore the community, build routines, and guide Kurumi's growth while working through small character-driven tasks.",
  },
  {
    id: "ps1-kururin-pa",
    sourceUrl: "https://kotaku.com/games/kururin-pa-1",
    overview:
      "Kururin Pa! is a Sky Think Systems 2D competitive puzzle game built around character battles rather than solo logic stages. Kotaku's database describes eight characters and two main modes: a story mode against computer opponents and a battle mode against another player or CPU rival. Its key appeal is small-studio Japanese puzzle design, with versus pressure and character selection doing more work than story or presentation.",
  },
  {
    id: "ps1-kuubo-senki",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-01854.html",
    overview:
      "Kuubo Senki is a World War II naval strategy game from General Support and Unbalance, centered on commanding the Japanese fleet. PSXDataCenter describes a heavily menu-driven experience where players issue detailed orders before missions begin, making language comprehension and patience major barriers. It is not a sports game; it is a dense Japanese war simulation for players interested in fleet planning, historical scenarios, and slow tactical decision-making.",
  },
  {
    id: "ps1-kyoro-chan-no-purikura-daisakusen",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-01692.html",
    overview:
      "Kyoro-chan no Purikura Daisakusen is a cute 2D platform game starring the ChocoBall mascot Kyoro-chan. PSXDataCenter describes a PlayStation sequel to the Game Boy Kyoro-chan title, with cartoon stages, animal enemies, multiple attacks, and special balloon-powered moves. It belongs in the library as a Japanese character-license platformer: simple, colorful, and more directly action-based than the old adventure-game template implied.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on catalog, article, review, and specialist gameplay sources.",
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
