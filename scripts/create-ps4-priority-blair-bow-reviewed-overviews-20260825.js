const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "ps4-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-blair-bow-reviewed-overviews-2026-08-25.csv"
);

const reviewedOverviews = {
  "ps4-blair-witch":
    "Blair Witch is Bloober Team's first-person psychological horror game set in the film series' Black Hills Forest mythology. The PS4 experience leans on exploration, disorientation, sound, and the player's bond with the dog Bullet instead of constant combat. GCX should frame it as a tense licensed horror entry for players who enjoy atmosphere and narrative unease.",
  "ps4-blast-em-bunnies":
    "Blast 'Em Bunnies is an arcade shooter where players defend against waves of cartoon rabbits using exaggerated weapons, upgrades, and fast target prioritization. The appeal is simple, score-minded shooting with a silly presentation rather than military realism. On PS4, it fits the small digital shooter lane for quick sessions and novelty collectors.",
  "ps4-blast-zone-tournament":
    "Blast Zone! Tournament is an arena action game inspired by bomb-placement maze battles, with hazards, power-ups, multiplayer modes, and fast round structure. The PS4 version is most useful for readers looking for couch or online party competition. GCX should present it as a modern Bomberman-style alternative, not a broad action-adventure campaign.",
  "ps4-blaster-master-zero-3":
    "Blaster Master Zero 3 closes Inti Creates' retro revival trilogy with side-scrolling tank exploration, on-foot action, upgrades, and interconnected stages. Its PS4 appeal is the mix of classic Blaster Master structure and modern quality-of-life polish. GCX should flag it as the finale entry, best appreciated after the earlier Zero games.",
  "ps4-blaster-master-zero-trilogy-metafight-chronicle":
    "Blaster Master Zero Trilogy: MetaFight Chronicle bundles Inti Creates' three Blaster Master Zero games into one PS4 package. The value is continuity: tank-based exploration, top-down character segments, boss fights, and the full reboot storyline in a single release. For collectors, this is the cleanest PS4 way to track the complete modern trilogy.",
  "ps4-bleach-rebirth-of-souls":
    "Bleach: Rebirth of Souls is a character fighting game built around the Bleach anime and manga cast, with sword clashes, special attacks, transformations, and matchup knowledge at the center. The PS4 listing matters for fans who want a dedicated arena-style Bleach release. GCX should describe it as licensed anime combat where roster appeal is the main hook.",
  "ps4-bleed":
    "Bleed is a fast 2D action-platformer about acrobatic gunplay, air dashing, bullet dodging, and boss-focused stages. Bootdisk Revolution's design rewards movement confidence and quick reaction more than exploration. On PS4, it is a compact indie action game for players who like arcade difficulty, stylish runs, and short replayable levels.",
  "ps4-bleed-2":
    "Bleed 2 sharpens the first game's acrobatic run-and-gun formula with tighter stages, reflection mechanics, boss rush energy, and heavy emphasis on flow. The PS4 release should appeal to players who enjoy skill-based 2D action that can be replayed for cleaner clears. GCX should frame it as a refined sequel, not just more generic platforming.",
  "ps4-block-a-pix-deluxe":
    "Block-a-Pix Deluxe is a Lightwood Games logic puzzle collection where players fill grid regions to reveal pixel-art pictures. The challenge comes from reading numbers, dividing blocks correctly, and solving at a relaxed pace. GCX should describe it as a quiet puzzle release for Picross and logic-grid fans rather than an action puzzler.",
  "ps4-bloodroots":
    "Bloodroots is a one-hit-kill revenge action game where almost every object in the environment can become a weapon. Paper Cult's hook is improvisation: chaining kills with axes, ladders, carrots, cannons, and whatever else is nearby. On PS4, it is best framed as a frantic score-chasing action game built around creative brutality and momentum.",
  "ps4-bloody-zombies":
    "Bloody Zombies is a side-scrolling beat 'em up about surviving a stylized London zombie outbreak with melee combos, co-op play, and arcade brawler pacing. Paw Print Games also built it with optional VR support in mind, but the core PS4 appeal remains cooperative crowd control. GCX should place it with modern downloadable brawlers.",
  "ps4-bloons-td-5":
    "Bloons TD 5 brings Ninja Kiwi's tower-defense formula to PS4, asking players to place monkey towers, upgrade paths, and manage balloon waves across increasingly demanding maps. The experience is strategic but approachable, with satisfaction coming from efficient layouts and long-run survival. It belongs in GCX as a recognizable casual-strategy conversion.",
  "ps4-blue-estate":
    "Blue Estate is an on-rails first-person shooter adapted from the comic property, using exaggerated crime-comedy tone, motion-style aiming, and set-piece target galleries. The PS4 version is a snapshot of early console digital experimentation with rail-shooter controls. GCX should be clear that its appeal is arcade shooting and attitude, not open-ended FPS design.",
  "ps4-blue-fire":
    "Blue Fire is a 3D action-platformer set in a ruined fantasy world, focused on precise jumping, fast movement, combat encounters, and optional challenge rooms called Voids. Robi Studios' PS4 release appeals to players who like nimble traversal and moody adventure structure. It sits between platforming skill tests and light action exploration.",
  "ps4-blue-rider":
    "Blue Rider is a top-down arcade shooter about piloting a small combat vehicle through enemy bases, turrets, waves, and boss encounters. Its PS4 appeal is straightforward shooting, bright visuals, and replayable stage pressure. GCX should present it as a compact twin-stick-style action release for players who want immediate arcade challenge.",
  "ps4-boiling-bolt":
    "Boiling Bolt is a horizontal shoot 'em up set across floating sci-fi environments, with weapon upgrades, enemy formations, and screen-filling pressure driving the action. The PS4 version is aimed at shmup players who want a modern digital shooter with brisk pacing. GCX should emphasize pattern learning and weapon feel over campaign depth.",
  "ps4-bokosuka-wars-ii":
    "Bokosuka Wars II follows up the eccentric Japanese strategy-action original with unit movement, simple combat resolution, and deliberately unusual tactical structure. The PS4 listing is most important as a historical curiosity and sequel to a cult design, not a mainstream strategy release. GCX should frame it for import-minded collectors and oddball game historians.",
  "ps4-book-of-demons":
    "Book of Demons is a papercraft-styled action RPG that remixes dungeon crawling with card-based skills, streamlined movement, and flexible session lengths. Thing Trunk's PS4 version is approachable for players who like Diablo-style loot loops but want a more controlled, board-game-like rhythm. GCX should highlight its distinctive presentation and card system.",
  "ps4-bounty-battle":
    "Bounty Battle is an indie crossover fighting game that gathers characters from several smaller game franchises into arena-style battles. Its PS4 appeal is the novelty roster and fan-service concept rather than tournament polish. GCX should present it cautiously as a collector curiosity for indie character fans and platform-fighter completists.",
  "ps4-bow-to-blood-last-captain-standing":
    "Bow to Blood: Last Captain Standing is an airship command adventure where players manage crew stations, steer through hazards, fight rivals, and navigate alliances in a televised competition. The PS4 version blends action, resource management, and social decision-making. GCX should describe it as a distinctive captain-sim survival contest rather than a standard exploration game.",
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
