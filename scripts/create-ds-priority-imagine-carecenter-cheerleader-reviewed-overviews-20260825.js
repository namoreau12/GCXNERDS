const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-imagine-carecenter-cheerleader-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-imagine-animal-doctor-care-center",
    sourceUrl: "https://www.esrb.org/ratings/27665/imagine-animal-doctor-care-center/",
    overview:
      "Imagine: Animal Doctor Care Center returns to Ubisoft's veterinarian fantasy with a larger clinic structure. Players examine patients, run tests, diagnose conditions, and complete touch-screen treatment minigames such as stitching wounds or setting broken bones. The loop is built around triage and care routines rather than open-ended clinic management: learn what is wrong, perform the right procedure, and keep the practice moving as new patients arrive.",
  },
  {
    id: "ds-imagine-artist",
    sourceUrl: "https://www.amazon.com/Imagine-Artist-DS-Nintendo/dp/B002EWD07W",
    overview:
      "Imagine: Artist turns the DS stylus into a casual art-school toolset. Its activities teach drawing, painting, collage, color mixing, shading, and composition through short creative minigames, then use those pieces as portfolio work. The appeal is less about scoring and more about guided making: follow prompts, decorate scenes, experiment with techniques, and build toward the fantasy of becoming a young professional artist.",
  },
  {
    id: "ds-imagine-babysitters",
    sourceUrl: "https://www.commonsensemedia.org/game-reviews/imagine-babysitters",
    overview:
      "Imagine: Babysitters is a hands-on daycare routine game where the cute presentation is balanced by deliberately needy babies. Players feed, dress, rock, soothe, clean up after, and entertain multiple children while moving through missions and minigames. Its structure makes babysitting feel like constant small-task management: watch the babies' moods, respond quickly, and use simple DS interactions to keep the household under control.",
  },
  {
    id: "ds-imagine-babyz",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-DS/Imagine-Babies-271100.html",
    overview:
      "Imagine: Babyz mixes virtual-baby care with a light household-job framework. Players prepare bottles and food, change diapers, dress babies, rock them to sleep, clean the house, and earn money that can be spent on home upgrades or personal items. It is a touch-screen caregiving sim built from repeated routines, with the DS inputs used for the small physical actions that make each task feel interactive.",
  },
  {
    id: "ds-imagine-babyz-fashion",
    sourceUrl: "https://www.gamestop.com/video-games/nds/products/imagine-babyz-fashion/10075293.html",
    overview:
      "Imagine: Babyz Fashion keeps the baby-care foundation but shifts the fantasy toward styling, accessories, and stage presentation. Players still feed, play with, and soothe the babies, then dress them in coordinated outfits, match toys and accessories, and send them into fashion contests or runway-style events. It works as a hybrid of virtual-care chores and dress-up customization rather than a pure childcare sim.",
  },
  {
    id: "ds-imagine-ballet-star",
    sourceUrl: "https://www.vgchartz.com/game/28158/imagine-ballet-star/",
    overview:
      "Imagine: Ballet Star frames ballet as a character-driven performance game with dancing, fashion, and competition layered together. Players choose from multiple ballerinas, follow their stories, practice routines, and customize looks with hair, makeup, outfits, and accessories before performances. The game is built around the fantasy of training into a star, using short DS-friendly challenges instead of a strict rhythm-game score chase.",
  },
  {
    id: "ds-imagine-boutique-owner",
    sourceUrl: "https://www.esrb.org/ratings/26568/imagine-boutique-owner/",
    overview:
      "Imagine: Boutique Owner is less a clothing-store sim than a gift-shop management game. Players set up a local boutique, interact with customers, create personalized products such as cakes, flowers, perfumes, bouquets, and necklaces, then prepare orders for occasions like Valentine's Day or Mother's Day. The appeal is fulfilling themed requests through small creation minigames and keeping customers happy.",
  },
  {
    id: "ds-imagine-cheerleader",
    sourceUrl: "https://www.1stplayable.com/what-we-make/Imagine-Cheerleader_77-games.htm",
    overview:
      "Imagine: Cheerleader is a stylus-based routine game about building school spirit through cheers, jumps, kicks, lifts, and performance sequences. Players follow rhythm-style cues, learn routines, and progress through a squad storyline as their team competes against others. It belongs closest to casual rhythm and dance games, with success coming from matching prompts cleanly and making each routine look energetic.",
  },
];

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = [
    [
      "platformSlug",
      "gameId",
      "title",
      "currentOverview",
      "sourceUrl",
      "rewriteNotes",
      "newOverview",
      "reviewStatus",
      "reviewer",
    ],
  ];

  rewrites.forEach((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing DS game ${rewrite.id}`);
    rows.push([
      "ds",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority DS weak-template cleanup; original GCX editorial overview based on review, retail, database, and specialist gameplay sources.",
      rewrite.overview,
      "reviewed",
      "GCX editorial cleanup",
    ]);
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rows: rewrites.length }, null, 2));
}

main();
