const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "newsroom-promotion-readiness.json");

function readJson(relativePath, fallback = null) {
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

function uniqueProminentChecks(prominentReport) {
  const seen = new Set();
  const checks = [];
  for (const result of prominentReport.results || []) {
    for (const check of result.checks || []) {
      const key = `${check.storyId || check.href || check.title}:${check.slot}`;
      if (!check.storyId || seen.has(key)) continue;
      seen.add(key);
      checks.push({
        storyId: check.storyId,
        slot: check.slot,
        title: check.title,
        imageUrl: check.imageUrl,
        mediaType: check.mediaType,
        officialByMetadata: check.officialByMetadata,
      });
    }
  }
  return checks;
}

function main() {
  const prominentReport = readJson("data/launch-readiness/prominent-news-official-media.json", {});
  const readthrough = readJson("data/launch-readiness/newsroom-editorial-readthrough.json", {});
  const officialMediaQueue = readJson("data/launch-readiness/newsroom-official-media-queue.json", {});

  const readthroughById = new Map((readthrough.articles || []).map((article) => [article.id, article]));
  const mediaQueueById = new Map((officialMediaQueue.queue || []).map((item) => [item.storyId, item]));
  const prominentSlots = uniqueProminentChecks(prominentReport);

  const warnings = prominentSlots
    .map((slot) => {
      const article = readthroughById.get(slot.storyId);
      const mediaQueue = mediaQueueById.get(slot.storyId);
      const reasons = [];
      if (!article) reasons.push("No released-article QA record was found for this promoted story.");
      if (article?.qualityStatus === "needs-editorial-pass") reasons.push(article.recommendedAction || article.topIssue || "Article needs editorial pass.");
      if (mediaQueue) reasons.push(mediaQueue.recommendedReplacement || "Story still needs official media replacement.");
      if (!reasons.length) return null;
      return {
        storyId: slot.storyId,
        slot: slot.slot,
        title: slot.title || article?.title || "",
        qualityStatus: article?.qualityStatus || "unknown",
        reviewFocus: article?.reviewFocus || [],
        mediaType: slot.mediaType,
        imageUrl: slot.imageUrl,
        reasons,
        recommendedAction: mediaQueue
          ? "Replace temporary media before promoting this story heavily."
          : article?.recommendedAction || "Complete the editorial QA pass before promoting this story heavily.",
      };
    })
    .filter(Boolean);

  const report = {
    ok: true,
    status: warnings.length ? "warning" : "pass",
    generatedAt: new Date().toISOString(),
    prominentSlotCount: prominentSlots.length,
    warningCount: warnings.length,
    warnings,
    nextStep: warnings.length
      ? "Use the warnings list to decide which promoted stories need a final editorial/media pass before launch homepage placement."
      : "Prominent newsroom slots are ready for heavy launch promotion.",
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
}

main();
