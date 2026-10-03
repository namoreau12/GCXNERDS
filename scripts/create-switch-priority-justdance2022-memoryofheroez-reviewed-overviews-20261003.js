const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "switch.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "switch-priority-justdance2022-memoryofheroez-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "switch-just-dance-2022",
    sourceUrl: "https://news.ubisoft.com/en-us/article/2F9KYvKq6dUNPkFqwAOF9p/just-dance-2022-is-out-now",
    overview:
      "Just Dance 2022 is Ubisoft's annual dance-rhythm release for Switch and other platforms, built around motion-scored routines, party play, and a fresh base-game song list. Ubisoft's launch coverage points players to the 2022 tracklist, the Controller App, and Just Dance Unlimited, so listings should separate cartridge content from subscription extras. The important buyer notes are edition, region, physical versus digital format, and whether online music services are still expected.",
  },
  {
    id: "switch-just-dance-2023-edition",
    sourceUrl: "https://www.ubisoft.com/en-us/game/just-dance/2023",
    overview:
      "Just Dance 2023 Edition marks Ubisoft's shift into the newer Just Dance platform model on Switch, PlayStation 5, and Xbox Series X|S. Ubisoft describes it around 40 songs, online multiplayer, personalization, immersive 3D worlds, and Just Dance+ support, which makes ownership and service access more important than in older cartridge-first entries. Listings should call out Switch format, code-in-box versus digital ownership, account requirements, and included edition.",
  },
  {
    id: "switch-just-dance-2024-edition",
    sourceUrl: "https://news.ubisoft.com/en-us/article/4XASVBQVlNLtGtyO6fj1DQ/just-dance-2024-edition-song-list-and-new-mode-details",
    overview:
      "Just Dance 2024 Edition is Ubisoft's Switch dance release for the 2024 song set, launched for Switch, PS5, and Xbox Series X|S. Ubisoft promoted it through song-list reveals, new mode details, and Just Dance+ integration, so the real marketplace distinction is access to the 2024 edition content inside the modern Just Dance app. Listings should be explicit about download codes, account redemption, subscription trials, and whether the code has already been used.",
  },
  {
    id: "switch-justice-league-cosmic-chaos",
    sourceUrl: "https://outrightgames.com/launches/chaos-has-arrived-dcs-justice-league-cosmic-chaos-available-now-on-consoles-and-pc/",
    overview:
      "DC's Justice League: Cosmic Chaos is Outright Games and PHL Collective's family-friendly action-adventure built around Superman, Batman, Wonder Woman, and a stylized Happy Harbor setting. Outright's launch materials emphasize a new art style and identity for DC's heroes, so the game should be framed as an accessible licensed adventure rather than a generic Switch import. Listings should note platform, region, physical condition, and whether buyers expect local co-op or solo superhero play.",
  },
  {
    id: "switch-jydge",
    sourceUrl: "https://www.nintendo.com/de-ch/Spiele/Nintendo-Switch-Download-Software/JYDGE-1288101.html",
    overview:
      "JYDGE is 10tons' top-down twin-stick shooter for Nintendo Switch, released as downloadable software in 2017. It belongs to the same hard-edged action lineage as Neon Chrome, with mission objectives, weapon customization, and replayable room-clearing built around fast tactical shooting. For Switch listings, the key details are digital availability, region, 10tons publisher context, and whether the buyer is looking for arcade shooter runs rather than a boxed retail release.",
  },
  {
    id: "switch-kaleidoscope-of-phantom-prison",
    sourceUrl: "https://entergram.co.jp/gerokasu/outline.html",
    overview:
      "Kaleidoscope of Phantom Prison is Entergram and 07th Expansion's Japanese visual novel for Switch, also known by its Japanese title Gensou Rougoku no Kaleidoscope. The official site presents it as a new Ryukishi07 story, which places it closer to psychological mystery and visual-novel collecting than to action or RPG play. Listings should flag Japanese language dependence, platform, edition, bonus material, and whether buyers are following Ryukishi07 or 07th Expansion releases.",
  },
  {
    id: "switch-kamen-rider-climax-scramble-zi-o",
    sourceUrl: "https://rider-csz.bn-ent.net/",
    overview:
      "Kamen Rider: Climax Scramble Zi-O is Bandai Namco's Nintendo Switch arena-action entry for Kamen Rider fans, released in Japan and Asian markets. The official site centers the Zi-O branding and Switch platform, while Asian release coverage highlighted English subtitle availability in some versions. Listings should distinguish Japanese and Asian English releases, note region and subtitle expectations, and make clear that this is a Kamen Rider character-battle game, not a general superhero brawler.",
  },
  {
    id: "switch-kamen-rider-memory-of-heroez",
    sourceUrl: "https://www.nintendo.com/sg/games/switch/detail/70010000021857",
    overview:
      "Kamen Rider: Memory of Heroez is Bandai Namco's Switch and PS4 action-adventure built around an original crossover story for Kamen Rider W, OOO, and Zero-One. Nintendo Singapore's listing emphasizes the original story and the riders' justice, while Bandai Namco's official site shows standard and Premium Sound Edition options. Collectors should note language and regional release, edition, soundtrack-content expectations, and whether the copy is physical or digital.",
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
    if (!game) throw new Error(`Missing Switch game ${rewrite.id}`);
    return {
      platformSlug: "switch",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Switch weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus official publisher, platform holder, developer, and launch references.",
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
