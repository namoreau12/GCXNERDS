const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(gamesDir, "image-provider-readiness.json");

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

function hasUsableKey(env, key) {
  const value = String(env[key] || "").trim();
  return Boolean(value && !/^(replace_with_|your_)/i.test(value));
}

function readJson(filePath, fallback = null) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function main() {
  const env = loadEnvFile();
  const health = readJson(path.join(gamesDir, "library-completeness.json"), {});
  const coveragePlan = readJson(path.join(gamesDir, "image-coverage-plan.json"), {});
  const importReadiness = readJson(path.join(rootDir, "data", "launch-readiness", "game-image-import-readiness.json"), {});
  const finishableIndex = readJson(path.join(gamesDir, "finishable-image-review-batches.json"), {});
  const priorityIndex = readJson(path.join(gamesDir, "priority-image-review-batches.json"), {});
  const backlog = health.priority?.imageBacklog || [];
  const libraries = health.libraries || [];
  const missingImages = health.totals?.missingImages || 0;
  const nextMilestone =
    (coveragePlan.milestones || []).find((milestone) => {
      const needed = Number(milestone.imagesNeeded ?? milestone.additionalImagesNeeded ?? 0);
      return !milestone.targetMet && needed > 0;
    }) || null;
  const firstFinishableBatch = (finishableIndex.batches || [])[0] || null;
  const firstPriorityBatch = (priorityIndex.batches || [])[0] || null;
  const finishablePlatforms = libraries
    .filter((library) => library.missingImages > 0)
    .sort((a, b) => a.missingImages - b.missingImages || b.imagePct - a.imagePct)
    .slice(0, 10)
    .map(({ platform, total, images, imagePct, missingImages }) => ({ platform, total, images, imagePct, missingImages }));

  const providers = [
    {
      id: "official-store-caches",
      label: "Official Nintendo, PlayStation, and Microsoft catalog caches",
      status: "active",
      commercialFit: "good",
      notes:
        "Already used where exact official catalog matches are available. Remaining misses are mostly not found or are ambiguous in those sources.",
    },
    {
      id: "libretro-thumbnails",
      label: "Libretro thumbnail archives",
      status: "active",
      commercialFit: "review-required",
      notes:
        "Useful for retro box art when exact or curated matches are available. Broad fuzzy matches are intentionally rejected to avoid wrong covers.",
    },
    {
      id: "rawg",
      label: "RAWG",
      status: hasUsableKey(env, "RAWG_API_KEY") ? "configured" : "missing-key",
      requiredEnv: ["RAWG_API_KEY"],
      commercialFit: "review-required",
      notes:
        "Pipeline support already exists. Add a usable RAWG_API_KEY to enable broader image search; review RAWG terms before production use.",
      validationCommand: "node scripts/validate-image-provider-keys.js --rawg",
      nextCommand: "node scripts/run-priority-image-enrichment.js --dry-run --limit-per-platform=10",
    },
    {
      id: "mobygames",
      label: "MobyGames",
      status: hasUsableKey(env, "MOBYGAMES_API_KEY") ? "configured" : "missing-key",
      requiredEnv: ["MOBYGAMES_API_KEY"],
      commercialFit: "best-candidate",
      notes:
        "Pipeline support already exists. Confirm the selected MobyGames API plan permits GCX's intended commercial use before importing cover images at scale.",
      validationCommand: "node scripts/validate-image-provider-keys.js --mobygames",
      nextCommand: "node scripts/run-priority-mobygames-image-enrichment.js --dry-run --limit-per-platform=10",
    },
    {
      id: "screenscraper",
      label: "ScreenScraper",
      status: "not-enabled",
      commercialFit: "poor-for-marketplace",
      notes:
        "ScreenScraper can be strong for emulator front-end artwork, but its public site describes contributed data/media under a NonCommercial ShareAlike license. Avoid as a production source for a commercial marketplace unless separately licensed.",
    },
  ];
  const configuredBulkProviders = providers.filter((provider) => provider.status === "configured");
  const activeLowRiskProviders = providers.filter((provider) => provider.status === "active" && provider.commercialFit === "good");
  const manualReviewAvailable = Boolean(firstFinishableBatch?.path || firstPriorityBatch?.path || nextMilestone?.batchPath);
  const launchDecision = {
    status: configuredBulkProviders.length ? "bulk-provider-ready" : manualReviewAvailable ? "manual-review-ready" : "needs-provider-plan",
    label: configuredBulkProviders.length ? "Bulk provider ready" : manualReviewAvailable ? "Manual review path ready" : "Provider plan needed",
    summary: configuredBulkProviders.length
      ? "A keyed bulk cover-art provider is configured. Validate the key and run a dry-run enrichment before importing any images."
      : manualReviewAvailable
        ? "No keyed bulk cover-art provider is configured yet, but reviewed CSV queues are staged so GCX can continue safely through manual source review."
        : "No keyed bulk provider or usable manual review queue is ready. Rebuild the image queues before continuing cover-art cleanup.",
    safeForLaunch: Boolean(activeLowRiskProviders.length && manualReviewAvailable),
    blocker: false,
    checklist: [
      "Confirm any paid provider plan permits GCX's intended commercial use before bulk import.",
      "Use direct image URLs only, never search-result pages or marketplace listing photos as permanent cover art.",
      "Require imageUrl, imageSourceUrl, imageProvider, approved review status, and reviewer before import.",
      "Run dry-run import with remote validation before changing game library JSON.",
    ],
  };

  const report = {
    generatedAt: new Date().toISOString(),
    missingImages,
    readyToImport: importReadiness.totals?.readyToImport || 0,
    incompleteReviewedRows: importReadiness.totals?.incompleteReviewedRows || 0,
    nextMilestone: nextMilestone
      ? {
          targetPct: nextMilestone.targetPct,
          currentPct: nextMilestone.currentPct ?? coveragePlan.totals?.imagePct ?? null,
          imagesNeeded: Number(nextMilestone.imagesNeeded ?? nextMilestone.additionalImagesNeeded ?? 0),
          batchPath: nextMilestone.batchPath || `data/games/milestone-review-batches/${nextMilestone.targetPct}-pct-image-review-batch.csv`,
          firstPlatform: nextMilestone.platformPlan?.[0]?.platform || "",
        }
      : null,
    topImageBacklog: backlog.slice(0, 12),
    finishablePlatforms,
    manualReviewPaths: {
      finishableIndex: "data/games/finishable-image-review-batches.json",
      firstFinishableBatch: firstFinishableBatch?.path || "",
      priorityIndex: "data/games/priority-image-review-batches.json",
      firstPriorityBatch: firstPriorityBatch?.path || "",
      milestoneBatch: nextMilestone?.batchPath || "data/games/milestone-review-batches/90-pct-image-review-batch.csv",
    },
    launchDecision,
    providers,
    recommendedNextAction: hasUsableKey(env, "MOBYGAMES_API_KEY")
      ? "Validate MOBYGAMES_API_KEY, confirm the provider plan permits GCX's intended use, then run scripts/run-priority-mobygames-image-enrichment.js in dry-run mode against the current priority backlog."
      : "Add a commercially appropriate cover-art provider key, preferably MOBYGAMES_API_KEY after confirming plan terms, validate it, then run the keyed image pipeline in dry-run mode. For manual review without a provider key, start with data/games/finishable-image-review-batches.json to close small gaps, then data/games/priority-image-review-batches.json for the largest backlogs.",
    validationCommand: "node scripts/validate-image-provider-keys.js",
    nextCommands: [
      "node scripts/validate-image-provider-keys.js --mobygames",
      "node scripts/report-image-provider-readiness.js",
      "node scripts/audit-game-image-import-readiness.js",
      "node scripts/run-priority-mobygames-image-enrichment.js --dry-run --limit-platforms=1 --limit-per-platform=10",
      firstFinishableBatch?.path
        ? `node scripts/import-game-image-urls.js ${firstFinishableBatch.path} --dry-run --validate-remote`
        : "node scripts/import-game-image-urls.js data/games/review-image-batch.csv --dry-run --validate-remote",
    ],
  };

  writeJson(outputPath, report);
  console.table(
    providers.map((provider) => ({
      provider: provider.id,
      status: provider.status,
      commercialFit: provider.commercialFit,
      requiredEnv: (provider.requiredEnv || []).join(", "),
    }))
  );
  console.log(`Missing images: ${missingImages}`);
  console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
}

main();
