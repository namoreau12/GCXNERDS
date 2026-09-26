const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesPath = path.join(rootDir, "data", "games", "ps4.json");
const outputPath = path.join(rootDir, "data", "games", "reviewed-overview-imports", "ps4-priority-constructor-cyber-reviewed-overviews-2026-08-25.csv");

const reviewedOverviews = {
  "ps4-constructor-hd":
    "Constructor HD revives System 3's property-management strategy series with a sharper presentation and the same nasty neighbor-vs-neighbor edge. Players build housing, manage tenants, deploy troublemakers, and try to outmaneuver rival developers, making it more mischievous than a calm city builder.",
  "ps4-constructor-plus":
    "Constructor Plus expands the Constructor formula with more buildings, scenarios, and ways to disrupt rival property empires. The PS4 release is about juggling development, cash flow, tenants, and dirty tricks, so it appeals to strategy players who want personality with their management systems.",
  "ps4-contra-anniversary-collection":
    "Contra Anniversary Collection packages classic Contra run-and-gun entries for modern PlayStation play. Its value is historical and practical: fast side-scrolling shooting, co-op-friendly arcade pressure, and multiple series touchstones gathered in one Konami anthology.",
  "ps4-core-keeper":
    "Core Keeper blends underground survival, mining, crafting, farming, boss fights, and sandbox exploration into a top-down adventure loop. On PS4, it is a strong fit for players who like Terraria-style discovery, base-building routines, and gradually opening a mysterious subterranean world.",
  "ps4-cotton-reboot":
    "Cotton Reboot! updates the cult cute-'em-up Cotton: Fantastic Night Dreams with modern presentation, arcade shooting, scoring, and the series' witch-and-fairy charm. The PS4 release matters for shoot-'em-up collectors because it connects a niche arcade lineage to a newer console audience.",
  "ps4-cozy-grove":
    "Cozy Grove is a gentle life-sim adventure about helping ghostly island residents, gathering resources, decorating, and checking in across real-world days. Its PS4 appeal is slow daily ritual, soft melancholy, and collector-friendly tasks rather than speed or combat.",
  "ps4-crazy-strike-bowling-ex":
    "Crazy Strike Bowling EX turns bowling into an anime-styled arcade sports game with exaggerated characters, special presentation, and quick lane-based competition. The PS4 release is a niche alternative to serious bowling sims, leaning on novelty and character flavor.",
  "ps4-creature-in-the-well":
    "Creature in the Well is a pinball-inspired dungeon crawler where players slash energy orbs around rooms to power machinery and survive hazards. Its identity is unusual: part hack-and-slash, part puzzle gauntlet, with momentum and angle control driving each encounter.",
  "ps4-cricket-19":
    "Cricket 19 is Big Ant's cricket simulation built around batting, bowling, fielding, career play, and licensed competition structure. The PS4 version is important for sports-library completeness because cricket has fewer major console options than football, basketball, or soccer.",
  "ps4-cricket-22":
    "Cricket 22 follows Big Ant's Cricket 19 with updated presentation, expanded modes, and a broader modern cricket package under Nacon. On PS4, it serves players who want a fuller simulation of batting rhythm, bowling strategy, field placement, and long-form match formats.",
  "ps4-cricket-24":
    "Cricket 24 continues Nacon and Big Ant's console cricket line with newer squads, presentation updates, and a wider licensed-cricket pitch than earlier entries. Its PS4 role is straightforward: a late-generation sports sim for fans who want current cricket structure on older hardware.",
  "ps4-crosskrush":
    "CrossKrush is a compact puzzle-action game about an elderly couple smashing traffic before it ruins their peace. The Ratalaika-published PS4 release mixes grid movement, timing, and light comedy, making it a small but distinct puzzle entry rather than a generic logic game.",
  "ps4-crown-trick":
    "Crown Trick is a turn-based roguelike RPG where enemies move when the player acts, turning dungeon rooms into positioning puzzles. Its PS4 appeal comes from relic builds, familiar-like powers, procedural layouts, and careful tactical movement instead of real-time button pressure.",
  "ps4-crows-burning-edge":
    "Crows: Burning Edge adapts Hiroshi Takahashi's delinquent manga universe into a Japanese action-adventure brawler. The PS4 release is mainly for import and licensed-anime collectors, with schoolyard fights, character drama, and franchise recognition carrying the experience.",
  "ps4-crysis-2-remastered":
    "Crysis 2 Remastered revisits Crytek's New York-set sci-fi shooter with upgraded visuals and the Nanosuit's stealth, armor, and mobility powers. On PS4, it gives players a more polished way to experience the middle chapter's urban combat spaces.",
  "ps4-crysis-3-remastered":
    "Crysis 3 Remastered brings the series' bow-heavy, Nanosuit-powered finale to PS4 with visual improvements and the overgrown New York Liberty Dome setting. It is about mixing stealth, armor, gadgets, and open combat inside larger combat arenas.",
  "ps4-cubers-arena":
    "Cubers: Arena is a small arena brawler built around wave combat, upgrades, and survival against groups of enemies. Teyon's PS4 release is not a story-heavy action game; its appeal is repeatable combat rooms, simple progression, and local-friendly chaos.",
  "ps4-curious-expedition":
    "Curious Expedition is a roguelike expedition strategy game about planning journeys, managing sanity and supplies, meeting strange events, and deciding how far to push for treasure. The PS4 version turns exploration into a risk-management story generator.",
  "ps4-cyber-citizen-shockman-3-the-princess-from-another-world":
    "Cyber Citizen Shockman 3: The Princess from Another World brings a 1990s action-platformer back for modern players through Ratalaika's reissue work. Its PS4 value is preservation-minded: side-scrolling combat, retro pacing, and access to a formerly obscure series chapter.",
  "ps4-cyber-troopers-virtual-on-masterpiece-1995-2001":
    "Cyber Troopers Virtual-On Masterpiece 1995-2001 collects Sega's arena-mech combat releases from the series' early era. The PS4 package is for players and collectors interested in lock-on duels, twin-stick arcade design, and Sega's distinctive robot-fighting history.",
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
