const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-kunio-laidback-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-kunio-kun-the-world-classics-collection",
    sourceUrl: "https://www.amazon.com/Classics-Collection-PLAYSTATION-JAPANESE-VERSION-4/dp/B07H5KLJBM",
    overview:
      "Kunio-kun: The World Classics Collection is an Arc System Works compilation that gathers classic Kunio-kun and related Technos-era games for modern hardware. The appeal is preservation and variety: brawlers, sports spin-offs, and schoolyard action games that helped define the series' rough-and-tumble personality. It is best for collectors and retro fans who want a broad Kunio package rather than one newly built sequel.",
  },
  {
    id: "ps4-kwaidan-azuma-manor-story",
    sourceUrl: "https://store.playstation.com/en-us/product/UP2535-CUSA17878_00-XXXXXXXXXXXXXXXX",
    overview:
      "Kwaidan: Azuma Manor Story is a 1930s Japan-set horror action-adventure about exploring the trap-filled Azuma Manor and surviving the Yoki inside. It mixes 3D movement and combat with point-and-click style examination, letting players investigate objects, solve mechanical puzzles, and push deeper into the house. It is a strange, old-fashioned horror game for players who like haunted mansions, folklore, and awkward but distinctive adventure design.",
  },
  {
    id: "ps4-la-cops",
    sourceUrl: "https://www.team17.com/games/la-cops",
    overview:
      "LA Cops is a 1970s-styled top-down tactical shooter from Modern Dream and Team17. Players control two officers at once, positioning one cop while directly moving the other through short shootout-heavy stages full of criminals, doors, and sightlines. It is not a police sim; it is a fast arcade action game where the hook is swapping between partners, clearing rooms, and surviving messy real-time encounters.",
  },
  {
    id: "ps4-la-mulana",
    sourceUrl: "https://store.playstation.com/product/UP1063-CUSA17443_00-LAMULANA10000000",
    overview:
      "La-Mulana is a demanding archaeological action-adventure starring Lemeza Kosugi as he explores deadly ruins in search of the Secret Treasure of Life. Players read clues, map chambers, dodge traps, solve obscure puzzles, and fight Guardians in a sprawling structure that rewards note-taking and patience. It is a cult classic because it treats discovery as the main challenge, often asking players to think like an explorer rather than follow a marker.",
  },
  {
    id: "ps4-la-mulana-2",
    sourceUrl: "https://playism.com/en/game/la-mulana-2/",
    overview:
      "La-Mulana 2 follows Lumisa Kosugi into Eg-Lana, the other ruins tied to the monster outbreaks around La-Mulana. Like the first game, it combines platforming, combat, riddles, hidden passages, and massive boss encounters, but with a new protagonist and a fresh archaeological labyrinth. It is for players who want another dense puzzle-adventure built around reading clues carefully and slowly making sense of a hostile ancient world.",
  },
  {
    id: "ps4-labyrinth-life",
    sourceUrl: "https://store.playstation.com/en-gb/product/EP3036-CUSA16449_00-0000000000000000",
    overview:
      "Labyrinth Life is the PS4 version of Omega Labyrinth Life, a roguelike dungeon RPG from Matrix Software and D3 Publisher. Players enter randomized dungeons, manage items, improve gear, use character skills, and work through repeatable floor-based challenges. The game is also known for heavy fanservice systems, so its audience is specifically players comfortable with that tone who still want a traditional mystery-dungeon loop underneath.",
  },
  {
    id: "ps4-laid-back-camp-virtual-fumoto-campsite",
    sourceUrl: "https://store.playstation.com/en-us/product/UP1713-CUSA25361_00-LBCB000000000000",
    overview:
      "Laid-Back Camp -Virtual- Fumoto Campsite is a short 3D adventure based on the cozy camping anime, placing the player in Rin's role during an overnight trip with Nadeshiko. The experience centers on taking in scenery, listening to fully voiced character moments, taking photos, and enjoying food and camp atmosphere rather than solving hard puzzles. It works as a compact fan piece, closer to an interactive anime episode than a conventional adventure game.",
  },
  {
    id: "ps4-laid-back-camp-virtual-lake-motosu",
    sourceUrl: "https://store.playstation.com/en-us/product/UP1713-CUSA25360_00-LBCA000000000000",
    overview:
      "Laid-Back Camp -Virtual- Lake Motosu is the companion 3D camping vignette where the player takes Nadeshiko's perspective alongside Rin near Mt. Fuji. Players look around, take pictures, share food, and move through a relaxed sequence of fully voiced scenes at the lakeside campsite. Its value is atmosphere and fan service in the wholesome sense: a brief, scenic way to inhabit the anime's quiet camping mood.",
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
