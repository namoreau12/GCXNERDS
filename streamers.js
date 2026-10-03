const streamerGrid = document.querySelector("#streamer-grid");
const campaignStrip = document.querySelector("#campaign-strip");
const spotlightSlots = document.querySelector("#spotlight-slots");
const spotlightHistory = document.querySelector("#spotlight-history");
const featuredStream = document.querySelector("#featured-stream");
const streamingLiveNow = document.querySelector("#streaming-live-now");
const streamingUpcoming = document.querySelector("#streaming-upcoming");
const streamingPicks = document.querySelector("#streaming-picks");
const revenueList = document.querySelector("#revenue-list");
const nominationForm = document.querySelector("#nomination-form");
const nominationStatus = document.querySelector("#nomination-status");
const votedStorageKey = "gcx-streamer-votes-v1";
const viewedSpotlightStorageKey = "gcx-streaming-spotlight-viewed-v1";

let streamers = [];
let campaign = {};
let slots = {};
let creatorSpotlight = [];
let history = [];
let streamingSpotlight = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readVotes() {
  try {
    return JSON.parse(localStorage.getItem(votedStorageKey) || "[]");
  } catch (error) {
    return [];
  }
}

function writeVotes(votes) {
  try {
    localStorage.setItem(votedStorageKey, JSON.stringify(votes));
  } catch (error) {
    // Voting still works server-side if localStorage is unavailable.
  }
}

function readStoredSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch (error) {
    return new Set();
  }
}

function writeStoredSet(key, values) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(values)));
  } catch (error) {
    // Local de-duplication is progressive enhancement.
  }
}

function referralCampaignUrl(streamer) {
  const url = new URL(streamer.campaignUrl || `streamer.html?id=${streamer.id}`, window.location.href);
  if (!url.searchParams.get("ref")) url.searchParams.set("ref", streamer.id);
  return url;
}

function shareToFeedUrl(streamer) {
  const url = new URL("community.html", window.location.href);
  url.searchParams.set("shareUrl", referralCampaignUrl(streamer).toString());
  url.searchParams.set("title", `Vote for ${streamer.name}`);
  url.searchParams.set("body", `${streamer.name} is in the GCX creator spotlight. Vote, share, and bring more fans into the games/cards community.`);
  url.searchParams.set("category", "Streaming");
  return `${url.pathname.replace(/^\//, "")}${url.search}`;
}

function recordStreamerTraffic(streamer, type, campaignUrl) {
  fetch("/api/community/traffic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      source: "streamer_board",
      targetType: "streamer",
      targetId: streamer.id,
      ref: streamer.id,
      path: `${window.location.pathname}${window.location.search}`,
      campaignUrl,
    }),
  }).catch(() => {
    // Tracking should never block voting or sharing.
  });
}

function streamStatusLabel(item) {
  if (item.is_live === true) return "LIVE";
  return item.status || (item.scheduled_start ? "Scheduled" : "Replay");
}

function isSafeYouTubeEmbed(url) {
  return /^https:\/\/(www\.)?(youtube|youtube-nocookie)\.com\/embed\//i.test(String(url || ""));
}

function isSafeTwitchEmbed(url) {
  return /^https:\/\/player\.twitch\.tv\//i.test(String(url || ""));
}

function twitchChannelFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (!/(^|\.)twitch\.tv$/i.test(parsed.hostname)) return "";
    return parsed.pathname.replace(/^\/+/, "").split("/")[0] || "";
  } catch {
    return "";
  }
}

function streamEmbedUrl(item) {
  const embedUrl = item.embed_url || "";
  if (isSafeYouTubeEmbed(embedUrl)) return embedUrl;
  if (isSafeTwitchEmbed(embedUrl) || String(item.platform || "").toLowerCase() === "twitch") {
    const channel = item.external_channel_id || twitchChannelFromUrl(item.watch_url || "") || "";
    if (!channel) return "";
    const url = new URL("https://player.twitch.tv/");
    url.searchParams.set("channel", channel);
    url.searchParams.set("parent", window.location.hostname || "localhost");
    url.searchParams.set("muted", "true");
    return url.toString();
  }
  return "";
}

function isSafeStreamEmbed(url) {
  return isSafeYouTubeEmbed(url) || isSafeTwitchEmbed(url);
}

function youtubeThumbnailFromEmbed(url) {
  const match = String(url || "").match(/\/embed\/([^?/#]+)/i);
  return match?.[1] ? `https://img.youtube.com/vi/${encodeURIComponent(match[1])}/hqdefault.jpg` : "";
}

function renderStreamIframe(item, featured = false) {
  const embedUrl = streamEmbedUrl(item);
  if (!embedUrl) return renderStreamMedia({ ...item, embed_url: "" }, featured);
  return `
    <div class="${featured ? "featured-stream-player" : "stream-card-player"}" data-stream-player>
      <iframe
        src="${escapeHtml(embedUrl)}"
        title="${escapeHtml(item.title)}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  `;
}

function renderStreamMedia(item, featured = false) {
  const embedUrl = streamEmbedUrl(item);
  if (embedUrl) {
    if (featured) return renderStreamIframe(item, true);
    const thumbnail = item.thumbnail_url || youtubeThumbnailFromEmbed(embedUrl);
    return `
      <div class="stream-card-player stream-embed-preview" data-stream-player>
        ${thumbnail ? `<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(item.title)} preview" loading="lazy" decoding="async" />` : ""}
        ${thumbnail ? "" : `<span class="stream-provider-preview">${escapeHtml(item.platform || "Official stream")}</span>`}
        <button
          class="stream-load-embed"
          type="button"
          data-load-stream-embed="${escapeHtml(embedUrl)}"
          data-stream-title="${escapeHtml(item.title)}"
          data-stream-item-id="${escapeHtml(item.id)}"
        >
          Load official embed
        </button>
      </div>
    `;
  }

  if (item.thumbnail_url) {
    return `<img src="${escapeHtml(item.thumbnail_url)}" alt="${escapeHtml(item.title)} preview" loading="lazy" decoding="async" />`;
  }

  return `<div class="stream-placeholder">${escapeHtml(item.platform || "Stream")}</div>`;
}

function renderSpotlightInterest(item) {
  const views = Number(item.viewCount || item.views || 0);
  const clicks = Number(item.watchClickCount || 0);
  const loads = Number(item.embedLoadCount || 0);
  return `
    <div class="stream-interest-row" aria-label="GCX spotlight interest">
      <span data-stream-view-count>${views.toLocaleString()} GCX views</span>
      <span data-stream-watch-count>${clicks.toLocaleString()} watch clicks</span>
      ${loads ? `<span>${loads.toLocaleString()} embed loads</span>` : ""}
    </div>
  `;
}

function renderStreamCard(item) {
  const status = streamStatusLabel(item);
  return `
    <article class="stream-watch-card" data-stream-spotlight-card="${escapeHtml(item.id)}">
      ${renderStreamMedia(item)}
      <div class="stream-watch-copy">
        <div class="stream-watch-meta">
          <span class="${item.is_live === true ? "is-live" : ""}">${escapeHtml(status)}</span>
          <span>${escapeHtml(item.platform || "Video")}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.editorial_reason || item.category || "")}</p>
        <small>${escapeHtml([item.creator, item.game].filter(Boolean).join(" - "))}</small>
        ${renderSpotlightInterest(item)}
        <a class="button secondary" href="${escapeHtml(item.watch_url || "#")}" target="_blank" rel="noreferrer" data-stream-watch="${escapeHtml(item.id)}">Watch</a>
      </div>
    </article>
  `;
}

function renderStreamingSpotlight() {
  if (!featuredStream) return;
  const items = streamingSpotlight || [];
  const featured = items.find((item) => item.featured) || items[0];
  const nonFeatured = items.filter((item) => item.id !== featured?.id);
  const liveOrReplay = nonFeatured.filter((item) => item.is_live === true || ["replay", "channel", "featured"].includes(String(item.status || "").toLowerCase())).slice(0, 4);
  const upcoming = nonFeatured.filter((item) => item.scheduled_start || String(item.status || "").toLowerCase() === "scheduled").slice(0, 4);
  const picks = nonFeatured.filter((item) => !liveOrReplay.some((candidate) => candidate.id === item.id) && !upcoming.some((candidate) => candidate.id === item.id)).slice(0, 4);

  featuredStream.innerHTML = featured
    ? `
      <article class="featured-stream-card" data-stream-spotlight-card="${escapeHtml(featured.id)}">
        ${renderStreamMedia(featured, true)}
        <div class="featured-stream-copy">
          <span class="${featured.is_live === true ? "stream-live-pill is-live" : "stream-live-pill"}">${escapeHtml(streamStatusLabel(featured))}</span>
          <p class="kicker">${escapeHtml(featured.platform || "Video")} - ${escapeHtml(featured.category || "GCX pick")}</p>
          <h3>${escapeHtml(featured.title)}</h3>
          <p>${escapeHtml(featured.editorial_reason || "")}</p>
          <small>${escapeHtml(featured.source || "")}</small>
          ${renderSpotlightInterest(featured)}
          <a class="button" href="${escapeHtml(featured.watch_url || "#")}" target="_blank" rel="noreferrer" data-stream-watch="${escapeHtml(featured.id)}">Watch</a>
        </div>
      </article>
    `
    : `<div class="index-message">Streaming picks will appear here.</div>`;

  if (streamingLiveNow) streamingLiveNow.innerHTML = liveOrReplay.length ? liveOrReplay.map(renderStreamCard).join("") : `<div class="index-message">No verified live streams right now. Replays and channels will appear here.</div>`;
  if (streamingUpcoming) streamingUpcoming.innerHTML = upcoming.length ? upcoming.map(renderStreamCard).join("") : `<div class="index-message">No scheduled stream has been verified yet.</div>`;
  if (streamingPicks) streamingPicks.innerHTML = picks.length ? picks.map(renderStreamCard).join("") : `<div class="index-message">GCX watchlist picks will appear here.</div>`;
  trackVisibleStreamingSpotlightViews();
}

function renderStreamers() {
  const voted = new Set(readVotes());
  const selectedSpotlight = (creatorSpotlight.length ? creatorSpotlight : slots.selected || [slots.popular, slots.rising, slots.third]).filter(Boolean).slice(0, 6);

  if (campaignStrip) {
    const names = selectedSpotlight.map((streamer) => streamer.name).join(" + ");
    campaignStrip.innerHTML = `
      <div>
        <strong>${escapeHtml(campaign.weekLabel || "Current voting week")}</strong>
        <span>${escapeHtml(campaign.spotlightTheme || "Six creator highlights")}</span>
      </div>
      <div>
        <strong>${escapeHtml(names || "Spotlight selection open")}</strong>
        <span>${escapeHtml(campaign.sponsorPackage || "Sponsor package ready for launch")}</span>
      </div>
    `;
  }

  if (spotlightSlots) {
    spotlightSlots.innerHTML = selectedSpotlight.length
      ? selectedSpotlight
          .map((streamer) => {
            const campaignUrlObject = referralCampaignUrl(streamer);
            const campaignPath = `${campaignUrlObject.pathname.replace(/^\//, "")}${campaignUrlObject.search}`;
            return `
              <article class="spotlight-slot-card ${escapeHtml(streamer.slotKey || "")}">
                <img src="${escapeHtml(streamer.imageUrl)}" alt="${escapeHtml(streamer.name)} weekly slot" loading="lazy" />
                <div>
                  <span>${escapeHtml(streamer.slotLabel || streamer.spotlight || streamer.tier)}</span>
                  <h3>${escapeHtml(streamer.name)}</h3>
                  <p>${escapeHtml(streamer.slotDescription || streamer.pitch || streamer.specialty)}</p>
                  <strong>${Number(streamer.weeklyVotes || streamer.votes || 0).toLocaleString()} weekly votes</strong>
                  <div class="streamer-actions">
                    <a class="button" href="${escapeHtml(campaignPath)}">Open campaign</a>
                    <a class="button secondary" href="${escapeHtml(shareToFeedUrl(streamer))}">Share to feed</a>
                  </div>
                </div>
              </article>
            `;
          })
          .join("")
      : "";
  }

  if (revenueList && Array.isArray(campaign.revenueIdeas)) {
    revenueList.innerHTML = campaign.revenueIdeas.map((idea) => `<li>${escapeHtml(idea)}</li>`).join("");
  }

  if (!streamers.length) {
    streamerGrid.innerHTML = `<div class="index-message">Streamer data could not be loaded.</div>`;
    return;
  }

  if (spotlightHistory) {
    spotlightHistory.innerHTML = history.length
      ? history
          .map((week) => {
            const winners = (week.featuredCreators || [week.popularWinner, week.risingWinner]).filter(Boolean).slice(0, 3);
            return `
              <article class="spotlight-history-card">
                <div>
                  <span>${escapeHtml(week.weekLabel)}</span>
                  <strong>${escapeHtml(winners.map((winner) => winner.name).join(" + "))}</strong>
                  <p>${escapeHtml(week.summary || "Archived streamer spotlight results.")}</p>
                </div>
                <div class="spotlight-history-winners">
                  ${winners
                    .map(
                      (winner) => `
                        <a href="${escapeHtml(winner.campaignUrl || "streamers.html")}">
                          <img src="${escapeHtml(winner.imageUrl || "")}" alt="${escapeHtml(winner.name)} archived spotlight" loading="lazy" />
                          <span>${escapeHtml(winner.handle || "Creator")}</span>
                          <strong>${Number(winner.weeklyVotes || 0).toLocaleString()} votes</strong>
                        </a>
                      `
                    )
                    .join("")}
                </div>
              </article>
            `;
          })
          .join("")
      : `<div class="index-message">Past spotlight winners will appear after weekly campaigns close.</div>`;
  }

  const highlightedIds = new Set(selectedSpotlight.map((streamer) => streamer.id));
  const poolStreamers = streamers.filter((streamer) => !highlightedIds.has(streamer.id));
  streamerGrid.innerHTML = poolStreamers.length
    ? poolStreamers
    .map((streamer, index) => {
      const platforms = (streamer.platforms || []).map((platform) => `<span>${escapeHtml(platform)}</span>`).join("");
      const hasVoted = voted.has(streamer.id);
      const spotlightSlot = selectedSpotlight.find((item) => item.id === streamer.id);
      const rank = spotlightSlot?.slotLabel || (index < 3 ? "Creator Spotlight" : "Nominee");
      const campaignUrlObject = referralCampaignUrl(streamer);
      const campaignUrl = campaignUrlObject.toString();
      const campaignPath = `${campaignUrlObject.pathname.replace(/^\//, "")}${campaignUrlObject.search}`;

      return `
        <article class="streamer-card ${spotlightSlot || index < 3 ? "is-featured" : ""}">
          <img src="${escapeHtml(streamer.imageUrl)}" alt="${escapeHtml(streamer.name)} channel spotlight" loading="lazy" />
            <div class="streamer-card-copy">
              <div class="console-card-topline">
                <span>${escapeHtml(streamer.spotlight || rank)}</span>
                <span>${Number(streamer.weeklyVotes || streamer.votes || 0).toLocaleString()} weekly votes</span>
              </div>
              <h2>${escapeHtml(streamer.name)}</h2>
              <p class="meta">${escapeHtml(streamer.handle)} - ${escapeHtml(streamer.tier)}</p>
              <p>${escapeHtml(streamer.pitch)}</p>
              <p>${escapeHtml(streamer.specialty)}</p>
              ${
                streamer.audienceSize
                  ? `<p class="creator-audience-note">${escapeHtml(streamer.audienceSize)}</p>`
                  : ""
              }
              <div class="feed-tags">${platforms}</div>
              <div class="streamer-actions">
              <button class="button" type="button" data-vote="${escapeHtml(streamer.id)}" ${hasVoted ? "disabled" : ""}>
                ${hasVoted ? "Vote counted" : "Vote for streamer"}
              </button>
              <button class="button secondary" type="button" data-copy-campaign="${escapeHtml(campaignUrl)}">Copy campaign link</button>
              <a class="button secondary" href="${escapeHtml(campaignPath)}">Campaign page</a>
              <a class="button secondary" href="${escapeHtml(shareToFeedUrl(streamer))}">Share to feed</a>
              <a class="button secondary" href="${escapeHtml(streamer.linkUrl)}" target="_blank" rel="noreferrer">Visit channel</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("")
    : `<div class="index-message">Additional creator nominees will appear here when the pool expands beyond this week's six highlights.</div>`;
}

async function loadStreamers() {
  try {
    const response = await fetch("/api/community/streamers");
    if (!response.ok) throw new Error(`Streamer API returned ${response.status}`);
    const result = await response.json();
    streamers = result.data || [];
    campaign = result.campaign || {};
    slots = result.slots || {};
    creatorSpotlight = result.creatorSpotlight || (result.slots?.selected || []).filter(Boolean);
    history = result.spotlightHistory || [];
    streamingSpotlight = result.streamingSpotlight || [];
    renderStreamingSpotlight();
    renderStreamers();
  } catch (error) {
    streamerGrid.innerHTML = `<div class="index-message">Streamer highlights could not be loaded. Make sure the local server is running.</div>`;
  }
}

function updateSpotlightCounts(item) {
  if (!item?.id) return;
  streamingSpotlight = streamingSpotlight.map((spotlightItem) =>
    spotlightItem.id === item.id
      ? {
          ...spotlightItem,
          viewCount: item.viewCount ?? spotlightItem.viewCount,
          watchClickCount: item.watchClickCount ?? spotlightItem.watchClickCount,
          embedLoadCount: item.embedLoadCount ?? spotlightItem.embedLoadCount,
        }
      : spotlightItem
  );
  document.querySelectorAll(`[data-stream-spotlight-card="${CSS.escape(item.id)}"]`).forEach((card) => {
    const viewLabel = card.querySelector("[data-stream-view-count]");
    const watchLabel = card.querySelector("[data-stream-watch-count]");
    if (viewLabel && item.viewCount !== undefined) viewLabel.textContent = `${Number(item.viewCount || 0).toLocaleString()} GCX views`;
    if (watchLabel && item.watchClickCount !== undefined) watchLabel.textContent = `${Number(item.watchClickCount || 0).toLocaleString()} watch clicks`;
  });
}

async function trackVisibleStreamingSpotlightViews() {
  const viewed = readStoredSet(viewedSpotlightStorageKey);
  const itemIds = Array.from(document.querySelectorAll("[data-stream-spotlight-card]"))
    .map((card) => card.dataset.streamSpotlightCard)
    .filter((id) => id && !viewed.has(id))
    .slice(0, 30);
  if (!itemIds.length) return;
  itemIds.forEach((id) => viewed.add(id));
  writeStoredSet(viewedSpotlightStorageKey, viewed);
  try {
    const response = await fetch("/api/community/streaming-spotlight/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds }),
    });
    if (!response.ok) return;
    const result = await response.json();
    (result.data || []).forEach(updateSpotlightCounts);
  } catch {
    // Streaming interest counts should never block watching or browsing.
  }
}

function trackStreamingSpotlightEngagement(itemId, action) {
  if (!itemId) return;
  fetch("/api/community/streaming-spotlight/engagement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, action }),
    keepalive: true,
  })
    .then((response) => response.ok ? response.json() : null)
    .then((result) => {
      if (result?.data) updateSpotlightCounts(result.data);
    })
    .catch(() => {
      // Engagement tracking is progressive enhancement.
    });
}

streamerGrid?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-vote]");
  const campaignButton = event.target.closest("[data-copy-campaign]");
  if (campaignButton) {
    const streamer = streamers.find((item) => campaignButton.dataset.copyCampaign.includes(`id=${encodeURIComponent(item.id)}`) || campaignButton.dataset.copyCampaign.includes(item.id));
    try {
      await navigator.clipboard.writeText(campaignButton.dataset.copyCampaign);
      campaignButton.textContent = "Copied";
      if (streamer) recordStreamerTraffic(streamer, "share_copy", campaignButton.dataset.copyCampaign);
    } catch (error) {
      campaignButton.textContent = "Copy failed";
    }
    return;
  }

  if (!button) return;

  const streamerId = button.dataset.vote;
  const voted = new Set(readVotes());
  if (voted.has(streamerId)) return;

  button.disabled = true;
  button.textContent = "Voting...";

  try {
    const response = await fetch("/api/community/streamers/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamerId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Vote could not be saved.");

    streamers = streamers.map((streamer) => (streamer.id === streamerId ? result.data : streamer));
    voted.add(streamerId);
    writeVotes(Array.from(voted));
    recordStreamerTraffic(result.data, "campaign_vote", referralCampaignUrl(result.data).toString());
    renderStreamers();
  } catch (error) {
    button.disabled = false;
    button.textContent = "Vote for streamer";
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-load-stream-embed]");
  const watchLink = event.target.closest("[data-stream-watch]");
  if (watchLink) {
    trackStreamingSpotlightEngagement(watchLink.dataset.streamWatch, "watch_click");
  }

  if (!button) return;
  const embedUrl = button.dataset.loadStreamEmbed || "";
  if (!isSafeStreamEmbed(embedUrl)) return;
  const container = button.closest("[data-stream-player]");
  if (!container) return;
  trackStreamingSpotlightEngagement(button.dataset.streamItemId, "embed_load");
  container.classList.remove("stream-embed-preview");
  container.innerHTML = `
    <iframe
      src="${escapeHtml(embedUrl)}"
      title="${escapeHtml(button.dataset.streamTitle || "Official stream embed")}"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
  `;
});

nominationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  nominationStatus.textContent = "Submitting...";
  const formData = new FormData(nominationForm);
  const submitButton = nominationForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch("/api/community/streamers/nominate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        handle: formData.get("handle"),
        email: formData.get("email"),
        linkUrl: formData.get("linkUrl"),
        otherLinks: formData.get("otherLinks"),
        audienceSize: formData.get("audienceSize"),
        platforms: formData.getAll("platforms"),
        categories: formData.getAll("categories"),
        specialty: formData.get("specialty"),
        nominatedBy: formData.get("nominatedBy"),
        consent: formData.get("consent") === "on",
        consentVersion: "gcx-creator-spotlight-launch-v1",
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Nomination could not be saved.");
    nominationForm.reset();
    nominationStatus.textContent = `${result.data.name} was added to the creator review queue.`;
  } catch (error) {
    nominationStatus.textContent = error.message;
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

loadStreamers();
