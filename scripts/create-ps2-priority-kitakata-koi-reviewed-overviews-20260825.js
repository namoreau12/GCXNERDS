const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-kitakata-koi-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-kitakata-kenzou-san-goku-shi",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/389774-kitakata-kenzou-san-goku-shi",
    overview:
      "Kitakata Kenzou San Goku Shi is a Japanese PlayStation 2 adventure game from Media Factory, released June 14, 2001 according to LaunchBox catalog data. The title connects novelist Kenzo Kitakata's take on the Romance of the Three Kingdoms to an early PS2 text/adventure-style release rather than a conventional party-building RPG. GCX should keep the profile modest: it is a literary/historical import built around scenario presentation and Sangokushi subject matter, with collector interest tied to Media Factory's niche PS2 catalog.",
  },
  {
    id: "ps2-kiwame-mahjong-dxii",
    sourceUrl: "https://www.honestgamers.com/45187/playstation-2/kiwame-mahjong-dxii/game.html",
    overview:
      "Kiwame Mahjong DXII is a Japanese PlayStation 2 mahjong release from Athena, with catalog records placing it in Japan on December 18, 2003. It belongs to the long-running Kiwame/Pro Mahjong line, a series focused on Japanese mahjong rules and table play rather than puzzle abstraction. GCX should describe it as a dedicated mahjong simulation for import players, where the practical collector notes are Athena publishing, Japanese text/rules familiarity, and its position late in the Kiwame series' console run.",
  },
  {
    id: "ps2-knight-rider-the-game",
    sourceUrl: "https://en.wikipedia.org/wiki/Knight_Rider%3A_The_Game",
    overview:
      "Knight Rider: The Game is Davilex Games' 2002 PlayStation 2 and PC adaptation of the original Knight Rider television series. Players control KITT through missions built around racing, exploration, chasing, scanning, and other car-action objectives, while series villains such as KARR and Garthe Knight appear. GCX should frame it as a licensed TV car-action game rather than pure racing, with collector interest tied to the Knight Rider brand, PAL/PC history, and Davilex's early-2000s licensed catalog.",
  },
  {
    id: "ps2-knight-rider-the-game-2",
    sourceUrl: "https://www.gog.com/dreamlist/game/knight-rider-2-the-game-2004",
    overview:
      "Knight Rider: The Game 2 is the 2004 sequel to Davilex's Knight Rider adaptation, released for PlayStation 2 and PC. Catalog and series sources identify it as another single-player action/racing sci-fi title, again centered on controlling KITT, with later descriptions highlighting gadgets such as turbo boost, ski mode, super pursuit mode, weapons, scanning, and shield functions. GCX should describe it as an expanded but still niche licensed sequel for Knight Rider collectors and PAL-era action-racing fans.",
  },
  {
    id: "ps2-knockout-kings-2001",
    sourceUrl: "https://en.wikipedia.org/wiki/Knockout_Kings_2001",
    overview:
      "Knockout Kings 2001 is Electronic Arts' early PlayStation 2 boxing game, developed by Black Ops Entertainment for the PS2 launch window. The series entry focuses on licensed boxing presentation, a roster of real and legendary fighters, and ring controls built around jabs, hooks, uppercuts, blocking, and fighter momentum. GCX should present it as EA's first PS2-era boxing step before the Fight Night rebrand, with collector interest tied to sports-launch libraries and the transition from PS1/N64 boxing to sixth-generation presentation.",
  },
  {
    id: "ps2-knockout-kings-2002",
    sourceUrl: "https://en.wikipedia.org/wiki/Knockout_Kings_2002",
    overview:
      "Knockout Kings 2002 is EA's follow-up boxing release for PlayStation 2, GameCube, and Xbox, arriving before the publisher moved the series toward Fight Night. The game keeps the licensed boxing focus, using real fighters, venues, and timing-heavy punch exchanges rather than arcade brawling. GCX should describe it as a mainstream sixth-generation boxing sim with value for sports collectors who track EA's combat-sports lineage, roster changes, and the short-lived final years of the Knockout Kings name.",
  },
  {
    id: "ps2-kohitsuji-hokaku-keakaku-sweet-boys-life",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65938.html",
    overview:
      "Kohitsuji Hokaku Keakaku! Sweet Boys Life is a Japanese PlayStation 2 romance/adventure release from Idea Factory. PSXDataCenter identifies it as an NTSC-J adventure/visual-novel style game and places it in Idea Factory's otome-leaning catalog rather than in traditional RPG territory. GCX should describe it as a character-route import focused on relationship scenes and story progression, with collector interest tied to Idea Factory's PS2 visual-novel output and complete Japanese packaging.",
  },
  {
    id: "ps2-koi-to-namida-to-tsuioku-to",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25242.html",
    overview:
      "Koi to Namida to, Tsuioku to... is a Japanese PlayStation 2 visual novel/adventure from HuneX and D3 Publisher. PSXDataCenter lists it as an NTSC-J adventure/visual-novel release, matching D3's early-2000s interest in smaller romance and story-driven PS2 titles. GCX should position it as a niche relationship drama import where the appeal is character writing and route progression, not reflex-based action, and where collectors should note HuneX involvement and Japanese-language dependency.",
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
    if (!game) throw new Error(`Missing PS2 game ${rewrite.id}`);
    rows.push([
      "ps2",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on catalog, platform database, franchise, and product sources.",
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
