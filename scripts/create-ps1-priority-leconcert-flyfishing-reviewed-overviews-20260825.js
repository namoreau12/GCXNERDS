const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-leconcert-flyfishing-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-le-concert-pp",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-02343.html",
    overview:
      "Le Concert pp, short for Pianissimo, is a PlayStation rhythm game about conducting classical music rather than fighting through a strategy map. The player guides a young orchestra conductor through five performances, starting with a small ensemble and building toward a larger concert. Stages are cleared by pressing the correct PlayStation buttons in time with the music, with story scenes between performances giving the two Le Concert releases a light character-driven frame.",
  },
  {
    id: "ps1-leading-jockey-99",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-01886.html",
    overview:
      "Leading Jockey '99 is a Japanese horse-racing game that expands the earlier Highbred format with breeding before the race-day action begins. Players pair horses to produce a new runner, then race across different tracks and weather conditions. The riding model is arcade-like, asking players to pump the Circle button for speed while managing stamina so the horse still has enough energy for the final stretch.",
  },
  {
    id: "ps1-leading-jockey-highbred",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-00348.html",
    overview:
      "Leading Jockey: Highbred is the first PlayStation entry in Harvest One's horse-racing series, focused on the fantasy of building and riding competitive racehorses. It is less about licensed sports presentation and more about learning when to push, hold back, and position a horse during a race. For players who enjoy niche Japanese sports sims, the hook is the jockey perspective: success depends on timing the run and handling the horse rather than simply selecting plays from a menu.",
  },
  {
    id: "ps1-legend-of-mulan",
    sourceUrl: "https://psxdatacenter.com/games/P/L/SLES-04145.html",
    overview:
      "Legend of Mulan is a PAL budget PlayStation release from Phoenix Games and The Code Monkeys, built as an interactive children's activity disc rather than a role-playing adventure. PSXDataCenter classifies it as a puzzle and colouring-book game, which better explains what players actually do: watch simple animated story material, solve light jigsaw-style activities, and use colouring sections tied to the Mulan theme. Its value is mostly as a curiosity from the European late-life PS1 budget market.",
  },
  {
    id: "ps1-legend-of-pocahontas",
    sourceUrl: "https://psxdatacenter.com/games/P/L/SLES-02955.html",
    overview:
      "Legend of Pocahontas is another European children's activity release from The Code Monkeys, published by Midas Interactive. Rather than a conventional adventure or RPG, it combines a cartoon-film presentation with jigsaw puzzles and a colouring-game mode based around the Pocahontas story. The result is closer to an interactive storybook and activity disc than a challenge-driven PlayStation game, which makes it important to describe clearly for collectors browsing unusual PAL budget releases.",
  },
  {
    id: "ps1-lego-no-sekai",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-03322.html",
    overview:
      "Kids Station: LEGO no Sekai is a Japan-exclusive PlayStation educational game aimed at young children. It uses an animal world built from LEGO pieces to teach basics such as numbers, letters, shapes, and early problem-solving through small training activities. The appeal is not platforming or open-ended LEGO construction; it is a preschool learning disc with bright characters, Japanese-language menus, and minigames starring animals such as pandas, elephants, monkeys, and ponies.",
  },
  {
    id: "ps1-lemmings-and-oh-no-more-lemmings",
    sourceUrl: "https://www.mobygames.com/game/12725/lemmings-oh-no-more-lemmings/",
    overview:
      "Lemmings & Oh No! More Lemmings brings two complete entries in DMA Design and Psygnosis's classic puzzle series to PlayStation. Each stage drops a stream of lemmings into a hazardous map, and the player assigns limited skills such as digging, building, blocking, and climbing to guide enough of them to the exit. The included Oh No! More Lemmings levels are known for a sharper difficulty curve, making this package a substantial puzzle compilation rather than a simple nostalgia port.",
  },
  {
    id: "ps1-let-s-go-flyfishing",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-01827.html",
    overview:
      "Let's Go Flyfishing is a Japan-only Victor Interactive Software fishing game centered specifically on fly-fishing rather than broad arcade angling. It asks players to treat casting, water position, and fish behavior as the core challenge, with a quieter pace than tournament-style bass games. The PlayStation release is especially useful for collectors because it sits inside Victor's wider fishing catalog while focusing on a more specialized style of tackle and technique.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on catalog, database, and specialist gameplay sources.",
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
