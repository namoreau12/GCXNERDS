const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-shadows-shing-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "ps4-shadows-awakening",
    sourceUrl: "https://store.playstation.com/en-us/product/UP2060-CUSA10425_00-SHADOWSAWAKENING",
    overview:
      "Shadows: Awakening is Games Farm and Kalypso Media's 2018 isometric action RPG for PlayStation 4. Its defining hook is the Devourer, a demon from the Shadow Realm who consumes souls and swaps between demonic and mortal party forms in real-time tactical combat. It belongs with loot-driven single-player RPGs, so listings should note PS4 region, physical versus digital format, and whether buyers expect the Heretic Kingdoms continuity.",
  },
  {
    id: "ps4-shape-of-the-world",
    sourceUrl: "https://www.playstationlifestyle.net/review/659553-shape-of-the-world-review-life-finds-a-way-ps4/",
    overview:
      "Shape of the World is Hollow Tree Games' first-person exploration game, released on PS4 through Plug In Digital. Coverage of the game centers on a procedurally populated natural world that grows around the player through forests, swamps, and dreamlike color fields. It is a meditative walking-sim-style download rather than a challenge platformer, with collector interest tied to indie-art-game taste and any limited physical edition.",
  },
  {
    id: "ps4-sheltered",
    sourceUrl: "https://www.team17.com/games/sheltered",
    overview:
      "Sheltered is Unicube and Team17's post-apocalyptic bunker-management strategy game. The core loop is keeping a family alive underground, sending survivors into the wasteland for supplies, managing hunger, hygiene, stress, repairs, and hard survival choices. On PS4 it belongs beside resource-management and survival sim releases, where version, platform, save support, and whether the copy is digital or physical matter more than action-game reflexes.",
  },
  {
    id: "ps4-shenmue-i-and-ii",
    sourceUrl: "https://d3tltd.com/our-work/shenmue/",
    overview:
      "Shenmue I & II is Sega and d3t's modern PS4, Xbox One, and PC release of the first two Shenmue games. It collects the Dreamcast originals with modern platform support, updated presentation options, and the long-form open-world adventure structure that made Ryo Hazuki's Yokosuka and Hong Kong journeys influential. Listings should separate this PS4 collection from Shenmue III and note region, disc completeness, and language/packaging variant.",
  },
  {
    id: "ps4-shift-happens",
    sourceUrl: "https://store.steampowered.com/app/359840",
    overview:
      "Shift Happens is Klonk Games' cooperative puzzle-platformer starring two characters who swap mass to solve physics and traversal challenges. It is built for couch co-op but can also be played solo by managing both characters, which is the real listing distinction from ordinary 2D platformers. The useful buyer notes are PS4 digital availability, two-player co-op focus, and whether someone wants a party-puzzle game rather than a story-heavy adventure.",
  },
  {
    id: "ps4-shiftlings",
    sourceUrl: "https://www.sierragames.com/shiftlings",
    overview:
      "Shiftlings is Rock Pocket Games and Sierra's physics puzzle-platformer about two space custodians joined by an air hose. Players shift size and weight between the pair to pass traps, reach switches, and handle stage hazards, which makes the tether mechanic the game's core identity. On PS4 it is a downloadable puzzle-platform release where co-op support, Sierra branding, and platform version matter more than character-license appeal.",
  },
  {
    id: "ps4-shikabanegurai-no-boukenmeshi",
    sourceUrl: "https://www.gematsu.com/2021/10/nippon-ichi-software-announces-dungeon-survival-strategy-rpg-shikabanegurai-no-boukenmeshi-for-ps4-switch",
    overview:
      "Shikabanegurai no Boukenmeshi is Nippon Ichi Software's Japanese PS4 dungeon-survival tactical RPG, later localized as Monster Menu: The Scavenger's Cookbook. The premise follows stranded adventurers gathering materials and cooking monster-derived food to survive and escape a dungeon, with grid battles and survival systems intertwined. Collectors should note Japanese-region packaging, language dependence, and the relationship to the later localized title.",
  },
  {
    id: "ps4-shikhondo-soul-eater",
    sourceUrl: "https://blog.playstation.com/archive/2018/06/21/korean-mythology-meets-bullet-hell-in-the-utterly-gorgeous-shikhondo-soul-eater-out-on-ps4-this-summer",
    overview:
      "Shikhondo: Soul Eater is DeerFarm's Korean-mythology bullet-hell shooter, published on PS4 by Digerati. The appeal is arcade-style danmaku play with mythic Korean imagery, boss patterns, score pressure, and a tighter genre focus than the old generic shooter copy suggested. Listings should make the shoot-'em-up identity obvious and distinguish the PS4 release from PC, Switch, and limited-print variants.",
  },
  {
    id: "ps4-shiness-the-lightning-kingdom",
    sourceUrl: "https://www.focus-entmt.com/en/news/shiness-the-lightning-kingdom-celebrates-its-release-with-a-launch-trailer",
    overview:
      "Shiness: The Lightning Kingdom is Enigami and Focus Home Interactive's 2017 action RPG for PS4, Xbox One, and PC. It follows Chado and companions across the fractured world of Mahera, mixing party progression and quests with fighting-game-inspired real-time combat, magic, blocking, parrying, and character abilities used in exploration. The practical distinctions are PS4 region, physical versus digital copy, and its Kickstarter-born indie RPG context.",
  },
  {
    id: "ps4-shing",
    sourceUrl: "https://store.steampowered.com/app/1103730/Shing/",
    overview:
      "Shing! is Mass Creation's 2020 side-scrolling beat-'em-up for modern consoles and PC. It focuses on stylized ninja combat, hack-and-slash crowd control, and up-to-four-player co-op rather than roguelike dungeon structure despite some catalog labels. On PS4, the useful notes are co-op support, digital availability, exact punctuation in the title, and its fit beside modern arcade brawlers.",
  },
];

const headers = [
  "platformSlug",
  "gameId",
  "title",
  "currentOverview",
  "sourceUrl",
  "rewriteNotes",
  "newOverview",
  "reviewStatus",
  "reviewer",
];

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = reviewedOverviews.map((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    return {
      platformSlug: "ps4",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority PS4 weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official publisher, storefront, developer, and specialist references.",
      newOverview: rewrite.overview,
      reviewStatus: "reviewed",
      reviewer: "Games Exchange editorial cleanup",
    };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );
  console.log(JSON.stringify({ ok: true, outputPath: path.relative(rootDir, outputPath), rows: rows.length }, null, 2));
}

main();
