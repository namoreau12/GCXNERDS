const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-hoppie-horseland-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-hoppie",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/103853-hoppie",
    overview:
      "Hoppie is a Nintendo DS puzzle-action game where the player restores dried-up land by hopping across stage blocks. LaunchBox describes the goal as bringing each land block back to its original state before the earth dries up, while retail copy points to 30 unique stages. Its appeal is simple and arcade-like: plan movement, touch every required space, and solve compact environmental layouts before the stage pressure catches up.",
  },
  {
    id: "ds-horrid-henry",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/82180-horrid-henry-missions-of-mischief",
    overview:
      "Horrid Henry, also released as Horrid Henry: Missions of Mischief, is an objective-based action-puzzle game from Asylum Entertainment and SouthPeak. Players control Henry across missions built around pranks, special skills, and avoiding being caught by other characters from the books and TV series. It is not a general adventure game; it is a licensed mischief platformer that turns Henry's rude, prank-heavy personality into short DS tasks.",
  },
  {
    id: "ds-horrid-henry-s-horrid-adventure",
    sourceUrl: "https://www.mobygames.com/game/149386/horrid-henrys-horrid-adventure/",
    overview:
      "Horrid Henry's Horrid Adventure is the second Horrid Henry DS release, built as a side-scrolling adventure around Henry recovering stolen toys and his Purple Hand Gang flag. Retail descriptions emphasize running, swimming, climbing, jumping, riding, and learning new abilities across themed worlds such as the Evil Empire, Lovely Land, and Pirate Island. MobyGames also notes unlockable self-defence items like goo, bubble, and balloon gadgets.",
  },
  {
    id: "ds-horse-and-foal-my-riding-stables",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/118462-horse-foal-my-riding-stables",
    overview:
      "Horse & Foal: My Riding Stables is a life-simulation game from Independent Arts and dtp young entertainment built around running a small riding stable. Players care for horses and foals, learn stable routines, and move toward riding lessons and competitions rather than playing a conventional sports season. It fits the DS horse-care niche: daily attention, training, grooming, and steady progression through equestrian activities are the core loop.",
  },
  {
    id: "ds-horse-life",
    sourceUrl: "https://www.nintendoworldreport.com/preview/14702/horse-life-nintendo-ds",
    overview:
      "Horse Life is a Neko Entertainment horse-care simulation that mixes virtual-pet routines with DS touch-screen interactions. Nintendo World Report previewed it as a game about raising a first horse: feeding, petting, brushing, training, buying accessories, and using tapping or tracing inputs. The experience is aimed at players who want a handheld equestrian companion, where keeping the horse healthy and trained matters more than high-speed racing.",
  },
  {
    id: "ds-horse-life-3",
    sourceUrl: "https://horsegamedatabase.miraheze.org/wiki/Horse_Life_3",
    overview:
      "Horse Life 3 continues the DS horse-care series with a stronger focus on stable management, riding practice, and cross-country-style horse activities. The Horse Game Database lists it as a Nintendo DS horse-care and cross-country game, making it closer to a structured equestrian sim than a generic management title. Its audience is players who enjoy raising, training, grooming, and competing with horses through slow routine-based progression.",
  },
  {
    id: "ds-horse-life-adventures",
    sourceUrl: "https://www.vgchartz.com/game/36878/horse-life-adventures/",
    overview:
      "Horse Life Adventures is a Neko Entertainment and Yullaby simulation release that extends the Horse Life formula into a more customizable horse-care package. Listings describe designing a horse across multiple breeds and visual options, then feeding, grooming, training, and keeping it happy before riding and competing. It is best understood as a care-and-competition horse sim, with ownership fantasy and daily routine doing more work than story or action.",
  },
  {
    id: "ds-horseland",
    sourceUrl: "https://horsegamedatabase.miraheze.org/wiki/Horseland_(DS)",
    overview:
      "Horseland is a Nintendo DS horse-care and competition game based on the animated Horseland series. The Horse Game Database describes training in racing, cross-country, show jumping, and dressage, along with stable care that improves the player's chances in events. That makes it a licensed equestrian sim rather than a visual novel: players care for horses, practice disciplines, and compete inside the show's friendship-focused riding-school world.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on catalog, specialist database, preview, review, and retail gameplay sources.",
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
