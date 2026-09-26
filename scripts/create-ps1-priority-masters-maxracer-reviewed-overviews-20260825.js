const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-masters-maxracer-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-masters-shin-harukanaru-augusta",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00373.html",
    overview:
      "Masters: Shin Harukanaru Augusta is a Japan-only PlayStation golf entry in T&E Soft's Augusta line. It centers on Augusta National-style course play with stroke, match, tournament, and Masters Tournament modes, including hole flyovers and Japanese presentation touches. For GCX readers, the important angle is that this is a course-focused simulation release tied to T&E Soft's long-running 3D golf lineage, not a generic arcade sports title.",
  },
  {
    id: "ps1-masumon-kids-the-another-world-of-the-master-of-monsters",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01426.html",
    overview:
      "Masumon Kids: The Another World of The Master of Monsters is a Japanese PlayStation strategy RPG connected to SystemSoft's Master of Monsters lineage. Instead of a broad fantasy RPG, it leans into turn-based monster tactics, mission structure, and Japanese-menu strategy play. Its collector identity comes from being a lesser-seen PS1 branch of a series that began on Japanese computers and later moved across several consoles.",
  },
  {
    id: "ps1-math-gallery-collection-1",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/163477-math-gallery-collection-1",
    overview:
      "Math Gallery: Collection 1 is part of Lightspan's school-distributed educational PlayStation line. The game frames math practice as a comic-book adventure in which children help with building projects such as a gingerbread museum, concert stage, and space station. Its activities focus on number ordering, decimals, fractions, calculator use, area, perimeter, volume, and geometric shapes, making it more classroom software than a traditional retail game.",
  },
  {
    id: "ps1-math-gallery-collection-2",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/163478-math-gallery-collection-2",
    overview:
      "Math Gallery: Collection 2 continues Lightspan's educational PlayStation format with comic-book rewards wrapped around math activities. This collection has children help prepare big events, including a museum opening, concert tour, and space-port opening, while completing math tools. The learning focus shifts toward money, probability, ratios, calendar reading, and time problems, so its value is strongest for collectors tracking the unusual Lightspan school catalog.",
  },
  {
    id: "ps1-matsukata-hiroki-no-world-fishing",
    sourceUrl: "https://gamegear.net/archive/games/saturn/matsukata-hiroki-no-world-fishing-japan",
    overview:
      "Matsukata Hiroki no World Fishing is a Japan-only fishing simulation built around celebrity angler Hiroki Matsukata. Available information points to two main styles of fishing: billfish trawling at sea and black bass fishing on lakes, with locations framed around Australia. GCX should treat it as a niche simulation and personality-licensed import rather than a strategy game, with appeal mainly to fishing-game and Japanese PS1 collectors.",
  },
  {
    id: "ps1-matsumoto-reiji-999-story-of-galaxy-express-999",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03220.html",
    overview:
      "Matsumoto Reiji 999: Story of Galaxy Express 999 is a character-driven action adventure based on Leiji Matsumoto's science-fiction universe. Players take the role of Tetsuro through event-based scenarios tied to Galaxy Express 999 and related Matsumoto works, with original animation and a mix of 2D character work and 3D mechanical presentation. It is best positioned as a licensed anime adventure for fans of the creator's worlds, not as a generic exploration game.",
  },
  {
    id: "ps1-mawatte-mucho",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01359.html",
    overview:
      "Mawatte Mucho! is a Japan-only action puzzle game about rotating floor panels to build safe routes through each stage. The player guides a sombrero-wearing hero through block-based layouts, opens blue chests to rescue small pink creatures, uses teleporters between subareas, and reaches a goal before stage pressure catches up. It belongs near clever PS1 puzzle-action oddities where planning and quick reactions matter together.",
  },
  {
    id: "ps1-max-surfing-2nd",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-02871.html",
    overview:
      "Max Surfing 2nd is a Japanese PlayStation surfing game built around Association of Surfing Professionals-style competition. Players choose from different surfers and beaches, then ride waves while trying to score well enough to win a world championship-style tour. For GCX, the useful framing is that this is a niche board-sports simulation release from KSS, closer to late-1990s extreme-sports experimentation than a normal team sports game.",
  },
  {
    id: "ps1-maxracer",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00795.html",
    overview:
      "MaxRacer is a Japan-only futuristic racing game with a Wipeout-like emphasis on speed, shields, and checkpoint pressure. It offers three courses and five racers, each with different abilities, while a shield meter punishes wall impacts and failed checkpoint timing can end a run. Its collector interest comes from being a small-scale 3D sci-fi racing import with Namco NeGcon and analog joystick support noted by PlayStation Datacenter.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on specialist database, platform-history, retail catalog, and game database sources.",
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
