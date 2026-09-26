const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "ps4-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-castle-asemblance-reviewed-overviews-2026-08-24.csv"
);

const reviewedOverviews = {
  "ps4-arcade-archives-castle-of-dragon":
    "Arcade Archives: Castle of Dragon brings Athena's side-scrolling fantasy brawler to PS4 through Hamster's preservation line. Players should expect old-school arcade combat, strict enemy patterns, boss pressure, and score-focused repeat play rather than a modern remake. GCX should frame it as a historical arcade rerelease for fans tracking Athena and Hamster's digital catalog.",
  "ps4-arcade-archives-champion-wrestler":
    "Arcade Archives: Champion Wrestler preserves Taito's arcade wrestling release on PS4, keeping the focus on grapples, ring positioning, short matches, and arcade-era spectacle. Its appeal is less about simulation depth and more about seeing how Taito translated wrestling into coin-op action. For GCX readers, it belongs in the PS4 library as a sports-action preservation entry.",
  "ps4-arcade-archives-cop-01":
    "Arcade Archives: Cop 01 makes Nichibutsu's run-and-gun arcade action accessible on PS4 as part of Hamster's long-running rerelease series. The game is built around quick movement, enemy pressure, hazards, and stage memorization, so its value comes from direct arcade challenge. It is most relevant to collectors following lesser-known Nichibutsu titles and Arcade Archives completions.",
  "ps4-arcade-archives-crime-city":
    "Arcade Archives: Crime City brings Taito's crime-themed arcade action game to PS4 with the preservation features typical of Hamster's line. The draw is straightforward side-scrolling shooting and brawling energy, with stage hazards and enemy waves tuned for short, repeatable play. GCX should present it as an arcade snapshot from Taito's catalog rather than a contemporary action campaign.",
  "ps4-arcade-archives-cue-brick":
    "Arcade Archives: Cue Brick preserves Konami's arcade puzzle game on PS4, centered on board reading, timing, and clearing patterns under simple but demanding rules. It is a compact score-chasing release, not a story-led puzzle adventure. The listing matters for readers interested in Konami's smaller arcade experiments and the puzzle side of Hamster's preservation catalog.",
  "ps4-arcade-archives-cybattler":
    "Arcade Archives: Cybattler brings Jaleco's arcade shooter to PS4, with mechanical-combat presentation, enemy waves, and survival pressure at the center. Like other Arcade Archives entries, the PS4 version is about access to the original-style challenge, display options, and score pursuit. It should appeal most to shooter fans and collectors filling out Jaleco's arcade history.",
  "ps4-arcade-classics-anniversary-collection":
    "Arcade Classics Anniversary Collection is Konami's PS4 package of vintage arcade shooters and action games, aimed at making several older coin-op releases easier to revisit on modern hardware. Its value comes from the bundle context, preservation extras, and convenience rather than one new campaign. GCX should treat it as a curated Konami history release for retro-minded players.",
  "ps4-arcade-paradise":
    "Arcade Paradise turns a laundromat into a growing arcade business, mixing first-person chores, light management, and playable arcade cabinets. Nosebleed Interactive's hook is the contrast between mundane routine and the steady expansion of a retro arcade hangout. On PS4, it is a strong fit for players who like management loops with hands-on minigame variety.",
  "ps4-arcade-spirits":
    "Arcade Spirits is a visual novel set in an alternate arcade-culture future, where character relationships, workplace choices, and tone shape the player's path. It is not about reflex play despite the arcade setting; the appeal is dialogue, route decisions, and personality. GCX should position the PS4 release for visual-novel readers and fans of gaming-culture stories.",
  "ps4-archaica-the-path-of-light":
    "Archaica: The Path of Light is a puzzle game built around redirecting beams of light through ancient-looking machinery and layered environmental logic. TwoMammoths keeps the focus on observation, experimentation, and gradually more complex rule combinations. For PS4 players, it fills a calm brain-teaser niche with a presentation closer to an atmospheric puzzle box than an action adventure.",
  "ps4-archetype-arcadia":
    "Archetype Arcadia is a dark visual novel from Water Phoenix and Kemco about characters drawn into a dangerous virtual game tied to a wider collapse. The PS4 version is a story-first release built around mystery, character tension, and text-driven progression. Its library value is strongest for readers following modern console visual novels and Kemco's non-RPG publishing slate.",
  "ps4-arietta-of-spirits":
    "Arietta of Spirits is a compact action-adventure about a young girl encountering spirits during a family visit to an island. Third Spirit's design leans on top-down exploration, simple combat, emotional story beats, and approachable pacing. GCX should describe it as a smaller indie adventure for players who want a concise, heartfelt journey rather than a sprawling RPG.",
  "ps4-asatsugutori":
    "Asatsugutori is a Nippon Ichi adventure game about a group of girls trapped in a time-looping scenario where investigation and repeated days drive the mystery forward. The PS4 appeal is in reading clues, testing suspicions, and following character interactions rather than action systems. It belongs in the library as a niche Japanese narrative release with murder-mystery structure.",
  "ps4-asdivine-dios":
    "Asdivine Dios is a Kemco and Exe Create fantasy RPG built for players who enjoy traditional party progression, quests, turn-based-style battles, and a compact console JRPG rhythm. It is part of Kemco's broad Asdivine line, so expectations should be set around comfort-food genre structure rather than blockbuster production. GCX should flag it for budget JRPG collectors.",
  "ps4-asdivine-hearts":
    "Asdivine Hearts brings Kemco's long-running mobile-and-console RPG style to PS4, with party members, fantasy travel, character growth, and approachable questing. The hook is familiar JRPG comfort: steady battles, equipment, story stops, and a manageable campaign scale. Its collector value comes from being one piece of Kemco's extensive PS4 RPG catalog.",
  "ps4-asdivine-hearts-ii":
    "Asdivine Hearts II continues Kemco and Exe Create's fantasy RPG formula on PS4, emphasizing party building, dungeon progression, and accessible character-driven adventure. It is best understood as a sequel entry for players already comfortable with the Asdivine style. GCX should help readers identify it as part of that connected budget JRPG lane, not a standalone prestige RPG.",
  "ps4-asdivine-kamura":
    "Asdivine Kamura is another Kemco-published Exe Create RPG, this time leaning into a more Japanese-fantasy flavor while keeping the familiar party, quest, and battle structure. The PS4 version is aimed at players who want a straightforward, menu-driven RPG with modest scope. For GCX, it belongs with collectible Kemco digital and limited-physical RPG releases.",
  "ps4-asdivine-menace":
    "Asdivine Menace is a Kemco and Exe Create RPG centered on party travel, character progression, and fantasy conflict across a traditional quest structure. Its PS4 role is to serve players who like steady, portable-style JRPG pacing on a home console. GCX should describe it as a comfort-entry RPG for genre completists rather than an experimental or high-budget release.",
  "ps4-asemblance":
    "Asemblance is a first-person psychological adventure from Nilo Studios that uses memory fragments, environmental clues, and unsettling spaces to build its mystery. The experience is brief, exploratory, and interpretive, with more emphasis on atmosphere and discovery than combat or large puzzle inventories. It is a useful PS4 entry for readers seeking narrative experiments.",
  "ps4-asemblance-oversight":
    "Asemblance: Oversight follows Nilo Studios' first-person mystery format with another compact, atmospheric story about perception, memory, and institutional secrets. Players move through controlled spaces, read environmental details, and piece together what the simulation is hiding. On PS4, it is best presented as a sequel-side narrative experiment for fans of short psychological adventures.",
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
