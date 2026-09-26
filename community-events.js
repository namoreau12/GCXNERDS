const eventViewer = document.querySelector("#event-viewer");
const eventGroup = document.querySelector("#event-group");
const eventForm = document.querySelector("#event-form");
const eventStatus = document.querySelector("#event-status");
const eventList = document.querySelector("#event-list");
const eventCount = document.querySelector("#event-count");
const eventRsvpCount = document.querySelector("#event-rsvp-count");
const viewerStorageKey = "gcx-community-viewer-v1";
const sessionStorageKey = "gcx-session-token-v1";

let viewerId = localStorage.getItem(viewerStorageKey) || "profile-gcx-member";
let profiles = [];
let groups = [];
let events = [];

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
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function renderPickers() {
  eventViewer.innerHTML = profiles
    .map((profile) => `<option value="${escapeHtml(profile.id)}" ${profile.id === viewerId ? "selected" : ""}>${escapeHtml(profile.displayName)} (${escapeHtml(profile.handle)})</option>`)
    .join("");
  eventGroup.innerHTML = [`<option value="">Main community</option>`]
    .concat(groups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`))
    .join("");
}

function renderEvents() {
  eventCount.textContent = String(events.length);
  eventRsvpCount.textContent = String(events.reduce((sum, event) => sum + Number(event.rsvpCount || 0), 0));

  if (!events.length) {
    eventList.innerHTML = `<div class="index-message">No upcoming events yet.</div>`;
    return;
  }

  eventList.innerHTML = events
    .map(
      (event) => `
        <article class="event-card">
          ${event.imageUrl ? `<a href="${escapeHtml(event.linkUrl || "community-events.html")}"><img src="${escapeHtml(event.imageUrl)}" alt="${escapeHtml(event.title)}" loading="lazy" /></a>` : ""}
          <div class="event-card-copy">
            <div class="console-card-topline">
              <span>${escapeHtml(event.type)}</span>
              <span>${escapeHtml(formatDate(event.startsAt))}</span>
            </div>
            <h2>${escapeHtml(event.title)}</h2>
            <p>${escapeHtml(event.description)}</p>
            <div class="group-meta">
              <span>${escapeHtml(event.group?.name || "Main community")}</span>
              <span>${Number(event.rsvpCount || 0).toLocaleString()} RSVPs</span>
              ${event.viewerRsvp ? `<span>${escapeHtml(event.viewerRsvp)}</span>` : ""}
            </div>
            <div class="streamer-actions">
              <button class="button" type="button" data-rsvp-event="${escapeHtml(event.id)}" data-rsvp-status="going">${event.viewerRsvp === "going" ? "Going" : "RSVP going"}</button>
              <button class="button secondary" type="button" data-rsvp-event="${escapeHtml(event.id)}" data-rsvp-status="interested">${event.viewerRsvp === "interested" ? "Interested" : "Interested"}</button>
              ${event.linkUrl ? `<a class="button secondary" href="${escapeHtml(event.linkUrl)}">Open link</a>` : ""}
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadProfilesAndGroups() {
  const [profileResponse, groupResponse] = await Promise.all([
    fetch(`/api/community/profiles?viewerId=${encodeURIComponent(viewerId)}`),
    fetch(`/api/community/groups?viewerId=${encodeURIComponent(viewerId)}`),
  ]);
  const profileResult = await profileResponse.json();
  const groupResult = await groupResponse.json();
  if (!profileResponse.ok) throw new Error(profileResult.error || "Profiles could not be loaded.");
  if (!groupResponse.ok) throw new Error(groupResult.error || "Groups could not be loaded.");
  profiles = profileResult.data || [];
  groups = groupResult.data || [];
  viewerId = profileResult.viewerId || viewerId;
  localStorage.setItem(viewerStorageKey, viewerId);
  renderPickers();
}

async function loadEvents() {
  const response = await fetch(`/api/community/events?viewerId=${encodeURIComponent(viewerId)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Events could not be loaded.");
  events = result.data || [];
  renderEvents();
}

async function loadPage() {
  try {
    await loadProfilesAndGroups();
    await loadEvents();
  } catch (error) {
    eventList.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
  }
}

eventViewer?.addEventListener("change", async () => {
  viewerId = eventViewer.value;
  localStorage.setItem(viewerStorageKey, viewerId);
  await loadEvents();
});

eventList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-rsvp-event]");
  if (!button) return;
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const response = await fetch(`/api/community/events/rsvp?viewerId=${encodeURIComponent(viewerId)}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        eventId: button.dataset.rsvpEvent,
        profileId: viewerId,
        status: button.dataset.rsvpStatus,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "RSVP could not be saved.");
    await loadEvents();
  } catch (error) {
    button.disabled = false;
    button.textContent = "Try again";
  }
});

eventForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  eventStatus.textContent = "Creating...";
  const formData = new FormData(eventForm);
  const startsAt = new Date(formData.get("startsAt")).toISOString();

  try {
    const response = await fetch(`/api/community/events?viewerId=${encodeURIComponent(viewerId)}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        title: formData.get("title"),
        type: formData.get("type"),
        groupId: formData.get("groupId"),
        startsAt,
        description: formData.get("description"),
        linkUrl: formData.get("linkUrl"),
        hostProfileId: viewerId,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Event could not be created.");
    eventForm.reset();
    eventStatus.textContent = "Event created.";
    await loadEvents();
  } catch (error) {
    eventStatus.textContent = error.message;
  }
});

loadPage();
