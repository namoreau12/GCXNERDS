const profileHero = document.querySelector("#profile-hero");
const profilePosts = document.querySelector("#profile-posts");
const profileEditSection = document.querySelector("#profile-edit-section");
const profileEditForm = document.querySelector("#profile-edit-form");
const profileEditStatus = document.querySelector("#profile-edit-status");
const viewerStorageKey = "gcx-community-viewer-v1";
const sessionStorageKey = "gcx-session-token-v1";
let currentProfile = null;

function sessionToken() {
  return localStorage.getItem(sessionStorageKey) || "";
}

function authHeaders(extra = {}) {
  const token = sessionToken();
  return token ? { ...extra, "X-GCX-Session": token } : extra;
}

function requireSignedInForAction() {
  if (sessionToken()) return true;
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.href = `auth.html?next=${encodeURIComponent(next)}`;
  return false;
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
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function renderResharedPost(post) {
  return post.resharedPost
    ? `
      <a class="reshared-post-card" href="community-post.html?id=${encodeURIComponent(post.resharedPost.id)}">
        <span>Originally shared by ${escapeHtml(post.resharedPost.author || "GCX Member")}</span>
        <strong>${escapeHtml(post.resharedPost.title)}</strong>
        <p>${escapeHtml(post.resharedPost.body)}</p>
      </a>
    `
    : "";
}

function renderPostCard(post) {
  return `
    <article class="feed-card">
      ${post.imageUrl ? `<a href="${escapeHtml(post.imageUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" /></a>` : ""}
      <div class="feed-card-head">
        <div>
          <strong>${escapeHtml(post.title)}</strong>
          <span>${escapeHtml(post.category)} - ${escapeHtml(formatDate(post.createdAt))}</span>
        </div>
      </div>
      <p>${escapeHtml(post.body)}</p>
      ${renderResharedPost(post)}
      <div class="feed-actions">
        <a class="button secondary" href="community-post.html?id=${encodeURIComponent(post.id)}">Open post</a>
        ${post.linkUrl ? `<a class="feed-link" href="${escapeHtml(post.linkUrl)}">Open shared link</a>` : ""}
        <span>${Number(post.likes || 0).toLocaleString()} likes</span>
        <span>${Number(post.comments || 0).toLocaleString()} comments</span>
      </div>
    </article>
  `;
}

function renderActivityItem(item) {
  return `
    <a class="profile-activity-item" href="${escapeHtml(item.url || "community-activity.html")}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.type || "activity")} - ${escapeHtml(formatDate(item.createdAt))}</span>
      <p>${escapeHtml(item.body || "")}</p>
    </a>
  `;
}

function renderGroupItem(group) {
  return `
    <a class="profile-group-card" href="${escapeHtml(group.url || `community.html?group=${encodeURIComponent(group.id)}`)}">
      <strong>${escapeHtml(group.name)}</strong>
      <span>${escapeHtml(group.category || "Community")} - ${escapeHtml(group.role || "member")}</span>
      <p>${escapeHtml(group.description || "Community group")}</p>
    </a>
  `;
}

function renderSection(title, eyebrow, content, emptyMessage) {
  return `
    <section class="profile-timeline-section">
      <div class="section-heading">
        <p class="kicker">${escapeHtml(eyebrow)}</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${content || `<div class="index-message">${escapeHtml(emptyMessage)}</div>`}
    </section>
  `;
}

function renderProfile(profile) {
  currentProfile = profile;
  const interests = (profile.interests || []).map((interest) => `<span>${escapeHtml(interest)}</span>`).join("");
  const stats = profile.stats || {};
  const friendLabel = {
    friends: "Friends",
    sent: "Request sent",
    received: "Accept friend",
    none: "Add friend",
    self: "This is you",
  }[profile.friendshipStatus || "none"];

  profileHero.innerHTML = `
    <img src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(profile.displayName)} avatar" />
    <div>
      <p class="kicker">Member Profile</p>
      <h1>${escapeHtml(profile.displayName)}</h1>
      <p class="profile-handle">${escapeHtml(profile.handle)} - Joined ${escapeHtml(formatDate(profile.joinedAt))}</p>
      <p>${escapeHtml(profile.bio)}</p>
      <div class="profile-stats">
        <span><strong>${Number(profile.followers || 0).toLocaleString()}</strong> followers</span>
        <span><strong>${Number(profile.following || 0).toLocaleString()}</strong> following</span>
        <span><strong>${Number(stats.posts || 0).toLocaleString()}</strong> posts</span>
        <span><strong>${Number(stats.reposts || 0).toLocaleString()}</strong> reposts</span>
        <span><strong>${Number(stats.groups || 0).toLocaleString()}</strong> groups</span>
      </div>
      <div class="feed-tags">${interests}</div>
      <div class="streamer-actions">
        <button class="button" type="button" data-follow-profile="${escapeHtml(profile.id)}" ${profile.isViewer ? "disabled" : ""}>
          ${profile.isViewer ? "This is you" : profile.isFollowing ? "Following" : "Follow"}
        </button>
        <button class="button secondary" type="button" data-friend-profile="${escapeHtml(profile.id)}" data-friend-status="${escapeHtml(profile.friendshipStatus || "none")}" data-friendship-id="${escapeHtml(profile.friendshipId || "")}" ${profile.isViewer || profile.friendshipStatus === "sent" || profile.friendshipStatus === "friends" ? "disabled" : ""}>
          ${escapeHtml(friendLabel)}
        </button>
        <a class="button secondary" href="community-inbox.html?to=${encodeURIComponent(profile.id)}" ${profile.isViewer ? "aria-disabled=\"true\"" : ""}>Message</a>
        <a class="button secondary" href="community.html">Back to community</a>
      </div>
    </div>
  `;

  profilePosts.innerHTML = [
    renderSection("Posts", "Published", (profile.posts || []).map(renderPostCard).join(""), "No original posts yet."),
    renderSection("Reposts", "Shared Again", (profile.reposts || []).map(renderPostCard).join(""), "No reposts yet."),
    renderSection("Activity", "Social Trail", (profile.activity || []).map(renderActivityItem).join(""), "No activity yet."),
    renderSection("Groups", "Communities", (profile.groups || []).map(renderGroupItem).join(""), "No groups joined yet."),
  ].join("");

  if (profileEditSection && profileEditForm) {
    profileEditSection.hidden = !profile.isViewer;
    if (profile.isViewer) {
      profileEditForm.displayName.value = profile.displayName || "";
      profileEditForm.avatarUrl.value = profile.avatarUrl || "";
      profileEditForm.bio.value = profile.bio || "";
      profileEditForm.interests.value = (profile.interests || []).join(", ");
    }
  }
}

async function loadProfile() {
  const params = new URLSearchParams(window.location.search);
  const viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";
  const profileId = params.get("id") || viewerId;

  try {
    const response = await fetch(`/api/community/profiles/${encodeURIComponent(profileId)}?viewerId=${encodeURIComponent(viewerId)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Profile could not be loaded.");
    renderProfile(result.data);
  } catch (error) {
    profileHero.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
    profilePosts.innerHTML = "";
  }
}

profileHero?.addEventListener("click", async (event) => {
  const friendButton = event.target.closest("[data-friend-profile]");
  if (friendButton && !friendButton.disabled) {
    if (!requireSignedInForAction()) return;
    const viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";
    const otherProfileId = friendButton.dataset.friendProfile;
    const status = friendButton.dataset.friendStatus;
    friendButton.disabled = true;
    friendButton.textContent = status === "received" ? "Accepting..." : "Sending...";

    try {
      const endpoint = status === "received" ? "accept" : "request";
      const payload =
        status === "received"
          ? { friendshipId: friendButton.dataset.friendshipId, requesterId: otherProfileId, addresseeId: viewerId }
          : { requesterId: viewerId, addresseeId: otherProfileId };
      const response = await fetch(`/api/community/friends/${endpoint}?viewerId=${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Friend action failed.");
      await loadProfile();
    } catch (error) {
      friendButton.disabled = false;
      friendButton.textContent = status === "received" ? "Accept friend" : "Add friend";
    }
    return;
  }

  const button = event.target.closest("[data-follow-profile]");
  if (!button || button.disabled) return;
  if (!requireSignedInForAction()) return;

  const viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";
  const followingId = button.dataset.followProfile;
  const isFollowing = button.textContent.trim() === "Following";
  button.disabled = true;
  button.textContent = isFollowing ? "Unfollowing..." : "Following...";

  try {
    const response = await fetch(`/api/community/profiles/${isFollowing ? "unfollow" : "follow"}?viewerId=${encodeURIComponent(viewerId)}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ followerId: viewerId, followingId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Follow action failed.");
    await loadProfile();
  } catch (error) {
    button.disabled = false;
    button.textContent = isFollowing ? "Following" : "Follow";
  }
});

loadProfile();

profileEditForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  profileEditStatus.textContent = "Saving profile...";
  const token = localStorage.getItem(sessionStorageKey) || "";
  if (!token) {
    profileEditStatus.textContent = "Log in before editing your profile.";
    return;
  }

  const data = Object.fromEntries(new FormData(profileEditForm).entries());
  try {
    const response = await fetch("/api/auth/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GCX-Session": token,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Profile could not be saved.");
    profileEditStatus.textContent = "Profile saved.";
    if (result.data?.profile?.id) localStorage.setItem(viewerStorageKey, result.data.profile.id);
    await loadProfile();
  } catch (error) {
    profileEditStatus.textContent = error.message;
  }
});
