const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "public-profile-privacy.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;

const forbiddenKeys = new Set([
  "role",
  "email",
  "password",
  "passwordHash",
  "passwordSalt",
  "token",
  "tokenHash",
  "refreshToken",
  "access_token",
  "refresh_token",
  "account",
  "accountId",
  "user",
  "userId",
  "raw_user_meta_data",
  "raw_app_meta_data",
  "app_metadata",
]);

function writeJson(report) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function findForbidden(value, trail = "$", findings = []) {
  if (!value || typeof value !== "object") return findings;
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbidden(item, `${trail}[${index}]`, findings));
    return findings;
  }
  Object.entries(value).forEach(([key, nested]) => {
    const currentTrail = `${trail}.${key}`;
    if (forbiddenKeys.has(key)) findings.push({ path: currentTrail, key });
    findForbidden(nested, currentTrail, findings);
  });
  return findings;
}

async function getJson(pathname) {
  const response = await fetch(`${base}${pathname}`);
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

async function main() {
  const profileList = await getJson("/api/community/profiles");
  const feed = await getJson("/api/community/feed");
  const discovery = await getJson("/api/community/discovery");
  const firstProfile = Array.isArray(profileList.body?.data) ? profileList.body.data[0] : null;
  const profileDetail = firstProfile?.id ? await getJson(`/api/community/profiles/${encodeURIComponent(firstProfile.id)}`) : null;
  const checks = [
    {
      name: "profile list",
      path: "/api/community/profiles",
      status: profileList.status,
      forbidden: findForbidden(profileList.body),
    },
    {
      name: "community feed",
      path: "/api/community/feed",
      status: feed.status,
      forbidden: findForbidden(feed.body),
    },
    {
      name: "community discovery",
      path: "/api/community/discovery",
      status: discovery.status,
      forbidden: findForbidden(discovery.body),
    },
  ];
  if (profileDetail) {
    checks.push({
      name: "profile detail",
      path: `/api/community/profiles/${firstProfile.id}`,
      status: profileDetail.status,
      forbidden: findForbidden(profileDetail.body),
    });
  }

  const failures = checks.flatMap((check) => [
    ...(check.status === 200 ? [] : [{ code: "unexpected-status", check: check.name, path: check.path, status: check.status }]),
    ...check.forbidden.map((finding) => ({ code: "public-profile-sensitive-key", check: check.name, path: check.path, ...finding })),
  ]);
  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    base,
    checks,
    failures,
  };

  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  const report = {
    ok: false,
    generatedAt: new Date().toISOString(),
    base,
    checks: [],
    failures: [{ code: "audit-crash", detail: error.message || String(error) }],
  };
  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
