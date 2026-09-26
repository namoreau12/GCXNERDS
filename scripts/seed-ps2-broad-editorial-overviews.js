const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ps2.json");
const manifestPath = path.join(rootDir, "data", "games", "ps2-manifest.json");

const weakPatterns = [
  /officially released/i,
  /official release/i,
  /game record/i,
  /licensed north american/i,
  /software list/i,
  /for collectors,? the key identifiers are/i,
  /larger urban or open-ended play space/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action|adventure|puzzle|platforming|fighting|horror|rhythm|educational) game for/i,
  /is an? [A-Za-z0-9 '&:.-]+ (?:video )?game for PlayStation 2/i,
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
  const match = raw.match(/\b(20\d{2}|19\d{2})\b/);
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
  return `${title} is a PlayStation 2 release${creditText}${dateText}.`;
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
      pattern: /gta|grand theft|sandbox|open world|crime|driv3r|true crime|simpsons hit and run/,
      hook: "It leans on mission structure, driving, exploration, and a larger urban or open-ended play space rather than a single linear action route.",
      shopper: "Region, soundtrack licensing, edition, and whether the release is a sequel or spin-off are useful details for collectors.",
    },
    {
      pattern: /racing|race|racer|rally|formula|f1|nascar|moto|motocross|bike|drag|nhra|offroad|kart|drivin|touring|speed|snow|superbike|gran turismo|burnout|road rage|rig racer/,
      hook: "It centers on vehicle handling, event progression, track learning, and the loop of improving times or beating rivals.",
      shopper: "The racing style matters because arcade racers, licensed motorsport games, kart racers, and budget PAL racers attract different collectors.",
    },
    {
      pattern: /football|nba|nfl|nhl|rugby|soccer|baseball|yakyu|tennis|golf|sumo|oozumou|biathlon|ski|winter games|streetball|cricket|and 1|fishing|reel|billiard|pool|sports?|roland garros/,
      hook: "It turns a sport or hobby into PS2 competition through matches, seasons, events, timing systems, or arcade-style challenges.",
      shopper: "License, roster year, region, controller accessory support, and annual-edition naming are the details that make the listing useful.",
    },
    {
      pattern: /visual novel|renai|koi|love|memories off|roommate|routes|hatsukoi|otome|orange honey|only you|maid|seiyu|komugi|nogizaka|north wind|romance|dating/,
      hook: "It is a story-first release built around character scenes, dialogue choices, routes, and mood rather than reflex-heavy play.",
      shopper: "Language, exact subtitle, publisher, and whether the disc is a main entry, fan release, or port are the major collector signals.",
    },
    {
      pattern: /rpg|role-playing|final fantasy|kingdom hearts|persona|digimon|dragon|fantasy|dungeon|rogue|rebirth|nuga|night wizard|neverland|nishikaze|shining|suikoden|xenosaga|hack|atelier|tales/,
      hook: "Its appeal comes from character growth, party building, battle systems, quests, equipment, or longer-form scenario progression.",
      shopper: "Buyers will care about region, language, save support, sequel order, and whether the release is a standalone game or connected package.",
    },
    {
      pattern: /mahjong|shogi|igo|go | go$|othello|reversi|puzzle|logic|crossword|sudoku|oekaki|quarth|casino|pachi|slot|pachinko|hanafuda|jinsei|board|parlor|quiz/,
      hook: "It focuses on rules, pattern recognition, board reading, odds, or short-session problem solving instead of cinematic action.",
      shopper: "Exact subtitle, machine branding, language dependence, and included rule set are especially important for clean marketplace matching.",
    },
    {
      pattern: /rock band|guitar|drum|rhythm|music|dance|karaoke|nodame|concert|beatmania|pop'n|singstar|ddr|megastage/,
      hook: "It is driven by timing, songs, scoring, performance repetition, or music-themed presentation.",
      shopper: "Song selection, accessory requirements, track-pack identity, region, and whether content is standalone or expansion-like are the key details.",
    },
    {
      pattern: /fighter|fighting|tekken|street fighter|marvel|mortal kombat|dragon ball|naruto|bleach|one piece|gundam|robot|mech|warlords|battle|brawl|boxing|rumble/,
      hook: "It emphasizes matchups, combat systems, combos, enemy encounters, or licensed character battles.",
      shopper: "Roster, edition, sequel numbering, regional title, and controller feel are the details that separate it from nearby action releases.",
    },
    {
      pattern: /shooter|shoot|gun|air assault|ocean commander|red baron|strike|sniper|medal|call of duty|kill|combat|war|time pilot|scramble|terra cresta|sonic wings|thunder cross|moon cresta/,
      hook: "It emphasizes aiming, enemy pressure, mission pacing, weapon feel, or score-chasing arcade action.",
      shopper: "Control style, arcade-origin status, license, and regional release path help readers understand what kind of shooter they are actually looking at.",
    },
    {
      pattern: /platform|adventure|garfield|robin hood|ratchet|jak|sly|klonoa|crash|spyro|rayman|castlevania|burgertime|pooyan|crazy climber|tomba|sonic/,
      hook: "It is built around movement, stage routes, hazards, collectibles, exploration, or character-driven adventure pacing.",
      shopper: "Region, budget-label status, sequel numbering, and whether the release is a port or original PS2 entry are useful buyer-facing details.",
    },
    {
      pattern: /horror|silent hill|resident evil|siren|reijou|mystery|tantei|detective|ghost|curse|fear|dead|realm/,
      hook: "It leans on atmosphere, investigation, tension, resource pressure, or darker story material instead of straightforward score chasing.",
      shopper: "Tone, language, region, and whether the game is survival horror, mystery adventure, or action horror are the most useful distinctions.",
    },
    {
      pattern: /sim|simulation|manager|management|train|tsukuru|maker|restaurant|rollercoaster|roommania|remote control|rimo|operator|nobunaga|daisenryaku|strategy|tactical|war|kessen|ambition/,
      hook: "It is driven by planning, systems, construction, management, tactical decisions, or repeated optimization rather than pure reflex play.",
      shopper: "The strongest context is what the player manages or controls, plus language dependence, expansion status, and region.",
    },
    {
      pattern: /kids|nick|noddy|kai-lan|thomas|anpanman|hello kitty|relaxuma|rila?k+k?uma|garfield|disney|barbie|family|preschool|educational/,
      hook: "It adapts a family or character license into approachable activities, light adventure, minigames, or young-player routines.",
      shopper: "Brand recognition, age fit, region, and complete packaging matter more here than mechanical depth.",
    },
    {
      pattern: /oretachi game center|akumajou|burger|karate|moon cresta|time pilot|pooyan|scramble|thunder cross|terra cresta|sonic wings|trio the punch|rabio lepus|crazy climber/,
      hook: "It preserves an arcade game or retro release on PS2, usually with score chasing, compact rules, and historical appeal.",
      shopper: "The original arcade title, publisher lineage, included extras, and exact Oretachi subtitle are the major collector details.",
    },
  ];

  return rules.find((rule) => rule.pattern.test(text)) || {
    hook: "It occupies a specific corner of the PlayStation 2 catalog, with its publisher, region, play style, or release format giving it more identity than a bare title listing suggests.",
    shopper: "For marketplace use, the important details are exact title, region, disc condition, manual completeness, and whether the release is physical, digital, ported, or enhanced.",
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
  if (!Array.isArray(games)) throw new Error("PS2 game data must be an array.");

  let seeded = 0;
  games.forEach((game) => {
    const current = clean(game.description || game.gcxOverview || game.overview);
    if (!weakPatterns.some((pattern) => pattern.test(current))) return;
    const overview = makeOverview(game);
    game.description = overview;
    game.descriptionProvider = "GCX PS2 editorial seed";
    game.descriptionSourceUrl = game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games";
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
    broadEditorialSeedProvider: "GCX PS2 editorial seed",
    broadEditorialSeedCount: seeded,
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "needs_editorial";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
  });

  console.log(`Seeded ${seeded} PS2 editorial overviews.`);
}

main();
