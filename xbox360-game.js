const xbox360DetailTarget = document.querySelector("#xbox360-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, disc condition, case artwork, manual, inserts, and Platinum Hits or special edition status",
    "Photograph the front cover, back cover, spine, disc front, disc underside, manual, and any bonus discs",
    "Disclose install issues, scratches, resurfacing, cracked hubs, sticker residue, water damage, and missing case tabs",
    "Call out DLC cards, online pass codes, expansion discs, Kinect requirements, and whether included codes are redeemed",
    "For multi-disc games, verify every disc number, matching region, and matching case artwork before listing",
  ];
}

function renderXbox360Detail(game) {
  document.title = `${game.title} | Xbox 360 Library | Games Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} image" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Xbox 360") || "Editorial overview coming soon. This Xbox 360 record is ready for GCX copy, source links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "Needs overview"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Image matched" : "Image pending",
    ...(game.featureFlags || []),
    "Xbox 360",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  xbox360DetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Xbox 360 Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - Xbox 360</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.genres || []).slice(0, 3).join(", ") || "Genre unknown")}</span>
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradeXbox360Game=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadXbox360Detail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    xbox360DetailTarget.innerHTML = `<div class="index-message">No Xbox 360 game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("xbox360", id, "data/games/xbox360.json?v=1");
    if (!game) {
      xbox360DetailTarget.innerHTML = `<div class="index-message">Xbox 360 game not found.</div>`;
      return;
    }
    renderXbox360Detail(game);
  } catch (error) {
    xbox360DetailTarget.innerHTML = `<div class="index-message">This Xbox 360 game could not be loaded right now.</div>`;
  }
}

loadXbox360Detail();
