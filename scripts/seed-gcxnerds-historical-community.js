const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const communityPath = path.join(root, "data", "community.json");
const newsroomPath = path.join(root, "data", "newsroom.json");
const avatarDir = path.join(root, "assets", "community-avatars");
const reportPath = path.join(root, "outputs", "gcxnerds-historical-community-seed-report.json");
const batchId = "gcxnerds-historical-community-2026-08-03-to-2026-10-03-v1";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function iso(date, time) {
  return new Date(`${date}T${time}-04:00`).toISOString();
}

function pickProfile(profiles, handle) {
  const normalized = handle.toLowerCase().replace(/^@/, "");
  const compact = normalized.replace(/[^a-z0-9]/g, "");
  const profile = profiles.find((item) => {
    const profileHandle = item.handle.toLowerCase().replace(/^@/, "");
    const display = item.displayName.toLowerCase();
    return profileHandle === normalized || display === normalized || profileHandle.replace(/[^a-z0-9]/g, "") === compact || display.replace(/[^a-z0-9]/g, "") === compact;
  });
  if (!profile) throw new Error(`Missing seed profile: ${handle}`);
  return profile;
}

function reactions(total, flavor = "mixed") {
  const shapes = {
    pokemon: [0.36, 0.26, 0.2, 0.13, 0.05],
    debate: [0.42, 0.18, 0.12, 0.03, 0.25],
    news: [0.34, 0.34, 0.14, 0.02, 0.16],
    cozy: [0.58, 0.14, 0.1, 0.08, 0.1],
    media: [0.4, 0.28, 0.1, 0.12, 0.1],
    poll: [0.25, 0.25, 0.2, 0.12, 0.18],
    mixed: [0.48, 0.21, 0.11, 0.08, 0.12],
  };
  const shape = shapes[flavor] || shapes.mixed;
  const counts = shape.map((part) => Math.floor(total * part));
  let used = counts.reduce((sum, count) => sum + count, 0);
  let index = 0;
  while (used < total) {
    counts[index % counts.length] += 1;
    used += 1;
    index += 1;
  }
  return {
    like: counts[0],
    hype: counts[1],
    want: counts[2],
    trade: counts[3],
    watch: counts[4],
  };
}

function profileSvg(profile, index) {
  const palettes = [
    ["#151515", "#ffbe0b", "#fb5607"],
    ["#172554", "#38bdf8", "#f8fafc"],
    ["#1f2937", "#a7f3d0", "#34d399"],
    ["#2e1065", "#f0abfc", "#f97316"],
    ["#111827", "#fca5a5", "#60a5fa"],
    ["#3f1d38", "#f9a8d4", "#fde68a"],
    ["#06281e", "#bef264", "#22c55e"],
    ["#1e1b4b", "#c4b5fd", "#f472b6"],
  ];
  const [bg, main, accent] = palettes[index % palettes.length];
  const initials = profile.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="300" height="300" rx="64" fill="${bg}"/>
  <circle cx="${80 + (index % 4) * 12}" cy="78" r="${30 + (index % 5) * 3}" fill="${accent}" opacity="0.78"/>
  <rect x="56" y="164" width="188" height="52" rx="16" fill="${main}" opacity="0.9"/>
  <path d="M58 236h184v18H58zM72 122h156v20H72z" fill="${accent}" opacity="0.65"/>
  <text x="150" y="202" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800" fill="${bg}">${initials}</text>
</svg>
`;
}

const seedProfiles = [
  ["profile-8bit-mara", "8BitMara", "@8bitmara", "Retro shelves, weird controllers, and RPG saves I refuse to delete.", ["retro", "jrpg", "collecting"]],
  ["profile-pallet-town-pete", "PalletTownPete", "@pallettownpete", "Pokemon TCG binder gremlin in recovery. Recovery is going poorly.", ["pokemon", "cards"]],
  ["profile-frame-frank", "Frame Frank", "@framefrank", "I can see frame pacing in my sleep and no, that is not healthy.", ["pc", "hardware"]],
  ["profile-mana-maya", "Mana Maya", "@manamaya", "JRPGs, cozy grinds, and party members with tragic hair.", ["jrpg", "indies"]],
  ["profile-save-scum-sam", "SaveScumSam", "@savescumsam", "I make bad choices, reload, then make slightly different bad choices.", ["rpg", "pc"]],
  ["profile-crt-kay", "CRT Kay", "@crtkay", "CRT defender. Component cable evangelist. Shelf dust survivor.", ["retro", "hardware"]],
  ["profile-couch-coop-cole", "CouchCoopCole", "@couchcoopcole", "Married co-op gamer trying to keep both controllers and peace intact.", ["co-op", "switch"]],
  ["profile-no-scope-nia", "NoScopeNia", "@noscopenia", "FPS enjoyer, aim trainer dropout, headset battery victim.", ["fps", "xbox"]],
  ["profile-joycon-jules", "JoyConJules", "@joyconjules", "Nintendo kid forever. I do not apologize for motion controls.", ["nintendo", "zelda"]],
  ["profile-trophy-tara", "Trophy Tara", "@trophytara", "One trophy away from sanity. Several platinums away from sleep.", ["playstation", "achievements"]],
  ["profile-achieve-abe", "Achievement Abe", "@achievementabe", "I will replay a 4/10 game for a 1000G list and feel nothing.", ["xbox", "achievements"]],
  ["profile-binder-bree", "Binder Bree", "@binderbree", "Sleeves first, questions later.", ["pokemon", "cards"]],
  ["profile-indie-omar", "Indie Omar", "@indieomar", "Here to recommend the tiny game that ruins your weekend.", ["indie", "pc"]],
  ["profile-dad-mode-dan", "DadModeDan", "@dadmodedan", "Gaming after bedtime with the volume at 7.", ["family", "retro"]],
  ["profile-mom-savepoint", "MomSavepoint", "@momsavepoint", "Raising tiny gamers and occasionally stealing the good controller.", ["family", "switch"]],
  ["profile-lag-switch-lee", "LagSwitchLee", "@lagswitchlee", "Competitive when winning, blaming Wi-Fi when losing.", ["fighting", "fps"]],
  ["profile-zora-zoe", "ZoraZoe", "@zorazoe", "Zelda dungeons, weird lore, and suspicious pots.", ["zelda", "nintendo"]],
  ["profile-ps2-paul", "PS2Paul", "@ps2paul", "The PS2 shelf is not a phase. It is load-bearing furniture.", ["ps2", "retro"]],
  ["profile-xbox-uncle-rob", "Uncle Rob313", "@rob313", "Xbox defender. Halo optimist. Grill owner.", ["xbox", "halo"]],
  ["profile-pc-ivy", "PC Ivy", "@pcivy", "Settings menus are gameplay.", ["pc", "hardware"]],
  ["profile-switch-sasha", "SwitchSasha", "@switchsasha", "Handheld mode maximalist.", ["switch", "indies"]],
  ["profile-charlie-crits", "CharlieCrits", "@charliecrits", "Fighting games, bad puns, and lab work I swear I did.", ["fighting", "arcade"]],
  ["profile-speedy-ren", "SpeedyRen", "@speedyren", "Speedruns and route notes written on napkins.", ["speedrun", "retro"]],
  ["profile-lore-lena", "LoreLena", "@lorelena", "Will read item descriptions for emotional damage.", ["souls", "lore"]],
  ["profile-bargain-bex", "BargainBex", "@bargainbex", "Clearance rack archaeologist.", ["deals", "collecting"]],
  ["profile-n64-nate", "N64Nate", "@n64nate", "Four controller ports changed civilization.", ["n64", "retro"]],
  ["profile-mega-miles", "MegaMiles", "@megamiles", "Mega Man apologist and blue bomber historian.", ["retro", "capcom"]],
  ["profile-ashley92", "Ashley92", "@ashley92", "Mostly here for Pokemon, Zelda, and chaotic comment sections.", ["pokemon", "zelda"]],
  ["profile-miked", "MikeD", "@miked", "Sports games, shooters, and pretending I will finish my backlog.", ["sports", "fps"]],
  ["profile-amanda-gaming", "AmandaGaming", "@amandagaming", "New releases, old favorites, and too many screenshots.", ["playstation", "screenshots"]],
  ["profile-tyler", "Tyler", "@tyler", "I post questions then disappear for six hours.", ["community", "questions"]],
  ["profile-jake-snake", "JakeTheSnake", "@jakethesnake", "I like games that make everyone mad online.", ["hot takes", "xbox"]],
  ["profile-pixel-priya", "PixelPriya", "@pixelpriya", "Pixel art, handhelds, and soundtracks on repeat.", ["indie", "handheld"]],
  ["profile-ryan-respawn", "RespawnRyan", "@respawnryan", "BR rotations and emotional support snacks.", ["fps", "streaming"]],
  ["profile-kirby-kev", "KirbyKev", "@kirbykev", "Soft games, hard opinions.", ["nintendo", "cozy"]],
  ["profile-fgc-fiona", "FGCFiona", "@fgcfiona", "Local bracket survivor. Anti-wakeup button enjoyer.", ["fighting", "arcade"]],
  ["profile-cardboard-cam", "CardboardCam", "@cardboardcam", "Sealed product makes me nervous. Opening it makes me broker.", ["pokemon", "cards"]],
  ["profile-retro-rina", "RetroRina", "@retrorina", "Strategy books, demo discs, and memory card labels.", ["retro", "nostalgia"]],
  ["profile-portal-pat", "PortalPat", "@portalpat", "Remote play in bed changed my whole personality.", ["playstation", "handheld"]],
  ["profile-dreamcast-drew", "DreamcastDrew", "@dreamcastdrew", "Still thinking about VMUs.", ["dreamcast", "retro"]],
  ["profile-snes-sierra", "SNES Sierra", "@snessierra", "Mode 7 appreciator.", ["snes", "retro"]],
  ["profile-gamecube-gio", "GameCubeGio", "@gamecubegio", "GameCube undefeated. I will be taking no questions.", ["gamecube", "nintendo"]],
  ["profile-cozy-cass", "CozyCass", "@cozycass", "Low-stress games, high-stress inventories.", ["cozy", "indie"]],
  ["profile-boss-rush-ben", "BossRushBen", "@bossrushben", "Boss fights, big swords, small patience.", ["souls", "action"]],
  ["profile-jrpg-jalen", "JRPGJalen", "@jrpgjalen", "If the menu has twelve tabs, I am home.", ["jrpg", "switch"]],
  ["profile-pack-luck-luis", "PackLuckLuis", "@packluckluis", "Absolutely finished buying packs after this next one.", ["pokemon", "cards"]],
  ["profile-vanessa-vsync", "VanessaVsync", "@vanessavsync", "Motion clarity sicko.", ["pc", "hardware"]],
  ["profile-beth-button", "BethButton", "@bethbutton", "Platformers and coffee.", ["platformers", "indie"]],
  ["profile-mini-map-max", "MiniMapMax", "@minimapmax", "Open-world checklist enjoyer. Yes, every icon.", ["rpg", "open world"]],
  ["profile-sonic-sal", "SonicSal", "@sonicsal", "Speed stages over hub worlds. Argue with a wall.", ["sega", "retro"]],
  ["profile-poke-nora", "PokeNora", "@pokenora", "Charmander kid who became a spreadsheet adult.", ["pokemon", "collecting"]],
  ["profile-steam-sale-sid", "SteamSaleSid", "@steamsalesid", "My backlog has a backlog.", ["pc", "deals"]],
  ["profile-wii-wanda", "WiiWanda", "@wiiwanda", "Miis are art.", ["wii", "family"]],
  ["profile-ds-darla", "DSDarla", "@dsdarla", "Dual screens made us powerful.", ["ds", "handheld"]],
  ["profile-battle-pass-bryce", "BattlePassBryce", "@battlepassbryce", "I hate battle passes and complete them anyway.", ["live service", "fps"]],
  ["profile-quest-quinn", "QuestQuinn", "@questquinn", "Side quests before main quests. Obviously.", ["rpg", "open world"]],
  ["profile-card-sleeve-sam", "SleeveSam", "@sleevesam", "Toploaders in every drawer.", ["cards", "pokemon"]],
  ["profile-final-form-faye", "FinalFormFaye", "@finalformfaye", "Final bosses and final forms, preferably with choir music.", ["jrpg", "action"]],
  ["profile-lan-party-lou", "LANPartyLou", "@lanpartylou", "Ethernet cables and pizza boxes built character.", ["pc", "nostalgia"]],
  ["profile-saturn-syd", "SaturnSyd", "@saturnsyd", "Sega Saturn import shelves and questionable prices.", ["saturn", "retro"]],
  ["profile-switchback-sue", "SwitchbackSue", "@switchbacksue", "I buy games twice if one version is portable.", ["switch", "deals"]],
  ["profile-madden-marcus", "MaddenMarcus", "@maddenmarcus", "Sports games are comfort food.", ["sports", "xbox"]],
  ["profile-horror-hazel", "HorrorHazel", "@horrorhazel", "I play horror games with the lights on. Sue me.", ["horror", "playstation"]],
  ["profile-gcx-nerds", "GCX Nerds", "@gcxnerds", "Official GCX community account. Gaming nerds, card people, and occasional chaos.", ["gcx", "community"]],
];

const articleRefs = {
  ps5Upscaling: "gcx-newsroom-ps5-qssr-ai-upscaling-explained",
  gearsEarly: "gcx-newsroom-gears-of-war-e-day-early-access-live",
  pokemonBundles: "gcx-newsroom-pokemon-30th-celebration-booster-bundles-mini-tins-october-2",
  mtgReality: "gcx-newsroom-magic-the-gathering-reality-fracture-launch",
  obsidian: "gcx-newsroom-bethesda-obsidian-creative-identity-xbox-restructure",
  pocketMega: "gcx-newsroom-pokemon-tcg-pocket-deluxe-pack-mega-pokemon-ex-guaranteed",
  tournamentLegal: "gcx-newsroom-pokemon-30th-celebration-tournament-legal-classic-collection",
  minecraftLive: "gcx-newsroom-minecraft-live-2026-time-how-to-watch-what-to-expect",
  silentHill: "gcx-newsroom-silent-hill-townfall-launch-first-person-horror",
  control: "gcx-newsroom-control-resonant-launch-hotfix-combat",
  halo: "gcx-newsroom-activision-next-halo-xbox-restructure",
  megaMan: "gcx-newsroom-mega-man-dual-override-gamescom-2026",
  gamescomWatch: "gcx-newsroom-gamescom-2026-games-were-watching-most",
  pokemonBattles: "gcx-newsroom-pokemon-winds-waves-turn-based-battles-champions",
  pokemonGuide: "gcx-newsroom-pokemon-tcg-30th-celebration-complete-guide",
};

const mediaAssets = [
  "assets/news/pokemon-tcg-30th-celebration.jpg",
  "assets/news/pokemon-30th-pikachu-checklist.jpg",
  "assets/news/pokemon-30th-msrp-tracker.jpg",
  "assets/news/phantom-blade-zero-preview.jpg",
  "assets/news/gamescom-2026-showcase.jpg",
  "assets/news/gamescom-2026-watchlist.jpg",
  "assets/news/next-gen-console-pricing.jpg",
  "assets/news/horizon-hunters-gathering.jpg",
  "assets/consoles/super-nintendo.png",
  "assets/consoles/nintendo-switch.png",
];

const specs = [
  ["8BitMara", "2026-08-03", "07:18:00", "Nostalgia", "Found my old memory card and now I'm emotional", "I plugged in the GameCube before work to test a cable and the memory card still has my Wind Waker save from high school. The save file name is just MOO because apparently I was a deeply serious artist.", ["GameCube", "Nostalgia"], 46, "cozy", "group-retro-shelf"],
  ["DadModeDan", "2026-08-03", "12:07:00", "Personal", "My kid beat me in Mario Kart and immediately asked if I was trying", "I have never been humbled faster. Small person, huge disrespect, perfect racing line.", ["Family", "Nintendo"], 31, "cozy"],
  ["Frame Frank", "2026-08-03", "21:14:00", "Hot Take", "30 FPS is fine when the frame pacing is actually stable", "I said what I said. A locked 30 with clean input beats a wobbly 48-60 pretending to be performance mode.", ["Performance", "Hardware"], 38, "debate"],
  ["PalletTownPete", "2026-08-04", "08:42:00", "Pokemon", "I am officially done buying packs after this next pack", "Please respect my privacy during this difficult and expensive time.", ["Pokemon", "TCG"], 64, "pokemon", "group-pokemon-trade-table"],
  ["Indie Omar", "2026-08-04", "19:33:00", "Recommendations", "Tiny game, gigantic hooks", "Downloaded a little dungeon crawler because the screenshots looked cozy. Three hours later I'm saying things like 'my build needs more onion synergy' out loud. Indie games remain dangerous.", ["Indie", "Discovery"], 22, "mixed"],
  ["JoyConJules", "2026-08-05", "10:26:00", "Questions", "Best Zelda dungeon ever. No essays, unless the essay is good.", "I am taking nominations and also silently judging everyone who forgets Snowpeak Ruins.", ["Zelda", "Debate"], 79, "debate"],
  ["ZoraZoe", "2026-08-05", "10:39:00", "Hot Take", "Twilight Princess has the best dungeon lineup", "Forest Temple into Goron Mines into Lakebed is already strong, then the game keeps throwing weird locations at you like it has something to prove.", ["Zelda", "Nintendo"], 57, "debate"],
  ["MikeD", "2026-08-05", "18:51:00", "Gaming", "Sports games are better when you stop treating them like annual homework", "Grab one every few years, play franchise mode with dumb house rules, ignore the store tab. Peace is possible.", ["Sports", "Backlog"], 18, "mixed"],
  ["CRT Kay", "2026-08-06", "06:58:00", "Screenshots", "CRT corner finally cleaned up", "The shelf is level, the component switcher works, and the SNES looks like a warm blanket. I may never move again.", ["Retro", "Setup"], 88, "media", "group-retro-shelf", mediaAssets[8]],
  ["JakeTheSnake", "2026-08-06", "23:17:00", "Hot Take", "Some of you call anything with crafting 'deep'", "If the game makes me pick up 900 flowers to upgrade a pouch, that is not depth. That is yard work.", ["Hot Takes", "Open World"], 41, "debate"],
  ["GCX Nerds", "2026-08-07", "11:22:00", "GCX", "Friday check-in: what are we playing this weekend?", "Wrong answers accepted. Extra points if your answer is 'the same three games I was supposed to finish in 2024.'", ["Community", "Weekend"], 72, "cozy"],
  ["Trophy Tara", "2026-08-07", "22:08:00", "Personal", "One trophy left and it is the worst one, naturally", "Whoever decided collectibles should make a tiny noise only when you're facing the correct moon phase: I hope your controller batteries die during a cutscene.", ["PlayStation", "Trophies"], 27, "mixed"],
  ["PackLuckLuis", "2026-08-08", "09:31:00", "Pokemon", "Pulled nothing but duplicates and one smug duck", "Another beautiful morning of paying money to be personally insulted by cardboard.", ["Pokemon", "Pulls"], 53, "pokemon", "group-pokemon-trade-table"],
  ["GameCubeGio", "2026-08-08", "14:12:00", "Nostalgia", "GameCube undefeated, chapter 47", "Handle, tiny discs, four ports, purple lunchbox energy. Name one console with more confidence in its own nonsense.", ["GameCube", "Retro"], 96, "debate"],
  ["HorrorHazel", "2026-08-08", "23:44:00", "Questions", "I need a scary game that will not fully ruin my sleep", "Creepy is fine. Constant screaming violins and hallway mannequins are a no from me.", ["Horror", "Recommendations"], 24, "mixed"],
  ["BargainBex", "2026-08-09", "13:05:00", "Collection", "Yard sale win: PS2 slim, two controllers, zero cables", "The hunt continues because apparently every cable in this town evaporated in 2011.", ["PS2", "Deals"], 36, "media", "group-retro-shelf"],
  ["PC Ivy", "2026-08-09", "20:19:00", "Humor", "Me opening graphics settings before starting the actual game", "Texture quality? Ultra. Shadows? High. Motion blur? Sent directly into the sun.", ["PC", "Settings"], 62, "mixed"],
  ["Ashley92", "2026-08-10", "07:47:00", "Pokemon", "Favorite starter line and why is it Totodile?", "I will accept other answers, but I need everyone to understand I am disappointed.", ["Pokemon", "Games"], 45, "pokemon"],
  ["LanPartyLou", "2026-08-10", "21:03:00", "Nostalgia", "LAN parties smelled like pizza boxes and hot plastic", "We had one guy whose entire job was yelling IP addresses across the room. Civilization peaked.", ["PC", "Nostalgia"], 113, "cozy"],
  ["SwitchSasha", "2026-08-11", "16:26:00", "Questions", "Anybody using the Portal more than expected?", "I made fun of the idea and now couch remote play has me looking very foolish.", ["PlayStation", "Handheld"], 29, "mixed"],
  ["NoScopeNia", "2026-08-11", "23:02:00", "Humor", "Nothing humbles you like losing to someone named cereal_bath_2009", "Top fragged the lobby, never spoke, left instantly. A true professional.", ["FPS", "Online"], 84, "mixed"],
  ["Mana Maya", "2026-08-12", "12:21:00", "Recommendations", "Need a JRPG after Expedition 33", "I want party drama, pretty music, and at least one menu that looks like a tax form.", ["JRPG", "Recommendations"], 34, "mixed"],
  ["SleeveSam", "2026-08-12", "18:40:00", "Pokemon", "Binder rule: if the page makes you smile, it is organized correctly", "Rarity order is nice. Color order is nice. Vibes order is undefeated.", ["Pokemon", "Binders"], 51, "pokemon", "group-pokemon-trade-table"],
  ["Rob313", "2026-08-13", "08:11:00", "Hot Take", "Xbox gets clowned too much for a platform with that many good back-compat games", "Not saying everything is perfect. I am saying booting up old stuff with modern convenience still rules.", ["Xbox", "Retro"], 39, "debate"],
  ["PixelPriya", "2026-08-13", "19:55:00", "Indie", "Pixel art games still hit different", "A good idle animation tells me more than a 4K face scan sometimes.", ["Indie", "Art"], 28, "cozy"],
  ["CouchCoopCole", "2026-08-14", "20:08:00", "Questions", "Need couch co-op for me and my wife", "Nothing that requires perfect communication because we are both tired and one of us will absolutely blame the other for jumping too early.", ["Co-op", "Recommendations"], 71, "mixed"],
  ["MomSavepoint", "2026-08-14", "21:37:00", "Personal", "My daughter named every Pokemon 'Sprinkle'", "Sprinkle used Thunderbolt. Sprinkle fainted. Sprinkle evolved. Honestly the franchise is better now.", ["Family", "Pokemon"], 124, "cozy"],
  ["BattlePassBryce", "2026-08-15", "10:44:00", "Hot Take", "Daily challenges made games feel like chores", "I already have email. I do not need a shooter handing me a checklist with rollover anxiety.", ["Live Service", "Hot Takes"], 52, "debate"],
  ["SteamSaleSid", "2026-08-15", "15:09:00", "Humor", "Steam: 80% off. Me: financially, this is free.", "My backlog now has a lobby system.", ["PC", "Deals"], 69, "mixed"],
  ["WiiWanda", "2026-08-15", "19:28:00", "Nostalgia", "The Wii menu music was dangerously peaceful", "You could be moments from losing at bowling to your aunt and still feel centered.", ["Wii", "Nostalgia"], 48, "cozy"],
  ["PokeNora", "2026-08-16", "11:14:00", "Pokemon", "Grading vintage cards stresses me out", "I like protecting cards, but the slab economy makes my brain sound like a dial-up modem.", ["Pokemon", "Grading"], 32, "pokemon"],
  ["SaturnSyd", "2026-08-16", "22:18:00", "Collection", "Saturn import prices are comedy now", "Every time I think I found a deal, shipping appears wearing a villain cape.", ["Saturn", "Collecting"], 21, "mixed"],
  ["GCX Nerds", "2026-08-17", "13:33:00", "Poll", "Best controller ever made?", "Settle a tiny argument that definitely will not become a 90-comment thread.", ["Poll", "Hardware"], 142, "poll", "", "", ["GameCube", "Xbox 360", "DualSense", "SNES", "Switch Pro"]],
  ["MiniMapMax", "2026-08-17", "20:41:00", "Hot Take", "Map icons are good actually", "Sometimes I want mystery. Sometimes I want to turn my brain off and vacuum a map until it says 100%.", ["Open World", "Hot Takes"], 33, "debate"],
  ["FGCFiona", "2026-08-18", "18:06:00", "Gaming", "Local bracket reminder: bring deodorant and patience", "Both are tournament legal.", ["Fighting Games", "Community"], 58, "mixed"],
  ["DreamcastDrew", "2026-08-18", "23:49:00", "Nostalgia", "VMUs were ridiculous and I miss ridiculous hardware", "Why did my memory card need a screen? No idea. Did it make me feel like the future was chunky and blue? Absolutely.", ["Dreamcast", "Retro"], 77, "cozy"],
  ["KirbyKev", "2026-08-19", "09:24:00", "Questions", "What game is pure comfort food for you?", "Mine is Kirby's Epic Yarn. No stress, just vibes and fabric crimes.", ["Cozy", "Questions"], 43, "cozy"],
  ["BossRushBen", "2026-08-19", "22:17:00", "Personal", "Finally beat the optional boss that was bullying me", "No cheese. No summons. Just 47 attempts and the kind of focus I should probably apply to taxes.", ["Souls", "Bosses"], 91, "mixed"],
  ["MaddenMarcus", "2026-08-20", "12:57:00", "Sports", "Franchise mode with house rules is the only way I survive sports games", "No signing every 99 speed player. No trading three backup linemen for a superstar. We are pretending to have morals.", ["Sports", "Madden"], 17, "mixed"],
  ["DSDarla", "2026-08-20", "20:31:00", "Nostalgia", "The DS stylus teeth marks were a whole generation's fingerprint", "Do not pretend you did not chew that thing during a loading screen.", ["DS", "Handheld"], 66, "cozy"],
  ["MegaMiles", "2026-08-21", "10:16:00", "Gaming News", "If Mega Man is back, I am ready to be hurt again", "Hope is a blue helmet and a release window that may or may not survive contact with reality.", ["Mega Man", "Capcom"], 55, "news", "", "", null, "megaMan"],
  ["VanessaVsync", "2026-08-21", "18:02:00", "Hardware", "Motion blur sliders should legally default to off", "I am not asking for much. Just the ability to perceive corners.", ["PC", "Settings"], 44, "mixed"],
  ["GCX Nerds", "2026-08-22", "09:45:00", "GCX", "Gamescom week is almost here", "Drop the one game you need to see more of. We are making a watchlist and pretending we will be calm.", ["GCX", "Gamescom"], 81, "news", "", "", null, "gamescomWatch"],
  ["PalletTownPete", "2026-08-22", "20:12:00", "Pokemon", "Read the GCX 30th hub and my wallet made a noise", "Booster bundles, mini tins, promos... Pokemon said 'anniversary' and my budget left the room.", ["Pokemon", "GCX"], 74, "pokemon", "group-pokemon-trade-table", mediaAssets[0], "pokemonGuide"],
  ["Frame Frank", "2026-08-23", "08:28:00", "Gaming News", "The $1,000 console discourse is making everyone weird", "I get why hardware costs are ugly. I also get why normal people see four digits and simply vanish.", ["Hardware", "Consoles"], 61, "debate"],
  ["Trophy Tara", "2026-08-23", "15:17:00", "Gaming News", "FromSoftware making strange multiplayer stuff is exactly why I pay attention", "Even when I am confused, I am professionally confused.", ["FromSoftware", "Souls"], 47, "news"],
  ["PokeNora", "2026-08-23", "21:36:00", "Pokemon", "Every Pikachu card reveal makes me weaker", "I said I only collect favorites. Unfortunately Pikachu has become 20 favorites wearing costumes.", ["Pokemon", "Pikachu"], 86, "pokemon", "group-pokemon-trade-table", mediaAssets[1], "pokemonGuide"],
  ["JoyConJules", "2026-08-24", "08:04:00", "Gaming News", "Pokemon battle changes? I am listening, nervously", "Just read the GCX piece. If traditional turn-based battles shift, the comment sections may need protective gear.", ["Pokemon", "News"], 103, "news", "", "", null, "pokemonBattles"],
  ["Frame Frank", "2026-08-24", "12:22:00", "Gaming News", "60 FPS patch discourse is proof players notice more than publishers think", "People can feel input delay. People can feel stutter. The 'casuals don't care' line has always been lazy.", ["Performance", "News"], 76, "news"],
  ["CardboardCam", "2026-08-24", "19:08:00", "Pokemon", "Preorder trackers are dangerous", "I opened the GCX MSRP page 'just to look' and now I have four tabs and a moral crisis.", ["Pokemon", "Preorders"], 57, "pokemon", "group-pokemon-trade-table", mediaAssets[2], "pokemonGuide"],
  ["MegaMiles", "2026-08-25", "11:19:00", "Gaming News", "BRO the Mega Man trailer actually has ideas", "Custom chips? Proto Man? Risk/reward power stuff? I am not saying we are back. I am saying I have stood up from my chair.", ["Mega Man", "Gamescom"], 137, "news", "", "", null, "megaMan"],
  ["Rob313", "2026-08-25", "19:44:00", "Gaming News", "Gears looking like Gears again is all I wanted", "Give me chunky reloads, bad weather, and dudes yelling over cover. Innovation can take a lunch break.", ["Gears", "Xbox"], 72, "news"],
  ["FinalFormFaye", "2026-08-25", "21:58:00", "Gaming News", "Final Fantasy trailers know exactly which musical button to press", "The second the choir swells, I am legally no longer responsible for my hype level.", ["Final Fantasy", "JRPG"], 64, "news"],
  ["Indie Omar", "2026-08-26", "07:55:00", "Recommendations", "Play the weird demos during showcase week", "The massive trailers are fun, but the tiny booth game with one strange mechanic is usually where my heart ends up.", ["Indie", "Gamescom"], 26, "mixed"],
  ["NoScopeNia", "2026-08-26", "21:11:00", "Hot Take", "Aim assist arguments are the console wars wearing a fake mustache", "Everybody is convinced the other input is cheating. Meanwhile I am missing shots with both.", ["FPS", "Hot Takes"], 63, "debate"],
  ["SNES Sierra", "2026-08-27", "06:49:00", "Nostalgia", "SNES box art had confidence", "A wizard, a spaceship, a muscular frog, and a logo doing parkour. No notes.", ["SNES", "Art"], 59, "cozy"],
  ["Ashley92", "2026-08-27", "16:12:00", "Questions", "Best Pokemon town music?", "This is secretly a test of emotional stability.", ["Pokemon", "Music"], 49, "pokemon"],
  ["SteamSaleSid", "2026-08-27", "23:25:00", "Humor", "I installed a game to test performance and accidentally started enjoying it", "Benchmarks are a gateway drug.", ["PC", "Backlog"], 37, "mixed"],
  ["BargainBex", "2026-08-28", "12:37:00", "Questions", "What is the max you will pay for a loose retro cart?", "Trying to calibrate whether I am being responsible or just cheap with better branding.", ["Retro", "Collecting"], 28, "mixed", "group-marketplace-watch"],
  ["LoreLena", "2026-08-28", "22:14:00", "Hot Take", "Item descriptions are better storytelling than half the cutscenes out there", "Give me one cracked ring and a sad paragraph. I will build an entire tragedy in my head.", ["Lore", "Souls"], 69, "debate"],
  ["SwitchbackSue", "2026-08-29", "09:02:00", "Humor", "Buying the same game on Switch because it is portable is a medical condition", "I do not need help. I need a bigger microSD card.", ["Switch", "Backlog"], 44, "mixed"],
  ["CardboardCam", "2026-08-29", "18:47:00", "Pokemon", "Sealed collectors have stronger willpower than me", "A booster box sitting unopened in my house emits a frequency only my worst decisions can hear.", ["Pokemon", "Sealed"], 73, "pokemon"],
  ["GameCubeGio", "2026-08-30", "13:13:00", "Poll", "Best Nintendo console?", "Friendly poll. Very friendly. Nobody will be dramatic.", ["Poll", "Nintendo"], 211, "poll", "", "", null, "", ["SNES", "N64", "GameCube", "Wii", "Switch"]],
  ["JakeTheSnake", "2026-08-30", "13:29:00", "Hot Take", "If GameCube wins this poll, I am logging off", "This site is becoming a purple lunchbox support group.", ["Nintendo", "Debate"], 94, "debate"],
  ["CozyCass", "2026-08-30", "21:52:00", "Recommendations", "Need a cozy game with zero debt mechanics", "I simply want to decorate a room and befriend a creature without managing a mortgage.", ["Cozy", "Recommendations"], 32, "cozy"],
  ["PS2Paul", "2026-08-31", "17:18:00", "Nostalgia", "PS2 startup sound still feels like entering a portal", "That floating cube menu had more mystery than entire modern dashboards.", ["PS2", "Nostalgia"], 83, "cozy", "group-retro-shelf"],
  ["PortalPat", "2026-08-31", "23:03:00", "PlayStation", "Portal in bed is dangerously good", "I was a skeptic. Now I am doing side quests horizontally like royalty.", ["PlayStation", "Handheld"], 40, "mixed"],
  ["GCX Nerds", "2026-09-01", "10:10:00", "Poll", "Physical or digital?", "No fence-sitting. Pick your storage anxiety.", ["Poll", "Collecting"], 156, "poll", "", "", null, "", ["Physical forever", "Digital convenience", "Both, chaos", "Game Pass brain"]],
  ["BinderBree", "2026-09-01", "20:45:00", "Pokemon", "Pulled the chase card on pack THREE", "My luck for the rest of 2026 is officially gone. I will now be pulling reverse holo sadness until winter.", ["Pokemon", "Pulls"], 268, "pokemon", "group-pokemon-trade-table", mediaAssets[0]],
  ["Tyler", "2026-09-02", "07:34:00", "Questions", "Do you finish games or just rotate them forever?", "Asking for a friend. The friend is every device I own.", ["Backlog", "Questions"], 39, "mixed"],
  ["CharlieCrits", "2026-09-02", "18:18:00", "Fighting Games", "The best fighting game tutorial is losing to your friend for two hours", "The second best is finally blocking on wakeup one time and acting like you solved math.", ["Fighting Games", "Learning"], 46, "mixed"],
  ["PackLuckLuis", "2026-09-03", "12:11:00", "Pokemon", "Update: still done buying packs", "Bought packs.", ["Pokemon", "Community Joke"], 118, "pokemon", "group-pokemon-trade-table"],
  ["8BitMara", "2026-09-03", "19:20:00", "Retro", "Demo discs were tiny treasure chests", "Sometimes the demo was bad. Sometimes the menu music lived in your head for 20 years.", ["Nostalgia", "PlayStation"], 52, "cozy"],
  ["AmandaGaming", "2026-09-04", "09:27:00", "Screenshots", "Photo mode ate my entire night again", "I took 74 screenshots and progressed the story by approximately six stairs.", ["Screenshots", "PlayStation"], 36, "media", "", mediaAssets[3]],
  ["LagSwitchLee", "2026-09-04", "22:46:00", "Humor", "I only lag when I am losing", "This is not an excuse. It is a lifestyle.", ["Online", "FPS"], 29, "mixed"],
  ["ZoraZoe", "2026-09-05", "11:06:00", "Poll", "Best Zelda dungeon?", "Because apparently we are doing this every week until someone admits I am right.", ["Poll", "Zelda"], 184, "poll", "", "", null, "", ["Forest Temple", "Snowpeak Ruins", "Stone Tower", "Ancient Cistern", "Spirit Temple"]],
  ["QuestQuinn", "2026-09-05", "17:39:00", "RPG", "Side quests with actual stories are my weakness", "Tell me I am delivering soup and somehow reveal a town tragedy. I will abandon the main plot for hours.", ["RPG", "Side Quests"], 42, "mixed"],
  ["CardboardCam", "2026-09-06", "08:56:00", "Pokemon", "Pull rates discourse is half math, half pain", "I know variance is real. I also know the pack that gave me nothing owes me an apology.", ["Pokemon", "Pull Rates"], 67, "pokemon"],
  ["DadModeDan", "2026-09-06", "20:24:00", "Personal", "My son asked why old games look 'crunchy'", "I told him the crunch is where the flavor lives.", ["Family", "Retro"], 101, "cozy"],
  ["PC Ivy", "2026-09-07", "13:48:00", "Hardware", "Shader compilation stutter is the real final boss", "Nothing kills a dramatic entrance like the CPU audibly filing paperwork.", ["PC", "Performance"], 65, "debate"],
  ["BethButton", "2026-09-07", "21:15:00", "Recommendations", "Platformer people: what did I miss this year?", "I want clean jumps, cute art, and maybe one level that makes me question my thumbs.", ["Platformers", "Recommendations"], 24, "mixed"],
  ["GCX Nerds", "2026-09-08", "11:04:00", "GCX", "Community challenge: show us the oldest game you still replay", "Bonus points for save files older than some Discord users.", ["Community", "Retro"], 90, "cozy"],
  ["RetroRina", "2026-09-08", "18:12:00", "Collection", "Found an old strategy book with handwritten notes inside", "Someone circled a boss weakness and wrote 'NOPE' next to the optional dungeon. I respect them deeply.", ["Strategy Books", "Nostalgia"], 119, "media", "group-retro-shelf", mediaAssets[8]],
  ["JRPGJalen", "2026-09-09", "07:29:00", "JRPG", "A good JRPG menu makes me feel powerful", "Stats, jobs, affinities, equipment, recipes, lore tabs. Give me a command center for my little drama squad.", ["JRPG", "Menus"], 33, "mixed"],
  ["SonicSal", "2026-09-09", "22:10:00", "Hot Take", "Sonic is best when it stops apologizing for being weird", "Give me loops, chaos emerald nonsense, and one song that has no business going that hard.", ["Sega", "Hot Takes"], 54, "debate"],
  ["PokeNora", "2026-09-10", "12:03:00", "Pokemon", "Vintage card smell is real", "I cannot explain it without sounding haunted, but Base Set bulk has a smell and you know it.", ["Pokemon", "Vintage"], 48, "pokemon"],
  ["SpeedyRen", "2026-09-10", "19:51:00", "Speedrun", "Watching a runner save 0.3 seconds makes me cheer like sports", "Human beings were not meant to care this much about ladder animations and yet here we are.", ["Speedruns", "Streaming"], 58, "mixed", "group-streamer-campaigns"],
  ["VanessaVsync", "2026-09-11", "08:39:00", "Poll", "Performance mode or quality mode?", "Be honest. Nobody can see your TV from here.", ["Poll", "Performance"], 128, "poll", "", "", null, "", ["Performance", "Quality", "Balanced", "Whatever Digital Foundry says"]],
  ["HorrorHazel", "2026-09-11", "23:11:00", "Horror", "Games with radios crackling should pay me emotional damages", "Static starts and suddenly I am bargaining with the pause menu.", ["Horror", "Silent Hill"], 45, "mixed"],
  ["SwitchSasha", "2026-09-12", "10:22:00", "Switch", "Handheld mode hides so many sins", "Game drops frames? I am under a blanket. I forgive it.", ["Switch", "Handheld"], 37, "mixed"],
  ["BargainBex", "2026-09-12", "16:44:00", "Marketplace", "Price check etiquette should be simple", "Post condition, region, what's included, and whether the disc looks like it fought a sidewalk.", ["Marketplace", "Collecting"], 35, "mixed", "group-marketplace-watch"],
  ["Frame Frank", "2026-09-13", "13:06:00", "Hot Take", "Graphics did not peak. Art direction did.", "Give me a game with a point of view over another expensive gray hallway any day.", ["Art", "Hot Takes"], 82, "debate"],
  ["Mana Maya", "2026-09-13", "21:31:00", "Personal", "Finished a 70-hour RPG and now I do not know who I am", "The credits ended and my room felt too quiet. This is why we keep backup JRPGs.", ["JRPG", "Feelings"], 55, "cozy"],
  ["GCX Nerds", "2026-09-14", "09:18:00", "Poll", "Best Pokemon generation?", "We are asking for science and definitely not because the staff chat is arguing.", ["Poll", "Pokemon"], 233, "poll", "group-pokemon-trade-table", "", null, "", ["Gen 1", "Gen 2", "Gen 3", "Gen 4", "Gen 5", "Gen 6+"]],
  ["PalletTownPete", "2026-09-14", "12:44:00", "Pokemon", "Gen 2 kids are built different", "Day/night cycle, two regions, weird little phone calls. Gold/Silver felt illegal to own as a child.", ["Pokemon", "Games"], 89, "pokemon"],
  ["JakeTheSnake", "2026-09-14", "20:02:00", "Hot Take", "Gen 1 nostalgia is doing Olympic-level lifting", "I love it too, but some of those sprites looked like they were described over the phone.", ["Pokemon", "Hot Takes"], 76, "debate"],
  ["SleeveSam", "2026-09-15", "07:52:00", "Pokemon", "Sleeves before binders. Binders before bragging.", "This has been your morning public service announcement.", ["Pokemon", "Cards"], 31, "pokemon"],
  ["NoScopeNia", "2026-09-15", "22:38:00", "FPS", "If your squad says 'one more' at midnight, you are doomed", "That is not one more. That is a contract with chaos.", ["FPS", "Friends"], 51, "mixed"],
  ["CozyCass", "2026-09-16", "17:09:00", "Questions", "What game has the best fishing minigame?", "I do not care if the main plot is ending. There is a pond and I have priorities.", ["Cozy", "Questions"], 61, "cozy"],
  ["Rob313", "2026-09-16", "21:54:00", "Xbox", "Halo optimism is a renewable resource", "Every few years I say 'maybe this time' and honestly I respect my own commitment.", ["Halo", "Xbox"], 44, "mixed"],
  ["Tyler", "2026-09-17", "08:17:00", "Questions", "What is the one franchise you wish you could erase from memory and replay?", "Not because you hate it. Because you want that first run back.", ["Questions", "Nostalgia"], 87, "cozy"],
  ["LoreLena", "2026-09-17", "19:29:00", "Souls", "Bloodborne first playthrough memory wipe would be dangerous", "I would give too much to walk into Central Yharnam clueless again.", ["Souls", "PlayStation"], 74, "cozy"],
  ["CardboardCam", "2026-09-18", "13:26:00", "Pokemon", "Modern full arts are gorgeous but vintage holos still have magic", "Not better. Different. Like shiny arcade carpet versus museum lighting.", ["Pokemon", "Vintage"], 58, "pokemon"],
  ["FGCFiona", "2026-09-18", "23:07:00", "Hot Take", "Button mashers are important to fighting games", "They expose fake pressure and humble people who learned one combo from YouTube.", ["Fighting Games", "Hot Takes"], 66, "debate"],
  ["GCX Nerds", "2026-09-19", "10:33:00", "GCX", "Saturday shelf thread", "Post your cleanest shelf, messiest shelf, or 'I swear I know where everything is' shelf.", ["Community", "Collection"], 107, "media"],
  ["SaturnSyd", "2026-09-19", "16:21:00", "Collection", "Import shelf looking dangerous", "Every spine is beautiful and every price tag was a negotiation with future me.", ["Saturn", "Collection"], 63, "media", "group-retro-shelf", mediaAssets[9]],
  ["MaddenMarcus", "2026-09-20", "12:15:00", "Sports", "The best sports game is the one your friends still know how to play", "Realism is cool. Four people yelling on the couch is better.", ["Sports", "Co-op"], 23, "mixed"],
  ["JoyConJules", "2026-09-20", "20:18:00", "Nintendo", "Motion controls were not the problem", "Bad motion controls were the problem. Wii Sports bowling remains more powerful than most AAA tutorials.", ["Nintendo", "Wii"], 71, "debate"],
  ["AmandaGaming", "2026-09-21", "09:41:00", "Questions", "Do you rename RPG party members?", "I never do because the dramatic cutscenes become impossible to take seriously when the hero is named Bean.", ["RPG", "Questions"], 34, "mixed"],
  ["SteamSaleSid", "2026-09-21", "21:07:00", "Humor", "Backlog math", "If I buy three games and finish one, that's progress because the ratio had vibes.", ["Backlog", "Humor"], 42, "mixed"],
  ["GCX Nerds", "2026-09-22", "13:00:00", "Poll", "What console library should GCX clean up next?", "Pick the shelf we should obsess over next.", ["Poll", "GCX"], 98, "poll", "", "", null, "", ["PS2", "GameCube", "Xbox 360", "DS", "Dreamcast"]],
  ["CRT Kay", "2026-09-22", "20:36:00", "Retro", "Please clean up Dreamcast because the weird games deserve sunlight", "Also because Drew will stop texting me VMU pictures. Maybe.", ["Dreamcast", "GCX"], 36, "mixed", "group-retro-shelf"],
  ["Rob313", "2026-09-23", "11:02:00", "Gaming News", "Activision on Halo is either terrifying or fascinating", "Read the GCX article and I still do not know whether to be excited or hide under the Warthog.", ["Halo", "GCX"], 93, "news", "", "", null, "halo"],
  ["Uncle Rob313", "2026-09-23", "11:11:00", "Xbox", "Also yes I am still optimistic", "Do not screenshot this unless it goes well.", ["Xbox", "Halo"], 48, "mixed"],
  ["HorrorHazel", "2026-09-24", "12:28:00", "Gaming News", "Silent Hill in first person is going to test me", "I love horror, but first-person horror makes my soul try to exit through the nearest window.", ["Silent Hill", "Horror"], 83, "news", "", "", null, "silentHill"],
  ["MiniMapMax", "2026-09-24", "13:45:00", "Gaming News", "Control hotfix going after combat complaints is a good sign", "A weird game can stay weird. The shooting still has to feel right.", ["Control", "Remedy"], 52, "news", "", "", null, "control"],
  ["Ashley92", "2026-09-24", "20:09:00", "Gaming News", "Minecraft Live always pulls me back in", "I say I am just checking the announcements and then suddenly I am planning a house shaped like a frog.", ["Minecraft", "News"], 57, "news", "", "", null, "minecraftLive"],
  ["PalletTownPete", "2026-09-25", "18:58:00", "Pokemon", "Classic Collection not being tournament legal makes sense but still hurts", "My binder brain and my deck brain are currently arguing in the parking lot.", ["Pokemon", "GCX"], 72, "pokemon", "group-pokemon-trade-table", "", "tournamentLegal"],
  ["PokeNora", "2026-09-25", "19:12:00", "Pokemon", "Pokemon ex guaranteed in every Pocket deluxe pack is dangerous language", "Guaranteed hits make my responsible adult brain disappear behind a curtain.", ["Pokemon", "Pocket"], 65, "pokemon", "", "", null, "pocketMega"],
  ["JakeTheSnake", "2026-09-25", "19:44:00", "Gaming News", "$4.5 million piracy judgment is the most Nintendo sentence ever", "Nintendo legal department probably has boss music.", ["Nintendo", "News"], 82, "news"],
  ["JRPGJalen", "2026-09-25", "21:03:00", "Gaming News", "Obsidian keeping its identity matters", "Studios getting shuffled around is one thing. Losing the weird voice that made people care is the real fear.", ["Xbox", "Obsidian"], 54, "news", "", "", null, "obsidian"],
  ["PackLuckLuis", "2026-09-26", "09:18:00", "Pokemon", "Bought one mini tin. Just one.", "It had nothing. I bought another. This is not a story about wisdom.", ["Pokemon", "Pulls"], 107, "pokemon", "group-pokemon-trade-table"],
  ["DadModeDan", "2026-09-26", "14:50:00", "Family", "My kid called Link 'Zelda's coworker'", "I corrected him and then realized he somehow made Hyrule sound like an office sitcom.", ["Family", "Zelda"], 149, "cozy"],
  ["GameCubeGio", "2026-09-26", "21:26:00", "Nintendo", "GameCube poll truthers, we ride", "The people have spoken and they have excellent taste.", ["GameCube", "Community Joke"], 88, "debate"],
  ["Frame Frank", "2026-09-27", "08:08:00", "Hardware", "AI upscaling on base PS5 could be huge if it is clean", "The GCX article has me curious. If this saves performance modes from soup resolution, I am very interested.", ["PS5", "Performance"], 77, "news", "", "", null, "ps5Upscaling"],
  ["PortalPat", "2026-09-27", "20:04:00", "PlayStation", "If QSSR helps remote play clarity, I may become unbearable", "I already talk too much about the Portal. Please prepare accordingly.", ["PS5", "Portal"], 31, "mixed"],
  ["NoScopeNia", "2026-09-28", "17:43:00", "FPS", "Ranked mode makes normal sentences sound insane", "'Rotate gas side and hold roof' is a thing I said while eating cereal.", ["FPS", "Ranked"], 39, "mixed"],
  ["BargainBex", "2026-09-28", "22:32:00", "Marketplace", "Marketplace wish: condition photos before price flexing", "Show corners, backs, discs, manuals, battery doors. Let us be nerds responsibly.", ["Marketplace", "Trust"], 45, "mixed", "group-marketplace-watch"],
  ["GCX Nerds", "2026-09-29", "11:37:00", "Poll", "One franchise you could erase from memory and replay?", "You get one clean first playthrough. Choose carefully.", ["Poll", "Nostalgia"], 176, "poll", "", "", null, "", ["Zelda", "Pokemon", "Mass Effect", "Dark Souls", "Final Fantasy", "Halo"]],
  ["LoreLena", "2026-09-29", "21:41:00", "Souls", "Dark Souls with no memory would ruin me again", "I would walk into the graveyard first, get folded, and somehow still call it art.", ["Dark Souls", "Nostalgia"], 63, "cozy"],
  ["CouchCoopCole", "2026-09-30", "18:35:00", "Co-op", "Update: Overcooked was a mistake", "We are still married, but the onion incident will be discussed at a later date.", ["Co-op", "Family"], 112, "cozy"],
  ["MomSavepoint", "2026-09-30", "19:02:00", "Co-op", "Do not play Overcooked when everyone is hungry", "That is not a game. That is a mirror.", ["Co-op", "Advice"], 86, "cozy"],
  ["SleeveSam", "2026-10-01", "08:16:00", "Pokemon", "Reminder: penny sleeves are cheaper than regret", "I watched someone raw-dog a holo into a backpack pocket and aged three years.", ["Pokemon", "Cards"], 51, "pokemon"],
  ["GCX Nerds", "2026-10-01", "20:27:00", "GCX", "October launch week energy", "News, cards, horror games, and everyone pretending they are not buying more than planned. Very normal month.", ["GCX", "October"], 69, "mixed"],
  ["PalletTownPete", "2026-10-02", "20:47:00", "Pokemon", "The 30th Celebration products are actually here", "GCX posted the bundle breakdown and I am staring at mini tins like they owe me rent.", ["Pokemon", "GCX"], 154, "pokemon", "group-pokemon-trade-table", mediaAssets[0], "pokemonBundles"],
  ["FinalFormFaye", "2026-10-02", "20:56:00", "Gaming News", "Jace breaking the multiverse is very on brand", "Magic lore heard 'stable timeline' and simply declined.", ["Magic", "TCG"], 43, "news", "", "", null, "mtgReality"],
  ["Rob313", "2026-10-02", "21:07:00", "Gaming News", "Gears early access being live has me clearing the evening", "I had plans. The plans are now active reloads.", ["Gears", "Xbox"], 96, "news", "", "", null, "gearsEarly"],
  ["Frame Frank", "2026-10-02", "21:18:00", "PlayStation", "Base PS5 upscaling support is the kind of nerdy update I love", "Give old hardware more tricks. That is the good stuff.", ["PS5", "Hardware"], 59, "news", "", "", null, "ps5Upscaling"],
  ["HorrorHazel", "2026-10-02", "23:41:00", "Horror", "October horror backlog begins now", "I have selected three scary games and one cheerful platformer for emotional support.", ["Horror", "October"], 58, "mixed"],
  ["GCX Nerds", "2026-10-03", "09:09:00", "Poll", "What are you playing this weekend?", "Launch-week chaos edition.", ["Poll", "Weekend"], 121, "poll", "", "", null, "", ["Pokemon cards", "Gears", "Horror backlog", "Retro replay", "Whatever is on sale"]],
  ["BinderBree", "2026-10-03", "10:24:00", "Pokemon", "My son pulled the card I have chased for two months", "He said 'is this one shiny?' while I was experiencing a full spiritual event.", ["Pokemon", "Family"], 301, "pokemon", "group-pokemon-trade-table", mediaAssets[1]],
  ["GameCubeGio", "2026-10-03", "12:38:00", "Retro", "Putting a GameCube next to modern consoles is comedy", "Tiny purple handle box sitting there like it already knows it won.", ["GameCube", "Retro"], 117, "debate", "group-retro-shelf"],
  ["Indie Omar", "2026-10-03", "15:11:00", "Recommendations", "Nobody told me this puzzle game was THIS good", "I downloaded it because I was bored and somehow missed lunch. This is a formal complaint and a recommendation.", ["Indie", "Discovery"], 46, "mixed"],
  ["GCX Nerds", "2026-10-03", "18:22:00", "GCX", "This place got loud fast and we love it", "Keep the pulls, shelves, spicy takes, and controller arguments coming. Also please stop making us choose between Snowpeak and Forest Temple. It hurts.", ["Community", "GCX"], 167, "cozy"],
];

const extraTemplates = [
  ["QuestQuinn", "Questions", "What game has the best opening hour?", "I want the one that grabs you before the tutorial gobbles the whole evening.", ["Questions", "Design"], "mixed"],
  ["SwitchSasha", "Switch", "Switch screenshots are my vacation photos", "Every trip in my camera roll: food, skyline, tiny Link standing near a sunset.", ["Switch", "Screenshots"], "media"],
  ["PokeNora", "Pokemon", "Modern Pokemon menus need more personality", "Give me weird little sounds and chunky sprites. Sterile menus make collecting feel like banking.", ["Pokemon", "Games"], "pokemon"],
  ["Tyler", "Questions", "What game did you bounce off once and later love?", "Mine was Monster Hunter. First try: confusion. Second try: 80 hours and armor spreadsheets.", ["Questions", "Backlog"], "mixed"],
  ["PC Ivy", "Hardware", "Ultrawide support should not feel like a luxury request", "I bought the rectangle. Please let the game understand the rectangle.", ["PC", "Hardware"], "debate"],
  ["RetroRina", "Nostalgia", "Gaming magazines made rumors feel magical", "A blurry screenshot and two paragraphs could power a whole month of cafeteria arguments.", ["Nostalgia", "Magazines"], "cozy"],
  ["NoScopeNia", "FPS", "The first match of the night is always a lie", "Either you are unstoppable or you forgot how thumbs work. No middle.", ["FPS", "Online"], "mixed"],
  ["CardboardCam", "Pokemon", "Opening packs in the car has cursed energy", "The lighting is bad, the suspense is high, and the receipt is judging you.", ["Pokemon", "Pulls"], "pokemon"],
  ["ZoraZoe", "Zelda", "Water temples are mostly fine now", "We are all still yelling at ghosts from 1998.", ["Zelda", "Hot Takes"], "debate"],
  ["SteamSaleSid", "Humor", "Wishlist notifications are attacks", "I was minding my business and Steam kicked in the door with a 67% discount.", ["Deals", "PC"], "mixed"],
  ["DadModeDan", "Personal", "Gaming with kids means explaining save points like they are sacred law", "No, we cannot turn it off anywhere. Yes, this is why dad looks stressed.", ["Family", "Gaming"], "cozy"],
  ["FGCFiona", "Fighting Games", "Every fighting game has one character who exists to annoy your group chat", "You know the one. The patch notes know the one.", ["Fighting Games", "Balance"], "debate"],
  ["JoyConJules", "Nintendo", "Nintendo trailers are engineered to weaken me", "I can be responsible all week and then one whimsical flute ruins the budget.", ["Nintendo", "Trailers"], "news"],
  ["Mana Maya", "JRPG", "The airship moment still works every time", "World map opens up, music changes, suddenly I forgive every fetch quest.", ["JRPG", "Nostalgia"], "cozy"],
  ["BargainBex", "Marketplace", "Loose manuals should not cost more than dinner", "Collector pricing has entered its villain era.", ["Marketplace", "Retro"], "debate"],
  ["LagSwitchLee", "Humor", "I do not rage quit. I perform emotional bandwidth management.", "Sometimes that management involves closing the game very quickly.", ["Online", "Humor"], "mixed"],
  ["CRT Kay", "Retro", "Scanlines are seasoning", "Too much is bad. None at all and the meal feels wrong.", ["Retro", "CRT"], "cozy"],
  ["AmandaGaming", "Screenshots", "Accidentally made a boss fight look like an album cover", "Photo mode remains undefeated when the lighting gets dramatic.", ["Screenshots", "Photo Mode"], "media"],
  ["KirbyKev", "Cozy", "Sometimes the hard game is admitting you want the easy game", "I love a challenge. I also love floating through a level as a pink orb with no emails.", ["Cozy", "Nintendo"], "cozy"],
  ["Miked", "Sports", "Arcade sports games need a comeback", "Give me fake teams, huge dunks, turbo meters, and announcers losing their minds.", ["Sports", "Arcade"], "mixed"],
  ["VanessaVsync", "Hardware", "120 Hz menus have ruined me", "Once the cursor glides, regular menus feel like they are walking through syrup.", ["Hardware", "PC"], "mixed"],
  ["DreamcastDrew", "Dreamcast", "Dreamcast startup swirl still has style", "That little beep lives rent free in a very specific corner of my brain.", ["Dreamcast", "Nostalgia"], "cozy"],
  ["BattlePassBryce", "Live Service", "The cosmetic store refreshed and I felt nothing", "Growth. Or maybe the skins were just ugly.", ["Live Service", "Humor"], "mixed"],
  ["PS2Paul", "Retro", "PS2 horror game prices need a wellness check", "Every listing looks like it is trying to finance a small boat.", ["PS2", "Horror"], "debate"],
  ["SpeedyRen", "Speedrun", "Bad RNG is funnier when it happens to someone else", "When it happens to me, it is a documented injustice.", ["Speedrun", "Humor"], "mixed"],
  ["PalletTownPete", "Pokemon", "I miss weird Pokemon spinoffs", "Give me pinball, puzzle leagues, photography, questionable peripherals. Let the brand be strange.", ["Pokemon", "Spinoffs"], "pokemon"],
  ["GCX Nerds", "GCX", "Tiny community prompt: most underrated console sound?", "Startup, menu, achievement pop, disc drive noise. We accept all deeply specific answers.", ["Community", "Audio"], "cozy"],
  ["SleeveSam", "Pokemon", "Toploaders make everything feel official", "Even a mid pull looks like it has legal representation once it is in a toploader.", ["Pokemon", "Cards"], "pokemon"],
  ["HorrorHazel", "Horror", "Save rooms are emotional support rooms", "If the music is calm and there is a typewriter, I am staying for 12 minutes.", ["Horror", "Resident Evil"], "cozy"],
  ["JakeTheSnake", "Hot Take", "Not every game needs crafting", "Sometimes a sword can just be a sword. It does not need three mushrooms and a sad rock.", ["Hot Takes", "Design"], "debate"],
  ["FinalFormFaye", "JRPG", "Boss themes should be allowed to overreact", "If the villain has wings now, I expect drums, choir, and at least one Latin-adjacent syllable.", ["JRPG", "Music"], "cozy"],
  ["MomSavepoint", "Family", "The kids discovered character creators", "We have not started the game. We have created six neon-green dads and one princess with sunglasses.", ["Family", "Character Creator"], "cozy"],
  ["8BitMara", "Retro", "Battery saves are tiny miracles", "A cartridge remembering anything after decades feels like wizardry with corrosion risk.", ["Retro", "Collecting"], "cozy"],
  ["Frame Frank", "Performance", "A good 40 FPS mode is underrated", "120 Hz displays quietly made console options way more interesting.", ["Performance", "Consoles"], "debate"],
  ["BinderBree", "Pokemon", "Binder page finally finished", "Nine cards, one theme, zero financial wisdom. It looks beautiful.", ["Pokemon", "Binders"], "pokemon"],
  ["Rob313", "Xbox", "Backwards compatibility is still one of the best modern features", "Letting old purchases breathe on new hardware should be normal everywhere.", ["Xbox", "Back Compat"], "mixed"],
  ["CozyCass", "Cozy", "Inventory sorting is either meditation or war", "There is no neutral grid management.", ["Cozy", "Inventory"], "mixed"],
  ["N64Nate", "N64", "Four-player split screen built friendships and grudges", "You learned who peeked at screens and you never forgot.", ["N64", "Multiplayer"], "cozy"],
  ["Indie Omar", "Indie", "Short games are not lesser games", "A tight four-hour game that knows what it is doing deserves more respect.", ["Indie", "Hot Takes"], "debate"],
  ["CardboardCam", "Pokemon", "The rarest pull is self-control", "Still chasing it.", ["Pokemon", "Humor"], "pokemon"],
  ["WiiWanda", "Wii", "Miis had stronger identity than most avatars", "Two dots and a mouth somehow captured your uncle perfectly.", ["Wii", "Nostalgia"], "cozy"],
  ["PortalPat", "PlayStation", "Remote play turns grinding into background television", "Side quests from bed hit different.", ["PlayStation", "Portal"], "mixed"],
  ["CharlieCrits", "Fighting Games", "Training mode lies until ranked tells the truth", "That combo was real in the lab. Online it became interpretive dance.", ["Fighting Games", "Ranked"], "mixed"],
  ["Ashley92", "Pokemon", "Favorite Eeveelution is a personality test", "I will not explain but I will judge.", ["Pokemon", "Questions"], "pokemon"],
  ["SaturnSyd", "Retro", "Import collecting requires optimism and translation apps", "Sometimes the menu is obvious. Sometimes I accidentally format something and learn fear.", ["Retro", "Imports"], "mixed"],
  ["MegaMiles", "Retro", "Capcom sound effects have permanent brain residence", "One charged shot sound and I am eight years old again.", ["Capcom", "Nostalgia"], "cozy"],
  ["PokeNora", "Pokemon", "Set binders by art style, not number", "It makes no sense to spreadsheet people and perfect sense to my eyeballs.", ["Pokemon", "Binders"], "pokemon"],
  ["Tyler", "Questions", "What is your weird gaming superstition?", "I save twice. Sometimes three times. The third save is for the ancestors.", ["Questions", "Habits"], "mixed"],
  ["GCX Nerds", "GCX", "Community reminder: spicy takes are fine, being gross is not", "Argue about controllers like civilized weirdos.", ["Community", "Moderation"], "mixed"],
  ["Trophy Tara", "PlayStation", "Collectible trophies should come with mercy pings", "Do not make me stare at a walkthrough video from 2017 while jumping at a wall.", ["PlayStation", "Trophies"], "mixed"],
  ["SonicSal", "Sega", "Dreamcast and GameCube fans are cousins", "Both groups own tiny discs and suspicious levels of confidence.", ["Sega", "GameCube"], "debate"],
  ["JRPGJalen", "JRPG", "Optional superbosses are just exams with theme music", "And yes, I studied by grinding in a hallway.", ["JRPG", "Bosses"], "mixed"],
  ["MiniMapMax", "Open World", "Climbing towers is still satisfying", "Even when I know it is busywork, my brain sees map fog disappear and claps.", ["Open World", "Maps"], "mixed"],
  ["PackLuckLuis", "Pokemon", "I pulled the same holo again", "We are in a committed relationship apparently.", ["Pokemon", "Pulls"], "pokemon"],
  ["BethButton", "Platformers", "Wall jumps should feel clicky", "If the wall jump is mushy, the whole game starts on probation.", ["Platformers", "Design"], "mixed"],
  ["LanPartyLou", "Nostalgia", "Bringing your own CRT to a friend's house was peak commitment", "Spine? Gone. Memories? Permanent.", ["Nostalgia", "CRT"], "cozy"],
  ["SwitchbackSue", "Deals", "Double dipping is easier when the sale is rude", "I already own it, but I do not own it portably for $6.79.", ["Deals", "Switch"], "mixed"],
  ["N64Nate", "N64", "The N64 controller made sense if you believed hard enough", "Three handles. One destiny.", ["N64", "Controllers"], "debate"],
  ["8BitMara", "Retro", "Old save files feel like time capsules", "Who was I in 2004 and why did I name every RPG hero Vash?", ["Retro", "Saves"], "cozy"],
  ["PokeNora", "Pokemon", "Pokemon rumors need a three-source rule", "Friend's cousin's Discord screenshot does not count, even if the font is convincing.", ["Pokemon", "Rumors"], "debate"],
  ["Rob313", "Xbox", "Game Pass is best when you use it for weird swings", "Do not just install the obvious thing. Try the game with a crab, a sad robot, or a 12-word subtitle.", ["Xbox", "Game Pass"], "mixed"],
  ["CozyCass", "Recommendations", "Recommend me games with autumn energy", "Crunchy leaves, warm lights, maybe one friendly witch.", ["Cozy", "Recommendations"], "cozy"],
  ["Frame Frank", "Hardware", "Input latency is a feeling before it is a number", "You know when jump feels late. The spreadsheet just gives the frustration a name.", ["Hardware", "Performance"], "debate"],
  ["GCX Nerds", "GCX", "What should become a recurring GCX community night?", "Retro replay, pack opening, screenshot thread, boss help, or something stranger?", ["Community", "Events"], "cozy"],
  ["SleeveSam", "Pokemon", "Card shops are dangerous social spaces", "You go in for sleeves and leave debating centering with a stranger named Dave.", ["Pokemon", "Local Shops"], "pokemon"],
  ["NoScopeNia", "FPS", "Patch notes are gamer horoscopes", "My main got buffed, so naturally this is a sign the universe believes in me.", ["FPS", "Patch Notes"], "mixed"],
  ["Mana Maya", "JRPG", "I love when the party camp banter changes after story beats", "Tiny optional dialogue is how games steal my heart.", ["JRPG", "Writing"], "cozy"],
  ["BargainBex", "Deals", "The best deal is the one you actually play", "I say this while adding three $4 games to cart.", ["Deals", "Backlog"], "mixed"],
  ["HorrorHazel", "Horror", "Flashlight batteries in horror games are personally rude", "I am already scared. Must I also manage a hardware store?", ["Horror", "Hot Takes"], "debate"],
  ["GameCubeGio", "GameCube", "WaveBird battery life was unreal", "Modern controllers could learn from that little gray brick.", ["GameCube", "Controllers"], "cozy"],
  ["Ashley92", "Questions", "What sequel improved the most over the first game?", "Looking for big glow-up energy.", ["Questions", "Sequels"], "mixed"],
  ["PC Ivy", "PC", "PC gaming is just troubleshooting with occasional dragons", "Still worth it. Usually.", ["PC", "Humor"], "mixed"],
  ["DadModeDan", "Family", "The pause button is the greatest accessibility feature for parents", "Every boss fight should respect snack emergencies.", ["Family", "Accessibility"], "cozy"],
  ["FinalFormFaye", "Music", "What game soundtrack lives in your head rent free?", "Mine changes weekly, but the answer currently has too many violins.", ["Music", "Questions"], "cozy"],
  ["Indie Omar", "Indie", "The weirder the Steam tags, the more interested I get", "Fishing horror deckbuilder? Sure. Emotional train gardening? Absolutely.", ["Indie", "Steam"], "mixed"],
];

const commentBank = [
  ["ZoraZoe", "Snowpeak Ruins alone makes this argument respectable."],
  ["JoyConJules", "THANK YOU. The soup mansion deserves its crown."],
  ["N64Nate", "Counterpoint: Forest Temple still has the vibes."],
  ["GameCubeGio", "The poll is democracy and democracy chose the handle cube."],
  ["JakeTheSnake", "This is exactly the purple propaganda I feared."],
  ["PalletTownPete", "I have said 'one more pack' so many times it should be my legal name."],
  ["SleeveSam", "Please sleeve it before the adrenaline wears off."],
  ["BinderBree", "The car pull curse is real but so is the car pull magic."],
  ["Frame Frank", "Stable pacing over messy peaks, every time."],
  ["VanessaVsync", "40 FPS modes on 120 Hz displays are secretly the grown-up answer."],
  ["PC Ivy", "Motion blur off before subtitles on. Ritual order matters."],
  ["DadModeDan", "Kids are undefeated at saying the most disrespectful true thing."],
  ["MomSavepoint", "Sprinkle is canon now. Sorry, Nintendo."],
  ["CouchCoopCole", "Overcooked should come with premarital counseling."],
  ["NoScopeNia", "Cereal players are always cracked. Never challenge a breakfast tag."],
  ["LagSwitchLee", "Wi-Fi only betrays me when witnesses are present."],
  ["Indie Omar", "This is why I try every demo with screenshots that look mildly cursed."],
  ["CozyCass", "Zero debt mechanics is such a beautiful phrase."],
  ["HorrorHazel", "Save room music is legally a weighted blanket."],
  ["LoreLena", "A sad paragraph on a rusty key can destroy me."],
  ["Rob313", "Back compat is preservation with a convenient button."],
  ["Trophy Tara", "Collectible trophies turn strong people into detectives with no sleep."],
  ["CRT Kay", "Scanlines are seasoning is going on my wall."],
  ["LanPartyLou", "The IP address yelling guy was the real server admin."],
  ["DreamcastDrew", "VMU supremacy remains undefeated."],
  ["GCX Nerds", "This thread is why we built the community page in the first place 😂"],
  ["Ashley92", "Totodile people are loud because we are correct."],
  ["PokeNora", "Gen 2 really did feel impossible at the time."],
  ["CardboardCam", "Sealed product whispers at night. I will not elaborate."],
  ["BargainBex", "Shipping is always the final boss."],
  ["FGCFiona", "Button mashers reveal your fake strings and your ego."],
  ["CharlieCrits", "Training mode confidence evaporates online. Science should study it."],
  ["SpeedyRen", "Saving 0.3 seconds is basically winning the lottery with more resets."],
  ["MegaMiles", "I stood up at Proto Man too. No shame."],
  ["FinalFormFaye", "Choir enters, wallet exits."],
  ["MaddenMarcus", "House rules save franchise mode from itself."],
  ["SwitchSasha", "Handheld forgiveness is real."],
  ["PortalPat", "Horizontal side quests are the future."],
  ["Tyler", "I save twice because I trust nothing and no one."],
  ["JRPGJalen", "A twelve-tab menu is a welcome mat."],
  ["Mana Maya", "Backup JRPGs are an emergency preparedness category."],
  ["AmandaGaming", "Six stairs and 74 screenshots is efficient art direction."],
  ["SaturnSyd", "Translation apps have saved me from many mysterious menu crimes."],
  ["WiiWanda", "Miis captured souls with four shapes and a dream."],
  ["PS2Paul", "That PS2 cube menu still feels haunted in the best way."],
  ["BethButton", "Mushy wall jumps are a personal betrayal."],
  ["SteamSaleSid", "A 67% discount is basically a jump scare."],
  ["MiniMapMax", "Map fog disappearing is my comfort animation."],
  ["BattlePassBryce", "I hate daily challenges while completing all of them. Growth is complicated."],
  ["SwitchbackSue", "Portable duplicate copies count as separate emotional needs."],
  ["N64Nate", "Three handles made sense spiritually."],
  ["SNES Sierra", "SNES box art was allergic to subtlety and I love it."],
  ["SonicSal", "Dreamcast and GameCube fans share one brain cell and a tiny disc."],
  ["QuestQuinn", "Soup delivery side quest tragedy is exactly my kind of evening."],
  ["MomSavepoint", "Snack emergency pause rights should be universal."],
  ["PalletTownPete", "My budget did not survive the mini tin paragraph."],
  ["BinderBree", "That pull deserves a top loader and a dramatic chair spin."],
  ["GCX Nerds", "Okay this has officially become a recurring debate."],
  ["JakeTheSnake", "Aggressively mid take from me: not every beloved game aged well."],
  ["JoyConJules", "Motion controls had vision. Sometimes terrible vision, but vision."],
  ["Frame Frank", "Input latency is absolutely a feeling first."],
  ["HorrorHazel", "First-person horror is cardio for people standing still."],
  ["Rob313", "Do not screenshot my optimism unless it becomes correct."],
  ["PokeNora", "Three-source rule should be pinned above every rumor thread."],
  ["SleeveSam", "Dave at the card shop knows centering better than weather."],
  ["NoScopeNia", "Patch notes are horoscopes and my main is a Scorpio."],
  ["CRT Kay", "Component cables belong in museums and also my living room."],
];

const commentPools = {
  pokemon: [
    ["PalletTownPete", "I have said 'one more pack' so many times it should be my legal name."],
    ["SleeveSam", "Please sleeve it before the adrenaline wears off."],
    ["BinderBree", "The car pull curse is real but so is the car pull magic."],
    ["PokeNora", "Gen 2 really did feel impossible at the time."],
    ["CardboardCam", "Sealed product whispers at night. I will not elaborate."],
    ["SleeveSam", "Dave at the card shop knows centering better than weather."],
    ["PokeNora", "Three-source rule should be pinned above every rumor thread."],
    ["Ashley92", "Totodile people are loud because we are correct."],
    ["CardboardCam", "That pull deserves a top loader and a dramatic chair spin."],
  ],
  zelda: [
    ["ZoraZoe", "Snowpeak Ruins alone makes this argument respectable."],
    ["JoyConJules", "THANK YOU. The soup mansion deserves its crown."],
    ["N64Nate", "Counterpoint: Forest Temple still has the vibes."],
    ["JoyConJules", "Motion controls had vision. Sometimes terrible vision, but vision."],
  ],
  retro: [
    ["CRT Kay", "Scanlines are seasoning is going on my wall."],
    ["LanPartyLou", "The IP address yelling guy was the real server admin."],
    ["DreamcastDrew", "VMU supremacy remains undefeated."],
    ["PS2Paul", "That PS2 cube menu still feels haunted in the best way."],
    ["SNES Sierra", "SNES box art was allergic to subtlety and I love it."],
    ["SonicSal", "Dreamcast and GameCube fans share one brain cell and a tiny disc."],
    ["N64Nate", "Three handles made sense spiritually."],
    ["GameCubeGio", "The poll is democracy and democracy chose the handle cube."],
    ["JakeTheSnake", "This is exactly the purple propaganda I feared."],
  ],
  hardware: [
    ["Frame Frank", "Stable pacing over messy peaks, every time."],
    ["VanessaVsync", "40 FPS modes on 120 Hz displays are secretly the grown-up answer."],
    ["PC Ivy", "Motion blur off before subtitles on. Ritual order matters."],
    ["Frame Frank", "Input latency is absolutely a feeling first."],
    ["Rob313", "Back compat is preservation with a convenient button."],
  ],
  family: [
    ["DadModeDan", "Kids are undefeated at saying the most disrespectful true thing."],
    ["MomSavepoint", "Sprinkle is canon now. Sorry, Nintendo."],
    ["CouchCoopCole", "Overcooked should come with premarital counseling."],
    ["MomSavepoint", "Snack emergency pause rights should be universal."],
  ],
  competitive: [
    ["NoScopeNia", "Cereal players are always cracked. Never challenge a breakfast tag."],
    ["LagSwitchLee", "Wi-Fi only betrays me when witnesses are present."],
    ["FGCFiona", "Button mashers reveal your fake strings and your ego."],
    ["CharlieCrits", "Training mode confidence evaporates online. Science should study it."],
    ["NoScopeNia", "Patch notes are horoscopes and my main is a Scorpio."],
  ],
  rpg: [
    ["LoreLena", "A sad paragraph on a rusty key can destroy me."],
    ["JRPGJalen", "A twelve-tab menu is a welcome mat."],
    ["Mana Maya", "Backup JRPGs are an emergency preparedness category."],
    ["QuestQuinn", "Soup delivery side quest tragedy is exactly my kind of evening."],
    ["FinalFormFaye", "Choir enters, wallet exits."],
  ],
  media: [
    ["AmandaGaming", "Six stairs and 74 screenshots is efficient art direction."],
    ["SwitchSasha", "Handheld forgiveness is real."],
    ["PortalPat", "Horizontal side quests are the future."],
    ["HorrorHazel", "First-person horror is cardio for people standing still."],
  ],
  general: [
    ["GCX Nerds", "This thread is why we built the community page in the first place 😂"],
    ["Tyler", "I save twice because I trust nothing and no one."],
    ["SteamSaleSid", "A 67% discount is basically a jump scare."],
    ["MiniMapMax", "Map fog disappearing is my comfort animation."],
    ["BattlePassBryce", "I hate daily challenges while completing all of them. Growth is complicated."],
    ["SwitchbackSue", "Portable duplicate copies count as separate emotional needs."],
    ["Indie Omar", "This is why I try every demo with screenshots that look mildly cursed."],
    ["CozyCass", "Zero debt mechanics is such a beautiful phrase."],
    ["BargainBex", "Shipping is always the final boss."],
    ["GCX Nerds", "Okay this has officially become a recurring debate."],
    ["JakeTheSnake", "Aggressively mid take from me: not every beloved game aged well."],
  ],
};

function commentPoolForPost(post) {
  const text = [post.category, post.title, post.body, ...(post.tags || [])].join(" ").toLowerCase();
  if (/pokemon|pikachu|pack|binder|card|tcg|pull/.test(text)) return commentPools.pokemon;
  if (/zelda|hyrule|snowpeak|forest temple|link/.test(text)) return commentPools.zelda;
  if (/retro|gamecube|dreamcast|snes|n64|ps2|saturn|wii|crt|memory card|demo disc|lan/.test(text)) return commentPools.retro;
  if (/fps|ranked|fighting|bracket|aim|online|patch notes/.test(text)) return commentPools.competitive;
  if (/frame|performance|hardware|pc|upscaling|latency|motion blur|120 hz|controller|back compat/.test(text)) return commentPools.hardware;
  if (/kid|daughter|son|wife|co-op|family|overcooked|snack/.test(text)) return commentPools.family;
  if (/jrpg|rpg|souls|boss|quest|lore|final fantasy|dark souls/.test(text)) return commentPools.rpg;
  if (/horror|screenshot|photo|portal|handheld|switch/.test(text)) return commentPools.media;
  return commentPools.general;
}

function buildExtraSpecs() {
  const dates = [
    "2026-08-04", "2026-08-06", "2026-08-07", "2026-08-09", "2026-08-11", "2026-08-12", "2026-08-16", "2026-08-18", "2026-08-19", "2026-08-21",
    "2026-08-26", "2026-08-28", "2026-08-29", "2026-08-31", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-06", "2026-09-07", "2026-09-09",
    "2026-09-10", "2026-09-12", "2026-09-13", "2026-09-15", "2026-09-16", "2026-09-18", "2026-09-19", "2026-09-20", "2026-09-21", "2026-09-23",
    "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27", "2026-09-28", "2026-09-30", "2026-10-01", "2026-10-02",
  ];
  const times = ["06:41:00", "08:53:00", "11:18:00", "12:49:00", "15:22:00", "17:06:00", "18:57:00", "20:13:00", "21:46:00", "23:08:00"];
  return extraTemplates.map((item, index) => {
    const [author, category, title, body, tags, flavor] = item;
    const date = dates[index % dates.length];
    const time = times[(index * 3) % times.length];
    const score = 8 + ((index * 11) % 74);
    const groupId = tags.includes("Pokemon") ? "group-pokemon-trade-table" : tags.includes("Retro") || tags.includes("Nostalgia") ? "group-retro-shelf" : tags.includes("Marketplace") ? "group-marketplace-watch" : "";
    const image = flavor === "media" ? mediaAssets[index % mediaAssets.length] : "";
    return [author, date, time, category, title, body, tags, score, flavor, groupId, image];
  });
}

function buildPosts(profiles, newsroom) {
  const articleMap = new Map(newsroom.map((item) => [item.id, item]));
  const allSpecs = [...specs, ...buildExtraSpecs()].slice(0, 200);
  if (allSpecs.length !== 200) throw new Error(`Expected 200 post specs, found ${allSpecs.length}`);

  return allSpecs.map((spec, index) => {
    const [authorHandle, date, time, category, title, body, tags, score, flavor] = spec;
    const tail = spec.slice(9);
    const groupId = tail.find((item) => typeof item === "string" && item.startsWith("group-")) || "";
    let imageUrl = tail.find((item) => typeof item === "string" && item.startsWith("assets/")) || "";
    const pollOptions = tail.find((item) => Array.isArray(item)) || null;
    const articleKey = tail.find((item) => typeof item === "string" && articleRefs[item]) || "";
    if (!imageUrl && ["Collection", "Screenshots"].includes(category)) {
      imageUrl = mediaAssets[index % mediaAssets.length];
    }
    const profile = pickProfile(profiles, authorHandle);
    const id = `seed-post-${String(index + 1).padStart(3, "0")}-${slugify(title)}`;
    const linkedArticleId = articleRefs[articleKey] || "";
    const article = linkedArticleId ? articleMap.get(linkedArticleId) : null;
    if (linkedArticleId && !article) throw new Error(`Article reference does not exist: ${linkedArticleId}`);
    const linkUrl = article ? `article.html?id=${article.id}` : "";
    const isPoll = Array.isArray(pollOptions);
    const reactionCounts = isPoll
      ? Object.fromEntries(["like", "hype", "want", "trade", "watch", "option6"].map((key, optionIndex) => [key, optionIndex < pollOptions.length ? Math.max(1, Math.floor(Number(score || 0) * (pollOptions.length - optionIndex) / (pollOptions.length + 2))) : 0]))
      : reactions(Number(score || 0), flavor);
    const post = {
      id,
      author: profile.displayName,
      handle: profile.handle,
      profileId: profile.id,
      category,
      postType: isPoll ? "community_prompt" : imageUrl ? "photo_post" : linkedArticleId ? "gcx_discussion" : "community_post",
      title,
      body,
      linkUrl,
      canonicalUrl: linkUrl,
      sourceName: article ? "GCX Newsroom" : "",
      sourceUrl: linkUrl,
      sourceType: article ? "gcx" : "",
      linkPreview: article
        ? {
            url: linkUrl,
            kind: "gcx-news",
            title: article.title,
            description: article.description || article.summary || "",
            imageUrl: article.heroImage || article.imageUrl || imageUrl || "",
            sourceLabel: "GCX Newsroom",
          }
        : null,
      tags,
      groupId,
      imageUrl: imageUrl || "",
      imageAlt: imageUrl ? title : "",
      mediaNeeded: false,
      linkedArticleId,
      createdAt: iso(date, time),
      updatedAt: iso(date, time),
      status: "published",
      likes: Number(reactionCounts.like || 0),
      reactions: reactionCounts,
      comments: 0,
      reports: 0,
      viewCount: Math.max(Number(score || 0) * 3 + ((index * 17) % 80), Number(score || 0)),
      savedCount: index % 9 === 0 ? 1 + (index % 4) : 0,
      isSeedContent: true,
      seedBatchId: batchId,
      duplicateKey: `seed-${batchId}-${id}`,
    };
    if (isPoll) {
      const reactionIds = ["like", "hype", "want", "trade", "watch", "option6"];
      post.pollType = "reaction_poll";
      post.pollPrompt = title;
      post.pollOptions = pollOptions.map((label, optionIndex) => ({
        id: reactionIds[optionIndex],
        reaction: reactionIds[optionIndex],
        label,
      }));
    }
    return post;
  });
}

function buildComments(posts, profiles) {
  const comments = [];
  const talkyPosts = posts.filter((post, index) => index % 4 === 0 || Number(Object.values(post.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0)) > 80).slice(0, 60);
  let commentCursor = 0;
  talkyPosts.forEach((post, threadIndex) => {
    const baseTime = new Date(post.createdAt).getTime();
    const targetCount = threadIndex < 22 ? 2 + (threadIndex % 5) : 1;
    const pool = commentPoolForPost(post);
    for (let index = 0; index < targetCount; index += 1) {
      const [handle, body] = pool[(commentCursor + index) % pool.length];
      const profile = pickProfile(profiles, handle);
      const createdAt = new Date(baseTime + (8 + index * (13 + (threadIndex % 7))) * 60 * 1000).toISOString();
      comments.push({
        id: `seed-comment-${String(comments.length + 1).padStart(3, "0")}-${slugify(profile.displayName)}`,
        postId: post.id,
        author: profile.displayName,
        handle: profile.handle,
        profileId: profile.id,
        body,
        status: "published",
        reports: 0,
        createdAt,
        updatedAt: createdAt,
        isSeedContent: true,
        seedBatchId: batchId,
      });
    }
    commentCursor += targetCount + 1;
  });
  return comments;
}

function ensureAvatars(profiles) {
  fs.mkdirSync(avatarDir, { recursive: true });
  profiles.forEach((profile, index) => {
    const fileName = `${profile.id}.svg`;
    fs.writeFileSync(path.join(avatarDir, fileName), profileSvg(profile, index));
    profile.avatarUrl = `assets/community-avatars/${fileName}`;
  });
}

function main() {
  const data = readJson(communityPath);
  const newsroomData = readJson(newsroomPath);
  const newsroom = Array.isArray(newsroomData) ? newsroomData : newsroomData.stories || newsroomData.articles || [];

  data.profiles = (data.profiles || []).filter((item) => item.seedBatchId !== batchId);
  data.posts = (data.posts || []).filter((item) => item.seedBatchId !== batchId);
  data.comments = (data.comments || []).filter((item) => item.seedBatchId !== batchId);
  data.activity = (data.activity || []).filter((item) => item.seedBatchId !== batchId);
  data.notifications = (data.notifications || []).filter((item) => item.seedBatchId !== batchId);
  data.savedPosts = (data.savedPosts || []).filter((item) => item.seedBatchId !== batchId);
  data.follows = (data.follows || []).filter((item) => item.seedBatchId !== batchId);
  data.groupMemberships = (data.groupMemberships || []).filter((item) => item.seedBatchId !== batchId);

  const profiles = seedProfiles.map(([id, displayName, handle, bio, interests], index) => ({
    id,
    displayName,
    handle,
    bio,
    avatarUrl: "",
    interests,
    role: id === "profile-gcx-nerds" ? "staff" : "member",
    joinedAt: iso("2026-08-03", `${String(6 + (index % 14)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}:00`),
    status: "active",
    followers: 4 + ((index * 13) % 91),
    following: 3 + ((index * 7) % 48),
    isSeedContent: true,
    seedBatchId: batchId,
  }));
  ensureAvatars(profiles);

  const posts = buildPosts(profiles, newsroom).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const comments = buildComments(posts, profiles);
  const commentCounts = comments.reduce((counts, comment) => {
    counts[comment.postId] = (counts[comment.postId] || 0) + 1;
    return counts;
  }, {});
  posts.forEach((post) => {
    post.comments = commentCounts[post.id] || 0;
  });

  const memberships = [];
  const groupIds = ["group-pokemon-trade-table", "group-retro-shelf", "group-streamer-campaigns", "group-marketplace-watch"];
  profiles.forEach((profile, index) => {
    const groupId = profile.interests.includes("pokemon") || profile.interests.includes("cards")
      ? "group-pokemon-trade-table"
      : profile.interests.includes("retro") || profile.interests.includes("n64") || profile.interests.includes("ps2")
        ? "group-retro-shelf"
        : profile.interests.includes("streaming")
          ? "group-streamer-campaigns"
          : groupIds[index % groupIds.length];
    memberships.push({
      id: `seed-membership-${slugify(profile.id)}-${groupId}`,
      groupId,
      profileId: profile.id,
      role: profile.id === "profile-gcx-nerds" ? "moderator" : "member",
      joinedAt: profile.joinedAt,
      isSeedContent: true,
      seedBatchId: batchId,
    });
  });

  const follows = [];
  profiles.forEach((profile, index) => {
    [profiles[(index + 3) % profiles.length], profiles[(index + 11) % profiles.length]].forEach((target) => {
      if (profile.id !== target.id) {
        follows.push({
          id: `seed-follow-${slugify(profile.id)}-${slugify(target.id)}`,
          followerId: profile.id,
          followingId: target.id,
          createdAt: iso("2026-08-04", `${String(8 + (index % 12)).padStart(2, "0")}:${String((index * 5) % 60).padStart(2, "0")}:00`),
          isSeedContent: true,
          seedBatchId: batchId,
        });
      }
    });
  });

  data.profiles = [...profiles, ...(data.profiles || [])];
  data.posts = [...posts, ...(data.posts || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  data.comments = [...(data.comments || []), ...comments].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  data.groupMemberships = [...(data.groupMemberships || []), ...memberships];
  data.follows = [...(data.follows || []), ...follows];

  const seedPostIds = new Set(posts.map((post) => post.id));
  const mediaPosts = posts.filter((post) => post.imageUrl);
  const linkedPosts = posts.filter((post) => post.linkedArticleId);
  const pollPosts = posts.filter((post) => post.pollOptions?.length);
  const totalReactions = posts.reduce((sum, post) => sum + Object.values(post.reactions || {}).reduce((inner, value) => inner + Number(value || 0), 0), 0);
  const mostActiveSeedUsers = Array.from(posts.reduce((counts, post) => counts.set(post.author, (counts.get(post.author) || 0) + 1), new Map()).entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([author, count]) => ({ author, posts: count }));

  const validation = {
    batchId,
    profilesCreated: profiles.length,
    postsCreated: posts.length,
    commentsCreated: comments.length,
    reactionsCreated: totalReactions,
    pollsCreated: pollPosts.length,
    postsContainingMedia: mediaPosts.length,
    postsLinkedToGcxArticles: linkedPosts.length,
    mostActiveSeedUsers,
    manualReview: posts.filter((post) => post.mediaNeeded).map((post) => post.id),
    schemaChanges: 0,
    dateRange: {
      min: posts.reduce((min, post) => post.createdAt < min ? post.createdAt : min, posts[0].createdAt),
      max: posts.reduce((max, post) => post.createdAt > max ? post.createdAt : max, posts[0].createdAt),
    },
    checks: {
      allSeedPostsMarked: posts.every((post) => post.isSeedContent === true && post.seedBatchId === batchId),
      allSeedProfilesMarked: profiles.every((profile) => profile.isSeedContent === true && profile.seedBatchId === batchId),
      commentsAfterPosts: comments.every((comment) => new Date(comment.createdAt) > new Date(posts.find((post) => post.id === comment.postId)?.createdAt || 0)),
      uniquePostIds: new Set(posts.map((post) => post.id)).size === posts.length,
      uniqueProfileHandles: new Set(profiles.map((profile) => profile.handle.toLowerCase())).size === profiles.length,
      articleLinksVerified: linkedPosts.every((post) => newsroom.some((article) => article.id === post.linkedArticleId)),
      mediaFilesExist: mediaPosts.every((post) => fs.existsSync(path.join(root, post.imageUrl))),
      timestampsInRange: posts.every((post) => post.createdAt >= new Date("2026-08-03T00:00:00-04:00").toISOString() && post.createdAt <= new Date("2026-10-03T23:59:59-04:00").toISOString()),
      noSeedPostOverwrite: [...seedPostIds].every((id) => id.startsWith("seed-post-")),
    },
  };

  const failedChecks = Object.entries(validation.checks).filter(([, ok]) => !ok);
  if (failedChecks.length) {
    throw new Error(`Validation failed: ${failedChecks.map(([key]) => key).join(", ")}`);
  }

  writeJson(communityPath, data);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  writeJson(reportPath, validation);
  console.log(JSON.stringify(validation, null, 2));
}

main();
