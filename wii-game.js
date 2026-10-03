const wiiDetailTarget = document.querySelector("#wii-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, disc condition, case artwork, manual, inserts, and Nintendo Selects or bundle status",
    "Photograph the front cover, back cover, spine, disc front, disc underside, manual, and any included accessories",
    "Disclose scratches, resurfacing, cracked hubs, sticker residue, water damage, and case damage",
    "Call out required accessories such as Wii MotionPlus, Balance Board, Wii Wheel, Zapper, microphone, or instruments",
    "For high-value games, confirm matching region across disc, cover art, manual, and case before listing",
  ];
}

function renderWiiDetail(game) {
  document.title = `${game.title} | Wii Library | GCXNerds`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Wii") || "Editorial overview coming soon. This Wii record is ready for GCX copy, review links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "Nintendo Wii",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  wiiDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Nintendo Wii Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - Nintendo Wii</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "Wii optical disc")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradeWiiGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadWiiDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    wiiDetailTarget.innerHTML = `<div class="index-message">No Wii game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("wii", id, "data/games/wii.json?v=1");
    if (!game) {
      wiiDetailTarget.innerHTML = `<div class="index-message">Wii game not found.</div>`;
      return;
    }
    renderWiiDetail(game);
  } catch (error) {
    wiiDetailTarget.innerHTML = `<div class="index-message">This Wii game could not be loaded right now.</div>`;
  }
}

loadWiiDetail();
