const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const communityDataPath = path.join(rootDir, "data", "community.json");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "staff-moderation-actions.json");
const port = Number(process.env.GCX_STAFF_AUDIT_PORT || 3062);
const base = `http://localhost:${port}`;
const token = `staffmodcheck-token-${Date.now()}`;
const staffProfileId = "profile-staff-mod-check";
const staffAccountId = "account-staff-mod-check";
const postId = "post-staff-mod-check";
const reportId = "moderation-report-staff-mod-check";
const sponsorLeadId = "sponsor-staff-mod-check";

function readSnapshot() {
  return fs.existsSync(communityDataPath) ? fs.readFileSync(communityDataPath, "utf8") : "{}";
}

function restoreSnapshot(snapshot) {
  const tempPath = `${communityDataPath}.staff-audit-tmp`;
  fs.writeFileSync(tempPath, snapshot);
  fs.renameSync(tempPath, communityDataPath);
}

function sessionTokenHash(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function injectStaffFixture(snapshot) {
  const data = JSON.parse(snapshot);
  data.accounts = Array.isArray(data.accounts) ? data.accounts : [];
  data.sessions = Array.isArray(data.sessions) ? data.sessions : [];
  data.profiles = Array.isArray(data.profiles) ? data.profiles : [];
  data.posts = Array.isArray(data.posts) ? data.posts : [];
  data.moderationReports = Array.isArray(data.moderationReports) ? data.moderationReports : [];
  data.sponsorLeads = Array.isArray(data.sponsorLeads) ? data.sponsorLeads : [];

  const now = new Date().toISOString();
  data.accounts.push({
    id: staffAccountId,
    email: "staffmodcheck@example.com",
    status: "active",
    createdAt: now,
    profileId: staffProfileId,
    passwordHash: "fixture-only",
    passwordSalt: "fixture-only",
  });
  data.sessions.push({
    id: "session-staff-mod-check",
    accountId: staffAccountId,
    tokenHash: sessionTokenHash(token),
    createdAt: now,
    expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
  });
  data.profiles.push({
    id: staffProfileId,
    displayName: "Staff Moderation Check",
    handle: "@staff-mod-check",
    status: "active",
    role: "admin",
    joinedAt: now,
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
    interests: ["moderation"],
  });
  data.posts.push({
    id: postId,
    title: "Staff moderation check post",
    body: "Temporary audit fixture for staff moderation action verification.",
    author: "Staff Mod Check",
    handle: "@staff-mod-check",
    profileId: staffProfileId,
    category: "Audit",
    status: "needs_review",
    reports: 3,
    createdAt: now,
    lastReportedAt: now,
  });
  data.moderationReports.push({
    id: reportId,
    targetType: "community_post",
    targetId: postId,
    reporterProfileId: staffProfileId,
    reason: "Staff moderation check report",
    status: "open",
    createdAt: now,
  });
  data.sponsorLeads.push({
    id: sponsorLeadId,
    name: "Staff Sponsor Check",
    email: "sponsorcheck@example.com",
    company: "GCX Audit Sponsor",
    packageInterest: "Launch sponsor check",
    budgetRange: "Internal audit",
    goal: "Temporary audit fixture for sponsor lead review.",
    source: "staff-audit",
    ref: "launch-readiness",
    status: "new",
    createdAt: now,
    updatedAt: now,
    statusHistory: [],
  });

  fs.writeFileSync(communityDataPath, `${JSON.stringify(data, null, 2)}\n`);
}

function launchEnv() {
  return {
    ...process.env,
    PORT: String(port),
    SUPABASE_AUTH_ENABLED: "false",
    SUPABASE_URL: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
  };
}

function startServer() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: rootDir,
    env: launchEnv(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

function stopServer(child) {
  return new Promise((resolve) => {
    if (!child || child.killed) {
      resolve();
      return;
    }
    child.once("exit", () => resolve());
    child.kill("SIGINT");
    setTimeout(() => {
      if (!child.killed) child.kill("SIGTERM");
      resolve();
    }, 3000).unref();
  });
}

function waitForServer(timeoutMs = 20000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    function attempt() {
      const request = http.get(`${base}/api/status`, (response) => {
        response.resume();
        resolve();
      });
      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${base}`));
          return;
        }
        setTimeout(attempt, 250);
      });
      request.setTimeout(2000, () => request.destroy());
    }
    attempt();
  });
}

async function request(pathName, options = {}) {
  const response = await fetch(`${base}${pathName}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      "X-GCX-Session": token,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeAuditResult(result) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
}

async function main() {
  const snapshot = readSnapshot();
  let server = null;

  try {
    injectStaffFixture(snapshot);
    server = startServer();
    await waitForServer();

    const queue = await request("/api/community/moderation");
    assert(queue.status === 200, `Expected staff moderation queue HTTP 200, got ${queue.status}.`);
    assert(queue.body?.data?.summary?.reportedPosts >= 1, "Expected at least one reported post in staff queue.");
    assert(queue.body?.data?.posts?.some((post) => post.id === postId), "Expected staff fixture post in moderation queue.");
    assert(queue.body?.data?.summary?.staffProfile?.id === staffProfileId, "Expected staff profile in moderation summary.");

    const sponsorLeads = await request("/api/community/sponsor-leads");
    assert(sponsorLeads.status === 200, `Expected staff sponsor lead queue HTTP 200, got ${sponsorLeads.status}.`);
    assert(sponsorLeads.body?.data?.some((lead) => lead.id === sponsorLeadId), "Expected staff fixture sponsor lead in sponsor lead queue.");

    const sponsorUpdate = await request(`/api/community/sponsor-leads/${sponsorLeadId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "contacted",
        note: "Staff moderation check contacted this audit fixture.",
      }),
    });
    assert(sponsorUpdate.status === 200, `Expected staff sponsor lead update HTTP 200, got ${sponsorUpdate.status}.`);
    assert(sponsorUpdate.body?.data?.status === "contacted", "Expected sponsor lead to move to contacted.");

    const update = await request("/api/community/moderation/status", {
      method: "POST",
      body: JSON.stringify({
        type: "post",
        id: postId,
        status: "hidden",
        note: "Staff moderation check resolved this audit fixture.",
      }),
    });
    assert(update.status === 200, `Expected staff moderation update HTTP 200, got ${update.status}.`);
    assert(update.body?.data?.status === "hidden", "Expected moderated post to be hidden.");
    assert(update.body?.data?.reviewedBy === staffProfileId, "Expected moderation update to record reviewer.");

    const community = JSON.parse(fs.readFileSync(communityDataPath, "utf8"));
    const report = (community.moderationReports || []).find((item) => item.id === reportId);
    assert(report?.status === "resolved", "Expected open report to be resolved after hiding post.");
    assert(report?.reviewedBy === staffProfileId, "Expected moderation report to record reviewer.");

    const result = {
      generatedAt: new Date().toISOString(),
      ok: true,
      base,
      queueStatus: queue.status,
      updateStatus: update.status,
      sponsorLeadStatus: sponsorLeads.status,
      sponsorLeadUpdateStatus: sponsorUpdate.status,
      reportedPosts: queue.body?.data?.summary?.reportedPosts || 0,
      reviewerRecorded: update.body?.data?.reviewedBy === staffProfileId,
      sponsorLeadReviewed: sponsorUpdate.body?.data?.status === "contacted",
      reportResolved: true,
      restoredAfterAudit: true,
    };
    writeAuditResult(result);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await stopServer(server);
    restoreSnapshot(snapshot);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
