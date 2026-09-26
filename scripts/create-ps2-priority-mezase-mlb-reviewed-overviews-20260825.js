const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-mezase-mlb-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority PS2 weak-template cleanup; original editorial copy based on series documentation, specialist databases, publisher/catalog listings, and contemporary review material.";

const entries = [
  {
    id: "ps2-mezase-super-bowler",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_(L%E2%80%93Z)",
    overview:
      "Mezase! Super Bowler is a Japan-only PlayStation 2 bowling release from Success, sitting in the PS2 library's practical ten-pin lane rather than the character-sports space. The draw is straightforward lane play: aiming, timing, ball control, and repeated score improvement built around bowling fundamentals. Because English coverage is thin, the safest way to present it is as a niche Success bowling sim for import collectors and sports-completion libraries.",
  },
  {
    id: "ps2-mezase-super-hustler",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_(L%E2%80%93Z)",
    overview:
      "Mezase! Super Hustler!! is Success' Japan-only PlayStation 2 billiards title, aimed at players who want cue-sports practice more than arcade spectacle. Its likely appeal is table reading, shot angle, spin, and repeatable match play, with the \"hustler\" framing tying it to pool-hall competition. Public English detail is limited, so it should be treated as a niche import billiards entry rather than padded into a broader sports career game.",
  },
  {
    id: "ps2-micro-machines",
    sourceUrl: "https://en.wikipedia.org/wiki/Micro_Machines_(video_game_series)",
    overview:
      "Micro Machines on PlayStation 2 brings the toy-car racing series into the early-2000s console era, with Infogrames Sheffield House handling a version built around miniature vehicles and oversized everyday environments. The series' identity comes from chaotic top-down or toy-scale racing, tight tracks, and multiplayer-friendly competition where household spaces become race courses. This PS2 entry matters as part of the post-Codemasters spread of Micro Machines across PS2, GameCube, Xbox, and handheld platforms.",
  },
  {
    id: "ps2-might-and-magic-day-of-the-destroyer",
    sourceUrl: "https://en.wikipedia.org/wiki/Might_and_Magic_VIII%3A_Day_of_the_Destroyer",
    overview:
      "Might and Magic: Day of the Destroyer is the Japanese PlayStation 2 port of Might and Magic VIII, a first-person fantasy RPG originally built by New World Computing. The adventure sends players across Jadame after elemental gateways trigger disasters, while party-building, class choices, spell growth, and recruitable allies carry the long-form RPG structure. The PS2 version is especially notable as a rare console appearance for a mainline Might and Magic game, published in Japan by Imagineer.",
  },
  {
    id: "ps2-mighty-mulan",
    sourceUrl: "https://www.computinghistory.org.uk/det/66799/Mighty-Mulan/",
    overview:
      "Mighty Mulan is a Phoenix Games budget PlayStation 2 release from The Code Monkeys, tied to the publisher's European line of low-cost family and activity titles. Instead of a licensed Disney production, it presents a simple Mulan-themed action/activity package with side-scrolling play and lightweight modes. Its collector interest comes less from design ambition and more from Phoenix Games' unusual PS2 catalogue, which has become a minor preservation and curiosity lane of its own.",
  },
  {
    id: "ps2-mikomai-towa-no-omoi",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66052.html",
    overview:
      "Mikomai: Towa no Omoi is a KID-published romance visual novel about returning to a childhood village just before its rail line is discontinued. The setup quickly becomes personal: a failed hotel reservation leads the protagonist to stay at a shrine with childhood friend Natsuki, opening routes around memory, attachment, and uneasy village secrets. It belongs with PS2's Japan-only visual-novel catalogue, where character scenarios and atmosphere are the real play loop.",
  },
  {
    id: "ps2-million-god",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-20255.html",
    overview:
      "Million God is a PlayStation 2 pachislot simulator based on Aruze's popular Million God machine. The PS2 version focuses on reproducing the cabinet experience, including the reels, LCD presentation, camera and zoom options, autoplay-style settings, hint/message displays, and unlockable media galleries. It is not a casino adventure; its purpose is machine study, practice, and home access to a specific Japanese parlor title.",
  },
  {
    id: "ps2-mirai-shounen-conan",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65973.html",
    overview:
      "Mirai Shounen Conan adapts Future Boy Conan into a Japan-only PlayStation 2 3D action-adventure from D3 Publisher. The game follows Conan through rescue-and-resistance scenarios against Industria, using his strength and agility in a format built around movement, exploration, and action set pieces. Its strongest hook for anime collectors is the source treatment: the release includes more than 30 minutes of animation footage from the original series.",
  },
  {
    id: "ps2-missing-blue",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25051.html",
    overview:
      "Missing Blue is Tonkin House's PlayStation 2 digital novel about a high-school student whose routine is disrupted when transfer student Kasuga Mizuki gives him a mysterious crystal and asks him to remember. The story leans on memory, déjà vu, school-life relationships, and player support through interactive novel choices rather than traditional exploration. It is a story-first PS2 import for visual-novel fans, not an action mystery.",
  },
  {
    id: "ps2-missing-parts-side-a-the-tantei-stories",
    sourceUrl: "https://segaretro.org/Missing_Parts%3A_The_Tantei_Stories",
    overview:
      "Missing Parts Side A: The Tantei Stories is the first PlayStation 2 half of FOG's detective-adventure series, which began on Dreamcast before being split across two PS2 releases. The format centers on investigation, character dialogue, case structure, and route-like story progression rather than reflex play. Side A is important because it introduces the PS2 version's enhanced presentation and new control setup while preserving the series' grounded private-detective appeal.",
  },
  {
    id: "ps2-missing-parts-side-b-the-tantei-stories",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25340.html",
    overview:
      "Missing Parts Side B: The Tantei Stories continues FOG's detective-adventure material on PlayStation 2, completing the split PS2 release of the original Dreamcast series. This side includes later episodes, enhanced graphics, a CG gallery, and an unlockable bonus story after the main cases are cleared. It should be presented as a narrative investigation game where reading, evidence context, and character work matter more than puzzle-box mechanics.",
  },
  {
    id: "ps2-mitsu-x-mitsu-drops-love-x-love-honey-life",
    sourceUrl: "https://en.wikipedia.org/wiki/Honey_%C3%97_Honey_Drops",
    overview:
      "Mitsu x Mitsu Drops: Love x Love Honey Life is Idea Factory's PlayStation 2 otome/dating-sim adaptation of Kanan Minami's Honey x Honey Drops manga. The premise follows Yuzuru after she becomes a \"Honey,\" a scholarship-like partner assigned to a wealthy Kuge-course student at Hojo High School. The game uses the manga's romance and school-status setup as its core appeal, making it a character-route import rather than a general school simulator.",
  },
  {
    id: "ps2-mizu-no-senritsu",
    sourceUrl: "https://kotaku.com/games/mizu-no-senritsu",
    overview:
      "Mizu no Senritsu is a KID otome visual novel centered on Hina Shiraishi, a teenage girl whose return of strange incidents connects to illness, memory, rain, and unresolved events from childhood. The experience is route-driven and mood-heavy, with romance and mystery developing through character scenes rather than action or RPG systems. It is one of KID's mid-2000s PS2 visual novels later associated with PC and PSP versions.",
  },
  {
    id: "ps2-mizu-no-senritsu-2-hi-no-kioku",
    sourceUrl: "https://kotaku.com/games/mizu-no-senritsu-2-hi-no-kioku",
    overview:
      "Mizu no Senritsu 2: Hi no Kioku is KID's follow-up to Mizu no Senritsu, returning to the same otome/mystery visual-novel space with a new lead and a darker case-driven structure. Public summaries frame the player around Kashiwagi Kira and mysterious incidents involving a sword, keeping the series' blend of romance, supernatural unease, and investigation-like reading. It is best cataloged as a sequel for import visual-novel collectors rather than a standalone action adventure.",
  },
  {
    id: "ps2-mlb-power-pros-2008",
    sourceUrl: "https://en.wikipedia.org/wiki/MLB_Power_Pros_2008",
    overview:
      "MLB Power Pros 2008 pairs real MLB licensing with Konami's big-headed Power Pro style, creating one of the more distinctive baseball games on PlayStation 2. It keeps the accessible batting and pitching of the first North American release while adding updated rosters, in-game bullpen control, and MLB Life, a career mode where players manage a pro's daily schedule and on-field appearances over many seasons. Success Mode remains the cult hook, mixing baseball growth with story-driven stat building.",
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
  if (missing.length) throw new Error(`Missing PS2 games: ${missing.map((entry) => entry.id).join(", ")}`);

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
