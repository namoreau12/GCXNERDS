const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-masyu-mekazoo-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-masyu",
    sourceUrl: "https://www.hamster.co.jp/en/product/",
    overview:
      "Masyu is part of Hamster's Nikoli puzzle line, built around drawing one continuous loop through a grid of black and white circles. The rules are simple to state but tricky to satisfy: white and black pearls force different turning and straight-line behavior, so each board becomes a clean deduction problem. It is best described as a specialist logic-puzzle release for Nikoli fans, closer to Slitherlink or Hashiwokakero than a broad arcade puzzle game.",
  },
  {
    id: "ps4-matchpoint-tennis-championships",
    sourceUrl: "https://matchpoint-game.com/en",
    overview:
      "Matchpoint: Tennis Championships is a modern tennis sim focused on tactical positioning, aiming, shot timing, and a career mode built around ranking progression and rivalries. Players create or guide a tennis star, choose shot techniques, and work through matches where court placement matters more than arcade power-ups. GCX should frame it as a simulation-minded sports release for players who want the rhythm of professional tennis rather than a party-style tennis game.",
  },
  {
    id: "ps4-mayhem-brawler",
    sourceUrl: "https://www.heroconcept.com/mayhem-brawler/",
    overview:
      "Mayhem Brawler is an urban-fantasy side-scrolling beat 'em up that deliberately channels 1990s arcade brawlers through comic-book art, supernatural enemies, and branching story choices. Players can fight solo or in couch co-op, using different heroes to clear streets full of werewolves, vampires, gangs, and other threats. Its identity is not just punches and combos: the choice-driven routes and three endings give it more replay shape than a straight arcade throwback.",
  },
  {
    id: "ps4-medievil",
    sourceUrl: "https://store.playstation.com/en-us/product/UP9000-CUSA11227_00-MEDIEVILHD000001",
    overview:
      "MediEvil is the PS4 remake of Sony's original PlayStation action-adventure, rebuilding Sir Daniel Fortesque's undead quest with modern visuals while preserving its gothic comedy and old-school structure. Players guide the hapless knight through Gallowmere, fighting monsters, solving level objectives, collecting chalices, and trying to earn the heroic reputation he never deserved in life. It is a key PlayStation nostalgia entry because it modernizes a cult PS1 exclusive without turning it into a completely new game.",
  },
  {
    id: "ps4-mega-coin-squad",
    sourceUrl: "https://steamcommunity.com/app/312510",
    overview:
      "Mega Coin Squad is a manic 2D platformer about grabbing coins, banking them, and surviving compact levels full of enemies, weapons, and hazards. The solo campaign runs through 16 stages in pursuit of Mega Coins, while local multiplayer turns the same coin-chasing idea into competitive chaos. It should be presented as a score-and-collection platformer with arcade momentum, not a traditional mascot platform adventure.",
  },
  {
    id: "ps4-megadimension-neptunia-vii",
    sourceUrl: "https://ifi.games/game/megadimension-neptunia-vii/",
    overview:
      "Megadimension Neptunia VII is the first main Neptunia RPG built for PS4, sending Neptune and the goddesses through multiple dimensions, three linked story arcs, and a bigger conflict threatening Gamindustri. Battles use party positioning, transformations, combo systems, and new mechanics such as Next Forms and Parts Break. Its value is strongest for JRPG fans already tuned into Neptunia's console-war parody, character banter, and Compile Heart-style progression.",
  },
  {
    id: "ps4-megaquarium",
    sourceUrl: "https://blog.playstation.com/2019/09/23/megaquarium-swims-to-ps4-october-18/",
    overview:
      "Megaquarium is an aquarium tycoon game about designing exhibits, hiring staff, researching equipment, balancing guest needs, and keeping fish alive in increasingly complex tanks. Players manage layouts, filters, pumps, food, prestige, and visitor flow as the aquarium expands from simple displays into larger aquatic attractions. It is a genuine management sim with a friendlier theme, useful for players who like building systems but want fish and sharks instead of factories or cities.",
  },
  {
    id: "ps4-mekazoo",
    sourceUrl: "https://www.facebook.com/MekazooGame/",
    overview:
      "Mekazoo is a colorful 2D platformer set inside glossy 3D environments, built around swapping between mechanical animals with different movement abilities. Players use forms such as the armadillo, frog, wallaby, panda, and pelican to roll, swing, jump, climb, and glide through fast obstacle courses. Its hook is momentum and character-switching in a neon mechanical world, making it more specific than a generic platform listing.",
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
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on verified identity, platform metadata, publisher/developer context, and official/store descriptions where available.",
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
