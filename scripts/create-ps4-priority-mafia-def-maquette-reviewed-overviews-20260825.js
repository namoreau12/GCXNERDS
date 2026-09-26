const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-mafia-def-maquette-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-mafia-iii-definitive-edition",
    sourceUrl: "https://store.playstation.com/en-us/product/UP1001-CUSA03652_00-MAFIA3DEFINITIVE",
    overview:
      "Mafia III: Definitive Edition presents Hangar 13's 1968 New Bordeaux revenge story as the complete PS4 package, bundling Lincoln Clay's campaign with the post-launch story expansions and bonus content. Players build a new criminal network after the Italian Mafia destroys Lincoln's surrogate family, then take districts through stealth, gunfights, driving, and lieutenant choices. For GCX, the distinction from the base entry is important: this is the version collectors and late players look for when they want the full Mafia III release on one listing.",
  },
  {
    id: "ps4-magic-scroll-tactics",
    sourceUrl: "https://store.steampowered.com/app/840100/Magic_Scroll_Tactics/",
    overview:
      "Magic Scroll Tactics is a side-scrolling tactical RPG where elevation is the central combat rule. Battles unfold on layered 2D maps, so high ground, flying units, summons, and spell ranges can matter as much as raw stats. Players follow the summoner Nash through a compact fantasy campaign, making it a useful PS4 entry for tactics fans who want something stranger than a standard grid-based strategy RPG.",
  },
  {
    id: "ps4-magic-story-fear-and-the-mysterious-school",
    sourceUrl: "https://puyonexus.com/wiki/Mado_Monogatari:_Fia_and_the_Wondrous_Academy",
    overview:
      "Magic Story Fear and the Mysterious School appears in the PS4 data as the modern Mado Monogatari school-fantasy RPG, centered on Fia and an academy full of magic, dungeons, and strange trouble. The game shifts the long-running magical-comedy lineage toward 3D dungeon exploration, real-time combat, party progression, and school-life flavor. GCX should keep the overview cautious because the localized title mapping is messy, but the identity is clearly a Japanese magic-school RPG rather than a generic role-playing entry.",
  },
  {
    id: "ps4-maglam-lord",
    sourceUrl: "https://pqube.co.uk/games/maglam-lord/",
    overview:
      "Maglam Lord is an action JRPG about a weakened Demon Lord of Swords trying to reclaim power through exploration, real-time battles, weapon crafting, and relationship building. Players fight beasts, fill the DG gauge for stronger attacks, and forge magical weapons while moving through a bright fantasy story with dating-sim texture. Its personality comes from mixing combat, absurd demon-lord swagger, and character bonding instead of playing like a straight dungeon crawler.",
  },
  {
    id: "ps4-mahjong",
    sourceUrl: "https://www.sanukgames.com/games",
    overview:
      "Mahjong from Sanuk Games and Bigben is a calm tile-matching puzzle release built around clearing boards by pairing available tiles without blocking yourself. It is closer to solitaire-style mahjong than competitive four-player mahjong, with emphasis on concentration, visual scanning, and repeatable level completion. That distinction matters for GCX because buyers searching for traditional table mahjong may expect a different kind of game.",
  },
  {
    id: "ps4-manifold-garden",
    sourceUrl: "https://www.playstation.com/en-au/games/manifold-garden/",
    overview:
      "Manifold Garden is a first-person puzzle game about impossible architecture, repeating geometry, and gravity as a tool. Players rotate their perspective so walls become floors, fall through infinite spaces that loop back on themselves, and restore a sterile world with vegetation and life. It belongs in the PS4 library as a standout art-puzzle release, memorable for spatial logic and Escher-like presentation rather than story, combat, or collectibles.",
  },
  {
    id: "ps4-mantis-burn-racing",
    sourceUrl: "https://blog.playstation.com/2016/10/04/mantis-burn-racing-brings-top-down-arcade-action-to-ps4-october-12/",
    overview:
      "Mantis Burn Racing is a modern top-down racer from VooFoo Studios built around physics-heavy handling, career events, vehicle classes, and RPG-style upgrades. Players drift through dirt, asphalt, and industrial tracks while improving vehicles and chasing clean racing lines from an overhead view. It is useful to frame it as a polished arcade-racing throwback with progression depth, not just another generic racing listing.",
  },
  {
    id: "ps4-maquette",
    sourceUrl: "https://annapurnainteractive.com/en/games/maquette",
    overview:
      "Maquette is a first-person recursive puzzle game about a relationship told through a world nested inside itself. Objects exist at tiny and huge scales at the same time, so moving something in a model can change the full-size environment around the player. Its appeal is the puzzle metaphor: perspective, proportion, and romantic memory are tied together, making it feel more like an Annapurna narrative puzzle piece than a pure logic challenge.",
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
