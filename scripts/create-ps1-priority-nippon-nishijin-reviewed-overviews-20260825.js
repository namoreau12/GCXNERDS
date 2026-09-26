const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-nippon-nishijin-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps1.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "ps1",
    gameId: "ps1-nippon-golf-kyoukai-kanshuu-double-eagle",
    title: "Nippon Golf Kyoukai Kanshuu: Double Eagle",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00658.html",
    newOverview:
      "Nippon Golf Kyoukai Kanshuu: Double Eagle is a Japanese 3D golf game supervised under the Nippon Golf Kyoukai branding and published by Sunsoft. PSX DataCenter lists eight selectable golfers, four caddies, and three play modes: PGA tournament play, solo free play, and versus play. GCX should present it as a rules-forward import golf title for collectors who want Japan-specific sports releases rather than an arcade-style novelty game.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nippon-pro-mahjong-renmei-kounin-doujou-yaburi",
    title: "Nippon Pro Mahjong Renmei Kounin: Doujou Yaburi",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00793.html",
    newOverview:
      "Nippon Pro Mahjong Renmei Kounin: Doujou Yaburi is an officially branded Japanese mahjong release built around professional-mahjong presentation rather than casual tile matching. PSX DataCenter lists ten character opponents, selectable match rules, four tile designs, four tile-color options, and six board backgrounds. GCX should describe it as a serious riichi-mahjong import where the appeal is rules customization, opponent variety, and Japan Pro Mahjong League identity.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nippon-pro-mahjong-renmei-kounin-doujou-yaburi-2",
    title: "Nippon Pro Mahjong Renmei Kounin: Doujou Yaburi 2",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-03128.html",
    newOverview:
      "Nippon Pro Mahjong Renmei Kounin: Doujou Yaburi 2 follows the professional-mahjong format with eight Japanese professional players, rule selection, and customizable table presentation. PSX DataCenter notes four tile types, four tile-color options, six board backgrounds, and two core modes: Dojo Crash and Research. GCX should distinguish it from the first game as a more mode-defined sequel for players comparing the Naxat/Chat Noir mahjong line.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nippon-pro-mahjong-renmei-kounin-honkaku-pro-mahjong",
    title: "Nippon Pro Mahjong Renmei Kounin: Honkaku Pro Mahjong",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-03351.html",
    newOverview:
      "Nippon Pro Mahjong Renmei Kounin: Honkaku Pro Mahjong is the more straight-ahead professional mahjong entry in this PlayStation run. PSX DataCenter's Nice Price listing describes eight Japanese professional players, selectable opponents and match rules, three tile designs, five board backgrounds, and both beginner and standard play options. GCX should frame it as the approachable rules-training branch of the official mahjong series, not a generic puzzle title.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nippon-pro-mahjong-renmei-kounin-shin-tetsuman",
    title: "Nippon Pro Mahjong Renmei Kounin: Shin Tetsuman",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01653.html",
    newOverview:
      "Nippon Pro Mahjong Renmei Kounin: Shin Tetsuman is another Japan Pro Mahjong League-endorsed PlayStation mahjong release, but its hook is a larger roster of professional opponents. PSX DataCenter lists fifteen opponents, three tile styles, five board backgrounds, title-domination progression, free match play, and beginner support. GCX should call it out as a deeper pro-player mahjong package with collector value tied to the official league branding and named pros.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nippon-sumo-kyoukai-kounin-nippon-oozumou",
    title: "Nippon Sumo Kyoukai Kounin: Nippon Oozumou",
    sourceUrl: "https://vgcollect.com/item/192364",
    newOverview:
      "Nippon Sumo Kyoukai Kounin: Nippon Oozumou is Konami's Japan-only PlayStation sumo title, released with Nippon Sumo Association approval according to its title and collector listings. Rather than treating sumo as a mini-game, it belongs to the small group of dedicated sumo releases built around tournament identity, rikishi-style matchups, and ring-out rules. GCX should position it as a specialized combat-sports collectible with stronger appeal to sumo fans than to general wrestling-game players.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nishijin-pachinko-tengoku-ex",
    title: "Nishijin Pachinko Tengoku EX",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02175.html",
    newOverview:
      "Nishijin Pachinko Tengoku EX is a PlayStation pachinko adventure from KSS built around Nishijin-style parlor machines. PSX DataCenter describes a town setup where the player earns prizes from pachinko and uses them to furnish a home, with three playable pachinko machines. GCX should present it as a home-console pachinko sim with a light progression wrapper, useful for collectors tracking Japan's parlor-game software rather than casino compilations.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nishijin-pachinko-tengoku-vol-1",
    title: "Nishijin Pachinko Tengoku Vol. 1",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00614.html",
    newOverview:
      "Nishijin Pachinko Tengoku Vol. 1 starts the KSS PlayStation pachinko series with a gambling-adventure frame: the player moves through town trying to build wealth by playing different machines. PSX DataCenter notes a separate free mode and five pachinko machines with multiple zoom levels for closer play. GCX should identify it as the series foundation, mixing pachinko practice, parlor atmosphere, and light adventure progression.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nishijin-pachinko-tengoku-vol-2",
    title: "Nishijin Pachinko Tengoku Vol. 2",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00886.html",
    newOverview:
      "Nishijin Pachinko Tengoku Vol. 2 is the second KSS PlayStation release in the Nishijin pachinko line, continuing the Japan-only focus on parlor-machine simulation rather than broad casino variety. PSX DataCenter identifies it as a 1997 NTSC-J gambling title with KSS as developer and publisher and a multi-track disc presentation. GCX should separate it from Vol. 1 and EX as a series-completion entry for pachinko collectors, even where English gameplay documentation is thinner.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nishijin-pachinko-tengoku-vol-3",
    title: "Nishijin Pachinko Tengoku Vol. 3",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01761.html",
    newOverview:
      "Nishijin Pachinko Tengoku Vol. 3 keeps the series' pachinko-adventure structure while shifting the setup to a young man arriving in town and trying to get richer through local machines. PSX DataCenter notes that winnings can be used to move around town and buy furniture for the player's house. GCX should describe it as a pachinko sim with light life-progression dressing, best cataloged alongside Vol. 1, Vol. 2, and EX for series collectors.",
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
