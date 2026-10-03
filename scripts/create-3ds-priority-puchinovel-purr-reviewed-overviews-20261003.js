const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "3ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "3ds-priority-puchinovel-purr-reviewed-overviews-2026-10-03.csv"
);

const puchiSeriesSource = "https://gamefaqs.gamespot.com/3ds/746376-petit-novel-series-harvest-december/data";
const puchiSeriesNote =
  "Part of talestune's Petit Novel / Harvest December visual-novel series, a 13-story cycle set around Masaki Konno, Tagami, and month-by-month linked episodes.";

const reviewedOverviews = [
  {
    id: "3ds-puchi-novel-shikyuu-no-kugatsu",
    sourceUrl: puchiSeriesSource,
    overview:
      `Puchi Novel: Shikyuu no Kugatsu is one of talestune and Flyhigh Works' 2014 Japanese 3DS eShop chapters in the Petit Novel line. ${puchiSeriesNote} Its value for a catalog page is not broad 3DS ownership but exact chapter placement, Japanese eShop-only availability, visual-novel format, and how it relates to the later localized Petit Novel Series: Harvest December compilation.`,
  },
  {
    id: "3ds-puchi-novel-shingaku-no-shichigatsu",
    sourceUrl: puchiSeriesSource,
    overview:
      `Puchi Novel: Shingaku no Shichigatsu is Flyhigh Works and talestune's July-themed Nintendo 3DS eShop entry in the Petit Novel / Harvest December sequence. ${puchiSeriesNote} The useful collector context is its standalone Japanese download identity, visual-novel pacing, month-title structure, and the fact that the fuller Harvest December package later gathered these linked stories for western players.`,
  },
  {
    id: "3ds-puchi-novel-shukusai-no-hachigatsu",
    sourceUrl: puchiSeriesSource,
    overview:
      `Puchi Novel: Shukusai no Hachigatsu is a 2014 Japanese 3DS eShop visual-novel chapter from talestune, published by Flyhigh Works. ${puchiSeriesNote} It should be cataloged as a specific monthly chapter, not as a generic 3DS import: the important details are Japanese text, digital-only distribution, series order, and relation to Petit Novel Series: Harvest December.`,
  },
  {
    id: "3ds-puchi-novel-shuuren-no-juunigatsu",
    sourceUrl: puchiSeriesSource,
    overview:
      `Puchi Novel: Shuuren no Juunigatsu is talestune and Flyhigh Works' December-ending chapter for the Nintendo 3DS Petit Novel run. ${puchiSeriesNote} GameFAQs identifies the broader 3DS release as Adventure / Visual Novel, so the buyer-facing context is story completion, month-order naming, Japanese eShop availability, and how the episode fits the Harvest December arc.`,
  },
  {
    id: "3ds-puchi-novel-tatageki-no-gogatsu",
    sourceUrl: puchiSeriesSource,
    overview:
      `Puchi Novel: Tatageki no Gogatsu is a May-themed Nintendo 3DS eShop chapter in talestune's Petit Novel series, published in Japan by Flyhigh Works. ${puchiSeriesNote} This is a text-first visual-novel episode where Japanese language, download-only history, chapter sequence, and Harvest December series continuity matter more than conventional gameplay systems.`,
  },
  {
    id: "3ds-puchi-novel-zouyo-no-nigatsu",
    sourceUrl: "https://www.famitsu.com/news/201402/26048869.html",
    overview:
      "Puchi Novel: Zouyo no Nigatsu is Flyhigh Works and talestune's February chapter in the Petit Novel / Harvest December line for Nintendo 3DS. Famitsu covered its February 26, 2014 Japanese eShop release and credits talestune and Flyhigh Works, grounding it as a real download chapter rather than vague visual-novel filler. The important context is Japanese text, monthly story order, eShop-only availability, and its place in the Tagami-linked Harvest December cycle.",
  },
  {
    id: "3ds-puchicon-magazine-soukangou",
    sourceUrl: "https://www.famitsu.com/game/title/32627/reviews",
    overview:
      "Puchicon Magazine: Soukangou is SmileBoom's 2015 Japanese Nintendo 3DS download release tied to the Petit Computer / Puchicon creation scene. Famitsu lists the July 29, 2015 release and points to SmileBoom's special magazine page, making it closer to a creator-magazine/software showcase than a normal game. For collectors, exact Japanese title, SmileBoom origin, 3DS eShop distribution, and relationship to Puchicon programming culture are the useful details.",
  },
  {
    id: "3ds-puppies-3d",
    sourceUrl: "https://www.mobygames.com/game/99566/puppies-3d/releases/",
    overview:
      "Puppies 3D is MTO and Ubisoft's 2011 Nintendo 3DS puppy-care release. MobyGames records the North American 3DS release on November 8, 2011, with Ubisoft publishing and MTO development, separating it from Nintendo's own Nintendogs line. Its catalog value comes from the early-3DS pet-sim niche, Ubisoft packaging, MTO credit, and whether a copy is complete for players seeking a lightweight virtual-pet title.",
  },
  {
    id: "3ds-pure-chess",
    sourceUrl: "https://www.nintendo.com/es-es/Juegos/Programas-descargables-Nintendo-3DS/Pure-Chess--863242.html",
    overview:
      "Pure Chess is Ripstone's 2014 Nintendo 3DS eShop chess release, part of the same digital tabletop line that also reached Wii U and other platforms. Nintendo's European listing records the March 20, 2014 3DS launch, while Nintendo Life noted optional DLC for additional pieces and locations. It is best described as a digital chess presentation with rule-based play, eShop availability, DLC context, and region/language details carrying the listing.",
  },
  {
    id: "3ds-purr-pals-purrfection",
    sourceUrl: "https://gamefaqs.gamespot.com/3ds/637307-purr-pals-purrfection/data",
    overview:
      "Purr Pals: Purrfection is Brain Toys and THQ's 2012 Nintendo 3DS virtual-pet sim focused on kitten care. GameFAQs lists the 3DS version as Simulation / Virtual / Pet, with a May 12, 2012 North American release and later Australian and European dates. It belongs beside other casual pet-care titles, so breed choice, feeding, playing, 3DS packaging, region, and complete condition are the strongest buyer-facing details.",
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
    if (!game) throw new Error(`Missing 3DS game ${rewrite.id}`);
    return {
      platformSlug: "3ds",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority 3DS weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official, database, retail, and series reference checks.",
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
