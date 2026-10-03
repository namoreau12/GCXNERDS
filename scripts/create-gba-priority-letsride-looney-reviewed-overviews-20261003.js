const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "gba.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "gba-priority-letsride-looney-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "gba-let-s-ride-sunshine-stables",
    sourceUrl: "https://www.mobygames.com/game/206288/lets-ride-sunshine-stables/",
    overview:
      "Let's Ride! Sunshine Stables is Independent Arts Software's Game Boy Advance horse-care and riding game, published in North America by THQ as part of the Let's Ride line. MobyGames connects it with regional names such as Pippa Funnell: Stable Adventure and Pferd & Pony: Mein Pferdehof, which explains why title variants are easy to mix up. The GBA release centers on caring for horses, grooming and feeding them, then riding through outdoor courses and jump practice.",
  },
  {
    id: "gba-licca-chan-no-oshare-nikki",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Game_Boy_Advance_games",
    overview:
      "Licca-chan no Oshare Nikki is Marvelous Entertainment's 2004 Japan-only Game Boy Advance fashion and character game based on Takara's Licca-chan doll brand. The broader Licca-chan media history makes the release more meaningful than a generic dress-up title: it belongs to a long-running Japanese toy and character line with later handheld appearances. Its appeal rests on fashion-diary presentation, Japanese text, doll-brand collecting, and its place among GBA lifestyle imports.",
  },
  {
    id: "gba-lilliput-oukoku-lillimoni-to-issho-puni",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Game_Boy_Advance_games",
    overview:
      "Lilliput Oukoku: Lillimoni to Issho-puni! is Sega and Alpha Unit's 2004 Japan-only Game Boy Advance release. GBA catalog records list Alpha Unit as developer and Sega as publisher, putting it in the handheld's import-heavy character and lifestyle corner rather than the platform's better-known action catalog. The important context is exact Japanese title spelling, Sega publishing, Alpha Unit credit, language dependence, and whether a collector is seeking the original boxed import.",
  },
  {
    id: "gba-little-buster-q",
    sourceUrl: "https://www.gamesdatabase.org/game/nintendo-game-boy-advance/little-buster-q",
    overview:
      "Little Buster Q is Tomy and Amedio's 2002 Japan-only Game Boy Advance role-playing game. Games Database describes a story about boys tied to elemental attributes such as fire, water, earth, lightning, and wind, assembled as Little Busters to solve the mystery of the Holy Spirit Q. It is a niche handheld RPG import where the isometric presentation, Japanese story text, Tomy publishing, Amedio development, and character-party premise define the release.",
  },
  {
    id: "gba-little-league-baseball-2002",
    sourceUrl: "https://www.mobygames.com/game/153695/little-league-baseball-2002/",
    overview:
      "Little League Baseball 2002 is Handheld Games and NewKidCo's Game Boy Advance baseball title built around the official Little League Baseball license. MobyGames identifies the March 2002 GBA release and frames it around youth baseball rather than MLB simulation. The game matters as a compact licensed baseball entry for the handheld, with Little League branding, season-year title, North American NewKidCo publishing, and straightforward portable sports play carrying the identity.",
  },
  {
    id: "gba-little-patissier-cake-no-oshiro",
    sourceUrl: "https://www.suruga-ya.jp/product/detail/175000722?tenpo_cd=400526",
    overview:
      "Little Patissier: Cake no Oshiro is MTO's 2004 Japan-only Game Boy Advance confectionery-themed release. Japanese retail references list the December 16, 2004 release, MTO publisher credit, and AGB-P-BLIJ product code, grounding it as a real late GBA import rather than a generic food minigame label. Its collector profile comes from the bakery/cake theme, Japanese text, MTO's niche handheld catalog, and the value of complete box and manual materials.",
  },
  {
    id: "gba-lizzie-mcguire-2-lizzie-diaries",
    sourceUrl: "https://www.gamestop.com/video-games/retro-gaming/products/lizzie-mcguire-2-lizzie-diaries---game-boy-advance/432275.html",
    overview:
      "Lizzie McGuire 2: Lizzie Diaries is a Game Boy Advance Disney Channel tie-in from Disney Interactive, THQ, and Climax. Retail descriptions frame the story around Lizzie recovering stolen diary pages before Matt can embarrass her, keeping it close to the show's school-life comedy instead of a generic licensed platformer. It is a character-driven handheld adventure/minigame release where Disney branding, diary premise, GBA-era show fandom, and North American packaging distinguish it.",
  },
  {
    id: "gba-lizzie-mcguire-3-homecoming-havoc",
    sourceUrl: "https://www.mobygames.com/game/21170/lizzie-mcguire-3-homecoming-havoc/",
    overview:
      "Lizzie McGuire 3: Homecoming Havoc is Climax LA and Disney Interactive's 2005 Game Boy Advance sequel built around Lizzie's attempt to beat Kate for Homecoming Queen. MobyGames describes a rapid sequence of short minigames with WarioWare-like pacing, making it different from a normal story platformer. The useful context is Disney Channel license, Climax development, homecoming-themed premise, quick minigame structure, and its position as the third GBA Lizzie McGuire title.",
  },
  {
    id: "gba-lizzie-mcguire-on-the-go",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Game_Boy_Advance_games",
    overview:
      "Lizzie McGuire: On the Go is Digital Eclipse's Game Boy Advance Lizzie McGuire release, published by Disney Interactive and THQ. GBA catalog data identifies the North American On the Go title and the PAL Lizzie McGuire variant, which makes regional naming important for collectors. It is best understood as an early handheld Disney Channel tie-in built around Lizzie's personality, short portable activities, show recognition, and Digital Eclipse's licensed-game development work.",
  },
  {
    id: "gba-looney-tunes-double-pack",
    sourceUrl: "https://wayforward.com/gameography/",
    overview:
      "Looney Tunes Double Pack combines Looney Tunes: Dizzy Driving and Looney Tunes: Acme Antics on one Game Boy Advance cartridge. WayForward's gameography lists the Double Pack under 2005 with WayForward, Warner Bros. Interactive, Majesco, and THQ credits, while GameFAQs identifies the GBA release under the Dizzy Driving / Acme Antics subtitle. It is a multicart-style licensed compilation where the included games, Looney Tunes brand, publisher variant, and complete packaging matter more than a single standalone title identity.",
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
    if (!game) throw new Error(`Missing GBA game ${rewrite.id}`);
    return {
      platformSlug: "gba",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority GBA weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus MobyGames, publisher/developer, regional catalog, retail, and franchise reference checks.",
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
