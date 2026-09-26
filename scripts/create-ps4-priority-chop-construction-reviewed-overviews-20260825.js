const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(rootDir, "data", "games", "reviewed-overview-imports", "ps4-priority-chop-construction-reviewed-overviews-2026-08-25.csv");

const reviewedOverviews = {
  "ps4-chop-is-dish":
    "Chop is Dish is a compact side-scrolling action platformer about fighting through food-themed stages with simple melee combat and arcade pacing. The PS4 release is a small indie catalog entry, best suited to players who like direct movement, short levels, and straightforward enemy-clearing challenge.",
  "ps4-chorus-rise-as-one":
    "Chorus: Rise As One is Fishlabs' space-combat adventure, centered on high-speed starfighter movement, dogfighting, and supernatural abilities tied to pilot Nara and her sentient ship. On PS4, its appeal comes from agile flight, weapon swapping, and a darker sci-fi campaign structure.",
  "ps4-circuits":
    "Circuits is a minimalist music puzzle game where players reconstruct songs by arranging audio fragments in the correct order. The PS4 version is not a traditional tile puzzle; its hook is listening carefully, recognizing patterns, and solving each track through sound.",
  "ps4-citadel-forged-with-fire":
    "Citadel: Forged with Fire is a fantasy sandbox survival game built around magic, crafting, base building, creature taming, and online-world progression. The PS4 release is for players who want a spellcasting survival loop rather than a linear RPG campaign.",
  "ps4-citizens-of-space":
    "Citizens of Space is a comic sci-fi RPG from Eden Industries and Sega about recruiting citizens across the galaxy after Earth goes missing. It mixes turn-based encounters, oddball party members, and light political satire, making it a quirky companion to Citizens of Earth.",
  "ps4-city-limits":
    "City Limits is a small strategy puzzle game about placing city tiles, managing adjacency, and building efficient urban patterns within tight constraints. On PS4 it works as a calm score-and-optimization game, closer to a compact board-game puzzle than a sprawling city builder.",
  "ps4-claire-extended-cut":
    "Claire: Extended Cut is a 2D psychological horror adventure about exploring distorted locations, solving light puzzles, and surviving a hostile atmosphere. The PS4 version emphasizes dread, story fragments, and resource pressure more than action-heavy combat.",
  "ps4-claybook":
    "Claybook is a physics-driven puzzle game where every object looks and behaves like malleable clay. Players reshape levels, roll or morph through challenges, and experiment with soft-body interactions, giving the PS4 release a distinct tactile identity among puzzle games.",
  "ps4-clid-the-snail":
    "Clid the Snail is a top-down shooter starring an outcast snail in a grim miniature world. Weird Beluga's PS4 release focuses on twin-stick combat, weapon selection, environmental hazards, and an unusually moody insect-scale setting rather than arcade spectacle alone.",
  "ps4-clockwork-tales-of-glass-and-ink":
    "Clockwork Tales: Of Glass and Ink is an Artifex Mundi hidden-object adventure with a steampunk mystery frame. Players search scenes, solve inventory puzzles, and move through a story-led investigation, making it a good fit for casual adventure fans on PS4.",
  "ps4-cobra-kai-the-karate-kid-saga-continues":
    "Cobra Kai: The Karate Kid Saga Continues adapts the Netflix series into a side-scrolling beat 'em up with playable dojo rosters, combo attacks, and character progression. Its PS4 value is mainly franchise-driven: a brawler for Cobra Kai and Karate Kid fans.",
  "ps4-coffin-dodgers":
    "Coffin Dodgers is a dark-comedy kart racer where elderly competitors race mobility scooters against Death through a retirement village. The PS4 release is rough-edged but memorable as a novelty racing title built around weapons, oddball tracks, and macabre humor.",
  "ps4-cogen-sword-of-rewind":
    "Cogen: Sword of Rewind is a precision action platformer built around a short rewind ability that lets players reverse fatal mistakes. Gemdrops uses that mechanic for quick combat, trap-heavy stages, and boss encounters where timing matters more than exploration.",
  "ps4-colt-canyon":
    "Colt Canyon is a pixel-art roguelite shooter set in a hostile western canyon. Players rescue a captured partner while improvising with guns, stealth, melee attacks, and scarce resources, giving the PS4 version a tense run-based rhythm.",
  "ps4-comet-crash-2":
    "Comet Crash 2 is a real-time strategy and tower-defense hybrid about building defenses, launching unit waves, and fighting over lanes on alien battlefields. The PS4 release rewards quick tactical decisions, resource timing, and pressure management rather than passive defense.",
  "ps4-commander-cherry-s-puzzled-journey":
    "Commander Cherry's Puzzled Journey is a PlayStation Camera-assisted platform puzzle game where players use body poses to create platforms. Its PS4 identity comes from that unusual physical input gimmick, making it a curiosity for collectors tracking camera-era experiments.",
  "ps4-concept-destruction":
    "Concept Destruction is a vehicular combat game where cardboard-style concept cars smash into each other in small arenas. The PS4 release is simple and deliberately toy-like, with its appeal coming from quick demolition rounds, unlockable vehicles, and budget arcade chaos.",
  "ps4-conga-master":
    "Conga Master is an arcade party game about weaving through crowds and growing the longest conga line possible. Undercoders turns movement, timing, and route reading into a goofy dance-floor score chase, making the PS4 release a light local-party pick.",
  "ps4-construction-simulator-2-console-edition":
    "Construction Simulator 2: Console Edition brings job-based construction work to PS4, with licensed machinery, contracts, roadwork, and business growth. It is about operating heavy equipment carefully and building a contractor career, not fast action or open-ended city building.",
  "ps4-construction-simulator-3-console-edition":
    "Construction Simulator 3: Console Edition continues Astragon's machinery-focused sim with European-inspired jobs, vehicle operation, and company progression. On PS4, it gives simulation fans another methodical heavy-equipment loop built around contracts, handling, and project completion.",
};

const headers = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = Object.entries(reviewedOverviews).map(([gameId, newOverview]) => {
    const game = byId.get(gameId);
    if (!game) throw new Error(`Missing PS4 game ${gameId}`);
    return {
      platformSlug: "ps4",
      gameId,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: game.articleUrl || game.descriptionSourceUrl || game.sourceUrl || "",
      rewriteNotes: "Priority PS4 weak-template cleanup; original GCX editorial overview based on available platform, genre, publisher, developer, release, and source-page context.",
      newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX editorial cleanup",
    };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );
  console.log(JSON.stringify({ ok: true, outputPath: path.relative(rootDir, outputPath), rows: rows.length }, null, 2));
}

main();
