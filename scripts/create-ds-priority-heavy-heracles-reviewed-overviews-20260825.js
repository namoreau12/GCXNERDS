const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-heavy-heracles-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-heavy-armor-brigade",
    sourceUrl: "https://en.wikipedia.org/wiki/Tank_Beat",
    overview:
      "Heavy Armor Brigade is the North American name for the second Tank Beat game on Nintendo DS, an artillery/strategy tank title from Milestone published by UFO Interactive. The series uses stylus-driven tank movement and combat rather than simple side-scrolling action, with mission structure, vehicle choice, and battlefield positioning shaping play. GCX should frame it as a niche DS tactical-action sequel for players interested in touch-screen vehicle control and import-to-localization name changes.",
  },
  {
    id: "ds-hell-s-kitchen",
    sourceUrl: "https://en.wikipedia.org/wiki/Hell%27s_Kitchen%3A_The_Game",
    overview:
      "Hell's Kitchen is Ludia and Ubisoft's DS adaptation of the Gordon Ramsay reality show, built as a time-management cooking game rather than a broad restaurant simulator. Players move through kitchen and dining-room tasks such as preparation, cooking, serving, seating, and recipe challenges while Ramsay judges performance. GCX should describe it as a TV-license pressure-cooker game: approachable, repetitive, and collector-relevant mainly because it captures the show's personality on Nintendo DS.",
  },
  {
    id: "ds-hello-baby",
    sourceUrl: "https://www.amazon.co.uk/505-Games-44073-Hello-Nintendo/dp/B0019HR2Y0",
    overview:
      "Hello Baby! is a 505 Games Nintendo DS childcare simulation about looking after a baby through touch-screen activities. Retail descriptions position the player as a babysitter caring for a seven-month-old until the baby's first birthday, with feeding, dressing, bedtime, and other small minigame routines standing in for platform stages. GCX should present it as part of the DS lifestyle/simulation wave, where the appeal is novelty, stylus interaction, and kid-friendly virtual-care play.",
  },
  {
    id: "ds-hello-kitty-no-gotouchi-collection-koi-no-dokidoki-trouble",
    sourceUrl: "https://www.play-asia.com/en/hello-kitty-no-gotouchi-collection-koi-no-dokidoki-trouble/13/701zej",
    overview:
      "Hello Kitty no Gotouchi Collection: Koi no DokiDoki Trouble is a Japan-only Sanrio DS release from Rocket Company. Store and catalog listings place it as a Nintendo DS title tied to regional Hello Kitty collecting rather than a traditional platformer or sports game. GCX should describe it cautiously as a character-collection and light activity import, most useful to Sanrio collectors tracking DS exclusives, Japanese packaging, and Rocket Company's licensed handheld catalog.",
  },
  {
    id: "ds-hello-kitty-no-oshare-party-sanrio-character-zukan-ds",
    sourceUrl: "https://www.fromsoftware.jp/ww/detail.html?csm=060",
    overview:
      "Hello Kitty no Oshare Party Sanrio Character Zukan DS is an official Nintendo DS variety game listing from FromSoftware's catalog, developed/published under the 3 O'Clock label with a listed price of 4,800 yen. Sanrio-focused references describe fashion, character-index, party, and fortune-telling features rather than a long adventure campaign. GCX should frame it as a rare-feeling Sanrio/FromSoftware-adjacent curiosity built around cute activities, character browsing, and import collector novelty.",
  },
  {
    id: "ds-hello-kitty-no-panda-sport-stadium",
    sourceUrl: "https://www.play-asia.com/en/hello-kitty-no-panda-sport-stadium/13/702qxx",
    overview:
      "Hello Kitty no Panda Sport Stadium is a Japan-only Nintendo DS sports release developed and published by Dorasu, with Play-Asia listing it as a 2008 Sanrio title. The hook is not simulation depth but themed, approachable sports play around Panda Hello Kitty and the broader character license. GCX should position it as a small licensed import for Sanrio and DS collectors, where box condition, Japanese release status, and Dorasu's catalog matter more than competitive sports complexity.",
  },
  {
    id: "ds-hello-pocoyo",
    sourceUrl: "https://www.nintendolife.com/games/ds/hello_pocoyo",
    overview:
      "Hello Pocoyo! is a Europe-focused Nintendo DS children's adventure from Zinkia and Virgin Play, first released in November 2008. Pocoyo series summaries describe a simple story about a magic felt-tip pen causing Pocoyo's friends to disappear, with players searching for them through clues, coloring pictures, and drawing objects. GCX should present it as a preschool-friendly licensed DS adventure, built around touch-screen creativity and gentle exploration rather than challenge-heavy platforming.",
  },
  {
    id: "ds-heracles-battle-with-the-gods",
    sourceUrl: "https://www.game.es/heracles-battle-with-the-gods-nintendo-ds--179872",
    overview:
      "Heracles: Battle With The Gods is a Nintendo DS mythological adventure published in Europe by Midas/Conspiracy-associated labels. Retail catalog listings confirm the DS platform and title identity, while secondary descriptions point to Greek-mythology action-adventure play rather than a full party RPG. GCX should describe it as a budget European DS adventure built around Heracles, mythic enemies, puzzles, and light combat, with collector interest tied to PAL-region availability and Midas-era packaging.",
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
    if (!game) throw new Error(`Missing DS game ${rewrite.id}`);
    rows.push([
      "ds",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority DS weak-template cleanup; original GCX editorial overview based on platform, catalog, retail, and franchise references.",
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
