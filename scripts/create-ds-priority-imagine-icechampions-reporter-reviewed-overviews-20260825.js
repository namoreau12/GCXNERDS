const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-imagine-icechampions-reporter-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-imagine-ice-champions",
    sourceUrl: "https://www.vgchartz.com/game/31173/imagine-ice-champions/summary",
    overview:
      "Imagine: Ice Champions follows a young figure skater training toward international competition and the Grand Championship Finals. Players learn skating moves, assemble routines, and perform them through DS-friendly timing and stylus prompts. Compared with a pure rhythm game, the fantasy is broader: practice, design a routine, travel to competitions, and build the confidence of a skater trying to become world champion.",
  },
  {
    id: "ds-imagine-interior-designer",
    sourceUrl: "https://www.amazon.com/Imagine-Interior-Designer-DS-Nintendo/dp/B001EAWM4W",
    overview:
      "Imagine: Interior Designer turns decorating into a series of client jobs and craft workshops. Players use the stylus to complete projects in areas such as painting, pottery, framing, and room decoration, then apply those creations to spaces that match a customer's brief. It is a creativity-and-service game: make objects, choose colors and layouts, satisfy clients, and build the fantasy of becoming a successful decorator.",
  },
  {
    id: "ds-imagine-makeup-artist",
    sourceUrl: "https://www.esrb.org/ratings/26444/imagine-makeup-artist/",
    overview:
      "Imagine: Makeup Artist casts the player as an aspiring beauty professional working from amateur status toward a pro license. The touch screen is used to apply foundation, lipstick, blush, eyeliner, eye shadow, and other products according to client requests. Story scenes and shopping add light career structure, but the core appeal is precision styling: study the brief, choose the right cosmetics, and make each customer happy.",
  },
  {
    id: "ds-imagine-master-chef",
    sourceUrl: "https://www.vgchartz.com/game/13431/imagine-master-chef/",
    overview:
      "Imagine: Master Chef is a cooking career game built around preparing more than 50 dishes from different cuisines. Players use the stylus to chop, stir, mix, cook, and serve ingredients, then expand the experience with kitchen customization, cooking quizzes, and recipe challenges. Its loop is easy to understand: follow the steps of a dish, execute the kitchen minigames cleanly, and grow into a better chef.",
  },
  {
    id: "ds-imagine-movie-star",
    sourceUrl: "https://tasvideos.org/4246G",
    overview:
      "Imagine: Movie Star is a fame-building game where a custom avatar rises through rhythm challenges, dress-up segments, and celebrity branding. Players perform well in scenes, style their character, and turn success into magazines, cosmetics, and clothing lines. It is less about acting simulation than pop-star momentum: complete performance tasks, look the part, and build a public persona across the campaign.",
  },
  {
    id: "ds-imagine-music-fest",
    sourceUrl: "https://www.esrb.org/ratings/26332/imagine-music-fest/",
    overview:
      "Imagine: Music Fest sends the player to a music camp where social scenes feed into band building and rhythm performances. Players talk with other students, recruit bandmates, customize the band's look and logo, then play guitar, drums, and keyboard by following on-screen note cues. Wireless play and instrument minigames make it a light band-fantasy rhythm game rather than a strict concert-management sim.",
  },
  {
    id: "ds-imagine-party-planner",
    sourceUrl: "https://ds.gamespy.com/nintendo-ds/imagine-party-planner/",
    overview:
      "Imagine: Party Planner turns event work into client meetings and themed minigames. Players learn what each client wants, design invitations and decorations, collect party pieces through activities, and assemble events such as weddings, charity galas, birthday parties, and formal balls. The structure is task-based planning: read the brief, earn the right supplies, style the event, and respond to client feedback.",
  },
  {
    id: "ds-imagine-reporter",
    sourceUrl: "https://www.amazon.com/Imagine-Reporter-Nintendo-DS/dp/B002SMVMSC",
    overview:
      "Imagine: Reporter puts the player in a junior journalist role, chasing stories around the city instead of managing a shop or clinic. Assignments involve interviewing public figures, taking photographs, investigating leads, and traveling by scooter or helicopter to reach story locations. The game is built from short reporting-themed minigames, so its draw is the career fantasy of finding leads and turning them into news pieces.",
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
