const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const communityDataPath = path.join(rootDir, "data", "community.json");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "community-test-fixtures.json");

const leakedFixturePatterns = [
  /launchauthcheck/i,
  /launch auth check/i,
  /launch-auth-check/i,
  /launchcheck/i,
  /launch check/i,
  /launch-admin-verify/i,
  /supabase-smoke/i,
  /supabase smoke/i,
  /supabase-smoke-/i,
  /sessionsafety/i,
  /session safety check/i,
  /session-safety-check/i,
  /staffmodcheck/i,
  /staff moderation check/i,
  /staff-mod-check/i,
];

function main() {
  const text = fs.readFileSync(communityDataPath, "utf8");
  const data = JSON.parse(text);
  const matches = leakedFixturePatterns.filter((pattern) => pattern.test(text)).map((pattern) => String(pattern));
  const orphanSessions = (data.sessions || []).filter((session) => !new Set((data.accounts || []).map((account) => account.id)).has(session.accountId));

  const ok = matches.length === 0 && orphanSessions.length === 0;
  const report = {
    ok,
    generatedAt: new Date().toISOString(),
    leakedFixtureMatches: matches,
    orphanSessions: orphanSessions.map((session) => session.id),
    counts: {
      accounts: (data.accounts || []).length,
      sessions: (data.sessions || []).length,
      profiles: (data.profiles || []).length,
    },
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));

  if (!ok) process.exitCode = 1;
}

main();
