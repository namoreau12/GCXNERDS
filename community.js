const feed = document.querySelector("#community-feed");
const form = document.querySelector("#community-form");
const statusMessage = document.querySelector("#community-form-status");
const postCount = document.querySelector("#post-count");
const memberList = document.querySelector("#member-list");
const notificationList = document.querySelector("#notification-list");
const markNotificationsReadButton = document.querySelector("#mark-notifications-read");
const photoInput = document.querySelector("#community-photo");
const photoPreview = document.querySelector("#photo-preview");
const linkPreviewComposer = document.querySelector("#link-preview-composer");
const viewerProfileSelect = document.querySelector("#viewer-profile");
const profileForm = document.querySelector("#profile-form");
const profileFormStatus = document.querySelector("#profile-form-status");
const communityAuthPanel = document.querySelector("#community-auth-panel");
const communitySearch = document.querySelector("#community-search");
const topicList = document.querySelector("#topic-list");
const trafficHooks = document.querySelector("#traffic-hooks");
const trendingPosts = document.querySelector("#trending-posts");
const communityGroups = document.querySelector("#community-groups");
const postGroupSelect = document.querySelector("#post-group");
const loadMorePostsButton = document.querySelector("#load-more-posts");
const filterButtons = Array.from(document.querySelectorAll("[data-feed-filter]"));
const scopeButtons = Array.from(document.querySelectorAll("[data-feed-scope]"));
const sortButtons = Array.from(document.querySelectorAll("[data-feed-sort]"));
const sessionStorageKey = "gcx-session-token-v1";
const refreshStorageKey = "gcx-refresh-token-v1";
const likedStorageKey = "gcx-community-likes-v1";
const reactionStorageKey = "gcx-community-reactions-v1";
const reportedStorageKey = "gcx-community-reports-v1";
const viewerStorageKey = "gcx-community-viewer-v1";
const viewedStorageKey = "gcx-community-viewed-posts-v1";

let posts = [];
let totalPostCount = 0;
let promotions = [];
let profiles = [];
let follows = [];
let notifications = [];
let groups = [];
let viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";
let activeFilter = "all";
let activeScope = "all";
let activeSort = "latest";
let activeQuery = "";
let activeTopic = new URLSearchParams(window.location.search).get("topic") || "";
let activeGroup = new URLSearchParams(window.location.search).get("group") || "";
let feedOffset = 0;
let feedPageSize = 12;
let feedHasMore = false;
let searchTimeout = 0;
let linkPreviewTimeout = 0;
let activeSession = null;

function sessionToken() {
  return localStorage.getItem(sessionStorageKey) || "";
}

function refreshToken() {
  return localStorage.getItem(refreshStorageKey) || "";
}

function clearStoredSession() {
  localStorage.removeItem(sessionStorageKey);
  localStorage.removeItem(refreshStorageKey);
  localStorage.removeItem(viewerStorageKey);
}

function saveSession(result) {
  if (result?.token) localStorage.setItem(sessionStorageKey, result.token);
  if (result?.refreshToken) localStorage.setItem(refreshStorageKey, result.refreshToken);
  if (result?.data?.profile?.id) {
    viewerId = result.data.profile.id;
    localStorage.setItem(viewerStorageKey, viewerId);
  }
}

function authHeaders(extra = {}) {
  return {
    ...extra,
    ...(sessionToken() ? { "X-GCX-Session": sessionToken() } : {}),
  };
}

async function refreshSession() {
  const storedRefreshToken = refreshToken();
  if (!storedRefreshToken) return null;

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });
    const result = await response.json();
    if (!response.ok || !result.token) throw new Error(result.error || "Refresh failed.");
    saveSession(result);
    return result;
  } catch (error) {
    clearStoredSession();
    return null;
  }
}

function actionStatus(button, message, type = "info") {
  const container = button?.closest(".feed-actions, .comment-actions, .feed-card") || button?.parentElement;
  if (!container) return;
  let status = container.querySelector(".inline-action-status");
  if (!status) {
    status = document.createElement("span");
    status.className = "inline-action-status";
    status.setAttribute("role", "status");
    container.append(status);
  }
  status.dataset.type = type;
  status.innerHTML = message;
}

function actionErrorMessage(error) {
  const message = String(error?.message || "Action could not be saved.");
  if (/log in/i.test(message)) {
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    return `${escapeHtml(message)} <a href="auth.html?next=${next}">Sign in</a>`;
  }
  return escapeHtml(message);
}

async function loadSession(allowRefresh = true) {
  if (!sessionToken()) {
    if (refreshToken()) clearStoredSession();
    activeSession = null;
    return null;
  }

  try {
    const response = await fetch("/api/auth/session", {
      headers: authHeaders(),
      cache: "no-store",
    });
    const result = await response.json();
    activeSession = response.ok && result.authenticated ? result.data : null;
    if (!activeSession) {
      const refreshed = allowRefresh && result.refreshAvailable ? await refreshSession() : null;
      if (refreshed) return loadSession(false);
      if (!result.refreshAvailable) clearStoredSession();
    }
    if (activeSession?.profile?.id) {
      viewerId = activeSession.profile.id;
      localStorage.setItem(viewerStorageKey, viewerId);
    }
    return activeSession;
  } catch (error) {
    const refreshed = allowRefresh ? await refreshSession() : null;
    if (refreshed) return loadSession(false);
    activeSession = null;
    return null;
  }
}

function renderCommunityAuthPanel() {
  if (!communityAuthPanel) return;
  if (!activeSession) {
    communityAuthPanel.innerHTML = `
      <div class="section-heading">
        <p class="kicker">Account</p>
        <h2>Join GCX</h2>
      </div>
      <div class="auth-required-box">
        <strong>Log in to post</strong>
        <p>Visitors can read the community, but posting, commenting, reposting, saving, and reacting use member accounts.</p>
        <a class="button" href="auth.html?next=${encodeURIComponent("community.html")}">Sign in or create account</a>
      </div>
    `;
    return;
  }

  const profile = activeSession.profile || {};
  communityAuthPanel.innerHTML = `
    <div class="section-heading">
      <p class="kicker">Account</p>
      <h2>Posting As</h2>
    </div>
    <div class="auth-profile-row">
      ${profile.avatarUrl ? `<img src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(profile.displayName || "GCX member")} avatar" />` : ""}
      <div>
        <strong>${escapeHtml(profile.displayName || activeSession.email || "GCX Member")}</strong>
        <span>${escapeHtml(profile.handle || activeSession.email || "")}</span>
      </div>
    </div>
    <a class="button secondary" href="auth.html?next=${encodeURIComponent("community.html")}">Manage account</a>
  `;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function readStoredSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch (error) {
    return new Set();
  }
}

function writeStoredSet(key, values) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(values)));
  } catch (error) {
    // Engagement still works server-side if localStorage is unavailable.
  }
}

const reactionOptions = [
  { id: "like", label: "Like" },
  { id: "hype", label: "Hype" },
  { id: "want", label: "Want" },
  { id: "trade", label: "Trade" },
  { id: "watch", label: "Watch" },
];

function reactionKey(postId, reactionId) {
  return `${postId}:${reactionId}`;
}

function renderReactionBar(post, reacted) {
  const reactions = post.reactions || { like: post.likes || 0 };
  return `
    <div class="reaction-bar" aria-label="Post reactions">
      ${reactionOptions
        .map((reaction) => {
          const key = reactionKey(post.id, reaction.id);
          const count = Number(reactions[reaction.id] || 0);
          const active = reacted.has(key) || (reaction.id === "like" && readStoredSet(likedStorageKey).has(post.id));
          return `
            <button class="reaction-button ${active ? "is-active" : ""}" type="button" data-react-post="${escapeHtml(post.id)}" data-reaction="${escapeHtml(reaction.id)}" ${active ? "disabled" : ""}>
              <span>${escapeHtml(reaction.label)}</span>
              <strong>${count.toLocaleString()}</strong>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderPoll(post, reacted) {
  const options = Array.isArray(post.pollOptions) ? post.pollOptions.slice(0, 5) : [];
  if (!options.length) return "";
  const reactions = post.reactions || {};
  const total = options.reduce((sum, option) => sum + Number(reactions[option.reaction || option.id] || 0), 0);
  return `
    <div class="feed-poll" aria-label="Community poll">
      <div class="feed-poll-head">
        <span>Community poll</span>
        <strong>${total.toLocaleString()} votes</strong>
      </div>
      ${options
        .map((option) => {
          const reactionId = option.reaction || option.id;
          const count = Number(reactions[reactionId] || 0);
          const percent = total ? Math.round((count / total) * 100) : 0;
          const key = reactionKey(post.id, reactionId);
          const active = reacted.has(key);
          return `
            <button
              class="poll-option ${active ? "is-active" : ""}"
              type="button"
              data-react-post="${escapeHtml(post.id)}"
              data-reaction="${escapeHtml(reactionId)}"
              ${active ? "disabled" : ""}
            >
              <span class="poll-option-bar" style="width: ${percent}%"></span>
              <span class="poll-option-label">${escapeHtml(option.label || reactionId)}</span>
              <strong>${percent}%</strong>
              <small>${count.toLocaleString()}</small>
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function shareUrlForPost(post) {
  const url = new URL("community-post.html", window.location.href);
  url.searchParams.set("id", post.id);
  return url.toString();
}

function linkPreviewForUrl(linkUrl, fallbackTitle = "") {
  if (!linkUrl) return null;
  try {
    const parsed = new URL(linkUrl, window.location.href);
    const pathName = parsed.pathname.replace(/^\//, "");
    const sourceLabel = parsed.hostname === window.location.hostname ? "GCXNerds" : parsed.hostname.replace(/^www\./, "");
    const preview = {
      url: parsed.toString(),
      title: fallbackTitle || sourceLabel,
      description: `Shared from ${sourceLabel}`,
      imageUrl: "",
      sourceLabel,
    };

    if (pathName === "streamer.html") {
      preview.title = "GCX streamer campaign";
      preview.description = "Vote, share, and help decide which creators get the GCX weekly spotlight.";
      preview.sourceLabel = "GCX Streamer Campaign";
    } else if (pathName === "streamers.html") {
      preview.title = "GCX streamer highlights";
      preview.description = "Vote for this week's creator spotlight board.";
      preview.sourceLabel = "GCX Streamer Highlights";
    } else if (pathName === "sponsors.html") {
      preview.title = "Sponsor GCX";
      preview.description = "Reach gaming, cards, retro, and creator audiences through GCX placements.";
      preview.sourceLabel = "GCX Sponsor Path";
    } else if (["pokemon.html", "magic.html", "yugioh.html"].includes(pathName)) {
      preview.title = "GCX card database";
      preview.description = "Browse card sets, details, market context, and beta waitlist paths.";
      preview.sourceLabel = "GCX Cards";
    } else if (pathName === "games.html" || pathName.endsWith("-game.html")) {
      preview.title = fallbackTitle || "GCX game library";
      preview.description = "Game library, collection, and replay discovery path on GCX.";
      preview.sourceLabel = "GCX Games";
    }

    return preview;
  } catch (error) {
    return null;
  }
}

function renderLinkPreview(preview) {
  if (!preview?.url) return "";
  const image = preview.imageUrl ? `<img src="${escapeHtml(preview.imageUrl)}" alt="${escapeHtml(preview.title)} preview" loading="lazy" />` : "";
  return `
    <a class="link-preview-card" href="${escapeHtml(preview.url)}" target="${preview.url.startsWith("http") ? "_blank" : "_self"}" rel="noreferrer">
      ${image}
      <span>${escapeHtml(preview.sourceLabel || "Shared link")}</span>
      <strong>${escapeHtml(preview.title || "Shared link")}</strong>
      <p>${escapeHtml(preview.description || preview.url)}</p>
    </a>
  `;
}

function postTypeLabel(post) {
  const labels = {
    gcx_news_share: "GCX News Share",
    external_story_share: "External Story",
    video_post: "Video",
    community_prompt: "Discussion",
    quick_news: "Quick News",
    tcg_card_post: "TCG",
    fun_stat: "GCX Fun",
  };
  return labels[post.postType] || post.postType || "Community";
}

function renderPostSource(post) {
  const sourceName = post.sourceName || post.linkPreview?.sourceLabel || "";
  const sourceUrl = post.sourceUrl || post.linkUrl || "";
  if (!sourceName) return "";
  const label = `${post.sourceType === "gcx" ? "GCX source" : "Source"}: ${sourceName}`;
  return sourceUrl
    ? `<a class="feed-source-pill" href="${escapeHtml(sourceUrl)}" target="${sourceUrl.startsWith("http") ? "_blank" : "_self"}" rel="noreferrer">${escapeHtml(label)}</a>`
    : `<span class="feed-source-pill">${escapeHtml(label)}</span>`;
}

function youtubeThumbnailFromEmbed(embedUrl) {
  const match = String(embedUrl || "").match(/\/embed\/([^?/#]+)/i);
  return match?.[1] ? `https://img.youtube.com/vi/${encodeURIComponent(match[1])}/hqdefault.jpg` : "";
}

function isSafeYouTubeEmbed(url) {
  return /^https:\/\/(www\.)?(youtube|youtube-nocookie)\.com\/embed\//i.test(String(url || ""));
}

function isSafeTwitchEmbed(url) {
  return /^https:\/\/player\.twitch\.tv\//i.test(String(url || ""));
}

function twitchChannelFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "player.twitch.tv") return parsed.searchParams.get("channel") || "";
    if (!/(^|\.)twitch\.tv$/i.test(parsed.hostname)) return "";
    return parsed.pathname.replace(/^\/+/, "").split("/")[0] || "";
  } catch {
    return "";
  }
}

function socialEmbedUrl(post) {
  const embedUrl = String(post.embedUrl || "");
  if (isSafeYouTubeEmbed(embedUrl)) return embedUrl;
  if (isSafeTwitchEmbed(embedUrl) || normalize(post.platform) === "twitch") {
    const channel = twitchChannelFromUrl(embedUrl) || twitchChannelFromUrl(post.watchUrl || post.linkUrl || "");
    if (!channel) return "";
    const url = new URL("https://player.twitch.tv/");
    url.searchParams.set("channel", channel);
    url.searchParams.set("parent", window.location.hostname || "localhost");
    url.searchParams.set("muted", "true");
    return url.toString();
  }
  return "";
}

function isSafeSocialEmbed(url) {
  return isSafeYouTubeEmbed(url) || isSafeTwitchEmbed(url);
}

function renderOfficialEmbed(post) {
  if (normalize(post.mediaType) !== "video" || !post.embedUrl) return "";
  const embedUrl = socialEmbedUrl(post);
  if (!embedUrl) return "";
  const thumbnail = post.imageUrl || youtubeThumbnailFromEmbed(embedUrl);
  return `
    <div class="social-video-embed social-video-preview" data-provider="${escapeHtml(post.platform || "YouTube")}">
      ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(post.title)} video preview" loading="lazy" decoding="async" />` : ""}
      <button
        class="stream-load-embed"
        type="button"
        data-load-social-video="${escapeHtml(embedUrl)}"
        data-video-title="${escapeHtml(post.title)}"
        data-video-post-id="${escapeHtml(post.id)}"
      >
        Load official video
      </button>
    </div>
  `;
}

function commentReportKey(commentId) {
  return `comment:${commentId}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error || new Error("Photo could not be read.")));
    reader.readAsDataURL(file);
  });
}

async function uploadSelectedPhoto(file) {
  if (!file) return "";
  if (!sessionToken()) throw new Error("Log in to upload photos.");
  const maxBytes = 2.5 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error("Photo must be smaller than 2.5 MB.");

  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch("/api/community/uploads", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      dataUrl,
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Photo could not be uploaded.");
  return result.data.imageUrl;
}

function profileForPost(post) {
  return profiles.find((profile) => profile.id === post.profileId || profile.handle === post.handle) || null;
}

function viewerProfile() {
  return profiles.find((profile) => profile.id === viewerId) || profiles[0] || null;
}

function profileUrl(profileId) {
  return `profile.html?id=${encodeURIComponent(profileId)}`;
}

function groupForPost(post) {
  return groups.find((group) => group.id === post.groupId) || null;
}

function renderGroupSelect() {
  if (!postGroupSelect) return;
  const options = [`<option value="">Main community feed</option>`]
    .concat(
      groups.map(
        (group) => `<option value="${escapeHtml(group.id)}" ${activeGroup === group.id ? "selected" : ""}>${escapeHtml(group.name)}</option>`
      )
    )
    .join("");
  postGroupSelect.innerHTML = options;
}

function renderViewerSelect() {
  if (!viewerProfileSelect) return;
  viewerProfileSelect.innerHTML = profiles
    .map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.id === viewerId ? "selected" : ""}>${escapeHtml(profile.displayName)} (${escapeHtml(profile.handle)})</option>`)
    .join("");
}

function renderCommentComposer(postId) {
  if (!sessionToken()) {
    return `
      <div class="auth-required-box">
        <strong>Log in to comment</strong>
        <p>GCX comments use member accounts so conversations stay tied to community profiles.</p>
        <a class="button" href="auth.html?next=${encodeURIComponent(`community.html#${postId}`)}">Sign in or create account</a>
      </div>
    `;
  }

  return `
    <form class="comment-form" data-comment-form="${escapeHtml(postId)}">
      <input name="body" type="text" placeholder="Write a comment" required />
      <button class="button" type="submit">Comment</button>
    </form>
  `;
}

function discussionPromptForPost(post) {
  if (post.postType === "video_post") return "What stood out from the official video?";
  if (post.postType === "tcg_card_post") return "What would you add from a collector angle?";
  if (post.postType === "community_prompt" || post.pollOptions?.length) return "Vote above, then tell the community why.";
  if (post.postType === "gcx_news_share") return "What should GCX follow up on next?";
  return "Add a helpful reply or question for the GCX community.";
}

function renderDiscussionNudge(post) {
  const commentCount = Number(post.comments || 0);
  return `
    <div class="discussion-nudge">
      <span>${commentCount ? `${commentCount.toLocaleString()} comments so far` : "Start the discussion"}</span>
      <p>${escapeHtml(discussionPromptForPost(post))}</p>
    </div>
  `;
}

function renderMembers() {
  if (!memberList) return;
  if (!profiles.length) {
    memberList.innerHTML = `<div class="index-message">Profiles will appear here as members post.</div>`;
    return;
  }

  const followedIds = new Set(follows.map((follow) => follow.followingId));
  memberList.innerHTML = profiles
    .slice(0, 5)
    .map((profile) => {
      const interests = (profile.interests || []).slice(0, 3).map((interest) => `<span>${escapeHtml(interest)}</span>`).join("");
      const isViewer = profile.id === viewerId;
      const isFollowing = followedIds.has(profile.id);
      const friendLabel = {
        friends: "Friends",
        sent: "Request sent",
        received: "Accept friend",
        none: "Add friend",
      }[profile.friendshipStatus || "none"];
      return `
        <article class="member-card">
          <a href="${profileUrl(profile.id)}"><img src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(profile.displayName)} avatar" loading="lazy" /></a>
          <div>
            <strong><a href="${profileUrl(profile.id)}">${escapeHtml(profile.displayName)}</a></strong>
            <span>${escapeHtml(profile.handle)} · ${Number(profile.followers || 0).toLocaleString()} followers</span>
            <p>${escapeHtml(profile.bio)}</p>
            <div class="feed-tags">${interests}</div>
            ${
              isViewer
                ? `<span class="viewer-pill">You</span>`
                : `<div class="member-actions">
                    <button class="text-button" type="button" data-follow-profile="${escapeHtml(profile.id)}" data-following="${isFollowing ? "true" : "false"}">${isFollowing ? "Following" : "Follow"}</button>
                    <button class="text-button" type="button" data-friend-profile="${escapeHtml(profile.id)}" data-friend-status="${escapeHtml(profile.friendshipStatus || "none")}" ${profile.friendshipStatus === "sent" || profile.friendshipStatus === "friends" ? "disabled" : ""}>${escapeHtml(friendLabel)}</button>
                  </div>`
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function renderNotifications() {
  if (!notificationList) return;
  if (!notifications.length) {
    notificationList.innerHTML = `<div class="index-message">No notifications yet.</div>`;
    return;
  }

  notificationList.innerHTML = notifications
    .slice(0, 6)
    .map(
      (notification) => `
        <article class="notification-card ${notification.read ? "" : "is-unread"}">
          <strong>${escapeHtml(notification.title)}</strong>
          <p>${escapeHtml(notification.body)}</p>
          ${notification.url ? `<a class="feed-link" href="${escapeHtml(notification.url)}">Open</a>` : ""}
        </article>
      `
    )
    .join("");
}

function renderDiscovery(discovery) {
  if (topicList) {
    const topics = discovery.topics || [];
    topicList.innerHTML = topics.length
      ? topics
          .map(
            (topic) => `
              <button class="topic-button ${activeTopic === topic.id ? "is-active" : ""}" type="button" data-topic-id="${escapeHtml(topic.id)}">
                <strong>${escapeHtml(topic.label)}</strong>
                <span>${Number(topic.postCount || 0).toLocaleString()} posts</span>
              </button>
            `
          )
          .join("")
      : "";
  }

  if (trafficHooks) {
    const hooks = discovery.trafficHooks || [];
    trafficHooks.innerHTML = hooks.length
      ? hooks
          .map(
            (hook) => `
              <a class="traffic-hook" href="${escapeHtml(hook.url)}">
                <strong>${escapeHtml(hook.label)}</strong>
                <span>${escapeHtml(hook.metric)}</span>
              </a>
            `
          )
          .join("")
      : `<div class="index-message">Traffic hooks will appear here.</div>`;
  }

  if (trendingPosts) {
    const trending = discovery.trendingPosts || [];
    trendingPosts.innerHTML = trending.length
      ? trending
          .map(
            (post, index) => `
              <a class="trending-post-card" href="community-post.html?id=${encodeURIComponent(post.id)}">
                <span>#${index + 1} - ${escapeHtml(post.category || "Community")}</span>
                <strong>${escapeHtml(post.title)}</strong>
                <small>${Number(post.trendingScore || 0).toLocaleString()} heat - ${Number(post.comments || 0).toLocaleString()} comments - ${Number(post.savedCount || 0).toLocaleString()} saves</small>
              </a>
            `
          )
          .join("")
      : `<div class="index-message">Trending posts will appear as people react, save, and comment.</div>`;
  }

  if (communityGroups) {
    groups = discovery.groups || [];
    renderGroupSelect();
    communityGroups.innerHTML = groups.length
      ? groups
          .map(
            (group) => `
              <a class="traffic-hook ${activeGroup === group.id ? "is-active" : ""}" href="community.html?group=${encodeURIComponent(group.id)}">
                <strong>${escapeHtml(group.name)}</strong>
                <span>${Number(group.postCount || 0).toLocaleString()} posts - ${escapeHtml(group.category)}</span>
              </a>
            `
          )
          .join("")
      : `<div class="index-message">Groups will appear here.</div>`;
  }
}

function postMatchesFilter(post, filter) {
  if (filter === "all") return true;
  const category = normalize(post.category);
  const type = normalize(post.postType);
  const source = normalize(post.sourceType);
  const media = normalize(post.mediaType);
  const tags = new Set((post.tags || []).map((tag) => normalize(tag)));
  if (filter === "videos") return type === "video_post" || media === "video" || Boolean(post.embedUrl);
  if (filter === "gcx") return category === "gcx" || source === "gcx";
  if (filter === "tcg") return category === "tcg" || type === "tcg_card_post" || tags.has("tcg");
  if (filter === "pokemon") return category === "pokemon" || tags.has("pokemon") || normalize(`${post.title} ${post.body}`).includes("pokemon");
  return category === filter || tags.has(filter);
}

function renderPosts() {
  const visible = posts.filter((post) => postMatchesFilter(post, activeFilter));
  const liked = readStoredSet(likedStorageKey);
  const reacted = readStoredSet(reactionStorageKey);
  const reported = readStoredSet(reportedStorageKey);
  postCount.textContent = String(Number(totalPostCount || posts.length).toLocaleString());

  if (!visible.length) {
    feed.innerHTML = `<div class="index-message">No posts in this topic yet.</div>`;
    return;
  }

  const cards = [];
  visible.forEach((post, index) => {
      const tags = (post.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
      const image = post.imageUrl && normalize(post.mediaType) !== "video"
        ? `<a href="${escapeHtml(post.imageUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy" decoding="async" /></a>`
        : "";
      const link = post.linkUrl
        ? `<a class="feed-link" href="${escapeHtml(post.linkUrl)}" target="${post.linkUrl.startsWith("http") ? "_blank" : "_self"}" rel="noreferrer">Open shared link</a>`
        : "";
      const linkPreview = renderLinkPreview(post.linkPreview || linkPreviewForUrl(post.linkUrl, post.title));
      const postShareUrl = shareUrlForPost(post);
      const profile = profileForPost(post);
      const profileMarkup = profile?.avatarUrl
        ? `<img src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(profile.displayName)} avatar" loading="lazy" />`
        : `<span>${escapeHtml((post.author || "?").slice(0, 1))}</span>`;
      const authorMarkup = profile
        ? `<a href="${profileUrl(profile.id)}">${escapeHtml(post.author)}</a>`
        : escapeHtml(post.author);
      const avatarMarkup = profile
        ? `<a class="feed-avatar" href="${profileUrl(profile.id)}">${profileMarkup}</a>`
        : `<div class="feed-avatar">${profileMarkup}</div>`;
      const group = groupForPost(post);
      const groupBadge = group
        ? `<a class="feed-group-badge" href="community.html?group=${encodeURIComponent(group.id)}">${escapeHtml(group.name)}</a>`
        : "";
      const reshared = post.resharedPost
        ? `
          <a class="reshared-post-card" href="community-post.html?id=${encodeURIComponent(post.resharedPost.id)}">
            <span>Originally shared by ${escapeHtml(post.resharedPost.author || "GCX Member")}</span>
            <strong>${escapeHtml(post.resharedPost.title)}</strong>
            <p>${escapeHtml(post.resharedPost.body)}</p>
          </a>
        `
        : "";

      cards.push(`
        <article class="feed-card" data-post-card="${escapeHtml(post.id)}">
          <div class="feed-card-head">
            ${avatarMarkup}
            <div>
              <strong>${authorMarkup}</strong>
            <span>${escapeHtml(post.handle || "")} · ${escapeHtml(formatDate(post.createdAt))}</span>
            </div>
            <span class="feed-category">${escapeHtml(post.category)}</span>
          </div>
          <div class="feed-meta-row">
            <span class="feed-type-pill">${escapeHtml(postTypeLabel(post))}</span>
            ${renderPostSource(post)}
          </div>
          ${groupBadge}
          ${renderOfficialEmbed(post)}
          ${image}
          <h3>${escapeHtml(post.title)}</h3>
          <p class="feed-card-body">${escapeHtml(post.body)}</p>
          ${reshared}
          ${linkPreview}
          <div class="feed-tags">${tags}</div>
          ${post.pollOptions?.length ? renderPoll(post, reacted) : renderReactionBar(post, reacted)}
          <div class="feed-actions">
            <a class="feed-discussion-link" href="community-post.html?id=${encodeURIComponent(post.id)}">Open discussion</a>
            ${link}
            <button class="text-button" type="button" data-save-post="${escapeHtml(post.id)}" data-saved="${post.isSaved ? "true" : "false"}">
              ${post.isSaved ? "Saved" : "Save"} · ${Number(post.savedCount || 0).toLocaleString()}
            </button>
            <button class="text-button" type="button" data-reshare-post="${escapeHtml(post.id)}">Repost</button>
            <button class="text-button" type="button" data-share-url="${escapeHtml(postShareUrl)}">Copy share link</button>
            <button class="text-button muted" type="button" data-report-post="${escapeHtml(post.id)}" ${reported.has(post.id) ? "disabled" : ""}>
              ${reported.has(post.id) ? "Reported" : "Report"}
            </button>
            <div class="feed-metrics">
              <span>${Number(post.comments || 0).toLocaleString()} comments</span>
              <span data-view-count>${Number(post.viewCount || 0).toLocaleString()} views</span>
            </div>
          </div>
          ${renderDiscussionNudge(post)}
          <details class="comment-drawer">
            <summary>${Number(post.comments || 0) ? `View ${Number(post.comments || 0).toLocaleString()} comments and reply` : "Be first to comment"}</summary>
            <div class="comment-list" data-comments-for="${escapeHtml(post.id)}"></div>
            ${renderCommentComposer(post.id)}
          </details>
        </article>
      `);

      if (index === 0 && promotions[0]) cards.push(renderPromotion(promotions[0]));
      if (index === 2 && promotions[1]) cards.push(renderPromotion(promotions[1]));
    });

  if (visible.length < 3 && promotions[1]) cards.push(renderPromotion(promotions[1]));
  feed.innerHTML = cards.join("");
  if (loadMorePostsButton) {
    loadMorePostsButton.hidden = !feedHasMore;
    loadMorePostsButton.disabled = false;
    loadMorePostsButton.textContent = feedHasMore ? "Load more posts" : "All caught up";
  }
  trackVisiblePostViews();
}

async function trackVisiblePostViews() {
  const viewed = readStoredSet(viewedStorageKey);
  const postIds = Array.from(feed.querySelectorAll("[data-post-card]"))
    .map((card) => card.dataset.postCard)
    .filter((id) => id && !viewed.has(id))
    .slice(0, 30);
  if (!postIds.length) return;
  postIds.forEach((id) => viewed.add(id));
  writeStoredSet(viewedStorageKey, viewed);
  try {
    const response = await fetch(`/api/community/feed/views?viewerId=${encodeURIComponent(viewerId)}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ postIds }),
    });
    if (!response.ok) return;
    const result = await response.json();
    const counts = new Map((result.data || []).map((item) => [item.id, item.viewCount]));
    posts = posts.map((post) => counts.has(post.id) ? { ...post, viewCount: counts.get(post.id) } : post);
    feed.querySelectorAll("[data-post-card]").forEach((card) => {
      const post = posts.find((item) => item.id === card.dataset.postCard);
      const viewLabel = card.querySelector("[data-view-count]");
      if (post && viewLabel) viewLabel.textContent = `${Number(post.viewCount || 0).toLocaleString()} views`;
    });
  } catch {
    // View counts are progressive enhancement; reading the feed should not fail if tracking is unavailable.
  }
}

function renderPromotion(promotion) {
  const image = promotion.imageUrl
    ? `<a href="${escapeHtml(promotion.destinationUrl)}" data-promotion-click="${escapeHtml(promotion.id)}"><img src="${escapeHtml(promotion.imageUrl)}" alt="${escapeHtml(promotion.title)}" loading="lazy" /></a>`
    : "";
  return `
    <article class="feed-card sponsored-card">
      <div class="feed-card-head">
        <div class="feed-avatar sponsor-avatar">Ad</div>
        <div>
          <strong>${escapeHtml(promotion.sponsorName)}</strong>
          <span>${escapeHtml(promotion.packageType || "Sponsored placement")}</span>
        </div>
        <span class="feed-category sponsored-label">Sponsored</span>
      </div>
      ${image}
      <h3>${escapeHtml(promotion.title)}</h3>
      <p>${escapeHtml(promotion.body)}</p>
      <div class="feed-actions">
        <a class="button secondary" href="${escapeHtml(promotion.destinationUrl)}" data-promotion-click="${escapeHtml(promotion.id)}">${escapeHtml(promotion.ctaLabel || "Open sponsor offer")}</a>
        <span>${Number(promotion.clicks || 0).toLocaleString()} clicks tracked</span>
      </div>
    </article>
  `;
}

async function loadComments(postId) {
  const target = feed.querySelector(`[data-comments-for="${CSS.escape(postId)}"]`);
  if (!target || target.dataset.loaded === "true") return;
  const post = posts.find((item) => item.id === postId);
  target.innerHTML = `<div class="index-message">Loading comments...</div>`;

  try {
    const response = await fetch(`/api/community/comments?postId=${encodeURIComponent(postId)}`);
    if (!response.ok) throw new Error(`Comments returned ${response.status}`);
    const result = await response.json();
    const comments = result.data || [];
    const reported = readStoredSet(reportedStorageKey);
    target.dataset.loaded = "true";
    target.innerHTML = comments.length
      ? comments
          .map(
            (comment) => `
              <article class="comment-card">
                <strong>${escapeHtml(comment.author)}</strong>
                <span>${escapeHtml(comment.handle || "")} · ${escapeHtml(formatDate(comment.createdAt))}</span>
                <p>${escapeHtml(comment.body)}</p>
                <button class="text-button muted" type="button" data-report-comment="${escapeHtml(comment.id)}" ${reported.has(commentReportKey(comment.id)) ? "disabled" : ""}>
                  ${reported.has(commentReportKey(comment.id)) ? "Reported" : "Report comment"}
                </button>
              </article>
            `
          )
          .join("")
      : `<div class="index-message">No comments yet. ${escapeHtml(post ? discussionPromptForPost(post) : "Start the conversation.")}</div>`;
  } catch (error) {
    target.innerHTML = `<div class="index-message">Comments could not be loaded.</div>`;
  }
}

async function loadPosts({ append = false } = {}) {
  try {
    if (!append) feedOffset = 0;
    const params = new URLSearchParams({
      viewerId,
      scope: activeScope,
      sort: activeSort,
      category: activeFilter,
      q: activeQuery,
      topic: activeTopic,
      group: activeGroup,
      limit: String(feedPageSize),
      offset: String(feedOffset),
    });
    const response = await fetch(`/api/community/feed?${params.toString()}`);
    if (!response.ok) throw new Error(`Community feed returned ${response.status}`);
    const result = await response.json();
    const nextPosts = result.data || [];
    posts = append ? [...posts, ...nextPosts] : nextPosts;
    totalPostCount = Number(result.totalCount || posts.length);
    feedOffset = Number(result.nextOffset ?? posts.length);
    feedHasMore = Boolean(result.hasMore);
    promotions = result.promotions || [];
    profiles = result.profiles || [];
    follows = result.follows || [];
    viewerId = result.viewerId || viewerId;
    if (activeSession?.profile?.id) {
      localStorage.setItem(viewerStorageKey, viewerId);
    }
    renderViewerSelect();
    renderMembers();
    renderPosts();
  } catch (error) {
    feed.innerHTML = `<div class="index-message">Community posts could not be loaded. Make sure the local server is running.</div>`;
    if (loadMorePostsButton) loadMorePostsButton.hidden = true;
  }
}

async function loadDiscovery() {
  try {
    const response = await fetch("/api/community/discovery");
    if (!response.ok) throw new Error(`Discovery returned ${response.status}`);
    const result = await response.json();
    renderDiscovery(result.data || {});
  } catch (error) {
    if (topicList) topicList.innerHTML = "";
    if (trafficHooks) trafficHooks.innerHTML = `<div class="index-message">Discovery links could not be loaded.</div>`;
  }
}

async function loadNotifications() {
  if (!notificationList) return;
  if (!activeSession) {
    notifications = [];
    notificationList.innerHTML = `<div class="index-message">Sign in to see notifications.</div>`;
    return;
  }
  try {
    const response = await fetch(`/api/community/notifications?viewerId=${encodeURIComponent(viewerId)}`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Notifications returned ${response.status}`);
    const result = await response.json();
    notifications = result.data || [];
    renderNotifications();
  } catch (error) {
    notificationList.innerHTML = `<div class="index-message">Notifications could not be loaded.</div>`;
  }
}

memberList?.addEventListener("click", async (event) => {
  const friendButton = event.target.closest("[data-friend-profile]");
  if (friendButton && !friendButton.disabled) {
    const otherProfileId = friendButton.dataset.friendProfile;
    const status = friendButton.dataset.friendStatus;
    friendButton.disabled = true;
    friendButton.textContent = status === "received" ? "Accepting..." : "Sending...";

    try {
      const endpoint = status === "received" ? "accept" : "request";
      const payload =
        status === "received"
          ? { requesterId: otherProfileId, addresseeId: viewerId }
          : { requesterId: viewerId, addresseeId: otherProfileId };
      const response = await fetch(`/api/community/friends/${endpoint}?viewerId=${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Friend action failed.");
      await loadPosts();
      await loadNotifications();
    } catch (error) {
      friendButton.disabled = false;
      friendButton.textContent = status === "received" ? "Accept friend" : "Add friend";
    }
    return;
  }

  const button = event.target.closest("[data-follow-profile]");
  if (!button) return;

  const followingId = button.dataset.followProfile;
  const isFollowing = button.dataset.following === "true";
  button.disabled = true;
  button.textContent = isFollowing ? "Unfollowing..." : "Following...";

  try {
    const response = await fetch(`/api/community/profiles/${isFollowing ? "unfollow" : "follow"}?viewerId=${encodeURIComponent(viewerId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId: viewerId, followingId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Follow action failed.");

    const profile = profiles.find((item) => item.id === followingId);
    if (profile) profile.followers = Math.max(0, Number(profile.followers || 0) + (isFollowing ? -1 : 1));

    if (isFollowing) {
      follows = follows.filter((follow) => !(follow.followerId === viewerId && follow.followingId === followingId));
    } else {
      follows.push(result.data.follow);
    }

    renderMembers();
  } catch (error) {
    button.disabled = false;
    button.textContent = isFollowing ? "Following" : "Follow";
  }
});

markNotificationsReadButton?.addEventListener("click", async () => {
  if (!activeSession) {
    markNotificationsReadButton.textContent = "Sign in first";
    return;
  }
  markNotificationsReadButton.disabled = true;
  markNotificationsReadButton.textContent = "Saving...";

  try {
    const response = await fetch(`/api/community/notifications/read?viewerId=${encodeURIComponent(viewerId)}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error("Notifications could not be updated.");
    await loadNotifications();
    markNotificationsReadButton.textContent = "Marked read";
  } catch (error) {
    markNotificationsReadButton.textContent = "Try again";
  } finally {
    markNotificationsReadButton.disabled = false;
  }
});

viewerProfileSelect?.addEventListener("change", async () => {
  viewerId = viewerProfileSelect.value;
  localStorage.setItem(viewerStorageKey, viewerId);
  await loadPosts();
  await loadNotifications();
});

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  profileFormStatus.textContent = "Creating...";
  const formData = new FormData(profileForm);

  try {
    const response = await fetch("/api/community/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: formData.get("displayName"),
        handle: formData.get("handle"),
        bio: formData.get("bio"),
        interests: formData.get("interests"),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Profile could not be created.");
    profiles.push(result.data);
    viewerId = result.data.id;
    localStorage.setItem(viewerStorageKey, viewerId);
    profileForm.reset();
    profileFormStatus.textContent = "Profile created.";
    renderViewerSelect();
    renderMembers();
    await loadNotifications();
  } catch (error) {
    profileFormStatus.textContent = error.message;
  }
});

feed?.addEventListener("click", async (event) => {
  const likeButton = event.target.closest("[data-like-post]");
  const reactionButton = event.target.closest("[data-react-post]");
  const saveButton = event.target.closest("[data-save-post]");
  const reportButton = event.target.closest("[data-report-post]");
  const commentReportButton = event.target.closest("[data-report-comment]");
  const shareButton = event.target.closest("[data-share-url]");
  const reshareButton = event.target.closest("[data-reshare-post]");
  const promotionLink = event.target.closest("[data-promotion-click]");
  const commentDrawer = event.target.closest("details.comment-drawer");
  const videoButton = event.target.closest("[data-load-social-video]");

  if (promotionLink) {
    fetch("/api/community/promotions/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        promotionId: promotionLink.dataset.promotionClick,
        path: `${window.location.pathname}${window.location.search}`,
      }),
    }).catch(() => {
      // Sponsored links should still work if tracking fails.
    });
  }

  if (commentDrawer && event.target.tagName === "SUMMARY") {
    const commentTarget = commentDrawer.querySelector("[data-comments-for]");
    if (commentTarget) loadComments(commentTarget.dataset.commentsFor);
  }

  if (videoButton) {
    const embedUrl = videoButton.dataset.loadSocialVideo || "";
    if (!isSafeSocialEmbed(embedUrl)) return;
    const container = videoButton.closest(".social-video-embed");
    if (!container) return;
    const postId = videoButton.dataset.videoPostId || "";
    container.classList.remove("social-video-preview");
    container.innerHTML = `
      <iframe
        src="${escapeHtml(embedUrl)}"
        title="${escapeHtml(videoButton.dataset.videoTitle || "Official video")}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    `;
    if (postId) {
      fetch("/api/community/feed/video-embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      }).catch(() => {
        // Video engagement metrics should never block the official embed.
      });
    }
    return;
  }

  if (shareButton) {
    try {
      await navigator.clipboard.writeText(shareButton.dataset.shareUrl);
      shareButton.textContent = "Copied";
    } catch (error) {
      shareButton.textContent = "Copy failed";
    }
    return;
  }

  if (reshareButton) {
    const postId = reshareButton.dataset.resharePost;
    const sourcePost = posts.find((post) => post.id === postId);
    const note = window.prompt("Add a note for your repost", sourcePost ? `Worth checking out: ${sourcePost.title}` : "Worth checking out.");
    if (note === null) return;
    reshareButton.disabled = true;
    reshareButton.textContent = "Reposting...";

    try {
      const viewer = viewerProfile();
      const response = await fetch(`/api/community/feed/reshare?viewerId=${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          postId,
          profileId: viewer?.id || viewerId,
          body: note,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Post could not be reshared.");
      posts = [result.data, ...posts];
      renderPosts();
      await loadNotifications();
    } catch (error) {
      reshareButton.disabled = false;
      reshareButton.textContent = "Try repost";
    }
    return;
  }

  if (reactionButton) {
    const postId = reactionButton.dataset.reactPost;
    const reaction = reactionButton.dataset.reaction || "like";
    const reacted = readStoredSet(reactionStorageKey);
    const key = reactionKey(postId, reaction);
    if (reacted.has(key)) return;
    reactionButton.disabled = true;

    try {
      const response = await fetch(`/api/community/feed/react?viewerId=${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ postId, reaction }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Reaction could not be saved.");
      posts = posts.map((post) => (post.id === postId ? result.data : post));
      reacted.add(key);
      writeStoredSet(reactionStorageKey, reacted);
      if (reaction === "like") {
        const liked = readStoredSet(likedStorageKey);
        liked.add(postId);
        writeStoredSet(likedStorageKey, liked);
      }
      renderPosts();
      await loadNotifications();
    } catch (error) {
      reactionButton.disabled = false;
    }
    return;
  }

  if (saveButton) {
    const postId = saveButton.dataset.savePost;
    const isSaved = saveButton.dataset.saved === "true";
    saveButton.disabled = true;

    try {
      const response = await fetch(`/api/community/feed/${isSaved ? "unsave" : "save"}?viewerId=${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ postId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Saved post could not be updated.");
      posts = posts.map((post) => (post.id === postId ? result.data : post));
      renderPosts();
    } catch (error) {
      saveButton.disabled = false;
    }
    return;
  }

  if (likeButton) {
    const postId = likeButton.dataset.likePost;
    const liked = readStoredSet(likedStorageKey);
    if (liked.has(postId)) return;
    likeButton.disabled = true;

    try {
      const response = await fetch("/api/community/feed/like", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ postId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Like could not be saved.");
      posts = posts.map((post) => (post.id === postId ? result.data : post));
      liked.add(postId);
      writeStoredSet(likedStorageKey, liked);
      renderPosts();
    } catch (error) {
      likeButton.disabled = false;
    }
    return;
  }

  if (reportButton) {
    const postId = reportButton.dataset.reportPost;
    const reported = readStoredSet(reportedStorageKey);
    if (reported.has(postId)) return;
    if (!sessionToken()) {
      actionStatus(reportButton, actionErrorMessage(new Error("Log in to report GCX posts.")), "error");
      return;
    }
    reportButton.disabled = true;

    try {
      const response = await fetch("/api/community/feed/report", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ postId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Report could not be saved.");
      posts = posts.filter((post) => post.id !== postId || result.data.status === "published");
      reported.add(postId);
      writeStoredSet(reportedStorageKey, reported);
      renderPosts();
    } catch (error) {
      reportButton.disabled = false;
      actionStatus(reportButton, actionErrorMessage(error), "error");
    }
    return;
  }

  if (commentReportButton) {
    const commentId = commentReportButton.dataset.reportComment;
    const reported = readStoredSet(reportedStorageKey);
    const key = commentReportKey(commentId);
    if (reported.has(key)) return;
    if (!sessionToken()) {
      actionStatus(commentReportButton, actionErrorMessage(new Error("Log in to report GCX comments.")), "error");
      return;
    }
    commentReportButton.disabled = true;

    try {
      const response = await fetch("/api/community/comments/report", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ commentId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Report could not be saved.");
      reported.add(key);
      writeStoredSet(reportedStorageKey, reported);
      commentReportButton.textContent = "Reported";
    } catch (error) {
      commentReportButton.disabled = false;
      actionStatus(commentReportButton, actionErrorMessage(error), "error");
    }
  }
});

feed?.addEventListener("submit", async (event) => {
  const commentForm = event.target.closest("[data-comment-form]");
  if (!commentForm) return;
  event.preventDefault();

  const postId = commentForm.dataset.commentForm;
  const formData = new FormData(commentForm);
  const button = commentForm.querySelector("button");
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const response = await fetch("/api/community/comments", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        postId,
        body: formData.get("body"),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Comment could not be saved.");
    const post = posts.find((item) => item.id === postId);
    if (post) post.comments = Number(post.comments || 0) + 1;
    const commentList = feed.querySelector(`[data-comments-for="${CSS.escape(postId)}"]`);
    if (commentList) {
      commentList.dataset.loaded = "false";
      await loadComments(postId);
    }
    commentForm.reset();
    renderPosts();
  } catch (error) {
    button.textContent = error.message?.includes("Log in") ? "Log in required" : "Try again";
  } finally {
    button.disabled = false;
    if (button.textContent === "Saving...") button.textContent = "Comment";
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    activeFilter = button.dataset.feedFilter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    await loadPosts();
  });
});

scopeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    activeScope = activeScope === button.dataset.feedScope ? "all" : button.dataset.feedScope;
    scopeButtons.forEach((item) => item.classList.toggle("is-active", activeScope === item.dataset.feedScope));
    await loadPosts();
  });
});

sortButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    activeSort = button.dataset.feedSort || "latest";
    sortButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    await loadPosts();
  });
});

loadMorePostsButton?.addEventListener("click", async () => {
  loadMorePostsButton.disabled = true;
  loadMorePostsButton.textContent = "Loading...";
  await loadPosts({ append: true });
});

communitySearch?.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    activeQuery = communitySearch.value.trim();
    await loadPosts();
  }, 250);
});

topicList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-topic-id]");
  if (!button) return;
  activeTopic = activeTopic === button.dataset.topicId ? "" : button.dataset.topicId;
  await loadPosts();
  await loadDiscovery();
});

photoInput?.addEventListener("change", async () => {
  const file = photoInput.files?.[0];
  if (!photoPreview) return;
  photoPreview.innerHTML = "";
  if (!file) return;

  try {
    const dataUrl = await readFileAsDataUrl(file);
    photoPreview.innerHTML = `
      <img src="${escapeHtml(dataUrl)}" alt="Selected upload preview" />
      <span>${escapeHtml(file.name)} · ${(file.size / 1024).toFixed(0)} KB</span>
    `;
  } catch (error) {
    photoPreview.innerHTML = `<span>${escapeHtml(error.message)}</span>`;
  }
});

form?.elements.linkUrl?.addEventListener("input", () => {
  clearTimeout(linkPreviewTimeout);
  linkPreviewTimeout = setTimeout(() => {
    if (!linkPreviewComposer) return;
    const preview = linkPreviewForUrl(form.elements.linkUrl.value, form.elements.title?.value || "");
    linkPreviewComposer.hidden = !preview;
    linkPreviewComposer.innerHTML = preview ? renderLinkPreview(preview) : "";
  }, 150);
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!sessionToken()) {
    statusMessage.textContent = "Log in to publish a GCX community post.";
    return;
  }
  statusMessage.textContent = "Publishing...";
  const formData = new FormData(form);
  const tags = normalize(formData.get("category"))
    ? [String(formData.get("category"))]
    : [];

  try {
    const uploadedImageUrl = await uploadSelectedPhoto(photoInput?.files?.[0]);
    const response = await fetch("/api/community/feed", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        category: formData.get("category"),
        title: formData.get("title"),
        body: formData.get("body"),
        linkUrl: formData.get("linkUrl"),
        imageUrl: uploadedImageUrl || formData.get("imageUrl"),
        groupId: formData.get("groupId"),
        tags,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Post could not be published.");
    posts.unshift(result.data);
    form.reset();
    renderGroupSelect();
    if (photoPreview) photoPreview.innerHTML = "";
    if (linkPreviewComposer) {
      linkPreviewComposer.hidden = true;
      linkPreviewComposer.innerHTML = "";
    }
    statusMessage.textContent = "Post published.";
    renderPosts();
  } catch (error) {
    statusMessage.textContent = error.message;
  }
});

function applySharePrefill() {
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("shareUrl")) return;
  const title = params.get("title") || "Shared from GCX";
  const body = params.get("body") || "Thought this belonged in the GCX community feed.";
  const category = params.get("category") || "Streaming";
  form.elements.title.value = title;
  form.elements.body.value = body;
  form.elements.linkUrl.value = params.get("shareUrl") || "";
  form.elements.category.value = category;
  const preview = linkPreviewForUrl(form.elements.linkUrl.value, title);
  if (linkPreviewComposer && preview) {
    linkPreviewComposer.hidden = false;
    linkPreviewComposer.innerHTML = renderLinkPreview(preview);
  }
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

loadSession().then(() => {
  renderCommunityAuthPanel();
  loadDiscovery();
  loadPosts().then(loadNotifications).then(applySharePrefill);
});
