const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const platformSlug = "ps2";
const dataPath = path.join(rootDir, "data", "games", `${platformSlug}.json`);
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-mountain-nba-reviewed-overviews-2026-08-25.csv"
);

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function currentOverviewFor(game) {
  return game.description || game.gcxOverview || game.overview || "";
}

const reviewed = {
  "ps2-mountain-bike-adrenaline": {
    sourceUrl: "https://francksauer.com/index.php/games?catid=15%3Apublished-games&id=25%3Amountain-bike-adrenaline&view=article",
    rewriteNotes: "Source cross-check: developer/project page describes bike physics, front and rear brakes, torque, manual/automatic gears, and downhill freeride handling.",
    newOverview:
      "Mountain Bike Adrenaline is a downhill mountain-bike racer that leans harder into bike control than its generic title suggests. Its handling model includes separate front and rear braking, torque management, and manual or automatic gearing, so the challenge is balancing speed, grip, and landing stability across steep routes. For collectors, it is a late PS2 outdoor-sports release from Fresh3D with a more simulation-minded foundation than many budget extreme-sports games."
  },
  "ps2-my-home-o-tsukurou-2-jujitsu-kantan-sekkei": {
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-20177.html",
    rewriteNotes: "Source cross-check: series reference describes home-design simulation, grid room layout, fixtures, floor choices, exterior details, and build-from-site modes.",
    newOverview:
      "My Home o Tsukurou 2! Jujitsu! Kantan Sekkei!! continues the Japanese home-design simulation idea, centering play on planning rooms, choosing fixtures, and shaping a house from layout to finish. The appeal is not twitch challenge but the slow satisfaction of arranging a livable space through grid-based design tools and domestic detail choices. It belongs in GCX as a lifestyle-simulation curiosity, especially for collectors interested in Japan-only software outside the usual action and RPG lanes."
  },
  "ps2-my-home-o-tsukurou-2-shou": {
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-20177.html",
    rewriteNotes: "Source cross-check: series reference describes the home-building simulation structure used by the My Home o Tsukurou line.",
    newOverview:
      "My Home o Tsukurou 2! Shou is another PS2 entry in the home-building simulation line, aimed at players who enjoy creating a house through layout planning, room arrangement, and interior/exterior choices. It is closer to a domestic design tool wrapped as a console game than a conventional strategy release. For the library, the useful distinction is that the game documents a particular Japanese simulation niche: everyday architecture, living spaces, and customization as the main reward loop."
  },
  "ps2-my-merry-maybe": {
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66488.html",
    rewriteNotes: "Source cross-check: My Merry May with be listing describes My Merry Maybe as part of the artificial-life romance visual novel collection with Replice themes.",
    newOverview:
      "My Merry Maybe is KID's follow-up visual novel in the My Merry May line, continuing the science-fiction romance theme around artificial life forms known as Replices. Its value is in character writing, branching scenes, and the emotional tension between ordinary school life and the question of what a created person can feel or become. On PS2 it is best understood as part of a connected visual-novel pair, especially now that later collections preserve both entries together."
  },
  "ps2-myself-yourself": {
    sourceUrl: "https://en.wikipedia.org/wiki/Myself_;_Yourself",
    rewriteNotes: "Source cross-check: article identifies the Regista/Yeti PS2 visual novel, rural Sakuranomori setting, returning protagonist Sana, dual-protagonist structure, and sequel.",
    newOverview:
      "Myself; Yourself is a PS2 visual novel set in the rural seaside town of Sakuranomori, where Sana Hidaka returns after five years away and finds that his childhood friendships have changed in darker, more complicated ways. The game is notable for its character-focused routes, Takumi Nakazawa scenario work, and two-protagonist structure rather than action systems. It sits at the intersection of late-2000s console romance VN, anime adaptation, and school-drama mystery."
  },
  "ps2-myth-makers-orbs-of-doom": {
    sourceUrl: "https://es.wikipedia.org/wiki/Myth_Makers%3A_Orbs_of_Doom",
    rewriteNotes: "Source cross-check: article describes the Myth Makers franchise, orb-rolling maze play, high-altitude obstacle courses, no-checkpoint penalty, and multiplayer support.",
    newOverview:
      "Myth Makers: Orbs of Doom is a budget action-puzzle game closer to an orb-rolling obstacle course than a shooter. Players guide a Myth Maker trapped inside a rolling sphere through maze-like levels suspended high above the ground, where falling usually means restarting the level. It is rough around the edges, but as a PS2 collector entry it represents Data Design Interactive's family-budget catalog and its attempts to remix simple arcade ideas into low-cost console releases."
  },
  "ps2-myth-makers-trixie-in-toyland": {
    sourceUrl: "https://es.wikipedia.org/wiki/Myth_Makers%3A_Trixie_in_Toyland",
    rewriteNotes: "Source cross-check: article identifies Trixie in Toyland as a Data Design Interactive platform game across Windows, PS2, and Wii in the Myth Makers franchise.",
    newOverview:
      "Myth Makers: Trixie in Toyland is a 3D platformer starring Trixie from Data Design Interactive's Myth Makers line. The game sends players through bright toy-themed spaces built around simple jumping, collecting, and obstacle navigation rather than deep combat or exploration. Its GCX value is as a late-budget PS2 platformer and part of the same family of PAL-market releases that later became familiar on Wii under Data Design's low-cost publishing push."
  },
  "ps2-nascar-08": {
    sourceUrl: "https://en.wikipedia.org/wiki/NASCAR_08",
    rewriteNotes: "Source cross-check: article covers PS2 developer split, Tony Stewart cover, Car of Tomorrow presence, ESPN integration, and mixed reception.",
    newOverview:
      "NASCAR 08 is a late PS2-era EA Sports NASCAR entry released alongside HD-console versions, with the PS2 version handled separately from the EA Tiburon-developed PS3/Xbox 360 editions. It features Tony Stewart branding, NASCAR's Car of Tomorrow presence, and ESPN-style presentation hooks, but its appeal is narrower than the stronger early-2000s NASCAR games. Collectors should read it as a transitional release from the period when EA was stretching the series across old and new hardware."
  },
  "ps2-nascar-thunder-2002": {
    sourceUrl: "https://en.wikipedia.org/wiki/NASCAR_Thunder_2002",
    rewriteNotes: "Source cross-check: article lists create-a-car, quick race, season, career, practice, qualifying, Happy Hour, 35-driver roster, unlockables, and alternate paint schemes.",
    newOverview:
      "NASCAR Thunder 2002 helped rebrand EA's stock-car series for the PS2 era, offering create-a-car, quick races, season play, career progression, practice, qualifying, and Happy Hour sessions before races. Its roster draws from the 2001 Winston Cup season, with unlockable fantasy and Busch Series drivers plus alternate paint schemes. The result is a fuller early-sixth-generation NASCAR package than the old annual-numbered entries, and an important stepping stone toward the deeper Thunder games that followed."
  },
  "ps2-nascar-dirt-to-daytona": {
    sourceUrl: "https://en.wikipedia.org/wiki/NASCAR:_Dirt_to_Daytona",
    rewriteNotes: "Source cross-check: article identifies Monster Games/Infogrames racing sim, Dodge Weekly Racing Series, Featherlite Modified Tour, Craftsman Truck Series, and Winston Cup Series progression.",
    newOverview:
      "NASCAR: Dirt to Daytona is prized because it does more than drop players directly into top-level stock-car racing. Its career ladder starts in dirt short-track competition and moves through modifieds and trucks before reaching the Winston Cup Series, giving the PS2 game a sense of racing progression that many licensed sports titles lack. For collectors and racing fans, that ladder structure is the reason it still stands apart from EA's flashier NASCAR Thunder line."
  },
  "ps2-nba-live-06": {
    sourceUrl: "https://en.wikipedia.org/wiki/NBA_Live_06",
    rewriteNotes: "Source cross-check: article covers EA Canada, Dwyane Wade cover, Dynasty/Season/Playoffs/Free Play, All-Star Weekend, dunk contest, and 3-point contest.",
    newOverview:
      "NBA Live 06 is the Dwyane Wade-cover entry in EA's basketball series and one of the last PS2-era Live games before the brand's identity became more uneven. On PS2, the draw is the full traditional package: quick play, Season, Playoffs, Dynasty management, roster moves, coaching staff, training camp, and All-Star Weekend events like the dunk and three-point contests. It is a useful snapshot of mid-2000s EA basketball, when modes and presentation breadth were as important as on-court feel."
  }
};

function main() {
  const games = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const rows = Object.entries(reviewed).map(([gameId, review]) => {
    const game = games.find((item) => item.id === gameId);
    if (!game) throw new Error(`Missing game ${gameId}`);
    return {
      platformSlug,
      gameId,
      title: game.title || game.name || "",
      currentOverview: currentOverviewFor(game),
      sourceUrl: review.sourceUrl,
      rewriteNotes: review.rewriteNotes,
      newOverview: review.newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX Editorial"
    };
  });

  const headers = [
    "platformSlug",
    "gameId",
    "title",
    "currentOverview",
    "sourceUrl",
    "rewriteNotes",
    "newOverview",
    "reviewStatus",
    "reviewer"
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );

  console.log(JSON.stringify({ outputPath, rowCount: rows.length }, null, 2));
}

main();
