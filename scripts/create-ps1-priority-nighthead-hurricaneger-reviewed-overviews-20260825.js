const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-nighthead-hurricaneger-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps1.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "ps1",
    gameId: "ps1-night-head-the-labyrinth",
    title: "Night Head: The Labyrinth",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00111.html",
    newOverview:
      "Night Head: The Labyrinth is a Japan-only first-person mystery adventure based on the Night Head television drama. The player explores a mansion, gathers and uses items, and makes route-shaping choices that can lead to different endings. GCX should present it as an atmospheric FMV-era import adventure rather than a generic horror game, with its appeal tied to branching mystery structure and TV-drama source material.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-night-raid",
    title: "Night Raid",
    sourceUrl: "https://www.hardcoregaming101.net/night-raid/",
    newOverview:
      "Night Raid is Takumi's late vertical shoot-'em-up, brought to PlayStation after its arcade release. It keeps the company's bullet-pattern focus but stands apart from Giga Wing with a stranger visual style, a trinket-based score multiplier, timed boss pressure, and a reputation for being interesting but uneven. GCX should frame it as an import-friendly shooter curiosity for Takumi and arcade-shmup collectors, not as a routine PS1 action title.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nightruth-explanation-of-the-paranormal-yami-no-tobira",
    title: "Nightruth: Explanation of the paranormal - \"Yami no Tobira\"",
    sourceUrl: "https://www.mobygames.com/game/211863/nightruth-explanation-of-the-paranormal-01-yami-no-tobira/",
    newOverview:
      "Nightruth: Explanation of the Paranormal - Yami no Tobira is a Japanese visual-novel adventure about high-school students investigating strange occult events with supernatural abilities. Its play is built around voiced story scenes, illustrated presentation, and player choices that branch into multiple storylines and endings. GCX should list it as a text-heavy paranormal import where language access matters, but where collectors get a distinctive mid-1990s occult adventure package.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nijiiro-dodgeball-otome-tachi-no-seishun",
    title: "Nijiiro Dodgeball: Otome-tachi no Seishun",
    sourceUrl: "https://en.wikipedia.org/wiki/Nijiiro_Dodge_Ball:_Otome_Tachi_no_Seishun",
    newOverview:
      "Nijiiro Dodgeball: Otome-tachi no Seishun is Atlus and Million's PlayStation dodgeball game, mixing Super Dodge Ball-style sports action with character-growth and social-simulation elements. It trades the Kunio-kun cast for its own school-team setup and supports both solo and multiplayer play. GCX should position it as a sports/sim hybrid import, useful for collectors tracking Million's dodgeball lineage beyond the more familiar Kunio releases.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nijiiro-twinkle-guruguru-daisakusen",
    title: "Nijiiro Twinkle: Guruguru Daisakusen",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01506.html",
    newOverview:
      "Nijiiro Twinkle: Guruguru Daisakusen is a bright Japanese action-puzzle game from ASCII, close in spirit to falling-block color-matching games but built with its own rotating, character-led structure. PSX DataCenter notes multiple modes, including story routes tied to the chosen character. GCX should treat it as a cute import puzzler with short-session arcade appeal, not just another generic puzzle listing.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-nikakudori-deluxe",
    title: "Nikakudori Deluxe",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-03431.html",
    newOverview:
      "Nikakudori Deluxe is DigiCube's PlayStation version of a mahjong-tile matching puzzle, released in the Nice Price Series Vol. 11 line. The goal is to clear tiles by matching pairs that can be connected under the game's path rules, with Deluxe, Official, and Trial modes plus rule explanations. GCX should describe it as a budget Japanese table-puzzle release where the appeal is clean rule mastery rather than story or action spectacle.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-ningyo-no-rakuin",
    title: "Ningyo no Rakuin",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/136260-ningyo-no-rakuin",
    newOverview:
      "Ningyo no Rakuin, also known by the translated title Mark of the Mermaid, is a Japan-only PlayStation tactical RPG with horror theming. LaunchBox identifies it as a released Sony PlayStation title from March 2000, while collector discussion usually centers on its dark tone and import-only status. GCX should present it carefully as a horror-flavored tactics/RPG curiosity, with a note that English-language documentation is limited compared with major PS1 RPGs.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-ninja-jaja-marukun-oniriki-ninpoucho",
    title: "Ninja Jaja Marukun Oniriki Ninpoucho",
    sourceUrl: "https://www.hardcoregaming101.net/ninja-jajamaru-kun-onikiri-ninpo-cho/",
    newOverview:
      "Ninja Jaja Marukun Oniriki Ninpoucho is Jaleco's 32-bit attempt to move the Jajamaru character line into 3D action on PlayStation and Saturn. Hardcore Gaming 101 describes it as a standard 3D action-platformer built around Jajamaru fighting through stages in a feudal-Japan fantasy style. GCX should frame it as a franchise-transition import: historically interesting for Jaleco fans, but more niche than the earlier 8-bit Jajamaru games.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-ninku",
    title: "Ninku",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00172.html",
    newOverview:
      "Ninku is a PlayStation adaptation of the manga and anime series, but it plays less like a side-scrolling brawler than the license might suggest. PSX DataCenter describes a 2D fighting-strategy format where players choose actions turn by turn, with Story, CPU Versus, two-player Versus, and gallery extras. GCX should call out the anime cutscene and turn-based battle structure so collectors understand why it differs from more direct anime action tie-ins.",
  },
  {
    platformSlug: "ps1",
    gameId: "ps1-ninpu-sentai-hurricaneger",
    title: "Ninpu Sentai Hurricaneger",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-03493.html",
    newOverview:
      "Ninpu Sentai Hurricaneger is Bandai's PlayStation tie-in for the Super Sentai series known in the U.S. orbit as the source for Power Rangers Ninja Storm. The game starts with story and one-on-one fighting modes, then opens more options as players progress, with 3D character action and special-move inputs layered over punches and kicks. GCX should position it as a late Japanese tokusatsu license release for Sentai and Power Rangers-adjacent collectors.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing PS1 game record for ${gameId}`);
  return game.description || game.gcxOverview || game.overview || "";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const header = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];
const csv = [
  header.join(","),
  ...rows.map((row) =>
    [
      row.platformSlug,
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority PS1 weak-template replacement with source-backed GCX editorial overview.",
      row.newOverview,
      "approved",
      "GCX Editorial",
    ]
      .map(csvCell)
      .join(",")
  ),
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rowCount: rows.length }, null, 2));
