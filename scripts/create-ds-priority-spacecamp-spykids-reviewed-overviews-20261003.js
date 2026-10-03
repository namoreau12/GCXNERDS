const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-spacecamp-spykids-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "ds-space-camp",
    sourceUrl: "https://www.mobygames.com/game/90319/space-camp/credits/nintendo-ds/",
    overview:
      "Space Camp is a 2009 Activision Value DS release from 7 Studios, tied to the broader Space Camp concept rather than a major console series. Its collector interest sits in the late-DS licensed and activity-game shelf: expect mission-flavored minigame structure, young-player presentation, and value-release packaging where region, completeness, and cartridge condition matter more than deep mechanical reputation.",
  },
  {
    id: "ds-spanisch-buddy",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/306016-spanisch-buddy",
    overview:
      "Spanisch Buddy is a Europe-only Deep Silver DS language-learning title from Spiral House, aimed at handheld Spanish practice rather than traditional game progression. For collectors, the important context is its educational-software identity: language audience, regional release, manual completeness, and classroom-style utility are the details that separate it from adventure, trivia, or minigame cartridges.",
  },
  {
    id: "ds-spectral-force-genesis",
    sourceUrl: "https://www.mobygames.com/game/90323/spectral-force-genesis/",
    overview:
      "Spectral Force Genesis brings Idea Factory's fantasy strategy series to DS with territory control, faction management, and large-scale conflict rather than character-action combat. It is useful to catalog as a niche tactical import/localized strategy release: the appeal is map pressure, army movement, and series curiosity for Idea Factory collectors, not the creature or lifestyle software that surrounds it alphabetically.",
  },
  {
    id: "ds-spectrobes",
    sourceUrl: "https://strategywiki.org/wiki/Spectrobes",
    overview:
      "Spectrobes is Disney Interactive and Jupiter's original DS creature-action RPG, built around excavating fossils, awakening Spectrobes, raising them, and using them in real-time battles. Its identity is stronger than a generic family-game label suggests: fossil cleaning, monster growth, wireless features, and the Disney-backed original IP push make it one of the DS library's notable Pokemon-adjacent experiments.",
  },
  {
    id: "ds-spitfire-heroes-tales-of-the-royal-air-force",
    sourceUrl: "https://www.mobygames.com/game/90326/spitfire-heroes-tales-of-the-royal-airforce/",
    overview:
      "Spitfire Heroes: Tales of the Royal Air Force is a Big John Games and Destineer DS flight-combat release centered on World War II air missions. It should be understood as a lightweight handheld aviation action game: the selling points are Spitfire theming, mission-based dogfighting, and budget-era military presentation, with collector checks focused on region, case/manual completeness, and exact subtitle.",
  },
  {
    id: "ds-spooky-story",
    sourceUrl: "https://gamefaqs.gamespot.com/ds/357532-spooky-story-2009",
    overview:
      "Spooky Story is a European DS adventure release from Visual Imagination Software and bhv Software, part of the system's long tail of small regional story and puzzle titles. Its value is in the niche: spooky presentation, European distribution, and obscure adventure-game placement make accurate title, language, and complete-packaging details more important than broad mainstream recognition.",
  },
  {
    id: "ds-sports-collection",
    sourceUrl: "https://www.metacritic.com/game/sports-collection/details/",
    overview:
      "Sports Collection is Ubisoft's 2010 DS multi-sport package, positioned as a compact anthology rather than a licensed league simulation. It belongs with casual sports compilations where the draw is variety, quick events, and portable repeat play; marketplace listings should distinguish it from annual roster games by noting the exact title, region, and whether the box/manual are present.",
  },
  {
    id: "ds-spy-kids-all-the-time-in-the-world",
    sourceUrl: "https://www.mobygames.com/game/90332/spy-kids-all-the-time-in-the-world/",
    overview:
      "Spy Kids: All the Time in the World is Majesco and OneNine Studios' DS tie-in for the 2011 film, aimed at younger players following the movie brand. The cartridge fits the late DS licensed-family shelf: expect approachable spy-themed activity and adventure structure, with collector interest tied to the Spy Kids license, North American release context, and complete retail packaging.",
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
    if (!game) throw new Error(`Missing DS game ${rewrite.id}`);
    return {
      platformSlug: "ds",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority DS weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus public database, retail, review, and guide references.",
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
