const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-lostwing-mafia-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-lost-wing",
    sourceUrl: "https://www.gematsu.com/2020/07/lost-wing-launches-july-28-for-ps4-july-29-for-xbox-one-and-july-31-for-switch-and-pc",
    overview:
      "Lost Wing is a high-speed arcade shooter where players pilot a futuristic craft down dangerous tracks, dodging hazards, firing at enemies, and chasing leaderboard times. It plays more like an autorunner fused with combat racing than a traditional racer, with procedural routes, ship upgrades, traps, and short-session challenge loops. GCX should frame it as a reflex-heavy digital arcade release for score chasers, not as a conventional car-racing game.",
  },
  {
    id: "ps4-lost-words-beyond-the-page",
    sourceUrl: "https://maximument.com/news/modus-games-to-publish-sketchbook-games-award-winning-lost-words-beyond-the-page/",
    overview:
      "Lost Words: Beyond the Page is a story-first puzzle-platformer split between a young writer's journal and the fantasy world she creates. Players walk across written words, rearrange language into platforms, and use word magic to solve gentle puzzles while Izzy processes family, loss, and healing. Its strength is interactive storytelling: Rhianna Pratchett's writing and the diary/fantasy structure matter more than difficult platforming.",
  },
  {
    id: "ps4-lumines-remastered",
    sourceUrl: "https://luminesremastered.com/",
    overview:
      "Lumines Remastered revives the PSP puzzle classic with HD and 4K presentation, keeping the series' signature blend of falling two-color blocks, electronic music, and sweeping rhythm-based clears. Players rotate blocks to build color squares, then time their setups around the passing timeline as skins and songs shift the feel of each stage. It is essential puzzle-library material because Lumines turns score chasing into a sound-and-light performance rather than a plain block-clearing exercise.",
  },
  {
    id: "ps4-lumini",
    sourceUrl: "https://lumini-game.com/",
    overview:
      "Lumini is a relaxed flow adventure about guiding a swarm of fragile creatures across an alien home world after their species has nearly vanished. Players steer the group, split and reform the swarm, avoid environmental dangers, collect energy, and unlock abilities that help restore the Lumini. Its appeal is mood and motion: a soft, low-pressure action-adventure built around graceful movement and survival of the flock rather than combat mastery.",
  },
  {
    id: "ps4-luna",
    sourceUrl: "https://blog.playstation.com/2019/05/27/luna-lands-on-ps4-ps-vr-june-18/",
    overview:
      "Luna is a meditative puzzle fairytale from Funomena about a bird, an owl, the moon, and the process of healing after a mistake. On PS4 and PS VR, players shape small diorama-like spaces, solve tactile audio-visual puzzles, and rebuild natural scenes through gentle creative interaction. It is best presented as an artful, short-form VR-friendly experience where mood, symbolism, and sculptural play are the point.",
  },
  {
    id: "ps4-mad-games-tycoon",
    sourceUrl: "https://www.toplitz-productions.com/news-2388/mad-games-tycoon-released.html",
    overview:
      "Mad Games Tycoon is a business sim about building a video game studio from a garage startup into a larger company with offices, staff, engines, licenses, and eventually console ambitions. Players hire teams, develop games, manage research, expand rooms, and chase profitable trends while balancing production costs. Its collector-library value is as a console version of a PC-style management sim, useful for players who enjoy game-industry spreadsheets with a playful wrapper.",
  },
  {
    id: "ps4-mad-tower-tycoon",
    sourceUrl: "https://www.eggcodegames.com/",
    overview:
      "Mad Tower Tycoon is a building-management sim about designing and operating a profitable high-rise tower. Players lay out offices, apartments, restaurants, utilities, elevators, and services while trying to keep tenants satisfied and money flowing. It should be described as a planning-and-operations game for simulation fans, where the real challenge is balancing space, traffic, income, and demand across a growing vertical city.",
  },
  {
    id: "ps4-mafia-iii",
    sourceUrl: "https://store.playstation.com/en-us/product/UP1001-CUSA03652_00-MAFIA3DEFINITIVE",
    overview:
      "Mafia III is an open-world crime action game set in 1968 New Bordeaux, a fictionalized New Orleans shaped by organized crime, race, war, and revenge. Players control Lincoln Clay, a Vietnam veteran who builds a new criminal network after the Italian Mafia wipes out his surrogate family, using stealth, gunfights, driving, and district takeovers to dismantle rival power. Its strongest identity is narrative and setting: a violent revenge story wrapped around a period soundtrack and a large, gritty city.",
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
      rewrite.sourceUrl || game.descriptionSourceUrl || "",
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on verified identity, platform metadata, publisher/developer context, and official/store descriptions where available.",
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
