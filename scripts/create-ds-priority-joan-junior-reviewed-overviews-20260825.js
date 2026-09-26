const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-joan-junior-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-joan-jade-and-the-gates-of-xibalba",
    sourceUrl: "https://www.bigfishgames.com/blog/walkthroughs/joan-jade-and-the-gates-of-xibalba.html",
    overview:
      "Joan Jade and the Gates of Xibalba is a hidden-object adventure about an archaeologist searching Mayan ruins for her missing children. The DS release mixes scene scanning, inventory use, object-list puzzles, and mini-game locks rather than strategy systems, so it should sit beside casual adventure ports instead of tactical games. GCX should highlight the Mayan-temple framing and rescue premise because those are the hooks that separate it from generic hidden-object software.",
  },
  {
    id: "ds-john-deere-harvest-in-the-heartland",
    sourceUrl: "https://www.vgchartz.com/game/12844/john-deere-harvest-in-the-heartland/",
    overview:
      "John Deere: Harvest in the Heartland is a DS farming sim built around turning open land into a profitable farm. Players grow crops, raise livestock, milk cows, earn cash, expand the property, and buy branded John Deere equipment, giving it a practical farm-management loop rather than a character-heavy Harvest Moon structure. GCX should present it as a licensed agriculture sim where machinery branding and routine farm upkeep are the main collector identifiers.",
  },
  {
    id: "ds-johnny-bravo-in-the-hukka-mega-mighty-ultra-extreme-date-o-rama",
    sourceUrl: "https://www.esrb.org/ratings/25892/johnny-bravo-in-the-hukka-mega-mighty-ultra-extreme-date-o-rama/",
    overview:
      "Johnny Bravo In The Hukka Mega Mighty Ultra Extreme Date-O-Rama! turns the Cartoon Network character into a dating-show party game. Players guide Johnny through mini-game contests such as food fights, weight lifting, dancing, and other slapstick challenges while the writing leans on the show's suggestive one-liners and self-parody. GCX should label it as a licensed party/action release, not a traditional adventure game, with the Johnny Bravo TV connection doing most of the collector work.",
  },
  {
    id: "ds-johnny-no-dasshutsu-daisakusen",
    sourceUrl: "https://www.siliconera.com/johnny-escapes-breaks-out-on-the-ds-in-august/",
    overview:
      "Johnny no Dasshutsu Daisakusen is Success' Japan-only DS escape adventure, built around separate scenarios where Johnny searches locations such as a casino or pyramid for a way out. The touch screen is used to inspect rooms, collect items, and solve the chain of escape-route puzzles. GCX should describe it as an import room-escape game, because that structure is much more accurate than calling it a broad adventure release.",
  },
  {
    id: "ds-jojo-s-fashion-show",
    sourceUrl: "https://bitjumpgames.com/products/jojos-fashion-show-nintendo-ds",
    overview:
      "Jojo's Fashion Show brings GameLab's casual fashion/time-management formula to DS, asking players to assemble outfits quickly for themed runway shows. The appeal is matching clothing pieces under pressure, keeping models moving, and following Jojo Cruz's return-to-fashion storyline rather than running a life sim. GCX should position it as a style-and-speed casual game where the creative hook is outfit coordination, not open-ended boutique management.",
  },
  {
    id: "ds-jonas",
    sourceUrl: "https://ds.gamespy.com/nintendo-ds/jonas/",
    overview:
      "Jonas is Disney's DS adaptation of the Jonas Brothers TV series, combining light exploration of show-inspired locations with rhythm interactions. Players collect musical notes, power up guitars, hit chords, and move through a story wrapper built around the brothers and their school/concert life. GCX should treat it as a Disney Channel licensed rhythm-adventure, useful for collectors tracking late-2000s music celebrity tie-ins rather than for pure rhythm-game depth.",
  },
  {
    id: "ds-joshikousei-nigeru-shinrei-puzzle-gakuen",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/141671-joshikousei-nigeru-shinrei-puzzle-gakuen",
    overview:
      "Joshikousei Nigeru! Shinrei Puzzle Gakuen is a Japan-only Success SuperLite 2500 puzzle release developed by Skonec. The title's schoolgirl-and-ghost framing gives it a horror-school identity, but the catalog evidence points to a compact budget puzzle game rather than a story-heavy adventure. GCX should present it as a niche import puzzle title where the SuperLite budget line, Success publishing credit, and spooky school theme are the key context.",
  },
  {
    id: "ds-journey-to-the-center-of-the-earth",
    sourceUrl: "https://en.wikipedia.org/wiki/Journey_to_the_Center_of_the_Earth_(2008_video_game)",
    overview:
      "Journey to the Center of the Earth is THQ and Human Soft's DS action game based on the 2008 Brendan Fraser film. Players swap between Trevor, Sean, and Hannah while moving through underground environments, minecart and raft sequences, checkpoints, and character-specific abilities. GCX should describe it as a movie-licensed action-adventure with open-area aspirations and rough DS-era execution, not as an adaptation of the Jules Verne novel by itself.",
  },
  {
    id: "ds-juggler-ds",
    sourceUrl: "https://www.amazon.com/Juggler-DS-Japan-Nintendo/dp/B001EWDS0C",
    overview:
      "Juggler DS is a Japan-only pachislot simulation from Commseed built around the Juggler slot-machine brand. Its value is not in puzzle solving or action mechanics, but in recreating a specific Japanese gambling-machine experience on handheld hardware. GCX should label it clearly as a pachislot import so collectors do not confuse it with a circus juggling game or a general puzzle title.",
  },
  {
    id: "ds-jumble-madness",
    sourceUrl: "https://www.esrb.org/ratings/25527/jumble-madness/",
    overview:
      "Jumble Madness adapts the long-running newspaper word puzzle into a DS word-game package. Players unscramble letters, solve riddles and caption-based puns, and work through classic Jumble-style anagrams, with some modes adding timed or multiplayer pressure. GCX should present it as a licensed word-puzzle release from Destineer and Anino, closer to crossword-page casual gaming than a generic puzzle compilation.",
  },
  {
    id: "ds-jumpstart-deep-sea-escape",
    sourceUrl: "https://kotaku.com/games/jumpstart-deep-sea-escape",
    overview:
      "JumpStart: Deep Sea Escape is an educational DS adventure for younger players, built around rescuing a stranded submarine in an underwater world. The game folds oxygen-tank collection, puzzles, hidden activities, and water-monster encounters into practice for early reading, math, spelling, and critical-thinking skills. GCX should call it an edutainment title for roughly early elementary ages, with the JumpStart brand doing the main identification work.",
  },
  {
    id: "ds-jumpstart-legend-of-lost-island",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "JumpStart: Legend of Lost Island is another Knowledge Adventure DS entry in the long-running JumpStart edutainment line. It uses an island-adventure frame to package child-friendly learning tasks rather than chasing action-game pacing or traditional RPG progression. GCX should keep the overview grounded in its educational brand context, making clear that the release matters as part of the JumpStart handheld catalog.",
  },
  {
    id: "ds-jungle-school",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/102065-jungle-school",
    overview:
      "Jungle School is a classroom-management mini-game release where the player acts as a teacher overseeing a small group of unruly students. Scheduling classes, keeping order, and completing short subject-themed activities define the loop, with mini-games built around math, gym, chemistry mishaps, and other school scenarios. GCX should describe it as a quirky teacher-sim/mini-game title rather than a normal educational workbook.",
  },
  {
    id: "ds-junior-brain-trainer",
    sourceUrl: "https://www.nintendolife.com/reviews/2009/04/junior_brain_trainer_ds",
    overview:
      "Junior Brain Trainer is Avanquest's child-focused answer to the DS brain-training trend, aimed at roughly ages 6 to 11. It uses bite-size exercises for memory, spelling, numeracy, reading, writing, geometry, and problem solving, with unlockable mini-games as rewards. GCX should present it as educational brain-training software for kids, useful for catalog completeness but clearly different from Nintendo's adult-focused Brain Age identity.",
  },
  {
    id: "ds-junior-brain-trainer-2",
    sourceUrl: "https://www.cubed3.com/games/reviews/nintendo-ds/junior-brain-trainer-2",
    overview:
      "Junior Brain Trainer 2 continues Avanquest's school-skills brain-training line for younger DS players. Like the first game, it targets classroom-adjacent practice rather than entertainment-first puzzle design, with activities meant to reinforce reading, math, memory, and other study skills. GCX should mark it as a sequel in the junior learning series and explain that its value is educational software context, not a major gameplay reinvention.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on platform database, publisher, storefront/rating, specialist database, and series sources.",
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
