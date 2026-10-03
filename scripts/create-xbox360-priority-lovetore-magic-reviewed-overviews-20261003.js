const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "xbox360.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "xbox360-priority-lovetore-magic-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "xbox360-love-tore-chocolate-love-tore-trilogy-set-a-k-a-love-tra",
    sourceUrl: "https://www.trueachievements.com/game/Love-Tore-Sweet/walkthrough/1",
    overview:
      "Love Tore: Chocolate is the retail trilogy bundle for Boost On's Japan-only Love Tore Kinect games, collecting the Sweet, Mint, and Bitter releases under the Love*Tra name. The practical appeal is very specific: Kinect exercise and dance routines, idol-style character presentation, Japanese text, and NTSC-J hardware expectations all matter before a collector treats it as a standard Xbox 360 game.",
  },
  {
    id: "xbox360-love-tore-mint-a-k-a-love-tra",
    sourceUrl: "https://www.trueachievements.com/game/Love-Tore-Mint/achievements",
    overview:
      "Love Tore: Mint is a Japan-only Xbox 360 Kinect release from Boost On, using motion-controlled dance and training routines around anime-style character lessons. TrueAchievements flags the game as Kinect-required, so the important context is physical Kinect play, Japanese-language menus, import compatibility, and how Mint sits between Sweet and Bitter in the Love Tore set.",
  },
  {
    id: "xbox360-love-tore-sweet-a-k-a-love-tra",
    sourceUrl: "https://www.trueachievements.com/game/Love-Tore-Sweet/walkthrough/1",
    overview:
      "Love Tore: Sweet is the first Love Tore release on Xbox 360, a retail-only Kinect game built around dance practice, score goals, and character progression. It is not a conventional visual novel despite the presentation; buyers need to know it requires Kinect, uses Japanese text, and shares trilogy context with Mint, Bitter, and the Chocolate bundle.",
  },
  {
    id: "xbox360-lucha-fury",
    sourceUrl: "https://www.mobygames.com/game/61992/lucha-fury/",
    overview:
      "Lucha Fury is Punchers Impact's Xbox Live Arcade beat-'em-up, published by Coktel in 2011 and themed around over-the-top masked wrestling. It plays as a side-scrolling brawler with local co-op energy, cartoon luchador style, and digital-marketplace history, which makes ownership and delisting context more useful than disc-condition notes.",
  },
  {
    id: "xbox360-lumines-live",
    sourceUrl: "https://www.xbox.com/en-US/games/store/lumines-live/BV77KRZQZQ5F/0001",
    overview:
      "Lumines Live! brings Q Entertainment's music-driven block puzzle series to Xbox Live Arcade, pairing falling-square pattern play with skins, music, time pressure, and score chasing. On Xbox 360 its identity is tied to the downloadable XBLA format, add-on packs, leaderboards, and Tetsuya Mizuguchi's audiovisual puzzle design rather than a boxed retail campaign.",
  },
  {
    id: "xbox360-machi-ing-maker-4",
    sourceUrl: "https://www.xboxachievements.com/game/machi-ing-maker-4/overview/",
    overview:
      "Machi-ing Maker 4 is D3 Publisher's Japan-only Xbox 360 town-building and management sequel, continuing the long-running city-planning line known outside Japan through Metropolismania. It is a niche import where zoning, resident needs, and gradual urban growth are the draw, with language dependence and Japanese release status doing most of the collector filtering.",
  },
  {
    id: "xbox360-madden-nfl-10",
    sourceUrl: "https://www.mobygames.com/game/59861/madden-nfl-10/",
    overview:
      "Madden NFL 10 is EA Tiburon's 2009 NFL entry, remembered on Xbox 360 and PS3 for the Pro-Tak animation system, gang tackles, and a more physical on-field pace. It is one of the annual Madden releases where the roster year, Troy Polamalu and Larry Fitzgerald cover, Online Franchise era, and platform-specific feature set matter more than the generic football label.",
  },
  {
    id: "xbox360-madden-nfl-15",
    sourceUrl: "https://news.xbox.com/en-us/2014/08/26/games-madden-defense-feature/",
    overview:
      "Madden NFL 15 is EA Sports' 2014 football release for Xbox 360, built around a defensive-control push rather than just a roster refresh. Xbox Wire highlighted new pass-rush, tackling, and coverage emphasis, so this entry is best separated from nearby Maddens by its defense-first design pitch, Richard Sherman cover season, and cross-generation Xbox release context.",
  },
  {
    id: "xbox360-magic-the-gathering-duels-of-the-planeswalkers",
    sourceUrl: "https://www.stainlessgames.com/games/magic-the-gathering",
    overview:
      "Magic: The Gathering - Duels of the Planeswalkers is Stainless Games' 2009 Xbox Live Arcade adaptation of Wizards of the Coast's card game. It focuses on approachable digital Magic through guided decks, campaign duels, puzzles, and online play, making it important as the launch point for the console Duels line rather than a freeform deck-building replacement for tabletop Magic.",
  },
  {
    id: "xbox360-magic-the-gathering-2012",
    sourceUrl: "https://www.stainlessgames.com/games/magic-the-gathering",
    overview:
      "Magic: The Gathering 2012 is Stainless Games' 2011 Duels sequel for Xbox 360, PC, and PlayStation, expanding the digital card-game structure with new decks, opponents, puzzles, and Archenemy-style multiplayer. It stands as a distinct annual Duels entry for players tracking delisted XBLA card games and the evolution of accessible digital Magic before Arena.",
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
        "Priority Xbox 360 weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus Microsoft, Xbox Wire, Stainless Games, MobyGames, TrueAchievements, and specialist reference material.",
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
