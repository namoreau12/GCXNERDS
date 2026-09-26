const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-kao-karaoke-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-kao-no-nai-tsuki-select-story",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-62784.html",
    overview:
      "Kao no nai Tsuki Select Story is a PlayStation 2 visual-novel companion release tied to Root's Touka Gettan: Koufuu no Ryouou Deluxe Pack. The PSXDataCenter entry notes that the PS2 package removes adult content from the original PC-side material and bundles Kao no nai Tsuki Select Story as a PS2-exclusive Suzuna after story. GCX should frame it as a niche import VN/fandisc entry for collectors tracking Root, Kadokawa, and late PS2 visual-novel releases rather than a standalone adventure with broad mainstream context.",
  },
  {
    id: "ps2-kappa-no-kai-kata",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65629.html",
    overview:
      "Kappa no Kai-Kata: How to Breed Kappas is a Konami PlayStation 2 adventure and raising game based on the TV anime of the same name. Set around Showa 40, it follows young Hiroshi during a summer stay at his grandparents' home, where green prank-loving kappas become the focus of daily care, manners training, and guidance. GCX should describe it as a quirky character-raising import with anime roots and summer-life atmosphere, not a conventional action adventure.",
  },
  {
    id: "ps2-karaoke-revolution-anime-song-collection",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Karaoke_Revolution_songs",
    overview:
      "Karaoke Revolution: Anime Song Collection is a Japan-only PlayStation 2 themed entry in Konami's microphone-driven singing series. Its song selection focuses on anime and tokusatsu themes, including recognizable material from series such as Sailor Moon, Saint Seiya, Rurouni Kenshin, Dragon Ball, Lupin III, Mazinger Z, and Super Sentai/Kamen Rider shows. GCX should position it as a collector-relevant Karaoke Revolution expansion where the value is the licensed song list and party-play format, not a new game engine.",
  },
  {
    id: "ps2-karaoke-revolution-dreams-and-memories",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Karaoke_Revolution_songs",
    overview:
      "Karaoke Revolution: Dreams & Memories is one of Konami's many Japanese PlayStation 2 Karaoke Revolution discs, built around microphone scoring, pitch tracking, and repeated performance rather than adventure-style progression. Like the other region-specific PS2 entries, it is best understood as a curated song-pack release inside the broader Karaoke Revolution platform. GCX should describe it as a JPN/Asian karaoke-library title for collectors who track song selection, microphone bundles, and regional Konami music-game variants.",
  },
  {
    id: "ps2-karaoke-revolution-family-pack",
    sourceUrl: "https://www.play-asia.com/pt/karaoke-revolution-family-pack-with-microphone/13/705ej",
    overview:
      "Karaoke Revolution: Family Pack is a Japan-region PlayStation 2 release of Konami's singing-game series sold in a microphone bundle. The listing frames it as Karaoke Revolution: Kazoku Idol Sengen packaged for family play, which fits the series' core loop of singing into a USB microphone while the game scores pitch and timing. GCX should identify it as a hardware-bundle karaoke entry, useful for collectors because microphone inclusion, region compatibility, and song-theme positioning matter as much as the disc itself.",
  },
  {
    id: "ps2-karaoke-revolution-j-pop-best-vol-1",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Karaoke_Revolution_songs",
    overview:
      "Karaoke Revolution: J-Pop Best Vol. 1 is part of Konami's Japan-only J-Pop Best Collection line for PlayStation 2. The song-list record places it in the Japanese branch of Karaoke Revolution, with selections from major Japanese pop acts such as aiko, BoA, Chemistry, Do As Infinity, GLAY, hitomi, Judy and Mary, Misia, Mr. Children, and others. GCX should treat it as a song-catalog expansion in the PS2 music-game library, where regional song licensing is the main distinction.",
  },
  {
    id: "ps2-karaoke-revolution-j-pop-best-vol-2",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Karaoke_Revolution_songs",
    overview:
      "Karaoke Revolution: J-Pop Best Vol. 2 continues Konami's PS2 J-Pop Best Collection with another Japan-focused song list rather than a radically different ruleset. Its documented track pool includes artists such as aiko, BoA, Chemistry, Dragon Ash, Dreams Come True, Every Little Thing, EXILE, GLAY, Ayumi Hamasaki, Utada Hikaru, and Southern All Stars. GCX should describe it as a collector-facing karaoke disc whose identity comes from its J-pop licensing, microphone scoring, and compatibility with the PS2 karaoke setup.",
  },
  {
    id: "ps2-karaoke-revolution-j-pop-best-vol-3",
    sourceUrl: "https://www.ebay.com/itm/256973591771",
    overview:
      "Karaoke Revolution: J-Pop Best Vol. 3 is another Konami PlayStation 2 entry in the Japan-only J-Pop Best subseries. Retail and resale records identify it as an NTSC-J PS2 disc published by Konami, while the broader Karaoke Revolution line establishes the expected microphone-based scoring format and regional song-pack structure. GCX should keep the profile clear and modest: this is a Japanese karaoke-library expansion where the collector notes are region, publisher, microphone support, and J-pop song selection.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on platform database, retail, song-list, or franchise sources.",
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
