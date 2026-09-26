const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-lake-concert-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-lake-masters",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-00408.html",
    overview:
      "Lake Masters is a Japanese PlayStation fishing game from Nexus Interact and Dazz, built around bass angling rather than a generic sports-season loop. PSXDataCenter lists four modes: Tournament, Lake Make, Free Mode, and Versus Mode, with fishing spots including Water Melon and Kissimmee. The appeal is in selecting conditions, learning each lake, and treating lure choice and casting decisions as the main challenge.",
  },
  {
    id: "ps1-lake-masters-2",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-01342.html",
    overview:
      "Lake Masters 2: Bass Fishing in Japan narrows the series into a focused PlayStation fishing sim with Tournament and Free Fishing modes. Players fish across different lakes, adjusting their approach around location and conditions rather than racing through arcade events. As a Japan-only bass-fishing sequel, its appeal is methodical tackle selection, patient casting, and chasing larger catches.",
  },
  {
    id: "ps1-lake-masters-pro",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-02177.html",
    overview:
      "Lake Masters Pro is the third PlayStation entry in the Lake Masters fishing series, expanding the format with eighteen lakes and roughly 130 fishing points. PSXDataCenter lists Travel, Free Fishing, Lure Trade, VS, and World Monster Fish modes, which gives it more structure than the earlier games. It is a collector-relevant bass-fishing sim because it turns lake variety, lure management, and long-form angling goals into the main progression.",
  },
  {
    id: "ps1-langrisser-i-and-ii",
    sourceUrl: "https://en.wikipedia.org/wiki/Langrisser",
    overview:
      "Langrisser I & II is a PlayStation compilation of the first two entries in Masaya and NCS's fantasy tactical RPG series. The games are scenario-based strategy RPGs where commanders hire troops, fight turn-based battles, and use commander ranges and unit matchups to control large maps. The second game is especially notable for branching versions and faction choices in later releases, making the package important for strategy fans tracking the series before its modern remakes.",
  },
  {
    id: "ps1-largo-winch-commando-sar",
    sourceUrl: "https://gameinformer.com/b/features/archive/2015/04/11/replay-largo-winch-commando-sar.aspx",
    overview:
      "Largo Winch.//Commando Sar is a PlayStation action-adventure from Rebellion and Ubisoft based on the Largo Winch TV/comic property. Game Informer highlighted it as a stealth-focused licensed game that handles stealth differently from the era's better-known examples. The player steps into Largo's corporate-thriller world, where sneaking, mission objectives, and low-budget PS1 action design matter more than broad strategy or party management.",
  },
  {
    id: "ps1-las-vegas-dream-2",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-00732.html",
    overview:
      "Las Vegas Dream 2 is a PlayStation casino simulation from Imagineer and Dice with a strange story wrapper around traditional gambling games. PSXDataCenter describes Virtual Mode as a campaign where an alien gambler visits the Galaxy Hotel in Las Vegas and tries to become a millionaire through poker, blackjack, roulette, slots, craps, and keno. Practice-style play and rule familiarity drive the experience, but the sci-fi casino framing gives it more personality than a plain table-game menu.",
  },
  {
    id: "ps1-lattice-200ec7",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPM-86491.html",
    overview:
      "Lattice: 200EC7 is not a static puzzle game; it is a fast first-person abstract rail shooter from Nousite and Hamster. Players pilot a ship along square pathways, shifting sides, jumping obstacles, shooting enemies, and choosing routes at junctions while the stage moves at high speed. Contemporary writing has compared its forward-rushing obstacle play to a first-person variant of Bit.Trip Runner, with challenge and spatial reaction replacing rhythm-game scoring.",
  },
  {
    id: "ps1-le-concert-ff",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-02344.html",
    overview:
      "Le Concert ff, short for Fortissimo, is a PlayStation rhythm/conducting game from SAME Creative and Warashi. PSXDataCenter describes the player as a young classical orchestra conductor who advances through five stages, starting with a small orchestra and working toward a larger one. The core play is timing-based button input: hit the correct commands in rhythm often enough to clear the stage, with character story scenes linking each performance.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on catalog, review, database, and specialist gameplay sources.",
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
