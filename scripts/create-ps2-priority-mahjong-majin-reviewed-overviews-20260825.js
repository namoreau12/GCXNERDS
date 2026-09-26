const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-mahjong-majin-reviewed-overviews-2026-08-25.csv"
);

const entries = [
  {
    gameId: "ps2-mahjong-hiryu-densetsu-tenpai",
    sourceUrl: "https://www.honestgamers.com/45312/playstation-2/mahjong-hiryu-densetsu-tenpai/game.html",
    newOverview:
      "Mahjong Hiryu Densetsu: Tenpai is a Japan-only PS2 mahjong release tied to the Tenpai branding, with Nippon Telenet/CBC publishing history and a 2003 release window. The useful collector read is that it is a focused riichi-mahjong disc rather than a broad puzzle compilation: players are here for table play, opponent pressure, and series-specific packaging. GCX should frame it as a licensed mahjong catalog piece whose identity comes from the Tenpai name and late Nippon Telenet-era PS2 shelf placement.",
  },
  {
    gameId: "ps2-mahjong-party-idol-to-mahjong-shoubu",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-20349.html",
    newOverview:
      "Mahjong Party: Idol to Mahjong Shoubu gives the standard Japanese mahjong table a celebrity-idol wrapper. Instead of presenting itself as a sober rules trainer, it sends players against TV idol opponents, adds an occult-themed story mode, one-on-one idol matches, a card shop, gallery material, and small side activities. GCX should describe it as a novelty mahjong release where the attraction is the idol presentation and Japan-only personality licensing as much as the tile play.",
  },
  {
    gameId: "ps2-mahjong-san-goku-shi",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/390321-mahjong-sangokushi",
    newOverview:
      "Mahjong San Goku Shi is Mycom's 2004 PS2 mahjong release, using a Three Kingdoms-flavored title to separate it from the many plain table-game discs on the platform. Its public database footprint is thin, so GCX should avoid inventing campaign depth and keep the value proposition clear: this is a Japan-only board-game entry for players who want mahjong with historical-warrior theming and for collectors trying to untangle Mycom's crowded PS2 table-game catalog.",
  },
  {
    gameId: "ps2-mahjong-sengen-kyoujin-de-ron",
    sourceUrl: "https://www.nin-nin-game.com/en/playstation-2",
    newOverview:
      "Mahjong Sengen Kyoujin de Ron! is an early Taito PS2 mahjong title from December 2000, notable less for broad genre reinvention than for its launch-era table-game positioning and voice-recognition bundle history. That hardware-adjacent angle gives it a more interesting collector hook than many anonymous mahjong releases. GCX should present it as a Japanese mahjong title built around table play, with the microphone/voice-recognition package as the distinguishing version to watch.",
  },
  {
    gameId: "ps2-mahjong-taikai-iii",
    sourceUrl: "https://www.mobygames.com/game/62630/mahjong-taikai-iii-millennium-league/",
    newOverview:
      "Mahjong Taikai III: Millennium League is Koei's traditional four-player mahjong entry for PS2 and part of the publisher's long-running historical mahjong line. Its pitch is not anime novelty or arcade speed; it is a tournament-minded table-game package with Koei's familiar interest in presentation, rules, and competitive framing. GCX should call it a serious mahjong release for players who want structured play and for collectors tracking Koei's non-strategy software on PS2.",
  },
  {
    gameId: "ps2-mahjong-yarouze-2",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_PlayStation_2_games_%28L%E2%80%93Z%29",
    newOverview:
      "Mahjong Yarouze! 2 is Konami's April 2000 PS2 follow-up to its mahjong line, landing very early in the system's Japanese software life. The record should stay straightforward: this is a dedicated riichi-mahjong release from a major publisher, not an adventure game or character-heavy spinoff. Its collector interest comes from being an early Konami PS2 table-game title and a numbered sequel in a niche line that mostly served domestic mahjong players.",
  },
  {
    gameId: "ps2-mahoroba-stories",
    sourceUrl: "https://downloads.khinsider.com/game-soundtracks/album/mahoroba-stories-library-of-fortune-ps2-gamerip-2007",
    newOverview:
      "Mahoroba Stories: Library of Fortune is a 2007 Dimple/HuneX PS2 RPG-adventure with a gentler, character-forward identity than the console's bigger battle-heavy role-playing games. Its appeal is the fantasy setting, event-driven progression, and import curiosity around a late-generation Japanese exclusive. GCX should position it as a niche storybook-style RPG for collectors who like obscure late PS2 releases, while being careful not to oversell it as a mainstream genre landmark.",
  },
  {
    gameId: "ps2-mahoromatic-moetto-kirakira-maid-san",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65333.html",
    newOverview:
      "Mahoromatic: Moetto - KiraKira Maid-San is Konami's 2003 PS2 adventure game based on the Mahoromatic anime. It plays like a visual-novel-style character game, asking players to choose responses and manage outcomes rather than master action stages. The useful GCX framing is that this is an anime tie-in for fans of Mahoro and the source series, with limited-edition and soundtrack interest, not a general-purpose adventure recommendation.",
  },
  {
    gameId: "ps2-mahou-sensei-negima-1-jikanme-okochama-sensei-wa-mahoutsukai",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65871.html",
    newOverview:
      "Mahou Sensei Negima! 1-Jikanme: Okochama Sensei wa Mahoutsukai! is the first PS2 game based on Ken Akamatsu's classroom-fantasy manga, loosely drawing from the early Negima setup at Mahora Academy. The game is best understood as a fan-facing school-life adaptation, with character interactions and route-style structure doing more work than traditional action. GCX should emphasize its role as the beginning of Konami's PS2 Negima run and call out the Tokutaisei limited version for collectors.",
  },
  {
    gameId: "ps2-mahou-sensei-negima-2-jikanme-tatakau-otometachi-mahora-daiundokai-sp",
    sourceUrl: "https://www.play-asia.com/en/mahou-sensei-negima-2-jikanme-konami-the-best/13/70157y",
    newOverview:
      "Mahou Sensei Negima! 2-Jikanme: Tatakau Otometachi! Mahora Daiundokai SP shifts the PS2 Negima line toward a more active Mahora sports-festival premise. Konami sold it as an action game, and the title's identity comes from staging the large class cast around competition rather than simply retelling early manga chapters. GCX should present it as the second PS2 Negima entry, useful for fans who want the broader cast in a livelier event format.",
  },
  {
    gameId: "ps2-mahou-sensei-negima-kagai-jugyou-otome-no-dokidoki-beachside",
    sourceUrl: "https://www.pricecharting.com/game/jp-playstation-2/mahou-sensei-negima-kagai-jugyou-~otome-no-dokidoki-beachside~",
    newOverview:
      "Mahou Sensei Negima! Kagai Jugyou: Otome no Dokidoki Beachside is the beachside PS2 Negima entry, built around a lighter extracurricular premise, Tamsoft/Konami credits, and one-player action-adventure presentation. It is not the place to look for a definitive RPG version of the manga; it is a fan-service-heavy side release for players invested in the class cast. GCX should describe it as a character-event spinoff and flag the CERO D rating for collector context.",
  },
  {
    gameId: "ps2-mahou-tsukai-kurohime",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66164.html",
    newOverview:
      "Mahou Tsukai Kurohime, also known as Magic Gunner Kurohime, is Tomy's 2006 PS2 adaptation of Masanori Katakura's manga. Unlike many anime tie-ins in this section of the library, it is a third-person arena shooter, with Kurohime facing groups of enemies and larger boss encounters in a format compared to Virtual On or Armored Core-style combat. GCX should frame it as a more action-forward manga game and a clear change of pace from the surrounding visual novels.",
  },
  {
    gameId: "ps2-mai-hime-unmei-no-keitouju",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPS-25507.html",
    newOverview:
      "Mai-HiME: Unmei no Keitouju is a PS2 visual novel/adventure tied to Sunrise's Mai-HiME multimedia project. Set at Kazehana Gakuen, it uses the anime's HiME premise for a branching story rather than trying to become a conventional action game. GCX should present it as a fan-focused alternate story with DX Pack collector relevance, especially because the PS2 version later received a PC edition under the Shura name.",
  },
  {
    gameId: "ps2-mai-otome-hime-otome-butou-shi",
    sourceUrl: "https://tcrf.net/Mai-Otome_Hime%3A_Otome_Butou_Shi",
    newOverview:
      "Mai-Otome Hime: Otome Butou Shi is Sunrise Interactive's 2006 PS2 action/fighting-style adaptation of the Mai-Otome side of the franchise. Its identity is cast combat and character-select appeal, giving fans a more immediate play format than the story-heavy Mai-HiME visual novel. GCX should describe it as a franchise brawler for import collectors, with TOSE/Sunrise Interactive credits and anime character coverage as the main reasons to care.",
  },
  {
    gameId: "ps2-majin-tantei-nougami-neuro-battle-da-yo",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-55031.html",
    newOverview:
      "Majin Tantei Nougami Neuro: Battle da Yo! Hannin Shuugou! is Compile Heart's 2008 PS2 adventure adaptation of the supernatural detective manga. The premise is not a straight fighting game despite the word Battle; database and specialist listings point to an adventure format with manga cast appeal. GCX should frame it as a late PS2 character-mystery tie-in for Neuro fans, notable for its Japan-only status and very late release timing.",
  },
];

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = entries.map((entry) => {
    const game = byId.get(entry.gameId);
    if (!game) throw new Error(`Missing PS2 game: ${entry.gameId}`);
    return {
      platformSlug: "ps2",
      gameId: entry.gameId,
      title: game.title,
      currentOverview: game.description || "",
      sourceUrl: entry.sourceUrl,
      rewriteNotes: "Priority PS2 weak-template cleanup; original GCX editorial overview based on platform database, specialist database, retailer metadata, and franchise context.",
      newOverview: entry.newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX editorial cleanup",
    };
  });

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
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${headers.map(escapeCsv).join(",")}\n${rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );
  console.log(JSON.stringify({ outputPath, rowCount: rows.length }, null, 2));
}

main();
