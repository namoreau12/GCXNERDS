const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "server-health-contract.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;

const forbiddenKeys = [/service/i, /secret/i, /password/i, /token/i, /key$/i, /email/i, /account/i, /session/i];

function collectForbiddenPaths(value, pathParts = []) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = [...pathParts, key];
    return [
      ...(forbiddenKeys.some((pattern) => pattern.test(key)) ? [childPath.join(".")] : []),
      ...collectForbiddenPaths(child, childPath),
    ];
  });
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasHeader(response, headerName, expectedValue = "") {
  const value = response.headers.get(headerName);
  if (!expectedValue) return Boolean(value);
  return String(value || "").toLowerCase().includes(expectedValue.toLowerCase());
}

async function main() {
  const response = await fetch(`${base}/api/health`, { headers: { Accept: "application/json" } });
  const health = await response.json();
  const forbiddenPaths = collectForbiddenPaths(health);

  assert(response.status === 200, `/api/health returned ${response.status}`);
  assert(health.ok === true, "/api/health did not report ok=true");
  assert(["ready", "ready-with-warnings"].includes(health.status), "/api/health status is not launch-ready");
  assert(health.launchReady === true, "/api/health launchReady should be true when no blockers exist");
  assert(Number(health.launchReport?.blockers || 0) === 0, "/api/health should report zero launch blockers");
  assert(Array.isArray(health.launchReport?.warningLabels), "/api/health warning labels are missing");
  assert(Number(health.dataFreshness?.staleFiles || 0) === 0, "/api/health reports stale Supabase snapshot files");
  assert(health.dataFreshness?.ok === true, "/api/health data freshness summary is not ok");
  assert(health.runtimeLinks?.ok === true, "/api/health runtime link summary is not ok");
  assert(Number(health.runtimeLinks?.brokenLinks || 0) === 0, "/api/health reports broken runtime links");
  assert(Number(health.runtimeLinks?.consoleErrors || 0) === 0, "/api/health reports runtime console errors");
  assert(hasHeader(response, "cache-control", "no-store"), "/api/health must be no-store");
  assert(hasHeader(response, "x-content-type-options", "nosniff"), "/api/health is missing security headers");
  assert(hasHeader(response, "x-gcx-health", "ok"), "/api/health is missing the ok health header");
  assert(forbiddenPaths.length === 0, `/api/health exposes sensitive-looking fields: ${forbiddenPaths.join(", ")}`);

  const report = {
    generatedAt: new Date().toISOString(),
    ok: true,
    base,
    status: health.status,
    warnings: Number(health.launchReport?.warnings || 0),
    staleFiles: Number(health.dataFreshness?.staleFiles || 0),
    checkedLinks: Number(health.runtimeLinks?.checkedLinks || 0),
    headerChecks: {
      cacheControlNoStore: true,
      contentTypeOptions: true,
      healthHeader: true,
    },
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  const report = {
    generatedAt: new Date().toISOString(),
    ok: false,
    base,
    error: error.message || String(error),
  };
  writeJsonAtomic(outputPath, report);
  console.error(error.message || error);
  process.exit(1);
});
