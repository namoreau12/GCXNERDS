const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(rootDir, "data", "launch-readiness", "priority-image-review-batches.json");
const missingQueuePath = path.join(gamesDir, "missing-image-queue.json");

const requiredHeaders = [
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
const milestoneRequiredHeaders = ["milestoneTargetPct", "milestoneRank", ...requiredHeaders];

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

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

function csvObjects(filePath) {
  const rows = parseCsvRows(fs.readFileSync(filePath, "utf8"));
  const headers = rows[0] || [];
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function missingQueueKeys() {
  if (!fs.existsSync(missingQueuePath)) return { keys: new Set(), total: 0, failures: ["Missing data/games/missing-image-queue.json."] };
  const queue = JSON.parse(fs.readFileSync(missingQueuePath, "utf8"));
  const keys = new Set();
  for (const platform of queue.platforms || []) {
    for (const record of platform.records || []) {
      if (record.id) keys.add(`${platform.slug}:${record.id}`);
    }
  }
  return {
    keys,
    total: Number(queue.totals?.missingImages || keys.size),
    failures: [],
  };
}

function auditBatch(batch, expectedPathPrefix, config = {}) {
  const failures = [];
  const required = config.requiredHeaders || requiredHeaders;
  const relativePath = batch.path || "";
  const filePath = path.join(rootDir, relativePath);
  if (!relativePath.startsWith(expectedPathPrefix)) failures.push(`Batch path must live under ${expectedPathPrefix}.`);
  if (!fs.existsSync(filePath)) {
    failures.push("Batch CSV is missing.");
    return { ...batch, ok: false, rowCount: 0, failures };
  }

  const rows = parseCsvRows(fs.readFileSync(filePath, "utf8"));
  const headers = rows[0] || [];
  const dataRows = rows.slice(1);
  for (const header of required) {
    if (!headers.includes(header)) failures.push(`Missing CSV header ${header}.`);
  }
  if (!dataRows.length) failures.push("Batch CSV has no data rows.");
  if (Number(batch.records || 0) !== dataRows.length) {
    failures.push(`Batch index records ${batch.records} does not match CSV row count ${dataRows.length}.`);
  }
  if (!config.milestone) {
    if (!String(batch.platformSlug || "").trim()) failures.push("Batch is missing platformSlug.");
    if (!String(batch.platformLabel || "").trim()) failures.push("Batch is missing platformLabel.");
    if (Number(batch.missingImages || 0) <= 0) failures.push("Batch missingImages should be greater than zero.");
    if (Number(batch.imagePct || 0) <= 0 || Number(batch.imagePct || 0) > 100) failures.push("Batch imagePct is out of range.");
  }

  return {
    platformSlug: batch.platformSlug,
    platformLabel: batch.platformLabel,
    path: relativePath,
    records: batch.records,
    rowCount: dataRows.length,
    missingImages: batch.missingImages,
    imagePct: batch.imagePct,
    ok: failures.length === 0,
    failures,
  };
}

function auditMilestoneIntegrity(index) {
  const failures = [];
  const queue = missingQueueKeys();
  failures.push(...queue.failures);

  const batchSets = [];
  for (const batch of index.batches || []) {
    const filePath = path.join(rootDir, batch.path || "");
    if (!fs.existsSync(filePath)) continue;
    const rows = csvObjects(filePath);
    const keys = new Set();
    const rowPlatforms = new Set();

    rows.forEach((row, rowIndex) => {
      const key = `${row.platformSlug}:${row.gameId}`;
      if (!row.platformSlug || !row.gameId) failures.push(`${batch.path}: row ${rowIndex + 2} is missing platformSlug or gameId.`);
      if (keys.has(key)) failures.push(`${batch.path}: duplicate row ${key}.`);
      keys.add(key);
      if (!queue.keys.has(key)) failures.push(`${batch.path}: ${key} is not in the current missing-image queue.`);
      if (Number(row.milestoneTargetPct || 0) !== Number(batch.targetPct || 0)) {
        failures.push(`${batch.path}: row ${rowIndex + 2} target ${row.milestoneTargetPct} does not match batch target ${batch.targetPct}.`);
      }
      if (row.platformSlug) rowPlatforms.add(row.platformSlug);
    });

    const indexedPlatforms = new Set(batch.platforms || []);
    for (const platform of rowPlatforms) {
      if (!indexedPlatforms.has(platform)) failures.push(`${batch.path}: platform ${platform} is missing from batch index platforms.`);
    }
    for (const platform of indexedPlatforms) {
      if (!rowPlatforms.has(platform)) failures.push(`${batch.path}: batch index platform ${platform} has no rows.`);
    }
    batchSets.push({ targetPct: Number(batch.targetPct || 0), path: batch.path, keys });
  }

  const sorted = batchSets.sort((a, b) => a.targetPct - b.targetPct);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    for (const key of previous.keys) {
      if (!current.keys.has(key)) failures.push(`${previous.path}: ${key} is missing from later ${current.targetPct}% milestone batch.`);
    }
  }

  const completeBatch = sorted.find((batch) => batch.targetPct === 100);
  if (completeBatch) {
    if (completeBatch.keys.size !== queue.keys.size) {
      failures.push(`100% milestone has ${completeBatch.keys.size} unique rows, expected ${queue.keys.size} current missing-image rows.`);
    }
    for (const key of queue.keys) {
      if (!completeBatch.keys.has(key)) failures.push(`100% milestone is missing current queue row ${key}.`);
    }
  }

  return {
    ok: failures.length === 0,
    currentMissingRows: queue.keys.size,
    milestoneTargets: sorted.map((batch) => ({ targetPct: batch.targetPct, rows: batch.keys.size })),
    failures,
  };
}

function auditIndex(config) {
  const failures = [];
  let milestoneIntegrity;
  const indexPath = path.join(gamesDir, config.indexFile);
  if (!fs.existsSync(indexPath)) failures.push(`Missing data/games/${config.indexFile}.`);
  const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf8")) : {};
  const batches = Array.isArray(index.batches) ? index.batches : [];
  if (!batches.length) failures.push(`${config.label} image review batch index has no batches.`);
  if (Number(index.totalRecords || 0) <= 0) failures.push(`${config.label} image review batch index has no totalRecords.`);

  const auditedBatches = batches.map((batch) => auditBatch(batch, config.pathPrefix, config));
  auditedBatches.forEach((batch) => {
    batch.failures.forEach((failure) => failures.push(`${batch.platformSlug || batch.path}: ${failure}`));
  });
  const rowTotal = auditedBatches.reduce((sum, batch) => sum + batch.rowCount, 0);
  if (Number(index.totalRecords || 0) !== rowTotal) {
    failures.push(`${config.label} batch index totalRecords ${index.totalRecords} does not match CSV row total ${rowTotal}.`);
  }
  if (config.milestone) {
    batches.forEach((batch) => {
      if (Number(batch.targetPct || 0) <= 0) failures.push(`${config.label}: ${batch.path || "batch"} is missing targetPct.`);
      if (Number(batch.additionalImagesNeeded || 0) !== Number(batch.records || 0)) {
        failures.push(`${config.label}: ${batch.path || "batch"} records should match additionalImagesNeeded.`);
      }
      if (!Array.isArray(batch.platforms) || !batch.platforms.length) failures.push(`${config.label}: ${batch.path || "batch"} is missing platforms.`);
    });
    milestoneIntegrity = auditMilestoneIntegrity(index);
    failures.push(...milestoneIntegrity.failures);
  }

  return {
    label: config.label,
    generatedAt: new Date().toISOString(),
    indexPath: `data/games/${config.indexFile}`,
    batchCount: batches.length,
    totalRecords: index.totalRecords || 0,
    rowTotal,
    batches: auditedBatches,
    milestoneIntegrity,
    failures,
  };
}

function main() {
  const indexes = [
    {
      label: "Priority",
      indexFile: "priority-image-review-batches.json",
      pathPrefix: "data/games/review-batches/",
    },
    {
      label: "Finishable",
      indexFile: "finishable-image-review-batches.json",
      pathPrefix: "data/games/finishable-review-batches/",
    },
    {
      label: "Milestone",
      indexFile: "milestone-image-review-batches.json",
      pathPrefix: "data/games/milestone-review-batches/",
      requiredHeaders: milestoneRequiredHeaders,
      milestone: true,
    },
  ];
  const reports = indexes.map(auditIndex);
  const failures = reports.flatMap((report) => report.failures.map((failure) => `${report.label}: ${failure}`));
  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    requiredHeaders,
    milestoneRequiredHeaders,
    batchCount: reports.reduce((sum, item) => sum + item.batchCount, 0),
    totalRecords: reports.reduce((sum, item) => sum + Number(item.totalRecords || 0), 0),
    rowTotal: reports.reduce((sum, item) => sum + item.rowTotal, 0),
    indexes: reports,
    failures,
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
