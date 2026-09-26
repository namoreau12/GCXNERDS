const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-birdmania-blookid-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "3ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "3ds",
    gameId: "3ds-bird-mania-christmas-3d",
    title: "Bird Mania Christmas 3D",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Bird-Mania-Christmas-3D-844820.html",
    newOverview:
      "Bird Mania Christmas 3D is a holiday reskin and expansion of Teyon's score-chasing 3DS eShop flyer. Players steer through snowy side-scrolling stages, collect stars and Christmas baubles, dash into enemies for bonuses, and avoid elves, trees, and other seasonal hazards. It is best described as a short-session arcade game built around clean movement, fast restarts, and leaderboard pressure rather than a new adventure structure.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bit-dungeon-plus",
    title: "Bit Dungeon Plus",
    sourceUrl: "https://www.familyfriendlygaming.com/Reviews/2017/Bit%20Dungeon%20Plus.html",
    newOverview:
      "Bit Dungeon Plus is a top-down dungeon crawler with retro pixel art, hack-and-slash combat, magic attacks, equipment drops, shops, and difficulty options. The loop is simple but sticky: clear rooms, earn money, upgrade gear, find better armor or weapons, and push deeper into monster-filled dungeons after each run. GCX should frame it as a compact roguelite-style action RPG for players who like grinding builds and repeated dungeon attempts.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-biyoushi-debut-monogatari-top-sutairisuto-o-mezasou",
    title: "Biyoushi Debut Monogatari: Top Sutairisuto o Mezasou!",
    sourceUrl: "https://solarisjapan.com/products/biyoushi-debut-monogatari-top-sutairisuto-o-mezasou-1",
    newOverview:
      "Biyoushi Debut Monogatari: Top Sutairisuto o Mezasou! is a Japan-only 3DS styling simulation from Nippon Columbia. Rather than an action adventure, it is built around the fantasy of becoming a rookie hair stylist, learning salon skills, shaping customer looks, and moving toward a top-stylist goal. Its GCX value is as a regional fashion and career-sim release, especially for collectors tracking Japanese lifestyle games on 3DS.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-blast-em-bunnies",
    title: "Blast 'Em Bunnies",
    sourceUrl: "https://www.nnooo.com/software/blastembunnies/",
    newOverview:
      "Blast 'Em Bunnies is Nnooo's arena-style gallery shooter about defending a burrow from waves of hostile rabbits. Players aim from a fixed position and swap between vegetable-themed weapons such as a carrot rifle, watermelon-pip machine gun, runner-bean laser, and turnip mortar. The appeal is quick target prioritization, score chasing, weapon unlocks, and survival pressure, with optional DLC skins and arenas shaping how complete the package feels.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-blasting-agent-ultimate-edition",
    title: "Blasting Agent: Ultimate Edition",
    sourceUrl: "https://www.nintendo.com/en-za/Games/Nintendo-3DS-download-software/Blasting-Agent-Ultimate-Edition-1131276.html",
    newOverview:
      "Blasting Agent: Ultimate Edition is a Ratalaika Games run-and-gun platformer inspired by compact 8-bit action design. The campaign sends the agent through enemy-filled stages, secret areas, upgrades, power-ups, and boss fights inside a pulp Antarctica-supervillain setup. It should be cataloged as a brisk jump-and-shoot eShop release where replay value comes from exploring routes, collecting upgrades, and unlocking harder challenges rather than from a long story.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-block-factory",
    title: "Block Factory",
    sourceUrl: "https://www.nintendoworldreport.com/review/29973/block-factory-nintendo-3ds",
    newOverview:
      "Block Factory is an eShop puzzle toolset from Enjoy Gaming that lets players create and play their own falling-block games. Its hook is not one fixed campaign; it gives simple construction tools for shaping block-dropping rules and sharing designs with other players. That makes it an unusual 3DS library entry, closer to a compact puzzle creator than a traditional Tetris-style package with a polished set of authored stages.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-block-a-pix-color",
    title: "Block-a-Pix Color",
    sourceUrl: "https://www.nintendo.com/it-it/Giochi/Giochi-scaricabili-per-Nintendo-3DS/Block-a-Pix-Colour-1378768.html",
    newOverview:
      "Block-a-Pix Color is a Lightwood Games logic puzzler built around revealing hidden pictures by dividing a grid into colored rectangular blocks. Each clue number tells players the size and color of the block it belongs to, so progress comes from deduction rather than guessing. With 120 Conceptis-designed puzzles across varied sizes and difficulty levels, it fits GCX as a thoughtful picture-logic entry for stylus-friendly 3DS play.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-blockform",
    title: "BlockForm",
    sourceUrl: "https://www.nintendolife.com/games/new-3ds/blockform",
    newOverview:
      "BlockForm is a New Nintendo 3DS eShop puzzle-platformer from CW Games. Public storefront coverage is thin, but available footage and listings point to a color-based platform game where the player navigates blocky stages and uses form or color rules to reach the goal. GCX should describe it carefully as a small digital-only puzzle-platform release whose collector interest is tied to New 3DS eShop availability and obscurity.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-blok-drop-chaos",
    title: "Blok Drop Chaos",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/165789-blok-drop-chaos",
    newOverview:
      "Blok Drop Chaos is a late 3DS eShop puzzle-arcade game from RCMADIAX built around catching falling blocks. The rules are intentionally direct: react quickly, collect the correct number of blocks, and advance as the drop patterns keep the pressure on. It belongs in the library as a lightweight score-and-reflex puzzler, not a deep campaign game, with most of its relevance coming from digital-only 3DS completion and RCMADIAX's eShop catalog.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bloo-kid-2",
    title: "Bloo Kid 2",
    sourceUrl: "https://www.winterworks.de/project/bloo-kid-2/",
    newOverview:
      "Bloo Kid 2 is a retro-style 2D platformer from winterworks with pixel art, chiptune music, swimming, running, jumping, boss fights, and secret hunting. The 3DS version keeps the appeal focused on five large worlds with nine stages each, giving it the feel of a compact handheld throwback rather than a puzzle-heavy experiment. GCX should present it as a traditional platformer for players who want colorful stages, repeated clears, and collectible-driven exploration.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing 3DS game record for ${gameId}`);
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
      row.platformSlug,
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority 3DS weak-template replacement with source-backed GCX editorial overview.",
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
