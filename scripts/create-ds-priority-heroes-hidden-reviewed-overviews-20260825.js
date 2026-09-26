const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-heroes-hidden-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-hero-s-saga-laevatein-tactics",
    sourceUrl: "https://en.wikipedia.org/wiki/Hero%27s_Saga_Laevatein_Tactics",
    overview:
      "Hero's Saga Laevatein Tactics is a tactical RPG built for players who like grid battles, class changes, weapon ranks, and squad management. Combat starts on a strategy map, then zooms into leader-and-troop clashes where formation choices, targeting soldiers or leaders, and Valhalla Break attacks decide the tempo. It is best understood as an old-school DS strategy RPG with a distinctive squad-combat layer, even if its pacing and story are more workmanlike than genre-leading.",
  },
  {
    id: "ds-heroes-of-hellas-2-olympia",
    sourceUrl: "https://www.jeuxvideo.com/jeux/nintendo-ds/00041545-heroes-of-hellas-2-olympia.htm",
    overview:
      "Heroes of Hellas 2: Olympia is a match-3 puzzle game that wraps gem linking around rebuilding the city of Olympia. Players earn resources by matching colored pieces across puzzle boards, then spend that progress on structures while special powers and bonuses make later boards more efficient. The result is a light mythological puzzle loop for short DS sessions: less about action, more about chaining matches and watching the city slowly return to life.",
  },
  {
    id: "ds-het-huis-anubis-de-donkere-strijd",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/163076-het-huis-anubis-de-donkere-strijd",
    overview:
      "Het Huis Anubis: De Donkere Strijd is a Dutch-language mystery puzzle adventure based on The House Anubis television world. Players control five young characters, each tied to one of the senses, and combine hearing, sight, smell, taste, and touch abilities to solve quests. It belongs in the DS library as a regional licensed adventure: compact, character-driven, and built around show familiarity rather than broad international accessibility.",
  },
  {
    id: "ds-het-huis-anubis-het-geheim-van-osiris",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/134735-het-huis-anubis-het-geheim-van-osiris",
    overview:
      "Het Huis Anubis: Het Geheim Van Osiris turns the Belgian-Dutch mystery series into a point-and-click style DS adventure about ancient secrets and time-spanning locations. The game sends players from an abandoned inn to a garden of artifacts and into Egyptian-themed mystery solving, with riddles and treasure hunting driving progress. It is most relevant as a regional TV tie-in for Anubis fans and collectors of European DS releases.",
  },
  {
    id: "ds-hexe-lilli-entdeckt-europa",
    sourceUrl: "https://usk.de/en/usktitle/23619/",
    overview:
      "Hexe Lilli Entdeckt Europa is a German children's adventure built around the popular witch character learning her way through Europe. Rather than a combat game, it plays as an educational, story-led DS release with travel, map, and problem-solving themes suited to younger players. Its library value comes from being a regional family title from Morgen Studios, the kind of localized DS software that mattered in Europe but rarely surfaced in North American coverage.",
  },
  {
    id: "ds-hi-hi-puffy-amiyumi-the-genie-and-the-amp",
    sourceUrl: "https://en.wikipedia.org/wiki/Hi_Hi_Puffy_AmiYumi",
    overview:
      "Hi Hi Puffy AmiYumi: The Genie and the Amp is a licensed Cartoon Network DS action game starring Ami and Yumi on a time-traveling music quest. The story has the duo collect magical notes for an ultimate world tour, while gameplay leans on character switching, light brawling, platforming, puzzles, and music-themed objectives. It is a mid-2000s TV tie-in with more personality than depth, strongest for fans of the animated series and D3's handheld licensed catalog.",
  },
  {
    id: "ds-hidamari-sketch-doko-demo-sugoroku-x-365",
    sourceUrl: "https://www.youtube.com/watch?v=BPd8V2r8VqI",
    overview:
      "Hidamari Sketch: Doko Demo Sugoroku x 365 adapts the slice-of-life anime into a Japanese board-game format rather than a traditional puzzle game. Players move through spaces tied to story scenes, character interactions, and small mini-games, making language comprehension a major part of the experience. It is best cataloged as a fan-focused import: cozy, text-heavy, and built for Hidamari Sketch viewers more than players looking for universal arcade mechanics.",
  },
  {
    id: "ds-hidden-mysteries-buckingham-palace",
    sourceUrl: "https://ds.gamespy.com/nintendo-ds/hidden-mysteries-buckingham-palace/",
    overview:
      "Hidden Mysteries: Buckingham Palace is a hidden-object puzzle game set across royal-themed scenes rather than a shooter. GameSpy lists 48 levels across 12 acts, with object hunting, item combination, and a unique puzzle closing each act. The DS appeal is straightforward casual play: scan cluttered locations, collect hundreds of objects, solve light logic problems, and move through a compact mystery structure built for stylus-driven sessions.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on catalog, article, review, and specialist gameplay sources.",
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
