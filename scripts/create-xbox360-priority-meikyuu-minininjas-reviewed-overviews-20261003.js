const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "xbox360.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "xbox360-priority-meikyuu-minininjas-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "xbox360-meikyuu-cross-blood-reloaded",
    sourceUrl: "https://gamefaqs.gamespot.com/xbox360/638408-meikyuu-cross-blood-reloaded",
    overview:
      "Meikyuu Cross Blood: Reloaded is Experience Inc. and Kadokawa's Japan-only Xbox 360 dungeon RPG, released in 2011 as an expanded console version of the Cross Blood line. Game reference records list it as an adventure-style Xbox 360 release from Experience and Kadokawa, but collectors usually care most about its import RPG context, Japanese text, and physical availability. Listings should identify the Japanese region, language barrier, dungeon-crawling party progression, and whether the copy includes manual, case, and any first-print extras.",
  },
  {
    id: "xbox360-memories-off-6-next-relation",
    sourceUrl: "https://memoriesoff.jp/6nr/specx.html",
    overview:
      "Memories Off 6: Next Relation is 5pb.'s 2009 Japanese visual novel sequel to Memories Off 6: T-wave, released for PlayStation 2 and Xbox 360. The official 5pb. product page lists the August 27, 2009 date and Xbox 360 double-pack context, making edition details important for buyers. Listings should call out the Japanese-language story routes, sequel status, platform, standard versus limited or double-pack packaging, and completeness of soundtrack, booklet, or bonus items when present.",
  },
  {
    id: "xbox360-men-in-black-alien-crisis",
    sourceUrl: "https://investor.activision.com/news-releases/news-release-details/activision-publishings-men-black-alien-crisistm-video-game-hits",
    overview:
      "Men in Black: Alien Crisis is Activision and Fun Labs' 2012 movie-tie-in shooter for Xbox 360, PlayStation 3, and Wii. Activision's launch announcement positions it around extraterrestrial combat alongside the Men in Black film brand, while specialist records describe the Xbox 360 version as an on-rails third-person shooter. Listings should mention the standalone tie-in story, Teen rating, platform, region, controller or light-gun accessory expectations, and whether the copy is complete with manual and case.",
  },
  {
    id: "xbox360-merv-griffin-s-crosswords",
    sourceUrl: "https://gamefaqs.gamespot.com/xbox360/955661-merv-griffins-crosswords/boxes/113408",
    overview:
      "Merv Griffin's Crosswords is THQ and Pipeworks Software's Xbox 360 adaptation of the short-lived crossword game-show format. GameFAQs box data places the Xbox 360 release in the United States on November 20, 2008, while show records connect the console version to the broader Crosswords promotion. Listings should identify it as an Xbox Live Arcade-style word puzzle release, note English-language dependence, region or download status, and distinguish it from Wii, mobile, or television-show merchandise.",
  },
  {
    id: "xbox360-michael-phelps-push-the-limit",
    sourceUrl: "https://www.gamespot.com/games/michael-phelps-push-the-limit/",
    overview:
      "Michael Phelps: Push the Limit is 505 Games and Blitz Games Studios' Kinect swimming game for Xbox 360. Publisher-era coverage and game reference pages identify it as a 2011 motion-control sports release built around competitive swimming and Michael Phelps branding. Listings should make Kinect sensor requirements obvious, note region and physical-disc condition, and describe it as a controller-free swimming simulation rather than a standard button-driven sports game.",
  },
  {
    id: "xbox360-might-and-magic-duel-of-champions-forgotten-wars",
    sourceUrl: "https://news.xbox.com/en-us/2014/07/23/arcade-forgotten-wars-now-available-xbox-360/",
    overview:
      "Might & Magic: Duel of Champions - Forgotten Wars is Ubisoft's Xbox Live Arcade adaptation of the Might & Magic card-battle game. Xbox Wire announced the Xbox 360 release on July 23, 2014, presenting it as a digital Arcade title set in the Might & Magic universe. Listings should flag its XBLA digital status, card-battler structure, region and account availability, and whether any claimed copy is a code, delisted digital license, or related downloadable content rather than a normal retail disc.",
  },
  {
    id: "xbox360-minecraft-story-mode-season-two",
    sourceUrl: "https://en.wikipedia.org/wiki/Minecraft:_Story_Mode",
    overview:
      "Minecraft: Story Mode Season Two is Telltale Games' 2017 episodic adventure continuation of its Minecraft narrative series, released late in the Xbox 360's life alongside newer platforms. Series references place the first Season Two episode on Xbox 360, Xbox One, Windows, mobile, and PlayStation platforms, with Telltale's choice-driven dialogue and set-piece format replacing sandbox building. Listings should state whether the disc or license includes only episode access, note delisting and download risks, region, language, and whether later episodes are actually playable on the buyer's console.",
  },
  {
    id: "xbox360-minesweeper-flags",
    sourceUrl: "https://news.xbox.com/en-us/2009/02/11/arcade-minesweeper-flags/",
    overview:
      "Minesweeper Flags is TikGames and Microsoft Game Studios' Xbox Live Arcade version of Minesweeper for Xbox 360. Xbox Wire's 2009 listing highlights LIVE multiplayer Flags mode, achievements, rankings, ratings, TrueSkill support, and a storage requirement for a hard drive or 512MB memory unit. Listings should describe it as a digital XBLA puzzle game, note delisting or license-transfer concerns, storage needs, multiplayer focus, and the distinction from the Windows Minesweeper bundled game.",
  },
  {
    id: "xbox360-mini-ninjas",
    sourceUrl: "https://www.xbox.com/en-us/games/store/mini-ninjas/9PJTNN475R4H",
    overview:
      "Mini Ninjas is IO Interactive and Eidos Interactive's 2009 action-adventure game for Xbox 360 and other platforms. The Xbox store page describes playing as Hiro and five other mini ninjas with distinct skills and fighting styles, while broader catalog records place it across Xbox 360, PlayStation 3, Wii, PC, and Nintendo DS. Listings should identify the retail Xbox 360 version, note region and language, mention its approachable stealth-action adventure format, and separate it from the later Kinect-only Mini Ninjas Adventures.",
  },
  {
    id: "xbox360-mini-ninjas-adventures",
    sourceUrl: "https://www.mobygames.com/game/58009/mini-ninjas-adventures/",
    overview:
      "Mini Ninjas Adventures is Square Enix and Side-Kick's 2012 Xbox Live Arcade spin-off built specifically for Kinect on Xbox 360. MobyGames and announcement coverage identify it as a Kinect-controlled action game separate from IO Interactive's 2009 Mini Ninjas, with body and voice input used for attacks and Kuji magic. Listings should make Kinect requirements, digital XBLA status, region availability, and the spin-off relationship clear so buyers do not confuse it with the disc-based original.",
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
    if (!game) throw new Error(`Missing Xbox 360 game ${rewrite.id}`);
    return {
      platformSlug: "xbox360",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Xbox 360 weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, publisher, platform-store, and specialist game-reference sources.",
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
