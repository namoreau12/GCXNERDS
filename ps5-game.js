const ps5DetailTarget = document.querySelector("#ps5-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, disc condition, case completeness, edition, and upgrade path",
    "Photograph the front cover, back cover, disc face, disc underside, inserts, and any bundled voucher cards",
    "Disclose whether the copy is physical, sealed, complete-in-box, collector's edition, launch edition, or digital-only",
    "Check for expired DLC vouchers, missing art inserts, case swaps, online-only dependencies, and PS5 Pro or VR requirements",
    "For live-service or upgrade-heavy games, clearly disclose required patches, server status, subscriptions, and included content",
  ];
}

function renderPs5Detail(game) {
  document.title = `${game.title} | PS5 Library | Games Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PS5") || "Editorial overview coming soon. This PS5 record is ready for source-backed GCX copy, source links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "Needs overview"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    ...(game.addons || []).slice(0, 2),
    "PS5",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  ps5DetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">PlayStation 5 Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || "Release year unknown")} - PlayStation 5</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "Ultra HD Blu-ray/digital")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradePs5Game=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadPs5Detail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    ps5DetailTarget.innerHTML = `<div class="index-message">No PS5 game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("ps5", id, "data/games/ps5.json?v=1");
    if (!game) {
      ps5DetailTarget.innerHTML = `<div class="index-message">PS5 game not found.</div>`;
      return;
    }
    renderPs5Detail(game);
  } catch (error) {
    ps5DetailTarget.innerHTML = `<div class="index-message">This PS5 game could not be loaded right now.</div>`;
  }
}

loadPs5Detail();
