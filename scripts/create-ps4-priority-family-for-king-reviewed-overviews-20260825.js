const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-family-for-king-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-family-mysteries-poisonous-promises",
    overview:
      "Family Mysteries: Poisonous Promises is a hidden-object crime adventure about a wealthy family, a dangerous inheritance, and a suspicious poisoning case. Players investigate detailed scenes, gather evidence, solve inventory puzzles, and follow a thriller-style plot through Artifex Mundi's familiar casual-adventure format. It is built for players who want a compact mystery with clear objectives, readable puzzles, and a steady trail of secrets rather than action or open exploration.",
  },
  {
    id: "ps4-farm-together",
    overview:
      "Farm Together is a relaxed farming sim designed around steady expansion, real-time crop growth, and cooperative visiting rather than strict deadlines. Players plant fields, raise animals, decorate land, unlock buildings, and gradually turn a small plot into a sprawling farm. Its main strength is low-pressure persistence: there is always something to harvest or improve, but the game is happiest when treated as a cozy routine instead of a management race.",
  },
  {
    id: "ps4-farming-simulator-15",
    overview:
      "Farming Simulator 15 brings Giants Software's equipment-heavy agricultural sim to PS4 with crop work, forestry, livestock, and machinery management. Players drive licensed tractors and harvesters, prepare fields, sell goods, and reinvest earnings into better tools and land. The appeal is practical and methodical: learning machines, planning routes, and watching a farm grow through repeated work rather than quick arcade rewards.",
  },
  {
    id: "ps4-farming-simulator-17",
    overview:
      "Farming Simulator 17 expands the series' PS4 farming loop with more vehicles, broader crop options, livestock systems, and contract-style work. Players balance field preparation, harvesting, animal care, equipment purchases, and money management across long sessions. It is best for players who enjoy simulation as routine and mastery: the reward is not a dramatic story beat, but running a cleaner, more efficient farm season after season.",
  },
  {
    id: "ps4-farming-simulator-22",
    overview:
      "Farming Simulator 22 adds seasonal cycles, new production chains, and a larger modern farming structure to the series' PS4 library. Players cultivate crops, manage livestock, operate detailed machinery, and turn harvested goods into products through connected economic systems. It is one of the deeper farming sims on the platform, built for patient players who enjoy equipment, scheduling, land growth, and the satisfaction of a well-run operation.",
  },
  {
    id: "ps4-felix-the-reaper",
    overview:
      "Felix the Reaper is a shadow-manipulation puzzle game starring a dancing agent of death who arranges fatal accidents while staying out of sunlight. Players rotate the sun, move objects, and plan routes through grid-like scenes to make each death happen correctly. Its charm comes from the contrast between dark subject matter, theatrical animation, and playful logic puzzles, giving it a very distinct personality among PS4 puzzle releases.",
  },
  {
    id: "ps4-fell-seal-arbiter-s-mark",
    overview:
      "Fell Seal: Arbiter's Mark is a tactical RPG inspired by classics like Final Fantasy Tactics, with grid battles, job classes, equipment builds, and a long campaign of political conflict. Players customize party roles, manage turn order, position units, and combine abilities across classes to shape a squad. It is one of the stronger indie tactics entries on PS4 for players who want crunchy character building and deliberate battlefield planning.",
  },
  {
    id: "ps4-fenix-furia",
    overview:
      "Fenix Furia is a high-speed precision platformer about dashing, jumping, and surviving compact levels filled with hazards. Stages are short but demanding, built around instant retries, tight timing, and learning the exact route through spikes, enemies, and moving threats. It is best for players who enjoy Super Meat Boy-style challenge design, where progress comes from rhythm, persistence, and shaving mistakes out of each attempt.",
  },
  {
    id: "ps4-feudal-alloy",
    overview:
      "Feudal Alloy is a hand-drawn metroidvania about a fish-piloted robot exploring a medieval mechanical world. Players fight enemies, find upgrades, open new paths, and manage overheating during combat and traversal. Its appeal is the unusual visual premise and classic exploration structure: a connected map, ability gates, gear improvements, and a steady push to understand how the strange machine kingdom fits together.",
  },
  {
    id: "ps4-fia-european-truck-racing-championship",
    overview:
      "FIA European Truck Racing Championship is a racing sim focused on heavy racing trucks, where braking zones, tire temperature, water-cooled brakes, and the weight of the vehicles shape every lap. It plays differently from car racing because momentum and discipline matter more than aggressive corner entry. The PS4 version is aimed at players who want a licensed motorsport niche with technical handling, championship structure, and a very specific race feel.",
  },
  {
    id: "ps4-fibbage",
    overview:
      "Fibbage is a Jackbox party game about bluffing your friends with convincing fake answers to bizarre trivia prompts. Players submit lies on phones or tablets, vote on what they think is true, and score points by fooling the room. Its magic is social: the funniest answer is not always the best one, because the goal is to sound just believable enough that someone else takes the bait.",
  },
  {
    id: "ps4-figment",
    overview:
      "Figment is a musical action-adventure set inside a surreal mindscape where courage, fear, memory, and doubt become physical places and enemies. Players solve environmental puzzles, fight nightmares, and move through hand-painted areas with songs and spoken character moments woven into the journey. It is a gentle but imaginative adventure for players who like metaphor-rich worlds, light combat, and puzzle design that serves the story's emotional tone.",
  },
  {
    id: "ps4-filthy-lucre",
    overview:
      "Filthy Lucre is a top-down stealth action game about pulling off criminal jobs with careful movement, sightlines, alarms, and takedowns. Players can sneak through guarded locations, grab valuables, and escape cleanly, or recover when a plan goes loud. Its appeal is flexible heist design: the stages are readable enough for quick attempts, but tense enough that one mistake can turn a quiet robbery into a scramble.",
  },
  {
    id: "ps4-final-horizon",
    overview:
      "Final Horizon is a compact tower-defense game about protecting colonies from alien swarms across different planets. Players place and upgrade turrets, manage limited resources, and respond to enemy waves that pressure multiple lanes and objectives. It is designed for quick strategic sessions, rewarding players who read attack patterns, use the right defenses, and adapt before the map is overwhelmed.",
  },
  {
    id: "ps4-fishing-sim-world-pro-tour",
    overview:
      "Fishing Sim World: Pro Tour builds a career structure around Dovetail's fishing simulation, with tournaments, sponsorship-style progression, equipment choices, and multiple venues. Players select rods, reels, bait, and tactics while learning how different species behave in each lake. Its pace is deliberate and sport-focused, aimed at players who enjoy patient simulation, competitive goals, and the quiet tension of landing a prized catch.",
  },
  {
    id: "ps4-five-dates",
    overview:
      "Five Dates is an FMV interactive romantic comedy about virtual dating during lockdown, with conversation choices shaping chemistry, awkward moments, and possible relationships. Players watch live-action scenes, choose responses, and see how tone, honesty, and compatibility affect each date. It is closer to an interactive film than a traditional adventure game, built for players who enjoy branching dialogue, human performances, and replaying choices to see different outcomes.",
  },
  {
    id: "ps4-five-nights-at-freddy-s-into-the-pit",
    overview:
      "Five Nights at Freddy's: Into the Pit is a story-driven horror adventure that shifts the series toward side-scrolling exploration, hiding, and puzzle solving. Players move between everyday spaces and a dangerous past connected to Freddy Fazbear's Pizza, avoiding threats while uncovering what happened. Its appeal is FNAF atmosphere in a more exploratory format, giving fans lore, tension, and chase sequences beyond the usual camera-monitor setup.",
  },
  {
    id: "ps4-flame-over",
    overview:
      "Flame Over is a firefighting roguelite where players race through burning buildings, rescue civilians, save pets, manage water supplies, and stop flames from spreading out of control. Each run is a time-pressure scramble between safety and risk, with procedural layouts keeping the rescue work unpredictable. It stands out because the enemy is the environment itself: smoke, heat, blocked paths, and bad priorities can end a run quickly.",
  },
  {
    id: "ps4-flat-heroes",
    overview:
      "Flat Heroes is a minimalist action platformer built around surviving waves of geometric hazards in clean, compact arenas. Players dash, jump, cling to walls, and thread through patterns that escalate from simple dodges into demanding reflex tests. Its spare visual style makes the action easy to read, while the challenge comes from movement precision, quick restarts, and learning how each hazard pattern wants to trap the player.",
  },
  {
    id: "ps4-flipping-death",
    overview:
      "Flipping Death is a comedic adventure from Zoink about a substitute grim reaper who can flip between the worlds of the living and the dead. Players possess characters, manipulate their actions, and solve puzzles by using each person's quirks to affect the town. It has the spirit of a cartoon point-and-click game, with expressive art, oddball jokes, and puzzle chains built around personality rather than inventory clutter.",
  },
  {
    id: "ps4-fluster-cluck",
    overview:
      "Fluster Cluck is a chaotic party arena game where players pilot UFO-like craft, grab rivals or objects, and toss them into machinery for points. Matches are short, noisy, and built around local multiplayer confusion, with power-ups and hazards making plans fall apart quickly. It is not a deep competitive game, but it fits groups looking for quick couch-play rounds where the screen turns messy in seconds.",
  },
  {
    id: "ps4-fobia-st-dinfra-hotel",
    overview:
      "Fobia: St. Dinfra Hotel is a first-person psychological horror game set inside a decaying hotel filled with puzzles, locked rooms, and supernatural threats. Players investigate through exploration, resource management, combat encounters, and a camera mechanic that reveals hidden layers of the environment. It is aimed at survival-horror fans who enjoy backtracking, oppressive atmosphere, and piecing together a mystery room by room.",
  },
  {
    id: "ps4-football-tactics-and-glory",
    overview:
      "Football, Tactics & Glory turns soccer into a turn-based strategy game, replacing real-time dribbling with board-like positioning, passes, tackles, and shot decisions. Players manage a club, train athletes, upgrade skills, and play matches where each move can open or close a scoring chance. It is ideal for strategy fans who understand soccer shape but prefer planning, probabilities, and long-term squad building over reflex-based sports controls.",
  },
  {
    id: "ps4-for-the-king",
    overview:
      "For the King is a tabletop-inspired roguelite RPG where a small party travels across a hex map, takes quests, manages chaos, and fights turn-based battles driven by dice-like rolls. Each campaign asks players to balance exploration, equipment, healing, and risk while permanent failure stays on the table. Its charm is the blend of board-game pacing, co-op decision-making, and RPG progression in a compact fantasy adventure.",
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
      rewrite.sourceUrl || game.descriptionSourceUrl || "",
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on available platform, genre, publisher, developer, and known game identity.",
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
