const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-kabutore-kangaeru-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority DS weak-template cleanup; original GCX editorial overview based on platform databases, specialist databases, retail metadata, and franchise context.";

const entries = [
  {
    id: "ds-kabushiki-baibai-trainer-kabutore",
    sourceUrl: "https://giantbomb.com/wiki/Games/Kabushiki_Baibai_Trainer_Kabutore",
    overview:
      "Kabushiki Baibai Trainer: Kabutore! is Konami's Japan-only DS stock-trading trainer, part of the brief wave of Japanese handheld games built around investing and market literacy. Instead of fantasy trading battles like Capcom's later Kabu Trader Shun, Kabutore is better treated as finance-training software: players learn buying, selling and market judgment through DS-friendly simulation exercises. GCX should describe it as a practical stock-market trainer and Konami import curiosity, not a generic management sim.",
  },
  {
    id: "ds-kabushiki-baibai-trainer-kabutore-next",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/132484-kabushiki-baibai-trainer-kabutore-next",
    overview:
      "Kabushiki Baibai Trainer: Kabutore! Next is the 2007 follow-up to Konami's DS stock-trading trainer, developed by WinkySoft and released only in Japan. It continues the stock-market education concept, giving collectors a direct sequel in a niche DS finance-software line rather than a traditional game sequel with action or story progression. GCX should frame it as a more specialized investing/training import, useful for people cataloging Konami's nontraditional DS output.",
  },
  {
    id: "ds-kacho-shima-kosaku-ds-dekiru-otoko-no-love-and-success",
    sourceUrl: "https://en.wikipedia.org/wiki/Kosaku_Shima",
    overview:
      "Kachou Shima Kousaku DS: Dekiru Otoko no Love & Success adapts Kenshi Hirokane's long-running Kosaku Shima business manga, whose central character climbs Japan's corporate ladder through workplace politics, relationships and executive culture. The DS release sits beside earlier Shima Kosaku business-adventure adaptations, so GCX should present it as a Konami manga tie-in about adult career and social success rather than a generic simulation game. Its appeal is licensing context and corporate-drama novelty.",
  },
  {
    id: "ds-kageyama-hideo-no-iq-teacher-ds",
    sourceUrl: "https://www.speedrun.com/ru-RU/kageyama_hideo_no_iq_teacher_ds_kangaeru_chikara_to_oboeru_chikara/runs/new",
    overview:
      "Kageyama Hideo no IQ Teacher DS is an IE Institute educational release tied to the Kageyama learning-method brand, built around short exercises for thinking and memory skills. Public challenge listings point to discrete activities such as line-connection tasks, which fits the DS-era brain-training format rather than ordinary management simulation. GCX should describe it as Japanese study software for import collectors and education-game researchers, with value tied to the Kageyama brand and DS stylus practice format.",
  },
  {
    id: "ds-kaiichi-otto-sensei-tokyo-daigaku-kanshuu-sukusuku-kosodate-ds-akachan-to-asobou",
    sourceUrl: "https://backloggd.com/games/kaiichi-otto-sensei-tokyo-daigaku-kanshuu-suku-suku-kosodate-ds-akachan-to-asobou/",
    overview:
      "Kaiichi Otto Sensei Tokyo Daigaku Kanshuu: Sukusuku Kosodate DS: Akachan to Asobou! is a Marvelous Japan-only DS parenting/child-development title released in April 2008. The title and retail listings position it as supervised baby-care or early-childhood interaction software rather than a conventional game campaign. GCX should keep the description practical: this is a niche lifestyle/parenting DS release for collectors tracking the handheld's broader non-game and family-support catalog.",
  },
  {
    id: "ds-kaijuu-busters",
    sourceUrl: "https://www.siliconera.com/who-are-you-gonna-call-kaiju-busters/",
    overview:
      "Kaijuu Busters is Bandai Namco's Ultraman-flavored DS hunting action game, often described as Earth Defense Force meeting Monster Hunter. Players take missions across alien planets, fight giant monsters, gather materials and build gear, with local multiplayer giving the loop much of its appeal. GCX should present it as a serious import-action curiosity on DS: a portable kaiju-hunting game with strong franchise flavor, not just a vague action title.",
  },
  {
    id: "ds-kaijuu-busters-powered",
    sourceUrl: "https://www.siliconera.com/kaiju-busters-powered-has-a-powered-buggy/",
    overview:
      "Kaijuu Busters Powered is the expanded follow-up to Bandai Namco's DS kaiju-hunting game, adding refinements such as improved multiplayer, a powered buggy and additional Ultraman-flavored monster encounters. The core loop remains planet exploration, material gathering, gear crafting and giant-monster fights. GCX should distinguish it from the first release as the more complete version for import players, while noting that language and item-management demands can matter for collectors who actually plan to play it.",
  },
  {
    id: "ds-kaite-oboeru-dora-gana",
    sourceUrl: "https://segaretro.org/Kaite_Oboeru_Doragana",
    overview:
      "Kaite Oboeru: Dora-Gana is Sega's Doraemon-branded DS education title focused on learning kana through writing practice. The key hook is the combination of Doraemon characters, stylus handwriting and Japanese-language drills, making it closer to children's study software than to a licensed adventure. GCX should frame it as a character-backed hiragana/kana learning import, valuable for Doraemon collectors and for anyone studying the DS's education-software boom.",
  },
  {
    id: "ds-kaite-shabette-hajimeyou-monster-farm-ds",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/141603-kaite-shabette-hajimeyou-monster-farm-ds",
    overview:
      "Kaite Shabette Hajimeyou! Monster Farm DS brings Tecmo's Monster Farm/Monster Rancher formula to Nintendo DS with monster raising, battling and breeding managed through menus. The player works with apprentice Cleo and uses the handheld's input identity to refresh the familiar raise-and-fight loop for a Japanese DS audience. GCX should present it as the unlocalized first DS Monster Farm entry, especially important beside the later sequel that reached North America as Monster Rancher DS.",
  },
  {
    id: "ds-kaitou-rousseau",
    sourceUrl: "https://www.siliconera.com/kaitou-rousseau/",
    overview:
      "Kaitou Rousseau is Namco's stylus-driven phantom-thief adventure about drawing disguises on the DS touch screen to evade pursuers and blend into scenes. Coverage highlights its comic adventure feel, short seven-to-eight-hour length and unlockable disguise-trial mode after completion. GCX should describe it as a clever Japan-only detective/thief adventure whose face-drawing mechanic is the reason import fans still remember it.",
  },
  {
    id: "ds-kaizoku-sentai-gokaiger-atsumete-henshin-35-sentai",
    sourceUrl: "https://en.wikipedia.org/wiki/Kaizoku_Sentai_Gokaiger",
    overview:
      "Kaizoku Sentai Gokaiger: Atsumete Henshin! 35 Sentai is Bandai Namco's DS tie-in for the 35th Super Sentai anniversary series. The TV show centers on pirate-themed heroes who can transform using the powers of the previous 34 Sentai teams, and the DS game leans on that collection/transform premise rather than standalone action identity. GCX should present it as a Japan-only tokusatsu anniversary release for Sentai and Power Rangers-adjacent collectors.",
  },
  {
    id: "ds-kakuromaniacs",
    sourceUrl: "https://www.mobygames.com/game/142811/kakuromaniacs/",
    overview:
      "Kakuromaniacs is a FrontLine Studios number-puzzle release for Nintendo DS focused on Kakuro grids. The back-of-box summary emphasizes 500 puzzles, three difficulty levels, themed presentation, text recognition and stylus control, making it a pure logic-puzzle package rather than a broad casual minigame collection. GCX should describe it as a European DS Kakuro title for puzzle collectors, especially those tracking the sudoku/kakuro handheld boom.",
  },
  {
    id: "ds-kambayashi-shiki-nouryoku-kaihatsu-hou-unou-kids-ds",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/details/141634-kanbayashi-shiki-nouryoku-kaihatsu-hou-unou-kids-ds",
    overview:
      "Kambayashi Shiki Nouryoku Kaihatsu Hou: Unou Kids DS is an IE Institute brain-training title for children, released under educational supervision and aimed at right-brain skill development. It belongs to the DS library's large study-and-training category, where quick exercises and repeat practice matter more than story or progression. GCX should identify it as Japan-only children's learning software, useful for collectors tracking brain-training spin-offs beyond Nintendo's better-known Brain Age line.",
  },
  {
    id: "ds-kamo-no-hashikamo-aimai-seikatsu-no-susume",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/132510-kamo-no-hashikamo-aimai-seikatsu-no-susume",
    overview:
      "Kamo no Hashikamo: Aimai Seikatsu no Susume is a 2009 ASCII Media Works DS adventure release built around the Kamo no Hashikamo character property. Public databases confirm its Japan-only release and adventure classification, but detailed mechanics are sparse, so GCX should avoid overexplaining it. The useful collector framing is a late DS character/adventure import from ASCII Media Works, with appeal tied to mascot branding and Japanese media-goods context.",
  },
  {
    id: "ds-kangaeru-chikara-o-gungun-nobasu-ds-youji-no-nou-tore",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/132511-kangaeru-chikara-o-gungun-nobasu-ds-youji-no-nou-tore",
    overview:
      "Kangaeru Chikara o Gungun Nobasu! DS Youji no Nou Tore is a ShoPro educational DS title for young children, released in Japan in 2008. The title translates broadly around strengthening thinking ability and early-childhood brain training, which places it firmly in the preschool learning category rather than the shooter label the old template implied. GCX should describe it as child-focused cognitive training software and a niche Japan-only study release.",
  },
];

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const missing = entries.filter((entry) => !byId.has(entry.id));
  if (missing.length) throw new Error(`Missing DS games: ${missing.map((entry) => entry.id).join(", ")}`);

  const rows = [
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "ds",
        entry.id,
        game.title,
        game.description || game.overview || "",
        entry.sourceUrl,
        rewriteNotes,
        entry.overview,
        "reviewed",
        "GCX editorial cleanup",
      ];
    }),
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");
  console.log(`Wrote ${entries.length} reviewed DS overviews to ${path.relative(rootDir, outputPath)}`);
}

main();
