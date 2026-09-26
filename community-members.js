const membersViewer = document.querySelector("#members-viewer");
const membersSearch = document.querySelector("#members-search");
const membersInterestFilter = document.querySelector("#members-interest-filter");
const membersGrid = document.querySelector("#members-grid");
const memberTotalCount = document.querySelector("#member-total-count");
const memberVisibleCount = document.querySelector("#member-visible-count");
const memberFriendCount = document.querySelector("#member-friend-count");
const viewerStorageKey = "gcx-community-viewer-v1";

let profiles = [];
let viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";
let activeQuery = "";
let activeInterest = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function profileUrl(profileId) {
  return `profile.html?id=${encodeURIComponent(profileId)}`;
}

function renderViewerSelect() {
  membersViewer.innerHTML = profiles
    .map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.id === viewerId ? "selected" : ""}>${escapeHtml(profile.displayName)}</option>`)
    .join("");
}

function interests() {
  return Array.from(new Set(profiles.flatMap((profile) => profile.interests || []))).sort((a, b) => a.localeCompare(b));
}

function renderInterestFilters() {
  const options = interests();
  membersInterestFilter.innerHTML = [
    `<button class="topic-button ${activeInterest ? "" : "is-active"}" type="button" data-interest="">All</button>`,
    ...options.map(
      (interest) => `
        <button class="topic-button ${activeInterest === interest ? "is-active" : ""}" type="button" data-interest="${escapeHtml(interest)}">
          <strong>${escapeHtml(interest)}</strong>
        </button>
      `
    ),
  ].join("");
}

function filteredProfiles() {
  return profiles.filter((profile) => {
    const haystack = normalize([profile.displayName, profile.handle, profile.bio, ...(profile.interests || []), ...(profile.groups || []).map((group) => group.name)].join(" "));
    const queryMatch = !activeQuery || haystack.includes(normalize(activeQuery));
    const interestMatch = !activeInterest || (profile.interests || []).includes(activeInterest);
    return queryMatch && interestMatch;
  });
}

function friendLabel(status) {
  return {
    friends: "Friends",
    sent: "Request sent",
    received: "Accept friend",
    none: "Add friend",
    self: "You",
  }[status || "none"] || "Add friend";
}

function renderMembers() {
  const visible = filteredProfiles();
  memberTotalCount.textContent = profiles.length.toLocaleString();
  memberVisibleCount.textContent = visible.length.toLocaleString();
  memberFriendCount.textContent = profiles.filter((profile) => profile.friendshipStatus === "friends").length.toLocaleString();
  renderViewerSelect();
  renderInterestFilters();

  if (!visible.length) {
    membersGrid.innerHTML = `<div class="index-message">No members match this search yet.</div>`;
    return;
  }

  membersGrid.innerHTML = visible
    .map((profile) => {
      const interestsMarkup = (profile.interests || []).slice(0, 4).map((interest) => `<span>${escapeHtml(interest)}</span>`).join("");
      const groupsMarkup = (profile.groups || []).slice(0, 3).map((group) => `<a class="feed-group-badge" href="community.html?group=${encodeURIComponent(group.id)}">${escapeHtml(group.name)}</a>`).join("");
      const isViewer = profile.id === viewerId;
      const canFriend = !isViewer && profile.friendshipStatus !== "sent" && profile.friendshipStatus !== "friends";
      return `
        <article class="member-directory-card">
          <a class="member-directory-avatar" href="${profileUrl(profile.id)}">
            <img src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(profile.displayName)} avatar" loading="lazy" />
          </a>
          <div>
            <div class="feed-card-head">
              <div>
                <h3><a href="${profileUrl(profile.id)}">${escapeHtml(profile.displayName)}</a></h3>
                <span>${escapeHtml(profile.handle)} - ${Number(profile.followers || 0).toLocaleString()} followers</span>
              </div>
              ${isViewer ? `<span class="viewer-pill">You</span>` : `<span class="feed-category">${escapeHtml(profile.friendshipStatus || "none")}</span>`}
            </div>
            <p>${escapeHtml(profile.bio)}</p>
            <div class="member-directory-stats">
              <span>${Number(profile.postCount || 0).toLocaleString()} posts</span>
              <span>${Number(profile.savedPostCount || 0).toLocaleString()} saves</span>
              <span>${Number(profile.following || 0).toLocaleString()} following</span>
            </div>
            <div class="feed-tags">${interestsMarkup}</div>
            <div class="group-meta">${groupsMarkup}</div>
            <div class="member-actions">
              <button class="text-button" type="button" data-follow-profile="${escapeHtml(profile.id)}" data-following="${profile.isFollowing ? "true" : "false"}" ${isViewer ? "disabled" : ""}>${isViewer ? "Your profile" : profile.isFollowing ? "Following" : "Follow"}</button>
              <button class="text-button" type="button" data-friend-profile="${escapeHtml(profile.id)}" data-friend-status="${escapeHtml(profile.friendshipStatus || "none")}" data-friendship-id="${escapeHtml(profile.friendshipId || "")}" ${canFriend ? "" : "disabled"}>${escapeHtml(friendLabel(isViewer ? "self" : profile.friendshipStatus))}</button>
              <a class="feed-link" href="community-inbox.html?to=${encodeURIComponent(profile.id)}">Message</a>
              <a class="feed-link" href="${profileUrl(profile.id)}">Profile</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadProfiles() {
  membersGrid.innerHTML = `<div class="index-message">Loading members...</div>`;
  const response = await fetch(`/api/community/profiles?viewerId=${encodeURIComponent(viewerId)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Members could not be loaded.");
  profiles = result.data || [];
  if (!profiles.some((profile) => profile.id === viewerId)) viewerId = profiles[0]?.id || viewerId;
  renderMembers();
}

membersViewer?.addEventListener("change", async () => {
  viewerId = membersViewer.value;
  localStorage.setItem(viewerStorageKey, viewerId);
  await loadProfiles();
});

membersSearch?.addEventListener("input", () => {
  activeQuery = membersSearch.value;
  renderMembers();
});

membersInterestFilter?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-interest]");
  if (!button) return;
  activeInterest = button.dataset.interest || "";
  renderMembers();
});

membersGrid?.addEventListener("click", async (event) => {
  const followButton = event.target.closest("[data-follow-profile]");
  const friendButton = event.target.closest("[data-friend-profile]");

  if (followButton && !followButton.disabled) {
    const followingId = followButton.dataset.followProfile;
    const isFollowing = followButton.dataset.following === "true";
    followButton.disabled = true;
    followButton.textContent = isFollowing ? "Unfollowing..." : "Following...";
    try {
      const response = await fetch(`/api/community/profiles/${isFollowing ? "unfollow" : "follow"}?viewerId=${encodeURIComponent(viewerId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: viewerId, followingId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Follow action failed.");
      await loadProfiles();
    } catch (error) {
      followButton.disabled = false;
      followButton.textContent = isFollowing ? "Following" : "Follow";
    }
    return;
  }

  if (friendButton && !friendButton.disabled) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Friend action failed.");
      await loadProfiles();
    } catch (error) {
      friendButton.disabled = false;
      friendButton.textContent = status === "received" ? "Accept friend" : "Add friend";
    }
  }
});

loadProfiles().catch((error) => {
  membersGrid.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
});
