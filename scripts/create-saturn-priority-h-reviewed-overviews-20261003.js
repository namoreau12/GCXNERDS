const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "saturn.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "saturn-priority-h-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = {
  "saturn-highway-2000":
    "Highway 2000 is Genki's Sega Saturn highway racer, released in Japan as Wangan Dead Heat before Western versions renamed it. The appeal is fast road racing, distinct car handling, and the early shape of Genki's Tokyo expressway fascination, making it a useful bridge between Saturn arcade racing fans and later Tokyo Xtreme Racer curiosity.",
  "saturn-hissatsu-pachinko-collection":
    "Hissatsu Pachinko Collection is a Sunsoft-published Saturn pachinko release developed by Success, built for players who wanted parlor-style machine play at home. Its collector interest comes from the specific Japanese gambling-sim niche: machine presentation, rule familiarity, and region details matter more than action-game spectacle.",
  "saturn-hokago-renai-club-koi-no-etude":
    "Hokago Renai Club: Koi no Etude is a KID-published dating simulation and romance adventure from Libido. It is a text-heavy Saturn import about school-life relationships, character scenes, and route progression, so buyers should expect Japanese-language dependence and value it as part of the system's deep visual-novel library.",
  "saturn-hokuto-no-ken":
    "Hokuto no Ken is Banpresto's 1995 Saturn adaptation of Fist of the North Star, framed more as a graphic adventure than a straight arcade brawler. Its draw is franchise-specific story presentation, Ken and the post-apocalyptic world, and Japanese import appeal for collectors following Hokuto no Ken games across generations.",
  "saturn-houma-hunter-lime-perfect-collection":
    "Houma Hunter Lime Perfect Collection brings the Jewel BEM Hunter Lime material to Saturn as a collected character-adventure release from Asmik and Silence. The value is in its anime-style presentation, multi-disc collector identity, and fan interest in a niche 1990s Japanese series rather than broad action-game recognition.",
  "saturn-idol-janshi-suchie-pai-ii":
    "Idol Janshi Suchie-Pai II is Jaleco's Saturn mahjong sequel built around Suchie-Pai, character opponents, and story progression through match play. It matters as part of Saturn's large Japanese mahjong and idol-game scene, with appeal tied to series fandom, import collecting, and comfort with mahjong rules.",
};

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
  const rows = Object.entries(reviewedOverviews).map(([gameId, newOverview]) => {
    const game = byId.get(gameId);
    if (!game) throw new Error(`Missing Saturn game ${gameId}`);
    return {
      platformSlug: "saturn",
      gameId,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: game.articleUrl || game.descriptionSourceUrl || "",
      rewriteNotes:
        "Priority Saturn weak-template cleanup; original Games Exchange editorial overview based on available title, publisher, developer, franchise, genre, platform, and source-page context.",
      newOverview,
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
