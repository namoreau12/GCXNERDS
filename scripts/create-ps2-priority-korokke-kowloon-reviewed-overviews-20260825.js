const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-korokke-kowloon-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-korokke-ban-ou-no-kiki-o-sukue",
    sourceUrl: "https://en.wikipedia.org/wiki/Korokke!_Ban-%C5%8C_no_Kiki_o_Sukue",
    overview:
      "Korokke! Ban-Ou no Kiki o Sukue is a Japan-only Konami action game based on Manavu Kashimoto's Croket! manga. The PS2 version shares the release with the GameCube edition and focuses on single-player and multiplayer action rather than a long RPG structure. Its appeal is mostly for Croket! fans and Japanese licensed-game collectors, with character recognition and Konami publishing provenance mattering more than broad Western familiarity.",
  },
  {
    id: "ps2-kotoba-no-puzzle-mojipittan",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-20259.html",
    overview:
      "Kotoba no Puzzle: Mojipittan is Namco's Japanese word-puzzle game built around placing hiragana tiles onto a board. It resembles Scrabble at a glance, but each turn uses one tile and can trigger chains when the new character forms several valid words at once. Stage objectives ask players to fill boards, make longer words, or produce chains, so the challenge is vocabulary, board reading, and efficient tile placement.",
  },
  {
    id: "ps2-kou-rate-ura-mahjong-retsuden-mukoubuchi-goburei-last-desu-ne",
    sourceUrl: "https://online.nojima.co.jp/commodity/1/4560101367014/",
    overview:
      "Kou Rate Ura Mahjong Retsuden Mukoubuchi: Goburei, Last desu ne adapts the Mukoubuchi gambling-mahjong world into a PS2 table game. Scenario mode follows harsh underground matches with Yasunaga guiding the player toward a confrontation with Kai, while dictionary and explanation features clarify unusual mahjong terms, waits, discards, and scoring. A special-ability mode lets players experience the source material's dramatic winning streaks beyond ordinary mahjong play.",
  },
  {
    id: "ps2-kouenji-joshi-soccer",
    sourceUrl: "https://tcrf.net/Kouenji_Joshi_Soccer",
    overview:
      "Kouenji Joshi Soccer is a Japanese girls' school soccer game from Starfish and Game Factory. It mixes team sports presentation with character-driven school-club flavor, putting the player around an all-girls soccer squad rather than a licensed professional league. The PS2 release is a niche import title whose interest comes from its anime-style cast, Japanese-only structure, and unusual place inside the platform's crowded sports library.",
  },
  {
    id: "ps2-koufuku-sousakan",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SCPS-15060.html",
    overview:
      "Koufuku Sousakan is an experimental Sony-published simulation about manipulating happiness in a virtual future society. Players choose from a large group of citizens, observe a short day in that person's life, and use limited interventions to push emotional outcomes as situations unfold. It is closer to a social-observation toy and mood-management sim than a conventional life sim, which makes it one of the stranger first-party Japanese PS2 releases.",
  },
  {
    id: "ps2-koushien-konpeki-no-sora",
    sourceUrl: "https://www.honestgamers.com/45219/playstation-2/koushien-konpeki-no-sora/game.html",
    overview:
      "Koushien: Konpeki no Sora is a Japan-only high-school baseball game from Mahou. The title sits inside the long-running Koushien tradition, focusing on school baseball rather than professional league licensing or arcade spectacle. For PS2 library purposes, it is best understood as a domestic sports entry built around tournament atmosphere, team management expectations, and the cultural pull of Japanese high-school baseball.",
  },
  {
    id: "ps2-kousoku-tanigawa-shogi",
    sourceUrl: "https://www.mobygames.com/game/253693/kosoku-tanigawa-shogi/",
    overview:
      "Kousoku Tanigawa Shogi is a traditional Japanese shogi release for PlayStation 2 tied to professional player Koji Tanigawa's name. Rather than dressing the board game as an adventure, it focuses on one- or two-player shogi play, computer opposition, and a clean digital-table presentation. It belongs with the PS2's serious board-game conversions, where AI strength, readable pieces, and learning value matter more than flashy modes.",
  },
  {
    id: "ps2-kowloon-youma-gakuenki",
    sourceUrl: "https://en.wikipedia.org/wiki/Kowloon_High-School_Chronicle",
    overview:
      "Kowloon Youma Gakuenki, later known internationally through Kowloon High-School Chronicle, is an Atlus-published adventure RPG with visual-novel school scenes and first-person dungeon crawling. Players investigate an Egyptian ruin beneath a school, solve puzzles, craft items, and use an emotion-wheel response system that changes relationships and party support. Its mix of treasure-hunting, retro computer menus, and grid-based exploration makes it much more distinctive than a generic PS2 RPG entry.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on official, catalog, specialist database, and gameplay-description sources.",
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
