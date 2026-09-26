const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");

const secretEnvNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "POKEMON_TCG_API_KEY",
  "RAWG_API_KEY",
  "MOBYGAMES_API_KEY",
];

const publicExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".txt", ".xml"]);
const excludedDirs = new Set([".cache", ".git", "node_modules"]);
const excludedFiles = new Set([".env"]);
const publicBrowserExtensions = new Set([".css", ".html", ".js", ".xml", ".txt"]);
const publicBrowserRoots = new Set(["."]);
const serverOnlyFiles = new Set(["server.js"]);
const allowedNameMentionRoots = new Set(["docs", "scripts", "supabase"]);

function loadEnvValues() {
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
}

function isPlaceholder(value) {
  return !value || /^(replace_with_|your_|example_|test_)/i.test(value);
}

function shouldSkipDir(name) {
  return excludedDirs.has(name);
}

function shouldScanFile(filePath) {
  const name = path.basename(filePath);
  if (excludedFiles.has(name)) return false;
  if (/\.(zip|png|jpe?g|gif|webp|ico|pdf)$/i.test(name)) return false;
  return publicExtensions.has(path.extname(name).toLowerCase());
}

function rootSegment(relativePath) {
  const [first] = relativePath.split(path.sep);
  return first || ".";
}

function isBrowserDelivered(relativePath) {
  const extension = path.extname(relativePath).toLowerCase();
  const segment = rootSegment(relativePath);
  return publicBrowserExtensions.has(extension) && (publicBrowserRoots.has(segment) || segment === "assets");
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (shouldSkipDir(name)) continue;
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, files);
      continue;
    }
    if (shouldScanFile(filePath)) files.push(filePath);
  }
  return files;
}

function main() {
  const env = loadEnvValues();
  const files = walk(rootDir);
  const actualSecretHits = [];
  const publicNameHits = [];

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);
    const text = fs.readFileSync(filePath, "utf8");

    for (const name of secretEnvNames) {
      const value = env[name];
      if (!isPlaceholder(value) && String(value).length >= 12 && text.includes(value)) {
        actualSecretHits.push({ file: relativePath, key: name });
      }
    }

    if (!isBrowserDelivered(relativePath) || serverOnlyFiles.has(relativePath)) continue;
    const root = rootSegment(relativePath);
    if (allowedNameMentionRoots.has(root)) continue;

    for (const name of ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"]) {
      if (text.includes(name)) publicNameHits.push({ file: relativePath, key: name });
    }
  }

  const report = {
    scannedFiles: files.length,
    actualSecretHits,
    publicServerKeyNameHits: publicNameHits,
    ok: actualSecretHits.length === 0 && publicNameHits.length === 0,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
