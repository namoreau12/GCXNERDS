const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "psp.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "psp-priority-puyofever2-rurur-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "psp-puyo-puyo-fever-2",
    sourceUrl: "https://puyo.sega.jp/portal/series/PuyopuyoFever2.html",
    overview:
      "Puyo Puyo Fever 2 is Sega and Sonic Team's PSP entry in the Fever-era puzzle series, released in Japan alongside the PlayStation 2 version in 2005. It expands the Fever rule set with more single-player structure, returning chain-building play, and Japanese-only story presentation. For PSP collectors, the practical notes are the Japanese title Puyo Puyo Fever 2 Chu!, import language dependence, UMD condition, and whether the buyer wants this sequel rather than the earlier Puyo Puyo Fever.",
  },
  {
    id: "psp-puzzle-bobble-pocket",
    sourceUrl: "https://www.taito.co.jp/en/mob/topics/15072",
    overview:
      "Puzzle Bobble Pocket is Taito's PSP version of the bubble-shooting Puzzle Bobble formula, known as Bust-A-Move in some regions. The core appeal is still aiming colored bubbles, creating matches, and clearing compact puzzle layouts in short handheld sessions. Listings should identify the PSP release, region and language, physical completeness, and the Taito Puzzle Bobble lineage so buyers do not confuse it with unrelated puzzle compilations.",
  },
  {
    id: "psp-puzzle-chronicles",
    sourceUrl: "https://www.esrb.org/ratings/27682/puzzle-chronicles/",
    overview:
      "Puzzle Chronicles is Konami and Infinite Interactive's match-puzzle RPG for PSP and other platforms. ESRB materials frame it around a hero raising an army after his tribe is enslaved, which points to the game's hybrid identity: gem-matching battles, character progression, equipment, and fantasy campaign structure rather than a pure puzzle pack. The useful collector context is PSP format, region, and its connection to the Puzzle Quest style of puzzle-RPG play.",
  },
  {
    id: "psp-puzzler-collection",
    sourceUrl: "https://www.mobygames.com/game/46995/puzzler-collection/releases/",
    overview:
      "Puzzler Collection is a PSP, DS, and Wii puzzle compilation tied to Ubisoft and Destination Software releases. Its value is in familiar newspaper-style play such as crosswords, sudoku, word search, and fitword rather than character-driven progression or arcade reflexes. Marketplace listings should make the compilation format clear and note PSP region, physical completeness, and whether the buyer wants traditional logic and word puzzles on UMD.",
  },
  {
    id: "psp-pw-project-witch",
    sourceUrl: "https://prtimes.jp/main/html/rd/p/000000006.000001075.html",
    overview:
      "PW: Project Witch is GungHo Works and HuneX's Japan-only PSP 3D adventure game about spending time with three witch girls through the protagonist's camera-like viewpoint. Launch materials emphasized popular illustrators, character interaction, and dress-up elements, so this is better understood as a character-focused import adventure than an action shooter. Listings should call out Japanese language dependence, UMD condition, and any limited-edition extras.",
  },
  {
    id: "psp-queen-s-blade-spiral-chaos",
    sourceUrl: "https://web.archive.org/web/20090407001938/http://www.psp-queensblade.com/",
    overview:
      "Queen's Blade: Spiral Chaos is Bandai Namco's Japan-only PSP strategy RPG adaptation of the Queen's Blade media line. The game uses tactical battles and character-driven fan-service presentation instead of the generic import-copy framing that can make it sound like an ordinary action release. Collectors should note Japanese-region packaging, language dependence, bonus items, and the distinction between this game and the later Queen's Gate: Spiral Chaos.",
  },
  {
    id: "psp-r-15-portable",
    sourceUrl: "https://www.kadokawa.co.jp/product/game1633/",
    overview:
      "R-15 Portable is Kadokawa's PSP adventure game adaptation of the R-15 light-novel and anime property, released in Japan in 2011. Kadokawa lists it as an ADV title with standard and limited package versions, so its catalog identity is a character-story import rather than a tactical or systems-heavy game. For listings, the important details are Japanese text dependence, CERO D rating, edition, bonus contents, and package/manual condition.",
  },
  {
    id: "psp-r-u-r-u-r-petit-prince",
    sourceUrl: "https://www.mobygames.com/game/75840/rurur-petit-prince/",
    overview:
      "R.U.R.U.R.: Petit Prince is Views' PSP release of light's science-fiction visual novel, adapted as a non-adult portable version of the original PC title. The story is notable for robot and literary motifs, including references connected to The Little Prince and R.U.R., so its appeal is firmly in import visual-novel collecting. Listings should identify the PSP version, Japanese language dependence, release completeness, and the difference from the original PC edition.",
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
    if (!game) throw new Error(`Missing PSP game ${rewrite.id}`);
    return {
      platformSlug: "psp",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority PSP weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official publisher, rating-board, database, and specialist references.",
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
