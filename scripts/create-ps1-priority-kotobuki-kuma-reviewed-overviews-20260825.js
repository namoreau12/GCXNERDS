const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-kotobuki-kuma-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-kotobuki-grand-prix",
    sourceUrl: "https://psxdatacenter.com/games/P/K/SLES-04007.html",
    overview:
      "Kotobuki Grand Prix is a colorful motorcycle racing game from Syscom, later released in PAL territories by Midas Interactive. It is not a serious racing sim; the appeal is lightweight cartoon presentation, behind-the-bike racing, and late-PS1 arcade handling aimed at quick events rather than deep tuning. GCX should frame it as a small import/PAL racing curiosity, especially useful for collectors tracking obscure end-of-life PlayStation releases.",
  },
  {
    id: "ps1-kouashi-kikou-shidan-bein-panzer",
    sourceUrl: "https://www.mobygames.com/game/222773/koashi-kiko-shidan-bein-panzer/",
    overview:
      "Kouashi Kikou Shidan: Bein Panzer is a Japan-only Sony Computer Entertainment strategy game from Aprize, built around armored units rather than arcade action. The title sits in the PlayStation's deeper import catalog, where tactical menus, unit positioning, and scenario planning matter more than reflex play. GCX should present it as a niche first-party strategy release for players interested in mecha-flavored tactics and collectors chasing Sony's domestic-only library.",
  },
  {
    id: "ps1-kouryuu-sangoku-engi",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-00577.html",
    overview:
      "Kouryuu Sangoku Engi is a Three Kingdoms historical strategy simulation from Xing Entertainment, focused on ruling, army management, supplies, recruitment, diplomacy, and campaign decisions across selectable time periods. It belongs beside Koei-style grand strategy rather than character-driven RPGs, with the hook being political control over the Romance of the Three Kingdoms setting. GCX should describe it as a menu-heavy import for strategy fans, not a conventional party adventure.",
  },
  {
    id: "ps1-kouryuuki",
    sourceUrl: "https://www.play-asia.com/en/kouryuuki-koei-collection-series/13/70b59",
    overview:
      "Kouryuuki is Koei's PlayStation take on the Chu-Han Contention, the struggle between Xiang Yu and Liu Bang after the fall of Qin. Play-Asia's catalog notes a simple, beginner-friendly system and event-driven recreations of famous stories, which makes it closer to historical strategy than fantasy role-playing. GCX should position it as a Koei history-sim companion piece for players who like Romance of the Three Kingdoms-style campaigns but want a different Chinese era.",
  },
  {
    id: "ps1-kouyasai",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/136527-kouyasai-a-sherd-of-youthful-memories",
    overview:
      "Kouyasai: A Sherd of Youthful Memories is a Japanese visual novel and romance adventure from Astrovision and Shoeisha. The setup builds toward a school festival dance, with voiced characters, multiple endings, and the player's choices affecting which relationship outcome they reach. GCX should describe it as a low-action dating-adventure import: valuable for readers who want to know it is about conversations, affection routes, and festival payoff rather than exploration or combat.",
  },
  {
    id: "ps1-kowai-shashin",
    sourceUrl: "https://en.wikipedia.org/wiki/Kowai_Shashin",
    overview:
      "Kowai Shashin: Shinrei Shashin Kitan is a Japan-only horror game about exorcising spirits hidden inside creepy photographs. Instead of survival-horror movement, play centers on scanning still images with a cursor, identifying supernatural details, and completing exorcism prompts under pressure. GCX should highlight why it became a cult oddity: the unsettling photo-based premise, its connection to Japanese internet rumors, and its strange position near Fatal Frame without playing like Fatal Frame.",
  },
  {
    id: "ps1-kowloon-jou",
    sourceUrl: "https://www.gamesdatabase.org/game/sony-playstation/kowloon-jou",
    overview:
      "Kowloon Jou is a Media Rings PlayStation puzzle game built around clearing a long sequence of compact stages. GamesDatabase describes an action-puzzle structure with 30 stages split into substages, which makes it more about route solving and repeated challenge rooms than horror or adventure despite the title's atmosphere. GCX should frame it as an obscure Japanese puzzle release for collectors who want Media Rings' lesser-known output beyond its detective and fishing games.",
  },
  {
    id: "ps1-kuma-no-pooh-tarou-karaha-pinkuda-zenin-shuugou-sore-da-messu",
    sourceUrl: "https://psxdatacenter.com/games/J/K/SLPS-00115.html",
    overview:
      "Kuma no Puutarou: Karaha Pinkuda! Zenin Shuugou!! Soredamessu is a PlayStation board game based on Isami Nakagawa's comedy anime. Its value is less in complex mechanics than in the licensed cast: the loud bear, romantic rabbit, and microphone-carrying monkey are brought into a party-board format aimed at fans of the show. GCX should treat it as a character-license import, useful for anime collectors and PlayStation completists rather than players seeking a deep strategy board game.",
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
    if (!game) throw new Error(`Missing PS1 game ${rewrite.id}`);
    rows.push([
      "ps1",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl,
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on catalog, article, and specialist gameplay sources.",
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
