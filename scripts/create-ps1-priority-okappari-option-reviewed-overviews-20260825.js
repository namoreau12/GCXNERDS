const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-okappari-option-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps1.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ps1-okappari-oh",
    title: "Okappari-Oh",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-01524.html",
    newOverview:
      "Okappari-Oh is a first-person bass-fishing game supervised by Japanese professional angler Hirokazu Kawabe. It lets players choose lake spots, lures, and conditions across tournament, CPU-versus, two-player versus, and free-fishing modes, with locations based on Japanese bass-fishing areas such as Kawaguchiko, Kasumigaura, Lake Biwa, and Hachirogata. Its appeal is serious lure choice and tournament structure rather than a generic sports-game wrapper.",
  },
  {
    gameId: "ps1-olympia-takasago-virtua-pachi-slot-iii",
    title: "Olympia Takasago: Virtua Pachi-Slot III",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-01386.html",
    newOverview:
      "Olympia Takasago: Virtua Pachi-Slot III is a Japanese pachi-slot simulator built around recreations of three Olympia/Takasago machines: Fruits, Nurse Fantasy, and Diana. Players can simply practice the machines in free mode or play a versus-computer mode against one of four character opponents, with zoom options used to inspect the cabinets and reels. It is best understood as a parlor-machine preservation title for pachislot collectors rather than a broad casino compilation.",
  },
  {
    gameId: "ps1-omega-assault",
    title: "Omega Assault",
    sourceUrl: "https://psxdatacenter.com/games/P/O/SLES-04051.html",
    newOverview:
      "Omega Assault is a late PAL PlayStation budget shooter from NAPS team and Phoenix Games. The player pilots a human-controlled mecha from a first-person gunsight view through 12 missions against a robot invasion, making it closer to an arcade mech shooting gallery than the loose action description in the old metadata. Collector interest comes from its unusual first-person mech presentation and its place among late-life PlayStation releases.",
  },
  {
    gameId: "ps1-omiai-commando-bakappuru-ni-tukkomi-o",
    title: "Omiai Commando: Bakappuru ni Tukkomi o",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPM-86439.html",
    newOverview:
      "Omiai Commando: Bakappuru ni Tukkomi o is a futuristic matchmaking simulation from Magical Company and Enix. Set around a marriage agency, it asks players to guide clients through dates, choose responses at the right moments, manage appearance options, and raise the couple's affection across six missions. It is a strange romance-strategy import where timing, dialogue support, and scenario management matter more than combat or traditional tactics.",
  },
  {
    gameId: "ps1-omise-de-tensyu",
    title: "Omise de Tensyu",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-01876.html",
    newOverview:
      "Omise de Tensyu is a Technosoft shopkeeper RPG about changing jobs, collecting profession cards, and opening stores around town. The game mixes classic 2D RPG movement, missions, equipment, and experience levels with a business-management layer where shops can succeed, face events such as thieves, or fail if run badly. It is an unusual late-1990s Technosoft import for players who like RPG structure folded into shop management and job-based abilities.",
  },
  {
    gameId: "ps1-omizu-no-hanamichi",
    title: "Omizu no Hanamichi",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-02815.html",
    newOverview:
      "Omizu no Hanamichi adapts the 1999 Japanese TV drama about women working as hostesses in a Roppongi club. The PlayStation version uses first-person, 2D cartoon-style presentation and a nightlife theme, with PocketStation support listed for compatible play. It is a Japan-only media-tie-in adventure/simulation whose appeal is drama adaptation, workplace atmosphere, and character context rather than a conventional visual novel route structure.",
  },
  {
    gameId: "ps1-otenki-kororin",
    title: "Otenki Kororin",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPM-87047.html",
    newOverview:
      "Otenki Kororin: Weather Tales is a weather-themed puzzle game from Takumi, the Toaplan offshoot better known for arcade shooters such as Giga Wing and Mars Matrix. The PlayStation port turns matching weather symbols into a character-driven puzzle-combat format with clay-like visual personality and Japanese menus. It is not a generic puzzle release, but a distinctive Takumi side trip from shooting games into playful competitive puzzle design.",
  },
  {
    gameId: "ps1-option-tuning-car-battle",
    title: "Option Tuning Car Battle",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-01207.html",
    newOverview:
      "Option Tuning Car Battle is the first PlayStation street-racing game tied to Japan's Option tuning-car magazine. It focuses on one-on-one urban races through traffic, rewarding wins with more car parts, upgrades, circuits, and vehicle options. It is an early tuner-culture racing import where car setup and unlocking performance parts are the core hook rather than licensed championship racing.",
  },
  {
    gameId: "ps1-option-tuning-car-battle-2",
    title: "Option Tuning Car Battle 2",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-01857.html",
    newOverview:
      "Option Tuning Car Battle 2 continues the Option magazine street-racing line with more one-on-one racing against computer rivals, traffic-heavy courses, upgrade progression, and unlockable cars and circuits. PSX DataCenter identifies arcade and challenge modes, keeping the structure close to the first game while expanding the tuner-racing loop. It is the middle entry for collectors following the PlayStation Option trilogy.",
  },
  {
    gameId: "ps1-option-tuning-car-battle-spec-r",
    title: "Option Tuning Car Battle Spec-R",
    sourceUrl: "https://psxdatacenter.com/games/J/O/SLPS-02587.html",
    newOverview:
      "Option Tuning Car Battle Spec-R is the third PlayStation entry in the Option tuning-car racing series. Like the earlier games, it centers on urban races against computer opponents, unlocking more circuits, cars, and upgrade parts as players win, but later catalog coverage also highlights its place as the final Option-branded PS1 racing entry. Spec-R is the collector endpoint of the trilogy: a Japanese tuner magazine tie-in built for modification-minded racing fans.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing PS1 game record for ${gameId}`);
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
      "ps1",
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority PS1 weak-template replacement with source-backed GCX editorial overview.",
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
