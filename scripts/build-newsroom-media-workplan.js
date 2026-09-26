const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const outputPath = path.join(rootDir, "data", "launch-readiness", "newsroom-media-workplan.json");

const visualTypes = new Set(["image", "screenshot", "gallery"]);
const videoTypes = new Set(["trailer", "video"]);

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isLongform(story) {
  return (story.body || []).length >= 18 || /guide|tracker|checklist|analysis/i.test(String(story.articleType || ""));
}

function mediaStats(story) {
  const media = Array.isArray(story.media) ? story.media : [];
  const stats = {
    heroImage: Boolean(story.imageUrl),
    mediaCount: media.length,
    visualModuleCount: 0,
    videoEmbedCount: 0,
    rightsNoteCount: 0,
    sourceLinkOnlyCount: 0,
    displayableImageCount: story.imageUrl ? 1 : 0,
  };

  media.forEach((item) => {
    const type = slug(item.mediaType || item.type);
    const rights = slug(item.rightsStatus);
    if (visualTypes.has(type)) stats.visualModuleCount += 1;
    if (videoTypes.has(type)) stats.videoEmbedCount += 1;
    if (type === "rights-note") stats.rightsNoteCount += 1;
    if (rights === "source-link-only") stats.sourceLinkOnlyCount += 1;
    if ((type === "image" || type === "screenshot") && item.imageUrl && rights !== "source-link-only" && rights !== "pending-review") {
      stats.displayableImageCount += 1;
    }
    if (type === "gallery" && Array.isArray(item.items)) {
      stats.displayableImageCount += item.items.filter((galleryItem) => galleryItem.imageUrl && slug(galleryItem.rightsStatus || item.rightsStatus) !== "source-link-only").length;
    }
  });

  return stats;
}

function recommendedModules(story, stats) {
  const title = `${story.title || ""} ${story.category || ""} ${story.articleType || ""}`.toLowerCase();
  const modules = [];

  if (/pokemon|tcg|card|checklist|msrp|preorder/.test(title) && stats.displayableImageCount < 3) {
    modules.push("Add approved product/card imagery or a visual checklist module using the card aspect-ratio component.");
  }
  if (/gamescom|showcase|preview|watching/.test(title) && stats.visualModuleCount < 2) {
    modules.push("Add approved key art or screenshots for the highest-priority game entries once publisher media paths are verified.");
  }
  if (/trailer|playable|network test|gameplay|witcher|duskbloods|dawnwalker|phantom blade|gta/.test(title) && stats.videoEmbedCount < 1) {
    modules.push("Add an official publisher/developer/platform-holder trailer embed near the section it supports.");
  }
  if (isLongform(story) && stats.displayableImageCount < 2 && story.articleMode !== "pokemon-pikachu-checklist") {
    modules.push("Add at least one approved in-body visual module so the lower half does not become uninterrupted text.");
  }
  if (!modules.length && stats.mediaCount === 0) {
    modules.push("Add a rights-reviewed visual or source-link-only media note before publication polish.");
  }

  return modules;
}

function priorityFor(story, stats, modules) {
  let score = 0;
  if (isLongform(story)) score += 30;
  if (String(story.category || "").toLowerCase() === "gaming") score += 20;
  if (String(story.category || "").toLowerCase() === "cards") score += 15;
  if (stats.mediaCount === 0) score += 25;
  if (stats.displayableImageCount <= 1) score += 15;
  if (modules.length) score += modules.length * 10;
  return score;
}

function main() {
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  const targets = stories
    .map((story) => {
      const stats = mediaStats(story);
      const modules = recommendedModules(story, stats);
      return {
        storyId: story.id,
        title: story.title,
        category: story.category || "",
        articleType: story.articleType || "",
        bodyBlocks: (story.body || []).length,
        stats,
        recommendedModules: modules,
        priorityScore: priorityFor(story, stats, modules),
        articleUrl: `article.html?id=${encodeURIComponent(story.id)}`,
      };
    })
    .filter((item) => item.recommendedModules.length)
    .sort((a, b) => b.priorityScore - a.priorityScore || b.bodyBlocks - a.bodyBlocks);

  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    storyCount: stories.length,
    targetCount: targets.length,
    topTargets: targets.slice(0, 10),
    targets,
    rules: [
      "Prefer official trailer embeds and official press/store/media-kit images.",
      "Use source-link-only notes when media is useful but display rights are not approved.",
      "Do not repeat the hero image as body media; the article renderer skips hero duplicates.",
      "Keep screenshots limited, credited, source-linked, and tied to reporting or analysis.",
    ],
    recommendedNextStep: targets.length
      ? `Add approved media modules to ${targets[0].storyId}: ${targets[0].recommendedModules[0]}`
      : "Newsroom articles have adequate media depth for the current launch stage.",
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
}

main();
