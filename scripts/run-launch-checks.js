const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const communityDataPath = path.join(rootDir, "data", "community.json");
const defaultPort = 3060;
const port = Number(process.env.GCX_LAUNCH_CHECK_PORT || defaultPort);
const baseUrl = `http://localhost:${port}`;
const bundledNodeModules = "C:\\Users\\namor\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";

function loadEnvFile() {
  const envPath = path.join(rootDir, ".env");
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

function hasUsableEnvValue(env, key) {
  const value = String(env[key] || process.env[key] || "").trim();
  return Boolean(value && !/^(replace_with_|your_|https:\/\/your-)/i.test(value));
}

function supabaseSmokeConfigured() {
  const env = loadEnvFile();
  return hasUsableEnvValue(env, "SUPABASE_URL") && hasUsableEnvValue(env, "SUPABASE_SERVICE_ROLE_KEY");
}

function launchEnv(extra = {}) {
  const env = { ...process.env, ...extra };
  if (!env.NODE_PATH && fs.existsSync(bundledNodeModules)) {
    env.NODE_PATH = bundledNodeModules;
  }
  return env;
}

function runNode(script, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: rootDir,
      env: launchEnv(options.env || {}),
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0 || options.allowFailure) {
        resolve(code || 0);
        return;
      }
      reject(new Error(`${script} exited with status ${code}`));
    });
  });
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
      request.setTimeout(2000, () => {
        request.destroy();
      });
    }

    attempt();
  });
}

function startServer() {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: rootDir,
    env: launchEnv({
      PORT: String(port),
      SUPABASE_AUTH_ENABLED: process.env.SUPABASE_AUTH_ENABLED || "false",
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      GCX_CURRENT_LAUNCH_CHECKS_OK: "true",
    }),
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

async function stopAndRestoreServer(child, snapshot) {
  await stopServer(child);
  restoreCommunitySnapshot(snapshot);
}

function readCommunitySnapshot() {
  return fs.existsSync(communityDataPath) ? fs.readFileSync(communityDataPath, "utf8") : null;
}

function restoreCommunitySnapshot(snapshot) {
  if (snapshot === null) return;
  const tempPath = `${communityDataPath}.launch-check-tmp`;
  fs.writeFileSync(tempPath, snapshot);
  fs.renameSync(tempPath, communityDataPath);
}

async function main() {
  console.log("GCX launch checks starting...");

  await runNode(path.join("scripts", "audit-game-library-completeness.js"));
  await runNode(path.join("scripts", "build-data-health-cleanup-queue.js"));
  await runNode(path.join("scripts", "report-image-provider-readiness.js"));
  await runNode(path.join("scripts", "backfill-game-image-providers.js"));
  await runNode(path.join("scripts", "audit-game-image-provenance.js"));
  await runNode(path.join("scripts", "build-game-image-coverage-plan.js"));
  await runNode(path.join("scripts", "export-game-image-milestone-batches.js"));
  await runNode(path.join("scripts", "audit-secret-exposure.js"));
  await runNode(path.join("scripts", "audit-json-duplicate-keys.js"));
  await runNode(path.join("scripts", "audit-data-text-quality.js"));
  await runNode(path.join("scripts", "audit-public-draft-language.js"));
  await runNode(path.join("scripts", "clean-game-overview-internal-gcx-language.js"));
  await runNode(path.join("scripts", "audit-game-overview-internal-language.js"));
  await runNode(path.join("scripts", "audit-game-overview-grammar-regressions.js"));
  await runNode(path.join("scripts", "audit-game-overview-quality.js"));
  await runNode(path.join("scripts", "export-game-overview-rewrite-batches.js"));
  await runNode(path.join("scripts", "audit-game-overview-rewrite-batches.js"));
  await runNode(path.join("scripts", "repair-reviewed-overview-import-internal-language.js"));
  await runNode(path.join("scripts", "audit-game-overview-grammar-regressions.js"));
  await runNode(path.join("scripts", "audit-game-overview-import-safety.js"));
  await runNode(path.join("scripts", "audit-reviewed-overview-import-freshness.js"));
  await runNode(path.join("scripts", "build-overview-import-repair-queue.js"));
  await runNode(path.join("scripts", "build-overview-rereview-packet.js"));
  await runNode(path.join("scripts", "classify-overview-rereview-packet.js"));
  await runNode(path.join("scripts", "build-game-overview-review-workplan.js"));
  await runNode(path.join("scripts", "audit-editorial-credibility.js"));
  await runNode(path.join("scripts", "normalize-newsroom-markdown-tables.js"));
  await runNode(path.join("scripts", "convert-newsroom-markdown-tables-to-structured-blocks.js"));
  await runNode(path.join("scripts", "audit-newsroom-internal-language.js"));
  await runNode(path.join("scripts", "audit-newsroom-media.js"));
  await runNode(path.join("scripts", "build-newsroom-media-workplan.js"));
  await runNode(path.join("scripts", "audit-article-visual-quality.js"));
  await runNode(path.join("scripts", "audit-newsroom-structured-tables.js"));
  await runNode(path.join("scripts", "audit-newsroom-table-rendering.js"));
  await runNode(path.join("scripts", "audit-newsroom-preview-text.js"));
  await runNode(path.join("scripts", "audit-newsroom-image-uniqueness.js"));
  await runNode(path.join("scripts", "audit-newsroom-promotion-readiness.js"));
  await runNode(path.join("scripts", "audit-pokemon-set-quality.js"));
  await runNode(path.join("scripts", "audit-card-system-health.js"));
  await runNode(path.join("scripts", "audit-tcg-card-media-guardrails.js"));
  await runNode(path.join("scripts", "audit-game-image-import-safety.js"));
  await runNode(path.join("scripts", "audit-priority-image-review-batches.js"));
  await runNode(path.join("scripts", "audit-game-image-import-readiness.js"));
  await runNode(path.join("scripts", "audit-pricecharting-candidate-guardrails.js"));
  await runNode(path.join("scripts", "audit-provider-dry-run-limits.js"));
  await runNode(path.join("scripts", "audit-game-image-coverage-plan.js"));
  await runNode(path.join("scripts", "build-game-image-review-workplan.js"));
  await runNode(path.join("scripts", "audit-marketplace-beta-safety.js"));
  await runNode(path.join("scripts", "audit-marketplace-policy-readiness.js"));
  await runNode(path.join("scripts", "audit-form-disclosures.js"));
  await runNode(path.join("scripts", "audit-legal-trust-pages.js"));
  await runNode(path.join("scripts", "build-sitemap.js"));
  await runNode(path.join("scripts", "audit-seo-infrastructure.js"));
  await runNode(path.join("scripts", "audit-deploy-artifact-hygiene.js"));
  await runNode(path.join("scripts", "audit-node-package-hygiene.js"));
  await runNode(path.join("scripts", "audit-public-api-error-hygiene.js"));
  await runNode(path.join("scripts", "audit-ops-surface-privacy.js"));
  await runNode(path.join("scripts", "audit-launch-runner-safety.js"));
  await runNode(path.join("scripts", "audit-admin-ui-access.js"));
  await runNode(path.join("scripts", "audit-moderation-operations-readiness.js"));
  await runNode(path.join("scripts", "audit-staff-moderation-actions.js"));
  await runNode(path.join("scripts", "audit-auth-admin-hardening.js"));
  await runNode(path.join("scripts", "clean-community-test-fixtures.js"));

  console.log("\nChecking Supabase launch data readiness. This is advisory until the SQL has been applied.");
  await runNode(path.join("scripts", "validate-supabase-launch-data-setup.js"), [], { allowFailure: true });
  await runNode(path.join("scripts", "audit-supabase-public-surface.js"), [], { allowFailure: true });
  await runNode(path.join("scripts", "audit-supabase-data-freshness.js"), [], { allowFailure: true });
  await runNode(path.join("scripts", "audit-supabase-migration-cli-safety.js"));
  if (supabaseSmokeConfigured()) {
    console.log("\nChecking live Supabase persistence with cleanup.");
    await runNode(path.join("scripts", "audit-supabase-live-persistence.js"));
    console.log("\nChecking live Supabase Auth session flow with cleanup.");
    await runNode(path.join("scripts", "audit-supabase-auth-live-session.js"));
  } else {
    console.log("\nSkipping live Supabase smoke tests because Supabase env values are not configured.");
  }

  const communitySnapshot = readCommunitySnapshot();
  let server = startServer();
  try {
    await waitForServer(`${baseUrl}/api/status`);
    await runNode(path.join("scripts", "audit-launch-readiness.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl },
    });
    await runNode(path.join("scripts", "audit-homepage-lead-visual-safety.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-prominent-news-official-media.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-admin-ui-access.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-auth-page-ux.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-accessibility-basics.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-data-health-launch-readiness-ui.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-tcg-runtime-surface.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-image-queue-workflow-ui.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-game-image-fallback-ui.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-game-detail-image-rendering.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, GCX_GAME_IMAGE_RENDER_PLATFORM: "ps2", GCX_GAME_IMAGE_RENDER_LIMIT: "10" },
    });
    await runNode(path.join("scripts", "audit-overview-queue-workflow-ui.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-public-game-overview-gating.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-server-status-contract.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-server-health-contract.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-ops-surface-privacy.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-sensitive-api-headers.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-public-profile-privacy.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-community-write-rate-limits.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-runtime-links.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-newsroom-table-rendering.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-article-table-ui.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-newsroom-visible-markdown-leaks.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-article-image-duplicates.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-performance-image-basics.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-auth-community-safety.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
    await runNode(path.join("scripts", "audit-local-session-token-storage.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });

    await stopAndRestoreServer(server, communitySnapshot);
    await runNode(path.join("scripts", "audit-legacy-raw-session-rejection.js"), [], {
      env: { GCX_AUDIT_PORT: String(port + 1), SUPABASE_AUTH_ENABLED: "false" },
    });

    server = startServer();
    await waitForServer(`${baseUrl}/api/status`);

    await runNode(path.join("scripts", "audit-lead-persistence.js"), [], {
      env: { GCX_AUDIT_BASE_URL: baseUrl, PORT: String(port) },
    });
  } finally {
    await stopAndRestoreServer(server, communitySnapshot);
  }

  await runNode(path.join("scripts", "build-launch-readiness-report.js"), [], {
    env: { GCX_CURRENT_LAUNCH_CHECKS_OK: "true" },
  });
  await runNode(path.join("scripts", "audit-launch-readiness-report.js"));
  await runNode(path.join("scripts", "clean-community-test-fixtures.js"));
  await runNode(path.join("scripts", "audit-community-test-fixtures.js"));

  console.log("\nGCX launch checks completed.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
