const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-london-love-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-london-racer-ii",
    sourceUrl: "https://kotaku.com/games/london-racer-ii",
    overview:
      "London Racer II is a PAL-region Davilex arcade racer built around the studio's location-themed Racer formula rather than licensed motorsport. Its single-player structure includes quick races, tournaments, and time trials, with players choosing drivers, cars, and tracks while racing opponents and avoiding police pressure. GCX should frame it as a budget European street-racing curio whose interest comes from Davilex's regional Racer brand and early-2000s PS2 import shelf.",
  },
  {
    id: "ps2-london-racer-destruction-madness",
    sourceUrl: "https://nl.wikipedia.org/wiki/London_Racer:_Destruction_Madness",
    overview:
      "London Racer: Destruction Madness pushes Davilex's city-racing series toward demolition-style arcade driving instead of straightforward lap racing. The 2005 PS2 and Windows release uses fictionalized cars, destructive competition, and arena-racing spectacle to distinguish itself from earlier London Racer entries. GCX should present it as a late Davilex budget racer for PAL collectors, with the hook being its crash-heavy spin on the company's familiar European street-racing template.",
  },
  {
    id: "ps2-london-racer-police-madness",
    sourceUrl: "https://www.mobygames.com/game/35961/london-racer-police-madness/",
    overview:
      "London Racer: Police Madness flips the series' usual outlaw-racer perspective by putting the player in a police role. The loop centers on pursuing illegal racers and traffic offenders, scanning or identifying targets, and using chase tools during fast arcade driving rather than simply finishing ahead of rivals. GCX should call it a pursuit-racing offshoot from Davilex's Racer line, valuable mainly for PAL collectors tracking the studio's final PS2 output.",
  },
  {
    id: "ps2-london-racer-world-challenge",
    sourceUrl: "https://www.teamvvv.com/games/london-racer-world-challenge/",
    overview:
      "London Racer: World Challenge takes Davilex's budget racing formula beyond London into a broader international road-trip structure. Listings and contemporary catalog copy position it as a PC and PS2 arcade racer with tracks across Europe and the United States, more than a strict city-course sequel. GCX should describe it as the globe-trotting branch of the London Racer line, where regional identity, PAL availability, and Davilex's publisher history matter more than sim-level handling.",
  },
  {
    id: "ps2-lost-aya-sophia",
    sourceUrl: "https://en.wikipedia.org/wiki/Idea_Factory",
    overview:
      "Lost Aya Sophia is a 2004 Japan-only PlayStation 2 adventure from Idea Factory, released during the publisher's busy early-PS2 period alongside Spectral, Generation of Chaos, and other niche imports. It is best treated as a story-led Japanese adventure entry rather than the generic exploration game the old GCX copy implied. For collectors, the important context is its NTSC-J exclusivity, Idea Factory provenance, and place among the company's less-localized PS2 catalog.",
  },
  {
    id: "ps2-lost-passage-ushinawareta-hitofushi",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65389.html",
    overview:
      "Lost Passage: Ushinawareta Hitofushi is a Japan-only PrincessSoft adventure set in Kyoto, built around text conversations, static scene presentation, multiple choices, and multiple endings. The story follows university student Akira Misaki returning home for teaching practice and reconnecting with girls from his past as a larger drama begins to unfold. GCX should classify it as a romance-adventure visual novel, not as a strategy game.",
  },
  {
    id: "ps2-love-doll-lovely-idol",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65969.html",
    overview:
      "Love Doll: Lovely Idol adapts the Lovedol idol franchise into a PlayStation 2 visual novel and raising-sim hybrid. The player takes the role of manager Tomohiro, setting schedules, helping the idol girls improve their skills, listening to their problems, and building relationships through dates and conversations. GCX should present it as an idol-management romance import from PrincessSoft, with appeal for collectors of anime-adjacent PS2 visual novels.",
  },
  {
    id: "ps2-love-drops",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66727.html",
    overview:
      "Love Drops is the PlayStation 2 version of Love Drops: Miracle Doukyo Monogatari, reworked from its PC origins with adult material removed, a new character, additional scenes, and new CG. The premise mixes romance with fantasy comedy as the heroine becomes involved with sealed supernatural beings, a self-styled exorcist, and familiar friends around her daily life. GCX should frame it as an otome-leaning romance visual novel import, not a generic story game.",
  },
  {
    id: "ps2-love-hina-gorgeous-chiratto-happening",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65292.html",
    overview:
      "Love Hina Gorgeous: Chiratto Happening!! is Konami's PlayStation 2 adaptation of Ken Akamatsu's Love Hina, built for fans of the manga and anime rather than action players. The game mixes character interaction, multiple-choice exams, and mini-games as Keitaro tries to move closer to his Tokyo University goal while the Hinata Inn cast disrupts his routine. GCX should position it as a licensed anime adventure where scenarios, character events, and fan-service structure are the core appeal.",
  },
  {
    id: "ps2-love-songs-adv-futaba-riho-14-sai-natsu",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65698.html",
    overview:
      "Love Songs: ADV Futaba Riho 14-sai Natsu is a summer-themed D3 Publisher relationship simulation starring Riho Futaba, the recurring Simple Series idol character. Play centers on multiple-choice conversations and 2D character artwork, with a moving camera presentation that lets the player observe Riho during scenes. GCX should describe it as a focused character-date visual novel for D3 and Simple Series collectors, not a broad idol-management game.",
  },
  {
    id: "ps2-love-songs-adv-futaba-riho-19-sai-fuyu",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65738.html",
    overview:
      "Love Songs: ADV Futaba Riho 19-sai Fuyu is the winter follow-up to D3's Natsu entry, again centered on one-on-one interaction with Riho Futaba. The sequel keeps the relationship-simulation format but shifts the mood and seasonal framing, using conversation choices and character scenes rather than action or rhythm play. GCX should highlight it as part of Riho Futaba's unusual cross-game presence in D3's budget-era catalog.",
  },
  {
    id: "ps2-love-songs-idol-ga-classmate",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65017.html",
    overview:
      "Love Songs: Idol ga Classmate is the 2001 HuneX and D3 Publisher dating-simulation adventure that introduced Riho Futaba. The player is a new student at Akimitsu School, a campus known for idols, and uses the Emotional Talk System to choose controller-linked conversational responses. GCX should treat it as the starting point for Riho's broader Simple Series identity and a school-idol romance game built around dialogue systems rather than performance scoring.",
  },
  {
    id: "ps2-love-com-punch-de-court",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66470.html",
    overview:
      "Love*Com: Punch de Court is an AQ Interactive visual novel based on the Lovely Complex manga, released only in Japan for PlayStation 2. It recreates the original romantic-comedy story while adding original scenarios, different endings, and a Noriboke-tsukkomi style interaction system that can change how scenes play out. GCX should present it as a licensed manga romance adventure, useful for readers and anime fans tracking PS2-only adaptations.",
  },
  {
    id: "ps2-love-mahjong",
    sourceUrl: "https://www.huneX.co.jp/love-mahjong/",
    overview:
      "Love*Mahjong is Simple 2000 Series Ultimate Vol. 5, a HuneX and D3 Publisher mahjong release that blends Japanese table play with character-focused presentation. It is not a puzzle game in the Western match-three sense: the draw is riichi mahjong rules, short matches, and the budget Simple Series framing around anime-style opponents. GCX should classify it as a mahjong/card-and-board import and connect it to HuneX's wider D3 catalog.",
  },
  {
    id: "ps2-love-mahjong-2",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-62542.html",
    overview:
      "Love*Mahjong 2, published as Simple 2000 Ultimate Vol. 20, continues the D3 and HuneX mahjong formula with story progression, unlockable costumes, picture galleries, and outdoor island locations. Players face different opponents across areas such as prehistoric ruins, an open bath, and a port while playing traditional mahjong rather than solving block puzzles. GCX should call it a niche Japanese mahjong import with character-collection hooks.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on platform database, product, specialist database, and official/reference sources.",
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
