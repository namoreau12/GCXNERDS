const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(rootDir, "data", "games", "reviewed-overview-imports", "ps4-priority-bus-chimparty-reviewed-overviews-2026-08-25.csv");

const reviewedOverviews = {
  "ps4-bus-simulator-18":
    "Bus Simulator 18 brings Stillalive's city-route driving sim to PS4, focusing on scheduled public transit rather than racing. Players manage routes, obey traffic rules, handle stops, and grow a bus company, making it useful for collectors who want the more methodical side of the simulation shelf.",
  "ps4-bus-simulator-21":
    "Bus Simulator 21 expands the Astragon bus-driving formula with a larger fleet, modern route planning, and a stronger management layer around public transit. On PS4, it is the more ambitious companion to Bus Simulator 18, built for players who enjoy slow-burn vehicle routines and service simulation.",
  "ps4-calvino-noir":
    "Calvino Noir is a side-view stealth adventure styled around film noir architecture, shadows, and political intrigue. Its PS4 version is less about reflex-heavy action and more about moving characters through guarded spaces, reading patrols, and absorbing the stark black-and-white mood.",
  "ps4-can-t-drive-this":
    "Can't Drive This turns racing into a cooperative panic loop: one player drives a monster truck while another builds the road ahead in real time. The PS4 release works best as a party-style challenge where communication, speed, and messy track construction create the tension.",
  "ps4-candle-the-power-of-the-flame":
    "Candle: The Power of the Flame is a hand-painted puzzle-platform adventure where light, timing, and environmental observation matter more than combat. Teku Studios builds the journey around careful traversal, visual storytelling, and solving stage problems with a fragile flame mechanic.",
  "ps4-candlelight":
    "Candlelight is a small PS4 platformer about carrying a flame through hazardous stages while managing movement and light. Its appeal is straightforward arcade-platform challenge, with Pixel Maverick's release fitting the console's indie catalog more than the big-budget action lane.",
  "ps4-candleman-the-complete-journey":
    "Candleman: The Complete Journey is a puzzle-platformer built around a candle that can only burn for a limited time. That simple rule shapes exploration, timing, and pathfinding, giving the PS4 release a clear identity for players who like atmospheric puzzle stages.",
  "ps4-cannon-brawl":
    "Cannon Brawl mixes artillery combat, real-time strategy, and lane pressure into fast duels about building weapons, defending territory, and aiming shots. The PS4 version is notable for strategy fans who want something quicker and more arcade-like than a traditional base-building game.",
  "ps4-capsule-force":
    "Capsule Force is a four-player arena action game with a retro-anime look, short rounds, and tug-of-war objectives built around capturing the opponent's capsule. Klobit's PS4 release is best understood as a local multiplayer brawler-shooter for quick competitive sessions.",
  "ps4-cardpocalypse":
    "Cardpocalypse is a schoolyard RPG about collecting, trading, and battling with a fictional card game called Mega Mutant Power Pets. It blends deckbuilding with character choices and story events, making it a natural GCX fit for players who like trading-card culture inside video games.",
  "ps4-carmen-sandiego":
    "Carmen Sandiego on PS4 updates the long-running educational mystery formula around investigation, geography clues, and globe-hopping pursuit. The Gameloft release is about deduction and light adventure pacing rather than action, giving the catalog a family-friendly detective entry.",
  "ps4-carx-drift-racing-online":
    "CarX Drift Racing Online is built around drift handling, car tuning, and repeating corners until the angle and speed feel right. The PS4 version serves players who care less about traditional circuit racing and more about controlled slides, setup changes, and online-style competition.",
  "ps4-castles":
    "Castles is a block-matching puzzle game wrapped in a medieval construction theme, asking players to move pieces, manage hazards, and keep a tower project alive. It belongs to the PS4's compact puzzle catalog, where short sessions and escalating board pressure do the work.",
  "ps4-castlestorm-ii":
    "CastleStorm II continues Zen Studios' hybrid of tower defense, side-scrolling siege combat, and kingdom strategy. The PS4 release adds a campaign-map layer around the familiar chaos of ballista shots, troop deployment, and castle-smashing battles between comic fantasy armies.",
  "ps4-chaos-code-new-sign-of-catastrophe":
    "Chaos Code: New Sign of Catastrophe is a 2D fighting game from FK Digital and Arc System Works with anime-styled characters, special-move systems, and matchup learning at its center. On PS4, it is a niche fighter pick for players who track smaller arcade-style combat releases.",
  "ps4-checkers":
    "Checkers from Sabec is exactly the traditional board game adapted for PS4: diagonal movement, forced captures, kinging, and positional pressure. Its value is not spectacle; it is a simple digital tabletop option for players who want a familiar ruleset on the console.",
  "ps4-chicken-police-paint-it-red":
    "Chicken Police: Paint it Red! is a noir detective adventure built around interrogation, dialogue, and striking animal-headed character photography. The Wild Gentlemen's PS4 release stands out because its mood, voice-driven mystery, and odd visual identity are the main draw.",
  "ps4-children-of-zodiarcs":
    "Children of Zodiarcs is a tactical RPG that combines grid battles with card and dice systems, giving each encounter a mix of planning and controlled randomness. Square Enix published the PS4 version, making it a notable indie strategy entry for RPG collectors.",
  "ps4-chime-sharp":
    "Chime Sharp is a music-puzzle game where players place shapes on a grid to build coverage while the soundtrack reacts to progress. The PS4 version is best for players who like abstract score-chasing puzzles with rhythm, repetition, and clean audiovisual feedback.",
  "ps4-chimparty":
    "Chimparty is a PlayLink party game from NapNok and Sony built around quick minigames controlled through phones or tablets. It is aimed at couch groups and families, with simple prompts, short rounds, and accessible arcade challenges replacing traditional controller complexity.",
};

const headers = ["platformSlug", "gameId", "title", "currentOverview", "sourceUrl", "rewriteNotes", "newOverview", "reviewStatus", "reviewer"];

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const games = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
  const byId = new Map(games.map((game) => [game.id, game]));
  const rows = Object.entries(reviewedOverviews).map(([gameId, newOverview]) => {
    const game = byId.get(gameId);
    if (!game) throw new Error(`Missing PS4 game ${gameId}`);
    return {
      platformSlug: "ps4",
      gameId,
      title: game.title,
      currentOverview: game.description || game.gcxOverview || game.overview || "",
      sourceUrl: game.articleUrl || game.descriptionSourceUrl || game.sourceUrl || "",
      rewriteNotes: "Priority PS4 weak-template cleanup; original GCX editorial overview based on available platform, genre, publisher, developer, release, and source-page context.",
      newOverview,
      reviewStatus: "reviewed",
      reviewer: "GCX editorial cleanup",
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
