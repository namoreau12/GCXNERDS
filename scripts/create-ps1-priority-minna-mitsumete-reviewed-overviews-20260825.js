const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-minna-mitsumete-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-minna-no-shogi-jokyuuhen",
    sourceUrl: "https://www.gamesdatabase.org/game/sony-playstation/minna-no-shougi-joukyuu-hen-gold-series-",
    overview:
      "Minna no Shogi: Jokyuuhen is the advanced-class PlayStation entry in Success' SuperLite Gold Series shogi line. It is built around shogi course instruction and regular match play, with advice/supervision credited to professional shogi figures and a focus on helping players work toward stronger league-level play. GCX should present it as the higher-skill shogi volume, separate from the beginner and intermediate editions rather than a generic puzzle game.",
  },
  {
    id: "ps1-minna-no-shogi-shokyuuhen",
    sourceUrl: "https://www.uvlist.net/forum/thread/230199/About%2BMinna%2Bno%2BShogi%2BShokyuuhen",
    overview:
      "Minna no Shogi: Shokyuuhen is the beginner-focused PlayStation shogi volume from Success. Its purpose is accessibility: teach shogi in a more understandable and approachable format before players move into deeper competition. GCX should describe it as the introductory edition of the Minna no Shogi set, valuable for collectors because it marks a specific skill tier in Success' budget shogi lineup.",
  },
  {
    id: "ps1-minnya-de-ghost-hunter",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03491.html",
    overview:
      "Minnya de Ghost Hunter is a Japan-only PlayStation action-board game from E3 Staff where players choose characters and use a spirit-hunting kit to chase ghosts, spooks, and phantoms. The old horror label undersells the actual structure: this is more of a quirky ghost-catching board/action release than a survival-horror adventure. GCX should highlight the character-select setup, Japanese-only menus, and late-PS1 2002 release date.",
  },
  {
    id: "ps1-minton-keibu-no-sousa-file-doukeshi-satsujin-jiken",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01132.html",
    overview:
      "Minton Keibu no Sousa File: Doukeshi Satsujin Jiken is a first-person detective adventure from Thinking Rabbit and Riverhillsoft. Players take the role of Inspector Minton in 1932, investigating the murder of a circus clown in Brighton, a port city near London. GCX should treat it as a mystery-investigation import with a specific period crime premise, not a broad adventure placeholder.",
  },
  {
    id: "ps1-miracle-jim-no-bassing-beat",
    sourceUrl: "https://www.honestgamers.com/48544/playstation/miracle-jim-no-bassing-beat/game.html",
    overview:
      "Miracle Jim no Bassing Beat is a Japan-only PlayStation fishing game from Hearty Robin, released in 1998. Its value sits in the late-1990s Japanese bass-fishing wave, where players compare lures, timing, and fishing spots rather than team sports or arcade racing systems. GCX should identify it as a fishing-specific sports release and separate it from broader PlayStation outdoors titles like Bass Landing or Action Bass.",
  },
  {
    id: "ps1-miracle-space-race",
    sourceUrl: "https://www.psxdatacenter.com/games/P/M/SLES-04057.html",
    overview:
      "Miracle Space Race is a budget PlayStation kart racer from Belgian developer Miracle Designs, published in Europe by Midas and in North America by Mud Duck. It uses animal-based characters, futuristic tracks, weapons, shields, speed boosts, adjustable race lengths, and unlockable difficulty to chase the Crash Team Racing/Mario Kart style. GCX should describe it as a late-era budget kart racer with a space theme, not a simulation racer.",
  },
  {
    id: "ps1-miracle-world-fushigi-no-kuni-no-iq-meiro",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00110.html",
    overview:
      "Miracle World: Fushigi no Kuni no IQ Meiro is a Japanese quiz-and-brain-puzzle game framed around the TV-style Miracle World Brain Power challenge. Players answer varied questions and tackle timed visual trials such as spotting five differences before the clock runs out. GCX should present it as an early PlayStation IQ/quiz release where speed and observation matter as much as puzzle knowledge.",
  },
  {
    id: "ps1-mirano-no-arubaito-collection",
    sourceUrl: "https://www.hardcoregaming101.net/milano-no-arubaito-collection/",
    overview:
      "Mirano no Arubaito Collection, later known in English as Milano's Odd Job Collection, is Westone's charming PlayStation mini-game/RPG hybrid about a girl taking part-time jobs around town. The game mixes light life-sim structure, odd-job mini-games, item collection, and cartoon presentation, making it a notable late Westone curiosity beyond the Wonder Boy lineage. GCX should flag its later English localization history because it has become newly relevant to modern collectors.",
  },
  {
    id: "ps1-misa-no-mahou-monogatari",
    sourceUrl: "https://www.hardcoregaming101.net/misa-no-mahou-monogatari/",
    overview:
      "Misa no Mahou Monogatari: Heartful Memories is a magical-girl adventure/RPG hybrid from Sammy built around Misa training to become a tarot magician and protect both the human and magical worlds. Its scenarios branch into different tones, including heroine battles, idol ambitions, romance, and club activities. GCX should present it as a character-driven magical-girl import with multiple scenario styles, not a generic adventure entry.",
  },
  {
    id: "ps1-misaki-aggressive",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01474.html",
    overview:
      "Misaki-Aggressive follows Misaki, the granddaughter of a dojo fighting master who trains her in martial arts. The PlayStation release blends anime-style presentation with raising-sim and visual-novel elements, using its fighting-family premise as the hook. GCX should describe it as a Japanese character-training story game from Zero System and Shoeisha rather than a pure visual novel with no mechanical identity.",
  },
  {
    id: "ps1-miss-spider-s-tea-party",
    sourceUrl: "https://psxdatacenter.com/games/U/M/SLUS-01123.html",
    overview:
      "Miss Spider's Tea Party is a children's educational PlayStation game based on David Kirk's picture-book world. Aimed at young children, it offers eight mini-games that help Miss Spider's insect friends solve problems so they can attend her party, with simple cognitive-skill practice folded into colorful storybook presentation. GCX should label it as early-childhood edutainment, not a party game in the multiplayer sense.",
  },
  {
    id: "ps1-missland",
    sourceUrl: "https://www.hardcoregaming101.net/missland/",
    overview:
      "Missland is Altron's early PlayStation spot-the-difference game, built around examining strange 3D scenes for mismatched details. Its appeal comes from odd visual dioramas such as rooms, meals, youkai imagery, space scenes, and other unusual objects that show off the system's early 3D novelty. GCX should correct the old horror tag and present it as a visual-search puzzle curiosity.",
  },
  {
    id: "ps1-missland-2",
    sourceUrl: "https://www.hardcoregaming101.net/missland/",
    overview:
      "Missland 2 continues Altron's PlayStation find-the-difference formula, giving players more strange 3D scenes to inspect for discrepancies. Like the first game, it is less about scares or action and more about careful observation, camera-space curiosity, and early 3D object presentation. GCX should treat it as the sequel in a niche visual-search puzzle pair so it does not blur into generic horror listings.",
  },
  {
    id: "ps1-mitouhou-e-no-chousen-alps-hen",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00662.html",
    overview:
      "Mitouhou e no Chousen: Alps-Hen, also known as Rock-Climbing: Mitouhou e no Chousen: Alps-Hen, is a climbing action-simulation from We Net. Players choose routes, seasons such as summer or winter, and training missions while preparing to conquer difficult rock walls. GCX should describe it as a rare PlayStation climbing sim, because that specific mountaineering premise is the whole reason the listing matters.",
  },
  {
    id: "ps1-mitsumete-knight",
    sourceUrl: "https://en.wikipedia.org/wiki/Mitsumete_Knight",
    overview:
      "Mitsumete Knight is Konami and Red Company's fantasy dating sim/RPG for PlayStation, often described as a Tokimeki Memorial successor moved from school life into a medieval-European war setting. Players spend three in-game years raising stats, training, dating heroines, entering competitions, and surviving occasional real-time RPG-like battles tied to the kingdom's war. GCX should present it as a major import dating sim with strategy and combat layers, not a simple visual novel.",
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
    if (!game) throw new Error(`Missing PS1 game ${rewrite.id}`);
    rows.push([
      "ps1",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on platform database, specialist database, and series/gameplay sources.",
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
