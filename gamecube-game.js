const gamecubeDetailTarget = document.querySelector("#gamecube-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, disc condition, case/manual completeness, and Player's Choice status",
    "Photograph the front cover, back cover, disc face, disc underside, manual, inserts, and bonus discs if present",
    "Disclose whether the copy is loose disc, complete-in-box, sealed, Player's Choice, or includes special packaging",
    "Check for resurfacing, pinholes, center-ring cracks, rental stickers, case swaps, water damage, and missing memory-card inserts",
    "For high-value titles, include clear photos of disc art, barcode, manual, and all inserts",
  ];
}

function renderGamecubeDetail(game) {
  document.title = `${game.title} | GameCube Library | Games Cards Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "GameCube") || "Editorial overview coming soon. This GameCube record is ready for source-backed GCX copy, review links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "GameCube",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  gamecubeDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Nintendo GameCube Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - Nintendo GameCube</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "Optical disc")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradeGamecubeGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadGamecubeDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    gamecubeDetailTarget.innerHTML = `<div class="index-message">No GameCube game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("gamecube", id, "data/games/gamecube.json?v=1");
    if (!game) {
      gamecubeDetailTarget.innerHTML = `<div class="index-message">GameCube game not found.</div>`;
      return;
    }
    renderGamecubeDetail(game);
  } catch (error) {
    gamecubeDetailTarget.innerHTML = `<div class="index-message">This GameCube game could not be loaded right now.</div>`;
  }
}

loadGamecubeDetail();
