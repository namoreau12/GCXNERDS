const streamerImage = document.querySelector("#streamer-image");
const streamerRank = document.querySelector("#streamer-rank");
const streamerName = document.querySelector("#streamer-name");
const streamerPitch = document.querySelector("#streamer-pitch");
const streamerPlatforms = document.querySelector("#streamer-platforms");
const streamerVote = document.querySelector("#streamer-vote");
const streamerCopy = document.querySelector("#streamer-copy");
const streamerShareFeed = document.querySelector("#streamer-share-feed");
const streamerSponsor = document.querySelector("#streamer-sponsor");
const streamerChannel = document.querySelector("#streamer-channel");
const streamerWeeklyVotes = document.querySelector("#streamer-weekly-votes");
const streamerTotalVotes = document.querySelector("#streamer-total-votes");
const streamerStanding = document.querySelector("#streamer-standing");
const streamerTopTwo = document.querySelector("#streamer-top-two");
const streamerShareKit = document.querySelector("#streamer-share-kit");
const streamerRefCode = document.querySelector("#streamer-ref-code");
const streamerInviteLink = document.querySelector("#streamer-invite-link");
const streamerCopyInvite = document.querySelector("#streamer-copy-invite");
const streamerPreviewInvite = document.querySelector("#streamer-preview-invite");
const streamerTrafficSummary = document.querySelector("#streamer-traffic-summary");
const streamerReferralBoard = document.querySelector("#streamer-referral-board");
const streamerConversionKit = document.querySelector("#streamer-conversion-kit");
const votedStorageKey = "gcx-streamer-votes-v1";

let activeStreamer = null;
let campaign = {};
let shareTemplates = [];
let activeTraffic = {};

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
    // Votes are still saved server-side if localStorage is unavailable.
  }
}

function selectedStreamerId() {
  return new URLSearchParams(window.location.search).get("id") || "nova-circuit";
}

function referralCode() {
  const typedCode = streamerRefCode?.value?.trim();
  if (typedCode) return typedCode;
  const params = new URLSearchParams(window.location.search);
  return params.get("ref") || selectedStreamerId();
}

function campaignUrl() {
  const url = new URL("streamer.html", window.location.href);
  url.searchParams.set("id", activeStreamer.id);
  url.searchParams.set("ref", referralCode());
  return url.toString();
}

function campaignPath() {
  const url = new URL(campaignUrl());
  return `${url.pathname.replace(/^\//, "")}${url.search}`;
}

function shareToFeedPath() {
  const url = new URL("community.html", window.location.href);
  url.searchParams.set("shareUrl", campaignUrl());
  url.searchParams.set("title", `Vote for ${activeStreamer.name}`);
  url.searchParams.set("body", `${activeStreamer.name} is in the GCX creator spotlight. Help push this creator up the weekly board.`);
  url.searchParams.set("category", "Streaming");
  return `${url.pathname.replace(/^\//, "")}${url.search}`;
}

function syncInviteLink() {
  if (!activeStreamer) return;
  const url = campaignUrl();
  if (streamerInviteLink) streamerInviteLink.value = url;
  if (streamerPreviewInvite) streamerPreviewInvite.href = campaignPath();
  renderShareKit();
}

function recordTraffic(type) {
  if (!activeStreamer) return;
  fetch("/api/community/traffic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      source: "streamer_campaign",
      targetType: "streamer",
      targetId: activeStreamer.id,
      ref: referralCode(),
      path: `${window.location.pathname}${window.location.search}`,
      campaignUrl: campaignUrl(),
    }),
  }).catch(() => {
    // Tracking is non-blocking; voting and sharing should still work.
  });
}

function renderShareCard(title, audience, copy) {
  const text = `${copy} ${campaignUrl()}`;
  return `
    <article class="campaign-kit-card">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(audience)}</span>
      </div>
      <p>${escapeHtml(copy)}</p>
      <button class="button secondary" type="button" data-copy-share="${escapeHtml(text)}">Copy post</button>
    </article>
  `;
}

function renderTrafficSummary() {
  if (!streamerTrafficSummary) return;
  const byType = activeTraffic.byType || [];
  const metricFor = (type) => Number(byType.find((item) => item.label === type)?.count || 0);
  streamerTrafficSummary.innerHTML = [
    ["Campaign views", metricFor("campaign_view")],
    ["Votes tracked", metricFor("campaign_vote")],
    ["Links copied", metricFor("campaign_link_copy") + metricFor("share_copy")],
    ["Referral events", activeTraffic.totalEvents || 0],
  ]
    .map(
      ([label, value]) => `
        <article>
          <strong>${Number(value || 0).toLocaleString()}</strong>
          <span>${escapeHtml(label)}</span>
        </article>
      `
    )
    .join("");
}

function renderReferralBoard() {
  if (!streamerReferralBoard) return;
  const referrals = (activeTraffic.byRef || []).filter((item) => item.label && item.label !== "direct").slice(0, 5);
  streamerReferralBoard.innerHTML = referrals.length
    ? referrals
        .map(
          (referral, index) => `
            <article class="growth-list-card">
              <strong>#${index + 1} ${escapeHtml(referral.label)}</strong>
              <p>${Number(referral.count || 0).toLocaleString()} tracked campaign events from this referral code.</p>
              <button class="text-button" type="button" data-use-ref-code="${escapeHtml(referral.label)}">Use this code</button>
            </article>
          `
        )
        .join("")
    : `<div class="index-message">Referral codes will rank here after viewers open, copy, vote, or share campaign links.</div>`;
}

function renderConversionKit() {
  if (!streamerConversionKit || !activeStreamer) return;
  const byType = activeTraffic.byType || [];
  const metricFor = (type) => Number(byType.find((item) => item.label === type)?.count || 0);
  const views = metricFor("campaign_view");
  const votes = metricFor("campaign_vote");
  const copies = metricFor("campaign_link_copy") + metricFor("share_copy");
  const voteRate = views ? Math.round((votes / views) * 100) : 0;
  const nextPush =
    votes < 10
      ? "Ask viewers to vote live and pin the campaign link in chat."
      : copies < 5
        ? "Ask supporters to copy the invite link and repost it into their own communities."
        : "Use the sponsor note and leaderboard metrics to pitch a small weekly placement.";

  streamerConversionKit.innerHTML = [
    ["Vote conversion", `${voteRate}%`, `${votes.toLocaleString()} votes from ${views.toLocaleString()} campaign views.`],
    ["Share momentum", copies.toLocaleString(), "Copied campaign links and share-kit posts create the next traffic hop."],
    ["Recommended push", "Now", nextPush],
  ]
    .map(
      ([title, value, body]) => `
        <article class="growth-list-card">
          <strong>${escapeHtml(value)}</strong>
          <p><b>${escapeHtml(title)}</b> - ${escapeHtml(body)}</p>
        </article>
      `
    )
    .join("");
}

function renderShareKit() {
  if (!streamerShareKit || !activeStreamer) return;
  const fallbackTemplates = [
    {
      title: "Creator post",
      audience: activeStreamer.handle || "Creator audience",
      copy: `${activeStreamer.shareCopy} Voting is open for ${campaign.weekLabel || "this week"}.`,
    },
    {
      title: "Community post",
      audience: "GCX members",
      copy: `${activeStreamer.name} is in the GCX creator spotlight. Vote, share, and bring more fans into the games/cards community.`,
    },
    {
      title: "Sponsor note",
      audience: "Future partners",
      copy: `${activeStreamer.name}'s spotlight campaign routes voting traffic into GCX creator, game library, card, and marketplace pages.`,
    },
  ];
  streamerShareKit.innerHTML = (shareTemplates.length ? shareTemplates : fallbackTemplates)
    .map((template) => renderShareCard(template.title, template.audience, template.copy))
    .join("");
}

function renderStreamer(result) {
  activeStreamer = result.data;
  campaign = result.campaign || {};
  shareTemplates = result.shareTemplates || [];
  activeTraffic = result.traffic || {};
  const voted = new Set(readVotes());
  const hasVoted = voted.has(activeStreamer.id);

  document.title = `${activeStreamer.name} Streamer Campaign | GCXNerds`;
  streamerImage.src = activeStreamer.imageUrl;
  streamerImage.alt = `${activeStreamer.name} streamer campaign`;
  streamerRank.textContent = `#${activeStreamer.rank} - ${activeStreamer.spotlight || activeStreamer.tier || "Streamer Campaign"}`;
  streamerName.textContent = activeStreamer.name;
  streamerPitch.textContent = activeStreamer.pitch || activeStreamer.specialty || "";
  streamerPlatforms.innerHTML = (activeStreamer.platforms || []).map((platform) => `<span>${escapeHtml(platform)}</span>`).join("");
  streamerWeeklyVotes.textContent = Number(activeStreamer.weeklyVotes || 0).toLocaleString();
  streamerTotalVotes.textContent = Number(activeStreamer.votes || 0).toLocaleString();
  streamerStanding.textContent = `#${Number(activeStreamer.rank || 0).toLocaleString()}`;
  streamerChannel.href = activeStreamer.linkUrl || "streamers.html";
  streamerChannel.target = activeStreamer.linkUrl?.startsWith("http") ? "_blank" : "_self";
  streamerChannel.rel = "noreferrer";
  streamerSponsor.href = `sponsors.html?ref=${encodeURIComponent(activeStreamer.id)}`;
  if (streamerShareFeed) streamerShareFeed.href = shareToFeedPath();
  streamerVote.disabled = hasVoted;
  streamerVote.textContent = hasVoted ? "Vote counted" : `Vote for ${activeStreamer.name}`;
  if (streamerRefCode) streamerRefCode.value = referralCode();

  streamerTopTwo.innerHTML = (result.topTwo || [])
    .map(
      (streamer) => `
        <article class="growth-list-card">
          <strong>${escapeHtml(streamer.name)}</strong>
          <p>${Number(streamer.weeklyVotes || 0).toLocaleString()} weekly votes</p>
          <a class="feed-link" href="${escapeHtml(streamer.campaignUrl)}">Open campaign</a>
        </article>
      `
    )
    .join("");

  renderTrafficSummary();
  renderReferralBoard();
  renderConversionKit();
  syncInviteLink();
  recordTraffic("campaign_view");
}

async function loadStreamer() {
  try {
    const response = await fetch(`/api/community/streamers/${encodeURIComponent(selectedStreamerId())}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Streamer could not be loaded.");
    renderStreamer(result);
  } catch (error) {
    streamerName.textContent = "Streamer campaign could not be loaded.";
    streamerPitch.textContent = "Open the streamer highlights page and choose a creator campaign.";
    streamerVote.disabled = true;
  }
}

streamerVote?.addEventListener("click", async () => {
  if (!activeStreamer) return;
  const voted = new Set(readVotes());
  if (voted.has(activeStreamer.id)) return;

  streamerVote.disabled = true;
  streamerVote.textContent = "Voting...";

  try {
    const response = await fetch("/api/community/streamers/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamerId: activeStreamer.id }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Vote could not be saved.");
    voted.add(activeStreamer.id);
    writeVotes(Array.from(voted));
    activeStreamer = { ...activeStreamer, ...result.data };
    streamerWeeklyVotes.textContent = Number(activeStreamer.weeklyVotes || 0).toLocaleString();
    streamerTotalVotes.textContent = Number(activeStreamer.votes || 0).toLocaleString();
    streamerVote.textContent = "Vote counted";
    recordTraffic("campaign_vote");
  } catch (error) {
    streamerVote.disabled = false;
    streamerVote.textContent = `Vote for ${activeStreamer.name}`;
  }
});

streamerCopy?.addEventListener("click", async () => {
  if (!activeStreamer) return;
  try {
    await navigator.clipboard.writeText(campaignUrl());
    streamerCopy.textContent = "Copied";
    recordTraffic("campaign_link_copy");
  } catch (error) {
    streamerCopy.textContent = "Copy failed";
  }
});

streamerRefCode?.addEventListener("input", syncInviteLink);

streamerReferralBoard?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-use-ref-code]");
  if (!button || !streamerRefCode) return;
  streamerRefCode.value = button.dataset.useRefCode;
  syncInviteLink();
});

streamerCopyInvite?.addEventListener("click", async () => {
  if (!activeStreamer) return;
  try {
    await navigator.clipboard.writeText(campaignUrl());
    streamerCopyInvite.textContent = "Copied";
    recordTraffic("campaign_link_copy");
  } catch (error) {
    streamerCopyInvite.textContent = "Copy failed";
  }
});

streamerShareKit?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-share]");
  if (!button) return;

  try {
    await navigator.clipboard.writeText(button.dataset.copyShare);
    button.textContent = "Copied";
    recordTraffic("share_copy");
  } catch (error) {
    button.textContent = "Copy failed";
  }
});

loadStreamer();
