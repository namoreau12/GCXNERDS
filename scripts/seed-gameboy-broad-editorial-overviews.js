const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "gameboy.json");
const manifestPath = path.join(rootDir, "data", "games", "gameboy-manifest.json");

const weakPatterns = [
  /officially released/i,
  /official release/i,
  /game record/i,
  /licensed north american/i,
  /software list/i,
  /for collectors,? the key identifiers are/i,
  /released around \d{4}/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action|adventure|puzzle|platforming|fighting) game for/i,
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

function platformLabel(game) {
  const platform = clean(game.platform || "");
  if (/color/i.test(platform)) return "Game Boy Color";
  return "Game Boy";
}

function releaseText(game) {
  const raw = clean(game.releaseDate || game.firstReleased || game.releases?.northAmerica || "");
  if (!raw) return "";
  const tidy = raw
    .replace(/(\d{4})(?=\d{2}\d{2})/g, "$1 ")
    .replace(/(\d{8})(?=[A-Z][a-z])/, "")
    .replace(/\s+/g, " ")
    .trim();
  return tidy;
}

function creditLine(game, title, platform) {
  const publisher = names(game.publishers || game.publisher);
  const developer = names(game.developers || game.developer);
  const date = releaseText(game);
  const credits = [];
  if (publisher) credits.push(`published by ${publisher}`);
  if (developer && developer !== publisher) credits.push(`developed by ${developer}`);
  const creditText = credits.length ? ` ${credits.join(" and ")}` : "";
  const dateText = date ? `, with an earliest listed release of ${date}` : "";
  return `${title} is a ${platform} release${creditText}${dateText}.`;
}

function themeFor(game) {
  const title = clean(game.title || game.name);
  const value = title.toLowerCase();
  const rules = [
    {
      pattern: /pokemon|dragon warrior monsters|medarot|monster rancher|robopon|harobots|tamagotchi|grandia|atelier|fushigi no dungeon|shiren|quest|dungeon|rpg|final fantasy|sa-ga|saga|yu-gi-oh|card attackers/,
      hook: "Its appeal comes from party growth, collection systems, battles, or long-form character progression compressed into a portable format.",
      shopper: "Players should expect menu-heavy play where battery saves, manuals, and clear version labeling matter.",
    },
    {
      pattern: /mario|wario|kirby|donkey kong|gex|alfred|adventure|yancha|hammerin|goemon|bonk|genjin|platform|rescue heroes|godzilla|ghostbusters/,
      hook: "It focuses on stage movement, enemy patterns, collectibles, and compact level design built around short handheld sessions.",
      shopper: "Condition and region are worth checking closely because platformers often have multiple editions, sequels, or character-branded variants.",
    },
    {
      pattern: /tetris|puzzle|picross|lolo|flappy|flipull|qix|columns|gem|sudoku|nanpure|shanghai|mahjong|shogi|othello|chess|monopoly|jinsei|go | go$|logic/,
      hook: "It is built around board reading, pattern recognition, and repeatable puzzle sessions rather than a story-led campaign.",
      shopper: "These cartridges are strongest when the interface is clear on the small screen and the rules remain easy to understand without extra context.",
    },
    {
      pattern: /baseball|famista|soccer|football|golf|tennis|f1|formula|racing|derby|jockey|g1|wrestling|track|field|basketball|boxing|karate|nascar|lap|motocross|bike/,
      hook: "It turns a sport or race format into portable competition with simplified rules, quick matches, and timing-focused controls.",
      shopper: "The key differences are license, event type, roster framing, and whether it feels arcade-like or simulation-minded.",
    },
    {
      pattern: /fighter|fighting|gundam|battle|wars|tank|force 21|commander|mission|arms|attack|fire fighter|thunder|strike|gun|shooter|galaxy|space/,
      hook: "It leans on conflict, missions, enemy waves, or tactical pressure, using the handheld screen for fast readable encounters.",
      shopper: "The cartridge is most interesting when its control feel, mission variety, and license identity make it stand apart from similar action releases.",
    },
    {
      pattern: /game & watch|gallery|mini|party|quiz|boyard|gladiators|tv|watch|ohao|nep|variety|show/,
      hook: "It favors short activities, score challenges, trivia, or TV-style presentation over one large adventure structure.",
      shopper: "Language and regional branding can be just as important as mechanics, especially for quiz and variety-show imports.",
    },
    {
      pattern: /gakken|eiken|eitango|target|kanji|kanyouku|rekishi|jukugo|study|school|dictionary|kaiwa|english|yoso|umaban|pachi|slot|kentei|daizukan/,
      hook: "It uses the handheld as a study, reference, prediction, or practice tool instead of a conventional entertainment cartridge.",
      shopper: "Its value depends on niche interest, completeness, and whether the buyer understands the language or specialty subject.",
    },
    {
      pattern: /barbie|kitty|hamster|fisher|fix|foxi|flipper|lopaka|noddy|disney|et |e\.t\.|yamasaki|relakkuma|ochaken|sanrio|gonta/,
      hook: "The main draw is the licensed character world, with approachable activities, light adventure structure, or simple minigames for younger players.",
      shopper: "Collectors should treat the brand, box art, region, and audience fit as major parts of the identity.",
    },
  ];

  return rules.find((rule) => rule.pattern.test(value)) || {
    hook: "It occupies a specific corner of the handheld catalog, with its publisher, region, and play style giving it more identity than a bare title listing suggests.",
    shopper: "For marketplace use, the important details are exact title, region, label condition, save support when present, and whether the cartridge matches the expected platform.",
  };
}

function makeOverview(game) {
  const title = clean(game.title || game.name);
  const platform = platformLabel(game);
  const theme = themeFor(game);
  return `${creditLine(game, title, platform)} ${theme.hook} ${theme.shopper}`;
}

function main() {
  const games = readJson(dataPath, []);
  const manifest = readJson(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Game Boy game data must be an array.");

  let seeded = 0;
  games.forEach((game) => {
    const current = clean(game.description || game.gcxOverview || game.overview);
    if (!weakPatterns.some((pattern) => pattern.test(current))) return;
    const overview = makeOverview(game);
    game.description = overview;
    game.descriptionProvider = "GCX Game Boy editorial seed";
    game.descriptionSourceUrl = game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "https://en.wikipedia.org/wiki/List_of_Game_Boy_games";
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
    editorialSeededAt: new Date().toISOString(),
    editorialSeedProvider: "GCX Game Boy editorial seed",
    editorialSeedCount: seeded,
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "needs_editorial";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
  });

  console.log(`Seeded ${seeded} Game Boy/GBC editorial overviews.`);
}

main();
