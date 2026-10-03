const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const requiredFiles = [
  "server.js",
  "api/index.mjs",
  "vercel.json",
  "package.json",
  "index.html",
  "styles.css",
  "site.js",
  "data/newsroom.json",
  "data/community.json",
];

const forbiddenCommittedFiles = [".env"];
const requiredEnvNames = [
  "GCX_SITE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_AUTH_ENABLED",
  "GCX_ADMIN_EMAILS",
  "POKEMON_TCG_API_KEY",
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8"));
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function walkFiles(dir, ignores = []) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
    if (ignores.some((pattern) => relativePath === pattern || relativePath.startsWith(`${pattern}/`))) continue;
    if (item.isDirectory()) {
      results.push(...walkFiles(fullPath, ignores));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function bytesToMb(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(2));
}

const failures = [];
const warnings = [];

for (const file of requiredFiles) {
  if (!fileExists(file)) failures.push(`Missing required deployment file: ${file}`);
}

for (const file of forbiddenCommittedFiles) {
  if (fileExists(file)) warnings.push(`${file} exists locally. It is ignored, but do not commit or upload it manually.`);
}

const packageJson = readJson("package.json");
if (!packageJson.scripts?.start) failures.push("package.json is missing scripts.start.");
if (!packageJson.scripts?.build) failures.push("package.json is missing scripts.build.");

const vercelJson = readJson("vercel.json");
if (!Array.isArray(vercelJson.rewrites) || !vercelJson.rewrites.some((rewrite) => rewrite.destination === "/api/index")) {
  failures.push("vercel.json must rewrite requests to /api/index.");
}

const envExample = fs.existsSync(path.join(rootDir, ".env.example"))
  ? fs.readFileSync(path.join(rootDir, ".env.example"), "utf8")
  : "";
for (const envName of requiredEnvNames) {
  if (!envExample.includes(`${envName}=`)) warnings.push(`.env.example does not document ${envName}.`);
}

const ignoredForVercel = [
  ".cache",
  "node_modules",
  "internal",
  "data/games",
  "data/pokemon/cards-by-set",
  "data/magic/cards-by-set",
  "data/yugioh/cards-by-set",
];
const deployFiles = walkFiles(rootDir, ignoredForVercel)
  .filter((file) => !file.endsWith(".zip"))
  .filter((file) => !path.basename(file).startsWith(".env"));
const deployBytes = deployFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
if (deployBytes > 250 * 1024 * 1024) {
  warnings.push(`Estimated deployable files are ${bytesToMb(deployBytes)} MB before Vercel bundling. Keep large datasets in Supabase.`);
}

const report = {
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  projectType: "vanilla-node-static-site",
  nextJsDetected: false,
  estimatedDeployableMb: bytesToMb(deployBytes),
  requiredEnvNames,
  failures,
  warnings,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
