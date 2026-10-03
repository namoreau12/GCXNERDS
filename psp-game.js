const pspDetailTarget = document.querySelector("#psp-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, UMD shell, disc condition, case artwork, manual, inserts, and edition label",
    "Photograph the front cover, back cover, spine, UMD front, UMD back, manual, and any voucher inserts",
    "Disclose cracks in the UMD shell, loose UMD doors, sticker residue, water damage, resurfacing, and case swaps",
    "Call out Greatest Hits, Essentials, import, demo, Not for Resale, bundle, and digital-only status",
    "For high-value titles, verify matching region codes across disc, case, manual, and inserts",
  ];
}

function renderPspDetail(game) {
  document.title = `${game.title} | PSP Library | GCXNerds`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PSP") || "Editorial overview coming soon. This PSP record is ready for GCX copy, review links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "PSP",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  pspDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">PSP Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - PSP</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "UMD / PlayStation Store")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradePspGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadPspDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    pspDetailTarget.innerHTML = `<div class="index-message">No PSP game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("psp", id, "data/games/psp.json?v=1");
    if (!game) {
      pspDetailTarget.innerHTML = `<div class="index-message">PSP game not found.</div>`;
      return;
    }
    renderPspDetail(game);
  } catch (error) {
    pspDetailTarget.innerHTML = `<div class="index-message">This PSP game could not be loaded right now.</div>`;
  }
}

loadPspDetail();
