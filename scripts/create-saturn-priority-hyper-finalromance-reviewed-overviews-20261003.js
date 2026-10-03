const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "saturn.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "saturn-priority-hyper-finalromance-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    gameId: "saturn-hyper-3d-taisen-battle-gebockers",
    sourceUrl: "https://www.mobygames.com/game/51587/hyper-3d-taisen-battle-gebockers/",
    newOverview:
      "Hyper 3D Taisen Battle Gebockers is Riverhillsoft's 1996 Saturn arena shooter, built around cartoon combatants dueling in 3D spaces with standard and special weapons. Its collector hook is the Japan-only Saturn action niche, including the separate system-link cable bundle for players chasing local two-unit versus oddities.",
  },
  {
    gameId: "saturn-hyper-reverthion",
    sourceUrl: "https://www.mobygames.com/game/200590/reverthion/",
    newOverview:
      "Hyper Reverthion is Technosoft's Saturn version of Reverthion, a third-person arena battler about mechanized creatures fighting for the title of Reverthion. MobyGames notes eight playable characters, campaign endings, split-screen versus play, and Saturn system-link support, making it a useful import for fans of early 3D arena combat before Virtual On became the obvious comparison point.",
  },
  {
    gameId: "saturn-hyper-securities-s",
    sourceUrl: "https://www.mobygames.com/game/217514/hyper-securities-kinmirai-bishojo-police-nisshi/releases/",
    newOverview:
      "Hyper Securities S is the Saturn release of Hyper Securities: Kinmirai Bishojo Police Nisshi, a futuristic police-themed simulation and adventure import. The Saturn edition was published under Pack-In-Soft by Victor Interactive Software, with Gingham Music Publishing credited as developer, so listings should distinguish it from the earlier PC-98 release and the broader Hyper Securities line.",
  },
  {
    gameId: "saturn-ide-yosuke-meijin-no-shin-jissen-mahjong",
    sourceUrl: "https://www.mobygames.com/game/194926/ide-yosuke-meijin-no-shin-jissen-mahjong/",
    newOverview:
      "Ide Yosuke Meijin no Shin Jissen Mahjong is Capcom's supervised mahjong release built around traditional four-player table rules, configurable game settings, betting options, and a cast of sixteen opponents. It is best read as practical Japanese mahjong software with anime-style presentation, not as a broad story adventure or arcade action game.",
  },
  {
    gameId: "saturn-idol-janshi-suchie-pai-mecha-genteiban-hatsubai-5-shunen-toku-package",
    sourceUrl: "https://gamefaqs.gamespot.com/saturn/570778-idol-janshi-suchie-pai-mecha-genteiban/data",
    newOverview:
      "Idol Janshi Suchie-Pai Mecha Genteiban is Jaleco Entertainment's 1998 Saturn board and card release, later represented in the Suchie-Pai Saturn Tribute collection. This Hatsubai 5 Shunen package is collector-relevant because it sits at the end of the Saturn Suchie-Pai run, where exact subtitle, Japanese region, package contents, and completeness matter as much as the mahjong play itself.",
  },
  {
    gameId: "saturn-idol-janshi-suchie-pai-remix",
    sourceUrl: "https://www.mobygames.com/game/61681/idol-janshi-suchie-pai-special/",
    newOverview:
      "Idol Janshi Suchie-Pai Remix is the Saturn-specific remix version of Jaleco's Suchie-Pai Special, a character-driven mahjong game starring Kyoko Misaki's superheroine alter ego. MobyGames identifies Remix as a Saturn variant with presentation changes from the first Saturn release, so it should be cataloged as a distinct import edition rather than a generic mahjong duplicate.",
  },
  {
    gameId: "saturn-idol-janshi-suchie-pai-special",
    sourceUrl: "https://www.mobygames.com/game/61681/idol-janshi-suchie-pai-special/",
    newOverview:
      "Idol Janshi Suchie-Pai Special brings Jaleco's arcade mahjong follow-up to Saturn with anime-style opponents and the series' superheroine framing. Its value comes from the Suchie-Pai brand, Misaki Kyoko character identity, and the Saturn's deep Japanese mahjong catalog, especially for collectors comparing Special, Remix, and later Saturn Suchie-Pai releases.",
  },
  {
    gameId: "saturn-idol-mahjong-final-romance-2",
    sourceUrl: "https://wiki-origin.giantbomb.com/wiki/Games/Taisen_Idol_Mahjong_Final_Romance_2",
    newOverview:
      "Idol Mahjong Final Romance 2 is the Saturn port of Video System's 1995 arcade riichi mahjong game, published on Saturn by ASK Kodansha. It centers on one-on-one idol mahjong matches and carries over the Final Romance arcade identity, making it mainly relevant to import collectors tracking Video System's adult-leaning mahjong line across arcade and home formats.",
  },
  {
    gameId: "saturn-idol-mahjong-final-romance-4",
    sourceUrl: "https://www.satakore.com/sega-saturn-game%2C%2CT-3003G%2C%2CIdol-Maajan-Final-Romance-4-JPN.html",
    newOverview:
      "Idol Mahjong Final Romance 4 is Video System's 1998 Saturn mahjong sequel, framed around character competition and the Final Romance series' idol presentation. Compared with plainer table-game releases, its appeal is the combination of riichi mahjong, voiced character scenes, and Japan-only Saturn packaging, with the T-3003G release details helping separate it from earlier Final Romance entries.",
  },
  {
    gameId: "saturn-idol-mahjong-final-romance-r",
    sourceUrl: "https://gamefaqs.gamespot.com/saturn/577615-idol-mahjong-final-romance-r",
    newOverview:
      "Idol Mahjong Final Romance R is a 1996 Saturn Final Romance entry from Video System and ASK, also issued in a Premium Box variant. It is a board and card import built for players comfortable with Japanese riichi mahjong and character-led presentation, with release date, publisher, and premium-package status doing the important work for collectors.",
  },
];

const headers = [
  "platformSlug",
  "gameId",
  "title",
  "currentOverview",
  "sourceUrl",
  "rewriteNotes",
  "newOverview",
  "reviewStatus",
  "reviewer",
];

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = reviewedOverviews.map((entry) => {
    const game = byId.get(entry.gameId);
    if (!game) throw new Error(`Missing Saturn game ${entry.gameId}`);
    return {
      platformSlug: "saturn",
      gameId: entry.gameId,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: entry.sourceUrl || game.articleUrl || game.descriptionSourceUrl || "",
      rewriteNotes:
        "Priority Saturn weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus MobyGames, GameFAQs, Giant Bomb, Satakore, and specialist Saturn references.",
      newOverview: entry.newOverview,
      reviewStatus: "reviewed",
      reviewer: "Games Exchange editorial cleanup",
    };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );
  console.log(JSON.stringify({ ok: true, outputPath: path.relative(rootDir, outputPath), rows: rows.length }, null, 2));
}

main();
