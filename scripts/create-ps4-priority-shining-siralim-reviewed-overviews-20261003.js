const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-shining-siralim-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "ps4-shining-resonance-refrain",
    sourceUrl: "https://www.sega.jp/game/detail/shining-world-resonance/",
    overview:
      "Shining Resonance Refrain is Sega's PS4 remaster of the 2014 PlayStation 3 RPG Shining Resonance. Sega's product page describes the PS4 version as adding more than 150 pieces of DLC into the base game, improved presentation, and a new Refrain mode with story material not in the original release. Collectors should distinguish the PS4 remaster from the original PS3 release, including region, launch versus new-price packaging, and any limited-edition contents.",
  },
  {
    id: "ps4-shiny-ski-resort",
    sourceUrl: "https://strategywiki.org/wiki/Shiny_Ski_Resort",
    overview:
      "Shiny Ski Resort is Kairosoft's pixel-art management sim about building a small mountain hotel into a ski destination. Strategy references identify it across mobile, console, and PC platforms, and the core loop is room/facility planning, slope development, guests, and long-tail optimization rather than action sports. On PS4, it matters most as a Kairosoft sim entry where digital availability, region, and save compatibility can affect what a buyer is actually getting.",
  },
  {
    id: "ps4-shoppe-keep",
    sourceUrl: "https://shop.excalibur-games.com/products/shoppe-keep",
    overview:
      "Shoppe Keep is Excalibur's fantasy shop-management game from developer Arvydas Zemaitis, where players stock goods, set prices, handle customers, and keep a store running across changing seasons. It blends management sim routines with action-RPG flavor rather than playing like a generic strategy release. Collectors should separate the first Shoppe Keep from its sequel and check digital versus physical availability, region, and platform entitlement details.",
  },
  {
    id: "ps4-shu",
    sourceUrl: "https://store.playstation.com/en-us/product/UP2680-CUSA05562_00-COATSINKSHUPS400",
    overview:
      "Shu is Coatsink's PS4 platformer built around hand-crafted stages, rescue companions, and movement-focused obstacle routes. The PlayStation Store listing identifies Coatsink as publisher, and contemporary reviews frame it as a colorful side-scrolling platform adventure rather than a mascot-license game. For buyers, the important details are the PS4 digital release, region/account requirements, and whether a copy is a code, account entitlement, or later bundle.",
  },
  {
    id: "ps4-siegecraft-commander",
    sourceUrl: "https://www.blowfishstudios.com/siegecraft-commander",
    overview:
      "Siegecraft Commander is Blowfish Studios' fortress-building strategy game for PS4 and other platforms. Blowfish describes it as offering a real-time strategy single-player campaign plus both turn-based and real-time multiplayer options, with players flinging towers outward to create networks of structures while attacking an enemy keep. The PS4 entry is useful to catalog by strategy format, region, and whether online multiplayer expectations are relevant for a given copy.",
  },
  {
    id: "ps4-simulacra",
    sourceUrl: "https://www.walesinteractive.com/simulacra",
    overview:
      "Simulacra is Wales Interactive and Kaigan Games' PS4 port of the phone-interface FMV horror game about investigating the lost phone of a missing woman named Anna. The publisher describes texts, emails, photos, video logs, live-actor footage, decryption puzzles, and multiple endings as core features. It belongs with narrative FMV thrillers in the PS4 library, with digital region and account details carrying more weight than conventional boxed-release condition notes.",
  },
  {
    id: "ps4-singstar-celebration",
    sourceUrl: "https://blog.playstation.com/archive/2017/10/05/singstar-celebration-releases-25th-october-on-ps4-track-list-announced",
    overview:
      "SingStar Celebration is London Studio and Sony's 2017 PS4 SingStar release built around PlayLink, using smartphones as microphones for party karaoke. PlayStation Blog announced a 30-song track list with artists such as Adele, ABBA, OMI, and Blondie, positioning it as a group-friendly PS4 entry rather than a traditional mic-bundle-only release. Collectors should check PlayLink/app requirements, region, disc condition, and the impact of SingStar service shutdowns on online features.",
  },
  {
    id: "ps4-singstar-ultimate-party",
    sourceUrl: "https://blog.playstation.com/2014/09/22/singstar-debuts-on-ps4-october-28th/",
    overview:
      "SingStar: Ultimate Party is the 2014 PS4-era SingStar release from London Studio and Sony. PlayStation Blog announced the PS4 debut with a revamped digital SingStar experience, SingStore transfer notes for eligible PS3 purchases, and the series' move onto Sony's newer console. For collection tracking, the key differences are disc versus digital entitlement, regional track list, microphone or app support, and whether any online services remain usable.",
  },
  {
    id: "ps4-siralim",
    sourceUrl: "https://store.playstation.com/en-us/product/UP1161-CUSA03062_00-PS4SIRALIM000000",
    overview:
      "Siralim is Thylacine Studios' PS4 creature-summoning RPG with light roguelike structure and effectively endless progression. The PlayStation Store describes hundreds of creatures, randomized dungeons and quests, castle upgrades, artifact crafting, no level cap, and Cross-Buy access with PS Vita. The first Siralim is mainly a digital-library and entitlement check on PlayStation, especially for region/account ownership and Cross-Buy access.",
  },
  {
    id: "ps4-siralim-2",
    sourceUrl: "https://www.thylacinestudios.com/siralim2/faq.php",
    overview:
      "Siralim 2 is Thylacine Studios' standalone follow-up to its monster-catching dungeon RPG, available on PS4 and PS Vita alongside computer and mobile platforms. The developer FAQ says it can be played without the first game and that it expands beyond more-of-the-same with new story and mechanical changes around creature summoning and dungeon exploration. It is a separate PS4 catalog entry from Siralim and Siralim 3, with digital access, region, and account details affecting PlayStation ownership.",
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
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    return {
      platformSlug: "ps4",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority PS4 weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official publisher, PlayStation, developer, and series references.",
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
