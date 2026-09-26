const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-love-reborn-reviewed-overviews-2026-08-25.csv"
);

const songListSource = "https://en.wikipedia.org/wiki/List_of_Karaoke_Revolution_songs";

const rewrites = [
  {
    id: "ps2-karaoke-revolution-love-and-ballad",
    sourceUrl: songListSource,
    overview:
      "Karaoke Revolution: Love & Ballad is a Japan-only PlayStation 2 entry in Konami's home karaoke line, built around softer pop and ballad selections rather than the broader J-Pop Best volume format. The documented song list includes Dreams Come True, GLAY, KinKi Kids, Kiroro, Misia, Mr. Children, SMAP, Southern All Stars, Spitz, and other mainstream Japanese artists. GCX should frame it as a themed vocal-score disc where the collector value comes from its song curation, NTSC-J identity, and place in Konami's large PS2 karaoke catalog.",
  },
  {
    id: "ps2-karaoke-revolution-night-selection-2003",
    sourceUrl: "https://www.play-asia.com/en/karaoke-revolution-night-selection-2003/13/702hr",
    overview:
      "Karaoke Revolution: Night Selection 2003 is a Japanese PlayStation 2 Karaoke Revolution release aimed at a more adult evening-song set than the J-pop volumes. Play-Asia's listing describes Konami's Bemani karaoke format, USB headset/microphone play, audience feedback, and a song range marketed around older rock, R&B, dance, and hit selections, while the broader song-list record notes Night Selection's enka-heavy focus. GCX should describe it as a themed import karaoke disc where tone and song selection are the real differentiators.",
  },
  {
    id: "ps2-karaoke-revolution-snow-and-party",
    sourceUrl: "https://www.mobygames.com/game/96749/karaoke-revolution-snow-party/",
    overview:
      "Karaoke Revolution: Snow & Party is a winter-holiday themed Japanese PlayStation 2 karaoke disc from Konami. MobyGames describes it as a compilation of 50 J-pop winter and holiday songs using the same core play style and modes as the J-Pop Best releases, with singing handled through a USB microphone or headset. GCX should present it as a seasonal song-library release: mechanically familiar, but useful for collectors because of its specific theme, December 2003 timing, and NTSC-J PS2 karaoke niche.",
  },
  {
    id: "ps2-karaoke-stage-2",
    sourceUrl: "https://en.wikipedia.org/wiki/Karaoke_Revolution",
    overview:
      "Karaoke Stage 2 is the European PlayStation 2 follow-up in Konami's Karaoke Revolution family, using the same song set as Karaoke Revolution Party. That makes it a PAL-region counterpart to the series' party-focused singing format: players use a microphone, follow pitch and timing cues, and replay performances for stronger audience reaction and scores. GCX should separate it from the Japanese expansion discs by noting its European release identity, shared Party song list, and practical collector concerns around PAL compatibility and microphone bundles.",
  },
  {
    id: "ps2-kart-racer",
    sourceUrl: "https://www.honestgamers.com/45115/playstation-2/kart-racer/game.html",
    overview:
      "Kart Racer is a budget-priced European PlayStation 2 racing release associated with Nordic Games Publishing. HonestGamers lists the PS2 version as a racing title with Nordic Games as publisher and a June 2009 European release, while price/catalog records point to Brain in a Jar development on the PAL version. GCX should treat it as a late-life PAL kart racer rather than a major franchise entry: the appeal is simple arcade racing, regional obscurity, and collector interest in Nordic's budget-era PS2 and Wii catalog.",
  },
  {
    id: "ps2-katakamuna-ushinawareta-ingaritsu",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65762.html",
    overview:
      "Katakamuna: Ushinawareta Ingaritsu is an NTSC-J PlayStation 2 adventure/visual-novel style release from Alchemist, with PSXDataCenter listing Alchemist and NDCP development, Alchemist publishing, and a November 25, 2004 Japanese release. Its premise follows an unnamed male high-school student who is pulled from summer camp into ancient Japan, giving the game a time-displacement fantasy setup rather than a tactics-heavy strategy identity. GCX should position it as a Japanese import adventure for visual-novel and Alchemist collectors.",
  },
  {
    id: "ps2-katekyoo-hitman-reborn-nerae-ring-x-bongole-returns",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25883.html",
    overview:
      "Katekyoo Hitman Reborn Nerae!? Ring x Bongole Returns is tied to Marvelous' NTSC-J PS2 Reborn! adventure release, officially listed by PSXDataCenter as Kateikyoushi Hitman Reborn! - Nerae Ring x Bongole Trainers. The game adapts Akira Amano's mafia-anime setup into a training-focused adventure where players work with different characters, trigger button-prompt training sequences, and unlock CG and gallery content. GCX should describe it as a character-training anime import, not a conventional action brawler.",
  },
  {
    id: "ps2-katekyoo-hitman-reborn-kindan-no-yami-no-delta",
    sourceUrl: "https://www.vgchartz.com/game/28581/katekyoo-hitman-reborn-kindan-no-yami-no-delta/",
    overview:
      "Katekyoo Hitman Reborn! Kindan no Yami no Delta is a 2008 Japanese PlayStation 2 action game from Marvelous based on the Reborn! manga/anime license. Catalog records identify it as a Japan-only PS2 release, and game database summaries frame the premise around rival mafioso pursuing the Delta Box. GCX should present it as the more action-forward Reborn! PS2 entry: a licensed anime combat/adventure title whose collector hooks are the Marvelous publishing credit, NTSC-J release, character roster, and franchise tie-in.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on catalog, platform database, product, and song-list sources.",
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
