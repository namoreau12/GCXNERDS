const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-mahjongyarouze-mainichineko-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-mahjong-yarouze",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-86173.html",
    overview:
      "Mahjong Yarouze! gives Konami's PS1 mahjong table a cartoon presentation and a league structure. The player controls a mahjong competitor from a first-person table view, plays against three computer opponents, and moves through tournament and free-play options. It also includes support-style minigames and professional-mahjong flavor, so the disc feels more like a colorful training-and-competition package than a plain rules simulator.",
  },
  {
    id: "ps1-mahjong-youchien-tamago-gumi",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01311.html",
    overview:
      "Mahjong Youchien: Tamago Gumi is designed as a learn-from-zero mahjong title rather than a hard-edged competition disc. It separates study into multiple class levels, covering tile types, yaku, score calculation, and formulas while still letting players face many computer opponents. The classroom framing and simple character presentation make it useful for understanding how Japanese mahjong works before jumping into tougher PS1 table games.",
  },
  {
    id: "ps1-mahjong-youchien-tamago-gumi-2",
    sourceUrl: "https://www.igdb.com/games/0-kara-no-mahjong-mahjong-youchien-tamago-gumi-2",
    overview:
      "Mahjong Youchien: Tamago Gumi 2 continues Affect's beginner-focused mahjong-school concept. As a direct sequel, it keeps the idea of teaching mahjong through approachable lessons, mascot-like presentation, and computer opponents instead of assuming the player already understands every rule. It belongs beside the first Tamago Gumi as a training entry for players who want guided practice and a softer route into riichi mahjong.",
  },
  {
    id: "ps1-mahou-shoujo-fancy-coco",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00460.html",
    overview:
      "Mahou Shoujo Fancy Coco is a magical-girl training sim with card-battle, minigame, and schedule-management elements. The player raises and trains Coco in a Princess Maker-style structure, choosing how she spends time and watching her abilities and relationships develop. The PS1 release adds console-specific extras to an already unusual PC-98-origin life sim, making it part character-raising game, part magical-girl story, and part minigame collection.",
  },
  {
    id: "ps1-mahou-shoujo-pretty-sammy-part-1-in-the-earth",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00645.html",
    overview:
      "Mahou Shoujo Pretty Sammy Part 1: In The Earth adapts the Tenchi Muyo spin-off into a two-disc Japanese adventure game. The setup follows Sasami Kawai as she becomes Magical Girl Pretty Sammy, champion of justice for Tsunami of Juraihelm, while Pixy Misa complicates her ordinary life. The game leans on dialogue, comedy, fantasy, and character scenes rather than reflex-heavy action, making it most appealing as interactive Pretty Sammy fan material.",
  },
  {
    id: "ps1-mahou-shoujo-pretty-sammy-part-2-in-the-julyhelm",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00760.html",
    overview:
      "Mahou Shoujo Pretty Sammy Part 2: In the Julyhelm continues directly from the first PlayStation adventure. It keeps the same story-forward format while expanding the Juraihelm side of the Pretty Sammy world and bringing in familiar Tenchi Muyo characters in alternate roles. Players move through locations, conversations, and event scenes with limited interaction, so the value is in finishing the two-part magical-girl storyline rather than mastering a separate battle system.",
  },
  {
    id: "ps1-mahoutsukai-ni-naru-houhou",
    sourceUrl: "https://jrpgc.com/games/mahoutsukai-ni-naru-houhou/",
    overview:
      "Mahoutsukai ni Naru Houhou is a wizard-apprentice simulation and action-RPG hybrid set on an island. Players choose one of three apprentices, Lime, Berry, or Nut, then study under a master wizard while learning to make scrolls. Exploration sections send the player through 3D environments to find ingredients and trigger encounters, while the story portions are text-heavy. Its appeal is the blend of magical training, item gathering, and light RPG movement.",
  },
  {
    id: "ps1-mainichi-neko-youbi",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01249.html",
    overview:
      "Mainichi Neko Youbi is a cat-raising simulation built around everyday care and observation. Players choose from ten breeds, buy toys and food, offer milk or fish, wash their pet, visit the veterinarian, and can enter a cat contest. If the player keeps a pair, kittens can appear, adding a family-care angle. The included Japanese encyclopedia of breeds makes it feel as much like a pet-care reference toy as a conventional game.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on specialist catalog, database, and gameplay-description sources.",
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
