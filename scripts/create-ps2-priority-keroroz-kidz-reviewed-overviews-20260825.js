const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-keroroz-kidz-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-keroro-gunsou-meromero-battle-royale-z",
    sourceUrl: "https://tcrf.net/Keroro_Gunsou%3A_MeroMero_Battle_Royale_Z",
    overview:
      "Keroro Gunsou: MeroMero Battle Royale Z is the PlayStation 2 follow-up to Bandai's Sgt. Frog/Keroro Gunsou arena-action game. The Cutting Room Floor identifies Now Production as developer, Bandai as publisher, and PlayStation 2 as the platform, while catalog sources place the Japanese release in November 2005. GCX should describe it as a character-based fighting/action import built around the Keroro cast, multiplayer-style battle scenarios, and Bandai's anime-license PS2 catalog rather than as a conventional shooter.",
  },
  {
    id: "ps2-keyboardmania",
    sourceUrl: "https://en.wikipedia.org/wiki/Keyboardmania",
    overview:
      "KeyboardMania is Konami's PlayStation 2 home version of the Bemani keyboard rhythm game. The series uses a 24-key keyboard layout where notes scroll toward a play line and players press the matching keys in time, recreating the piano/keyboard part of each song. GCX should frame the PS2 release as a peripheral-driven music game: the disc matters, but collector value also depends heavily on the dedicated KeyboardMania controller, Japanese-region compatibility, and its connection to Konami's arcade Bemani lineage.",
  },
  {
    id: "ps2-keyboardmania-ii-2nd-mix-and-3rd-mix",
    sourceUrl: "https://www.jnlgame.com/products/keyboardmania-ii-2nd-mix-3rd-mix-ps2-playstation-2-pre-owned-japanese-import",
    overview:
      "KeyboardMania II: 2nd Mix & 3rd Mix is Konami's 2002 Japanese PlayStation 2 compilation of later KeyboardMania arcade material. Retail listings identify KCEJ/Konami, the February 28, 2002 Japanese release, and the Bemani franchise, while series documentation notes that the sequel combines 2ndMIX and 3rdMIX content. GCX should describe it as a more complete collector target than the first home disc, especially for players with the keyboard controller or a compatible MIDI-style setup.",
  },
  {
    id: "ps2-kiddies-party-pack",
    sourceUrl: "https://retrodetect.com/home/viewDb/174",
    overview:
      "Kiddies Party Pack is a Phoenix Games PlayStation 2 party compilation aimed at younger players and budget-family buyers. Available catalog records are thin, so GCX should keep the profile careful: this is best understood as a mini-game and activity-style collection rather than a deep campaign, sports sim, or major licensed release. Its collector interest comes from Phoenix Games' distinctive low-budget European PS2 catalog, PAL-library completion, and the oddity value of family-focused compilations late in the console's life.",
  },
  {
    id: "ps2-kidou-senshi-gundam-ghiren-no-yabou-zeon-dokuritsu-sensouden-kouryaku-shireisho",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28A%E2%80%93K%29",
    overview:
      "Kidou Senshi Gundam: Ghiren no Yabou - Zeon Dokuritsu Sensouden - Kouryaku Shireisho is listed as a Japanese PlayStation 2 expansion release from Bandai, dated February 20, 2003. The title belongs to the Ghiren no Yabou strategy branch of Gundam games, so GCX should avoid treating it as an action shooter. It is better framed as a supplemental strategy/guide-style release for players and collectors following the Zeon Dokuritsu Sensouden campaign line, with appeal tied to Gundam completism and Bandai's import PS2 library.",
  },
  {
    id: "ps2-kidou-shinsengumi-moeyo-ken",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/128650-kidou-shinsengumi-moeyo-ken",
    overview:
      "Kidou Shinsengumi: Moeyo Ken is a 2002 Japanese PlayStation 2 RPG/strategy release from Red Entertainment and Enterbrain. LaunchBox summarizes it as a magical-girl variant of the Shinsengumi concept, created by Sakura Wars creator Oji Hiroi with character designs by Rumiko Takahashi of Ranma 1/2 and Inuyasha fame, and later adapted into anime. GCX should present it as a personality-heavy import RPG/adventure hybrid where the creative staff and anime connection are as important as the battle system.",
  },
  {
    id: "ps2-kidz-sports-basketball",
    sourceUrl: "https://en.wikipedia.org/wiki/Kidz_Sports",
    overview:
      "Kidz Sports Basketball is part of Data Design Interactive's Kidz Sports line, a budget series built around simplified sports versions for younger players. The series record notes that Basketball came to PlayStation 2 in 2004 before later PC and Wii versions, and that the game was heavily criticized for weak gameplay and graphics. GCX should describe it as a low-budget arcade basketball release rather than a serious sim, with collector interest tied to Data Design's unusual budget catalog and Phoenix Games-era PAL collecting.",
  },
  {
    id: "ps2-kidz-sports-ice-hockey",
    sourceUrl: "https://gamesdb.launchbox-app.com/developers/games/1378-data-design-interactive",
    overview:
      "Kidz Sports Ice Hockey is another Data Design Interactive/Phoenix-style budget sports release for PlayStation 2, aimed at simple pick-up-and-play hockey rather than licensed league simulation. LaunchBox's Data Design listing identifies the PS2 version with a September 3, 2004 release, while broader Kidz Sports records place the series around simplified Basketball, Ice Hockey, Football, and Mini Golf entries. GCX should frame it as a family-budget sports oddity, notable more for library completion and developer history than for deep hockey mechanics.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on catalog, franchise, product, and platform sources.",
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
