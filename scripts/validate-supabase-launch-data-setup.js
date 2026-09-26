const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "supabase-launch-data-setup.json");
const requiredTables = [
  "newsletter_subscriptions",
  "collector_waitlist",
  "news_article_comments",
  "community_posts",
  "community_comments",
  "moderation_reports",
  "sponsor_leads",
  "sponsor_promotions",
  "marketplace_listing_intents",
];

const requiredColumns = {
  newsletter_subscriptions: ["email", "status", "source_page", "referrer", "consent_version", "interest_category", "created_at", "updated_at"],
  collector_waitlist: ["profile_id", "item", "intent", "status", "source_page", "referrer", "consent_version", "created_at", "updated_at"],
  news_article_comments: ["local_id", "story_id", "profile_id", "author", "handle", "body", "status", "reports", "created_at", "updated_at"],
  community_posts: ["local_id", "profile_id", "title", "body", "category", "tags", "link_url", "image_url", "status", "reports", "created_at", "updated_at"],
  community_comments: ["local_id", "local_post_id", "profile_id", "author", "handle", "body", "status", "reports", "created_at", "updated_at"],
  moderation_reports: ["reporter_profile_id", "target_type", "target_id", "reason", "status", "created_at"],
  sponsor_leads: ["local_id", "name", "email", "company", "package_interest", "budget_range", "goal", "source", "ref", "status", "created_at", "updated_at"],
  sponsor_promotions: [
    "local_id",
    "sponsor_name",
    "title",
    "body",
    "image_url",
    "destination_url",
    "placement",
    "package_type",
    "cta_label",
    "priority",
    "status",
    "clicks",
    "starts_at",
    "ends_at",
    "created_at",
    "updated_at",
  ],
  marketplace_listing_intents: ["local_id", "profile_id", "item_title", "item_type", "source_id", "intent", "status", "safety_note", "created_at", "updated_at"],
};

const publicReadTables = ["news_article_comments", "community_posts", "community_comments", "sponsor_promotions"];

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function explainFailure(table, status, text) {
  const payload = safeJsonParse(text);
  const message = payload?.message || text || "No response body returned.";
  const code = payload?.code || "";

  if (status === 404 && code === "PGRST205") {
    return `Table is missing from the REST schema cache. Run supabase/gcx-launch-data-foundation.sql, then refresh/retry. If the table exists, confirm it is exposed to the Data API with the SQL grants in that file.`;
  }

  if (status === 400 && /column|relationship|schema cache/i.test(message)) {
    return `Required columns are missing or not visible for ${table}. Re-run supabase/gcx-launch-data-foundation.sql so the bridge columns and indexes are added.`;
  }

  if (status === 401 || status === 403) {
    return `The server key could not reach ${table}. Check SUPABASE_SERVICE_ROLE_KEY and confirm the SQL grants include service_role access.`;
  }

  return message.slice(0, 220);
}

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) return;
      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    });
}

function writeReport(report) {
  fs.mkdirSync(outputDir, { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.renameSync(tempPath, outputPath);
}

function restUrl(pathname) {
  return `${String(process.env.SUPABASE_URL || "").replace(/\/+$/, "")}/rest/v1/${pathname}`;
}

async function requestTable(table) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeaders = key?.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` };
  const select = (requiredColumns[table] || ["*"]).join(",");
  const response = await fetch(restUrl(`${table}?select=${encodeURIComponent(select)}&limit=0`), {
    headers: {
      apikey: key,
      ...authHeaders,
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  return {
    table,
    requiredColumns: requiredColumns[table] || [],
    ok: response.ok,
    status: response.status,
    detail: response.ok ? "reachable with required columns" : explainFailure(table, response.status, text),
  };
}

async function requestPublicReadTable(table) {
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    return {
      table,
      ok: false,
      status: "skipped",
      detail: "SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY is missing, so public read grants were not checked.",
    };
  }

  const response = await fetch(restUrl(`${table}?select=id&limit=0`), {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  return {
    table,
    ok: response.ok,
    status: response.status,
    detail: response.ok ? "public read endpoint is reachable; RLS still filters rows." : explainFailure(table, response.status, text),
  };
}

async function main() {
  loadEnvFile();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const report = {
      generatedAt: new Date().toISOString(),
      configured: false,
      ready: false,
      serviceRoleTablesReady: false,
      publicReadTablesReady: false,
      message: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
      nextStep: "Add server-only Supabase values to .env, then run this validator again. Do not put the service/secret key in browser code.",
    };
    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }

  const tables = [];
  for (const table of requiredTables) tables.push(await requestTable(table));
  const publicReads = [];
  for (const table of publicReadTables) publicReads.push(await requestPublicReadTable(table));
  const ready = tables.every((table) => table.ok);
  const publicReadReady = publicReads.every((table) => table.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    configured: true,
    ready: ready && publicReadReady,
    serviceRoleTablesReady: ready,
    publicReadTablesReady: publicReadReady,
    tables,
    publicReads,
    nextStep:
      ready && publicReadReady
        ? "Launch data tables are reachable through Supabase REST. Run the website smoke test with Supabase enabled before public traffic."
        : "Open the Supabase SQL Editor, run supabase/gcx-launch-data-foundation.sql, then rerun this validator. If 404s continue after the tables exist, check Data API exposure/grants.",
  };
  writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  if (!ready || !publicReadReady) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
