const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const ps1Path = path.join(rootDir, "data", "games", "ps1.json");
const manifestPath = path.join(rootDir, "data", "games", "ps1-manifest.json");

const seeds = {
  "ps1-final-fantasy-vii":
    "Final Fantasy VII turned Square's role-playing series into a global PlayStation phenomenon, pairing pre-rendered backgrounds, cinematic cutscenes, and Materia-driven character building with a story about corporate exploitation, identity, grief, and resistance. Its scope, music, and production values made it one of the defining RPGs of the console.",
  "ps1-metal-gear-solid":
    "Metal Gear Solid brought Hideo Kojima's stealth series into 3D with cinematic direction, voice acting, and systems built around avoiding detection instead of simply clearing rooms. Its Shadow Moses setting, boss encounters, Codec conversations, and fourth-wall tricks made it one of the PlayStation's signature story-driven action games.",
  "ps1-crash-bandicoot":
    "Crash Bandicoot gave PlayStation a bright, technically showy mascot platformer, sending Crash through corridor-style 3D stages full of crates, hazards, bonus rooms, and chase sequences. Naughty Dog's animation, camera work, and tight level pacing helped establish the character as one of the console's early icons.",
  "ps1-resident-evil":
    "Resident Evil helped define survival horror on PlayStation with fixed camera angles, limited ammunition, locked-door exploration, and a mansion full of traps, monsters, and puzzle-box routes. Its campy presentation and tense resource management made the game a collector cornerstone for horror fans.",
  "ps1-gran-turismo":
    "Gran Turismo made console racing feel unusually serious for its era, combining licensed cars, performance tuning, license tests, and a long progression loop built around earning, upgrading, and mastering vehicles. Its clean handling model and huge car roster made it one of PlayStation's best-selling showcases.",
  "ps1-castlevania-symphony-of-the-night":
    "Castlevania: Symphony of the Night reworked the series into an exploratory action RPG, trading linear stages for Dracula's sprawling castle, equipment drops, familiars, secrets, and character growth. Its fluid movement, gothic presentation, and inverted-castle twist made it one of the most influential 2D games on PlayStation.",
  "ps1-silent-hill":
    "Silent Hill built horror around mood as much as monsters, using fog, radio static, distorted spaces, and psychological dread to make its small town feel hostile and unknowable. Its slower pacing and unsettling atmosphere gave PlayStation a horror identity distinct from Resident Evil.",
  "ps1-tekken-3":
    "Tekken 3 refined Namco's 3D fighter with faster movement, a huge arcade-to-home roster, memorable side modes, and a balance of accessibility and depth that made it a multiplayer staple. It remains one of the clearest examples of PlayStation bringing arcade-quality fighting games into the living room.",
  "ps1-tomb-raider":
    "Tomb Raider mixed exploration, platforming, puzzle solving, and combat inside large 3D ruins, making Lara Croft one of the era's defining characters. Its sense of isolation, hidden paths, and demanding traversal helped set the template for cinematic 3D adventure games.",
  "ps1-spyro-the-dragon":
    "Spyro the Dragon gave PlayStation a colorful, open-ended platform adventure built around gliding, charging, collecting gems, and freeing dragons across compact fantasy worlds. Insomniac's smooth movement and bright art direction made it one of the console's most approachable mascot games.",
  "ps1-parappa-the-rapper":
    "PaRappa the Rapper turned rhythm play into a full personality piece, using call-and-response button timing, paper-thin character art, and unforgettable songs to create something unlike the action-heavy PlayStation norm. Its style and simplicity helped open the door for rhythm games on consoles.",
  "ps1-wipeout":
    "Wipeout fused anti-gravity racing with club culture, electronic music, and graphic design that made PlayStation feel sharper and more adult than earlier console launches. Its fast tracks, weapons, and sense of speed turned it into one of the system's early identity pieces.",
  "ps1-ape-escape":
    "Ape Escape was built around the DualShock controller, using twin-stick movement and gadget swapping to turn monkey catching into a playful 3D action challenge. Its clever controls, colorful stages, and collectible structure made it one of Sony's standout late-generation platformers.",
  "ps1-vagrant-story":
    "Vagrant Story is a dense Square action RPG set in the ruined city of Lea Monde, built around weapon affinities, body-part targeting, risk management, and a mature political-fantasy story. Its visual direction and layered systems made it a cult favorite for players who like demanding RPGs.",
  "ps1-chrono-cross":
    "Chrono Cross followed Chrono Trigger with a stranger, more atmospheric RPG about parallel worlds, identity, and consequence. Its large cast, Element battle system, tropical setting, and Yasunori Mitsuda score made it one of Square's most distinctive late PlayStation releases.",
  "ps1-olympia-yamasa-virtua-pachi-slot-ii-jissen-bishoujo-kouryaku-hou":
    "Olympia Yamasa: Virtua Pachi-Slot II: Jissen! Bishoujo Kouryaku Hou is a Japanese pachislot simulation built around practicing real-machine timing, bonus behavior, and parlor-style repetition. It belongs in the PlayStation library as a niche gambling-machine reference title rather than a conventional arcade game.",
  "ps1-one-two-smash-tanoshii-tennis":
    "One Two Smash: Tanoshii Tennis is a light PlayStation tennis game focused on approachable rallies, simple match flow, and cheerful presentation. It is a lower-profile Japanese sports release where the useful collector details are the Hect publishing credit, exact title spelling, and complete packaging.",
  "ps1-oni-zero-fukkatsu":
    "Oni Zero: Fukkatsu is a late PlayStation RPG from Pandora Box that continues the Oni line's Japanese folklore and fantasy identity. It is mainly an import collector entry, with appeal tied to party growth, scenario progression, and its place near the end of the original PlayStation's RPG shelf.",
  "ps1-ooedo-huusui-ingaritsu-hanabi-2":
    "Ooedo Huusui Ingaritsu Hanabi 2 is a Japanese puzzle and fortune-themed PlayStation release with traditional visual flavor and short-session structure. It is not a broadly known franchise piece, but it gives collectors a distinct Magical Company title to separate from generic puzzle listings.",
  "ps1-osaka-naniwa-matenrow":
    "Osaka Naniwa Matenrow is a KID visual novel set around Osaka atmosphere, character scenes, and story choices rather than action systems. Its interest comes from regional flavor and KID's importance to PlayStation-era adventure and romance software.",
  "ps1-oshaberi-oekaki-kikansha-thomas-to-nakamatachi":
    "Oshaberi Oekaki Kikansha Thomas to Nakamatachi is a Thomas & Friends educational activity game built around talking, drawing, and young-child interaction. It is best cataloged as a preschool licensed release where character recognition and Japanese packaging are the key details.",
  "ps1-oshaberi-oekaki-soreike-anpanman":
    "Oshaberi Oekaki Soreike! Anpanman is a child-focused drawing and activity release starring the long-running Japanese children's hero. It belongs with PlayStation's family and education software, where the value is in license, condition, and completeness rather than mechanical depth.",
  "ps1-oshigotoshiki-jinsei-game-mezase-shokugyou-king":
    "Oshigotoshiki Jinsei Game: Mezase Shokugyou King turns Takara's life-board-game concept toward careers, events, and party-style progression. It is a digital board game about luck, jobs, and route outcomes rather than a traditional minigame collection.",
  "ps1-otenami-haiken":
    "Otenami Haiken is a Success puzzle release built around compact challenges and repeated attempts to solve or improve each board. It is a modest PlayStation import entry, but it helps document the system's long tail of Japan-only puzzle software beyond the famous names.",
  "ps1-othello-world-ii-yume-to-michi-e-no-chousen":
    "Othello World II: Yume to Michi e no Chousen adapts the familiar Othello/Reversi rules into a PlayStation board-game package with CPU play and structured challenges. Its appeal is pure tabletop strategy, making it a clean listing for puzzle and board-game collectors.",
  "ps1-otona-no-asobi":
    "Otona no Asobi is a Nichibutsu table-game collection aimed at adult parlor and puzzle play, built around familiar rule sets rather than character action. It should be presented as a Japanese leisure-game release where contents and region matter more than spectacle.",
  "ps1-ouji-sama-lv1":
    "Ouji-sama LV1 is a PlayStation visual novel from Alice Blue and KID with fantasy-romance elements, character routes, and story-first progression. It is a niche import release for collectors following late PS1 adventure games and early console ports of PC visual novels.",
  "ps1-ouji-sama-lv1-5":
    "Ouji-sama LV1.5 is a follow-up companion release to Ouji-sama LV1, adding more character-focused scenario material in the same fantasy visual-novel world. It should be cataloged separately because the decimal subtitle marks a distinct release rather than a variant title.",
  "ps1-oukyuu-no-hihou-tenshon":
    "Oukyuu no Hihou: Tenshon is a PlayStation RPG from Vap and Wizard, framed around fantasy exploration, character growth, and dungeon-style progression. It is a lesser-known import RPG where title accuracy and publisher details are especially useful for marketplace listings.",
  "ps1-ouma-ga-toki":
    "Ouma ga Toki is a Victor Interactive strategy release with supernatural period flavor, scenario planning, and turn-based decision-making. It is a niche Japanese PlayStation title, but its yokai-adjacent premise gives it a clearer identity than the generic metadata copy suggests.",
  "ps1-ouma-ga-toki-2":
    "Ouma ga Toki 2 continues Victor Interactive's supernatural strategy concept with another round of scenario-driven battles and Japanese folklore atmosphere. It belongs beside the first game as a separate sequel, especially for collectors tracking obscure strategy pairs.",
  "ps1-out-live-be-eliminate-yesterday":
    "Out Live: Be Eliminate Yesterday is a Sunsoft PlayStation RPG connected to the older Out Live name, mixing science-fiction theming with role-playing progression. It is mainly an import-library curiosity for players interested in late-1990s Japanese RPG experiments.",
  "ps1-over-drivin-skyline-memorial":
    "Over Drivin' Skyline Memorial is part of Electronic Arts Victor's Japanese branding for the Need for Speed line, centered on Nissan Skyline appeal, racing events, and car-culture presentation. It is a useful collector record because the Over Drivin' naming can hide its Western-series connection.",
  "ps1-oyaji-no-jikan-nechan-hanafuda-de-shoubu-ya":
    "Oyaji no Jikan: Nechan, Hanafuda de Shoubu Ya is a Japanese card-game release built around hanafuda play, character framing, and table-game repetition. It is a specialized PlayStation entry for collectors of traditional-game software and oddball import releases.",
  "ps1-oyaji-no-jikan-nechan-mahjong-de-shoubu-ya":
    "Oyaji no Jikan: Nechan, Mahjong de Shoubu Ya shifts the same adult table-game framing toward mahjong matches and parlor-style play. It should be separated from the hanafuda and fishing entries because the subtitle identifies the actual game type.",
  "ps1-oyaji-no-jikan-nechan-tsuri-iku-de":
    "Oyaji no Jikan: Nechan, Tsuri Iku De! uses the series' comic adult framing for a fishing-focused PlayStation release. The appeal is in Japanese leisure-game collecting, where the title sits closer to hobby simulation than competitive sports.",
  "ps1-p-k-s-math-studio":
    "P.K.'s Math Studio is a Lightspan educational PlayStation release built around math practice, classroom-style activities, and child-friendly repetition. It is useful for documenting the console's school-market software, which often circulated differently from standard retail games.",
  "ps1-p-k-s-place-carlos-at-the-races":
    "P.K.'s Place: Carlos at the Races! is a Lightspan learning title that wraps educational exercises in a simple racing-themed scenario for younger students. Its collector interest comes from the unusual Lightspan distribution history and the need to verify discs carefully.",
  "ps1-p-k-s-place-daphne-and-the-seventh-wonder":
    "P.K.'s Place: Daphne and the Seventh Wonder! presents early-learning exercises through a light adventure frame starring Daphne. It belongs with the PlayStation's educational-library edge cases rather than mainstream retail releases.",
  "ps1-p-k-s-place-hoopo-at-sea":
    "P.K.'s Place: Hoopo at Sea! is another Lightspan classroom-oriented PlayStation title, using a nautical theme to organize child-friendly lessons and activities. Like the other P.K.'s Place games, it is important for complete-library tracking because standard game databases can miss or blur these releases.",
  "ps1-p-k-s-place-party-on-the-patio":
    "P.K.'s Place: Party on the Patio! is a Lightspan educational PlayStation title built around early-learning activities in a simple social-event frame. It belongs with the classroom-distribution side of the PS1 catalog, where collectors need to verify disc identity and lesson-series packaging carefully.",
  "ps1-paca-paca-passion":
    "Paca Paca Passion is a rhythm game from Produce and NanaOn-Sha-era PlayStation's music-game boom, built around timing notes to character performances and playful pop presentation. It is a cult import release for collectors who follow rhythm games beyond PaRappa and Beatmania.",
  "ps1-paca-paca-passion-2":
    "Paca Paca Passion 2 continues the rhythm-battle format with new songs, performers, and timing patterns. It should be treated as a separate sequel rather than a variant, especially because the series' similar cover style can blur listings together.",
  "ps1-paca-paca-passion-special":
    "Paca Paca Passion Special functions as an expanded rhythm entry with additional song content and series material for fans of the first two games. It is a useful collector target because it represents the more complete late PS1 form of the Paca Paca Passion line.",
  "ps1-pachi-pachi-saga":
    "Pachi Pachi Saga is a Japanese pachinko/pachislot-themed PlayStation release with parlor-style play, luck systems, and character framing. It belongs in the gambling-machine simulation shelf of the PS1 library rather than alongside action or RPG titles.",
  "ps1-pachi-slot-teiou-big-wave-pika-gorou-bb-junkie-7":
    "Pachi Slot Teiou: Big Wave - Pika Gorou - BB Junkie 7 is a machine-focused pachislot simulation that packages specific real-world slot models for practice and study. The long subtitle is the main collector signal because it identifies the included machines.",
  "ps1-pachi-slot-aruze-oukoku":
    "Pachi-Slot Aruze Oukoku is a PlayStation pachislot simulation centered on Aruze machines, parlor pacing, and practicing reels and bonus behavior. It is a specialized Japanese release where manufacturer branding matters more than traditional game genre labels.",
  "ps1-pachi-slot-aruze-oukoku-2":
    "Pachi-Slot Aruze Oukoku 2 continues the Aruze-branded simulation series with another set of slot machines and practice-focused play. It should be cataloged separately from the first game because numbered entries often cover different machine lineups.",
  "ps1-pachi-slot-aruze-oukoku-3":
    "Pachi-Slot Aruze Oukoku 3 is a further PlayStation entry in the Aruze pachislot line, focused on recreating machine behavior and parlor-style repetition. For marketplace use, the number is essential because listings can otherwise collapse several Aruze Oukoku releases into one.",
  "ps1-pachi-slot-aruze-oukoku-4":
    "Pachi-Slot Aruze Oukoku 4 extends the Aruze simulation run with another batch of machines and reel-practice play. It is mainly for collectors of Japanese gambling-machine software and should be identified by its exact numbered title.",
  "ps1-pachi-slot-aruze-oukoku-5":
    "Pachi-Slot Aruze Oukoku 5 is a later numbered Aruze pachislot simulation for PlayStation, built around machine-specific rules and bonus patterns. Its collector value is tied to completing the series and confirming the exact release number.",
  "ps1-pachi-slot-kanzen-kaiseki-wet2-poker":
    "Pachi-Slot Kanzen Kaiseki: Wet2 Poker is a pachislot analysis title focused on a specific slot machine, giving players a way to study timing, payouts, and bonus flow at home. It is closer to a machine reference disc than a broad casino-game collection.",
  "ps1-pachi-slot-kanzen-kouryaku-takasago-super-project":
    "Pachi-Slot Kanzen Kouryaku: Takasago Super Project is a Takasago-branded pachislot strategy and simulation release for PlayStation. It is useful to collectors because the publisher/manufacturer relationship and exact subtitle identify which machine family is being covered.",
  "ps1-pachi-slot-kanzen-kouryaku-takasago-super-project-2":
    "Pachi-Slot Kanzen Kouryaku: Takasago Super Project 2 continues the Takasago machine-analysis format with a separate lineup and practice focus. It should not be merged with the first Super Project entry because these discs document different pachislot material.",
  "ps1-pachi-slot-kanzen-kouryaku-universal-koushiki-gaido-volume-1":
    "Pachi-Slot Kanzen Kouryaku: Universal Koushiki Gaido Volume 1 begins a Universal official-guide series on PlayStation, built around pachislot machine study and replayable practice. The volume number is the key listing detail for anyone collecting the full guide run.",
  "ps1-pachi-slot-kanzen-kouryaku-universal-koushiki-gaido-volume-2":
    "Pachi-Slot Kanzen Kouryaku: Universal Koushiki Gaido Volume 2 continues the Universal guide format with another set of machine-focused simulations and strategy material. It is a niche but distinct disc in the PS1 gambling-software catalog.",
  "ps1-pachi-slot-kanzen-kouryaku-universal-koushiki-gaido-volume-3":
    "Pachi-Slot Kanzen Kouryaku: Universal Koushiki Gaido Volume 3 is a further Universal pachislot guide entry, aimed at practicing and studying specific machines rather than offering a general casino mode. Collectors should verify the volume number and included machine branding.",
  "ps1-pachi-slot-kanzen-kouryaku-universal-koushiki-gaido-volume-4":
    "Pachi-Slot Kanzen Kouryaku: Universal Koushiki Gaido Volume 4 rounds out another part of Universal's PlayStation pachislot guide line. It is best described as machine-reference software, with appeal tied to manufacturer accuracy and complete-series collecting.",
  "ps1-pachi-slot-master-sammy-sp":
    "Pachi-Slot Master: Sammy SP is a Sammy-focused pachislot simulation for PlayStation, centered on reel practice, machine behavior, and parlor-style repetition. It is a specialist import release where the Sammy branding is the clearest buyer-facing identifier.",
  "ps1-pachi-slot-teiou-2-kagestu-two-pair-beaver-x":
    "Pachi-Slot Teiou 2: Kagestu - Two Pair Beaver X is a machine-specific pachislot package in the Teiou series, built around learning and replaying particular slot models. The subtitle should be surfaced clearly because it separates this disc from the many other Teiou entries.",
  "ps1-pachi-slot-teiou-3-sea-master-x-epsilon-r-wai-wai-pulsar":
    "Pachi-Slot Teiou 3: Sea Master X - Epsilon R - Wai Wai Pulsar packages multiple pachislot machines into a PlayStation simulation focused on practice and machine familiarity. It is a collector-facing title where the included machine names are more important than the broad series name.",
  "ps1-pachi-slot-teiou-4-oicho-kaba-x-magical-pops-lequio-30":
    "Pachi-Slot Teiou 4: Oicho Kaba X - Magical Pops - Lequio 30 continues the Teiou machine-compilation approach with another specific pachislot lineup. It should be cataloged by full subtitle to avoid confusion with neighboring numbered releases.",
  "ps1-pachi-slot-teiou-5-kongdom-super-star-dust-2-flying-momonga":
    "Pachi-Slot Teiou 5: Kongdom - Super Star Dust 2 - Flying Momonga is a PlayStation pachislot simulation built around a named group of machines and bonus behaviors. The appeal is in home practice and machine documentation rather than conventional arcade variety.",
  "ps1-pachi-slot-teiou-6-kung-fu-lady-bangbang-prelude-2":
    "Pachi-Slot Teiou 6: Kung Fu Lady - BangBang - Prelude 2 is another machine-specific Teiou entry, offering pachislot practice around its listed models. The full title helps buyers distinguish it from similarly numbered Japanese slot releases.",
  "ps1-pachi-slot-teiou-7-maker-suishou-manual-1-beat-the-dragon-2-lupin-sansei-hot-rod-queen":
    "Pachi-Slot Teiou 7: Maker Suishou Manual 1 groups several pachislot machines, including Beat the Dragon 2, Lupin Sansei, and Hot Rod Queen, into a PlayStation practice package. It is a highly specific import record where the subtitle is effectively the product description.",
  "ps1-pachi-slot-teiou-mini-dr-a7":
    "Pachi-Slot Teiou Mini: Dr. A7 is a compact PlayStation pachislot simulation focused on a specific Dr. A7 machine setup. It is a specialist import title where the Mini branding and machine name are the main details buyers need to verify.",
  "ps1-pachi-slot-teiou-w-arabesque-r-hot-rod-queen":
    "Pachi-Slot Teiou W: Arabesque R / Hot Rod Queen pairs two pachislot machines in one Teiou-branded PlayStation release. The value is in the exact machine pairing, so listings should distinguish it from the many numbered and single-machine Teiou discs.",
  "ps1-pachi-slot-teiou-battle-night-atlantis-dome":
    "Pachi-Slot Teiou: Battle Night / Atlantis Dome is a Media Entertainment pachislot package built around the named Battle Night and Atlantis Dome machines. It is home practice and machine reference software rather than a broad casino collection.",
  "ps1-pachi-slot-teiou-beat-the-dragon-2":
    "Pachi-Slot Teiou: Beat the Dragon 2 focuses the Teiou format on Olympia's Beat the Dragon 2 machine, recreating reel play, bonus behavior, and parlor-style repetition. The machine title is the key identifier for collectors.",
  "ps1-pachi-slot-teiou-bunny-girl-sp":
    "Pachi-Slot Teiou: Bunny Girl SP is a machine-specific pachislot simulation tied to Olympia's Bunny Girl SP. It belongs with Japanese parlor-reference software, where accuracy to the named slot machine matters more than variety modes.",
  "ps1-pachi-slot-teiou-cr-soreite-hama-chan-2":
    "Pachi-Slot Teiou: CR Soreite Hama-Chan 2 is another Teiou entry centered on a named machine and its payout rhythm. It is useful for collectors because the CR/Soreite Hama-Chan subtitle separates it from similarly packaged Olympia releases.",
  "ps1-pachi-slot-teiou-dateline-pegasus":
    "Pachi-Slot Teiou: Dateline Pegasus recreates the Dateline Pegasus pachislot machine for PlayStation practice play. It is a focused parlor simulation whose appeal is machine familiarity, timing practice, and exact title matching.",
  "ps1-pachi-slot-teiou-golgo-13-las-vegas":
    "Pachi-Slot Teiou: Golgo 13 - Las Vegas combines the Teiou pachislot format with a Golgo 13-branded machine theme. It is a niche import record where the licensed machine identity and Las Vegas subtitle are the important listing details.",
  "ps1-pachi-slot-teiou-maker-suishou-manual-2-ice-story":
    "Pachi-Slot Teiou: Maker Suishou Manual 2: Ice Story continues the maker-recommended manual subseries with Ice Story machine practice. It should be treated as a specific pachislot guide disc, not a generic gambling compilation.",
  "ps1-pachi-slot-teiou-maker-suishou-manual-3-i-m-angel-white-2-and-blue-2":
    "Pachi-Slot Teiou: Maker Suishou Manual 3: I'm Angel White 2 & Blue 2 documents another machine pairing in the Teiou manual line. Its collector value comes from the White 2 and Blue 2 machine names and the third manual volume branding.",
  "ps1-pachi-slot-teiou-maker-suishou-manual-4-exhaust-ooedo-sakura-fubuki-2":
    "Pachi-Slot Teiou: Maker Suishou Manual 4: Exhaust / Ooedo Sakura Fubuki 2 is a PlayStation pachislot guide release covering the named Exhaust and Ooedo Sakura Fubuki 2 machines. The long subtitle is necessary for clean cataloging.",
  "ps1-pachi-slot-teiou-maker-suishou-manual-5-race-queen-2-tomcat":
    "Pachi-Slot Teiou: Maker Suishou Manual 5: Race Queen 2 / Tomcat shifts the manual line to a Yamasa machine pairing, with practice-focused reel play and machine behavior study. It is best identified by both included machine names.",
  "ps1-pachi-slot-teiou-maker-suishou-manual-6-takarabune":
    "Pachi-Slot Teiou: Maker Suishou Manual 6: Takarabune is a Yamasa-focused pachislot guide disc centered on the Takarabune machine. It is a collector-facing reference release where the manual number and machine title matter most.",
  "ps1-pachi-slot-teiou-maker-suishou-manual-7-trick-monster-2":
    "Pachi-Slot Teiou: Maker Suishou Manual 7: Trick Monster 2 is another machine-specific practice disc in the Teiou manual series. It is mainly relevant to pachislot collectors and should be separated from the broader Teiou numbered releases.",
  "ps1-pachi-slot-teiou-naniwaou-fubuki":
    "Pachi-Slot Teiou: Naniwaou Fubuki is an Olympia-machine pachislot simulation with the usual Teiou emphasis on reels, bonus behavior, and parlor practice. The subtitle is the clearest way to distinguish it from other Media Entertainment discs.",
  "ps1-pachi-slot-teiou-shimabai-30":
    "Pachi-Slot Teiou: Shimabai 30 focuses on the Shimabai 30 machine, preserving its slot behavior in a PlayStation practice format. It is a niche import release for collectors who track individual pachislot machine adaptations.",
  "ps1-pachi-slot-teiou-yamasa-remix":
    "Pachi-Slot Teiou: Yamasa Remix collects Yamasa-branded pachislot material under the Teiou label, making manufacturer identity the central hook. It is best viewed as a machine-practice package for fans of Japanese parlor software.",
  "ps1-pachinko-and-pachi-slot-parlor-pro-extra":
    "Pachinko & Pachi-Slot Parlor! Pro Extra combines pachinko and pachislot play in a home parlor package, with machine-style repetition and practice at the center. It is a Nippon Telenet release aimed at players who wanted arcade-parlor routines on PlayStation.",
  "ps1-pachinko-daisuki":
    "Pachinko Daisuki is a Heiwa-backed pachinko simulation for PlayStation, focused on recreating machine play, ball flow, and parlor-style sessions. It is a straightforward Japanese gambling-machine title where manufacturer credit helps identify the release.",
  "ps1-pachinko-dream":
    "Pachinko Dream is Konami's PlayStation take on pachinko, giving players virtual machine play, repeated attempts, and home practice without the pace of an arcade action game. It belongs in the console's specialized parlor-software catalog.",
  "ps1-pachinko-hall-shinso-dai-kaiten":
    "Pachinko Hall Shinso Dai Kaiten presents pachinko through a hall-management and machine-play frame, emphasizing parlor atmosphere and repeated sessions. It is a niche Nexton release for collectors of Japanese gambling and leisure software.",
  "ps1-pachio-kun-pachinko-land-adventure":
    "Pachio-kun: Pachinko Land Adventure mixes Coconuts Japan's pachinko mascot series with adventure-style progression, making it more characterful than a plain machine simulator. It still belongs to the pachinko software lineage, but the Pachio-kun branding gives it a distinct identity.",
  "ps1-pachitte-chonmage":
    "Pachitte Chonmage is the first PlayStation entry in Hack Berry's long-running pachinko simulation line, built around licensed machine play and parlor routines. It is a foundation piece for collectors following the series across later numbered releases.",
  "ps1-pachitte-chonmage-2-kyoraku-kounin-tanukichu-2000-and-jungle-p":
    "Pachitte Chonmage 2: Kyoraku Kounin / Tanukichu 2000 & Jungle P centers on officially licensed Kyoraku pachinko machines, including Tanukichu 2000 and Jungle P. The exact machine names are the key listing details.",
  "ps1-pachitte-chonmage-3-kyoraku-kounin-gladiator-and-tama-chan":
    "Pachitte Chonmage 3: Kyoraku Kounin / Gladiator & Tama-chan continues Hack Berry's licensed pachinko series with another specific machine pair. It should be tracked as a numbered sequel with distinct Kyoraku machine content.",
  "ps1-paipai":
    "Paipai is a late PlayStation visual novel from Selen and ProSoft, built around adult-leaning character drama, route choices, and story scenes. It is a niche Japanese import where publisher, age-rating context, and exact spelling matter for identification.",
  "ps1-pal-shinken-densetsu":
    "PAL: Shinken Densetsu is a Fill-in-Cafe role-playing game with fantasy adventure structure, character growth, and PlayStation-era 2D/3D presentation. It is a lesser-known Japanese RPG where the PAL title can be easy to confuse with region labeling.",
  "ps1-palm-town":
    "Palm Town is a Mycom PlayStation visual novel centered on town life, character interaction, and route-driven story progression. It is a small import adventure record where title and publisher details do most of the collector work.",
  "ps1-pandora-project-the-logic-master":
    "Pandora Project: The Logic Master is a puzzle and construction game about building mechanical solutions from parts and watching them operate. Its appeal is problem solving and contraption logic, placing it near The Incredible Machine-style design rather than simple board puzzles.",
  "ps1-panekit":
    "Panekit is a Sony-published construction sandbox where players assemble panels, joints, and moving parts into vehicles and strange working machines. Its flexible building system makes it one of the PlayStation's most unusual creative-tool games.",
  "ps1-panel-quiz-attack-25":
    "Panel Quiz Attack 25 adapts the long-running Japanese TV quiz show format to PlayStation, with panel selection, trivia questions, and game-show presentation. It is a license-driven quiz release where language and show familiarity define the experience.",
  "ps1-pangaea":
    "Pangaea is a Success role-playing game built around fantasy exploration, battles, and character progression. It sits in the lesser-known end of the PlayStation RPG catalog, where publisher credit and exact title matching are especially useful.",
  "ps1-panzer-front":
    "Panzer Front is a tactical tank combat simulation focused on armored warfare, battlefield positioning, vehicle handling, and mission objectives. It is a serious tank-combat title, not a puzzle or rhythm game.",
  "ps1-pao-leeming-kanshuu-fuusui-nyuumon":
    "Pao Leeming Kanshuu: Fuusui Nyuumon is a feng shui instructional and lifestyle simulation release supervised around Pao Leeming's fortune-telling expertise. It is unusual PlayStation software, closer to a spiritual/lifestyle guide than a conventional game.",
  "ps1-paqa":
    "PAQA is a Sony Computer Entertainment Japan PlayStation oddity built around sound, creature-like interaction, and experimental presentation rather than a conventional action structure. It belongs with Sony's stranger late-1990s first-party catalog, where concept and sensory design are the selling points.",
  "ps1-paradise-casino":
    "Paradise Casino is a budget PlayStation casino release with table and gambling-game routines packaged for home play. It is most useful as a PAL-era budget record, where Phoenix Games publishing and the casino theme are the clearest identifiers.",
  "ps1-paranoiascape":
    "ParanoiaScape is a surreal horror pinball game from Jorudan, mixing flipper play with disturbing biomechanical table themes and dark PlayStation-era atmosphere. It stands out because it treats pinball like a nightmare-art experience rather than a clean arcade table.",
  "ps1-paris-marseille-racing":
    "Paris-Marseille Racing is a Davilex budget racer set around French road routes, arcade handling, and point-to-point driving. It belongs with the studio's European city-racing line rather than licensed motorsport simulations.",
  "ps1-paris-marseille-racing-ii":
    "Paris-Marseille Racing II continues Davilex's France-focused budget racing formula with more road-course driving and straightforward arcade competition. It should be tracked separately from the first game because both titles appear in similar PAL racing collections.",
  "ps1-parlor-station":
    "Parlor Station is a Japanese pachinko and parlor-style PlayStation release from Aqua Rouge and GMF, focused on machine play and repeated sessions. It is a specialist gambling-machine title where the parlor framing is the main hook.",
  "ps1-parlor-pro":
    "Parlor! Pro is Nippon Telenet's PlayStation pachinko/parlor simulation line opener, focused on recreating Japanese machine play at home. It is a foundation entry for a long series of numbered and Jr. releases.",
  "ps1-parlor-pro-2":
    "Parlor! Pro 2 continues the Nippon Telenet parlor-simulation series with another machine-focused package of pachinko-style play. The numbered sequel matters because each release preserves a different slice of the parlor software line.",
  "ps1-parlor-pro-3":
    "Parlor! Pro 3 is a further PlayStation parlor-simulation volume centered on Japanese pachinko routines, machine behavior, and home practice. It is best cataloged by number because the series has many near-identical names.",
  "ps1-parlor-pro-4":
    "Parlor! Pro 4 keeps the series in machine-simulation territory, offering another PlayStation package for pachinko and parlor-game fans. The value is in the specific volume identity and Nippon Telenet lineage.",
  "ps1-parlor-pro-5":
    "Parlor! Pro 5 is a late-1990s PlayStation pachinko/parlor simulator from Nippon Telenet, built around repeated machine play and virtual hall routines. It is a collector-facing specialty release rather than a broad arcade compilation.",
  "ps1-parlor-pro-6":
    "Parlor! Pro 6 continues Nippon Telenet's numbered parlor series with another set of pachinko-style machine content for home play. It should be identified by full title and volume number to avoid confusion with nearby releases.",
  "ps1-parlor-pro-7":
    "Parlor! Pro 7 is a PlayStation parlor-simulation entry focused on Japanese machine recreation and practice. It belongs in the specialized pachinko catalog where small differences between volumes matter to collectors.",
  "ps1-parlor-pro-8":
    "Parlor! Pro 8 extends the Nippon Telenet parlor line with another machine-specific PlayStation release. It is not a general casino game so much as a home version of Japanese pachinko and parlor routines.",
  "ps1-parlor-pro-jr-vol-1":
    "Parlor! Pro Jr. Vol. 1 starts the Jr. branch of Nippon Telenet's pachinko simulation line, packaging parlor play in a budget or compact volume format. The Jr. subtitle separates it from the main numbered series.",
  "ps1-parlor-pro-jr-vol-2":
    "Parlor! Pro Jr. Vol. 2 continues the Jr. pachinko-simulation branch with another compact machine-focused release. It should be cataloged by volume because the naming is otherwise very easy to mix up.",
  "ps1-parlor-pro-jr-vol-3":
    "Parlor! Pro Jr. Vol. 3 is a machine-practice pachinko title in the Jr. series, centered on parlor-style repetition and simulation rather than action play. Its collector value comes from the specific Jr. volume.",
  "ps1-parlor-pro-jr-vol-4":
    "Parlor! Pro Jr. Vol. 4 offers another compact PlayStation parlor-simulation release from Nippon Telenet. It belongs with the Jr. sub-series, where exact volume number is the most important public identifier.",
  "ps1-parlor-pro-jr-vol-5":
    "Parlor! Pro Jr. Vol. 5 is a 2000 PlayStation pachinko simulator and one of the later Jr. volumes. It is a specialist Japanese parlor release, useful for collectors completing Nippon Telenet's long run.",
  "ps1-parlor-pro-jr-vol-6":
    "Parlor! Pro Jr. Vol. 6 continues the compact Jr. line with another pachinko/parlor package for PlayStation. It should be kept separate from the main Parlor! Pro sequence and earlier Jr. volumes.",
  "ps1-parlor-pro-special-cr-harenchi-gakuen-and-chou-shindai":
    "Parlor! Pro Special: CR Harenchi Gakuen & Chou-Shindai is a Nippon Telenet pachinko release built around the named CR Harenchi Gakuen and Chou-Shindai machine content. The special subtitle is essential because it identifies the licensed cabinets.",
  "ps1-paro-wars":
    "Paro Wars is a Konami strategy spin-off that turns the Parodius universe into a tactical war game, replacing side-scrolling shooting with unit movement, battles, and absurd character matchups. It is a standout PlayStation import because it reframes a shooter parody series as strategy.",
  "ps1-pastel-muses":
    "Pastel Muses is a Japanese puzzle game about arranging falling or moving pieces with bright, characterful presentation. It fits the PlayStation's smaller puzzle catalog, with Soft Office and D3 Publisher credits helping identify the correct release.",
  "ps1-patriotic-pinball":
    "Patriotic Pinball is a PlayStation pinball title with American-themed tables, score targets, and straightforward flipper play. It is a late budget release where table theme and regional packaging are the main collector signals.",
  "ps1-pd-ultraman-invader":
    "PD Ultraman Invader combines Bandai's Ultraman license with Taito-developed arcade-style action, using super-deformed presentation and alien-fighting spectacle. It is mainly relevant as an early PlayStation Ultraman spin-off rather than a core fighting-game entry.",
  "ps1-pebble-beach-no-hatou-plus":
    "Pebble Beach no Hatou Plus is a T&E Soft golf simulation set around Pebble Beach, emphasizing course management, swing timing, and traditional golf pacing. It is a recognizable Japanese golf release because the Pebble Beach name anchors the package.",
  "ps1-perfect-assassin":
    "Perfect Assassin is a sci-fi adventure game from Grolier Interactive built around exploration, puzzles, and first-person story progression. It belongs with the PlayStation's European adventure catalog rather than its action-heavy shooter shelf.",
  "ps1-perfect-fishing-bass-fishing":
    "Perfect Fishing: Bass Fishing is a Seta Corporation fishing simulation focused on freshwater bass, lure choice, casting, and patient catch routines. It should be distinguished from Rock Fishing because each release targets a different angling style.",
  "ps1-perfect-fishing-rock-fishing":
    "Perfect Fishing: Rock Fishing shifts Seta's fishing formula toward rocky shoreline and saltwater-style angling, with its own targets and setting flavor. It is a companion release to Bass Fishing, not a duplicate listing.",
  "ps1-perfect-golf-2":
    "Perfect Golf 2 is a Seta Corporation golf game with course play, club choice, and traditional shot management. It is a straightforward PlayStation sports release where sequel numbering and Japanese packaging are the key identifiers.",
  "ps1-perfect-performer-the-yellow-monkey":
    "Perfect Performer: The Yellow Monkey is a music and rhythm-adjacent PlayStation release tied to the Japanese rock band The Yellow Monkey. It is best understood as fan-focused music software rather than a general concert video or standard rhythm game.",
  "ps1-pet-in-tv-with-my-dear-dog":
    "Pet in TV with my dear Dog is a Sony-published virtual pet and communication game from Sugar & Rockets, centered on caring for and interacting with a dog through playful television-like presentation. It is one of the PlayStation's more unusual pet-sim experiments.",
  "ps1-pet-pet-pet":
    "Pet Pet Pet is a Magical Company pet-care release about raising and interacting with small virtual animals through simple routines. It belongs with the PlayStation's family and simulation curiosities rather than competitive or action games.",
  "ps1-pga-european-tour-golf":
    "PGA European Tour Golf brings professional golf presentation to PlayStation with licensed tournament framing, course play, and simulation-minded shot control. It is a sports entry for players tracking golf games beyond the more common PGA Tour branding.",
  "ps1-phix-the-adventure":
    "Phix: The Adventure is a 3D platform adventure starring Phix, with colorful worlds, jumping challenges, and late-era PlayStation character-game design. It is most relevant to collectors of lesser-known mascot platformers.",
  "ps1-photo-genic":
    "Photo Genic is a Sunsoft and Fill-in-Cafe visual novel/dating simulation built around photography, character events, and relationship progression. It is a Japanese import where the camera premise gives the story-game structure a distinct angle.",
  "ps1-pikiinya-ex":
    "Pikiinya! EX is a colorful Crea-Tech puzzle game with cute characters and quick stage-based challenges. It belongs in the PlayStation's niche Japanese puzzle catalog, where charm and exact title spelling do much of the work.",
  "ps1-pikupiku-sentarou":
    "Pikupiku Sentarou adapts the Kodansha character property into a PlayStation release with family-friendly presentation and light character-game activities. It is mainly a licensed import curiosity for collectors tracking manga and children's media tie-ins.",
  "ps1-pilot-ni-narou":
    "Pilot Ni Narou! is a flight-training and light simulation game about learning aircraft control, takeoff, landing, and pilot routines. It is a distinctive PlayStation aviation release because it leans into training fantasy rather than arcade dogfighting.",
  "ps1-pinball-power":
    "Pinball Power is a LittleWing-developed pinball release for PlayStation, focused on table physics, scoring routes, and traditional flipper timing. It sits in the system's smaller pinball catalog and is best identified by its Midas PAL publishing credit.",
  "ps1-pinocchia-no-miru-yume":
    "Pinocchia no Miru Yume is a Takara visual novel/adventure with a fairy-tale-inspired premise, character scenes, and story progression. It is a Japanese import title where the Pinocchia name and 1999 PlayStation release date carry the listing.",
  "ps1-pipe-dreams-3d":
    "Pipe Dreams 3D turns the pipe-connection puzzle idea into a 3D PlayStation format, asking players to route flow through spatial layouts before time or pressure catches up. It is a puzzle entry for players who like planning paths under constraints.",
  "ps1-pixygarden":
    "Pixygarden is a Japanese PlayStation simulation from Imageworks and Escot built around raising, nurturing, and managing a small fantasy garden. Its appeal is slower and more routine-driven than an action game, with collector interest tied to its late-1990s import niche and distinctive life-sim premise.",
  "ps1-plarail-tetsudou-monoshiri-hyakka":
    "Plarail Tetsudou Monoshiri Hyakka is an Atlus-published educational PlayStation release connected to Takara's Plarail train brand. It functions more like an interactive railway encyclopedia for younger players than a traditional train simulator, making the license and learning angle the key reasons to catalog it.",
  "ps1-play-de-oboeru-chuugaku-eitango-deruderu-1200":
    "Play de Oboeru Chuugaku Eitango Deruderu 1200 is part of Nagase Brothers' Play de Oboeru study line, using PlayStation software as a drill tool for junior-high English vocabulary. The value for readers is knowing this is exam-practice software, not a story game or arcade release.",
  "ps1-play-de-oboeru-eijukugo-deruderu-750":
    "Play de Oboeru Eijukugo Deruderu 750 focuses the same study-software format on English idioms and set phrases. It belongs in the PlayStation library as a Japanese education title, useful for collectors who want the platform's nontraditional classroom and test-prep software represented accurately.",
  "ps1-play-de-oboeru-eitango-deruderu-1700-center-shiken-level-taiou":
    "Play de Oboeru Eitango Deruderu 1700: Center Shiken Level Taiou is a vocabulary-training release aimed at Japan's university entrance exam level. Its long subtitle matters because it separates this volume from the middle-school and TOEIC-focused entries in the same educational series.",
  "ps1-play-de-oboeru-kanji-kentai-deruderu-1100":
    "Play de Oboeru Kanji Kentai Deruderu 1100 turns kanji certification practice into a PlayStation study program, emphasizing repeated quiz work and recognition drills. It is best presented as Japanese test-prep software rather than a puzzle game, even though the play loop is question-and-answer based.",
  "ps1-play-de-oboeru-series-nihonshi-quiz-deruderu-1800":
    "Play de Oboeru Series Nihonshi Quiz Deruderu 1800 is a Japanese-history quiz volume in Nagase Brothers' education line. It is built for memorization and exam-style recall, so the important public context is subject matter, study purpose, and its separation from the language-focused Deruderu releases.",
  "ps1-play-de-oboeru-series-sekaishi-quiz-deruderu-1800":
    "Play de Oboeru Series Sekaishi Quiz Deruderu 1800 applies the Deruderu quiz format to world-history study. It is a reference and practice title first, giving PlayStation collectors a clear example of the console's late-era Japanese educational catalog outside normal entertainment genres.",
  "ps1-play-de-oboeru-toeic-test-goku-deruderu-1700":
    "Play de Oboeru TOEIC Test Goku DeruDeru 1700 is an English test-preparation title focused on TOEIC-style vocabulary and review. It should be grouped with study aids rather than general puzzle games, with the TOEIC label explaining exactly who the software was made for.",
  "ps1-play-stadium":
    "Play Stadium is Banpresto's first PlayStation baseball entry, offering a straightforward Japanese hardball package before the series expanded through sequels. It matters as the starting point of a compact sports line, especially for collectors comparing annualized baseball releases on PS1.",
  "ps1-play-stadium-2":
    "Play Stadium 2 continues Banpresto's baseball series with another season-style PlayStation sports package. The sequel number is the useful identifier: this is not a variant of the first game, but a separate late-1990s entry in a run of Japanese baseball releases.",
  "ps1-play-stadium-3":
    "Play Stadium 3 is the third Banpresto PlayStation baseball release, keeping the focus on approachable match play and roster-era sports presentation. It belongs in the library as part of the console's deep Japan-only baseball shelf, where year and volume matter.",
  "ps1-play-stadium-4-fumetsu-no-dai-league-ball":
    "Play Stadium 4: Fumetsu no Dai League Ball closes out Banpresto's numbered PS1 baseball line with a more specific subtitle and late-generation release slot. It should be cataloged by full title because the subtitle helps separate it from the earlier Play Stadium games.",
  "ps1-player-manager":
    "Player Manager adapts Anco's football management series to PlayStation, mixing squad control, tactical planning, transfers, and match-day decision-making. It is closer to a sports-management sim than an action football game, with appeal for players who prefer building a club over playing every pass.",
  "ps1-player-manager-2000":
    "Player Manager 2000 updates Anco's football-management formula for the 1999-2000 era, keeping the emphasis on team building, transfers, tactics, and season progression. It should be tracked separately from earlier Player Manager entries because annual context is central to sports-management software.",
  "ps1-player-manager-ninety-nine":
    "Player Manager Ninety Nine is a late-1990s football-management entry centered on club decisions, squad composition, and long-season planning. Its value is strongest for readers tracking the evolution of console management games before the genre became common on later systems.",
  "ps1-pocke-kano-fumio-ueno":
    "Pocke-Kano: Fumio Ueno is a Datam Polystar character-focused adventure and dating-sim release built around one heroine route. It is one of several companion Pocke-Kano discs, so the character name is essential for identifying the correct volume.",
  "ps1-pocke-kano-shizuka-houjouin":
    "Pocke-Kano: Shizuka Houjouin is a separate Datam Polystar romance-adventure volume focused on Shizuka rather than the other Pocke-Kano characters. Readers should treat it as a distinct scenario disc within the same character-series structure.",
  "ps1-pocke-kano-yumi-aida":
    "Pocke-Kano: Yumi Aida is the Yumi-centered entry in Datam Polystar's Pocke-Kano line, built around conversation, character scenes, and route-style progression. It is best cataloged alongside the other named volumes so marketplace listings do not blur them together.",
  "ps1-pocket-dungeon":
    "Pocket Dungeon is a Sony-published PlayStation RPG from Liquid that leans into compact dungeon exploration, character growth, and repeated runs. It is a lesser-known first-party Japanese release, useful for players hunting beyond the famous Square and Enix RPGs.",
  "ps1-pocket-family-happy-family-plan":
    "Pocket Family: Happy Family Plan is a Hudson Soft life-simulation and family-management title built around daily routines, relationships, and domestic goals. It fits the PlayStation's quirky Japanese sim catalog rather than its action or RPG shelves.",
  "ps1-pocket-jiman":
    "Pocket Jiman is a Sugar & Rockets and Sony Computer Entertainment release with collection, communication, and simulation flavor. It sits near the same experimental corner of Sony's PS1 catalog as other small-scale lifestyle and toy-like projects.",
  "ps1-pocket-muumuu":
    "Pocket MuuMuu is a Sugar & Rockets PlayStation adventure/simulation oddity built around playful interaction, minigame-like moments, and a distinctly Japanese presentation style. It is memorable because it feels closer to a digital toybox than a conventional genre piece.",
  "ps1-pocket-tuner":
    "Pocket Tuner is a Riverhillsoft PlayStation utility and music-adjacent release centered on tuning and sound practice rather than ordinary game progression. Its empty publisher metadata makes the developer credit and exact title especially important for clean cataloging.",
  "ps1-pojitto":
    "Pojitto is a compact Japanese puzzle game from Kan's and Play Avenue, built around simple rules, quick decisions, and repeatable board challenges. It is the sort of small PS1 puzzle release where the concept matters more than story or production scale.",
  "ps1-ponkkikkids-21":
    "Ponkkikkids 21 is a Sunsoft release tied to the long-running Japanese children's TV brand Ponkickies. It belongs with PlayStation's family and kids-media software, where license context explains the audience better than a generic adventure label.",
  "ps1-pool-academy":
    "Pool Academy is a PlayStation billiards title focused on cue control, shot angles, table positioning, and practice-style play. It is useful as a straightforward pool entry for collectors sorting sports simulations from arcade compilations and pub-game collections.",
  "ps1-pool-shark":
    "Pool Shark brings billiards to PlayStation with match play, aiming, spin, and table-management fundamentals. Its Gremlin and THQ publishing history makes it part of the system's Western budget and sports-game shelf rather than a Japanese parlor release.",
  "ps1-pop-de-cute-na-shinri-test-alabama":
    "Pop de Cute na Shinri Test: Alabama is a D3 Publisher personality-test and light adventure-style release with quiz content and character presentation. It should be described as psychology-test entertainment, not a normal visual novel, because the appeal is the themed test format.",
  "ps1-pop-n-music-3-append-disc":
    "Pop'n Music 3 Append Disc is an expansion-style Konami rhythm release that adds more songs and content for players already invested in the Pop'n Music setup. The Append Disc label is important because it signals companion software, not a standard numbered sequel.",
  "ps1-pop-n-music-4-append-disc":
    "Pop'n Music 4 Append Disc continues Konami's add-on approach for its button-based arcade rhythm series, extending the home song library for dedicated players. It should be identified as an append release so readers understand its relationship to the main Pop'n Music discs.",
  "ps1-pop-n-music-5":
    "Pop'n Music 5 is a mainline PlayStation entry in Konami's colorful arcade rhythm series, built around large-button note charts, broad song variety, and replaying tracks for cleaner timing. It is a stronger catalog entry than the generic rhythm label suggests.",
  "ps1-pop-n-music-6":
    "Pop'n Music 6 is another mainline PS1 entry in Konami's arcade rhythm series, expanding the song selection and preserving the bright character presentation that defines Pop'n Music. It is mainly for rhythm-game fans tracking the series before later hardware generations.",
  "ps1-pop-n-music-animation-melody":
    "Pop'n Music: Animation Melody is a themed Konami rhythm release built around anime and animation-related songs within the Pop'n Music format. The subtitle is the key: it is not just another numbered entry, but a focused music selection for a specific fan audience.",
  "ps1-popolocrois":
    "PoPoLoCrois is a Sony Computer Entertainment Japan RPG with storybook fantasy presentation, gentle character drama, and turn-based adventure structure. It is one of Sony's important Japan-first RPG properties on PlayStation and deserves more context than a generic role-playing label.",
  "ps1-popolocrois-monogatari-ii":
    "PoPoLoCrois Monogatari II continues the storybook RPG world with a larger sequel built around character-driven adventure, fantasy travel, and series continuity. It is a separate mainline follow-up, not a variant of the original PoPoLoCrois listing.",
  "ps1-poporogue":
    "PoPoRoGue is a PoPoLoCrois-related RPG spin-off that leans into roguelike dungeon structure while keeping the series' warm fantasy identity. It stands out because it changes the play rhythm from storybook adventure into repeated dungeon exploration.",
  "ps1-popstar-maker":
    "Popstar Maker is a management simulation about developing a music act, balancing training, scheduling, presentation, and career growth. It fits the PlayStation's small but interesting entertainment-industry sim niche rather than the broader life-sim category.",
  "ps1-potestas":
    "Potestas is a Nexus Interact PlayStation puzzle game built around abstract problem-solving and compact stages. It is a lesser-known Japanese release, but a clean overview should frame it as a puzzle title first instead of repeating publisher metadata.",
  "ps1-power-dolls-2-detachment-of-limited-line-service":
    "Power Dolls 2: Detachment of Limited Line Service brings Kogado Studio's tactical mecha strategy series to PlayStation with squad management, mission planning, and turn-based combat. It is important for strategy collectors because the Power Dolls name carries a distinct PC tactics lineage.",
  "ps1-power-league":
    "Power League is Hudson Soft's PlayStation baseball entry, connected to a long-running sports line that appeared across multiple systems. It offers Japanese baseball play with the emphasis on matches and team competition rather than management simulation.",
  "ps1-power-move-pro-wrestling":
    "Power Move Pro Wrestling is a Yuke's-developed wrestling game with grappling, ring positioning, and a pre-WWF SmackDown look at the studio's wrestling-game craft. It is notable because Yuke's would become one of the most important wrestling developers of the PlayStation era.",
  "ps1-power-play-sports-trivia":
    "Power Play Sports Trivia is a quiz game aimed at sports fans, built around answering category questions rather than simulating any one sport. It belongs in the puzzle/trivia shelf and should not be treated like a conventional athletic competition game.",
  "ps1-power-rangers-zeo-full-tilt-battle-pinball":
    "Power Rangers Zeo Full Tilt Battle Pinball combines the Power Rangers Zeo license with themed pinball tables, flipper timing, ramps, and score goals. The draw is the Bandai character license layered onto arcade pinball, not a standard action game.",
  "ps1-power-shovel":
    "Power Shovel is Taito's construction-machine action game, turning excavator controls and worksite tasks into arcade challenges. It is far more unusual than a normal racing label implies, with appeal built around operating heavy machinery under time and precision pressure.",
  "ps1-power-stakes":
    "Power Stakes is a Tose-developed horse-racing and betting simulation focused on race cards, odds, and parlor-style play. It should be grouped with Japanese racing-gambling software rather than broad sports games because the wagering structure is central.",
  "ps1-power-stakes-2":
    "Power Stakes 2 continues Aques and Tose's horse-racing simulation line with another volume of race prediction, odds, and betting-focused play. The sequel number is important because these entries can look nearly identical in generic database records.",
  "ps1-power-stakes-grade-1":
    "Power Stakes Grade 1 is another entry in the same horse-racing simulation series, using the Grade 1 subtitle to signal a distinct release. It is a specialist PlayStation racing-betting title where exact naming matters for collectors.",
  "ps1-prince-of-tennis":
    "Prince of Tennis adapts the manga and anime tennis property into a PlayStation sports release, giving fans character-driven tennis rather than a generic pro-tour simulation. The Konami license context is the key reason it stands apart from ordinary tennis games.",
  "ps1-prince-of-tennis-sweat-and-tears":
    "Prince of Tennis: Sweat & Tears shifts the license toward character progression and story-flavored tennis activity, making it more fan-service driven than a standard match-only sports game. It should be cataloged separately from the earlier Prince of Tennis release.",
  "ps1-princess-maker-go-go-princess":
    "Princess Maker: Go! Go! Princess turns Gainax's raising-sim world into a lighter board-game style PlayStation spin-off. It is best understood as a companion release for Princess Maker fans rather than a normal life simulator.",
  "ps1-princess-maker-pocket-daisakusen":
    "Princess Maker: Pocket Daisakusen is a puzzle spin-off from the Princess Maker series, using familiar characters in a compact competitive puzzle format. The series connection matters because it is not the same kind of child-raising simulation as the main Princess Maker games.",
  "ps1-prism-court":
    "Prism Court is a Fujitsu visual novel and dating-sim style release set around high-school volleyball, character events, and relationship routes. It mixes sports-club framing with story-first progression, giving it a clearer hook than the generic visual-novel tag.",
  "ps1-prismaticallization":
    "Prismaticallization is an Arc System Works adventure/visual novel known for its looping structure and unusual approach to revisiting events. It is one of the developer's more obscure story-game releases, interesting because it sits far from the fighting games Arc System Works became famous for.",
  "ps1-prisoner":
    "Prisoner is a Feycraft and Mycom PlayStation puzzle/adventure release with an escape-oriented title identity and compact problem-solving focus. It sits in the lower-profile import catalog, where clear genre framing helps separate it from unrelated games with similar names.",
  "ps1-pro-backgammon":
    "Pro Backgammon brings the classic board game to PlayStation with dice rolls, doubling-cube strategy, and positional play. It is a direct tabletop adaptation, useful for players looking for traditional board-game software rather than action or puzzle hybrids.",
  "ps1-pro-bodyboarding":
    "Pro Bodyboarding is a Midas-published sports release focused on wave riding, timing, tricks, and ocean-course scoring. It fills a niche between surfing games and budget extreme-sports titles late in the PlayStation's life.",
  "ps1-pro-logic-mahjong-hai-shin":
    "Pro Logic Mahjong Hai-Shin is an Aques mahjong release built around tile reading, hand building, and traditional table play. It should be presented as dedicated mahjong software, where rule familiarity matters more than arcade spectacle.",
  "ps1-pro-mahjong-kiwame-plus":
    "Pro Mahjong Kiwame Plus is Athena's PlayStation entry in the long-running Kiwame mahjong line, focused on serious table play and CPU competition. It is a specialist board-game release for players who already understand Japanese mahjong fundamentals.",
  "ps1-pro-mahjong-kiwame-plus-ii":
    "Pro Mahjong Kiwame Plus II continues Athena's mahjong series with another PlayStation package of tile strategy and table competition. The sequel label should be preserved because Kiwame has many related releases across platforms.",
  "ps1-pro-mahjong-kiwame-tengensenhen":
    "Pro Mahjong Kiwame Tengensenhen is a dedicated Japanese mahjong release from Athena, focused on table play, tile reading, and CPU competition rather than arcade gimmicks. It belongs to the Kiwame branch of serious mahjong software on PlayStation.",
  "ps1-pro-mahjong-tsuwamono-2":
    "Pro Mahjong Tsuwamono 2 continues Culture Brain's mahjong line with traditional tile strategy, opponent play, and specialist presentation for experienced players. It is best understood as a sequel for mahjong fans rather than a broad casual puzzle game.",
  "ps1-pro-mahjong-tsuwamono-3":
    "Pro Mahjong Tsuwamono 3 is another Culture Brain mahjong entry built around serious Japanese table rules and CPU matches. Its importance is in separating the numbered Tsuwamono releases for collectors following PlayStation board-game software.",
  "ps1-pro-wrestling-sengokuden":
    "Pro Wrestling Sengokuden is a Japanese wrestling game with a management-flavored structure, roster building, and match presentation rooted in domestic pro-wrestling culture. It plays to wrestling fans interested in promotions and progression as much as individual bouts.",
  "ps1-pro-wrestling-sengokuden-2-kakutou-emaki":
    "Pro Wrestling Sengokuden 2: Kakutou Emaki expands Dream Japan's wrestling formula with more promotion drama, wrestler development, and match flow. It is a sequel for players who want the business and story side of pro wrestling on PS1.",
  "ps1-pro-wrestling-sengokuden-hyper-tag-match":
    "Pro Wrestling Sengokuden: Hyper Tag Match shifts the Sengokuden line toward tag-team action and ring matchups while keeping the series' Japanese wrestling identity. It is a distinct branch of the series rather than a simple roster refresh.",
  "ps1-pro-yakyu-netto-puzzle-stadium":
    "Pro Yakyu Netto: Puzzle Stadium turns baseball into a puzzle-style competition, using team and stadium flavor around quick problem-solving play. It is a sports-themed puzzle oddity rather than a conventional baseball simulation.",
  "ps1-pro-yakyuu-simulation-dugout-99":
    "Pro Yakyuu Simulation Dugout '99 is a baseball management release about roster decisions, season strategy, and dugout control instead of direct batting and pitching. It serves players who want front-office style baseball on PlayStation.",
  "ps1-project-gaiaray":
    "Project GaiaRay is a Japanese sci-fi shooter from Art, built around 3D presentation, enemy waves, and futuristic combat spectacle. It is one of the PlayStation's lesser-known attempts to bring arcade-style shooting into polygonal space.",
  "ps1-project-v6":
    "Project V6 is a General Entertainment release tied to the Japanese boy band V6, mixing celebrity license appeal with mini-game and fan-service presentation. It is mainly relevant as music-idol software from the PlayStation's multimedia era.",
  "ps1-proof-club":
    "Proof Club is a Yutaka adventure release centered on conversation, investigation, and character-driven mystery beats. It fits the PlayStation's Japanese story-game catalog, where reading and route progression matter more than action.",
  "ps1-psychic-force-puzzle-taisen":
    "Psychic Force: Puzzle Taisen recasts Taito's psychic-fighting cast into a competitive puzzle format. It is a crossover spin-off for fans who know the characters but want falling-block pressure instead of arena combat.",
  "ps1-psychometrer-eiji":
    "Psychometrer Eiji adapts the manga and drama property into a PlayStation adventure built around investigation, character scenes, and supernatural crime-solving. It is a licensed story game aimed at fans of the source material.",
  "ps1-puffy-p-s-i-love-you":
    "Puffy: P.S. I Love You is a music-celebrity release tied to the Japanese pop duo Puffy, built around fan interaction, presentation, and light game content. It reflects the PlayStation era's appetite for idol and music tie-ins.",
  "ps1-pukunpa-joshikousei-no-houkago":
    "Pukunpa: Joshikousei no Houkago is an Athena puzzle game with a school-life wrapper and bright character presentation. It is a niche import release where quick puzzle play is paired with visual-novel-style flavor.",
  "ps1-puma-street-soccer":
    "Puma Street Soccer trades stadium simulation for smaller street-football matches, brand-forward presentation, and faster arcade pacing. It is a late PlayStation sports release for players looking beyond the annual FIFA lane.",
  "ps1-punch-the-monkey-game-edition":
    "Punch the Monkey! Game Edition is a Lupin III music and rhythm-adjacent release tied to remix culture around the anime's soundtrack. Its appeal is style, music, and license energy rather than a traditional action campaign.",
  "ps1-puppet-zoo-pilomy":
    "Puppet Zoo Pilomy is a Human Entertainment character game about strange puppet-like creatures, mini-game play, and offbeat presentation. It sits in the PS1 catalog's experimental family-software corner.",
  "ps1-purumui-purumui":
    "Purumui Purumui is a cute, food-themed action-adventure release with item collecting, character interaction, and whimsical world design. It is one of the stranger Japanese PlayStation curios that rewards catalog readers with personality.",
  "ps1-pururun-with-shape-up-girls":
    "Pururun! With Shape UP Girls is a fitness-celebrity tie-in built around light exercise, video-style presentation, and the Shape UP Girls license. It belongs to the PlayStation's multimedia lifestyle experiments more than its sports library.",
  "ps1-puzzle-arena-toshinden":
    "Puzzle Arena Toshinden turns the Battle Arena Toshinden cast into a competitive puzzle game, using familiar fighters as the wrapper for match-based block clearing. It is a character spin-off, not another 3D weapon fighter.",
  "ps1-puzzle-mania":
    "Puzzle Mania is a Human Entertainment puzzle collection built around direct problem solving and accessible board-style challenges. It gives the PS1 library a straightforward casual puzzle option.",
  "ps1-puzzle-mania-2":
    "Puzzle Mania 2 follows Human Entertainment's first collection with another set of compact logic and board-style puzzle challenges. It is a sequel for players who want more small-format puzzle play on PS1.",
  "ps1-qix-2000":
    "Qix 2000 updates the classic territory-claiming arcade formula with PlayStation-era presentation, asking players to carve space while avoiding moving threats. It is a modernized take on a simple but tense arcade rule set.",
  "ps1-qix-neo":
    "Qix Neo reworks Taito's line-drawing territory game with brighter visuals, hazards, and updated stage flow. Players win by claiming enough space while managing the risk of exposing their moving line.",
  "ps1-queens-road":
    "Queens Road is an Angel-published Japanese adventure and simulation-style release with character interaction and story progression at its center. It is an import title for players exploring the PlayStation's deep visual-novel-adjacent library.",
  "ps1-quest-for-fame":
    "Quest for Fame is a music-performance game built around Aerosmith branding and guitar-controller style input, asking players to hit riffs and chase rock-star progression. It is an early example of rhythm and peripheral music games before the genre exploded.",
  "ps1-quiz-millionaire-waku-waku-party":
    "Quiz $ Millionaire: Waku Waku Party adapts the TV quiz-show format into a party trivia game with escalating questions and game-show pacing. It is a Japanese PlayStation take on the Who Wants to Be a Millionaire formula.",
  "ps1-quiz-charaokedon-touei-tokusatsu-hero-part-1":
    "Quiz Charaokedon! Touei Tokusatsu Hero Part 1 is a trivia release built around Toei special-effects heroes, asking fans to answer questions tied to familiar shows and characters. It is a license-heavy quiz game for tokusatsu devotees.",
  "ps1-quiz-charaokedon-touei-tokusatsu-hero-part-2":
    "Quiz Charaokedon! Touei Tokusatsu Hero Part 2 continues the Toei hero trivia format with another batch of character and series questions. It is a companion volume for collectors following tokusatsu quiz software.",
  "ps1-quiz-darake-no-jinsei-game":
    "Quiz Darake no Jinsei Game blends Takara's life-board-game identity with trivia challenges, sending players through event spaces and quiz prompts. It is a quiz-party spin on The Game of Life rather than a pure board-game adaptation.",
  "ps1-quiz-darake-no-jinsei-game-dai-2-kai":
    "Quiz Darake no Jinsei Game Dai-2-kai! returns to the life-board-game trivia format with more questions and event-driven party play. It is a second volume for players who enjoy board-game structure wrapped around quiz competition.",
  "ps1-quiz-de-battle":
    "Quiz de Battle turns trivia into direct competition, asking players to answer quickly and win matchups through knowledge rather than reflexes. It is a small DigiCube quiz release in the PS1 import catalog.",
  "ps1-quiz-master-blue":
    "Quiz Master Blue is one version of Success's color-coded trivia set, offering question banks and quiz progression under a simple theme. It is best cataloged alongside the Red and Yellow companion releases.",
  "ps1-quiz-master-red":
    "Quiz Master Red is a Success trivia release built around quiz rounds, category knowledge, and color-version branding. Its value is clearer when grouped with the other Quiz Master versions.",
  "ps1-quiz-master-yellow":
    "Quiz Master Yellow completes the visible color trio of Success's PlayStation trivia releases, giving players another question set and version label. It is a specialist quiz entry rather than a story or arcade game.",
  "ps1-quo-vadis-iberukatsu-seneki":
    "Quo Vadis: Iberukatsu Seneki is a strategy game with sci-fi military factions, tactical decisions, and story-driven campaign framing. It belongs to the PlayStation's import strategy catalog, where presentation and planning outweigh action.",
  "ps1-r-rock-n-riders":
    "R: Rock'n Riders is a racing release with music-culture flavor, character attitude, and arcade course competition. It is a niche PlayStation racer with more style branding than simulation depth.",
  "ps1-r-mj-the-mystery-hospital":
    "R?MJ: The Mystery Hospital is a horror-tinged adventure set around a hospital mystery, using exploration, character scenes, and tense story progression. It is a Japanese story release for players interested in PS1-era suspense games.",
  "ps1-racingroovy-vs":
    "Racingroovy VS is a Sammy racing game built around compact course competition and arcade-style handling. It is a lesser-known import racer rather than a Gran Turismo-style simulation.",
  "ps1-rageball":
    "Rageball is a futuristic sports game that mixes arena competition, rough contact, and ball-control objectives. It fits the PlayStation's late-era budget catalog of alternative sports experiments.",
  "ps1-rakushiku-manabu-unten-menkyo":
    "Rakushiku Manabu Unten Menkyo is driving-license study software, using quiz practice and road-rule instruction to help Japanese users prepare for tests. It is practical education software, not a racing game.",
  "ps1-rally-cross":
    "Rally Cross is Sony's off-road racer built around dirt tracks, jumps, vehicle handling, and competitive arcade events. It gave early PlayStation owners a more rugged racing option beside road-course titles.",
  "ps1-rally-de-africa":
    "Rally de Africa is a Prism Arts rally racer focused on African course themes, loose-surface driving, and stage-based competition. It is part of the developer's regional rally line on PlayStation.",
  "ps1-rally-de-europe":
    "Rally de Europe follows Prism Arts' rally format with European course themes and arcade-style off-road racing. It pairs naturally with Rally de Africa for collectors tracking the series.",
  "ps1-ramen-hashi":
    "Ramen Hashi is a food-themed action puzzle release from Tomy built around serving ramen and managing quick tasks. It is a playful slice of Japanese everyday-culture software in the PS1 library.",
  "ps1-rampage-through-time":
    "Rampage Through Time sends Midway's giant monsters across history, smashing cities, eating civilians, and battling hazards in side-scrolling destruction stages. It keeps the series' arcade chaos while using time-period themes for variety.",
  "ps1-rascal-racers":
    "Rascal Racers is a budget kart-style racer with colorful characters, simple tracks, and accessible handling. It sits in the family-friendly racing lane rather than the technical driving-sim space.",
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

const games = readJsonIfExists(ps1Path, null);
const manifest = readJsonIfExists(manifestPath, {});
if (!Array.isArray(games)) throw new Error("Run scripts/import-ps1-official-list.js first.");

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

writeJson(ps1Path, games);
writeJson(manifestPath, {
  ...manifest,
  editorialSeededAt: new Date().toISOString(),
  editorialSeedCount: seeded,
  overviewStatusCounts,
});

console.log(`Seeded ${seeded} PS1 editorial overviews.`);
console.log(`Published overviews: ${overviewStatusCounts.published || 0}/${games.length}.`);
