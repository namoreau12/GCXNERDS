const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-jewels-pachislot-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ds-jewels-of-the-ages",
    sourceUrl: "https://www.nintendo-difference.com/news/city-interactive-annonce-jewels-of-the-ages-sur-ds/",
    overview:
      "Jewels of the Ages is City Interactive's DS match-three follow-up to Jewels of the Tropical Lost Island, shifting the treasure-hunt framing toward ancient Greece and Egypt. The game is built around clearing boards by matching gems and working through a large set of short puzzle stages rather than a character-driven adventure. GCX should present it as a late DS casual puzzle release for match-three collectors, with its historical theme and level count as the real hooks.",
  },
  {
    id: "ds-jewels-of-the-tropical-lost-island",
    sourceUrl: "https://www.nintendolife.com/reviews/2011/02/jewels_of_the_tropical_lost_island_ds",
    overview:
      "Jewels of the Tropical Lost Island is a City Interactive match-three puzzle game about swapping adjacent tiles to clear objectives across a pirate-island treasure hunt. The DS layout uses the touch screen for tile movement while the upper screen tracks goals, points, and progress. GCX should describe it as a structured casual puzzle campaign with bonuses, timed objectives, and duel-style stages instead of a vague island adventure.",
  },
  {
    id: "ds-jig-a-pix-love-is",
    sourceUrl: "https://gamesdb.launchbox-app.com/developers/games/2938-frame-studios-interactive",
    overview:
      "Jig-a-Pix Love Is... is part of Frame Studios Interactive's JIGAPIX jigsaw-puzzle line for Nintendo DS and DSi. This entry uses romantic Love Is... style imagery as the puzzle theme, giving players a set of picture puzzles rather than pet care, world travel, or story exploration. GCX should classify it as a themed jigsaw release, useful for collectors tracking the short-lived Jig-a-Pix retail series.",
  },
  {
    id: "ds-jig-a-pix-pets",
    sourceUrl: "https://www.amazon.com/Jigapix-Pets-Nintendo-DS/dp/B0031L96G4",
    overview:
      "Jig-a-Pix Pets is a DS jigsaw-puzzle package built around animal photographs and pet-themed images. Players solve dozens of puzzles, with unlocked images, time-challenge goals, and difficulty options providing the structure. GCX should make clear that it is not a pet simulator; it is a casual picture-puzzle release from Frame Studios Interactive and Destineer/Zushi's Jig-a-Pix line.",
  },
  {
    id: "ds-jig-a-pix-wild-world",
    sourceUrl: "https://www.vgchartz.com/game/40660/jig-a-pix-wild-world/",
    overview:
      "Jig-a-Pix Wild World applies the Jig-a-Pix jigsaw formula to wildlife photography, with images of apes, big cats, reptiles, birds, insects, sea life, and other animals. The play loop is selecting a picture, solving it as a jigsaw puzzle, and chasing cleaner completion times or harder layouts. GCX should describe it as a wildlife-themed puzzle cartridge, not an adventure game despite the travel-like title.",
  },
  {
    id: "ds-jig-a-pix-wonderful-world",
    sourceUrl: "https://www.amazon.com/Jigapix-Wonderful-World-Nintendo-DS/dp/B0031L1UTU",
    overview:
      "Jig-a-Pix Wonderful World is the travel-and-landmark entry in the Frame Studios jigsaw series, using famous locations and scenic images as puzzle material. DSi camera support lets players turn their own photos into puzzles, which gives this version a stronger hardware-specific angle than the simpler themed packs. GCX should foreground the world-landmark theme and photo-to-puzzle feature for collector clarity.",
  },
  {
    id: "ds-jigsaw-puzzle-ds-ds-de-meguru-sekai-isan-no-tabi",
    sourceUrl: "https://downloads.khinsider.com/game-soundtracks/album/jigsaw-puzzle-ds-ds-de-meguru-sekai-isan-no-tabi-ds-gamerip-2008",
    overview:
      "Jigsaw Puzzle DS: DS de Meguru Sekai Isan no Tabi is a Hudson Soft Japanese puzzle release whose title translates around a DS trip through world heritage sites. It belongs to Hudson's broader DS puzzle catalog and focuses on assembling landmark-themed jigsaw images rather than action or simulation. GCX should identify it as a Japan-only world-heritage jigsaw game, with Hudson's publisher/developer credit as the key catalog marker.",
  },
  {
    id: "ds-jigsaw-world-daigekitou-jig-battle-heroes",
    sourceUrl: "https://www.siliconera.com/putting-the-pieces-of-jigsaw-world-daigekitou-jig-battle-heroes-together/",
    overview:
      "Jigsaw World: Daigekitou! Jig-Battle Heroes is Nippon Ichi Software's original DS jigsaw battler, turning puzzle assembly into a competitive character game. Players choose anime-styled heroes, grab loose pieces, place them on the board, and use special attacks to disrupt rivals. GCX should present it as a versus jigsaw oddity from Nippon Ichi, closer to an arcade puzzle battle than a normal static jigsaw collection.",
  },
  {
    id: "ds-jinsei-game",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/132402-jinsei-game",
    overview:
      "Jinsei Game is Takara Tomy's 2009 DS adaptation of the long-running Japanese version of The Game of Life. It is an electronic board game for up to four players, built around spinning through life events, career choices, money swings, and family-friendly board-game pacing. GCX should distinguish this later Takara Tomy entry from the earlier Atlus-developed Jinsei Game DS release.",
  },
  {
    id: "ds-jinsei-game-ds",
    sourceUrl: "https://kotaku.com/games/jinsei-game-ds",
    overview:
      "Jinsei Game DS is the earlier Nintendo DS adaptation of Japan's The Game of Life board-game series, developed/published through Atlus and Takara Tomy in 2006. Like the tabletop original, it turns school, jobs, money, marriage, and chance events into a roulette-driven digital board game. GCX should label it as the first DS Jinsei/Game of Life release and avoid merging it with the separate 2009 Takara Tomy title.",
  },
  {
    id: "ds-jinsei-game-q-ds-heisei-no-dekigoto",
    sourceUrl: "https://kotaku.com/games/jinsei-game-q-ds-heisei-no-dekigoto",
    overview:
      "Jinsei Game Q DS: Heisei no Dekigoto is a Takara Tomy DS spin on The Game of Life formula that filters play through quiz material tied to events from Japan's Heisei era. Rather than simply recreating the standard board game, it uses period knowledge and question prompts as the defining twist. GCX should frame it as a Japan-only quiz-board entry for collectors who need the DS Jinsei subseries separated by theme.",
  },
  {
    id: "ds-jinsei-game-q-ds-shouwa-no-dekigoto",
    sourceUrl: "https://downloads.khinsider.com/game-soundtracks/album/jinsei-game-q-ds-shouwa-no-dekigoto-ds-gamerip-2007",
    overview:
      "Jinsei Game Q DS: Shouwa no Dekigoto is the companion quiz-board release focused on events from Japan's Showa era. It keeps the Jinsei/Game of Life branding but shifts the appeal toward trivia, nostalgia, and period-specific prompts instead of only roulette-and-money board movement. GCX should describe it alongside the Heisei version as a themed Takara Tomy quiz variant from 2007.",
  },
  {
    id: "ds-jissen-pachi-slot-hisshoho-ds-hokuto-no-ken",
    sourceUrl: "https://fr.wikipedia.org/wiki/Liste_de_jeux_vid%C3%A9o_Ken_le_Survivant",
    overview:
      "Jissen Pachi-Slot Hisshoho! DS: Hokuto no Ken is a Sammy/Sega handheld pachi-slot adaptation using the Fist of the North Star license. The game is about simulating the parlor machine, complete with slot-style play and franchise imagery, rather than beat-'em-up combat or manga story progression. GCX should classify it as a Japan-only gambling-machine simulation and make the Hokuto no Ken branding context clear.",
  },
  {
    id: "ds-jissen-pachi-slot-hisshouhou-ds-aladdin-ii-evolution",
    sourceUrl: "https://segaretro.org/Jissen_Pachi-Slot_Hisshouhou%21_Aladdin_2_Evolution_DS",
    overview:
      "Jissen Pachi-Slot Hisshouhou! DS: Aladdin II Evolution is Sega/Sammy's DS simulation of the Aladdin II Evolution pachi-slot machine. Its value is in reproducing cabinet behavior, reels, odds practice, and parlor presentation for Japanese players rather than offering a conventional casino minigame collection. GCX should present it as a machine-specific pachislot training/simulation release.",
  },
  {
    id: "ds-jissen-pachi-slot-hisshouhou-ds-pachi-slot-hokuto-no-ken-se",
    sourceUrl: "https://segaretro.org/Jissen_Pachi-Slot_Hisshouhou%21_Hokuto_no_Ken_SE_DS",
    overview:
      "Jissen Pachi-Slot Hisshouhou! DS: Pachi-Slot Hokuto no Ken SE is the later DS simulation tied to the Special Edition version of Sammy's Hokuto no Ken pachi-slot machine. It again centers on slot-machine practice and Fist of the North Star presentation rather than action gameplay. GCX should separate it from the earlier Hokuto no Ken DS pachislot entry because the SE machine identity is the key collector distinction.",
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
      "Priority DS weak-template cleanup; original GCX editorial overview based on platform database, publisher, specialist database, store, and series sources.",
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
