const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-letsplaygarden-lingo-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ds-let-s-play-garden",
    title: "Let's Play Garden",
    sourceUrl: "https://ds.gamespy.com/nintendo-ds/lets-play-garden/",
    newOverview:
      "Let's Play Garden is a Deep Silver Nintendo DS management sim about creating and maintaining a customizable garden across the seasons. GameSpy's feature listing describes garden decoration, seasonal variation, and activity-driven play, while retail summaries compare its light routine structure to approachable farm and garden management games. GCX should present it as part of the casual Let's Play lifestyle line, with the appeal coming from planning plots, unlocking plants, and stylus-friendly minigames.",
  },
  {
    gameId: "ds-let-s-play-journalists",
    title: "Let's Play Journalists",
    sourceUrl: "https://www.gamesmen.com.au/let-s-play-journalists-pre-owned",
    newOverview:
      "Let's Play Journalists turns Deep Silver's casual career format into a kid-friendly investigation about missing animals. Retail descriptions tell players to keep a camera and notepad ready, process photos in a dark room, choose pictures for stories, collect evidence, interview townspeople, and complete new daily missions. GCX should describe it as a light mystery-reporting sim for the DS audience that liked job-role play rather than a generic management title.",
  },
  {
    gameId: "ds-let-s-play-pet-hospitals",
    title: "Let's Play Pet Hospitals",
    sourceUrl: "https://kotaku.com/games/lets-play-pet-hospital",
    newOverview:
      "Let's Play Pet Hospitals is a Biodroid Productions pet-care simulation published by Deep Silver for Nintendo DS and PC. Public summaries describe the player acting as a veterinarian, caring for sick, abandoned, or escaped animals, feeding and treating them, advising owners, and finding homes for pets that need them. GCX should frame it as a veterinary-care entry in the Let's Play line, especially relevant to collectors tracking DS animal-care software.",
  },
  {
    gameId: "ds-let-s-play-schools",
    title: "Let's Play Schools",
    sourceUrl: "https://fr.wikipedia.org/wiki/Jouons_%C3%A0_la_ma%C3%AEtresse",
    newOverview:
      "Let's Play Schools, released in France as Jouons a la maitresse, is a ZigZag Island and Deep Silver DS simulation about a young teacher's first days in class. French documentation describes a 3D school setting, point-and-click movement, and 13 stylus minigames covering music, jump rope, cafeteria supervision, dance, puzzles, crafts, hopscotch, care, exams, naps, painting, dressing, and tidying the classroom. GCX should describe it as a classroom-role sim rather than a broad life-management game.",
  },
  {
    gameId: "ds-let-s-ride-friends-forever",
    title: "Let's Ride: Friends Forever",
    sourceUrl: "https://www.honestgamers.com/56561/ds/lets-ride-friends-forever/game.html",
    newOverview:
      "Let's Ride: Friends Forever is a THQ horse-care simulation developed by Independent Arts for Nintendo DS, with HonestGamers listing the North American DS release on 3 March 2008. The game sits in the handheld horse-riding and stable-care space, emphasizing bonding with a horse, routine care, and approachable equestrian activities rather than sports-racing depth. GCX should file it with DS animal and hobby sims, useful for collectors following THQ's family-oriented handheld catalog.",
  },
  {
    gameId: "ds-lettriq",
    title: "Lettriq",
    sourceUrl: "https://fr.wikipedia.org/wiki/Lettriq",
    newOverview:
      "Lettriq is a French Nintendo DS word-and-logic game from Vocabelum, released in 2007 with solo and multiplayer support. French documentation classifies it as a reflexion game and notes Jeuxvideo.com's 12/20 review, making it more of a localized language-brain-teaser than a school utility. GCX should describe it as a Europe-focused word puzzle release for players interested in vocabulary challenges and regional DS oddities.",
  },
  {
    gameId: "ds-lilpri-ds-hime-chen-apple-pink",
    title: "Lilpri DS: Hime-Chen! Apple Pink",
    sourceUrl: "https://www.gamecash.fr/lilpri-ds-hime-chen-apple-pink-import-japonais-e97041.html",
    newOverview:
      "Lilpri DS: Hime-Chen! Apple Pink is a Japan-only Sega DS release tied to the Lilpri princess-idol property, listed by import retailers as an August 2010 Japanese DS visual novel. The title's Hime-Chen branding points to transformation and idol-princess fantasy rather than a conventional adventure structure. GCX should present it as a licensed shojo/idol import where collector interest comes from the Sega credit, anime tie-in appeal, and Japan-only availability.",
  },
  {
    gameId: "ds-lingo",
    title: "Lingo",
    sourceUrl: "https://www.mobygames.com/game/159323/lingo/",
    newOverview:
      "Lingo is the Nintendo DS adaptation of the Dutch TV word game, published by Media Sales & Licensing in 2011. MobyGames describes it as the official adaptation of a popular word-based show, while Dutch listings explain that players test vocabulary through word-guessing modes against the computer or friends. GCX should describe it as a localized game-show word puzzle release, valuable mainly as a regional DS curiosity.",
  },
  {
    gameId: "ds-lingo-deluxe",
    title: "Lingo Deluxe",
    sourceUrl: "https://www.dutchgamesindustry.nl/game/lingo-deluxe",
    newOverview:
      "Lingo Deluxe is an expanded Nintendo DS version of the Dutch game show adaptation, developed by Engine Software and published by Media Sales & Licensing. Dutch Games Industry lists it as a console release based on the Lingo TV show, with licensed-game and bingo-show roots. GCX should separate it from the standard Lingo entry as the later deluxe package for Dutch word-game fans and collectors of local television tie-ins.",
  },
  {
    gameId: "ds-lingo-voor-kinderen",
    title: "Lingo voor kinderen",
    sourceUrl: "https://www.mobygames.com/game/159324/lingo-voor-kinderen/",
    newOverview:
      "Lingo voor kinderen is the child-focused Nintendo DS version of the Dutch Lingo word-game format. MobyGames describes it as an official adaptation of the popular word-based TV show made suitable for younger children, and Dutch retail copy emphasizes vocabulary building through colorful, approachable word puzzles. GCX should describe it as an educational regional spin-off, distinct from Lingo Deluxe because it aims at younger vocabulary practice.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing DS game record for ${gameId}`);
  return game.description || game.gcxOverview || game.overview || "";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const header = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];
const csv = [
  header.join(","),
  ...rows.map((row) =>
    [
      "ds",
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority DS weak-template replacement with source-backed GCX editorial overview.",
      row.newOverview,
      "approved",
      "GCX Editorial",
    ]
      .map(csvCell)
      .join(",")
  ),
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rowCount: rows.length }, null, 2));
