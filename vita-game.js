const vitaDetailTarget = document.querySelector("#vita-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, Vita card label, contacts, case artwork, manual or insert sheet, and edition label",
    "Photograph the front cover, back cover, spine, card front, card back, inserts, and any Limited Run or Asian-English markings",
    "Disclose loose card, complete-in-box, sealed, import, Limited Run, Play-Asia, Asian-English, or digital-only status",
    "Call out DLC dependency, online shutdown impact, cross-buy status, PlayStation TV compatibility, and touch/camera requirements",
    "For high-value Vita titles, verify matching region codes across card, case, cover art, and inserts",
  ];
}

function renderVitaDetail(game) {
  document.title = `${game.title} | PS Vita Library | Games Cards Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PS Vita") || "Editorial overview coming soon. This PS Vita record is ready for GCX copy, review links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    game.psTvCompatible ? `PS TV: ${game.psTvCompatible}` : "PS Vita",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  vitaDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">PS Vita Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - PS Vita</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "PS Vita Card / PlayStation Store")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradeVitaGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadVitaDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    vitaDetailTarget.innerHTML = `<div class="index-message">No PS Vita game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("vita", id, "data/games/vita.json?v=1");
    if (!game) {
      vitaDetailTarget.innerHTML = `<div class="index-message">PS Vita game not found.</div>`;
      return;
    }
    renderVitaDetail(game);
  } catch (error) {
    vitaDetailTarget.innerHTML = `<div class="index-message">This PS Vita game could not be loaded right now.</div>`;
  }
}

loadVitaDetail();
