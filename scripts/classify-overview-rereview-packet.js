const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputCsvPath = path.join(rootDir, "data", "launch-readiness", "overview-rereview-packet.csv");
const outputPath = path.join(rootDir, "data", "launch-readiness", "overview-rereview-classification.json");

const weakProviderPattern = /GCX metadata editorial overview|metadata|template/i;
const reviewedProviderPattern = /GCX reviewed editorial overview/i;
const internalLanguagePattern = /\b(?:GCX should|Codex should|ChatGPT should|do not publish|internal editorial notes|recommended hero image|newsroom opportunity score)\b/i;
const weakOverviewPattern = /\b(?:officially released|game record|software list|for collectors,? the key identifiers are|is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action) game for)\b/i;

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

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function normalized(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function classify(row) {
  const liveOverview = normalized(row.liveCurrentOverview);
  const proposedOverview = normalized(row.proposedNewOverview);
  const oldCsvOverview = normalized(row.oldCsvCurrentOverview);
  const provider = row.currentProvider || "(blank)";
  const proposedLooksUnsafe =
    proposedOverview.length < 140 ||
    internalLanguagePattern.test(proposedOverview) ||
    weakOverviewPattern.test(proposedOverview);

  if (!proposedOverview) return "missing-proposed-overview";
  if (proposedLooksUnsafe) return "proposed-copy-needs-review";
  if (liveOverview === proposedOverview) return "already-applied";
  if (reviewedProviderPattern.test(provider)) return "live-reviewed-copy-superseded-row";
  if (weakProviderPattern.test(provider) && oldCsvOverview !== liveOverview) return "weak-live-safe-sync-candidate";
  if (weakProviderPattern.test(provider)) return "weak-live-candidate";
  return "needs-editorial-comparison";
}

function main() {
  const rows = fs.existsSync(inputCsvPath) ? readCsvObjects(inputCsvPath) : [];
  const buckets = {};
  const platforms = {};
  const providers = {};
  const examples = {};

  rows.forEach((row) => {
    const bucket = classify(row);
    increment(buckets, bucket);
    increment(platforms, row.platformSlug || "(blank)");
    increment(providers, row.currentProvider || "(blank)");
    if (!examples[bucket]) examples[bucket] = [];
    if (examples[bucket].length < 10) {
      examples[bucket].push({
        platform: row.platformSlug,
        gameId: row.gameId,
        title: row.title,
        currentProvider: row.currentProvider,
        sourceUrl: row.sourceUrl,
        dryRunCommand: row.dryRunCommand,
      });
    }
  });

  const orderedBuckets = Object.fromEntries(Object.entries(buckets).sort((a, b) => b[1] - a[1]));
  const orderedPlatforms = Object.fromEntries(Object.entries(platforms).sort((a, b) => b[1] - a[1]));
  const orderedProviders = Object.fromEntries(Object.entries(providers).sort((a, b) => b[1] - a[1]));
  const weakLiveSafeCandidateCount = (buckets["weak-live-safe-sync-candidate"] || 0) + (buckets["weak-live-candidate"] || 0);
  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    inputCsvPath: path.relative(rootDir, inputCsvPath).replace(/\\/g, "/"),
    rowCount: rows.length,
    summary: {
      weakLiveSafeCandidateCount,
      alreadyAppliedCount: buckets["already-applied"] || 0,
      liveReviewedSupersededCount: buckets["live-reviewed-copy-superseded-row"] || 0,
      needsEditorialComparisonCount: (buckets["needs-editorial-comparison"] || 0) + (buckets["proposed-copy-needs-review"] || 0),
    },
    buckets: orderedBuckets,
    platforms: orderedPlatforms,
    providers: orderedProviders,
    examples,
    recommendedNextStep: weakLiveSafeCandidateCount
      ? "Sync currentOverview only for weak-live candidates, dry-run those CSVs, and import only rows that still pass editorial safety checks."
      : "Do not force-import this stale packet. Most rows already have reviewed live copy or need side-by-side editorial comparison.",
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
}

main();
