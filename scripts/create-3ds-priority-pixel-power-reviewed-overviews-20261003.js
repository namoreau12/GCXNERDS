const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "3ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-pixel-power-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "3ds-pixel-hunter",
    sourceUrl: "https://www.nintendo.com/es-es/Juegos/Programas-descargables-New-Nintendo-3DS/Pixel-Hunter-1222589.html",
    overview:
      "Pixel Hunter is Lemondo Games' voxel-styled side-scrolling shooter-platformer for New Nintendo 3DS. Nintendo's European listing describes a 3D Pixel Hunter built in an 8-bit voxel style, which is the key distinction from the many generic 3DS platform downloads around it. Because it was a New Nintendo 3DS eShop release, the practical collector notes are system compatibility, digital-only availability, and post-eShop-purchase limits.",
  },
  {
    id: "3ds-plain-video-poker",
    sourceUrl: "https://www.mobygames.com/game/100266/plain-video-poker/",
    overview:
      "Plain Video Poker is PouncingKitten Games' 2014 Nintendo 3DS eShop card-game release. Its official pitch was exactly what the title suggests: a no-frills video poker package with a dozen variations, aimed at casino-style draw-poker play rather than adventure or RPG progression. The useful catalog distinction is its North American digital-only context, low-price eShop positioning, Teen ESRB rating, and single-player card-table focus.",
  },
  {
    id: "3ds-planet-crashers",
    sourceUrl: "https://gamefaqs.gamespot.com/3ds/632844-planet-crashers/data",
    overview:
      "Planet Crashers is Renegade Kid's 2012 Nintendo 3DS eShop RPG for UTV Ignition Games. Release data places the North American and European eShop versions on July 26, 2012, while planned boxed versions were cancelled. It is a cute sci-fi dungeon adventure from the Mutant Mudds developer, so listings should separate the downloadable 3DS release from the browser/mobile versions and the unreleased retail package.",
  },
  {
    id: "3ds-plantera",
    sourceUrl: "https://www.ratalaikagames.com/games.php?id=plantera",
    overview:
      "Plantera is Ratalaika's 2017 Nintendo 3DS port of VaragtP's garden simulation and strategy game. The official Ratalaika page describes growing plants, raising animals, earning coins, buying upgrades, expanding the garden, and defending it from pests such as magpies, rabbits, foxes, and wolves. It belongs with 3DS eShop idle-management curios, with touchscreen play, digital availability, and regional publisher credits doing the catalog work.",
  },
  {
    id: "3ds-pocket-card-jockey",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Pocket-Card-Jockey-1101822.html",
    overview:
      "Pocket Card Jockey is Game Freak's Nintendo 3DS eShop mash-up of solitaire and horse racing. Nintendo describes clearing cards to energize a horse, positioning during races, retiring horses, breeding new ones, and using shop items and puzzle bonuses to improve stats. Its collector identity is the offbeat Game Freak side project, digital-only 3DS release, and later remake context rather than any link to Pokemon.",
  },
  {
    id: "3ds-polara",
    sourceUrl: "https://www.nintendolife.com/reviews/3ds-eshop/polara",
    overview:
      "Polara is a 3DS eShop runner published by Circle Entertainment, with Nintendo Life framing it in the Canabalt and Temple Run lineage. Its hook is color-switching action: players survive hazards by matching or changing colors at speed instead of simply jumping through a standard platform stage. Marketplace notes should focus on its downloadable eShop status, Circle/Flyhigh regional publishing trail, and arcade-runner identity.",
  },
  {
    id: "3ds-pom-pom-purin-korokoro-daibouken",
    sourceUrl: "https://www.yesasia.com/global/pompompurin-korokoro-daibouken-3ds-japan-version/1048691953-0-0-0-en/info.html",
    overview:
      "Pom Pom Purin: Korokoro Daibouken is Rocket Company's 2016 Japanese Nintendo 3DS action game built around Sanrio's Pompompurin character. Retail listings describe a simple pull-and-release action format, one-player play, Japanese language, and an April 7, 2016 release. It is a physical Japan-version character game, so the important details are Sanrio branding, region, language, and complete box/manual condition.",
  },
  {
    id: "3ds-pong-pong-candy",
    sourceUrl: "https://www.nintendolife.com/games/3ds-eshop/pong_pong_candy",
    overview:
      "Pong Pong Candy is Lionant's 2015 Nintendo 3DS eShop matching puzzle game. Nintendo Life's profile describes a one-player puzzle/strategy release where each move can level up pieces, the board becomes constrained by remaining pieces, and wheel-of-fortune power-ups help reach higher transformations. It is a small North American eShop download, so price-era digital availability and simple puzzle identity matter most.",
  },
  {
    id: "3ds-poptropica-forgotten-islands",
    sourceUrl: "https://www.mobygames.com/game/230928/poptropica-forgotten-islands/releases/",
    overview:
      "Poptropica: Forgotten Islands is Ubisoft's 2014 Nintendo 3DS adventure based on the children's online world. Ubisoft positioned it as a new adventure for 3DS, and MobyGames release data ties the 3DS version to Ubisoft's 2014 release alongside mobile versions. The listing value comes from the Poptropica license, physical 3DS format, kid-adventure audience, and distinction from Poptropica Adventures on Nintendo DS.",
  },
  {
    id: "3ds-power-disc-slam",
    sourceUrl: "https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Power-Disc-Slam-1126708.html",
    overview:
      "Power Disc Slam is Chequered Cow Games' 2016 Nintendo 3DS eShop arcade sports game built around competitive disc throwing. Nintendo's page calls it an intense arcade sports game, while reviews compared its court duels to Windjammers-style play. It is a 3DS download rather than a physical sports title, so eShop availability, local or online feature expectations, and Chequered Cow's first-3DS-project context are the useful notes.",
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
        "Priority 3DS weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus platform-holder, publisher, retail, and public database references.",
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
