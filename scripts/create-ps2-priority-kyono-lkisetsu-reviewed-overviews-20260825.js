const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-kyono-lkisetsu-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-kyo-no-wanko",
    sourceUrl: "https://www.honestgamers.com/45232/playstation-2/mezamashi-telebi-10th-anniversary-kyono-wanko/game.html",
    overview:
      "Kyo-no Wanko is a Japan-only PlayStation 2 simulation tied to Fuji TV's Mezamashi TV dog segment. Rather than offering a conventional adventure, it sits in the PS2's pet-and-lifestyle corner, built around the appeal of featured dogs and light companion-style interaction. For GCX, it is best framed as a DigiCube-era curiosity for import collectors, TV tie-in collectors, and players tracking Japan's early-2000s pet software wave.",
  },
  {
    id: "ps2-kyojin-no-hoshi",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65142.html",
    overview:
      "Kyojin no Hoshi: The Anime Super Remix is a Capcom PS2 release based on the classic baseball manga and anime Star of the Giants. The package mixes baseball-themed minigames with unlockable animation material, turning success in the challenges into a way to open stills and a narrated episode reward. Its value is less as a deep baseball sim and more as a licensed anime archive piece with interactive fan-service built around a famous sports series.",
  },
  {
    id: "ps2-kyoufu-shinbun-heisei-han-kaiki-shinrei-file",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65342.html",
    overview:
      "Kyoufu Shinbun (Heisei-Han) Kaiki! Shinrei File is a Konami horror adventure based on Jiro Tsunoda's supernatural manga about a cursed newspaper that predicts death and disaster. The PS2 game leans into still imagery, interview-like scenes, altered voices, and unsettling presentation instead of action combat. It belongs with Japan-only horror and sound-novel style releases where atmosphere, investigation, and manga provenance drive the appeal.",
  },
  {
    id: "ps2-kyoushuu-kidou-butai-kougeki-helicopter-senki",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/391233-kyoushuu-kidou-butai-kougeki-helicopter-senki",
    overview:
      "Kyoushuu Kidou Butai: Kougeki Helicopter Senki is a Japanese PS2 helicopter action game developed by ASK and published by Taito. Retail descriptions emphasize controllable attack helicopters, analog-stick flight handling, multiple viewpoints, and a lineup that includes real-world-inspired craft such as the AH-64D Apache Longbow. It is a niche arcade-military pick, notable partly because a planned North American version called Threat Con Delta was canceled.",
  },
  {
    id: "ps2-kyuuketsu-hime-yui-senyasyo",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65272.html",
    overview:
      "Kyuuketsu Hime Yui: Senyasyo is a PS2 visual novel based on the Vampire Princess Yui manga. Players follow branching story routes, choose among multiple heroine paths, manage choice-driven outcomes, and unlock gallery material as the narrative changes. For GCX, it should be presented as a licensed manga visual novel for import readers and collectors who follow early-2000s anime-adaptation software.",
  },
  {
    id: "ps2-kyuuketsu-kitan-moonties",
    sourceUrl: "https://www.play-asia.com/en/kyuuketsu-kitan-moonties/13/702fpf",
    overview:
      "Kyuuketsu Kitan Moonties is a PlayStation 2 romance adventure and visual novel connected to the Draculius vampire storyline. Catalog descriptions frame it around a protagonist with vampire blood, heroines carrying their own secrets, added events, and additional CG material. Its collector hook is the mix of supernatural romance, all-ages console adaptation context, and Japanese text-heavy storytelling rather than mechanical complexity.",
  },
  {
    id: "ps2-l-no-kisetsu-2-invisible-memories",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-55009.html",
    overview:
      "L no Kisetsu 2: Invisible Memories is a PS2 fantasy visual novel sequel set after the original L no Kisetsu. The story returns to strange incidents around HijiriRyo school and again moves between ordinary reality and a fantasy world, with different endings shaped by player choices. It is mainly useful to GCX readers as a Japanese adventure sequel from 5pb, aimed at visual-novel fans who care about continuity and route structure.",
  },
  {
    id: "ps2-l-eredita",
    sourceUrl: "https://www.mobygames.com/company/291/milestone-srl/",
    overview:
      "L'Eredita is a PlayStation 2 release from Italian studio Milestone, better known for racing games and licensed motorsport work. Unlike the studio's motorcycle-heavy later identity, this title is tied to the Italian game-show property of the same name and sits as an unusual licensed European entry in the PS2 catalog. For collectors, the interest is regional publishing history, Sony Computer Entertainment's involvement, and Milestone's broader pre-modern racing-era footprint.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on specialist database, retail, developer/company, and catalog sources.",
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
