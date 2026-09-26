const magicSetSearch = document.querySelector("#magic-set-search");
const magicSetTypeList = document.querySelector("#magic-set-type-list");
const magicSetsGrid = document.querySelector("#magic-sets-grid");
const magicCardsGrid = document.querySelector("#magic-cards-grid");
const magicCardDetail = document.querySelector("#magic-card-detail");
const magicCardSearch = document.querySelector("#magic-card-search");
const magicCardSearchButton = document.querySelector("#magic-card-search-button");
const magicCardSearchResults = document.querySelector("#magic-card-search-results");
const selectedMagicSet = document.querySelector("#selected-magic-set");
const selectedMagicSetTypeTitle = document.querySelector("#selected-magic-set-type-title");
const magicSetTypeCount = document.querySelector("#magic-set-type-count");
const magicSetsCount = document.querySelector("#magic-sets-count");

let magicSets = [];
let groupedSetTypes = new Map();
let activeSetType = "";
let activeSetCode = "";
let activeCardId = "";
let magicCardSearchTimeout = 0;
const magicCardsBySet = new Map();

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function setMessage(target, message) {
  target.innerHTML = `<div class="index-message">${message}</div>`;
}

function labelSetType(value) {
  return String(value || "other")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sortCardsByCollectorNumber(a, b) {
  const numA = Number.parseInt(a.collectorNumber, 10);
  const numB = Number.parseInt(b.collectorNumber, 10);
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) return numA - numB;
  return String(a.collectorNumber || "").localeCompare(String(b.collectorNumber || ""), undefined, { numeric: true }) || a.name.localeCompare(b.name);
}

function getFilteredSetTypes() {
  const query = normalize(magicSetSearch.value);
  return Array.from(groupedSetTypes.entries()).filter(([setType, sets]) => {
    const typeMatch = normalize(labelSetType(setType)).includes(query);
    const setMatch = sets.some((set) => normalize(`${set.name} ${set.code} ${set.block}`).includes(query));
    return !query || typeMatch || setMatch;
  });
}

function getCardUrl(card) {
  return `magic-card.html?set=${encodeURIComponent(card.set || card.setCode)}&id=${encodeURIComponent(card.id || card.cardId)}`;
}

function getSetCardsUrl(setCode) {
  return `/api/magic/sets/${encodeURIComponent(setCode)}`;
}

function getCardImage(card, size = "normal") {
  return card.imageFront || card.imageThumbnail || card.imageUrl || card.imageUris?.[size] || card.imageUris?.normal || card.imageUris?.small || card.cardFaces?.find((face) => face.imageUris)?.imageUris?.[size] || "";
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

function getCardPrices(card) {
  return Object.entries(card.prices || {})
    .filter(([, value]) => value)
    .map(([key, value]) => ({
      label: key.replaceAll("_", " ").toUpperCase(),
      value: key === "eur" || key === "eur_foil" || key === "eur_etched" ? `EUR ${Number(value).toFixed(2)}` : `$${Number(value).toFixed(2)}`,
    }));
}

function getCardVariants(card) {
  return Array.from(new Set([card.variant, ...(card.finishes || []), card.rarity, card.layout, card.promo ? "promo" : "", card.digital ? "digital" : "", card.reprint ? "reprint" : "", card.variation ? "variation" : ""].filter(Boolean)));
}

function renderCardIdentity(card, franchise = "magic") {
  const canonicalKey = card.canonicalKey || window.GCX_TCG_IDENTITY?.canonicalKey?.(card, franchise, { includeVariant: true }) || "";
  const source = card.imageSource || (getCardImage(card) ? "Scryfall" : "Image source unavailable");
  const status = card.imageStatus || (getCardImage(card) ? "api-sourced-review-required" : "missing");
  const values = [
    ["Card ID", card.cardId || card.id],
    ["Set", card.setCode || card.set],
    ["Number", card.cardNumberDisplay || card.collectorNumber],
    ["Image", `${source} / ${status}`],
    ["Canonical", canonicalKey],
  ].filter(([, value]) => value);
  return `
    <p class="detail-section-title">Collector Identity</p>
    <div class="identity-list">${values.map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</span>`).join("")}</div>
  `;
}

function renderMagicSetTypes() {
  const filtered = getFilteredSetTypes();
  magicSetTypeCount.textContent = `${filtered.length} types`;
  magicSetTypeList.innerHTML = filtered
    .map(([setType, sets]) => `
      <button class="series-button${setType === activeSetType ? " is-active" : ""}" type="button" data-set-type="${escapeHtml(setType)}">
        <span>${escapeHtml(labelSetType(setType))}</span>
        <strong>${sets.length}</strong>
      </button>
    `)
    .join("");
}

function renderMagicSets() {
  const sets = groupedSetTypes.get(activeSetType) || [];
  selectedMagicSetTypeTitle.textContent = activeSetType ? labelSetType(activeSetType) : "Select a set type";
  magicSetsCount.textContent = `${sets.length} sets`;
  if (!sets.length) {
    setMessage(magicSetsGrid, "Choose a set type to browse Magic sets.");
    return;
  }
  magicSetsGrid.innerHTML = sets
    .map((set) => `
      <button class="set-card${set.code === activeSetCode ? " is-active" : ""}" type="button" data-set-code="${escapeHtml(set.code)}">
        <img src="${escapeHtml(set.iconSvgUri || "")}" alt="${escapeHtml(set.name)} set symbol" loading="lazy" />
        <span>${escapeHtml(set.releasedAt || "Release date unknown")}</span>
        <strong>${escapeHtml(set.name)}</strong>
        <small>${escapeHtml(set.code.toUpperCase())} - ${escapeHtml(labelSetType(set.setType))} - ${set.cardCount} cards</small>
      </button>
    `)
    .join("");
}

function renderMagicCards(cards) {
  const deduped = window.GCX_TCG_IDENTITY?.dedupeCards
    ? window.GCX_TCG_IDENTITY.dedupeCards(cards, "magic", { includeVariant: true })
    : { cards, duplicates: [] };

  if (!deduped.cards.length) {
    setMessage(magicCardsGrid, "No Magic cards found for this set.");
    return;
  }
  const warningMarkup = window.GCX_TCG_IDENTITY?.renderAdminWarnings
    ? window.GCX_TCG_IDENTITY.renderAdminWarnings(deduped.duplicates.length ? [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden`] : [])
    : "";
  magicCardsGrid.innerHTML = warningMarkup + deduped.cards.map((card) => {
    const imageUrl = getCardImage(card, "small");
    return `
      <a class="card-tile${card.id === activeCardId ? " is-active" : ""}" href="${getCardUrl(card)}" data-card-id="${escapeHtml(card.id)}">
        ${renderCardImage(card, imageUrl, "grid")}
        <strong>${escapeHtml(card.name)}</strong>
        <small>#${escapeHtml(card.cardNumberDisplay || card.collectorNumber)} - ${escapeHtml(card.rarity || "rarity unknown")}</small>
      </a>
    `;
  }).join("");
}

function renderMagicCardDetail(card) {
  activeCardId = card.id;
  const imageUrl = getCardImage(card, "normal");
  const prices = getCardPrices(card);
  const legalities = Object.entries(card.legalities || {}).filter(([, status]) => status === "legal" || status === "restricted" || status === "banned");
  const variants = getCardVariants(card);

  const priceMarkup = prices.length
    ? prices.slice(0, 8).map((price) => `<span><strong>${escapeHtml(price.value)}</strong>${escapeHtml(price.label)}</span>`).join("")
    : "<span>No market data yet</span>";
  const legalityMarkup = legalities.length
    ? legalities.slice(0, 18).map(([format, status]) => `<span>${escapeHtml(format)}: ${escapeHtml(status)}</span>`).join("")
    : "<span>No legality data</span>";
  const variantMarkup = variants.length ? variants.map((variant) => `<span>${escapeHtml(variant)}</span>`).join("") : "<span>No variants listed</span>";

  magicCardDetail.innerHTML = `
    <div class="tcg-card-media">${renderCardImage(card, imageUrl, "detail")}</div>
    <div>
      <p class="kicker">Magic Card</p>
      <h3>${escapeHtml(card.name)}</h3>
      <p>${escapeHtml(card.setName)} - ${escapeHtml(String(card.setCode || card.set).toUpperCase())} - #${escapeHtml(card.cardNumberDisplay || card.collectorNumber)}</p>
      <div class="detail-meta">
        <span>${escapeHtml(card.typeLine || "Card")}</span>
        <span>${escapeHtml(card.rarity || "Rarity unknown")}</span>
        <span>${escapeHtml(card.artist || "Artist unknown")}</span>
      </div>
      <p class="detail-section-title">Market Price</p>
      <div class="price-grid">${priceMarkup}</div>
      <p class="detail-section-title">Legalities</p>
      <div class="legality-list">${legalityMarkup}</div>
      <p class="detail-section-title">Finishes / Variants</p>
      <div class="variant-list">${variantMarkup}</div>
      ${renderCardIdentity(card, "magic")}
      <a class="button list-trade-button" href="index.html?tradeMagicCard=${encodeURIComponent(card.id)}#cards">Join beta waitlist</a>
    </div>
  `;
}

async function loadCardsForSet(setCode) {
  if (magicCardsBySet.has(setCode)) return magicCardsBySet.get(setCode);
  const response = await fetch(getSetCardsUrl(setCode), { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load Magic set ${setCode}: ${response.status}`);
  const payload = await response.json();
  const cards = (Array.isArray(payload) ? payload : payload.data || []).sort(sortCardsByCollectorNumber);
  magicCardsBySet.set(setCode, cards);
  return cards;
}

async function selectMagicSet(setCode) {
  activeSetCode = setCode;
  activeCardId = "";
  const set = magicSets.find((item) => item.code === setCode);
  selectedMagicSet.innerHTML = `
    <h3>${escapeHtml(set?.name || setCode.toUpperCase())}</h3>
    <p>${escapeHtml(set?.releasedAt || "Release date unknown")} - ${escapeHtml(labelSetType(set?.setType))} - ${escapeHtml(set?.code?.toUpperCase() || setCode.toUpperCase())}</p>
  `;
  setMessage(magicCardsGrid, "Loading Magic cards...");
  magicCardDetail.innerHTML = `<div><h3>Select a card</h3><p>Price, rarity, legalities, finishes, variants, and beta waitlist tools will appear here.</p></div>`;
  renderMagicSets();
  const cards = await loadCardsForSet(setCode);
  renderMagicCards(cards);
}

function parseMagicSearch(value) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

async function runMagicCardSearch() {
  const raw = magicCardSearch.value.trim();
  if (!raw) {
    magicCardSearchResults.textContent = "Search by card name, set name, set code, collector number, type, rarity, or a mix of terms.";
    return;
  }
  try {
    const query = parseMagicSearch(raw).join(" ");
    const response = await fetch(`/api/magic/cards?q=${encodeURIComponent(query)}&pageSize=40&page=1`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Magic search returned ${response.status}`);
    const result = await response.json();
    const matches = result.data || [];
    if (!matches.length) {
      magicCardSearchResults.innerHTML = `<div class="index-message">No Magic cards matched "${escapeHtml(raw)}".</div>`;
      return;
    }
    const deduped = window.GCX_TCG_IDENTITY?.dedupeCards
      ? window.GCX_TCG_IDENTITY.dedupeCards(matches, "magic", { includeVariant: true })
      : { cards: matches, duplicates: [] };
    const warningMarkup = window.GCX_TCG_IDENTITY?.renderAdminWarnings
      ? window.GCX_TCG_IDENTITY.renderAdminWarnings(deduped.duplicates.length ? [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden`] : [])
      : "";
    magicCardSearchResults.innerHTML = warningMarkup + deduped.cards.map((card) => `
      <a class="card-search-result" href="${getCardUrl(card)}">
        ${renderCardImage(card, getCardImage(card, "small"), "search")}
        <span><strong>${escapeHtml(card.cardName || card.name)}</strong>${escapeHtml(card.setName)} - ${escapeHtml(String(card.setCode || card.set).toUpperCase())} #${escapeHtml(card.cardNumberDisplay || card.collectorNumber)}</span>
      </a>
    `).join("");
  } catch (error) {
    magicCardSearchResults.innerHTML = `<div class="index-message">Magic search could not be loaded right now.</div>`;
  }
}

async function loadMagicIndex() {
  setMessage(magicSetTypeList, "Loading Magic set types...");
  setMessage(magicSetsGrid, "Loading Magic sets...");
  try {
    const response = await fetch("data/magic/sets.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load Magic sets: ${response.status}`);
    magicSets = await response.json();
    groupedSetTypes = magicSets.reduce((groups, set) => {
      const key = set.setType || "other";
      const existing = groups.get(key) || [];
      existing.push(set);
      groups.set(key, existing);
      return groups;
    }, new Map());
    activeSetType = groupedSetTypes.has("expansion") ? "expansion" : Array.from(groupedSetTypes.keys())[0] || "";
    renderMagicSetTypes();
    renderMagicSets();
    const firstSet = (groupedSetTypes.get(activeSetType) || [])[0];
    if (firstSet) await selectMagicSet(firstSet.code);
  } catch (error) {
    setMessage(magicSetTypeList, "Magic sets could not be loaded.");
    setMessage(magicSetsGrid, "Try refreshing the page.");
  }
}

magicSetSearch.addEventListener("input", () => {
  renderMagicSetTypes();
});

magicSetTypeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-set-type]");
  if (!button) return;
  activeSetType = button.dataset.setType;
  activeSetCode = "";
  renderMagicSetTypes();
  renderMagicSets();
});

magicSetsGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-set-code]");
  if (!button) return;
  await selectMagicSet(button.dataset.setCode);
});

magicCardsGrid.addEventListener("click", async (event) => {
  const link = event.target.closest("[data-card-id]");
  if (!link) return;
  event.preventDefault();
  const cards = await loadCardsForSet(activeSetCode);
  const card = cards.find((item) => item.id === link.dataset.cardId);
  if (card) {
    renderMagicCardDetail(card);
    renderMagicCards(cards);
  }
});

magicCardSearchButton.addEventListener("click", runMagicCardSearch);
magicCardSearch.addEventListener("input", () => {
  window.clearTimeout(magicCardSearchTimeout);
  magicCardSearchTimeout = window.setTimeout(runMagicCardSearch, 250);
});

loadMagicIndex();
