const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-kyoto-lagnacure-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-kyoto-bugi-monogatari",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-03193.html",
    overview:
      "Kyoto Bugi Monogatari, listed by PSXDataCenter as Kyoto Maiko Monogatari, is a Japan-only PlayStation simulation/adventure release from Visit built around Kyoto's maiko culture. It uses 2D presentation, a first-person perspective, and Japanese-voiced video sequences rather than action stages. The appeal is cultural atmosphere and character interaction: players move through a traditional-entertainment setting, follow scenario scenes, and experience a niche slice of late-PS1 Japanese life-sim design.",
  },
  {
    id: "ps1-kyoufu-shinbun",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-00503.html",
    overview:
      "Kyoufu Shinbun is a horror adventure game from Atelier Double and Yutaka based on the manga about a mysterious newspaper that predicts deaths and disasters. PSXDataCenter notes that reading the newspaper shortens the protagonist's life to 100 days, giving the premise a built-in countdown and fatalistic mystery hook. It is better described as a Japanese horror-adventure adaptation than as an RPG, with its interest coming from scenario tension and source-material atmosphere.",
  },
  {
    id: "ps1-kyoutei-wars-mark-6",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-03451.html",
    overview:
      "Kyoutei Wars: Mark 6 is a boat-racing simulation from ParityBit, not a general puzzle game. The player chooses and customizes a male or female boat-race pilot, tunes stats and equipment details, joins a team, and works toward the Kyoutei championship. Its hook is the specialized world of Japanese hydroplane racing: progression, pilot setup, and race management matter as much as the moment-to-moment contest on the water.",
  },
  {
    id: "ps1-kyuin",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-00214.html",
    overview:
      "Kyuin is a playful horizontal shoot-'em-up from Media Entertainment where the heroes fly through fairy-tale stages on a vacuum cleaner. The vacuum is more than a joke: players can suck in bullets and certain enemies, then turn that stored material into special power. With seven stages, two-player support, 2D backgrounds, and pre-rendered character models, it stands out as a cute import shooter with a distinct defensive mechanic.",
  },
  {
    id: "ps1-kyuukuoku-no-soukoban",
    sourceUrl: "https://app.lizardbyte.dev/GameDB/browse/games/?id=98183",
    overview:
      "Kyuukuoku no Soukoban, also romanized as Kyuukyoku no Soukoban, is a PlayStation entry in Thinking Rabbit's long-running Sokoban puzzle lineage. The core appeal is the classic warehouse-keeper problem: push crates into target positions without trapping yourself or blocking future moves. This version is best understood as a 3D Puzzle & Cinema take on Sokoban, preserving the deliberate one-step-at-a-time logic while packaging it for a mid-1990s PlayStation audience.",
  },
  {
    id: "ps1-l-no-kisetsu-a-piece-of-memories",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-02204.html",
    overview:
      "L no Kisetsu: A piece of memories is a Tonkin House digital novel for PlayStation where choices shape both the route and the characters' emotional states. PSXDataCenter describes a structure that moves between a real-world setting and a fantasy world, so the draw is not reflex play but mood, branching decisions, and character relationships. It belongs in the library as a late-1990s Japanese visual novel with a dual-world premise.",
  },
  {
    id: "ps1-lagnacure",
    sourceUrl: "https://gamegear.net/archive/games/psx/lagnacure-japan-artdink-best-choice",
    overview:
      "Lagnacure is an Artdink PlayStation RPG with an isometric 3D presentation and bright, cartoon-styled characters. Rather than being a rhythm game, it sends a party into a fantasy adventure built around exploration, character growth, and turn-based RPG structure. Its identity fits Artdink's offbeat catalog: a smaller Japanese role-playing release with a distinct look, a group-cast adventure frame, and import appeal for players who enjoy lesser-known PS1 RPGs.",
  },
  {
    id: "ps1-lagnacure-legend",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-02832.html",
    overview:
      "Lagnacure Legend is Artdink's fully 3D sequel to Lagnacure, set fifteen years after the first game and centered on the next generation of the story. PSXDataCenter highlights a new Active Real Time Battle system with fighting-game-style commands, special attacks, combos, and a defend button. It also lets players follow eight characters with their own stories, making it a more ambitious and action-oriented RPG follow-up than the original.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on catalog, archive, database, and specialist gameplay sources.",
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
