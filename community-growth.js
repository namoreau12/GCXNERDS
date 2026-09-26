const growthProfiles = document.querySelector("#growth-profiles");
const growthPosts = document.querySelector("#growth-posts");
const growthVotes = document.querySelector("#growth-votes");
const growthMetrics = document.querySelector("#growth-metrics");
const growthTopics = document.querySelector("#growth-topics");
const growthTrendingPosts = document.querySelector("#growth-trending-posts");
const growthGroups = document.querySelector("#growth-groups");
const growthEvents = document.querySelector("#growth-events");
const growthStreamerSlots = document.querySelector("#growth-streamer-slots");
const growthStreamers = document.querySelector("#growth-streamers");
const growthSpotlightHistory = document.querySelector("#growth-spotlight-history");
const growthTraffic = document.querySelector("#growth-traffic");
const growthReferrals = document.querySelector("#growth-referrals");
const growthSponsorLeads = document.querySelector("#growth-sponsor-leads");
const growthPromotions = document.querySelector("#growth-promotions");
const growthRevenue = document.querySelector("#growth-revenue");
const growthModeration = document.querySelector("#growth-moderation");
const growthActions = document.querySelector("#growth-actions");
const growthCampaignKit = document.querySelector("#growth-campaign-kit");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function renderMetric(label, value, detail) {
  return `
    <article class="growth-metric-card">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
      <p>${escapeHtml(detail)}</p>
    </article>
  `;
}

function trafficColumn(title, rows) {
  return `
    <article class="traffic-analytics-card">
      <strong>${escapeHtml(title)}</strong>
      ${(rows || [])
        .map(
          (row) => `
            <div>
              <span>${escapeHtml(row.label || row.type || row.ref || "unknown")}</span>
              <b>${number(row.count)}</b>
            </div>
          `
        )
        .join("")}
    </article>
  `;
}

function sponsorStatusLabel(status) {
  const labels = {
    new: "New",
    contacted: "Contacted",
    proposal: "Proposal",
    won: "Won",
    archived: "Archived",
  };
  return labels[String(status || "new")] || "New";
}

function promotionStatusLabel(status) {
  const labels = {
    active: "Active",
    paused: "Paused",
    archived: "Archived",
  };
  return labels[String(status || "active")] || "Active";
}

function renderSponsorLeadCard(lead) {
  const statuses = ["new", "contacted", "proposal", "won", "archived"];
  return `
    <article class="sponsor-lead-card" data-sponsor-lead-id="${escapeHtml(lead.id)}">
      <div class="sponsor-lead-head">
        <div>
          <strong>${escapeHtml(lead.company || "Sponsor lead")}</strong>
          <span>${escapeHtml(lead.name || "Unknown contact")} - ${escapeHtml(lead.email || "No email")}</span>
        </div>
        <b class="pipeline-status is-${escapeHtml(lead.status || "new")}">${escapeHtml(sponsorStatusLabel(lead.status))}</b>
      </div>
      <p>${escapeHtml(lead.goal || "No campaign goal recorded yet.")}</p>
      <div class="sponsor-lead-meta">
        <span>${escapeHtml(lead.packageInterest || "General sponsor interest")}</span>
        <span>${escapeHtml(lead.budgetRange || "Budget TBD")}</span>
        <span>${escapeHtml(lead.ref || "direct")}</span>
      </div>
      <div class="pipeline-actions" aria-label="Sponsor lead status">
        ${statuses
          .map(
            (status) => `
              <button class="text-button ${status === lead.status ? "is-active" : ""}" type="button" data-lead-status="${escapeHtml(status)}">
                ${escapeHtml(sponsorStatusLabel(status))}
              </button>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderPromotionCard(promotion) {
  const statuses = ["active", "paused", "archived"];
  const currentStatus = promotion.status || "active";
  return `
    <article class="promotion-control-card" data-promotion-id="${escapeHtml(promotion.id)}">
      <div class="sponsor-lead-head">
        <div>
          <strong>${escapeHtml(promotion.sponsorName || "Sponsor")}</strong>
          <span>${escapeHtml(promotion.title || "Promotion")}</span>
        </div>
        <b class="pipeline-status is-${escapeHtml(currentStatus)}">${escapeHtml(promotionStatusLabel(currentStatus))}</b>
      </div>
      <p>${escapeHtml(promotion.body || promotion.packageType || "Sponsored placement")}</p>
      <div class="sponsor-lead-meta">
        <span>${escapeHtml(promotion.placement || "community-feed")}</span>
        <span>${number(promotion.clicks || 0)} clicks</span>
        <span>Priority ${number(promotion.priority || 0)}</span>
      </div>
      <div class="pipeline-actions" aria-label="Promotion status">
        ${statuses
          .map(
            (status) => `
              <button class="text-button ${status === currentStatus ? "is-active" : ""}" type="button" data-promotion-status="${escapeHtml(status)}">
                ${escapeHtml(promotionStatusLabel(status))}
              </button>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderDashboard(data) {
  const totals = data.totals || {};
  const engagement = data.engagement || {};
  const moderation = data.moderation || {};
  const campaign = data.campaign || {};

  growthProfiles.textContent = number(totals.profiles);
  growthPosts.textContent = number(totals.posts);
  growthVotes.textContent = number(totals.weeklyStreamerVotes);

  growthMetrics.innerHTML = [
    renderMetric("Active profiles", number(totals.profiles), `${number(totals.follows)} follows across the current community graph.`),
    renderMetric("Published posts", number(totals.posts), `${number(totals.photoPosts)} include images, ${number(totals.comments)} published comments.`),
    renderMetric("Post reactions", number(totals.reactions), `${number(engagement.reactionsPerPost)} reactions per post across Like, Hype, Want, Trade, and Watch.`),
    renderMetric("Saved posts", number(totals.savedPosts), "Posts members marked for later, including collector ideas, replay picks, and streamer pushes."),
    renderMetric("Streamer votes", number(totals.weeklyStreamerVotes), `${number(totals.totalStreamerVotes)} total creator votes captured so far.`),
    renderMetric("Average likes", number(engagement.avgLikesPerPost), `${number(engagement.totalLikes)} total likes across published posts.`),
    renderMetric("Comments per post", number(engagement.commentsPerPost), "A quick read on whether posts are turning into conversation."),
    renderMetric("Photo post rate", `${number(engagement.photoPostPct)}%`, "Photos matter for cards, shelves, pickups, and marketplace trust."),
    renderMetric("Follow density", number(engagement.followDensity), "Average follows per active profile in this local build."),
    renderMetric("Friend links", number(totals.friends), `${number(totals.friendRequests)} pending requests, ${number(engagement.friendDensity)} average friends per profile.`),
    renderMetric("Message threads", number(totals.messageThreads), `${number(totals.messages)} direct messages in local inbox conversations.`),
    renderMetric("Upcoming events", number(totals.upcomingEvents), `${number(totals.eventRsvps)} RSVPs across scheduled community hooks.`),
    renderMetric("Activity items", number(totals.activity), "Public social actions that make GCX feel alive between posts and votes."),
    renderMetric("Traffic events", number(totals.trafficEvents), "Referral, campaign, share, and group traffic captured locally."),
    renderMetric("Sponsor leads", number(totals.sponsorLeads), "Open partnership inquiries attached to monetization paths."),
    renderMetric("Active promos", number(totals.activePromotions), "Sponsored placements currently eligible to appear in GCX surfaces."),
    renderMetric("Open moderation", number(totals.openModeration), "Items that need review before the community gets bigger."),
  ].join("");

  growthTopics.innerHTML = (data.topics || [])
    .map(
      (topic) => `
        <article class="growth-topic-card">
          <div>
            <strong>${escapeHtml(topic.label)}</strong>
            <span>${number(topic.postCount)} matching posts</span>
          </div>
          <p>${escapeHtml(topic.description)}</p>
          <a class="button secondary" href="${escapeHtml(topic.url || "community.html")}">Open topic path</a>
        </article>
      `
    )
    .join("");

  if (growthTrendingPosts) {
    growthTrendingPosts.innerHTML = (data.trendingPosts || [])
      .map(
        (post) => `
          <article class="growth-topic-card">
            <div>
              <strong>${escapeHtml(post.title)}</strong>
              <span>${number(post.trendingScore)} heat - ${number(post.comments)} comments - ${number(post.savedCount)} saves</span>
            </div>
            <p>${escapeHtml(post.body)}</p>
            <a class="button secondary" href="community-post.html?id=${encodeURIComponent(post.id)}">Open post</a>
          </article>
        `
      )
      .join("");
  }

  growthGroups.innerHTML = (data.groups || [])
    .map(
      (group) => `
        <article class="growth-topic-card">
          <div>
            <strong>${escapeHtml(group.name)}</strong>
            <span>${number(group.postCount)} posts - ${number(group.memberCount)} members</span>
          </div>
          <p>${escapeHtml(group.description)}</p>
          <a class="button secondary" href="${escapeHtml(group.url || "community-groups.html")}">Open group</a>
        </article>
      `
    )
    .join("");

  const events = data.events || {};
  growthEvents.innerHTML = [
    trafficColumn("Event types", events.byType),
    `
      <article class="traffic-analytics-card">
        <strong>Upcoming events</strong>
        ${(events.upcoming || [])
          .map(
            (event) => `
              <div>
                <span>${escapeHtml(event.title)}</span>
                <b>${number(event.rsvpCount)}</b>
              </div>
            `
          )
          .join("")}
      </article>
    `,
    `
      <article class="traffic-analytics-card">
        <strong>Calendar</strong>
        <div><span>Community events</span><b><a class="feed-link" href="community-events.html">Open</a></b></div>
      </article>
    `,
  ].join("");

  const streamerSlots = data.streamerSlots || {};
  const creatorSpotlight = (data.creatorSpotlight || streamerSlots.selected || [streamerSlots.popular, streamerSlots.rising, streamerSlots.third]).filter(Boolean).slice(0, 3);
  if (growthStreamerSlots) {
    growthStreamerSlots.innerHTML = creatorSpotlight
      .map(
        (streamer) => `
          <article class="traffic-analytics-card">
            <strong>${escapeHtml(streamer.slotLabel || streamer.spotlight || streamer.tier)}</strong>
            <div><span>${escapeHtml(streamer.name)}</span><b>${number(streamer.weeklyVotes || streamer.votes)} votes</b></div>
            <div><span>${escapeHtml(streamer.slotKey || "slot")}</span><b><a class="feed-link" href="${escapeHtml(streamer.campaignUrl)}">Campaign</a></b></div>
          </article>
        `
      )
      .join("");
  }

  growthStreamers.innerHTML = (data.streamerLeaderboard || [])
    .map(
      (streamer) => `
        <article class="leaderboard-row">
          <span class="leaderboard-rank">#${number(streamer.rank)}</span>
          <div>
            <strong>${escapeHtml(streamer.name)}</strong>
            <span>${escapeHtml(streamer.handle)} - ${escapeHtml(streamer.spotlight || streamer.tier || "Streamer")}</span>
          </div>
          <div class="leaderboard-votes">
            <strong>${number(streamer.weeklyVotes)}</strong>
            <span>weekly votes</span>
          </div>
          <a class="button secondary" href="${escapeHtml(streamer.campaignUrl)}">Campaign</a>
        </article>
      `
    )
    .join("");

  if (growthSpotlightHistory) {
    growthSpotlightHistory.innerHTML = (data.spotlightHistory || [])
      .slice(0, 3)
      .map(
        (week) => `
          <article class="traffic-analytics-card">
            <strong>${escapeHtml(week.weekLabel)}</strong>
            <div><span>Popular winner</span><b>${escapeHtml(week.popularWinner?.name || "TBD")}</b></div>
            <div><span>Rising winner</span><b>${escapeHtml(week.risingWinner?.name || "TBD")}</b></div>
          </article>
        `
      )
      .join("");
  }

  const traffic = data.traffic || {};
  growthTraffic.innerHTML = [
    trafficColumn("Event types", traffic.byType),
    trafficColumn("Referral codes", traffic.byRef),
    trafficColumn("Top targets", traffic.byTarget),
    `
      <article class="traffic-analytics-card">
        <strong>Latest activity</strong>
        ${(traffic.latest || [])
          .map(
            (event) => `
              <div>
                <span>${escapeHtml(event.type)} - ${escapeHtml(event.targetId || event.path)}</span>
                <b>${escapeHtml(event.ref || "direct")}</b>
              </div>
            `
          )
          .join("")}
      </article>
    `,
  ].join("");

  growthReferrals.innerHTML = (data.referralLeaderboard || [])
    .map(
      (referral) => `
        <article class="leaderboard-row">
          <span class="leaderboard-rank">#${number(referral.rank)}</span>
          <div>
            <strong>${escapeHtml(referral.label)}</strong>
            <span>${escapeHtml(referral.ref)} - ${escapeHtml(referral.source || "Referral")}</span>
          </div>
          <div class="leaderboard-votes">
            <strong>${number(referral.totalEvents)}</strong>
            <span>${number(referral.votes)} votes, ${number(referral.copiedLinks)} copies</span>
          </div>
          <a class="button secondary" href="${escapeHtml(referral.campaignUrl || "streamers.html")}">Open path</a>
        </article>
      `
    )
    .join("");

  const sponsorLeads = data.sponsorLeads || {};
  growthSponsorLeads.innerHTML = [
    trafficColumn("Package interest", sponsorLeads.byPackage),
    trafficColumn("Pipeline status", sponsorLeads.byStatus),
    `
      <article class="traffic-analytics-card sponsor-lead-list">
        <strong>Latest leads</strong>
        ${(sponsorLeads.latest || [])
          .map(renderSponsorLeadCard)
          .join("")}
      </article>
    `,
    `
      <article class="traffic-analytics-card">
        <strong>Pipeline status</strong>
        <div><span>Open leads</span><b>${number(sponsorLeads.total)}</b></div>
        <div><span>Intake page</span><b><a class="feed-link" href="sponsors.html">Open</a></b></div>
      </article>
    `,
  ].join("");

  const promotions = data.promotions || {};
  growthPromotions.innerHTML = [
    trafficColumn("Placement mix", promotions.byPlacement),
    trafficColumn("Placement status", promotions.byStatus),
    `
      <article class="traffic-analytics-card sponsor-lead-list">
        <strong>Active placements</strong>
        ${(promotions.latest || [])
          .map(renderPromotionCard)
          .join("")}
      </article>
    `,
    `
      <article class="traffic-analytics-card">
        <strong>Inventory status</strong>
        <div><span>Active promotions</span><b>${number(promotions.active)}</b></div>
        <div><span>Feed placement</span><b><a class="feed-link" href="community.html">Open</a></b></div>
      </article>
    `,
  ].join("");

  growthCampaignKit.innerHTML = (data.campaignKit || [])
    .map((item) => {
      const campaignUrl = new URL(item.url || "community.html", window.location.href).toString();
      const copy = `${item.copy} ${campaignUrl}`.trim();
      return `
        <article class="campaign-kit-card">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.audience)}</span>
          </div>
          <p>${escapeHtml(item.copy)}</p>
          <div class="streamer-actions">
            <a class="button secondary" href="${escapeHtml(item.url)}">Open path</a>
            <button class="button" type="button" data-copy-campaign-text="${escapeHtml(copy)}">Copy post</button>
          </div>
        </article>
      `;
    })
    .join("");

  const revenueIdeas = campaign.revenueIdeas || [];
  const sponsorPackages = data.sponsorPackages || {};
  const streamerPackages = sponsorPackages.streamerPackages || [];
  growthRevenue.innerHTML = `
    <article class="growth-list-card">
      <strong>${escapeHtml(campaign.sponsorPackage || "Sponsor package not configured yet.")}</strong>
      <p>${escapeHtml(campaign.weekLabel || "Current week")} creator spotlight package.</p>
    </article>
    ${streamerPackages
      .map(
        (item) => `
          <article class="growth-list-card">
            <strong>${escapeHtml(item.packageName)} - ${escapeHtml(item.creatorName)}</strong>
            <p>${number(item.weeklyVotes)} weekly votes, ${number(item.trafficEvents)} tracked events, suggested ${escapeHtml(item.suggestedBudget)}.</p>
            <a class="feed-link" href="${escapeHtml(item.sponsorUrl)}">Sponsor package</a>
          </article>
        `
      )
      .join("")}
    ${revenueIdeas.map((idea) => `<article class="growth-list-card"><p>${escapeHtml(idea)}</p></article>`).join("")}
  `;

  growthModeration.innerHTML = [
    ["Reported posts", moderation.posts],
    ["Reported comments", moderation.comments],
    ["Pending nominations", moderation.nominations],
  ]
    .map(
      ([label, value]) => `
        <article class="growth-list-card">
          <strong>${number(value)}</strong>
          <p>${escapeHtml(label)}</p>
        </article>
      `
    )
    .join("");

  growthActions.innerHTML = (data.nextActions || [])
    .map(
      (action) => `
        <article class="growth-list-card">
          <strong>${escapeHtml(action.title)}</strong>
          <p>${escapeHtml(action.body)}</p>
          <a class="feed-link" href="${escapeHtml(action.url)}">Open</a>
        </article>
      `
    )
    .join("");
}

growthCampaignKit?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-campaign-text]");
  if (!button) return;

  try {
    await navigator.clipboard.writeText(button.dataset.copyCampaignText);
    button.textContent = "Copied";
  } catch (error) {
    button.textContent = "Copy failed";
  }
});

growthSponsorLeads?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-lead-status]");
  if (!button) return;

  const card = button.closest("[data-sponsor-lead-id]");
  const leadId = card?.dataset.sponsorLeadId;
  const status = button.dataset.leadStatus;
  if (!leadId || !status) return;

  button.textContent = "Saving";
  button.disabled = true;
  try {
    const response = await fetch(`/api/community/sponsor-leads/${encodeURIComponent(leadId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error(`Lead update returned ${response.status}`);
    await loadGrowthDashboard();
  } catch (error) {
    button.textContent = "Retry";
    button.disabled = false;
  }
});

growthPromotions?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-promotion-status]");
  if (!button) return;

  const card = button.closest("[data-promotion-id]");
  const promotionId = card?.dataset.promotionId;
  const status = button.dataset.promotionStatus;
  if (!promotionId || !status) return;

  button.textContent = "Saving";
  button.disabled = true;
  try {
    const response = await fetch(`/api/community/promotions/${encodeURIComponent(promotionId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error(`Promotion update returned ${response.status}`);
    await loadGrowthDashboard();
  } catch (error) {
    button.textContent = "Retry";
    button.disabled = false;
  }
});

async function loadGrowthDashboard() {
  try {
    const response = await fetch("/api/community/growth");
    if (!response.ok) throw new Error(`Growth API returned ${response.status}`);
    const result = await response.json();
    renderDashboard(result.data || {});
  } catch (error) {
    growthMetrics.innerHTML = `<div class="index-message">Growth dashboard could not be loaded. Make sure the local server is running.</div>`;
  }
}

loadGrowthDashboard();
