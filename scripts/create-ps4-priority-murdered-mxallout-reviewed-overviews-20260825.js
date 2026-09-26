const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-murdered-mxallout-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-murdered-soul-suspect",
    sourceUrl: "https://www.square-enix-games.com/en_EU/news/murdered-soul-suspect-what-we-know-so-far",
    overview:
      "Murdered: Soul Suspect is a supernatural detective thriller from Airtight Games and Square Enix where Salem police detective Ronan O'Connor investigates his own murder after becoming a ghost. The PS4 version is built around clue gathering, possessing people, walking through walls, reading memories, avoiding demons, and chasing the Bell Killer through a fictionalized Salem. GCX should present it as a mystery-adventure oddity with a strong premise and collector interest tied to its short-lived developer and cross-generation physical release.",
  },
  {
    id: "ps4-mushroom-heroes",
    sourceUrl: "https://hiddentrap.com/games/mushroom-heroes/",
    overview:
      "Mushroom Heroes is a retro puzzle-platformer from Serkan Bakar and Hidden Trap about three mushroom characters with different abilities. Players switch between the trio to clear obstacles, solve stage layouts, and move through 8-bit and SNES-inspired environments. GCX should frame it as a small, single-player indie built around character-swapping puzzles rather than speedrunning spectacle, with its PS4 appeal mostly in budget platforming and digital-library completion.",
  },
  {
    id: "ps4-musicus",
    sourceUrl: "https://play.asia/blog/2021/12/13/musicus-for-ps4-switch-available-for-pre-order-now/",
    overview:
      "Musicus! is a Japanese visual novel from Overdrive and Entergram about music, adulthood, creative compromise, and the people surrounding a young musician's life. The PS4 release brought Overdrive's final visual novel to console in Japan after its PC debut, making it notable for import collectors and fans of band-focused story games. GCX should describe it as a longform, choice-light narrative work where the draw is character writing and music-scene drama rather than route-heavy gameplay systems.",
  },
  {
    id: "ps4-mutant-mudds-deluxe",
    sourceUrl: "https://store.playstation.com/en-us/product/UP0884-CUSA06432_00-MUTANTMUPS4PSNUS",
    overview:
      "Mutant Mudds Deluxe is Renegade Kid's enhanced retro platformer about Max fighting muddy invaders with a water cannon and hover pack. Its signature trick is layered level design: launch pads send the player between foreground, middle, and background planes while stages hide Water Sprites, diamonds, and tougher secret worlds. GCX should position the PS4 version as a sharp, 1080p indie platformer for players who enjoy precise jumps, old-school challenge, and completionist collectible routes.",
  },
  {
    id: "ps4-mutant-mudds-super-challenge",
    sourceUrl: "https://en.wikipedia.org/wiki/Mutant_Mudds",
    overview:
      "Mutant Mudds Super Challenge is the harder follow-up to Mutant Mudds, taking Max back through precision platforming stages built around jetpack hovering, water-gun shooting, layered foreground/background movement, and hidden collectibles. It plays less like a reinvention and more like an expert-mode sequel for people who already know the first game's rhythm. GCX should separate it from Deluxe as the tougher companion release, valuable to collectors because both games form the full PS4 Mutant Mudds pair.",
  },
  {
    id: "ps4-mx-nitro",
    sourceUrl: "https://www.gamereactor.eu/mx-nitro/",
    overview:
      "MX Nitro is Saber Interactive and Miniclip's side-view motocross racer where leaning, landing angles, tricks, and nitro boosts matter as much as raw speed. It borrows the repeated-run learning curve of stunt racers: players read ramps, squeeze in aerial tricks, manage boost, and retry courses until the route clicks. GCX should describe it as a budget motocross stunt-racer rather than a full sim, with appeal for players who like Trials-style course mastery.",
  },
  {
    id: "ps4-mx-nitro-unleashed",
    sourceUrl: "https://store.playstation.com/en-us/product/UP2746-CUSA13366_00-MXNITROUNLEASHUS",
    overview:
      "MX Nitro: Unleashed expands the original MX Nitro with new tracks, bosses, outfits, reworked levels, and urban environments such as streets and subway spaces. The PS4 release still focuses on side-view motocross, 55 tricks, nitro boosts, ramps, obstacles, and boss races, but it is the fuller version of Saber Interactive's stunt-racing formula. GCX should point collectors to Unleashed as the improved edition rather than treating it as a duplicate of the original.",
  },
  {
    id: "ps4-mx-vs-atv-all-out",
    sourceUrl: "https://store.playstation.com/de-de/product/EP4389-CUSA06877_00-MXVSATVNEXTEU001",
    overview:
      "MX vs ATV All Out is Rainbow Studios and THQ Nordic's PS4 off-road racer built around motocross bikes, ATVs, UTVs, freestyle events, Supercross-style tracks, and open practice compounds. Players tune vehicles, learn clutch and body-weight control, perform stunts, and move between events that mix racing and trick-focused competition. GCX should present it as the eighth-generation continuation of the MX vs ATV series, distinct from smaller stunt racers because it covers multiple vehicle classes and broader off-road progression.",
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
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    rows.push([
      "ps4",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on official/store pages and reputable game references where official current English pages were unavailable.",
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
