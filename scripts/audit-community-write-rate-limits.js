const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "community-write-rate-limits.json");
const base = process.env.GCX_AUDIT_BASE_URL || "http://localhost:3000";
const testIp = `203.0.113.${Math.floor(Math.random() * 180) + 10}`;

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

async function postJson(pathname, body) {
  const response = await fetch(`${base}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": testIp,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let payload = text;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (error) {
    payload = text.slice(0, 160);
  }
  return {
    status: response.status,
    retryAfter: response.headers.get("retry-after") || "",
    payload,
  };
}

async function exerciseLimit(check) {
  const first = await postJson(check.path, check.body);
  let last = first;
  for (let index = 0; index < check.attempts; index += 1) {
    last = await postJson(check.path, check.body);
    if (last.status === 429) break;
  }
  return {
    ...check,
    firstStatus: first.status,
    finalStatus: last.status,
    retryAfter: last.retryAfter,
    firstError: first.payload?.error || "",
    finalError: last.payload?.error || "",
  };
}

async function main() {
  const checks = [
    {
      id: "community-feed",
      path: "/api/community/feed",
      expectedFirstStatus: 401,
      attempts: 26,
      body: {
        title: "Launch throttle audit",
        body: "This request should be blocked before any content is created.",
      },
    },
    {
      id: "news-comments",
      path: "/api/news/gcx-newsroom-console-sales-average-hardware-price-542/comments",
      expectedFirstStatus: 401,
      attempts: 22,
      body: {
        body: "This request should be blocked before any article comment is created.",
      },
    },
  ];

  const results = [];
  const failures = [];
  for (const check of checks) {
    const result = await exerciseLimit(check);
    results.push(result);
    if (result.firstStatus !== result.expectedFirstStatus) {
      failures.push(`${result.id} expected first status ${result.expectedFirstStatus}, got ${result.firstStatus}.`);
    }
    if (result.finalStatus !== 429) {
      failures.push(`${result.id} did not reach HTTP 429 after ${result.attempts} attempts.`);
    }
    if (!result.retryAfter) {
      failures.push(`${result.id} rate-limit response did not include Retry-After.`);
    }
  }

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    base,
    checkedSurfaces: results.length,
    results,
    failures,
  };

  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
