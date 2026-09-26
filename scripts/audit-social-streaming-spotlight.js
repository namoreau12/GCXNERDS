const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const reportPath = path.join(rootDir, "data", "launch-readiness", "social-streaming-spotlight.json");

async function loadPlaywright() {
  try {
    return require("playwright");
  } catch (error) {
    try {
      const { createRequire } = require("module");
      const bundledRequire = createRequire("C:/Users/namor/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/");
      return bundledRequire("playwright");
    } catch {
      return null;
    }
  }
}

async function pageReport(page, pathName, viewport) {
  await page.setViewportSize(viewport);
  const url = `http://localhost:3000${pathName}`;
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  const metrics = await page.evaluate(() => {
    const body = document.body;
    const documentElement = document.documentElement;
    const overflow = Math.max(body.scrollWidth, documentElement.scrollWidth) - window.innerWidth;
    const images = Array.from(document.images);
    return {
      title: document.title,
      overflow,
      images: images.length,
      brokenImages: images.filter((image) => image.complete && image.naturalWidth === 0).length,
      preparedImages: images.filter((image) => image.dataset.gcxImagePrepared === "true").length,
      imageFallbacks: document.querySelectorAll(".image-fallback").length,
      feedCards: document.querySelectorAll(".feed-card").length,
      pollCards: document.querySelectorAll(".feed-poll").length,
      videoEmbeds: document.querySelectorAll(".social-video-embed iframe").length,
      socialVideoPreviews: document.querySelectorAll("[data-load-social-video]").length,
      socialTwitchVideoPreviews: Array.from(document.querySelectorAll("[data-load-social-video]")).filter((item) => item.getAttribute("data-load-social-video")?.includes("player.twitch.tv")).length,
      discussionNudges: document.querySelectorAll(".discussion-nudge").length,
      featuredStream: document.querySelectorAll(".featured-stream-card").length,
      streamCards: document.querySelectorAll(".stream-watch-card").length,
      upcomingStreamCards: document.querySelectorAll("#streaming-upcoming .stream-watch-card").length,
      streamIframes: document.querySelectorAll(".featured-stream-card iframe, .stream-watch-card iframe").length,
      streamEmbedPreviews: document.querySelectorAll("[data-load-stream-embed]").length,
      twitchEmbedPreviews: Array.from(document.querySelectorAll("[data-load-stream-embed]")).filter((item) => item.getAttribute("data-load-stream-embed")?.includes("player.twitch.tv")).length,
      streamInterestLabels: document.querySelectorAll("[data-stream-view-count]").length,
      streamWatchLinks: document.querySelectorAll("[data-stream-watch]").length,
      officialLiveLabels: Array.from(document.querySelectorAll(".stream-live-pill, .stream-watch-meta span")).filter((item) => item.textContent.trim().toUpperCase() === "LIVE").length,
      socialFilters: document.querySelectorAll("[data-feed-filter]").length,
      loadMoreButtons: document.querySelectorAll("#load-more-posts").length,
    };
  });
  return {
    path: pathName,
    viewport: `${viewport.width}x${viewport.height}`,
    status: response?.status() || 0,
    ...metrics,
  };
}

async function communityFilterReport(page, filter, viewport) {
  await page.setViewportSize(viewport);
  await page.goto("http://localhost:3000/community.html", { waitUntil: "networkidle", timeout: 30000 });
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/community/feed") && response.url().includes(`category=${filter}`), { timeout: 10000 });
  await page.click(`[data-feed-filter="${filter}"]`);
  await responsePromise;
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => document.querySelectorAll(".feed-card").length > 0, null, { timeout: 10000 });
  const metrics = await page.evaluate(() => ({
    feedCards: document.querySelectorAll(".feed-card").length,
    socialVideoPreviews: document.querySelectorAll("[data-load-social-video]").length,
    socialTwitchVideoPreviews: Array.from(document.querySelectorAll("[data-load-social-video]")).filter((item) => item.getAttribute("data-load-social-video")?.includes("player.twitch.tv")).length,
    videoEmbeds: document.querySelectorAll(".social-video-embed iframe").length,
  }));
  return {
    path: "/community.html",
    filter,
    viewport: `${viewport.width}x${viewport.height}`,
    ...metrics,
  };
}

async function communityTwitchInteractionReport(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto("http://localhost:3000/community.html", { waitUntil: "networkidle", timeout: 30000 });
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/community/feed") && response.url().includes("category=videos"), { timeout: 10000 });
  await page.click('[data-feed-filter="videos"]');
  await responsePromise;
  await page.waitForFunction(() => document.querySelectorAll("[data-load-social-video]").length > 0, null, { timeout: 10000 });
  const initialIframeCount = await page.locator(".social-video-embed iframe").count();
  const twitchButton = page.locator('[data-load-social-video*="player.twitch.tv"]').first();
  const hasTwitchButton = await twitchButton.count();
  let videoEngagementStatus = 0;
  if (hasTwitchButton) {
    const engagementResponsePromise = page.waitForResponse((response) => response.url().includes("/api/community/feed/video-embeds"), { timeout: 10000 }).catch(() => null);
    await twitchButton.click();
    const engagementResponse = await engagementResponsePromise;
    videoEngagementStatus = engagementResponse?.status() || 0;
    await page.waitForFunction(() => Array.from(document.querySelectorAll(".social-video-embed iframe")).some((iframe) => iframe.src.includes("player.twitch.tv")), null, { timeout: 10000 });
  }
  const metrics = await page.evaluate(() => {
    const twitchIframes = Array.from(document.querySelectorAll(".social-video-embed iframe")).filter((iframe) => iframe.src.includes("player.twitch.tv"));
    return {
      initialIframeCount: window.__gcxInitialIframeCount || 0,
      twitchButtons: document.querySelectorAll('[data-load-social-video*="player.twitch.tv"]').length,
      twitchIframes: twitchIframes.length,
      twitchIframeHasParent: twitchIframes.every((iframe) => iframe.src.includes("parent=")),
    };
  });
  metrics.initialIframeCount = initialIframeCount;
  return {
    path: "/community.html",
    action: "load-twitch-social-video",
    viewport: `${viewport.width}x${viewport.height}`,
    videoEngagementStatus,
    ...metrics,
  };
}

async function main() {
  const playwright = await loadPlaywright();
  if (!playwright) {
    return runStaticFallback("Playwright is not installed in this workspace.");
  }

  let browser;
  let browserMode = "bundled-chromium";
  try {
    browser = await playwright.chromium.launch();
  } catch (error) {
    try {
      browser = await playwright.chromium.launch({ channel: "chrome" });
      browserMode = "installed-chrome";
    } catch (chromeError) {
      return runStaticFallback(`${error.message}\nChrome channel fallback failed: ${chromeError.message}`);
    }
  }
  const page = await browser.newPage();
  const viewports = [
    { width: 1280, height: 900 },
    { width: 390, height: 900 },
  ];
  const results = [];
  const filterResults = [];
  const interactionResults = [];
  for (const viewport of viewports) {
    results.push(await pageReport(page, "/community.html", viewport));
    results.push(await pageReport(page, "/streamers.html", viewport));
    filterResults.push(await communityFilterReport(page, "videos", viewport));
    interactionResults.push(await communityTwitchInteractionReport(page, viewport));
  }
  await browser.close();

  const failures = [];
  const streamersJs = fs.readFileSync(path.join(rootDir, "streamers.js"), "utf8");
  const adminJs = fs.readFileSync(path.join(rootDir, "community-admin.js"), "utf8");
  const serverJs = fs.readFileSync(path.join(rootDir, "server.js"), "utf8");
  const communityData = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "community.json"), "utf8"));
  const futureScheduledPostIds = new Set((communityData.posts || [])
    .filter((post) => (post.status || "published") === "published")
    .filter((post) => post.scheduledAt && new Date(post.scheduledAt).getTime() > Date.now())
    .map((post) => post.id));
  const stalePostIds = new Set((communityData.posts || [])
    .filter((post) => (post.status || "published") === "published" && post.markedStale)
    .map((post) => post.id));
  const staleStreamingIds = new Set((communityData.streamingSpotlight || [])
    .filter((item) => !item.hidden && item.status !== "deleted" && item.markedStale)
    .map((item) => item.id));
  const feedResponse = await fetch("http://localhost:3000/api/community/feed?category=all&sort=latest&limit=100").then((response) => response.json());
  const trendingResponse = await fetch("http://localhost:3000/api/community/feed?category=all&sort=trending&limit=100").then((response) => response.json());
  const firstPageResponse = await fetch("http://localhost:3000/api/community/feed?category=all&sort=latest&limit=12&offset=0").then((response) => response.json());
  const secondPageResponse = await fetch("http://localhost:3000/api/community/feed?category=all&sort=latest&limit=12&offset=12").then((response) => response.json());
  const streamersResponse = await fetch("http://localhost:3000/api/community/streamers").then((response) => response.json());
  const profileResponse = await fetch("http://localhost:3000/api/community/profiles/profile-gcx-member").then((response) => response.json());
  const leakedScheduledPosts = (feedResponse.data || []).filter((post) => futureScheduledPostIds.has(post.id));
  const leakedStalePosts = [...(feedResponse.data || []), ...(trendingResponse.data || [])].filter((post) => stalePostIds.has(post.id));
  const leakedStaleStreams = (streamersResponse.streamingSpotlight || []).filter((item) => staleStreamingIds.has(item.id));
  const profilePosts = [...(profileResponse.data?.posts || []), ...(profileResponse.data?.reposts || [])];
  const leakedProfilePosts = profilePosts.filter((post) => futureScheduledPostIds.has(post.id) || stalePostIds.has(post.id));
  const firstPageIds = new Set((firstPageResponse.data || []).map((post) => post.id));
  const secondPageIds = new Set((secondPageResponse.data || []).map((post) => post.id));
  const overlappingPagedPosts = [...firstPageIds].filter((id) => secondPageIds.has(id));
  results.forEach((result) => {
    if (result.status !== 200) failures.push(`${result.path} ${result.viewport} returned ${result.status}.`);
    if (result.overflow > 1) failures.push(`${result.path} ${result.viewport} has ${result.overflow}px horizontal overflow.`);
    if (result.brokenImages > 0) failures.push(`${result.path} ${result.viewport} has ${result.brokenImages} broken images.`);
    if (result.images > 0 && result.preparedImages !== result.images) failures.push(`${result.path} ${result.viewport} has dynamic images that were not prepared by the GCX fallback system.`);
  });
  const desktopCommunity = results.find((result) => result.path === "/community.html" && result.viewport === "1280x900");
  const mobileCommunity = results.find((result) => result.path === "/community.html" && result.viewport === "390x900");
  const desktopStreamers = results.find((result) => result.path === "/streamers.html" && result.viewport === "1280x900");
  if (!desktopCommunity || desktopCommunity.feedCards < 10) failures.push("Community desktop render should show an active paginated feed with at least 10 cards.");
  if (!desktopCommunity || desktopCommunity.pollCards < 1) failures.push("Community desktop render should show at least one poll-style Social post.");
  if (!desktopCommunity || desktopCommunity.socialVideoPreviews < 1) failures.push("Community desktop render should show at least one lazy official video post.");
  if (desktopCommunity && desktopCommunity.videoEmbeds > 0) failures.push("Community desktop should not load Social video iframes before user interaction.");
  if (!filterResults.every((result) => result.filter === "videos" && result.socialTwitchVideoPreviews >= 1)) failures.push("Community Videos filter should render at least one lazy official Twitch Social video preview on desktop and mobile.");
  if (filterResults.some((result) => result.videoEmbeds > 0)) failures.push("Community Videos filter should not load Social video iframes before user interaction.");
  if (!interactionResults.every((result) => result.initialIframeCount === 0 && result.twitchIframes >= 1 && result.twitchIframeHasParent && result.videoEngagementStatus === 200)) failures.push("Community Twitch Social video preview should lazy-load an official Twitch iframe with a parent parameter and record video engagement after interaction.");
  if (!desktopCommunity || desktopCommunity.discussionNudges < 10) failures.push("Community desktop render should show clear discussion entry points on feed cards.");
  if (!desktopCommunity || desktopCommunity.loadMoreButtons < 1) failures.push("Community desktop render should include the Social load-more control.");
  if (!mobileCommunity || mobileCommunity.socialFilters < 8) failures.push("Community mobile render should expose the expanded Social filters.");
  if (!desktopStreamers || desktopStreamers.featuredStream < 1 || desktopStreamers.streamCards < 4) failures.push("Streamer page should render a featured stream and multiple watch cards.");
  if (!desktopStreamers || desktopStreamers.upcomingStreamCards < 1) failures.push("Streamer page should render at least one scheduled/upcoming stream item.");
  if (desktopStreamers && desktopStreamers.streamIframes > 1) failures.push("Streamer page should initialize only the featured embed before user interaction.");
  if (desktopStreamers && desktopStreamers.streamEmbedPreviews < 1) failures.push("Streamer page should show click-to-load previews for secondary embeds.");
  if (desktopStreamers && desktopStreamers.twitchEmbedPreviews < 1) failures.push("Streamer page should expose at least one lazy official Twitch embed preview.");
  if (desktopStreamers && desktopStreamers.streamInterestLabels < 5) failures.push("Streamer page should show honest GCX view/watch interest labels on spotlight items.");
  if (desktopStreamers && desktopStreamers.streamWatchLinks < 5) failures.push("Streamer page should expose trackable watch links for spotlight items.");
  if (!streamersJs.includes("streaming-spotlight/views") || !streamersJs.includes("streaming-spotlight/engagement")) failures.push("Streamer page script should track GCX spotlight views and watch clicks.");
  if (!adminJs.includes("moderation-metric-row") || !adminJs.includes("watch clicks")) failures.push("Community admin should expose Streaming Spotlight GCX interest metrics.");
  if (!adminJs.includes("video loads") || !serverJs.includes('route === "feed/video-embeds"')) failures.push("Community Social video loads should be tracked and visible to staff.");
  if (!serverJs.includes("lastWatchClickedAt") || !serverJs.includes("watchClickCount")) failures.push("Editorial Streaming API should include GCX interest counts for staff review.");
  if (!serverJs.includes('route === "editorial/social-posts/intake"') || !serverJs.includes('route === "editorial/streaming-spotlight/intake"')) failures.push("Staff editorial API should expose Social and Streaming intake routes.");
  if (!serverJs.includes("findDuplicateStreamingSpotlightItem") || !serverJs.includes("findDuplicateCommunityPost(data, post)")) failures.push("Staff intake routes should use duplicate protection before saving drafts.");
  if (!adminJs.includes("pipelineStage") || !adminJs.includes("pipelineSource")) failures.push("Community admin should surface pipeline stage/source for review drafts.");
  if (!adminJs.includes("socialIntakeForm") || !adminJs.includes("streamingIntakeForm")) failures.push("Community admin should wire Social and Streaming intake forms.");
  if (!adminJs.includes("/api/community/editorial/social-posts/intake") || !adminJs.includes("/api/community/editorial/streaming-spotlight/intake")) failures.push("Community admin intake forms should post to protected intake APIs.");
  if (!adminJs.includes("data-publish=\"true\"") || !serverJs.includes("body.publish") || !serverJs.includes('pipelineStage = "publication"')) failures.push("Streaming review drafts should have an explicit publish path that advances the pipeline stage.");
  if (!serverJs.includes("scheduledSocialPosts")) failures.push("Editorial Social/Streaming API should summarize scheduled Social holds for staff.");
  if (!serverJs.includes("const responsePost = isPublicCommunityPost(post)")) failures.push("Unsave endpoint should avoid echoing stale or scheduled post content.");
  if (futureScheduledPostIds.size < 1) failures.push("Community data should include at least one future scheduled Social post for hold testing.");
  if (leakedScheduledPosts.length) failures.push("Public Social feed is leaking future scheduled posts.");
  if (stalePostIds.size < 1) failures.push("Community data should include at least one stale Social post for stale-state testing.");
  if (staleStreamingIds.size < 1) failures.push("Community data should include at least one stale Streaming Spotlight item for stale-state testing.");
  if (leakedStalePosts.length) failures.push("Public Social feeds are leaking stale posts.");
  if (leakedProfilePosts.length) failures.push("Public member profiles are leaking scheduled or stale Social posts.");
  if (leakedStaleStreams.length) failures.push("Public Streaming Spotlight API is leaking stale items.");
  if ((firstPageResponse.data || []).length !== 12 || (secondPageResponse.data || []).length !== 12) failures.push("Social feed pagination should return full first and second pages at the default page size.");
  if (firstPageResponse.nextOffset !== 12 || secondPageResponse.nextOffset !== 24) failures.push("Social feed pagination should advance nextOffset predictably.");
  if (!firstPageResponse.hasMore || !secondPageResponse.hasMore) failures.push("Social feed pagination should keep hasMore true while more public posts remain.");
  if (overlappingPagedPosts.length) failures.push("Social feed pagination returned duplicate posts across pages.");

  const report = {
    ok: failures.length === 0,
    mode: browserMode,
    generatedAt: new Date().toISOString(),
    results,
    filterResults,
    interactionResults,
    futureScheduledPostIds: Array.from(futureScheduledPostIds),
    leakedScheduledPosts: leakedScheduledPosts.map((post) => post.id),
    stalePostIds: Array.from(stalePostIds),
    leakedStalePosts: leakedStalePosts.map((post) => post.id),
    leakedProfilePosts: leakedProfilePosts.map((post) => post.id),
    staleStreamingIds: Array.from(staleStreamingIds),
    leakedStaleStreams: leakedStaleStreams.map((item) => item.id),
    pagination: {
      firstPage: (firstPageResponse.data || []).length,
      secondPage: (secondPageResponse.data || []).length,
      firstNextOffset: firstPageResponse.nextOffset,
      secondNextOffset: secondPageResponse.nextOffset,
      overlap: overlappingPagedPosts,
    },
    failures,
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

async function runStaticFallback(reason) {
  const streamersJs = fs.readFileSync(path.join(rootDir, "streamers.js"), "utf8");
  const adminJs = fs.readFileSync(path.join(rootDir, "community-admin.js"), "utf8");
  const serverJs = fs.readFileSync(path.join(rootDir, "server.js"), "utf8");
  const [communityHtml, streamersHtml, adminHtml, feedResponse, videoResponse, streamersResponse, editorialResponse] = await Promise.all([
    fetch("http://localhost:3000/community.html").then((response) => response.text()),
    fetch("http://localhost:3000/streamers.html").then((response) => response.text()),
    fetch("http://localhost:3000/community-admin.html").then((response) => response.text()),
    fetch("http://localhost:3000/api/community/feed?category=all&sort=latest").then((response) => response.json()),
    fetch("http://localhost:3000/api/community/feed?category=videos").then((response) => response.json()),
    fetch("http://localhost:3000/api/community/streamers").then((response) => response.json()),
    fetch("http://localhost:3000/api/community/editorial/social-streaming").then(async (response) => ({ status: response.status, body: await response.json().catch(() => ({})) })),
  ]);
  const trendingResponse = await fetch("http://localhost:3000/api/community/feed?category=all&sort=trending").then((response) => response.json());
  const firstPageResponse = await fetch("http://localhost:3000/api/community/feed?category=all&sort=latest&limit=12&offset=0").then((response) => response.json());
  const secondPageResponse = await fetch("http://localhost:3000/api/community/feed?category=all&sort=latest&limit=12&offset=12").then((response) => response.json());
  const profileResponse = await fetch("http://localhost:3000/api/community/profiles/profile-gcx-member").then((response) => response.json());
  const communityData = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "community.json"), "utf8"));
  const futureScheduledPostIds = new Set((communityData.posts || [])
    .filter((post) => (post.status || "published") === "published")
    .filter((post) => post.scheduledAt && new Date(post.scheduledAt).getTime() > Date.now())
    .map((post) => post.id));
  const stalePostIds = new Set((communityData.posts || [])
    .filter((post) => (post.status || "published") === "published" && post.markedStale)
    .map((post) => post.id));
  const staleStreamingIds = new Set((communityData.streamingSpotlight || [])
    .filter((item) => !item.hidden && item.status !== "deleted" && item.markedStale)
    .map((item) => item.id));
  const leakedScheduledPosts = (feedResponse.data || []).filter((post) => futureScheduledPostIds.has(post.id));
  const leakedStalePosts = [...(feedResponse.data || []), ...(trendingResponse.data || [])].filter((post) => stalePostIds.has(post.id));
  const leakedStaleStreams = (streamersResponse.streamingSpotlight || []).filter((item) => staleStreamingIds.has(item.id));
  const profilePosts = [...(profileResponse.data?.posts || []), ...(profileResponse.data?.reposts || [])];
  const leakedProfilePosts = profilePosts.filter((post) => futureScheduledPostIds.has(post.id) || stalePostIds.has(post.id));
  const firstPageIds = new Set((firstPageResponse.data || []).map((post) => post.id));
  const secondPageIds = new Set((secondPageResponse.data || []).map((post) => post.id));
  const overlappingPagedPosts = [...firstPageIds].filter((id) => secondPageIds.has(id));
  const failures = [];
  if ((feedResponse.totalCount || 0) < 30) failures.push("Social feed API should expose at least 30 posts.");
  if ((videoResponse.totalCount || 0) < 3) failures.push("Social feed API should expose at least 3 video posts.");
  if (!streamersJs.includes("data-stream-spotlight-card")) failures.push("Streamer page script should mark spotlight cards for tracking.");
  const pollResponse = await fetch("http://localhost:3000/api/community/feed?category=all&sort=latest&limit=40").then((response) => response.json());
  if (!(pollResponse.data || []).some((post) => Array.isArray(post.pollOptions) && post.pollOptions.length >= 2)) failures.push("Social feed API should expose poll-style posts.");
  if (!(feedResponse.data || []).some((post) => post.postType === "video_post" && post.embedUrl)) failures.push("Latest Social feed should surface at least one official video post on the first page.");
  const communityJs = fs.readFileSync(path.join(rootDir, "community.js"), "utf8");
  if (!communityJs.includes("data-load-social-video") || !communityJs.includes("social-video-preview")) failures.push("Community script should lazy-load official Social videos.");
  if (!communityJs.includes("player.twitch.tv") || !communityJs.includes("parent\", window.location.hostname")) failures.push("Community script should support official Twitch Social embeds with the current parent host.");
  if (!(videoResponse.data || []).some((post) => post.platform === "Twitch" && post.mediaType === "video" && /player\.twitch\.tv/i.test(post.embedUrl || ""))) failures.push("Community Videos API should expose at least one official Twitch Social video post.");
  if ((streamersResponse.streamingSpotlight || []).length < 7) failures.push("Streaming Spotlight API should expose at least 7 watch items.");
  if (!(streamersResponse.streamingSpotlight || []).some((item) => item.scheduled_start || String(item.status || "").toLowerCase() === "scheduled")) failures.push("Streaming Spotlight API should expose at least one scheduled/upcoming item.");
  if (!(streamersResponse.streamingSpotlight || []).every((item) => item.viewCount !== undefined && item.watchClickCount !== undefined)) failures.push("Streaming Spotlight API should expose GCX view/watch interest counts.");
  if (!communityHtml.includes("data-feed-filter=\"videos\"") || !communityHtml.includes("data-feed-filter=\"tcg\"")) failures.push("Community page is missing expanded Social filters.");
  if (!communityHtml.includes("data-feed-sort=\"latest\"") || !communityHtml.includes("data-feed-sort=\"trending\"")) failures.push("Community page is missing Latest/Trending sort controls.");
  if (!communityHtml.includes("load-more-posts")) failures.push("Community page is missing the Social load-more control.");
  if (!streamersHtml.includes("featured-stream") || !streamersHtml.includes("streaming-picks")) failures.push("Streamer page is missing Streaming Spotlight containers.");
  if (!streamersJs.includes("data-load-stream-embed")) failures.push("Streamer page script is missing click-to-load embed support.");
  if (!streamersJs.includes("player.twitch.tv") || !streamersJs.includes("parent\", window.location.hostname")) failures.push("Streamer page script should support official Twitch embeds with the current parent host.");
  if (!streamersJs.includes("data-stream-spotlight-card") || !streamersJs.includes("streaming-spotlight/views")) failures.push("Streamer page script is missing Streaming Spotlight interest tracking.");
  if (!adminHtml.includes("social-editorial-tools") || !adminHtml.includes("streaming-editorial-tools")) failures.push("Community admin is missing Social/Streaming editorial controls.");
  if (!adminHtml.includes("social-intake-form") || !adminHtml.includes("streaming-intake-form")) failures.push("Community admin is missing Social/Streaming intake forms.");
  if (!adminJs.includes("moderation-metric-row") || !adminJs.includes("watch clicks")) failures.push("Community admin should expose Streaming Spotlight GCX interest metrics.");
  if (!adminJs.includes("video loads") || !serverJs.includes('route === "feed/video-embeds"')) failures.push("Community Social video loads should be tracked and visible to staff.");
  if (!serverJs.includes("lastWatchClickedAt") || !serverJs.includes("watchClickCount")) failures.push("Editorial Streaming API should include GCX interest counts for staff review.");
  if (!serverJs.includes('route === "editorial/social-posts/intake"') || !serverJs.includes('route === "editorial/streaming-spotlight/intake"')) failures.push("Staff editorial API should expose Social and Streaming intake routes.");
  if (!serverJs.includes("findDuplicateStreamingSpotlightItem") || !serverJs.includes("findDuplicateCommunityPost(data, post)")) failures.push("Staff intake routes should use duplicate protection before saving drafts.");
  if (!adminJs.includes("pipelineStage") || !adminJs.includes("pipelineSource")) failures.push("Community admin should surface pipeline stage/source for review drafts.");
  if (!adminJs.includes("socialIntakeForm") || !adminJs.includes("streamingIntakeForm")) failures.push("Community admin should wire Social and Streaming intake forms.");
  if (!adminJs.includes("/api/community/editorial/social-posts/intake") || !adminJs.includes("/api/community/editorial/streaming-spotlight/intake")) failures.push("Community admin intake forms should post to protected intake APIs.");
  if (!adminJs.includes("data-publish=\"true\"") || !serverJs.includes("body.publish") || !serverJs.includes('pipelineStage = "publication"')) failures.push("Streaming review drafts should have an explicit publish path that advances the pipeline stage.");
  if (!serverJs.includes("scheduledSocialPosts")) failures.push("Editorial Social/Streaming API should summarize scheduled Social holds for staff.");
  if (!serverJs.includes("const responsePost = isPublicCommunityPost(post)")) failures.push("Unsave endpoint should avoid echoing stale or scheduled post content.");
  if (futureScheduledPostIds.size < 1) failures.push("Community data should include at least one future scheduled Social post for hold testing.");
  if (leakedScheduledPosts.length) failures.push("Public Social feed is leaking future scheduled posts.");
  if (stalePostIds.size < 1) failures.push("Community data should include at least one stale Social post for stale-state testing.");
  if (staleStreamingIds.size < 1) failures.push("Community data should include at least one stale Streaming Spotlight item for stale-state testing.");
  if (leakedStalePosts.length) failures.push("Public Social feeds are leaking stale posts.");
  if (leakedProfilePosts.length) failures.push("Public member profiles are leaking scheduled or stale Social posts.");
  if (leakedStaleStreams.length) failures.push("Public Streaming Spotlight API is leaking stale items.");
  if ((firstPageResponse.data || []).length !== 12 || (secondPageResponse.data || []).length !== 12) failures.push("Social feed pagination should return full first and second pages at the default page size.");
  if (firstPageResponse.nextOffset !== 12 || secondPageResponse.nextOffset !== 24) failures.push("Social feed pagination should advance nextOffset predictably.");
  if (!firstPageResponse.hasMore || !secondPageResponse.hasMore) failures.push("Social feed pagination should keep hasMore true while more public posts remain.");
  if (overlappingPagedPosts.length) failures.push("Social feed pagination returned duplicate posts across pages.");
  if (![401, 403].includes(editorialResponse.status)) failures.push("Editorial control API should require staff authentication.");
  const duplicateKeys = (feedResponse.data || []).map((post) => post.duplicateKey).filter(Boolean);
  if (new Set(duplicateKeys).size !== duplicateKeys.length) failures.push("Social feed API includes duplicate duplicateKey values.");
  if (trendingResponse.sort !== "trending") failures.push("Trending API response did not preserve sort=trending.");
  if ((trendingResponse.data || [])[0]?.id === (feedResponse.data || [])[0]?.id) failures.push("Trending and Latest currently return the same lead post; expected engagement-ranked ordering.");

  const report = {
    ok: failures.length === 0,
    mode: "api-static-fallback",
    generatedAt: new Date().toISOString(),
    browserUnavailableReason: reason,
    summary: {
      allPosts: feedResponse.totalCount || 0,
      videoPosts: videoResponse.totalCount || 0,
      streamingSpotlight: (streamersResponse.streamingSpotlight || []).length,
      featuredStream: (streamersResponse.streamingSpotlight || []).find((item) => item.featured)?.title || "",
      latestLead: (feedResponse.data || [])[0]?.title || "",
      trendingLead: (trendingResponse.data || [])[0]?.title || "",
      duplicateKeys: duplicateKeys.length,
      editorialApiUnauthenticatedStatus: editorialResponse.status,
      futureScheduledPosts: futureScheduledPostIds.size,
      leakedScheduledPosts: leakedScheduledPosts.length,
      stalePosts: stalePostIds.size,
      leakedStalePosts: leakedStalePosts.length,
      leakedProfilePosts: leakedProfilePosts.length,
      staleStreams: staleStreamingIds.size,
      leakedStaleStreams: leakedStaleStreams.length,
      paginationFirstPage: (firstPageResponse.data || []).length,
      paginationSecondPage: (secondPageResponse.data || []).length,
      paginationOverlap: overlappingPagedPosts.length,
    },
    failures,
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  const report = {
    ok: false,
    generatedAt: new Date().toISOString(),
    failures: [error.message],
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
