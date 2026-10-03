const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-sudoku-summon-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "ds-sudoku-ball-detective",
    sourceUrl: "https://www.esrb.org/ratings/26897/sudoku-ball-detective/",
    overview:
      "Sudoku Ball Detective is Playlogic's DS puzzle-adventure built around a murder mystery solved through number puzzles. The ESRB describes it as a detective story with still-image scenes, dialogue, and Sudoku-style puzzle progression rather than a straight puzzle-grid cartridge. For collectors, the useful distinctions are DS versus Wii/PC versions, E10+ mystery tone, Playlogic/Whitebear crediting, and whether the copy is complete with case and manual.",
  },
  {
    id: "ds-sudoku-ds-nikoli-no-sudoku-ketteiban",
    sourceUrl: "https://www.nintendo.co.jp/ds/software/ysuj/index.html",
    overview:
      "Sudoku DS: Nikoli no Sudoku Ketteiban is Hudson Soft's Japan-only DS Sudoku package built around Nikoli-authored logic puzzles. Nintendo's listing highlights more than 400 puzzles, tutorial support, stylus-friendly controls, and local wireless/download play options, making it a deeper dedicated Sudoku release than a throwaway minigame. Buyers should check Japanese language expectations, cartridge label, box/manual condition, and whether they specifically want the Nikoli-branded edition.",
  },
  {
    id: "ds-sudokuro",
    sourceUrl: "https://www.nintendoworldreport.com/news/12585/crave-bringing-sudokoru-to-ds",
    overview:
      "Sudokuro is Crave Entertainment's DS logic-puzzle release pairing Sudoku-style number grids with Kakuro-style crossword arithmetic. It belongs to the early handheld brain-training and newspaper-puzzle wave, built for quick stylus sessions rather than story progression. The listing value is in the exact title spelling, puzzle mix, North American casual-puzzle context, and complete retail condition, since it can be easy to confuse with the DS library's many Sudoku cartridges.",
  },
  {
    id: "ds-sugar-bunnies-ds-yume-no-sweets-koubou",
    sourceUrl: "https://www.nintendo.co.jp/ds/software/yv2j/index.html",
    overview:
      "Sugar Bunnies DS: Yume no Sweets Koubou is Takara Tomy's Sanrio sweets-making adventure for Nintendo DS. Nintendo's page frames it around creating an original Sugarbunny, living in Bunnies Field, collecting dessert recipes, and aiming for the year-end pastry chef contest, with familiar and game-original characters appearing along the way. It is best listed as a Japanese character-life and cooking-themed import where language, Sanrio appeal, and complete packaging matter.",
  },
  {
    id: "ds-sugar-sugar-rune-queen-shiken-wa-dai-panic",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/932306-sugar-sugar-rune-queen-shiken-wa-dai-panic/data",
    overview:
      "Sugar Sugar Rune: Queen Shiken wa Dai Panic is Dimps and Bandai Namco's 2006 DS action game based on Moyoco Anno's magical-girl series. Its hook is the licensed Sugar Sugar Rune cast and queen-candidate fantasy rather than a generic handheld activity set, so the cartridge fits the manga/anime tie-in shelf. Collectors should note the Japan-only release, Japanese text, CERO A rating, exact subtitle, and whether the listing includes the original case and inserts.",
  },
  {
    id: "ds-suite-precure-melody-collection",
    sourceUrl: "https://en.wikipedia.org/wiki/Suite_PreCure",
    overview:
      "Suite PreCure: Melody Collection is Namco Bandai's DS minigame release tied to the 2011 music-themed Suite PreCure anime. It centers the Cure Melody-era cast and musical branding, making it a character-license cartridge for PreCure fans more than a broad action or rhythm series entry. Important listing details include Japanese-language play, the Suite season connection, box art condition, and whether buyers are collecting PreCure games by anime era.",
  },
  {
    id: "ds-sukashikashipanman-ds-shokotan-koto-nakagawa-shouko-produce",
    sourceUrl: "https://www.play-asia.com/en/sukashishipanman-ds-shokotak-koto-nakagawa-shouko-produce/13/7036hl",
    overview:
      "Sukashikashipanman DS: Shokotan koto Nakagawa Shouko Produce! is an Interchannel Japan-only DS release built around Shoko Nakagawa's Sukashikashipanman character project. It is a niche celebrity-produced character game rather than a standard party compilation, so its appeal comes from Shokotan fandom, oddball mascot history, and import-library rarity. Listings should make the Japanese region context, title romanization, publisher, and complete-package status easy to verify.",
  },
  {
    id: "ds-suki-desu-suzuki-kun-4-nin-no-suzuki-kun",
    sourceUrl: "https://www.ideaf.co.jp/game/spec/?hard=ds&title=suzuki",
    overview:
      "Suki Desu Suzuki-kun!! 4-nin no Suzuki-kun is Idea Factory's DS adaptation of Go Ikeyamada's shoujo manga. The game follows the romance cast during the summer of their first middle-school year and adds game-original Suzuki characters, making it a story-heavy fan item instead of a general-purpose dating sim. For collectors, the key signals are Japanese text dependence, manga/anime tie-in value, limited-edition extras such as drama CD contents, and clean packaging.",
  },
  {
    id: "ds-summon-night",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/944070-summon-night/data",
    overview:
      "Summon Night on DS is Flight-Plan and Namco Bandai's handheld remake of the original PlayStation tactical RPG. It preserves the fantasy simulation-RPG foundation of the series while adding DS-era options, making it notable for fans who want the first mainline entry in portable form. Since it stayed Japan-only, listings should foreground language, remake status, series placement, box/manual condition, and whether any bonus materials are included.",
  },
  {
    id: "ds-summon-night-2",
    sourceUrl: "https://www.nintendo.co.jp/ds/software/yskj/index.html",
    overview:
      "Summon Night 2 on DS is the Nintendo DS remake of Flight-Plan's second mainline Summon Night strategy RPG. Nintendo's listing positions it as the popular simulation-RPG sequel returning on DS, with chapter-based story progression, character interaction, preparation, and tactical battles carrying the appeal. The practical collector context is Japanese language, remake versus PlayStation original, Summon Night series placement, and whether the boxed copy includes its original inserts.",
  },
];

const headers = [
  "platformSlug",
  "gameId",
  "title",
  "currentOverview",
  "sourceUrl",
  "rewriteNotes",
  "newOverview",
  "reviewStatus",
  "reviewer",
];

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = reviewedOverviews.map((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing DS game ${rewrite.id}`);
    return {
      platformSlug: "ds",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority DS weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, publisher, ratings-board, retail, and specialist game-reference sources.",
      newOverview: rewrite.overview,
      reviewStatus: "reviewed",
      reviewer: "Games Exchange editorial cleanup",
    };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );
  console.log(JSON.stringify({ ok: true, outputPath: path.relative(rootDir, outputPath), rows: rows.length }, null, 2));
}

main();
