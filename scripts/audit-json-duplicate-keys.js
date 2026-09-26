const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const scannedRoots = ["data", "docs"];
const rootJsonFiles = ["package.json"];
const ignoredDirs = new Set(["node_modules", ".cache", ".git"]);
const outputPath = path.join(rootDir, "data", "launch-readiness", "json-duplicate-keys.json");

function walk(dirPath) {
  const files = [];
  if (!fs.existsSync(dirPath)) return files;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) files.push(...walk(entryPath));
    if (entry.isFile() && entry.name.endsWith(".json")) files.push(entryPath);
  }

  return files;
}

function collectFiles() {
  const files = rootJsonFiles.map((file) => path.join(rootDir, file)).filter((file) => fs.existsSync(file));
  for (const root of scannedRoots) {
    files.push(...walk(path.join(rootDir, root)));
  }
  return files;
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function parseJsonString(text, index) {
  let value = "";
  let i = index + 1;

  while (i < text.length) {
    const char = text[i];
    if (char === '"') return { value, end: i };
    if (char === "\\") {
      const next = text[i + 1];
      if (next === "u") {
        const hex = text.slice(i + 2, i + 6);
        value += String.fromCharCode(Number.parseInt(hex, 16));
        i += 6;
        continue;
      }
      value += next || "";
      i += 2;
      continue;
    }
    value += char;
    i += 1;
  }

  return { value, end: i };
}

function nextNonWhitespace(text, index) {
  let i = index;
  while (i < text.length && /\s/.test(text[i])) i += 1;
  return { char: text[i], index: i };
}

function markValueConsumed(stack) {
  const parent = stack[stack.length - 1];
  if (!parent) return;
  if (parent.type === "object" && parent.expecting === "value") parent.expecting = "commaOrEnd";
  if (parent.type === "array") parent.expecting = "commaOrEnd";
}

function auditText(text, filePath) {
  const findings = [];
  const stack = [];

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (/\s/.test(char)) continue;

    const current = stack[stack.length - 1];

    if (char === "{") {
      stack.push({ type: "object", keys: new Map(), expecting: "keyOrEnd" });
      continue;
    }

    if (char === "[") {
      stack.push({ type: "array", expecting: "valueOrEnd" });
      continue;
    }

    if (char === "}" || char === "]") {
      stack.pop();
      markValueConsumed(stack);
      continue;
    }

    if (char === "," && current) {
      current.expecting = current.type === "object" ? "keyOrEnd" : "valueOrEnd";
      continue;
    }

    if (char === ":" && current?.type === "object") {
      current.expecting = "value";
      continue;
    }

    if (char === '"') {
      const parsed = parseJsonString(text, i);
      if (current?.type === "object" && current.expecting === "keyOrEnd") {
        const next = nextNonWhitespace(text, parsed.end + 1);
        if (next.char === ":") {
          const firstSeenAt = current.keys.get(parsed.value);
          if (firstSeenAt !== undefined) {
            findings.push({
              file: path.relative(rootDir, filePath),
              key: parsed.value,
              firstLine: lineNumberAt(text, firstSeenAt),
              duplicateLine: lineNumberAt(text, i),
            });
          } else {
            current.keys.set(parsed.value, i);
          }
          current.expecting = "colon";
        }
      } else {
        markValueConsumed(stack);
      }
      i = parsed.end;
      continue;
    }

    if (current?.type === "array" && current.expecting === "valueOrEnd") {
      current.expecting = "commaOrEnd";
      continue;
    }

    if (current?.type === "object" && current.expecting === "value") {
      current.expecting = "commaOrEnd";
    }
  }

  return findings;
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function main() {
  const files = collectFiles();
  const findings = [];
  const parseFailures = [];

  for (const filePath of files) {
    const text = fs.readFileSync(filePath, "utf8");
    try {
      JSON.parse(text);
    } catch (error) {
      parseFailures.push({
        file: path.relative(rootDir, filePath),
        message: error.message,
      });
      continue;
    }
    findings.push(...auditText(text, filePath));
  }

  const result = {
    ok: findings.length === 0 && parseFailures.length === 0,
    generatedAt: new Date().toISOString(),
    scannedFiles: files.length,
    duplicateKeyCount: findings.length,
    parseFailureCount: parseFailures.length,
    findings: findings.slice(0, 100),
    parseFailures: parseFailures.slice(0, 50),
    truncatedFindings: Math.max(0, findings.length - 100),
  };

  writeJsonAtomic(outputPath, result);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main();
