const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const outputPath = path.join(rootDir, "data", "launch-readiness", "newsroom-image-uniqueness.json");

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function normalizedImageUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text, "https://gcx.local/");
    url.search = "";
    url.hash = "";
    return url.href.replace(/^https:\/\/gcx\.local\//, "");
  } catch {
    return text.split(/[?#]/)[0];
  }
}

function imageUsesFor(story) {
  const uses = [];
  const topicCluster = story.topicCluster || story.canonicalTopic || "";
  if (story.heroImage || story.imageUrl) {
    uses.push({
      storyId: story.id,
      title: story.title,
      topicCluster,
      kind: "hero",
      imageUrl: story.heroImage || story.imageUrl,
    });
  }
  (story.media || []).forEach((item, index) => {
    const imageUrl = item?.imageUrl || item?.url || item?.src;
    if (!imageUrl) return;
    uses.push({
      storyId: story.id,
      title: story.title,
      topicCluster,
      kind: item.mediaType || item.type || `media-${index + 1}`,
      imageUrl,
    });
  });
  return uses;
}

function sameClusterDuplicatesFor(duplicateGroups) {
  const issues = [];
  duplicateGroups.forEach((group) => {
    const byCluster = new Map();
    group.uses.forEach((use) => {
      const cluster = String(use.topicCluster || "").trim();
      if (!cluster) return;
      if (!byCluster.has(cluster)) byCluster.set(cluster, []);
      byCluster.get(cluster).push(use);
    });
    byCluster.forEach((uses, topicCluster) => {
      const storyCount = new Set(uses.map((use) => use.storyId)).size;
      if (storyCount <= 1) return;
      issues.push({
        imageUrl: group.imageUrl,
        topicCluster,
        storyCount,
        uses,
      });
    });
  });
  return issues.sort((a, b) => b.storyCount - a.storyCount || a.topicCluster.localeCompare(b.topicCluster));
}

function main() {
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  const imageUses = stories.flatMap(imageUsesFor);
  const byImage = new Map();

  imageUses.forEach((use) => {
    const key = normalizedImageUrl(use.imageUrl);
    if (!key) return;
    if (!byImage.has(key)) byImage.set(key, []);
    byImage.get(key).push(use);
  });

  const crossStoryDuplicates = [...byImage.entries()]
    .map(([imageUrl, uses]) => ({
      imageUrl,
      storyCount: new Set(uses.map((use) => use.storyId)).size,
      topicClusters: [...new Set(uses.map((use) => use.topicCluster).filter(Boolean))],
      uses,
    }))
    .filter((item) => item.storyCount > 1)
    .sort((a, b) => b.storyCount - a.storyCount || a.imageUrl.localeCompare(b.imageUrl));

  const sameClusterDuplicates = sameClusterDuplicatesFor(crossStoryDuplicates);
  const report = {
    ok: crossStoryDuplicates.length === 0 && sameClusterDuplicates.length === 0,
    generatedAt: new Date().toISOString(),
    storyCount: stories.length,
    imageUseCount: imageUses.length,
    uniqueImageCount: byImage.size,
    crossStoryDuplicateCount: crossStoryDuplicates.length,
    sameClusterDuplicateCount: sameClusterDuplicates.length,
    crossStoryDuplicates,
    recommendedNextStep: crossStoryDuplicates.length
      ? "Assign a distinct approved hero/media image to each article in the duplicated image group, or remove lower-value repeated inline media."
      : "Newsroom article images are distinct across article IDs.",
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
