const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-slugfest-monster-reviewed-overviews-2026-08-25.csv"
);

const rows = [
  {
    gameId: "ps2-mlb-slugfest-20-03",
    title: "MLB SlugFest 20-03",
    sourceUrl: "https://en.wikipedia.org/wiki/MLB_Slugfest_2003",
    newOverview:
      "MLB SlugFest 20-03 brings Midway's Blitz-style sports attitude to baseball, turning licensed MLB teams into an arcade brawl of beanballs, turbo throws, hard tags, on-fire streaks, and exaggerated home-run swings. It is less a simulation of pitch counts and roster realism than a fast couch-multiplayer baseball game built around momentum, spectacle, and aggressive plays. For PS2 collectors, it matters as the first SlugFest entry and one of the clearest examples of Midway translating its arcade-sports identity beyond football and basketball.",
  },
  {
    gameId: "ps2-mlb-slugfest-20-04",
    title: "MLB SlugFest 20-04",
    sourceUrl: "https://en.wikipedia.org/wiki/MLB_Slugfest_2004",
    newOverview:
      "MLB SlugFest 20-04 keeps the series' over-the-top baseball intact while refining the second-year formula around faster plays, turbo-fueled fielding, violent base tags, and high-scoring rallies. The appeal is still arcade immediacy: players can jump in quickly, throw heat, collide with runners, and chase highlight moments without the slower rhythm of a sim-heavy baseball title. On PS2, it works best as a party sports game for fans of Midway's aggressive presentation and early-2000s licensed rosters.",
  },
  {
    gameId: "ps2-mlb-slugfest-2006",
    title: "MLB SlugFest 2006",
    sourceUrl: "https://en.wikipedia.org/wiki/MLB_Slugfest_2006",
    newOverview:
      "MLB SlugFest 2006 is the final main SlugFest release, carrying the series' arcade baseball formula into one more PS2 season with beanballs, charging-the-mound energy, tape-measure hits, and the familiar on-fire momentum system. By this point the novelty is less about realism and more about how far Midway could push baseball toward combat-sports spectacle. Collectors should treat it as the late-series entry: rougher in reputation than the earliest games, but important because it closes the PS2-era SlugFest run.",
  },
  {
    gameId: "ps2-mlb-slugfest-loaded",
    title: "MLB SlugFest: Loaded",
    sourceUrl: "https://en.wikipedia.org/wiki/MLB_Slugfest%3A_Loaded",
    newOverview:
      "MLB SlugFest: Loaded is the third SlugFest game and one of the series' most direct PS2/Xbox-era arcade baseball releases. It keeps the hard tags, turbo pitching, exaggerated animations, and on-fire streaks while presenting a full-season sports package around Sammy Sosa-era MLB branding. The game is useful for GCX readers because it sits between the breakout 20-03/20-04 entries and the final 2006 release, showing Midway's attempt to make chaotic baseball feel like a repeatable annual sports series.",
  },
  {
    gameId: "ps2-moe-moe-2-ji-daisenryaku-2",
    title: "Moe Moe 2-Ji Daisenryaku 2",
    sourceUrl: "https://en.wikipedia.org/wiki/Daisenryaku",
    newOverview:
      "Moe Moe 2-Ji Daisenryaku 2 is a Japanese strategy spin-off of SystemSoft's long-running Daisenryaku war-game line, replacing conventional unit presentation with mecha-musume versions of World War II hardware and characters. Its appeal is a mix of turn-based campaign movement, scenario structure, and character-driven adventure scenes rather than a straight historical simulation. For PS2 import collectors, it should be framed as a niche strategy-and-visual-novel hybrid tied to a larger Japanese military strategy lineage.",
  },
  {
    gameId: "ps2-moe-moe-2-ji-daisenryaku-deluxe",
    title: "Moe Moe 2-Ji Daisenryaku Deluxe",
    sourceUrl: "https://en.wikipedia.org/wiki/Daisenryaku",
    newOverview:
      "Moe Moe 2-Ji Daisenryaku Deluxe is an expanded PS2 version of the Daisenryaku mecha-musume spin-off, pairing grid-based military strategy with character routes, illustrated story scenes, and alternate World War II-inspired campaigns. The Deluxe release is notable for adding extra campaign material and roster adjustments rather than simply reissuing the original concept. GCX should present it as a Japanese import strategy curiosity: mechanically rooted in Daisenryaku, but packaged around character collecting and anime-style presentation.",
  },
  {
    gameId: "ps2-momotarou-dentetsu-11",
    title: "Momotarou Dentetsu 11",
    sourceUrl: "https://www.honestgamers.com/45411/playstation-2/momotarou-dentetsu-11/game.html",
    newOverview:
      "Momotarou Dentetsu 11 is a PS2 entry in Hudson's digital board-game series, built around traveling Japan by rail and other routes, buying properties, building wealth, and trying to avoid the series' disruptive poverty-god events. Like the broader Momotetsu line, the fun comes from multiplayer board positioning, dice-driven route planning, and the way fortunes swing through random events and property ownership. For GCX, it belongs in the import party-board-game lane rather than beside conventional train simulators.",
  },
  {
    gameId: "ps2-momotarou-dentetsu-12",
    title: "Momotarou Dentetsu 12",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-74102.html",
    newOverview:
      "Momotarou Dentetsu 12 continues Hudson's long-running railway board-game formula on PS2, with players moving across regional maps, purchasing local businesses, collecting income, and using cards or events to disrupt rivals. The West Japan focus gives this entry a regional flavor within the larger Momotetsu structure, so the appeal is route knowledge, money swings, and local-property flavor more than action or simulation depth. It is a strong fit for collectors tracking Japan-only multiplayer staples.",
  },
  {
    gameId: "ps2-momotarou-dentetsu-15",
    title: "Momotarou Dentetsu 15",
    sourceUrl: "https://en.wikipedia.org/wiki/Momotaro_Dentetsu#Console_games",
    newOverview:
      "Momotarou Dentetsu 15 is another late-PS2 entry in Hudson's train-travel board-game series, where players compete to become the wealthiest company president by moving around the map, buying properties, and surviving chaotic event swings. Its value is not in radically changing the formula, but in delivering a polished annual-style Momotetsu package for local multiplayer and long-session rivalry. GCX should describe it as part of Japan's durable party-board-game tradition, closer to Monopoly-meets-travel-game competition than a railroad sim.",
  },
  {
    gameId: "ps2-momotarou-dentetsu-16",
    title: "Momotarou Dentetsu 16",
    sourceUrl: "https://en.wikipedia.org/wiki/Momotaro_Dentetsu#Console_games",
    newOverview:
      "Momotarou Dentetsu 16 brings Hudson's board-game economy series to the end of its PS2 run, keeping the familiar loop of dice movement, property buying, card use, and fortunes that can flip through rival attacks or poverty-god trouble. For players, the hook is competitive table-game chaos with Japanese geography and local-business flavor woven into every route. For collectors, it is best understood as a late-generation Momotetsu entry for people following Hudson's long-running domestic multiplayer series.",
  },
  {
    gameId: "ps2-momotarou-dentetsu-usa",
    title: "Momotarou Dentetsu USA",
    sourceUrl: "https://www.mobygames.com/game/62660/momotaro-dentetsu-usa/",
    newOverview:
      "Momotarou Dentetsu USA is a notable PS2 import because it moves Hudson's usually Japan-centered board-game economy formula across North America. Players still roll, travel, buy properties, and try to out-earn rivals, but the city list and route flavor shift toward U.S. and nearby locations, making it one of the series' easiest themes for Western collectors to understand at a glance. It remains a Japanese-language party board game, but its map concept gives it a distinct identity within the PS2 Momotetsu lineup.",
  },
  {
    gameId: "ps2-momotarou-dentetsu-x-kyushu-hen-mo-arubai",
    title: "Momotarou Dentetsu X: Kyushu-hen mo Arubai",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-62117.html",
    newOverview:
      "Momotarou Dentetsu X: Kyushu-hen mo Arubai is a region-focused PS2 Momotetsu entry centered on Hudson's competitive railway-board-game loop. Players move around the map, chase destinations, buy local properties, and use cards or events to alter the race for wealth, with the Kyushu theme giving the board a more specific local identity. GCX should present it as a Japan-only party-board-game release whose appeal is rivalry, route planning, and regional property flavor rather than traditional train operation.",
  },
  {
    gameId: "ps2-monkey-turn-v",
    title: "Monkey Turn V",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-20381.html",
    newOverview:
      "Monkey Turn V is a boat-racing game based on the Monkey Turn anime and manga, mixing race technique with character-driven story material from the license. The gameplay centers on competitive motorboat racing and specialized moves such as turns, overtakes, and positioning rather than standard car-racing physics. For GCX readers, the key is that this is a licensed Japanese sports/anime title with a very specific racing subject, making it more interesting than a generic import racer entry would suggest.",
  },
  {
    gameId: "ps2-monochrome",
    title: "Monochrome",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65682.html",
    newOverview:
      "Monochrome is a KID-developed visual novel about a memory-lost protagonist, Taiki Kirioka, whose school life changes after meeting Yun, an angel in training. Play is built around reading scenes, making route choices, and seeing the story shift through heroine-focused perspectives rather than combat or puzzle systems. For collectors, it fits the PS2's large Japan-only romance/adventure library and should be described through its supernatural school-life setup and branching narrative structure.",
  },
  {
    gameId: "ps2-monopoly",
    title: "Monopoly",
    sourceUrl: "https://en.wikipedia.org/wiki/Monopoly_video_games#List",
    newOverview:
      "Monopoly on PS2 adapts Hasbro's property-trading board game into a television-friendly digital version, preserving the familiar loop of rolling dice, buying color groups, building houses and hotels, charging rent, and trying to bankrupt opponents. Its usefulness is convenience: automated banking, animated presentation, and local multiplayer reduce the friction of a long tabletop session. GCX should position it as a straightforward digital board-game adaptation, valuable mainly for family play, Hasbro collectors, and PS2 party-game shelves.",
  },
];

function csvEscape(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

function main() {
  const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps2.json"), "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
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

  const outputRows = rows.map((row) => {
    const game = byId.get(row.gameId);
    if (!game) throw new Error(`Missing game ${row.gameId}`);
    return {
      platformSlug: "ps2",
      gameId: row.gameId,
      title: row.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: row.sourceUrl,
      rewriteNotes:
        "Priority PS2 weak-template cleanup; original GCX editorial overview based on verified platform metadata, specialist database pages, publisher/developer context, and series/gameplay references.",
      newOverview: row.newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX Editorial",
    };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${outputRows
      .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
      .join("\n")}\n`,
    "utf8"
  );

  console.log(JSON.stringify({ outputPath, rows: outputRows.length }, null, 2));
}

main();
