const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps5.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps5-priority-xmas-aero-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "ps5-xmas-super-puzzles-dream",
    sourceUrl: "https://store.playstation.com/en-us/product/UP8121-PPSA12663_00-0617246899458711/",
    overview:
      "#Xmas, Super Puzzles Dream is e-llusiontertainment's PS5 entry in the Super Puzzles Dream line, built around falling jigsaw pieces and Christmas-themed illustrations. The PlayStation Store listing describes junior and senior difficulty levels, co-op puzzle play, split-screen versus competition, animated backgrounds, and one- or two-player offline support. Marketplace listings should identify it as a digital PS5 puzzle release, note the seasonal theme, region, local multiplayer modes, and the distinction from other Super Puzzles Dream volumes.",
  },
  {
    id: "ps5-0-degrees",
    sourceUrl: "https://store.playstation.com/ja-jp/concept/10002669",
    overview:
      "0 Degrees is Eastasiasoft's PS4 and PS5 action-puzzle platformer, developed with Kiddo Dev and Nerd Games, where players create and use ice blocks to solve compact stages. PlayStation Store records and Eastasiasoft catalog data place it as a low-price cross-generation digital release rather than a boxed retail game. Listings should call out region, PS4/PS5 entitlement expectations, language support, digital-only status, and the puzzle-platforming structure instead of broad action-game claims.",
  },
  {
    id: "ps5-3-c-sand-puzzle",
    sourceUrl: "https://www.kemco-games.com/global/games.html/1000",
    overview:
      "3 Celsius: Sand Puzzle is KEMCO and COOL&WARM's PS5 and PS4 sand-clearing puzzle game. KEMCO's catalog describes the hook as clearing connected sand grains all at once, positioning it as a small rules-driven puzzle release rather than an RPG from KEMCO's better-known catalog. Listings should preserve the unusual title, note digital platform availability, language or region details, and explain the sand-connection puzzle loop so buyers do not mistake it for a compilation.",
  },
  {
    id: "ps5-3d-pool-billiards-and-snooker-remastered",
    sourceUrl: "https://gamefaqs.gamespot.com/ps5/313657-3d-billiards-pool-and-snooker-remastered/data",
    overview:
      "3D Pool: Billiards & Snooker Remastered is Joindots' PS5 version of its cue-sports game, covering pool hall standards such as eight-ball, nine-ball, ten-ball, and snooker. Game reference listings identify PS5 PlayStation Store releases and later physical distribution in some regions, making format and region important for collectors. Listings should mention one- or two-player local play, physical versus digital status, regional publisher differences, and whether a buyer wants the remastered PS5 release rather than the older PS4 version.",
  },
  {
    id: "ps5-20-bunnies",
    sourceUrl: "https://www.eastasiasoft.com/games/20-Bunnies",
    overview:
      "20 Bunnies is Eastasiasoft and Nerd Games' PS5 and PS4 action-puzzle platformer about finding hidden bunnies across hazard-filled minimalist stages. Eastasiasoft's page lists it as a digital release with English subtitles, one-player support, time tracking, instant retries, unlockable bunny images, and a relaxed soundtrack. Marketplace records should note digital format, region, PS4/PS5 availability, and the hidden-object platforming loop instead of treating it like a combat-focused action game.",
  },
  {
    id: "ps5-30-sport-games-in-1",
    sourceUrl: "https://store.playstation.com/en-us/concept/10008873",
    overview:
      "30 Sport Games in 1 is Maximum Entertainment France's PS5 party-sports compilation with local play for up to four players. The PlayStation Store listing describes quick match and tournament modes, team or solo play, unlockable costumes, and events ranging from football and basketball to archery, bowling, skiing, boxing, and kayaking. Listings should identify PS5 or PS4 edition, physical or digital format, local-player count, language support, and whether the buyer expects a broad minigame collection rather than a simulation of one licensed sport.",
  },
  {
    id: "ps5-1917-the-alien-invasion-dx-remastered",
    sourceUrl: "https://www.redartgames.com/2-games?page=16",
    overview:
      "1917: The Alien Invasion DX Remastered is Andrade Games and Red Art Games' remastered shoot-'em-up for PlayStation 5. Red Art's catalog lists the PS5 release, while retailer and specialist records present it as a horror-tinged, historical-sci-fi arcade shooter with physical PS5 distribution. Listings should spell out the long DX Remastered title, distinguish physical and digital editions, note Red Art publishing, region, and whether the copy is standard or deluxe packaging.",
  },
  {
    id: "ps5-a-juggler-s-tale",
    sourceUrl: "https://gamefaqs.gamespot.com/ps5/330849-a-jugglers-tale/data",
    overview:
      "A Juggler's Tale is Kaleidoscube and Mixtvision's PS5 release of a cinematic 2D puzzle-platform adventure framed like a puppet-show fable. Store and catalog references place the PS5 version alongside Switch, PC, PS4, Xbox One, and Xbox Series releases, with Mixtvision as publisher. Listings should emphasize story-driven platforming, digital format, region, language support, and the marionette-style presentation rather than describing it as a mascot platformer.",
  },
  {
    id: "ps5-accolade-sports-collection",
    sourceUrl: "https://store.steampowered.com/app/3310260/Accolade_Sports_Collection_QUByte_Classics/",
    overview:
      "Accolade Sports Collection is QUByte Interactive and Atari's retro sports compilation in the QUByte Classics line. Publisher and store listings identify five included games: Hardball!, Hardball II, Hoops Shut Up and Jam!, Winter Challenge, and Summer Challenge, with modern wrapper features such as save states, filters, and manuals. PS5 listings should call out included titles, physical or digital availability, local multiplayer, region, and Atari/Accolade preservation appeal rather than presenting it as a new annual sports release.",
  },
  {
    id: "ps5-aero-the-acro-bat",
    sourceUrl: "https://gamefaqs.gamespot.com/ps5/474421-aero-the-acro-bat/data",
    overview:
      "Aero the Acro-Bat is Ratalaika Games and Shinyuden's PS5 re-release of Sunsoft's 1993 circus-themed 2D platformer. Game reference data places the PS5 PlayStation Store release on August 2, 2024, while the original game is remembered as a Super NES and Genesis-era mascot platformer about Aero fighting Edgar Ektor's twisted amusement-world takeover. Listings should distinguish the first Aero from Aero the Acro-Bat 2 and later spinoffs, note digital or physical options, region, and retro-platformer expectations.",
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
    if (!game) throw new Error(`Missing PS5 game ${rewrite.id}`);
    return {
      platformSlug: "ps5",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority PS5 weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, publisher, store, developer, and specialist game-reference sources.",
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
