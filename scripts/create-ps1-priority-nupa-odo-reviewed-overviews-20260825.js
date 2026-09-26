const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-nupa-odo-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps1.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ps1-nupa-numeric-paint-puzzle",
    title: "NuPa: Numeric Paint Puzzle",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00294.html",
    newOverview:
      "NuPa: Numeric Paint Puzzle is a Japan-only PlayStation nonogram game from Jupiter and Tomy, predating many later console Picross-style releases. PSX DataCenter describes 300 stages, a history mode about two robot aliens arriving on Earth, and a two-player versus mode. GCX should position it as a substantial picture-logic puzzle import, especially notable because Jupiter is closely associated with the broader nonogram/Picross lineage.",
  },
  {
    gameId: "ps1-nurse-monogatari",
    title: "Nurse Monogatari",
    sourceUrl: "https://www.honestgamers.com/listings/0/6/0/953/0/jp/all/1/1.html",
    newOverview:
      "Nurse Monogatari is a Japan-only Mycom PlayStation adventure/graphic novel release, listed by HonestGamers with a 15 April 1999 Japanese release and Mycom publishing credit. The title sits in the nursing-themed adventure space rather than the later child-focused Pika Pika Nurse simulation line. GCX should describe it as a scarce Japanese graphic-adventure import where genre, language, and SLPS-01939 identification matter more than broad gameplay familiarity.",
  },
  {
    gameId: "ps1-nyan-to-wonderful",
    title: "Nyan to Wonderful",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00442.html",
    newOverview:
      "Nyan to Wonderful is a Pandora Box and Banpresto pet simulation about raising and training cats or dogs. PSX DataCenter notes multiple cat and dog species, a 3D engine, and different camera angles, while cataloging confirms the 30 August 1996 Japanese PlayStation release. GCX should frame it as an early 3D virtual-pet import with animal-care appeal, not a generic management sim.",
  },
  {
    gameId: "ps1-oasis-road",
    title: "Oasis Road",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-01899.html",
    newOverview:
      "Oasis Road is an Idea Factory RPG set in a future desert world where a group of kids explores old-city ruins, searches for rare items, and opens new travel routes. PSX DataCenter describes outcomes changing based on the objects found, giving the game more of a survival-travel and exploration identity than a standard party quest. GCX should present it as a strange late-1990s Idea Factory RPG built around route discovery and ruins scavenging.",
  },
  {
    gameId: "ps1-ocha-no-ma-battle",
    title: "Ocha no ma Battle",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPM-86681.html",
    newOverview:
      "Ocha no ma Battle is a Hori party minigame collection for PlayStation, released in a special box with four HPS-102 controllers. PSX DataCenter lists one- and two-player play, 16 selectable characters, versus and single modes, record tracking, and minigames such as using a screwdriver, copying fighter movements, tree climbing, diving for treasure, racing, and stopping before a cliff. GCX should call it a controller-bundle party curiosity, not a puzzle game.",
  },
  {
    gameId: "ps1-ochan-no-oekaki-logic",
    title: "Ochan no Oekaki Logic",
    sourceUrl: "https://en.wikipedia.org/wiki/O-Chan_no_Oekaki_Logic",
    newOverview:
      "Ochan no Oekaki Logic is Sunsoft's Japan-exclusive Hebereke spin-off built around nonogram picture puzzles. Public series documentation describes the PlayStation original as the first release in September 1995, with tutorial, edit, multiplayer, and puzzle-grid play, plus a cancelled European Oh-Chan's Logic version. GCX should connect it to Hebereke and nonogram history instead of presenting it as anonymous puzzle software.",
  },
  {
    gameId: "ps1-ochan-no-oekaki-logic-2",
    title: "Ochan no Oekaki Logic 2",
    sourceUrl: "https://en.wikipedia.org/wiki/O-Chan_no_Oekaki_Logic",
    newOverview:
      "Ochan no Oekaki Logic 2 is Sunsoft's 1996 PlayStation follow-up to the Hebereke-themed nonogram game. Series documentation notes that the sequel added new puzzles, music tracks, updated visuals, and a painting mode where the puzzle grid is filled with color. GCX should distinguish it as the expanded color-puzzle sequel rather than duplicating the same generic logic-game description from the first entry.",
  },
  {
    gameId: "ps1-ochan-no-oekaki-logic-3",
    title: "Ochan no Oekaki Logic 3",
    sourceUrl: "https://en.wikipedia.org/wiki/O-Chan_no_Oekaki_Logic",
    newOverview:
      "Ochan no Oekaki Logic 3 is the final PlayStation entry in Sunsoft's Hebereke-adjacent nonogram subseries, released in Japan on 11 January 2001. Series documentation says it was exclusive to PlayStation and used the first game's engine, with more levels but fewer of the second game's additions. GCX should frame it as a late budget-era puzzle sequel for players collecting the full O-Chan logic line.",
  },
  {
    gameId: "ps1-oda-nobunaga-den",
    title: "Oda Nobunaga Den",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-01595.html",
    newOverview:
      "Oda Nobunaga Den is Koei's 1998 PlayStation strategy game based on the life of Oda Nobunaga and part of Koei's Eiketsuden-style historical strategy branch. PSX DataCenter describes army building with soldiers and archers, weapon development and upgrades, pre-battle army selection, advisor input, and battlefield engagements. GCX should separate it from Nobunaga's Ambition grand strategy and present it as a campaign-battle historical strategy entry.",
  },
  {
    gameId: "ps1-odo-odo-oddity",
    title: "Odo Odo Oddity",
    sourceUrl: "https://www.hardcoregaming101.net/odo-odo-oddity/",
    newOverview:
      "Odo Odo Oddity is an IDC PlayStation rail shooter about three children pulled into a fantasy dimension after opening a forbidden book. Hardcore Gaming 101 describes Gikugiku strapping balloons to his back to rescue Funifuni and Hoyoyo, with inventive level designs and a friendly presentation. GCX should correct the old puzzle label and pitch it as a visually unusual Japan-only rail shooter with cult import appeal.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing PS1 game record for ${gameId}`);
  return game.description || game.gcxOverview || game.overview || "";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const header = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];
const csv = [
  header.join(","),
  ...rows.map((row) =>
    [
      "ps1",
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority PS1 weak-template replacement with source-backed GCX editorial overview.",
      row.newOverview,
      "approved",
      "GCX Editorial",
    ]
      .map(csvCell)
      .join(",")
  ),
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rowCount: rows.length }, null, 2));
