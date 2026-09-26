const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;

const forbiddenKeys = [/service/i, /secret/i, /password/i, /token/i, /key$/i];

function collectForbiddenPaths(value, path = []) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = [...path, key];
    const keyHits = forbiddenKeys.some((pattern) => pattern.test(key)) && key !== "pokemonApiKeyConfigured" && key !== "publicKeyConfigured";
    return [
      ...(keyHits ? [childPath.join(".")] : []),
      ...collectForbiddenPaths(child, childPath),
    ];
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const response = await fetch(`${base}/api/status`, { headers: { Accept: "application/json" } });
  const status = await response.json();
  const launch = status.launch || {};
  const persistence = launch.persistence || {};
  const auth = launch.auth || {};
  const marketplace = launch.marketplace || {};
  const forbiddenPaths = collectForbiddenPaths(status);

  assert(response.status === 200, `/api/status returned ${response.status}`);
  assert(status.ok === true, "/api/status did not report ok=true");
  assert(["local", "local+supabase"].includes(persistence.mode), "persistence mode is missing or invalid");
  assert(persistence.localFallbackEnabled === true, "local fallback should remain enabled before launch cutover");
  assert(Array.isArray(persistence.writeSurfaces) && persistence.writeSurfaces.length >= 8, "write surfaces are incomplete");
  assert(persistence.localRecordCounts && typeof persistence.localRecordCounts === "object", "local record counts are missing");
  assert(["local", "supabase-auth"].includes(auth.mode), "auth mode is missing or invalid");
  assert(typeof auth.supabaseAuthEnabled === "boolean", "auth enabled flag is missing");
  assert(typeof auth.staffGateConfigured === "boolean", "staff gate flag is missing");
  assert(typeof auth.staffRoleGateConfigured === "boolean", "staff role gate flag is missing");
  assert(typeof auth.localAdminAllowlistConfigured === "boolean", "local admin allowlist flag is missing");
  assert(auth.staffGateConfigured === (auth.staffRoleGateConfigured || auth.localAdminAllowlistConfigured), "staff gate summary does not match role/allowlist configuration");
  assert(marketplace.status === "beta", "marketplace must remain beta");
  assert(marketplace.realMoneyTradingEnabled === false, "real-money trading must not be live");
  assert(marketplace.paymentsEnabled === false, "payments must not be live");
  assert(forbiddenPaths.length === 0, `status endpoint exposes sensitive-looking fields: ${forbiddenPaths.join(", ")}`);

  console.log(
    JSON.stringify(
      {
        base,
        ok: true,
        persistenceMode: persistence.mode,
        authMode: auth.mode,
        marketplaceStatus: marketplace.status,
        writeSurfaces: persistence.writeSurfaces.length,
        localRecordCounts: persistence.localRecordCounts,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
