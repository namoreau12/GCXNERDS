const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "psp.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "psp-priority-prospi-puyo-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "psp-pro-yakyuu-spirits-2013",
    sourceUrl: "https://www.gamer.ne.jp/news/201303190066/",
    overview:
      "Pro Yakyuu Spirits 2013 is Konami's Japan-only professional baseball simulation for PSP, PS3, and PS Vita, built around real Nippon Professional Baseball teams and seasonal roster context. Contemporary coverage highlighted player data and mode videos from the official site, so this PSP entry belongs with serious sports imports rather than arcade baseball. Listings should call out Japanese language, UMD condition, and whether buyers want this exact 2013 roster year.",
  },
  {
    id: "psp-pro-yakyuu-spirits-2014",
    sourceUrl: "https://store.kadokawa.co.jp/shop/g/g9784047296459/",
    overview:
      "Pro Yakyuu Spirits 2014 is Konami's later PSP entry in the Professional Baseball Spirits line, released alongside PS3 and PS Vita versions for the 2014 NPB season. Kadokawa's official guide coverage points to modes such as Spirits, pennant race, star player, management, and grand prix, which makes the PSP version a deep handheld baseball sim for import players. Region, language, roster year, and manual completeness are the key collector details.",
  },
  {
    id: "psp-project-cerberus",
    sourceUrl: "https://www.mobygames.com/game/225047/project-cerberus/",
    overview:
      "Project Cerberus is a Japan-only PSP 2D fighting game tied to the Lost Child visual novel universe, with anime-style characters and a dark sci-fi horror setup. MobyGames identifies it as a side-view fighter from MileStone, HOBIBOX, and Kaga Create, with 14 characters and combo-focused play. It is best framed as an obscure import anime fighter, where language, region, and physical completeness matter more than broad PSP action appeal.",
  },
  {
    id: "psp-prostroke-golf-world-tour-2007",
    sourceUrl: "https://www.gamespot.com/articles/qanda-prostroke-golf-producer-struan-robertson/1100-6155068/",
    overview:
      "ProStroke Golf: World Tour 2007 is Gusto Games and Oxygen's PSP golf sim built around its namesake ProStroke swing system. GameSpot's producer interview described the design as emphasizing the art of the perfect swing and noted ad hoc four-player support on PSP, so its identity is technical golf control rather than licensed PGA spectacle. Listings should mention the PSP version, region, and whether players want a more exacting portable golf game.",
  },
  {
    id: "psp-pump-it-up-zero-portable",
    sourceUrl: "https://xx.piugame.com/piu.prime2/pumpitup/history.php",
    overview:
      "Pump It Up Zero Portable brings Andamiro's Korean arcade dance series to PSP, translating foot-panel rhythm play into handheld button timing. The official Pump It Up history lists The Zero Portable as part of the series' PSP branch, making it a niche rhythm import for fans who want Zero-era songs and chart style away from the arcade cabinet. Region, song list expectations, and control differences should be clear in listings.",
  },
  {
    id: "psp-pump-it-up-exceed-portable",
    sourceUrl: "https://xx.piugame.com/piu.prime2/pumpitup/history.php",
    overview:
      "Pump It Up: EXCEED Portable is a PSP version of Andamiro's Pump It Up rhythm franchise, adapting arcade dance-step timing to a handheld format. The official series history places EXCEED Portable alongside The Zero Portable in the PSP line, so the appeal is portable song practice and fan collecting rather than full dance-pad play. Buyers need the exact Exceed title, Korean-region context, and UMD condition spelled out.",
  },
  {
    id: "psp-puyo-puyo-7",
    sourceUrl: "https://puyo.sega.jp/portal/series/puyopuyo7.html",
    overview:
      "Puyo Puyo 7 is Sega's PSP version of the 18th-anniversary numbered puzzle entry, released on PSP and Wii after the Nintendo DS version. Sega's portal highlights new protagonist Ringo Ando, the transformation-based Daihenshin rule, classic Puyo Puyo and Puyo Puyo 2 rules, Fever rules, Nazo Puyo, 19 characters, and a school mode for learning chains. It is a full-featured Japanese Puyo release where language and multiplayer expectations matter.",
  },
  {
    id: "psp-puyo-puyo-fever",
    sourceUrl: "https://puyo.sega.jp/portal/series/PuyopuyoFever.html",
    overview:
      "Puyo Puyo Fever is Sonic Team and Sega's PSP release of the series reboot that introduced Amitie, Raffina, Primp Magic School, and the Fever gauge system. Sega's portal explains that Fever mode lets players enter prepared chain patterns after offsetting attacks, while also adding new three- and four-piece drops to the traditional matching formula. The PSP version is important as an early portable Fever entry with Japanese packaging and regional naming to verify.",
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
    if (!game) throw new Error(`Missing PSP game ${rewrite.id}`);
    return {
      platformSlug: "psp",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority PSP weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus publisher, official series, database, and contemporary specialist references.",
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
