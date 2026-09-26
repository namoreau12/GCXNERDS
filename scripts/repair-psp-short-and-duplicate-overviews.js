const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "psp.json");
const manifestPath = path.join(rootDir, "data", "games", "psp-manifest.json");

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
  "psp-hilton-garden-inn-ultimate-team-play":
    "Hilton Garden Inn: Ultimate Team Play is an unusual branded PSP training release from Virtual Heroes, distributed on UMD for Hilton Garden Inn team-building and hospitality scenarios rather than conventional retail play. Its collector interest comes from that corporate-use context, so format, provenance, and completeness matter more than genre depth.",
  "psp-higanjima":
    "Higanjima adapts the vampire-survival manga into a PSP horror adventure, using the license's island setting, character danger, and dark atmosphere as its main hook. It is mainly relevant for import collectors, so language, region, and whether the buyer expects manga context should be clear.",
  "psp-infected":
    "Infected is Planet Moon Studios' PSP shooter built around fast third-person action, virus-themed enemies, and the handheld's early push toward original portable action games. It should be listed with region, multiplayer expectations, and UMD condition because its online-era features are part of its identity.",
  "psp-parodius-portable":
    "Parodius Portable is a PSP compilation of Konami's parody shoot-'em-up series, built around absurd enemy designs, side-scrolling arcade action, and portable access to multiple cult shooters. The exact included games, Japanese import status, and condition are the key collector details.",
  "psp-puzzle-scape":
    "Puzzle Scape is a PSP puzzle game from Farmind that mixes falling-block-style logic with audiovisual presentation and short-session scoring. It belongs to the handheld's smaller downloadable and UMD-era puzzle lane, where publisher, region, and format help distinguish it from better-known puzzle staples.",
  "psp-telly-addicts":
    "Telly Addicts brings the British TV quiz format to PSP with trivia-style rounds and brand recognition aimed at players familiar with the show. It is a region-sensitive party/quiz release, so language, territory, platform version, and complete packaging are the important listing details.",
  "psp-warhammer-battle-for-atluma":
    "Warhammer: Battle for Atluma adapts the WarCry collectible-card game into a PSP strategy/card-battle release, focusing on deck identity, fantasy factions, and portable duels rather than tabletop miniatures. Its value depends on Warhammer brand interest, region, and whether the buyer understands it as a card-game adaptation.",
  "psp-lord-of-apocalypse":
    "Lord of Apocalypse is the later follow-up to Lord of Arcana, carrying Square Enix's action-RPG hunting formula onto PSP and Vita with larger-scale monster fights, loot, and multiplayer-minded quests. It should be kept distinct from Arcana because subtitle, platform mix, and regional availability differ.",
  "psp-lord-of-arcana":
    "Lord of Arcana is Square Enix's PSP action RPG built around arena hunts, weapon growth, boss creatures, and a darker fantasy tone within the handheld hunting boom. For collectors, it is the baseline entry to separate from Lord of Apocalypse and from Monster Hunter-style alternatives.",
  "psp-monster-jam-path-of-destruction":
    "Monster Jam: Path of Destruction brings licensed monster-truck events to PSP with stunt arenas, vehicle destruction, and the appeal of official Monster Jam branding. It should not share copy with older Monster Jam games; buyers need the exact subtitle, region, and platform version.",
  "psp-monster-jam-urban-assault":
    "Monster Jam: Urban Assault takes the license into city-themed events and destructive arcade driving on PSP, setting it apart from Path of Destruction and earlier entries. The useful listing details are subtitle, platform, region, truck roster expectations, and complete UMD packaging.",
  "psp-ore-no-imoto-ga-konna-ni-kawaii-wake-ga-nai-portable":
    "Ore no Imoto ga Konna ni Kawaii Wake ga Nai Portable is the first PSP visual novel adaptation of the light-novel/anime series, centered on character routes and fan-facing scenario material. It should be listed separately from its sequel because the subtitle and release order are easy to confuse.",
  "psp-ore-no-imoto-ga-konna-ni-kawaii-wake-ga-nai-portable-ga-tsuzuku-wake-ga-nai":
    "Ore no Imoto ga Konna ni Kawaii Wake ga Nai Portable ga Tsuzuku Wake ga Nai is the follow-up PSP visual novel, expanding the character-route material for fans who already know the first game. Region, subtitle, limited edition contents, and language dependence are the most important collector signals.",
  "psp-phantasy-star-portable-2":
    "Phantasy Star Portable 2 is Sega's PSP action RPG sequel built around missions, character builds, loot, and ad hoc multiplayer within the Phantasy Star Universe branch. It is the standard second entry, so listings should distinguish it from the expanded Infinity release.",
  "psp-phantasy-star-portable-2-infinity":
    "Phantasy Star Portable 2 Infinity is the expanded version of Portable 2, adding new story material, systems, and content for players invested in Sega's portable online-RPG-style loop. It carries different collector value than the base game, especially for import and completion-focused buyers.",
  "psp-syphon-filter-combat-ops":
    "Syphon Filter: Combat Ops is a PSP multiplayer-focused spin-off from Bend Studio's stealth-action series, built around compact tactical arenas rather than Logan's Shadow's full campaign structure. Server dependence, format, and expectations around playable content should be clear in any listing.",
  "psp-syphon-filter-logan-s-shadow":
    "Syphon Filter: Logan's Shadow is Bend Studio's campaign-driven PSP sequel, combining third-person shooting, stealth, underwater sequences, and spy-thriller pacing. It should be separated from Combat Ops because buyers may be looking for the full story campaign rather than the multiplayer-focused release.",
  "psp-toukiden":
    "Toukiden: The Age of Demons is Omega Force's hunting-action RPG for PSP and Vita, built around demon battles, weapon styles, ally missions, and Japanese-mythology framing. It is the base release, so platform, region, and whether the buyer wants Kiwami's expanded content matter.",
  "psp-toukiden-kiwami":
    "Toukiden: Kiwami is the expanded version of The Age of Demons, adding substantial content, refinements, and a stronger reason for collectors to distinguish it from the original. Listings should make the Kiwami subtitle, platform, region, and edition clear.",
};

const games = readJson(dataPath, []);
const manifest = readJson(manifestPath, {});
let repaired = 0;

for (const game of games) {
  const overview = replacements[game.id];
  if (!overview) continue;
  game.description = overview;
  game.descriptionProvider = "GCX reviewed editorial overview";
  game.descriptionSourceUrl = game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "https://en.wikipedia.org/wiki/List_of_PlayStation_Portable_games";
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

console.log(`Repaired ${repaired} PSP short/duplicate overviews.`);
