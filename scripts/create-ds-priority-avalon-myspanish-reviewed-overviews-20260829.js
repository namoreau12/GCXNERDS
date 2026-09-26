const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "ds-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-avalon-myspanish-reviewed-overviews-2026-08-29.csv"
);

const rewrites = {
  "ds-avalon-code":
    "Avalon Code is a portable action RPG built around the Book of Prophecy, a magical catalog that lets players scan people, monsters, items, and locations, then alter their attributes. Its hook is the way exploration, relationship events, dungeon crawling, and item crafting all feed back into that book-management system.",
  "ds-bleach-the-3rd-phantom":
    "Bleach: The 3rd Phantom turns the anime's Soul Reaper battles into a strategy RPG with grid movement, character recruitment, and story routes built around original twins. Instead of pure one-on-one fighting, it asks players to position familiar Bleach characters, trigger team attacks, and manage a roster through tactical encounters.",
  "ds-death-note-kira-s-game":
    "Death Note Kira's Game adapts the manga's hidden-identity mind games into a deduction and social-strategy format for Nintendo DS. Players work through suspicion, accusations, and role-driven objectives, making it more about reading behavior and managing limited information than about action or exploration.",
  "ds-doki-doki-majo-shinpan-2-duo":
    "Doki Doki Majo Shinpan 2 Duo is a Japanese adventure and investigation sequel centered on dialogue, character scenes, and touch-screen clue checking. It is a highly niche import release, best described by its visual-novel structure, supernatural witch-hunt premise, and SNK Playmore collector curiosity.",
  "ds-doki-doki-majo-shinpan":
    "Doki Doki Majo Shinpan! is a Japan-only DS adventure that mixes visual-novel conversations, light investigation, and touch-screen examination mechanics around a supernatural school mystery. Its notoriety and import status make clear cataloging important, especially for buyers distinguishing the first game from later entries.",
  "ds-doki-majo-plus":
    "Doki Majo Plus revisits SNK Playmore's unusual DS adventure formula with revised presentation, extra character material, and the same mix of dialogue scenes and touch-screen investigation. It sits closer to a collector-focused expanded edition than a conventional sequel, so exact title and region matter.",
  "ds-doodle-hex":
    "Doodle Hex is a spell-dueling game where players draw rune shapes on the touch screen to cast attacks, counters, and status effects. The appeal is the DS-specific gesture combat: matches are about recognizing spells quickly, drawing accurately, and reacting before an opponent's magic lands.",
  "ds-jam-sessions":
    "Jam Sessions turns the DS into a simplified guitar tool, using the touch screen for strumming while buttons and chord selections shape the sound. It is less a traditional score-chasing rhythm game and more a portable music sandbox for practicing chord progressions and casual performance.",
  "ds-jam-sessions-2":
    "Jam Sessions 2 expands Ubisoft and Plato's handheld guitar concept with more structured songs, chord tools, and performance options. It keeps the first game's touch-screen strumming idea but gives players a clearer framework for learning, playing along, and experimenting with arrangements.",
  "ds-junior-brain-trainer-math-edition":
    "Junior Brain Trainer: Math Edition is an educational DS release built around short arithmetic drills, number puzzles, and classroom-style practice for younger players. Its value comes from being a focused learning title, with the exact math subtitle separating it from other Junior Brain Trainer entries.",
  "ds-l-the-prologue-to-death-note-rasen-no-wana":
    "L the Prologue to Death Note: Rasen no Wana is a Japanese Death Note adventure focused on L, investigation scenes, and puzzle-solving rather than the broader cast's usual cat-and-mouse conflict. It is a story-led import release where language dependence and franchise context are central to understanding the game.",
  "ds-lucky-star-moe-drill":
    "Lucky Star Moe Drill adapts the Lucky Star comedy property into a quiz, training, and character-interaction package built for quick DS sessions. Its appeal is mostly for fans of the series and Japanese import collectors, with classroom drills and anime presentation carrying the experience.",
  "ds-meteos":
    "Meteos is a fast, inventive puzzle game from Q Entertainment where players launch falling blocks upward by matching symbols and building chain reactions. The touch controls, planet-specific rules, and frantic screen-clearing rhythm make it one of the DS library's standout original puzzle designs.",
  "ds-meteos-disney-magic":
    "Meteos: Disney Magic reshapes the original Meteos puzzle system around Disney characters, storybook presentation, and a rotated DS book-style layout. It keeps the launching-block chain reactions but aims them at a younger licensed audience with friendlier theming and character-driven progression.",
  "ds-minute-to-win-it":
    "Minute to Win It adapts the TV game show into a collection of short skill challenges built around quick timing, simple objectives, and repeated attempts. On DS, the format works as a minigame package where the appeal is recreating one-minute stunts in a lightweight handheld form.",
  "ds-monster-jam":
    "Monster Jam brings licensed monster-truck events to DS with stadium races, stunt challenges, and oversized vehicle handling. The draw is the Monster Jam branding and trucks rather than deep simulation, making it a straightforward arcade-style release for fans of the motorsport show.",
  "ds-monster-jam-path-of-destruction":
    "Monster Jam: Path of Destruction follows the licensed monster-truck formula with event progression, crashes, tricks, and arena competition built around recognizable trucks. It is useful to separate from the earlier DS entries because the subtitle marks a distinct release in Activision's Monster Jam run.",
  "ds-monster-jam-urban-assault":
    "Monster Jam: Urban Assault moves the DS monster-truck action into city-themed courses and destructive arcade events. It emphasizes smashing through environments, racing rivals, and pulling off stunts, giving this entry a different flavor from the more stadium-focused Monster Jam games.",
  "ds-my-french-coach":
    "My French Coach is a language-learning DS program from Ubisoft built around vocabulary lessons, pronunciation practice, writing exercises, and short quizzes. It belongs to the handheld's self-improvement wave, where touch input and daily sessions turned the DS into a pocket study tool.",
  "ds-my-french-coach-level-2-intermediate":
    "My French Coach Level 2: Intermediate continues Ubisoft's French-learning series with more advanced vocabulary, grammar practice, and structured exercises for players beyond the beginner stage. The Level 2 subtitle is the key detail, since it signals a different difficulty tier from the original release.",
  "ds-my-spanish-coach":
    "My Spanish Coach applies Ubisoft's DS language-training format to Spanish, using lessons, vocabulary drills, pronunciation activities, and review quizzes in short portable sessions. It is best understood as educational software rather than a conventional game, with usefulness tied to study pacing and language level.",
  "ds-my-spanish-coach-level-2-intermediate":
    "My Spanish Coach Level 2: Intermediate builds on the first Spanish Coach with harder lessons, expanded vocabulary, and continued grammar practice. For cataloging, the subtitle matters because it identifies the intermediate follow-up rather than a duplicate printing of the beginner-focused original.",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const clean = String(text || "").replace(/^\uFEFF/, "");

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    const next = clean[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((csvRow) => csvRow.some((value) => String(value).trim()));
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const rows = parseCsv(fs.readFileSync(inputPath, "utf8"));
const headers = rows.shift();
const objects = rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
const selected = objects.filter((row) => rewrites[row.gameId]);

if (selected.length !== Object.keys(rewrites).length) {
  const found = new Set(selected.map((row) => row.gameId));
  const missing = Object.keys(rewrites).filter((id) => !found.has(id));
  throw new Error(`Missing expected batch rows: ${missing.join(", ")}`);
}

const outputRows = [
  headers.join(","),
  ...selected.map((row) =>
    headers
      .map((header) => {
        if (header === "rewriteNotes") return csvCell("Rewritten to remove template phrasing and describe the game-specific hook, play style, and collector context.");
        if (header === "newOverview") return csvCell(rewrites[row.gameId]);
        if (header === "reviewStatus") return "approved";
        if (header === "reviewer") return "GCX";
        return csvCell(row[header]);
      })
      .join(",")
  ),
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${outputRows.join("\n")}\n`);
console.log(`Wrote ${selected.length} reviewed DS overview rows to ${path.relative(rootDir, outputPath)}`);
