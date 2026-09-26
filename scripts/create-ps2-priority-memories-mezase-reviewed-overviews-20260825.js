const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-memories-mezase-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority PS2 weak-template cleanup; original GCX editorial overview based on series documentation, specialist game databases, import catalog pages, reviews, and gameplay context.";

const entries = [
  {
    id: "ps2-memories-off-5-togireta-film",
    sourceUrl: "https://en.wikipedia.org/wiki/Memories_Off_5%3A_Togireta_Film",
    overview:
      "Memories Off 5: Togireta Film is the fifth main Memories Off romance visual novel, built around Haruto Kawai, a university film-club circle, and the unresolved death of his friend Yusuke one year earlier. The player reads branching scenes, makes decision-point choices, and follows routes tied to the five main heroines. GCX should frame it as the film-club tragedy entry in the series, not simply another generic romance VN.",
  },
  {
    id: "ps2-memories-off-6-next-relation",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/FVGK-0024.html",
    overview:
      "Memories Off 6: Next Relation is a direct sequel/fan-disc-style follow-up to Memories Off 6: T-wave. At the start, players choose which heroine's relationship path from the previous story they want to continue, then see a different future branch for that couple. GCX should describe it as a heroine-specific after-story collection for fans who already know T-wave, with character continuity being the main hook.",
  },
  {
    id: "ps2-memories-off-after-rain-vol-1-oridzuru",
    sourceUrl: "https://en.wikipedia.org/wiki/Memories_Off",
    overview:
      "Memories Off After Rain Vol. 1: Oridzuru is the first part of the After Rain trilogy, a set of after-stories connected to the early Memories Off cast. It is a shorter, continuity-focused visual novel for players who want follow-up scenes and emotional closure rather than a new standalone premise. GCX should identify it as part one of the PS2 After Rain run so collectors can distinguish Oridzuru from Souen and Sotsugyou.",
  },
  {
    id: "ps2-memories-off-after-rain-vol-2-souen",
    sourceUrl: "https://en.wikipedia.org/wiki/Memories_Off",
    overview:
      "Memories Off After Rain Vol. 2: Souen is the middle volume of the After Rain trilogy. Like the other volumes, it functions as a continuation piece for Memories Off fans, using familiar characters, branching dialogue, and route-focused scenes rather than introducing a full new main-series cast. GCX should describe it as the second PS2 After Rain follow-up and keep the volume identity clear for import listings.",
  },
  {
    id: "ps2-memories-off-after-rain-vol-3-sotsugyou",
    sourceUrl: "https://en.wikipedia.org/wiki/Memories_Off",
    overview:
      "Memories Off After Rain Vol. 3: Sotsugyou closes the three-part After Rain sequence with a graduation-themed follow-up for the early Memories Off story world. The appeal is in seeing post-route character moments and series callbacks through the usual visual-novel choice structure. GCX should present it as the final After Rain volume, aimed at existing Memories Off fans rather than newcomers looking for a self-contained first entry.",
  },
  {
    id: "ps2-memories-off-mix",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25278.html",
    overview:
      "Memories Off Mix is an unusual Memories Off spinoff because it combines story content with a set of puzzle-style mini-games that ask for speed and quick thinking. It still uses the series' character appeal, but the structure is lighter and more playful than the numbered romance VNs. GCX should flag it as a fan-service puzzle/variety release, useful for collectors because it sits outside the normal main-story progression.",
  },
  {
    id: "ps2-memories-off-sorekara",
    sourceUrl: "https://en.wikipedia.org/wiki/Memories_Off%3A_Sorekara",
    overview:
      "Memories Off: Sorekara is the fourth main Memories Off visual novel, following Isshu Sagisawa after his girlfriend Inori breaks up with him at the beginning of the story. The game builds its drama around cafe work, school relationships, heroine routes, and the consequences of earlier emotional ties. GCX should describe it as the Inori-led PS2 entry that later received the Sorekara Again sequel and an OVA adaptation.",
  },
  {
    id: "ps2-men-at-work-3",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65765.html",
    overview:
      "Men at Work! 3: Ai to Seishun no Hunter Gakuen is a fantasy school RPG/visual-novel hybrid set in an old European castle that houses a magic academy for wizards and monster hunters. Players follow a Crichton family protagonist through student life, monster-hunter training, and character events rather than a pure romance reading experience. GCX should describe it as the PS2 console entry in Studio e.go/KID's fantasy academy line.",
  },
  {
    id: "ps2-mermaid-prism",
    sourceUrl: "https://uguucageoflove.wordpress.com/2022/02/10/mermaid-prism-all-routes-and-thoughts/",
    overview:
      "Mermaid Prism is D3 Publisher and Vingt-et-un Systems' otome adventure about a heroine drawn into a fantasy romance built around mermaid-princess imagery and multiple character routes. It was later reissued under D3's Simple 2000 Series branding, which is important for collectors tracking both the original and budget releases. GCX should frame it as a PS2 women-targeted romance adventure, not a generic visual novel with no identity.",
  },
  {
    id: "ps2-meshimase-roman-sabou",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/391273-meshimase-roman-sabou",
    overview:
      "Meshimase Roman Sabou mixes romance-adventure storytelling with sweet-shop management. Players earn money, buy ingredients, improve the shop, and create recipes by combining three ingredients, giving it more of a cafe-life loop than a pure dialogue-only visual novel. GCX should present it as a D3/Vingt-et-un Systems romance and shop-simulation title, later tied to the Simple 2000 Roman Sabou branding.",
  },
  {
    id: "ps2-metal-wolf-rev",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65553.html",
    overview:
      "Metal Wolf REV is a Japan-only PS2 adventure from PrincessSoft and Zerosystem set in a dystopian rebuilding society controlled by the Planetary Development Corporation. Players follow Houjou Minagi, a salaryman trained in combat, as he works with colleagues, helps an amnesiac girl named Larissa, and becomes entangled with a red-cloaked assassin called Metal Wolf. GCX should describe it as a corporate-dystopia adventure with action-flavored premise, not as a mech game.",
  },
  {
    id: "ps2-metropolismania",
    sourceUrl: "https://en.wikipedia.org/wiki/Metropolismania",
    overview:
      "MetropolisMania is a city-building/social-sim hybrid where the player personally walks through town, lays roads, places buildings, and befriends residents instead of managing from a distant god view. Progress depends on population goals, business or facility requirements, side stories, complaints, and relationship meters built through gossip, gifts, and introductions. GCX should call out its strange mix of SimCity planning and face-to-face neighborhood matchmaking.",
  },
  {
    id: "ps2-metropolismania-2",
    sourceUrl: "https://en.wikipedia.org/wiki/Metropolismania",
    overview:
      "MetropolisMania 2 continues Indi's walk-around city-building formula with more town goals, resident requests, and relationship-driven problem solving. Players still succeed by designing neighborhoods and helping citizens connect, while the sequel expands the personality categories and complaints that shape how towns grow. GCX should position it as the second PS2 Machi-ing Maker game and a direct sequel for fans of quirky social city-builders.",
  },
  {
    id: "ps2-mezase-chess-champion",
    sourceUrl: "https://www.honestgamers.com/45389/playstation-2/mezase-chess-champion/game.html",
    overview:
      "Mezase! Chess Champion is Success' Japanese PS2 chess title in the SuperLite 2000 Table line. It is best understood as a straightforward board-game program: sit down to play chess, practice decisions, and treat the disc as budget table-game software rather than a puzzle adventure. GCX should identify it alongside other PS2 chess releases and Success table-game entries for accurate collector categorization.",
  },
  {
    id: "ps2-mezase-meimon-yakyubu-2",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28L%E2%80%93Z%29",
    overview:
      "Mezase! Meimon Yakyubu 2 is Dazz's Japan-only PS2 baseball-management/sports release, issued under SuperLite 2000 Table branding. The title's goal is not MLB-style action spectacle; it points toward building or guiding a respected school baseball club through management, practice, and match-oriented decisions. GCX should describe it conservatively as a Japanese high-school baseball club simulation for collectors of niche sports-management PS2 software.",
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
