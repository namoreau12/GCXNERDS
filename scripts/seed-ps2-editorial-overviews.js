const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const ps2Path = path.join(rootDir, "data", "games", "ps2.json");
const manifestPath = path.join(rootDir, "data", "games", "ps2-manifest.json");

const seeds = {
  "ps2-grand-theft-auto-san-andreas":
    "Grand Theft Auto: San Andreas expanded Rockstar's crime sandbox into a full state, following Carl Johnson through gang politics, crooked cops, countryside detours, casinos, and city-to-city escalation. Its mix of driving, shooting, role-playing stats, licensed music, and open-world freedom made it one of the defining PS2 releases.",
  "ps2-grand-theft-auto-vice-city":
    "Grand Theft Auto: Vice City turned the GTA III formula into a neon crime drama inspired by 1980s Miami, with Tommy Vercetti building a criminal empire through missions, property ownership, radio stations, and sharp period style. Its atmosphere and soundtrack made it one of PS2's most recognizable open-world games.",
  "ps2-grand-theft-auto-iii":
    "Grand Theft Auto III reshaped console open-world design by dropping players into Liberty City with mission chains, radio satire, traffic systems, and a city that felt reactive for its time. Its structure became the foundation for years of sandbox action games on PS2 and beyond.",
  "ps2-god-of-war":
    "God of War introduced Kratos through a brutal mythological action game built around chained-blade combat, large-scale boss fights, puzzles, and cinematic set pieces. Its pacing, spectacle, and aggressive combat identity quickly made it one of Sony's signature PlayStation 2 franchises.",
  "ps2-god-of-war-ii":
    "God of War II pushed the original's formula further with larger encounters, smoother combat, and an even bigger mythological revenge story. Arriving late in the PS2's life, it became a showcase for how much scale and polish developers could still pull from the hardware.",
  "ps2-metal-gear-solid-2-sons-of-liberty":
    "Metal Gear Solid 2: Sons of Liberty used the PS2 jump to deliver dense stealth systems, cinematic direction, and a famously divisive narrative shift from Snake to Raiden. Its tanker and Big Shell scenarios mix guard AI, environmental detail, political paranoia, and media-age themes that still feel unusually ambitious.",
  "ps2-metal-gear-solid-3-snake-eater":
    "Metal Gear Solid 3: Snake Eater moved the series into a Cold War jungle survival mission, adding camouflage, stamina, hunting, injury treatment, and more flexible stealth encounters. Its emotional spy story and boss lineup made it one of the PS2's essential single-player games.",
  "ps2-final-fantasy-x":
    "Final Fantasy X brought Square's RPG series fully into voice acting and 3D presentation, following Tidus and Yuna across Spira through a pilgrimage shaped by faith, sacrifice, and spectacle. Its Conditional Turn-Based battle system, Sphere Grid, and summons gave it a distinct identity within the series.",
  "ps2-final-fantasy-xii":
    "Final Fantasy XII reimagined the series around open zones, programmable Gambit behavior, and a political story set in Ivalice. Its MMO-like flow, hunts, license boards, and layered combat systems made it one of the most mechanically distinct RPGs on PS2.",
  "ps2-shadow-of-the-colossus":
    "Shadow of the Colossus strips action-adventure down to a lonely landscape and sixteen monumental battles, asking players to climb, study, and bring down living giants. Its sparse world, quiet storytelling, and physical sense of scale made it one of the most artistically influential PS2 games.",
  "ps2-ico":
    "Ico is a minimalist adventure about guiding a fragile companion through a mysterious castle, built around environmental puzzles, hand-holding, and quiet atmosphere. Its restraint, animation, and wordless emotional storytelling helped define Team Ico's reputation for artful game design.",
  "ps2-kingdom-hearts":
    "Kingdom Hearts combines Square-style action RPG systems with Disney worlds, sending Sora, Donald, and Goofy through a crossover adventure built around real-time combat, character growth, and familiar animated settings. Its unlikely mix became one of PS2's major RPG identities.",
  "ps2-kingdom-hearts-ii":
    "Kingdom Hearts II sharpens the series with faster combat, Drive Forms, larger set pieces, and a story that leans deeper into original characters and Organization XIII. It is a major collector and fan favorite because it makes the crossover formula feel more confident and kinetic.",
  "ps2-silent-hill-2":
    "Silent Hill 2 is a psychological horror landmark, following James Sunderland through a fog-covered town shaped by guilt, grief, and punishment. Its monster design, soundscape, and symbolic storytelling make it one of the most discussed and collected horror games on PS2.",
  "ps2-resident-evil-4":
    "Resident Evil 4 reinvented Capcom's horror series as a tense over-the-shoulder action game, sending Leon Kennedy through hostile villages, castles, and laboratories. Its aiming, encounter design, merchant economy, and pacing influenced a generation of third-person shooters.",
  "ps2-devil-may-cry":
    "Devil May Cry turned stylish action into its own language, rewarding players for juggling enemies, switching weapons, and fighting with flair as Dante explores a gothic island. Its speed and combo scoring helped establish the character-action genre on PS2.",
  "ps2-devil-may-cry-3-dante-s-awakening":
    "Devil May Cry 3: Dante's Awakening revived the series with demanding combat, selectable styles, memorable boss fights, and a younger Dante's rivalry with Vergil. Its depth and difficulty made it a benchmark for stylish action fans.",
  "ps2-ratchet-and-clank":
    "Ratchet & Clank blends mascot platforming with inventive weapon upgrades, sci-fi planets, and gadget-driven exploration. Its humor, arsenal progression, and polished movement helped make it one of Sony's most durable PS2-era series.",
  "ps2-jak-and-daxter-the-precursor-legacy":
    "Jak and Daxter: The Precursor Legacy gave Naughty Dog's PS2 platformer a seamless fantasy world, collectable-driven progression, and expressive animation without loading screens between major areas. It remains the bright, exploration-focused starting point for the Jak series.",
  "ps2-sly-cooper-and-the-thievius-raccoonus":
    "Sly Cooper and the Thievius Raccoonus mixes stealth, platforming, and comic-book presentation as Sly rebuilds his family's stolen book of thief techniques. Its cel-shaded look and focused heist structure helped it stand apart from other PS2 mascot games.",
  "ps2-gran-turismo-3-a-spec":
    "Gran Turismo 3: A-Spec used the PS2's hardware leap to make Sony's simulation racing series look cleaner, faster, and more serious. Its car collecting, license tests, tuning, and long career mode made it an early showcase for the console.",
  "ps2-gran-turismo-4":
    "Gran Turismo 4 expanded the series with a huge car list, photo mode, B-Spec management, and a broad spread of tracks and driving challenges. For collectors, it is one of the PS2's definitive racing packages and a technical high point for the system.",
  "ps2-tekken-5":
    "Tekken 5 restored speed and impact to Namco's 3D fighting series with a strong roster, arcade history extras, sharp character animation, and deep one-on-one combat. It became a late-generation favorite for competitive and casual PS2 fighting fans.",
  "ps2-tony-hawk-s-pro-skater-3":
    "Tony Hawk's Pro Skater 3 brought the revert to the series, linking vert tricks into longer combos and making the already-fluid scoring system even more expressive. Its levels, soundtrack, and arcade momentum made it one of the PS2's great score-attack games.",
  "ps2-burnout-3-takedown":
    "Burnout 3: Takedown turned arcade racing into controlled chaos by rewarding aggressive driving, crashes, boost chains, and rival takedowns. Its speed, impact, and event variety made it one of the most beloved racing games of the generation.",
  "ps2-okami":
    "Okami casts players as the sun goddess Amaterasu in a painterly action-adventure inspired by Japanese folklore. Its Celestial Brush mechanics, restoration themes, and ink-wash visual style made it one of the PS2's most beautiful late releases.",
  "ps2-persona-4":
    "Persona 4 blends turn-based dungeon crawling with small-town mystery, school-life scheduling, social links, and character-driven storytelling. Its tone, cast, and daily-life structure helped turn Persona into one of the most important RPG series connected to the PS2 era.",
  "ps2-netsu-chu-pro-yakyu-2002":
    "Netsu Chu! Pro Yakyu 2002 is Namco's early PS2 baseball sim, built around Nippon Professional Baseball presentation, season play, batting timing, and pitcher-batter matchups. For collectors, it helps anchor Namco's Japan-only sports output during the system's first big wave.",
  "ps2-netsu-chu-pro-yakyu-2003":
    "Netsu Chu! Pro Yakyu 2003 continues Namco's Japanese baseball line with updated rosters, broadcast-style rhythm, and a focus on full-game simulation rather than arcade novelty. It is best cataloged as a yearly NPB entry where date, cover, and region separate it from nearby releases.",
  "ps2-netsu-chu-pro-yakyu-2003-aki-no-night-matsuri":
    "Netsu Chu! Pro Yakyu 2003: Aki no Night Matsuri is a special follow-up to Namco's 2003 baseball release, tied to the autumn stretch of the NPB season. Its value for PS2 collectors comes from being a distinct seasonal edition rather than a simple duplicate of the standard 2003 game.",
  "ps2-netsu-chu-pro-yakyu-2004":
    "Netsu Chu! Pro Yakyu 2004 carries Namco's baseball simulation into another roster year, with the familiar mix of batting, pitching, team management, and Japanese-league presentation. It belongs in the library as part of a tightly grouped annual sports run that needs exact-year cataloging.",
  "ps2-nettai-teikiatsu-shoujo":
    "Nettai Teikiatsu Shoujo is a Japan-only PS2 visual novel from NIne'sFox, aimed at character routes, dialogue choices, and romantic scenario progression. It is a niche import record where the title, publisher spelling, and complete packaging matter more than conventional gameplay hooks.",
  "ps2-never7-the-end-of-infinity":
    "Never7: The End of Infinity is KID's science-fiction visual novel about memory, relationships, and repeated mystery routes on an isolated island. As the starting point for the Infinity line, its PS2 release matters to collectors following the path toward Ever17 and later cult visual novels.",
  "ps2-neverland-kenkyufu":
    "Neverland Kenkyufu is a Japan-only PS2 RPG from Neverland and Idea Factory, framed around fantasy adventure, character progression, and party-based play. It is useful to distinguish from the developer's better-known Rune Factory and Lufia connections when cataloging import RPG shelves.",
  "ps2-new-jinsei-game":
    "New Jinsei Game brings Takara's long-running life-board-game concept to PS2 with party-game pacing, dice-roll progression, events, and career/luck swings. It is best understood as a digital board game rather than an action title, with appeal tied to Japanese party-game collecting.",
  "ps2-new-roommania-porori-seishun":
    "New Roommania: Porori Seishun continues Sega's unusual life-observation series, where the player indirectly influences a young man's routine, relationships, and decisions. It stands out in the PS2 library because its appeal is social simulation and voyeuristic comedy rather than direct control.",
  "ps2-next-generation-tennis":
    "Next Generation Tennis is Wanadoo's PS2 tennis release, centered on rallies, court positioning, shot selection, and quick exhibition-style play. It is a lower-profile European sports entry, so region and publisher details are more important for collectors than franchise recognition.",
  "ps2-next-generation-tennis-2003":
    "Next Generation Tennis 2003 updates Wanadoo's tennis package with a later-season identity and the same emphasis on accessible rallies and match play. Cataloging it separately matters because the 2003 subtitle can be easy to miss in listings for PAL sports games.",
  "ps2-nfl-2k2":
    "NFL 2K2 brings Visual Concepts' football series to PS2 with simulation-minded playbooks, broadcast rhythm, franchise structure, and a feel distinct from Madden's era dominance. It represents Sega's early attempt to keep the 2K football brand competitive across new hardware.",
  "ps2-nfl-2k3":
    "NFL 2K3 builds on Visual Concepts' football foundation with deeper presentation, updated teams, and the line's characteristic balance between accessible controls and serious football systems. It is an important step on the road to ESPN NFL Football and NFL 2K5.",
  "ps2-nfl-blitz-20-03":
    "NFL Blitz 20-03 keeps Midway's football series loud and arcade-driven, with exaggerated hits, fast possessions, simplified rules, and momentum swings built for spectacle. It is a different collecting lane from simulation football because the Blitz name is the whole draw.",
  "ps2-nfl-gameday-2001":
    "NFL GameDay 2001 is Sony's first PS2-era entry in its long-running football line, carrying 989 Studios' console-sports identity into the new generation. Its main collector interest is historical: it shows Sony still trying to compete directly in football before the genre narrowed around bigger brands.",
  "ps2-nfl-gameday-2002":
    "NFL GameDay 2002 continues Sony's in-house football series with updated teams, season play, and early-PS2 sports presentation. It is not as widely remembered as Madden or NFL 2K, but it matters for complete PlayStation sports libraries.",
  "ps2-nfl-gameday-2003":
    "NFL GameDay 2003 is another yearly 989 Studios football release, built around traditional 11-on-11 play, roster updates, and Sony's attempt to keep a first-party sports shelf visible on PS2. Exact year and cover condition are the useful marketplace identifiers.",
  "ps2-nfl-gameday-2004":
    "NFL GameDay 2004 arrives late in Sony's football push, with the series leaning on official teams, season modes, and familiar PS2 sports structure. For collectors, it marks the tail end of a PlayStation football brand that was soon overshadowed by larger third-party franchises.",
  "ps2-nfl-street-3":
    "NFL Street 3 turns football into EA Sports BIG-style arcade competition, emphasizing style moves, laterals, wall plays, and exaggerated short-field action. On PS2 it is the flashier alternative to simulation football and a late entry in EA's street-sports run.",
  "ps2-nhl-2005":
    "NHL 2005 represents EA Canada's mid-2000s hockey rhythm on PS2, with updated rosters, skill-stick-era transition ideas, dynasty-style play, and faster broadcast presentation. Its collector role is strongest for annual sports completists and hockey fans tracking EA's year-to-year changes.",
  "ps2-nhra-championship-drag-racing":
    "NHRA Championship Drag Racing brings straight-line motorsport to PS2 with launch timing, tuning, bracket competition, and licensed drag-racing structure. It is a specialized racing release where the NHRA license separates it from more common circuit and arcade racers.",
  "ps2-nhra-drag-racing-countdown-to-the-championship-2007":
    "NHRA Drag Racing: Countdown to the Championship 2007 updates the drag-racing formula around official championship branding, car setup, reaction times, and incremental performance gains. It should be treated as a distinct late PS2 racing entry rather than folded into generic motorsport listings.",
  "ps2-ni-hao-kai-lan-super-game-day":
    "Ni Hao, Kai-Lan: Super Game Day adapts the preschool TV series into a simple PS2 activity game with friendly minigames, bright character presentation, and very young-player pacing. Its catalog value comes from licensed-family software coverage and exact title identification.",
  "ps2-nichibeikan-pro-yakyu-final-league":
    "Nichibeikan Pro Yakyu: Final League is a SquareSoft baseball release focused on Japanese professional play, batting and pitching exchanges, and team competition. It is a notable sports oddity because SquareSoft is far more associated with RPGs than PS2 baseball sims.",
  "ps2-night-wizard-the-video-game-denial-of-the-world":
    "Night Wizard the Video Game: Denial of the World adapts the tabletop/anime fantasy property into a PS2 RPG centered on characters, scenario events, and supernatural conflict. It is mainly an import-fan and media-tie-in collectible, not a mainstream PlayStation RPG touchstone.",
  "ps2-nihon-sumo-kyokai-kounin-nihon-oozumou-gekitou-honbashohen":
    "Nihon Sumo Kyokai Kounin: Nihon Oozumou Gekitou Honbashohen is a Konami sumo release built around official association branding, wrestler matchups, ring positioning, and the ritual rhythm of tournament play. It is a specialized Japanese sports title where the license and exact subtitle carry most of the collector value.",
  "ps2-ninkyouden-toseinin-ichidaiki":
    "Ninkyouden: Toseinin Ichidaiki is a Genki period adventure about underworld honor, travel, and yakuza-drama atmosphere in a historical setting. It stands apart from Genki's racing identity because the appeal is story mood and era flavor rather than cars or track mastery.",
  "ps2-nippon-oozumou-kakutouhen":
    "Nippon Oozumou Kakutouhen is an early PS2 sumo game from Konami, focused on bouts, timing, ring-outs, and Japanese professional sumo presentation. It belongs beside Konami's other sumo releases as a niche sports-simulation entry for import collectors.",
  "ps2-nishikaze-no-kyoushikyouku-the-rhapsody-of-zephyr":
    "Nishikaze no Kyoushikyouku: The Rhapsody of Zephyr is a SoftMax role-playing game with Korean PC roots, fantasy party progression, and strategy-flavored scenario design. The PS2 version is useful to catalog because it represents a less common cross-market RPG import on Sony's console.",
  "ps2-noble-racing":
    "Noble Racing is a Midas budget racer centered on lightweight circuit competition, simple handling, and quick event play. It is not a showcase racing sim, but it belongs in the PS2 library as part of the platform's broad PAL racing shelf.",
  "ps2-nobunaga-no-yabou-online":
    "Nobunaga no Yabou Online brings Koei's historical strategy brand into online RPG territory, using Sengoku-era factions, character progression, and persistent-world play instead of the usual single-player grand strategy format. The PS2 release is notable because online service context matters for how the game can be understood today.",
  "ps2-nobunaga-no-yabou-online-haten-no-shou":
    "Nobunaga no Yabou Online: Haten no Shou is an expansion-era PS2 release for Koei's online Sengoku RPG, tied to added systems and service-period content. It should be tracked separately from the base game because these online package editions can be hard to interpret in listings.",
  "ps2-nobunaga-no-yabou-online-souha-no-shou":
    "Nobunaga no Yabou Online: Souha no Shou is another packaged chapter of Koei's PS2 online historical RPG, built around the same factional Sengoku setting and evolving live-service content. Its value is mostly archival and collector-focused now, since playability depends on the historical online service.",
  "ps2-nobunaga-no-yabou-online-tappi-no-shou":
    "Nobunaga no Yabou Online: Tappi no Shou continues the PS2 package line for Koei's online Nobunaga project, representing a specific service-era update rather than a normal standalone sequel. For collectors, the subtitle is the key difference to verify.",
  "ps2-nobunaga-no-yabou-ranseiki":
    "Nobunaga no Yabou: Ranseiki is a PlayStation 2 entry in Koei's long-running historical strategy series, centered on daimyo management, territorial conflict, alliances, and Sengoku-era planning. It is part of the core Nobunaga's Ambition lineage rather than the online RPG branch.",
  "ps2-nobunaga-no-yabou-soutenroku":
    "Nobunaga no Yabou: Soutenroku continues Koei's dense Sengoku strategy formula on PS2, asking players to manage clans, diplomacy, resources, and military campaigns across Japan. It is a useful listing for strategy collectors because the Japanese subtitle separates it from many similarly named Nobunaga releases.",
  "ps2-nobunaga-senki":
    "Nobunaga Senki is a Global A strategy release built around Sengoku warfare, historical commanders, and tactical decision-making on a smaller scale than Koei's flagship Nobunaga line. It is an import-library title where the Nobunaga name can imply more than the actual publisher lineage.",
  "ps2-nobunaga-s-ambition-iron-triangle":
    "Nobunaga's Ambition: Iron Triangle is Koei's deep PS2 grand-strategy game about ruling clans, developing territory, managing officers, and pushing across Japan through diplomacy and war. It is one of the easier Nobunaga PS2 entries for English-speaking collectors to recognize.",
  "ps2-nobunaga-s-ambition-rise-to-power":
    "Nobunaga's Ambition: Rise to Power brings Koei's Sengoku grand strategy to PS2 with officer management, castle development, alliances, and turn-based campaign decisions. It is a key English-language PS2 release for players interested in historical strategy rather than action combat.",
  "ps2-nodame-cantabile":
    "Nodame Cantabile adapts the classical-music manga and anime into a PS2 rhythm and music game, built around conducting-style timing, character charm, and orchestral presentation. Its appeal comes from the license and musical framing rather than standard rhythm-game flash.",
  "ps2-noddy-and-the-magic-book":
    "Noddy and the Magic Book is a preschool-friendly licensed PS2 game with simple activities, colorful character presentation, and very young-player pacing. It belongs in the library as family software where the Noddy brand and PAL-region packaging are the important details.",
  "ps2-nogizaka-haruka-no-himitsu-cosplay-hajime-mashita":
    "Nogizaka Haruka no Himitsu Cosplay, Hajime Mashita is a PS2 visual novel tied to the light-novel/anime property, focusing on character scenes, cosplay-themed events, and fan-oriented story material. It is mainly an import media-tie-in release for series followers.",
  "ps2-north-wind-eien-no-yakusoku":
    "North Wind: Eien no Yakusoku is a Datam Polystar visual novel port about romance, memory, and character routes in a wintery school-life frame. Its PS2 release fits the console's large Japanese story-game catalog, where mood and cast are the selling points.",
  "ps2-nuga-cel":
    "Nuga-Cel! is an Idea Factory RPG about costumed heroines, equipment changes, and anime-styled battles, with character presentation doing much of the work. It is a late PS2 import that appeals to collectors of niche Idea Factory and Compile Heart-adjacent releases.",
  "ps2-nurse-witch-komugi-chan-magical-te":
    "Nurse Witch Komugi-Chan Magical te is a KID visual novel and anime tie-in built around magical-girl parody, character scenes, and fan-focused scenario material. It is useful to frame as a media property release rather than a general fantasy adventure.",
  "ps2-obliterate":
    "Obliterate is a Phoenix Games budget action release with simple combat goals, sparse presentation, and quick mission-style play. Its main importance is as part of the PS2's enormous European budget catalog, where publisher and region help identify the right disc.",
  "ps2-ocean-commander":
    "Ocean Commander is a budget sci-fi shooter about piloting through underwater and ocean-themed threats, firing on enemy waves, and pushing through arcade-style stages. It should be described as a shooter rather than strategy, with CyberPlanet and Phoenix Games marking its PAL budget lineage.",
  "ps2-oekaki-puzzle":
    "Oekaki Puzzle is a Success nonogram-style puzzle game about using number clues to fill grids and reveal pictures. It is a pure logic-puzzle release, useful for players who want Picross-like play on PS2 rather than action or story.",
  "ps2-offroad-extreme":
    "Offroad Extreme! is a Phoenix Games budget racing title built around rough-terrain vehicles, straightforward events, and simple arcade handling. It is best cataloged as low-cost PAL racing software rather than a full motorsport simulation.",
  "ps2-ojousama-kumikyoku-sweet-concert":
    "Ojousama Kumikyoku: Sweet Concert is a Pionesoft visual-novel and music-themed character game, centered on aristocratic school-life drama, romance routes, and concert-flavored presentation. It is more useful to describe through its story-game structure than as a traditional rhythm release.",
  "ps2-omoi-no-kakera-close-to":
    "Omoi no Kakera: Close to is a KID visual novel about memory, relationships, and quiet emotional drama, built around character routes and dialogue choices. It belongs with the PS2's deep Japanese romance-adventure library rather than action or strategy software.",
  "ps2-omoide-ni-kawaru-kimi-memories-off":
    "Omoide ni Kawaru-Kimi: Memories Off is a KID visual novel entry in the Memories Off line, focused on romance routes, friendship tension, and reflective character drama. The subtitle matters for collectors because the series has several similarly named PlayStation releases.",
  "ps2-only-you":
    "Only You is a PS2 visual novel port from AliceSoft and GeneX, mixing school-life romance, comedy, and route-based character scenes. It is a niche import release where publisher, version, and platform details help distinguish it from other titles using the same broad name.",
  "ps2-onmyou-taisenki-byakko-enbu":
    "Onmyou Taisenki: Byakko Enbu adapts the anime and toyline property into a PS2 strategy game about summoning shikigami, using elemental matchups, and battling through licensed story material. It is a media-tie-in release whose appeal depends on the Onmyou Taisenki brand.",
  "ps2-onmyou-taisenki-hasha-no-in":
    "Onmyou Taisenki: Hasha no In continues the Onmyou Taisenki PS2 line with another strategy-focused adaptation of the shikigami battle premise. It should be cataloged separately from Byakko Enbu because the subtitle marks a distinct licensed release.",
  "ps2-ookuki":
    "Ookuki is a Global A PS2 release with a traditional Japanese import-game profile, carrying more value as a catalog curiosity than as a broadly known franchise entry. For buyers, the useful signals are the Global A credit, release year, and exact romanized title.",
  "ps2-operation-air-assault":
    "Operation Air Assault is a budget helicopter shooter from InterActive Vision and Midas, built around flying combat missions, firing on targets, and clearing straightforward military objectives. It belongs in the PAL budget-action shelf rather than among simulation-heavy flight games.",
  "ps2-operation-air-assault-2":
    "Operation Air Assault 2 follows the same budget aerial-combat lane with more mission-based helicopter shooting and simple arcade objectives. It should be tracked separately from the first game because the sequel uses a different developer credit and can be confused in listings.",
  "ps2-orange-honey-boku-wa-kimi-ni-koishiteru":
    "Orange Honey: Boku wa Kimi ni Koishiteru is a Marvelous visual novel and drama CD-adjacent romance release about character relationships, school-life scenes, and route progression. It is a story-first import title where tone, cast, and subtitle are the main identifiers.",
  "ps2-ore-no-shita-de-agake":
    "Ore no Shita de Agake is a HuneX-developed visual novel with darker relationship drama, route choices, and BL-oriented story content. The PS2 version is a specialized import release, best surfaced through its visual-novel audience and D3 Publisher credit.",
  "ps2-orega-kantoku-da-gekitou-pennant-race":
    "Orega Kantoku Da! Gekitou Pennant Race is an Enix baseball management game about acting as manager, setting lineups, making season decisions, and chasing pennant success. It is better described as a baseball strategy/management sim than an on-field action sports title.",
  "ps2-orega-kantoku-da-volume-2":
    "Orega Kantoku Da! Volume 2 continues Enix's baseball-management concept with another season-focused package of team decisions, lineup control, and pennant-race planning. It should be listed separately because the numbered volume indicates a distinct release.",
  "ps2-oretachi-game-center-zoku-akumajou-dracula":
    "Oretachi Game Center Zoku: Akumajou Dracula reissues Konami's arcade Castlevania entry, Haunted Castle, through Hamster's PS2 arcade preservation series. Its collector value comes from the specific arcade title and packaging extras rather than being a new Castlevania adventure.",
  "ps2-oretachi-game-center-zoku-burgertime":
    "Oretachi Game Center Zoku: BurgerTime brings Data East's arcade platformer to PS2, centered on climbing ladders, assembling giant burgers, and avoiding pursuing enemies. It is part of Hamster's single-title arcade reissue line, so the included arcade game is the key identifier.",
  "ps2-oretachi-game-center-zoku-crazy-climber":
    "Oretachi Game Center Zoku: Crazy Climber reissues Nichibutsu's arcade climbing game, where players scale buildings while dodging falling hazards and moving obstacles. It is a preservation-style PS2 release, useful for collectors tracking arcade history on disc.",
  "ps2-oretachi-game-center-zoku-karate-dou":
    "Oretachi Game Center Zoku: Karate Dou packages the arcade fighting game Karate Champ for PS2 through Hamster's retro reissue series. It should be described through its arcade one-on-one martial-arts roots rather than as a modern sports title.",
  "ps2-oretachi-game-center-zoku-moon-cresta":
    "Oretachi Game Center Zoku: Moon Cresta brings Nichibutsu's arcade shooter to PS2, built around docking fighter segments, shooting alien waves, and chasing high scores. It belongs in the arcade-preservation shelf of the PS2 catalog.",
  "ps2-oretachi-game-center-zoku-nekketsu-kouka-kunio-kun":
    "Oretachi Game Center Zoku: Nekketsu Kouha Kunio-kun reissues the arcade brawler that helped establish Technos Japan's Kunio-kun line. It is important for collectors because the disc represents the arcade origin of a series later known through River City-style games.",
  "ps2-oretachi-game-center-zoku-nekketsu-koukou-dodge-ball-bu":
    "Oretachi Game Center Zoku: Nekketsu Koukou Dodge Ball Bu brings the arcade dodgeball branch of the Kunio-kun series to PS2. Its appeal is fast team sports combat, character comedy, and arcade-history preservation rather than realistic sports simulation.",
  "ps2-oretachi-game-center-zoku-pooyan":
    "Oretachi Game Center Zoku: Pooyan reissues Konami's arcade shooting game about defending against waves of balloon-riding enemies. It is a compact arcade-history disc where score chasing and exact title identification matter more than modern feature depth.",
  "ps2-oretachi-game-center-zoku-quarth":
    "Oretachi Game Center Zoku: Quarth brings Konami's block-shooting puzzle game to PS2, mixing falling-block pressure with shooter-style firing. It is a useful arcade reissue for collectors because Quarth sits between puzzle and shooting genres.",
  "ps2-oretachi-game-center-zoku-rabio-lepus":
    "Oretachi Game Center Zoku: Rabio Lepus reissues Video System's arcade shooter, known in some contexts as Rabbit Punch, with side-scrolling action and distinctive character style. The PS2 disc is mainly valuable as a single-title arcade preservation release.",
  "ps2-oretachi-game-center-zoku-scramble":
    "Oretachi Game Center Zoku: Scramble brings Konami's early side-scrolling shooter to PS2, centered on fuel management, cave flying, bombs, and forward fire. It is historically important because Scramble helped shape later horizontal shooters.",
  "ps2-oretachi-game-center-zoku-sonic-wings":
    "Oretachi Game Center Zoku: Sonic Wings reissues Video System's arcade vertical shooter, also known internationally through the Aero Fighters name. It is a collector-relevant arcade disc because naming and regional series identity can easily create listing confusion.",
  "ps2-oretachi-game-center-zoku-super-volleyball":
    "Oretachi Game Center Zoku: Super Volleyball packages Video System's arcade volleyball game for PS2, preserving side-view team play and late-1980s arcade sports pacing. It belongs with Hamster's retro reissue line rather than modern simulation sports.",
  "ps2-oretachi-game-center-zoku-terra-cresta":
    "Oretachi Game Center Zoku: Terra Cresta reissues Nichibutsu's arcade vertical shooter for PS2, preserving the ship-docking power-up structure, enemy waves, and score-chasing rhythm of the original. It is part of Hamster's arcade preservation line rather than a new PS2 shooter.",
  "ps2-oretachi-game-center-zoku-thunder-cross":
    "Oretachi Game Center Zoku: Thunder Cross brings Konami's arcade horizontal shooter to PS2, with side-scrolling stages, option-style power-ups, and two-player arcade pacing. The disc is mainly useful as a focused retro reissue in Hamster's Oretachi series.",
  "ps2-oretachi-game-center-zoku-time-pilot":
    "Oretachi Game Center Zoku: Time Pilot reissues Konami's multidirectional arcade shooter, built around looping aerial dogfights across different eras and high-score play. It is an arcade-history release where the original title is the main collector signal.",
  "ps2-oretachi-game-center-zoku-trio-the-punch":
    "Oretachi Game Center Zoku: Trio the Punch preserves Data East's cult arcade action game, with strange characters, odd stage logic, and deliberately bizarre humor. It is notable less for polish than for being one of the weirder arcade titles Hamster brought to PS2.",
  "ps2-oretachi-game-center-zoku-yie-ar-kung-fu":
    "Oretachi Game Center Zoku: Yie Ar Kung-Fu brings Konami's influential arcade fighting game to PS2, centered on one-on-one martial-arts bouts against distinct opponents. It is an arcade-history disc for collectors tracking early fighting-game design.",
  "ps2-osouji-sentai-clean-keeper-h":
    "Osouji Sentai Clean Keeper H is a PS2 visual-novel adventure tied to the Clean Keeper series, using sentai parody, character routes, and fan-focused scenario material. It belongs with late PS2 Japanese story-game imports rather than action titles.",
  "ps2-othello":
    "Othello on PS2 is a straightforward digital version of the classic disc-flipping board game, focused on local or CPU matches and pure positional strategy. It is a clean board-game listing where simplicity and exact region/publisher details matter.",
  "ps2-otome-no-jijou":
    "Otome no Jijou is a Japanese romance visual novel built around school-life character routes, dialogue choices, and relationship drama. It is a niche PS2 story-game import where the title and publisher details are the primary buyer-facing identifiers.",
  "ps2-otometeki-koi-kakumei-love-revo":
    "Otometeki Koi Kakumei: Love Revo!! is an otome visual novel from HuneX about self-improvement, romance routes, and a cast of eligible characters. The PS2 version matters as a console entry for a series better known to import romance-game fans.",
  "ps2-otona-no-gal-jan-2":
    "Otona no Gal Jan 2 is Jaleco's follow-up in its adult-oriented mahjong line, built around Japanese table play, character presentation, and fan-service framing. It should be surfaced as a niche mahjong release rather than a general card or puzzle game.",
  "ps2-otona-no-gal-jan-kimi-ni-hane-man":
    "Otona no Gal Jan: Kimi ni Hane Man is a Japanese mahjong title with character-driven presentation and adult-targeted styling. Its value for collectors comes from the exact subtitle, publisher credit, and place within the PS2's large specialty mahjong catalog.",
  "ps2-otostaz":
    "Otostaz is a Sony Computer Entertainment PS2 music and rhythm release built around sound-focused play rather than conventional action. It is best framed as an experimental first-party Japanese title, with the Sony credit doing important catalog-identification work.",
  "ps2-ougon-kishi-garo":
    "Ougon Kishi Garo adapts the tokusatsu franchise into a PS2 action game, with armored hero combat, supernatural enemies, and story material aimed at fans of the show. Bandai's license makes the series connection the key reason collectors seek it out.",
  "ps2-ouka":
    "Ouka is a Pionesoft visual-novel adventure with Japanese import appeal, emphasizing character scenes, branching story material, and atmospheric presentation. It fits the PS2's late-era library of romance and drama-focused console visual novels.",
  "ps2-ouran-koukou-host-bu":
    "Ouran Koukou Host-Bu adapts the Ouran High School Host Club manga and anime into a PS2 character adventure, focused on dialogue, event scenes, and interactions with the host-club cast. It is primarily a fan-oriented media tie-in.",
  "ps2-outlaw-golf":
    "Outlaw Golf is an arcade golf game from Hypnotix that leans into irreverent characters, exaggerated presentation, and accessible swing mechanics. It stands apart from simulation golf by selling personality, mini-game energy, and party-friendly sports comedy.",
  "ps2-outlaw-golf-2":
    "Outlaw Golf 2 expands Hypnotix's rude arcade-golf formula with more characters, courses, and over-the-top personality. It remains a comedy sports game first, using golf as the structure for quick, exaggerated matches rather than strict simulation.",
  "ps2-outrun2-sp-special-tours":
    "OutRun2 SP Special Tours brings Sega's upgraded arcade racer to PS2, emphasizing drifting, branching routes, Ferrari road trips, and bright blue-sky speed. It is one of the console's more desirable arcade-racing imports because it captures the later OutRun2 SP content.",
  "ps2-over-the-monochrome-rainbow-featuring-shogo-hamada":
    "Over the Monochrome Rainbow featuring Shogo Hamada is a music-driven adventure release built around Japanese singer-songwriter Shogo Hamada, blending story presentation with artist-focused material. It is a media and music crossover title rather than a standard rhythm game.",
  "ps2-p-t-o-iv-pacific-theater-of-operations":
    "P.T.O. IV: Pacific Theater of Operations is Koei's World War II naval strategy game about commanding fleets, managing resources, and fighting across the Pacific. It belongs with Koei's historical simulation catalog, where planning and theater-level decisions drive the appeal.",
  "ps2-pachi-slot-aruze-oukoku-6":
    "Pachi-Slot Aruze Oukoku 6 is an Aruze pachislot simulation that recreates specific Japanese slot machines for home play, with odds practice, machine settings, and cabinet-focused presentation. It is a specialist gambling-machine release for collectors of pachislot software.",
  "ps2-pachi-slot-aruze-oukoku-7":
    "Pachi-Slot Aruze Oukoku 7 continues Aruze's machine-specific pachislot simulation line on PS2, focusing on authentic reel behavior and home study of Japanese slot cabinets. The numbered entry should be tracked separately because each volume covers a different machine selection.",
  "ps2-pachi-slot-club-collection-im-juggler-ex-juggler-selection":
    "Pachi-Slot Club Collection: IM Juggler EX - Juggler Selection is a Commseed pachislot simulator centered on Juggler-series machines, where timing, payout tables, and cabinet recreation are the draw. It is a machine-study release rather than a casino compilation.",
  "ps2-pachi-slot-club-collection-pachi-slot-dayo-koumon-chama":
    "Pachi-Slot Club Collection: Pachi-Slot Dayo Koumon Chama recreates the Koumon Chama pachislot machine for PS2, preserving its themed presentation and slot behavior. It belongs in the specialized Japanese pachislot shelf where machine identity matters most.",
  "ps2-pachi-slot-higurashi-no-naku-koro-ni-matsuri":
    "Pachi-Slot Higurashi no Naku Koro ni Matsuri adapts the Higurashi-themed pachislot machine to PS2, combining slot simulation with branding from the horror mystery series. It is relevant both to pachislot collectors and fans tracking Higurashi console releases.",
  "ps2-pachi-slot-kanzen-kouryaku-gigazone":
    "Pachi-Slot Kanzen Kouryaku: Gigazone is a PS2 strategy/practice disc for the Gigazone pachislot machine, aimed at learning patterns, settings, and payout behavior. The appeal is accurate machine reference rather than broad arcade gameplay.",
  "ps2-pachi-slot-kanzen-kouryoku-onihama-bakusou-gurentai-gekitou-hen":
    "Pachi-Slot Kanzen Kouryoku: Onihama Bakusou Gurentai: Gekitou-Hen brings the biker-themed Onihama pachislot machine to PS2 for practice and collection. Its long subtitle is important because it identifies the specific machine variant being simulated.",
  "ps2-pachi-slot-kanzen-kouryoku-slot-genjin":
    "Pachi-Slot Kanzen Kouryoku: Slot Genjin is a Success pachislot simulator focused on the Slot Genjin machine, with cabinet-specific presentation and practice tools. It is best described through its exact machine license rather than as a general gambling game.",
  "ps2-pachi-slot-king-kagaku-ninja-tai-gatchaman":
    "Pachi-Slot King! Kagaku Ninja-Tai Gatchaman adapts a Gatchaman-branded pachislot machine for PS2, pairing slot simulation with imagery from the classic anime property. It has crossover interest for both pachislot collectors and Gatchaman fans.",
  "ps2-pachi-slot-nobunaga-no-yabou-tenka-sousei":
    "Pachi-Slot Nobunaga no Yabou: Tenka Sousei turns Koei's Nobunaga's Ambition branding into a pachislot simulation, using Sengoku-era presentation around machine practice. It should not be confused with the main historical strategy releases sharing the name.",
  "ps2-pachi-slot-toukon-denshou":
    "Pachi-Slot Toukon Denshou is a Success pachislot release built around machine-specific play, payout study, and Japanese slot presentation. It is a focused simulation disc where the title and publisher are the most useful catalog details.",
  "ps2-pachi-slot-winning-post":
    "Pachi-Slot Winning Post is a Koei pachislot simulation using the Winning Post horse-racing brand, blending gambling-machine play with racing-themed presentation. It is distinct from the main Winning Post management games despite sharing the series name.",
  "ps2-pachinko-de-yubou-fever-dodeka-saurus":
    "Pachinko de Yubou! Fever Dodeka Saurus is a PS2 pachinko simulator built around the Fever Dodeka Saurus machine, with cabinet recreation and home practice as the focus. It is a specialist release for players tracking specific pachinko hardware.",
  "ps2-pachipara-12-ooumi-to-natsu-no-omoide":
    "PachiPara 12: Ooumi to Natsu no Omoide continues Irem's pachinko-centered series, combining machine simulation with the franchise's slice-of-life Pachi-Pro Fuunroku adventure elements. It offers more context and character play than a bare cabinet simulator.",
  "ps2-pachipara-13-super-umi-to-pachi-pro-fuunroku":
    "PachiPara 13: Super Umi to Pachi-Pro Fuunroku pairs Super Umi pachinko simulation with Irem's story-driven Pachi-Pro mode, where players move through social scenes around the pachinko lifestyle. It is one of the series entries with stronger adventure-game identity.",
  "ps2-pachipara-14-fu-to-kumo-to-super-umi-in-okinawa":
    "PachiPara 14: Fu to Kumo to Super Umi in Okinawa uses the Super Umi in Okinawa machine theme and wraps it in Irem's pachinko-life adventure structure. It is both a machine recreation and a late PS2 lifestyle sim for series followers.",
  "ps2-pachitte-chonmage-tatsujin-2-cr-jurassic-park":
    "Pachitte Chonmage Tatsujin 2: CR Jurassic Park recreates a Jurassic Park-branded pachinko machine on PS2, focusing on cabinet behavior, themed animations, and practice play. It is notable because the licensed theme makes the specific volume easier to identify.",
  "ps2-pachitte-chonmage-tatsujin-3":
    "Pachitte Chonmage Tatsujin 3 is a Hack Berry pachinko simulation volume focused on accurate machine recreation and home practice. Like the rest of the series, its collector value depends on which cabinet version the numbered release preserves.",
  "ps2-pachitte-chonmage-tatsujin-4":
    "Pachitte Chonmage Tatsujin 4 continues Hack Berry's pachinko simulator line with another machine-specific PS2 package. It is a utility-like gambling-machine release rather than a broad arcade title, so volume number and machine identity are the key details.",
  "ps2-pachitte-chonmage-tatsujin-5-cr-kamen-rider":
    "Pachitte Chonmage Tatsujin 5: CR Kamen Rider brings a Kamen Rider pachinko cabinet to PS2, pairing machine practice with tokusatsu-themed presentation. The licensed branding gives it crossover appeal beyond the usual pachinko-simulation audience.",
  "ps2-pachitte-chonmage-tatsujin-6-cr-pachinko-yellow-cab":
    "Pachitte Chonmage Tatsujin 6: CR Pachinko Yellow Cab recreates the Yellow Cab-themed pachinko machine for PS2, emphasizing cabinet-specific rules, audiovisual presentation, and practice play. It is a specialized Japanese machine-simulation release.",
  "ps2-pachitte-chonmage-tatsujin-7-cr-pachinko-dokaben":
    "Pachitte Chonmage Tatsujin 7: CR Pachinko Dokaben adapts a Dokaben-branded pachinko machine, bringing the baseball manga/anime theme into Hack Berry's simulation series. It is useful to list by full subtitle because that license defines the volume.",
  "ps2-pachitte-chonmage-tatsujin-8":
    "Pachitte Chonmage Tatsujin 8 is a later Hack Berry pachinko simulator for PS2, continuing the series' focus on recreating specific Japanese machines for home practice. The numbered volume matters because these releases are bought and cataloged by exact cabinet lineup rather than by broad gameplay changes.",
  "ps2-pachitte-chonmage-tatsujin-9-pachinko-mitokoumon":
    "Pachitte Chonmage Tatsujin 9: Pachinko Mitokoumon is built around a Mito Komon-themed pachinko machine, mixing cabinet simulation with period-drama branding. It belongs in the PS2 library as a machine-specific import where the subtitle is the clearest way to separate it from other Hack Berry volumes.",
  "ps2-pachitte-chonmage-tatsujin-10-pachinko-fuyu-no-sonata":
    "Pachitte Chonmage Tatsujin 10: Pachinko Fuyu no Sonata recreates a Winter Sonata-themed pachinko machine, reflecting the drama franchise's popularity in Japan. Its appeal is not arcade variety but faithful machine behavior, presentation, and the unusual licensed theme.",
  "ps2-pachitte-chonmage-tatsujin-11-pachinko-kaou-misora-hibari":
    "Pachitte Chonmage Tatsujin 11: Pachinko Kaou: Misora Hibari centers on a pachinko machine themed around the famed Japanese singer Misora Hibari. For collectors, the celebrity-machine branding and long subtitle are more important identifiers than the series number alone.",
  "ps2-pachitte-chonmage-tatsujin-12-pachinko-ultraman":
    "Pachitte Chonmage Tatsujin 12: Pachinko Ultraman brings an Ultraman-themed pachinko cabinet to PS2, combining Hack Berry's machine-practice format with a major tokusatsu license. It has crossover interest for Ultraman collectors as well as pachinko simulation fans.",
  "ps2-pachitte-chonmage-tatsujin-13-pachinko-hissatsu-shigotojin-iii":
    "Pachitte Chonmage Tatsujin 13: Pachinko Hissatsu Shigotojin III simulates a cabinet tied to the Hissatsu period-drama franchise. The game is best understood as a preservation-style machine release, where the value lies in the exact licensed cabinet and settings rather than a conventional story mode.",
  "ps2-pachitte-chonmage-tatsujin-14-pachinko-kamen-rider-shocker-zenmetsu-daisakusen":
    "Pachitte Chonmage Tatsujin 14: Pachinko Kamen Rider: Shocker Zenmetsu Daisakusen adapts a Kamen Rider pachinko machine with villain-themed presentation around Shocker. Its long name is essential because the Kamen Rider license, not the generic pachinko format, defines the release.",
  "ps2-pachitte-chonmage-tatsujin-15-pachinko-fuyu-no-sonata-2":
    "Pachitte Chonmage Tatsujin 15: Pachinko Fuyu no Sonata 2 returns to the Winter Sonata pachinko theme with a later machine version. It should be treated as a distinct cabinet simulation rather than a duplicate of volume 10, since pachinko releases often track specific machine revisions.",
  "ps2-pachitte-chonmage-tatsujin-16-pachinko-hissatsu-shigotonin-iii":
    "Pachitte Chonmage Tatsujin 16: Pachinko Hissatsu Shigotonin III continues Hack Berry's licensed pachinko line with another Hissatsu-themed cabinet. For PS2 collectors, the key distinction is the exact machine/subtitle pairing within a long run of similar-looking import releases.",
  "ps2-pachitte-chonmage-tatsujin-cr-nettou-power-pro-kun":
    "Pachitte Chonmage Tatsujin: CR Nettou Power Pro Kun turns Konami's Power Pro baseball mascot branding into a pachinko-machine simulation. It is notable because it intersects with a major sports-game series while still playing as a cabinet-practice release.",
  "ps2-pacific-warriors-ii-dogfight":
    "Pacific Warriors II: Dogfight is an arcade-style World War II air-combat game focused on short missions, aerial targets, and accessible dogfighting rather than deep flight simulation. It is a budget-era PS2 release where the hook is quick combat in historic aircraft scenarios.",
  "ps2-paddington-bear":
    "Paddington Bear adapts the children's character into a simple PS2 adventure/activity release aimed at younger players. The game is mainly relevant as licensed family software, with collectability tied to the Paddington brand and the small Blast! Entertainment catalog.",
  "ps2-pai-chenjan":
    "Pai Chenjan is an Agenda mahjong release for PS2, centered on tile-matching rules, opponent play, and Japanese table-game presentation. It fits the console's large import library of dedicated board and parlor games rather than the mainstream action or RPG shelf.",
  "ps2-pandora-kimi-no-namae-o-boku-wa-shiru":
    "Pandora: Kimi no Namae o Boku wa Shiru is an Otomate visual novel from Idea Factory built around character routes, supernatural mystery, and dialogue-driven progression. It is a niche import title where audience interest comes from otome storytelling and cast appeal.",
  "ps2-panel-quiz-attack-25":
    "Panel Quiz Attack 25 adapts the long-running Japanese television quiz format into a PS2 trivia game, using panel control and question-answer play as its structure. It is best cataloged as a TV-format quiz release rather than a generic party game.",
  "ps2-panic-palette":
    "Panic Palette is a Takuyo visual novel with romantic comedy, school-life routes, and character-focused scenario choices. The PS2 version is part of the system's deep Japanese adventure catalog, where publisher, route structure, and complete packaging are important details.",
  "ps2-paparazzi":
    "Paparazzi is a D3 Publisher budget release developed by HuneX, built around celebrity-photo fantasy, light adventure structure, and quick scenario play. It sits in the Simple-series-adjacent side of the PS2 library rather than in conventional action design.",
  "ps2-para-para-paradise":
    "Para Para Paradise brings Konami's arcade dance game to PS2, using hand-motion sensors and Eurobeat-style routines instead of the foot-panel setup of Dance Dance Revolution. It is one of the more unusual rhythm-game hardware releases on the system.",
  "ps2-parfait-chocolat-second-style":
    "Parfait: Chocolat Second Style is a visual novel about cafe work, relationships, and branching character routes, adapted for console audiences by Alchemist. It is a story-first import release where tone, route cast, and edition details matter more than action systems.",
  "ps2-party-carnival":
    "Party Carnival is a budget minigame collection from HuneX and D3 Publisher, aimed at quick local party play rather than a single campaign. It belongs with the PS2's broad European/Japanese value-label library of simple multiplayer diversions.",
  "ps2-party-girls":
    "Party Girls is a Tamsoft-developed D3 Publisher budget title centered on light party-style play and character presentation. It is a niche Simple-line-era release where exact region branding and publisher imprint help distinguish it from similarly named budget software.",
  "ps2-patisserie-na-nyanko":
    "Patisserie na Nyanko is a Pionesoft visual novel built around a pastry-shop setting, relationship routes, and gentle slice-of-life scenario progression. It is a small import adventure title with appeal for collectors following cafe-themed console visual novels.",
  "ps2-perfect-ace-2-the-championships":
    "Perfect Ace 2: The Championships is a tennis game focused on rallies, shot timing, tournament play, and accessible court action. It is a lower-profile PAL sports sequel, so title accuracy and publisher details are useful for separating it from other budget tennis releases.",
  "ps2-perfect-ace-pro-tournament-tennis":
    "Perfect Ace: Pro Tournament Tennis is an Aqua Pacific tennis release built around exhibition matches, tournaments, and straightforward shot control. Its role in the PS2 library is as an affordable sports entry rather than a licensed simulation showcase.",
  "ps2-petanque-pro":
    "Petanque Pro brings the French boules sport to PS2, focusing on aiming, throwing strength, terrain, and placement strategy. It is a distinctive European sports oddity because the subject is rarely represented in console libraries.",
  "ps2-peter-pan":
    "Peter Pan is a Phoenix Games budget release using the familiar fairy-tale character in a simple family-oriented format. Its importance is mostly catalog and collecting context, since Phoenix titles are often tracked by license, region, and packaging rather than mechanical depth.",
  "ps2-petit-four":
    "Petit Four is an Idea Factory and Design Factory visual novel centered on character routes, dialogue choices, and romantic scenario progression. It is part of the PS2's sizable otome catalog and should be presented as story-first import software.",
  "ps2-petz-catz-2":
    "Petz: Catz 2 is a pet-care adventure from Ubisoft and Yuke's, built around caring for cats, exploring light quest areas, and interacting with a young-player-friendly world. It is more structured than a bare pet simulator, with licensed family-game appeal.",
  "ps2-petz-dogz-2":
    "Petz: Dogz 2 gives Ubisoft's pet series a simple adventure framework, mixing dog care with exploration and approachable objectives for younger players. It pairs naturally with Catz 2 for collectors tracking Ubisoft's PS2 family releases.",
  "ps2-petz-horsez-2":
    "Petz: Horsez 2 focuses on horse care, riding, training, and story-light progression within Ubisoft's family software line. It is best understood as an accessible animal-care game rather than a realistic equestrian simulation.",
  "ps2-phantasy-star-universe":
    "Phantasy Star Universe moves Sega's online RPG lineage into a new sci-fi setting with real-time party combat, weapon types, missions, and a separate story campaign. On PS2 it is important because online-service history affects how the game is understood today.",
  "ps2-pia-carrot-e-youkoso-3":
    "Pia Carrot e Youkoso!! 3 is a restaurant-themed visual novel about part-time work, relationships, and branching routes around the Pia Carrot setting. The PS2 release is part of a long-running romance-adventure series with strong import-collector recognition.",
  "ps2-pia-carrot-e-youkoso-g-o-summer-fair":
    "Pia Carrot e Youkoso!! G.O. Summer Fair is a console visual novel entry built around the series' restaurant setting, seasonal tone, and character-route structure. It is mainly for collectors following the Pia Carrot line across platforms and editions.",
  "ps2-pia-carrot-e-youkoso-g-p-gakuen-princess":
    "Pia Carrot e Youkoso!! G.P. Gakuen Princess shifts the familiar romance-adventure formula toward a school-focused setup while keeping route-based visual novel play. It should be cataloged as a distinct Pia Carrot console entry rather than a generic dating sim.",
  "ps2-pilot-down-behind-enemy-lines":
    "Pilot Down: Behind Enemy Lines is a World War II survival and stealth-action game about an Allied pilot trying to escape through enemy territory. Its appeal comes from evasion, resource pressure, and wartime atmosphere rather than traditional flight combat.",
  "ps2-pilot-ni-narou-2":
    "Pilot ni Narou! 2 is a Japanese flight-training simulation that focuses on learning aircraft operation, flight procedures, and aviation challenges. It is a specialized PS2 sim where the interest is piloting discipline rather than arcade dogfighting.",
  "ps2-pimp-my-ride-street-racing":
    "Pimp My Ride: Street Racing uses the MTV car-customization brand for arcade street races, vehicle upgrades, and style-focused progression. It is a late PS2 licensed racer whose identity is tied as much to the television property as to its driving model.",
  "ps2-pinball-fun":
    "Pinball Fun is a D3 Publisher budget pinball release developed by HuneX, centered on simple table play, score chasing, and quick sessions. It is a modest arcade-style entry within the PS2's value-label catalog.",
  "ps2-pink-pong":
    "Pink Pong is a D3 Publisher table-tennis themed budget title from HuneX, built around quick paddle exchanges and character-forward presentation. It is one of the platform's small Simple-line sports curiosities rather than a mainstream tennis-table simulation.",
  "ps2-pinocchio":
    "Pinocchio is a Phoenix Games family release built around the classic fairy-tale character, simple presentation, and young-player accessibility. It is mainly useful for collectors tracking budget licensed software and PAL-region oddities.",
  "ps2-pirates-legend-of-the-black-buccaneer":
    "Pirates: Legend of the Black Buccaneer is an action-adventure game with island exploration, combat, platforming, and supernatural pirate themes. It is a mid-budget PS2 release where the appeal is swashbuckling atmosphere rather than a famous franchise license.",
  "ps2-piyo-tan-oyashiki-sennyu-daisakusen":
    "Piyo-Tan: Oyashiki Sennyu Daisakusen! is a Prototype visual novel/adventure release centered on mansion infiltration, character scenes, and route-based story progression. It is a niche Japanese title where the exact romanized subtitle helps prevent catalog confusion.",
  "ps2-pizzicato-polka-suisei-genya":
    "Pizzicato Polka: Suisei Genya is a KID visual novel built around romantic routes, character drama, and branching scenario choices. It belongs with the PS2's large library of console visual novel ports and import-only adventure releases.",
  "ps2-plarail-yume-ga-ippai":
    "Plarail: Yume ga Ippai! adapts Tomy's toy train brand into a PS2 family game, emphasizing train-themed play, colorful presentation, and toy-line recognition. It is especially relevant for collectors who track video games tied to physical toy properties.",
  "ps2-playwize-poker-and-casino":
    "Playwize Poker & Casino is a budget casino compilation with poker and table-game variants designed for quick offline play. Its PS2 library role is straightforward: a value-label gambling-game package rather than a licensed casino simulation.",
  "ps2-plus-plumb-2-again":
    "Plus Plumb 2 Again is a Takuyo puzzle release focused on matching, clearing, and repeatable score-style play. It is a compact Japanese puzzle entry where the sequel title and publisher help distinguish it from more visible arcade puzzlers.",
  "ps2-pochinya":
    "Pochinya is a Bandai puzzle game built around animal-themed matching and approachable board-clearing play. It is a small Japanese PS2 release with collector interest tied to Bandai's family-friendly puzzle output.",
  "ps2-poi-hito-natsu-no-keiken":
    "Poi! Hito Natsu no Keiken!? is an Idea Factory and Design Factory visual novel about a summer scenario, character routes, and choice-driven progression. It should be presented as a niche story/adventure import, not as a conventional action game.",
  "ps2-poinie-s-poin":
    "Poinie's Poin is a Sony Computer Entertainment action-adventure with colorful character design, light exploration, and playful world interaction. It is a lesser-known first-party PS2 release, which makes accurate naming and regional context useful for collectors.",
  "ps2-poker-masters":
    "Poker Masters is a budget PS2 card-game release centered on poker tables, betting decisions, and repeated casino-style sessions. It is best presented as a straightforward gambling-game package rather than a broad casino compilation.",
  "ps2-polaroid-pete":
    "Polaroid Pete is Irem's photo-action game known in Japan as Gekibo 2, asking players to move through chaotic scenes and capture specific photo moments. Its camera gimmick makes it more distinctive than a normal action game, especially for collectors who follow Irem's stranger PS2 output.",
  "ps2-police-24-7":
    "Police 24/7 is Konami's arcade-style light-gun police shooter for PS2, built around aiming, suspect encounters, and motion-aware dodging when used with supported hardware. It is a policing-themed action release where the arcade lineage matters more than story depth.",
  "ps2-police-chase-down":
    "Police Chase Down is the western title for a D3 Publisher Simple-series police pursuit game from Tamsoft, focused on chasing vehicles, stopping criminals, and quick mission play. It should be understood as budget action software, not a full open-world police sim.",
  "ps2-pool-paradise":
    "Pool Paradise is a billiards game set around a relaxed island resort, mixing pool-table rules with a vacation atmosphere and challenge progression. Archer Maclean's design lineage gives it more personality than a generic pool listing suggests.",
  "ps2-pool-paradise-international-edition":
    "Pool Paradise: International Edition is a later PS2 edition of the island-themed billiards game, preserving cue control, trick shots, and resort-style presentation. It should be cataloged separately where regional packaging or edition naming differs.",
  "ps2-pop-n-music-7":
    "Pop'n Music 7 brings Konami's colorful arcade rhythm series to PS2 with large-button note charts, character art, and a song list tied to the seventh arcade entry. It is part of the system's deep Japanese rhythm-game library.",
  "ps2-pop-n-music-8":
    "Pop'n Music 8 continues Konami's PS2 rhythm line with another arcade song set, bright character presentation, and timing-heavy chart play. The numbered entry matters because Pop'n Music releases are often collected by song list and arcade generation.",
  "ps2-pop-n-music-9":
    "Pop'n Music 9 is another PS2 home version of Konami's button-based arcade rhythm series, expanding the home library with its own track selection and character themes. It is aimed at dedicated music-game players rather than casual party play.",
  "ps2-pop-n-music-10":
    "Pop'n Music 10 preserves the tenth arcade-era song identity on PS2, with fast note lanes, colorful genre labels, and repeat-focused score improvement. It belongs with Konami's specialist rhythm catalog beside Beatmania and DDR.",
  "ps2-pop-n-music-11":
    "Pop'n Music 11 is a late PS2 entry in Konami's arcade-to-home rhythm pipeline, built around mastering song charts and collecting a specific numbered track set. Its value is strongest for series fans who care about which arcade version each disc represents.",
  "ps2-pop-n-music-12-iroha":
    "Pop'n Music 12 Iroha gives the PS2 series an Iroha-themed entry with its own song roster, visual motifs, and arcade rhythm structure. The subtitle is important because Pop'n Music numbering and theme names help identify the exact release.",
  "ps2-pop-n-music-13-carnival":
    "Pop'n Music 13 Carnival brings the Carnival arcade theme home, keeping the series' button-timing rhythm play and colorful character style intact. It is a collector-facing rhythm release where the subtitle and song list are the real draw.",
  "ps2-pop-n-music-14-fever":
    "Pop'n Music 14 Fever! is one of the later PS2 Pop'n Music entries, carrying the Fever theme, arcade chart play, and Konami's bright rhythm-game presentation. It should be listed as a distinct home release rather than collapsed into the broader series.",
  "ps2-pop-n-music-best-hits":
    "Pop'n Music: Best Hits is a PS2 compilation-style rhythm release that gathers selected tracks from Konami's button-based arcade series. It is useful for players who want a sampler disc rather than one arcade version's song identity.",
  "ps2-pop-n-taisen-puzzle-dama-online":
    "Pop'n Taisen Puzzle-Dama Online blends Konami's Pop'n character style with competitive falling-block puzzle play and online-era PS2 features. It is a puzzle spin-off, not a rhythm game, so the Puzzle-Dama connection should be clear.",
  "ps2-popcap-hits-vol-1":
    "PopCap Hits! Vol. 1 packages several PopCap casual puzzle games for PS2, bringing PC-style short-session design to the console. Its appeal is the collection format and recognizable PopCap brand rather than one single flagship mode.",
  "ps2-popcap-hits-vol-2":
    "PopCap Hits! Vol. 2 continues the PS2 casual-game compilation approach with another set of PopCap puzzle and arcade titles. It should be cataloged as a companion volume because each disc carries a different selection.",
  "ps2-popolocrois-hajimari-no-bouken":
    "PoPoLoCrois: Hajimari no Bouken brings Sony's storybook fantasy RPG series to PS2 with gentle character drama, exploration, and turn-based adventure structure. It is an important continuation of a Japan-first PlayStation RPG property.",
  "ps2-popolocrois-tsuki-no-okite-no-bouken":
    "PoPoLoCrois: Tsuki no Okite no Bouken is a PS2 follow-up in Sony's storybook RPG line, continuing the warm fantasy tone and character-driven adventure style. It should be kept separate from Hajimari no Bouken because each game covers a different chapter of the series.",
  "ps2-postman-pat":
    "Postman Pat is a Blast! Entertainment family release based on the British children's television character, built around simple tasks and young-player-friendly presentation. It is licensed kids' software, not a role-playing game.",
  "ps2-power-volleyball":
    "Power Volleyball is a Phoenix Games budget sports release focused on basic volleyball matches, serves, returns, and quick arcade-style play. Its role in the PS2 catalog is as a low-cost European sports title rather than a simulation showcase.",
  "ps2-powershot-pinball":
    "Powershot Pinball is a budget PS2 pinball release with flipper timing, table targets, and score-chasing play. It belongs in the arcade/table-game shelf, not the broader sports category.",
  "ps2-premier-manager-08":
    "Premier Manager 08 is a late PS2 football-management entry about picking squads, handling transfers, setting tactics, and guiding a club through a season. It is for players who want team decisions rather than on-pitch arcade control.",
  "ps2-premier-manager-09":
    "Premier Manager 09 continues Zoo's football-management series with updated season context, squad administration, and tactical planning. The annual label matters because these management games are tied to roster-era expectations.",
  "ps2-premier-manager-2003-04":
    "Premier Manager 2003-04 brings club-management football to PS2 with transfers, training, tactics, and match results shaped by decisions off the pitch. It should be framed as management simulation rather than a conventional soccer game.",
  "ps2-premier-manager-2004-2005":
    "Premier Manager 2004-2005 updates the football-management formula for another season, keeping focus on squad building and club strategy. Collectors should see it as an annualized management entry with date-specific value.",
  "ps2-premier-manager-2005-2006":
    "Premier Manager 2005-2006 is a football-management sim about running a club through roster moves, tactical choices, and season goals. It belongs with the PS2's management-sports niche rather than action sports games.",
  "ps2-premier-manager-2006-2007":
    "Premier Manager 2006-2007 is a football-management release, despite old metadata misframing it as a shooter. The game centers on club administration, transfers, training, and tactical planning for the 2006-07 season.",
  "ps2-pri-saga-princess-o-sagase":
    "Pri-Saga! Princess o Sagase! is an Abel Software visual novel/adventure with fantasy romance framing, route progression, and character-driven scenes. It should be presented as niche Japanese story software rather than a strategy game.",
  "ps2-primopuel":
    "Primopuel is a Bandai communication and character-simulation release tied to the Primopuel interactive toy line. It belongs with PS2's toy and lifestyle software, where the appeal is caring for or interacting with a mascot-like character.",
  "ps2-prince-of-tennis-form-the-strongest-team":
    "Prince of Tennis: Form the Strongest Team! adapts the tennis manga and anime into a team-building sports game where character selection and training matter alongside matches. It is fan-focused licensed software rather than a generic tennis sim.",
  "ps2-princess-concerto":
    "Princess Concerto is a Broccoli-published fantasy strategy RPG from Headlock, combining princess-themed story material with party combat and scenario progression. It should not be categorized as a rhythm game.",
  "ps2-princess-maker-5":
    "Princess Maker 5 continues Gainax's life-raising simulation series, asking players to guide a young girl's schedule, education, relationships, and future outcomes. The PS2 version is a late entry in one of Japan's best-known raising-sim lines.",
  "ps2-princess-nightmare":
    "Princess Nightmare is a Karin Entertainment gothic romance visual novel about vampire-family drama, supernatural characters, and route-based story choices. Its PS2 release is a notable import for fans of darker otome-adjacent visual novels.",
  "ps2-private-nurse-maria":
    "Private Nurse: Maria is a Datam Polystar visual novel centered on hospital, illness, and relationship drama through character-route storytelling. It is a story-first console port where tone and scenario context matter more than mechanics.",
  "ps2-pro-biker-2":
    "Pro Biker 2 is a Phoenix Games budget motorcycle racer focused on simple bike handling, road competition, and quick race events. It belongs with the PS2's European value-label racing shelf.",
  "ps2-pro-bull-riders-out-of-the-chute":
    "Pro Bull Riders: Out of the Chute adapts professional bull riding into timing-based rodeo competition, with riders trying to stay mounted and score across events. It is unusual because bull riding is rarely the central subject of console sports games.",
  "ps2-pro-evolution-soccer":
    "Pro Evolution Soccer is Konami's simulation-minded football series on PS2, known for responsive passing, tactical play, and a feel that made it a serious FIFA rival during the generation. It is one of the platform's defining sports brands.",
  "ps2-pro-evolution-soccer-2010":
    "Pro Evolution Soccer 2010 is one of the final PS2-era entries in Konami's football series, carrying late-generation roster context and refined versions of the familiar PES match engine. It matters because the PS2 line continued long after newer consoles arrived.",
  "ps2-pro-evolution-soccer-management":
    "Pro Evolution Soccer Management shifts Konami's football brand away from direct match control and into club management, tactics, transfers, and season decisions. It should be surfaced as a management spin-off, not a standard PES entry.",
  "ps2-pro-mahjong-kiwame-next":
    "Pro Mahjong Kiwame Next is Athena's PS2 entry in the serious Kiwame mahjong line, focused on Japanese mahjong rules, CPU competition, and table strategy. It is dedicated mahjong software rather than a generic puzzle game.",
  "ps2-pro-yakyu-japan-2001":
    "Pro Yakyū Japan 2001 is a Konami baseball game built around Japanese pro baseball presentation, teams, and match play from the early PS2 era. It belongs with the system's deep NPB-focused sports catalog.",
  "ps2-pro-yakyu-netsu-star-2006":
    "Pro Yakyū Netsu Star 2006 is Namco's Japanese pro-baseball entry for PS2, focused on seasonal baseball play, batting, pitching, and team competition. The annual title helps identify the roster era and separates it from nearby Netsu Star releases.",
  "ps2-pro-yakyu-netsu-star-2007":
    "Pro Yakyū Netsu Star 2007 is a Bandai Namco baseball release, despite old metadata misclassifying it as a shooter. It is about Japanese pro-baseball match play, roster-era context, and annual sports presentation.",
  "ps2-pro-yakyu-simulation-dugout-03-the-turning-point":
    "Pro Yakyū Simulation Dugout '03: The Turning Point is a baseball-management simulation from DigiCube, focused on team decisions, season planning, and running a club rather than batting every pitch. It belongs with management sports software.",
  "ps2-pro-yakyu-spirits-2":
    "Pro Yakyū Spirits 2 continues Konami's simulation-focused Japanese baseball series with realistic batting, pitching, fielding, and NPB-style presentation. It is part of one of Japan's most important baseball game lines.",
  "ps2-pro-yakyu-spirits-3":
    "Pro Yakyū Spirits 3 is a Konami NPB baseball sim with a focus on authentic player movement, pitching duels, and season-style play. It should be identified by number because Pro Yakyū Spirits has several PS2 releases clustered close together.",
  "ps2-pro-yakyu-spirits-4":
    "Pro Yakyū Spirits 4 updates Konami's Japanese baseball simulation line for another season, preserving the series' more realistic approach to batting, pitching, and presentation. It is a sports-sim entry rather than arcade baseball.",
  "ps2-pro-yakyu-spirits-5":
    "Pro Yakyū Spirits 5 is a late PS2 entry in Konami's NPB baseball sim series, built around realistic match play and season-era rosters. It pairs with the later Kanzenban edition but should be listed separately.",
  "ps2-pro-yakyu-spirits-5-kanzenban":
    "Pro Yakyū Spirits 5 Kanzenban is the expanded or updated edition of Pro Yakyū Spirits 5, preserving Konami's realistic Japanese baseball simulation with revised content. The Kanzenban label is important for collectors comparing editions.",
  "ps2-pro-yakyu-spirits-6":
    "Pro Yakyū Spirits 6 is one of the final PS2 entries in Konami's realistic Japanese baseball series, notable because the platform continued receiving NPB releases late into its lifespan. It should be framed around simulation baseball and annual context.",
  "ps2-pro-yakyu-spirits-2004":
    "Pro Yakyū Spirits 2004 is an early PS2 entry in Konami's realistic baseball line, focused on Japanese pro teams, precise pitching, batting timing, and season-style play. It marks the series before the later numbered releases.",
  "ps2-pro-yakyu-spirits-2004-climax":
    "Pro Yakyū Spirits 2004 Climax is an updated 2004 edition of Konami's Japanese baseball sim, likely tied to later-season or expanded roster context. It should be separated from the base 2004 release because the Climax label signals a distinct version.",
  "ps2-pro-yakyu-spirits-2010":
    "Pro Yakyū Spirits 2010 is a very late PS2 baseball simulation from Konami, showing how long the console remained relevant for Japanese sports releases. It is useful for collectors because late PS2 sports titles can be easy to overlook.",
  "ps2-pro-yakyu-team-o-tsukurou-2":
    "Pro Yakyū Team o Tsukurou! 2 is Sega and Smilebit's baseball-management game about building a Japanese pro team, developing players, and managing a club across seasons. It is management-first, not an arcade baseball title.",
  "ps2-pro-yakyu-team-o-tsukurou-3":
    "Pro Yakyū Team o Tsukurou! 3 continues Sega's baseball team-building simulation with roster construction, player development, and front-office strategy. It is for players who enjoy the business and management side of NPB baseball.",
  "ps2-pro-yakyu-team-o-tsukurou-2003":
    "Pro Yakyū Team o Tsukurou! 2003 is another Sega baseball-management entry tied to the 2003 season, focused on creating and running an NPB club. The year label matters because the series' value is closely tied to roster-era context.",
  "ps2-project-arms":
    "Project Arms adapts the manga and anime into a PS2 action game built around superpowered battles, character abilities, and story material from the source. It is mainly for fans who want the ARMS cast in a playable form rather than a broad action showcase.",
  "ps2-project-fifa-world-cup-sorenara-kimi-ga-daihyo-kantoku":
    "Project FIFA World Cup: Sorenara Kimi ga Daihyo Kantoku is a soccer-management release about guiding a national side through tactics, squad decisions, and World Cup-style stakes. It is strategy-minded football software rather than a standard FIFA match game.",
  "ps2-project-minerva":
    "Project Minerva is a D3 Publisher action game starring a special-operations heroine in mission-based third-person combat. Its appeal is early-2000s tactical action flavor, character progression, and B-game military spectacle.",
  "ps2-project-minerva-professional":
    "Project Minerva Professional is an expanded version of Project Minerva with the same heroine-led tactical action premise and additional content. It is the version to track separately when comparing the original Japanese release and later editions.",
  "ps2-prostroke-golf-world-tour-2007":
    "ProStroke Golf: World Tour 2007 focuses on analog-style swing control, shot shaping, and realistic course management. It aims at players who want a more technical golf feel than mascot or arcade golf games.",
  "ps2-pryzm-chapter-one-the-dark-unicorn":
    "Pryzm Chapter One: The Dark Unicorn is a fantasy action adventure about a young heroine battling corruption, exploring colorful worlds, and restoring life to damaged areas. It has a storybook tone and early PS2 character-adventure structure.",
  "ps2-psychic-force-complete":
    "Psychic Force Complete collects Taito's arena-fighting series material on PS2, built around airborne one-on-one battles, ranged psychic attacks, and character-specific abilities. It is the most convenient console package for that cult fighting line.",
  "ps2-psyvariar-revision":
    "Psyvariar Revision is a vertical shooter where grazing enemy bullets powers up the ship, turning danger into the central scoring system. The PS2 version preserves the arcade game's tense risk-reward rhythm.",
  "ps2-psyvariar-medium-unit":
    "Psyvariar: Medium Unit is the earlier arcade shooter variant built around the same bullet-grazing level-up mechanic. It is important to separate from Revision because shooter fans track the differences between the two versions.",
  "ps2-pump-it-up-exceed":
    "Pump It Up Exceed brings Andamiro's five-panel dance-arcade series to PS2 with step charts, licensed music, and mat-based play. It is a rhythm-game release for players who prefer Pump It Up's diagonal-panel layout over Dance Dance Revolution.",
  "ps2-pure-pure-mimi-to-shippo-no-monogatari":
    "Pure Pure: Mimi to Shippo no Monogatari is a Japanese romance visual novel with animal-ear character theming, route choices, and character-focused scenes. It sits in the PS2 library's large group of PC-origin story adaptations.",
  "ps2-pure-x-cure-recovery":
    "Pure x Cure Recovery is an Alchemist-published visual novel about romance, illness, and character drama presented through route-based storytelling. It is a reader-first release for fans of Japanese romance adventures.",
  "ps2-puyo-pop-fever":
    "Puyo Pop Fever refreshes Sega's color-matching puzzle series with Fever mode, new characters, and frantic chain-building battles. The PS2 version is a strong home-console entry for competitive Puyo play.",
  "ps2-puyo-puyo-fever-2":
    "Puyo Puyo Fever 2 continues the Fever-era puzzle formula with more character events, modes, and chain-building competition. It expands the setting around the puzzle battles rather than replacing the core rules.",
  "ps2-puzzle-challenge-crosswords-and-more":
    "Puzzle Challenge: Crosswords and More! packages crossword-style word play and other small puzzle formats for PS2. It is casual puzzle software built for quiet solo sessions rather than arcade pressure.",
  "ps2-puzzle-maniacs":
    "Puzzle Maniacs is a D3-published puzzle collection with multiple simple rule sets, quick boards, and budget-release presentation. It is useful for players looking for variety-puzzle software in the PS2 catalog.",
  "ps2-puzzle-party-10-games":
    "Puzzle Party: 10 Games is a budget compilation of simple puzzle and parlor-style activities. Its value is breadth and low-friction multiplayer or family play, not depth in any single mode.",
  "ps2-pyu-to-fuku-jaguar-ashita-no-jump":
    "Pyu to Fuku! Jaguar Ashita no Jump adapts the gag manga into a PS2 release full of character comedy, mini-game style moments, and fan-facing references. It is a licensed import for readers who already know Jaguar's absurd humor.",
  "ps2-quartet-the-stage-of-love":
    "Quartet! The Stage of Love is a romance visual novel centered on music, performance, and character relationships. The PS2 release adapts the story for console players who follow PrincessSoft's visual-novel catalog.",
  "ps2-que-ancient-leaf-no-yousei":
    "Que: Ancient Leaf no Yousei is a fantasy romance visual novel with fairy-tale flavor, route choices, and character drama. It is a niche PrincessSoft story release rather than an action RPG.",
  "ps2-quest-for-sleeping-beauty":
    "Quest for Sleeping Beauty is a budget fairy-tale platform adventure that sends players through simple stages, hazards, and rescue-themed objectives. It is aimed at family audiences and younger players.",
  "ps2-quiz-and-variety-sukusuku-inufuku-2-motto-sukusuku":
    "Quiz & Variety SukuSuku Inufuku 2: Motto SukuSuku is a quiz and mini-game collection starring Hamster's odd Inufuku character. It mixes trivia, quick activities, and mascot weirdness instead of one continuous campaign.",
  "ps2-raceway-drag-and-stock-racing":
    "Raceway: Drag & Stock Racing is a budget motorsports release focused on straight-line drag events and oval-style stock racing. It is a narrow racing package for players interested in specific American racing formats.",
  "ps2-racing-battle-c1-grand-prix":
    "Racing Battle: C1 Grand Prix is Genki's tuning and street-racing game centered on Japanese highway culture, rival battles, and car setup. It belongs beside Tokyo Xtreme Racer as part of Genki's road-racing identity.",
  "ps2-radio-helicopter":
    "Radio Helicopter is a remote-control flight game about piloting model helicopters through rooms, challenges, and precision courses. It turns RC handling into the whole premise rather than using helicopters as combat vehicles.",
  "ps2-radio-helicopter-ii":
    "Radio Helicopter II continues the model-helicopter control idea with more precision flying and obstacle challenges. It is a companion release for players who enjoy technical RC-style movement.",
  "ps2-radirgy-precious":
    "Radirgy Precious brings Milestone's cel-shaded vertical shooter to PS2, mixing radio-wave sci-fi style, close-range attacks, and bullet patterns. It is a cult shooter entry for fans of Dreamcast and arcade-era shoot-'em-ups.",
  "ps2-raging-blades":
    "Raging Blades is a fantasy beat-'em-up with selectable heroes, weapon combat, and stage-based monster fighting. It is a straightforward early-PS2 brawler with arcade roots and co-op appeal.",
  "ps2-raimuiro-senkitan-jun":
    "Raimuiro Senkitan Jun adapts the anime and visual-novel property into a PS2 story game with romance, military fantasy, and character routes. It is a licensed fan release tied closely to the source material.",
  "ps2-rakushou-pachi-slot-sengen":
    "Rakushou! Pachi-Slot Sengen is a Tecmo pachi-slot simulation built around recreating Japanese slot-machine play, timing, and parlor-machine presentation. It is gambling-machine software for a specialist audience.",
  "ps2-rakushou-pachi-slot-sengen-2":
    "Rakushou! Pachi-Slot Sengen 2 continues Tecmo's slot-machine simulation line with another set of pachi-slot machines and practice-focused play. It is cataloged separately because each volume reflects different machine content.",
  "ps2-rakushou-pachi-slot-sengen-3":
    "Rakushou! Pachi-Slot Sengen 3 is another volume in Tecmo's pachi-slot simulation series, focused on machine behavior, reels, and gambling-parlor authenticity. It is a niche Japanese PS2 release for pachi-slot fans.",
  "ps2-rakushou-pachi-slot-sengen-4":
    "Rakushou! Pachi-Slot Sengen 4 extends the same pachi-slot practice format with a distinct machine lineup. The series is less about video-game progression and more about reproducing specific parlor experiences.",
  "ps2-rakushou-pachi-slot-sengen-5-rio-paradise":
    "Rakushou! Pachi-Slot Sengen 5: Rio Paradise highlights Tecmo's Rio-themed pachi-slot content, mixing character branding with slot-machine simulation. It is notable for collectors following Rio's crossover presence in Japanese games.",
  "ps2-rakushou-pachi-slot-sengen-6-rio-2-cruising-vanadis":
    "Rakushou! Pachi-Slot Sengen 6: Rio 2 Cruising Vanadis continues the Rio pachi-slot branch with another machine-focused package. It is a specialist gambling-sim entry where the subtitle signals the featured cabinet theme.",
  "ps2-rapala-pro-bass-fishing":
    "Rapala Pro Bass Fishing is a licensed angling game built around bass tournaments, lure choice, boat positioning, and branded fishing gear. It aims for a more structured competitive fishing feel than casual fishing minigames.",
  "ps2-rapala-pro-fishing":
    "Rapala Pro Fishing brings the fishing-equipment brand to PS2 with casting, lure selection, fish behavior, and outdoor tournament presentation. It is a mainstream fishing release for players who want licensed gear and lake variety.",
  "ps2-rasetsu-alternative":
    "Rasetsu Alternative is a tactical sci-fi strategy RPG with squad management, mission planning, and anime-style character presentation. It is a Nippon Ichi-published import for players interested in deeper Japanese strategy releases.",
  "ps2-rc-sports-copter-challenge":
    "RC Sports: Copter Challenge is a remote-control helicopter game about navigating small aircraft through obstacle courses and precision events. It treats careful control as the main challenge.",
  "ps2-rc-toy-machines":
    "RC Toy Machines is a budget racing game about driving miniature vehicles through toy-like environments and simple courses. It sits in the family racing lane rather than serious radio-control simulation.",
  "ps2-ready-2-rumble-boxing-round-2":
    "Ready 2 Rumble Boxing: Round 2 brings Midway's cartoon boxing series to PS2 with exaggerated fighters, arcade punches, and celebrity-style roster flair. It favors spectacle and timing over realistic boxing simulation.",
  "ps2-real-robot-regiment":
    "Real Robot Regiment is a Banpresto mecha action game that gathers real-robot anime machines into mission-based battles. It is a fan-service crossover release for players who recognize the featured mecha series.",
  "ps2-real-rode":
    "Real Rode is an otome visual novel and RPG-flavored romance game about being pulled into a fantasy game world and forming relationships with its heroes. It blends dating routes with light adventure framing.",
  "ps2-real-sports-pro-yakyu":
    "Real Sports Pro Yakyu is a Japanese baseball release from Enterbrain focused on match play and pro-baseball presentation. It belongs to the PS2's dense NPB sports catalog.",
  "ps2-real-world-golf-2007":
    "Real World Golf 2007 uses In2Games' motion-style golf controller concept to simulate swings and putting on PS2. It is as much a peripheral-driven sports release as a standard golf game.",
  "ps2-realize-panorama-luminary":
    "Realize: Panorama Luminary is a Visual Arts romance visual novel with school-life drama, route choices, and character-focused storytelling. It is a console adaptation for the PS2 visual-novel audience.",
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

const games = readJsonIfExists(ps2Path, null);
const manifest = readJsonIfExists(manifestPath, {});
if (!Array.isArray(games)) throw new Error("Run scripts/import-ps2-official-list.js first.");

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

writeJson(ps2Path, games);
writeJson(manifestPath, {
  ...manifest,
  editorialSeededAt: new Date().toISOString(),
  editorialSeedCount: seeded,
  overviewStatusCounts,
});

console.log(`Seeded ${seeded} PS2 editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
