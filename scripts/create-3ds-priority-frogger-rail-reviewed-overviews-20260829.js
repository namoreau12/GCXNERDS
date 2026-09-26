const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-frogger-rail-reviewed-overviews-2026-08-29.csv"
);

const rows = [
  {
    gameId: "3ds-frogger-3d",
    newOverview:
      "Frogger 3D updates Konami's road-and-river arcade formula for Nintendo 3DS with staged hazards, depth effects, and quick level attempts built around timing rather than speed alone. It is a compact action-puzzle entry where the appeal is navigating traffic, water, moving platforms, and enemy patterns in short portable bursts.",
  },
  {
    gameId: "3ds-hero-bank",
    newOverview:
      "Hero Bank is a Sega RPG about children entering televised money battles, mixing turn-based combat with costume-like hero gear and a knowingly exaggerated finance theme. The game leans on story scenes, character growth, and strategic fight choices, making it mainly useful to players comfortable with a Japanese 3DS import.",
  },
  {
    gameId: "3ds-hero-bank-2",
    newOverview:
      "Hero Bank 2 continues Sega's money-battle RPG idea with another character-driven campaign, more over-the-top hero business theatrics, and combat built around choosing attacks and gear. It is best read as a sequel for fans of the first game rather than a standalone global 3DS RPG release.",
  },
  {
    gameId: "3ds-inazuma-eleven-go-3-galaxy-big-bang",
    newOverview:
      "Inazuma Eleven GO 3: Galaxy - Big Bang sends Level-5's soccer RPG into a larger, stranger competition built around team building, story chapters, and stylized special moves. Big Bang is one half of a paired release, so players compare it by version-exclusive details, roster preferences, and language or region needs.",
  },
  {
    gameId: "3ds-inazuma-eleven-go-3-galaxy-supernova",
    newOverview:
      "Inazuma Eleven GO 3: Galaxy - Supernova is the companion version to Big Bang, keeping the same soccer-RPG structure while changing version-specific players and collection goals. It blends anime-style sports drama with RPG recruitment and tactical match commands, making exact version identity important.",
  },
  {
    gameId: "3ds-inazuma-eleven-go-chrono-stones-thunderflash",
    newOverview:
      "Inazuma Eleven GO Chrono Stones: Thunderflash pushes the series into time-travel soccer fantasy, pairing story-heavy RPG progression with team recruitment and dramatic on-field special moves. Thunderflash is one of two companion versions, so collectors and players should distinguish it from Wildfire before buying.",
  },
  {
    gameId: "3ds-inazuma-eleven-go-chrono-stones-wildfire",
    newOverview:
      "Inazuma Eleven GO Chrono Stones: Wildfire shares the time-travel sports-RPG campaign framework with Thunderflash while offering its own version identity and roster appeal. The experience is less a simple soccer sim than a character-collecting RPG where matches unfold through commands, positioning, and super techniques.",
  },
  {
    gameId: "3ds-inazuma-eleven-go-light",
    newOverview:
      "Inazuma Eleven GO: Light begins the GO branch of Level-5's soccer RPG series on 3DS, following a new generation through story chapters, school-team drama, recruitment, and stylized match play. Light is paired with Shadow, so version name, region, and language support are key distinctions.",
  },
  {
    gameId: "3ds-inazuma-eleven-go-shadow",
    newOverview:
      "Inazuma Eleven GO: Shadow is the companion version to Light, offering the same core blend of soccer matches, RPG progression, character recruitment, and anime sports storytelling. Its value comes from version-specific preferences and series continuity, especially for players building a complete Inazuma Eleven 3DS run.",
  },
  {
    gameId: "3ds-infinite-dunamis",
    newOverview:
      "Infinite Dunamis is a Kemco RPG on 3DS built around a classic party-adventure structure, turn-based battles, equipment growth, and a science-fantasy story involving android-like characters and ancient technology. It fits the handheld's digital RPG catalog as a traditional, menu-driven quest rather than an experimental action game.",
  },
  {
    gameId: "3ds-infinite-golf",
    newOverview:
      "Infinite Golf is a small 3DS golf game focused on simple shot control, repeatable holes, and quick-score chasing instead of a licensed tour presentation. Its appeal is direct portable play: line up the shot, manage power, and replay compact challenges without the larger structure of a full sports simulation.",
  },
  {
    gameId: "3ds-initial-d-perfect-shift-online",
    newOverview:
      "Initial D Perfect Shift Online turns the mountain-racing series into a timing-based 3DS experience built around gear changes, course rhythm, and licensed Initial D style. Because the game was designed around online service features, players should treat it differently from a standard offline racing cartridge.",
  },
  {
    gameId: "3ds-insect-planet-td",
    newOverview:
      "Insect Planet TD is a 3DS tower-defense game about holding back insect-like waves with placed defenses and stage-by-stage planning. It is a lightweight strategy entry where the main loop is choosing where to spend resources, reading enemy paths, and replaying maps for cleaner survival.",
  },
  {
    gameId: "3ds-iron-combat-war-in-the-air",
    newOverview:
      "Iron Combat: War in the Air is an aerial combat game where players pilot transforming craft through missions built around targeting, evasive movement, and arcade-style dogfighting. The 3DS version leans on short mission pacing and action spectacle rather than deep simulation controls.",
  },
  {
    gameId: "3ds-jack-and-jane-jungle-escape",
    newOverview:
      "Jack And Jane: Jungle Escape is a late 3DS eShop platformer centered on guiding two characters through hazard-filled jungle stages. It is a small-scale release with simple movement challenges and collectible-style progression, notable mainly for players exploring the quieter end of the handheld's digital catalog.",
  },
  {
    gameId: "3ds-jake-hunter-detective-story-ghost-of-the-dusk",
    newOverview:
      "Jake Hunter Detective Story: Ghost of the Dusk is a noir-styled detective adventure built around interviews, clue gathering, scene investigation, and moody casework. It is text-forward and atmosphere-driven, so its appeal comes from mystery pacing and character writing rather than action or puzzle reflexes.",
  },
  {
    gameId: "3ds-japanese-rail-sim-3d-5-types-of-trains",
    newOverview:
      "Japanese Rail Sim 3D: 5 Types of Trains is a rail-driving simulation that emphasizes route familiarity, braking, speed control, and the sensation of operating real Japanese train lines in stereoscopic 3D. It is for transportation-sim fans who enjoy careful operation more than arcade racing.",
  },
  {
    gameId: "3ds-japanese-rail-sim-3d-journey-in-suburbs-1",
    newOverview:
      "Japanese Rail Sim 3D: Journey in Suburbs #1 focuses on commuter-style train operation, asking players to manage stops, timing, braking, and smooth travel along suburban routes. The game is intentionally methodical, appealing to players who want a compact handheld version of route-based rail simulation.",
  },
  {
    gameId: "3ds-japanese-rail-sim-3d-journey-in-suburbs-1-vol-2",
    newOverview:
      "Japanese Rail Sim 3D: Journey in Suburbs #1 Vol. 2 continues the suburban rail-sim format with another route-focused package of measured driving, station stops, and speed discipline. It should be understood as an additional volume for fans of the same simulation style rather than a genre shift.",
  },
  {
    gameId: "3ds-japanese-rail-sim-3d-journey-in-suburbs-1-vol-3",
    newOverview:
      "Japanese Rail Sim 3D: Journey in Suburbs #1 Vol. 3 adds more of Sonic Powered's careful commuter-train operation to the 3DS library, with play built around timing, braking, and route observation. Its appeal is narrow but clear: relaxed, realistic rail operation in short portable sessions.",
  },
];

const batchPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "3ds-overview-rewrite-batch.csv");
const batch = fs.readFileSync(batchPath, "utf8");

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

const lines = batch.split(/\r?\n/).filter(Boolean);
const headers = parseLine(lines[0]);
const byId = new Map();
lines.slice(1).forEach((line) => {
  const values = parseLine(line);
  const record = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  byId.set(record.gameId, record);
});

const outputRows = rows.map((row) => {
  const record = byId.get(row.gameId);
  if (!record) throw new Error(`Missing ${row.gameId} in 3DS overview batch`);
  return {
    ...record,
    rewriteNotes: "GCX reviewed pass: replaced metadata template with specific gameplay, story, version, or catalog context.",
    newOverview: row.newOverview,
    reviewStatus: "approved",
    reviewer: "GCX",
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  `${headers.join(",")}\n${outputRows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
  "utf8"
);

console.log(`Wrote ${outputRows.length} reviewed 3DS overview rows to ${path.relative(rootDir, outputPath)}`);
