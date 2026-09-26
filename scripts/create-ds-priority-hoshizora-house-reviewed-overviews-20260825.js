const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-hoshizora-house-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-hoshizora-no-comic-garden",
    sourceUrl: "https://www.nintendolife.com/games/ds/hoshizora_no_comic_garden",
    overview:
      "Hoshizora no Comic Garden is a Japan-only DS visual novel about Airi, a university student trying to become a manga artist. The story follows her decision to work as an assistant to a famous creator, the pressure from parents who oppose that dream, and the relationships that form after she begins living with Ryou's circle of friends. Its appeal is character-route drama and manga-industry wish fulfillment rather than puzzle solving or action.",
  },
  {
    id: "ds-hospital-giant",
    sourceUrl: "https://www.esrb.org/ratings/28973/hospital-giant/",
    overview:
      "Hospital Giant is a DS hospital-themed strategy and procedure game where players handle a string of colorful medical tasks. ESRB describes activities such as X-rays, sewing stitches, treating wounds, assisting childbirth, using a scalpel, and applying a defibrillator. That makes it closer to a stylus-driven medical minigame collection than a pure hospital tycoon: the challenge comes from diagnosing problems and completing touch-screen procedures accurately.",
  },
  {
    id: "ds-hotel-deluxe",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(D%E2%80%93I)",
    overview:
      "Hotel Deluxe, also associated with the Real Stories: My Dream Hotel line, is a European DS hotel-management game aimed at the casual life-sim audience. Players work through a hospitality fantasy built around running and improving a dream hotel, with guest service and routine management replacing arcade action. It fits the DS's late-era catalog of job-and-lifestyle sims: light structure, approachable goals, and a focus on creating a successful hotel experience.",
  },
  {
    id: "ds-hotel-for-dogs",
    sourceUrl: "https://www.amazon.com/Hotel-Dogs-Nintendo-DS/dp/B001PCJG66",
    overview:
      "Hotel for Dogs is a DS tie-in to the 2009 DreamWorks film, focused on caring for rescued dogs inside an improvised hotel. Retail descriptions emphasize feeding, grooming, playing with pups, building contraptions, and completing ten levels of challenges. It is not a broad pet simulator like Nintendogs; it follows the movie's central idea by turning dog care, gadgets, and shelter upkeep into short handheld objectives.",
  },
  {
    id: "ds-hotel-transylvania",
    sourceUrl: "https://www.cubed3.com/games/reviews/nintendo-ds/hotel-transylvania-2",
    overview:
      "Hotel Transylvania is a WayForward-developed DS platformer based on Sony Pictures Animation's monster comedy. Rather than managing the hotel, players move through side-scrolling stages with light exploration, combat, and Metroidvania-style ability progression. Reviews noted that WayForward's platforming craft shows through the licensed structure, making it a more traditional action-platform game than the database's old strategy label suggested.",
  },
  {
    id: "ds-hottarake-no-shima-kanata-to-nijiiro-no-kagami",
    sourceUrl: "https://en.wikipedia.org/wiki/Oblivion_Island%3A_Haruka_and_the_Magic_Mirror",
    overview:
      "Hottarake no Shima: Kanata to Nijiiro no Kagami is a Japan-exclusive DS spin-off from the animated film Oblivion Island: Haruka and the Magic Mirror. Developed by Climax Entertainment and published by Bandai Namco, it sends players into the film's lost-and-found fantasy world from a different game-focused angle. The appeal is exploring a tie-in RPG/adventure built around the movie's whimsical island setting rather than replaying a standard action license.",
  },
  {
    id: "ds-houkago-shounen",
    sourceUrl: "https://www.siliconera.com/houkago-shonen-konami%E2%80%99s-after-school-adventure/",
    overview:
      "Houkago Shounen is a Konami DS adventure set in 1975, following a young elementary-school boy during the final month before his family moves away. Instead of fantasy combat, the game centers on spending time with friends, exploring childhood places like school, parks, candy shops, and a shrine, and making the remaining days feel memorable. Its tone is nostalgic and slice-of-life, making conversation, location choice, and small daily events the real progression.",
  },
  {
    id: "ds-house-m-d",
    sourceUrl: "https://www.amazon.com/House-M-D-Nintendo-DS/dp/B002MFVWMG",
    overview:
      "House M.D. adapts the TV medical drama into a DS diagnostic adventure from Legacy Interactive. Players work with Dr. House and the Princeton-Plainsboro team across five cases, collecting evidence, observing symptoms, and completing medical minigames to uncover each patient's condition. It is built around case-solving and deduction rather than free exploration, so its strength is letting fans step through the show's mystery-of-the-week rhythm on a handheld.",
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
    if (!game) throw new Error(`Missing DS game ${rewrite.id}`);
    rows.push([
      "ds",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority DS weak-template cleanup; original GCX editorial overview based on catalog, rating-board, review, specialist, and retail gameplay sources.",
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
