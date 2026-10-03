const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "psp.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "psp-priority-syk-sakura-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "psp-s-y-k-renshouden-portable",
    sourceUrl: "https://gamefaqs.gamespot.com/psp/619936-syk-renshouden-portable/data",
    overview:
      "S.Y.K Renshouden Portable is Otomate and Idea Factory's 2011 PSP version of the S.Y.K Renshouden fan-disc follow-up to S.Y.K: Shinsetsu Saiyuuki. GameFAQs records the Japanese PSP release, Otomate development, and Idea Factory publishing, while Japanese listings connect it with the S.Y.K Portable Twin Pack. It is best understood as a text-heavy otome adventure import, so edition, inserts, and Japanese-language comfort matter more than action mechanics.",
  },
  {
    id: "psp-s-y-k-shinsetsu-saiyuuki-portable",
    sourceUrl: "https://www.4gamer.net/games/111/G011132/",
    overview:
      "S.Y.K Shinsetsu Saiyuuki Portable is Idea Factory's 2010 PSP port of Otomate's romance-adventure retelling of Saiyuki. 4Gamer lists the July 29, 2010 Japanese PSP release with standard and limited editions, and Siliconera described the setup as a female Sanzo traveling with dateable companions on a Journey to the West-inspired route. The important collector context is Otomate branding, PS2-to-PSP port status, Japanese text, and limited-edition packaging.",
  },
  {
    id: "psp-saihate-no-ima-portable",
    sourceUrl: "https://regista.co.jp/products/saihate/",
    overview:
      "Saihate no Ima Portable is CyberFront and Xuse's 2012 PSP release of the juvenile adventure visual novel. Regista's product page lists the July 26, 2012 launch, CERO D rating, Japanese language support, Xuse original work, and CyberFront/KID brand credit, with Regista handling direction, programming, and scripting. That makes it a late PSP story-game import where content rating, edition, and text dependence define the listing.",
  },
  {
    id: "psp-saikyou-shogi-bonanza",
    sourceUrl: "https://www.success-corp.co.jp/software/psp/bonanza/",
    overview:
      "Saikyou Shogi Bonanza is Success's 2008 PSP shogi release built around the Bonanza computer-shogi program. Success lists the December 18, 2008 launch, shogi genre, one-to-two-player support, UMD and download pricing, and Kunihito Hoki/Magnolia copyright credit. It is a board-game utility for players who care about engine strength, rule practice, local play, and complete Japanese PSP packaging rather than a narrative campaign.",
  },
  {
    id: "psp-saikyou-toudai-shogi-deluxe",
    sourceUrl: "https://www.gameman.jp/item/24774.html",
    overview:
      "Saikyou Toudai Shogi Deluxe is the 2009 PSP entry in the Toudai Shogi line, credited in catalog data to NCS. Japanese game listings record an August 20, 2009 release and link it to Mycom's PSP shogi site, placing it as a later expanded handheld shogi package. The useful details are exact Deluxe subtitle, Japanese rules interface, single-UMD condition, and how it differs from the earlier Saikyou Toudai Shogi Portable release.",
  },
  {
    id: "psp-saikyou-toudai-shogi-portable",
    sourceUrl: "https://gamefaqs.gamespot.com/psp/924600-saikyou-toudai-shogi-portable/data",
    overview:
      "Saikyou Toudai Shogi Portable is Mycom's 2005 PSP board-game release in the Toudai Shogi series. GameFAQs lists the December 22, 2005 Japanese launch, Board/Card genre, one-player support, original UMD product code, later Mycom Best reissue, and PlayStation Store version. For collectors, the key differences are original versus budget packaging, product ID, Japanese shogi interface, and whether the copy includes manual and inserts.",
  },
  {
    id: "psp-saint-seiya-omega-ultimate-cosmos",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_Portable_games",
    overview:
      "Saint Seiya Omega: Ultimate Cosmos is Namco Bandai Games' 2012 Japan-only PSP fighting game based on the Saint Seiya Omega anime. Contemporary coverage framed it as a PSP adaptation of the then-new Omega series, separate from earlier Knights of the Zodiac console games and later Bandai Namco Saint Seiya releases. It is a licensed anime fighter where character roster, Japanese region, UMD condition, and series-specific branding carry the most value.",
  },
  {
    id: "psp-saki-portable",
    sourceUrl: "https://saki.fandom.com/wiki/Saki_Portable",
    overview:
      "Saki Portable is Alchemist's 2010 PSP mahjong game based on the Saki manga and anime. Series references identify it as a Japanese PSP release from March 25, 2010, and GameFAQs guides focus on school teams, character unlocks, story mode, and riichi mahjong play. It should read as an anime-license mahjong title, where Japanese text, character knowledge, and complete packaging are more useful than generic board-game labels.",
  },
  {
    id: "psp-saki-achiga-hen-episode-of-side-a-portable",
    sourceUrl: "https://en.wikipedia.org/wiki/Saki_(manga)",
    overview:
      "Saki: Achiga-Hen Episode of Side-A Portable is Alchemist's 2013 PSP follow-up tied to the Saki Achiga-hen side-story anime and manga. Saki series records list Alchemist as developer and August 29, 2013 as the PSP release date, positioning it after the original Saki Portable. The useful context is that this is a character-specific mahjong adaptation for Saki fans, with Japanese text, PSP import status, and edition completeness driving collector interest.",
  },
  {
    id: "psp-sakura-sakura-haru-urara",
    sourceUrl: "https://dengekionline.com/elem/000/000/261/261611/",
    overview:
      "Sakura Sakura: Haru Urara is GN Software's 2010 PSP romance-adventure port of the Sakura Sakura visual novel. Dengeki Online reported the August 26, 2010 PSP launch and covered the limited-edition bundle and shop bonuses, which are the details collectors most often need to separate standard copies from bonus-heavy releases. It is a Japanese story-game import defined by edition contents, character-route appeal, and text dependence.",
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
        "Priority PSP weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, publisher, database, retail, and series reference checks.",
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
