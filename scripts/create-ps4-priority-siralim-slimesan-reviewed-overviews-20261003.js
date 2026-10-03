const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-siralim-slimesan-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "ps4-siralim-3",
    sourceUrl: "https://www.thylacinestudios.com/siralim3/faq.php",
    overview:
      "Siralim 3 is Thylacine Studios' PlayStation 4 monster-taming RPG, built around collecting, breeding, equipping, and optimizing hundreds of creatures through long-form dungeon progression. The official FAQ says it stands alone from the first two Siralim games and highlights 700-plus creatures, 15 bosses, revamped breeding, artifacts, runewords, gods, and endgame systems. Listings should identify the PS4 digital or limited physical release, region, language support, and whether a buyer is looking for this third entry rather than Siralim or Siralim Ultimate.",
  },
  {
    id: "ps4-sisters-royale",
    sourceUrl: "https://chorusworldwide.com/",
    overview:
      "Sisters Royale: Five Sisters Under Fire is Alfa System's vertically scrolling shoot-'em-up published by Chorus Worldwide on PlayStation 4 and other platforms. Chorus lists the title in its catalog, while Alfa System's work history ties the game to the developer behind earlier character-driven shooters. Marketplace listings should call out the PS4 region, digital versus physical availability, one-player arcade shooter structure, DLC or extra-character expectations, and the distinction from Castle of Shikigami entries with similar developer DNA.",
  },
  {
    id: "ps4-skate-city",
    sourceUrl: "https://store.playstation.com/en-us/product/UP5726-CUSA20206_00-SKATECITY0000001/",
    overview:
      "Skate City is Snowman's relaxed PlayStation 4 skateboarding game, developed with Agens and built around stylish trick lines in Los Angeles, Oslo, and Barcelona. The PlayStation Store listing emphasizes flip tricks, manuals, grinds, more than 100 challenges, Endless Skate, skater customization, lo-fi music, and replay-capture tools. Listings should mention digital format, language support, PS4/PS5 compatibility notes, and whether the appeal is chill score-chasing rather than a licensed pro-skater career mode.",
  },
  {
    id: "ps4-skater-xl",
    sourceUrl: "https://blog.playstation.com/2020/03/03/skater-xl-is-a-new-take-on-skateboarding-games-coming-to-ps4/",
    overview:
      "Skater XL is Easy Day Studios' physics-forward skateboarding sim for PlayStation 4, designed around board control, player expression, and real-world-inspired skate spots. Easy Day's PlayStation Blog announcement frames it as a modern answer to the long gap in authentic skateboarding games, with controls and environments built around creativity rather than canned trick strings. Listings should note the PS4 release, physical or digital format, region, update status, and whether buyers expect simulation-style controls instead of Tony Hawk-style arcade scoring.",
  },
  {
    id: "ps4-skul-the-hero-slayer",
    sourceUrl: "https://playneowiz.com/de/skul-the-hero-slayer",
    overview:
      "Skul: The Hero Slayer is SouthPAW Games and NEOWIZ's action roguelite platformer on PlayStation 4, starring a small skeleton who swaps skulls to change combat styles. NEOWIZ's product page lists SouthPAW as developer, NEOWIZ as publisher, and PS4 among the supported platforms, while console launch materials place the worldwide console release in October 2021. Marketplace notes should cover region, digital or physical edition, language support, DLC or update expectations, and whether the buyer wants the roguelite action game rather than a standard mascot platformer.",
  },
  {
    id: "ps4-sky-force-anniversary",
    sourceUrl: "https://store.playstation.com/en-us/product/UP4179-CUSA04445_00-SKYFORCEANNIVERS/",
    overview:
      "Sky Force Anniversary is Infinite Dreams' PlayStation 4 revival of its classic vertical shoot-'em-up, rebuilt for the series' 10-year anniversary. The PlayStation Store listing describes modern visuals, intuitive controls, an upgrade system, one- or two-player support, and cross-buy entitlement for PS3, PS4, and PS Vita versions. Listings should separate Anniversary from Sky Force Reloaded, note digital or Limited Run-style physical availability where relevant, and disclose region, cross-buy expectations, and local co-op support.",
  },
  {
    id: "ps4-sky-force-reloaded",
    sourceUrl: "https://store.playstation.com/en-us/product/UP4179-CUSA09428_00-SKYFORCERELOADED/",
    overview:
      "Sky Force Reloaded is Infinite Dreams' later PlayStation 4 scrolling shooter, following the Anniversary release with another upgrade-heavy arcade campaign. The PlayStation Store page describes classic shoot-'em-up action with modern visuals, progression systems, collectibles, large bosses, lasers, explosions, and optional online features. Listings should distinguish Reloaded from Anniversary, mention local one- or two-player play, digital format, region, and any PS5 backward-compatibility caveats shown by the store.",
  },
  {
    id: "ps4-skyscrappers",
    sourceUrl: "https://store.playstation.com/es-ar/product/UP1740-CUSA03903_00-SKYSCRAPPERS0000",
    overview:
      "SkyScrappers is Ground Shatter's PlayStation 4 vertical brawler, built around characters racing and fighting upward through collapsing skyscrapers. The PlayStation Store identifies Ground Shatter as publisher, while contemporary coverage frames it as a multiplayer-leaning arena fighter with platforming hazards rather than a conventional one-on-one fighting game. Listings should note region, digital availability, local multiplayer focus, arcade-mode expectations, and whether a buyer is looking for the PS4 release rather than later Ground Shatter titles.",
  },
  {
    id: "ps4-slabwell",
    sourceUrl: "https://press.jandusoft.com/sheet.php?p=slabwell",
    overview:
      "SlabWell: The Quest for Kaktun's Alpaca is Undercoders and JanduSoft's PlayStation 4 puzzle adventure about two thieves exploring an Amazonian temple for the Jade Alpaca. JanduSoft's press sheet lists PS4 among the platforms and describes more than 100 handcrafted puzzle levels, traps, new mechanics, solo play, and co-op. Marketplace listings should clarify the full subtitle, region, digital format, co-op support, and whether the buyer expects a pure logic-puzzle game or an adventure-themed puzzle campaign.",
  },
  {
    id: "ps4-slime-san-super-slime-edition",
    sourceUrl: "https://store.playstation.com/en-us/product/UP0825-CUSA08238_00-SLIMESAPS4SIEA00/",
    overview:
      "Slime-san: Superslime Edition is Fabraz and Headup's PlayStation 4 edition of the fast 2D platformer, packaging the main game with its major campaigns and extra console content. The PlayStation Store listing names Mama's Madness, Blackbird's Kraken, Sheeple's Sequel, 10 exclusive Grandpa-san levels, dynamic color palettes, and competitive or cooperative arcade minigames. Listings should identify Superslime Edition specifically, note digital or Limited Run-style physical availability, region, local two-player support, and the difference from the base Slime-san release.",
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
        "Priority PS4 weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, developer, publisher, store, and specialist game-reference sources.",
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
