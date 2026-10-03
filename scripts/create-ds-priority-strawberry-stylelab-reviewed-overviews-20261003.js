const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-strawberry-stylelab-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "ds-strawberry-shortcake-strawberryland-games",
    sourceUrl: "https://www.mobygames.com/game/75706/strawberry-shortcake-strawberryland-games/",
    overview:
      "Strawberry Shortcake: Strawberryland Games is a young-player DS release from The Game Factory and Gorilla Systems, built around Strawberry Shortcake's sports-day style activities. MobyGames notes a strawberry-scented manual, which gives complete copies a small but memorable collector wrinkle alongside the usual cartridge, case, and booklet checks.",
  },
  {
    id: "ds-strawberry-shortcake-the-four-seasons-cake",
    sourceUrl: "https://www.nintendoworldreport.com/pr/14815/strawberry-shortcake-the-four-seasons-cake-ships-for-ds",
    overview:
      "Strawberry Shortcake: The Four Seasons Cake is The Game Factory's 2007 DS follow-up, sending Strawberry and friends through season-themed stages to gather ingredients for a cake competition. It is best presented as a licensed kids' platform-adventure with light collection goals, not as a generic handheld spinoff; complete packaging matters for fans of the character brand.",
  },
  {
    id: "ds-street-football",
    sourceUrl: "https://www.mobygames.com/game/159508/street-football/",
    overview:
      "Street Football is a Koch Media DS sports release based on the Street Football cartoon series. Its identity is closer to character-branded street soccer than league simulation: small-sided matches, animated-series context, and European release history are the details that separate it from FIFA-style annual football games.",
  },
  {
    id: "ds-street-football-ii",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(Q%E2%80%93Z)",
    overview:
      "Street Football II is the DS sequel to Koch Media and Deep Silver's cartoon-linked street soccer line. The appeal is casual team play and series continuation rather than official club rosters, so listings should emphasize the second-entry subtitle, European-market context, language/region expectations, and whether the buyer wants the animated-brand game rather than a licensed football sim.",
  },
  {
    id: "ds-strike-witches-2-iyasu-naosu-punipunisuru",
    sourceUrl: "https://en.wikipedia.org/wiki/Strike_Witches",
    overview:
      "Strike Witches 2: Iyasu Naosu Punipunisuru is a Kadokawa Shoten DS import tied to the Strike Witches anime franchise. It is a fan-service character release for players already following the 501st Joint Fighter Wing cast, with collector interest centered on Japanese text, franchise timing, exact subtitle, and whether extras or first-print materials are complete.",
  },
  {
    id: "ds-strike-witches-soku-no-dengekisen-shin-taichou-funtousuru",
    sourceUrl: "https://www.youtube.com/watch?v=rrCLaMC0dsY",
    overview:
      "Strike Witches: Soku no Dengekisen - Shin Taichou Funtousuru! is Russel's 2009 DS Strike Witches import, using the anime's aerial-witch cast in a handheld strategy and character-game format. The useful catalog signals are franchise dependence, Japanese-language play, subtitle accuracy, and its place before the later Strike Witches 2 DS release.",
  },
  {
    id: "ds-style-lab-fashion-design",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/998535-style-lab-fashion-design/data",
    overview:
      "Style Lab: Fashion Design is Ubisoft's DS fashion-creation entry, part of the Style Lab line aimed at design play for younger players. Rather than running a boutique campaign, it focuses on creating outfits and translating fashion ideas through DS-friendly tools, making it relevant to collectors tracking Ubisoft's tween lifestyle catalog after Imagine and Petz.",
  },
  {
    id: "ds-style-lab-jewelry-design",
    sourceUrl: "https://www.nintendoworldreport.com/news/18633/ubisoft-announces-its-new-style-lab-series",
    overview:
      "Style Lab: Jewelry Design is Ubisoft's 2009 DS craft-and-fashion release built around designing jewelry, with launch coverage highlighting the ability to upload finished designs and purchase real-world versions. That game-to-reality hook is the key detail: it explains why the cartridge matters beyond being another fashion title, even if old online services may no longer be practical.",
  },
  {
    id: "ds-style-lab-makeover",
    sourceUrl: "https://www.esrb.org/ratings/27225/style-lab-makeover/",
    overview:
      "Style Lab: Makeover is Ubisoft's beauty-styling DS release where players create an avatar, apply makeup, style hair, accessorize, and experiment with a salon-like makeover loop. The ESRB description makes its simulation focus clear, so buyers should treat it as a DSi-era lifestyle tool rather than a story-heavy fashion adventure.",
  },
  {
    id: "ds-successfully-learning-concentration",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(Q%E2%80%93Z)",
    overview:
      "Successfully Learning: Concentration is part of the DS educational-software wave, aimed at short practice sessions for attention and concentration skills rather than entertainment-first progression. Its listing value comes from language, regional publisher, age range, and classroom-style utility, especially for collectors separating learning cartridges from puzzle games with similar box language.",
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
        "Priority DS weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus MobyGames, Nintendo World Report, ESRB, GameFAQs, Ubisoft, and franchise references.",
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
