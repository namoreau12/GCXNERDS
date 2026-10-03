const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-squeeballs-stratego-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "ds-squeeballs-party",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/959063-squeeballs-party",
    overview:
      "Squeeballs Party is a DS minigame collection from Eiconic Games and Aksys built around toy-creature quality-control tests. Its identity is oddball party play: bowling with Squeeballs, steady-hand shock challenges, and short score-driven events with a mischievous tone. It belongs with the DS library's stranger family-party curios, where the appeal is novelty and quick minigame variety rather than RPG progression.",
  },
  {
    id: "ds-squinkies",
    sourceUrl: "https://www.mobygames.com/game/90334/squinkies/",
    overview:
      "Squinkies is Activision and HumanSoft's DS adaptation of the small collectible toy line. The game is best understood as a young-player licensed cartridge built around cute character collecting and toy-brand familiarity, not a deep platformer or simulation. Its practical value comes from the Squinkies license, 2011 DS timing, North American and European release context, and complete retail packaging.",
  },
  {
    id: "ds-squinkies-2-adventure-mall-surprize",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/638710-squinkies-2-adventure-mall-surprize/data",
    overview:
      "Squinkies 2: Adventure Mall Surprize! turns the toy brand into a side-scrolling DS platform game set around a mall adventure. Activision's release data emphasizes more than 600 Squinkies, over 50 playable characters, shopping areas, food-court stops, rides, and bouncing platform play. It is a sequel with a toy-bundle variant, so collectors should notice the exclamation-point title, package type, and Squinkies branding.",
  },
  {
    id: "ds-squishy-tank",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/960417-squishy-tank/data",
    overview:
      "Squishy Tank is Natsume's North American version of Success's Japanese DS puzzle game Touch de Taikyaku! Yawaraka Sensha. It is a matching puzzle game with cartoon military humor, wacky power-ups, four main modes, unlockable retro-style minigames, and cosmetic tank accessories. The game fits the DS puzzle shelf as a quirky localization rather than a strategy war game.",
  },
  {
    id: "ds-steal-princess",
    sourceUrl: "https://www.nintendolife.com/games/ds/steal_princess",
    overview:
      "Steal Princess is Climax Entertainment's DS puzzle-platform adventure starring Anise, a thief drawn into saving a kidnapped prince. Atlus described it as a 3-D puzzle/platformer with more than 150 stages, action movement, puzzle solving, and a level creator for custom maps. Its collector appeal is the Atlus/Marvelous niche, isometric puzzle structure, and Wi-Fi-era level-sharing feature rather than a standard princess-themed family game.",
  },
  {
    id: "ds-sternenschweif-das-geheimnis-im-zauberwald",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/306018-sternenschweif-das-geheimnis-im-zauberwald/media",
    overview:
      "Sternenschweif: Das Geheimnis im Zauberwald is a German-language DS adventure from Quadriga Games and United Soft Media based on the Sternenschweif horse-and-unicorn children's series. The game follows Laura and her magical pony world through light action, puzzles, and story scenes for young readers. Its catalogue value is the European-only release, German text, Sternenschweif license, and exact DS edition versus the later 3DS version.",
  },
  {
    id: "ds-sternentanzer-das-geheimnisvolle-pferd",
    sourceUrl: "https://fantasyguide.de/sternentaenzer-das-geheimnisvolle-pferd-ds.html",
    overview:
      "Sternentanzer: Das geheimnisvolle Pferd is a German DS horse adventure from syncRage and Tivola. Coverage of the game centers on caring for Sternentänzer, stable chores, guests, conversations, and a mystery thread involving strange calls and horse-knowledge questions. It is a text-heavy European horse-care story game, so language comfort and complete PAL packaging matter as much as the pet-sim mechanics.",
  },
  {
    id: "ds-stratego-next-edition",
    sourceUrl: "https://www.lifepr.de/pressemitteilung/ubisoft-gmbh/Stratego-Next-Edition-erfordert-taktische-Rafinesse/boxid/34136",
    overview:
      "Stratego: Next Edition is Ubisoft's DS version of the hidden-rank strategy board game, announced in Europe as the first Nintendo DS adaptation of Stratego. The appeal is portable tactical play: arranging pieces, bluffing around unknown ranks, protecting the flag, and reading the opponent's attacks. It belongs beside DS chess, card, and board-game conversions, with European region and exact subtitle doing most of the collector work.",
  },
];

const headers = [
  "platformSlug",
  "gameId",
  "title",
  "currentOverview",
  "sourceUrl",
  "rewriteNotes",
  "newOverview",
  "reviewStatus",
  "reviewer",
];

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = reviewedOverviews.map((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing DS game ${rewrite.id}`);
    return {
      platformSlug: "ds",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority DS weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus public database, publisher, retail, and specialist references.",
      newOverview: rewrite.overview,
      reviewStatus: "reviewed",
      reviewer: "Games Exchange editorial cleanup",
    };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );
  console.log(JSON.stringify({ ok: true, outputPath: path.relative(rootDir, outputPath), rows: rows.length }, null, 2));
}

main();
