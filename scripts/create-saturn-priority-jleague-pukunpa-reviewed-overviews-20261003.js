const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "saturn.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "saturn-priority-jleague-pukunpa-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "saturn-j-league-pro-soccer-club-o-tsukurou-2",
    sourceUrl: "https://gamefaqs.gamespot.com/saturn/574177-jleague-pro-soccer-club-o-tsukurou-2/data",
    overview:
      "J.League Pro Soccer Club o Tsukurou! 2 is Sega's 1997 Saturn soccer management sequel, built around running a J.League club rather than playing arcade-style matches directly. Game reference data lists it as a Japan-only soccer simulation with one to eight local players, a November 20, 1997 release, and a later Saturn Collection budget reissue in 1999. Listings should distinguish the original release from the Saturn Collection version, note Japanese-language management depth, region, product code, and whether manuals or spine cards are included.",
  },
  {
    id: "saturn-jantei-battle-cos-player",
    sourceUrl: "https://www.mobygames.com/game/222489/jantei-battle-cos-player/",
    overview:
      "Jantei Battle Cos-Player is Daiki's Sega Saturn riichi mahjong release, developed by System Vision and framed around sci-fi cosplay opponents. MobyGames describes it as a four-way riichi mahjong game that mixes live-action and animated opponents, while other catalog records identify it as a Saturn exclusive. Marketplace listings should flag Japanese-language mahjong rules, mature import presentation, region lock, disc count or extras, and the difference between the play disc and any making-disc material.",
  },
  {
    id: "saturn-japan-super-bass-classic-96",
    sourceUrl: "https://gamefaqs.gamespot.com/saturn/574181-japan-super-bass-classic-96/data",
    overview:
      "Japan Super Bass Classic '96 is Naxat Soft's Japan-only Sega Saturn fishing game. GameFAQs classifies it as an individual fishing sports title for one player, with Naxat Soft as both developer and publisher and an August 23, 1996 Japanese release. Listings should spell out the 1996 subtitle, region, fishing-sim focus, single-player status, and complete-package details so it is not confused with later bass-fishing games on other platforms.",
  },
  {
    id: "saturn-jikkyo-powerful-pro-yakyu-s",
    sourceUrl: "https://konami.fandom.com/wiki/Jikky%C5%8D_Powerful_Pro_Yaky%C5%AB_S",
    overview:
      "Jikkyou Powerful Pro Yakyuu S is Konami's 1997 Sega Saturn entry in the long-running Power Pros baseball series. Catalog and series references place it in Japan with Konami Computer Entertainment Yokohama development and the series' familiar big-headed baseball presentation. Listings should call out the Saturn-specific S entry, Japanese teams and menus, region, save requirements, and whether buyers are getting this 1997 release rather than the earlier '95 Kaimaku-ban.",
  },
  {
    id: "saturn-jissen-mahjong",
    sourceUrl: "https://www.mobygames.com/game/208402/jissen-mahjong/",
    overview:
      "Jissen Mahjong is Imagineer's 1995 Sega Saturn riichi mahjong game, developed by Outback. MobyGames describes it as a four-player riichi mahjong title offering both 2D and full-3D table views, which makes it more specific than a general board-game compilation. Listings should mention Japanese-language mahjong rules, Saturn region, one-disc format, controller expectations, and complete-package condition for players or collectors seeking import mahjong software.",
  },
  {
    id: "saturn-jissen-pachinko-hisshouhou-3",
    sourceUrl: "https://www.mobygames.com/game/209424/jissen-pachi-slot-hisshoho-3/",
    overview:
      "Jissen Pachi-Slot Hisshouhou! 3 is Sammy's 1996 Saturn entry in the Jissen Pachinko and Pachi-Slot Hisshouhou gambling-simulation line. MobyGames identifies it as a pachi-slot simulation and part of Sammy's long-running series, while specialist database notes describe an adventure-style structure where players visit slot centers to win as much as possible. Listings should distinguish it from numbered sequels, note Japanese-only gambling-machine rules, Saturn region, and whether instructions or insert materials are present.",
  },
  {
    id: "saturn-jissen-pachinko-hisshouhou-4",
    sourceUrl: "https://www.gavas.jp/products/detail.php?product_id=1735",
    overview:
      "Jissen Pachi-Slot Hisshouhou! 4 is Sammy's 1997 Sega Saturn follow-up in its pachi-slot simulation series. Japanese catalog records list Sammy as publisher and place the Saturn release on March 15, 1997, keeping it separate from Jissen Pachi-Slot Hisshouhou! 3, Twin, and Iron Hook. Listings should preserve the exact number, identify it as a Japanese pachi-slot simulator, note region and language dependence, and separate standard-disc condition from any guidebook or accessory claims.",
  },
  {
    id: "saturn-jissen-pachinko-hisshouhou-twin",
    sourceUrl: "https://gamefaqs.gamespot.com/saturn/577731-jissen-pachi-slot-hisshouhou-twin",
    overview:
      "Jissen Pachi-Slot Hisshouhou! Twin is Sammy's 1997 Sega Saturn gambling simulation in the same Jissen Pachi-Slot and Pachinko Hisshouhou family. GameFAQs lists it as a Japan-only Saturn miscellaneous gambling release developed and published by Sammy Studios. Listings should make the Twin subtitle prominent, note Japanese-language slot-machine rules, region, related Sammy series entries, and complete packaging details so collectors can separate it from Jissen Pachi-Slot Hisshouhou! 3 and 4.",
  },
  {
    id: "saturn-jissen-pachi-slot-hisshouhou-iron-hook",
    sourceUrl: "https://gamefaqs.gamespot.com/saturn/310399-jissen-pachi-slot-hisshouhou-iron-hook",
    overview:
      "Jissen! Pachi-Slot Hisshouhou! Iron Hook is Sammy's 1996 Sega Saturn pachi-slot release built around the Iron Hook machine branding. GameFAQs lists it as a Japan-only miscellaneous gambling game from Sammy Studios, and Satakore records the Japanese Saturn product code T-2404G. Listings should include the Iron Hook subtitle, region, product-code or packaging details, Japanese-language gambling-machine focus, and whether the copy is complete with manual and spine card.",
  },
  {
    id: "saturn-joshikousei-no-houkago-pukunpa",
    sourceUrl: "https://www.mobygames.com/game/211196/pukunpa-joshikosei-no-hokago/releases/",
    overview:
      "Joshikousei no Houkago... Pukunpa, also cataloged as Pukunpa: Joshikosei no Hokago..., is Athena's 1996 Japan-only puzzle game for Sega Saturn and PlayStation. MobyGames release data lists Athena as publisher and Insect as developer for the September 27, 1996 Saturn release, while gameplay footage and catalog references place it in the falling-piece puzzle lane. Listings should identify the Athena puzzle release, note region and language dependence, distinguish Saturn from PlayStation copies, and call out complete-case extras for import collectors.",
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
    if (!game) throw new Error(`Missing Saturn game ${rewrite.id}`);
    return {
      platformSlug: "saturn",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Saturn weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus publisher, specialist game-reference, and import-collector sources.",
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
