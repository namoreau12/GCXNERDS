const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-marchen-masquerada-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-marchen-forest-mylne-and-the-forest-gift",
    sourceUrl: "https://www.cloudedleopardent.com/game/marchen-forest/en/",
    overview:
      "Marchen Forest: Mylne and the Forest Gift is a cute-but-deeper dungeon crawler RPG about Mylne, an apothecary gathering ingredients in a mysterious forest before the story leads into darker underground ruins. The console version expands and remasters a game that began on mobile, dividing the adventure into distinct parts as the tone and challenge build. It is best framed as a small-scale Japanese fantasy RPG with crafting-flavored setup, dungeon exploration, and a surprisingly serious mystery under its storybook surface.",
  },
  {
    id: "ps4-marenian-tavern-story-patty-and-the-hungry-god",
    sourceUrl: "https://www.kemco.jp/game/adventure-bar/en/index.html",
    overview:
      "Marenian Tavern Story: Patty and the Hungry God is a tavern-management RPG where Patty opens an adventure tavern to pay family debts after her brother is possessed by the God of Poverty. Players gather ingredients, cook dishes, sell food, explore dungeons, and fight turn-based battles to keep the business moving. Its hook is the loop between adventuring and running the tavern, making it more specific than a standard Kemco fantasy RPG.",
  },
  {
    id: "ps4-marooners",
    sourceUrl: "https://www.m2h.nl/marooners/",
    overview:
      "Marooners is a chaotic party game built around rapid minigame switching, treasure grabbing, and sudden hazards that can drown, burn, squash, or blow up players. It supports Party and Arena-style competition with quirky characters, unlockable weapons, and ghost-haunting after death. GCX should describe it as a frantic multiplayer minigame collection whose main trick is the switcheroo chaos, not as a campaign-driven action game.",
  },
  {
    id: "ps4-marsupilami-hoobadventure",
    sourceUrl: "https://www.microids.com/game-marsupilami-hoobadventure/",
    overview:
      "Marsupilami: Hoobadventure is a colorful 2.5D platformer starring Punch, Twister, and Hope after they accidentally release a ghostly curse across Palombia. Players jump, punch, dash, and swing through more than 20 levels across jungle, coastal, and temple environments while collecting bonuses and chasing optional time records. It belongs on GCX as a licensed comic-book platformer with family-friendly presentation and tighter challenge options for completionists.",
  },
  {
    id: "ps4-martha-is-dead",
    sourceUrl: "https://wiredproductions.com/games/martha-is-dead/",
    overview:
      "Martha is Dead is a dark first-person psychological thriller set in Tuscany during 1944, as war, family trauma, folklore, and the discovery of Martha's drowned body blur together. Players investigate through photography, environmental exploration, memories, and disturbing narrative sequences rather than combat. It should be presented with care as an adult horror story built around grief, identity, superstition, and wartime dread, not a conventional survival-horror action game.",
  },
  {
    id: "ps4-mary-skelter-2",
    sourceUrl: "https://store.steampowered.com/app/1496250/Mary_Skelter_2/",
    overview:
      "Mary Skelter 2 is a first-person dungeon-crawling RPG about fairy-tale-inspired Blood Maidens trying to escape the living prison known as Jail. Exploration is built around maze mapping, character-specific classes, traps, puzzle tools, and turn-based battles where blood-fueled transformations can make the party stronger or more unstable. It is important to frame it as a dungeon crawler in the Mary Skelter lineage, not as a generic action RPG.",
  },
  {
    id: "ps4-mary-skelter-finale",
    sourceUrl: "https://ifi.games/game/mary-skelter-finale/",
    overview:
      "Mary Skelter Finale closes the Blood Maidens story with another first-person dungeon RPG set around the monstrous living prison Jail, Marchen enemies, and madness-inducing Nightmares. The sequel expands the structure by letting players switch between multiple character groups, using each party's progress to solve dungeon problems and push the scattered cast forward. It is a finale made for series followers, with catch-up scenes for newcomers but a clear dependence on prior Mary Skelter lore.",
  },
  {
    id: "ps4-masquerada-songs-and-shadows",
    sourceUrl: "https://store.playstation.com/en-us/product/UP2251-CUSA07449_00-MASQUERADA17WHS1",
    overview:
      "Masquerada: Songs and Shadows is a fully voiced tactical RPG set in the Venetian-inspired Citte della Ombre, where magical masks called Mascherines create power, status, and class conflict. Players guide Cicero and his allies through real-time battles that can be paused to issue commands and set up elemental combos. Its appeal is lore-heavy political fantasy, hand-drawn presentation, and story-driven tactics rather than loot grinding or open exploration.",
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
