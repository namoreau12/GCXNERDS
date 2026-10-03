const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "psp.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "psp-priority-rain-renai-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "psp-rain-wonder-trip",
    sourceUrl: "https://gamefaqs.gamespot.com/psp/932389-rain-wonder-trip/data",
    overview:
      "Rain Wonder Trip is Bandai Namco and iNiS's 2006 PSP variety release built around Korean singer and actor Rain. GameFAQs lists regular and limited Japanese editions plus Asian and Korean releases, while contemporary coverage described movies, quizzes, fortune-telling, performance material, bonus UMD content, and collectible cards. It is best cataloged as idol media software, not a conventional puzzle game.",
  },
  {
    id: "psp-rakuen-danshi",
    sourceUrl: "https://www.4gamer.net/games/210/G021075/",
    overview:
      "Rakuen Danshi is Takuyo's 2013 PSP otome adventure, promoted in Japanese listings as Rakuen Danshi: Beast Harem. It adapts a shoujo-manga setup into a character-route visual novel for handheld play, with Japanese text and voice-cast appeal driving most of the experience. Marketplace notes should identify it as a Takuyo PSP romance import and call out standard versus limited packaging when present.",
  },
  {
    id: "psp-ranshima-monogatari-rare-land-story-shoujo-no-yakujou",
    sourceUrl: "https://www.play-asia.com/en/ranshima-monogatari-rare-land-story-shoujo-no-yakujou/13/702x3b",
    overview:
      "Ranshima Monogatari Rare Land Story: Shoujo no Yakujou is Arc System Works' 2009 PSP version of Lair Land Story. Retail descriptions frame it around nurturing Chiria through simulation commands while building friendships and romance in adventure scenes, closer to Princess Maker-style raising play than a typical RPG. The key listing signals are Japanese text dependence, Arc System Works packaging, and complete import condition.",
  },
  {
    id: "psp-rapala-pro-bass-fishing-2010",
    sourceUrl: "https://gamefaqs.gamespot.com/psp/998059-rapala-pro-bass-fishing-2010/faqs",
    overview:
      "Rapala Pro Bass Fishing 2010 is Fun Labs and Activision's PSP entry in the Rapala fishing line, released in 2010. GameFAQs identifies it as a nature-fishing sports game and notes the European title Rapala Pro Bass Fishing. It belongs to the tournament-style Rapala branch, so listings should separate it from Rapala Trophies and mention PSP region, manual condition, and the 2010 branding.",
  },
  {
    id: "psp-rapala-trophies",
    sourceUrl: "https://www.gamespot.com/games/rapala-trophies/",
    overview:
      "Rapala Trophies is Sand Grain Studios and Activision's 2006 PSP fishing release. GameSpot lists the game as a PSP hunting/fishing sports title, and catalog references distinguish it from the later Pro Bass Fishing 2010 entry. Its buyer-facing identity is a mid-2000s portable Rapala game with licensed lure branding, so region, UMD condition, and exact subtitle matter for collectors comparing similar fishing discs.",
  },
  {
    id: "psp-real-rode-portable",
    sourceUrl: "https://gamefaqs.gamespot.com/psp/986042-real-rode-portable/stats",
    overview:
      "Real Rode Portable is HuneX and Kadokawa's 2010 PSP visual-novel adventure, porting the otome fantasy premise from PlayStation 2 to handheld play. GameFAQs classifies the PSP version as Adventure > Visual Novel and records HuneX as developer. It should be listed as a Japanese romance-adventure import where text comprehension, edition, bonus items, and condition are more important than tactical or action-system labels.",
  },
  {
    id: "psp-rebellions-secret-game-2nd-stage",
    sourceUrl: "https://gamefaqs.gamespot.com/psp/692743-rebellions-secret-game-2nd-stage/faqs",
    overview:
      "Rebellions: Secret Game 2nd Stage is Yeti's 2013 PSP adventure entry in the Secret Game line. GameFAQs identifies it as an Adventure release from Yeti, and Yeti's official page marked the March 28, 2013 launch, download version, soundtrack, and store-bonus campaign. It is a Japanese visual-novel/suspense import, so exact title, edition, bonus contents, and language dependence should be explicit.",
  },
  {
    id: "psp-reel-fishing-the-great-outdoors",
    sourceUrl: "https://gamefaqs.gamespot.com/psp/933943-reel-fishing-the-great-outdoors/faqs",
    overview:
      "Reel Fishing: The Great Outdoors is Natsume's 2006 PSP entry in the Reel Fishing/Fish Eyes series. GameFAQs lists the Japanese title Fish Eyes Portable and classifies it as a nature-fishing sports game, while series references place it among Natsume's handheld fishing releases. Listings should distinguish it from Rapala games and note PSP region, Natsume/Marvelous publishing, and complete UMD condition.",
  },
  {
    id: "psp-renai-0-kilometer-portable",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_Portable_games",
    overview:
      "Renai 0 Kilometer Portable is Alchemist's 2013 PSP port of the romance visual novel Renai 0 Kilometer. It belongs to the late PSP wave of Japanese PC-origin story games, where route structure, character comedy, voice cast, and portable extras define the appeal. For collectors, the useful details are Alchemist publisher credit, Japanese text dependence, standard or limited edition status, and whether the copy includes inserts.",
  },
  {
    id: "psp-renai-banchou-2-midnight-lesson",
    sourceUrl: "https://www.otomate.jp/renai_bancho2/",
    overview:
      "Renai Banchou 2: Midnight Lesson!! is Idea Factory and Rejet's 2012 PSP otome adventure, released under the Otomate brand. The official site and Japanese coverage frame it as the second Renai Banchou romance-adventure entry, with character routes and B's-LOG/Rejet media ties. Listings should clearly mark it as the sequel, note Japanese text dependence, and distinguish standard packaging from limited or bonus editions.",
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
        "Priority PSP weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus GameFAQs, GameSpot, Play-Asia, publisher, official, and series references.",
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
