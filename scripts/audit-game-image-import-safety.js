const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "game-image-import-safety.json");
const cacheDir = path.join(rootDir, ".cache");
const queueCsvPath = path.join(rootDir, "data", "games", "review-image-batch.csv");
const queueJsonPath = path.join(rootDir, "data", "games", "missing-image-queue.json");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function readCsvHeaders(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return (text.split(/\r?\n/)[0] || "").split(",");
}

function firstMissingImageRecord() {
  const queue = JSON.parse(fs.readFileSync(queueJsonPath, "utf8"));
  for (const platform of queue.platforms || []) {
    const record = (platform.records || [])[0];
    if (record?.id && record?.title) {
      return {
        platformSlug: platform.slug,
        platformLabel: platform.label,
        gameId: record.id,
        title: record.title,
        platform: record.platform || platform.slug.toUpperCase(),
      };
    }
  }
  return null;
}

function writeImportCsv(filePath, record, reviewStatus, reviewer) {
  const headers = [
    "platformSlug",
    "gameId",
    "title",
    "imageUrl",
    "imageSourceUrl",
    "imageProvider",
    "notes",
    "reviewStatus",
    "reviewer",
  ];
  const row = [
    record.platformSlug,
    record.gameId,
    record.title,
    "https://static.gcx.example.test/manual-cover.jpg",
    "https://www.mobygames.com/",
    "Safety audit fixture",
    "Dry-run safety audit; not imported.",
    reviewStatus,
    reviewer,
  ];
  fs.writeFileSync(filePath, `${headers.join(",")}\n${row.map(csvCell).join(",")}\n`);
}

function runImport(filePath) {
  const reportPath = path.join(cacheDir, `${path.basename(filePath, ".csv")}.impact.json`);
  return spawnSync(process.execPath, [path.join("scripts", "import-game-image-urls.js"), filePath, "--dry-run", `--report-output=${reportPath}`], {
    cwd: rootDir,
    encoding: "utf8",
  });
}

function importedCount(output) {
  const match = String(output || "").match(/Would import\s+(\d+)\s+image URLs\./i);
  return match ? Number(match[1]) : null;
}

function main() {
  const failures = [];
  fs.mkdirSync(cacheDir, { recursive: true });

  if (!fs.existsSync(queueCsvPath)) failures.push("Missing data/games/review-image-batch.csv.");
  if (!fs.existsSync(queueJsonPath)) failures.push("Missing data/games/missing-image-queue.json.");

  const headers = fs.existsSync(queueCsvPath) ? readCsvHeaders(queueCsvPath) : [];
  for (const required of ["imageUrl", "imageSourceUrl", "imageProvider", "reviewStatus", "reviewer"]) {
    if (!headers.includes(required)) failures.push(`Review batch CSV is missing ${required}.`);
  }

  const record = fs.existsSync(queueJsonPath) ? firstMissingImageRecord() : null;
  if (!record) failures.push("No missing-image record available for dry-run importer safety audit.");

  let rejectedUnapproved = false;
  let acceptedApproved = false;
  let impactReportOk = false;
  if (record) {
    const unapprovedPath = path.join(cacheDir, "game-image-import-unapproved.audit.csv");
    const approvedPath = path.join(cacheDir, "game-image-import-approved.audit.csv");
    writeImportCsv(unapprovedPath, record, "", "");
    writeImportCsv(approvedPath, record, "approved", "GCX Audit");

    const unapproved = runImport(unapprovedPath);
    const approved = runImport(approvedPath);
    const approvedReportPath = path.join(cacheDir, `${path.basename(approvedPath, ".csv")}.impact.json`);
    const approvedReport = fs.existsSync(approvedReportPath) ? JSON.parse(fs.readFileSync(approvedReportPath, "utf8")) : null;
    rejectedUnapproved = unapproved.status === 0 && importedCount(`${unapproved.stdout}\n${unapproved.stderr}`) === 0;
    acceptedApproved = approved.status === 0 && importedCount(`${approved.stdout}\n${approved.stderr}`) === 1;
    impactReportOk =
      approvedReport?.mode === "dry-run" &&
      Number(approvedReport.coverageImpact?.projected?.addedImages || 0) === 1 &&
      (approvedReport.coverageImpact?.milestones || []).some((milestone) => Number(milestone.targetPct) === 90);

    if (!rejectedUnapproved) failures.push("Importer did not reject an unapproved reviewed-image row in dry-run mode.");
    if (!acceptedApproved) failures.push("Importer did not accept an approved reviewed-image row in dry-run mode.");
    if (!impactReportOk) failures.push("Importer dry-run did not write a coverage impact report with milestone progress.");
  }

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedFiles: ["data/games/review-image-batch.csv", "scripts/import-game-image-urls.js"],
    requiredHeaders: ["imageUrl", "imageSourceUrl", "imageProvider", "reviewStatus", "reviewer"],
    rejectedUnapproved,
    acceptedApproved,
    impactReportOk,
    failures,
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
