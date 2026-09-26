const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "psp-priority-hellokitty-mahjong-reviewed-overviews-2026-08-29.csv"
);

const rows = [
  {
    gameId: "psp-hello-kitty-puzzle-party",
    newOverview:
      "Hello Kitty: Puzzle Party is a PSP puzzle release built around Sanrio character appeal, short sessions, and accessible matching or board-style challenges rather than a long adventure campaign. It is most relevant to family-game and character-brand collectors, so region, language, and complete UMD packaging matter more than competitive depth.",
  },
  {
    gameId: "psp-hentai-ouji-to-warawanai-neko",
    newOverview:
      "Hentai Ouji to Warawanai Neko. is a Japanese PSP adventure/visual-novel tie-in for the romantic comedy series also known as The Hentai Prince and the Stony Cat. The draw is character interaction, route-style story material, and fan-facing presentation, making language support, region, and limited-edition contents the most important listing details.",
  },
  {
    gameId: "psp-heroes-phantasia",
    newOverview:
      "Heroes Phantasia is a crossover RPG that pulls characters from multiple anime properties into a party-based adventure on PSP. Its appeal is the licensed cast and turn-based structure rather than original worldbuilding alone, so collectors should watch for Japanese-language dependence, edition completeness, and character-roster expectations.",
  },
  {
    gameId: "psp-heroes-vs",
    newOverview:
      "Heroes' VS is a PSP crossover fighting game built around matchups between well-known tokusatsu/anime-style heroes and villains. It is a fan-service arena fighter where roster, controls, and license appeal carry the experience, so region, manual condition, and familiarity with the source franchises matter for buyers.",
  },
  {
    gameId: "psp-higurashi-daybreak-portable",
    newOverview:
      "Higurashi Daybreak Portable adapts the Higurashi cast into a team-based action battler instead of a straight visual novel. Players pick characters, manage spacing and attacks, and replay fights around familiar series personalities, making it a niche pickup for Higurashi fans who want a portable action spin-off.",
  },
  {
    gameId: "psp-higurashi-daybreak-portable-mega-edition",
    newOverview:
      "Higurashi Daybreak Portable Mega Edition is an expanded PSP version of the Higurashi Daybreak action spin-off, aimed at players who want more of the character-battle format. It should be treated as a companion/expanded release, with listings calling out exact edition, region, and whether any bonus materials are included.",
  },
  {
    gameId: "psp-higurashi-no-naku-koro-ni-jan",
    newOverview:
      "Higurashi no Naku Koro ni Jan moves the Higurashi brand into a mahjong-focused PSP release, pairing series characters with table-game play. It is less about horror storytelling than licensed character presentation around mahjong rules, so buyers need clear language, region, and rule-set expectations.",
  },
  {
    gameId: "psp-hiiro-no-kakera-portable",
    newOverview:
      "Hiiro no Kakera Portable brings Otomate's supernatural otome visual novel to PSP, focusing on romance routes, folklore, protective guardians, and choice-driven story progression. It is a text-heavy import where the main value is portable route reading, so listings should be clear about Japanese language and edition completeness.",
  },
  {
    gameId: "psp-hiiro-no-kakera-shin-tamayori-hime-denshou-portable",
    newOverview:
      "Hiiro no Kakera: Shin Tamayori Hime Denshou Portable continues the series' otome formula with supernatural romance, branching conversations, and character-route structure. The PSP release is collector-facing for Otomate fans, with region, language, cover variant, and bonus inserts carrying practical importance.",
  },
  {
    gameId: "psp-hiiro-no-kakera-shin-tamayorihime-denshou-piece-of-future",
    newOverview:
      "Hiiro no Kakera: Shin Tamayorihime Denshou - Piece of Future is a follow-up/fan-disc-style PSP entry that expands character material from the Shin Tamayori Hime branch of the series. It is best understood as companion story content for existing fans rather than a universal starting point.",
  },
  {
    gameId: "psp-himawari-no-kyoukai-to-nagai-natsuyasumi-extra-vacation",
    newOverview:
      "Himawari no Kyoukai to Nagai Natsuyasumi: Extra Vacation is a Japanese visual-novel release centered on expanded story and character material for readers who already follow the title. Its marketplace value depends on language expectations, publisher/edition details, and whether the listing includes original packaging or bonuses.",
  },
  {
    gameId: "psp-himawari-pebble-in-the-sky-portable",
    newOverview:
      "Himawari: Pebble in the Sky Portable is a PSP visual novel with science-fiction and character-drama elements, built around long-form reading, branching scenes, and mood rather than arcade play. It belongs in the import adventure lane, where language support and complete UMD condition are the key buyer signals.",
  },
  {
    gameId: "psp-himehibi-new-princess-days-zoku-ni-gakku-portable",
    newOverview:
      "Himehibi: New Princess Days!! Zoku! Ni-Gakku Portable is a Takuyo otome visual novel focused on school-life romance, character choices, and route progression. As a PSP import, it is most useful to collectors when listings identify the exact subtitle, region, language, and whether the copy includes manual or special-edition material.",
  },
  {
    gameId: "psp-himehibi-princess-days-portable",
    newOverview:
      "Himehibi: Princess Days Portable is a PSP otome release that emphasizes character routes, dialogue choices, and romantic school-life storytelling. It is a text-heavy experience rather than a mechanics-first RPG, so the most important listing details are language, edition, condition, and series placement.",
  },
  {
    gameId: "psp-hisshou-pachinko-pachi-slot-kouryaku-series-portable-vol-1-shinseiki-evangelion-tamashii-no-kiseki",
    newOverview:
      "Hisshou Pachinko Pachi-Slot Kouryaku Series Portable Vol. 1: Shinseiki Evangelion Tamashii no Kiseki is a PSP pachinko/pachi-slot simulation tied to Evangelion machine play. It is aimed at fans of the licensed cabinets and odds-based practice, so buyers should know it is a niche Japanese gambling-machine simulation, not a traditional action game.",
  },
  {
    gameId: "psp-hisshou-pachinko-pachi-slot-kouryaku-series-portable-vol-2-cr-evangelion-hajimari-no-fukuin",
    newOverview:
      "Hisshou Pachinko Pachi-Slot Kouryaku Series Portable Vol. 2: CR Evangelion - Hajimari no Fukuin continues D3 Publisher's Evangelion-themed pachinko/pachi-slot simulation line on PSP. Its appeal is machine recreation, pattern study, and franchise collecting, with region and exact volume number essential for marketplace clarity.",
  },
  {
    gameId: "psp-hitsuji-kunnara-kiss-shite-ageru",
    newOverview:
      "Hitsuji Kunnara Kiss Shite Ageru is a Japanese PSP visual-novel/adventure release from CyberFront, built around dialogue scenes, character interaction, and route-style progression instead of reflex-heavy play. It belongs to the handheld import library's romance/adventure lane, where the buyer needs to know the language, exact title variant, UMD condition, manual status, and whether any first-print extras are present.",
  },
  {
    gameId: "psp-hiyoko-kantei",
    newOverview:
      "Hiyoko Kantei is a small Japan-only PSP release from SCEJ with a novelty/minigame flavor rather than a conventional campaign structure. It sits in the obscure end of the PSP catalog, so listings should make the title, region, format, and condition especially clear for collectors trying to distinguish it from similarly niche imports.",
  },
  {
    gameId: "psp-hokuto-no-ken-raoh-gaiden-ten-no-haoh",
    newOverview:
      "Hokuto no Ken: Raoh Gaiden - Ten no Haoh is a PSP game tied to the Fist of the North Star side-story centered on Raoh. The appeal is licensed action/story material for series fans, so buyers should expect a Japan-focused release and check region, manual, case art, and whether they want this specific Raoh Gaiden entry.",
  },
  {
    gameId: "psp-honkaku-yonin-uchi-pro-mahjong-mahjong-ou-portable",
    newOverview:
      "Honkaku Yonin-uchi Pro Mahjong: Mahjong-Ou Portable is a serious four-player mahjong title for PSP, aimed at rule familiarity, repeat play, and portable table-game sessions. It is useful for players who specifically want Japanese mahjong on UMD, with language, rule presentation, and complete packaging shaping collector interest.",
  },
];

const batchPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "psp-overview-rewrite-batch.csv");
const batch = fs.readFileSync(batchPath, "utf8");

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}

const lines = batch.split(/\r?\n/).filter(Boolean);
const headers = parseLine(lines[0]);
const byId = new Map();
lines.slice(1).forEach((line) => {
  const values = parseLine(line);
  const record = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  byId.set(record.gameId, record);
});

const outputRows = rows.map((row) => {
  const record = byId.get(row.gameId);
  if (!record) throw new Error(`Missing ${row.gameId} in PSP overview batch`);
  return {
    ...record,
    rewriteNotes: "GCX reviewed pass: replaced metadata template with specific gameplay/story context and marketplace-relevant version notes.",
    newOverview: row.newOverview,
    reviewStatus: "approved",
    reviewer: "GCX",
  };
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  `${headers.join(",")}\n${outputRows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`,
  "utf8"
);

console.log(`Wrote ${outputRows.length} reviewed PSP overview rows to ${path.relative(rootDir, outputPath)}`);
