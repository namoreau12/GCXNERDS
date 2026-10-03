const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "snes.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "snes-priority-mystery-nichibutsu-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "snes-mystery-circle",
    sourceUrl: "https://www.mobygames.com/game/109982/mystery-circle/",
    overview:
      "Mystery Circle is a Japan-only Super Famicom puzzle game from Wave and K Amusement Leasing, released in 1992. MobyGames describes it as a distant-future puzzle release with Tetris and Qix overtones, which makes it a better fit for import puzzle collectors than for horror or mystery-adventure shelves.",
  },
  {
    id: "snes-naruhodo-the-world",
    sourceUrl: "https://gamefaqs.gamespot.com/snes/581979-naruhodo-the-world/data",
    overview:
      "Naruhodo! The World is Tomy's 1994 Super Famicom adaptation of the long-running Japanese television quiz and travel show. Its appeal is tied to TV trivia, show branding, and Japanese-language question content, so collectors should treat it as a quiz-show import where comprehension and complete Super Famicom packaging matter most.",
  },
  {
    id: "snes-nba-all-star-challenge",
    sourceUrl: "https://www.mobygames.com/game/16446/nba-all-star-challenge/",
    overview:
      "NBA All-Star Challenge is Beam Software's 1992 basketball release for SNES, published by LJN and Acclaim depending on region. It focuses on all-star skills events and one-on-one basketball rather than a full NBA season, making roster year, regional publisher, and whether buyers expect NBA Jam-style arcade play the important distinctions.",
  },
  {
    id: "snes-ncaa-football",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Super_Nintendo_Entertainment_System_games",
    overview:
      "NCAA Football is Mindscape and The Software Toolworks' 1994 college-football entry for Super Nintendo. It represents the licensed college side of the 16-bit football shelf, so the useful buying context is NCAA branding, team-era expectations, simulation pace, region, and how it differs from Madden, NFL Football, and other pro-focused cartridges.",
  },
  {
    id: "snes-nekketsu-tairiku-burning-heroes",
    sourceUrl: "https://gamefaqs.gamespot.com/snes/575566-nekketsu-tairiku-burning-heroes/data",
    overview:
      "Nekketsu Tairiku: Burning Heroes is a 1995 Japan-only Super Famicom RPG from J-Force and Enix. It is a late-era import built around multiple hero stories and traditional RPG progression, with collector interest coming from Enix's publisher credit, Japanese text dependence, Super Famicom format, and complete box/manual condition.",
  },
  {
    id: "snes-new-yatterman-nandai-kandai-yajirobee",
    sourceUrl: "https://superfamicom.org/info/new-yatterman-nan-dai-kan-dai-yajirobee",
    overview:
      "New Yatterman: Nandai Kandai Yajirobee is a 1996 Super Famicom action release from Yutaka and Tom Create, tied to Tatsunoko's Yatterman franchise. It is a character-license import rather than a rhythm game, so the key listing signals are Japanese region, exact romanized subtitle, franchise appeal, and whether the package is complete.",
  },
  {
    id: "snes-nfl-football",
    sourceUrl: "https://snescentral.com/article.php?id=0508",
    overview:
      "NFL Football is Konami's 1993 SNES football release from Park Place Productions, supporting one or two players. It sits in the early licensed football lane before later games standardized bigger presentation packages, so collectors should separate it from Madden, NCAA Football, and ABC Monday Night Football by publisher, license, and exact title.",
  },
  {
    id: "snes-nice-de-shot",
    sourceUrl: "https://www.rfgeneration.com/cgi-bin/getinfo.pl?ID=J-044-S-12930-A",
    overview:
      "Nice de Shot is a Japan-only Super Famicom golf game from Magical Company and ASK. Its identity is straightforward course golf rather than a mascot or tournament-license release, making region, Japanese packaging, loose-versus-complete condition, and the ASK label the practical collector details.",
  },
  {
    id: "snes-nichibutsu-arcade-classics",
    sourceUrl: "https://gamefaqs.gamespot.com/snes/571288-nichibutsu-arcade-classics/data",
    overview:
      "Nichibutsu Arcade Classics is a 1995 Super Famicom compilation from Syscom and Nichibutsu. It collects older Nichibutsu arcade material for home play, including names such as Crazy Climber, Frisky Tom, and Moon Cresta, so its value is in arcade preservation, Japanese cartridge format, and which collection a buyer is actually getting.",
  },
  {
    id: "snes-nichibutsu-collection-1",
    sourceUrl: "https://superfamicom.org/info/nichibutsu-collection-1",
    overview:
      "Nichibutsu Collection 1 is a 1996 Super Famicom release from Nihon Bussan, separate from the earlier Nichibutsu Arcade Classics cartridge. It belongs to the late Japanese SFC compilation shelf, where the exact volume number, Nichibutsu branding, Super Famicom region, and complete box/manual status are the details that prevent mix-ups.",
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
    if (!game) throw new Error(`Missing SNES game ${rewrite.id}`);
    return {
      platformSlug: "snes",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority SNES weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus MobyGames, GameFAQs, SNES Central, SuperFamicom.org, RF Generation, and specialist reference checks.",
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
