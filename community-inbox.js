const inboxViewer = document.querySelector("#inbox-viewer");
const inboxThreadList = document.querySelector("#inbox-thread-list");
const inboxMessages = document.querySelector("#inbox-messages");
const inboxThreadHeading = document.querySelector("#inbox-thread-heading");
const inboxForm = document.querySelector("#inbox-form");
const inboxRecipient = document.querySelector("#inbox-recipient");
const inboxStatus = document.querySelector("#inbox-status");
const inboxThreadCount = document.querySelector("#inbox-thread-count");
const inboxUnreadCount = document.querySelector("#inbox-unread-count");
const viewerStorageKey = "gcx-community-viewer-v1";
const sessionStorageKey = "gcx-session-token-v1";

let viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";
let profiles = [];
let threads = [];
const initialParams = new URLSearchParams(window.location.search);
let activeThreadId = initialParams.get("thread") || "";
let initialRecipientId = initialParams.get("to") || "";

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

function profileName(id) {
  return profiles.find((profile) => profile.id === id)?.displayName || "GCX Member";
}

function renderProfilePickers() {
  const options = profiles
    .map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.id === viewerId ? "selected" : ""}>${escapeHtml(profile.displayName)} (${escapeHtml(profile.handle)})</option>`)
    .join("");
  inboxViewer.innerHTML = options;
  inboxRecipient.innerHTML = profiles
    .filter((profile) => profile.id !== viewerId)
    .map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.id === initialRecipientId ? "selected" : ""}>${escapeHtml(profile.displayName)} (${escapeHtml(profile.handle)})</option>`)
    .join("");
}

function renderThreads() {
  inboxThreadCount.textContent = String(threads.length);
  inboxUnreadCount.textContent = String(threads.reduce((sum, thread) => sum + Number(thread.unreadCount || 0), 0));

  if (!threads.length) {
    inboxThreadList.innerHTML = `<div class="index-message">No messages yet.</div>`;
    return;
  }

  inboxThreadList.innerHTML = threads
    .map((thread) => {
      const other = thread.otherParticipants?.[0] || {};
      const latest = thread.latestMessage;
      return `
        <button class="inbox-thread ${activeThreadId === thread.id ? "is-active" : ""}" type="button" data-thread-id="${escapeHtml(thread.id)}">
          <strong>${escapeHtml(other.displayName || "GCX member")}</strong>
          <span>${latest ? escapeHtml(latest.body) : "No messages yet"}</span>
          <small>${thread.unreadCount ? `${thread.unreadCount} unread` : latest ? formatDate(latest.createdAt) : "Open"}</small>
        </button>
      `;
    })
    .join("");
}

function renderMessages(thread, messages) {
  const otherNames = (thread.otherParticipants || []).map((profile) => profile.displayName).join(", ") || "Conversation";
  inboxThreadHeading.innerHTML = `
    <p class="kicker">Messages</p>
    <h2>${escapeHtml(otherNames)}</h2>
  `;
  inboxMessages.innerHTML = messages.length
    ? messages
        .map(
          (message) => `
            <article class="message-bubble ${message.senderId === viewerId ? "is-mine" : ""}">
              <strong>${escapeHtml(profileName(message.senderId))}</strong>
              <p>${escapeHtml(message.body)}</p>
              <span>${escapeHtml(formatDate(message.createdAt))}</span>
            </article>
          `
        )
        .join("")
    : `<div class="index-message">No messages in this thread yet.</div>`;
  if (thread.otherParticipants?.[0]) inboxRecipient.value = thread.otherParticipants[0].id;
}

async function loadProfiles() {
  const response = await fetch(`/api/community/profiles?viewerId=${encodeURIComponent(viewerId)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Profiles could not be loaded.");
  profiles = result.data || [];
  viewerId = result.viewerId || viewerId;
  localStorage.setItem(viewerStorageKey, viewerId);
  renderProfilePickers();
}

async function loadThreads() {
  const response = await fetch(`/api/community/messages?viewerId=${encodeURIComponent(viewerId)}`, { headers: authHeaders() });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Inbox could not be loaded.");
  threads = result.data || [];
  if (!activeThreadId && threads[0]) activeThreadId = threads[0].id;
  renderThreads();
  if (activeThreadId) await loadThread(activeThreadId);
}

async function loadThread(threadId) {
  const response = await fetch(`/api/community/messages/${encodeURIComponent(threadId)}?viewerId=${encodeURIComponent(viewerId)}`, { headers: authHeaders() });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Thread could not be loaded.");
  activeThreadId = threadId;
  renderThreads();
  renderMessages(result.data, result.messages || []);
  await fetch(`/api/community/messages/read?viewerId=${encodeURIComponent(viewerId)}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ threadId }),
  }).catch(() => {});
}

async function loadInbox() {
  try {
    await loadProfiles();
    await loadThreads();
  } catch (error) {
    inboxThreadList.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
  }
}

inboxViewer?.addEventListener("change", async () => {
  viewerId = inboxViewer.value;
  activeThreadId = "";
  localStorage.setItem(viewerStorageKey, viewerId);
  await loadInbox();
});

inboxThreadList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-thread-id]");
  if (!button) return;
  await loadThread(button.dataset.threadId);
});

inboxForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  inboxStatus.textContent = "Sending...";
  const formData = new FormData(inboxForm);

  try {
    const response = await fetch(`/api/community/messages?viewerId=${encodeURIComponent(viewerId)}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        senderId: viewerId,
        recipientId: formData.get("recipientId"),
        body: formData.get("body"),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Message could not be sent.");
    activeThreadId = result.thread.id;
    inboxForm.reset();
    inboxStatus.textContent = "Message sent.";
    await loadThreads();
  } catch (error) {
    inboxStatus.textContent = error.message;
  }
});

loadInbox();
