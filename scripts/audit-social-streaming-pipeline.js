const fs = require("fs");
const path = require("path");
const {
  normalizeSocialPostDraft,
  normalizeStreamingItemDraft,
  socialDuplicateKey,
  validateSocialPost,
  validateStreamingItem,
} = require("./social-streaming-pipeline-utils");

const rootDir = path.resolve(__dirname, "..");
const communityPath = path.join(rootDir, "data", "community.json");
const reportPath = path.join(rootDir, "data", "launch-readiness", "social-streaming-pipeline.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function countBy(items, getter) {
  return items.reduce((counts, item) => {
    const key = getter(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function main() {
  const data = readJson(communityPath);
  const posts = Array.isArray(data.posts) ? data.posts : [];
  const publishedPosts = posts.filter((post) => (post.status || "published") === "published");
  const futureScheduledPosts = publishedPosts.filter((post) => post.scheduledAt && new Date(post.scheduledAt).getTime() > Date.now());
  const staleSocialPosts = publishedPosts.filter((post) => post.markedStale);
  const streaming = Array.isArray(data.streamingSpotlight) ? data.streamingSpotlight : [];
  const activeStreaming = streaming.filter((item) => !item.hidden);
  const staleStreamingItems = activeStreaming.filter((item) => item.markedStale);

  const normalizedPostIssues = publishedPosts
    .map((post) => {
      const normalized = normalizeSocialPostDraft(post);
      const expectedKey = socialDuplicateKey(normalized);
      const issues = validateSocialPost(normalized);
      if ((post.duplicateKey || "") !== expectedKey) issues.push("duplicate-key-drift");
      return { id: post.id, title: post.title, issues };
    })
    .filter((item) => item.issues.length);

  const duplicateKeys = publishedPosts
    .map((post) => post.duplicateKey || socialDuplicateKey(post))
    .filter(Boolean);
  const duplicateKeyCounts = countBy(duplicateKeys, (key) => key);
  const duplicateKeyIssues = Object.entries(duplicateKeyCounts)
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }));

  const streamingIssues = activeStreaming
    .map((item) => {
      const normalized = normalizeStreamingItemDraft(item);
      return { id: item.id, title: item.title, issues: validateStreamingItem(normalized) };
    })
    .filter((item) => item.issues.length);
  const sourceOptionalTypes = new Set(["community_prompt", "fun_stat", "community_post"]);
  const unsourcedFactualPostIssues = publishedPosts
    .filter((post) => !post.sourceName && !post.sourceUrl && !post.linkUrl && !sourceOptionalTypes.has(post.postType || ""))
    .map((post) => ({ id: post.id, title: post.title, postType: post.postType || "community_post" }));

  const postTypeCounts = countBy(publishedPosts, (post) => post.postType || "community_post");
  const sourceTypeCounts = countBy(publishedPosts, (post) => post.sourceType || "none");
  const streamingStatusCounts = countBy(activeStreaming, (item) => item.is_live === true ? "verified_live" : item.status || "unknown");
  const scheduledStreaming = activeStreaming.filter((item) => item.scheduled_start || String(item.status || "").toLowerCase() === "scheduled");
  const streamingWithThumbnails = activeStreaming.filter((item) => item.thumbnail_url);
  const pollPosts = publishedPosts.filter((post) => Array.isArray(post.pollOptions) && post.pollOptions.length >= 2);
  const streamingInterest = activeStreaming.reduce(
    (totals, item) => {
      totals.viewCount += Number(item.viewCount || item.views || 0);
      totals.watchClickCount += Number(item.watchClickCount || 0);
      totals.embedLoadCount += Number(item.embedLoadCount || 0);
      return totals;
    },
    { viewCount: 0, watchClickCount: 0, embedLoadCount: 0 }
  );

  const failures = [];
  if (publishedPosts.length < 30) failures.push("Published Social feed should contain at least 30 posts.");
  ["gcx_news_share", "external_story_share", "video_post", "community_prompt", "quick_news", "tcg_card_post", "fun_stat"].forEach((type) => {
    if (!postTypeCounts[type]) failures.push(`Social feed is missing post type ${type}.`);
  });
  if ((postTypeCounts.tcg_card_post || 0) < 4) failures.push("Social feed should contain at least 4 dedicated TCG/card posts.");
  if (pollPosts.length < 3) failures.push("Social feed should contain at least 3 poll-style discussion posts.");
  if (futureScheduledPosts.length < 1) failures.push("Social editorial pipeline should include at least one future scheduled post for launch-readiness testing.");
  if (staleSocialPosts.length < 1) failures.push("Social editorial pipeline should include at least one stale post for stale-state testing.");
  if (duplicateKeyIssues.length) failures.push("Published Social feed contains duplicate duplicateKey values.");
  if (normalizedPostIssues.length) failures.push("Some Social posts fail normalization/source validation.");
  if (unsourcedFactualPostIssues.length) failures.push("Some factual Social posts are missing a source/link.");
  if (activeStreaming.length < 7) failures.push("Streaming Spotlight should expose at least 7 non-hidden items.");
  if (activeStreaming.filter((item) => item.featured).length !== 1) failures.push("Streaming Spotlight should expose exactly one featured item.");
  if (scheduledStreaming.length < 1) failures.push("Streaming Spotlight should expose at least one scheduled/upcoming item.");
  if (streamingWithThumbnails.length < 5) failures.push("Streaming Spotlight should have official thumbnails on at least half of active items.");
  if (staleStreamingItems.length < 1) failures.push("Streaming Spotlight should include at least one stale item for stale-state testing.");
  if (streamingIssues.length) failures.push("Some Streaming Spotlight items fail structured-model validation.");

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    summary: {
      publishedPosts: publishedPosts.length,
      postTypeCounts,
      sourceTypeCounts,
      pollPosts: pollPosts.length,
      futureScheduledPosts: futureScheduledPosts.length,
      staleSocialPosts: staleSocialPosts.length,
      activeStreaming: activeStreaming.length,
      streamingStatusCounts,
      scheduledStreaming: scheduledStreaming.length,
      streamingWithThumbnails: streamingWithThumbnails.length,
      staleStreamingItems: staleStreamingItems.length,
      streamingInterest,
      duplicateKeys: duplicateKeys.length,
    },
    normalizedPostIssues,
    duplicateKeyIssues,
    unsourcedFactualPostIssues,
    streamingIssues,
    failures,
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
