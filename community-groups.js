const groupGrid = document.querySelector("#group-grid");
const groupSearch = document.querySelector("#group-search");
const groupCount = document.querySelector("#group-count");
const membershipCount = document.querySelector("#membership-count");
const viewerStorageKey = "gcx-community-viewer-v1";
const sessionStorageKey = "gcx-session-token-v1";

let groups = [];
let groupQuery = "";
let viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";

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

function authHeaders(extra = {}) {
  const token = localStorage.getItem(sessionStorageKey) || "";
  return {
    ...extra,
    ...(token ? { "X-GCX-Session": token } : {}),
  };
}

function renderGroups() {
  const visibleGroups = groups.filter((group) => {
    const haystack = normalize([group.name, group.category, group.description, ...(group.keywords || [])].join(" "));
    return !groupQuery || haystack.includes(groupQuery);
  });
  const joinedGroups = groups.filter((group) => group.isMember);

  groupCount.textContent = String(groups.length);
  membershipCount.textContent = String(joinedGroups.length);

  if (!visibleGroups.length) {
    groupGrid.innerHTML = `<div class="index-message">No matching groups yet.</div>`;
    return;
  }

  groupGrid.innerHTML = visibleGroups
    .map(
      (group) => `
        <article class="group-card">
          <a class="group-cover" href="${escapeHtml(group.feedUrl || `community.html?group=${group.id}`)}">
            <img src="${escapeHtml(group.coverUrl)}" alt="${escapeHtml(group.name)} group cover" loading="lazy" />
          </a>
          <div class="group-card-copy">
            <div class="console-card-topline">
              <span>${escapeHtml(group.category)}</span>
              <span>${Number(group.postCount || 0).toLocaleString()} posts</span>
            </div>
            <h2>${escapeHtml(group.name)}</h2>
            <p>${escapeHtml(group.description)}</p>
            <div class="feed-tags">${(group.keywords || []).slice(0, 5).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}</div>
            <div class="group-meta">
              <span>${Number(group.memberCount || 0).toLocaleString()} members</span>
              <span>${group.isMember ? "Joined" : "Open group"}</span>
            </div>
            <div class="streamer-actions">
              <button class="button" type="button" data-toggle-group="${escapeHtml(group.id)}" data-is-member="${group.isMember ? "true" : "false"}">
                ${group.isMember ? "Leave group" : "Join group"}
              </button>
              <a class="button secondary" href="${escapeHtml(group.feedUrl || `community.html?group=${group.id}`)}">Open group feed</a>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadGroups() {
  try {
    const response = await fetch(`/api/community/groups?viewerId=${encodeURIComponent(viewerId)}`);
    if (!response.ok) throw new Error(`Groups API returned ${response.status}`);
    const result = await response.json();
    groups = result.data || [];
    viewerId = result.viewerId || viewerId;
    localStorage.setItem(viewerStorageKey, viewerId);
    renderGroups();
  } catch (error) {
    groupGrid.innerHTML = `<div class="index-message">Groups could not be loaded. Make sure the local server is running.</div>`;
  }
}

groupGrid?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-toggle-group]");
  if (!button) return;

  const groupId = button.dataset.toggleGroup;
  const isMember = button.dataset.isMember === "true";
  button.disabled = true;
  button.textContent = isMember ? "Leaving..." : "Joining...";

  try {
    const response = await fetch(`/api/community/groups/${isMember ? "leave" : "join"}?viewerId=${encodeURIComponent(viewerId)}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ groupId, profileId: viewerId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Group membership could not be updated.");
    await loadGroups();
  } catch (error) {
    button.disabled = false;
    button.textContent = isMember ? "Leave group" : "Join group";
  }
});

groupSearch?.addEventListener("input", () => {
  groupQuery = normalize(groupSearch.value);
  renderGroups();
});

loadGroups();
