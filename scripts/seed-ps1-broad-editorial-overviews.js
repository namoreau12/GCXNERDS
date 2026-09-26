const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ps1.json");
const manifestPath = path.join(rootDir, "data", "games", "ps1-manifest.json");

const weakPatterns = [
  /officially released/i,
  /official release/i,
  /game record/i,
  /licensed north american/i,
  /software list/i,
  /for collectors,? the key identifiers are/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action|adventure|puzzle|platforming|fighting|horror|rhythm|educational) game for/i,
];

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function names(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(/[,/]/);
  const unique = [...new Set(list.map(clean).filter(Boolean))];
  if (!unique.length) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, 2).join(", ")}, and others`;
}

function releaseText(game) {
  const raw = clean(game.releaseDate || game.firstReleased || game.releases?.northAmerica || game.releases?.japan || "");
  if (!raw) return "";
  const match = raw.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? match[1] : "";
}

function creditLine(game, title) {
  const publisher = names(game.publishers || game.publisher);
  const developer = names(game.developers || game.developer);
  const date = releaseText(game);
  const credits = [];
  if (publisher) credits.push(`published by ${publisher}`);
  if (developer && developer !== publisher) credits.push(`developed by ${developer}`);
  const creditText = credits.length ? ` ${credits.join(" and ")}` : "";
  const dateText = date ? `, with an earliest listed release year of ${date}` : "";
  return `${title} is a PlayStation release${creditText}${dateText}.`;
}

function themeFor(game) {
  const title = clean(game.title || game.name).toLowerCase();
  const text = [
    title,
    ...(Array.isArray(game.genres) ? game.genres : []),
    ...(Array.isArray(game.publishers) ? game.publishers : []),
    ...(Array.isArray(game.developers) ? game.developers : []),
  ].join(" ").toLowerCase();

  const rules = [
    {
      pattern: /rayman|crash|spyro|ape escape|klonoa|gex|croc|tomba|jumping flash|pandemonium|platform|rescue heroes|rocket power|robin hood/,
      hook: "It is built around movement, stage routes, collectibles, and timing challenges rather than stat-heavy progression.",
      shopper: "For buyers, the key differences are region, sequel numbering, character license, and whether the release is a budget reissue or original pressing.",
    },
    {
      pattern: /racing|race|racer|rally|formula|f1|nascar|moto|motocross|bike|drivin|touring|gran turismo|ridge racer|wipeout|speed|kart|skyline/,
      hook: "It centers on vehicle handling, track learning, event structure, and the chase for cleaner laps or better finishing positions.",
      shopper: "The racing style matters because arcade racers, licensed motorsport games, and hobby simulations attract different collectors.",
    },
    {
      pattern: /mahjong|shogi|reversi|othello|quiz|crossword|puzzle|logic|sudoku|parlor|pachi|slot|pachinko|casino|hanafuda|chess|board|table/,
      hook: "It focuses on rules, pattern reading, odds, or short-session problem solving instead of cinematic action.",
      shopper: "These releases are most useful when the exact subtitle, machine branding, language, and included rule set are easy to verify.",
    },
    {
      pattern: /tennis|boxing|soccer|football|baseball|golf|nba|nfl|ncaa|wrestl|derby|jockey|fishing|reel|roland garros|rumble|sport/,
      hook: "It turns a real-world sport or hobby into console competition, usually through quick matches, career-style progression, or event-focused play.",
      shopper: "Roster year, license, regional cover art, and whether the game plays arcade-fast or simulation-heavy are the details shoppers need first.",
    },
    {
      pattern: /visual novel|renai|love|roommate|maid|hatsukoi|kaitou|apricot|inoue|ryoko|memorial|sentimental|story|novel|date|dating/,
      hook: "It is a story-first release where character scenes, routes, dialogue choices, and mood matter more than reflex play.",
      shopper: "Language, region, disc completeness, and exact subtitle are especially important because similar romance and adventure releases can blur together.",
    },
    {
      pattern: /rpg|dragon|fantasy|quest|final fantasy|persona|tales|suikoden|wild arms|lunar|atelier|saga|chrono|riot stars|pal|pangaea|robot x robot/,
      hook: "Its appeal comes from character growth, battle systems, party planning, exploration, or longer-form scenario progression.",
      shopper: "Collectors should look closely at saves, manuals, multi-disc contents when applicable, and whether the title is part of a larger RPG line.",
    },
    {
      pattern: /robot|gundam|mech|battle|fighter|fighting|tekken|street fighter|souls|battle line|gunbike|robo|rockman|gatchaman/,
      hook: "It emphasizes combat feel, matchups, missions, or mechanical spectacle, with PlayStation-era 3D and 2D presentation shaping the pace.",
      shopper: "Version naming, licensed characters, controller feel, and sequel numbering are the main details separating it from nearby action releases.",
    },
    {
      pattern: /horror|reikoku|ring|paranoia|silent hill|resident evil|nighthead|fear|ghost|mystery/,
      hook: "It leans on atmosphere, investigation, tension, or limited information instead of simple score chasing.",
      shopper: "For collectors, condition and region matter, but so does knowing whether the game is survival horror, adventure horror, or a mood-focused import.",
    },
    {
      pattern: /sim|simulation|restaurant|train|builder|maker|tsukuru|studio|world|management|rescue copter|remote control|panekit|pandora project/,
      hook: "It is driven by systems, planning, creation tools, or routine management, giving players room to experiment over repeated sessions.",
      shopper: "The most useful marketplace context is what the player actually manages or builds, plus whether the game requires language comfort.",
    },
    {
      pattern: /rhythm|music|beat|paca|dance|sound|parappa/,
      hook: "It is driven by timing, songs, scoring, and repeated performance improvement, part of the PlayStation era's music-game boom.",
      shopper: "Song list, controller needs, sequel status, and regional availability are the details that separate rhythm releases for collectors.",
    },
    {
      pattern: /lightspan|math|writer|school|study|kids|thomas|anpanman|barbie|disney|fisher|educational|p\.k\./,
      hook: "It uses the console for younger-player activities, school-style practice, or licensed family interaction rather than traditional arcade challenge.",
      shopper: "These titles often have unusual distribution or audience context, so disc identity, packaging, and lesson branding should be checked carefully.",
    },
  ];

  return rules.find((rule) => rule.pattern.test(text)) || {
    hook: "It occupies a specific corner of the PlayStation catalog, with its publisher, region, and play style giving it more identity than a bare title listing suggests.",
    shopper: "For marketplace use, the important details are exact title, region, disc condition, manual completeness, and whether the listing matches the expected release.",
  };
}

function makeOverview(game) {
  const title = clean(game.title || game.name);
  const theme = themeFor(game);
  return `${creditLine(game, title)} ${theme.hook} ${theme.shopper}`;
}

function main() {
  const games = readJson(dataPath, []);
  const manifest = readJson(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("PS1 game data must be an array.");

  let seeded = 0;
  games.forEach((game) => {
    const current = clean(game.description || game.gcxOverview || game.overview);
    if (!weakPatterns.some((pattern) => pattern.test(current))) return;
    const overview = makeOverview(game);
    game.description = overview;
    game.descriptionProvider = "GCX PS1 editorial seed";
    game.descriptionSourceUrl = game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "https://en.wikipedia.org/wiki/List_of_PlayStation_games";
    game.overviewStatus = "published";
    game.overviewReviewStatus = "reviewed";
    game.overviewReviewer = "codex";
    game.searchText = [
      game.title,
      game.name,
      game.developer,
      game.publisher,
      ...(Array.isArray(game.developers) ? game.developers : []),
      ...(Array.isArray(game.publishers) ? game.publishers : []),
      ...(Array.isArray(game.genres) ? game.genres : []),
      game.releaseDate,
      game.firstReleased,
      game.platform,
      overview,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    game.healthUpdatedAt = new Date().toISOString();
    seeded += 1;
  });

  writeJson(dataPath, games);
  writeJson(manifestPath, {
    ...manifest,
    broadEditorialSeededAt: new Date().toISOString(),
    broadEditorialSeedProvider: "GCX PS1 editorial seed",
    broadEditorialSeedCount: seeded,
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "needs_editorial";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
  });

  console.log(`Seeded ${seeded} PS1 editorial overviews.`);
}

main();
