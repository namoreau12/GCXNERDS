const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-bearshark-bestof-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "3ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "3ds",
    gameId: "3ds-bearshark",
    title: "BearShark",
    sourceUrl: "https://www.nintendoworldreport.com/review/34126/bearshark-nintendo-3ds",
    newOverview:
      "BearShark is a CollegeHumor tie-in turned Nintendo 3DS eShop endless runner, with Silverball Studios translating the animated short's land-and-water chase into a simple one-touch game. Players control Steve as he runs, jumps, and swims away from a bear on land and a shark in the water, with the scenery and threat changing but the survival loop staying intentionally direct. It belongs in the 3DS library as a small licensed comedy-game oddity rather than a deep platformer.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-beast-saga-saikyou-gekiotsu-coliseum",
    title: "Beast Saga: Saikyou Gekiotsu Coliseum",
    sourceUrl: "https://lunaticobscurity.blogspot.com/2017/03/beast-saga-saikyou-gekiotsu-coliseum-3ds.html",
    newOverview:
      "Beast Saga: Saikyou Gekiotsu Coliseum is a Japan-only 3DS arena fighter based on the Beast Saga toy and anime property. Battles are built around teams of animal warriors fighting in compact 3D arenas, with each character carrying different battle-point value and strength, giving matches a light team-composition layer instead of pure one-on-one brawling. For collectors, it is a niche Nippon Columbia character-action release that sits closer to toyline arena combat than a traditional fighting game.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bella-sara-2-the-magic-of-drasilmare",
    title: "Bella Sara 2: The Magic of Drasilmare",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-games/Bella-Sara-2-The-Magic-of-Drasilmare-833338.html",
    newOverview:
      "Bella Sara 2: The Magic of Drasilmare is a magical-horse adventure built around rescuing the cursed Drasilmare Tree. Players create a hero and a magic horse, explore the Bella Sara world, customize with costumes and accessories, and move through a gentle fantasy quest aimed at younger fans of the card and horse-care universe. Its 3DS value comes from being a European retail-style franchise entry where collection, customization, and light adventure matter more than challenge.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-bella-sara-the-magical-horse-adventures",
    title: "Bella Sara: The Magical Horse Adventures",
    sourceUrl: "https://kotaku.com/games/bella-sara-the-magical-horse-adventures",
    newOverview:
      "Bella Sara: The Magical Horse Adventures brings the collectible-card brand's fantasy-horse setting to 3DS as a gentle adventure and customization game. Players create a magical horse, use a large accessory pool, and move through missions focused on exploration, riding, and light timed challenges rather than demanding action. The game is most useful in the GCX index as a licensed young-audience horse adventure tied to the broader Bella Sara trading-card universe.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-best-friends-my-horse-3d",
    title: "Best Friends: My Horse 3D",
    sourceUrl: "https://www.treva-entertainment.com/english/press/my-horse-3d-eshop/",
    newOverview:
      "Best Friends: My Horse 3D is an equestrian-care and riding sim for Nintendo 3DS, aimed squarely at players who want horse ownership routines in handheld form. The loop covers choosing a breed, feeding and grooming, riding with tilt or circle-pad controls, buying gear and clothing, and taking on show-jumping courses with increasing challenge. It is not a broad sports game; its appeal is the stable-management fantasy, StreetPass foal feature, and horse-lover checklist of care, customization, and competition.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-best-of-arcade-games",
    title: "Best of Arcade Games",
    sourceUrl: "https://www.amazon.de/-/en/Best-Arcade-Games-Nintendo-3DS/dp/B00JL6KVMQ",
    newOverview:
      "Best of Arcade Games is Bigben's 3DS compilation of four familiar arcade-style formats: Brick Breaker, Bubble Buster, Air Hockey, and Tetraminos. Rather than presenting one large campaign, it packages quick-play variants around score chasing, level unlocking, and simple rule familiarity. GCX should treat it as a budget arcade collection for short sessions, especially useful to collectors because the individual eShop entries and packaged compilation can be easy to confuse.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-best-of-board-games",
    title: "Best of Board Games",
    sourceUrl: "https://www.nintendo.com/nl-be/Games/Nintendo-3DS-downloadsoftware/Best-of-Board-Games-Chess-955782.html",
    newOverview:
      "Best of Board Games is Bigben's 3DS board-game line, built around digital versions of traditional tabletop games rather than a story mode or character campaign. Entries in the line include focused releases such as Chess and Mah-jong, with one-player play and simple presentation intended for portable pick-up sessions. In the GCX library it should be framed as a traditional board-game collection/brand umbrella, not as a simulation or adventure title.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-best-of-casual-games",
    title: "Best of Casual Games",
    sourceUrl: "https://www.nintendolife.com/games/browse?title=company%3Abigben-interactive",
    newOverview:
      "Best of Casual Games is a Bigben 3DS release aimed at quick, familiar play rather than a single deep ruleset. Like the publisher's other 'Best of' handheld packages, its purpose is to gather approachable puzzle, board, or arcade-style distractions for short sessions on the 3DS. Because source detail is thin, GCX should present it conservatively as a budget casual compilation and avoid implying specific modes beyond its role in Bigben's larger 3DS casual-games catalog.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-best-of-mahjong",
    title: "Best of Mahjong",
    sourceUrl: "https://www.nintendo.com/nl-nl/Games/Nintendo-3DS-downloadsoftware/Best-of-Mahjong-943318.html",
    newOverview:
      "Best of Mahjong is a 3DS tile-matching solitaire release built around a large library of three-dimensional layouts. Nintendo's listing describes 404 different 3D Mahjong arrangements, millions of possible tile sets, and interface options designed for stylus or directional-pad play. It is best understood as a quiet puzzle collection for repeated short sessions, with customization through backgrounds and tile styles adding some personality to a familiar Mahjong-solitaire format.",
  },
  {
    platformSlug: "3ds",
    gameId: "3ds-best-of-solitaire",
    title: "Best of Solitaire",
    sourceUrl: "https://purenintendo.com/pn-review-best-of-solitaire-3ds/",
    newOverview:
      "Best of Solitaire is a 3DS card-game collection focused on breadth, offering more than 100 solitaire variations for players who already enjoy the underlying patience-card format. Its value comes from having many rule variants in one handheld package rather than from flashy presentation or a campaign structure. For GCX readers, the important distinction is that this is a dedicated solitaire collection for repeated casual play, not a single Klondike-only app.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing 3DS game record for ${gameId}`);
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
      row.platformSlug,
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority 3DS weak-template replacement with source-backed GCX editorial overview.",
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
