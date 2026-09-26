const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-mikagura-minna-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-mikagura-shojo-tanteidan",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01611.html",
    overview:
      "Mikagura Shoujo Tanteidan is Human Entertainment's Taisho-era detective adventure about three young women helping investigate cases connected to detective Tokito Mikagura. Play centers on examining scenes, questioning people, and using an inference-trigger system to catch contradictions or important details. GCX should present it as a stylish mystery visual adventure with six cases and anime cutscenes, not a generic exploration game.",
  },
  {
    id: "ps1-milky-season",
    sourceUrl: "https://www.mobygames.com/game/74557/milky-season/",
    overview:
      "Milky Season is a KID-developed console-original visual novel released for PlayStation and Dreamcast, built around slice-of-life character interaction rather than PC adult-game conversion roots. Its collector interest comes from KID's late PlayStation romance catalog, the twelve-heroine structure, and its softer school-life tone. GCX should describe it as a console-native Japanese visual novel instead of a generic route-based import.",
  },
  {
    id: "ps1-million-classic",
    sourceUrl: "https://www.pricecharting.com/game/jp-playstation/million-classic",
    overview:
      "Million Classic is a Japan-only PlayStation release from Bandai and Cepia, cataloged as a simulation/puzzle-style title with a March 1999 launch. Public records are sparse, so GCX should keep the description precise: this is a niche single-disc import whose value is mostly in identification, publisher/developer attribution, and completeness rather than a well-documented mainstream gameplay hook.",
  },
  {
    id: "ps1-minakata-hakudou-toujou",
    sourceUrl: "https://gdri.smspower.org/wiki/index.php/Thinking_Rabbit",
    overview:
      "Minakata Hakudou Toujou is an Atlus-published PlayStation adventure from Thinking Rabbit, the Japanese studio best remembered for Sokoban and mystery-adventure work. Because detailed English documentation is limited, GCX should frame it cautiously as a Japan-only mystery/adventure import tied to Thinking Rabbit's detective-game lineage, not as a broad action adventure or puzzle title.",
  },
  {
    id: "ps1-minimoni-ni-naru-no-da-pyon",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-03463.html",
    overview:
      "Kids Station: MiniMoni ni Ninaru no da Pyon! is a Bandai children's variety release hosted by the MiniMoni idol group. Instead of a pure rhythm game, it mixes music, numbers, item recognition, cooking, and other simple activities, plus video segments that explain the game. GCX should label it as a licensed Kids Station educational/minigame import for MiniMoni collectors.",
  },
  {
    id: "ps1-minimoni-dice-de-pyon",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-87015.html",
    overview:
      "MiniMoni: Dice de Pyon! is Konami's PlayStation board-game/minigame release starring MiniMoni and connected to the wider Morning Musume idol world. Up to four players move around a board and trigger roughly 30 minigames, including rhythm exercises, janken, and quick animated challenges. GCX should present it as an idol-party import rather than a straightforward music game.",
  },
  {
    id: "ps1-minimoni-shaka-tto-tambourine-dapyon",
    sourceUrl: "https://segaretro.org/MiniMoni._Shakatto_Tambourine%21_Dapyon%21",
    overview:
      "MiniMoni: Shaka tto Tambourine! Dapyon! is Sega's PlayStation adaptation of the Shakatto Tambourine rhythm arcade game, rethemed around the MiniMoni pop group. It supports special tambourine-style controllers and asks players to hit and shake along to bright J-pop routines. GCX should highlight the peripheral compatibility and Samba de Amigo-like rhythm identity because that is the collectible hook.",
  },
  {
    id: "ps1-minimoni-step-up-pyon-pyon-pyon",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-87195.html",
    overview:
      "MiniMoni: Step Up Pyon Pyon Pyon is Konami's second MiniMoni PlayStation variety game, combining a sugoroku-style board mode with a large set of minigames and a dance mode compatible with Dance Dance Revolution mats. It is broader than a rhythm-only release, with party structure built around dice, cards, and idol-themed activities. GCX should separate it from Dice de Pyon and the Sega tambourine game.",
  },
  {
    id: "ps1-minna-atsumare-igo-kyoushitsu",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03554.html",
    overview:
      "Minna Atsumare! Igo Kyoushitsu is SilverStar's PlayStation Go classroom software, designed to teach the board game through situations and guided feedback. The game presents hundreds of board positions and tells players whether their moves fit the lesson, making it more of an instructional Go trainer than a competitive puzzle game. GCX should describe it as educational tabletop software for Japanese import collectors.",
  },
  {
    id: "ps1-minna-no-igo",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/152103-superlite-gold-series-minna-no-igo",
    overview:
      "Minna no Igo is Sunsoft's SuperLite Gold Series Go release for PlayStation, focused on traditional board-game play rather than campaign progression. It belongs with the console's late budget tabletop catalog, where the appeal is rule practice, AI matches, and low-cost import completeness. GCX should identify it plainly as a Go board-game title and distinguish it from the more lesson-focused Igo Kyoushitsu.",
  },
  {
    id: "ps1-minna-no-kanji-kyoushitsu-chousen-kanji-kentei",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03186.html",
    overview:
      "Minna no Kanji Kyoushitsu: Chousen!! Kanji Kentei is Dyna Corporation's kanji-study and quiz software for PlayStation, aligned around Kanji Kentei-style practice. It reportedly includes more than 20,000 questions, making it a language-learning utility rather than a normal puzzle game. GCX should mark it as Japanese educational software whose collector value comes from its exam-prep niche and practical-series identity.",
  },
  {
    id: "ps1-minna-no-mahjong",
    sourceUrl: "https://psxdatacenter.com/games/J/S/SLPM-86799.html",
    overview:
      "Minna no Mahjong is Success's SuperLite Gold Series mahjong release with learning, standard match, and versus modes. The learning mode explains history, rules, and basic tactics, while game mode offers computer opponents and versus mode supports up to four human players. GCX should present it as a riichi mahjong teaching-and-play package instead of a generic tile puzzle game.",
  },
  {
    id: "ps1-minna-no-othello",
    sourceUrl: "https://vgcollect.com/item/197807",
    overview:
      "Minna no Othello is Success's 2002 SuperLite Gold Series PlayStation version of Othello/Reversi. It is a budget tabletop release built around clean board-game play rather than story, arcade scoring, or puzzle stages. GCX should describe it as a Japan-only classic board-game entry, where the important identifiers are the Success credit, SLPM-86919 catalog number, and SuperLite Gold branding.",
  },
  {
    id: "ps1-minna-no-shiiku-kyoushitsu-kuwagata-hen",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03279.html",
    overview:
      "Minna no Shiiku Kyoushitsu: Kuwagata-hen is an insect-raising simulation about breeding stag beetles from larvae into adult specimens. Players choose from multiple beetle types, manage containers, soil, temperature, weight, and growth conditions, then examine raised insects in a picture-book style encyclopedia. GCX should foreground the educational pet-sim angle because it is far more specific than the generic simulation label.",
  },
  {
    id: "ps1-minna-no-shogi-chuukyuuhen",
    sourceUrl: "https://psxdatacenter.com/games/J/S/SLPM-87009.html",
    overview:
      "Minna no Shogi: Chuukyuuhen is Success's intermediate-level SuperLite Gold Series shogi release for PlayStation. It includes a course mode with professional guidance and a game mode for playing against computer or human opponents, making it a structured learning title rather than only a board-game shell. GCX should label it as the middle-skill entry in the three-part Minna no Shogi set.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on platform database, specialist catalog, publisher, import, and series sources.",
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
