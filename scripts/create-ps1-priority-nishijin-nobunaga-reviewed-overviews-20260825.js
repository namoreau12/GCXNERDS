const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-nishijin-nobunaga-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ps1.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    gameId: "ps1-nishijin-pachinko-tettei-kouryaku-cr-hanaman-sokuhou-and-cr-obake-land",
    title: "Nishijin Pachinko Tettei Kouryaku: CR Hanaman Sokuhou & CR Obake Land",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-03268.html",
    newOverview:
      "Nishijin Pachinko Tettei Kouryaku: CR Hanaman Sokuhou & CR Obake Land is a Japan-only PlayStation pachinko simulation built around digital versions of the CR Hanaman Sokuhou and CR Obake Land machines. PSX DataCenter notes multiple zoom levels, machine information, and a view mode for watching machine animations. GCX should frame it as a machine-specific pachinko strategy release, useful for parlor-game collectors rather than broad casino fans.",
  },
  {
    gameId: "ps1-no-appointment-gals-olympos",
    title: "No-Appointment Gals: Olympos",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00493.html",
    newOverview:
      "No-Appointment Gals: Olympos is a Japanese Human Entertainment release that plays more like a card-driven battle game than a standard visual novel. PSX DataCenter describes combat as choosing cards that determine what the on-screen character does, supported by Japanese voice acting and 2D cartoon presentation. GCX should position it as a quirky gyaru-game/card-battle hybrid where language, character art, and Human Entertainment collecting interest are the main hooks.",
  },
  {
    gameId: "ps1-nobunaga-hiroku-ge-ten-no-yume",
    title: "Nobunaga Hiroku: Ge-Ten no Yume",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00862.html",
    newOverview:
      "Nobunaga Hiroku: Ge-Ten no Yume is not a conventional Koei-style strategy entry; it is an Athena adventure/sound-novel about Oda Nobunaga. PSX DataCenter describes first-person story viewing with player choices that can send the plot toward different endings. GCX should separate it from the main Nobunaga's Ambition strategy line and describe it as a historical text-adventure import for readers interested in Nobunaga-themed media.",
  },
  {
    gameId: "ps1-nobunaga-no-yabou-returns",
    title: "Nobunaga no Yabou Returns",
    sourceUrl: "https://www.mobygames.com/game/208885/nobunaga-no-yabo-returns/",
    newOverview:
      "Nobunaga no Yabou Returns is a remake of Koei's original 1983 Nobunaga's Ambition, retaining the core conquest structure while updating the presentation for mid-1990s hardware. MobyGames describes the strategy loop as choosing Oda Nobunaga or Takeda Shingen and trying to conquer 17 regions of Kansai and central Japan, with redone graphics, sound, 3D daimyo portraits, and a remixed soundtrack. GCX should treat it as a historical remake, not just another numbered port.",
  },
  {
    gameId: "ps1-nobunaga-no-yabou-bushou-fuuunroku",
    title: "Nobunaga no Yabou: Bushou Fuuunroku",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPM-86174.html",
    newOverview:
      "Nobunaga no Yabou: Bushou Fuuunroku, known in English as Nobunaga's Ambition: Lord of Darkness, is a grand-strategy simulation of Sengoku-era unification. PSX DataCenter describes 15 warlords across multiple territories, one-to-eight-player support, scenarios around 1555 and 1571, and management of population, supplies, military, culture, and technology. GCX should emphasize its deep campaign management and historical-war simulation identity instead of leaving it as generic strategy copy.",
  },
  {
    gameId: "ps1-nobunaga-no-yabou-haouden",
    title: "Nobunaga no Yabou: Haouden",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-91022.html",
    newOverview:
      "Nobunaga no Yabou: Haouden is the fifth Nobunaga's Ambition entry, again turning 16th-century Japan into a long-form historical war simulation. PSX DataCenter lists three scenarios, nearly 60 playable real-life warlords and territories, support for up to eight players, plus PlayStation additions such as a character encyclopedia and CD music player. GCX should describe it as a broader, scenario-driven Sengoku strategy package with strong series-continuity value.",
  },
  {
    gameId: "ps1-nobunaga-no-yabou-reppuuden",
    title: "Nobunaga no Yabou: Reppuuden",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPM-86887.html",
    newOverview:
      "Nobunaga no Yabou: Reppuuden is the eighth Nobunaga's Ambition title, brought to PlayStation after its Windows release and cataloged as a strategy/tactical RPG-style historical simulation. PSX DataCenter notes support for short scenarios alongside larger unification goals, including routes focused on advancing toward Kyoto or unifying Kyushu. GCX should frame it as a more flexible campaign entry, useful for players who want Sengoku strategy without always committing to the longest possible run.",
  },
  {
    gameId: "ps1-nobunaga-no-yabou-sengouku-gunyuuden",
    title: "Nobunaga no Yabou: Sengouku Gunyuuden",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01247.html",
    newOverview:
      "Nobunaga no Yabou: Sengouku Gunyuuden is a Koei historical simulation, not a shooter, and the PlayStation version adds enhanced music and graphics to the earlier strategy design. PSX DataCenter describes multiple scenarios, siege warfare, field battles, and the goal of unifying 38 countries while commanding Sengoku daimyo and military officers. GCX should explicitly correct the genre and present it as a tactical grand-strategy branch of the Nobunaga line.",
  },
  {
    gameId: "ps1-nobunaga-no-yabou-shouseiroku",
    title: "Nobunaga no Yabou: Shouseiroku",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01115.html",
    newOverview:
      "Nobunaga no Yabou: Shouseiroku is the seventh Nobunaga's Ambition entry and one of the PlayStation-era versions focused on map-based internal affairs and battle planning. PSX DataCenter describes a renewed system built around a country-wide grid map, with domestic management and military strategy unfolding on the same strategic layer. GCX should call it a systems-heavy historical sim for players comparing how Koei modernized the series in the late 1990s.",
  },
  {
    gameId: "ps1-nobunaga-no-yabou-tenshouki",
    title: "Nobunaga no Yabou: Tenshouki",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00980.html",
    newOverview:
      "Nobunaga no Yabou: Tenshouki is a PlayStation version of Koei's mid-1990s Sengoku strategy simulation, with the Power-Up Kit release adding extra material to the base campaign. PSX DataCenter describes seasonal turn structure, 17-region and larger 50-scenario options, daimyo attributes, diplomacy, recruitment, army training, weapons, peasant morale, ninja actions, and hex-map battles. GCX should present it as one of the more detailed classic Nobunaga strategy entries on PS1.",
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
      "ps1",
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
