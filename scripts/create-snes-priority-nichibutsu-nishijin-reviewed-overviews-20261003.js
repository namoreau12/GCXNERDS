const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "snes.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "snes-priority-nichibutsu-nishijin-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "snes-nichibutsu-collection-2",
    sourceUrl: "https://superfamicom.org/info/nichibutsu-collection-2",
    overview:
      "Nichibutsu Collection 2 is a late Super Famicom compilation from Nihon Bussan, released in Japan in December 1996. SuperFamicom.org identifies it as a table-game release, and Japanese catalog sources describe the package as pairing Mahjong Hanjouki with Super Gomoku Shogi: Joseki Kenkyuu-hen. It is best listed as a Nichibutsu import compilation where the exact volume number, Japanese title, battery-backed cartridge details, and complete box/manual status prevent confusion with Nichibutsu Arcade Classics or Collection 1.",
  },
  {
    id: "snes-nickelodeon-guts",
    sourceUrl: "https://gamefaqs.gamespot.com/snes/588530-nickelodeon-guts/data",
    overview:
      "Nickelodeon GUTS is Viacom New Media's Super NES adaptation of the 1990s Nickelodeon competition show. It turns the TV format into obstacle-course and sports-challenge events, with the Aggro Crag branding making it a nostalgia-first licensed cartridge rather than a league sports sim. Collectors should separate it from Nickelodeon platformers by show license, North American SNES release, box/manual condition, and whether the buyer specifically wants the game-show shelf.",
  },
  {
    id: "snes-nintama-rantarou",
    sourceUrl: "https://gamefaqs.gamespot.com/games/company/12710-culture-brain",
    overview:
      "Nintama Rantarou is Culture Brain's 1995 Super Famicom game based on the long-running ninja-school manga and anime. It is the first of several Nintama releases on Nintendo hardware, so its value comes from character-license appeal, Japanese text, and its place at the start of the Super Famicom run. Listings should make the 1995 date, Culture Brain publisher credit, Super Famicom region, and loose-versus-complete condition clear.",
  },
  {
    id: "snes-nintama-rantarou-2",
    sourceUrl: "https://www.rfgeneration.com/PHP/checklists.php?ID=J-044%3Bstyle%3Dviewing%3Bshowall%3D1",
    overview:
      "Nintama Rantarou 2 continues Culture Brain's Super Famicom line of games based on the Nintama Rantarou anime and manga. As an import character cartridge, it is most useful to catalog by sequel number, Japanese-region packaging, and Culture Brain branding rather than by broad genre shorthand alone. Buyers comparing Nintama carts should watch for the exact subtitle or number, label art, manual presence, and language dependence.",
  },
  {
    id: "snes-nintama-rantarou-3",
    sourceUrl: "https://gamefaqs.gamespot.com/games/company/12710-culture-brain",
    overview:
      "Nintama Rantarou 3 is the 1997 Culture Brain Super Famicom entry in the Nintama Rantarou licensed-game run. It arrived very late in the system's Japanese life, which gives it a different collector profile from the earlier 1995 and 1996 cartridges. The strongest listing details are sequel number, late Super Famicom release timing, Japanese text, Culture Brain publisher credit, and whether the copy includes the original box and manual.",
  },
  {
    id: "snes-nintama-rantarou-special",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintama_Rantar%C5%8D_video_games",
    overview:
      "Nintama Rantarou Special is another Culture Brain Super Famicom release built around the Nintama Rantarou ninja-school cast. The 'Special' naming makes exact identification important, because the platform has multiple Nintama cartridges released close together. Collectors should treat it as a Japan-only licensed character entry where title variant, box art, manual condition, and Japanese-language play are more meaningful than a generic anime-game label.",
  },
  {
    id: "snes-nintama-rantarou-ninjutsu-gakuen-puzzle-taikai-no-dan",
    sourceUrl: "https://www.gavas.jp/products/detail.php?product_id=2798",
    overview:
      "Nintama Rantarou: Ninjutsu Gakuen Puzzle Taikai no Dan is Culture Brain's puzzle-focused Super Famicom Nintama release. The subtitle marks it as a Ninjutsu Academy puzzle-tournament entry rather than one of the numbered Nintama games, so it belongs with character-license puzzle imports. Useful listing details include the full romanized subtitle, Japanese title, Super Famicom region, Culture Brain branding, and complete-package condition.",
  },
  {
    id: "snes-nishijin-pachinko-monogatari",
    sourceUrl: "https://gamefaqs.gamespot.com/snes/571292-nishijin-pachinko-monogatari/data",
    overview:
      "Nishijin Pachinko Monogatari is KSS's 1995 Super Famicom pachinko release, tied to the Nishijin pachinko-machine brand. GameFAQs classifies it as a gambling title and SuperFamicom.org lists it as a Japan-only pachinko cartridge with battery-backed memory. It is best presented as a licensed pachinko simulation where machine branding, Japanese region, save support, and complete retail condition matter more than action-game expectations.",
  },
  {
    id: "snes-nishijin-pachinko-monogatari-2",
    sourceUrl: "https://gamefaqs.gamespot.com/snes/571457-nishijin-pachinko-monogatari-2/data",
    overview:
      "Nishijin Pachinko Monogatari 2 is Soft Machine and KSS's 1996 sequel in the Nishijin pachinko line for Super Famicom. It keeps the focus on pachinko play and licensed machine identity, making it a specialty gambling import rather than a general table-game compilation. Collectors should distinguish it from the 1995 first game and the later Nishijin Pachinko 3 by release date, product code, developer credit, and box/manual completeness.",
  },
  {
    id: "snes-nishijin-pachinko-monogatari-3",
    sourceUrl: "https://www.gavas.jp/products/detail.php?product_id=2664",
    overview:
      "Nishijin Pachinko Monogatari 3, also cataloged as Nishijin Pachinko 3, is the third Super Famicom entry in KSS's Nishijin pachinko series. Japanese catalog sources place it in December 1996, with Soft Machine credited on broader SNES lists, making it a late import for pachinko and gambling-simulation collectors. Listings should spell out the third-entry naming, Japanese cartridge region, Nishijin/KSS association, and whether it is loose or complete.",
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
        "Priority SNES weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus SuperFamicom.org, GameFAQs, retail/checklist, and specialist reference checks.",
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
