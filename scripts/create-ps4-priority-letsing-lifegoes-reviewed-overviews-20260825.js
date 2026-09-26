const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-letsing-lifegoes-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-let-s-sing-2020",
    sourceUrl: "https://letssing2020.com/int_ps4.html",
    overview:
      "Let's Sing 2020 is Voxler and Ravenscourt's PS4 karaoke entry built around contemporary pop, original music videos, pitch scoring, and party modes. Players can sing into USB microphones or use the companion phone app, competing solo or with friends across modes such as Classic, Mixtape, Feat., and World Contest. Its value comes from the 2020 playlist, which leans on late-2010s radio hits and gives PS4 owners a straightforward living-room karaoke setup.",
  },
  {
    id: "ps4-let-s-sing-2021",
    sourceUrl: "https://letssing2021.com/",
    overview:
      "Let's Sing 2021 continues the annual Voxler karaoke formula with a newer playlist, original videos, smartphone microphone support, and party-friendly scoring. The track list mixes current pop with older singalong picks, making it more about group familiarity and variety than mechanical novelty. It is best judged by whether its songs fit the room, because the core loop remains singing accurately, chasing scores, and handing the mic around.",
  },
  {
    id: "ps4-let-s-sing-country",
    sourceUrl: "https://store.playstation.com/en-us/product/UP2047-CUSA15815_00-VGKMLETSSINGCS20",
    overview:
      "Let's Sing Country adapts the karaoke series to country music, with 30 tracks ranging from well-known classics to modern radio selections. Players sing solo or with up to four people, use microphones or the phone app, and move through modes such as Classic, Feat., World Contest, and Jukebox. It is a niche branch of the series, strongest for groups that specifically want country songs rather than the broader pop playlists of the numbered entries.",
  },
  {
    id: "ps4-let-s-sing-queen",
    sourceUrl: "https://ravenscourt.games/en-GB/games/letssingqueen",
    overview:
      "Let's Sing Queen turns the karaoke framework into a focused tribute package for Queen, built around 30 of the band's songs and original music videos. Players can sing alone or with a group, tackle multiple modes, and move from stadium anthems to trickier vocal performances that make Freddie Mercury's range part of the challenge. It is less about yearly chart variety and more about being a dedicated Queen singalong collection.",
  },
  {
    id: "ps4-lethal-league",
    sourceUrl: "https://team-reptile.com/category/lethal-league/",
    overview:
      "Lethal League is Team Reptile's projectile-fighting game where up to four players bat an anti-gravity ball around an arena until it smashes into someone. Every hit makes the ball faster, turning simple strikes, bunts, and movement into frantic reads and mind games. It plays like a strange fusion of fighting game spacing, dodgeball, and high-speed Pong, making it a natural couch-competition game on PS4.",
  },
  {
    id: "ps4-lethal-league-blaze",
    sourceUrl: "https://www.lethalleagueblaze.com/",
    overview:
      "Lethal League Blaze expands Team Reptile's projectile-fighting idea with 3D-styled characters, more fighters, online play, modes, and a bigger sense of style. Players still win by smashing a ball into opponents, but throws, bunts, parries, special abilities, and escalating ball speed make each rally increasingly dangerous. It is the fuller, flashier sequel for players who like competitive party chaos with a real execution ceiling.",
  },
  {
    id: "ps4-letter-quest-remastered",
    sourceUrl: "https://store.playstation.com/en-gb/concept/208909",
    overview:
      "Letter Quest Remastered is a word-RPG puzzle game starring the reapers Grimm and Rose as they fight monsters with spelling. Players form words from letter tiles to deal damage, earn gems, buy upgrades, and push through stages full of ghosts, bunnies, and other enemies. The remaster adds higher-resolution art and extra content, making it a good fit for players who like word games with light RPG progression rather than pure crossword-style puzzles.",
  },
  {
    id: "ps4-life-goes-on-done-to-death",
    sourceUrl: "https://www.lgogame.com/",
    overview:
      "Life Goes On: Done to Death is a morbid puzzle-platformer where dying is the main mechanic. Players send disposable knights into traps, then use their bodies as platforms, weights, shields, or stepping stones to help the next knight reach the Cup of Life. Its humor comes from treating heroic sacrifice as a practical puzzle tool, and its best levels ask players to think through timing, placement, and exactly how useful a failed attempt can become.",
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
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    rows.push([
      "ps4",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl || game.descriptionSourceUrl || "",
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on verified identity, platform metadata, publisher/developer context, and official/store descriptions where available.",
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
