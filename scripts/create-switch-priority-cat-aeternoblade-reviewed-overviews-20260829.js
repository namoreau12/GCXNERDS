const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "switch-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "switch-priority-cat-aeternoblade-reviewed-overviews-2026-08-29.csv"
);

const rewrites = {
  "switch-cat":
    ".Cat is a small puzzle release built around guiding a cat through simple stage challenges and obstacle layouts. Its appeal is modest, quick-session play: players are not coming for a deep campaign, but for a light eShop puzzle entry with a clear animal theme and straightforward goals.",
  "switch-a-kei-otaku":
    "A-Kei Otaku is a Japanese visual-novel style Switch release aimed at fans of character-driven scenes, dialogue flow, and otaku-culture framing. It is a language-dependent import title where the experience is carried by story presentation and character interactions rather than action systems.",
  "switch-aborigenus":
    "Aborigenus is a compact side-scrolling action platformer about surviving hostile environments, fighting enemies, and moving through primitive-fantasy stages. On Switch it plays like a budget arcade adventure, with short levels and simple combat doing most of the work.",
  "switch-abyss-backrooms-pool-horror":
    "Abyss: Backrooms Pool Horror is a low-budget horror exploration game that uses empty pool spaces, maze-like rooms, and backrooms-inspired unease as its core mood. The play is about wandering, tension, and environmental disorientation more than combat-heavy survival horror.",
  "switch-aca-neo-geo-neo-geo-cup-98-the-road-to-the-victory":
    "ACA Neo Geo: Neo Geo Cup '98: The Road to the Victory brings SNK's arcade soccer game to Switch through Hamster's archival wrapper. It is a brisk, arcade-first football release with national teams, simple match flow, and the ACA extras players expect, such as display options and score-chasing modes.",
  "switch-aca-neo-geo-super-sidekicks-3-the-next-glory":
    "ACA Neo Geo: Super Sidekicks 3: The Next Glory preserves SNK's mid-1990s arcade soccer sequel on Switch. The draw is fast, readable football with exaggerated arcade pace, country selection, and Hamster's usual modern options for players who want a faithful Neo Geo presentation.",
  "switch-aca-neogeo-selection-vol-1":
    "ACA NEOGEO Selection Vol. 1 collects multiple Neo Geo arcade releases into one Switch package, turning Hamster's single-game ACA line into a broader compilation. The useful distinction is the volume number and included lineup, since buyers may be comparing it with individual ACA downloads or later volumes.",
  "switch-aca-neogeo-selection-vol-2":
    "ACA NEOGEO Selection Vol. 2 is the second compilation-style entry in Hamster's Neo Geo Switch series. It is best understood as a curated bundle of arcade titles with modern emulation options, where the included games and regional package details matter more than a single headline genre.",
  "switch-aca-neogeo-selection-vol-3":
    "ACA NEOGEO Selection Vol. 3 continues Hamster's Switch compilation line with another grouped set of Neo Geo arcade releases. The volume format makes it useful for players who want several classic arcade games together instead of buying each ACA title separately.",
  "switch-aca-neogeo-selection-vol-4":
    "ACA NEOGEO Selection Vol. 4 packages another batch of Neo Geo classics for Switch with the preservation-focused options associated with the ACA releases. For library tracking, the key context is that this is a distinct volume with its own title lineup, not a duplicate of the earlier sets.",
  "switch-aca-neogeo-selection-vol-5":
    "ACA NEOGEO Selection Vol. 5 is a later Switch compilation in Hamster's Neo Geo run, grouping more arcade titles under one numbered release. It should be cataloged by volume and included games because the naming is similar across the series and can easily blur in listings.",
  "switch-aca-neogeo-selection-vol-6":
    "ACA NEOGEO Selection Vol. 6 extends the numbered ACA NEOGEO compilation series with another bundle of emulated arcade games. The package is mainly for players and collectors who want a physical or grouped edition of multiple Neo Geo titles on Switch.",
  "switch-accolade-sports-collection":
    "Accolade Sports Collection revives a set of older Accolade sports games for Switch through QUByte and Atari's retro reissue pipeline. Rather than modern simulation, the hook is preserved vintage sports design, making the exact included games and compilation format the important details.",
  "switch-ace-angler":
    "Ace Angler adapts Bandai Namco's arcade fishing medal game into a Switch release built around reeling in colorful sea creatures, using special rods, and chasing aquarium-style collection goals. It is arcade fishing as spectacle, with progression tied to catching bigger and rarer targets.",
  "switch-ace-combat-7-skies-unknown-deluxe-edition":
    "Ace Combat 7: Skies Unknown Deluxe Edition brings Project ACES' cinematic jet-combat campaign to Switch with mission-based dogfighting, missile locks, weather effects, and high-speed aerial set pieces. The Deluxe Edition framing matters because it folds extra content into the portable version.",
  "switch-active-neurons":
    "Active Neurons is a minimalist puzzle game about moving an energy block through clean, abstract stages while avoiding hazards and triggering level mechanisms. Its rhythm is quiet and logic-focused, built for players who want short brain-teaser rooms rather than story or action spectacle.",
  "switch-adventures-of-bertram-fiddle-episode-1-a-dreadly-business":
    "Adventures of Bertram Fiddle Episode 1: A Dreadly Business is a hand-drawn point-and-click comedy adventure starring a bumbling Victorian explorer. The Switch version focuses on character banter, inventory puzzles, and absurd mystery rather than fast inputs or combat.",
  "switch-aery-ancient-empires":
    "Aery: Ancient Empires is a relaxed flying exploration game where players glide through stylized ancient-world environments as a birdlike spirit. The play is deliberately low-pressure, built around collecting objects, drifting through themed spaces, and using flight as a calm sightseeing loop.",
  "switch-aery-cyber-city":
    "Aery: Cyber City applies the series' gentle flight formula to neon cityscapes and futuristic environments. Players float through abstract urban spaces, collect items, and take in the scenery, making it closer to a meditative exploration piece than a challenge-driven action game.",
  "switch-aeternoblade-ii":
    "AeternoBlade II is a side-scrolling action RPG built around time-manipulation powers, combo combat, and multiple playable characters. On Switch, its identity comes from mixing Metroidvania-style exploration with hack-and-slash encounters and puzzles that depend on rewinding or altering time.",
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
