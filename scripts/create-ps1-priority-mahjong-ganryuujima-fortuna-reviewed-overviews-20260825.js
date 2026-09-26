const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-mahjong-ganryuujima-fortuna-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-mahjong-ganryuujima",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00043.html",
    overview:
      "Mahjong Ganryuujima frames riichi mahjong around two themed paths instead of only presenting a bare table. One route places the player in a shogun-era setting where opponents must be defeated before reaching the shogun, while the modern route lets the player choose from several rival groups with character biographies. The appeal is in working through personality-driven opponents while playing traditional four-player mahjong hands.",
  },
  {
    id: "ps1-mahjong-gokuu-tenjiku",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00014.html",
    overview:
      "Mahjong Gokuu Tenjiku is an early PlayStation riichi mahjong release from Chat Noir built around Japanese menus, spoken atmosphere, and a full table of computer opponents. It does not try to turn mahjong into an arcade action game; the focus is tile reading, discards, hand building, and round-by-round pressure. Its place in the library comes from being a launch-era import entry for players interested in traditional mahjong software on PS1.",
  },
  {
    id: "ps1-mahjong-gokuu-tenjiku-99",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-02098.html",
    overview:
      "Mahjong Gokuu Tenjiku '99 revisits Chat Noir's Journey to the West-themed mahjong format with an updated late-PlayStation presentation. Players can take the role of one of the four main characters and advance through a journey by defeating opponents in mahjong matches. It is still fundamentally table mahjong, but the literary theme, character route structure, and tournament-style progression give the matches a clearer campaign wrapper.",
  },
  {
    id: "ps1-mahjong-ii",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPM-86258.html",
    overview:
      "Mahjong II in Success's SuperLite 1500 line is a compact rules-focused mahjong package. It includes free play, tournament play, selectable rules, record keeping, and three camera perspectives for viewing the table. The value is not spectacle; it is a low-friction way to sit down with a configurable PlayStation mahjong table, tune local-rule options such as red tiles, and track results over repeated sessions.",
  },
  {
    id: "ps1-mahjong-senjutsu-andou-mitsuru-pro-no-akuukan-satsuhou",
    sourceUrl: "https://vgcollect.com/item/190931",
    overview:
      "Mahjong Senjutsu: Andou Mitsuru Pro no Akuukan Satsuhou is built around the name and tactical identity of professional mahjong player Mitsuru Andou. Compared with character-adventure mahjong releases, this one reads more like a technique-minded table game: the draw is studying choices, managing discards, and playing through a specialist-branded mahjong package. For collectors, it is also a distinct 1996 Japanese PlayStation release with its own SLPS catalog identity.",
  },
  {
    id: "ps1-mahjong-station-mazin",
    sourceUrl: "https://www.mobygames.com/game/58295/mahjong-station-mazin/",
    overview:
      "Mahjong Station Mazin gives PS1 mahjong a louder fantasy shell, gathering historical and fictional-style challengers into a tournament watched over by the gods. Matches use the four-player tile rules, but the presentation leans into early 3D, animated reactions, and a campaign where rivals are cleared on the way to a final opponent. It stands out from quieter budget mahjong discs because every hand is wrapped in theatrical character energy.",
  },
  {
    id: "ps1-mahjong-taikai-ii-special",
    sourceUrl: "https://www.psxdatacenter.com/games/J/M/SLPM-86338.html",
    overview:
      "Mahjong Taikai II Special brings Koei's tournament-minded mahjong series to PlayStation with a first-person table view, cartoon character art, and a single-player focus. The structure is more formal than a simple free-play disc, leaning on competition flow and personality-driven computer opponents. Players who want a straight Japanese mahjong table with a stronger tournament identity will understand this entry faster than its plain metadata suggests.",
  },
  {
    id: "ps1-mahjong-uranai-fortuna-tsuki-no-megami-tachi",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-03123.html",
    overview:
      "Mahjong Uranai Fortuna: Tsuki no Megami-tachi mixes mahjong with a fortune-telling theme. The game features six female opponents and two main ways to play: standard free mahjong and a fortune-themed mahjong mode. That gives it a different flavor from the many tournament-only PS1 mahjong releases, because the table play is paired with character presentation and divination-style framing rather than pure ranking progression.",
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
