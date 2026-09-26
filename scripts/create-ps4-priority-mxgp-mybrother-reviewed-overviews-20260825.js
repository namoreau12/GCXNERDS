const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-mxgp-mybrother-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-mxgp-2",
    sourceUrl: "https://milestone.it/games/mxgp-2/",
    overview:
      "MXGP 2 is Milestone's official FIM Motocross World Championship game for the 2015 season, built around licensed riders, teams, bikes, and circuits from MXGP and MX2. It expands the first MXGP with a fuller career structure, bike and rider customization, indoor arena events, and modes that ask players to learn terrain, rhythm sections, starts, and jump timing. GCX should present it as the PS4 entry where the series moved from proof-of-license into a broader motocross package.",
  },
  {
    id: "ps4-mxgp-3",
    sourceUrl: "https://store.steampowered.com/app/561600/MXGP3__The_Official_Motocross_Videogame/",
    overview:
      "MXGP 3 rebuilds Milestone's official motocross series on Unreal Engine 4, giving the PS4 release a different look and feel from MXGP 2. It uses the 2016 FIM Motocross World Championship license, includes official MXGP and MX2 riders, teams, and tracks, and adds two-stroke bikes alongside deeper rider and bike customization. GCX should distinguish it as the technical-reset chapter, important because the engine change shaped the series' presentation going forward.",
  },
  {
    id: "ps4-mxgp-2019",
    sourceUrl: "https://milestone.it/games/mxgp-2019/",
    overview:
      "MXGP 2019 brings Milestone's official motocross game to the current 2019 championship for the first time, letting players race the season's MXGP and MX2 riders, bikes, teams, and events while that season was still fresh. It adds dynamic weather and lets players alter championship outcomes instead of simply replaying an old standings table. GCX should frame it as the PS4 entry focused on real-time season relevance and modern championship presentation.",
  },
  {
    id: "ps4-mxgp-2020",
    sourceUrl: "https://milestone.it/games/mxgp-2020/",
    overview:
      "MXGP 2020 is Milestone's official 2020 motocross game, built around the MXGP and MX2 categories, official riders and teams, and a season shaped by a disrupted real-world championship. The PS4 version adds a track editor, career progression, playground-style riding, and a focus on building a custom racer through official competition. GCX should identify it as the entry where creation tools became a major part of the package alongside licensed race content.",
  },
  {
    id: "ps4-mxgp-2021",
    sourceUrl: "https://www.playstation.com/en-us/games/mxgp-2021/",
    overview:
      "MXGP 2021 is the final Milestone-developed MXGP game of the PS4 era, carrying more than 40 riders, official MXGP and MX2 2021 bikes and teams, sponsors, accessories, and every 2021 championship track. It adds legacy circuits such as Ottobiano, Ernee, and Leon, plus a career where results affect progression and team contracts. GCX should present it as the late-cycle, fuller-license chapter for PS4 collectors, especially because the MXGP license later moved away from Milestone.",
  },
  {
    id: "ps4-mxgp-the-official-motocross-videogame",
    sourceUrl: "https://store.playstation.com/en-us/product/UP0700-CUSA01167_00-MXGP2014FULLGAME",
    overview:
      "MXGP: The Official Motocross Videogame is the first Milestone MXGP release on PS4, bringing licensed MX1 and MX2 riders, bikes, and championship events to Sony's eighth-generation console. The PS4 version adds four exclusive tracks and presents official motocross courses at 1:1 scale, with career progression from debut seasons toward top-class competition. GCX should treat it as the foundation release for the licensed MXGP line rather than lumping it together with later annual entries.",
  },
  {
    id: "ps4-my-big-sister",
    sourceUrl: "https://store.playstation.com/en-gb/product/EP0896-CUSA15333_00-MYBIGSISTERBUNDL",
    overview:
      "My Big Sister is a pixel-art horror adventure from Stranga and Ratalaika centered on Luzia, a sarcastic twelve-year-old trying to get herself and her sister Sombria home after a kidnapping. It plays more like an RPG-style narrative adventure than a combat RPG, using exploration, dialogue, strange characters, and unsettling story turns to build tension. GCX should position it as a small psychological story game for players who like eerie indie adventures and Ratalaika's PS4/Vita catalog.",
  },
  {
    id: "ps4-my-brother-rabbit",
    sourceUrl: "https://mybrotherrabbit.com/",
    overview:
      "My Brother Rabbit is Artifex Mundi's hand-drawn exploration puzzle adventure about a child using imagination to process his sister's illness. Its surreal world mixes real hospital fears with a fantasy journey where a rabbit tries to heal a flower friend by collecting objects and solving environmental puzzles. GCX should describe it as a gentle, emotional hidden-object-adjacent adventure that stretches Artifex Mundi beyond its usual mystery formula into storybook imagery and wordless empathy.",
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
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    rows.push([
      "ps4",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on official/store pages and reputable game references where official current English pages were unavailable.",
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
