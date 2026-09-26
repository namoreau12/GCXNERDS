const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-kamaitachi-kanuchi-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-kamaitachi-no-yoru-3",
    sourceUrl: "https://en.wikipedia.org/wiki/Banshee%27s_Last_Cry",
    overview:
      "Kamaitachi no Yoru 3 is Chunsoft's PlayStation 2 continuation of its influential sound-novel mystery series. The entry matters because it gathers the original Kamaitachi no Yoru scenario material into the PS2-era package while continuing the series' blue-silhouette, text-choice murder-mystery structure. GCX should describe it as a Japan-only sound novel for readers tracking Chunsoft's pre-428 lineage, where the hook is branching suspense and scenario completion rather than action or puzzle execution.",
  },
  {
    id: "ps2-kamisama-kazoku-ouen-ganbou",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66499.html",
    overview:
      "Kamisama Kazoku: Ouen Ganbou is a Japan-only PlayStation 2 adventure game based on the Kamisama Kazoku anime and light-novel property. The PSXDataCenter entry describes a story that follows the animation closely while letting players control Samatarou, interact with Tenko, Kumiko, and the supporting cast, and pursue three possible romance routes after the game introduces Akane Himura. GCX should frame it as a licensed anime adventure/romance release for import collectors, not a general-purpose fantasy RPG.",
  },
  {
    id: "ps2-kamiwaza",
    sourceUrl: "https://nisamerica.com/kamiwaza/",
    overview:
      "Kamiwaza is Acquire's 2006 PlayStation 2 stealth-action game, later introduced internationally through the Kamiwaza: Way of the Thief remaster. It casts the player as Ebizo, a thief in Edo-period Japan who steals to support his family while navigating patrols, disguises, pickpocketing, and reputation pressure. GCX should present the PS2 original as a Japan-only Acquire curiosity related to Tenchu and Way of the Samurai: less about pure combat, more about theft routes, evasive movement, and theatrical stealth.",
  },
  {
    id: "ps2-kamiyo-gakuen-makorouku-kurunugia",
    sourceUrl: "https://www.vgchartz.com/game/27727/kamiyo-gakuen-makorouku-kurunugia/",
    overview:
      "Kamiyo Gakuen Makorouku Kurunugia is a 2008 Japan-only PlayStation 2 strategy release from Idea Factory. The available catalog record identifies it as an Idea Factory-developed and published strategy game, while contemporary import writeups point to a school-occult premise involving disappearances, demons, and a marked protagonist pulled into supernatural conflict. GCX should keep this profile cautious but useful: an obscure late-PS2 Idea Factory strategy/adventure hybrid for collectors of Japanese imports and unusual school-fantasy releases.",
  },
  {
    id: "ps2-kanojo-no-densetsu-boku-no-sekiban",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65874.html",
    overview:
      "Kanojo no Densetsu, Boku no Sekiban is a Simple 2000 Series PlayStation 2 visual novel from D3 Publisher and Best Media. The PSXDataCenter entry describes it as a traditional Japanese-style visual novel, with the player drawn into a fantasy world and pushed into guiding a group of heroines through their kingdom's crisis. GCX should describe it as a low-budget import VN with fantasy-adventure framing, useful to PS2 collectors because the Simple 2000 label often hides niche genre experiments behind plain packaging.",
  },
  {
    id: "ps2-kanokon-esuii",
    sourceUrl: "https://en.wikipedia.org/wiki/Kanokon",
    overview:
      "Kanokon: Esuii is 5pb.'s PlayStation 2 visual novel adaptation of the Kanokon romantic-comedy/supernatural media franchise. Released in Japan in 2008 in regular and limited editions, it sits alongside the light novels, manga, anime, and drama CDs rather than functioning as a standalone action game. GCX should identify it as a fan-facing story release built around the established Kanokon cast, route-style visual-novel presentation, and collector interest in anime-license PS2 imports.",
  },
  {
    id: "ps2-kanuchi-kuroki-tsubasa-no-shou",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-55161.html",
    overview:
      "Kanuchi: Kuroki Tsubasa no Shou is the second PlayStation 2 half of Idea Factory's Kanuchi fantasy otome project. PSXDataCenter describes the gameplay as classic visual-novel choice structure combined with blacksmithing and fantasy elements, while later series writeups explain the broader Kanuchi concept around Aki, smithing, romance routes, and a body shared with an ancient queen. GCX should describe Kuroki as the darker follow-up chapter, important because the two PS2 entries form one linked blacksmithing-otome story.",
  },
  {
    id: "ps2-kanuchi-shiroki-tsubasa-no-shou",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-55055.html",
    overview:
      "Kanuchi: Shiroki Tsubasa no Shou is the first PlayStation 2 chapter of Idea Factory's fantasy blacksmithing otome series. Its hook is unusual for the genre: classic visual-novel choices sit alongside smithing and fantasy-life elements, with heroine Aki trying to work as a blacksmith while larger supernatural and romantic routes unfold around her. GCX should treat it as the setup half of Kanuchi, pairing naturally with Kuroki Tsubasa no Shou for collectors who want the complete PS2 story.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on current catalog, platform database, publisher/remaster, or franchise sources.",
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
