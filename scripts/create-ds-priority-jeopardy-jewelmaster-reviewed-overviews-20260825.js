const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-jeopardy-jewelmaster-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-jeopardy",
    sourceUrl: "https://www.amazon.com/Jeopardy-Nintendo-DS/dp/B003S2OO04",
    overview:
      "Jeopardy! on Nintendo DS is THQ and Griptonite's handheld version of the TV quiz show, built around the familiar answer-in-the-form-of-a-question format. The DS release includes more than 2,400 clues, Alex Trebek presentation, Clue Crew material, and local support for one to three players. GCX should frame it as a licensed game-show trivia title, not a generic party-game collection.",
  },
  {
    id: "ds-jetix-puzzle-buzzle",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Jetix Puzzle Buzzle is a European Nintendo DS puzzle release from Blast! Entertainment tied to the Jetix children's-TV brand. The old description was too vague; its place in the library is as a short-session licensed puzzle game aimed at younger players rather than a character adventure or long campaign. For GCX, the useful collector context is its PAL-focused publisher identity and Jetix branding.",
  },
  {
    id: "ds-jewel-adventures",
    sourceUrl: "https://www.mobygames.com/game/100301/jewel-adventures/",
    overview:
      "Jewel Adventures is a match-3 fantasy puzzle game where players help Ayla rebuild a ruined kingdom by clearing gem boards. MobyGames notes classic and master mage modes, mission-based play, and a large level count, while contemporary reviews highlight combat-like twists on standard gem matching. GCX should present it as a DSi-era casual puzzle title with fantasy progression, not as a traditional adventure game.",
  },
  {
    id: "ds-jewel-legends-tree-of-life",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Jewel Legends: Tree of Life is part of the casual match-3 branch of the DS library, where clearing jewel boards feeds a restoration or construction layer between puzzles. The important correction is genre: this is not a management simulation in the usual sense, but a tile-matching puzzle game with progression rewards. GCX should group it with the platform's many late-era casual puzzlers and European retail releases.",
  },
  {
    id: "ds-jewel-link-chronicles-mountains-of-madness",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/99192-jewel-link-chronicles-mountains-of-madness",
    overview:
      "Jewel Link Chronicles: Mountains of Madness combines match-3 boards with hidden-object investigation and clue gathering. LaunchBox describes solving jewel boards, uncovering clues, using special tools such as Shuffle and Cyclone keys, and finding more than 1,000 items. GCX should call it a casual puzzle-adventure hybrid, not a strategy game, with appeal for players who like light mystery framing around gem matching.",
  },
  {
    id: "ds-jewel-link-arctic-quest",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Jewel Link: Arctic Quest is another Avanquest DS match-3 release built around destination-themed puzzle boards rather than strategy combat. The title's value is in compact gem-matching sessions, incremental board goals, and its place in a budget European casual line. GCX should keep the description grounded in match-3 play and the Arctic Quest theme instead of implying unit tactics or resource-war systems.",
  },
  {
    id: "ds-jewel-link-atlantic-quest",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Jewel Link: Atlantic Quest is a casual match-3 Nintendo DS game from Avanquest's Jewel Link line. It fits the same short-session puzzle template as the other themed Jewel Link releases, asking players to clear boards and progress through a destination-flavored quest rather than manage units or teams. For GCX readers, it is best surfaced as a PAL casual-puzzle entry and series variant.",
  },
  {
    id: "ds-jewel-link-galactic-quest",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Jewel Link: Galactic Quest moves the Avanquest match-3 formula into a space-themed wrapper. The old GCX blurb made it sound like a strategy game, but the actual selling point is simple gem-board progression with a themed quest structure for quick DS sessions. Its collector relevance comes from being one of several late DS casual puzzle releases that share branding but differ by setting.",
  },
  {
    id: "ds-jewel-link-legends-of-atlantis",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Jewel Link: Legends of Atlantis is a themed match-3 puzzle game in Avanquest's Jewel Link series. It uses the lost-city premise as a wrapper for board-clearing play, so GCX should not describe it as a broader strategy title. The better collector note is that it belongs to the DS's PAL-heavy casual puzzle shelf, alongside other Jewel Link destination variants.",
  },
  {
    id: "ds-jewel-link-safari-quest",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Jewel Link: Safari Quest is the safari-themed entry in Avanquest's DS Jewel Link puzzle line. Its core appeal is accessible match-3 play, board goals, and themed progression rather than campaign strategy or action controls. GCX should present it as a casual puzzle game for collectors tracking European DS budget releases and the many jewel-matching variants that filled the handheld's later years.",
  },
  {
    id: "ds-jewel-master-cradle-of-athena",
    sourceUrl: "https://www.esrb.org/ratings/29599/jewel-master-cradle-of-athena/",
    overview:
      "Jewel Master: Cradle of Athena is a Greek-mythology-themed match-3 puzzle game from Cerasus Media and Storm City Games. ESRB describes play as arranging resource tiles into groups of three, with puzzle imagery drawing from ancient Greek myth. GCX should classify it with the Cradle/Jewel Master puzzle-building lineage, where clearing boards produces resources and progression rather than direct character action.",
  },
  {
    id: "ds-jewel-master-cradle-of-egypt-2",
    sourceUrl: "https://www.nintendoworldreport.com/review/32898/jewel-master-cradle-of-egypt-2-nintendo-ds",
    overview:
      "Jewel Master: Cradle of Egypt 2 is a match-3 DS puzzle game published by Rising Star Games. Nintendo World Report describes the hook as gathering resources through puzzle play to construct Egypt, with Adventure Mode and Blitz Mode structuring the progression. GCX should emphasize civilization-building as the reward layer, while keeping the core genre clear: this is tile matching, not a broad simulation.",
  },
  {
    id: "ds-jewel-master-cradle-of-persia",
    sourceUrl: "https://en.wikipedia.org/wiki/Cradle_of_Rome",
    overview:
      "Jewel Master: Cradle of Persia belongs to the same Cradle/Jewel Master family as Cradle of Rome, using match-3 boards to gather resources and unlock construction-style progression. The Persian setting changes the theme, but the appeal remains casual tile matching with a light building reward loop. GCX should describe it as a themed puzzle release from Cerasus Media and Rising Star Games rather than a generic thinking-game entry.",
  },
  {
    id: "ds-jewel-master-cradle-of-rome-2",
    sourceUrl: "https://blogcritics.org/nintendo-ds-review-jewel-masters-cradle/",
    overview:
      "Jewel Master: Cradle of Rome 2 is a match-3 sequel where puzzle performance generates resources used to rebuild Rome through historical periods. Blogcritics notes 100 levels and a story mode built around becoming Caesar, with construction sequences layered between gem boards. GCX should identify it as a casual puzzle-building game and sequel in the Cradle of Rome line, not just another undifferentiated puzzler.",
  },
  {
    id: "ds-jewel-master-egypt",
    sourceUrl: "https://en.wikipedia.org/wiki/Cradle_of_Rome",
    overview:
      "Jewel Master: Egypt is a DS match-3 puzzle release in the broader Jewel Master and Cradle-style casual puzzle lineage. Like its companion titles, the loop is board clearing, resource-style rewards, and theme-based progression rather than direct action or full management simulation. For GCX, the clearest positioning is as an Egyptian-themed retail puzzle game from Storm City Games and Cerasus Media.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on publisher lists, ratings summaries, game databases, and specialist review sources.",
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
