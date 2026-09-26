const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-knerten-koisuru-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "ds",
    gameId: "ds-knerten-gets-married",
    title: "Knerten Gets Married",
    sourceUrl: "https://www.pricecharting.com/game/pal-nintendo-ds/knerten-gets-married",
    newOverview:
      "Knerten Gets Married is a PAL-region Nintendo DS children's adventure based on the Norwegian Knerten/Lillebror family-film property, developed by Ravn Studio and published by PAN Vision. The game is built around gentle activity scenes rather than combat, with tasks such as helping in the shop, making waffles, riding Junior's red bicycle, and playing through story moments with Knerten and Caroline. GCX should mark it as a Nordic licensed kids' title with collector interest tied to region, language, and Ravn's local DS catalog.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-knigge-spielend-zum-guten-benehmen",
    title: "Knigge: Spielend zum guten Benehmen",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    newOverview:
      "Knigge: Spielend zum guten Benehmen is a German-language etiquette and manners trainer for Nintendo DS from Playtainment and Bright Future. The title belongs with DS utility and learning software: the hook is practicing social behavior, rules, and everyday conduct through small interactive lessons rather than playing a conventional campaign. GCX should describe it as a Europe-focused educational release for collectors tracking regional lifestyle software, not as a standard school-subject drill game.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-knock-em-downs-world-s-fair",
    title: "Knock 'Em Downs: World's Fair",
    sourceUrl: "https://www.esrb.org/ratings/26291/knock-em-downs-worlds-fair/",
    newOverview:
      "Knock 'Em Downs: World's Fair is an unusual Nintendo DS adventure RPG tied to Bayer's Didget glucose-monitoring ecosystem. ESRB material describes a fairground structure with traversal, mini-games such as fishing, mazes, and target-hitting, plus turn-based battles against toy-like enemies. GCX should flag it as a medically adjacent collector curiosity: a game cartridge with carnival RPG play, but one whose context is inseparable from the Didget diabetes-management hardware bundle.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-know-how",
    title: "Know How",
    sourceUrl: "https://www.mobygames.com/game/40054/know-how-think-and-play-outside-the-box/",
    newOverview:
      "Know How: Think and Play Outside the Box is a DS block-sliding puzzle game from Bitfield and cdv Software. The core objective is moving a treasure chest off the board to an exit square while first shifting obstructing stones out of the way. GCX should frame it as a compact logic-puzzle release built around spatial planning and short challenge boards, with value mainly for puzzle collectors and European DS-library completionists.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-know-how-2",
    title: "Know How 2",
    sourceUrl: "https://www.mobygames.com/game/49241/know-how-2-think-and-play-outside-the-box/",
    newOverview:
      "Know How 2: Think and Play Outside the Box expands Bitfield's DS puzzle formula into a larger treasure-hunt package. MobyGames lists 360 puzzles across different modes, including an Adventure Mode built around solving treasure-map challenges to unlock historic treasures, plus Free Play and DS multiplayer speed-puzzling. GCX should distinguish it from the first game by emphasizing its bigger puzzle count, looser story framing, and competitive local-play angle.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kodawari-saihai-simulation-ocha-no-ma-pro-yakyuu-ds",
    title: "Kodawari Saihai Simulation: Ocha no Ma Pro Yakyuu DS",
    sourceUrl: "https://solarisjapan.com/products/kodawari-saihai-simulation-ocha-no-ma-pro-yakyuu-ds",
    newOverview:
      "Kodawari Saihai Simulation: Ocha no Ma Pro Yakyuu DS is a Japan-only baseball management simulation from Now Production. Rather than presenting baseball as an arcade batting-and-fielding game, the title's own name and catalog positioning point toward dugout decision-making, team direction, and pro-yakyuu strategy. GCX should list it as a niche Japanese sports-sim import, most relevant to collectors who separate baseball management titles from action baseball games.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kodawari-saihai-simulation-ocha-no-ma-pro-yakyuu-ds-2010-nendohan",
    title: "Kodawari Saihai Simulation: Ocha no Ma Pro Yakyuu DS 2010 Nendohan",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/134132-kodawari-saihai-simulation-ocha-no-ma-pro-yakyuu-ds-2010-nendohan",
    newOverview:
      "Kodawari Saihai Simulation: Ocha no Ma Pro Yakyuu DS 2010 Nendohan is the 2010 yearly update to Now Production's DS baseball-management line. Public database listings identify it as a Japan-only Nintendo DS sports release from April 2010, so GCX should treat it as an annualized roster-era companion to the earlier Ocha no Ma Pro Yakyuu DS. Its collector angle is the 2010 edition status, not a dramatically different genre identity.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-koh-lanta-survie-dans-la-jungle",
    title: "Koh-Lanta: Survie Dans La Jungle!",
    sourceUrl: "https://www.jeuxvideo.com/jeux/nintendo-ds/00032438-koh-lanta-survie-dans-la-jungle.htm",
    newOverview:
      "Koh-Lanta: Survie Dans La Jungle! is a French Nintendo DS party/adventure game based on the Koh-Lanta survival reality-TV format. Jeuxvideo.com describes a jungle-survival setup where players participate in group life, form alliances, and compete in trials to win the game. GCX should explain it as a regional TV-license release built around social-survival tasks and mini-game-style challenges, with language and PAL availability central to collecting it.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-koinu-de-kururin",
    title: "Koinu de Kururin",
    sourceUrl: "https://nintendoeverything.com/new-puzzle-game-launching-for-wiiware-in-japan/",
    newOverview:
      "Koinu de Kururin is MTO's Japan-only Nintendo DS dog-themed puzzle release, connected to the same puppy-matching idea later noted for the WiiWare version Minna de Asobou: Koinu de Kururin. The play concept centers on lining up same-color puppies and connecting groups to matching dog houses to clear them from the screen. GCX should label it as a cute color-matching puzzle import from MTO, not as a pet-care sim despite the dog theme.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-koisuru-purin-koi-wa-daibouken-dr-kanmi-no-yabou",
    title: "Koisuru Purin! Koi wa Daibouken! Dr. Kanmi no Yabou!?",
    sourceUrl: "https://gbatemp.net/threads/koisuru-purin-translation-pudding-in-love.476436/",
    newOverview:
      "Koisuru Purin! Koi wa Daibouken! Dr. Kanmi no Yabou!? is a Japan-only Nintendo DS action-platform adventure developed by Tamsoft and published by Tryfirst. Fan-translation notes describe it as an approachable platformer with lively music, which better matches the game's side-view action identity than the current generic adventure label. GCX should present it as a quirky import platformer, useful for collectors tracking small Japanese DS releases and Tamsoft's non-mainstream catalog.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing DS game record for ${gameId}`);
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
      "Priority DS weak-template replacement with source-backed GCX editorial overview.",
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
