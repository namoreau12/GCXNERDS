const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const jsonPath = path.join(outputDir, "latest.json");
const markdownPath = path.join(outputDir, "latest.md");
const launchCheckFreshnessMs = 1000 * 60 * 60 * 24 * 7;

function readJson(relativePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8"));
  } catch {
    return fallback;
  }
}

function runJsonScript(scriptName, allowFailure = true) {
  const result = spawnSync(process.execPath, [path.join("scripts", scriptName)], {
    cwd: rootDir,
    encoding: "utf8",
    env: process.env,
  });
  const text = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  const jsonStart = text.indexOf("{");
  const parsed = jsonStart >= 0 ? safeParseJson(text.slice(jsonStart)) : null;
  return {
    ok: result.status === 0,
    status: result.status,
    report: parsed,
    message: parsed?.message || parsed?.nextStep || (result.status === 0 ? "ok" : text.slice(0, 300)),
    allowFailure,
  };
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function gradeStatus(ok, warning = false) {
  if (ok) return "pass";
  return warning ? "warning" : "blocker";
}

function statusIcon(status) {
  if (status === "pass") return "PASS";
  if (status === "warning") return "WARN";
  return "BLOCK";
}

function pct(value) {
  return `${Number(value || 0).toFixed(1).replace(".0", "")}%`;
}

function firstMilestoneBatch(priorityImageReviewBatches) {
  const milestoneIndex = (priorityImageReviewBatches.indexes || []).find((index) => index.label === "Milestone");
  const batches = milestoneIndex?.batches || [];
  return [...batches]
    .filter((batch) => Number(batch.records || 0) > 0)
    .sort((a, b) => Number(a.targetPct || 0) - Number(b.targetPct || 0))[0];
}

function latestLaunchCheckSummary() {
  if (process.env.GCX_CURRENT_LAUNCH_CHECKS_OK === "true") {
    return {
      ok: true,
      status: "pass",
      detail: "Current full local launch check completed successfully in this runner.",
    };
  }

  const logPath = path.join(rootDir, ".cache", "launch-check-latest.log");
  if (!fs.existsSync(logPath)) {
    return { ok: false, status: "blocker", detail: "No launch-check log found. Run scripts/run-launch-checks.js." };
  }
  const stat = fs.statSync(logPath);
  const buffer = fs.readFileSync(logPath);
  const utf8Text = buffer.toString("utf8");
  const text = utf8Text.includes("\u0000") ? buffer.toString("utf16le") : utf8Text;
  const completed = /GCX launch checks completed\./.test(text);
  const failed = /scripts\\run-launch-checks\.js exited with status|exited with status 1|Error:/i.test(text);
  const ok = completed && !failed;
  const ageMs = Date.now() - stat.mtimeMs;
  const stale = ok && ageMs > launchCheckFreshnessMs;
  return {
    ok: ok && !stale,
    status: stale ? "warning" : gradeStatus(ok),
    detail: stale
      ? `Latest full local launch check completed successfully at ${stat.mtime.toISOString()}, but it is older than 7 days. Run scripts/run-launch-checks.js before a public launch window.`
      : ok
        ? `Latest full local launch check completed successfully at ${stat.mtime.toISOString()}.`
      : `Latest launch check did not complete cleanly. Last log update: ${stat.mtime.toISOString()}.`,
  };
}

function contentQualityGate(libraryReport, providerReport, priorityImageReviewBatches = {}) {
  const totals = libraryReport?.totals || {};
  const missingImages = Number(totals.missingImages || 0);
  const missingOverviews = Number(totals.missingOverviews || 0);
  const imagePctValue = Number(totals.imagePct || 0);
  const overviewPctValue = Number(totals.overviewPct || 0);
  const missingProviderKey = (providerReport?.providers || []).some((provider) => provider.status === "missing-key" && provider.id === "mobygames");
  const blocker = overviewPctValue < 95;
  const warning = missingImages > 0 || imagePctValue < 95 || missingProviderKey;
  const coveragePlan = readJson("data/games/image-coverage-plan.json", {});
  const nextMilestone = (coveragePlan.milestones || []).find((milestone) => !milestone.targetMet);
  const milestoneBatch = firstMilestoneBatch(priorityImageReviewBatches);
  const milestoneStep = nextMilestone
    ? `Next image milestone: review ${Number(nextMilestone.additionalImagesNeeded || 0).toLocaleString()} cover images to reach ${Number(nextMilestone.targetPct || 0).toLocaleString()}% coverage${milestoneBatch?.path ? ` using ${milestoneBatch.path}` : ""}.`
    : "";

  return {
    ok: !blocker,
    status: gradeStatus(!blocker && !warning, warning),
    detail:
      missingOverviews > 0
        ? `${missingOverviews.toLocaleString()} game overviews still need editorial work.`
        : [
            `${pct(imagePctValue)} game image coverage; ${missingImages.toLocaleString()} images remain.`,
            milestoneStep,
          ]
            .filter(Boolean)
            .join(" "),
    metrics: {
      totalGames: totals.totalGames || 0,
      imagePct: imagePctValue,
      missingImages,
      overviewPct: overviewPctValue,
      missingOverviews,
    },
    topImageBacklog: providerReport?.topImageBacklog || libraryReport?.priority?.imageBacklog?.slice(0, 8) || [],
    nextStep: [milestoneStep, providerReport?.recommendedNextAction || "Continue image cleanup in data-health priority order without using unlicensed artwork."]
      .filter(Boolean)
      .join(" "),
  };
}

function refreshDependentReadinessReports() {
  const dependencies = [
    "audit-game-overview-quality.js",
    "audit-game-overview-markup.js",
    "audit-game-overview-internal-language.js",
    "audit-game-overview-grammar-regressions.js",
    "audit-reviewed-overview-import-freshness.js",
    "build-overview-import-repair-queue.js",
    "build-overview-rereview-packet.js",
    "classify-overview-rereview-packet.js",
    "audit-newsroom-internal-language.js",
  ];

  return dependencies.map((scriptName) => ({
    scriptName,
    result: runJsonScript(scriptName, true),
  }));
}

function buildReport() {
  const refreshedReports = process.env.GCX_REFRESH_DEPENDENT_REPORTS === "true" ? refreshDependentReadinessReports() : [];
  const libraryReport = readJson("data/games/library-completeness.json", {});
  const providerReport = readJson("data/games/image-provider-readiness.json", {});
  const gameImageProvenance = readJson("data/launch-readiness/game-image-provenance.json", {});
  const imageHealth = readJson("data/games/image-url-health-report.json", {});
  const performanceImageBasics = readJson("data/launch-readiness/performance-image-basics.json", {});
  const runtimeLinks = readJson("data/launch-readiness/runtime-links.json", {});
  const imageTextLayoutSystem = readJson("data/launch-readiness/image-text-layout-system.json", {});
  const prominentNewsOfficialMedia = readJson("data/launch-readiness/prominent-news-official-media.json", {});
  const moderationOperationsReadiness = readJson("data/launch-readiness/moderation-operations-readiness.json", {});
  const staffModerationActions = readJson("data/launch-readiness/staff-moderation-actions.json", {});
  const adminUiAccess = readJson("data/launch-readiness/admin-ui-access.json", {});
  const serverHealthContract = readJson("data/launch-readiness/server-health-contract.json", {});
  const sensitiveApiHeaders = readJson("data/launch-readiness/sensitive-api-headers.json", {});
  const seoInfrastructure = readJson("data/launch-readiness/seo-infrastructure.json", {});
  const deployArtifactHygiene = readJson("data/launch-readiness/deploy-artifact-hygiene.json", {});
  const nodePackageHygiene = readJson("data/launch-readiness/node-package-hygiene.json", {});
  const publicApiErrorHygiene = readJson("data/launch-readiness/public-api-error-hygiene.json", {});
  const opsSurfacePrivacy = readJson("data/launch-readiness/ops-surface-privacy.json", {});
  const launchRunnerSafety = readJson("data/launch-readiness/launch-runner-safety.json", {});
  const authPageUx = readJson("data/launch-readiness/auth-page-ux.json", {});
  const accessibilityBasics = readJson("data/launch-readiness/accessibility-basics.json", {});
  const editorialCredibility = readJson("data/launch-readiness/editorial-credibility.json", {});
  const newsroomInternalLanguage = readJson("data/launch-readiness/newsroom-internal-language.json", {});
  const newsroomMediaAudit = readJson("data/launch-readiness/newsroom-media-audit.json", {});
  const newsroomMediaWorkplan = readJson("data/launch-readiness/newsroom-media-workplan.json", {});
  const newsroomStructuredTables = readJson("data/launch-readiness/newsroom-structured-tables.json", {});
  const newsroomTableRendering = readJson("data/launch-readiness/newsroom-table-rendering.json", {});
  const newsroomPreviewText = readJson("data/launch-readiness/newsroom-preview-text.json", {});
  const newsroomVisibleMarkdownLeaks = readJson("data/launch-readiness/newsroom-visible-markdown-leaks.json", {});
  const newsroomImageUniqueness = readJson("data/launch-readiness/newsroom-image-uniqueness.json", {});
  const newsroomEditorialReadthrough = readJson("data/launch-readiness/newsroom-editorial-readthrough.json", {});
  const newsroomOfficialMediaQueue = readJson("data/launch-readiness/newsroom-official-media-queue.json", {});
  const newsroomPromotionReadiness = readJson("data/launch-readiness/newsroom-promotion-readiness.json", {});
  const articleVisualQuality = readJson("data/launch-readiness/article-visual-quality.json", {});
  const articleImageDuplicates = readJson("data/launch-readiness/article-image-duplicates.json", {});
  const articleTableUi = readJson("data/launch-readiness/article-table-ui.json", {});
  const gameOverviewQuality = readJson("data/launch-readiness/game-overview-quality.json", {});
  const gameOverviewMarkup = readJson("data/launch-readiness/game-overview-markup.json", {});
  const gameOverviewInternalLanguage = readJson("data/launch-readiness/game-overview-internal-language.json", {});
  const gameOverviewGrammarRegressions = readJson("data/launch-readiness/game-overview-grammar-regressions.json", {});
  const gameSearchIndexQuality = readJson("data/launch-readiness/game-search-index-quality.json", {});
  const gameOverviewRewriteBatches = readJson("data/launch-readiness/game-overview-rewrite-batches.json", {});
  const gameOverviewImportSafety = readJson("data/launch-readiness/game-overview-import-safety.json", {});
  const gameOverviewReviewWorkplan = readJson("data/launch-readiness/game-overview-review-workplan.json", {});
  const reviewedOverviewInternalLanguageRepair = readJson("data/launch-readiness/reviewed-overview-import-internal-language-repair.json", {});
  const reviewedOverviewImportFreshness = readJson("data/launch-readiness/reviewed-overview-import-freshness.json", {});
  const overviewImportRepairQueue = readJson("data/launch-readiness/overview-import-repair-queue.json", {});
  const overviewRereviewPacket = readJson("data/launch-readiness/overview-rereview-packet.json", {});
  const overviewRereviewClassification = readJson("data/launch-readiness/overview-rereview-classification.json", {});
  const pokemonSetQuality = readJson("data/launch-readiness/pokemon-set-quality.json", {});
  const gameImageImportSafety = readJson("data/launch-readiness/game-image-import-safety.json", {});
  const gameImageImportReadiness = readJson("data/launch-readiness/game-image-import-readiness.json", {});
  const providerDryRunLimits = readJson("data/launch-readiness/provider-dry-run-limits.json", {});
  const gameImageReviewWorkplan = readJson("data/launch-readiness/game-image-review-workplan.json", {});
  const priorityImageReviewBatches = readJson("data/launch-readiness/priority-image-review-batches.json", {});
  const gameImageCoveragePlan = readJson("data/launch-readiness/game-image-coverage-plan.json", {});
  const imageQueueWorkflowUi = readJson("data/launch-readiness/image-queue-workflow-ui.json", {});
  const gameImageFallbackUi = readJson("data/launch-readiness/game-image-fallback-ui.json", {});
  const gameDetailImageRendering = readJson("data/launch-readiness/game-detail-image-rendering.json", {});
  const overviewQueueWorkflowUi = readJson("data/launch-readiness/overview-queue-workflow-ui.json", {});
  const publicGameOverviewGating = readJson("data/launch-readiness/public-game-overview-gating.json", {});
  const dataHealthLaunchReadinessUi = readJson("data/launch-readiness/data-health-launch-readiness-ui.json", {});
  const clientAuthStorageHygiene = readJson("data/launch-readiness/client-auth-storage-hygiene.json", {});
  const localSessionTokenStorage = readJson("data/launch-readiness/local-session-token-storage.json", {});
  const legacyRawSessionRejection = readJson("data/launch-readiness/legacy-raw-session-rejection.json", {});
  const communityWriteRateLimits = readJson("data/launch-readiness/community-write-rate-limits.json", {});
  const communityTestFixtures = readJson("data/launch-readiness/community-test-fixtures.json", {});
  const authAdminHardening = readJson("data/launch-readiness/auth-admin-hardening.json", {});
  const supabasePublicSurface = readJson("data/launch-readiness/supabase-public-surface.json", {});
  const publicProfilePrivacy = readJson("data/launch-readiness/public-profile-privacy.json", {});
  const supabaseLivePersistence = readJson("data/launch-readiness/supabase-live-persistence.json", {});
  const supabaseAuthLiveSession = readJson("data/launch-readiness/supabase-auth-live-session.json", {});
  const supabaseDataFreshness = readJson("data/launch-readiness/supabase-data-freshness.json", {});
  const supabaseMigrationCliSafety = readJson("data/launch-readiness/supabase-migration-cli-safety.json", {});
  const community = readJson("data/community.json", {});
  const supabaseLaunch = runJsonScript("validate-supabase-launch-data-setup.js", true);
  const supabaseAuth = runJsonScript("validate-supabase-auth-setup.js", true);
  const supabaseDataFreshnessAudit = runJsonScript("audit-supabase-data-freshness.js", true);
  const supabaseMigrationCliSafetyAudit = runJsonScript("audit-supabase-migration-cli-safety.js", false);
  const launchChecks = latestLaunchCheckSummary();
  const contentQuality = contentQualityGate(libraryReport, providerReport, priorityImageReviewBatches);
  const secretsAudit = runJsonScript("audit-secret-exposure.js", false);
  const authAdminHardeningAudit = runJsonScript("audit-auth-admin-hardening.js", false);
  const duplicateKeysAudit = runJsonScript("audit-json-duplicate-keys.js", false);
  const textQualityAudit = runJsonScript("audit-data-text-quality.js", false);
  const publicDraftLanguageAudit = runJsonScript("audit-public-draft-language.js", false);
  const gameSearchIndexQualityAudit = runJsonScript("audit-game-search-index-quality.js", false);
  const newsroomMediaAuditRun = runJsonScript("audit-newsroom-media.js", false);
  const newsroomMediaWorkplanRun = runJsonScript("build-newsroom-media-workplan.js", false);
  const newsroomStructuredTablesAudit = runJsonScript("audit-newsroom-structured-tables.js", false);
  const newsroomImageUniquenessAudit = runJsonScript("audit-newsroom-image-uniqueness.js", false);
  const newsroomEditorialReadthroughRun = runJsonScript("build-newsroom-editorial-readthrough.js", false);
  const newsroomOfficialMediaQueueRun = runJsonScript("build-newsroom-official-media-queue.js", false);
  const newsroomPromotionReadinessRun = runJsonScript("audit-newsroom-promotion-readiness.js", false);
  const articleVisualQualityRun = runJsonScript("audit-article-visual-quality.js", false);
  const marketplaceAudit = runJsonScript("audit-marketplace-beta-safety.js", false);
  const marketplacePolicyAudit = runJsonScript("audit-marketplace-policy-readiness.js", false);
  const legalTrustAudit = runJsonScript("audit-legal-trust-pages.js", false);
  runJsonScript("build-sitemap.js", false);
  const seoInfrastructureAudit = runJsonScript("audit-seo-infrastructure.js", false);
  const formAudit = runJsonScript("audit-form-disclosures.js", false);
  const imageReviewWorkplanAudit = runJsonScript("build-game-image-review-workplan.js", false);
  const latestGameImageReviewWorkplan = imageReviewWorkplanAudit.report || gameImageReviewWorkplan;
  const priceChartingCandidateGuardrailsAudit = runJsonScript("audit-pricecharting-candidate-guardrails.js", false);
  const providerDryRunLimitsAudit = runJsonScript("audit-provider-dry-run-limits.js", false);
  const overviewReviewWorkplanAudit = runJsonScript("build-game-overview-review-workplan.js", false);
  const imageTextLayoutAudit =
    process.env.GCX_RUN_HEAVY_VISUAL_AUDIT === "true"
      ? runJsonScript("audit-image-text-layout-system.js", false)
      : { ok: Boolean(imageTextLayoutSystem.ok), report: imageTextLayoutSystem, message: "Using latest saved visual audit result." };
  const promotionReadiness = newsroomPromotionReadinessRun.report || newsroomPromotionReadiness;
  const weakOverviewBacklogCount = Number(gameOverviewQuality.totals?.weakTemplateCount || 0);
  const allGameOverviewsCovered =
    Number(gameOverviewQuality.totals?.missingSourceCount || 0) === 0 &&
    Number(gameOverviewQuality.totals?.withOverview || 0) === Number(gameOverviewQuality.totals?.total || 0);
  const weakOverviewsArePubliclyGated = Boolean(publicGameOverviewGating.ok && allGameOverviewsCovered);

  const gates = [
    {
      id: "launch-checks",
      label: "Local Launch Checks",
      status: launchChecks.status,
      detail: launchChecks.detail,
    },
    {
      id: "supabase-launch-data",
      label: "Supabase Launch Data",
      status: supabaseLaunch.report?.ready ? "pass" : "blocker",
      detail: supabaseLaunch.report?.ready
        ? "Launch data tables are reachable."
        : supabaseLaunch.report?.nextStep || supabaseLaunch.report?.message || "Run the Supabase launch-data validator.",
    },
    {
      id: "supabase-data-freshness",
      label: "Supabase Data Freshness",
      status: (supabaseDataFreshnessAudit.report || supabaseDataFreshness).ok ? "pass" : supabaseLaunch.report?.ready ? "warning" : "blocker",
      detail: (supabaseDataFreshnessAudit.report || supabaseDataFreshness).ok
        ? `${Number((supabaseDataFreshnessAudit.report || supabaseDataFreshness).checkedFiles || 0).toLocaleString()} public static data file(s) verified against Supabase snapshots and normalized record counts.`
        : (supabaseDataFreshnessAudit.report || supabaseDataFreshness).nextStep ||
          (supabaseDataFreshnessAudit.report || supabaseDataFreshness).message ||
          "Run scripts/audit-supabase-data-freshness.js, then sync stale static data with scripts/migrate-data-to-supabase.js --paths=...",
    },
    {
      id: "supabase-migration-cli-safety",
      label: "Supabase Migration CLI Safety",
      status: supabaseMigrationCliSafetyAudit.ok && (supabaseMigrationCliSafetyAudit.report || supabaseMigrationCliSafety).ok ? "pass" : "blocker",
      detail:
        supabaseMigrationCliSafetyAudit.ok && (supabaseMigrationCliSafetyAudit.report || supabaseMigrationCliSafety).ok
          ? "Migration helper verified that --help/-h do not start imports and --refresh-selected cannot run without explicit paths."
          : "Run scripts/audit-supabase-migration-cli-safety.js and fix scripts/migrate-data-to-supabase.js before further launch data syncs.",
    },
    {
      id: "supabase-auth",
      label: "Supabase Auth",
      status: supabaseAuth.report?.ready ? "pass" : "blocker",
      detail: supabaseAuth.report?.ready
        ? "Auth settings and profiles table are reachable."
        : supabaseAuth.report?.nextStep || supabaseAuth.report?.message || "Run the Supabase auth validator.",
    },
    {
      id: "supabase-public-surface",
      label: "Supabase Public API Surface",
      status: supabasePublicSurface.ok ? "pass" : "blocker",
      detail: supabasePublicSurface.ok
        ? "Sensitive Supabase tables reject direct anonymous access while approved public read surfaces remain reachable."
        : "Run supabase/gcx-launch-hardening.sql and scripts/audit-supabase-public-surface.js before launch.",
    },
    {
      id: "supabase-auth-live-session",
      label: "Supabase Auth Live Session",
      status: supabaseAuthLiveSession.ok ? "pass" : supabaseAuth.report?.ready ? "blocker" : "warning",
      detail: supabaseAuthLiveSession.ok
        ? "Live smoke created a temporary confirmed Supabase user, logged in through GCX, verified session/staff rejection/refresh/logout, then deleted the user."
        : "Run scripts/audit-supabase-auth-live-session.js after Supabase Auth validates.",
    },
    {
      id: "supabase-live-persistence",
      label: "Supabase Live Persistence",
      status: supabaseLivePersistence.ok ? "pass" : supabaseLaunch.report?.ready ? "blocker" : "warning",
      detail: supabaseLivePersistence.ok
        ? `Live smoke wrote newsletter, collector waitlist, marketplace intent, and sponsor lead rows to Supabase, then cleaned ${Number(supabaseLivePersistence.cleanedTables?.length || 0).toLocaleString()} table(s).`
        : "Run scripts/audit-supabase-live-persistence.js after Supabase launch data validates.",
    },
    {
      id: "marketplace-beta",
      label: "Marketplace Safety",
      status: marketplaceAudit.ok ? "pass" : "blocker",
      detail: marketplaceAudit.ok ? "No live payment/trading language detected in public surfaces." : marketplaceAudit.message,
    },
    {
      id: "marketplace-policy-readiness",
      label: "Marketplace Policy Readiness",
      status: marketplacePolicyAudit.ok ? "pass" : "blocker",
      detail: marketplacePolicyAudit.ok
        ? "Marketplace launch checklist and public beta policy surfaces cover legal, seller, listing, payment, dispute, refund, support, and moderation gates before transactions open."
        : marketplacePolicyAudit.message,
    },
    {
      id: "legal-trust-pages",
      label: "Legal and Trust Pages",
      status: legalTrustAudit.ok ? "pass" : "blocker",
      detail: legalTrustAudit.ok
        ? `${Number(legalTrustAudit.report?.checkedPages || 0).toLocaleString()} legal, trust, marketplace, and TCG image-policy pages verified for beta launch disclaimers and unsafe affirmative claims.`
        : legalTrustAudit.message,
    },
    {
      id: "seo-infrastructure",
      label: "SEO Infrastructure",
      status: seoInfrastructureAudit.ok && (seoInfrastructureAudit.report?.ok || seoInfrastructure.ok) ? "pass" : "blocker",
      detail: (seoInfrastructureAudit.report || seoInfrastructure).ok
        ? `${Number((seoInfrastructureAudit.report || seoInfrastructure).indexablePages || 0).toLocaleString()} indexable static page(s), ${Number((seoInfrastructureAudit.report || seoInfrastructure).newsroomArticleUrls || 0).toLocaleString()} newsroom article URL(s), and ${Number((seoInfrastructureAudit.report || seoInfrastructure).sitemapUrls || 0).toLocaleString()} sitemap URL(s) verified for canonical, Open Graph, Twitter, robots, and sitemap coverage.`
        : (seoInfrastructureAudit.report || seoInfrastructure).failures?.slice(0, 3).map((failure) => `${failure.file}: ${failure.issue}`).join(" ") || "Run scripts/build-sitemap.js, then scripts/audit-seo-infrastructure.js.",
    },
    {
      id: "deploy-artifact-hygiene",
      label: "Deploy Artifact Hygiene",
      status: deployArtifactHygiene.ok ? "pass" : "blocker",
      detail: deployArtifactHygiene.ok
        ? `Render uses /api/health, dashboard-synced env vars protect production secrets, ignore files protect .env and ZIP artifacts, .env.example uses placeholders, and ${Number((deployArtifactHygiene.rootZipFiles || []).length).toLocaleString()} local root ZIP artifact(s) are tracked as manual-upload warnings${(deployArtifactHygiene.zeroByteZipFiles || []).length ? ` including ${Number((deployArtifactHygiene.zeroByteZipFiles || []).length).toLocaleString()} zero-byte archive(s)` : ""}.`
        : (deployArtifactHygiene.failures || []).join(" ") || "Run scripts/audit-deploy-artifact-hygiene.js before deploying.",
    },
    {
      id: "node-package-hygiene",
      label: "Node Package Hygiene",
      status: nodePackageHygiene.ok ? "pass" : "blocker",
      detail: nodePackageHygiene.ok
        ? `${Number(nodePackageHygiene.dependencyCount || 0).toLocaleString()} package dependency/dependencies detected; ${Number((nodePackageHygiene.lockfiles || []).length).toLocaleString()} lockfile(s) present. Dependency-free npm install is acceptable until dependencies are added.`
        : (nodePackageHygiene.failures || []).join(" ") || "Run scripts/audit-node-package-hygiene.js to verify package and lockfile readiness.",
    },
    {
      id: "public-api-error-hygiene",
      label: "Public API Error Hygiene",
      status: publicApiErrorHygiene.ok ? "pass" : "blocker",
      detail: publicApiErrorHygiene.ok
        ? `${Number((publicApiErrorHygiene.checkedFiles || []).length).toLocaleString()} server file(s) checked so public JSON 500/502 responses do not expose raw error.message details or stack traces.`
        : (publicApiErrorHygiene.failures || []).slice(0, 3).map((failure) => `${failure.file}:${failure.line} ${failure.detail}`).join(" ") ||
          "Run scripts/audit-public-api-error-hygiene.js before launch.",
    },
    {
      id: "ops-surface-privacy",
      label: "Ops Surface Privacy",
      status: opsSurfacePrivacy.ok ? "pass" : "blocker",
      detail: opsSurfacePrivacy.ok
        ? `${Number(opsSurfacePrivacy.checkedPages || 0).toLocaleString()} staff/ops page(s) are noindex/nofollow, excluded from sitemap.xml, not promoted from public pages except approved data-health access, and ${Number((opsSurfacePrivacy.runtimeHeaders || []).filter((item) => item.ok).length || 0).toLocaleString()} noindexed shell(s) passed runtime X-Robots-Tag plus private no-store cache header checks.`
        : (opsSurfacePrivacy.failures || []).join(" ") || "Run scripts/audit-ops-surface-privacy.js before launch.",
    },
    {
      id: "launch-runner-safety",
      label: "Launch Runner Safety",
      status: launchRunnerSafety.ok ? "pass" : "blocker",
      detail: launchRunnerSafety.ok
        ? "Full launch runner rebuilds the launch report without allow-failure, then audits the rebuilt report and key runtime UI checks."
        : (launchRunnerSafety.failures || []).join(" ") || "Run scripts/audit-launch-runner-safety.js to verify launch checks cannot pass stale readiness output.",
    },
    {
      id: "secret-exposure",
      label: "Secret Exposure",
      status: secretsAudit.ok ? "pass" : "blocker",
      detail: secretsAudit.ok ? "Deployable text scan did not find .env secret values." : secretsAudit.message,
    },
    {
      id: "json-duplicate-keys",
      label: "JSON Duplicate Keys",
      status: duplicateKeysAudit.ok ? "pass" : "blocker",
      detail: duplicateKeysAudit.ok
        ? `${Number(duplicateKeysAudit.report?.scannedFiles || 0).toLocaleString()} JSON files scanned with no duplicate keys.`
        : duplicateKeysAudit.message,
    },
    {
      id: "data-text-quality",
      label: "Data Text Quality",
      status: textQualityAudit.ok ? "pass" : "blocker",
      detail: textQualityAudit.ok
        ? `${Number(textQualityAudit.report?.scannedFiles || 0).toLocaleString()} data/content files scanned with no suspicious mojibake.`
        : textQualityAudit.message,
    },
    {
      id: "public-draft-language",
      label: "Public Draft Language",
      status: publicDraftLanguageAudit.ok ? "pass" : "blocker",
      detail: publicDraftLanguageAudit.ok
        ? `${Number(publicDraftLanguageAudit.report?.scannedFiles || 0).toLocaleString()} public page/data/doc files scanned with no draft instruction language exposed.`
        : publicDraftLanguageAudit.message,
    },
    {
      id: "game-overview-quality",
      label: "Game Overview Quality",
      status:
        refreshedReports.find((item) => item.scriptName === "audit-game-overview-quality.js")?.result.ok === false
          ? "blocker"
          : gameOverviewQuality.riskLevel === "warning" && !weakOverviewsArePubliclyGated
            ? "warning"
            : gameOverviewQuality.ok
              ? "pass"
              : "blocker",
      detail: gameOverviewQuality.ok
        ? gameOverviewQuality.reviewNeeded
          ? weakOverviewsArePubliclyGated
            ? `${weakOverviewBacklogCount.toLocaleString()} weak/template-style game overviews remain in the private rewrite backlog, but public list/detail pages are verified to show editorial-review messaging instead of unfinished copy.`
            : `${weakOverviewBacklogCount.toLocaleString()} game overviews use weak/template-style metadata copy; ${Number(gameOverviewQuality.totals?.reviewedEditorialCount || 0).toLocaleString()} reviewed editorial overviews are recorded.`
          : `${Number(gameOverviewQuality.totals?.withOverview || 0).toLocaleString()} game overviews checked for repetition, weak templates, short copy, and source gaps.`
        : "Run scripts/audit-game-overview-quality.js to verify game overview quality risk.",
    },
    {
      id: "game-overview-internal-language",
      label: "Game Overview Internal Language",
      status:
        refreshedReports.find((item) => item.scriptName === "audit-game-overview-internal-language.js")?.result.ok === false
          ? "blocker"
          : gameOverviewInternalLanguage.ok
            ? "pass"
            : "blocker",
      detail: gameOverviewInternalLanguage.ok
        ? `${Number(gameOverviewInternalLanguage.scannedGames || 0).toLocaleString()} game overviews scanned with no internal editorial instruction language exposed.`
        : "Run scripts/clean-game-overview-internal-gcx-language.js, then scripts/audit-game-overview-internal-language.js.",
    },
    {
      id: "game-overview-grammar-regressions",
      label: "Game Overview Grammar Regressions",
      status:
        refreshedReports.find((item) => item.scriptName === "audit-game-overview-grammar-regressions.js")?.result.ok === false
          ? "blocker"
          : gameOverviewGrammarRegressions.ok
            ? "pass"
            : "blocker",
      detail: gameOverviewGrammarRegressions.ok
        ? `${Number(gameOverviewGrammarRegressions.scannedFiles || 0).toLocaleString()} game datasets and reviewed-import files scanned for cleanup-induced grammar regressions.`
        : "Run scripts/audit-game-overview-grammar-regressions.js and fix any reviewed overview rows with broken cleanup wording.",
    },
    {
      id: "game-overview-markup",
      label: "Game Overview Markup Cleanup",
      status:
        refreshedReports.find((item) => item.scriptName === "audit-game-overview-markup.js")?.result.ok === false
          ? "blocker"
          : gameOverviewMarkup.ok
            ? "pass"
            : "blocker",
      detail: gameOverviewMarkup.ok
        ? `${Number(gameOverviewMarkup.scannedGames || 0).toLocaleString()} game overviews scanned with no visible wiki/template markup artifacts.`
        : "Run scripts/clean-game-overview-markup.js, then scripts/audit-game-overview-markup.js.",
    },
    {
      id: "game-search-index-quality",
      label: "Game Search Index Quality",
      status: gameSearchIndexQualityAudit.ok && (gameSearchIndexQualityAudit.report || gameSearchIndexQuality).ok ? "pass" : "blocker",
      detail: (gameSearchIndexQualityAudit.report || gameSearchIndexQuality).ok
        ? `${Number((gameSearchIndexQualityAudit.report || gameSearchIndexQuality).scannedGames || 0).toLocaleString()} game search-index row(s) checked with no repeated overview blobs.`
        : (gameSearchIndexQualityAudit.report || gameSearchIndexQuality).message || "Run scripts/cleanup-game-search-index-quality.js, then scripts/audit-game-search-index-quality.js.",
    },
    {
      id: "game-overview-rewrite-batches",
      label: "Game Overview Rewrite Batches",
      status: gameOverviewRewriteBatches.ok ? "pass" : "blocker",
      detail: gameOverviewRewriteBatches.ok
        ? `${Number(gameOverviewRewriteBatches.batchCount || 0).toLocaleString()} platform overview rewrite batches verified with ${Number(gameOverviewRewriteBatches.rowTotal || 0).toLocaleString()} CSV rows against ${Number(gameOverviewRewriteBatches.totalWeakOverviews || 0).toLocaleString()} weak/template-style overviews.`
        : "Run scripts/export-game-overview-rewrite-batches.js and scripts/audit-game-overview-rewrite-batches.js to verify editorial rewrite batches.",
    },
    {
      id: "game-overview-review-workplan",
      label: "Game Overview Review Workplan",
      status: overviewReviewWorkplanAudit.ok && gameOverviewReviewWorkplan.ok ? "pass" : "warning",
      detail: gameOverviewReviewWorkplan.ok
        ? `${Number(gameOverviewReviewWorkplan.totals?.rewriteRowCount || 0).toLocaleString()} overview rewrite row(s) staged across ${Number(gameOverviewReviewWorkplan.totals?.rewriteBatchCount || 0).toLocaleString()} priority batch(es). Next: ${gameOverviewReviewWorkplan.recommendedNextStep}`
        : "Run scripts/build-game-overview-review-workplan.js to identify the next safest overview rewrite batch.",
    },
    {
      id: "game-overview-import-safety",
      label: "Game Overview Import Safety",
      status: gameOverviewImportSafety.ok ? "pass" : "blocker",
      detail: gameOverviewImportSafety.ok
        ? "Reviewed overview imports require new editorial copy, approved review status, reviewer, current-overview freshness checks, and dry-run preservation before changing datasets."
        : "Run scripts/audit-game-overview-import-safety.js to verify reviewed overview import guardrails.",
    },
    {
      id: "reviewed-overview-import-internal-language-repair",
      label: "Reviewed Overview Import Voice Repair",
      status: reviewedOverviewInternalLanguageRepair.ok ? "pass" : "blocker",
      detail: reviewedOverviewInternalLanguageRepair.ok
        ? `${Number(reviewedOverviewInternalLanguageRepair.checkedFiles || 0).toLocaleString()} reviewed overview import CSV(s) checked; ${Number(reviewedOverviewInternalLanguageRepair.remainingInternalRows || 0).toLocaleString()} queued replacement rows still contain internal GCX/Codex phrasing.`
        : "Run scripts/repair-reviewed-overview-import-internal-language.js to clean internal language from reviewed overview import CSVs before dry-run import checks.",
    },
    {
      id: "reviewed-overview-import-freshness",
      label: "Reviewed Overview Import Freshness",
      status:
        refreshedReports.find((item) => item.scriptName === "audit-reviewed-overview-import-freshness.js")?.result.ok === false
          ? "blocker"
          : reviewedOverviewImportFreshness.ok
            ? "pass"
            : "blocker",
      detail: reviewedOverviewImportFreshness.ok
        ? `${Number(reviewedOverviewImportFreshness.filesChecked || 0).toLocaleString()} reviewed overview import files checked; ${Number(reviewedOverviewImportFreshness.totals?.wouldImport || 0).toLocaleString()} rows still pending import and ${Number(reviewedOverviewImportFreshness.totals?.skipped || 0).toLocaleString()} already applied.`
        : "Run scripts/audit-reviewed-overview-import-freshness.js to verify reviewed overview imports are not stale or falsely counted as new work.",
    },
    {
      id: "overview-import-repair-queue",
      label: "Overview Import Repair Queue",
      status:
        refreshedReports.find((item) => item.scriptName === "build-overview-import-repair-queue.js")?.result.ok === false
          ? "blocker"
          : overviewImportRepairQueue.ok
            ? "pass"
            : "warning",
      detail: overviewImportRepairQueue.ok
        ? `${Number(overviewImportRepairQueue.rejectedRows || 0).toLocaleString()} rejected reviewed overview row(s) grouped into ${Number(overviewImportRepairQueue.reasonCount || 0).toLocaleString()} repair reason(s) with a CSV worklist.`
        : "Run scripts/build-overview-import-repair-queue.js after the reviewed overview freshness audit.",
    },
    {
      id: "overview-rereview-packet",
      label: "Overview Re-review Packet",
      status:
        refreshedReports.find((item) => item.scriptName === "build-overview-rereview-packet.js")?.result.ok === false
          ? "blocker"
          : overviewRereviewPacket.ok
            ? "pass"
            : "warning",
      detail: overviewRereviewPacket.ok
        ? `${Number(overviewRereviewPacket.rowCount || 0).toLocaleString()} rejected overview rows exported with live overview, proposed copy, source URL, repair action, and dry-run command.`
        : "Run scripts/build-overview-rereview-packet.js after the overview import repair queue.",
    },
    {
      id: "overview-rereview-classification",
      label: "Overview Re-review Classification",
      status:
        refreshedReports.find((item) => item.scriptName === "classify-overview-rereview-packet.js")?.result.ok === false
          ? "blocker"
          : overviewRereviewClassification.ok
            ? "pass"
            : "warning",
      detail: overviewRereviewClassification.ok
        ? `${Number(overviewRereviewClassification.rowCount || 0).toLocaleString()} stale reviewed overview row(s) classified: ${Number(overviewRereviewClassification.summary?.liveReviewedSupersededCount || 0).toLocaleString()} are superseded by reviewed live copy and ${Number(overviewRereviewClassification.summary?.weakLiveSafeCandidateCount || 0).toLocaleString()} are weak-live safe candidates.`
        : "Run scripts/classify-overview-rereview-packet.js after building the re-review packet so stale rows are not force-imported blindly.",
    },
    {
      id: "editorial-credibility",
      label: "Editorial Credibility",
      status: editorialCredibility.ok ? "pass" : "blocker",
      detail: editorialCredibility.ok
        ? `${Number(editorialCredibility.storyCount || 0).toLocaleString()} newsroom stories verified for source links, claim status, owner, update policy, reviewed/updated dates, and corrections-policy visibility.`
        : "Run scripts/audit-editorial-credibility.js to verify newsroom metadata and corrections/update policy coverage.",
    },
    {
      id: "newsroom-internal-language",
      label: "Newsroom Internal Language",
      status:
        refreshedReports.find((item) => item.scriptName === "audit-newsroom-internal-language.js")?.result.ok === false
          ? "blocker"
          : newsroomInternalLanguage.ok
            ? "pass"
            : "blocker",
      detail: newsroomInternalLanguage.ok
        ? `${Number(newsroomInternalLanguage.storyCount || 0).toLocaleString()} newsroom stories scanned with no internal editorial instruction language exposed.`
        : "Run scripts/clean-newsroom-internal-language.js, then scripts/audit-newsroom-internal-language.js.",
    },
    {
      id: "newsroom-media-audit",
      label: "Newsroom Media Audit",
      status: newsroomMediaAuditRun.ok && newsroomMediaAudit.ok ? "pass" : "blocker",
      detail: newsroomMediaAudit.ok
        ? `${Number(newsroomMediaAudit.storyCount || 0).toLocaleString()} newsroom stories checked for media rights, captions, credits, source links, alt text, and official video embeds.`
        : "Run scripts/audit-newsroom-media.js to verify editorial media metadata and rights status before publication.",
    },
    {
      id: "newsroom-media-workplan",
      label: "Newsroom Media Workplan",
      status: newsroomMediaWorkplanRun.ok && newsroomMediaWorkplan.ok ? "pass" : "warning",
      detail: newsroomMediaWorkplan.ok
        ? `${Number(newsroomMediaWorkplan.targetCount || 0).toLocaleString()} newsroom article(s) identified for optional media-depth upgrades. Next: ${newsroomMediaWorkplan.recommendedNextStep}`
        : "Run scripts/build-newsroom-media-workplan.js to identify visually thin articles and recommended media modules.",
    },
    {
      id: "newsroom-structured-tables",
      label: "Newsroom Structured Tables",
      status: newsroomStructuredTablesAudit.ok && newsroomStructuredTables.ok ? "pass" : "blocker",
      detail: newsroomStructuredTables.ok
        ? `${Number(newsroomStructuredTables.structuredTableCount || 0).toLocaleString()} newsroom table block(s) stored as structured data; raw Markdown pipe-table syntax is blocked.`
        : "Run scripts/convert-newsroom-markdown-tables-to-structured-blocks.js, then scripts/audit-newsroom-structured-tables.js.",
    },
    {
      id: "newsroom-table-rendering",
      label: "Newsroom Table Rendering",
      status: newsroomTableRendering.ok ? "pass" : "blocker",
      detail: newsroomTableRendering.ok
        ? `${Number(newsroomTableRendering.tableBlockCount || 0).toLocaleString()} Markdown table fixture(s) verified to render as article tables without leaking separator rows.`
        : "Run scripts/audit-newsroom-table-rendering.js to verify Markdown tables render as tables instead of visible separator text.",
    },
    {
      id: "newsroom-preview-text",
      label: "Newsroom Preview Text",
      status: newsroomPreviewText.ok ? "pass" : "blocker",
      detail: newsroomPreviewText.ok
        ? `${Number(newsroomPreviewText.checkedCount || 0).toLocaleString()} article preview/text candidate(s) verified with no visible table separators, raw pipes, encoded spaces, or blank table-only teasers.`
        : "Run scripts/audit-newsroom-preview-text.js to verify article cards and search previews do not leak raw Markdown table syntax.",
    },
    {
      id: "newsroom-visible-markdown-leaks",
      label: "Newsroom Visible Markdown Leaks",
      status: newsroomVisibleMarkdownLeaks.ok ? "pass" : "blocker",
      detail: newsroomVisibleMarkdownLeaks.ok
        ? `${Number(newsroomVisibleMarkdownLeaks.checkedPageCount || 0).toLocaleString()} desktop/mobile page render(s) checked with no visible Markdown table separators or pipe-delimited table blobs.`
        : "Run scripts/audit-newsroom-visible-markdown-leaks.js against the local server to catch raw Markdown tables in articles, news cards, search results, and homepage modules.",
    },
    {
      id: "newsroom-image-uniqueness",
      label: "Newsroom Image Uniqueness",
      status: newsroomImageUniquenessAudit.ok && newsroomImageUniqueness.ok ? "pass" : "blocker",
      detail: newsroomImageUniqueness.ok
        ? `${Number(newsroomImageUniqueness.imageUseCount || 0).toLocaleString()} newsroom hero/media image use(s) checked; no image URL is reused across different article IDs.`
        : newsroomImageUniqueness.recommendedNextStep || "Run scripts/audit-newsroom-image-uniqueness.js to catch duplicated images across articles.",
    },
    {
      id: "newsroom-editorial-readthrough",
      label: "Released Article Readthrough",
      status:
        newsroomEditorialReadthroughRun.ok && newsroomEditorialReadthrough.ok
          ? Number(newsroomEditorialReadthrough.articlesNeedingEditorialPass || 0)
            ? "warning"
            : "pass"
          : "blocker",
      detail: newsroomEditorialReadthrough.ok
        ? Number(newsroomEditorialReadthrough.articlesNeedingEditorialPass || 0)
          ? `${Number(newsroomEditorialReadthrough.releasedArticleCount || 0).toLocaleString()} released article(s) inventoried; ${Number(newsroomEditorialReadthrough.articlesNeedingEditorialPass || 0).toLocaleString()} have media/source/pacing items to review.`
          : `${Number(newsroomEditorialReadthrough.releasedArticleCount || 0).toLocaleString()} released article(s) passed structured editorial QA for metadata, sourcing, media depth, and pacing.`
        : "Run scripts/build-newsroom-editorial-readthrough.js to create the released-article editorial QA packet.",
    },
    {
      id: "newsroom-official-media-queue",
      label: "Official Media Replacement Queue",
      status: newsroomOfficialMediaQueueRun.ok && newsroomOfficialMediaQueue.ok ? (newsroomOfficialMediaQueue.queueCount ? "warning" : "pass") : "blocker",
      detail: newsroomOfficialMediaQueue.ok
        ? newsroomOfficialMediaQueue.queueCount
          ? `${Number(newsroomOfficialMediaQueue.queueCount || 0).toLocaleString()} newsroom article(s) still use temporary fallback art and need official screenshots, key art, or trailer thumbnails before heavy promotion.`
          : "No newsroom stories are waiting on official-media replacement."
        : "Run scripts/build-newsroom-official-media-queue.js to produce the official-media replacement queue.",
    },
    {
      id: "newsroom-promotion-readiness",
      label: "Newsroom Promotion Readiness",
      status: newsroomPromotionReadinessRun.ok && promotionReadiness.ok ? (promotionReadiness.warningCount ? "warning" : "pass") : "blocker",
      detail: promotionReadiness.ok
        ? promotionReadiness.warningCount
          ? `${Number(promotionReadiness.warningCount || 0).toLocaleString()} prominent homepage/news placement(s) point at articles that still need editorial/media polish before heavy launch promotion.`
          : "Prominent homepage/news placements are clear for heavy launch promotion."
        : "Run scripts/audit-newsroom-promotion-readiness.js to check whether promoted articles are launch-polished.",
    },
    {
      id: "article-visual-quality",
      label: "Article Visual Quality",
      status:
        articleVisualQualityRun.ok && articleVisualQuality.ok
          ? Number(articleVisualQuality.warningCount || 0)
            ? "warning"
            : "pass"
          : "blocker",
      detail: articleVisualQuality.ok
        ? Number(articleVisualQuality.warningCount || 0)
          ? `${Number(articleVisualQuality.articleCount || 0).toLocaleString()} article(s) audited; ${Number(articleVisualQuality.warningCount || 0).toLocaleString()} presentation warning(s) remain.`
          : `${Number(articleVisualQuality.articleCount || 0).toLocaleString()} article(s) audited for raw table leaks, unsafe hero media, duplicate imagery, and pacing risks.`
        : "Run scripts/audit-article-visual-quality.js to check article presentation risks before launch.",
    },
    {
      id: "article-image-duplicates",
      label: "Article Image Duplicates",
      status: articleImageDuplicates.ok ? "pass" : "blocker",
      detail: articleImageDuplicates.ok
        ? `${Number(articleImageDuplicates.storyCount || 0).toLocaleString()} article page(s) checked with ${Number(articleImageDuplicates.checkedImageCount || 0).toLocaleString()} rendered article image(s); no duplicate or broken article images found.`
        : "Run scripts/audit-article-image-duplicates.js against the local server to catch repeated hero/body imagery and broken article media.",
    },
    {
      id: "article-table-ui",
      label: "Article Table UI",
      status: articleTableUi.ok ? "pass" : "blocker",
      detail: articleTableUi.ok
        ? `${Number(articleTableUi.storyCount || 0).toLocaleString()} article page(s) with Markdown tables verified in browser for rendered table markup and no visible separator rows.`
        : "Run scripts/audit-article-table-ui.js against the local server to verify table-heavy articles render correctly in the browser.",
    },
    {
      id: "pokemon-set-quality",
      label: "Pokemon Set Quality",
      status: pokemonSetQuality.ok ? "pass" : "blocker",
      detail: pokemonSetQuality.ok
        ? `${Number(pokemonSetQuality.totalSets || 0).toLocaleString()} Pokemon sets checked with no duplicate IDs/names; main view separates ${Number(pokemonSetQuality.supplementalSets || 0).toLocaleString()} supplemental products/subsets.`
        : "Run scripts/audit-pokemon-set-quality.js to inspect Pokemon set duplicates and main-view filtering.",
    },
    {
      id: "game-image-import-safety",
      label: "Game Image Import Safety",
      status: gameImageImportSafety.ok ? "pass" : "blocker",
      detail: gameImageImportSafety.ok
        ? "Manual cover-art imports require source/provider fields, approved review status, reviewer, and dry-run coverage impact reporting before accepting a row."
        : "Run scripts/audit-game-image-import-safety.js to verify reviewed cover-art import guardrails.",
    },
    {
      id: "game-image-provenance",
      label: "Game Image Provenance",
      status: gameImageProvenance.ok && Number(gameImageProvenance.totals?.missingProvider || 0) === 0 && Number(gameImageProvenance.totals?.missingSource || 0) === 0 ? "pass" : "blocker",
      detail: gameImageProvenance.ok
        ? `${Number(gameImageProvenance.totals?.images || 0).toLocaleString()} game images audited; ${Number(gameImageProvenance.totals?.providerPct || 0).toLocaleString()}% have provider labels and ${Number(gameImageProvenance.totals?.sourcePct || 0).toLocaleString()}% have source URLs.`
        : "Run scripts/backfill-game-image-providers.js and scripts/audit-game-image-provenance.js to verify game image source/provider coverage.",
    },
    {
      id: "priority-image-review-batches",
      label: "Image Review Batches",
      status: priorityImageReviewBatches.ok ? "pass" : "blocker",
      detail: priorityImageReviewBatches.ok
        ? `${Number(priorityImageReviewBatches.batchCount || 0).toLocaleString()} cover-art review files verified with ${Number(priorityImageReviewBatches.rowTotal || 0).toLocaleString()} CSV rows; milestone batches are duplicate-free, nested, and matched to the current missing-image queue.`
        : "Run scripts/audit-priority-image-review-batches.js to verify generated platform image review batches.",
    },
    {
      id: "game-image-import-readiness",
      label: "Image Import Readiness",
      status: gameImageImportReadiness.ok ? (Number(gameImageImportReadiness.totals?.readyToImport || 0) ? "pass" : "warning") : "blocker",
      detail: gameImageImportReadiness.ok
        ? Number(gameImageImportReadiness.totals?.readyToImport || 0)
          ? `${Number(gameImageImportReadiness.totals.readyToImport).toLocaleString()} approved cover-art row(s) are ready to import across ${Number(gameImageImportReadiness.readyBatchCount || 0).toLocaleString()} batch file(s).`
          : [
              `No approved cover-art rows are ready to import; MobyGames key ${gameImageImportReadiness.providerKeys?.mobygames ? "is configured" : "is not configured"}.`,
              latestGameImageReviewWorkplan.recommendedNextStep ? `Next reviewed-source move: ${latestGameImageReviewWorkplan.recommendedNextStep}` : gameImageImportReadiness.nextAction,
            ]
              .filter(Boolean)
              .join(" ")
        : gameImageImportReadiness.failures?.join(" ") || "Run scripts/audit-game-image-import-readiness.js to verify image review CSV import readiness.",
    },
    {
      id: "pricecharting-candidate-guardrails",
      label: "PriceCharting Candidate Guardrails",
      status: priceChartingCandidateGuardrailsAudit.ok ? "pass" : "blocker",
      detail: priceChartingCandidateGuardrailsAudit.ok
        ? "PriceCharting review candidates are checked for both title match and platform label before they can be treated as safe."
        : "Run scripts/audit-pricecharting-candidate-guardrails.js to verify wrong-platform cover candidates are rejected.",
    },
    {
      id: "provider-dry-run-limits",
      label: "Provider Dry-Run Limits",
      status: (providerDryRunLimitsAudit.report || providerDryRunLimits).ok ? "pass" : "blocker",
      detail: (providerDryRunLimitsAudit.report || providerDryRunLimits).ok
        ? "MobyGames and RAWG provider dry-run commands are verified to stay limited to one platform and ten rows per platform before any real API call."
        : "Run scripts/audit-provider-dry-run-limits.js to verify limited provider dry-run commands before adding bulk image provider keys.",
    },
    {
      id: "game-image-review-workplan",
      label: "Game Image Review Workplan",
      status: imageReviewWorkplanAudit.ok && latestGameImageReviewWorkplan.ok ? "pass" : "warning",
      detail: latestGameImageReviewWorkplan.ok
        ? `${Number(latestGameImageReviewWorkplan.totals?.finishableRecordCount || 0).toLocaleString()} finishable image row(s) staged across ${Number(latestGameImageReviewWorkplan.totals?.finishableTargetCount || 0).toLocaleString()} near-complete platform(s). Next: ${latestGameImageReviewWorkplan.recommendedNextStep}`
        : "Run scripts/build-game-image-review-workplan.js to identify finishable platforms and milestone review batches.",
    },
    {
      id: "game-image-coverage-plan",
      label: "Image Coverage Plan",
      status: gameImageCoveragePlan.ok ? "pass" : "blocker",
      detail: gameImageCoveragePlan.ok
        ? `Game image milestones verified for 90%, 95%, and 100%; next target needs ${Number((gameImageCoveragePlan.milestones || [])[0]?.additionalImagesNeeded || 0).toLocaleString()} reviewed cover images${firstMilestoneBatch(priorityImageReviewBatches)?.path ? ` in ${firstMilestoneBatch(priorityImageReviewBatches).path}` : ""}.`
        : "Run scripts/build-game-image-coverage-plan.js and scripts/audit-game-image-coverage-plan.js to verify image coverage milestones.",
    },
    {
      id: "image-queue-workflow-ui",
      label: "Image Queue Workflow UI",
      status: imageQueueWorkflowUi.ok ? "pass" : "blocker",
      detail: imageQueueWorkflowUi.ok
        ? "Image queue renders coverage milestones, provider readiness, platform filter shortcuts, queue records, and 390px mobile fit."
        : "Run scripts/audit-image-queue-workflow-ui.js to verify the missing-image review workbench.",
    },
    {
      id: "game-image-fallback-ui",
      label: "Game Image Fallback UI",
      status: gameImageFallbackUi.ok ? "pass" : "blocker",
      detail: gameImageFallbackUi.ok
        ? `${Number(gameImageFallbackUi.checkedPages || 0).toLocaleString()} high-backlog game library page(s) verified that missing covers render as clean pending-review placeholders at 390px.`
        : "Run scripts/audit-game-image-fallback-ui.js against the local server to verify missing cover art does not look broken.",
    },
    {
      id: "game-detail-image-rendering",
      label: "Game Detail Image Rendering",
      status: gameDetailImageRendering.ok ? "pass" : "blocker",
      detail: gameDetailImageRendering.ok
        ? `${Number(gameDetailImageRendering.checked || 0).toLocaleString()} ${gameDetailImageRendering.platform || "game"} detail page image(s) verified in Chrome at 390px with loaded covers and no horizontal overflow.`
        : "Run scripts/audit-game-detail-image-rendering.js against the local server to verify assigned cover art loads in the browser without mobile overflow.",
    },
    {
      id: "overview-queue-workflow-ui",
      label: "Overview Queue Workflow UI",
      status: overviewQueueWorkflowUi.ok ? "pass" : "blocker",
      detail: overviewQueueWorkflowUi.ok
        ? "Overview queue renders rewrite batches, weak-overview records, filters, import guidance, and 390px mobile fit."
        : "Run scripts/audit-overview-queue-workflow-ui.js to verify the editorial overview rewrite workbench.",
    },
    {
      id: "public-game-overview-gating",
      label: "Public Game Overview Gating",
      status: publicGameOverviewGating.ok ? "pass" : "blocker",
      detail: publicGameOverviewGating.ok
        ? `${Number(publicGameOverviewGating.checkedListPages || 0).toLocaleString()} platform list page(s) and ${Number(publicGameOverviewGating.checkedPages || 0).toLocaleString()} weak/template overview detail page sample(s) verified to show editorial-review messaging instead of unfinished metadata copy.`
        : "Run scripts/audit-public-game-overview-gating.js against the local server to verify weak game overviews are not presented as finished public copy.",
    },
    {
      id: "data-health-launch-readiness-ui",
      label: "Data Health Launch UI",
      status: dataHealthLaunchReadinessUi.ok ? "pass" : "blocker",
      detail: dataHealthLaunchReadinessUi.ok
        ? "Data Health renders launch gates, next actions, coverage milestone, overview quality, image provenance, and 390px mobile fit."
        : "Run scripts/audit-data-health-launch-readiness-ui.js through scripts/run-launch-checks.js to verify the Data Health control room.",
    },
    {
      id: "form-disclosures",
      label: "Consent and Form Disclosures",
      status: formAudit.ok ? "pass" : "blocker",
      detail: formAudit.ok ? "Lead/account/community forms include launch privacy/beta disclosure copy." : formAudit.message,
    },
    {
      id: "staff-moderation-actions",
      label: "Staff Moderation Controls",
      status: staffModerationActions.ok ? "pass" : "blocker",
      detail: staffModerationActions.ok
        ? "Isolated staff fixture loaded moderation queues, updated a reported post, resolved the linked report, and restored local data."
        : "Run scripts/audit-staff-moderation-actions.js to verify staff moderation actions and rollback behavior.",
    },
    {
      id: "admin-ui-access",
      label: "Signed-Out Admin UI",
      status: adminUiAccess.ok ? "pass" : "blocker",
      detail: adminUiAccess.ok
        ? `Signed-out community admin page shows staff sign-in messaging, hides staff action buttons, disables ${Number(adminUiAccess.disabledControls || 0).toLocaleString()} closeout control(s), and fits at 390px.`
        : "Run scripts/audit-admin-ui-access.js to verify signed-out staff pages do not expose moderation controls.",
    },
    {
      id: "auth-admin-hardening",
      label: "Auth and Admin Hardening",
      status: authAdminHardeningAudit.ok && (authAdminHardeningAudit.report || authAdminHardening).ok ? "pass" : "blocker",
      detail:
        authAdminHardeningAudit.ok && (authAdminHardeningAudit.report || authAdminHardening).ok
          ? `${Number((authAdminHardeningAudit.report || authAdminHardening).checks?.length || 0).toLocaleString()} auth/admin hardening checks verified staff gates, public profile privacy, stale session cleanup, browser key hygiene, and Supabase profile role safety.`
          : (authAdminHardeningAudit.report || authAdminHardening).failures?.slice(0, 3).map((failure) => failure.detail).join(" ") || "Run scripts/audit-auth-admin-hardening.js to verify staff gates and auth hardening.",
    },
    {
      id: "moderation-operations-readiness",
      label: "Moderation Operations Readiness",
      status: moderationOperationsReadiness.ok ? "pass" : "blocker",
      detail: moderationOperationsReadiness.ok
        ? "Moderation operations checklist and staff surfaces cover access control, queue coverage, review notes, evidence retention, marketplace abuse categories, and data-restoring fixture audits."
        : "Run scripts/audit-moderation-operations-readiness.js to verify moderation operations readiness.",
    },
    {
      id: "community-test-fixtures",
      label: "Community Test Fixtures",
      status: communityTestFixtures.ok ? "pass" : "blocker",
      detail: communityTestFixtures.ok
        ? "Local community data is free of launch/auth/Supabase smoke-test artifacts and orphan sessions."
        : "Run scripts/clean-community-test-fixtures.js, then scripts/audit-community-test-fixtures.js to remove launch/auth/Supabase smoke-test records from local community data.",
    },
    {
      id: "sensitive-api-headers",
      label: "Sensitive API Headers",
      status: sensitiveApiHeaders.ok ? "pass" : "blocker",
      detail: sensitiveApiHeaders.ok
        ? `${Number((sensitiveApiHeaders.checks || []).length).toLocaleString()} auth/admin/community API responses verified as JSON, no-store, and security-header protected.`
        : "Run scripts/audit-sensitive-api-headers.js through scripts/run-launch-checks.js to verify sensitive API cache/security headers.",
    },
    {
      id: "server-health-contract",
      label: "Server Health Contract",
      status: serverHealthContract.ok ? "pass" : "blocker",
      detail: serverHealthContract.ok
        ? `/api/health reports launch status ${serverHealthContract.status}, ${Number(serverHealthContract.warnings || 0).toLocaleString()} warning(s), ${Number(serverHealthContract.staleFiles || 0).toLocaleString()} stale Supabase snapshot(s), and ${Number(serverHealthContract.checkedLinks || 0).toLocaleString()} checked runtime link(s) without exposing sensitive fields.`
        : "Run scripts/audit-server-health-contract.js through scripts/run-launch-checks.js after starting the local server.",
    },
    {
      id: "public-profile-privacy",
      label: "Public Profile Privacy",
      status: publicProfilePrivacy.ok ? "pass" : "blocker",
      detail: publicProfilePrivacy.ok
        ? "Public community profile, feed, and discovery responses do not expose staff roles, account data, or session fields."
        : "Public profile/community responses may expose sensitive fields; rerun scripts/audit-public-profile-privacy.js after patching response shapes.",
    },
    {
      id: "community-write-rate-limits",
      label: "Community Write Rate Limits",
      status: communityWriteRateLimits.ok ? "pass" : "blocker",
      detail: communityWriteRateLimits.ok
        ? `${Number(communityWriteRateLimits.checkedSurfaces || 0).toLocaleString()} public write surface(s) verified to require auth first and return HTTP 429 with Retry-After after repeated attempts.`
        : "Run scripts/audit-community-write-rate-limits.js through scripts/run-launch-checks.js to verify public community/news write throttles.",
    },
    {
      id: "auth-page-ux",
      label: "Auth Page UX",
      status: authPageUx.ok ? "pass" : "blocker",
      detail: authPageUx.ok
        ? "Sign-in page verified for password-manager hints, password toggles, social-provider placeholder messaging, signup disclosures, and 390px mobile fit."
        : "Run scripts/audit-auth-page-ux.js through scripts/run-launch-checks.js to verify sign-in page launch UX.",
    },
    {
      id: "client-auth-storage-hygiene",
      label: "Client Auth Storage Hygiene",
      status: clientAuthStorageHygiene.ok ? "pass" : "blocker",
      detail: clientAuthStorageHygiene.ok
        ? "Auth page and global header stamp stored sessions, clear stale browser tokens, and render signed-out state without console errors."
        : "Run scripts/audit-client-auth-storage-hygiene.js to verify browser-side auth token cleanup.",
    },
    {
      id: "local-session-token-storage",
      label: "Local Session Token Storage",
      status: localSessionTokenStorage.ok ? "pass" : "blocker",
      detail: localSessionTokenStorage.ok
        ? localSessionTokenStorage.skipped
          ? "Supabase Auth target skipped local fallback token-storage check."
          : "Local fallback signup stores hashed session tokens, authenticates with the returned bearer token, and invalidates it on logout without persisting the raw token."
        : "Run scripts/audit-local-session-token-storage.js through scripts/run-launch-checks.js to verify local fallback sessions are not stored as raw bearer tokens.",
    },
    {
      id: "legacy-raw-session-rejection",
      label: "Legacy Raw Session Rejection",
      status: legacyRawSessionRejection.ok ? "pass" : "blocker",
      detail: legacyRawSessionRejection.ok
        ? "Local fallback auth rejects legacy raw-token-only session records and requires hashed session tokens."
        : "Run scripts/audit-legacy-raw-session-rejection.js to verify old raw-token session records cannot authenticate.",
    },
    {
      id: "accessibility-basics",
      label: "Accessibility Basics",
      status: accessibilityBasics.ok ? "pass" : "blocker",
      detail: accessibilityBasics.ok
        ? `${Number(accessibilityBasics.checkedPages || 0).toLocaleString()} core pages verified for titles, one H1, language/viewport tags, image alt text, labeled form fields, accessible controls, console health, and 390px mobile fit.`
        : "Run scripts/audit-accessibility-basics.js through scripts/run-launch-checks.js to verify core page accessibility basics.",
    },
    {
      id: "runtime-links",
      label: "Runtime Internal Links",
      status: runtimeLinks.ok ? "pass" : "blocker",
      detail: runtimeLinks.ok
        ? `${Number(runtimeLinks.checkedLinks || 0).toLocaleString()} internal links checked across ${Number((runtimeLinks.seedPages || []).length || 0).toLocaleString()} rendered seed page(s) with no broken links, console errors, or mobile overflow.`
        : "Run scripts/audit-runtime-links.js through scripts/run-launch-checks.js to verify rendered internal links and mobile fit.",
    },
    {
      id: "content-quality",
      label: "Content and Image Quality",
      status: contentQuality.status,
      detail: contentQuality.detail,
    },
    {
      id: "image-url-health",
      label: "Image URL Health",
      status: Number(imageHealth.failed || 0) === 0 ? "pass" : "warning",
      detail: `${Number(imageHealth.ok || 0).toLocaleString()} sampled image URLs OK; ${Number(imageHealth.failed || 0).toLocaleString()} failed; ${Number(imageHealth.deferred || 0).toLocaleString()} deferred.`,
    },
    {
      id: "rendered-image-performance",
      label: "Rendered Image Performance",
      status: performanceImageBasics.ok ? "pass" : "warning",
      detail: performanceImageBasics.ok
        ? `${Number(performanceImageBasics.assetCount || 0).toLocaleString()} local news assets within budget; tested pages had no broken rendered images, missing image attributes, or mobile overflow.`
        : "Run scripts/audit-performance-image-basics.js through scripts/run-launch-checks.js to refresh rendered image performance evidence.",
    },
    {
      id: "image-text-layout-system",
      label: "Image/Text Layout System",
      status: (imageTextLayoutAudit.report || imageTextLayoutSystem).ok ? "pass" : "blocker",
      detail: (imageTextLayoutAudit.report || imageTextLayoutSystem).ok
        ? `${Number((imageTextLayoutAudit.report || imageTextLayoutSystem).checkedComponentCount || 0).toLocaleString()} image-heavy components checked across ${Number((imageTextLayoutAudit.report || imageTextLayoutSystem).checkedResults || 0).toLocaleString()} Chrome viewport/page runs with no overlap, clipping, SVG-lead, or mobile overflow failures.`
        : `${Number((imageTextLayoutAudit.report || imageTextLayoutSystem).failures?.length || 0).toLocaleString()} image/text layout failure(s) found. Run scripts/audit-image-text-layout-system.js for details.`,
    },
    {
      id: "prominent-news-official-media",
      label: "Prominent News Official Media",
      status: prominentNewsOfficialMedia.ok ? "pass" : "blocker",
      detail: prominentNewsOfficialMedia.ok
        ? `${Number(prominentNewsOfficialMedia.prominentSlotCount || 0).toLocaleString()} homepage/news lead slots verified against fallback, SVG, and official-media warning use.`
        : "Run scripts/audit-prominent-news-official-media.js; prominent news slots must use approved official media instead of fallback/generated art.",
    },
  ];

  const blockers = gates.filter((gate) => gate.status === "blocker");
  const warnings = gates.filter((gate) => gate.status === "warning");
  const report = {
    generatedAt: new Date().toISOString(),
    launchReady: blockers.length === 0,
    status: blockers.length ? "blocked" : warnings.length ? "ready-with-warnings" : "ready",
    gates,
    blockers,
    warnings,
    contentQuality,
    localCommunityCounts: {
      accounts: (community.accounts || []).length,
      sessions: (community.sessions || []).length,
      profiles: (community.profiles || []).length,
      posts: (community.posts || []).length,
      comments: (community.comments || []).length,
      sponsorLeads: (community.sponsorLeads || []).length,
    },
    nextActions: [
      ...(supabaseAuth.report?.ready ? [] : ["Finish Supabase Auth setup and rerun scripts/validate-supabase-auth-setup.js."]),
      ...(supabaseLaunch.report?.ready ? [] : ["Run supabase/gcx-launch-data-foundation.sql in Supabase, then rerun scripts/validate-supabase-launch-data-setup.js."]),
      ...(supabasePublicSurface.ok ? [] : ["Run supabase/gcx-launch-hardening.sql in Supabase, then rerun scripts/audit-supabase-public-surface.js."]),
      ...((authAdminHardeningAudit.report || authAdminHardening).ok ? [] : ["Fix auth/admin hardening failures, then rerun scripts/audit-auth-admin-hardening.js."]),
      ...(publicProfilePrivacy.ok ? [] : ["Fix public profile/feed/discovery API response shapes, then rerun scripts/audit-public-profile-privacy.js."]),
      ...(prominentNewsOfficialMedia.ok
        ? []
        : ["Fix homepage/news lead story media so prominent gaming slots use official screenshots/key art/trailer imagery, then rerun scripts/audit-prominent-news-official-media.js."]),
      ...(newsroomEditorialReadthrough.ok
        ? Number(newsroomEditorialReadthrough.articlesNeedingEditorialPass || 0)
          ? [
              `Resolve editorial QA items for ${Number(newsroomEditorialReadthrough.articlesNeedingEditorialPass || 0).toLocaleString()} released article(s), starting with data/launch-readiness/newsroom-editorial-readthrough.md.`,
            ]
          : []
        : ["Run scripts/build-newsroom-editorial-readthrough.js to produce the released-article read-through queue."]),
      ...(newsroomOfficialMediaQueue.queueCount
        ? [
            `Replace official media for ${Number(newsroomOfficialMediaQueue.queueCount || 0).toLocaleString()} newsroom article(s), starting with data/launch-readiness/newsroom-official-media-queue.md.`,
          ]
        : []),
      ...(articleVisualQuality.ok
        ? Number(articleVisualQuality.warningCount || 0)
          ? [
              `Resolve ${Number(articleVisualQuality.warningCount || 0).toLocaleString()} article visual-quality warning(s), starting with data/launch-readiness/article-visual-quality.md.`,
            ]
          : []
        : ["Run scripts/audit-article-visual-quality.js to produce the article visual-quality report."]),
      ...(promotionReadiness.warningCount
        ? [
            `Promotion cleanup first move: review ${Number(promotionReadiness.warningCount || 0).toLocaleString()} prominent homepage/news placement(s) in data/launch-readiness/newsroom-promotion-readiness.json before treating them as launch-featured stories.`,
          ]
        : []),
      ...(supabaseAuth.report?.ready && !supabaseAuthLiveSession.ok ? ["Run scripts/audit-supabase-auth-live-session.js to verify the live Supabase login/session/refresh/logout path before public traffic."] : []),
      ...(supabaseLaunch.report?.ready && !supabaseLivePersistence.ok ? ["Run scripts/audit-supabase-live-persistence.js to verify remote newsletter, waitlist, marketplace-intent, and sponsor-lead writes before public traffic."] : []),
      ...(contentQuality.status === "pass"
        ? []
        : [
            latestGameImageReviewWorkplan.recommendedNextStep
              ? `Image cleanup first move: ${latestGameImageReviewWorkplan.recommendedNextStep} Larger milestone remains: ${contentQuality.nextStep}`
              : gameImageImportReadiness.nextAction
                ? `${contentQuality.nextStep} ${gameImageImportReadiness.nextAction}`
              : contentQuality.nextStep,
          ]),
      ...(gameOverviewQuality.reviewNeeded && !weakOverviewsArePubliclyGated
        ? [
            gameOverviewReviewWorkplan.recommendedNextStep
              ? `Overview cleanup first move: ${gameOverviewReviewWorkplan.recommendedNextStep}`
              : gameOverviewRewriteBatches.ok
                ? `Work the overview rewrite queue: ${Number(gameOverviewRewriteBatches.rowTotal || 0).toLocaleString()} priority rows are ready across ${Number(gameOverviewRewriteBatches.batchCount || 0).toLocaleString()} platform CSVs.`
              : `Plan an editorial rewrite pass for ${Number(gameOverviewQuality.totals?.weakTemplateCount || 0).toLocaleString()} weak/template-style game overviews after the next cover-art milestone.`,
          ]
        : []),
      "Keep marketplace trading and payments beta-disabled until legal, dispute, refund, and moderation rules are reviewed.",
    ],
  };

  return report;
}

function writeMarkdown(report) {
  const lines = [
    "# GCX Launch Readiness",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    "## Gates",
    "",
    "| Gate | Status | Detail |",
    "| --- | --- | --- |",
    ...report.gates.map((gate) => `| ${gate.label} | ${statusIcon(gate.status)} | ${String(gate.detail || "").replace(/\|/g, "\\|")} |`),
    "",
    "## Content Quality",
    "",
    `- Game image coverage: ${pct(report.contentQuality.metrics.imagePct)} (${report.contentQuality.metrics.missingImages.toLocaleString()} missing)`,
    `- Game overview coverage: ${pct(report.contentQuality.metrics.overviewPct)} (${report.contentQuality.metrics.missingOverviews.toLocaleString()} missing)`,
    "",
    "## Top Image Backlog",
    "",
    ...report.contentQuality.topImageBacklog.slice(0, 10).map((item) => `- ${item.platform}: ${Number(item.missingImages || 0).toLocaleString()} missing (${pct(item.imagePct)} covered)`),
    "",
    "## Next Actions",
    "",
    ...report.nextActions.map((action) => `- ${action}`),
    "",
  ];
  fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`);
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const report = buildReport();
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeMarkdown(report);
  console.log(
    JSON.stringify(
      {
        ok: true,
        status: report.status,
        launchReady: report.launchReady,
        blockers: report.blockers.map((gate) => gate.label),
        warnings: report.warnings.map((gate) => gate.label),
        jsonPath: path.relative(rootDir, jsonPath),
        markdownPath: path.relative(rootDir, markdownPath),
      },
      null,
      2
    )
  );
  if (report.blockers.length) process.exitCode = 1;
}

main();
