const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-zeroone-kinnikuman-reviewed-overviews-2026-08-25.csv"
);

const ps2ListSource = "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28A%E2%80%93K%29";

const rewrites = [
  {
    id: "ps2-king-of-colosseum-zero-one-disc",
    sourceUrl: "https://www.pricecharting.com/game/jp-playstation-2/king-of-colosseum-zero-one",
    overview:
      "King of Colosseum: Zero-One Disc is another Japan-only PlayStation 2 entry in Spike's King of Colosseum wrestling simulation line. PriceCharting identifies it as a JP PS2 wrestling release under Spike, and the surrounding King of Colosseum series context puts it beside the Red, Green, and II discs built around Japanese pro-wrestling rosters and grappling systems. GCX should frame it as a puroresu collector disc, not generic action, with practical value tied to Spike's wrestling lineage and NTSC-J compatibility.",
  },
  {
    id: "ps2-kiniro-no-corda-2",
    sourceUrl: "https://wiki.pcsx2.net/index.php?mobileaction=toggle_view_desktop&title=Kiniro_no_Corda_2",
    overview:
      "Kiniro no Corda 2 is Koei and Ruby Party's PlayStation 2 sequel to La Corda d'Oro, released in Japan in 2007. PCSX2's compatibility entry summarizes it as the direct sequel to the first game and a prequel to Kiniro no Corda 2 Encore, while Koei list data places the series in Ruby Party's romance/adventure catalog. GCX should describe it as a music-school otome visual novel/adventure where relationships, classical-music competition, and character events matter more than conventional RPG progression.",
  },
  {
    id: "ps2-kiniro-no-corda-2-encore",
    sourceUrl: "https://backloggd.com/games/kiniro-no-corda-2-encore/",
    overview:
      "Kiniro no Corda 2 Encore is the 2007 PlayStation 2 continuation of Kiniro no Corda 2 from Ruby Party and Koei. Backloggd describes it as a visual novel for PS2 and notes that it continues Corda 2, while retail listings place the Japanese release around September 2007. GCX should present it as an expansion/follow-up for players already invested in the Corda 2 cast, useful for collectors because it is a distinct sequel-side release inside Koei's long-running otome music series.",
  },
  {
    id: "ps2-kiniro-no-corda-3",
    sourceUrl: "https://mybacklog.gg/games/kiniro-no-corda-3/",
    overview:
      "Kiniro no Corda 3 is the 2010 PlayStation 2 and PSP entry in Koei's classical-music romance series. MyBacklog lists Koei as maker, a February 25, 2010 release date, romance themes, and point-and-click/visual-novel genres, while Koei list data places it in the same Ruby Party line as the earlier Corda games. GCX should describe it as a later-generation otome visual novel centered on music competition and relationship routes, not a generic story-only VN with no gameplay identity.",
  },
  {
    id: "ps2-kinkou-myaku-tansa-simulation-ingot-79",
    sourceUrl: "https://www.ludomedia.it/ps2/kinkou-myaku-tansa-simulation-ingot-79/",
    overview:
      "Kinkou Myaku Tansa Simulation: Ingot 79 is a Japanese PlayStation 2 management/simulation release from Microvision and FAB Communication, dated November 14, 2002 in catalog records. Ludomedia classifies it under management-style simulation, and soundtrack/catalog pages confirm the developer, publisher, platform, and year. GCX should keep the description practical: this is a niche gold-vein exploration/business simulation import, with collector interest coming from its unusual premise, small publisher, and NTSC-J PS2 status.",
  },
  {
    id: "ps2-kinniku-banzuke-muscle-wars-21",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65048.html",
    overview:
      "Kinniku Banzuke: Muscle Wars 21 is Konami's PlayStation 2 adaptation of the Japanese TV competition show Kinniku Banzuke. PSXDataCenter notes that it is the only PS2 game based on the show, includes 16 selectable characters with 8 initially available, and centers modes such as Muscle Ranking and Muscle Trial around competing in event stages for scores. GCX should describe it as a TV athletic-challenge/party sports game rather than a strategy title, with appeal tied to Konami's licensed Japanese variety-show catalog.",
  },
  {
    id: "ps2-kinnikuman-muscle-grand-prix-max",
    sourceUrl: "https://en.wikipedia.org/wiki/Kinnikuman_Muscle_Grand_Prix",
    overview:
      "Kinnikuman Muscle Grand Prix Max is the PlayStation 2 home version of AKI Corporation's Kinnikuman arcade fighting game. The series record describes it as a 3D fighting game based on the Weekly Shonen Jump manga/anime, with the PS2 Max version expanding the arcade release with extra characters, stages, story mode, tournament mode, 5-on-5 team play, and survival. GCX should correct the racing label and present it as a deep anime wrestling/fighting title for Kinnikuman and AKI fans.",
  },
  {
    id: "ps2-kinnikuman-muscle-grand-prix-max-2-tokumori",
    sourceUrl: "https://en.wikipedia.org/wiki/Kinnikuman_Muscle_Grand_Prix",
    overview:
      "Kinnikuman Muscle Grand Prix Max 2: Tokumori is the expanded PlayStation 2 version of Muscle Grand Prix 2. The series record says Tokumori adds home-version extras over the arcade game, including Tournament, Collection, Practice, and Special modes, with Collection rewards tied to recreating anime scenes accurately and Special mode including classic NES Kinnikuman games. GCX should frame it as the richer collector-facing sequel package, important for fans of Kinnikuman, AKI fighting systems, and Japan-only PS2 anime games.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on catalog, platform database, franchise, and compatibility sources.",
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
