const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "3ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-6x1-aikatsu-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority 3DS weak-template cleanup; original GCX editorial overview based on Nintendo eShop pages, publisher/series documentation, specialist databases, reviews, and gameplay context.";

const entries = [
  {
    id: "3ds-6-1-unlimited",
    sourceUrl: "https://www.honestgamers.com/52488/3ds/6x1unlimited/game.html",
    overview:
      "6x1/=UNLIMITED is a Japan-only Nintendo 3DS strategy/RPG release from A+ Games and Barnhouse Effect. Public English information is thin, but catalog data and music metadata identify it as a 2015 3DS title rather than a generic puzzle release. GCX should describe it conservatively as an obscure import strategy/RPG with collector appeal tied to its A+ Games eShop/catalog identity, while avoiding invented details about combat systems or story structure.",
  },
  {
    id: "3ds-12-sai-honto-no-kimochi",
    sourceUrl: "https://en.wikipedia.org/wiki/Age_12",
    overview:
      "12-Sai. Honto no Kimochi is Happinet's first Nintendo 3DS adaptation of Nao Maita's 12-Sai shoujo romance series. The game follows the middle-school relationship drama of Hanabi, Yui, and their classmates through a romance-adventure format rather than action or puzzle play. GCX should frame it as a Japan-only licensed manga/anime story game, with its December 2014 release making it the starting point for the 3DS 12-Sai line.",
  },
  {
    id: "3ds-12-sai-koisuru-diary",
    sourceUrl: "https://www.honestgamers.com/52472/3ds/12sai-koisuru-diary/game.html",
    overview:
      "12-Sai. Koisuru Diary is Happinet's 2016 follow-up 3DS romance-adventure based on the 12-Sai manga and anime. Like Honto no Kimochi, it is built for fans of the source material, centering school-life scenes, friendship, first-love choices, and character interactions instead of reflex-heavy play. GCX should distinguish it as the later diary-themed adventure entry, released during the TV anime period and meant for Japanese-reading series fans.",
  },
  {
    id: "3ds-12-sai-torokeru-puzzle-futari-no-harmony",
    sourceUrl: "https://www.play-asia.com/en/12-sai-torokeru-puzzle-futari-no-harmony/13/70beoz",
    overview:
      "12-Sai. Torokeru Puzzle Futari no Harmony turns the 12-Sai cast into a cute sweets-puzzle spinoff. Players pair characters such as Kako, Hanabi, and Yui, with different partners, costumes, voices, and helper skills affecting puzzle play. It also supports a shared-system Nakayoshi mode where two players split the controls on one 3DS, so GCX should present it as a romance-series puzzle companion rather than another visual novel entry.",
  },
  {
    id: "3ds-36-fragments-of-midnight",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/New-Nintendo-3DS-Download-Software/36-Fragments-of-Midnight-1280381.html",
    overview:
      "36 Fragments of Midnight is a New Nintendo 3DS eShop platformer from Petite Games about collecting Midnight's lost star fragments. The loop is compact and score-run friendly: guide Midnight through a dark, hazard-filled stage, gather all 36 fragments, and survive spikes, lasers, and other traps. GCX should note the New 3DS-only compatibility and describe it as a minimalist precision platformer, not a broad adventure game.",
  },
  {
    id: "3ds-50-pinch-barrage",
    sourceUrl: "https://www.nintendoworldreport.com/review/39851/50-pinch-barrage-3ds-review",
    overview:
      "50 Pinch Barrage!! is a trap-dodging action game where a treasure hunter crash-lands on a dangerous island and has to survive 50 short crisis stages. Its appeal is fast trial-and-error movement: traps, hazards, timing windows, and simple controls create a portable obstacle-course rhythm closer to a frantic Pitfall-style challenge than a shooter. GCX should describe it as a compact 3DS eShop action gauntlet from Mobile & Game Studio/Oink Games.",
  },
  {
    id: "3ds-101-dinopets-3d",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/101-DinoPets-3D-770067.html",
    overview:
      "101 DinoPets 3D is Teyon's virtual-pet game built around adopting and caring for cartoon baby dinosaurs. Players feed, teach, dress up, and play with a dino companion, then enter pet shows to earn toys, food, furniture, and other rewards. GCX should present it as a child-friendly pet-simulation and mini-game package, useful for collectors because it sits beside Teyon's 101 Penguin Pets and 101 Pony Pets releases.",
  },
  {
    id: "3ds-101-penguin-pets-3d",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/101-Penguin-Pets-3D-843293.html",
    overview:
      "101 Penguin Pets 3D swaps Teyon's pet-sim template from dinosaurs to penguins, giving players a penguin friend to pamper, play with, and care for in stereoscopic 3D. The value is in light routine, cuteness, and mini-game-style interaction rather than deep simulation systems. GCX should describe it as part of Selectsoft and Teyon's 101 Pets line, with collector context tied to the eShop-era virtual-pet boom on 3DS.",
  },
  {
    id: "3ds-101-pony-pets-3d",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/101-Pony-Pets-3D-937313.html",
    overview:
      "101 Pony Pets 3D is the pony-focused entry in Teyon's 101 Pets 3D line. Players adopt from a large roster of ponies, care for them, teach them, dress them up, and play light activities together. GCX should position it as a casual virtual-pet release for younger players and collectors of 3DS lifestyle software, while separating it from more involved horse-riding simulations or Nintendogs-style first-party releases.",
  },
  {
    id: "3ds-1000m-zombie-escape",
    sourceUrl: "https://oinkgames.com/en/games/digital/1000m-zombie-escape",
    overview:
      "1000m Zombie Escape! is Oink Games' oddball 3DS action game about reaching a rescue helicopter 1,000 meters away while zombies close in. The twist is deliberately awkward movement: the frightened character can only rotate, so progress depends on timing taps, threading through gaps, and managing panic rather than aiming weapons. GCX should call it a reflex-survival action game with a comedic control hook, not a conventional shooter.",
  },
  {
    id: "3ds-accel-knights-2-full-throttle",
    sourceUrl: "https://lunaticobscurity.blogspot.com/2019/03/accel-knights-2-full-throttle-3ds.html",
    overview:
      "Accel Knights 2: Full Throttle is ArtePiazza's Japan-only 3DS action/RPG about futuristic knights on motorbikes, with bikes that can transform into power armor. That premise is the hook: it mixes fantasy-knight imagery, science-fiction racing energy, and battle encounters into a strange import eShop package. GCX should describe it as an obscure motorbike-jousting action RPG sequel rather than a plain action game, with collector appeal coming from ArtePiazza's unusual 3DS catalog.",
  },
  {
    id: "3ds-acrylic-palette-irodori-cafe-cheers",
    sourceUrl: "https://kotaku.com/games/acrylic-palette-irodori-cafe-cheers",
    overview:
      "Acrylic Palette: Irodori Cafe - Cheers is a Japan-only 3DS visual novel/communication game set in a fictional cafe. Its distinguishing hook is the use of real-life idols as in-game characters, turning the experience toward conversation, character routes, and fan interaction rather than combat or puzzle solving. GCX should frame it as an idol-cafe communication novel from Klon, especially relevant to collectors of niche Japanese 3DS story games.",
  },
  {
    id: "3ds-aikatsu-stars-first-appeal",
    sourceUrl: "https://nintendoeverything.com/tag/aikatsu-stars-my-special-appeal/",
    overview:
      "Aikatsu Stars! First Appeal is the free-to-play 3DS eShop companion to Bandai's Aikatsu Stars idol/card arcade franchise. It launched in Japan with the song Aikatsu Step, while additional music could be unlocked through 3DS Music Tickets connected to the Data Carddass ecosystem. GCX should describe it as a rhythm/idol fashion tie-in and an entry point for Aikatsu Stars on 3DS, not as a general adventure game.",
  },
  {
    id: "3ds-aikatsu-stars-my-special-appeal",
    sourceUrl: "https://en.wikipedia.org/wiki/Aikatsu_Stars%21",
    overview:
      "Aikatsu Stars! My Special Appeal is the fuller retail 3DS follow-up to First Appeal, tied to the Aikatsu Stars idol franchise and its Data Carddass fashion-performance loop. The core appeal is collecting and coordinating idol outfits, performing songs, and engaging with Yume Nijino's generation of Aikatsu characters. GCX should position it as the main 3DS Aikatsu Stars package for import collectors, released in Japan in November 2016.",
  },
  {
    id: "3ds-aikatsu-2-nin-no-my-princess",
    sourceUrl: "https://en.wikipedia.org/wiki/Aikatsu%21",
    overview:
      "Aikatsu! 2-nin no My Princess is a 3DS idol/fashion game from the original Aikatsu era, before Aikatsu Stars changed the cast and branding. Players engage with the Data Carddass-inspired loop of choosing coordinates, performing as idols, and following character events rather than exploring a traditional adventure map. GCX should describe it as an import idol-performance game for Aikatsu fans, distinct from the later Aikatsu Stars 3DS releases.",
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
    throw new Error(`Missing 3DS games: ${missing.map((entry) => entry.id).join(", ")}`);
  }

  const rows = [
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "3ds",
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
  console.log(`Wrote ${entries.length} reviewed 3DS overviews to ${path.relative(rootDir, outputPath)}`);
}

main();
