const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-meru-mighty-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-meru-purana",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00359.html",
    overview:
      "Meru Purana is a Japan-only Gust release that blends strategy-RPG structure with party-management decisions. Players guide a traveling group, choose battle-party members, decide available actions, and issue commands during combat instead of simply following a linear menu RPG. GCX should position it as an early Gust tactical fantasy import, especially interesting for collectors who know the studio mainly through Atelier.",
  },
  {
    id: "ps1-meta-ph-list-gamma-x-2097",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00680.html",
    overview:
      "Meta-Ph-List: Gamma X 2097 is not a puzzle game; it is an eccentric vertical shooter from ADM. The setup sends a pilot against an alien army that has occupied planets in the year 2097, with English voice work layered into a Japanese PlayStation import. GCX should describe it as a rare, experimental PS1 shooter whose appeal comes from its odd presentation, sci-fi framing, and small-publisher obscurity.",
  },
  {
    id: "ps1-metal-angel-3",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00867.html",
    overview:
      "Metal Angel 3 is a management-heavy futuristic sports strategy game from Victor Interactive Software. Set in 2038, it puts the player in charge of a female team that competes using mechanical armor, with weekly training, character conversations, stat growth, armor upgrades, and tactical choices shaping performance. GCX should present it as a simulation-strategy import and the final Metal Angel entry, not a conventional tactics battlefield game.",
  },
  {
    id: "ps1-metamoru-panic-doki-doki-youma-busters",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00039.html",
    overview:
      "Metamoru Panic: Doki Doki Youma Busters!! is a Fill-in-Cafe adventure with RPG combat sequences and visual-novel-style progression. The story follows three friends whose cave trip leads to a demon encounter, transformations, and supernatural trouble, while play alternates between scene investigation, choices, and turn-based yokai battles. GCX should classify it as an adventure/RPG hybrid from Family Soft's early PlayStation catalog.",
  },
  {
    id: "ps1-mezase-airline-pilot",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-02198.html",
    overview:
      "Mezase! Airline Pilot is a civilian flight-training simulation tied to Skymark, built around learning the cockpit rather than arcade dogfighting. The game emphasizes captain-training scenarios, radio-style calls, co-pilot guidance, instructor voices, and a simplified easy mode for less technical players. GCX should frame it as a niche Japanese aviation sim for collectors interested in practical-job simulations on the original PlayStation.",
  },
  {
    id: "ps1-mezase-meimon-yakyubu",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01911.html",
    overview:
      "Mezase! Meimon Yakyubu is a Japanese high-school baseball management simulation with cartoon presentation and a full 3D match engine. Players choose a region and school, train a high-school team, set weekly practice, manage tactics, and make decisions during games rather than directly playing every pitch like an arcade baseball title. GCX should place it with deep Japanese sports-management imports, not generic action sports releases.",
  },
  {
    id: "ps1-mezase-senkyuu-ou",
    sourceUrl: "https://en.wikipedia.org/wiki/Senkyu",
    overview:
      "Mezase! Senkyuu Ou is the PlayStation version of Seibu Kaihatsu's arcade puzzle game Senkyu, also known internationally as Battle Balls. The core play revolves around falling groups of three colored balls that can be rotated as they descend, creating a competitive puzzle rhythm distinct from standard block stacking. GCX should identify it as a Japanese home version of an arcade puzzler, with extra collector interest because the PS1 release was limited and later reprinted.",
  },
  {
    id: "ps1-michael-owen-s-wls-99",
    sourceUrl: "https://en.wikipedia.org/wiki/World_League_Soccer_%2798",
    overview:
      "Michael Owen's WLS 99 is Silicon Dreams' branded follow-up in the World League Soccer line, published by Eidos around the peak of Michael Owen's late-1990s profile. It builds on the series' association-football simulation approach rather than arcade mascot sports, with teams, match flow, passing, and tactical movement as the selling points. GCX should connect it to World League Soccer '98 and the later Michael Owen WLS 2000 when describing the series lineage.",
  },
  {
    id: "ps1-michinoku-hitou-koimonogatari-kai",
    sourceUrl: "https://kotaku.com/games/michinoku-hitou-koimonogatari-kai",
    overview:
      "Michinoku Hitou Koimonogatari Kai is an updated version of FOG's travel-romance adventure about a young photographer moving through Japan's northeast. Its unusual identity comes from combining first-person adventure scenes, photography, regional atmosphere, and hanafuda card play, with Kai adding hint support for the card-game sections. GCX should present it as a quiet Japanese adventure/card hybrid rather than a generic exploration game.",
  },
  {
    id: "ps1-mickey-to-nakamatachi-kazuasobi-iroiro",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPM-86931.html",
    overview:
      "Mickey to Nakamatachi: Kazuasobi IroIro is part of Atlus' Kids Station line, built as a Mickey Mouse-hosted collection of number-learning mini-games. It supports the standard controller, Kids Station controller, and a Mickey character controller included with some versions, making the hardware context part of the release's identity. GCX should describe it as a Japanese educational Disney release for younger children and peripheral collectors.",
  },
  {
    id: "ps1-mickey-s-wild-adventure",
    sourceUrl: "https://en.wikipedia.org/wiki/Mickey_Mania",
    overview:
      "Mickey's Wild Adventure is the European PlayStation version of Mickey Mania, Psygnosis' enhanced port of the classic Mickey Mouse platformer. Players move through side-scrolling stages inspired by famous shorts such as Steamboat Willie, The Mad Doctor, The Band Concert, Moose Hunters, Lonesome Ghosts, Mickey and the Beanstalk, and The Prince and the Pauper. GCX should emphasize its cartoon-history framing, CD soundtrack, and PS1 visual enhancements.",
  },
  {
    id: "ps1-micro-machines-v3",
    sourceUrl: "https://en.wikipedia.org/wiki/Micro_Machines_V3",
    overview:
      "Micro Machines V3 brings Codemasters' tiny-vehicle racing series into 3D environments while keeping the toy-scale tabletop fantasy. The PlayStation version is especially known for party play, imaginative household-style courses, and same-screen multiplayer tension where racers fight to stay in view. GCX should pitch it as one of the PS1's stronger social racing games, with collector notes around the European launch and later Midway U.S. distribution.",
  },
  {
    id: "ps1-midori-no-makibao-kuroi-inazuma-shiroi-kiseki",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-01312.html",
    overview:
      "Midori no Makibao: Kuroi Inazuma Shiroi Kiseki adapts the manga/anime horse-racing series about the small white racehorse Makibao. The PlayStation game mixes adventure-style choices with third-person racing sequences, where timing button inputs helps Makibao run faster during competitions. GCX should present it as a licensed character horse-racing adventure from Axela, not a conventional realistic racing sim.",
  },
  {
    id: "ps1-mighty-hits",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00583.html",
    overview:
      "Mighty Hits is Altron's cartoon-style shooting-gallery game for PlayStation, designed around light-gun support rather than platform action. It includes two-player play, four difficulty settings, memory-card high-score saving, and 30 short shooting challenges, making it closer to a variety-pack target range than a story shooter. GCX should classify it as a light-gun import and note that it later received an enhanced Special edition.",
  },
  {
    id: "ps1-mighty-hits-special-mighty-hits-special-pop-collection-1280-vol-4",
    sourceUrl: "https://www.mobygames.com/game/151490/mighty-hits-special/",
    overview:
      "Mighty Hits Special is the expanded PlayStation follow-up to Altron's shooting-gallery game, compatible with the Konami Justifier. Its stage design and short target challenges invite comparison to light-gun gallery games such as Point Blank, with quick reaction tests replacing a continuous campaign. GCX should describe it as the budget-priced Pop Collection 1280 version for collectors tracking PS1 light-gun releases and Japanese reissue labels.",
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
    if (!game) throw new Error(`Missing PS1 game ${rewrite.id}`);
    rows.push([
      "ps1",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on platform database, game-database, specialist reference, and series sources.",
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
