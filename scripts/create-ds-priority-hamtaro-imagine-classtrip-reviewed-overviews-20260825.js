const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-hamtaro-imagine-classtrip-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-hi-hamtaro-little-hamsters-big-adventure",
    sourceUrl: "https://en.wikipedia.org/wiki/Hamtaro_(video_game_series)",
    overview:
      "Hi Hamtaro! Little Hamsters Big Adventure is the North American DS release of Hi! Hamtaro: Ham-Ham Challenge, a Hamtaro puzzle and training entry from AlphaDream. It asks players to solve small question-and-answer challenges, learn clues through training, earn sunflower seeds, and use those rewards to furnish a virtual home. Compared with the GBA adventure entries, this one is gentler and more educational, built around reading, memory, and short touch-screen tasks.",
  },
  {
    id: "ds-imagine-resort-owner",
    sourceUrl: "https://www.gamestop.com/video-games/nds/products/imagine-resort-owner---nintendo-ds/10084196.html",
    overview:
      "Imagine: Resort Owner turns the DS into a small vacation-business sim. Players build an island resort, customize beaches and activity areas, hire employees, pick food options, and run events for guests. The goal is to grow the property into a higher-rated destination while keeping visitors entertained, including VIP customers who can join beach-sport activities. It is management-lite, but the fantasy is clear: design the getaway, staff it, and make guests want to return.",
  },
  {
    id: "ds-imagine-rock-star",
    sourceUrl: "https://www.nintendoworldreport.com/news/15587/ubisoft-announces-imagine-rock-star-for-the-ds",
    overview:
      "Imagine: Rock Star follows an up-and-coming band trying to climb toward a recording contract. Players create the group, assign members to drums, guitar, bass, and piano, then use stylus controls tailored to each instrument during performances. Between songs, the game lets players customize the look of each bandmate, play concerts, earn money, and wirelessly jam with friends. It is a band-career fantasy more than a hardcore rhythm test.",
  },
  {
    id: "ds-imagine-salon-stylist",
    sourceUrl: "https://www.gamestop.com/video-games/nds/products/imagine-salon-stylist---nintendo-ds/10075193.html",
    overview:
      "Imagine: Salon Stylist is built around running a beauty salon and keeping a returning client base happy. Players create customer files, learn each customer's preferences, and use styling workshops for hair, color, accessories, and makeup application. The rhythm is part service sim and part creative makeover tool: understand the request, choose the right treatment, build the salon's reputation, and turn satisfied clients into regulars.",
  },
  {
    id: "ds-imagine-soccer-captain",
    sourceUrl: "https://www.gamestop.com/video-games/nds/products/imagine-soccer-captain---nintendo-ds/10075271.html",
    overview:
      "Imagine: Soccer Captain makes soccer approachable by shrinking the sport into stylus-driven 5-on-5 matches. Before playing, the captain designs team colors, uniforms, and logos, assigns positions, and manages team mood. On the field, players guide teammates with the touch screen to run, pass, dribble, and work around opponents. Tips from Coach Mia Hamm and simple team-building systems keep the focus on leadership and beginner-friendly play.",
  },
  {
    id: "ds-imagine-sweet-16",
    sourceUrl: "https://www.amazon.com/Imagine-Sweet-16-NDS-nintendo-ds/dp/B0033ZV2OM",
    overview:
      "Imagine: Sweet 16 is a social-life and celebration-planning story about a new high-school student approaching her sixteenth birthday. The player tries to become better known at school by making friends, managing social choices, and building toward the party itself. Its appeal is not deep simulation; it is a tween life-fantasy loop where popularity, outfits, invitations, and event preparation all point toward the big birthday moment.",
  },
  {
    id: "ds-imagine-teacher",
    sourceUrl: "https://www.computinghistory.org.uk/det/56236/Imagine%20Teacher/",
    overview:
      "Imagine: Teacher puts the player in charge of a modern classroom that grows as more students join over time. Lessons cover multiple subjects, and the file system tracks individual student progress so the teacher can respond to each pupil's needs. The DS activities mix curriculum-themed minigames with classroom management, making the fantasy less about strict grading and more about guiding a lively class through a school year.",
  },
  {
    id: "ds-imagine-teacher-class-trip",
    sourceUrl: "https://www.gamestop.com/video-games/nds/products/imagine-teacher-class-trip---nintendo-ds/10075272.html",
    overview:
      "Imagine: Teacher Class Trip expands the teacher role beyond the classroom with a month-long school trip. Players still choose and teach morning lessons in subjects such as math, science, nature, and geography, but the structure adds grading, keeping students attentive, outdoor treasure hunts, teamwork boosts, pop quizzes, souvenirs, and traps set by competitors. It plays like a school-camp companion piece to the original Imagine: Teacher.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on official retail, specialist catalog, and gameplay-description sources.",
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
