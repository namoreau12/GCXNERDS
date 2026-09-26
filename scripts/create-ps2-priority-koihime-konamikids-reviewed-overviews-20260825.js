const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-koihime-konamikids-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-koihime-musou-doki-shoujo-darake-no-sangokushi-engi",
    sourceUrl: "https://en.wikipedia.org/wiki/Koihime_Mus%C5%8D",
    overview:
      "Koihime Musou: Doki Shoujo Darake no Sangokushi Engi is the all-ages PlayStation 2 port of BaseSon's Romance of the Three Kingdoms-inspired visual novel. The premise recasts famous warlords from the Chinese classic as a mostly female cast and follows Kazuto Hongo through faction drama, comedy, romance, and strategy-flavored story scenes. The PS2 version is best approached as a character-route visual novel with historical parody framing, not a tactics game.",
  },
  {
    id: "ps2-koisuru-otome-to-shugo-no-tate-the-shield-of-aigis",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-55098.html",
    overview:
      "Koisuru Otome to Shugo no Tate: The Shield of AIGIS is a PlayStation 2 visual novel about Shuuji, a secret agent with the codename Shield Nine. His assignment sends him undercover into St. Theresia Private Catholic Girls School as a bodyguard for two wealthy students, creating a mix of protection-mission tension, school comedy, disguise complications, and route-based romance. The console release adapts the PC story for an all-ages audience.",
  },
  {
    id: "ps2-kokoro-no-tobira",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25349.html",
    overview:
      "Kokoro no Tobira is a PlayStation 2 visual novel port of the Windows title Manatsu no Tobira: Kimi to Tsudzuru Monogatari. The story starts with a sick sister asking the protagonist to share a picture book he created, which opens into a summer-set romance drama with heroines such as Yukina, Yun, Nanami, Kaori, and Mayuko. The PS2 version adds a new scenario, voice acting, an opening movie, and a new song.",
  },
  {
    id: "ps2-komorebi-no-namikimichi-utsurikawaru-kisetsu-no-chuu-de",
    sourceUrl: "https://vgcollect.com/item/286229",
    overview:
      "Komorebi no Namikimichi: Utsurikawaru Kisetsu no Chuu de is a GN Software PlayStation 2 visual novel set around changing seasons and romantic routes. Public catalog and encyclopedia records identify it as a Japanese-only story game rather than a strategy release. Players should expect text-heavy progression, character choice points, and relationship-focused scenes, with the PS2 edition serving as the console version of F&C's original romance adventure.",
  },
  {
    id: "ps2-konami-kids-playground-alphabet-circus",
    sourceUrl: "https://www.videogamemanual.com/PS2/Konami%20Kids%20Playground-%20Alphabet%20Circus%20%28USA%29.pdf",
    overview:
      "Konami Kids Playground: Alphabet Circus is part of Konami's preschool-focused mat-controller series for PlayStation 2. The game turns letter recognition into physical minigames where children step, hop, and move on the floor mat instead of using a standard controller. Its identity is early literacy plus activity play: circus-themed prompts, simple instructions, and short movement challenges built for very young players.",
  },
  {
    id: "ps2-konami-kids-playground-dinosaurs-shapes-and-colors",
    sourceUrl: "https://www.amazon.com/Konami-Kids-Playground-Dinosaurs-Shapes-PlayStation/dp/B000P297GQ",
    overview:
      "Konami Kids Playground: Dinosaurs - Shapes & Colors uses the same floor-mat concept to teach basic colors and shapes through movement. Players travel through prehistoric-themed playgrounds, choosing activities by stepping on pads and then jumping or moving to match prompts. The included minigames reinforce recognition, timing, and simple decision making, making it an active preschool learning game rather than a sports title.",
  },
  {
    id: "ps2-konami-kids-playground-frogger-hop-skip-and-jumpin-fun",
    sourceUrl: "https://www.ebay.com/p/62894811",
    overview:
      "Konami Kids Playground: Frogger Hop, Skip & Jumpin' Fun brings Frogger and Lily into the preschool exercise series. It uses the dedicated floor mat for hopping, skipping, and stepping through outdoor-themed activities across swamps, woods, and bayous. The focus is not arcade Frogger difficulty; it is letter, color, and shape practice wrapped in light physical play for children ages two to five.",
  },
  {
    id: "ps2-konami-kids-playground-toy-pals-fun-with-numbers",
    sourceUrl: "https://www.amazon.com/Konami-Kids-Playground-Pals-Numbers-PlayStation/dp/B000P297HA",
    overview:
      "Konami Kids Playground: Toy Pals Fun with Numbers is the counting-focused entry in Konami's mat-controller preschool line. Children use the floor mat to step through short number and recognition activities, turning basic math practice into movement-based play. Like the other Kids Playground discs, its appeal is the hardware format: simple educational prompts, quick minigames, and active participation away from the couch.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on database, manual, retail, and specialist gameplay sources.",
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
