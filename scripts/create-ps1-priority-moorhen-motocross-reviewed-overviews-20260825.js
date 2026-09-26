const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-moorhen-motocross-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority PS1 weak-template cleanup; original GCX editorial overview based on platform databases, specialist game databases, publisher/retail metadata, and gameplay documentation.";

const entries = [
  {
    id: "ps1-moorhen-3-chicken-chase",
    sourceUrl: "https://psxdatacenter.com/games/P/M/SLES-03846.html",
    overview:
      "Moorhen 3: Chicken Chase is the PAL PlayStation release of the Crazy Chicken/Moorhuhn arcade shooting formula. It is a score-attack game, not a platformer: players have 90 seconds to shoot passing birds and bonus targets, with the third entry adding seaside scenery, extra target rules, and score penalties that make target selection matter. GCX should frame it as a quick-session European light-gun-style curiosity for Moorhuhn collectors, with the Ubisoft/Similis release identity being the key catalog hook.",
  },
  {
    id: "ps1-moorhuhn-2",
    sourceUrl: "https://psxdatacenter.com/games/P/M/SLES-03278.html",
    overview:
      "Moorhuhn 2: Die Jagd geht Weiter brings the German Crazy Chicken phenomenon to PlayStation as a 90-second shooting-gallery score chase. The play loop is deliberately simple, but not empty: different birds and hidden scenery targets affect scoring, so strong runs come from memorizing bonus interactions instead of firing randomly. GCX should present it as a PAL import score-attack shooter and a snapshot of an early-2000s European casual-game craze.",
  },
  {
    id: "ps1-moorhuhn-kart",
    sourceUrl: "https://psxdatacenter.com/games/P/M/SLES-04122.html",
    overview:
      "Moorhuhn Kart turns the Crazy Chicken cast into a budget kart racer, with five themed locations, five playable drivers, weapons, Grand Prix racing, time trials, ghost racing, and two-player split-screen. Its appeal is not simulation depth; it is mascot-racer novelty inside the oddball Moorhuhn brand. GCX should make clear this is the PlayStation kart spinoff, separate from the timed shooting-gallery entries that made the series famous.",
  },
  {
    id: "ps1-moorhuhn-x",
    sourceUrl: "https://psxdatacenter.com/games/P/M/SLES-04174.html",
    overview:
      "Moorhuhn X is a very late PAL PlayStation entry in the Crazy Chicken shooting line, released when the platform was already deep into its budget/import afterlife. Like earlier Moorhuhn shooters, it gives players short 90-second rounds built around hitting chickens, solving hidden scoring puzzles, and chasing high-score optimization. GCX should describe it as a late-system score-attack shooter, not a platform game, and note its collector interest as one of the PlayStation's final European releases.",
  },
  {
    id: "ps1-mori-no-oukoku",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01861.html",
    overview:
      "Mori no Oukoku, also listed as Kingdom of Forest, is Asmik Ace's Japan-only tactical RPG for PlayStation. The game uses 2D character presentation and a fantasy story about a boy pulled into a forest kingdom after seeing a princess taken to a castle, then builds play around tactical encounters rather than ordinary adventure exploration. GCX should position it as a small but legitimate import strategy RPG from Asmik Ace's late-1990s PlayStation catalog.",
  },
  {
    id: "ps1-morita-kazurou-no-chess",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-02488.html",
    overview:
      "Morita Kazurou no Chess is Yuki's PlayStation chess program endorsed by board-game programmer and shogi figure Kazuro Morita. It offers a digital chess board with rule explanations, advice/commentary, multiple board and piece styles, difficulty options, and two-player versus support. GCX should treat it as part of the Morita thinking-game lineage rather than a generic puzzle release, useful for collectors tracking Japanese board-game software.",
  },
  {
    id: "ps1-morita-kazurou-no-gomokunarabe-to-renju",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-02487.html",
    overview:
      "Morita Kazurou no Gomokunarabe to Renju adapts the five-in-a-row family of board games for PlayStation under the Morita/Yuki thinking-game label. The release focuses on traditional board play, alternate board/background presentations, and two-player versus support rather than story progression. GCX should describe it as a specialist Japanese table-game title for Gomoku and Renju players, with its December 1999 Yuki release date separating it from the shogi and chess companion volumes.",
  },
  {
    id: "ps1-morita-kazurou-no-hanafuda",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/136226-morita-kazurou-no-hanafuda",
    overview:
      "Morita Kazurou no Hanafuda is the hanafuda card-game volume in Yuki's late-1999 Morita-branded PlayStation board/card-game run. It is best understood as a digital traditional-card table title, built for rule familiarity, local play, and collectors who want the full set of Morita-labeled releases. GCX should avoid presenting it as a puzzle adventure; the useful context is that it sits beside Morita's chess, gomoku/renju, mahjong, reversi, and shogi releases.",
  },
  {
    id: "ps1-morita-kazurou-no-mahjong",
    sourceUrl: "https://gamesdb.launchbox-app.com/publishers/games/9136-yuki-enterprise",
    overview:
      "Morita Kazurou no Mahjong is Yuki's PlayStation mahjong entry in the Morita-branded table-game family. Released after several December 1999 companion titles, it gives import players a focused Japanese mahjong simulation rather than a character adventure or arcade puzzler. GCX should group it with the Morita board-game catalog and make the distinction clear: this is for traditional mahjong play and collection completeness, not tile-matching puzzle action.",
  },
  {
    id: "ps1-morita-kazurou-no-reversi",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-02278.html",
    overview:
      "Morita Kazurou no Reversi is a PlayStation Reversi/Othello-style board-game program from Yuki. It supports multiple boards, piece color styles, backgrounds, six difficulty levels, and two-player versus play, making it a straightforward digital table-game package. GCX should present it as the Reversi branch of Kazuro Morita's thinking-game catalog, especially relevant to collectors because Morita was known for computer board-game software.",
  },
  {
    id: "ps1-morita-kazurou-no-shogi-dojo",
    sourceUrl: "https://www.uvlist.net/game-107488-Morita%2BKazuo%2Bno%2BShogi%2BDojo",
    overview:
      "Morita Kazurou no Shogi Dojo is Yuki's 1999 PlayStation shogi-training/table-game release tied to Kazuro Morita's long-running computer shogi legacy. The 'Dojo' framing matters: this is a focused shogi program for practicing matches and learning the game rather than a general puzzle compilation. GCX should present it as a Japan-only board-game tool for shogi players and Morita-series collectors.",
  },
  {
    id: "ps1-morita-shogi",
    sourceUrl: "https://strategywiki.org/wiki/Morita_Shogi",
    overview:
      "Morita Shogi is the PlayStation continuation of Kazuro Morita's long-running shogi software line, developed by Random House and published by Seta. Its value is in digital shogi play and AI opponent tradition rather than presentation flash, carrying forward a series associated with one of Japan's foundational computer-board-game programmers. GCX should describe it as a dedicated shogi simulation and keep it separate from Yuki's later Morita Kazurou no Shogi Dojo entry.",
  },
  {
    id: "ps1-moritaka-chisato-safari-tokyo",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-86130.html",
    overview:
      "Moritaka Chisato: Safari Tokyo is a two-disc Koei/Oracion multimedia mini-game release built around Japanese singer-songwriter Chisato Moritaka. The first disc places Moritaka inside a fantasy Tokyo safari park with music quizzes, rhythm-style activities, animal-riding and video-editing mini-games, while the second disc adds music clips and interview material. GCX should frame it as a celebrity multimedia/music mini-game import, not a conventional rhythm game.",
  },
  {
    id: "ps1-moses-prince-of-egypt",
    sourceUrl: "https://psxdatacenter.com/games/P/M/SLES-02954.html",
    overview:
      "Moses Prince of Egypt is a PAL PlayStation edutainment/adventure package from The Code Monkeys and Midas Interactive based on the biblical story of Moses. The release mixes cartoon-film presentation with jigsaw puzzles, matching exercises, and simple activities meant for young players rather than a full RPG campaign. GCX should classify it as budget religious/educational software, a useful collector oddity because its subject matter and PAL-only Midas publishing are more distinctive than its mechanics.",
  },
  {
    id: "ps1-motocross-mania-2",
    sourceUrl: "https://psxdatacenter.com/games/P/M/SLES-04098.html",
    overview:
      "Motocross Mania 2 is Gotham Games' late PlayStation motocross racer, following the first Motocross Mania with more bikes, upgraded visuals, stunt-focused racing, and three difficulty tiers with 16 courses apiece. It aims at arcade-style dirt-bike racing where jumps, tricks, turbo use, and track memorization carry the moment-to-moment feel. GCX should present it as a budget extreme-sports racer and sequel, with handling/stunt execution being the deciding factor for players rather than licensed championship authenticity.",
  },
];

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const missing = entries.filter((entry) => !byId.has(entry.id));
  if (missing.length) {
    throw new Error(`Missing PS1 games: ${missing.map((entry) => entry.id).join(", ")}`);
  }

  const rows = [
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "ps1",
        entry.id,
        game.title || game.name || "",
        game.description || game.gcxOverview || game.overview || "",
        entry.sourceUrl,
        rewriteNotes,
        entry.overview,
        "reviewed",
        "GCX editorial cleanup",
      ];
    }),
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(`Wrote ${entries.length} reviewed PS1 overviews to ${path.relative(rootDir, outputPath)}`);
}

main();
