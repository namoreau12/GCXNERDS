const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-labyrinth-learnscience-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ds-labyrinth",
    title: "Labyrinth",
    sourceUrl: "https://ds.gamespy.com/nintendo-ds/labyrinth/",
    newOverview:
      "Labyrinth is the Nintendo DS successor to Taito's Cameltry concept, built around rotating maze layouts with the stylus so a ball can reach the goal before time runs out. GameSpy describes touch-pen maze rotation and wireless play for up to four players, while later coverage notes its direct connection to the older arcade design. GCX should present it as a motion/maze puzzle release where the hook is controlling the stage itself rather than controlling the ball.",
  },
  {
    gameId: "ds-lalaloopsy",
    title: "Lalaloopsy",
    sourceUrl: "https://www.amazon.com/Lalaloopsy-Nintendo-DS/dp/B005DJS9OM",
    newOverview:
      "Lalaloopsy is a young-player DS adventure built around the Lalaloopsy doll line's friendship-and-crafts fantasy. Retail descriptions list 12 playable rag-doll characters, simple touch controls, and activities built around crafting, gift-giving, and exploring Lalaloopsy Land. GCX should frame it as a licensed kids' character game where the collector appeal is strongest for sealed Activision DS collectors, Lalaloopsy fans, and family-game libraries.",
  },
  {
    gameId: "ds-lalaloopsy-carnival-of-friends",
    title: "Lalaloopsy: Carnival of Friends",
    sourceUrl: "https://www.gamestop.com/video-games/nds/products/lalaloopsy-carnival-of-friends---nintendo-ds/10103938-10103939.html",
    newOverview:
      "Lalaloopsy: Carnival of Friends moves the license into a Silly Funhouse carnival setup with a larger character focus. GameStop's listing highlights 40 Lalaloopsy friends, the Lalaloopsy Littles, 16 themed levels, and an unlockable special character tied to Harmony B. Sharp. GCX should distinguish it from the first DS game as the carnival-themed follow-up, aimed at mascot exploration and light activities rather than challenge-heavy platforming.",
  },
  {
    gameId: "ds-lanfeust-of-troy",
    title: "Lanfeust of Troy",
    sourceUrl: "https://en.wikipedia.org/wiki/Lanfeust_of_Troy",
    newOverview:
      "Lanfeust of Troy is a DS adventure based on the French fantasy comic series, following a licensed-property path that makes more sense to European comic readers than to players expecting a standalone Nintendo mascot game. Public cataloging links the DS release to Atari SA and Tate Interactive, and the property gives the game its fantasy-world identity. GCX should describe it as a regional comic-license adventure where language, European release context, and franchise recognition drive collector interest.",
  },
  {
    gameId: "ds-lapin-malin-j-apprends-a-lire-et-a-ecrire",
    title: "Lapin Malin: J'apprends A Lire Et A Ecrire",
    sourceUrl: "https://www.gamekult.com/jeux/lapin-malin-j-apprends-a-lire-et-a-ecrire-90346.html",
    newOverview:
      "Lapin Malin: J'apprends a Lire Et A Ecrire is a French DS educational release from the Reader Rabbit/Lapin Malin line, focused on early reading and writing practice. Gamekult classifies the DS entry as a reflection/learning title published by Mindscape, while the broader Lapin Malin series is known for child-focused literacy software. GCX should treat it as a French-language learning cartridge first and a conventional game second, with value tied to the licensed education brand.",
  },
  {
    gameId: "ds-last-bullet",
    title: "Last Bullet",
    sourceUrl: "https://en.wikipedia.org/wiki/Last_Bullet",
    newOverview:
      "Last Bullet is a FuRyu adventure game about Karin Hibiki, a young female sniper drawn into a conspiracy around her past. The game alternates dialogue-and-puzzle adventure sections with sniper missions that use limited ammunition, target conditions, time limits, breathing effects, weather, and a temporary concentration mode. GCX should correct the generic shooter framing and present it as a visual-novel/sniping hybrid with a manga tone and Japan-only collector appeal.",
  },
  {
    gameId: "ds-last-king-of-africa",
    title: "Last King of Africa",
    sourceUrl: "https://www.wired.com/2008/06/last-king-of-af/",
    newOverview:
      "Last King of Africa is the Nintendo DS remake of Benoit Sokal and White Birds Productions' PC adventure Paradise, adapted for handheld point-and-click play. Contemporary coverage described the DS version as using stylus and microphone interface changes while keeping the puzzle-adventure core, and the story follows an amnesiac young woman after a plane crash in a fictional African kingdom. GCX should position it as a serious European adventure release, not a generic exploration game.",
  },
  {
    gameId: "ds-learn-chess",
    title: "Learn Chess",
    sourceUrl: "https://www.macys.com/shop/product/dreamcatcher-interactive-learn-chess-nintendo-ds?ID=23834843",
    newOverview:
      "Learn Chess is DreamCatcher's straightforward DS training title for learning chess rules, tactics, and strategy through exercises. Retail copy emphasizes structured move lessons, quick-result training, competition play, multiplayer support, and access to modes from the start for players who already know the basics. GCX should describe it as a practical instructional cartridge rather than a puzzle game, with appeal for educational DS collectors and chess-software completists.",
  },
  {
    gameId: "ds-learn-geography",
    title: "Learn Geography",
    sourceUrl: "https://www.gamedeveloper.com/game-platforms/dreamcatcher-announces-i-learn-geography-i-for-nintendo-ds",
    newOverview:
      "Learn Geography is a DreamCatcher educational DS title aimed at elementary students, built around world-map recognition and continent/country identification. Game Developer's announcement describes map-piece exercises, jigsaw and sliding puzzles, timed quiz exercises, a training mode that identifies country names and locations, and geography minigames. GCX should frame it as a touch-screen study tool in DreamCatcher's Learn line, not as generic trivia filler.",
  },
  {
    gameId: "ds-learn-science",
    title: "Learn Science",
    sourceUrl: "https://gamingbolt.com/learn-science-released-for-the-nintendo-ds",
    newOverview:
      "Learn Science extends DreamCatcher's DS Learn series into basic science topics through minigames, explanations, and quizzes. GamingBolt's release coverage lists light and sound, physics, the human body, biology, and geography, with an age-check difficulty system, in-game guides, and hot-seat, single-card, and multi-card multiplayer modes. GCX should present it as an education-first cartridge where its usefulness depends on the lesson structure and family learning context.",
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
