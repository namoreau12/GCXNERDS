const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "node-package-hygiene.json");

function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
  } catch {
    return "";
  }
}

function writeJson(value) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, outputPath);
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function main() {
  const packageJson = JSON.parse(readText("package.json") || "{}");
  const renderYaml = readText("render.yaml");
  const dockerfile = readText("Dockerfile");
  const lockfiles = ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml"].filter(fileExists);
  const dependencyCount =
    Object.keys(packageJson.dependencies || {}).length +
    Object.keys(packageJson.devDependencies || {}).length +
    Object.keys(packageJson.optionalDependencies || {}).length;
  const usesNpmInstall = /npm\s+install\s+--omit=dev/.test(renderYaml) && /npm\s+install\s+--omit=dev/.test(dockerfile);
  const usesNpmCi = /npm\s+ci\b/.test(renderYaml) && /npm\s+ci\b/.test(dockerfile);

  const failures = [];
  const warnings = [];

  if (packageJson.private !== true) failures.push("package.json should remain private for the GCX app.");
  if (!/^>=20\b/.test(String(packageJson.engines?.node || ""))) failures.push("package.json should require Node >=20.");
  if (packageJson.scripts?.start !== "node server.js") failures.push("package.json start script should be node server.js.");

  if (dependencyCount > 0 && lockfiles.length === 0) {
    failures.push("Runtime dependencies require a committed lockfile.");
  }
  if (dependencyCount > 0 && !usesNpmCi) {
    failures.push("Runtime dependencies should use npm ci in Render and Docker builds.");
  }
  if (dependencyCount === 0 && lockfiles.length === 0 && usesNpmInstall) {
    warnings.push("No lockfile is present because the app currently has no package dependencies; add a lockfile and switch to npm ci before adding dependencies.");
  }

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    dependencyCount,
    lockfiles,
    usesNpmInstall,
    usesNpmCi,
    failures,
    warnings,
  };
  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
