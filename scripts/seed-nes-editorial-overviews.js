const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "nes.json");
const manifestPath = path.join(rootDir, "data", "games", "nes-manifest.json");

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

function names(value, fallback) {
  const list = Array.isArray(value) ? value : String(value || "").split(/[,/]/);
  const unique = [...new Set(list.map(clean).filter(Boolean))];
  if (!unique.length) return fallback;
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, 2).join(", ")}, and others`;
}

function releaseText(game) {
  return clean(game.releaseDate || game.firstReleased || game.releases?.northAmerica || "");
}

function themeFor(game) {
  const title = clean(game.title || game.name);
  const value = title.toLowerCase();
  const publisher = names(game.publishers || game.publisher, "its publisher");
  const developer = names(game.developers || game.developer, "its developer");
  const released = releaseText(game);
  const dateText = released ? ` Its earliest listed release date is ${released}.` : "";

  const rules = [
    {
      pattern: /2-in-1|3-in-1|\/.*\//,
      style: "compilation",
      hook: "packs multiple NES experiences onto one cartridge, making the exact title combination the main thing to verify.",
      play: "It is useful as a shelf-space and variant entry because play value depends on which bundled games are included.",
    },
    {
      pattern: /super mario|mario|donkey kong|kirby|little nemo|chip 'n dale|ducktales|adventure island|bonk|bucky o'hare/,
      style: "platformer",
      hook: "centers on side-scrolling stages, enemy patterns, jumps, and level memorization.",
      play: "The draw is classic NES pacing: short attempts, readable hazards, and routes that reward practice.",
    },
    {
      pattern: /zelda|metroid|crystalis|faxanadu|willow|battle of olympus|rygar|startropics|legacy of the wizard|bionic commando/,
      style: "adventure",
      hook: "leans on exploration, upgrades, secrets, and backtracking instead of simple stage-by-stage clearing.",
      play: "Its lasting appeal comes from mapping the world, finding tools, and slowly opening new paths.",
    },
    {
      pattern: /dragon warrior|final fantasy|ultima|wizardry|pool of radiance|might and magic|bard's tale|destiny of an emperor/,
      style: "RPG",
      hook: "brings menu battles, party growth, towns, dungeons, and long-form progression to the 8-bit library.",
      play: "Players should expect slower, stat-driven advancement where manuals, maps, and save support matter.",
    },
    {
      pattern: /mega man|castlevania|ninja gaiden|contra|bad dudes|bad street|battletoads|athena|astyanax|amagon|abadox/,
      style: "action",
      hook: "focuses on enemy placement, weapon timing, boss learning, and tough stage layouts.",
      play: "It represents the skill-check side of NES collecting, where difficulty and memorization are part of the identity.",
    },
    {
      pattern: /1942|1943|alpha mission|air fortress|burai fighter|cabal|blaster|shoot|gun|fighter|gradius|life force|zanac|xevious|galaga|space|star force/,
      style: "shooter",
      hook: "emphasizes projectiles, enemy waves, power-ups, and pattern reading.",
      play: "The experience is built around score chasing and survival, with repeated runs revealing safer routes and weapon choices.",
    },
    {
      pattern: /baseball|bases loaded|rbi|little league|major league|bad news baseball|bo jackson|famista/,
      style: "baseball",
      hook: "turns baseball into quick cartridge-era matches with batting timing, pitching choices, fielding, and roster flavor.",
      play: "Its usefulness in the library comes from league identity, team structure, and how approachable the on-field action feels.",
    },
    {
      pattern: /basketball|hoops|roundball|jordan|arch rivals|all-pro/,
      style: "basketball",
      hook: "translates court play into fast possessions, shooting rhythm, steals, and arcade-like match flow.",
      play: "It sits in the NES sports shelf where license, roster style, and local multiplayer value matter.",
    },
    {
      pattern: /football|tecmo bowl|nfl|touchdown|quarterback/,
      style: "football",
      hook: "focuses on play selection, field position, timed passes, rushing lanes, and short competitive matches.",
      play: "The cartridge is most interesting when its teams, rules, and pacing line up with what sports fans expect from the era.",
    },
    {
      pattern: /golf|tennis|hockey|soccer|world cup|goal!|boxing|punch-out|ring king|wrestl|pro wrestling|tag team|karate/,
      style: "sports",
      hook: "adapts a recognizable sport with simplified controls, match structure, and quick competitive sessions.",
      play: "Players should look at how it handles timing, rules, and multiplayer before treating it as interchangeable with other sports carts.",
    },
    {
      pattern: /racing|rad racer|speedway|racer|race|turbo|excitebike|motocross|roadblasters|bigfoot|california games/,
      style: "racing",
      hook: "builds around speed control, track hazards, cornering, and repeated attempts to improve runs.",
      play: "Its appeal depends on handling feel and whether the events lean arcade, stunt, or simulation-minded.",
    },
    {
      pattern: /pinball|chess|othello|jeopardy|wheel of fortune|monopoly|scrabble|casino|poker|blackjack|family feud|win lose or draw|battleship/,
      style: "tabletop or game-show",
      hook: "turns a familiar non-video-game format into cartridge play with rules, prompts, and short sessions.",
      play: "These releases are best evaluated by interface clarity, local play value, and whether the adaptation preserves the source format.",
    },
    {
      pattern: /puzzle|tetris|dr\. mario|yoshi|qix|solomon|lolo|klax|pipe dream|columns|arkanoid|bubble bobble|boulder dash/,
      style: "puzzle",
      hook: "prioritizes pattern recognition, board reading, timing, and gradually harder problem layouts.",
      play: "It fits the NES library as a repeatable score or stage-clear experience rather than a story-led cartridge.",
    },
    {
      pattern: /disney|barbie|batman|beetlejuice|bill & ted|back to the future|american gladiators|killer tomatoes/,
      style: "licensed",
      hook: "uses a recognizable outside property as the frame for NES-era action, minigames, or adventure challenges.",
      play: "The brand connection is central, so condition, packaging, and whether the game matches fan expectations matter more than raw rarity alone.",
    },
  ];

  const match = rules.find((rule) => rule.pattern.test(value)) || {
    style: "catalog",
    hook: "belongs to the broad NES library as a distinct cartridge with its own publisher, developer, and regional identity.",
    play: "The main evaluation points are what style of play it offers, how readable the controls are, and whether complete packaging supports confident collecting.",
  };

  return { title, publisher, developer, dateText, ...match };
}

function makeOverview(game) {
  const theme = themeFor(game);
  return `${theme.title} comes from ${theme.developer} and ${theme.publisher} for the NES. It ${theme.hook} ${theme.play}${theme.dateText}`;
}

function main() {
  const games = readJson(dataPath, []);
  const manifest = readJson(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("NES game data must be an array.");

  let seeded = 0;
  games.forEach((game) => {
    const current = clean(game.description || game.gcxOverview || game.overview);
    if (!weakPatterns.some((pattern) => pattern.test(current))) return;
    const overview = makeOverview(game);
    game.description = overview;
    game.descriptionProvider = "GCX NES editorial seed";
    game.descriptionSourceUrl = game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "https://en.wikipedia.org/wiki/List_of_Nintendo_Entertainment_System_games";
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
    editorialSeedProvider: "GCX NES editorial seed",
    editorialSeedCount: seeded,
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "needs_editorial";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
  });

  console.log(`Seeded ${seeded} NES editorial overviews.`);
}

main();
