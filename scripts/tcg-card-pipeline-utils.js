function normalizeIdentitySegment(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function canonicalCardKey(card = {}, includeVariant = true) {
  return [
    normalizeIdentitySegment(card.franchise),
    normalizeIdentitySegment(card.setCode || card.setName),
    normalizeIdentitySegment(card.cardNumber || card.cardNumberDisplay),
    normalizeIdentitySegment(card.cardName || card.name),
    includeVariant ? normalizeIdentitySegment(card.variant || card.rarity) : "",
    normalizeIdentitySegment(card.language || "en"),
  ].join("|");
}

function dedupeCards(cards = [], normalizeCard, options = {}) {
  const seen = new Map();
  const data = [];
  const duplicates = [];
  const includeVariant = options.includeVariant !== false;

  cards.forEach((rawCard) => {
    const normalized = normalizeCard(rawCard);
    const key = normalized.canonicalKey || canonicalCardKey(normalized, includeVariant);
    if (!key.replace(/\|/g, "")) {
      data.push(rawCard);
      return;
    }
    if (seen.has(key)) {
      duplicates.push({
        canonicalKey: key,
        firstId: seen.get(key),
        duplicateId: normalized.cardId || normalized.id || "",
      });
      return;
    }
    seen.set(key, normalized.cardId || normalized.id || key);
    data.push(rawCard);
  });

  return { data, duplicates };
}

function validateCards(cards = [], normalizeCard) {
  const warnings = [];

  cards.forEach((rawCard) => {
    const card = normalizeCard(rawCard);
    if (!card.cardId) warnings.push({ code: "MISSING_CARD_ID", card });
    if (!card.setCode && !card.setName) warnings.push({ code: "MISSING_SET_ASSOCIATION", card });
    if (!card.cardNumber && !card.cardNumberDisplay) warnings.push({ code: "MISSING_CARD_NUMBER", card });
    if (!card.imageFront && !card.imageThumbnail) warnings.push({ code: "MISSING_CARD_IMAGE", card });
    if (card.imageFront || card.imageThumbnail) {
      const image = card.imageFront || card.imageThumbnail;
      if (/placeholder|fallback|unavailable|missing|logo|symbol|set-icon|set_symbol/i.test(image)) {
        warnings.push({ code: "CARD_IMAGE_SOURCE_INVALID", card });
      }
    }
  });

  return warnings;
}

function guardCardsForImport(cards, normalizeCard, options = {}) {
  const deduped = dedupeCards(cards, normalizeCard, options);
  const warnings = validateCards(deduped.data, normalizeCard);
  const strictCodes = new Set(options.strictCodes || []);
  const strictFailures = warnings.filter((warning) => strictCodes.has(warning.code));

  return {
    data: deduped.data,
    duplicates: deduped.duplicates,
    warnings,
    strictFailures,
    ok: strictFailures.length === 0,
  };
}

module.exports = {
  canonicalCardKey,
  dedupeCards,
  guardCardsForImport,
  normalizeIdentitySegment,
  validateCards,
};
