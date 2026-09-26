const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-kawaii-kenshui-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority DS weak-template cleanup; original GCX editorial overview based on platform databases, specialist game databases, series documentation, and gameplay/release context.";

const entries = [
  {
    id: "ds-kawaii-koinu-ds-3",
    sourceUrl: "https://www.honestgamers.com/56287/ds/kawaii-koinu-ds-3/game.html",
    overview:
      "Kawaii Koinu DS 3 is MTO's 2010 Japan-only puppy-care sequel for Nintendo DS. It sits inside the long Kawaii virtual-pet line, where the appeal is daily care, cute presentation, and routine-based interaction with dogs rather than action stages or story missions. For collectors, it matters as a late DS entry in MTO's pet-simulation catalog and a companion piece to the Kawaii Koneko cat games.",
  },
  {
    id: "ds-kawaii-koneko-ds",
    sourceUrl: "https://www.honestgamers.com/56288/ds/kawaii-koneko-ds/game.html",
    overview:
      "Kawaii Koneko DS brings MTO's virtual-cat formula to Nintendo DS, using the handheld's touch screen for a slower pet-care loop built around cats, attention, and daily routine. It is closer to a lifestyle sim than a goal-heavy adventure, making it most relevant to collectors who follow Japanese DS animal-care releases and MTO's broader Kawaii pet series.",
  },
  {
    id: "ds-kawaii-koneko-ds-2",
    sourceUrl: "https://en.wikipedia.org/wiki/MTO_(entreprise)",
    overview:
      "Kawaii Koneko DS 2 continues MTO's cat-care line on Nintendo DS, following the same gentle virtual-pet structure as the first DS Koneko release. The draw is not dramatic mechanical reinvention; it is another Japan-only cartridge for players who enjoy caring for cats through short, repeatable sessions. It is best understood as part of MTO's larger Kawaii animal series alongside Koinu, Hamster, and later 3DS pet entries.",
  },
  {
    id: "ds-kawaii-koneko-ds-3",
    sourceUrl: "https://www.vgchartz.com/game/48038/kawaii-koneko-ds-3/",
    overview:
      "Kawaii Koneko DS 3 is the 2010 Nintendo DS follow-up in MTO's cat-focused virtual-pet branch. Like the earlier Koneko games, it emphasizes pet companionship, light management, and touch-screen interaction over challenge or story progression. Its collector value comes from being a late, Japan-only DS pet sim and the final DS entry in MTO's Kawaii Koneko line before the series moved to 3DS.",
  },
  {
    id: "ds-keiba-navi-uma-no-suke",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/141636-keiba-navi-umanosuke",
    overview:
      "Keiba Navi: Uma no Suke is Starfish's Japan-only Nintendo DS horse-racing support title from 2006. Rather than a flashy arcade racer, it belongs to the DS niche of hobbyist utilities and racing-analysis software, built around horse-racing information, reference use, and portable consultation. That makes it a specialist import for collectors interested in the DS library's nontraditional sports and data-driven releases.",
  },
  {
    id: "ds-keiba-navi-uma-no-suke-2",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_(J%E2%80%93P)",
    overview:
      "Keiba Navi: Uma no Suke 2 is Starfish SD's follow-up to the DS horse-racing navigation title, keeping the focus on racing information and hobbyist support rather than direct action play. It is part of the same Japan-only utility/sports pocket as the first Uma no Suke, aimed at players who want portable racing data and reference features. For the GCX library, it should read as a specialist horse-racing tool, not a conventional racing game.",
  },
  {
    id: "ds-keiji-j-b-harold-no-jikenbo-manhattan-requiem-and-kiss-of-murder",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/132600-keiji-jb-harold-no-jikenbo-manhattan-requiem-kiss-of-murder",
    overview:
      "Keiji J.B. Harold no Jikenbo: Manhattan Requiem & Kiss of Murder collects two J.B. Harold detective mysteries on Nintendo DS. The Manhattan Requiem case sends Harold to New York after the suspicious death of pianist Sarah Shields, while Kiss of Murder continues the series' slow-burn investigation style. Players should expect menu-driven detective work, interviews, clues, and visual-novel-style case progression rather than action.",
  },
  {
    id: "ds-keiji-j-b-harold-no-jikenbo-murder-club",
    sourceUrl: "https://en.wikipedia.org/wiki/J.B._Harold_Murder_Club",
    overview:
      "Keiji J.B. Harold no Jikenbo: Murder Club is the Nintendo DS remake of the first J.B. Harold murder-mystery adventure. It follows detective J.B. Harold through a procedural case built on questioning suspects, checking alibis, and piecing together evidence instead of reflex-based puzzles. Its importance comes from the series' early Japanese adventure-game history and the DS version's role in bringing that detective format to a portable screen.",
  },
  {
    id: "ds-keikishi-gunzou-presents-monoshiri-bakumatsu-ou",
    sourceUrl: "https://solarisjapan.com/products/keikishi-gunzou-presents-monoshiri-bakumatsu-ou",
    overview:
      "Keikishi Gunzou Presents: Monoshiri Bakumatsu-Ou is Global A Entertainment's Japan-only DS history/strategy release themed around the Bakumatsu period. It is less a shooter than a knowledge-focused historical title, tying the Rekishi Gunzou branding to portable study and quiz-like learning about late-Edo political upheaval. Collectors should view it as a niche Japanese history cartridge from the DS education/reference boom.",
  },
  {
    id: "ds-keitai-sousakan-7-ds-buddy-sequence",
    sourceUrl: "https://www.nintendoworldreport.com/game/17848/keitai-sousakan-7-ds-buddy-sequence-nintendo-ds",
    overview:
      "Keitai Sousakan 7 DS: Buddy Sequence adapts the Japanese live-action phone-hero series into a 2009 Nintendo DS action/adventure release. Its hook is the partnership between the human cast and sentient mobile-phone buddies, turning the show's gadget identity into portable missions and character-driven scenarios. It is mainly valuable as a licensed import for fans of the TV series and collectors tracking 5pb.'s DS catalog.",
  },
  {
    id: "ds-kekkaishi-karasumori-ayakashi-kidan",
    sourceUrl: "https://genkivideogames.com/nintendo-ds/kekkaishi-karasumori-ayakashi-kidan/",
    overview:
      "Kekkaishi: Karasumori Ayakashi Kidan is a DS action game based on the Kekkaishi anime and manga, built around Yoshimori's barrier techniques and battles against ayakashi. Stylus-driven attacks and supernatural encounters give it a more direct action feel than a menu-based licensed adventure. Its collector appeal comes from being the first DS Kekkaishi adaptation and a Japan-only Bandai Namco character-action release.",
  },
  {
    id: "ds-kekkaishi-kokubourou-shuurai",
    sourceUrl: "https://www.jeuxvideo.com/jeux/nintendo-ds/00021164-kekkaishi-kokubourou-shuurai.htm",
    overview:
      "Kekkaishi: Kokubourou Shuurai is the second Nintendo DS Kekkaishi action game, again putting players in the role of Yoshimori as he uses barrier magic to trap and destroy ayakashi. The Kokubourou subtitle points to a later conflict from the series, so the appeal is more story-specific than the first DS entry. It should be presented as a licensed demon-hunting action sequel for import and anime-game collectors.",
  },
  {
    id: "ds-keltis",
    sourceUrl: "https://en.wikipedia.org/wiki/Keltis",
    overview:
      "Keltis adapts Reiner Knizia's award-winning board game to Nintendo DS, turning card sequencing, path advancement, and risk/reward scoring into a portable strategy game. Players build colored runs in ascending or descending order, move stones along paths, and decide when a color is worth committing to before the deck runs out. It stands out in the DS library as a European board-game conversion rather than a typical handheld puzzle game.",
  },
  {
    id: "ds-kemeko-deluxe-ds-yome-to-meka-to-otoko-to-onna",
    sourceUrl: "https://en.wikipedia.org/wiki/Kemeko_Deluxe!",
    overview:
      "Kemeko Deluxe! DS: Yome to Meka to Otoko to Onna is a 2009 Nintendo DS game based on Masakazu Iwasaki's science-fiction romantic-comedy manga and anime. The source material's strange bride-robot premise and slapstick cast give the game its identity, while the DS release is a Japan-only licensed tie-in for fans of the short-lived anime period. It belongs with character-driven import oddities more than mainstream action showcases.",
  },
  {
    id: "ds-kenshui-tendo-doctor",
    sourceUrl: "https://fr.wikipedia.org/wiki/Kensh%C5%ABi_Tend%C5%8D_Dokuta",
    overview:
      "Kenshui Tendo Doctor is Spike's launch-window Nintendo DS medical simulation, released in Japan in 2004 before the Trauma Center series defined stylus surgery for many players. The player follows intern Tendo Dokuta through hospital conversations, patient diagnosis, and operation scenes where colleagues guide tool use and incision points. It is notable as an early DS attempt to turn the touch screen into a medical-drama interface.",
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
