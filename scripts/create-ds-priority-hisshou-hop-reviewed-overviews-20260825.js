const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-hisshou-hop-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-hisshou-pachinko-pachi-slot-kouryaku-series-ds-vol-4-shinseiki-evangelion-saigo-no-mono",
    sourceUrl:
      "https://gamesdb.launchbox-app.com/games/images/132049-hisshou-pachinko-pachi-slot-kouryaku-series-ds-vol-4-cr-shinseiki-evangelion-saigo-no-shisha",
    overview:
      "Hisshou Pachinko Pachi-Slot Kouryaku Series DS Vol. 4: Shinseiki Evangelion - Saigo no Mono is a Japan-only handheld pachinko simulation from D3Publisher. Rather than a conventional casino compilation, it is part of the Evangelion-branded home versions of real pachinko machines, letting players practice or study the rhythm of a specific CR Evangelion release. The value is niche but clear: licensed Eva presentation, machine recreation, and portable pachinko analysis for fans of Japanese parlor games.",
  },
  {
    id: "ds-hisshou-pachinko-pachi-slot-kouryaku-series-ds-vol-5-shinseiki-evangelion-tamashii-no-kiseki",
    sourceUrl:
      "https://gamesdb.launchbox-app.com/games/images/142000-hisshou-pachinko-pachi-slot-kouryaku-series-ds-vol-5-shinseiki-evangelion-tamashii-no-kiseki",
    overview:
      "Hisshou Pachinko Pachi-Slot Kouryaku Series DS Vol. 5: Shinseiki Evangelion - Tamashii no Kiseki continues D3Publisher's DS line of Evangelion pachinko simulations. LaunchBox lists it as a 2010 Nintendo DS release, and VGChartz identifies it as a pachinko simulator developed around Bisty's Evangelion machine. Its appeal is not broad action play; it is a portable version of a specific Japanese parlor experience, aimed at players who want to learn patterns, watch Eva-themed presentation, and test outcomes without sitting at a cabinet.",
  },
  {
    id: "ds-history-great-empires-rome",
    sourceUrl: "https://forum.slitherine.com/viewtopic.php?t=4367",
    overview:
      "History: Great Empires - Rome is a Slitherine strategy game that puts the Roman world into a compact DS format. Slitherine described more than twenty playable or opposing sides representing nations from the Roman Republic and early Empire era, with city building, population control, resource use, and expansion as core concerns. It is a historical strategy title rather than an RPG, built for players who want empire management and turn-by-turn planning on a handheld.",
  },
  {
    id: "ds-hokuto-no-ken-hokuto-shinken-denshousha-no-michi",
    sourceUrl:
      "https://gamesdb.launchbox-app.com/games/details/129093-hokuto-no-ken-hokuto-shinken-denshousha-no-michi",
    overview:
      "Hokuto no Ken: Hokuto Shinken Denshousha no Michi is a Fist of the North Star DS game built around touch-screen pressure-point action. LaunchBox describes it as a 'vital point striking' game where players control Kenshiro and tap enemy weak points on the DS screen, while specialist coverage frames it as an interactive version of the manga running from Kenshiro's introduction through the Raoh conflict. It is closer to digital comic action than a traditional fighter.",
  },
  {
    id: "ds-holly-hobbie-and-friends",
    sourceUrl: "https://ds.gamespy.com/nintendo-ds/holly-hobbie-friends/",
    overview:
      "Holly Hobbie & Friends is a DS party/minigame adaptation of the American Greetings and Nickelodeon-era Holly Hobbie series. GameSpy describes a set of fourteen touch-screen minigames built around activities such as cooking, ice skating, biking, dancing, and poster design. The result is a light licensed game for younger players, focused on quick stylus activities and friendship-themed presentation rather than exploration-heavy adventure design.",
  },
  {
    id: "ds-hollywood-files-deadly-intrigues",
    sourceUrl: "https://www.cubed3.com/games/reviews/nintendo-ds/hollywood-files-deadly-intrigues",
    overview:
      "Hollywood Files: Deadly Intrigues is a hidden-object detective game from Foreign Media. Cubed3 reviewed it as a straightforward hidden-object affair with a detective story wrapped around the usual object-finding and investigation beats. That makes it a better fit for casual mystery fans than for action players: scenes are searched for clues, the plot provides a Hollywood crime frame, and the pacing depends on observation and puzzle repetition.",
  },
  {
    id: "ds-honda-atv-fever",
    sourceUrl: "https://en.wikipedia.org/wiki/Honda_ATV_Fever",
    overview:
      "Honda ATV Fever is an off-road racing game from Beyond Reality Games built around licensed Honda all-terrain vehicles. Players choose from eleven Honda ATVs, race through stadiums, dirt tracks, off-road routes, and mountain settings, and use boosts, jumps, contact, and track objects to break away from rivals. Reviews were rough on the controls and difficulty, but the game is still best cataloged as a budget handheld ATV racer with real-brand vehicle appeal.",
  },
  {
    id: "ds-hop-the-movie-game",
    sourceUrl: "https://www.comicsonline.com/2011/04/_ds_game_review_hop_the_movie_game/",
    overview:
      "Hop: The Movie Game is a Nintendo DS tie-in to the 2011 film, developed by Engine Software for 505 Games. ComicsOnline describes the main setup as playing around Fred and E.B.'s effort to save Easter from Carlos and his minions, with the DS version leaning into movie-license adventure and minigame structure. It is not a strategy game; it is a kid-friendly licensed release built around short activities, simple objectives, and recognizable characters from the film.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on publisher, database, review, and specialist gameplay sources.",
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
