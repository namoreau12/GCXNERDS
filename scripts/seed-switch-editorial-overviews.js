const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "switch.json");
const manifestPath = path.join(rootDir, "data", "games", "switch-manifest.json");

const seeds = {
  "switch-the-legend-of-zelda-breath-of-the-wild":
    "The Legend of Zelda: Breath of the Wild redefined open-world Zelda with physics-driven exploration, survival systems, shrine puzzles, and a Hyrule built around curiosity. It remains one of the Switch library's most important launch-era games.",
  "switch-the-legend-of-zelda-tears-of-the-kingdom":
    "The Legend of Zelda: Tears of the Kingdom expands Breath of the Wild with sky islands, depths, vehicle building, fusion systems, and a more layered Hyrule. It is a flagship Switch release and a major long-term collector title.",
  "switch-super-mario-odyssey":
    "Super Mario Odyssey is a globe-trotting 3D platformer built around Cappy possession mechanics, dense kingdoms, movement freedom, and hundreds of Power Moons. It is one of the Switch's defining first-party games.",
  "switch-mario-kart-8-deluxe":
    "Mario Kart 8 Deluxe packages the Wii U racer with all DLC, revamped battle mode, portability, and years of added Booster Course Pass content. It became one of the Switch's evergreen multiplayer anchors.",
  "switch-animal-crossing-new-horizons":
    "Animal Crossing: New Horizons turns island life into a customizable daily routine with crafting, terraforming, seasonal events, online visits, and deep decorating. It became one of the Switch era's biggest cultural games.",
  "switch-super-smash-bros-ultimate":
    "Super Smash Bros. Ultimate brings together every previous fighter, a massive roster of new characters, stages, spirits, and competitive rule options. It is one of the Switch's most important multiplayer and collector releases.",
  "switch-metroid-dread":
    "Metroid Dread revives 2D Metroid with fast movement, E.M.M.I. encounters, parries, and a tense planet-wide chase structure. It is a key modern entry for Nintendo collectors and action fans.",
  "switch-metroid-prime-remastered":
    "Metroid Prime Remastered modernizes Retro Studios' GameCube classic with new visuals, dual-stick controls, and the original's atmospheric first-person exploration intact. It is one of the Switch's strongest preservation releases.",
  "switch-splatoon-2":
    "Splatoon 2 brings Nintendo's ink shooter to Switch with new specials, Salmon Run, Splatfests, local portability, and a stronger online ecosystem. It helped establish the Switch as a multiplayer platform early on.",
  "switch-splatoon-3":
    "Splatoon 3 expands the series with new movement, weapons, Salmon Run upgrades, a stronger campaign, and ongoing live events. It is the Switch's most complete entry in Nintendo's competitive ink-shooter series.",
  "switch-luigi-s-mansion-3":
    "Luigi's Mansion 3 turns a haunted hotel into a polished puzzle-adventure with floor-by-floor themes, Gooigi mechanics, expressive animation, and satisfying ghost-catching. It is one of the Switch's best showcase games.",
  "switch-fire-emblem-three-houses":
    "Fire Emblem: Three Houses blends tactical battles with school-life scheduling, character bonds, branching routes, and political drama. Its structure made it one of the Switch's signature strategy RPGs.",
  "switch-fire-emblem-engage":
    "Fire Emblem Engage focuses on crisp tactical battles, Emblem Ring mechanics, and callbacks to past heroes across the series. It is a more combat-forward Switch entry for strategy fans.",
  "switch-xenoblade-chronicles-2":
    "Xenoblade Chronicles 2 is a large-scale RPG built around Titans, Blades, combo-heavy combat, and a long character-driven quest. It became one of the Switch's early deep RPG anchors.",
  "switch-xenoblade-chronicles-3":
    "Xenoblade Chronicles 3 combines a large party system, class swapping, emotional sci-fi storytelling, and wide-open exploration. It is one of the Switch library's most substantial RPG releases.",
  "switch-kirby-and-the-forgotten-land":
    "Kirby and the Forgotten Land brings Kirby into full 3D stages with Mouthful Mode, co-op, town upgrades, and inventive boss design. It is one of Kirby's most important modern reinventions.",
  "switch-pikmin-3-deluxe":
    "Pikmin 3 Deluxe brings the Wii U strategy-adventure to Switch with quality-of-life updates, co-op story play, and extra missions. It is an approachable entry point into Nintendo's real-time creature-command series.",
  "switch-pikmin-4":
    "Pikmin 4 expands the series with Oatchi, night expeditions, underground caves, rescue missions, and a friendlier structure. It became a major Switch-era revival for one of Nintendo's most distinctive franchises.",
  "switch-super-mario-maker-2":
    "Super Mario Maker 2 gives Switch players a powerful side-scrolling Mario creation suite with new themes, slopes, story mode, online sharing, and multiplayer. It is a platforming toolkit as much as a game.",
  "switch-ring-fit-adventure":
    "Ring Fit Adventure blends exercise hardware with RPG progression, turn-based workout battles, and guided routines. Complete copies need extra attention because the Ring-Con and leg strap are essential parts of the product.",
  "switch-astral-chain":
    "Astral Chain is a PlatinumGames action title built around paired combat, investigation, and controlling human and Legion partners at the same time. It is one of the Switch's strongest original action exclusives.",
  "switch-bayonetta-3":
    "Bayonetta 3 pushes the action series with Demon Slave summons, multiverse story threads, and large-scale set pieces. It is an important late Switch action release from PlatinumGames.",
  "switch-bayonetta-origins-cereza-and-the-lost-demon":
    "Bayonetta Origins: Cereza and the Lost Demon reframes the series as a storybook adventure with dual-character puzzle combat and fairy-tale presentation. It is a distinctive companion piece in the Bayonetta catalog.",
  "switch-donkey-kong-country-tropical-freeze":
    "Donkey Kong Country: Tropical Freeze brings Retro Studios' precise, difficult platformer to Switch with Funky Mode and portable play. It remains one of Nintendo's strongest modern 2D platformers.",
  "switch-paper-mario-the-origami-king":
    "Paper Mario: The Origami King mixes papercraft comedy, ring-based battles, exploration, and a bright road-trip structure. It is the Switch's original Paper Mario entry.",
  "switch-paper-mario-the-thousand-year-door":
    "Paper Mario: The Thousand-Year Door updates the GameCube RPG with modern presentation while keeping its stage battles, partners, and sharp writing intact. It is a major Switch-era revival for RPG collectors.",
  "switch-super-mario-rpg":
    "Super Mario RPG remakes the SNES collaboration with updated visuals, timing-based combat, and a faithful retelling of Mario's first RPG adventure. It is an important bridge between retro collectors and Switch players.",
  "switch-hades":
    "Hades is a roguelike action game built around fast combat, Greek myth storytelling, relationship progression, and repeatable escape attempts. Its Switch release became one of the platform's strongest indie showcases.",
  "switch-stardew-valley":
    "Stardew Valley fits naturally on Switch with farming, mining, relationships, fishing, and long-term town progression. Its portable version is one of the system's most enduring indie releases.",
  "switch-hollow-knight":
    "Hollow Knight brings a dense, atmospheric action-adventure to Switch with interconnected areas, precise combat, and extensive exploration. It is one of the platform's most important indie physical and digital collector titles.",
  "switch-celeste":
    "Celeste is a precision platformer about climbing a mountain, mastering movement, and pushing through self-doubt. Its tight controls and emotional story make it one of the Switch's defining indie games.",
  "switch-monster-hunter-rise":
    "Monster Hunter Rise adapts Capcom's hunting formula to Switch with Wirebugs, Palamutes, faster traversal, and portable multiplayer. It became the platform's central Monster Hunter release.",
  "switch-monster-hunter-generations-ultimate":
    "Monster Hunter Generations Ultimate brings a huge roster of monsters, styles, hunter arts, and classic series structure to Switch. It is a major collector title for fans who want a broad pre-World Monster Hunter package.",
  "switch-mario-party-superstars":
    "Mario Party Superstars rebuilds classic boards and minigames with online play and a cleaner focus on the series' Nintendo 64/GameCube-era strengths. It is one of the Switch's most approachable party games.",
  "switch-super-mario-party-jamboree":
    "Super Mario Party Jamboree expands the Switch party-game lineup with new boards, a large minigame roster, online modes, and motion-focused events. It is a late-platform multiplayer anchor.",
  "switch-pokemon-sword":
    "Pokémon Sword brings the main series to Switch with the Galar region, Wild Area exploration, Dynamax battles, raids, and version-exclusive Pokémon. It is a central early Switch-era Pokémon release.",
  "switch-pokemon-shield":
    "Pokémon Shield pairs with Sword as the companion Galar version, offering its own exclusives, gym differences, Dynamax raids, and the same broader move to console-scale Pokémon presentation.",
  "switch-pokemon-brilliant-diamond":
    "Pokémon Brilliant Diamond remakes the Sinnoh adventure with chibi overworld presentation, Grand Underground updates, and modern Switch convenience. It is the Diamond-side remake for collectors tracking the full Switch Pokémon run.",
  "switch-pokemon-shining-pearl":
    "Pokémon Shining Pearl complements Brilliant Diamond with its own version exclusives and Palkia focus, bringing the DS-era Sinnoh structure to Switch with updated visuals and quality-of-life changes.",
  "switch-pokemon-legends-arceus":
    "Pokémon Legends: Arceus reworks the series around field research, real-time catching, open-area exploration, and the ancient Hisui region. It is one of the most important experimental Pokémon releases on Switch.",
  "switch-pokemon-scarlet":
    "Pokémon Scarlet opens Paldea with open-world routes, school-based progression, Terastal battles, and Koraidon as the version mascot. Its version exclusives and expansion compatibility make condition and edition notes important.",
  "switch-pokemon-violet":
    "Pokémon Violet pairs with Scarlet as the Miraidon-focused Paldea version, using the same open-world structure, Terastal system, and multiplayer-friendly exploration. It is a major late Switch Pokémon release.",
  "switch-pokemon-let-s-go-pikachu":
    "Pokémon: Let's Go, Pikachu! revisits Kanto with motion-style catching, Pokémon GO connectivity, partner Pikachu, and a more approachable remake structure. Complete copies may matter more when bundled with Poké Ball Plus.",
  "switch-pokemon-let-s-go-eevee":
    "Pokémon: Let's Go, Eevee! complements the Pikachu version with partner Eevee, Kanto nostalgia, Pokémon GO integration, and simplified catching systems. It is one of the Switch's earliest major Pokémon collector pieces.",
  "switch-new-pokemon-snap":
    "New Pokémon Snap revives the photography spinoff with on-rails expeditions, branching behavior, requests, and lush Switch-era environments. It is a standout non-RPG Pokémon release on the system.",
  "switch-pokken-tournament-dx":
    "Pokkén Tournament DX expands the Wii U fighter with all previous characters, new fighters, portable local play, and Switch multiplayer support. It is a key Pokémon spinoff for fighting-game collectors.",
  "switch-pokemon-mystery-dungeon-rescue-team-dx":
    "Pokémon Mystery Dungeon: Rescue Team DX remakes the original rescue-team RPGs with storybook-style visuals, dungeon crawling, and Pokémon recruitment. It is the main Mystery Dungeon entry for Switch collectors.",
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
if (!Array.isArray(games)) throw new Error("Run scripts/import-switch-official-list.js first.");

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

console.log(`Seeded ${seeded} Switch editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
