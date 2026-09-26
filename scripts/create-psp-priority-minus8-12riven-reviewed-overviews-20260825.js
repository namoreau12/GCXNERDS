const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "psp-priority-minus8-12riven-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "psp.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "psp-8-minus-8",
    title: "-8 (Minus 8)",
    sourceUrl: "https://kotaku.com/games/minus-8",
    newOverview:
      "-8 (Minus 8) is a Japan-only otome visual novel collaboration from Otomate, Rejet, and Nico Nico Douga, published by Idea Factory for PSP in 2014. Coverage and database listings frame it around Mogura Gakuen, a school for hopelessly disappointing students, where the heroine's relationships can turn a group of misfit boys from \"minus\" toward \"plus.\" GCX should present it as a comedy-leaning otome import with strong character-art appeal, not as a general adventure game.",
  },
  {
    gameId: "psp-hack-link",
    title: ".hack//Link",
    sourceUrl: "https://en.wikipedia.org/wiki/.hack//Link",
    newOverview:
      ".hack//Link is CyberConnect2's Japan-exclusive PSP action RPG that acts as a major crossover chapter for the .hack universe. The story follows Tokio Kuryuu after he is pulled into The World R:X, where the Akashic Records let him revisit earlier .hack timelines and fight alongside returning characters. GCX should describe it as a lore-heavy finale-style fan-service entry with simplified action combat, not a normal standalone handheld RPG.",
  },
  {
    gameId: "psp-0-ji-no-kane-to-cinderella-halloween-wedding",
    title: "0 Ji no Kane to Cinderella: Halloween Wedding",
    sourceUrl: "https://www.honestgamers.com/67757/psp/0ji-no-kane-to-cinderella-halloween-wedding/game.html",
    newOverview:
      "0 Ji no Kane to Cinderella: Halloween Wedding is a QuinRose PSP otome visual novel and one of the Cinderella-themed Halloween Wedding companion releases. HonestGamers catalogs the Japanese PSP release with QuinRose as both developer and publisher. GCX should position it as a niche otome import for players tracking QuinRose's connected fairy-tale romance line, where the draw is route structure, character writing, and collector context rather than action mechanics.",
  },
  {
    gameId: "psp-1-2-summer",
    title: "1/2 summer+",
    sourceUrl: "https://zh.wikipedia.org/wiki/1/2_summer",
    newOverview:
      "1/2 summer+ is Alchemist's PSP version of ALcot Honey Comb's summer romance visual novel. Public series documentation describes a story set around the supernatural events that surround protagonist Kusanagi Kasumi during a return to his hometown of Kamizako, with the PSP edition adding heroine routes beyond the original PC release. GCX should describe it as a warm seasonal romance VN with light supernatural flavor and expanded portable-route appeal.",
  },
  {
    gameId: "psp-7-wonders-of-the-ancient-world",
    title: "7 Wonders of the Ancient World",
    sourceUrl: "https://en.wikipedia.org/wiki/7_Wonders_of_the_Ancient_World_(video_game)",
    newOverview:
      "7 Wonders of the Ancient World is a match-three puzzle release from Hot Lava Games and MumboJumbo that sends players through rune-swapping stages themed around rebuilding the classical Seven Wonders. Quest Mode structures each wonder as a run of puzzle boards, while Free Play opens completed stages for repeat sessions. GCX should frame the PSP version as a portable casual-puzzle release with historical dressing and quick-session appeal.",
  },
  {
    gameId: "psp-7th-dragon-2020",
    title: "7th Dragon 2020",
    sourceUrl: "https://en.wikipedia.org/wiki/7th_Dragon",
    newOverview:
      "7th Dragon 2020 moves Sega and Imageepoch's dragon-hunting RPG series from fantasy into a near-future Tokyo overrun by invaders and dragon-spawned flowers. Players build a custom squad from modernized classes, then push through city dungeons while the Hatsune Miku collaboration adds DIVA Mode music flavor. GCX should call it a stylish Japan-only PSP dungeon RPG and a key bridge between the DS original and 7th Dragon III.",
  },
  {
    gameId: "psp-7th-dragon-2020-ii",
    title: "7th Dragon 2020-II",
    sourceUrl: "https://en.wikipedia.org/wiki/7th_Dragon",
    newOverview:
      "7th Dragon 2020-II is the direct PSP sequel to 7th Dragon 2020, again from Sega and Imageepoch, set one year later as dragons return to threaten Japan. The sequel keeps the post-apocalyptic Tokyo dungeon-RPG structure while adding the Idol class and bringing back the Hatsune Miku-linked DIVA Mode option. GCX should distinguish it as an iteration for fans who want more of the 2020 formula, sharper party-building, and another import-only chapter before Code: VFD.",
  },
  {
    gameId: "psp-11eyes-crossover",
    title: "11eyes: Crossover",
    sourceUrl: "https://en.wikipedia.org/wiki/11eyes:_Tsumi_to_Batsu_to_Aganai_no_Sh%C5%8Djo",
    newOverview:
      "11eyes: Crossover is 5pb.'s PSP version of Lass's supernatural suspense visual novel, expanding the original 11eyes material with the CrossOver scenario. Its core hook is the Red Night, an alternate world where Kakeru, Yuka, and other students are hunted by grotesque enemies while uncovering the mystery of Lisette and the Black Knights. GCX should present it as a darker VN import with anime ties, branching choices, and a strong occult-action premise.",
  },
  {
    gameId: "psp-12-ji-no-kane-to-cinderella-halloween-wedding",
    title: "12 Ji no Kane to Cinderella: Halloween Wedding",
    sourceUrl: "https://www.honestgamers.com/67761/psp/12ji-no-kane-to-cinderella-halloween-wedding/game.html",
    newOverview:
      "12 Ji no Kane to Cinderella: Halloween Wedding is the central PSP entry in QuinRose's Cinderella-inspired Halloween Wedding otome line, released in Japan in 2012. Listings identify it as a QuinRose-developed and published visual novel, and fan coverage treats it as the key starting point before the 0 Ji and 24 Ji companion stories. GCX should frame it as a fairy-tale romance import where character routes and QuinRose's house style are the main reasons collectors notice it.",
  },
  {
    gameId: "psp-12riven-the-psi-climinal-of-integral",
    title: "12Riven: The Psi-Climinal of Integral",
    sourceUrl: "https://en.wikipedia.org/wiki/12Riven:_The_Psi-Climinal_of_Integral",
    newOverview:
      "12Riven: The Psi-Climinal of Integral is a CyberFront/KID-linked visual novel associated with the Infinity lineage behind Never 7, Ever 17, and Remember 11. The story begins on 20 May 2012 with two protagonists converging on a crisis at the Integral building, while player choices steer the mystery toward multiple endings and a true route. GCX should present the PSP version as a serious sci-fi suspense VN import for readers who follow Uchikoshi-era mystery games.",
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
