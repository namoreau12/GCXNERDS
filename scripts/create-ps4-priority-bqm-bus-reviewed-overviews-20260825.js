const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "ps4-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-bqm-bus-reviewed-overviews-2026-08-25.csv"
);

const reviewedOverviews = {
  "ps4-bqm-blockquest-maker":
    "BQM: BlockQuest Maker is a dungeon-building RPG toolkit where players create, share, and clear block-based quests filled with traps, monsters, switches, and treasure. The PS4 appeal is less about one authored campaign and more about user-made dungeon logic. GCX should frame it as a creation-focused curiosity for puzzle-RPG and maker-game fans.",
  "ps4-bratz-flaunt-your-fashion":
    "Bratz: Flaunt Your Fashion is a licensed fashion adventure built around exploring city hubs, completing style-focused tasks, taking photos, and customizing the Bratz cast. The PS4 version targets younger players and fans of the doll brand rather than action-heavy play. It belongs in GCX as a family-friendly licensed lifestyle game.",
  "ps4-braveland-trilogy":
    "Braveland Trilogy packages Ellada Games' compact tactical RPG series on PS4, with hex-grid battles, simple unit progression, and fantasy campaigns across several scenarios. Its appeal is approachable strategy with light role-playing structure rather than deep simulation. GCX should list it as a budget-friendly tactics collection for players who like clear, readable battles.",
  "ps4-breakneck-city":
    "Breakneck City is a retro-flavored beat 'em up about using punches, throws, and environmental hazards to clear urban stages. The PS4 release leans into arcade pacing and local brawler nostalgia, with more emphasis on immediacy than long-form progression. GCX should frame it as a small Eastasiasoft action entry for beat 'em up collectors.",
  "ps4-breakthrough-gaming-arcade-baseball":
    "Breakthrough Gaming Arcade: Baseball is a minimalist sports-arcade release built for very short baseball-themed play sessions. Its value is mainly catalog and curiosity value inside Breakthrough Gaming's budget arcade line, not licensed teams or simulation depth. GCX should describe it as a tiny digital sports entry for completists and low-cost arcade collectors.",
  "ps4-breakthrough-gaming-arcade-football":
    "Breakthrough Gaming Arcade: Football is a stripped-down football-themed entry in Breakthrough Gaming's PS4 arcade series. Readers should expect simple inputs, quick scoring-style play, and budget-release presentation rather than full playbooks or team management. It is most relevant as part of the publisher's micro-arcade catalog.",
  "ps4-breakthrough-gaming-arcade-skateboarding":
    "Breakthrough Gaming Arcade: Skateboarding is a small skateboarding-themed arcade release focused on quick challenge structure rather than a full extreme-sports career mode. GCX should be plain about its scope: this is a budget digital title for the Breakthrough Gaming line. Its collector angle is platform-library completion, not genre-defining skate design.",
  "ps4-breakthrough-gaming-arcade-track":
    "Breakthrough Gaming Arcade: Track is a basic track-and-field themed arcade release in Breakthrough Gaming's PS4 catalog. The appeal is simple timing, quick attempts, and very small-scale sports play rather than deep athletics simulation. GCX should keep the listing factual and useful for readers cataloging budget PlayStation Store oddities.",
  "ps4-bridge-constructor":
    "Bridge Constructor is a physics puzzle game about building spans from limited materials, then testing whether cars and trucks can cross without collapsing the structure. ClockStone's PS4 version is driven by weight, budget, triangles, and trial-and-error engineering. It is a clear fit for readers who like practical puzzle solving and visible cause-and-effect.",
  "ps4-bridge-constructor-stunts":
    "Bridge Constructor Stunts twists the bridge-building formula toward jumps, crashes, ramps, and stunt routes. Players still solve physics puzzles, but the goal shifts toward getting vehicles through spectacular courses rather than simply making safe crossings. On PS4, it works as the more chaotic companion to the original Bridge Constructor.",
  "ps4-bridge-constructor-the-walking-dead":
    "Bridge Constructor: The Walking Dead combines structural physics puzzles with the zombie-license setting, asking players to guide survivors, vehicles, and walkers through trap-like stages. The hook is using bridge-building logic to create escapes and zombie-clearing contraptions. GCX should present it as a licensed puzzle spin-off, not a traditional Walking Dead adventure.",
  "ps4-brief-battles":
    "Brief Battles is a party brawler where underwear-themed power-ups drive quick arena fights, platform movement, and local multiplayer chaos. The PS4 version is built for short competitive rounds and goofy couch-play energy. GCX should describe it as a small party combat game with a very specific joke rather than a serious fighter.",
  "ps4-broforce":
    "Broforce is a chaotic run-and-gun platformer from Free Lives where action-movie parody heroes blast through destructible stages, rescue allies, and chain explosive co-op mayhem. The PS4 appeal is speed, comedy, and messy improvisation. It is one of Devolver's better-known indie action releases and should be framed as such.",
  "ps4-broken-sword-5-the-serpent-s-curse":
    "Broken Sword 5: The Serpent's Curse brings Revolution's point-and-click adventure series to PS4 with George and Nico investigating art theft, conspiracy, dialogue puzzles, and clue-driven scenes. Its value comes from story, characters, and classic adventure logic rather than action. GCX should position it for mystery and traditional adventure-game fans.",
  "ps4-brutal":
    "Brutal is a dungeon-crawling action RPG with stark ASCII-inspired visual design, procedurally arranged floors, loot, traps, and local co-op combat. The PS4 version stands out more for style and arcade dungeon pacing than narrative depth. It belongs in GCX as an experimental-looking roguelite action entry from Stormcloud Games.",
  "ps4-bucket-knight":
    "Bucket Knight is a compact side-scrolling platform shooter about blasting through short stages, collecting gold, and avoiding hazards. Sometimes You's PS4 release is built for quick clears and budget-platformer appeal. GCX should describe it as a small arcade-style platform action game rather than a full-scale adventure.",
  "ps4-bugsbox":
    "BugsBox is an action-puzzle game from Park ESM with a bug-themed premise and small-stage challenge structure. Because it is a niche digital release, GCX should keep the description grounded: expect compact puzzle-action play and catalog curiosity value rather than a widely documented genre landmark. It is most relevant to PS4 completionists.",
  "ps4-bulwark-evolution-falconeer-chronicles":
    "Bulwark Evolution: Falconeer Chronicles is Tomas Sala's freeform city-building and settlement design game set in the same oceanic world as The Falconeer. The PS4 appeal is arranging towers, routes, factions, and dramatic structures without a typical grid-heavy sim feel. GCX should frame it as an atmospheric builder with strategy-adjacent systems.",
  "ps4-buried-stars":
    "Buried Stars is a Korean narrative adventure and visual novel about contestants trapped after a televised audition-show disaster, with social media pressure, suspicion, and branching dialogue shaping the mystery. The PS4 version is strongest for readers who enjoy tense character drama and investigative conversation rather than combat.",
  "ps4-bus-driver-simulator":
    "Bus Driver Simulator is a vehicle-simulation game focused on driving bus routes, stopping for passengers, observing traffic, and managing the rhythm of public transport. The PS4 release is slower and more routine-driven than racing games, with appeal tied to careful driving and route completion. GCX should list it for simulator fans.",
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
