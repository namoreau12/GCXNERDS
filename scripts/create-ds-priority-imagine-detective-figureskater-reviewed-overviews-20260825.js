const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-imagine-detective-figureskater-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-imagine-detective",
    sourceUrl: "https://www.esrb.org/ratings/27051/imagine-detective/",
    overview:
      "Imagine: Detective follows a young investigator solving school and town mysteries through clue gathering, witness interviews, photos, and case-focused minigames. The DS activities include spot-the-difference puzzles, tangram-style matching, fingerprint work, and light action prompts during confrontations. It plays like a casual mystery adventure: explore leads, document evidence, update the in-game blog, and build each case toward a solution.",
  },
  {
    id: "ds-imagine-family-doctor",
    sourceUrl: "https://ds.gamespy.com/nintendo-ds/imagine-family-doctor/",
    overview:
      "Imagine: Family Doctor puts players in the role of a young physician opening a private practice. Instead of broad hospital management, the focus is patient-by-patient care: examine symptoms, run simple tests, identify problems, and complete touch-screen treatment minigames. Its pace is built around appointment routines and light medical problem solving, making it a small-clinic career fantasy rather than a strategy sim.",
  },
  {
    id: "ds-imagine-fashion-designer",
    sourceUrl: "https://ds.gamespy.com/nintendo-ds/fashion-designer/",
    overview:
      "Imagine: Fashion Designer is a contract-driven fashion workshop game. Players choose garments, patterns, cuts, colors, accessories, hair, makeup, and presentation details, then send models to photo shoots or catwalk-style showcases. Early tutorials explain the tools and client expectations, while later play opens into freer outfit creation. The appeal is designing looks to a brief, then seeing those choices staged on a model.",
  },
  {
    id: "ds-imagine-fashion-designer-new-york",
    sourceUrl: "https://www.gamestop.com/video-games/nds/products/imagine-fashion-designer-new-york---nintendo-ds/10072110.html",
    overview:
      "Imagine: Fashion Designer New York gives the fashion formula a more structured agency setting. Players enter a New York fashion agency, learn from specialists, design clothing, choose accessories, and style models with hair and makeup before photo shoots and runway shows. Compared with the first Fashion Designer, this entry leans more into career progression and scene-setting, using New York as the backdrop for guided fashion work.",
  },
  {
    id: "ds-imagine-fashion-designer-world-tour",
    sourceUrl: "https://ds.gamespy.com/nintendo-ds/imagine-fashion-designer-world-tour/",
    overview:
      "Imagine: Fashion Designer World Tour expands the series from a local design job into an international brand fantasy. Players create clothing lines, travel between fashion locations, stage runway shows, handle photo shoots, and use celebrity endorsements to promote their label. It is still a styling and customization game at heart, but the campaign structure is about turning designs into a worldwide fashion name.",
  },
  {
    id: "ds-imagine-fashion-paradise",
    sourceUrl: "https://www.honestgamers.com/55966/ds/imagine-fashion-paradise/game.html",
    overview:
      "Imagine: Fashion Paradise is a later DS fashion-management entry developed by Magic Pockets. It sits closer to a boutique tycoon than a single-outfit dress-up game, asking players to build a fashion business through styling choices, shop growth, and customer-facing presentation. It represents the series' late shift toward broader fashion empire management on DS.",
  },
  {
    id: "ds-imagine-fashion-stylist",
    sourceUrl: "https://www.esrb.org/ratings/29668/imagine-fashion-stylist/",
    overview:
      "Imagine: Fashion Stylist casts the player as the person running a fashion boutique, with play centered on outfits, inventory, store decor, and model presentation. Customers need assembled looks, the shop needs stocked and arranged merchandise, and successful styling can lead into fashion-show photography. It is a mall-boutique management game with dress-up decisions built into the business loop.",
  },
  {
    id: "ds-imagine-figure-skater",
    sourceUrl: "https://www.gamestop.com/video-games/nds/products/imagine-figure-skater---nintendo-ds/10065738.html",
    overview:
      "Imagine: Figure Skater blends life-sim scheduling with stylus-based skating routines. Players balance training, school, friends, and rivalry scenes, then perform jumps, spins, and skating combinations by drawing or tapping on the touch screen. Progress unlocks more advanced moves for routines, so the game works as a skating career fantasy where daily choices feed into scored performances on the ice.",
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
