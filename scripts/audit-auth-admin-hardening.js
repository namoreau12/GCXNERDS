const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "auth-admin-hardening.json");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function writeReport(report) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function extractFunctionBody(source, functionName) {
  const startPattern = new RegExp(`(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{`, "m");
  const match = startPattern.exec(source);
  if (!match) return "";

  let depth = 1;
  let index = match.index + match[0].length;
  while (index < source.length && depth > 0) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    index += 1;
  }

  return source.slice(match.index, index);
}

function routeBlock(source, marker, method = null) {
  const methodPrefix = method ? `req.method === "${method}" && ` : "";
  const markerIndex = source.indexOf(`${methodPrefix}${marker}`);
  const fallbackIndex = markerIndex === -1 ? source.indexOf(marker) : markerIndex;
  if (fallbackIndex === -1) return "";
  const nextReturn = source.indexOf("\n  }\n\n  if ", fallbackIndex);
  return source.slice(fallbackIndex, nextReturn === -1 ? fallbackIndex + 1400 : nextReturn);
}

function publicProfileReturnsSensitiveKeys(body) {
  const returnMatch = /return\s*\{([\s\S]*?)\};/.exec(body);
  if (!returnMatch) return ["publicProfile return shape could not be inspected"];
  const returned = returnMatch[1];
  const sensitive = ["role", "email", "account", "accountId", "user", "userId", "token", "tokenHash", "refreshToken"];
  return sensitive.filter((key) => new RegExp(`\\b${key}\\s*:`).test(returned));
}

function browserFiles() {
  return fs
    .readdirSync(rootDir)
    .filter((name) => /\.(?:html|js|css)$/i.test(name))
    .filter((name) => !["server.js"].includes(name))
    .map((name) => ({ name, text: read(name) }));
}

function checkSource() {
  const server = read("server.js");
  const auth = fs.existsSync(path.join(rootDir, "auth.js")) ? read("auth.js") : "";
  const communityAdmin = fs.existsSync(path.join(rootDir, "community-admin.js")) ? read("community-admin.js") : "";
  const supabaseSql = fs.existsSync(path.join(rootDir, "supabase", "gcx-auth-foundation.sql"))
    ? read(path.join("supabase", "gcx-auth-foundation.sql"))
    : "";

  const checks = [];

  const requireStaffBody = extractFunctionBody(server, "requireStaff");
  checks.push({
    id: "require-staff-authenticates-first",
    ok: /authenticatedAccount\s*\(/.test(requireStaffBody) && /401/.test(requireStaffBody),
    detail: "requireStaff must authenticate before staff authorization.",
  });
  checks.push({
    id: "require-staff-role-or-allowlist",
    ok: /isStaffProfile\s*\(\s*auth\.profile\s*\)/.test(requireStaffBody) && /localAdminEmails\s*\(\)\.has\s*\(\s*email\s*\)/.test(requireStaffBody) && /403/.test(requireStaffBody),
    detail: "requireStaff must require a moderator/admin role or server-side admin email allowlist.",
  });

  const sensitiveRoutes = [
    { id: "admin-supabase-readiness", marker: 'url.pathname === "/api/admin/supabase-launch-readiness"' },
    { id: "community-moderation-read", marker: 'route === "moderation"', method: "GET" },
    { id: "community-moderation-write", marker: 'route === "moderation/status"', method: "POST" },
    { id: "sponsor-leads-read", marker: 'route === "sponsor-leads"', method: "GET" },
    { id: "sponsor-leads-update", marker: 'route.startsWith("sponsor-leads/")' },
    { id: "streamer-close-week", marker: 'route === "streamers/close-week"', method: "POST" },
  ];

  for (const route of sensitiveRoutes) {
    const block = routeBlock(server, route.marker, route.method);
    checks.push({
      id: `staff-guard-${route.id}`,
      ok: Boolean(block) && /requireStaff\s*\(/.test(block),
      detail: `${route.id} must call requireStaff before returning protected data or mutating staff-only state.`,
    });
  }

  const publicProfileBody = extractFunctionBody(server, "publicProfile");
  const sensitivePublicKeys = publicProfileReturnsSensitiveKeys(publicProfileBody);
  checks.push({
    id: "public-profile-omits-sensitive-fields",
    ok: sensitivePublicKeys.length === 0,
    detail: sensitivePublicKeys.length ? `publicProfile exposes ${sensitivePublicKeys.join(", ")}.` : "publicProfile omits role, email, account, user, and token fields.",
  });

  checks.push({
    id: "supabase-user-metadata-not-used-for-role",
    ok: !/user_metadata\s*\??\.[\s\S]{0,80}\brole\b/.test(server) && !/raw_user_meta_data[\s\S]{0,80}\brole\b/.test(server),
    detail: "Authorization must not read user-editable Supabase user_metadata for roles.",
  });

  checks.push({
    id: "profile-upsert-forces-member-role",
    ok: /role:\s*"member"/.test(extractFunctionBody(server, "upsertSupabaseProfile")),
    detail: "Self-service profile creation must force the member role.",
  });

  checks.push({
    id: "auth-client-clears-stale-session",
    ok: /maxStoredSessionAgeMs/.test(auth) && /storedSessionIsStale\s*\(/.test(auth) && /clearSession\s*\(/.test(auth),
    detail: "Browser auth client should expire and clear stale stored sessions.",
  });

  checks.push({
    id: "admin-ui-sends-session-header",
    ok: /X-GCX-Session/.test(communityAdmin) && /adminAccessMessage/.test(communityAdmin),
    detail: "Admin UI must send the session header and show access-denied guidance.",
  });

  checks.push({
    id: "profiles-rls-enabled",
    ok: /alter\s+table\s+public\.profiles\s+enable\s+row\s+level\s+security/i.test(supabaseSql),
    detail: "Supabase profiles table must have RLS enabled.",
  });

  checks.push({
    id: "profiles-self-write-member-only",
    ok: /with\s+check\s*\([\s\S]*auth\.uid\(\)[\s\S]*role\s*=\s*'member'[\s\S]*\)/i.test(supabaseSql),
    detail: "Supabase profile self-writes must not allow users to assign moderator/admin roles.",
  });

  const serverKeyNameHits = browserFiles()
    .flatMap(({ name, text }) => ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"].filter((key) => text.includes(key)).map((key) => ({ file: name, key })));
  checks.push({
    id: "browser-files-do-not-reference-server-supabase-key",
    ok: serverKeyNameHits.length === 0,
    detail: serverKeyNameHits.length ? `Server-only Supabase key name appears in browser files: ${serverKeyNameHits.map((hit) => `${hit.file}:${hit.key}`).join(", ")}.` : "Browser-delivered files do not mention server-only Supabase key names.",
  });

  const failures = checks.filter((check) => !check.ok);
  return {
    generatedAt: new Date().toISOString(),
    ok: failures.length === 0,
    checks,
    failures,
  };
}

function main() {
  const report = checkSource();
  writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
