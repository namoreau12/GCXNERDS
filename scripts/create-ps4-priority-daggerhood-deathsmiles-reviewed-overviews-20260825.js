const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(rootDir, "data", "games", "reviewed-overview-imports", "ps4-priority-daggerhood-deathsmiles-reviewed-overviews-2026-08-25.csv");

const reviewedOverviews = {
  "ps4-daggerhood":
    "Daggerhood is a compact action-platformer built around throwing a dagger, teleporting to it, and using that move to cross hazards quickly. The PS4 release fits the Ratalaika arcade-challenge lane: short stages, tight timing, collectibles, and speed-friendly retries.",
  "ps4-daisenryaku-dai-toua-kouboushi-3":
    "Daisenryaku: Dai Toua Kouboushi 3 is a Japanese war-simulation strategy game from SystemSoft Alpha. Its PS4 appeal is very specific: hex-and-unit military planning, historical campaign interest, and import-library value for players who collect deeper console strategy releases.",
  "ps4-damsel":
    "Damsel is an action-platform game about fast room-clearing, rescue objectives, and vampire-hunting momentum. Screwtape Studios' PS4 release is built for players who like quick stage goals, combo flow, and replayable arcade scoring rather than a sprawling campaign.",
  "ps4-danganronpa-1-2-reload":
    "Danganronpa 1-2 Reload brings the first two main Danganronpa games together on PS4, mixing visual-novel storytelling, murder mystery, investigation, and class-trial logic battles. It is one of the cleaner ways to experience the series' foundational Hope's Peak arc on PlayStation.",
  "ps4-danganronpa-trilogy":
    "Danganronpa Trilogy packages the mainline PS4-era Danganronpa story in one collector-friendly release. The draw is not action, but character-driven mystery, courtroom-style argument systems, dark comedy, and a complete route through Spike Chunsoft's cult visual-novel series.",
  "ps4-dangun-feveron":
    "Dangun Feveron is a Cave arcade shoot-'em-up brought to PS4 with help from M2, notable for its disco-flavored style, speed, and score-chasing intensity. It is mainly for shmup fans who track Cave's catalog and want a precise arcade conversion.",
  "ps4-darius-cozmic-revelation":
    "Darius Cozmic Revelation collects later Darius shoot-'em-up material for PS4, keeping the series' wide-screen heritage, mechanical sea-life bosses, and route-based arcade identity in focus. It is a collector-facing package for Taito shooter fans more than a casual starter set.",
  "ps4-dark-arcana-the-carnival":
    "Dark Arcana: The Carnival is an Artifex Mundi hidden-object adventure set around a sinister carnival mystery. Players move through illustrated scenes, solve inventory puzzles, and uncover supernatural story beats, making it a comfortable fit for casual adventure collectors.",
  "ps4-dark-rose-valkyrie":
    "Dark Rose Valkyrie is a Compile Heart RPG about a military unit fighting infected threats while navigating suspicion within its own ranks. The PS4 release leans on party building, turn-based combat structure, anime-styled characters, and Idea Factory's niche RPG audience.",
  "ps4-darkestville-castle":
    "Darkestville Castle is a point-and-click adventure starring a mischievous demon in a cartoon-gothic town. Its PS4 value comes from traditional adventure-game puzzle logic, dialogue, hand-drawn comedy presentation, and a tone that is playful rather than horror-driven.",
  "ps4-darq-complete-edition":
    "Darq: Complete Edition is a psychological horror puzzle game about navigating dreamlike rooms, perspective shifts, and unsettling spaces. The PS4 edition gathers the core game and extra content, making atmosphere and environmental puzzle-solving the main reasons to play.",
  "ps4-dayz":
    "DayZ is a harsh online survival game where scavenging, hunger, infection, weather, other players, and permanent loss shape every session. The PS4 release is valuable to survival fans because its tension comes from uncertainty and human encounters as much as zombies.",
  "ps4-dead-alliance":
    "Dead Alliance is a first-person shooter built around multiplayer combat in zombie-infested arenas, where undead threats can be manipulated as part of the fight. Its PS4 entry is a curiosity for players tracking IllFonic-adjacent shooters and late-2010s multiplayer experiments.",
  "ps4-dead-rising-2":
    "Dead Rising 2 on PS4 preserves Capcom's casino-mall zombie sandbox with Chuck Greene, improvised weapons, rescue timers, and absurd crowd-clearing tools. Its appeal is the series' signature mix of time pressure, comedy, crafting, and messy zombie spectacle.",
  "ps4-dead-star":
    "Dead Star was an Armature Studio space-combat shooter focused on team battles, ship classes, and objective control. On PS4 it is mainly a historical catalog entry now, notable for its online-first structure and place in the console's multiplayer shooter wave.",
  "ps4-deadcore":
    "Deadcore is a first-person parkour platformer about climbing a surreal tower through precision jumps, launch pads, switches, and speedrun-friendly routing. The PS4 release is for players who like movement mastery and restart-heavy challenge more than combat.",
  "ps4-deadcraft":
    "Deadcraft mixes survival action, crafting, farming, and zombie powers in a post-apocalyptic setting. Marvelous and Xseed frame it around harvesting resources, building tools, fighting hostile survivors, and using undead abilities, giving the PS4 library an oddball survival-RPG hybrid.",
  "ps4-death-coming":
    "Death Coming is a darkly comic puzzle-strategy game where players trigger environmental accidents as an agent of death. The PS4 version is about observing routines, spotting chain reactions, and staging indirect solutions rather than fighting or commanding units directly.",
  "ps4-death-crown":
    "Death Crown is a stark one-bit real-time strategy game about expanding territory, producing troops, and overwhelming enemies with rapid decisions. Its PS4 appeal comes from minimalist presentation, fast matches, and a sharper arcade edge than many traditional RTS games.",
  "ps4-deathsmiles-i-and-ii":
    "Deathsmiles I & II collects Cave's gothic horizontal shoot-'em-up games with witches, branching stages, dense bullet patterns, and arcade scoring systems. The PS4 release is a key package for shmup collectors who want both Deathsmiles entries on modern hardware.",
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
