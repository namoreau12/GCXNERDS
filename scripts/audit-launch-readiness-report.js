const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const jsonPath = path.join(rootDir, "data", "launch-readiness", "latest.json");
const markdownPath = path.join(rootDir, "data", "launch-readiness", "latest.md");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  assert(fs.existsSync(jsonPath), "Launch readiness JSON report is missing.");
  assert(fs.existsSync(markdownPath), "Launch readiness markdown report is missing.");

  const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const gateIds = new Set((report.gates || []).map((gate) => gate.id));
  const requiredGates = [
    "launch-checks",
    "supabase-launch-data",
    "supabase-data-freshness",
    "supabase-auth",
    "supabase-public-surface",
    "supabase-migration-cli-safety",
    "supabase-auth-live-session",
    "supabase-live-persistence",
    "marketplace-beta",
    "marketplace-policy-readiness",
    "legal-trust-pages",
    "seo-infrastructure",
    "deploy-artifact-hygiene",
    "node-package-hygiene",
    "public-api-error-hygiene",
    "ops-surface-privacy",
    "launch-runner-safety",
    "secret-exposure",
    "json-duplicate-keys",
    "data-text-quality",
    "public-draft-language",
    "game-overview-grammar-regressions",
    "editorial-credibility",
    "newsroom-media-audit",
    "newsroom-media-workplan",
    "newsroom-image-uniqueness",
    "newsroom-official-media-queue",
    "article-visual-quality",
    "article-image-duplicates",
    "newsroom-preview-text",
    "pokemon-set-quality",
    "game-image-import-safety",
    "game-image-provenance",
    "priority-image-review-batches",
    "game-image-import-readiness",
    "game-image-review-workplan",
    "game-image-coverage-plan",
    "image-queue-workflow-ui",
    "game-image-fallback-ui",
    "overview-queue-workflow-ui",
    "public-game-overview-gating",
    "data-health-launch-readiness-ui",
    "form-disclosures",
    "staff-moderation-actions",
    "admin-ui-access",
    "auth-admin-hardening",
    "moderation-operations-readiness",
    "community-test-fixtures",
    "server-health-contract",
    "sensitive-api-headers",
    "public-profile-privacy",
    "community-write-rate-limits",
    "auth-page-ux",
    "client-auth-storage-hygiene",
    "local-session-token-storage",
    "legacy-raw-session-rejection",
    "accessibility-basics",
    "runtime-links",
    "content-quality",
    "image-url-health",
    "rendered-image-performance",
    "image-text-layout-system",
    "prominent-news-official-media",
  ];

  requiredGates.forEach((gate) => assert(gateIds.has(gate), `Missing launch readiness gate: ${gate}`));
  assert(["ready", "ready-with-warnings", "blocked"].includes(report.status), "Report status is invalid.");
  assert(Array.isArray(report.blockers), "Report blockers must be an array.");
  assert(Array.isArray(report.warnings), "Report warnings must be an array.");
  assert(markdown.includes("## Gates"), "Markdown report is missing the Gates section.");
  assert(markdown.includes("## Next Actions"), "Markdown report is missing the Next Actions section.");
  assert(report.contentQuality?.metrics?.overviewPct >= 0, "Content metrics are missing.");

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: report.status,
        launchReady: report.launchReady,
        blockers: report.blockers.map((gate) => gate.label),
        warnings: report.warnings.map((gate) => gate.label),
      },
      null,
      2
    )
  );
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
