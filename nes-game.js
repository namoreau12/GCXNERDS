const nesDetailTarget = document.querySelector("#nes-detail");
const nesOverviewCacheKey = "gcx-nes-overviews-v1";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify North American NES region and whether the cartridge is 5-screw or 3-screw",
    "Photograph cartridge front, back, top label, pins, and circuit board when possible",
    "Describe label wear, shell discoloration, marker, stickers, cracks, and rental markings",
    "List whether the copy is loose, complete-in-box, sealed, or includes manual/inserts",
    "For battery-backed games, test and disclose save battery status",
  ];
}

function readOverviewCache() {
  try {
    return JSON.parse(localStorage.getItem(nesOverviewCacheKey) || "{}");
  } catch (error) {
    return {};
  }
}

function writeOverviewCache(cache) {
  try {
    localStorage.setItem(nesOverviewCacheKey, JSON.stringify(cache));
  } catch (error) {
    // Detail pages still render with saved data if localStorage is unavailable.
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

async function fetchNesOverview(game) {
  if (game.descriptionProvider || !game.articleUrl) return game;

  const cache = readOverviewCache();
  if (cache[game.id]) {
    return {
      ...game,
      description: cache[game.id].description,
      descriptionSourceUrl: cache[game.id].descriptionSourceUrl,
      descriptionProvider: "Wikipedia page summary",
    };
  }

  const title = titleFromArticleUrl(game.articleUrl);
  if (!title) return game;

  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!response.ok) return game;

    const summary = await response.json();
    const description = String(summary.extract || "").replace(/\s+/g, " ").trim();
    if (!description || summary.type === "disambiguation") return game;

    cache[game.id] = {
      description,
      descriptionSourceUrl: summary.content_urls?.desktop?.page || game.articleUrl,
    };
    writeOverviewCache(cache);

    return {
      ...game,
      ...cache[game.id],
      descriptionProvider: "Wikipedia page summary",
    };
  } catch (error) {
    return game;
  }
}

function renderNesDetail(game) {
  document.title = `${game.title} | NES Library | Games Exchange`;

  const initials = game.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("");
  const imageMarkup = game.imageUrl
    ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />`
    : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const editorialStatus = window.GCX_GAME_COPY?.status(game) || "needs_editorial";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(editorialStatus) || "Needs overview",
    "North American licensed release",
    game.releases?.northAmerica || "",
    game.imageProvider ? "Box art matched" : "Image pending",
    "NES",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  nesDetailTarget.innerHTML = `
    <div class="game-detail-art">
      ${imageMarkup}
    </div>
    <div class="console-detail-copy">
      <p class="kicker">NES Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml(game.releases?.northAmerica || "North American release date unknown")} - Nintendo Entertainment System</p>

      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml((game.releaseYears || []).join(", ") || "Year unknown")}</span>
      </div>

      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(window.GCX_GAME_COPY?.overviewDisplay(game, "NES") || "Editorial overview coming soon. This NES record is ready for source-backed GCX copy, screenshots, source links, and collector notes.")}</div>

      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>

      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>

      <p class="detail-section-title">Data Source</p>
      <div class="console-tags">${tags}</div>

      <a class="button list-trade-button" href="index.html?tradeNesGame=${encodeURIComponent(game.id)}#cards">
        Join beta waitlist
      </a>
    </div>
  `;
}

async function loadNesDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    nesDetailTarget.innerHTML = `<div class="index-message">No NES game was selected.</div>`;
    return;
  }

  try {
    const game = await window.GCX_GAME_DATA.loadDetail("nes", id, "data/games/nes.json");

    if (!game) {
      nesDetailTarget.innerHTML = `<div class="index-message">NES game not found.</div>`;
      return;
    }

    renderNesDetail(await fetchNesOverview(game));
  } catch (error) {
    nesDetailTarget.innerHTML = `<div class="index-message">This NES game could not be loaded right now.</div>`;
  }
}

loadNesDetail();
