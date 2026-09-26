const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-motogp22-murder-detective-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-motogp-22",
    sourceUrl: "https://milestone.it/games/motogp-22/",
    overview:
      "MotoGP 22 is Milestone's official 2022 MotoGP game, carrying more than 120 riders, over 20 circuits, and a large roster of historic riders onto PS4. Its signature feature is NINE Season 2009, a documentary-style mode that revisits the 2009 championship through narrated footage and playable challenges. GCX should describe it as the MotoGP entry where historical presentation, split-screen play, cross-generation support, tutorials, and managerial career systems make the annual update feel more like a series retrospective.",
  },
  {
    id: "ps4-motor-strike-immortal-legends",
    sourceUrl: "https://store.playstation.com/en-in/concept/225263",
    overview:
      "Motor Strike: Immortal Legends is a PS4 action-racing game from FiveXGames that mixes combat driving with arcade team battles. Players choose from more than a dozen vehicles, race across more than 20 tracks in six environments, use weapons such as missiles and plasma cannons, and customize playstyle through dexterity trees. GCX should frame it as a niche vehicular-combat racer with split-screen and online multiplayer appeal rather than a conventional lap-time racing game.",
  },
  {
    id: "ps4-mowin-and-throwin",
    sourceUrl: "https://store.playstation.com/en-us/concept/233437",
    overview:
      "Mowin & Throwin is a local party game about lawn gnomes trying to keep their own yard tidy while ruining everyone else's. Matches revolve around mowing grass, throwing rocks, fertilizer bags, and mushrooms, and using a nitro mower with a hidden cannon to sabotage rivals. GCX should position it as a couch-multiplayer turf-war game where the humor and 1v1 or 2v2 chaos matter much more than campaign depth or collectible progression.",
  },
  {
    id: "ps4-mozart-requiem",
    sourceUrl: "https://store.playstation.com/concept/10000493",
    overview:
      "Mozart Requiem is a historical adventure game that casts Wolfgang Amadeus Mozart as an unlikely investigator in 1788 Prague. The PS4 release sends players through murder, conspiracy, occult ceremonies, and secret societies while leaning on period atmosphere and Mozart's music rather than action combat. GCX should identify it as a reissued point-and-click style mystery for collectors who are tracking unusual physical PS4 adventure releases and older PC adventures brought to console.",
  },
  {
    id: "ps4-mugsters",
    sourceUrl: "https://www.team17.com/news/introducing-mugsters-developer-qa",
    overview:
      "Mugsters is a physics-based action-puzzle game from Reinkout Games and Team17 about freeing enslaved humans after an alien invasion. Each sandbox island asks players to experiment with vehicles, explosives, traps, crystals, rescue objectives, enemy machines, and escape routes, with co-op adding more improvisation. GCX should describe it as a compact, systems-driven puzzle playground where solving the problem creatively matters more than following one scripted route.",
  },
  {
    id: "ps4-mulaka",
    sourceUrl: "https://www.lienzo.mx/mulaka/",
    overview:
      "Mulaka is a 3D action-adventure from Mexican studio Lienzo inspired by the Indigenous Tarahumara culture of northern Mexico. Players guide a Sukuruame shaman across low-poly landscapes, fight corruption spreading through the land, transform through demigod powers, and use fast movement rooted in Tarahumara running traditions. GCX should present it as a culturally specific indie adventure whose value comes from setting, mythology, exploration, and representation rather than open-world scale.",
  },
  {
    id: "ps4-munchkin-quacked-quest",
    sourceUrl: "https://www.youtube.com/watch?v=B2uvun8GN18",
    overview:
      "Munchkin: Quacked Quest turns Steve Jackson Games' parody card-game universe into a top-down dungeon-crawling party brawler. Players choose goofy fantasy races and classes, chase treasure, betray friends, fight monsters, and lean into the rule-bending humor that defines Munchkin. GCX should frame it as a multiplayer-focused adaptation for fans of the tabletop brand, not a faithful digital card game or deep single-player RPG.",
  },
  {
    id: "ps4-murder-detective-jack-the-ripper",
    sourceUrl: "https://www.siliconera.com/murder-detective-jack-the-ripper-by-nis-heads-to-ps4-and-switch-in-japan-on-april-25/",
    overview:
      "Murder Detective: Jack the Ripper is a Nippon Ichi Software visual novel set in a fictional version of London where private detective Arthur Hewitt investigates serial murders after encountering a phantom called Jack the Ripper. Its central hook is a branching moral split between detective and murderer routes, with player choices pushing the story toward different sides of Arthur's identity. GCX should mark it as a Japanese PS4 import adventure for visual-novel collectors rather than a strategy or action game.",
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
