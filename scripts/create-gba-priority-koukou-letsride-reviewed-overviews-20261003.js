const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "gba.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "gba-priority-koukou-letsride-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "gba-koukou-juken-advance-series-eitangohen-2000-words-shuuroku",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Game_Boy_Advance_games",
    overview:
      "Koukou Juken Advance Series: Eitangohen 2000 Words Shuuroku is a Japan-only Game Boy Advance study title from Keynet and NDcube focused on high-school entrance exam English vocabulary. The title identifies its core hook clearly: a 2,000-word English vocabulary set presented as portable drill software rather than a conventional game. Collectors should treat it as Japanese educational software and verify region, cartridge label, box/manual completeness, and whether they are looking for this word-volume rather than another Koukou Juken Advance Series unit.",
  },
  {
    id: "gba-kurohige-no-golf-shiyouyo",
    sourceUrl: "https://www.mobygames.com/game/186442/kurohige-no-golf-shiyoyo/",
    overview:
      "Kurohige no Golf Shiyouyo is Tomy's 2002 Japan-only Game Boy Advance golf game developed by Inti Creates. MobyGames ties it to the Golf Shiyou yo line and Tomy's Kurohige Kiki Ippatsu/Pop-up Pirate character license, which makes it more specific than a generic handheld golf release. Useful listing details are Japanese region, Tomy branding, Inti Creates development credit, cartridge-only versus complete copy, and whether the buyer wants a Kurohige character golf game rather than Mario Golf-style tournament play.",
  },
  {
    id: "gba-kurohige-no-kurutto-jintori",
    sourceUrl: "https://www.gamesdatabase.org/game/nintendo-game-boy-advance/kurohige-no-kurutto-jintori",
    overview:
      "Kurohige no Kurutto Jintori is a 2002 Japan-only Game Boy Advance puzzle game from Tomy and Happy-Smile. Games Database identifies the same Kurohige character connection and describes play around rotating spheres to make matching combinations and unlock stages. It should be cataloged as a Kurohige puzzle spinoff, with region, publisher, developer, complete packaging, and distinction from Kurohige no Golf Shiyouyo all called out for collectors.",
  },
  {
    id: "gba-legend-of-dynamic-goushouden-houkai-no-rondo",
    sourceUrl: "https://gamefaqs.gamespot.com/gba/918934-legend-of-dynamic-goushouden-houkai-no-rondo/data",
    overview:
      "Legend of Dynamic Goushouden: Houkai no Rondo is a Japan-only Game Boy Advance role-playing game developed by Will and published by Banpresto in 2003. GameFAQs lists it as a one-player RPG with the Japanese product code AGB-P-AVDJ, making the subtitle and publisher details important for identification. Buyers should expect Japanese-language RPG content and should verify cartridge label, box/manual condition, region, and whether a listing uses a variant romanization of Goushouden.",
  },
  {
    id: "gba-legendz-sign-of-nekuromu",
    sourceUrl: "https://en.wikipedia.org/wiki/Legendz#Video_games",
    overview:
      "Legendz: Sign of Nekuromu is a 2005 Game Boy Advance entry tied to Bandai's Legendz media and toy franchise. The game belongs with the series' creature-battling tie-ins, so its value is in the Japanese Legendz license, Bandai publishing, and import RPG/collection context rather than broad western name recognition. Listings should make the Japanese release context, exact Sign of Nekuromu subtitle, cartridge condition, and any accessory or franchise expectations clear.",
  },
  {
    id: "gba-legendz-yomigaeru-shiren-no-shima",
    sourceUrl: "https://en.wikipedia.org/wiki/Legendz#Video_games",
    overview:
      "Legendz: Yomigaeru Shiren no Shima is Bandai and Bec's 2004 Game Boy Advance Legendz release, part of the same Japanese creature franchise as Sign of Nekuromu. It should be separated from the later Sign of Nekuromu entry because the subtitle, release year, and developer differ. Collector listings should foreground the Japanese-language franchise tie-in, Bandai/Bec credit, cartridge and packaging condition, and whether the buyer is building a complete Legendz handheld set.",
  },
  {
    id: "gba-lego-star-wars-ii-the-original-trilogy",
    sourceUrl: "https://support.starwars.com/hc/en-us/articles/360000714883-How-do-I-play-LEGO-STAR-WARS-II-The-Original-Trilogy-on-Nintendo-platforms",
    overview:
      "Lego Star Wars II: The Original Trilogy on Game Boy Advance is Amaze Entertainment's handheld version of the 2006 LEGO Star Wars sequel from LucasArts. Official Star Wars support notes GBA-specific constraints, including no custom character option and chapter unlock progression beginning with Blockade Runner, which helps distinguish this version from the console releases. Listings should identify the GBA edition, region, manual/box condition, save functionality, and whether the buyer expects handheld compromises rather than the full console feature set.",
  },
  {
    id: "gba-lemony-snicket-s-a-series-of-unfortunate-events",
    sourceUrl: "https://gamefaqs.gamespot.com/gba/920540-lemony-snickets-a-series-of-unfortunate-events/faqs",
    overview:
      "Lemony Snicket's A Series of Unfortunate Events is Griptonite Games' Game Boy Advance adaptation of the 2004 film and book series, published by Activision. GameFAQs identifies the GBA release as a 2D action-platformer, while broader platform notes distinguish the handheld version from the console adventure games. For buyers, the important signals are the GBA-specific side-scrolling version, movie/license branding, single-player format, region, and complete packaging condition.",
  },
  {
    id: "gba-let-s-ride-dreamer",
    sourceUrl: "https://gamefaqs.gamespot.com/gba/932099-lets-ride-dreamer/data",
    overview:
      "Let's Ride! Dreamer is THQ's Game Boy Advance horse-riding game, released in North America in 2006 with Kritzelkratz development credits and European alternate titles such as Pferd & Pony: Lass Uns Reiten 2. GameFAQs describes a DreamWorks-inspired setup built around training, grooming, riding, jumping, and dressage events with Sonya or a chosen horse. Listings should clarify the regional title variant, horse-care/riding focus, publisher, and whether a copy is cartridge-only or complete.",
  },
  {
    id: "gba-let-s-ride-friends-forever",
    sourceUrl: "https://www.gamespot.com/games/lets-ride-friends-forever/",
    overview:
      "Let's Ride! Friends Forever is a later handheld horse-care and riding entry associated with THQ, ValuSoft, and dtp Young Entertainment, appearing across GBA, DS, and PC around 2007. It fits the series' stable-management niche: caring for horses, building bonds, and moving through approachable riding goals rather than arcade racing. Collector-facing listings should separate the GBA release from the DS and PC versions, note regional packaging, and make cartridge/box/manual condition clear.",
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
    if (!game) throw new Error(`Missing GBA game ${rewrite.id}`);
    return {
      platformSlug: "gba",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority GBA weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, publisher, regional database, and specialist game-reference sources.",
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
