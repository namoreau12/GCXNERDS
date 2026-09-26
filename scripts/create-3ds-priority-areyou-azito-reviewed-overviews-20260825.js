const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const platformSlug = "3ds";
const dataPath = path.join(rootDir, "data", "games", `${platformSlug}.json`);
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-areyou-azito-reviewed-overviews-2026-08-25.csv"
);

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function currentOverviewFor(game) {
  return game.description || game.gcxOverview || game.overview || "";
}

const reviewed = {
  "3ds-are-you-smarter-than-a-5th-grader": {
    sourceUrl: "https://www.nintendoworldreport.com/game/41091/are-you-smarter-than-a-5th-grader-nintendo-3ds",
    rewriteNotes: "Source cross-check: Nintendo World Report identifies the 3DS release, GameMill publisher, Black Lantern developer, party/parlor genre, one-player structure, and September 3, 2015 North American release.",
    newOverview:
      "Are You Smarter Than A 5th Grader? brings the TV quiz-show format to 3DS as a one-player trivia game from Black Lantern Studios and GameMill. The appeal is answering grade-school subject questions inside the familiar classroom premise, not practicing lessons like a study app. For collectors, it is a late North American 3DS licensed release tied to the 2015 Fox revival of the franchise."
  },
  "3ds-arrow-of-laputa-kage-nashi-sensei-to-kiron-no-fuuken": {
    sourceUrl: "https://kotaku.com/games/arrow-of-laputa-kage-nashi-sensei-to-kiron-no-fuuken",
    rewriteNotes: "Source cross-check: Kotaku/IGDB metadata describes an ArtePiazza-developed Nintendo 3DS sequel to the tower-defense DSiWare title Arrow of Laputa.",
    newOverview:
      "Arrow of Laputa: Kage Nashi Sensei to Kiron no Fuuken is ArtePiazza's 3DS follow-up to the earlier Arrow of Laputa tower-defense idea. Rather than a broad strategy game, its identity is more specific: planning defenses and responding to enemy pressure through an import-only fantasy tower-defense structure. GCX should flag it as a Japan-only ArtePiazza 3DS curiosity for players tracking eShop strategy releases and developer oddities outside Dragon Quest support work."
  },
  "3ds-ascent-of-kings": {
    sourceUrl: "https://www.nintendo.com/en-gb/Games/New-Nintendo-3DS-Download-Software/Ascent-of-Kings-1216853.html",
    rewriteNotes: "Source cross-check: Nintendo page frames the story as the death of a king and a youngest brother trying to prove himself; review/source records identify exploration-platforming and ability-gated areas.",
    newOverview:
      "Ascent of Kings is a compact Nostatic Software adventure-platformer about a young prince trying to prove he can become king after his father's death. Its value comes from short-form exploration, simple platforming, and ability-gated routes rather than long campaign scale. For GCX, it should be treated as a bite-sized New Nintendo 3DS eShop indie with light Metroid-style discovery, not a strategy title."
  },
  "3ds-asdivine-cross": {
    sourceUrl: "https://www.kemco-games.com/global/pr/ac_3ds.html",
    rewriteNotes: "Source cross-check: Kemco 3DS release describes Exe Create RPG structure, Trust Gauge, magic/skill combos, auto-battle tactics, adjustable difficulty, and single-player RPG framing.",
    newOverview:
      "Asdivine Cross is a Kemco and Exe Create fantasy RPG port built around party battles, character trust, and classic menu-driven progression. The 3DS version emphasizes turn-based combat with a Trust Gauge, combined magic and skill attacks, auto-battle tactics, and adjustable difficulty. It is a good example of Kemco's eShop RPG pipeline: modest production values, familiar quest structure, and enough battle systems to serve players looking for a portable comfort-food JRPG."
  },
  "3ds-ash": {
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/ASH-1145768.html",
    rewriteNotes: "Source cross-check: Nintendo page describes Ash as a classic turn-based RPG with a fully realized world and story; article records identify SRRN Games, Circle Entertainment, and 3DS eShop port context.",
    newOverview:
      "Ash is a Circle Entertainment 3DS eShop port of SRRN Games' earlier mobile RPG, rebuilt around traditional turn-based battles and story-driven exploration. It presents itself as a classic-style RPG with a large fantasy world, character drama, and single-player progression rather than action-adventure play. The collector note is that this is a digital-first mobile-to-3DS conversion, useful for documenting the handheld's smaller eShop RPG catalog."
  },
  "3ds-ashiato-reversi-kumamon-version": {
    sourceUrl: "https://giantbomb.com/wiki/Games/Ashiato_Reversi_Kumamon_Version",
    rewriteNotes: "Source cross-check: database records identify Ashiato Reversi: Kumamon Version as a Silver Star Japan Nintendo 3DS eShop release from November 12, 2014.",
    newOverview:
      "Ashiato Reversi: Kumamon Version is a SilverStar Japan 3DS eShop board-game release built around Reversi with Kumamon character branding. The important correction is that it is not a generic puzzle adventure: the play identity is the familiar disc-flipping territory game, packaged as a themed digital download. For collectors, it belongs with Japan-only 3DS eShop curios and mascot-branded traditional games."
  },
  "3ds-asonde-shogi-ga-tsuyoku-naru-ginsei-shogi-dx": {
    sourceUrl: "https://www.amazon.co.jp/%E3%82%B7%E3%83%AB%E3%83%90%E3%83%BC%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%B8%E3%83%A3%E3%83%91%E3%83%B3-%E9%81%8A%E3%82%93%E3%81%A7%E5%B0%86%E6%A3%8B%E3%81%8C%E5%BC%B7%E3%81%8F%E3%81%AA%E3%82%8B-%E9%8A%80%E6%98%9F%E5%B0%86%E6%A3%8BDX-3DS/dp/B00WSI2BRW",
    rewriteNotes: "Source cross-check: product description identifies upgraded Ginsei Shogi DS-to-3DS release, broad difficulty range, beginner support, shogi classroom, hints, piece influence display, and opening-book support.",
    newOverview:
      "Asonde Shogi ga Tsuyoku Naru Ginsei Shogi DX is a SilverStar shogi training release for 3DS, aimed at both beginners and stronger players who want portable practice. It includes rule-learning support, hint tools, piece-influence displays, adjustable opponent strength, and opening-book support for more serious play. GCX should describe it as a shogi study and match tool, not as a generic puzzle game."
  },
  "3ds-assassination-classroom-grand-siege-on-koro-sensei": {
    sourceUrl: "https://en.wikipedia.org/wiki/Assassination_Classroom:_Grand_Siege_on_Koro-sensei",
    rewriteNotes: "Source cross-check: article describes mission-based action, firearms, trap placement, trap combos, fever time, occasional Koro-sensei missions, Japan-only 2015 release, and Bandai Namco development/publishing.",
    newOverview:
      "Assassination Classroom: Grand Siege on Koro-sensei turns the manga's impossible assassination premise into mission-based 3DS action. Players control a Kunugigaoka student, use firearms and traps to pressure Koro-sensei under mission conditions, and can chain traps into combo opportunities; some missions even shift control to Koro-sensei. It is a fan-focused Japan-only adaptation where the style and black-comedy setup matter as much as the action mechanics."
  },
  "3ds-asterix-the-mansions-of-the-gods": {
    sourceUrl: "https://www.mobygames.com/game/100401/asterix-the-mansions-of-the-gods/",
    rewriteNotes: "Source cross-check: MobyGames/HonestGamers records identify Neopica/Bigben 3DS release and describe Asterix, Obelix, and Dogmatix in adventures inspired by the comic/film setting.",
    newOverview:
      "Asterix: The Mansions of the Gods is a 3DS licensed action-adventure from Neopica and Bigben built around the Asterix film and comic setting. The player moves through Gaulish village material and related adventures with Asterix, Obelix, and Dogmatix rather than entering a deep open-ended adventure. Its value for GCX is as a European-style licensed 3DS release connected to a specific Asterix movie adaptation."
  },
  "3ds-astro": {
    sourceUrl: "https://www.digitallydownloaded.net/2013/10/review-astro-3ds.html",
    rewriteNotes: "Source cross-check: review/database records describe 7 Raven/Enjoy Gaming 3DS action release, wave-based space combat, 18 enemies, eight levels, and four sections per level.",
    newOverview:
      "Astro is a 7 Raven Studios and Enjoy Gaming 3DS action shooter built around space backdrops, enemy waves, and level-by-level survival. Its structure is straightforward: move through eight levels broken into smaller sections while fighting repeated waves drawn from a modest enemy roster. GCX should present it as a small eShop shooter with simple arcade pacing, not as a broad adventure or strategy game."
  },
  "3ds-atlantic-quest": {
    sourceUrl: "https://www.nintendolife.com/reviews/3ds-eshop/atlantic_quest",
    rewriteNotes: "Source cross-check: Nintendo Life/Nintendo records describe underwater match-three play, touchscreen tile sliding, 120 levels, and saving ocean creatures from an oil spill.",
    newOverview:
      "Atlantic Quest is an underwater match-three puzzle game where players slide tiles with the touchscreen to complete missions across a long set of stages. The story frame has a team of sea creatures trying to save the ocean from an oil spill, but the moment-to-moment play is accessible tile matching and score-building. For GCX, it should be filed as casual 3DS eShop puzzle software, not a generic adventure entry."
  },
  "3ds-atlantis-6": {
    sourceUrl: "https://www.nintendo.com/es-es/Juegos/Programas-descargables-Nintendo-3DS/Atlantis-6-1858228.html",
    rewriteNotes: "Source cross-check: Nintendo Europe listing and 3DSDB identify Atlantis-6 as Nintendo 3DS download software from Igor/Vadim Gafton in Europe/Australia; public gameplay detail is thin, so copy is intentionally conservative.",
    newOverview:
      "Atlantis-6 is a small Europe/Australia 3DS eShop release credited to Igor/Vadim Gafton, with very limited public documentation compared with better-known retail games. GCX should not overstate the premise: the reliable collector facts are that it was a Nintendo 3DS download title, tied to the late eShop catalog, and likely of interest mainly to complete-library trackers. Its overview should stay conservative until stronger official gameplay material is available."
  },
  "3ds-automaton-lung": {
    sourceUrl: "https://lukewasthefish.itch.io/automaton-lung",
    rewriteNotes: "Source cross-check: developer page describes Automaton Lung as originally on Nintendo 3DS eShop, experimental adventure/exploration, skating, shooting, flying, over 40 locations, and a strange information-light world.",
    newOverview:
      "Automaton Lung is Luke Vincent's experimental 3DS eShop exploration game, later preserved on PC, where players skate, shoot, and fly through more than 40 strange locations. It is intentionally cryptic, asking players to read the world, question what they see, and discover routes without much explanation. For GCX, it stands out as one of the more distinctive late 3DS indie curios: part platformer, part exploration toy, part surreal collectathon."
  },
  "3ds-azada": {
    sourceUrl: "https://en.wikipedia.org/wiki/Azada_(video_game)",
    rewriteNotes: "Source cross-check: article describes Big Fish puzzle game, magical book story, hidden objects, chain-of-actions puzzles, chapter structure, time limits, and 3DS release.",
    newOverview:
      "Azada is Big Fish's puzzle-adventure game about freeing Titus from a magical book by solving the ancient puzzles inside it. Its core loop mixes hidden-object searching, item use, room logic, chained actions, and chapter-based timed puzzles in the casual-adventure style Big Fish helped popularize. The 3DS version belongs in the library as a portable conversion of a PC casual-game hit, not as a standard adventure platformer."
  },
  "3ds-azito-3d": {
    sourceUrl: "https://www.siliconera.com/instead-of-piloting-giant-robots-you-maintain-the-hangar/",
    rewriteNotes: "Source cross-check: Siliconera describes Azito 3D as a Hamster simulation where players run an underground facility that builds giant robots to fight monsters attacking the city above.",
    newOverview:
      "Azito 3D is a Hamster 3DS simulation about managing the hidden base behind tokusatsu-style heroes and giant robots. Instead of piloting the machines directly, the player maintains an underground facility, develops the resources needed to build defenders, and supports battles against monsters threatening the city above. That management angle makes it much more specific and interesting than a generic simulation label suggests."
  }
};

function main() {
  const games = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const rows = Object.entries(reviewed).map(([gameId, review]) => {
    const game = games.find((item) => item.id === gameId);
    if (!game) throw new Error(`Missing game ${gameId}`);
    return {
      platformSlug,
      gameId,
      title: game.title || game.name || "",
      currentOverview: currentOverviewFor(game),
      sourceUrl: review.sourceUrl,
      rewriteNotes: review.rewriteNotes,
      newOverview: review.newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX Editorial"
    };
  });

  const headers = [
    "platformSlug",
    "gameId",
    "title",
    "currentOverview",
    "sourceUrl",
    "rewriteNotes",
    "newOverview",
    "reviewStatus",
    "reviewer"
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );

  console.log(JSON.stringify({ outputPath, rowCount: rows.length }, null, 2));
}

main();
