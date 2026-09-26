const activityList = document.querySelector("#activity-list");
const totalCount = document.querySelector("#activity-total-count");
const visibleCount = document.querySelector("#activity-visible-count");
const typeCount = document.querySelector("#activity-type-count");
const filterButtons = Array.from(document.querySelectorAll("[data-activity-filter]"));

let activity = [];
let activeFilter = "all";

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

function activityGroup(type) {
  if (["follow", "friend_request", "friend_accept", "group_join"].includes(type)) return "social";
  return type || "community";
}

function typeLabel(type) {
  return String(type || "community").replaceAll("_", " ");
}

function visibleActivity() {
  return activity.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "social") return activityGroup(item.type) === "social";
    return item.type === activeFilter;
  });
}

function activityUrl(item) {
  if (item.targetType === "post" && item.targetId) return `community-post.html?id=${encodeURIComponent(item.targetId)}`;
  return item.url || "community.html";
}

function actorInitial(item) {
  const name = item.profile?.displayName || item.actorName || item.title || "G";
  return name.slice(0, 1).toUpperCase();
}

function renderActivity() {
  const visible = visibleActivity();
  const types = new Set(activity.map((item) => item.type || "community"));
  totalCount.textContent = activity.length.toLocaleString();
  visibleCount.textContent = visible.length.toLocaleString();
  typeCount.textContent = types.size.toLocaleString();
  filterButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.activityFilter === activeFilter));

  if (!visible.length) {
    activityList.innerHTML = `<div class="index-message">No activity matches this view yet.</div>`;
    return;
  }

  activityList.innerHTML = visible
    .map((item) => {
      const avatar = item.profile?.avatarUrl
        ? `<img src="${escapeHtml(item.profile.avatarUrl)}" alt="${escapeHtml(item.profile.displayName)} avatar" loading="lazy" />`
        : `<span>${escapeHtml(actorInitial(item))}</span>`;
      const url = activityUrl(item);
      const image = item.imageUrl ? `<a href="${escapeHtml(url)}"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" /></a>` : "";
      const actor = item.profile
        ? `<a href="profile.html?id=${encodeURIComponent(item.profile.id)}">${escapeHtml(item.profile.displayName)}</a>`
        : escapeHtml(item.actorName || "GCX activity");

      return `
        <article class="activity-card">
          <div class="activity-card-head">
            <div class="feed-avatar">${avatar}</div>
            <div>
              <strong>${actor}</strong>
              <span>${escapeHtml(formatDate(item.createdAt))}</span>
            </div>
            <span class="feed-category">${escapeHtml(typeLabel(item.type))}</span>
          </div>
          ${image}
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.body)}</p>
          <div class="feed-actions">
            <a class="button secondary" href="${escapeHtml(url)}">Open</a>
            <span>${escapeHtml(item.targetType || "community")}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadActivity() {
  activityList.innerHTML = `<div class="index-message">Loading community activity...</div>`;
  const response = await fetch("/api/community/activity?limit=80");
  if (!response.ok) throw new Error(`Activity returned ${response.status}`);
  const result = await response.json();
  activity = result.data || [];
  renderActivity();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.activityFilter || "all";
    renderActivity();
  });
});

loadActivity().catch((error) => {
  activityList.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
});
