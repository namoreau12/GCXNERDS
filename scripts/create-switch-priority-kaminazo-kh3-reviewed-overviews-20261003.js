const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "switch.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "switch-priority-kaminazo-kh3-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "switch-kaminazo-mirai-kara-no-omoi-de",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_Switch_games_(H%E2%80%93P)",
    overview:
      "Kaminazo: Mirai kara no Omoi de is a 2019 Nintendo Switch puzzle-adventure release from DelightWorks and Gift Ten Industry. It sits in the Switch import catalog as a Japanese-language riddle and story game rather than a broad retail platformer or RPG. Listings should make the import status clear, note whether the copy is digital or physical, and call out any included launch bonuses or inserts.",
  },
  {
    id: "switch-kathy-rain",
    sourceUrl: "https://www.gamestop.com/video-games/nintendo-switch/products/kathy-rain-directors-cut---nintendo-switch/404879.html",
    overview:
      "Kathy Rain on Switch is Kathy Rain: Director's Cut, Clifftop Games and Raw Fury's expanded version of the 1990s-set point-and-click mystery. Retail listings describe added story material, more dialogue, new areas, controller support, and revised full-screen environments compared with the original 2016 release. It is best cataloged as a narrative adventure where physical edition, region, and cartridge condition matter for collectors.",
  },
  {
    id: "switch-keiji-j-b-harold-no-jikenbo-manhattan-requiem",
    sourceUrl: "https://www.4gamer.net/games/397/G039767/20171023014/",
    overview:
      "Keiji J.B. Harold no Jikenbo: Manhattan Requiem is Mebius's 2017 Switch release of Riverhill Soft's classic detective adventure. The game belongs to the J.B. Harold murder-mystery line, using command-based investigation and dialogue rather than action systems. Buyer notes should flag Japanese text dependence, the Manhattan Requiem subtitle, eShop versus any physical availability, and the fact that it is part of a long-running detective series.",
  },
  {
    id: "switch-keiken-zero-na-classmate",
    sourceUrl: "https://www.entergram.co.jp/keikenzero/",
    overview:
      "Keiken Zero na Classmate is Entergram and Prekano's 2021 romance visual novel for Nintendo Switch and PlayStation 4. Entergram's official page frames the story around Kazuma confessing to classmate Risa, whose extreme shyness sends the romance into a school-life chase, with Risa and Mikumo as the main character focus. Catalog notes should identify it as a Japanese VN import and distinguish premium, standard, and download editions.",
  },
  {
    id: "switch-killer-queen-black",
    sourceUrl: "https://www.nighthawkinteractive.com/multiplayer-arcade-action-hit-killer-queen-black-flies-into-retail-today/",
    overview:
      "Killer Queen Black is the Switch adaptation of BumbleBear and Liquid Bit's competitive arcade game, published physically by Nighthawk Interactive. Its identity is eight-player single-screen action built around platforming, strategy, sports-like objectives, and team combat, with retail Switch copies promoted alongside themed Joy-Con skins. Listings should separate the physical package from eShop copies and note whether inserts or bonus skins are present.",
  },
  {
    id: "switch-kimi-wa-yukima-ni-koinegau",
    sourceUrl: "https://www.aksysgames.com/blog/2022/03/21/aksys-games-updates-details-for-otome-titles/",
    overview:
      "Kimi wa Yukima ni Koinegau is Idea Factory's historical otome visual novel, localized by Aksys Games as Winter's Wish: Spirits of Edo. Aksys announced the English title for Switch while positioning it with other otome releases, so the most useful marketplace distinction is Japanese import versus localized Aksys edition. Listings should mention language, route-based romance structure, edition, and whether any preorder or limited-edition extras are included.",
  },
  {
    id: "switch-kingdom-come-deliverance",
    sourceUrl: "https://en.wikipedia.org/wiki/Kingdom_Come:_Deliverance",
    overview:
      "Kingdom Come: Deliverance on Switch is the 2024 portable version of Warhorse Studios' medieval open-world RPG, with Saber Interactive handling the Switch port. The game emphasizes grounded first-person role-playing, quests, reputation, combat, and historical Bohemia rather than fantasy party mechanics. Listings should identify the Switch edition, region, download requirements if any, and whether the copy is the Royal Edition with expansion content.",
  },
  {
    id: "switch-kingdom-hearts-hd-1-5-remix",
    sourceUrl: "https://www.square-enix-games.com/en_US/home/20th-anniversary-kingdom-hearts-nintendo-switch",
    overview:
      "Kingdom Hearts HD 1.5 Remix on Switch is part of Square Enix's Kingdom Hearts HD 1.5 + 2.5 ReMIX Cloud Version release from February 10, 2022. The package brings the early Kingdom Hearts remasters to Switch through cloud streaming, so ownership, service access, and network dependence matter more than cartridge condition. Catalog listings should avoid treating the 2022 Switch entry like a normal physical port and should distinguish it from later native listings.",
  },
  {
    id: "switch-kingdom-hearts-hd-2-5-remix",
    sourceUrl: "https://www.square-enix-games.com/en_US/home/20th-anniversary-kingdom-hearts-nintendo-switch",
    overview:
      "Kingdom Hearts HD 2.5 Remix on Switch is cataloged through the Kingdom Hearts HD 1.5 + 2.5 ReMIX Cloud Version bundle, one of Square Enix's cloud releases for Nintendo Switch on February 10, 2022. The original 2.5 collection covers later remastered series entries, but the Switch version depends on cloud streaming rather than local cartridge play. Buyer-facing notes should call out the cloud format, account access, and any distinction from native versions.",
  },
  {
    id: "switch-kingdom-hearts-iii",
    sourceUrl: "https://gamefaqs.gamespot.com/switch/333169-kingdom-hearts-iii-plus-re-mind-cloud-version/data",
    overview:
      "Kingdom Hearts III on Switch is Kingdom Hearts III + Re Mind Cloud Version, Square Enix's streamed Switch release that includes the Re Mind DLC. GameFAQs records the Switch eShop release on February 10, 2022, matching Square Enix's cloud-version rollout. It should be listed as a cloud-dependent digital release, with special attention to service availability, account ownership, DLC inclusion, and confusion with non-cloud versions on other platforms.",
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
        "Priority Switch weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus publisher, Nintendo, GameFAQs, retail, and series references.",
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
