const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const communityDataPath = path.join(rootDir, "data", "community.json");
const envPath = path.join(rootDir, ".env");

const fixturePatterns = [
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

function isFixtureRecord(item) {
  return fixturePatterns.some((pattern) => pattern.test(JSON.stringify(item || {})));
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

function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseRestUrl(pathname) {
  return `${String(process.env.SUPABASE_URL || "").replace(/\/+$/, "")}/rest/v1/${pathname}`;
}

function postgrestFilterValue(value) {
  return encodeURIComponent(String(value || "")).replace(/%2A/g, "*");
}

function supabaseAuthHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` };
}

async function supabaseRequest(pathname, options = {}) {
  if (!supabaseConfigured()) throw new Error("Supabase is not configured.");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(supabaseRestUrl(pathname), {
    ...options,
    headers: {
      apikey: key,
      ...supabaseAuthHeaders(),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${options.method || "GET"} ${pathname} failed with ${response.status}: ${text.slice(0, 240)}`);
  }
  return text ? JSON.parse(text) : null;
}

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function recordId(item, fallback) {
  return String(item?.id || item?.uuid || item?.slug || item?.nsuid || item?.name || item?.title || fallback);
}

function communityRecordRows(data) {
  const sourcePath = "data/community.json";
  const sourceSlug = slug(sourcePath) || "source";
  return Object.entries(data).flatMap(([key, value]) => {
    if (!Array.isArray(value)) return [];
    const counts = new Map();
    return value.map((item, index) => {
      const baseId = recordId(item, `${sourcePath}:${key}:${index}`);
      const duplicateCount = counts.get(baseId) || 0;
      counts.set(baseId, duplicateCount + 1);
      const duplicateSuffix = duplicateCount ? `--${duplicateCount + 1}` : "";
      return {
        collection: `community_${key}`,
        record_id: `${sourceSlug}--${baseId}${duplicateSuffix}`,
        title: item?.title || item?.displayName || item?.name || item?.email || item?.id || "",
        platform: "",
        category: item?.category || item?.type || "",
        source_path: sourcePath,
        data: item,
        updated_at: new Date().toISOString(),
      };
    });
  });
}

const supabaseFixtureDeletes = [
  ["newsletter_subscriptions", "email", "ilike", "launchcheck*"],
  ["newsletter_subscriptions", "email", "ilike", "supabase-smoke*"],
  ["newsletter_subscriptions", "source_page", "eq", "launch-check"],
  ["newsletter_subscriptions", "referrer", "eq", "scripts/audit-lead-persistence.js"],
  ["collector_waitlist", "item", "ilike", "*Launch check beta item*"],
  ["collector_waitlist", "item", "ilike", "*Supabase smoke beta item*"],
  ["collector_waitlist", "source_page", "eq", "launch-check"],
  ["collector_waitlist", "referrer", "eq", "scripts/audit-lead-persistence.js"],
  ["marketplace_listing_intents", "local_id", "ilike", "*launch-check*"],
  ["marketplace_listing_intents", "local_id", "ilike", "*supabase-smoke*"],
  ["marketplace_listing_intents", "source_id", "ilike", "launch-check*"],
  ["marketplace_listing_intents", "source_id", "ilike", "supabase-smoke*"],
  ["marketplace_listing_intents", "item_title", "ilike", "*Launch check beta item*"],
  ["marketplace_listing_intents", "item_title", "ilike", "*Supabase smoke beta item*"],
  ["sponsor_leads", "email", "ilike", "launchcheck*"],
  ["sponsor_leads", "email", "ilike", "supabase-smoke*"],
  ["sponsor_leads", "company", "ilike", "Launch Check Co*"],
  ["sponsor_leads", "company", "ilike", "Supabase Smoke Co*"],
  ["sponsor_leads", "source", "eq", "launch-check"],
  ["sponsor_leads", "ref", "eq", "scripts/audit-lead-persistence.js"],
];

async function deleteSupabaseFixtureRows() {
  if (!supabaseConfigured()) return { skipped: "not-configured" };
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const results = [];

  for (const [table, column, operator, value] of supabaseFixtureDeletes) {
    const query = `${column}=${operator}.${postgrestFilterValue(value)}`;
    const response = await fetch(supabaseRestUrl(`${table}?${query}`), {
      method: "DELETE",
      headers: {
        apikey: key,
        ...supabaseAuthHeaders(),
        Prefer: "return=minimal",
      },
    });
    const text = await response.text();
    results.push({
      table,
      column,
      operator,
      ok: response.ok,
      status: response.status,
      detail: response.ok ? "fixture delete attempted" : text.slice(0, 180),
    });
  }

  return {
    configured: true,
    ok: results.every((item) => item.ok),
    tables: results,
  };
}

async function syncCleanCommunitySnapshot(data) {
  if (!supabaseConfigured()) return { skipped: "not-configured" };
  const sourcePath = "data/community.json";
  const jsonText = JSON.stringify(data);
  const rows = communityRecordRows(data);

  await supabaseRequest("gcx_data_files?on_conflict=path", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([
      {
        path: sourcePath,
        kind: "json",
        file_size_bytes: Buffer.byteLength(jsonText, "utf8"),
        content: data,
        updated_at: new Date().toISOString(),
      },
    ]),
  });

  await supabaseRequest(`gcx_records?source_path=eq.${encodeURIComponent(sourcePath)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });

  for (let index = 0; index < rows.length; index += 200) {
    await supabaseRequest("gcx_records", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows.slice(index, index + 200)),
    });
  }

  return {
    ok: true,
    dataFile: sourcePath,
    recordRows: rows.length,
  };
}

async function main() {
  loadEnvFile();
  const data = JSON.parse(fs.readFileSync(communityDataPath, "utf8"));
  const before = {};
  const after = {};
  const removed = {};

  for (const [key, value] of Object.entries(data)) {
    if (!Array.isArray(value)) continue;
    before[key] = value.length;
    data[key] = value.filter((item) => !isFixtureRecord(item));
    after[key] = data[key].length;
    if (before[key] !== after[key]) removed[key] = before[key] - after[key];
  }

  const accountIds = new Set((data.accounts || []).map((account) => account.id).filter(Boolean));
  const sessionBefore = (data.sessions || []).length;
  data.sessions = (data.sessions || []).filter((session) => !session.accountId || accountIds.has(session.accountId));
  if (sessionBefore !== data.sessions.length) {
    removed.orphanSessions = sessionBefore - data.sessions.length;
  }

  fs.writeFileSync(communityDataPath, `${JSON.stringify(data, null, 2)}\n`);
  const remoteCleanup = await deleteSupabaseFixtureRows();
  let remoteSnapshotSync = { skipped: "not-configured" };
  if (supabaseConfigured() && remoteCleanup.ok !== false) {
    try {
      remoteSnapshotSync = await syncCleanCommunitySnapshot(data);
    } catch (error) {
      remoteSnapshotSync = { ok: false, error: error.message };
    }
  }
  console.log(
    JSON.stringify(
      {
        ok: remoteCleanup.ok !== false && remoteSnapshotSync.ok !== false,
        removed,
        remoteCleanup,
        remoteSnapshotSync,
        counts: {
          accounts: (data.accounts || []).length,
          sessions: (data.sessions || []).length,
          profiles: (data.profiles || []).length,
        },
      },
      null,
      2
    )
  );
}

main();
