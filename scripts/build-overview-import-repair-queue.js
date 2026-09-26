const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const cacheDir = path.join(rootDir, ".cache", "overview-import-freshness");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const jsonPath = path.join(outputDir, "overview-import-repair-queue.json");
const csvPath = path.join(outputDir, "overview-import-repair-queue.csv");

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tmpPath, filePath);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function repairAction(reason) {
  const text = String(reason || "").toLowerCase();
  if (text.includes("currentoverview is stale")) {
    return "Refresh currentOverview from live game data, re-read the reviewed copy beside the current record, then import with --force only after confirming the row is still accurate.";
  }
  if (text.includes("too short") || text.includes("template") || text.includes("internal editorial language")) {
    return "Rewrite newOverview with specific player-facing detail and remove template/internal language before re-running the dry-run importer.";
  }
  if (text.includes("reviewstatus")) {
    return "Set reviewStatus to approved, verified, or reviewed after editorial review.";
  }
  if (text.includes("reviewer")) {
    return "Add a reviewer name or initials after editorial review.";
  }
  if (text.includes("title mismatch")) {
    return "Confirm the row targets the correct game ID and title before editing or importing.";
  }
  if (text.includes("not found")) {
    return "Confirm the game still exists in the current platform dataset before preserving the row.";
  }
  if (text.includes("invalid sourceurl")) {
    return "Replace sourceUrl with a valid HTTP or HTTPS source URL, or leave it blank when no source is available.";
  }
  return "Re-run the row through dry-run import and repair the specific guardrail failure before importing.";
}

function main() {
  const files = fs.existsSync(cacheDir) ? fs.readdirSync(cacheDir).filter((file) => file.endsWith(".json")).sort() : [];
  const reasonCounts = new Map();
  const platformCounts = new Map();
  const fileCounts = new Map();
  const repairRows = [];

  files.forEach((file) => {
    const report = readJson(path.join(cacheDir, file), {});
    const inputPath = path.relative(rootDir, report.inputPath || "").replace(/\\/g, "/");
    (report.rejected || []).forEach((row) => {
      const reason = row.reason || "Unknown rejection";
      const platform = row.platform || "";
      increment(reasonCounts, reason);
      increment(platformCounts, platform || "unknown");
      increment(fileCounts, file);
      repairRows.push({
        file,
        inputPath,
        platform,
        gameId: row.gameId || "",
        title: row.title || "",
        reason,
        action: repairAction(reason),
      });
    });
  });

  const rowsByReason = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, count, action: repairAction(reason) }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
  const rowsByPlatform = [...platformCounts.entries()]
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count || a.platform.localeCompare(b.platform));
  const rowsByFile = [...fileCounts.entries()]
    .map(([file, count]) => {
      const row = repairRows.find((item) => item.file === file);
      return { file, inputPath: row?.inputPath || "", count };
    })
    .sort((a, b) => b.count - a.count || a.file.localeCompare(b.file));

  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    cacheDir: path.relative(rootDir, cacheDir),
    scannedReports: files.length,
    rejectedRows: repairRows.length,
    reasonCount: rowsByReason.length,
    platformCount: rowsByPlatform.length,
    fileCount: rowsByFile.length,
    topReasons: rowsByReason.slice(0, 12),
    topPlatforms: rowsByPlatform.slice(0, 12),
    topFiles: rowsByFile.slice(0, 25),
    sampleRows: repairRows.slice(0, 100),
    csvPath: path.relative(rootDir, csvPath).replace(/\\/g, "/"),
  };

  const csvHeaders = ["file", "inputPath", "platform", "gameId", "title", "reason", "action"];
  const csv = [
    csvHeaders.join(","),
    ...repairRows.map((row) => csvHeaders.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(csvPath, `${csv}\n`, "utf8");
  writeJsonAtomic(jsonPath, report);
  console.log(JSON.stringify(report, null, 2));
}

main();
