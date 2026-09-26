const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-overview-review-workplan.json");

function readJson(relativePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function importCommands(batchPath) {
  return {
    dryRun: `node scripts/import-game-overview-rewrites.js ${batchPath} --dry-run`,
    import: `node scripts/import-game-overview-rewrites.js ${batchPath}`,
  };
}

function percent(value) {
  return Number(value || 0);
}

function main() {
  const quality = readJson("data/launch-readiness/game-overview-quality.json", {});
  const batchIndex = readJson("data/games/overview-rewrite-batches.json", { batches: [] });
  const rewriteAudit = readJson("data/launch-readiness/game-overview-rewrite-batches.json", {});
  const importFreshness = readJson("data/launch-readiness/reviewed-overview-import-freshness.json", {});
  const rereviewClassification = readJson("data/launch-readiness/overview-rereview-classification.json", {});

  const platforms = (quality.platforms || []).map((platform) => ({
    platformSlug: platform.platform,
    total: Number(platform.total || 0),
    weakTemplateCount: Number(platform.weakTemplateCount || 0),
    weakTemplatePct: percent(platform.weakTemplatePct),
    reviewedEditorialCount: Number(platform.reviewedEditorialCount || 0),
    reviewedEditorialPct: percent(platform.reviewedEditorialPct),
    topProviders: platform.topProviders || [],
    samples: platform.samples || [],
  }));

  const rewriteTargets = (batchIndex.batches || []).map((batch) => {
    const platform = platforms.find((item) => item.platformSlug === batch.platformSlug) || {};
    return {
      type: "overview-rewrite-batch",
      platformSlug: batch.platformSlug,
      platformLabel: batch.platformLabel,
      priorityRank: Number(batch.priorityRank || 0),
      weakOverviewCount: Number(batch.weakOverviewCount || platform.weakTemplateCount || 0),
      weakOverviewPct: percent(platform.weakTemplatePct),
      reviewedEditorialCount: Number(platform.reviewedEditorialCount || 0),
      records: Number(batch.records || 0),
      batchPath: batch.path,
      ...importCommands(batch.path),
    };
  });

  const topRiskPlatforms = [...platforms]
    .filter((platform) => platform.weakTemplateCount > 0)
    .sort((a, b) => b.weakTemplateCount - a.weakTemplateCount || b.weakTemplatePct - a.weakTemplatePct)
    .slice(0, 12);
  const nextRewriteTarget = rewriteTargets[0] || null;
  const pendingImports = Number(importFreshness.totals?.wouldImport || 0);
  const supersededStaleRows = Number(rereviewClassification.summary?.liveReviewedSupersededCount || 0);
  const weakLiveSafeCandidates = Number(rereviewClassification.summary?.weakLiveSafeCandidateCount || 0);

  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    totals: {
      weakTemplateCount: Number(quality.totals?.weakTemplateCount ?? rewriteAudit.totalWeakOverviews ?? batchIndex.totalWeakOverviews ?? 0),
      reviewedEditorialCount: Number(quality.totals?.reviewedEditorialCount || 0),
      rewriteBatchCount: Number(rewriteAudit.batchCount ?? rewriteTargets.length),
      rewriteRowCount: Number(rewriteAudit.rowTotal ?? batchIndex.totalRecords ?? 0),
      pendingReviewedImports: pendingImports,
      supersededStaleRows,
      weakLiveSafeCandidates,
    },
    nextRewriteTarget,
    rewriteTargets,
    topRiskPlatforms,
    rules: [
      "Rewrite the newOverview field with unique, game-specific copy that describes gameplay, structure, hook, and collector context when useful.",
      "Do not use generic templates, internal GCX/Codex instructions, or source-summary language as public overviews.",
      "Fill reviewStatus as approved, verified, or reviewed and add a reviewer before dry-run import.",
      "Run the dry-run import first; import only if the currentOverview freshness check passes and the report has no unexpected rejected rows.",
      "Do not force-import stale reviewed rows that are already superseded by reviewed live copy.",
    ],
    recommendedNextStep: pendingImports
      ? "Dry-run the pending reviewed overview imports before writing new copy."
      : nextRewriteTarget
        ? `Rewrite and review ${nextRewriteTarget.records} rows in ${nextRewriteTarget.batchPath} for ${nextRewriteTarget.platformLabel}; then run ${nextRewriteTarget.dryRun}.`
        : Number(quality.totals?.weakTemplateCount || 0) === 0
          ? "No weak/template-style overviews remain in the current quality audit. Continue spot-checking public platform pages and focus launch work on image coverage."
          : "No overview rewrite batches are currently available. Rebuild the overview rewrite batches.",
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
}

main();
