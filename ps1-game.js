const ps1DetailTarget = document.querySelector("#ps1-detail");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify region, disc condition, case/manual completeness, and edition label",
    "Photograph the front cover, back cover, disc face, disc underside, manual, and registration inserts",
    "Disclose whether the copy is loose disc, complete-in-box, sealed, Greatest Hits, Platinum, or black-label",
    "Check for resurfacing, pinholes, cracks near the center ring, rental stickers, case swaps, and water damage",
    "For multi-disc games, confirm every disc is present and matched to the same region",
  ];
}

function renderPs1Detail(game) {
  document.title = `${game.title} | PS1 Library | Games Exchange`;

  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl
    ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />`
    : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PS1") || "Editorial overview coming soon. This PS1 record is ready for source-backed GCX copy, source links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "Needs overview"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "PS1",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  ps1DetailTarget.innerHTML = `
    <div class="game-detail-art">
      ${imageMarkup}
    </div>
    <div class="console-detail-copy">
      <p class="kicker">PlayStation Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || "Release year unknown")} - PlayStation</p>

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

      <a class="button list-trade-button" href="index.html?tradePs1Game=${encodeURIComponent(game.id)}#cards">
        Join beta waitlist</a>
    </div>
  `;
}

async function loadPs1Detail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    ps1DetailTarget.innerHTML = `<div class="index-message">No PS1 game was selected.</div>`;
    return;
  }

  try {
    const game = await window.GCX_GAME_DATA.loadDetail("ps1", id, "data/games/ps1.json?v=1");
    if (!game) {
      ps1DetailTarget.innerHTML = `<div class="index-message">PS1 game not found.</div>`;
      return;
    }
    renderPs1Detail(game);
  } catch (error) {
    ps1DetailTarget.innerHTML = `<div class="index-message">This PS1 game could not be loaded right now.</div>`;
  }
}

loadPs1Detail();
