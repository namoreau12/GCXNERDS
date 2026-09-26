const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "card-system-health.json");
const markdownPath = path.join(outputDir, "card-system-health.md");

function readJson(relativePath, fallback = []) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function compact(value) {
  return String(value || "").trim();
}

function pickFirst(...values) {
  return values.find((value) => compact(value)) || "";
}

function pokemonCards() {
  return readJson("data/pokemon/cards.json").map((card) => ({
    raw: card,
    franchise: "pokemon",
    cardId: card.id,
    setCode: card.set?.id || "",
    setName: card.set?.name || "",
    cardNumber: card.number || "",
    cardName: card.name || "",
    variant: [card.rarity, ...(card.subtypes || [])].filter(Boolean).join(" / "),
    language: "en",
    imageFront: pickFirst(card.images?.large, card.images?.small),
    imageThumbnail: pickFirst(card.images?.small, card.images?.large),
    imageSource: pickFirst(card.tcgplayer?.url, card.cardmarket?.url, card.images?.large, card.images?.small),
    imageStatus: card.imageRightsStatus || "api-sourced-review-required",
    rarity: card.rarity || "",
  }));
}

function magicCards() {
  return readJson("data/magic/cards-search.json").map((card) => {
    const imageFront = card.imageUrl || "";
    return {
      raw: card,
      franchise: "magic",
      cardId: card.id,
      setCode: card.set || "",
      setName: card.setName || "",
      cardNumber: card.collectorNumber || "",
      cardName: card.name || "",
      variant: [card.rarity, card.layout, ...(card.finishes || []), card.promo ? "promo" : "", card.variation ? "variation" : ""].filter(Boolean).join(" / "),
      language: card.lang || "en",
      imageFront,
      imageThumbnail: imageFront,
      imageSource: card.scryfallUri || imageFront || "",
      imageStatus: card.imageRightsStatus || (imageFront ? "api-permitted" : "missing"),
      rarity: card.rarity || "",
    };
  });
}

function yugiohCards() {
  return readJson("data/yugioh/cards-search.json").map((card) => ({
    raw: card,
    franchise: "yugioh",
    cardId: card.printingId || card.id,
    setCode: card.setCode || card.setId || "",
    setName: card.setName || "",
    cardNumber: card.setCode || "",
    cardName: card.name || "",
    variant: [card.setRarity, card.race, card.attribute].filter(Boolean).join(" / "),
    language: "en",
    imageFront: pickFirst(card.imageUrl, card.images?.normal, card.images?.small),
    imageThumbnail: pickFirst(card.images?.small, card.imageUrl, card.images?.normal),
    imageSource: card.ygoprodeckUrl || card.imageUrl || "",
    imageStatus: card.imageRightsStatus || "api-sourced-review-required",
    rarity: card.setRarity || "",
  }));
}

function canonicalKey(card, includeVariant = true) {
  return [
    card.franchise,
    normalize(card.setCode || card.setName),
    normalize(card.cardNumber),
    normalize(card.cardName),
    includeVariant ? normalize(card.variant) : "",
    normalize(card.language || "en"),
  ].join("|");
}

function imageLooksLikePlaceholder(url) {
  return /placeholder|fallback|unavailable|missing|logo|symbol|set-icon|set_symbol/i.test(String(url || ""));
}

function summarizeDuplicates(cards, includeVariant = true) {
  const buckets = new Map();
  cards.forEach((card) => {
    const key = canonicalKey(card, includeVariant);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(card);
  });

  return [...buckets.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({
      canonicalKey: key,
      count: items.length,
      cards: items.slice(0, 10).map((card) => ({
        cardId: card.cardId,
        name: card.cardName,
        set: card.setName,
        number: card.cardNumber,
        variant: card.variant,
        imageFront: card.imageFront,
      })),
    }));
}

function summarizeImageReuse(cards) {
  const buckets = new Map();
  cards.forEach((card) => {
    const image = card.imageFront || card.imageThumbnail || "";
    if (!image) return;
    if (!buckets.has(image)) buckets.set(image, []);
    buckets.get(image).push(card);
  });

  return [...buckets.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([imageUrl, items]) => {
      const baseKeys = new Set(items.map((card) => canonicalKey(card, false)));
      return {
        imageUrl,
        count: items.length,
        equivalentBaseCardCount: baseKeys.size,
        requiresReview: baseKeys.size > 1,
        cards: items.slice(0, 12).map((card) => ({
          cardId: card.cardId,
          name: card.cardName,
          set: card.setName,
          number: card.cardNumber,
          variant: card.variant,
        })),
      };
    });
}

function auditFranchise(label, cards) {
  const missingImages = cards.filter((card) => !card.imageFront && !card.imageThumbnail);
  const placeholderImages = cards.filter((card) => imageLooksLikePlaceholder(card.imageFront || card.imageThumbnail));
  const missingSetAssociation = cards.filter((card) => !card.setCode && !card.setName);
  const missingCardNumber = cards.filter((card) => !card.cardNumber);
  const exactDuplicates = summarizeDuplicates(cards, true);
  const likelyDuplicateBaseCards = summarizeDuplicates(cards, false).filter((bucket) => {
    const variants = new Set(bucket.cards.map((card) => normalize(card.variant)));
    return variants.size <= 1;
  });
  const variantReviewRequired = summarizeDuplicates(cards, false).filter((bucket) => {
    const variants = new Set(bucket.cards.map((card) => normalize(card.variant)));
    return variants.size > 1;
  });
  const reusedImages = summarizeImageReuse(cards);
  const invalidImageSources = cards.filter((card) => {
    const image = card.imageFront || card.imageThumbnail || "";
    if (!image) return false;
    try {
      const url = new URL(image);
      return !["http:", "https:"].includes(url.protocol);
    } catch {
      return !image.startsWith("assets/");
    }
  });

  return {
    label,
    totalCards: cards.length,
    missingImageCount: missingImages.length,
    placeholderImageCount: placeholderImages.length,
    missingSetAssociationCount: missingSetAssociation.length,
    missingCardNumberCount: missingCardNumber.length,
    exactDuplicateGroupCount: exactDuplicates.length,
    likelyDuplicateGroupCount: likelyDuplicateBaseCards.length,
    variantReviewGroupCount: variantReviewRequired.length,
    reusedImageGroupCount: reusedImages.length,
    reusedImageReviewGroupCount: reusedImages.filter((bucket) => bucket.requiresReview).length,
    invalidImageSourceCount: invalidImageSources.length,
    warnings: [
      ...(missingImages.length ? ["MISSING_CARD_IMAGE"] : []),
      ...(exactDuplicates.length || likelyDuplicateBaseCards.length ? ["POTENTIAL_DUPLICATE_CARD"] : []),
      ...(invalidImageSources.length || placeholderImages.length ? ["CARD_IMAGE_SOURCE_INVALID"] : []),
      ...(variantReviewRequired.length ? ["CARD_VARIANT_REVIEW_REQUIRED"] : []),
    ],
    samples: {
      missingImages: missingImages.slice(0, 20).map(sampleCard),
      placeholderImages: placeholderImages.slice(0, 20).map(sampleCard),
      exactDuplicates: exactDuplicates.slice(0, 20),
      likelyDuplicateBaseCards: likelyDuplicateBaseCards.slice(0, 20),
      variantReviewRequired: variantReviewRequired.slice(0, 20),
      reusedImages: reusedImages.slice(0, 20),
      invalidImageSources: invalidImageSources.slice(0, 20).map(sampleCard),
    },
  };
}

function sampleCard(card) {
  return {
    cardId: card.cardId,
    canonicalKey: canonicalKey(card),
    name: card.cardName,
    set: card.setName,
    setCode: card.setCode,
    number: card.cardNumber,
    variant: card.variant,
    imageFront: card.imageFront,
    imageStatus: card.imageStatus,
  };
}

const franchises = [
  auditFranchise("Pokemon", pokemonCards()),
  auditFranchise("Magic", magicCards()),
  auditFranchise("Yu-Gi-Oh!", yugiohCards()),
];

const pokemonRepairReport = readJson("data/launch-readiness/pokemon-card-duplicate-repair.json", null);

const totals = franchises.reduce(
  (sum, item) => ({
    totalCards: sum.totalCards + item.totalCards,
    missingImageCount: sum.missingImageCount + item.missingImageCount,
    placeholderImageCount: sum.placeholderImageCount + item.placeholderImageCount,
    exactDuplicateGroupCount: sum.exactDuplicateGroupCount + item.exactDuplicateGroupCount,
    likelyDuplicateGroupCount: sum.likelyDuplicateGroupCount + item.likelyDuplicateGroupCount,
    variantReviewGroupCount: sum.variantReviewGroupCount + item.variantReviewGroupCount,
    reusedImageReviewGroupCount: sum.reusedImageReviewGroupCount + item.reusedImageReviewGroupCount,
    invalidImageSourceCount: sum.invalidImageSourceCount + item.invalidImageSourceCount,
  }),
  {
    totalCards: 0,
    missingImageCount: 0,
    placeholderImageCount: 0,
    exactDuplicateGroupCount: 0,
    likelyDuplicateGroupCount: 0,
    variantReviewGroupCount: 0,
    reusedImageReviewGroupCount: 0,
    invalidImageSourceCount: 0,
  }
);

const report = {
  ok: totals.exactDuplicateGroupCount === 0 && totals.likelyDuplicateGroupCount === 0 && totals.invalidImageSourceCount === 0,
  generatedAt: new Date().toISOString(),
  warnings: Array.from(new Set(franchises.flatMap((item) => item.warnings))).sort(),
  totals,
  repairSummary: {
    brokenImageRecordsFound: totals.missingImageCount,
    brokenImageRecordsFixed: 0,
    duplicateRecordsMerged: Number(pokemonRepairReport?.totalRemovedRecords || 0),
    duplicateFilesRepaired: Number(pokemonRepairReport?.repairedFiles?.length || 0),
    recordsOrGroupsNeedingManualReview: totals.missingImageCount + totals.variantReviewGroupCount + totals.reusedImageReviewGroupCount,
    affectedPagesAndComponents: [
      "Pokemon set and search grids",
      "Magic set and search grids",
      "Yu-Gi-Oh! set and search grids",
      "TCG card detail pages",
      "Pokemon Pikachu checklist article module",
      "Card health section on the data dashboard",
      "Pokemon/Magic/Yu-Gi-Oh API card responses",
      "Standalone Pokemon/Magic/Yu-Gi-Oh card detail pages",
    ],
    preventionAdded: [
      "Shared canonical card identity helper in the browser",
      "Server-side card identity enrichment and response dedupe",
      "API-backed Magic and Yu-Gi-Oh set-card loading",
      "Pre-write validation/dedupe guards in Pokemon, Magic, and Yu-Gi-Oh import scripts",
      "Collector identity fields shown on card detail views",
      "Neutral Image unavailable fallback for missing card media",
      "Admin/dev warning labels for duplicate rendering and missing media",
      "Automated TCG media guardrail audit",
      "Runtime card surface audit for major card pages and API responses",
      "Project-level audit:cards command",
    ],
  },
  canonicalKeyRule: "franchise + setCode/setName + cardNumber + normalized cardName + variant + language",
  publicRenderRule: "Each visible grid should dedupe by canonical key and show an honest Image unavailable fallback when a real card image is not displayable.",
  unresolvedManualReviewCount: totals.missingImageCount + totals.variantReviewGroupCount + totals.reusedImageReviewGroupCount,
  franchises,
};

writeJson(outputPath, report);
const markdown = [
  "# GCX Card System Health",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  `Status: ${report.ok ? "pass with manual-review queue" : "needs repair"}`,
  "",
  "## Totals",
  "",
  `- Total card records audited: ${totals.totalCards.toLocaleString()}`,
  `- Missing real card images logged for review: ${totals.missingImageCount.toLocaleString()}`,
  `- Exact duplicate groups remaining: ${totals.exactDuplicateGroupCount.toLocaleString()}`,
  `- Likely duplicate groups remaining: ${totals.likelyDuplicateGroupCount.toLocaleString()}`,
  `- Variant groups requiring review/labeling: ${totals.variantReviewGroupCount.toLocaleString()}`,
  `- Reused image groups requiring review/labeling: ${totals.reusedImageReviewGroupCount.toLocaleString()}`,
  `- Records/groups still needing manual review: ${report.unresolvedManualReviewCount.toLocaleString()}`,
  "",
  "## Repair Summary",
  "",
  `- Broken image records found: ${report.repairSummary.brokenImageRecordsFound.toLocaleString()}`,
  `- Broken image records automatically fixed: ${report.repairSummary.brokenImageRecordsFixed.toLocaleString()}`,
  `- Duplicate records merged: ${report.repairSummary.duplicateRecordsMerged.toLocaleString()}`,
  `- Files repaired during duplicate cleanup: ${report.repairSummary.duplicateFilesRepaired.toLocaleString()}`,
  `- Records/groups still needing manual review: ${report.repairSummary.recordsOrGroupsNeedingManualReview.toLocaleString()}`,
  "",
  "## Affected Pages and Components",
  "",
  ...report.repairSummary.affectedPagesAndComponents.map((item) => `- ${item}`),
  "",
  "## Structural Prevention Added",
  "",
  ...report.repairSummary.preventionAdded.map((item) => `- ${item}`),
  "",
  "## Rules Now Enforced",
  "",
  "- Do not generate fake card images.",
  "- Do not silently substitute an unrelated card image.",
  "- Preserve card aspect ratio with full card frame visible.",
  "- Dedupe rendered grids/search results by canonical card identity.",
  "- Log missing images and variant-review cases for admin/dev review.",
  "",
  "## Franchise Summary",
  "",
  ...franchises.flatMap((item) => [
    `### ${item.label}`,
    "",
    `- Cards audited: ${item.totalCards.toLocaleString()}`,
    `- Missing images: ${item.missingImageCount.toLocaleString()}`,
    `- Exact duplicate groups: ${item.exactDuplicateGroupCount.toLocaleString()}`,
    `- Variant-review groups: ${item.variantReviewGroupCount.toLocaleString()}`,
    `- Reused-image review groups: ${item.reusedImageReviewGroupCount.toLocaleString()}`,
    "",
  ]),
].join("\n");
fs.writeFileSync(markdownPath, `${markdown}\n`, "utf8");

console.log(JSON.stringify({ ok: report.ok, warnings: report.warnings, totals: report.totals, unresolvedManualReviewCount: report.unresolvedManualReviewCount, reportPath: path.relative(rootDir, outputPath), markdownPath: path.relative(rootDir, markdownPath) }, null, 2));

if (!report.ok) process.exitCode = 1;
