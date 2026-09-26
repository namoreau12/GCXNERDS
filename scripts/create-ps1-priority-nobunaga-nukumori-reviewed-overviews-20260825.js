const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-nobunaga-nukumori-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps1.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ps1-nobunaga-no-yabou-zenkokuban",
    title: "Nobunaga no Yabou: Zenkokuban",
    sourceUrl: "https://serialstation.com/games/e9e5f56a-c9c7-4d41-84bb-913643bfcb2c",
    newOverview:
      "Nobunaga no Yabou: Zenkokuban is a PlayStation release of Koei's early Nobunaga's Ambition strategy design, cataloged by SerialStation with Japanese PS1 title IDs SLPS-01210 and SLPM-86605. GCX should frame it as a foundational Sengoku grand-strategy entry: slower, menu-driven, and focused on province control, resource decisions, and warlord management rather than the denser systems of Koei's later PS1 installments.",
  },
  {
    gameId: "ps1-nobunaga-shippuuki-ko",
    title: "Nobunaga Shippuuki: Ko",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00337.html",
    newOverview:
      "Nobunaga Shippuuki: Ko is a Japan-only PlayStation strategy game from Bullet-Proof Software that mixes historical adventure scenes with turn-based tactical battles. PSX DataCenter describes play as split between moving through towns and talking to characters as Nobunaga, then issuing orders to units in strategy encounters. GCX should position it as a lighter, story-adventure take on Sengoku strategy rather than a pure Koei-style grand campaign.",
  },
  {
    gameId: "ps1-noel-3-mission-on-the-line",
    title: "NOeL 3: Mission on the Line",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01895.html",
    newOverview:
      "NOeL 3: Mission on the Line shifts the NOeL series into a computer-network thriller built around clearing a terrorist virus from a digital grid. PSX DataCenter describes using antivirus tools created by Yuka Okano and timing button presses to destroy infected network squares. GCX should describe it as a character-driven adventure with light hacking-style mechanics, not simply another dating visual novel.",
  },
  {
    gameId: "ps1-noel-la-neige",
    title: "NOeL: La Neige",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01190.html",
    newOverview:
      "NOeL: La Neige is a three-disc PlayStation adventure/dating entry from Pioneer that continues the series' emphasis on phone-style conversations, character schedules, and branching relationship scenes. PSX DataCenter catalogs the Special Edition release as an NTSC-J adventure/dating game with Pioneer as both developer and publisher. GCX should present it as a multi-disc import visual-adventure where voice, character interaction, and route management are the core appeal.",
  },
  {
    gameId: "ps1-noel-la-neige-special",
    title: "NOeL: La Neige Special",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01515.html",
    newOverview:
      "NOeL: La Neige Special is the later single-disc special release of Pioneer's NOeL: La Neige, still cataloged as an NTSC-J adventure/dating title. PSX DataCenter lists a 6 August 1998 release, Pioneer development and publishing credits, and serial SLPS-01515. GCX should distinguish it from the earlier multi-disc edition as the compact collector variant of the same character-focused NOeL chapter.",
  },
  {
    gameId: "ps1-noel-not-digital",
    title: "NOeL: Not Digital",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-91043.html",
    newOverview:
      "NOeL: Not Digital is the earlier NOeL adventure in which the player tries to build enough knowledge and connection with its cast to secure a Christmas date. PSX DataCenter's PlayStation the Best listing describes the premise around learning about the girls, calling them through a phone-like interface, and watching their responses through video sequences. GCX should frame it as a conversation-management import with FMV-era presentation rather than generic visual-novel filler.",
  },
  {
    gameId: "ps1-noon",
    title: "Noon",
    sourceUrl: "https://www.psxdatacenter.com/games/J/N/SLPM-86063.html",
    newOverview:
      "Noon: New Type Action Game is a Micro Cabin puzzle-action game for up to four players. PSX DataCenter describes an overhead setup that mixes Bomberman-style movement with puzzle play, asking players to cover opponents' fields with bombs. GCX should highlight it as a competitive party-puzzle import whose appeal is short-session multiplayer pressure rather than solitary logic puzzles.",
  },
  {
    gameId: "ps1-not-treasure-hunter",
    title: "Not Treasure Hunter",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00274.html",
    newOverview:
      "Not Treasure Hunter is a Japan-only polygonal action-adventure about exploring ancient-civilization ruins, fighting through encounters, and making choices that can abruptly branch the story. PSX DataCenter notes that player answers can lead to quick deaths or different endings, while the publisher description emphasizes movie-like camera work and real-time adventure presentation. GCX should pitch it as an oddball cinematic adventure import with cult curiosity value.",
  },
  {
    gameId: "ps1-novels-game-center-arashi-r",
    title: "Novels: Game Center Arashi R",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02009.html",
    newOverview:
      "Novels: Game Center Arashi R adapts the classic Game Center Arashi manga/anime world into a PlayStation sound-novel format. PSX DataCenter describes five stories, four available from the start, with choices leading to different endings and a point system tracking the player's progress. GCX should describe it as a text-heavy licensed adventure for readers interested in Japan's arcade-culture nostalgia as much as traditional game mechanics.",
  },
  {
    gameId: "ps1-nukumori-no-naka-de",
    title: "Nukumori no Naka de",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPM-86880.html",
    newOverview:
      "Nukumori no Naka de: In the Warmth is a late Japanese PlayStation adventure about Atsushi Kanda joining a high-school club and spending time with its members through activities such as excursions and athletics. PSX DataCenter notes Japanese voice acting and a cast of male and female club members, giving it the shape of a school-life character adventure. GCX should present it as a relationship-and-club-life import whose value depends heavily on Japanese reading comfort.",
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
