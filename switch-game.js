const switchDetailTarget = document.querySelector("#switch-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify whether the listing is a physical game card, download code, code-in-box, import, or digital-only release",
    "Photograph the front cover, back cover, spine, cartridge, case interior, inserts, and any included code sheets",
    "Disclose whether codes, DLC, expansion passes, or bonus content have been redeemed",
    "Check cartridge label condition, contacts, case cracks, cover-art water damage, and regional rating marks",
    "For high-demand Nintendo titles, confirm the exact edition, print variant, bundle status, and sealed condition",
  ];
}

function renderSwitchDetail(game) {
  document.title = `${game.title} | Switch Library | GCXNerds`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} image" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Switch") || "Editorial overview coming soon. This Switch record is ready for GCX copy, review links, physical/digital notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    game.imageProvider ? "Image matched" : "Image pending",
    "Nintendo Switch",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  switchDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Nintendo Switch Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml(game.releaseDateDisplay || (game.releaseYears || []).join(", ") || "Release date unknown")} - Nintendo Switch</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "Nintendo Switch game")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradeSwitchGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadSwitchDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    switchDetailTarget.innerHTML = `<div class="index-message">No Switch game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("switch", id, "data/games/switch.json?v=1");
    if (!game) {
      switchDetailTarget.innerHTML = `<div class="index-message">Switch game not found.</div>`;
      return;
    }
    renderSwitchDetail(game);
  } catch (error) {
    switchDetailTarget.innerHTML = `<div class="index-message">This Switch game could not be loaded right now.</div>`;
  }
}

loadSwitchDetail();
