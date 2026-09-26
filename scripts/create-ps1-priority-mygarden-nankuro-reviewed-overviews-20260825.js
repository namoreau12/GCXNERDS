const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-mygarden-nankuro-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority PS1 weak-template cleanup; original GCX editorial overview based on platform databases, specialist game databases, series documentation, and gameplay/release context.";

const entries = [
  {
    id: "ps1-my-garden",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-02213.html",
    overview:
      "My Garden is Technosoft's Japan-only garden-management sim for PlayStation, closer in spirit to a small-scale Harvest Moon than to the studio's better-known shooters. Players guide a young girl who plants seeds, cares for flowers, trees, and other plants, sells what she grows, and uses the money to buy more seeds and items. Its charm is the quiet loop of tending a personal garden with help from the girl's grandmother.",
  },
  {
    id: "ps1-my-home-dream",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-91085.html",
    overview:
      "My Home Dream is a house-design simulation from Victor Interactive Software where players build a home through room layouts, walls, flooring, gardens, roofs, doors, windows, furniture, and household items. The appeal is practical design experimentation on a grid, not combat or character drama. It is a useful PS1 collector entry because it points toward later home-building and interior-design sims before those ideas became more common.",
  },
  {
    id: "ps1-mystic-ark-maboroshi-gekijo",
    sourceUrl: "https://en.wikipedia.org/wiki/Mystic_Ark",
    overview:
      "Mystic Ark: Maboroshi Gekijo is the PlayStation sequel to Enix and Produce's Super Famicom RPG, but it changes shape into an adventure game rather than repeating the original's party-based RPG structure. The theatre-of-illusions framing, Akihiro Yamada character art, and ark-powered puzzle logic make it an unusual follow-up. It is best understood as a story-and-puzzle-driven sequel for import fans of Enix's stranger late-1990s catalog.",
  },
  {
    id: "ps1-mystic-mind",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01562.html",
    overview:
      "Mystic Mind: Yureru Omoi is a Japanese dating simulation from Mycom that lets the player choose either Kei Katsuragi or Megumi Kawai as the protagonist. That gender choice changes the social routes and characters encountered, giving the game a branching relationship-sim structure instead of a fixed visual-novel path. Its two-disc PlayStation release is mainly notable for dating-sim collectors and fans of late-1990s Japanese romance adventures.",
  },
  {
    id: "ps1-n-gauge-unten-kibun-game-gatan-goton",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPM-86217.html",
    overview:
      "N-Gauge Unten Kibun Game: Gatan Goton is a Japanese model-train driving simulation, using the feel of N-scale railroading rather than normal arcade racing. Routes, time-attack play, and train-cab viewpoints give it a Densha de Go-style structure, but the miniature-town presentation makes it a distinct railway hobbyist title. It is a strong example of the PlayStation's niche simulation library.",
  },
  {
    id: "ps1-nainai-no-meitantei",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02500.html",
    overview:
      "Nainai no Meitantei is Namco and Tose's PlayStation comedy-detective adventure built around Japanese entertainer casting. Rather than a generic mystery, it uses live comedian personalities and case-solving scenes to create a showbiz-flavored detective game. Players should expect investigation, conversations, and comedic scenario beats, making it a late-PS1 cousin to Japan's earlier celebrity mystery adventures.",
  },
  {
    id: "ps1-najavu-no-daibouken-my-favorite-namjatown",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPM-86601.html",
    overview:
      "Najavu no Daibouken: My Favorite Namjatown is a Namco minigame adventure starring Najavu, an archaeologist exploring for rare artifacts and amusement-park-style discoveries. Progress comes from clearing different minigames, which unlock more of the adventure instead of building a single action system. Its connection to Namjatown gives it extra value as a Namco theme-park curiosity, not just another mascot compilation.",
  },
  {
    id: "ps1-namco-mahjong-sparrow-garden",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00074.html",
    overview:
      "Namco Mahjong: Sparrow Garden is a PlayStation mahjong release with cartoon-styled characters, multiple camera angles, different game modes, and computer opponents built around a more human-like thinking routine. The appeal is traditional table play with Namco presentation polish rather than arcade spectacle. It is a useful early PS1 library entry for players tracking Japanese board and parlor-game software.",
  },
  {
    id: "ps1-namco-soccer-prime-goal",
    sourceUrl: "https://psxdatacenter.com/games/P/N/SCES-00266.html",
    overview:
      "Namco Soccer Prime Goal brings Namco's Prime Goal football line to PlayStation with national-team play, tackles, volleys, penalties, and offside rules. It is a straightforward soccer game from the era before the genre settled around the long-running FIFA and Winning Eleven rivalry. For collectors, the key context is Namco's arcade/sports pedigree and the Prime Goal lineage that began on earlier Japanese hardware.",
  },
  {
    id: "ps1-naniwa-kinyuu-michi",
    sourceUrl: "https://db.hfsplay.fr/games/163613-naniwa-kinyuu-michi?lang=en",
    overview:
      "Naniwa Kinyuu Michi is a financial-themed board game based on Yuji Aoki's manga about Osaka money lending and hard-edged business life. Up to four human players can compete, with the goal centered on reaching a large money target rather than finishing a sports season or RPG quest. Its value is the mix of manga license, board-game structure, and finance satire, which makes it far more specific than a generic strategy entry.",
  },
  {
    id: "ps1-naniwa-no-akindo-futte-nanbo-no-saikoro-jinsei",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-00768.html",
    overview:
      "Naniwa no Akindo: Futte Nanbo no Saikoro Jinsei is a dice-driven board game for PlayStation, supporting up to four players through the multitap. Players choose characters and move through a merchant-life board-game setup where luck, position, and event outcomes shape the match. It is best framed as a Japan-only party board game from Sony Music Entertainment rather than as a rhythm title.",
  },
  {
    id: "ps1-naniwa-wangan-battle",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-01206.html",
    overview:
      "Naniwa Wangan Battle is a night street-racing game tied to the Shutokou Battle family, focused on high-speed Japanese cars and upgrade-driven competition. Scenario mode asks players to win races and earn money for car improvements, while later budget rereleases added two-player racing. Its appeal is late-1990s Japanese highway-racing culture, making it a notable import for fans of the pre-Tokyo Xtreme Racer lineage.",
  },
  {
    id: "ps1-nankuro",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPS-02067.html",
    overview:
      "Nankuro is Success' SuperLite 1500 numeric-crossword collection for PlayStation, built around more than 200 Japanese-language nankuro puzzles. Players fill grids by matching numbers to characters, with rule explanations and clear-problem progression helping beginners learn the format. It is a pure logic-puzzle release and a good example of how the PS1 budget line served newspaper and magazine puzzle fans.",
  },
  {
    id: "ps1-nankuro-2",
    sourceUrl: "https://kotaku.com/games/superlite-1500-series-nankuro-2",
    overview:
      "Nankuro 2 continues Success' SuperLite 1500 numeric-crossword series with another budget-priced PlayStation puzzle collection. The loop remains focused on solving numbered Japanese character grids rather than action or story, making it a short-session logic game for players who already enjoy nankuro-style crosswords. Its collector interest comes from being part of Success' durable budget puzzle catalog.",
  },
  {
    id: "ps1-nankuro-3",
    sourceUrl: "https://psxdatacenter.com/games/J/N/SLPM-86534.html",
    overview:
      "Nankuro 3 is the third PlayStation entry in Success' SuperLite 1500 numeric-crossword line, again offering more than 200 Japanese-language nankuro puzzles. It does not need to be oversold as a broad puzzle adventure; its identity is focused, portable-feeling grid solving on a home console. For collectors, it helps complete the Success nankuro sequence that ran through multiple PlayStation budget releases.",
  },
];

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const missing = entries.filter((entry) => !byId.has(entry.id));
  if (missing.length) {
    throw new Error(`Missing PS1 games: ${missing.map((entry) => entry.id).join(", ")}`);
  }

  const rows = [
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "ps1",
        entry.id,
        game.title || game.name || "",
        game.description || game.gcxOverview || game.overview || "",
        entry.sourceUrl,
        rewriteNotes,
        entry.overview,
        "reviewed",
        "GCX editorial cleanup",
      ];
    }),
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(`Wrote ${entries.length} reviewed PS1 overviews to ${path.relative(rootDir, outputPath)}`);
}

main();
