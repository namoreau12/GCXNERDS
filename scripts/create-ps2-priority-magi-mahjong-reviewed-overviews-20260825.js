const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-magi-mahjong-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-ma-gi-marginal",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65291.html",
    overview:
      "Ma-Gi: Marginal is PrincessSoft's PS2 version of the Japanese romance visual novel Merge: Marginal, centered on Shio, a young man pulled into a cast of magic-touched heroines after a childhood shaped by family loss. The PS2 release adds scenarios and event CG material, which makes it more than a plain catalog port for collectors. GCX should present it as a character-route visual novel where the platform value comes from the expanded console edition and its limited-edition packaging history.",
  },
  {
    id: "ps2-mabino-style",
    sourceUrl: "https://www.timeextension.com/news/2026/01/japan-exclusive-dating-sim-mabinotstyle-is-the-latest-ps2-title-to-get-the-fan-translation-treatment",
    overview:
      "Mabino Style is a 2005 KID dating sim set around a magical-school romance structure, with route management, calendar pressure, and character affection doing the heavy lifting. It is especially notable now because fan translation coverage has pushed the once Japan-only PS2 release back into visual-novel collector conversations. GCX should frame it as an import romance adventure where the appeal is the cast, spell-school setting, and route planning rather than action play.",
  },
  {
    id: "ps2-madden-nfl-2004",
    sourceUrl: "https://www.ea.com/en-gb/news/top-25-features-madden-nfl-history",
    overview:
      "Madden NFL 2004 is one of the PS2 era's defining football releases, pairing Michael Vick's cover-star electricity with two systems fans still talk about: Playmaker Control and the expanded Owner Mode. On the field, the right stick lets players redirect routes and defensive reactions; off the field, franchise play stretches into ticket prices, staff decisions, and stadium-style management. GCX should treat it as a sports-game milestone, not just another annual roster update.",
  },
  {
    id: "ps2-mageru-tsukeru-hahiiru-ore-dead-heat",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-62153.html",
    overview:
      "Mageru Tsukeru Hahiiru: Ore * Dead Heat is a Japanese racing-construction game from Success where building is as important as driving. Its identity comes from editors that let players create courses, car parts, rival vehicles, and even story material before taking those creations into race scenarios. GCX should describe it as a creator-driven racing oddity for PS2 import collectors, closer to a toolkit-with-campaign than a standard arcade racer.",
  },
  {
    id: "ps2-magical-pachinko-cotton-pachinko-juki-simulation",
    sourceUrl: "https://www.honestgamers.com/45299/playstation-2/magical-pachinko-cotton-pachinko-juuki-simulation/game.html",
    overview:
      "Magical Pachinko Cotton: Pachinko Juki Simulation turns Success' Cotton character into the face of a pachinko-machine simulation rather than a broom-riding shooter. The PS2 release is a Japan-only gambling-machine adaptation where the draw is cabinet behavior, Cotton branding, and curiosity value for series completists. GCX should make clear that this is not a new arcade Cotton game; it is a pachinko simulation with unusual franchise crossover appeal.",
  },
  {
    id: "ps2-magical-sports-2000-koushien",
    sourceUrl: "https://en.wikipedia.org/wiki/K%C5%8Dshien_%28series%29",
    overview:
      "Magical Sports 2000 Koushien brings Mahou's long-running Japanese high-school baseball series to PlayStation 2 near the system's launch window. Its focus is Koshien-style school baseball rather than MLB licensing, giving collectors a snapshot of Japan's domestic baseball market at the start of the PS2 generation. GCX should position it as an import sports release for players interested in tournament baseball, team management flavor, and early PS2 catalog history.",
  },
  {
    id: "ps2-magical-tale-chitchana-mahoutsukai",
    sourceUrl: "https://gamesdb.launchbox-app.com/publishers/games/3961-princess-soft",
    overview:
      "Magical Tale: Chitchana Mahoutsukai is PrincessSoft's PS2 port of a PC love-adventure premise built around a curse that turns the protagonist into a child. The story hook is the search for the magician behind that transformation, with romance and character-route material wrapped around the magical-comedy setup. GCX should describe it as a niche import visual novel where the unusual age-regression curse is the identifying feature, not just another generic romance adventure.",
  },
  {
    id: "ps2-mahjong",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28L%E2%80%93Z%29",
    overview:
      "Mahjong is Success' 2003 PS2 table-game release, a straightforward Japanese mahjong entry aimed at players who want rules practice and repeatable matches without a licensed anime or arcade wrapper. Its collector value is mostly in its simple title, Success publishing credit, and Japan-only catalog placement. GCX should keep the description direct: this is a functional mahjong release for completeness, not a story-driven or novelty spinoff.",
  },
  {
    id: "ps2-mahjong-goku-taisei",
    sourceUrl: "https://vgmdb.net/product/18283",
    overview:
      "Mahjong Goku Taisei is Artdink's PS2 entry in the Professional Mahjong Goku line, developed by Chatnoir and released in Japan in 2000. The title points to a personality-driven mahjong format rather than a barebones rules trainer, making it a better fit for players who enjoy themed opponents and a more packaged single-player table-game presentation. GCX should connect it to the Goku mahjong lineage so collectors understand why this Artdink release stands apart from anonymous mahjong discs.",
  },
  {
    id: "ps2-mahjong-haoh-battle-royale",
    sourceUrl: "https://kotaku.com/games/mahjong-haoh-battle-royale",
    overview:
      "Mahjong Haoh: Battle Royale is a 2005 PS2 entry in the Haoh mahjong line, built around competitive table play rather than puzzle gimmicks or adventure framing. The Battle Royale subtitle is the useful collector cue: this is the broader confrontation-style branch of the series, aimed at players who want a tournament-like mahjong package. GCX should present it as a Japan-only board-game release whose value is in series completeness and mode identity.",
  },
  {
    id: "ps2-mahjong-haoh-dankyu-battle-ii",
    sourceUrl: "https://www.honestgamers.com/45307/playstation-2/mahjong-haoh-dankyuu-battle-ii/game.html",
    overview:
      "Mahjong Haoh: Dankyu Battle II is NCS' 2006 sequel-style Haoh release, using rank-battle framing to give Japanese mahjong progression more structure than a one-off free-play table. It sits late in the PS2 library, when niche table-game releases were serving dedicated domestic audiences rather than broad retail discovery. GCX should identify it as a ranked mahjong follow-up for Haoh collectors, with the sequel number and NCS credit as the key identifiers.",
  },
  {
    id: "ps2-mahjong-haoh-jansou-battle",
    sourceUrl: "https://vgcollect.com/item/213505",
    overview:
      "Mahjong Haoh: Jansou Battle is Mycom's parlor-themed Haoh entry, using the idea of a jansou mahjong room as its identity instead of a sports-style tournament subtitle. That makes it useful to distinguish from the other Haoh releases clustered in the PS2 catalog: this one is about table-room competition and domestic mahjong atmosphere. GCX should call out the Mycom release and later Mycom Best version so collectors can separate original and budget-line copies.",
  },
  {
    id: "ps2-mahjong-haoh-kaikyu-battle",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28L%E2%80%93Z%29",
    overview:
      "Mahjong Haoh: Kaikyu Battle is another Mycom Haoh installment, with the title emphasizing class or rank-based competition. For readers browsing the PS2 library, the important distinction is that it is not a separate genre experiment; it is part of a tightly focused Japanese mahjong series where subtitles mark different competitive formats. GCX should present it as a rank-battle table-game release for import collectors and keep expectations centered on mahjong play.",
  },
  {
    id: "ps2-mahjong-haoh-shinken-battle",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28L%E2%80%93Z%29",
    overview:
      "Mahjong Haoh: Shinken Battle is NCS' 2004 serious-match entry in the Haoh line, with a subtitle that signals direct, focused competition. It belongs to the PS2's deep Japan-only table-game shelf, where small differences in publisher, subtitle, and release year matter for catalog accuracy. GCX should describe it as a no-frills competitive mahjong title and use the Shinken Battle naming to help collectors distinguish it from Taikai, Jansou, and Dankyu Battle releases.",
  },
  {
    id: "ps2-mahjong-haoh-taikai-battle",
    sourceUrl: "https://app.lizardbyte.dev/GameDB/browse/games/?id=123223",
    overview:
      "Mahjong Haoh: Taikai Battle is Mycom's tournament-themed Haoh PS2 release, aimed at players who want structured competition rather than a generic practice table. The Taikai subtitle is the whole point for catalog users: it marks this as the event or tournament branch among several similarly named Haoh mahjong discs. GCX should present it as a Japan-only competitive mahjong title with clear series context so it does not blur into the rest of the PS2 table-game pile.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on platform database, publisher, specialist database, and series sources.",
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
