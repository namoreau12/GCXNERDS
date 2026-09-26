const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-marsmoose-massdestruction-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-mars-moose-walkabout-3-world-sports-day",
    sourceUrl: "https://psxdatacenter.com/games/U/L/LSP-010380.html",
    overview:
      "Mars Moose Walkabout 3: World Sports Day is part of Lightspan's school-focused PlayStation learning line. This entry sends players through a World Sports Day setup built around reading comprehension, maps, visual clues, riddles, pictogram word replacement, and spatial reasoning. It matters less as a conventional platformer and more as a preserved example of late-1990s classroom edutainment on Sony hardware.",
  },
  {
    id: "ps1-martial-beat",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-87014.html",
    overview:
      "Martial Beat is a Japan-only Konami rhythm-fitness game that blends martial-arts motions with music timing. The PlayStation version follows an arcade concept that used motion sensors rather than a standard controller, asking players to punch and kick in rhythm with on-screen prompts. It is a collector curiosity because it sits near Bemani culture without being a standard dance game, and because the peripheral is central to the experience.",
  },
  {
    id: "ps1-martial-beat-2",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-87146.html",
    overview:
      "Martial Beat 2 expands Konami's motion-based martial-arts rhythm idea with a dedicated three-piece controller setup for hands, ankles, and a sensing unit. Players follow instructor prompts, practice movements, and move through fitness or attack exercises by punching and kicking to the beat. For GCX, it should be framed as an unusual Japanese rhythm-fitness sequel where hardware completeness matters as much as the disc.",
  },
  {
    id: "ps1-mary-king-s-riding-star",
    sourceUrl: "https://playitagainproject.com/mary-kings-riding-star/",
    overview:
      "Mary King's Riding Star is an equestrian simulation that began as Riding Star on PC before Midas localized and rebranded it around Olympic rider Mary King for European PlayStation audiences. The game focuses on horse-event structure rather than arcade racing, with dressage, jumping, cross-country style competition, and rider-management flavor. Its GCX value is as a niche PAL horse-sports title with a distinct Midas budget-game footprint.",
  },
  {
    id: "ps1-mary-kate-and-ashley-crush-course",
    sourceUrl: "https://m.imdb.com/title/tt1572159/",
    overview:
      "Mary-Kate and Ashley: Crush Course is an Acclaim/Dualstar licensed PlayStation game built around the Olsen twins completing themed challenges to assemble a secret note. The appeal is light minigame variety and celebrity-brand adventure rather than mechanical depth, with activities framed for the early-2000s tween audience. It belongs in GCX as part of the short-lived Mary-Kate and Ashley licensed-game run across PlayStation and handheld systems.",
  },
  {
    id: "ps1-mary-kate-and-ashley-magical-mystery-mall",
    sourceUrl: "https://www.pricecharting.com/game/playstation/mary-kate-and-ashley-magical-mystery-mall",
    overview:
      "Mary-Kate and Ashley: Magical Mystery Mall turns the twins' mall trip into a curse-breaking adventure made of store-by-store challenges. Players collect magical gems by clearing activities inside the mall, with the structure closer to a branded minigame collection than a traditional exploration game. For collectors, it is notable as one of the more recognizable PlayStation Olsen-twins releases and a clear snapshot of Acclaim's youth-license strategy.",
  },
  {
    id: "ps1-mary-kate-and-ashley-winner-s-circle",
    sourceUrl: "https://en.wikipedia.org/wiki/Mary-Kate_and_Ashley%3A_Winners_Circle",
    overview:
      "Mary-Kate and Ashley: Winner's Circle is a PlayStation horse-riding simulation developed by Tantalus and published under Acclaim's Club Acclaim label. Players choose or create horses, train and care for them, and compete in events such as dressage, show jumping, and cross-country riding. It is more substantial than a simple celebrity skin, making it useful for GCX readers who collect horse games, licensed youth games, or Tantalus-developed PlayStation releases.",
  },
  {
    id: "ps1-mass-destruction",
    sourceUrl: "https://en.wikipedia.org/wiki/Mass_Destruction_%28video_game%29",
    overview:
      "Mass Destruction is an overhead tank action game from NMS Software where players drive through mission maps, destroy specific targets, and tear apart enemy forces with independently aimed turret fire. The hook is immediate vehicle combat and destructible environments rather than deep military simulation. It is a worthwhile GCX entry for players who like short-burst arcade combat, Saturn/PlayStation comparisons, and late-1990s action games built around simple destructive pleasure.",
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
    if (!game) throw new Error(`Missing PS1 game ${rewrite.id}`);
    rows.push([
      "ps1",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on specialist database, catalog, retail, and historical gameplay sources.",
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
