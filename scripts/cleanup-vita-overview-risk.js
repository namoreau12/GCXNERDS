const fs = require("node:fs");

const file = "data/games/vita.json";
const games = JSON.parse(fs.readFileSync(file, "utf8"));
const now = new Date().toISOString();

const updates = new Map([
  [
    "vita-captain-earth-mind-labyrinth",
    "Captain Earth: Mind Labyrinth is a PlayStation Vita visual novel tied to the Captain Earth anime, using character routes, story scenes, and franchise context as its main appeal. It is a Japan-focused licensed release, so region, language dependence, subtitle accuracy, and complete packaging are the key collector details.",
  ],
  [
    "vita-jonah-lomu-rugby-challenge",
    "Jonah Lomu Rugby Challenge brings Sidhe's rugby simulation to PlayStation Vita with team sport structure, match play, and licensed rugby presentation. The useful listing context is platform version, region, roster-era branding, and whether buyers are comparing it with console versions of Rugby Challenge.",
  ],
  [
    "vita-demon-gaze",
    "Demon Gaze is a PlayStation Vita dungeon crawler from Kadokawa Games and Experience Inc., built around first-person labyrinth exploration, party building, demons, loot, and character progression. It became one of Vita's recognizable DRPG releases, so listings should distinguish region, edition, and physical availability.",
  ],
  [
    "vita-demon-gaze-ii",
    "Demon Gaze II continues the Vita dungeon-crawling RPG line with a new cast, more demon-focused party systems, and the same grid-based exploration appeal. It should not share copy with the first Demon Gaze because sequel number, region, publisher, and edition differences are important to collectors.",
  ],
  [
    "vita-operation-abyss-new-tokyo-legacy",
    "Operation Abyss: New Tokyo Legacy is a PlayStation Vita dungeon RPG from Experience Inc. set in a near-future Tokyo, with party creation, first-person exploration, and turn-based encounters. It is the first New Tokyo Legacy entry, making sequel order and region especially important in listings.",
  ],
  [
    "vita-operation-babel-new-tokyo-legacy",
    "Operation Babel: New Tokyo Legacy is the follow-up to Operation Abyss, continuing Experience Inc.'s Vita dungeon-crawling formula with new missions, party customization, and sci-fi Tokyo setting. Listings should separate it from Abyss by title, sequel placement, region, and edition contents.",
  ],
]);

let changed = 0;
for (const game of games) {
  const description = updates.get(game.id);
  if (!description) continue;

  game.description = description;
  game.descriptionProvider = "GCX reviewed editorial overview";
  game.descriptionSourceUrl =
    game.descriptionSourceUrl ||
    game.articleUrl ||
    game.sourceUrl ||
    "https://en.wikipedia.org/wiki/List_of_PlayStation_Vita_games";
  game.overviewStatus = "published";
  game.overviewReviewStatus = "reviewed";
  game.overviewReviewer = "codex";
  game.healthUpdatedAt = now;
  game.searchText = [game.title, game.developer, game.publisher, game.year, game.platform, game.description]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  changed += 1;
}

fs.writeFileSync(file, `${JSON.stringify(games, null, 2)}\n`);
console.log(JSON.stringify({ changed }, null, 2));
