const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-mistover-supercross2-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-mistover",
    sourceUrl: "https://blog.playstation.com/2019/08/21/mistover-brings-dangerous-dungeon-expeditions-to-ps4-in-october/",
    overview:
      "Mistover is a tough turn-based dungeon-crawling RPG from Krafton about sending a fragile expedition team into the Pillar of Despair. Its loop is built around party formation, limited resources, tile-based exploration, permadeath pressure, loot, and a Doomsday Clock that punishes careless expeditions. GCX should describe it as a dark, anime-styled roguelike RPG with collector interest increased by its later delisting and its physical Asian-region PS4 release.",
  },
  {
    id: "ps4-mistover-dr-faust-s-otherworldly-adventure",
    sourceUrl: "https://www.mobygames.com/game/143452/mistover-dr-fausts-otherworldly-adventure/",
    overview:
      "Mistover: Dr. Faust's Otherworldly Adventure is a paid Guilty Gear crossover DLC for Mistover rather than a separate full RPG. It adds the Wandering Dr. Faust's Forest dungeon, strange objects, new monsters, Faust as a boss encounter, and consumable items that avoid Mist contamination. GCX should keep it distinct from the base game so collectors understand they are looking at add-on content tied to Mistover's delisted-era digital footprint.",
  },
  {
    id: "ps4-modern-tales-age-of-invention",
    sourceUrl: "https://www.orchidgames.com/modern_tales_age_of_invention/",
    overview:
      "Modern Tales: Age of Invention is a hidden-object adventure set around the 1900 Paris exposition, where inventor Emily Patterson investigates kidnapped scientists and a larger plot involving modern technology. The PS4 version is about scene investigation, puzzle solving, collected clues, and light narrative mystery rather than action or RPG progression. GCX should position it as an Artifex Mundi-style adventure for players who enjoy period settings, mechanical contraptions, and relaxed mystery pacing.",
  },
  {
    id: "ps4-monopoly",
    sourceUrl: "https://www.playstation.com/en-sa/games/monopoly-plus/",
    overview:
      "Monopoly on PS4 refers to Ubisoft's digital take on Hasbro's board game, commonly presented through Monopoly Plus and family-pack releases. It keeps the property buying, rent collecting, trading, bankruptcy, and house-rule customization of tabletop Monopoly while adding an animated 3D board city and console multiplayer options. GCX should treat it as a party-board-game adaptation whose value depends on edition, bundle contents, local-player needs, and whether online features still matter to the buyer.",
  },
  {
    id: "ps4-monopoly-deal",
    sourceUrl: "https://news.ubisoft.com/en-us/article/54KtPAmDfnmpL3lnZGGFCZ/monopoly-family-fun-pack-available-now",
    overview:
      "Monopoly Deal is Ubisoft's digital adaptation of the fast card-game version of Monopoly, built around completing three property sets instead of circling a board. Players steal properties, charge rent, collect debts, and use action cards such as Forced Deal and Deal Breaker to disrupt opponents. On PS4 it works best as a quicker competitive companion to Monopoly Plus, especially for collectors sorting standalone digital releases from the broader Monopoly Family Fun Pack.",
  },
  {
    id: "ps4-monopoly-madness",
    sourceUrl: "https://www.playstation.com/cs-cz/games/monopoly-madness/",
    overview:
      "Monopoly Madness throws away the traditional board and turns Monopoly City into a real-time party arena. Players race around streets collecting money, water, and electricity, buying and upgrading properties, using Community Chest power-ups, and competing with up to six players locally or online. GCX should frame it as a spin-off party game, not a standard board-game conversion, because its appeal is resource scrambling and arena chaos rather than slow property negotiation.",
  },
  {
    id: "ps4-monster-energy-supercross",
    sourceUrl: "https://milestone.it/games/supercross/",
    overview:
      "Monster Energy Supercross: The Official Videogame is Milestone's first licensed PS4 Supercross release, built around the 2017 Monster Energy AMA Supercross season. It features official riders from 250SX and 450SX, stadium tracks, career racing, bike handling, rewinds, and a track editor for building and sharing custom circuits. GCX should separate it from later yearly entries because this first release established the series formula before the sequels expanded rider lifestyle systems and customization.",
  },
  {
    id: "ps4-monster-energy-supercross-2",
    sourceUrl: "https://www.playstation.com/en-is/games/monster-energy-supercross-the-official-videogame-2/",
    overview:
      "Monster Energy Supercross 2 updates Milestone's official AMA Supercross series with the 2018 championship context, more than 80 riders, and a career mode structured around a professional rider's weekly agenda. The sequel adds the Compound as a free-riding and training space, expands customization, and pushes players to master leaning, starts, braking, cornering, and scrubs across 250SX and 450SX competition. GCX should present it as the point where the series started building beyond race weekends into rider-management and practice systems.",
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
