const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const communityDataPath = path.join(rootDir, "data", "community.json");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "supabase-live-persistence.json");
const port = Number(process.env.GCX_SUPABASE_SMOKE_PORT || 3063);
const base = `http://localhost:${port}`;

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
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      })
  );
}

function hasUsableValue(env, key) {
  const value = String(env[key] || "").trim();
  return Boolean(value && !/^(replace_with_|your_|https:\/\/your-)/i.test(value));
}

function supabaseRestUrl(env, pathname) {
  return `${String(env.SUPABASE_URL || "").replace(/\/+$/, "")}/rest/v1/${pathname}`;
}

function supabaseHeaders(env, extra = {}) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    ...(String(key || "").startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }),
    ...extra,
  };
}

function encodePostgrestValue(value) {
  return encodeURIComponent(String(value || ""));
}

function waitForServer(url, timeoutMs = 20000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    function attempt() {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });
      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(attempt, 300);
      });
      request.setTimeout(2000, () => request.destroy());
    }
    attempt();
  });
}

function startServer(env) {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: rootDir,
    env: {
      ...process.env,
      ...env,
      PORT: String(port),
    },
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

async function postJson(pathname, body) {
  const response = await fetch(`${base}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status}: ${result.error || "request failed"}`);
  }
  return {
    status: response.status,
    source: response.headers.get("x-gcx-data-source") || "",
    result,
  };
}

async function supabaseRequest(env, pathname, options = {}) {
  const response = await fetch(supabaseRestUrl(env, pathname), {
    ...options,
    headers: supabaseHeaders(env, options.headers || {}),
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`Supabase ${pathname} returned ${response.status}`);
  }
  return { status: response.status, body };
}

async function countRows(env, table, query) {
  const result = await supabaseRequest(env, `${table}?select=id&${query}`);
  return Array.isArray(result.body) ? result.body.length : 0;
}

async function cleanupSupabaseRows(env, cleanupTargets) {
  const cleaned = [];
  for (const target of cleanupTargets) {
    await supabaseRequest(env, `${target.table}?${target.query}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    cleaned.push(target.table);
  }
  return cleaned;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeReport(value) {
  fs.mkdirSync(outputDir, { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, outputPath);
}

async function main() {
  const env = loadEnvFile();
  assert(hasUsableValue(env, "SUPABASE_URL"), "SUPABASE_URL is missing or placeholder.");
  assert(hasUsableValue(env, "SUPABASE_SERVICE_ROLE_KEY"), "SUPABASE_SERVICE_ROLE_KEY is missing or placeholder.");

  const originalCommunity = fs.readFileSync(communityDataPath, "utf8");
  const stamp = Date.now();
  const email = `supabase-smoke+${stamp}@example.com`;
  const referrer = "scripts/audit-supabase-live-persistence.js";
  const collectorItem = `Supabase smoke beta item ${stamp}`;
  const cleanupTargets = [
    { table: "newsletter_subscriptions", query: `email=eq.${encodePostgrestValue(email)}` },
    { table: "collector_waitlist", query: `item=eq.${encodePostgrestValue(collectorItem)}&referrer=eq.${encodePostgrestValue(referrer)}` },
  ];

  let server = null;
  try {
    server = startServer(env);
    await waitForServer(`${base}/api/status`);

    const newsletter = await postJson("/api/newsletter", {
      email,
      sourcePage: "supabase-smoke",
      referrer,
      consentVersion: "gcx-supabase-smoke-v1",
      interestCategory: "verification",
    });

    const waitlist = await postJson("/api/collector-waitlist", {
      item: collectorItem,
      itemType: "launch-check",
      sourceId: `supabase-smoke-${stamp}`,
      intent: "Marketplace beta verification",
      sourcePage: "supabase-smoke",
      referrer,
      consentVersion: "gcx-marketplace-beta-smoke-v1",
    });

    cleanupTargets.push({
      table: "marketplace_listing_intents",
      query: `local_id=eq.${encodePostgrestValue(waitlist.result?.data?.id || "")}`,
    });

    const sponsor = await postJson("/api/community/sponsor-leads", {
      name: "Supabase Smoke Lead",
      email,
      company: `Supabase Smoke Co ${stamp}`,
      packageInterest: "Launch verification sponsor check",
      budgetRange: "verification",
      goal: "Confirm live Supabase persistence without leaving test records.",
      source: "supabase-smoke",
      ref: referrer,
    });

    cleanupTargets.push({
      table: "sponsor_leads",
      query: `local_id=eq.${encodePostgrestValue(sponsor.result?.data?.id || "")}`,
    });

    const endpoints = [newsletter, waitlist, sponsor].map((item) => ({
      status: item.status,
      source: item.source,
      id: item.result?.data?.id || "",
    }));

    endpoints.forEach((endpoint) => {
      assert(endpoint.source === "local+supabase", `Expected local+supabase source for ${endpoint.id || "endpoint"}, got ${endpoint.source || "blank"}.`);
    });

    const remoteCounts = {
      newsletter: await countRows(env, "newsletter_subscriptions", cleanupTargets[0].query),
      collectorWaitlist: await countRows(env, "collector_waitlist", cleanupTargets[1].query),
      marketplaceIntent: await countRows(env, "marketplace_listing_intents", cleanupTargets[2].query),
      sponsorLead: await countRows(env, "sponsor_leads", cleanupTargets[3].query),
    };
    assert(remoteCounts.newsletter === 1, "Newsletter Supabase row was not found.");
    assert(remoteCounts.collectorWaitlist === 1, "Collector waitlist Supabase row was not found.");
    assert(remoteCounts.marketplaceIntent === 1, "Marketplace intent Supabase row was not found.");
    assert(remoteCounts.sponsorLead === 1, "Sponsor lead Supabase row was not found.");

    const cleanedTables = await cleanupSupabaseRows(env, cleanupTargets);
    const postCleanupCounts = {
      newsletter: await countRows(env, "newsletter_subscriptions", cleanupTargets[0].query),
      collectorWaitlist: await countRows(env, "collector_waitlist", cleanupTargets[1].query),
      marketplaceIntent: await countRows(env, "marketplace_listing_intents", cleanupTargets[2].query),
      sponsorLead: await countRows(env, "sponsor_leads", cleanupTargets[3].query),
    };

    assert(Object.values(postCleanupCounts).every((count) => count === 0), "Supabase smoke rows were not fully cleaned up.");

    const report = {
      ok: true,
      generatedAt: new Date().toISOString(),
      base,
      endpoints,
      remoteCounts,
      postCleanupCounts,
      cleanedTables,
      restoredLocalCommunity: true,
    };
    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await stopServer(server);
    const tempPath = `${communityDataPath}.supabase-smoke-tmp`;
    fs.writeFileSync(tempPath, originalCommunity);
    fs.renameSync(tempPath, communityDataPath);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
