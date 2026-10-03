const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "switch.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "switch-priority-kowloon-littlebusters-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "switch-kowloon-youma-gakuen-ki-origin-of-adventure",
    sourceUrl: "https://www.arcsystemworks.com/the-classic-rpg-kowloon-highschool-chronicle-is-coming-to-the-west/",
    overview:
      "Kowloon Youma Gakuen Ki: Origin of Adventure is Arc System Works and Toybox's Switch remaster of the 2004 PS2 adventure RPG later localized as Kowloon High-School Chronicle. Arc System Works described the western release as the game's first English appearance, with remastered graphics, first-person dungeon exploration, and a distinctive conversation system. Collector context centers on Japanese Origin of Adventure naming, regional title differences, and whether the copy is import or localized.",
  },
  {
    id: "switch-kunio-kun-the-world-classics-collection",
    sourceUrl: "https://www.xbox.com/en-SG/games/store/kunio-kun-the-world-classics-collection/c0qv4p26nndw",
    overview:
      "Kunio-kun: The World Classics Collection is Arc System Works' 2018 Switch compilation of Technos Japan beat-'em-up and sports classics. Store descriptions for the collection identify 11 classic Kunio-kun titles plus additional Kunio-kun and Double Dragon games, matching the later western Retro Brawler Bundle framing. It matters as a packed retro anthology, so title variant, supported language, region, and physical or digital format are key details.",
  },
  {
    id: "switch-kyukyoku-tiger-heli",
    sourceUrl: "https://www.mobygames.com/game/174725/kyukyoku-tigerheli-toaplan-arcade-garage/",
    overview:
      "Kyukyoku Tiger-Heli is M2's 2021 Switch entry in the Toaplan Arcade Garage line. MobyGames identifies it as the first Toaplan Arcade Garage release, bundling arcade versions of early Toaplan shooters, while later coverage notes its ShotTriggers-style archival treatment. It is a specialist shoot-'em-up collection where the M2 pedigree, arcade preservation features, Japanese versus western release path, and physical edition matter more than generic Switch-port status.",
  },
  {
    id: "switch-l-o-l-surprise-b-bs-born-to-travel",
    sourceUrl: "https://outrightgames.com/launches/l-o-l-surprise-b-b-s-born-to-travel-jetsets-onto-consoles-and-pc-today/",
    overview:
      "L.O.L Surprise! B.Bs Born to Travel is Xaloc Studios and Outright Games' 2022 family game based on MGA's L.O.L. Surprise toy brand. Outright's launch announcement tied the game to PlayStation, Switch, Xbox, and PC, while the ESRB describes a puzzle/strategy setup in which players work at international L.O.L. Surprise stores. The useful listing context is toy-brand tie-in, kid-friendly play, platform region, and whether the copy is complete for gift or collection purposes.",
  },
  {
    id: "switch-laid-back-camp-virtual-fumoto-campsite",
    sourceUrl: "https://yurucamp-v.com/en/?from=AppAgg.com",
    overview:
      "Laid-Back Camp -Virtual- Fumoto Campsite is Gemdrops' cozy virtual-camp adventure based on Laid-Back Camp, released as one half of the Yuru Camp Virtual Camp project. The official site pairs the Fumoto Campsite version with Lake Motosu and presents the experience across Switch, PlayStation, PC, and mobile rather than as a racing game. The important distinctions are exact episode, digital or regional availability, and its relaxed anime-camping focus.",
  },
  {
    id: "switch-laid-back-camp-virtual-lake-motosu",
    sourceUrl: "https://www.nintendo.com/us/store/products/laid-back-camp-virtual-lake-motosu-switch/",
    overview:
      "Laid-Back Camp -Virtual- Lake Motosu is Gemdrops' Switch virtual-camping adventure centered on the Lake Motosu side of Laid-Back Camp. Nintendo's store page lists Gemdrops as publisher and the March 2021 release, while the broader Virtual Camp project pairs this episode with Fumoto Campsite. It is a calm first-person anime experience, so the important buyer details are exact episode, digital availability, language support, and Laid-Back Camp branding.",
  },
  {
    id: "switch-laid-back-camp-have-a-nice-day",
    sourceUrl: "https://game.mages.co.jp/yurucamp/",
    overview:
      "Laid-Back Camp: Have a Nice Day! is MAGES.' 2021 Switch and PlayStation 4 visual novel based on the Laid-Back Camp anime. MAGES.' official site and Japanese coverage present it as a packaged camping adventure, distinct from Gemdrops' shorter Virtual Camp releases. It is a Japan-focused story game where limited edition contents, character-route appeal, Japanese text, and physical packaging matter more than action systems.",
  },
  {
    id: "switch-layton-s-mystery-journey",
    sourceUrl: "https://gamefaqs.gamespot.com/switch/239068-laytons-mystery-journey-katrielle-and-the-millionaires/data",
    overview:
      "Layton's Mystery Journey on Switch is Level-5's Deluxe Edition of Katrielle and the Millionaires' Conspiracy, moving the 2017 puzzle adventure to console play. GameFAQs records the Japanese Switch release on August 9, 2018, while ESRB materials identify the Deluxe Edition title and family-friendly mystery rating. The useful context is Katrielle as lead detective, puzzle-adventure structure, Deluxe Edition naming, and regional language or release differences.",
  },
  {
    id: "switch-learn-with-nanami-listening-and-reading-test-complete-master",
    sourceUrl: "https://www.media-5.co.jp/n773/",
    overview:
      "Learn with Nanami! Listening and Reading Test Complete Master is Media5's Japanese study software for Nintendo Switch. Media5's Nanami series materials emphasize a five-mode learning system, progression from basics to applied practice, and audio read-aloud support, which fits the title's listening-and-reading exam focus. It should be cataloged as Japanese educational software, with language dependence, study-test purpose, and import-region clarity front and center.",
  },
  {
    id: "switch-little-busters",
    sourceUrl: "https://www.prot.co.jp/switch/lbc_en/index.html",
    overview:
      "Little Busters! Converted Edition is Prototype's 2020 Switch release of Key's coming-of-age visual novel. Prototype's official page highlights English and Japanese text, Japanese-only audio, Switch Lite support, and the Busterpedia glossary for cultural references. That makes it especially collector-relevant: the Switch version offers official dual-language support, Key/VisualArts provenance, visual-novel pacing, and a physical Japanese release that can still be playable for English readers.",
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
    if (!game) throw new Error(`Missing Switch game ${rewrite.id}`);
    return {
      platformSlug: "switch",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Switch weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, store, database, and series reference checks.",
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
