const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "public-draft-language.json");

const includeRoots = [
  ".",
  "docs",
  "data",
];

const ignoredDirs = new Set([
  ".cache",
  ".git",
  "assets",
  "node_modules",
  "scripts",
  "supabase",
  "internal",
  "data/games",
  "data/magic",
  "data/pokemon",
  "data/yugioh",
  "data/launch-readiness",
]);

const rootLevelExtensions = new Set([".html", ".js"]);
const allowedDataFiles = new Set([
  "data/community.json",
  "data/newsroom.json",
  "data/newsroom-os.json",
]);

const publicDocs = new Set([
  "docs/editorial-corrections-policy.md",
  "docs/editorial-media-policy.md",
  "docs/game-image-review-workflow.md",
  "docs/marketplace-launch-readiness.md",
  "docs/moderation-operations-readiness.md",
  "docs/supabase-auth-launch-checklist.md",
  "docs/supabase-launch-data-checklist.md",
]);

const patterns = [
  { id: "gcx-should", pattern: /\bGCX should\b/i },
  { id: "site-should", pattern: /\bThe site should\b/i },
  { id: "page-should", pattern: /\b(?:The|This) page should\b/i },
  { id: "overview-should", pattern: /\b(?:The|This) overview should\b/i },
  { id: "listing-should", pattern: /\bThe listing should\b/i },
  { id: "codex-chatgpt-should", pattern: /\b(?:Codex|ChatGPT) should\b/i },
  { id: "internal-editorial-note", pattern: /\bInternal Editorial Notes\b/i },
  { id: "internal-do-not-publish-header", pattern: /\bInternal Editorial Notes\s+[-:—]\s+Do Not Publish\b/i },
  { id: "newsroom-opportunity-score", pattern: /\bNewsroom Opportunity Score\b/i },
  { id: "recommended-hero-image", pattern: /\bRecommended hero image\b/i },
];

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function isIgnoredDir(relativePath) {
  const normalized = toPosix(relativePath);
  return [...ignoredDirs].some((dir) => normalized === dir || normalized.startsWith(`${dir}/`));
}

function shouldScan(relativePath) {
  const normalized = toPosix(relativePath);
  if (isIgnoredDir(normalized)) return false;
  if (publicDocs.has(normalized)) return true;
  if (allowedDataFiles.has(normalized)) return true;
  if (!normalized.includes("/") && rootLevelExtensions.has(path.extname(normalized))) return true;
  return false;
}

function listFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);
    if (entry.isDirectory()) {
      if (!isIgnoredDir(relativePath)) files.push(...listFiles(fullPath));
      continue;
    }
    if (entry.isFile() && shouldScan(relativePath)) files.push(fullPath);
  }
  return files;
}

function lineSnippet(line, index) {
  const start = Math.max(0, index - 90);
  const end = Math.min(line.length, index + 150);
  return line.slice(start, end).replace(/\s+/g, " ").trim();
}

function scanFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const relativePath = toPosix(path.relative(rootDir, filePath));
  const offenders = [];
  text.split(/\r?\n/).forEach((line, lineIndex) => {
    for (const { id, pattern } of patterns) {
      const match = line.match(pattern);
      if (!match) continue;
      offenders.push({
        file: relativePath,
        line: lineIndex + 1,
        issue: id,
        snippet: lineSnippet(line, match.index || 0),
      });
    }
  });
  return offenders;
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function main() {
  const files = [...new Set(includeRoots.flatMap((entry) => listFiles(path.join(rootDir, entry))))].sort();
  const offenders = files.flatMap(scanFile);
  const report = {
    ok: offenders.length === 0,
    generatedAt: new Date().toISOString(),
    scannedFiles: files.length,
    offenderCount: offenders.length,
    offenders: offenders.slice(0, 100),
    truncatedOffenders: Math.max(0, offenders.length - 100),
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
