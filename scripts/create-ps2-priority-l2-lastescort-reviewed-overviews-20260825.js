const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-l2-lastescort-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-l2-love-x-loop",
    sourceUrl: "https://www.play-asia.com/en/l2-love-x-loop/13/703aga",
    overview:
      "L2: Love x Loop is a Japan-only Otomate otome visual novel with a science-fiction setup rather than a simple school romance. The heroine Nanami lives in a ruined future where humans are losing a war against robots; after her sister is taken during an attack, a mysterious robot gives her a chance to alter the past. For GCX, the hook is the unusual blend of romance routes, time-loop structure, and post-apocalyptic robot-war premise inside Idea Factory's late-PS2 otome catalog.",
  },
  {
    id: "ps2-lake-masters-ex",
    sourceUrl: "https://www.mobygames.com/game/73053/lake-masters-ex/",
    overview:
      "Lake Masters EX is a single-player bass fishing game built around a season of tournaments. Players earn points by placing well, unlock new lures and other equipment, and can eventually open and upgrade a private lake. It is not a team-sports title; its appeal is slower and more methodical, focused on lure choice, lake conditions, tournament progression, and the niche PS2 fishing-sim audience.",
  },
  {
    id: "ps2-lake-masters-ex-super",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-20103.html",
    overview:
      "Lake Masters EX Super is the second Lake Masters EX fishing release on PlayStation 2, continuing Dazz's long-running bass-fishing line from the PlayStation era. PSXDataCenter describes the loop around selecting lures, lakes, and conditions while chasing larger catches. GCX should frame it as a Japan-only follow-up for fishing-sim collectors, useful mainly for players who want the series progression rather than a flashy arcade sports game.",
  },
  {
    id: "ps2-langrisser-iii",
    sourceUrl: "https://www.hardcoregaming101.net/langrisser-iii/",
    overview:
      "Langrisser III on PS2 is Taito's console remake of Career Soft's 32-bit tactical RPG. The game is a prequel about the origins of the Langrisser sword and the genealogies that shape the rest of the series, while its battle design and relationship elements distinguish it from the earlier entries. For collectors, the PS2 version matters as a Japan-only strategy RPG remake tied to one of the genre's important Masaya-era franchises.",
  },
  {
    id: "ps2-lassie",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/33053-lassie",
    overview:
      "Lassie is a European children's adventure game based on the famous dog character and positioned as a follow-up to the movie. The story has Eddie Hynes stealing Lassie's six pups, sending players through simple 3D levels to track them down and bring him to justice. Its play is family-license territory: exploration, light objectives, using Lassie's senses, and accessible action rather than deep platforming or puzzle design.",
  },
  {
    id: "ps2-last-escort-2-shinya-no-amai-toge",
    sourceUrl: "https://en.wikipedia.org/wiki/Last_Escort",
    overview:
      "Last Escort 2: Shinya no Amai Toge is a host-club-themed otome sequel from D3 Publisher. This entry follows Serika Andou, a fashion-magazine editor whose life changes after she encounters Reiji and is drawn back into the Gorgeous host club setting. The appeal is romance simulation and visual-novel route management, with the added series wrinkle that prior save data can unlock a special continuation story for returning players.",
  },
  {
    id: "ps2-last-escort-club-katze",
    sourceUrl: "https://kotaku.com/games/last-escort-club-katze",
    overview:
      "Last Escort: Club Katze is the 2010 PS2/PSP entry in D3 Publisher's host-club otome series, developed by Mobile & Game Studio. It shifts the focus to Club Katze and a new cast of hosts, with visual-novel romance routes, character events, voice-driven appeal, and a lounge-like host-club atmosphere. For GCX, it should be cataloged as a late PS2 otome release that is most relevant to Japanese romance-game collectors and series completists.",
  },
  {
    id: "ps2-last-escort-kokuchou-special-night",
    sourceUrl: "https://en.wikipedia.org/wiki/Last_Escort",
    overview:
      "Last Escort: Kokuchou Special Night is an expanded PS2 follow-up to the first Last Escort game, returning to the Gorgeous host club and Akari Sagami's romance-simulation setup. The series centers on balancing work, visits, conversations, and route progress with host characters rather than action or traditional adventure puzzles. Its collector value comes from being part of D3 Publisher's mid-2000s otome push and from the series' unusually specific host-club theme.",
  },
];

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = [
    [
      "platformSlug",
      "gameId",
      "title",
      "currentOverview",
      "sourceUrl",
      "rewriteNotes",
      "newOverview",
      "reviewStatus",
      "reviewer",
    ],
  ];

  rewrites.forEach((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing PS2 game ${rewrite.id}`);
    rows.push([
      "ps2",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on official/storefront, specialist database, review, and series-history sources.",
      rewrite.overview,
      "reviewed",
      "GCX editorial cleanup",
    ]);
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rows: rewrites.length }, null, 2));
}

main();
