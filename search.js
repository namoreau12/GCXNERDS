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

function staticResults() {
  return [
    {
      title: "Pokemon card database",
      excerpt: "Browse Pokemon card series, sets, card details, market fields, legalities, variants, and collector tools.",
      category: "Cards",
      url: "pokemon.html",
    },
    {
      title: "Magic card database",
      excerpt: "Explore Magic sets and cards as GCX expands the trading-card index.",
      category: "Cards",
      url: "magic.html",
    },
    {
      title: "Yu-Gi-Oh! card database",
      excerpt: "Browse Yu-Gi-Oh! sets and cards as the collector library grows.",
      category: "Cards",
      url: "yugioh.html",
    },
    {
      title: "Game database",
      excerpt: "Search console libraries, platform pages, game overviews, and collector-relevant game records.",
      category: "Games",
      url: "games.html",
    },
    {
      title: "Marketplace beta waitlist",
      excerpt: "Join the collector waitlist before GCX opens verified trading and selling.",
      category: "Marketplace",
      url: "index.html#cards",
    },
    {
      title: "Streamer highlights",
      excerpt: "Vote for featured creators and follow community spotlight campaigns.",
      category: "Community",
      url: "streamers.html",
    },
  ];
}

function resultCard(result) {
  return `
    <article class="search-result-card">
      <span>${escapeHtml(result.category || "GCX")}</span>
      <h3><a href="${escapeHtml(result.url || result.articleUrl)}">${escapeHtml(result.title)}</a></h3>
      <p>${escapeHtml(cleanPreviewText(result.excerpt || ""))}</p>
      <a class="feed-link" href="${escapeHtml(result.url || result.articleUrl)}">Open result</a>
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
  searchResults.innerHTML = `<div class="index-message">Searching GCX...</div>`;

  try {
    const response = await fetch("/api/news?limit=40", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Search could not load.");
    const newsMatches = (result.data || [])
      .filter((story) => normalize([story.title, story.excerpt, story.category, story.sourceName, story.type, ...(story.body || []).map(articleBlockText)].join(" ")).includes(q))
      .map((story) => ({
        title: story.title,
        excerpt: storyPreviewText(story),
        category: story.category || "News",
        url: story.articleUrl,
      }));
    const utilityMatches = staticResults().filter((item) => normalize([item.title, item.excerpt, item.category].join(" ")).includes(q));
    const matches = [...newsMatches, ...utilityMatches];
    searchResults.innerHTML = matches.length
      ? matches.map(resultCard).join("")
      : `<div class="index-message">No GCX results matched "${escapeHtml(query)}". Try Pokemon, Switch, GTA, cards, games, or streamers.</div>`;
  } catch (error) {
    searchResults.innerHTML = `<div class="index-message">Search could not load. Make sure the local server is running.</div>`;
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
