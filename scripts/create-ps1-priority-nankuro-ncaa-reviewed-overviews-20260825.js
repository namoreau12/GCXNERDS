const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-nankuro-ncaa-reviewed-overviews-2026-08-25.csv"
);

const rewrites = {
  "ps1-nankuro-4": {
    sourceUrl: "https://www.igdb.com/games/superlite-1500-series-nankuro-4",
    notes: "Priority PS1 weak-template cleanup; source confirms Success, SuperLite 1500 Series, PlayStation, 2001, and puzzle genre.",
    overview:
      "Nankuro 4 is a Success budget-line puzzle release in the SuperLite 1500 Series, aimed at players who want a compact logic challenge rather than character-driven presentation. Its appeal is the quiet loop of reading the grid, placing answers, and working through short puzzle sessions with minimal friction. For GCX, it belongs in the import-puzzle corner of the PS1 library: small, inexpensive-looking, and useful mainly to Japanese puzzle collectors or Success completists.",
  },
  "ps1-nantettantei-idol-the-jigsaw-puzzle": {
    sourceUrl: "https://psxdatacenter.com/games/J/S/SLPS-03473.html",
    notes: "Priority PS1 weak-template cleanup; source describes unlockable character images, jigsaw sizes, and Jigsaw/Time Attack modes.",
    overview:
      "Nantettantei Idol: The Jigsaw Puzzle turns the Nante Tantei Idol manga property into a Simple Characters 2000 jigsaw collection. Players unlock character images by solving puzzles across multiple grid sizes, with standard jigsaw play and a time-attack mode giving the package its structure. It is not a mystery adventure despite the detective-idol theme; its value is as a Bandai character-license puzzle disc for collectors who follow manga tie-ins and late PS1 budget releases.",
  },
  "ps1-nascar-99": {
    sourceUrl: "https://en.wikipedia.org/wiki/NASCAR_99",
    notes: "Priority PS1 weak-template cleanup; source covers drivers, tracks, crew-chief assistance, modes, and EA Sports series placement.",
    overview:
      "NASCAR 99 is EA Sports' second NASCAR entry and leans harder into licensed stock-car atmosphere than the earlier PlayStation game. It includes a 1998-era driver roster, legendary drivers, licensed tracks, two-player racing, pit strategy, and crew-chief or spotter guidance that helps sell the rhythm of oval racing. The PlayStation version is best framed as an accessible licensed NASCAR package: part sim, part living-room sports racer, and a clear annual upgrade for fans of the late-1990s Winston Cup scene.",
  },
  "ps1-nascar-2000": {
    sourceUrl: "https://en.wikipedia.org/wiki/NASCAR_2000",
    notes: "Priority PS1 short-overview cleanup; source covers 1999 Winston Cup basis, added drivers/legends, platforms, and series placement.",
    overview:
      "NASCAR 2000 updates EA's PlayStation stock-car line around the 1999 Winston Cup season, adding more contemporary names, several legends, and a broader licensed racing package than the early entries. The experience is still built on short-session race setup, drafting, pit timing, and learning how heavy NASCAR cars behave through traffic. As a collector record, it matters as one of the last PlayStation-era EA NASCAR releases before the series moved more fully toward the Thunder branding and sixth-generation hardware.",
  },
  "ps1-nascar-racing": {
    sourceUrl: "https://en.wikipedia.org/wiki/NASCAR_Racing_(video_game)",
    notes: "Priority PS1 weak-template cleanup; source covers Papyrus simulation roots, PlayStation version, drivers, racing scale, and reception split.",
    overview:
      "NASCAR Racing is the PlayStation conversion of Papyrus' influential PC stock-car simulation, and it carries a different identity from EA's flashier annual NASCAR titles. The focus is on heavier simulation feel, real-track discipline, race options, and the attempt to translate Papyrus' serious oval-racing approach to a console pad. Its visuals and pace can feel plain next to arcade racers, but for GCX it is important as a Sierra/Papyrus sim lineage entry in the PS1 library.",
  },
  "ps1-nascar-thunder-2002": {
    sourceUrl: "https://en.wikipedia.org/wiki/NASCAR_Thunder_2002",
    notes: "Priority PS1 weak-template cleanup; source distinguishes the PS1 version and lists modes, drivers, replay feature, fantasy tracks, and challenge/card system.",
    overview:
      "NASCAR Thunder 2002 is the PlayStation branch of EA's first Thunder-branded NASCAR release, separate from the PS2 and Xbox versions. It keeps the series' licensed Winston Cup identity but adapts it to late PS1 hardware with reduced race scale, instant replay, fantasy tracks, Daytona Beach, and a card-and-challenge structure that gives the older version its own progression hook. It is best described as a transitional NASCAR release: built for fans still on PS1 while EA's main racing showcase moved to newer consoles.",
  },
  "ps1-natsuiro-kenjutsu-komachi": {
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02667.html",
    notes: "Priority PS1 weak-template cleanup; source describes the school tournament premise, Akira protagonist role, Japanese language, and NEC Interchannel release.",
    overview:
      "Natsuiro Kenjutsu Komachi is a Japanese NEC Interchannel adventure/simulation release centered on a school tournament and the player character Akira, captain of Katsuragi Hall High School's athletic team. The appeal is character interaction and school-life scenario flow rather than action swordplay, so the title should sit closer to visual-novel and dating-sim adjacent collecting than to a fighting or sports category. It is a useful PS1 import record because the box promise can sound more action-oriented than the actual story-first structure.",
  },
  "ps1-navit": {
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02525.html",
    notes: "Priority PS1 weak-template cleanup; source describes traffic-control premise, simulation/strategy genre, Artdink connection, and PC origin.",
    overview:
      "Navit is an Artdink traffic-control simulation where the player works as a novice officer trying to restore order to increasingly stressful road conditions. Instead of adventure exploration, the core idea is reading traffic flow, reducing accidents, and making a messy urban space driveable again. That makes it a very Artdink-flavored PS1 import: odd, systems-minded, and closer to The Conveni or A-Train design logic than to mainstream console action.",
  },
  "ps1-nazo-oh": {
    sourceUrl: "https://retrounit.com.au/products/nazo-oh-playstation-ps1-ntsc-j-japan-bandai-adventure-quiz-game",
    notes: "Priority PS1 weak-template cleanup; source describes a fantasy-world quiz adventure premise with riddles and Bandai NTSC-J release details.",
    overview:
      "Nazo-Oh is a Bandai quiz-adventure oddity about a boy pulled into a strange fantasy world and pushed toward a citadel full of riddles. The structure mixes story framing with question-based progress, so it is better understood as a Japanese quiz game with adventure flavor than as a pure puzzle-board release. For collectors, the key draw is its unusual premise and Bandai import identity, especially for players interested in PS1 titles that use trivia and light narrative as their main play loop.",
  },
  "ps1-ncaa-gamebreaker-99": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_GameBreaker_99",
    notes: "Priority PS1 weak-template cleanup; source confirms Red Zone Interactive, 989 Studios, PlayStation, North America, and college football context.",
    overview:
      "NCAA GameBreaker 99 continues Sony's college-football line on PlayStation with a faster, television-sports style built around Division I-A teams, bowl-season fantasy, and the GameDay-related engine family. The draw is not pro roster realism but the college layer: schools, playbooks, rivalry energy, and a broader pageantry than Sony's NFL titles. It is a good fit for collectors building the 989 Sports football timeline, especially because the series occupied a real space before EA's NCAA Football became the dominant name.",
  },
  "ps1-ncaa-gamebreaker-2000": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_GameBreaker_2000",
    notes: "Priority PS1 weak-template cleanup; source confirms Red Zone Entertainment, 989 Sports, PlayStation, and cover athlete.",
    overview:
      "NCAA GameBreaker 2000 keeps the PlayStation series focused on college football spectacle, with Red Zone Entertainment and 989 Sports building around school identity, season play, multiplayer competition, and late-PS1 sports presentation. The Cade McNown cover places it squarely in the 1999 college-football moment. It should be presented as a continuation piece rather than a reinvention: useful for players who like Sony's faster GameDay-style football and for collectors following yearly 989 Sports releases.",
  },
  "ps1-ncaa-gamebreaker-2001": {
    sourceUrl: "https://archive.org/details/psx_ncaag2k1",
    notes: "Priority PS1 weak-template cleanup; source describes coach progression, 115 Division I-A teams, player export to NFL GameDay, and Keith Jackson commentary.",
    overview:
      "NCAA GameBreaker 2001 adds a stronger career-style hook to Sony's college football formula by letting players start as a lower-tier coach, improve performance, earn offers, and move through the Division I-A landscape. The PlayStation version also keeps the series connection to NFL GameDay through player export, while Keith Jackson's commentary reinforces the broadcast-college feel. It is one of the more interesting GameBreaker records because the coaching ladder gives it more identity than a simple annual roster refresh.",
  },
  "ps1-ncaa-gamebreaker-98": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_Gamebreaker_98",
    notes: "Priority PS1 short-overview cleanup; source covers GameDay 98 engine basis, Division I-A teams, historical teams, and playbook editor.",
    overview:
      "NCAA GameBreaker 98 is the PlayStation sequel that made Sony's college-football series feel more fully distinct from NFL GameDay. It uses the GameDay 98 engine foundation but adds college teams, historical squads, option-heavy play styles, and a playbook editor for changing routes and assignments. That editor is the standout collector note: it gives the disc a hands-on strategy angle and helps explain why contemporary reviews treated it as more than a pro-football reskin.",
  },
  "ps1-ncaa-march-madness-99": {
    sourceUrl: "https://www.pricecharting.com/game/playstation/ncaa-march-madness-99",
    notes: "Priority PS1 weak-template cleanup; source lists Dynasty Mode, 3-point shoot-out, momentum meter, polls, historical teams, and user-controlled dunks.",
    overview:
      "NCAA March Madness 99 is EA Sports' early PlayStation college-basketball sequel, built around tournament atmosphere, school identity, and a feature set that separates it from a plain NBA Live reskin. Dynasty Mode, weekly polls, historical teams, a 3-point shoot-out, momentum swings, and user-controlled dunks give it the college hoops texture players expected from the March Madness license. It is a useful companion record to EA's football and NBA lines because it shows the publisher building a broader NCAA sports catalog on PS1.",
  },
  "ps1-ncaa-march-madness-2000": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_March_Madness_2000",
    notes: "Priority PS1 weak-template cleanup; source confirms Black Ops Entertainment, EA Sports, PlayStation, 1999, and Steve Francis cover.",
    overview:
      "NCAA March Madness 2000 is the Steve Francis-cover entry in EA's PlayStation college-basketball series, developed by Black Ops Entertainment. It keeps the focus on NCAA teams, tournament runs, and multiplayer-friendly hoops while carrying the late-PS1 EA Sports presentation style. For GCX, the important distinction is that this is a college basketball record, not a generic sports placeholder: it belongs with the March Madness lineage that ran alongside EA's NBA Live and NCAA Football brands.",
  },
};

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function currentOverviewFor(game) {
  return game.description || game.gcxOverview || game.overview || "";
}

const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
const byId = new Map(games.map((game) => [game.id, game]));
const headers = [
  "platformSlug",
  "gameId",
  "title",
  "currentOverview",
  "sourceUrl",
  "rewriteNotes",
  "newOverview",
  "reviewStatus",
  "reviewer",
];

const rows = Object.entries(rewrites).map(([gameId, rewrite]) => {
  const game = byId.get(gameId);
  if (!game) throw new Error(`Missing PS1 game: ${gameId}`);
  return {
    platformSlug: "ps1",
    gameId,
    title: game.title,
    currentOverview: currentOverviewFor(game),
    sourceUrl: rewrite.sourceUrl,
    rewriteNotes: rewrite.notes,
    newOverview: rewrite.overview,
    reviewStatus: "reviewed",
    reviewer: "GCX editorial cleanup",
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")).join("\n")}\n`,
  "utf8"
);

console.log(
  JSON.stringify(
    {
      ok: true,
      outputPath: path.relative(rootDir, outputPath),
      rows: rows.length,
    },
    null,
    2
  )
);
