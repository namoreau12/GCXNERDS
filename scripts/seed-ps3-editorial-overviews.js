const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const ps3Path = path.join(rootDir, "data", "games", "ps3.json");
const manifestPath = path.join(rootDir, "data", "games", "ps3-manifest.json");

const seeds = {
  "ps3-the-last-of-us":
    "The Last of Us is a late-generation PS3 landmark, following Joel and Ellie across a collapsed America through stealth, scavenging, brutal encounters, and unusually intimate character storytelling. Naughty Dog's cinematic direction and restrained survival systems made it one of the console's defining exclusives.",
  "ps3-uncharted-drake-s-fortune":
    "Uncharted: Drake's Fortune introduced Nathan Drake through a pulpy treasure-hunting adventure built around climbing, cover shooting, banter, and cinematic set pieces. It laid the foundation for one of PlayStation 3's signature first-party series.",
  "ps3-uncharted-2-among-thieves":
    "Uncharted 2: Among Thieves sharpened the original's formula with better pacing, larger set pieces, stronger combat arenas, and a globe-trotting story that made PS3 action-adventure feel genuinely blockbuster. It remains one of the system's most important showcase games.",
  "ps3-uncharted-3-drake-s-deception":
    "Uncharted 3: Drake's Deception pushed Nathan Drake through desert ruins, burning buildings, ship graveyards, and more elaborate cinematic action. Its character focus and spectacle made it a major late-cycle PS3 exclusive.",
  "ps3-metal-gear-solid-4-guns-of-the-patriots":
    "Metal Gear Solid 4: Guns of the Patriots uses the PS3 to close Solid Snake's story with dense stealth systems, long cinematic sequences, battlefield infiltration, and decades of series mythology. It is one of the console's defining exclusive collector pieces.",
  "ps3-god-of-war-iii":
    "God of War III turns Kratos's war against Olympus into a huge PS3 spectacle, with massive bosses, chained-blade combat, puzzle rooms, and violent mythological set pieces. It showed how far Sony's action series could scale on HD hardware.",
  "ps3-god-of-war-ascension":
    "God of War: Ascension is a prequel that keeps the series focused on fast melee combat, mythological creatures, and elaborate environments while experimenting with multiplayer. For collectors, it marks the final original God of War release on PS3.",
  "ps3-demon-s-souls":
    "Demon's Souls is the cult action RPG that established the risk-heavy combat, looping worlds, corpse-run tension, and cryptic online systems that would define FromSoftware's later Souls games. Its PS3 identity makes it one of the platform's most important collector titles.",
  "ps3-littlebigplanet":
    "LittleBigPlanet turned platforming into a creative community tool, letting players run, jump, grab, decorate, and share stages starring Sackboy. Its physics-based levels and user-generated content helped define PlayStation 3's online personality.",
  "ps3-littlebigplanet-2":
    "LittleBigPlanet 2 expanded the first game's creation tools into a broader game-making kit, supporting more genres, logic, gadgets, and presentation styles. It became a playful showcase for community creativity on PS3.",
  "ps3-red-dead-redemption":
    "Red Dead Redemption brought Rockstar's open-world design to the dying American frontier, mixing horseback travel, gunfights, stranger missions, hunting, and a melancholy revenge story. Its setting and atmosphere made it one of the generation's standout multiplatform games.",
  "ps3-grand-theft-auto-v":
    "Grand Theft Auto V closes Rockstar's PS3 era with a massive Los Santos sandbox, three playable leads, heists, driving, shooting, satire, and online foundations that would last far beyond the console generation.",
  "ps3-grand-theft-auto-iv":
    "Grand Theft Auto IV rebuilt Liberty City as a denser, moodier open world centered on Niko Bellic's immigrant crime story. Its physics, performances, and city detail made it one of the early HD generation's biggest releases.",
  "ps3-bioshock":
    "BioShock sends players into Rapture, an underwater city whose collapsed utopia is explored through plasmid powers, environmental storytelling, moral choices, and first-person combat. Its art direction and narrative twists made it a major PS3-era release.",
  "ps3-bioshock-infinite":
    "BioShock Infinite moves the series to the floating city of Columbia, combining first-person shooting, Vigors, sky-line movement, and a reality-bending story around Booker and Elizabeth. It became one of the PS3 generation's most discussed narrative shooters.",
  "ps3-batman-arkham-asylum":
    "Batman: Arkham Asylum translated Batman into a focused action-adventure built around rhythmic combat, predator stealth, detective scanning, and a dense asylum map. It set the template for modern superhero games.",
  "ps3-batman-arkham-city":
    "Batman: Arkham City expands Arkham's combat and stealth into an open prison district filled with villains, side stories, traversal challenges, and gadgets. It is one of the PS3's strongest licensed action games.",
  "ps3-mass-effect-2":
    "Mass Effect 2 brings BioWare's sci-fi RPG to PS3 with squad loyalty missions, dialogue choices, third-person combat, and a suicide mission structure built around preparing a team for impossible odds.",
  "ps3-mass-effect-3":
    "Mass Effect 3 concludes Commander Shepard's war against the Reapers with larger battles, returning companions, co-op multiplayer, and choices that pay off across the trilogy's galactic conflict.",
  "ps3-the-elder-scrolls-v-skyrim":
    "The Elder Scrolls V: Skyrim gives PS3 players a vast northern fantasy world full of guilds, dragons, dungeons, crafting, and open-ended character building. Its freedom and modless console presence made it a generation-long staple.",
  "ps3-fallout-3":
    "Fallout 3 reimagines the post-apocalyptic RPG series as a first-person open-world wasteland, mixing exploration, V.A.T.S. combat, moral choices, and ruined Americana around Washington, D.C.",
  "ps3-fallout-new-vegas":
    "Fallout: New Vegas uses the Mojave as a faction-driven RPG playground, emphasizing branching quests, reputation, dialogue choices, and morally messy power struggles. It remains a favorite for players who value choice-heavy role-playing.",
  "ps3-dark-souls":
    "Dark Souls builds on Demon's Souls with an interconnected world, deliberate combat, punishing checkpoints, hidden lore, and boss fights that reward patience and observation. It became one of the defining action RPGs of the PS3 era.",
  "ps3-dark-souls-ii":
    "Dark Souls II follows the series into Drangleic with more builds, more areas, and a different take on decay, memory, and repeated struggle. Its scale and mechanical differences make it a distinct collector piece within the Souls lineage.",
  "ps3-ni-no-kuni-wrath-of-the-white-witch":
    "Ni no Kuni: Wrath of the White Witch pairs Level-5 role-playing systems with Studio Ghibli-style art direction, familiar collecting, and a storybook tone. Its visual charm and orchestral presentation made it one of PS3's standout JRPGs.",
  "ps3-heavy-rain":
    "Heavy Rain is an interactive thriller built around branching scenes, quick-time inputs, investigation, and multiple playable characters tied to the Origami Killer case. It became one of PS3's most visible experiments in cinematic choice-driven storytelling.",
  "ps3-beyond-two-souls":
    "Beyond: Two Souls follows Jodie Holmes and her supernatural connection to Aiden through a performance-driven interactive drama. Its non-linear structure and motion-captured presentation made it a notable late PS3 narrative release.",
  "ps3-killzone-2":
    "Killzone 2 is a gritty first-person shooter showcase for PS3, built around heavy weapon feel, hostile Helghan battlefields, cover use, and large-scale military encounters. It was one of Sony's major technical flexes for the platform.",
  "ps3-killzone-3":
    "Killzone 3 expands the war on Helghan with broader environments, jetpacks, vehicle sequences, Move support, and stereoscopic 3D options. It continued Sony's push for cinematic first-party shooters on PS3.",
  "ps3-resistance-fall-of-man":
    "Resistance: Fall of Man launched alongside PS3 with an alternate-history alien invasion, unusual weapons, and large campaign battles from Insomniac Games. It is an important early exclusive in the console's library.",
  "ps3-resistance-2":
    "Resistance 2 scales the series up with bigger monsters, expanded online play, and a campaign centered on Nathan Hale's worsening infection. It became one of PS3's central first-party shooter sequels.",
  "ps3-resistance-3":
    "Resistance 3 shifts to a more desperate road-trip campaign across occupied America, bringing back weapon wheels, bleak atmosphere, and tighter encounters. It is often remembered as the strongest story entry in the series.",
  "ps3-motorstorm":
    "MotorStorm gave early PS3 racing a muddy, aggressive identity with festival-style off-road events, vehicle classes, crashes, and terrain deformation. Its attitude and visual punch helped sell the console's launch-window promise.",
  "ps3-infamous":
    "inFAMOUS gives players electrical powers in an open city shaped by moral choices, rooftop traversal, and comic-book storytelling. Cole MacGrath's powers and karma system made it one of PS3's core superhero-style exclusives.",
  "ps3-infamous-2":
    "inFAMOUS 2 refines the first game's open-city power fantasy with a New Orleans-inspired setting, stronger movement, new abilities, and bigger moral stakes. It became one of the PS3's most polished first-party action sequels.",
  "ps3-gran-turismo-5":
    "Gran Turismo 5 brought Sony's simulation racing flagship into HD with a huge car list, online play, premium models, license tests, and endurance racing. Its ambition and uneven sprawl make it a major PS3 collector entry.",
  "ps3-gran-turismo-6":
    "Gran Turismo 6 arrived late in the PS3 era with more cars, refined handling, expanded events, and a broad single-player structure. It is the final mainline Gran Turismo built for PlayStation 3.",
};

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

const games = readJsonIfExists(ps3Path, null);
const manifest = readJsonIfExists(manifestPath, {});
if (!Array.isArray(games)) throw new Error("Run scripts/import-ps3-official-list.js first.");

let seeded = 0;
games.forEach((game) => {
  const overview = seeds[game.id];
  if (!overview) return;
  game.description = overview;
  game.descriptionProvider = "GCX editorial seed";
  game.descriptionSourceUrl = "";
  game.overviewStatus = "published";
  game.searchText = `${game.searchText || ""} ${overview}`.toLowerCase();
  seeded += 1;
});

const overviewStatusCounts = games.reduce((totals, game) => {
  const status = game.overviewStatus || "needs_editorial";
  totals[status] = (totals[status] || 0) + 1;
  return totals;
}, {});

writeJson(ps3Path, games);
writeJson(manifestPath, {
  ...manifest,
  editorialSeededAt: new Date().toISOString(),
  editorialSeedCount: seeded,
  overviewStatusCounts,
});

console.log(`Seeded ${seeded} PS3 editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
