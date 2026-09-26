const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "ps4-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-amazing-blastoff-reviewed-overviews-2026-08-24.csv"
);

const reviewedOverviews = {
  "ps4-amazing-discoveries-in-outer-space":
    "Amazing Discoveries in Outer Space is a compact exploration-platform game from Cosmic Picnic about navigating small planets, hazards, and physics-driven movement. Its PS4 appeal comes from short-session discovery and oddball space traversal rather than traditional stage-by-stage action. GCX should frame it as a small digital-era curiosity for players who like experimental platformers and modest indie releases.",
  "ps4-american-fugitive":
    "American Fugitive is a top-down open-world crime game from Fallen Tree Games, built around driving, burglary, police chases, combat, and sandbox chaos in a small-town setting. The PS4 version is useful for readers looking for a modern riff on older overhead crime games rather than a massive cinematic open world. Its collector angle is the Curve/Fallen Tree indie sandbox niche.",
  "ps4-amoeba-battle-microscopic-rts-action":
    "Amoeba Battle: Microscopic RTS Action adapts real-time strategy to a microscopic theme, with unit control, positioning, and tactical encounters built around organisms instead of tanks or fantasy armies. On PS4, it stands out because console RTS releases are uncommon. GCX should present it as a niche strategy entry for players who want planning and unit movement more than reflex action.",
  "ps4-anarcute":
    "Anarcute is a bright crowd-action game from AnarTeam where players control a growing group through chaotic protest-style stages. Its appeal comes from scale, movement, environmental destruction, and playful presentation rather than one-character combat. The PS4 release belongs with offbeat indie action games that use a simple premise to create a distinct personality.",
  "ps4-ancestors-the-humankind-odyssey":
    "Ancestors: The Humankind Odyssey is Panache Digital Games' survival game about guiding a primate lineage through exploration, learning, danger, and generational progress. It is slower and more experimental than a standard survival-action game, asking players to observe, adapt, and expand abilities over time. On PS4, it is a notable Private Division release for players interested in unusual evolution-driven design.",
  "ps4-angerforce-reloaded":
    "AngerForce: Reloaded is a vertical shoot 'em up from Screambox Studio with arcade waves, bullet pressure, character upgrades, and score-focused replay. The PS4 version gives shooter fans a compact modern shmup with a clear pick-up-and-repeat structure. Its value is in patterns, weapon feel, and character-specific runs rather than campaign length.",
  "ps4-anima-gate-of-memories-the-nameless-chronicles":
    "Anima: Gate of Memories - The Nameless Chronicles is an action RPG spin-off from Anima Project, focused on real-time combat, fantasy environments, boss encounters, and character progression. It works best for players already interested in the Anima setting or in smaller 3D action RPGs outside the largest publisher franchises. On GCX, it should be listed as a niche sequel-side entry, not a generic RPG.",
  "ps4-anime-studio-story":
    "Anime Studio Story is a Kairosoft management simulation about building an animation studio, hiring staff, creating projects, and gradually improving the business. Like many Kairosoft console ports, its appeal is incremental progress, compact menus, and cozy management loops. It belongs in the PS4 library as a light sim for players who enjoy business growth rather than action or narrative drama.",
  "ps4-ankora-lost-days":
    "Ankora: Lost Days is a Chibig adventure-survival game about exploring an unfamiliar planet, gathering resources, crafting tools, and helping its young protagonist endure the environment. The PS4 version fits beside softer survival adventures where discovery and routine matter more than punishing combat. It is especially relevant for players following Chibig's connected cozy-adventure catalog.",
  "ps4-anoko-wa-ore-kara-hanarenai":
    "Anoko wa Ore kara Hanarenai is a Japanese visual novel from Giga and Technical Group Laboratory, built around character routes, dialogue, and romance-story progression. Its PS4 listing is mainly important for import and visual-novel collectors, where the value is format, publisher history, and route structure. It should be framed as a story-first release rather than a gameplay-led adventure.",
  "ps4-antiquia-lost":
    "Antiquia Lost is a Kemco-published RPG from Exe Create, aimed at players who want traditional party progression, quests, turn-based-style pacing, and approachable fantasy structure. The PS4 release represents Kemco's steady flow of budget-friendly console RPGs. GCX should describe it as a compact genre entry for JRPG collectors and comfort-food RPG fans, not as a major blockbuster-scale role-playing game.",
  "ps4-aqua-moto-racing-utopia":
    "Aqua Moto Racing Utopia is Zordix's personal-watercraft racing game, focused on water handling, course mastery, stunts, and event competition. It fills a specific racing niche on PS4: jet-ski style arcade racing rather than cars, bikes, or simulation circuits. That makes it useful for readers browsing unusual sports and racing options in the console's digital library.",
  "ps4-arc-of-alchemist":
    "Arc of Alchemist is a Compile Heart action RPG from Idea Factory, built around party-based desert exploration, real-time encounters, and a smaller-scale anime RPG presentation. It is most relevant to players who follow Idea Factory and Compile Heart's console output. On GCX, it should be positioned as a niche action RPG for genre collectors rather than a broad open-world adventure.",
  "ps4-arcade-archives-a-jax":
    "Arcade Archives: A-Jax brings Konami's arcade scrolling shooter to PS4 through Hamster's preservation series. The appeal is not a modern remake; it is access to the original arcade-style challenge with display, control, and score options typical of Arcade Archives releases. For collectors, the key value is Konami arcade preservation within the PS4 digital library.",
  "ps4-arcade-archives-alpine-ski":
    "Arcade Archives: Alpine Ski preserves Taito's early skiing arcade game on PS4, making it a historical sports-action release rather than a modern winter-sports sim. Players should expect simple arcade rules, timing, course hazards, and score-chasing structure. Its GCX value is strongest for Arcade Archives followers and collectors interested in Taito's early arcade catalog.",
  "ps4-arcade-archives-aqua-jet":
    "Arcade Archives: Aqua Jet brings Namco's arcade watercraft racing game to PS4, preserving its checkpoint racing, arcade handling, and time-attack structure. It is best understood as a museum-style digital rerelease, not a contemporary racing package. For collectors, it adds another Namco arcade title to Hamster's long-running preservation line.",
  "ps4-arcade-archives-armed-f":
    "Arcade Archives: Armed F preserves Nichibutsu's shooter Formation Armed F on PS4, giving players a direct way to experience its arcade-style enemy waves, weapon pressure, and score-focused pacing. The listing matters because Arcade Archives titles are about access and preservation. GCX should emphasize its Nichibutsu shooter history and Hamster release context.",
  "ps4-arcade-archives-assault-plus":
    "Arcade Archives: Assault Plus brings Namco's multi-directional tank shooter to PS4 through Hamster's arcade-preservation format. The hook is strategic movement and aiming under arcade pressure, with the PS4 release offering modern access to the original game's score-chasing structure. It belongs in the library as a Namco arcade entry rather than a new twin-stick shooter.",
  "ps4-arcade-archives-black-heart":
    "Arcade Archives: Black Heart preserves UPL's fantasy-themed arcade shooter on PS4, keeping the focus on scrolling stages, enemy patterns, and old-school score play. Its value is strongest for shooter collectors and Arcade Archives completists who want access to less mainstream arcade releases. GCX should present it as preservation-first, with appeal tied to UPL's catalog.",
  "ps4-arcade-archives-blast-off":
    "Arcade Archives: Blast Off brings Namco's arcade shooter to PS4 as part of Hamster's preservation series. The experience is built around original arcade pacing, waves, power-ups, and score pursuit rather than new campaign content. For GCX readers, the important context is its Namco lineage and its place in the growing Arcade Archives shooter catalog.",
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
