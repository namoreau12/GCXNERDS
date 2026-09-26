const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "psp-priority-24ji-akb-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "psp.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "psp-24-ji-no-kane-to-cinderella-halloween-wedding",
    title: "24 Ji no Kane to Cinderella: Halloween Wedding",
    sourceUrl: "https://www.honestgamers.com/67765/psp/24ji-no-kane-to-cinderella-halloween-wedding/game.html",
    newOverview:
      "24 Ji no Kane to Cinderella: Halloween Wedding is a QuinRose PSP otome visual novel and companion piece in the studio's Cinderella-themed Halloween Wedding line. HonestGamers lists the Japan-only PSP release with QuinRose as both developer and publisher, while broader QuinRose documentation places it alongside 12 Ji and 0 Ji in the same fairy-tale romance family. GCX should present it as a collector-focused otome import where the main value is completing the connected QuinRose trilogy.",
  },
  {
    gameId: "psp-77-sevens-beyond-the-milky-way",
    title: "77 (Sevens): Beyond the Milky Way",
    sourceUrl: "https://www.gamesdatabase.org/game/sony-psp/77-beyond-the-milky-way",
    newOverview:
      "77 (Sevens): Beyond the Milky Way is the PSP version of Whirlpool's school-fantasy romance visual novel, set on a floating academy island above Tokyo Bay. Source listings describe a Star Waiting Festival setup where protagonist Shou Tsukishiro is chosen as Altair and becomes the focus of competing heroines from the academy's towers. GCX should frame it as a Tenabata-themed bishoujo VN import with expanded PSP content, not a generic handheld story game.",
  },
  {
    gameId: "psp-abunai-koi-no-sousashitsu",
    title: "Abunai: Koi no Sousashitsu",
    sourceUrl: "https://en.wikipedia.org/wiki/QuinRose",
    newOverview:
      "Abunai: Koi no Sousashitsu is a PSP otome visual novel published by QuinRose and adapted from GignoSystem Japan's mobile romance-adventure work. QuinRose documentation specifically identifies it as one of the company's PSP ports of another studio's game, which makes it different from the in-house Alice and Cinderella lines. GCX should describe it as a police-investigation romance import where the draw is QuinRose-era preservation and mobile-to-PSP otome collecting context.",
  },
  {
    gameId: "psp-ai-igo",
    title: "AI Igo",
    sourceUrl: "https://www.honestgamers.com/19455/psp/ai-igo/game.html",
    newOverview:
      "AI Igo is a Marvelous Interactive PSP board-game release built around Go rather than a themed puzzle campaign. HonestGamers catalogs it as a Japan-only PSP board game, and period import coverage notes multiple board sizes and difficulty settings. GCX should position it as a straightforward portable Go simulator for board-game players and collectors tracking Marvelous's early PSP AI tabletop trio.",
  },
  {
    gameId: "psp-ai-mahjong",
    title: "AI Mahjong",
    sourceUrl: "https://www.honestgamers.com/19456/psp/ai-mahjong/game.html",
    newOverview:
      "AI Mahjong is Marvelous Interactive's PSP mahjong entry, released in Japan near the system's early launch window. HonestGamers identifies it as a PSP mahjong title from Marvelous Interactive and shows it alongside other Japanese handheld mahjong releases. GCX should call it a dedicated four-player mahjong simulation for import collectors, distinct from the broader AI Igo and AI Shogi board-game siblings.",
  },
  {
    gameId: "psp-ai-shogi",
    title: "AI Shogi",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_shogi_video_games",
    newOverview:
      "For GCX, AI Shogi belongs with the PSP's traditional tabletop imports: a Marvelous handheld shogi program aimed at players who want Japanese chess practice on the go. Reference catalogs place the PSP edition among several mid-2000s portable shogi programs, and Marvelous catalog references connect it to the same early board-game group as AI Igo and AI Mahjong. The useful description is a focused shogi opponent and study companion, not a puzzle campaign.",
  },
  {
    gameId: "psp-akatsuki-no-amaneka-to-aoi-kyojin",
    title: "Akatsuki no Amaneka to Aoi Kyojin",
    sourceUrl: "https://kotaku.com/games/akatsuki-no-amaneka-to-aoi-kyojin",
    newOverview:
      "Akatsuki no Amaneka to Aoi Kyojin is a Kogado Studio strategy and visual-novel hybrid that moved from PC to PSP and Xbox 360. Listings describe turn-based exploration where players equip and level party members, search dungeons, and use discovered treasures to fund progress. GCX should pitch it as a Kogado-style adventure-strategy import with party management and treasure-hunting structure, not a standard RPG template entry.",
  },
  {
    gameId: "psp-akatsuki-no-goei-trinity",
    title: "Akatsuki no Goei Trinity",
    sourceUrl: "https://kotaku.com/games/akatsuki-no-goei-trinity",
    newOverview:
      "Akatsuki no Goei Trinity collects the Akatsuki no Goei visual novel trilogy for PSP, following Asagiri Kaito as he becomes bodyguard to Nikaidou Reika. Coverage describes Trinity as a three-game package with upgraded presentation, extra CGs, added openings, interface improvements, and soundtrack access. GCX should present it as the convenient complete edition for collectors who want the whole bodyguard-themed VN series on one handheld release.",
  },
  {
    gameId: "psp-akb1-48-idol-to-guam-de-koishitara",
    title: "AKB1/48: Idol to Guam de Koishitara",
    sourceUrl: "https://en.wikipedia.org/wiki/AKB48#Video_games",
    newOverview:
      "AKB1/48: Idol to Guam de Koishitara is Bandai Namco and Artdink's second AKB48 PSP dating-sim release, moving the live-action idol scenario to Guam. AKB48 media documentation describes the series premise as choosing one member while turning down the rest, with the Guam sequel using a similar structure and location-specific confession footage. GCX should frame it as an idol-fandom artifact as much as a game, built around photos, voices, videos, and member loyalty.",
  },
  {
    gameId: "psp-akb1-48-idol-to-koishitara",
    title: "AKB1/48: Idol to Koishitara...",
    sourceUrl: "https://it.wikipedia.org/wiki/AKB1/48:_Idol_to_Koishitara...",
    newOverview:
      "AKB1/48: Idol to Koishitara... is the first PSP dating sim built around the AKB48 idol group, released in Japan by Bandai Namco in 2010. Public documentation describes its unusual reversal of dating-sim structure: every AKB48 member is interested in the player, and progress means rejecting most of them to choose one favorite. GCX should identify it as a major idol-culture collectible, notable for its heavy use of member photography, voice work, and video material.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing PSP game record for ${gameId}`);
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
      "psp",
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority PSP weak-template replacement with source-backed GCX editorial overview.",
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
