const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-rail-johnny-reviewed-overviews-2026-08-29.csv"
);

const rows = [
  {
    gameId: "3ds-japanese-rail-sim-3d-journey-in-suburbs-1-vol-4",
    newOverview:
      "Japanese Rail Sim 3D: Journey in Suburbs #1 Vol. 4 continues Sonic Powered's commuter-train simulation series with another route-focused 3DS release. Play centers on careful acceleration, braking, station arrival, and scenery observation, making it a calm specialty title for rail fans rather than a broad action game.",
  },
  {
    gameId: "3ds-japanese-rail-sim-3d-journey-in-suburbs-2",
    newOverview:
      "Japanese Rail Sim 3D: Journey in Suburbs #2 is a route-based train simulation built around measured driving, stop accuracy, and the everyday rhythm of Japanese suburban lines. It is best understood as a documentary-flavored operations game, where patience and precision matter more than competition.",
  },
  {
    gameId: "3ds-japanese-rail-sim-3d-journey-to-kyoto",
    newOverview:
      "Japanese Rail Sim 3D: Journey to Kyoto uses the 3DS as a compact rail-cab simulator, emphasizing scenic route travel, station timing, and smooth train handling. The Kyoto setting gives this entry a stronger sightseeing identity while preserving the series' slow, procedural driving focus.",
  },
  {
    gameId: "3ds-japanese-rail-sim-3d-monorail-trip-to-okinawa",
    newOverview:
      "Japanese Rail Sim 3D: Monorail Trip to Okinawa shifts the series to monorail operation, with play built around controlled speed, braking points, and views of a distinctive Japanese transit route. It is a niche simulation release whose appeal comes from place, route detail, and relaxed precision.",
  },
  {
    gameId: "3ds-japanese-rail-sim-3d-travel-of-steam",
    newOverview:
      "Japanese Rail Sim 3D: Travel of Steam gives the 3DS rail-sim formula a steam-train focus, changing the flavor from modern commuter service to heritage-style railway travel. Players still manage speed and stops carefully, but the draw is the older locomotive atmosphere and scenic route pacing.",
  },
  {
    gameId: "3ds-jaws-ultimate-predator",
    newOverview:
      "Jaws: Ultimate Predator puts players in control of the shark across mission-based attacks on boats, divers, sea life, and coastal targets. The 3DS version is an arcade-style licensed action game, trading horror suspense for aggressive movement, chomping attacks, and short objective-driven stages.",
  },
  {
    gameId: "3ds-jet-dog",
    newOverview:
      "Jet Dog is a small 3DS platform/action release built around a dog character, simple obstacle navigation, and quick handheld challenges. It sits in the budget digital side of the catalog, where the value is straightforward pick-up-and-play movement rather than deep story or elaborate systems.",
  },
  {
    gameId: "3ds-jewel-link-double-pack-safari-quest-and-atlantic-quest",
    newOverview:
      "Jewel Link Double Pack: Safari Quest and Atlantic Quest bundles two casual puzzle adventures on one 3DS release. The package is aimed at players who want relaxed matching, hidden-object, or light quest progression, so the key appeal is variety and value rather than a single premium puzzle campaign.",
  },
  {
    gameId: "3ds-jewel-master-atlantis-3d",
    newOverview:
      "Jewel Master Atlantis 3D brings Cerasus Media's match-three puzzle formula to 3DS with an underwater/ancient-city theme and stereoscopic presentation. Players clear jewel boards, chase objectives, and move through themed stages, making it a comfort-food puzzle release for short sessions.",
  },
  {
    gameId: "3ds-jewel-master-cradle-of-egypt-2-3d",
    newOverview:
      "Jewel Master: Cradle of Egypt 2 3D combines match-three board clearing with a city-building wrapper inspired by ancient Egypt. Each puzzle feeds broader progression, giving the game more structure than a bare jewel-matching mode while still staying firmly in casual puzzle territory.",
  },
  {
    gameId: "3ds-jewel-master-cradle-of-rome-2-3d",
    newOverview:
      "Jewel Master: Cradle of Rome 2 3D uses match-three puzzles to gradually build out an ancient Rome-themed progression screen. The hook is not twitch skill but steady board solving, resource rewards, and the satisfaction of unlocking more landmarks between puzzle rounds.",
  },
  {
    gameId: "3ds-jewel-match-3",
    newOverview:
      "Jewel Match 3 is a casual 3DS puzzle game focused on clearing gem boards, meeting stage goals, and working through a large set of relaxed challenges. Its appeal is familiar matching play with gradual difficulty rather than a licensed cast or a story-heavy adventure.",
  },
  {
    gameId: "3ds-jewel-quest-4-heritage",
    newOverview:
      "Jewel Quest 4 Heritage continues the long-running jewel-matching adventure series with board objectives wrapped in a family-history mystery theme. It is suited to players who like match-three structure with light narrative context, map progression, and a large number of compact puzzle stages.",
  },
  {
    gameId: "3ds-jewel-quest-mysteries-3-the-seventh-gate",
    newOverview:
      "Jewel Quest Mysteries 3: The Seventh Gate mixes Jewel Quest's puzzle identity with hidden-object adventure scenes and mystery progression. The 3DS release is less about pure gem swapping alone and more about moving through locations, finding objects, and solving casual adventure tasks.",
  },
  {
    gameId: "3ds-jewel-quest-the-sapphire-dragon",
    newOverview:
      "Jewel Quest: The Sapphire Dragon frames its casual puzzle play around a treasure-hunt adventure, combining matching boards with light story movement and themed objectives. It is a good fit for players who want gentle puzzle progression and portable sessions rather than competitive scoring depth.",
  },
  {
    gameId: "3ds-jewelpet-cooking-at-the-magical-cafe",
    newOverview:
      "Jewelpet: Cooking at the Magical Cafe! is a character-focused 3DS release built around the Sanrio/Sega Jewelpet brand, cafe tasks, and gentle minigame-style play. It is aimed at younger fans and collectors of the property, with charm and license appeal carrying more weight than challenge.",
  },
  {
    gameId: "3ds-jewelpet-magical-rhythm-yay",
    newOverview:
      "Jewelpet: Magical Rhythm Yay! turns the Jewelpet cast into a rhythm-game setting, asking players to follow timing prompts and songs with a light character-brand presentation. It belongs to the gentler side of the 3DS rhythm library, where approachable timing and franchise charm are the point.",
  },
  {
    gameId: "3ds-jikkyou-powerful-pro-yakyuu-heroes",
    newOverview:
      "Jikkyou Powerful Pro Yakyuu Heroes brings Konami's super-deformed baseball series to 3DS with team building, batting and pitching systems, and a heroes-focused structure. It is a Japanese baseball release where series familiarity, roster expectations, and language comfort shape the experience.",
  },
  {
    gameId: "3ds-johnny-dynamite",
    newOverview:
      "Johnny Dynamite is a compact 3DS action game from TwoFiveSix built around old-school stage hazards, enemy patterns, and direct movement challenges. It has the feel of a small downloadable arcade throwback, useful for players browsing lesser-known action releases in the handheld catalog.",
  },
  {
    gameId: "3ds-johnny-hotshot",
    newOverview:
      "Johnny Hotshot is a 3DS minigame/action collection starring a western-themed hero across quick target-shooting and reflex challenges. The release is straightforward and score-minded, built for short sessions rather than a large campaign, with its appeal resting on simple arcade novelty.",
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
    rewriteNotes: "GCX reviewed pass: replaced metadata template with title-specific gameplay, theme, and audience context.",
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
