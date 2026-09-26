const n64DetailTarget = document.querySelector("#n64-detail");

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
    "Verify region, cartridge authenticity, front label, back label, and cartridge shell condition",
    "Photograph the front, back, top label, pins, and board for high-value titles",
    "Disclose whether the copy is loose, complete-in-box, sealed, or includes manual/inserts",
    "Check for rental stickers, marker, label lifting, sun fading, cracks, and swapped back labels",
    "For save-based games, test save functionality when possible",
  ];
}

function renderN64Detail(game) {
  document.title = `${game.title} | N64 Library | Games Cards Exchange`;

  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl
    ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />`
    : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "N64") || "Editorial overview coming soon. This N64 record is ready for source-backed GCX copy, review links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "N64",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  n64DetailTarget.innerHTML = `
    <div class="game-detail-art">
      ${imageMarkup}
    </div>
    <div class="console-detail-copy">
      <p class="kicker">Nintendo 64 Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || "Release year unknown")} - Nintendo 64</p>

      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "Cartridge")}</span>
      </div>

      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>

      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>

      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>

      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>

      <a class="button list-trade-button" href="index.html?tradeN64Game=${encodeURIComponent(game.id)}#cards">
        Join beta waitlist
      </a>
    </div>
  `;
}

async function loadN64Detail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    n64DetailTarget.innerHTML = `<div class="index-message">No N64 game was selected.</div>`;
    return;
  }

  try {
    const game = await window.GCX_GAME_DATA.loadDetail("n64", id, "data/games/n64.json?v=1");
    if (!game) {
      n64DetailTarget.innerHTML = `<div class="index-message">N64 game not found.</div>`;
      return;
    }
    renderN64Detail(game);
  } catch (error) {
    n64DetailTarget.innerHTML = `<div class="index-message">This N64 game could not be loaded right now.</div>`;
  }
}

loadN64Detail();
