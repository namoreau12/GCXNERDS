const genesisDetailTarget = document.querySelector("#genesis-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getChecklist() {
  return [
    "Verify whether the copy is Genesis, Mega Drive, PAL, Japan, Brazil, or another regional release",
    "Photograph the front label, spine/top label, back shell, contacts, manual, case, and inserts",
    "Disclose clamshell versus cardboard packaging, rental stickers, sun fading, label lift, cracks, and writing",
    "For higher-value games, photograph the board and check for reproduction shells, labels, and PCBs",
    "List whether the copy is loose, complete-in-box, sealed, Not for Resale, or a later budget-line release",
  ];
}

function renderGenesisDetail(game) {
  document.title = `${game.title} | Genesis Library | GCXNerds`;
  const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
  const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Genesis") || "Editorial overview coming soon. This Genesis record is ready for GCX copy, review links, regional notes, and collector context.";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review"),
    (game.releasedRegions || []).join(", ") || "Region unknown",
    game.imageProvider ? "Box art matched" : "Image pending",
    "Genesis",
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

  genesisDetailTarget.innerHTML = `
    <div class="game-detail-art">${imageMarkup}</div>
    <div class="console-detail-copy">
      <p class="kicker">Sega Genesis Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml((game.releaseYears || []).join(", ") || game.firstReleased || "Release year unknown")} - Sega Genesis / Mega Drive</p>
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
      <a class="button list-trade-button" href="index.html?tradeGenesisGame=${encodeURIComponent(game.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadGenesisDetail() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    genesisDetailTarget.innerHTML = `<div class="index-message">No Genesis game was selected.</div>`;
    return;
  }
  try {
    const game = await window.GCX_GAME_DATA.loadDetail("genesis", id, "data/games/genesis.json?v=1");
    if (!game) {
      genesisDetailTarget.innerHTML = `<div class="index-message">Genesis game not found.</div>`;
      return;
    }
    renderGenesisDetail(game);
  } catch (error) {
    genesisDetailTarget.innerHTML = `<div class="index-message">This Genesis game could not be loaded right now.</div>`;
  }
}

loadGenesisDetail();
