const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-maze-melty-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-maze-heroes-meikyuu-densetsu",
    sourceUrl: "https://archive.org/details/psx_mazehero",
    overview:
      "Maze Heroes: Meikyuu Densetsu is a Japan-only PlayStation board-game RPG from Media Entertainment. Archive metadata identifies it as a 1-4 player fantasy game with isometric, turn-based, strategy/tactics, and board-game elements, which makes the old generic RPG label too vague. GCX should frame it as a hybrid tabletop-style dungeon/maze tactics release for import collectors, not a conventional story-driven JRPG.",
  },
  {
    id: "ps1-mechwarrior-2",
    sourceUrl: "https://en.wikipedia.org/wiki/MechWarrior_2:_31st_Century_Combat",
    overview:
      "MechWarrior 2 on PlayStation is the console adaptation of Activision's BattleTech mech combat classic. The original PC game is a tactical vehicle simulation about the Refusal War between Clan Wolf and Clan Jade Falcon, while the PlayStation version was rebuilt by Quantum Factory with faster, more arcade-oriented combat, power-ups, condensed arenas, and extra console missions. It is better described as a mech combat sim-action hybrid than a strategy game.",
  },
  {
    id: "ps1-megatudo-2096",
    sourceUrl: "https://www.mobygames.com/game/36922/megatudo-2096/",
    overview:
      "Megatudo 2096 is a Japan-only 3D fighting game from General Support and Banpresto. MobyGames describes standard story and two-player versus modes, with each fighter carrying normal moves, special attacks, and a desperation-style option. The old puzzle-game blurb was wrong; this belongs with early PlayStation 3D arena fighters and is mostly interesting today as a lesser-known Japanese import.",
  },
  {
    id: "ps1-meguri-aishite",
    sourceUrl: "https://gamesdb.launchbox-app.com/developers/games/46119-sony-music-entertainment-japan",
    overview:
      "Meguri Aishite is a Japanese dating simulation published by Sony Music Entertainment Japan in 1999. LaunchBox describes the player role as a young student, which points to a character-relationship sim rather than the rhythm game implied by the old GCX metadata. For collectors, its appeal is as part of Sony Music's unusual PlayStation publishing catalog and the broader late-1990s wave of Japan-only romance simulations.",
  },
  {
    id: "ps1-meitantei-conan",
    sourceUrl: "https://it.wikipedia.org/wiki/Meitantei_Conan_(videogioco)",
    overview:
      "Meitantei Conan is the first PlayStation game based on Gosho Aoyama's Detective Conan series. The 1998 Bandai/Jorudan adventure uses improved presentation for the franchise, including voice acting, and follows Conan, Ran, and Kogoro through case-based investigation scenes. It should be presented as a licensed detective adventure built around story, clues, and character interaction rather than generic exploration.",
  },
  {
    id: "ps1-meitantei-conan-3-jin-no-meitantei",
    sourceUrl: "https://bitjumpgames.com/products/meitantei-conan-3-jin-no-meitantei-jp-playstation",
    overview:
      "Meitantei Conan: 3-Jin no Meitantei is a Japan-only Detective Conan adventure focused on three separate mystery scenarios. Store and database descriptions emphasize interviewing witnesses, examining crime scenes, gathering evidence, and identifying culprits through visual-novel-style investigation. GCX should surface it as a case-solving anime license for import players, not just another vague adventure entry.",
  },
  {
    id: "ps1-meitantei-conan-saikou-no-aibou",
    sourceUrl: "https://giantbomb.com/wiki/Games/Meitantei_Conan_Saikou_no_Aibou",
    overview:
      "Meitantei Conan: Saikou no Aibou continues the PlayStation Detective Conan formula with point-and-click-style investigation. Giant Bomb's game page describes progression around talking to characters, collecting evidence, examining scenes for clues, and solving puzzles or minigames tied to the cases. Its value on GCX is as a later PS1 Conan mystery release from Bandai and KID, aimed squarely at fans of the anime.",
  },
  {
    id: "ps1-meitantei-conan-the-board-game",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/135324-simple-character-2000-series-vol-11-meitantei-conan-the-board-game",
    overview:
      "Meitantei Conan: The Board Game, also listed as Simple Character 2000 Series Vol. 11, turns the Detective Conan license into a multiplayer board-game format. LaunchBox notes playable characters including Shinichi Kudo, Genta, Ayumi, Mitsuhiko, and Ai Haibara, plus four-player versus support and minigames. It should sit beside anime board-game curiosities in the PS1 library rather than standard mystery adventures.",
  },
  {
    id: "ps1-meitantei-conan-trick-trick-vol-1",
    sourceUrl: "https://it.wikipedia.org/wiki/Meitantei_Conan_-_Trick_Trick_Vol._1",
    overview:
      "Meitantei Conan: Trick Trick Vol. 1 is a late PlayStation Detective Conan quiz-and-mystery release from Bandai and Kamui. Unlike the earlier investigation adventures, it presents Conan with a long run of case questions and puzzle-style prompts, with some minigame elements mixed in. GCX should position it as a trivia/mystery spin-off for fans who want Conan deduction challenges rather than a full adventure campaign.",
  },
  {
    id: "ps1-melty-lancer-ginga-shoujo-keisatsu-2086",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00282.html",
    overview:
      "Melty Lancer: Ginga Shoujo Keisatsu 2086 is the first PlayStation entry in Tenky and Imagineer's futuristic Galaxy Police series. PlayStation Datacenter describes it as a mix of simulation adventure and tactical RPG: players talk with the Melty Lancer heroines, make choices that influence progression, and pause tactical battles to issue orders. It is not simply a visual novel; it blends character interaction with squad-style sci-fi combat.",
  },
  {
    id: "ps1-melty-lancer-re-inforce",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01147.html",
    overview:
      "Melty Lancer: Re-inforce is the two-disc sequel to Ginga Shoujo Keisatsu 2086. It keeps the series' simulation-adventure structure and tactical RPG battles, then continues the futuristic city/Galaxy Police setup with Sylvie and the Melty Lancer team. PlayStation Datacenter also notes an OVA preview, making this a useful GCX entry for collectors tracking anime-linked PS1 releases with both game and media tie-in value.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on specialist database, platform-history, game database, and article sources.",
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
