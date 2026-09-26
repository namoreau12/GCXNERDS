const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "sensitive-api-headers.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;

const requiredSecurityHeaders = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

const forbiddenResponseKeys = [/service/i, /secret/i, /password/i, /token/i, /^key$/i, /email/i, /account/i, /session/i];

const checks = [
  { name: "anonymous auth session", path: "/api/auth/session", expectedStatus: 200 },
  { name: "anonymous staff status", path: "/api/auth/staff-status", expectedStatus: 200 },
  { name: "admin supabase readiness requires staff", path: "/api/admin/supabase-launch-readiness", expectedStatus: 401 },
  { name: "community moderation requires staff", path: "/api/community/moderation", expectedStatus: 401 },
  { name: "sponsor leads require staff", path: "/api/community/sponsor-leads", expectedStatus: 401 },
  {
    name: "bad login response",
    path: "/api/auth/login",
    expectedStatus: 401,
    options: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "missing@example.com", password: "wrong-password" }),
    },
  },
];

function headerValue(headers, name) {
  return headers.get(name) || "";
}

function collectForbiddenPaths(value, pathParts = []) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = [...pathParts, key];
    return [
      ...(forbiddenResponseKeys.some((pattern) => pattern.test(key)) ? [childPath.join(".")] : []),
      ...collectForbiddenPaths(child, childPath),
    ];
  });
}

function parseJsonBody(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function runCheck(check) {
  const response = await fetch(`${base}${check.path}`, check.options || {});
  const headers = response.headers;
  const text = await response.text();
  const body = parseJsonBody(text);
  const forbiddenPaths = collectForbiddenPaths(body);
  const headerFailures = Object.entries(requiredSecurityHeaders)
    .filter(([name, expected]) => headerValue(headers, name) !== expected)
    .map(([name, expected]) => ({ name, expected, actual: headerValue(headers, name) }));
  const contentType = headerValue(headers, "content-type");

  return {
    name: check.name,
    path: check.path,
    status: response.status,
    expectedStatus: check.expectedStatus,
    contentType,
    cacheControl: headerValue(headers, "cache-control"),
    ok:
      response.status === check.expectedStatus &&
      contentType.includes("application/json") &&
      headerFailures.length === 0 &&
      forbiddenPaths.length === 0,
    headerFailures,
    forbiddenPaths,
  };
}

async function main() {
  const results = [];
  for (const check of checks) {
    results.push(await runCheck(check));
  }

  const failures = results.filter((result) => !result.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    ok: failures.length === 0,
    base,
    checks: results,
    failures,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
