const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "switch-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "switch-priority-afl-amazing-reviewed-overviews-2026-08-29.csv"
);

const rewrites = {
  "switch-afl-evolution-2":
    "AFL Evolution 2 brings Australian rules football to Switch with licensed teams, match play, career-style progression, and the pace of oval-field contests. The draw is having a dedicated AFL game on the platform, where marking, kicking, tackles, and season context matter more than arcade novelty.",
  "switch-afterpulse":
    "Afterpulse is a third-person military shooter built around short online-style firefights, weapon loadouts, and character customization. On Switch, it fits the portable multiplayer-action shelf, with its value coming from quick combat sessions and progression rather than a long single-player campaign.",
  "switch-ages-of-mages-the-last-keeper":
    "Ages of Mages: The Last Keeper is a cooperative fantasy action game about small mage characters blasting through monsters, bosses, and colorful stages. It plays like a light couch co-op brawler, with elemental attacks and party-friendly chaos doing most of the work.",
  "switch-ai-kiss":
    "Ai Kiss is a Japanese romance visual novel from Giga and Entergram, centered on school-life character routes, dialogue, and relationship scenes. It is a text-driven import release, so the main experience is following the cast and choices rather than mechanical challenge.",
  "switch-ai-kiss-2":
    "Ai Kiss 2 continues Giga's romance visual-novel line on Switch with a new round of character scenarios, route progression, and school-life comedy. It should be tracked separately from the first game because the numbered sequel identifies a different story package.",
  "switch-ai-kiss-3-cute":
    "Ai Kiss 3: Cute is another entry in the Ai Kiss visual-novel series, built around romantic routes, character-focused scenes, and polished romance-game presentation. The Cute subtitle helps distinguish it from the earlier Switch releases in the same line.",
  "switch-aikano-yukizora-no-triangle":
    "Aikano: Yukizora no Triangle is a Japanese romance visual novel with winter-themed presentation, character routes, and a story-first structure. Its appeal is in reading the scenario and following relationship choices, making language dependence and exact edition important.",
  "switch-aiyoku-no-eustia":
    "Aiyoku no Eustia is a dark fantasy visual novel from August, set in a decaying city and focused on political intrigue, tragedy, and character-driven drama. The Switch release gives the story a console format, but the heart of the experience is still long-form reading and branching emotional stakes.",
  "switch-akai-ito-hd-remaster":
    "Akai Ito HD Remaster brings Success Corporation's supernatural visual novel to Switch with updated presentation and a story rooted in folklore, fate, and character relationships. It is notable for its atmosphere and route structure, not for action systems.",
  "switch-akatsuki-yureru-koi-akari":
    "Akatsuki Yureru Koi Akari is a Switch romance visual novel from CRYSTALiA and Entergram, built around character routes, school-life scenes, and dramatic relationship turns. It belongs with the platform's large Japanese visual-novel catalog, where subtitle accuracy is important.",
  "switch-akihabara-crash-123-stage-1":
    "Akihabara Crash! 123 Stage +1 is a block-breaking puzzle game with a compact arcade structure and many short stages. It is best described by its paddle-and-brick foundation, quick retries, and Akihabara-themed presentation rather than broader adventure or strategy labels.",
  "switch-akita-oga-mystery-guide-the-frozen-silverbell-flower":
    "Akita Oga Mystery Guide: The Frozen Silverbell Flower is a retro-styled detective adventure set around Akita and Oga, using conversation, location investigation, and mystery progression. It appeals to players who like Famicom-era command adventures and regional Japanese settings.",
  "switch-aleste-collection":
    "Aleste Collection is M2's preservation-focused compilation of classic Aleste shoot-'em-up releases, including games from Sega and handheld-era history. The Switch package is about curated arcade-style shooting, display options, and access to multiple entries in one collector-minded release.",
  "switch-alice-in-the-country-of-hearts-wonderful-white-world":
    "Alice in the Country of Hearts: Wonderful White World reimagines Alice in Wonderland as an otome visual novel with faction politics, dangerous romance routes, and QuinRose's darker fairy-tale tone. The White World subtitle marks a specific Switch-era release in the series.",
  "switch-alt-frequencies":
    "Alt-Frequencies is a narrative puzzle game about recording and rebroadcasting radio clips to expose a time-loop conspiracy. Players move between stations, collect information, and use audio fragments to change events, making listening and deduction the core mechanics.",
  "switch-amaekata-wa-kanojo-nari-ni":
    "Amaekata wa Kanojo Nari ni is a Japanese romance visual novel focused on character interactions, everyday school-life scenes, and route-based storytelling. Its Switch listing should emphasize that it is a text-first import title rather than a gameplay-heavy dating sim.",
  "switch-amairo-chocolate":
    "Amairo Chocolate is a romance visual novel set around a cafe staffed by animal-eared heroines, mixing light fantasy with character routes and warm slice-of-life comedy. On Switch, it is aimed at players looking for relaxed reading and character-focused romance.",
  "switch-amakano":
    "Amakano is a winter-themed romance visual novel from Azarashi Soft, built around quiet seasonal atmosphere, relationship routes, and character intimacy. Its appeal is the gentle dating-story structure, with most of the experience coming from reading scenes and following heroine paths.",
  "switch-amakano-second-season":
    "Amakano: Second Season continues the snowy romance visual-novel format with a separate cast and new relationship routes. It should be cataloged as a follow-up entry rather than an expansion of the first Switch Amakano, since the subtitle identifies a distinct scenario package.",
  "switch-amazing-breaker":
    "Amazing Breaker is an ice-shattering puzzle game where players fire bombs into ornate frozen sculptures to destroy enough of each shape. The hook is physics-flavored precision: choosing bomb types, angles, and timing to crack elaborate targets efficiently.",
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
        if (header === "rewriteNotes") return csvCell("Rewritten to remove template phrasing and describe the game-specific hook, play style, and catalog context.");
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
console.log(`Wrote ${selected.length} reviewed Switch overview rows to ${path.relative(rootDir, outputPath)}`);
