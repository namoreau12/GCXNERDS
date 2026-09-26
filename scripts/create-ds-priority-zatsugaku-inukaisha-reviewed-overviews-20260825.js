const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-zatsugaku-inukaisha-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-imasugu-tsukaeru-mamechishiki-quiz-zatsugaku-ou-ds",
    sourceUrl: "https://gamegear.net/archive/games/nds/imasugu-tsukaeru-mamechishiki-quiz-zatsugaku-ou-ds-japan",
    overview:
      "Imasugu Tsukaeru Mamechishiki: Quiz Zatsugaku-Ou DS is a Japan-only trivia and general-knowledge quiz release. The title focuses on short question sets built around practical bits of knowledge, making it closer to a portable quiz drill than an arcade puzzle game. For GCX browsing, the important distinction is that its value is in Japanese-language trivia play and collection completeness, not action, story, or character progression.",
  },
  {
    id: "ds-indoor-sports-club",
    sourceUrl: "https://www.honestgamers.com/55989/ds/indoor-sports-club/game.html",
    overview:
      "Indoor Sports Club is a compact White Park Bay sports package for Nintendo DS. Rather than focusing on a licensed league or career mode, it groups small indoor-style sports challenges into a family-friendly cartridge. The release is most useful in the library as a low-profile PAL-era sports compilation, where collectors should pay attention to region, case/manual completeness, and the specific White Park Bay publishing credit.",
  },
  {
    id: "ds-intellivision-lives",
    sourceUrl: "https://en.wikipedia.org/wiki/Intellivision_Lives%21",
    overview:
      "Intellivision Lives! brings a large set of classic Mattel Intellivision games to Nintendo DS through emulation. The DS version uses the lower touch screen to mimic the original console's keypad overlays, includes wireless multiplayer with a single game card, and preserves arcade, sports, strategy, and unreleased titles from the early-1980s library. It is a retro compilation whose interface quirks are part of the historical package.",
  },
  {
    id: "ds-interactive-storybook-series-1",
    sourceUrl: "https://www.amazon.com/Interactive-Storybook-1-Nintendo-DS/dp/B000RZ8Z7S",
    overview:
      "Interactive Storybook Series 1 is a Tommo educational reading cartridge for younger DS players. It presents classic children's stories as read-aloud pages with touch-screen interactive elements, then supports them with simple educational minigames and activities. The experience is closer to a digital picture book than an adventure game, so its place in the library is early-learning software rather than conventional DS storytelling.",
  },
  {
    id: "ds-interactive-storybook-series-2",
    sourceUrl: "https://www.walmart.com/ip/Interactive-Storybook-Series-2/7080052",
    overview:
      "Interactive Storybook Series 2 continues Tommo's DS picture-book format with stories such as The Frog Prince, The Ant and the Grasshopper, The Town Mouse and the Country Mouse, and The Dragon's Riddle. Pages include touch interactions and professional read-aloud narration, while side activities include story-linked minigames, coloring, drawing, and basic counting. It is best cataloged as educational reading software for children.",
  },
  {
    id: "ds-interactive-storybook-series-3",
    sourceUrl: "https://www.estarland.com/product-description/NintendoDS/Interactive-Storybook-DS-Series-3/29744",
    overview:
      "Interactive Storybook Series 3 adds another set of children's tales to Tommo's DS reading line, including The Golden Axe and the Silver Axe, The Old Man Cherry Blossom, The Wolf and the Seven Little Goats, and A Dog of Flanders. The cartridge uses still-story presentation, touchable page elements, and kid-friendly activities to turn familiar stories into light interactive lessons rather than a goal-driven game.",
  },
  {
    id: "ds-intervilles",
    sourceUrl: "https://www.mobygames.com/game/203017/intervilles/",
    overview:
      "Intervilles is a French licensed party game based on the long-running television game show. Players move through town-versus-town minigame events designed to echo the show's slapstick physical challenges and team competition. On DS it belongs more with European TV tie-in party games than traditional sports sims, with its appeal depending on recognition of the Intervilles format and its collection value as a regional Mindscape release.",
  },
  {
    id: "ds-inu-kaisha",
    sourceUrl: "https://www.play-asia.com/en/inu-kaisha-ds/13/70376x",
    overview:
      "Inu Kaisha is a Japan-only CyberFront DS strategy and management game centered on a dog company concept. Available catalog listings frame it as a 2009 strategy release, and gameplay footage shows a pet-management/business premise rather than a standard adventure. For GCX, it should be presented as a quirky import simulation where the notable hooks are the dog-company theme, Japanese text, and CyberFront publishing provenance.",
  },
];

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = [
    [
      "platformSlug",
      "gameId",
      "title",
      "currentOverview",
      "sourceUrl",
      "rewriteNotes",
      "newOverview",
      "reviewStatus",
      "reviewer",
    ],
  ];

  rewrites.forEach((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing DS game ${rewrite.id}`);
    rows.push([
      "ds",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority DS weak-template cleanup; original GCX editorial overview based on catalog, retail, specialist database, and gameplay-description sources.",
      rewrite.overview,
      "reviewed",
      "GCX editorial cleanup",
    ]);
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rows: rewrites.length }, null, 2));
}

main();
