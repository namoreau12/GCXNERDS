const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const repairQueuePath = path.join(rootDir, "data", "launch-readiness", "overview-import-repair-queue.json");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const jsonPath = path.join(outputDir, "overview-rereview-packet.json");
const outputCsvPath = path.join(outputDir, "overview-rereview-packet.csv");

const csvCache = new Map();
const gameCache = new Map();

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
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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

function csvObjects(filePath) {
  if (csvCache.has(filePath)) return csvCache.get(filePath);
  const rows = parseCsv(fs.readFileSync(path.join(rootDir, filePath), "utf8"));
  const headers = rows.shift() || [];
  const objects = rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
  csvCache.set(filePath, objects);
  return objects;
}

function platformGames(platform) {
  if (gameCache.has(platform)) return gameCache.get(platform);
  const filePath = path.join(gamesDir, `${platform}.json`);
  const games = readJson(filePath, []);
  const byId = new Map(Array.isArray(games) ? games.map((game) => [game.id, game]) : []);
  gameCache.set(platform, byId);
  return byId;
}

function currentOverview(game) {
  return String(game?.description || game?.gcxOverview || game?.overview || "").replace(/\s+/g, " ").trim();
}

function sourceFor(row, game) {
  return row.sourceUrl || game?.descriptionSourceUrl || game?.articleUrl || game?.sourceUrl || "";
}

function main() {
  const repairQueue = readJson(repairQueuePath, {});
  const repairRows = repairQueue.csvPath && fs.existsSync(path.join(rootDir, repairQueue.csvPath))
    ? csvObjects(repairQueue.csvPath)
    : repairQueue.sampleRows || [];
  const rows = [];
  const missingOriginalRows = [];
  const missingGames = [];

  repairRows.forEach((item) => {
    const inputPath = item.inputPath;
    const platform = item.platform || item.platformSlug || "";
    const originalRow = inputPath
      ? csvObjects(inputPath).find((row) => row.gameId === item.gameId && row.platformSlug === platform)
      : null;
    if (!originalRow) {
      missingOriginalRows.push({ inputPath, platform, gameId: item.gameId });
      return;
    }

    const game = platformGames(platform).get(item.gameId);
    if (!game) {
      missingGames.push({ inputPath, platform, gameId: item.gameId });
      return;
    }

    rows.push({
      priority: rows.length + 1,
      platformSlug: platform,
      gameId: item.gameId,
      title: originalRow.title || game.title || game.name || "",
      sourceUrl: sourceFor(originalRow, game),
      currentProvider: game.descriptionProvider || game.overviewProvider || originalRow.currentProvider || "",
      rejectionReason: item.reason,
      repairAction: item.action,
      oldCsvCurrentOverview: originalRow.currentOverview || "",
      liveCurrentOverview: currentOverview(game),
      proposedNewOverview: originalRow.newOverview || "",
      rewriteNotes: originalRow.rewriteNotes || "",
      reviewStatus: originalRow.reviewStatus || "",
      reviewer: originalRow.reviewer || "",
      reviewerDecision: "",
      revisedNewOverview: "",
      dryRunCommand: `node scripts/import-game-overview-rewrites.js ${inputPath} --dry-run`,
    });
  });

  const headers = [
    "priority",
    "platformSlug",
    "gameId",
    "title",
    "sourceUrl",
    "currentProvider",
    "rejectionReason",
    "repairAction",
    "oldCsvCurrentOverview",
    "liveCurrentOverview",
    "proposedNewOverview",
    "rewriteNotes",
    "reviewStatus",
    "reviewer",
    "reviewerDecision",
    "revisedNewOverview",
    "dryRunCommand",
  ];
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputCsvPath, `${csv}\n`, "utf8");

  const reasonCounts = rows.reduce((counts, row) => {
    counts[row.rejectionReason] = (counts[row.rejectionReason] || 0) + 1;
    return counts;
  }, {});

  const report = {
    ok: missingOriginalRows.length === 0 && missingGames.length === 0,
    generatedAt: new Date().toISOString(),
    sourceRepairQueue: path.relative(rootDir, repairQueuePath).replace(/\\/g, "/"),
    rowCount: rows.length,
    totalRejectedRows: repairQueue.rejectedRows || rows.length,
    reasonCounts,
    csvPath: path.relative(rootDir, outputCsvPath).replace(/\\/g, "/"),
    sampleRows: rows.slice(0, 20),
    missingOriginalRows,
    missingGames,
  };

  writeJsonAtomic(jsonPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
