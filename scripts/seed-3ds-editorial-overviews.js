const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "3ds.json");
const manifestPath = path.join(rootDir, "data", "games", "3ds-manifest.json");

const seeds = {
  "3ds-super-mario-3d-land":
    "Super Mario 3D Land translates Mario's 3D movement into compact handheld stages, mixing side-scrolling clarity with depth-based platforming. It became one of the clearest early examples of why stereoscopic 3D could matter on the system.",
  "3ds-mario-kart-7":
    "Mario Kart 7 adds gliding, underwater sections, kart customization, and strong handheld online racing to Nintendo's long-running series. It is one of the 3DS library's evergreen multiplayer staples.",
  "3ds-animal-crossing-new-leaf":
    "Animal Crossing: New Leaf gives the player mayoral control over a town, adding public works projects, ordinances, deeper customization, and a relaxed daily-life loop. It became one of the defining social games on 3DS.",
  "3ds-animal-crossing-happy-home-designer":
    "Animal Crossing: Happy Home Designer focuses on room and facility design, turning the series' decorating systems into the main event. It is especially relevant for collectors tracking amiibo card support.",
  "3ds-pokemon-x":
    "Pokemon X brought the mainline series into full 3D with the Kalos region, Mega Evolution, online-friendly systems, and a refreshed presentation. It is a key generation-shift release for Pokemon collectors.",
  "3ds-pokemon-y":
    "Pokemon Y pairs with Pokemon X as the other Kalos adventure, featuring version-exclusive Pokemon and the same major 3D leap for the series. Complete-case copies remain important for Nintendo handheld collectors.",
  "3ds-pokemon-omega-ruby":
    "Pokemon Omega Ruby remakes the Game Boy Advance Hoenn adventure with 3D presentation, Mega Evolution, expanded postgame content, and modernized online features. It is a major remake entry in the 3DS Pokemon run.",
  "3ds-pokemon-alpha-sapphire":
    "Pokemon Alpha Sapphire revisits Hoenn with updated battles, new story additions, and version-exclusive content opposite Omega Ruby. It is a core 3DS Pokemon title for collectors building complete paired sets.",
  "3ds-pokemon-sun":
    "Pokemon Sun changes the series rhythm with Alola's island trials, regional forms, and a stronger story focus. It helped move Pokemon away from the traditional gym structure on Nintendo handhelds.",
  "3ds-pokemon-moon":
    "Pokemon Moon complements Pokemon Sun with its shifted in-game clock, version exclusives, and Alola adventure structure. It is a central late-era 3DS Pokemon release.",
  "3ds-pokemon-ultra-sun":
    "Pokemon Ultra Sun revises the Alola campaign with expanded Ultra Beast content, new forms, and a larger postgame. It is one of the final major Pokemon releases on the 3DS family.",
  "3ds-pokemon-ultra-moon":
    "Pokemon Ultra Moon adds an alternate version of the expanded Alola story, with version differences that matter for collectors and players completing the generation.",
  "3ds-luigi-s-mansion-dark-moon":
    "Luigi's Mansion: Dark Moon turns ghost hunting into mission-based handheld exploration across multiple mansions. Its animation, puzzle rooms, and Poltergust play made it one of the 3DS's major Nintendo sequels.",
  "3ds-luigi-s-mansion":
    "Luigi's Mansion on 3DS adapts the GameCube original with stereoscopic presentation, handheld controls, and added boss-rush-style content. It is a notable late-life 3DS remake.",
  "3ds-the-legend-of-zelda-ocarina-of-time-3d":
    "The Legend of Zelda: Ocarina of Time 3D updates Nintendo's landmark adventure with cleaner visuals, touch-screen inventory, gyro aiming, and Master Quest support. It is one of the system's strongest remakes.",
  "3ds-the-legend-of-zelda-majora-s-mask-3d":
    "The Legend of Zelda: Majora's Mask 3D revisits Termina with updated graphics, revised save flow, touch-screen tools, and tuned boss encounters. It remains one of the 3DS's most important Zelda releases.",
  "3ds-the-legend-of-zelda-a-link-between-worlds":
    "The Legend of Zelda: A Link Between Worlds returns to the world of A Link to the Past while adding wall-merging puzzles and item rental freedom. It is a standout original Zelda built specifically for 3DS.",
  "3ds-fire-emblem-awakening":
    "Fire Emblem Awakening revitalized the strategy RPG series with pair-up mechanics, relationship systems, flexible difficulty, and a broad cast. It became one of the 3DS's most important turning-point releases.",
  "3ds-fire-emblem-fates-birthright":
    "Fire Emblem Fates: Birthright presents the more approachable side of the Fates split, emphasizing open grinding and the Hoshido campaign. It is best understood alongside Conquest and Revelation.",
  "3ds-fire-emblem-fates-conquest":
    "Fire Emblem Fates: Conquest is the more tightly designed and challenging Fates campaign, built around limited resources and varied objectives. It is a major 3DS strategy title for experienced players.",
  "3ds-fire-emblem-fates-revelation":
    "Fire Emblem Fates: Revelation acts as the third route, tying together the Birthright and Conquest conflict with its own maps and story path. Its digital distribution history makes it important to document carefully.",
  "3ds-fire-emblem-echoes-shadows-of-valentia":
    "Fire Emblem Echoes: Shadows of Valentia remakes Fire Emblem Gaiden with full voice acting, dungeon exploration, and unusual series mechanics. It is one of the most polished late-era 3DS strategy RPGs.",
  "3ds-kid-icarus-uprising":
    "Kid Icarus: Uprising revives Pit with fast aerial shooting, ground combat, intense banter, and deep weapon fusion. It is one of the 3DS's most ambitious Nintendo originals.",
  "3ds-monster-hunter-4-ultimate":
    "Monster Hunter 4 Ultimate gives the 3DS a deep action-hunting game with vertical movement, mounting, online multiplayer, and a huge equipment grind. It became a cornerstone title for 3DS multiplayer fans.",
  "3ds-monster-hunter-generations":
    "Monster Hunter Generations celebrates the series with hunting styles, hunter arts, returning villages, and a large monster roster. It is a broad collector and player favorite in the 3DS action library.",
  "3ds-bravely-default":
    "Bravely Default is a classic-style Square Enix RPG built around brave/default turn manipulation, job customization, and a sweeping fantasy story. It became one of the 3DS's essential original RPGs.",
  "3ds-bravely-second-end-layer":
    "Bravely Second: End Layer continues the job-based RPG formula with new classes, returning systems, and a direct follow-up story. It is a natural companion piece to Bravely Default.",
  "3ds-xenoblade-chronicles-3d":
    "Xenoblade Chronicles 3D brings Monolith Soft's large-scale Wii RPG to New Nintendo 3DS hardware, preserving real-time battles, huge zones, and character-driven exploration. Hardware compatibility matters for listings.",
  "3ds-metroid-samus-returns":
    "Metroid: Samus Returns remakes Metroid II with counterattacks, free aiming, detailed 2.5D environments, and modern boss design. It is one of the 3DS's strongest late Nintendo action games.",
  "3ds-kirby-triple-deluxe":
    "Kirby: Triple Deluxe uses foreground-background depth, copy abilities, and Hypernova sections to build a bright handheld Kirby adventure. It is a polished platformer in the 3DS first-party catalog.",
  "3ds-kirby-planet-robobot":
    "Kirby: Planet Robobot gives Kirby mechanized armor, clever ability twists, and some of the system's strongest late-era platform design. It is widely regarded as one of Kirby's best handheld entries.",
  "3ds-donkey-kong-country-returns-3d":
    "Donkey Kong Country Returns 3D adapts the Wii platformer with handheld play, added items, and new levels. It is a strong 3DS option for players who want difficult side-scrolling action.",
  "3ds-new-super-mario-bros-2":
    "New Super Mario Bros. 2 emphasizes coin collecting, familiar 2D Mario stages, and quick handheld sessions. Its abundance of coins gives it a distinct identity within the New Super Mario Bros. line.",
  "3ds-super-smash-bros-for-nintendo-3ds":
    "Super Smash Bros. for Nintendo 3DS brings Nintendo's crossover fighter to handhelds with a large roster, online play, custom moves, and Smash Run. It was a major technical and multiplayer milestone for the system.",
  "3ds-mario-and-luigi-dream-team":
    "Mario & Luigi: Dream Team mixes timing-based RPG battles with dream-world mechanics built around Luigi. It is one of the 3DS's major Mario RPG entries.",
  "3ds-mario-and-luigi-paper-jam":
    "Mario & Luigi: Paper Jam crosses the Mario & Luigi and Paper Mario styles with trio attacks, papercraft battles, and comedy-heavy RPG pacing. It is a notable crossover within Nintendo's RPG catalog.",
  "3ds-paper-mario-sticker-star":
    "Paper Mario: Sticker Star rebuilds Paper Mario around collectible stickers, puzzle-like battles, and compact stages. It is a divisive but important 3DS Mario RPG-adjacent release.",
  "3ds-professor-layton-and-the-miracle-mask":
    "Professor Layton and the Miracle Mask brings the puzzle-adventure series to 3DS with 3D character scenes, mystery storytelling, and daily downloadable puzzles. It is a strong entry for puzzle collectors.",
  "3ds-professor-layton-and-the-azran-legacy":
    "Professor Layton and the Azran Legacy closes the prequel-era Layton story with globe-trotting mysteries and puzzle-heavy adventure structure. It is an important 3DS release for series completionists.",
  "3ds-professor-layton-vs-phoenix-wright-ace-attorney":
    "Professor Layton vs. Phoenix Wright: Ace Attorney blends puzzle investigation with courtroom cross-examinations. It is one of the 3DS's most distinctive crossover adventure games.",
  "3ds-phoenix-wright-ace-attorney-dual-destinies":
    "Phoenix Wright: Ace Attorney - Dual Destinies moves the courtroom series into 3D character animation, adding mood-matrix testimony and a new legal cast dynamic. It is a key digital-era Ace Attorney release.",
  "3ds-phoenix-wright-ace-attorney-spirit-of-justice":
    "Phoenix Wright: Ace Attorney - Spirit of Justice splits its cases between familiar courts and the kingdom of Khura'in, adding divination seance testimony. It is a major late 3DS visual-novel release.",
  "3ds-shin-megami-tensei-iv":
    "Shin Megami Tensei IV brings Atlus's demon negotiation, alignment choices, and punishing turn-based battles to a new handheld setting. It is one of the 3DS's premier mature RPGs.",
  "3ds-shin-megami-tensei-iv-apocalypse":
    "Shin Megami Tensei IV: Apocalypse follows a parallel route with refined combat, new characters, and a more direct story focus. It is an important companion to SMT IV for collectors.",
  "3ds-persona-q-shadow-of-the-labyrinth":
    "Persona Q: Shadow of the Labyrinth blends Persona characters with Etrian Odyssey-style dungeon mapping and party building. It is a major Atlus crossover for 3DS RPG fans.",
  "3ds-etrian-odyssey-iv-legends-of-the-titan":
    "Etrian Odyssey IV: Legends of the Titan uses touch-screen map drawing, party customization, and first-person dungeon crawling to define the 3DS's traditional RPG niche.",
  "3ds-radiant-historia-perfect-chronology":
    "Radiant Historia: Perfect Chronology expands the DS RPG with new story content, voice acting, and timeline-based progression. It is one of the 3DS's most respected late RPG releases.",
  "3ds-dragon-quest-viii":
    "Dragon Quest VIII on 3DS adapts the PlayStation 2 RPG with portable play, extra party members, visible encounters, and added content. It is a key Square Enix release on the handheld.",
  "3ds-kingdom-hearts-3d-dream-drop-distance":
    "Kingdom Hearts 3D: Dream Drop Distance adds drop-based character switching, Flowmotion traversal, and Dream Eater partners to the series' action RPG formula. It is a major bridge entry for Kingdom Hearts fans.",
  "3ds-resident-evil-revelations":
    "Resident Evil: Revelations brings a console-style survival-horror campaign to 3DS with ship exploration, over-the-shoulder combat, and Raid Mode. It showed how ambitious third-party 3DS games could be.",
  "3ds-theatrhythm-final-fantasy-curtain-call":
    "Theatrhythm Final Fantasy: Curtain Call expands the rhythm RPG tribute with a large Final Fantasy music catalog, party progression, and replayable challenge charts. It is a standout music game on 3DS.",
  "3ds-star-fox-64-3d":
    "Star Fox 64 3D updates Nintendo's rail shooter with cleaner visuals, gyro options, and portable multiplayer. It is a strong 3DS remake of one of Nintendo's arcade-like classics.",
  "3ds-pilotwings-resort":
    "Pilotwings Resort uses Wuhu Island as a relaxed flight playground for planes, rocket belts, and hang gliders. It is a launch-era showcase for 3DS depth and short-session play.",
  "3ds-tomodachi-life":
    "Tomodachi Life turns Miis into a surreal life-simulation comedy, built around relationships, songs, dreams, and strange daily events. It became one of the 3DS's most personality-driven hits.",
  "3ds-miitopia":
    "Miitopia builds a light RPG around Miis, relationship comedy, job classes, and party interactions. It is an accessible late-era 3DS title with strong personalization appeal.",
  "3ds-fantasy-life":
    "Fantasy Life combines action RPG quests with life-sim jobs, crafting, gathering, and relaxed progression. It is one of the 3DS's most approachable long-form adventure games.",
  "3ds-ever-oasis":
    "Ever Oasis blends town building, action RPG dungeons, party swapping, and resource gathering into a late 3DS original. It is a notable Nintendo-published adventure near the system's twilight.",
  "3ds-boxboy":
    "BoxBoy! is a minimalist puzzle-platformer about creating boxes to bridge gaps, block hazards, and solve compact stages. It became one of the 3DS eShop's cleanest original puzzle ideas.",
  "3ds-shovel-knight":
    "Shovel Knight brings retro-styled action platforming, tight stage design, and expressive boss fights to 3DS. The handheld version is notable for stereoscopic depth and amiibo support.",
  "3ds-azure-striker-gunvolt":
    "Azure Striker Gunvolt is an Inti Creates action game built around tagging enemies, electric attacks, and fast score-oriented stages. It is one of the 3DS eShop's major original action releases.",
  "3ds-yo-kai-watch":
    "Yo-kai Watch starts Level-5's monster-collecting series with neighborhood exploration, automatic battles, and a playful modern setting. It became a major 3DS franchise with strong collector interest.",
  "3ds-yo-kai-watch-3":
    "Yo-kai Watch 3 is a large late 3DS RPG with multiple protagonists, a huge Yo-kai roster, and unusually high collector demand in North America. Authentic copies deserve careful verification.",
  "3ds-ridge-racer-3d":
    "Ridge Racer 3D brings Namco's arcade drifting series to the 3DS launch window with familiar high-speed cornering and portable racing structure.",
  "3ds-dead-or-alive-dimensions":
    "Dead or Alive: Dimensions adapts Team Ninja's 3D fighter for handheld play with touch shortcuts, story coverage, and fast counter-based combat.",
  "3ds-super-street-fighter-iv-3d-edition":
    "Super Street Fighter IV: 3D Edition delivers Capcom's fighter on 3DS with online play, touch-screen specials, and stereoscopic camera options. It was a major third-party launch-window release.",
  "3ds-metal-gear-solid-snake-eater-3d":
    "Metal Gear Solid: Snake Eater 3D adapts the stealth-action classic with 3DS-specific aiming, camera, and photo-camouflage features. It is a notable premium third-party port.",
  "3ds-cave-story-3d":
    "Cave Story 3D reimagines the indie action-adventure with polygonal environments while preserving the original's exploration, weapons, and melancholic story. It is a distinctive physical 3DS version.",
  "3ds-rhythm-heaven-megamix":
    "Rhythm Heaven Megamix collects and remixes Nintendo's rhythm-game microchallenge format with precise timing, bright humor, and a broad setlist. It is a late 3DS favorite for rhythm fans.",
  "3ds-bricks-defender-5":
    "Bricks Defender 5 is a compact eShop puzzle-defense game built around keeping waves of blocks under control before they overwhelm the screen. Its appeal is in quick pattern reading, score chasing, and simple rules that make it easy to treat as a short-session 3DS download.",
  "3ds-bricks-pinball":
    "Bricks Pinball blends block-clearing puzzle structure with pinball-style rebounds, asking players to aim shots, manage angles, and clear layouts efficiently. It is a small-scale digital release where the hook is less about simulation pinball and more about arcade puzzle repetition.",
  "3ds-bricks-pinball-2":
    "Bricks Pinball 2 continues nuGAME's brick-and-ball formula with another set of compact stages centered on rebounds, target clearing, and quick retry play. For the 3DS library, it fits best as part of the system's inexpensive eShop puzzle catalog rather than a traditional boxed-style release.",
  "3ds-bricks-pinball-3":
    "Bricks Pinball 3 is another entry in nuGAME's numbered Bricks Pinball line, focused on ricochet angles, target clearing, and short arcade sessions. The title matters most for collectors trying to separate each nearly named eShop installment cleanly.",
  "3ds-bricks-pinball-4":
    "Bricks Pinball 4 keeps the series' simple rebound-and-clear design, giving players more quick puzzle boards to work through on the 3DS. It is a modest digital-library entry where exact numbering is important because the sequels can look almost interchangeable in listings.",
  "3ds-bricks-pinball-5":
    "Bricks Pinball 5 is a late numbered Bricks Pinball release built around the same fast aiming, bouncing shots, and brick-clearing rhythm as the earlier games. It is useful to catalog separately because the 3DS eShop had many small sequels that can blur together without title-level notes.",
  "3ds-bricks-pinball-6":
    "Bricks Pinball 6 extends nuGAME's tiny arcade-puzzle series with more ricochet-based boards and score-oriented clearing. It is not a marquee 3DS release, but it belongs in the database as part of the handheld's long tail of inexpensive digital puzzle software.",
  "3ds-brilliant-hamsters":
    "Brilliant Hamsters! is a pet-care simulation about raising and interacting with hamsters through feeding, cleaning, play, and customization routines. Its audience is younger or casual players looking for a gentle virtual-pet loop rather than a challenge-driven handheld game.",
  "3ds-brunch-panic":
    "Brunch Panic is a food-service time-management game where players prepare orders, juggle impatient customers, and keep a restaurant moving under pressure. The 3DS version fits the handheld well because its stages are built around quick multitasking bursts and repeated attempts to improve service flow.",
  "3ds-brutus-and-futee":
    "Brutus & Futee is a cartoon-style adventure game centered on light exploration, character interaction, and puzzle progression. It sits in the 3DS catalog as a family-friendly licensed-feeling adventure from Microids and Artefacts Studio rather than a systems-heavy action game.",
  "3ds-bubble-pop-world":
    "Bubble Pop World is a 3DS platformer that uses bubble-based movement and obstacle layouts to create simple stage challenges. Its value is in approachable handheld play, with the stereoscopic presentation giving its bright levels more separation than a flat mobile-style release.",
  "3ds-bugs-vs-tanks":
    "Bugs vs. Tanks is one of Level-5's Guild series oddities, shrinking World War II tanks into a backyard battlefield where insects become oversized threats. Players steer miniature armor through missions, upgrade vehicles, and fight creatures that turn the usual war-game scale into something stranger and more playful.",
  "3ds-bukigami":
    "Bukigami is a Takara Tomy action game tied to transforming weapon creatures, with battles built around character attacks, movement, and collectible-style progression. It is mainly an import-library entry for players tracking Japanese media-tie-in releases on 3DS.",
  "3ds-cake-ya-san-monogatari-ooishii-sweets-o-tsukurou":
    "Cake-ya San Monogatari: Ooishii Sweets o Tsukurou! is a Japanese sweets-shop simulation aimed at making desserts, serving customers, and building a cozy shop routine. It belongs with the 3DS's child-friendly job and shop-management games rather than with traditional adventure releases.",
  "3ds-candy-match-3":
    "Candy Match 3 is a straightforward match-three puzzle game built around swapping sweets, clearing boards, and working through increasingly constrained layouts. It works best as a small digital puzzle release where genre clarity matters more than deep franchise history.",
  "3ds-candy-please":
    "Candy, Please! is a Halloween-themed adventure from Nostatic Software about exploring neighborhoods, collecting candy, and working through light quest objectives. It has the feel of a small seasonal eShop game, with charm coming from its simple premise and compact structure.",
  "3ds-cardfight-vanguard-g-stride-to-victory":
    "Cardfight!! Vanguard G: Stride to Victory adapts the trading-card anime's G-era rules to 3DS, letting players build decks, battle characters, and practice Stride-focused card strategies. It is important for TCG fans because the game functions as both a story tie-in and a playable rules snapshot for that era.",
  "3ds-cardfight-vanguard-ride-to-victory":
    "Cardfight!! Vanguard: Ride to Victory brings Bushiroad's card-battle structure to 3DS with deck construction, anime-style opponents, and turn-based card duels. It is better understood as a digital TCG adaptation than a puzzle game, especially for collectors following card-game software.",
  "3ds-cardfight-vanguard-rock-on-victory":
    "Cardfight!! Vanguard: Rock on Victory continues the 3DS Vanguard line with more card battles, character scenarios, and deck-building around the physical game's evolving card pool. The title matters because it is a distinct follow-up for players collecting the full run of Vanguard handheld adaptations.",
  "3ds-castle-clout-3d":
    "Castle Clout 3D turns castle destruction into a physics-aiming game, asking players to launch shots, bring down structures, and defeat defenders with limited attacks. It is a small digital action-puzzle release where the fun comes from experimenting with angles and watching forts collapse.",
  "3ds-castle-conqueror-defender":
    "Castle Conqueror Defender is a tower-defense strategy game about protecting territory with placed defenses, resource decisions, and wave management. It represents Circle Entertainment's steady run of budget 3DS strategy releases and should be framed around defensive planning rather than generic action.",
  "3ds-castle-conqueror-ex":
    "Castle Conqueror EX shifts the Castle Conqueror idea toward tactical conquest, with players managing units, territory, and battle decisions across a fantasy campaign. It is a useful 3DS eShop strategy entry for people who want light tactics without the scale of a full retail RPG.",
  "3ds-cats-and-dogs-3d-pets-at-play":
    "Cats & Dogs 3D: Pets at Play is a virtual-pet game about caring for household animals through feeding, grooming, play, and simple interaction routines. Its place in the 3DS library is as a family-focused pet sim built for younger players and short daily check-ins.",
  "3ds-chain-blaster":
    "Chain Blaster is a vertical shooter from G-Style where destroying enemies in the right rhythm creates chain reactions and higher scores. It gives the 3DS a compact arcade-style shoot-'em-up built around positioning, timing, and replaying stages for cleaner runs.",
  "3ds-chibi-robo-photo-finder":
    "Chibi-Robo! Photo Finder sends Nintendo's tiny helper into a world of real-object photography, asking players to photograph items with the 3DS camera and bring them into the game as NostalJunk. It is one of the stranger Chibi-Robo entries, mixing collection, chores, and augmented-reality novelty.",
  "3ds-chicken-wiggle":
    "Chicken Wiggle is a bright puzzle-platformer from Atooi starring a chicken and worm duo, with stage traversal built around grappling, climbing, and user-created levels. Its creation tools make it more than a simple platformer and connect it to the lineage that later led to Hatch Tales.",
  "3ds-carps-and-dragons":
    "Carps & Dragons is a small Abylight eShop game about guiding fish through obstacle-filled water paths with quick reactions and simple arcade goals. It is a modest digital release, but the title has a clear identity as a light action challenge rather than just a catalog placeholder.",
  "3ds-cazzarion":
    "Cazzarion is a late 3DS eShop action game from Armin Unold and Zarpazo, arriving when the handheld's digital library had shifted toward very small independent releases. It should be treated as a low-profile arcade-style entry where the late release year and eShop context are the main collector hooks.",
  "3ds-cazzarion-adventureland":
    "Cazzarion Adventureland expands the Cazzarion name into a brighter adventure-platform format, with simple exploration and stage-based play. It belongs beside the original Cazzarion as part of the 3DS eShop's late independent wave.",
  "3ds-chara-pet-tsukutte-sodatete-character-shougakkou":
    "Chara Pet Tsukutte! Sodatete! Character Shougakkou is a Culture Brain character-creation and pet-raising game about making cute companions, caring for them, and moving through school-themed activities. It is best described as a child-friendly raising sim rather than a pure puzzle game.",
  "3ds-chari-sou-dx3-time-rider":
    "Chari-Sou DX3: Time Rider is a Spicysoft bicycle-riding action game built around fast courses, timing, obstacles, and the series' lightweight eShop style. The Time Rider subtitle gives this entry its identity, separating it from the other Chari-Sou releases on 3DS.",
  "3ds-chevrolet-camaro-wild-ride":
    "Chevrolet Camaro Wild Ride is an arcade racer centered on Camaro-branded driving, straightforward events, and portable track runs. It is a budget 3DS racing title where the licensed car branding is more distinctive than the underlying race structure.",
  "3ds-chibi-devi":
    "Chibi * Devi! adapts the cute supernatural manga/anime premise into a 3DS game about caring for small devil babies through simple activities and character events. It is a Japanese licensed life-sim release aimed more at fans and younger players than at action-focused handheld owners.",
  "3ds-chibi-devi-2-mahou-no-yume-ehon":
    "Chibi * Devi! 2 Mahou no Yume Ehon continues the licensed baby-devil care concept with a picture-book fantasy angle, simple interaction, and character-driven tasks. It should be cataloged separately from the first game because the sequel subtitle marks a distinct media tie-in release.",
  "3ds-cho-soku-henkei-gyrozetter":
    "Chou Soku Henkei Gyrozetter adapts Square Enix's transforming-car arcade and anime project into a 3DS action RPG about vehicle battles, customization, and media-tie-in characters. It stands out because it connects arcade machines, animation, and handheld play in one collector lane.",
  "3ds-cho-ricchi-tamagotchi-no-puchi-puchi-omisecchi":
    "Cho~ricchi! Tamagotchi no Puchi Puchi Omisecchi is a shop-management and activity game built around Tamagotchi characters, cute customer tasks, and small business routines. It is part of Bandai Namco's long-running handheld Tamagotchi line rather than a generic simulation release.",
  "3ds-cho-ricchi-tamagotchi-no-puchi-puchi-omisecchi-de-violin-lesson":
    "Cho~ricchi! Tamagotchi no Puchi Puchi Omisecchi de Violin Lesson adds a music-lesson theme to the Tamagotchi shop-and-activity formula, with violin-flavored tasks layered onto the familiar cute-service structure. The subtitle is the key detail for separating it from the standard Cho~ricchi release.",
  "3ds-choco-ken-no-chokotto-fushigi-na-monogatari-chocolate-hime-to-mahou-no-recipe":
    "Choco Ken no Chokotto Fushigi na Monogatari: Chocolate Hime to Mahou no Recipe is a Nippon Columbia character adventure about sweet-themed fantasy, light tasks, and cute dog characters. It is a family-market import title where the confectionery premise and full subtitle do a lot of the identifying work.",
  "3ds-chou-chari-sou-atsumete-choujuu-hunter":
    "Chou Chari-Sou: Atsumete! Choujuu Hunter takes Spicysoft's bicycle-action formula into creature-hunting territory, mixing quick riding stages with collecting and chase objectives. It is another eShop-style entry where subtitle accuracy helps buyers avoid confusing it with other Chari-Sou games.",
  "3ds-chou-sentou-chuu-kyuukyoku-no-shinobu-to-battle-player-choujou-kessen":
    "Chou Sentou-chuu Kyuukyoku no Shinobu to Battle Player Choujou Kessen! adapts a Japanese TV game-show style premise into an action game about avoiding pursuers, competing through challenges, and surviving staged battles. Its draw is the licensed variety-show concept rather than traditional combat depth.",
  "3ds-chou-tousouchuu-atsumare-saikyou-no-tousousya-tachi":
    "Chou Tousouchuu Atsumare Saikyou no Tousousya Tachi turns the Run for Money-style chase format into a 3DS action game about fleeing hunters, collecting rewards, and clearing mission objectives. It is useful to frame as a television tie-in because that explains the unusual pursuit-focused structure.",
  "3ds-choujin-baseball-stadium":
    "Choujin Baseball Stadium is an arcade baseball game from Culture Brain Excel that leans into exaggerated players, quick matches, and accessible sports action. It is more of a colorful superhuman-baseball release than a strict simulation.",
  "3ds-choujin-baseball-stadium-nekketsu-story":
    "Choujin Baseball Stadium: Nekketsu Story adds a story-flavored angle to Culture Brain Excel's exaggerated baseball format, keeping the focus on lively matches and character-driven sports energy. It should be separated from the base Choujin Baseball Stadium release in listings.",
  "3ds-choujin-ultra-baseball-action-card-battle":
    "Choujin Ultra Baseball Action Card Battle mixes superpowered baseball theming with card-battle structure, making it closer to a sports-card hybrid than a normal baseball sim. That combination gives it a useful niche for both game-library and card-game filters.",
  "3ds-chouju-giga-taisen":
    "Chouju Giga Taisen is a Silver Star strategy release inspired by playful animal-battle imagery, with tactical matchups and compact portable scenarios. It is better treated as a small strategy game than a visual novel, especially for players browsing by mechanics.",
  "3ds-christmas-night-archery":
    "Christmas Night Archery is a Petite Games eShop sports-arcade release about aiming shots in a holiday-themed archery setup. Its appeal is simple target practice and seasonal novelty, not a full-featured sports campaign.",
  "3ds-christmas-wonderland-3":
    "Christmas Wonderland 3 is a hidden-object and casual puzzle game built around holiday scenes, festive objects, and relaxed search-and-find progression. It sits in the 3DS library as seasonal family puzzle software rather than a traditional logic game.",
  "3ds-christmas-wonderland-4":
    "Christmas Wonderland 4 continues the holiday hidden-object formula with more festive scenes, object lists, and casual puzzle pacing. The numbered subtitle matters because these Christmas Wonderland entries can look very similar in storefronts and collection lists.",
  "3ds-chronus-arc":
    "Chronus Arc is a Kemco-style handheld RPG about time-themed fantasy, dungeon exploration, turn-based battles, and party progression. On 3DS, it represents the system's digital JRPG shelf: modest in production scale, but recognizable to players who follow Kemco's portable RPG output.",
  "3ds-city-mysteries":
    "City Mysteries is a hidden-object puzzle game about scanning urban scenes, finding listed items, and progressing through light mystery framing. It is a casual eShop release where the useful description is search-and-find play rather than broad puzzle terminology.",
  "3ds-city-skaters-run-boy-run-girl":
    "City Skaters: Run Boy, Run Girl is a small urban skating game centered on dodging hazards, keeping momentum, and clearing quick runs with either character. It is a late 3DS eShop title whose value comes from its straightforward arcade premise and unusual release timing.",
  "3ds-classic-card-games":
    "Classic Card Games is a compact 3DS collection built around familiar tabletop card rules rather than a campaign or character-driven adventure. It is useful in the library as a simple pick-up-and-play parlor package, with the GameOn credit and exact title helping separate it from other budget card compilations.",
  "3ds-club-nintendo-picross":
    "Club Nintendo Picross is a Nintendo-reward puzzle release from Jupiter, centered on nonogram grids, careful deduction, and short handheld sessions. Its collector appeal is tied to Club Nintendo distribution and the Picross lineage rather than standard retail availability.",
  "3ds-club-nintendo-picross-plus":
    "Club Nintendo Picross Plus follows the first reward-only Picross release with more nonogram puzzles and the same clean Jupiter-developed logic structure. It should be cataloged separately because Club Nintendo software can be hard to identify once it leaves its original distribution context.",
  "3ds-coaster-creator-3d":
    "Coaster Creator 3D is a roller-coaster design sandbox where players build tracks, tune turns and drops, and ride their own creations in stereoscopic 3D. It is a small but clear 3DS simulation release because the appeal is construction and testing rather than management menus.",
  "3ds-cocoro-line-defender":
    "Cocoro: Line Defender is a defensive strategy game about placing units, holding lanes, and surviving enemy waves through planning instead of reflex action. It fits the 3DS eShop strategy shelf as a modest tower-defense-style release from Moving Player.",
  "3ds-cocoto-alien-brick-breaker":
    "Cocoto Alien Brick Breaker turns the Cocoto license into a brick-breaking arcade game with themed stages, paddle control, and power-up clearing. It is best described as a character-branded Breakout-style release rather than a broader adventure game.",
  "3ds-collide-a-ball":
    "Collide-a-Ball is a physics puzzle game about placing objects and guiding balls into collisions or targets across compact stages. Its value is in spatial experimentation and quick retries, making it a small 3DS thinking-game entry rather than a life simulation.",
  "3ds-color-cubes":
    "Color Cubes is a RCMADIAX puzzle release about matching colors and clearing simple cube-based layouts. It belongs with the 3DS's smaller eShop puzzle catalog, where the draw is direct rules, short sessions, and low-friction replay.",
  "3ds-color-zen":
    "Color Zen is an abstract puzzle game where players merge colored shapes until each board resolves into a final target color. The 3DS version works as a quiet, touchscreen-friendly logic game with emphasis on visual flow rather than timers or score attack.",
  "3ds-color-zen-kids":
    "Color Zen Kids adapts Color Zen's color-merging puzzle rules for a younger audience, using simpler shapes and gentler board progression. It should be separated from the main Color Zen release because the difficulty curve and audience are intentionally different.",
  "3ds-conveni-dream":
    "Conveni Dream is a convenience-store management simulation where players stock shelves, serve customers, expand the shop, and build daily sales momentum. It is a practical 3DS sim for players who enjoy small-business routines rather than combat or exploration.",
  "3ds-cosmiball-3d":
    "CosmiBall 3D is a puzzle-action game built around guiding a ball through space-themed 3D stages, using timing, route reading, and obstacle avoidance. It is a small eShop-style title whose identity comes from motion and perspective rather than story.",
  "3ds-crash-time-3d":
    "Crash Time 3D adapts the German action-racing brand into portable missions with police-style driving, road events, and straightforward chase structure. It is better framed as a licensed action racer than as the generic platformer label some metadata suggests.",
  "3ds-crayon-shin-chan-gekiatsu-oden-wa-rudo-dai-konran":
    "Crayon Shin-Chan Gekiatsu! Oden wa Rudo Dai Konran!! is a FuRyu-published licensed action game built around Shin-chan's comedy, themed stages, and light adventure progression. It is most relevant for import collectors following the character's 3DS releases.",
  "3ds-crayon-shin-chan-arashi-wo-yobu-kasukabe-eiga-stars":
    "Crayon Shin-Chan: Arashi wo Yobu Kasukabe Eiga Stars! ties the manga and anime license to movie-themed stages and character comedy. It should be presented as a separate Shin-chan licensed entry because the film-star premise distinguishes it from the other 3DS games.",
  "3ds-crayon-shin-chan-uchuu-de-achoo-yuujou-no-oba-karate":
    "Crayon Shin-Chan: Uchuu de Achoo!? Yuujou no Oba-Karate!! is an Inti Creates-developed licensed action game with Shin-chan's space-themed comedy and stage-based play. The developer credit and subtitle make it a more specific collector entry than a generic character game.",
  "3ds-crazy-chicken-pirates-3d":
    "Crazy Chicken Pirates 3D turns the long-running shooting-gallery character series toward a pirate theme, with quick aiming challenges and target-clearing stages. It is a casual arcade release where the subtitle identifies the setting and separates it from other Crazy Chicken games.",
  "3ds-crazy-chicken-director-s-cut-3d":
    "Crazy Chicken: Director's Cut 3D is another shooting-gallery entry in the Crazy Chicken line, using 3D presentation and short target stages built for quick play. It should not be confused with the Pirates 3D release because the theme and package identity are different.",
  "3ds-crazy-construction":
    "Crazy Construction is a G-Style puzzle game about stacking, balancing, and fitting objects into stable arrangements. It gives the 3DS eShop a light physics-puzzle entry where careful placement matters more than speed.",
  "3ds-crazy-kangaroo":
    "Crazy Kangaroo is an arcade action game about bouncing through obstacle courses, collecting items, and escaping pursuit across compact stages. It is a small digital release whose appeal is simple movement timing rather than a full platform-adventure structure.",
  "3ds-creeping-terror":
    "Creeping Terror is a side-scrolling horror adventure about exploring dark spaces, hiding from threats, and solving environmental problems with limited direct combat. It stands out in the 3DS library because it aims for suspense and vulnerability rather than colorful action.",
  "3ds-crollors-game-pack":
    "Crollors Game Pack is a budget 3DS puzzle collection from Nvriezen, built around small color and logic challenges gathered into one package. It is best listed as a compilation-style eShop release where the individual puzzle variety is the selling point.",
  "3ds-cryght":
    "Cryght is a minimalist puzzle game from Toyuro about solving compact grid or shape challenges through careful planning. It belongs with late 3DS eShop curiosities whose collector value comes from small-scale digital availability and exact title preservation.",
  "3ds-crystareino":
    "Crystareino is a Kemco fantasy RPG about entering a new world, gathering allies, exploring dungeons, and working through turn-based battles. It fits the 3DS digital JRPG shelf as a traditional portable role-playing game with familiar systems and brisk pacing.",
  "3ds-cube-creator-3d":
    "Cube Creator 3D is a block-building sandbox that lets players mine, craft, and construct voxel worlds on 3DS. Its importance comes from bringing Minecraft-like creative play to Nintendo's handheld before Cube Creator DX expanded the idea.",
  "3ds-cube-creator-dx":
    "Cube Creator DX is a block-building sandbox for 3DS about gathering materials, crafting structures, and exploring voxel worlds in handheld form. The DX release gives the Cube Creator idea a fuller package, with broader creation tools and a clearer collector identity than the original eShop entry.",
  "3ds-cube-tactics":
    "Cube Tactics is a real-time strategy game about placing cubic units, building defenses, and pushing across small floating battlefields. Its quick tactical rounds and toy-like block presentation make it a compact 3DS strategy release rather than a large campaign sim.",
  "3ds-cubit-the-hardcore-platformer-robot":
    "Cubit the Hardcore Platformer Robot is a rhythm-leaning autorunner platformer where timing jumps to the beat is the main challenge. It is a small eShop release aimed at players who want quick retries, tight hazards, and simple one-more-run structure.",
  "3ds-culdcept":
    "Culdcept on 3DS continues Omiya Soft's unusual mix of board-game movement, deck building, territory control, and card battles. It is closer to a collectible-card strategy board game than a standard puzzle release, and Nintendo's publishing credit makes it important for 3DS collectors.",
  "3ds-culdcept-revolt":
    "Culdcept Revolt modernizes the card-and-board strategy series with faster pacing, new cards, story missions, and competitive deck-building depth. It is one of the 3DS library's clearest bridges between tabletop-style strategy and collectible-card game thinking.",
  "3ds-cup-critters":
    "Cup Critters is a small RCMADIAX puzzle game about sorting or matching cup-shaped characters through simple touchscreen-friendly rules. It belongs with the 3DS eShop's lightweight puzzle catalog, where short sessions and clear mechanics matter more than narrative.",
  "3ds-cycle-of-eternity-space-anomaly":
    "Cycle of Eternity: Space Anomaly is a late 3DS eShop release from RandomSpin with a sci-fi anomaly premise and small-scale digital-game scope. It is mainly useful as a late-platform catalog entry where release timing and storefront provenance carry much of the collector interest.",
  "3ds-d-u-n-k-l-e-r":
    "D.U.N.K.L.E.R is a very late 3DS eShop action release from Guy Saldanha, arriving after the platform's mainstream years. Its main interest is as part of the handheld's final independent digital wave, with simple action structure and unusual end-of-life timing.",
  "3ds-dai-gyakuten-saiban-2-naruhodo-ryunosuke-no-kakugo":
    "Dai Gyakuten Saiban 2: Naruhodo Ryunosuke no Kakugo continues Capcom's Great Ace Attorney prequel story with courtroom battles, investigation chapters, and Sherlockian mystery framing. It is the second half of Ryunosuke's 3DS-era arc and pairs naturally with the first Dai Gyakuten Saiban.",
  "3ds-dai-gyakuten-saiban-naruhodo-ryunosuke-no-boken":
    "Dai Gyakuten Saiban: Naruhodo Ryunosuke no Boken starts the Great Ace Attorney prequel line, moving the series to Meiji-era Japan and Victorian Britain with new deduction scenes, jury mechanics, and courtroom mystery. It is a major Japan-only 3DS Ace Attorney release in its original form.",
  "3ds-daigasso-band-brothers-p-debut":
    "Daigasso! Band Brothers P Debut is a Nintendo and Intelligent Systems music game built around performing, arranging, and sharing songs in the Band Brothers style. The Debut version is a trimmed entry point into the broader Band Brothers P ecosystem.",
  "3ds-daisenryaku-daitoua-koboshi-dx-dainiji-sekai-taisen":
    "Daisenryaku Daitoua Koboshi DX: Dainiji Sekai Taisen is a SystemSoft Alpha military strategy game focused on World War II scenarios, unit positioning, and turn-based operational planning. It is a serious import tactics release for players who follow the long-running Daisenryaku line.",
  "3ds-dakkan-shirei-majo-dungeon-shuu-no-tame-nara-yara-nebanarumai":
    "Dakkan Shirei Majo Dungeon: Shuu no Tame Nara Yara Nebanarumai is an AMZY 3DS eShop dungeon-action release with fantasy rescue framing, maze-like stages, and compact mission progression. It sits in the system's smaller digital import shelf rather than its marquee RPG catalog.",
  "3ds-dan-mcfox-head-hunter":
    "Dan McFox: Head Hunter is a Lightwood hidden-object and face-matching game where players identify targets in crowded scenes. It is closer to visual search and observation puzzles than action, making it a quick-session 3DS eShop title.",
  "3ds-danball-senki-w-chou-custom":
    "Danball Senki W Chou Custom is Level-5's expanded 3DS version of the LBX robot-battle RPG, built around customizable model robots, arena combat, and story content from the broader anime and toy franchise. It is a key import release for Little Battlers eXperience collectors.",
  "3ds-dangerous-jiisan-to-1000-nin-no-otomodachi-ja":
    "Dangerous Jiisan to 1000-nin no Otomodachi Ja adapts the gag manga property into a 3DS comedy action game with absurd character scenarios and simple mission play. Its value is tied to the CoroCoro-style license and Japan-only audience.",
  "3ds-dangerous-road":
    "Dangerous Road is a Starsign-published driving and hazard-avoidance game about surviving risky road situations through timing and route control. It is a small eShop release where the road-danger premise is more useful than a generic simulation label.",
  "3ds-dark-island":
    "Dark Island is a late RandomSpin 3DS eShop adventure with a survival-island premise, simple exploration, and low-budget digital presentation. It is mainly notable as part of the platform's end-of-life independent catalog.",
  "3ds-darts-up-3d":
    "Darts Up 3D brings darts to 3DS with touch or motion-style aiming, target scoring, and quick local party-game pacing. It is a sports parlor game rather than a logic puzzle.",
  "3ds-dasshutsu-adventure-akumu-no-shinigami-ressha":
    "Dasshutsu Adventure: Akumu no Shinigami Ressha is an Intense escape-adventure game built around a death-train scenario, locked-room puzzles, and visual-novel investigation. It belongs to Arc System Works' broader 3DS escape-game series.",
  "3ds-dasshutsu-adventure-dai-nana-no-yogen":
    "Dasshutsu Adventure: Dai Nana no Yogen continues the escape-adventure formula with prophecy-themed mystery, puzzle rooms, and dialogue-driven investigation. The subtitle marks a distinct case within the Intense and Arc System Works series.",
  "3ds-dasshutsu-adventure-kami-oroshi-no-uranai-ban":
    "Dasshutsu Adventure: Kami Oroshi no Uranai Ban mixes fortune-telling motifs with locked-room escape puzzles and story investigation. It is a separate 3DS download entry in the Dasshutsu Adventure line, aimed at players who enjoy mystery visual novels.",
  "3ds-dasshutsu-adventure-majo-no-sumu-yakata":
    "Dasshutsu Adventure: Majo no Sumu Yakata uses a witch's mansion setup for its escape rooms, clue gathering, and suspenseful visual-novel scenes. It is best cataloged as one chapter in the 3DS escape-adventure series.",
  "3ds-dasshutsu-adventure-noroi-no-suuretsu":
    "Dasshutsu Adventure: Noroi no Suuretsu focuses on cursed-number mystery framing, item puzzles, and dialogue-led investigation. Its identity comes from the escape-game scenario rather than broad adventure-game exploration.",
  "3ds-dasshutsu-adventure-shiawase-no-akai-ishi":
    "Dasshutsu Adventure: Shiawase no Akai Ishi builds a mystery around the red-stone subtitle, with puzzle rooms, evidence gathering, and story choices driving progress. It is another distinct case in Arc System Works' portable escape line.",
  "3ds-dasshutsu-adventure-shuuen-no-kuroikiri":
    "Dasshutsu Adventure: Shuuen no Kuroikiri adds ominous black-mist framing to the series' escape-room puzzles and visual-novel mystery structure. It is a niche Japanese eShop adventure where subtitle accuracy matters.",
  "3ds-dasshutsu-adventure-zetsubou-yousai":
    "Dasshutsu Adventure: Zetsubou Yousai places the escape-adventure format inside a fortress-like scenario, mixing item puzzles, locked rooms, and story reveals. It belongs beside the other Intense-developed Dasshutsu Adventure entries.",
  "3ds-dasshutsu-fantasy-alice-in-escape-land":
    "Dasshutsu Fantasy: Alice in Escape Land gives the escape-game formula an Alice-inspired fantasy theme, with puzzle rooms and story scenes built around that dreamlike setting. It is a themed spinoff from the same Arc System Works and Intense adventure lane.",
  "3ds-dasshutsu-kyuukousha-no-shojo":
    "Dasshutsu: Kyuukousha no Shojo is an escape-adventure title from Intense centered on an old-school-building mystery, clue gathering, and locked-room puzzle solving. It is a compact Japanese 3DS adventure for fans of scenario-based escape games.",
  "3ds-deer-hunting-king":
    "Deer Hunting King is an Arc System Works hunting game for 3DS about aiming, tracking targets, and clearing outdoor shooting challenges. It belongs with simple hunting-sports releases rather than traditional team sports.",
  "3ds-defend-your-crypt":
    "Defend Your Crypt is a trap-defense strategy game where players protect treasure by placing hazards, timing attacks, and stopping waves of intruders. It gives the 3DS eShop a compact tower-defense style release with a darker tomb theme.",
  "3ds-demon-king-box":
    "Demon King Box is a Circle Entertainment RPG-strategy hybrid about commanding monster forces from a demonic base, summoning units, and pushing through battles. Its appeal is the mix of villain perspective, simple tactics, and portable progression.",
  "3ds-densha-unten-shirei-toukaidou-hen":
    "Densha Unten Shirei! Toukaidou-Hen is a train-operation simulation centered on driving instructions, route timing, and railway procedures on the Tokaido-themed route. It is a specialist rail title, not a sports game.",
  "3ds-densha-unten-shirei-toukyouwan-hen":
    "Densha Unten Shirei! Toukyouwan-Hen applies the same train-operation structure to a Tokyo Bay route, with attention to stops, timing, and railway handling. It is a separate route-focused entry for train-sim collectors.",
  "3ds-derby-stallion-gold":
    "Derby Stallion Gold brings the long-running horse-racing management series to 3DS, focusing on breeding, training, race entry, and stable-building decisions. It is more management simulation than arcade racing.",
  "3ds-die-drei-kids-jagd-auf-das-phantom":
    "Die drei ??? Kids - Jagd auf das Phantom adapts the German mystery series into a 3DS adventure about clue gathering, investigation, and young-detective story progression. It is a regional licensed release where language and franchise recognition matter.",
  "3ds-digger-dan-ex":
    "Digger Dan EX is a 3DS puzzle-action game about digging through underground stages, collecting gems, avoiding hazards, and planning routes before the level turns dangerous. It fits the handheld as a compact eShop challenge built around maze reading and quick retries.",
  "3ds-dodge-club-pocket":
    "Dodge Club Pocket is a small-scale action game from James Montagna centered on dodging hazards, reading movement patterns, and surviving tight arcade-style encounters. Its appeal is in short, score-minded play rather than a long campaign.",
  "3ds-dodgebox":
    "DodgeBox is a minimalist arena-dodging game where players survive incoming blocks and threats by keeping movement precise. It belongs to the 3DS eShop's simple arcade lane, where clear rules and quick restarts matter more than story or progression systems.",
  "3ds-dog-school-lovely-puppy":
    "Dog School: Lovely Puppy is a Japanese pet-care and training sim about working with puppies through simple lessons, care routines, and light interaction. It is aimed at younger or casual players looking for a gentle animal-care loop on 3DS.",
  "3ds-dogimegi-inryoku-chan":
    "Dogimegi Inryoku-Chan is an Arc System Works 3DS release with a quirky character-driven premise and lightweight digital-game scale. In the library it is best framed as a niche Japanese eShop title, notable for its oddball presentation and import-only collector context.",
  "3ds-dokidoki-precure-narikiri-life":
    "DokiDoki! PreCure Narikiri Life! adapts the magical-girl anime into a 3DS game built around character activities, dress-up elements, and kid-friendly mini-games. It matters as a licensed Japanese Bandai Namco release tied to a specific PreCure season.",
  "3ds-dolly-kanon-dokidoki-tokimeki-himitsu-no-ongaku-katsudou-start-desu":
    "Dolly Kanon Dokidoki Tokimeki Himitsu no Ongaku Katsudou Start Desu!! is a music and idol-themed 3DS game tied to the Dolly Kanon manga property. It focuses on performance-flavored activities and character appeal, making it a niche import record for collectors of licensed rhythm-adjacent titles.",
  "3ds-don-t-crash-go":
    "Don't Crash Go is a very direct arcade driving game about keeping a vehicle moving, avoiding collisions, and chasing better runs through repeated attempts. Its 3DS identity comes from fast, uncomplicated eShop play rather than simulation depth.",
  "3ds-dooors":
    "Dooors brings the mobile escape-room puzzle format to 3DS, asking players to inspect each room, manipulate objects, and find the trick that opens the next door. It is a clean fit for touch-screen play and short puzzle sessions.",
  "3ds-dopamix":
    "Dopamix is a G-Mode rhythm-action game built around electronic music timing, abstract presentation, and quick stage challenges. It stands out in the 3DS download catalog as a music-first release with a more experimental feel than most licensed rhythm games.",
  "3ds-dora-chie-mini-dora-ongakutai-to-7-tsu-no-chie":
    "Dora-Chie: Mini-Dora Ongakutai to 7-tsu no Chie uses Doraemon characters for a child-friendly learning game centered on memory, observation, and small brain-training tasks. It belongs with Shogakukan's educational Doraemon 3DS releases rather than standard adventure games.",
  "3ds-doraeigo-nobita-to-yousei-no-fushigi-collection":
    "DoraEigo: Nobita to Yousei no Fushigi Collection is an English-learning Doraemon title from Jupiter and Shogakukan. The hook is language practice through familiar characters, making it more educational software than traditional character action.",
  "3ds-doraemon-nobita-and-the-island-of-miracles-animal-adventure":
    "Doraemon: Nobita and the Island of Miracles - Animal Adventure adapts the film premise into a family adventure with Doraemon, Nobita, gadgets, and animal-themed exploration. It is part of FuRyu's steady run of 3DS Doraemon movie tie-ins.",
  "3ds-doraemon-nobita-no-himitsu-dougu-hakubutsukan":
    "Doraemon: Nobita no Himitsu Dougu Hakubutsukan is a 3DS adventure tied to the Secret Gadget Museum story, with gadget-themed situations and approachable play for younger fans. The museum premise is the key identity marker for separating it from other Doraemon entries.",
  "3ds-doraemon-nobita-no-nankyoku-kachikochi-daibouken":
    "Doraemon: Nobita no Nankyoku Kachikochi Daibouken follows the Antarctic Kachi Kochi Adventure film with snowy exploration, familiar characters, and gadget-driven family adventure play. It is a late 3DS Doraemon tie-in with clear movie-era collector value.",
  "3ds-doraemon-nobita-no-takarajima":
    "Doraemon: Nobita no Takarajima adapts the Treasure Island film into a 3DS adventure about pirate-flavored exploration, gadget use, and story scenes for younger players. It is one of the final Doraemon releases on the platform.",
  "3ds-doraemon-shin-nobita-no-daimakyou":
    "Doraemon: Shin Nobita no Daimakyou is a movie tie-in adventure connected to the New Nobita's Great Demon story. The 3DS game leans on jungle exploration, Doraemon gadgets, and character-driven tasks rather than complex action systems.",
  "3ds-doraemon-shin-nobita-no-nihontanjou":
    "Doraemon: Shin Nobita no Nihontanjou adapts the New Nobita's Birth of Japan film into a 3DS adventure with prehistoric themes, gadget support, and approachable objectives. It is best cataloged as a FuRyu Doraemon movie game for younger fans.",
  "3ds-dorakazu-nobita-no-suuji-daibouken":
    "DoraKazu: Nobita no Suuji Daibouken is a Doraemon math-learning game built around numbers, practice exercises, and familiar character framing. It belongs to the educational side of the 3DS library, where the value is skill practice rather than entertainment-first design.",
  "3ds-doramoji-nobita-no-kanji-daisakusen":
    "DoraMoji: Nobita no Kanji Daisakusen is a kanji-learning Doraemon title that uses Nobita and friends to frame writing and reading practice. For catalog purposes, it is an education release from Jupiter and Shogakukan, not a standard Doraemon adventure.",
  "3ds-dot-runner-complete-edition":
    "Dot Runner: Complete Edition is an arcade maze game about steering through dot-filled stages, avoiding pursuers, and clearing patterns efficiently. The Complete Edition label is important because it packages the Dot Runner concept as a distinct 3DS eShop release.",
  "3ds-double-breakout":
    "Double Breakout is a block-breaking game from nuGAME that builds on paddle-and-ball arcade rules with two-sided play and compact stages. It is a simple eShop release where angle control, rebounds, and score improvement define the experience.",
  "3ds-doubutsu-sentai-zyuohger-battle-cube-puzzle":
    "Doubutsu Sentai Zyuohger: Battle Cube Puzzle adapts the Super Sentai season into a puzzle game using cube-themed battles and character branding. It is a Japanese licensed title aimed at fans of the show, with its tokusatsu connection doing most of the collector work.",
  "3ds-doukutsujima":
    "Doukutsujima is a SmileBoom 3DS eShop game about exploring cave-like spaces, solving simple route problems, and working through compact stage challenges. It sits in the system's small Japanese digital catalog, where exact title identification matters for import collectors.",
  "3ds-downtown-nekketsu-jidaigeki":
    "Downtown Nekketsu Jidaigeki brings the Kunio-kun brawler spirit into a period-drama setting, mixing side-scrolling action, roughhouse combat, and comedic historical flavor. It is a notable Arc System Works entry for fans following the broader River City lineage.",
  "3ds-downtown-no-gaki-no-tsukai-yaarahen-de-zettai-ni-tsukamatte-haikenai-gasu-kurobikari-land":
    "Downtown no Gaki no Tsukai Yaarahen de!! Zettai ni Tsukamatte Haikenai Gasu Kurobikari Land is a 3DS game tied to the Japanese comedy program's punishment-game format. Its value is almost entirely in the licensed variety-show premise and import novelty.",
  "3ds-dragon-fang":
    "Dragon Fang is a roguelike dungeon RPG from Toydea where players explore grid-based dungeons, manage risk turn by turn, and use monster fang abilities to survive. It gives the 3DS eShop a traditional mystery-dungeon style release with portable progression.",
  "3ds-dragon-fang-z-ryuusha-rose-to-yadorigi-no-meikyuu":
    "Dragon Fang Z: Ryuusha Rose to Yadorigi no Meikyuu expands Toydea's roguelike formula with Rose as the lead, dungeon runs, fang skills, and tactical positioning. It is a distinct follow-up for players tracking the series beyond the first Dragon Fang.",
  "3ds-dragon-fantasy-the-black-tome-of-ice":
    "Dragon Fantasy: The Black Tome of Ice is a retro-styled RPG chapter with party battles, towns, dungeons, and a knowingly old-school tone. On 3DS, it appeals to players who want classic JRPG pacing in a compact downloadable format.",
  "3ds-dragon-fantasy-the-volumes-of-westeria":
    "Dragon Fantasy: The Volumes of Westeria collects Muteki's throwback RPG episodes around turn-based combat, pixel-art presentation, and light parody of 8-bit fantasy adventures. It is a nostalgia-first 3DS RPG release rather than a systems-heavy modern role-playing game.",
  "3ds-dragon-lapis":
    "Dragon Lapis is a Kemco RPG with traditional turn-based battles, class-like growth, and a fantasy quest built for portable play. It belongs to Kemco's large handheld RPG catalog, where steady progression and familiar genre comforts are the main draw.",
  "3ds-dragon-sinker":
    "Dragon Sinker is a retro-inspired Kemco RPG that leans into party building, pixel-art fantasy, and job-style character roles. The 3DS version is useful for players who want a straightforward old-school RPG loop on the handheld.",
  "3ds-dragon-s-wrath":
    "Dragon's Wrath is a 3DS eShop game from Codeglue and Gamers Digital built around dragon-themed action and arcade challenge structure. It is a modest digital release whose catalog value comes from separating it from the many similarly named fantasy games.",
  "3ds-drancia-saga":
    "Drancia Saga is a fast action RPG from Urara-works where players push through side-scrolling arenas, defeat waves of enemies, and upgrade characters between short runs. It gives the 3DS a bite-sized arcade RPG with a clear pick-up-and-play rhythm.",
  "3ds-dream-girl-premier":
    "Dream Girl Premier is a Japanese fashion and idol-flavored simulation focused on styling, presentation, and character-driven activities. It is a niche 3DS import for players collecting Alchemist's lifestyle and audience-specific releases.",
  "3ds-dreamworks-super-star-kartz":
    "DreamWorks Super Star Kartz is a licensed kart racer that brings characters from Shrek, Madagascar, How to Train Your Dragon, and other DreamWorks films onto themed tracks. The 3DS version fits the family multiplayer lane with accessible racing and recognizable movie casts.",
  "3ds-dreeps-alarm-playing-game":
    "Dreeps: Alarm Playing Game is an experimental passive RPG built around the 3DS alarm clock, where progress unfolds with minimal direct input. It is one of the platform's stranger digital curiosities, closer to an ambient toy than a conventional role-playing game.",
  "3ds-dress-to-play-cute-witches":
    "Dress to Play: Cute Witches! combines dress-up customization with side-scrolling flying stages, letting players style a witch and then use her in simple action challenges. It is a small CoderChild release with a clear fashion-plus-arcade hook.",
  "3ds-dress-to-play-magic-bubbles":
    "Dress to Play: Magic Bubbles! follows the same CoderChild idea of mixing outfit customization with light action play, this time around bubble-themed stage challenges. It belongs beside Cute Witches as part of a tiny dress-up/action subseries.",
  "3ds-drone-fight":
    "Drone Fight is a Silver Star racing-action game about piloting drones through courses, dodging obstacles, and competing for fast times. It is a late eShop-era 3DS release whose appeal is simple aerial movement and arcade repetition.",
  "3ds-drop-zone-under-fire":
    "Drop Zone: Under Fire is a budget 3DS action game focused on military-style shooting scenarios and quick mission play. It belongs to the handheld's smaller digital action catalog rather than the system's deeper tactical or adventure library.",
  "3ds-duck-dynasty":
    "Duck Dynasty is a licensed Activision game based on the reality-TV brand, built around outdoor mini-games, hunting-flavored tasks, and family-show personality. The 3DS version is chiefly a collector record for licensed media tie-in coverage.",
  "3ds-dungeon-runner":
    "Dungeon Runner is a small 3DS eShop action game about moving through dungeon spaces, avoiding threats, and chasing progress across straightforward fantasy challenges. It should be framed as a compact indie download rather than a large role-playing game.",
  "3ds-earthpedia":
    "Earthpedia is an educational reference-style 3DS title from Gakken built around learning about the natural world through images, facts, and interactive presentation. It belongs to the system's nontraditional software library alongside study and encyclopedia releases.",
  "3ds-elminage-gothic-3d-remix-ulm-zakir-to-yami-no-gishiki":
    "Elminage Gothic 3D Remix: Ulm Zakir to Yami no Gishiki brings Starfish's old-school dungeon-crawling RPG to 3DS with first-person maze exploration, party building, and unforgiving fantasy encounters. It is aimed at players who want mapping, character planning, and attrition-heavy RPG structure.",
  "3ds-elminage-ibun-ame-no-mihashira-kai":
    "Elminage Ibun: Ame no Mihashira Kai is a Japanese 3DS dungeon RPG that moves the Elminage formula into a more folklore-flavored setting. Players should expect first-person exploration, party composition, and menu-driven battles rather than a story-led cinematic RPG.",
  "3ds-elminage-ii-sousei-no-megami-to-unmei-no-daichi":
    "Elminage II: Sousei no Megami to Unmei no Daichi is a late 3DS entry in the Elminage dungeon-crawler line, centered on party creation, grid-based exploration, and turn-based combat. Its collector value comes from being a specialist import RPG in the system's long tail.",
  "3ds-elminage-iii-ankoku-no-shito-to-taiyou-no-kyuuden":
    "Elminage III: Ankoku no Shito to Taiyou no Kyuuden continues the series' traditional first-person RPG design with custom parties, labyrinth routes, equipment management, and difficult encounters. It belongs to the 3DS catalog as a niche late-era dungeon crawler for dedicated RPG players.",
  "3ds-elminage-original":
    "Elminage Original gives 3DS owners a portable version of Starfish's classically structured dungeon RPG, built around creating a party, probing maze floors, and surviving turn-based battles. It is one of the clearer examples of the handheld preserving Wizardry-style RPG design.",
  "3ds-epic-mickey-power-of-illusion":
    "Epic Mickey: Power of Illusion is a DreamRift-developed side-scrolling adventure inspired by Castle of Illusion, sending Mickey through hand-drawn Disney worlds with painting and thinner mechanics. The 3DS version is its own handheld game, not a miniature port of the console Epic Mickey sequels.",
  "3ds-epic-word-search-collection":
    "Epic Word Search Collection is a Lightwood Games puzzle release built around very large word-search grids and themed word lists. It is a quiet eShop-style title, useful for players who want low-pressure text puzzles and for collectors separating Lightwood's many 3DS puzzle entries.",
  "3ds-epic-word-search-collection-2":
    "Epic Word Search Collection 2 follows Lightwood's oversized word-search format with another selection of themed grids and long-form puzzle solving. The sequel matters because it is a separate 3DS release with the same calm, completion-focused structure as the first collection.",
  "3ds-epic-word-search-holiday-special":
    "Epic Word Search Holiday Special turns Lightwood's word-search format toward seasonal lists and themed puzzle boards. It is not a systems-heavy game, but it gives the 3DS library another dedicated word puzzle entry with a clear holiday identity.",
  "3ds-escape-from-forest":
    "Escape From Forest is a late 3DS eShop release from RandomSpin and Vadim Gafton focused on escaping a hostile outdoor setting through simple movement and survival-style obstacles. Its main catalog hook is its very late release window, when the 3DS digital library was winding down.",
  "3ds-escape-from-zombie-city":
    "Escape From Zombie City is a Tom Create action game about moving through infected city stages, rescuing survivors, and avoiding the pressure of enemy swarms. It fits the 3DS eShop as a compact top-down survival-action title rather than a full horror adventure.",
  "3ds-escapevektor":
    "escapeVektor is an abstract action-puzzle game where players trace circuits, avoid enemies, and clear nodes across neon grid stages. Its 3DS version is especially about quick route planning, score chasing, and using stereoscopic depth to make the digital maze feel sharper.",
  "3ds-european-conqueror-3d":
    "European Conqueror 3D is a turn-based strategy game from Circle Entertainment about moving armies, capturing territory, and playing through historical military scenarios. It is a budget strategy entry for players who want map control and campaign progression on a handheld scale.",
  "3ds-excave":
    "Excave is a Mechanic Arms dungeon action RPG built around entering compact labyrinths, fighting monsters, collecting equipment, and pushing deeper through straightforward hack-and-slash runs. The 3DS release is simple but readable for players who want quick fantasy dungeon sessions.",
  "3ds-excave-ii-wizard-of-the-underworld":
    "Excave II: Wizard of the Underworld continues the dungeon-action formula with more equipment hunting, monster rooms, and direct combat built for short downloadable play. It is a separate entry for collectors tracking the full Excave trilogy on 3DS.",
  "3ds-excave-iii-tower-of-destiny":
    "Excave III: Tower of Destiny sends the series upward through a tower structure, keeping the focus on hack-and-slash rooms, loot, and light RPG growth. Its value is as the third 3DS Excave installment, with the tower framing giving it a cleaner identity than the earlier dungeon entries.",
  "3ds-eyeresh":
    "EyeResh is a 3DS eye-training and visual-care utility built around exercises developed with Professor Hisao Ishigaki. It sits outside normal game categories, serving more as health-adjacent training software than as puzzle, action, or adventure entertainment.",
  "3ds-fabstyle":
    "FabStyle is a Koei Tecmo fashion and boutique simulation where players manage style choices, customer presentation, and social-life elements. It is a Japanese 3DS lifestyle sim with a sharper fashion-business identity than the broader dress-up games around it.",
  "3ds-face-racers-photo-finish":
    "Face Racers: Photo Finish is a 3DS kart-style racer built around photographing faces and placing them onto in-game drivers. Its hook is the system camera gimmick, turning a simple racing structure into an early 3DS novelty release.",
  "3ds-fairune":
    "Fairune is a compact action-adventure RPG from Skipmore about solving overworld puzzles, finding progression items, and fighting only when the player's level makes it practical. It feels closer to a minimalist puzzle RPG than a combat-heavy dungeon game.",
  "3ds-fairune-2":
    "Fairune 2 expands Skipmore's tiny action-RPG idea with a larger world, more puzzle routes, and the same emphasis on exploration and level-gated combat. It is a worthwhile 3DS eShop sequel for players who like short, clever retro-styled adventures.",
  "3ds-family-bowling-3d":
    "Family Bowling 3D is an Arc System Works bowling game built around accessible lane play, timing, spin, and light party-game presentation. It belongs to the Family sports line of small downloadable 3DS releases.",
  "3ds-family-fishing":
    "Family Fishing is an approachable fishing game about casting, reeling, collecting different catches, and working through relaxed angling challenges. It is a casual 3DS sports title designed for short sessions rather than deep simulation.",
  "3ds-family-kart-3d":
    "Family Kart 3D is a lightweight kart racer from Arc System Works with simple tracks, item-style arcade racing, and family-friendly presentation. It gives the 3DS eShop a budget alternative to larger character racers.",
  "3ds-family-tennis-3d":
    "Family Tennis 3D turns tennis into an accessible 3DS arcade-sports release, emphasizing rallies, simple controls, and quick matches. It fits beside Family Bowling 3D and Family Kart 3D as part of Arc System Works' compact sports catalog.",
  "3ds-fantasy-pirates":
    "Fantasy Pirates is an EnjoyUp Games action-strategy release about pirate crews, lane-like battles, and fantasy-flavored clashes. It is a small eShop title whose appeal is quick tactical play rather than open-ended seafaring adventure.",
  "3ds-farmscapes":
    "Farmscapes brings Playrix's casual puzzle-and-restoration formula to 3DS, mixing match-three style progression with rebuilding a neglected farm setting. It is best understood as a cozy casual puzzle release with light management flavor.",
  "3ds-fat-dragons":
    "Fat Dragons is a Nostatic Software action game with a simple fantasy-comedy premise, built around guiding a dragon through compact challenges and hazards. It fits the late 3DS eShop catalog as a small, direct arcade release.",
  "3ds-fatal-fracture":
    "Fatal Fracture is a late 3DS eShop release from Igor Gafton and VG & IG, built around compact action challenges and low-budget digital presentation. Its main database value is identifying it clearly as part of the handheld's final wave of small independent releases.",
  "3ds-fifa-soccer-13":
    "FIFA Soccer 13 brings EA's football series to 3DS with licensed clubs, portable match play, and handheld-friendly versions of the series' familiar passing and shooting flow. It is a sports-library anchor for collectors separating yearly FIFA entries across platforms.",
  "3ds-fifteen":
    "Fifteen is an RCMADIAX puzzle release based on sliding-number puzzle logic, asking players to reorder tiles through empty-space movement. It is a bare, rules-first eShop title for quick thinking sessions and puzzle completion.",
  "3ds-fireman-sam-to-the-rescue":
    "Fireman Sam: To the Rescue adapts the children's rescue series into a 3DS game of simple emergency missions and character-driven tasks. It is a regional family licensed release aimed at younger players rather than an action-simulation audience.",
  "3ds-fish-eyes-3d":
    "Fish Eyes 3D is a Marvelous fishing game focused on location selection, casting, reeling, and catching different fish in a calm outdoor presentation. It is a more straightforward angling title than the cartoonier Family Fishing.",
  "3ds-fish-on":
    "Fish On is a SIMS-developed fishing game for 3DS that emphasizes lure choice, timing, and arcade-style angling in portable sessions. It belongs to the system's early fishing lineup and is distinct from Marvelous's Fish Eyes 3D.",
  "3ds-fishdom-h2o-hidden-odyssey":
    "Fishdom H2O: Hidden Odyssey is a Playrix hidden-object and aquarium-decorating game where players search scenes for items, earn resources, and build out aquatic displays. The 3DS version sits squarely in the casual puzzle and object-hunt lane.",
  "3ds-flap-flap":
    "Flap Flap is a simple Sanuk Games action release built around keeping a character airborne through timing and repeated attempts. Its 3DS appeal is quick retry play, with the kind of direct rule set common to small mobile-style eShop titles.",
  "3ds-flick-golf-3d":
    "Flick Golf 3D adapts Full Fat's touch-friendly golf-shot formula to 3DS, asking players to swipe shots, bend the ball, and chase target scores. It is more arcade skill challenge than full course simulation.",
  "3ds-flying-axe":
    "Flying Axe is a very late 3DS eShop game from Crasnencov about throwing or guiding axes through simple arcade challenges. Its importance is mainly catalog completeness, since it arrived during the handheld's late digital-only period.",
  "3ds-food-wars-the-dish-of-friendship-and-bonds":
    "Food Wars: The Dish of Friendship and Bonds adapts the cooking manga and anime into a 3DS visual-novel-style game about character events, school-life moments, and culinary competition flavor. It is primarily for fans of the license rather than cooking-sim players.",
  "3ds-four-bombs":
    "Four Bombs is an RCMADIAX puzzle-action game built around bomb placement, movement, and avoiding mistakes in tight layouts. It is a small eShop release where the appeal is learning simple rules and replaying compact challenges.",
  "3ds-fractured-soul":
    "Fractured Soul is a dual-screen action platformer that asks players to shift between the top and bottom screens to dodge hazards, fight enemies, and clear stage layouts. Its screen-swapping design gives it a stronger 3DS identity than many downloadable platformers.",
  "3ds-fragrant-story":
    "Fragrant Story is a late physical and digital 3DS tactical RPG from William Kage, notable for arriving after the system's commercial peak. It uses compact grid battles, fantasy-party structure, and collector-interest scarcity to stand out in the late 3DS catalog.",
  "3ds-freakyforms-deluxe-your-creations-alive":
    "Freakyforms Deluxe: Your Creations, Alive! expands Nintendo's creature-building game with more creation tools, dungeon-style areas, and retail-release visibility. Players draw unusual forms, give them parts, and bring them into a playful world built around user-made characters.",
  "3ds-freakyforms-your-creations-alive":
    "Freakyforms: Your Creations, Alive! is a Nintendo-published eShop game about drawing custom forms, animating them with parts, and exploring a whimsical world shaped around player creations. It is one of the 3DS's clearest early digital-first curiosities.",
  "3ds-frontier-days-founding-pioneers":
    "Frontier Days: Founding Pioneers is a settlement-building simulation about gathering resources, constructing facilities, managing workers, and growing a frontier town. It gives the 3DS eShop a slow management loop with Arc System Works and Circle Entertainment distribution history.",
  "3ds-frutakia-2":
    "Frutakia 2 is a Crazysoft puzzle game centered on matching fruit, clearing boards, and working through bright casual stages. It is a straightforward digital puzzle release where the sequel number matters for keeping similar casual entries distinct.",
  "3ds-fujiko-f-fujio-characters-daishuugou-sf-dotabata-party":
    "Fujiko F. Fujio Characters Daishuugou! SF Dotabata Party! is a Bandai Namco party game bringing together characters associated with Fujiko F. Fujio, including Doraemon-related crossover appeal. It is a licensed import release built around board-game-style events and character recognition.",
  "3ds-funfair-party-games":
    "Funfair Party Games is a carnival-themed mini-game collection with simple attractions, score goals, and family-friendly presentation. It belongs to the 3DS library's casual party lane, where quick activities and theme-park flavor are the core hook.",
  "3ds-future-card-buddyfight-mezase-buddy-champion":
    "Future Card Buddyfight: Mezase! Buddy Champion! adapts Bushiroad's trading-card property into a 3DS game about deck building, card battles, and anime-style progression. It is notable because it connects handheld video games with a physical trading-card media franchise.",
  "3ds-future-card-buddyfight-tanjou-oretachi-no-saikyou-body":
    "Future Card Buddyfight: Tanjou! Oretachi no Saikyou Body! continues the Buddyfight handheld line with another card-battle campaign, deck construction, and character tie-ins. It should be cataloged separately because it reflects a later snapshot of the physical card game's media cycle.",
  "3ds-future-card-buddyfight-yuujou-no-bakunetsu-fight":
    "Future Card Buddyfight: Yuujou no Bakunetsu Fight! turns Bushiroad's card-battling franchise into a handheld campaign of deck building, character rivalries, and anime-style card duels. It is a natural bridge between 3DS collecting and trading-card fandom.",
  "3ds-g1-grand-prix":
    "G1 Grand Prix is Genki's horse-racing management game, built around raising racehorses, entering events, and chasing stronger results over a season. It sits closer to simulation and breeding strategy than arcade racing.",
  "3ds-gabrielle-s-ghostly-groove-3d":
    "Gabrielle's Ghostly Groove 3D is a spooky-cute rhythm game where Gabrielle dances through haunted stages with monster friends. Its hook is approachable timing play wrapped in Natsume's Halloween-flavored character style.",
  "3ds-gabrielle-s-ghostly-groove-mini":
    "Gabrielle's Ghostly Groove Mini condenses the haunted rhythm-game idea into a smaller downloadable release, focusing on short dance routines and score chasing. It works best as a quick-session companion to the fuller 3D entry.",
  "3ds-gacha-racing":
    "Gacha Racing mixes arcade driving with capsule-toy collection, letting players unlock parts and vehicles through a gacha-style progression loop. The result is a small 3DS racer where collecting upgrades is as important as finishing first.",
  "3ds-gaist-crusher":
    "Gaist Crusher is Capcom and Treasure's action game about armored heroes fighting crystal-powered enemies called Gaists. It blends mission-based combat, transformation suits, and toy/anime tie-in energy into one of the 3DS's more distinctive Japan-focused action releases.",
  "3ds-gaist-crusher-god":
    "Gaist Crusher God expands the original game's armored-action formula with additional Gaists, missions, and late-series content. For collectors, it represents the upgraded version of Capcom's multimedia 3DS experiment rather than a simple sequel.",
  "3ds-gakuyuu-unmeikyoudoutai-friends-in-the-same-rpg":
    "Gakuyuu Unmeikyoudoutai: Friends in the Same RPG is a Poisoft role-playing release built around party growth, dungeon progress, and a playful school-friend framing. It is one of the system's smaller Japanese eShop RPG curiosities.",
  "3ds-gal-galaxy-pain":
    "Gal Galaxy Pain is a compact sci-fi shooting release with simple enemy patterns, score pressure, and budget eShop presentation. Its value in the library is separating a small Japanese digital shooter from the many similarly named space shooters on 3DS.",
  "3ds-galaxy-blaster":
    "Galaxy Blaster is an RCMADIAX space shooter focused on direct movement, enemy waves, and survival-style arcade play. It is a minimal eShop release, closer to a score-attack diversion than a full campaign shooter.",
  "3ds-galaxy-blaster-code-red":
    "Galaxy Blaster Code Red follows the same stripped-down space-shooter lane with a red-alert theme and compact stage structure. It belongs beside the original Galaxy Blaster as a small digital variant for completion-minded 3DS collectors.",
  "3ds-game-center-cx-3-choume-no-arino":
    "Game Center CX: 3-Choume no Arino continues the retro-game parody series inspired by the Japanese TV show, presenting fictional old-school games and challenges through Arino's comedy framing. It is especially interesting for players who like games about game history and arcade-era design.",
  "3ds-games-festival-1":
    "Games Festival 1 is a family mini-game collection from Neopica and Bigben, built around short competitive activities rather than one central campaign. It belongs to the casual party side of the 3DS catalog.",
  "3ds-games-festival-2":
    "Games Festival 2 continues Bigben's mini-game collection format with another set of quick activities for younger or family audiences. It is best tracked as a companion volume rather than a major mechanical reinvention.",
  "3ds-games-for-toddlers-2":
    "Games for Toddlers 2 is a simple activity collection aimed at very young players, with basic interactions, bright prompts, and short tasks. It is a niche digital release whose audience is early-childhood play rather than traditional handheld gaming.",
  "3ds-geki-yaba-runner-deluxe":
    "Geki Yaba Runner Deluxe is a fast auto-runner built around jumping, wall movement, hazards, and repeated attempts through compact stages. Its pace and retry loop make it a sharper platforming challenge than its goofy fantasy presentation first suggests.",
  "3ds-geki-yaba-runner-habanero":
    "Geki Yaba Runner Habanero is a later bite-sized take on the Geki Yaba Runner formula, pushing quick reaction platforming through short downloadable challenges. It is a good example of Flyhigh Works' smaller 3DS eShop releases.",
  "3ds-gekitou-senshi-nagerunder":
    "Gekitou Senshi Nagerunder is a SilverStar action release centered on throwing-based battles and simple arena challenges. It stands out mostly as a Japan-only digital oddity with a toy-like hero premise.",
  "3ds-genkai-yamadzumi-battle":
    "Genkai! Yamadzumi Battle is a puzzle-battle game about stacking, clearing, and pressuring opponents through increasingly crowded boards. It fits the 3DS eShop's small competitive puzzle lane.",
  "3ds-ginsei-igo-3d":
    "Ginsei Igo 3D brings traditional Go to 3DS with computer opponents, board presentation, and portable practice tools. It is a straightforward tabletop adaptation for players who want the strategy game on a handheld.",
  "3ds-ginsei-shogi-3d":
    "Ginsei Shogi 3D is a portable shogi release with CPU play and board-game presentation tailored to the 3DS screen. It serves a classic Japanese strategy audience rather than the broader action or RPG crowd.",
  "3ds-girls-rpg-cinderelife":
    "Girls RPG: Cinderelife is Level-5's hostess-themed role-playing and life-sim hybrid, built around conversation, styling, customer service, and celebrity cameos. It is one of the 3DS library's stranger Level-5 experiments, mixing social simulation with RPG branding.",
  "3ds-girls-fashion-shoot":
    "Girls' Fashion Shoot focuses on styling outfits, building a model's profile, and taking fashion-magazine photo shoots. It sits beside the 3DS's boutique and style games, with more emphasis on photography presentation.",
  "3ds-glory-of-generals":
    "Glory of Generals is a turn-based military strategy game that moves players through World War II-inspired campaigns, unit positioning, and commander-led battles. It is one of Circle Entertainment's heavier strategy entries on the eShop.",
  "3ds-glory-of-generals-the-pacific":
    "Glory of Generals: The Pacific shifts the series' turn-based warfare to Pacific theater scenarios, adding naval emphasis and island-front campaign structure. It is a companion release for players tracking the full 3DS strategy catalog.",
  "3ds-go-princess-precure-sugar-oukoku-to-6-nin-no-princess":
    "Go! Princess PreCure: Sugar Oukoku to 6-nin no Princess! adapts the magical-girl anime into a kid-friendly adventure with character events, mini-games, and transformation-flavored presentation. It is primarily a licensed fan release tied to that specific PreCure season.",
  "3ds-gotouchi-tetsudou-gotouchi-chara-to-nihon-zenkoku-no-tabi":
    "Gotouchi Tetsudou sends mascot-like regional characters around Japan in a board-game travel format. Players move across the country, encounter local themes, and compete through light party-game systems built around Japanese geography.",
  "3ds-gotta-protectors":
    "Gotta Protectors is Ancient's retro-styled tower-defense action game, asking players to protect a princess while switching between heroes, clearing enemy waves, and managing lanes. Its chiptune energy and arcade pace make it one of the 3DS eShop's cult favorites.",
  "3ds-gourmet-dream":
    "Gourmet Dream is a restaurant management simulation about planning menus, upgrading service, and growing a food business through steady day-to-day choices. It gives the 3DS library a compact business-sim option with a light culinary theme.",
  "3ds-governor-of-poker":
    "Governor of Poker brings Texas Hold'em to a western-themed campaign, mixing card-table play with town-to-town progression. It is built for players who want poker structure and light single-player advancement on 3DS.",
  "3ds-grinsia":
    "Grinsia is a traditional JRPG from Kemco's catalog, built around a party of treasure hunters, turn-based battles, and a fantasy quest structure. The 3DS version gives the handheld another old-school role-playing option outside the major publisher franchises.",
  "3ds-groove-heaven":
    "Groove Heaven is a rhythm-action game about guiding an angelic character through music-timed challenges and simple story scenes. It is a small Teyon-published eShop title with a lighter, character-comedy tone than most rhythm games on the system.",
  "3ds-gu-nyan":
    "Gu-nyan is a Cosen puzzle-action release with a cute cat-like character and compact stage challenges. It is a small Japanese eShop entry whose appeal is quick, simple play rather than deep progression.",
  "3ds-gudetama-hanjuku-de-tanomuwa":
    "Gudetama: Hanjuku de Tanomuwa turns Sanrio's lazy egg mascot into a collection of mini-games, food jokes, and character interactions. It is a novelty licensed release for Gudetama fans more than a conventional cooking game.",
  "3ds-gudetama-okawari-ikagassuka":
    "Gudetama: Okawari Ikagassuka follows the same Sanrio mascot formula with more Gudetama-themed mini-games and light interaction. It is best understood as a companion release for collectors following character-license 3DS software.",
  "3ds-guide-the-ghost":
    "Guide the Ghost is a minimalist RCMADIAX puzzle-action game about directing a ghost through simple hazards and exits. It belongs to the late eShop wave of tiny concept games built around one clear mechanical idea.",
  "3ds-gummy-bears-magical-medallion":
    "Gummy Bears Magical Medallion is a colorful platform adventure starring candy-like characters across simple stages and obstacles. It is a budget family release, notable mostly for its licensed-style presentation and kid-friendly difficulty.",
  "3ds-gummy-bears-mini-golf":
    "Gummy Bears Mini Golf turns the same bright character world into short miniature-golf courses with simple aiming and putting. It is a small family sports spin-off rather than a direct follow-up to the platform game.",
  "3ds-gunma-no-yabou-for-nintendo-3ds":
    "Gunma no Yabou for Nintendo 3DS adapts a regional Japanese conquest joke into a quirky strategy game about spreading Gunma's influence. Its appeal is oddball local humor and map-control play.",
  "3ds-gunslugs":
    "Gunslugs is a fast run-and-gun action game with chunky pixel art, random-feeling stage chaos, and short missions packed with explosions. The 3DS port brings Orangepixel's arcade action to handheld play.",
  "3ds-gunslugs-2":
    "Gunslugs 2 increases the pace and scale of the first game's run-and-gun formula with bigger set pieces, more enemies, and heavier arcade chaos. It is the sharper sequel for players who want quick action bursts.",
  "3ds-guruguru-tamagotchi":
    "Guruguru Tamagotchi! adapts Bandai Namco's virtual-pet brand into a 3DS game of character care, mini-games, and bright social interaction. It is a licensed import title centered on the Tamagotchi cast rather than a generic pet sim.",
  "3ds-haikyu-cross-team-match":
    "Haikyu!! Cross Team Match! adapts the volleyball anime into a character-heavy 3DS release with school-team interactions and match-focused progression. It is primarily for fans following the series' teams, relationships, and sports-drama energy.",
  "3ds-haikyu-tsunage-itadaki-no-keshiki":
    "Haikyu!! Tsunage! Itadaki no Keshiki!! brings the anime's volleyball matches and team-building moments to 3DS through story scenes and simplified sports play. It matters as the earlier handheld Haikyu entry before Cross Team Match.",
  "3ds-halloween-night-archery":
    "Halloween Night Archery is a Petite Games target-shooting release built around spooky scenery, bow aiming, and quick scoring challenges. It is a small seasonal eShop game suited to brief arcade sessions.",
  "3ds-halloween-trick-or-treat-2":
    "Halloween: Trick or Treat 2 is a hidden-object game set around Halloween scenes, asking players to spot items and work through festive picture puzzles. It is casual, decorative, and more about observation than scares.",
  "3ds-hamatora-look-at-smoking-world":
    "Hamatora: Look At Smoking World adapts the anime and manga property into a 3DS adventure with character conversations, investigation elements, and superpowered conflict. It is a Japan-only licensed release aimed at fans of the franchise.",
  "3ds-happiness-charge-precure-kawa-run-collection":
    "Happiness Charge PreCure! Kawa-Run Collection is a magical-girl licensed game focused on fashion, character interaction, and mini-game activities tied to the HappinessCharge PreCure season. It is a fan-service entry for younger anime viewers.",
  "3ds-happy-circus":
    "Happy Circus is a small mini-game collection built around circus attractions, simple timing challenges, and family-friendly visuals. It belongs to the casual eShop catalog rather than the system's deeper simulation or party releases.",
  "3ds-harold-reborn":
    "Harold Reborn is a late 3DS eShop platform release from Luke Vincent, focused on simple stage movement and independent digital-game presentation. It is mainly notable as part of the handheld's final wave of creator-driven releases.",
  "3ds-harold-s-walk":
    "Harold's Walk is another Luke Vincent 3DS eShop release, built around simple exploration and platform-style movement through small spaces. It is a modest independent entry that matters most for catalog completeness.",
  "3ds-hatsune-miku-and-future-stars-project-mirai":
    "Hatsune Miku and Future Stars: Project Mirai brings Sega's Vocaloid rhythm series to 3DS with chibi character models, touch-based note charts, and song performances built for handheld play. It is the Japan-only predecessor to the later Project Mirai DX.",
  "3ds-hatsune-miku-project-mirai-2":
    "Hatsune Miku: Project Mirai 2 expands the 3DS Vocaloid rhythm formula with more songs, modes, and polished character presentation. It is an important import entry for rhythm-game fans tracking the Project Mirai line.",
  "3ds-hazumi":
    "Hazumi is a physics puzzle game about launching a small creature through compact stages, bouncing around hazards, and finding the correct angle or timing. Its clean rule set makes it one of the simpler skill-puzzle releases on the 3DS eShop.",
  "3ds-heart-beaten":
    "Heart Beaten is a Springloaded action-puzzle release with a strange medical-comedy premise, asking players to react quickly and manage compact challenges around a beating heart. It is one of the odder late eShop curiosities.",
  "3ds-heavy-fire-black-arms-3d":
    "Heavy Fire: Black Arms 3D is an on-rails military shooter from Teyon built around quick aiming, scripted firefights, and arcade-style mission scoring. It is one of several Heavy Fire entries that brought budget light-gun-style play to 3DS.",
  "3ds-heavy-fire-special-operations-3d":
    "Heavy Fire: Special Operations 3D focuses on short on-rails combat missions with military targets, reload timing, and score-driven shooting. It works as a compact arcade shooter rather than a tactical war game.",
  "3ds-heavy-fire-the-chosen-few":
    "Heavy Fire: The Chosen Few continues the series' on-rails shooter structure with scripted combat scenarios and quick handheld sessions. It is useful to separate from Black Arms and Special Operations because the 3DS has multiple similar Heavy Fire releases.",
  "3ds-hello-kitty-to-issho-block-crash-z":
    "Hello Kitty to Issho! Block Crash Z is a character-license block-breaking game that combines Sanrio-style presentation with arcade brick-clearing stages. It is a Japan-only curiosity for collectors tracking Hello Kitty and crossover mascot software.",
  "3ds-henri":
    "Henri is a Hit-Point puzzle release about guiding a small character through compact, touch-friendly challenges. It sits in the eShop's quiet puzzle corner, where the appeal is quick problem solving rather than spectacle.",
  "3ds-heyawake-by-nikoli":
    "Heyawake by Nikoli adapts the logic-puzzle format published by Nikoli, asking players to shade grid cells according to strict room and adjacency rules. It is part of the 3DS's strong run of dedicated puzzle-book style releases.",
  "3ds-heybot-heyboheybo-heybotournament":
    "HeyBot! HeyboHeybo! HeyBoTournament! adapts the gag anime into a 3DS game of toy-like battles, character comedy, and license-specific mini-game energy. It is a niche Bandai Namco entry for fans of the show's absurd robot humor.",
  "3ds-greco-kara-no-chousenjou-eitango-no-shima-to-obaketachi-step-1":
    "Greco Kara no Chousenjou! Eitango no Shima to Obaketachi Step 1 is an English-vocabulary study game for younger Japanese learners, using ghost-themed quizzes and practice tasks to teach basic words. It belongs to Media 5's large line of subject-specific 3DS education releases.",
  "3ds-greco-kara-no-chousenjou-eitango-no-shima-to-obaketachi-step-2":
    "Greco Kara no Chousenjou! Eitango no Shima to Obaketachi Step 2 continues the ghost-island English-study format with a higher step of vocabulary practice. The 3DS entry is designed as a workbook-like learning tool with game-style feedback.",
  "3ds-greco-kara-no-chousenjou-eitango-no-shima-to-obaketachi-step-3":
    "Greco Kara no Chousenjou! Eitango no Shima to Obaketachi Step 3 advances the same English-learning series through more vocabulary drills and quiz-style challenges. Its audience is students using the 3DS as a portable study aid.",
  "3ds-greco-kara-no-chousenjou-eitango-no-shima-to-obaketachi-step-4":
    "Greco Kara no Chousenjou! Eitango no Shima to Obaketachi Step 4 is another upper step in Media 5's ghost-themed English vocabulary series. It emphasizes repeated practice, answer checking, and bite-sized study sessions rather than traditional adventure play.",
  "3ds-greco-kara-no-chousenjou-kanji-no-yakata-to-obake-tachi-shougaku-1-nensei":
    "Greco Kara no Chousenjou! Kanji no Yakata to Obake-Tachi: Shougaku 1 Nensei teaches first-grade Japanese kanji through ghost-house drills, quizzes, and portable review. It is part of a grade-by-grade education run on 3DS.",
  "3ds-greco-kara-no-chousenjou-kanji-no-yakata-to-obake-tachi-shougaku-2-nensei":
    "Greco Kara no Chousenjou! Kanji no Yakata to Obake-Tachi: Shougaku 2 Nensei moves the kanji-study format to second-grade characters and reading practice. It uses light spooky theming to package otherwise straightforward study exercises.",
  "3ds-greco-kara-no-chousenjou-kanji-no-yakata-to-obake-tachi-shougaku-3-nensei":
    "Greco Kara no Chousenjou! Kanji no Yakata to Obake-Tachi: Shougaku 3 Nensei focuses on third-grade kanji recognition, writing memory, and quiz review. It is a functional education cartridge/download more than a story-driven game.",
  "3ds-greco-kara-no-chousenjou-kanji-no-yakata-to-obake-tachi-shougaku-4-nensei":
    "Greco Kara no Chousenjou! Kanji no Yakata to Obake-Tachi: Shougaku 4 Nensei continues the grade-specific kanji curriculum with ghost-themed question sets. The appeal is structured Japanese-language practice in short handheld sessions.",
  "3ds-greco-kara-no-chousenjou-kanji-no-yakata-to-obake-tachi-shougaku-5-nensei":
    "Greco Kara no Chousenjou! Kanji no Yakata to Obake-Tachi: Shougaku 5 Nensei covers fifth-grade kanji with quiz loops, review screens, and study progression. It belongs to the 3DS catalog's practical learning software rather than entertainment-first play.",
  "3ds-greco-kara-no-chousenjou-kanji-no-yakata-to-obake-tachi-shougaku-6-nensei":
    "Greco Kara no Chousenjou! Kanji no Yakata to Obake-Tachi: Shougaku 6 Nensei wraps the primary-school kanji sequence with sixth-grade character practice. It is useful in the library as a distinct curriculum volume, not just a duplicate title.",
  "3ds-greco-kara-no-chousenjou-keisan-no-shiro-to-obake-tachi-hikizan":
    "Greco Kara no Chousenjou! Keisan no Shiro to Obake-Tachi: Hikizan teaches subtraction through a haunted-castle math format, with quick arithmetic problems and feedback. It is one of several single-skill math releases from Media 5.",
  "3ds-greco-kara-no-chousenjou-keisan-no-shiro-to-obake-tachi-kakezan":
    "Greco Kara no Chousenjou! Keisan no Shiro to Obake-Tachi: Kakezan focuses on multiplication practice through ghost-themed math challenges. It is a narrowly targeted education title built for repetition and memorization.",
  "3ds-greco-kara-no-chousenjou-keisan-no-shiro-to-obake-tachi-tashizan":
    "Greco Kara no Chousenjou! Keisan no Shiro to Obake-Tachi: Tashizan packages addition drills as a haunted-castle challenge for younger learners. The 3DS format makes it a portable arithmetic workbook with light game presentation.",
  "3ds-greco-kara-no-chousenjou-keisan-no-shiro-to-obake-tachi-warizan":
    "Greco Kara no Chousenjou! Keisan no Shiro to Obake-Tachi: Warizan covers division practice through timed or quiz-style math tasks. It rounds out Media 5's 3DS arithmetic set alongside the addition, subtraction, and multiplication entries.",
  "3ds-gurutan-chuugaku-eitango":
    "Gurutan: Chuugaku Eitango is a middle-school English vocabulary study release with flashcard-like review, quizzes, and portable practice structure. It is aimed at Japanese students using the 3DS as a study tool.",
  "3ds-gurutan-koukou-eitango":
    "Gurutan: Koukou Eitango shifts the Gurutan vocabulary format toward high-school English study, with more advanced word practice and review loops. It is education software first, wrapped in a simple handheld interface.",
  "3ds-gurutan-otona-no-eitango":
    "Gurutan: Otona no Eitango targets adult English vocabulary review through short practice sessions and quiz repetition. It is one of the clearer examples of the 3DS library extending beyond children and core game audiences.",
  "3ds-hayate-no-usagi-maru-megumi-no-tama-to-fu-ma-no-shirushi":
    "Hayate no Usagi Maru: Megumi no Tama to Fu Ma no Shirushi is a puzzle-action adventure about using tools, traps, and careful planning to rescue villagers across stage-based challenges. It has a stronger handcrafted puzzle identity than many small eShop platformers.",
  "3ds-hidden-haunts-gothic-masquerade":
    "Hidden Haunts: Gothic Masquerade is a hidden-object adventure built around searching ornate spooky scenes, solving light puzzles, and following a gothic mystery thread. It is a casual object-hunt release for players who like illustrated scenes and quiet pacing.",
  "3ds-hideaways-foggy-valley":
    "Hideaways: Foggy Valley is a hidden-object game about exploring misty locations, finding listed items, and progressing through picture-puzzle scenes. It fits the casual 3DS library as a relaxed visual-search experience.",
  "3ds-hiding-out":
    "Hiding Out is a small Green Lightning eShop release centered on stealth-like movement and avoiding detection in compact spaces. Its value is as a simple independent concept game from the late 3DS digital catalog.",
  "3ds-higanbana-no-saku-yoru-ni":
    "Higanbana no Saku Yoru ni adapts Ryukishi07's horror visual novel into a 3DS release of school rumors, supernatural stories, and character-driven suspense. It is a text-heavy import title for readers interested in Japanese horror storytelling.",
  "3ds-hime-girl-paradise-mechikawa-agemori-sensation":
    "Hime Girl Paradise: Mechikawa! Agemori Sensation! adapts the fashion-themed manga into a 3DS game about styling, character events, and cute makeover presentation. It is aimed at fans of the license and younger fashion-game players.",
  "3ds-hippari-nya":
    "Hippari~Nya! is a Tom Create puzzle-action game built around pulling, launching, and guiding a cat-like character through compact challenges. Its simple touch-friendly idea gives it a distinct place among small Japanese eShop releases.",
  "3ds-hit-ninja":
    "Hit Ninja is a Petite Games arcade-action release about quick attacks, enemy waves, and compact score-focused stages. It is a small digital title built for short bursts rather than long progression.",
  "3ds-hitori-by-nikoli":
    "Hitori by Nikoli adapts the classic number-grid logic puzzle where players shade cells to eliminate repeated numbers while keeping the board connected. It is part of Hamster's focused Nikoli puzzle series on 3DS.",
  "3ds-hiyoko-mamire":
    "Hiyoko Mamire is a quirky chick-themed action puzzle release about managing crowds of tiny birds through simple stage objectives. Its appeal is cute chaos and short-session play.",
  "3ds-hollywood-fame-hidden-object-adventure":
    "Hollywood Fame: Hidden Object Adventure sends players through celebrity and movie-themed hidden-object scenes, finding items and following a light entertainment-world story. It is casual puzzle fare rather than a film-business simulation.",
  "3ds-hoppechan-minna-de-odekake-wakuwaku-hoppe-land":
    "Hoppechan Minna de Odekake! Wakuwaku Hoppe Land!! turns the squishy Hoppechan character brand into a bright 3DS outing with mini-games, collecting, and cute-world exploration. It is a character-merchandise tie-in for younger players.",
  "3ds-hoppechan-punitto-shibotte-daibouken":
    "Hoppechan: Punitto Shibotte Daibouken! gives the Hoppechan mascot a small adventure format with cute stages, character collecting, and light action. It is a Japan-only licensed entry for collectors tracking toy and charm brands on 3DS.",
  "3ds-hoppechan-tsukutte-asonde-punipuni-town":
    "Hoppechan: Tsukutte! Asonde! Punipuni Town!! focuses on making, decorating, and interacting with Hoppechan characters in a soft, toy-like town setting. It leans more into creation and collection than action.",
  "3ds-horrid-henry-the-good-the-bad-and-the-bugly":
    "Horrid Henry: The Good, the Bad and the Bugly adapts the children's book and TV character into a side-scrolling adventure with pranks, schoolyard humor, and simple platform challenges. It is a regional licensed family release.",
  "3ds-horror-stories":
    "Horror Stories is a low-budget RandomSpin release built around short horror-themed challenges and simple interactive scares. It is a small eShop curiosity rather than a full survival-horror campaign.",
  "3ds-horse-life-4":
    "Horse Life 4 is an equestrian care and riding game about grooming horses, training them, and taking part in riding activities. It fits the 3DS library's pet-and-hobby simulation lane.",
  "3ds-horse-vet-3d":
    "Horse Vet 3D puts players in a veterinary role, treating horses, handling care tasks, and working through stable-life scenarios. It is more animal-care simulation than riding competition.",
  "3ds-horses-3d":
    "Horses 3D is Ubisoft's handheld horse-care game, combining riding lessons, grooming, stable interaction, and countryside activities. It is one of the more recognizable western horse titles on 3DS.",
  "3ds-horseshoe-crab-rescue":
    "Horseshoe Crab Rescue! is a small conservation-themed release about helping horseshoe crabs through simple interactive tasks. It stands out because its subject matter is educational and ecological rather than genre-standard action.",
  "3ds-hot-wheels-world-s-best-driver":
    "Hot Wheels: World's Best Driver brings the toy-car brand to 3DS with stunt driving, themed teams, and arcade challenges built around speed, drifting, and spectacle. It is a licensed racer aimed at Hot Wheels fans more than sim drivers.",
  "3ds-hotel-transylvania":
    "Hotel Transylvania is WayForward's handheld adaptation of the animated film, built as a side-scrolling adventure through the monster hotel. Players guide Mavis through rooms, hazards, and character encounters with a light family-friendly tone.",
  "3ds-hungry-burger":
    "Hungry Burger is an Arc System Works puzzle-action release about assembling food orders under pressure. It uses a simple cooking-service premise for short, score-minded eShop play.",
  "3ds-hunting-and-camping-in-a-singularity":
    "Hunting and Camping: in a singularity is an unusual independent eShop release mixing outdoor survival ideas with surreal, low-budget presentation. It is best treated as a niche experimental entry in the late 3DS catalog.",
  "3ds-hyper-paddle-block-rusher":
    "Hyper Paddle Block Rusher is a fast block-breaking game that pushes the familiar paddle-and-ball setup with speed, hazards, and arcade scoring. It belongs beside other compact 3DS eShop reflex games.",
  "3ds-hyperlight-ex":
    "Hyperlight EX is a neon arcade action game about charging through enemies at high speed while managing movement and risk. It is a stylish score-chaser with more energy than its small download size suggests.",
  "3ds-i-am-an-air-traffic-controller-airport-hero-hawaii":
    "I am an Air Traffic Controller: Airport Hero Hawaii puts players in the tower, directing takeoffs, landings, taxiing, and timing around a Hawaiian airport setting. It is a specialized aviation management puzzle for players who enjoy logistics pressure.",
  "3ds-i-am-an-air-traffic-controller-airport-hero-narita":
    "I am an Air Traffic Controller: Airport Hero Narita focuses the airport-management formula on Japan's Narita airport, with runway timing, route planning, and safe traffic flow. It is a niche but substantial simulation entry on 3DS.",
  "3ds-i-am-an-air-traffic-controller-airport-hero-osaka-kix":
    "I am an Air Traffic Controller: Airport Hero Osaka-Kix brings the series' air-traffic timing puzzles to Kansai International Airport. The game is about sequencing aircraft efficiently, not flying planes directly.",
  "3ds-i-love-my-cats":
    "I Love my Cats is a pet-care game about adopting cats, grooming them, playing simple mini-games, and building affection. It is a casual animal sim for younger players and pet-game collectors.",
  "3ds-i-love-my-dogs":
    "I Love my Dogs follows the same pet-care structure with dogs, focusing on feeding, grooming, play, and simple owner tasks. It occupies the lighter end of the 3DS animal-care library.",
  "3ds-i-love-my-horse":
    "I Love my Horse combines horse care, stable tasks, and riding activities into a gentle handheld simulation. It is aimed at players who want an approachable equestrian game rather than a demanding sports title.",
  "3ds-i-love-my-little-boy":
    "I Love my Little Boy is a childcare-themed simulation with simple care routines, dress-up, and family-life mini-games. It is part of Bigben's casual life-sim catalog on 3DS.",
  "3ds-i-love-my-little-girl":
    "I Love my Little Girl mirrors the childcare-sim structure with care tasks, dressing, and gentle mini-games built around a young child character. It is a niche family-simulation release.",
  "3ds-i-love-my-pets":
    "I Love my Pets broadens the pet-care format with multiple animals, simple care routines, and mini-games. It is designed as an accessible companion-animal sim for casual players.",
  "3ds-i-love-my-pony":
    "I Love my Pony focuses on pony care, grooming, feeding, and gentle riding-themed activities. It is a smaller equestrian pet sim alongside the system's more competition-focused horse games.",
  "3ds-i-f-o":
    "I.F.O is a retro-styled UFO shooter with tiny-screen arcade presentation, quick enemy waves, and score-focused play. It is notable for deliberately feeling like a lost LCD or early handheld game.",
  "3ds-i-ve-got-to-run-complete-edition":
    "I've Got to Run: Complete Edition collects the auto-running platform game's 3DS content into a fuller package of modes, hazards, and score goals. Its appeal is simple jumping rhythm and rapid retries.",
  "3ds-ice-station-z":
    "Ice Station Z is a survival game about scavenging, fighting off threats, crafting gear, and staying alive in a frozen open environment. Online play and its rough-edged ambition helped it stand out among late 3DS eShop releases.",
  "3ds-idol-time-pripara-yume-all-star-live":
    "Idol Time PriPara: Yume All-Star Live! adapts the idol arcade and anime brand into rhythm performances, character dressing, and colorful stage presentation. It is a Japan-focused release for fans of PriPara's music and fashion loop.",
  "3ds-ijin-bakutou-udeziman":
    "Ijin Bakutou!! Udeziman is a Takara Tomy release built around historical-figure caricatures, competitive battles, and toy-like presentation. It is a quirky import entry whose premise is more distinctive than its basic action systems.",
  "3ds-illvelo-dillinjah":
    "Illvelo Dillinjah brings Milestone-style shoot-'em-up weirdness to 3DS with abstract visuals, bullet patterns, and score systems. It is an import shooter for players who follow cult arcade developers.",
  "3ds-imagine-babyz":
    "Imagine: Babyz is Ubisoft's childcare simulation, asking players to care for babies through feeding, hygiene, play, and simple daily routines. It continues the Imagine line's focus on approachable life-role fantasy.",
  "3ds-imagine-champion-rider-3d":
    "Imagine: Champion Rider 3D combines horse care with riding competitions, training, and stable tasks. It gives Ubisoft's Imagine series an equestrian entry tailored to the 3DS screen.",
  "3ds-imagine-fashion-designer":
    "Imagine: Fashion Designer centers on styling outfits, coordinating looks, and working through fashion-career activities. It is a casual creativity game for players interested in clothing and presentation.",
  "3ds-imagine-fashion-life":
    "Imagine: Fashion Life expands the fashion fantasy with shopping, styling, modeling, and social-life activities around a boutique-flavored career. It is one of Ubisoft's broader lifestyle entries on 3DS.",
  "3ds-imomushi-wars":
    "Imomushi Wars is a strategy game about controlling caterpillar-like units across simple battlefields and using positioning to win. Its odd premise gives it more personality than a generic tactics label suggests.",
  "3ds-inazuma-eleven":
    "Inazuma Eleven on 3DS brings Level-5's soccer RPG formula to the handheld with scouting, team building, story progression, and special-move matches. It is a key entry point for the series in regions where Nintendo published it.",
  "3ds-inazuma-eleven-1-2-3-the-legend-of-mamoru-endou":
    "Inazuma Eleven 1, 2, 3!! The Legend of Mamoru Endou collects the early trilogy with upgraded 3DS presentation, letting players follow Mamoru Endou's soccer-RPG story across multiple campaigns. It is an important compilation for series collectors.",
  "3ds-inazuma-eleven-3-bomb-blast":
    "Inazuma Eleven 3: Bomb Blast sends the soccer-RPG cast into international competition with team recruiting, story chapters, and dramatic special moves. This version has roster and content differences that matter to series fans.",
  "3ds-inazuma-eleven-3-lightning-bolt":
    "Inazuma Eleven 3: Lightning Bolt is the counterpart version to Bomb Blast, keeping the same world-tournament soccer-RPG structure while changing key version-specific content. It is part of the series' paired-release collecting pattern.",
  "3ds-inazuma-eleven-3-team-ogre-attacks":
    "Inazuma Eleven 3: Team Ogre Attacks! is the enhanced third version of the Inazuma Eleven 3 storyline, adding Team Ogre content and extra scenario material. It is the fullest 3DS version of that arc.",
  "3ds-inazuma-eleven-everyday":
    "Inazuma Eleven Everyday is a small character-life spin-off focused on daily interactions with the soccer-RPG cast rather than full matches. It is a fan-oriented companion piece for players invested in the characters.",
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
if (!Array.isArray(games)) throw new Error("Run scripts/import-3ds-official-list.js first.");

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

console.log(`Seeded ${seeded} Nintendo 3DS editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
