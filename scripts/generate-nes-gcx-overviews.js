const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const nesPath = path.join(rootDir, "data", "games", "nes.json");
const manifestPath = path.join(rootDir, "data", "games", "nes-manifest.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function joinNames(values, fallback) {
  const names = Array.from(new Set((values || []).filter(Boolean)));
  if (!names.length) return fallback;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, 2).join(", ")}, and others`;
}

function normalize(value) {
  return String(value || "").trim();
}

function inferSeries(title) {
  const value = title.toLowerCase();
  const patterns = [
    ["Super Mario Bros.", "Mario"],
    ["Mario", "Mario"],
    ["The Legend of Zelda", "The Legend of Zelda"],
    ["Zelda", "The Legend of Zelda"],
    ["Mega Man", "Mega Man"],
    ["Castlevania", "Castlevania"],
    ["Teenage Mutant Ninja Turtles", "Teenage Mutant Ninja Turtles"],
    ["TMNT", "Teenage Mutant Ninja Turtles"],
    ["Double Dragon", "Double Dragon"],
    ["Dragon Warrior", "Dragon Quest / Dragon Warrior"],
    ["Final Fantasy", "Final Fantasy"],
    ["Ninja Gaiden", "Ninja Gaiden"],
    ["Kirby", "Kirby"],
    ["Donkey Kong", "Donkey Kong"],
    ["Pac-Man", "Pac-Man"],
    ["Tetris", "Tetris"],
    ["Bases Loaded", "Bases Loaded"],
    ["Tecmo Bowl", "Tecmo Bowl"],
  ];
  const match = patterns.find(([needle]) => value.includes(needle.toLowerCase()));
  return match ? match[1] : "";
}

function inferPlayStyle(title) {
  const value = title.toLowerCase();
  if (/2-in-1|3-in-1|\/.*\//.test(value)) return "multi-game compilation";

  const checks = [
    [/baseball|bases loaded|rbi|little league|major league|bad news baseball/, "baseball game"],
    [/basketball|hoops|roundball|jordan|arch rivals/, "basketball game"],
    [/football|tecmo bowl|nfl|touchdown|quarterback/, "football game"],
    [/golf|open tournament/, "golf game"],
    [/tennis/, "tennis game"],
    [/hockey/, "hockey game"],
    [/soccer|world cup|goal!/, "soccer game"],
    [/boxing|punch-out|ring king/, "boxing game"],
    [/racing|rad racer|speedway|racer|race|turbo|excitebike|motorcross|motocross|roadblasters/, "racing game"],
    [/pinball/, "pinball game"],
    [/chess|othello|jeopardy|wheel of fortune|monopoly|scrabble|casino|poker|blackjack|family feud|win lose or draw/, "board or game-show adaptation"],
    [/puzzle|tetris|dr\. mario|yoshi|qix|solomon|lolo|klax|pipe dream|columns|pac-attack/, "puzzle game"],
    [/dragon warrior|final fantasy|ultima|wizardry|pool of radiance|might and magic|bard's tale|destiny of an emperor|crystalis/, "role-playing game"],
    [/quest|zelda|faxanadu|willow|battle of olympus|startropics|rygar|legacy of the wizard/, "adventure game"],
    [/mega man|mario|kirby|castlevania|ninja gaiden|contra|metroid|ducktales|chip 'n dale|little nemo|bucky o'hare/, "action-platformer"],
    [/shoot|gun|blaster|fighter|1942|1943|gradius|life force|zanac|guardian legend|sky shark|twin cobra|xevious|galaga|space|star force/, "shooter"],
    [/wrestl|pro wrestling|tag team/, "wrestling game"],
  ];
  const match = checks.find(([pattern]) => pattern.test(value));
  return match ? match[1] : "";
}

function formatDate(game) {
  const date = normalize(game.releases?.northAmerica) || normalize(game.firstReleased);
  if (!date) return "at an unknown date";
  if (/\b\d{1,2},\s*\d{4}\b/.test(date)) return `on ${date}`;
  return `in ${date}`;
}

function stylePhrase(playStyle) {
  if (!playStyle) return "";
  const article = /^[aeiou]/i.test(playStyle) ? "an" : "a";
  return `${article} ${playStyle}`;
}

function seriesPhrase(series) {
  if (!series) return "";
  return series.toLowerCase().startsWith("the ") ? `${series} series` : `the ${series} series`;
}

function makeOverview(game) {
  const title = normalize(game.title);
  const publisher = joinNames(game.publishers, normalize(game.publisher) || "an unknown publisher");
  const developer = joinNames(game.developers, normalize(game.developer) || "an unknown developer");
  const date = formatDate(game);
  const series = inferSeries(title);
  const playStyle = inferPlayStyle(title);
  const releaseLine = `${title} is a licensed North American NES release published by ${publisher} and developed by ${developer}, released ${date}.`;
  const styleLine = playStyle
    ? `GCX classifies it as ${stylePhrase(playStyle)} for browsing and collector discovery.`
    : "GCX currently treats it as a cataloged NES release and will add deeper gameplay notes as editorial research expands.";
  const seriesLine = series
    ? `It belongs to ${seriesPhrase(series)}, which can make series matching, variants, and complete-in-box condition especially important for collectors.`
    : "For marketplace listings, the most important details are cartridge authenticity, label quality, region, manual/box completeness, and working condition.";

  return `${releaseLine} ${styleLine} ${seriesLine}`;
}

function main() {
  const games = readJson(nesPath);
  const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};

  games.forEach((game) => {
    game.gcxOverview = makeOverview(game);
    game.gcxOverviewProvider = "GCX original catalog overview";
  });

  writeJson(nesPath, games);
  writeJson(manifestPath, {
    ...manifest,
    gcxOverviewGeneratedAt: new Date().toISOString(),
    gcxOverviewProvider: "GCX original catalog overview",
    gcxOverviewCount: games.filter((game) => game.gcxOverview).length,
  });

  console.log(`Generated GCX overviews for ${games.filter((game) => game.gcxOverview).length}/${games.length} NES records.`);
}

main();
