const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-gbreaker-jphoenix-reviewed-overviews-2026-08-25.csv"
);

const ps2ListSource = "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28A%E2%80%93K%29";

const rewrites = [
  {
    id: "ps2-kikou-busou-g-breaker-2-doumei-no-hangeki",
    sourceUrl: "https://solarisjapan.com/products/kikou-busou-g-breaker-2-doumei-no-hangeki",
    overview:
      "Kikou Busou G-Breaker 2: Doumei no Hangeki is a Japanese PlayStation 2 mecha release from Atelier-Sai and Sunrise Interactive. Catalog records identify the August 8, 2002 release, SLPS-25124, and Sunrise Interactive branding, while broader PS2 list data places it alongside the other G-Breaker titles. GCX should describe it as a niche Sunrise mecha/action-simulation import rather than a generic RPG, with collector interest tied to the G-Breaker subseries, NTSC-J region, and Sunrise's anime-adjacent game catalog.",
  },
  {
    id: "ps2-kikou-busou-g-breaker-daisanshi-cloudia-taisen",
    sourceUrl: ps2ListSource,
    overview:
      "Kikou Busou G-Breaker: Daisanshi Cloudia Taisen is one of Atelier-Sai and Sunrise Interactive's 2002 PlayStation 2 G-Breaker releases, listed for April 25, 2002 in Japan. The title sits in the same Cloudia-centered mecha branch as Legend of Cloudia and Doumei no Hangeki, so GCX should frame it as a Japanese action/simulation or strategy-adjacent robot game, not a broad party-building RPG. The useful collector notes are its Sunrise Interactive publishing credit, Japan-only status, and relationship to the surrounding G-Breaker PS2 trilogy.",
  },
  {
    id: "ps2-kikou-busou-g-breaker-legend-of-cloudia",
    sourceUrl: "https://www.igdb.com/games/kikou-busou-g-breaker-legend-of-cloudia",
    overview:
      "Kikou Busou G-Breaker: Legend of Cloudia is a Japan-only PlayStation 2 action/simulation game developed by Atelier-Sai and published by Sunrise Interactive. IGDB-style catalog records and soundtrack archives place it in 2002, with the broader PS2 list giving a November 7 Japanese release. GCX should present it as the Cloudia storyline's later G-Breaker entry, valuable to collectors because it belongs to a small Sunrise mecha run where series order, region, and complete packaging matter more than mainstream recognition.",
  },
  {
    id: "ps2-kikou-heidan-j-phoenix",
    sourceUrl: "https://kotaku.com/games/kikou-heidan-j-phoenix",
    overview:
      "Kikou Heidan J-Phoenix is Takara's 2001 PlayStation 2 mech action game, built around acquiring and combining robot parts and fighting alongside other characters. Kotaku's game database summary describes a map structure that has players moving through branched routes to take enemy positions, and notes that the Joshou-hen release functions like a prologue/trial version with transferable data. GCX should describe it as a customization-heavy JPN mech action title rather than a simple stage brawler.",
  },
  {
    id: "ps2-kikou-heidan-j-phoenix-2",
    sourceUrl: "https://www.play-asia.com/en/kikou-heidan-j-phoenix-2/13/702lg",
    overview:
      "Kikou Heidan J-Phoenix 2 is a 2004 PlayStation 2 sequel in Takara's robot-combat series, published by Atlus in Japan. Play-Asia describes battles on land and at the fringes of outer space, weightless robot fighting, lock-on shooting, and Armored Core-like part upgrading for attack and evasion. GCX should frame it as a mech customization/action sequel where the hook is building and tuning robots for combat scenarios, not merely direct-control action with generic hazards.",
  },
  {
    id: "ps2-kikou-heidan-j-phoenix-2-joshouhen",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-62339.html",
    overview:
      "Kikou Heidan J-Phoenix 2 Joshouhen is the Japanese PS2 prologue release for J-Phoenix 2. PSXDataCenter describes it as a return to the J-Phoenix franchise with mech fighting action, Japanese menus/gameplay, and multiple modes including Story Mode with 60 missions, Marginal Mode survival, and Survivor Meteor puzzle play. GCX should explain it as an introductory/prologue-style companion whose collector relevance comes from how it leads into J-Phoenix 2 and preserves franchise data/context.",
  },
  {
    id: "ps2-kikou-heidan-j-phoenix-joshouhen",
    sourceUrl: "https://kotaku.com/games/kikou-heidan-j-phoenix",
    overview:
      "Kikou Heidan J-Phoenix Joshouhen is the earlier prologue/trial-style PlayStation 2 release tied to Takara's first J-Phoenix. Kotaku's summary of the main game notes that Joshou-hen was released before Kikou Heidan J-Phoenix, functions like a trial version, and can provide usable data for the full game. GCX should describe it as a franchise setup disc rather than a standalone sequel: important for completionists because it sits before the main 2001 J-Phoenix release and links into its progression.",
  },
  {
    id: "ps2-kikou-heidan-j-phoenix-burst-tactics",
    sourceUrl: "https://backloggd.com/games/kikou-heidan-j-phoenix-burst-tactics/",
    overview:
      "Kikou Heidan J-Phoenix: Burst Tactics is a 2002 PlayStation 2 side story in Takara's J-Phoenix series. Backloggd summarizes it as a PS2 action game published by Takara that adds new PF units and characters, introduces cooperative Combination Burst attacks, and unlocks post-ending story material and hidden PF when importing data from Joshou-hen and the main J-Phoenix. GCX should present it as a companion expansion for invested series players, not a disconnected strategy release.",
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
    if (!game) throw new Error(`Missing PS2 game ${rewrite.id}`);
    rows.push([
      "ps2",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on catalog, platform list, and game database sources.",
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
