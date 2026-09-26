const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-makikou-marionette-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-makikou-mystery-adventure",
    sourceUrl: "https://giantbomb.com/wiki/Games/SuperLite_1500_Makikou_Mystery_Adventure",
    overview:
      "Makikou: Mystery Adventure is a budget SuperLite 1500 sound-novel adventure from Success. The setup follows college students who study occultism as they investigate a Kyoto castle tied to the legend of Abe no Seimei. Play centers on first-person story progression, reading, atmosphere, and mystery choices rather than action combat, making it a niche Japanese text-adventure entry for players interested in folklore and occult-school storytelling.",
  },
  {
    id: "ps1-manic-game-girl",
    sourceUrl: "https://www.hardcoregaming101.net/manic-game-girl/",
    overview:
      "Manic Game Girl is a Korean-developed PlayStation action-adventure with beat-em-up segments. Players follow Amber, a college freshman who becomes swept into a video-game-obsessed resistance plot after a new console and an evil corporation turn the city upside down. The game alternates between town exploration, character conversations, and enemy-fighting stages, so it plays more like an odd adventure-brawler hybrid than a standard visual novel.",
  },
  {
    id: "ps1-marby-baby-story",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01738.html",
    overview:
      "Marby Baby Story is a Ponos maze-puzzle game about guiding baby Marby through a strange block-filled maze. The player navigates stages, avoids enemies, and uses objects such as bombs to open paths or remove threats. It is not a traditional RPG despite the character framing; the heart of the game is route planning, object use, and escaping compact puzzle spaces with a quirky late-1990s PlayStation look.",
  },
  {
    id: "ps1-maria-2-jutai-kokuchi-no-nazo",
    sourceUrl: "https://gamegear.net/archive/games/psx/maria-2-jutai-kokuchi-no-nazo-japan-disc-1",
    overview:
      "Maria 2: Jutai Kokuchi no Nazo is the sequel to Maria and keeps the series in psychological-thriller adventure territory. Set two years after the first game, it uses text-heavy dialogue, voice-acted key scenes, pre-rendered CG movies, and exploratory 3D environments. Maria can also use a computer and email to gather information, giving the sequel more investigative texture than a pure page-turning visual novel.",
  },
  {
    id: "ps1-maria-kimitachi-ga-umareta-wake",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01136.html",
    overview:
      "Maria: Kimitachi ga Umareta Wake is a psychological mystery adventure about a young psychiatrist, Takano, and his patient Maria. After Maria is hospitalized following a suicide attempt, Takano interviews her and uncovers amnesia, trauma, and a dangerous split personality threatening to overtake her. The experience is driven by dialogue, diagnosis, and story reveals, placing it closer to a medical thriller visual novel than a conventional horror game.",
  },
  {
    id: "ps1-mario-mushano-no-chou-shogi-juku",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00964.html",
    overview:
      "Mario Mushano no Chou-Shogi-Juku, also known as Mario Mushano's Hyper Shogi School, is a teaching-focused shogi game. Players learn by watching computer moves, studying other matches, playing practice games, answering shogi questions, and clearing staged lessons toward certification. Its value is as a structured board-game tutor for Japanese shogi learners rather than a flashy competitive package.",
  },
  {
    id: "ps1-marionette-company",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-02058.html",
    overview:
      "Marionette Company is Micro Cabin's robot-communication adventure simulation. The player spends a limited six-month period developing a special humanlike marionette by talking with her, earning money, buying parts, improving stats, and building emotional exchange through events. It blends text adventure, raising-sim routines, and science-fiction companionship, so the appeal is in nurturing the marionette rather than clearing action stages.",
  },
  {
    id: "ps1-marionette-company-2-chu",
    sourceUrl: "https://archive.org/details/psx_mariont2",
    overview:
      "Marionette Company 2 Chu! continues Micro Cabin's first-person adventure and simulation formula. The sequel again revolves around anime-styled marionette care and communication, with visual-novel presentation and virtual-life systems. Players return to a high-school setting, encounter abandoned marionettes, and guide relationships and development over time, making it a direct fit for fans of the first game's robot-raising concept.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on specialist catalog, database, and gameplay-description sources.",
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
