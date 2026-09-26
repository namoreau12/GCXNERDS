const fs = require("node:fs");
const path = require("node:path");

const outputPath = path.join(
  __dirname,
  "..",
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-azito-battleminer-reviewed-overviews-2026-08-25.csv"
);
const gamesPath = path.join(__dirname, "..", "data", "games", "3ds.json");
const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platform: "3ds",
    gameId: "3ds-azito-3d-kyoto",
    title: "Azito 3D Kyoto",
    newOverview:
      "Azito 3D Kyoto is a regional 3DSWare follow-up to Hamster and Astec 21's secret-base management series, built around expanding an underground lair, funding new rooms, and preparing robots or monsters before enemy attacks arrive. The Kyoto edition matters because it is not a reflex action game; it is a compact strategy/simulation entry where the fun comes from layout planning, resource flow, and watching a hidden base turn into a defensive machine.",
    sourceUrl: "https://nintendoeverything.com/azito-3d-heading-to-3ds/",
  },
  {
    platform: "3ds",
    gameId: "3ds-azito-3d-osaka",
    title: "Azito 3D Osaka",
    newOverview:
      "Azito 3D Osaka takes the same unusual secret-base formula from the Azito 3D line and applies it to another localized 3DSWare scenario. Players build out facilities, generate money, prepare giant defenders, and react when the base comes under threat, so its appeal is closer to toy-box strategy and lair management than traditional combat. For GCX library users, it should be understood as a niche digital strategy title tied to Hamster's revival of the older Azito series.",
    sourceUrl: "https://gdri.smspower.org/wiki/index.php/Astec21",
  },
  {
    platform: "3ds",
    gameId: "3ds-azito-3d-tokyo",
    title: "Azito 3D Tokyo",
    newOverview:
      "Azito 3D Tokyo is another city-themed 3DSWare entry in the Azito 3D branch, where the core loop is building and maintaining a secret underground base rather than clearing stages with direct action. The player places facilities, manages income, and prepares hangars or labs so robots and monsters can respond when battles break out. Its collector interest comes from being part of a small Hamster-published 3DS digital strategy run that is easy to overlook beside bigger retail releases.",
    sourceUrl: "https://gdri.smspower.org/wiki/index.php/Astec21",
  },
  {
    platform: "3ds",
    gameId: "3ds-azure-snake",
    title: "Azure Snake",
    newOverview:
      "Azure Snake is a minimalist arcade-style 3DS download built around guiding a glowing snake through a bright abstract playfield. The official Nintendo description is brief, so the safest read is that this is a simple score-and-survival reflex game rather than a story adventure. Its value in the GCX index is mostly as a late eShop curiosity from RandomSpin, useful for collectors trying to identify small digital-only 3DS releases.",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Azure-Snake-1495153.html",
  },
  {
    platform: "3ds",
    gameId: "3ds-b-o-o-l-master-labyrinth-puzzle",
    title: "B.O.O.L: Master Labyrinth Puzzle",
    newOverview:
      "B.O.O.L: Master Labyrinth Puzzle is a New Nintendo 3DS puzzle game about moving a box out of maze-like stages. The catch is that the box slides in straight lines until it hits an obstacle, turning each board into a route-planning problem instead of a free-movement maze. With more than 120 labyrinth puzzles and an emphasis on elemental puzzle masters, it belongs in the library as a compact logic game for players who like short, repeatable spatial challenges.",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/New-Nintendo-3DS-Download-Software/B-O-O-L-Master-labyrinth-puzzles-1898645.html",
  },
  {
    platform: "3ds",
    gameId: "3ds-back-in-1995-64",
    title: "Back in 1995 64",
    newOverview:
      "Back in 1995 64 is a planned 3DS version of Takaaki Ichijo's deliberately low-poly survival-horror throwback. Its design leans into fixed cameras, tank controls, chunky models, texture warping, and awkward old-console presentation as the point rather than a flaw. The 3DS version was announced with a second-screen 'virtual game console' gimmick that could interrupt play with cartridge or cable-style issues, making it a notable oddity for players tracking retro-horror experiments on Nintendo hardware.",
    sourceUrl: "https://www.nintendolife.com/news/2016/07/faux-retro_survival_horror_back_in_1995_64_shuffles_menacingly_towards_the_nintendo_3ds",
  },
  {
    platform: "3ds",
    gameId: "3ds-banana-bliss-jungle-puzzles",
    title: "Banana Bliss: Jungle Puzzles",
    newOverview:
      "Banana Bliss: Jungle Puzzles is a Teyon 3DS eShop puzzle game starring Morris the monkey across hundreds of jungle stages. Each level asks players to climb, swing, move boulders or bars, avoid roaming critters, and route through the board for bananas and bonuses. It is best described as a light, portable puzzle-platformer hybrid: simple to understand, built for short sessions, but with enough stage count and replay goals to matter for 3DS eShop collectors.",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Banana-Bliss-Jungle-Puzzles-843327.html",
  },
  {
    platform: "3ds",
    gameId: "3ds-battle-cats-pop",
    title: "Battle Cats Pop!",
    newOverview:
      "The Battle Cats POP! adapts PONOS' offbeat tower-defense hit for Nintendo 3DS as download-only software. Players build teams of strange cat units, spend resources during lane battles, unlock stronger cats through capsules, and push from Earth-conquering stages toward a broader galaxy campaign. The 3DS version adds stereoscopic presentation and a local two-player VS mode, making it more than a straight mobile port and a clear fit for strategy and oddball eShop collections.",
    sourceUrl: "https://battlecats.club/en/series/tobidasu/",
  },
  {
    platform: "3ds",
    gameId: "3ds-battle-of-elemental-reboost",
    title: "Battle of Elemental REBOOST",
    newOverview:
      "Battle of Elemental REBOOST is Amzy's enhanced 3DS eShop return to its earlier DSiWare arena-battle action game. The update keeps the elemental character-combat idea but expands it with new playable rivals and 3DS-focused upgrades such as stereoscopic 3D support, 60fps play, and online battles. Its appeal is fast, compact one-on-one combat with a small character roster, making it a niche Japanese eShop fighter rather than a broad adventure game.",
    sourceUrl: "https://www.gematsu.com/2016/04/battle-elemental-reboost-announced-3ds",
  },
  {
    platform: "3ds",
    gameId: "3ds-battleminer",
    title: "Battleminer",
    newOverview:
      "Battleminer is Wobbly Tooth's 3DS eShop attempt to bring block-world mining and survival play to a handheld audience that did not have an official Minecraft release at the time. Players gather resources, craft, build, and defend themselves in a voxel-style world, with the roughness of a small eShop production sitting right beside the novelty of having that kind of sandbox on 3DS. It is an important library entry for collectors tracking Minecraft-inspired handheld experiments.",
    sourceUrl: "https://www.nintendoworldreport.com/review/39217/battleminer-review",
  },
  {
    platform: "3ds",
    gameId: "3ds-battleminerz",
    title: "Battleminerz",
    newOverview:
      "Battleminerz is Wobbly Tooth's expanded follow-up to Battleminer, still built around an open block world but with a broader multiplayer-minded feature set. Nintendo's listing describes an infinite map and support for all 3DS family systems, while pre-release coverage highlighted character customization, texture packs, wildlife, and Adventure, Creative, Horde, and Battle modes. It is the more ambitious of the two Battleminer entries and should be framed as a sandbox survival/building game rather than a simple action title.",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Battleminerz-1320027.html",
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
      row.platform,
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
console.log(JSON.stringify({ outputPath: path.relative(path.join(__dirname, ".."), outputPath), rowCount: rows.length }, null, 2));
