const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-breakout-bricks-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "3ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "3ds",
    gameId: "3ds-breakout-defender",
    title: "Breakout Defender",
    sourceUrl: "https://www.mobygames.com/game/133498/breakout-defender/",
    newOverview:
      "Breakout Defender is a late Nintendo 3DS eShop brick-breaker from nuGAME built around one-on-one computer matches rather than a plain solo block-clearing board. The player has to protect their own bricks while sending the ball across the field to destroy the opponent's side across a short set of staged challenges. GCX should frame it as a small digital arcade release, with collector value tied mainly to late-era 3DS eShop preservation.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-breakout-defender-2",
    title: "Breakout Defender 2",
    sourceUrl: "https://www.mobygames.com/game/136128/breakout-defender-2/",
    newOverview:
      "Breakout Defender 2 is nuGAME's follow-up to its competitive Breakout-style 3DS formula, again centering on computer-opponent brick breaking across 15 levels. It is also connected to the Bricks Defender naming used elsewhere, which can make cataloging confusing. GCX should describe it as a compact arcade sequel that repeats and extends the defensive brick-breaker setup rather than implying a broad new feature set.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-breakout-defense",
    title: "Breakout Defense",
    sourceUrl: "https://www.nintendoworldreport.com/game/44523/breakout-defense-nintendo-3ds",
    newOverview:
      "Breakout Defense is a New 3DS-only nuGAME puzzle-arcade release that turns Breakout into a duel against an AI opponent. Instead of simply clearing a single screen, players work through 20 levels while defending their own blocks and trying to knock out the computer's side. It belongs in GCX as part of nuGAME's budget eShop brick-breaker line, useful for distinguishing the Defense branch from the later Defender/Bricks Defender entries.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-breakout-defense-2",
    title: "Breakout Defense 2",
    sourceUrl: "https://www.nintendoworldreport.com/game/45887/breakout-defense-2-nintendo-3ds",
    newOverview:
      "Breakout Defense 2 is the 3DS sequel to nuGAME's AI-versus-player brick-breaker setup. The structure remains lean: one player, New 3DS hardware, and a sequence of brick-breaking stages where protecting your own blocks matters as much as clearing the opponent's. GCX should present it as a narrowly scoped eShop sequel for completeness, not as a major reinvention of the arcade concept.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-brick-race",
    title: "Brick Race",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/New-Nintendo-3DS-Download-Software/BRICK-RACE-1131690.html",
    newOverview:
      "Brick Race is an RCMADIAX New Nintendo 3DS score-chaser with deliberately simple, old-school presentation. Players steer left and right to dodge traffic, survive as long as possible, and push for a higher score rather than progress through a campaign. Its GCX entry should make the New 3DS-only limitation clear and treat the game as a tiny arcade download whose appeal is quick-session reflex play.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-brick-thru",
    title: "Brick Thru",
    sourceUrl: "https://www.nintendoworldreport.com/game/46582/brick-thru-nintendo-3ds",
    newOverview:
      "Brick Thru is another one-player RCMADIAX New Nintendo 3DS eShop title, positioned as a small puzzle release rather than a full retail-style game. Public catalog records identify it as a 2018 digital puzzle game with a few screenshots and a simple release profile. GCX should keep the overview conservative: this is a budget eShop puzzle entry, notable mostly for RCMADIAX's run of minimalist New 3DS downloads.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bricks-defender",
    title: "Bricks Defender",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Bricks-Defender-1706538.html",
    newOverview:
      "Bricks Defender is nuGAME's 2020 Nintendo 3DS brick-breaker built around defending your own blocks while trying to destroy the computer opponent's blocks. The official listing describes a 15-level arcade structure, making it a tight score-and-stage challenge rather than a feature-heavy puzzle game. GCX should connect it to the Breakout Defender family and note that its value is mostly eShop-library completeness.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bricks-defender-2",
    title: "Bricks Defender 2",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Bricks-Defender-2-1718252.html",
    newOverview:
      "Bricks Defender 2 continues nuGAME's compact 3DS brick-breaker format: 15 levels, a computer opponent, and a defend-your-side objective layered over traditional paddle-and-ball play. The sequel is best understood as a same-style continuation for players who wanted more of the first game's arcade loop. GCX should avoid overselling it and instead make the versioning and regional naming clear for collectors.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bricks-defender-3",
    title: "Bricks Defender 3",
    sourceUrl: "https://www.mobygames.com/game/158360/bricks-defender-3/",
    newOverview:
      "Bricks Defender 3 is a later nuGAME entry in the same 3DS brick-breaker subseries, released after the first two Bricks Defender titles. It keeps the same core idea of facing a computer opponent through 15 brick-breaking levels, so the main database value is separating the sequel records and dates accurately. GCX should present it as a late eShop arcade follow-up for completists rather than a mechanically distinct franchise entry.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bricks-defender-4",
    title: "Bricks Defender 4",
    sourceUrl: "https://www.nintendoworldreport.com/game/56154/bricks-defender-4-nintendo-3ds",
    newOverview:
      "Bricks Defender 4 is a 2021 nuGAME Nintendo 3DS puzzle-arcade release and one of the very late numbered entries in the Bricks Defender line. Like the surrounding games, it is a single-player brick-breaker focused on computer-opponent play rather than a large content suite. GCX should treat it as a late-life 3DS eShop artifact, useful for tracking how budget publishers continued releasing small digital titles near the platform's end.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing 3DS game record for ${gameId}`);
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
      row.platformSlug,
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority 3DS weak-template replacement with source-backed GCX editorial overview.",
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
