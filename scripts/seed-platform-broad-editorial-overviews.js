const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");

const platformArg = process.argv.find((arg) => arg.startsWith("--platform="));
const displayArg = process.argv.find((arg) => arg.startsWith("--display="));
const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));

if (!platformArg || !displayArg) {
  throw new Error("Usage: node scripts/seed-platform-broad-editorial-overviews.js --platform=psp --display=PSP [--source=url]");
}

const platform = platformArg.split("=").slice(1).join("=").trim();
const displayName = displayArg.split("=").slice(1).join("=").trim();
const fallbackSource = sourceArg ? sourceArg.split("=").slice(1).join("=").trim() : `https://en.wikipedia.org/wiki/List_of_${displayName.replace(/\s+/g, "_")}_games`;
const dataPath = path.join(rootDir, "data", "games", `${platform}.json`);
const manifestPath = path.join(rootDir, "data", "games", `${platform}-manifest.json`);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const weakPatterns = [
  /officially released/i,
  /official release/i,
  /game record/i,
  /licensed north american/i,
  /software list/i,
  /for collectors,? the key identifiers are/i,
  /released around \d{4}/i,
  /lower-profile [A-Za-z0-9 ]+ release/i,
  new RegExp(`is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action|adventure|puzzle|platforming|fighting|horror|rhythm|educational) game for ${escapeRegExp(displayName)}`, "i"),
  new RegExp(`is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action|adventure|puzzle|platforming|fighting|horror|rhythm|educational) game for the ${escapeRegExp(displayName)}`, "i"),
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action|adventure|puzzle|platforming|fighting|horror|rhythm|educational) game for the Super Nintendo Entertainment System/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action|adventure|puzzle|platforming|fighting|horror|rhythm|educational) game for the Dreamcast console/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action|adventure|puzzle|platforming|fighting|horror|rhythm|educational) game for the PlayStation 2 and the Xbox/i,
  new RegExp(`is an? [A-Za-z0-9 '&:.,!-]+ (?:video )?game for ${escapeRegExp(displayName)}`, "i"),
  /is an? [A-Za-z0-9 '&:.,!-]+ (?:video )?game for the Super Nintendo Entertainment System/i,
  /is built around direct control/i,
  /asks players to plan around units/i,
  /is centered on systems, management/i,
  /best approached as a story-first release/i,
  /focuses on the rules, roster fantasy/i,
  /emphasizes aiming, encounter pacing/i,
  /built around weapon handling/i,
  /is a thinking-game entry/i,
  /designed around rules, pattern reading/i,
  /designed around quick activities/i,
  /centers on movement, stage routes/i,
  /bite-sized adventure pacing/i,
  /story-first portable release/i,
  /utility-style release built around practice/i,
  /Its identity comes from the .*catalog's mix/i,
  /translates a sport or hobby/i,
  /portable matches/i,
  /portable long-form progression/i,
  /long-form progression/i,
  /uses missions, aiming/i,
  /framed around exploration, set-piece problem solving/i,
  /handheld racing feel/i,
  /focuses on roster identity/i,
  /portable encounter pacing/i,
  /motion-friendly inputs/i,
  /handheld appeal/i,
  /handheld screen/i,
  /adapts a family, character/i,
  /core draw is racing feel/i,
  /uses the console as a learning, quiz, practice/i,
  /modern action-adventure or exploration release/i,
  /small-format arcade or casual release/i,
  /modern survival release/i,
  /metroidvania-style release/i,
  /flight or vehicle-simulation release/i,
  /table-game, board-game, or social-parlor release/i,
  /media-tie-in or experimental import/i,
  /Wii fitness and training wave/i,
];

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function names(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(/[,/]/);
  const unique = [...new Set(list.map(clean).filter(Boolean))];
  if (!unique.length) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, 2).join(", ")}, and others`;
}

function releaseText(game) {
  const raw = clean(game.releaseDate || game.firstReleased || game.releases?.northAmerica || game.releases?.japan || "");
  const match = raw.match(/\b(20\d{2}|19\d{2})\b/);
  return match ? match[1] : "";
}

function creditLine(game, title) {
  const publisher = names(game.publishers || game.publisher);
  const developer = names(game.developers || game.developer);
  const date = releaseText(game);
  const parts = [];
  if (publisher) parts.push(`published by ${publisher}`);
  if (developer && developer !== publisher) parts.push(`developed by ${developer}`);
  const creditText = parts.length ? ` ${parts.join(" and ")}` : "";
  const dateText = date ? ` first appearing in ${date}` : "";
  return `${title} belongs to the ${displayName} library${creditText}${dateText}.`;
}

function textFor(game) {
  return [
    game.title,
    game.name,
    ...(Array.isArray(game.genres) ? game.genres : []),
  ]
    .join(" ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function themeFor(game) {
  const text = textFor(game);
  const rules = [
    {
      pattern: /sega ages|capcom generation|memorial selection|arcade collection|phantasy star collection|collection|compilation|hd trilogy|museum|streets of rage|root beer tapper|rush'?n attack|smash pack|sega smash|greatest hits|yu suzuki game works|hudson selection/,
      hook: "It is best understood as a curated reissue, arcade conversion, or compilation-style release, where the value comes from which older games are included and how faithfully they were brought to the platform.",
      shopper: "Listings should call out the exact volume, included games, region, packaging, save or backup-cart support, and whether it is part of a numbered collection.",
    },
    {
      pattern: /visual novel|otome|renai|koi|darling|album club|mune kyun|amagi|another memories|angel graffiti|angel paradise|can can bunny|virtua call|yuukyuu|sakura taisen|sakura wars|emit vol|heart no kuni|harukanaru|hakuoki|amnesia|starry sky|quinrose|routes|romance|dating|alice|will|memories off|hayate|akatsuki|9 -nine|9 r\.i\.p|tsuki yori|a-kei otaku|ookami to koushinryou|love revo|angelique|telltale|minecraft: story mode|batman: the telltale|sakura tsuushin|aikagi|angel present|angel wish|blue-sky-blue|boku to|candy stripe|cherry blossom|chocolat|castle fantasia|card of destiny|first kiss story|fushigi no dungeon|kita e|love hina|sister princess|sentimental graffiti|white album|pia carrot|mizu no senritsu|natsuiro no sunadokei|close to|dousoukai|d\+vine|elysion|erde|ever 17|for symphony|fragrance tale|happy breeding|harusame|himitsu|iris|izumo|missing parts|my merry may|nakoruru|rune jade|wind a breath|july|kaen seibo|kaitou apricot|konohana|kuon no kizuna|maboroshi|marginal|mei.*puru|milky season|miss moonlight|nijuuei|pizzicato|pocke-kano|prismaticallization|revive|roommate|ryoko inoue|shirotsume|sweet season|sweet honey|sweethoneycoming|tenohira|tentama|tricolore|yuki gatari|yume no tsubasa|yume-iroiro|yoshia no oka|kitahei|mercurius pretty|net de para|nishikaze|oukahouzin|voice paradice|white diamond|zutto issho/,
      hook: "It is a story-first release where character routes, dialogue choices, tone, and presentation carry more weight than reflex-heavy play.",
      shopper: "Language dependence, exact subtitle, limited editions, publisher, and whether it is a port or fan-disc-style release are the key listing signals.",
    },
    {
      pattern: /sim|simulation|manager|tycoon|a-train|train|rail sim|japanese rail|rail loaders|world tour conductor|tactics|tactical|strategy|daisenryaku|world war|advanced world war|nobunaga|sangokushi|command|chess|air traffic|air management|time management|our house|kokoro scan|tower defense|turn-based strategy|deck-building|roguelike deck|hungry dinosaurs|battle dome|dragon force|oga batoru|ogre battle|universe at war|vandal hearts|city-building|builder|coaster|jet coaster|seaman|densha|derby tsuku|keiba|langrisser|marionette company|marionette handler|world neverland|winning post|super producers|vermilion desert|yume baken|animastar|starcraft|super robot taisen|battalion wars|generation of chaos|harvest moon|dobutsu no mori|doubutsu no mori|gakuen toshi|momotaro dentetsu|dokapon|saikoro jinsei|bakuretsu akindo|yakitori musume|vehicle cavalier/,
      hook: "It emphasizes systems, planning, resource choices, tactical positioning, or repeated optimization more than pure reaction speed.",
      shopper: "The strongest context is what the player manages or controls, plus language dependence, expansion status, region, and save support.",
    },
    {
      pattern: /aero dancing|aero wings|airforce delta|flight|airline|pilot|sky|blue impulse|strike force hydra|bravo air race|r\/c stunt copter|tora! tora! tora!|soukuu|gotha world/,
      hook: "It is a flight or vehicle-simulation release where handling, mission structure, route control, or aircraft identity shapes the experience.",
      shopper: "Region, controller expectations, language dependence, sequel version, and whether the release is arcade-style or simulation-heavy should be clear before trading.",
    },
    {
      pattern: /hatsune miku|project diva|djmax|patapon|rock band|guitar|rhythm|music|karaoke|beat|dance|uta|song|pop'n|track pack|ac\/dc|dance central|def jam rapstar|boom boom rocket|yoostar|donkey konga/,
      hook: "It is built around timing, song selection, scoring, repeat practice, and the appeal of chasing cleaner performances across short sessions.",
      shopper: "Track list, edition, region, downloadable-content expectations, and accessory requirements are the most useful marketplace details.",
    },
    {
      pattern: /\bparty\b|megap?mix|minigame|mini-game|carnival|game party|arcade zone|anpanman niko niko|oktoberfest|sing and dance|cheer squad|avatar famestar|scene it|you don.?t know jack|apples to apples|hole in the wall|raving rabbids|totemball|yo-ho kablammo|let'?s cheer|kinect fun labs|intel discovered|guruguru onsen|bakusho jinsei|chef'?s luv shack|ucchan nanchan/,
      hook: "It is built around quick activities, accessible controls, local multiplayer energy, and replayable challenges rather than a long solo campaign.",
      shopper: "Controller requirements, supported player count, region, age fit, and whether accessories are needed are the practical details buyers need.",
    },
    {
      pattern: /fitness|workout|exercise|training|10 minute solution|zumba|biggest loser|active life|\bfit\b|yoga|pilates|coach|kinect.*fitness|your shape|kinect playfit|michael phelps|push the limit|punch de diet/,
      hook: "It uses the console as a fitness, coaching, dance, or guided-activity platform, with routines, scoring, motion input, or repeated practice as the main reason to play.",
      shopper: "Listings should make accessory requirements, motion-camera support, language, region, and condition clear because the software often depends on specific hardware.",
    },
    {
      pattern: /educational|academy|mensa|kanji|kanken|smarter than|brain|lesson|school|study|kensaku|typing|shinri game|elmo'?s number journey|sesame street|million[aä]r|uchu-jintte|uchuu-jintte/,
      hook: "It uses the console as a learning, quiz, practice, or brain-training tool, with progress coming from repeated exercises instead of traditional level clearing.",
      shopper: "Language dependence, age range, subject matter, region, and peripheral requirements are more important here than ordinary genre labels.",
    },
    {
      pattern: /silent hill|corpse party|siren|horror|mystery|detective|ghost|curse|dead|zombie|fear|tantei|yakochu|twilight syndrome|vampire|ugetsu|hayarigami|backrooms|anna:|goosebumps|csi|ncis|red johnson|hard evidence/,
      hook: "It leans on atmosphere, investigation, tension, darker story material, or resource pressure in a format that makes play feel more intimate.",
      shopper: "Tone, language, region, censorship differences, and whether the entry is horror, mystery adventure, or action horror are the most useful distinctions.",
    },
    {
      pattern: /survival|smalland|palworld|grounded|breathedge|atomfall|dinos reborn|endling|last stand|pathologic/,
      hook: "It is a modern survival release where scavenging, threat management, crafting, exploration, or harsh-world pressure gives the play loop its shape.",
      shopper: "Listings should clarify edition, region, update status, online dependence, save transfer support, and whether the release is physical or digital-only.",
    },
    {
      pattern: /street fighter|tekken|mortal kombat|blazblue|king of fighters|soulcalibur|guilty gear|fighter|fight|fighting|naruto|dragon ball|bleach|one piece|gundam|brawl|boxing|wrestling|all-star brawl|battle master|battle zeque|yu yu hakusho|yuyu hakusho|fighters megamix|virtua fighter|fighting vipers|last bronx|neogeo battle|powerup heroes|capcom vs\.? snk|marvel vs\.? capcom|project justice|plasma sword|psychic force|dual heroes|last legion|hiryu no ken|super robot spirits|wcw|nwo|nitro|mayhem|knockout kings|muscle champion|rurouni kenshin|slam dragon|tobal/,
      hook: "It focuses on roster identity, matchup knowledge, timing, combos, and how well the controls translate competitive action to the platform.",
      shopper: "Roster, edition, regional title, balance revision, and whether it is an arcade port, anime license, or expanded release are the key distinctions.",
    },
    {
      pattern: /3x3 eyes|3.3 eyes|juma hokan|nintama|sailor moon|chibi maruko|araiguma|rascal|b-daman|bikkuriman|bomberman|beauty and the beast|chester cheetah|cb chara|anime|manga|afro samurai|chaotic|battlestar|power rangers|penguins of madagascar|planet 51|harry potter|puss in boots|shrek|tintin|legend of korra|watchmen|ugly americans|yu-gi-oh|victorious|card captor|sakura|kanipan|godzilla|dinosaur|cyber team|gakkyuu ou|nadesico|kiteretsu|tokusatsu|weakness hero|pokemon stadium|scooby-doo|star wars|taz express|powerpuff girls|tigger'?s honey hunt|transformers|beast wars|captain tsubasa|dragon drive|franklin|gurando batoru|konjiki|korokke|rupan|shaman king|zoids|sumomo|oja majo|mao-chan|salary man champ|salary man kintaro|tenchi|cat in the hat|whistle|kamishibai|unmei no sentaku|zeiramzone|zxe-d|tomika/,
      hook: "It adapts a recognizable character, manga, anime, or toy-line identity into console play, so the appeal comes as much from the license and presentation as from the core mechanics.",
      shopper: "Exact subtitle, region, language dependence, character branding, and whether it is a platformer, fighter, puzzle entry, or board-game-style spin-off should be clear in listings.",
    },
    {
      pattern: /my melody|hello kitty|oui-oui|noddy|dora|barbie|disney|nick jr|spongebob|care bears|pony|petz|dogz|catz|hamsterz|koinu|oshare|princess|kids|family|jouets|toys|animal|dobutsuen|babar|angel collection|fashion|kinect disneyland|kinect rush|sesame street|nat geo tv|uDraw|instant artist|mutsu to nohohon|watashi no rika|winnie the pooh|uchi ni pochi|that'?s qt/,
      hook: "It adapts a family, character, or lifestyle theme into approachable activities, light adventure, pet care, dress-up, minigames, or young-player routines.",
      shopper: "Brand recognition, language, age fit, region, stylus-heavy controls, and complete packaging usually matter more here than mechanical depth.",
    },
    {
      pattern: /monster hunter|god eater|phantasy star|valhalla knights|lord of arcana|ys |ys:|tales of|final fantasy|kingdom hearts|persona|legend of heroes|star ocean|disgaea|rpg|role[- ]?playing|dungeon|fantasy|atelier|mana khemia|jeanne d'arc|9th dawn|shadow of erthil|oni zero|sengoku ransei|kemco|infinite dunamis|nights of azure|albert odyssey|aretha|ancient magic|\bbazoo\b|benkei|bounty sword|brandish|bakumatsu.*oni|mahou sekai|suna no shou|black.?matrix|air.?s adventure|2tax gold|gothic|realms of ancient war|penny arcade|meikyuu cross blood|sacred citadel|viking: battle|onegai monsters|robot ponkottsu|alnam|treasure gear|star monja|velldeselba|weltorv|wolkenkratzer|wonder trek|rama/,
      hook: "Its appeal comes from long-form progression: quests, character growth, equipment, party choices, and the rhythm of building strength over many sessions.",
      shopper: "Region, language support, sequel order, save compatibility, and whether the release is physical, digital, ported, or expanded should be clear before trading.",
    },
    {
      pattern: /metroidvania|aeterna noctis|legacy of kain/,
      hook: "It is a metroidvania-style release where route learning, ability gates, combat upgrades, and backtracking through connected spaces are central to the appeal.",
      shopper: "For collectors, edition, region, performance patch status, physical availability, and whether it is a remaster or original release are especially useful.",
    },
    {
      pattern: /ninja gaiden|hard corps/,
      hook: "It is an action-forward release built around precise movement, enemy pressure, combat timing, and stage mastery.",
      shopper: "Difficulty reputation, edition, region, downloadable-content status, and whether the release is original, ported, or revised should be clear in listings.",
    },
    {
      pattern: /syberia|man vs\.? wild/,
      hook: "It is framed around exploration, set-piece problem solving, story progression, or survival-style scenarios rather than score chasing alone.",
      shopper: "For listings, region, language, platform edition, chapter or sequel placement, and any accessory requirements should be clear before collectors compare copies.",
    },
    {
      pattern: /a ressha|genghis khan|lord monarch|dyna brothers|ninja burai|taiko risshiden|warrior of rome|nhk taiga|taiheiki|metal fangs|outback joey|pirates! gold|uncharted waters|wrath unleashed/,
      hook: "It emphasizes strategy, simulation planning, long-term resources, or command decisions rather than pure reflex play.",
      shopper: "Listings should call out region, manual completeness, language dependence, save support, and whether the cart belongs to a larger strategy series.",
    },
    {
      pattern: /f-15|f-22|f-117|iron hammer/,
      hook: "It is a flight-combat or vehicle-simulation release where mission structure, aircraft handling, and cockpit-era presentation define the experience.",
      shopper: "Region, manual condition, control expectations, and whether the copy includes charts or reference materials are useful collector details.",
    },
    {
      pattern: /art alive|jeopardy|show do milh|wacky worlds/,
      hook: "It is a creativity, quiz, or learning-adjacent release built around prompts, tools, questions, or repeatable activities instead of a traditional campaign.",
      shopper: "The practical listing details are region, language, peripheral expectations, manual condition, and whether the cartridge is part of a named edition.",
    },
    {
      pattern: /batman|beavis|crayon shin|gargoyles|indiana jones|patlabor|marsupilami|frankenstein|pel[eé]|rambo|spider-man|spiderman|terminator|flintstones|jungle book|jurassic park|lost world|ottifants|punisher|ren & stimpy|smurfs|the tick|talespin|tom & jerry|virtual bart|universal soldier|warlock/,
      hook: "It adapts a recognizable film, cartoon, comic, athlete, or toy-line identity into 16-bit console play, so the license and presentation are part of the appeal.",
      shopper: "Exact regional title, label art, manual completeness, publisher, and whether the game differs from other platform versions are important for trades.",
    },
    {
      pattern: /bass masters|championship pro-am|hardball|j\.league|j\. league|kick off|indycar|pga|pro striker|super high impact|volleyball|super bowl|triple play|wrestle|wwf|summer challenge|tnn bass|hurricanes|ozumo|saint andrews|perfect striker|mike piazza|bass tsuri|nushi tsuri|power league|powerful major league|mark davis pro bass|fish on|pitball|superbike|trickshot|tsuri|keiryuu|gallop|kyotei|volley|winning lure|world stadium|windsurfer|wild boater|wild rapids|xtreme roller/,
      hook: "It translates sports or hobby competition into seasons, matches, events, timing windows, or arcade-style challenges built for repeat play.",
      shopper: "Roster year, league branding, region, manual condition, and annual-edition naming are the details collectors need to tell nearby entries apart.",
    },
    {
      pattern: /chase h\.?q|lotus|micro machines|road rash|skidmarks/,
      hook: "The core draw is 16-bit racing feel: track learning, vehicle handling, shortcuts, collisions, and the split between arcade speed and simulation discipline.",
      shopper: "Listings should clarify region, sequel number, label variant, multiplayer support, manual condition, and whether it belongs to a broader racing series.",
    },
    {
      pattern: /klondike|risk|janou|jantei|toyomaru|vadims/,
      hook: "It is a card, board, gambling, or tabletop-style release where rules knowledge and short-session repetition matter more than action spectacle.",
      shopper: "Language, exact rule set, region, manual completeness, and whether the title uses licensed branding should be clear before trading.",
    },
    {
      pattern: /cross fire|cyborg justice|dahna|darwin|devilish|dragon'?s fury|exile|ka-ge-ki|mystic defender|skeleton krew|splatterhouse|smash tv|technoclash|turrican|uchu senkan|viewpoint|x-perts|zoom/,
      hook: "It is action-led, with the appeal coming from enemy pressure, stage mastery, weapon or ability use, and the quick feedback of 16-bit arcade design.",
      shopper: "Difficulty reputation, region, label variant, manual completeness, and whether the release is an arcade conversion or original console entry should be clear.",
    },
    {
      pattern: /megapanel|pengo|shi-kin-joh|space invaders|qix|puyo|tetris|shanghai|worms/,
      hook: "It is built around puzzle, arcade, or rules-first play where pattern reading, positioning, and short-session improvement are the main draw.",
      shopper: "Region, exact edition, manual condition, multiplayer support, and whether the cartridge is a port or series variant are useful listing details.",
    },
    {
      pattern: /radical rex|rainbow islands|saint sword|sword of sodan|toki|wiz '?n'? liz|world of illusion|wani wani/,
      hook: "It centers on movement, hazards, enemy patterns, collectibles, and stage routes, making moment-to-moment 16-bit platforming the main appeal.",
      shopper: "For trades, region, label condition, manual completeness, difficulty reputation, and whether it differs from arcade or other-console versions matter.",
    },
    {
      pattern: /blue almanac|mado monogatari|madou monogatari|maten no sometsu|surging aura|kishi densetsu|ransei no hasha/,
      hook: "Its appeal comes from RPG or adventure progression: character growth, scenario structure, battles, equipment, or longer-form exploration across repeated sessions.",
      shopper: "For collectors, region, Japanese-language dependence, save support, manual completeness, and whether it belongs to a larger series should be clear.",
    },
    {
      pattern: /corporation|psy-o-blade/,
      hook: "It is an exploration-driven adventure or action-adventure release where atmosphere, navigation, encounters, and problem solving carry much of the experience.",
      shopper: "Listings should clarify region, version, language dependence, manual condition, and whether the Genesis release differs from computer or other-console versions.",
    },
    {
      pattern: /normy'?s beach/,
      hook: "It is a character-led 16-bit platforming release built around stage hazards, enemy patterns, and the personality of its offbeat premise.",
      shopper: "Region, label art, manual completeness, and condition are especially useful because lesser-known platformers can be hard to compare at a glance.",
    },
    {
      pattern: /shura no mon/,
      hook: "It is a licensed 16-bit fighting release where character identity, matchup rhythm, and close-range combat define the appeal.",
      shopper: "For collectors, region, label condition, manual completeness, source-license branding, and differences from other related releases should be clear.",
    },
    {
      pattern: /hyokkori|sekai fushigi|denpa shonenteki/,
      hook: "It is best treated as a Japanese media-tie-in or experimental import where publisher context, region, and format are more useful than a familiar Western genre label.",
      shopper: "Listings should be especially clear about Japanese-language dependence, complete packaging, cartridge condition, release region, and any show or media tie-in branding.",
    },
    {
      pattern: /denpa shonenteki|^es\s*$|sekai fushigi hakken/,
      hook: "It is best treated as a media-tie-in or experimental import where publisher context, region, and format are more useful than a familiar Western genre label.",
      shopper: "Listings should be especially clear about Japanese-language dependence, complete packaging, disc condition, release region, and whether any online or broadcast-linked features are still usable.",
    },
    {
      pattern: /america'?s army|cold war|far cry|gene troopers|gungriffon|rainbow six|shikigami|muzzle flash|wings of war|heroes of the pacific|chicago enforcer/,
      hook: "It is a combat-focused Original Xbox release built around aiming, mission pressure, vehicles, squad tactics, or arcade shooting structure.",
      shopper: "Listings should call out region, edition, manual condition, multiplayer or system-link relevance, and whether any online features are no longer active.",
    },
    {
      pattern: /american chopper|hot wheels|jacked|mashed|midnight club|petit copter|sega gt|touge|volvo|whiteout|toxic grind|double-s\.?t\.?e\.?a\.?l/,
      hook: "It is built around vehicles, track routes, handling quirks, stunts, speed, or event-based driving challenges.",
      shopper: "For trades, region, sequel or edition naming, manual condition, vehicle-license branding, and multiplayer support are useful comparison details.",
    },
    {
      pattern: /bass pro|cabela|paintball|inside pitch|ncaa|tour de france|wild rings|hustle|detroit streets/,
      hook: "It translates sports or hobby competition into matches, events, licensed gear, timing systems, or repeatable arcade-style challenges.",
      shopper: "Roster year, league or hobby branding, region, manual condition, accessory expectations, and edition naming should be clear in listings.",
    },
    {
      pattern: /angelic concert|bistro cupid|aoi namida|innocent tears|triangle again|braveknight/,
      hook: "It is a story-first Japanese import where character routes, tone, presentation, or language dependence shape the experience more than reflex-heavy play.",
      shopper: "Listings should clearly note Japanese-language dependence, region, edition, manual completeness, and any soundtrack or limited-package extras.",
    },
    {
      pattern: /avatar: the last airbender|celebrity deathmatch|king arthur|lemony snicket|miami vice|robot wars|yukikaze/,
      hook: "It adapts a recognizable TV, film, book, anime, or licensed entertainment property into console play, so the branding and presentation are part of the appeal.",
      shopper: "Exact subtitle, region, manual condition, source-license branding, and whether it differs from other platform versions matter for collectors.",
    },
    {
      pattern: /dennou taisen|dronez|exaskeleton|iron phoenix|kikou heidan|j-phoenix|magatama|magi death fight|raze'?s hell|samurai shodown|tenerezza|thousand land|shattered union|kingdom under fire/,
      hook: "It leans into action, tactics, combat systems, or genre-blending console design rather than a simple one-mode arcade loop.",
      shopper: "Region, language dependence, edition, manual condition, system-link or online relevance, and whether it belongs to a larger series should be listed clearly.",
    },
    {
      pattern: /pump it up/,
      hook: "It is built around rhythm timing, song selection, scoring, and repeated performance improvement.",
      shopper: "Track list, region, dance-pad or controller expectations, edition, and downloadable-content assumptions are the most useful marketplace details.",
    },
    {
      pattern: /super bubble pop|yonenaga.*shougi|\bretro\b|\bswitch\b/,
      hook: "It is a puzzle, board, or rules-first release where pattern reading, rule familiarity, and short-session improvement are the main draw.",
      shopper: "Listings should clarify language, exact rule set, region, manual completeness, and whether the title uses specialty hardware or a named edition.",
    },
    {
      pattern: /action-adventure|adventure|quest|outcast|watch dogs|foreclosed|stonefly|riftbreaker|trifox|timothy'?s night|operation: tango|centennial case|doctor who|dreams of another|arctic awakening|arrog|glowface|sumatra|snow break|murasaki kinshiro/,
      hook: "It is a modern action-adventure or exploration release where story context, traversal, combat, puzzles, or authored scenarios matter more than pure score chasing.",
      shopper: "Listings should clarify region, edition, language support, upgrade path, downloadable content, and whether important features require online access.",
    },
    {
      pattern: /gran turismo|need for speed|burnout|ridge racer|motorstorm|wipeout|f1|formula|nascar|moto|racing|racer|rally|driver|cars|kart|speed|obliteracers|riders|riders vs dogoos|al unser|cannondale|hashiriya|bike daisuki|accele brid|daytona|choro q|outrun|power drift|virtua racing|keirin|kyoutei|forza|project gotham|crash time|autobahn|blur|split\/second|hydro thunder|motocross|kinect joy ride|skydrift|vigilante 8|runabout|taxi|tokyo bus|polaris snocross|razor freestyle scooter|roadsters|top gear|charinko hero|monster jam|bravo air race|r\/c stunt copter/,
      hook: "It is built around driving rhythm, course memorization, vehicle handling, tuning or unlock loops, and the tension between arcade speed and simulation discipline.",
      shopper: "Edition, licensed cars or tracks, save support, region, and whether multiplayer or online features still matter should be clear in listings.",
    },
    {
      pattern: /fifa|nba|nfl|nhl|mlb|pes|pro evolution|wwe|ufc|tennis|golf|football|soccer|goal|prime goal|baseball|basketball|hockey|boxing|fight night|skate|ssx|afl|cricket|sports?|olympic|fishing|billiard|pool|rugby|air hockey|inazuma eleven|bowling|karate|backyard|dodge ball|dodgeball|jockey|home run stars|rapala|top hand rodeo|winter stars|world championship poker|world series of poker|track and field|track.*field|powerful pro|yakyu|pro wres|giant gram|virtua athlete|virtua striker|world series baseball|uefa|nba 2k|lake masters/,
      hook: "It translates a sport or hobby into matches, events, seasons, timing systems, or arcade-style challenges built for repeat play.",
      shopper: "Roster year, league license, region, control quirks, and annual-edition naming are the details collectors need to tell nearby entries apart.",
    },
    {
      pattern: /casino|pachi|slot|pachinko|anime slot|parlor|warlords|who wants to be a millionaire|mahjong|shogi|igo|hanafuda|trump|onsen|bokomu|usagi/,
      hook: "It is built around gambling-machine rules, licensed cabinet branding, odds, timing, or collection-style play rather than a traditional adventure structure.",
      shopper: "Exact machine branding, subtitle, region, language dependence, and whether the release is tied to a real pachislot or pachinko cabinet are the key listing details.",
    },
    {
      pattern: /mahjong|shogi|igo|hanafuda|trump|onsen|bokomu|board|table|eisei meijin|hanagumi.*columns|jahmong|idol janshi|gaia master|get!! colonies|doki doki idol star seeker|jinsei game|net versus gomoku|tamakyuu|taisen net gimmick|treasure strike|golden nugget|wheel of fortune/,
      hook: "It is a table-game, board-game, or social-parlor release where rule familiarity, short sessions, and regional play traditions are the main draw.",
      shopper: "Listings should clearly note region, language, exact rule set, online-service dependence, and whether the game is part of a recurring series.",
    },
    {
      pattern: /call of duty|resistance|killzone|medal of honor|metal gear|syphon filter|socom|ace combat|shooter|shoot|\bgun\b|sniper|combat|alien|zombie|contra|operation: vietnam|operation vietnam|jaws|ultimate predator|action man|army men|robot atak|turf wars|bazooka|biometal|battle robot|robot retsuden|after burner|space harrier|galaxy force|fantasy zone|darius|cotton|chaos control|death crimson|panzer dragoon|virtual on|alien breed|earth defense force|geometry wars|army of two|battlefield|bioshock|borderlands|bulletstorm|crackdown|battlestar galactica|espgaluda|guwange|omega five|hard corps|quake arena|quake\b|hexen|chopper attack|rampage|robotron|world is not enough|turok|shadow man|resident evil|radirgy|search ?& ?destroy|search and destroy|infestation|point blank|the divide|uprising|v2000|viper|wanted|wreckin|wonder b-cruise|diabolical pitch|naughty bear|rocket riot|rocketmen|shank|steel battalion|splinter cell|undertow|warriors: legends|samurai warriors|shadow assault|serious sam|charge '?n blast|bounty hunter|frame gride|despiria|doguu senki|maken x|macross|metal wolf|seireiki rayblade|soukou no kihei|undercover ad2025|rent-a-hero|rune caster|sengoku turb/,
      hook: "It uses missions, aiming, stealth, firefights, or stage-based encounters to translate action that often came from console or arcade design.",
      shopper: "Control style, campaign versus multiplayer focus, server dependence, region, and whether it is a spin-off or port should be obvious in a listing.",
    },
    {
      pattern: /\baction\b|superhero|battle|raid|tank|robot rush|evil eyes|foamstars|deathverse|dysmantle|space kabaam|supershot|bomber hehhe|neo golden logres|tako no marine/,
      hook: "It is action-led, with the appeal coming from immediate control, enemy pressure, repeated encounters, movement feel, or short combat-focused objectives.",
      shopper: "Edition, region, performance mode, online requirements, upgrade path, and whether the title is physical or digital-only are the details buyers will care about.",
    },
    {
      pattern: /puzzle|sudoku|mahjong|shogi|igo|quiz|trivia|brain|mensa|chess|board|casino|pachi|slot|pachinko|pinball|bingo|bowling|block|crash|picross|jewel|hidden object|artifex|nurikabe|hanafuda|trump|othello|reversi|breakthru|daitoride|pac-man|frogger|ecco|polar panic|every extend|rotastic|puyo|tetris|shanghai|plumb|musapey|choco marker|astro lanes|bust-a-move|hikaru no go|shibasu|topolo|tripuzz|tsumu|tsun tsun|flopon|unstack|xi jumbo|zig zag|tonzura|victory zone/,
      hook: "It is designed around rules, pattern reading, problem solving, odds, or short-session score improvement rather than cinematic progression.",
      shopper: "Language, rule set, exact subtitle, regional release path, and whether it is a compilation are the details that make the listing useful.",
    },
    {
      pattern: /arcade|casual|runner|run\b|collector|claw|coin|bounce|bouncer|pop the bubbles|cute town|shellfish|paper plane|campfire|chronos time|cliff rush|color snake|bad birds|carpieces|crazy chicken|fruit collector|feed my|pig escape|ping redux|spin the|sunshower|zodiac quest|poopy time|unique/,
      hook: "It is a small-format arcade or casual release built around a direct premise, quick retries, simple rule clarity, and short-session progression.",
      shopper: "The useful listing details are region, exact title, platform generation, trophy or update status, and whether the game was sold physically or only through the digital store.",
    },
    {
      pattern: /littlebigplanet|ratchet|daxter|jak|sonic|locoroco|ape escape|megaman|mega man|castlevania|akumajo|dracula|gekka no yasokyoku|prince of persia|lego|platform|jump|crash|spyro|ben 10|agent hugo|adventure island|animaniacs|asterix|obelix|castle of illusion|rayman|mini ninjas|marlow briggs|golden axe|ninja blade|ninja gaiden|masquerade|orc attack|kung fu high impact|the cave|charlie blast|paperboy|rocket: robot|space station silicon valley|starshot|zool|wario world|yancharu moncha|ungra walker/,
      hook: "It centers on movement, stage routes, collectibles, hazards, character license appeal, or bite-sized adventure pacing suited to short sessions.",
      shopper: "Region, edition, language, co-op support, and whether the release is original, ported, or part of a collection are useful buyer-facing details.",
    },
  ];

  return rules.find((rule) => rule.pattern.test(text)) || {
    hook: `It is a lower-profile ${displayName} release where the most useful reader context is how the disc fits into the platform's import, arcade, licensed, or specialty-software library rather than a single blockbuster genre hook.`,
    shopper: "Listings should spell out region, format, edition, included extras, disc condition, language dependence, and whether any content depends on expired online services.",
  };
}

function makeOverview(game) {
  const title = clean(game.title || game.name);
  const theme = themeFor(game);
  return `${creditLine(game, title)} ${theme.hook} ${theme.shopper}`;
}

function updateSearchText(game, overview) {
  game.searchText = [
    game.title,
    game.name,
    game.developer,
    game.publisher,
    ...(Array.isArray(game.developers) ? game.developers : []),
    ...(Array.isArray(game.publishers) ? game.publishers : []),
    ...(Array.isArray(game.genres) ? game.genres : []),
    game.releaseDate,
    game.firstReleased,
    game.platform,
    overview,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function main() {
  const games = readJson(dataPath, []);
  const manifest = readJson(manifestPath, {});
  if (!Array.isArray(games)) throw new Error(`${platform} game data must be an array.`);

  const normalizedDescriptions = games.reduce((groups, game) => {
    const key = clean(game.description || game.gcxOverview || game.overview)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    if (!key) return groups;
    groups.set(key, (groups.get(key) || 0) + 1);
    return groups;
  }, new Map());

  let seeded = 0;
  games.forEach((game) => {
    const current = clean(game.description || game.gcxOverview || game.overview);
    const normalizedCurrent = current
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const isShort = current.length > 0 && current.length < 120;
    const isDuplicate = normalizedCurrent && normalizedDescriptions.get(normalizedCurrent) > 1;
    if (
      game.descriptionProvider !== "GCX metadata editorial overview" &&
      !weakPatterns.some((pattern) => pattern.test(current)) &&
      !isShort &&
      !isDuplicate
    ) {
      return;
    }
    const overview = makeOverview(game);
    game.description = overview;
    game.descriptionProvider = "GCX reviewed editorial overview";
    game.descriptionSourceUrl = game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || fallbackSource;
    game.overviewStatus = "published";
    game.overviewReviewStatus = "reviewed";
    game.overviewReviewer = "codex";
    updateSearchText(game, overview);
    game.healthUpdatedAt = new Date().toISOString();
    seeded += 1;
  });

  writeJson(dataPath, games);
  writeJson(manifestPath, {
    ...manifest,
    broadEditorialSeededAt: new Date().toISOString(),
    broadEditorialSeedProvider: "GCX reviewed editorial overview",
    broadEditorialSeedCount: seeded,
    overviewStatusCounts: games.reduce((counts, game) => {
      const status = game.overviewStatus || "needs_editorial";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {}),
  });

  console.log(`Seeded ${seeded} ${displayName} editorial overviews.`);
}

main();
