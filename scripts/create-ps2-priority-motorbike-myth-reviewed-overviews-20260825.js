const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const platformSlug = "ps2";
const dataPath = path.join(rootDir, "data", "games", `${platformSlug}.json`);
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-motorbike-myth-reviewed-overviews-2026-08-25.csv"
);

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function currentOverviewFor(game) {
  return game.description || game.gcxOverview || game.overview || "";
}

const reviewed = {
  "ps2-motorbike-king": {
    sourceUrl: "https://lunaticobscurity.blogspot.com/2019/05/motorbike-king-ps2.html",
    rewriteNotes: "Source cross-check: PS2 list metadata plus gameplay write-up describing nighttime one-on-one road races and trick prompts.",
    newOverview:
      "Motorbike King is a budget motorcycle racer with a strange arcade personality: most of the action is built around nighttime one-on-one street races, quick memorization of road layouts, and show-off trick prompts that ask the rider to perform stunts while still keeping speed. It is not a sober simulation so much as a quirky D3/Tamsoft racing oddity, useful for collectors who like Simple-series experiments and low-profile PAL/Japanese PS2 releases."
  },
  "ps2-motorsiege-warriors-of-primetime": {
    sourceUrl: "https://www.game.es/motorsiege-warriors-of-prime-time-play-it-playstation-2--060278",
    rewriteNotes: "Source cross-check: retailer/game page describes Arcade and Career modes, vehicle upgrades, weapons, respect points, bosses, and multiple combat modes.",
    newOverview:
      "Motorsiege: Warriors of Primetime is vehicular combat rather than pure strategy, putting players into armed machines that earn money and respect through Arcade and Career play. Its hook is the garage loop: improve armor, weapons, and speed, then survive modes built around deathmatch-style fighting, pursuit, siege, and boss progression. For PS2 collectors, it sits in the same budget-PAL space as other rough but distinctive car-combat releases."
  },
  "ps2-motto-golful-golf": {
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-20183.html",
    rewriteNotes: "Source cross-check: PSX Data Center description identifies Artdink golf presentation, manicured courses, and a nonstandard swing/control scheme.",
    newOverview:
      "Motto Golful Golf is Artdink's follow-up golf release for PS2, focused on clean course presentation and a swing system that tries to feel different from the standard three-click golf template. The appeal is measured and technical: read the lie, judge the fairway and green, and learn how the control scheme translates timing into shot shape. It is a niche sports entry, but more specific than a generic golf listing because Artdink's interface is the point."
  },
  "ps2-moujutsukai-to-oujisama": {
    sourceUrl: "https://zettairenai.wordpress.com/2019/03/22/ps-vita-moujuutsukai-to-ouji-sama-flower-snow-review/",
    rewriteNotes: "Source cross-check: later Flower & Snow coverage summarizes the original story setup, otome structure, animal-tamer heroine, and medieval fantasy tone.",
    newOverview:
      "Moujuutsukai to Oujisama is an Otomate/Idea Factory otome visual novel about Tiana, an aspiring animal tamer who becomes tied to a group of mysterious animals that are not as ordinary as they first appear. The PS2 release is built around romantic routes, character chemistry, fantasy-court atmosphere, and choice-driven story progression rather than action mechanics. Its collector value comes from being a late PS2 Japanese otome title from a series that later received portable compilations."
  },
  "ps2-moujutsukai-to-oujisama-snow-bride": {
    sourceUrl: "https://breadmasterlee.com/2011/03/05/otome-game-review-moujuutsukai-to-oujisama-snow-bride/",
    rewriteNotes: "Source cross-check: otome review details the fan-disc structure, another-story section, after-story routes, and character-focused extras.",
    newOverview:
      "Moujuutsukai to Oujisama: Snow Bride is a fan-disc style continuation aimed at players who already know the original routes. Rather than restarting the premise, it adds extra character scenarios, alternate story material, and after-story episodes that deepen the romance side of Tiana's relationships. On PS2, it is best treated as companion content: lighter on onboarding, heavier on fan service, and most meaningful as part of the complete Beastmaster and Prince set."
  },
  "ps2-mouse-trophy": {
    sourceUrl: "https://downloads.khinsider.com/game-soundtracks/album/mouse-trophy-ps2-windows-gamerip-2004",
    rewriteNotes: "Source cross-check: game listing describes the rodent-breeder premise, maze survival objective, independent rodents, door/labyrinth manipulation, and direct gadget interactions.",
    newOverview:
      "Mouse Trophy is an odd puzzle-simulation game about guiding rodents through maze-like challenges at the Rodent Breeder World Championship. The player does not simply steer a character from start to finish; the rodents move on their own, while the player changes the maze, opens routes, grabs animals, and uses gadgets to influence their path. That gives it a strange lemmings-like management feel, making it more interesting as a European PS2 curiosity than its plain title suggests."
  },
  "ps2-mr-bean": {
    sourceUrl: "https://www.wired.com/2007/04/mr-bean-yuks-it",
    rewriteNotes: "Source cross-check: announcement describes a 3D PS2 children's game built around traps, puzzles, and finding Teddy, with Irma Gobb support.",
    newOverview:
      "Mr. Bean turns the animated-series version of Rowan Atkinson's character into a simple 3D children's adventure about recovering Teddy. The play pattern is light exploration, trap avoidance, puzzle solving, and collecting through broad comic environments rather than precision platforming. It is a licensed PAL-era PS2 release aimed at younger players, so its appeal today is less about depth and more about the oddity of seeing Mr. Bean translated into a budget console adventure."
  },
  "ps2-mr-golf": {
    sourceUrl: "https://gz1.vercel.app/en/games/57050",
    rewriteNotes: "Source cross-check: database entry identifies Mr. Golf as an Artdink PS2 golf game and the first Golful Golf series entry.",
    newOverview:
      "Mr. Golf is Artdink's earlier PS2 golf release and effectively the starting point for the Golful Golf line. It is a focused course-and-swing sports game rather than a licensed tour product, so the experience depends on shot timing, club selection, and how comfortably the interface communicates distance and terrain. For collectors, it is a compact example of Artdink's experimental sports catalog and pairs naturally with Motto Golful Golf."
  },
  "ps2-ms-saga-a-new-dawn": {
    sourceUrl: "https://en.wikipedia.org/wiki/MS_Saga:_A_New_Dawn",
    rewriteNotes: "Source cross-check: article details Gundam RPG setup, turn-based combat, AP/boost management, pilot party, and mobile suit part customization.",
    newOverview:
      "MS Saga: A New Dawn is a Gundam RPG that treats mobile suits like customizable party members in a traditional turn-based adventure. Battles use AP and boost management, while the workshop layer lets players swap armor, weapons, shields, colors, and parts from multiple Gundam timelines to build strange hybrid machines. That mix makes it approachable even outside hardcore Gundam fandom: the story is original, but the real draw is tuning mobile suits between dungeon runs and boss fights."
  },
  "ps2-mtv-s-celebrity-deathmatch": {
    sourceUrl: "https://en.wikipedia.org/wiki/Celebrity_Deathmatch_(video_game)",
    rewriteNotes: "Source cross-check: article covers Big Ape/Gotham credits, wrestling structure, roster, MTV meter, weapons, power-ups, and finishing moves.",
    newOverview:
      "MTV's Celebrity Deathmatch adapts the claymation show's shock-comedy wrestling into a crude arena fighter where caricatured celebrities trade hits until a finishing window opens. Matches revolve around draining the opponent, building the MTV meter with taunts, grabbing weapons and power-ups, and triggering special moves once momentum is high enough. It is rough as a fighting game, but as a collector piece it captures a very specific early-2000s MTV license."
  },
  "ps2-mundial-2002-challenge": {
    sourceUrl: "https://psxdatacenter.com/games/P/M/SLES-03870.html",
    rewriteNotes: "Source cross-check: PSX Data Center describes 204 national teams and modes including exhibition, training, league, play-offs, World Cup qualification, and World Cup.",
    newOverview:
      "Mundial 2002 Challenge is a soccer release built around international-team breadth rather than club licensing spectacle, with a large roster of national sides and modes for exhibition play, training, leagues, play-offs, qualification, and World Cup-style runs. The game is most useful to collectors as a regional football oddity tied to the 2002 World Cup moment, especially because its EcoFilmes/EcoPlay publishing path makes it stand apart from the more obvious EA entries."
  },
  "ps2-murasaki-no-honoo": {
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-55053.html",
    rewriteNotes: "Source cross-check: PSX Data Center details visual-novel premise, heir returning to Takatsukasa Heavy Industries, route choices, multiple endings, and tarot-divination feature.",
    newOverview:
      "Murasaki no Honoo is an Idea Factory visual novel about a young heir called back from studying in the United Kingdom to take control of Takatsukasa Heavy Industries. Like many late PS2 adventure novels, its play centers on reading, character encounters, and choices that branch toward different endings, but it also adds a tarot-divination wrinkle under certain conditions. The result is a niche Japanese story game with corporate-inheritance drama, romance/anime presentation, and collector interest as a late-platform release."
  },
  "ps2-my-home-o-tsukurou": {
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-20177.html",
    rewriteNotes: "Source cross-check: PSX Data Center describes home-building simulation, room layouts on a grid, bath/front-yard/floor design choices, and build-from-scratch modes.",
    newOverview:
      "My Home o Tsukurou! is a home-design simulation built around planning and decorating a house rather than winning combat or races. Players lay out rooms on a grid, choose fixtures and exterior details, adjust floors and baths, and work through modes that let them design from the building site upward. It is a very Japanese PS2 lifestyle sim, valuable for collectors who like software that documents everyday design fantasies as much as traditional game genres."
  },
  "ps2-my-merry-may": {
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/391518-my-merry-may",
    rewriteNotes: "Source cross-check: LaunchBox/GOG summaries describe Kyosuke/Yasusuke's dorm life, the arrival of artificial life form Reu/Leu, and visual-novel structure.",
    newOverview:
      "My Merry May is a KID visual novel about an ordinary dorm student whose life changes when a device from abroad creates Reu, an artificial girl whose incomplete awakening leaves her childlike and dependent. The PS2 version is a reading-heavy romance drama, with the emotional focus on responsibility, companionship, and the uneasy boundary between artificial life and human feeling. It belongs beside KID's other character-driven console visual novels rather than action or dating-sim minigame releases."
  },
  "ps2-myth-makers-super-kart-gp": {
    sourceUrl: "https://www.honestgamers.com/45463/playstation-2/myth-makers-super-kart-gp/game.html",
    rewriteNotes: "Source cross-check: HonestGamers confirms PS2 racing tag, Data Design Interactive credit, and Phoenix Game Studios EU release; additional public summaries describe the Myth Makers kart-racing setup.",
    newOverview:
      "Myth Makers: Super Kart GP is a budget kart racer from Data Design Interactive's Myth Makers line, using costumed fantasy characters, simple courses, and pick-up driven racing as its main pitch. It is closer to a low-cost mascot-racer imitation than a polished genre leader, but that is exactly why it matters in a PS2 library: it represents the wave of late PAL budget software that filled shelves after the system's blockbuster years."
  }
};

function main() {
  const games = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const rows = Object.entries(reviewed).map(([gameId, review]) => {
    const game = games.find((item) => item.id === gameId);
    if (!game) throw new Error(`Missing game ${gameId}`);
    return {
      platformSlug,
      gameId,
      title: game.title || game.name || "",
      currentOverview: currentOverviewFor(game),
      sourceUrl: review.sourceUrl,
      rewriteNotes: review.rewriteNotes,
      newOverview: review.newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX Editorial"
    };
  });

  const headers = [
    "platformSlug",
    "gameId",
    "title",
    "currentOverview",
    "sourceUrl",
    "rewriteNotes",
    "newOverview",
    "reviewStatus",
    "reviewer"
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );

  console.log(JSON.stringify({ outputPath, rowCount: rows.length }, null, 2));
}

main();
