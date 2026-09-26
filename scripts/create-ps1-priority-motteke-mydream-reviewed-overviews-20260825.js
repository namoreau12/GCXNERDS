const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-motteke-mydream-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority PS1 weak-template cleanup; original GCX editorial overview based on platform databases, specialist game databases, publisher metadata, gameplay footage, and import-catalog documentation.";

const entries = [
  {
    id: "ps1-motteke-tamago-with-ganbare-kamonohashi",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01242.html",
    overview:
      "Motteke Tamago with Ganbare! Kamonohashi is a maze-action game about grabbing eggs, hatching them, and guiding the chicks home before rival players can do the same. The fixed-screen layouts make it closer to a competitive arcade party game than a sports release: players race routes, interfere with opponents, and work around stage hazards while trying to bank the most successful returns. GCX should frame it as a Japan-only multiplayer action curiosity from Naxat Soft, especially for collectors who like Bomberman-adjacent PlayStation imports.",
  },
  {
    id: "ps1-motto-trump-shiyouyo-i-mode-de-grand-prix",
    sourceUrl: "https://lutris.net/games/motto-trump-shiyouyo-i-mode-de-grand-prix/",
    overview:
      "Motto Trump Shiyouyo! i-Mode de Grand Prix is a late Japanese PlayStation card-game collection built around familiar table games such as poker, 21, and blackjack. Its first-person presentation and multitap support point to short local sessions rather than a campaign structure, with the i-mode branding tying it to Japan's mobile-era card-game culture. GCX should describe it as a traditional card-and-board package for import collectors, not a puzzle game in the falling-block sense.",
  },
  {
    id: "ps1-motto-nyan-to-wonderful-2",
    sourceUrl: "https://www.mobygames.com/game/263820/motto-nyan-to-wonderful-2/",
    overview:
      "Motto! Nyan to Wonderful 2 is Banpresto's sequel to Nyan to Wonderful, built around raising cats and dogs instead of managing a farm or running a business. Players choose from multiple pet breeds, then settle into a slower routine of care, interaction, and collection-minded pet simulation. GCX should position it as a Japan-only companion-animal sim with appeal for PlayStation collectors who track pet-care and lifestyle software from the late 1990s.",
  },
  {
    id: "ps1-motto-oja-majo-do-re-mi-mahodou-smile-party",
    sourceUrl: "https://en.wikipedia.org/wiki/Ojamajo_Doremi",
    overview:
      "Motto! Oja Majo Do-Re-Mi: Mahodou Smile Party is part of Bandai's Kids Station line of PlayStation releases based on the Ojamajo Doremi anime. Rather than a long action adventure, it presents a child-friendly set of themed mini-games and activities built around the Maho-dou cast and setting. GCX should treat it as licensed anime software for younger players and character collectors, with its July 2001 Japanese release separating it from the earlier Dance Carnival and later English Festival entries.",
  },
  {
    id: "ps1-mouja",
    sourceUrl: "https://en.wikipedia.org/wiki/Moujiya_%28video_game%29",
    overview:
      "Mouja is the PlayStation port of a Japanese falling-block puzzle game built around currency exchange. Coins fall in pairs, and matching enough of the same denomination upgrades them into higher-value coins or bills, giving the game a money-changing twist on Puyo Puyo-style pressure. The PlayStation version comes from Racdym with Virgin publishing, making it notable as a console conversion of a Windows and arcade puzzle idea that later drew comparisons to Money Idol Exchanger.",
  },
  {
    id: "ps1-mouri-motonari-chikai-no-sanshi",
    sourceUrl: "https://www.rpgblog.net/srpg-game-82-mouri-motonari-part-1-ps/",
    overview:
      "Mouri Motonari: Chikai no Sanshi is Koei's historical strategy RPG centered on the Sengoku-era warlord Mori Motonari. Like Koei's other character-led history games, its appeal is in command decisions, scenario progression, and period strategy rather than arcade combat. GCX should present it as a Japan-only tactical/history title for players interested in Koei's broader Nobunaga-era catalog, with the PlayStation release following the Saturn version and landing in Japan in February 1998.",
  },
  {
    id: "ps1-mr-prospector-horiate-kun",
    sourceUrl: "https://www.igdb.com/games/aquanauts-holiday-2/similar",
    overview:
      "Mr. Prospector: Horiate-kun is a digging-and-treasure game starring a dog who explores mines to uncover valuables and other objects. The long-form playthroughs and catalog descriptions point to a completion-focused loop: dig through underground spaces, collect everything available, and push deeper into mine layouts rather than simply matching pieces on a board. GCX should describe it as a quirky Japan-only excavation adventure for import collectors, not as a generic puzzle game.",
  },
  {
    id: "ps1-mtb-dirt-cross",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01467.html",
    overview:
      "MTB Dirt Cross is a mountain-bike racing game built around off-road courses covered with dirt, stones, ice, mud, logs, and other handling hazards. Players choose a rider and bicycle, then work through a season where reflexes, track reading, and the right bike fit matter more than pure top speed. GCX should frame it as a Japanese PlayStation cycling racer from Sammy Studios, useful for collectors because mountain-bike racing was a narrower sports niche than the system's usual car and motorcycle libraries.",
  },
  {
    id: "ps1-murakoshi-masami-no-bakuchou-nippon-rettou",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_%28console%29_games_%28M%E2%80%93Z%29",
    overview:
      "Murakoshi Masami no Bakuchou Nippon Rettou is a Japan-only fishing game from A-Wave and Victor Interactive Software, tied to angler Masami Murakoshi. It belongs with the PlayStation's surprisingly deep fishing catalog, emphasizing location choice, tackle decisions, and the satisfaction of landing fish rather than strategic unit management. GCX should describe it as a fishing simulation/sports title and note the TsuriCon Edition identity when separating copies and listings.",
  },
  {
    id: "ps1-murakoshi-masami-no-bakuchou-nippon-rettou-2",
    sourceUrl: "https://www.uvlist.net/game-102205-Murakoshi%2BMasami%2Bno%2BBakuchou%2BNippon%2BRettou%2B2",
    overview:
      "Murakoshi Masami no Bakuchou Nippon Rettou 2 continues Victor's angler-branded PlayStation fishing line with another Japan-only release. The sequel should be understood as a fishing sports/simulation entry: players chase catches through gear, timing, and water-location decisions instead of controlling teams or resources. GCX should keep the collector distinction clear from the first Bakuchou Nippon Rettou and from Pakuchikou Seabass Fishing, since all three titles sit close together in Victor's late PS1 fishing catalog.",
  },
  {
    id: "ps1-murakoshi-masami-no-pakuchikou-seabass-fishing",
    sourceUrl: "https://en.wikipedia.org/wiki/Victor_Interactive_Software",
    overview:
      "Murakoshi Masami no Pakuchikou Seabass Fishing is the seabass-focused branch of Victor Interactive Software's Murakoshi Masami PlayStation fishing releases. Its hook is narrower than the main Bakuchou Nippon Rettou games: instead of a broad fishing survey, it centers collector context around seabass angling, tackle choices, and Japanese waterside sport presentation. GCX should classify it as a fishing simulation, not a strategy game, and call out the A-Wave/Victor lineage for accurate marketplace listings.",
  },
  {
    id: "ps1-mushi-no-idokoro",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00375.html",
    overview:
      "Mushi no Idokoro is an insect-themed puzzle game set in a fantasy world. Players move lines of bugs to create combinations and make insects disappear, with the goal of clearing every insect from the stage. Its modes include time-focused ranking play and other puzzle variations, so GCX should describe it as a tile/line-manipulation puzzle release with a strange bug-world personality rather than as an adventure game.",
  },
  {
    id: "ps1-mushi-taro",
    sourceUrl: "https://www.mobygames.com/game/71315/mushi-taro/",
    overview:
      "Mushi Taro is a bug-catching simulation about a young boy collecting insects in natural environments. The appeal is not combat or abstract strategy; it is the quieter loop of searching locations, catching different bugs, and building out a nature-themed collection. GCX should present it as a Japan-only insect-collecting sim from Victor Interactive Software, with crossover interest for players who like creature catalogs, outdoor-life games, and unusual late-PS1 lifestyle releases.",
  },
  {
    id: "ps1-muteki-o-tri-zenon",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-86790.html",
    overview:
      "Muteki-Oh Tri-Zenon is an interactive movie/action game based on the mecha anime Invincible King Tri-Zenon. Players advance by pressing displayed directions or buttons at the correct moment, with some scenes asking for rapid button input and mini-games appearing between chapters. GCX should frame it as a quick-time-event anime adaptation rather than a conventional action game, useful for collectors tracking Marvelous Entertainment's licensed PlayStation releases.",
  },
  {
    id: "ps1-my-dream-on-air-ga-matenakute",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/110369-my-dream-on-air-ga-matenakute",
    overview:
      "My Dream: On Air ga Matenakute is a voice-actor-themed simulation/adventure where the player moves through a story world built around aspiring performers. One of its stranger hooks is that each of the eight heroines can be assigned one of three different actresses at the start of a new game, changing the voice presentation before the player even begins. GCX should describe it as a Japan-only anime-style career/relationship sim with a voice-casting gimmick, not just a generic visual novel.",
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
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "ps1",
        entry.id,
        game.title || game.name || "",
        game.description || game.gcxOverview || game.overview || "",
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
