const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-kino-kita-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-kino-no-tabi-ii-the-beautiful-world",
    sourceUrl: "https://kotaku.com/games/kino-no-tabi-ii-the-beautiful-world",
    overview:
      "Kino no Tabi II: The Beautiful World is the second PlayStation 2 visual novel/adventure adaptation of Keiichi Sigsawa's Kino's Journey light novels. Source summaries note that it adapts material from the novels, adds an original scenario written by Sigsawa, and was bundled with a 36-page book containing that original story. GCX should describe it as a literary, episodic travel-story visual novel focused on Kino and Hermes moving through morally strange countries, not a route-heavy romance VN or action game.",
  },
  {
    id: "ps2-kino-no-tabi-the-beautiful-world",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25248.html",
    overview:
      "Kino no Tabi: The Beautiful World is the first PlayStation 2 visual novel/adventure game based on Kino's Journey. PSXDataCenter and series sources describe Kino traveling with the talking motorcycle Hermes through different countries and forests, with most of the first game's story adapted from early light-novel volumes plus one scenario written specifically for the game by Keiichi Sigsawa. GCX should frame it as a philosophical episodic adaptation, where the appeal is tone, writing, and source-faithful atmosphere.",
  },
  {
    id: "ps2-kira-kira-rock-n-roll-show",
    sourceUrl: "https://www.igdb.com/games/kira-kira-rocknroll-show",
    overview:
      "Kira * Kira: Rock 'n' Roll Show is the PlayStation 2 port of OVERDRIVE's Kira Kira, published by PrincessSoft in Japan on February 26, 2009. Catalog records describe it as a music/visual-novel release rather than a conventional band game, with the PS2 version adapting the rock-band story for a console audience. GCX should position it as a punk/rock-themed narrative import where music culture, band drama, and visual-novel pacing are the draw, not rhythm-game performance mechanics.",
  },
  {
    id: "ps2-kirikou-et-les-betes-sauvages",
    sourceUrl: "https://fr.wikipedia.org/wiki/Kirikou_et_les_B%C3%AAtes_sauvages_%28jeu_vid%C3%A9o%29",
    overview:
      "Kirikou et les Betes sauvages is a 2007 PlayStation 2 platform game from Wizarbox and Emme Interactive, adapted from Michel Ocelot's 2005 animated film. French coverage describes a single-player platformer for young children, organized into 30 levels grouped by episodes and mixed with mini-games such as memory, chase, and 'Un, deux, trois, soleil' activities. GCX should present it as a children's licensed platformer rather than a general adventure game, with PAL-region and French animation context as the collector hooks.",
  },
  {
    id: "ps2-kiruto-anata-to-tsumugu-yume-to-koi-no-dress",
    sourceUrl: "https://www.play-asia.com/pl/kiruto-anata-to-tsumugu-yume-to-koi-no-dress-limited-edition/13/701vjf",
    overview:
      "Kiruto: Anata to Tsumugu Yume to Koi no Dress is a Japan-only PlayStation 2 visual novel from Nine'sFox, released in 2007. Play-Asia's limited-edition listing identifies the PS2 compatibility and notes bundled goods such as a music CD with the PS2 theme song and a mini setting-material calendar, while soundtrack records confirm Nine'sFox development and publishing. GCX should describe it as a romance/story import where collector interest centers on edition contents, packaging completeness, and its small-publisher PS2 visual-novel niche.",
  },
  {
    id: "ps2-kishin-houkou-demon-bane",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66379.html",
    overview:
      "Kishin Houkou Demonbane is the PlayStation 2 port/remake of Nitroplus' Demonbane visual novel, published by Kadokawa on July 1, 2004. PSXDataCenter and series records describe it as the console version of the mecha-and-Cthulhu Mythos story, with a one-episode OVA bundled with the PS2 release and later manga/anime adaptations using the same title. GCX should correct the action-game framing and present it as a major Nitroplus visual-novel import with mecha, occult, and franchise-adaptation appeal.",
  },
  {
    id: "ps2-kita-e-diamond-dust-kiss-is-beginning",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65569.html",
    overview:
      "Kita e Diamond Dust+ Kiss is Beginning is Hudson Soft's 2004 PlayStation 2 sequel to Kita e. Diamond Dust in the Hokkaido-set romance/adventure series. PSXDataCenter and series records place it after the Dreamcast original and the 2003 PS2 Diamond Dust release, with the Diamond Dust games also feeding into the Diamond Daydreams anime adaptation. GCX should describe it as a romantic communication/visual-novel sequel focused on Hokkaido character stories, not as a strategy game.",
  },
  {
    id: "ps2-kita-e-diamond-dust-volume-summer",
    sourceUrl: "https://www.play-asia.com/en/kita-e-diamond-dust-volume-summer/13/702tl",
    overview:
      "Kita e. Diamond Dust Volume Summer is a PlayStation 2 side release in Hudson Soft's Hokkaido-set Kita e series. Play-Asia describes Diamond Dust as the sequel to the Dreamcast adventure Kita e White Illumination and says Volume Summer tells stories of different people who meet in Hokkaido by coincidence and change, with character design by Nocchi and coordination by Sakura Wars creator Ouji Hiroi. GCX should frame it as a seasonal romance/adventure visual novel built around location, character vignettes, and Kita e series continuity.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on catalog, platform database, franchise, and product sources.",
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
