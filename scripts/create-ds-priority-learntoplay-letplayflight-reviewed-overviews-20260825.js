const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-learntoplay-letplayflight-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ds-learn-to-play-chess-with-fritz-and-chesster",
    title: "Learn to Play Chess with Fritz and Chesster",
    sourceUrl: "https://www.nintendolife.com/games/ds/learn_to_play_chess_with_fritz_and_chesster",
    newOverview:
      "Learn to Play Chess with Fritz and Chesster is a child-friendly DS chess tutor built around the Fritz and Chesster teaching series rather than a plain chessboard app. Nintendo Life catalogs the DS version as a Deep Silver release, while the wider Fritz and Chesster program uses characters, minigames, and staged lessons to teach movement, checkmate ideas, and basic strategy. GCX should frame it as a story-flavored instructional cartridge for younger chess learners and educational DS collectors.",
  },
  {
    gameId: "ds-learning-to-spell",
    title: "Learning to Spell",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_505_video_games",
    newOverview:
      "Learning to Spell is a 505 Games Nintendo DS educational release focused on spelling practice rather than traditional action or adventure play. 505's public game list categorizes it as a brain-training title, and retail cataloging identifies it as an E-rated 2010 DS cartridge. GCX should present it as a straightforward literacy-practice entry for families, school-adjacent collections, and players tracking the DS's large educational-software library.",
  },
  {
    gameId: "ds-left-brain-right-brain",
    title: "Left Brain Right Brain",
    sourceUrl: "https://www.honestgamers.com/30587/ds/left-brain-right-brain/game.html",
    newOverview:
      "Left Brain Right Brain is an ambidexterity-themed DS brain-training game that asks players to perform touch-screen exercises with both hands. HonestGamers lists Japan Art Media as developer, Majesco and 505 Games as regional publishers, and the genre tags as general and educational. GCX should describe it as a dexterity-and-reaction training cartridge where the novelty is practicing with the dominant and non-dominant hand, not merely solving abstract puzzles.",
  },
  {
    gameId: "ds-left-brain-right-brain-2",
    title: "Left Brain Right Brain 2",
    sourceUrl: "https://www.dreamstation.cc/reviews/reviews/left-brain-right-brain-2-review",
    newOverview:
      "Left Brain Right Brain 2 continues Majesco's DS ambidexterity concept with arcade-style tests that compare and train the player's left and right hands. DreamStation describes the sequel as a game about testing dexterity by pitting one hand against the other, while retail listings emphasize its righty-versus-lefty hook. GCX should position it as a quick-session brain-and-hand training follow-up, best understood beside the broader DS brain-game boom.",
  },
  {
    gameId: "ds-les-aventures-de-t-choupi-a-l-ecole",
    title: "Les aventures de T'choupi a l'ecole",
    sourceUrl: "https://www.amazon.fr/Aventures-TChoupi-%C3%A0-l%C3%A9cole/dp/B00DRZMR10",
    newOverview:
      "Les aventures de T'choupi a l'ecole is a French-language children's DS release built around T'choupi's school setting and preschool-age routines. Retail copy presents T'choupi as excited to reunite with friends, learn, play, and share school moments, matching the franchise's gentle early-childhood tone. GCX should frame it as a toddler-friendly licensed activity cartridge where language, character familiarity, and French-region collecting matter more than mechanical depth.",
  },
  {
    gameId: "ds-les-nouvelles-aventures-de-t-choupi-et-ses-amis",
    title: "Les nouvelles aventures de T'choupi et ses amis",
    sourceUrl: "https://www.amazon.fr/nouvelles-aventures-Tchoupi-ses-amis/dp/B009VWN3AW",
    newOverview:
      "Les nouvelles aventures de T'choupi et ses amis is another French preschool DS entry, this time structured around a set of simple play-and-discovery activities with T'choupi and his friends. Amazon France lists 15 game and early-learning activities, while contemporary French coverage treated it as a small-child release rather than a conventional adventure. GCX should distinguish it from the school-themed game as a broader activity collection for very young players.",
  },
  {
    gameId: "ds-let-s-mangaka-ds-style",
    title: "Let's Mangaka DS Style",
    sourceUrl: "https://www.play-asia.com/en/lets-mangaka-ds-style/13/703uk6",
    newOverview:
      "Let's Mangaka DS Style is a Japan-only DS adventure/simulation about working toward a manga-artist career. Play-Asia catalogs it as a 2010 Columbia Music Entertainment release, and secondary cataloging describes using the DS to draw pictures while moving through the manga business. GCX should describe it as a stylus-driven creative-work import, where the draw-on-screen concept and manga-industry theme are the reasons to care.",
  },
  {
    gameId: "ds-let-s-play-ballerina",
    title: "Let's Play Ballerina",
    sourceUrl: "https://www.play-asia.com/en/lets-play-ballerina/13/703nuq",
    newOverview:
      "Let's Play Ballerina is a Deep Silver DS simulation about a 12-year-old student entering a prestigious dance academy and training toward a prima-ballerina dream. Play-Asia's listing describes ballet as storytelling through music and dance, with the player's training path built around challenges. GCX should frame it as a career-and-performance lifestyle sim, not a generic dance rhythm game.",
  },
  {
    gameId: "ds-let-s-play-fashion-designer",
    title: "Let's Play Fashion Designer",
    sourceUrl: "https://www.vgchartz.com/game/31733/lets-play-fashion-designer/",
    newOverview:
      "Let's Play Fashion Designer puts the player in charge of a young designer trying to grow from a local boutique into a larger fashion business. VGChartz describes custom jewelry and accessory design, customer specifications, delivery timing, and penalties for sloppy work such as broken bracelet links. GCX should highlight it as a boutique-management and craft-task sim where meeting client requests is the main loop.",
  },
  {
    gameId: "ds-let-s-play-flight-attendant",
    title: "Let's Play Flight Attendant",
    sourceUrl: "https://nintendoeverything.com/deep-silver-land-lets-play-flight-attendant-for-nintendo-ds/",
    newOverview:
      "Let's Play Flight Attendant is a Deep Silver career sim about creating a custom character and working through the duties of a flight attendant. Nintendo Everything's publisher-sourced coverage describes educational minigames, new challenges in each level, star rewards, and career levels that unlock as the player succeeds. GCX should present it as a service-job role-play cartridge with task-based progression rather than a broad airport simulator.",
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
