const switch2DetailTarget = document.querySelector("#switch2-detail");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(game) {
  if (game.releaseDateDisplay) return game.releaseDateDisplay;
  if (!game.releaseDate) return game.releaseYear || "Date unknown";

  const date = new Date(game.releaseDate);
  if (Number.isNaN(date.getTime())) return game.releaseYear || "Date unknown";

  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getChecklist(game) {
  const checks = [
    "Verify region, edition, cover art, case condition, and cartridge or game-key card status",
    "For digital codes, confirm whether the code is unused before listing",
    "Photograph front cover, back cover, cartridge/card, insert, and any included extras",
    "Disclose whether the listing is physical, game-key card, sealed, opened, or digital-only",
  ];

  if ((game.availability || []).some((value) => /pre-order/i.test(value))) {
    checks.push("For preorder listings, disclose estimated release date and seller fulfillment risk");
  }

  return checks;
}

function renderSwitch2Detail(game) {
  document.title = `${game.title} | Switch 2 Library | Games Cards Exchange`;

  const initials = game.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("");
  const imageMarkup = game.imageUrl
    ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" />`
    : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const availability = (game.availability || []).join(", ") || "Nintendo Store recognized";
  const price = Number.isFinite(game.priceUsd) ? `$${game.priceUsd.toFixed(2)} USD` : "Price unavailable";
  const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const tags = [
    window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || "In editorial review",
    game.nsuid ? `NSUID ${game.nsuid}` : "",
    game.coverTypeLabel || "",
    game.esrbRating || "",
    game.edition || "",
    price,
  ].filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Switch 2") || "Editorial overview coming soon. This Switch 2 record is ready for source-backed GCX copy, review links, edition notes, and marketplace context.";

  switch2DetailTarget.innerHTML = `
    <div class="game-detail-art">
      ${imageMarkup}
    </div>
    <div class="console-detail-copy">
      <p class="kicker">Nintendo Switch 2 Game</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml(formatDate(game))} - ${escapeHtml(availability)}</p>

      <div class="detail-meta">
        <span>${escapeHtml((game.genres || []).slice(0, 3).join(", ") || "Genre unknown")}</span>
        <span>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</span>
        <span>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</span>
      </div>

      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(overview)}</div>

      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>

      <p class="detail-section-title">Cover Type</p>
      <div class="console-detail-note">${escapeHtml(game.coverTypeNote || "Cover type has not been classified yet.")}</div>

      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>

      <p class="detail-section-title">Nintendo Store Data</p>
      <div class="console-tags">${tags}</div>

      <a class="button list-trade-button" href="index.html?tradeSwitch2Game=${encodeURIComponent(game.id)}#cards">
        Join beta waitlist</a>
    </div>
  `;
}

async function loadSwitch2Detail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    switch2DetailTarget.innerHTML = `<div class="index-message">No Switch 2 game was selected.</div>`;
    return;
  }

  try {
    const game = await window.GCX_GAME_DATA.loadDetail("switch2", id, "data/games/switch2.json?v=5");

    if (!game) {
      switch2DetailTarget.innerHTML = `<div class="index-message">Switch 2 game not found.</div>`;
      return;
    }

    renderSwitch2Detail(game);
  } catch (error) {
    switch2DetailTarget.innerHTML = `<div class="index-message">This Switch 2 game could not be loaded right now.</div>`;
  }
}

loadSwitch2Detail();
