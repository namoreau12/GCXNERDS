const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-konyamo-kotetsu-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-konyamo-dorubako-2000",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-01894.html",
    overview:
      "Konyamo Dorubako!! 2000 is a Japan-only PlayStation pachinko release from Hearty Robin, tied to the TV Tokyo Dorubako program. PSXDataCenter describes the earlier Konyamo Dorubako format as a two-mode pachinko game, with a town-based battle mode against computer characters and a simulation mode for adjusting machine settings. GCX should frame this as a niche gambling/parlor import whose appeal is TV-show branding, pachinko-machine detail, and Hearty Robin catalog history rather than broad arcade action.",
  },
  {
    id: "ps1-konyamo-dorubako-2001",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-03328.html",
    overview:
      "Konyamo Dorubako!! 2001 is the later Hearty Robin PlayStation entry in the Dorubako pachinko line, with PSXDataCenter listing it as an NTSC-J gambling release dated December 13, 2001. It belongs to Japan's parlor-game side of the PS1 library: players should expect pachinko presentation, machine-focused play, and TV-program novelty rather than casino variety or action stages. For GCX, the useful collector context is its late release date, Japanese-language dependency, and role as a specialized pachinko sequel.",
  },
  {
    id: "ps1-koro-koro-post-nin",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-03479.html",
    overview:
      "Koro Koro Post Nin is a late Japan-only PlayStation action-puzzle game from Media Entertainment starring Akane, a newspaper delivery girl. PSXDataCenter describes the core goal clearly: deliver papers to every mailbox in a stage before reaching the exit, while specialist writeups compare its rotating-maze movement to Cameltry-style gravity control. GCX should present it as a quirky arcade-minded import with puzzle routing, stage hazards, and a distinctive delivery theme rather than a conventional adventure game.",
  },
  {
    id: "ps1-koshien-v",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-00729.html",
    overview:
      "Koshien V is Magical Company's first PlayStation entry in the Japanese high-school baseball Koshien series. PSXDataCenter describes it as a 3D baseball game with multiple modes, including versus and story play, while series listings place it before later PlayStation and PlayStation 2 Koshien installments. GCX should describe it as a Japan-focused baseball simulation built around the national high-school tournament identity, where the collector hook is its regional sports culture and series position rather than MLB-style licensing.",
  },
  {
    id: "ps1-kosodate-quiz-motto-my-angel",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-01885.html",
    overview:
      "Kosodate Quiz: Motto My Angel is Namco's PlayStation sequel in the child-raising quiz series. PSXDataCenter describes it as a multiple-choice trivia game where parenting-themed answers shape the child's personality, and notes additional modes beyond the classic child-raising format. GCX should frame it as a quiz/life-sim hybrid: the play is question answering, but the appeal comes from watching personality paths, life events, and playful relationship scenarios evolve from those answers.",
  },
  {
    id: "ps1-kosodate-quiz-my-angel",
    sourceUrl: "https://en.wikipedia.org/wiki/Kosodate_Quiz%3A_My_Angel",
    overview:
      "Kosodate Quiz: My Angel is Namco's PlayStation conversion of its arcade coming-of-age quiz game. The series setup casts the player as parents answering four-choice questions to raise a daughter from infancy toward adulthood, with performance influencing funds, school tests, personality events, and endings. GCX should describe it as a distinctly Japanese quiz/life-sim crossover: mechanically simple trivia, but with progression hooks that turn correct answers into a parenting-story arc.",
  },
  {
    id: "ps1-koten-tsugoshuu-shijin-no-kan",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-00159.html",
    overview:
      "Koten Tsugoshuu: Shijin no Kan, also cataloged as Koten Tsumego Shuu: Shijin no Maki, is a PlayStation go problem game from Vap. PSXDataCenter and LaunchBox describe it as a board-game release where players gain territory by solving go situations and continuing only when the correct move is found. GCX should present it as a focused tsumego-style import for board-game players, with appeal tied to go study, puzzle-like reading, and Japanese-language presentation rather than visual-novel storytelling.",
  },
  {
    id: "ps1-kotetsu-reiki-steeldom",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-00431.html",
    overview:
      "Kotetsu Reiki: Steeldom is a Technosoft PlayStation action game built around third-person arena combat with sci-fi styling. PSXDataCenter describes a 3D action game with shooting elements, eight selectable characters, and a mix of shooting, throwing, slashing, smashing, teleport-style movement, and fighting actions. GCX should position it as an unusual Technosoft arena-action import, notable for its character roster, hybrid melee/ranged combat, and futuristic presentation rather than generic stage action.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on catalog and specialist gameplay sources.",
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
