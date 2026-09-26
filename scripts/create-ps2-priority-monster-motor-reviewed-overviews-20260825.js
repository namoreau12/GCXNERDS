const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-monster-motor-reviewed-overviews-2026-08-25.csv"
);

const rows = [
  {
    gameId: "ps2-monopoly-party",
    sourceUrl: "https://ps2.gamespy.com/playstation-2/monopoly-party/",
    newOverview:
      "Monopoly Party! turns Hasbro's property-trading board game into a faster digital party format, with Runecraft adapting buying, auctioning, rent collection, house building, and deal-making for local play on PS2. Its main hook is convenience and tempo: automated banking and simultaneous-style pacing help reduce the downtime of a long tabletop session. GCX should frame it as a couch multiplayer board-game adaptation for families and collectors, not as a minigame collection.",
  },
  {
    gameId: "ps2-monster-4x4-masters-of-metal",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Monster_Jam_video_games#Monster_4x4:_Masters_of_Metal",
    newOverview:
      "Monster 4x4: Masters of Metal is a licensed monster-truck racer from Ubisoft that uses real Monster Jam-style trucks and oversized stadium/off-road events instead of strict simulation. Players chase points across races and freestyle-style competitions, with the appeal coming from heavy vehicles, big jumps, mud, crashes, and exaggerated track locations. For PS2 collectors, it is important as the bridge between licensed Monster Jam games and Ubisoft's later standalone Monster 4x4 line.",
  },
  {
    gameId: "ps2-monster-attack",
    sourceUrl: "https://en.wikipedia.org/wiki/Earth_Defense_Force",
    newOverview:
      "Monster Attack is the European release of Sandlot's first Earth Defense Force game, a budget-scale third-person shooter about defending Tokyo from giant insects and alien invaders. Its rhythm is simple but distinctive: choose a soldier loadout, enter mission-based urban battlefields, destroy swarms of huge enemies, and collect better weapons for harder sorties. GCX should treat it as the origin point of the EDF formula, where rough presentation matters less than scale, chaos, and replayable weapon progression.",
  },
  {
    gameId: "ps2-monster-eggs",
    sourceUrl: "https://www.vgchartz.com/game/40734/monster-eggs/summary",
    newOverview:
      "Monster Eggs is a PAL PS2 puzzle game from Phoenix Games built around matching one-eyed monster eggs by color under simple arcade rules. It offers short, relax, and classic-style modes, so the appeal is quick pattern recognition, combo building, and rising egg variety rather than action-platforming or combat. For GCX, it belongs in the European budget puzzle lane and should be described as a lightweight color-matching release for obscurity and Phoenix Games collectors.",
  },
  {
    gameId: "ps2-monster-jam",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Monster_Jam_video_games#Monster_Jam",
    newOverview:
      "Monster Jam on PS2 is Activision and Torus Games' licensed monster-truck release built around official USHRA trucks such as Grave Digger, Maximum Destruction, Blue Thunder, and El Toro Loco. It mixes stadium racing, cross-country off-road events, and freestyle competition, giving fans a broader event package than a pure circuit racer. The draw is seeing recognizable real-world trucks in destructive arcade events, making it a licensed motorsport collectible as much as a racing game.",
  },
  {
    gameId: "ps2-monster-rancher-3",
    sourceUrl: "https://en.wikipedia.org/wiki/Monster_Rancher_3",
    newOverview:
      "Monster Rancher 3 brings Tecmo's monster-raising series to PS2 with cel-shaded presentation, ranch management, training schedules, tournaments, and the franchise's signature disc-based monster generation. Players raise creatures over time rather than simply collecting them, balancing stats, loyalty, battles, and regeneration through an encyclopedia system. It is a key PS2-era entry for collectors because it updates the PlayStation formula visually while keeping the unusual CD/DVD monster-creation hook.",
  },
  {
    gameId: "ps2-monster-rancher-4",
    sourceUrl: "https://en.wikipedia.org/wiki/Monster_Rancher_4",
    newOverview:
      "Monster Rancher 4 expands Tecmo's raising-and-battling formula with a stronger story focus, a customizable ranch, adventures, tag-team battles, and the ability to manage multiple monsters. Players still generate creatures through disc data and train them for competition, but this entry gives the breeder, ranch, and supporting cast more structure than earlier games. GCX should describe it as the deeper PS2 Monster Rancher release, especially relevant for fans who want management, exploration, and long-form monster growth.",
  },
  {
    gameId: "ps2-monster-trux-extreme-arena-edition",
    sourceUrl: "https://en.wikipedia.org/wiki/Monster_Trux%3A_Arenas",
    newOverview:
      "Monster Trux Extreme: Arena Edition is Data Design Interactive's European budget monster-truck racer focused on arena competition rather than licensed Monster Jam branding. The game puts oversized trucks into short, rough-edged racing events with multiplayer support and a simple arcade handling model. For GCX, the honest framing is important: it is mainly a budget PAL curiosity and Data Design collectible, not a polished competitor to the better-known monster-truck games.",
  },
  {
    gameId: "ps2-monster-trux-extreme-offroad-edition",
    sourceUrl: "https://archive.org/details/MonsterTrux_Windows",
    newOverview:
      "Monster Trux Extreme: Offroad Edition takes Data Design Interactive's monster-truck racing away from arenas and toward outdoor off-road courses. The appeal is straightforward budget racing: large trucks, uneven terrain, simple event structure, and broad European PS2 availability rather than deep tuning or licensed vehicles. GCX should present it as the companion release to Arena Edition, useful for PAL collectors tracking Data Design and Metro3D-style budget software.",
  },
  {
    gameId: "ps2-moorhuhn-fun-kart-2008",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLES-55122.html",
    newOverview:
      "Moorhuhn Fun Kart 2008, also known as Crazy Chicken Fun Kart 2008, is a family-focused kart racer starring Moorhuhn and a small cast of comic animal characters. It offers seven selectable drivers, themed tracks, power-ups, time challenges, championships, and two-player racing, making it closer to a budget mascot kart game than a serious racing sim. GCX should call out its European PS2 context and Crazy Chicken connection because that is where most collector interest sits.",
  },
  {
    gameId: "ps2-morita-shogi",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_shogi_video_games",
    newOverview:
      "Morita Shogi is a Japan-only PS2 digital shogi release tied to Kazuro Morita's long-running computer-shogi lineage. The value is in board-game play and AI challenge: players study positions, test shogi tactics, and play a traditional rules-focused thinking game rather than a story or arcade experience. For GCX, it belongs with Japanese table-game software and is best described through its shogi heritage, Yuki publishing credit, and collector appeal to strategy-board specialists.",
  },
  {
    gameId: "ps2-moto-x-maniac",
    sourceUrl: "https://www.honestgamers.com/45432/playstation-2/moto-x-maniac/game.html",
    newOverview:
      "Moto X Maniac is a European budget motocross racer from Phoenix Games, built around dirt-bike riding, track navigation, and simple race progression rather than licensed championship depth. Its appeal is narrow but clear: quick off-road motorcycle events on PS2 for players collecting low-cost PAL racing software. GCX should avoid overselling it and frame it as a Phoenix Games motocross title, useful mainly for completionists and budget-racing collectors.",
  },
  {
    gameId: "ps2-motogp-3",
    sourceUrl: "https://en.wikipedia.org/wiki/MotoGP_3",
    newOverview:
      "MotoGP 3 is Namco's 2003 PS2 motorcycle racer based around the 2002 Grand Prix season, with real circuits, season play, time trials, challenges, and both two-stroke and faster four-stroke bike classes. Handling is the center of the game: braking points, lean angle, wet weather, transmission choice, and bike setup matter far more than contact-heavy arcade racing. For collectors, it is one of the more serious early PS2 MotoGP entries and a strong fit for racing fans who want licensed track-riding discipline.",
  },
  {
    gameId: "ps2-motogp-07",
    sourceUrl: "https://en.wikipedia.org/wiki/MotoGP_%2707_(PS2)",
    newOverview:
      "MotoGP 07 is Milestone and Capcom's PS2 entry for the 2007 MotoGP season, featuring official riders, teams, bikes, and tracks alongside quick race, championship, time attack, challenge, and multiplayer modes. The game offers multiple riding styles and weather conditions, so players can tune the experience from more accessible racing toward stricter bike control. GCX should distinguish it from the unrelated Xbox 360/PC game with the same title and treat it as the late PS2-format MotoGP release.",
  },
  {
    gameId: "ps2-motor-mayhem-vehicular-combat-league",
    sourceUrl: "https://en.wikipedia.org/wiki/Motor_Mayhem",
    newOverview:
      "Motor Mayhem: Vehicular Combat League is an arena-based vehicle-combat game from Beyond Games and Infogrames, built around a violent futuristic motorsport league. Players control character-themed combat cars, collect weapons and upgrades in enclosed arenas, and score by destroying rival vehicles before time or target-score limits expire. Its closest comparison point is the Twisted Metal lane, so GCX should frame it as an early PS2 car-combat title with personality-driven vehicles and multiplayer appeal.",
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
      title: game.title,
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
