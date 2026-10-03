const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "wii.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "wii-priority-lernerfolg-lets-reviewed-overviews-2026-10-03.csv"
);

const reviewedOverviews = [
  {
    id: "wii-lernerfolg-grundschule-deutsch",
    sourceUrl: "https://de.wikipedia.org/wiki/Lernerfolg_Grundschule",
    overview:
      "Lernerfolg Grundschule Deutsch is Tivola's Wii entry for German-language primary-school practice in the Lernerfolg Grundschule learning series. The series is built around child-focused exercises for early school subjects, and the Wii version sits closer to educational software than to a normal minigame compilation. Its identity comes from German reading and writing practice, Tivola's classroom-friendly branding, European Wii context, and appeal to collectors tracking unusual educational releases.",
  },
  {
    id: "wii-lernerfolg-grundschule-englisch",
    sourceUrl: "https://de.wikipedia.org/wiki/Lernerfolg_Grundschule",
    overview:
      "Lernerfolg Grundschule Englisch is Tivola's English-practice Wii release in the Lernerfolg Grundschule educational line. It uses the same primary-school learning framework as the Deutsch and Mathematik entries, but shifts the focus to beginner English language work for children. For the Wii library it is notable as a European educational title where language, region, subject focus, and Tivola's school-software background matter more than action-game mechanics.",
  },
  {
    id: "wii-lernerfolg-grundschule-mathematik",
    sourceUrl: "https://de.wikipedia.org/wiki/Lernerfolg_Grundschule",
    overview:
      "Lernerfolg Grundschule Mathematik is Tivola's Wii math-practice release for the Lernerfolg Grundschule series. The broader line is designed around early primary-school subjects, and this entry covers arithmetic-oriented learning rather than arcade play. It belongs to the Wii's smaller educational shelf, with collector interest tied to German-language presentation, classroom-style exercises, European distribution, and its relationship to the Deutsch, Englisch, and Power Mathe companion releases.",
  },
  {
    id: "wii-lernerfolg-grundschule-power-mathe",
    sourceUrl: "https://de.wikipedia.org/wiki/Tivola",
    overview:
      "Lernerfolg Grundschule Power Mathe is Tivola's Wii mental-arithmetic trainer, positioned as a math-focused spin on the Lernerfolg Grundschule formula. German catalog and publisher references place Power Mathe among Tivola's 2010 Wii educational releases, separate from the broader Mathematik entry. Its hook is quick calculation practice for children, making subject focus, German text, European Wii compatibility, and the exact Power Mathe subtitle the key identifying details.",
  },
  {
    id: "wii-let-s-dance-with-mel-b",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Wii_games",
    overview:
      "Let's Dance with Mel B, also listed simply as Let's Dance in North America, is Lightning Fish's Wii dance and fitness release tied to Melanie Brown. Wii catalog data credits Black Bean Games in Europe and Maximum Family Games in North America, which explains why region and title variant matter. It fits with motion-led celebrity fitness and dance software rather than deep rhythm-game scoring, with the Mel B branding, regional packaging, and Wii Remote movement focus carrying the identity.",
  },
  {
    id: "wii-let-s-paint",
    sourceUrl: "https://www.esrb.org/ratings/28987/lets-paint/",
    overview:
      "Let's Paint is Zoo Games and Frontline Studios' Wii art activity release. The ESRB describes it as an activity game where players paint, draw, and color their own pictures, so it is better understood as a creative tool-like family title than as a traditional challenge game. Its place in the Wii library comes from pointer-based drawing, approachable single-player creativity, North American Zoo Games publishing, and the novelty of a retail art disc.",
  },
  {
    id: "wii-let-s-play-ballerina",
    sourceUrl: "https://www.mobygames.com/game/250851/lets-play-ballerina/",
    overview:
      "Let's Play Ballerina is ZigZagIsland and Deep Silver's 2010 Wii ballet-themed simulation. Reference listings connect it to Deep Silver's Let's Play family line, while contemporary descriptions frame the fantasy around becoming a ballerina and performing famous ballet routines. The game is aimed at young players and family play, with its appeal resting on dance-school theme, motion controls, European Wii release context, and the difference from broader music-rhythm discs.",
  },
  {
    id: "wii-let-s-play-garden",
    sourceUrl: "https://www.gametdb.com/Wii/SGDEJJ",
    overview:
      "Let's Play Garden is ZigZagIsland and Deep Silver's Wii garden-themed simulation for younger players. GameTDB lists the NTSC-U release with English, French, and Spanish language support, one-player play, Wii Remote and Nunchuk controls, and a premise built around creating a garden, adding accessories, planting fruit trees and flowers, and playing seasonal minigames. It is a light family simulation rather than a farming RPG, with region, language support, and activity structure defining the release.",
  },
  {
    id: "wii-let-s-sing",
    sourceUrl: "https://it.wikipedia.org/wiki/Let%27s_Sing",
    overview:
      "Let's Sing is Voxler and Deep Silver's 2012 Wii karaoke release and the starting point for the long-running Let's Sing line. Series references place the original Wii entry before later annual sequels such as Let's Sing 2014 and Let's Sing 2015. It is a microphone-driven party game built around vocal performance rather than instrument play, so the important context is Wii karaoke support, European release lineage, Voxler development, and its role as the first branded Let's Sing installment.",
  },
  {
    id: "wii-let-s-sing-radio-italia",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Wii_games",
    overview:
      "Let's Sing @ Radio Italia is Voxler and Deep Silver's 2015 Wii karaoke release for the Italian Radio Italia brand. Wii catalog data places it as a European entry in the Let's Sing family, distinct from the numbered 2015 and 2016 releases. Its identity is regional and music-brand specific: Italian pop licensing, microphone-based party play, late Wii-era European distribution, and the exact Radio Italia subtitle are what separate it from the broader Let's Sing catalog.",
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
    if (!game) throw new Error(`Missing Wii game ${rewrite.id}`);
    return {
      platformSlug: "wii",
      gameId: rewrite.id,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: rewrite.sourceUrl,
      rewriteNotes:
        "Priority Wii weak-template cleanup; original Games Exchange editorial overview based on current catalog metadata plus publisher, ratings-board, specialist database, and regional reference checks.",
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
