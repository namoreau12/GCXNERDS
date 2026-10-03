const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "3ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-poyo-famista-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "3ds-poyo-poyo-kansatsu-nikki",
    sourceUrl: "https://gamefaqs.gamespot.com/games/company/76707-ie-institute",
    overview:
      "Poyo Poyo Kansatsu Nikki is IE Institute and Mechanic Arms' 2012 Nintendo 3DS game based on the round-cat comedy manga and anime. Its appeal is character-license charm, short handheld routines, and Japanese-language fan value rather than a broad action or RPG hook. Listings should call out the Japan-only 3DS release, region lock, cartridge and case condition, and whether any bonus or special-edition materials are included.",
  },
  {
    id: "3ds-pretty-rhythm-my-deco-rainbow-wedding",
    sourceUrl: "https://www.syn-sophia.co.jp/product/prettyrhythm_mydeco_rw/",
    overview:
      "Pretty Rhythm: My Deco Rainbow Wedding is a 2013 Nintendo 3DS Pretty Rhythm release tied to Takara Tomy's fashion, dance, and idol-arcade franchise. Syn Sophia's product listing places it in the 3DS line, and the game centers on coordinating outfits and performance-style play for Pretty Rhythm fans. Marketplace notes should emphasize Japanese text, 3DS region lock, series tie-in, and complete packaging or accessory inserts.",
  },
  {
    id: "3ds-pretty-rhythm-rainbow-live-kirakira-my-design",
    sourceUrl: "https://en.wikipedia.org/wiki/Pretty_Rhythm:_Rainbow_Live",
    overview:
      "Pretty Rhythm: Rainbow Live: Kirakira My Design is Takara Tomy's 2013 3DS game connected to the Rainbow Live season of the Pretty Rhythm franchise. Series references identify it as a Nintendo 3DS release that later received an expanded PriPara crossover version. It should be cataloged as a Japanese idol-fashion rhythm and design game, with region, language, packaging, and franchise-era details mattering more than generic music-game labels.",
  },
  {
    id: "3ds-prince-of-tennis-go-to-the-top",
    sourceUrl: "https://www.cs.furyu.jp/tenipuri/?waad=uh00yXc5",
    overview:
      "Prince of Tennis: Go to the Top is FuRyu's 2015 Nintendo 3DS romance adventure based on The New Prince of Tennis. FuRyu's official site lists the 3DS platform, March 5, 2015 release, package and download pricing, and romance-adventure genre. Listings should clearly mark it as a Japanese text-heavy character game, note region lock, and identify it separately from the older Konami tennis-action entries.",
  },
  {
    id: "3ds-pripara-and-pretty-rhythm-pripara-de-tsukaeru-oshare-item-1450",
    sourceUrl: "https://en.wikipedia.org/wiki/Pretty_Rhythm:_Rainbow_Live",
    overview:
      "PriPara & Pretty Rhythm: PriPara de Tsukaeru Oshare Item 1450! is the expanded 2015 3DS version of Pretty Rhythm: Rainbow Live: Kirakira My Design. Series references note that it adds PriPara crossover content, including Hiro and Laala Manaka as playable characters, tying the older Pretty Rhythm line into Takara Tomy's PriPara era. Collectors should verify the exact crossover subtitle, Japanese region, box condition, and any included cards or inserts.",
  },
  {
    id: "3ds-pripara-mezameyo-megami-no-dress-design",
    sourceUrl: "https://www.syn-sophia.co.jp/product/pripara_3ds_megami/",
    overview:
      "PriPara Mezameyo! Megami no Dress Design is a 2016 Nintendo 3DS rhythm and design simulation entry from Syn Sophia and Takara Tomy Arts. The official product listing places it in the PriPara 3DS line, and strategy references describe it as focused on rhythm play and dress design. Listings should foreground the Japanese idol-fashion license, region lock, standard versus package condition, and any card or code materials still with the copy.",
  },
  {
    id: "3ds-pripara-mezase-idol-grand-prix-no-1",
    sourceUrl: "https://www.takaratomy-arts.co.jp/specials/pripara-game/3ds_no1/3ds_trial.pdf",
    overview:
      "PriPara Mezase! Idol Grand Prix No.1! is Takara Tomy Arts' 2015 Nintendo 3DS PriPara game, built around idol performance, fashion coordination, and franchise items. It sits between the arcade, anime, and handheld sides of PriPara, so buyer-facing notes should not describe it as a generic lifestyle minigame. For listings, call out Japanese text, 3DS region lock, exact subtitle, box/manual condition, and any usable or collectible item cards.",
  },
  {
    id: "3ds-pripri-chi-chan",
    sourceUrl: "https://www.konami.com/games/chi-chan/game.php",
    overview:
      "PriPri Chi-chan! is Konami's 2017 Nintendo 3DS character game released as PriPri Chi-chan!! PriPri DecoRoom. Konami's official game page describes decorating rooms in response to friends' requests, matching the manga/anime license's cute domestic-comedy tone. It should be listed as a Japan-only, text-dependent 3DS import where region lock, exact DecoRoom subtitle, cartridge condition, and complete packaging are the key collector details.",
  },
  {
    id: "3ds-pro-evolution-soccer-2014",
    sourceUrl: "https://www.mobygames.com/game/65291/pes-2014-pro-evolution-soccer/",
    overview:
      "Pro Evolution Soccer 2014 is Konami and PES Productions' 2013 football entry, also associated with the Winning Eleven naming in Japan and Asia. MobyGames and series references list a Nintendo 3DS version alongside PC, PS2, PS3, PSP, and Xbox 360 releases, making platform and region especially important for collectors. Listings should specify whether the copy is PES 2014 or a Winning Eleven variant, plus region, roster year, and manual condition.",
  },
  {
    id: "3ds-pro-yakyuu-famista-2011",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_3DS_games_(N%E2%80%93Z)",
    overview:
      "Pro Yakyuu Famista 2011 is Namco Bandai and Now Production's early Nintendo 3DS entry in the long-running Famista baseball series. It brought the cartoon-style Japanese pro baseball formula to 3DS near the system's launch window, before later entries such as Famista Returns and Famista Climax. Listings should make the 2011 season clear, note Japanese region lock, and distinguish it from DS and later 3DS Famista releases.",
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
    if (!game) throw new Error(`Missing 3DS game ${rewrite.id}`);
    return {
      platformSlug: "3ds",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority 3DS weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, publisher, product, series, and catalog references.",
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
