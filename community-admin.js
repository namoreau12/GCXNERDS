const postQueue = document.querySelector("#moderation-posts");
const commentQueue = document.querySelector("#moderation-comments");
const nominationQueue = document.querySelector("#moderation-nominations");
const sponsorLeadQueue = document.querySelector("#moderation-sponsor-leads");
const moderationSummary = document.querySelector("#moderation-summary");
const streamerCloseoutSummary = document.querySelector("#streamer-closeout-summary");
const streamerCloseoutForm = document.querySelector("#streamer-closeout-form");
const streamerCloseoutStatus = document.querySelector("#streamer-closeout-status");
const creatorSpotlightForm = document.querySelector("#creator-spotlight-form");
const creatorSpotlightEditor = document.querySelector("#creator-spotlight-editor");
const creatorSpotlightStatus = document.querySelector("#creator-spotlight-status");
const socialEditorialTools = document.querySelector("#social-editorial-tools");
const streamingEditorialTools = document.querySelector("#streaming-editorial-tools");
const socialIntakeForm = document.querySelector("#social-intake-form");
const socialIntakeStatus = document.querySelector("#social-intake-status");
const streamingIntakeForm = document.querySelector("#streaming-intake-form");
const streamingIntakeStatus = document.querySelector("#streaming-intake-status");
const sessionStorageKey = "gcx-session-token-v1";
let moderationAccess = false;

function authHeaders() {
  const token = localStorage.getItem(sessionStorageKey);
  return token ? { "X-GCX-Session": token } : {};
}

function hasSessionToken() {
  return Boolean(localStorage.getItem(sessionStorageKey));
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
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function formatStatus(value) {
  return String(value || "new")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toDatetimeLocalValue(value) {
  if (!value) return "";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";
  const date = new Date(time);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function datetimeLocalToIso(value) {
  if (!value) return "";
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function formatCount(value) {
  return Number(value || 0).toLocaleString();
}

function emptyMessage(kind) {
  return `<div class="index-message">No ${kind} need review right now.</div>`;
}

function setCloseoutFormEnabled(enabled) {
  if (!streamerCloseoutForm) return;
  streamerCloseoutForm.querySelectorAll("input, textarea, button").forEach((control) => {
    control.disabled = !enabled;
  });
}

function setCreatorSpotlightFormEnabled(enabled) {
  if (!creatorSpotlightForm) return;
  creatorSpotlightForm.querySelectorAll("input, textarea, select, button").forEach((control) => {
    control.disabled = !enabled;
  });
}

function setIntakeFormsEnabled(enabled) {
  [socialIntakeForm, streamingIntakeForm].forEach((form) => {
    form?.querySelectorAll("input, textarea, select, button").forEach((control) => {
      control.disabled = !enabled;
    });
  });
}

function adminAccessMessage(status) {
  if (status === 401) {
    return `
      <div class="index-message">
        <strong>Staff sign-in required.</strong>
        <p>Log in with a moderator or admin account to view moderation queues.</p>
        <a class="button secondary" href="auth.html?next=community-admin.html">Sign in</a>
      </div>
    `;
  }
  if (status === 403) {
    return `
      <div class="index-message">
        <strong>Moderator access required.</strong>
        <p>This account is signed in, but it is not on the GCX moderation allowlist.</p>
      </div>
    `;
  }
  return `<div class="index-message">Moderation queue could not be loaded.</div>`;
}

function renderAccessMessage(status) {
  moderationAccess = false;
  [postQueue, commentQueue, nominationQueue, sponsorLeadQueue, creatorSpotlightEditor, socialEditorialTools, streamingEditorialTools].forEach((target) => {
    if (target) target.innerHTML = adminAccessMessage(status);
  });
  if (streamerCloseoutSummary) streamerCloseoutSummary.innerHTML = adminAccessMessage(status);
  setCloseoutFormEnabled(false);
  setCreatorSpotlightFormEnabled(false);
  setIntakeFormsEnabled(false);
  if (moderationSummary) {
    moderationSummary.innerHTML = `
      <article>
        <span>Access</span>
        <strong>${status === 403 ? "Restricted" : "Sign In"}</strong>
        <p>${status === 403 ? "This account is not approved for moderation tools." : "Staff sign-in required to view queue health."}</p>
      </article>
    `;
  }
}

function editorialStatusPill(item) {
  const isScheduled = item.scheduledAt && new Date(item.scheduledAt).getTime() > Date.now();
  const bits = [
    item.status || item.editorialStatus || "published",
    isScheduled ? `scheduled ${formatDate(item.scheduledAt)}` : "",
    item.pipelineStage && item.pipelineStage !== "publication" ? item.pipelineStage : "",
    item.pipelineSource ? `source: ${item.pipelineSource}` : "",
    item.featured ? "featured" : "",
    item.hidden ? "hidden" : "",
    item.markedStale ? "stale" : "",
  ].filter(Boolean);
  return bits.map((bit) => `<span class="feed-source-pill">${escapeHtml(formatStatus(bit))}</span>`).join("");
}

function renderSocialEditorialTools(posts = []) {
  if (!socialEditorialTools) return;
  if (!posts.length) {
    socialEditorialTools.innerHTML = emptyMessage("Social editorial items");
    return;
  }
  socialEditorialTools.innerHTML = posts
    .slice(0, 20)
    .map((post) => {
      const source = [post.postType, post.sourceName].filter(Boolean).join(" - ");
      const reviewedBits = [
        post.lastViewedAt ? `Last GCX view ${formatDate(post.lastViewedAt)}` : "",
        post.lastVideoEmbedLoadedAt ? `Last video load ${formatDate(post.lastVideoEmbedLoadedAt)}` : "",
      ].filter(Boolean);
      return `
        <article class="moderation-card">
          <div>
            <strong>${escapeHtml(post.title || "Untitled Social post")}</strong>
            <span>${escapeHtml(source || post.category || "GCX Social")} - ${escapeHtml(formatDate(post.createdAt))}</span>
          </div>
          <p>${escapeHtml(post.body || "")}</p>
          <div class="feed-source-row">${editorialStatusPill(post)}</div>
          <div class="moderation-metric-row" aria-label="Social post performance">
            <span>${formatCount(post.viewCount)} GCX views</span>
            <span>${formatCount(post.videoEmbedLoadCount)} video loads</span>
            <span>${formatCount(post.comments)} comments</span>
          </div>
          ${reviewedBits.length ? `<p class="moderation-context-note">${escapeHtml(reviewedBits.join(" - "))}</p>` : ""}
          ${post.linkUrl ? `<a class="feed-link" href="${escapeHtml(post.linkUrl)}" target="${post.linkUrl.startsWith("http") ? "_blank" : "_self"}" rel="noreferrer">Open post target</a>` : ""}
          <div class="moderation-edit-grid">
            <label class="moderation-note-label">
              Headline
              <input type="text" data-edit-title value="${escapeHtml(post.title || "")}" maxlength="140" />
            </label>
            <label class="moderation-note-label">
              Category
              <input type="text" data-edit-category value="${escapeHtml(post.category || "Community")}" maxlength="40" />
            </label>
            <label class="moderation-note-label moderation-note-label-wide">
              GCX commentary
              <textarea data-edit-body maxlength="900">${escapeHtml(post.body || "")}</textarea>
            </label>
            <label class="moderation-note-label">
              Schedule / hold until
              <input type="datetime-local" data-edit-scheduled value="${escapeHtml(toDatetimeLocalValue(post.scheduledAt || ""))}" />
            </label>
            <label class="moderation-note-label">
              Priority
              <input type="number" data-edit-priority value="${Number(post.editorialPriority || 0)}" min="0" max="100" />
            </label>
          </div>
          <div class="streamer-actions">
            <button class="button secondary" type="button" data-social-editorial="${escapeHtml(post.id)}" data-save-details="true">Save details</button>
            <button class="button secondary" type="button" data-social-editorial="${escapeHtml(post.id)}" data-status="published">Publish</button>
            <button class="button secondary" type="button" data-social-editorial="${escapeHtml(post.id)}" data-status="hidden">Hide</button>
            <button class="button secondary danger" type="button" data-social-editorial="${escapeHtml(post.id)}" data-status="deleted">Delete</button>
            <button class="button secondary" type="button" data-social-editorial="${escapeHtml(post.id)}" data-stale="${post.markedStale ? "false" : "true"}">${post.markedStale ? "Clear stale" : "Mark stale"}</button>
            <button class="button secondary" type="button" data-social-editorial="${escapeHtml(post.id)}" data-pinned="${post.editorialPinned ? "false" : "true"}">${post.editorialPinned ? "Unpin" : "Pin candidate"}</button>
          </div>
          <label class="moderation-note-label">
            Editorial note
            <input type="text" data-editorial-note placeholder="Optional Social note" maxlength="240" />
          </label>
        </article>
      `;
    })
    .join("");
}

function renderStreamingEditorialTools(items = []) {
  if (!streamingEditorialTools) return;
  if (!items.length) {
    streamingEditorialTools.innerHTML = emptyMessage("Streaming Spotlight items");
    return;
  }
  streamingEditorialTools.innerHTML = items
    .map((item) => {
      const platformViewerCount = item.viewer_count !== null && item.viewer_count !== undefined
        ? `<span>${formatCount(item.viewer_count)} verified platform viewers</span>`
        : "";
      const reviewedBits = [
        item.lastViewedAt ? `Last GCX view ${formatDate(item.lastViewedAt)}` : "",
        item.lastWatchClickedAt ? `Last watch click ${formatDate(item.lastWatchClickedAt)}` : "",
      ].filter(Boolean);
      return `
        <article class="moderation-card">
          <div>
            <strong>${escapeHtml(item.title || "Untitled stream")}</strong>
            <span>${escapeHtml([item.creator, item.platform, item.category].filter(Boolean).join(" - ") || "Streaming Spotlight")}</span>
          </div>
          <p>${escapeHtml([item.game, item.source].filter(Boolean).join(" - ") || "GCX streaming pick")}</p>
          <div class="feed-source-row">${editorialStatusPill(item)}</div>
          <div class="moderation-metric-row" aria-label="Streaming Spotlight performance">
            <span>${formatCount(item.viewCount)} GCX views</span>
            <span>${formatCount(item.watchClickCount)} watch clicks</span>
            <span>${formatCount(item.embedLoadCount)} embed loads</span>
            ${platformViewerCount}
          </div>
          ${reviewedBits.length ? `<p class="moderation-context-note">${escapeHtml(reviewedBits.join(" - "))}</p>` : ""}
          ${item.watch_url ? `<a class="feed-link" href="${escapeHtml(item.watch_url)}" target="_blank" rel="noreferrer">Review watch target</a>` : ""}
          <div class="moderation-edit-grid">
            <label class="moderation-note-label moderation-note-label-wide">
              Stream title
              <input type="text" data-edit-title value="${escapeHtml(item.title || "")}" maxlength="160" />
            </label>
            <label class="moderation-note-label moderation-note-label-wide">
              GCX reason
              <textarea data-edit-stream-reason maxlength="500">${escapeHtml(item.editorial_reason || "")}</textarea>
            </label>
            <label class="moderation-note-label">
              Scheduled start
              <input type="datetime-local" data-edit-stream-scheduled value="${escapeHtml(toDatetimeLocalValue(item.scheduled_start || ""))}" />
            </label>
            <label class="moderation-note-label">
              Priority
              <input type="number" data-edit-priority value="${Number(item.editorialPriority || 0)}" min="0" max="100" />
            </label>
          </div>
          <div class="streamer-actions">
            <button class="button secondary" type="button" data-stream-editorial="${escapeHtml(item.id)}" data-save-details="true">Save details</button>
            <button class="button secondary" type="button" data-stream-editorial="${escapeHtml(item.id)}" data-publish="true">Publish</button>
            <button class="button secondary" type="button" data-stream-editorial="${escapeHtml(item.id)}" data-featured="${item.featured ? "false" : "true"}">${item.featured ? "Unfeature" : "Feature"}</button>
            <button class="button secondary" type="button" data-stream-editorial="${escapeHtml(item.id)}" data-hidden="${item.hidden ? "false" : "true"}">${item.hidden ? "Restore" : "Hide"}</button>
            <button class="button secondary danger" type="button" data-stream-editorial="${escapeHtml(item.id)}" data-deleted="true">Delete</button>
            <button class="button secondary" type="button" data-stream-editorial="${escapeHtml(item.id)}" data-stale="${item.markedStale ? "false" : "true"}">${item.markedStale ? "Clear stale" : "Mark stale"}</button>
          </div>
          <label class="moderation-note-label">
            Editorial note
            <input type="text" data-editorial-note placeholder="Optional Streaming note" maxlength="240" />
          </label>
        </article>
      `;
    })
    .join("");
}

function renderSponsorLeads(leads = []) {
  if (!sponsorLeadQueue) return;
  if (!leads.length) {
    sponsorLeadQueue.innerHTML = emptyMessage("sponsor leads");
    return;
  }

  sponsorLeadQueue.innerHTML = leads
    .map((lead) => {
      const title = lead.company || lead.name || "Sponsor lead";
      const contact = [lead.name, lead.email].filter(Boolean).join(" - ");
      const status = lead.status || "new";
      const history = Array.isArray(lead.statusHistory) && lead.statusHistory.length
        ? `<ul class="moderation-report-list">${lead.statusHistory
            .slice(0, 3)
            .map((item) => `<li><strong>${escapeHtml(formatStatus(item.to))}</strong> ${escapeHtml(item.note || `Moved from ${formatStatus(item.from)}`)} <span>${escapeHtml(formatDate(item.createdAt))}</span></li>`)
            .join("")}</ul>`
        : "";

      return `
        <article class="moderation-card">
          <div>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(contact || "No contact listed")} - ${escapeHtml(formatDate(lead.createdAt))}</span>
          </div>
          <p><strong>${escapeHtml(formatStatus(status))}</strong> - ${escapeHtml(lead.packageInterest || "General sponsorship")} ${lead.budgetRange ? `- ${escapeHtml(lead.budgetRange)}` : ""}</p>
          ${lead.goal ? `<p>${escapeHtml(lead.goal)}</p>` : ""}
          <p>${escapeHtml([lead.source, lead.ref].filter(Boolean).join(" - ") || "Direct inquiry")}</p>
          ${history}
          <div class="streamer-actions">
            <button class="button" type="button" data-sponsor-lead="${escapeHtml(lead.id)}" data-status="contacted">Mark contacted</button>
            <button class="button secondary" type="button" data-sponsor-lead="${escapeHtml(lead.id)}" data-status="proposal">Proposal</button>
            <button class="button secondary" type="button" data-sponsor-lead="${escapeHtml(lead.id)}" data-status="archived">Archive</button>
          </div>
          <label class="moderation-note-label">
            Lead note
            <input type="text" data-sponsor-note placeholder="Optional pipeline note" maxlength="240" />
          </label>
        </article>
      `;
    })
    .join("");
}

function renderSummary(summary = {}) {
  if (!moderationSummary) return;
  moderationSummary.innerHTML = `
    <article>
      <span>Open Reports</span>
      <strong>${Number(summary.openReports || 0).toLocaleString()}</strong>
      <p>${summary.latestReportAt ? `Latest report ${escapeHtml(formatDate(summary.latestReportAt))}.` : "No reports have been filed yet."}</p>
    </article>
    <article>
      <span>Posts</span>
      <strong>${Number(summary.reportedPosts || 0).toLocaleString()}</strong>
      <p>Reported or unpublished posts needing staff visibility.</p>
    </article>
    <article>
      <span>Comments</span>
      <strong>${Number(summary.reportedComments || 0).toLocaleString()}</strong>
      <p>Reported or unpublished comments in the moderation queue.</p>
    </article>
    <article>
      <span>Nominations</span>
      <strong>${Number(summary.pendingNominations || 0).toLocaleString()}</strong>
      <p>Creator nominations waiting for approval or rejection.</p>
    </article>
    <article>
      <span>Reviewer</span>
      <strong>${escapeHtml(summary.staffProfile?.displayName || "Staff")}</strong>
      <p>${escapeHtml(summary.staffProfile?.handle || "Moderator session active.")}</p>
    </article>
  `;
}

function renderQueue(target, items, type) {
  if (!target) return;
  if (!items.length) {
    target.innerHTML = emptyMessage(type === "nomination" ? "nominations" : `${type}s`);
    return;
  }

  target.innerHTML = items
    .map((item) => {
      const title = item.title || item.name || `${type} ${item.id}`;
      const body = item.body || item.specialty || item.linkUrl || "";
      const meta = type === "nomination" ? `${item.nominatedBy || "GCX Member"} - ${formatDate(item.createdAt)}` : `${item.author || "Unknown"} - ${Number(item.reports || 0)} reports`;
      const reportDetails = Array.isArray(item.reportDetails) ? item.reportDetails : [];
      const reportSummary = reportDetails.length
        ? `<ul class="moderation-report-list">${reportDetails
            .map((report) => `<li><strong>${escapeHtml(report.status || "open")}</strong> ${escapeHtml(report.reason || "Community report")} <span>${escapeHtml(formatDate(report.createdAt))}</span></li>`)
            .join("")}</ul>`
        : "";
      const approveStatus = type === "nomination" ? "approved" : "published";
      const primaryLabel = type === "nomination" ? "Activate creator" : "Approve";
      const secondaryLabel = type === "nomination" ? "Reject" : "Remove";

      return `
        <article class="moderation-card">
          <div>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(meta)}${item.reporterCount ? ` - ${Number(item.reporterCount).toLocaleString()} unique reporters` : ""}</span>
          </div>
          <p>${escapeHtml(body)}</p>
          ${reportSummary}
          ${type === "nomination" && item.linkUrl ? `<a class="feed-link" href="${escapeHtml(item.linkUrl)}" target="_blank" rel="noreferrer">Open channel</a>` : ""}
          <div class="streamer-actions">
            <button class="button" type="button" data-moderate="${escapeHtml(item.id)}" data-type="${type}" data-status="${approveStatus}">${escapeHtml(primaryLabel)}</button>
            <button class="button secondary" type="button" data-moderate="${escapeHtml(item.id)}" data-type="${type}" data-status="${type === "nomination" ? "rejected" : "hidden"}">${escapeHtml(secondaryLabel)}</button>
          </div>
          <label class="moderation-note-label">
            Review note
            <input type="text" data-review-note placeholder="Optional note for the moderation log" maxlength="240" />
          </label>
        </article>
      `;
    })
    .join("");
}

function renderCloseoutSummary(data) {
  if (!streamerCloseoutSummary) return;
  const slots = data.slots || {};
  const winners = (data.creatorSpotlight || slots.selected || [slots.popular, slots.rising, slots.third]).filter(Boolean).slice(0, 6);
  streamerCloseoutSummary.innerHTML = winners.length
    ? winners
        .map(
          (streamer) => `
            <article class="moderation-card">
              <div>
                <strong>${escapeHtml(streamer.slotLabel || streamer.spotlight || streamer.tier)}</strong>
                <span>${escapeHtml(streamer.name)} - ${Number(streamer.weeklyVotes || 0).toLocaleString()} weekly votes</span>
              </div>
              <a class="feed-link" href="${escapeHtml(streamer.campaignUrl || "streamers.html")}">Open campaign</a>
            </article>
          `
        )
        .join("")
    : `<div class="index-message">Streamer slots could not be loaded.</div>`;

  if (streamerCloseoutForm) {
    streamerCloseoutForm.elements.weekLabel.value = data.campaign?.weekLabel || "";
  }
}

function renderCreatorSpotlightEditor(data) {
  if (!creatorSpotlightEditor) return;
  const streamers = data.data || [];
  const slots = (data.creatorSpotlight || data.slots?.selected || []).filter(Boolean).slice(0, 6);

  if (!streamers.length) {
    creatorSpotlightEditor.innerHTML = `<div class="index-message">Creator data could not be loaded.</div>`;
    setCreatorSpotlightFormEnabled(false);
    return;
  }

  const rows = Array.from({ length: 6 }, (_, index) => {
    const slot = slots[index] || {};
    const selectedId = slot.id || slot.streamerId || streamers[index]?.id || "";
    const options = streamers
      .map(
        (streamer) => `
          <option value="${escapeHtml(streamer.id)}" ${streamer.id === selectedId ? "selected" : ""}>
            ${escapeHtml(streamer.name)}${streamer.handle ? ` (${escapeHtml(streamer.handle)})` : ""}
          </option>
        `
      )
      .join("");

    return `
      <article class="creator-control-row" data-creator-slot="${index}">
        <input type="hidden" name="slotKey" value="${escapeHtml(slot.slotKey || `spotlight-${index + 1}`)}" />
        <label>
          Slot ${index + 1}
          <select name="streamerId" required>${options}</select>
        </label>
        <label>
          Display label
          <input name="slotLabel" type="text" maxlength="80" value="${escapeHtml(slot.slotLabel || slot.spotlight || `Creator Highlight ${index + 1}`)}" />
        </label>
        <label>
          Twitch username
          <input name="twitchLogin" type="text" maxlength="80" value="${escapeHtml(slot.twitchLogin || streamers.find((streamer) => streamer.id === selectedId)?.twitchLogin || "")}" placeholder="cohhcarnage" />
        </label>
        <label>
          Card description
          <textarea name="slotDescription" rows="3" maxlength="260">${escapeHtml(slot.slotDescription || slot.pitch || slot.specialty || "")}</textarea>
        </label>
      </article>
    `;
  });

  creatorSpotlightEditor.innerHTML = rows.join("");
  setCreatorSpotlightFormEnabled(moderationAccess);
}

async function loadQueue() {
  if (!hasSessionToken()) {
    renderAccessMessage(401);
    return;
  }
  try {
    const response = await fetch("/api/community/moderation", { headers: authHeaders() });
    if (response.status === 401 || response.status === 403) {
      renderAccessMessage(response.status);
      return;
    }
    if (!response.ok) throw new Error(`Moderation API returned ${response.status}`);
    const result = await response.json();
    const data = result.data || {};
    moderationAccess = true;
    setCloseoutFormEnabled(true);
    setCreatorSpotlightFormEnabled(true);
    setIntakeFormsEnabled(true);
    renderSummary(data.summary || {});
    renderQueue(postQueue, data.posts || [], "post");
    renderQueue(commentQueue, data.comments || [], "comment");
    renderQueue(nominationQueue, data.nominations || [], "nomination");
    await Promise.all([loadStreamerOps(), loadSponsorLeads(), loadEditorialTools()]);
  } catch (error) {
    renderAccessMessage(0);
  }
}

async function loadEditorialTools() {
  if (!socialEditorialTools && !streamingEditorialTools) return;
  if (!moderationAccess) {
    if (socialEditorialTools) socialEditorialTools.innerHTML = adminAccessMessage(hasSessionToken() ? 403 : 401);
    if (streamingEditorialTools) streamingEditorialTools.innerHTML = adminAccessMessage(hasSessionToken() ? 403 : 401);
    return;
  }
  try {
    const response = await fetch("/api/community/editorial/social-streaming", { headers: authHeaders(), cache: "no-store" });
    if (response.status === 401 || response.status === 403) {
      renderAccessMessage(response.status);
      return;
    }
    if (!response.ok) throw new Error(`Editorial API returned ${response.status}`);
    const result = await response.json();
    const data = result.data || {};
    renderSocialEditorialTools(data.socialPosts || []);
    renderStreamingEditorialTools(data.streamingItems || []);
  } catch (error) {
    if (socialEditorialTools) socialEditorialTools.innerHTML = `<div class="index-message">Social editorial tools could not be loaded.</div>`;
    if (streamingEditorialTools) streamingEditorialTools.innerHTML = `<div class="index-message">Streaming editorial tools could not be loaded.</div>`;
  }
}

async function loadSponsorLeads() {
  if (!sponsorLeadQueue) return;
  if (!moderationAccess) {
    sponsorLeadQueue.innerHTML = adminAccessMessage(hasSessionToken() ? 403 : 401);
    return;
  }
  try {
    const response = await fetch("/api/community/sponsor-leads", { headers: authHeaders() });
    if (response.status === 401 || response.status === 403) {
      renderAccessMessage(response.status);
      return;
    }
    if (!response.ok) throw new Error(`Sponsor lead API returned ${response.status}`);
    const result = await response.json();
    renderSponsorLeads(result.data || []);
  } catch (error) {
    sponsorLeadQueue.innerHTML = `<div class="index-message">Sponsor leads could not be loaded.</div>`;
  }
}

async function loadStreamerOps() {
  if (!streamerCloseoutSummary && !creatorSpotlightEditor) return;
  if (!moderationAccess) {
    if (streamerCloseoutSummary) streamerCloseoutSummary.innerHTML = adminAccessMessage(hasSessionToken() ? 403 : 401);
    if (creatorSpotlightEditor) creatorSpotlightEditor.innerHTML = adminAccessMessage(hasSessionToken() ? 403 : 401);
    setCloseoutFormEnabled(false);
    setCreatorSpotlightFormEnabled(false);
    return;
  }
  try {
    const response = await fetch("/api/community/streamers");
    if (!response.ok) throw new Error(`Streamer API returned ${response.status}`);
    const result = await response.json();
    renderCloseoutSummary(result || {});
    renderCreatorSpotlightEditor(result || {});
  } catch (error) {
    if (streamerCloseoutSummary) streamerCloseoutSummary.innerHTML = `<div class="index-message">Streamer closeout data could not be loaded.</div>`;
    if (creatorSpotlightEditor) creatorSpotlightEditor.innerHTML = `<div class="index-message">Creator highlight controls could not be loaded.</div>`;
  }
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-moderate]");
  if (!button) return;

  button.disabled = true;
  const original = button.textContent;
  button.textContent = "Saving...";

  try {
    const response = await fetch("/api/community/moderation/status", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        type: button.dataset.type,
        id: button.dataset.moderate,
        status: button.dataset.status,
        note: button.closest(".moderation-card")?.querySelector("[data-review-note]")?.value || "",
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Moderation action failed.");
    await loadQueue();
  } catch (error) {
    button.disabled = false;
    button.textContent = original;
    const card = button.closest(".moderation-card");
    if (card && !card.querySelector(".form-status")) {
      card.insertAdjacentHTML("beforeend", `<p class="form-status">${escapeHtml(error.message || "Moderation action failed.")}</p>`);
    }
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-sponsor-lead]");
  if (!button) return;

  button.disabled = true;
  const original = button.textContent;
  button.textContent = "Saving...";

  try {
    const response = await fetch(`/api/community/sponsor-leads/${encodeURIComponent(button.dataset.sponsorLead)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        status: button.dataset.status,
        note: button.closest(".moderation-card")?.querySelector("[data-sponsor-note]")?.value || "",
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Sponsor lead update failed.");
    await loadSponsorLeads();
  } catch (error) {
    button.disabled = false;
    button.textContent = original;
    const card = button.closest(".moderation-card");
    if (card && !card.querySelector(".form-status")) {
      card.insertAdjacentHTML("beforeend", `<p class="form-status">${escapeHtml(error.message || "Sponsor lead update failed.")}</p>`);
    }
  }
});

document.addEventListener("click", async (event) => {
  const socialButton = event.target.closest("[data-social-editorial]");
  const streamButton = event.target.closest("[data-stream-editorial]");
  const button = socialButton || streamButton;
  if (!button) return;

  button.disabled = true;
  const original = button.textContent;
  button.textContent = "Saving...";

  const card = button.closest(".moderation-card");
  const body = {
    note: card?.querySelector("[data-editorial-note]")?.value || "",
  };
  if (button.dataset.saveDetails === "true") {
    const titleInput = card?.querySelector("[data-edit-title]");
    const bodyInput = card?.querySelector("[data-edit-body]");
    const categoryInput = card?.querySelector("[data-edit-category]");
    const priorityInput = card?.querySelector("[data-edit-priority]");
    const scheduledInput = card?.querySelector("[data-edit-scheduled]");
    const streamReasonInput = card?.querySelector("[data-edit-stream-reason]");
    const streamScheduledInput = card?.querySelector("[data-edit-stream-scheduled]");
    if (titleInput) body.title = titleInput.value;
    if (bodyInput) body.body = bodyInput.value;
    if (categoryInput) body.category = categoryInput.value;
    if (priorityInput) body.editorialPriority = Number(priorityInput.value || 0);
    if (scheduledInput) body.scheduledAt = datetimeLocalToIso(scheduledInput.value);
    if (streamReasonInput) body.editorial_reason = streamReasonInput.value;
    if (streamScheduledInput) body.scheduled_start = datetimeLocalToIso(streamScheduledInput.value);
  }
  if (button.dataset.status) body.status = button.dataset.status;
  if (button.dataset.stale) body.markedStale = button.dataset.stale === "true";
  if (button.dataset.pinned) body.editorialPinned = button.dataset.pinned === "true";
  if (button.dataset.featured) body.featured = button.dataset.featured === "true";
  if (button.dataset.hidden) body.hidden = button.dataset.hidden === "true";
  if (button.dataset.deleted) body.deleted = button.dataset.deleted === "true";
  if (button.dataset.publish) body.publish = button.dataset.publish === "true";

  const basePath = socialButton
    ? `/api/community/editorial/social-posts/${encodeURIComponent(button.dataset.socialEditorial)}`
    : `/api/community/editorial/streaming-spotlight/${encodeURIComponent(button.dataset.streamEditorial)}`;

  try {
    const response = await fetch(basePath, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Editorial update failed.");
    await loadEditorialTools();
  } catch (error) {
    button.disabled = false;
    button.textContent = original;
    if (card && !card.querySelector(".form-status")) {
      card.insertAdjacentHTML("beforeend", `<p class="form-status">${escapeHtml(error.message || "Editorial update failed.")}</p>`);
    }
  }
});

function formObject(form) {
  const formData = new FormData(form);
  return Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
}

async function submitIntakeDraft({ form, statusTarget, endpoint, successPrefix }) {
  if (!form || !statusTarget) return;
  if (!hasSessionToken()) {
    statusTarget.innerHTML = `Log in with a moderator or admin account before creating drafts. <a href="auth.html?next=community-admin.html">Sign in</a>`;
    return;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  const original = submitButton?.textContent || "";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Creating...";
  }
  statusTarget.textContent = "Creating review draft...";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(formObject(form)),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Draft could not be created.");
    form.reset();
    statusTarget.textContent = `${successPrefix}: ${result.data?.title || "Review draft"} is waiting for staff review.`;
    await loadEditorialTools();
  } catch (error) {
    statusTarget.textContent = error.message || "Draft could not be created.";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = original;
    }
  }
}

socialIntakeForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitIntakeDraft({
    form: socialIntakeForm,
    statusTarget: socialIntakeStatus,
    endpoint: "/api/community/editorial/social-posts/intake",
    successPrefix: "Social draft created",
  });
});

streamingIntakeForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitIntakeDraft({
    form: streamingIntakeForm,
    statusTarget: streamingIntakeStatus,
    endpoint: "/api/community/editorial/streaming-spotlight/intake",
    successPrefix: "Streaming draft created",
  });
});

creatorSpotlightForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hasSessionToken()) {
    creatorSpotlightStatus.innerHTML = `Log in with a moderator or admin account before updating creator highlights. <a href="auth.html?next=community-admin.html">Sign in</a>`;
    return;
  }

  const submitButton = creatorSpotlightForm.querySelector('button[type="submit"]');
  const original = submitButton?.textContent || "";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";
  }
  creatorSpotlightStatus.textContent = "Saving creator highlights...";

  const slots = Array.from(creatorSpotlightEditor?.querySelectorAll("[data-creator-slot]") || []).map((row, index) => ({
    streamerId: row.querySelector('[name="streamerId"]')?.value || "",
    slotKey: row.querySelector('[name="slotKey"]')?.value || `spotlight-${index + 1}`,
    slotLabel: row.querySelector('[name="slotLabel"]')?.value || `Creator Highlight ${index + 1}`,
    twitchLogin: row.querySelector('[name="twitchLogin"]')?.value || "",
    slotDescription: row.querySelector('[name="slotDescription"]')?.value || "",
  }));

  try {
    const response = await fetch("/api/community/streamers/spotlight", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ slots }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Creator highlights could not be saved.");
    creatorSpotlightStatus.textContent = "Creator highlights saved. The public Streamer Highlights page is ready with the new six-card order.";
    if (moderationAccess) await loadStreamerOps();
  } catch (error) {
    creatorSpotlightStatus.textContent = error.message || "Creator highlights could not be saved.";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = original;
    }
  }
});

streamerCloseoutForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hasSessionToken()) {
    streamerCloseoutStatus.innerHTML = `Log in with a moderator or admin account before closing a streamer week. <a href="auth.html?next=community-admin.html">Sign in</a>`;
    return;
  }
  streamerCloseoutStatus.textContent = "Closing week...";
  const formData = new FormData(streamerCloseoutForm);

  try {
    const response = await fetch("/api/community/streamers/close-week", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        weekLabel: formData.get("weekLabel"),
        nextWeekLabel: formData.get("nextWeekLabel"),
        summary: formData.get("summary"),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Streamer week could not be closed.");
    streamerCloseoutStatus.textContent = `${result.data.weekLabel} was archived and weekly votes were reset.`;
    streamerCloseoutForm.reset();
    if (moderationAccess) await loadStreamerOps();
  } catch (error) {
    streamerCloseoutStatus.textContent = error.message;
  }
});

loadQueue();
