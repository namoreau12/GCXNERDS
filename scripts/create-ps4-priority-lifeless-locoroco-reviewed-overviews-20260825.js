const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-lifeless-locoroco-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-lifeless-planet",
    sourceUrl: "https://serenityforge.com/games/lifeless-planet",
    overview:
      "Lifeless Planet is a quiet sci-fi adventure about an astronaut searching a supposedly barren world after a disastrous landing. The mystery deepens when he discovers an abandoned Soviet-style settlement, turning the trip into a mix of environmental storytelling, light platforming, and puzzle exploration. It is best for players who enjoy lonely atmosphere, slow-burn discovery, and the strange unease of finding human traces where they should not exist.",
  },
  {
    id: "ps4-light-fairytale-episode-1",
    sourceUrl: "https://miyu.works/LF",
    overview:
      "Light Fairytale Episode 1 opens a modern episodic JRPG series inspired by the emotional tone and turn-based structure of 1990s Japanese role-playing games. Players follow Haru and Kuroko through the underground Lower City as they resist an empire and begin uncovering the world above them. It is short by design, acting as the first chapter of a larger story with classic menu combat, stylized characters, and a compact narrative hook.",
  },
  {
    id: "ps4-linelight",
    sourceUrl: "https://linelightgame.com/",
    overview:
      "Linelight is a minimalist puzzle game about moving along glowing line circuits and manipulating the paths, timing, and behavior of other moving lights. Its rules are introduced without heavy text, letting players learn through motion, rhythm, and observation across cleanly designed puzzle spaces. The result is calm but clever, a puzzle game whose elegance comes from doing a lot with very little visual noise.",
  },
  {
    id: "ps4-link-a-pix-deluxe",
    sourceUrl: "https://www.lightwoodgames.com/link-a-pix-deluxe/",
    overview:
      "Link-a-Pix Deluxe is a logic puzzle collection where every grid hides a picture revealed by drawing paths between matching numbered clues. The number shows exactly how long the connecting line must be, so each puzzle becomes a deduction exercise about routes, color, and space. It is a strong fit for picross and pencil-puzzle fans who want clear rules, no guessing, and a large supply of quiet puzzles on PS4.",
  },
  {
    id: "ps4-lisa-definitive-edition",
    sourceUrl: "https://serenityforge.com/games/lisa-definitive-edition",
    overview:
      "Lisa: Definitive Edition packages the cult side-scrolling RPGs Lisa: The Painful and Lisa: The Joyful with updated presentation and content. Set in the ruined world of Olathe, it mixes bleak comedy, turn-based combat, party management, and permanent consequences that can cost characters, limbs, or worse. It is memorable because its jokes and cruelty sit right next to genuine moral pressure, making every survival choice feel ugly on purpose.",
  },
  {
    id: "ps4-lithium-inmate-39",
    sourceUrl: "https://store.playstation.com/en-us/product/UP0418-CUSA17313_00-000000001LITREED",
    overview:
      "Lithium: Inmate 39 is a horror puzzle-platformer about a small patient trapped inside a twisted mental world and trying to piece together his past. Players solve environmental puzzles, avoid threats, gather clues, and sometimes rely on a more dangerous alter ego to break through obstacles. It is a rough but distinctive indie horror release, aimed at players interested in oppressive imagery and old-school 3D puzzle-horror ideas.",
  },
  {
    id: "ps4-lizard-lady-vs-the-cats",
    sourceUrl: "https://thewgreen.itch.io/lizard-lady-vs-the-cats",
    overview:
      "Lizard Lady vs. the Cats is a tiny low-budget action game from The Voices Games about a masked vigilante hunting a gang of cats. Players move through simple third-person combat scenarios, and the package also includes the related Lizard Lady vs Herself mode about fighting manifestations of guilt. It is best framed honestly as a curious ultra-budget release, more notable for its odd premise and trophy-hunter profile than polished action design.",
  },
  {
    id: "ps4-locoroco-2-remastered",
    sourceUrl: "https://store.playstation.com/en-us/product/UP9000-CUSA06091_00-UCUS987310000001",
    overview:
      "LocoRoco 2 Remastered brings Japan Studio's PSP puzzle-platformer sequel to PS4 with higher-resolution presentation and PS4 Pro 4K support. Players tilt the world to roll, split, and bounce the singing LocoRoco through colorful stages while restoring life and battling the Moja threat. Its appeal is tactile and musical: simple controls, bright art, hidden collectibles, and cheerful physics puzzles that feel unlike conventional platformers.",
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
