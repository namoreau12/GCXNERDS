const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "wii.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "wii-priority-justdance-kamenrider-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "wii-just-dance-disney-party",
    sourceUrl: "https://en.wikipedia.org/wiki/Just_Dance:_Disney_Party",
    overview:
      "Just Dance: Disney Party is the Wii entry that folds Disney Channel, Disney movie, and park-song material into Ubisoft's Just Dance format. It matters as a family-focused spin-off rather than a numbered dance sequel: collectors should recognize the Land Ho! development credit, the Disney branding, and the song-list appeal that separates it from Just Dance Kids and the main annual releases.",
  },
  {
    id: "wii-just-dance-disney-party-2",
    sourceUrl: "https://en.wikipedia.org/wiki/Just_Dance:_Disney_Party_2",
    overview:
      "Just Dance: Disney Party 2 shifts the Disney dance concept toward Disney Channel shows and original movies such as Descendants, Teen Beach 2, Austin & Ally, Liv and Maddie, Violetta, and Girl Meets World. The Wii version is a late-system Ubisoft release, useful for collectors tracking family dance games, Disney tie-ins, and cross-generation releases that also appeared on Wii U and Xbox platforms.",
  },
  {
    id: "wii-k-pop-dance-festival",
    sourceUrl: "https://www.yesasia.com/global/k-pop-dance-festival-korea-version/1033217888-0-0-0-en/info.html",
    overview:
      "K-Pop Dance Festival is Skonec's Korea-exclusive Wii dance game, built around Korean pop hits rather than Ubisoft's Western Just Dance catalog. Its appeal is unusually specific for the Wii library: motion-controlled routines for songs associated with acts such as PSY, Big Bang, Kara, T-ara, 2NE1, BEAST, and Wonder Girls, making region, language, and complete Korean packaging central collector details.",
  },
  {
    id: "wii-k11-kommissare-im-einsatz",
    sourceUrl: "https://www.dewiki.de/Lexikon/K11_%E2%80%93_Kommissare_im_Einsatz",
    overview:
      "K11: Kommissare im Einsatz adapts the German Sat.1 police-procedural brand into a Wii mystery/adventure release from Sproing Interactive and SevenOne Intermedia. The appeal is regional-TV specificity: German-language case work, show recognition, and PAL availability define the value more than broad international name recognition.",
  },
  {
    id: "wii-kamen-rider-climax-heroes-fourze",
    sourceUrl: "https://gamefaqs.gamespot.com/wii/641362-kamen-rider-climax-heroes-fourze/data",
    overview:
      "Kamen Rider: Climax Heroes Fourze is Eighting and Bandai Namco's 2011 Wii/PSP fighting entry tied to Kamen Rider Fourze and the broader Heisei Rider crossover roster. It is a Japanese import for tokusatsu fans first, with the draw coming from Rider matchups, form changes, and franchise timing around Fourze rather than conventional arcade-fighting balance.",
  },
  {
    id: "wii-kamen-rider-climax-heroes-ooo",
    sourceUrl: "https://gamefaqs.gamespot.com/wii/605437-kamen-rider-climax-heroes-ooo/credit",
    overview:
      "Kamen Rider: Climax Heroes OOO is the 2010 Eighting-developed Climax Heroes sequel for Wii and PSP, adding OOO-era focus to Bandai Namco's Rider crossover fighter. Collectors should treat it as a Japan-focused character fighting release where roster era, exact subtitle, and platform matter, especially when comparing it with Climax Heroes W, Fourze, and Super Climax Heroes.",
  },
  {
    id: "wii-kamen-rider-climax-heroes-w",
    sourceUrl: "https://www.mobygames.com/game/62633/kamen-rider-climax-heroes-w/",
    overview:
      "Kamen Rider: Climax Heroes W brings the Climax Heroes fighting format to Wii with a release timed around Kamen Rider W. MobyGames describes it as an updated version adding new playable characters and a mission-based Climax Mode set in the W world, so the cartridge is best understood as a franchise-roster update for import tokusatsu collectors.",
  },
  {
    id: "wii-kamen-rider-dragon-knight",
    sourceUrl: "https://www.mobygames.com/game/90080/kamen-rider-dragon-knight/",
    overview:
      "Kamen Rider: Dragon Knight is the North American Wii fighting game for the live-action Dragon Knight adaptation, published by D3Publisher and developed by Eighting. It is notable because the Wii version connects mechanically to the same studio lineage as Climax Heroes, while its marketplace identity is different: English branding, Dragon Knight characters, and U.S. release context instead of a Japanese Heisei Rider import.",
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
        "Priority Wii weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus public database, retail, official, and specialist reference sources.",
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
