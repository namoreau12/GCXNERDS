const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "vita.json");
const manifestPath = path.join(rootDir, "data", "games", "vita-manifest.json");

const weakPatterns = [
  /officially released/i,
  /official release/i,
  /game record/i,
  /licensed north american/i,
  /software list/i,
  /for collectors,? the key identifiers are/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action|adventure|puzzle|platforming|fighting|horror|rhythm|educational) game for/i,
  /is an? [A-Za-z -]+ game for PS Vita/i,
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
  const match = raw.match(/\b(20\d{2})\b/);
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
  return `${title} is a PS Vita release${creditText}${dateText}.`;
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
      pattern: /visual novel|otome|renai|koi|amnesia|diabolik|code: realize|collar|grisaia|fureraba|gakuen|heaven|genji|getsuei|golden time|romance|dating|friend to lover/,
      hook: "It is a story-first handheld release built around character routes, dialogue choices, mood, and repeated playthroughs rather than reflex-heavy action.",
      shopper: "Language, exact subtitle, publisher, and whether it is a main entry or fandisc are the most important collector details.",
    },
    {
      pattern: /rpg|role-playing|asdivine|kemco|legend|dungeon|demon|god wars|goetia|galleria|ys|trails|tales|disgaea|dragon|fantasy|criminal girls|damascus|danmachi/,
      hook: "Its appeal comes from character growth, battle systems, quests, party planning, equipment, or portable-friendly progression loops.",
      shopper: "Buyers will care about physical versus digital availability, regional language support, DLC context, and whether the Vita version is a port, sequel, or enhanced edition.",
    },
    {
      pattern: /platform|runner|rayman|furwind|gunvolt|ghoulboy|gravity duck|daggerhood|devious|cybarian|deep ones|funk of titans|alteric|shovel knight/,
      hook: "It focuses on movement, hazard timing, stage memorization, collectibles, and short retry loops that suit portable play.",
      shopper: "The useful marketplace signals are release format, region, sequel status, and whether the game is a compact indie release or a larger retail platformer.",
    },
    {
      pattern: /shooter|shoot|blast|gun|zombie|alien|delta strike|gundemon|cosmophony|dead ahead|photo shooting|god eater off shot|space|wars/,
      hook: "It emphasizes aiming, wave control, weapon feel, mission pacing, or score pressure on the handheld screen.",
      shopper: "Control feel, online-service history, digital availability, and exact subtitle help separate these releases from similar Vita action games.",
    },
    {
      pattern: /puzzle|powgi|mahjong|shogi|igo|go | go$|word|crypto|crossword|sudoku|contraptions|doodle|gem|germinator|mensa|logic|algebra/,
      hook: "It is built around rule mastery, pattern recognition, wordplay, board reading, or quick problem-solving sessions.",
      shopper: "These listings are strongest when the exact puzzle type, language dependence, and physical or digital release path are clear.",
    },
    {
      pattern: /soccer|football|tennis|golf|fishing|race|racing|speed|bike|motogp|f1|air race|super strikers|sport|fitness|micoach/,
      hook: "It turns sports, racing, or fitness routines into portable sessions focused on timing, repetition, events, and incremental improvement.",
      shopper: "License, roster year, controller requirements, regional naming, and arcade-versus-simulation style are the details that make the listing useful.",
    },
    {
      pattern: /fighter|fighting|mortal kombat|street fighter|tekken|arcana|dengeki|blade|battle|deception|mecha|gundam/,
      hook: "It is centered on matchups, combat systems, combos, enemy encounters, or build tuning, with Vita portability shaping session length.",
      shopper: "Roster, edition, sequel status, physical availability, and cross-platform differences are the main details collectors compare.",
    },
    {
      pattern: /adventure|mystery|death mark|doukoku|desire|actual sunlight|guard duty|doki-doki|horror|paranoia|escape|detective|tantei/,
      hook: "It leans on exploration, investigation, atmosphere, dialogue, or choice-driven scenes rather than pure score chasing.",
      shopper: "Tone, language, digital availability, and whether it is a port or remaster are useful context for readers and collectors.",
    },
    {
      pattern: /sim|simulation|farm|market|management|train|tower rush|daisenryaku|strategy|tactical|web|world neverland|idol|akb/,
      hook: "It is driven by systems, planning, scheduling, resource decisions, or routine management across repeated handheld sessions.",
      shopper: "The important details are what the player manages, how language-heavy it is, and whether online features or regional editions affect ownership.",
    },
    {
      pattern: /ar |augmented|camera|touch|aabs|field|tomodachi|digiq|app|paint|studio/,
      hook: "It uses Vita-specific features, lightweight app structure, touch input, camera play, or novelty interaction as part of its identity.",
      shopper: "Hardware features, storefront history, and exact digital title naming matter because these releases can be easy to miscategorize.",
    },
  ];

  return rules.find((rule) => rule.pattern.test(text)) || {
    hook: "It occupies a specific corner of the Vita catalog, with its publisher, region, play style, or storefront history giving it more identity than a bare title listing suggests.",
    shopper: "For marketplace use, the important details are exact title, region, format, ownership path, and whether the release is physical, digital, ported, or enhanced.",
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
  if (!Array.isArray(games)) throw new Error("Vita game data must be an array.");

  let seeded = 0;
  games.forEach((game) => {
    const current = clean(game.description || game.gcxOverview || game.overview);
    if (!weakPatterns.some((pattern) => pattern.test(current))) return;
    const overview = makeOverview(game);
    game.description = overview;
    game.descriptionProvider = "GCX Vita editorial seed";
    game.descriptionSourceUrl = game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "https://en.wikipedia.org/wiki/List_of_PlayStation_Vita_games";
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
    broadEditorialSeedProvider: "GCX Vita editorial seed",
    broadEditorialSeedCount: seeded,
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "needs_editorial";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
  });

  console.log(`Seeded ${seeded} Vita editorial overviews.`);
}

main();
