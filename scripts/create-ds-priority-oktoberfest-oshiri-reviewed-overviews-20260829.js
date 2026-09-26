const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "ds-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ds-priority-oktoberfest-oshiri-reviewed-overviews-2026-08-29.csv"
);

const rewrites = {
  "ds-oktoberfest-the-official-game":
    "Oktoberfest: The Official Game turns the German festival into a DS minigame collection built around fairground contests, food-and-drink themed challenges, and quick party-style events. Its appeal is novelty and regional flavor rather than depth, making it a niche European-style catalog entry.",
  "ds-onegai-my-melody":
    "Onegai My Melody adapts Sanrio's anime character into a light DS adventure for younger players, with cute presentation, simple tasks, and character interactions carrying the experience. It is best understood as a Japan-focused licensed release where the My Melody branding is the main draw.",
  "ds-oni-zero-sengoku-ransei-hyakkaryouran":
    "Oni Zero: Sengoku Ransei Hyakkaryouran is a Japanese DS role-playing release that mixes Sengoku-era fantasy, party progression, and character-driven scenario material. The useful hook is its import RPG identity: players are following story, battles, and growth systems rather than a casual minigame loop.",
  "ds-onsei-kanjou-sokuteiki-kokoro-scan":
    "Onsei Kanjou Sokuteiki: Kokoro Scan is a Sega DS novelty title built around voice input and emotional-analysis style results. It leans into the hardware's microphone as a playful personality and communication tool, closer to a party gadget than a conventional adventure or strategy game.",
  "ds-ookami-to-koushinryou":
    "Ookami to Koushinryou adapts Spice and Wolf into a DS story and trading-simulation game, pairing character conversations with merchant decisions and travel. Its value comes from the Holo and Lawrence license, the economic premise, and the fact that understanding the text is central to play.",
  "ds-ookami-to-koushinryou-umiowataru-kaze":
    "Ookami to Koushinryou: Umiowataru Kaze continues the Spice and Wolf DS line with more story-driven travel, trading choices, and character interaction. It should be separated from the first game because the subtitle marks a distinct follow-up for anime and light-novel collectors.",
  "ds-ookiku-furika-butte":
    "Ookiku Furika Butte is a Nintendo DS game based on the baseball manga and anime, focused on the characters and team drama of Big Windup rather than a generic pro-baseball license. The appeal is the licensed cast, school baseball setting, and story context for fans.",
  "ds-operation-vietnam":
    "Operation: Vietnam is a squad-based military action game that compresses jungle missions, rescuing allies, and top-down firefights onto the DS. Players command a small team through hostile territory, so its identity is portable tactical shooting rather than arcade score chasing.",
  "ds-ore-ga-omae-o-mamoru":
    "Ore ga Omae o Mamoru is a Japanese DS action RPG with side-view exploration, fantasy combat, and character progression from Idea Factory and Vingt-et-un Systems. It is a niche import title where the draw is dungeon movement and combat flow rather than broad franchise recognition.",
  "ds-ore-sama-kingdom-koi-no-manga-mo-debut-o-mokushise-doki-doki-love-lesson":
    "Ore-Sama Kingdom: Koi no Manga mo Debut o Mokushise! Doki Doki Love Lesson adapts the shojo manga property into a DS romance and story game. It focuses on character scenes, manga-themed goals, and fan-service for readers of the series, making language and license context essential.",
  "ds-orient-quest":
    "Orient Quest is a casual hidden-object and puzzle adventure for Nintendo DS, built around searching scenes, solving light challenges, and moving through an Eastern-themed mystery wrapper. It fits the system's late casual catalog better than its action or RPG shelves.",
  "ds-original-frisbee-disc-sports-ultimate-and-golf":
    "Original Frisbee Disc Sports: Ultimate & Golf turns disc sports into a compact DS package with ultimate-style team play and disc-golf challenges. The hook is unusual subject matter: it offers stylus-era sports variety rather than another football, baseball, or racing release.",
  "ds-original-story-from-fairy-tail-gekitotsu-kardia-daiseidou":
    "Original Story from Fairy Tail: Gekitotsu! Kardia Daiseidou is a DS action RPG based on Hiro Mashima's Fairy Tail, using the anime cast in a handheld-exclusive scenario. It centers on guild characters, magic battles, and fan-focused story material rather than adapting one standard console format.",
  "ds-orla-frosnapper":
    "Orla Frosnapper is a Danish children's-property DS release built around simple tasks, friendly characters, and regional family entertainment. It is most useful in the database as a language- and region-specific licensed title that many broad game lists can overlook.",
  "ds-oscar-der-ballonfahrer":
    "Oscar der Ballonfahrer is a German-language children's adventure based on the educational character Oscar the Balloonist. On DS, it is about gentle exploration, learning-leaning activities, and young-player pacing, so region and language are more important than mechanical complexity.",
  "ds-oshare-na-koinu-ds":
    "Oshare na Koinu DS is a Japanese puppy-care and fashion-themed handheld game from MTO, built around tending to dogs, dressing them up, and completing simple pet activities. It belongs with the DS pet-sim boom while leaning more toward cute styling than realistic training.",
  "ds-oshare-ni-koishite-2-plus":
    "Oshare ni Koishite 2 Plus is a fashion and lifestyle follow-up from Culture Brain, focused on clothing, style choices, and character presentation for younger players. The Plus title matters because it signals a revised or expanded version within a small DS fashion-game line.",
  "ds-oshare-princess-ds-oshare-ni-koi-shite-2":
    "Oshare Princess DS: Oshare ni Koi Shite 2 continues Culture Brain's fashion-princess concept with outfit coordination, style events, and light story framing. It is best cataloged as a Japanese dress-up and lifestyle sim, separate from the first Oshare Princess DS entry.",
  "ds-oshare-princess-ds-oshare-ni-koishite":
    "Oshare Princess DS: Oshare ni Koishite! is a Japanese fashion and dress-up game about building looks, enjoying princess-themed presentation, and moving through light activity goals. Its appeal sits with the DS's younger-player lifestyle releases rather than traditional adventure games.",
  "ds-oshiri-kajiri-mushi-no-rhythm-lesson-ds-kawai-ongaku-kyoushitsu-kanshuu":
    "Oshiri Kajiri Mushi no Rhythm Lesson DS: Kawai Ongaku Kyoushitsu Kanshuu turns the quirky Japanese character into a rhythm-learning DS release supervised around music-lesson play. Players follow timing exercises and musical activities, making it a character-branded education/rhythm hybrid.",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const clean = String(text || "").replace(/^\uFEFF/, "");

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    const next = clean[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((csvRow) => csvRow.some((value) => String(value).trim()));
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const rows = parseCsv(fs.readFileSync(inputPath, "utf8"));
const headers = rows.shift();
const objects = rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
const selected = objects.filter((row) => rewrites[row.gameId]);

if (selected.length !== Object.keys(rewrites).length) {
  const found = new Set(selected.map((row) => row.gameId));
  const missing = Object.keys(rewrites).filter((id) => !found.has(id));
  throw new Error(`Missing expected batch rows: ${missing.join(", ")}`);
}

const outputRows = [
  headers.join(","),
  ...selected.map((row) =>
    headers
      .map((header) => {
        if (header === "rewriteNotes") return csvCell("Rewritten to remove template phrasing and describe the game-specific hook, play style, and catalog context.");
        if (header === "newOverview") return csvCell(rewrites[row.gameId]);
        if (header === "reviewStatus") return "approved";
        if (header === "reviewer") return "GCX";
        return csvCell(row[header]);
      })
      .join(",")
  ),
];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${outputRows.join("\n")}\n`);
console.log(`Wrote ${selected.length} reviewed DS overview rows to ${path.relative(rootDir, outputPath)}`);
