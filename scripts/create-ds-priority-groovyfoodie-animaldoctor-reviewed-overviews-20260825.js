const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-groovyfoodie-animaldoctor-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-icarly-groovy-foodie",
    sourceUrl: "https://www.dadofdivas.com/producteview/gameeview-icarly-groovy-foodie",
    overview:
      "iCarly: Groovy Foodie! is a restaurant-rush spin on the Nickelodeon license rather than a story adventure. Players set menus, prepare dishes, and serve customers quickly across show locations such as Webicon, Ridgeway Junior High, and the Groovy Smoothie. The appeal is fast order management with oddball iCarly food gags, including dishes like spaghetti tacos, so it belongs closer to time-management cooking games than strategy games.",
  },
  {
    id: "ds-ico-soccer",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/102124-ico-soccer",
    overview:
      "Ico Soccer is a DS-exclusive soccer game that uses the handheld's two screens as its central control idea. The top screen shows the match, while the touch screen presents top-down player icons and soccer commands for passing, shooting, and moving play forward. It offers quick matches and a short World Cup mode, making it a compact stylus-controlled soccer experiment rather than a licensed league simulation.",
  },
  {
    id: "ds-idaten-jump-ds-moero-flame-kaiser",
    sourceUrl: "https://www.vgchartz.com/game/18416/idaten-jump-ds-moero-flame-kaiser/",
    overview:
      "Idaten Jump DS: Moero! Flame Kaiser is a Japan-only Taito racing game based on the Idaten Jump anime and manga. Instead of cars, the fantasy is mountain-bike battles tied to Sho Yamato and his Flame Kaiser bike, with course previews, character portraits, and race presentation matching the license. It is best described as an anime bicycle-racing adaptation built for fans of the series' Idaten Battle premise.",
  },
  {
    id: "ds-idol-janshi-suchie-pai-iii-remix",
    sourceUrl: "https://www.mobygames.com/game/68430/idol-janshi-suchie-pai-iii-remix/",
    overview:
      "Idol Janshi Suchie-Pai III Remix brings Jaleco's arcade mahjong series to DS as a handheld remake package. The DS version presents cutscenes and swimsuit scenes as slideshows with text instead of spoken dialogue, and it adds side modes such as free battle, album viewing, sound test, and a Miyuri dress-up minigame. Its core remains character-driven Japanese mahjong, with the extras aimed at series fans and collectors.",
  },
  {
    id: "ds-ikatan-ikamono-tantei",
    sourceUrl: "https://www.honestgamers.com/55932/ds/ikatan-ikamono-tantei/game.html",
    overview:
      "Ikatan: Ikamono Tantei is a Japan-only mystery visual novel from Edge WORKS and CyberFront. The DS entry centers on reading, investigation, and case progression rather than action or exploration, placing it near other text-heavy handheld detective games of the era. Its value comes from its scenario and character mystery structure, so it is a language-dependent import for players comfortable with Japanese adventure-game pacing.",
  },
  {
    id: "ds-ikou-intelligenztrainer-fur-kids",
    sourceUrl: "https://gamegear.net/archive/games/nds/ikou-intelligenztrainer-fuer-kids-germany",
    overview:
      "Ikou: Intelligenztrainer fur Kids is a Germany-focused DS brain-training title aimed at children. Rather than a life sim, it fits the educational puzzle category: quick exercises, simple presentation, and repeatable challenges meant to practice attention, memory, logic, or school-adjacent thinking skills. The DS touch screen makes it a short-session trainer for younger players, closer to a kids' workbook than a character-led game.",
  },
  {
    id: "ds-illust-logic-ds-colorful-logic",
    sourceUrl: "https://picross.miraheze.org/wiki/Illustlogic_DS_%2B_Colorful_Logic",
    overview:
      "Illust Logic DS + Colorful Logic is Hudson Soft's DS nonogram package, built around picture-logic puzzles in the Picross tradition. It includes standard black-and-white Illust Logic puzzles and a Colorful Logic variant where color rules change the way clues are read and solved. The draw is pure puzzle craft: fill grids from numerical hints, reveal pixel images, and move through a large set of stylus-friendly logic boards.",
  },
  {
    id: "ds-imagine-animal-doctor",
    sourceUrl: "https://www.amazon.com/Imagine-Animal-Doctor-Nintendo-DS/dp/B000SQ5LN2",
    overview:
      "Imagine: Animal Doctor casts the player as a young veterinarian caring for a clinic full of pets and farm animals. Retail descriptions emphasize feeding, diagnosing, treating, playing with patients, and customizing clinic staff, while player impressions point to juggling cleanliness, health, money, and reputation. It is a touch-screen care routine game: examine animals, perform simple treatments, keep needs filled, and grow the practice through repeated appointments.",
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
