const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "xbox360.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "xbox360-priority-magnacarta-masquerade-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "xbox360-magnacarta-2",
    sourceUrl: "https://www.unrealengine.com/blog/magnacarta-2",
    overview:
      "MagnaCarta 2 is Softmax and Namco Bandai's Xbox 360-exclusive fantasy RPG, built with Unreal Engine 3 and centered on party growth, field exploration, and real-time combat flow. It stands out in the 360 library as a Korean-developed console RPG with Hyung-Tae Kim's character art style and a campaign aimed at players who wanted a boxed, story-heavy alternative to the era's Western RPG wave. For collectors, platform exclusivity, regional publisher branding, language, and complete-disc condition matter more than multiplayer or downloadable ownership.",
  },
  {
    id: "xbox360-mahjong-dream-c-club",
    sourceUrl: "https://www.d3p.co.jp/dreamclub_mahjong/",
    overview:
      "Mahjong Dream C Club is D3Publisher's mahjong spin-off of the Dream C Club host-club series for Xbox 360 and PlayStation 3. Instead of the mainline dating-sim loop, it folds the cast into table play, presentation skits, and character appeal built around Japanese mahjong rules. Listings should flag that this is a Japan-focused licensed spin-off where language, rule familiarity, platform version, and Dream C Club fandom drive most of the collecting value.",
  },
  {
    id: "xbox360-maji-ten-maji-de-tenshi-o-tsukutte-mita",
    sourceUrl: "https://www.ideaf.co.jp/game/spec/?hard=xbox&title=majiten",
    overview:
      "Maji-Ten: Maji de Tenshi o Tsukutte Mita is an Idea Factory Xbox 360 visual novel built around creating, training, and spending time with angel characters. Its appeal is character-route reading and Japanese text presentation rather than action systems, making it a niche import entry in the 360 catalog. Useful marketplace context includes NTSC-J compatibility expectations, language dependence, limited-edition contents, and whether the copy includes any bonus materials.",
  },
  {
    id: "xbox360-majin-and-the-forsaken-kingdom",
    sourceUrl: "https://www.mobygames.com/game/56923/majin-and-the-forsaken-kingdom/",
    overview:
      "Majin and the Forsaken Kingdom is Game Republic and Namco Bandai's companion-driven action adventure for Xbox 360 and PlayStation 3. The player works with the Majin through combat, environmental puzzles, platforming routes, and fortress-like areas, so it is better described as a puzzle adventure with action elements than as a pure score-chasing game. Collectors should compare Xbox 360 and PS3 copies by region, rating, manual completeness, and the game's cult status among late-era console adventure fans.",
  },
  {
    id: "xbox360-major-league-baseball-2k6",
    sourceUrl: "https://ir.take2games.com/static-files/910ed5d9-46dc-4481-bee8-fc8a7f2e4264",
    overview:
      "Major League Baseball 2K6 is 2K Sports and Visual Concepts' 2006 MLB release, positioned by Take-Two as the officially licensed baseball game across the major console lineup, including Xbox 360. The Xbox 360 version is important as an early seventh-generation baseball entry with Derek Jeter cover branding, franchise-season appeal, and the annual roster snapshot that separates it from later 2K baseball discs. Buyers usually care about platform version, roster year, manual and case condition, and whether they want the first 360-era MLB 2K release.",
  },
  {
    id: "xbox360-major-league-baseball-2k9",
    sourceUrl: "https://news.xbox.com/en-us/2009/02/24/demo-mlb-2k9/amp/",
    overview:
      "Major League Baseball 2K9 is Visual Concepts and 2K Sports' 2009 MLB simulation for Xbox 360, built around updated Major League presentation, roster context, and the standard mix of exhibition, season, franchise, playoff, home-run derby, and multiplayer play. It sits in the series after several uneven annual entries, so collectors tend to evaluate it by year-specific roster interest, cover/player branding, and how it compares with nearby MLB 2K releases. Region, disc condition, manual completeness, and online-feature expectations should be made clear before trading.",
  },
  {
    id: "xbox360-mamoru-kun-wa-norowarete-shimatta",
    sourceUrl: "https://www.mobygames.com/game/113800/mamoru-kun-wa-norowarete-shimatta/",
    overview:
      "Mamoru-kun wa Norowarete Shimatta! is G.rev and Gulti's cute-horror vertical shooting game, first an arcade release and then a sought-after Xbox 360 conversion. It follows Mamoru and other characters through underworld stages filled with ghosts, demons, top-down shooting patterns, and direct-control movement. The important catalog signals are Japanese release status, shmup collector demand, arcade lineage, region compatibility, and the difference between this Xbox 360 version and later Mamorukun Curse releases.",
  },
  {
    id: "xbox360-man-vs-wild-with-bear-grylls",
    sourceUrl:
      "https://www.prnewswire.com/news-releases/man-vs-wild-the-game-now-available-from-crave-games-for-xbox-360-nintendo-wii-and-playstation3-120694709.html",
    overview:
      "Man Vs. Wild with Bear Grylls is Crave Games' console adaptation of the Discovery Channel survival show, released for Xbox 360 alongside Wii and PlayStation 3. Players step into Bear Grylls-style survival scenarios, making it more of a licensed adventure experience than a traditional outdoor sports simulation. The useful collector notes are TV-license appeal, platform version, region, achievement interest, and whether a buyer wants a novelty licensed release from the late Xbox 360 retail era.",
  },
  {
    id: "xbox360-marlow-briggs-and-the-mask-of-death",
    sourceUrl: "https://gamefaqs.gamespot.com/xbox360/720002-marlow-briggs-and-the-mask-of-death/data",
    overview:
      "Marlow Briggs and the Mask of Death is a ZootFly-developed Xbox Live Arcade action adventure published by 505 Games. It plays as a single-player, over-the-top hack-and-slash adventure with blockbuster set pieces, exotic environments, combat-heavy progression, and occasional platforming or puzzle breaks. Since the Xbox 360 release was digital, the relevant listing context is delisting and ownership status, Xbox Live Arcade distribution, backward-compatibility expectations, and how the console version differs from the PC release.",
  },
  {
    id: "xbox360-masquerade-the-baubles-of-doom",
    sourceUrl: "https://www.xbox.com/en-US/games/store/masquerade-the-baubles-of-doom/BNRQD872NJPR",
    overview:
      "Masquerade: The Baubles of Doom is Big Ant Studios' colorful action-adventure beat-'em-up, available on Xbox platforms as a downloadable release. It focuses on brawling, comic-fantasy characters, stage progression, and lighthearted combat rather than sports simulation, despite Big Ant's better-known catalog strengths. For collectors and digital-library tracking, the main details are Xbox Store availability, publisher/developer labeling, digital ownership, platform compatibility, and whether the buyer wants a couch-friendly brawler rather than a boxed retail disc.",
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
