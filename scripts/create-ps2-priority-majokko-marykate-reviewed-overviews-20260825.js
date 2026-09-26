const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-majokko-marykate-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority PS2 weak-template cleanup; original GCX editorial overview based on platform databases, publisher metadata, specialist databases, retail copy, and franchise context.";

const entries = [
  {
    id: "ps2-majokko-a-la-mode",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25435.html",
    overview:
      "Majokko A La Mode is a Japan-only PS2 adventure/visual-novel release from F&C and Interchannel set around Twinkle Academy, a magic school in the Mint Kingdom. It is not just a generic route-reader: the presentation mixes magical-girl character scenes with mini-game material and school-fantasy structure. GCX should frame it as a niche import for visual-novel and bishoujo-game collectors, with the magic-school setting doing more of the identity work than action or combat.",
  },
  {
    id: "ps2-majokko-a-la-mode-ii",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/390379-majokko-a-la-mode-ii-mahou-to-ken-no-struggle",
    overview:
      "Majokko A La Mode II expands the series into a hybrid format rather than a simple strategy release. Public database summaries describe three connected parts: adventure scenes with choice points, a magic-synthesis system for creating spells, and battle sequences where those spells are used against enemies. GCX should present it as a late-PS2 import sequel for players interested in visual-novel structure blended with light RPG combat and crafting-style magic systems.",
  },
  {
    id: "ps2-major-league-baseball-2k6",
    sourceUrl: "https://en.wikipedia.org/wiki/Major_League_Baseball_2K6",
    overview:
      "Major League Baseball 2K6 is Kush Games' licensed baseball sim for the 2006 MLB season, published by 2K Sports in North America and Spike in Japan. Its value comes from official teams, player rosters, franchise-style baseball structure and the transitional moment when 2K was trying to establish its post-EA-exclusive sports lineup. GCX should treat the PS2 version as a mainstream licensed sports entry rather than a collector oddity, with interest tied to roster year, platform variant and regional publisher differences.",
  },
  {
    id: "ps2-makai-tenshou",
    sourceUrl: "https://kotaku.com/games/simple-2000-series-ultimate-vol-24-makai-tenshou",
    overview:
      "Makai Tenshou is Tamsoft and D3 Publisher's Simple 2000 Series Ultimate Vol. 24 release, a budget-line PS2 strategy/action experiment rather than a plain reflex action game. The title sits in the same low-price D3 ecosystem that produced many oddball PlayStation 2 concepts, and later appears in Simple 2000 Ultimate listings. GCX should describe it as a Japan-only Simple Series entry where the publisher line, Tamsoft credit and budget-experiment context are central to why collectors track it.",
  },
  {
    id: "ps2-maken-shao-demon-sword",
    sourceUrl: "https://en.wikipedia.org/wiki/Maken_X",
    overview:
      "Maken Shao: Demon Sword is Atlus's PlayStation 2 remake of Dreamcast cult title Maken X, rebuilt around a third-person camera while retaining the sentient-sword premise and brainjacking mechanic. Players move through 3D stages, possess compatible characters, fight with short-range attacks and improve character synchronization through combat. GCX should highlight its Megami Tensei-adjacent staff, Kazuma Kaneko visual identity and European Midas release, because it is a distinctive Atlus action RPG curiosity rather than a generic hack-and-slash.",
  },
  {
    id: "ps2-mambo",
    sourceUrl: "https://retrodetect.com/home/viewDb/180",
    overview:
      "Mambo is a Phoenix Games PAL puzzle release about guiding a trapped jungle character through maze-like stages while collecting fruit and avoiding hazards. Retail copy and gameplay footage point to turn-based movement, more than 30 stages and an escalating puzzle route-planning loop, not freeform action. GCX should present it as a budget PS2 maze-puzzle title whose collector appeal is tied to Phoenix Games' unusual PAL catalog and its simple but specific step-by-step challenge structure.",
  },
  {
    id: "ps2-mamimune-mogacho-no-print-hour",
    sourceUrl: "https://wiki.pcsx2.net/index.php?title=Mamimune_*_Mogacho_no_Print_Hour",
    overview:
      "Mamimune * Mogacho no Print Hour is an Idea Factory PS2 mini-game release built around the MamiMume Mogacho TV-anime property. The notable hook is not visual-novel route structure but themed mini-games and printable character/card output, making it feel closer to licensed novelty software than a conventional adventure. GCX should frame it as a Japan-only anime tie-in and peripheral-era curiosity, useful for collectors tracking Idea Factory's early PS2 catalog and licensed oddities.",
  },
  {
    id: "ps2-manea-sugoroku-kabukuro",
    sourceUrl: "https://www.pistik.net/videomang/manea-sugoroku-kabukuro-ps2",
    overview:
      "Manea Sugoroku: Kabukuro is an Ertain PS2 import whose title points directly at sugoroku, Japan's board-game/dice-movement tradition, with Kabukuro giving it a stock-market or money-management flavor. Public records are thin, so GCX should avoid pretending it is a conventional puzzle game and instead identify it as a late-PS2 board/finance-style import. Its interest is mostly for players cataloging Ertain's niche releases and collectors who want unusual Japanese tabletop-style software.",
  },
  {
    id: "ps2-maniac-mole",
    sourceUrl: "https://www.youtube.com/watch?v=rQZqWmQ6YbE",
    overview:
      "Maniac Mole is a PAL-exclusive Phoenix Games release built around short stage-based mole action rather than abstract puzzle menus. Gameplay footage shows simple level traversal, enemy/hazard avoidance and boss-style progression, putting it in the budget mascot-platformer/action corner of the PS2 library. GCX should describe it as a low-cost Phoenix title for PAL collectors, with value coming from publisher notoriety, regional availability and its straightforward stage-clearing structure.",
  },
  {
    id: "ps2-mar-heaven-arm-fight-dream",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66630.html",
    overview:
      "Mar Heaven: Arm Fight Dream is Konami's PS2 fighting-game adaptation of the MAR manga/anime, built around 3D battles and the series' magical ARM weapons. Modes include story, versus, training, ARM mode and ARM shop features, with a game-original labyrinth-mode episode adding material beyond simple one-off fights. GCX should present it as a Japan-only licensed arena fighter for anime-game collectors, not as an adventure game despite the story wrapper.",
  },
  {
    id: "ps2-marble-chaos",
    sourceUrl: "https://www.vgchartz.com/game/30746/marble-chaos/",
    overview:
      "Marble Chaos is a 2007 PAL puzzle release from Phoenix Games, part of the publisher's broad late-PS2 budget catalog. The core appeal is simple marble/maze-style puzzle play and short-session challenge rather than story, racing or combat depth. GCX should keep the description modest and precise: it is a European budget puzzle title, most relevant to Phoenix Games collectors and complete PAL-library builders who care about small-run, late-generation releases.",
  },
  {
    id: "ps2-margot-s-word-brain",
    sourceUrl: "https://store.steampowered.com/app/827780/Margots_Word_Brain/",
    overview:
      "Margot's Word Brain is a word-puzzle collection from Slam Games and Zoo Digital built around six challenges: Word Link, Word Mine, Hyper Text, Word Race, Word Safe and Word Search. Its Word Brain mode runs players through the puzzle set in succession and records scores for replay. GCX should describe the PS2 version as accessible vocabulary/puzzle software for casual and family play, not as a generic pattern-matching puzzle game.",
  },
  {
    id: "ps2-mark-davis-pro-bass-challenge",
    sourceUrl: "https://www.gamestop.com/video-games/retro-gaming/products/mark-davis-pro-bass-challenge---playstation-2/10031574.html",
    overview:
      "Mark Davis Pro Bass Challenge is a licensed arcade-style bass-fishing game from SIMS and Natsume built around tournament progression, practice and arcade modes. The hook is working through amateur, semi-pro and professional bass tournaments while unlocking tackle, reading seasonal/weather conditions and competing under the Mark Davis license. GCX should treat it as a fishing-sports sim with official tournament flavor and equipment progression rather than leaving it as a one-sentence sports stub.",
  },
  {
    id: "ps2-marl-de-jigsaw",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-20129.html",
    overview:
      "Marl de Jigsaw is Nippon Ichi Software's action-jigsaw spinoff of the Marl Kingdom series, using characters and illustrations from the first two Marl Kingdom games. Instead of slow solo jigsaw solving, it turns puzzle assembly into competitive play where players race to complete simplified images and can interfere with opponents. GCX should present it as a character-driven Marl Kingdom puzzle curiosity, especially interesting beside Rhapsody and other Nippon Ichi collector lines.",
  },
  {
    id: "ps2-mary-kate-and-ashley-sweet-16-licensed-to-drive",
    sourceUrl: "https://en.wikipedia.org/wiki/Mary-Kate_and_Ashley%3A_Sweet_16_%E2%80%93_Licensed_to_Drive",
    overview:
      "Mary-Kate and Ashley: Sweet 16 - Licensed to Drive is n-Space and Acclaim's party-game entry in the Olsen twins license, released for PS2 alongside GameCube and GBA versions. On PS2, players move around beach or mountain board-game regions, pick up friends and coins, then compete in mini-games; modes include Adventure, Bring It On and Arcade. GCX should describe it as a licensed Mario Party-style release for younger fans and multiplayer collectors, not as an exploration adventure.",
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
  if (missing.length) throw new Error(`Missing PS2 games: ${missing.map((entry) => entry.id).join(", ")}`);

  const rows = [
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "ps2",
        entry.id,
        game.title,
        game.description || game.overview || "",
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
  console.log(`Wrote ${entries.length} reviewed PS2 overviews to ${path.relative(rootDir, outputPath)}`);
}

main();
