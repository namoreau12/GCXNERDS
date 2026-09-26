const saturnDetailTarget = document.querySelector("#saturn-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, disc condition, case artwork, manual, inserts, and Sega All Stars or limited edition status",
    "Photograph the front cover, back cover, spine, disc front, disc underside, manual, and any bonus discs",
    "Disclose scratches, resurfacing, cracked hubs, sticker residue, water damage, and case damage",
    "Call out Sega NetLink features, backup memory, RAM cartridge, 3D Control Pad, light-gun, multitap, or other accessory requirements",
    "For multi-disc or accessory-heavy games, verify every disc, insert, and controller component before listing",
  ];
}

function renderSaturnDetail(game) {
  document.title = `${game.title} | Saturn Library | Games Cards Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Saturn") || "Editorial overview in review.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "Saturn",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  saturnDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Saturn Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - Saturn</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "CD-ROM")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradeSaturnGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadSaturnDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    saturnDetailTarget.innerHTML = `<div class="index-message">No Saturn game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("saturn", id, "data/games/saturn.json?v=1");
    if (!game) {
      saturnDetailTarget.innerHTML = `<div class="index-message">Saturn game not found.</div>`;
      return;
    }
    renderSaturnDetail(game);
  } catch (error) {
    saturnDetailTarget.innerHTML = `<div class="index-message">This Saturn game could not be loaded right now.</div>`;
  }
}

loadSaturnDetail();

