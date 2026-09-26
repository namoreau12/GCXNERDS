const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-image-review-workplan.json");
const markdownOutputPath = path.join(rootDir, "data", "launch-readiness", "game-image-review-workplan.md");

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

function writeTextAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, value, "utf8");
  fs.renameSync(tempPath, filePath);
}

function table(rows, columns) {
  const escapeCell = (value) => String(value ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => escapeCell(column.value(row))).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function buildMarkdown(report) {
  const finishableRows = report.finishableTargets.slice(0, 8);
  const priorityRows = report.priorityTargets.slice(0, 8);
  const milestoneRows = report.milestoneTargets;
  const columns = [
    { label: "Target", value: (row) => row.platformLabel || `${row.targetPct}% coverage` },
    { label: "Missing/Rows", value: (row) => row.missingImages ?? row.records },
    { label: "Current coverage", value: (row) => (row.imagePct ? `${row.imagePct}%` : `${row.currentPct}%`) },
    { label: "Batch", value: (row) => row.batchPath },
    { label: "Provider state", value: (row) => (row.needsExternalProvider ? row.providerNextRecommended : "Manual review rows can continue") },
  ];

  return [
    "# Game Image Review Workplan",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Current State",
    "",
    `- Image coverage: ${report.totals.imagePct}%`,
    `- Missing images: ${report.totals.missingImages.toLocaleString()}`,
    `- Import-ready reviewed rows: ${report.totals.readyRows.toLocaleString()}`,
    `- Finishable platform rows prepared: ${report.totals.finishableRecordCount.toLocaleString()}`,
    "",
    "## Recommended Next Step",
    "",
    report.recommendedNextStep,
    "",
    "## Import-Safe Row Requirements",
    "",
    "A row should not be imported until it has all of these fields filled and reviewed:",
    "",
    "- `imageUrl`: direct image URL",
    "- `imageSourceUrl`: page or API source URL where the image was reviewed",
    "- `imageProvider`: provider/source name",
    "- `reviewStatus`: `approved`, `verified`, or `reviewed`",
    "- `reviewer`: person or process that approved the row",
    "",
    "Use the dry-run command before any real import:",
    "",
    "```powershell",
    report.nextMilestone?.dryRun || "node scripts/import-game-image-urls.js <batch.csv> --dry-run --validate-remote",
    "```",
    "",
    "## Finishable Platform Batches",
    "",
    table(finishableRows, columns),
    "",
    "## Priority Platform Batches",
    "",
    table(priorityRows, columns),
    "",
    "## Coverage Milestones",
    "",
    table(milestoneRows, [
      { label: "Target", value: (row) => `${row.targetPct}%` },
      { label: "Additional images needed", value: (row) => row.additionalImagesNeeded },
      { label: "Rows", value: (row) => row.records },
      { label: "Platforms", value: (row) => row.platforms.join(", ") },
      { label: "Batch", value: (row) => row.batchPath },
    ]),
    "",
    "## Guardrails",
    "",
    ...report.rules.map((rule) => `- ${rule}`),
    "",
  ].join("\n");
}

function importCommands(batchPath) {
  return {
    dryRun: `node scripts/import-game-image-urls.js ${batchPath} --dry-run --validate-remote`,
    import: `node scripts/import-game-image-urls.js ${batchPath} --validate-remote`,
  };
}

function recentProviderAttempts(platformSlug) {
  const manifest = readJson(path.join("data", "games", `${platformSlug}-manifest.json`), {});
  return (manifest.imageProviderAttempts || [])
    .filter((attempt) => attempt && attempt.result)
    .slice(-4)
    .map((attempt) => ({
      provider: attempt.provider || "",
      script: attempt.script || "",
      checkedAt: attempt.checkedAt || "",
      candidates: Number(attempt.candidates || 0),
      matched: Number(attempt.matched || 0),
      result: attempt.result || "",
      notes: attempt.notes || "",
    }));
}

function providerNextRecommended(platformSlug) {
  const manifest = readJson(path.join("data", "games", `${platformSlug}-manifest.json`), {});
  return manifest.imageProviderNextRecommended || "";
}

function needsExternalProvider(target) {
  const attempts = target.recentProviderAttempts || [];
  const hasExhaustedCurrentQueue = attempts.some((attempt) => {
    const result = String(attempt.result || "");
    return result.includes("exhausted_for_current_missing_queue") || result.includes("low_yield_remaining_queue") || result.includes("no_safe_imports");
  });
  return Boolean(hasExhaustedCurrentQueue && target.providerNextRecommended);
}

function nextActionForTarget(target) {
  if (!target) return "";
  if (needsExternalProvider(target)) {
    return `${target.platformLabel} needs an external reviewed source next: ${target.providerNextRecommended}`;
  }
  return `Manually review ${target.records} image rows in ${target.batchPath} to complete ${target.platformLabel}, then dry-run the import.`;
}

function main() {
  const finishable = readJson("data/games/finishable-image-review-batches.json", { batches: [] });
  const priority = readJson("data/games/priority-image-review-batches.json", { batches: [] });
  const milestone = readJson("data/games/milestone-image-review-batches.json", { batches: [] });
  const coverage = readJson("data/games/image-coverage-plan.json", {});
  const readiness = readJson("data/launch-readiness/game-image-import-readiness.json", {});
  const providerReadiness = readJson("data/games/image-provider-readiness.json", {});

  const finishableTargets = (finishable.batches || [])
    .map((batch) => ({
      type: "finishable-platform",
      platformSlug: batch.platformSlug,
      platformLabel: batch.platformLabel,
      missingImages: Number(batch.missingImages || batch.records || 0),
      imagePct: Number(batch.imagePct || 0),
      records: Number(batch.records || 0),
      batchPath: batch.path,
      recentProviderAttempts: recentProviderAttempts(batch.platformSlug),
      providerNextRecommended: providerNextRecommended(batch.platformSlug),
      ...importCommands(batch.path),
    }))
    .map((target) => ({
      ...target,
      needsExternalProvider: needsExternalProvider(target),
    }))
    .sort((a, b) => a.records - b.records || b.imagePct - a.imagePct);

  const priorityTargets = (priority.batches || [])
    .map((batch) => ({
      type: "priority-platform",
      platformSlug: batch.platformSlug,
      platformLabel: batch.platformLabel,
      missingImages: Number(batch.missingImages || 0),
      imagePct: Number(batch.imagePct || 0),
      records: Number(batch.records || 0),
      batchPath: batch.path,
      recentProviderAttempts: recentProviderAttempts(batch.platformSlug),
      providerNextRecommended: providerNextRecommended(batch.platformSlug),
      ...importCommands(batch.path),
    }))
    .map((target) => ({
      ...target,
      needsExternalProvider: needsExternalProvider(target),
    }))
    .sort((a, b) => b.missingImages - a.missingImages || a.imagePct - b.imagePct);

  const milestoneTargets = (milestone.batches || [])
    .map((batch) => ({
      type: "coverage-milestone",
      targetPct: Number(batch.targetPct || 0),
      currentPct: Number(batch.currentPct || 0),
      additionalImagesNeeded: Number(batch.additionalImagesNeeded || batch.records || 0),
      records: Number(batch.records || 0),
      platforms: batch.platforms || [],
      batchPath: batch.path,
      ...importCommands(batch.path),
    }))
    .sort((a, b) => a.targetPct - b.targetPct);

  const nextFinishable = finishableTargets.find((target) => target.records > 0 && !target.needsExternalProvider) || finishableTargets.find((target) => target.records > 0) || null;
  const nextExternalProviderTarget =
    [...finishableTargets, ...priorityTargets].find((target) => target.records > 0 && target.needsExternalProvider) || null;
  const nextMilestone = milestoneTargets[0] || null;
  const readyRows = Number(readiness.totals?.readyToImport || 0);
  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    totals: {
      missingImages: Number(coverage.totals?.missingImages ?? providerReadiness.missingImages ?? 0),
      imagePct: Number(coverage.totals?.imagePct || 0),
      readyRows,
      finishableTargetCount: finishableTargets.filter((target) => target.records > 0).length,
      finishableRecordCount: finishableTargets.reduce((sum, item) => sum + item.records, 0),
      priorityTargetCount: priorityTargets.length,
      milestoneTargetCount: milestoneTargets.length,
    },
    nextFinishable,
    nextExternalProviderTarget,
    nextMilestone,
    finishableTargets,
    priorityTargets,
    milestoneTargets,
    rules: [
      "Import only rows with a direct image URL, direct source URL, provider name, approved/verified/reviewed status, and reviewer.",
      "Prefer official publisher/store/media-kit assets, then commercially appropriate providers after confirming terms.",
      "Do not bulk import scraped artwork, watermarked images, logos, screenshots, or mismatched regional covers as box art.",
    ],
    recommendedNextStep: readyRows
      ? `Dry-run the ready image rows first. Start with ${readiness.readyBatches?.[0]?.path || "the first ready batch"}.`
      : nextFinishable
        ? nextActionForTarget(nextFinishable)
        : nextExternalProviderTarget
          ? nextActionForTarget(nextExternalProviderTarget)
        : nextMilestone
          ? `Manually review ${nextMilestone.records} rows in ${nextMilestone.batchPath} to move toward ${nextMilestone.targetPct}% image coverage.`
          : "No image review batches are currently available. Rebuild the image queues.",
  };

  writeJsonAtomic(outputPath, report);
  writeTextAtomic(markdownOutputPath, buildMarkdown(report));
  console.log(JSON.stringify(report, null, 2));
}

main();
