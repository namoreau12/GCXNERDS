const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-bonbon-bravedungeon-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "3ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "3ds",
    gameId: "3ds-bonbon-ribbon-tokimeki-coord-kirakira-dance",
    title: "Bonbon Ribbon: Tokimeki Coord Kirakira Dance",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/103590-bonbonribbon-tokimeki-coord-kirakira-dance",
    newOverview:
      "Bonbon Ribbon: Tokimeki Coord Kirakira Dance is a Japan-only Sanrio rhythm game from Rocket Company starring Bonbonribbon and the Lily Bonbons dance team. Players perform to songs such as Miracle Ribbon, nursery-rhyme arrangements, and classical pieces, then use lesson rewards to dress the characters in coordinated outfits. GCX should frame it as a cute rhythm-and-fashion title for Sanrio and Japanese 3DS collectors, not a generic music release.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bonds-of-the-skies",
    title: "Bonds of the Skies",
    sourceUrl: "https://www.kemco-games.com/global/pr/bos_3ds.html",
    newOverview:
      "Bonds of the Skies is a KEMCO and Hit-Point fantasy JRPG about a friendship between humans and gods. The 3DS version keeps the traditional handheld RPG structure: an overworld, dungeon exploration, turn-based battles, character growth, and a bottom-screen map for navigating resources and objectives. Its appeal is straightforward comfort-food JRPG pacing rather than experimentation, making it useful for collectors tracking KEMCO's late 3DS eShop catalog.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bookstores-everywhere",
    title: "Bookstores Everywhere",
    sourceUrl: "https://www.nintendolife.com/news/2012/09/3ds_bookstore_anywhere_app_bringing_ebooks_to_japan",
    newOverview:
      "Bookstores Everywhere, also covered in English as Bookstore Anywhere, is better treated as a Japan-only 3DS eBook service application from Librica than as a conventional game. It was designed as an online bookstore for downloading manga, manga magazines, light novels, and other reading material through the Nintendo eShop ecosystem. GCX should keep this record because Nintendo lists it with 3DS software, but label it clearly as a digital reading app with preservation interest.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bowling-bonanza-3d",
    title: "Bowling Bonanza 3D",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-games/Bowling-Bonanza-3D-688867.html",
    newOverview:
      "Bowling Bonanza 3D is Enjoy Gaming's ten-pin bowling package for Nintendo 3DS, built around full 3D rigid-body physics and a broad set of modes. Players can jump into Quick Play, Arcade, league, tournament, or hot-seat multiplayer for up to four players, while working through CPU opponents, rating progression, unlockable environments, bowling balls, and pin sets. It belongs in GCX as a modest sports sim with more structure than a one-off minigame.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-box-up",
    title: "Box Up",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/New-Nintendo-3DS-Download-Software/BOX-UP-1149774.html",
    newOverview:
      "Box Up is a New Nintendo 3DS eShop arcade game from RCMADIAX about guiding a box upward without hitting platforms. The stages are randomly generated, so the loop is about quick reactions, clean positioning, and chasing a higher score rather than clearing a hand-authored campaign. GCX should present it as a tiny pick-up-and-play digital score game, with collector interest tied to its New 3DS-only eShop availability.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-boxboxboy",
    title: "BoxBoxBoy!",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/BOXBOXBOY--1114172.html",
    newOverview:
      "BoxBoxBoy! is HAL Laboratory's second 3DS puzzle-platformer starring Qbby, published by Nintendo. The sequel expands the original box-making idea by letting Qbby create two separate sets of boxes, which opens up new solutions for switches, spikes, lasers, gaps, and more than 120 compact puzzle stages. It should be treated as one of the stronger first-party eShop puzzle releases, prized for clean mechanics and smart level design.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-boxzle",
    title: "Boxzle",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_3DS_games_(0%E2%80%93M)",
    newOverview:
      "Boxzle is an obscure Nintendo 3DS puzzle release from Pouncing Kitten Games with very limited public documentation beyond platform catalog listings. GCX should avoid inventing mechanics and keep the record conservative: it is a small digital puzzle title whose library value is mainly completeness, developer attribution, and eShop-era preservation. Until stronger source material surfaces, it should not be described as a specific puzzle subgenre.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-brain-training-3d",
    title: "Brain Training 3D",
    sourceUrl: "https://www.amazon.co.uk/Funbox-Media-11084-Brain-Training/dp/B005BNQWH6",
    newOverview:
      "Brain Training 3D is a European 3DS brain-training package from Funbox Media and IE Institute, separate from Nintendo's Dr. Kawashima series. It aims at adults and children with short mental exercises, memory and thinking challenges, and a simple shooting-style presentation for working through levels. GCX should label it as a budget educational puzzle product, useful for collectors because its title can be confused with Nintendo's better-known Brain Age line.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-brave-company",
    title: "Brave Company",
    sourceUrl: "https://forums.consolewars.de/threads/brave-company-cattle-call-x-nbgi.48340/",
    newOverview:
      "Brave Company is a Japan-only strategy and management game from Cattle Call and Namco Bandai. Instead of controlling a single hero party in a normal RPG, players act as the CEO of a hero-dispatch company: interview recruits, hire heroes, send them out to protect the city, and grow both the company and surrounding town over time. GCX should frame it as a quirky simulation-strategy entry for collectors of Japan-only 3DS experiments.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-brave-dungeon",
    title: "Brave Dungeon",
    sourceUrl: "https://videochums.com/review/brave-dungeon",
    newOverview:
      "Brave Dungeon is Inside System's dungeon-crawling RPG spin-off from The Legend of Dark Witch universe. Players configure and upgrade a party in Newport between dungeon runs, then push through five dungeons filled with turn-based battles, level grinding, bosses, and character-building choices. It is best described as a compact 3DS eShop JRPG for players who want steady party progression and dungeon loops rather than a full narrative epic.",
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
