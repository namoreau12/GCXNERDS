const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const dryRun = flags.has("--dry-run");
const force = flags.has("--force");
const help = flags.has("--help") || flags.has("-h");
const inputArg = args.find((arg) => !arg.startsWith("--"));
const inputPath = path.resolve(rootDir, inputArg || path.join("data", "games", "overview-rewrite-batches", "ps1-overview-rewrite-batch.csv"));
const reportOutputArg = args.find((arg) => arg.startsWith("--report-output="));
const reportOutputPath = reportOutputArg
  ? path.resolve(rootDir, reportOutputArg.split("=").slice(1).join("="))
  : path.join(gamesDir, dryRun ? "last-overview-import-preview.json" : "last-overview-import-report.json");

const weakPatterns = [
  /officially released/i,
  /official release/i,
  /game record/i,
  /licensed north american/i,
  /software list/i,
  /for collectors,? the key identifiers are/i,
  /released around \d{4}/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action) game for/i,
  /\bGCX should\b/i,
  /\bGCX(?:'s|’s)?\b/i,
  /\b(?:The\s+)?Listings? should\b/i,
  /\b(?:The|This) page should\b/i,
  /\b(?:The|This) overview should\b/i,
  /\bThe record should\b/i,
  /\b(?:Codex|ChatGPT) should\b/i,
  /\bThe overview (?:calls|flags|highlights|describes|frames|presents|positions|treats|keeps|makes|identifies|notes|foregrounds|is|stays)\b/i,
  /\b(?:do not publish|internal editorial notes|recommended hero image|newsroom opportunity score)\b/i,
];

function printHelp() {
  console.log(`
Usage:
  node scripts/import-game-overview-rewrites.js [reviewed-csv-path] [--dry-run] [--force]
  node scripts/import-game-overview-rewrites.js [reviewed-csv-path] --dry-run --report-output=.cache/overview-import-preview.json

Input CSV columns:
  platformSlug, gameId, title, currentOverview, sourceUrl, rewriteNotes, newOverview, reviewStatus, reviewer

Safety behavior:
  - Only rows with platformSlug, gameId, and newOverview are considered.
  - newOverview must be at least 140 characters and must not contain known template phrases.
  - reviewStatus must be approved, verified, or reviewed.
  - reviewer is required.
  - Row titles must match the current game title when a title is supplied.
  - currentOverview must still match the current game record unless --force is passed.
  - Source URL is preserved when supplied, but rows with invalid sourceUrl values are rejected.

Recommended flow:
  1. Work from data/games/overview-rewrite-batches/*.csv.
  2. Fill newOverview with original editorial copy, plus rewriteNotes if helpful.
  3. Set reviewStatus to approved, verified, or reviewed, and add reviewer name/initials.
  4. Run with --dry-run first.
  5. If the report is clean, run again without --dry-run.
`.trim());
}

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
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
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
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((value) => String(value).trim()));
}

function readCsvObjects(filePath) {
  const rows = parseCsv(fs.readFileSync(filePath, "utf8"));
  const headers = rows.shift() || [];
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function firstFilled(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim()) || "";
}

function currentOverviewFor(game) {
  return firstFilled(game.description, game.gcxOverview, game.overview);
}

function buildGameSearchText(game, overview) {
  return normalizedText(
    [
      game.title,
      game.name,
      game.developer,
      game.publisher,
      ...(Array.isArray(game.developers) ? game.developers : []),
      ...(Array.isArray(game.publishers) ? game.publishers : []),
      game.firstReleased,
      ...(Array.isArray(game.releasedRegions) ? game.releasedRegions : []),
      ...(Array.isArray(game.releaseYears) ? game.releaseYears : []),
      game.platform,
      ...(Array.isArray(game.platforms) ? game.platforms : []),
      ...(Array.isArray(game.tags) ? game.tags : []),
      overview,
    ]
      .filter(Boolean)
      .join(" ")
  ).toLowerCase();
}

function approvedReviewStatus(value) {
  return ["approved", "verified", "reviewed"].includes(
    String(value || "")
      .trim()
      .toLowerCase()
  );
}

function validOptionalUrl(value) {
  if (!String(value || "").trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizedText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rowLooksLikeSameGame(row, game) {
  const rowTitle = normalizedTitle(row.title);
  const gameTitle = normalizedTitle(game.title || game.name);
  return !rowTitle || !gameTitle || rowTitle === gameTitle;
}

function overviewLooksEditorial(value) {
  const text = normalizedText(value);
  if (text.length < 140) return false;
  return !weakPatterns.some((pattern) => pattern.test(text));
}

function runNode(script) {
  const result = spawnSync(process.execPath, [script], {
    cwd: rootDir,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

async function main() {
  if (help) {
    printHelp();
    return;
  }

  const rows = readCsvObjects(inputPath).filter((row) => row.newOverview && row.gameId && row.platformSlug);
  const grouped = new Map();
  const rejected = [];
  const skipped = [];
  const refreshedSearchRows = [];
  const importedRows = [];
  const seen = new Set();

  for (const row of rows) {
    const rowKey = `${row.platformSlug}:${row.gameId}`;
    if (seen.has(rowKey)) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "Duplicate row for platform/gameId" });
      continue;
    }
    seen.add(rowKey);
    if (!overviewLooksEditorial(row.newOverview)) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "newOverview is too short, template-like, or contains internal editorial language" });
      continue;
    }
    if (!approvedReviewStatus(row.reviewStatus)) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "reviewStatus must be approved, verified, or reviewed" });
      continue;
    }
    if (!String(row.reviewer || "").trim()) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "Missing reviewer for reviewed overview row" });
      continue;
    }
    if (!validOptionalUrl(row.sourceUrl)) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "Invalid sourceUrl" });
      continue;
    }
    if (!grouped.has(row.platformSlug)) grouped.set(row.platformSlug, []);
    grouped.get(row.platformSlug).push(row);
  }

  const summary = [];
  for (const [slug, platformRows] of grouped) {
    const dataPath = path.join(gamesDir, `${slug}.json`);
    if (!fs.existsSync(dataPath)) {
      platformRows.forEach((row) => rejected.push({ gameId: row.gameId, reason: `Missing platform file ${slug}.json` }));
      continue;
    }

    const games = readJson(dataPath);
    if (!Array.isArray(games)) {
      platformRows.forEach((row) => rejected.push({ gameId: row.gameId, reason: `Invalid platform file ${slug}.json` }));
      continue;
    }

    const byId = new Map(games.map((game) => [game.id, game]));
    let updated = 0;
    let refreshedSearchText = 0;
    for (const row of platformRows) {
      const game = byId.get(row.gameId);
      if (!game) {
        rejected.push({ platform: slug, gameId: row.gameId, reason: "Game id not found" });
        continue;
      }
      if (!rowLooksLikeSameGame(row, game)) {
        rejected.push({ platform: slug, gameId: row.gameId, title: row.title || "", reason: `Title mismatch with ${game.title || game.name || ""}` });
        continue;
      }
      const currentOverview = normalizedText(currentOverviewFor(game));
      const nextOverview = normalizedText(row.newOverview);
      const alreadyReviewed =
        (game.descriptionProvider === "GCX reviewed editorial overview" || game.overviewProvider === "GCX reviewed editorial overview") &&
        String(game.overviewReviewStatus || "").trim().toLowerCase() === String(row.reviewStatus || "").trim().toLowerCase() &&
        String(game.overviewReviewer || "").trim() === String(row.reviewer || "").trim();
      if (currentOverview === nextOverview && alreadyReviewed) {
        const nextSearchText = buildGameSearchText(game, nextOverview);
        if (game.searchText !== nextSearchText) {
          if (!dryRun) {
            game.searchText = nextSearchText;
            game.healthUpdatedAt = new Date().toISOString();
          }
          refreshedSearchRows.push({
            platform: slug,
            gameId: row.gameId,
            title: row.title || game.title || "",
          });
          refreshedSearchText += 1;
        }
        skipped.push({
          platform: slug,
          gameId: row.gameId,
          title: row.title || game.title || "",
          reason: "Already applied in live game data",
        });
        continue;
      }
      if (!force && row.currentOverview && normalizedText(row.currentOverview) !== currentOverview) {
        rejected.push({ platform: slug, gameId: row.gameId, reason: "currentOverview is stale; rerun with --force after re-reviewing this row" });
        continue;
      }
      if (!dryRun) {
        game.description = nextOverview;
        game.descriptionProvider = "GCX reviewed editorial overview";
        game.descriptionSourceUrl = row.sourceUrl || game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "";
        game.overviewStatus = "published";
        game.overviewReviewStatus = row.reviewStatus;
        game.overviewReviewer = row.reviewer;
        game.overviewRewriteNotes = row.rewriteNotes || "";
        game.searchText = buildGameSearchText(game, nextOverview);
        game.healthUpdatedAt = new Date().toISOString();
      }
      importedRows.push({
        platform: slug,
        gameId: row.gameId,
        title: row.title || game.title || "",
        reviewer: row.reviewer,
        sourceUrl: row.sourceUrl || game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "",
      });
      updated += 1;
    }

    if (!dryRun && (updated || refreshedSearchText)) writeJson(dataPath, games);
    summary.push({ platform: slug, updated, refreshedSearchText });
  }

  const importedCount = summary.reduce((sum, item) => sum + item.updated, 0);
  console.table(summary);
  if (rejected.length) {
    console.log("Rejected rows:");
    console.table(rejected.slice(0, 40));
  }
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} already-applied rows.`);
  }
  if (refreshedSearchRows.length) {
    console.log(`${dryRun ? "Would refresh" : "Refreshed"} search text for ${refreshedSearchRows.length} already-applied rows.`);
  }
  console.log(`${dryRun ? "Would import" : "Imported"} ${importedCount} reviewed game overviews.`);

  const report = {
    generatedAt: new Date().toISOString(),
    mode: dryRun ? "dry-run" : "import",
    inputPath,
    force,
    summary,
    rejected,
    skipped,
    refreshedSearchRows,
    importedRows,
  };

  fs.mkdirSync(path.dirname(reportOutputPath), { recursive: true });
  fs.writeFileSync(reportOutputPath, `${JSON.stringify(report, null, 2)}\n`);

  if (!dryRun) {
    runNode(path.join("scripts", "audit-game-overview-quality.js"));
    runNode(path.join("scripts", "audit-game-library-completeness.js"));
    runNode(path.join("scripts", "build-data-health-cleanup-queue.js"));
    runNode(path.join("scripts", "export-game-overview-rewrite-batches.js"));
    runNode(path.join("scripts", "audit-game-overview-rewrite-batches.js"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
