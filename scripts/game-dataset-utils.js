const reportFiles = new Set([
  "duplicate-libretro-image-cleanup-report.json",
  "finishable-image-queue.json",
  "finishable-image-review-batches.json",
  "image-coverage-plan.json",
  "image-provider-backfill-report.json",
  "image-provider-readiness.json",
  "image-url-health-report.json",
  "game-search-index-cleanup-report.json",
  "last-image-import-report.json",
  "last-image-import-preview.json",
  "last-overview-import-preview.json",
  "last-overview-import-report.json",
  "last-strict-libretro-image-import-report.json",
  "last-strict-playstation-image-import-report.json",
  "library-cleanup-queue.json",
  "library-completeness.json",
  "milestone-image-review-batches.json",
  "missing-image-queue.json",
  "overview-rewrite-batches.json",
  "priority-image-review-batches.json",
  "wikipedia-logo-image-cleanup-report.json",
]);

function isGameDatasetFile(fileName) {
  return (
    fileName.endsWith(".json") &&
    !fileName.startsWith("last-") &&
    !reportFiles.has(fileName) &&
    !fileName.includes("-manifest") &&
    !fileName.includes("-libretro") &&
    !fileName.includes("-image-cache") &&
    !fileName.includes("-report") &&
    !fileName.includes("boxarts") &&
    !fileName.includes("cache") &&
    !fileName.includes("completeness")
  );
}

function writeJsonAtomic(fs, filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.renameSync(tempPath, filePath);
      return;
    } catch {
      if (attempt === 4) {
        fs.copyFileSync(tempPath, filePath);
        fs.unlinkSync(tempPath);
        return;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250 * (attempt + 1));
    }
  }
}

module.exports = {
  isGameDatasetFile,
  writeJsonAtomic,
};
