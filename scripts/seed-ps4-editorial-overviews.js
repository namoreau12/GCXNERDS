const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const ps4Path = path.join(rootDir, "data", "games", "ps4.json");
const manifestPath = path.join(rootDir, "data", "games", "ps4-manifest.json");

const seeds = {
  "ps4-bloodborne":
    "Bloodborne is FromSoftware's gothic action RPG, trading the shield-heavy caution of Dark Souls for faster dodges, trick weapons, gun parries, and aggressive health recovery. Its ruined city of Yharnam, cosmic horror turn, and punishing boss design made it one of PS4's defining exclusives.",
  "ps4-god-of-war":
    "God of War reimagines Kratos as an older father traveling through Norse myth with Atreus, shifting the series toward over-the-shoulder combat, exploration, and a more intimate story. Its axe mechanics, seamless camera, and emotional restraint made it a landmark PS4 exclusive.",
  "ps4-the-last-of-us-part-ii":
    "The Last of Us Part II is a tense stealth-action sequel built around revenge, grief, and perspective, pairing brutal encounters with unusually detailed animation and environmental storytelling. It is one of PS4's most technically ambitious and divisive narrative showcases.",
  "ps4-marvel-s-spider-man":
    "Marvel's Spider-Man turns New York into a fast, readable playground for web-swinging, acrobatic combat, gadgets, and superhero side missions. Insomniac's movement and character work made it one of the most broadly loved PS4 exclusives.",
  "ps4-ghost-of-tsushima":
    "Ghost of Tsushima follows Jin Sakai through an open-world samurai drama about honor, invasion, and adaptation. Its sword duels, stealth tools, wind-guided exploration, and painterly island scenery made it a major late-generation PS4 release.",
  "ps4-horizon-zero-dawn":
    "Horizon Zero Dawn introduces Aloy in a post-post-apocalyptic world where tribal societies hunt machine creatures across wild landscapes. Its bow combat, machine-part targeting, crafting, and mystery-driven worldbuilding gave PlayStation a major new first-party series.",
  "ps4-uncharted-4-a-thief-s-end":
    "Uncharted 4: A Thief's End closes Nathan Drake's story with larger traversal spaces, rope swinging, stealthier combat options, and a more reflective adventure about obsession, family, and treasure hunting. It is one of Naughty Dog's signature PS4 showcases.",
  "ps4-persona-5":
    "Persona 5 blends stylish turn-based dungeon crawling with school-life scheduling, social links, and a story about rebellion against corrupt authority. Its UI, music, cast, and daily rhythm made it one of the most influential JRPGs of the PS4 era.",
  "ps4-the-witcher-3-wild-hunt":
    "The Witcher 3: Wild Hunt brings Geralt into a huge open-world RPG full of monster contracts, political conflicts, morally messy quests, and character-driven storytelling. Its side quests and expansions helped set a new standard for narrative depth in open-world games.",
  "ps4-red-dead-redemption-2":
    "Red Dead Redemption 2 is Rockstar's sprawling western about Arthur Morgan and the collapse of the Van der Linde gang, built around a richly simulated frontier, slow-burn storytelling, hunting, horseback travel, and detailed character interactions.",
  "ps4-grand-theft-auto-v":
    "Grand Theft Auto V on PS4 upgrades Rockstar's Los Santos crime sandbox with improved visuals, first-person mode, online support, and the same three-protagonist heist structure that made the game a long-running marketplace staple.",
  "ps4-batman-arkham-knight":
    "Batman: Arkham Knight closes Rocksteady's trilogy with a rain-soaked Gotham, refined freeflow combat, predator stealth, detective tools, and the heavily featured Batmobile. It is one of the generation's major licensed action games.",
  "ps4-final-fantasy-vii-remake":
    "Final Fantasy VII Remake rebuilds the Midgar portion of Square's RPG classic as a modern action RPG with cinematic storytelling, real-time combat, tactical commands, and expanded character arcs. It is both remake and reinterpretation, making it a key PS4 RPG.",
  "ps4-final-fantasy-xv":
    "Final Fantasy XV turns the series into a road-trip action RPG about Noctis and his companions traveling across a modern-fantasy world. Its real-time battles, party banter, open zones, and long development history make it a major PS4-era Final Fantasy entry.",
  "ps4-resident-evil-2":
    "Resident Evil 2 remakes Capcom's survival-horror classic with over-the-shoulder aiming, modern visuals, tense resource management, and a redesigned Raccoon City police station. It became a benchmark for how to modernize a beloved horror game.",
  "ps4-resident-evil-7-biohazard":
    "Resident Evil 7: Biohazard resets the series around first-person horror, a grim Louisiana estate, scarce resources, and the unsettling Baker family. Its smaller scale and VR support made it one of PS4's strongest horror experiences.",
  "ps4-monster-hunter-world":
    "Monster Hunter: World opens Capcom's hunting series to a broader audience with seamless maps, tracking, online co-op, and massive monsters built around preparation, weapon mastery, and repeated hunts. It became one of PS4's biggest multiplayer action RPGs.",
  "ps4-nier-automata":
    "Nier: Automata mixes PlatinumGames action with Yoko Taro's melancholy sci-fi storytelling, shifting perspectives and genres as androids fight machines on a ruined Earth. Its music, multiple endings, and philosophical edge made it a cult-to-mainstream PS4 favorite.",
  "ps4-sekiro-shadows-die-twice":
    "Sekiro: Shadows Die Twice is a precision action game focused on posture, parries, stealth, and sword duels in a dark Sengoku-inspired world. Its rhythm and discipline make it distinct from FromSoftware's RPG-heavy Souls games.",
  "ps4-dark-souls-iii":
    "Dark Souls III brings FromSoftware's dark fantasy action RPG series to PS4 with faster combat, dense level routes, harsh bosses, and a world obsessed with cycles, ash, and fading fire. It is a major collector title for Souls fans.",
  "ps4-death-stranding":
    "Death Stranding is Hideo Kojima's strange delivery adventure about reconnecting isolated people across a broken America, built around terrain traversal, cargo management, online structures, and cinematic science-fiction storytelling.",
  "ps4-days-gone":
    "Days Gone follows Deacon St. John through an open-world Pacific Northwest filled with motorcycle travel, survival systems, hostile camps, and huge Freaker hordes. Its scale and first-party status make it a notable PS4 collector entry.",
  "ps4-ratchet-and-clank":
    "Ratchet & Clank reimagines the original PS2 adventure with modern visuals, weapon upgrades, planet-hopping platforming, and playful sci-fi combat. It served as both a movie tie-in and a polished PS4 entry point for the series.",
  "ps4-until-dawn":
    "Until Dawn is an interactive horror game built around slasher-movie choices, branching outcomes, motion-captured performances, and the butterfly effect. Its group-play appeal and replayable decision paths made it a PS4 cult favorite.",
  "ps4-detroit-become-human":
    "Detroit: Become Human is a choice-driven interactive drama about androids, identity, and civil unrest, following three protagonists through branching scenes and consequence-heavy decisions. It is one of PS4's major cinematic narrative releases.",
  "ps4-nioh":
    "Nioh blends Team Ninja action with loot-driven RPG systems, stance switching, Ki pulse timing, and a supernatural version of Japan's Sengoku period. Its speed and build depth made it a strong PS4 action RPG.",
  "ps4-nioh-2":
    "Nioh 2 expands the first game's demanding combat with custom characters, Yokai Shift abilities, deeper loot systems, and more flexible builds. It is one of the PS4's strongest late-generation action RPGs.",
  "ps4-yakuza-0":
    "Yakuza 0 is a lavish prequel set in 1980s Tokyo and Osaka, following Kazuma Kiryu and Goro Majima through crime drama, street fights, side stories, and business minigames. It became a major Western entry point for the series.",
  "ps4-yakuza-6-the-song-of-life":
    "Yakuza 6: The Song of Life closes Kiryu's long-running arc with a new Dragon Engine, intimate family stakes, and a mix of Kamurocho drama and Onomichi mystery. It is a key PS4 chapter for series collectors.",
  "ps4-dragon-quest-xi":
    "Dragon Quest XI keeps the series rooted in classic turn-based adventure while delivering a bright, polished world, party-driven story, and long-form RPG progression. On PS4, it became one of the generation's most approachable traditional JRPGs.",
  "ps4-street-fighter-v":
    "Street Fighter V brought Capcom's flagship fighter to PS4 with a competitive focus, V-Skills, V-Triggers, and years of roster updates. Its evolving editions make version and content clarity important for collectors.",
  "ps4-mortal-kombat-11":
    "Mortal Kombat 11 combines NetherRealm's cinematic story mode, brutal one-on-one combat, character customization, and a large roster of returning fighters and guests. It is one of PS4's most visible fighting-game releases.",
  "ps4-doom":
    "Doom reboots id Software's shooter around speed, arena movement, glory kills, heavy weapons, and aggressive enemy pressure. Its campaign gave PS4 players one of the generation's sharpest single-player shooters.",
  "ps4-doom-eternal":
    "Doom Eternal pushes the reboot's combat into a faster resource loop built around movement, weak points, ammo tools, armor generation, and relentless enemy composition. It is a demanding late-generation shooter showcase.",
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

const games = readJsonIfExists(ps4Path, null);
const manifest = readJsonIfExists(manifestPath, {});
if (!Array.isArray(games)) throw new Error("Run scripts/import-ps4-official-list.js first.");

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

writeJson(ps4Path, games);
writeJson(manifestPath, {
  ...manifest,
  editorialSeededAt: new Date().toISOString(),
  editorialSeedCount: seeded,
  overviewStatusCounts,
});

console.log(`Seeded ${seeded} PS4 editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
