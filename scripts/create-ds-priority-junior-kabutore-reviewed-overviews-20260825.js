const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-junior-kabutore-reviewed-overviews-2026-08-25.csv"
);

const entries = [
  {
    gameId: "ds-junior-brain-trainer-math-edition",
    sourceUrl: "https://www.esrb.org/ratings/29953/junior-brain-trainer-math-edition/",
    newOverview:
      "Junior Brain Trainer: Math Edition is a child-focused math puzzle game for Nintendo DS built around short arithmetic drills rather than general brain-training abstraction. Players complete equations, order numbers, use abacus-style tasks, and clear activities tied together by a light mad-scientist rescue story. GCX should present it as an educational DS title for younger players, with its value coming from math practice, quick sessions, and Maximum Family Games-era budget software history.",
  },
  {
    gameId: "ds-junior-classic-games",
    sourceUrl: "https://www.vgchartz.com/game/36929/junior-classic-games/",
    newOverview:
      "Junior Classic Games is an Avanquest/Uacari collection of 30 kid-friendly activities framed around an Animal World setting. The package mixes arcade, music, puzzle, logic, memory, and number challenges, with adjustable difficulty and medal rewards giving children simple goals to chase. GCX should describe it as a broad early-learning compilation, useful for collectors because the North American Virtual Play release and European Avanquest release are easy to confuse.",
  },
  {
    gameId: "ds-junior-island-adventure",
    sourceUrl: "https://www.pricecharting.com/game/nintendo-ds/junior-island-adventure",
    newOverview:
      "Junior Island Adventure is a 2011 Maximum Family Games DS release aimed at younger players looking for a simple action-adventure format. Public data gives it an Everyone rating, one-player support, and compatibility with Nintendo 3DS, but does not support a deeper claim about complex systems or a major franchise tie. GCX should keep the overview honest: this is a light children's adventure release, mainly relevant to DS set builders and family-game collectors.",
  },
  {
    gameId: "ds-junior-mystery-quest",
    sourceUrl: "https://www.esrb.org/ratings/31036/junior-mystery-quest/",
    newOverview:
      "Junior Mystery Quest is a hidden-object adventure where Rachel searches for her missing Uncle Alester through cluttered scenes, simple puzzles, and kid-safe mystery beats. The ESRB summary identifies object searches and puzzle progression, plus a mini-game where cannonballs sink pirate ships. GCX should frame it as a younger-player hidden-object game, notable because it brings the casual PC-style mystery format onto DS without the darker tone of many adult hidden-object adventures.",
  },
  {
    gameId: "ds-just-sing",
    sourceUrl: "https://www.bol.com/nl/nl/p/just-sing-nds/1004004011242254/",
    newOverview:
      "Just Sing! is Engine Software's handheld karaoke game for DS, DSi, and 3DS-era players, casting the player as an unknown singer trying to work toward pop-star status. It uses lyrics, voice input, performance scoring, and DSi camera features where available, making it a music game rather than the strategy title the old metadata implied. GCX should describe it as a portable karaoke experiment whose collector hook is the unusual attempt to make singing games work on Nintendo DS hardware.",
  },
  {
    gameId: "ds-just-sing-2",
    sourceUrl: "https://worthplaying.com/article/2012/1/10/news/84694-just-sing-vol-2-nds-full-tracklist-unveiled/",
    newOverview:
      "Just Sing! 2, also promoted as Just Sing! Vol. 2, expands Engine Software's DS karaoke formula with 19 pop tracks, improved pitch recognition, challenge modes, multiplayer, voice recording, and DSi camera video-wall features. Its appeal is specific: read lyrics, sing into the handheld, and try to stay on pitch with songs from artists such as Lady Gaga, Rihanna, Owl City, and Snow Patrol. GCX should treat it as the more developed sequel in the DS karaoke line.",
  },
  {
    gameId: "ds-just-sing-3",
    sourceUrl: "https://engine-software.com/?page_id=184",
    newOverview:
      "Just Sing! 3 is the later European DS entry in Engine Software's karaoke run, following the original Just Sing! and Volume 2. Source coverage is thinner than the second game, so GCX should avoid invented track-list claims and emphasize the verified identity: another portable singing title from Engine Software and PQube for players who wanted lyrics, performance scoring, and handheld karaoke without a living-room microphone setup. It belongs with DS music-game and PAL-region collector searches.",
  },
  {
    gameId: "ds-juushin-embu-ds",
    sourceUrl: "https://en.wikipedia.org/wiki/Hero_Tales",
    newOverview:
      "Juushin Embu DS is ThinkArts and D3 Publisher's 2007 Nintendo DS game based on Hero Tales, the manga/anime property associated with Hiromu Arakawa's character designs. That source context matters because it is not a racing game despite the weak metadata record. GCX should present it as a Japan-only licensed anime/manga adaptation, with collector value tied to the Hero Tales connection, D3 Publisher's DS catalog, and its November 2007 Japanese release.",
  },
  {
    gameId: "ds-juushinden-ultimate-beast-battlers",
    sourceUrl: "https://shonumi.github.io/articles/art23.html",
    newOverview:
      "Juushinden: Ultimate Beast Battlers is Konami's Japan-only DS card-battle game built around monster duels and the unusual Magic Reader peripheral. Players could scan physical cards into the game, turning the release into a hybrid of handheld software and real-card collecting. GCX should highlight that hardware hook clearly: it sits closer to Pokemon TCG or Yu-Gi-Oh-style battle collecting than a normal RPG, and complete copies with the reader matter more than loose cartridge listings.",
  },
  {
    gameId: "ds-k-1-world-gp",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Nintendo_DS_games_%28J%E2%80%93P%29",
    newOverview:
      "K-1 World GP is D3 Publisher's 2007 Japan-only DS take on the K-1 kickboxing brand. The safest public description is a licensed sports/fighting release built around tournament combat rather than a broad simulation of every combat sport. GCX should connect it to the K-1 World Grand Prix identity, where kickboxing matchups and elimination-style competition are the draw, and keep the collector note focused on its Japanese exclusivity and D3 Publisher catalog placement.",
  },
  {
    gameId: "ds-k3-en-de-vrolijke-noten",
    sourceUrl: "https://www.bol.com/nl/nl/p/k3-de-vrolijke-noten/1004004010722699/",
    newOverview:
      "K3 en de Vrolijke Noten is a Dutch-language Studio 100 DS game built around the Belgian-Dutch pop group K3. The story hook is simple and kid-facing: the musical notes have vanished shortly before a concert, and players help recover them through colorful tasks while dressing a favorite K3 member with the stylus. GCX should describe it as a licensed children's mini-game/music adventure, especially relevant to PAL collectors and Studio 100 fans.",
  },
  {
    gameId: "ds-k3-en-het-ijsprinsesje",
    sourceUrl: "https://www.mariods.nl/nintendo-ds-spel-info.php?Nintendo=K3_en_het_IJsprinsesje",
    newOverview:
      "K3 en het Ijsprinsesje is a Dutch Nintendo DS game tied to K3's fairy-tale film world, sending the group into a storybook setting with simple child-friendly activities. Listings describe tasks such as catching frogs, remembering their croaks, making sweets, and helping free the K3 girls from a fairy-tale danger. GCX should position it as a young-audience licensed mini-game adventure, not a rhythm title in the same sense as K3 Karaoke.",
  },
  {
    gameId: "ds-k3-fashion-party",
    sourceUrl: "https://www.mariods.nl/en/Nintendo-DS-game-information.php?Nintendo=K3_Fashion_Party",
    newOverview:
      "K3 Fashion Party is a dress-up and style-focused DS release where players buy clothes, use wardrobe options, and try to make a K3-themed character look as good as possible. Its appeal is fashion play, touch-screen customization, and the K3 license rather than timing-based music mechanics. GCX should present it as a PAL-region children's fashion game for Studio 100/K3 collectors, with Mindscape publishing context and simple styling-loop expectations.",
  },
  {
    gameId: "ds-k3-karaoke",
    sourceUrl: "https://www.pricecharting.com/game/pal-nintendo-ds/k3-karaoke",
    newOverview:
      "K3 Karaoke is the straightforward music entry among the DS K3 games, built around singing along to K3 songs with lyrics on screen and a kid-friendly presentation. PriceCharting identifies it as a PAL Nintendo DS music title from 2012 with Mindscape publishing and Engine Software development, while retailer descriptions emphasize recording and replaying your voice. GCX should label it as a children's karaoke release and separate it from the fashion and fairy-tale K3 spin-offs.",
  },
  {
    gameId: "ds-k11-kommissare-im-einsatz",
    sourceUrl: "https://usk.de/usktitle/27011/",
    newOverview:
      "K11: Kommissare im Einsatz is a German-language DS adventure based on the long-running Sat.1 crime docudrama about commissioners solving cases. USK classifies the game as a classic adventure with a 12+ rating, and German adventure coverage describes five cases involving Michael Naseband and Alexandra Rietz. GCX should frame it as a TV-license detective adventure for PAL collectors, where language and familiarity with the show matter more than universal pick-up-and-play appeal.",
  },
];

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = entries.map((entry) => {
    const game = byId.get(entry.gameId);
    if (!game) throw new Error(`Missing DS game: ${entry.gameId}`);
    return {
      platformSlug: "ds",
      gameId: entry.gameId,
      title: game.title,
      currentOverview: game.description || "",
      sourceUrl: entry.sourceUrl,
      rewriteNotes: "Priority DS weak-template cleanup; original GCX editorial overview based on ratings boards, platform databases, developer/publisher pages, retail metadata, and franchise context.",
      newOverview: entry.newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX editorial cleanup",
    };
  });

  const headers = [
    "platformSlug",
    "gameId",
    "title",
    "currentOverview",
    "sourceUrl",
    "rewriteNotes",
    "newOverview",
    "reviewStatus",
    "reviewer",
  ];
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.map(escapeCsv).join(",")}\n${rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );
  console.log(JSON.stringify({ outputPath, rowCount: rows.length }, null, 2));
}

main();
