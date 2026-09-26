const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-kouenji-kurukuru-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "ds",
    gameId: "ds-kouenji-joshi-soccer-2-koi-wa-nebagiba-kouenji",
    title: "Kouenji Joshi Soccer 2: Koi wa Nebagiba Kouenji",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/141640-kouenji-joshi-soccer-2-koi-wa-nebagiba-kouenji",
    newOverview:
      "Kouenji Joshi Soccer 2: Koi wa Nebagiba Kouenji is a Japan-only Starfish SD release that blends girls' soccer with adventure and sports-themed visual-novel structure. Rather than reading as a pure match simulator, it sits closer to a school-team story with soccer as the competitive frame. GCX should position it as an import character-sports title, useful for collectors tracking unusual DS sports hybrids and Starfish's niche catalog.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-koukou-juken-eitango-get-through-1900-eitan-zamurai-ds",
    title: "Koukou Juken: Eitango Get Through 1900 - Eitan Zamurai DS",
    sourceUrl: "https://www.honestgamers.com/56497/ds/koukou-juken-eitango-get-through-1900-eitan-zamurai-ds/game.html",
    newOverview:
      "Koukou Juken: Eitango Get Through 1900 - Eitan Zamurai DS is a Japanese English-vocabulary study title from Good-Feel and Educational Network. The title points directly at high-school entrance exam prep, with the DS used as a drill-and-review tool rather than a traditional game system. GCX should treat it as an educational import collectible, notable because Good-Feel later became associated with much more widely known character games.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-koukou-yakyuu-dou-ds",
    title: "Koukou Yakyuu Dou DS",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/141338-koukou-yakyuu-dou-ds",
    newOverview:
      "Koukou Yakyuu Dou DS is Spike's Japanese high-school baseball management simulation for Nintendo DS. Its focus is the coaching and team-building side of scholastic baseball rather than arcade batting spectacle, putting it in the same collector lane as other Japan-only sports-management titles. GCX should describe it as a niche baseball sim where appeal depends on roster management, school-tournament flavor, and Japanese-language comfort.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-koushounin-ds-the-negotiator",
    title: "Koushounin DS: The Negotiator",
    sourceUrl: "https://japanretrodirect.ocnk.com/product/3517",
    newOverview:
      "Koushounin DS: The Negotiator is part of D3/Alpha Unit's Simple DS line and centers its adventure setup on negotiation. Instead of combat or sports systems, the hook is reading the scenario, choosing responses, and pushing conversations toward a resolution. GCX should present it as a budget-line Japanese adventure built around dialogue pressure and situational choices, with region-free DS hardware making it accessible but language-heavy.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kreuzwortraetsel-ds-welt-edition",
    title: "Kreuzwortraetsel DS: Welt Edition",
    sourceUrl: "https://www.retrogames.cc/nds-games/kreuzwortraetsel-ds-welt-edition-germany.html",
    newOverview:
      "Kreuzwortraetsel DS: Welt Edition is a German Nintendo DS crossword release from The Game Company, aimed at quick puzzle sessions rather than story or action play. The DS format makes sense for handwriting, clue reading, and portable word-puzzle solving, especially for players who wanted newspaper-style puzzles on a dedicated handheld. GCX should identify it as a regional European word-game entry where language and completeness matter most.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kumatanchi",
    title: "Kumatanchi",
    sourceUrl: "https://www.hardcoregaming101.net/kumatanchi/",
    newOverview:
      "Kumatanchi is Vanillaware and Ashinaga Oji-san's Japan-only life simulation about caring for Kuma-tan, an anthropomorphic bear-girl zoo resident, over a two-week real-time schedule. Players feed her, interact with her, decorate her living space, and influence her mood and show performance. GCX should call out the unusual Vanillaware connection, real-time caretaker structure, and import-only status, since those are the reasons collectors seek it out.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kunitori-zunou-battle-nobunaga-no-yabou",
    title: "Kunitori Zunou Battle: Nobunaga no Yabou",
    sourceUrl: "https://ontlogy.wordpress.com/2013/05/23/game-spotlight-kunitori-zunou-battle-nobunaga-no-yabou/",
    newOverview:
      "Kunitori Zunou Battle: Nobunaga no Yabou reworks Koei's Sengoku-era strategy identity into a more approachable tactical board-game format on DS. Instead of asking players to manage a full grand-strategy simulation, it uses simpler rules around territory control and historical-warrior theming while keeping meaningful positional decisions. GCX should frame it as a lighter Nobunaga's Ambition branch for strategy collectors, not a mainline conquest sim.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kupuu-mamegoma",
    title: "Kupuu!! Mamegoma!",
    sourceUrl: "https://www.vgchartz.com/game/36122/qupu-mame-goma/",
    newOverview:
      "Kupuu!! Mamegoma! is a Japan-only virtual-life game built around the Mamegoma seal characters, with care, routine interaction, and gentle collection appeal at the center. The title belongs with DS pet and character-life software rather than competitive sims, giving it a slower, toy-like rhythm for younger players and mascot fans. GCX should describe it as a cute-character care sim where condition and franchise interest drive collector value.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kurayami-no-hate-de-kimi-o-matsu",
    title: "Kurayami no Hate de Kimi o Matsu",
    sourceUrl: "https://gamegear.net/archive/games/nds/kurayami-no-hate-de-kimi-o-matsu-japan",
    newOverview:
      "Kurayami no Hate de Kimi o Matsu is a Japanese DS adventure from WitchCraft and D3 Publisher, with a darker suspense tone than the platform's usual light dating or school-life visual novels. Available footage and cataloging place it firmly as an adventure release, so GCX should frame it as a text-driven thriller import where choices, character tension, and Japanese comprehension matter more than reflex play.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kurukuru-princess-tokimeki-figure-mezase-vancouver",
    title: "Kurukuru * Princess: Tokimeki Figure * Mezase! Vancouver",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/134192-kurukuru-princess-tokimeki-figure-mezase-vancouver",
    newOverview:
      "Kurukuru Princess: Tokimeki Figure - Mezase! Vancouver is Spike's Japan-only DS figure-skating entry, cataloged as a sports release and connected to the broader Kurukuru Princess line. Its appeal is the mix of skating routines, performance presentation, and character-driven progression rather than a conventional team-sports season. GCX should present it as a niche winter-sports import for players collecting DS skating, rhythm, and character-sim hybrids.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing DS game record for ${gameId}`);
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
      "Priority DS weak-template replacement with source-backed GCX editorial overview.",
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
