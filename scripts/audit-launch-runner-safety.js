const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const runnerPath = path.join(rootDir, "scripts", "run-launch-checks.js");
const outputPath = path.join(rootDir, "data", "launch-readiness", "launch-runner-safety.json");

function writeJson(value) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, outputPath);
}

function main() {
  const source = fs.readFileSync(runnerPath, "utf8");
  const requiredScripts = [
    "build-launch-readiness-report.js",
    "audit-launch-readiness-report.js",
    "audit-admin-ui-access.js",
    "audit-image-queue-workflow-ui.js",
    "audit-overview-queue-workflow-ui.js",
    "audit-server-health-contract.js",
    "audit-runtime-links.js",
  ];
  const missingScripts = requiredScripts.filter((scriptName) => !source.includes(scriptName));
  const buildCall = source.match(/runNode\(path\.join\("scripts", "build-launch-readiness-report\.js"\)[\s\S]*?\);/);
  const buildIndex = source.indexOf('"build-launch-readiness-report.js"');
  const launchAuditIndex = source.indexOf('"audit-launch-readiness-report.js"');
  const reportBuildAllowsFailure = Boolean(buildCall && /allowFailure:\s*true/.test(buildCall[0]));
  const auditRunsAfterBuild = buildIndex >= 0 && launchAuditIndex > buildIndex;

  const failures = [];
  if (missingScripts.length) failures.push(`Missing launch runner scripts: ${missingScripts.join(", ")}`);
  if (reportBuildAllowsFailure) failures.push("Launch report build must not allow failure.");
  if (!auditRunsAfterBuild) failures.push("Launch readiness report audit must run after rebuilding the report.");

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedFile: "scripts/run-launch-checks.js",
    requiredScripts,
    missingScripts,
    reportBuildAllowsFailure,
    auditRunsAfterBuild,
    failures,
  };
  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
