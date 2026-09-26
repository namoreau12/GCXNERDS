const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-overview-internal-language.json");

const internalLanguagePatterns = [
  { id: "gcx-should", pattern: /\bGCX should\b/i },
  { id: "listing-should", pattern: /\bThe listing should\b/i },
  { id: "page-should", pattern: /\b(?:The|This) page should\b/i },
  { id: "overview-should", pattern: /\b(?:The|This) overview should\b/i },
  { id: "record-should", pattern: /\bThe record should\b/i },
  { id: "codex-note", pattern: /\b(?:Codex|ChatGPT) should\b/i },
  { id: "on-gcx", pattern: /\b(?:on|inside|within|in)\s+GCX\b/i },
  { id: "for-gcx", pattern: /\bFor GCX\b/i },
  { id: "gcx-mention", pattern: /\bGCX(?:'s|’s)?\b/i },
  { id: "overview-process-voice", pattern: /\bThe overview (?:calls|flags|highlights|describes|frames|presents|positions|treats|keeps|makes|identifies|notes|foregrounds|is|stays)\b/i },
  { id: "gcx-reader-framing", pattern: /\b(?:for|to)\s+GCX\s+(?:readers|viewers|visitors|collectors)\b/i },
  { id: "gcx-site-voice", pattern: /\bGCX(?:'s|’s)?\s+(?:entry|listing|record|page|overview|database)\b/i },
  { id: "editor-instruction", pattern: /\b(?:do not publish|internal editorial notes|recommended hero image|newsroom opportunity score)\b/i },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function overviewFor(game) {
  return game.description || game.gcxOverview || game.overview || "";
}

function contextSnippet(text, index) {
  const start = Math.max(0, index - 80);
  const end = Math.min(text.length, index + 140);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function main() {
  const offenders = [];
  const files = fs.readdirSync(gamesDir).filter(isGameDatasetFile).sort();
  let scannedGames = 0;

  for (const fileName of files) {
    const platform = fileName.replace(/\.json$/, "");
    const games = readJson(path.join(gamesDir, fileName));
    if (!Array.isArray(games)) continue;

    games.forEach((game) => {
      scannedGames += 1;
      const overview = overviewFor(game);
      internalLanguagePatterns.forEach(({ id, pattern }) => {
        const match = String(overview).match(pattern);
        if (!match) return;
        offenders.push({
          platform,
          id: game.id || "",
          title: game.title || game.name || "",
          issue: id,
          snippet: contextSnippet(overview, match.index || 0),
        });
      });
    });
  }

  const report = {
    ok: offenders.length === 0,
    generatedAt: new Date().toISOString(),
    scannedGames,
    offenderCount: offenders.length,
    offenders: offenders.slice(0, 100),
    truncatedOffenders: Math.max(0, offenders.length - 100),
  };

  writeJsonAtomic(fs, outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
