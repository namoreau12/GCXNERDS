const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-kujibiki-kyokara-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-kujibiki-unbalance-kaicho-onegai-smash-fight",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25729.html",
    overview:
      "Kujibiki Unbalance: Kaicho Onegai Smash Fight adapts the 2006 Kujibiki Unbalance anime into a mission-based dungeon action game. Each short dungeon is generated as the player explores, with the goal of finding a key, defeating enemies through beat-em-up combat, and reaching the exit alongside two female partners. It is more of a compact anime-license action roguelite than a traditional sports or school-adventure game.",
  },
  {
    id: "ps2-kuma-uta",
    sourceUrl: "https://www.mobygames.com/game/12012/kuma-uta/",
    overview:
      "Kuma Uta is one of Sony's strangest Japan-only PS2 experiments: a music simulation about a polar bear from outer space trying to become an enka singer. The bear asks the player questions, uses the answers to generate lyrics, and then performs the resulting song. Players can adjust phrases and compose in Japanese text, so the game works as a lyric-building comedy toy rather than a rhythm-action challenge.",
  },
  {
    id: "ps2-kuon-no-kizuna-sairinsho",
    sourceUrl: "https://www.honestgamers.com/45226/playstation-2/kuon-no-kizuna-sairinsho/game.html",
    overview:
      "Kuon no Kizuna: Sairinsho is FOG's PS2 edition of its Japanese occult adventure series. It is a multi-scenario story game built around reincarnation, supernatural ties, and character routes instead of combat-driven horror. Players should expect a text-heavy adventure with branching narrative emphasis, making the title most relevant to import collectors who follow FOG's visual-novel and adventure catalog.",
  },
  {
    id: "ps2-kurogane-no-houkou-warship-commander",
    sourceUrl: "https://en.wikipedia.org/wiki/Naval_Ops:_Commander",
    overview:
      "Kurogane no Houkou: Warship Commander is part of Koei's naval-combat simulation line that later became associated with the Naval Ops name overseas. The player commands an individual warship, works through mission-based sea battles, and deals with World War II-era vessels mixed with more speculative technology. Its appeal is strategic ship command and naval progression rather than arcade flight or simple shooting.",
  },
  {
    id: "ps2-kuryuu-youma-gakuenki-recharge",
    sourceUrl: "https://en.wikipedia.org/wiki/Kowloon_High-School_Chronicle",
    overview:
      "Kuryuu Youma Gakuenki Recharge is Atlus's enhanced PS2 version of Kowloon Youma Gakuenki. It keeps the original's mix of school-life visual novel scenes, emotion-wheel conversations, item crafting, puzzles, and first-person dungeon exploration beneath a school, then adds extra scenarios, epilogues, quest clients, and an infinite dungeon. For collectors, Recharge is the fuller version of the cult treasure-hunting adventure RPG.",
  },
  {
    id: "ps2-kuusen-ii",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-62413.html",
    overview:
      "Kuusen II is Kadokawa's second PS2 flight-combat simulation entry from developer Opera House. The game puts players into the cockpit of World War II-era aircraft, including Japanese fighters, with new missions, improved radar, updated controls, and more detailed plane graphics. It belongs beside import flight sims and military-aircraft games rather than broad arcade shooters.",
  },
  {
    id: "ps2-kyo-kara-maoh-hajimari-no-tabi",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25663.html",
    overview:
      "Kyo Kara Maoh! Hajimari no Tabi is a Namco Bandai adventure RPG based on the fantasy anime and light-novel series. The adventure sections use visual-novel-style conversations and choices, while the RPG sections shift into turn-based battles with attack and defense options. The package also had a premium edition with a drama CD and booklet, making it a fan-focused import release as much as a stand-alone RPG.",
  },
  {
    id: "ps2-kyo-kara-maoh-shin-makoku-no-kyuujitsu",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25801.html",
    overview:
      "Kyo Kara Maoh! Shin Makoku no Kyuujitsu is the follow-up PS2 game for Kyo Kara Maoh fans. Set after the anime's major magical-box conflict, it follows Yuuri and the demon kingdom during a fragile peace that quickly begins to unravel. The game is structured around character story material and adventure presentation, with a limited box release that included figures, a script book, and a drama CD.",
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
    if (!game) throw new Error(`Missing PS2 game ${rewrite.id}`);
    rows.push([
      "ps2",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on specialist catalog, database, and gameplay-description sources.",
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
