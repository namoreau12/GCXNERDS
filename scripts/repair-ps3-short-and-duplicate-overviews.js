const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ps3.json");
const manifestPath = path.join(rootDir, "data", "games", "ps3-manifest.json");

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function statusCounts(games) {
  return games.reduce((counts, game) => {
    const status = game.overviewStatus || "needs_editorial";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

const replacements = {
  "ps3-disney-sing-it-pop-hits":
    "Disney Sing It: Pop Hits brings Disney's karaoke series to PS3 with a pop-focused song list, music-video presentation, and microphone-driven scoring. It is useful to list with clear accessory notes because the experience depends on singing peripherals and local party play rather than a traditional campaign.",
  "ps3-gal-gun":
    "Gal Gun is Inti Creates' offbeat rail-shooter and dating-comedy hybrid, built around on-rails aiming, score pressure, character routes, and deliberately exaggerated anime presentation. The PS3 version matters most to import collectors, so region, language, and exact edition should be clear before trading.",
  "ps3-nba-ballers-chosen-one":
    "NBA Ballers: Chosen One continues Midway's street-style basketball series with one-on-one spectacle, flashy moves, celebrity energy, and a more arcade-forward identity than simulation basketball. Roster era, region, and condition are the key details because it sits apart from annual NBA releases.",
  "ps3-novastrike":
    "Novastrike is a PSN-era shooter from Tiki Games that uses twin-stick-style movement, aerial combat, and score-minded arcade pressure instead of a boxed retail campaign. Because it was a downloadable PS3 release, listings should be careful about format, account ownership limits, and whether a buyer is looking for physical media.",
  "ps3-rugby-challenge":
    "Rugby Challenge adapts professional rugby into PS3-era matches, tournaments, team management, and a control scheme built around passing, kicking, tackling, and field position. Region, league licensing, roster version, and local multiplayer support are the details that make the entry useful to sports collectors.",
  "ps3-toybox-turbos":
    "Toybox Turbos is Codemasters' miniature arcade racer, sending tiny vehicles through tabletop-style tracks filled with hazards, shortcuts, and quick multiplayer-friendly events. It is best framed as a compact spiritual cousin to Micro Machines, with platform, format, and local play options worth noting for buyers.",
  "ps3-wakeboarding-hd":
    "Wakeboarding HD is a PlayStation Network sports release built around boat-towed tricks, obstacle routes, score runs, and water-stage spectacle. Since it is a digital-forward PS3 title, collectors and players should pay close attention to format, availability, and whether they are expecting a physical disc.",
  "ps3-infinite-stratos-2-ignition-hearts":
    "Infinite Stratos 2: Ignition Hearts is a Japan-only PS3 and Vita visual novel tied to the Infinite Stratos anime universe, focusing on character memories, dialogue scenes, and route-style fan-service storytelling. Language dependence, platform, and edition are the most important details for import buyers.",
  "ps3-infinite-stratos-2-love-and-purge":
    "Infinite Stratos 2: Love and Purge is a separate follow-up visual novel for PS3 and Vita that keeps the anime cast at the center while shifting the scenario and character interactions away from Ignition Hearts. It should be listed distinctly because subtitle, region, and edition are easy to confuse.",
  "ps3-motorstorm-3d-rift":
    "MotorStorm: 3D Rift is a PlayStation Network spin-off built from MotorStorm: Pacific Rift content with a focus on stereoscopic 3D presentation. It is not the same listing as the full Pacific Rift disc, so format, 3D display support, and digital availability are the key marketplace distinctions.",
  "ps3-motorstorm-pacific-rift":
    "MotorStorm: Pacific Rift is Evolution Studios' second main PS3 MotorStorm entry, moving the festival-style off-road racing to tropical islands packed with mud, lava, water, boost risk, and vehicle-class chaos. Physical edition, region, and online-feature expectations should be clear in any listing.",
  "ps3-sengoku-basara-3":
    "Sengoku Basara 3 is Capcom's Japan-titled third main Basara entry, delivering large-scale hack-and-slash battles, stylized historical warriors, and fast crowd-clearing combat. It overlaps with Samurai Heroes naming, so listings should make the regional title, language, and packaging version explicit.",
  "ps3-sengoku-basara-samurai-heroes":
    "Sengoku Basara: Samurai Heroes is the localized PS3 release connected to Sengoku Basara 3, bringing Capcom's exaggerated warlord action to a broader audience. It should be separated from Japanese Basara 3 listings because title treatment, region, language, and box art can differ.",
  "ps3-vividred-operation-hyper-intimate-power":
    "Vividred Operation: Hyper Intimate Power is a PS3 game tied to the Vividred Operation anime, centered on character-driven scenes and fan-focused presentation for viewers already familiar with the series. Region, language, PSN availability, and exact subtitle are the key identifiers.",
  "ps3-vividred-operation-mayonnaise-operation-with-akane":
    "Vividred Operation: Mayonnaise Operation With Akane! is a distinct Vividred Operation PS3 spin-off with a narrower character gag premise rather than the same scope as Hyper Intimate Power. It needs its own listing because the subtitle and PSN format are easy to mix up.",
};

const games = readJson(dataPath, []);
const manifest = readJson(manifestPath, {});
let repaired = 0;

for (const game of games) {
  const overview = replacements[game.id];
  if (!overview) continue;
  game.description = overview;
  game.descriptionProvider = "GCX reviewed editorial overview";
  game.descriptionSourceUrl = game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "https://en.wikipedia.org/wiki/List_of_PlayStation_3_games";
  game.overviewStatus = "published";
  game.overviewReviewStatus = "reviewed";
  game.overviewReviewer = "codex";
  game.searchText = [
    game.title,
    game.name,
    game.developer,
    game.publisher,
    ...(Array.isArray(game.developers) ? game.developers : []),
    ...(Array.isArray(game.publishers) ? game.publishers : []),
    ...(Array.isArray(game.genres) ? game.genres : []),
    game.releaseDate,
    game.firstReleased,
    game.platform,
    overview,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  game.healthUpdatedAt = new Date().toISOString();
  repaired += 1;
}

writeJson(dataPath, games);
writeJson(manifestPath, {
  ...manifest,
  shortAndDuplicateOverviewRepairedAt: new Date().toISOString(),
  shortAndDuplicateOverviewRepairCount: repaired,
  overviewStatusCounts: statusCounts(games),
});

console.log(`Repaired ${repaired} PS3 short/duplicate overviews.`);
