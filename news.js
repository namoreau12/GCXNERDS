const newsGrid = document.querySelector("#news-grid");
const newsFeatured = document.querySelector("#news-featured");
const newsroomGrid = document.querySelector("#newsroom-grid");
const newsCategoryRows = document.querySelector("#news-category-rows");
const newsGenerated = document.querySelector("#news-generated");
const newsSources = document.querySelector("#news-sources");
const newsFilters = Array.from(document.querySelectorAll("[data-news-filter]"));

let stories = [];
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
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function matchesFilter(story) {
  if (activeFilter === "all") return true;
  const category = String(story.category || "").toLowerCase();
  const type = String(story.type || "").toLowerCase();
  const sourceName = String(story.sourceName || "").toLowerCase();
  if (activeFilter === "editorial") return sourceName.includes("gcx newsroom");
  return category === activeFilter || type === activeFilter || type.includes(activeFilter);
}

function storyMeta(story) {
  return `${story.category || "News"} - ${story.sourceName || "GCX"} - ${formatDate(story.publishedAt)}`;
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

function storyPreviewText(story, maxLength = 220) {
  const candidates = [story.excerpt, ...(story.body || [])].filter(Boolean);
  for (const candidate of candidates) {
    const cleaned = cleanPreviewText(candidate, maxLength);
    if (cleaned) return cleaned;
  }
  return "Open the full GCX story for the latest confirmed details, context, and source links.";
}

function readTime(story) {
  const words = [story.title, story.excerpt, ...(story.body || []).map(articleBlockText)].join(" ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function storyHeroImageUrl(story) {
  return story?.heroImage || story?.imageUrl || "";
}

function storyHeroImageAlt(story, fallback = "") {
  return story?.heroImageAlt || story?.imageAlt || fallback || story?.title || "";
}

function normalizeFocalValue(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return `${Math.max(0, Math.min(100, value))}%`;
  const text = String(value || "").trim();
  if (/^\d+(\.\d+)?%$/.test(text)) return text;
  if (/^0?(\.\d+)$/.test(text)) return `${Math.round(Number(text) * 100)}%`;
  return fallback;
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

function storyMediaType(story) {
  const explicitType = normalize(story?.mediaType || story?.leadMediaType || story?.imageType);
  if (["graphic", "chart", "diagram", "infographic"].some((term) => explicitType.includes(term))) return "graphic";
  const imageUrl = normalize(storyHeroImageUrl(story));
  const imageCredit = normalize(story?.heroImageCredit || story?.imageCredit);
  const title = normalize(story?.title);
  if (imageUrl.endsWith(".svg")) return "graphic";
  if (/(chart|diagram|infographic|tracker|price|pricing)/i.test(`${imageUrl} ${imageCredit} ${title}`)) return "graphic";
  return storyHeroMediaType(story);
}

function storyProminenceScore(story) {
  let score = 0;
  if (storyHasOfficialMedia(story)) score += 100;
  if (storyMediaType(story) === "graphic") score -= 50;
  if (isGamingStory(story) && !storyHasOfficialMedia(story)) score -= 80;
  if (/^https?:\/\//i.test(storyHeroImageUrl(story))) score += 10;
  return score;
}

function renderStoryCard(story) {
  const sourceCount = (story.sourceLinks || []).length;
  return `
    <article class="news-card ${story.type === "brief" ? "is-brief" : ""}">
      <a class="news-card-image" href="${escapeHtml(story.articleUrl)}" data-media-type="${escapeHtml(storyMediaType(story))}" style="--image-card-focal-x: ${escapeHtml(normalizeFocalValue(story.heroImageFocalX ?? story.imageFocalX, "50%"))}; --image-card-focal-y: ${escapeHtml(normalizeFocalValue(story.heroImageFocalY ?? story.imageFocalY, "42%"))};">
        <img src="${escapeHtml(storyHeroImageUrl(story))}" alt="${escapeHtml(storyHeroImageAlt(story, story.title))}" data-media-type="${escapeHtml(storyMediaType(story))}" loading="lazy" decoding="async" width="640" height="360" />
        ${renderOfficialMediaWarning(story)}
      </a>
      <div>
        <p class="meta">${escapeHtml(storyMeta(story))}</p>
        <h3><a href="${escapeHtml(story.articleUrl)}">${escapeHtml(story.title)}</a></h3>
        <p>${escapeHtml(storyPreviewText(story, 132))}</p>
        <div class="news-card-footer">
          <span>${escapeHtml(readTime(story))}</span>
          ${sourceCount ? `<span>${sourceCount} sources</span>` : ""}
          <a href="${escapeHtml(story.articleUrl)}">Read</a>
          <a href="${escapeHtml(story.shareUrl)}">Post to feed</a>
        </div>
      </div>
    </article>
  `;
}

function renderFeatured() {
  if (!newsFeatured) return;
  const visibleStories = stories.filter(matchesFilter);
  const prominentStories = [...visibleStories].sort((a, b) => storyProminenceScore(b) - storyProminenceScore(a));
  const lead = prominentStories[0];
  const sideStories = prominentStories.filter((story) => story !== lead).slice(0, 3);

  if (!lead) {
    newsFeatured.innerHTML = `<div class="index-message">No featured story matched this filter.</div>`;
    return;
  }

  newsFeatured.innerHTML = `
    <article class="news-lead" data-media-type="${escapeHtml(storyMediaType(lead))}">
      <a href="${escapeHtml(lead.articleUrl)}">
        <img src="${escapeHtml(storyHeroImageUrl(lead))}" alt="${escapeHtml(storyHeroImageAlt(lead, lead.title))}" data-media-type="${escapeHtml(storyMediaType(lead))}" loading="eager" decoding="async" width="1200" height="675" style="--image-card-focal-x: ${escapeHtml(normalizeFocalValue(lead.heroImageFocalX ?? lead.imageFocalX, "50%"))}; --image-card-focal-y: ${escapeHtml(normalizeFocalValue(lead.heroImageFocalY ?? lead.imageFocalY, "42%"))};" />
        ${renderOfficialMediaWarning(lead)}
      </a>
      <div>
        <p class="meta">${escapeHtml(storyMeta(lead))}</p>
        <h2><a href="${escapeHtml(lead.articleUrl)}">${escapeHtml(lead.title)}</a></h2>
        <p>${escapeHtml(storyPreviewText(lead, 220))}</p>
        <div class="news-card-footer">
          <span>${escapeHtml(readTime(lead))}</span>
          <a href="${escapeHtml(lead.articleUrl)}">Read feature</a>
          <a href="${escapeHtml(lead.shareUrl)}">Post to feed</a>
        </div>
      </div>
    </article>
    <div class="news-feature-stack">
      ${sideStories.map(renderCompactStory).join("")}
    </div>
  `;
}

function renderCompactStory(story) {
  return `
    <article class="news-compact">
      <a href="${escapeHtml(story.articleUrl)}" data-media-type="${escapeHtml(storyMediaType(story))}" style="--image-card-focal-x: ${escapeHtml(normalizeFocalValue(story.heroImageFocalX ?? story.imageFocalX, "50%"))}; --image-card-focal-y: ${escapeHtml(normalizeFocalValue(story.heroImageFocalY ?? story.imageFocalY, "42%"))};">
        <img src="${escapeHtml(storyHeroImageUrl(story))}" alt="${escapeHtml(storyHeroImageAlt(story, story.title))}" data-media-type="${escapeHtml(storyMediaType(story))}" loading="lazy" decoding="async" width="320" height="180" />
        ${renderOfficialMediaWarning(story)}
      </a>
      <div>
        <p class="meta">${escapeHtml(story.category || "News")} - ${escapeHtml(readTime(story))}</p>
        <h3><a href="${escapeHtml(story.articleUrl)}">${escapeHtml(story.title)}</a></h3>
      </div>
    </article>
  `;
}

function renderNewsroom() {
  if (!newsroomGrid) return;
  const newsroomStories = stories
    .filter((story) => String(story.sourceName || "").toLowerCase().includes("gcx newsroom"))
    .filter(matchesFilter)
    .slice(0, 6);
  newsroomGrid.innerHTML = newsroomStories.length
    ? newsroomStories.map(renderStoryCard).join("")
    : `<div class="index-message">No GCX Newsroom stories matched this filter.</div>`;
}

function categoryConfig() {
  return [
    { key: "gaming", label: "Gaming", match: (story) => String(story.category || "").toLowerCase() === "gaming" },
    { key: "cards", label: "Cards", match: (story) => String(story.category || "").toLowerCase() === "cards" },
    { key: "analysis", label: "Analysis", match: (story) => String(story.type || "").toLowerCase().includes("analysis") },
    { key: "brief", label: "Watchlist", match: (story) => String(story.type || "").toLowerCase().includes("brief") },
  ];
}

function renderCategoryRows() {
  if (!newsCategoryRows) return;
  newsCategoryRows.innerHTML = categoryConfig()
    .map((category) => {
      const items = stories.filter(category.match).slice(0, 4);
      if (!items.length) return "";
      return `
        <section class="news-category-row">
          <div class="news-row-heading">
            <h3>${escapeHtml(category.label)}</h3>
            <button class="text-button" type="button" data-news-filter="${escapeHtml(category.key)}">View ${escapeHtml(category.label)}</button>
          </div>
          <div class="news-row-grid">${items.map(renderCompactStory).join("")}</div>
        </section>
      `;
    })
    .join("");
}

function renderNews() {
  const visibleStories = stories.filter(matchesFilter);
  renderFeatured();
  renderNewsroom();
  renderCategoryRows();
  const wireStories = visibleStories.slice(activeFilter === "all" ? 6 : 0);
  newsGrid.innerHTML = wireStories.length
    ? wireStories.map(renderStoryCard).join("")
    : `<div class="index-message">No stories matched this filter.</div>`;
}

function renderSources(sources) {
  newsSources.innerHTML = (sources || [])
    .map(
      (source) => `
        <a class="news-source-card" href="${escapeHtml(source.sourceUrl)}" target="_blank" rel="noopener">
          <strong>${escapeHtml(source.name)}</strong>
          <span>${escapeHtml(source.category)}</span>
        </a>
      `
    )
    .join("");
}

newsFilters.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.newsFilter || "all";
    newsFilters.forEach((item) => item.classList.toggle("is-active", item === button));
    renderNews();
  });
});

newsCategoryRows?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-news-filter]");
  if (!button) return;
  activeFilter = button.dataset.newsFilter || "all";
  newsFilters.forEach((item) => item.classList.toggle("is-active", item.dataset.newsFilter === activeFilter));
  renderNews();
  document.querySelector("#latest-wire")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

async function loadNews() {
  try {
    const response = await fetch("/api/news?limit=32", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "News could not be loaded.");
    stories = result.data || [];
    newsGenerated.textContent = `Generated ${formatDate(result.generatedAt)}`;
    renderNews();
    renderSources(result.sources || []);
  } catch (error) {
    newsGenerated.textContent = "News unavailable";
    newsGrid.innerHTML = `<div class="index-message">News is temporarily unavailable. Try refreshing in a moment.</div>`;
  }
}

loadNews();
