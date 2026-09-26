const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");

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

function supabaseUrl(env) {
  return String(env.SUPABASE_URL || "").replace(/\/+$/, "");
}

function publicKey(env) {
  return String(env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || "").trim();
}

function hasPublicKey(env) {
  return hasUsableValue(env, "SUPABASE_ANON_KEY") || hasUsableValue(env, "SUPABASE_PUBLISHABLE_KEY");
}

async function checkUrl(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      body: text,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const env = loadEnvFile();
  const url = supabaseUrl(env);
  const publicKeyReady = hasPublicKey(env);
  const anonKey = publicKeyReady ? publicKey(env) : "";
  const serviceKey = String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const authEnabled = String(env.SUPABASE_AUTH_ENABLED || "").toLowerCase() === "true";
  const rows = [];

  rows.push({ check: "SUPABASE_URL", status: hasUsableValue(env, "SUPABASE_URL") ? "present" : "missing", detail: "" });
  rows.push({ check: "SUPABASE_SERVICE_ROLE_KEY", status: hasUsableValue(env, "SUPABASE_SERVICE_ROLE_KEY") ? "present" : "missing", detail: "" });
  rows.push({ check: "SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY", status: publicKeyReady ? "present" : "missing", detail: "" });
  rows.push({ check: "SUPABASE_AUTH_ENABLED", status: authEnabled ? "enabled" : "disabled", detail: "Set to true only after SQL and keys are ready." });

  if (url && anonKey) {
    try {
      const result = await checkUrl(`${url}/auth/v1/settings`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });
      rows.push({
        check: "Supabase Auth settings endpoint",
        status: result.ok ? "reachable" : "attention",
        detail: result.ok ? "Auth API accepted the public key." : `Returned ${result.status}.`,
      });
    } catch (error) {
      rows.push({ check: "Supabase Auth settings endpoint", status: "error", detail: error.message });
    }
  }

  if (url && serviceKey) {
    try {
      const authHeaders = serviceKey.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${serviceKey}` };
      const result = await checkUrl(`${url}/rest/v1/profiles?select=id&limit=1`, {
        headers: {
          apikey: serviceKey,
          ...authHeaders,
        },
      });
      rows.push({
        check: "public.profiles REST table",
        status: result.ok ? "ready" : "missing-or-blocked",
        detail: result.ok ? "Profiles table is reachable through the server key." : `Returned ${result.status}. Run supabase/gcx-auth-foundation.sql if needed.`,
      });
    } catch (error) {
      rows.push({ check: "public.profiles REST table", status: "error", detail: error.message });
    }
  }

  console.table(rows);
  const failingStatuses = new Set(["missing", "error", "missing-or-blocked"]);
  const failures = rows.filter((row) => failingStatuses.has(row.status));
  const ready = failures.length === 0 && authEnabled;
  console.log(
    JSON.stringify(
      {
        configured: Boolean(url && serviceKey && publicKeyReady),
        ready,
        authEnabled,
        checks: rows,
        failures,
        nextStep: ready
          ? "Supabase Auth is configured and reachable."
          : authEnabled
            ? "Resolve the failing Supabase Auth checks, then rerun this validator."
            : "Set SUPABASE_AUTH_ENABLED=true after Supabase Auth keys and public.profiles are ready.",
      },
      null,
      2
    )
  );
  if (!ready) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
