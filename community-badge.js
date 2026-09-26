const notificationBadges = Array.from(document.querySelectorAll("[data-notification-badge]"));
const badgeViewerStorageKey = "gcx-community-viewer-v1";

function updateNotificationBadges(count) {
  notificationBadges.forEach((badge) => {
    if (!count) {
      badge.hidden = true;
      badge.textContent = "0";
      return;
    }
    badge.hidden = false;
    badge.textContent = count > 99 ? "99+" : String(count);
  });
}

async function loadNotificationBadge() {
  if (!notificationBadges.length) return;
  const viewerId = localStorage.getItem(badgeViewerStorageKey) || "profile-gcx-member";
  try {
    const response = await fetch(`/api/community/notifications?viewerId=${encodeURIComponent(viewerId)}`);
    if (!response.ok) throw new Error("Badge unavailable");
    const result = await response.json();
    updateNotificationBadges(Number(result.unreadCount || 0));
  } catch (error) {
    updateNotificationBadges(0);
  }
}

window.addEventListener("gcx:notifications-updated", (event) => {
  updateNotificationBadges(Number(event.detail?.unreadCount || 0));
});

loadNotificationBadge();
