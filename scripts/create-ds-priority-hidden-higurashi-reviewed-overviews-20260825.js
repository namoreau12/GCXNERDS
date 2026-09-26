const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-hidden-higurashi-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-hidden-mysteries-salem-secrets-witch-trials-of-1692",
    sourceUrl: "https://www.cubed3.com/games/reviews/nintendo-ds/hidden-mysteries-salem-secrets-witch-trials-of-1692",
    overview:
      "Hidden Mysteries: Salem Secrets - Witch Trials of 1692 is a hidden-object adventure, not a shooter. It uses the Salem witch-trial setting for room investigation, clue gathering, puzzle solving, and a mood closer to old PC adventure games than arcade action. On DS, the appeal is touch-screen searching and atmospheric mystery pacing, making it a casual adventure entry for players who enjoy scanning scenes and slowly unlocking story context.",
  },
  {
    id: "ds-hidden-mysteries-titanic-secrets-of-the-fateful-voyage",
    sourceUrl: "https://caughtmegaming.wordpress.com/2017/07/02/review-hidden-mysteries-titanic-secrets-of-the-fateful-voyage-nintendo-ds/",
    overview:
      "Hidden Mysteries: Titanic: Secrets of the Fateful Voyage is a hidden-object mystery set aboard the Titanic rather than an action game. Players search cabins and ship locations for listed objects, solve light adventure puzzles, and follow Margaret through a melodramatic onboard mystery. Its DS value is straightforward casual play: historical disaster atmosphere, stylus-driven object hunting, and bite-sized progression more than mechanical depth.",
  },
  {
    id: "ds-hidden-mysteries-vampire-secrets",
    sourceUrl: "https://www.cubed3.com/games/reviews/nintendo-ds/hidden-mysteries-vampire-secrets",
    overview:
      "Hidden Mysteries: Vampire Secrets is a casual hidden-object puzzle adventure about Claire exploring a vampire mystery after an inheritance pulls her into strange locations. The game mixes adventure scenes, hidden-object areas, inventory use, and more than 30 mini-games, with optional hint and skip systems easing progression. It belongs in the DS library as a stylus-friendly mystery game for casual puzzle fans, not as combat-driven horror.",
  },
  {
    id: "ds-hidden-object-show",
    sourceUrl: "https://www.saturn.de/de/product/_the-hidden-object-show-nintendo-ds-93303115.html",
    overview:
      "Hidden Object Show brings the PC hidden-object game-show format to Nintendo DS, presenting object hunts as amusement-park contests. The loop is built around observation, quick scanning, awards, prizes, and a large number of short rounds rather than story-heavy adventure. It is a European casual-puzzle release whose appeal is portable pick-up-and-play searching, especially for players who like hidden-object games without darker mystery themes.",
  },
  {
    id: "ds-hidden-photo",
    sourceUrl: "https://n-europe.com/games/hidden-photo/",
    overview:
      "Hidden Photo is a DSi-focused puzzle game that uses photos taken with the system camera as part of the play experience. Instead of relying only on prebuilt scenes, it turns player-taken images into search-and-spot challenges, giving the title a novelty angle tied directly to DSi hardware features. It is best cataloged as a camera gimmick puzzle release: lightweight, family-friendly, and more interesting as a hardware-era curiosity than as a deep puzzle package.",
  },
  {
    id: "ds-higurashi-no-naku-koro-ni-kizuna-daiichikan-tatari",
    sourceUrl: "https://en.wikipedia.org/wiki/Higurashi_When_They_Cry",
    overview:
      "Higurashi no Naku Koro ni Kizuna: Daiichikan Tatari is the first DS volume of Alchemist's expanded Higurashi visual-novel port. It adapts early question-arc material from the murder-mystery series and adds new DS-era content, keeping the emphasis on reading, character tension, rural paranoia, and TIPS-style supplemental clues. The value here is portable access to Higurashi's branching mystery structure, with very little traditional action gameplay.",
  },
  {
    id: "ds-higurashi-no-naku-koro-ni-kizuna-dainikan-so",
    sourceUrl: "https://en.wikipedia.org/wiki/Higurashi_When_They_Cry",
    overview:
      "Higurashi no Naku Koro ni Kizuna: Dainikan So is the second Nintendo DS volume in Alchemist's four-part Higurashi Kizuna line. It continues the layered Hinamizawa mystery through additional arcs and console-port material, using text, character portraits, music, choices, and unlockable information to build dread. This is a collector-facing Japanese visual novel release: important to Higurashi fans, but heavily dependent on language comfort and patience for long-form reading.",
  },
  {
    id: "ds-higurashi-no-naku-koro-ni-kizuna-daisankan-rasen",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/132043-higurashi-no-naku-koro-ni-kizuna-dai-san-kan-rasen",
    overview:
      "Higurashi no Naku Koro ni Kizuna: Daisankan Rasen is the third DS volume of the Kizuna adaptation, continuing Higurashi's village mystery through more story arcs. LaunchBox describes the series setup around Keiichi, his friends, festival-linked disappearances, paranoia, and crimes that recur across alternate routes. For DS collectors, Rasen is not a standalone action title; it is a text-heavy chapter in a larger visual-novel sequence that rewards series order and narrative commitment.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on catalog, article, review, and specialist gameplay sources.",
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
