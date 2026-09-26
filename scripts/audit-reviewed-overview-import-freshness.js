const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const importsDir = path.join(rootDir, "data", "games", "reviewed-overview-imports");
const outputPath = path.join(rootDir, "data", "launch-readiness", "reviewed-overview-import-freshness.json");
const cacheDir = path.join(rootDir, ".cache", "overview-import-freshness");
const gamesDir = path.join(rootDir, "data", "games");

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
  /\bThe listing should\b/i,
  /\b(?:The|This) overview should\b/i,
  /\bThe record should\b/i,
  /\b(?:Codex|ChatGPT) should\b/i,
  /\b(?:do not publish|internal editorial notes|recommended hero image|newsroom opportunity score)\b/i,
];

const gameDataCache = new Map();

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function normalizedText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function currentOverviewFor(game) {
  return normalizedText(game?.description || game?.gcxOverview || game?.overview || "");
}

function approvedReviewStatus(value) {
  return ["approved", "verified", "reviewed"].includes(
    String(value || "")
      .trim()
      .toLowerCase()
  );
}

function overviewLooksEditorial(value) {
  const text = normalizedText(value);
  if (text.length < 140) return false;
  return !weakPatterns.some((pattern) => pattern.test(text));
}

function getPlatformGames(platformSlug) {
  if (gameDataCache.has(platformSlug)) return gameDataCache.get(platformSlug);
  const filePath = path.join(gamesDir, `${platformSlug}.json`);
  const records = readJson(filePath, []);
  const byId = new Map(Array.isArray(records) ? records.map((game) => [game.id, game]) : []);
  gameDataCache.set(platformSlug, byId);
  return byId;
}

function hasUsableSource(game) {
  return Boolean(
    String(game?.descriptionSourceUrl || game?.articleUrl || game?.sourceUrl || "")
      .trim()
  );
}

function isSupersededByReviewedLiveOverview(row) {
  const game = getPlatformGames(row.platform).get(row.gameId);
  if (!game) return false;
  const provider = game.descriptionProvider || game.overviewProvider;
  return (
    provider === "GCX reviewed editorial overview" &&
    approvedReviewStatus(game.overviewReviewStatus) &&
    String(game.overviewReviewer || "").trim() &&
    hasUsableSource(game) &&
    overviewLooksEditorial(currentOverviewFor(game))
  );
}

function main() {
  fs.mkdirSync(cacheDir, { recursive: true });
  const files = fs.existsSync(importsDir)
    ? fs.readdirSync(importsDir).filter((file) => file.endsWith(".csv")).sort()
    : [];

  const failures = [];
  const summaries = [];

  files.forEach((file) => {
    const inputPath = path.join(importsDir, file);
    const reportPath = path.join(cacheDir, `${file.replace(/\.csv$/i, "")}.json`);
    const result = spawnSync(
      process.execPath,
      [
        path.join("scripts", "import-game-overview-rewrites.js"),
        inputPath,
        "--dry-run",
        `--report-output=${reportPath}`,
      ],
      {
        cwd: rootDir,
        encoding: "utf8",
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    const report = readJson(reportPath, null);
    if (result.status !== 0 || !report) {
      failures.push({
        file,
        status: result.status,
        message: `${result.stdout || ""}\n${result.stderr || ""}`.trim().slice(0, 500),
      });
      return;
    }

    const importedRows = report.importedRows || [];
    const supersededRows = importedRows.filter(isSupersededByReviewedLiveOverview);
    const pendingRows = importedRows.filter((row) => !isSupersededByReviewedLiveOverview(row));

    summaries.push({
      file,
      inputPath: path.relative(rootDir, inputPath),
      wouldImport: pendingRows.length,
      supersededReviewedRows: supersededRows.length,
      skipped: (report.skipped || []).length,
      rejected: (report.rejected || []).length,
      pendingRows,
      supersededRows,
    });
  });

  const totals = summaries.reduce(
    (sum, item) => {
      sum.wouldImport += item.wouldImport;
      sum.supersededReviewedRows += item.supersededReviewedRows;
      sum.skipped += item.skipped;
      sum.rejected += item.rejected;
      return sum;
    },
    { wouldImport: 0, supersededReviewedRows: 0, skipped: 0, rejected: 0 }
  );

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    importsDir: path.relative(rootDir, importsDir),
    filesChecked: files.length,
    filesWithPendingImports: summaries.filter((item) => item.wouldImport > 0).length,
    filesWithSupersededReviewedRows: summaries.filter((item) => item.supersededReviewedRows > 0).length,
    filesFullyApplied: summaries.filter((item) => item.wouldImport === 0 && (item.skipped > 0 || item.supersededReviewedRows > 0) && item.rejected === 0).length,
    filesWithRejectedRows: summaries.filter((item) => item.rejected > 0).length,
    totals,
    topPendingImports: summaries
      .filter((item) => item.wouldImport > 0)
      .sort((a, b) => b.wouldImport - a.wouldImport || a.file.localeCompare(b.file))
      .slice(0, 15),
    topSupersededReviewedRows: summaries
      .filter((item) => item.supersededReviewedRows > 0)
      .sort((a, b) => b.supersededReviewedRows - a.supersededReviewedRows || a.file.localeCompare(b.file))
      .slice(0, 15),
    topRejected: summaries
      .filter((item) => item.rejected > 0)
      .sort((a, b) => b.rejected - a.rejected || a.file.localeCompare(b.file))
      .slice(0, 15),
    failures,
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
