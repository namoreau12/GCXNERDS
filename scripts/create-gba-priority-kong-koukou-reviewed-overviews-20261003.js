const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "gba.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "gba-priority-kong-koukou-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "gba-kong-the-animated-series",
    sourceUrl: "https://www.mobygames.com/game/203146/kong-the-animated-series/",
    overview:
      "Kong: The Animated Series is Planet Interactive and BAM! Entertainment's 2002 Game Boy Advance platformer based on the Canadian animated series. MobyGames describes a 2D platform game with exploration elements built around the revived Kong, Jason, and the show's adventure setup. It should be listed as the animated-series GBA tie-in, separate from Kong: King of Atlantis and the later Peter Jackson movie game.",
  },
  {
    id: "gba-konjiki-no-gash-bell-yuujou-no-zakeru-dream-tag-tournament",
    sourceUrl: "https://gamefaqs.gamespot.com/gba/929994-konjiki-no-gash-bell-yuujou-no-dengeki-dream-tag-tournament/faqs/79177",
    overview:
      "Konjiki no Gash Bell!! Yuujou no Zakeru Dream Tag Tournament is Banpresto and Dimps' 2005 GBA fighter based on Zatch Bell, known in Japan as Konjiki no Gash Bell. GameFAQs guide material points to tag battles, unlockable collection items, GBA link play, and a Raiku Tournament structure. Collector notes should emphasize the Japanese title, Dimps credit, anime-license roster, and distinction from the earlier Yuujou no Zakeru entries.",
  },
  {
    id: "gba-konjiki-no-gash-bell-card-battle",
    sourceUrl: "https://gamefaqs.gamespot.com/gba/926842-konjiki-no-gash-bell-the-card-battle-for-gba/faqs/47464",
    overview:
      "Konjiki no Gash Bell!!: Card Battle is Banpresto's 2005 Game Boy Advance card-battle adaptation of the Zatch Bell license. GameFAQs hosts dedicated card-list material for the release, which is the key clue that this cartridge is about deck and card management rather than the side-view fighting format of Yuujou no Zakeru. Listings should call out the GBA card-battle subtitle, Japanese text dependence, and Banpresto franchise branding.",
  },
  {
    id: "gba-konjiki-no-gash-bell-makai-no-bookmark",
    sourceUrl: "https://gamefaqs.gamespot.com/gba/921234-konjiki-no-gash-bell-makai-no-bookmark/faqs/42189",
    overview:
      "Konjiki no Gash Bell!!: Makai no Bookmark is Banpresto's 2004 Game Boy Advance RPG-style Zatch Bell release. GameFAQs material describes it as based on the Konjiki no Gash Bell anime and manga, while player notes point to bookmark equipment as a central progression hook. It is a Japanese text-heavy franchise import, so exact subtitle, complete packaging, and separation from the GBA fighting and card-battle entries matter.",
  },
  {
    id: "gba-konjiki-no-gash-bell-yuujou-no-zakeru",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Zatch_Bell!_video_games",
    overview:
      "Konjiki no Gash Bell!!: Yuujou no Zakeru is Banpresto and Eighting's 2003 Game Boy Advance fighting entry for the Zatch Bell franchise. It is the first GBA Yuujou no Zakeru release, preceding Yuujou no Zakeru 2 and Dream Tag Tournament. For collectors, the useful details are the Eighting developer credit, Japanese title romanization, anime roster appeal, and not confusing it with the later Electric Arena naming used by fan and import communities.",
  },
  {
    id: "gba-konjiki-no-gash-bell-yuujou-no-zakeru-2",
    sourceUrl: "https://gamefaqs.gamespot.com/gba/933968-zatch-bell-electric-arena-2/faqs/79206",
    overview:
      "Konjiki no Gash Bell!!: Yuujou no Zakeru 2 is the 2004 Banpresto and Dimps sequel to the GBA Zatch Bell fighting game. GameFAQs guide material connects it to the Electric Arena 2 naming and character-focused battle structure, while the Japanese release remains part of the Konjiki no Gash Bell import line. Listings should identify it as the second Yuujou no Zakeru cartridge, with Japanese text, Dimps credit, and sequel status clearly stated.",
  },
  {
    id: "gba-kotoba-no-puzzle-mojipittan-advance",
    sourceUrl: "https://www.mobygames.com/game/71671/kotoba-no-puzzle-mojipittan-advance/",
    overview:
      "Kotoba no Puzzle: Mojipittan Advance is Namco's 2003 Game Boy Advance entry in the Japanese word-puzzle series. MobyGames identifies it as a Japanese word puzzle game, and Bandai Namco's own Mojipittan material presents the GBA version as a portable fit for short free-time sessions. The important marketplace caveat is language: success depends on Japanese kana and vocabulary, so import buyers need more than generic puzzle-game expectations.",
  },
  {
    id: "gba-kouchuu-ouja-mushiking",
    sourceUrl: "https://en.wikipedia.org/wiki/Mushiking:_The_King_of_Beetles",
    overview:
      "Kouchuu Ouja Mushiking is Sega's 2005 Game Boy Advance adaptation of the Mushiking: The King of Beetles arcade and card-battle phenomenon. The franchise centers on beetle battles and collectible-card-style matchups, making this a branded insect-battle import rather than a nature encyclopedia or generic RPG. Listings should note the Japanese-only context, Sega and Mushiking Team credits, and whether buyers are seeking Greatest Champion e no Michi material.",
  },
  {
    id: "gba-koukou-juken-advance-series-eigo-koubunhen-26-units-shuuroku",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Game_Boy_Advance_games",
    overview:
      "Koukou Juken Advance Series: Eigo Koubunhen 26 Units Shuuroku is a 2001 Japanese Game Boy Advance study cartridge from Keynet and NDcube. The title points to English sentence-pattern preparation for high-school entrance exams, with 26 units of material rather than action or adventure play. Its value is in the early GBA educational niche, so language ability, exact subtitle, complete manual, and import-study curiosity drive the listing.",
  },
  {
    id: "gba-koukou-juken-advance-series-eijukugohen-650-phrases-shuuroku",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Game_Boy_Advance_games",
    overview:
      "Koukou Juken Advance Series: Eijukugohen 650 Phrases Shuuroku is another 2001 Keynet and NDcube GBA study release for Japanese high-school entrance exam prep. This volume focuses on English idioms and phrase study, with the title advertising 650 included phrases. It belongs beside the other Koukou Juken Advance cartridges as language-learning software, where exact subtitle, Japanese study use, and complete packaging matter more than game mechanics.",
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
        "Priority GBA weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus MobyGames, GameFAQs, Bandai Namco, Sega/Zatch/Mushiking references, and platform-list checks.",
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
