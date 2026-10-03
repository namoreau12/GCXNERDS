const state = {
  data: null,
  cards: [],
  query: "",
  category: "all",
  rarity: "all",
};

const els = {
  updated: document.querySelector("#pokemon-30-updated"),
  total: document.querySelector("#pokemon-30-total"),
  validation: document.querySelector("#pokemon-30-validation"),
  mainCount: document.querySelector("#pokemon-30-main-count"),
  promoCount: document.querySelector("#pokemon-30-promo-count"),
  classicCount: document.querySelector("#pokemon-30-classic-count"),
  energyCount: document.querySelector("#pokemon-30-energy-count"),
  search: document.querySelector("#pokemon-30-search"),
  category: document.querySelector("#pokemon-30-category"),
  rarity: document.querySelector("#pokemon-30-rarity"),
  count: document.querySelector("#pokemon-30-count"),
  grid: document.querySelector("#pokemon-30-grid"),
  chase: document.querySelector("#pokemon-30-chase"),
  spotlights: document.querySelector("#pokemon-30-spotlights"),
  manifest: document.querySelector("#pokemon-30-manifest"),
  lightbox: document.querySelector("#pokemon-30-lightbox"),
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cardAnchor(card) {
  return `card-${card.id}`;
}

function imageMarkup(card, className = "pokemon-30-card-image", interactive = true) {
  if (!card.imageUrl) {
    return `<div class="${className} pokemon-30-placeholder">
      <span>Image not yet officially available</span>
      <small>${escapeHtml(card.number)}</small>
    </div>`;
  }
  if (!interactive) {
    return `<div class="${className}">
      <img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.altText)}" loading="lazy" decoding="async" />
    </div>`;
  }
  return `<button class="${className} pokemon-30-image-button" type="button" data-lightbox="${escapeHtml(card.id)}">
    <img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.altText)}" loading="lazy" decoding="async" />
  </button>`;
}

function filterCards() {
  const query = state.query.trim().toLowerCase();
  return state.cards.filter((card) => {
    const matchesCategory = state.category === "all" || card.category === state.category || card.collection === state.category;
    const matchesRarity = state.rarity === "all" || card.rarity === state.rarity;
    const haystack = [card.name, card.number, card.rarity, card.rarityCode, card.artist, card.pokemonType, card.category, card.collection]
      .join(" ")
      .toLowerCase();
    return matchesCategory && matchesRarity && (!query || haystack.includes(query));
  });
}

function populateSelect(select, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function renderStats() {
  const counts = state.cards.reduce((acc, card) => {
    acc[card.collection] = (acc[card.collection] || 0) + 1;
    return acc;
  }, {});
  els.updated.textContent = new Date(state.data.set.lastUpdated).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  els.total.textContent = `${state.cards.length} cards`;
  els.validation.textContent = state.data.validation.warnings.length ? `${state.data.validation.warnings.length} warnings` : "No duplicate images";
  els.mainCount.textContent = counts["Main Set"] || 0;
  els.promoCount.textContent = counts.Promo || 0;
  els.classicCount.textContent = counts["Classic Collection"] || 0;
  els.energyCount.textContent = counts.Energy || 0;
}

function renderGrid() {
  const cards = filterCards();
  els.count.textContent = `${cards.length} shown`;
  els.grid.innerHTML = cards
    .map(
      (card) => `<a class="pokemon-30-tile" href="#${cardAnchor(card)}">
        ${imageMarkup(card, "pokemon-30-thumb", false)}
        <span>${escapeHtml(card.number)}</span>
        <strong>${escapeHtml(card.name)}</strong>
        <small>${escapeHtml(card.rarity)}</small>
      </a>`
    )
    .join("");
  bindLightboxButtons();
}

function renderChase() {
  const chaseNumbers = new Set(["149/128", "150/128", "157/128", "158/128", "023/128"]);
  const cards = state.cards.filter((card) => chaseNumbers.has(card.number) || ["Charizard 4/102", "Lugia 149/147"].includes(card.name));
  els.chase.innerHTML = cards
    .map(
      (card) => `<article class="pokemon-30-feature-card">
        ${imageMarkup(card)}
        <div>
          <p class="kicker">${escapeHtml(card.rarity)}</p>
          <h3>${escapeHtml(card.name)}</h3>
          <p>${escapeHtml(card.collectorNotes)}</p>
          <a href="#${cardAnchor(card)}">Open spotlight</a>
        </div>
      </article>`
    )
    .join("");
  bindLightboxButtons();
}

function renderSpotlights() {
  els.spotlights.innerHTML = state.cards
    .map(
      (card) => `<article id="${cardAnchor(card)}" class="pokemon-30-spotlight">
        <div class="pokemon-30-card-art">${imageMarkup(card)}</div>
        <div class="pokemon-30-card-copy">
          <p class="kicker">${escapeHtml(card.collection)} / ${escapeHtml(card.category)}</p>
          <h3>${escapeHtml(card.name)}</h3>
          <p class="pokemon-30-meta">${escapeHtml(card.number)} • ${escapeHtml(card.rarity)}${card.pokemonType ? ` • ${escapeHtml(card.pokemonType)}` : ""}${card.artist ? ` • Illus. ${escapeHtml(card.artist)}` : ""}</p>
          <h4>The Card</h4>
          <p>${escapeHtml(card.editorialSummary)}</p>
          <h4>Why Collectors May Care</h4>
          <p>${escapeHtml(card.collectorNotes)}</p>
          <h4>GCX Detail</h4>
          <p>${escapeHtml(card.artworkDetails)}</p>
          <div class="pokemon-30-source-row">
            <a href="${escapeHtml(card.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a>
            ${card.detailUrl ? `<a href="${escapeHtml(card.detailUrl)}" target="_blank" rel="noopener noreferrer">Card page</a>` : ""}
            ${card.marketData?.rawPrice ? `<span>Market snapshot ${escapeHtml(card.marketData.snapshotDate)}: ${escapeHtml(card.marketData.rawPrice)}</span>` : ""}
          </div>
        </div>
      </article>`
    )
    .join("");
  bindLightboxButtons();
}

function renderManifest() {
  const rows = state.cards
    .map(
      (card) => `<tr>
        <td>${escapeHtml(card.number)}</td>
        <td>${escapeHtml(card.name)}</td>
        <td>${card.imageUrl ? `<a href="${escapeHtml(card.imageUrl)}" target="_blank" rel="noopener noreferrer">Image</a>` : "IMAGE NOT YET OFFICIALLY AVAILABLE"}</td>
        <td>${escapeHtml(card.imageSource || card.sourceUrl)}</td>
        <td>${card.imageVerified ? "Verified" : "Placeholder"}</td>
        <td>${escapeHtml(card.altText)}</td>
      </tr>`
    )
    .join("");
  els.manifest.innerHTML = `<div class="pokemon-30-warning">
    <strong>Validation:</strong> ${state.data.validation.warnings.length ? "DUPLICATE_CARD_IMAGE_DETECTED" : "No duplicate image URLs detected."}
    <br />Missing image placeholders: ${state.data.validation.missingImages.length}
  </div>
  <div class="pokemon-30-table-wrap">
    <table>
      <thead><tr><th>Card</th><th>Name</th><th>Image</th><th>Image Source</th><th>Verified</th><th>Alt Text</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function bindLightboxButtons() {
  document.querySelectorAll("[data-lightbox]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const card = state.cards.find((item) => item.id === button.dataset.lightbox);
      if (!card || !card.imageUrl) return;
      els.lightbox.querySelector("img").src = card.imageUrl;
      els.lightbox.querySelector("img").alt = card.altText;
      els.lightbox.querySelector("p").textContent = `${card.name} • ${card.number}`;
      els.lightbox.hidden = false;
    });
  });
}

function bindEvents() {
  els.search.addEventListener("input", () => {
    state.query = els.search.value;
    renderGrid();
  });
  els.category.addEventListener("change", () => {
    state.category = els.category.value;
    renderGrid();
  });
  els.rarity.addEventListener("change", () => {
    state.rarity = els.rarity.value;
    renderGrid();
  });
  els.lightbox.querySelector("button").addEventListener("click", () => {
    els.lightbox.hidden = true;
  });
  els.lightbox.addEventListener("click", (event) => {
    if (event.target === els.lightbox) els.lightbox.hidden = true;
  });
}

async function init() {
  const response = await fetch("data/pokemon-30th-celebration.json");
  state.data = await response.json();
  state.cards = state.data.cards;
  populateSelect(els.category, [...new Set(state.cards.map((card) => card.category))].sort());
  populateSelect(els.rarity, [...new Set(state.cards.map((card) => card.rarity))].sort());
  renderStats();
  renderGrid();
  renderChase();
  renderSpotlights();
  renderManifest();
  bindEvents();
}

init().catch((error) => {
  console.error(error);
  els.count.textContent = "Could not load Pokemon 30th Celebration data.";
});
