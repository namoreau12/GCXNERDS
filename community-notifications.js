const viewerSelect = document.querySelector("#notification-viewer");
const list = document.querySelector("#notification-center-list");
const totalCount = document.querySelector("#notification-total-count");
const unreadCount = document.querySelector("#notification-unread-count");
const typeCount = document.querySelector("#notification-type-count");
const markAllReadButton = document.querySelector("#notification-mark-all-read");
const statusMessage = document.querySelector("#notification-status");
const filterButtons = Array.from(document.querySelectorAll("[data-notification-filter]"));
const viewerStorageKey = "gcx-community-viewer-v1";
const sessionStorageKey = "gcx-session-token-v1";

let profiles = [];
let notifications = [];
let viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";
let activeFilter = "all";

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
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function notificationGroup(type) {
  if (["friend_request", "friend_accept", "comment", "message", "follow"].includes(type)) return "social";
  if (["event_rsvp", "event", "streamer"].includes(type)) return "events";
  return "community";
}

function typeLabel(type) {
  return String(type || "community").replaceAll("_", " ");
}

function renderViewerSelect() {
  if (!viewerSelect) return;
  viewerSelect.innerHTML = profiles
    .map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.id === viewerId ? "selected" : ""}>${escapeHtml(profile.displayName)}</option>`)
    .join("");
}

function visibleNotifications() {
  return notifications.filter((notification) => {
    if (activeFilter === "unread") return !notification.read;
    if (activeFilter === "social") return notificationGroup(notification.type) === "social";
    if (activeFilter === "events") return notificationGroup(notification.type) === "events";
    return true;
  });
}

function renderStats() {
  const unread = notifications.filter((notification) => !notification.read).length;
  const types = new Set(notifications.map((notification) => notification.type || "community"));
  totalCount.textContent = notifications.length.toLocaleString();
  unreadCount.textContent = unread.toLocaleString();
  typeCount.textContent = types.size.toLocaleString();
  markAllReadButton.disabled = unread === 0;
  window.dispatchEvent(new CustomEvent("gcx:notifications-updated", { detail: { unreadCount: unread } }));
}

function renderNotifications() {
  renderStats();
  const visible = visibleNotifications();
  filterButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.notificationFilter === activeFilter));

  if (!visible.length) {
    list.innerHTML = `<div class="index-message">No notifications match this view.</div>`;
    return;
  }

  list.innerHTML = visible
    .map(
      (notification) => `
        <article class="notification-detail-card ${notification.read ? "" : "is-unread"}">
          <div>
            <span class="feed-category">${escapeHtml(typeLabel(notification.type))}</span>
            <span>${escapeHtml(formatDate(notification.createdAt))}</span>
          </div>
          <h3>${escapeHtml(notification.title)}</h3>
          <p>${escapeHtml(notification.body)}</p>
          <div class="feed-actions">
            ${notification.url ? `<a class="button secondary" href="${escapeHtml(notification.url)}" data-open-notification="${escapeHtml(notification.id)}">Open</a>` : ""}
            ${
              notification.read
                ? `<span>Read</span>`
                : `<button class="text-button" type="button" data-read-notification="${escapeHtml(notification.id)}">Mark read</button>`
            }
            <button class="text-button muted" type="button" data-dismiss-notification="${escapeHtml(notification.id)}">Dismiss</button>
          </div>
        </article>
      `
    )
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

async function loadNotifications() {
  list.innerHTML = `<div class="index-message">Loading notifications...</div>`;
  const response = await fetch(`/api/community/notifications?viewerId=${encodeURIComponent(viewerId)}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Notifications returned ${response.status}`);
  const result = await response.json();
  notifications = result.data || [];
  renderNotifications();
}

async function markNotificationRead(notificationId = "") {
  const response = await fetch(`/api/community/notifications/read?viewerId=${encodeURIComponent(viewerId)}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ notificationId }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Notification could not be marked read.");
  notifications = result.data || notifications.map((notification) => ({ ...notification, read: notificationId ? notification.read || notification.id === notificationId : true }));
  renderNotifications();
}

async function dismissNotification(notificationId) {
  const response = await fetch(`/api/community/notifications/dismiss?viewerId=${encodeURIComponent(viewerId)}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ notificationId }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Notification could not be dismissed.");
  notifications = notifications.filter((notification) => notification.id !== notificationId);
  renderNotifications();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.notificationFilter || "all";
    renderNotifications();
  });
});

viewerSelect?.addEventListener("change", async () => {
  viewerId = viewerSelect.value;
  localStorage.setItem(viewerStorageKey, viewerId);
  await loadNotifications();
});

markAllReadButton?.addEventListener("click", async () => {
  markAllReadButton.disabled = true;
  statusMessage.textContent = "Saving...";
  try {
    await markNotificationRead();
    statusMessage.textContent = "Notifications marked read.";
  } catch (error) {
    statusMessage.textContent = error.message;
  }
});

list?.addEventListener("click", async (event) => {
  const readButton = event.target.closest("[data-read-notification]");
  const dismissButton = event.target.closest("[data-dismiss-notification]");
  const openLink = event.target.closest("[data-open-notification]");

  try {
    if (readButton) {
      readButton.disabled = true;
      await markNotificationRead(readButton.dataset.readNotification);
    }
    if (dismissButton) {
      dismissButton.disabled = true;
      await dismissNotification(dismissButton.dataset.dismissNotification);
    }
    if (openLink) {
      await markNotificationRead(openLink.dataset.openNotification);
    }
  } catch (error) {
    statusMessage.textContent = error.message;
  }
});

async function init() {
  try {
    await loadProfiles();
    await loadNotifications();
  } catch (error) {
    list.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
  }
}

init();
