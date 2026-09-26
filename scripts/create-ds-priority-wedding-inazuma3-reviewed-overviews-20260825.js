const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-wedding-inazuma3-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-imagine-wedding-designer",
    sourceUrl: "https://www.vgchartz.com/game/25966/imagine-wedding-designer/",
    overview:
      "Imagine: Wedding Designer is a themed event-planning game built around arranging weddings for six brides with different tastes. Players choose invitations, dresses, veils, bouquets, hair, makeup, ceremony locations, music, decorations, and wedding-party outfits, then guide the actual ceremony and capture moments with the DS camera-style presentation. It plays like a light client-management and customization game rather than a role-playing adventure.",
  },
  {
    id: "ds-imagine-zookeeper",
    sourceUrl: "https://www.vgchartz.com/game/37124/imagine-zookeeper/",
    overview:
      "Imagine: Zookeeper turns the Imagine formula into a wildlife-preserve management and care game. Players build and tour a preserve, look after different species, learn their needs, photograph young animals, and rescue injured ones back at headquarters. The appeal is relaxed caretaking, simple education, and park upkeep rather than deep tycoon economics, so condition-conscious collectors should expect a casual Ubisoft DS release aimed at younger players.",
  },
  {
    id: "ds-inazuma-eleven-2-blizzard",
    sourceUrl: "https://www.nintendo.co.uk/games/nintendo-ds/inazuma-eleven-2-firestorm-271166.html",
    overview:
      "Inazuma Eleven 2: Blizzard is one half of Level-5's second football RPG, pairing story exploration with stylus-controlled matches. After Raimon are challenged by Alius Academy, Mark Evans travels across Japan to recruit stronger players, build a balanced squad, and use special moves in dramatic football battles. Blizzard shares the main story with Firestorm but includes version-specific players, teams, abilities, and local wireless trading hooks.",
  },
  {
    id: "ds-inazuma-eleven-2-firestorm",
    sourceUrl: "https://www.nintendo.co.uk/games/nintendo-ds/inazuma-eleven-2-firestorm-271166.html",
    overview:
      "Inazuma Eleven 2: Firestorm keeps the series' mix of RPG progression, character recruitment, and stylus-driven football action. Players direct runs, shots, tackles, and pressure with taps and slides while building a team from roughly 1,500 recruitable players. Firestorm follows the same Alius Academy storyline as Blizzard, but its exclusive characters, opponents, abilities, and special moves make version choice matter for collectors and completionists.",
  },
  {
    id: "ds-inazuma-eleven-3-sekai-e-no-chousen-bomber",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-games/Inazuma-Eleven-3-Lightning-Bolt-796260.html",
    overview:
      "Inazuma Eleven 3: Sekai e no Chousen!! Bomber moves the series from saving Japan to competing on the world stage. The game follows Inazuma National through the Football Frontier International, keeps the RPG-and-football match structure, and expands team building with thousands of recruitable players and hundreds of special moves. Bomber is the version later localized as Bomb Blast, with its own rivals and version-specific content.",
  },
  {
    id: "ds-inazuma-eleven-3-sekai-e-no-chousen-spark",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-games/Inazuma-Eleven-3-Lightning-Bolt-796260.html",
    overview:
      "Inazuma Eleven 3: Sekai e no Chousen!! Spark is the companion version to Bomber and the basis for the later Lightning Bolt release. It sends Mark Evans and Inazuma National into the Football Frontier International while preserving the series' blend of scouting, RPG growth, exploration, and tactical football matches. Spark's version-specific viewpoint, rivals, and recruitable content make it distinct even though the core tournament arc is shared.",
  },
  {
    id: "ds-inazuma-eleven-3-sekai-e-no-chousen-the-ogre",
    sourceUrl: "https://www.nintendo.co.uk/games/nintendo-3ds/inazuma-eleven-3-team-ogre-attacks--846138.html",
    overview:
      "Inazuma Eleven 3: Sekai e no Chousen!! The Ogre is the expanded third version of Inazuma Eleven 3, later localized as Team Ogre Attacks. It keeps the international tournament storyline but adds a future-team threat, Canon Evans, Ogre-exclusive players, items, and special moves. The result is the densest version of the DS-era finale, with the same scouting and match systems plus extra story material for serious series followers.",
  },
  {
    id: "ds-indo-shiki-keisan-drill-ds",
    sourceUrl: "https://www.play-asia.com/hi/indo-shiki-keisan-drill-ds-zennou-series-vol-02/13/702fox",
    overview:
      "Indo Shiki Keisan Drill DS, also listed as Zennou Series Vol. 02, is a Japanese educational DS release focused on Indian-style mental arithmetic drills. Rather than presenting a conventional adventure or arcade loop, it fits the DS brain-training wave with short calculation exercises, practice structure, and portable study sessions. For library browsing, it belongs beside other Japan-only learning software rather than action or puzzle releases.",
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
    if (!game) throw new Error(`Missing DS game ${rewrite.id}`);
    rows.push([
      "ds",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority DS weak-template cleanup; original GCX editorial overview based on publisher, official Nintendo, retail, and specialist catalog information.",
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
