const ps3DetailTarget = document.querySelector("#ps3-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, disc condition, case/manual completeness, and edition label",
    "Photograph the front cover, back cover, disc face, disc underside, manual, inserts, and any bundled codes or bonus discs",
    "Disclose whether the copy is loose disc, complete-in-box, sealed, Greatest Hits, Platinum, or digital-only",
    "Check for resurfacing, center-ring cracks, rental stickers, case swaps, expired DLC vouchers, and missing installation notes",
    "For online-heavy games, clearly disclose server status, required patches, passes, and digital-only limitations",
  ];
}

function renderPs3Detail(game) {
  document.title = `${game.title} | PS3 Library | Games Cards Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PS3") || "Editorial overview coming soon. This PS3 record is ready for source-backed GCX copy, review links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    ...(game.options || []).slice(0, 2),
    "PS3",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  ps3DetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">PlayStation 3 Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || "Release year unknown")} - PlayStation 3</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml((game.options || []).slice(0, 2).join(", ") || "Retail/digital release")}</span>
        <span>${escapeHtml(game.format || "Blu-ray/digital")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradePs3Game=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadPs3Detail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    ps3DetailTarget.innerHTML = `<div class="index-message">No PS3 game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("ps3", id, "data/games/ps3.json?v=1");
    if (!game) {
      ps3DetailTarget.innerHTML = `<div class="index-message">PS3 game not found.</div>`;
      return;
    }
    renderPs3Detail(game);
  } catch (error) {
    ps3DetailTarget.innerHTML = `<div class="index-message">This PS3 game could not be loaded right now.</div>`;
  }
}

loadPs3Detail();
