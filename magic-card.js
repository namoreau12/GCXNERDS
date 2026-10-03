const magicCardPageDetail = document.querySelector("#magic-card-page-detail");

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function getCardImage(card, size = "large") {
  return card.imageFront || card.imageThumbnail || card.imageUrl || card.imageUris?.[size] || card.imageUris?.normal || card.imageUris?.small || card.cardFaces?.find((face) => face.imageUris)?.imageUris?.[size] || "";
}

function renderCardImage(card, imageUrl, context = "detail") {
  if (window.GCX_TCG_MEDIA?.renderImage) {
    return window.GCX_TCG_MEDIA.renderImage(card, {
      imageUrl,
      name: card.name,
      alt: `${card.name} large card image`,
      size: context === "detail" ? "large" : "normal",
      loading: context === "detail" ? "eager" : "lazy",
      showPolicyNote: context === "detail",
    });
  }
  return imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(card.name)} large card image" />` : "";
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
  const imageUrl = getCardImage(card);
  const source = card.imageSource || (imageUrl ? "Scryfall" : "Image source unavailable");
  const status = card.imageStatus || (imageUrl ? "api-sourced-review-required" : "missing");
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

function communityShareLink({ shareUrl, title, body, category }) {
  const params = new URLSearchParams({
    shareUrl,
    title,
    body,
    category,
  });
  return `community.html?${params.toString()}`;
}

function renderMagicCardPage(card) {
  document.title = `${card.name} #${card.collectorNumber} | Games Exchange`;
  const imageUrl = getCardImage(card);
  const prices = getCardPrices(card);
  const legalities = Object.entries(card.legalities || {}).filter(([, status]) => status === "legal" || status === "restricted" || status === "banned");
  const variants = getCardVariants(card);
  const faceText = (card.cardFaces || [])
    .map((face) => `${face.name}${face.typeLine ? ` - ${face.typeLine}` : ""}${face.oracleText ? `\n${face.oracleText}` : ""}`)
    .join("\n\n");
  const rulesText = card.oracleText || faceText || "";

  const priceMarkup = prices.length
    ? prices.slice(0, 10).map((price) => `<span><strong>${escapeHtml(price.value)}</strong>${escapeHtml(price.label)}</span>`).join("")
    : "<span>No market data yet</span>";
  const legalityMarkup = legalities.length
    ? legalities.map(([format, status]) => `<span>${escapeHtml(format)}: ${escapeHtml(status)}</span>`).join("")
    : "<span>No legality data</span>";
  const variantMarkup = variants.length ? variants.map((variant) => `<span>${escapeHtml(variant)}</span>`).join("") : "<span>No variants listed</span>";
  const shareLink = communityShareLink({
    shareUrl: `magic-card.html?set=${encodeURIComponent(card.set || card.setCode)}&id=${encodeURIComponent(card.id || card.cardId)}`,
    title: `Thoughts on ${card.name}`,
    body: `${card.name} from ${card.setName}, collector #${card.collectorNumber}. ${card.typeLine || "Magic card"}.`,
    category: "Cards",
  });
  const waitlistParams = new URLSearchParams({
    item: `${card.name} - ${card.setName} #${card.cardNumberDisplay || card.collectorNumber}`,
    itemType: "magic-card",
    sourceId: card.id,
    intent: "Want to trade",
  });

  magicCardPageDetail.innerHTML = `
    <div class="tcg-card-media">${renderCardImage(card, imageUrl)}</div>
    <div class="card-page-copy">
      <p class="kicker">Magic Card</p>
      <h1>${escapeHtml(card.name)}</h1>
      <p>${escapeHtml(card.setName)} - ${escapeHtml(String(card.setCode || card.set).toUpperCase())} - #${escapeHtml(card.cardNumberDisplay || card.collectorNumber)}</p>
      <div class="detail-meta">
        <span>${escapeHtml(card.typeLine || "Card")}</span>
        <span>${escapeHtml(card.rarity || "Rarity unknown")}</span>
        <span>${escapeHtml(card.artist || "Artist unknown")}</span>
      </div>
      ${rulesText ? `<p class="detail-section-title">Oracle Text</p><div class="console-detail-note">${escapeHtml(rulesText)}</div>` : ""}
      <p class="detail-section-title">Market Price</p>
      <div class="price-grid">${priceMarkup}</div>
      <p class="detail-section-title">Legalities</p>
      <div class="legality-list">${legalityMarkup}</div>
      <p class="detail-section-title">Finishes / Variants</p>
      <div class="variant-list">${variantMarkup}</div>
      ${renderCardIdentity(card, "magic")}
      <div class="detail-actions">
        <a class="button list-trade-button" href="index.html?${waitlistParams.toString()}#cards">Join beta waitlist</a>
        <a class="button secondary" href="${escapeHtml(shareLink)}">Share to community</a>
      </div>
      <p class="marketplace-beta-note">Marketplace beta only. This saves collector interest; no public listing, payment, sale, or trade is created.</p>
    </div>
  `;
}

async function loadMagicCardPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const setCode = params.get("set");
  if (!id || !setCode) {
    magicCardPageDetail.innerHTML = `<div class="index-message">No Magic card was selected.</div>`;
    return;
  }
  try {
    const response = await fetch(`/api/magic/sets/${encodeURIComponent(setCode)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load set ${setCode}`);
    const payload = await response.json();
    const cards = Array.isArray(payload) ? payload : payload.data || [];
    const card = cards.find((item) => item.id === id || item.cardId === id);
    if (!card) throw new Error("Card not found.");
    renderMagicCardPage(card);
  } catch (error) {
    magicCardPageDetail.innerHTML = `<div class="index-message">This Magic card could not be loaded right now.</div>`;
  }
}

loadMagicCardPage();
