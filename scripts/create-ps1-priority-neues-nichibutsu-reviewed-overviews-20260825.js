const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-neues-nichibutsu-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps1.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "ps1",
    gameId: "ps1-neues",
    title: "Neues",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02871.html",
    newOverview:
      "Neues is a Japan-only PlayStation RPG from Imageworks and Escot, but its collector hook is more specific than the broad RPG label suggests. The game uses a fantasy-adventure setup with party progression and scenario-driven exploration, putting it in the late-PS1 import RPG shelf rather than the better-known mainstream PlayStation RPG canon. GCX should frame it as an obscure Japanese-language role-playing release where condition, spine card, and import completeness matter more than broad name recognition.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nfl-gameday-2003",
    title: "NFL GameDay 2003",
    sourceUrl: "https://en.wikipedia.org/wiki/NFL_GameDay_(video_game_series)#NFL_GameDay_2003",
    newOverview:
      "NFL GameDay 2003 is the Tom Brady-cover entry in Sony's long-running football series, released for both PlayStation and PlayStation 2 as 989 Sports tried to keep the brand active across generations. On original PlayStation, its appeal is less about technical novelty and more about being one of the late annual sports releases that kept the platform alive. GCX should identify it as a cross-generation GameDay installment and a Brady-era football collectible.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nfl-gameday-2004",
    title: "NFL GameDay 2004",
    sourceUrl: "https://game-rave.com/?p=11465",
    newOverview:
      "NFL GameDay 2004 is the LaDainian Tomlinson-cover PlayStation football entry from Sony Computer Entertainment and 989 Sports. Game-Rave lists the PS1 release with support for up to eight players through Multi-Tap setups, plus General Manager-style football framing alongside standard play. GCX should present it as a very late PS1 sports release whose collector interest comes from annual-series completion, cover-athlete history, and the platform's long tail.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nfl-gameday-2005",
    title: "NFL GameDay 2005",
    sourceUrl: "https://psxdatacenter.com/games/U/N/SCUS-94695.html",
    newOverview:
      "NFL GameDay 2005 is the Derrick Brooks-cover finale for Sony's football line on the original PlayStation. PSX DataCenter describes a late-system football package with Exhibition, Season, Tournament, Practice, and General Manager modes tied to the 2003-2004 NFL season. GCX should call out its unusual position as a 2004 PS1 release and the final GameDay entry, which makes complete copies more interesting than the typical annual sports disc.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nhl-open-ice-2-on-2-challenge",
    title: "NHL Open Ice: 2 on 2 Challenge",
    sourceUrl: "https://en.wikipedia.org/wiki/NHL_Open_Ice",
    newOverview:
      "NHL Open Ice: 2 on 2 Challenge is Midway's arcade hockey answer to NBA Jam, ported to PlayStation by Avalanche Software with updated 1996-97 rosters. The game is built around fast two-on-two action, big hits, exaggerated scoring, and arcade presentation instead of realistic season simulation. GCX should flag it as one of the key arcade-sports hockey releases on PS1, especially for players who collect Midway's over-the-top sports lineage.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nhl-powerplay-98",
    title: "NHL PowerPlay 98",
    sourceUrl: "https://game-rave.com/?p=9519",
    newOverview:
      "NHL PowerPlay 98 is Radical Entertainment's Virgin-published PlayStation hockey sim, released in 1997 with official teams, player names, and a more traditional rink-sports structure. Game-Rave lists Multi-Tap support for up to eight players, while other source material notes its use of motion capture and its place after NHL Powerplay '96. GCX should distinguish it from arcade hockey entries by emphasizing its 3D sim ambitions and late-1990s hockey competition.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nhl-rock-the-rink",
    title: "NHL Rock the Rink",
    sourceUrl: "https://en.wikipedia.org/wiki/NHL_Rock_the_Rink",
    newOverview:
      "NHL Rock the Rink is EA Canada's 2000 PlayStation hockey release that leans into exaggerated, aggressive arcade play instead of EA's usual simulation branding. Contemporary review summaries describe it as a frantic, rougher take on hockey with the kind of appeal players would expect after Midway's Open Ice. GCX should explain it as EA's oddball arcade-hockey experiment on PS1, useful for collectors who separate NHL sims from extreme sports-style spinoffs.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nibiiro-no-koubou-32-nin-no-sensha-chou",
    title: "Nibiiro no Koubou: 32-nin no Sensha Chou",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00721.html",
    newOverview:
      "Nibiiro no Koubou: 32-nin no Sensha Chou is a Japan-only real-time 3D tank strategy simulation from Shangri-La. PSX DataCenter describes 68 tank models and an opening scenario in the Eurodyell Republic during a 1929 snowstorm, with missions centered on commanding a tank and destroying enemy armor. GCX should present it as a military-vehicle import strategy title, not a generic tactics game, with language and region status shaping its collector value.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nice-cats",
    title: "Nice Cats",
    sourceUrl: "https://psxdatacenter.com/games/P/N/SLES-02960.html",
    newOverview:
      "Nice Cats is a PAL PlayStation children's multimedia release from The Code Monkeys and Midas Interactive, built around a cartoon-film presentation, jigsaw puzzles, and a coloring activity. PSX DataCenter identifies the story as following two cats, Lucy and Lionel, on vacation with their owner, with multi-language European support. GCX should correct the current RPG label and treat it as budget kids' interactive media with Dingo-style cartoon-era collector context.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nichibutsu-mahjong-joshikou-meijinsen",
    title: "Nichibutsu Mahjong: Joshikou Meijinsen",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00038.html",
    newOverview:
      "Nichibutsu Mahjong: Joshikou Meijinsen is an early Japanese PlayStation mahjong release from Nihon Bussan/Nichibutsu. PSX DataCenter describes a female mahjong tournament structure, with free-play floors leading into tournament play inside a hotel setting. GCX should label it as a Japanese mahjong gambling/table-game entry rather than a generic puzzle game, with interest tied to Nichibutsu's long arcade and home mahjong history.",
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
