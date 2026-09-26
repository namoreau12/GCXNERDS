const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-kuma-kuroi-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-kuma-no-pooh-san-mori-no-nakamato-123",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPM-86933.html",
    overview:
      "Kuma no Pooh-San: Mori no Nakamato 123 is an Atlus Kids Station release built around Winnie-the-Pooh mini-games rather than a conventional adventure. The package sits in a preschool-friendly corner of the PlayStation library, with simple activities, character interaction, and counting/learning flavor carrying the experience. Its collector appeal comes from being a licensed Japanese Disney release, especially when found with the themed controller bundle and Kid Station packaging intact.",
  },
  {
    id: "ps1-kumitate-battle-kuttu-ketto",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-01208.html",
    overview:
      "Kumitate Battle: Kuttu Ketto is a Technosoft strategy/simulation oddity set in a fantasy world of strange customizable creatures. Players create up to three characters, adjust colors and clothing, buy gear such as boots, hats, swords, and shields, then send those creations into battle. It is better described as a playful build-and-battle import than a straight action game, with its personality coming from customization and creature tinkering.",
  },
  {
    id: "ps1-kunoichi-torimonochou",
    sourceUrl: "https://glitchwave.com/game/kunoichi-torimonochou/release/%E3%81%8F%E3%81%AE%E3%81%84%E3%81%A1%E6%8D%95%E7%89%A9%E5%B8%96-playstation-jp/",
    overview:
      "Kunoichi Torimonochou is a Japanese visual-novel adventure with ninja and Edo-period detective flavor. Its appeal is story progression, anime-style character presentation, and period mystery rather than free-roaming action. For GCX's library, the important distinction is that this is a text-led Polestar and GMF import: interesting to visual-novel collectors and regional PlayStation historians, but heavily dependent on Japanese reading ability.",
  },
  {
    id: "ps1-kuon-no-kizuna",
    sourceUrl: "https://www.gamerbraves.com/kuon-no-kizuna-sairinshou-released/",
    overview:
      "Kuon no Kizuna is FOG's original PlayStation love-adventure visual novel, later expanded through Sairinshou versions on Dreamcast, PlayStation 2, PC, and PSP. The story links modern romance to reincarnation and Heian-period echoes across multiple eras and chapters, making it a mood-heavy narrative release rather than horror action. It belongs in the library as an important FOG story game for readers interested in Japanese visual novels before the genre's wider Western recognition.",
  },
  {
    id: "ps1-kurashi-no-manner",
    sourceUrl: "https://psxdatacenter.com/games/J/S/SLPM-87022.html",
    overview:
      "Simple 1500 Jitsuyou Series Vol. 14: Kurashi no Manners - Kankonsousai Hen is a practical etiquette title from D3 Publisher, not a normal life-sim. It teaches social manners for formal events such as weddings and funerals, then uses quiz-style checks to test what the player has learned. Its value is as an example of the PlayStation's utility-software edge: budget-priced, highly Japanese, and aimed at practical cultural instruction instead of entertainment-first play.",
  },
  {
    id: "ps1-kuro-no-juusan",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-00505.html",
    overview:
      "Kuro no Juusan, also listed as Kuro no Jyusan, is a Tonkin House sound-novel adventure built around horror stories and branching choices. The game is divided into 13 chapters, with player decisions leading to different endings rather than combat or exploration systems. It is best treated as a Japanese horror visual novel: valuable for its atmosphere, anthology structure, and Tsuji Aya supervision, but not approachable without comfort reading Japanese.",
  },
  {
    id: "ps1-kuro-no-ken-blade-of-the-darkness",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-01030.html",
    overview:
      "Kuro no Ken: Blade of the Darkness is a classic Japanese RPG about Shinobu, a heroine drawn into a quest to stop the Black Dragon after its ancient seal breaks. The game emphasizes traditional adventure flow, turn-based battles, towns, dungeons, and fantasy-novel storytelling rather than the action implied by its title. For collectors, it is a compact import RPG from CD Bros. with enough mechanical substance to stand apart from pure visual novels.",
  },
  {
    id: "ps1-kuroi-hitomi-no-noir-cielgris-fantasm",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-01450.html",
    overview:
      "Kuroi Hitomi no Noir: Cielgris Fantasm is a Gust RPG starring Noire, a young magician trying to save a petrified friend before a limited number of days run out. It mixes Atelier-like job systems for earning money with time-based battles and monster recruitment, giving it a more unusual rhythm than a standard menu RPG. The result is a strong fit for Gust collectors: bright presentation, party growth, deadlines, and creature befriending all wrapped into one Japan-only PlayStation release.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on catalog, article, and specialist gameplay sources.",
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
