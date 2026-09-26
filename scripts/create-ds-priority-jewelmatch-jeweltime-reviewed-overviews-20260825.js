const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-jewelmatch-jeweltime-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-jewel-match",
    sourceUrl: "https://www.mobygames.com/game/43529/jewel-match/",
    overview:
      "Jewel Match on Nintendo DS is a Joindots match-3 puzzle game built around clearing jewel-covered board spaces across 150 levels. MobyGames describes gold and silver-backed squares that must be matched over once or twice, while retail listings call out relaxed, regular, and two-player modes. GCX should keep it in the casual puzzle lane, not treat it as a generic thinking-game entry.",
  },
  {
    id: "ds-jewel-match-2",
    sourceUrl: "https://www.honestgamers.com/56061/ds/jewel-match-2/game.html",
    overview:
      "Jewel Match 2 is the Nintendo DS follow-up to Joindots' casual gem-matching series, published in Europe by Purple Hills and Easy Interactive depending on listing. It continues the tile-clearing match-3 formula with long-form level progression and power-style rewards rather than story exploration or strategy combat. For GCX, the useful distinction is that this is a European casual puzzle sequel in the Jewel Match line.",
  },
  {
    id: "ds-jewel-match-3",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/102084-jewel-match-3",
    overview:
      "Jewel Match 3 is a Suricate Software match-3 adventure for DS, not a strategy game. LaunchBox describes rebuilding the five castles of Nevernear across 100 levels, searching for keys and potions, using portals and wizards, learning spells, planting magical gardens, and playing hidden-object and puzzle minigames. GCX should emphasize that blend of match-3 play and light hidden-object progression.",
  },
  {
    id: "ds-jewel-pet-kawaii-mahou-no-fantasy",
    sourceUrl: "https://www.honestgamers.com/56063/ds/jewel-pet-kawaii-mahou-no-fantasy/game.html",
    overview:
      "Jewel Pet: Kawaii Mahou no Fantasy is a Japan-only DS game from MTO based on the Sanrio and Sega Sammy Jewelpet franchise. Database listings tag it as simulation and virtual life, so GCX should present it as a character-license life-sim release about interacting with the magical Jewelpet world rather than a broad management sim. Its main value is for Jewelpet, Sanrio, and Japanese character-game collectors.",
  },
  {
    id: "ds-jewel-pet-mahou-no-ds-kirapi-kariin",
    sourceUrl: "https://segaretro.org/Jewelpet_Mahou_no_DS_Kirapi_Kariin",
    overview:
      "Jewel Pet: Mahou no DS Kirapi Kariin is MTO's second DS Jewelpet game and shifts the series toward stylus rhythm play. Sega Retro lists it as a rhythm game with one-to-four-player support, while later Jewelpet rhythm entries retained the idea of touching onscreen flowers in time with music and collecting jewels. GCX should call this a rhythm and character game, not a generic simulation.",
  },
  {
    id: "ds-jewel-pet-mahou-no-oheyya-de-issho-ni-asobou",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Jewelpet_video_games",
    overview:
      "Jewel Pet: Mahou no Oheyya de Issho ni Asobou! is another Japan-only Nintendo DS entry in MTO's Jewelpet run. The title belongs to the Sanrio and Sega Sammy character-game branch of the DS library, with play centered on spending time with the Jewelpets in a magical room setting rather than conventional sports, action, or strategy loops. GCX should position it as a character interaction and virtual-life import.",
  },
  {
    id: "ds-jewel-quest-iv-heritage",
    sourceUrl: "https://en.wikipedia.org/wiki/Jewel_Quest",
    overview:
      "Jewel Quest IV: Heritage is the DS version of Jewel Quest: Heritage, part of iWin's long-running Jewel Quest match-3 line. The series began with board-clearing tile matching and later expanded into hidden-object and card-game spin-offs, but Heritage belongs to the match-3 branch. GCX should describe it as gem matching with story and progression hooks, not a tactical strategy game.",
  },
  {
    id: "ds-jewel-quest-mysteries-2-trail-of-the-midnight-heart",
    sourceUrl: "https://en.wikipedia.org/wiki/Jewel_Quest",
    overview:
      "Jewel Quest Mysteries 2: Trail of the Midnight Heart is a hidden-object spin-off in the Jewel Quest family. The franchise history separates the Mysteries titles from the main match-3 games, so this DS entry should be framed around scene searching, clue hunting, and light puzzle progression rather than board-clearing alone. GCX should keep the Jewel Quest branding clear while labeling it as hidden-object adventure.",
  },
  {
    id: "ds-jewel-quest-mysteries-3-the-seventh-gate",
    sourceUrl: "https://en.wikipedia.org/wiki/Jewel_Quest",
    overview:
      "Jewel Quest Mysteries 3: The Seventh Gate continues the hidden-object side of iWin's Jewel Quest franchise. It is not a traditional adventure game with free exploration; its appeal is object searching, puzzle scenes, and mystery-driven progression built for short DS sessions. GCX should distinguish it from the main Jewel Quest match-3 entries and the Jewel Quest Solitaire card-game releases.",
  },
  {
    id: "ds-jewel-quest-mysteries-curse-of-the-emerald-tear",
    sourceUrl: "https://en.wikipedia.org/wiki/Jewel_Quest",
    overview:
      "Jewel Quest Mysteries: Curse of the Emerald Tear is the DS entry representing the Jewel Quest Mysteries hidden-object branch. The series list identifies Curse of the Emerald Tear as a hidden-object release rather than a strategy game, which makes the current GCX template misleading. The right collector framing is casual mystery play: searching illustrated scenes, solving light puzzles, and following the Jewel Quest adventure wrapper.",
  },
  {
    id: "ds-jewel-quest-solitaire",
    sourceUrl: "https://en.wikipedia.org/wiki/Jewel_Quest_Solitaire",
    overview:
      "Jewel Quest Solitaire is a card-game spin-off that blends solitaire hands with the Jewel Quest treasure-hunting theme. On DS, the important genre correction is that it is not a strategy or tactics game; it is casual solitaire progression with Jewel Quest presentation and scoring hooks. GCX should group it with handheld card and puzzle releases while preserving the iWin franchise connection.",
  },
  {
    id: "ds-jewel-quest-v-the-sleepless-star",
    sourceUrl: "https://en.wikipedia.org/wiki/Jewel_Quest",
    overview:
      "Jewel Quest V: The Sleepless Star is part of the main Jewel Quest match-3 sequence. The series is built around swapping adjacent tiles to make matches, turning board spaces, and dealing with later variations such as hazards, special tiles, and increasingly awkward board layouts. GCX should label this as a match-3 puzzle adventure rather than a vague exploration game.",
  },
  {
    id: "ds-jewel-quest-expeditions",
    sourceUrl: "https://en.wikipedia.org/wiki/Jewel_Quest:_Expeditions",
    overview:
      "Jewel Quest: Expeditions brings iWin's match-3 treasure-hunting formula to Nintendo DS through Activision Value. The core loop is still Jewel Quest board play: swap adjacent tokens, create matches, and clear or convert board spaces while moving through expedition-themed progression. GCX should present it as the DS port of the franchise's classic match-3 structure, not as a general adventure game.",
  },
  {
    id: "ds-jewel-quest-solitaire-trio",
    sourceUrl: "https://en.wikipedia.org/wiki/Jewel_Quest",
    overview:
      "Jewel Quest: Solitaire Trio is a DS package built around the solitaire side of the Jewel Quest brand. It belongs with playing-card puzzle releases, combining themed solitaire play with Jewel Quest's treasure and jewel presentation rather than unit planning or strategy combat. GCX should make the card-game identity explicit so collectors can separate it from Jewel Quest match-3 and Mysteries hidden-object entries.",
  },
  {
    id: "ds-jewel-time-deluxe",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Jewel Time Deluxe is an O-Games and Oxygen Interactive DS puzzle release from the late handheld era. The title belongs to the same casual puzzle shelf as many European DS jewel games, built for quick play sessions and repeated board challenges rather than story-heavy progression. GCX should keep the description modest but specific: a budget-friendly jewel-themed puzzle compilation-style release for DS collectors.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on game databases, franchise references, retail feature listings, and specialist catalog sources.",
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
