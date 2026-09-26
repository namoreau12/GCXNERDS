const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-bibi-birdmania-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "3ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "3ds",
    gameId: "3ds-bibi-and-tina",
    title: "Bibi & Tina",
    sourceUrl: "https://generation-nintendo.com/jeux/16774-bibi-tina/",
    newOverview:
      "Bibi & Tina is a German-market 3DS adventure based on the Bibi & Tina film and children's media series. Players ride around the Martinshof and Falkenstein setting, train horses, complete missions, and prepare for a major race rather than playing a pure action or puzzle game. For GCX, it should be framed as a licensed horse-riding adventure for younger fans, with collector interest tied to its regional focus and Kiddinx branding.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bibi-blocksberg-das-gro-e-hexenbesen-rennen-2",
    title: "Bibi Blocksberg - Das große Hexenbesen-Rennen 2",
    sourceUrl: "https://www.kiddinx-shop.de/bibi-blocksberg-das-grosse-hexenbesen-rennen-2-3ds-version.html",
    newOverview:
      "Bibi Blocksberg - Das grosse Hexenbesen-Rennen 2 is a family-focused broom-racing game built around the German young witch character Bibi Blocksberg. The 3DS version offers 12 tracks across three worlds, normal and mirrored course variants, eight characters, eight brooms with different handling, multiple camera perspectives, and magic-potion items. It belongs in the library as a regional licensed racer, not as a story-heavy adventure.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-big-bass-arcade-no-limit",
    title: "Big Bass Arcade: No Limit",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Big-Bass-Arcade-No-Limit-1409420.html",
    newOverview:
      "Big Bass Arcade: No Limit is a 3DS fishing game built for quick arcade-style casting rather than a full outdoor simulation. Nintendo's listing points to seven fish species, ten lakes, nine lures, 32 multi-lake tournaments, 50 challenges, free fishing, and tracked high scores or achievements. Its appeal is the checklist of fish, lures, records, and tournament goals, giving handheld sports fans a compact fishing loop with enough modes to revisit.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-big-hero-6-battle-in-the-bay",
    title: "Big Hero 6: Battle in the Bay",
    sourceUrl: "https://www.nintendolife.com/reviews/3ds/big_hero_6_battle_in_the_bay",
    newOverview:
      "Big Hero 6: Battle in the Bay is a side-scrolling action platformer set after Disney's film, sending Hiro and the team against another wave of bot threats in San Fransokyo. The 3DS version mixes beat-'em-up combat, light platforming, simple object collection, and character-specific abilities, with Baymax and Honey Lemon functioning more as support than full playable leads. It is best cataloged as a licensed movie tie-in built for accessible action rather than deep strategy.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bike-rider-dx",
    title: "Bike Rider DX",
    sourceUrl: "https://nintendoeverything.com/review-bike-rider-dx-3ds/",
    newOverview:
      "Bike Rider DX is a simple but demanding auto-scrolling 2D bike platformer from Spicysoft. The rider moves forward automatically, leaving players to time jumps, double jumps, and longer leap chains over gaps, platforms, and hazards. Its appeal is not complex controls; it is the rhythm of one-button movement, world-hopping stages, upbeat music, and repeated attempts to clear routes cleanly enough for medals or better scores.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bike-rider-dx2-galaxy",
    title: "Bike Rider DX2: Galaxy",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/BIKE-RIDER-DX2-GALAXY-1033003.html",
    newOverview:
      "Bike Rider DX2: Galaxy expands Spicysoft's one-button bike-platforming formula into a space-themed Galaxy Tour across 12 zodiac-inspired planets. Stages keep the automatic forward movement and jump timing of the first game but add more traps, gimmicks, power-ups, and Grand Prix structure. It should be described as a compact arcade platformer sequel where replay value comes from learning each course's timing and collecting stage coins.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bikkuri-tobidasu-mahou-no-pen",
    title: "Bikkuri! Tobidasu! Mahou no Pen",
    sourceUrl: "https://www.nintendoworldreport.com/game/26349/bikkuri-tobidasu-mahou-no-pen-nintendo-3ds",
    newOverview:
      "Bikkuri! Tobidasu! Mahou no Pen is a Japan-only 3DS adventure from GAE, released early in the system's life. Public English-language detail is limited, so GCX should keep the description conservative: it is an adventure title built around a magic-pen premise, all-ages positioning, and 3DS presentation rather than a globally familiar franchise hook. Its main collector value is as a regional Japanese launch-window curiosity from a smaller publisher.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bikkuriman-kanjuku-haoh-sanmi-douran-sensouki",
    title: "Bikkuriman Kanjuku Haoh: Sanmi Douran Sensouki",
    sourceUrl: "https://www.honestgamers.com/52585/3ds/bikkuriman-kanjuku-haoh-sanmi-douran-sensouki/game.html",
    newOverview:
      "Bikkuriman Kanjuku Haoh: Sanmi Douran Sensouki is a Japan-only 3DS release from Nippon Ichi Software tied to the long-running Bikkuriman sticker and character brand. English source coverage is thin, but catalog listings identify it as a general/educational-style entry rather than a standard action RPG. GCX should present it as a regional character-license title whose appeal is mainly to Japanese 3DS collectors and Bikkuriman fans.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bingo-collection",
    title: "Bingo Collection",
    sourceUrl: "https://kotaku.com/games/bingo-collection",
    newOverview:
      "Bingo Collection is a 3DS package of three games based on the familiar number-calling card game. The core loop is casual and readable: watch the called numbers, mark matching squares, chase rows or card patterns, and react quickly enough to avoid turning a lucky draw into a missed opportunity. Because the package comes from SIMS and Starsign with limited English coverage, GCX should frame it as a small casual bingo collection for short sessions and full-library collectors rather than a story-driven or casino-style release.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bird-mania-3d",
    title: "Bird Mania 3D",
    sourceUrl: "https://www.cubed3.com/games/reviews/nintendo-3ds/bird-mania-3d",
    newOverview:
      "Bird Mania 3D is Teyon's fast, score-driven 3DS eShop action game about guiding the small bird Mojo as he tries to catch up with his flock. The player continuously flies to the right, collecting stars, dodging trees and other hazards, and attacking enemies for bonus points. It is a pure short-session reflex game: colorful, simple to understand, and built around leaderboard chasing rather than levels full of exploration.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing 3DS game record for ${gameId}`);
  return game.description || game.gcxOverview || game.overview || "";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const header = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];
const csv = [
  header.join(","),
  ...rows.map((row) =>
    [
      row.platformSlug,
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority 3DS weak-template replacement with source-backed GCX editorial overview.",
      row.newOverview,
      "approved",
      "GCX Editorial",
    ]
      .map(csvCell)
      .join(",")
  ),
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rowCount: rows.length }, null, 2));
