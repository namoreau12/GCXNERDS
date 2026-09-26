const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-overview-markup-cleanup.json");

const replacements = {
  "ds-mario-and-sonic-at-the-olympic-winter-games":
    "Mario & Sonic at the Olympic Winter Games brings Nintendo and Sega mascots together for a winter-sports party game built around events from the Vancouver Olympics. The DS version emphasizes stylus-friendly events, character matchups, and short competitive challenges suited to local multiplayer and handheld sessions.",
  "ds-pokemon-conquest":
    "Pokemon Conquest is a Nintendo DS strategy RPG crossover between Pokemon and Koei's Nobunaga's Ambition series. Players recruit warriors, bond them with Pokemon, and fight grid-based tactical battles across a feudal-inspired region, making it one of the more unusual Pokemon spin-offs for collectors.",
  "ds-tomodachi-collection":
    "Tomodachi Collection is a Nintendo DS life-simulation game built around Mii characters living together, forming relationships, and creating odd little social stories. It is the Japan-only predecessor to Tomodachi Life, so its value comes from Nintendo curiosity, import appeal, and personality-driven simulation play.",
  "gbc-chou-gals-kotobuki-ran-2-miracle-getting":
    "Chou Gals! Kotobuki Ran 2: Miracle Getting is a Japan-only Game Boy Color release based on the Super GALS! manga and anime. It is mainly of interest as a licensed character game, with collector appeal tied to its Konami publishing history, Japanese packaging, and connection to early-2000s shojo media.",
  "genesis-atomic-robo-kid":
    "Atomic Robo-Kid is a side-scrolling shooter starring a small armored robot fighting through dense enemy formations and maze-like stages. The Genesis version adapts UPL's arcade game for home play, making it a notable pick for collectors who track obscure shooter ports and Treco-published releases.",
  "genesis-thunder-fox":
    "Thunder Fox is a Taito action game about commandos fighting through side-scrolling stages with firearms, melee attacks, vehicles, and arcade-style set pieces. The Genesis version brings the arcade game home with a focus on quick action, enemy waves, and two-player brawler-shooter appeal.",
  "n64-derby-stallion-64":
    "Derby Stallion 64 is a Nintendo 64 horse-racing management simulation focused on owning, breeding, training, and racing thoroughbreds. It is a Japan-focused release with appeal for collectors interested in sports management games and N64 titles outside the usual action-adventure catalog.",
  "n64-flying-dragon":
    "Flying Dragon is a Nintendo 64 fighting game from Culture Brain that mixes martial-arts combat with a fantasy tournament presentation. The game is remembered for its split between approachable character action and more technical fighting systems, giving it a distinct identity among N64 fighters.",
  "ps1-super-gals-kotobuki-ran-special-coolmen-get-you-gals-party":
    "Super GALS! Kotobuki Ran Special: Coolmen Get You Gals Party is a PlayStation release tied to the Super GALS! manga and anime franchise. Its collector interest comes from its licensed Konami publishing history, Japan-only identity, and connection to character-driven party and adventure-style play.",
  "ps2-warriors-orochi-2":
    "Warriors Orochi 2 is a crossover Musou action game that brings together characters from Dynasty Warriors and Samurai Warriors. Players cut through huge enemy groups, build teams of three officers, and unlock a sprawling roster, making the PS2 version a late-era action entry with strong franchise-collector appeal.",
  "ps2-zero-no-tsukaima-muma-ga-tsumugu-yokaze-no-nocturne":
    "Zero no Tsukaima: Muma ga Tsumugu Yokaze no Nocturne is a PlayStation 2 visual novel based on The Familiar of Zero light-novel and anime series. Players follow Saito and the cast through a character-focused story, making it most relevant for import collectors and fans of licensed Japanese adventure releases.",
  "ps3-valkyria-chronicles":
    "Valkyria Chronicles is a tactical role-playing game from Sega that blends turn-based squad commands with direct battlefield movement and aiming. Set in a stylized alternate-history war, it stands out on PlayStation 3 for its painterly presentation, character-driven campaign, and distinctive BLiTZ combat system.",
  "ps4-arcade-archives-atomic-robo-kid":
    "Arcade Archives: Atomic Robo-Kid preserves UPL's shooter for modern PlayStation 4 players through Hamster's arcade reissue line. It is less about a remake and more about convenient access to the original game's stage layouts, scoring rhythm, and offbeat robotic shooter style.",
  "psp-warriors-orochi-2":
    "Warriors Orochi 2 on PSP adapts Koei's Dynasty Warriors and Samurai Warriors crossover for handheld play. It keeps the core appeal of team-based officer swapping, large rosters, and crowd-clearing action while giving collectors a portable version of a major Musou spin-off.",
  "saturn-cyber-doll":
    "Cyber Doll is a Sega Saturn role-playing game with a cyberpunk setting, turn-based combat, and a darker sci-fi tone than many console RPGs of its era. Its collector appeal is strongest among import-focused Saturn fans because it remained a Japanese release and carries a distinctive mid-1990s aesthetic.",
  "snes-goof-troop":
    "Goof Troop is a Capcom action-adventure game for the Super Nintendo built around cooperative puzzle solving, item use, and light combat. Based on the Disney animated series, it is especially remembered as an approachable two-player adventure with clean design and strong licensed-game charm.",
  "snes-lodoss-tou-senki-record-of-lodoss-war":
    "Lodoss Tou Senki: Record of Lodoss War is a Super Famicom RPG based on the Record of Lodoss War fantasy franchise. It appeals to import collectors and RPG fans interested in licensed Japanese fantasy games, party progression, and adaptations of tabletop-inspired worlds.",
  "snes-popeye-ijiwaru-majo-seahag-no-maki":
    "Popeye: Ijiwaru Majo Seahag no Maki is a Super Famicom game based on the Popeye franchise, sending Popeye through a side-scrolling adventure against Sea Hag. Its collector interest comes from its licensed character history, Japan-only Super Famicom release, and Technos Japan connection.",
  "snes-tetsuwan-atom":
    "Tetsuwan Atom is a Super Famicom action game based on Osamu Tezuka's Astro Boy character, known in Japan as Mighty Atom. The game is mainly notable for licensed-anime collecting, its 1994 Japanese release, and its place among Super Famicom character-action titles.",
  "vita-mind-zero":
    "Mind Zero is a PlayStation Vita dungeon crawler about students who summon weapon-like partners called MINDs while exploring supernatural spaces. It blends first-person dungeon navigation, turn-based battles, and visual-novel-style story scenes, making it a niche but recognizable Vita RPG.",
  "vita-wagamama-high-spec":
    "Wagamama High Spec is a PlayStation Vita visual novel adapted from Madosoft's romance-comedy game and related media. The Vita release is aimed at fans of character-driven Japanese visual novels, with collector interest tied to its import status, genre, and iMel publishing history.",
  "wii-mario-and-sonic-at-the-olympic-winter-games":
    "Mario & Sonic at the Olympic Winter Games turns the Vancouver Winter Olympics into a party-sports game starring Nintendo and Sega characters. The Wii version leans into motion controls, family multiplayer, and recognizable events such as skiing, skating, snowboarding, and fantasy Dream Events.",
  "xbox360-warriors-orochi-2":
    "Warriors Orochi 2 on Xbox 360 is a crossover hack-and-slash action game combining Dynasty Warriors and Samurai Warriors characters. Its appeal comes from fast crowd-clearing combat, a large roster of officers, team-swapping systems, and a collector-friendly physical release from Koei.",
};

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function hasMarkup(value) {
  return /\{\{|\}\}|<\/ref>|\[\[|\]\]|\|title=|\|url=|'''|"\}\}|literal translation<\/span>/i.test(String(value || ""));
}

function main() {
  const changed = [];
  const unresolved = [];
  const files = fs.readdirSync(gamesDir).filter((file) => file.endsWith(".json") && !file.includes("manifest"));

  files.forEach((file) => {
    const filePath = path.join(gamesDir, file);
    const games = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(games)) return;
    let touched = false;

    games.forEach((game) => {
      const overview = game.description || game.gcxOverview || game.overview || "";
      if (!hasMarkup(overview)) return;
      const replacement = replacements[game.id];
      if (!replacement) {
        unresolved.push({ file, id: game.id, title: game.title });
        return;
      }
      game.description = replacement;
      game.gcxOverview = replacement;
      game.overview = replacement;
      game.descriptionProvider = "GCX markup cleanup editorial overview";
      game.overviewProvider = "GCX markup cleanup editorial overview";
      game.overviewStatus = "published";
      game.overviewReviewStatus = "reviewed";
      game.overviewReviewer = "GCX cleanup pass";
      game.overviewRewriteNotes = "Replaced malformed wiki/template scrape text with concise GCX editorial overview.";
      game.descriptionSourceUrl = game.articleUrl || game.descriptionSourceUrl || "";
      game.overviewUpdatedAt = new Date().toISOString();
      touched = true;
      changed.push({ file, id: game.id, title: game.title });
    });

    if (touched) writeJson(filePath, games);
  });

  const report = {
    ok: unresolved.length === 0,
    generatedAt: new Date().toISOString(),
    changedCount: changed.length,
    unresolvedCount: unresolved.length,
    changed,
    unresolved,
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
