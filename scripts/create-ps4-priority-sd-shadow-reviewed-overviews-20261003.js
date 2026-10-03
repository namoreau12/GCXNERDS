const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-sd-shadow-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "ps4-sd-gundam-battle-alliance",
    sourceUrl: "https://www.bandainamcoent.com/games/sd-gundam-battle-alliance",
    overview:
      "SD Gundam Battle Alliance is Bandai Namco's action RPG that pulls super-deformed Mobile Suits and pilots from across Gundam history into mission-based battles. The PS4 version supports solo play and co-op, with players building teams, upgrading units, and correcting distorted versions of famous Gundam story moments. It should be listed as an action-focused crossover RPG, not as a traditional tactics release.",
  },
  {
    id: "ps4-sd-gundam-g-generation-genesis",
    sourceUrl: "https://www.gundam.info/product/game/product_game_20161122_3136p.html",
    overview:
      "SD Gundam G Generation Genesis is a Universal Century-focused entry in Bandai Namco's long-running Gundam strategy RPG series. Players collect units and pilots, deploy them on grid-based stages, and replay major scenarios from the franchise in super-deformed form. For collectors, the important context is that the PS4 release is an import-era Gundam tactics title where region, language support, and edition matter more than twitch action.",
  },
  {
    id: "ps4-semispheres",
    sourceUrl: "https://blog.playstation.com/?p=188158",
    overview:
      "Semispheres is Vivid Helix's split-screen puzzle game about guiding two connected realities at the same time. Its PlayStation Blog introduction frames it as a puzzle game with stealth influences, where each side of the screen has tools such as portals, sound distractions, and movement tricks that affect the other half. The result is a quiet, brainy PS4 indie built around coordination rather than reflex spectacle.",
  },
  {
    id: "ps4-senri-no-kifu-gendai-shougi-mystery",
    sourceUrl: "https://www.gematsu.com/2019/09/kemco-announces-mystery-adventure-game-senri-no-kifu-gendai-shougi-mystery-for-ps4-switch",
    overview:
      "Senri no Kifu: Gendai Shougi Mystery is Kemco's Japanese mystery adventure about incidents surrounding human-versus-computer shogi matches. Reports from its announcement highlight a shogi classroom mode and appearances or supervision from professional shogi figures, so its identity sits between visual mystery and board-game culture. Listings should call out its Japan-first PS4 release and language dependence.",
  },
  {
    id: "ps4-sephirothic-stories",
    sourceUrl: "https://www.kemco.jp/sp/games/sephirothic/en/",
    overview:
      "Sephirothic Stories is a Kemco and Exe Create fantasy RPG set in Shendoah, a world protected by a waning world tree called Sephiroth. The PS4 release uses turn-based battles, party progression, dungeon puzzles, character abilities, weapon upgrades, and side quests in the familiar Kemco mobile-to-console RPG mold. It is best framed as a compact digital JRPG for players who like straightforward progression and light puzzle routing.",
  },
  {
    id: "ps4-sephonie",
    sourceUrl: "https://store.playstation.com/en-us/product/UP0891-PPSA15470_00-SEPHONIERATAGAME",
    overview:
      "Sephonie is Analgesic Productions' 3D puzzle-platformer about three biologists exploring the caverns of Sephonie Island after a storm leaves them stranded. The PS4 version emphasizes parkour movement, wall-running, creature-linking puzzle grids, surreal cave spaces, and a story about memory, nature, and relationships. It belongs beside experimental narrative platformers rather than simple arcade puzzle games.",
  },
  {
    id: "ps4-seraph",
    sourceUrl: "https://blog.es.playstation.com/2016/03/31/convirtete-en-todo-un-pistolero-con-el-plataformas-de-accin-seraph/",
    overview:
      "Seraph is Dreadbit's acrobatic action-platform shooter built around automatic aiming, letting players focus on dodging, wall jumps, aerial movement, and timing special powers while fighting demonic enemies. PlayStation's developer feature stressed that the character handles weapon targeting, which gives the PS4 release a distinct feel from standard run-and-gun games. It is a movement-first shooter with style and score pressure.",
  },
  {
    id: "ps4-shadow-corridor",
    sourceUrl: "https://www.arcsystemworks.asia/bbs/board.php?bo_table=notice&wr_id=434",
    overview:
      "Shadow Corridor is a Japanese first-person action-horror game from Regista and Kazuki Shiroma, released on PS4 in Asian markets by Arc System Works Asia. Players navigate dark, traditional-looking corridors while avoiding spirits tied to cursed Noh masks, with item use and route reading driving survival. For PS4 collectors, region, language support, and digital availability are key because the platform history differs by territory.",
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
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    return {
      platformSlug: "ps4",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority PS4 weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus platform holder, publisher, developer, and specialist announcement references.",
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
