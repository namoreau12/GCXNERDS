const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-higurashi-evangelion-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-higurashi-no-naku-koro-ni-kizuna-daiyonkan-kizuna",
    sourceUrl: "https://en.wikipedia.org/wiki/Higurashi_When_They_Cry",
    overview:
      "Higurashi no Naku Koro ni Kizuna: Daiyonkan Kizuna is the fourth and closing DS volume in Alchemist's portable Higurashi Kizuna line. Like the rest of the sequence, it is a murder-mystery visual novel built around reading, route structure, character suspicion, and supplemental TIPS rather than conventional action. Its library role is as the completion point for the DS adaptation, aimed at fans following the Hinamizawa mystery across all four Japanese releases.",
  },
  {
    id: "ds-hiiro-no-kakera-ds",
    sourceUrl: "https://www.siliconera.com/hiiro-no-kakera-ds-touch-screen-guide/",
    overview:
      "Hiiro no Kakera DS is Idea Factory and Otomate's handheld port of the supernatural otome visual novel, with DS-specific touch-screen features and full voice acting noted around release. The story follows Tamaki as she returns to a rural village, discovers her Tamayori Princess role, and grows close to male guardians tied to the local myth. It is best treated as a romance-heavy visual novel for otome fans, not a general adventure game.",
  },
  {
    id: "ds-hirameki-action-chibikko-wagan-no-daiki-na-bouken",
    sourceUrl: "https://kotaku.com/games/hirameki-action-chibikko-wagyan-no-daiki-na-bouken",
    overview:
      "Hirameki Action: Chibikko Wagyan no Daiki na Bouken is a Japan-only DS reboot of Namco Bandai's Wagyan Land line. Kotaku's database identifies it as a platform game, which fits the series' mix of side-scrolling action and puzzle-like word or mini-game challenges. For collectors, the draw is the return of a long-running Japanese mascot series on DS, with import appeal tied to cute presentation and language-dependent puzzle segments.",
  },
  {
    id: "ds-hiromichi-oniisan-no-oyako-taisou-navi",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/141614-hiromichi-oniisan-no-oyako-taisou-navi-oyako-no-skin-ship-tairyoku-zukuri",
    overview:
      "Hiromichi Oniisan no Oyako Taisou Navi: Oyako no Skin-Ship & Tairyoku Zukuri is a Japanese family-fitness DS release built around parent-child exercise. LaunchBox lists the January 31, 2008 release and its focus on bonding exercises, which makes it closer to a guided activity program than a sports game. The title is most useful in the GCX library as a reminder of the DS's lifestyle-software boom: regional, practical, and aimed at families using the handheld away from normal game genres.",
  },
  {
    id: "ds-hissatsu-kung-fu-kanji-dragon",
    sourceUrl: "https://www.pricecharting.com/game/jp-nintendo-ds/hissatsu-kung-fu-kanji-dragon",
    overview:
      "Hissatsu Kung Fu: Kanji Dragon is a Japanese educational DS game from Success built around kanji practice with a martial-arts wrapper. PriceCharting identifies it as an educational release with a CERO A rating, matching its kid-friendly study-game role better than an action label. The appeal is drilling characters through short lessons and exercises while using the DS touch screen, making it a niche import for language learners and education-software collectors.",
  },
  {
    id: "ds-hisshou-pachinko-pachi-slot-kouryaku-series-ds-vol-1-shinseiki-evangelion-magokoro-o-kimi-ni",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/141997-hisshou-pachinko-pachi-slot-kouryaku-series-ds-vol-1-shinseiki-evangelion-magokoro-o-kimi-ni",
    overview:
      "Hisshou Pachinko*Pachi-Slot Kouryaku Series DS Vol. 1: Shinseiki Evangelion - Magokoro o, Kimi ni is a Japanese gambling-machine simulation tied to Neon Genesis Evangelion. LaunchBox identifies the DS release as a Bisty-developed gambling simulation from February 2008, so the important context is machine recreation rather than casino variety. It belongs in the library as a licensed pachinko/pachi-slot strategy product for Evangelion collectors and parlor-game fans.",
  },
  {
    id: "ds-hisshou-pachinko-pachi-slot-kouryaku-series-ds-vol-2-cr-shinseiki-evangelion-shito-futatabi",
    sourceUrl: "https://www.amazon.com/Hisshou-Pachinko-Pachi-Slot-Kouryaku-DS-Nintendo/dp/B001AN80LM",
    overview:
      "Hisshou Pachinko*Pachi-Slot Kouryaku Series DS Vol. 2: CR Shinseiki Evangelion - Shito, Futatabi continues D3 Publisher's DS line of Evangelion pachinko and pachi-slot simulations. The focus is not adventure or combat, but recreating a specific Japanese parlor machine experience with menus, reels or pachinko behavior, licensed imagery, and strategy-reference appeal. It is a specialist import entry whose value is strongest for Evangelion merchandise collectors and pachinko fans.",
  },
  {
    id: "ds-hisshou-pachinko-pachi-slot-kouryaku-series-ds-vol-3-shinseiki-evangelion-yakusoku-no-toki",
    sourceUrl: "https://www.play-asia.com/hu/hisshou-pachinkopachi-slot-kouryaku-series-ds-vol-3-shinseiki-ev/13/70315g",
    overview:
      "Hisshou Pachinko*Pachi-Slot Kouryaku Series DS Vol. 3: Shinseiki Evangelion - Yakusoku no Toki is another D3 Publisher DS machine-simulation release built around Evangelion-branded pachi-slot play. Play-Asia lists it as a 2008 Japan-only miscellaneous title developed and published by D3Publisher, which fits the series' practical strategy-guide flavor. It is a narrow import for parlor-machine study and franchise collecting, not a broad casino compilation.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on catalog, article, review, and specialist gameplay sources.",
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
