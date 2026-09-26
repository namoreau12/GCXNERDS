const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "public-api-error-hygiene.json");
const serverPath = path.join(rootDir, "server.js");

const forbiddenPatterns = [
  {
    code: "raw-error-message-detail",
    pattern: /\bdetail\s*:\s*error\.message\b/g,
    detail: "Public JSON error responses must not expose raw error.message values in detail fields.",
  },
  {
    code: "raw-error-stack",
    pattern: /\b(?:error|err)\.stack\b/g,
    detail: "Public server code must not serialize stack traces.",
  },
];

function lineAndColumnForIndex(text, index) {
  const before = text.slice(0, index);
  const lines = before.split(/\r?\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function main() {
  const source = fs.readFileSync(serverPath, "utf8");
  const failures = [];

  forbiddenPatterns.forEach((check) => {
    for (const match of source.matchAll(check.pattern)) {
      failures.push({
        code: check.code,
        file: "server.js",
        ...lineAndColumnForIndex(source, match.index),
        detail: check.detail,
        snippet: source.slice(Math.max(0, match.index - 80), Math.min(source.length, match.index + 120)).replace(/\s+/g, " ").trim(),
      });
    }
  });

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedFiles: ["server.js"],
    checkedPatterns: forbiddenPatterns.map(({ code }) => code),
    failures,
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
