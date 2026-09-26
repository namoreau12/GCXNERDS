const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-quiz-pillars-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-it-s-quiz-time",
    overview:
      "It's Quiz Time is a party quiz game from Snap Finger Click built for groups, phone-based answering, and a large bank of trivia questions. Players compete across rounds that test general knowledge, speed, confidence, and how well they know each other. It is best as a couch or streaming-friendly party game, giving PS4 owners a modern quiz-show format without needing specialized controllers.",
  },
  {
    id: "ps4-japanese-rail-sim-journey-to-kyoto",
    overview:
      "Japanese Rail Sim: Journey to Kyoto is a train-driving simulation built around real video footage, careful speed control, and scenic routes through Kyoto-area rail lines. Players monitor signals, timing, braking, and station stops while the game emphasizes the feel of operating through real Japanese landscapes. It is a niche sim for players who enjoy railway detail, travel atmosphere, and measured operation over action.",
  },
  {
    id: "ps4-jay-and-silent-bob-mall-brawl",
    overview:
      "Jay and Silent Bob: Mall Brawl is an 8-bit-style beat 'em up that sends the View Askewniverse duo through mall corridors, security guards, and ridiculous brawls. Players punch, kick, dodge, and work through short side-scrolling stages inspired by old handheld and NES-era action games. It is mainly for fans of the characters and retro brawler design, with humor and nostalgia carrying the experience.",
  },
  {
    id: "ps4-jet-set-knights",
    overview:
      "Jet Set Knights is a retro action platformer about defending princesses from waves of monsters while jumping, fighting, collecting power-ups, and surviving arena-like stages. It mixes platform movement with tower-defense pressure, especially when enemies swarm from multiple angles. The game is best for players who like simple arcade loops, local co-op energy, and old-school fantasy challenge.",
  },
  {
    id: "ps4-jett-the-far-shore",
    overview:
      "Jett: The Far Shore is an atmospheric sci-fi adventure about scouting an oceanic planet from a fast low-flying craft while helping a people search for a future beyond their home world. Players skim over landscapes, scan wildlife, avoid threats, and follow a meditative story built around exploration instead of combat. It is a mood-forward game for players who enjoy worldbuilding, sound, and movement.",
  },
  {
    id: "ps4-jikkyou-powerful-pro-baseball-2016",
    overview:
      "Jikkyou Powerful Pro Baseball 2016 is Konami's stylized Japanese baseball sim with the series' familiar big-headed players, season modes, and deep team-building hooks. Players pitch, bat, field, and manage through approachable arcade-like presentation backed by long-running baseball systems. It is a strong fit for players who follow Japanese baseball games or want a lighter-looking sports title with surprising depth.",
  },
  {
    id: "ps4-jikkyou-powerful-pro-baseball-2018",
    overview:
      "Jikkyou Powerful Pro Baseball 2018 continues Konami's long-running Power Pros formula on PS4 with updated teams, modes, and the mix of accessible baseball action and detailed progression the series is known for. Players can jump into matches, build players, and work through season-style content. It is especially valuable for fans of Japanese baseball and sports games with personality beyond realism.",
  },
  {
    id: "ps4-jinki-resurrection",
    overview:
      "Jinki Resurrection is a Japanese visual novel tied to the Jinki mecha franchise, focusing on character drama, route-based storytelling, and illustrated sci-fi scenes rather than action combat. Players read through dialogue, make choices, and follow how the cast's relationships and conflicts unfold. It is aimed at visual-novel readers who want anime-style mecha drama in a text-led format.",
  },
  {
    id: "ps4-jisei-the-first-case-hd",
    overview:
      "Jisei: The First Case HD is a short mystery visual novel about a young man with unusual perception investigating a death in a coffee shop. Players question characters, inspect scenes, collect clues, and work toward the truth through dialogue-driven deduction. It is compact but focused, making it a good entry for players who enjoy bite-sized murder mysteries and supernatural-tinged detective stories.",
  },
  {
    id: "ps4-jotun-valhalla-edition",
    overview:
      "Jotun: Valhalla Edition is a hand-drawn action-adventure rooted in Norse mythology, following the warrior Thora as she seeks to impress the gods after an unworthy death. Players explore mythic realms, solve environmental puzzles, and fight massive jotun bosses with deliberate axe combat. Its strengths are scale, art, and atmosphere, especially for players who enjoy boss-focused adventures with a slower, weightier rhythm.",
  },
  {
    id: "ps4-joysound-dive-2",
    overview:
      "Joysound Dive 2 is a Japanese karaoke release built around singing along to Joysound's music service rather than playing a conventional rhythm campaign. Players use the PS4 as a karaoke machine, selecting tracks and performing with on-screen lyrics. Its appeal is practical and regional: it is for karaoke users who want a living-room singing setup, not players looking for score-heavy music-game mechanics.",
  },
  {
    id: "ps4-jumanji-the-video-game",
    overview:
      "Jumanji: The Video Game is a cooperative action-adventure based on the modern films, sending four characters through jungle-themed missions full of enemies, traps, and collectibles. Players use character abilities, fight in third-person, and work through objective-based levels with solo or multiplayer support. It is designed as accessible licensed action, best for younger players or families who know the movie version of Jumanji.",
  },
  {
    id: "ps4-jump-king",
    overview:
      "Jump King is a punishing vertical platformer about charging each jump, committing to the angle, and living with the fall when you miss. Players climb a tall world one leap at a time, with progress depending on patience, muscle memory, and learning each ledge. It is intentionally brutal and funny, made for players who enjoy precision frustration and the drama of nearly reaching the top.",
  },
  {
    id: "ps4-jump-stars",
    overview:
      "Jump Stars is a chaotic party platformer where contestants cooperate just enough to survive while competing for points across mini-game challenges. Players jump, shove, avoid hazards, and try to keep the group alive even when selfish play is tempting. It works best with local multiplayer, where the tension comes from everyone needing each other but still wanting to win.",
  },
  {
    id: "ps4-just-deal-with-it",
    overview:
      "Just Deal With It! is a PlayLink card and party game that lets players use phones to join poker, blackjack, hearts, rummy, and other social card tables. The game adds sabotage, team play, and quick interactions to familiar card rules. It is built for casual group play, giving PS4 owners a digital card-night setup rather than a serious casino simulation.",
  },
  {
    id: "ps4-just-die-already",
    overview:
      "Just Die Already is a slapstick sandbox from DoubleMoose about elderly troublemakers causing havoc, injuring themselves, and completing absurd objectives in a physics-driven city. Players explore, unlock tools, trigger chaos, and chase rude challenges with very little dignity. It is best understood as a crude comedy sandbox for fans of Goat Simulator-style experimentation and deliberately messy physics.",
  },
  {
    id: "ps4-kakuro",
    overview:
      "Kakuro is a digital version of the number puzzle that combines crossword-like grids with arithmetic sums. Players fill cells with digits while matching row and column totals without repeating numbers in each run. It is a clean logic release from Hamster, built for players who want quiet deduction, number constraints, and puzzle-book style play on PS4.",
  },
  {
    id: "ps4-kamen-rider-battride-war-genesis",
    overview:
      "Kamen Rider: Battride War Genesis is a Musou-style action game celebrating multiple eras of the tokusatsu hero series. Players control different Riders, tear through crowds of enemies, use signature forms and attacks, and relive crossover scenarios built for fans. It is most appealing as licensed spectacle, giving Kamen Rider followers a large roster and simple beat 'em up power fantasy.",
  },
  {
    id: "ps4-kamiko",
    overview:
      "Kamiko is a short top-down action game with pixel art, shrine maidens, and fast arcade pacing. Players choose one of three characters, clear rooms, open gates, and defeat bosses across compact stages designed for speed and replayability. It is simple but elegant, best for players who like old-school action adventures that can be finished quickly and replayed for cleaner times.",
  },
  {
    id: "ps4-kamiwaza-way-of-the-thief",
    overview:
      "Kamiwaza: Way of the Thief is a stealth action game from Acquire about a former thief returning to crime to help his sick daughter. Players sneak through Edo-period streets, steal valuables, avoid guards, and decide how bold or careful each job should be. It is a quirky revival of a cult PS2-era design, built for players who enjoy stealth systems with a distinctly Japanese historical flavor.",
  },
  {
    id: "ps4-karumaruka-circle",
    overview:
      "Karumaruka Circle is a Japanese school-life visual novel from Saga Planets, centered on a student group, romantic routes, and supernatural or secretive elements around the academy. Players read scenes, make choices, and follow heroine-specific story paths. It is aimed at visual-novel fans who want character-focused comedy and drama rather than puzzle solving or action.",
  },
  {
    id: "ps4-katana-kami-a-way-of-the-samurai-story",
    overview:
      "Katana Kami: A Way of the Samurai Story is an action RPG spinoff where players run a swordsmith business by day and dive into dangerous dungeons by night. Combat focuses on blades, stances, loot, and upgrading weapons while the story connects back to the Way of the Samurai universe. It is a niche but interesting mix of hack-and-slash dungeon runs and shop-driven progression.",
  },
  {
    id: "ps4-kaze-and-the-wild-masks",
    overview:
      "Kaze and the Wild Masks is a polished 2D platformer inspired by 16-bit mascot adventures, starring a rabbit hero who uses animal masks for special movement abilities. Players run, jump, glide, swim, and smash through colorful stages with bonus rooms and boss fights. It is a strong pick for players who miss Donkey Kong Country-style momentum, secrets, and bright handcrafted platforming.",
  },
  {
    id: "ps4-ken-follett-s-the-pillars-of-the-earth",
    overview:
      "Ken Follett's The Pillars of the Earth is a narrative adventure adaptation of the historical novel, following builders, nobles, clergy, and ordinary people around the construction of Kingsbridge Cathedral. Players make dialogue choices, explore scenes, and shape character moments across a slow-burn medieval drama. It is best for players who enjoy literary adaptations, political intrigue, and story-first adventure games.",
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
      rewrite.sourceUrl || game.descriptionSourceUrl || "",
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on available platform, genre, publisher, developer, and known game identity.",
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
