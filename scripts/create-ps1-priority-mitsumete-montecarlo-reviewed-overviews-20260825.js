const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-mitsumete-montecarlo-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority PS1 weak-template cleanup; original GCX editorial overview based on platform databases, specialist databases, publisher/retail metadata, and franchise context.";

const entries = [
  {
    id: "ps1-mitsumete-knight-r-daibouken-hen",
    sourceUrl: "https://www.honestgamers.com/48556/playstation/mitsumete-knight-r-daiboukenhen/game.html",
    overview:
      "Mitsumete Knight R: Daibouken-hen is Konami's RPG sequel/spinoff to Mitsumete Knight, shifting the dating-sim character world into an isometric anime-styled JRPG adventure. It keeps the franchise's relationship/cast appeal but gives it questing, exploration and role-playing structure rather than the original courtship-sim loop. GCX should present it as a Japan-only Konami RPG companion piece, notable for players who want the broader Mitsumete Knight universe rather than only the first game's romance systems.",
  },
  {
    id: "ps1-mizuki-shigeru-no-yokai-butouden",
    sourceUrl: "https://www.honestgamers.com/48557/playstation/mizuki-shigeru-no-yokai-butouden/game.html",
    overview:
      "Mizuki Shigeru no Yokai Butouden is a Japan-only PlayStation fighting game from KSS built around the yokai world associated with manga creator Shigeru Mizuki. The old adventure label was misleading: specialist databases classify it as a fighting/action release, with its appeal coming from supernatural character matchups and folklore branding. GCX should frame it as a licensed yokai fighter for import collectors, not a story-led exploration game.",
  },
  {
    id: "ps1-mobile-armor",
    sourceUrl: "https://tcrf.net/Mobile_Armor",
    overview:
      "Mobile Armor is a tank-combat simulation/action title from Highwaystar, released in Japan by D3 Publisher as Simple 1500 Series Vol. 90: The Sensha and in North America by Agetec. Players control a WWII-era tank through missions, with additional tank models opening as progress builds. GCX should describe it as a budget-line armored combat game whose identity is vehicle handling, missions and military hardware rather than a generic action platformer.",
  },
  {
    id: "ps1-mobius-link-3d",
    sourceUrl: "https://backloggd.com/games/mobius-link-3d/",
    overview:
      "Mobius Link 3D is a turn-based space strategy game from I.Magic and Itochu, using 3D presentation for a campaign about Alice Schrodinger commanding the Starfleet Mobius against an imperial navy. Its appeal is scenario planning, multi-map strategy and the series' anime-style female commanders, with automation easing some operations. GCX should position it as a Japan-only tactical space-opera entry for strategy/import collectors.",
  },
  {
    id: "ps1-momotarou-densetsu",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-91171.html",
    overview:
      "Momotarou Densetsu is Hudson and Make's PlayStation entry in the Peach Boy RPG series, not a party-game spinoff. It keeps the classic 2D Japanese RPG structure: cartoon towns and roads, first-person turn-based battles, animals and devils as enemies, and a fairy-tale world rooted in Momotaro folklore. GCX should treat it as the PlayStation continuation of Hudson's long-running Momotarou Densetsu RPG line.",
  },
  {
    id: "ps1-momotarou-matsuri-ishikawa-rokuemon-no-maki",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/135860-momotarou-matsuri-ishikawa-rokuemon-no-maki",
    overview:
      "Momotarou Matsuri: Ishikawa Rokuemon no Maki is a 2001 PlayStation release from Hudson and Make that sits on the festival/side-story branch of the Momotarou catalog. Public data is thinner than the main RPG entries, so GCX should avoid inventing mechanics and instead make the useful distinction: this is a late PS1 Japan-only Momotarou release for Hudson completists, separate from the better-known Momotarou Dentetsu board-game line.",
  },
  {
    id: "ps1-mona-and-moki-drive-me-wild",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/167723-mona-moki-1-drive-me-wild",
    overview:
      "Mona & Moki: Drive Me Wild is a Lightspan educational PlayStation release about helping Mona and Moki get back to school in the fantasy town of Snetha. Its activities center on word games and key-earning challenges that teach vocabulary, synonyms and antonyms, prefixes and suffixes, riddles and problem solving. GCX should describe it as school-focused Lightspan software first and a collectible oddity second, because its retail context is educational rather than arcade.",
  },
  {
    id: "ps1-mona-and-moki-drive-me-wilder",
    sourceUrl: "https://gamesdb.launchbox-app.com/developers/games/23239-the-lightspan-partnership",
    overview:
      "Mona & Moki: Drive Me Wilder is the follow-up Lightspan PlayStation learning adventure, continuing the Snetha-set vocabulary and problem-solving structure with Mona and Moki. Like the first game, it belongs to the classroom-oriented Lightspan line, where play is built around language skills rather than traditional platforming or combat. GCX should group it with educational PS1 software and flag that complete Lightspan releases appeal to a very specific collector niche.",
  },
  {
    id: "ps1-money-idol-exchanger",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00963.html",
    overview:
      "Money Idol Exchanger, known outside Japan as Money Puzzle Exchanger, is Face's fast tile-matching arcade puzzle game brought from Neo Geo MVS to PlayStation. Players combine falling coins into higher denominations and clear money symbols under pressure, a structure often compared to Magical Drop. The PlayStation version is important because it preserves the arcade puzzle hook while adding console presentation, making it one of PS1's more distinctive competitive puzzle imports.",
  },
  {
    id: "ps1-monster-race",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-86143.html",
    overview:
      "Monster * Race is Koei's monster-training RPG about a boy trying to win the Monster Race World Championship. Instead of ordinary turn-based monster battles, the loop centers on raising creatures for races, training them to become stronger and faster, and recruiting wild monsters after beating them on their own terrain. GCX should describe it as a monster-taming racing RPG, a useful cousin to Pokemon-era collecting without pretending it plays the same way.",
  },
  {
    id: "ps1-monster-collection-kamen-no-madoushi",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-02245.html",
    overview:
      "Monster Collection: Kamen no Madoushi adapts the Monster Collection card-game world into a hybrid PlayStation RPG. Dungeon sections play closer to action RPG exploration, while boss encounters shift into card-battle RPG structure where monsters, spells, equipment, items and terrain determine outcomes. GCX should present it as a card-battle dungeon RPG for Monster Collection fans, with elemental monster rules and card acquisition as the hook.",
  },
  {
    id: "ps1-monster-complete-world",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01870.html",
    overview:
      "Monster Complete World is Idea Factory's PlayStation monster-taming RPG, often easiest to explain as a Pokemon-like import with its own pet-raising structure. The player starts by buying a pet, explores for new creatures, gives commands in battle and tries to capture weakened enemies into the party. GCX should frame it as a Japan-only monster-collecting RPG in Idea Factory's early PlayStation catalog, with a later Idea Factory Collection reissue worth noting.",
  },
  {
    id: "ps1-monster-punish",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-02491.html",
    overview:
      "Monster Punish is Siesta and Teichiku's 1999 Japan-only strategy game about monster hunting, with selectable male or female hunters and support for up to four human players. Its identity is not generic action but tactical monster confrontation, party-style participation and import-only oddity value. GCX should present it as a small-footprint PS1 strategy release where the title, local multiplayer angle and Teichiku publishing credit do most of the collector work.",
  },
  {
    id: "ps1-monster-racer",
    sourceUrl: "https://psxdatacenter.com/games/P/M/SLES-03246.html",
    overview:
      "Monster Racer is Microids' PAL PlayStation fantasy racing game, released in late 2001 with first-person racing/driving presentation and a monster-themed low-budget mascot style. It is not related to Koei's Monster * Race despite the similar name; this one is a European racing title with Microids' own design/music credits. GCX should make that distinction clear so searchers do not confuse it with Japan's monster-training RPG.",
  },
  {
    id: "ps1-monte-carlo-games-compendium",
    sourceUrl: "https://psxdatacenter.com/games/P/M/SLES-03813.html",
    overview:
      "Monte Carlo Games Compendium is a PAL PlayStation casino collection from Midas Interactive and Mere Mortals, packaging 17 gambling and card games across a two-disc release. It is built for simulated betting, table-game practice and casual casino variety rather than narrative or action play. GCX should describe it as a budget European casino compilation, useful for players tracking Midas releases and for collectors who care about complete jewel-case/two-disc copies.",
  },
];

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const missing = entries.filter((entry) => !byId.has(entry.id));
  if (missing.length) {
    throw new Error(`Missing PS1 games: ${missing.map((entry) => entry.id).join(", ")}`);
  }

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
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "ps1",
        entry.id,
        game.title,
        game.description || game.overview || "",
        entry.sourceUrl,
        rewriteNotes,
        entry.overview,
        "reviewed",
        "GCX editorial cleanup",
      ];
    }),
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(`Wrote ${entries.length} reviewed PS1 overviews to ${path.relative(rootDir, outputPath)}`);
}

main();
