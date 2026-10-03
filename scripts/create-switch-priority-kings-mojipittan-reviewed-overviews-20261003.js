const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "switch.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "switch-priority-kings-mojipittan-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "switch-kings-of-paradise",
    sourceUrl: "https://www.nintendo.com/us/store/products/kings-of-paradise-switch/",
    overview:
      "Kings of Paradise is Voltage's Nintendo Switch release of its romance visual novel about reconnecting with several charismatic men after a sudden breakup. Nintendo's store listing and Voltage branding place it in the otome-style story-app lineage, so buyers should expect text-heavy play rather than action systems. Useful marketplace notes include digital-versus-code format, language support, region, save compatibility, and whether a listing is describing the full Switch release or earlier mobile content.",
  },
  {
    id: "switch-kishi-fujii-souta-no-shogi-training",
    sourceUrl: "https://www.nintendo.com/jp/topics/article/35cb421b-bef2-4d99-addb-469a142bac53",
    overview:
      "Kishi Fujii Souta no Shogi Training is Game Studio's Japan-only Nintendo Switch shogi training title officially supervised by the Japan Shogi Association and themed around professional player Sota Fujii. Nintendo's Japanese feature positions it as an approachable but serious learning tool, with lessons, practice, and match play built for portable study. Listings should call out Japanese text, shogi knowledge expectations, retail versus download format, and any physical inserts because it is not a rhythm game or casual minigame collection.",
  },
  {
    id: "switch-knights-in-the-nightmare-remaster",
    sourceUrl: "https://www.sting.co.jp/game/knights_in_the_night_mare/",
    overview:
      "Knights in the Nightmare Remaster is Sting's Switch version of its unusual Dept. Heaven tactics RPG, blending grid strategy, real-time projectile dodging, and touch-like cursor control. Sting's official page lists the remaster for Nintendo Switch alongside mobile platforms, making this a modern reissue of a cult DS/PSP design rather than a new sequel. Collectors should verify region, Japanese text dependence, digital or physical availability, and whether a listing understands the game's hybrid tactical-bullet-hell format.",
  },
  {
    id: "switch-knockout-city",
    sourceUrl: "https://knockoutcity.com/updates/knockout-city-special-announcement",
    overview:
      "Knockout City was Velan Studios and Electronic Arts' team-based online dodgeball action game for Nintendo Switch and other platforms. The official shutdown announcement states that live servers closed on June 6, 2023, so Switch listings should treat it as a historical or collectible release instead of a normally playable online game. Important trade details include download-code status, packaging condition, edition, region, and a clear note that ongoing play moved to the separate PC private-hosted server edition rather than the original Switch service.",
  },
  {
    id: "switch-kochira-haha-naru-hoshi-yori",
    sourceUrl: "https://nippon1.jp/consumer/hahanaruhoshiyori/product.html",
    overview:
      "Kochira, Haha Naru Hoshi Yori is Daisyworld and Nippon Ichi Software's Japanese adventure visual novel for Switch and PlayStation 4. Nippon Ichi's product page presents it as a 2021 release with standard and shop-limited editions, built around young women exploring an emptied Ikebukuro after humanity has vanished. Marketplace listings should mention Japanese-language story dependence, edition or bonus contents, Switch physical condition, and the exact romanized title because it is easy to bury under broader Nippon Ichi search results.",
  },
  {
    id: "switch-koi-no-hanasaku-hyakkaen",
    sourceUrl: "https://www.takuyo.co.jp/products/koihana/products/products.html",
    overview:
      "Koi no Hanasaku Hyakkaen is Takuyo's 2020 Nintendo Switch otome adventure set around a girls' school and a historical-style romance premise. Takuyo's official product page identifies the Switch platform and retail details, anchoring it as a Japanese-language visual novel rather than a general puzzle or action release. Listings should separate standard and limited editions, disclose Japanese text dependence, verify package and bonus-item condition, and preserve the full subtitle-free title spelling.",
  },
  {
    id: "switch-koi-suru-otome-to-shugo-no-tate-re-boot-the-shield-9",
    sourceUrl: "https://www.entergram.co.jp/koitate/product.html",
    overview:
      "Koi Suru Otome to Shugo no Tate: Re:boot The SHIELD-9 is Entergram's Switch and PS4 release of Giga's cross-dressing bodyguard adventure visual novel. Entergram's product page lists it as a one-player 'josou goei adventure' with standard, download, and complete-production limited editions, which makes edition accuracy especially important. Collectors should note Japanese-language dependence, CERO rating, limited-edition extras, region, and the distinction from Bara no Seibo or other Koi Tate entries.",
  },
  {
    id: "switch-konosuba-god-s-blessing-on-this-wonderful-world-labyrinth-of-hope-and-the-gathering-of-adventurers-plus",
    sourceUrl: "https://www.entergram.co.jp/konosuba_plus/",
    overview:
      "KonoSuba: God's Blessing on this Wonderful World! Labyrinth of Hope and the Gathering of Adventurers! Plus is Entergram's enhanced Switch and PS4 dungeon RPG based on the KonoSuba franchise. The official Entergram site identifies the Plus release and platform pair, while specialist coverage describes it as an updated version of the earlier Labyrinth of Hope RPG. Listings should spell out the long subtitle, Japanese text expectations, standard versus limited edition contents, and whether the copy includes any soundtrack or bonus material.",
  },
  {
    id: "switch-konosuba-god-s-blessing-on-this-wonderful-world-love-for-this-tempting-attire",
    sourceUrl: "https://game.mages.co.jp/konosuba/",
    overview:
      "KonoSuba: God's Blessing on this Wonderful World! Love for this Tempting Attire is Mages' Switch and PS4 adventure game centered on Kazuma's party dealing with cursed outfit changes. The Mages official site presents it as a 2020 anime-license release with standard and limited packages, separate from Entergram's dungeon RPG. Useful listing details include Japanese versus later localized title wording, edition contents, DLC expectations, Switch cartridge or download status, and condition of any character goods bundled with limited copies.",
  },
  {
    id: "switch-kotoba-no-puzzle-mojipittan-encore",
    sourceUrl: "https://encore.mojipittan.jp/about/",
    overview:
      "Kotoba no Puzzle: Mojipittan Encore is Bandai Namco's Switch revival of the Japanese word-building puzzle series, expanding the arcade-style letter-placement format for modern platforms. Bandai Namco's official site explains that players create words on a board and notes common content across Switch, PlayStation, Steam, and mobile versions. Listings should make the Japanese vocabulary dependence clear, identify the Encore version, confirm region and physical or digital format, and avoid presenting it as an ordinary crossword compilation.",
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
    if (!game) throw new Error(`Missing Switch game ${rewrite.id}`);
    return {
      platformSlug: "switch",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Switch weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, publisher, store, and specialist game-reference sources.",
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
