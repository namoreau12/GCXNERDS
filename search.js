const searchForm = document.querySelector("#search-page-form");
const searchInput = document.querySelector("#search-page-input");
const searchResults = document.querySelector("#search-results");
const searchHeading = document.querySelector("#search-results-heading");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
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

function cleanPreviewText(value) {
  return stripMarkdownTablesForPreview(articleBlockText(value))
    .replace(/^\s*\|.+\|\s*$/gm, " ")
    .replace(/\|?\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*(?:\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*)+\|?/g, " ")
    .replace(/\|/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "")
    .replace(/\*\*/g, "")
    .replace(/[#_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

function storyPreviewText(story) {
  const candidates = [story.excerpt, ...(story.body || [])].filter(Boolean);
  for (const candidate of candidates) {
    const cleaned = cleanPreviewText(candidate);
    if (cleaned) return cleaned;
  }
  return "Open the full GCX story for the latest confirmed details, context, and source links.";
}

function resultTypeLabel(type) {
  const labels = {
    community: "Community",
    creator: "Creator",
    destination: "Hub",
    game: "Game record",
    news: "News",
  };
  return labels[String(type || "").toLowerCase()] || "Result";
}

function emptyResultsMessage(query) {
  return `
    <div class="index-message search-empty-state">
      <strong>No Games Exchange results matched "${escapeHtml(query)}".</strong>
      <span>Try Pokemon, Final Fantasy, streamers, community, Magic, or another game title.</span>
    </div>
  `;
}

function resultCard(result) {
  const href = result.url || result.articleUrl || "search.html";
  const type = resultTypeLabel(result.type);
  const category = result.category && result.category !== type ? result.category : "";
  return `
    <article class="search-result-card">
      <div class="search-result-meta">
        <span>${escapeHtml(type)}</span>
        ${category ? `<span>${escapeHtml(category)}</span>` : ""}
      </div>
      <h3><a href="${escapeHtml(href)}">${escapeHtml(result.title)}</a></h3>
      <p>${escapeHtml(cleanPreviewText(result.excerpt || ""))}</p>
      <a class="feed-link" href="${escapeHtml(href)}">Open result</a>
    </article>
  `;
}

async function runSearch(query) {
  const q = normalize(query);
  if (searchInput) searchInput.value = query;
  if (!q) {
    searchHeading.textContent = "Search results";
    searchResults.innerHTML = `<div class="index-message">Enter a search above.</div>`;
    return;
  }

  searchHeading.textContent = `Results for "${query}"`;
  searchResults.innerHTML = `<div class="index-message">Searching Games Exchange...</div>`;

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=24`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Search could not load.");
    const matches = result.data || [];
    const countLabel = matches.length === 1 ? "1 result" : `${matches.length} results`;
    searchHeading.textContent = `${countLabel} for "${query}"`;
    searchResults.innerHTML = matches.length
      ? matches.map(resultCard).join("")
      : emptyResultsMessage(query);
  } catch (error) {
    searchResults.innerHTML = `<div class="index-message">Search is temporarily unavailable. Try News, Community, Streamer Highlights, or the card and game databases from the main navigation.</div>`;
  }
}

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  window.history.replaceState({}, "", url);
  runSearch(query);
});

const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
runSearch(initialQuery);
