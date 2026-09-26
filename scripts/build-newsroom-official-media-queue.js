const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const auditPath = path.join(outputDir, "newsroom-media-audit.json");
const jsonPath = path.join(outputDir, "newsroom-official-media-queue.json");
const markdownPath = path.join(outputDir, "newsroom-official-media-queue.md");

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function mediaRecommendation(story) {
  const haystack = [story.title, story.canonicalTopic, story.topicCluster, ...(story.tags || [])].join(" ").toLowerCase();
  if (/gta|grand theft auto|rockstar/.test(haystack)) return "Official Rockstar screenshot, key art, or official trailer thumbnail.";
  if (/phantom blade/.test(haystack)) return "Official S-GAME/PlayStation screenshot or trailer thumbnail.";
  if (/horizon|sony|playstation/.test(haystack)) return "Official PlayStation Studios, Guerrilla, or Sony press image; use source-link-only note if the project is still unannounced.";
  if (/gamescom/.test(haystack)) return "Official Gamescom, publisher showcase, or featured-game key art; avoid generic GCX event graphics for hero slots.";
  if (/ps6|console|hardware|price/.test(haystack)) return "Official console product photo, manufacturer press image, or data graphic clearly labeled as GCX analysis.";
  return "Official screenshot, key art, promotional art, or trailer thumbnail from the publisher/developer.";
}

function replacementPriority(story) {
  const articleType = String(story.articleType || story.type || "").toLowerCase();
  const title = String(story.title || "").toLowerCase();
  if (/gamescom/.test(title) || /guide|tracker|analysis|preview/.test(articleType)) return 90;
  if (/gta|phantom blade|horizon|ps6/.test(title)) return 80;
  return 70;
}

function main() {
  const newsroom = readJson(newsroomPath, []);
  const audit = readJson(auditPath, {});
  const byId = new Map(newsroom.map((story) => [story.id, story]));
  const queue = (audit.issues || [])
    .filter((issue) => issue.code === "official_media_required")
    .map((issue) => {
      const story = byId.get(issue.storyId) || {};
      return {
        storyId: issue.storyId,
        title: story.title || issue.storyId,
        category: story.category || "",
        articleType: story.articleType || story.type || "",
        articleUrl: `article.html?id=${issue.storyId}`,
        currentImage: issue.imageUrl || story.heroImage || story.imageUrl || "",
        currentMediaType: story.mediaType || "",
        sourceCount: Array.isArray(story.sourceLinks) ? story.sourceLinks.length : 0,
        sourceLinks: (story.sourceLinks || []).slice(0, 4),
        recommendedReplacement: mediaRecommendation(story),
        requiredFields: [
          "heroImage",
          "heroImageSource",
          "heroImageCredit",
          "heroImageAlt",
          "heroImageFocalX",
          "heroImageFocalY",
          "mediaType",
        ],
        priorityScore: replacementPriority(story),
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || a.title.localeCompare(b.title));

  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    storyCount: newsroom.length,
    queueCount: queue.length,
    queue,
    rules: [
      "Replace fallback art with official screenshots first, then official key/promotional art, then official trailer thumbnails.",
      "Do not create abstract/editorial/generated art for real game stories when official media exists.",
      "Keep GCX-created graphics for analysis/chart modules only, not real-game hero images.",
      "Preserve focal-point fields so cards crop around recognizable subjects.",
    ],
    nextStep: queue.length
      ? `Replace official media for ${queue[0].storyId}: ${queue[0].recommendedReplacement}`
      : "No newsroom stories are currently waiting on official media replacement.",
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const lines = [
    "# GCX Official Media Replacement Queue",
    "",
    `Generated: ${report.generatedAt}`,
    `Stories needing official media: ${report.queueCount}`,
    "",
    "| Article | Current Image | Recommended Replacement |",
    "| --- | --- | --- |",
    ...queue.map((item) => `| [${item.title.replace(/\|/g, "\\|")}](${item.articleUrl}) | ${item.currentImage.replace(/\|/g, "\\|")} | ${item.recommendedReplacement.replace(/\|/g, "\\|")} |`),
    "",
  ];
  fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        queueCount: report.queueCount,
        jsonPath: path.relative(rootDir, jsonPath),
        markdownPath: path.relative(rootDir, markdownPath),
      },
      null,
      2
    )
  );
}

main();
