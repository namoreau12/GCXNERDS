const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const reviewedImportsDir = path.join(gamesDir, "reviewed-overview-imports");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-overview-grammar-regressions.json");

const badPatterns = [
  {
    id: "modal-subject-and-distinguishes",
    pattern:
      /\b(?:buyers|players|collectors|sellers|listings|catalog notes|marketplace listings|readers|users|records|pages)\b[^.!?\n]{0,220}\bshould\b[^.!?\n]{0,220}\band distinguishes\b/i,
  },
  {
    id: "overview-identify",
    pattern: /\bThe overview identify\b/i,
  },
  {
    id: "should-and-distinguishes",
    pattern: /\bshould\b[^.!?\n]{0,220}\band distinguishes\b/i,
  },
];

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function walkCsvFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".csv"))
    .map((entry) => path.join(dirPath, entry.name))
    .sort();
}

function gameDatasetFiles() {
  if (!fs.existsSync(gamesDir)) return [];
  return fs
    .readdirSync(gamesDir)
    .filter(isGameDatasetFile)
    .map((fileName) => path.join(gamesDir, fileName))
    .sort();
}

function contextSnippet(text, index) {
  const start = Math.max(0, index - 140);
  const end = Math.min(text.length, index + 240);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function auditFile(filePath) {
  const text = readText(filePath);
  const findings = [];
  for (const check of badPatterns) {
    const match = text.match(check.pattern);
    if (!match) continue;
    findings.push({
      file: path.relative(rootDir, filePath),
      check: check.id,
      snippet: contextSnippet(text, match.index || 0),
    });
  }
  return findings;
}

function selfTest() {
  const badSamples = [
    "Buyers should verify region, language comfort, and distinguishes it from another release.",
    "Listings and catalog notes should flag it as an eShop-era title and distinguishes it from physical retail releases.",
    "The overview identify it as a console dueling title.",
  ];
  const goodSamples = [
    "It is a console dueling title and distinguishes it from the handheld entries.",
    "Buyers should verify region, language comfort, and distinguish it from another release.",
  ];
  const failures = [];

  for (const sample of badSamples) {
    if (!badPatterns.some((check) => check.pattern.test(sample))) failures.push(`Missed bad sample: ${sample}`);
  }
  for (const sample of goodSamples) {
    if (badPatterns.some((check) => check.pattern.test(sample))) failures.push(`Flagged good sample: ${sample}`);
  }

  return { ok: failures.length === 0, failures };
}

function main() {
  const files = [...gameDatasetFiles(), ...walkCsvFiles(reviewedImportsDir)];
  const findings = files.flatMap(auditFile);
  const tested = selfTest();
  const report = {
    ok: findings.length === 0 && tested.ok,
    generatedAt: new Date().toISOString(),
    scannedFiles: files.length,
    selfTest: tested,
    findings: findings.slice(0, 50),
    truncatedFindings: Math.max(0, findings.length - 50),
  };

  writeJsonAtomic(fs, outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main();
