const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "saturn.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "saturn-priority-metamor-hop-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "saturn-himitsu-sentai-metamor-v",
    sourceUrl: "https://gamefaqs.gamespot.com/saturn/574163-himitsu-sentai-metamor-v",
    overview:
      "Himitsu Sentai Metamor V is a Japan-only Saturn adventure game from Feycraft and Mainichi Communications, released in 1998. Its title and presentation place it in the sentai-inspired character-adventure lane, so the useful collector framing is not action depth but Japanese-language story play, exact packaging, and the game's place among Saturn imports that lean on anime-style team identity.",
  },
  {
    id: "saturn-hissatsu",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Sega_Saturn_games",
    overview:
      "Hissatsu! is a Japanese Saturn release developed by KID and published by Emotion Digital Software. Public English documentation is thin, so the honest catalogue value is its Japan-only Saturn status, KID connection, and likely text-heavy adventure/import appeal rather than an invented feature list. Listings should be careful about language dependence, region, disc condition, and exact title spelling.",
  },
  {
    id: "saturn-hiyake-no-omoide-and-himekuri-girls-in-motion-puzzle-vol-1",
    sourceUrl: "https://www.myabandonware.com/game/hiyake-no-omoide-himekuri-girls-in-motion-puzzle-vol-1-nbk",
    overview:
      "Hiyake no Omoide & Himekuri: Girls in Motion Puzzle Vol. 1 is a 1995 Saturn puzzle release from Japan Media Programming and Yanoman. It belongs to the system's adult-leaning import puzzle niche, built around assembling image puzzles rather than action or story progression. The important buyer signals are volume number, Japanese Saturn region, age-sensitive presentation, and complete disc/manual condition.",
  },
  {
    id: "saturn-honkaku-4-nin-uchi-geinoujin-taikyoku-mahjong-the-wareme-de-pon",
    sourceUrl: "https://www.gamesdatabase.org/game/sega-saturn/honkaku-4-nin-uchi-geinoujin-taikyoku-mahjong-the-wareme-de-pon",
    overview:
      "Honkaku 4-nin Uchi Geinoujin Taikyoku Mahjong: The Wareme DE Pon is Video System's Saturn mahjong game tied to the Japanese TV program The Wareme de Pon. Games Database notes the show connection and celebrity/pro-player mahjong framing, making this a licensed four-player mahjong release rather than a generic table-game disc. Collectors should check region, rule familiarity, and whether they want the Saturn or PlayStation version.",
  },
  {
    id: "saturn-honkaku-hanafuda",
    sourceUrl: "https://www.gamesdatabase.org/game/sony-playstation/honkaku-hanafuda",
    overview:
      "Honkaku Hanafuda is Altron's traditional Japanese card-game release for Saturn, also represented on PlayStation. Available database coverage describes versus and story-style play, so the Saturn listing should frame it as a serious hanafuda title rather than a casino compilation. It is most useful to players and collectors who understand koi-koi-style card play, Japanese menus, and late Saturn import packaging.",
  },
  {
    id: "saturn-honkaku-pro-mahjong-tetsuman-special",
    sourceUrl: "https://www.mobygames.com/game/211200/honkaku-mahjong-tetsuman-special/",
    overview:
      "Honkaku Pro Mahjong Tetsuman Special is Naxat Soft's Saturn entry in the Tetsuman mahjong line, with Chatnoir credited on the Saturn work. MobyGames identifies it as a four-player riichi mahjong game endorsed by the Japan Professional Mahjong League and featuring professional-player likenesses. It should be listed as a serious pro-mahjong import where rules knowledge and Japanese-language comfort matter.",
  },
  {
    id: "saturn-honkaku-shogi-shinan-wakamatsu-shogi-juku",
    sourceUrl: "https://www.satakore.com/sega-saturn-store-game,,T-4402G,,Honkaku-Shougi-Shinan-Wakamatsu-Shougi-Juku-JPN.html",
    overview:
      "Honkaku Shogi Shinan Wakamatsu Shogi Juku is a Saturn shogi title published by SIMS and developed with Japan System House and BIOX. Satakore identifies it as a Japanese board/shogi release, so its identity is instruction and serious play around Japanese chess rather than a broad puzzle compilation. Listings should spell out the shogi focus, Japanese region, title variant, and complete manual status.",
  },
  {
    id: "saturn-hop-step-idol",
    sourceUrl: "https://www.mobygames.com/game/223608/hop-step-idol/",
    overview:
      "Hop Step Idol is Media Entertainment's Saturn management simulation about producing a new boys idol group. MobyGames compares its structure to Graduation, with the player guiding the group toward success, making it a character-management import rather than a rhythm game. Its practical value comes from Japanese-language menus, idol-sim rarity, and complete Saturn packaging.",
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
    if (!game) throw new Error(`Missing Saturn game ${rewrite.id}`);
    return {
      platformSlug: "saturn",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Saturn weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus public database, specialist import, and preservation references.",
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
