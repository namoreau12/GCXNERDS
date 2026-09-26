const searchInput = document.querySelector("#site-search");
const storyGrid = document.querySelector("#story-grid");
const homeLeadStory = document.querySelector("#home-lead-story");
let storyCards = Array.from(document.querySelectorAll(".story-card"));
const chips = Array.from(document.querySelectorAll("[data-category-filter]"));
const trendList = document.querySelector(".trend-list");
const homeStreamerGrid = document.querySelector("#home-streamer-grid");
const homeCommunityPulse = document.querySelector("#home-community-pulse");
const streamerVoteStorageKey = "gcx-streamer-votes-v1";

let activeCategory = "all";
let activeQuery = "";
let homeStreamers = [];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripMarkdownTablesForPreview(value) {
  let text = String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/\r\n?/g, "\n");

  if (!text.includes("|")) return text;

  if (!text.includes("\n") && /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(text)) {
    const firstPipe = text.indexOf("|");
    return firstPipe > 0 ? text.slice(0, firstPipe) : "";
  }

  const lines = text.split("\n");
  const output = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] || "";
    const isTableHeader = line.includes("|") && /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(nextLine);
    const isTableLine = line.trim().startsWith("|");
    if (isTableHeader || isTableLine) continue;
    output.push(line);
  }

  return output.join(" ");
}

function cleanPreviewText(value, maxLength = 260) {
  return stripMarkdownTablesForPreview(articleBlockText(value))
    .replace(/^\s*\|.+\|\s*$/gm, " ")
    .replace(/\|?\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*(?:\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*)+\|?/g, " ")
    .replace(/\|/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "")
    .replace(/\*\*/g, "")
    .replace(/[#_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isStructuredTableBlock(block) {
  return Boolean(block && typeof block === "object" && block.type === "table" && Array.isArray(block.headers) && Array.isArray(block.rows));
}

function articleBlockText(block) {
  if (isStructuredTableBlock(block)) {
    return [
      block.caption,
      ...(block.headers || []),
      ...(block.rows || []).flat(),
    ]
      .filter(Boolean)
      .join(" ");
  }
  return String(block || "");
}

function storyPreviewText(story, maxLength = 260) {
  const candidates = [story?.excerpt, ...(story?.body || [])].filter(Boolean);
  for (const candidate of candidates) {
    const cleaned = cleanPreviewText(candidate, maxLength);
    if (cleaned) return cleaned;
  }
  return "Open the full GCX story for confirmed details, context, and source links.";
}

function applyFilters() {
  const query = normalize(activeQuery);
  storyCards = Array.from(document.querySelectorAll(".story-card"));
  const resultsStatus = document.querySelector("#home-search-results");
  let visibleCount = 0;

  storyCards.forEach((card) => {
    const category = card.dataset.category;
    const searchableText = normalize(card.dataset.search || card.dataset.title || card.textContent);
    const categoryMatch = activeCategory === "all" || category === activeCategory;
    const queryMatch = !query || searchableText.includes(query);
    const isVisible = categoryMatch && queryMatch;

    card.classList.toggle("is-hidden", !isVisible);
    if (isVisible) visibleCount += 1;
  });

  if (resultsStatus) {
    resultsStatus.hidden = !query && activeCategory === "all";
    resultsStatus.textContent = visibleCount
      ? `${visibleCount} ${visibleCount === 1 ? "story" : "stories"} matched${query ? ` "${activeQuery}"` : ""}.`
      : `No stories matched${query ? ` "${activeQuery}"` : " this filter"}.`;
  }
}

function updateSearchUrl() {
  const url = new URL(window.location.href);
  if (activeQuery.trim()) {
    url.searchParams.set("q", activeQuery.trim());
    url.hash = "news";
  } else {
    url.searchParams.delete("q");
    if (url.hash === "#news") url.hash = "";
  }
  window.history.replaceState({}, "", url);
}

function routeToSearchResults() {
  const query = searchInput?.value.trim() || activeQuery.trim();
  if (!query) return;
  window.location.href = `search.html?q=${encodeURIComponent(query)}`;
}

function homeStoryCategory(story) {
  const category = normalize(story.category || story.type || "news");
  if (category.includes("card")) return "cards";
  if (category.includes("stream")) return "watch";
  if (category.includes("community") || category.includes("social")) return "news";
  if (category.includes("nintendo") || category.includes("gaming")) return "news";
  return category || "news";
}

function normalizeFocalValue(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return `${Math.max(0, Math.min(100, value))}%`;
  const text = String(value || "").trim();
  if (/^\d+(\.\d+)?%$/.test(text)) return text;
  if (/^0?(\.\d+)$/.test(text)) return `${Math.round(Number(text) * 100)}%`;
  return fallback;
}

function storyHeroImageUrl(story) {
  return story?.heroImage || story?.imageUrl || "";
}

function storyHeroImageAlt(story, fallback = "") {
  return story?.heroImageAlt || story?.imageAlt || fallback || story?.title || "";
}

function storyHeroMediaType(story) {
  return normalize(story?.mediaType || story?.leadMediaType || story?.imageType || "screenshot") || "screenshot";
}

function isGamingStory(story) {
  return normalize(story?.category || story?.type).includes("gaming");
}

function storyHasOfficialMedia(story) {
  const imageUrl = storyHeroImageUrl(story);
  const mediaType = storyHeroMediaType(story);
  const credit = normalize(story?.heroImageCredit || story?.imageCredit);
  const source = normalize(story?.heroImageSource || story?.sourceName);
  const sourceUrl = normalize(story?.heroImageSourceUrl || story?.imageSourceUrl || "");
  if (!imageUrl) return false;
  if (/\.svg(?:\?|$)/i.test(imageUrl)) return false;
  if (["graphic", "chart", "diagram", "infographic"].includes(mediaType)) return false;
  if (/\b(fallback|pending|required|review)\b/.test(`${credit} ${source} ${sourceUrl}`)) return false;
  return /official|publisher|developer|press|square enix|capcom|xbox|playstation|nintendo|fromsoftware|cd projekt|rockstar/.test(
    `${credit} ${source} ${sourceUrl}`
  );
}

function shouldShowOfficialMediaWarning(story) {
  return isGamingStory(story) && !storyHasOfficialMedia(story) && ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
}

function renderOfficialMediaWarning(story) {
  return shouldShowOfficialMediaWarning(story) ? `<span class="official-media-warning">OFFICIAL MEDIA REQUIRED</span>` : "";
}

function applyImageCardFocalPoint(card, story) {
  if (!card || !story) return;
  const focal = story.heroImageFocalPoint || story.imageFocalPoint || story.focalPoint || story.focal || {};
  const hasExplicitFocal =
    Boolean(story.heroImageFocalPoint || story.imageFocalPoint || story.focalPoint || story.focal) ||
    story.heroImageFocalX != null ||
    story.heroImageFocalY != null ||
    story.imageFocalX != null ||
    story.imageFocalY != null;
  if (!hasExplicitFocal) {
    card.style.removeProperty("--image-card-focal-x");
    card.style.removeProperty("--image-card-focal-y");
    return;
  }
  const x = normalizeFocalValue(focal.x ?? story.heroImageFocalX ?? story.imageFocalX, "50%");
  const y = normalizeFocalValue(focal.y ?? story.heroImageFocalY ?? story.imageFocalY, "42%");
  card.style.setProperty("--image-card-focal-x", x);
  card.style.setProperty("--image-card-focal-y", y);
}

function storyLeadMediaType(story) {
  const explicitType = normalize(story?.mediaType || story?.leadMediaType || story?.imageType);
  if (["graphic", "chart", "diagram", "infographic"].some((term) => explicitType.includes(term))) return "graphic";
  const imageUrl = normalize(storyHeroImageUrl(story));
  const imageCredit = normalize(story?.heroImageCredit || story?.imageCredit);
  const title = normalize(story?.title);
  if (imageUrl.endsWith(".svg")) return "graphic";
  if (/(chart|diagram|infographic|tracker|price|pricing)/i.test(`${imageUrl} ${imageCredit} ${title}`)) return "graphic";
  return storyHeroMediaType(story);
}

function homeLeadCandidateScore(story) {
  const imageUrl = storyHeroImageUrl(story);
  if (!imageUrl || !story?.title || !story?.articleUrl) return -1;
  if (storyLeadMediaType(story) === "graphic") return -1;
  if (isGamingStory(story) && !storyHasOfficialMedia(story)) return -1;
  let score = 0;
  const mediaType = storyLeadMediaType(story);
  if (mediaType !== "graphic") score += 100;
  if (storyHasOfficialMedia(story)) score += 40;
  if (/^https?:\/\//i.test(imageUrl)) score += 12;
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(imageUrl)) score += 8;
  if (/\.svg(\?|$)/i.test(imageUrl)) score -= 60;
  if (normalize(story.category || story.type).includes("review")) score += 3;
  return score;
}

function storyImageProminenceScore(story) {
  let score = 0;
  if (storyHasOfficialMedia(story)) score += 100;
  if (storyLeadMediaType(story) === "graphic") score -= 50;
  if (isGamingStory(story) && !storyHasOfficialMedia(story)) score -= 80;
  if (/^https?:\/\//i.test(storyHeroImageUrl(story))) score += 10;
  return score;
}

function homeLeadDisplayTitle(story) {
  return story?.homeTitle || story?.seoTitle || story?.title || "";
}

function deriveTrendingTopics(stories = []) {
  const topics = [
    { label: "Pokemon 30th", filter: "Pokemon 30th", terms: ["pokemon 30th", "30th celebration", "pikachu", "classic collection"] },
    { label: "Pokemon cards", filter: "Pokemon", terms: ["pokemon", "tcg", "card-news", "cards"] },
    { label: "GTA VI", filter: "GTA", terms: ["gta vi", "gta 6", "grand theft auto", "rockstar"] },
    { label: "Switch 2", filter: "Switch 2", terms: ["switch 2", "nintendo switch 2"] },
    { label: "Gamescom", filter: "Gamescom", terms: ["gamescom"] },
    { label: "PlayStation", filter: "PlayStation", terms: ["playstation", "ps5", "ps6", "sony"] },
    { label: "Xbox", filter: "Xbox", terms: ["xbox", "game pass", "microsoft"] },
    { label: "Price trackers", filter: "MSRP", terms: ["msrp", "preorder", "price tracker", "market"] },
    { label: "Magic cards", filter: "Magic", terms: ["magic", "mtg", "scryfall"] },
    { label: "Yu-Gi-Oh!", filter: "Yu-Gi-Oh", terms: ["yu-gi-oh", "yugioh"] },
    { label: "Streaming", filter: "Streaming", terms: ["streaming", "streamer", "watch"] },
  ];

  const scores = new Map(topics.map((topic) => [topic.label, { ...topic, score: 0 }]));

  stories.forEach((story, index) => {
    const title = normalize(story.title);
    const excerpt = normalize(story.excerpt);
    const source = normalize(story.sourceName);
    const category = normalize(story.category || story.type);
    const searchable = [title, excerpt, source, category].join(" ");
    const recencyBoost = Math.max(0, 5 - index) * 0.25;

    topics.forEach((topic) => {
      const matchedTerm = topic.terms.find((term) => searchable.includes(normalize(term)));
      if (!matchedTerm) return;
      const current = scores.get(topic.label);
      const titleBoost = topic.terms.some((term) => title.includes(normalize(term))) ? 2 : 0;
      current.score += 1 + titleBoost + recencyBoost;
    });
  });

  return [...scores.values()]
    .filter((topic) => topic.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .concat(topics.filter((topic) => !scores.get(topic.label)?.score))
    .filter((topic, index, list) => list.findIndex((item) => item.filter === topic.filter) === index)
    .slice(0, 5);
}

function renderTrendingTopics(stories = []) {
  if (!trendList) return;
  const topics = deriveTrendingTopics(stories);
  trendList.innerHTML = topics
    .map(
      (topic, index) => `
        <li>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <button type="button" data-filter="${escapeHtml(topic.filter)}">${escapeHtml(topic.label)}</button>
        </li>
      `
    )
    .join("");
}

function renderHomeLead(stories = []) {
  if (!homeLeadStory) return;
  const lead = stories
    .filter((story) => homeLeadCandidateScore(story) >= 0)
    .sort((a, b) => homeLeadCandidateScore(b) - homeLeadCandidateScore(a))[0];
  if (!lead) return;

  const image = homeLeadStory.querySelector("img");
  const kicker = homeLeadStory.querySelector(".kicker");
  const title = homeLeadStory.querySelector("h1");
  const excerpt = homeLeadStory.querySelector(".hero-copy p:not(.kicker)");
  const link = homeLeadStory.querySelector(".button");

  const displayTitle = homeLeadDisplayTitle(lead);
  homeLeadStory.dataset.title = displayTitle;
  homeLeadStory.dataset.category = homeStoryCategory(lead);
  homeLeadStory.dataset.mediaType = storyLeadMediaType(lead);
  applyImageCardFocalPoint(homeLeadStory, lead);
  if (image) {
    image.src = storyHeroImageUrl(lead);
    image.alt = storyHeroImageAlt(lead, `${displayTitle} lead story artwork`);
    image.dataset.mediaType = storyLeadMediaType(lead);
  }
  if (kicker) kicker.textContent = "Today's Lead";
  if (title) title.textContent = displayTitle;
  if (excerpt) excerpt.textContent = storyPreviewText(lead, 150);
  if (link) {
    link.href = lead.articleUrl;
    link.textContent = "Read the lead";
  }
}

function renderHomeNews(stories = []) {
  if (!storyGrid) return;
  const externalStories = stories
    .filter((story) => !["streamer", "social"].includes(normalize(story.type)))
    .sort((a, b) => storyImageProminenceScore(b) - storyImageProminenceScore(a));
  const gcxStories = stories.filter((story) => ["streamer", "social"].includes(normalize(story.type)));
  const balancedStories = [...externalStories.slice(0, 6), ...gcxStories.slice(0, 2)].slice(0, 6);

  storyGrid.innerHTML = balancedStories
    .map(
      (story) => `
        <article class="story-card" data-category="${escapeHtml(homeStoryCategory(story))}" data-title="${escapeHtml(story.title)}" data-search="${escapeHtml([story.title, story.excerpt, story.category, story.sourceName, story.type].filter(Boolean).join(" "))}">
          <a class="story-card-image" href="${escapeHtml(story.articleUrl)}" data-media-type="${escapeHtml(storyLeadMediaType(story))}" style="--image-card-focal-x: ${escapeHtml(normalizeFocalValue(story.heroImageFocalX ?? story.imageFocalX, "50%"))}; --image-card-focal-y: ${escapeHtml(normalizeFocalValue(story.heroImageFocalY ?? story.imageFocalY, "42%"))};">
            <img src="${escapeHtml(storyHeroImageUrl(story))}" alt="${escapeHtml(storyHeroImageAlt(story, story.title))}" data-media-type="${escapeHtml(storyLeadMediaType(story))}" loading="lazy" decoding="async" width="640" height="360" />
            ${renderOfficialMediaWarning(story)}
          </a>
          <div>
            <p class="meta">${escapeHtml(story.category || "News")} - ${escapeHtml(story.sourceName || "GCX")}</p>
            <h3><a href="${escapeHtml(story.articleUrl)}">${escapeHtml(story.title)}</a></h3>
            <p>${escapeHtml(storyPreviewText(story, 172))}</p>
            ${
              (story.sourceLinks || []).length
                ? `<p class="story-source-note">${Number(story.sourceLinks.length).toLocaleString()} sources used</p>`
                : ""
            }
          </div>
        </article>
      `
    )
    .join("");
  applyFilters();
}

async function loadHomeNews() {
  if (!storyGrid) return;
  try {
    const response = await fetch("/api/news?limit=20", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "News could not be loaded.");
    renderHomeLead(result.data || []);
    renderHomeNews(result.data || []);
    renderTrendingTopics(result.data || []);
    if (activeQuery) {
      document.querySelector("#news")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    storyGrid.innerHTML = `<div class="index-message">Top stories could not be loaded. Make sure the local server is running.</div>`;
  }
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeCategory = chip.dataset.categoryFilter;
    chips.forEach((item) => item.classList.toggle("is-active", item === chip));
    applyFilters();
  });
});

trendList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeQuery = button.dataset.filter;
  if (searchInput) searchInput.value = activeQuery;
  applyFilters();
  updateSearchUrl();
  document.querySelector("#news")?.scrollIntoView({ behavior: "smooth" });
});

searchInput?.addEventListener("input", (event) => {
  activeQuery = event.target.value;
  applyFilters();
});

searchInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  activeQuery = searchInput.value.trim();
  applyFilters();
  routeToSearchResults();
});

searchInput?.closest("form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  activeQuery = searchInput.value.trim();
  applyFilters();
  routeToSearchResults();
});

{
  const queryParam = new URLSearchParams(window.location.search).get("q");
  if (queryParam) {
    activeQuery = queryParam;
    if (searchInput) searchInput.value = activeQuery;
  }
}

function readStreamerVotes() {
  try {
    return new Set(JSON.parse(localStorage.getItem(streamerVoteStorageKey) || "[]"));
  } catch (error) {
    return new Set();
  }
}

function writeStreamerVotes(votes) {
  try {
    localStorage.setItem(streamerVoteStorageKey, JSON.stringify(Array.from(votes)));
  } catch (error) {
    // Server-side vote recording still works if browser storage is unavailable.
  }
}

function streamerCampaignUrl(streamer) {
  const url = new URL(streamer.campaignUrl || `streamer.html?id=${streamer.id}`, window.location.href);
  if (!url.searchParams.get("ref")) url.searchParams.set("ref", `home-${streamer.id}`);
  return url;
}

function streamerShareToFeedUrl(streamer) {
  const url = new URL("community.html", window.location.href);
  url.searchParams.set("shareUrl", streamerCampaignUrl(streamer).toString());
  url.searchParams.set("title", `Vote for ${streamer.name}`);
  url.searchParams.set("body", `${streamer.name} is in the GCX creator spotlight. Vote, share, and help bring more fans into games, cards, and collecting conversations.`);
  url.searchParams.set("category", "Streaming");
  return `${url.pathname.replace(/^\//, "")}${url.search}`;
}

function recordHomeStreamerTraffic(streamer, type, campaignUrl) {
  fetch("/api/community/traffic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      source: "homepage_creator_spotlight",
      targetType: "streamer",
      targetId: streamer.id,
      ref: `home-${streamer.id}`,
      path: `${window.location.pathname}${window.location.search}`,
      campaignUrl,
    }),
  }).catch(() => {
    // Tracking is best-effort and should never block homepage interactions.
  });
}

function renderHomeCommunityPulse(discovery = {}) {
  if (!homeCommunityPulse) return;
  const trendingPosts = (discovery.trendingPosts || []).slice(0, 3);
  const trafficHooks = (discovery.trafficHooks || []).slice(0, 4);

  homeCommunityPulse.innerHTML = `
    <div class="home-pulse-column">
      <div class="section-heading">
        <p class="kicker">Community Pulse</p>
        <h2>What people are sharing</h2>
      </div>
      <div class="home-pulse-list">
        ${
          trendingPosts.length
            ? trendingPosts
                .map(
                  (post) => `
                    <a class="home-pulse-card" href="community-post.html?id=${encodeURIComponent(post.id)}">
                      <span>${escapeHtml(post.category || "Community")} - ${Number(post.trendingScore || 0).toLocaleString()} heat</span>
                      <strong>${escapeHtml(post.title)}</strong>
                      <p>${escapeHtml(post.body || "")}</p>
                    </a>
                  `
                )
                .join("")
            : `<div class="index-message">Trending posts will appear as the community reacts and reposts.</div>`
        }
      </div>
    </div>
    <div class="home-pulse-column">
      <div class="section-heading">
        <p class="kicker">Traffic Hooks</p>
        <h2>Keep readers moving</h2>
      </div>
      <div class="home-pulse-hooks">
        ${
          trafficHooks.length
            ? trafficHooks
                .map(
                  (hook) => `
                    <a class="traffic-hook" href="${escapeHtml(hook.url || "community.html")}">
                      <strong>${escapeHtml(hook.label === "Open marketplace beta" ? "Join the collector waitlist" : hook.label)}</strong>
                      <span>${escapeHtml(hook.metric || "Open path")}</span>
                    </a>
                  `
                )
                .join("")
            : `<div class="index-message">Traffic hooks will appear after discovery loads.</div>`
        }
      </div>
    </div>
  `;
}

function renderHomeStreamers(campaign = {}) {
  if (!homeStreamerGrid) return;
  const voted = readStreamerVotes();
  const featured = homeStreamers.slice(0, 3);

  if (!featured.length) {
    homeStreamerGrid.innerHTML = `<div class="index-message">Streamer voting could not be loaded.</div>`;
    return;
  }

  homeStreamerGrid.innerHTML = featured
    .map((streamer, index) => {
      const campaignUrl = streamerCampaignUrl(streamer).toString();
      const campaignPath = `${new URL(campaignUrl).pathname.replace(/^\//, "")}${new URL(campaignUrl).search}`;
      const slot = streamer.slotLabel || streamer.spotlight || `Creator Spotlight ${index + 1}`;
      const hasVoted = voted.has(streamer.id);
      return `
        <article class="home-streamer-card">
          <img src="${escapeHtml(streamer.imageUrl)}" alt="${escapeHtml(streamer.name)} streamer spotlight" loading="lazy" />
          <div>
            <p class="meta">${escapeHtml(slot)}</p>
            <h3>${escapeHtml(streamer.name)}</h3>
            <p>${escapeHtml(streamer.pitch || streamer.specialty || "")}</p>
            <div class="home-streamer-stats">
              <span>${Number(streamer.weeklyVotes || 0).toLocaleString()} weekly votes</span>
              <span>${escapeHtml(streamer.tier || "Creator")}</span>
            </div>
            <div class="streamer-actions">
              <button class="button" type="button" data-home-streamer-vote="${escapeHtml(streamer.id)}" ${hasVoted ? "disabled" : ""}>
                ${hasVoted ? "Vote counted" : "Vote"}
              </button>
              <button class="button secondary" type="button" data-home-streamer-copy="${escapeHtml(streamer.id)}" data-campaign-url="${escapeHtml(campaignUrl)}">Copy invite</button>
              <a class="button secondary" href="${escapeHtml(streamerShareToFeedUrl(streamer))}" data-home-streamer-share="${escapeHtml(streamer.id)}">Share to feed</a>
              <a class="button secondary" href="${escapeHtml(campaignPath)}">Campaign</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadHomeStreamers() {
  if (!homeStreamerGrid) return;
  try {
    const response = await fetch("/api/community/streamers");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Streamer voting could not be loaded.");
    homeStreamers = (result.creatorSpotlight || result.data || [])
      .sort((a, b) => Number(a.spotlightOrder || 99) - Number(b.spotlightOrder || 99) || Number(b.weeklyVotes || b.votes || 0) - Number(a.weeklyVotes || a.votes || 0))
      .slice(0, 3);
    renderHomeStreamers(result.campaign || {});
  } catch (error) {
    homeStreamerGrid.innerHTML = `<div class="index-message">Streamer voting could not be loaded.</div>`;
  }
}

async function loadHomeCommunityPulse() {
  if (!homeCommunityPulse) return;
  try {
    const response = await fetch("/api/community/discovery?viewerId=profile-gcx-member");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Community pulse could not be loaded.");
    renderHomeCommunityPulse(result.data || {});
  } catch (error) {
    homeCommunityPulse.innerHTML = `<div class="index-message">Community pulse could not be loaded.</div>`;
  }
}

homeStreamerGrid?.addEventListener("click", async (event) => {
  const voteButton = event.target.closest("[data-home-streamer-vote]");
  const copyButton = event.target.closest("[data-home-streamer-copy]");
  const shareLink = event.target.closest("[data-home-streamer-share]");

  if (shareLink) {
    const streamer = homeStreamers.find((item) => item.id === shareLink.dataset.homeStreamerShare);
    if (streamer) recordHomeStreamerTraffic(streamer, "campaign_share_feed", streamerCampaignUrl(streamer).toString());
    return;
  }

  if (copyButton) {
    const streamer = homeStreamers.find((item) => item.id === copyButton.dataset.homeStreamerCopy);
    if (!streamer) return;
    try {
      await navigator.clipboard.writeText(copyButton.dataset.campaignUrl);
      copyButton.textContent = "Copied";
      recordHomeStreamerTraffic(streamer, "share_copy", copyButton.dataset.campaignUrl);
    } catch (error) {
      copyButton.textContent = "Copy failed";
    }
    return;
  }

  if (!voteButton) return;
  const streamerId = voteButton.dataset.homeStreamerVote;
  const streamer = homeStreamers.find((item) => item.id === streamerId);
  const voted = readStreamerVotes();
  if (!streamer || voted.has(streamerId)) return;

  voteButton.disabled = true;
  voteButton.textContent = "Voting...";
  try {
    const response = await fetch("/api/community/streamers/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamerId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Vote could not be saved.");
    homeStreamers = homeStreamers.map((item) => (item.id === streamerId ? result.data : item));
    voted.add(streamerId);
    writeStreamerVotes(voted);
    recordHomeStreamerTraffic(result.data, "campaign_vote", streamerCampaignUrl(result.data).toString());
    renderHomeStreamers();
  } catch (error) {
    voteButton.disabled = false;
    voteButton.textContent = "Vote";
  }
});

loadHomeStreamers();
loadHomeCommunityPulse();
loadHomeNews();

const pokemonApiBase =
  window.location.protocol === "file:" ? "https://api.pokemontcg.io/v2" : "/api/pokemon";
const cardIndexSearch = document.querySelector("#card-index-search");
const pokemonSetModeButtons = Array.from(document.querySelectorAll("[data-pokemon-set-mode]"));
const seriesList = document.querySelector("#series-list");
const setsGrid = document.querySelector("#sets-grid");
const cardsGrid = document.querySelector("#cards-grid");
const cardDetail = document.querySelector("#card-detail");
const pokemonCardSearch = document.querySelector("#pokemon-card-search");
const pokemonCardSearchButton = document.querySelector("#pokemon-card-search-button");
const pokemonCardSearchResults = document.querySelector("#pokemon-card-search-results");
const selectedSet = document.querySelector("#selected-set");
const selectedSeriesTitle = document.querySelector("#selected-series-title");
const pokemonSetModeNote = document.querySelector("#pokemon-set-mode-note");
const seriesCount = document.querySelector("#series-count");
const setsCount = document.querySelector("#sets-count");
const hasPokemonIndex = Boolean(
  cardIndexSearch &&
    seriesList &&
    setsGrid &&
    cardsGrid &&
    cardDetail &&
    pokemonCardSearch &&
    pokemonCardSearchButton &&
    pokemonCardSearchResults &&
    selectedSet &&
    selectedSeriesTitle &&
    seriesCount &&
    setsCount
);

let pokemonSets = [];
let groupedSeries = new Map();
let activeSeries = "";
let activeSetId = "";
let activeCardId = "";
const cardsBySet = new Map();
let pokemonSetMode = "main";
let cardSearchTimeout = 0;

function setMessage(target, message) {
  target.innerHTML = `<div class="index-message">${message}</div>`;
}

function sortByReleaseDateDesc(a, b) {
  return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
}

function sortCardsByNumber(a, b) {
  const numberA = Number.parseInt(a.number, 10);
  const numberB = Number.parseInt(b.number, 10);

  if (Number.isNaN(numberA) || Number.isNaN(numberB)) {
    return String(a.number).localeCompare(String(b.number), undefined, { numeric: true });
  }

  return numberA - numberB;
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getCardUrl(cardId) {
  return `card.html?id=${encodeURIComponent(cardId)}`;
}

async function fetchJsonWithRetry(url, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Pokemon API returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(350 * attempt);
      }
    }
  }

  throw lastError;
}

function getFilteredSeries() {
  const query = normalize(cardIndexSearch.value);

  return Array.from(groupedSeries.entries()).filter(([seriesName, sets]) => {
    const seriesMatch = normalize(seriesName).includes(query);
    const setMatch = sets.some((set) => normalize(set.name).includes(query));
    return !query || seriesMatch || setMatch;
  });
}

function parseCardSearch(value) {
  const raw = value.trim();
  const tokens = raw.split(/\s+/).filter(Boolean);
  const parsed = {
    raw,
    name: "",
    number: "",
    total: "",
    numericHint: "",
  };

  const numberIndex = tokens.findIndex((token) => /^\d+[a-zA-Z]?(?:\/\d+)?$/.test(token));

  if (numberIndex !== -1) {
    const [number, total] = tokens[numberIndex].split("/");
    parsed.numericHint = number;
    parsed.number = tokens.length ? "" : number;
    parsed.total = total || "";
    tokens.splice(numberIndex, 1);
  }

  parsed.name = tokens.join(" ");
  return parsed;
}

function buildCardSearchQuery(parsed) {
  const parts = [];

  if (parsed.name) {
    const name = parsed.name.replaceAll('"', "");
    parts.push(`name:${name}${name.includes(" ") ? "" : "*"}`);
  } else if (parsed.number) {
    parts.push(`number:${parsed.number}`);
  }

  return parts.join(" ");
}

function cardMatchesParsedSearch(card, parsed) {
  const numericHint = parsed.numericHint || parsed.number;
  const setName = String(card.set?.name || "").toLowerCase();
  const setSeries = String(card.set?.series || "").toLowerCase();
  const setId = String(card.set?.id || "").toLowerCase();
  const cardNumber = String(card.number || "").toLowerCase();
  const total = String(card.set?.printedTotal || card.set?.total || "");
  const totalMatch = !parsed.total || total === parsed.total;
  const nameMatch = !parsed.name || normalize(card.name).includes(normalize(parsed.name));
  const numberMatch =
    !numericHint ||
    cardNumber === numericHint.toLowerCase() ||
    total === numericHint ||
    setName.includes(numericHint.toLowerCase()) ||
    setSeries.includes(numericHint.toLowerCase()) ||
    setId.includes(numericHint.toLowerCase());

  return numberMatch && totalMatch && nameMatch;
}

async function fetchCardSearchResults(parsed) {
  const query = buildCardSearchQuery(parsed);

  if (!query) {
    return [];
  }

  const pageSize = 100;
  const cards = [];

  for (let page = 1; page <= 3; page += 1) {
    const result = await fetchJsonWithRetry(
      `${pokemonApiBase}/cards?q=${encodeURIComponent(query)}&orderBy=name&pageSize=${pageSize}&page=${page}`
    );
    const pageCards = result.data || [];
    cards.push(...pageCards);

    if (pageCards.length < pageSize || cards.length >= (result.totalCount || pageCards.length)) {
      break;
    }
  }

  return cards.filter((card) => cardMatchesParsedSearch(card, parsed));
}

function renderCardSearchResults(cards, parsed) {
  if (!parsed.raw) {
    pokemonCardSearchResults.textContent =
      "Search by Pokemon name, set name, set number, collector number, or a mix of terms.";
    return;
  }

  if (!cards.length) {
    pokemonCardSearchResults.innerHTML = `<div class="index-message">No cards matched "${escapeHtml(parsed.raw)}". Try a Pokemon name, set name, set number, collector number, or a mix of terms.</div>`;
    return;
  }

  const deduped = window.GCX_TCG_IDENTITY?.dedupeCards
    ? window.GCX_TCG_IDENTITY.dedupeCards(cards, "pokemon", { includeVariant: true })
    : { cards, duplicates: [] };
  const warningMarkup = window.GCX_TCG_IDENTITY?.renderAdminWarnings
    ? window.GCX_TCG_IDENTITY.renderAdminWarnings(deduped.duplicates.length ? [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden`] : [])
    : "";

  pokemonCardSearchResults.innerHTML = `
    ${warningMarkup}
    <div class="card-search-grid">
      ${deduped.cards
        .slice(0, 24)
        .map((card) => {
          const setTotal = card.set?.printedTotal || card.set?.total || "?";
          const rarity = card.rarity ? ` - ${card.rarity}` : "";
          return `
            <a class="pokemon-card" href="${getCardUrl(card.id)}">
              ${renderPokemonCardImage(card, card.images?.small || card.images?.large || "", "grid")}
              <strong>${escapeHtml(card.number)}/${escapeHtml(setTotal)}. ${escapeHtml(card.name)}</strong>
              <span>${escapeHtml(card.set?.name || "Unknown set")}${escapeHtml(rarity)}</span>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
}

async function runCardSearch() {
  const parsed = parseCardSearch(pokemonCardSearch.value);

  if (!parsed.raw) {
    renderCardSearchResults([], parsed);
    return;
  }

  pokemonCardSearchResults.innerHTML = `<div class="index-message">Searching cards...</div>`;

  try {
    const cards = await fetchCardSearchResults(parsed);
    renderCardSearchResults(cards, parsed);
  } catch (error) {
    pokemonCardSearchResults.innerHTML = `<div class="index-message">Card search is unavailable right now. Try again in a moment.</div>`;
  }
}

async function prefillTradeCardFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tradeInput = document.querySelector(".trade-card input");
  const form = document.querySelector(".trade-card");
  const gameParamMap = {
    trade3dsGame: ["3ds", "3DS"],
    tradeDreamcastGame: ["dreamcast", "Dreamcast"],
    tradeDsGame: ["ds", "DS"],
    tradeGameboyGame: ["gameboy", "Game Boy"],
    tradeGamecubeGame: ["gamecube", "GameCube"],
    tradeGbaGame: ["gba", "GBA"],
    tradeGenesisGame: ["genesis", "Genesis"],
    tradeN64Game: ["n64", "N64"],
    tradeNesGame: ["nes", "NES"],
    tradePs1Game: ["ps1", "PS1"],
    tradePs2Game: ["ps2", "PS2"],
    tradePs3Game: ["ps3", "PS3"],
    tradePs4Game: ["ps4", "PS4"],
    tradePs5Game: ["ps5", "PS5"],
    tradePspGame: ["psp", "PSP"],
    tradeSaturnGame: ["saturn", "Saturn"],
    tradeSnesGame: ["snes", "SNES"],
    tradeSwitchGame: ["switch", "Switch"],
    tradeSwitch2Game: ["switch2", "Switch 2"],
    tradeVitaGame: ["vita", "PS Vita"],
    tradeWiiGame: ["wii", "Wii"],
    tradeXboxGame: ["xbox", "Original Xbox"],
    tradeXbox360Game: ["xbox360", "Xbox 360"],
  };

  for (const [param, [slug, label]] of Object.entries(gameParamMap)) {
    const id = params.get(param);
    if (!id) continue;
    try {
      const response = await fetch(`data/games/${slug}.json`, { cache: "no-store" });
      const games = await response.json();
      const game = games.find((item) => item.id === id);

      if (tradeInput && game) {
        tradeInput.value = `${game.title} (${label})`;
        if (form) {
          form.dataset.itemType = "game";
          form.dataset.sourceId = id;
        }
        return;
      }
    } catch (error) {
      // The trade form remains usable even if the prefill fails.
    }
  }

  const gameId = params.get("tradeGame");
  if (gameId) {
    try {
      const response = await fetch("data/games.json", { cache: "no-store" });
      const games = await response.json();
      const game = games.find((item) => item.id === gameId);
      if (tradeInput && game) tradeInput.value = game.title;
      if (form) {
        form.dataset.itemType = "game";
        form.dataset.sourceId = gameId;
      }
    } catch (error) {
      // The trade form remains usable even if the prefill fails.
    }
  }

  const consoleId = params.get("tradeConsole");
  if (consoleId) {
    try {
      const response = await fetch("data/consoles.json", { cache: "no-store" });
      const consoles = await response.json();
      const consoleItem = consoles.find((item) => item.id === consoleId);
      if (tradeInput && consoleItem) tradeInput.value = consoleItem.name;
      if (form) {
        form.dataset.itemType = "console";
        form.dataset.sourceId = consoleId;
      }
    } catch (error) {
      // The trade form remains usable even if the prefill fails.
    }
  }

  const cardId = params.get("tradeCard");
  if (!cardId) return;

  try {
    const result = await fetchJsonWithRetry(`${pokemonApiBase}/cards/${encodeURIComponent(cardId)}`);
    const card = result.data;

    if (tradeInput && card) {
      tradeInput.value = `${card.name} ${card.number}`;
      if (form) {
        form.dataset.itemType = "pokemon-card";
        form.dataset.sourceId = cardId;
      }
    }
  } catch (error) {
    // The trade form remains usable even if the prefill fails.
  }
}

function renderSeries() {
  const filtered = getFilteredSeries();
  const totalSets = filtered.reduce((count, [, sets]) => count + sets.length, 0);
  seriesCount.textContent = `${filtered.length} series / ${totalSets} sets`;

  if (!filtered.length) {
    setMessage(seriesList, "No Pokemon series matched that search.");
    return;
  }

  seriesList.innerHTML = filtered
    .map(([seriesName, sets]) => {
      const activeClass = seriesName === activeSeries ? " is-active" : "";
      const safeSeriesName = escapeHtml(seriesName);
      return `
        <button class="series-button${activeClass}" type="button" data-series="${safeSeriesName}">
          ${safeSeriesName}
          <span>${sets.length}</span>
        </button>
      `;
    })
    .join("");
}

function renderSets() {
  const visibleSets = getVisibleSetsForActiveSeries();

  selectedSeriesTitle.textContent = activeSeries || "Select a series";
  setsCount.textContent = `${visibleSets.length} sets`;

  if (!activeSeries) {
    setMessage(setsGrid, "Select a Pokemon series to view its sets.");
    return;
  }

  if (!visibleSets.length) {
    setMessage(setsGrid, "No sets matched that search in this series.");
    return;
  }

  setsGrid.innerHTML = visibleSets
    .map((set) => {
      const activeClass = set.id === activeSetId ? " is-active" : "";
      const printedTotal = set.printedTotal || set.total || "?";
      const safeSetId = escapeHtml(set.id);
      const safeSetName = escapeHtml(set.name);
      const safeReleaseDate = escapeHtml(set.releaseDate || "Unknown date");
      const supplementalLabel = isSupplementalPokemonSet(set) ? `<span class="set-badge">Supplemental</span>` : "";
      return `
        <button class="set-card${activeClass}" type="button" data-set-id="${safeSetId}">
          <img src="${escapeHtml(set.images?.logo || set.images?.symbol || "")}" alt="${safeSetName} logo" loading="lazy" />
          <strong>${safeSetName}</strong>
          <span>${safeReleaseDate} - ${escapeHtml(printedTotal)} cards</span>
          <span class="set-card-code">Set code: ${safeSetId}</span>
          ${supplementalLabel}
        </button>
      `;
    })
    .join("");
}

function getVisibleSetsForActiveSeries() {
  const sets = groupedSeries.get(activeSeries) || [];
  const query = normalize(cardIndexSearch.value);
  return sets.filter((set) => !query || normalize(set.name).includes(query) || normalize(set.series).includes(query));
}

function dedupePokemonSets(sets = []) {
  const seen = new Map();
  sets.forEach((set) => {
    const key = normalize(set.id || `${set.series}-${set.name}`);
    if (!key || seen.has(key)) return;
    seen.set(key, set);
  });
  return [...seen.values()];
}

function isSupplementalPokemonSet(set) {
  const id = normalize(set.id);
  const name = normalize(set.name);
  const series = normalize(set.series);
  return (
    series === "pop" ||
    id === "sve" ||
    id.endsWith("p") ||
    id.endsWith("tg") ||
    id.endsWith("gg") ||
    id.endsWith("sv") ||
    id.startsWith("mcd") ||
    id.startsWith("pop") ||
    id.startsWith("tk") ||
    ["black star promos", "trainer gallery", "galarian gallery", "shiny vault", "classic collection", "mcdonald", "trainer kit", "energies"].some((term) =>
      name.includes(term)
    )
  );
}

function getPokemonSetsForMode() {
  const deduped = dedupePokemonSets(pokemonSets);
  return pokemonSetMode === "main" ? deduped.filter((set) => !isSupplementalPokemonSet(set)) : deduped;
}

function rebuildPokemonSeries() {
  groupedSeries = getPokemonSetsForMode().reduce((groups, set) => {
    const seriesName = set.series || "Other";
    const existing = groups.get(seriesName) || [];
    groups.set(seriesName, [...existing, set]);
    return groups;
  }, new Map());
}

function renderPokemonSetModeNote() {
  if (!pokemonSetModeNote) return;
  pokemonSetModeNote.textContent =
    pokemonSetMode === "main"
      ? "Main view hides promos, trainer galleries, shiny vaults, and small supplemental products."
      : "All products includes promos, trainer galleries, shiny vaults, Classic Collections, and supplemental releases.";
}

function renderSelectedSet(set, message = "") {
  if (!set) {
    selectedSet.innerHTML = `
      <div>
        <h3>Choose a set</h3>
        <p>Cards will appear here in collector-number order with approved imagery when available.</p>
      </div>
    `;
    return;
  }

  selectedSet.innerHTML = `
    <img src="${escapeHtml(set.images?.symbol || set.images?.logo || "")}" alt="${escapeHtml(set.name)} symbol" loading="lazy" />
    <div>
      <h3>${escapeHtml(set.name)}</h3>
      <p>${escapeHtml(set.series)} - Released ${escapeHtml(set.releaseDate || "date unknown")} - ${escapeHtml(set.printedTotal || set.total || "?")} cards${escapeHtml(message)}</p>
    </div>
  `;
}

function renderEmptyCardDetail() {
  activeCardId = "";
  cardDetail.innerHTML = `
    <div>
      <h3>Select a card</h3>
      <p>Price, rarity, legality, variants, and beta waitlist tools will appear here.</p>
    </div>
  `;
}

function getCardPrices(card) {
  const tcgplayer = card.tcgplayer?.prices || {};
  const prices = [];

  Object.entries(tcgplayer).forEach(([variant, value]) => {
    const market = value?.market ?? value?.mid ?? value?.low;
    if (market) {
      prices.push({
        label: variant.replaceAll("_", " "),
        value: `$${Number(market).toFixed(2)}`,
      });
    }
  });

  const cardmarket = card.cardmarket?.prices;
  if (!prices.length && cardmarket) {
    const average = cardmarket.averageSellPrice || cardmarket.trendPrice || cardmarket.avg30;
    if (average) {
      prices.push({
        label: "Cardmarket avg",
        value: `EUR ${Number(average).toFixed(2)}`,
      });
    }
  }

  return prices;
}

function getCardVariants(card) {
  const variants = [];
  const tcgplayer = card.tcgplayer?.prices || {};

  Object.keys(tcgplayer).forEach((variant) => {
    variants.push(variant.replaceAll("_", " "));
  });

  if (card.rarity) variants.push(card.rarity);
  if (card.subtypes?.length) variants.push(...card.subtypes);

  return Array.from(new Set(variants));
}

function renderPokemonCardImage(card, imageUrl, context = "grid") {
  if (window.GCX_TCG_MEDIA?.renderImage) {
    return window.GCX_TCG_MEDIA.renderImage(card, {
      imageUrl,
      name: card.name,
      alt: `${card.name} card image`,
      size: context === "detail" ? "large" : "small",
      loading: context === "detail" ? "eager" : "lazy",
      showPolicyNote: context === "detail",
    });
  }
  return imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(card.name)} card image" loading="lazy" />` : "";
}

function renderPokemonCardIdentity(card, franchise = "pokemon") {
  const canonicalKey = card.canonicalKey || window.GCX_TCG_IDENTITY?.canonicalKey?.(card, franchise, { includeVariant: true }) || "";
  const imageUrl = card.imageFront || card.images?.large || card.images?.small || "";
  const source = card.imageSource || (imageUrl ? "Pokemon TCG API" : "Image source unavailable");
  const status = card.imageStatus || (imageUrl ? "api-sourced-review-required" : "missing");
  const values = [
    ["Card ID", card.cardId || card.id],
    ["Set", card.setCode || card.set?.id || card.set?.name],
    ["Number", card.cardNumberDisplay || card.number],
    ["Image", `${source} / ${status}`],
    ["Canonical", canonicalKey],
  ].filter(([, value]) => value);

  return `
    <p class="detail-section-title">Collector Identity</p>
    <div class="identity-list">${values.map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</span>`).join("")}</div>
  `;
}

function renderCardDetail(card) {
  activeCardId = card.id;
  const prices = getCardPrices(card);
  const variants = getCardVariants(card);
  const legalities = Object.entries(card.legalities || {});
  const setName = card.set?.name || "Unknown set";
  const setSeries = card.set?.series || "Unknown series";

  const priceMarkup = prices.length
    ? prices
        .slice(0, 6)
        .map((price) => `<span><strong>${escapeHtml(price.value)}</strong>${escapeHtml(price.label)}</span>`)
        .join("")
    : "<span>No market data yet</span>";

  const legalityMarkup = legalities.length
    ? legalities
        .map(([format, status]) => `<span>${escapeHtml(format)}: ${escapeHtml(status)}</span>`)
        .join("")
    : "<span>No legality data</span>";

  const variantMarkup = variants.length
    ? variants
        .slice(0, 8)
        .map((variant) => `<span>${escapeHtml(variant)}</span>`)
        .join("")
    : "<span>No variants listed</span>";

  cardDetail.innerHTML = `
    <div class="tcg-card-media">${renderPokemonCardImage(card, card.images?.large || card.images?.small || "", "detail")}</div>
    <div>
      <h3>${escapeHtml(card.name)}</h3>
      <p>${escapeHtml(setName)} - ${escapeHtml(setSeries)} - #${escapeHtml(card.number)}/${escapeHtml(card.set?.printedTotal || card.set?.total || "?")}</p>
      <div class="detail-meta">
        <span>${escapeHtml(card.supertype || "Card")}</span>
        <span>${escapeHtml(card.rarity || "Rarity unknown")}</span>
        <span>${escapeHtml(card.artist || "Artist unknown")}</span>
      </div>

      <p class="detail-section-title">Market Price</p>
      <div class="price-grid">${priceMarkup}</div>

      <p class="detail-section-title">Legalities</p>
      <div class="legality-list">${legalityMarkup}</div>

      <p class="detail-section-title">Variants</p>
      <div class="variant-list">${variantMarkup}</div>
      ${renderPokemonCardIdentity(card, "pokemon")}

      <button class="button list-trade-button" type="button" data-trade-card-id="${escapeHtml(card.id)}">
        Join beta waitlist
      </button>
    </div>
  `;

  cardsGrid.querySelectorAll(".pokemon-card").forEach((button) => {
    button.classList.toggle("is-active", button.href?.endsWith(getCardUrl(card.id)));
  });
}

function renderCards(cards) {
  const deduped = window.GCX_TCG_IDENTITY?.dedupeCards
    ? window.GCX_TCG_IDENTITY.dedupeCards(cards, "pokemon", { includeVariant: true })
    : { cards, duplicates: [] };

  if (!deduped.cards.length) {
    setMessage(cardsGrid, "No cards were returned for this set.");
    return;
  }

  const warningMarkup = window.GCX_TCG_IDENTITY?.renderAdminWarnings
    ? window.GCX_TCG_IDENTITY.renderAdminWarnings(deduped.duplicates.length ? [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden`] : [])
    : "";

  cardsGrid.innerHTML = warningMarkup + deduped.cards
    .sort(sortCardsByNumber)
    .map((card) => {
      const rarity = card.rarity ? ` - ${card.rarity}` : "";
      return `
        <a class="pokemon-card" href="${getCardUrl(card.id)}">
          ${renderPokemonCardImage(card, card.images?.small || card.images?.large || "", "grid")}
          <strong>${escapeHtml(card.number)}. ${escapeHtml(card.name)}</strong>
          <span>${escapeHtml(card.supertype || "Card")}${escapeHtml(rarity)}</span>
        </a>
      `;
    })
    .join("");
}

async function loadCardsForSet(setId) {
  const set = pokemonSets.find((item) => item.id === setId);
  activeSetId = setId;
  renderSeries();
  renderSets();
  renderSelectedSet(set, " - Loading cards");
  renderEmptyCardDetail();
  setMessage(cardsGrid, "Loading cards for this set...");

  if (cardsBySet.has(setId)) {
    const cachedCards = cardsBySet.get(setId);
    renderSelectedSet(set);
    renderCards(cachedCards);
    if (cachedCards.length) {
      renderCardDetail(cachedCards.sort(sortCardsByNumber)[0]);
    }
    return;
  }

  try {
    const pageSize = 100;
    let page = 1;
    let totalCount = Infinity;
    const cards = [];

    while (cards.length < totalCount) {
      const result = await fetchJsonWithRetry(
        `${pokemonApiBase}/cards?q=${encodeURIComponent(`set.id:${setId}`)}&orderBy=number&pageSize=${pageSize}&page=${page}`
      );
      const pageCards = result.data || [];
      totalCount = result.totalCount || pageCards.length;
      cards.push(...pageCards);

      if (pageCards.length < pageSize) {
        break;
      }

      page += 1;
    }

    cardsBySet.set(setId, cards);
    renderSelectedSet(set);
    renderCards(cards);
    if (cards.length) {
      renderCardDetail(cards.sort(sortCardsByNumber)[0]);
    }
  } catch (error) {
    renderSelectedSet(set, " - Could not load cards");
    setMessage(cardsGrid, "The cards could not be loaded right now. Try again in a moment or check the backend cache/API key.");
  }
}

function selectSeries(seriesName) {
  activeSeries = seriesName;
  activeSetId = "";
  renderSeries();
  renderSets();
  renderSelectedSet(null);
  renderEmptyCardDetail();
  const firstSet = getVisibleSetsForActiveSeries()[0];
  if (firstSet) {
    loadCardsForSet(firstSet.id);
  } else {
    setMessage(cardsGrid, "Select a set to view every card in order.");
  }
}

async function loadPokemonIndex() {
  setMessage(seriesList, "Loading Pokemon TCG series...");
  setMessage(setsGrid, "Loading sets...");

  try {
    const result = await fetchJsonWithRetry(`${pokemonApiBase}/sets?orderBy=-releaseDate`);
    pokemonSets = dedupePokemonSets(result.data || []).sort(sortByReleaseDateDesc);
    rebuildPokemonSeries();

    const firstSeries = Array.from(groupedSeries.keys())[0] || "";
    selectSeries(firstSeries);
  } catch (error) {
    seriesCount.textContent = "Unavailable";
    setsCount.textContent = "0 sets";
    setMessage(seriesList, "Pokemon set data could not be loaded. The public API may be rate-limited or offline.");
    setMessage(setsGrid, "Add server-side caching before production so the index stays reliable.");
  }
}

seriesList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-series]");
  if (!button) return;
  selectSeries(button.dataset.series);
});

setsGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-set-id]");
  if (!button) return;
  loadCardsForSet(button.dataset.setId);
});

cardDetail?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-trade-card-id]");
  if (!button) return;
  const cards = cardsBySet.get(activeSetId) || [];
  const card = cards.find((item) => item.id === button.dataset.tradeCardId);
  if (!card) return;

  document.querySelector("#cards").scrollIntoView({ behavior: "smooth" });
  const tradeInput = document.querySelector(".trade-card input");
  if (tradeInput) {
    tradeInput.value = `${card.name} ${card.number}`;
    tradeInput.focus();
  }
});

cardIndexSearch?.addEventListener("input", () => {
  renderSeries();
  renderSets();
});

pokemonSetModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    pokemonSetMode = button.dataset.pokemonSetMode || "main";
    pokemonSetModeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    rebuildPokemonSeries();
    renderPokemonSetModeNote();
    const nextSeries = groupedSeries.has(activeSeries) ? activeSeries : Array.from(groupedSeries.keys())[0] || "";
    selectSeries(nextSeries);
  });
});

pokemonCardSearchButton?.addEventListener("click", runCardSearch);

pokemonCardSearch?.addEventListener("input", () => {
  window.clearTimeout(cardSearchTimeout);
  cardSearchTimeout = window.setTimeout(runCardSearch, 350);
});

pokemonCardSearch?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    window.clearTimeout(cardSearchTimeout);
    runCardSearch();
  }
});

if (hasPokemonIndex) {
  renderPokemonSetModeNote();
  loadPokemonIndex();
}

prefillTradeCardFromUrl();
