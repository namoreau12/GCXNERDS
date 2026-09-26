const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "3ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-anpanman-arcstyle-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority 3DS weak-template cleanup; original editorial copy based on Nintendo pages, publisher pages, specialist databases, and contemporary reviews.";

const entries = [
  {
    id: "3ds-anpanman-to-touch-de-waku-waku-training",
    sourceUrl: "https://www.honestgamers.com/52522/3ds/anpanman-to-touch-de-wakuwaku-training/game.html",
    overview:
      "Anpanman to Touch de Waku Waku Training is a Japan-only 3DS educational release for very young players, built around Bandai Namco's long-running Anpanman preschool license. The touch-screen activities frame early learning through familiar characters, voice lines, simple prompts, and age-stepped practice rather than action-game progression. Its value is as a licensed children's learning title in the Anpanman handheld line, especially for import-focused 3DS collections.",
  },
  {
    id: "3ds-aqua-moto-racing-3d",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Aqua-Moto-Racing-3D-772697.html",
    overview:
      "Aqua Moto Racing 3D is a Zordix watercraft racer about high-speed jet-ski-style racing, stunt boosts, and championship progression across ocean and beach courses. Players buy faster watercraft, work through career events, chase achievements, and can race friends through local multiplayer. It fits the 3DS eShop's compact arcade-racing lane: approachable, speed-focused, and more about track mastery than simulation depth.",
  },
  {
    id: "3ds-ar-games",
    sourceUrl: "https://www.nintendo.com/en-gb/Hardware/Nintendo-3DS-Family/Instant-Software/AR-Games-Augmented-Reality/AR-Games-Augmented-Reality-115169.html",
    overview:
      "AR Games is one of the 3DS system's defining built-in showcases, using the included question-mark AR Card to place interactive targets, creatures, and Nintendo character scenes onto a real tabletop through the camera. Its appeal is not a long campaign but the hardware trick: aiming the handheld around physical space, watching 3D objects appear over live video, and using the AR cards for quick minigames and photo play.",
  },
  {
    id: "3ds-arc-style-baseball-3d",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/ARC-STYLE-Baseball-3D-930227.html",
    overview:
      "Arc Style: Baseball 3D is Arc System Works' lightweight 3DS eShop take on baseball, with Tournament, Exhibition, and Custom modes built for quick play rather than a full licensed league. The Nintendo listing emphasizes easy controls, stereoscopic presentation, seven-team tournament play, Download Play, and local multiplayer. It is best read as a budget arcade-sports download with customization hooks, not a deep baseball sim.",
  },
  {
    id: "3ds-arc-style-free-cell",
    sourceUrl: "https://www.arcsystemworks.com/arc-system-works-3ds-super-sale-on-the-nintendo-eshop/",
    overview:
      "Arc Style: Free Cell is Arc System Works' 3DSWare version of the classic single-player card puzzle, focused on clearing tableau columns by planning moves through free cells and foundations. Its role in the library is straightforward: a cheap, portable FreeCell implementation for short sessions, save-and-return play, and repeated logic puzzles. The appeal is convenience and familiar rules rather than story, characters, or arcade spectacle.",
  },
  {
    id: "3ds-arc-style-happy-ocean",
    sourceUrl: "https://www.youtube.com/watch?v=vY3-eoUyuwQ",
    overview:
      "Arc Style: Happy Ocean is a tropical-fish monitoring simulation from Arc System Works, closer to a calm aquarium toy than a score-driven puzzle game. Players observe and maintain a colorful underwater space, making it a gentler eShop curiosity aimed at relaxation, collection, and small interactions with fish rather than competition. It stands out in the Arc Style line because its hook is atmosphere and aquarium care, not cards or sports.",
  },
  {
    id: "3ds-arc-style-jazzy-billiards-3d-professional",
    sourceUrl: "https://www.arcsystemworks.jp/arcstyle/billiards_3d/summary.html",
    overview:
      "Arc Style: Jazzy Billiards 3D Professional is Arc System Works' dedicated 3DS billiards release, designed around realistic ball behavior, varied shot input, and modes meant to support both beginners and more practiced pool players. The presentation leans on stereoscopic depth to make the table feel physical, while the game itself centers on cue control and repeatable match play. It is a compact cue-sports sim, not a character-driven sports title.",
  },
  {
    id: "3ds-arc-style-sangokushi-pinball",
    sourceUrl: "https://www.igdb.com/games/arc-style-sangokushi-pinball",
    overview:
      "Arc Style: Sangokushi Pinball turns the Romance of the Three Kingdoms setting into a pinball game rather than a traditional strategy title. The hook is battlefield-flavored table play: sending the ball through themed targets, advancing through standard mode, and tying pinball objectives to ancient-China war imagery. It is one of the stranger Arc Style downloads, valuable mainly as an oddball pinball/Three Kingdoms crossover on 3DS.",
  },
  {
    id: "3ds-arc-style-simple-mahjong-3d",
    sourceUrl: "https://www.honestgamers.com/52534/3ds/arc-style-simple-mahjong-3d/game.html",
    overview:
      "Arc Style: Simple Mahjong 3D is a Japanese mahjong release from Arc System Works for Nintendo 3DSWare. Its purpose is clear from the title: present riichi-style table play in a small downloadable package, with the 3DS screen layout handling tiles, calls, and round information. It belongs in the same practical tabletop-game lane as the Arc Style card titles, built for repeat sessions rather than narrative progression.",
  },
  {
    id: "3ds-arc-style-soccer-3d",
    sourceUrl: "https://www.arcsystemworks.jp/arcstyle/overseas/soccer/eng/",
    overview:
      "Arc Style: Soccer 3D is an easygoing soccer game that deliberately trims away detailed rules such as offside and fouls in favor of fast matches and simple controls. Its main personality comes from customization: players can rename teams, change uniforms, edit each player's features, and even place photographed faces onto team members. Local multiplayer gives it a couch-competition hook, but it remains a casual eShop sports game.",
  },
  {
    id: "3ds-arc-style-soccer-2014",
    sourceUrl: "https://nintendoeverything.com/arc-style-soccer-2014-details/",
    overview:
      "ARC STYLE: Soccer!! 2014 is a Japan-only follow-up to Arc System Works' simplified 3DS soccer formula. It keeps the series' approachable sports focus while updating the presentation and team-building angle for a new annual-style entry. The important distinction is scope: this is not a licensed international soccer simulation, but a small eShop sports title built around quick matches, customization, and casual play.",
  },
  {
    id: "3ds-arc-style-solitaire",
    sourceUrl: "https://www.arcsystemworks.jp/arcstyle/overseas/solitaire/eng/",
    overview:
      "Arc Style: Solitaire packages classic solo card play for Nintendo 3DS, with Klondike and Monte Carlo variants, optional help features, undo, hints, and the ability to save and return later. It can be played on the 3D screen or touch screen, making it a practical handheld version of familiar card rules. The appeal is clean, inexpensive solitaire access rather than the richer presentation of a themed card adventure.",
  },
  {
    id: "3ds-arc-style-spider-solitaire",
    sourceUrl: "https://fr.wikipedia.org/wiki/Liste_de_jeux_Arc_System_Works",
    overview:
      "Arc Style: Spider Solitaire is Arc System Works' 3DSWare version of the stricter Spider card-puzzle format, where the challenge comes from building same-suit sequences and managing limited move space. Compared with the regular Solitaire entry, this one is aimed at players who prefer a more demanding planning puzzle over quick Klondike rounds. It is a lean tabletop-card utility for the 3DS library, not a story-led card battler.",
  },
  {
    id: "3ds-arc-style-women-s-football-3d",
    sourceUrl: "https://fr.wikipedia.org/wiki/Liste_de_jeux_Arc_System_Works",
    overview:
      "Arc Style: Women's Football 3D applies the Arc Style casual-soccer template to women's teams on Nintendo 3DS. Like Soccer 3D, it is best understood as simplified arcade football with quick matches and accessible controls rather than a licensed management or league simulation. Its collector interest comes from being a niche Arc System Works eShop sports variant in a line full of small downloadable experiments.",
  },
  {
    id: "3ds-arcade-classics-3d",
    sourceUrl: "https://purenintendo.com/pn-review-arcade-classics-3d/",
    overview:
      "Arcade Classics 3D is a low-price Enjoy Gaming collection of six arcade-inspired minigames, including takes on gem matching, brick breaking, asteroid shooting, bubble popping, falling blocks, and column swapping. The package is more about quantity and old-school references than preservation of official arcade originals. For 3DS players, it works as a budget sampler of familiar arcade formats with stereoscopic presentation and uneven execution.",
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
  if (missing.length) throw new Error(`Missing 3DS games: ${missing.map((entry) => entry.id).join(", ")}`);

  const rows = [
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "3ds",
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
  console.log(`Wrote ${entries.length} reviewed 3DS overviews to ${path.relative(rootDir, outputPath)}`);
}

main();
