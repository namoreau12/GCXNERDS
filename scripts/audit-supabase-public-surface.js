const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "supabase-public-surface.json");
const envPath = path.join(rootDir, ".env");

const serverOnlyTables = [
  "profiles",
  "newsletter_subscriptions",
  "collector_waitlist",
  "sponsor_leads",
  "moderation_reports",
  "marketplace_listing_intents",
];

const publicReadTables = [
  "news_article_comments",
  "community_posts",
  "community_comments",
  "sponsor_promotions",
];

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
}

function hasUsableValue(env, key) {
  const value = String(env[key] || "").trim();
  return Boolean(value && !/^(replace_with_|your_|https:\/\/your-)/i.test(value));
}

function supabaseUrl(env, pathname) {
  return `${String(env.SUPABASE_URL || "").replace(/\/+$/, "")}/rest/v1/${pathname}`;
}

async function checkTable(env, table, shouldBePublic) {
  const key = env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  const response = await fetch(supabaseUrl(env, `${table}?select=*&limit=1`), {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  await response.text();
  return {
    table,
    expected: shouldBePublic ? "public-read-filtered-by-rls" : "server-only",
    status: response.status,
    ok: shouldBePublic ? response.status < 500 : [401, 403, 404].includes(response.status),
  };
}

function writeJson(report) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  const env = loadEnvFile();
  const configured =
    hasUsableValue(env, "SUPABASE_URL") &&
    (hasUsableValue(env, "SUPABASE_ANON_KEY") || hasUsableValue(env, "SUPABASE_PUBLISHABLE_KEY"));

  if (!configured) {
    const report = {
      ok: false,
      configured: false,
      generatedAt: new Date().toISOString(),
      checks: [],
      failures: [{ code: "missing-supabase-public-env", detail: "SUPABASE_URL and public key are required." }],
    };
    writeJson(report);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }

  const checks = [];
  for (const table of serverOnlyTables) checks.push(await checkTable(env, table, false));
  for (const table of publicReadTables) checks.push(await checkTable(env, table, true));
  const failures = checks.filter((check) => !check.ok).map((check) => ({ code: "unexpected-public-supabase-surface", ...check }));
  const report = {
    ok: failures.length === 0,
    configured,
    generatedAt: new Date().toISOString(),
    checks,
    failures,
    nextStep: failures.length
      ? "Run supabase/gcx-launch-hardening.sql in Supabase SQL Editor, then rerun this audit."
      : "Supabase public API surface matches GCX launch expectations.",
  };
  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  const report = {
    ok: false,
    configured: false,
    generatedAt: new Date().toISOString(),
    checks: [],
    failures: [{ code: "audit-crash", detail: error.message || String(error) }],
  };
  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
