const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "ds.json");
const manifestPath = path.join(rootDir, "data", "games", "ds-manifest.json");

const seeds = {
  "ds-mario-kart-ds":
    "Mario Kart DS brings Nintendo's kart racer online for the first time, with tight portable courses, retro tracks, mission mode, and snaking-heavy competitive play. It became one of the DS library's defining multiplayer games.",
  "ds-new-super-mario-bros":
    "New Super Mario Bros. revived side-scrolling Mario with modern DS presentation, new power-ups, large coins, minigames, and a more accessible structure. It is one of the system's biggest mainstream platformers.",
  "ds-animal-crossing-wild-world":
    "Animal Crossing: Wild World turns the series into a portable daily-life routine with online visits, touch controls, town customization, collecting, and real-time events. Its handheld format made Animal Crossing feel personal and persistent.",
  "ds-the-legend-of-zelda-phantom-hourglass":
    "The Legend of Zelda: Phantom Hourglass follows Wind Waker's world with stylus-driven movement, sailing, dungeon puzzles, and the recurring Temple of the Ocean King. It is one of Nintendo's boldest DS touch-control experiments.",
  "ds-the-legend-of-zelda-spirit-tracks":
    "The Legend of Zelda: Spirit Tracks builds a DS Zelda around train travel, Phantom partner puzzles, stylus combat, and a more active role for Zelda herself. Its structure makes it distinct from the rest of the handheld Zelda line.",
  "ds-pokemon-diamond":
    "Pokémon Diamond introduces the Sinnoh region, online trading and battling, the physical-special split, underground features, and a new generation of Pokémon. It marked the main series' move into the Nintendo DS era.",
  "ds-pokemon-pearl":
    "Pokémon Pearl is Diamond's companion version, with Sinnoh exploration, version exclusives, online connectivity, and Palkia as its marquee legendary. It is a key DS-era mainline Pokémon release for collectors.",
  "ds-pokemon-platinum":
    "Pokémon Platinum refines Diamond and Pearl with Giratina's Distortion World, expanded Sinnoh content, Battle Frontier, faster pacing, and roster tweaks. It is often treated as the definitive Sinnoh DS release.",
  "ds-pokemon-heartgold":
    "Pokémon HeartGold remakes Johto with DS presentation, touchscreen conveniences, Pokémon walking behind the player, Pokéwalker support, and the full Kanto postgame. It is one of the DS library's biggest collector targets.",
  "ds-pokemon-soulsilver":
    "Pokémon SoulSilver complements HeartGold with Lugia focus, version exclusives, Pokéwalker support, and the same expansive Johto-plus-Kanto structure. Complete copies are especially important to verify because of the accessory.",
  "ds-pokemon-black":
    "Pokémon Black starts the Unova generation with a new regional Pokédex, animated battle sprites, seasonal changes, and a more story-forward conflict with Team Plasma. It is a major DS-era Pokémon release.",
  "ds-pokemon-white":
    "Pokémon White pairs with Black as the companion Unova version, offering its own exclusives, White Forest, and Reshiram as its cover legendary. It helped close the DS generation with a more ambitious mainline Pokémon structure.",
  "ds-pokemon-black-2":
    "Pokémon Black 2 is a direct sequel set after Black, expanding Unova with new areas, returning Pokémon, Pokémon World Tournament, and a denser postgame. It is one of the most sought-after late DS releases.",
  "ds-pokemon-white-2":
    "Pokémon White 2 mirrors Black 2 as a true sequel rather than a simple third version, adding new routes, story changes, and White Forest differences. Its late release makes authentic complete copies especially collectible.",
  "ds-brain-age-train-your-brain-in-minutes-a-day":
    "Brain Age helped sell the DS to a wider audience with quick mental exercises, handwriting input, daily routines, and Dr. Kawashima's lightweight coaching style. It is central to the DS touch-screen boom.",
  "ds-nintendogs-lab-and-friends":
    "Nintendogs: Lab & Friends is one of the DS's signature touch-and-microphone showcases, built around caring for, training, and interacting with virtual puppies. It helped define the system's broader casual appeal.",
  "ds-phoenix-wright-ace-attorney":
    "Phoenix Wright: Ace Attorney turns courtroom drama into visual-novel investigation, cross-examination, evidence presentation, and memorable character comedy. Its DS release helped make Ace Attorney a Western cult favorite.",
  "ds-professor-layton-and-the-curious-village":
    "Professor Layton and the Curious Village combines mystery storytelling with standalone logic puzzles, warm presentation, and animated cutscenes. It established one of the DS's most recognizable puzzle-adventure series.",
  "ds-castlevania-dawn-of-sorrow":
    "Castlevania: Dawn of Sorrow continues Soma Cruz's story with soul collecting, dual-screen mapping, touchscreen seals, and rich castle exploration. It is one of the DS library's essential action RPGs.",
  "ds-castlevania-portrait-of-ruin":
    "Castlevania: Portrait of Ruin adds two-character switching, portrait worlds, quests, and faster combat to the DS Castlevania formula. Its structure gives collectors a very different follow-up to Dawn of Sorrow.",
  "ds-castlevania-order-of-ecclesia":
    "Castlevania: Order of Ecclesia closes the DS trilogy with glyph-based combat, tougher enemies, village quests, and a more somber tone. It is one of the platform's most valuable action RPG releases.",
  "ds-chrono-trigger":
    "Chrono Trigger on DS brings the SNES RPG classic to a portable format with dual-screen conveniences, added dungeons, updated localization, and animated cutscenes. It is one of the system's most important RPG ports.",
  "ds-the-world-ends-with-you":
    "The World Ends With You is a stylish Square Enix action RPG built around Shibuya, dual-screen combat, pins, fashion systems, and a contemporary soundtrack. It is one of the DS's most original cult classics.",
  "ds-advance-wars-dual-strike":
    "Advance Wars: Dual Strike expands Intelligent Systems' tactics series with dual-screen battles, tag CO powers, new units, and a large campaign. It is a key DS strategy game for Nintendo collectors.",
  "ds-advance-wars-days-of-ruin":
    "Advance Wars: Days of Ruin reimagines the series with a darker post-apocalyptic tone, rebalanced mechanics, and a more restrained story. It stands apart from the brighter earlier Advance Wars games.",
  "ds-kirby-canvas-curse":
    "Kirby: Canvas Curse uses the stylus as its main mechanic, letting players draw rainbow paths to guide Kirby through rolling platform stages. It is one of the DS's clearest early touch-first Nintendo designs.",
  "ds-kirby-super-star-ultra":
    "Kirby Super Star Ultra remakes and expands the SNES classic with updated visuals, new modes, and portable-friendly structure. It is one of the strongest Kirby releases on Nintendo DS.",
  "ds-metroid-prime-hunters":
    "Metroid Prime Hunters turns Prime-style first-person exploration and arena combat into a portable shooter with rival bounty hunters and online multiplayer. It is a technically ambitious DS showcase.",
  "ds-dragon-quest-ix-sentinels-of-the-starry-skies":
    "Dragon Quest IX was built for DS with customizable heroes, multiplayer questing, treasure maps, and a large traditional RPG campaign. It became one of the platform's biggest role-playing games.",
  "ds-final-fantasy-iv":
    "Final Fantasy IV on DS remakes the classic RPG with 3D visuals, voice-acted scenes, augment systems, and a higher level of challenge. It is a major Square Enix DS remake for RPG collectors.",
  "ds-final-fantasy-tactics-a2-grimoire-of-the-rift":
    "Final Fantasy Tactics A2 expands portable Ivalice tactics with jobs, laws, clan progression, and a huge mission list. It is one of the DS's deeper strategy RPGs.",
  "ds-elite-beat-agents":
    "Elite Beat Agents turns rhythm action into comic-panel scenarios, touchscreen taps, sliders, and increasingly frantic songs. Its personality and pick-up-and-play design made it a DS cult favorite.",
  "ds-hotel-dusk-room-215":
    "Hotel Dusk: Room 215 is a noir-styled adventure held like a book, using conversation, sketch-like art, and object puzzles to tell a slow-burn mystery. It is one of the DS's most distinctive narrative games.",
  "ds-mario-and-luigi-bowser-s-inside-story":
    "Mario & Luigi: Bowser's Inside Story splits the adventure between Bowser and the brothers inside his body, blending timed RPG combat with comedy and touch-screen minigames. It is one of the DS's standout Mario RPGs.",
  "ds-mario-and-luigi-partners-in-time":
    "Mario & Luigi: Partners in Time brings baby Mario and Luigi into the handheld RPG formula, using four-character commands, time travel, and slapstick timing-based battles. It is an important bridge between Superstar Saga and Bowser's Inside Story.",
  "ds-warioware-touched":
    "WarioWare: Touched! turns the DS touchscreen and microphone into rapid-fire microgame tools, using taps, scribbles, drags, and quick reactions. It helped define the system's early experimental personality.",
  "ds-radiant-historia":
    "Radiant Historia is a late DS RPG about time travel, branching timelines, grid-based battles, and political fantasy stakes. Its reputation and limited late-platform timing make it a notable collector title.",
  "ds-ghost-trick-phantom-detective":
    "Ghost Trick: Phantom Detective is a puzzle-adventure about rewinding deaths, possessing objects, and uncovering a supernatural mystery. Its animation, writing, and clever scenario design make it one of the DS's cult standouts.",
  "ds-tetris-ds":
    "Tetris DS wraps classic puzzle play in Nintendo-themed modes, touch features, and strong multiplayer options. It is one of the DS library's cleanest examples of a timeless game refreshed for the hardware.",
  "ds-picross-3d":
    "Picross 3D transforms number-grid logic puzzles into sculpted block puzzles, using the stylus to chip away cubes and reveal objects. It is one of the DS's best pure puzzle designs.",
  "ds-trauma-center-under-the-knife":
    "Trauma Center: Under the Knife uses the stylus for surgical action, timed procedures, diagnosis, and dramatic medical scenarios. It is one of the DS games most closely tied to the touchscreen's precision.",
  "ds-lionel-trains-on-track":
    "Lionel Trains: On Track turns model-railroad management into a DS strategy game about laying routes, switching tracks, hauling cargo, and keeping a small rail network running. It is a niche release, but the Lionel license gives it a clearer identity than many budget simulation titles.",
  "ds-little-bears":
    "Little Bears is a child-focused DS adventure built around gentle exploration, simple activities, and approachable touch-screen interactions. It belongs in the library as a family-market release where condition, regional packaging, and publisher variations matter more than competitive play depth.",
  "ds-little-book-of-big-secrets":
    "Little Book of Big Secrets is a DS activity release aimed at personality quizzes, secrets, and light journal-style play rather than traditional action. Its appeal is mostly as a snapshot of the DS casual software boom, when handheld games often mixed toys, diaries, and lifestyle features.",
  "ds-little-charley-bear":
    "Little Charley Bear adapts the preschool television character into a simple DS game of short activities, friendly presentation, and low-pressure play. It is best understood as an early-childhood licensed release, with collector interest tied to complete packaging and regional availability.",
  "ds-little-league-world-series-baseball-2008":
    "Little League World Series Baseball 2008 brings Activision's youth-baseball license to DS with arcade-leaning batting, pitching, fielding, and tournament structure. The draw is not roster simulation but a lighter baseball style built around the Little League brand.",
  "ds-little-league-world-series-baseball-2009":
    "Little League World Series Baseball 2009 follows the same youth-baseball template with updated presentation, quick handheld games, and approachable sports controls. For DS collectors, it sits with annualized licensed sports releases where year, cover art, and region can separate otherwise similar copies.",
  "ds-littlest-pet-shop-3-biggest-stars-blue-team":
    "Littlest Pet Shop 3 Biggest Stars: Blue Team is one of EA's color-coded pet-care entries, built around collecting pets, simple activities, and themed performance challenges. The Blue Team version matters because these DS releases can look interchangeable unless the exact subtitle and cover are checked.",
  "ds-littlest-pet-shop-3-biggest-stars-pink-team":
    "Littlest Pet Shop 3 Biggest Stars: Pink Team uses the same pet-collection and activity framework as its companion versions while giving this release its own cover identity. It is a casual licensed game where the precise team color is the key catalog detail.",
  "ds-littlest-pet-shop-3-biggest-stars-purple-team":
    "Littlest Pet Shop 3 Biggest Stars: Purple Team rounds out the Biggest Stars trio with pet activities, fashion-show style goals, and collection-driven play. For trading and cataloging, it should be separated from the Blue and Pink Team versions rather than collapsed into a single listing.",
  "ds-littlest-pet-shop-beach-friends":
    "Littlest Pet Shop: Beach Friends is a themed DS pet-care release that leans on seaside styling, collectible animals, minigames, and low-stress routine play. It fits the DS family library as a casual licensed entry with several similarly named companion releases.",
  "ds-littlest-pet-shop-city-friends":
    "Littlest Pet Shop: City Friends shifts EA's DS pet formula toward an urban theme, with collecting, decorating, and short activities built for younger players. The title is important to catalog carefully because the Littlest Pet Shop DS line has many near-matching subtitles.",
  "ds-littlest-pet-shop-country-friends":
    "Littlest Pet Shop: Country Friends gives the DS pet-care formula a rural theme, mixing animal collecting with simple activities and customization. It is not a systems-heavy sim, but it is part of a large licensed run collectors may want to track by exact subtitle.",
  "ds-littlest-pet-shop-garden":
    "Littlest Pet Shop: Garden is an early DS entry in EA's pet-care series, focused on collecting animals, playing simple minigames, and moving through bright themed spaces. Its value as a listing record comes from distinguishing it from later Beach, City, Country, Jungle, Spring, and Winter releases.",
  "ds-littlest-pet-shop-jungle":
    "Littlest Pet Shop: Jungle gives the licensed pet series a brighter adventure theme with animal collecting and short touch-screen activities. It is a casual DS release where complete-case condition and exact subtitle are more useful to buyers than broad genre labels.",
  "ds-littlest-pet-shop-spring":
    "Littlest Pet Shop: Spring is a seasonal DS pet-care release built around friendly activities, collecting, and customization for younger players. It should be tracked separately from Winter and the location-themed versions because listings can easily blur the subtitles together.",
  "ds-littlest-pet-shop-winter":
    "Littlest Pet Shop: Winter wraps EA's DS pet-care format in a seasonal theme, with simple minigames and collectible pets at the center. For marketplace use, the important details are the Winter subtitle, region, and whether the case/manual are present.",
  "ds-live-battle-card-live-on-ds":
    "Live Battle Card: Live-On DS adapts the Live-On trading-card property into a handheld card-battle game, emphasizing deck strategy, creature play, and anime tie-in appeal. It is a niche Japanese DS release that belongs in card-game and import-collector filters.",
  "ds-lively-garden":
    "Lively Garden is a Brownie Brown-developed visual novel for DS, built around school-life romance, character routes, and story presentation rather than action systems. Its interest is strongest for import collectors following Marvelous visual novels and Brownie Brown's non-RPG work.",
  "ds-logic-cubes":
    "Logic Cubes is a compact DS puzzle release about working through cube-based logic challenges with repeatable short-session structure. It sits in the system's large brain-training and puzzle shelf, where the appeal is clear rules and portable problem solving.",
  "ds-logic-machines":
    "Logic Machines is a DS puzzle game centered on building or manipulating mechanisms to solve staged logic problems. It is useful to present as a construction-minded puzzle release rather than a generic strategy game, especially for buyers looking for stylus-friendly thinking games.",
  "ds-lost-in-blue":
    "Lost in Blue strands players on an island and turns survival into the main loop: gathering food, managing stamina, exploring new areas, and cooperating with a companion. It is one of Konami's more recognizable DS adventure-survival releases and started a small handheld series.",
  "ds-little-wingels":
    "Little Wingels is a small European DS shooter about guiding winged characters through simple action stages and enemy patterns. Its collector value comes from being a lower-profile regional release in the DS catalog, where publisher, language, and packaging details matter.",
  "ds-lola-and-virginia":
    "Lola & Virginia adapts the animated series into a DS game built around school rivalry, character-driven tasks, and light adventure objectives. It is best treated as a European licensed release for younger players rather than a strategy game in the traditional sense.",
  "ds-londonian-gothics-mekyu-no-lolita":
    "Londonian Gothics: Mekyu no Lolita is a Japanese action RPG with gothic-lolita styling, dungeon exploration, and stylus-driven combat. It stands out in the DS import library because its fashion-forward horror-fantasy presentation is more distinctive than its basic genre label suggests.",
  "ds-looney-tunes-cartoon-conductor":
    "Looney Tunes: Cartoon Conductor uses the DS stylus for rhythm and conducting minigames built around classic cartoon music cues. Instead of a conventional adventure, the appeal is timing actions to animated gags and familiar Looney Tunes presentation.",
  "ds-los-lunnis":
    "Los Lunnis is a Spanish children's television tie-in for DS, aimed at simple activities, colorful character interaction, and young-player pacing. It belongs in the library as a regional licensed release where language, cover, and market origin are the most useful listing details.",
  "ds-lost-identities":
    "Lost Identities is a DS adventure-mystery release about uncovering identities and working through story-led investigation beats. It should be presented as a compact European mystery game, with appeal tied to premise and scarcity more than broad franchise awareness.",
  "ds-love-is-in-bloom-the-flower-shop-garden":
    "Love is... in Bloom: The Flower Shop Garden is a casual flower-shop simulation about growing plants, fulfilling customer requests, and gradually improving a small business. It fits the DS lifestyle-game wave that used touch controls for relaxed management loops.",
  "ds-lovely-lisa":
    "Lovely Lisa is a life-simulation and minigame collection about helping Lisa practice hobbies, chores, fashion, and social activities. Its tone is gentle and child-focused, making it a clear example of the DS software boom aimed at younger casual players.",
  "ds-lovely-lisa-and-friends":
    "Lovely Lisa and Friends expands the original's girl-life activity format with more character interaction, minigames, and friendship-themed goals. It is useful to catalog separately because listings can easily blur it with the first Lovely Lisa release.",
  "ds-lucky-luke-the-daltons":
    "Lucky Luke: The Daltons adapts the comic and animated western property into a DS release centered on accessible missions, character humor, and family-friendly action. Its strongest identifier is the Lucky Luke license, especially for European collectors.",
  "ds-lup-salad-ds-lupupu-cube":
    "Lup Salad DS: Lupupu Cube is a Japanese puzzle game built around clearing cube-based boards with cute character presentation and portable stage structure. It is a niche import puzzle release where the Lupupu Cube subtitle helps distinguish it from generic DS puzzle listings.",
  "ds-mabeop-cheonjamun-ds":
    "Mabeop Cheonjamun DS adapts the Korean educational fantasy property into a Hanja-learning game, mixing character presentation with language practice. Its value in the database is as a Nintendo of Korea release tied to learning content rather than standard adventure play.",
  "ds-mabeop-cheonjamun-ds-2-the-final-hanja-magic":
    "Mabeop Cheonjamun DS 2: The Final Hanja Magic continues the Korean Hanja-learning series with more fantasy-framed educational activities and character material. It should be cataloged beside the first game because regional education titles are easy to overlook in DS collections.",
  "ds-machi-no-pet-ya-san-ds-2-wannyan-333-hiki-daishuugou":
    "Machi no Pet-Ya-San DS 2: Wannyan 333-Hiki Daishuugou! is a Japanese pet-shop simulation about caring for many dogs and cats through touch-screen routines. The sequel's larger animal count is the key hook, especially for collectors tracking pet-care software.",
  "ds-machi-no-pet-ya-san-ds-wan-chan-200-hiki-daishuugou":
    "Machi no Pet-Ya-San DS: Wan-chan 200-Hiki Daishuugou is a pet-shop DS simulation focused on raising, caring for, and interacting with a large selection of dogs. It sits neatly beside Nintendo's own pet-game boom while aiming at a more shop-management-style fantasy.",
  "ds-machi-ing-maker-ds":
    "Machi-Ing Maker DS brings D3Publisher's town-building concept to Nintendo DS, asking players to place facilities, shape neighborhoods, and build a functioning city layout. It is a management sim where the draw is slow construction and civic planning rather than action.",
  "ds-machiteba-tengoku-makereba-jigoku-ryoutsuryuu-ikkakusenkin-daisakusen":
    "Machiteba Tengoku! Makereba Jigoku! Ryoutsuryuu Ikkakusenkin Daisakusen! is a Japanese board-game-style DS release about luck, money swings, and competitive party-game events. Its long title is intimidating, but the play is closer to a comic fortune-and-risk tabletop game.",
  "ds-maeh-jongg-ds":
    "Maeh Jongg DS is a straightforward mahjong solitaire-style puzzle release for DS, built around matching tiles and clearing layouts in short sessions. It belongs with the handheld's many budget puzzle games where rule familiarity is the main selling point.",
  "ds-maejig-cheongkeuwa-mabeobui-seong":
    "Maejig Cheongkeuwa Mabeobui Seong is a Korean DS fantasy release with puzzle and adventure elements framed around magic-themed characters. It is most useful as a regional-library record, since Korean DS titles can be harder for collectors to identify accurately.",
  "ds-maestro-jump-in-music":
    "Maestro! Jump in Music is a clever rhythm-platformer where players strum, tap, and time actions to guide Presto through musical stages. Its mix of melody, stylus input, and side-scrolling movement makes it one of the DS's more charming European rhythm curios.",
  "ds-magic-encyclopedia-3-illusions":
    "Magic Encyclopedia 3: Illusions is a hidden-object adventure about searching scenes, solving light puzzles, and moving through a fantasy mystery. It is better described as casual adventure software than strategy, with appeal tied to relaxed object-finding play.",
  "ds-magic-encyclopedia-ii-moonlight":
    "Magic Encyclopedia II: Moonlight brings the hidden-object puzzle series to DS with scene searches, inventory puzzles, and a gentle fantasy-adventure structure. It fits the handheld's casual mystery shelf and should be distinguished from the third Illusions entry.",
  "ds-magical-zhu-zhu-princess-carriages-and-castles":
    "Magical Zhu Zhu Princess: Carriages & Castles turns the Zhu Zhu Pets toy line into a princess-themed DS adventure with simple activities, collecting, and young-player objectives. Its value is mainly as a licensed toy-game tie-in with a clear subtitle and audience.",
  "ds-magical-zunou-power":
    "Magical Zunou Power!! is a Japanese brain-training and quiz-style DS game built around short mental challenges and variety activities. It belongs with the system's education and party-adjacent software rather than action or role-playing releases.",
  "ds-magicq-ds":
    "MagicQ DS is a Japanese quiz and puzzle release from Studio9, focused on short questions, mental challenges, and portable play. It is a modest DS catalog entry where the exact title and publisher credit are the most useful collector identifiers.",
  "ds-mah-jong-quest-expeditions":
    "Mah Jong Quest: Expeditions adapts the casual puzzle series to DS with tile-matching boards, adventure-map progression, and short stylus-friendly challenges. It is best presented as a mahjong-solitaire puzzle journey rather than a traditional competitive mahjong simulation.",
  "ds-mah-jongg":
    "Mah-Jongg is a straightforward DS mahjong release from Rising Star Games, built around familiar tile layouts, quick rounds, and accessible puzzle play. Its value for collectors is as a budget European puzzle title where box region and exact spelling help separate listings.",
  "ds-mahjong":
    "Mahjong on DS is a compact tile-matching puzzle game from DTP Young Entertainment, focused on clearing boards and pattern recognition in short handheld sessions. It belongs with the system's casual puzzle shelf rather than the deeper Japanese riichi mahjong titles.",
  "ds-mahjong-300":
    "Mahjong 300 is a Cerasus Media puzzle release built around a large selection of mahjong-solitaire layouts for repeated play. The number in the title is the main hook: this is about quantity of boards and relaxed portable puzzle clearing.",
  "ds-mahjong-haoh-ds-special":
    "Mahjong Haoh DS Special is a Japanese riichi mahjong title aimed at players who want a more rules-driven table game on DS. It should be distinguished from solitaire-style mahjong releases because its appeal is traditional match play and ranking-style competition.",
  "ds-mahjong-haoh-ds-dankyuu-battle":
    "Mahjong Haoh DS: Dankyuu Battle builds on the Haoh line with rank-based mahjong competition and DS table play. For collectors, the Dankyuu Battle subtitle matters because it identifies a separate entry from DS Special rather than a duplicate.",
  "ds-mahjong-journey-quest-for-tikal":
    "Mahjong Journey: Quest for Tikal wraps mahjong-solitaire boards in an archaeological adventure theme, sending players through ruins and staged puzzles. It is a casual hidden-treasure style puzzle release where theme and presentation matter more than competitive mahjong rules.",
  "ds-mahjong-kakutou-club-ds-wi-fi-taiou":
    "Mahjong Kakutou Club DS: Wi-Fi Taiou brings Konami's arcade/online mahjong identity to Nintendo DS with competitive table play and wireless-era connectivity as the selling point. It is a stronger fit for serious mahjong fans than the system's many solitaire puzzle releases.",
  "ds-mahjong-mysteries-ancient-athena":
    "Mahjong Mysteries: Ancient Athena combines mahjong-solitaire boards with a mythological adventure framing, using cleared layouts to move through a light story. It should be treated as a casual puzzle-adventure title rather than a simulation of competitive mahjong.",
  "ds-mahjong-mysteries-ancient-egypt":
    "Mahjong Mysteries: Ancient Egypt uses Egyptian ruins, relic hunting, and themed tile layouts to give mahjong-solitaire play a travel-mystery wrapper. Its appeal is relaxed puzzle progression with a clear setting, not deep table-game strategy.",
  "ds-mahjong-navi-ds":
    "Mahjong Navi DS is a Japanese mahjong guide and play title focused on helping players navigate rules, hands, and table situations. It is useful in the catalog because it leans toward instruction and practice rather than simply offering another board-puzzle package.",
  "ds-mahjong-taikai":
    "Mahjong Taikai brings Koei's long-running mahjong competition series to DS, emphasizing traditional table play, tournaments, and opponent variety. It belongs with the platform's serious Japanese board-game releases and should not be grouped with tile-matching mahjong solitaire.",
  "ds-mahjong-eine-reise-um-die-welt":
    "Mahjong: Eine Reise um die Welt is a German-language travel-themed mahjong-solitaire release, built around clearing layouts across a world-tour structure. Region and language are the key collector details, since the core play is approachable casual puzzle clearing.",
  "ds-maji-de-manabu-lec-de-ukaru-ds-hishou-boki-3-kyuu":
    "Maji de Manabu: LEC de Ukaru DS Hishou Boki 3 Kyuu is an exam-prep and accounting study title for DS, created around bookkeeping practice rather than entertainment-first play. It is a specialized Japanese education release that matters for complete-library and edutainment tracking.",
  "ds-major-ds-dream-baseball":
    "Major DS: Dream Baseball adapts the Major baseball manga/anime into a handheld sports game with character-driven teams and arcade-friendly baseball action. Its identity is the license and cast, making it distinct from MLB simulation entries on the system.",
  "ds-major-league-baseball-2k8-fantasy-all-stars":
    "Major League Baseball 2K8 Fantasy All-Stars turns MLB into a stylized DS baseball game with exaggerated character designs, power-ups, and touch-screen pitching and batting. It is more arcade sports spinoff than roster-authentic simulation.",
  "ds-mame-goma-2-uchi-no-ko-ga-ichiban":
    "Mame Goma 2: Uchi no Ko ga Ichiban continues the seal-raising series with pet-care routines, minigames, and gentle character interaction. It is a Japanese casual sim where the charm comes from caring for small mascot characters rather than challenge.",
  "ds-mame-goma-3-kawaii-ga-ippai":
    "Mame Goma 3: Kawaii ga Ippai expands the San-X pet-care formula with more cute activities, collection goals, and light daily routines. It should be separated from earlier Mame Goma games because these releases can look nearly identical in listings.",
  "ds-mame-goma-honobono-nikki":
    "Mame Goma: Honobono Nikki is a DS pet-life diary game centered on caring for San-X's seal characters, recording routines, and enjoying soft minigame interactions. It fits the DS lifestyle catalog as a calm licensed care simulation.",
  "ds-manga-ka-debut-monogatari-ds-akogare-manga-ka-ikusei-game":
    "Manga Ka Debut Monogatari DS: Akogare Manga-ka Ikusei Game is a career-themed simulation about learning manga creation and building toward a debut. It is a distinctive Japanese DS title because the fantasy is artistic training and publishing success rather than battle or sports progression.",
  "ds-mar-heaven-boukyaku-no-clavier":
    "Mar Heaven: Boukyaku no Clavier adapts the MAR fantasy series into a DS RPG/adventure built around character abilities, magical weapons, and story material for fans. It is an import licensed title where the anime connection is the main draw.",
  "ds-mar-heaven-karudea-no-akuma":
    "Mar Heaven: Karudea no Akuma is another DS game tied to the MAR franchise, using fantasy battles and character-driven progression around the series' ARMs concept. It should be cataloged apart from Boukyaku no Clavier because the subtitle marks a separate release.",
  "ds-march-of-the-penguins":
    "March of the Penguins turns the documentary brand into a DS puzzle-adventure about guiding a penguin group through hazards, routes, and environmental challenges. It is a family-oriented licensed title with light strategy rather than a direct film retelling.",
  "ds-margot-s-bepuzzled":
    "Margot's Bepuzzled! is a DS puzzle collection built around logic challenges, wordplay, and bite-sized brain-teaser structure. It belongs with the handheld's casual puzzle boom and is best described by its varied challenge format.",
  "ds-margot-s-word-brain":
    "Margot's Word Brain focuses on vocabulary, spelling, and word puzzles presented as quick mental challenges. It is a compact DS brain-training entry for players who prefer language exercises over math or reflex minigames.",
  "ds-marie-and-gully-no-let-s-science":
    "Marie & Gully no Let's Science adapts the NHK educational anime into a DS learning game built around science topics, character presentation, and short activities. Its value is strongest as a Japanese education-media tie-in rather than a traditional adventure or action release.",
  "ds-marie-antoinette-et-la-guerre-d-independence-americaine-episode-1-la-fraternite-du-loup":
    "Marie-Antoinette et la Guerre d'Independence Americaine episode 1: La Fraternite du Loup is a French historical mystery adventure from Nemopolis. It mixes period settings, dialogue, investigation, and puzzle solving around an alternate-history Marie-Antoinette storyline tied to the American Revolution.",
  "ds-marie-antoinette-et-les-disciples-de-loki":
    "Marie-Antoinette et les Disciples de Loki continues Nemopolis' historical adventure style with Marie-Antoinette, secret-society intrigue, and point-and-click puzzle progression. It belongs with the DS's regional European mystery catalog, where language and title accuracy are important for collectors.",
  "ds-marker-man-adventures":
    "Marker Man Adventures is a DS puzzle-platformer where players draw simple shapes, bridges, and tools to guide a stick-figure hero through physics-minded stages. The appeal is the stylus construction hook, which makes it more distinctive than a standard side-scrolling adventure.",
  "ds-martin-mystery":
    "Martin Mystery adapts the animated paranormal-investigation series into a DS adventure about clues, strange cases, and character-driven missions. It is a licensed Ubisoft release aimed at fans of the show, with the mystery theme doing more work than mechanical depth.",
  "ds-master-jin-jin-s-iq-challenge":
    "Master Jin Jin's IQ Challenge is a DS brain-training puzzle collection built around logic tests, number challenges, memory tasks, and quick exercises. It fits the handheld's mid-2000s mental-fitness wave and is most useful as a budget puzzle record.",
  "ds-master-of-the-monster-lair":
    "Master of the Monster Lair is a dungeon-building RPG where players design underground floors to lure monsters, then explore and battle through the lair they helped create. Its hook is the mix of town requests, dungeon layout, item gathering, and turn-based progression.",
  "ds-match-3-madness":
    "Match 3 Madness is a casual DS puzzle release focused on swapping or matching tiles, clearing objectives, and playing short stylus-friendly rounds. It belongs with the system's budget puzzle shelf, where the appeal is relaxed repeat play rather than a story campaign.",
  "ds-matchstick-puzzle-by-ds":
    "Matchstick Puzzle by DS turns classic matchstick brainteasers into portable stylus puzzles, asking players to move limited pieces to form equations, shapes, or patterns. It is a pure logic title whose value comes from compact problem solving and puzzle quantity.",
  "ds-math-blaster-in-the-prime-adventure":
    "Math Blaster in the Prime Adventure brings the long-running educational brand to DS with arithmetic challenges wrapped in a light sci-fi adventure. It is designed around math practice first, using missions and character framing to keep younger players moving through exercises.",
  "ds-math-play":
    "Math Play is an education-focused DS title built around arithmetic practice, drills, and touch-screen problem solving. It is part of the system's broader classroom-adjacent software wave, with collector interest tied to region, publisher, and complete packaging.",
  "ds-maths-buddy-class-5":
    "Maths Buddy Class 5 is a curriculum-style DS study aid aimed at fifth-grade math practice, with short exercises and review activities instead of traditional game progression. It should be understood as educational software for a specific school level.",
  "ds-maths-buddy-class-6":
    "Maths Buddy Class 6 follows the same study-aid format for sixth-grade math topics, using DS portability for revision and repeat practice. Its audience is learners and education-software collectors rather than players looking for a conventional puzzle game.",
  "ds-maus-ds":
    "Maus DS is a German puzzle release built around guiding or manipulating mouse-themed challenges with simple rule sets and short-session play. Region and language are the most important details, since it sits in the DS's large European budget-puzzle catalog.",
  "ds-may-s-mystery-forbidden-memories":
    "May's Mystery: Forbidden Memories is a puzzle-adventure starring May as she searches for her missing brother through riddles, minigames, and story scenes. It is a Layton-adjacent style release, built more around brainteasers and presentation than exploration freedom.",
  "ds-maya":
    "Maya is a Studio 100 children's-license DS release tied to Maya the Bee, with simple activities, friendly exploration, and young-player pacing. Its main identifier is the license and European family-market context rather than deep adventure mechanics.",
  "ds-mechanic-master":
    "Mechanic Master is a contraption puzzle game about placing parts, tools, and mechanisms so chain reactions solve each stage. It is one of the DS puzzle releases that makes good use of touch placement and experimentation rather than reflex timing.",
  "ds-mechanic-master-2":
    "Mechanic Master 2 expands the contraption-building puzzle format with more staged mechanisms, parts, and trial-and-error solutions. It is a direct sequel for players who want more Rube Goldberg-style DS puzzle design.",
  "ds-medarot-ds-kabuto-ver":
    "Medarot DS: Kabuto Ver. revives the robot-battling RPG series on Nintendo DS with customizable Medabots, part-based combat, and version-specific content. The Kabuto version is one half of the paired release structure and should be tracked separately.",
  "ds-medarot-ds-kuwagata-ver":
    "Medarot DS: Kuwagata Ver. is the companion version to Kabuto, using the same Medabot customization and battle structure with its own version identity. Collectors should separate the two releases because the paired branding is central to the series.",
  "ds-mega-bloks-diego-s-build-and-rescue":
    "Mega Bloks: Diego's Build and Rescue combines the Diego children's license with Mega Bloks construction theming, simple missions, and approachable touch-screen play. It is a preschool-facing licensed title where the toy and TV brands are the key draw.",
  "ds-mega-mindy":
    "Mega Mindy adapts the Belgian superhero children's series into a DS adventure with simple objectives, character tasks, and family-friendly presentation. It is mainly relevant as a regional European licensed game tied to Studio 100.",
  "ds-mehr-kreuzwortraetsel":
    "Mehr Kreuzwortraetsel is a German crossword collection for DS, focused on word-grid solving and portable puzzle sessions. Language is the central catalog detail, since the experience depends on German vocabulary rather than action or story.",
  "ds-mein-beautyhotel-fur-tiere":
    "Mein Beautyhotel fur Tiere is a German pet-care and salon simulation about looking after animals, grooming them, and running a themed care business. It fits the DS lifestyle-sim market aimed at younger players and pet-game collectors.",
  "ds-mein-traumjob-kinderarztin":
    "Mein TraumJob Kinderarztin is a German career-simulation title about playing through pediatric-care tasks and hospital routines. It belongs with Tivola's job-fantasy DS software, where the premise is role-play and light education rather than deep simulation.",
  "ds-meitantei-conan-and-kindaichi-shounen-no-jikenbou":
    "Meitantei Conan & Kindaichi Shounen no Jikenbou is a crossover mystery adventure pairing Detective Conan with Kindaichi Case Files. Players follow investigation scenes, clues, and character dialogue, making the license combination the headline feature.",
  "ds-meitantei-conan-aoki-houseki-no-rinbukyoku":
    "Meitantei Conan: Aoki Houseki no Rinbukyoku is a Detective Conan DS mystery adventure built around jewel-related intrigue, investigation scenes, and puzzle progression. It is a licensed story game for fans who want case-solving rather than action.",
  "ds-meitantei-conan-kakokara-no-zensou-kyoku":
    "Meitantei Conan: Kakokara no Zensou Kyoku continues the DS Detective Conan adventure line with dialogue-heavy investigation, clue gathering, and mystery beats. The subtitle identifies it as a separate case-focused release for franchise collectors.",
  "ds-meitantei-conan-kieta-hakase-to-machigai-sagashi-no-tou":
    "Meitantei Conan: Kieta Hakase to Machigai Sagashi no Tou blends Detective Conan story framing with spot-the-difference puzzle play. Its hook is less traditional adventure exploration and more observation challenges wrapped in the familiar mystery cast.",
  "ds-meitantei-conan-tantei-ryoku-trainer":
    "Meitantei Conan: Tantei Ryoku Trainer turns the Detective Conan license into detective-skill training, with observation, memory, logic, and case-themed exercises. It is closer to a licensed brain-training title than a full narrative adventure.",
  "ds-mensch-argere-dich-nicht":
    "Mensch argere Dich nicht brings the classic German board game to DS, centered on dice rolls, moving pieces around the board, and knocking rivals back to start. It is a regional tabletop adaptation where the familiar family-game rules are the main appeal.",
  "ds-merlin-a-servant-of-two-masters":
    "Merlin: A Servant of Two Masters adapts the BBC fantasy series into a DS release with character-driven tasks, light adventure structure, and show-based presentation. Its collector value comes from the Merlin license and European TV tie-in context.",
  "ds-metal-max-3":
    "Metal Max 3 revives the open-ended vehicle RPG series on Nintendo DS, mixing tank customization, bounty hunting, wasteland exploration, and turn-based battles. It is a major Japan-only DS RPG for players who want nonlinear progression and mechanical tinkering.",
  "ds-metropolis-crimes":
    "Metropolis Crimes is a stylized detective adventure from Lexis Numerique where players investigate murders, question suspects, inspect crime scenes, and follow comic-book-like case presentation. It sits in the DS mystery catalog near point-and-click and puzzle-adventure releases.",
  "ds-mezase-koushien":
    "Mezase! Koushien is a Japanese high-school baseball game centered on school-team competition and the dream of reaching the Koshien tournament. It is a sports title whose appeal comes from the specific Japanese baseball setting rather than MLB-style licensing.",
  "ds-mezase-tsuri-master-ds":
    "Mezase!! Tsuri Master DS brings Hudson's fishing series to Nintendo DS with touch-driven casting, catching, and collection play. It is a fishing title for players who want portable angling goals and fish-list completion instead of arcade action.",
  "ds-mi-experto-en-aleman-mejora-tu-vocabulario-aleman":
    "Mi Experto en Aleman: Mejora tu Vocabulario Aleman is a Spanish-language German vocabulary trainer from Ubisoft, built around lessons, quizzes, and repeat practice. It should be treated as language-learning software rather than a conventional puzzle game.",
  "ds-midnight-mysteries-the-edgar-allan-poe-conspiracy":
    "Midnight Mysteries: The Edgar Allan Poe Conspiracy is a hidden-object mystery adventure built around Poe-inspired locations, clue hunts, and supernatural literary atmosphere. The DS version gives the PC series a portable touch-screen format.",
  "ds-midnight-play-pack":
    "Midnight Play! Pack is a Gameloft-developed compilation of casino, card, and casual parlor games for DS. It is a budget-friendly variety release where the appeal is having several quick-play activities on one cartridge.",
  "ds-miffy-s-world":
    "Miffy's World is a preschool-focused DS game based on Dick Bruna's character, using simple activities, gentle pacing, and bright presentation for very young players. It belongs with European family-license software rather than challenge-driven platformers.",
  "ds-military-history-commander-europe-at-war":
    "Military History: Commander - Europe at War adapts Slitherine's World War II strategy game to DS, focusing on theater-level planning, unit movement, production, and campaign decisions. It is a serious strategy release in a library crowded with casual software.",
  "ds-milon-no-hoshizora-shabon-puzzle-kumikyoku":
    "Milon no Hoshizora Shabon: Puzzle Kumikyoku is a Hudson puzzle game starring Milon, built around bubble-based stage challenges and characterful presentation. It is a DS curiosity for players tracking Hudson's older character catalog beyond Adventure Island and Bomberman.",
  "ds-mimi-de-unou-o-kitaeru-ds-chou-nouryoku":
    "Mimi de Unou o Kitaeru DS: Chou-Nouryoku is a Japanese brain-training style release focused on audio memory, concentration, and right-brain exercise tasks. It fits the DS boom of training software that used the hardware for quick daily drills.",
  "ds-mimi-s-party-fun":
    "Mimi's Party Fun! is a family-oriented DS party-game collection with simple minigames, colorful presentation, and short-session play. It is best cataloged as casual multiplayer-style entertainment for younger players rather than a deep single-player campaign.",
  "ds-mind-body-and-soul-big-word-puzzle-book":
    "Mind Body & Soul: Big Word Puzzle Book is a DS word-puzzle collection built around crosswords, anagrams, and vocabulary challenges. It is a portable puzzle-book replacement, with language and region more important than story or character hooks.",
  "ds-mind-body-and-soul-blend-it":
    "Mind Body & Soul: Blend-it is a 505 Games casual puzzle release about combining or arranging elements through short touch-screen challenges. It belongs with the DS's lifestyle-branded puzzle catalog aimed at relaxed daily play.",
  "ds-mind-quiz-your-brain-coach":
    "Mind Quiz: Your Brain Coach is a brain-training title with timed mental exercises, score tracking, and short daily challenges. It sits alongside the DS training boom, using Sega and Ubisoft publishing credits to identify regional versions.",
  "ds-mind-your-language-english":
    "Mind Your Language: English is a DS language-learning release focused on English vocabulary and practice exercises for European players. It is education software first, using quizzes and lessons rather than traditional game progression.",
  "ds-mind-your-language-french":
    "Mind Your Language: French uses the same DS study-aid format for French learning, with vocabulary tasks, grammar practice, and quick review sessions. It should be tracked separately because each language edition targets a different audience.",
  "ds-mind-your-language-german":
    "Mind Your Language: German is a German-learning DS title built around short lessons, vocabulary review, and portable practice. The language edition is the main identifier, especially for collectors sorting several nearly identical releases.",
  "ds-mind-your-language-japanese":
    "Mind Your Language: Japanese brings Japanese language practice to DS with structured exercises and study-focused presentation. It is a regional education release rather than an adventure, with the subject language defining the listing.",
  "ds-mind-your-language-spanish":
    "Mind Your Language: Spanish is a Spanish-learning DS study title with vocabulary, quiz, and lesson-style activities. It belongs with the platform's education catalog and should be distinguished from the other Mind Your Language editions.",
  "ds-mindstorm-2":
    "MinDStorm 2 is a brain-training and puzzle collection from ASK, focused on quick mental exercises, logic tasks, and score improvement. It is part of the Japanese DS training-software wave that followed Brain Age's success.",
  "ds-mini-golf-resort":
    "Mini Golf Resort is a Teyon-developed mini-golf game with themed courses, simple putting controls, and casual score chasing. It is a compact sports release suited to short DS sessions rather than a simulation golf title.",
  "ds-mini-rc-rally":
    "Mini RC Rally is a top-down or toy-scale racing game about small remote-control cars, quick tracks, and arcade handling. It is a budget DS racer where the miniature-car theme is the main hook.",
  "ds-mini-yonkyu-ds":
    "Mini Yonkyu DS adapts Japan's mini 4WD racing hobby to DS, focusing on car setup, parts, tuning, and race performance. It is most useful to collectors as a hobby-brand racing simulation rather than a standard arcade racer.",
  "ds-minna-atsumare-quiz-party":
    "Minna Atsumare! Quiz Party is a Japanese quiz-party game built around trivia questions, fast answers, and group-friendly rounds. It belongs with the DS's social quiz catalog, where language and regional context shape the experience.",
  "ds-minna-de-flash-anzan-ds":
    "Minna de Flash Anzan DS is a Japanese mental-arithmetic trainer focused on flash calculation, abacus-style number recognition, and speed drills. It is education software for math practice rather than a puzzle adventure.",
  "ds-minna-no-conveni":
    "Minna no Conveni is a convenience-store management simulation from Taito, asking players to handle shop operations, products, customers, and business growth. It stands out because the premise is everyday retail management instead of fantasy or farming.",
  "ds-minna-no-doubutsuen":
    "Minna no Doubutsuen is a zoo-themed DS management and care game with animal interaction, facility goals, and family-friendly presentation. It fits Taito's line of accessible lifestyle sims aimed at younger players.",
  "ds-minna-no-ds-seminar-kanpeki-eitango-ryoku":
    "Minna no DS Seminar: Kanpeki Eitango Ryoku is an English-vocabulary study aid for Japanese DS owners, built around drills, review, and test-preparation style practice. It should be presented as education software, not a word game.",
  "ds-minna-no-ds-seminar-kanpeki-kanji-ryoku":
    "Minna no DS Seminar: Kanpeki Kanji Ryoku focuses on kanji study, recognition, writing, and review exercises using the DS touch screen. It belongs in the Japanese learning-software catalog where curriculum focus is the key detail.",
  "ds-minna-no-mahjong-kenkou-mahjong-ds":
    "Minna no Mahjong: Kenkou Mahjong DS is a Japanese mahjong title focused on table play, rule practice, and approachable presentation. It is a straightforward mahjong release where exact regional title matching matters for collectors.",
  "ds-minna-no-oekakiyasan":
    "Minna no Oekakiyasan is a drawing and creativity DS release from Taito and Climax Entertainment, using the touch screen for sketching and playful art activities. It is closer to creative software than a conventional game campaign.",
  "ds-minna-no-suizokukan":
    "Minna no Suizokukan is an aquarium-themed DS title about sea-life presentation, collection, and gentle management-style play. It fits Taito's family-friendly simulation catalog alongside zoo and everyday-life themes.",
  "ds-minna-to-kimi-no-piramekino":
    "Minna to Kimi no Piramekino! adapts the Japanese children's variety program Piramekino into a DS minigame and activity package. The television license is the central appeal, with short challenges aimed at young fans.",
  "ds-minute-to-win-it":
    "Minute to Win It adapts the TV game show into quick DS challenges based on simple tasks, timers, and score goals. It is a licensed party-style release where recognizable show branding matters more than long-form progression.",
  "ds-mirakuru-mimika-ds":
    "Mirakuru! Mimika DS is a Culture Brain cooking and character game tied to the NHK anime about food and recipes. It uses the license for light cooking-themed activities and kid-friendly story framing.",
  "ds-miss-princess-mispri":
    "Miss Princess: MisPri! is a Koei Tecmo DS game based on the shojo manga, focusing on fashion, etiquette, character events, and princess-training themes. It is a licensed girls' lifestyle release with manga tie-in appeal.",
  "ds-mission-runway":
    "Mission: Runway is a fashion-design DS game about creating outfits, styling models, and progressing through runway-themed challenges. It belongs with THQ's casual lifestyle software aimed at players who enjoy customization and presentation.",
  "ds-mite-wa-ikenai":
    "Mite wa Ikenai is a Japanese horror and visual-puzzle release about unsettling imagery, observation, and psychological tension. It is a niche DS import where mood and curiosity carry the appeal more than conventional action.",
  "ds-mitsukete-keroro-gunsou":
    "Mitsukete! Keroro Gunsou is a licensed DS game starring the Sgt. Frog cast, built around finding characters or objects through light adventure and puzzle-style tasks. It is mainly for fans tracking Keroro game appearances.",
  "ds-miyamoto-sansuu-kyoushitsu-no-kyouzai-kashikoku-naru-puzzle-ds-ban":
    "Miyamoto Sansuu Kyoushitsu no Kyouzai: Kashikoku naru Puzzle DS Ban is a Gakken math-puzzle education title based on classroom materials, using logic problems and number challenges for study. It should be framed as educational puzzle software.",
  "ds-mizuiro-blood":
    "Mizuiro Blood is a Bandai Namco DS oddity from Crafts & Meister, mixing strange character comedy, minigames, and offbeat presentation around its blue mascot. It is memorable as a quirky Japan-only release rather than a standard mascot platformer.",
  "ds-mlb-power-pros-2008":
    "MLB Power Pros 2008 brings Konami's big-headed Power Pros baseball style to Nintendo DS with Major League Baseball teams, season play, batting, pitching, and approachable handheld controls. It is a licensed baseball game with a distinct cartoon identity rather than a generic sports sim.",
  "ds-moe-moe-2-ji-daisenryaku-2-yamato-nadesico":
    "Moe Moe 2-Ji Daisenryaku 2: Yamato Nadesico is a SystemSoft strategy game that mixes World War II-inspired unit tactics with anime-style personified military hardware. It belongs in the Daisenryaku family, but its character-heavy presentation makes it very different from a straight war-game release.",
  "ds-moesta-moeru-toudai-eigojuku":
    "Moesta: Moeru Toudai Eigojuku is an English-study DS title that wraps vocabulary and exam-style practice in anime-styled presentation. It is best understood as educational software for Japanese learners, with the novelty coming from its character-driven study format.",
  "ds-moetan-ds":
    "Moetan DS adapts the Moetan English-learning/anime property into a DS study and story package, pairing language drills with visual-novel-style character scenes. It should be framed as an education/media tie-in rather than a conventional romance adventure.",
  "ds-mommy-talk-ds":
    "Mommy Talk DS is a Japanese parenting and baby-care support title for Nintendo DS, using the handheld as a communication, advice, or record-keeping tool around early childcare. It sits in the DS lifestyle-software wave rather than the normal game catalog.",
  "ds-momotarou-dentetsu-ds":
    "Momotarou Dentetsu DS brings Hudson's long-running train-and-board-game series to Nintendo DS, with players traveling across Japan, buying properties, triggering events, and trying to out-earn rivals. It is closer to a competitive board game than a simple minigame collection.",
  "ds-momotarou-dentetsu-world":
    "Momotarou Dentetsu World takes the familiar property-buying train-board formula beyond Japan, using world travel as the theme for routes, events, and money swings. It is a distinct DS entry for collectors because the global setting separates it from the Japan-map versions.",
  "ds-momotarou-dentetsu-20-shuunen":
    "Momotarou Dentetsu: 20-Shuunen celebrates the series' anniversary with the same competitive railway-board-game structure: moving by dice, investing in destinations, and surviving disruptive events. Its anniversary framing makes it more than a routine portable installment.",
  "ds-mon-coach-personnel-j-ameliore-mon-anglais":
    "Mon Coach Personnel: J'ameliore mon Anglais is Ubisoft's French-market English-learning DS software, built around vocabulary, listening, and short practice sessions. Its value is in language coaching and regional localization, not traditional game progression.",
  "ds-mon-premier-bescherelle":
    "Mon Premier Bescherelle adapts the well-known French grammar reference brand into a DS learning tool for spelling, conjugation, and language exercises. It is educational software with clear regional appeal for French-language collectors.",
  "ds-monkey-madness-island-escape":
    "Monkey Madness: Island Escape is a budget DS adventure/puzzle game about guiding monkeys through island challenges and simple obstacle scenarios. It is a light family release where the tropical setting and puzzle-adventure framing give it more identity than the generic metadata suggests.",
  "ds-monochrome-boo-and-baby-boo-kururin-boo":
    "Monochrome Boo & Baby Boo: Kururin Boo uses San-X's panda characters for a DS puzzle game built around cute presentation, simple rules, and quick handheld play. The character license is the main identifier for collectors.",
  "ds-monopoly":
    "Monopoly on DS adapts the classic property-trading board game with portable play, AI opponents, dice movement, auctions, and familiar bankrupt-your-rivals pacing. It should be surfaced as a board-game adaptation rather than a generic party game.",
  "ds-monopoly-boggle-yahtzee-battleship":
    "Monopoly / Boggle / Yahtzee / Battleship is a tabletop compilation bundling four classic Hasbro-style games into one DS cartridge. The appeal is variety and recognizable family-game rules, so the individual included titles are the most important catalog detail.",
  "ds-monoshiri-sengoku-ou":
    "Monoshiri Sengoku Ou is a Sengoku-era knowledge and quiz-style DS release from Global A, built around Japanese history facts rather than action combat. It belongs with the system's educational and trivia software, with the warlord theme giving it its shelf identity.",
  "ds-monster-band":
    "Monster Band is a music game from Novarama about assembling a band of monsters and playing rhythm-focused songs on the DS. It uses character comedy and music performance as its hook, making it more specific than a standard rhythm label.",
  "ds-monster-bomber":
    "Monster Bomber is a Taito DS action-puzzle game where players fire or launch attacks at incoming monster formations, blending arcade timing with touch-screen targeting. It is closer to a score-driven handheld arcade game than a broad action adventure.",
  "ds-monster-frenzy":
    "Monster Frenzy is a light DS monster-collection and battle game built around capturing creatures, training them, and using them in simple combat. It fits the handheld's creature-game boom while staying distinct from Pokemon's RPG structure.",
  "ds-monster-mayhem-build-and-battle":
    "Monster Mayhem: Build and Battle focuses on constructing custom monsters from parts, then using them in battles and challenges. The build-and-fight loop is the key appeal, with customization doing more to define the game than generic RPG progression.",
  "ds-monster-puzzle":
    "Monster Puzzle is a Success DS puzzle game with monster-themed presentation and repeatable board-clearing challenges. It is a small import puzzle release where clear genre framing and publisher identification matter most.",
  "ds-monster-trucks-ds":
    "Monster Trucks DS is a handheld racing game about oversized trucks, rough tracks, jumps, and arcade-style vehicle events. It is most useful to collectors as an early DS monster-truck release with Majesco/THQ publishing variations.",
  "ds-montessori-music":
    "Montessori Music is an educational DS music title inspired by Montessori-style learning, using sound, rhythm, and simple activities to introduce musical concepts. It should read as early-learning software rather than a score-chasing rhythm game.",
  "ds-moomin-tani-no-okurimono":
    "Moomin Tani no Okurimono adapts Tove Jansson's Moomin world into a gentle DS adventure with character interaction, light exploration, and storybook presentation. The license and cozy tone are the core draw.",
  "ds-moorhuhn-ds":
    "Moorhuhn DS brings the German Crazy Chicken/Moorhuhn brand to Nintendo DS, using quick shooting-gallery and arcade-style challenges around the familiar chicken mascot. It is a European novelty-license release rather than a platformer.",
  "ds-moorhuhn-jahrmarkt-party":
    "Moorhuhn Jahrmarkt Party turns the Moorhuhn mascot into a fairground minigame collection, with carnival-style challenges built for short sessions. It should be listed as a themed party release separate from the shooting-gallery entries.",
  "ds-moorhuhn-jewel-of-darkness":
    "Moorhuhn: Jewel of Darkness is an adventure-puzzle spin on the Crazy Chicken brand, sending the mascot through treasure-hunt scenarios rather than pure gallery shooting. It is useful to distinguish because Moorhuhn DS titles vary widely by format.",
  "ds-more-successful-learning-maths":
    "More Successful Learning: Maths is a DS education title focused on math practice, classroom-style exercises, and short repeatable learning sessions. It belongs to the handheld's study-software catalog rather than its puzzle-game shelf.",
  "ds-mori-no-cafeteria-ds-oshare-na-cafe-recipe":
    "Mori no Cafeteria DS: Oshare na Cafe Recipe is a cafe-and-recipe themed DS title about food, cooking presentation, and light lifestyle play. It fits the DS wave of culinary and shopkeeping software aimed at casual portable sessions.",
  "ds-morinaga-takurou-no-okane-no-shin-joushiki-ds-training":
    "Morinaga Takurou no Okane no Shin Joushiki DS Training is a personal-finance education title built around money knowledge, quizzes, and practical learning sessions. The named financial commentator and training format are the key context for readers.",
  "ds-moshi-monsters-moshlings-theme-park":
    "Moshi Monsters: Moshlings Theme Park adapts the online children's brand into a DS adventure about collecting Moshlings, exploring themed park areas, and completing simple tasks. It is a licensed kids release tied to the Moshi Monsters web-game audience.",
  "ds-mots-croises":
    "Mots Croises is a French crossword puzzle release for Nintendo DS, focused on word grids, clues, and portable language play. It should be presented as a crossword title rather than a simulation game.",
  "ds-mots-croises-2":
    "Mots Croises 2 continues the French crossword format on DS with more clue-based word puzzles and quick handheld sessions. It is a sequel-style puzzle release where language and regional packaging are the main identifiers.",
  "ds-motto-hayaku-seikaku-ni-suu-sense-keisan-ryuoku-up-training-suutore":
    "Motto Hayaku! Seikaku Ni! Suu Sense Keisan Ryuoku Up Training - SuuTore is a Benesse math-training DS title about faster, more accurate calculation practice. It is educational drill software, not a general simulation game.",
  "ds-motto-hamster-to-kurasou-akachan-ga-umareta-yo":
    "Motto! Hamster to Kurasou: Akachan ga Umareta yo is a DS pet-care game about looking after hamsters, interacting through touch-screen routines, and following the addition of baby hamsters. It is a cute animal-care release rather than a visual novel.",
  "ds-motto-stitch-ds-rhythm-de-rakugaki-daisakusen":
    "Motto! Stitch! DS Rhythm de Rakugaki Daisakusen uses Disney's Stitch in a rhythm-and-drawing DS game where music timing and touch-screen doodling drive the play. It is a licensed Disney import with a much clearer hook than generic rhythm metadata.",
  "ds-mouichido-tsuueru-the-otona-no-shougakkou":
    "Mouichido Tsuueru - The Otona no Shougakkou is an adult-learning DS title built around reviewing elementary-school subjects through short lessons and quiz-style exercises. It belongs to the DS brain-training and study-tool boom.",
  "ds-mushi-zukan-ds-mushio-osagase":
    "Mushi Zukan DS: Mushio Sagase is an insect encyclopedia and activity release, using the DS as a portable bug guide with collection-minded learning. It is better framed as nature education software than a normal adventure game.",
  "ds-my-doitall":
    "My DoItAll turns the Nintendo DS into a kid-friendly organizer with calendar, notes, contacts, minigames, and communication-style features. It is closer to lifestyle utility software than a traditional simulation game.",
  "ds-moyashimon-ds":
    "Moyashimon DS adapts the manga and anime about seeing microbes into a handheld adventure with character scenes, fermentation humor, and collection-style biology gags. Its appeal comes from the unusual science-comedy license rather than action or puzzle depth.",
  "ds-mr-bean":
    "Mr. Bean turns the TV comedy character into a simple DS platform adventure built around slapstick movement, light hazards, and family-friendly stages. The useful collector context is the European licensed-game angle and Blast! Entertainment publishing history.",
  "ds-mtv-fan-attack":
    "MTV Fan Attack is a music-culture party release about quick challenges, celebrity-style presentation, and casual minigame competition. It represents the DS era when lifestyle brands often became low-pressure handheld party software.",
  "ds-murder-in-venice":
    "Murder in Venice is a hidden-object mystery adventure built around investigating a case, searching scenes, and following clues through a travel-flavored setting. It belongs with the DS's casual detective shelf rather than its action-adventure library.",
  "ds-murder-on-the-titanic":
    "Murder on the Titanic is a mystery adventure that uses the ship setting for hidden-object scenes, clue gathering, and suspenseful investigation beats. It is a late casual DS release where premise and atmosphere matter more than mechanical complexity.",
  "ds-mushi-machi-no-konchuu-monogatari":
    "Mushi: Machi no Konchuu Monogatari is a Taito insect-themed DS release about exploring bug habitats, collecting creatures, and working through nature-focused activities. It is better understood as a bug-collection adventure than a standard platform game.",
  "ds-mushishi-amefuru-sato":
    "Mushishi: Amefuru Sato adapts Yuki Urushibara's atmospheric series into a quiet DS adventure about observing mushi, reading environmental clues, and following folklore-like story moments. Its strength is mood and license fidelity, not fast action.",
  "ds-my-amusement-park":
    "My Amusement Park is a Scholastic DS management/activity game about building attractions, helping visitors, and completing kid-friendly park tasks. It fits the system's family simulation boom with a school-book-fair style identity.",
  "ds-my-animal-centre":
    "My Animal Centre is a pet-care DS release about treating animals, managing simple clinic routines, and completing touch-screen care tasks. It is aimed at younger players who want animal interaction more than a traditional puzzle challenge.",
  "ds-my-animal-centre-in-africa":
    "My Animal Centre in Africa shifts the veterinary-care premise toward African wildlife, with animal treatment, habitat flavor, and light management routines. The regional theme gives this entry a clearer identity than the broader My Animal Centre release.",
  "ds-my-baby-3-and-friends":
    "My Baby 3 & Friends continues the DS baby-care series with feeding, dressing, developmental minigames, and social play involving other toddlers. It is a lifestyle sim for younger casual players, not a rhythm game despite misleading metadata.",
  "ds-my-baby-boy":
    "My Baby Boy is a touch-screen care simulation about feeding, bathing, dressing, and helping a virtual baby grow through daily routines. Its DS hook is direct stylus interaction and a gendered companion version structure.",
  "ds-my-baby-first-steps":
    "My Baby First Steps follows the virtual-baby format into toddler milestones, adding walking, play, and care routines around early development. It is a sequel-style life sim where the appeal is nurturing progression, not score chasing.",
  "ds-my-baby-girl":
    "My Baby Girl mirrors My Baby Boy as a virtual-care DS release focused on nurturing routines, customization, and touch-screen interaction. Collectors should treat it as the companion version rather than a separate genre experiment.",
  "ds-my-ballet-studio":
    "My Ballet Studio is a dance-school life sim about training, practicing routines, and moving through a young performer's ballet goals. It belongs with DS career fantasy games aimed at players who liked fashion, pets, and performance themes.",
  "ds-my-boyfriend-2008":
    "My Boyfriend (2008) is a teen lifestyle and romance-themed DS release about social choices, style, and relationship scenarios. Its identity is tied to the European casual-market wave rather than deep adventure design.",
  "ds-my-boyfriend-2009":
    "My Boyfriend (2009) continues the dating/lifestyle premise with conversation, customization, and teen social scenarios. The year marker matters because multiple similarly named releases can appear in DS marketplace listings.",
  "ds-my-boyfriend-verliebt-in-einen-star":
    "My Boyfriend: Verliebt in einen Star is a German teen romance game about dating, celebrity crushes, fashion, and light story choices. It is mainly relevant as a regional-language lifestyle release for complete DS collectors.",
  "ds-my-english-coach":
    "My English Coach is Ubisoft's language-learning DS software, built around vocabulary practice, placement tests, pronunciation support, and daily exercises. It is educational software first, using game-like feedback to support language study.",
  "ds-my-english-coach-para-hispanoparlantes":
    "My English Coach: Para Hispanoparlantes adapts Ubisoft's English-learning format for Spanish-speaking players, with vocabulary drills, lessons, and progress tracking. The Spanish-language target audience is the key catalog distinction.",
  "ds-my-farm-around-the-world":
    "My Farm Around the World is a casual farming sim about raising animals, visiting different regions, and completing farm-care routines with a global-travel theme. It sits in the DS pet and lifestyle catalog rather than serious management simulation.",
  "ds-my-fashion-studio":
    "My Fashion Studio lets players design outfits, style looks, and work through fashion-themed activities using the DS touch screen. It belongs with the handheld's dress-up and career-fantasy software aimed at younger casual players.",
  "ds-my-first-dollhouse":
    "My First Dollhouse is a gentle DS playset-style release about decorating rooms, interacting with a dollhouse, and completing simple household activities. It is closer to a digital toy than a traditional game campaign.",
  "ds-my-friends":
    "My Friends is a social-life simulation about managing friendships, personality choices, and light day-to-day activities. It fits the DS lifestyle shelf where diaries, fashion, relationships, and minigames often blended together.",
  "ds-my-hero-doctor":
    "My Hero: Doctor is a career-fantasy DS game about treating patients, completing medical-themed minigames, and stepping through hospital routines. It is a kid-friendly role-play title rather than a medical simulation like Trauma Center.",
  "ds-my-hero-firefighter":
    "My Hero: Firefighter turns emergency response into a DS career adventure with rescue tasks, fire-related hazards, and short mission objectives. It should read as a public-service role-play game, not a fighting title.",
  "ds-my-horse-and-me-2-riding-for-gold":
    "My Horse & Me 2: Riding for Gold is an equestrian sports and care game about riding events, horse handling, grooming, and stable progression. It is a licensed horse-game entry where the riding fantasy is the core appeal.",
  "ds-my-melody-angel-book-denshi-techou-and-enjoy-game":
    "My Melody Angel Book: Denshi Techou & Enjoy Game turns Sanrio's My Melody brand into a DS organizer and activity package with notebook-style features and light minigames. Its collector value comes from the character license and Japanese release context.",
  "ds-my-pet-chimp":
    "My Pet Chimp is a pet-care sim about feeding, grooming, training, and playing with a virtual chimp through simple DS interactions. It belongs with the system's broad animal-care library aimed at younger players.",
  "ds-my-pet-dolphin":
    "My Pet Dolphin focuses on caring for and interacting with a virtual dolphin, using aquatic-themed routines and simple touch-screen activities. It is a niche animal-care release where the specific pet fantasy is the main differentiator.",
  "ds-my-pet-hotel-2":
    "My Pet Hotel 2 is a pet-care business sim about boarding animals, meeting care needs, and improving a small animal hotel. It has more management structure than a single-pet game while staying firmly in casual DS territory.",
  "ds-my-pet-school":
    "My Pet School is a casual animal-training game about teaching pets, caring for them, and completing school-themed activities. It fits the DS pet-sim wave where routines and collectible animals mattered more than challenge.",
  "ds-my-pet-shop":
    "My Pet Shop has players run a pet store, find animals, care for them, and match pets with customers. The Taito and Square Enix connection makes it more notable than many budget pet-care releases.",
  "ds-my-reading-tutor":
    "My Reading Tutor is an education-focused DS release built around reading practice, vocabulary, comprehension, and short lesson activities. It is classroom-adjacent software rather than a conventional puzzle game.",
  "ds-my-sat-coach":
    "My SAT Coach is Ubisoft's test-prep DS title, focused on practice questions, timed review, vocabulary, and score-improvement routines. It belongs in the education catalog and should be described through exam preparation.",
  "ds-my-secret-world-by-imagine":
    "My Secret World by Imagine is a diary and lifestyle DS release with private notes, personality activities, minigames, and customization aimed at younger players. It is closer to a digital journal than a normal simulation game.",
  "ds-my-stop-smoking-coach-allen-carr-s-easyway":
    "My Stop Smoking Coach: Allen Carr's EasyWay is a self-help DS application built around tracking habits, coaching prompts, and Allen Carr's quitting framework. It is wellness software in the DS library, not an entertainment-first game.",
  "ds-my-vet-practice-in-the-country":
    "My Vet Practice: In the Country is a rural veterinary-care sim about diagnosing animals, running a practice, and completing treatment routines. It sits with the DS's animal-care and job-fantasy releases.",
  "ds-my-virtual-tutor-reading-first-grade-to-second-grade":
    "My Virtual Tutor: Reading First Grade to Second Grade is a reading-study DS title built for early elementary practice, with grade-specific lessons and exercises. Its exact grade range is the most important catalog detail.",
  "ds-my-virtual-tutor-reading-kindergarten-to-first-grade":
    "My Virtual Tutor: Reading Kindergarten to First Grade is an early literacy tutor with phonics, reading, and grade-transition exercises. It should be treated as educational software for a specific age band.",
  "ds-my-virtual-tutor-reading-pre-k-to-kindergarten":
    "My Virtual Tutor: Reading Pre-K to Kindergarten focuses on pre-reading and kindergarten readiness through simple literacy activities. It belongs with DS learning tools rather than puzzle or adventure software.",
  "ds-mysims-racing":
    "MySims Racing brings EA's MySims characters into a kart-racing format with character customization, track events, and approachable power-up racing. The DS version is a lighter companion to the broader MySims spin-off line.",
  "ds-mysterious-adventures-in-the-caribbean":
    "Mysterious Adventures in the Caribbean is a casual hidden-object adventure about searching tropical scenes, following clues, and solving light puzzles. It belongs with the DS's budget mystery catalog rather than open exploration games.",
  "ds-mystery-case-files-prime-suspects":
    "Mystery Case Files: Prime Suspects adapts Big Fish's hidden-object formula to DS with crowded scenes, clue lists, and detective progression. It is one of the recognizable casual PC mystery brands that moved onto the handheld.",
  "ds-mystery-case-files-ravenhearst":
    "Mystery Case Files: Ravenhearst brings the haunted-estate hidden-object mystery to DS, centered on object hunts, puzzles, and gothic mansion atmosphere. It is a notable handheld version of Big Fish's long-running casual series.",
  "ds-mystery-mansion":
    "Mystery Mansion is a DS hidden-object and puzzle adventure built around exploring rooms, finding items, and uncovering a house-bound mystery. It is a compact casual release where setting and object-search play define the experience.",
  "ds-mystery-p-i-portrait-of-a-thief":
    "Mystery P.I.: Portrait of a Thief is a PopCap hidden-object mystery about tracking stolen art through searchable scenes and clue-based progression. It sits in the same casual detective lane as Mystery Case Files but with PopCap's lighter presentation.",
  "ds-mystery-stories":
    "Mystery Stories is a casual detective adventure that uses hidden-object scenes, puzzles, and travel-mystery pacing. It is best framed as a relaxed case-solving release for players who like object hunts more than action.",
  "ds-mystery-stories-curse-of-the-ancient-spirits":
    "Mystery Stories: Curse of the Ancient Spirits continues the hidden-object adventure format with archaeological themes, supernatural clues, and scene-by-scene puzzle progression. The subtitle is important because several DS mystery releases have similar names.",
  "ds-mystery-tales-2-the-spirit-mask":
    "Mystery Tales 2: The Spirit Mask is a hidden-object mystery built around a masked-spirit premise, item searches, and casual adventure puzzles. It is a sequel-style DS release for the European budget mystery shelf.",
  "ds-mystery-tales-time-travel":
    "Mystery Tales: Time Travel uses time-hopping locations for hidden-object searches and light adventure puzzles. Its hook is moving through different periods while keeping the familiar casual mystery structure.",
  "ds-nadia-megafun-land":
    "Nadia Megafun Land is a casual DS activity game with amusement-park style minigames, bright presentation, and quick tasks for younger players. It is a family-market release where the Nadia branding and regional packaging carry most of the identity.",
  "ds-nadia-s-world":
    "Nadia's World is a lifestyle and activity release built around simple challenges, customization, and young-player presentation. It fits the DS's European casual catalog, where exact title and publisher details help separate it from similar budget games.",
  "ds-nakayoshi-all-stars-mezase-gakuen-idol":
    "Nakayoshi All-Stars: Mezase Gakuen Idol is a Japanese magazine-crossover idol game about school events, character interactions, and performance goals. Its collector interest comes from the Nakayoshi character mix and idol-school framing.",
  "ds-nakayoshi-quiz-no-oshigo-to-theme-park":
    "Nakayoshi Quiz no Oshigo to Theme Park turns Nakayoshi's manga-magazine world into a quiz and theme-park activity game. It is a character-license trivia release rather than a generic puzzle title.",
  "ds-nana-live-staff-daiboshuu-shoshinsha-kangei":
    "NANA: Live Staff Daiboshuu! Shoshinsha Kangei adapts the manga/anime's music-scene drama into a DS staff-management and story game. Its hook is supporting the band/live-show fantasy from the NANA universe.",
  "ds-nanami-no-oshiete-eibunpou-ds-kisokara-manabu-step-up-gakushuu":
    "Nanami no Oshiete Eibunpou DS: Kisokara Manabu Step Up Gakushuu is an English grammar study title with lesson progression, drills, and mascot-led instruction. It belongs in the DS's Japanese education software shelf.",
  "ds-nanami-no-oshiete-english-ds-mezase-toeic-master":
    "Nanami no Oshiete English DS: Mezase TOEIC Master focuses on TOEIC preparation, English vocabulary, grammar review, and test-minded practice sessions. It is a specialized study aid rather than a conventional game.",
  "ds-nanashi-no-game":
    "Nanashi no Game is a Square Enix horror adventure about a cursed retro-style game, first-person exploration, and unsettling DS-screen tricks. It is one of the system's more interesting Japan-only horror releases.",
  "ds-nanashi-no-game-me":
    "Nanashi no Game Me follows the cursed-game horror premise with more supernatural investigation, retro-game interruptions, and DS-specific scare presentation. It is a direct sequel for collectors following Square Enix's handheld horror experiments.",
  "ds-nanatsuiro-drops-touch-de-hajimaru-hatsukoi-monogatari":
    "Nanatsuiro Drops: Touch de Hajimaru Hatsukoi Monogatari adapts the romance visual novel/anime into a DS story game with magical-girl flavor, character routes, and touch-screen interaction. It belongs with import visual novels, not generic adventure games.",
  "ds-marvel-nemesis-rise-of-the-imperfects":
    "Marvel Nemesis: Rise of the Imperfects compresses EA's superhero fighting game into a handheld one-on-one brawler starring Marvel icons and the original Imperfects roster. The DS version is mainly about quick arena fights, character matchups, and the novelty of seeing this mid-2000s Marvel crossover on Nintendo's dual-screen system.",
  "ds-nancy-drew-deadly-secret-of-olde-world-park":
    "Nancy Drew: Deadly Secret of Olde World Park sends Nancy into a closed amusement park investigation built around clue gathering, suspect interviews, environmental puzzles, and touch-screen item use. It plays like a compact mystery adventure for younger players rather than a full PC-style Nancy Drew case.",
  "ds-nancy-drew-the-hidden-staircase":
    "Nancy Drew: The Hidden Staircase adapts the long-running detective series into a DS point-and-click mystery with mansion exploration, object searches, dialogue, and puzzle solving. Its appeal is the classic Nancy Drew setup: strange events, hidden passages, and a case that unfolds through careful observation.",
  "ds-nancy-drew-the-model-mysteries":
    "Nancy Drew: The Model Mysteries puts the detective inside a fashion-world case, mixing hidden-object scenes, minigames, evidence collection, and interviews tied to the modeling industry. It is a lighter licensed mystery release aimed at players who want story clues more than action.",
  "ds-nancy-drew-the-mystery-of-the-clue-bender-society":
    "Nancy Drew: The Mystery of the Clue Bender Society follows Nancy through an exclusive detective society and a stolen-book investigation, using touchscreen puzzles, clue tracking, and conversation choices. It is notable as one of the DS-original Nancy Drew cases rather than a direct console port.",
  "ds-nanda-s-island":
    "Nanda's Island is a gentle hidden-object and puzzle adventure about restoring a tropical island after a storm. Players search scenes, complete small logic tasks, and gradually bring color and life back to the setting, making it a better fit for casual puzzle fans than action players.",
  "ds-nankoku-sodachi-ds":
    "Nankoku Sodachi DS is a Japan-only tropical life and communication title built around island routines, character interactions, and relaxed touch-screen play. Its collector identity comes from its niche Commseed release and vacation-life theme rather than a familiar international license.",
  "ds-nanpure-vow":
    "Nanpure VOW is FromSoftware's DS take on number-place puzzles, offering sudoku-style grids for quick stylus sessions. It is a pure puzzle-library release, interesting mostly because it sits far away from the action and RPG work most players associate with FromSoftware.",
  "ds-naraba-s-world-labyrinth-of-light":
    "Naraba's World: Labyrinth of Light is an educational fantasy adventure where players explore a storybook world while solving language and learning-focused challenges. It belongs to the DS's kid-friendly edutainment catalog, with value tied to the Naraba branding and regional release history.",
  "ds-naraba-s-world-the-mysterious-palace":
    "Naraba's World: The Mysterious Palace continues the educational adventure format with palace exploration, reading tasks, and puzzle-like lessons wrapped in fantasy presentation. It is best understood as a learning title with adventure dressing rather than a conventional RPG.",
  "ds-natalie-brooks-mystery-at-hillcrest-high":
    "Natalie Brooks: Mystery at Hillcrest High brings the PC hidden-object adventure series to DS with school-set mystery scenes, object hunts, light puzzles, and story clues. It is a casual detective game built for short sessions and visual searching.",
  "ds-natalie-brooks-the-treasures-of-the-lost-kingdom":
    "Natalie Brooks: The Treasures of the Lost Kingdom follows Natalie through a treasure-hunt mystery using hidden-object screens, inventory puzzles, and illustrated adventure scenes. The DS release gives casual mystery fans a compact version of the series' PC-style formula.",
  "ds-nazo-nazo-and-quiz-ittou-nyuukon-q-mate":
    "Nazo Nazo & Quiz Ittou Nyuukon Q Mate! is a Konami quiz and riddle game centered on rapid questions, Japanese wordplay, and party-style knowledge challenges. Import interest depends heavily on language comfort because the play value comes from reading and answering the prompts.",
  "ds-negima-chou-mahora-taisen-chuu-checkiin-zenin-shuugou-yappari-onsen-kichaimashitaa":
    "Negima!? Chou Mahora Taisen Chuu: Checkiin Zenin Shuugou! Yappari Onsen Kichaimashitaa adapts the Negima cast into a Japan-only character battle and event game. It leans on fan-service scenarios, Mahora Academy characters, and anime/manga familiarity more than broad DS action appeal.",
  "ds-negima-chou-mahora-taisen-kattoiin-keiyaku-shikkou-dechai-masuu":
    "Negima!? Chou Mahora Taisen Kattoiin, Keiyaku Shikkou Dechai masuu is another Negima DS entry focused on cast interactions, magic-school presentation, and lightweight battles built for series fans. It is primarily a character-license collectible in the Japanese DS library.",
  "ds-neko-neko-bakery-ds":
    "Neko Neko Bakery DS is a small-scale bakery management and character game with cat-themed presentation, order handling, and shop routines. It sits with the DS's cozy job-sim and mascot releases, where charm and packaging matter as much as mechanical depth.",
  "ds-nep-league-ds":
    "Nep League DS translates the Japanese TV quiz show into a handheld trivia format with word challenges, knowledge rounds, and show-style presentation. It is a language-heavy import release whose appeal is strongest for fans of the program or Japanese quiz software.",
  "ds-net-ghost-pipopa-pipopa-ds-daibouken":
    "Net Ghost Pipopa: Pipopa DS @ Daibouken!!! adapts the anime's internet-spirit premise into a DS adventure with character encounters, minigames, and kid-focused action. It is a license-driven import where recognizing the Pipopa cast is central to the appeal.",
  "ds-nettou-powerful-koushien":
    "Nettou! Powerful Koushien brings Konami's Power Pro baseball style to high-school tournament play, mixing approachable baseball action with team building and Koushien atmosphere. It is especially relevant to collectors following the long-running Powerful Pro Yakyuu family.",
  "ds-new-carnival-games":
    "New Carnival Games is a collection of midway-style events such as target shooting, ring tosses, strength tests, and quick novelty challenges. The DS version is built for short casual play and multiplayer-friendly party sessions rather than deep single-player progression.",
  "ds-new-chuugaku-eitango-target-1800-ds":
    "New Chuugaku Eitango Target 1800 DS is a Japanese middle-school English vocabulary trainer with word drills, review modes, and test-prep structure. It is education software, so its value comes from completeness and its place in the DS study-aid boom.",
  "ds-new-eitango-target-1900-ds":
    "New Eitango Target 1900 DS focuses on advanced English vocabulary practice for Japanese learners, turning the well-known study book series into flashcard-style DS sessions. It is a specialized learning title rather than entertainment software.",
  "ds-new-horizon-english-course-1":
    "New Horizon English Course 1 adapts the Japanese school textbook line into DS lessons with vocabulary, listening, grammar, and review exercises. It is tied to first-year junior-high English study and should be cataloged with education software.",
  "ds-new-horizon-english-course-1-ds":
    "New Horizon English Course 1 DS covers first-year English study through textbook-linked lessons, pronunciation support, drills, and stylus-based review. The DS branding separates it from adjacent New Horizon releases in the same education shelf.",
  "ds-new-horizon-english-course-2":
    "New Horizon English Course 2 continues the textbook-based English study sequence with second-year vocabulary, sentence patterns, and classroom-style exercises. It is useful in the database as part of a numbered education series rather than as a standalone game experience.",
  "ds-new-horizon-english-course-2-ds":
    "New Horizon English Course 2 DS presents the second-year New Horizon curriculum through portable drills, reading practice, and repeatable review sessions. It is a study companion that reflects how heavily the DS was used for school-support software in Japan.",
  "ds-new-horizon-english-course-3":
    "New Horizon English Course 3 targets third-year junior-high English study with exam-minded vocabulary, grammar, and reading exercises. Its library role is as the upper-level entry in the DS New Horizon education line.",
  "ds-new-horizon-english-course-3-ds":
    "New Horizon English Course 3 DS packages the third-year New Horizon textbook material into stylus-driven lessons, listening checks, and review drills. It is more valuable as a complete education-series entry than as a general-interest release.",
  "ds-new-touch-party-game":
    "New Touch Party Game collects simple touch-controlled party challenges designed around the DS screen setup. It favors fast rules, local play, and arcade-like novelty, making it part of the system's Japanese minigame catalog.",
  "ds-new-uno-kids-ds":
    "New Uno Kids DS is an IE Institute learning title built around English vocabulary practice for children, not a digital version of the UNO card game. The title belongs with Japan-only kids education releases and needs careful labeling to avoid marketplace confusion.",
  "ds-ni-hao-kai-lan-new-year-s-celebration":
    "Ni Hao, Kai-Lan: New Year's Celebration turns the Nickelodeon preschool series into gentle minigames, simple exploration, and holiday-themed activities. It is aimed at very young players, with cultural celebration framing and low-pressure touch controls.",
  "ds-ni-no-kuni-shikkoku-no-madoushi":
    "Ni no Kuni: Shikkoku no Madoushi is Level-5's original DS fantasy RPG with Studio Ghibli collaboration, command battles, spellcasting, and a physical magic book as part of the experience. It is one of the DS's major Japan-only RPG collector pieces.",
  "ds-nickelodeon-big-time-rush-backstage-pass":
    "Nickelodeon Big Time Rush: Backstage Pass is a music-license DS game built around band life, rhythm-flavored activities, customization, and TV-show branding. It is best read as a fan-focused release for the Big Time Rush audience.",
  "ds-nickelodeon-team-umizoomi":
    "Nickelodeon Team Umizoomi uses the preschool series' math-rescue format for counting, shapes, patterns, and simple touch-screen problem solving. The DS version is educational and parent-facing, aimed at early learners rather than traditional game players.",
  "ds-nicola-kanshuu-model-oshare-audition":
    "Nicola Kanshuu: Model Oshare Audition turns the Japanese fashion magazine brand into a modeling and style game with outfit coordination, auditions, and trend-focused presentation. It is an import fashion title where the Nicola tie-in is the key identity.",
  "ds-ninja-captains":
    "Ninja Captains is a party-style DS release with cartoon ninjas, touch-screen challenges, and quick competitive events. It is a budget-friendly novelty title whose appeal comes from simple multiplayer-like minigames rather than a long campaign.",
  "ds-nintama-rantarou-gakunen-taikousen-puzzle-no-dan":
    "Nintama Rantarou: Gakunen Taikousen Puzzle! no Dan adapts the long-running ninja school anime into puzzle competition with familiar student characters and class-versus-class framing. Import value is strongly tied to the Nintama license.",
  "ds-nintama-rantarou-nintama-no-tame-no-ninjutsu-training":
    "Nintama Rantarou: Nintama no Tame no Ninjutsu Training uses the anime's ninja-school premise for training exercises, minigames, and character activities. It is a light licensed release for fans of the series rather than a serious action game.",
  "ds-nintendogs-best-friends":
    "Nintendogs: Best Friends is a special bundle version of Nintendo's pet simulation built around caring for puppies, voice commands, walks, toys, competitions, and touch-screen interaction. It matters because Nintendogs was one of the DS's clearest demonstrations of casual handheld play.",
  "ds-nintendogs-dachshund-and-friends":
    "Nintendogs: Dachshund and Friends lets players adopt, train, walk, groom, and compete with virtual puppies using touch and voice controls. The Dachshund version has its own starting breed lineup, making version identity important for collectors.",
  "ds-nintendogs-dalmatian-and-friends":
    "Nintendogs: Dalmatian and Friends expands the pet-sim line with Dalmatian-focused branding, puppy care routines, obedience trials, disc competitions, and voice-command interaction. It is a later variant of one of Nintendo's most successful DS concepts.",
  "ds-nippon-futsal-league-kounin-minna-no-ds-futsal":
    "Nippon Futsal League Kounin: Minna no DS Futsal is an officially licensed Japanese futsal title centered on indoor soccer teams, compact matches, and league branding. It fills a specific sports niche inside the DS library.",
  "ds-nippon-golfers-kentei-ds":
    "Nippon Golfers Kentei DS is a Japanese golf knowledge and certification-style title with rules, quiz material, and learning content for golfers. It is closer to study software for the sport than a swing-based golf game.",
  "ds-nobunaga-no-yabou-ds-2":
    "Nobunaga no Yabou DS 2 brings Koei's historical strategy series back to the handheld with Sengoku-era territory control, officer management, diplomacy, and tactical decision making. It is a Japan-only strategy entry for players who want Nobunaga's Ambition on DS.",
  "ds-nobunaga-s-ambition-ds":
    "Nobunaga's Ambition DS adapts Koei's grand strategy formula for portable play, asking players to manage clans, expand territory, handle officers, and wage campaigns across feudal Japan. It is one of the DS library's more substantial historical strategy releases.",
  "ds-nodame-cantabile":
    "Nodame Cantabile turns the music manga and drama series into a DS rhythm and character game built around orchestra performance, comedic cast moments, and classical-music cues. It is an import title whose value depends on the Nodame license.",
  "ds-nodame-cantabile-tanoshii-ongaku-no-jikan-desu":
    "Nodame Cantabile: Tanoshii Ongaku no Jikan Desu continues the series' music-school atmosphere with rhythm activities, character scenes, and orchestra-themed minigames. It belongs with DS anime adaptations that are most meaningful to existing fans.",
  "ds-noddy-in-toyland":
    "Noddy in Toyland is a preschool-friendly adventure built around the children's TV character, with simple tasks, bright locations, and easy touch-screen activities. It targets early players and collectors of European children's licenses.",
  "ds-nora-to-toki-no-kobo-kiri-no-mori-no-majo":
    "Nora to Toki no Kobo: Kiri no Mori no Majo is an Atlus-published crafting RPG about gathering materials, alchemy-style creation, requests, and village life. It stands out in the DS import catalog because of its cozy workshop structure and strong creator pedigree.",
  "ds-norimono-oukoku-ds-you-unten-shichai-na-yo":
    "Norimono Oukoku DS: You! Unten Shichai na Yo! is a vehicle-themed kids title about driving and interacting with different forms of transport. Its appeal is simple vehicle fantasy for younger players rather than racing competition.",
  "ds-norinori-relakkuma-hit-song-ongakusai":
    "Norinori Relakkuma: Hit Song Ongakusai pairs San-X's relaxed bear mascot with rhythm-game activities and cheerful song presentation. It is a character-first music title for Relakkuma collectors and younger DS players.",
  "ds-nounai-aesthe-iq-suppli-ds":
    "Nounai Aesthe: IQ Suppli DS adapts the Japanese brain-training TV format into riddles, visual puzzles, and quick mental challenges. It fits the DS era's puzzle-and-brain boom, with the IQ Suppli license giving it a distinct identity.",
  "ds-nounai-aesthe-iq-suppli-ds-2-sukkiri-king-ketteisen":
    "Nounai Aesthe: IQ Suppli DS 2: Sukkiri King Ketteisen expands the TV-show puzzle formula with more brainteasers, timed challenges, and show-inspired presentation. It is a sequel for collectors tracking the Japanese brain-training wave.",
  "ds-nova-usagi-no-game-de-ryuugaku-ds":
    "Nova Usagi no Game de Ryuugaku!? DS uses Nova's rabbit mascot for English-learning activities, travel-themed lessons, and language practice. It is an education title wrapped in mascot branding from Japan's language-school market.",
  "ds-numpla-10000-mon":
    "Numpla 10000-Mon is a massive sudoku-style puzzle collection built around quantity: thousands of number-placement grids for long-term portable solving. It is notable for volume and straightforward puzzle utility rather than flashy presentation.",
  "ds-nursery-mania":
    "Nursery Mania adapts the casual time-management formula to childcare, asking players to juggle babies' needs, upgrades, and increasingly busy nursery routines. The DS version is aimed at fans of Diner Dash-style multitasking.",
  "ds-ochaken-no-daibouken-2-yume-ippai-no-omocha-hako":
    "Ochaken no Daibouken 2: Yume Ippai no Omocha Hako continues MTO's tea-puppy character line with gentle exploration, minigames, and toy-box themed charm. It is a mascot-driven import title with strong visual identity for character collectors.",
  "ds-ochaken-no-daibouken-honwaku-yumemiru-sekai-ryoukou":
    "Ochaken no Daibouken: Honwaku Yumemiru Sekai Ryoukou sends the tea-puppy mascots through dreamy worlds with simple platforming and child-friendly activities. It is one of the DS library's softer Japanese character adventures.",
  "ds-ochaken-no-heya-ds":
    "Ochaken no Heya DS focuses on caring for and interacting with MTO's tea-puppy mascots through room activities, decoration, and relaxed minigames. Its identity is cozy character companionship rather than challenge.",
  "ds-ochaken-no-heya-ds-2":
    "Ochaken no Heya DS 2 builds on the tea-puppy room format with more interaction, activities, and character-collecting appeal. It is best cataloged as a mascot lifestyle sequel in the Japanese DS market.",
  "ds-ochaken-no-heya-ds-3":
    "Ochaken no Heya DS 3 continues the Ochaken room and care concept, giving fans more mascot interactions, decorations, and gentle daily-play tasks. It is a completion-focused title for collectors following the whole MTO line.",
  "ds-ochaken-no-heya-ds-4":
    "Ochaken no Heya DS 4 is a later entry in MTO's tea-puppy care series, centered on relaxed room play, character charm, and light touch-screen activities. Its main importance is as part of the full Ochaken DS subset.",
  "ds-odenkun-tanoshii-oden-mura":
    "Odenkun: Tanoshii Oden Mura adapts the children's character series into a village activity game with friendly tasks, simple minigames, and food-themed character humor. It is a Japan-only licensed title with a very specific mascot audience.",
  "ds-odoru-daisousasen-the-game-sensuikan-ni-sennyuu-seyo":
    "Odoru Daisousasen The Game: Sensuikan ni Sennyuu Seyo! adapts the Bayside Shakedown police franchise into an investigation and scenario game involving a submarine infiltration case. It is a drama-license import where story context matters heavily.",
  "ds-oekaki-puzzle-battle-vol-1-yuusha-oh-gaogaigar-version":
    "Oekaki Puzzle Battle Vol. 1: Yuusha-Oh GaoGaiGar Version combines nonogram-style picture puzzles with Brave-series mecha branding and battle presentation. It is a niche crossover for puzzle fans who also collect GaoGaiGar material.",
  "ds-ogwangui-darin-ds":
    "Ogwangui Darin DS is a Korean DS release tied to the Go/Baduk training space, with board-game study, problem solving, and practice-oriented presentation. It is most relevant as a regional strategy and learning title.",
  "ds-oha-star-645-musshees-no-fushigi-na-nouen-yoshimoto-geinin-to-tomodachi-net":
    "Oha Star 645: Musshees no Fushigi na Nouen - Yoshimoto Geinin to Tomodachi Net mixes TV-variety branding, farm-like creature activities, and Japanese comedian tie-ins. It is a culturally specific import whose charm depends on recognizing the Oha Star ecosystem.",
  "ds-ojaru-maru-ds-ojaru-to-okeiko-aiueo":
    "Ojaru-Maru DS: Ojaru to Okeiko Aiueo turns the children's anime into early Japanese character and kana-learning activities. It is a young-player education release where the Ojaru-Maru license provides the hook.",
  "ds-ok-puzzle-stars":
    "OK! Puzzle Stars is a budget DS puzzle collection with approachable logic and casual challenges designed for quick sessions. It belongs with the system's broad European puzzle catalog, where exact edition and publisher data help avoid duplicate-looking records.",
  "ds-okaeri-chibi-robo-happy-richie-oosouji":
    "Okaeri! Chibi-Robo! Happy Richie Oosouji! brings Chibi-Robo back to domestic cleanup, tiny-scale exploration, and helpful household tasks, this time through a Japan-only DS adventure. Nintendo fans value it as an untranslated continuation of one of the company's quirkiest character series.",
};

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  try {
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    if (error.code !== "EPERM" && error.code !== "EACCES") throw error;
    fs.copyFileSync(tempPath, filePath);
    fs.unlinkSync(tempPath);
  }
}

const games = readJsonIfExists(dataPath, null);
const manifest = readJsonIfExists(manifestPath, {});
if (!Array.isArray(games)) throw new Error("Run scripts/import-ds-official-list.js first.");

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

console.log(`Seeded ${seeded} DS editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
