const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "gba.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "gba-priority-killer-kong-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "gba-killer-3d-pool",
    sourceUrl: "https://www.mobygames.com/game/117892/killer-3d-pool/",
    overview:
      "Killer 3D Pool is Gravity-i and Destination Software's 2005 Game Boy Advance billiards release. MobyGames identifies four rule sets: English 8-ball, U.S. 9-ball, U.S. 8-ball, and Killer, while StrategyWiki notes two-player options through a single GBA or Game Link cable. Its value is in being a compact late-GBA pool cartridge, so region, manual, and link-cable multiplayer expectations matter more than roster or league details.",
  },
  {
    id: "gba-kinniku-banzuke-kimeru-kiseki-no-kanzen-seiha",
    sourceUrl: "https://en.wikipedia.org/wiki/Kinniku_Banzuke",
    overview:
      "Kinniku Banzuke: Kimeru! Kiseki no Kanzen Seiha is Konami's 2001 Game Boy Advance entry tied to the Japanese physical-challenge TV franchise known abroad as Unbeatable Banzuke or Muscle Ranking. The appeal is variety-event competition rather than standard team sports, carrying the license's obstacle-course and stunt-challenge identity onto GBA. It is a Japanese import where title recognition, language comfort, and Konami/KCE-era packaging are the useful distinctions.",
  },
  {
    id: "gba-kiss-x-kiss-seirei-gakuen",
    sourceUrl: "https://gamefaqs.gamespot.com/gba/924809-kiss-x-kiss-seirei-gakuen/data",
    overview:
      "Kiss x Kiss: Seirei Gakuen is a Japan-only 2004 Game Boy Advance strategy release from Kamui and Bandai. GameFAQs lists one-to-five local players, which makes it more unusual than a typical single-player romance or school-themed import. It belongs in the catalog as a Bandai/Kamui GBA curiosity with Japanese text and multiplayer support, so complete packaging and exact product ID are important for trading.",
  },
  {
    id: "gba-koinu-to-issho-2",
    sourceUrl: "https://gamefaqs.gamespot.com/gba/920051-koinu-to-issho-2",
    overview:
      "Koinu to Issho! 2 is Culture Brain's 2004 Game Boy Advance follow-up in its puppy-themed Japan-only line. GameFAQs also names it Koinu to Issho 2: Aijou Monogatari, which helps separate it from the 2003 first entry and later pet compilations. The cartridge's appeal is gentle pet-life strategy and puppy branding, with Japanese text, region, and complete Culture Brain packaging doing most of the collector work.",
  },
  {
    id: "gba-koinu-to-issho-aijou-monogatari",
    sourceUrl: "https://nintendo.fandom.com/wiki/Koinu_to_Issho!_Aij%C5%8D_Monogatari",
    overview:
      "Koinu to Issho! Aijou Monogatari is the 2003 Culture Brain Game Boy Advance entry that established the Koinu to Issho puppy line before the numbered sequel. Reference listings identify it as a Japan-only adventure release, not a Western-style virtual-pet brand. Its catalog identity rests on the Aijou Monogatari subtitle, Japanese-language play, Culture Brain pet-game niche, and whether the copy is loose or complete.",
  },
  {
    id: "gba-koinu-chan-no-hajimete-no-osanpo-koino-no-kokoro-ikusei-game",
    sourceUrl: "https://gamefaqs.gamespot.com/gba/919132-koino-no-kokoro-ikusei-game",
    overview:
      "Koinu-Chan no Hajimete no Osanpo: Koino no Kokoro Ikusei Game is TDK Mediactive's 2003 Japan-only GBA puppy simulation. GameFAQs lists it under the shorter Koino no Kokoro Ikusei Game title and classifies it as a simulation release. It sits beside other early-2000s Japanese pet-care cartridges, with the long title, TDK branding, and language-heavy nurturing theme being the practical listing clues.",
  },
  {
    id: "gba-konchuu-monster-battle-master",
    sourceUrl: "https://collection.rcgs.jp/page/PACKAGE0006305",
    overview:
      "Konchuu Monster: Battle Master is Culture Brain's May 3, 2005 Game Boy Advance insect-monster release. RCGS collection data and Japanese retail references identify the Culture Brain copyright and packaging, while GameFAQs company data places it beside Battle Stadium on the same release date. It is best framed as a Japan-only monster-battle import centered on insect creatures, not an educational trainer.",
  },
  {
    id: "gba-konchuu-monster-battle-stadium",
    sourceUrl: "https://jrpgc.com/games/konchuu-monster-battle-stadium/",
    overview:
      "Konchuu Monster: Battle Stadium is Culture Brain's companion 2005 GBA insect-monster battler. JRPGC describes it as an RPG inspired by monster-taming games and focused on insectoid warriors, which separates it from the generic learning-game copy it replaced. Catalog notes should emphasize Japanese-only release context, Culture Brain's Konchuu Monster branding, and whether buyers are looking for Battle Stadium or Battle Master.",
  },
  {
    id: "gba-konchuu-no-mori-no-daibouken",
    sourceUrl: "https://www.somaisum.games/blog/jogos-da-culture-brain",
    overview:
      "Konchuu no Mori no Daibouken: Fushigi na Sekai no Juunin-tachi is a 2005 Culture Brain Game Boy Advance entry in the same insect-monster corner of the publisher's catalog. Culture Brain lists and collector indexes place it after Battle Master and Battle Stadium, making the subtitle the easiest way to avoid confusing nearby releases. It is a Japanese import whose appeal is monster-collecting obscurity, not classroom practice.",
  },
  {
    id: "gba-kong-king-of-atlantis",
    sourceUrl: "https://www.mobygames.com/game/124266/kong-king-of-atlantis/",
    overview:
      "Kong: King of Atlantis is Majesco's 2005 Game Boy Advance adaptation of the animated Kong: King of Atlantis film, developed by Skyworks with additional support credited by MobyGames. It plays as a side-scrolling platform adventure starring Jason, Lua, and King Kong against Queen Reptilla's forces. Its useful marketplace identity is the animated-Kong license, 15 short password-supported stages, and distinction from Ubisoft's separate Peter Jackson's King Kong movie game.",
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
        "Priority GBA weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus public database, collection, retail, and specialist references.",
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
