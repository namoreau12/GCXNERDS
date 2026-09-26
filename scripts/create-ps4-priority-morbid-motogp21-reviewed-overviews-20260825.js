const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-morbid-motogp21-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-morbid-the-seven-acolytes",
    sourceUrl: "https://store.playstation.com/en-gb/product/EP1121-CUSA20417_00-0000000MORBIDEU1",
    overview:
      "Morbid: The Seven Acolytes is an isometric horrorpunk action RPG about the last Striver of Dibrom hunting seven corrupted Acolytes possessed by Gahar deities. Its PS4 identity is built around Soulslike positioning, grim world design, boss-driven progression, Lovecraftian horror, heavy gore, and deliberate melee combat. GCX should present it as a dark indie action RPG for players who want compact punishment, grotesque atmosphere, and boss-focused exploration rather than a party-based fantasy adventure.",
  },
  {
    id: "ps4-more-dark",
    sourceUrl: "https://www.ratalaikagames.com/games/moredark.php",
    overview:
      "More Dark is a single-screen puzzle-platformer from HugePixel and Ratalaika about restoring order in Hell after escaped convicts throw the place into chaos. The PS4 release contains 60 levels, block and path-manipulation mechanics, hidden keys that unlock hats, gloomy pixel art, and retro-inspired music. GCX should frame it as a small, trophy-friendly indie puzzle release where the hook is quick level solving and light platform execution rather than a larger demonic action game.",
  },
  {
    id: "ps4-mosaic",
    sourceUrl: "https://rawfury.com/games/mosaic/",
    overview:
      "Mosaic is a short narrative adventure from Krillbite Studio and Raw Fury about an isolated office worker trapped in a cold, repetitive city routine. It plays as a surreal, atmospheric walk through urban alienation, corporate pressure, phone distraction, and moments of strange beauty that interrupt the main character's gray daily loop. GCX should describe it as a two-to-three-hour art-game experience whose value comes from mood and social commentary rather than puzzles, combat, or traditional adventure-game structure.",
  },
  {
    id: "ps4-motogp-14",
    sourceUrl: "https://store.playstation.com/en-gb/product/EP4356-CUSA00318_00-MOTOGP1400000000",
    overview:
      "MotoGP 14 is Milestone's first PS4-era MotoGP release, carrying official riders from the 2013 and 2014 seasons alongside legendary champions and all official tracks of the period. It includes the Argentina circuit, career mode, Real Events 2013, online Split Battle, local multiplayer, and a refreshed graphics and sound engine for the new console generation. GCX should position it as the baseline PS4 MotoGP entry, useful for collectors because it marks the series' jump into eighth-generation hardware.",
  },
  {
    id: "ps4-motogp-17",
    sourceUrl: "https://store.playstation.com/en-is/product/EP4356-CUSA07865_00-MOTOGP17FULLGAME",
    overview:
      "MotoGP 17 covers the official 2017 MotoGP championship with licensed bikes, riders, teams, and tracks, while aiming for smoother 60 fps performance on PS4. The notable addition is Managerial Career, which lets players think beyond riding by making team-manager decisions on and off the track. GCX should distinguish it from earlier MotoGP entries as a season update that emphasizes official content, online competition, co-op play, and a management-flavored career structure.",
  },
  {
    id: "ps4-motogp-19",
    sourceUrl: "https://store.playstation.com/en-us/concept/233375",
    overview:
      "MotoGP 19 is Milestone's official 2019 MotoGP game, adding MotoE to the package and expanding multiplayer tools with dedicated servers, custom events, and a Race Director role. It also introduces a machine-learning-based AI system and historical rivalry content that recreates famous riders, bikes, teams, and moments from MotoGP history. GCX should describe it as the PS4 entry where online structure, smarter AI, and historical challenges became the major selling points.",
  },
  {
    id: "ps4-motogp-20",
    sourceUrl: "https://store.playstation.com/en-gb/product/EP4356-CUSA17832_00-MOTOGP20FULLGAME",
    overview:
      "MotoGP 20 builds around the 2020 MotoGP season and brings Managerial Career back with deeper team-building and bike-development systems. Players can join an existing 2020 team or create a new one, then work with managers, engineers, and data analysts while learning improved physics, rider models, animations, fuel management, and tyre wear. GCX should frame it as the PS4 MotoGP entry for players who want the racing to connect more tightly to team operations and long-term progression.",
  },
  {
    id: "ps4-motogp-21",
    sourceUrl: "https://store.playstation.com/concept/10001934",
    overview:
      "MotoGP 21 updates Milestone's series for the 2021 season with more than 120 official riders, over 20 tracks, MotoGP, Moto2, and Moto3 classes, and cross-generation PS4/PS5 availability. It adds realism touches such as the Long Lap Penalty, historical riders and bikes, and handling systems that make braking, weight transfer, tyre condition, and race discipline more important. GCX should identify it as a late-PS4 MotoGP release focused on authenticity and stricter simulation detail.",
  },
];

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = [
    [
      "platformSlug",
      "gameId",
      "title",
      "currentOverview",
      "sourceUrl",
      "rewriteNotes",
      "newOverview",
      "reviewStatus",
      "reviewer",
    ],
  ];

  rewrites.forEach((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    rows.push([
      "ps4",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on official/store pages and reputable game references where official current English pages were unavailable.",
      rewrite.overview,
      "reviewed",
      "GCX editorial cleanup",
    ]);
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rows: rewrites.length }, null, 2));
}

main();
