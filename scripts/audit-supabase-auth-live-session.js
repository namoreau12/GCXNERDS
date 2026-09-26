const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const communityDataPath = path.join(rootDir, "data", "community.json");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "supabase-auth-live-session.json");
const port = Number(process.env.GCX_SUPABASE_AUTH_SMOKE_PORT || 3064);
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

function supabaseUrl(env, pathname) {
  return `${String(env.SUPABASE_URL || "").replace(/\/+$/, "")}/${pathname.replace(/^\/+/, "")}`;
}

function serviceHeaders(env, extra = {}) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function encodePostgrestValue(value) {
  return encodeURIComponent(String(value || ""));
}

function writeReport(value) {
  fs.mkdirSync(outputDir, { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, outputPath);
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
      SUPABASE_AUTH_ENABLED: "true",
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

async function request(pathname, options = {}) {
  const response = await fetch(`${base}${pathname}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
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
  return {
    status: response.status,
    source: response.headers.get("x-gcx-data-source") || "",
    body,
  };
}

async function postJson(pathname, body, headers = {}) {
  return request(pathname, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function supabaseAdminRequest(env, pathname, options = {}) {
  const response = await fetch(supabaseUrl(env, `auth/v1/${pathname.replace(/^\/+/, "")}`), {
    ...options,
    headers: serviceHeaders(env, options.headers || {}),
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const message = body?.msg || body?.message || body?.error_description || body?.error || `Supabase Auth admin request failed with ${response.status}.`;
    throw new Error(message);
  }
  return body;
}

async function supabaseRestDelete(env, table, query) {
  const response = await fetch(supabaseUrl(env, `rest/v1/${table}?${query}`), {
    method: "DELETE",
    headers: serviceHeaders(env, { Prefer: "return=minimal" }),
  });
  if (!response.ok) throw new Error(`Supabase cleanup for ${table} returned ${response.status}.`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const env = loadEnvFile();
  assert(hasUsableValue(env, "SUPABASE_URL"), "SUPABASE_URL is missing or placeholder.");
  assert(hasUsableValue(env, "SUPABASE_SERVICE_ROLE_KEY"), "SUPABASE_SERVICE_ROLE_KEY is missing or placeholder.");
  assert(hasUsableValue(env, "SUPABASE_ANON_KEY") || hasUsableValue(env, "SUPABASE_PUBLISHABLE_KEY"), "SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY is missing or placeholder.");

  const originalCommunity = fs.existsSync(communityDataPath) ? fs.readFileSync(communityDataPath, "utf8") : null;
  const stamp = Date.now();
  const email = `supabase-auth-smoke+${stamp}@example.com`;
  const password = `LaunchAuth${stamp}!`;
  const displayName = "Supabase Auth Smoke";
  let server = null;
  let userId = "";

  try {
    const created = await supabaseAdminRequest(env, "admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          displayName,
          display_name: displayName,
          source: "gcx-auth-smoke",
        },
      }),
    });
    userId = created?.id || created?.user?.id || "";
    assert(userId, "Supabase admin user creation returned no user id.");

    server = startServer(env);
    await waitForServer(`${base}/api/status`);

    const status = await request("/api/status");
    assert(status.status === 200, `Status endpoint returned ${status.status}.`);
    assert(status.body?.supabaseAuthEnabled === true, "Smoke server did not start with Supabase Auth enabled.");

    const login = await postJson("/api/auth/login", { email, password });
    assert(login.status === 200, `Supabase login expected HTTP 200, got ${login.status}.`);
    assert(login.source === "supabase-auth", `Expected supabase-auth source, got ${login.source || "blank"}.`);
    const token = login.body?.token || "";
    const refreshToken = login.body?.refreshToken || "";
    assert(token, "Supabase login returned no access token.");
    assert(refreshToken, "Supabase login returned no refresh token.");

    const session = await request("/api/auth/session", { headers: { "X-GCX-Session": token } });
    assert(session.status === 200 && session.body?.authenticated === true, "Supabase access token did not authenticate the GCX session endpoint.");
    assert(session.source === "supabase-auth", `Expected supabase-auth session source, got ${session.source || "blank"}.`);

    const staff = await request("/api/auth/staff-status", { headers: { "X-GCX-Session": token } });
    assert(staff.status === 200 && staff.body?.staff === false, "Temporary Supabase smoke user should not have staff access.");

    const moderation = await request("/api/community/moderation", { headers: { "X-GCX-Session": token } });
    assert(moderation.status === 403, `Temporary Supabase member should get 403 for moderation, got ${moderation.status}.`);

    const refresh = await postJson("/api/auth/refresh", { refreshToken });
    assert(refresh.status === 200, `Supabase refresh expected HTTP 200, got ${refresh.status}.`);
    assert(refresh.source === "supabase-auth", `Expected supabase-auth refresh source, got ${refresh.source || "blank"}.`);
    const refreshedToken = refresh.body?.token || "";
    assert(refreshedToken, "Supabase refresh returned no access token.");

    const logout = await postJson("/api/auth/logout", {}, { "X-GCX-Session": refreshedToken });
    assert(logout.status === 200, `Supabase logout expected HTTP 200, got ${logout.status}.`);

    const afterLogout = await request("/api/auth/session", { headers: { "X-GCX-Session": refreshedToken } });
    assert(afterLogout.status === 200 && afterLogout.body?.authenticated === false, "Supabase session should be invalid after logout.");

    const report = {
      ok: true,
      generatedAt: new Date().toISOString(),
      base,
      checks: [
        { name: "status", status: status.status, supabaseAuthEnabled: true },
        { name: "login", status: login.status, source: login.source },
        { name: "session", status: session.status, source: session.source },
        { name: "member staff status", status: staff.status, staff: staff.body?.staff === true },
        { name: "member moderation rejected", status: moderation.status },
        { name: "refresh", status: refresh.status, source: refresh.source },
        { name: "logout", status: logout.status },
        { name: "post-logout session", status: afterLogout.status, authenticated: afterLogout.body?.authenticated === true },
      ],
      deletedSupabaseUser: true,
      restoredLocalCommunity: true,
    };
    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await stopServer(server);
    if (userId) {
      await supabaseAdminRequest(env, `admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" }).catch(() => {});
      await supabaseRestDelete(env, "profiles", `id=eq.${encodePostgrestValue(userId)}`).catch(() => {});
    }
    if (originalCommunity !== null) {
      const tempPath = `${communityDataPath}.supabase-auth-smoke-tmp`;
      fs.writeFileSync(tempPath, originalCommunity);
      fs.renameSync(tempPath, communityDataPath);
    }
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
