const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-cobalt-colosseum-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-kikou-heidan-j-phoenix-cobalt-shoutaihen",
    sourceUrl: "https://www.honestgamers.com/45149/playstation-2/kikou-heidan-jphoenix-cobalt-shoutaihen/game.html",
    overview:
      "Kikou Heidan J-Phoenix: Cobalt Shoutaihen is a Japan-only PlayStation 2 action entry in Takara's J-Phoenix mech series. Catalog sources identify Takara as both developer and publisher, a Japanese release date of December 5, 2002, and its role as another branch of the same robot-customization line as the main J-Phoenix releases. GCX should describe it as a niche companion entry for players already following the J-Phoenix chronology, where the appeal is import mecha collecting, series completion, and Takara's early-PS2 robot catalog.",
  },
  {
    id: "ps2-kikou-souhei-armodyne",
    sourceUrl: "https://backloggd.com/games/kikou-souhei-armodyne/",
    overview:
      "Kikou Souhei Armodyne is a late-generation Japanese PlayStation 2 mech strategy game from Omiya Soft and Sony Computer Entertainment, released February 22, 2007. Backloggd and soundtrack/catalog records consistently frame it as a PS2 robot-based strategy title rather than a traditional character RPG. GCX should present it as a tactical/mech import for collectors interested in Sony-published late PS2 experiments, where the key hooks are Omiya Soft development, squad-scale machine combat, and its Japan-only release profile.",
  },
  {
    id: "ps2-kimagure-strawberry-cafe",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65381.html",
    overview:
      "Kimagure Strawberry Cafe is an NTSC-J PlayStation 2 adventure/dating/strategy release from Vingt-et-un Systems and D3 Publisher, released October 9, 2003. PSXDataCenter lists the game under adventure, dating, and strategy styles, while broader coverage of early-2000s romance games notes its female-protagonist otome positioning. GCX should describe it as a cafe-themed relationship simulation/visual-novel import, where the appeal is managing story routes and character relationships rather than reflex-driven play.",
  },
  {
    id: "ps2-kimikiss",
    sourceUrl: "https://en.wikipedia.org/wiki/KimiKiss",
    overview:
      "KimiKiss is Enterbrain's 2006 PlayStation 2 dating simulation game and the start of a broader media franchise. The story follows Kouichi Aihara after summer vacation as he tries to build a relationship during a 30-day school-life window, and the game later spun into manga, light novel, and anime adaptations. GCX should correct the old puzzle-game framing and present KimiKiss as a romance-focused visual novel/dating sim, important for collectors because of its Enterbrain lineage and connection to Amagami.",
  },
  {
    id: "ps2-kimistar-kimi-to-study",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66377.html",
    overview:
      "KimiStar: Kimi to Study is a Japanese PlayStation 2 visual-novel/romance release from Primavera. PSXDataCenter describes a premise where Suga Natsuno becomes the teacher in charge of Class 3-Z and tries to become the kind of teacher he once admired, while IGDB-style catalog records identify the title's romance and visual-novel themes. GCX should frame it as a classroom-centered story game rather than a pure educational utility, with collector value tied to its small-publisher import status.",
  },
  {
    id: "ps2-king-arthur",
    sourceUrl: "https://en.wikipedia.org/wiki/King_Arthur_%28video_game%29",
    overview:
      "King Arthur is Krome Studios and Konami's 2004 action-adventure adaptation of the Jerry Bruckheimer-produced film. The game follows the movie's story with minor changes, lets players control Arthur and several knights, and supports two-character level play where the second hero can be AI-controlled or handled by another player. GCX should describe it as a movie tie-in action-adventure with melee combat, horseback and mission-based sequences, not as a role-playing game.",
  },
  {
    id: "ps2-king-of-colosseum-red-shin-nippon-x-zen-nippon-x-pancrase-disc",
    sourceUrl: "https://www.pricecharting.com/game/jp-playstation-2/king-of-colosseum-red-shin-nippon-x-zen-nippon-x-pancrase",
    overview:
      "King of Colosseum (Red): Shin Nippon x Zen Nippon x Pancrase Disc is Spike's Japan-only PlayStation 2 wrestling simulation, released December 19, 2002. Catalog sources identify it as the Red disc focused on New Japan Pro-Wrestling, All Japan Pro Wrestling, and Pancrase, with Spike as developer and publisher. GCX should describe it as a serious Japanese puroresu/MMA-adjacent wrestling release rather than generic action, with collector interest tied to promotion rosters, the companion Green disc, and Spike's Fire Pro-adjacent wrestling reputation.",
  },
  {
    id: "ps2-king-of-colosseum-ii",
    sourceUrl: "https://www.cagematch.net/?id=77&nr=104",
    overview:
      "King of Colosseum II is Spike's 2004 PlayStation 2 wrestling simulation sequel for the Japanese market. Cagematch lists Spike as developer and publisher with a September 9, 2004 date, while product summaries note modes such as Matchmaker and Survival Road, a very large wrestler roster, and thousands of move combinations across major Japanese promotions. GCX should present it as one of PS2's key import wrestling sims, especially for collectors who care about puroresu rosters and Spike's deep grappling systems.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on catalog, platform database, game database, and franchise sources.",
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
