const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-ncaa-neorude-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps1.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "ps1",
    gameId: "ps1-ncaa-march-madness-2001",
    title: "NCAA March Madness 2001",
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_March_Madness_2001",
    newOverview:
      "NCAA March Madness 2001 is EA Sports' 2000 college basketball entry for PlayStation, developed by Black Ops Entertainment and built around single-player or local multiplayer NCAA hoops. Kenyon Martin appears on the cover, and the game belongs to the short PS1 run of EA's March Madness series rather than the NBA Live line. GCX should frame it as a late-generation college basketball release for sports collectors who care about NCAA branding, cover athletes, and EA's separate college-basketball catalog.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nekketsu-oyako",
    title: "Nekketsu Oyako",
    sourceUrl: "https://www.mobygames.com/game/58013/nekketsu-oyako/",
    newOverview:
      "Nekketsu Oyako is Technosoft's early PlayStation side-scrolling beat-'em-up, closer to Final Fight-style arcade brawling than the company's better-known shooters. Players move through linear stages, fight mobs and bosses, and pick up melee or ranged weapons, with character differences affecting what tools can be used. It is worth flagging as a Japan-only brawler with Saturn and PSN connections, making it more distinctive than a generic action entry.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-neko-na-ka-n-ke-i",
    title: "Neko na Ka-n-ke-i",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-91524.html",
    newOverview:
      "Neko na Ka-n-ke-i is a Japanese visual novel from Victor Interactive Software about a high school student whose life changes after finding a cat's-eye-like stone. The hook is that the stone lets him change into a cat and back, pushing the story toward character interaction and scenario reading rather than tactics or action play. GCX should identify it as a Japanese-language narrative release, useful for visual-novel and import collectors tracking Victor's PS1 catalog.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-neko-no-kaikata",
    title: "Neko no Kaikata",
    sourceUrl: "https://psxdatacenter.com/games/J/S/SLPM-87052.html",
    newOverview:
      "Neko no Kaikata is the short GCX title for Simple 1500 Jitsuyou Series Vol. 16: Neko no Kaikata - Sekai no Neko Catalog, a D3 Publisher budget release developed by Billiken Soft. Public catalog data describes it as a data, picture, and quiz-style cat catalog rather than a normal pet sim. GCX should label it as practical/reference software with quiz elements, not a strategy game, with interest tied to D3's Simple 1500 line and Japan-only cat-media collecting.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-neko-zamurai",
    title: "Neko Zamurai",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01543.html",
    newOverview:
      "Neko Zamurai is a Human Entertainment adventure game set around samurai cats in Edo-period Japan. Players guide Neko through conversations and events, meeting a large cast and advancing through story scenarios rather than playing a conventional combat simulation. GCX should present it as a quirky Japanese-language adventure from Human's late PS1 period, notable for its cat-samurai premise, voice acting, and import-library personality.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nemuru-mayu-sleeping-cocoon",
    title: "Nemuru Mayu: Sleeping Cocoon",
    sourceUrl: "https://www.hardcoregaming101.net/nemuru-mayu/",
    newOverview:
      "Nemuru Mayu: Sleeping Cocoon is a Japan-only first-person dungeon RPG from Asmik Ace with a dark fantasy-horror tone. The story centers on a demonic book connected to four trapped knights, sending the player through dungeons tied to those sleeping warriors. GCX should treat it as an obscure atmospheric dungeon crawler rather than a survival-horror action game, with collector appeal coming from its unusual visual style, rarity, and Japanese exclusivity.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-neo-atlas",
    title: "Neo Atlas",
    sourceUrl: "https://store.steampowered.com/app/532690/Neo_ATLAS_1469/",
    newOverview:
      "Neo Atlas is Artdink's PlayStation-era historical exploration and trading simulation, the series that later fed into Neo Atlas 1469. Its central idea is charting the world by sending ships to explore, then deciding whether to accept or reject their reports, which gradually shapes the map itself. GCX should describe it as a map-making merchant simulation built on discovery, uncertainty, and route management rather than as a conventional military strategy game.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-neo-atlas-ii",
    title: "Neo Atlas II",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02238.html",
    newOverview:
      "Neo Atlas II is Artdink's expanded second PlayStation entry in the Atlas exploration-simulation line. It keeps the age-of-sail world-discovery premise, asking players to manage voyages, judge explorers' reports, trade, and gradually fill in an uncertain world map. For GCX, the important distinction is that it is a sequel for players who want more of Neo Atlas' map-building and commercial-expedition loop, not a standalone tactical war game.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-neorude",
    title: "Neorude",
    sourceUrl: "https://backloggd.com/games/neorude/",
    newOverview:
      "Neorude is a Technosoft PlayStation RPG with an unusual point-and-click control style. Instead of directly steering party members like a standard console RPG, players use a cursor to point characters toward movement and actions, with PlayStation Mouse support being part of its identity. GCX should call out that control concept because it separates Neorude from more conventional menu-driven JRPGs and explains why the series sits in an odd adventure/RPG niche.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-neorude-2",
    title: "Neorude 2",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02254.html",
    newOverview:
      "Neorude 2 continues Technosoft's cursor-led adventure/RPG formula on PlayStation. Source material describes the gameplay as point-and-click adventure-style exploration with RPG battles using the same pointer-driven system as the first game. GCX should frame it as a direct same-mechanics sequel for import RPG collectors, valuable because it preserves Technosoft's experimental late-1990s RPG branch alongside the better-known Thunder Force legacy.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing PS1 game record for ${gameId}`);
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
      "Priority PS1 weak-template replacement with source-backed GCX editorial overview.",
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
