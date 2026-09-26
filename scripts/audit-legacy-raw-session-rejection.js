const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const communityDataPath = path.join(rootDir, "data", "community.json");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "legacy-raw-session-rejection.json");
const nodeBinary = process.execPath;
const port = Number(process.env.GCX_AUDIT_PORT || 3051);
const base = `http://localhost:${port}`;

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

function restoreCommunityData(snapshot) {
  const tempPath = `${communityDataPath}.legacy-session-audit-tmp`;
  fs.writeFileSync(tempPath, snapshot);
  fs.renameSync(tempPath, communityDataPath);
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    try {
      const response = await fetch(`${base}/api/status`, { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // Keep waiting until the spawned server is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Timed out waiting for local audit server.");
}

async function getJson(pathName, headers = {}) {
  const response = await fetch(`${base}${pathName}`, { headers, cache: "no-store" });
  const body = await response.json();
  return { status: response.status, body };
}

async function main() {
  const snapshot = fs.readFileSync(communityDataPath, "utf8");
  const data = JSON.parse(snapshot);
  const stamp = Date.now();
  const accountId = `legacy-account-${stamp}`;
  const profileId = `legacy-profile-${stamp}`;
  const legacyToken = `legacy-raw-token-${stamp}`;
  let server = null;

  try {
    data.accounts = Array.isArray(data.accounts) ? data.accounts : [];
    data.profiles = Array.isArray(data.profiles) ? data.profiles : [];
    data.sessions = Array.isArray(data.sessions) ? data.sessions : [];
    data.accounts.unshift({
      id: accountId,
      email: `legacy-session-${stamp}@example.com`,
      passwordHash: "not-used",
      salt: "not-used",
      profileId,
      status: "active",
      createdAt: new Date().toISOString(),
    });
    data.profiles.unshift({
      id: profileId,
      displayName: "Legacy Session Audit",
      handle: `@legacy-session-audit-${stamp}`,
      bio: "Temporary launch-readiness audit profile.",
      avatarUrl: "",
      interests: ["games", "cards"],
      role: "member",
      status: "active",
      joinedAt: new Date().toISOString(),
    });
    data.sessions.unshift({
      id: `legacy-session-${stamp}`,
      accountId,
      token: legacyToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    });
    fs.writeFileSync(communityDataPath, `${JSON.stringify(data, null, 2)}\n`);

    server = childProcess.spawn(nodeBinary, ["server.js"], {
      cwd: rootDir,
      env: {
        ...process.env,
        PORT: String(port),
        SUPABASE_AUTH_ENABLED: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    await waitForServer();
    const legacySession = await getJson("/api/auth/session", { "X-GCX-Session": legacyToken });
    if (legacySession.status !== 200 || legacySession.body?.authenticated !== false) {
      throw new Error(`Legacy raw-token-only session should be rejected, got HTTP ${legacySession.status}.`);
    }

    console.log(JSON.stringify(writeReport({
      ok: true,
      legacyRawTokenRejected: true,
      restoredAfterAudit: true,
    }), null, 2));
  } finally {
    if (server) server.kill();
    restoreCommunityData(snapshot);
  }
}

main().catch((error) => {
  writeReport({
    ok: false,
    error: error.message || String(error),
  });
  console.error(error.message || error);
  process.exitCode = 1;
});
