const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-endless-family-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-endless-dungeon",
    overview:
      "Endless Dungeon is a squad-based roguelite from Amplitude that mixes twin-stick shooting, tower defense, and tactical escort missions. Players lead a small team through dangerous space-station districts while protecting a crystal bot, gathering resources, and building defenses against waves of enemies. Its hook is the pressure of doing several jobs at once: explore for upgrades, hold choke points, keep heroes alive, and decide when to push deeper or retreat.",
  },
  {
    id: "ps4-endless-fables-dark-moor",
    overview:
      "Endless Fables: Dark Moor is a hidden-object adventure about myth, archaeology, and a mystery tied to an ancient moorland legend. Players move through illustrated scenes, locate key items, solve inventory puzzles, and follow a supernatural investigation at a relaxed pace. Like Artifex Mundi's other PS4 releases, it is best for players who enjoy guided puzzle stories, readable scenes, and a steady flow of small discoveries rather than reflex challenges.",
  },
  {
    id: "ps4-energy-hook",
    overview:
      "Energy Hook is a physics-driven traversal game built around swinging through open spaces with a grappling hook, wall-running, flipping, and chasing score routes. Its appeal comes from mastering momentum: the player is constantly looking for the next anchor point, angle, or trick chain that keeps movement flowing. It is rougher and more experimental than a polished action campaign, but interesting for players who like movement systems as the main event.",
  },
  {
    id: "ps4-enigmatis-2-the-mists-of-ravenwood",
    overview:
      "Enigmatis 2: The Mists of Ravenwood is a hidden-object mystery that sends the detective to a strange park where disappearances, illusions, and old secrets overlap. Players investigate scenes, collect evidence, solve puzzles, and use a case board to connect clues. It works well as a middle chapter for players who like supernatural detective stories with a slightly darker tone than the usual casual adventure.",
  },
  {
    id: "ps4-enigmatis-3-the-shadow-of-karkhala",
    overview:
      "Enigmatis 3: The Shadow of Karkhala closes Artifex Mundi's detective trilogy with a mountain-set investigation involving ancient evil, missing allies, and ritual secrets. The game follows the familiar hidden-object rhythm of searching scenes, gathering evidence, and solving compact logic puzzles, but the stakes are framed as the finale to a larger pursuit. It is best played by fans of the earlier Enigmatis entries who want the series' mystery thread resolved.",
  },
  {
    id: "ps4-enigmatis-the-ghosts-of-maple-creek",
    overview:
      "Enigmatis: The Ghosts of Maple Creek begins the series with a detective waking in a rain-soaked town and trying to reconstruct what happened. The game blends hidden-object scenes, evidence gathering, and light adventure puzzles with a cult mystery and a moody small-town atmosphere. Its case-board structure gives the investigation more shape than a simple item hunt, making it a solid entry point for casual mystery fans.",
  },
  {
    id: "ps4-esports-life-tycoon",
    overview:
      "ESports Life Tycoon is a management sim about building a professional esports organization from the ground up. Players recruit competitors, schedule training, manage team morale, upgrade facilities, handle sponsors, and prepare for matches where strategy choices affect results. Its appeal is the fantasy of running the organization behind the players, so the fun comes from planning, staff decisions, and long-term growth rather than direct match control.",
  },
  {
    id: "ps4-etherborn",
    overview:
      "Etherborn is a gravity-bending puzzle platformer set in abstract, dreamlike spaces where walking across curved surfaces changes what counts as up or down. Players search for orbs, navigate impossible architecture, and solve spatial puzzles by learning how each surface connects. It is slow, elegant, and atmosphere-forward, aimed at players who enjoy environmental puzzles, clean art direction, and traversal that asks them to rethink the shape of a level.",
  },
  {
    id: "ps4-euro-fishing",
    overview:
      "Euro Fishing is a simulation-focused fishing game built around lake selection, bait choice, casting, fish behavior, and patient line management. Players pursue different species across detailed European-style venues, using equipment and technique rather than arcade shortcuts. Its value is in the quiet rhythm of the sport: reading the water, choosing a setup, waiting for a bite, and landing a fish without snapping the line.",
  },
  {
    id: "ps4-evan-s-remains",
    overview:
      "Evan's Remains is a narrative puzzle adventure about a girl named Dysis searching for a missing genius on a mysterious island. The platforming puzzles are self-contained logic tests, while the story gradually shifts through twists about identity, memory, and why Evan vanished. It is a compact, story-first game for players who enjoy clean puzzle rooms and visual-novel-style reveals more than combat or exploration sprawl.",
  },
  {
    id: "ps4-eventide-2-sorcerer-s-mirror",
    overview:
      "Eventide 2: Sorcerer's Mirror is a hidden-object fantasy adventure rooted in Slavic folklore, following a rescue mission shaped by magical bargains and enchanted places. Players search scenes, solve inventory puzzles, and make light choices while moving through a fairy-tale conflict. It is a comfortable fit for casual adventure fans who want colorful mythic scenery, steady puzzle pacing, and a story that leans more whimsical than frightening.",
  },
  {
    id: "ps4-eventide-3-legacy-of-legends",
    overview:
      "Eventide 3: Legacy of Legends continues the folklore adventure format with a journey into a mythic realm where family, legends, and magical creatures drive the mystery. The gameplay centers on hidden-object scenes, object-use puzzles, and guided exploration through painterly locations. It is best for players already comfortable with Artifex Mundi's style: brisk, readable puzzle storytelling with enough fantasy flavor to make each scene feel distinct.",
  },
  {
    id: "ps4-eventide-slavic-fable",
    overview:
      "Eventide: Slavic Fable begins the series with a botanist visiting a heritage park filled with creatures and legends from Slavic myth. Players investigate hand-drawn locations, solve hidden-object scenes, and use collected items to uncover a family-centered magical threat. Its draw is the folklore setting and relaxed adventure pace, making it a friendly entry for players who want mystery, myth, and puzzles without heavy difficulty.",
  },
  {
    id: "ps4-ever-forward",
    overview:
      "Ever Forward is a puzzle adventure about a girl named Maya navigating dreamlike spaces tied to memory and emotional conflict. Players solve stealth-flavored environmental puzzles using distraction devices, timing, and observation to move through guarded arenas. The game balances quiet storytelling with clean puzzle-room design, so it works best for players who like reflective narrative games where each challenge represents a piece of the character's inner world.",
  },
  {
    id: "ps4-evertried",
    overview:
      "Evertried is a turn-based roguelite tactics game where enemies move only when the player acts, turning each floor into a compact positioning puzzle. Players climb a mysterious tower, chain attacks, manage hazards, and choose upgrades that shape future encounters. It has the quick reset energy of a roguelite but the deliberate feel of a chess-like tactics game, rewarding careful movement more than fast reactions.",
  },
  {
    id: "ps4-exile-s-end",
    overview:
      "Exile's End is a retro-styled exploratory action game inspired by cinematic platformers and early sci-fi adventures. Players search an alien world, find equipment, avoid hazards, and gradually open new routes through connected environments. The pacing is intentionally old-school: cautious jumps, limited resources, and atmosphere carry as much weight as combat, making it a fit for players who like compact, moody adventures with a 16-bit edge.",
  },
  {
    id: "ps4-exophobia",
    overview:
      "Exophobia is a retro first-person shooter set aboard a hostile alien ship, combining fast gunplay with light exploration and ability-based progression. Players blast through creatures, find upgrades, and revisit areas as new tools open paths through the station. Its personality comes from chunky pixel-art presentation and arcade speed, making it a good match for players who enjoy boomer-shooter energy in a smaller sci-fi package.",
  },
  {
    id: "ps4-extinction",
    overview:
      "Extinction is an action game about defending cities from towering ogre-like Ravenii by cutting through smaller enemies, rescuing civilians, and climbing giant foes to sever limbs and deliver finishing blows. The core idea is scale: battles are built around reaching weak points on monsters that can destroy buildings around the player. It is best for players interested in high-mobility giant-slaying rather than a traditional open-world adventure.",
  },
  {
    id: "ps4-exzeus-the-complete-collection",
    overview:
      "ExZeus: The Complete Collection brings together arcade rail-shooter action starring flying combat mechs battling waves of enemies, missiles, and bosses. Players dodge incoming fire, lock onto targets, and chase high scores through stages that feel closer to old arcade cabinets than modern tactical shooters. The appeal is simple spectacle: flashy robot combat, quick stages, and a direct score-attack rhythm.",
  },
  {
    id: "ps4-fairy-fencer-f-advent-dark-force",
    overview:
      "Fairy Fencer F: Advent Dark Force is an expanded JRPG about warriors called Fencers collecting magical weapons linked to fairies and old deities. Combat uses turn-based party battles with positioning, transformations, and combo options, while the story branches into multiple routes compared with the original release. It is very much a Compile Heart RPG: colorful cast banter, systems-heavy character growth, and a mix of comedy and fantasy stakes.",
  },
  {
    id: "ps4-fallen-legion-revenants",
    overview:
      "Fallen Legion: Revenants is an action RPG with real-time command battles, political decision-making, and a story split between battlefield survival and intrigue aboard a floating refuge. Players time blocks and attacks for a party of exemplars while also guiding conversations and choices that affect the resistance. Its strength is the blend of active combat rhythm and visual-novel-like pressure, giving each campaign step both tactical and narrative stakes.",
  },
  {
    id: "ps4-fallen-legion-sins-of-an-empire",
    overview:
      "Fallen Legion: Sins of an Empire follows Princess Cecille through a crumbling kingdom, combining side-scrolling real-time battles with decisions about leadership, loyalty, and sacrifice. Combat is built around timing party attacks, guarding at the right moment, and using abilities to control dangerous encounters. It is a compact RPG for players who like active command systems and a campaign where political choices sit beside constant battlefield pressure.",
  },
  {
    id: "ps4-family-feud",
    overview:
      "Family Feud adapts the television quiz format into a party game where players guess the most popular survey answers across fast rounds. The PS4 version is built for local play, online matches, and quick sessions that recreate the show's buzzer-and-board rhythm. Its appeal is social rather than mechanical: reading the room, guessing what ordinary people answered, and laughing when a confident response is nowhere on the board.",
  },
  {
    id: "ps4-family-mysteries-2-echoes-of-tomorrow",
    overview:
      "Family Mysteries 2: Echoes of Tomorrow is a hidden-object adventure with a sci-fi crime setup, sending players through a conspiracy involving time travel, experiments, and missing family secrets. The structure is classic Artifex Mundi: search scenes, collect tools, solve small puzzles, and keep the story moving through illustrated locations. It is a breezy mystery for players who want futuristic stakes wrapped in accessible casual-adventure pacing.",
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
