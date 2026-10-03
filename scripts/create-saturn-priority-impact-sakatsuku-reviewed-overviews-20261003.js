const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "saturn.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "saturn-priority-impact-sakatsuku-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "saturn-impact-racing",
    sourceUrl: "https://www.mobygames.com/game/24208/impact-racing/",
    overview:
      "Impact Racing is Funcom Dublin's combat-racing game for Sega Saturn and PlayStation, with the Saturn version published by Acclaim in North America and JVC Musical Industries in PAL regions. MobyGames identifies the Saturn release and credits Funcom, while screenshots and contemporary listings show the core loop as driving fast, shooting while racing, grabbing upgrades, and chasing high scores. Collectors should separate the Saturn release from the PlayStation version and check region, case/manual condition, and publisher variant.",
  },
  {
    id: "saturn-initial-d-kodo-saisoku-densetsu",
    sourceUrl: "https://initiald.fandom.com/wiki/Initial_D:_Fastest_Public_Road_Legend",
    overview:
      "Initial D: Kôdô Saisoku Densetsu is Genki and Kodansha's Japan-only Sega Saturn adaptation of Shuichi Shigeno's mountain-street-racing series. The game centers on touge battles tied to Initial D's early cast and cars rather than a generic Saturn racing shell, making the license and Japanese-market release the main collector hooks. Important listing details include the Saturn import format, spine card/manual condition, title romanization, and whether the buyer is looking for this 1998 Genki game rather than later arcade or PlayStation entries.",
  },
  {
    id: "saturn-ippatsu-gyakuten-gambling-king-he-no-michi",
    sourceUrl: "https://www.mobygames.com/game/209695/ippatsu-gyakuten-gamble-king-e-no-michi/",
    overview:
      "Ippatsu Gyakuten: Gambling King he no Michi is a 1996 Sega Saturn gambling simulation with a stronger story element than a simple table-game collection. MobyGames identifies Planning Office WADA as developer, the Saturn release date, and the game's gambling-sim focus. For collectors, the useful distinction is that this is a Japan-only Saturn oddity built around casino-style progression and narrative context, with condition, region, and title spelling doing most of the identification work.",
  },
  {
    id: "saturn-irem-arcade-classics",
    sourceUrl: "https://strategywiki.org/wiki/Irem_Arcade_Classics",
    overview:
      "Irem Arcade Classics is a Japanese Sega Saturn and PlayStation compilation built around early Irem arcade releases. StrategyWiki lists the Saturn version, and other retro references identify the package as collecting 10-Yard Fight, Spartan X/Kung-Fu Master, and MotoRace USA/Zippy Race rather than later Irem shooters such as R-Type. The Saturn copy is mainly a Japan-import arcade-history item, so disc condition, spine card, manual, and platform version matter more than sequel-style numbering.",
  },
  {
    id: "saturn-ishin-no-arashi",
    sourceUrl: "https://www.hamster.co.jp/en/release/7260/",
    overview:
      "Ishin no Arashi is Koei's Bakumatsu-era historical simulation, brought to Sega Saturn after earlier versions of the strategy game. Hamster's later Console Archives description summarizes the premise: players act as a patriot, debate feudal lords and historical figures, and try to guide Japan toward a new political future. The Saturn release belongs with Koei's dense historical sims, where Japanese text, manual completeness, region, and budget-series packaging are key collector details.",
  },
  {
    id: "saturn-j-league-go-go-goal",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Sega_Saturn_games",
    overview:
      "J. League Go Go Goal! is Tecmo's 1997 Japan-only soccer release for Sega Saturn. It is best understood as a licensed J. League-era sports entry, with its value coming from roster year, Japanese league branding, and its place among the Saturn's crowded import soccer library rather than from worldwide club coverage. Collectors should compare it carefully against nearby J. League titles, especially when checking publisher, year, spine card, manual condition, and title punctuation.",
  },
  {
    id: "saturn-j-league-jikkyou-honoo-no-striker",
    sourceUrl: "https://gamefaqs.gamespot.com/saturn/570744-jleague-jikkyou-honoo-no-striker/data",
    overview:
      "J. League Jikkyou Honoo no Striker is Konami Computer Entertainment Sapporo's 1998 Sega Saturn soccer game, released in Japan by Konami. GameFAQs identifies the developer, publisher, release year, and sports genre, placing it late in the Saturn's Japanese soccer run. The catalog value is in the Konami/J. League combination, regional exclusivity, and correct title identification, since it can be confused with Sega's own Victory Goal and Pro Soccer Club o Tsukurou lines.",
  },
  {
    id: "saturn-j-league-victory-goal-97",
    sourceUrl: "https://www.mobygames.com/game/39085/jleague-victory-goal-97/",
    overview:
      "J. League Victory Goal '97 is Sega's 1997 Saturn soccer entry tied to the Japanese professional league. MobyGames describes it as a J. League-focused counterpart to Sega Worldwide Soccer 97, using 17 Japanese Professional Football League teams instead of the broader international setup. It is a strong example of Sega's regional sports variants, so collectors should confirm the 1997 Japanese release, J. League branding, manual/spine completeness, and differences from Sega Worldwide Soccer 97 or Victory Goal Worldwide Edition.",
  },
  {
    id: "saturn-j-b-harold-blue-chicago-blues",
    sourceUrl: "https://www.mobygames.com/game/42958/jb-harold-blue-chicago-blues/",
    overview:
      "J.B. Harold: Blue Chicago Blues is Riverhillsoft's live-action detective adventure starring private investigator J.B. Harold, with a Sega Saturn release alongside other multimedia-era platforms. MobyGames identifies it as a single-player live-action detective adventure set around a Chicago mystery. The Saturn version is notable as an import FMV/adventure entry where language, disc condition, packaging completeness, and platform-specific presentation matter more than action-game comparisons.",
  },
  {
    id: "saturn-j-league-pro-soccer-club-o-tsukurou",
    sourceUrl: "https://www.sakatsuku.com/history/01/",
    overview:
      "J.League Pro Soccer Club o Tsukurou! is Sega's first Saturn entry in the long-running SakaTsuku soccer club management series. Sega's official series-history page dates the Saturn release to February 23, 1996, establishing it as a foundational Japanese football-management title rather than a match-focused arcade soccer game. Collectors should treat it as the first Saturn club-building entry and check region, save compatibility, manual/spine condition, and confusion with the 1997 sequel.",
  },
];

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

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = reviewedOverviews.map((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing Saturn game ${rewrite.id}`);
    return {
      platformSlug: "saturn",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Saturn weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, developer, release-database, and specialist game-reference sources.",
      newOverview: rewrite.overview,
      reviewStatus: "reviewed",
      reviewer: "Games Exchange editorial cleanup",
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
