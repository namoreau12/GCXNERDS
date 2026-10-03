const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const cacheDir = path.join(rootDir, ".cache");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-overview-import-safety.json");
const importScriptPath = path.join(rootDir, "scripts", "import-game-overview-rewrites.js");

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsv(filePath, rows) {
  const headers = [
    "platformSlug",
    "gameId",
    "title",
    "currentOverview",
    "sourceUrl",
    "rewriteNotes",
    "newOverview",
    "reviewStatus",
    "reviewer",
  ];
  const text = [headers, ...rows.map((row) => headers.map((header) => row[header] || ""))]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
  fs.writeFileSync(filePath, `${text}\n`);
}

function runImport(csvPath, reportPath) {
  return spawnSync(process.execPath, [path.join("scripts", "import-game-overview-rewrites.js"), csvPath, "--dry-run", `--report-output=${reportPath}`], {
    cwd: rootDir,
    encoding: "utf8",
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function firstGame() {
  const games = readJson(path.join(rootDir, "data", "games", "snes.json"));
  const game = games.find((item) => item.id && item.title && item.description);
  if (!game) throw new Error("Could not find an SNES fixture game with id, title, and description.");
  return game;
}

function main() {
  fs.mkdirSync(cacheDir, { recursive: true });
  const game = firstGame();
  const baseRow = {
    platformSlug: "snes",
    gameId: game.id,
    title: game.title,
    currentOverview: game.description,
    sourceUrl: game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "https://example.com/editorial-source",
    rewriteNotes: "Synthetic dry-run audit row; do not import.",
    newOverview:
      `${game.title} is presented here with a rewritten player-facing overview focused on what the player actually does, how the pacing feels, and why the release matters in the platform library. ` +
      "This audit copy is intentionally long enough to prove that reviewed editorial text can pass the importer without modifying the live dataset.",
    reviewStatus: "approved",
    reviewer: "launch-audit",
  };

  const validCsvPath = path.join(cacheDir, "overview-import-valid.csv");
  const invalidCsvPath = path.join(cacheDir, "overview-import-invalid.csv");
  const validReportPath = path.join(cacheDir, "overview-import-valid-report.json");
  const invalidReportPath = path.join(cacheDir, "overview-import-invalid-report.json");

  writeCsv(validCsvPath, [baseRow]);
  writeCsv(invalidCsvPath, [
    { ...baseRow, reviewStatus: "", reviewer: "", newOverview: "Too short." },
    { ...baseRow, gameId: `${game.id}-duplicate`, currentOverview: "stale source text", newOverview: baseRow.newOverview, reviewStatus: "approved", reviewer: "launch-audit" },
    { ...baseRow, gameId: `${game.id}-bad-url`, sourceUrl: "not a url", newOverview: baseRow.newOverview, reviewStatus: "approved", reviewer: "launch-audit" },
    {
      ...baseRow,
      gameId: `${game.id}-listing-language`,
      newOverview:
        `${game.title} is presented here with enough length to look superficially complete, but it still uses process-copy language instead of a player-facing overview. ` +
        "Listings should spell out region, format, edition, included extras, and condition, which is exactly the kind of marketplace instruction this importer must reject.",
      reviewStatus: "approved",
      reviewer: "launch-audit",
    },
  ]);

  const failures = [];
  const sourceBefore = fs.readFileSync(path.join(rootDir, "data", "games", "snes.json"), "utf8");
  const validRun = runImport(validCsvPath, validReportPath);
  const invalidRun = runImport(invalidCsvPath, invalidReportPath);
  const sourceAfter = fs.readFileSync(path.join(rootDir, "data", "games", "snes.json"), "utf8");

  assert(validRun.status === 0, `Expected valid dry-run import to exit 0, got ${validRun.status}.`, failures);
  assert(invalidRun.status === 0, `Expected invalid dry-run import to exit 0 with rejected rows, got ${invalidRun.status}.`, failures);
  assert(sourceBefore === sourceAfter, "Dry-run overview import modified data/games/snes.json.", failures);

  const validReport = fs.existsSync(validReportPath) ? readJson(validReportPath) : null;
  const invalidReport = fs.existsSync(invalidReportPath) ? readJson(invalidReportPath) : null;
  assert(validReport?.mode === "dry-run", "Valid report did not record dry-run mode.", failures);
  assert((validReport?.importedRows || []).length === 1, "Valid dry-run report should include one importable row.", failures);
  assert((validReport?.rejected || []).length === 0, "Valid dry-run row should not be rejected.", failures);
  assert((invalidReport?.rejected || []).length >= 4, "Invalid dry-run report should reject weak/missing-review/stale/bad-url/listing-language rows.", failures);
  assert(
    (invalidReport?.rejected || []).some((row) => /reviewStatus|too short|template/i.test(row.reason || "")),
    "Invalid report did not reject missing review status or weak overview copy.",
    failures
  );
  assert(
    (invalidReport?.rejected || []).some((row) => /Invalid sourceUrl/i.test(row.reason || "")),
    "Invalid report did not reject bad sourceUrl.",
    failures
  );
  assert(
    fs.readFileSync(importScriptPath, "utf8").includes("currentOverview is stale"),
    "Importer should reject stale currentOverview rows unless --force is used.",
    failures
  );

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedFiles: ["scripts/import-game-overview-rewrites.js", "data/games/overview-rewrite-batches/*.csv"],
    requiredHeaders: ["newOverview", "reviewStatus", "reviewer", "currentOverview"],
    dryRunPreservesDatasets: sourceBefore === sourceAfter,
    validImportableRows: (validReport?.importedRows || []).length,
    invalidRejectedRows: (invalidReport?.rejected || []).length,
    failures,
  };

  writeJsonAtomic(fs, outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
