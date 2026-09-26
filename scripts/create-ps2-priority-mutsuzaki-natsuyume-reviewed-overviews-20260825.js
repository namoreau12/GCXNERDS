const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-mutsuzaki-natsuyume-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps2.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ps2-mutsuzaki-hoshi-kikari",
    title: "Mutsuzaki Hoshi Kikari",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66359.html",
    newOverview:
      "Mutsuzaki Hoshi Kikari, cataloged by PSX DataCenter under the title Mutsuboshi Kirari Hoshifuru Miyako, is a Japan-only Chise visual novel about Tomoki Shinonome returning to his hometown, joining an astronomy club, and reconnecting with Subaru Hoshimi. GCX should describe it as a school-life romance import with an astronomy-club setup, not as a generic route-based visual novel with no identifying hook.",
  },
  {
    gameId: "ps2-mystereet",
    title: "Mystereet",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66415.html",
    newOverview:
      "Mystereet: Fukagyaku Sekai no Tantei Shinshi is an Abel Software detective visual novel brought to PS2 by Yeti. PSX DataCenter describes the PlayStation 2 version as adding voice-over dialogue and removing adult material from the PC original, while database listings identify it under the Yasogami Kaoru case-file subtitle. GCX should frame it as a mystery-adventure import built around investigation and story progression, not a strategy game.",
  },
  {
    gameId: "ps2-mystic-nights",
    title: "Mystic Nights",
    sourceUrl: "https://jeremydecola.github.io/Mystic-Nights-Archive/",
    newOverview:
      "Mystic Nights is a Korean-exclusive PS2 survival-horror adventure from N-Log Soft and Sony Computer Entertainment Korea. Preservation-focused coverage describes a biology professor drawn to an isolated research facility after a letter from an old friend, with single-player horror and an unusual multiplayer mode where one participant can secretly sabotage the group. GCX should call it a rare Korean PS2 horror release, not a generic adventure entry.",
  },
  {
    gameId: "ps2-nadepro-kisama-mo-seiyu-yattemiro",
    title: "NadePro!! Kisama mo Seiyu Yattemiro!",
    sourceUrl: "https://tcrf.net/NadePro%21%21_Kisama_mo_Seiyuu_Yattemiro%21",
    newOverview:
      "NadePro!! Kisama mo Seiyu Yattemiro! is a voice-acting themed PS2 adventure tied to the NadePro media property. The Cutting Room Floor identifies it as a game about controlling a character on the path to becoming a voice actor, and soundtrack cataloging lists Arcadia Project development with GungHo publishing. GCX should correct the old shooter label and describe it as a niche seiyu-industry character adventure.",
  },
  {
    gameId: "ps2-nana",
    title: "Nana",
    sourceUrl: "https://www.imdb.com/title/tt36348024/",
    newOverview:
      "Nana is Konami's 2005 PlayStation 2 game based on Ai Yazawa's manga and anime world, with Japanese romance and lifestyle storytelling at the center. Public cataloging identifies Konami as production company, and collector discussion consistently treats the PS2 release as a character-driven adaptation for fans of the series rather than an action game. GCX should position it as a licensed romance/simulation import whose value comes from the Nana connection and Japanese-language fan appeal.",
  },
  {
    gameId: "ps2-nankuro",
    title: "Nankuro",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/402326-superlite-2000-vol-9-numcro",
    newOverview:
      "Nankuro, also listed as SuperLite 2000 Vol. 9: NumCro, is a Success-published PS2 puzzle release based on Nikoli-style numbered crossword play. LaunchBox identifies Nikoli as developer and Success as publisher, while PSX DataCenter's related Nankuro listing describes hundreds of number-crossword puzzles and rule support for beginners. GCX should explain it as a Japanese logic-puzzle cartridge, not a vague pattern-recognition game.",
  },
  {
    gameId: "ps2-naraku-no-shiro",
    title: "Naraku no Shiro",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25848.html",
    newOverview:
      "Naraku no Shiro: Ichiyanagi Nagomu, 2-dome no Junan is a FOG-developed mystery adventure published by Nippon Ichi Software in 2008. PSX DataCenter catalogs it as an NTSC-J adventure with Japanese menus and gameplay, and FOG's broader catalog places it in the Ichiyanagi Nagomu mystery line after Amagoshi no Yakata. GCX should describe it as a text-heavy detective adventure, not a strategy game.",
  },
  {
    gameId: "ps2-national-geographic-safari-adventures-africa",
    title: "National Geographic: Safari Adventures Africa",
    sourceUrl: "https://wiki.pcsx2.net/National_Geographic:_Safari_Adventures_Africa",
    newOverview:
      "National Geographic: Safari Adventures Africa is a PAL PlayStation 2 family adventure from Blast! Entertainment built around exploration and animal discovery. The PCSX2 wiki describes five 3D games that mix discovery and exploration across continents and ecosystems, while retail listings pitch it as a child-friendly safari experience. GCX should frame it as educational wildlife software for younger players rather than a conventional adventure game.",
  },
  {
    gameId: "ps2-natsu-shoujo-promised-summer",
    title: "Natsu Shoujo: Promised Summer",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65634.html",
    newOverview:
      "Natsu Shoujo: Promised Summer is Success's PS2 rework of the PC romance adventure Natsu Shoujo. PSX DataCenter notes added CG scenes, a new scenario with original characters, and gameplay centered on character conversations with multiple-choice responses. GCX should describe it as a relationship-focused summer visual novel where the PS2 value comes from its extra console material and import-romance audience.",
  },
  {
    gameId: "ps2-natsu-yume-ya-wa",
    title: "Natsu Yume Ya Wa",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66383.html",
    newOverview:
      "Natsu Yume Ya Wa: The Tale of a Midsummer Night's Dream is a KID visual novel about Reiji Oumi returning to his hometown years after his sister's death and confronting the unresolved grief shared by childhood friends Kotori and Ryouko. PSX DataCenter and MobyGames both describe it as a story-led KID title with familiar visual-novel systems. GCX should emphasize the melancholy reunion premise rather than leaving it as generic route text.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing PS2 game record for ${gameId}`);
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
      "ps2",
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority PS2 weak-template replacement with source-backed GCX editorial overview.",
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
