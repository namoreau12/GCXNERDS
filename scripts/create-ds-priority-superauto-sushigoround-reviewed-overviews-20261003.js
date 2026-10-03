const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-superauto-sushigoround-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "ds-super-auto-salon-custom-car-contest",
    sourceUrl: "https://www.nintendo.co.jp/ds/software/cqnj/index.html",
    overview:
      "Super Auto Salon: Custom Car Contest is Genterprise's Japan-only Nintendo DS car-customization game tied to show-car culture rather than straight circuit racing. Nintendo's official page lists an April 9, 2009 release, one-player support, and a card-throttle battle format built around preparing custom cars for shows across five countries and 25 venues. Listings should note the Japanese title, region, language dependence, customization and card-battle structure, and whether the cartridge is complete with case and manual.",
  },
  {
    id: "ds-super-black-bass-dynamic-shot",
    sourceUrl: "https://www.mobygames.com/game/84988/super-black-bass-fishing/",
    overview:
      "Super Black Bass: Dynamic Shot is Starfish SD's Nintendo DS fishing entry, released internationally as Super Black Bass Fishing. MobyGames identifies the DS version under both titles and notes touch-screen rod and lure controls, while review coverage connects it to Starfish's long-running Black Bass simulation lineage. Listings should distinguish the Japanese Dynamic Shot title from the North American and European Super Black Bass Fishing releases, note region, touchscreen fishing controls, and complete-package condition.",
  },
  {
    id: "ds-super-collapse-3",
    sourceUrl: "https://www.gamespot.com/games/super-collapse-3/",
    overview:
      "Super Collapse 3 is MumboJumbo and MacPlay's Nintendo DS version of the casual block-clearing puzzle series. GameSpot and series references place the DS release alongside PC, Mac, and PSP versions, with play centered on clearing matching colored blocks before the board fills. Listings should identify the handheld puzzle release, note region and publisher differences, describe the Collapse match-clearing loop, and separate DS cartridges from PC, PSP, or mobile versions.",
  },
  {
    id: "ds-super-fahrschule",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/357536-super-fahrschule/data",
    overview:
      "Super Fahrschule is LiWO Production and Atari SA's Europe-only Nintendo DS edutainment release built around driving-school practice. GameFAQs lists the May 26, 2008 European release with product ID NTR-CSFD-NOE and classifies it as miscellaneous edutainment rather than a conventional racing game. Listings should make the German driving-school angle, European region, language dependence, product code, and USK-friendly educational purpose clear for collectors.",
  },
  {
    id: "ds-super-fun-chess",
    sourceUrl: "https://thegamesdb.net/game.php?id=51902",
    overview:
      "Super Fun Chess is White Park Bay Software's Nintendo DS chess release, developed with ClockStone and Elephant Games. Database records describe single-player, multiplayer, and tournament modes, positioning it as a dedicated chess package rather than a broad board-game compilation. Listings should call out rule-based chess play, region and language, local multiplayer expectations, tutorial or difficulty support, and whether the cartridge includes its original case and manual.",
  },
  {
    id: "ds-super-speed-machines",
    sourceUrl: "https://www.mobygames.com/company/1919/midas-interactive-entertainment-ltd/games/",
    overview:
      "Super Speed Machines is Midas Interactive's Nintendo DS racing game, released in Europe during the late DS budget-racing wave. MobyGames' Midas catalog records it as a 2007 Nintendo DS racing and driving title, while Nintendo Life lists Midas Interactive as publisher for the DS entry. Listings should describe it as a European DS racing release, note region and language, arcade-racing expectations, and whether the copy is loose or complete with budget-line packaging.",
  },
  {
    id: "ds-supermodel-makeover-by-lauren-luke",
    sourceUrl: "https://www.mobygames.com/game/242658/supermodel-makeover-by-lauren-luke/",
    overview:
      "Supermodel Makeover by Lauren Luke is Avanquest Software's 2009 Nintendo DS beauty and makeover game built around makeup-artist branding. MobyGames lists the DS release under Avanquest and frames it around preparing models for different looks rather than fashion management or runway simulation. Listings should mention the Lauren Luke license, region, beauty-makeover focus, age-friendly presentation, and whether the case and insert materials are included.",
  },
  {
    id: "ds-survivor",
    sourceUrl: "https://gamefaqs.gamespot.com/games/company/1064-mindscape",
    overview:
      "Survivor is Mindscape's Nintendo DS adaptation of the reality-competition brand, released in Europe in 2009. Mindscape catalog records place the DS version alongside the publisher's other European licensed and casual releases, while community recollections identify it as a challenge-focused handheld tie-in rather than a deep survival simulation. Listings should state the TV-license connection, European region, language dependence, minigame or challenge structure, and complete-package details.",
  },
  {
    id: "ds-sushi-academy",
    sourceUrl: "https://www.esrb.org/ratings/27106/sushi-academy/",
    overview:
      "Sushi Academy is City Interactive's Nintendo DS cooking and food-education game. The ESRB describes it as a cooking simulation where players prepare sushi and Japanese dishes by chopping ingredients, forming rice, rolling sushi, and adding garnishes, while MobyGames records City Interactive Katowice development and a 2009 DS release. Listings should call out the cooking-sim structure, educational sushi context, region, language, ESRB Everyone rating, and whether the copy includes its manual.",
  },
  {
    id: "ds-sushi-go-round",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/960438-sushi-go-round/data",
    overview:
      "Sushi Go-Round is SouthPeak Games' Nintendo DS adaptation of Miniclip's time-management sushi restaurant game. GameFAQs lists the US DS release on March 26, 2010, and the box copy highlights the Miniclip connection and the game's web-game popularity. Listings should identify the DS cartridge version, distinguish it from Wii, iOS, and browser versions, note the order-fulfillment restaurant loop, region, and whether the copy is complete.",
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
  const rows = reviewedOverviews.map((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing DS game ${rewrite.id}`);
    return {
      platformSlug: "ds",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority DS weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, publisher, ratings-board, and specialist game-reference sources.",
      newOverview: rewrite.overview,
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
