const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "switch-priority-ambitious-apex-reviewed-overviews-2026-08-29.csv"
);

const rows = [
  {
    gameId: "switch-ambitious-mission",
    newOverview:
      "Ambitious Mission is a Japanese visual novel from Saga Planets centered on Phantom Thief-style romantic comedy, school-life character routes, and mystery plotting rather than action systems. The Switch release is mainly for readers who want a portable version of the story, so listings should make the language, region, and any limited-edition extras clear.",
  },
  {
    gameId: "switch-american-ninja-warrior-challenge",
    newOverview:
      "American Ninja Warrior: Challenge turns the television obstacle-course format into a timing and reflex game where players sprint, swing, climb, balance, and build a contestant through career-style events. It is best understood as a licensed party/sports title, with value tied to physical condition, region, and whether the buyer wants a family-friendly TV tie-in.",
  },
  {
    gameId: "switch-amnesia",
    newOverview:
      "Amnesia is an otome visual novel about an amnesiac heroine piecing together her identity through separate romance routes, each with its own tone, relationship tension, and bad-ending risks. On Switch, the draw is portable route reading and choice tracking, so collectors should confirm region, subtitle language, and whether the listing is a standalone release or part of a bundle.",
  },
  {
    gameId: "switch-amnesia-world",
    newOverview:
      "Amnesia World is a fan-disc-style follow-up that remixes the Amnesia cast through alternate story setups, mini scenarios, and extra route material for returning players. It is not the best starting point for newcomers, but it matters to otome collectors who want the companion release alongside the main Amnesia titles.",
  },
  {
    gameId: "switch-angelian-trigger",
    newOverview:
      "Angelian Trigger is a modern pixel-art action game with arcade-style shooting, boss encounters, and a deliberately retro presentation. Its appeal is direct, score-minded play rather than a large RPG structure, so listings should call out region, physical-versus-digital format, and any soundtrack or bonus-packaging extras.",
  },
  {
    gameId: "switch-angelique-luminarise",
    newOverview:
      "Angelique Luminarise revives Koei Tecmo's long-running romance simulation series with schedule management, conversation choices, guardian relationships, and kingdom-building pressure layered around its otome cast. The Switch version is notable for fans of Ruby Party's character-driven design, especially import collectors watching language and edition details.",
  },
  {
    gameId: "switch-angerforce-reloaded",
    newOverview:
      "AngerForce: Reloaded is a vertical shoot-'em-up built around dense bullet patterns, multiple pilots, upgrade choices, and repeated runs through a dieselpunk world. It plays like a compact arcade challenge on Switch, with replay value coming from score chasing, character mastery, and learning how each stage escalates.",
  },
  {
    gameId: "switch-animal-up",
    newOverview:
      "Animal Up! is a small physics-platform game about launching animals upward through hazards and unstable objects while chasing quick retries. It is closer to a lightweight score-and-challenge download than a traditional adventure, so its place in the Switch library is as a simple party-friendly dexterity game.",
  },
  {
    gameId: "switch-animals-for-toddlers",
    newOverview:
      "Animals for Toddlers is an early-learning release focused on animal recognition, simple interactions, and low-pressure play for very young children. It is not aimed at core collectors or competitive players; its usefulness comes from age-appropriate presentation, clear touch/controller input, and family-library context.",
  },
  {
    gameId: "switch-animus-stand-alone",
    newOverview:
      "Animus: Stand Alone brings a compact dark-fantasy action RPG to Switch, emphasizing deliberate melee combat, stamina management, boss learning, and equipment upgrades. It has a smaller scope than the genre's biggest names, but the hook is portable, encounter-driven action with a grim tone and repeatable challenge.",
  },
  {
    gameId: "switch-ano-subarashii-o-mouichido-saisouban-hd",
    newOverview:
      "Ano, Subarashii o Mouichido/Saisouban HD is a remastered Japanese adventure/visual novel release known for its unusual narrative structure and text-heavy mystery presentation. On Switch it is primarily an import-reader title, so language support, region, and whether the copy includes any first-print material matter more than broad action-game appeal.",
  },
  {
    gameId: "switch-another-lost-phone-laura-s-story",
    newOverview:
      "Another Lost Phone: Laura's Story is an investigative narrative game played through the interface of a recovered smartphone. Players read messages, photos, apps, and personal traces to understand Laura's life, making it a short, intimate mystery where the puzzle solving is inseparable from social observation.",
  },
  {
    gameId: "switch-anpanman-touch-de-enjoy-aiueo-kyoushitsu",
    newOverview:
      "Anpanman Touch de Enjoy! AIUEO Kyoushitsu is a Japan-focused educational game built around Anpanman characters and early kana/language learning activities. Its audience is young children and families, with collector interest mostly tied to character-brand appeal, Japanese-language content, and complete physical packaging.",
  },
  {
    gameId: "switch-aoi-shiro-hd-remaster",
    newOverview:
      "Aoi Shiro HD Remaster updates Success Corporation's supernatural visual novel about students, folklore, and branching mystery routes around an isolated coastal setting. The Switch version is for players who want a polished portable edition of a cult yuri-leaning adventure, where route structure and language support are the key details.",
  },
  {
    gameId: "switch-aokana-four-rhythm-across-the-blue",
    newOverview:
      "Aokana: Four Rhythm Across the Blue mixes visual-novel romance with a fictional anti-gravity sport called Flying Circus, using route choices and character drama to build around competition, training, and school-life relationships. On Switch, it stands out because the sports premise gives its romance routes a sharper identity than a plain slice-of-life setup.",
  },
  {
    gameId: "switch-aokana-four-rhythm-across-the-blue-extra1s",
    newOverview:
      "Aokana: Four Rhythm Across the Blue EXTRA1S is a focused companion story for fans who already know the main game, expanding one character route rather than retelling the full Flying Circus setup. It is best listed as supplemental Aokana material, with buyers needing clear region, language, and edition information.",
  },
  {
    gameId: "switch-aokana-four-rhythm-across-the-blue-extra2s",
    newOverview:
      "Aokana: Four Rhythm Across the Blue EXTRA2S is another route-focused follow-up that deepens the original game's romance and Flying Circus world for returning readers. It works as collector-facing companion content, not a broad standalone entry, so series context and version details should be obvious in any listing.",
  },
  {
    gameId: "switch-aonatsu-line",
    newOverview:
      "Aonatsu Line is a summer-themed visual novel about friendship, romance, and youth-drama choices, built for readers who want character scenes and branching emotional payoffs over mechanical challenge. On Switch it sits in the import visual-novel lane, where language support, publisher, and edition are the most important marketplace signals.",
  },
  {
    gameId: "switch-apathy-narugami-gakuen-nana-fushigi",
    newOverview:
      "Apathy: Narugami Gakuen Nana Fushigi is a horror adventure/visual novel built around school urban legends, unsettling stories, and branching narrative routes. Its appeal is atmosphere and text-driven suspense rather than combat, making it a niche but distinct Switch release for Japanese horror and adventure collectors.",
  },
  {
    gameId: "switch-apex-legends",
    newOverview:
      "Apex Legends is Respawn's squad-based battle royale, built around three-player teams, hero abilities, fast movement, tactical respawns, and seasonal live-service updates. The Switch version makes the game portable but remains online-only, so players and collectors should understand that the experience depends on current servers, downloads, and account access.",
  },
];

const batchPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "switch-overview-rewrite-batch.csv");
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

const outputHeaders = [...headers];
const outputRows = rows.map((row) => {
  const record = byId.get(row.gameId);
  if (!record) throw new Error(`Missing ${row.gameId} in switch overview batch`);
  return {
    ...record,
    rewriteNotes: "GCX reviewed pass: replaced metadata template with specific gameplay/story context and marketplace-relevant version notes.",
    newOverview: row.newOverview,
    reviewStatus: "approved",
    reviewer: "GCX",
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  `${outputHeaders.join(",")}\n${outputRows
    .map((row) => outputHeaders.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`,
  "utf8"
);

console.log(`Wrote ${outputRows.length} reviewed Switch overview rows to ${path.relative(rootDir, outputPath)}`);
