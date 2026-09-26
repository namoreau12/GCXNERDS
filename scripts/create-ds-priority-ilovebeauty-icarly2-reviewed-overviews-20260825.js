const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-ilovebeauty-icarly2-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-i-love-beauty-hollywood-makeover",
    sourceUrl: "https://www.play-asia.com/en/i-love-beauty-hollywood-makeover/13/703dav",
    overview:
      "I Love Beauty: Hollywood Makeover is a stylus-driven makeover game built around makeup, hair styling, accessories, and short beauty-contest challenges. Retail listings describe 36 makeup looks, 21 makeup and hair minigames with many variations, and modes for free play, custom makeovers, a beauty center, and contests. The DS appeal is very direct: players tap through small salon tasks, assemble a look, and try to match the right cosmetic choices to each challenge.",
  },
  {
    id: "ds-i-love-horses",
    sourceUrl: "https://www.familyfriendlygaming.com/Reviews/2009/I%20Love%20Horses.html",
    overview:
      "I Love Horses is a casual DS horse-care package made from short minigames rather than a deep riding simulation. Reviews and retail listings describe a set of about 20 activities covering grooming, training, memory games, singing, hide-and-seek, and light obstacle-style events. It is best understood as a simple touch-screen activity book for younger players who want repeatable horse-themed tasks instead of breeding systems, open exploration, or serious equestrian competition.",
  },
  {
    id: "ds-i-love-puppies",
    sourceUrl: "https://www.amazon.com/DS-I-Love-Puppies-Nintendo/dp/B0042A4ZIM",
    overview:
      "I Love Puppies follows the same casual-pet formula as I Love Horses, but shifts the routine to puppy care. Retail copy highlights 20 minigames built around training, playing, bathing, grooming, and hide-and-seek, so most of the experience is made of quick stylus interactions rather than a persistent kennel sim. Its value is as an approachable younger-audience virtual-pet cartridge: easy goals, short sessions, and plenty of repeated care tasks.",
  },
  {
    id: "ds-i-spy-castle",
    sourceUrl: "https://www.esrb.org/ratings/31438/i-spy-castle/",
    overview:
      "I SPY Castle turns the Scholastic hidden-object format into a castle mystery on DS. The ESRB describes players advancing through the story by solving riddles, collecting hidden objects, and completing logic-based minigames, while coverage of the release noted 12 castle scenes, 36 I SPY riddles, and 12 minigames. The result is a structured search-and-find adventure where progress comes from carefully reading clues and scanning crowded scenes.",
  },
  {
    id: "ds-i-spy-universe",
    sourceUrl: "https://nintendoeverything.com/review-i-spy-universe/",
    overview:
      "I SPY Universe is a portable hidden-object game that sends the familiar picture-riddle format into a space-themed rescue mission. Reviews describe lots of search puzzles, replay reasons, and a few minigames connecting the scenes, with the DS touch screen acting as the main way to inspect and select objects. It works less like a conventional adventure game and more like a sequence of illustrated clue hunts designed for younger players and short sessions.",
  },
  {
    id: "ds-i-m-a-celebrity-get-me-out-of-here",
    sourceUrl: "https://www.vgchartz.com/game/40394/im-a-celebrity-get-me-out-of-here/",
    overview:
      "I'm A Celebrity... Get Me Out of Here! is a Europe-only DS adaptation of the ITV reality show, framed as a trivia and game-show release from Mindscape. Instead of a long campaign, it recreates the show's jungle-challenge energy through quick activities, contestant-style tasks, and quiz-show pacing. The main draw is the license: it is for players who recognize the TV format and want a compact minigame version of its trials, voting pressure, and camp-show atmosphere.",
  },
  {
    id: "ds-icarly",
    sourceUrl: "https://www.gamestop.com/video-games/products/icarly/10075098.html",
    overview:
      "iCarly on DS is a party/minigame adaptation of the Nickelodeon show focused on building webisodes rather than exploring a full adventure world. Listings describe more than 100 show-inspired skits, a Fan Meter for progression, cast voice work, and tools for adding intros, outros, music, effects, green-screen elements, and props. The strongest idea is letting fans assemble goofy iCarly segments, though the loop depends heavily on repeating short skit challenges.",
  },
  {
    id: "ds-icarly-2-ijoin-the-click",
    sourceUrl: "https://en.wikipedia.org/wiki/ICarly_2%3A_iJoin_the_Click%21",
    overview:
      "iCarly 2: iJoin the Click! changes direction from the first game's skit collection into a light social-simulation game. Players create a new student, move around Ridgeway Secondary School and familiar show locations, interact with Carly, Sam, Freddie, Spencer, and Gibby, and help build webisodes through errands, item collecting, and small activities. It is still aimed squarely at fans, but the DS hook is being dropped into the show's world as a customizable newcomer.",
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
