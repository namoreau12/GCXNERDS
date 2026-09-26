const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-lets-london-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-let-s-bravo-music",
    sourceUrl: "https://en.wikipedia.org/wiki/Mad_Maestro!",
    overview:
      "Let's Bravo Music is the Japan-only proper sequel to Bravo Music, released after the original PS2 rhythm-conducting game and its expansion-style follow-ups. It keeps the series identity around classical music performance, conductor timing, and DualShock 2 pressure-sensitive input rather than a generic song-chart rhythm format. For GCX, it belongs with Sony's early PS2 music-game experiments and should be framed as a niche import companion to Mad Maestro.",
  },
  {
    id: "ps2-let-s-ride-silver-buckle-stables",
    sourceUrl: "https://fr.wikipedia.org/wiki/Let%27s_Ride!",
    overview:
      "Let's Ride: Silver Buckle Stables is a PlayStation 2 horse-riding game in the long-running Let's Ride line, released alongside a Windows version. The draw is not a conventional team sport, but stable life, horse care, riding practice, and equestrian events built for younger players interested in becoming a better rider. GCX should present it as a family-friendly riding sim, with its value tied to the PS2's wider collection of licensed and niche hobby games.",
  },
  {
    id: "ps2-lethal-skies-elite-pilot-team-sw",
    sourceUrl: "https://www.mobygames.com/game/48509/lethal-skies-elite-pilot-team-sw/",
    overview:
      "Lethal Skies Elite Pilot: Team SW is a PS2 combat flight simulator known as SideWinder F in Japan. It casts the player as part of Team SW in a near-future aerial war, using jet combat, missile locks, and mission objectives that invite comparison to Ace Combat while carrying its own Asmik Ace and Sammy identity. Collectors should treat it as an early PS2 arcade-flight entry, not a slow civilian simulation.",
  },
  {
    id: "ps2-lethal-skies-ii",
    sourceUrl: "https://ps2.gamespy.com/playstation-2/lethal-skies-ii/",
    overview:
      "Lethal Skies II returns to futuristic jet combat with a faster, more arcade-leaning flight style than the first game. Contemporary coverage positioned it directly against Ace Combat, with missions built around strike, interception, and high-speed weapons use rather than pure aviation realism. GCX should classify it as a combat flight action game from Asmik Ace and Sammy, especially useful for players collecting PS2 alternatives to Namco's bigger air-combat series.",
  },
  {
    id: "ps2-lilie-no-atelier-plus-salberg-no-renkinjutsushi-3",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/GUST-00005.html",
    overview:
      "Lilie no Atelier Plus: Salberg no Renkinjutsushi 3 is Gust's expanded PS2 version of the third Salburg Atelier game. Lilie's goal is to prove alchemy's worth, earn public support, and help fund an academy, which means the loop centers on gathering materials, synthesizing items, taking requests, and fighting monsters when needed. GCX should describe it as a crafting-led Japanese RPG and Atelier import, not as a generic party RPG.",
  },
  {
    id: "ps2-little-aid",
    sourceUrl: "https://kotaku.com/games/little-aid-1",
    overview:
      "Little Aid is a Takuyo otome visual novel for PC and PlayStation 2. Its appeal is route-based romance, school-life character drama, and comedy rather than reflex play, with the player spending most of the experience reading scenes and following character decisions. For GCX, it should sit in the Japanese romance-adventure shelf of the PS2 library, where publisher, platform, and import status matter more than broad mainstream familiarity.",
  },
  {
    id: "ps2-little-anchor",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25929.html",
    overview:
      "Little Anchor is a Japan-only science-fiction otome visual novel from Vridge and D3 Publisher. The PS2 version is built around anime-style story presentation, romance routes, and character interaction in a dramatic SF setting, making it closer to a relationship-driven adventure than the old generic GCX blurb implied. Its collector relevance comes from D3's otome catalog and late-era PS2 visual-novel imports.",
  },
  {
    id: "ps2-living-world-racing",
    sourceUrl: "https://www.ps2home.co.uk/living-world-racing/",
    overview:
      "Living World Racing is a budget 3D racing game from Data Design Interactive and Metro3D. PS2 Home lists split-screen multiplayer, variable AI difficulty, day and night racing, random weather, unlockable characters and levels, and pickups such as boosts, missiles, bombs, and shields. GCX should frame it as a mascot-style arcade racer from the PAL budget scene, not a serious motorsport sim.",
  },
  {
    id: "ps2-lma-manager-2002",
    sourceUrl: "https://en.wikipedia.org/wiki/LMA_Manager#LMA_Manager_2002",
    overview:
      "LMA Manager 2002 was the series' first PlayStation 2 version, moving Codemasters' football-management format into a full 3D match environment. Players manage clubs across several European leagues while watching matches play out with BBC-style presentation from Gary Lineker and Alan Hansen. The important correction for GCX is genre: this is console-focused football management, where squad decisions, tactics, transfers, and match observation matter more than direct player control.",
  },
  {
    id: "ps2-lma-manager-2003",
    sourceUrl: "https://en.wikipedia.org/wiki/LMA_Manager#LMA_Manager_2003",
    overview:
      "LMA Manager 2003 is Codemasters' follow-up to the PS2 debut, released on PlayStation 2 and Xbox with smaller refinements rather than a full reinvention. It keeps the console-friendly football-management loop of picking tactics, handling squads and transfers, then watching the 3D match engine show the consequences. GCX should treat it as an annualized management entry, valuable for series collectors and PAL sports-library builders.",
  },
  {
    id: "ps2-lma-manager-2004",
    sourceUrl: "https://en.wikipedia.org/wiki/LMA_Manager#LMA_Manager_2004",
    overview:
      "LMA Manager 2004 is the entry where Codemasters added more visible match and presentation improvements, including new commentary and a Fantasy Team mode for building a club from a budget. It remains a football-management game first: the player studies squads, shapes tactics, manages transfers, and watches results unfold through the 3D engine. GCX should highlight the Fantasy Team feature because it distinguishes this year from the surrounding PS2 releases.",
  },
  {
    id: "ps2-lma-manager-2005",
    sourceUrl: "https://en.wikipedia.org/wiki/LMA_Manager#LMA_Manager_2005",
    overview:
      "LMA Manager 2005 expands Codemasters' PS2 football-management series with additional playable leagues, including Dutch and Portuguese competitions and the English Football Conference. It also added online roster-update support and EyeToy novelty features on PlayStation 2, giving the annual release a clearer identity than a simple data refresh. For GCX, the hook is console management with period-specific presentation and early online-update context.",
  },
  {
    id: "ps2-lma-manager-2006",
    sourceUrl: "https://en.wikipedia.org/wiki/LMA_Manager#LMA_Manager_2006",
    overview:
      "LMA Manager 2006 continues the PS2 series with deeper transfer, training, and match-presentation features. The notable additions include more playable divisions, playable 3D training matches, expanded transfer negotiation options, and a visible 3D manager who can appear on the touchline and in TV-style headlines. GCX should classify it firmly as football management and call out its attempt to make management feel more televisual on console.",
  },
  {
    id: "ps2-lma-manager-2007",
    sourceUrl: "https://en.wikipedia.org/wiki/LMA_Manager#LMA_Manager_2007",
    overview:
      "LMA Manager 2007 is the late PS2 entry in Codemasters' football-management series, released alongside PC-DVD and Xbox 360 versions with transfer updates and a more modern presentation layer. The existing GCX text incorrectly treated it like a shooter; in reality it is about building squads, managing tactics, handling transfers, and watching matches rather than aiming weapons or controlling players directly. It is also historically important as one of the last major LMA releases before the series faded.",
  },
  {
    id: "ps2-london-cab-challenge",
    sourceUrl: "https://www.gamesmen.com.au/london-cab-challenge",
    overview:
      "London Cab Challenge is a European PlayStation 2 budget racing game associated with Phoenix Games and developer Mere Mortals. Instead of track racing, it turns London taxi driving into timed arcade challenges where players navigate city streets and try to complete fares efficiently. GCX should present it as a PAL budget driving release and collector curiosity, with interest coming from its premise and publisher history rather than technical prestige.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on publisher, game-database, specialist reference, and platform-list sources.",
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
