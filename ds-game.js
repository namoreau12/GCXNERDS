const dsDetailTarget = document.querySelector("#ds-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, serial code, label condition, contacts, and whether the game card is authentic",
    "Photograph the front label, back code, case spine, manual, inserts, and any bundled accessory",
    "Disclose whether the copy is loose, complete-in-box, sealed, Not for Resale, or a later print",
    "Test save behavior, touch controls, microphone features, local wireless, and online-only features where relevant",
    "For Pokemon and other high-value titles, inspect shell color, PCB, label print quality, and matching case/manual region",
  ];
}

function renderDsDetail(game) {
  document.title = `${game.title} | DS Library | Games Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "DS") || "Editorial overview coming soon. This DS record is ready for GCX copy, review links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "Nintendo DS",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  dsDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Nintendo DS Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - Nintendo DS</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "Nintendo DS Game Card")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradeDsGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadDsDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    dsDetailTarget.innerHTML = `<div class="index-message">No DS game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("ds", id, "data/games/ds.json?v=1");
    if (!game) {
      dsDetailTarget.innerHTML = `<div class="index-message">DS game not found.</div>`;
      return;
    }
    renderDsDetail(game);
  } catch (error) {
    dsDetailTarget.innerHTML = `<div class="index-message">This DS game could not be loaded right now.</div>`;
  }
}

loadDsDetail();
