const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-naught-neptunia-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-naught",
    sourceUrl: "https://wildsphere.es/naught/",
    overview:
      "Naught is WildSphere's gravity-rotation platformer about guiding a small silhouette character through dark labyrinths by turning the world itself. Instead of standard left-to-right platforming, players rotate the environment to change gravity, opening routes through hidden areas, hazards, and puzzle-like challenge rooms. GCX should describe it as a compact PS4 indie built around a single control idea, closer to skillful atmospheric puzzle-platforming than a conventional action game.",
  },
  {
    id: "ps4-nekopara-vol-1",
    sourceUrl: "https://store.playstation.com/de-de/product/EP0287-CUSA12343_00-NEKOPARA010000EU",
    overview:
      "Nekopara Vol. 1 is the opening PlayStation 4 entry in NEKO WORKs' slice-of-life visual novel series, centered on Kashou Minaduki leaving his family's wagashi shop to open the patisserie La Soleil. The story introduces Chocola and Vanilla after they follow him from home, turning the game into a mostly linear, character-focused comedy about bakery life and found-family routines. GCX should frame the PS4 version as a console visual novel for readers tracking anime-style narrative releases, not as a choice-heavy adventure.",
  },
  {
    id: "ps4-nekopara-vol-2",
    sourceUrl: "https://store.playstation.com/en-ca/product/UP0287-CUSA14989_00-NEKOPARA020000US/",
    overview:
      "Nekopara Vol. 2 continues the La Soleil visual-novel story on PS4 with new fully voiced scenes, HD presentation, new hand-drawn NEKO WORKs artwork, and a new opening movie and theme song for the console release. The PlayStation listing also includes the bonus story Nekopara Extra: Kitten Day Promise, giving this volume extra context for the cast beyond the main sequel plot. GCX should distinguish it as the expanded console edition of the second chapter rather than a standalone action or simulation game.",
  },
  {
    id: "ps4-nekopara-vol-3",
    sourceUrl: "https://store.playstation.com/en-us/product/UP0287-CUSA16150_00-NEKOPARA030000US",
    overview:
      "Nekopara Vol. 3 brings the third chapter of NEKO WORKs' visual novel series to PS4, shifting the focus toward Maple and Cinnamon while returning to Kashou's patisserie, La Soleil. The console version adds a new opening movie and song, full-HD artwork, and presentation updates aimed at making the linear story feel polished on a television. GCX should describe it as the Maple-and-Cinnamon volume in the PS4 Nekopara run, useful for collectors because each numbered entry follows a different slice of the ensemble.",
  },
  {
    id: "ps4-nekopara-vol-4",
    sourceUrl: "https://store.playstation.com/en-us/product/UP0287-CUSA23801_00-NEKOPARA040000US",
    overview:
      "Nekopara Vol. 4 is the fourth PS4 installment of the NEKO WORKs visual novel series, again using animated E-mote character sprites, full voice acting for story scenes except the protagonist, gallery features, and a new opening song. Its story follows Kashou after La Soleil has become successful, pushing the series toward questions about family approval, growth, and the bonds around the patisserie. GCX should treat it as the later, more reflective console chapter in the numbered Nekopara lineup.",
  },
  {
    id: "ps4-neon-abyss",
    sourceUrl: "https://store.playstation.com/en-us/product/UP4064-CUSA18917_00-NEONABYSS0000000",
    overview:
      "Neon Abyss is Veewo Games and Team17's frantic roguelike action-platformer where members of Hades' Grim Squad run and gun through the Abyss to fight modern gods. Its identity comes from stackable item synergies, procedural rooms, pets that evolve during a run, and a dungeon-evolution system where player choices can alter rules, bosses, and future run conditions. GCX should pitch it as a bright, arcade-speed PS4 roguelite for players who want repeated runs and build chaos rather than a fixed campaign.",
  },
  {
    id: "ps4-neon-city-riders",
    sourceUrl: "https://store.playstation.com/en-us/product/UP0209-CUSA18571_00-BROMIONCRPS01234",
    overview:
      "Neon City Riders is Mecha Studios' top-down 2D action-adventure about Rick, a masked vigilante trying to free a decaying futuristic city from superpowered gangs. Players fight enemies, solve puzzles, unlock new super-abilities, recruit companions, complete side quests, and use those upgrades to open new paths through different gang-controlled districts. GCX should describe it as a compact post-cyberpunk adventure with Metroid-style ability gating and brawler energy, not simply another neon arcade game.",
  },
  {
    id: "ps4-neptunia-game-maker-r-evolution",
    sourceUrl: "https://ifi.games/neptuniagamemaker/",
    overview:
      "Neptunia Game Maker R:Evolution is a 2024 action RPG from Compile Heart and Idea Factory built around Older Nep rebuilding and managing a game-development studio. It expands the Neptunia formula with a four-person party, dungeons that can be explored by motorcycle, company-building progression, and the series' usual meta jokes about the game industry. GCX should frame it as a late PS4-era Neptunia release for fans tracking physical JRPG libraries and the franchise's shift toward management-flavored action RPG systems.",
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
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on official publisher, platform, or store pages.",
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
