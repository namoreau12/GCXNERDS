const gbaDetailTarget = document.querySelector("#gba-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify cartridge shell, label condition, region, and board authenticity for high-value titles",
    "Photograph the front label, back shell, cartridge contacts, and board for expensive or commonly counterfeited games",
    "Disclose whether the copy is loose, complete-in-box, sealed, Player's Choice, or includes manual/inserts",
    "Check battery-backed saves, label lifting, marker, rental stickers, shell cracks, corrosion, and sun fading",
    "For special cartridges, disclose rumble, tilt, solar sensor, wireless adapter, e-Reader, or multiplayer accessory requirements",
  ];
}

function renderGbaDetail(game) {
  document.title = `${game.title} | GBA Library | Games Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "GBA") || "Editorial overview coming soon. This GBA record is ready for source-backed GCX copy, source links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "Needs overview"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "GBA",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  gbaDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Game Boy Advance Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - Game Boy Advance</p>
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
      <a class="button list-trade-button" href="index.html?tradeGbaGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadGbaDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    gbaDetailTarget.innerHTML = `<div class="index-message">No GBA game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("gba", id, "data/games/gba.json?v=1");
    if (!game) {
      gbaDetailTarget.innerHTML = `<div class="index-message">GBA game not found.</div>`;
      return;
    }
    renderGbaDetail(game);
  } catch (error) {
    gbaDetailTarget.innerHTML = `<div class="index-message">This GBA game could not be loaded right now.</div>`;
  }
}

loadGbaDetail();
