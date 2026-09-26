const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "overview-rewrite-batches", "psp-overview-rewrite-batch.csv");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "psp-priority-dtcarnage-hellokitty-reviewed-overviews-2026-08-29.csv"
);

const rewrites = {
  "psp-dt-carnage":
    "DT Carnage is a PSP combat racer built around armored vehicles, aggressive driving, and track events where surviving rivals matters as much as clean cornering. It fits the handheld's budget action-racing shelf, with its appeal coming from car combat, upgrades, and short portable events.",
  "psp-harakuju-tantei-gakuen-steel-wood":
    "Harakuju Tantei Gakuen: Steel Wood is a Japanese mystery adventure from Idea Factory centered on investigation, dialogue, and school-life suspense. It is language-heavy, so the real experience depends on following character conversations and case details rather than action mechanics.",
  "psp-harukanaru-toki-no-naka-de-4-aizouban":
    "Harukanaru Toki no Naka de 4: Aizouban brings the fourth entry in Ruby Party's historical fantasy romance series to PSP in an expanded portable form. Players follow character routes, relationship events, and supernatural drama, making the edition and language support important context.",
  "psp-harukanaru-toki-no-naka-de-5":
    "Harukanaru Toki no Naka de 5 moves the long-running otome adventure series into a new cast and era, mixing visual-novel progression with romance routes and historical fantasy stakes. On PSP, its identity is the portable character-route structure rather than combat depth.",
  "psp-harukanaru-toki-no-naka-de-5-kazahanaki":
    "Harukanaru Toki no Naka de 5: Kazahanaki is a follow-up fan-disc style release for the fifth Harukanaru entry, adding more character material and scenario content for players already invested in its cast. It should be treated as a companion edition rather than a standalone starting point.",
  "psp-harukanaru-toki-no-naka-de-6":
    "Harukanaru Toki no Naka de 6 is a later PSP entry in Ruby Party's otome fantasy series, focused on character bonds, branching scenes, and period-flavored supernatural romance. It matters as a late-platform release where exact title, edition, and language dependence are central.",
  "psp-harukanaru-toki-no-naka-de-hachiyoushou":
    "Harukanaru Toki no Naka de: Hachiyoushou revisits the original Harukanaru setting with portable presentation and route-based romantic fantasy storytelling. It is aimed at series followers who want the early cast on PSP, so it should be cataloged separately from numbered sequels and later expansions.",
  "psp-harukanaru-toki-no-naka-de-iroetebako":
    "Harukanaru Toki no Naka de: Iroetebako is a PSP package tied to the early Harukanaru romance-adventure material, with Ruby Party's character routes and historical fantasy tone at the center. Its value is mostly for series completists tracking the exact portable edition.",
  "psp-hatsukare-renai-debut-sengen":
    "HatsuKare Renai Debut Sengen! is a FuRyu romance adventure about first-love scenarios, character conversations, and route progression. The play is built around reading choices and character events, making it a strongly language-dependent PSP import.",
  "psp-hatsune-miku-project-diva-tsuka-gakkyokushuu-deluxe-pack-1-miku-ta-okawari":
    "Hatsune Miku: Project Diva - Miku ta, Okawari is an add-on style PSP rhythm package tied to Sega's first Project Diva era. It adds song and edit-content material for players already using the base Project Diva framework, so the package is best understood as companion content.",
  "psp-hatsune-miku-project-diva-tsuka-gakkyokushuu-deluxe-pack-2-motto-okawari-rin-ren-ruka":
    "Hatsune Miku: Project Diva - Motto Okawari, Rin-Ren Ruka is a second companion package for Sega's PSP rhythm series, expanding the Vocaloid song and character material around Rin, Len, and Luka. Its appeal depends on the track content and connection to the larger Project Diva release line.",
  "psp-hayarigami-2-portable-keishichou-kaii-jiken-file":
    "Hayarigami 2 Portable: Keishichou Kaii Jiken File is a horror-tinged detective visual novel about urban legends, police cases, and unsettling supernatural possibilities. The PSP version is about reading investigations, choosing approaches, and following branching mystery logic.",
  "psp-hayarigami-3-keishichou-kaii-jiken-file":
    "Hayarigami 3: Keishichou Kaii Jiken File continues Nippon Ichi's occult police-adventure series with more case-based horror stories and investigative decisions. It is a text-heavy mystery release where the appeal is atmosphere, deduction, and the series' urban-legend framing.",
  "psp-hayarigami-portable-keishichou-kaii-jiken-file":
    "Hayarigami Portable: Keishichou Kaii Jiken File brings the first occult detective entry to PSP, combining police investigation with urban-legend horror. Players work through case files, theories, and story choices, so it is best presented as a visual novel mystery rather than action horror.",
  "psp-hayate-no-gotoku-nightmare-paradise":
    "Hayate no Gotoku! Nightmare Paradise adapts the comedy manga and anime into a PSP character adventure with visual-novel scenes, route choices, and fan-focused scenario material. The hook is spending time with the cast in a new story rather than mastering complex systems.",
  "psp-heart-no-kuni-no-alice-anniversary-ver-wonderful-wonder-world":
    "Heart no Kuni no Alice: Anniversary Ver. Wonderful Wonder World is an updated PSP edition of QuinRose's Alice in the Country of Hearts otome adventure. It centers on romantic routes, dark fairy-tale character dynamics, and expanded presentation for returning players.",
  "psp-heart-no-kuni-no-alice-wonderful-twin-world":
    "Heart no Kuni no Alice: Wonderful Twin World is a later PSP entry in QuinRose's Alice-themed romance series, adding new route material and character scenarios in the same strange Wonderland setting. It is a fan-oriented follow-up where subtitle accuracy matters.",
  "psp-heart-no-kuni-no-alice-wonderful-wonder-world":
    "Heart no Kuni no Alice: Wonderful Wonder World is the PSP version of QuinRose's otome visual novel that reimagines Alice in Wonderland through romance routes, dangerous factions, and character-driven choices. Its appeal is story density and cast interaction, not action play.",
  "psp-heaven-s-will":
    "Heaven's Will is a QuinRose PSP visual novel centered on romantic route progression, fantasy-inflected drama, and character choices. It sits with the publisher's otome catalog, where exact edition, language dependence, and complete packaging are the useful database details.",
  "psp-hello-kitty-to-issho-block-crash-123":
    "Hello Kitty to Issho! Block Crash 123!! mixes Sanrio character branding with block-breaking arcade puzzle play across many short stages. The draw is the Hello Kitty crossover presentation layered over familiar paddle-and-brick mechanics, making it a niche licensed PSP curiosity.",
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

function cleanSourceUrl(row) {
  if (row.gameId === "psp-harukanaru-toki-no-naka-de-hachiyoushou") {
    return "https://en.wikipedia.org/wiki/Harukanaru_Toki_no_Naka_de";
  }
  return row.sourceUrl;
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
        if (header === "sourceUrl") return csvCell(cleanSourceUrl(row));
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
console.log(`Wrote ${selected.length} reviewed PSP overview rows to ${path.relative(rootDir, outputPath)}`);
