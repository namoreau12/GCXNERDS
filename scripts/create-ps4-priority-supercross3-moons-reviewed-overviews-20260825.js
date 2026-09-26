const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-supercross3-moons-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-monster-energy-supercross-3",
    sourceUrl: "https://milestone.it/games/supercross-3/",
    overview:
      "Monster Energy Supercross 3 continues Milestone's official AMA Supercross series with stronger emphasis on licensed teams, rider identity, and shared custom content. The PS4 release adds official teams to career progression, dedicated online servers, a Race Director role, female rider options, improved ground and air physics, and a track editor for building and downloading custom championships. GCX should treat it as the sequel that broadened the series beyond solo stadium racing into creation, online play, and co-op training at the Supercross Test Area.",
  },
  {
    id: "ps4-monster-energy-supercross-4",
    sourceUrl: "https://www.playstation.com/en-us/games/monster-energy-supercross-the-official-videogame-4/",
    overview:
      "Monster Energy Supercross 4 is Milestone's fourth official Supercross entry, centered on a rebuilt career path and more demanding rider progression. Players climb from Supercross Futures toward professional competition while managing training, bike control, track rhythm, and technical skills across official championship content. For GCX, the key distinction is that Supercross 4 leans harder into a structured career climb and simulation learning curve than the earlier PS4 entries.",
  },
  {
    id: "ps4-monster-harvest",
    sourceUrl: "https://store.playstation.com/en-gb/product/EP1121-PPSA04769_00-0108135332891416",
    overview:
      "Monster Harvest mixes farming life-sim routines with monster collecting in the town of Planimal Point. Players grow crops, mutate them into companion creatures called Planimals, build and decorate a farm home, craft items, explore seasonal changes, and take their creatures into battle against threats tied to SlimeCo. GCX should frame it as a hybrid for Stardew Valley and monster-taming fans, with its appeal coming from the farming-to-battle loop rather than a traditional action RPG campaign.",
  },
  {
    id: "ps4-monster-jam-steel-titans",
    sourceUrl: "https://store.playstation.com/en-us/product/UP4389-CUSA13279_00-MONSTERJAM1US000",
    overview:
      "Monster Jam Steel Titans is Rainbow Studios' licensed monster-truck game built around the spectacle of Monster Jam events. It includes fan-favorite trucks such as Grave Digger and Max-D, stadium racing, outdoor racing, stunt challenges, destruction modes, jumps, crashes, and heavy vehicle handling. GCX should present it as a family-friendly motorsport release where the draw is authentic truck branding, big-air tricks, and event variety more than precise circuit-racing simulation.",
  },
  {
    id: "ps4-monster-jam-steel-titans-2",
    sourceUrl: "https://monsterjam2.thqnordic.com/",
    overview:
      "Monster Jam Steel Titans 2 expands the first Steel Titans with more trucks, new worlds, and broader online features. The sequel offers 38 Monster Jam trucks, training at Camp Crushmore, five outdoor worlds to explore, authentic stadium events, improved physics and career structure, and stunts such as bicycles, moonwalks, cyclones, pogos, power outs, and backflips. GCX should distinguish it from the original as the larger, more exploration-heavy Monster Jam package on PS4.",
  },
  {
    id: "ps4-monster-sanctuary",
    sourceUrl: "https://store.playstation.com/en-gb/concept/10000423",
    overview:
      "Monster Sanctuary is a side-view pixel-art RPG that combines Metroidvania exploration with monster collecting and turn-based team battles. Players choose a spectral familiar, hatch and train a roster of monsters, customize skill trees, and use monster abilities both in combat and to unlock new routes through the Sanctuary. GCX should call out the way it joins creature-team building with platform exploration, making it different from both straight monster battlers and standard action-platformers.",
  },
  {
    id: "ps4-monster-truck-championship",
    sourceUrl: "https://store.playstation.com/en-us/product/UP4008-CUSA18680_00-MONSTERTRUCKCHPS",
    overview:
      "Monster Truck Championship is a more simulation-minded monster-truck racer from Teyon and Nacon, focused on handling huge trucks through racing, freestyle, and event competition. The PS4 release emphasizes vehicle setup, physics, championship progression, and controlling weight transfer during jumps, turns, donuts, and destruction events. GCX should separate it from Monster Jam Steel Titans because it chases a motorsport-sim feel rather than relying on the official Monster Jam license.",
  },
  {
    id: "ps4-moons-of-madness",
    sourceUrl: "https://store.playstation.com/en-us/product/UP1850-CUSA15373_00-MOONSOFMADNESS01",
    overview:
      "Moons of Madness is a first-person, story-driven cosmic horror game set at the Trailblazer Alpha research base on Mars. Players explore the station as engineer Shane Newehart, solve environmental puzzles, maintain equipment, and face hallucinations, isolation, and supernatural imagery as the mission unravels. GCX should describe it as an atmospheric sci-fi horror adventure with little emphasis on combat, where the tension comes from Mars exploration colliding with Lovecraftian dread.",
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
