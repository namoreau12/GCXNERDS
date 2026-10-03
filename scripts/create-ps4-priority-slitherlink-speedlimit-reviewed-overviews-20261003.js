const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-slitherlink-speedlimit-reviewed-overviews-2026-10-03.csv"
);

const rewriteNotes =
  "Priority PS4 weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus recorded source, platform, publisher, developer, and storefront references.";

const reviewedOverviews = [
  {
    id: "ps4-slitherlink",
    sourceUrl: "https://en.wikipedia.org/wiki/Slitherlink",
    overview:
      "Slitherlink brings the Nikoli-style loop puzzle format to PS4 through Hamster's early Japanese PlayStation Store catalog. Players work from numbered cells and empty borders, using deduction to draw one continuous loop without guessing. For collectors, the useful details are its Japan-only PS4 release path, puzzle-language accessibility, digital availability, and the distinction between this standalone logic puzzle and broader puzzle compilations.",
  },
  {
    id: "ps4-smelter",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "Smelter mixes side-scrolling action stages with light real-time strategy, casting Eve alongside the living armor Smelter in a campaign that alternates between combat and territory control. The PS4 entry matters as a Dangen Entertainment and X Plus release for players tracking hybrid indie games, with platform, region, physical or digital format, and the action-versus-strategy split doing the real identification work.",
  },
  {
    id: "ps4-smugglecraft",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "SmuggleCraft is a hovercraft racing game from Happy Badger Studio built around fast courier runs, branching choices, and procedurally assembled tracks. Its PS4 listing is most useful when it explains the arcade-racing feel, single-player smuggling structure, and indie digital-release context rather than treating it as a generic racer. Collectors should verify region, format, and whether a listing is for the console version instead of the PC release.",
  },
  {
    id: "ps4-snakeybus",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "Snakeybus turns the classic snake-growth idea into a chaotic bus-driving score chase, asking players to pick up passengers while the vehicle stretches into an increasingly hard-to-route trail. The PS4 version is a Digerati-published console release from Stovetop Studios, useful for collectors who follow oddball indie ports where format, region, local play expectations, and arcade high-score focus separate it from ordinary driving games.",
  },
  {
    id: "ps4-snooker-nation-championship",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "Snooker Nation Championship adapts match snooker to PS4 with Cherry Pop Games' focus on table physics, aiming, and tournament-style repeat play. It belongs with the platform's smaller sports simulations rather than annual licensed franchises, where region, digital or physical format, control preference, online-feature expectations, and the snooker-specific ruleset matter more than roster-year branding.",
  },
  {
    id: "ps4-snow-moto-racing-freedom",
    sourceUrl: "https://en.wikipedia.org/wiki/Snow_Moto_Racing_Freedom",
    overview:
      "Snow Moto Racing Freedom is Zordix's snowmobile racer for PS4, centered on winter tracks, arcade handling, and event-based competition rather than licensed car culture. It is a niche racing-library entry where the snowmobile theme is the identifier. Collectors should confirm region, format, multiplayer or online-feature status, and whether nearby listings confuse it with other Zordix racing releases.",
  },
  {
    id: "ps4-so-many-me",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "So Many Me is a puzzle-platformer from Extend Interactive and Origo Games built around controlling Filo and his duplicate companions to solve rooms, block hazards, and reach new areas. On PS4 it fits the indie puzzle-platform shelf, where mechanics, console version, region, format, and the single-player puzzle campaign are more useful identifiers than broad platform-game labeling.",
  },
  {
    id: "ps4-solitaire",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "Solitaire on PS4 is a straightforward card-game release from Bigben Interactive and Sanuk Games, aimed at familiar rule-based play rather than story or progression. Its value in the catalog is practical identification: which solitaire package it is, what platform and region it belongs to, and whether it was sold physically or digitally. Collectors should separate it from similarly named card-game bundles and other casino or tabletop compilations.",
  },
  {
    id: "ps4-songbird-symphony",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "Songbird Symphony is a bright rhythm-platformer from Joysteak Studios and PQube about guiding a small bird through musical exploration, timing challenges, and character-driven stages. The PS4 version is useful to catalog as an indie platform release with music-game structure rather than a standard mascot platformer, with region, format, language, and console-edition details carrying the collector context.",
  },
  {
    id: "ps4-sonic-x-shadows-generations",
    sourceUrl: "https://en.wikipedia.org/wiki/Shadow_Generations",
    overview:
      "Sonic X Shadow Generations packages the Sonic Generations remaster with a new Shadow-focused campaign, making the PS4 release both a series anniversary piece and a cross-generation Sega platformer. Its listing value comes from edition clarity: standard or special packaging, region, language, DLC or early-purchase extras, and whether the copy is the PS4 disc/download rather than the PS5 version.",
  },
  {
    id: "ps4-spacebase-startopia",
    sourceUrl: "https://en.wikipedia.org/wiki/Spacebase_Startopia",
    overview:
      "Spacebase Startopia is a space-station management sim from Realmforge Studios and Kalypso Media, built around balancing alien visitors, production, entertainment, and station growth across layered decks. On PS4 it belongs with console strategy and business-sim ports where controller usability, region, format, and expansion or upgrade details matter. Collectors should distinguish it from the older Startopia name it revives.",
  },
  {
    id: "ps4-spacejacked",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "Spacejacked combines side-view action with tower-defense planning as players move between rooms, place defenses, and fight waves on a hijacked spaceship. The PS4 release is a small Rotten Mage indie port where the hook is fast room-to-room pressure, not a broad strategy sandbox, so region, digital or physical availability, single-player focus, and action-defense structure are the key differentiators.",
  },
  {
    id: "ps4-spaceland",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "Spaceland is a compact turn-based tactics game from Tortuga Team, sending a squad through short sci-fi missions built around movement ranges, cover, weapons, and quick tactical decisions. The PS4 catalog context is console-friendly strategy rather than a large RPG campaign, with region, format, language, and standalone console-release identity separating it from PC or mobile-adjacent versions.",
  },
  {
    id: "ps4-sparkle-2",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "Sparkle 2 is 10tons' marble-shooter puzzle game on PS4, asking players to match colored orbs, manage chains, and clear stages through quick aiming and route control. The cross-buy note makes platform entitlement and store format especially important. Collectors should separate it from Sparkle Unleashed and other 10tons puzzle releases with similar cover art or naming.",
  },
  {
    id: "ps4-sparkle-unleashed",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "Sparkle Unleashed is another 10tons marble-shooter puzzle release, focused on clearing flowing orb chains through color matching, power-ups, and score-minded stage play. On PS4 its identity depends on the Unleashed subtitle, cross-buy status, and digital storefront context because Sparkle 2 and Unleashed are adjacent but distinct entries.",
  },
  {
    id: "ps4-speed-limit",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_4_games_%28M%E2%80%93Z%29",
    overview:
      "Speed Limit is a genre-shifting arcade action game from Gamechuck and Chorus Worldwide, jumping through chase, shooter, driving, and flight sequences with one-hit tension and old-school pacing. The PS4 release should be described as a reflex-heavy action homage rather than a normal racing title. Buyers should verify region, format, and whether they want the console version for its fast stage-switching challenge.",
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
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    return {
      platformSlug: "ps4",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes,
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
