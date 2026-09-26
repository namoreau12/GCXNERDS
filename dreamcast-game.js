const dreamcastDetailTarget = document.querySelector("#dreamcast-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, disc condition, case artwork, manual, inserts, and Sega All Stars or limited edition status",
    "Photograph the front cover, back cover, spine, disc front, disc underside, manual, and any bonus discs",
    "Disclose scratches, resurfacing, cracked hubs, sticker residue, water damage, and case damage",
    "Call out online features, VMU extras, VGA support, microphone, maraca, fishing controller, light-gun, keyboard, or other accessory requirements",
    "For multi-disc or accessory-heavy games, verify every disc, insert, and controller component before listing",
  ];
}

function renderDreamcastDetail(game) {
  document.title = `${game.title} | Dreamcast Library | Games Cards Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Dreamcast") || "Editorial overview in review.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "Dreamcast",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  dreamcastDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Dreamcast Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - Dreamcast</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "GD-ROM")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradeDreamcastGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadDreamcastDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    dreamcastDetailTarget.innerHTML = `<div class="index-message">No Dreamcast game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("dreamcast", id, "data/games/dreamcast.json?v=1");
    if (!game) {
      dreamcastDetailTarget.innerHTML = `<div class="index-message">Dreamcast game not found.</div>`;
      return;
    }
    renderDreamcastDetail(game);
  } catch (error) {
    dreamcastDetailTarget.innerHTML = `<div class="index-message">This Dreamcast game could not be loaded right now.</div>`;
  }
}

loadDreamcastDetail();
