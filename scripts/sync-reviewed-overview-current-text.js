const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputArg = process.argv[2];

if (!inputArg) {
  console.error("Usage: node scripts/sync-reviewed-overview-current-text.js <reviewed-csv-path>");
  process.exit(1);
}

const csvPath = path.resolve(rootDir, inputArg);

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

function formatCsvCell(value) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function currentOverviewFor(game) {
  return game.description || game.gcxOverview || game.overview || "";
}

const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
const headers = rows[0] || [];
const columnIndex = Object.fromEntries(headers.map((header, index) => [header, index]));

for (const requiredHeader of ["platformSlug", "gameId", "currentOverview"]) {
  if (columnIndex[requiredHeader] === undefined) {
    console.error(`Missing required CSV header: ${requiredHeader}`);
    process.exit(1);
  }
}

let synced = 0;
const missing = [];
const platformCache = new Map();

for (let index = 1; index < rows.length; index += 1) {
  const row = rows[index];
  const platformSlug = row[columnIndex.platformSlug];
  const gameId = row[columnIndex.gameId];
  if (!platformCache.has(platformSlug)) {
    const dataPath = path.join(rootDir, "data", "games", `${platformSlug}.json`);
    platformCache.set(platformSlug, JSON.parse(fs.readFileSync(dataPath, "utf8")));
  }
  const game = platformCache.get(platformSlug).find((candidate) => candidate.id === gameId);
  if (!game) {
    missing.push({ platformSlug, gameId });
    continue;
  }
  row[columnIndex.currentOverview] = currentOverviewFor(game);
  synced += 1;
}

fs.writeFileSync(csvPath, `${rows.map((row) => row.map(formatCsvCell).join(",")).join("\n")}\n`);

console.log(JSON.stringify({ ok: missing.length === 0, csvPath, synced, missing }, null, 2));
