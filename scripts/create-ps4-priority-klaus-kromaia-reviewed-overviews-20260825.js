const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-klaus-kromaia-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-klaus",
    sourceUrl: "https://klausgame.com/",
    overview:
      "Klaus is a self-aware puzzle platformer from La Cosa Entertainment about an office worker who wakes up with no memory and the word KLAUS printed on his arm. Players guide him through precision jumps, switches, hazards, and touchpad-assisted environmental manipulation while the story toys with the relationship between character and player. Its hook is not just platforming, but a stylish, existential structure that keeps questioning who is really in control.",
  },
  {
    id: "ps4-knightin",
    sourceUrl: "https://store.playstation.com/en-gb/product/EP0896-CUSA17958_00-RGKNIGHTINBUNDLE",
    overview:
      "Knightin'+ is a compact top-down dungeon adventure about Sir Lootalot clearing four trap-filled dungeons in search of treasure and upgrades. Players fight monsters, solve room puzzles, find keys, unlock new abilities, and work through a deliberately old-school structure inspired by 1990s action adventures. It is a small, direct game for players who want pixel-art dungeon crawling without a sprawling RPG commitment.",
  },
  {
    id: "ps4-knot",
    sourceUrl: "https://www.warlockarts.com/knot/index.php",
    overview:
      "Knot is a 3D mechanical puzzle game inspired by interlocked Chinese wooden knots. Each stage presents a connected block structure, and players rotate the view, study how the pieces fit, and remove blocks in the correct order to disassemble the object. It is quiet and tactile rather than flashy, aimed at puzzle players who enjoy spatial reasoning, patience, and the satisfaction of untangling a physical-looking problem.",
  },
  {
    id: "ps4-knowledge-is-power-decades",
    sourceUrl: "https://store.playstation.com/concept/232856",
    overview:
      "Knowledge is Power: Decades is a PlayLink party quiz game that uses phones or tablets as controllers for up to six players. This follow-up leans into pop-culture trivia from the 1980s, 1990s, 2000s, and 2010s, mixing questions with tactical power plays that can slow rivals down. It is built for living-room groups, families, and casual parties where the fun comes from quick answers, sabotage, and arguments over forgotten cultural memories.",
  },
  {
    id: "ps4-koi",
    sourceUrl: "https://store.playstation.com/en-gb/product/EP1830-CUSA05104_00-KOIGAMEBUNDLE002",
    overview:
      "Koi is a gentle adventure-puzzle game about guiding a lone koi fish through ponds that have been polluted and emptied of life. Players swim through eight levels, help smaller fish, avoid hazards, complete simple mini-games, and restore color and calm to the water. Its appeal is mood and theme more than challenge, offering a short reflective journey about nature, pollution, and renewal.",
  },
  {
    id: "ps4-koihime-enbu",
    sourceUrl: "https://koihime-ac.jp/en/",
    overview:
      "Koihime Enbu is a 2D fighting game spun out of the Koihime Musou universe, reimagining Three Kingdoms figures as an all-female anime fighter roster. Matches focus on grounded spacing, weapon normals, assists, counters, and clean execution rather than giant cinematic systems. It is a niche but serious fighter, suited to players who want arcade-style fundamentals with a specific historical-anime flavor.",
  },
  {
    id: "ps4-koihime-enbu-ryorairai",
    sourceUrl: "https://store.playstation.com/en-us/product/UP1056-CUSA06733_00-KOIHIMEENBUUS000",
    overview:
      "Koihime Enbu RyoRaiRai expands the Koihime Enbu fighting-game formula with a larger mix of playable characters and assist options set against the series' ancient-China backdrop. Players build strategies around character pairings, fast combat, counters, and combo routes, with training and challenge modes helping newcomers learn the system. It is the stronger PS4 entry for anyone interested in the series as a competitive 2D fighter.",
  },
  {
    id: "ps4-kromaia-omega",
    sourceUrl: "https://store.playstation.com/en-id/product/EP4034-CUSA03094_00-ASIA000000000000",
    overview:
      "Kromaia Omega is a free-roaming 3D shoot 'em up from Kraken Empire, trading flat scrolling lanes for full movement through abstract arenas filled with enemies, objects, and giant bosses. Players pilot different craft with distinct weapon styles, dodge in all directions, and chase survival or score through modes such as Story, Score Attack, and Pure Mode. It is built for shmup fans who want speed, space, and disorientation rather than a traditional 2D bullet pattern.",
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
