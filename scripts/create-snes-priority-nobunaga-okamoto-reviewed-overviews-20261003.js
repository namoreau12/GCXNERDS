const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "snes.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "snes-priority-nobunaga-okamoto-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "snes-nobunaga-koki",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Super_Nintendo_Entertainment_System_games",
    overview:
      "Nobunaga Koki is Yanoman's 1993 Japan-only Super Famicom historical strategy game centered on Oda Nobunaga. Catalog references list Yanoman as publisher and place it among the console's domestic Sengoku-era simulations rather than Koei's Nobunaga's Ambition line. The key collector context is its Japanese region, language dependence, strategy focus, publisher, and cartridge-versus-complete-package condition, especially because the title can be confused with Koei's better-known Nobunaga series.",
  },
  {
    id: "snes-nobunaga-no-yabo-haoden",
    sourceUrl: "https://superfamicom.org/info/nobunaga-no-yabou-haouden",
    overview:
      "Nobunaga no Yabo: Haoden is Koei's 1993 Super Famicom installment in the Nobunaga's Ambition historical simulation series. SuperFamicom.org and Japanese catalog records list Koei's December 9, 1993 SFC release, placing it as a Japan-only console version of Haoden. It is a Japanese-language grand-strategy release with save support, regional compatibility considerations, and a separate identity from Lord of Darkness and later Tenshoki entries.",
  },
  {
    id: "snes-nobunaga-no-yabo-tenshoki",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Koei_games",
    overview:
      "Nobunaga no Yabo: Tenshoki is Koei's 1996 Super Famicom version of the Nobunaga's Ambition: Tenshoki strategy entry. Koei catalog lists and Super Famicom release references place the game in Japan in January 1996, late in the platform's life and after Haoden. The exact Tenshoki subtitle matters for collectors, along with its Japanese-language strategy systems, region, save battery expectations, and cartridge-only versus complete-package condition.",
  },
  {
    id: "snes-nobunaga-s-ambition-lord-of-darkness",
    sourceUrl: "https://www.mobygames.com/game/12611/nobunagas-ambition-lord-of-darkness/",
    overview:
      "Nobunaga's Ambition: Lord of Darkness is Koei's localized Super NES release of its Sengoku-era grand-strategy series. MobyGames identifies it as the fourth Nobunaga title and one of the series entries localized in English, while SNES Central documents the North American Lord of Darkness release and related Japanese Super Famicom naming. US SNES copies are distinct from Japanese imports, with map-and-economy strategy depth, battery-backed saves, manual importance, and complete-box condition driving collector interest.",
  },
  {
    id: "snes-nomark-baku-haito-shijo-saikyo-no-jakushi-tatsu",
    sourceUrl: "https://www.giantbomb.com/nomark-baku-paitou-shijou-saikyou-no-jakushi-tatsu/3030-28395/releases/",
    overview:
      "Nomark Baku Haito: Shijo Saikyo no Jakushi Tatsu is Angel's 1995 Super Famicom riichi mahjong game based on the No Mark Bakuhaitou manga. Specialist release records describe it as a Japan-only mahjong title featuring the manga's elite-player cast, which makes it very different from an action or platform game. Its appeal depends on Japanese mahjong rules, manga-license context, region, language dependence, and whether box, manual, and inserts are included.",
  },
  {
    id: "snes-numbers-paradise",
    sourceUrl: "https://www.arcade-history.com/game/61892/numbers-paradise-model-shvc-an7j-jpn",
    overview:
      "Numbers Paradise is Acclaim Japan and ISCO's 1996 Japan-only Super Famicom puzzle release. Arcade-History catalog data records it as a Super Famicom cartridge from Acclaim Japan, while SNES list data credits ISCO development and marks it as unreleased outside Japan. It is best understood as a Japanese puzzle import with region and language dependence, separate from Western Acclaim titles, where complete-package condition can matter more than broad name recognition.",
  },
  {
    id: "snes-oda-nobunaga-hao-no-gundan",
    sourceUrl: "https://superfamicom.org/info/oda-nobunaga-haou-no-gundan",
    overview:
      "Oda Nobunaga: Hao no Gundan is Angel and TOSE's 1993 Super Famicom historical strategy game about Oda Nobunaga. SuperFamicom.org lists the Angel-published Japan release, and specialist achievement/catalog records identify TOSE development and NTSC-J exclusivity. The important context is its Japanese-language strategy focus, region, publisher, TOSE connection, and separation from Koei's Nobunaga's Ambition games.",
  },
  {
    id: "snes-oekaki-logic",
    sourceUrl: "https://gamefaqs.gamespot.com/snes/578842-oekaki-logic/data",
    overview:
      "Oekaki Logic is Sekaibunka Publishing and Game Studio's 1999 Super Famicom picross-style puzzle game. GameFAQs lists the Japanese release as a puzzle title, while specialist references describe it as a Nintendo Power flash-cartridge title rather than a standard retail cartridge. It centers on nonogram puzzle solving, Japan-only distribution, Nintendo Power cartridge-writing context, save data concerns, and the difference between original written cartridges and later collector items.",
  },
  {
    id: "snes-oekaki-logic-2",
    sourceUrl: "https://wiki-origin.giantbomb.com/wiki/Games/Oekaki_Logic",
    overview:
      "Oekaki Logic 2 is Sekaibunka Publishing's 1999 follow-up to the Super Famicom Oekaki Logic nonogram game. Specialist puzzle references place it after the first Oekaki Logic and describe a sharper difficulty curve for players already comfortable with picture-crossword puzzles. It is the sequel in the Super Famicom line, with Japanese Nintendo Power cartridge-writing context, save data condition, region, and a different identity from O-chan no Oekaki Logic on PlayStation.",
  },
  {
    id: "snes-okamoto-ayako-to-match-play-golf",
    sourceUrl: "https://gamefaqs.gamespot.com/snes/571201-okamoto-ayako-to-match-play-golf-ko-olina-golf-club-in",
    overview:
      "Okamoto Ayako to Match Play Golf: Ko Olina Golf Club in Hawaii is Tsukuda Original and C.P. Brain's Super Famicom golf game built around Japanese golfer Ayako Okamoto and match-play competition. GameFAQs identifies the full Ko Olina Golf Club subtitle, while collector references place it among Japan-only sports releases. It is a golf release rather than a racing game, with Japanese region and language, licensed-player branding, match-play format, and complete-package condition shaping its collector profile.",
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
    if (!game) throw new Error(`Missing SNES game ${rewrite.id}`);
    return {
      platformSlug: "snes",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority SNES weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus publisher, specialist game-reference, catalog, and collector sources.",
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
