const threeDsDetailTarget = document.querySelector("#threeds-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, serial code, label condition, contacts, and whether the game card is authentic",
    "Photograph the front label, back code, case spine, manual, inserts, and any bundled accessory",
    "Disclose whether the copy is loose, complete-in-box, sealed, Not for Resale, Nintendo Selects, or digital-only",
    "Test save behavior, touch controls, microphone features, local wireless, StreetPass, amiibo, and online-only features where relevant",
    "For Pokemon and other high-value titles, inspect shell color, PCB, label print quality, and matching case/manual region",
  ];
}

function renderThreeDsDetail(game) {
  document.title = `${game.title} | 3DS Library | Games Cards Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "3DS") || "Editorial overview coming soon. This 3DS record is ready for GCX copy, review links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "Nintendo 3DS",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  threeDsDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Nintendo 3DS Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - Nintendo 3DS</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "Nintendo 3DS Game Card / Nintendo eShop")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?trade3dsGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadThreeDsDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    threeDsDetailTarget.innerHTML = `<div class="index-message">No 3DS game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("3ds", id, "data/games/3ds.json?v=1");
    if (!game) {
      threeDsDetailTarget.innerHTML = `<div class="index-message">3DS game not found.</div>`;
      return;
    }
    renderThreeDsDetail(game);
  } catch (error) {
    threeDsDetailTarget.innerHTML = `<div class="index-message">This 3DS game could not be loaded right now.</div>`;
  }
}

loadThreeDsDetail();
