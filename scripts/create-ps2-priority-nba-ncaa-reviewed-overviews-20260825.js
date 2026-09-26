const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const platformSlug = "ps2";
const dataPath = path.join(rootDir, "data", "games", `${platformSlug}.json`);
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-nba-ncaa-reviewed-overviews-2026-08-25.csv"
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
  "ps2-nba-live-09": {
    sourceUrl: "https://en.wikipedia.org/wiki/NBA_Live_09",
    rewriteNotes: "Source cross-check: NBA Live 09 page identifies HB Studios on PS2, Tony Parker cover branding, Dynamic DNA, Live 365, pick-and-roll control, and expanded FIBA teams.",
    newOverview:
      "NBA Live 09 is the final PS2 entry in EA's long-running NBA Live line, with HB Studios handling the older-hardware version while the brand pushed Dynamic DNA and Live 365 on newer systems. On PS2, the hook is still broad EA basketball: NBA teams, international FIBA rosters, pick-and-roll control, and season-style play built around the 2008-09 moment. It is worth flagging for collectors because it closes out NBA Live's PlayStation 2 run rather than defining the series at its peak."
  },
  "ps2-nba-shootout-2001": {
    sourceUrl: "https://en.wikipedia.org/wiki/NBA_ShootOut_2001",
    rewriteNotes: "Source cross-check: article identifies 989 Sports PS2 port, Sony publishing, Chris Webber cover, and single/multiplayer basketball structure.",
    newOverview:
      "NBA ShootOut 2001 brought Sony's first-party basketball series onto PlayStation 2 with Chris Webber on the cover and 989 Sports handling the PS2 version. It plays as a straightforward NBA simulation built around exhibition, season, playoff-style competition, and local multiplayer rather than the deeper franchise systems that later basketball games emphasized. In the GCX library, its importance is mostly historical: an early PS2 sports release from Sony's own 989 Sports line."
  },
  "ps2-nba-shootout-2003": {
    sourceUrl: "https://en.wikipedia.org/wiki/NBA_ShootOut_2003",
    rewriteNotes: "Source cross-check: article identifies 989 Sports PS2 development, Sony Computer Entertainment America publishing, Ray Allen cover, and mixed reception.",
    newOverview:
      "NBA ShootOut 2003 is a later 989 Sports basketball entry with Ray Allen on the cover, arriving at a point when EA and Sega/2K were setting a higher bar for NBA simulations. It keeps the basic ShootOut appeal of licensed NBA teams, quick games, season play, and head-to-head basketball, but its collector context matters more than its reputation. This is one of the last stops for Sony's NBA ShootOut brand before the franchise ended the following year."
  },
  "ps2-nba-shootout-2004": {
    sourceUrl: "https://en.wikipedia.org/wiki/NBA_ShootOut_2004",
    rewriteNotes: "Source cross-check: article identifies final NBA ShootOut installment, 989 Sports PS2 development, Sony publishing, Tracy McGrady cover, and mixed reception.",
    newOverview:
      "NBA ShootOut 2004 is the final installment of Sony's NBA ShootOut series, with Tracy McGrady cover branding and 989 Sports credited on the PS2 version. The game is a licensed NBA basketball sim for players who want quick games, season competition, and local multiplayer, but by 2003 it was competing against stronger basketball franchises. For collectors, the key point is closure: this disc marks the end of one of PlayStation's original first-party sports brands."
  },
  "ps2-nba-starting-five": {
    sourceUrl: "https://www.gamestop.com/video-games/retro-gaming/products/nba-starting-five---playstation-2/20017785.html",
    rewriteNotes: "Source cross-check: retail/product records describe Konami publishing, 2002-03 rosters, Season, Playoff, Franchise, custom players, local multiplayer, and simulation presentation.",
    newOverview:
      "NBA Starting Five is Konami's PS2 NBA simulation built around updated 2002-03 rosters, licensed teams and arenas, and a mode set that includes Season, Playoffs, Franchise, and custom players. It aims for accessible five-on-five basketball with enough management structure to keep a team going beyond quick exhibition play. The library should present it as Konami's attempt to stay in the licensed NBA lane after its ESPN-branded basketball history, not as a generic sports placeholder."
  },
  "ps2-nba-starting-five-2005": {
    sourceUrl: "https://www.ebay.com/p/56256885",
    rewriteNotes: "Source cross-check: product records identify Japan-only Konami release, 2004-05 rosters, classic teams, dual-stick dribble/feint controls, improved animations, and AI changes.",
    newOverview:
      "NBA Starting Five 2005 is a Japan-only Konami basketball sequel built around 2004-05 NBA rosters rather than a broad worldwide release. Its identity comes from updated player data, classic teams, right-stick dribble and feint controls, motion-captured animation improvements, and a more polished late-series presentation. For GCX, the collector angle is clear: this is an import-only NBA-licensed PS2 oddity from Konami, useful for sports collectors who want the platform's less common basketball releases."
  },
  "ps2-ncaa-basketball-09": {
    sourceUrl: "https://ir.ea.com/press-releases/press-release-details/2008/NCAA-Basketball-09-from-EA-Sports-Ships-to-Stores-Today/default.aspx",
    rewriteNotes: "Source cross-check: EA release describes motion offenses, school-specific play styles, pressure defense, full-court presses and traps, improved AI/animations, and in-game Division I coaches.",
    newOverview:
      "NCAA Basketball 09 is EA's renamed college-basketball follow-up to the March Madness line, with a focus on school-specific tempo and strategy rather than treating every team the same. The PS2 version preserves the college hoops loop of running sets, using pressure defense, managing full-court presses and traps, and leaning into Division I coach presentation. It belongs in the library as one of the last licensed college basketball releases on PS2, after EA shifted the brand away from the March Madness name."
  },
  "ps2-ncaa-gamebreaker-2001": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_GameBreaker_2001",
    rewriteNotes: "Source cross-check: article identifies Red Zone Interactive/989 Sports, Sony publishing, PS1 and PS2 releases, Ron Dayne cover, and North America-only release.",
    newOverview:
      "NCAA GameBreaker 2001 is Sony's early PS2 college-football entry from Red Zone Interactive and 989 Sports, with Ron Dayne on the cover and a North America-only release. It represents the transition from PlayStation-era GameBreaker into sixth-generation hardware before the series skipped a year and returned with 2003. The game matters more as an early PS2 sports-library marker than as the definitive college-football sim, especially for collectors following Sony's 989 Sports catalog."
  },
  "ps2-ncaa-gamebreaker-2003": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_GameBreaker_2003",
    rewriteNotes: "Source cross-check: article identifies Red Zone Interactive/989 Sports, Sony publishing, Clinton Portis cover, PS2 platform, and mixed reception.",
    newOverview:
      "NCAA GameBreaker 2003 brought Sony's college-football series back to PS2 with Clinton Portis on the cover and 989 Sports again tied to development. It delivers licensed college football basics: single-player and multiplayer games, team matchups, and the atmosphere hooks expected from a first-party NCAA competitor. Its GCX value is that it documents Sony's attempt to keep GameBreaker alive against EA's stronger NCAA Football run."
  },
  "ps2-ncaa-gamebreaker-2004": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_GameBreaker_2004",
    rewriteNotes: "Source cross-check: article identifies Red Zone Interactive/989 Sports, Sony publishing, Larry Johnson cover, PS2 platform, and final GameBreaker installment.",
    newOverview:
      "NCAA GameBreaker 2004 is the final entry in Sony's college-football series, with Larry Johnson cover branding and 989 Sports credited alongside Red Zone Interactive. It is a licensed NCAA football game with the usual single-player and multiplayer structure, but its real importance is as the last stop for a PlayStation sports brand that dated back to the PS1 era. For collectors, that final-installment status is the detail that separates it from the surrounding annual football releases."
  },
  "ps2-ncaa-march-madness-08": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_March_Madness_08",
    rewriteNotes: "Source cross-check: article identifies Kevin Durant cover, Dynamic Post Control, Lockdown Stick, recruiting and Dynasty additions, NIT/McDonald's All American content, custom playbooks, and ESPN on Demand.",
    newOverview:
      "NCAA March Madness 08 is the Kevin Durant-cover entry in EA's college-basketball series and one of the richer late PS2 March Madness releases. It adds Dynamic Post Control, the EA Sports Lockdown Stick, custom playbooks, recruiting changes, NIT integration, McDonald's High School All American content, and ESPN on Demand presentation. The game is best described as a systems-heavy college hoops sim built around post play, recruiting, and program-building rather than only quick tournament runs."
  },
  "ps2-ncaa-march-madness-2002": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_March_Madness_2002",
    rewriteNotes: "Source cross-check: article identifies NuFX/EA Sports, Shane Battier cover, first college basketball game on PS2, Create-a-Player, Single Game, Tournament Mode, and roster management.",
    newOverview:
      "NCAA March Madness 2002 is the first college-basketball game released for PlayStation 2, with Shane Battier on the cover and NuFX developing for EA Sports. Its feature set is early but important: single games, tournament play, roster management, and create-a-player support built around NCAA teams. For GCX, the overview should emphasize its launch-era role for PS2 college hoops rather than overselling it as the deepest entry in the series."
  },
  "ps2-ncaa-march-madness-2003": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_March_Madness_2003",
    rewriteNotes: "Source cross-check: article identifies NuFX/EA Sports, Drew Gooden cover, PS2 platform, and place as the 2002 series installment.",
    newOverview:
      "NCAA March Madness 2003 is EA's second PS2 college-basketball entry, with Drew Gooden on the cover and NuFX again handling development. It continues the series' focus on NCAA tournament atmosphere, season-style play, and accessible five-on-five basketball while still feeling like an early-generation sports sequel. Its collector relevance comes from sitting between the first PS2 March Madness release and the more feature-forward 2004 entry."
  },
  "ps2-ncaa-march-madness-2004": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_March_Madness_2004",
    rewriteNotes: "Source cross-check: article identifies Carmelo Anthony cover, Brad Nessler and Dick Vitale commentary, favorite-school presentation, 30-season Dynasty, tournaments, mascot game, create-a-school, and freestyle controls.",
    newOverview:
      "NCAA March Madness 2004 is the Carmelo Anthony-cover entry that made EA's college-basketball series feel more specific to the school you chose. It added favorite-school presentation, fight songs, mascots, Dick Vitale integration, a 30-season Dynasty mode, major tournaments, create-a-school, freestyle moves, alley-oops, and mid-air shot adjustments. Compared with the earlier PS2 entries, this is where the series' college atmosphere and feature set became much easier to explain to modern collectors."
  },
  "ps2-ncaa-march-madness-2005": {
    sourceUrl: "https://en.wikipedia.org/wiki/NCAA_March_Madness_2005",
    rewriteNotes: "Source cross-check: article identifies EA Canada/EA Sports, Emeka Okafor cover, PS2/Xbox platforms, college-band soundtrack treatment, and favorable reception; product records note Dynasty, online play, Mascot and Rivalry modes.",
    newOverview:
      "NCAA March Madness 2005 is the Emeka Okafor-cover entry in EA's college-basketball line, released on PS2 and Xbox with EA Canada development. It builds on the prior year's atmosphere with Dynasty play, Mascot and Rivalry modes, online support on PS2, and college-band versions of licensed songs to push the campus feel. For GCX, it is one of the stronger middle-period March Madness releases because it combines recognizable presentation hooks with a fuller set of college-specific modes."
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
