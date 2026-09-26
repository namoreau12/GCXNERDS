const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(rootDir, "data", "games", "reviewed-overview-imports", "ds-priority-hannah-heathcliff-reviewed-overviews-2026-08-24.csv");

const reviewedOverviews = {
  "ds-hannah-montana-the-movie":
    "Hannah Montana: The Movie on Nintendo DS follows the film tie-in with short adventure tasks, rhythm-flavored moments, and light exploration built around Miley/Hannah's pop-star life. Its appeal is mostly licensed Disney collecting, approachable play, and the n-Space handheld adaptation rather than deep systems.",
  "ds-hanshin-tigers-ds":
    "Hanshin Tigers DS is a Japan-focused baseball release centered on the real Hanshin Tigers brand and fan culture. It fits the DS sports niche as a team-specific curiosity, with value coming from its regional identity, Spike publishing credit, and appeal to collectors who track Japanese baseball software.",
  "ds-happy-bakery":
    "Happy Bakery is a light management and cooking-themed DS game about running a bakery through repeatable shop tasks and simple progression loops. It belongs to the handheld lifestyle-sim corner of the library, where touch controls, quick routines, and cozy presentation matter more than action.",
  "ds-happy-cooking":
    "Happy Cooking turns meal preparation into a touch-screen routine, asking players to follow steps, manage ingredients, and complete cooking challenges in short sessions. The MTO-developed DS release sits alongside other casual cooking games that used the handheld's stylus as the main hook.",
  "ds-happy-happy-clover":
    "Happy Happy Clover adapts the manga about Clover and her animal friends into a gentle DS adventure aimed at younger players. Expect character errands, friendly exploration, and a soft storybook tone, making the TDK Core release most relevant as a licensed Japanese character-game collectible.",
  "ds-happy-hippos-on-tour":
    "Happy Hippos On Tour is a mini-game collection built around quick, simple activities featuring the Happy Hippo characters. It is best understood as a casual European DS release, with short-session play and novelty-brand collecting doing more work than campaign depth or competitive systems.",
  "ds-happy-my-sweets":
    "Happy My Sweets is a bakery and sweets-themed DS simulation where the draw is routine, presentation, and small task completion. The Global A release fits the platform's casual-life-sim lane, especially for collectors interested in lesser-known Japanese lifestyle games.",
  "ds-harlem-globetrotters-world-tour":
    "Harlem Globetrotters: World Tour brings the exhibition basketball team's trick-shot identity to Nintendo DS. Rather than chasing strict sports simulation, it leans on arcade-style basketball, recognizable branding, and portable novelty value from Destination Software's licensed handheld catalog.",
  "ds-harobots-action":
    "Harobots Action! is a Sunrise Interactive DS action game built around the Haro mascot from Gundam-related media. It is a niche licensed import where the hook is character recognition, quick action challenges, and crossover curiosity more than a mainstream action-game profile.",
  "ds-harukanaru-toki-no-naka-de-maihitoyo":
    "Harukanaru Toki no Naka de: Maihitoyo is a Koei otome visual-novel entry connected to the long-running Harukanaru Toki no Naka de series. The DS version is about character routes, romantic drama, and portable story play, making it mainly relevant for import and otome collectors.",
  "ds-harukanaru-toki-no-naka-de-yumenoukihashi":
    "Harukanaru Toki no Naka de: Yumenoukihashi continues Koei's otome-focused Harukanaru series on Nintendo DS. It is a story-first release built around dialogue, cast relationships, and fan-service crossover appeal for players already invested in the franchise's historical-fantasy setting.",
  "ds-hasbro-family-game-night":
    "Hasbro Family Game Night packages familiar board-game brands into a DS-friendly party format, trading physical pieces for quick digital rounds and simple multiplayer-ready rules. Its place in the library is as an accessible family compilation tied to Electronic Arts' Hasbro license.",
  "ds-have-fun-with-crosswords":
    "Have Fun With Crosswords is a puzzle-focused DS release built for short word-game sessions. The value is straightforward: stylus entry, portable crossword play, and a no-frills design for players who used the DS as a travel puzzle book rather than an action machine.",
  "ds-hayarigami-2-ds-toshidensetsu-kaii-jiken":
    "Hayarigami 2 DS: Toshidensetsu Kaii Jiken is a portable entry in Nippon Ichi's urban-legend mystery series. It emphasizes investigative reading, branching deductions, and supernatural crime atmosphere, making it a stronger fit for Japanese adventure fans than for action-oriented DS players.",
  "ds-hayarigami-ds-toshidensetsu-kaii-jiken":
    "Hayarigami DS: Toshidensetsu Kaii Jiken brings Nippon Ichi's horror-tinged detective adventure to Nintendo DS. The experience is driven by case files, text-heavy investigation, and urban-legend storytelling, with collector interest tied to its Japanese adventure-game niche.",
  "ds-hayate-no-gotoku-boku-ga-romeo-de-romeo-ga-boku-de":
    "Hayate no Gotoku!: Boku ga Romeo de Romeo ga Boku de is a DS visual novel based on Hayate the Combat Butler. HuneX and Konami frame the appeal around character comedy, dialogue choices, and franchise-specific scenarios rather than broad action or puzzle design.",
  "ds-hayate-no-gotoku-ojo-sama-produce-daisakusen-bokuiro-ni-somare-gakkou-hen":
    "Hayate no Gotoku!: Ojō-sama Produce Daisakusen Bokuiro ni Somare! Gakkou-Hen is a school-side DS visual-novel spin on Hayate the Combat Butler. It is aimed at series fans, with character interactions, light scenario management, and import appeal carrying the experience.",
  "ds-hayate-no-gotoku-ojo-sama-produce-daisakusen-bokuiro-ni-somare-oyashiki-hen":
    "Hayate no Gotoku!: Ojō-sama Produce Daisakusen Bokuiro ni Somare! Oyashiki-Hen is the mansion-side companion to Konami's Hayate DS visual-novel releases. It leans into fan scenarios, cast moments, and HuneX's character-adventure format for players following the anime and manga.",
  "ds-heartcatch-precure-oshare-collection":
    "HeartCatch PreCure! Oshare Collection is a DS fashion and character collection release tied to the HeartCatch PreCure anime. Its audience is younger series fans and import collectors, with outfit play, character presentation, and Bandai's licensed catalog history defining the appeal.",
  "ds-heathcliff-frantic-foto":
    "Heathcliff! Frantic Foto is a casual DS game based on the comic-strip cat, built around photo-themed mini-games and simple character challenges. It is a small licensed release from Storm City Games, most notable for collectors tracking unusual cartoon adaptations on Nintendo DS.",
};

const headers = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = Object.entries(reviewedOverviews).map(([gameId, newOverview]) => {
    const game = byId.get(gameId);
    if (!game) throw new Error(`Missing DS game ${gameId}`);
    return {
      platformSlug: "ds",
      gameId,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: game.articleUrl || game.descriptionSourceUrl || "",
      rewriteNotes: "Priority DS weak-template cleanup; original GCX editorial overview based on available platform, publisher, developer, franchise, and source-page context.",
      newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX editorial cleanup",
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
