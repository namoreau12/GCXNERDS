const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-logic-lordmonarch-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-logic-mahjong-souryu",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-00642.html",
    overview:
      "Logic Mahjong Souryu is a Japanese PlayStation mahjong release with 16 selectable characters and several rule styles, including Edit, Debug, Free Play, and Story modes. The story mode gives the player a mahjong-player role and advances by defeating opponents at the table. Its value is in character variety and rule options rather than visual spectacle: learn the table flow, pick a mode, and work through match after match.",
  },
  {
    id: "ps1-logic-mahjong-souryu-3-player-version",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-02036.html",
    overview:
      "Logic Mahjong Souryu: 3-Player Version revises Nippon Ichi's mahjong package around both three-player and four-player styles. PSXDataCenter notes the same 16-character structure and a story mode starring Katsumi Akisato, who progresses by beating other mahjong players. The reason to separate this entry from the original is the table format: it is aimed at players who specifically want alternate mahjong rules and a compact character-driven ladder.",
  },
  {
    id: "ps1-logic-pro-adventure",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-03011.html",
    overview:
      "Logic Pro Adventure brings Amuse World's arcade nonogram series to PlayStation with a bright cartoon wrapper and a huge puzzle count. PSXDataCenter lists more than 1,000 puzzles, three playable characters, and a two-player cooperative mode. It is not a story adventure in the usual sense; progression comes from solving picture-logic grids, clearing themed puzzle sets, and using the character presentation to make a dense puzzle package feel more playful.",
  },
  {
    id: "ps1-logic-puzzle-rainbow-town",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-00268.html",
    overview:
      "Logic Puzzle Rainbow Town is Human Entertainment's PlayStation nonogram game, built around more than 700 puzzles and an editor for making original grids. The game includes black-and-white logic puzzles, color logic, and rainbow-style puzzles, with the town growing as players clear problems. It should be described as a Picross-style logic package: the attraction is deduction, grid completion, and steadily revealing pictures through careful number reading.",
  },
  {
    id: "ps1-london-racer",
    sourceUrl: "https://psxdatacenter.com/games/P/L/SLES-02694.html",
    overview:
      "London Racer is Davilex's PAL street-racing game built around tourist-landmark fantasy more than simulation precision. The player starts as a rookie illegal racer and drives around routes near places such as St Paul's, Regent Street, and Big Ben while building toward faster cars. It is a blunt, budget-era arcade racer: choose a route, handle traffic and bends, and enjoy the novelty of recognisable London scenery on PS1 hardware.",
  },
  {
    id: "ps1-london-racer-ii",
    sourceUrl: "https://psxdatacenter.com/games/P/L/SLES-03822.html",
    overview:
      "London Racer II expands Davilex's racing formula beyond London, adding routes inspired by U.S. cities such as Las Vegas, New York, and Chicago. PSXDataCenter's manufacturer text emphasizes jumps, collisions, visual damage, multiple modes, and character/car selection, plus a Kiss FM tie-in. The result is still simple budget arcade racing, but the sequel leans harder into stunts, landmarks, and broader city variety.",
  },
  {
    id: "ps1-london-seirei-tantei-dan",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-01787.html",
    overview:
      "London Seirei Tantei-dan, also known by fan translators as London Spirit Detectives, is a Japan-only Bandai RPG set in a fantasy version of Victorian London filled with spirits and mysteries. Exploration centers on walking around London, talking to characters, and advancing detective cases, while combat scenes use different attacks against enemies. Its appeal is the unusual setting: anime-style detective work, supernatural atmosphere, and case-based progression rather than generic dungeon crawling.",
  },
  {
    id: "ps1-lord-monarch-shin-gaia-oukokuki",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-01728.html",
    overview:
      "Lord Monarch: Shin Gaia Oukokuki adapts Nihon Falcom's Dragon Slayer-linked real-time strategy war game for PlayStation. Players manage territory, units, and conflict against rival kingdoms, with the broader Lord Monarch design built around expanding control, using workers and soldiers, and breaking enemy camps before the map turns against them. This PS1 release adds story-mode presentation and voice work, making it a console-friendly version of a strategy series with PC roots.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on database, specialist, review, and catalog gameplay sources.",
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
