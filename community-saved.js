const savedViewer = document.querySelector("#saved-viewer");
const savedList = document.querySelector("#saved-post-list");
const savedTotalCount = document.querySelector("#saved-total-count");
const savedCategoryCount = document.querySelector("#saved-category-count");
const savedProfileLabel = document.querySelector("#saved-profile-label");
const viewerStorageKey = "gcx-community-viewer-v1";
const sessionStorageKey = "gcx-session-token-v1";

let profiles = [];
let savedPosts = [];
let viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";

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

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved recently";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function renderLinkPreview(preview) {
  if (!preview?.url) return "";
  const image = preview.imageUrl ? `<img src="${escapeHtml(preview.imageUrl)}" alt="${escapeHtml(preview.title)} preview" loading="lazy" />` : "";
  return `
    <a class="link-preview-card compact" href="${escapeHtml(preview.url)}" target="${preview.url.startsWith("http") ? "_blank" : "_self"}" rel="noreferrer">
      ${image}
      <span>${escapeHtml(preview.sourceLabel || "Shared link")}</span>
      <strong>${escapeHtml(preview.title || "Shared link")}</strong>
      <p>${escapeHtml(preview.description || preview.url)}</p>
    </a>
  `;
}

function renderViewerSelect() {
  savedViewer.innerHTML = profiles
    .map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.id === viewerId ? "selected" : ""}>${escapeHtml(profile.displayName)}</option>`)
    .join("");
}

function renderSavedPosts(profile = {}) {
  const categories = new Set(savedPosts.map((item) => item.post?.category || "Community"));
  savedTotalCount.textContent = savedPosts.length.toLocaleString();
  savedCategoryCount.textContent = categories.size.toLocaleString();
  savedProfileLabel.textContent = profile.displayName || "GCX";

  if (!savedPosts.length) {
    savedList.innerHTML = `<div class="index-message">No saved posts yet. Open the feed and save a post to build this list.</div>`;
    return;
  }

  savedList.innerHTML = savedPosts
    .map((item) => {
      const post = item.post || {};
      const author = post.authorProfile || {};
      const image = post.imageUrl ? `<a href="${escapeHtml(post.imageUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" /></a>` : "";
      const reactions = post.reactions || {};
      const reactionTotal = Object.values(reactions).reduce((sum, count) => sum + Number(count || 0), 0);
      return `
        <article class="saved-post-card">
          ${image}
          <div>
            <div class="feed-card-head">
              <div class="feed-avatar">${author.avatarUrl ? `<img src="${escapeHtml(author.avatarUrl)}" alt="${escapeHtml(author.displayName)} avatar" loading="lazy" />` : `<span>${escapeHtml((post.author || "?").slice(0, 1))}</span>`}</div>
              <div>
                <strong>${escapeHtml(post.author || author.displayName || "GCX Member")}</strong>
                <span>Saved ${escapeHtml(formatDate(item.createdAt))}</span>
              </div>
              <span class="feed-category">${escapeHtml(post.category || "Community")}</span>
            </div>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.body)}</p>
            ${renderLinkPreview(post.linkPreview)}
            <div class="feed-actions">
              <a class="button secondary" href="community-post.html?id=${encodeURIComponent(post.id)}">Open post</a>
              ${post.linkUrl ? `<a class="feed-link" href="${escapeHtml(post.linkUrl)}" target="${post.linkUrl.startsWith("http") ? "_blank" : "_self"}" rel="noreferrer">Shared link</a>` : ""}
              <span>${reactionTotal.toLocaleString()} reactions</span>
              <span>${Number(post.savedCount || 0).toLocaleString()} saves</span>
              <button class="text-button muted" type="button" data-unsave-post="${escapeHtml(post.id)}">Remove</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadProfiles() {
  const response = await fetch(`/api/community/profiles?viewerId=${encodeURIComponent(viewerId)}`);
  if (!response.ok) throw new Error(`Profiles returned ${response.status}`);
  const result = await response.json();
  profiles = result.data || [];
  if (!profiles.some((profile) => profile.id === viewerId)) viewerId = profiles[0]?.id || viewerId;
  renderViewerSelect();
}

async function loadSavedPosts() {
  savedList.innerHTML = `<div class="index-message">Loading saved posts...</div>`;
  const response = await fetch(`/api/community/saved-posts?profileId=${encodeURIComponent(viewerId)}&viewerId=${encodeURIComponent(viewerId)}`, { headers: authHeaders() });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Saved posts returned ${response.status}`);
  savedPosts = result.data || [];
  renderSavedPosts(result.profile || {});
}

savedViewer?.addEventListener("change", async () => {
  viewerId = savedViewer.value;
  localStorage.setItem(viewerStorageKey, viewerId);
  await loadSavedPosts();
});

savedList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-unsave-post]");
  if (!button) return;
  button.disabled = true;
  try {
    const response = await fetch(`/api/community/feed/unsave?viewerId=${encodeURIComponent(viewerId)}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ postId: button.dataset.unsavePost, profileId: viewerId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Saved post could not be removed.");
    savedPosts = savedPosts.filter((item) => item.postId !== button.dataset.unsavePost);
    renderSavedPosts(profiles.find((profile) => profile.id === viewerId) || {});
  } catch (error) {
    button.disabled = false;
  }
});

async function init() {
  try {
    await loadProfiles();
    await loadSavedPosts();
  } catch (error) {
    savedList.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
  }
}

init();
