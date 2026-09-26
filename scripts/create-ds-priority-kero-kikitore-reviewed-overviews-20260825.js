const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-kero-kikitore-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority DS weak-template cleanup; original GCX editorial overview based on publisher/catalog data, series documentation, specialist databases, reviews, and gameplay reporting.";

const entries = [
  {
    id: "ds-kero-kero-7",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/141550-kero-kero-7",
    overview:
      "Kero Kero 7 is a Japan-only Bandai Nintendo DS release about the Kero Kero Agency, a team of seven frog secret agents protecting the peaceful world of Kerorinpo. Public English detail is limited, but the available catalog material points to a licensed character action/adventure rather than a broad RPG or puzzle title. Its collector interest comes from being an obscure import built around Bandai's frog-agent cast and the DS-era licensed-game niche.",
  },
  {
    id: "ds-keroro-gunsou-enshuu-da-yo-zenin-shuugou-part-2",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Keroro Gunsou: Enshuu da Yo! Zenin Shuugou Part 2 is a Japan-only Sgt. Frog DS game from Aspect and Bandai Namco. The title is better framed as a Keroro character action/shooter entry than as a generic shooter, using the military-comedy cast and training-exercise premise as its hook. For collectors, it sits in the middle of the Keroro DS run and matters mainly as a licensed anime import with Aspect development credit.",
  },
  {
    id: "ds-keroro-rpg-kishi-to-musha-to-densetsu-no-kaizoku",
    sourceUrl: "https://en.wikipedia.org/wiki/Keroro_RPG%3A_Kishi_to_Musha_to_Densetsu_no_Kaizoku",
    overview:
      "Keroro RPG: Kishi to Musha to Densetsu no Kaizoku is the standout DS Keroro release because it plays like a Tales-style action RPG. Developed with Namco Tales Studio and 7th Chord, it sends the Sgt. Frog cast through towns, dungeons, field-map travel, party growth, and real-time Linear Motion Battle System combat. The result is closer to a compact Tales spin-off with Keroro humor than a simple licensed anime tie-in.",
  },
  {
    id: "ds-keshikasu-kun-battle-kas-tival",
    sourceUrl: "https://www.zophar.net/music/nintendo-ds-2sf/keshikasu-kun-battle-kas-tival",
    overview:
      "Keshikasu-Kun: Battle Kas-tival is a Japan-only Konami DS action game developed by Inti Creates and based on the gag manga character Keshikasu-kun. Because public gameplay documentation is sparse, the safest framing is a licensed action release from a developer better known for precise 2D handheld work, not a strategy or adventure game. Its collector appeal comes from that Inti Creates credit and the oddball school-supplies manga license.",
  },
  {
    id: "ds-ketsui-death-label",
    sourceUrl: "https://www.siliconera.com/ketsui-death-label-is-basically-a-boss-rush/",
    overview:
      "Ketsui Death Label is not a full arcade port of Cave's Ketsui; it is a Nintendo DS boss-rush adaptation built around fighting the arcade game's huge EVAC war machines. Arika cut straight to escalating bullet-pattern battles, with modes such as Novice, Normal, Death Label, Extra, and DOOM emphasizing survival, replay mastery, and Cave-style intensity. It is one of the DS library's most distinctive shooter releases and a serious import target for bullet-hell collectors.",
  },
  {
    id: "ds-kid-paddle-blorks-invasion",
    sourceUrl: "https://www.gamekult.com/jeux/kid-paddle-blorks-invasion-84458.html",
    overview:
      "Kid Paddle: Blorks Invasion is a DS action-adventure based on Midam's Belgian comic about a game-obsessed kid, his friends, and the monster-like Blorks. Mistic Software and Atari built it for young fans of the license, so the value is mostly in the comic-book world and kid-friendly action rather than mechanical depth. It belongs with the Franco-Belgian Kid Paddle game line and should not be mistaken for a strategy release.",
  },
  {
    id: "ds-kid-paddle-lost-in-the-game",
    sourceUrl: "https://fr.wikipedia.org/wiki/Kid_Paddle%3A_Lost_in_the_Game",
    overview:
      "Kid Paddle: Lost in the Game is the later Mistic Software Kid Paddle game, released on DS and Wii in 2008. It shifts the license toward action-platforming, sending Kid through video-game-inspired worlds instead of simply presenting a comic tie-in shell. The important distinction is that this is the platformer follow-up to Blorks Invasion and part of the small European Kid Paddle console-game run.",
  },
  {
    id: "ds-kids-learn-2-think-a-edition",
    sourceUrl: "https://www.mobygames.com/game/151652/kids-learn-2-think-a-edition/credits/nintendo-ds/",
    overview:
      "Kids Learn 2 Think: A+ Edition is an Engine Software-developed educational DS release aimed at early thinking and reasoning practice. It belongs with the Talking Stick Games A+ Edition learning line, where the focus is short drills, repeatable exercises, and child-friendly skill building rather than campaign progression. Public detail beyond credits and platform data is limited, so it is best understood as educational software rather than a conventional strategy game.",
  },
  {
    id: "ds-kids-learn-math-a-edition",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Kids Learn Math: A+ Edition is the math-focused entry in Talking Stick Games' A+ Edition DS learning line, developed by Engine Software. The experience is built around practice-style lessons and exercises for young players, not around strategy systems or adventure progression. Its library value is mainly as part of the DS's large edutainment shelf, where school-skill cartridges sat beside licensed games and brain-training software.",
  },
  {
    id: "ds-kids-learn-music-a-edition",
    sourceUrl: "https://en.wikipedia.org/wiki/Engine_Software",
    overview:
      "Kids Learn Music: A+ Edition, also known in some European contexts as Music fuer Kids, is an Engine Software educational music release for Nintendo DS. It should be described as child-oriented edutainment built around musical learning activities rather than as a rhythm game in the arcade sense. For collectors, it pairs with the other A+ Edition cartridges and reflects the DS era's heavy use of the touchscreen for school and hobby training.",
  },
  {
    id: "ds-kids-learn-spelling-and-grammar-a-edition",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Kids Learn Spelling and Grammar: A+ Edition is the language-skills counterpart to the A+ Edition math, music, and thinking cartridges. The core appeal is simple literacy practice through DS exercises for younger players, with Engine Software handling development and Talking Stick Games publishing. It is educational/language software, and available catalog evidence does not support implying deeper progression systems.",
  },
  {
    id: "ds-kids-thinksmart",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Kids thinkSMART is a Mentor Interactive educational DS game, also released in Europe under localized learning-brand names. It is part of the handheld's child-focused brain-training wave, emphasizing age-appropriate exercises and repeatable skill activities rather than a story campaign. For collectors, the relevant context is its Conspiracy Entertainment development credit and its place among budget educational DS cartridges.",
  },
  {
    id: "ds-kikansha-thomas-ds-de-hajimeru-chiiku-gakushuu",
    sourceUrl: "https://ephemeralenigmascom.wordpress.com/2025/09/02/kikansha-thomas-ds-de-hajimeru-chiiku-gakushuu/",
    overview:
      "Kikansha Thomas DS de Hajimeru Chiiku Gakushuu is a Japan-only Thomas & Friends edutainment game from Rocket Company. It uses Thomas characters for early-childhood learning minigames rather than adventure exploration, matching the DS's role as a touchscreen learning device for very young players. It is best read as a licensed preschool education cartridge, distinct from action-oriented character games.",
  },
  {
    id: "ds-kikansha-thomas-kokugo-sansuu-eigo",
    sourceUrl: "https://tcrf.net/Kikansha_Thomas_-_DS_de_Hajimeru%3A_Kokugo_Sansuu_Eigo",
    overview:
      "Kikansha Thomas: Kokugo Sansuu Eigo is another Thomas & Friends learning title, focused on Japanese language, arithmetic, and English basics. The appeal is not traditional gameplay but using familiar train characters to guide simple study activities for children. The educational framing, Rocket Company credit, and Japan-only DS market are the main collector identifiers.",
  },
  {
    id: "ds-kikiite-hajimaru-eigo-kaiwa-training-kikitore",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/141229-kiite-hajimeru-eigo-kaiwa-training-kikitore",
    overview:
      "Kikiite Hajimaru: Eigo Kaiwa Training - KikiTore is a Benesse English-conversation training DS title for Japanese learners. The title's hook is listening-first practice, with players hearing English phrases and repeating or training comprehension instead of playing through a conventional game scenario. It belongs with the DS library's many Japan-only study tools and is best treated as language-learning software.",
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
    throw new Error(`Missing DS games: ${missing.map((entry) => entry.id).join(", ")}`);
  }

  const rows = [
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "ds",
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
  console.log(`Wrote ${entries.length} reviewed DS overviews to ${path.relative(rootDir, outputPath)}`);
}

main();
