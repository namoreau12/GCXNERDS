const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-melbits-metalmax-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-melbits-world",
    sourceUrl: "https://www.playstation.com/en-us/games/melbits-world/",
    overview:
      "Melbits World is a PlayLink cooperative puzzle-platformer from Melbot Studios where players use companion phones or tablets to manipulate the stage and guide small digital creatures to safety. It is built for group coordination rather than solo precision: platforms, springs, paths, and hazards need to be adjusted in real time while the Melbits keep moving. GCX should frame it as a family-friendly PS4 couch-play oddity, notable because its design depends on the PlayLink second-screen setup.",
  },
  {
    id: "ps4-melty-blood-type-lumina",
    sourceUrl: "https://meltyblood.typelumina.com/en/",
    overview:
      "Melty Blood: Type Lumina is a modern reboot of Type-Moon and French-Bread's 2D fighting series, tying its roster and story context to Tsukihime -A piece of blue glass moon-. It keeps the fast anime-fighter identity of Melty Blood while rebuilding systems for a newer audience, including easier combo routes, sharp movement, Moon mechanics, and online play without cross-platform battles. It is a key PS4 fighting-game release for players who care about air mobility, character-specific pressure, and Type-Moon lore.",
  },
  {
    id: "ps4-memories-off-historia-vol-1",
    sourceUrl: "https://www.gematsu.com/2021/01/memories-off-historia-vol-1-and-vol-2-debut-trailer",
    overview:
      "Memories Off Historia Vol. 1 is the first PS4 anthology collection for MAGES' long-running romance visual novel series. It gathers the earlier Memories Off stories into a modern console package, making it less a new sequel and more a preservation release for players who want the series' character drama, branching relationships, and school-life melancholy in one place. For collectors, its value is tied to the PS4/Switch compilation format and the way it packages older Japanese visual novels for contemporary hardware.",
  },
  {
    id: "ps4-memories-off-historia-vol-2",
    sourceUrl: "https://www.gematsu.com/2021/01/memories-off-historia-vol-1-and-vol-2-debut-trailer",
    overview:
      "Memories Off Historia Vol. 2 continues the PS4 anthology approach by collecting the later mainline Memories Off entries rather than presenting a single standalone adventure. The appeal is continuity: players can follow how the series' romance, regret, friendship, and route-driven storytelling evolved across later installments. GCX should describe it as a companion volume to Historia Vol. 1, useful for visual-novel fans and import collectors who want the broader Memories Off library on one platform.",
  },
  {
    id: "ps4-memories-off-innocent-fille",
    sourceUrl: "https://en.wikipedia.org/wiki/Memories_Off",
    overview:
      "Memories Off: Innocent Fille is a later mainline entry in the Memories Off visual novel series, centered on romance, reunion, and emotionally complicated routes rather than mechanical challenge. The PS4 release follows the series' tradition of character-focused drama, dialogue choices, and multiple relationship outcomes, with the player reading through scenes and decisions to uncover different endings. It matters for GCX because it represents the series' modern era after years of ports and anthology releases.",
  },
  {
    id: "ps4-mercenaries-blaze-dawn-of-the-twin-dragons",
    sourceUrl: "https://store.playstation.com/en-us/product/UP5820-CUSA27609_00-MBLAZE5US0UP5820",
    overview:
      "Mercenaries Blaze: Dawn of the Twin Dragons is a tactical RPG from Rideon built around isometric, turn-based battles, class growth, equipment choices, and direction-based positioning. The PS4 version brings the fifth Mercenaries title to Sony's library with fully 3D battle maps, optional missions, and two story paths. It is best positioned as a budget-friendly strategy RPG for players who enjoy party-building and grid tactics more than cinematic production values.",
  },
  {
    id: "ps4-metal-max-xeno",
    sourceUrl: "https://en.wikipedia.org/wiki/Metal_Max_Xeno",
    overview:
      "Metal Max Xeno is a post-apocalyptic JRPG set in the ruined Tokyo Bay wasteland, where survivors fight mechanical monsters with tanks, scavenged weapons, and a small party based out of Iron Base. It continues the Metal Max tradition of vehicle-focused progression: hunting enemies, upgrading armored rides, and pushing deeper into a hostile world matter as much as character leveling. The original PS4 release is the baseline version before the later Reborn remake changed the combat and structure.",
  },
  {
    id: "ps4-metal-max-xeno-reborn",
    sourceUrl: "https://pqube.co.uk/games/metal-max-xeno-reborn/",
    overview:
      "Metal Max Xeno Reborn reworks the 2018 post-apocalyptic JRPG into a more open, tank-driven adventure with real-time battle and vehicle combat elements. Players guide Talis through a devastated world, search for survivors, salvage and customize tanks, fight machines on foot or from vehicles, and build a party that includes the returning battle dog Pochi. For GCX, it should be separated clearly from the original Metal Max Xeno because Reborn is a remake with altered systems, release timing, and PQube's worldwide PS4 publishing context.",
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
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on official/store pages, platform metadata, and reputable release reporting where official English pages were unavailable.",
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
