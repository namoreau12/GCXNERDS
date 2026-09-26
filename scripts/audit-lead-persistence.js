const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const communityDataPath = path.join(rootDir, "data", "community.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;

function readCommunityData() {
  return JSON.parse(fs.readFileSync(communityDataPath, "utf8"));
}

function writeCommunityData(text) {
  const tempPath = `${communityDataPath}.audit-tmp`;
  fs.writeFileSync(tempPath, text);
  fs.renameSync(tempPath, communityDataPath);
}

function removeAuditFixtures() {
  try {
    execFileSync(process.execPath, [path.join(__dirname, "clean-community-test-fixtures.js")], {
      cwd: rootDir,
      env: process.env,
      stdio: "ignore",
    });
  } catch {
    // The primary assertion is local persistence. Fixture cleanup has its own audit.
  }
}

async function postJson(pathName, body) {
  const response = await fetch(`${base}${pathName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`${pathName} returned ${response.status}: ${result.error || "request failed"}`);
  }
  return {
    status: response.status,
    source: response.headers.get("x-gcx-data-source") || "",
    result,
  };
}

function assertRecord(data, collection, predicate, label) {
  const records = Array.isArray(data[collection]) ? data[collection] : [];
  if (!records.some(predicate)) {
    throw new Error(`${label} was not persisted to data/community.json`);
  }
}

async function main() {
  const originalText = fs.readFileSync(communityDataPath, "utf8");
  const stamp = Date.now();
  const checkEmail = `launchcheck+${stamp}@example.com`;
  const summary = [];

  try {
    summary.push(
      await postJson("/api/newsletter", {
        email: checkEmail,
        sourcePage: "launch-check",
        referrer: "scripts/audit-lead-persistence.js",
        consentVersion: "gcx-launch-check-v1",
        interestCategory: "verification",
      })
    );

    summary.push(
      await postJson("/api/collector-waitlist", {
        item: `Launch check beta item ${stamp}`,
        itemType: "launch-check",
        sourceId: `launch-check-${stamp}`,
        intent: "Marketplace beta verification",
        sourcePage: "launch-check",
        referrer: "scripts/audit-lead-persistence.js",
        consentVersion: "gcx-marketplace-beta-check-v1",
      })
    );

    summary.push(
      await postJson("/api/community/sponsor-leads", {
        name: "Launch Check Lead",
        email: checkEmail,
        company: `Launch Check Co ${stamp}`,
        packageInterest: "Launch verification sponsor check",
        budgetRange: "verification",
        goal: "Confirm sponsor lead persistence without leaving test records.",
        source: "launch-check",
        ref: "scripts/audit-lead-persistence.js",
      })
    );

    const data = readCommunityData();
    assertRecord(data, "newsletterSubscriptions", (item) => item.email === checkEmail, "Newsletter subscription");
    assertRecord(data, "collectorWaitlist", (item) => item.sourceId === `launch-check-${stamp}`, "Collector waitlist item");
    assertRecord(data, "sponsorLeads", (item) => item.email === checkEmail && item.company === `Launch Check Co ${stamp}`, "Sponsor lead");

    console.log(
      JSON.stringify(
        {
          base,
          ok: true,
          endpoints: summary.map((item) => ({
            status: item.status,
            source: item.source,
            id: item.result?.data?.id || "",
          })),
          restoredAfterAudit: true,
        },
        null,
        2
      )
    );
  } finally {
    writeCommunityData(originalText);
    removeAuditFixtures();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
