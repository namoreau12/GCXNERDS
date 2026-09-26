const pokemonApiBase =
  window.location.protocol === "file:" ? "https://api.pokemontcg.io/v2" : "/api/pokemon";
const detailTarget = document.querySelector("#card-page-detail");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchJsonWithRetry(url, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Pokemon API returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(350 * attempt);
      }
    }
  }

  throw lastError;
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

function getCardPrices(card) {
  const tcgplayer = card.tcgplayer?.prices || {};
  const prices = [];

  Object.entries(tcgplayer).forEach(([variant, value]) => {
    const market = value?.market ?? value?.mid ?? value?.low;
    if (market) {
      prices.push({
        label: variant.replaceAll("_", " "),
        value: `$${Number(market).toFixed(2)}`,
      });
    }
  });

  const cardmarket = card.cardmarket?.prices;
  if (!prices.length && cardmarket) {
    const average = cardmarket.averageSellPrice || cardmarket.trendPrice || cardmarket.avg30;
    if (average) {
      prices.push({
        label: "Cardmarket avg",
        value: `EUR ${Number(average).toFixed(2)}`,
      });
    }
  }

  return prices;
}

function getCardVariants(card) {
  const variants = [];
  const tcgplayer = card.tcgplayer?.prices || {};

  Object.keys(tcgplayer).forEach((variant) => {
    variants.push(variant.replaceAll("_", " "));
  });

  if (card.rarity) variants.push(card.rarity);
  if (card.subtypes?.length) variants.push(...card.subtypes);

  return Array.from(new Set(variants));
}

function renderCardImage(card, imageUrl, context = "detail") {
  if (window.GCX_TCG_MEDIA?.renderImage) {
    return window.GCX_TCG_MEDIA.renderImage(card, {
      imageUrl,
      name: card.name,
      alt: `${card.name} large card image`,
      size: "large",
      loading: context === "detail" ? "eager" : "lazy",
      showPolicyNote: context === "detail",
    });
  }
  return imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(card.name)} large card image" />` : "";
}

function renderCardIdentity(card, franchise = "pokemon") {
  const canonicalKey = card.canonicalKey || window.GCX_TCG_IDENTITY?.canonicalKey?.(card, franchise, { includeVariant: true }) || "";
  const imageUrl = card.imageFront || card.images?.large || card.images?.small || "";
  const source = card.imageSource || (imageUrl ? "Pokemon TCG API" : "Image source unavailable");
  const status = card.imageStatus || (imageUrl ? "api-sourced-review-required" : "missing");
  const values = [
    ["Card ID", card.cardId || card.id],
    ["Set", card.setCode || card.set?.id || card.set?.name],
    ["Number", card.cardNumberDisplay || card.number],
    ["Image", `${source} / ${status}`],
    ["Canonical", canonicalKey],
  ].filter(([, value]) => value);

  return `
    <p class="detail-section-title">Collector Identity</p>
    <div class="identity-list">${values.map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</span>`).join("")}</div>
  `;
}

function renderCard(card) {
  const prices = getCardPrices(card);
  const variants = getCardVariants(card);
  const legalities = Object.entries(card.legalities || {});
  const setName = card.set?.name || "Unknown set";
  const setSeries = card.set?.series || "Unknown series";
  const setTotal = card.set?.printedTotal || card.set?.total || "?";
  const cardNumber = `${card.number || "?"}/${setTotal}`;
  const shareLink = communityShareLink({
    shareUrl: `card.html?id=${encodeURIComponent(card.id)}`,
    title: `Thoughts on ${card.name}`,
    body: `${card.name} from ${setName} (${setSeries}), card #${cardNumber}. ${card.rarity || "Rarity unknown"}.`,
    category: "Cards",
  });
  const waitlistParams = new URLSearchParams({
    item: `${card.name} - ${setName} #${cardNumber}`,
    itemType: "pokemon-card",
    sourceId: card.id,
    intent: "Want to trade",
  });

  document.title = `${card.name} #${card.number} | Games Cards Exchange`;

  const priceMarkup = prices.length
    ? prices
        .slice(0, 8)
        .map((price) => `<span><strong>${escapeHtml(price.value)}</strong>${escapeHtml(price.label)}</span>`)
        .join("")
    : "<span>No market data yet</span>";

  const legalityMarkup = legalities.length
    ? legalities
        .map(([format, status]) => `<span>${escapeHtml(format)}: ${escapeHtml(status)}</span>`)
        .join("")
    : "<span>No legality data</span>";

  const variantMarkup = variants.length
    ? variants.map((variant) => `<span>${escapeHtml(variant)}</span>`).join("")
    : "<span>No variants listed</span>";

  detailTarget.innerHTML = `
    <div class="tcg-card-media">${renderCardImage(card, card.images?.large || card.images?.small || "")}</div>
    <div class="card-page-copy">
      <p class="kicker">Pokemon Card</p>
      <h1>${escapeHtml(card.name)}</h1>
      <p>${escapeHtml(setName)} - ${escapeHtml(setSeries)} - #${escapeHtml(card.number)}/${escapeHtml(setTotal)}</p>
      <div class="detail-meta">
        <span>${escapeHtml(card.supertype || "Card")}</span>
        <span>${escapeHtml(card.rarity || "Rarity unknown")}</span>
        <span>${escapeHtml(card.artist || "Artist unknown")}</span>
      </div>

      <p class="detail-section-title">Market Price</p>
      <div class="price-grid">${priceMarkup}</div>

      <p class="detail-section-title">Legalities</p>
      <div class="legality-list">${legalityMarkup}</div>

      <p class="detail-section-title">Variants</p>
      <div class="variant-list">${variantMarkup}</div>
      ${renderCardIdentity(card, "pokemon")}

      <div class="detail-actions">
        <a class="button list-trade-button" href="index.html?${waitlistParams.toString()}#cards">
          Join beta waitlist
        </a>
        <a class="button secondary" href="${escapeHtml(shareLink)}">Share to community</a>
      </div>
      <p class="marketplace-beta-note">Marketplace beta only. This saves collector interest; no public listing, payment, sale, or trade is created.</p>
    </div>
  `;
}

async function loadCardPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    detailTarget.innerHTML = `<div class="index-message">No card was selected.</div>`;
    return;
  }

  try {
    let result;

    try {
      result = await fetchJsonWithRetry(`${pokemonApiBase}/cards/${encodeURIComponent(id)}`);
    } catch (error) {
      const fallback = await fetchJsonWithRetry(
        `${pokemonApiBase}/cards?q=${encodeURIComponent(`id:${id}`)}&pageSize=1&page=1`
      );
      result = {
        data: fallback.data?.[0],
      };
    }

    if (!result.data) {
      throw new Error("Card not found");
    }

    renderCard(result.data);
  } catch (error) {
    detailTarget.innerHTML = `<div class="index-message">This card could not be loaded right now.</div>`;
  }
}

loadCardPage();
