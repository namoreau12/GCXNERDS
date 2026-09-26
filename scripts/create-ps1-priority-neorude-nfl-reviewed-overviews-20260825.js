const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-neorude-nfl-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps1.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "ps1",
    gameId: "ps1-neorude-kizamareta-monshou",
    title: "Neorude: Kizamareta Monshou",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02417.html",
    newOverview:
      "Neorude: Kizamareta Monshou is the third PlayStation entry in Technosoft's unusual Neorude line, moving to a new cast after the first two games. The setup begins with the Neorude airship crashing in a snowy mountain cave, then keeps the series' pointer-led adventure structure and RPG battles. GCX should describe it as a Japan-only import RPG/adventure sequel built around cursor interaction, item use, and adjustable battle pace rather than standard direct character control.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nessa-no-hoshi",
    title: "Nessa no Hoshi",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00913.html",
    newOverview:
      "Nessa no Hoshi is Itochu's Japan-only two-disc PlayStation adventure with first-person exploration scenes and 3D fighting encounters. Players search environments for items that help them survive fights, then face bosses that gate progress between scenes. GCX should frame it as an odd desert-planet action-adventure with puzzle-item survival pressure, not a conventional point-and-click adventure or simple fighting game.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-netz-magazine-altezza",
    title: "Netz Magazine: Altezza",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPM-86163.html",
    newOverview:
      "Netz Magazine: Altezza is a promotional Toyota Altezza racing and showcase disc developed by Dentsu for PlayStation. Source listings describe it as part of the Netz Toyota line and note that it was not sold through normal retail, with play focused on learning about the car's features and testing it on a circuit. GCX should flag it as a branded Japanese automotive collectible as much as a racing game.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-next-king-koi-no-sennen-oukoku",
    title: "Next King: Koi no Sennen Oukoku",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00859.html",
    newOverview:
      "Next King: Koi no Sennen Oukoku is a Bandai-published Alfa System project that mixes simulation, adventure, RPG, and board-game/table-RPG elements. Instead of playing like a pure visual novel, it asks players to move through a structured relationship-and-adventure format with character events and role-playing progression. GCX should position it as a Japanese hybrid romance RPG/board-game curiosity for import collectors, not as a standard text-only dating sim.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nfl-full-contact",
    title: "NFL Full Contact",
    sourceUrl: "https://game-rave.com/?p=8985",
    newOverview:
      "NFL Full Contact is Konami's 1996 PlayStation football release from Robin Antonick Games, built for one or two players and arriving before the PS1 football field settled around Madden, GameDay, and later NFL 2K. Its collector identity is straightforward: a licensed Konami football disc with a dedicated Robin Antonick development credit and early-system sports positioning. GCX should treat it as a mid-1990s NFL alternative rather than lumping it into Sony's GameDay lineage.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nfl-gameday",
    title: "NFL GameDay",
    sourceUrl: "https://en.wikipedia.org/wiki/NFL_GameDay_(video_game)",
    newOverview:
      "NFL GameDay is Sony's first PlayStation football flagship, developed by Sony Interactive Studios America as a direct Madden challenger for the 1995 season. It used motion-captured animation, carried William Floyd on the cover, and became one of the early U.S. PlayStation sports success stories. GCX should emphasize its role as a first-party football foundation piece for PlayStation collectors, especially when comparing long-box copies, manuals, and early SCEA branding.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nfl-gameday-99",
    title: "NFL GameDay 99",
    sourceUrl: "https://en.wikipedia.org/wiki/NFL_GameDay_(video_game_series)#NFL_GameDay_99",
    newOverview:
      "NFL GameDay 99 is the fourth GameDay entry and the first in this stretch under the 989 Sports label, with Terrell Davis on the cover and a 1998 PlayStation release. It belongs to the period when Sony's football line was leaning into DualShock-era contact, passing control, and defensive AI improvements to stay competitive with Madden. GCX should distinguish it as the post-GameDay 98 follow-up in the PS1 football arms race, not just another annual roster update.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nfl-gameday-2000",
    title: "NFL GameDay 2000",
    sourceUrl: "https://en.wikipedia.org/wiki/NFL_GameDay_(video_game_series)#NFL_GameDay_2000",
    newOverview:
      "NFL GameDay 2000 continues Sony's annual PlayStation football series under 989 Sports, again using Terrell Davis cover positioning while pushing the line into the 1999 season. Its importance is not just the year on the box; it represents GameDay's late-PS1 effort to keep pace through animation, play-calling, and presentation as Madden remained the obvious rival. GCX should call out the 989 Sports branding and late-generation sports-library context for collectors.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nfl-gameday-2001",
    title: "NFL GameDay 2001",
    sourceUrl: "https://en.wikipedia.org/wiki/NFL_GameDay_(video_game_series)#NFL_GameDay_2001",
    newOverview:
      "NFL GameDay 2001 is the Marshall Faulk-cover entry that straddled PlayStation and PlayStation 2, making the PS1 version part of a cross-generation sports handoff. Source material ties it to 989 Sports and the 2000 football season, while retail descriptions highlight expanded player modeling and motion-captured moves. GCX should explain that collector interest comes from its late-PS1 annual-sports position and its connection to Sony's move into PS2 football.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nfl-gameday-2002",
    title: "NFL GameDay 2002",
    sourceUrl: "https://en.wikipedia.org/wiki/NFL_GameDay_(video_game_series)#NFL_GameDay_2002",
    newOverview:
      "NFL GameDay 2002 is the Donovan McNabb-cover installment from the period when GameDay still served both PlayStation and PlayStation 2 owners. On PS1, that makes it a late-life football release aimed at players who had not yet moved fully to newer hardware. GCX should present it as part of the shrinking but still active PS1 sports tail, with value tied to condition, complete packaging, and how collectors track yearly 989 Sports entries.",
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
      row.platformSlug,
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
