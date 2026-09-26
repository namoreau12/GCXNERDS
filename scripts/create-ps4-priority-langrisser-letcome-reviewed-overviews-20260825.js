const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-langrisser-letcome-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-langrisser-i-and-ii-hd-remastered",
    sourceUrl: "https://nisamerica.com/games/langrisser",
    overview:
      "Langrisser I & II HD Remastered brings the first two tactical RPGs in the Langrisser series to PS4 with updated presentation, a new localization, and optional classic elements for longtime fans. Players command fantasy armies on grid-based battlefields, make story choices, and build commanders through class paths while the series' holy swords and political conflicts drive the campaigns. It is for strategy RPG fans who like large unit formations, branching routes, and a 1990s tactical lineage restored for modern play.",
  },
  {
    id: "ps4-lapis-x-labyrinth",
    sourceUrl: "https://nisamerica.com/games/lapislabyrinth",
    overview:
      "Lapis x Labyrinth is a side-scrolling action RPG about diving into monster-filled dungeons in search of treasure. Players stack party members into a tower, swap class abilities, smash through enemies, collect loot, and trigger flashy Fever Mode bursts that turn the screen into a cascade of coins and effects. It is less a slow dungeon crawler than an arcade-like loot rush, built for players who enjoy speed, spectacle, and party customization.",
  },
  {
    id: "ps4-lara-croft-and-the-temple-of-osiris",
    sourceUrl: "https://www.square-enix-games.com/en_US/games/lara-croft-temple-osiris",
    overview:
      "Lara Croft and the Temple of Osiris is an isometric Tomb Raider spin-off built around puzzle rooms, twin-stick combat, traps, and cooperative exploration. Lara teams with rival archaeologist Carter Bell and Egyptian gods Horus and Isis to battle Set and escape a cursed temple. It works best with multiple players, where solving environmental puzzles, splitting roles, and fighting waves of enemies turn the Tomb Raider formula into a compact arcade-adventure.",
  },
  {
    id: "ps4-laser-league",
    sourceUrl: "https://505games.com/games/laser-league/",
    overview:
      "Laser League is Roll7's futuristic arena sport where teams activate colored laser nodes, dodge the opposing grid, and try to outlast rivals in fast rounds. Each class changes the tactical rhythm, from smashing opponents to stealing control or stunning a lane, while power-ups and map layouts constantly shift the danger. It is a multiplayer-first game: easy to understand at a glance, but built around positioning, timing, and coordinated team pressure.",
  },
  {
    id: "ps4-laws-of-machine",
    sourceUrl: "https://store.playstation.com/uk-ua/product/EP1555-CUSA09527_00-13081985BEBUA012",
    overview:
      "Laws of Machine is a small indie puzzle-platformer from Badri Bebua set around a Robotech corporation and an artificial-intelligence experiment. Players move through compact stages, avoid hazards, and work through platforming puzzles tied to machinery and lab-like environments. It is a modest release, best understood as a budget puzzle-action game for players who enjoy simple obstacle rooms and mechanical trial-and-error challenges.",
  },
  {
    id: "ps4-leap-of-fate",
    sourceUrl: "https://clever-plays.com/leap-of-fate/",
    overview:
      "Leap of Fate is a fast isometric cyberpunk roguelite from Clever Plays, set in a New York City where magic and technology overlap. Players control technomages, dash with Shadow Walk, clear enemy arenas, and upgrade through randomized skill trees while confronting the Crucible of Fates. It is built for short, intense runs where positioning, cooldowns, character builds, and magical firepower matter more than traditional RPG exploration.",
  },
  {
    id: "ps4-leo-s-fortune-hd-edition",
    sourceUrl: "https://store.playstation.com/en-ca/product/UP1149-CUSA02595_00-LEOSFORTUNE00000",
    overview:
      "Leo's Fortune: HD Edition is a polished physics platform adventure about Leopold, a fluffy mustached hero following a trail of stolen gold. Players roll, float, squeeze, and bounce through handcrafted stages full of hazards, switches, and timing puzzles while the breadcrumb trail leads toward the thief. Its charm comes from its tactile movement, storybook presentation, and puzzle-platforming that feels carefully tuned rather than sprawling.",
  },
  {
    id: "ps4-let-them-come",
    sourceUrl: "https://versusevil.com/games/let-them-come/",
    overview:
      "Let Them Come is a stationary pixel-art shoot 'em up from Tuatara Games and Versus Evil about surviving waves of alien creatures from a fixed firing position. Players choose weapons, perks, ammo types, and upgrades between attempts, then hold the line as enemies rush in increasingly nasty patterns. It is a compact arcade survival game, built around twitch shooting, loadout choices, and the satisfaction of barely surviving one more wave.",
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
      rewrite.sourceUrl || game.descriptionSourceUrl || "",
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on verified identity, platform metadata, publisher/developer context, and official/store descriptions where available.",
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
