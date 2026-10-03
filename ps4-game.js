const ps4DetailTarget = document.querySelector("#ps4-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, disc condition, case/manual completeness, edition, and upgrade path",
    "Photograph the front cover, back cover, disc face, disc underside, inserts, and any bundled voucher cards",
    "Disclose whether the copy is loose disc, complete-in-box, sealed, PlayStation Hits, SteelBook, collector's edition, or digital-only",
    "Check for expired DLC vouchers, missing art inserts, case swaps, rental stickers, resurfacing, and online-only dependencies",
    "For VR, camera, Move, online, or Pro-enhanced games, clearly disclose hardware and patch requirements",
  ];
}

function renderPs4Detail(game) {
  document.title = `${game.title} | PS4 Library | Games Exchange`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PS4") || "Editorial overview coming soon. This PS4 record is ready for source-backed GCX copy, source links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "Needs overview"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    ...(game.addons || []).slice(0, 2),
    "PS4",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  ps4DetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">PlayStation 4 Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || "Release year unknown")} - PlayStation 4</p>
      <div class="detail-meta">
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
        <span>${escapeHtml(game.format || "Blu-ray/digital")}</span>
      </div>
      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>
      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>
      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>
      <p class="detail-section-title">Data Status</p>
      <div class="console-tags">${tags}</div>
      <a class="button list-trade-button" href="index.html?tradePs4Game=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadPs4Detail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    ps4DetailTarget.innerHTML = `<div class="index-message">No PS4 game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("ps4", id, "data/games/ps4.json?v=1");
    if (!game) {
      ps4DetailTarget.innerHTML = `<div class="index-message">PS4 game not found.</div>`;
      return;
    }
    renderPs4Detail(game);
  } catch (error) {
    ps4DetailTarget.innerHTML = `<div class="index-message">This PS4 game could not be loaded right now.</div>`;
  }
}

loadPs4Detail();
