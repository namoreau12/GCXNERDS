const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-magicalmusic-mahjongdepon-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-magical-music-eigo-de-one-two-three",
    sourceUrl: "https://history-games.com/game/ps1/2699/kids-station-magical-music-eigo-de-one-two-three/",
    overview:
      "Magical Music Eigo de One - Two - Three! is a Kids Station educational PlayStation title from Bandai built around early English learning and music-themed minigames. Rather than a conventional rhythm game, it presents child-friendly activities with a group of mascot characters and simple interactive lessons. It is best understood as a Japanese preschool learning disc where songs, vocabulary, and short tasks carry the experience.",
  },
  {
    id: "ps1-magical-zunou-power-party-selection",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/135844-magical-zunou-power-party-selection",
    overview:
      "Magical Zunou Power!! Party Selection adapts Nippon Television's Magical Zunou Power quiz show into a PlayStation party game. Up to four players can compete with multitap support, answering questions and solving puzzle rounds to earn points across the session. Its appeal is social quiz-show play: quick prompts, light puzzle challenges, and score competition based on a Japanese TV format rather than a character campaign.",
  },
  {
    id: "ps1-mahjong-family-1500-series",
    sourceUrl: "https://consolemods.org/wiki/PS1%3APS1_Japan-exclusive_games",
    overview:
      "Mahjong (Family 1500 Series) is a budget-priced Japanese PlayStation riichi mahjong release from Magnolia and I'Max. It appears in the Family 1500 line as a straightforward table-game package, so its value is in low-cost, no-frills mahjong play rather than story presentation or anime extras. Players should expect a compact rules-focused disc for standard Japanese mahjong sessions.",
  },
  {
    id: "ps1-mahjong-hyper-value-2800",
    sourceUrl: "https://coleccionandovoy.com/index.php/items/I69027fb797154/Coleccionando%20Voy?locale=en",
    overview:
      "Mahjong (Hyper Value 2800) is Konami's budget PlayStation mahjong entry under the Hyper Value 2800 label. The package is aimed at players who want a simple riichi mahjong option on the console without the personality-driven framing found in some other Japanese table-game releases. Its identity is functional tabletop play centered on tile rules, hand building, and repeatable matches.",
  },
  {
    id: "ps1-mahjong-selen",
    sourceUrl: "https://www.pistik.net/videomang/mahjong-selen-ps",
    overview:
      "Mahjong (Selen) is a Japan-only PlayStation mahjong disc developed by ProSoft and published by Selen. Public catalog data points to a dedicated tabletop release rather than a broader adventure or party package. For players and collectors, the key identity is its publisher-specific budget-library role: a compact riichi mahjong game focused on traditional tile play and repeated CPU matches.",
  },
  {
    id: "ps1-mahjong-club",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/87580-mahjong-club",
    overview:
      "Mahjong Club is a Natsu System mahjong game that began on Super Famicom before receiving an enhanced PlayStation version from Hect. Like many Japanese mahjong releases, it places the player against three opponents and centers the challenge on completing a winning hand before the table does. The PlayStation version is notable as a Japan-only home-port upgrade for players who wanted a direct console mahjong session.",
  },
  {
    id: "ps1-mahjong-de-asobo",
    sourceUrl: "https://www.scribd.com/document/535139330/Playstation-Encyclopedia-2",
    overview:
      "Mahjong de Asobo wraps riichi mahjong in a light character premise set at a girls' high school, where the player faces three named opponents at the table. Winning can unlock extras such as character images and slide puzzles, with Japanese voice acting and gallery elements giving the disc more personality than a bare-bones rules package. It is still primarily a mahjong game, but with visual-novel-style flavor around the matches.",
  },
  {
    id: "ps1-mahjong-de-pon-hanafuda-de-koi-our-graduation",
    sourceUrl: "https://fudawiki.org/en/hanafuda/video-games",
    overview:
      "Mahjong de Pon! Hanafuda de Koi! Our Graduation is a Kid-published Japanese PlayStation table-game release that combines mahjong branding with hanafuda-themed appeal. Its title signals a character-forward package built around traditional Japanese tabletop play, rather than an arcade puzzle game. Collectors should treat it as a niche import whose interest comes from Kid's visual presentation and its mix of mahjong and flower-card motifs.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on database, catalog, retail, and specialist gameplay sources.",
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
