const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-360-arthur-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-360-three-sixty",
    sourceUrl: "https://en.wikipedia.org/wiki/360%3A_Three_Sixty",
    overview:
      "360: Three Sixty is a PAL PlayStation futuristic racer from Smart Dog and Cryo, set in a flooded world where hovercraft compete across water-heavy circuits. Its hook is combat racing: eight vehicles have different speed and armor ratings, weapons can fire forward or backward, and modes include tournament, time trial, and split-screen play. GCX should frame it as a Jet Moto-adjacent European curiosity with more emphasis on weaponized hovering than polished racing simulation.",
  },
  {
    id: "ps1-2999-nen-no-game-kids",
    sourceUrl: "https://psxdatacenter.com/games/J/0-9/SCPS-19004.html",
    overview:
      "2999-Nen no Game Kids is part of Sony's PlayStation Comic line, presenting an interactive comic rather than a conventional adventure. PSXDataCenter describes a future-set story in the year 2999, where people have cyborg-like traits and a young character wakes from a nightmare before strange events begin. GCX should describe it as a Japanese-language narrative experiment: more about comic presentation, atmosphere, and branching interaction than action systems or RPG progression.",
  },
  {
    id: "ps1-a-nanjarin",
    sourceUrl: "https://archive.org/details/psx_ananjari",
    overview:
      "A Nanjarin, often listed as Ah Nanjarin, is a Japan-only To One PlayStation release dated June 11, 1998 in preservation catalogs. Public catalog records classify it around simulation or strategy rather than action, which fits its obscure import profile better than a broad adventure label. GCX should keep the wording cautious: this is a niche Japanese-language PS1 title where the confirmed value is platform, publisher, region, date, and rarity within To One's small catalog.",
  },
  {
    id: "ps1-abalaburn",
    sourceUrl: "https://en.wikipedia.org/wiki/AbalaBurn",
    overview:
      "AbalaBurn: A Battle Legend of Astterica is Tamsoft and Takara's unusual PlayStation hybrid of fighting game, beat-'em-up, and action-adventure ideas. Arcade mode delivers one-on-one battles, while story mode sends players through a fantasy 3D world with equipment, items, boss fights, and a quest for eight crystals tied to the legend of Lemuria. GCX should present it as a strange Battle Arena Toshinden-era cousin with more exploration and fantasy framing than a normal versus fighter.",
  },
  {
    id: "ps1-agent-armstrong",
    sourceUrl: "https://en.wikipedia.org/wiki/Agent_Armstrong",
    overview:
      "Agent Armstrong is King of the Jungle and Virgin Interactive's PlayStation run-and-gun platformer, built around a 1930s secret-agent fight against the Syndicate. The game uses side-scrolling 3D stages with forward/back movement, guns, grenades, destructible objectives, bosses, cutscenes, and roughly 30 levels across locations such as Chicago and the Amazon. GCX should describe it as a Contra/Metal Slug-flavored PAL-era action platformer with mission tasks layered into the shooting.",
  },
  {
    id: "ps1-all-star-tennis-99",
    sourceUrl: "https://psxdatacenter.com/games/J/A/SLPS-01962.html",
    overview:
      "All Star Tennis '99 is Smart Dog and Ubi Soft's polygonal tennis release, known for Michael Chang and Jana Novotna branding in several versions. PSXDataCenter highlights singles, doubles, four-player doubles, and tournament play, while broader references note World Tour competitions and optional character-specific special moves. GCX should frame it as a late-1990s tennis sim with arcade flourishes, useful for comparing PlayStation sports coverage against its Nintendo 64 and Game Boy Color versions.",
  },
  {
    id: "ps1-angolmois-99",
    sourceUrl: "https://psxdatacenter.com/games/J/A/SLPM-86278.html",
    overview:
      "Angolmois 99 is a Success SuperLite 1500 Series PlayStation card-battle title with a doomsday comedy premise. PSXDataCenter describes UNO-like play where matching card color and reducing the player's hand are central, while the story pits the player against opponents before confronting a terror king who descends in the summer of 1999. GCX should position it as a budget Japanese board/card import with more personality than its plain metadata suggests.",
  },
  {
    id: "ps1-arthur-to-astaroth-no-nazomakaimura-incredible-toons",
    sourceUrl: "https://en.wikipedia.org/wiki/Arthur_to_Astaroth_no_Nazomakaimura%3A_Incredible_Toons",
    overview:
      "Arthur to Astaroth no Nazomakaimura: Incredible Toons is Capcom's Japan-only Ghosts 'n Goblins reskin of the Incredible Toons puzzle engine. Instead of action-platform combat, players solve Rube Goldberg-style machine puzzles using Arthur, Astaroth, Red Arremer, armor lures, and other franchise elements. GCX should explain it as a crossover oddity for puzzle and Capcom collectors: mechanically closer to The Incredible Machine than to Ghouls 'n Ghosts.",
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
    if (!game) throw new Error(`Missing PS1 game ${rewrite.id}`);
    rows.push([
      "ps1",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on catalog, article, and specialist gameplay sources.",
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
