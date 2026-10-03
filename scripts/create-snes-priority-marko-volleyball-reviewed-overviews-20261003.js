const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "snes.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "snes-priority-marko-volleyball-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "snes-marko-s-magic-football",
    sourceUrl: "https://openretro.org/snes/markos-magic-football",
    overview:
      "Marko's Magic Football is Domark's soccer-flavored side-scrolling platformer for the Super Nintendo, published by Acclaim in 1995. Marko attacks and solves hazards with a returning magic football while moving through cartoon stages about stopping a pollution-spreading scientist. It sits closer to Soccer Kid-style mascot platformers than to sports sims, with PAL-region packaging and the Marko title variant doing the collector sorting.",
  },
  {
    id: "snes-might-and-magic-ii",
    sourceUrl: "https://snescentral.com/article.php?id=0132",
    overview:
      "Might and Magic II brings the Gates to Another World dungeon-crawling RPG lineage to Super Nintendo through a European Elite release developed by Iguana Entertainment. The SNES story is messy in a useful way for collectors: Japan and PAL regions received different versions, and the planned North American release never arrived. Listings should separate the PAL cart from the Japanese Might and Magic: Book Two release and note the battery-save RPG format.",
  },
  {
    id: "snes-monstania",
    sourceUrl: "https://superfamicom.org/info/monstania",
    overview:
      "Monstania is a Japan-only Super Famicom tactical RPG from Pack-In-Video, Amccus, and Bits Laboratory, released on September 27, 1996. Its late-era appeal comes from compact, grid-based battles and adventure scenes rather than a broad Western SNES release. For Games Exchange, the useful signals are Super Famicom region, Japanese text, battery-backed cartridge context, and the Pack-In-Video/Amccus credit split.",
  },
  {
    id: "snes-monster-maker-iii-hikari-no-majutsushi",
    sourceUrl: "https://gamegear.net/archive/games/snes/monster-maker-iii-hikari-no-majutsushi-japan",
    overview:
      "Monster Maker III: Hikari no Majutsushi is SOFEL's 1993 Super Famicom RPG based on the Monster Maker card-game world. It is the mainline RPG entry on the system, distinct from the later Monster Maker Kids board-game spinoff. Collectors should treat it as a Japanese import with language-heavy progression, SOFEL packaging, and series appeal tied to Monster Maker's tabletop and card-game roots.",
  },
  {
    id: "snes-monster-maker-kids-ousama-ni-naritai",
    sourceUrl: "https://chihirory.com/superfamicom-analysis/en/gam0003733/",
    overview:
      "Monster Maker Kids: Ousama ni Naritai is SOFEL's 1994 Super Famicom board-game spinoff of the Monster Maker series. Instead of following the RPG structure of Monster Maker III, it turns the brand into a lighter competitive board format aimed at character charm and family-style play. The important catalog distinction is the Kids subtitle, Japanese-only release context, and board-game identity.",
  },
  {
    id: "snes-motteke-oh-dorobou",
    sourceUrl: "https://dataeast.fandom.com/wiki/Motteke_Oh%21_Dorobou",
    overview:
      "Motteke Oh! Dorobou is Data East's 1995 Super Famicom comedy board game about rival thieves. Players move around a Sugoroku-style board, steal valuables, dodge police, and hit minigames that decide robberies, escapes, and setbacks. It belongs beside Japan-only party-board curios rather than action games, so language, complete SFC packaging, and Data East branding matter most.",
  },
  {
    id: "snes-mujintou-monogatari",
    sourceUrl: "https://superfamicom.org/info/mujintou-monogatari",
    overview:
      "Mujintou Monogatari is a 1996 Japan-only Super Famicom survival simulation from KSS, Nihon Soft System, Media Muse, and Open Sesame. The title is commonly framed around deserted-island survival, making it an unusual late SFC simulation rather than a conventional RPG or adventure. Its trading value depends on Japanese text tolerance, region compatibility, save condition, and whether the listing includes manual and box materials.",
  },
  {
    id: "snes-multi-play-volleyball",
    sourceUrl: "https://gamefaqs.gamespot.com/snes/571158-multi-play-volleyball/videos/17261",
    overview:
      "Multi Play Volleyball is Pack-In-Video and Mebio Software's 1994 Super Famicom volleyball release. It is a straightforward court-sports cartridge built around volleyball matches rather than the wider season modes found in bigger licensed sports lines. Collectors mainly need the Japanese SFC identity, Pack-In-Video label, 1994 timing, and whether the cart is loose or complete with manual and box.",
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
    if (!game) throw new Error(`Missing SNES game ${rewrite.id}`);
    return {
      platformSlug: "snes",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority SNES weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus public database, fan archive, and specialist reference checks.",
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
