const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps1.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps1-priority-luciferd-mkimi-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps1-luciferd",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-00811.html",
    overview:
      "Luciferd is a Japanese psychological graphic adventure, not an action game. It is split across five separate stories with different protagonists, including scenarios set in the future, medieval Japan, and medieval Europe. Players primarily move a pointer, click locations, talk to characters, and use inventory items to advance each story, making it a text-and-interface-driven mystery package for adventure fans comfortable with Japanese.",
  },
  {
    id: "ps1-lucky-luke-western-fever",
    sourceUrl: "https://psxdatacenter.com/games/P/L/SLES-03530.html",
    overview:
      "Lucky Luke: Western Fever is a 3D action-adventure shooter based on the comic-book cowboy, not a casino release. Players guide Lucky Luke through fixed-path western locations, solve light puzzles, dodge hazards, and switch into shooting sequences where aiming, taking cover, and reloading matter. The story sends Lucky Luke after outlaws who have captured Snake Foot, so the play loop mixes exploration, target shooting, and licensed cartoon-western set pieces.",
  },
  {
    id: "ps1-luftwaffe-doitsu-kuugun-o-shiki-seyo",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-01832.html",
    overview:
      "Luftwaffe: Doitsu Kuugun o Shiki Seyo is a World War II air-force command strategy game. The player acts as commander of Germany's air force, assembling squadrons from roughly 100 propeller aircraft models and pairing aircraft with pilots. Its focus is real-time operational movement and 3D battle presentation rather than direct dogfighting, so the appeal is planning force composition and watching air operations unfold.",
  },
  {
    id: "ps1-lunatic-dawn-iii",
    sourceUrl: "https://www.igdb.com/games/lunatic-dawn-iii",
    overview:
      "Lunatic Dawn III continues Artdink's open-ended RPG line, where the attraction is player freedom rather than a single tightly scripted quest. The pitch is to act as you please: pursue the path of a veteran hero, take on battles, build a party, and move through a fantasy world shaped by player choice. On PlayStation it is a Japanese import RPG for players interested in systems, wandering, and role definition more than fast arcade pacing.",
  },
  {
    id: "ps1-lunatic-dawn-odyssey",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-02420.html",
    overview:
      "Lunatic Dawn Odyssey is an Artdink RPG about guiding a group of adventurers through towns, shops, conversations, field travel, and turn-based battles. Source descriptions note a first-person perspective during adventure movement and a third-person view during combat. The result is a more conventional questing RPG than the template suggests, with party equipment, town interaction, and enemy encounters forming the core loop.",
  },
  {
    id: "ps1-lup-salad-lupupu-cube",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-00416.html",
    overview:
      "Lup Salad: Lupupu Cube is a charming block-pushing puzzle game starring Salad, a cake-loving girl trapped in side-view puzzle rooms. Each stage asks players to push colored blocks into matches of three or more while managing gravity: blocks left unsupported can fall, including onto Salad herself. It is closer to a single-screen action-puzzle game than a generic pattern game, built around spatial planning, reset-friendly experimentation, and cute presentation.",
  },
  {
    id: "ps1-lupin-iii-chateau-de-cagliostro-saikai",
    sourceUrl: "https://psxdatacenter.com/games/J/L/SLPS-91060.html",
    overview:
      "Lupin III: Chateau de Cagliostro Saikai is an interactive follow-up to The Castle of Cagliostro set ten years after the film. Players return to Cagliostro, explore a fully rendered 3D version of the castle area, watch movie clips, solve puzzles, and gather information tied to Lupin's earlier exploits. It functions as part adventure game and part film encyclopedia, with its appeal strongest for Lupin III fans who want to poke through Cagliostro's locations.",
  },
  {
    id: "ps1-m-kimi-o-tsutaete",
    sourceUrl: "https://psxdatacenter.com/games/J/M/SLPS-00393.html",
    overview:
      "m: Kimi o Tsutaete is a Japanese dating simulation from Nexus Interact centered on three main heroines and multiple endings. Player choices affect the emotional state of the characters, represented through a diary whose color changes as relationships shift. The experience is about reading scenes, choosing how to respond, and steering affection over time, so it should be treated as a relationship-management visual novel rather than a reflex-driven game.",
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
      "Priority PS1 weak-template cleanup; original GCX editorial overview based on specialist database, review, and gameplay sources.",
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
