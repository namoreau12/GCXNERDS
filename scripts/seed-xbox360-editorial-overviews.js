const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "xbox360.json");
const manifestPath = path.join(rootDir, "data", "games", "xbox360-manifest.json");

const seeds = {
  "xbox360-halo-3":
    "Halo 3 was the Xbox 360's defining multiplayer shooter, closing Bungie's original trilogy with four-player campaign co-op, Forge, Theater, and a massive Xbox Live community. It remains one of the platform's essential collector titles.",
  "xbox360-halo-reach":
    "Halo: Reach is Bungie's final Halo game, built around a doomed prequel campaign, armor abilities, Firefight, Forge World, and a strong multiplayer suite. It is one of the Xbox 360 library's most complete shooters.",
  "xbox360-halo-3-odst":
    "Halo 3: ODST shifts the series toward a moodier side story with an open city hub, squad flashbacks, and Firefight survival. Its two-disc release and multiplayer content make condition and completeness important.",
  "xbox360-halo-4":
    "Halo 4 begins 343 Industries' era with a more personal Master Chief story, new Forerunner enemies, Spartan Ops, and a modernized multiplayer structure. It is a major late-generation Xbox 360 release.",
  "xbox360-gears-of-war":
    "Gears of War gave Xbox 360 a signature cover shooter, built around stop-and-pop combat, co-op campaign play, active reloads, and a gritty visual style. It became one of the console's most important exclusives.",
  "xbox360-gears-of-war-2":
    "Gears of War 2 expands the series with bigger set pieces, Horde mode, improved co-op pacing, and a more ambitious campaign. It is a core Xbox 360 multiplayer and collector title.",
  "xbox360-gears-of-war-3":
    "Gears of War 3 closes the original trilogy with four-player co-op, refined Horde and Beast modes, and a larger multiplayer package. It is one of the strongest late-era Xbox 360 exclusives.",
  "xbox360-forza-motorsport-4":
    "Forza Motorsport 4 is one of the Xbox 360's showcase racing games, with a large car roster, strong handling, Autovista presentation, and polished simulation options. Complete copies may include multi-disc content.",
  "xbox360-forza-horizon":
    "Forza Horizon turns the Forza brand into an open-road festival racer with accessible handling, music-driven presentation, and Colorado free roaming. It launched one of Xbox's most important modern racing branches.",
  "xbox360-fable-ii":
    "Fable II brings Lionhead's action RPG series to Xbox 360 with Albion exploration, moral choices, property ownership, family systems, and a distinctive fantasy tone. It is one of the system's key RPG exclusives.",
  "xbox360-fable-iii":
    "Fable III follows Albion into revolution and rule, mixing action RPG combat, choice-driven quests, and kingdom management. Its collector value depends heavily on edition, case contents, and DLC/code status.",
  "xbox360-mass-effect":
    "Mass Effect launched BioWare's sci-fi RPG trilogy with Commander Shepard, squad choices, branching dialogue, and real-time tactical combat. On Xbox 360 it was a major console RPG milestone.",
  "xbox360-mass-effect-2":
    "Mass Effect 2 refines the series into a sharper squad-based action RPG focused on recruitment, loyalty missions, and a high-stakes suicide mission. It is one of the platform's landmark narrative games.",
  "xbox360-mass-effect-3":
    "Mass Effect 3 concludes Shepard's trilogy with larger war stakes, faster combat, multiplayer readiness systems, and major branching consequences. Complete editions and DLC access matter for collectors.",
  "xbox360-bioshock":
    "BioShock brings Rapture to Xbox 360 with atmospheric first-person combat, plasmids, audio logs, and a landmark immersive-story structure. It is one of the generation's most important single-player releases.",
  "xbox360-bioshock-infinite":
    "BioShock Infinite moves the series to Columbia with sky-line movement, Vigors, Elizabeth's companion role, and a more cinematic story. It is a major late-generation 360 release.",
  "xbox360-red-dead-redemption":
    "Red Dead Redemption is Rockstar's open-world western built around frontier exploration, horseback travel, stranger missions, and John Marston's story. It is one of the Xbox 360's most enduring open-world games.",
  "xbox360-the-elder-scrolls-v-skyrim":
    "The Elder Scrolls V: Skyrim gave Xbox 360 players a vast open-world RPG of guilds, dungeons, dragons, and character builds. Edition and disc content are especially important because of later DLC releases.",
  "xbox360-the-elder-scrolls-iv-oblivion":
    "The Elder Scrolls IV: Oblivion was an early Xbox 360 RPG showcase with open-world exploration, quest lines, guilds, and downloadable expansion content. It helped define the console's western RPG identity.",
  "xbox360-fallout-3":
    "Fallout 3 reimagines the series as a first-person open-world RPG, sending players through the Capital Wasteland with V.A.T.S., moral choices, and extensive questing. Game of the Year editions carry extra collector context.",
  "xbox360-fallout-new-vegas":
    "Fallout: New Vegas builds a more faction-driven desert RPG around the Mojave, branching quests, reputation systems, and player choice. It is one of the Xbox 360's most replayable RPGs.",
  "xbox360-call-of-duty-4-modern-warfare":
    "Call of Duty 4: Modern Warfare reshaped console shooters with modern military pacing, cinematic missions, perks, killstreaks, and fast Xbox Live multiplayer. It is a defining third-party Xbox 360 game.",
  "xbox360-call-of-duty-black-ops":
    "Call of Duty: Black Ops mixes Cold War campaign twists, Zombies, and a major multiplayer suite. Its popularity makes variant, edition, and disc-condition details useful for marketplace listings.",
  "xbox360-call-of-duty-black-ops-ii":
    "Call of Duty: Black Ops II adds branching campaign ideas, near-future multiplayer, League Play, and expanded Zombies modes. It became one of the highest-demand late Xbox 360 shooters.",
  "xbox360-grand-theft-auto-iv":
    "Grand Theft Auto IV brings Liberty City to the HD era with Niko Bellic's story, dense urban driving, physics-heavy combat, and online play. Complete editions and Episodes content are important collector distinctions.",
  "xbox360-grand-theft-auto-v":
    "Grand Theft Auto V stretches the Xbox 360 late in its life with three protagonists, Los Santos, heists, and GTA Online. It is one of the console's most technically ambitious open-world releases.",
  "xbox360-minecraft-xbox-360-edition":
    "Minecraft: Xbox 360 Edition adapted the survival-building phenomenon to console play with split-screen, controller support, tutorials, and update-driven growth. Physical copies became a recognizable late-generation staple.",
  "xbox360-left-4-dead":
    "Left 4 Dead is Valve's cooperative zombie shooter built around four-player survival, AI Director pacing, and replayable campaigns. It is a major Xbox 360 co-op title.",
  "xbox360-left-4-dead-2":
    "Left 4 Dead 2 expands the formula with new survivors, melee weapons, more varied campaigns, and stronger enemy variety. It remains one of the best co-op shooters on Xbox 360.",
  "xbox360-dead-rising":
    "Dead Rising traps Frank West in a zombie-filled mall with time-limited cases, improvised weapons, photography, and multiple endings. It is one of the Xbox 360's early cult exclusives.",
  "xbox360-crackdown":
    "Crackdown is an open-city action game about superpowered agency progression, rooftop agility orbs, co-op chaos, and explosive sandbox combat. It became an Xbox 360 favorite partly through its Halo 3 beta association.",
  "xbox360-alan-wake":
    "Alan Wake is a psychological action thriller built around light-based combat, episodic pacing, and a mystery set in Bright Falls. It is one of the Xbox 360's standout narrative exclusives.",
  "xbox360-lost-odyssey":
    "Lost Odyssey is a Mistwalker RPG with turn-based combat, immortal characters, memory stories, and a multi-disc presentation. It is one of the Xbox 360's most important Japanese RPG collector titles.",
  "xbox360-blue-dragon":
    "Blue Dragon is a Mistwalker and Artoon RPG with Akira Toriyama character designs, shadow-based classes, and a traditional multi-disc structure. Complete copies require extra disc and case verification.",
  "xbox360-banjo-kazooie-nuts-and-bolts":
    "Banjo-Kazooie: Nuts & Bolts reimagines the series around vehicle building, physics challenges, and large objective-based worlds. It is a distinctive Rare release on Xbox 360.",
  "xbox360-the-orange-box":
    "The Orange Box is a landmark compilation containing Half-Life 2 content, Portal, and Team Fortress 2. On Xbox 360 it is a high-value package because the included games are historically important.",
  "xbox360-portal-2":
    "Portal 2 expands Valve's puzzle design with gels, light bridges, excursion funnels, co-op chambers, and sharp writing. It is one of the generation's strongest puzzle games.",
  "xbox360-batman-arkham-asylum":
    "Batman: Arkham Asylum combines freeflow combat, stealth, detective tools, and a dense asylum setting. It became the foundation for modern superhero action games.",
  "xbox360-batman-arkham-city":
    "Batman: Arkham City expands Arkham's combat and stealth into a larger open district with more villains, side missions, and traversal. It is one of the Xbox 360's strongest licensed action games.",
  "xbox360-borderlands":
    "Borderlands mixes loot-driven shooting, co-op play, skill trees, and cel-shaded wasteland style. It helped push the loot-shooter format into the console mainstream.",
  "xbox360-borderlands-2":
    "Borderlands 2 builds on the first game with stronger writing, Handsome Jack, more distinct vault hunters, and a much broader endgame loop. It is a major co-op shooter for the platform.",
  "xbox360-dark-souls":
    "Dark Souls became a generation-defining action RPG through interconnected world design, demanding combat, cryptic storytelling, and online messages. Prepare to Die and original editions carry different collector context.",
  "xbox360-assassin-s-creed-ii":
    "Assassin's Creed II refines Ubisoft's open-world stealth formula with Ezio Auditore, Renaissance cities, improved missions, and stronger progression. It is one of the Xbox 360 era's major action-adventure games.",
  "xbox360-dance-central":
    "Dance Central was the Kinect's clearest early software showcase, using full-body tracking, pop routines, and score-chasing party play. Complete listings should mention Kinect requirements.",
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

const games = readJsonIfExists(dataPath, null);
const manifest = readJsonIfExists(manifestPath, {});
if (!Array.isArray(games)) throw new Error("Run scripts/import-xbox360-official-list.js first.");

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

writeJson(dataPath, games);
writeJson(manifestPath, {
  ...manifest,
  editorialSeededAt: new Date().toISOString(),
  editorialSeedCount: seeded,
  overviewStatusCounts,
});

console.log(`Seeded ${seeded} Xbox 360 editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
