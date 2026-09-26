const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "ps4-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-atari-batu-reviewed-overviews-2026-08-24.csv"
);

const reviewedOverviews = {
  "ps4-atari-flashback-classics-volume-2":
    "Atari Flashback Classics: Volume 2 is a preservation-minded PS4 collection built around short-form Atari arcade and console-era play. The appeal is fast resets, simple rules, local score competition, and seeing how early design ideas hold up across multiple games. GCX should frame it as a retro library piece for players comparing Atari history on modern hardware.",
  "ps4-atari-flashback-classics-volume-3":
    "Atari Flashback Classics: Volume 3 continues the PS4 anthology approach with Code Mystics handling a bundle of older Atari releases for modern display and controller use. Its value is convenience, breadth, and local retro sampling rather than one headline campaign. It matters most to collectors who want Atari's back catalog represented across all three Flashback volumes.",
  "ps4-atelier-ayesha-the-alchemist-of-dusk-dx":
    "Atelier Ayesha: The Alchemist of Dusk DX is Gust's alchemy RPG about gathering materials, synthesizing items, managing time, and following Ayesha's search through the Dusk setting. The DX PS4 version is valuable because it brings an earlier Atelier chapter forward with extra content and modern access. Players should expect crafting rhythm, character events, and gentle exploration over heavy spectacle.",
  "ps4-atelier-sophie-2-the-alchemist-of-the-mysterious-dream":
    "Atelier Sophie 2: The Alchemist of the Mysterious Dream is a later Gust RPG focused on Sophie and Plachta inside a dreamlike world of alchemy, party battles, gathering, and item synthesis. Compared with older Atelier entries, its PS4 appeal is polish, bright presentation, and a crafting loop that strongly drives progression. GCX should position it as a welcoming modern Atelier sequel.",
  "ps4-atomfall":
    "Atomfall is Rebellion's survival-action mystery set around an alternate-history British disaster zone. The PS4 listing should emphasize exploration, scavenging, hostile factions, and investigative survival rather than a straight shooter structure. It is relevant for readers looking for a slower, systems-driven adventure where the setting and player choices matter as much as combat.",
  "ps4-atv-drift-and-tricks":
    "ATV Drift and Tricks is an arcade off-road racer from Artefacts Studio built around quad-bike handling, jumps, drift timing, and event variety. It fills a specific PS4 racing niche for players who want stunt-heavy ATV competition instead of licensed circuit racing. GCX should describe it as a lightweight, handling-focused racer with local party appeal.",
  "ps4-autumn-s-journey":
    "Autumn's Journey is a short fantasy visual novel about a young knight candidate, dragon companions, and character-driven route choices. Despite appearing in the action-adventure queue, the PS4 experience is primarily reading, dialogue, and branching relationship beats. It belongs in GCX as a compact Ratalaika-published story release for visual-novel and easy-completion collectors.",
  "ps4-away-the-survival-series":
    "Away: The Survival Series casts the player as a sugar glider navigating wildlife threats, environmental hazards, and nature-documentary-style narration. Its PS4 identity comes from animal traversal, gliding, foraging, and predator avoidance rather than traditional human survival crafting. GCX should present it as an unusual nature adventure with survival flavor and educational tone.",
  "ps4-aztech-forgotten-gods":
    "Aztech: Forgotten Gods is Lienzo's action-adventure about an alternate Aztec-inspired metropolis where the protagonist uses high-speed movement and a powerful gauntlet to confront massive gods. The PS4 appeal is aerial traversal, boss-scale encounters, and a setting rarely centered in console action games. It should be framed as a distinct cultural-fantasy indie adventure.",
  "ps4-azure-reflections":
    "Azure Reflections is a Touhou Project fan-game shooter focused on bullet patterns, character abilities, and repeated runs through dense danmaku-style encounters. On PS4, it is most useful for players who want a console-accessible Touhou-adjacent shoot 'em up with bright character presentation. GCX should describe it as pattern-learning arcade action, not a broad action RPG.",
  "ps4-back-to-bed":
    "Back to Bed is a surreal puzzle game about guiding a sleepwalker through dreamlike isometric stages by manipulating his path and avoiding hazards. Its appeal comes from visual oddness, compact levels, and step-by-step route planning. The PS4 release fits readers looking for a quiet puzzle curiosity with strong art direction rather than twitch play.",
  "ps4-backgammon-blitz":
    "Backgammon Blitz brings the classic board game to PS4 with digital presentation, dice-driven risk, movement planning, and local or online-style competitive appeal depending on mode availability. The experience is about reading probabilities and positioning checkers, not campaign progression. GCX should list it as a traditional tabletop adaptation for players who want familiar board-game strategy on console.",
  "ps4-bang-on-balls-chronicles":
    "Bang-On Balls: Chronicles is a chaotic 3D platforming brawler where spherical characters roll, smash, collect, and battle through historical-themed sandbox stages. The PS4 hook is playful movement, co-op-friendly mayhem, customization, and a toy-box tone. It should appeal to readers browsing for loose, physics-flavored action rather than tightly scripted platforming.",
  "ps4-banner-of-the-maid":
    "Banner of the Maid is a tactical RPG that reimagines the French Revolution through grid-based battles, unit classes, morale, terrain, and political drama. Its PS4 value is the combination of historical fantasy flavor and deliberate turn-based positioning. GCX should position it for strategy fans who want character progression and campaign tactics without real-time pressure.",
  "ps4-basement-crawl":
    "Basement Crawl is Bloober Team's early PS4 arena game inspired by trap-placement and maze-chase multiplayer ideas. The release is notable partly because its rough launch reputation later led to the reworked Brawl. GCX should be candid: this is a curiosity for Bloober collectors and PS4 launch-era historians more than a broadly recommended party-action staple.",
  "ps4-battle-of-the-bulge":
    "Battle of the Bulge is a Slitherine strategy adaptation of the World War II Ardennes campaign, focused on fronts, unit movement, supply pressure, and scenario decisions. On PS4, it represents a rare console entry for board-wargame-style play. Readers should expect deliberate planning and historical abstraction rather than cinematic military action.",
  "ps4-battle-princess-madelyn":
    "Battle Princess Madelyn is a retro-styled action platformer inspired by arcade and 16-bit ghost-hunting adventures, with armor, weapons, enemies, and stages built for repeated attempts. The PS4 release is strongest for players who like challenging side-scrollers with nostalgic presentation. GCX should note its throwback structure and indie collector appeal.",
  "ps4-battle-spirits-collected-battlers":
    "Battle Spirits: Collected Battlers adapts Bandai's trading-card franchise into a PS4 card-battle game, emphasizing deck construction, character encounters, and rule mastery. Its value is clearest for fans of the Battle Spirits property and import collectors tracking console TCG adaptations. GCX should frame it as a niche card-game release rather than a general puzzle title.",
  "ps4-battleship":
    "Battleship on PS4 adapts the familiar hidden-grid naval board game with Ubisoft and Frima's digital presentation. The experience is about deduction, shot placement, risk management, and quick tactical rounds, with value strongest for local-friendly board-game nights. GCX should describe it as a simple licensed tabletop conversion, not a naval warfare sim.",
  "ps4-batu-ta-batu":
    "Batu Ta Batu is a color-matching puzzle game built around linking tiles, reacting quickly, and creating chains across compact playfields. The PS4 release is aimed at short sessions, score improvement, and accessible multiplayer or party-style puzzle energy. It belongs in the library as a small digital puzzle entry with a clear arcade rhythm.",
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
