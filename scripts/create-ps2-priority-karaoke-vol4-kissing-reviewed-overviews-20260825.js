const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-karaoke-vol4-kissing-reviewed-overviews-2026-08-25.csv"
);

const songListSource = "https://en.wikipedia.org/wiki/List_of_Karaoke_Revolution_songs";

const rewrites = [
  {
    id: "ps2-karaoke-revolution-j-pop-best-vol-4",
    sourceUrl: songListSource,
    overview:
      "Karaoke Revolution: J-Pop Best Vol. 4 is a Japan-only PlayStation 2 disc in Konami's J-Pop Best Collection line. The documented song list moves through early-2000s Japanese pop and rock, including B'z, B-DASH, Chemistry, DA PUMP, Do As Infinity, Dragon Ash, GLAY, Hyde, KinKi Kids, Kiroro, Mongol 800, Mr. Children, My Little Lover, SMAP, and Southern All Stars. GCX should present it as a regional karaoke-library release where the draw is the licensed J-pop catalog, microphone scoring, and PS2 import collecting context.",
  },
  {
    id: "ps2-karaoke-revolution-j-pop-best-vol-5",
    sourceUrl: songListSource,
    overview:
      "Karaoke Revolution: J-Pop Best Vol. 5 extends Konami's Japanese PS2 karaoke catalog with another standalone J-pop song disc rather than a separate rules overhaul. Its value for players is the familiar pitch-and-timing performance loop, while its value for collectors is the specific licensed track lineup, NTSC-J identity, and place in the numbered J-Pop Best run. GCX should describe it as a song-pack style music-game entry built for replaying vocals, scoring runs, and party sessions with the PS2 microphone setup.",
  },
  {
    id: "ps2-karaoke-revolution-j-pop-best-vol-6",
    sourceUrl: songListSource,
    overview:
      "Karaoke Revolution: J-Pop Best Vol. 6 is another Japanese PlayStation 2 installment in Konami's microphone-scored Karaoke Revolution branch. Like the surrounding J-Pop Best discs, it is best understood as a curated song collection inside the same karaoke platform: players sing along, chase better pitch accuracy, and compare scores rather than progress through a story campaign. GCX should make the regional-song focus clear so readers know this is primarily a licensed J-pop library title for import music-game collectors.",
  },
  {
    id: "ps2-karaoke-revolution-j-pop-best-vol-7",
    sourceUrl: songListSource,
    overview:
      "Karaoke Revolution: J-Pop Best Vol. 7 sits deep in Konami's Japan-only PS2 J-Pop Best sequence, aimed at players who wanted more domestic chart and karaoke-room material for the same microphone-based framework. The experience is built around song selection, vocal timing, pitch feedback, and repeat score improvement, so the disc's identity comes from its track list more than from new mechanics. GCX should treat it as a numbered catalog expansion and flag region compatibility and microphone support as the practical collector details.",
  },
  {
    id: "ps2-karaoke-revolution-j-pop-best-vol-8",
    sourceUrl: songListSource,
    overview:
      "Karaoke Revolution: J-Pop Best Vol. 8 continues the late PS2 J-Pop Best line with another Konami-curated Japanese karaoke disc. For readers, the important distinction is that this release expands the playable song library for Karaoke Revolution's singing-and-scoring format rather than introducing a new adventure, idol-management mode, or rhythm-action campaign. GCX should position it as an import-focused music title where completeness of the numbered series, disc condition, and the song lineup drive collector interest.",
  },
  {
    id: "ps2-karaoke-revolution-j-pop-best-vol-9",
    sourceUrl: songListSource,
    overview:
      "Karaoke Revolution: J-Pop Best Vol. 9 is one of the later numbered J-Pop Best Collection releases on PlayStation 2. It belongs to Konami's large Japanese Karaoke Revolution ecosystem, where each disc functions as a curated karaoke catalog for microphone play, score chasing, and party rotation. GCX should explain it as a regional song-library expansion with collector relevance tied to the numbered run, Konami publishing, NTSC-J compatibility, and whether a buyer already has the needed microphone hardware.",
  },
  {
    id: "ps2-karaoke-revolution-kazoku-idol-sengen",
    sourceUrl: "https://www.ebay.com/itm/194799424662",
    overview:
      "Karaoke Revolution: Kazoku Idol Sengen is a Japanese PlayStation 2 Karaoke Revolution release built around family-friendly idol-style singing. Retail and resale listings identify it as a 2004 Konami PS2 import, with descriptions emphasizing a track selection aimed at younger or family audiences. GCX should frame it as a themed microphone karaoke disc: players sing, receive pitch/timing feedback, and replay songs for higher scores, while collectors should pay attention to region, microphone bundle versions, and complete packaging.",
  },
  {
    id: "ps2-karaoke-revolution-kissing-selection",
    sourceUrl: "https://www.estarland.com/product-description/Playstation2/Karaoke-Revolution-Kissing-Selection-Imported-Playstation2/54263",
    overview:
      "Karaoke Revolution: Kissing Selection is a Japan-import PlayStation 2 entry in Konami's Karaoke Revolution line, listed by retailers as a rhythm-and-dance/music title. The theme points toward a romantic or ballad-leaning song collection within the same microphone-scored karaoke framework rather than a new core game structure. GCX should describe it as a niche themed song disc for import collectors, where the practical notes are Konami publishing, PS2 microphone compatibility, region support, and whether the copy includes its box and manual.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on song-list, retail, and platform database sources.",
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
