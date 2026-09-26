const fs = require("node:fs");
const path = require("node:path");
const { writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const indexPath = path.join(gamesDir, "overview-rewrite-batches.json");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-overview-rewrite-batches.json");
const qualityPath = path.join(rootDir, "data", "launch-readiness", "game-overview-quality.json");

const requiredHeaders = [
  "platformSlug",
  "gameId",
  "title",
  "currentProvider",
  "sourceUrl",
  "reason",
  "currentOverview",
  "rewriteNotes",
  "newOverview",
  "reviewStatus",
  "reviewer",
];

function parseCsvRows(text) {
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

function auditBatch(batch) {
  const failures = [];
  const relativePath = batch.path || "";
  const filePath = path.join(rootDir, relativePath);
  if (!relativePath.startsWith("data/games/overview-rewrite-batches/")) failures.push("Batch path must live under data/games/overview-rewrite-batches/.");
  if (!fs.existsSync(filePath)) {
    failures.push("Batch CSV is missing.");
    return { ...batch, ok: false, rowCount: 0, failures };
  }

  const rows = parseCsvRows(fs.readFileSync(filePath, "utf8"));
  const headers = rows[0] || [];
  const dataRows = rows.slice(1);
  const headerIndexes = Object.fromEntries(headers.map((header, index) => [header, index]));
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) failures.push(`Missing CSV header ${header}.`);
  }
  if (!dataRows.length) failures.push("Batch CSV has no data rows.");
  if (Number(batch.records || 0) !== dataRows.length) failures.push(`Batch index records ${batch.records} does not match CSV row count ${dataRows.length}.`);
  if (!String(batch.platformSlug || "").trim()) failures.push("Batch is missing platformSlug.");
  if (!String(batch.platformLabel || "").trim()) failures.push("Batch is missing platformLabel.");
  if (Number(batch.weakOverviewCount || 0) < Number(batch.records || 0)) failures.push("Batch weakOverviewCount is lower than exported records.");

  const seen = new Set();
  dataRows.forEach((row, index) => {
    const key = `${row[headerIndexes.platformSlug] || ""}:${row[headerIndexes.gameId] || ""}`;
    if (seen.has(key)) failures.push(`Duplicate row ${key}.`);
    seen.add(key);
    if (!row[headerIndexes.currentOverview]) failures.push(`Row ${index + 2} is missing currentOverview.`);
    if (!row[headerIndexes.reason]) failures.push(`Row ${index + 2} is missing reason.`);
    if (!row[headerIndexes.currentProvider]) failures.push(`Row ${index + 2} is missing currentProvider.`);
  });

  return {
    platformSlug: batch.platformSlug,
    platformLabel: batch.platformLabel,
    path: relativePath,
    records: batch.records,
    weakOverviewCount: batch.weakOverviewCount,
    rowCount: dataRows.length,
    ok: failures.length === 0,
    failures,
  };
}

function main() {
  const failures = [];
  if (!fs.existsSync(indexPath)) failures.push("Missing data/games/overview-rewrite-batches.json.");
  const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf8")) : {};
  const quality = fs.existsSync(qualityPath) ? JSON.parse(fs.readFileSync(qualityPath, "utf8")) : {};
  const qualityWeakCount = Number(quality.totals?.weakTemplateCount || 0);
  const batches = Array.isArray(index.batches) ? index.batches : [];
  const noWeakOverviewsRemain = Number(index.totalWeakOverviews || 0) === 0 && qualityWeakCount === 0;
  if (!noWeakOverviewsRemain) {
    if (!batches.length) failures.push("Overview rewrite batch index has no batches.");
    if (Number(index.totalWeakOverviews || 0) <= 0) failures.push("Overview rewrite batch index has no totalWeakOverviews.");
    if (Number(index.totalRecords || 0) <= 0) failures.push("Overview rewrite batch index has no totalRecords.");
  }

  const auditedBatches = batches.map(auditBatch);
  auditedBatches.forEach((batch) => batch.failures.forEach((failure) => failures.push(`${batch.platformSlug || batch.path}: ${failure}`)));
  const rowTotal = auditedBatches.reduce((sum, batch) => sum + batch.rowCount, 0);
  if (Number(index.totalRecords || 0) !== rowTotal) failures.push(`Batch index totalRecords ${index.totalRecords} does not match CSV row total ${rowTotal}.`);

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    requiredHeaders,
    batchCount: batches.length,
    totalWeakOverviews: index.totalWeakOverviews || 0,
    qualityWeakTemplateCount: qualityWeakCount,
    totalRecords: index.totalRecords || 0,
    rowTotal,
    batches: auditedBatches,
    failures,
  };
  writeJsonAtomic(fs, outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
