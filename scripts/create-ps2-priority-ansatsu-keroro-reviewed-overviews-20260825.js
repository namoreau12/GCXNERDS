const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-ansatsu-keroro-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-katekyoo-hitman-reborn-let-s-ansatsu-nerawareta-10-daime",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/161490-katekyou-hitman-reborn-lets-ansatsu-nerawareta-10-daime",
    overview:
      "Katekyoo Hitman Reborn!! Let's Ansatsu!? Nerawareta 10 Daime! is a Japan-only PlayStation 2 action game based on Akira Amano's Reborn! manga and anime. LaunchBox lists the release for October 25, 2007 on Sony PlayStation 2, with Takara Tomy development and Marvelous Entertainment publishing. GCX should describe it as a licensed character-action import where the hook is playing through Reborn's assassination-training premise, franchise characters, and anime tie-in material rather than deep tactical strategy.",
  },
  {
    id: "ps2-kattobi-golf",
    sourceUrl: "https://www.play-asia.com/en/kattobi-golf/13/7027f",
    overview:
      "Kattobi! Golf is Konami's Japanese PlayStation 2 take on arcade golf, released in 2003. Play-Asia describes a comical course design built around unusual locations such as desert, waterfall, and volcano settings, with stage hazards including walking crabs and running bulls, plus Stroke, Match, Tournament, and Challenge modes. GCX should frame it as a colorful, novelty-course golf game for import collectors, not a simulation-heavy rival to Tiger Woods or Hot Shots Golf.",
  },
  {
    id: "ps2-kazeiro-surf",
    sourceUrl: "https://tcrf.net/Kazeiro_Surf",
    overview:
      "Kazeiro Surf is a Japan-only PlayStation 2 visual novel from Wamsoft and Russell/Russell Pure, released on May 28, 2009. The Cutting Room Floor and IGDB-backed listings identify it as a late PS2 story release rather than an action or sports game, and its title/marketing places it in the softer character-romance side of the import VN library. GCX should describe it as a route-driven narrative game where the collector value comes from its late-generation PS2 timing, Japanese-only status, and Russel Pure catalog placement.",
  },
  {
    id: "ps2-kazoku-keikaku-kokoro-no-kizuna",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65889.html",
    overview:
      "Kazoku Keikaku: Kokoro no Kizuna is a Japanese PlayStation 2 visual novel/adventure port of the family-themed PC story. PSXDataCenter summarizes Tsukasa, a guarded young man working at a Chinese restaurant, taking in an illegal immigrant girl he finds collapsed nearby; that encounter pushes the story toward found-family relationships, comedy, and emotional route choices. The PS2 version adds a new character and ending, so GCX should position it as a meaningful console version for Interchannel/HuneX and visual-novel collectors.",
  },
  {
    id: "ps2-kenka-banchou",
    sourceUrl: "https://en.wikipedia.org/wiki/Kenka_Bancho:_Badass_Rumble",
    overview:
      "Kenka Banchou is the original PlayStation 2 entry in Spike's delinquent beat-'em-up series, built around the Japanese bancho fantasy that later reached North America through Kenka Bancho: Badass Rumble on PSP. The series identity is street exploration, school-tough-guy rivalries, staring opponents down, and brawling your way through regional delinquents rather than straightforward stage-clearing action. GCX should describe the PS2 original as the foundation of Spike's cult bancho line and a key import for collectors who follow the later PSP sequels.",
  },
  {
    id: "ps2-kenka-banchou-2-full-throttle",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-73258.html",
    overview:
      "Kenka Banchou 2: Full Throttle is the Japanese PlayStation 2 sequel to Spike's delinquent action-adventure series. PSXDataCenter classifies the Best reissue as an NTSC-J action/adventure/beat-'em-up from YSK and Spike, released March 13, 2008, while other catalog records place the original 2007 release in the same line. GCX should describe it as a bigger, tougher follow-up built around roaming bancho confrontations, Japanese-language menus, and beat-'em-up progression for import action fans.",
  },
  {
    id: "ps2-kenran-butou-sai-the-mars-daybreak",
    sourceUrl: "https://backloggd.com/games/kenran-butou-sai-the-mars-daybreak/",
    overview:
      "Kenran Butou Sai: The Mars Daybreak is a Japan-only PlayStation 2 adventure/simulation game from Alfa System and Sony Computer Entertainment. Backloggd summarizes it as a spiritual successor to Gunparade March, blending interaction with AI-controlled NPCs and combat segments in a real-time simulation-adventure structure. GCX should frame it as a systems-heavy anime-adjacent import tied to The Mars Daybreak setting, where the interest is the hybrid social/combat design rather than simple action stages.",
  },
  {
    id: "ps2-keroro-gunsou-meromero-battle-royale",
    sourceUrl: "https://tcrf.net/Keroro_Gunsou%3A_MeroMero_Battle_Royale",
    overview:
      "Keroro Gunsou: MeroMero Battle Royale is a Japanese PlayStation 2 action game based on the Sgt. Frog/Keroro Gunsou franchise. The Cutting Room Floor identifies Now Production as developer, Bandai as publisher, and September 30, 2004 as the Japanese release date, while franchise listings place it among several Japan-only Keroro games. GCX should describe it as a character-based arena/action import built for fans of the anime cast, with collector interest tied to Bandai's PS2 licensed catalog and its follow-up, Battle Royale Z.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on platform database, catalog, franchise, and product sources.",
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
