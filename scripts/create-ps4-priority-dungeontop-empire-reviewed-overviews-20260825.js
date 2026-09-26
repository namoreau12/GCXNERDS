const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-dungeontop-empire-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-dungeontop",
    overview:
      "DungeonTop is a roguelike deck-building game that plays out battles on a small tactical board rather than only through card selection. Players build a hero deck, summon units, position them, and adapt to dungeon encounters where placement can matter as much as the cards drawn. Its appeal is the mix of Slay-the-Spire-style route pressure, tabletop-like board control, and fantasy classes that encourage repeated runs with different strategies.",
  },
  {
    id: "ps4-dungreed",
    overview:
      "Dungreed is a fast side-scrolling roguelite about diving into a monster-filled dungeon, collecting weapons, rescuing townspeople, and rebuilding a ruined village between attempts. Combat is snappy and arcade-minded, with melee weapons, guns, food buffs, bosses, and randomized rooms pushing each run in a different direction. It is a strong fit for players who want action-platforming, loot variety, and permanent progression without a huge learning wall.",
  },
  {
    id: "ps4-dusk-diver",
    overview:
      "Dusk Diver is an action RPG set around Taipei's Ximending district, blending real-world city exploration with supernatural brawls in another dimension. Players control Yumo and fight alongside guardian partners, chaining melee attacks, assists, and special moves through flashy arena encounters. Its hook is the combination of Taiwanese street atmosphere, anime-style character energy, and approachable beat-'em-up RPG progression.",
  },
  {
    id: "ps4-dustoff-heli-rescue-2",
    overview:
      "Dustoff Heli Rescue 2 is a helicopter rescue action game with voxel-style visuals and short objective-driven missions. Players pilot through hostile territory, pick up stranded soldiers, dodge fire, transport cargo, and upgrade helicopters while trying not to crash into terrain. The fun is in the light physics and mission juggling: every pickup, landing, and escape route asks for steady control rather than brute force.",
  },
  {
    id: "ps4-dustoff-z",
    overview:
      "Dustoff Z turns the helicopter rescue formula toward zombie survival, sending players into side-scrolling missions full of undead crowds, survivors, weapons, and improvised aircraft upgrades. The core loop is still about careful flying, pickups, and delivery objectives, but the tone is pulpier and more chaotic. It works as a quick-session arcade action game for players who like rescue missions with explosions, goofy vehicles, and constant pressure from below.",
  },
  {
    id: "ps4-dynasty-warriors-godseekers",
    overview:
      "Dynasty Warriors: Godseekers reworks Koei Tecmo's Three Kingdoms cast into a tactical RPG instead of the usual large-scale action format. Battles unfold on grids, with officers using area attacks, positioning, bonds, and special skills to overpower enemy forces. The result is aimed at players who like Dynasty Warriors characters and melodrama, but want slower strategic planning, party setups, and mission-by-mission advancement instead of one-against-armies combat.",
  },
  {
    id: "ps4-earth-defense-force-6",
    overview:
      "Earth Defense Force 6 continues the series' oversized bug-war spectacle, sending soldiers, rangers, wing divers, air raiders, and fencers into battles against swarms of alien creatures and colossal enemies. Missions are loud, messy, and cooperative-friendly, with unlockable weapons giving the campaign its long grind. The PS4 version keeps EDF's appeal intact: absurd scale, destructible city chaos, and the joy of surviving impossible odds with ridiculous firepower.",
  },
  {
    id: "ps4-earth-defense-force-world-brothers",
    overview:
      "Earth Defense Force: World Brothers rebuilds EDF as a voxel-style spin-off with blocky worlds, lighter tone, and a squad-swapping structure. Players collect characters from across the franchise, switch between team members mid-mission, and fight giant insects and aliens across chunky versions of global locations. It is more playful and accessible than the mainline games while still leaning on EDF's core promise of huge enemies, wild weapons, and cooperative mayhem.",
  },
  {
    id: "ps4-earth-wars",
    overview:
      "Earth Wars is a side-scrolling action RPG about enhanced soldiers fighting alien invaders across ruined city battlefields. Players slash, shoot, dodge, collect materials, and craft better gear while developing a character through repeated missions. Its combat has a faster, arcade action feel than a traditional RPG, making it a good fit for players who enjoy mission grinding, weapon upgrades, and stylish 2D battles against waves of creatures.",
  },
  {
    id: "ps4-earthnight",
    overview:
      "EarthNight is a hand-painted runner-platformer about skydiving through a dragon apocalypse and battling across the backs of enormous flying beasts. Each run asks players to leap, dash, collect treasure, avoid hazards, and learn enemy patterns before confronting dragons directly. Its draw is momentum and style: it turns procedural running into a strange fantasy climb from space back toward Earth, with repeated attempts gradually sharpening routes and reactions.",
  },
  {
    id: "ps4-easy-dice-for-rpg-tabletop",
    overview:
      "Easy Dice for RPG/Tabletop is a utility-style release for rolling virtual dice during tabletop role-playing sessions. Rather than presenting a campaign or traditional game loop, it gives players a digital way to handle common RPG dice rolls on a PlayStation screen. Its usefulness depends on the setup: it is mainly for groups that want a simple console-based dice tool for local play, streaming, or casual tabletop sessions.",
  },
  {
    id: "ps4-ebaseball-powerful-pro-yakyuu-2020",
    overview:
      "eBaseball Powerful Pro Yakyuu 2020 is Konami's stylized Japanese baseball sim with chibi players, deep team modes, and the long-running Powerful Pro personality. It combines accessible pitching and batting with season play, player development, and series staples aimed at Nippon Professional Baseball fans. On PS4 it is especially valuable for players who want a Japanese baseball package with charm, depth, and a different flavor from MLB-licensed sims.",
  },
  {
    id: "ps4-ebaseball-powerful-pro-yakyuu-2022",
    overview:
      "eBaseball Powerful Pro Yakyuu 2022 updates Konami's cartoon-style baseball series with newer rosters, modes, and presentation for fans of Japanese professional baseball. The game balances approachable on-field controls with deeper management, character growth, and series-specific modes that give it long-term structure. It is best understood as a full-featured NPB baseball release, not a simple arcade novelty, with charm sitting on top of serious baseball systems.",
  },
  {
    id: "ps4-edge-of-eternity",
    overview:
      "Edge of Eternity is an independent fantasy RPG built around a large world, turn-based tactical battles, crafting, and a story about a civilization threatened by an alien-like corrosion. Combat uses grid positioning and ability choices, giving fights more structure than a standard menu exchange. Its ambition is the draw: it aims for a classic JRPG-scale adventure with exploration, party drama, side quests, and a sweeping soundtrack-driven sense of scope.",
  },
  {
    id: "ps4-effie",
    overview:
      "Effie is a colorful 3D action-adventure platformer about an older hero cursed with premature aging and sent across a fantasy land to undo it. Players use a magical shield for combat, traversal, surfing-like movement, and environmental challenges across open areas and dungeons. It has the feel of a throwback PS2-era adventure, emphasizing bright worlds, simple combat, collectible exploration, and a fairy-tale quest structure.",
  },
  {
    id: "ps4-efootball-pes-2021-season-update",
    overview:
      "eFootball PES 2021 Season Update is a roster-and-season refresh of Konami's soccer sim built on the PES 2020 foundation. The on-field appeal remains patient passing, first-touch control, tactical shape, and a more deliberate match rhythm than many arcade-leaning sports games. It is most relevant for players who wanted updated clubs, squads, and licenses at the end of PES's traditional era rather than a completely rebuilt sequel.",
  },
  {
    id: "ps4-efootball-pro-evolution-soccer-2020",
    overview:
      "eFootball Pro Evolution Soccer 2020 is Konami's football sim focused on weighty ball physics, tactical buildup, and player individuality. Matches reward timing, spacing, and reading defensive pressure, with modes built around clubs, online competition, and long-term squad play. On PS4 it represents one of the last major entries before the series shifted direction, making it important for players who prefer classic PES match flow.",
  },
  {
    id: "ps4-electronic-super-joy-2",
    overview:
      "Electronic Super Joy 2 is a hard-edged precision platformer built around wall jumps, air control, hazards, rhythm, and quick restarts. Levels are loud, abstract, and deliberately intense, asking players to survive spikes, missiles, moving platforms, and timing traps through repeated attempts. Its appeal is pure execution: short stages, bright electronic presentation, and the satisfaction of finally threading a route cleanly after several failures.",
  },
  {
    id: "ps4-elex-ii",
    overview:
      "ELEX II is an open-world action RPG from Piranha Bytes, returning to Magalan with jetpack traversal, faction politics, companions, and a blend of science fiction and fantasy. Players explore dangerous regions, make allegiance choices, improve combat skills, and deal with a new invading threat. Like the studio's earlier RPGs, its personality comes from rough-edged freedom, strange worldbuilding, and quests that let players wander into trouble before they are ready.",
  },
  {
    id: "ps4-embers-of-mirrim",
    overview:
      "Embers of Mirrim is a puzzle-platformer about a creature split into light and dark embers that can move separately through the environment. Players shift forms, guide both energies around hazards, and solve traversal puzzles that depend on timing and coordination. It stands out through its creature design and dual-control mechanic, making it a good fit for players who want an atmospheric platform adventure built around one clear central idea.",
  },
  {
    id: "ps4-empire-of-angels-iv",
    overview:
      "Empire of Angels IV is a tactical RPG with grid-based battles, class advancement, and an all-female fantasy cast drawn from Softstar's long-running strategy series. Players move units across maps, manage skills and positioning, and build teams through a campaign of compact encounters. It is a niche tactics release for PS4 owners who enjoy turn-based battle maps, character classes, and lighter anime-style presentation over massive strategy complexity.",
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
