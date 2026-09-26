const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-natsuiro-neppachi-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps2.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ps2-natsuiro-komachi",
    title: "Natsuiro Komachi",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65356.html",
    newOverview:
      "Natsuiro Komachi is PrincessSoft's PlayStation 2 version of a PC romance adventure, set around Tomoya Nakata, a swimming-club student in a small seaside town. PSX DataCenter describes a first-person, 2D anime-style romance game with added CG, scenario improvements, and production fixes for the console release. GCX should present it as a summer seaside visual novel import built around childhood friends, school-club relationships, and PrincessSoft's console-port specialty.",
  },
  {
    gameId: "ps2-natsuiro-hoshikuzu-no-memory",
    title: "Natsuiro: Hoshikuzu no Memory",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65786.html",
    newOverview:
      "Natsuiro: Hoshikuzu no Memory is a PrincessSoft PS2 romance adventure adapted from Actress's 2003 PC release. PSX DataCenter and later catalog summaries describe a protagonist returning to his hometown villa after his father's death, meeting four girls during a lakeside summer vacation, and gaining an enhanced console story with extra scenarios, CG sequences, and Mai Naruse's theme song. GCX should frame it as a grief-tinged summer romance VN rather than anonymous adventure software.",
  },
  {
    gameId: "ps2-natsuzora-no-monologue",
    title: "Natsuzora no Monologue",
    sourceUrl: "https://sandeian.wordpress.com/2011/01/28/otome-game-review-natsuzora-no-monologue/",
    newOverview:
      "Natsuzora no Monologue is an Idea Factory and Design Factory otome visual novel built around romance, mystery, and a time-loop premise. Otome coverage describes heroine Aoi Oogawa becoming trapped in repeating time, while later discussion centers on a strange tree and the science-club investigation into the loop's cause. GCX should describe it as a late PS2 otome mystery with strong loop-story identity, not a plain dialogue-choice romance.",
  },
  {
    gameId: "ps2-natural-2-duo-sakurairo-no-kisetsu",
    title: "Natural 2: Duo - Sakurairo no Kisetsu",
    sourceUrl: "https://www.play-asia.com/en/natural-2-duo-sakurairo-no-kisetsu-deluxe-pack/13/70gpw",
    newOverview:
      "Natural 2: Duo - Sakurairo no Kisetsu is Kadokawa Shoten's PS2 edition of F&C's Natural 2 romance-adventure material, released for Japanese systems in 2005. Retail listings identify it as a one-player PS2 adventure and note a deluxe pack with a drama CD, special CD case, and stand-up calendar, pointing to its character-goods and collector packaging appeal. GCX should position it as a console visual-novel port for fans tracking F&C's early-2000s romance catalog.",
  },
  {
    gameId: "ps2-negima-3-jikanme-koi-to-mahou-to-sekaiju-densetsu",
    title: "Negima!? 3-Jikanme ~Koi to Mahou to Sekaiju Densetsu~",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66593.html",
    newOverview:
      "Negima!? 3-Jikanme: Koi to Mahou to Sekaiju Densetsu is Konami's PS2 action-adventure entry based on Mahou Sensei Negima. PSX DataCenter describes interactive adventure scenes plus 3D action sequences where Negi teams with students to trigger special attacks tied to each girl's abilities, with anime voice actors performing the dialogue. GCX should present it as the action-heavy Negima PS2 chapter set around protecting Mahora Academy before the festival.",
  },
  {
    gameId: "ps2-negima-dream-tactic-yumemiru-otome-princess",
    title: "Negima!? Dream Tactic Yumemiru Otome Princess",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/128795-negima-dream-tactic-yumemiru-otome-princess",
    newOverview:
      "Negima!? Dream Tactic Yumemiru Otome Princess shifts Konami's PS2 Negima line toward turn-based strategy. LaunchBox and HonestGamers list the April 2007 Japanese release as a Konami strategy title, with the premise placing the girls in a dreamland where they must escape through tactical battles. GCX should distinguish it from the 3D-action 3-Jikanme game as the dream-world tactics entry for Negima collectors.",
  },
  {
    gameId: "ps2-neo-angelique",
    title: "Neo Angelique",
    sourceUrl: "https://en.wikipedia.org/wiki/Angelique_(video_game_series)",
    newOverview:
      "Neo Angelique is Koei and Ruby Party's PS2-era reinvention of the Angelique/Neo Romance lineage, centered on the continent of Arcadia rather than the original queen-candidate setup. Angelique series documentation identifies Neo Angelique as the fourth Neo Romance series and notes that it is distinct from the earlier Angelique line while sharing distant-world connections. GCX should describe it as a major otome RPG/dating-sim branch for PS2 collectors following Koei's women-led romance-game history.",
  },
  {
    gameId: "ps2-neo-angelique-full-voice",
    title: "Neo Angelique Full Voice",
    sourceUrl: "https://en.wikipedia.org/wiki/Angelique_(video_game_series)",
    newOverview:
      "Neo Angelique Full Voice is the enhanced PS2 release of Koei's Neo Angelique, aimed at players who wanted the Arcadia-set otome adventure with expanded voice presentation. Because Neo Angelique is a separate Neo Romance branch from the original Angelique series, the Full Voice edition matters as a more complete console version of that specific cast and setting. GCX should flag it as the preferred PS2 variant for collectors who care about voice acting and Ruby Party otome releases.",
  },
  {
    gameId: "ps2-neo-atlas-iii",
    title: "Neo Atlas III",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25016.html",
    newOverview:
      "Neo Atlas III is Artdink's PlayStation 2 continuation of the exploration and world-map strategy series that began on earlier Japanese computers and PlayStation. PSX DataCenter describes an Age of Sail premise where ships, winds, icons, defined characters, and a stylized world map support a discovery-focused play loop. GCX should describe it as a cartography-and-trade strategy import where the fantasy of confirming the shape of the world matters more than combat.",
  },
  {
    gameId: "ps2-neppachi-gold-cr-monster-mansion",
    title: "Neppachi Gold: CR Monster Mansion",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_(L%E2%80%93Z)",
    newOverview:
      "Neppachi Gold: CR Monster Mansion is a Daikoku Denki PS2 pachinko simulation built around the CR Monster Mansion parlor machine rather than a casino compilation. Its collector interest comes from faithfully preserving a specific Japanese pachinko cabinet experience on home console, including the repeated ball-launching, payout, and presentation rhythms that define CR-machine software. GCX should categorize it as a narrow pachinko import for parlor-game collectors, not a broad gambling release.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing PS2 game record for ${gameId}`);
  return game.description || game.gcxOverview || game.overview || "";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const header = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];
const csv = [
  header.join(","),
  ...rows.map((row) =>
    [
      "ps2",
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority PS2 weak-template replacement with source-backed GCX editorial overview.",
      row.newOverview,
      "approved",
      "GCX Editorial",
    ]
      .map(csvCell)
      .join(",")
  ),
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rowCount: rows.length }, null, 2));
