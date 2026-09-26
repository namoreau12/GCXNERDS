const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-inugamike-aiigo-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-inugamike-no-ichizoku",
    sourceUrl: "https://www.fromsoftware.jp/ww/detail.html?csm=068",
    overview:
      "Inugamike no Ichizoku is a Japan-only DS detective adventure from FromSoftware, based on Seishi Yokomizo's classic Kosuke Kindaichi mystery novel. The game is built around reading, investigation, and case progression rather than combat, making it a notable curiosity for FromSoftware collectors who know the studio mainly for action RPGs. Its appeal is strongest as a Japanese-language mystery adaptation and as part of the company's pre-Souls handheld catalog.",
  },
  {
    id: "ds-iraroji-vow",
    sourceUrl: "https://www.fromsoftware.jp/ww/detail.html?csm=058",
    overview:
      "Iraroji VOW is FromSoftware's DS take on illustration logic puzzles, also described in databases as a nonogram-style puzzle release. Players solve numbered grids to reveal images, with the VOW branding adding humorous photos and commentary as rewards. For GCX, it should sit near Picross-style imports: low on story, high on grid-solving repetition, and interesting because it shows a very different side of FromSoftware's DS output.",
  },
  {
    id: "ds-iron-feather",
    sourceUrl: "https://ds.gamespy.com/nintendo-ds/iron-phaser/",
    overview:
      "Iron Feather is a Japan-only Konami action RPG for Nintendo DS. Contemporary listings and coverage describe a top-down adventure where multiple characters fight together across a fantasy landscape, with touch-screen-driven play and RPG progression rather than pure arcade action. It is most useful to collectors as an obscure Konami handheld RPG from 2006, especially for players interested in import-only DS action RPG experiments.",
  },
  {
    id: "ds-iron-master-the-legendary-blacksmith",
    sourceUrl: "https://www.siliconera.com/iron-master-brings-blacksmithing-to-the-ds-in-september/",
    overview:
      "Iron Master: The Legendary Blacksmith is a DS shop-and-crafting simulation about running a weapons business. Instead of playing as the adventurer, players forge equipment through touch-screen minigames, sell gear to visiting heroes, and use earnings to make better items. The hook is blacksmith production and storefront management, so it belongs closer to crafting sims than traditional action RPGs despite the fantasy setting.",
  },
  {
    id: "ds-ishin-no-arashi-shippuu-ryuumeden",
    sourceUrl: "https://www.play-asia.com/it/ishin-no-arashi-shippuu-ryuumeden/13/703ylm",
    overview:
      "Ishin no Arashi: Shippuu Ryuumeden is a Japan-only Koei Tecmo historical strategy game for DS. It continues Koei's long-running interest in Bakumatsu-era political simulation, where persuasion, faction movement, and historical figures matter more than fast action. For the GCX library, the important context is that this is niche Japanese strategy software built around Restoration-era politics and Koei's simulation lineage.",
  },
  {
    id: "ds-item-getter-bokura-no-kagaku-to-mahou-no-kankei",
    sourceUrl: "https://www.vgchartz.com/game/34223/item-getter-bokura-no-kagaku-to-mahou-no-kankei/",
    overview:
      "Item Getter: Bokura no Kagaku to Mahou no Kankei is a Japan-only DS role-playing game published by 5pb. The premise mixes science-and-magic theming with item-focused RPG progression, putting its identity closer to a niche import RPG than a broad-audience adventure release. For collectors, it is mainly notable as a late-2000s Japanese DS RPG with limited overseas visibility and a title that depends heavily on Japanese text.",
  },
  {
    id: "ds-itouke-no-urawaza-ds",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/132337-itouke-no-urawaza-ds",
    overview:
      "Itouke no Urawaza DS is a Japan-only Spike release categorized as educational or miscellaneous software rather than a conventional game. The title ties into practical tips and everyday-life tricks, making it closer to an interactive reference or lifestyle cartridge than an adventure, puzzle, or RPG. It matters in the DS library as part of the platform's broad Japanese non-game software wave.",
  },
  {
    id: "ds-itsu-demo-doko-demo-dekiru-igo-ai-igo-ds",
    sourceUrl: "https://www.honestgamers.com/56004/ds/itsu-demo-doko-demo-dekiru-igo-ai-igo-ds/game.html",
    overview:
      "Itsu Demo Doko Demo Dekiru Igo: AI Igo DS is a Japanese board-game release centered on Go. Catalog data identifies it as a Marvelous Interactive DS title, and strategy references describe computer play, local two-player matches, saved match notation, and study tools. Its value is straightforward: it turns the handheld into a portable Go board and practice partner, with the appeal coming from board analysis and repeat practice rather than a story campaign or arcade gimmick.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on official, specialist database, retail, and contemporary coverage sources.",
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
