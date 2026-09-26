const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-lord-lucifer-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-lord-of-monsters",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SCPS-10086.html",
    overview:
      "Lord of Monsters is a Japan-only PlayStation strategy game built around staged duels between summoners. Each map asks the player to call monsters into battle, manage the flow of summoned units, and break the opponent's life bar before losing their own. Its structure is closer to a compact tactical arena game than a traditional menu RPG, with difficulty tied to the chosen character and the timing of each summon.",
  },
  {
    id: "ps1-lord-of-the-jungle",
    sourceUrl: "https://kotaku.com/games/lord-of-the-jungle",
    overview:
      "Lord of the Jungle is one of Midas and The Code Monkeys' budget PlayStation releases built around a public-domain-style animated feature. The package mixes a half-hour cartoon presentation with simple interactive extras, including a colouring-book activity and puzzle game. It plays less like a full action RPG and more like a late-era PAL children's multimedia disc with light puzzle interaction.",
  },
  {
    id: "ps1-love-game-s-wai-wai-tennis",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-00686.html",
    overview:
      "Love Game's: Wai Wai Tennis is the first PlayStation entry in Tears' arcade-leaning tennis series. It offers a story mode where players create a male or female tennis player and work through matches across different courts, plus modes for tournament play and head-to-head matches. The hook is not licensed athletes; it is a cheerful Japanese tennis package that blends character creation, court variety, and accessible rallies.",
  },
  {
    id: "ps1-love-game-s-wai-wai-tennis-2",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-02510.html",
    overview:
      "Love Game's: Wai Wai Tennis 2 expands the series' player-creation angle into a more detailed tennis sim. Source descriptions emphasize building a player from scratch, choosing physical traits, style of play, handedness, backhand strength, temperament, and surface strengths. It is still approachable PlayStation tennis, but the sequel's identity comes from tailoring a custom athlete before taking them through matches.",
  },
  {
    id: "ps1-love-game-s-wai-wai-tennis-plus",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPM-86899.html",
    overview:
      "Love Game's: Wai Wai Tennis Plus is the final PlayStation release in the Wai Wai Tennis line and works like an upgraded arcade-tennis edition. It keeps tournament and versus play while adding quick play, sharper presentation, and broader animation variety compared with the original. The value is immediacy: jump into singles or doubles-style matches, use a lighthearted roster, and get a faster party-sports version of the series.",
  },
  {
    id: "ps1-love-love-truck",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-02112.html",
    overview:
      "Love Love Truck, also known as Love Love Torokko, is an unusual Japanese minecart action game with dating-sim flavor. One or two players operate a cart through five themed stages while trying to grab items, maintain momentum, and search for a legendary diamond. The oddball appeal is the partnership gimmick: players pump the cart, coordinate jumps and pickups, and can also use a compatibility-focused Love Mode.",
  },
  {
    id: "ps1-love-therapy",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-01370.html",
    overview:
      "Love Therapy is a Japanese dating simulation split across Love Story, Therapy, and Catalog modes. In Love Story, the player tries to build a relationship with one of 12 girls by choosing date locations, buying gifts, and answering questions in ways that fit the character. The loop is more about reading preferences and repeating dates successfully than branching visual-novel drama, with the separate Therapy mode leaning into personality-question content.",
  },
  {
    id: "ps1-lucifer-ring",
    sourceUrl: "https://blog.playstation.com/2014/01/20/monkeypaw-games-retro-rush-week-2-lucifer-ring/",
    overview:
      "Lucifer Ring is a 3D fantasy beat-'em-up from Soft Machine, later highlighted by MonkeyPaw as a PlayStation import release. Players control Nash, a swordsman trying to stop a dark wizard from using the Lucifer Rings, and fight through linear stages filled with hack-and-slash encounters, minibosses, and larger bosses. Its appeal is straightforward late-PS1 action: simple sword combos, forward momentum, and a strange monster-fantasy tone rather than deep RPG systems.",
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
    if (!game) throw new Error(`Missing PS1 game ${rewrite.id}`);
    rows.push([
      "ps1",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on specialist database, review, and gameplay sources.",
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
