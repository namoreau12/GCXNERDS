const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(rootDir, "data", "games", "reviewed-overview-imports", "ps2-priority-k1-kamaitachi-reviewed-overviews-2026-08-24.csv");

const reviewedOverviews = {
  "ps2-k-1-premium-2005-dynamite":
    "K-1 Premium 2005 Dynamite is a PlayStation 2 combat-sports release tied to K-1's New Year's Eve fight-event branding. It belongs with collectors tracking Japanese kickboxing and mixed martial arts games, where roster context, event presentation, and regional packaging matter more than broad arcade appeal.",
  "ps2-k-1-world-gp-2005":
    "K-1 World GP 2005 focuses on stand-up kickboxing competition, giving PS2 players a licensed take on K-1's heavyweight tournament scene. The appeal is in timing strikes, reading distance, and following the annual fight-card identity rather than a generic sports-game season mode.",
  "ps2-k-1-world-gp-2006":
    "K-1 World GP 2006 continues the PS2 line of licensed K-1 kickboxing games with updated tournament context and fighter presentation. It is best viewed as a combat-sports entry for fans of the promotion, with collector value tied to its yearly update and Japanese release history.",
  "ps2-k-1-world-grand-prix":
    "K-1 World Grand Prix is a Konami-published PS2 kickboxing game built around the promotion's tournament format. Players should expect one-on-one striking, fighter matchups, and licensed event flavor, making it a much cleaner fit for combat-sports collections than racing or general action shelves.",
  "ps2-k-1-world-grand-prix-2001":
    "K-1 World Grand Prix 2001 represents Konami's early PS2 handling of the K-1 license, focused on kickboxing matches and tournament presentation. Its collector relevance comes from being part of a yearly Japanese combat-sports line and from the transition of licensed fighting games into the PS2 era.",
  "ps2-k-1-world-grand-prix-2003":
    "K-1 World Grand Prix 2003 is a licensed kickboxing game centered on K-1's heavyweight tournament identity. The PS2 release is about striking rhythm, fighter selection, and event atmosphere, with strongest appeal for collectors who follow Japanese combat sports and Konami's sports catalog.",
  "ps2-k-1-world-grand-prix-the-beast-attack":
    "K-1 World Grand Prix: The Beast Attack! is another Konami PS2 entry built around K-1 kickboxing rather than vehicle racing. It is useful to collectors as a specific annual or sub-series release, especially when comparing roster, packaging, and presentation differences across the K-1 PS2 library.",
  "ps2-k-1-world-max-2005":
    "K-1 World Max 2005 shifts attention from heavyweight spectacle toward K-1's lighter-weight World MAX identity. On PS2 it still plays as a licensed combat-sports game, with interest coming from fighter matchups, tournament structure, and its place in Konami's run of K-1 releases.",
  "ps2-k-o-king":
    "K.O. King is a budget-era PS2 boxing release from Phoenix Games, built around straightforward ring action rather than a major licensed league. Its value is mostly catalog and curiosity driven: collectors may care about the publisher, regional availability, and how it sits among lower-profile PAL sports titles.",
  "ps2-ka-2-let-s-go-hawaii":
    "Ka 2: Let's Go Hawaii is the sequel to Mister Mosquito, again built around playing as a mosquito navigating human spaces and looking for chances to bite without being swatted. The PS2 release stands out for its odd stealth-comedy premise and Sony-published Japanese identity.",
  "ps2-kaerazu-no-mori":
    "Kaerazu no Mori is a Japan-only PS2 adventure release from Global A with appeal rooted in title discovery, regional collecting, and its place in the console's deep Japanese catalog. The experience is better framed as a niche adventure entry than as a broad action or marketplace headline game.",
  "ps2-kaeru-batake-de-tsukamaete":
    "Kaeru Batake de Tsukamaete is a Takuyo visual novel on PlayStation 2, aimed at players who want character routes, dialogue choices, and romance-adventure structure. Its collector interest comes from Takuyo's otome catalog, Japanese packaging, and later-platform series connections.",
  "ps2-kaeru-batake-de-tsukamaete-natsu-chigira-sansen":
    "Kaeru Batake de Tsukamaete: Natsu Chigira Sansen is a follow-up or companion release for Takuyo's otome visual-novel series. It is most useful to collectors as a related PS2 entry with character-driven scenarios, fan-oriented story material, and direct ties to the original Kaeru Batake release.",
  "ps2-kaido-racer":
    "Kaido Racer is Genki's mountain-road racing game, known outside Japan as part of the Tokyo Xtreme Racer: Drift lineage. It focuses on tuning, rival battles, and technical driving on winding roads, making it a strong PS2 pick for collectors of Japanese street-racing games.",
  "ps2-kaiketsu-zorori-mezase-itazura-king":
    "Kaiketsu Zorori: Mezase! Itazura King is a PS2 adventure based on the long-running children's book and anime character. Bandai's release is mainly for fans of the license and Japanese character-game collectors, with light adventure play wrapped around Zorori's mischievous comedy style.",
  "ps2-kaiketsu-osabakiina":
    "Kaiketsu! Osabakiina is a KID-published Japanese PS2 adventure game with a courtroom or problem-solving premise suggested by its title. GCX should treat it as a niche import entry: useful for identifying the release, publisher, and platform, while deeper story specifics need stronger specialist sourcing.",
  "ps2-kaitou-apricot-kanzenban":
    "Kaitou Apricot Kanzenban is a Takuyo visual novel centered on phantom-thief romance and character routes, not a sports game. The PS2 version is a collector-facing edition for fans of Japanese adventure and otome-style releases, with value tied to completeness, region, and Takuyo catalog interest.",
  "ps2-kakinoki-shogi-iv":
    "Kakinoki Shogi IV is a PS2 shogi release for players who want a digital board-game opponent and study tool rather than a flashy action game. Its appeal is practical and collectible: Japanese chess rules, ASCII Entertainment publishing, and a place in the console's tabletop-game library.",
  "ps2-kakutou-bijin-wulong":
    "Kakutou Bijin Wulong is a fighting-game adaptation connected to the martial-arts manga and anime property. DreamFactory's involvement makes it notable for PS2 fighting-game collectors, while the Namco Bandai release gives licensed-action fans a specific Japanese character-combat title to track.",
  "ps2-kamaitachi-no-yoru-2":
    "Kamaitachi no Yoru 2 is a ChunSoft sound novel built around suspense, branching text, and mystery storytelling rather than conventional exploration. The PS2 release is important for visual-novel and Japanese adventure collectors because it continues one of the genre's defining thriller series.",
};

const headers = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = Object.entries(reviewedOverviews).map(([gameId, newOverview]) => {
    const game = byId.get(gameId);
    if (!game) throw new Error(`Missing PS2 game ${gameId}`);
    return {
      platformSlug: "ps2",
      gameId,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: game.articleUrl || game.descriptionSourceUrl || "",
      rewriteNotes: "Priority PS2 weak-template cleanup; original GCX editorial overview based on available platform, publisher, developer, title, franchise, and source-page context.",
      newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX editorial cleanup",
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
