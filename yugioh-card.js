const yugiohCardPageDetail = document.querySelector("#yugioh-card-page-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function formatCurrency(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `$${amount.toFixed(2)}` : "";
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

function getCardImage(card, size = "normal") {
  if (size === "normal") {
    return card.imageFront || card.images?.normal || card.imageThumbnail || card.images?.small || card.imageUrl || "";
  }
  return card.imageThumbnail || card.images?.small || card.imageFront || card.images?.normal || card.imageUrl || "";
}

function renderCardImage(card, imageUrl, context = "detail") {
  if (window.GCX_TCG_MEDIA?.renderImage) {
    return window.GCX_TCG_MEDIA.renderImage(card, {
      imageUrl,
      name: card.name,
      alt: `${card.name} large card image`,
      size: context === "detail" ? "normal" : "small",
      loading: context === "detail" ? "eager" : "lazy",
      showPolicyNote: context === "detail",
    });
  }
  return imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(card.name)} large card image" />` : "";
}

function renderCardIdentity(card, franchise = "yugioh") {
  const canonicalKey = card.canonicalKey || window.GCX_TCG_IDENTITY?.canonicalKey?.(card, franchise, { includeVariant: true }) || "";
  const imageUrl = getCardImage(card);
  const source = card.imageSource || (imageUrl ? "YGOPRODeck" : "Image source unavailable");
  const status = card.imageStatus || (imageUrl ? "api-sourced-review-required" : "missing");
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

function communityShareLink({ shareUrl, title, body, category }) {
  const params = new URLSearchParams({
    shareUrl,
    title,
    body,
    category,
  });
  return `community.html?${params.toString()}`;
}

function renderYugiohCardPage(card) {
  document.title = `${card.name} | GCXNerds`;
  const prices = getCardPrices(card);
  const legalities = getLegalities(card);
  const variants = getVariantLabels(card);
  const statMarkup = [card.attribute, card.race, card.archetype, card.atk !== "" ? `ATK ${card.atk}` : "", card.def !== "" ? `DEF ${card.def}` : "", card.level ? `Level ${card.level}` : "", card.linkval ? `Link ${card.linkval}` : "", ...(card.linkmarkers || [])].filter(Boolean);
  const priceMarkup = prices.length ? prices.slice(0, 10).map((price) => `<span><strong>${escapeHtml(price.value)}</strong>${escapeHtml(price.label)}</span>`).join("") : "<span>No market data yet</span>";
  const legalityMarkup = legalities.length ? legalities.map(([format, status]) => `<span>${escapeHtml(format.toUpperCase())}: ${escapeHtml(status)}</span>`).join("") : "<span>No banlist restrictions listed</span>";
  const variantMarkup = variants.length ? variants.map((variant) => `<span>${escapeHtml(variant)}</span>`).join("") : "<span>No variants listed</span>";
  const shareLink = communityShareLink({
    shareUrl: `yugioh-card.html?set=${encodeURIComponent(card.setId)}&id=${encodeURIComponent(card.printingId || card.cardId || card.id)}`,
    title: `Thoughts on ${card.name}`,
    body: `${card.name} from ${card.setName}. ${card.type || "Yu-Gi-Oh! card"}${card.setRarity ? `, ${card.setRarity}` : ""}.`,
    category: "Cards",
  });
  const waitlistParams = new URLSearchParams({
    item: `${card.name} - ${card.setName}${card.setCode ? ` ${card.setCode}` : ""}`,
    itemType: "yugioh-card",
    sourceId: card.printingId || card.cardId || card.id,
    intent: "Want to trade",
  });

  yugiohCardPageDetail.innerHTML = `
    <div class="tcg-card-media">${renderCardImage(card, getCardImage(card, "normal"))}</div>
    <div class="card-page-copy">
      <p class="kicker">Yu-Gi-Oh! Card</p>
      <h1>${escapeHtml(card.name)}</h1>
      <p>${escapeHtml(card.setName)} - ${escapeHtml(card.setCode || "No set code")} - ${escapeHtml(card.setRarity || "Rarity unknown")}</p>
      <div class="detail-meta">
        <span>${escapeHtml(card.type || "Card")}</span>
        ${statMarkup.slice(0, 10).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
      ${card.description ? `<p class="detail-section-title">Card Text</p><div class="console-detail-note">${escapeHtml(card.description)}</div>` : ""}
      <p class="detail-section-title">Market Price</p>
      <div class="price-grid">${priceMarkup}</div>
      <p class="detail-section-title">Legalities</p>
      <div class="legality-list">${legalityMarkup}</div>
      <p class="detail-section-title">Printings / Variants</p>
      <div class="variant-list">${variantMarkup}</div>
      ${renderCardIdentity(card, "yugioh")}
      <div class="detail-actions">
        <a class="button list-trade-button" href="index.html?${waitlistParams.toString()}#cards">Join beta waitlist</a>
        <a class="button secondary" href="${escapeHtml(shareLink)}">Share to community</a>
      </div>
      <p class="marketplace-beta-note">Marketplace beta only. This saves collector interest; no public listing, payment, sale, or trade is created.</p>
    </div>
  `;
}

async function loadYugiohCardPage() {
  const params = new URLSearchParams(window.location.search);
  const setId = params.get("set");
  const printingId = params.get("id");
  if (!setId || !printingId) {
    yugiohCardPageDetail.innerHTML = `<div class="index-message">No Yu-Gi-Oh! card was selected.</div>`;
    return;
  }
  try {
    const response = await fetch(`/api/yugioh/sets/${encodeURIComponent(setId)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load set ${setId}`);
    const payload = await response.json();
    const cards = Array.isArray(payload) ? payload : payload.data || [];
    const card = cards.find((item) => item.printingId === printingId || item.cardId === printingId || item.id === printingId);
    if (!card) throw new Error("Card not found.");
    renderYugiohCardPage(card);
  } catch (error) {
    yugiohCardPageDetail.innerHTML = `<div class="index-message">This Yu-Gi-Oh! card could not be loaded right now.</div>`;
  }
}

loadYugiohCardPage();
