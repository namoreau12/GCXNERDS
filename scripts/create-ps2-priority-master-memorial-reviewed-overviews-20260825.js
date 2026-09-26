const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-master-memorial-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority PS2 weak-template cleanup; original GCX editorial overview based on platform databases, specialist game databases, publisher/developer pages, and series/gameplay context.";

const entries = [
  {
    id: "ps2-master-chess",
    sourceUrl: "https://www.honestgamers.com/44275/playstation-2/master-chess/game.html",
    overview:
      "Master Chess is the European name for D3 Publisher and Yuki's Simple 2000 Honkaku Shikou Series Vol. 3: The Chess. It is a straight digital chess release, built around board play rather than story progression, arcade action, or puzzle gimmicks. GCX should frame it as budget table-game software for PS2 collectors, notable for its 505 Game Street European release and its connection to D3's low-price Simple line.",
  },
  {
    id: "ps2-master-rallye",
    sourceUrl: "https://www.mobygames.com/game/5512/master-rallye/",
    overview:
      "Master Rallye is Microids and Steel Monkeys' off-road rally racer built around a long-distance Paris-to-Moscow endurance fantasy. Instead of RPG progression, its identity is multi-country rally racing, rough terrain, vehicle handling, and stage-to-stage event structure inspired by European and Asian endurance races. GCX should present it as an early-PS2 rally title for off-road racing fans, with the Microids/Steel Monkeys credit being the collector identifier.",
  },
  {
    id: "ps2-matantei-loki-ragnarok-mayoukaku",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66141.html",
    overview:
      "Matantei Loki Ragnarok Mayoukaku adapts Sakura Kinoshita's Mythical Detective Loki Ragnarok into a Japan-only PS2 adventure from Taito. The premise follows Loki, exiled to the human world in child form, using a paranormal detective agency to investigate cases and collect evil auras tied to human hearts. GCX should describe it as a licensed anime/manga mystery adventure where location investigation and character clues matter more than action mechanics.",
  },
  {
    id: "ps2-mawaza",
    sourceUrl: "https://ssl.media-vision.co.jp/soft/mawaza.php",
    overview:
      "Mawaza is Media.Vision and Sony Computer Entertainment Japan's action-puzzle game about connecting points into shapes, rotating those shapes, and smashing them into targets. The developer describes it as a game of thinking with points and lines, and that puzzle hook is the whole pitch: build, spin, collide, and clear. GCX should present Mawaza as a Japan-only Sony-published puzzle/action oddity, not a generic action title.",
  },
  {
    id: "ps2-maxxed-out-racing",
    sourceUrl: "https://www.honestgamers.com/45355/playstation-2/maxxed-out-racing/game.html",
    overview:
      "MaXXed Out Racing is the PAL localization of D3 Publisher and Tamsoft's Simple 2000 Series Ultimate Vol. 3: Saisoku! Zokusha King. It is a budget street-racing game focused on modified-car culture, arcade handling, event progression, and performance upgrades rather than licensed motorsport. GCX should make the Simple-series origin clear so collectors understand why the same game appears under different Japanese and European branding.",
  },
  {
    id: "ps2-maxxed-out-racing-nitro",
    sourceUrl: "https://www.honestgamers.com/45356/playstation-2/maxxed-out-racing-nitro/game.html",
    overview:
      "Maxxed Out Racing: Nitro is the European release of Simple 2000 Ultimate Vol. 30: Kourin! Zokusha God, another D3/Tamsoft budget street-racing entry. It follows the tuner-racing angle of MaXXed Out Racing with a later release, more aggressive underground-car branding, and a focus on arcade road events rather than realistic rally or circuit simulation. GCX should list it as a distinct sequel/companion, not as a duplicate of the first MaXXed Out Racing.",
  },
  {
    id: "ps2-maze-action",
    sourceUrl: "https://www.mobygames.com/game/112279/maze-action/",
    overview:
      "Maze Action is D3 Publisher's third-person maze-action PS2 release, localized in Europe by Agetec from the Simple 2000 catalog. The important hook is spatial navigation: players move through maze-like environments, handle hazards and enemies, and clear compact stages rather than follow a long adventure campaign. GCX should position it as a budget Simple-series action maze game, useful for collectors tracking D3's many localized PS2 oddities.",
  },
  {
    id: "ps2-mcfarlane-s-evil-prophecy",
    sourceUrl: "https://en.wikipedia.org/wiki/McFarlane%27s_Evil_Prophecy",
    overview:
      "McFarlane's Evil Prophecy is Konami Computer Entertainment Hawaii's action game built around Todd McFarlane's monster-hunter and creature designs. Players fight classic horror-inspired enemies such as Dracula, Frankenstein's monster, the werewolf, the mummy, and other figures in combat often compared to a small-scale Dynasty Warriors-style brawler. GCX should describe it as a licensed McFarlane action-figure horror brawler, with its art gallery and Todd McFarlane interview bonuses being part of the package.",
  },
  {
    id: "ps2-medical-91",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25526.html",
    overview:
      "Medical 91 is Takuyo's near-future science-fiction visual novel set around Arion Medical Center. Players follow Yuna, an apprentice nurse/android in a society where robots having emotions is forbidden, making choices and moving around the hospital to trigger conversations that branch the story. GCX should describe it as a hospital-set SF adventure/visual novel with light exploration, not a standard romance VN or generic medical quiz game.",
  },
  {
    id: "ps2-medical-and-engineering-joint-entrance-quiz",
    sourceUrl: "https://www.pricecharting.com/game/pal-playstation-2/medical-and-engineering-joint-entrance-quiz",
    overview:
      "Medical and Engineering Joint Entrance Quiz is a PAL PlayStation 2 educational trivia release from Candela Software and Sony Computer Entertainment Europe. Its subject matter is exam-style practice for medical and engineering entrance knowledge, with quiz/test structure rather than adventure, strategy, or puzzle-action play. GCX should frame it as a rare late-PS2 educational title for collectors, especially because its 2009 PAL release sits unusually late in the console's life.",
  },
  {
    id: "ps2-meine-liebe-ii-hokori-to-seigi-to-ai",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66667.html",
    overview:
      "Meine Liebe II: Hokori to Seigi to Ai is Konami and Tenky's PS2 sequel in the Meine Liebe dating-sim line. The series follows elite students at Rosenstolz Academy in the fictional European country of Kuchen, with political intrigue, noble candidates, and romantic/character routes replacing ordinary school-life dating sim stakes. GCX should present it as a historical-fantasy otome/dating-sim sequel tied to the anime and manga adaptations, not as a generic visual novel.",
  },
  {
    id: "ps2-meine-liebe-yubinaru-kioku",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66076.html",
    overview:
      "Meine Liebe: Yubinaru Kioku is the PlayStation 2 entry that brought Konami's Meine Liebe dating-sim world from Game Boy Advance into a larger console presentation. Set at Rosenstolz Academy in 1937 Kuchen, it centers on relationships with the Strahl candidates, young nobles being prepared for advisory roles near the royal court. GCX should describe it as a character-route dating sim with historical-fantasy court politics, rather than flattening it into generic romance copy.",
  },
  {
    id: "ps2-meitantei-conan-daiei-teikoku-no-isan",
    sourceUrl: "https://www.detectiveconanworld.com/wiki/Detective_Conan%3A_Legacy_of_the_British_Empire",
    overview:
      "Meitantei Conan: Daiei Teikoku no Isan, also known as Detective Conan: Legacy of the British Empire, is Bandai's Japan-only PS2 mystery adventure. Conan, Ran, and Kogoro investigate a hidden legacy at a half-submerged mansion, only for a murder and destroyed bridge to turn the visit into an isolated-case investigation. GCX should highlight the 3D mansion exploration, clue gathering, and dialogue-based deduction loop that make it a real Detective Conan adventure.",
  },
  {
    id: "ps2-meitantei-evangelion",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/128848-meitantei-evangelion",
    overview:
      "Meitantei Evangelion, often rendered as Detective Evangelion, is a Broccoli and Headlock PS2 adventure/strategy spinoff that reimagines Shinji Ikari as a detective working with Nerv. Instead of retelling the anime's core mecha battles, it sends Shinji through a murder-investigation premise with Evangelion characters and science-fiction conspiracy flavor. GCX should present it as a Japan-only Evangelion detective spinoff, valuable because its genre shift is the point.",
  },
  {
    id: "ps2-memorial-song",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25144.html",
    overview:
      "Memorial Song is Datam Polystar's romance adventure/visual novel about how songs can unlock and tie together memories of past relationships. The player-named high-school protagonist meets multiple heroines, with the story framed through remembered events and the emotional associations of music. GCX should describe it as a music-tinged romance VN from the Datam Polystar catalog, not as a broad adventure game with no clear hook.",
  },
];

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const missing = entries.filter((entry) => !byId.has(entry.id));
  if (missing.length) {
    throw new Error(`Missing PS2 games: ${missing.map((entry) => entry.id).join(", ")}`);
  }

  const rows = [
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "ps2",
        entry.id,
        game.title || game.name || "",
        game.description || game.gcxOverview || game.overview || "",
        entry.sourceUrl,
        rewriteNotes,
        entry.overview,
        "reviewed",
        "GCX editorial cleanup",
      ];
    }),
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(`Wrote ${entries.length} reviewed PS2 overviews to ${path.relative(rootDir, outputPath)}`);
}

main();
