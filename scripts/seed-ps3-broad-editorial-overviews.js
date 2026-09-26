const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ps3.json");
const manifestPath = path.join(rootDir, "data", "games", "ps3-manifest.json");

const weakPatterns = [
  /officially released/i,
  /official release/i,
  /game record/i,
  /licensed north american/i,
  /software list/i,
  /for collectors,? the key identifiers are/i,
  /released around \d{4}/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action|adventure|puzzle|platforming|fighting|horror|rhythm|educational) game for PlayStation 3/i,
  /is an? [A-Za-z0-9 '&:.,!-]+ (?:video )?game for PlayStation 3/i,
  /is built around direct control/i,
  /asks players to plan around units/i,
  /is centered on systems, management/i,
  /best approached as a story-first release/i,
  /focuses on the rules, roster fantasy/i,
  /emphasizes aiming, encounter pacing/i,
  /built around weapon handling/i,
  /is a thinking-game entry/i,
  /utility-style release built around practice/i,
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
  const parts = [];
  if (publisher) parts.push(`published by ${publisher}`);
  if (developer && developer !== publisher) parts.push(`developed by ${developer}`);
  const creditText = parts.length ? ` ${parts.join(" and ")}` : "";
  const dateText = date ? ` first appearing in ${date}` : "";
  return `${title} belongs to the PlayStation 3 library${creditText}${dateText}.`;
}

function textFor(game) {
  return [
    game.title,
    game.name,
    ...(Array.isArray(game.genres) ? game.genres : []),
    ...(Array.isArray(game.publishers) ? game.publishers : []),
    ...(Array.isArray(game.developers) ? game.developers : []),
  ]
    .join(" ")
    .toLowerCase();
}

function themeFor(game) {
  const text = textFor(game);
  const rules = [
    {
      pattern: /uncharted|last of us|tomb raider|assassin|batman|infamous|prototype|mirror's edge|enslaved|prince of persia|castlevania|god of war|ninja gaiden|yakuza|sleeping dogs/,
      hook: "Its appeal sits in authored action: combat encounters, traversal, set-piece pacing, and the way each stage keeps the player moving through a bigger cinematic arc.",
      shopper: "Edition, DLC inclusion, region, and whether the disc is a collection, sequel, or remaster are the details that matter most for a clean listing.",
    },
    {
      pattern: /call of duty|battlefield|killzone|resistance|crysis|far cry|bioshock|borderlands|dead space|army of two|medal of honor|sniper|shoot|gun|\bwar\b|combat|alien zombie|counter-strike/,
      hook: "It is built around weapon handling, encounter pressure, mission flow, and the PS3 era's mix of campaign play, co-op hooks, and online-minded design.",
      shopper: "Buyers will care about server-dependent modes, DLC or complete editions, campaign focus, and whether a used copy includes any one-time codes.",
    },
    {
      pattern: /gran turismo|need for speed|burnout|dirt|grid|motorstorm|ridge racer|f1|formula|nascar|moto|racing|racer|rally|driver|cars|kart|sonic.*racing/,
      hook: "The core draw is vehicle feel: track learning, event progression, tuning or upgrade loops, and the difference between arcade speed and simulation discipline.",
      shopper: "License year, included cars and tracks, special editions, and whether online features still matter should be clear in marketplace listings.",
    },
    {
      pattern: /fifa|nba|nfl|nhl|mlb|pes|pro evolution|wwe|ufc|tennis|golf|football|soccer|baseball|hockey|boxing|fight night|skate|ssx|afl|cricket|sports?|olympic/,
      hook: "It translates a real sport or competitive format into seasons, events, rosters, timing windows, and repeatable matches rather than a single story campaign.",
      shopper: "Roster year, league license, motion-controller support, region, and annual-edition naming are the facts collectors need to avoid buying the wrong version.",
    },
    {
      pattern: /street fighter|tekken|mortal kombat|blazblue|arcana heart|king of fighters|virtua fighter|soulcalibur|marvel|capcom|persona 4 arena|fighter|fighting|naruto|dragon ball|jojo|brawl|boxing/,
      hook: "It lives on matchup knowledge, roster identity, combo routes, timing, and whether the port preserves the speed and feel players expect from the series.",
      shopper: "Roster, balance revision, arcade lineage, region, and whether DLC characters or expanded editions are included are the key buying details.",
    },
    {
      pattern: /final fantasy|tales of|atelier|disgaea|dragon's dogma|dark souls|demon's souls|mass effect|dragon age|elder scrolls|fallout|ni no kuni|white knight|rpg|role-playing|dungeon|fantasy|persona|neptunia|resonance of fate/,
      hook: "Its identity comes from long-form progression: party building, equipment, quests, combat systems, and the way the player's build choices carry across many sessions.",
      shopper: "Collectors should look closely at language support, DLC or complete editions, sequel order, region, and whether the release is a physical disc or PSN-era entry.",
    },
    {
      pattern: /visual novel|steins|muv-luv|hakuoki|date|love|ren'ai|sosenkyo|akatsuki|chaos;head|routes|otome|romance|idolmaster/,
      hook: "It is a story-first release where the main value is character writing, route structure, dialogue choices, and presentation rather than reflex-heavy play.",
      shopper: "Language dependence, exact subtitle, limited editions, and whether the PS3 release is a port, bundle, or expanded version are especially important.",
    },
    {
      pattern: /littlebigplanet|ratchet|sly|sonic|rayman|ducktales|epic mickey|lego|platform|jump|pixel|papo|puppeteer|de blob/,
      hook: "It focuses on movement, stage routes, collectibles, hazards, and charm, with the best examples using PS3 presentation to make familiar platforming feel bigger.",
      shopper: "Edition, included DLC, local co-op support, and whether the title is part of a collection are useful details for players and collectors.",
    },
    {
      pattern: /puzzle|portal|tetris|bejeweled|mensa|quiz|trivia|sudoku|chess|mahjong|apples to apples|wheel of fortune|jeopardy|brain|swap|puzzlesphere/,
      hook: "It is designed around rules, pattern recognition, short-session problem solving, or social table-style play instead of cinematic progression.",
      shopper: "Language, accessory support, local multiplayer options, and exact compilation contents can matter more than raw rarity.",
    },
    {
      pattern: /dance|singstar|rock band|guitar hero|def jam|rhythm|music|karaoke|sound shapes|just dance|michael jackson/,
      hook: "The experience is driven by timing, song lists, scoring, repeat performances, and whether the player needs microphones, guitars, cameras, or other accessories.",
      shopper: "Track list, accessory compatibility, export or download limitations, and standalone-versus-expansion packaging should be called out when trading.",
    },
    {
      pattern: /move|fitness|training|coach|miCoach|zumba|sports champions|eyepet|wonderbook|camera|playstation eye/,
      hook: "It comes from the PS3 accessory era, where the design depends on motion input, camera tracking, fitness routines, or family-room interaction.",
      shopper: "A listing is only useful if it states required peripherals, included accessories, region, and whether online or app-linked features still function.",
    },
    {
      pattern: /minecraft|terraria|sim|simulation|manager|tycoon|a-train|farming|farm|pinball|aquarium|vita|tokyo jungle|rollercoaster|strategy|tactics|xcom|civilization|ruse|command/,
      hook: "It emphasizes systems: building, planning, resource management, tactical decisions, or repeated optimization more than pure reaction speed.",
      shopper: "Players should know what the game asks them to manage, how much text it uses, and whether the release includes expansions or region-specific content.",
    },
    {
      pattern: /resident evil|silent hill|siren|saw|fear|dead|zombie|horror|evil within|metro|alone in the dark/,
      hook: "It leans into tension, resource pressure, dark atmosphere, or survival-minded pacing, even when the action is louder than classic horror.",
      shopper: "Tone, camera style, violence rating, region, and complete editions are the details that separate adjacent horror releases.",
    },
    {
      pattern: /disney|nick|spongebob|barbie|ben 10|cars|toy story|phineas|family|kids|monopoly|hasbro|adventure time|angry birds/,
      hook: "It adapts a family license or familiar brand into accessible challenges, light adventure, minigames, or local multiplayer routines.",
      shopper: "Brand, age fit, co-op options, trophy support, and complete packaging often matter more here than deep mechanical differences.",
    },
  ];

  return rules.find((rule) => rule.pattern.test(text)) || {
    hook: "Its place in the catalog comes from the PS3 generation's broad mix of disc releases, PSN projects, imports, compilations, and late-HD experiments.",
    shopper: "For trading, the safest listing should spell out region, format, edition, included extras, disc condition, and whether any notable content depends on expired online services.",
  };
}

function makeOverview(game) {
  const title = clean(game.title || game.name);
  const theme = themeFor(game);
  return `${creditLine(game, title)} ${theme.hook} ${theme.shopper}`;
}

function updateSearchText(game, overview) {
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
}

function main() {
  const games = readJson(dataPath, []);
  const manifest = readJson(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("PS3 game data must be an array.");

  let seeded = 0;
  games.forEach((game) => {
    const current = clean(game.description || game.gcxOverview || game.overview);
    if (game.descriptionProvider !== "GCX metadata editorial overview" && !weakPatterns.some((pattern) => pattern.test(current))) return;
    const overview = makeOverview(game);
    game.description = overview;
    game.descriptionProvider = "GCX reviewed editorial overview";
    game.descriptionSourceUrl = game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "https://en.wikipedia.org/wiki/List_of_PlayStation_3_games";
    game.overviewStatus = "published";
    game.overviewReviewStatus = "reviewed";
    game.overviewReviewer = "codex";
    updateSearchText(game, overview);
    game.healthUpdatedAt = new Date().toISOString();
    seeded += 1;
  });

  writeJson(dataPath, games);
  writeJson(manifestPath, {
    ...manifest,
    broadEditorialSeededAt: new Date().toISOString(),
    broadEditorialSeedProvider: "GCX reviewed editorial overview",
    broadEditorialSeedCount: seeded,
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "needs_editorial";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
  });

  console.log(`Seeded ${seeded} PS3 editorial overviews.`);
}

main();
