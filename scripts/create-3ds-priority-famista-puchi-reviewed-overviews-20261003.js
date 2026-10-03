const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "3ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-famista-puchi-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "3ds-pro-yakyuu-famista-climax",
    sourceUrl: "https://www.8ing.co.jp/titles/famista2017/",
    overview:
      "Pro Yakyuu Famista Climax is Bandai Namco Entertainment and Eighting's 2017 Nintendo 3DS baseball-action entry, released for the Famista series' 30th anniversary. Eighting's product page highlights 2017 Japanese pro baseball data, legendary players, women's pro baseball players, mascot players, custom stadium creation, Dream Pennant, Famista Quest, and online ranked play. Marketplace listings should call out Japanese-region 3DS compatibility, cartridge and case completeness, baseball-license appeal, and whether any first-print or code-based extras are included.",
  },
  {
    id: "3ds-pro-yakyuu-famista-returns",
    sourceUrl: "https://www.8ing.co.jp/titles/famista2015/",
    overview:
      "Pro Yakyuu Famista Returns is the 2015 Nintendo 3DS return of Bandai Namco's long-running Famista baseball-action series, developed by Eighting. The developer page describes simple pick-up-and-play baseball, Dream Pennant, online versus play, Famista Quest, and OB players, while Bandai Namco's trailer materials tie it to 2015 player data. Listings should identify the Japanese retail release, note online features as historical 3DS-era functionality, and verify cartridge, case, manual or insert condition.",
  },
  {
    id: "3ds-proun",
    sourceUrl: "https://www.nintendo.com/en-za/Games/Nintendo-3DS-download-software/Proun-972164.html",
    overview:
      "Proun+ is Engine Software and Joost van Dongen's Nintendo 3DS download release of the abstract pipe-racing game, where players guide a ball around a twisting track while dodging obstacles. Nintendo's European listing places it in action, party, racing, and arcade categories with English, French, and German language support. Since 3DS eShop purchases ended in 2023, listings should be careful about transferability, region, installed-console status, and whether a seller is describing the delisted download rather than a physical cartridge.",
  },
  {
    id: "3ds-psycho-pigs",
    sourceUrl: "https://www.lightweight.tokyo/us/psychopigs/",
    overview:
      "Psycho Pigs is Bergsala Lightweight's Nintendo 3DS remake of Jaleco's 1987 arcade bombing-action game Butasan, licensed from Mechanic Arms. The official site describes a 3DS download built around throwing bombs, arena hazards, tournament modes, Endless play, and local or online multiplayer for up to four players. Useful marketplace notes include eShop download status, regional availability, multiplayer expectations after the 3DS online-service era, and the distinction from older Butasan console ports.",
  },
  {
    id: "3ds-puchi-novel-betsuri-no-juuichigatsu",
    sourceUrl: "https://www.famitsu.com/news/201411/12065525.html",
    overview:
      "Puchi Novel: Betsuri no Juuichigatsu is Flyhigh Works and talestune's twelfth 3DS eShop chapter in the Harvest December visual-novel cycle. Famitsu describes it as a 200-yen download centered on the November fallout from a major choice, leading the connected story toward its ending. Listings should treat it as a Japanese-language digital visual novel, note that it was part of a 13-story sequence, and avoid implying that it has a standalone cartridge release.",
  },
  {
    id: "3ds-puchi-novel-hadan-no-juugatsu",
    sourceUrl: "https://flyhighworks.heteml.net/games_b/gallery/putit-oct",
    overview:
      "Puchi Novel: Hadan no Juugatsu is the October chapter of Flyhigh Works and talestune's 3DS Puchi Novel series, released as a low-price Japanese eShop visual novel. Flyhigh Works' page frames it around students in the town of Tagami, a school festival, and a decisive moment for Masaki and Kohei. Marketplace records should note Japanese text dependence, download-only distribution, 2014 release timing, and its position near the end of the Harvest December monthly storyline.",
  },
  {
    id: "3ds-puchi-novel-kongi-no-rokugatsu",
    sourceUrl: "https://www.gamer.ne.jp/news/201406240045/",
    overview:
      "Puchi Novel: Kongi no Rokugatsu is the seventh Puchi Novel chapter from Flyhigh Works and talestune for Nintendo 3DS download software. Gamer's release coverage identifies it as a 200-yen visual novel focused on Sanae and Kohei as their feelings and post-graduation paths create a new trial. Listings should identify the Japanese 3DS eShop format, the linked Harvest December continuity, language dependence, and the absence of normal boxed-copy condition details.",
  },
  {
    id: "3ds-puchi-novel-kyouiki-no-ichigatsu",
    sourceUrl: "https://www.4gamer.net/games/135/G013574/20140122004/",
    overview:
      "Puchi Novel: Kyouiki no Ichigatsu is the second entry in Flyhigh Works and talestune's Puchi Novel series for Nintendo 3DS, following the Harvest December setup. 4Gamer describes the series as an inexpensive, one-handed-friendly visual-novel format and outlines this January chapter around Masaki, Mizuho, the Sakashima shrine, and the land god Madoi. Trade listings should mention Japanese-only story text, download-only release, 200-yen launch pricing, and its role as one episode in a 13-part sequence.",
  },
  {
    id: "3ds-puchi-novel-renren-no-sangatsu",
    sourceUrl: "https://flyhighworks.heteml.net/games_b/gallery/putit-mar",
    overview:
      "Puchi Novel: Renren no Sangatsu is the March chapter of Flyhigh Works and talestune's Puchi Novel line for Nintendo 3DS download software. Flyhigh Works' page lists the 2014 release and describes a babysitting story involving Masaki, Yuki, and the baby Ren, keeping the format focused on short-session visual-novel reading. Listings should disclose Japanese-language dependence, eShop-only distribution, the lack of cartridge packaging, and its place in the broader Harvest December monthly arc.",
  },
  {
    id: "3ds-puchi-novel-seiran-no-shigatsu",
    sourceUrl: "https://flyhighworks.heteml.net/games_b/works",
    overview:
      "Puchi Novel: Seiran no Shigatsu is Flyhigh Works and talestune's April 2014 Puchi Novel release for Nintendo 3DS download software. Flyhigh Works' release-history page places it in the same monthly 3DS-DL run as Kyouiki no Ichigatsu, Renren no Sangatsu, Kongi no Rokugatsu, and the later November and December chapters. Marketplace listings should mark it as a Japanese eShop visual novel, identify the linked Harvest December story cycle, and avoid cartridge-style condition claims unless discussing the console that already has it installed.",
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
        "Priority 3DS weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, developer, store, publisher, and specialist game-reference sources.",
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
