const fs = require("node:fs");
const path = require("node:path");
const { writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(gamesDir, "image-coverage-plan.json");

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function pct(part, total) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

function imagesNeededForTarget(totalGames, currentImages, targetPct) {
  return Math.max(0, Math.ceil((totalGames * targetPct) / 100) - currentImages);
}

function cumulativePlatformPlan(platforms, needed) {
  let remaining = needed;
  return platforms
    .map((platform) => {
      if (remaining <= 0) return null;
      const reviewedImages = Math.min(platform.missingImages, remaining);
      remaining -= reviewedImages;
      return {
        platform: platform.platform,
        missingImages: platform.missingImages,
        currentImagePct: platform.imagePct,
        reviewedImages,
        remainingAfterPlatform: remaining,
      };
    })
    .filter(Boolean);
}

function finishablePlatforms(libraries) {
  return libraries
    .filter((library) => Number(library.missingImages || 0) > 0)
    .sort((a, b) => Number(a.missingImages || 0) - Number(b.missingImages || 0) || Number(b.imagePct || 0) - Number(a.imagePct || 0))
    .slice(0, 12)
    .map((library) => ({
      platform: library.platform,
      total: library.total,
      missingImages: library.missingImages,
      currentImagePct: library.imagePct,
      imagesToComplete: library.missingImages,
    }));
}

function main() {
  const completeness = readJson(path.join(gamesDir, "library-completeness.json"), {});
  const priorityBatches = readJson(path.join(gamesDir, "priority-image-review-batches.json"), {});
  const finishableBatches = readJson(path.join(gamesDir, "finishable-image-review-batches.json"), {});
  const totals = completeness.totals || {};
  const totalGames = Number(totals.totalGames || 0);
  const currentImages = Number(totals.images || 0);
  const missingImages = Number(totals.missingImages || 0);
  const imagePct = Number(totals.imagePct || pct(currentImages, totalGames));
  const backlog = [...(completeness.priority?.imageBacklog || [])].sort(
    (a, b) => Number(b.missingImages || 0) - Number(a.missingImages || 0) || String(a.platform || "").localeCompare(String(b.platform || ""))
  );

  const milestones = [90, 95, 100].map((targetPct) => {
    const additionalImagesNeeded = imagesNeededForTarget(totalGames, currentImages, targetPct);
    return {
      targetPct,
      currentPct: imagePct,
      additionalImagesNeeded,
      targetMet: additionalImagesNeeded === 0,
      platformPlan: cumulativePlatformPlan(backlog, additionalImagesNeeded),
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      totalGames,
      currentImages,
      missingImages,
      imagePct,
    },
    milestones,
    reviewCapacity: {
      priorityBatchRows: Number(priorityBatches.totalRecords || 0),
      priorityBatchCount: Number((priorityBatches.batches || []).length),
      finishableBatchRows: Number(finishableBatches.totalRecords || 0),
      finishableBatchCount: Number((finishableBatches.batches || []).length),
      totalPreparedRows: Number(priorityBatches.totalRecords || 0) + Number(finishableBatches.totalRecords || 0),
    },
    finishablePlatforms: finishablePlatforms(completeness.libraries || []),
    recommendedSequence: [
      "Use finishable batches first to close small platform gaps and create visible wins.",
      "Use priority batches next for PS2, Vita, PS3, Switch, 3DS, PSP, Xbox 360, and PS4 because they move total coverage fastest.",
      "Import only rows with a direct image URL, source URL, provider, approved review status, and reviewer.",
      "Use MobyGames or another commercially appropriate provider for bulk work before considering manual web-image review.",
    ],
  };

  writeJsonAtomic(fs, outputPath, report);
  console.log(JSON.stringify(report, null, 2));
}

main();
