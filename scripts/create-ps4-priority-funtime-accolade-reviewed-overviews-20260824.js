const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "ps4-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-funtime-accolade-reviewed-overviews-2026-08-24.csv"
);

const reviewedOverviews = {
  "ps4-funtime":
    "#Funtime is a neon arena shooter from OneGuyGames where color, weapon switching, and wave pressure define the rhythm. It belongs to the PS4's indie arcade lane: compact, score-focused, and built for players who want quick sessions with twin-stick intensity rather than a long campaign. Its Quantum Astrophysicists Guild release also makes it a useful library entry for tracking smaller digital-era publishers on PlayStation.",
  "ps4-killallzombies":
    "#killallzombies is a top-down survival shooter built around arenas full of escalating zombie waves, hazards, and crowd-control pressure. Beatshapers framed it as an early PS4 digital release, so its library value comes from both its arcade horde structure and its place in the console's first wave of downloadable indie experiments.",
  "ps4-2urvive":
    "2urvive is a small-scale survival action release from 2BAD GAMES, centered on staying alive against enemy pressure rather than following a cinematic campaign. Its appeal is in short, direct combat loops, resource tension, and repeat attempts, making it a better fit for players browsing PS4 indie survival curiosities than for someone expecting a large open-world zombie game.",
  "ps4-3-c-sand-puzzle":
    "3 C Sand Puzzle is a Kemco-published puzzle game from COOL&WARM built for short, rule-driven stages rather than story spectacle. The hook is its sand-and-temperature theme, giving the listing a distinct identity among late PS4 puzzle releases. GCX should present it as a compact logic puzzler and a recent cross-generation store entry, not as a generic action or adventure title.",
  "ps4-3d-billiards":
    "3D Billiards is a straightforward pool-room sports game from Z-Software and Joindots, focused on cue angles, shot strength, ball physics, and traditional billiards table play. For PS4 owners, it fills the casual sports-simulation niche: easy to understand, better suited to quick local sessions than career depth, and useful for collectors documenting the console's broad digital sports catalog.",
  "ps4-3d-minigolf":
    "3D MiniGolf turns Z-Software's casual sports approach toward themed putting courses, obstacle timing, and angle-based trick shots. The PS4 release is not trying to compete with serious golf sims; it is a light local-friendly mini-golf package from Joindots, useful for players who want simple course challenges and for collectors tracking family-friendly digital sports games.",
  "ps4-5-star-wrestling-regenesis":
    "5 Star Wrestling: ReGenesis is Serious Parody's attempt at a wrestling game built around character archetypes, grappling exchanges, ring positioning, and match drama. It stands apart from licensed WWE releases because it is an independent wrestling alternative with its own roster and tone. On GCX, it should be framed as a niche curiosity for wrestling-game collectors rather than a mainstream sports annual.",
  "ps4-7th-sector":
    "7th Sector is a dark side-scrolling puzzle adventure from Sergey Noskov where players move through connected machinery, screens, and electrical systems instead of controlling a traditional hero. Its appeal comes from mood, environmental puzzles, and wordless sci-fi progression. The PS4 version fits the console's indie adventure library for players who like atmospheric, systems-driven puzzle journeys.",
  "ps4-8-to-glory":
    "8 to Glory adapts professional bull riding into a timing-and-balance sports game, putting the focus on staying mounted, reading the ride, and handling the short explosive rhythm of each event. It is a specialized sports release rather than a broad rodeo package, which makes it notable for collectors looking at licensed or sport-specific PS4 games outside the usual football, basketball, and racing lanes.",
  "ps4-9-nine":
    "9 -Nine- is a Palette visual novel release built around character routes, supernatural mystery elements, and dialogue-led progression. The PS4 entry is most relevant for readers who follow Japanese story games and import-friendly console visual novels, where the draw is route structure, presentation, and character focus rather than mechanical challenge or action systems.",
  "ps4-9th-dawn-iii":
    "9th Dawn III is Valorware's open-ended action RPG and dungeon-crawler, built around exploration, loot, monster encounters, skill growth, and a large world to work through at the player's pace. It has the feel of an indie RPG made for long-form wandering rather than tightly scripted set pieces, which gives the PS4 listing real value for players seeking deep progression outside the biggest publisher catalogs.",
  "ps4-20-bunnies":
    "20 Bunnies is an EastAsiaSoft-published action-puzzle platformer about guiding small characters through compact hazard stages. Its identity comes from quick retries, simple movement goals, and stage-by-stage problem solving rather than elaborate narrative. For GCX, it belongs with the PS4's small digital puzzle-platform releases and trophy-friendly indie catalog.",
  "ps4-39-days-to-mars":
    "39 Days to Mars is a cooperative puzzle adventure with a hand-drawn Victorian science-fiction style, following an intentionally fragile expedition to Mars. Its puzzles are built around communication, odd machines, and two-player coordination, though solo play is also part of the package. That makes it stand out on PS4 as a charming short-form adventure rather than a conventional action game.",
  "ps4-a-certain-magical-virtual-on":
    "A Certain Magical Virtual-On combines Sega's Virtual-On arena-mech combat with the A Certain Magical Index crossover license. Players should expect lock-on movement, projectile exchanges, character-specific machines, and one-on-one arena pressure rather than a standard action-adventure structure. Its Japan-focused PS4 release is especially relevant for import collectors and fans of Sega's arcade fighting lineage.",
  "ps4-a-healer-only-lives-twice":
    "A Healer Only Lives Twice is a compact dungeon-crawling strategy game where the player's job is to keep a frontline fighter alive through healing, resource timing, and tactical support. That unusual role reversal gives it a clearer identity than a generic RPG listing: the tension comes from triage decisions, enemy waves, and managing limited options under pressure.",
  "ps4-a-hole-new-world":
    "A Hole New World is a retro-styled action platformer from Mad Gear Games built around jumping, shooting, boss fights, and an upside-down world gimmick. It draws on 8-bit arcade difficulty more than modern cinematic platforming, so the PS4 version is best presented as a deliberately old-school indie release for players who enjoy demanding stage layouts and pattern learning.",
  "ps4-a-train-express":
    "A-Train Express brings Artdink's long-running transport and city-management simulation to PS4, asking players to plan rail lines, develop surrounding areas, and balance infrastructure decisions over time. It is slow, systems-heavy, and business-minded, which makes it a strong fit for simulation fans but a very different experience from action-driven console management games.",
  "ps4-aaru-s-awakening":
    "Aaru's Awakening is a fast, hand-drawn platformer built around teleportation movement, air control, and precision hazards. Instead of leaning on collectibles or combat depth, it tests the player's ability to chain movement through demanding levels. On PS4, it represents the early indie platformer wave: stylish, challenging, and more technical than its storybook look might suggest.",
  "ps4-abyss-the-wraiths-of-eden":
    "Abyss: The Wraiths of Eden is an Artifex Mundi hidden-object adventure set around an underwater mystery, mixing scene searches, inventory puzzles, and light adventure-game progression. The PS4 version matters as part of the console's casual puzzle catalog, especially for players who like relaxed investigation and collectors following Artifex Mundi's steady flow of console ports.",
  "ps4-accolade-sports-collection":
    "Accolade Sports Collection is a preservation-minded compilation from QUByte Interactive and Atari, gathering older Accolade sports games for modern PlayStation hardware. The draw is historical access rather than modern simulation depth: it gives players a convenient way to sample retro sports design, period presentation, and legacy catalog material within a single PS4-era release.",
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
