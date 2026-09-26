const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-shogi-jakehunter-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-itsu-demo-doko-demo-dekiru-shogi-ai-shogi-ds",
    sourceUrl: "https://www.ebay.com/p/56271696",
    overview:
      "Itsu Demo Doko Demo Dekiru Shogi: AI Shogi DS turns the Nintendo DS into a portable shogi board and training tool. Retail catalog copy points to computer opponents at multiple levels, a challenge mode with specific clear conditions, wireless multiplayer support, and an included shogi guide for newer players. GCX should frame it as a practical Japanese board-game cartridge: low on spectacle, but useful for collectors who track traditional tabletop adaptations and Marvelous's DS utility-style releases.",
  },
  {
    id: "ds-itsu-demo-doko-demo-onita-atsushi-no-seiji-quiz-ds",
    sourceUrl: "https://www.mobygames.com/game/220844/itsudemo-dokodemo-onita-atsushi-no-seiji-quiz-ds/",
    overview:
      "Itsu Demo Doko Demo: Onita Atsushi no Seiji Quiz DS is a Japan-only politics quiz game built around the likeness of Atsushi Onita, the pro wrestler who later served in Japanese politics. Contemporary coverage compared the format to Brain Age-style quiz training, but the subject matter is much stranger and more specific: players answer questions about Japanese government and political knowledge through Onita's cartoon persona. Its collector interest comes from that unusual celebrity-politics angle rather than broad DS gameplay depth.",
  },
  {
    id: "ds-j4g-a-girl-s-world",
    sourceUrl: "https://www.mobygames.com/game/183822/j4g-a-girls-world/",
    overview:
      "J4G - A Girl's World is a European DS adventure/life-sim aimed at younger players, built around three playable girls and three linked stories in the same world. Retail descriptions name Samantha, Carlotta, and Luisa as the roles players step into, with play centered on social scenes, shopping, activities, and choice-driven progression rather than action. For GCX, it belongs in the DS library as a niche dtp Young Entertainment release from the platform's fashion-and-friendship software wave.",
  },
  {
    id: "ds-jacqueline-wilson-s-tracy-beaker-the-game",
    sourceUrl: "https://www.youtube.com/watch?v=Ol_6qN8qMQ4",
    overview:
      "Jacqueline Wilson's Tracy Beaker: The Game adapts the children's book and TV character into a DS story adventure for younger players. Gameplay footage and catalog descriptions show a licensed, narrative-focused game where players explore locations tied to Tracy's world, including The Dumping Ground, while completing simple objectives and character interactions. Its value is mainly as a UK/EU licensed children's release, especially for collectors tracking Jacqueline Wilson media and obscure dtp Young Entertainment DS titles.",
  },
  {
    id: "ds-jagged-alliance-ds",
    sourceUrl: "https://www.gamestop.com/video-games/nds/products/jagged-alliance---nintendo-ds/10072612.html",
    overview:
      "Jagged Alliance DS adapts the classic mercenary tactics series to Nintendo's handheld. The core premise remains liberating Metavira by hiring a squad, managing resources, and resolving encounters through turn-based tactical combat rather than reflex shooting. The DS version is notable as a late portable attempt to translate a dense PC strategy game to touch-screen hardware; collectors should expect squad management and nonlinear campaign structure, but also a compromised handheld port compared with the original computer release.",
  },
  {
    id: "ds-jaka-jaka-music",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/132338-jaka-jaka-music-m09",
    overview:
      "Jaka Jaka Music! is a Japan-only Nintendo DS music game from Plato, released in 2010. Database and soundtrack records identify it as a music/action title, with the appeal centered on rhythm play, short sessions, and repeated performance rather than story progression. It is a modest but useful DS catalog entry for collectors building out Japan-exclusive rhythm and music-game shelves alongside better-known titles like Rhythm Heaven and Jam with the Band.",
  },
  {
    id: "ds-jake-hunter-detective-story-memories-of-the-past",
    sourceUrl: "https://www.rpgfan.com/review/jake-hunter-detective-story-memories-of-the-past/",
    overview:
      "Jake Hunter Detective Story: Memories of the Past is the stronger DS introduction to WorkJam's long-running detective adventure series. It restores and retranslates the material that was cut down in the earlier North American Detective Chronicles release, offering six linear cases, menu-driven investigation, evidence gathering, and the lighter Jake Hunter Unleashed bonus episodes. The appeal is noir-flavored visual novel pacing rather than puzzle-box difficulty: players read, visit locations, question people, and push each case forward through structured deductions.",
  },
  {
    id: "ds-jake-hunter-detective-chronicles",
    sourceUrl: "https://www.honestgamers.com/7193/ds/jake-hunter-detective-chronicles/review.html",
    overview:
      "Jake Hunter: Detective Chronicles was the first North American DS release for the Tantei Jinguji Saburo detective series, but it arrived as a heavily reduced version. It includes three short cases built around traveling between locations, talking to witnesses, inspecting scenes, and answering case-ending prompts, with little chance of true failure. GCX should present it as historically important for bringing Jake Hunter west, while noting that Memories of the Past is the more complete and better-regarded DS package.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on specialist database, retail catalog, gameplay footage, and contemporary coverage sources.",
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
