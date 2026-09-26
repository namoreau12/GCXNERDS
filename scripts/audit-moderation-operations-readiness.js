const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "moderation-operations-readiness.json");

const checks = [
  {
    file: "docs/moderation-operations-readiness.md",
    required: [
      "Staff-only moderation pages",
      "Anonymous visitors must not access moderation queues",
      "Signed-in non-staff members must not access moderation queues",
      "Moderator or admin access",
      "reviewer identity and timestamp",
      "Reported posts",
      "Reported comments",
      "Pending streamer nominations",
      "Sponsor leads",
      "Marketplace beta signals",
      "empty states",
      "approve or hide posts",
      "approve or hide comments",
      "approve or reject streamer nominations",
      "Review notes",
      "Linked moderation reports",
      "status, reviewer, note, and reviewed timestamp",
      "restore local data",
      "Off-platform deal pushing",
      "Suspected counterfeits",
      "listing photos",
      "Repeat-offender",
      "sensitive moderation APIs are `no-store`",
    ],
  },
  {
    file: "community-admin.html",
    required: ["noindex", "Staff-only tools", "reported posts", "comments", "streamer nominations", "sponsor leads", "moderation readiness checklist"],
  },
  {
    file: "community-admin.js",
    required: [
      "Staff sign-in required",
      "Moderator access required",
      "Review note",
      "/api/community/moderation",
      "/api/community/moderation/status",
      "/api/community/sponsor-leads",
      "renderSponsorLeads",
      "moderation-sponsor-leads",
      "data-review-note",
      "data-sponsor-note",
      "setCloseoutFormEnabled(false)",
    ],
  },
  {
    file: "scripts/audit-staff-moderation-actions.js",
    required: [
      "Expected staff moderation queue HTTP 200",
      "Expected moderated post to be hidden",
      "Expected open report to be resolved",
      "Expected moderation report to record reviewer",
      "Expected staff sponsor lead queue HTTP 200",
      "Expected sponsor lead to move to contacted",
      "restoreSnapshot",
    ],
  },
  {
    file: "scripts/audit-admin-ui-access.js",
    required: ["community-admin.html", "sign in", "hidesStaffActions", "disabledControls", "overflow", "consoleErrors", "admin-ui-access.json"],
  },
];

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").toLowerCase();
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function main() {
  const failures = [];
  const checkedFiles = [];

  for (const check of checks) {
    const filePath = path.join(rootDir, check.file);
    if (!fs.existsSync(filePath)) {
      failures.push({ file: check.file, issue: "Missing file" });
      continue;
    }
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = normalize(text);
    const missing = check.required.filter((phrase) => !normalized.includes(normalize(phrase)));
    missing.forEach((phrase) => failures.push({ file: check.file, issue: `Missing required phrase: ${phrase}` }));
    checkedFiles.push({ file: check.file, required: check.required.length, missing: missing.length });
  }

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedFiles,
    failures,
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
