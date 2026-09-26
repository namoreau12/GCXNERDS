const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-granturismo-shinobi-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-my-first-gran-turismo",
    sourceUrl: "https://www.gran-turismo.com/us/products/myfirstgt/",
    overview:
      "My First Gran Turismo is Polyphony Digital's free PS4 and PS5 introduction to Gran Turismo 7, built as a guided sampler rather than a full retail sequel. It gives new players license-test style challenges, race events, time trials, Music Rally activities, and a curated garage of cars meant to teach braking, racing lines, and the series' realistic handling step by step. GCX should describe it as a Sony-recognized entry point into modern Gran Turismo, useful for collectors because it sits oddly between demo, tutorial, and standalone digital release.",
  },
  {
    id: "ps4-my-universe-cooking-star-restaurant",
    sourceUrl: "https://www.microids.com/game-my-universe-cooking-star-restaurant-us/",
    overview:
      "My Universe: Cooking Star Restaurant is a colorful life-simulation cooking game from Old Skull Games and Microids where the player tries to build a first restaurant into a successful local spot. The loop mixes customer service, restaurant management, recipe progression, and food-prep minigames covering more than 30 dishes from around the world. GCX should frame it as a family-friendly PS4 simulation built around approachable arcade cooking tasks and gradual restaurant upgrades, not as a serious chef-management sim.",
  },
  {
    id: "ps4-my-universe-fashion-boutique",
    sourceUrl: "https://store.playstation.com/en-us/product/UP1475-CUSA19312_00-MYFASHION00000US",
    overview:
      "My Universe: Fashion Boutique lets players run a small clothing shop, decorate the showroom, help customers find outfits, and grow a fashion brand through custom designs. The PlayStation Store listing emphasizes shop management, customer requests, and creating clothing from selected shapes, materials, and patterns, with progress tied to improving and expanding the boutique. GCX should position it as a light family simulation for players who like customization, retail role-play, and fashion-themed progression more than challenge-heavy management.",
  },
  {
    id: "ps4-my-universe-my-baby",
    sourceUrl: "https://www.microids.com/game-my-baby/",
    overview:
      "My Universe: My Baby is the first title in Microids' My Universe line, a gentle caregiving simulation about looking after a newborn boy or girl. Players respond to the baby's mood by feeding, bathing, changing diapers, playing, and helping the child learn new skills, with the experience built around simple routine interactions rather than fail-state pressure. GCX should describe it as a family-oriented nurture sim on PS4, closest to a digital dollhouse or caregiving toy rather than a conventional adventure game.",
  },
  {
    id: "ps4-my-universe-pet-clinic-cats-and-dogs",
    sourceUrl: "https://www.microids.com/game-my-universe-pet-clinic-cats-dogs/",
    overview:
      "My Universe: Pet Clinic Cats & Dogs puts players in charge of a small veterinary clinic where cats and dogs arrive with problems to diagnose and treat through simple minigames. The Microids page highlights new missions, treatments, clinic tasks, improved presentation, and additional breeds such as Dalmatian, Border Collie, Abyssinian, and Devon Rex in the Cats & Dogs/Panda Edition framing. GCX should treat it as a cozy veterinary role-play game for younger players and collectors of the My Universe family-sim series.",
  },
  {
    id: "ps4-my-universe-school-teacher",
    sourceUrl: "https://www.microids.com/game-my-universe-school-teacher/",
    overview:
      "My Universe: School Teacher casts the player as a young teacher trying to bring a struggling school back to the top. It combines classroom customization, pupil management, school objectives, contests, festivals, and subject-based minigames for lessons such as geometry, biology, and art. GCX should distinguish it from the other My Universe PS4 entries by focusing on school routines and student progress, making it a light management-and-minigame package built for family simulation fans.",
  },
  {
    id: "ps4-narcos-rise-of-the-cartels",
    sourceUrl: "https://store.playstation.com/en-us/concept/232837",
    overview:
      "Narcos: Rise of the Cartels is a licensed turn-based strategy game based on the Netflix series, following the conflict around El Patron from both DEA and cartel perspectives. Players choose a side, move squads through recognizable locations inspired by the show, and fight pivotal battles in a war-on-drugs campaign where positioning and unit abilities matter more than reflex action. GCX should present it as a TV-license tactics release for PS4 collectors, notable for its Narcos branding and side-select structure even if it sits outside the platform's biggest strategy names.",
  },
  {
    id: "ps4-naruto-to-boruto-shinobi-striker",
    sourceUrl: "https://www.bandainamcoent.com/games/naruto-to-boruto-shinobi-striker",
    overview:
      "Naruto to Boruto: Shinobi Striker is Bandai Namco's online-focused Naruto action game built around four-player teams fighting other squads in 3D arenas. Instead of retelling a single anime arc in a traditional arena-fighter structure, it emphasizes custom avatars, class roles, wall-running movement, cooperative team tactics, and online battles using characters and techniques from Naruto and Boruto. GCX should describe it as the multiplayer experiment in the Naruto PS4 lineup, important because its live-service structure and DLC support make it very different from Ultimate Ninja Storm.",
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
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    rows.push([
      "ps4",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on official publisher, platform, or store pages.",
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
