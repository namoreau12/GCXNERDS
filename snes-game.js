const snesDetailTarget = document.querySelector("#snes-detail");
const snesImageCacheKey = "gcx-snes-images-v1";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getChecklist(game) {
  return [
    "Verify region: North America, PAL, Japan/Super Famicom, or other release",
    "Photograph cartridge front, back, top label, pins, and circuit board when possible",
    "Describe label wear, shell discoloration, marker, stickers, cracks, and rental markings",
    "List whether the copy is loose, complete-in-box, sealed, or includes manual/inserts",
    "For RPGs and battery-backed games, test and disclose save battery status",
  ];
}

function readImageCache() {
  try {
    return JSON.parse(localStorage.getItem(snesImageCacheKey) || "{}");
  } catch (error) {
    return {};
  }
}

function writeImageCache(cache) {
  try {
    localStorage.setItem(snesImageCacheKey, JSON.stringify(cache));
  } catch (error) {
    // Fallback art still renders if localStorage is unavailable.
  }
}

function titleFromArticleUrl(articleUrl) {
  if (!articleUrl) return "";

  try {
    return decodeURIComponent(new URL(articleUrl).pathname.replace(/^\/wiki\//, ""));
  } catch (error) {
    return "";
  }
}

async function fetchSnesImage(game) {
  const cache = readImageCache();

  if (game.imageUrl) {
    return { imageUrl: game.imageUrl, sourceUrl: game.articleUrl || game.wikidataUrl };
  }

  if (cache[game.id]) {
    return cache[game.id];
  }

  const title = titleFromArticleUrl(game.articleUrl);
  if (!title) return null;

  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!response.ok) return null;

  const summary = await response.json();
  const imageUrl = summary.thumbnail?.source || summary.originalimage?.source || "";
  const sourceUrl = summary.content_urls?.desktop?.page || game.articleUrl;

  if (!imageUrl) return null;

  cache[game.id] = { imageUrl, sourceUrl };
  writeImageCache(cache);
  return cache[game.id];
}

function renderSnesDetail(game, imageData) {
  document.title = `${game.title} | SNES Library | GCXNerds`;

  const initials = game.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("");
  const imageMarkup = imageData?.imageUrl
    ? `<img src="${escapeHtml(imageData.imageUrl)}" alt="${escapeHtml(game.title)} image" />`
    : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "SNES") || "Editorial overview coming soon. This SNES record is ready for source-backed GCX copy, review links, regional notes, and collector context.";
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");

  snesDetailTarget.innerHTML = `
    <div class="game-detail-art">
      ${imageMarkup}
    </div>
    <div class="console-detail-copy">
      <p class="kicker">SNES Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || "Release year unknown")} - Super Nintendo Entertainment System</p>

      <div class="detail-meta">
        <span>${escapeHtml((game.genres || []).slice(0, 3).join(", ") || "Genre unknown")}</span>
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
      </div>

      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>

      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>

      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>

      <p class="detail-section-title">Data Source</p>
      <div class="console-tags">
        <span>${escapeHtml(window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || "In editorial review")}</span>
        <span>${escapeHtml(game.wikidataId)}</span>
        <span>Wikidata import</span>
        <span>SNES</span>
      </div>

      <a class="button list-trade-button" href="index.html?tradeSnesGame=${encodeURIComponent(game.id)}#cards">
        Join beta waitlist
      </a>
    </div>
  `;
}

async function loadSnesDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    snesDetailTarget.innerHTML = `<div class="index-message">No SNES game was selected.</div>`;
    return;
  }

  try {
    const game = await window.GCX_GAME_DATA.loadDetail("snes", id, "data/games/snes.json?v=2");

    if (!game) {
      snesDetailTarget.innerHTML = `<div class="index-message">SNES game not found.</div>`;
      return;
    }

    const imageData = await fetchSnesImage(game);
    renderSnesDetail(game, imageData);
  } catch (error) {
    snesDetailTarget.innerHTML = `<div class="index-message">This SNES game could not be loaded right now.</div>`;
  }
}

loadSnesDetail();
