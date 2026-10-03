const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "psp.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "psp-priority-renai-ryukoku-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "psp-renai-banchou-inochi-meishi-koiseyo-otome-love-is-power",
    sourceUrl: "https://www.otomate-p.jp/game/game-76/",
    overview:
      "Renai Banchou: Inochi Meishi, Koiseyo Otome! Love is Power!!! is Idea Factory and Rejet's 2010 PSP otome adventure under the Otomate label. The official Otomate listing identifies it as a PSP release, while import retailers and 4Gamer place it firmly in the Japanese romance-adventure catalog. Collectors should check Japanese-language dependence, standard versus limited edition contents, UMD condition, drama-CD or bonus inserts, and the exact long subtitle because Renai Banchou has multiple entries.",
  },
  {
    id: "psp-rezel-cross",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_Portable_games",
    overview:
      "Rezel Cross is a Japan-only PSP RPG developed by SIMS and published by Sony Computer Entertainment Japan in 2007. The PSP catalog lists it as an SCEJ/SIMS release, making it one of the smaller first-party-published import RPGs rather than a western-localized series entry. Buyer-facing listings should call out Japanese text, RPG structure, SCEJ publishing, complete UMD packaging, and whether the copy is a standard retail release or another regional/catalog variant.",
  },
  {
    id: "psp-ro-kyu-bu",
    sourceUrl: "https://gamefaqs.gamespot.com/psp/626628-ro-kyu-bu/data",
    overview:
      "Ro-Kyu-Bu! is a 2011 Japan-only PSP adventure game based on the light-novel/anime series about a girls' elementary-school basketball club. GameFAQs identifies Vridge as developer, Kadokawa as publisher, and separates standard, limited, PlayStation Store, and Dengeki SP releases. Listings should distinguish the edition, note Japanese-language story content, verify UMD/manual/bonus condition, and avoid confusing it with the later Himitsu no Otoshimono game.",
  },
  {
    id: "psp-ro-kyu-bu-himitsu-no-otoshimono",
    sourceUrl: "https://en.wikipedia.org/wiki/Ro-Kyu-Bu%21",
    overview:
      "Ro-Kyu-Bu! Himitsu no Otoshimono is the second PSP visual-novel/adventure release tied to the Ro-Kyu-Bu! franchise. Series references note two PSP visual novels developed by Vridge and published through ASCII Media Works/Kadokawa Games, so this should be cataloged as the follow-up rather than a version of the first game. Collectors should verify the exact subtitle, Japanese text dependence, UMD and package completeness, and any limited-edition extras.",
  },
  {
    id: "psp-romeo-and-juliet",
    sourceUrl: "https://www.pushsquare.com/games/psp/romeo_and_juliet",
    overview:
      "Romeo & Juliet is QuinRose's 2014 Japan-only PSP otome adventure, a dark romantic reinterpretation of Shakespeare's star-crossed lovers. Push Square and Japanese retailer records identify the PSP release date as March 27, 2014, with QuinRose publishing and limited-edition variants. Listings should emphasize Japanese-language visual-novel play, QuinRose branding, standard versus limited edition contents, and the distinction from the earlier Romeo VS Juliet release.",
  },
  {
    id: "psp-romeo-vs-juliet",
    sourceUrl: "https://gamefaqs.gamespot.com/games/company/78945-quinrose",
    overview:
      "Romeo VS Juliet is QuinRose's 2013 PSP otome adventure and the earlier companion release to the 2014 Romeo & Juliet PSP title. GameFAQs company data places Romeo VS Juliet on PSP in Japan on August 22, 2013, making date and subtitle important for separating nearby QuinRose releases. Collectors should look for the exact VS title treatment, Japanese-region UMD packaging, limited-edition bonuses, and condition of any drama CDs or booklets.",
  },
  {
    id: "psp-routes-portable",
    sourceUrl: "https://gamefaqs.gamespot.com/games/company/72985-aqua-plus",
    overview:
      "Routes Portable is Aquaplus's PSP version of the Leaf visual novel, released in Japan on January 25, 2007 alongside Routes PE on PlayStation 2. Aquaplus company records list the PSP release directly, while Japanese catalog pages identify it as Routes PORTABLE for Sony's handheld. It belongs on the import visual-novel shelf, with language dependence, UMD condition, manual/box completeness, and Aquaplus/Leaf branding as the key listing details.",
  },
  {
    id: "psp-rurouni-kenshin-meiji-kenkaku-romantan-kansei",
    sourceUrl: "https://kenshin.fandom.com/wiki/Rurouni_Kenshin%3A_Meiji_Kenkaku_Romantan_-_Kansei",
    overview:
      "Rurouni Kenshin: Meiji Kenkaku Romantan - Kansei is Natsume Atari and Bandai Namco's 2012 PSP 2D fighting sequel to Saisen. Franchise references describe it as a Japan-only follow-up with similar fighting-game structure and expanded context for Rurouni Kenshin fans. Listings should identify Kansei rather than Saisen, note Japanese-region packaging, fighter/anime-license appeal, UMD condition, and whether the copy includes manual or bonus material.",
  },
  {
    id: "psp-rurouni-kenshin-meiji-kenkaku-romantan-saisen",
    sourceUrl: "https://strategywiki.org/wiki/Rurouni_Kenshin%3A_Meiji_Kenkaku_Romantan%3A_Saisen",
    overview:
      "Rurouni Kenshin: Meiji Kenkaku Romantan: Saisen is a 2011 PSP 2D fighting game developed by Natsume and published by Bandai Namco Games. StrategyWiki notes it was released in Japan to commemorate the 15th anniversary of the Rurouni Kenshin anime, which explains why it matters beyond ordinary licensed software. Collectors should call out the Saisen subtitle, Japanese import status, fighting-game format, UMD/box/manual condition, and distinction from the later Kansei sequel.",
  },
  {
    id: "psp-ryu-koku",
    sourceUrl: "https://gamefaqs.gamespot.com/psp/636180-ryu-koku/data",
    overview:
      "Ryu-koku is CyberFront's 2011 PSP release of KID's Japanese visual novel/adventure. GameFAQs lists it as a one-player visual novel with standard, limited, and PlayStation Store releases, while broader references connect it to KID's earlier PS2 title and Japanese-style fantasy romance setup. Useful listing details include CyberFront PSP packaging, limited-edition contents, Japanese text dependence, UMD condition, and whether the buyer wants the portable version rather than PS2 or PC editions.",
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
    if (!game) throw new Error(`Missing PSP game ${rewrite.id}`);
    return {
      platformSlug: "psp",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority PSP weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, publisher, franchise, retailer, and specialist game-reference sources.",
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
