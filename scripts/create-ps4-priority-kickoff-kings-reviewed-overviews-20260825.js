const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(
  rootDir,
  "data",
  "games",
  "reviewed-overview-imports",
  "ps4-priority-kickoff-kings-reviewed-overviews-2026-08-25.csv"
);

const rewrites = [
  {
    id: "ps4-kick-off-revival",
    sourceUrl: "https://store.playstation.com/en-us/concept/221861",
    overview:
      "Kick Off Revival is Dino Dini's return to the fast, top-down football style that made Kick Off and Kick Off 2 cult favorites. Rather than chasing TV-style simulation, it focuses on quick reactions, loose-ball control, sharp passing, and matches that can turn on one touch. It is mainly for players curious about old-school arcade football, where the appeal is speed, mastery, and nostalgia more than licensed spectacle.",
  },
  {
    id: "ps4-kickbeat-special-edition",
    sourceUrl: "https://www.kickbeat.com/",
    overview:
      "KickBeat: Special Edition is a rhythm-action game from Zen Studios that frames music play as martial-arts combat. Enemies attack from different directions in time with the soundtrack, and players hit the matching inputs to strike, chain combos, and clear each song. The PS4 version is best for rhythm fans who want something more kinetic than note highways, with style, timing, and score chasing at the center.",
  },
  {
    id: "ps4-kin-iro-loveriche",
    sourceUrl: "https://www.gematsu.com/2019/11/romance-visual-novel-kiniro-loveriche-coming-to-ps4-ps-vita-on-march-26-2020-in-japan",
    overview:
      "Kin'iro Loveriche is Saga Planets' romance visual novel about a student entering an elite academy and getting pulled into character routes built around school life, comedy, and emotional drama. The PS4 release presents the story as a route-based reading experience, with player choices steering relationships rather than reflex play. It is for visual-novel readers who want polished character art, romantic pacing, and a long-form cast-driven story.",
  },
  {
    id: "ps4-kin-iro-loveriche-golden-time",
    sourceUrl: "https://kotaku.com/games/kiniro-loveriche-golden-time",
    overview:
      "Kin'iro Loveriche: Golden Time is a follow-up fan disc for Saga Planets' school romance visual novel, adding after-story material and additional routes connected to the original cast. Players should expect more character-focused reading, romantic continuation, and route-specific scenes rather than a new gameplay system. It matters most to fans who already know Kin'iro Loveriche and want the expanded story content on PS4.",
  },
  {
    id: "ps4-king-oddball",
    sourceUrl: "https://www.kingoddball.com/",
    overview:
      "King Oddball is a physics puzzle game from 10tons about using a giant floating head's tongue to fling rocks at tanks, helicopters, and other military targets. Each level becomes a small ricochet puzzle, asking players to judge timing, arcs, and chain reactions with limited shots. It is simple on the surface, but the appeal comes from clearing stages efficiently and watching one well-placed rock collapse the whole setup.",
  },
  {
    id: "ps4-king-of-seas",
    sourceUrl: "https://www.team17.com/news/pirate-action-rpg-king-of-seas-is-out-now",
    overview:
      "King of Seas is a naval action RPG from 3DClouds and Team17 set in a procedurally generated pirate world. Players command a ship rather than a person, sailing between ports, fighting rival vessels and sea monsters, taking quests, gathering loot, and upgrading their build. It is best for players who like pirate fantasy, broad progression, and ship-to-ship combat more than tightly scripted character action.",
  },
  {
    id: "ps4-kingmaker-rise-to-the-throne",
    sourceUrl: "https://store.steampowered.com/app/834390/Kings_Heir_Rise_to_the_Throne/",
    overview:
      "Kingmaker: Rise to the Throne, also known as King's Heir: Rise to the Throne, is an Artifex Mundi-style hidden-object adventure about royal intrigue and restoring a kingdom's rightful line. Players move through hand-painted scenes, solve inventory puzzles, complete hidden-object sequences, and follow a light fantasy mystery. It is built for relaxed point-and-click play, not speed or combat, with puzzle variety carrying the campaign.",
  },
  {
    id: "ps4-kings-of-lorn-the-fall-of-ebris",
    sourceUrl: "https://store.steampowered.com/app/605140/Kings_of_Lorn_The_Fall_of_Ebris/",
    overview:
      "Kings of Lorn: The Fall of Ebris is a first-person dark-fantasy survival horror game from TeamKill Media. Players explore a ruined kingdom, manage limited resources, face monstrous threats, and push through a bleak world built around atmosphere, danger, and environmental storytelling. It is a rougher, independent horror release, but one with a clear identity for players who like grim fantasy spaces and tense first-person exploration.",
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
    if (!game) throw new Error(`Missing PS4 game ${rewrite.id}`);
    rows.push([
      "ps4",
      game.id,
      game.title || game.name || "",
      game.description || game.gcxOverview || game.overview || "",
      rewrite.sourceUrl || game.descriptionSourceUrl || "",
      "Priority PS4 weak-template cleanup; original GCX editorial overview based on verified identity, platform metadata, publisher/developer context, and official/store descriptions where available.",
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
