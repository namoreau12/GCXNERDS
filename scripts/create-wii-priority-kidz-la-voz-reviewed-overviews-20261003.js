const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "wii.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "wii-priority-kidz-la-voz-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "wii-kidz-sports-crazy-mini-golf",
    sourceUrl: "https://gamefaqs.gamespot.com/wii/948249-kidz-sports-crazy-golf/data",
    overview:
      "Kidz Sports Crazy Mini Golf, released as Kidz Sports: Crazy Golf in North America, is Data Design Interactive's Wii arcade mini-golf game. GameFAQs lists four courses, 72 holes, one-to-four-player local play, and regional naming differences, which are the details that separate it from the Wii's many casual sports packages. Collectors should check the Kidz Sports branding, Crazy Golf versus Crazy Mini Golf title variant, region, and whether a copy is the MotionPlus-compatible or competition-pack release.",
  },
  {
    id: "wii-kidz-sports-crazy-mini-golf-2",
    sourceUrl: "https://www.mobygames.com/game/90696/crazy-mini-golf-2/",
    overview:
      "Kidz Sports: Crazy Mini Golf 2 is Data Design Interactive's 2009 Wii follow-up to the original Kidz Sports/Crazy Golf release. MobyGames and Wii catalog references tie it to Crazy Mini Golf 2 naming, Data Design development, and a later Wii release window, so it is best cataloged as a separate sequel rather than a variant of the first game. Buyer-facing notes should call out the exact title, region/publisher, casual mini-golf focus, and complete case/manual condition.",
  },
  {
    id: "wii-kiki-trick",
    sourceUrl: "https://www.nintendo.co.jp/wii/st3j/index.html",
    overview:
      "Kiki Trick is Nintendo SPD's Japan-only Wii listening game, released by Nintendo on January 19, 2012. Nintendo's official page presents it around sound, voice, and hearing-based activities for one to four players, including listening battles, sound quizzes, and playful audio gadgets. It is an unusual first-party Wii experiment, so the most useful listing details are Japanese region, language/audio dependence, party-game support, and complete packaging.",
  },
  {
    id: "wii-king-of-pool",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Wii_games",
    overview:
      "King of Pool is a 2009 Wii billiards release from Ivolgamus and Nordcurrent, part of the console's wave of motion-controlled pub and cue-sport games. Its appeal is table pool with Wii Remote aiming rather than licensed league play, so it should be listed closer to casual billiards and bar-sports software than annual sports simulations. Region, publisher, supported modes, and whether the buyer wants a European-style budget sports title are the practical distinctions.",
  },
  {
    id: "wii-knockout-party",
    sourceUrl: "https://wiki-origin.giantbomb.com/wiki/Games/Knockout_Party",
    overview:
      "Knockout Party is Ubisoft and Hydravision Entertainment's Wii minigame collection framed as an over-the-top TV game show. Its focus is local party play built from obstacle courses, races, and quick challenges, not a boxing or combat title despite the name. Marketplace listings should make the party-game format, Wii Remote motion focus, Ubisoft/Hydravision credit, region, and family multiplayer context obvious.",
  },
  {
    id: "wii-kotoba-no-puzzle-mojipittan-wii-deluxe",
    sourceUrl: "https://www.bandainamcoent.co.jp/cs/list/mojipittan/wiidx/",
    overview:
      "Kotoba no Puzzle: Mojipittan Wii Deluxe is Bandai Namco's 2008 Wii retail expansion of the Japanese word-puzzle series. Bandai Namco notes that it includes the WiiWare puzzle stages, paid add-on stages, and 110 Deluxe-exclusive stages, with one-to-two-player play and a large Japanese dictionary powering the chain-word puzzles. It is highly language-dependent, so collectors should flag Japanese text fluency, Wii Deluxe versus WiiWare version, and complete Japanese packaging.",
  },
  {
    id: "wii-kylie-sing-and-dance",
    sourceUrl: "https://www.mobygames.com/game/217978/kylie-sing-dance/",
    overview:
      "Kylie: Sing & Dance is Tubby Games' Wii music party release built around Kylie Minogue songs, official music videos, and on-screen lyrics. It belongs with celebrity-specific karaoke and dance discs rather than broad Just Dance-style compilations, with appeal tied directly to the artist license. Listings should identify the European Wii release, microphone or singing expectations, track/video focus, and whether the buyer wants a Kylie-focused party game rather than a general pop catalog.",
  },
  {
    id: "wii-l-esprit-du-loup",
    sourceUrl: "https://www.jeuxvideo.com/jeux/wii/00033044-l-esprit-du-loup.htm",
    overview:
      "L'esprit du Loup is Strass Productions and Tradewest's French Wii educational game inspired by Nicolas Vanier's film Loup. Jeuxvideo.com describes a ludo-educational release built around the Grand North, wolf themes, quizzes, and multiplayer minigames such as sled racing. The collector context is French-language content, European Wii distribution, film tie-in, family education angle, and whether a copy is complete with its regional packaging.",
  },
  {
    id: "wii-la-voz-vol-2",
    sourceUrl: "https://media.wiredproductions.com/wired-history/",
    overview:
      "La Voz Vol. 2 is a Spanish-market Wii karaoke release tied to The Voice/La Voz brand, with Wired Productions connected to La Voz production work during its karaoke-game period. It should be treated as a regional singing-game volume, not a generic minigame compilation: microphone support, Spanish song selection, TV-license branding, and Badland Games packaging are the reasons a collector would separate it from We Sing or Karaoke Revolution.",
  },
  {
    id: "wii-la-voz-vol-3",
    sourceUrl: "https://www.gametdb.com/Wii/SLNP7M",
    overview:
      "La Voz Vol. 3 is the third Wii entry in the Spanish La Voz karaoke line, cataloged with Badland Games, Wired Productions, and Le Cortex credits. GameTDB describes it as a closer official La Voz game experience with new features and game modes, making the volume number and TV-show license central to identification. Listings should call out Spanish-region release context, microphone/karaoke use, exact Vol. 3 packaging, and song-catalog expectations.",
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
    if (!game) throw new Error(`Missing Wii game ${rewrite.id}`);
    return {
      platformSlug: "wii",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Wii weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, publisher, regional retail, and specialist game-reference sources.",
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
