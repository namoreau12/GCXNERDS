function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeText(value, maxLength = 500) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function safeUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^(https?:)?\/\//i.test(text)) return text;
  if (/^\/?api\/image-proxy\?url=https%3A%2F%2F[a-z0-9._~:/?#[\]@!$&'()*+,;=%-]+$/i.test(text)) return text.replace(/^\/+/, "");
  if (/^(assets|data)\/[a-z0-9._/?=&%-]+$/i.test(text)) return text;
  if (/^[a-z0-9._/-]+\.html(?:[?#].*)?$/i.test(text)) return text;
  if (/^article\.html\?id=[a-z0-9._-]+$/i.test(text)) return text;
  return "";
}

function socialDuplicateKey(post = {}) {
  if (post.resharedPostId) {
    return slugify(["reshare", post.resharedPostId, post.profileId || post.author || post.id].filter(Boolean).join(":")).slice(0, 180);
  }
  const canonicalUrl = safeUrl(post.canonicalUrl || post.linkUrl || post.sourceUrl || post.originalUrl || "");
  const sourceUrl = safeUrl(post.sourceUrl || post.originalUrl || "");
  const externalPostId = safeText(post.externalPostId || post.externalContentId || "", 160);
  const topic = safeText(post.topic || post.canonicalTopic || post.game || post.entity || "", 160);
  const title = safeText(post.title || "", 160);
  const sourceName = safeText(post.sourceName || post.linkPreview?.sourceLabel || "", 100);
  const basis = canonicalUrl || sourceUrl || externalPostId || `${sourceName}:${topic}:${title}`;
  return slugify(basis).slice(0, 180);
}

function normalizeSocialPostDraft(draft = {}, defaults = {}) {
  const title = safeText(draft.title, 140);
  const body = safeText(draft.body, 900);
  const linkUrl = safeUrl(draft.linkUrl || "");
  const sourceUrl = safeUrl(draft.sourceUrl || linkUrl || "");
  const canonicalUrl = safeUrl(draft.canonicalUrl || linkUrl || sourceUrl || "");
  const post = {
    ...draft,
    id: safeText(draft.id, 160) || `post-social-${slugify(title || Date.now())}`,
    author: safeText(draft.author || defaults.author || "GCX Social", 100),
    handle: safeText(draft.handle || defaults.handle || "@gcxsocial", 60),
    profileId: safeText(draft.profileId || defaults.profileId || "", 120),
    category: safeText(draft.category || "Community", 40),
    postType: safeText(draft.postType || "community_post", 40),
    title,
    body,
    linkUrl,
    canonicalUrl,
    sourceName: safeText(draft.sourceName || "", 120),
    sourceUrl,
    sourceType: safeText(draft.sourceType || "", 40),
    externalPostId: safeText(draft.externalPostId || draft.externalContentId || "", 180),
    platform: safeText(draft.platform || "", 40),
    mediaType: safeText(draft.mediaType || "", 40),
    embedUrl: safeUrl(draft.embedUrl || ""),
    watchUrl: safeUrl(draft.watchUrl || linkUrl || ""),
    imageUrl: safeUrl(draft.imageUrl || ""),
    imageAlt: safeText(draft.imageAlt || title, 180),
    topic: safeText(draft.topic || "", 160),
    tags: Array.isArray(draft.tags) ? draft.tags.map((tag) => safeText(tag, 32)).filter(Boolean).slice(0, 8) : [],
    createdAt: draft.createdAt || defaults.createdAt || new Date().toISOString(),
    status: safeText(draft.status || "published", 40),
    likes: Number(draft.likes || 0),
    reactions: draft.reactions || { like: 0, hype: 0, want: 0, trade: 0, watch: 0 },
    comments: Number(draft.comments || 0),
    reports: Number(draft.reports || 0),
    pipelineStage: safeText(draft.pipelineStage || "publication", 40),
  };
  if (draft.linkPreview) post.linkPreview = draft.linkPreview;
  post.duplicateKey = draft.duplicateKey || socialDuplicateKey(post);
  return post;
}

function validateSocialPost(post = {}) {
  const issues = [];
  if (!post.id) issues.push("missing-id");
  if (!post.title) issues.push("missing-title");
  if (!post.body) issues.push("missing-body");
  if (!post.duplicateKey) issues.push("missing-duplicate-key");
  const isExternal = post.sourceType && post.sourceType !== "gcx";
  const factualTypes = new Set(["external_story_share", "video_post", "quick_news", "tcg_card_post"]);
  if (isExternal || factualTypes.has(post.postType)) {
    if (!post.sourceName) issues.push("missing-source-name");
    if (!post.sourceUrl && !post.linkUrl) issues.push("missing-source-url");
  }
  if (post.mediaType === "video" && !post.embedUrl && !post.watchUrl) issues.push("missing-video-provider-url");
  return issues;
}

function findDuplicateSocialPost(posts = [], candidate = {}) {
  const key = candidate.duplicateKey || socialDuplicateKey(candidate);
  if (!key) return null;
  return posts.find((post) => {
    if ((post.status || "published") === "hidden") return false;
    if (post.id && candidate.id && post.id === candidate.id) return false;
    return (post.duplicateKey || socialDuplicateKey(post)) === key;
  }) || null;
}

function normalizeStreamingItemDraft(draft = {}) {
  const title = safeText(draft.title, 160);
  const item = {
    ...draft,
    id: safeText(draft.id, 160) || `spotlight-${slugify(title || Date.now())}`,
    platform: safeText(draft.platform || "", 40),
    external_channel_id: safeText(draft.external_channel_id || draft.externalChannelId || "", 120),
    external_content_id: safeText(draft.external_content_id || draft.externalContentId || "", 160),
    creator: safeText(draft.creator || "", 120),
    title,
    game: safeText(draft.game || "", 120),
    category: safeText(draft.category || "", 80),
    thumbnail_url: safeUrl(draft.thumbnail_url || draft.thumbnailUrl || ""),
    embed_url: safeUrl(draft.embed_url || draft.embedUrl || ""),
    watch_url: safeUrl(draft.watch_url || draft.watchUrl || ""),
    is_live: draft.is_live === true,
    scheduled_start: draft.scheduled_start || draft.scheduledStart || null,
    viewer_count: draft.viewer_count === null || draft.viewer_count === undefined || draft.viewer_count === "" ? null : Number.isFinite(Number(draft.viewer_count)) ? Number(draft.viewer_count) : null,
    source: safeText(draft.source || "", 140),
    editorial_reason: safeText(draft.editorial_reason || draft.editorialReason || "", 500),
    featured: draft.featured === true,
    status: safeText(draft.status || (draft.is_live === true ? "Live" : draft.scheduled_start ? "Scheduled" : "Replay"), 40),
    created_at: draft.created_at || draft.createdAt || new Date().toISOString(),
    updated_at: draft.updated_at || draft.updatedAt || new Date().toISOString(),
    pipelineStage: safeText(draft.pipelineStage || "publication", 40),
  };
  item.duplicateKey = draft.duplicateKey || slugify(item.watch_url || item.embed_url || `${item.platform}:${item.external_channel_id}:${item.external_content_id}:${item.title}`).slice(0, 180);
  return item;
}

function validateStreamingItem(item = {}) {
  const issues = [];
  if (!item.id) issues.push("missing-id");
  if (!item.title) issues.push("missing-title");
  if (!item.platform) issues.push("missing-platform");
  if (!item.creator) issues.push("missing-creator");
  if (!item.watch_url) issues.push("missing-watch-url");
  if (!item.source) issues.push("missing-source");
  if (item.is_live === true && !item.live_verified_at && !item.provider_live_checked_at) issues.push("live-status-not-provider-verified");
  if (item.viewer_count !== null && item.viewer_count !== undefined && item.is_live !== true) issues.push("viewer-count-on-non-live-item");
  return issues;
}

module.exports = {
  findDuplicateSocialPost,
  normalizeSocialPostDraft,
  normalizeStreamingItemDraft,
  safeText,
  safeUrl,
  slugify,
  socialDuplicateKey,
  validateSocialPost,
  validateStreamingItem,
};
