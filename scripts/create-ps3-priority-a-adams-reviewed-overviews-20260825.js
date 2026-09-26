const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps3.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps3-priority-a-adams-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps3-and-sora-no-muko-de-saki-masuyo-ni",
    sourceUrl: "https://kotaku.com/games/and-sora-no-mukou-de-saki-masuyou-ni",
    overview:
      "&: Sora no Muko de Saki Masuyo ni is a Japanese visual novel from Akatsuki Works about young people reconnecting after the strange sight of two moons recalls a shared childhood event. The PS3 release belongs to the late-console wave of import visual novels, where the collector value is in the premise, cast routes, and platform-specific release more than action systems. GCX should present it as a story-first romance/mystery import with a distinctive sky-and-memory hook.",
  },
  {
    id: "ps3-killallzombies",
    sourceUrl: "https://www.beatshapers.com/zombies/",
    overview:
      "#killallzombies is Beatshapers' twin-stick zombie shooter built around surviving waves on arenas that shift under pressure. Bosses, score chasing, survival play, local co-op, and the game's broadcast-interaction concept give it more identity than a plain horde shooter. GCX should flag the PS3 version as a digital-era arcade shooter where the draw is short-session intensity and escalating arena chaos.",
  },
  {
    id: "ps3-3d-ultra-minigolf-adventures-2",
    sourceUrl: "https://en.wikipedia.org/wiki/3D_Ultra_Minigolf_(game_series)#3D_Ultra_Minigolf_Adventures_2",
    overview:
      "3D Ultra Minigolf Adventures 2 brings the arcade miniature-golf series to PS3 with more than 50 holes, four-player play, themed hazards, and a light party-game approach to putting. It follows the series' tradition of exaggerated courses rather than realistic golf simulation, so the appeal is trick shots, obstacle timing, and multiplayer readability. GCX should treat it as a PSN-era casual sports entry tied to the long-running 3D Ultra Minigolf line.",
  },
  {
    id: "ps3-4-elements-hd",
    sourceUrl: "https://www.pushsquare.com/reviews/psn/4_elements_hd",
    overview:
      "4 Elements HD is a PlayStation 3 version of the fantasy match-puzzle series, built around clearing paths so magical energy can reach its destination. Instead of only swapping gems for points, the game asks players to plan routes through boards, use power-ups, and restore elemental books across a long campaign. GCX should describe it as a relaxed but content-rich PSN puzzle release with Move support and a stronger adventure wrapper than the average match-three port.",
  },
  {
    id: "ps3-5-star-wrestling",
    sourceUrl: "https://www.psu.com/reviews/5-star-wrestling-ps3-review/",
    overview:
      "5 Star Wrestling is Serious Parody's downloadable PS3 wrestling game, built around spoofed versions of recognizable wrestling archetypes and a heavier focus on limb damage, reversals, and ring psychology than its budget presentation suggests. Its roster, challenge structure, and finisher-counter ideas make it an oddball alternative to licensed WWE games. GCX should present it as a flawed but distinctive wrestling curiosity from the late PS3 store era.",
  },
  {
    id: "ps3-100-yen-gomibako",
    sourceUrl: "https://en.wikipedia.org/wiki/Trash_Panic",
    overview:
      "100-Yen Gomibako is the Japanese pay-per-play variant of Sony Japan Studio's Trash Panic, a PSN puzzle game about compacting falling garbage before the trash can overflows. Players smash, burn, decompose, and carefully preserve special items while managing Eco and Ego scoring routes. GCX should connect it clearly to Trash Panic because that unusual garbage-management design, not the generic puzzle label, is the reason collectors remember it.",
  },
  {
    id: "ps3-a-men",
    sourceUrl: "https://www.gamespew.com/2024/10/bloober-team-a-brief-gameography/",
    overview:
      "A-Men is an early Bloober Team puzzle-platformer inspired by character-switching classics such as Lemmings and The Lost Vikings. Stages are less about fast reflexes than solving how each specialist gets through hazards, enemies, and exits in the correct order. GCX should frame the PS3 release as a tough, trial-and-error tactical platformer from Bloober's pre-horror period, useful for collectors tracking the studio's full history.",
  },
  {
    id: "ps3-aabs-animals",
    sourceUrl: "https://store.playstation.com/en-us/product/UP5013-CUSA01231_00-AABSANIMALS00PS4",
    overview:
      "Aabs Animals is a passive animal-viewing entertainment app rather than a conventional game with stages, failure states, or campaign goals. The player watches and lightly engages with simple animal content, with trophy value and novelty doing more work than mechanics. GCX should label it carefully as a minimalist digital curiosity from Aabs, because buyers expecting a pet simulator or full management game would misunderstand what this release actually offers.",
  },
  {
    id: "ps3-aaru-s-awakening",
    sourceUrl: "https://blog.playstation.com/2014/05/30/aarus-awakening-coming-to-ps4-ps3-this-summer/",
    overview:
      "Aaru's Awakening is Lumenox Games' hand-drawn 2D action platformer built around launching Aaru's soul and teleporting to it at the right moment. That teleport rhythm shapes the whole game, turning jumps, walls, hazards, and speed into timing puzzles. GCX should describe it as a stylish but demanding precision platformer whose identity comes from movement mastery rather than combat depth.",
  },
  {
    id: "ps3-absolute-supercars",
    sourceUrl: "https://en.wikipedia.org/wiki/Supercar_Challenge_(video_game)",
    overview:
      "Absolute Supercars is the later reworked release of Eutechnyx's Supercar Challenge lineage, keeping the focus on high-end licensed cars, track racing, and simulation-leaning handling. It sits in the same PS3 racing family as Ferrari Challenge and Supercar Challenge, making it more of an enthusiast car package than an arcade stunt racer. GCX should highlight the re-release connection because it explains why the title can feel familiar to collectors.",
  },
  {
    id: "ps3-ac-dc-live-rock-band-track-pack",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Rock_Band_track_packs#AC/DC_Live:_Rock_Band_Track_Pack",
    overview:
      "AC/DC Live: Rock Band Track Pack is a standalone Rock Band disc built around the band's Live at Donington set, with 18 AC/DC performances playable through the familiar instrument rhythm-game format. On PS3, its collector details matter because copies originally included export codes for using the songs in other Rock Band titles. GCX should describe it as a licensed music-game expansion disc, not a full sequel or ordinary compilation.",
  },
  {
    id: "ps3-accel-world-ginyoku-no-kakusei",
    sourceUrl: "https://en.wikipedia.org/wiki/Accel_World#Video_games",
    overview:
      "Accel World: Ginyoku no Kakusei is the first PS3/PSP game adaptation of Reki Kawahara's Accel World, released in Japan by Namco Bandai Games in 2012. It expands the anime and light-novel setting around Brain Burst, avatar battles, and Haruyuki's connection with Kuroyukihime, with limited editions tied to original animation content. GCX should position it as an import franchise adventure for Accel World collectors rather than a generic action listing.",
  },
  {
    id: "ps3-accel-world-kasoku-no-chouten",
    sourceUrl: "https://wiki.rpcs3.net/index.php?title=Accel_World%3A_Kasoku_no_Chouten",
    overview:
      "Accel World: Kasoku no Chouten is the 2013 follow-up to Ginyoku no Kakusei, continuing Bandai Namco's PS3/PSP adaptation of the Accel World universe. It stays tied to the series' accelerated-reality battles and character-driven story material rather than acting as a broad standalone fighter. GCX should call it the second Japanese Accel World console entry and keep its import-anime context visible for collectors.",
  },
  {
    id: "ps3-action-henk",
    sourceUrl: "https://www.gameinformer.com/games/action_henk/b/pc/archive/2014/08/06/action-henk-preview.aspx",
    overview:
      "Action Henk is RageSquid's toy-room time-trial platformer about racing plastic action figures through ramps, loops, jumps, slides, and gadget-driven shortcuts. The core hook is momentum: players chase medals and leaderboard times by preserving speed through each obstacle course. GCX should present the PS3 version as a bright, replay-heavy precision racer/platformer rather than a standard side-scrolling action game.",
  },
  {
    id: "ps3-adam-s-venture-chronicles",
    sourceUrl: "https://www.justadventure.com/2014/01/17/adam-s-venture-chronicles-is-announced-for-ps3/",
    overview:
      "Adam's Venture Chronicles collects Vertigo Games' three Adam's Venture episodes into a PS3 adventure package about Adam Venture's search through biblical and historical mysteries. The focus is nonviolent exploration, environmental interaction, platforming, and dozens of logic puzzles across Europe and the Middle East. GCX should frame it as a late PSN adventure compilation, with the trilogy format and family-friendly puzzle tone doing the collector work.",
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
    if (!game) throw new Error(`Missing PS3 game ${rewrite.id}`);
    rows.push([
      "ps3",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS3 weak-template cleanup; original GCX editorial overview based on platform database, publisher, storefront, specialist database, and series sources.",
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
