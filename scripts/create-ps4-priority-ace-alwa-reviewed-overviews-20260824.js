const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "ps4-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-ace-alwa-reviewed-overviews-2026-08-24.csv"
);

const reviewedOverviews = {
  "ps4-ace-of-seafood":
    "Ace of Seafood is a strange aquatic action game from Nussoft where sea creatures behave like combat units in open underwater battles. Its appeal is the absurd setup: fish, crabs, and other marine life fight with lock-on attacks and shooter-like movement. On PS4, it is best framed as a cult Playism oddity for players who enjoy experimental Japanese indie games, not as a conventional arcade shooter.",
  "ps4-act-it-out-a-game-of-charades":
    "Act It Out! A Game of Charades is a living-room party release built around prompt-based performance, guessing, and quick group rounds. Snap Finger Click's PS4 version fits the same social space as quiz and party-night games: the controller matters less than how easily people can jump in, laugh, and rotate through short sessions. It is a useful listing for families and local multiplayer collectors.",
  "ps4-action-henk":
    "Action Henk is a momentum platformer about racing through toy-sized obstacle courses as quickly as possible. RageSquid's design leans on slopes, jumps, slides, ghost times, and leaderboard-style repetition, making it more about shaving seconds than exploring large levels. On PS4, it belongs with precision platformers and time-trial games that reward replay and clean movement.",
  "ps4-active-neurons":
    "Active Neurons is a minimalist puzzle game built around moving a block through clean grid-based stages until the correct route clicks into place. Nikolai Usachev and Sometimes You keep the presentation simple, so the value comes from compact puzzle logic, quick resets, and steady rule variations. It is a small digital PS4 puzzle entry rather than a story-led adventure.",
  "ps4-adventures-of-scarlet-curiosity":
    "Adventures of Scarlet Curiosity is a Japanese indie action RPG from Ankake Supa, focused on real-time combat, dungeon-style areas, character growth, and boss encounters. The PS4 release is notable for players who follow doujin-style action games moving from PC circles to console storefronts. Its appeal is fast character control and RPG progression rather than a large open-world structure.",
  "ps4-aeon-must-die":
    "Aeon Must Die! is a stylized beat 'em up from Limestone Games where hand-to-hand combat, enemy control, and aggressive visual presentation are the main draw. The PS4 version should be described through its brawler rhythm: reading enemy pressure, chaining attacks, and surviving compact fights. It is a more focused action release than the generic metadata copy suggests.",
  "ps4-aeterna-noctis":
    "Aeterna Noctis is a demanding hand-drawn Metroidvania from Aeternum Game Studios, built around exploration, platform precision, combat upgrades, and a large interconnected world. Its reputation comes from challenge and scale: players are expected to master traversal, return with new abilities, and push through difficult boss and platforming sequences. On PS4, it is a serious genre entry for Metroidvania fans.",
  "ps4-aeternoblade":
    "AeternoBlade is a side-scrolling action-adventure from Corecell Technology built around sword combat, time-manipulation ideas, and stage progression. The PS4 release gives the series a console storefront presence for players who like mid-budget action games with RPG-adjacent upgrades and puzzle elements. It should be positioned as a niche action-adventure, not a broad exploration game.",
  "ps4-aeternoblade-ii":
    "AeternoBlade II expands Corecell's action-adventure formula with more characters, larger combat encounters, and a continued focus on time-themed abilities. The PS4 listing matters for players tracking the full AeternoBlade series and for collectors who follow PQube's niche action catalog. Its value is in character switching, combat flow, and sequel refinement rather than mainstream spectacle.",
  "ps4-afl-evolution-2":
    "AFL Evolution 2 is Wicked Witch Software's Australian rules football simulation, focused on club competition, passing, marking, kicking, tackles, and the oval-field rhythm of the sport. For GCX readers outside Australia, the important context is that this is a licensed sport-specific PS4 release with a very different audience from FIFA, Madden, or NBA titles. It belongs in the library as a regional sports anchor.",
  "ps4-aggelos":
    "Aggelos is a retro-styled action RPG from Storybird Games with side-scrolling exploration, towns, dungeons, ability gates, and combat upgrades. It evokes classic 16-bit adventure structure more than modern loot-heavy RPG design, making it a good fit for players who want simple movement, clear progression, and old-school pacing. The PS4 release also adds PQube and Arc System Works publishing interest for collectors.",
  "ps4-aikano-yukizora-no-triangle":
    "Aikano: Yukizora no Triangle is a Japanese visual novel from Prekano and Entergram, built around winter romance, character conversations, and route-based story progression. Its PS4 relevance is mainly for collectors of console visual novels and import-focused romance releases. The experience should be framed as reading, atmosphere, and relationship routes rather than puzzle solving or action play.",
  "ps4-aipd":
    "AIPD is a neon twin-stick shoot 'em up from Blazing Badger, centered on arena survival, weapon behavior, enemy waves, and high-score repetition. The PS4 version fits neatly beside other digital arcade shooters where the loop is immediate: pick up the controller, manage space, dodge pressure, and chase a cleaner run. It is compact, stylish, and built for short action sessions.",
  "ps4-air-missions-hind":
    "Air Missions Hind is a helicopter combat flight game built around the Mi-24 Hind, mission objectives, weapons, and military air-to-ground pressure. Games Farm's PS4 release is not a civilian flight sim; its appeal is combat sorties, aircraft handling, and scenario variety. It should be listed as a niche military flight-action title for players who want helicopters rather than jets or arcade dogfighting.",
  "ps4-aircraft-evolution":
    "Aircraft Evolution is a mission-based aircraft action game from Satur Entertainment and Sometimes You, built around side-scrolling combat, bombing runs, upgrades, and era-spanning planes. It plays closer to an arcade shooter than a full flight simulator. For PS4 collectors, it fills a small digital niche for aviation-themed action games with simple progression and replayable missions.",
  "ps4-airship-q":
    "Airship Q is a Japanese action RPG and sandbox adventure from Miracle Positive, built around exploration, crafting, resource gathering, and airship-building ideas. Its PS4 listing stands out because it is more systems-driven and unusual than a standard combat RPG. GCX should frame it as a niche import-friendly curiosity for players interested in survival-crafting structure on console.",
  "ps4-akita-oga-mystery-guide-the-frozen-silverbell-flower":
    "Akita Oga Mystery Guide: The Frozen Silverbell Flower is a Japanese adventure game from Happymeal and Flyhigh Works, built around investigation, regional atmosphere, and mystery-story progression. It belongs with text-led detective and travel-mystery games rather than action adventures. For GCX, the important angle is its specific local setting and mystery-guide identity within the PS4 import catalog.",
  "ps4-all-star-fruit-racing":
    "All-Star Fruit Racing is a colorful kart racer from 3DClouds and Blowfish Studios, focused on bright tracks, power-up play, drift-friendly handling, and family-friendly competition. Its fruit theme gives it a clear identity in the PS4 racing catalog, where it sits closer to party kart racing than simulation. It is most relevant for local multiplayer, younger players, and kart-racing collectors.",
  "ps4-alone-with-you":
    "Alone with You is a sci-fi adventure from Benjamin Rivers about surviving the aftermath of a failed colony while interacting with holographic companions and uncovering what happened. The PS4 release is story-forward, reflective, and relationship-driven, with exploration and dialogue carrying more weight than combat. It is a strong fit for readers looking for narrative indie games on PlayStation.",
  "ps4-alwa-s-awakening":
    "Alwa's Awakening is Elden Pixels' retro Metroidvania platformer, built around magic abilities, connected rooms, secrets, and deliberately old-school difficulty. The PS4 version gives console players access to a game that feels closer to an 8-bit adventure than a modern cinematic platformer. Its library value comes from exploration, ability-gated progress, and a clean vintage presentation.",
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
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
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
    } else {
      cell += char;
    }
  }

  if (cell || row.length) row.push(cell.replace(/\r$/, ""));
  if (row.length) rows.push(row);
  return rows.filter((csvRow) => csvRow.some((value) => String(value).trim()));
}

function toCsvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const rows = parseCsv(fs.readFileSync(inputPath, "utf8"));
const headers = rows.shift();
const objects = rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
const selected = objects.filter((row) => Object.hasOwn(reviewedOverviews, row.gameId));

if (selected.length !== Object.keys(reviewedOverviews).length) {
  const found = new Set(selected.map((row) => row.gameId));
  const missing = Object.keys(reviewedOverviews).filter((id) => !found.has(id));
  throw new Error(`Missing ${missing.length} expected PS4 rows: ${missing.join(", ")}`);
}

const outputRows = [
  headers.join(","),
  ...selected.map((row) =>
    headers
      .map((header) => {
        if (header === "rewriteNotes") return toCsvCell("Replace metadata-template copy with game-specific PS4 editorial overview.");
        if (header === "newOverview") return toCsvCell(reviewedOverviews[row.gameId]);
        if (header === "reviewStatus") return toCsvCell("reviewed");
        if (header === "reviewer") return toCsvCell("gcx-editorial");
        return toCsvCell(row[header]);
      })
      .join(",")
  ),
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${outputRows.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ ok: true, rows: selected.length, outputPath: path.relative(rootDir, outputPath) }, null, 2));
