const yugiohSetSearch = document.querySelector("#yugioh-set-search");
const yugiohYearList = document.querySelector("#yugioh-year-list");
const yugiohSetsGrid = document.querySelector("#yugioh-sets-grid");
const yugiohCardsGrid = document.querySelector("#yugioh-cards-grid");
const yugiohCardDetail = document.querySelector("#yugioh-card-detail");
const yugiohCardSearch = document.querySelector("#yugioh-card-search");
const yugiohCardSearchButton = document.querySelector("#yugioh-card-search-button");
const yugiohCardSearchResults = document.querySelector("#yugioh-card-search-results");
const selectedYugiohSet = document.querySelector("#selected-yugioh-set");
const selectedYugiohYearTitle = document.querySelector("#selected-yugioh-year-title");
const yugiohYearCount = document.querySelector("#yugioh-year-count");
const yugiohSetsCount = document.querySelector("#yugioh-sets-count");

let yugiohSets = [];
let groupedYears = new Map();
let activeYear = "";
let activeSetId = "";
let activePrintingId = "";
let yugiohCardSearchTimeout = 0;
const yugiohCardsBySet = new Map();

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function setMessage(target, message) {
  target.innerHTML = `<div class="index-message">${message}</div>`;
}

function formatCurrency(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `$${amount.toFixed(2)}` : "";
}

function getCardUrl(card) {
  return `yugioh-card.html?set=${encodeURIComponent(card.setId)}&id=${encodeURIComponent(card.printingId)}`;
}

function getSetCardsUrl(setId) {
  return `/api/yugioh/sets/${encodeURIComponent(setId)}`;
}

function getCardImage(card, size = "small") {
  if (size === "normal") {
    return card.imageFront || card.images?.normal || card.imageThumbnail || card.images?.small || card.imageUrl || "";
  }
  return card.imageThumbnail || card.images?.small || card.imageFront || card.images?.normal || card.imageUrl || "";
}

function renderCardImage(card, imageUrl, context = "grid") {
  if (window.GCX_TCG_MEDIA?.renderImage) {
    return window.GCX_TCG_MEDIA.renderImage(card, {
      imageUrl,
      name: card.name,
      alt: `${card.name} card image`,
      size: context === "detail" ? "normal" : "small",
      showPolicyNote: context === "detail",
    });
  }
  return imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(card.name)} card image" loading="lazy" />` : "";
}

function getFilteredYears() {
  const query = normalize(yugiohSetSearch.value);
  return Array.from(groupedYears.entries()).filter(([year, sets]) => {
    const yearMatch = normalize(year).includes(query);
    const setMatch = sets.some((set) => normalize(`${set.name} ${set.setCode} ${set.tcgDate}`).includes(query));
    return !query || yearMatch || setMatch;
  });
}

function renderYugiohYears() {
  const filtered = getFilteredYears();
  yugiohYearCount.textContent = `${filtered.length} years`;
  yugiohYearList.innerHTML = filtered
    .map(([year, sets]) => `
      <button class="series-button${year === activeYear ? " is-active" : ""}" type="button" data-year="${escapeHtml(year)}">
        <strong>${escapeHtml(year)}</strong>
        <span>${sets.length} sets</span>
      </button>
    `)
    .join("");
}

function renderYugiohSets() {
  const sets = groupedYears.get(activeYear) || [];
  selectedYugiohYearTitle.textContent = activeYear ? activeYear : "Select a year";
  yugiohSetsCount.textContent = `${sets.length} sets`;
  if (!sets.length) {
    setMessage(yugiohSetsGrid, "Choose a release year to browse Yu-Gi-Oh! sets.");
    return;
  }
  yugiohSetsGrid.innerHTML = sets
    .map((set) => `
      <button class="set-card${set.id === activeSetId ? " is-active" : ""}" type="button" data-set-id="${escapeHtml(set.id)}">
        ${set.imageUrl ? `<img src="${escapeHtml(set.imageUrl)}" alt="${escapeHtml(set.name)} set artwork" loading="lazy" />` : ""}
        <span>${escapeHtml(set.tcgDate || "Release date unknown")}</span>
        <strong>${escapeHtml(set.name)}</strong>
        <small>${escapeHtml(set.setCode || "No set code")} - ${set.cardCount} cards</small>
      </button>
    `)
    .join("");
}

function renderYugiohCards(cards) {
  const deduped = window.GCX_TCG_IDENTITY?.dedupeCards
    ? window.GCX_TCG_IDENTITY.dedupeCards(cards, "yugioh", { includeVariant: true })
    : { cards, duplicates: [] };

  if (!deduped.cards.length) {
    setMessage(yugiohCardsGrid, "No Yu-Gi-Oh! cards found for this set.");
    return;
  }
  const warningMarkup = window.GCX_TCG_IDENTITY?.renderAdminWarnings
    ? window.GCX_TCG_IDENTITY.renderAdminWarnings(deduped.duplicates.length ? [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden`] : [])
    : "";
  yugiohCardsGrid.innerHTML = warningMarkup + deduped.cards.map((card) => `
    <a class="card-tile${card.printingId === activePrintingId ? " is-active" : ""}" href="${getCardUrl(card)}" data-printing-id="${escapeHtml(card.printingId)}">
      ${renderCardImage(card, getCardImage(card, "small"), "grid")}
      <strong>${escapeHtml(card.cardName || card.name)}</strong>
      <small>${escapeHtml(card.cardNumberDisplay || card.setCode || "No set code")} - ${escapeHtml(card.rarity || card.setRarity || "rarity unknown")}</small>
    </a>
  `).join("");
}

function getCardPrices(card) {
  const prices = [
    ["Set", card.setPrice],
    ["TCGplayer", card.prices?.tcgplayer],
    ["Cardmarket", card.prices?.cardmarket],
    ["eBay", card.prices?.ebay],
    ["Amazon", card.prices?.amazon],
    ["CoolStuffInc", card.prices?.coolstuffinc],
  ];
  return prices
    .map(([label, value]) => ({ label, value: formatCurrency(value) }))
    .filter((price) => price.value);
}

function getLegalities(card) {
  return Object.entries(card.banlist || {}).filter(([, status]) => status);
}

function getVariantLabels(card) {
  return Array.from(new Set((card.variants || []).map((variant) => [variant.setCode, variant.rarity].filter(Boolean).join(" - ")).filter(Boolean)));
}

function renderCardIdentity(card, franchise = "yugioh") {
  const canonicalKey = card.canonicalKey || window.GCX_TCG_IDENTITY?.canonicalKey?.(card, franchise, { includeVariant: true }) || "";
  const source = card.imageSource || (getCardImage(card) ? "YGOPRODeck" : "Image source unavailable");
  const status = card.imageStatus || (getCardImage(card) ? "api-sourced-review-required" : "missing");
  const values = [
    ["Card ID", card.cardId || card.id],
    ["Printing", card.printingId || card.cardNumberDisplay || card.setCode],
    ["Set", card.setName || card.setId],
    ["Image", `${source} / ${status}`],
    ["Canonical", canonicalKey],
  ].filter(([, value]) => value);

  return `
    <p class="detail-section-title">Collector Identity</p>
    <div class="identity-list">${values.map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</span>`).join("")}</div>
  `;
}

function renderYugiohCardDetail(card) {
  activePrintingId = card.printingId;
  const prices = getCardPrices(card);
  const legalities = getLegalities(card);
  const variants = getVariantLabels(card);
  const statMarkup = [card.attribute, card.race, card.archetype, card.atk !== "" ? `ATK ${card.atk}` : "", card.def !== "" ? `DEF ${card.def}` : "", card.level ? `Level ${card.level}` : "", card.linkval ? `Link ${card.linkval}` : ""].filter(Boolean);
  const priceMarkup = prices.length ? prices.slice(0, 8).map((price) => `<span><strong>${escapeHtml(price.value)}</strong>${escapeHtml(price.label)}</span>`).join("") : "<span>No market data yet</span>";
  const legalityMarkup = legalities.length ? legalities.map(([format, status]) => `<span>${escapeHtml(format.toUpperCase())}: ${escapeHtml(status)}</span>`).join("") : "<span>No banlist restrictions listed</span>";
  const variantMarkup = variants.length ? variants.slice(0, 16).map((variant) => `<span>${escapeHtml(variant)}</span>`).join("") : "<span>No variants listed</span>";

  yugiohCardDetail.innerHTML = `
    <div class="tcg-card-media">${renderCardImage(card, getCardImage(card, "normal"), "detail")}</div>
    <div>
      <p class="kicker">Yu-Gi-Oh! Card</p>
      <h3>${escapeHtml(card.cardName || card.name)}</h3>
      <p>${escapeHtml(card.setName)} - ${escapeHtml(card.setCode || "No set code")}</p>
      <div class="detail-meta">
        <span>${escapeHtml(card.type || "Card")}</span>
        <span>${escapeHtml(card.setRarity || "Rarity unknown")}</span>
        ${statMarkup.slice(0, 5).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
      <p class="detail-section-title">Market Price</p>
      <div class="price-grid">${priceMarkup}</div>
      <p class="detail-section-title">Legalities</p>
      <div class="legality-list">${legalityMarkup}</div>
      <p class="detail-section-title">Printings / Variants</p>
      <div class="variant-list">${variantMarkup}</div>
      ${renderCardIdentity(card, "yugioh")}
      <a class="button list-trade-button" href="index.html?tradeYugiohCard=${encodeURIComponent(card.printingId)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadCardsForSet(setId) {
  if (yugiohCardsBySet.has(setId)) return yugiohCardsBySet.get(setId);
  const response = await fetch(getSetCardsUrl(setId), { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load Yu-Gi-Oh! set ${setId}: ${response.status}`);
  const payload = await response.json();
  const cards = Array.isArray(payload) ? payload : payload.data || [];
  yugiohCardsBySet.set(setId, cards);
  return cards;
}

async function selectYugiohSet(setId) {
  activeSetId = setId;
  activePrintingId = "";
  const set = yugiohSets.find((item) => item.id === setId);
  selectedYugiohSet.innerHTML = `
    ${set?.imageUrl ? `<img src="${escapeHtml(set.imageUrl)}" alt="${escapeHtml(set.name)} set artwork" loading="lazy" />` : ""}
    <div>
      <h3>${escapeHtml(set?.name || setId)}</h3>
      <p>${escapeHtml(set?.tcgDate || "Release date unknown")} - ${escapeHtml(set?.setCode || "No set code")} - ${escapeHtml(set?.cardCount || 0)} cards</p>
    </div>
  `;
  setMessage(yugiohCardsGrid, "Loading Yu-Gi-Oh! cards...");
  yugiohCardDetail.innerHTML = `<div><h3>Select a card</h3><p>Price, rarity, banlist status, variants, and beta waitlist tools will appear here.</p></div>`;
  renderYugiohSets();
  const cards = await loadCardsForSet(setId);
  renderYugiohCards(cards);
}

function parseYugiohSearch(value) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

async function runYugiohCardSearch() {
  const raw = yugiohCardSearch.value.trim();
  if (!raw) {
    yugiohCardSearchResults.textContent = "Search by card name, set name, set code, rarity, type, archetype, attribute, or a mix of terms.";
    return;
  }
  try {
    const query = parseYugiohSearch(raw).join(" ");
    const response = await fetch(`/api/yugioh/cards?q=${encodeURIComponent(query)}&pageSize=40&page=1`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Yu-Gi-Oh! search returned ${response.status}`);
    const result = await response.json();
    const matches = result.data || [];
    if (!matches.length) {
      yugiohCardSearchResults.innerHTML = `<div class="index-message">No Yu-Gi-Oh! cards matched "${escapeHtml(raw)}".</div>`;
      return;
    }
    const deduped = window.GCX_TCG_IDENTITY?.dedupeCards
      ? window.GCX_TCG_IDENTITY.dedupeCards(matches, "yugioh", { includeVariant: true })
      : { cards: matches, duplicates: [] };
    const warningMarkup = window.GCX_TCG_IDENTITY?.renderAdminWarnings
      ? window.GCX_TCG_IDENTITY.renderAdminWarnings(deduped.duplicates.length ? [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden`] : [])
      : "";
    yugiohCardSearchResults.innerHTML = warningMarkup + deduped.cards.map((card) => `
      <a class="card-search-result" href="${getCardUrl(card)}">
        ${renderCardImage(card, getCardImage(card, "small"), "search")}
        <span><strong>${escapeHtml(card.cardName || card.name)}</strong>${escapeHtml(card.setName)} - ${escapeHtml(card.cardNumberDisplay || card.setCode || "No set code")} - ${escapeHtml(card.rarity || card.setRarity || "rarity unknown")}</span>
      </a>
    `).join("");
  } catch (error) {
    yugiohCardSearchResults.innerHTML = `<div class="index-message">Yu-Gi-Oh! search could not be loaded right now.</div>`;
  }
}

async function initYugiohIndex() {
  setMessage(yugiohYearList, "Loading Yu-Gi-Oh! years...");
  setMessage(yugiohSetsGrid, "Loading Yu-Gi-Oh! sets...");
  setMessage(yugiohCardsGrid, "Choose a set to load cards.");
  try {
    const response = await fetch("/api/yugioh/sets?pageSize=10000", { cache: "no-store" });
    if (!response.ok) throw new Error(`Yu-Gi-Oh! sets returned ${response.status}`);
    const result = await response.json();
    yugiohSets = result.data || [];
    groupedYears = yugiohSets.reduce((groups, set) => {
      const year = set.year || "Date Unknown";
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(set);
      return groups;
    }, new Map());
    activeYear = groupedYears.keys().next().value || "";
    renderYugiohYears();
    renderYugiohSets();
  } catch (error) {
    setMessage(yugiohYearList, "Yu-Gi-Oh! data could not be loaded right now.");
    setMessage(yugiohSetsGrid, "Yu-Gi-Oh! sets could not be loaded right now.");
  }
}

yugiohSetSearch.addEventListener("input", () => {
  renderYugiohYears();
  renderYugiohSets();
});

yugiohYearList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-year]");
  if (!button) return;
  activeYear = button.dataset.year;
  activeSetId = "";
  renderYugiohYears();
  renderYugiohSets();
  setMessage(yugiohCardsGrid, "Choose a set to load cards.");
});

yugiohSetsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-set-id]");
  if (!button) return;
  selectYugiohSet(button.dataset.setId);
});

yugiohCardsGrid.addEventListener("click", async (event) => {
  const link = event.target.closest("[data-printing-id]");
  if (!link) return;
  event.preventDefault();
  const cards = await loadCardsForSet(activeSetId);
  const card = cards.find((item) => item.printingId === link.dataset.printingId);
  if (card) {
    renderYugiohCardDetail(card);
    renderYugiohCards(cards);
  }
});

yugiohCardSearchButton.addEventListener("click", runYugiohCardSearch);
yugiohCardSearch.addEventListener("input", () => {
  window.clearTimeout(yugiohCardSearchTimeout);
  yugiohCardSearchTimeout = window.setTimeout(runYugiohCardSearch, 250);
});
yugiohCardSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") runYugiohCardSearch();
});

initYugiohIndex();
