const xboxDetailTarget = document.querySelector("#xbox-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, disc condition, case artwork, manual, inserts, and Platinum Hits or special edition status",
    "Photograph the front cover, back cover, spine, disc front, disc underside, manual, and any bonus discs",
    "Disclose scratches, resurfacing, cracked hubs, sticker residue, water damage, and case damage",
    "Call out Xbox Live, system link, downloadable content, headset, communicator, or special controller requirements",
    "For multi-disc or accessory-heavy games, verify every disc, insert, and controller component before listing",
  ];
}

function renderXboxDetail(game) {
  document.title = `${game.title} | Original Xbox Library | Games Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Original Xbox") || "Editorial overview coming soon. This Original Xbox record is ready for GCX copy, source links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "Needs overview"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "Original Xbox",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  xboxDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Original Xbox Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - Original Xbox</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "Xbox DVD")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradeXboxGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadXboxDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    xboxDetailTarget.innerHTML = `<div class="index-message">No Original Xbox game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("xbox", id, "data/games/xbox.json?v=1");
    if (!game) {
      xboxDetailTarget.innerHTML = `<div class="index-message">Original Xbox game not found.</div>`;
      return;
    }
    renderXboxDetail(game);
  } catch (error) {
    xboxDetailTarget.innerHTML = `<div class="index-message">This Original Xbox game could not be loaded right now.</div>`;
  }
}

loadXboxDetail();
