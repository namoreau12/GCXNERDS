const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-lastescort-lemony-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-last-escort-shinya-no-kokuchou-monogatari",
    sourceUrl: "https://en.wikipedia.org/wiki/Last_Escort",
    overview:
      "Last Escort: Shinya no Kokuchou Monogatari is the first PS2 entry in D3 Publisher's host-club-themed otome series. The story follows Akari Sagami as she becomes involved with the host club Gorgeous, where romance routes and character events drive the experience. GCX should classify it as an otome dating sim and visual-novel-style adventure, not a broad exploration game, with collector interest centered on Japanese romance-game libraries.",
  },
  {
    id: "ps2-le-tour-de-france",
    sourceUrl: "https://fr.wikipedia.org/wiki/Le_Tour_de_France_(jeu_vid%C3%A9o,_2002)",
    overview:
      "Le Tour de France is Konami's officially licensed 2002 cycling game for PlayStation 2 and Xbox. Rather than a general sports title, it turns the Tour into racing stages with solo and multiplayer competition built around peloton movement, timing, and race positioning. For GCX readers, its significance is as an early-2000s licensed cycling release from Konami, aimed at a European sports audience rarely served on consoles.",
  },
  {
    id: "ps2-le-tour-de-france-centenary-edition",
    sourceUrl: "https://fr.wikipedia.org/wiki/Le_Tour_de_France_:_%C3%89dition_du_Centenaire",
    overview:
      "Le Tour de France: Centenary Edition is DC Studios and Konami's 2003 PS2 follow-up marking the race's centenary. It keeps the official Tour de France license and focuses on cycling race formats rather than arcade tricks, with stage play and competition built around the rhythm of road racing. Its collecting angle is straightforward: a PAL-focused licensed sports release tied to the 1903-2003 anniversary branding.",
  },
  {
    id: "ps2-leaderboard-golf",
    sourceUrl: "https://gamesdb.launchbox-app.com/developers/games/942-aqua-pacific",
    overview:
      "Leaderboard Golf is a budget PlayStation 2 golf game from Aqua Pacific and Midas Interactive. LaunchBox describes it as a typical golf game with courses inspired by the European and U.S. Tour, which puts it closer to straightforward course play than arcade minigolf or character golf. For GCX, it belongs in the PAL budget-sports corner of the PS2 library, where scarcity and publisher history may matter more than broad player demand.",
  },
  {
    id: "ps2-league-series-baseball-2",
    sourceUrl: "https://en.wikipedia.org/wiki/K%C5%8Dshien_(series)",
    overview:
      "League Series Baseball 2 is the European name for Magical Sports 2001 Koushien, part of Mahou's long-running Japanese high-school baseball series. The Koshien line is built around Japan's school baseball culture rather than MLB branding, so its PS2 identity is closer to a regional baseball simulation than a mainstream Western sports release. GCX should surface both names so collectors understand why a Japanese Koushien game appears under a PAL baseball title.",
  },
  {
    id: "ps2-legend-of-camelot",
    sourceUrl: "https://gamesdb.launchbox-app.com/publishers/games/1808-phoenix-games",
    overview:
      "Legend of Camelot is a Phoenix Games children's PS2 release built around the Arthurian legend rather than a full-scale adventure game. LaunchBox places it among Phoenix's many budget story-and-activity releases; available gameplay captures show the familiar Phoenix structure of simple interactive segments tied to cartoon-style presentation. Its value on GCX is mostly as a PAL budget curiosity and Phoenix Games library entry.",
  },
  {
    id: "ps2-legend-of-herkules",
    sourceUrl: "https://phoenixgamesltd.com/home/viewDb/168",
    overview:
      "Legend of Herkules is a Phoenix Games kids release that combines a short cartoon-film presentation with simple activities. Phoenix's own listing describes a cartoon film, jigsaw puzzle, colouring book, and memory game, built around Herkules trying to defeat Heras and win Deianeira's love. GCX should present it as an activity-disc style children's release, not a conventional action-adventure.",
  },
  {
    id: "ps2-legendz-gekitou-saga-battle",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_(L%E2%80%93Z)",
    overview:
      "Legendz Gekitou! Saga Battle is a Japan-only Bandai PS2 game tied to the Legendz multimedia franchise. It is best understood as a character-license battle RPG for fans of the anime and toy line, with combat and progression built around creature-style encounters rather than a standard fantasy party RPG. For GCX, the useful metadata is its December 2004 Japanese release and Bandai publisher/developer credit.",
  },
  {
    id: "ps2-lemony-snicket-s-a-series-of-unfortunate-events",
    sourceUrl: "https://en.wikipedia.org/wiki/Lemony_Snicket%27s_A_Series_of_Unfortunate_Events_(video_game)",
    overview:
      "Lemony Snicket's A Series of Unfortunate Events is Activision's 2004 action-adventure adaptation of the film and early book material. Players control Violet, Klaus, and Sunny Baudelaire through puzzle solving, platforming, enemy encounters, and invention-based tools while moving through locations such as Count Olaf's house, Uncle Monty's home, Damocles Dock, and Aunt Josephine's house. It is a short licensed adventure, but far more specific than the old generic GCX blurb suggested.",
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
    if (!game) throw new Error(`Missing PS2 game ${rewrite.id}`);
    rows.push([
      "ps2",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on official publisher, platform list, game database, and specialist reference sources.",
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
