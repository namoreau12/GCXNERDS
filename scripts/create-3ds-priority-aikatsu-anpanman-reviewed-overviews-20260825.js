const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "3ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-aikatsu-anpanman-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority 3DS weak-template cleanup; original GCX editorial overview based on Nintendo eShop pages, publisher pages, specialist databases, reviews, and series documentation.";

const entries = [
  {
    id: "3ds-aikatsu-365-hi-no-idol-days",
    sourceUrl: "https://backloggd.com/games/aikatsu-365-idol-days/",
    overview:
      "Aikatsu! 365-Hi no Idol Days is the third Nintendo 3DS game tied to Bandai's Aikatsu idol/card franchise. Rather than playing like a generic RPG, it leans into the series' real-idol-adventure hook: coordinating fashion, working through idol-life events, and chasing auditions inside the Data Carddass-inspired Aikatsu world. For import collectors, its value is in being a 2014 Japan-only bridge between the arcade card game and handheld idol simulation.",
  },
  {
    id: "3ds-aikatsu-cinderella-lesson",
    sourceUrl: "https://www.play-asia.com/en/aikatsu-cinderella-lesson/13/7059b5",
    overview:
      "Aikatsu! Cinderella Lesson is the first 3DS Aikatsu title, built around Ichigo, Aoi, Ran, and the original Starlight Academy era. The play loop centers on using clothing cards and outfit coordination to prepare for idol auditions, making fashion choices part of performance progression rather than cosmetic decoration. It is best understood as a Japan-only idol/fashion game for fans of the Data Carddass series, not a traditional visual novel.",
  },
  {
    id: "3ds-air-battle-hockey-3d",
    sourceUrl: "https://www.nintendo.com/es-es/Juegos/Programas-descargables-Nintendo-3DS/Air-Battle-Hockey-3D-758485.html",
    overview:
      "Air Battle Hockey 3D is a compact Nintendo 3DS eShop table-hockey game from Silver Star and Agetec. Players move a paddle, knock a puck or ball into the opponent's goal, and race to be the first side to 10 points, with the stereoscopic presentation giving the simple arena more punch. Its appeal is quick local-style arcade play and clean rules, though it is a narrow sports download rather than a deep season-based hockey sim.",
  },
  {
    id: "3ds-akb48-me",
    sourceUrl: "https://miiwiki.org/wiki/AKB48%2BMe",
    overview:
      "AKB48 + Me turns Kadokawa's idol-license into a Mii-styled career fantasy about trying to become part of AKB48. The structure mixes dress-up, performance, and idol-life minigames, including rhythm segments and variety-show-style activities such as rock-paper-scissors and musical chairs. It is a very Japanese fan-service release, most interesting today as an AKB48 culture piece and a 3DS curio built around celebrity-idol participation.",
  },
  {
    id: "3ds-alien-chaos-3d",
    sourceUrl: "https://www.nintendolife.com/reviews/eshop/alien_chaos_3d",
    overview:
      "Alien Chaos 3D is a Ludosity-developed 2D action shooter with a deliberately busy arcade feel. Instead of broad exploration, the focus is surviving waves of enemies, keeping the screen under control, and leaning into fast weapon-driven chaos across short stages. The result is a small eShop action game with personality and pressure, best suited to players who like compact score-chasing combat rather than long-form adventure structure.",
  },
  {
    id: "3ds-alien-on-the-run",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Alien-on-the-run-1127821.html",
    overview:
      "Alien on the Run is a comical G-Style escape-action game starring Delude, an alien trying to get away from a dangerous spaceship. Players run, slide, dodge tractor beams, trigger fever action, and use odd alien devices while trying to survive obstacle-heavy routes before time runs out. It works as a short-session 3DS eShop action game with a silly premise and clear arcade pacing, not as a conventional sci-fi adventure.",
  },
  {
    id: "3ds-alien-panic",
    sourceUrl: "https://gdri.smspower.org/wiki/index.php/SIMS",
    overview:
      "Alien Panic is an obscure Japan-only Nintendo 3DS eShop release associated with SIMS and Starsign. Public English information is limited, so it should be described cautiously as an alien-themed digital 3DS title rather than padded with invented systems or story details. Its collector interest comes mostly from its SIMS/Starsign publishing footprint and the preservation value of smaller 3DS eShop releases.",
  },
  {
    id: "3ds-alphadia",
    sourceUrl: "https://www.kemco-games.com/global/pr/ap_3ds_eu.html",
    overview:
      "Alphadia is Kemco's retro-styled turn-based JRPG for Nintendo 3DS, centered on Ash, Karim, and the conflict surrounding the Schwarzschild Empire. It uses a classic party-battle structure with character growth, Energi-driven fantasy conflict, and a campaign Kemco promoted as spanning more than 30 hours. For 3DS owners, it fills the handheld's downloadable traditional-RPG lane rather than trying to be an action-heavy modern RPG.",
  },
  {
    id: "3ds-alter-world",
    sourceUrl: "https://nintendowire.com/news/2018/04/06/alter-world-now-available-new-nintendo-3ds/",
    overview:
      "Alter World is a New Nintendo 3DS platformer built around shifting between a normal world and an alternate version of each stage. The central idea is spatial problem solving: hazards, platforms, and routes change depending on which version of the world is active, so progress depends on timing and reading both layouts. It is a budget eShop-style platformer with a clear dimension-switching hook rather than a broad narrative adventure.",
  },
  {
    id: "3ds-american-mensa-academy",
    sourceUrl: "https://delistedgames.com/mensa-academy-american-mensa-academy/",
    overview:
      "American Mensa Academy is a brain-training collection built around Mensa-style challenge categories. Its minigames test areas such as logic, memory, language, mathematics, and visual acuity, with the appeal coming from repeated score improvement instead of story or action progression. For the 3DS library, it sits in the educational/puzzle lane as a licensed mental-fitness package rather than a traditional game campaign.",
  },
  {
    id: "3ds-andro-dunos-ii",
    sourceUrl: "https://www.thedreamcastjunkyard.co.uk/2023/07/review-andro-dunos-ii.html",
    overview:
      "Andro Dunos II is a modern sequel to Visco's Neo Geo-era horizontal shooter, developed by Picorinne Soft and published by PixelHeart. The game keeps a 1990s arcade-shmup feel through side-scrolling stages, weapon switching, clear enemy patterns, and responsive survival play. On 3DS it is especially notable as a late physical-style collector release, appealing more to shoot-'em-up fans than general action players.",
  },
  {
    id: "3ds-angler-s-club-ultimate-bass-fishing-3d",
    sourceUrl: "https://www.gamerdad.com/blog/2013/08/09/anglers-club-ultimate-bass-fishing-3d-3ds/",
    overview:
      "Angler's Club: Ultimate Bass Fishing 3D is a handheld fishing game focused on simple tournament and free-fishing loops. Players choose spots, cast for different fish types, and work against time, weight, and competition goals rather than managing a broad sports-career mode. Its 3DS value is straightforward portable bass fishing with stereoscopic presentation, best for collectors of Tamsoft/D3 Publisher's smaller simulation and sports releases.",
  },
  {
    id: "3ds-angry-bunnies",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Angry-Bunnies-837204.html",
    overview:
      "Angry Bunnies is a physics-demolition puzzle game where players launch bunnies at fragile structures to defeat foxes. Across 150 levels, the challenge comes from judging force, angle, materials, and each bunny's ability so that the stage collapses in the right way. It is openly in the Angry Birds-style eShop puzzle lane, useful to describe by its destruction setup rather than as a generic action game.",
  },
  {
    id: "3ds-animal-hospital",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/93553-animal-hospital",
    overview:
      "Animal Hospital is a veterinary-care simulation about helping Dr. Robert run and expand a clinic. Players examine, diagnose, and treat a range of animals, from smaller pets such as rodents, birds, cats, and dogs to larger patients including horses, while unlocking additional care centers over time. Its appeal is routine-based animal care and clinic progression, not the management depth of a full business sim.",
  },
  {
    id: "3ds-anpanman-to-asobo-new-aiueo-kyoushitsu",
    sourceUrl: "https://www.honestgamers.com/52521/3ds/anpanman-to-asobo-new-aiueo-kyoushitsu/game.html",
    overview:
      "Anpanman to Asobo: New Aiueo Kyoushitsu is a Japan-only educational 3DS title aimed at young children learning kana and basic language skills. Rather than being an adventure game, it uses the familiar Anpanman cast for touch-based classroom activities built around the aiueo syllabary and early learning. Its collector identity comes from being a licensed preschool learning release in the long-running Anpanman handheld game line.",
  },
];

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const missing = entries.filter((entry) => !byId.has(entry.id));
  if (missing.length) {
    throw new Error(`Missing 3DS games: ${missing.map((entry) => entry.id).join(", ")}`);
  }

  const rows = [
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "3ds",
        entry.id,
        game.title || game.name || "",
        game.description || game.gcxOverview || game.overview || "",
        entry.sourceUrl,
        rewriteNotes,
        entry.overview,
        "reviewed",
        "GCX editorial cleanup",
      ];
    }),
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(`Wrote ${entries.length} reviewed 3DS overviews to ${path.relative(rootDir, outputPath)}`);
}

main();
