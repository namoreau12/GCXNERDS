const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-kokoro-mushiking-reviewed-overviews-2026-08-25.csv"
);
const games = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "games", "ds.json"), "utf8"));
const gameById = new Map(games.map((game) => [game.id, game]));

const rows = [
  {
    platformSlug: "ds",
    gameId: "ds-kokoro-ga-uruou-birei-aquarium-ds-2-sekai-no-uo-to-ikura-kujira-tachi",
    title: "Kokoro ga Uruou Birei Aquarium DS 2: Sekai no Uo to Ikura-Kujira Tachi",
    sourceUrl: "https://www.honestgamers.com/56475/ds/kokoro-ga-uruou-birei-aquarium-ds-2-sekai-no-uo-to-ikurakujira-tachi/game.html",
    newOverview:
      "Kokoro ga Uruou Birei Aquarium DS 2: Sekai no Uo to Ikura-Kujira Tachi is a Japan-only DS virtual-life aquarium simulation from LightBee and Ertain. Its identity is calm aquatic observation and collection rather than fast management pressure, with the subtitle pointing toward fish plus dolphin/whale-style sea-life coverage. GCX should describe it as a relaxing aquarium import for collectors of niche DS simulation software, not as a generic systems-heavy sim.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-koma-neko-ds",
    title: "Koma Neko DS",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/141451-koma-neko-ds",
    newOverview:
      "Koma Neko DS is a Japan-only Nintendo DS release based on the stop-motion character Koma, the small brown cat known for sewing, taking photos, and making miniature movies. Developed by Suzak and published by Genterprise, it sits closer to character-based activity software than a conventional simulation game. GCX should position it as a licensed cozy-media import where the appeal is the handmade Koma Neko world, regional packaging, and Suzak/Genterprise catalog context.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kono-quiz-yarou",
    title: "Kono Quiz Yarou!!",
    sourceUrl: "https://www.amazon.com/Kono-Quiz-Yarou-Japan-Nintendo-DS/dp/B000C5GSGI",
    newOverview:
      "Kono Quiz Yarou!! is a Japan-only Namco quiz/trivia game for Nintendo DS, not a generic puzzle title. The draw is fast question-answer play built for Japanese-language literacy and pop-culture knowledge, which makes it much less import-friendly than action or arcade software. GCX should label it as a Namco DS quiz release for collectors tracking Japan-only party/trivia carts, with play value depending heavily on reading ability.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-konzentration-und-aufmerksamkeit-1-4-klasse",
    title: "Konzentration und Aufmerksamkeit 1.-4. Klasse",
    sourceUrl: "https://de.wikipedia.org/wiki/Lernerfolg_Grundschule",
    newOverview:
      "Konzentration und Aufmerksamkeit 1.-4. Klasse belongs to the German Lernerfolg Grundschule-style school software shelf on Nintendo DS, aimed at concentration and attention training for primary-grade children. Its value is in short exercises, practice repetition, and parent/teacher-friendly learning goals rather than game progression. GCX should present it as German-language educational utility software, with collector interest tied to regional DS learning releases and complete German packaging.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kotoba-no-puzzle-mojipittan-ds",
    title: "Kotoba no Puzzle: Mojipittan DS",
    sourceUrl: "https://en.wikipedia.org/wiki/Kotoba_no_Puzzle:_Mojipittan",
    newOverview:
      "Kotoba no Puzzle: Mojipittan DS is Namco Bandai's DS entry in the Japanese word-puzzle series that began in arcades. The core play resembles Scrabble at a glance, but players place hiragana tiles to create Japanese words and chains on boards with specific objectives. GCX should emphasize that it is a language-heavy puzzle game with strong Japanese knowledge requirements, making it notable for word-puzzle fans but not an easy import for non-readers.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kou-rate-ura-mahjong-retsuden-mukoubuchi-goburei-shuuryou-desu-ne",
    title: "Kou Rate Ura Mahjong Retsuden Mukoubuchi: Goburei, Shuuryou desu ne",
    sourceUrl: "https://downloads.khinsider.com/game-soundtracks/album/kou-rate-ura-mahjong-retsuden-mukoubuchi-goburei-shuuryou-desu-ne-ds-gamerip-2007",
    newOverview:
      "Kou Rate Ura Mahjong Retsuden Mukoubuchi: Goburei, Shuuryou desu ne is a Japan-only Nintendo DS mahjong title tied to the Mukoubuchi gambling-mahjong property. The current puzzle label is too vague: this is a table-game/anime-manga license built around high-stakes riichi mahjong atmosphere and character context. GCX should mark it as a language-heavy mahjong import from Pi Arts and TamTam, mainly for collectors comfortable with Japanese mahjong rules and media tie-ins.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kouchuu-kakutou-mushi-1-grand-prix",
    title: "Kouchuu Kakutou: Mushi 1 Grand Prix",
    sourceUrl: "https://www.nin-nin-game.com/es/japanese-import-nintendo-ds-softs-and-systems/192629-kouchuu-kakutou-mushi-1-grand-prix-nds-used-good-condition-es.html",
    newOverview:
      "Kouchuu Kakutou: Mushi 1 Grand Prix is a Japan-only Rocket Company Nintendo DS insect-fighting strategy game from 2005. Import listings consistently frame it around beetle/bug competition rather than racing, so GCX should correct the current vehicle-style description. Present it as a niche creature-battle import where appeal comes from Japanese insect-battling culture, DS-era strategy systems, and region-free collectability.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kouchuu-ouja-mushi-king-greatest-champion-e-no-michi-2",
    title: "Kouchuu Ouja Mushi King: Greatest Champion e no Michi 2",
    sourceUrl: "https://www.ebay.com/p/56267768",
    newOverview:
      "Kouchuu Ouja Mushi King: Greatest Champion e no Michi 2 is the 2006 Nintendo DS sequel in Sega's Mushiking beetle-battle line. Retail database material identifies it as a Japanese simulation release with one- or two-player wireless multi-cartridge play, tying it to the broader arcade/card-driven Mushiking craze. GCX should distinguish it as the follow-up entry for collectors tracking Sega's beetle-battle adaptations.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kouchuu-ouja-mushi-king-greatest-champion-e-no-michi-ds",
    title: "Kouchuu Ouja Mushi King: Greatest Champion e no Michi DS",
    sourceUrl: "https://segaretro.org/Kouchuu_Ouja_Mushiking:_Greatest_Champion_e_no_Michi_DS",
    newOverview:
      "Kouchuu Ouja Mushi King: Greatest Champion e no Michi DS is Sega's 2005 Nintendo DS adaptation of the Mushiking: Greatest Champion e no Michi beetle-battle concept. Sega Retro identifies it as a Japanese simulation release with one- or two-player play and Japanese in-game language. GCX should describe it as a DS entry in Sega's arcade/card-linked insect battle franchise, with collector value tied to Mushiking media, box condition, and Japan-only status.",
  },
  {
    platformSlug: "ds",
    gameId: "ds-kouchuu-ouja-mushi-king-super-collection",
    title: "Kouchuu Ouja: Mushi King Super Collection",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    newOverview:
      "Kouchuu Ouja: Mushi King Super Collection is a Japan-only Sega Nintendo DS collection entry connected to the Mushiking beetle-battle franchise. The current collection label is directionally right but too thin; this should be understood as a preservation-style DS package for fans of Sega's arcade/card insect battles rather than a random compilation. GCX should flag it as part of the Mushiking collector lane, especially for readers comparing the DS adaptations.",
  },
];

function currentOverviewFor(gameId) {
  const game = gameById.get(gameId);
  if (!game) throw new Error(`Missing DS game record for ${gameId}`);
  return game.description || game.gcxOverview || game.overview || "";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const header = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];
const csv = [
  header.join(","),
  ...rows.map((row) =>
    [
      row.platformSlug,
      row.gameId,
      row.title,
      currentOverviewFor(row.gameId),
      row.sourceUrl,
      "Priority DS weak-template replacement with source-backed GCX editorial overview.",
      row.newOverview,
      "approved",
      "GCX Editorial",
    ]
      .map(csvCell)
      .join(",")
  ),
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rowCount: rows.length }, null, 2));
