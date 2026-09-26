const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-dragon-ilovebabies-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-how-to-train-your-dragon",
    sourceUrl: "https://www.nintendoworldreport.com/review/23089/how-to-train-your-dragon-nintendo-ds",
    overview:
      "How to Train Your Dragon on DS is not a straight pet-care sim; it is a handheld dragon-battling RPG built around raising and customizing dragons after the film. Players train a small stable of dragons, improve their stats, and send them into turn-based battles, with side minigames and short-session structure around the main progression. Reviews noted that the battle concept is fun but limited, so the appeal is mostly for younger fans who want a simpler portable take on dragon training.",
  },
  {
    id: "ds-hudson-x-greeeen-live-deeees",
    sourceUrl: "https://www.play-asia.com/en/hudson-x-greeeen-live-deeees/13/703pg2",
    overview:
      "Hudson x GReeeeN Live!? DeeeeS!? is a Japan-only rhythm game built around the music of GReeeeN, a pop group known for keeping its members' real faces out of public promotion. Retail descriptions highlight songs such as Kiseki, Ai no Uta, Tobira, and Setsuna, with silhouetted performers created through motion-capture technology. The play fantasy is performing with the band: clear rhythm sequences, unlock live-stage material, and treat the DS cartridge as a fan-focused music package.",
  },
  {
    id: "ds-hugo-den-forsvundne-kaempe",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Hugo_video_games",
    overview:
      "Hugo: Den forsvundne Kaempe is the Danish DS release of Hugo Troldeakademiet: Den Forsvundne Kaempe, a platform game in Krea Medie's rebooted Hugo line. It follows the alternative apprentice-sorcerer version of Hugo introduced by Magic in the Troll Woods rather than the older TV-game incarnation. For players, that means a family-focused side-scrolling adventure built around exploring stages, avoiding hazards, and continuing the Troldeakademiet story.",
  },
  {
    id: "ds-hugo-magic-in-the-troll-woods",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Hugo_video_games",
    overview:
      "Hugo: Magic In The Troll Woods is a reboot-era Hugo platformer starring a different version of the character: an apprentice sorcerer in a fantasy world. Released across DS, Wii, PS2, and PC, it trades the older Hugo chase-show format for side-scrolling movement, spell-flavored obstacles, and a more conventional children's adventure structure. Its DS entry is best understood as a regional family platformer rather than a mascot racing or puzzle game.",
  },
  {
    id: "ds-hugo-trollakademin-2-jakten-pa-kristallkartan",
    sourceUrl: "https://archive.org/details/nintendo-ds-longplay-hugo-trollakademin-2-jakten-pa-kristallkartan-eu-swe",
    overview:
      "Hugo: Trollakademin 2 - Jakten pa Kristallkartan is the Swedish/Norwegian localization of Hugo Troldeakademiet: Kampen om Krystalkortet. The Internet Archive longplay notes it is a translated release rather than a separate sequel, placing it in Krea Medie's regional Hugo reboot series. Gameplay follows the same family platform-adventure lane: guide Hugo through themed stages, deal with hazards, and push through a compact story built for younger DS players.",
  },
  {
    id: "ds-hurry-up-hedgehog",
    sourceUrl: "https://www.cubed3.com/games/reviews/nintendo-ds/hurry-up-hedgehog",
    overview:
      "Hurry Up Hedgehog! adapts Reiner Knizia's board game Egelrace for Nintendo DS. Players move hedgehogs across lanes filled with pits, trying to get three of four hedgehogs to the far side before rival teams do the same. Reviews describe it as a board-game adaptation with strategic thinking, rule variants, and stronger value in multiplayer, so the DS version is best framed as a compact abstract strategy game rather than a character-driven puzzle adventure.",
  },
  {
    id: "ds-i-heart-geeks",
    sourceUrl: "https://www.nintendoworldreport.com/review/29013/i-heart-geeks-nintendo-ds",
    overview:
      "I Heart Geeks! is a Rube Goldberg-style puzzle game where each mission asks players to place odd objects and trigger a chain reaction that completes a specific goal. Reviews compared its structure to The Incredible Machine and Crazy Machines: the fun is in experimenting with springs, engines, balloons, and other gadgets until the setup works. It is not a strategy campaign; it is a mission-based contraption puzzler with a light nerd-comedy wrapper.",
  },
  {
    id: "ds-i-love-babies",
    sourceUrl: "https://www.amazon.com/I-Love-Babies-Nintendo-DS/dp/B004K66O6Y",
    overview:
      "I Love Babies is a DS baby-care simulation aimed at the casual life-sim audience. Retail copy frames the routine around changing diapers, bathing, feeding, shopping, playing, and keeping a virtual baby comfortable. The core appeal is caregiving repetition and simple stylus interaction rather than strategy or adventure: players manage small daily needs, buy supplies, and treat the DS like a nursery-themed virtual-pet toy.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on review, retail, database, longplay, and specialist gameplay sources.",
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
