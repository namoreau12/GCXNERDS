const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");

const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");
const sample = process.argv.includes("--sample");

const platforms = requested.length
  ? requested
  : fs
      .readdirSync(gamesDir)
      .filter(isGameDatasetFile)
      .map((file) => file.replace(/\.json$/, ""))
      .sort();

function readJson(filePath, fallback = null) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
}

function writeJson(filePath, value) {
  writeJsonAtomic(fs, filePath, value);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function list(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === undefined || value === null || !String(value).trim()) return [];
  return String(value)
    .split(/\s*,\s*/)
    .filter(Boolean);
}

function usefulDescriptors(values) {
  const generic = new Set([
    "official release",
    "licensed",
    "modern",
    "retro",
    "cartridge",
    "cd-rom",
    "blu-ray",
    "digital",
    "game card",
    "eshop",
    "playstation",
    "sony playstation",
    "sony",
    "playstation portable",
    "ps1",
    "ps2",
    "ps3",
    "ps4",
    "ps5",
    "psp",
    "ps vita",
    "vita",
    "nes",
    "super nintendo",
    "snes",
    "nintendo entertainment system",
    "nintendo 64",
    "n64",
    "nintendo ds",
    "ds",
    "nintendo 3ds",
    "3ds",
    "2ds",
    "game boy",
    "game boy color",
    "game boy advance",
    "gba",
    "nintendo switch",
    "switch",
    "nintendo switch 2",
    "switch 2",
    "gamecube",
    "nintendo gamecube",
    "wii",
    "xbox",
    "xbox 360",
    "dreamcast",
    "saturn",
    "sega genesis",
    "genesis",
    "modern retro",
    "umd",
  ]);

  return values.filter((value) => !generic.has(normalize(value)));
}

function humanList(values, fallback = "") {
  const clean = Array.from(new Set(values.filter(Boolean))).slice(0, 3);
  if (!clean.length) return fallback;
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean[0]}, ${clean[1]}, and ${clean[2]}`;
}

function releaseText(game) {
  const value = game.releaseDate || game.firstReleaseDate || game.releaseYear || game.year || list(game.releaseYears)[0] || "";
  if (!value) return "";
  const year = String(value).match(/\b(19|20)\d{2}\b/)?.[0];
  return year ? ` released around ${year}` : "";
}

function hasUsefulOverview(game) {
  if (game.overviewStatus === "needs_editorial") return false;
  const genericPhrases = [
    "officially released",
    "official release",
    "game record",
    "licensed north american",
    "software list",
    "cataloged nes release",
    "catalogued nes release",
  ];
  return [game.description, game.gcxOverview, game.overview].some((overview) => {
    if (!String(overview).trim() || String(overview).trim().length < 80) return false;
    const normalized = normalize(overview);
    return !genericPhrases.some((phrase) => normalized.includes(phrase));
  });
}

function inferTags(game) {
  const text = normalize([
    game.title,
    ...usefulDescriptors(list(game.genres)),
    ...usefulDescriptors(list(game.tags)),
  ].join(" "));
  const tags = [];

  const checks = [
    [/rpg|role playing|\bhack\b|7th dragon|agarest|astonishia|another bible|aretha|dragon quest|dragon warrior|final fantasy|persona|atelier|tales of|ys\b|suikoden|shin megami|mana\b|super robot wars|super robot taisen|generation of chaos|alnam|busin|wizardry|baroque|bealphareth|arcana strikes|cardinal arc|asuncia|castle fantasia|dragon master|blue roses|blue breaker|bounty sword|brave saga|brave sword|brightis|class of heroes|elminage|entaku no seito|farland saga|farland story|faxanadu|fire emblem|fushigi no dungeon|chocobo no fushigi|chocobo to mahou|demikids|dragon slayer|hydlide|ghost lion|gemfire|dungeon magic|legacy of the wizard|king s knight|kings knight|legendary wings|little ninja brothers|l empereur|alchemic dungeons|alphadia|asdivine cross|arkana senki|bardysh|blademaker|chiisana oukoku|civizard|chou mashin eiyuuden|cross hunter|crystal beans|burai|benkei gaiden|ancient magic|bushi seiryuuden|densetsu no oga|densetsu no ōga|eiyu shigan|eiyū shigan|community pom|dark half|dark kingdom|dark law|elfaria|energy breaker|doki doki densetsu|dt lords of genomes|dungeon land|brave dungeon|bonds of the skies|bit dungeon|aura battler|diablo|crime crackers|densetsu kemono|dungeon savior|g-o-d|g o d|galaxy robo|gamera|gran dread|grandread/, "role-playing"],
    [/visual novel|otome|dating|renai|renka|koishitara|koi no|koi ka|kono koi|kimochi|kimi no|kanojo|cinderella|shiawase|120 yen stories|sakura wars|da capo|memories off|another memories|higurashi|clannad|3x3 eyes|3 3 eyes|kinpachi|akatsuki no goei|akb1\/|akaya akashiya|angelique|angel profile|angel wish|angel s feather|angel graffiti|ayakashibito|cartagra|can can bunny|album club|my darling|daisuki|aitakute|aishiau|anoko|aoi no mamade|arcobaleno|asobi ni iku|clear atarashii|colorful box|dear my friend|desert kingdom|dessert love|edel blume|corda|la corda|kakyusei|kiss yori|kekkon|amnesia|black wolves saga|boku wa kimidake|chaos head|clock zero|cross channel|death connection|double cast|dream c club|dunamis|ever17|eve new generation|d a white|erde|fantastic fortune|fragments blue|full house kiss|captain love|chocolate kiss|cocktail harmony|blend x brand|circadia|breath toiki|find love|finder love|gift prism|geten no hana|quinrose|otomate|ruby party|broccoli|interchannel|nec interchannel|prototype|princesssoft|regista|alchemist|entergram|hune x|hunex|palette|giga|azurite|dramatic create|takuyo|starlight marry|idea factory.*comfort|comfort.*idea factory|chuushingura|furasera|fushigi yuugi|futakoi|anearth fantasy|amagi shien|angel paradise|digital ange|doukoku|free talk studio|fate stay night|fuuraiki|gakuen alice|beyond the future|chronostacia|d c girls|danzai no maria|dear drops|confidential money|girl doll toy|gekka no kishi/, "visual novel"],
    [/platform|mario|sonic|kirby|crash|spyro|mega man|klonoa|rayman|gnomz|excitebike|kid icarus|baby felix|alfred chicken|a boy and his blob|aerial knight|ab or igenus|aborigenus|agent hugo|casper|caveman rock|bubble bobble|clu clu land|chip n dale|battletoads|amagon|balloon fight|blaster master|bucky o hare|burgertime|city connection|clash at demonhead|dig dug|digger t rock|donkey kong|duck tales|ducktales|felix the cat|ghosts n goblins|kid klown|kid kool|kickle cubicle|bloo kid|bird mania|bike rider|boxboxboy|chibi robo|chicken wiggle|gummy bears|chubby cherub|castelian|little nemo|little samson|lode runner|m c kids|low g man|disney s dinosaur|the surprise at dinosaur peak|kim possible|lilo|stitch|peter pan|jungle book|little mermaid|amazing penguin|bad batsumaru|balloon kid|bugs bunny|crazy castle|chalvo 55|chacha maru|finkles world|chiki chiki tengoku|daiku no gen|dr franken|coron land|donald duck|brutus and futee|bubble pop world|hugo magic/, "platforming"],
    [/racing|racer|race america|turbo racing|overdrive|gran turismo|forza|need for speed|burnout|ridge racer|kart|mini 4wd|yonku|motogp|nascar|rally|f1\b|formula|f-1|4x4|18 wheeler|american chopper|cobra 11|hang on|outrun|out run|super hang on|air race|bakusou|dekotora|choro q|choroq|zokusha|autobahn|drift grand prix|critical velocity|dirt track|dt carnage|glacier 2|glacier 3|gt pro series|harley davidson|circuit beat|cart world series|cart kings|c1 circuit|carrera power slide|demon driver|fastest lap|ferrari grand prix|super off road|aironauts|atv mania|atv wild ride|atv quad|chevrolet camaro|motocross|quad kings|art camion|buckle up|extreme sprint|airace|aguri suzuki|chiki chiki machine|cannondale cup|daytona usa|dakar|crime killer|hot wheels|dynamic stadium|absolute supercars|dave mirra|freestyle bmx|deadheat road|deadly skies|chari-sou|chari sou|kawasaki snowmobiles/, "racing"],
    [/soccer|football|fifa|pes\b|winning eleven|madden|nfl|nba|basketball|baseball|koshien|yakyuu|kyuudan|captain tsubasa|mlb|nhl|hockey|afl\b|tennis|golf|wwe|wrestling|ufc|boxing|judo|karate|ashita no joe|volleyball|olympic|bowling|10 pin|\bpool\b|billiards|8ball|foosball|darts|aerobics|watersports|skiing|skateboard|snowboard|surfing|fishing|bass|fish on|hunting|deer hunt|deer hunter|cabela|buck hunter|derby|jockey|gladiators|arch rivals|blades of steel|bases loaded|cyberball|indy heat|bottom of the 9th|break volley|cricket|biathlon|decathlon|california games|gold medal|dodgeball|dodge ball|double dare|espn international track|goal!|goal two|harlem globetrotters|hoops|quarterback|jordan vs bird|beast sapp|cool shot|crusty demons|david douillet|downhill slalom|billiard|battle athletess|boxer s road|championship manager|balls of fury|big beach sports|deca sports|deadliest catch|power pro|sluggers|sports megamix|sports challenge|big league sports|beach fun|acb total|foot 2 rue|keirin|doh!!|slammin|eyeshield|champion wrestler|bo jackson|bakuchou retrieve|chousoku spinner|dan doh|eikan wa kimini|fightbox|bb ball|calcio bit|european super league|greg hastings paintball|honda atv fever|backyard sports|best friends tonight|chou nep league|buck fever|canada hunt|deer drive|paintball|inazuma eleven|intervilles|jelly belly ballistic|jikkyo powerful|jikkyō powerful|battle jockey|american battle dome|gaelic games|digical league|dodge boy|downtown nekketsu|daiundoukai|fire pro|hybrid wrestler|greatest nine|gekitosu koushien|gekitotsu koushien|junior league sports|diva girls princess on ice|kid fit island/, "sports"],
    [/party|mini game|minigame|family games|family game|eyetoy|eye toy|game party|party pack|playground|funfair|wii play|wii party|bishi bashi|buzz junior|bakushou|jinsei game|momotarou|gatta have games|gotta have games|around the world in 50 games|chuck e cheese|deal or no deal|family feud|family fortunes|fun house|hollywood squares|jeopardy|golden balls|arcade usa|arcade zone|cyclone circus|dai guruguru onsen|dynamite 100|apples to apples|backgammon blitz|bang!|beer pong|desi adda|games of india|club penguin game day|cranium kabookii|dokapon|family fest|fort boyard|montagsmaler|bokan go go go|ex okuman chouja|casual mania|best of arcade|go play|ginsei table games|bing bing bingo|daibakushou jinsei|bishi jo variety|bishōjo variety|dx nippon tokkyuu|dragon s dream|dekiru game center|dengeki construction|gacharoku|bokura no telebi|cool 104|countdown the game|crazy school games|game no tatsujin|game no tetsujin|haneru no tobira|celebrity get me out|kiki trick/, "party"],
    [/\bpachinko\b|\bpachislo\b|\bpachi-slot\b|\bslot\b|casino|poker|blackjack|caesars palace|cr marilyn|cr matsuura|pachi|fever \d|dynamite the las vegas|gambling hourouki|golden nugget|dx monopoly|monopoly gb|ex monopoly/, "casino"],
    [/puzzle|pazuru|tetris|sudoku|picross|mahjong|janshi|jansou|yakuman|shogi|crossword|brain|quiz|1 vs 100|trivia|block kuzushi|reversi|hanafuda|trump|chess|checkmate|darts|igo\b|solitaire|card games|card battle|cardfight|duel masters|board game|sugoroku|catan|pinball|psycho ball|classic games|all time favorites|1000 bornes|4 elements|7 wonders|wonders of the ancient world|panel de pon|puyo|columns|qix|bust a move|bust a bloc|boulder dash|match 3|hidden object|arkanoid|anticipation|battleship|classic concentration|breakthru|breakthru!|beta bloc|blockids|builder s block|building crush|calcolo|carom shot|cool ball|cool hand|box up|boxzle|block a pix|blok drop|brick|bricks|color cubes|color zen|bookworm|carcassonne|amida|burning paper|buster brothers|hatris|loopz|m u l e|mule|akagi|block and switch|block switch|block buster|alasongdalssong|myeonghwatamheom|and kensaku|geon cube|cube battler|daitoride|eisei meijin|acid\b|call of atlantis|card de asobu|card ii|bikkuriman|colorful logic|cho nazo|chotto aima|chao dream touch|chinhai|fruitfall|bakenou tv|bakenou v3|cranky pro|crazy balloon|crazy climber|crossroad crisis|culdcept|cinnamon ball|classic word games|breakout defense|block factory|blockform|dharma doujou|dangan|crossroad crisis|cradle of rome|jewel master|flipull|franky joe dirk|64 hanafuda|elmo s number journey|active neurons|access denied|amazing breaker/, "puzzle"],
    [/fighting|fighter|tekken|street fighter|mortal kombat|virtua fighter|guilty gear|blazblue|king of fighters|naruto|dragon ball|dead or alive|bleach|asuka 120|kamen rider|b d ball|battle arena toshinden|battle master|blade arcus|choujin gakuen|final fight|hokuto no ken|fist of the north star|karate champ|b d ball|dodge ball|urban champion|streets of rage|altered beast|gunstar heroes|shinobi|advanced v g|gekka no kenshi|last blade|dragon sisters|celebrity deathmatch|battle crusher|fatal fury|fist\b|funky head boxers|fuuun super combo|dead or alive \d ultimate|dronez|grid runner/, "fighting"],
    [/shooter|shoot|fps|combat academy|aces of the air|airwolf|alpha mission|call of duty|battlefield|medal of honor|halo|doom|quake|sniper|gun|zombie|007|james bond|ace combat|airforce delta|air force delta|air raid|airborne troops|after burner|galaxy force|thunder blade|1942|1945|joint strike|bulletproof|blood on the sand|raiden|airgrave|choplifter|captain skyhawk|cabal|cobra triangle|contra force|chaos field|darius|cotton 2|combat ace|combat queen|critical bullet|dead eye jim|detonator|blades of thunder|chicken blaster|chicken hunter|dino strike|destination earthstar|dropzone|f 15 strike eagle|f 18 thunder strike|freedom force|galaga|gradius|gyruss|heavy barrel|hogans alley|ikari warriors|image fight|jackal|journey to silius|air fortress|alien breed|astro invaders|astro tripper|big sky infinity|blazing angels|carnivores dinosaur hunter|cosmophony|cryptract|blade arts|bomb boat|laser invasion|endgame|energy airforce|ex zeus|asteroids|centipede|cotton original|bazooka blitzkrieg|cosmo tank|cyraid|g vector|death wing|destructo|chopper attack|chicago enforcer|america s army|battlestar galactica|aces of the luftwaffe|aircraft evolution|cazzarion.*flak|cazzarion.*rocket|cazzarion.*space ace/, "shooter"],
    [/action|beat em|brawler|army men|soldiers|assault suits|avatar|bakugan|ben 10|blood will tell|blood the last vampire|blood\+|black cat|boboboubo|bomberman|chain dive|chaindive|attack of the saucerman|beyblade|battletanx|bad dudes|bad street brawler|captain america|darkman|code name viper|cowboy kid|akudaikan|bakufuu slash|astyanax|bad street|batman|beetlejuice|bigfoot|bump n jump|choaniki|monster hunter|akumajo dracula|castlevania|demon sword|dick tracy|die hard|dirty harry|double dragon|dr jekyll|dragon power|dynowarz|g i joe|godzilla|golgo 13|gotcha|gumshoe|gyromite|home alone|hudson hawk|indiana jones|infiltrator|iron tank|ironsword|jaws|jurassic park|karnov|attack on titan|battle cats|battleminer|blast em|bugs vs tanks|chain blaster|chou sentou|crayon shin|croket|ct special forces|cyber drive zoids|daikaijuu battle|dragon blade|emergency heroes|excite truck|aeternoblade|alienators|battle b daman|battlebots|butt ugly martians|catwoman|chaos control|chaos code|castle of illusion|deadly strike|demolition girl|d gray man|dna dark native|macross|dynamite cop|expendables|fairy tail|final armada|angel blade|bounty hunter sara|blood\+|code of the samurai|crazy chicken x|dice dna|eureka seven|evangelion jo|alien chaos|alien on the run|assassination classroom|alien vs predator|alien³|b daman|blazer drive|b team metal|battle of giants|battle spirits|microman|blade\b|fire heroes|fantastic four|baskelian|dark wind|chosoju mecha|chōsōjū mecha|angry bunnies|battle of elemental|bearshark|beast saga|blasting agent|bomb monkey|chou majin eiyuuden|cosmo police|digital monster|illvelo|a men|aaru s awakening|absolute supercars|accel knights|accel world|afro samurai|anarchy rush|arcana heart|battle princess|beat hazard|chicken attack|cyber egg|cybernetic empire|edo no kiba|esparks|ben hur|dna dark native|fuun bakumatsuden|gaika no gouhou|bullet butlers|arms heart|bakumatsu ishinden|castle rustle|boku no hero academia|andro dunos|bukigami|carps and dragons|castle clout|battle x battle|black black|bobobo|boukyaku no senritsu|diadroids|battle robot retsuden|gan gan ganchan|gegege no kitarou|gals panic|goiken muyou|katekyō hitman|katekyo hitman|kekkaishi|l esprit du loup|2urvive|a certain magical virtual-on|aeon must die|aeterna noctis|american fugitive|anarcute|ancestors|asterix and obelix|atomfall|bad birds|castle invasion|color guardians|color slayer|corridor z|croixleur sigma|afterpulse|angelian trigger|angerforce|animus stand alone|apex legends/, "action"],
    [/horror|resident evil|silent hill|fatal frame|siren|fear\b|dead space|afraid|akazu no ma|daemon summoner|friday the 13th|frankenstein|ghostbusters|ghostbusters ii|gakkou no kaidan|gakkō no kaidan|kowai|dark tales|deserted island|ghost frenzy|apathy narugami/, "horror"],
    [/strategy|tactical|tactics|\bwar\b|command|conquer|civilization|fire emblem|advance wars|allied general|age of booty|aegis of earth|tower defense|defender\b|daisenryaku|senryaku|nobunaga|sangokushi|shinsengumi|azito|bandit kings|archon|aoki ookami|daikoukai jidai|bounty sword|brigandine|carnage heart|chou sentou kyuugi|chinmoku no kantai|defender of the crown|destiny of an emperor|genghis khan|ambition of the slimes|brave company|cocoro line defender|creature defense|dot defense|battle of sunrise|daisan teikoku|aubirdforce|battle formation|battle hunter|battle konchuuden|anno create|boot camp academy|daikokai jidai|daikōkai jidai|fantasy battle|formation final|battle of kingdom|battle space|earth light|dragon s earth|automaton lung|arrow of laputa|baku kyuu renpatsu|bakukyuu renpatsu|ballerburg|crisis city|battlestar galactica|forest defense|auto chess|12 labours of hercules|ages of mages|ar nosurge/, "strategy"],
    [/simulation|simulator|\ba ressha\b|a train|sims|tycoon|management|train|flight|farm|harvest moon|story of seasons|rescue helicopter|air ranger|pilot|micoach|adidas|fitness|pilates|top model|stock|kabushiki|horses|horse show|umaban|pet\b|pets\b|animal breeder|breeder|neko|dogz|catz|aquarium|aqualife|aquanaut|vet life|life\b|boku no natsuyasumi|basic studio|game koubou|dezaemon|cake mania|burger burger|burger island|candy factory|chocolatier|cooking mama|boku wa koukuu|airport hero|densha de go|doko demo issho|dogstation|dream salon|ea sports active|exerbeat|fit in six|gold s gym|horse 3d|coaster creator|conveni dream|brunch panic|bistro cupid|chocobo stallion|breeding stud|city bravo|city builder|curry house|diet channel|animal hospital|animal paradise|animal planet|animal world|babysitting mania|best friends my horse|build a bear|busy scissors|cover girl|custom drive|boku no kabuto|boku no kuwagata|famista|10 minute solution|america s next top model|apassionata|doki doki cooking|fast food panic|home improvement challenge|breed master|finny the fish|fruit machine mania|aqua kids|aqua vita|choco ken|burger bot|charm girls|cesar millan|benjamin.*zoo|a day at the zoo|animastar|animal mania|animal snap|doubutsujima|aka chan dobutsuen|boku no camp|dejig aqua|dejig tin toy|hula wii|hollywood workout|hotel for dogs|conveni|cookie shop|cookin idol|cinnamoroll|bookstores everywhere|brilliant hamsters|burger paradise|creatures|futari no fantavision|fantavision|chocobo land|cabbage patch kids|chou gals|hamster heroes|help wanted|diet nyuumon|cosmetic paradise|cosmopolitan|christiane stengers|gedachtnis coach|lernerfolg|animals for toddlers|animal up|contraptions|cliff diving|cazzarion.*builder|cazzarion.*cute town|campfire of oasis|aero dancing/, "simulation"],
    [/rhythm|music|dance|dancing|guitar|rock band|beatmania|taiko|karaoke|dj\b|concert|b boy|bakumatsu rock|beck the game|djbox|beat the intro|\bsing\b|singing|voxler|we sing|lets sing|let s sing|dream audition|cheer|boogie superstar|dancing with the stars|dancing on ice|evangelion.*impact|atrévete a sonar|atrévete a soñar|buji rock festival|la voz|auditorium hd|beat sketcher|alt frequencies/, "rhythm"],
    [/adventure|zelda|tomb raider|uncharted|detective|mystery|escape|investigations|lost phone|a normal lost phone|alice in|adventure time|anastasia|a bug s life|dalmatians|aladdin|asterix|animaniacs|animorphs|an american tail|barbie|bratz|cardcaptor sakura|card captor sakura|veggie|larryboy|doraemon|discworld|blazing dragons|cat the ripper|cross tantei|tantei|monogatari|conan|beetlejuice|cool world|arkista|castlequest|circus caper|color a dinosaur|bouken|daibouken|explore|quest\b|digital holmes|anata o yurusanai|428|akiba s trip|b l u e legend of water|bear in the big blue house|chibi maruko|crimson room|csi|deja vu|dejavu|e t the extra terrestrial|enchanted|extreme ghostbusters|fairy tail|gallery fake|ghostbusters the video game|addie no okurimono|an kh|anna extended|arthur and the revenge|back to bed|bakuretsu hunter|barbapapa|beastly|bermuda triangle|black jack|blood lines|boku wa|candace kane|cate west|captain sabertooth|darkwing duck|dr dolittle|donkey xote|flushed away|kung fu panda|alpha and omega|american girl|allez raconte|anpanman|arashi no yoruni|beetle junior|bibi|crayola|die drei fragezeichen|abarenbo princess|abarenbō princess|azur and asmar|azur asmar|bikkuri mouse|cartoon kingdom|clumsy shumsy|countryside bears|deep water|deka voice|hannah montana|disney move|piglet s big game|ratatouille|dog of bay|drastic killer|2999 nen no game kids|ad lib ouji|alive|ankh tutankhamen|ayakashi ninden|sailor moon|bokurato asobou|aibou ds|akko de pon|angel cat sugar|animates|anna and die liebe|annie m g schmidt|atama de do|chaos a la maison|de ontdekker|deepak chopra s leela|daisy fuentes|doala de wii|19 03 ueno|will the starship|a nanjarin|angolmois|b senjou no alice|backguiner|butagee|buttsubushi|cg mukashi banashi|cindy s|chibi chara|bubble guppies|cedric|boule et bill|benjamin blumchen|c est pas sorcier|bikkuri tobidasu|bookstores everywhere|aikatsu|akb48|12 sai|36 fragments|50 pinch barrage|akazukin cha cha|austin powers|azarashi sentai|beavis and butt head|cult jump|cultmaster|horrid henry|icarly|igor the game|father christmas|emit vol|free talk studio|eberouge|cowboy bebop|daiobake yashiki|empire of atlantis|flower sun and rain|fushigi no kuni no alice|fushigi no umi no nadia|furry tales|chokkan asonde|code geass|cocoro no cocoron|anna and die liebe|amici|aranuri|bienvenue chez|boku no hero academia|alter world|ash\b|astro\b|atlantis 6|azure snake|cyborg kuro|daa daa daa|das geheimnis|die maus|dr seuss|dragon s rock|araiguma rascal|asameshimae nyanko|aponashi girls|daina airan|dark hunter|delisoba deluxe|denpa|elf o karu|funky fantasy|fuusei sensei|army rescue|chicken riot|circus\b|heathcliff/, "adventure"],
    [/collection|anthology|compilation|classics|classic games|activision hits|arcade hits|capcom generation|atari greatest hits|atari flashback|ea replay|damashii|remix|remaster|remastered|hd collection|arcade archives|aca neo geo|aca neogeo|3d classics|3d after burner|3d altered beast|3d fantasy zone|3d ecco|3d galaxy force|3d gunstar|3d out run|3d shinobi|3d streets|3d super hang on|3d thunder blade|selection vol|dragon s lair trilogy|famicom mini/, "collection"],
    [/educational|learning|kanken|eigo|eitango|ez talk|training|dictionary|study|kanji|keisan|benesse|gakken|lightspan|adiboo|adibou|compter|lettres|nombres|corps humain|hello work|smarter than a 5th grader|discovery kids|brain quest|clever kids|blue s alphabet|donkey kong jr math|fisher price|happy neuron|mensa academy|challenge me math/, "educational"],
  ];

  const extraChecks = [
    [/digimon world|digimon park|pocket culumon|asdivine hearts|underbar summer|_summer|gakuen toshi vara noir|doki doki poyacchio/, "role-playing"],
    [/doki doki on air|pretty league|amakano|sora no muko|beyond the milky way|akb1|ai shogi/, "visual novel"],
    [/caesar s palace|gambler densetsu|tetsuya|bakenou/, "casino"],
    [/akari by nikoli|free cell|card game 9|game select 5|coropata|dioramos|4 elements hd|arkedo series.*swap|100 yen gomibako|arcanoid breakout|breakout/, "puzzle"],
    [/digital glider|arkedo series.*jump|arkedo series.*pixel|alien zombie mega death|air conflicts|wing|raiden|star soldier/, "shooter"],
    [/alien3|blood\+|blood plus|chou soku henkei gyrozetter|action henk|aaru s awakening|d n a dark native apostle|digital monster|battle rondo|bakuman|carps and dragons|chicken riot|castle of dragon|attack of the killer tomatoes/, "action"],
    [/player manager|atv thunder|backbreaker vengeance|diver s dream|fish dude|extra bases|afl live|minigolf|mini golf|super spike|world cup/, "sports"],
    [/tamagotchi|figure iina|docchi mecha|digital figure|dango sanshimai|demo koushin|animal yokochou|cooking series|cooking|petz|pets|dogs|cats/, "simulation"],
    [/ankh|anna and die liebe|cory in the house|cosmos chaos|crime lab|fairy kitty|downtown special|kunio|brutus and futee|chibi|doraemon|one piece|shrek|harry potter/, "adventure"],
    [/midway arcade treasures|arcade archive|arcade archives|arcade love|arcade fuzz|game center usa|collection|compilation/, "collection"],
    [/10 voor taal|eijukugo|eiken|kanken|training|brain|sangsingnyeok|study|lesson/, "educational"],
    [/cross treasures|brandish|granhistoria|ginga eiyu|ginga ojo|akatsuki no amaneka|aoi sora no neosphere|aoi umi no tristia|chuugen no hasha|densetsu no yuusha/, "role-playing"],
    [/dokodemo hamster|doko demo issyo|germany s next topmodel|topmodel|aabs animals|barnanza|let s play garden|let s play ballerina|front row|g1 king|k11/, "simulation"],
    [/games galaxy|gussun oyoyo|battle of tiles|bang!|crystal mines|ao don|hanabi|dotsubo|final set|fancy pocket|bit generations orbital|orbital/, "puzzle"],
    [/gecko blaster|gene troopers|blazerush|crescent pale mist|blaze rush|constant c|bloodbath|bladestorm|gant[z]?|get ride|amdriver|custom beat battle|draglade|da ge dar|dagedar/, "action"],
    [/curling|doumu no yabou|race of champions|gt24|f 1 grand prix|harukanaru augusta|major dream|gyroball|sportz|fussball|football/, "sports"],
    [/crime scene|crime lab|code de la route|dokuro chan|dr rin|flipper|lopaka|franklin|domo kun|crazy chicken tales|fix foxi|lupo|ed o mono|edomono/, "adventure"],
    [/atr vete a sonar|atrevete a sonar|so ar|sonar|custom beat|beat battle/, "rhythm"],
    [/dora slot|dor slot|slot|pachislo|pachinko/, "casino"],
    [/dokodemo aoku|gin no eclipse|date a live|doukyuusei|houkago in beppin|boku to bokura no natsu|blue sky blue|minarai tenshi|candy stripe/, "visual novel"],
    [/dragon knights|bakumatsu kourinden|heian fuuunden|angel senki|dungeon travelers|cave noire|gaia master duel|gachasute|dino device|holy umbrella/, "role-playing"],
    [/dosukoi|curling|field of nine|pro yaky|dodge danpei|indycar|doumu no yabou|race of champions|beach de reach/, "sports"],
    [/daredemo asobi|clubhouse|101 in 1|meg[a]?mix|variety game|rapyulus panic|guru ?guru onsen|bokomu no tatsujin/, "party"],
    [/tsumego|magische labyrinth|crystal mines|hansha de spark|gussun|othello|bang!|cambrian qts|dragon money/, "puzzle"],
    [/ghost vibration|gakk[oō] no kaidan|hankou shashin|shibarareta shoujo|deadly towers/, "horror"],
    [/getbackers|giant robo|getsumento heiki|dr slump|daniel x|dagedar|da ge dar|futari wa pretty cure|maho sensei negima|mib alien crisis|martian panic|cyborg justice|cross fire|curse\b|exa ?skeleton|far cry instincts|heroes of the pacific|gene troopers/, "action"],
    [/d & co|ta maison|genshi no kotoba|topmodel|fit & fun|let s paint|mein neues leben|tierarztpraxis|miburi|teburi|doko demo issyo|doki oki/, "simulation"],
    [/daigasso|band brothers|fantastep/, "rhythm"],
    [/chase h q|championship pro am|dragstars/, "racing"],
    [/dark awake/, "fighting"],
    [/growlanser|ecsaform|eith[eé]a|eldergate|destiny links|chronus arc|crystareino|frontier gate|god eater|gods eater|grandia parallel|gran duel|kabuki rocks|janyuuki gokuu|dragon fantasy|dragon s dogma|deus ex/, "role-playing"],
    [/green green|guardian angel|dokodemo aoku|efficus|elan|emmyrea|gin no eclipse|gekka ryouran|genroh|game demo papa|blue sky blue|happ[y]? lesson/, "visual novel"],
    [/gt r|glorace|kat s run|initial d|touring|race of champions|rally|grand prix/, "racing"],
    [/hachi one|denksport|tsumego|christmas wonderland|city mysteries|cryght|every extend extra|exit 2|fading shadows|gear works|gem gem|jantei|jantoushi|pukunpa|doodle devil|doodle kingdom|digger hd/, "puzzle"],
    [/dekityo|dekitayo|denjirou|der dativ|digging for dinosaurs|eiko no kids|emit value|get mushi club|code de la route/, "educational"],
    [/easter bunny|der fluch|der schatz|diddl|wilden huhner|club penguin|flipper|lopaka|franklin|heidi|jungle park|kero kero|keroppi|kingyo chuuihou/, "adventure"],
    [/defendin depenguin|defending depenguin|defense technica|cutthroats|ishin no arashi/, "strategy"],
    [/green green|topmodel|miss france|cube creator|fukufuku no shima|shachou game|habitrail|hamster|g1 king|keiba|baken renkinjutsu|mein neues leben|tierarztpraxis/, "simulation"],
    [/guerrilla strike|di gata|big hero 6|fate tiger colosseum|fight ippatsu|gachitora|ganso yancha|gex 3|hammerin harry|goemon|pretty cure|hagane no renkinjutsushi|harobots|patlabor|metal jack|kinnikuman|kishin douji|deception iv|demolition inc|derrick the deathfin|do not fall|doc clock/, "action"],
    [/guts da|dosukoi|j league|jun classic|yakyu|baseball|football|fussball|curling|golf|keiba|horse|grander musashi|gakuen battle fishers/, "sports"],
    [/gold x|ebisu yoshikazu|ippatsu gyakuten|gambling king/, "casino"],
    [/harukanaru toki|hiiro no kakera|hisui no shizuku|efficus|furimukeba|hakuouki|hanasaku manimani|kimi o tsutaete|maria kimitachi|meltylancer|my best friends|my dream|kiss x kiss/, "visual novel"],
    [/hermina to culus|falcata|feda|first queen|flamberge|dramatic dungeon|dragon zakura|demon king box|dragon fang|guisard revolution|itsuka.*spectral force|magna braban|mahoujin guru guru|maka maka|maten densetsu|milandra|monstania|monster maker|ogon no kizuna|bravely default/, "role-playing"],
    [/family card game|family diamond|denksport|dropcast|i q mania|itsumono table|game boy gallery|gear works|gem gem|mahou poi poi|monster slider|doodle|boxboy|boxgirl|bubble\b|crollors|cosmiball|dot runner|do not fall|blind shot/, "puzzle"],
    [/famires|dreamer series|shop owner|teacher|zoo keeper|babysitter|pop star|deviens miss france|dog school|dolly kanon|hiyoko kantei|fukufuku no shima|hello idol debut|nutrition matters|oyako de asobo|pizza delivery boy|bring it to mom|bring them home|petanque|miffy/, "simulation"],
    [/homerun|touch down|touchdown|ford truck mania|international athletics|imagine champion rider|hunter s trophy|j league|jun classic|nice de shot|pbr out of the chute|petanque|offroad extreme|kawa no nushi tsuri/, "sports"],
    [/homura|flying squadron|heavy fire|hitogata happa|pirate blast|mechanized attack/, "shooter"],
    [/fuuun gokuu|fushigi deka|dragonology|madagascar|puss in boots|di gata|digimon universe|magical world|dodge club|dodgebox|dark island|dasshutsu|die drei|dooo?rs|douku?tsujima|kaiketsu zorori|kong|lemony snicket|lupin|lunacy|minakata|minton keibu|peppa pig|pekin express|once upon a time|buddy mission bond|call of cthulhu/, "adventure"],
    [/extreme power|finger flashing|fox junction|frenzy|heavy metal thunder|heisei bakutoden|hissatsu|hokkahoka sentou|honoo no takuhaibin|fate tiger colosseum|ikki tousen|invizimals|hunter x hunter|ikari no yousai|gyouten ningen|kaeru b back|kami no kijutsu|telefang|angelic layer|kinniku banzuke|mighty morphin power rangers|makeruna|melfand stories|new yatterman|ninja captains|ninjabread man|mib alien crisis|bloody bunny|blossom tales|bounty battle|brawl|butto bird/, "action"],
    [/defend your crypt|defense technica|frozen synapse|greed corp|guardians of middle earth|mouri motonari/, "strategy"],
    [/gaball screen|dopamix|hatsune miku|project diva|nodame cantabile|cadence of hyrule/, "rhythm"],
    [/fever \d|hai shin|jantei|mahou no jansi|jan jan|kikuni masahiko/, "casino"],
    [/head hunter|headhunter|heavy rain|hitman|deception iv|grand theft auto|hard corps|motteke|pacific liberator|body of evidence|bokura no school battle/, "action"],
    [/\.hack|7th dragon|egg monster hero|knights in the nightmare|lunar knights|hero bank|million arthur|mercenaries saga|unchained blades|yo kai watch|yokai watch|9th dawn|dragon s dogma|3d dot game heroes|advanced dungeons.*hillsfar|abarenbo princess/, "role-playing"],
    [/3x3 eyes|3 3 eyes|6 inch my darling|9 nine|9 r i p|0 ji no kane|12 ji no kane|24 ji no kane|11eyes|12riven|2045 tsuki yori|love hina|shugo chara|zero no tsukaima|rozen maiden|higurashi|death note kira|l the prologue|lucky star moe drill|doki doki majo|poupee girl|poupée girl/, "visual novel"],
    [/007 racing|2xtreme|3xtreme|4 4 2 soccer|5 star racing|3d baseball|3 on 3 nhl|3d pocket pool|10 pin bowling|actua golf|actua soccer|abc monday night football|academy of champions|agassi tennis|urban trial freestyle|junclassic|rope club|namco classic/, "sports"],
    [/007 legends|007 quantum of solace|50 cent blood on the sand|50 cent bulletproof|ghost in the shell|wild 9|incredible hulk|simpsons hit run|simpsons road rage|xiaolin showdown|sengoku basara|rurouni kenshin|advanced v g|3 ninjas kick back|aaahh real monsters|accele brid|action man|advance guardian heroes/, "action"],
    [/3d shooting tsukuru|a s p air strike patrol|acrobat mission|abadox|1942|1943|ace combat advance|nano assault|global defence force|silent scope|point blank|ghoul panic|a sound of thunder|air strike patrol/, "shooter"],
    [/7 wonders|4 elements|4 in 1 fun|11 card games|3d block kuzushi|3d lemmings|ai igo|ai shogi|0x0 minimalist|3d air hockey|mojo!|meteos|touchmaster|time management game collection|60 in 1 game collection/, "puzzle"],
    [/1 jikan de wakaru kabushiki|kanken|kanji|my chinese coach|my french coach|my japanese coach|my spanish coach|10 voor taal|4 kyouka|5 nen kanji|250 mannin no kanken/, "educational"],
    [/3d classics|3d altered beast|3d ecco|3d fantasy zone|sega 3d fukkoku|namco museum|midway arcade|ac dc live rock band track pack/, "collection"],
    [/princess maker|simanimals|virtual villagers|steel diver|punch club|a train|10 minute solution|6 games in 1 time management/, "simulation"],
    [/manhunt|a nightmare on elm street|parasite eve|friday the 13th|fear\b|silent hill|resident evil/, "horror"],
    [/lma manager|total club manager|advanced world war|death note.*game/, "strategy"],
    [/abba you can dance|jam sessions|rock band track pack/, "rhythm"],
    [/3d ultra minigolf|monster jam|super bikes|suzuki tt|suzuki super bikes|starsky hutch/, "racing"],
    [/a boy and his blob|adventure island|aero the acro bat|mutant mudds|kirby s adventure|kid icarus|excitebike/, "platforming"],
    [/shaun the sheep|syberia|johnny test|phineas and ferb|transformers|monster high|land before time|normal lost phone/, "adventure"],
    [/global folktale|hanjuku eiyuu|houshin engi|izumo zero|dungeon creator|dungeon shoutenkai|end sector|exalegiuse|heracles no eiko|heracles no eik|heroes of might and magic|kandume monsters|kaseki sousei|gauntlet\b|gauntlet ii|magician\b|metal gear/, "role-playing"],
    [/girls bravo|gokujou seitokai|hakarena heart|hakushaku to yousei|happiness de lucks|hoshi furu|hoshi no furu toki|houkago wa gin no shirabe|iris\b|itsuka todoku|dokomademo aoku|elfin paradise|enen angel|eternal melody|evergreen avenue|hana yori dango|jankyuusei/, "visual novel"],
    [/hannspree|sbk\b|happy happy boarders|onsen takkyuu|cue club|snooker|eikan wa kimi|st andrews|equestrian showcase|extreme 500|athletic world|caveman games|cyber stadium|base wars|dusty diamond|goal!|heavy shreddin|kings of the beach|klashball|legends of the diamond|mach rider|magic johnson|michael andretti/, "sports"],
    [/go go copter|hresvelgr|iridium runners|jacked\b|knight rider/, "racing"],
    [/iron aces|iron sea|eos edge of skyhigh|extra bright|battletank|hogan s alley|isolated warrior|lethal weapon|mad max|magmax|metal mech|metal storm/, "shooter"],
    [/gintama|gobuato|hansel gretel|hugo cannon cruise|inuyasha|dragon tales|egg\b|engacho|hugo 2|kaijin zona|kaitei densetsu|karamuchou|back to the future|cliffhanger|dragon s lair|duck hunt|mappy land|maniac mansion|mickey mousecapade/, "adventure"],
    [/hametsu no mars|hard knock high|hungry ghosts|nightmare on elm street/, "horror"],
    [/itadaki street|dx hyakunin isshu|dx nippon tokkyu|dx okuman|4 in 1 funpak|janken man|jantaku boy|marble madness|mendel palace/, "puzzle"],
    [/jackpot madness|fever\b|jan sangoku|3 pun yoso umaban/, "casino"],
    [/iron chef|hello kitty no beads|hello kitty no happy house|itsudemo nyan|railfan|high speed rail|jet de go/, "simulation"],
    [/eko no kids|pocket professor|kwiknotes/, "educational"],
    [/back to the future|^athena\b|kid niki|kung fu\b|the lone ranger/, "action"],
    [/hardball|harlem beat|knockout kings|koushien|lake masters|le tour de france|lets ride|silver buckle|happy jogging|happy diet|st andrews|hikari no go|kyojin no hoshi|in your face|hard blow|motion sports|motionsports|my body coach|snooker nation|international snooker|ea sports fc|fifa world cup/, "sports"],
    [/hashiriya|l eredita|l'eredita|london cab|motorbike|motorcycle club|cruis n blast|cruis'n blast|flashback 2|futago usagi.*turismo/, "racing"],
    [/hatsukoi|hakarena|kimagure strawberry|kino no tabi|kokoro no tobira|kono haretasora|last escort|little anchor|kyuuketsu hime|l no kisetsu|l ve once|koihime embu|muv luv|muv-luv|kono oozora|death match love comedy|diabolik lovers|dies irae|dig rock|eve rebirth|food girls/, "visual novel"],
    [/kikou souhei|kowloon youma|langrisser|legendz|kyo kara maoh|king arthur|king oddball|labyrinth legends|mercia fractured realms|mugen souls|divinity original sin|edge of eternity|genkai tokki/, "role-playing"],
    [/kikou heidan|king of colosseum|kishin houkou|korokke|hyakujuu sentai|ichigeki|hit back|harukaze sentai|himitsu sentai|houma hunter|men in black alien crisis|naughty bear|dandara|dauntless|demon throttle|dragon marked for death|dying light|earth defense force|el shaddai|epic mickey|getsu fuma den|fortnite battle royale/, "action"],
    [/kuusen|kyoushuu kidou|lethal skies|killzone hd|modern combat domination|dragon blaze|esp ra de|espgaluda|everspace/, "shooter"],
    [/happy hotel|heroine dream|idol promotion|kuma uta|kyo no wanko|machi ing maker|mainichi issho|everyday today s menu/, "simulation"],
    [/hard boiled|hikari no shima|hyor[y]?uu ki|iblard|houshinengi|kirikou|legend of camelot|legend of herkules|lassie|level 22|landit bandit|murdered soul suspect|disaster report|disco elysium|cyanide happiness|danger mouse|dr mikio|eiga sumikko|fe\b|georifters|gesshizu/, "adventure"],
    [/heisa byouin|inagawa junji|kuon no kizuna|kyoufu shinbun|darq|master reboot/, "horror"],
    [/heiwa parlor|history of kita denshi|hi hou ou|jackpot madness|monopoly deal|monopoly plus|eternal\b/, "casino"],
    [/dx hyakunin|hei sek ki|hitori de dekirumon|itdaki street|itadaki street|mousecraft|move mind benders|ms germinator|dont die mr robot|don't die mr robot/, "puzzle"],
    [/hello kitty no oshaberi|dr mikio hiraiwa|yomu tore|national geographic challenge/, "educational"],
    [/cytus alpha|magical beat|mix superstar|fuser/, "rhythm"],
    [/littlebigplanet|eagle island|2 fast 4 gnomz/, "platforming"],
    [/kindaichi|konohana|klaymen|neverhood|kochira katsushikaku|kokohore pukka|koro koro post|kuma no pooh|kunoichi torimonochou|kuro no juusan|kuroi hitomi|kyoro chan|matsumoto reiji|galaxy express|holly hobbie|hollywood files|house m d|hugo den|hottarake no shima|i spy|interactive storybook/, "adventure"],
    [/king of parlor|parlor|konyamo dorubako|las vegas dream|hi hou ou|kishu michi/, "casino"],
    [/king of producer|king of stallion|kurashi no manner|love love truck|happy bakery|gourmet chef|grand galop|groovy chick|happy my sweets|hospital giant|hotel deluxe|i love beauty|i love puppies|imagine /, "simulation"],
    [/kisha de go|love love truck|mad panic coaster|idaten jump/, "racing"],
    [/kouryuu sangoku|kouryuuki|lord monarch|lord of monsters|lagnacure|light fantasy|lunatic dawn|masumon kids|maze heroes|history great empires|heracles battle/, "role-playing"],
    [/kotetsu reiki|kouashi kikou|kumitate battle|lucifer ring|luciferd|kyuin|heavy armor brigade|hi hi puffy|iron feather|iron master/, "action"],
    [/kyuukuoku no soukoban|kuru kuru cube|kuru kuru panic|kurukuru|kururin|lattice|lemmings|lup salad|magical dice|magical drop|hello kitty no pacpac|heroes of hellas|hidden photo|hurry up hedgehog/, "puzzle"],
    [/kimi ni steady|koj[i]?n kyouju|little lovers|love therapy|mahou shoujo fancy|pretty sammy|mahou shoujo pretty|mahoutsukai ni naru|maria 2|gokujou.*mecha mote|hakuoki|hakuouki/, "visual novel"],
    [/hardball|liberogrande|martial beat|mary king|hanshin tigers|hello kitty no panda sport|hiromichi oniisan|indoor sports club/, "sports"],
    [/haunted junction|heisa byouin|inagawa|kuro no juusan|kuon no kizuna/, "horror"],
    [/gogo s crazy bones|gogo crazy bones|guru guru|gyakuten kenji|gyouretsu|happy happy clover|hello kitty big city|hello pocoyo|hex[e]? lilli|mary kate and ashley/, "adventure"],
    [/gotouchi kentei|hanguk|hangeom|hello kitty.*abc/, "educational"],
    [/grand trucker|grease official|hudson x greeeen|imagine rock star/, "rhythm"],
    [/intellivision lives/, "collection"],
    [/premier manager|pro bull riders|riding spirits|riding star|rtl ski jumping|rugby|saturday night speedway|ncaa gamebreaker|ncaa march madness|nippon sumo|okappari|oyaji no jikan|pebble beach|ring rage|roadster|rocky mountain trophy hunter|roland garros|sesame street sports|slam dunk|sports illustrated|super kick off|satoru nakajima|world champ|world games|wwf wrestlemania|wwf king of the ring|winning post|schlag den star|trials rising/, "sports"],
    [/pro biker|red baron|radio helicopter|rc sports|rc toy machines|riding spirits|road rage|runabout|option tuning|over drivin|street supremacy|stateshift|streetkix|spintires|mudrunner|taxi 2|taxi 3/, "racing"],
    [/princess nightmare|private nurse|raimuiro|rec dokidoki|roommate asami|rosario to vampire|routes pe|ryu koku|saint beast|scared rider|scarlett|noel|nukumori|ojyousama express|osaka naniwa|ouji sama|paipai|palm town|pastel muses|seinaru kana|seishun hajimemashita|seitokai no ichizon|sekai de ichiban|shiei no sona nyl|shirogane no cal|shukufuku no campanella|solomon s ring|sora no otoshimono|sora o aogite|sorairo|starry sky|steins gate|stellar theater|storm lover|suto mani|suzumiya haruhi|sweet fuse|shiritsu berubara|star melody|summer time rendering|symphonic rain|tokei jikake|tokimeki memorial|wagamama high spec|world end syndrome/, "visual novel"],
    [/pryzm|real robot regiment|realm of the dead|rebirth moon|rogue hearts dungeon|saint seiya|saiyuki reload|oasis road|oni zero|out live|pal shinken|pangaea|seme com dungeon|rokumon tengai|san goku shi|saint paradise|seipoi densetsu|shaman king|space net|tenchi o kurau|ultima|willow|wizards warriors|xexyz|zoda s revenge|stranger of sword city|elder scrolls blades|legend of heroes|lost child|witch and hero|wizard s symphony|lost heroes|machine knight|\bmagi\b|medarot|medabots|nankou furaku sangokuden/, "role-playing"],
    [/police chase down|project arms|project minerva|psychic force|pyu to fuku|raging blades|remote control dandy|sakura taisen v episode 0|sakurazaka shouboutai|samurai 7|samurai spirits|sas anti terror|sakigake|nekketsu oyako|ninja jajamaru|ninku|ninpu sentai|omega assault|pd ultraman|ranma|roswell conspiracies|sakura taisen gb|samurai kid|santa claus junior|shounen ashibe|sneaky snakes|spy vs spy|stargate|stuart little|taiyou no tenshi|taiyou no yuusha|tekkyu fight|trojan|wayne s world|werewolf|whomp em|widget|wolverine|wrath of the black manta|zen intergalactic ninja|sanrio characters miracle match|shovel knight|shovel knight pocket dungeon|sisters royale|skellboy|skyforge|smite|solomon program|south park fractured|spellbreak|steven universe|the angry video game nerd|binding of isaac|tiny troopers|troll and i|turok|turtlepop|velocity 2x|victor vran|vigor|ninja battle heroes|ninja smasher|nanatsu no taizai|mushi bugyou|nashijiru busha/, "action"],
    [/psyvariar|radirgy|night raid|kyuin|space invaders|sengoku cannon|strike witches|super hind|ultimate air combat|twin cobra|twin eagle|xenophobe|xevious|zanac|sol divide|dragon blaze|esp ra de|espgaluda|noah s cradle/, "shooter"],
    [/popcap hits|roller coaster funfare|rollercoaster world|nazo oh|nijiiro twinkle|nikakudori|noon\b|ochan no oekaki|okada toshi|otenami haiken|otenki kororin|pandora project|panekit|paqa|sanrio carnival|scotland yard|serpent|shanghai|shikakui atama|shikinjou|shisenshou|splitz|star sweep|stop that roach|super scrabble|taikyoku renju|taisen tsume shougi|wario s woods|wheel of fortune|win lose or draw|wrecking crew|yoshi s cookie|snipperclips|the bridge|turing test|masyu by nikoli|maze breaker|meiga to tanosimu|minna de nanpure|nikaku de susshi|mechanic master|master jin jin|logic cubes|logic machines|mae?hjongg|mah jongg|magic encyclopedia|midnight play pack|min[d]?storm/, "puzzle"],
    [/primopuel|rimo cocoron|omise de tensyu|nyan to wonderful|pao leeming|super me mail|sylvanian|mame goma|mamegoma|mameshiba|me my furry patients|my little baby|my riding stables|my style studio|my vet practice|my zoo vet practice|motto kigaru|momotaro dentetsu|super monkey ball|supermarket shriek|space crew|suchart|sumikko gurashi|this is the police|mansion percussion|minna no ennichi/, "simulation"],
    [/saishuu densha|nemuru mayu|night head|nightruth|paranoiascape|uninvited|the child s sight|the park|strange antiques|stranger things|walking dead final season|murder on the titanic|midnight mysteries/, "horror"],
    [/rim runners|sagashi ni ikouyo|scandal|not treasure hunter|novels game center|oh no|oshaberi oekaki|robin hood|rod land|snoopy|super doll licca|tasmania story|tenjin kaisen|where s waldo|who framed roger rabbit|wurm|yo noid|lalaloopsy|lanfeust|last king of africa|little book of big secrets|looney tunes|los lunnis|lost in blue|magical zhu zhu|mar heaven|marie antoinette|maya\b|mega bloks|mega mindy|metropolis crimes|murder on the titanic|lucky luke|luv me buddies|makai ouji|megami meguri|mia s picnic|mitsukete|mom hid my game|mononoke forest|moshi monsters|mysterious stars|nazo waku yakata|neratte tobashite|the addams family|the big con|the fall|kids we were|silver case|watchmaker|uta to mori|well dweller/, "adventure"],
    [/sengoku efuda|sengoku hime|sengoku tenka|shin master of monsters|shin sangoku musou|taiheiyou no arashi|the banner saga|moe moe daisensou|monster combine td/, "strategy"],
    [/pump it up|rock n megastage|paca paca passion|rock n monster|my first songs|miracle tunes/, "rhythm"],
    [/lapin malin|learn geography|learn science|lettriq|mabeop cheonjamun|marie gully|math play|maths buddy|mehr kreuzwortraetsel|mi experto|mind your language|mimi de unou|nanami to issho|maru gou.*english|toeic|rei?bun de oboeru/, "educational"],
    [/dawn of discovery|global domination|glory of generals|hototogisu|military madness|north and south|rampart|romance of the three kingdoms|shingen the ruler|gakuen senki muryou|gakkou o tsukurou|kurohige no kurutto|okuman chouja/, "strategy"],
    [/dawn of heroes|dun dam|dungeon of windaria|dungeon raiders|element hunters|elemental monster|fairy fencer|fragrant story|fairune|fairune 2|baldur s gate|icewind dale|blue reflection|caravan stories|gloria union|digimon story|citizens of space|dragon lapis|dragon sinker|drancia saga|excave|grinsia|juuni kokuki|mahoroba stories|mahou tsukai kurohime|monster rancher|monster gate|oriental blue|megami tensei|last bible|little master|lodoss|magical houshin|granbo|monster traveler|monster race/, "role-playing"],
    [/anna and die liebe|disney tangled|christmas carol|disney pixar s up|dream day wedding|ds dengeki bunko|free writer touyako|yamamura misa suspense|edogawa ranpo|emily the strange|emma in the mountains|flunkene|garaku tale|gaia master|gatekeepers|gegege no kitaro|gekka ni no kishi|genso suikogaiden|go go i land|googootrops|hyouryuu ki|jigoku shoujo|johnny bravo|kaerazu no mori|kaiketsu osabakiina|kamaitachi no yoru|kamisama kazoku|kao no nai tsuki|kappa no kai kata|lost aya sophia|love com|lucky star|memorial song|dai gyakuten saiban|dreeps|fantasy pirates|gabrielle s ghostly groove|backbone|baldo|bear with me|blind postman|cendrillon|code realize|conway|dead in vinland|hakokoro|i am dead|in other waters|j b harold|judge dee|kathy rain|keiji j b harold|milon s secret castle|mission impossible|nightshade|pirates!|prince of persia|princess tomato|shadowgate|gyakuten saiban|lizzie mcguire|minami no umi|phil of the future|pink panther/, "adventure"],
    [/cars 2|disney pixar s cars|g p challenge|gekisou tomarunner|tomarunner|kattobi road|j s racin|mageru tsukeru|micro machines|monster truck|horizon chase turbo|ferrari the race experience|fuel overdose|jeremy mcgrath|nissan gt academy|motor city patrol|paperboy|roadblasters|r c pro am|r c pro am ii/, "racing"],
    [/dora ?base|dora base|divas on ice|g1 stable|k 1 world|k o king|kakutou bijin|international track and field|k 1 oujya|equitation|ener g gym|hot shots shorties|ihf handball|racquet sports|fifa|ring king|roundball|racket attack|power punch|mike tyson s punch out|rollergames|side pocket|lets ride|touchdown|punch out/, "sports"],
    [/e m6 defi cerebral|edo bunka rekishi|englisch|franzosisch|general knowledge|geomaster|kibihara|koukou nyuushideru|math patrol|mickey s safari in letterland|sesame street|fisher price|word search|eye ?resh|honki de manabu|jui dr touma|jukugon/, "educational"],
    [/crazy pig|fabulous finds|fizz|gocal hexcite|glocal hexcite|geom cube|geometry duel|grille logic|hot shot|jello|jewels ocean|maniac mole|marble chaos|6x1|6 1|arc style happy ocean|fifteen|fishdom|four bombs|colloc|don t die mr robot|frozen free fall|germinator|hyperballoid|lumines|numblast|q u b e|qbert|q bert|klax|koro dice|lazlos leap|logical|money idol exchanger|mr driller|millipede|ms pac man|orb 3d|palamedes|pictionary|pin bot|pipe dream|puzznic|remote control|rollerball|rock n ball|short order/, "puzzle"],
    [/gakuen sentai|gangway monsters|gear senshi|getter robo|germs|go jin senki|goryujin|guardian recall|hakai ou|hexamoon guardians|infestation|invasion|jaja uma quartet|kaijuu senki|kaminari ishiyumi|kenka banchou|kenran butou sai|kamiwaza|makai tenshou|marvel super hero squad|mawaza|monster attack|brutus and futee|carps and dragons|chou soku henkei|chou tousouchuu|crazy kangaroo|d u n k l e r|dakkan shirei|dangerous jiisan|dragon s wrath|drone fight|drop zone under fire|duck dynasty|dungeon runner|flying axe|future card buddyfight|gaist crusher|gotta protectors|assassin s creed odyssey|bakutsuri hunters|beekyr reloaded|big crown showdown|bioshock infinite|blacksea odyssey|blastful|cel damage|chuka taisen|clusterpuck99|cookie cutter|ghoul patrol|giana sisters|gonner|guacamelee|happy game|john wick hex|justice league|jydge|killer queen black|earth saver plus|goku makai mura|great battle fullblast|heroes vs|jigoku 1000|juusei to diamond|kenka bancho|kinoko or die|mighty bomb jack|narc|ninja crusaders|ninja gaiden|ninja kid|operation wolf|platoon|popeye|predator|rambo|rampage|renegade|river city ransom|robocop|robowarrior|rocket ranger|rockin kats|rush n attack|rygar|s c a t|section z|shatterhand|silk worm|silver surfer|ghost trap|garfield and his nine lives|genseishin justirisers|jaja kun|masters of the universe|men in black/, "action"],
    [/gaia ?seed|glint glitters|gokujou parodius|invasion|dream trigger|galaxy blaster|gley lancer|illmatic envelope|iro hero|kite fight|normal ?tanks|novus prime|r type dimensions|raystorm|raid on bungeling bay/, "shooter"],
    [/game soft o tsukurou|inu no kaikata|jellyfish the healing friend|ka 2|koufuku sousakan|metropolismania|fabulous finds|famous|fashion week|fix it home improvement|emma student nurse|fabstyle|fish eyes|dare to fly|dress\b|eyecreate|mesmerize|my summer vacation|dreeps alarm playing game|ace angler|billion road|ciel nosurge|cocomelon|growtopia|haven park|issho ni asobo|fruit.*doubutsu|koinu chan|kouchuu ouja mushiking|licca chan|little patissier|march of the penguins|nakayoshi youchien|puppy luv/, "simulation"],
    [/goo goo soundy|keyboardmania|keyboardmania ii|k on|kickbeat|joysound|beat rush|beats runner|cotton rock n roll|hypnosis mic|i chu|hanasaka tenshi|mermaid melody|mini moni/, "rhythm"],
    [/datenshi|date ni game|drama queens|fuyu no sonata|gakuen hetalia|game de seishun|hana to ryuu|happy salvage|hello kitty.*album|hello kitty.*white present|high school of blitz|himiko den|hoshi no mahoroba|jang jang koi|joshikousei game|kanuchi|kazeiro surf|loveroot zero|mabino style|mahoromatic|mahou sensei negima|mai hime|mamimune|meine liebe|mermaid prism|meshimase roman|mizu no senritsu|durarara|eien no aselia|enkaku sosa|ga geijutsuka|hanayaka nari|hitsuji kunnara|hoshiiro planet|houkago colorful|itsuka tenma|iza shutshjin|jewelic nightmare|kami naru kimi|kana imouto|kannou mukashi|kazoku keikaku|kimi ga aruji|kimikare|kisaragi gold|kisetsu o dakishimete|koi to senkyo|kokoro connect|kono aozora|ore no imouto|maji de watashi|moujuutsukai/, "visual novel"],
    [/million god|hot gimmick|janline|nakayoshi mahjan/, "casino"],
    [/hard west|dawn of discovery|neo atlas|new roommania|my home o tsukurou|master of monsters|quovadis|risk urban assault|bang!/, "strategy"],
    [/dragon tamer|item getter|fossil league|fairyland melody|khamrai|kimero hero gakuen|magical medical|marby baby story|might and magic|neverland|night wizard|ken to mahou|heroes phantasia|nanatama|kurohyo|jyuzaengi|maou\b|azurebreak heroes|kingdom hearts|monkarufanta|maerchen forest|marchen forest|megaton musashi|mistover|gensou maden saiyuki|legend of dynamic|samurai evolution/, "role-playing"],
    [/anna die liebe|wall e|flunkerne|freddi fish|fukoumori|gachapin nikki|galileo|gina lisa|girls only|go diego go|houkago shounen|inukaisha|j4g|jacqueline wilson|jake power|james pond|jig a pix|galeoz|gochachiru|gogo i land|guruguru town|hello kitty no uchi|himitsu kessha|jigoku sensei|kaibutsu para dice|kakugo no susume|kaze no oka|kikansha thomas|kurumi miracle|lego no sekai|mystic nights|myth makers|nana\b|ninkyouden|brutus futee|dogimegi|dora chie|guide the ghost|harold reborn|harold s walk|hayate no usagi|kaminazo|laid back camp|minecraft story mode|mr saitou|ano subarashii|red johnson|ncis|okami hd|oddworld|page chronica|revenant saga|heartbeat scramble|high school terra story|kaito saint tail|kunoichi torimonochou|kuusou kagaku|moon cradle|rampo|sakura taisen|kapt n blaubar|kuma no puutarou|les visiteurs|minnie friends|mizuki shigeru|noddy|ojarumaru|postman pat|rugrats/, "adventure"],
    [/dragon booster|game de demashita|fuuun dairoujou|hoppie|mambo|kagero deception|katon kun|kenki ippatsu|monster eggs|moto x maniac|motor mayhem|mr bean|fatal fracture|flap flap|gal galaxy pain|game center cx|geki yaba runner|gekitou senshi|gu nyan|heybot|i am the hero|implosion|knockout city|lovecraft s untold stories|modern combat 5|miss kobayashi|mushihimesama|mighty hits|mizubaku|omakase savers|panic chan|purikura|rabbit\b|savaki|ice age|m m s blast|m m s minis|pinobee|rocket power|santa claus/, "action"],
    [/emergency 2012|emergency kids|emergency desaster|emergency rescue squad|ds motte tabi|pico series|gachapin challenge|hell s kitchen|jane s hotel|kenki.*crane|kaze no notam|lulu ?rara|monkey turn|monster rancher|hello kitty happy happy family|gourmet dream|gudetama|hello kitty picnic|hello kitty s magic apron|henri\b|i m?s channel|katsuragi misato|hello kitty kruisers|learn with nanami|l o l surprise|love\b|mirror\b|monica and the rabbit guard|ga geijutsuka|issho ni gohan|jitsuroku oniyome|kazook|me de unou|meta juice|biz taiken|game watch gallery|microsoft the best of entertainment|metamode|ochaken no heya|osaberi inko|oshaberi inko/, "simulation"],
    [/een tegen 100|game hits|games around the world|iseki hacchou|games explosion|great hits|memorial series|konami collector s series|journey collector s edition|arcade archies|kyukyoku tiger heli|sega ages|taito memories/, "collection"],
    [/geki kara numpla|jewel match|jewel time|jewels of|final round|kiwame daidougi|mawatte mucho|nankuro|ar games|crazy construction|cup critters|hazumi|heyawake|cube\b|korokoro kollon|kurulin fusion|kusaimon|luxor|qlione|qlione 2|ricochet hd|robot rescue revolution|dyad|dungeon twister|frogger|mogu mogu|mogura de pon|minna no shougi|kid s cards|little buster q|mugenborg|mutsu water looper/, "puzzle"],
    [/jounetsu nekketsu athletes|jikkyou powerful major league|mezase super bowler|mezase super hustler|nippon oozumou|christmas night archery|city skaters|haikyu|halloween night archery|kuroko no basuke|real steel|olliolli|mxgp 3|hattrick hero|power punch|mini putt|matchbox caterpillar|road trip shifting gears/, "sports"],
    [/jet ace|kattobi tune|mountain bike adrenaline|monster trux|lego 2k drive|hello kitty kruisers|sega ages power drift/, "racing"],
    [/gachapin challenge|goo goo soundy|grease the official|groove heaven|hello kitty friends rock|k on|beats? runner|bit trip.*runner2/, "rhythm"],
    [/ds pico series|houkago shounen|itouke no urawaza|koten tsugoshuu|natsuzora no monologue|natsu shoujo|natsu yume|my merry|myself yourself|moujutsukai|missing blue|mikomai|murasaki no honoo|men at work|monochrome|natural 2|never7|nettai teikiatsu|durarara|lucian bee|maid paradise|marriage royale|mashiro iro|miyako|mirai nikki|mystereet|a kei otaku|kings of paradise|konosuba|loverpretend|lover kiss|magical girl witch trials|magical high school girl|mahotsukai no yoru|ruri iro|roommate|ojousama|nonomura|pia carrot|photo genic|heartbeat scramble|hop step idol|karyuu jyou|kagayaku kisetsu|kimagure my baby|melty lancer|mail de cute|natural 2 duo/, "visual novel"],
    [/jitsuwa kaidan|jewelic nightmare|misshitsu no sacrifice|lust for darkness|kuro no danshou/, "horror"],
    [/learn with nanami|me de unou|kibihara|koukou|mickey safari|freddi fish.*abc/, "educational"],
    [/sentou kokka|power dolls|nibiiro no koubou|naniwa kinyuu|nectaris|power mission|zan ii|zan iii|tenka seiha|terra phantastica|the bluecoats|space hulk|savvy?age moon|savage moon|tower dream|turfwind|hard west|the oregon trail/, "strategy"],
    [/master of the monster lair|londonian gothics|mystic ark|neorude|neorude 2|po ?po ?lo ?crois|poporogue|pocket dungeon|shinki gensou|seven molmorth|sekai wa atashi|summon night|tears to tiara|tenchi no mon|tengai makyou|terrover|sword world|trinea|wizap|wondrous magic|yume maboroshi|yuukyuu gensoukyoku|sa ?ga scarlet grace|sacrifire|tensei game|yo kai academy|zoids legacy|zoids saga/, "role-playing"],
    [/kyoto|la carte au tresor|les aventures|les nouvelles aventures|mushishi|murder in venice|mystic mind|naniwa wangan|navit|nessa no hoshi|perfect assassin|pinocchia|pocke kano|pocket family|pocket muumuu|ponta to hinako|princess and the frog|ruriiro no yuki|r u r u r|rain wonder trip|routes portable|saihate no ima|sampaguita|school rumble|secret game|secret of evangelion|senritsu no stratus|shinseiki evangelion|shuryou no suiri|stela|tales from the borderlands|strong bad|stick it to the man|snark busters|tokyo shadow|wanchai connection|welcome house|willy wombat|the blue crystal rod|wally wo sagase|wedding peach|yadamon|zakuro no aji|yogi bear|zero tsukihami|the hunchback|the new addams family|flintstones|pumuckl|sanrio timenet|oide rascal|noobow|pooh and tigger|monoshiri sengoku|moyashimon|jacqueline wilson|la historia? de france/, "adventure"],
    [/last bullet|search and destroy|sidewinder|max|rxn raijin|socom|steredenn|stardrone|short peace|sky diving|slam bolt scrappers|starwhal|tac heroes|the hohei|thunder force|tokusou kidoutai|twin strike|top shot arcade|top shot dinosaur hunter|r type\b|r type dx|the mummy|thunderbirds|toy robo force|uchuu daisakusen|v i p|zero one|zero one sp|zoids wild/, "shooter"],
    [/mezase tsuri|rapala trophies|skate park city|score international baja|se pa 2001|singstar|summer challenge|summer stars|test drive ferrari|touge king|virtual kyoutei|waialae|take yutaka|tsuppari|tsuri tarou|turf hero|turf memories|umizuri|winter sports|winter stars|top spin|the cages|the amazing race|tv total events|yuujou no victory goal|pga european tour|nippon daihyou|pocket gi stable|pocket lure boy|pocket stadium|yuushun rhapsody|xs moto|tir et but/, "sports"],
    [/mini yonkyu|mtb dirt cross|motor mayhem|monster trux|monster trucks|moto x|n gauge|netw?z magazine|power shovel|parking star|lifespeed|ocean runner|wrc 9|thunder alley|road trip|urban extreme|test drive/, "racing"],
    [/l enigmistica|lingo|lingo deluxe|magicq|maeh jongg|mensch argere|mind body soul|minna no oekakiyasan|mouja|mr prospector|ocha no ma battle|odo odo oddity|otona no asobi|pikiinya|pojitto|potestas|prisoner|korokesu|lets splat|link a pix|nurikabe|nyoki nyoki|odekake takorin|oekaki|okiraku|physical contact|super collapse|super fruit fall|super stacker|sparkle|sparkle 2|super soukoban|toride|yam ?yam|trick star|tringo|uno 52|v master cross|renju club|painter momopie|pyramids of ra|rats\b|out of gas|pac man|panel no ninja|pyramid|the 1000000 pyramid|price is right|table games/, "puzzle"],
    [/lets play fashion|lets play journalists|lets play schools|lovely lisa|mommy talk|mein beautyhotel|mein traumjob|my amusement park|my animal centre|my ballet studio|my garden|pixygarden|plarail|popstar maker|pocket jiman|pocket family gb|pocket densha|kira meki oshare salon|kingdom s item shop|kobito|kutar|little doll princess|my melody|ocha ken|of mice and sand|order land|oshare na koinu|shuukan toro station|testyourself|virtua photo studio|virtual shock|ugoku e|walk it out|biggest loser|daring game for girls|saddle club|zoo hospital|wan nyan|wanko mix|watashi no makesalon|tokimeki dream/, "simulation"],
    [/monster band|perfect performer|sing ?on|the voice of germany|the x factor|zumba|x japan virtual shock|singstar|the idolm?aster|hop step idol/, "rhythm"],
    [/l histoire de france|culture generale|mon coach|mon premier|mouichido|talkman|nihonshi target|nanonote|word safari|phonics fun/, "educational"],
    [/lively garden|lilpri|miss princess|moetan|no appointment gals|omizu no hanamichi|pop de cute|prism court|prismaticallization|school rumble|seikai no senki|sekai no subete|separate hearts|shikigami no shiro|shine kotoba|shirogane no soleil|shoujo yoshitsuneden|shoukan shoujo|shounen onmyouji|shuumatsu shoujo|simoun|snow bound land|star driver|stormlover|tamayura|tasogare|te to te|virtua call|wizard s harmony|kobayashi ga kawai|little doll princess|petit novel|new loveplus|osomatsu|kono ?suba|la[id]* back camp|yume nikki|yunohana spring|virtua call|photo genic|pia carrot|ojousama|moon cradle|panic chan|the shinri game/, "visual novel"],
    [/mite wa ikenai|saishuu densha|shiju hachi|the akuma hunters|tasogaredoki|phasmophobia|the walking dead final season|ottos ottifanten.*nightmare|yuurei yashiki/, "horror"],
    [/scrabble|who wants to be a millionaire|minute to win it|wi fi taio|jewel match|jewel time|jewels of|scrabble 2003|texas cheat|taisen chinchirorin|yu gi oh|duel monsters|master duel|destiny board traveler/, "party"],
    [/sentou kokka|teitoku no ketsudan|tenka bito|shoryu sangokuengi|shin shikoutei|sengoku mugen|sengoku cyber|sengoku hime|sangoku hime|sangoku stories|secret empires|small world z|battle over the pacific|wwii/, "strategy"],
    [/ni no kuni|nora to toki|phantasy star zero|ore ga omae|karyuu jyou|mystic ark|seirei shoukan|seikoku 1092|shin sd sengokuden|shinseiden megaseed|junjou.*spectral force|tir na nog|taishou mononoke|tenshou gakuen|shinki gensou|shoukan shoujo|yuusha 30|zill|xerd|zok zok heroes|zoids densetsu|xerd no densetsu|xenoblaze|yorunonaikuni|xblaze|terrover|takt of magic|tales from the borderlands|terrover|yuukyuu gensoukyoku/, "role-playing"],
    [/nickelodeon dora|nickelodeon team|odoru daisousasen|otoshi deka|oyaku de asoberu|plop en de|plus belle|seikai no monsho|seikai no senki|septentrion|silent mobius|silver jiken|simple 1500.*sound novel|simple 1500.*cameraman|simple 1500.*kaiten|the kanshikikan|the saiban|the suiri|the tokudane|the uchuujin|the princess and the frog|titeuf|veg[g]?y world|welcome house|yakouchuu|yamikara no izanai/, "adventure"],
    [/operation vietnam|shichisei toushin|shin senki vangale|shockwave assault|silent iron|simple 1500.*sensuikan|tank elite|taisen.*soldier|search and destroy|seigi no mikata|shijyou saikyou|shinjuku no okami|shinkon gattai|shinseiki yuusha|the battle of yuu yuu hakusho|the bushido|the maid fuku|the mini bijo|the mouse police|the ochimusha|the otoko|the saiyuki|the survival game|the survival game 2|the tokusatsu|the zerosen|they came from the skies|tom clancy s ghost recon|tough dark fight|riki densetsu|samurai g|samurai sword destiny|rto\b|rto 2|rto 3|shingeki no kyojin|shuriken sentai|slime slayer|south park|saints row|samurai jack|tousouchuu|zack zero|zombeer|zoku susume|zero shiki|zoids wild/, "action"],
    [/seadoo|sea doo|shutokou battle|simple 1500.*bike race|simple 1500.*zero yon|simple 1500.*kyoutei|taxi rider|tetsu 1|tokyo bus|tokyo road race|riding stables|rising board|speedx|wangan midnight|world circuit|sea doo hydrocross/, "racing"],
    [/nippon futsal|ookiku furika|play stadium|power league|power stakes|simple 1500.*gateball|simple 1500.*tsuri|simple 1500.*basket|simple 1500.*takkyuu|simple 1500.*sumo|simple 1500.*beach volley|simple 1500.*suiei|simple 1500.*futsal|takahashi naoko|tna impact|the aka champion|the cages|top spin|world beach volley|winter blast|haikyu|schlag den raab|rapala trophies|saru get you|skate park city/, "sports"],
    [/nounai aesthe|nova usagi|ojaru maru|passeport|pixeline skolehjaelp|shichida shiki|shichida.*asoventure|the kiryoku kentei|the unou drill|talkman|yamakawa ichimonittou|phonics fun/, "educational"],
    [/numpla|peggle|pictoimage|piyodamari|ogwangui darin|maejig|magicq|maeh jongg|simple 1500.*gomoku|simple 1500.*card|simple 1500.*meiro|shougi|taisen bakutama|tam tam paradise|the arcade|the table game|shift dx|shephy|slitherlink|xi coliseum|wordtris|super glove ball/, "puzzle"],
    [/nursery mania|norimono oukoku|onsei kanjou|our house|paws and claws|photo phantasy|planet rescue|my amusement park|pingu|pinkalicious|pocket family|shin theme park|shinsei toire|the gekai|the konchuu|theme park roller coaster|thomas friends|toro to kyuujitsu|kingdom s item shop|kutar|rv 7 my drone|scoop n birds|sonipro|virtu[a]? photo studio|yostar|yoostar|the biggest loser/, "simulation"],
    [/norinori relakkuma|big time rush|singstar|technicbeat|monster band|x factor|the voice|norinori|perfect performer/, "rhythm"],
    [/ookami to koushinryou|otogi juushi|sentimental journey|serofans|screen\b|no appointment gals|pocke kano|prism court|prismaticallization|secret of evangelion|secret game|school rumble|separate hearts|tentama|touka gettan|shikigami no shiro|shirogane no soleil|shumatsu shoujo|simoun|snow bound land|sousaku alice|wand of fortune|will o wisp|yoake mae|yoiyo mori|ro kyu bu|rebellions|rain wonder trip|rurur|routes portable|saihate|sampaguita|wan ?ch?ai connection/, "visual novel"],
    [/mite wa ikenai|shisha no yobu yakata|saishuu densha|silver falls|noroi|misshitsu|noroi hai byoin|noroi no haikousha|phasmophobia|zero tsukihami|zombeer/, "horror"],
    [/tecmo hit parade|the arcade|namco gallery|wonder 3 arcade gears|thunder force gold pack|arcade archives|arcade archies|the arcade/, "collection"],
    [/taito memories pocket/, "collection"],
    [/hikaru no go|hitori by nikoli|kakuromaniacs|juggler ds|jumble madness|million classic|miracle world.*iq meiro|numbers paradise|mah[oō] poi poi|logos panic|little magic|solomon s key|solstice|hidden folks|marisa and alice|phrasefight/, "puzzle"],
    [/john deere|jojo s fashion|kawaii koinu|sukusuku kosodate|minna no shiiku|kouchuu|licca|nintendo labo|toy con|fit and fun|figureobics|ready steady cook|rec room games|story hour|storybook workshop/, "simulation"],
    [/kira kira pop princess|kirarin|minimoni|mini moni|k3 en|jonas|ongaku tsukuuru|popstar maker|idol time pripara|pripara|p kara|cv casting voice/, "rhythm"],
    [/kaijuu busters|kaizoku sentai|keshikasu|ketsui death label|ch[oō] soku henkei|crazy chicken|deathmatch village|extreme exorcism|girl fight|gladiator vs|hydrophobia|ikki online|invincible knight|jak 3 hd|ninja box|ninja issen|no more heroes|not a hero|ok k o|overwatch 2|power rangers samurai|reload\b|space camp/, "action"],
    [/kaitou rousseau|journey to the center|kamo no hashikamo|keitai sousakan|kimmikawae|inu kaisha|kitahei gold|necrob?arista|okuri inu|peaky blinders|new carnival games|new play control|pirates hunt for blackbeard|smiley world/, "adventure"],
    [/kambayashi|unou kids|kaite oboeru|kids thinksmart|mickey.*kazuasobi|jungle school|science papa|questions pour un champion/, "educational"],
    [/gp challenge|miracle space race|densha unten|gotouchi tetsudou|jet coaster dream|mountain sports|rapala we fish|real madrid|skate city heroes|speed 2?\b|power league|jissen kyoutei|inazuma serve|isouzuri|isozuri/, "sports"],
    [/elvenland|nishikaze|nuga cel|nier replicant|phantasy star online|phantasy star online 2|ore no dungeon|riglord saga|ronde|shiroki majo|s[oō]ldnerschild|shadows of the tusk|idea no hi|kishin korinden|koury[uū] densetsu|power of the hired|shin momotar[oō] densetsu/, "role-playing"],
    [/mermaid no kisetsu|milky season|north wind|omoi no kakera|only you|nurse witch|nogizaka|ore wa shoujo|ooedo senryoubako|ookami kakushi|omerta|o g a onigokko|shinseiki evangerion|mah[oô]tukai ni naru|ry[oô]ko no oshaberi/, "visual novel"],
    [/operation air assault|air conflicts|akai katana|bang!|section 8|sky kid|sky shark|star force|starship hector|operation wolf|planet joker|hyper reverthion|kyuutenkai|s[oō]k[uū] no tsubasa/, "shooter"],
    [/p t o iv|north and south|overlord|pirates!|sengoku no hasha|shoury[uū] sangoku|senken kigy[oō]den|insect planet td|not tonight|peaky blinders mastermind/, "strategy"],
    [/michael owen|track and field|skate or die|slalom|stadium events|nickelodeon guts|[oō]zum[oō] spirit|sougo kakutougi|afl evolution|afl live|ninki pro wrestler|shawn johnson/, "sports"],
    [/meremanoid|metamoru panic|monster in my pocket|shadow of the ninja|spider man|spy hunter|snake s revenge|snow brothers|seicross|poi poi ninja|soukou kihei|shinouken|battle beaster|bomber hehhe|capcom vs snk|cyber team in akihabara|death crimson|dragon riders|giant gram|hamatora|heart beaten|hit ninja|hungry burger|hyperlight|i f o/, "action"],
    [/adk damashii|activision hits|oretachi game center|game center zoku|namco museum|sega ages|taito memories|intellivision lives/, "collection"],
    [/menkyo o torou|jane s hotel|satisfashion|real stories v[eé]t[eé]rinaire|mom chan diet|minna no joushiki|os[oō]ji sentai clean keeper|shuukan toro station|otostaz|i m s channel|a train hx|a ressha/, "simulation"],
    [/hidden haunts|ice station z|outlast|friday the 13th|kowloon jou|missland|saishuu densha/, "horror"],
    [/konzentration|knigge|my english coach|my reading tutor|my sat coach|my virtual tutor|sokudoku master|rakushiku manabu|unou kids|brain|tutor|coach|kanji|kanken/, "educational"],
    [/lets play fashion|mission runway|my fashion studio|my first dollhouse|my friends|my hero doctor|my doitall|minna no doubutsuen|minna no suizokukan|nakayoshi all stars|johnny s payday panic|hime girl paradise|js girl|niko puchi|lets ride|real stories|patisserie|shepherd s crossing|sushi go round|rilakkuma|paws and clean|cozy claw machine|fruit collector|paper plane|spin the book|spin the lighthouse/, "simulation"],
    [/kurayami no hate|koushounin ds|kimi ni todoke|kemeko deluxe|my boyfriend|nadia|proof club|psychometrer eiji|paddington|pinocchio|shibai michi|shirach[uū] tankenbu|sitting ducks|smarties|son of the lion king|s[oō]sei no akuarion|legends of oz|i and me|reconstruct|rashomon|reggie his cousin|remilore|universal nuts|the psychotron|tilk|tenchi muy[oō]|triangle again|innocent tears/, "adventure"],
    [/live battle card|machiteba|monte carlo games|pro backgammon|morita kazurou|gomokunarabe|pai chenjan|pochinya|otona no gal jan|kurubushi.*mah|sound qube|tenchi muy[oō].*rensa|domino master|lost cities|magic the gathering|spades|texas hold|path of go|wits and wagers|checkers|pure hold/, "puzzle"],
    [/happy hippos|koh lanta|mtv fan attack|magical zunou|monopoly|six flags fun park|survivor|wipeout 2|wipeout 3|hole in the wall|intel discovered|kinect fun labs|kinect playfit|kinect sports gems|kinect sports|30 sport games in 1/, "party"],
    [/ketsui|mizuiro blood|monster bomber|mobile armor|project gaiaray|rageball|polaroid pete|police 24 7|search and destroy|shadow of ganymede|shinseiki y[uū]sha taisen|skyscraper|swords\b|simple wii.*combat|super sentai|the monkey king|toshinden|twinkle queen|power rangers|powerup heroes|concept destruction|deadcraft|dayz|grounded|motor strike|playerunknown|realm royale|rogue company|carpieces|cazzarion.*robot|cazzarion.*tank|color snake|mr supershot|palworld|ping redux|the last stand|magatama|raze s hell|toxic grind|virtual on/, "action"],
    [/kiganjo|megami no etsubo|mutsuzaki|nozomi kanaetamae|pizzicato polka|petit four|s y k|skip beat|sotsugy[oō]|standby say you|mystumete knight|mitsumete knight|misaki aggressive|merriment carrying caravan|milky season|mermaid no kisetsu|manic game girl/, "visual novel"],
    [/meru purana|monster complete world|queens road|quo vadis|journey to kreisia|justice chronicles|legna tactica|maj[in]? bone|royal anapoko|is it wrong to try|dungeon crawl|dungeon crawler|roguelike|roguebook|nowhere prophet|a healer only lives twice|dungeontop|evertried|knightin|ore no dungeon|sword and sorcery|zanma|tenerezza|rent a hero|sol[o]? crisis|tadaima wakusei/, "role-playing"],
    [/international track|midori no makibao|pro bodyboarding|r rock n riders|rc helicopter|oreg[a]? kantoku|perfect ace|skate attack|ski alpin|ski jump|snocross|snow rider|summer athletics|planet basket|backbreaker|michael phelps|prize driver|rapala for kinect|ski race|stoked|top hand rodeo|8 to glory|kick off revival|laser league|skate city|tour de france|ppa pickball|inside pitch|manchester united|sega gt|touge r/, "sports"],
    [/moore?huhn|moh?rhuhn|moorhen|rock blast|rockets rockets rockets|rocketmen|super hornet|superfrog|stealth inc|sackboy|ratchet|sly 2|sly 3|sly cooper|feudal alloy|nightmare boy|red goddess|snakeybus|super wagyan|super dany|tryrush deppy|montezuma|mr nutz|mulan|pinobee/, "platforming"],
    [/panzer general|tropico|constructor|constructor plus|terratech|core keeper|smalland|citadel forged|impact winter|don t starve|shakedown hawaii|sengoku musou|r[yūu] ga gotoku|onimusha soul|invokers tournament|the godfather ii|sengoku|nobunaga/, "strategy"],
    [/para para paradise|the idolm?aster|sheryl nome|punch the monkey|moritaka chisato|standby say you/, "rhythm"],
    [/operation cobra|super hornet|strike force hydra|project coder? kaleido tower|nerf legends|r i p d|ra one|legend of robots|ethan meteor hunter|akai katana|wolf fang|steeldom|cazzarion.*star collector|feed my raptor|independence day run|jump challenge|jumpjumpjump|sunshower/, "shooter"],
    [/card game|card and board|board|domino|checkers|uno flip|kilka card|maliya|spellspire|reversal challenge|road to vegas|pass the pigs|pogo island|pokemon card game|pok[eé]mon trozei|kreuzwortraetsel|crossword|slither link|sou?kou?ban|kakuro|pic a pix|quell|rabi laby|puchitto cluster/, "puzzle"],
    [/survival|battle royale|stealth|metroidvania|runner|endless runner|arcade|casual|unique|platform|sidescroller|roguelite|mop operation cleanup|run like hell|velocibox|z run|paradox soul|pixel hunter|fireworks|mens room mayhem|men s room mayhem|playstation home arcade|breakthrough gaming arcade|doughlings arcade|minotaur arcade|touhou sky arena|unturned|wildfire|xenon valkyrie|chronos time|cliff rush|ice jump|labyrinth run|poopy time|say a prayer|cazzarion.*pop|atama|dragon saikyou|navinosuke|rage of the dragons|touhou hyoibana|yoiyami dreamer/, "action"],
    [/five dates|simulacra|interactive fiction|full motion video|alone with you|the walking dead final season|okami|[oō]kami|neverway|perky little things|puchi novel|poptropica|nancy drew|nanda s island|naraba|natalie brooks|real crimes|riku to johan|princess lillifee|playmobil top agents|oscar der ballonfahrer|orla frosnapper|knerten gets married|koushounin|kinku?mawae|kimi ni todoke|do konjou/, "adventure"],
    [/pony friends|pony luv|puppy palace|plushees|my stop smoking coach|nanami no oshiete|new horizon english|new un[oō] kids|ni hao kai lan|poy?o poy?o kansatsu|puppies 3d|riding academy|nankoku sodachi|nadia megafun|nadia s world|panda run|indoor sports world|fit and fun|the magic roundabout/, "simulation"],
    [/red bull bc one|popstars|para para|stepping selection|the idolm?aster.*gravure|sheryl nome|standby say you|utau tumbling dice/, "rhythm"],
    [/powerbike|professional fisherman|polar?is snocross|backbreaker|triple play|uefa|tt superbikes|turbo trucks|speedboat gp|spindrive ping pong|ski alpin|sprint car|superbike gp|super birdie rush|super dunk star|super family circuit|super indy champ|super kyuukyoku harikiri stadium|super baken|slam n jam|slam 'n' jam|64 [oō]zum[oō]|mike piazza|tony hawk|top gear|wcw|inside pitch|wild rings|tour de france/, "sports"],
    [/nanashi no game|nanashi no game me|shin hayarigami|the last stand aftermath|organ trail|reikoku|ring of sias|darkness|nightmare/, "horror"],
    [/river king|remyuouru|spectral|sunrise eiyuutan|tensei hakkenshi|towa no sakura|tsuki wa kirisaku|sugoro chronicle|royal anapoko|retro game challenge|potion craft|remilore|sugoro|zool|robot ponkottsu|one?gai monsters|riot stars|solid link|sonata|sorcerer s maze|sougaku toshi|satomi no nazo|rung rung|ryuki densyo|rune no joka|oukyuu no hihou|meru purana|neues|rubbish blazon|rune caster|rune jade|vermilion desert|el dorado gate/, "role-playing"],
    [/ninja jaja|robotron|rocket robot|shadow man|the world is not enough|vigilante 8|iron phoenix|samurai shodown|tom clancy s rainbow six|miami vice|sentou yousei|zegapain|space rebellion|special forces|splatter master|stealth force|street boyz|sub rebellion|swat siege|uchuu keiji|ultraman|ultra seven|real robot battle|real robots final attack|robo pit|rockman [456]|s[oō]kaigi|slime shiyou|simple 1500.*sentou|simple 1500.*kendo|jaja marukun|muteki|monster punish|metal fangs|iron hammer|skeleton krew|splatterhouse|terminator 2|toki going ape|y[uū] y[uū] hakusho|karous|killca drive|league of heroes|legend of kusakari|ohno odyssey|operation cobra|penguin no mondai|pirate pop|poochy|psycho pigs|raining coins/, "action"],
    [/dyna brothers|starcraft 64|sim city|panzer general|tropico|shinseiki odysselya|youchien senki|nhk taiga drama|ransei no hasha|quovadis|mobius link|rescue 24 hours|p t o|the mechsmith/, "strategy"],
    [/sister princess|sugar sugar rune|suigetsu|sweetHoneycoming|sweet honey coming|under the moon|umisho|trouble fortune|roomshare|sotsugy[oō]|nakoruru|miss moonlight|close to inori|himitsu yui|yume no tsubasa|ry[oō]ko inoue|revive|kaen seibo|puchi eva|kurayami|kimokawae|jufun|jugyouchuu|kono bushitsu|kyoukai senjou|motto nee|nichijou|pastel chime|phase shift|jansei gakuen/, "visual novel"],
    [/yu suzuki game works|midway s greatest hits|iseki hacchou|game hits|monte carlo games compendium|activision hits remixed|retro game challenge/, "collection"],
    [/janou toury[uū]mon|klondike|shi kin joh|show do milh[aã]o|janjuu gakuen|super zugan|ultra shinri game|sound novel tsu|sound novel tsuk|nankuro|rain drops|kuwagata tsumami|kuropoto|kurupoto|labyrinth|hyper paddle|kami\b|pick a gem|pink dot blue dot|pong pong candy|q\b|musapey|net versus gomoku|logic battle/, "puzzle"],
    [/wacky worlds|restaurant dream|rescue copter|rc helicopter|sl de ikou|steam express|tomak save the earth|truck kyousokyoku|petit copter|poinie s poin|space fishermen|sennen kazoku|snap kids|starcom|tonka on the job/, "simulation"],
    [/metroid|star ?tropics|strider|super c|teenage mutant ninja turtles|the guardian legend|the last ninja|legend of kage|punisher|terminator|untouchables|to the earth|total recall|totally rad|toxic crusaders|trog|vattle giuce|versus hero|volley fire|zoids|jungle no ouja|juukou senki|karakuri kengou|gekitou power modeler|genjin kotts|ginga\b|hero hero kun|koury[uū] no mimi|nekketsu tairiku|ry[uū]kihei|shin ikkaku|shin togenkyo|spark world|stardust suplex|super ninja|ultra seven|yamato takeru|zig zag cat|chou hatsumei|gakkyuu ou|kiteretsu|tech romancer|treasure strike|undercover ad2025|rock of ages|pirates 7|rou?ge company|touhou hyoibana|the walking dead/, "action"],
    [/tecmo bowl|tecmo super bowl|track and field|town and country surf|blue marlin|goal!|super team games|eiko no saint andrews|jikky[oō] gi stable|razor freestyle|triple play 2000|wcw|tony hawk|top gear hyper bike|saka ?tsuku|red bull|riding academy|super auto salon|super fahrschule|tetsudou|professional fisherman|powerbike|roller angels|pro cycling manager|u move super sports|world fantasista|world super police|whiteout|wild water|x treme quads|zero4 champ|tokoro san no setagaya|tip off|tsuriiko|umi no nushi/, "sports"],
    [/rubik|tangram|table game spirits|tele 7 jeux|soroban|smart boy|smart kid|smart girl|sloane|squishy tank|suujin taisen|the bakudan|the eigyoudou|the guild|tales to enjoy|taitsu kun|taiketsu rumi|tall infinity|tall twins|thats pon|techno bb|tobaku mokushiroku|tokoro san no daifugou|tsume go|uno 2|uno small world|toreedo|final reverse|koi wa kakehiki|mr go|rentaiou|twin\b|nivy blue|navy blue|megatudo|meta ph list|reverthion|rox\b|shake kids|spin jam|suzumepai|thunder and lightning|yoshi\b/, "puzzle"],
    [/kensch[uū]i tendo doctor|lets play fashion|lets play journalists|lets play schools|sally s salon|salon superstar|style lab|sugar bunnies|sushi academy|team umizoomi|t choupi|tetsudou seminar|haishasan|my hero doctor|super galdelic hour|yakiniku|yoshinoya|yamasa digi|yoake no mariko|the bistro|the dog master|the drugstore|the game maker|heiwa otenki studio|tomika town|tonde tonde diet|watashi no kitchen|watashi no restaurant|welcome nakayoshi|wendy der traum|portable island|photo kano|playenglish|moegaku|nou ni kaikan|nippon no asoko|sukusuku inufuku|fit and fun/, "simulation"],
    [/nanashi|shinreigari|the haioku|saish[uū] densha|vampire panic|the tairyou jigoku|reikoku|shin hayarigami|tombs and treasure|taboo|mystery|ghost|spooky|horror/, "horror"],
    [/saga 2|steal princess|river king|remyuouru|spectral|super robot|zodiac|valhalla knights|venus and braves|tir nan og|no heroes allowed|musou orochi|nendoroid generations|tokyo mono harashi|valkyrie profile|vm japan|waga ry[uū]|youki hime|yoshitsune|zipang|startling odyssey|stone walkers|suna no embrace|super hero sakusen|soul master|solid link|tokyo dungeon|tokyo majin|tenshi no shippo|tenkuu no restaurant|the mystic dragoons|zool|one?gai monsters|surging aura|exile\b|dahna|devilish|dragon s fury|saint sword|yu y[uū] hakusho gaiden/, "role-playing"],
    [/saikin koi|secret flirts|secret story|signal\b|suki desu|uragiri|weare|white breath|white princess|yomigaeri|yatohime|umisho|under the moon|tsuyo kiss|unending bloodycall|vitamin r|vitamin z|to heart|toaru kagaku|togainu|tegami bachi|phase d|princess evangile|r 15 portable|tiger and bunny|trick x logic|sister princess|tokimeki no houkago|st luminous|sakamoto ryuma|taiho shichauzo|tenku no escaflowne|tenshi na konamaiki|the ronron|the snowman|time bokan|tokyo mew mew|nakoruru|revive|suigetsu|sakura momoko|sotsugy[oō]/, "visual novel"],
    [/saihai no yukue|settlement colossus|sonshi no heihou|stratego|survivor|system flaw|tac heroes|world tank museum|battle of olympus|silent service|star trek|wall street kid|dyna brothers|nhk taiga|ransei no hasha|corporation\b|real robot battle line/, "strategy"],
    [/stinger|sqoon|star voyager|space shuttle|thundercade|tiger heli|super hornet|twinbee|salamander|thexder|xyanide|wwi aces|vietcong|vietnam|sub rebellion|world tank|strike point|soukyuugurentai|space chaser|space rider|starborders|tiny bullets|tiz tokyo insect|tac heroes|tank|air assault/, "shooter"],
    [/talespin|rainbow islands|super pitfall|spelunker|snake rattle|spot the video game|swamp thing|sword master|the blues brothers|the goonies|the jetsons|the newzealand story|toki\b|tom and jerry|treasure master|parasol|mr nutz|the smurfs|tintin|tom and jerry|super wagyan|super dany|tryrush deppy|pocket kyorochan|pinky monkey|poyon|pri pri primitive|ottifanten|moomin|lucle|magical taruruto|magical chase|krtl|i ve got to run|jump trials|runbow|tappingo|timberman|tinboy|turtle tale|umihara kawase/, "platforming"],
    [/nep league|oktoberfest|pururun|pogo island|silly bandz|silverlicious|smart.*gameroom|strawberry shortcake.*games|super producers|yukawa|yume baken|yuujin no furi|bakush[oō] jinsei|ucchan nanchan|the three stooges|show do milh/, "party"],
    [/scripps spelling|new horizon|nanami|pixeline|spanisch buddy|pururun.*drill|tales to enjoy|tanoshii youchien|thomas to asonde|miracle piano|magic school bus|tetsudou kentei|playenglish/, "educational"],
    [/yume no tsubasa|miss moonlight|july\b|es\b|christmas seaman|card of destiny|kaen seibo|ry[oō]ko inoue|nakoruru|himitsu yui|kitahei gold|ever 17|izumo|seaman|triangle again/, "visual novel"],
    [/let s play fashion|let s play journalists|let s play schools|san x|style lab|strawberry shortcake|sugar bunnies|team umizoomi|the haishasan|the jidousha|the mushitori|the sagasou|tetsudou seminar|tetsudou musume|thinksmart|think again|tinkerbell|tongari boushi|tomyka hero|plushees|odenkun|samantha oups|silverlicious|sarah keeper|saru saru|the hoobs|the tower|tokyo wakusei|tonka space|studio p|poy?o poy?o|plantera|style savvy|puchicon magazine|toriko gourmet monsters|welcome to universal studios|wacky zoo|girl zone|kensh[uū]i tendo/, "simulation"],
    [/negima|shounen sunday|pucca|soul eater|souseiki gadget|spy kids|tak mojo|the chase|the frogman|the genshijin|the hikyou|the host|the senkan|the sensha|the shouboutai|sideswiped|tokumei sentai|tokyo twilight|system flaw|kurogane no linebarrels|nanodiver|oretachi no sabage|project cerberus|samurai dou|sunday vs magazine|tiger and bunny|vulcanus|zettai zetsumei|obake choice|sensuikan sweeper|youkai doubt|orla|shorts|the wild west|tabaluga|suske|squinkies|the powerpuff|ren stimpy|vip\b|mercenary force|penta dragon|pocket battle|the great battle pocket|super micchan|ougon kishi|ouka|obliterate|saint and sinner|search and destroy|shin gouketsuji|tenkuu danzai|tensai bit|ueki no housoku|yakuza fury|heisei tensai|hyper 3d taisen|kunoichi|sitisei|vatlva|waku waku monster|tako no marine|run dim|taisen net gimmick|despiria|de ?spiria|genkai yamadzumi|go princess precure|hiding out|hippari|hiyoko|hoppechan|ijin bakutou|jet dog|johnny dynamite|johnny hotshot|johnny impossible|jump yuusha|kung tutu|little sheep|nyanyanto|oh gattiman|ping pong trick shot|pix 3d|polara|pri ?pri chi|rage of the gladiator|rainbow snake|raishi|robot rescue|runbow|saiki kusuo|shin hyu|shinjuku dungeon|space intervention|space lift|squarcat|strike force foxx|super destronaut|touch battle|turtle tale|unholy heights|ninja jaja|kageki|ka ge ki|slaughter sport|f 22 interceptor|darwin 4081|uch[uū] senkan gomora|a dinosaur s tale/, "action"],
    [/saka no gabaibaa|riku to johan|nancy drew|samantha swift|sekai fushigi hakken|the sorcerer s apprentice|story of noah|tkkg|the last report|the mission|the visitors|susume kaizoku|saban s iznogoud|pikupiku sentarou|ponkkikkids|mori no oukoku|iwatobi|kitty the kool|kouyasai|mushi no idokoro|purumui|ramen hashi|segare ijiri|senkai tsuuroku|senran|shinshuku taisan|toko toko trouble|tokyo disneyland|momotaro densetsu|momotaro dengeki|ohasuta|parasol hen|welcome nakayoshi|jungle no ouja|guruguru garakutas|hiden inyo|honmei boy|jikuu senki|kininkou|kitchen panic|koukiatsu|marchen club|mary kate|mysterium|nikkan|nintama|otogi banashi|peke to poko|pri pri primitive|ryuuteki|sakamoto|mizuki sigeru|shichuu suimei|sorvice|takuramakan|texthoth|utau|sekai fushigi hakken troy|the magic roundabout|osyb?aberi|osyaberi/, "adventure"],
    [/saka ?tsuku|shounen sunday.*dream nine|the sports daishuugou|super live stadium|thoroughbred|tnn motor sports|skydiving extreme|running high|speedball|sports superbike|stakes winner|street racquetball|street scooters|suizokukan|tetsu ikuzawa|the blue marlin|super honmei|super kyousouba|saikyou takada|sougo kakutougi|sougo kakutougi rings|shiki eiyuuden|song master|wagyan paradise|fit and fun|saint\b|pele|pro striker|lotus|f 22 interceptor|normy|pepenga pengo|nekketsu koko|taz express|tigger s honey|pokemon stadium|pok[eé]mon stadium|64 ozumo|64 [oō]zum[oō]/, "sports"],
    [/rubik s world|theta|tangram mania|tele 7|table game|squishy tank|soroban|sloane|suujin|splat the difference|spot the differences|snake3d|pic a pix|tappingo|tangram attack|tangram style|the delusions|phantom thief|queen tv|thieves and the 1000|toite susunde|super zugan|supapoon|thunder and lightning|thats qt|tensen nyannyan|suzuki bakuhatsu|schnappi|qui qui|tsume go|uno\b|yamasa digi|piyotama|voodoo dice|worms revolution|fibbage|bang!|rotastic|piyotama|tumble|suzumepai|tobaku|tall twins|tall infinity|taiketsu rumi|that s pon|techno bb|the ronron|pocket king|mr chin|toobin|tv champion|final reverse/, "puzzle"],
    [/the idolm?aster|kayou generation|world of golden eggs|way of the dogg|stolen song|sheryl|popstars|red bull bc one|standby say you|tribe cool crew/, "rhythm"],
    [/steal princess|sa ?ga 2|sa ga 2|sugoro chronicle|settlement colossus|remyuouru|symphony of eternity|sadame|unlucky mage|the keep|shiren|shiren monsters|monster summoner|monster guardians|onis? ii|oni iii|oni iv|oni v|the sword of hope|mahou kishi rayearth|magical chase|pocket king|toreedo|valhalla|venus|tir nan og|zodiac|startling odyssey|stone walkers|sunrise eiyuutan|spectral|valkyrie|soul master|tokio senki|the immortal|tombs and treasure|battle of olympus|star tropics|north and south|tengai|sword and sorcery|shoury[uū] sangoku|k[uū]s[oō] kagaku|el dorado gate|rune jade|vermilion desert|zool/, "role-playing"],
    [/nanashi|shinreigari|tokyo twilight|the haioku|yakochu|reikoku|ring of sias|shin hayarigami|despiria|de ?spiria|tairyou jigoku|saish[uū] densha/, "horror"],
    [/space shuttle|solar jetman|terra cresta|the hunt for red october|the mafat conspiracy|mutant virus|stinger|sqoon|star voyager|time lord|tac heroes|senkan|sensha|thexder|under defeat|velocity ultra|wicked monster blast|wipeout hd|wrc powerslide|world hunter|whitetail challenge|wanted corp|watchmen|wheels of destruction|vietcong|wwi aces|torpedo range|soukyuugurentai|space chaser|space rider|thunder storm/, "shooter"],
    [/saihai no yukue|sonshi|stratego|the guild|sengoku|tenga seiha|tower bonus|tetsudou o|dyna brothers|sim city|starcraft|nhk taiga|wall street kid|r i p d/, "strategy"],
    [/superman|gremlins 2|street cop|the great waldo|toki\b|tom and jerry|town and country surf|the blues brothers|the goonies|the jetsons|newzealand|super pitfall|tale ?spin|rainbow islands|spider man|taz express|tigger|the smurfs|tintin|world of illusion|ottifants|scooby doo|space station silicon valley|rocket robot|charlie blast|rakugakids/, "platforming"],
  ];

  [...checks, ...extraChecks].forEach(([pattern, tag]) => {
    if (pattern.test(text) && !tags.includes(tag)) tags.push(tag);
  });

  if (/dragon zakura/.test(text)) {
    return ["educational", ...tags.filter((tag) => tag !== "educational" && tag !== "role-playing")];
  }

  if (/king oddball/.test(text)) {
    return ["puzzle", ...tags.filter((tag) => tag !== "puzzle" && tag !== "role-playing")];
  }

  if (/koihime embu/.test(text)) {
    return ["fighting", ...tags.filter((tag) => tag !== "fighting" && tag !== "visual novel")];
  }

  if (/epic mickey.*power of illusion/.test(text)) {
    return ["platforming", ...tags.filter((tag) => tag !== "platforming" && tag !== "action")];
  }

  if (/l g s shinsetsu houshinengi/.test(text)) {
    return ["visual novel", ...tags.filter((tag) => tag !== "visual novel" && tag !== "adventure")];
  }

  if (/^king arthur\b/.test(text)) {
    return ["action", ...tags.filter((tag) => tag !== "action" && tag !== "role-playing")];
  }

  if (/^monopoly/.test(text)) {
    return ["party", ...tags.filter((tag) => tag !== "party" && tag !== "casino")];
  }

  if (/damage inc pacific squadron/.test(text)) {
    return ["shooter", ...tags.filter((tag) => tag !== "shooter" && tag !== "party")];
  }

  if (/burst error|eve the first|eve the lost one/.test(text)) {
    return ["visual novel", ...tags.filter((tag) => tag !== "visual novel" && tag !== "puzzle")];
  }

  if (/snoopy s silly sports spectacular/.test(text)) {
    return ["sports", ...tags.filter((tag) => tag !== "sports" && tag !== "adventure")];
  }

  if (/ultimate sparring/.test(text)) {
    return ["fighting", ...tags.filter((tag) => tag !== "fighting" && tag !== "role-playing")];
  }

  if (/gaia master/.test(text)) {
    return ["party", ...tags.filter((tag) => tag !== "party" && tag !== "adventure")];
  }

  if (/duck dynasty/.test(text)) {
    return ["sports", ...tags.filter((tag) => tag !== "sports" && tag !== "action")];
  }

  if (/gakkou o tsukurou/.test(text)) {
    return ["simulation", ...tags.filter((tag) => tag !== "simulation" && tag !== "strategy")];
  }

  if (/game watch gallery/.test(text)) {
    return ["collection", ...tags.filter((tag) => tag !== "collection" && tag !== "simulation")];
  }

  if (/^frogger\b/.test(text)) {
    return ["action", ...tags.filter((tag) => tag !== "action" && tag !== "puzzle")];
  }

  if (/super glove ball/.test(text)) {
    return ["puzzle", ...tags.filter((tag) => tag !== "puzzle" && tag !== "simulation")];
  }

  if (/score international baja|baja 1000/.test(text)) {
    return ["racing", ...tags.filter((tag) => tag !== "racing" && tag !== "sports")];
  }

  if (/typing e keikaku|typing/.test(text)) {
    return ["educational", ...tags.filter((tag) => tag !== "educational" && tag !== "adventure")];
  }

  if (/the flintstones/.test(text)) {
    return ["platforming", ...tags.filter((tag) => tag !== "platforming" && tag !== "adventure")];
  }

  if (/schlag den raab|price is right|who wants to be a millionaire|the 1000000 pyramid|minute to win it/.test(text)) {
    return ["party", ...tags.filter((tag) => tag !== "party" && tag !== "sports")];
  }

  if (/south park.*fractured/.test(text)) {
    return ["role-playing", ...tags.filter((tag) => tag !== "role-playing" && tag !== "action")];
  }

  if (/teenage mutant ninja turtles.*arcade game/.test(text)) {
    return ["action", ...tags.filter((tag) => tag !== "action" && tag !== "puzzle" && tag !== "collection")];
  }

  if (/tokyo bus guide/.test(text)) {
    return ["simulation", ...tags.filter((tag) => tag !== "simulation" && tag !== "racing")];
  }

  if (/tom clancy s ghost recon/.test(text)) {
    return ["shooter", ...tags.filter((tag) => tag !== "shooter" && tag !== "action")];
  }

  if (/capcom vs snk/.test(text)) {
    return ["fighting", ...tags.filter((tag) => tag !== "fighting" && tag !== "action")];
  }

  if (/speed limit|cazzarion.*speed run/.test(text)) {
    return ["action", ...tags.filter((tag) => tag !== "action" && tag !== "sports")];
  }

  if (/gp challenge|miracle space race/.test(text)) {
    return ["racing", ...tags.filter((tag) => tag !== "racing" && tag !== "sports")];
  }

  if (/sound novel tsu|sound novel tsuk/.test(text)) {
    return ["visual novel", ...tags.filter((tag) => tag !== "visual novel" && tag !== "puzzle")];
  }

  if (/shinseiki odysselya/.test(text)) {
    return ["role-playing", ...tags.filter((tag) => tag !== "role-playing" && tag !== "strategy")];
  }

  if (/indoor sports world/.test(text)) {
    return ["sports", ...tags.filter((tag) => tag !== "sports" && tag !== "simulation")];
  }

  if (/the magic roundabout/.test(text)) {
    return ["adventure", ...tags.filter((tag) => tag !== "adventure" && tag !== "simulation")];
  }

  if (/smurfs.*nightmare/.test(text)) {
    return ["platforming", ...tags.filter((tag) => tag !== "platforming" && tag !== "horror")];
  }

  if (/games festival|oktoberfest|nep league|pogo island|smart boy|smart girl|smart kid/.test(text)) {
    return ["party", ...tags.filter((tag) => tag !== "party" && tag !== "visual novel")];
  }

  if (/let s ride|pony friends|pony luv|sunshine stables|riding academy/.test(text)) {
    return ["simulation", ...tags.filter((tag) => tag !== "simulation" && tag !== "visual novel" && tag !== "sports")];
  }

  if (/matchbox cross town|matchbox missions/.test(text)) {
    return ["action", ...tags.filter((tag) => tag !== "action" && tag !== "visual novel")];
  }

  if (/^pirates$|pirates legend|pirates 7/.test(text)) {
    return ["adventure", ...tags.filter((tag) => tag !== "adventure" && tag !== "visual novel")];
  }

  if (/thunder wolves|twinbee|salamander|xyanide|wwi aces|super hornet/.test(text)) {
    return ["shooter", ...tags.filter((tag) => tag !== "shooter" && tag !== "visual novel")];
  }

  if (/rock of ages|musou orochi/.test(text)) {
    return ["action", ...tags.filter((tag) => tag !== "action" && tag !== "visual novel" && tag !== "role-playing")];
  }

  if (/time bokan/.test(text)) {
    return ["action", ...tags.filter((tag) => tag !== "action" && tag !== "visual novel")];
  }

  if (/nekketsu tairiku burning heroes/.test(text)) {
    return ["role-playing", ...tags.filter((tag) => tag !== "role-playing" && tag !== "action")];
  }

  if (/christmas seaman|\bseaman\b/.test(text)) {
    return ["simulation", ...tags.filter((tag) => tag !== "simulation" && tag !== "visual novel")];
  }

  if (/devilish|dragon s fury/.test(text)) {
    return ["puzzle", ...tags.filter((tag) => tag !== "puzzle" && tag !== "role-playing")];
  }

  if (/pokemon stadium|pok[eé]mon stadium/.test(text)) {
    return ["party", ...tags.filter((tag) => tag !== "party" && tag !== "sports")];
  }

  if (/shiki eiyuuden|song master/.test(text)) {
    return ["role-playing", ...tags.filter((tag) => tag !== "role-playing" && tag !== "sports")];
  }

  if (/f 22 interceptor/.test(text)) {
    return ["shooter", ...tags.filter((tag) => tag !== "shooter" && tag !== "sports" && tag !== "action")];
  }

  if (/despiria|de spiria/.test(text)) {
    return ["role-playing", ...tags.filter((tag) => tag !== "role-playing" && tag !== "action")];
  }

  return tags;
}

function playSentence(game, tags) {
  const primary = tags[0] || "";
  const title = game.title || "This game";

  const sentences = {
    "role-playing": `${title} should appeal to players looking for character growth, party building, quests, and longer-form progression rather than quick arcade sessions.`,
    "visual novel": `${title} is best approached as a story-first release, where character routes, dialogue choices, and atmosphere matter more than reflex-driven play.`,
    platforming: `${title} centers on movement, stage layouts, timing, and collectible-driven replay, making its moment-to-moment feel important for platform fans.`,
    racing: `${title} is built around vehicle handling, event variety, track mastery, and the loop of shaving time or outperforming rivals.`,
    sports: `${title} focuses on the rules, roster fantasy, and season-or-match rhythm of its sport, with value depending on how well it captures that specific competition.`,
    party: `${title} is designed around quick activities, accessible rules, and replayable group-friendly challenges rather than a long campaign structure.`,
    puzzle: `${title} is a thinking-game entry built around pattern recognition, rules mastery, and repeatable short-session challenges.`,
    fighting: `${title} is about matchups, character move sets, timing, and learning how its combat system rewards practice.`,
    shooter: `${title} emphasizes aiming, encounter pacing, weapon feel, and enemy pressure, so its value comes from how satisfying those action loops are.`,
    action: `${title} is built around direct control, hazards, enemy encounters, and stage-to-stage momentum, with its appeal tied to how responsive and varied those scenarios feel.`,
    horror: `${title} leans on tension, resource pressure, setting, and sound design to create a more deliberate kind of action-adventure experience.`,
    strategy: `${title} asks players to plan around units, resources, positioning, or long-term decisions instead of relying only on reflexes.`,
    simulation: `${title} is centered on systems, management, routine, and incremental progress, giving it a slower and more methodical appeal.`,
    rhythm: `${title} is driven by timing, song selection, scoring, and repeated performance improvement.`,
    adventure: `${title} emphasizes exploration, scenario progression, puzzle solving, and a sense of place over pure score chasing.`,
    collection: `${title} works as a curated package, so its value comes from what it preserves, bundles, upgrades, or makes convenient on the platform.`,
    educational: `${title} is a utility-style release built around practice, drills, and repeatable learning sessions rather than traditional action pacing.`,
    casino: `${title} focuses on table, slot, or parlor-style play loops where rule familiarity and repetition are the main appeal.`,
  };

  return sentences[primary] || "";
}

function makeCatalogOverview(game) {
  const title = game.title || game.name || "";
  const platform = game.platform || "";
  const developers = list(game.developers);
  const publishers = list(game.publishers);
  if (!title || (!platform && !developers.length && !publishers.length)) return "";

  const creatorParts = [];
  if (developers.length) creatorParts.push(`developed by ${humanList(developers)}`);
  if (publishers.length) creatorParts.push(`published by ${humanList(publishers)}`);
  const creatorText = creatorParts.length ? ` ${creatorParts.join(" and ")}` : "";
  const platformText = platform ? ` for ${platform}` : "";
  const release = releaseText(game);
  const firstSentence = `${title} is a catalog-verified release${platformText}${creatorText}${release}.`;
  const secondSentence = `${title} currently works best on GCX as a release-identification entry: visitors can confirm the system, title spelling, credited companies, regional library placement, and whether the game belongs in a platform collection.`;
  const thirdSentence = `The page should still be revisited when stronger editorial sources are available, but this profile gives collectors a cleaner, title-specific starting point than an empty or duplicated overview.`;
  return `${firstSentence} ${secondSentence} ${thirdSentence}`;
}

function makeOverview(game) {
  const title = game.title || game.name || "";
  const platform = game.platform || "";
  const developers = list(game.developers);
  const publishers = list(game.publishers);
  const genres = list(game.genres);
  const tags = inferTags(game);
  if (!genres.length && !tags.length) return makeCatalogOverview(game);
  const genreText = humanList(tags.length ? tags : genres, "video");
  const creatorParts = [];

  if (developers.length) creatorParts.push(`developed by ${humanList(developers)}`);
  if (publishers.length) creatorParts.push(`published by ${humanList(publishers)}`);

  const creatorText = creatorParts.length ? ` ${creatorParts.join(" and ")}` : "";
  const platformText = platform ? ` for ${platform}` : "";
  const article = /^[aeiou]/i.test(genreText) ? "an" : "a";
  const lead = `${title} is ${article} ${genreText} game${platformText}${creatorText}${releaseText(game)}.`;
  const angle = playSentence(game, tags);
  if (!angle) return "";

  const credits = [];
  if (publishers.length) credits.push(`${humanList(publishers)} publishing credit`);
  if (developers.length) credits.push(`${humanList(developers)} development credit`);
  const catalog = credits.length
    ? `For collectors, the key identifiers are its ${platform || "platform"} release and ${humanList(credits)}.`
    : `For collectors, the key identifiers are its ${platform || "platform"} release and title-specific catalogue placement.`;

  return `${lead} ${angle} ${catalog}`;
}

function statusCounts(games) {
  return games.reduce((counts, game) => {
    const status = game.overviewStatus || "unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

let totalUpdated = 0;
const results = [];

for (const platform of platforms) {
  const dataPath = path.join(gamesDir, `${platform}.json`);
  const manifestPath = path.join(gamesDir, `${platform}-manifest.json`);
  const games = readJson(dataPath);
  if (!Array.isArray(games)) continue;

  let updated = 0;
  const samples = [];
  for (const game of games) {
    if (hasUsefulOverview(game)) continue;
    const overview = makeOverview(game);
    if (overview.length < 160) continue;
    if (samples.length < 3) samples.push({ title: game.title || game.name || "", overview });
    if (!dryRun) {
      game.description = overview;
      game.descriptionProvider = "GCX metadata editorial overview";
      game.descriptionSourceUrl = "";
      game.overviewStatus = "published";
      game.healthUpdatedAt = new Date().toISOString();
      game.searchText = normalize([game.searchText, overview].join(" "));
    }
    updated += 1;
  }

  const manifest = readJson(manifestPath, {});
  if (!dryRun && updated) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      metadataEditorialOverviewGeneratedAt: new Date().toISOString(),
      metadataEditorialOverviewCount: (manifest.metadataEditorialOverviewCount || 0) + updated,
      overviewStatusCounts: statusCounts(games),
    });
  }

  totalUpdated += updated;
  const published = (statusCounts(games).published || 0) + (dryRun ? updated : 0);
  results.push({ platform, total: games.length, updated, published, samples });
}

console.table(results.filter((row) => row.updated));
if (sample) {
  results
    .filter((row) => row.samples.length)
    .forEach((row) => {
      console.log(`\n${row.platform} samples:`);
      row.samples.forEach((item) => {
        console.log(`- ${item.title}: ${item.overview}`);
      });
    });
}
console.log(`${dryRun ? "Would generate" : "Generated"} ${totalUpdated} metadata editorial overviews.`);
