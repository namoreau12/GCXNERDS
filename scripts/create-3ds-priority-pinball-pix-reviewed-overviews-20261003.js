const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "3ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-pinball-pix-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "3ds-pinball-breakout-3",
    sourceUrl: "https://www.mobygames.com/game/130076/pinball-breakout-iii/",
    overview:
      "Pinball Breakout 3 is a late 3DS eShop nuGAME release that blends Breakout-style brick clearing with flipper-style ball control. Its value is as part of the tiny post-retail eShop arcade shelf: collectors should treat exact title numbering, digital-only availability, and the Pinball Breakout/Pinball Breaker naming tangle as the important identifiers.",
  },
  {
    id: "3ds-pinball-breakout-4",
    sourceUrl: "https://gamefaqs.gamespot.com/3ds/274392-pinball-breakout-4/data",
    overview:
      "Pinball Breakout 4 continues nuGAME's hybrid Breakout-and-pinball 3DS eShop line, with GameFAQs listing it as a 2019 download release and describing 15 score-chasing levels. It is not a traditional table-simulation pinball game; the collector context is late eShop availability, sequel numbering, and arcade high-score play on a platform whose digital storefront has closed.",
  },
  {
    id: "3ds-ping-pong-trick-shot",
    sourceUrl: "https://www.nintendo.com/es-es/Juegos/Programas-descargables-Nintendo-3DS/Ping-Pong-Trick-Shot-1148256.html",
    overview:
      "Ping Pong Trick Shot is a Starsign-published 3DS download game about solving table-tennis shot setups rather than playing full matches. The hook is precision puzzle play: aim, bounce, and land the ball through staged trick-shot challenges. It fits the 3DS eShop's small utility-arcade catalog, where exact publisher, region, and download-only status matter more than sports-license context.",
  },
  {
    id: "3ds-ping-pong-trick-shot-2",
    sourceUrl: "https://www.nintendolife.com/games/3ds-eshop/ping_pong_trick_shot_2",
    overview:
      "Ping Pong Trick Shot 2 is Starsign's follow-up to the 3DS eShop trick-shot puzzle idea, keeping the focus on staged ball-placement challenges rather than conventional table-tennis rallies. It should be cataloged as a sequel in a tiny download-only line, useful for players who like short physics challenges and for collectors separating Starsign's first and second entries.",
  },
  {
    id: "3ds-pink-dot-blue-dot",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_3DS_games_(N%E2%80%93Z)",
    overview:
      "Pink Dot Blue Dot is an RCMADIAX 3DS eShop release from the system's ultra-small digital indie wave. Public metadata is thin, so the honest collector framing is its minimal arcade/puzzle identity, color-matching title premise, and download-only scarcity after the eShop closure. Listings should avoid inventing depth and instead preserve publisher, platform, and exact title spelling.",
  },
  {
    id: "3ds-pippi-longstocking-3d",
    sourceUrl: "https://www.mynewsdesk.com/se/panvision/pressreleases/pippi-laangstrump-i-3d-808463",
    overview:
      "Pippi Longstocking 3D is Pan Vision and Ravn Studio's Nordic 3DS adventure built around Astrid Lindgren's famous character. Pan Vision's announcement describes Pippi exploring with Tommy and Annika, searching for items before sailing again, using new tools, and sharing treasure maps through StreetPass, making this a regional children's-license release where language and packaging are central.",
  },
  {
    id: "3ds-pirate-pop-plus",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/New-Nintendo-3DS-Download-Software/Pirate-Pop-Plus-1147475.html",
    overview:
      "Pirate Pop Plus is Dadako and 13AM's New Nintendo 3DS arcade release, styled like a Game Boy-era score chaser while playing in the Pang/Buster Bros. tradition of popping bouncing bubbles. The 3DS version is notable for New 3DS compatibility, compact arcade loops, and cross-platform indie appeal alongside Wii U and PC versions.",
  },
  {
    id: "3ds-pix-3d",
    sourceUrl: "https://www.nintendolife.com/reviews/eshop/pix3d_eshop",
    overview:
      "PIX3D is Gamelion's 3DS eShop puzzle game built around arranging pixel-art blocks with the stereoscopic 3D effect helping players read the shape. Reviews emphasized its simple concept, tidy presentation, and the way depth perception supports the puzzle loop, so it belongs with early eShop experiments that use the hardware gimmick for clarity rather than spectacle.",
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
    if (!game) throw new Error(`Missing 3DS game ${rewrite.id}`);
    return {
      platformSlug: "3ds",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority 3DS weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus public database, platform holder, publisher, and specialist review references.",
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
