const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "provider-dry-run-limits.json");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function parseJsonOutput(text) {
  const start = String(text || "").indexOf("{");
  if (start < 0) return null;
  try {
    return JSON.parse(String(text).slice(start));
  } catch {
    return null;
  }
}

function runAudit(scriptName) {
  const result = spawnSync(
    process.execPath,
    [path.join("scripts", scriptName), "--dry-run", "--limit-platforms=1", "--limit-per-platform=10"],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        GCX_PROVIDER_DRY_RUN_AUDIT: "true",
        MOBYGAMES_API_KEY: "audit-only-placeholder",
        RAWG_API_KEY: "audit-only-placeholder",
      },
    }
  );
  const report = parseJsonOutput(`${result.stdout}\n${result.stderr}`);
  return {
    scriptName,
    exitCode: result.status,
    report,
  };
}

function checkResult(result, provider, failures) {
  const report = result.report || {};
  if (result.exitCode !== 0) failures.push(`${result.scriptName} exited with ${result.exitCode}.`);
  if (!report.auditOnly) failures.push(`${result.scriptName} did not use audit-only mode.`);
  if (report.provider !== provider) failures.push(`${result.scriptName} reported unexpected provider ${report.provider || "(blank)"}.`);
  if (!report.dryRun) failures.push(`${result.scriptName} did not preserve --dry-run.`);
  if (Number(report.limitPlatforms || 0) !== 1) failures.push(`${result.scriptName} did not preserve --limit-platforms=1.`);
  if (Number(report.limitPerPlatform || 0) !== 10) failures.push(`${result.scriptName} did not preserve --limit-per-platform=10.`);
  if (!Array.isArray(report.platforms) || report.platforms.length !== 1) {
    failures.push(`${result.scriptName} did not reduce the planned platform list to exactly one platform.`);
  }
  if (!Array.isArray(report.plannedArgs) || !report.plannedArgs.includes("--dry-run") || !report.plannedArgs.includes("--sample")) {
    failures.push(`${result.scriptName} planned args did not include safe dry-run/sample flags.`);
  }
  if (provider === "RAWG" && !report.plannedArgs?.includes("--images-only")) {
    failures.push(`${result.scriptName} planned args did not preserve RAWG images-only mode.`);
  }
  if (!report.plannedArgs?.includes("--limit=10")) {
    failures.push(`${result.scriptName} planned args did not translate --limit-per-platform=10 to provider --limit=10.`);
  }
}

function main() {
  const checks = [
    runAudit("run-priority-mobygames-image-enrichment.js"),
    runAudit("run-priority-image-enrichment.js"),
  ];
  const failures = [];
  checkResult(checks[0], "MobyGames", failures);
  checkResult(checks[1], "RAWG", failures);

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checks,
    failures,
    nextStep: failures.length
      ? "Fix provider runner argument planning before running bulk image enrichment."
      : "Provider dry-run commands are constrained to one platform and ten rows per platform before any real API call.",
  };

  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
