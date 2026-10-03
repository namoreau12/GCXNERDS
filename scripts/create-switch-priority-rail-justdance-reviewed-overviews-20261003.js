const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "switch.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "switch-priority-rail-justdance-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "switch-japanese-rail-sim-journey-to-kyoto",
    sourceUrl: "https://store.steampowered.com/app/1761290/Japanese_Rail_Sim_Journey_to_Kyoto/",
    overview:
      "Japanese Rail Sim: Journey to Kyoto is Sonic Powered's live-action railway simulator built around operating the Eizan Railway in Kyoto. The series uses real cab-view footage and a reproduced driver's seat, so the Switch listing should emphasize route learning, signal and speed control, and sightseeing atmosphere rather than platforming or collectible adventure. It is a niche rail sim where region, language, and exact route matter.",
  },
  {
    id: "switch-jikkyou-powerful-pro-baseball",
    sourceUrl: "https://www.konami.com/pawa/switch/",
    overview:
      "Jikkyou Powerful Pro Baseball is Konami's 2019 Nintendo Switch entry in the long-running Power Pros baseball line, using the series' super-deformed players for approachable but systems-rich baseball. Konami's official site frames the genre as baseball and training, with Pro Controller and amiibo support, so this is a Japan-first sports sim with season, player-growth, and local-play appeal. Listings should identify language, region, and roster-era expectations.",
  },
  {
    id: "switch-john-wick-hex",
    sourceUrl: "https://www.bithellgames.com/john-wick-hex",
    overview:
      "John Wick Hex is Bithell Games' official action-strategy adaptation of the film series, built as fight-choreographed planning rather than a straight shooter. The developer describes it as a fast-paced strategy game made with the films' creative teams, turning gun-fu into timeline-based decisions about movement, ammo, attacks, and spacing. On Switch it is valuable as a licensed tactics oddity, especially now that digital availability can change by territory.",
  },
  {
    id: "switch-just-dance-2017",
    sourceUrl: "https://news.ubisoft.com/en-us/article/7EswGLpbl4ba8nZ6AQmcRI/just-dance-2017-now-available-for-nintendo-switch",
    overview:
      "Just Dance 2017 was the series' Nintendo Switch launch-era entry, bringing Ubisoft's motion-scored dance format to the new hybrid console. Ubisoft's Switch announcement highlighted more than 40 songs, artists such as Justin Bieber, Queen, and Sia, and the option to use a phone as a controller. For collectors, the Switch context matters because online services, Just Dance Unlimited access, and base-cart songs age differently from the annual box art.",
  },
  {
    id: "switch-just-dance-2018",
    sourceUrl: "https://news.ubisoft.com/en-us/article/10yDjtrdSuouySCcWxg4ok/just-dance-2018-now-available",
    overview:
      "Just Dance 2018 is Ubisoft's follow-up Switch dance release, centered on more than 40 new songs and a party-anywhere pitch for Nintendo's hybrid hardware. Ubisoft promoted artists including Katy Perry, Lady Gaga, Luis Fonsi and Daddy Yankee, Ed Sheeran, Beyonce, and Bruno Mars, while Just Dance Unlimited expanded the playable library through subscription. Listings should separate the base game from subscription content and note whether the copy is physical or digital.",
  },
  {
    id: "switch-just-dance-2019",
    sourceUrl: "https://news.ubisoft.com/en-us/article/01NgKj4HnqqNuKzZbuVfIR/just-dance-2019-available-now",
    overview:
      "Just Dance 2019 continues Ubisoft's annual Switch dance series with motion-scored routines, local party play, and 40 new songs from artists including Ariana Grande, Dua Lipa, and Bruno Mars. Its practical identity is a yearly track-list refresh, so the buyer-facing details are the included base songs, region, cartridge condition, and whether any online Just Dance Unlimited functionality is still usable.",
  },
  {
    id: "switch-just-dance-2020",
    sourceUrl: "https://news.ubisoft.com/en-us/article/7qCEXFPd1oGWTPuh1QmCgH/just-dance-2020-10th-anniversary-entry-includes-new-songs-return-of-coop",
    overview:
      "Just Dance 2020 is the series' 10th-anniversary Switch entry, pairing 40 new songs with the return of co-op play and the familiar motion-scored party format. Ubisoft positioned it as a celebration release across Switch and other platforms, so its value is in the 2020 track list, workout-friendly repeat play, and family multiplayer. Listings should be clear about base-game songs versus subscription-streamed extras.",
  },
  {
    id: "switch-just-dance-2021",
    sourceUrl: "https://news.ubisoft.com/en-us/article/3qiEchFR83YCN2OUvYz89r/kick-it-with-just-dance-2021-out-now/1000",
    overview:
      "Just Dance 2021 is Ubisoft's Switch dance release for the cross-generation 2020 season, built around 40 brand-new songs and returning modes for solo, family, and party play. Ubisoft's launch coverage calls out the Switch version alongside PS4, Xbox One, Stadia, and newer-console versions, making this a late-era physical Switch entry before the series moved further toward platform hubs and subscriptions. Track list and online-service context are the key listing details.",
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
        "Priority Switch weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus platform holder, publisher, developer, official news, and store references.",
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
