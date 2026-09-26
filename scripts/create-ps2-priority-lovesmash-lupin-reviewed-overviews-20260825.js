const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-lovesmash-lupin-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-love-smash-5",
    sourceUrl: "https://raido.moe/gamelibrary/ps2/lovesmash5.htm",
    overview:
      "Love*Smash! 5 is the fuller-priced sequel branch of HuneX and D3 Publisher's Love*Smash tennis line, following the Simple 2000 Ultimate original. It keeps the series' all-female tennis focus, outlandish courts, and anime-style character presentation, while framing the action around an eccentric story about a tennis-playing robot. GCX should classify it as a Japanese arcade-tennis import, not a visual novel.",
  },
  {
    id: "ps2-love-smash-5-1-tennis-robo-no-hanran",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/166615-simple-2000-series-ultimate-vol-26-love-smash-51-tennis-robo-no-hanran",
    overview:
      "Love*Smash! 5.1: Tennis Robo no Hanran is Simple 2000 Series Ultimate Vol. 26, a later budget-priced version of HuneX and D3 Publisher's anime-styled tennis series. The game returns to character tennis with the Tennis Robo premise, positioning it as a quirky sports release for import collectors rather than a serious simulation. GCX should treat it as the budget reissue/variant companion to Love*Smash! 5.",
  },
  {
    id: "ps2-love-smash-super-tennis-players",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/397510-simple-2000-series-ultimate-vol-1-lovesmash-super-tennis-players",
    overview:
      "Love*Smash! Super Tennis Players is Simple 2000 Series Ultimate Vol. 1, a one-to-four-player tennis game from HuneX and D3 Publisher. Tournament and Exhibition modes support singles and doubles play, while the story setup has eight elite players gathered by a secret underground society to compete for fame and fortune. GCX should present it as the first Love*Smash budget tennis entry, with hidden characters, unlockable costumes, and unusual courts as the hooks.",
  },
  {
    id: "ps2-love-songs",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65352.html",
    overview:
      "Love*Songs is Simple 2000 Ultimate Vol. 10, the budget reissue of HuneX and D3 Publisher's Love Songs: Idol ga Classmate. The game is a dating-simulation adventure set at Akimitsu School, where Japanese idols are part of campus life, and it uses an Emotional Talk System for controller-based conversational responses. GCX should link it to Riho Futaba's first appearance and avoid treating it as a generic visual novel.",
  },
  {
    id: "ps2-loveroot-zero-kiss-kiss-labyrinth",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-55149.html",
    overview:
      "Loveroot Zero: Kiss Kiss * Labyrinth is a Dimple Entertainment adventure/visual novel built around a fantasy maze of rejected feelings. After the protagonist turns down a classmate's confession, she is transported with classmates into a labyrinth where failed love gathers and must confront Zero, the monster of rejected love. GCX should present it as a late PS2 romance-fantasy import with RPG/adventure flavor, not a plain route-based school novel.",
  },
  {
    id: "ps2-lucian-bee-s-evil-violet",
    sourceUrl: "https://game.mages.co.jp/product/295/",
    overview:
      "Lucian Bee's: Evil Violet is a 2010 PS2 fan disc expanding the Lucian Bee's otome setting after Resurrection Supernova. MAGES describes it as focusing on dangerous romance with Honeybuzzard VI, the rival group from the original story, as Anna infiltrates a Royal Academy tied to the secret organization Darsign. GCX should describe it as a companion fan-disc route expansion from 5pb and HuneX rather than a standalone general visual novel.",
  },
  {
    id: "ps2-lucian-bee-s-justice-yellow",
    sourceUrl: "https://ja.wikipedia.org/wiki/Lucian_Bee%27s_RESURRECTION_SUPERNOVA",
    overview:
      "Lucian Bee's: Justice Yellow is the other 2010 PS2 fan disc connected to Lucian Bee's: Resurrection Supernova. It belongs to the same 5pb and HuneX otome project as Evil Violet, extending the original game's secret-agent makeover premise with additional character scenarios instead of retelling the full main plot. GCX should present it as a fan-disc expansion for series followers and import visual-novel collectors.",
  },
  {
    id: "ps2-lucian-bee-s-resurrection-supernova",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-55194.html",
    overview:
      "Lucian Bee's: Resurrection Supernova is the main 5pb and HuneX otome adventure built around a secret organization whose mission is to turn uncool men into stylish, desirable partners. High-school student Anna is recruited into Lucian Bee's and assigned to reform the international boy band Romanxia, whose six members each have distinct personality and nationality hooks. GCX should foreground that makeover-agent premise because it is the series' defining identity.",
  },
  {
    id: "ps2-lucky-star-ryouou-gakuen-outousai",
    sourceUrl: "https://kotaku.com/games/lucky-star-ryouou-gakuen-outousai",
    overview:
      "Lucky*Star: Ryouou Gakuen Outousai is a romantic-comedy visual novel based on the Lucky Star manga and anime cast. The game uses the familiar school-life characters and parodic humor of the franchise while building a PS2-exclusive story around Ryouou Gakuen and festival-style scenarios. GCX should frame it as a licensed anime comedy adventure for fans, not as a general exploration game.",
  },
  {
    id: "ps2-lulurara-vol-1",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28L%E2%80%93Z%29",
    overview:
      "LuluRara vol.1 is a Japan-only Sony Computer Entertainment and Studio9 PlayStation 2 release from Sony's smaller experimental catalog. The available catalog record identifies it as the first volume in a two-part PS2 line rather than a conventional boxed action game, so GCX should keep the description careful: a niche Sony-published music/lifestyle-style import whose main collector value is title identification, publisher credit, and volume placement.",
  },
  {
    id: "ps2-lulurara-vol-2",
    sourceUrl: "https://wiki.pcsx2.net/LuluRara_vol.2:_Powered_by_Ziller.net",
    overview:
      "LuluRara vol.2: Powered by Ziller.net is the second Studio9 and Sony Computer Entertainment entry in the LuluRara PS2 line. Compatibility records note EyeToy and microphone support plus local play for up to two players, which makes it closer to a camera/microphone-supported entertainment release than a management sim. GCX should identify it as a peripheral-aware Japanese import and direct sequel volume.",
  },
  {
    id: "ps2-lunatic-dawn-tempest",
    sourceUrl: "https://www.vgchartz.com/game/3683/lunatic-dawn-tempest/",
    overview:
      "Lunatic Dawn Tempest is Artdink's 2001 PlayStation 2 entry in the long-running Lunatic Dawn RPG line. It keeps the series' identity around Japanese PC-style fantasy role-playing and open-ended adventuring more than cinematic console-RPG spectacle. GCX should position it as an Artdink role-playing import for players curious about Japan's non-linear CRPG tradition, rather than a generic party-growth game.",
  },
  {
    id: "ps2-lupin-sansei-columbus-no-isan-wa-akenisomaru",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25430.html",
    overview:
      "Lupin Sansei: Columbus no Isan wa Akenisomaru is a 2004 Japan-only Lupin III action-adventure from Nex Entertainment and Banpresto. Players primarily control Lupin but can also use Jigen and Goemon in certain episodes, moving through 3D areas with stealth, disguise tricks, slap-fighting, and character-specific set pieces. GCX should describe it as the second Lupin PS2 adventure, with varied locations and improved enemy behavior over the earlier formula.",
  },
  {
    id: "ps2-lupin-sansei-lupin-ni-wa-shi-o-zenigata-ni-wa-koi-o",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25740.html",
    overview:
      "Lupin Sansei: Lupin ni wa Shi o, Zenigata ni wa Koi o is the third and final PS2 Lupin III adventure from Nex Entertainment and Banpresto. It reduces the stealth emphasis compared with earlier Lupin PS2 titles but still lets players use disguises, gather information, and control Jigen, Goemon, and Fujiko at points, each with different play styles. GCX should frame it as a late-series PS2 anime action-adventure with dual Lupin and Zenigata story focus.",
  },
  {
    id: "ps2-lupin-the-3rd-treasure-of-the-sorcerer-king",
    sourceUrl: "https://en.wikipedia.org/wiki/Lupin_the_3rd:_Treasure_of_the_Sorcerer_King",
    overview:
      "Lupin the 3rd: Treasure of the Sorcerer King is Banpresto's 2002 PS2 stealth-action adventure and the Lupin III game that reached North America. It follows an original story about antique pitchers, King Randolph II's treasure, and the city of Goldengasse, with third-person stealth, disguises, and occasional playable Jigen and Goemon sections. GCX should highlight its franchise-faithful presentation, Yuji Ohno music connection, and clunky-but-distinct stealth identity.",
  },
];

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = [
    [
      "platformSlug",
      "gameId",
      "title",
      "currentOverview",
      "sourceUrl",
      "rewriteNotes",
      "newOverview",
      "reviewStatus",
      "reviewer",
    ],
  ];

  rewrites.forEach((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing PS2 game ${rewrite.id}`);
    rows.push([
      "ps2",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on platform database, publisher, product, specialist database, and series sources.",
      rewrite.overview,
      "reviewed",
      "GCX editorial cleanup",
    ]);
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ outputPath: path.relative(rootDir, outputPath), rows: rewrites.length }, null, 2));
}

main();
