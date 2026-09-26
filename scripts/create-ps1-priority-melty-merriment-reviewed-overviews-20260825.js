const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-melty-merriment-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-melty-lancer-the-3rd-planet",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-86231.html",
    overview:
      "Melty Lancer: The 3rd Planet is the 1999 PlayStation follow-up in Tenky's futuristic GPO adventure series. PSX Datacenter describes a city-based story set in 2091, with Sylvie and the team responding to attacks while battles pause so the player can issue formation and tactical orders. GCX should treat it as a hybrid sci-fi adventure and strategy-command game, not a straight visual novel.",
  },
  {
    id: "ps1-memorial-series-sunsoft-vol-1-ikki-super-arabian",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03135.html",
    overview:
      "Memorial Series: Sunsoft Vol. 1 is the first PlayStation disc in Sunsoft's Famicom reissue line, bundling Ikki and Super Arabian. PSX Datacenter notes that the package adds extras such as artwork, a jukebox, and a quiz mode, so GCX should frame it as a preservation-style compilation rather than a new action game. The collector hook is the Japanese PS1 presentation of two early Sunsoft titles.",
  },
  {
    id: "ps1-memorial-series-sunsoft-vol-2-route-16-turbo-atlantis-no-nazo",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03181.html",
    overview:
      "Memorial Series: Sunsoft Vol. 2 bundles Route-16 Turbo and Atlantis no Nazo for PlayStation. Like the first disc, PSX Datacenter describes it as part of Sunsoft's Famicom re-release series with extras including artwork, jukebox material, and quiz content. GCX should make the two included games clear up front, since that is the main value for collectors comparing the six Memorial volumes.",
  },
  {
    id: "ps1-memorial-series-sunsoft-vol-3-madoola-no-tsubasa-toukaidou-gojuusan-tsugi",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03366.html",
    overview:
      "Memorial Series: Sunsoft Vol. 3 pairs The Wing of Madoola with Tokaido Gojuusan Tsugi. PSX Datacenter describes the disc as two conversions of older Famicom games, including Madoola's Lucia-led action across 16 levels, while later reference pages identify Tokaido as an action-adventure built around the historic route. GCX should position it as a Japan-only Sunsoft archive disc with two distinct 1980s action releases.",
  },
  {
    id: "ps1-memorial-series-sunsoft-vol-4-chou-wakusei-senki-metafight-ripple-island",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03382.html",
    overview:
      "Memorial Series: Sunsoft Vol. 4 combines Chou Wakusei Senki Metafight, better known through Blaster Master, with Ripple Island. That pairing matters because it puts a vehicle-and-platform action classic beside a peaceful command-based adventure where players use actions such as look, take, enter, hit, and push. GCX should highlight the contrast instead of using a generic compilation blurb.",
  },
  {
    id: "ps1-memorial-series-sunsoft-vol-5-raf-world-hebereke",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03397.html",
    overview:
      "Memorial Series: Sunsoft Vol. 5 bundles Raf World, the Japanese version of Journey to Silius, with Hebereke, known internationally as Ufouria: The Saga. PSX Datacenter identifies it as two old NES/Famicom conversions, making the disc especially interesting for Sunsoft fans because it pairs a run-and-gun action game with the quirky Hebereke action-adventure line. GCX should surface both names for import collectors.",
  },
  {
    id: "ps1-memorial-series-sunsoft-vol-6-battle-formula-gimmick",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03486.html",
    overview:
      "Memorial Series: Sunsoft Vol. 6 is not simply a racing game; it is the sixth Sunsoft compilation disc, bundling Battle Formula, better known as Super Spy Hunter, with Gimmick! PSX Datacenter notes the package includes two old NES conversions plus documents, music, and quiz-style bonus material. GCX should present it as a high-interest Sunsoft collector disc because both included titles have strong retro reputations.",
  },
  {
    id: "ps1-menkyo-o-torou",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-91235.html",
    overview:
      "Menkyo o Torou, literally Get the License, is a Japanese driving-license simulation rather than a broad life sim. PSX Datacenter describes a structure where the player first studies and answers many written-test questions, then takes a practical driving exam from first- and third-person perspectives. GCX should frame it as an unusual edutainment-style driving simulator for import collectors and simulation oddity hunters.",
  },
  {
    id: "ps1-meremanoid",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01664.html",
    overview:
      "Meremanoid, also known as Shinkai Densetsu Meremanoid, is a 1999 fantasy RPG from Xing Entertainment and Shout! Designworks. It follows a mermaid searching for the secrets of her race, with turn-based battles, special moves, and underwater traversal tied to its anime source material. GCX should replace the old action-game blurb with the clearer hook: a Japan-only mermaid RPG with an unusual aquatic premise.",
  },
  {
    id: "ps1-mermaid-no-kisetsu",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-86934.html",
    overview:
      "Mermaid no Kisetsu is a first-person romance adventure and visual-novel-style game ported from PC to PlayStation. PSX Datacenter describes a near-future summer story where Masato meets four girls while everyday life is shaped by android technology, and the Chinese reference summary notes a dual focus on building relationships and investigating a mysterious website. GCX should present it as story-first romance adventure, not a generic visual novel.",
  },
  {
    id: "ps1-mermaid-no-kisetsu-curtain-call",
    sourceUrl: "https://zh.wikipedia.org/wiki/%E7%BE%8E%E4%BA%BA%E9%AD%9A%E7%9A%84%E5%AD%A3%E7%AF%80",
    overview:
      "Mermaid no Kisetsu: Curtain Call is the companion PlayStation release to Game Village and NetVillage's Mermaid no Kisetsu. The core series premise is a near-future romance adventure about meeting heroine characters while investigating a mysterious online thread, so this entry should be treated as follow-up material for fans of that story world. GCX should clearly connect it to the original rather than describing it as an unrelated generic visual novel.",
  },
  {
    id: "ps1-merriment-carrying-caravan",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01493.html",
    overview:
      "Merriment Carrying Caravan is a Japan-only PlayStation strategy and management game from Tenky and Imagineer. PSX Datacenter describes a 42-year-old settler, Dickens Ford, traveling across the colonial planet Grant with his four daughters over the course of a year, earning money and competing against other families. GCX should describe it as a family caravan management sim with story elements, not as a visual novel.",
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
    if (!game) throw new Error(`Missing PS1 game ${rewrite.id}`);
    rows.push([
      "ps1",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on PSX Datacenter, platform-list, and specialist reference sources.",
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
