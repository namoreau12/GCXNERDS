const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-locoroco-lostsea-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-locoroco-remastered",
    sourceUrl: "https://store.playstation.com/en-us/product/UP9000-CUSA01904_00-UCUS987310000001",
    overview:
      "LocoRoco Remastered brings Japan Studio's PSP original to PS4 with cleaner presentation, 4K support on PS4 Pro, and the same unusual tilt-the-world control style. Players guide singing LocoRoco by rolling the landscape, splitting into smaller blobs, finding secrets, and using rhythm-like timing to move through bright puzzle-platform stages. It matters because the series feels playful in a way few platformers do: simple inputs, cheerful music, and physics-driven exploration rather than combat-heavy action.",
  },
  {
    id: "ps4-lonely-mountains-downhill",
    sourceUrl: "https://lonelymountains.com/",
    overview:
      "Lonely Mountains: Downhill is a mountain-biking game about learning rugged trails through repetition, risk, and clean handling. Each run asks players to pick lines through rocks, trees, drops, shortcuts, and narrow paths while chasing time goals or simply surviving the route. Its appeal is the mix of calm outdoor atmosphere and tense precision: it looks peaceful, but shaving seconds off a descent turns every corner and landing into a small decision.",
  },
  {
    id: "ps4-lornsword-winter-chronicle",
    sourceUrl: "https://towerfive.com/lornsword/",
    overview:
      "Lornsword Winter Chronicle adapts real-time strategy to direct controller play, putting players in charge of a battlefield commander who summons units, captures resources, and pushes through fantasy campaign missions. The hook is that strategy decisions happen while moving a character on the field instead of only clicking from above. It is best understood as a console-friendly RTS experiment, built around readable armies, local co-op, and quick tactical pressure rather than a dense PC-style command layer.",
  },
  {
    id: "ps4-lost-castle",
    sourceUrl: "https://store.playstation.com/en-us/product/UP2089-CUSA17184_00-LOSTCASTLE000001",
    overview:
      "Lost Castle is a side-scrolling roguelite brawler set in a corrupted castle full of monsters, randomized gear, traps, and boss fights. Players push through repeatable runs, collect weapons and items, upgrade between attempts, and can fight alongside friends in co-op. The PS4 version is strongest when framed as arcade action with roguelite structure: messy, fast, replayable dungeon combat rather than a fixed story-driven platform adventure.",
  },
  {
    id: "ps4-lost-grimoires-2-shard-of-mystery",
    sourceUrl: "https://www.artifexmundi.com/g/lost-grimoires-2-shard-of-mystery/",
    overview:
      "Lost Grimoires 2: Shard of Mystery is a hidden-object adventure about a royal tutor and alchemist searching for a missing prince inside a magical forest. The play loop mixes illustrated scene investigation, object-finding puzzles, alchemy-style interactions, and story progression through fantasy locations. It is a good fit for players who want a relaxed mystery with light puzzle variety, and for collectors it sits clearly within Artifex Mundi's PS4 hidden-object run.",
  },
  {
    id: "ps4-lost-grimoires-stolen-kingdom",
    sourceUrl: "https://www.artifexmundi.com/g/lost-grimoires-stolen-kingdom/",
    overview:
      "Lost Grimoires: Stolen Kingdom starts the series with a young alchemist returning home and uncovering a conspiracy tied to her missing parents and the fate of the kingdom. Players search hand-painted scenes, solve inventory puzzles, use alchemical tools, and move through a compact fantasy mystery. GCX should describe it as a narrative hidden-object adventure, not a generic puzzle game, because its appeal comes from Artifex Mundi's familiar storybook structure and casual investigation rhythm.",
  },
  {
    id: "ps4-lost-orbit-terminal-velocity",
    sourceUrl: "https://pixelnauts.ca/lostorbit",
    overview:
      "Lost Orbit: Terminal Velocity is a fast space-navigation game about a stranded maintenance worker named Harrison flying through dangerous star systems without a ship. Players slingshot around planets, dodge mines and debris, collect resources, and thread high-speed routes through hazards. Terminal Velocity expands the original Lost Orbit with new content and refinements, making it feel closer to a momentum puzzle-racer than a traditional adventure game.",
  },
  {
    id: "ps4-lost-sea",
    sourceUrl: "https://www.eastasiasoft.com/games/Lost-Sea",
    overview:
      "Lost Sea is an action-adventure roguelite set in a stylized Bermuda Triangle, where players explore procedurally generated islands after a plane crash. The loop is about recruiting survivors, gathering resources, finding tablets, fighting creatures, and deciding when to move on before danger or attrition catches up. It is uneven but distinctive, with its value coming from island-to-island survival decisions and replayable exploration rather than handcrafted Zelda-style dungeons.",
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
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    rows.push([
      "ps4",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl || game.descriptionSourceUrl || "",
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on verified identity, platform metadata, publisher/developer context, and official/store descriptions where available.",
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
