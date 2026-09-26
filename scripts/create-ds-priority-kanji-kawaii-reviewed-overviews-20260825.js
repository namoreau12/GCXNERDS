const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ds.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-kanji-kawaii-reviewed-overviews-2026-08-25.csv"
);

const rewriteNotes =
  "Priority DS weak-template cleanup; original GCX editorial overview based on platform databases, specialist game databases, series documentation, and gameplay/release context.";

const entries = [
  {
    id: "ds-kanji-no-wataridori",
    sourceUrl: "https://www.vgchartz.com/game/29667/kanji-no-wataridori/",
    overview:
      "Kanji no Wataridori is Success' Japan-only Nintendo DS kanji-learning release, aimed at repeated reading/writing practice rather than conventional game progression. It belongs to the DS wave of education and self-improvement cartridges, where the touch screen and stylus are the practical draw for handwriting recognition and drill-style study. GCX should present it as a Japanese-language learning tool first, with collector interest coming from Success' educational catalog and its Japan-only release.",
  },
  {
    id: "ds-kanshu-nippon-joshikiryoku-kentei-kyokai-imasara-hito-ni-wa-kikenai-otona-no-joshikiryoku-training-ds",
    sourceUrl: "https://en.wikipedia.org/wiki/Kansh%C5%AB_Nippon_J%C5%8Dshikiryoku_Kentei_Ky%C5%8Dkai:_Imasara_Hito_ni_wa_Kikenai_Otona_no_J%C5%8Dshikiryoku_Training_DS",
    overview:
      "Kanshu Nippon Joshikiryoku Kentei Kyokai: Imasara Hito ni wa Kikenai Otona no Joshikiryoku Training DS is Nintendo and HAL Laboratory's adult common-sense/social-knowledge training title. It fits the Brain Age-era DS market, but its focus is not brain exercises; it quizzes etiquette, manners, practical knowledge, and adult-life judgment under the supervision of the Japan Common Sense Examination Association. GCX should describe it as a lifestyle/knowledge trainer with Nintendo/HAL provenance.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ds-fate-of-heat",
    sourceUrl: "https://strategywiki.org/wiki/Katekyoo_Hitman_Reborn%21_DS%3A_Fate_of_Heat",
    overview:
      "Katekyo Hitman Reborn DS: Fate of Heat is the first DS entry in the Fate of Heat RPG subseries, covering material around the Kokuyo and Varia arcs. Battles are turn-based, with cards representing attacks, support actions, and recovery rather than free-form action inputs. GCX should separate it from the Flame Rumble fighters: this is the Reborn DS RPG/card-combat branch and the starting point for the two Fate of Heat sequels.",
  },
  {
    id: "ds-katekyo-hitman-reborn-bongole-shiki-taisen-battle-sugoroku",
    sourceUrl: "https://en.wikipedia.org/wiki/Reborn%21#Video_games",
    overview:
      "Katekyo Hitman Reborn! Bongole Shiki Taisen Battle Sugoroku is the DS board-game-inspired Reborn entry released in Japan in March 2008. The sugoroku framing matters: it is closer to a character board-game/battle-party format than to the RPG mechanics of Fate of Heat or the arena fighting of Flame Rumble. GCX should describe it as a Vongola-themed dice/board spinoff for series fans and import collectors.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ds-shinuki-max-vongola-carnival",
    sourceUrl: "https://en.wikipedia.org/wiki/Reborn%21#Video_games",
    overview:
      "Katekyo Hitman Reborn! DS: Shinuki Max! Vongola Carnival!! was the first Reborn video game release, arriving on Nintendo DS in Japan in March 2007. It uses the cast and comedy/action identity of the manga/anime for a carnival-style collection rather than the later RPG and fighting-game structures. GCX should flag it as the DS launch point for Reborn games, important for collectors because it precedes Flame Rumble and Fate of Heat.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ds-fate-of-heat-ii-unmei-no-futari",
    sourceUrl: "https://en.wikipedia.org/wiki/Reborn%21#Video_games",
    overview:
      "Katekyo Hitman Reborn! DS Fate of Heat II: Unmei no Futari is the second DS Fate of Heat RPG, released in Japan in April 2009. It continues the turn-based RPG/card-battle approach of the first Fate of Heat while expanding the Reborn story material and party roster. GCX should present it as the middle chapter of the DS RPG trilogy, not as a generic action game or Flame Rumble-style fighter.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ds-fate-of-heat-iii-yuki-no-shugosha-raishuu",
    sourceUrl: "https://en.wikipedia.org/wiki/Reborn%21#Video_games",
    overview:
      "Katekyo Hitman Reborn! DS Fate of Heat III: Yuki no Shugosha Raishuu! is the third Fate of Heat RPG, released in Japan in April 2010. It closes the DS RPG/card-battle branch with another story-led campaign built around party formation, character abilities, and card-driven combat commands. GCX should identify it as the final Fate of Heat entry so collectors can distinguish it from the many similarly named Reborn DS releases.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ds-flame-rumble-hyper-moeyo-mirai",
    sourceUrl: "https://en.wikipedia.org/wiki/Reborn%21#Video_games",
    overview:
      "Katekyo Hitman Reborn! DS Flame Rumble Hyper: Moeyo Mirai is part of the DS Flame Rumble fighting-game line, released after the earlier Mukuro Kyoushuu and Kaien Ring Soudatsuen entries. Unlike Fate of Heat, the draw here is character-vs-character combat using the Reborn cast, specials, and arc-specific roster appeal. GCX should file it as a DS anime fighter and a later Flame Rumble update, not as a conventional action-adventure game.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ds-flame-rumble-kaien-ring-soudatsuen",
    sourceUrl: "https://en.wikipedia.org/wiki/Reborn%21#Video_games",
    overview:
      "Katekyo Hitman Reborn! DS Flame Rumble Kaien Ring Soudatsuen! is the second DS Flame Rumble fighter, following Mukuro Kyoushuu and tying its theme to the Vongola ring conflict. The structure is built around anime fighting-game matchups rather than RPG party management, with appeal coming from character selection and special attacks. GCX should place it in the Flame Rumble fighting subseries and note its 2007 Japan-only DS release context.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ds-flame-rumble-mukuro-kyoushuu",
    sourceUrl: "https://en.wikipedia.org/wiki/Reborn%21#Video_games",
    overview:
      "Katekyo Hitman Reborn! DS Flame Rumble Mukuro Kyoushuu was the first Flame Rumble DS fighter, released in Japan in June 2007. It translates the Reborn cast into compact arena-style battles centered on character matchups, special moves, and the Mukuro storyline hook. GCX should identify it as the beginning of the DS fighting branch, separate from Shinuki Max's carnival format and Fate of Heat's RPG/card battles.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ds-flame-rumble-x",
    sourceUrl: "https://en.wikipedia.org/wiki/Katekyo_Hitman_Reborn!_DS_Flame_Rumble_X",
    overview:
      "Katekyo Hitman Reborn! DS Flame Rumble X is a later DS fighting entry in the Reborn Flame Rumble line. It keeps the series focused on portable character battles, special attacks, and roster familiarity while moving deeper into the franchise's future-arc material. GCX should describe it as a Reborn anime fighter and one of the late-DS Flame Rumble installments, not as a broad action game.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ds-flame-rumble-xx-kessen-real-6-chouka",
    sourceUrl: "https://en.wikipedia.org/wiki/Reborn%21#Video_games",
    overview:
      "Katekyo Hitman Reborn! DS Flame Rumble XX: Kessen! Real 6 Chouka is the final DS Flame Rumble release listed for July 2010. It continues the portable anime-fighting formula with a focus on late-series rivalries and the Real 6 Funeral Wreaths conflict. GCX should mark it as the end of the DS Flame Rumble fighting run, making it distinct from the Fate of Heat RPG trilogy released around the same period.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ds-mafia-daishuugou-bongole-festival",
    sourceUrl: "https://en.wikipedia.org/wiki/Reborn%21#Video_games",
    overview:
      "Katekyo Hitman Reborn! DS: Mafia Daishuugou Bongole Festival!! is a Japan-only DS Reborn game released in December 2008, positioned as a Vongola festival/party-style spinoff. It is not one of the Flame Rumble fighters or Fate of Heat RPGs; its value is the broader cast-event setup and fan-service collection feel. GCX should describe it as a mafia-family festival game for Reborn fans and collectors of the DS subseries.",
  },
  {
    id: "ds-katekyo-hitman-reborn-ore-ga-boss-saikyou-family-taisen",
    sourceUrl: "https://en.wikipedia.org/wiki/Reborn%21#Video_games",
    overview:
      "Katekyo Hitman Reborn! Ore ga Boss! Saikyou Family Taisen is a late DS Reborn entry released in Japan in December 2009. Its title points to a boss/family-battle setup, giving players another character-driven Vongola conflict outside the Fate of Heat RPG trilogy and Flame Rumble fighters. GCX should present it as a separate family-battle spinoff in Takara Tomy's dense DS Reborn catalog.",
  },
  {
    id: "ds-kawaii-koinu-ds-2",
    sourceUrl: "https://gamesdb.launchbox-app.com/games/images/132593-kawaii-koinu-ds-2",
    overview:
      "Kawaii Koinu DS 2 is MTO's 2008 Japan-only virtual-puppy simulation for Nintendo DS. It belongs to MTO's long Kawaii pet line, where players care for cute animals through daily routines rather than chase action stages or story routes. GCX should describe it as a puppy-care/life-sim sequel for collectors of Japanese DS pet software, especially because MTO's Kawaii dog and cat games form a recognizable subseries.",
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
  if (missing.length) {
    throw new Error(`Missing DS games: ${missing.map((entry) => entry.id).join(", ")}`);
  }

  const rows = [
    ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"],
    ...entries.map((entry) => {
      const game = byId.get(entry.id);
      return [
        "ds",
        entry.id,
        game.title || game.name || "",
        game.description || game.gcxOverview || game.overview || "",
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
