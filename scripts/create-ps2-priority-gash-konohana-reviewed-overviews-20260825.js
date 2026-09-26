const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps2.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps2-priority-gash-konohana-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps2-konjiki-no-gash-bell-yuujou-tag-battle",
    sourceUrl: "https://backloggd.com/games/konjiki-no-gash-bell-yuujou-tag-battle/",
    overview:
      "Konjiki no Gash Bell!: Yuujou Tag Battle adapts Zatch Bell into a 3D arena-fighting format built around partnered combat. Instead of a one-on-one martial-arts structure, the appeal is controlling spellcaster pairs, moving around open spaces, and using character-specific attacks that reflect the anime's mamodo-and-human teamwork. It is the first Yuujou Tag Battle entry, so it establishes the tag-battle foundation that later games refine.",
  },
  {
    id: "ps2-konjiki-no-gash-bell-go-go-mamono-fight",
    sourceUrl: "https://kotaku.com/games/konjiki-no-gash-bell-go-go-mamono-fight",
    overview:
      "Konjiki no Gash Bell!! Go! Go! Mamono Fight!! shifts the series toward a broader four-player brawler. Developed by Eighting and published by Bandai, it keeps the Zatch Bell cast and spell-based personality but plays closer to a party-fighting format, with multiple fighters sharing the stage and knocking each other around. That makes it more chaotic and multiplayer-friendly than the earlier tag-focused entries.",
  },
  {
    id: "ps2-konneko-keep-a-memory-green",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-66153.html",
    overview:
      "Konneko: Keep a Memory Green is a Japanese romance visual novel centered on Yuu, a high-school student whose life changes when Touka returns after a long hospital stay. The story starts with that reunion after two years apart, then branches into meetings with other heroines. Its identity is character drama and relationship memory rather than systems-heavy simulation, with the PS2 release pairing Mikeou's character art with a console-friendly love-sim presentation.",
  },
  {
    id: "ps2-kono-aozora-ni-yakusoku-o-melody-of-the-sun-and-sea",
    sourceUrl: "https://en.wikipedia.org/wiki/Kono_Aozora_ni_Yakusoku_o",
    overview:
      "Kono Aozora ni Yakusoku o: Melody of the Sun and Sea is the PlayStation 2 version of Giga's island-dormitory visual novel, with adult material removed and console additions folded in. Players mostly read dialogue and narration, then make choices that point the story toward one of several heroine routes. The PS2 version adds scenario revisions, system changes, new CG, and short stories after cleared routes, making it a fuller console edition of the dorm farewell drama.",
  },
  {
    id: "ps2-kono-haretasora-no-shita-de",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65925.html",
    overview:
      "Kono Haretasora no Shita de is a sci-fi visual novel set in a near future where humanoid Mimic robots work in place of humans. The player follows Reiichi Kuroha, a government investigator assigned to look into the apparent suicide of a Mimic, an impossible event under the setting's rules. Its hook is the mix of romance, investigation, and artificial-life mystery, presented through anime-style stills, text, and branching story choices.",
  },
  {
    id: "ps2-konohana-2-todoke-kanai-requiem",
    sourceUrl: "https://www.mobygames.com/game/66273/konohana-2-todokanai-requiem/",
    overview:
      "Konohana 2: Todoke Kanai Requiem continues the mystery-adventure format of the Konohana series. Meguru Momoi returns as a second-year Konohana High School student, and the game again uses text, anime-style character art, and investigation-driven choices to move through a murder case. It is less about action than deduction: read conversations, follow leads, and piece together what happened as the newspaper-club cast is pulled into another case.",
  },
  {
    id: "ps2-konohana-3-itsuwari-no-kage-no-mukou-ni",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65299.html",
    overview:
      "Konohana 3: Itsuwari no Kage no Mukou ni sends Meguru Momoi, Miako Tachibana, and the newspaper-club team to an amusement park after earlier murder cases have made them known around town. The setup begins with a call from the park manager and turns into another venue-based mystery. Players work through a text-heavy adventure structure, reading testimony, following clues, and watching the team's reputation pull them deeper into a new investigation.",
  },
  {
    id: "ps2-konohana-4-yami-wo-harau-inori",
    sourceUrl: "https://psxdatacenter.com/psx2/games2/SLPM-65690.html",
    overview:
      "Konohana 4: Yami wo Harau Inori is the fourth PS2 mystery adventure starring Meguru Momoi, Miako Tachibana, and their newspaper-club circle. It keeps the series' text-based conversation system and anime-style presentation, placing the characters into another story-driven case rather than changing genres. As the later PS2 installment, it is best understood as a continuation for players who want more of the cast's investigative rhythm and character banter.",
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
      "Priority PS2 weak-template cleanup; original GCX editorial overview based on specialist catalog, database, and gameplay-description sources.",
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
