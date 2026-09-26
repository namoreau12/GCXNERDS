const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-micetopia-minutes-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-micetopia",
    sourceUrl: "https://www.ratalaikagames.com/games/micetopia.php",
    overview:
      "Micetopia is a compact pixel-art Metroidvania about Rich, a small mouse trying to rescue captured villagers and earn the title of hero. The PS4 version focuses on light exploration, sword combat, platforming, new abilities, and backtracking through a mysterious fantasy world rather than party-based RPG systems. GCX should position it as a short Ratalaika-published indie for players who like approachable exploration games and collectors tracking small digital and limited-print PS4 releases.",
  },
  {
    id: "ps4-micro-machines-world-series",
    sourceUrl: "https://en.wikipedia.org/wiki/Micro_Machines_World_Series",
    overview:
      "Micro Machines World Series brings Codemasters' tabletop toy-car racing series to PS4 with tiny vehicles blasting across oversized household environments. Its identity is multiplayer first: local racing, online competition, elimination-style events, and battle modes built around miniature cars with distinct weapons and abilities. Because the online servers were later shut down, GCX should describe the game through its couch-play and collector context instead of treating its original online feature set as fully intact today.",
  },
  {
    id: "ps4-mighty-fight-federation",
    sourceUrl: "https://store.playstation.com/en-us/product/UP2262-PPSA02990_00-9063270209529730",
    overview:
      "Mighty Fight Federation is a 3D arena fighter from Komi Games built for up to four players, with wall slams, air launches, follow-up attacks, and chaotic free-for-all matches. It borrows the party-fighting appeal of older arena brawlers while still leaning on character move sets, team battles, and combo timing. For PS4 owners, it is best understood as a smaller competitive brawler with local-party energy rather than a traditional one-on-one fighting-game ladder.",
  },
  {
    id: "ps4-miles-and-kilo",
    sourceUrl: "https://www.eastasiasoft.com/games/Miles-and-Kilo",
    overview:
      "Miles & Kilo is a fast, retro-styled action platformer from Four Horses in which the duo chases stolen plane parts across a haunted island. It has 36 short challenge levels, five boss fights, surfing and sliding sequences, and an unlockable time-attack hook that makes it closer to an arcade precision runner than a sprawling platform adventure. GCX should call out its connection to Kid Tripp and its value for players who like quick restarts, clean 60 fps movement, and score-chasing routes.",
  },
  {
    id: "ps4-minecraft-story-mode-season-2",
    sourceUrl: "https://store.playstation.com/en-gb/product/EP2026-CUSA08689_00-MSM200000000GAME",
    overview:
      "Minecraft: Story Mode - Season Two continues Telltale's choice-driven Minecraft adventure with Jesse returning as the hero of Beacontown. The season sends old friends and new companions into a new mystery around a Prismarine gauntlet, the Admin, dangerous challenges, and decisions that shape conversations and relationships more than traditional action systems. Because the series was later removed from digital storefronts, GCX should treat the PS4 release as both a story-focused Minecraft spin-off and a notable physical/delisted-era collector item.",
  },
  {
    id: "ps4-minoria",
    sourceUrl: "https://store.playstation.com/en-hu/product/EP3919-CUSA19047_00-MINORIAEU0000000/",
    overview:
      "Minoria is Bombservice's spiritual follow-up to Momodora, trading pixel art for hand-painted backgrounds and cel-shaded characters while keeping the studio's gothic action-platforming feel. Players guide Sister Semilla through a witch-hunting fantasy story with sword attacks, spells, dodge-rolls, parries, and measured exploration through dangerous side-scrolling spaces. GCX should frame it as a deliberate Metroidvania-style PS4 release where defensive timing and atmosphere matter as much as map progression.",
  },
  {
    id: "ps4-minotaur-arcade-volume-1",
    sourceUrl: "https://store.steampowered.com/app/906110/Minotaur_Arcade_Volume_1/",
    overview:
      "Minotaur Arcade Volume 1 is a Llamasoft collection that packages two modernized arcade throwbacks: Gridrunner, an intense shooter, and GoatUp, a score-chasing platform game. The PS4 version also supports PlayStation VR, giving the collection a different context from a standard compilation because it can be played as a neon, arcade-cabinet-style VR experience. GCX should present it as a niche Jeff Minter/Llamasoft collector release built around reflexes, retro design, and short high-score sessions.",
  },
  {
    id: "ps4-minutes",
    sourceUrl: "https://www.thesixthaxis.com/2014/11/04/minutes-review-ps4-ps-vita/",
    overview:
      "Minutes is a minimalist arcade puzzle-action game from Red Phantom Games where each stage lasts exactly sixty seconds. Players steer an abstract shape around the screen, collect safe colored lines and objects, avoid harmful ones, and adjust size to balance risk, scoring, and survival. It belongs on GCX as an early PS4/Vita indie built around sharp pattern recognition and repeat attempts rather than story, character progression, or long-form exploration.",
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
