const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-jakepower-jellybelly-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-jake-power-firefighter",
    sourceUrl: "https://www.nintendoworldreport.com/review/18338/jake-power-firemanpoliceman-nintendo-ds",
    overview:
      "Jake Power: Firefighter, released in some regions as Jake Power: Fireman, is a kid-focused rescue minigame collection rather than a fighting game. Players take Jake through firefighter missions such as putting out flames, rescuing cats, climbing ladders, and handling emergency tasks through simple DS interactions. Its place in the library is as part of Ubisoft's short-lived Jake Power career-fantasy line for younger players.",
  },
  {
    id: "ds-jake-power-handyman",
    sourceUrl: "https://www.mobygames.com/game/150117/jake-power-handyman/",
    overview:
      "Jake Power: Handyman is a child-friendly job-role game about helping townspeople with repairs and cleanup jobs. Players drive Jake's company van, take on service calls, fix broken facilities, build or clean up objects, and unlock tools or van upgrades as they progress. It is best understood as a light minigame-and-task collection for younger DS owners, not a traditional adventure game.",
  },
  {
    id: "ds-jake-power-policeman",
    sourceUrl: "https://www.amazon.com/Jake-Power-Policeman-Nintendo-DS/dp/B001F7DVXA",
    overview:
      "Jake Power: Policeman puts the same kid-career formula into a police setting. Retail copy emphasizes driving through city streets with sirens and flashing lights, answering radio calls, avoiding traffic, and catching troublemakers through simple mission scenarios. The appeal is approachable role-play for children who want to pretend to be a police officer, with short action tasks rather than deep investigation or simulation.",
  },
  {
    id: "ds-jake-power-soccer-star",
    sourceUrl: "https://www.mobygames.com/game/150157/jake-power-soccer-star/",
    overview:
      "Jake Power: Soccer Star follows Jake as a young player trying to build his soccer skills and impress scouts on the way toward a World Cup dream. The game is part sports-themed minigame collection and part career fantasy, with training tasks and simplified soccer challenges aimed at younger players. GCX should position it near Ubisoft's other Jake Power job-role releases rather than serious DS soccer simulations.",
  },
  {
    id: "ds-james-pond-robocod",
    sourceUrl: "https://en.wikipedia.org/wiki/James_Pond_2",
    overview:
      "James Pond: RoboCod is the Nintendo DS version of James Pond 2: Codename RoboCod, a British platformer about stopping Dr. Maybe at Santa's toy factory. The DS-era release is a remake-style version with updated layouts and a second-screen map, built around jumping on enemies, rescuing Santa's workers, and using RoboCod's stretching body armor to reach platforms. Its collector interest comes from being one of the many later budget reissues of a once-prominent Amiga and Mega Drive platformer.",
  },
  {
    id: "ds-jan-sangoku-musou",
    sourceUrl: "https://www.koeitecmoamerica.com/smusou25th/us/history/titles/smusou_j.html",
    overview:
      "Jan Sangoku Musou is Koei's unusual Dynasty Warriors mahjong spin-off for DS, PSP, and PS2. Koei Tecmo describes it as a classic mahjong game featuring Dynasty Warriors characters, with series-flavored quotes, effects, player records, and tile-discard tracking. There are no battlefield musou stages here; the novelty is seeing Three Kingdoms warriors folded into a traditional mahjong structure.",
  },
  {
    id: "ds-jane-s-hotel",
    sourceUrl: "https://www.amazon.com/Janes-Hotel-Nintendo-DS-Renewed/dp/B0CLZDY26M",
    overview:
      "Jane's Hotel brings the casual time-management hotel formula to Nintendo DS. Players manage the day-to-day work of keeping guests satisfied, juggling service requests, upgrades, and routine hotel tasks under light business-simulation pressure. It belongs beside other casual PC-to-DS management games: approachable, menu-driven, and built around steady multitasking rather than a deep tycoon sandbox.",
  },
  {
    id: "ds-jelly-belly-ballistic-beans",
    sourceUrl: "https://www.ebay.com/p/72453317",
    overview:
      "Jelly Belly: Ballistic Beans! is an arcade puzzle game, not a sports release. Players fire jellybeans from a cannon into matching cups, working through more than 150 levels with power-ups, score targets, and puzzle layouts spread across themed worlds such as Halloween, Space, and Sport. Its value is mostly as a licensed oddity: a branded candy game with simple Peggle-like aim-and-score appeal.",
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
    if (!game) throw new Error(`Missing DS game ${rewrite.id}`);
    rows.push([
      "ds",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority DS weak-template cleanup; original GCX editorial overview based on retail catalog, specialist database, review, official series, and platform-history sources.",
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
