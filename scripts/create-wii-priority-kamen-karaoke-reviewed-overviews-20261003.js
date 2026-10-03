const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "wii.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "wii-priority-kamen-karaoke-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "wii-kamen-rider-super-climax-heroes",
    sourceUrl: "https://www.8ing.co.jp/titles/sch-rider/",
    overview:
      "Kamen Rider: Super Climax Heroes is Eighting's 2012 Wii and PSP hero-action fighter for Namco Bandai, built around the long-running tokusatsu license. The Wii entry adds 360-degree movement, Rider Arts attacks, and a roster that reaches Kamen Rider Wizard while pulling from popular Heisei-era riders. It is a Japanese import first, so region compatibility, character familiarity, and complete Bandai Namco packaging matter more than ordinary fighting-game labels.",
  },
  {
    id: "wii-kanken-wii-kanji-ou-kettei-sen",
    sourceUrl: "https://www.nintendo.co.jp/wii/software/rknj/index.html",
    overview:
      "Kanken Wii: Kanji Ou Kettei Sen is Rocket Company's officially licensed Kanji Kentei Wii release from December 27, 2007. Nintendo's listing frames it as a kanji-variety party game for one to four players, using Wii Remote play, board-game movement, difficulty settings, handicaps, and comeback cards. It is useful to collectors as a Japanese educational-party cartridge, not as a normal language trainer for importers without Japanese reading comfort.",
  },
  {
    id: "wii-karaoke-joysound",
    sourceUrl: "https://www.nintendo.co.jp/wii/software/rokj/index.html",
    overview:
      "Karaoke Joysound is Hudson Soft and Xing's 2008 Wii adaptation of the Japanese JOYSOUND karaoke service. The retail version was sold around USB microphone play and online access to a much larger song catalog than the disc alone could represent, with Nintendo later noting the series' online services ended on April 26, 2018. Marketplace listings should separate the physical bundle from WiiWare-style access and mention whether microphones are included.",
  },
  {
    id: "wii-karaoke-joysound-dx",
    sourceUrl: "https://xing.co.jp/archives/2445",
    overview:
      "Karaoke Joysound DX is the 2009 expanded Wii follow-up from Hudson Soft and Xing, advertised as a fuller home-karaoke package with the dedicated USB Microphone DX. It belongs to the same service-driven JOYSOUND line, so the disc's historical value is now different from its original online catalog promise. For collectors, the DX subtitle, Japanese region, microphone bundle, and post-service-shutdown expectations are the key details.",
  },
  {
    id: "wii-karaoke-joysound-enka",
    sourceUrl: "https://xing.co.jp/archives/2460",
    overview:
      "Karaoke Joysound: Enka is Hudson Soft and Xing's 2010 Wii spinoff focused on enka and kayokyoku standards. It was announced alongside a duet-song edition as a way to bring familiar karaoke-room material into the living room on Wii. The narrow song focus is the whole point: listings should identify it as the Enka/Kayokyoku edition, note Japanese-region use, and avoid treating it as interchangeable with the main Joysound Wii disc.",
  },
  {
    id: "wii-karaoke-joysound-super-dx-hitori-de-minna-de-utai-houdai",
    sourceUrl: "https://www.nintendo.co.jp/wii/software/s3sj/index.html",
    overview:
      "Karaoke Joysound: Super DX: Hitori de Minna de Utai Houdai! is the December 9, 2010 Wii entry in Hudson and Xing's home-karaoke line. Nintendo's page ties it to a richer Joysound Wii Super DX setup, including companion DSiWare song-navigation support. It is best cataloged as a late Japanese karaoke-service disc where region, USB microphone support, companion features, and ended online services define the practical value.",
  },
  {
    id: "wii-karaoke-revolution-glee",
    sourceUrl: "https://www.mobygames.com/game/57387/karaoke-revolution-glee/",
    overview:
      "Karaoke Revolution Glee is Konami and Hijinx Studios' 2010 Wii karaoke release built around the television series' first wave of performances. MobyGames lists it as a Wii music/rhythm title with one-to-four-player support, and the game uses Glee clips and songs rather than a generic pop catalog. Its collector identity comes from the Glee license, Konami microphone compatibility, North American Wii release, and exact first-volume packaging.",
  },
  {
    id: "wii-karaoke-revolution-glee-volume-2",
    sourceUrl: "https://www.mobygames.com/game/59926/karaoke-revolution-glee-volume-2/",
    overview:
      "Karaoke Revolution Glee: Volume 2 is the 2011 Wii sequel from Konami and Hijinx Studios, continuing the TV-license karaoke format with another batch of Glee performances. It is not a content update to the first disc; it is a separate retail volume with its own song selection and packaging. Trading notes should call out Volume 2 clearly, check microphone inclusion, and distinguish it from the original and Volume 3.",
  },
  {
    id: "wii-karaoke-revolution-glee-volume-3",
    sourceUrl: "https://www.mobygames.com/game/60262/karaoke-revolution-glee-volume-3/releases/wii/",
    overview:
      "Karaoke Revolution Glee: Volume 3 is the third Konami and Hijinx Studios Glee karaoke release, with MobyGames listing a November 22, 2011 Wii release and microphone-bundle packaging. By this point the series was a collector set of separate song discs rather than a single expandable platform. The useful listing signals are Volume 3, Wii microphone support, bundle completeness, and North American retail condition.",
  },
  {
    id: "wii-karaoke-revolution-presents-american-idol-encore",
    sourceUrl: "https://gamefaqs.gamespot.com/wii/944441-karaoke-revolution-presents-american-idol-encore/data",
    overview:
      "Karaoke Revolution Presents: American Idol Encore is Blitz Games and Konami's 2008 Wii singing game built around the American Idol presentation. GameFAQs release data describes a February 5, 2008 Wii launch and highlights a new engine, Idol-style judging, and 40 songs from multiple decades. Its identity is the American Idol license layered onto Karaoke Revolution pitch scoring, with microphone bundle status and platform edition doing most of the marketplace sorting.",
  },
];

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

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = reviewedOverviews.map((rewrite) => {
    const game = byId.get(rewrite.id);
    if (!game) throw new Error(`Missing Wii game ${rewrite.id}`);
    return {
      platformSlug: "wii",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Wii weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus publisher, developer, platform-holder, and public database references.",
      newOverview: rewrite.overview,
      reviewStatus: "reviewed",
      reviewer: "Games Exchange editorial cleanup",
    };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );
  console.log(JSON.stringify({ ok: true, outputPath: path.relative(rootDir, outputPath), rows: rows.length }, null, 2));
}

main();
