const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "wii.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "wii-priority-idol-kidz-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "wii-karaoke-revolution-presents-american-idol-encore-2",
    sourceUrl: "https://www.mobygames.com/game/85738/karaoke-revolution-presents-american-idol-encore-2/",
    overview:
      "Karaoke Revolution Presents: American Idol Encore 2 is Blitz Games and Konami's 2008 follow-up to the American Idol-branded Karaoke Revolution line. MobyGames lists Wii alongside PlayStation 3 and Xbox 360, and the game keeps the singing-performance focus while leaning on Idol presentation, judging, and microphone play. Listings should separate Encore 2 from the first Encore disc and state whether the Wii microphone bundle is complete.",
  },
  {
    id: "wii-kart-racer",
    sourceUrl: "https://gamefaqs.gamespot.com/wii/997705-kart-racer/data",
    overview:
      "Kart Racer is Brain in a Jar's budget Wii racing release, published by Nordic Games in Europe and Maximum Family Games in North America. GameFAQs release data identifies it as an arcade-style racing game with one-to-two-player local play and no online multiplayer. Its practical collector context is exact regional packaging, publisher variant, Racing Wheel bundle status, and expectations closer to budget kart racing than to Nintendo's Mario Kart line.",
  },
  {
    id: "wii-katekyo-hitman-reborn-dream-hyper-battle",
    sourceUrl: "https://www.mobygames.com/game/67464/katekyo-hitman-reborn-dream-hyper-battle/",
    overview:
      "Katekyō Hitman Reborn! Dream Hyper Battle! is Marvelous Entertainment's Wii arena fighter based on the Reborn! anime. MobyGames describes a 3D fighting game with episode scenes, dialogue, and a roster including Tsunayoshi Sawada, Hayato Gokudera, Takeshi Yamamoto, Hibari, Dino, Lancia, and Varia-era characters. The Wii release is a Japanese import where region, anime familiarity, and subtitle accuracy matter more than broad fighting-game reputation.",
  },
  {
    id: "wii-kawasaki-quad-bikes",
    sourceUrl: "https://www.mobygames.com/game/30292/kawasaki-quad-bikes/",
    overview:
      "Kawasaki Quad Bikes is Data Design Interactive's licensed ATV racing game for Wii and Windows, with MobyGames separating it from the studio's other Kawasaki-branded racers. It is a straightforward off-road budget racer rather than a stunt showcase or simulation brand pillar. Marketplace listings should make the Kawasaki license, Wii region, publisher label, and loose-versus-complete condition clear because nearby Data Design racing releases are easy to confuse.",
  },
  {
    id: "wii-kawasaki-snowmobiles",
    sourceUrl: "https://www.mobygames.com/game/30245/kawasaki-snowmobiles/",
    overview:
      "Kawasaki Snowmobiles is Data Design Interactive's snowmobile racing entry, released on Wii after its Windows version. MobyGames identifies the Wii release under Popcorn Arcade, with six tracks, four selectable characters, and behind-view racing built around the Kawasaki license. It should be cataloged as a separate vehicle racer from Kawasaki Quad Bikes and Kawasaki Jet Ski, with region and publisher imprint doing much of the identification work.",
  },
  {
    id: "wii-kekkaishi-kokuboro-no-kage",
    sourceUrl: "https://en.wikipedia.org/wiki/Kekkaishi#Video_games",
    overview:
      "Kekkaishi: Kokubōrō no Kage is a 2007 Japan-only Wii game from Namco Bandai tied to Yellow Tanabe's Kekkaishi manga and anime franchise. Its value is mostly franchise-specific: players need comfort with Japanese text and interest in the Kokubōrō story material rather than a generic action-game pitch. Useful listings should spell the subtitle carefully, note the Japanese Wii region, and distinguish it from the DS Kekkaishi releases.",
  },
  {
    id: "wii-kevin-van-dam-s-big-bass-challenge",
    sourceUrl: "https://www.gametdb.com/Wii/SKVE20",
    overview:
      "Kevin Van Dam's Big Bass Challenge is Digital Embryo and Zoo Games' Wii fishing title built around professional angler Kevin VanDam's name. GameTDB lists the Wii disc as SKVE20 and identifies Digital Embryo as developer, giving collectors a concrete way to verify the release. The important context is licensed bass-fishing branding, North American Wii format, casual sports positioning, and whether manual and case condition match the disc.",
  },
  {
    id: "wii-kid-adventures-sky-captain",
    sourceUrl: "https://www.esrb.org/ratings/28880/kid-adventures-sky-captain/",
    overview:
      "Kid Adventures: Sky Captain is a Torus Games and D3Publisher Wii flight adventure for younger players. The ESRB describes piloting a cartoony airplane, flying through tunnels and rings, popping balloons, and shooting water balloons at rival planes for points. That makes it more specific than a generic kids' minigame disc: listings should call out the airplane theme, E-rated cartoon action, Wii region, and whether buyers are getting the D3Publisher version.",
  },
  {
    id: "wii-kid-fit-island-resort",
    sourceUrl: "https://gamefaqs.gamespot.com/wii/606325-kid-fit-island-resort/data",
    overview:
      "Kid Fit Island Resort is a Wii exercise and fitness minigame collection with island-themed activities. GameFAQs release data lists balance-board support and describes catching coconuts, surfing, dancing around a bonfire, and other aerobic or balance activities. It is best presented as a family fitness title rather than a full sports sim, with accessory support, region, rating, and complete packaging doing the useful marketplace work.",
  },
  {
    id: "wii-kidz-bop-dance-party-the-video-game",
    sourceUrl: "https://gamefaqs.gamespot.com/wii/995195-kidz-bop-dance-party-the-video-game/data",
    overview:
      "Kidz Bop: Dance Party! - The Video Game is D3Publisher and Art Co.'s 2010 Wii dance release built around the Kidz Bop music brand. GameFAQs notes 24 Kidz Bop versions of pop songs, including tracks such as \"Paparazzi,\" \"Party in the USA,\" and \"Thriller.\" Collector notes should identify it as the Kidz Bop dance disc, separate it from ordinary karaoke titles, and mention Wii region, song-brand appeal, and family-play condition.",
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
        "Priority Wii weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus MobyGames, GameFAQs, GameTDB, ESRB, and franchise reference checks.",
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
