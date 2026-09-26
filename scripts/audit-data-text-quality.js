const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const scannedRoots = ["data", "docs"];
const rootFileExtensions = new Set([".html", ".js", ".css", ".md", ".txt", ".xml"]);
const recursiveFileExtensions = new Set([".json", ".md", ".csv"]);

const suspiciousMojibakePattern = /(?:\u00c3[\u00a0-\u00ff]|\u00c2[\u00a0-\u00bf]|\u00c5[\u0080-\u00bf\u00a0-\u00ff]|\u00e2[\u0080-\u00bf\u20ac\u201a-\u201e]|\u00ef\u00bf\u00bd|\ufffd)/;
const allowedSnippets = [
  "\u00c2ngelo Bortolini",
];
const allowedGeneratedFiles = new Set([
  path.join("data", "launch-readiness", "latest.json"),
  path.join("data", "launch-readiness", "latest.md"),
]);

function shouldScanFile(filePath, recursive = false) {
  const extension = path.extname(filePath).toLowerCase();
  if (allowedGeneratedFiles.has(path.relative(rootDir, filePath))) return false;
  if (recursive) return recursiveFileExtensions.has(extension);
  return rootFileExtensions.has(extension);
}

function walk(dirPath) {
  const files = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".cache" || entry.name === ".git") continue;
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) files.push(...walk(entryPath));
    if (entry.isFile() && shouldScanFile(entryPath, true)) files.push(entryPath);
  }
  return files;
}

function collectFiles() {
  const files = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isFile() && shouldScanFile(entryPath)) files.push(entryPath);
  }

  for (const root of scannedRoots) {
    const dirPath = path.join(rootDir, root);
    if (fs.existsSync(dirPath)) files.push(...walk(dirPath));
  }

  return files;
}

function contextSnippet(line, index) {
  const start = Math.max(0, index - 80);
  const end = Math.min(line.length, index + 80);
  return line.slice(start, end);
}

function auditFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const findings = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const match = line.match(suspiciousMojibakePattern);
    if (!match) return;
    if (allowedSnippets.some((snippet) => line.includes(snippet))) return;
    findings.push({
      file: path.relative(rootDir, filePath),
      line: index + 1,
      snippet: contextSnippet(line, match.index || 0),
    });
  });

  return findings;
}

function patternSelfTest() {
  const badSamples = [
    "Pok\u00c3\u00a9mon",
    "Collector\u00e2\u20ac\u2122s Edition",
    "Pikachu\u00c2\u00ae",
    "caf\u00ef\u00bf\u00bd",
    "Pok\u00c3\u0192\u00c2\u00a9mon",
  ];
  const goodSamples = ["Pok\u00e9mon", "Collector's Edition", "Pikachu\u00ae", "\u00c2ngelo Bortolini", ".hack//fr\u00e4gment"];
  const failures = [];

  badSamples.forEach((sample) => {
    if (!suspiciousMojibakePattern.test(sample)) failures.push(`Pattern missed bad sample: ${sample}`);
  });
  goodSamples.forEach((sample) => {
    const matched = suspiciousMojibakePattern.test(sample);
    const allowed = allowedSnippets.some((snippet) => sample.includes(snippet));
    if (matched && !allowed) failures.push(`Pattern flagged good sample: ${sample}`);
  });

  return {
    ok: failures.length === 0,
    badSamples: badSamples.length,
    goodSamples: goodSamples.length,
    failures,
  };
}

function main() {
  const files = collectFiles();
  const findings = files.flatMap(auditFile);
  const selfTest = patternSelfTest();
  const result = {
    ok: findings.length === 0 && selfTest.ok,
    scannedFiles: files.length,
    selfTest,
    findings: findings.slice(0, 50),
    truncatedFindings: Math.max(0, findings.length - 50),
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main();
