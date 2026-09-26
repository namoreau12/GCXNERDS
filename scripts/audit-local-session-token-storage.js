const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const communityDataPath = path.join(rootDir, "data", "community.json");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "local-session-token-storage.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;

async function postJson(pathName, body, headers = {}) {
  const response = await fetch(`${base}${pathName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  return {
    status: response.status,
    source: response.headers.get("x-gcx-data-source") || "",
    body: result,
  };
}

async function getJson(pathName, headers = {}) {
  const response = await fetch(`${base}${pathName}`, {
    headers,
    cache: "no-store",
  });
  const result = await response.json();
  return {
    status: response.status,
    source: response.headers.get("x-gcx-data-source") || "",
    body: result,
  };
}

function restoreCommunityData(snapshot) {
  const tempPath = `${communityDataPath}.session-storage-audit-tmp`;
  fs.writeFileSync(tempPath, snapshot);
  fs.renameSync(tempPath, communityDataPath);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const snapshot = fs.readFileSync(communityDataPath, "utf8");
  const stamp = Date.now();
  const email = `sessionhash+${stamp}@example.com`;
  const password = `SessionHash${stamp}!`;

  try {
    const status = await getJson("/api/status");
    assert(status.status === 200, "Status endpoint should respond.");

    if (status.body?.supabaseAuthEnabled) {
      console.log(
        JSON.stringify(writeReport({
          ok: true,
          skipped: true,
          reason: "Target server has Supabase Auth enabled; local fallback session storage is not active.",
        }), null, 2)
      );
      return;
    }

    const signup = await postJson("/api/auth/signup", {
      email,
      password,
      confirmPassword: password,
      displayName: "Session Hash Audit",
      handle: `session-hash-audit-${stamp}`,
    });
    assert(signup.status === 201, `Signup expected HTTP 201, got ${signup.status}.`);
    const token = signup.body?.token || "";
    assert(token.length >= 32, "Signup should return a browser session token.");

    const data = JSON.parse(fs.readFileSync(communityDataPath, "utf8"));
    const account = (data.accounts || []).find((item) => item.email === email);
    assert(account, "Temporary account should exist during audit.");
    const session = (data.sessions || []).find((item) => item.accountId === account.id);
    assert(session, "Temporary session should exist during audit.");
    assert(session.tokenHash && session.tokenHash.length === 64, "Session should store a SHA-256 token hash.");
    assert(!session.token, "Session should not store the raw bearer token.");
    assert(!JSON.stringify(session).includes(token), "Raw bearer token should not appear in the persisted session object.");

    const authed = await getJson("/api/auth/session", { "X-GCX-Session": token });
    assert(authed.status === 200 && authed.body?.authenticated === true, "Hashed local session should still authenticate.");

    const logout = await postJson("/api/auth/logout", {}, { "X-GCX-Session": token });
    assert(logout.status === 200, `Logout expected HTTP 200, got ${logout.status}.`);

    const afterLogout = await getJson("/api/auth/session", { "X-GCX-Session": token });
    assert(afterLogout.body?.authenticated === false, "Hashed local session should be invalid after logout.");

    console.log(JSON.stringify(writeReport({
      ok: true,
      base,
      source: signup.source,
      rawTokenPersisted: false,
      tokenHashStored: true,
      restoredAfterAudit: true,
    }), null, 2));
  } finally {
    restoreCommunityData(snapshot);
  }
}

function writeReport(report) {
  const fullReport = {
    generatedAt: new Date().toISOString(),
    base,
    ...report,
  };
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(fullReport, null, 2)}\n`);
  return fullReport;
}

main().catch((error) => {
  writeReport({
    ok: false,
    error: error.message || String(error),
  });
  console.error(error.message || error);
  process.exitCode = 1;
});
