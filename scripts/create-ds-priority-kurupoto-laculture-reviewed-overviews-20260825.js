const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-kurupoto-laculture-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ds-kurupoto-cool-cool-stars",
    title: "Kurupoto Cool Cool Stars",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/14666-kurupoto-cool-cool-stars",
    newOverview:
      "Kurupoto Cool Cool Stars is a colorful DS puzzle game about restoring fallen stars by clearing halo puzzles across Kurupoto Island. Players work through compact, touch-friendly challenges rather than a traditional action campaign, giving it the short-session rhythm that fit the handheld well. GCX should frame it as a puzzle import/localization curiosity from Starfish-SD and UFO Interactive, especially for collectors tracking lesser-known DS puzzle releases.",
  },
  {
    gameId: "ds-kururin-doughnuts-okashi-recipe",
    title: "Kururin Doughnuts: Okashi Recipe",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/141593-kururin-doughnut-okashi-na-recipe",
    newOverview:
      "Kururin Doughnuts: Okashi Recipe is a Japan-only DS oddity that mixes a recipe application with a cute rolling-doughnut platform game. The action portion sends a sentient doughnut through stages, collecting stars and avoiding hazards while stylus circles control its bounce and movement. GCX should describe it as part cooking software, part mascot platformer, with its appeal tied to the unusual format and Global A's niche import catalog.",
  },
  {
    gameId: "ds-kutsushita-nyanko-kutsushita-o-haita-neko-to-kurashi-hajime-mashita",
    title: "Kutsushita Nyanko: Kutsushita o Haita Neko to Kurashi Hajime Mashita",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/134193-kutsushita-nyanko-kutsushita-o-haita-neko-to-kurashi-hajime-mashita",
    newOverview:
      "Kutsushita Nyanko: Kutsushita o Haita Neko to Kurashi Hajime Mashita is a Japanese life-simulation release built around San-X's sock-wearing cat character. Its collector identity is closer to mascot-care software than action or RPG play: gentle routines, character interaction, and franchise charm are the draw. GCX should position it as a D3Publisher character-life import where the audience is mainly San-X fans, DS pet-sim collectors, and players comfortable with Japanese text.",
  },
  {
    gameId: "ds-kuukan-zukei-hirameki-training-kuutore",
    title: "Kuukan * Zukei: Hirameki Training - KuuTore",
    sourceUrl: "https://downloads.khinsider.com/game-soundtracks/album/kuukan-zukei-hirameki-training-kuutore-2008-nds-gamerip",
    newOverview:
      "Kuukan Zukei: Hirameki Training - KuuTore is a Benesse educational DS title from Good-Feel focused on spatial-shape practice and quick visual reasoning. Rather than presenting itself as a conventional game, it uses the handheld for training drills around geometry, patterns, and mental visualization. GCX should treat it as a Japan-only learning release, notable for Good-Feel's involvement before the studio became better known for polished character platformers.",
  },
  {
    gameId: "ds-kuwagata-tsumami",
    title: "Kuwagata Tsumami",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/134194-kuwagata-tsumami-kuttsuke-tsumami-bako",
    newOverview:
      "Kuwagata Tsumami is a Japan-only Success puzzle release tied to the Kuwagata Tsumami character property. The DS entry is cataloged as a puzzle game, so GCX should present it as a compact character-branded import rather than overselling it as a major franchise release. Its value for collectors comes from the unusual license, Japanese-market packaging, and Success publishing credit more than broad name recognition.",
  },
  {
    gameId: "ds-kyouryuu-monster",
    title: "Kyouryuu Monster",
    sourceUrl: "https://www.play-asia.com/en/kyouryuu-ikusei-battle-rpg-kyouryuu-monster/13/7025rz",
    newOverview:
      "Kyouryuu Monster, formally Kyouryuu Ikusei Battle RPG: Kyouryuu Monster, is a Japanese MTO dinosaur-raising battle RPG for Nintendo DS. The title points toward training and battling dinosaur-like creatures rather than simple encyclopedia software, placing it near the handheld's creature-collection and kids' RPG lane. GCX should identify it as a region-free import candidate where Japanese comprehension, monster-raising structure, and complete packaging are the key collector considerations.",
  },
  {
    gameId: "ds-l-enigmistica",
    title: "L'Enigmistica",
    sourceUrl: "https://www.mobygames.com/company/25950/pub-company-srl/",
    newOverview:
      "L'Enigmistica is an Italian-market Nintendo DS puzzle release credited to Pub Company s.r.l. and aimed at traditional paper-style brainteasers rather than arcade play. With limited English-language coverage, GCX should describe it conservatively as a regional word-and-puzzle title whose appeal depends heavily on language, locality, and physical completeness. It belongs in the DS library as a niche European release, not as a mainstream puzzle showcase.",
  },
  {
    gameId: "ds-l-histoire-de-france-pour-les-nuls",
    title: "L'Histoire de France Pour Les Nuls",
    sourceUrl: "https://www.jeuxvideo.com/jeux/nintendo-ds/00025485-l-histoire-de-france-pour-les-nuls.htm",
    newOverview:
      "L'Histoire de France Pour Les Nuls is a French educational DS release built around multiple-choice history quizzes and short learning prompts. It adapts the familiar Pour les Nuls style into a handheld revision tool, aimed more at adults and learners brushing up on French history than at action-game players. GCX should frame it as a ludo-educational regional release where French language, subject interest, and Anuman/Atari-era DS collecting context matter most.",
  },
  {
    gameId: "ds-la-carte-au-tresor",
    title: "La Carte au Tresor",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    newOverview:
      "La Carte au Tresor is a European Mindscape DS adventure release whose title translates to The Treasure Map. With sparse public coverage, GCX should keep the entry grounded in what the catalog supports: a regional adventure title from Mindscape built around exploration and puzzle progression rather than action spectacle. For collectors, the practical value is confirming title spelling, publisher, platform, and its place among French-language DS releases.",
  },
  {
    gameId: "ds-la-culture-generale-pour-les-nuls-edition-2",
    title: "La Culture Generale Pour Les Nuls Edition 2",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    newOverview:
      "La Culture Generale Pour Les Nuls Edition 2 is a French general-knowledge training title for Nintendo DS, continuing the Pour les Nuls educational line with quiz-driven study material. It should be understood as portable trivia and revision software, not as a story-led game or action puzzler. GCX should position it as a regional educational collectible where the series branding, French-language content, and Anuman/Atari publishing context are the main reasons to track it.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing DS game record for ${gameId}`);
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
      "ds",
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority DS weak-template replacement with source-backed GCX editorial overview.",
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
