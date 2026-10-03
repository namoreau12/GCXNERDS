const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "xbox360.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "xbox360-priority-sing-love-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "xbox360-let-s-sing-and-dance",
    sourceUrl: "https://gamefaqs.gamespot.com/xbox360/730337-lets-sing-and-dance/data",
    overview:
      "Let's Sing and Dance is a Kinect-required Xbox Live Arcade music game from Voxler and Deep Silver. It combines singing with full-body dance choreography, with up to two tracked dancers and additional singers supporting in the background. Because it was a digital Xbox 360 release, the useful buyer context is Kinect hardware, delisting risk, song list, achievement completion, and whether the account already owns the download.",
  },
  {
    id: "xbox360-lips-deutsche-partyknaller",
    sourceUrl: "https://download.microsoft.com/download/e/5/4/e5498215-0265-4095-819f-684147b4d8e7/Fastfacts_Lips_Partyknaller_Bundled.pdf",
    overview:
      "Lips: Deutsche Partyknaller is a German-focused entry in Microsoft's Lips karaoke series for Xbox 360. It keeps the series' party-singing format and wireless microphone focus while centering the set list on German-language party songs rather than an international pop mix. Collectors should treat it as a localized Lips release where microphone bundles, PAL region, language fit, and track selection matter more than campaign progression.",
  },
  {
    id: "xbox360-lips-i-love-the-80-s",
    sourceUrl: "https://gamefaqs.gamespot.com/xbox360/991330-lips-i-love-the-80s/data",
    overview:
      "Lips: I Love the 80's takes Microsoft's Xbox 360 karaoke series into a 40-song 1980s set list from iNiS and Microsoft Game Studios. The play pattern is pure Lips: sing into compatible microphones, chase scores, and replay party performances instead of working through a campaign or plastic-instrument band setup. For collectors, microphone bundles, PAL packaging, accessory compatibility, and the dedicated 80s theme are the meaningful differences from other Lips discs.",
  },
  {
    id: "xbox360-little-league-world-series-baseball-2010",
    sourceUrl:
      "https://investor.activision.com/news-releases/news-release-details/activision-publishing-goes-bat-xbox-360-and-playstationr3-little",
    overview:
      "Little League World Series Baseball 2010 is Activision's officially licensed youth-baseball game for Xbox 360, developed by Now Production. This version brought the series to Xbox 360 and PlayStation 3 with season and career modes built around reaching the Little League World Series, plus online record and leaderboard features. It is best framed as an arcade-friendly licensed sports entry where year, platform jump, and Little League branding distinguish it from MLB simulations.",
  },
  {
    id: "xbox360-lost-cities",
    sourceUrl: "https://arstechnica.com/gaming/2008/04/lost-cities-dealt-to-xbox-live-arcade-this-week/",
    overview:
      "Lost Cities is Sierra Online's Xbox Live Arcade adaptation of Reiner Knizia's expedition-themed card game. Players build scoring expeditions across color-coded destinations, balancing investment risk, numbered cards, and timing in short strategic matches. Since it was a delisted XBLA release, the key marketplace context is digital ownership, the board/card-game source material, online play expectations, and whether buyers want a console version of the tabletop design.",
  },
  {
    id: "xbox360-lost-planet-extreme-condition-colonies-edition",
    sourceUrl: "https://news.capcomusa.com/lets/browse/lost-planet-colonies-goes-gold-brings-the-win",
    overview:
      "Lost Planet: Extreme Condition Colonies Edition is Capcom's expanded version of the frozen-planet third-person shooter for Xbox 360 and PC. It adds new multiplayer maps, weapons, characters, game types, camera options, and cross-platform play between Xbox 360 and Games for Windows users. Listings should flag that Colonies is its own multiplayer/save ecosystem, not just a standard copy of the original Lost Planet.",
  },
  {
    id: "xbox360-love-football",
    sourceUrl: "https://www.gamespot.com/articles/namco-kicks-out-more-360-soccer-details/1100-6141534/",
    overview:
      "Love Football is Namco Bandai's Japan-only Xbox 360 soccer game built around an unusual first-person-style viewpoint. Preview coverage highlighted nearly 60 national teams and a camera perspective meant to make the player feel closer to the action than a traditional broadcast-angle soccer game. The practical listing value is its Japanese release, Namco sports oddity status, viewpoint gimmick, and region/language expectations.",
  },
  {
    id: "xbox360-love-tore-bitter-a-k-a-love-tra",
    sourceUrl: "https://www.trueachievements.com/game/Love-Tore-Bitter/walkthrough/1",
    overview:
      "Love Tore: Bitter is the third Love Tore release for Xbox 360, a Japan-only Kinect game from Boost On that mixes dance lessons, music performance, and character progression. It is retail-only, region locked to NTSC-J hardware, and sits within the broader Love Tore trilogy also sold as Love Tore Chocolate. Collectors should not read it as a conventional visual novel; the important signals are Kinect requirement, Japanese text, region lock, and trilogy placement.",
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
    if (!game) throw new Error(`Missing Xbox 360 game ${rewrite.id}`);
    return {
      platformSlug: "xbox360",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Xbox 360 weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus publisher, platform, marketplace, and specialist reference material.",
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
