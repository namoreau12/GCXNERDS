const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "ps4-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-bears-bladed-reviewed-overviews-2026-08-25.csv"
);

const reviewedOverviews = {
  "ps4-bears-can-t-drift":
    "Bears Can't Drift!? is a playful kart-style racer built around bright tracks, drifting, pickups, and local multiplayer energy. The joke in the title points to the tone: it is more party racer than simulation. GCX should frame the PS4 release as a small indie alternative for players who want accessible split-screen-style racing and lighthearted competition.",
  "ps4-beast-quest":
    "Beast Quest adapts the children's fantasy book series into a console action RPG with exploration, creature battles, quests, and a straightforward heroic journey. Torus Games' PS4 version is aimed at younger players and franchise fans rather than deep RPG systems. It belongs in GCX as a licensed fantasy adventure with collector interest tied to the book property.",
  "ps4-bee-simulator":
    "Bee Simulator lets players explore a park-like world from a bee's perspective, collecting pollen, flying through races, interacting with a hive, and learning light nature facts. Its PS4 appeal is the unusual viewpoint and family-friendly simulation tone rather than deep management. GCX should present it as a gentle educational adventure with novelty value.",
  "ps4-beholder-2":
    "Beholder 2 is a dystopian management and narrative strategy game about climbing a ministry bureaucracy while spying, manipulating, and making morally loaded choices. The PS4 version trades action for pressure, paperwork, surveillance, and branching consequences. It is useful for readers who like dark political satire and decision-driven systems.",
  "ps4-ben-10-power-trip":
    "Ben 10: Power Trip is an open-zone action-adventure built around Ben's alien transformations, light combat, traversal, and cooperative-friendly superhero play. The PS4 version is aimed squarely at younger fans of the animated series. GCX should describe it as a licensed family adventure where the main draw is using different alien forms across missions.",
  "ps4-betty-bat-s-treasure-hunt":
    "Betty Bat's Treasure Hunt is a small PS4 action release from Bionic Pony, centered on direct movement, collecting, hazards, and short-stage progression. It is best treated as a niche digital-platform curiosity rather than a major genre entry. GCX should be conservative here: the value is in catalog completeness and quick-play action for budget-release collectors.",
  "ps4-beyond-galaxyland":
    "Beyond Galaxyland is a sci-fi adventure RPG with cinematic pixel-art presentation, party encounters, alien worlds, and a road-trip tone across strange planets. The PS4 listing should emphasize exploration, character moments, and turn-based-style role-playing flavor rather than generic action. It stands out for readers looking for modern indie RPGs with a strong visual identity.",
  "ps4-big-bash-boom":
    "Big Bash Boom is Big Ant's arcade cricket game built around the Big Bash League license, exaggerated player models, accessible batting and bowling, and quick sports spectacle. It is lighter and flashier than a simulation cricket release. GCX should place it in the PS4 library as a licensed, party-leaning cricket option for fans of the league.",
  "ps4-big-rumble-boxing-creed-champions":
    "Big Rumble Boxing: Creed Champions is an arcade boxing game using characters from the Creed and Rocky universe, with punch timing, dodges, special moves, and character matchups driving the action. The PS4 appeal is cinematic boxing fantasy made approachable, not a strict simulation. It is most relevant to licensed sports-action and movie-franchise collectors.",
  "ps4-binaries":
    "Binaries is a precision puzzle-platformer where players control two characters at once through hazard-filled stages. Its challenge comes from split attention, timing, and reading mirrored or separated routes under pressure. GCX should present it as a clever skill-based indie release for players who enjoy compact levels and coordination puzzles.",
  "ps4-biped":
    "Biped is a cooperative puzzle-platformer about two small robots whose legs are controlled independently, turning walking itself into the central mechanic. The PS4 release works best with two players solving timing, balance, and traversal challenges together. Its hook is physical comedy and coordination rather than speedrunning or combat.",
  "ps4-birthday-of-midnight":
    "Birthday of Midnight is a minimalist puzzle-platform game where players launch a small character through compact levels toward a goal while avoiding hazards. Petite Games' design is simple, short-session, and precision-focused. On GCX, it fits as a Ratalaika-published budget puzzle entry for readers looking for quick challenges and easy-to-grasp rules.",
  "ps4-birthdays-the-beginning":
    "Birthdays the Beginning is a god-game-style sandbox from Yasuhiro Wada where players shape terrain, temperature, and ecosystems to encourage new life forms to appear. It is about experimentation, time, and environmental balance rather than combat. The PS4 version is a notable NIS America release for players who enjoy systems-driven creation games.",
  "ps4-bit-trip":
    "Bit.Trip on PS4 collects Choice Provisions' rhythm-action lineage around timing, pattern reading, music, and minimalist arcade presentation. The appeal is the way each challenge ties player input to sound and visual flow. GCX should describe it as a rhythm-arcade package for fans of precision play and score-chasing design.",
  "ps4-black-and-white-bushido":
    "Black & White Bushido is a local multiplayer arena brawler built around light, shadow, stealth, and sudden sword strikes. Players blend into matching backgrounds, ambush opponents, and fight for positioning in compact arenas. The PS4 release is strongest as a couch-competition curiosity with a clear visual gimmick.",
  "ps4-black-legend":
    "Black Legend is a turn-based tactical RPG set in a grim alchemy-tinged city, with squads, positioning, status effects, and class development shaping battles. Its PS4 appeal is deliberate combat and dark atmosphere rather than fast action. GCX should frame it for strategy RPG fans who like methodical encounters and unusual historical-fantasy flavor.",
  "ps4-black-paradox":
    "Black Paradox is a neon-styled roguelite shoot 'em up about blasting through waves of enemies, upgrading weapons, and chasing stronger runs. Fantastico Studio leans into synthwave color, power-ups, and arcade repetition. For PS4 readers, it is a compact shooter where build variety and repeated attempts matter more than story.",
  "ps4-blacksea-odyssey":
    "Blacksea Odyssey is a top-down roguelite shooter about hunting huge space creatures with harpoons, upgrades, and destructible boss parts. The PS4 hook is monster-hunting scale filtered through arcade shooting and run-based progression. GCX should position it for players who like aggressive twin-stick-style action with unusual cosmic-sea presentation.",
  "ps4-blade-ballet":
    "Blade Ballet is a party battle game where spinning robots duel in arenas full of hazards and movement tricks. The core appeal is chaotic local competition, quick rounds, and character-specific abilities rather than a long single-player campaign. It belongs in GCX as a small multiplayer arena release for couch-play collectors.",
  "ps4-bladed-fury":
    "Bladed Fury is a side-scrolling action game inspired by Chinese mythology and Warring States imagery, with sword combos, parries, boss fights, and striking 2D art. The PS4 version is best understood as a stylish combat-focused indie action release. GCX should highlight its presentation and mythology angle alongside its short, skill-driven structure.",
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
