const gameboyDetailTarget = document.querySelector("#gameboy-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify cartridge shell, label condition, region, and board authenticity for high-value titles",
    "Photograph the front label, back shell, cartridge contacts, and board for expensive or commonly counterfeited games",
    "Disclose whether the copy is loose, complete-in-box, sealed, Player's Choice, or includes manual/inserts",
    "Check battery-backed saves, label lifting, marker, rental stickers, shell cracks, corrosion, and sun fading",
    "For Game Boy Color titles, disclose Dual Mode support, clear/black cartridge style, rumble, tilt, or GBA special features when relevant",
  ];
}

function renderGameboyDetail(game) {
  document.title = `${game.title} | Game Boy Library | Games Cards Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Game Boy") || "Editorial overview coming soon. This Game Boy record is ready for source-backed GCX copy, review links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    game.dualMode === "Yes" ? "Dual Mode" : "",
    game.cartridgeFeature || "",
    game.id.startsWith("gbc-") ? "GBC" : "GB",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  gameboyDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">${escapeHtml(game.id.startsWith("gbc-") ? "Game Boy Color Game" : "Game Boy Game")}</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - ${escapeHtml(game.platform)}</p>
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
      <a class="button list-trade-button" href="index.html?tradeGameboyGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadGameboyDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    gameboyDetailTarget.innerHTML = `<div class="index-message">No Game Boy game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("gameboy", id, "data/games/gameboy.json?v=1");
    if (!game) {
      gameboyDetailTarget.innerHTML = `<div class="index-message">Game Boy game not found.</div>`;
      return;
    }
    renderGameboyDetail(game);
  } catch (error) {
    gameboyDetailTarget.innerHTML = `<div class="index-message">This Game Boy game could not be loaded right now.</div>`;
  }
}

loadGameboyDetail();
