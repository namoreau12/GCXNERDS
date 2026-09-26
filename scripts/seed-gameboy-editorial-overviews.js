const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "gameboy.json");
const manifestPath = path.join(rootDir, "data", "games", "gameboy-manifest.json");

const seeds = {
  "gb-tetris":
    "Tetris is the Game Boy's defining puzzle game, turning falling tetrominoes, simple controls, and escalating speed into a portable obsession. Its pack-in status in many regions helped sell the handheld and made it one of the most recognizable games ever released.",
  "gb-super-mario-land":
    "Super Mario Land brought Mario to Nintendo's handheld with compact stages, unusual enemies, submarine and airplane shooter sections, and Princess Daisy's debut in Sarasaland. Its odd personality and launch-era importance make it a core Game Boy collector title.",
  "gb-super-mario-land-2-6-golden-coins":
    "Super Mario Land 2: 6 Golden Coins gives the Game Boy a larger, more expressive Mario adventure with themed zones, improved visuals, and Wario's first appearance. It feels closer to a full console-style platformer than the original launch game.",
  "gb-wario-land-super-mario-land-3":
    "Wario Land: Super Mario Land 3 turns the series toward treasure hunting, shoulder charges, transformations, and greed-driven exploration. It introduced Wario as a playable lead and became the foundation for his own handheld platforming identity.",
  "gb-the-legend-of-zelda-link-s-awakening":
    "The Legend of Zelda: Link's Awakening brings a full Zelda adventure to Game Boy, sending Link through Koholint Island's dungeons, trading quests, strange characters, and dreamlike mystery. Its compact design and emotional ending made it one of the handheld's masterpieces.",
  "gbc-the-legend-of-zelda-link-s-awakening-dx":
    "The Legend of Zelda: Link's Awakening DX enhances the Game Boy classic with color, a new Color Dungeon, and photo-related additions. It remains one of the best ways to collect the original handheld version of Koholint Island.",
  "gbc-the-legend-of-zelda-oracle-of-ages":
    "The Legend of Zelda: Oracle of Ages emphasizes puzzles, time travel, and dungeon logic as Link moves between past and present in Labrynna. Linked with Oracle of Seasons, it forms one half of Capcom and Nintendo's ambitious paired Zelda experiment.",
  "gbc-the-legend-of-zelda-oracle-of-seasons":
    "The Legend of Zelda: Oracle of Seasons leans toward action and environmental changes, letting Link alter seasons to open paths, solve puzzles, and fight through Holodrum. Together with Oracle of Ages, it is one of Game Boy Color's major late-era releases.",
  "gb-pokemon-red-version":
    "Pokémon Red Version helped launch the monster-catching phenomenon, sending players through Kanto to collect creatures, battle trainers, trade with friends, and challenge the Pokémon League. Its link-cable trading and version exclusives made the cartridge feel social in a new way.",
  "gb-pokemon-blue-version":
    "Pokémon Blue Version pairs with Red as one of the original Kanto adventures, built around collecting, battling, trading, and raising a team through gyms and the Elite Four. Its version-exclusive Pokémon made it central to the Game Boy's multiplayer culture.",
  "gb-pokemon-yellow-version-special-pikachu-edition":
    "Pokémon Yellow Version: Special Pikachu Edition revisits Kanto with Pikachu following the player, anime-inspired encounters, and tweaks that make it feel distinct from Red and Blue. It became a favorite bridge between the games and the TV phenomenon.",
  "gbc-pokemon-gold-version":
    "Pokémon Gold Version expands the series with the Johto region, day-night cycles, breeding, held items, new types, and a surprise return to Kanto. It turned Pokémon from a breakout hit into a deeper long-term RPG series.",
  "gbc-pokemon-silver-version":
    "Pokémon Silver Version shares Gold's expanded Johto adventure while offering its own version-exclusive Pokémon and legendary focus. Its two-region structure and added systems made it one of Game Boy Color's most important RPGs.",
  "gbc-pokemon-crystal-version":
    "Pokémon Crystal Version refines Gold and Silver with animated battle sprites, Suicune-focused story changes, the Battle Tower, and the option to play as a female trainer. It is the most feature-rich original Game Boy Color Johto release.",
  "gbc-pokemon-trading-card-game":
    "Pokémon Trading Card Game adapts the card game into a compact RPG, letting players build decks, challenge club masters, and collect booster packs through battles. It remains a natural bridge between the site's game and card collecting sides.",
  "gb-kirby-s-dream-land":
    "Kirby's Dream Land introduces Kirby in a short, charming Game Boy platformer built around floating, inhaling enemies, and simple approachable stages. It established the character before copy abilities became the series' main hook.",
  "gb-kirby-s-dream-land-2":
    "Kirby's Dream Land 2 expands the handheld series with animal friends, copy abilities, hidden Rainbow Drops, and a larger adventure across Dream Land. It is one of the Game Boy's strongest late platformers.",
  "gb-kirby-s-pinball-land":
    "Kirby's Pinball Land turns Kirby into the ball across themed pinball tables, boss fights, and bonus rooms. Its playful use of the character makes it one of the Game Boy's more memorable arcade-style spinoffs.",
  "gb-metroid-ii-return-of-samus":
    "Metroid II: Return of Samus sends Samus into SR388 to hunt the Metroids through a darker, more linear handheld adventure. Its creature evolutions, lonely atmosphere, and importance to the series timeline make it a key Game Boy title.",
  "gb-donkey-kong":
    "Donkey Kong starts as an arcade-style rescue game before expanding into a much larger puzzle-platform adventure full of acrobatics, keys, switches, and clever stage design. It is one of the Game Boy's best examples of doing more than expected with a familiar name.",
  "gb-donkey-kong-land":
    "Donkey Kong Land translates Rare's pre-rendered Donkey Kong Country style into a separate handheld platformer with its own stages, enemies, and challenges. It is a major piece of Game Boy's mid-1990s platform library.",
  "gbc-super-mario-bros-deluxe":
    "Super Mario Bros. Deluxe brings the NES classic to Game Boy Color with map screens, challenges, records, extras, and a portable version of The Lost Levels content. It became one of the system's essential retro reissues.",
  "gbc-wario-land-3":
    "Wario Land 3 builds a puzzle-heavy platform adventure around transformations, treasure, and revisiting levels with new abilities. Its dense structure and clever item gates make it one of Game Boy Color's best original platformers.",
  "gbc-shantae":
    "Shantae is a late Game Boy Color action-adventure known for expressive animation, transformation dances, interconnected areas, and unusually polished presentation. Its small print run and series legacy make it one of the platform's most famous collector targets.",
  "gbc-metal-gear-solid":
    "Metal Gear Solid, also known as Metal Gear: Ghost Babel in Japan, brings tactical stealth to Game Boy Color with tight top-down infiltration, gadgets, guards, and mission structure. It is one of the handheld's most technically impressive licensed releases.",
  "gbc-dragon-warrior-monsters":
    "Dragon Warrior Monsters turns the Dragon Quest universe into a monster-breeding RPG built around recruiting, fusing, and battling creatures. Its systems gave Game Boy Color collectors another deep monster-focused adventure beyond Pokémon.",
  "gbc-dragon-warrior-iii":
    "Dragon Warrior III on Game Boy Color is a feature-rich portable version of the classic RPG, with party creation, vocation changes, added content, and color presentation. It is one of the system's most substantial role-playing games.",
  "gbc-harvest-moon-2-gbc":
    "Harvest Moon 2 GBC expands handheld farming with crops, animals, seasons, town routines, and long-term land management. Its slower pace and collectible appeal make it a notable Game Boy Color life-sim entry.",
  "gbc-mario-tennis":
    "Mario Tennis for Game Boy Color combines sports action with an RPG-style academy mode, character growth, and link features with the Nintendo 64 version. It is one of Camelot's standout handheld sports RPGs.",
  "gbc-mario-golf":
    "Mario Golf for Game Boy Color mixes accessible golf mechanics with RPG progression, training, rivals, and character improvement. Its single-player structure gives it more depth than a simple sports conversion.",
  "gb-3-pun-yoso-umaban-club":
    "3-Pun Yoso Umaban Club is a horse-racing prediction and betting simulation from Hect, built around reading race information and making quick calls rather than riding or arcade racing. It is a niche Japanese Game Boy release for collectors interested in gambling-adjacent simulation software.",
  "gb-aa-harimanada":
    "Aa Harimanada adapts Kei Sadayasu's sumo manga into a Game Boy title centered on ring competition and the larger-than-life presence of its title wrestler. It is most useful to collectors as a licensed sports and manga crossover rather than a broad RPG adventure.",
  "gb-akazukin-cha-cha":
    "Akazukin Cha Cha brings the magical-comedy manga and anime to Game Boy with a character-driven adventure built around Chacha and her friends. The appeal is strongest for import collectors following 1990s Japanese licensed handheld games tied to TV and magazine properties.",
  "gbc-alfred-s-adventure":
    "Alfred's Adventure is a Game Boy Color platform adventure starring Alfred Chicken, mixing side-scrolling stages, collectibles, and light puzzle routes. It belongs beside the earlier Alfred Chicken releases as a late handheld entry with brighter color presentation.",
  "gbc-all-star-tennis-2000":
    "All Star Tennis 2000 brings console-style tennis to Game Boy Color with singles and doubles play, recognizable player caricatures, and quick tournament structure. It is a sports-library entry for collectors tracking how late-1990s tennis games were adapted to handheld limits.",
  "gb-amazing-penguin":
    "Amazing Penguin is an isometric action-puzzle game where players paint paths, avoid enemies, and clear each stage through route planning. It is one of the Game Boy's more distinctive early puzzle releases because it relies on spatial control rather than falling-block rules.",
  "gb-america-odan-ultra-quiz":
    "America Odan Ultra Quiz adapts the Japanese television quiz-show format into a Game Boy trivia and travel challenge. Its collector interest comes from being a localized media-event game rather than a conventional action or puzzle release.",
  "gb-america-odan-ultra-quiz-part-2":
    "America Odan Ultra Quiz Part 2 continues the quiz-show formula with more trivia rounds, staged progression, and TV-style competition built for short handheld sessions. It should be tracked separately from the first game because the series received multiple numbered Game Boy entries.",
  "gb-america-odan-ultra-quiz-part-3":
    "America Odan Ultra Quiz Part 3 is another Game Boy entry in Tomy's quiz-show line, built around answering questions and advancing through a themed contest structure. It is mainly important for collectors assembling the full Ultra Quiz handheld run.",
  "gb-america-odan-ultra-quiz-part-4":
    "America Odan Ultra Quiz Part 4 extends the Game Boy quiz series with another set of trivia challenges and event-style progression. As a late numbered entry, it helps show how strongly Japanese TV formats fed into portable game libraries.",
  "gb-amida":
    "Amida is a Game Boy puzzle game based on amidakuji-style ladder logic, asking players to read branching paths and route outcomes correctly. It is a compact import curiosity built around a culturally familiar pen-and-paper puzzle format.",
  "gb-animal-breeder":
    "Animal Breeder is a Game Boy raising simulation about caring for, training, and managing animals over time. Its value in the library is as an early portable life-management game aimed at routine, growth, and collection rather than combat.",
  "gb-animal-breeder-2":
    "Animal Breeder 2 follows the same care-and-growth simulation idea with additional scenarios and refinement for players who enjoyed the first game. It should be listed as its own entry because the numbered sequel represents a separate step in J-Wing's handheld sim line.",
  "gbc-animal-breeder-3":
    "Animal Breeder 3 moves the raising-simulation series onto Game Boy Color, giving the pet-care loop a brighter presentation and another roster of management goals. It is a niche import title for collectors following handheld simulation games before the genre became more mainstream.",
  "gbc-animal-breeder-4":
    "Animal Breeder 4 continues the Game Boy Color branch of J-Wing's raising-sim series, centered on care routines, progression, and collection. For collectors, the key is distinguishing the numbered releases because their names are similar and easy to blur together.",
  "gbc-animastar-gb":
    "Animastar GB is a creature-raising and battling game tied to the late-1990s wave of monster-training handhelds. It focuses on nurturing competitors and entering contests, making it a useful comparison point for collectors studying the post-Pokemon market.",
  "gbc-animorphs":
    "Animorphs adapts the book and TV franchise into a Game Boy Color adventure about teenagers using morphing powers against the Yeerk threat. It is a licensed handheld curiosity where the hook is the transformation premise more than mechanical polish.",
  "gbc-antz-world-sportz":
    "Antz World Sportz uses the animated-film license for a collection of small sports and challenge events on Game Boy Color. It fits the library as a family-oriented licensed minigame release rather than a direct retelling of the movie.",
  "gbc-aqualife":
    "AquaLife is a Game Boy Color aquarium simulation built around collecting, caring for, and observing aquatic life. It stands out as a quiet management title for players interested in collection and maintenance loops rather than competition.",
  "gb-aretha-ii":
    "Aretha II is a Japanese fantasy RPG with party battles, town-to-town progression, and a traditional quest structure. It continues a Game Boy RPG line that is less familiar outside Japan but important for import collectors mapping the handheld's role-playing catalog.",
  "gb-aretha-iii":
    "Aretha III continues the Game Boy RPG series with another fantasy campaign built around exploration, turn-based encounters, and character growth. It should be cataloged separately from Aretha II because the similar naming can hide a distinct sequel entry.",
  "gbc-arthur-s-absolutely-fun-day":
    "Arthur's Absolutely Fun Day turns the children's-book and TV license into a set of simple errands, minigames, and neighborhood activities for younger Game Boy Color players. It is a clear example of the system's educational and family-license catalog.",
  "gbc-asterix-and-obelix":
    "Asterix & Obelix brings the French comic heroes to Game Boy Color with side-scrolling action, slapstick combat, and locations drawn from the long-running series. It is useful for collectors because European comic licenses often had different regional visibility than U.S. releases.",
  "gbc-asterix-search-for-dogmatix":
    "Asterix: Search for Dogmatix is a Game Boy Color platform adventure built around finding Dogmatix while moving through comic-style stages. It is a separate Asterix handheld release and should not be merged with the broader Asterix & Obelix entry.",
  "gb-asteroids":
    "Asteroids on Game Boy adapts Atari's arcade classic into portable form, keeping the core loop of rotating, thrusting, shooting rocks, and chasing high scores. Its importance is as part of the system's wave of arcade conversions rather than a new franchise chapter.",
  "gbc-asteroids":
    "Asteroids for Game Boy Color revisits Atari's arcade shooter with color presentation and handheld score-chasing. Collectors should distinguish it from the monochrome Game Boy Asteroids release because both can appear under nearly identical listing names.",
  "gbc-austin-powers-oh-behave":
    "Austin Powers: Oh, Behave! turns the spy-comedy license into a Game Boy Color package of minigames, parody interfaces, and small adventure-style activities. It is more of a novelty licensed release from Rockstar's handheld era than a conventional story adventure.",
  "gbc-austin-powers-welcome-to-my-underground-lair":
    "Austin Powers: Welcome to My Underground Lair! is the companion Game Boy Color Austin Powers release, built around themed activities, joke software, and light mission structure. It should be cataloged separately from Oh, Behave! because the two cartridges use different character branding.",
  "gbc-azarashi-sentai-inazuma-doki-doki-daisakusen":
    "Azarashi Sentai Inazuma: Doki Doki Daisakusen!? is a Japanese Game Boy Color adventure tied to Omega Products' character property, with simple exploration and story progression aimed at younger players. Its value is mostly as a regional import curiosity with a very specific title.",
  "gbc-b-daman-bakugaiden-v-final-mega-tune":
    "B-Daman Bakugaiden V: Final Mega Tune adapts the B-Daman toy and anime line into a Game Boy Color action release centered on small battles, character progression, and franchise-specific scenarios. It is a licensed import entry where the Bakugaiden V branding matters.",
  "gbc-b-daman-bakugaiden-victory-e-no-michi":
    "B-Daman Bakugaiden: Victory e no Michi is a Game Boy Color entry in the B-Daman Bakugaiden line, using puzzle and adventure elements around the toy-anime cast. It should be separated from Final Mega Tune because the subtitle marks a distinct handheld release.",
  "gbc-baby-felix-halloween":
    "Baby Felix: Halloween is a European Game Boy Color platformer starring the Felix character in a seasonal side-scrolling adventure. It is a licensed late-handheld release where the Halloween theme and regional packaging are the key identifiers.",
  "gbc-bad-batsumaru-robo-battle":
    "Bad Batsumaru: Robo Battle brings the Sanrio character to Game Boy Color with robot-themed action and light platforming structure. It stands out as a character-license import rather than a general platform game, especially for Sanrio collectors.",
  "gb-bakenou-tv-94":
    "Bakenou TV '94 is a Game Boy horse-racing prediction and quiz-style release from Asmik, built around reading race information rather than riding. It belongs with Japan's betting-adjacent handheld simulations and is most useful when cataloged by exact year.",
  "gb-bakenou-v3":
    "Bakenou V3 continues the Bakenou horse-racing prediction format with more race-analysis and wagering-style decision making. It is a niche Japanese simulation where series version, publisher, and complete packaging matter more than action mechanics.",
  "gb-bakuchou-retrieve-master":
    "Bakuchou Retrieve Master is a Konami fishing-themed Game Boy release focused on lures, catches, and outdoor hobby progression. It should be treated as a fishing title, not a generic sports record, because the appeal is in equipment choice and catch conditions.",
  "gb-bakuchou-retsuden-shou-hyper-fishing":
    "Bakuchou Retsuden Shou: Hyper Fishing is a Starfish Game Boy fishing title built around selecting tackle, reading fishing spots, and landing catches in short portable sessions. It is a hobby-sim import with a clear fishing identity.",
  "gbc-bakukyuu-renpatsu-super-b-daman-gekitan-rising-valkyrie":
    "Bakukyuu Renpatsu!! Super B-Daman: Gekitan! Rising Valkyrie! adapts Takara's marble-shooting toy franchise into a Game Boy Color action game with character battles and series-specific mechanics. The long subtitle is essential for distinguishing it from other B-Daman releases.",
  "gbc-bakusou-dekotora-densetsu-gb-special-otoko-dokyou-no-tenka-touitsu":
    "Bakusou Dekotora Densetsu GB Special: Otoko Dokyou no Tenka Touitsu brings the decorated-truck racing series to Game Boy Color, emphasizing flashy trucks, road events, and Japanese trucking culture. It is a distinctive import racing title rather than a generic driving game.",
  "gbc-balloon-fight-gb":
    "Balloon Fight GB is the Game Boy Color release of Balloon Kid, reviving Nintendo's balloon-floating platform formula with color-era presentation. It is important to catalog against Balloon Kid because regional names and platform labels can blur the same lineage.",
  "gb-balloon-kid":
    "Balloon Kid expands the Balloon Fight concept into a scrolling Game Boy platform adventure about floating, avoiding hazards, and navigating airborne stages. It is one of Nintendo's notable early handheld sequels to an NES-era idea.",
  "gb-banishing-racer":
    "Banishing Racer is a Jaleco Game Boy platformer starring a living car, mixing side-scrolling jumps, enemy avoidance, and vehicle-themed stage design. Despite the title, it plays closer to character platforming than normal racing.",
  "gbc-barcode-taisen-bardigun":
    "Barcode Taisen Bardigun is a Game Boy Color battle game connected to barcode-scanning toy culture, with monster-like competitors generated and used in fights. Its collector appeal comes from that barcode-battle hook and Tamsoft/Graphic Research import context.",
  "gb-bass-fishing-tatsujin-techou":
    "Bass Fishing Tatsujin Techou is a Game Boy fishing title focused on bass angling, lure selection, and reading conditions. It is a compact hobby simulation where the useful buyer-facing detail is the fishing format, not a broad sports label.",
  "gbc-bass-masters-classic":
    "Bass Masters Classic brings licensed bass fishing to Game Boy Color with tournament-style catches, lure choices, and portable angling routines. It is a Natsume-developed fishing entry for collectors comparing handheld outdoor-sports games.",
  "gb-battle-crusher":
    "Battle Crusher is a Banpresto Game Boy fighting/action release tied to super-deformed hero crossover energy, with compact battles and character matchups. It is mainly an import collector record for fans of Banpresto's licensed handheld catalog.",
  "gb-battle-dodge-ball":
    "Battle Dodge Ball turns Banpresto's Compati Hero crossover characters into a dodgeball game, mixing team sports with exaggerated special moves. It should be grouped with character sports releases rather than standard one-on-one fighting games.",
  "gb-battle-of-kingdom":
    "Battle of Kingdom is a Game Boy strategy RPG from Lenar and Meldac, built around fantasy battles, unit decisions, and campaign progression. It is a lesser-known import tactics title where exact publisher and title matching help collectors.",
  "gb-battle-space":
    "Battle Space is a Namco Game Boy strategy release about planning moves, managing conflict, and working through compact battlefield scenarios. It sits in the system's quieter turn-based import shelf rather than its arcade-action catalog.",
  "gbc-battleship":
    "Battleship adapts the classic hidden-grid board game to Game Boy Color, focusing on ship placement, deduction, and turn-based attacks. It is a straightforward tabletop conversion where the familiar license is the selling point.",
  "gbc-beatmania-gb":
    "Beatmania GB brings Konami's DJ rhythm game to Game Boy with note timing, song charts, and portable music-game structure. It is a key handheld branch of the Beatmania line despite the hardware's limited audio and display.",
  "gbc-beatmania-gb-gotchamix-2":
    "Beatmania GB: GotchaMix 2 is a later Game Boy Color rhythm entry with more song material and timing charts for fans of Konami's music-game series. It should be separated from Beatmania GB and GB2 because each release has its own track identity.",
  "gbc-beatmania-gb2-gotchamix":
    "Beatmania GB2: GotchaMix expands the portable Beatmania format with another set of songs, charts, and DJ-style rhythm play. The GotchaMix subtitle is the key collector detail when comparing the Game Boy Beatmania releases.",
  "gb-beavis-and-butt-head":
    "Beavis and Butt-head on Game Boy adapts the MTV license into a crude comedy adventure with item hunting, simple hazards, and character gags. It is a 1990s licensed oddity where tone and branding matter more than mechanical polish.",
  "gbc-benjamin-blumchen-ein-verruckter-tag-im-zoo":
    "Benjamin Blumchen: Ein Verruckter Tag im Zoo is a German children's-license Game Boy Color adventure built around simple zoo-themed tasks and approachable play. Language, Kiddinx branding, and regional packaging are the important collector details.",
  "gbc-bibi-blocksberg-im-bann-der-hexenkugel":
    "Bibi Blocksberg: Im Bann Der Hexenkugel adapts the German witch character into a Game Boy Color adventure with light puzzles and story tasks. It belongs with the system's European children's-media releases rather than broad fantasy games.",
  "gbc-bibi-und-tina-fohlen-felix-in-gefahr":
    "Bibi und Tina: Fohlen Felix in Gefahr is a Game Boy Color adventure tied to the German horse-riding audio and TV property, focused on simple story progression and young-player objectives. The license and regional context are the main draw.",
  "gbc-bikkuriman-2000-charging-card-gb":
    "Bikkuriman 2000: Charging Card GB turns the sticker/card collecting franchise into a Game Boy Color game with collecting, battles, and character progression. The physical collectible brand is central to its identity, making it especially interesting for card-and-game collectors.",
  "gb-bionic-battler":
    "Bionic Battler is a Game Boy strategy/puzzle battle game about assembling or commanding mechanical fighters through compact encounters. It is a lesser-known import release where the robotic combat premise gives it a clearer identity than generic puzzle metadata.",
  "gb-bishoujo-senshi-sailor-moon":
    "Bishoujo Senshi Sailor Moon brings the anime series to Game Boy with character-driven adventure structure, simple action beats, and story material for fans. It is a licensed import title where the Sailor Moon branding is the primary appeal.",
  "gb-bishoujo-senshi-sailor-moon-r":
    "Bishoujo Senshi Sailor Moon R follows the anime's R-era branding with another handheld adventure for fans of the series. It should be tracked separately from the first Sailor Moon Game Boy release because the sequel-era identity matters to collectors.",
  "gbc-black-bass-lure-fishing":
    "Black Bass: Lure Fishing is a Hot-B fishing game for Game Boy Color, centered on choosing lures, reading water conditions, and landing bass in portable sessions. It belongs with handheld hobby simulations rather than generic sports games.",
  "gbc-blade":
    "Blade on Game Boy Color adapts the Marvel vampire-hunter film into a side-scrolling action game with handheld combat, platforming, and licensed character presentation. It is mainly relevant as an Activision-era Marvel tie-in and should be separated from later Blade console releases.",
  "gb-block-kuzushi-gb":
    "Block Kuzushi GB is a Game Boy brick-breaking puzzle game in the Arkanoid tradition, focused on paddle control, ball angles, and clearing stage layouts. It is a straightforward import puzzle release where the Japanese title tells players exactly what kind of play to expect.",
  "gbc-blue-s-clues-blue-s-alphabet-book":
    "Blue's Clues: Blue's Alphabet Book is a Game Boy Color preschool learning game built around letters, simple activities, and the Nickelodeon license. Vicarious Visions' handheld version is education software first, aimed at very young players rather than platforming fans.",
  "gb-bo-jackson-two-games-in-one":
    "Bo Jackson: Two Games In One packages football and baseball around Bo Jackson's two-sport celebrity appeal. It is an early Game Boy sports release where the novelty is the dual-sport format rather than a deep simulation of either game.",
  "gbc-bob-et-bobette-les-dompteurs-du-temps":
    "Bob et Bobette: Les Dompteurs du Temps adapts the Belgian Suske en Wiske/Bob et Bobette comic property into a Game Boy Color adventure. It is a regional European licensed title where language, comic branding, and Engine Software's handheld work are the key identifiers.",
  "gb-boggle-plus":
    "Boggle Plus brings the Parker Brothers word game to Game Boy with grid-based letter searching and portable vocabulary play. It is a tabletop adaptation where the familiar Boggle rules are the main appeal.",
  "gbc-boku-no-camp-jou":
    "Boku no Camp Jou is a Japan-only Game Boy Color camping simulation about outdoor routines, campsite activities, and relaxed hobby play. It sits with the handheld's slice-of-life imports rather than action adventures.",
  "gb-booby-boys":
    "Booby Boys is a Nichibutsu Game Boy action-puzzle release about navigating compact stages, avoiding hazards, and clearing objectives. It is an obscure import where publisher lineage and exact title spelling are especially useful for collectors.",
  "gbc-bouken-dondoko-shima":
    "Bouken! Dondoko Shima is a Game Boy Color adventure from Global A and D-1000 Project with island exploration, character tasks, and family-friendly pacing. It is a niche Japanese release whose title and publisher details do most of the catalog work.",
  "gb-brain-drain":
    "Brain Drain is a Game Boy puzzle game from Visual Impact about manipulating brainteaser-style stage rules and clearing increasingly tricky layouts. It belongs with late Game Boy logic titles rather than action or arcade releases.",
  "gb-brainbender":
    "Brainbender is a Gremlin Graphics puzzle game built around shape logic, maze-like challenges, and compact handheld brainteasers. It is an early Game Boy puzzle release where regional publisher credits help identify the correct version.",
  "gbc-brave-saga-shinshou-astaria":
    "Brave Saga Shinshou Astaria brings Takara's Brave robot franchise to Game Boy Color with RPG-style progression, character events, and mecha-series fan appeal. It is a licensed import for collectors tracking Brave Saga beyond home consoles.",
  "gb-breakthru":
    "BreakThru! adapts the tile-clearing puzzle game to Game Boy, asking players to remove matching blocks and plan around gravity and board layout. It is a portable version of a familiar 1990s puzzle format.",
  "gbc-bugs-bunny-crazy-castle-3":
    "Bugs Bunny: Crazy Castle 3 continues Kemco's maze-puzzle platform series with Warner Bros. characters, door-and-item routing, and enemy avoidance. It is notable because the Crazy Castle line changes names and characters across regions.",
  "gb-burai-fighter-deluxe":
    "Burai Fighter Deluxe is a Game Boy version of KID's multidirectional shooter, built around flying through stages, aiming in multiple directions, and upgrading firepower. It is one of the handheld's stronger early shooter conversions.",
  "gbc-burger-burger-pocket-hamburger-simulation":
    "Burger Burger Pocket: Hamburger Simulation turns restaurant planning into a Game Boy Color management game, with menu creation, business choices, and burger-shop growth. It is a pocket version of the Burger Burger simulation concept rather than a cooking minigame collection.",
  "gbc-burger-paradise-international":
    "Burger Paradise International is a Game Boy Color restaurant management simulation about running burger shops, building menus, and competing in a food-business setting. It is a follow-up for players interested in Japanese business sims on handheld hardware.",
  "gb-burning-paper":
    "Burning Paper is a Game Boy arcade action game about cutting or clearing paper-like spaces while avoiding enemies and hazards. It is an unusual Pixel-developed import whose simple premise makes more sense when framed as arcade score play.",
  "gb-buster-brothers":
    "Buster Brothers brings Capcom's Pang-style bubble-bursting arcade action to Game Boy, with players firing upward to split bouncing bubbles while dodging their paths. It is a portable version of a recognizable arcade formula.",
  "gbc-buzz-lightyear-of-star-command":
    "Buzz Lightyear of Star Command adapts Disney and Pixar's animated TV spin-off into a Game Boy Color action platformer with mission stages and licensed character presentation. It is mainly a Traveller's Tales handheld tie-in for Toy Story-era collectors.",
  "gb-caesars-palace":
    "Caesars Palace on Game Boy recreates casino table and machine games under the famous Las Vegas resort license. It is a straightforward portable gambling-game package where regional publisher differences matter for collectors.",
  "gbc-caesars-palace-ii":
    "Caesars Palace II updates the casino compilation format for Game Boy Color with card, table, and machine-style gambling games. It is a later handheld casino release tied to the Interplay and RuneCraft catalog.",
  "gb-capcom-quiz-hatena-no-daibouken":
    "Capcom Quiz: Hatena? no Daibouken brings Capcom's quiz-game format to Game Boy with trivia questions, characterful presentation, and Japanese-language play. It is a language-dependent import where the Capcom branding is the key draw.",
  "gb-captain-tsubasa-j-zenkoku-seiha-heno-chousen":
    "Captain Tsubasa J: Zenkoku Seiha Heno Chousen adapts the soccer anime's J-era storyline to Game Boy with character teams, dramatic soccer action, and licensed presentation. It is a fan-focused Bandai release rather than a realistic soccer sim.",
  "gb-captain-tsubasa-vs":
    "Captain Tsubasa VS is Tecmo's Game Boy take on the anime soccer series, mixing match play with character-driven special moves and story flavor. It is an important handheld entry for collectors following Captain Tsubasa's game lineage.",
  "gb-card-game":
    "Card Game is a Coconuts Japan Game Boy release focused on traditional card-game play in a compact portable package. Its plain title makes publisher, platform, and region especially important for accurate cataloging.",
  "gbc-cardcaptor-sakura-itsumo-sakura-chan-to-issho":
    "Cardcaptor Sakura: Itsumo Sakura-chan to Issho! is a Game Boy Color/Game Boy release built around the anime's cast, light activities, and fan-oriented interaction with Sakura. It is a licensed import where the Cardcaptor Sakura subtitle is the main selling point.",
  "gbc-cardcaptor-sakura-tomoeda-shougakkou-daiundoukai":
    "Cardcaptor Sakura: Tomoeda Shougakkou Daiundoukai turns the series' school setting into a sports-festival themed Game Boy Color release with minigames and character events. It should be separated from Itsumo Sakura-chan to Issho because the premise and subtitle are distinct.",
  "gb-casino-funpak":
    "Casino FunPak is a Beam Software casino collection for Game Boy, bundling portable versions of familiar gambling and card games. It is a compact Interplay release for players who wanted quick table-game sessions on handheld hardware.",
  "gb-casper":
    "Casper on Game Boy adapts the friendly ghost license into a handheld adventure with simple exploration, item use, and light puzzle progression. It is a 1990s film-license release and should be distinguished from the later Game Boy Color version.",
  "gbc-casper":
    "Casper for Game Boy Color is a separate Interplay-published handheld adaptation with color presentation, light adventure structure, and family-friendly licensed content. Its G3 Interactive credit and GBC platform separate it from the earlier monochrome Game Boy release.",
  "gb-castle-quest":
    "Castle Quest is a Hudson-published Game Boy strategy board game about moving fantasy pieces, planning attacks, and controlling a castle-themed battlefield. It plays closer to chess-like tactics than to a platform adventure.",
  "gbc-catwoman":
    "Catwoman on Game Boy Color is a Kemco action game tied to the DC character, with side-scrolling stages, combat, and stealthy superhero presentation. It is a licensed handheld release from the late GBC era.",
  "gbc-catz":
    "Catz brings the virtual pet brand to Game Boy Color with pet care, interaction routines, and simple animal-raising activities. It is a lifestyle simulation for younger players and collectors of late-1990s pet software.",
  "gb-cave-noire":
    "Cave Noire is a Konami Game Boy roguelike built around short dungeon quests, randomized layouts, turn-based movement, and compact survival goals. It is one of the platform's more interesting Japan-only dungeon crawlers.",
  "gb-centipede":
    "Centipede on Game Boy adapts Atari's arcade shooter with bug-blasting lanes, mushrooms, and score-focused survival play. Multiple Game Boy-era releases share the name, so publisher and platform details are important when checking a copy.",
  "gbc-centipede":
    "Centipede for Game Boy Color updates Atari's arcade bug shooter with color support and late-handheld presentation. It is separate from earlier monochrome Game Boy listings and should be cataloged by its Majesco/Accolade context.",
  "gb-chacha-maru-panic":
    "Chacha-Maru Panic is a Human Entertainment Game Boy action-puzzle release connected to the Ninja JaJaMaru-style Chacha-Maru character lineage. It is an import curiosity where character identity is more useful than broad genre labels.",
  "gb-chachamaru-boukenki-3-abyss-no-tou":
    "Chachamaru Boukenki 3: Abyss no Tou is a Game Boy adventure entry in the Chachamaru line, with dungeon-like progression and compact character action. The numbered subtitle matters because several related Chachamaru releases exist.",
  "gb-chalvo-55":
    "Chalvo 55 is a Japan System Supply Game Boy platformer starring a transforming robot ball, combining jumping, rolling, and puzzle-like stage navigation. It is a cult import connected to the cancelled Virtual Boy project Bound High.",
  "gbc-checkmate":
    "Checkmate is an Altron Game Boy Color/Game Boy board-game release centered on chess-style strategy and portable matches. It is a small import listing where the exact title and compatibility details help separate it from generic chess software.",
  "gbc-chessmaster":
    "Chessmaster brings the long-running computer chess series to Game Boy Color with portable board play, CPU opponents, and classic chess fundamentals. It is a straightforward strategy release, valuable because it gives handheld collectors a recognizable chess brand rather than an anonymous board-game entry.",
  "gbc-chi-to-ase-to-namida-no-koukou-yakyuu":
    "Chi to Ase to Namida no Koukou Yakyuu is a J-Wing high-school baseball game for Game Boy Color. The title frames the game around school baseball drama and competition, making it a Japan-only sports entry where theme and exact romanization matter more than broad genre labels.",
  "gb-chibi-maruko-chan-4-korega-nihon-dayo-ouji-sama":
    "Chibi Maruko Chan 4: Korega Nihon Dayo Ouji Sama is a Takara and KID handheld entry based on the long-running slice-of-life manga and anime. It is best understood as a licensed character adventure for fans, with appeal rooted in Maruko's world rather than action complexity.",
  "gb-chibi-maruko-chan-maruko-deluxe-gekijou":
    "Chibi Maruko Chan: Maruko Deluxe Gekijou brings the Chibi Maruko-chan license to Game Boy in a compact character-game format. It sits with early handheld anime tie-ins, where story flavor, familiar cast moments, and Japanese packaging are the main reasons collectors track it.",
  "gb-chibi-maruko-chan-okozukai-daisakusen":
    "Chibi Maruko Chan: Okozukai Daisakusen is a Game Boy character adventure built around Maruko's allowance-themed premise and family-comedy tone. It should be cataloged as a licensed Chibi Maruko-chan release rather than a generic adventure title.",
  "gb-chibi-maruko-chan-2-deluxe-maruko-world":
    "Chibi Maruko-Chan 2: Deluxe Maruko World continues Takara and KID's Game Boy treatment of the anime series with more character-focused scenes and light handheld activities. The sequel number is important because several Maruko Game Boy titles have very similar names.",
  "gb-chibi-maruko-chan-3-mezase-game-taishou-no-maki":
    "Chibi Maruko-Chan 3: Mezase! Game Taishou no Maki is another Game Boy entry in Takara's licensed Maruko line, using a game-award themed subtitle to separate it from the other volumes. It is a fan and import-collector title first, not a broad adventure benchmark.",
  "gbc-chibi-maruko-chan-go-chounai-minna-de-game-da-yo":
    "Chibi Maruko-chan: Go Chounai Minna de Game Da Yo! brings the series to Game Boy Color with neighborhood-themed character play and family-friendly presentation. Epoch's credit and the Color platform distinguish it from the earlier monochrome Takara releases.",
  "gb-chiki-chiki-machine-mo-race":
    "Chiki Chiki Machine Mō Race is the Japanese Game Boy adaptation of Wacky Races, using the Hanna-Barbera cartoon's chaotic vehicle cast as its hook. It should be framed as a licensed cartoon racer rather than a generic driving game.",
  "gb-chiki-chiki-tengoku":
    "Chiki Chiki Tengoku is a J-Wing Game Boy platformer with lighthearted Japanese character-game energy and compact stage play. It is a lower-profile import release where the publisher and title identity help explain why it sits apart from the system's better-known platformers.",
  "gbc-choro-q-hyper-gb":
    "Choro Q Hyper GB turns Takara's toy-car brand into a Game Boy Color racer, focusing on small vehicles, collectible car appeal, and portable track competition. The Choro Q license is the key context, since it connects the game to a larger toy and racing-game line.",
  "gbc-chou-gals-kotobuki-ran":
    "Chou Gals! Kotobuki Ran adapts the fashion and youth-culture manga/anime property into a Game Boy Color character game. Its draw is the licensed Shibuya-gal identity and Konami publishing credit, not a traditional simulation-management loop.",
  "gb-chou-majin-eiyuuden-wataru-mazekko-monster":
    "Chou Majin Eiyuuden: Wataru Mazekko Monster is a Banpresto Game Boy release tied to the Mashin Hero Wataru franchise, with monster-raising and role-playing flavor around the anime's fantasy world. It is a fan-focused licensed import rather than a plain action game.",
  "gb-chou-majin-eiyuuden-wataru-mazekko-monster-2":
    "Chou Majin Eiyuuden: Wataru Mazekko Monster 2 continues the Wataru Mazekko Monster handheld line with another monster-focused adventure for series fans. The sequel label matters because both Game Boy entries share similar branding and can be easy to confuse.",
  "gb-chousoku-spinner":
    "Chousoku Spinner is a Hudson Soft Game Boy game built around competitive yo-yo/spinning-toy culture rather than a conventional field sport. It belongs with late-1990s hobby-anime and toy-driven handheld releases, where the real hook is the licensed competition fad.",
  "gb-collection-pocket":
    "Collection Pocket is a Naxat Soft Game Boy release centered on collecting and organizing items or data in a compact handheld format. Its plain English title makes context important: it is a small import curiosity, not a compilation cartridge.",
  "gbc-columns-gb-tezuka-ozamu-characters":
    "Columns GB: Tezuka Ozamu Characters combines Sega's falling-jewel puzzle formula with characters from Osamu Tezuka's manga universe. That crossover identity is the main reason the Game Boy Color version stands out from ordinary Columns ports.",
  "gbc-command-master":
    "Command Master is an Enix-published Game Boy Color strategy title built around command selection, card-like planning, and battle decisions. It sits in the handheld's RPG-adjacent strategy shelf and deserves more context than a generic puzzle label.",
  "gb-cool-ball":
    "Cool Ball is the Game Boy release of Pop Up, a puzzle game about moving through grids, manipulating tiles, and solving compact logic stages. Its Bit Managers development credit connects it to a wave of European handheld puzzle work.",
  "gb-cool-hand":
    "Cool Hand is a Game Boy card-game release focused on solitaire-style play and portable table-game sessions. It should be described as traditional card software, not an abstract puzzle game, because the appeal is quick handheld card play.",
  "gb-cosmo-tank":
    "Cosmo Tank is an Atlus Game Boy action shooter that mixes overhead tank movement with first-person corridor combat. That hybrid structure makes it one of the more distinctive early handheld shooters, especially for players looking beyond arcade ports.",
  "gb-crayon-shin-chan-2-ora-to-wanpaku-gokko-dazo":
    "Crayon Shin-Chan 2: Ora to Wanpaku Gokko Dazo adapts the mischievous anime comedy into a TOSE-developed Game Boy character platformer. Its value comes from the Shin-chan license, humor, and Japanese import appeal rather than mechanical novelty.",
  "gb-crayon-shin-chan-3-ora-no-gokigen-athletic":
    "Crayon Shin-Chan 3: Ora no Gokigen Athletic continues Bandai's Game Boy Shin-chan line with athletic-themed stages and family-friendly character action. The subtitle separates it from the other TOSE-developed Shin-chan handheld releases.",
  "gb-crayon-shin-chan-4-ora-no-itazura-dai-henshin":
    "Crayon Shin-Chan 4: Ora no Itazura Dai Henshin leans into Shin-chan's prankish comedy with another compact Bandai Game Boy action entry. It is best cataloged as part of the numbered Shin-chan import run, where each subtitle marks a different release.",
  "gb-crayon-shin-chan-ora-no-gokigen-collection":
    "Crayon Shin-Chan: Ora no Gokigen Collection packages Shin-chan-themed Game Boy activities in a collection-style release. It should be separated from the numbered action entries because the collection framing changes what players should expect.",
  "gb-crayon-shin-chan-ora-to-shiro-ha-otomodachi-dayo":
    "Crayon Shin-Chan: Ora to Shiro ha Otomodachi Dayo centers the Shin-chan license around Shin and his dog Shiro in a small Game Boy character adventure. It is a licensed fan release where cast context matters more than platforming depth.",
  "gbc-cross-hunter-monster-hunter-version":
    "Cross Hunter: Monster Hunter Version is one of three companion Game Boy Color RPG releases from Game Village, built around creature battling and version-specific content. It should be treated like a distinct version, not a duplicate of Treasure Hunter or X Hunter.",
  "gbc-cross-hunter-treasure-hunter-version":
    "Cross Hunter: Treasure Hunter Version is a separate version of Game Village's Game Boy Color RPG, emphasizing the same adventure framework with its own version identity. The subtitle is crucial because the Cross Hunter releases were split like collectible RPG variants.",
  "gbc-cross-hunter-x-hunter-version":
    "Cross Hunter: X Hunter Version completes the trio of Game Boy Color Cross Hunter versions, using version-specific branding to distinguish its content from Monster Hunter and Treasure Hunter. It belongs with handheld RPGs influenced by the late-1990s monster-collecting boom.",
  "gb-cult-jump":
    "Cult Jump is a Bandai Game Boy release connected to Shueisha's Jump manga culture, bringing licensed magazine character appeal into a compact adventure format. It is a Japanese media tie-in first, so readers need that context more than a broad adventure tag.",
  "gb-cultmaster-ultraman-ni-miserarete":
    "Cultmaster: Ultraman ni Miserarete is a Bandai Game Boy release built around Ultraman fandom, trivia-like knowledge, and character-series appeal. It is best cataloged as an Ultraman fan software entry rather than a conventional action adaptation.",
  "gbc-cyborg-kuro-chan-2-white-woods-no-gyakushuu":
    "Cyborg Kuro-chan 2: White Woods no Gyakushuu is a Konami Game Boy Color sequel based on the manga/anime about an armed cyborg cat. It keeps the license's chaotic action-comedy identity and should be separated from the first Devil Fukkatsu release.",
  "gbc-cyborg-kuro-chan-devil-fukkatsu":
    "Cyborg Kuro-chan: Devil Fukkatsu!! brings Konami's adaptation of the manga/anime to Game Boy Color with character action and comic sci-fi energy. The license is the headline feature, especially for collectors tracking late GBC anime tie-ins.",
  "gb-cyraid":
    "Cyraid is an Epoch and Nexoft Game Boy action game that mixes side-view shooting with maze-like movement and mechanical enemy threats. It is an early handheld original where the sci-fi premise gives the game more identity than the generic shooter label.",
  "gbc-daa-daa-daa-totsuzen-card-de-battle-de-uranai":
    "Daa! Daa! Daa! Totsuzen Card de Battle de Uranai!? adapts the anime series into a Game Boy Color card-battle and fortune-telling themed release. It is a licensed import where the unusual mix of character fandom, cards, and fortune play is the selling point.",
  "gb-daikaiju-monogatari-miracle-of-the-zone":
    "Daikaiju Monogatari: Miracle of the Zone is a Game Boy card-battle RPG tied to Hudson and Birthday's Daikaiju Monogatari world. Its Miracle of the Zone branding matters because the line also connects to collectible card-game play.",
  "gbc-daikaijuu-monogatari-the-miracle-of-the-zone-ii":
    "Daikaijuu Monogatari: The Miracle of the Zone II continues the Hudson/Birthday card-battle RPG concept on Game Boy Color. It should be cataloged as a sequel in the Miracle of the Zone branch, not as a generic Daikaiju Monogatari adventure.",
  "gbc-daiku-no-gen-san-kachikachi-no-tonkachi-ga-kachi":
    "Daiku no Gen-san: Kachikachi no Tonkachi ga Kachi is a Game Boy Color entry in Irem's Hammerin' Harry/Daiku no Gen-san character-action line. The carpenter hero and hammer-based platforming identity are the important hooks for readers.",
  "gb-daiku-no-gen-san-robot-teikoku-no-yabou":
    "Daiku no Gen-san: Robot Teikoku no Yabou brings Irem's carpenter hero to Game Boy in a robot-empire themed side-scrolling adventure. It belongs with the Hammerin' Harry family of character action games rather than anonymous platformers.",
  "gb-dainiji-super-robot-taisen-g":
    "Dainiji Super Robot Taisen G is a Game Boy strategy RPG entry in Banpresto's Super Robot Wars series, built around licensed mecha units and grid-based battles. It is a major handheld import for players following the long Super Robot Wars lineage.",
  "gb-daisenryaku":
    "Daisenryaku on Game Boy adapts SystemSoft's long-running military strategy series to portable hardware, focusing on units, maps, and tactical planning. It is a serious strategy listing rather than an arcade war game.",
  "gbc-dance-dance-revolution-gb":
    "Dance Dance Revolution GB compresses Konami's arcade rhythm phenomenon onto Game Boy Color, translating dance-step timing into portable button play and packaged rhythm sessions. It is a key handheld offshoot for DDR collectors.",
  "gbc-dance-dance-revolution-gb2":
    "Dance Dance Revolution GB2 continues Konami's portable DDR line with another set of rhythm charts and songs for Game Boy Color. The sequel is mainly valuable as a separate song-volume entry rather than a mechanical reinvention.",
  "gbc-dance-dance-revolution-gb3":
    "Dance Dance Revolution GB3 is the third Game Boy Color DDR release, preserving the arcade series' timing challenge in a small-screen format. It matters for collectors because the GB trilogy has distinct carts and song lists.",
  "gbc-dancing-furby":
    "Dancing Furby turns Tomy's Furby toy brand into a Game Boy Color rhythm and reaction game. It is a late toy-license release where the novelty is seeing the electronic pet craze adapted into portable software.",
  "gbc-das-geheimnis-der-happy-hippo-insel":
    "Das Geheimnis der Happy Hippo-Insel is a European Game Boy Color adventure tied to Kinder's Happy Hippo characters. It is a regional licensed release where German-language packaging, JoWooD publishing, and the candy-toy brand are the key identifiers.",
  "gbc-data-navi-pro-yakyuu":
    "Data-Navi Pro Yakyuu is a Game Boy Color baseball reference and simulation-style release from Now Production and Nowpro. The Data-Navi branding suggests statistics and pro-baseball information are central, making it different from a standard action baseball game.",
  "gbc-data-navi-pro-yakyuu-2":
    "Data-Navi Pro Yakyuu 2 follows the first Nowpro baseball data title with another Game Boy Color package built around Japanese pro-baseball information and play. It should be tracked separately because annual or sequel context matters for data-driven sports software.",
  "gbc-david-o-leary-s-total-soccer-2000":
    "David O'Leary's Total Soccer 2000 is a Game Boy Color soccer game tied to the Leeds United manager's name, offering portable match play for the 2000-era football audience. The celebrity-manager license distinguishes it from generic handheld soccer releases.",
  "gbc-dear-daniel-no-sweet-adventure-kitty-chan-o-sagashite":
    "Dear Daniel no Sweet Adventure: Kitty-chan o Sagashite is a Sanrio-themed Game Boy Color adventure starring Dear Daniel and Hello Kitty. It is a gentle licensed character game, most relevant for Sanrio collectors and family-friendly handheld libraries.",
  "gbc-deer-hunter":
    "Deer Hunter brings the PC hunting-sim brand to Game Boy Color with portable tracking, aiming, and outdoor-sports routines. It should be presented as hunting software rather than a generic sports game because the brand and simulation fantasy are specific.",
  "gbc-dejiko-no-mahjong-party":
    "Dejiko no Mahjong Party combines Broccoli's Di Gi Charat mascot world with Japanese mahjong play on Game Boy Color. It is a character-branded table game, useful for readers who follow anime-shop mascots and licensed mahjong software.",
  "gb-die-maus":
    "Die Maus adapts the German children's TV character from Die Sendung mit der Maus into a Game Boy adventure for younger players. It is a European licensed release where the educational TV brand explains the audience and tone.",
  "gbc-die-maus":
    "Die Maus for Game Boy Color is a separate color handheld adaptation of the German children's TV property, with family-friendly adventure play and regional European appeal. It should be cataloged separately from the monochrome Game Boy release.",
  "gbc-die-maus-verrueckte-olympiade":
    "Die Maus: Verrueckte Olympiade gives the German children's-TV license an Olympics-themed Game Boy Color outing with event-style activities. The subtitle is useful because it identifies this as a sports-festival spin on the character, not the standard Die Maus adventure.",
  "gbc-die-original-moorhuhn-jagd":
    "Die Original Moorhuhn Jagd adapts the German Moorhuhn shooting craze to Game Boy Color, centering on quick target shooting and score chasing. It is a regional phenomenon title, not a platformer, and should be grouped with arcade shooting curiosities.",
  "gb-dino-breeder":
    "Dino Breeder is a J-Wing Game Boy raising simulation about caring for and developing dinosaurs through repeated handheld routines. It is part of the monster-raising wave that surrounded Pokemon's success, but with a dinosaur-specific identity.",
  "gb-dino-breeder-2":
    "Dino Breeder 2 continues J-Wing's dinosaur-raising concept on Game Boy with another creature-care and growth loop. It should be separated from the first game because the series expanded across multiple numbered handheld releases.",
  "gbc-dino-breeder-3-gaia-fukkatsu":
    "Dino Breeder 3: Gaia Fukkatsu moves the dinosaur-raising series into Game Boy Color compatibility, keeping the focus on training and developing prehistoric creatures. The Gaia Fukkatsu subtitle marks it as a distinct sequel in the J-Wing line.",
  "gbc-dino-breeder-4":
    "Dino Breeder 4 is a later Game Boy Color-compatible entry in J-Wing's dinosaur-raising series, built for players who like creature growth, care routines, and collection. It matters because the Dino Breeder line has several close-looking sequels.",
  "gb-dodge-boy":
    "Dodge Boy is a Tonkin House dodgeball game for Game Boy, built around team throws, positioning, and quick handheld matches. It is a specific dodgeball release, not a broad sports compilation, so the sport should be clear in the overview.",
  "gbc-dogz":
    "Dogz brings Ubisoft and PF Magic's virtual-pet brand to Game Boy Color with puppy care, interaction, and simple animal routines. It belongs with late handheld pet simulations and pairs naturally with Catz rather than broader life sims.",
  "gbc-doki-doki-densetsu-mahoujin-guruguru":
    "Doki Doki Densetsu: Mahoujin Guruguru adapts the fantasy comedy manga/anime into an Enix-published Game Boy Color RPG. The series license and light parody-fantasy tone are the important context for players browsing Japanese handheld RPGs.",
  "gbc-doki-doki-sasete":
    "Doki Doki Sasete!! is a Victor Interactive Game Boy Color romance and communication-style release centered on character interaction rather than tactical strategy. It fits better with dating and conversation-driven import software than with strategy games.",
  "gb-doraemon-2-animal-wakusei-densetsu":
    "Doraemon 2: Animal Wakusei Densetsu is an Epoch Game Boy adventure based on Doraemon's gadget-filled manga and anime world. The Animal Planet subtitle gives this entry its specific theme, separating it from other Doraemon handheld games.",
  "gb-doraemon-kart":
    "Doraemon Kart turns Epoch's Doraemon license into a Game Boy racing game, putting the familiar manga cast into compact kart-style competition. It is a character racer first, with appeal tied to Doraemon rather than realistic driving.",
  "gbc-doraemon-kart-2":
    "Doraemon Kart 2 is the Game Boy Color-compatible sequel to Epoch's Doraemon racing spin-off, continuing the character-kart premise with a separate release identity. It should be cataloged apart from the original monochrome Game Boy entry.",
  "gbc-doraemon-memories-nobita-no-omoide-daibouken":
    "Doraemon Memories: Nobita no Omoide Daibouken is a Game Boy Color adventure centered on Nobita, Doraemon, and memory-themed story material. It is a licensed character adventure where the subtitle explains the specific scenario hook.",
  "gb-doraemon-no-gameboy-de-asobouyo-dx10":
    "Doraemon no GameBoy de Asobouyo DX10 packages Doraemon-themed play activities for Game Boy, with the DX10 title suggesting a multi-activity or deluxe format. It is best treated as family-oriented licensed software rather than a single-genre adventure.",
  "gbc-doraemon-no-quiz-boy":
    "Doraemon no Quiz Boy turns the Doraemon license into a Game Boy Color quiz game, using character branding around question-and-answer play. It is language-dependent import software, so the quiz format should be front and center.",
  "gbc-doraemon-no-quiz-boy-2":
    "Doraemon no Quiz Boy 2 continues the Game Boy Color quiz-game format with Doraemon characters wrapped around question-and-answer play. It is a Japanese-language fan and trivia release rather than an action adventure.",
  "gb-doraemon-no-study-boy-1-shouichi-koguko-kanji":
    "Doraemon no Study Boy 1: Shouichi Koguko Kanji uses the Doraemon license to teach early elementary Japanese kanji through portable drills and study prompts. It is education software built around character familiarity.",
  "gb-doraemon-no-study-boy-2-shouichi-sansuu-keisan":
    "Doraemon no Study Boy 2: Shouichi Sansuu Keisan focuses on first-grade arithmetic practice, using simple exercises and Doraemon presentation to make math review feel friendlier on Game Boy.",
  "gb-doraemon-no-study-boy-3-ku-ku-master":
    "Doraemon no Study Boy 3: Ku Ku Master centers on multiplication-table practice, turning memorization into short handheld study sessions. It is part of Epoch's practical Doraemon learning line.",
  "gb-doraemon-no-study-boy-4-shouni-kokugo-kanji":
    "Doraemon no Study Boy 4: Shouni Kokugo Kanji moves the series into second-grade Japanese-language and kanji study. The game is best understood as a licensed learning tool rather than entertainment-first software.",
  "gb-doraemon-no-study-boy-5-shouni-sansuu-keisan":
    "Doraemon no Study Boy 5: Shouni Sansuu Keisan continues the education series with second-grade arithmetic practice and Doraemon-themed feedback. It is a portable study companion for younger Japanese students.",
  "gb-doraemon-no-study-boy-6-gakushuu-kanji-master-1006":
    "Doraemon no Study Boy 6: Gakushuu Kanji Master 1006 expands the study focus to a larger kanji curriculum, making it one of the broader educational entries in the Game Boy Doraemon line.",
  "gbc-doraemon-no-study-boy-gakushuu-kanji-game":
    "Doraemon no Study Boy: Gakushuu Kanji Game brings kanji practice to Game Boy Color with Doraemon branding, quiz-style study, and portable review. It is a companion to the earlier monochrome Study Boy releases.",
  "gbc-doraemon-no-study-boy-kanji-yomikaki-master":
    "Doraemon no Study Boy: Kanji Yomikaki Master focuses on reading and writing kanji, using the familiar cast to support repeated practice. It is a study title for Japanese literacy rather than a conventional character game.",
  "gbc-doraemon-no-study-boy-kuku-game":
    "Doraemon no Study Boy: Kuku Game returns to multiplication-table learning with Game Boy Color presentation and quick practice loops. It pairs naturally with the earlier Ku Ku Master release.",
  "gbc-doraemon-aruke-aruke-labyrinth":
    "Doraemon: Aruke Aruke Labyrinth is a maze-style character game where Doraemon and friends navigate puzzle-like paths and obstacles. It gives the license a more traditional play structure than the Study Boy education titles.",
  "gb-doraemon-taiketsu-himitsu-dogu":
    "Doraemon: Taiketsu Himitsu Dogu!! is an action-oriented Game Boy release built around Doraemon's secret gadgets and familiar manga cast. It is a more direct licensed adventure than the quiz and study spin-offs.",
  "gb-double-yakuman":
    "Double Yakuman is a Game Boy mahjong release built around Japanese tile rules, hand building, and traditional table play. It is specialist board-game software for players already comfortable with mahjong.",
  "gb-double-yakuman-ii":
    "Double Yakuman II continues VAP's Game Boy mahjong line with another package of tile strategy and CPU table competition. It is a sequel aimed at the same dedicated mahjong audience.",
  "gb-double-yakuman-jr":
    "Double Yakuman Jr. offers a younger or lighter-facing take on the Double Yakuman mahjong series while keeping the core tile-game structure. It remains a Japanese mahjong title rather than a broad puzzle game.",
  "gb-downtown-nekketsu-koushinkyoku-dokodemo-daiundoukai":
    "Downtown Nekketsu Koushinkyoku: Dokodemo Daiundoukai brings Kunio-kun's schoolyard sports chaos to Game Boy with multi-event competition, brawling energy, and portable team rivalry. It is a handheld take on Technos's rough-and-ready sports formula.",
  "gb-downtown-special-kunio-kun-no-jidaigeki-dayo-zenin-shuugou":
    "Downtown Special: Kunio-Kun no Jidaigeki Dayo Zenin Shuugou! moves the Kunio-kun cast into a period setting, mixing beat-'em-up action with RPG-like town wandering and character encounters. It is one of the more flavorful handheld Kunio entries.",
  "gb-dr-franken":
    "Dr. Franken is a side-scrolling platformer starring a cartoon Frankenstein-like character exploring mansion rooms, dodging hazards, and collecting items. It is a European-developed Game Boy platformer with a monster-comedy premise.",
  "gb-dr-franken-ii":
    "Dr. Franken II follows the same monster-platformer idea with more side-scrolling stages, hazards, and light spooky humor. It is the less common sequel for collectors tracking Kemco and Elite's handheld releases.",
  "gbc-dr-rin-ni-kiitemite-koi-no-rin-fuusui":
    "Dr. Rin ni Kiitemite!: Koi no Rin Fuusui adapts the shoujo manga and anime into a Game Boy Color title about romance, fortune-telling, and character events. It is a licensed import driven by the source material's feng shui hook.",
  "gb-dragon-slayer-gaiden-nemuri-no-oukan":
    "Dragon Slayer Gaiden: Nemuri no Oukan brings Falcom's Dragon Slayer lineage to Game Boy as a compact action RPG with exploration, combat, and fantasy questing. It is a notable handheld side entry in a long-running Japanese RPG family.",
  "gb-dropzone":
    "Dropzone is a fast side-scrolling shooter inspired by Defender, asking players to fly, rescue targets, and survive waves of enemies. The Game Boy version compresses arcade rescue-shooter pressure into monochrome handheld play.",
  "gbc-dropzone":
    "Dropzone on Game Boy Color revisits the Defender-like rescue-shooter formula with color presentation and portable arcade pacing. Players sweep across scrolling terrain, protect survivors, and manage constant enemy pressure.",
  "gbc-dt-lords-of-genomes":
    "DT: Lords of Genomes is a Game Boy Color card-battle RPG about collecting digital creatures and using card strategy through story progression. It is a late handheld entry that sits near monster-collecting and trading-card trends.",
  "gb-ducktales":
    "DuckTales is Capcom's handheld adaptation of the NES classic, sending Scrooge McDuck through treasure-hunting platform stages with his cane pogo move. It remains one of the Game Boy's recognizable Disney action games.",
  "gb-ducktales-2":
    "DuckTales 2 brings Scrooge back for another portable treasure hunt, adding new locations, cane-based platforming, and item progression. It is a key Disney sequel for Game Boy collectors because it is much less common than the first game.",
  "gb-dungeon-land":
    "Dungeon Land is an Enix-published Game Boy adventure with maze exploration, fantasy obstacles, and light role-playing flavor. It is a niche early handheld release rather than a direct match for later dungeon crawlers with the same name.",
  "gbc-dungeon-savior":
    "Dungeon Savior is a Game Boy Color-compatible dungeon adventure with maze movement, monster encounters, and item-based progress. It is a small J-Wing release for players interested in obscure Japanese handheld RPG-adjacent games.",
  "gb-dx-bakenou-z":
    "DX Bakenou Z is a horse-racing prediction and betting-themed Game Boy release focused on race data, odds-style thinking, and simulation presentation. It is a specialist Japanese gambling-adjacent title.",
  "gbc-dx-jinsei-game":
    "DX Jinsei Game brings Takara's The Game of Life board-game formula to Game Boy Color with life events, money management, and route-based progression. It is party-board-game software adapted for solo handheld play.",
  "gbc-dx-monopoly-gb":
    "DX Monopoly GB adapts Monopoly to Game Boy Color with property buying, rent collection, auctions, and board-game pacing. It is a portable version of the classic real-estate game rather than a new strategy design.",
  "gbc-e-t-the-extra-terrestrial-digital-companion":
    "E.T. The Extra-Terrestrial: Digital Companion is a Game Boy Color organizer and activity title with mini-games, calendar-like tools, and E.T. branding. It is closer to a novelty companion app than a traditional adventure game.",
  "gb-eijukugo-target-1000":
    "Eijukugo Target 1000 is English idiom study software for Japanese learners, built around memorization, review, and quiz practice. It belongs to the Game Boy's practical education catalog.",
  "gb-eiken-2-kyuu-level-no-kaiwa-hyuugen-333":
    "Eiken 2-Kyuu Level no Kaiwa Hyuugen 333 is an English conversation-expression study title aimed at Eiken test preparation. It uses the Game Boy as a pocket review tool for language learners.",
  "gb-eitango-target-1900":
    "Eitango Target 1900 is a vocabulary study release tied to English exam preparation, focused on memorizing common target words through portable drills. It is education software first and a game only in the loosest sense.",
  "gbc-elie-no-atelier-gb":
    "Elie no Atelier GB adapts Gust's alchemy-life series to Game Boy Color with ingredient gathering, synthesis, requests, and character progression. It is a compact handheld companion to the Atelier franchise's early era.",
  "gb-elite-soccer":
    "Elite Soccer is a traditional handheld football game with teams, passing, shooting, and match play compressed for the Game Boy screen. It offers a straightforward sports option from the system's early 1990s lineup.",
  "gbc-espn-international-track-and-field":
    "ESPN International Track & Field brings Konami's athletics competition to Game Boy Color with sprinting, jumping, throwing, and button-timing events. It is a portable take on arcade-style track-and-field competition.",
  "gb-extra-bases":
    "Extra Bases is Namco's Game Boy baseball release, built around simplified pitching, batting, fielding, and team play. It is an early handheld baseball entry with a straightforward arcade-sports feel.",
  "gbc-extreme-ghostbusters":
    "Extreme Ghostbusters adapts the animated series into a Game Boy Color action game about chasing supernatural threats, using ghostbusting equipment, and moving through side-view stages. It is a licensed handheld companion to the TV show.",
  "gbc-f-18-thunder-strike":
    "F-18 Thunder Strike is a Game Boy Color flight-combat release focused on jet missions, targeting, and simplified aerial action. It is an accessible military-aviation game rather than a full flight simulator.",
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
if (!Array.isArray(games)) throw new Error("Run scripts/import-gameboy-official-list.js first.");

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

console.log(`Seeded ${seeded} Game Boy editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
