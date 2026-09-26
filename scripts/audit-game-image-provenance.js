const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-image-provenance.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pct(part, total) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

function imageUrlFor(game) {
  return game.imageUrl || game.boxArtUrl || game.coverUrl || game.coverImage || game.thumbnailUrl || "";
}

function providerFor(game) {
  return game.imageProvider || (game.imageUrl ? "Unrecorded" : "");
}

function sourceFor(game) {
  return game.imageSourceUrl || game.imageUrl || "";
}

function isKnownUnavailableImage(game) {
  return String(game.imageAvailabilityStatus || "").trim() === "no_standard_retail_box_art";
}

function increment(map, key) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + 1);
}

function summarizePlatform(fileName) {
  const slug = fileName.replace(/\.json$/, "");
  const games = readJson(path.join(gamesDir, fileName));
  if (!Array.isArray(games)) return null;

  const providerCounts = new Map();
  const reviewStatusCounts = new Map();
  const samplesMissingProvider = [];
  const samplesReviewed = [];
  let images = 0;
  let withProvider = 0;
  let withSource = 0;
  let reviewedImages = 0;
  let knownUnavailableImages = 0;

  games.forEach((game) => {
    const imageUrl = imageUrlFor(game);
    if (!imageUrl) {
      if (isKnownUnavailableImage(game)) knownUnavailableImages += 1;
      return;
    }
    images += 1;
    const provider = providerFor(game);
    const source = sourceFor(game);
    const reviewStatus = String(game.imageReviewStatus || "").trim();
    const reviewer = String(game.imageReviewer || "").trim();

    if (provider && provider !== "Unrecorded") withProvider += 1;
    else if (samplesMissingProvider.length < 8) samplesMissingProvider.push({ id: game.id || "", title: game.title || game.name || "", imageUrl });
    if (source) withSource += 1;
    if (reviewStatus || reviewer) {
      reviewedImages += 1;
      increment(reviewStatusCounts, reviewStatus || "reviewed");
      if (samplesReviewed.length < 8) samplesReviewed.push({ id: game.id || "", title: game.title || game.name || "", reviewStatus, reviewer });
    }
    increment(providerCounts, provider || "Unrecorded");
  });

  return {
    platform: slug,
    total: games.length,
    images,
    knownUnavailableImages,
    imagePct: pct(images, games.length),
    withProvider,
    providerPct: pct(withProvider, images),
    withSource,
    sourcePct: pct(withSource, images),
    reviewedImages,
    reviewedPct: pct(reviewedImages, images),
    unresolvedMissingImages: Math.max(0, games.length - images - knownUnavailableImages),
    missingProvider: Math.max(0, images - withProvider),
    missingSource: Math.max(0, images - withSource),
    providerCounts: [...providerCounts.entries()].map(([provider, count]) => ({ provider, count })),
    topProviders: [...providerCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([provider, count]) => ({ provider, count })),
    reviewStatusCounts: [...reviewStatusCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([status, count]) => ({ status, count })),
    samplesMissingProvider,
    samplesReviewed,
  };
}

function main() {
  const platforms = fs.readdirSync(gamesDir).filter(isGameDatasetFile).sort().map(summarizePlatform).filter(Boolean);
  const providerCounts = new Map();
  const totals = platforms.reduce(
    (summary, platform) => {
      summary.total += platform.total;
      summary.images += platform.images;
      summary.withProvider += platform.withProvider;
      summary.withSource += platform.withSource;
      summary.reviewedImages += platform.reviewedImages;
      summary.knownUnavailableImages += platform.knownUnavailableImages;
      return summary;
    },
    { total: 0, images: 0, withProvider: 0, withSource: 0, reviewedImages: 0, knownUnavailableImages: 0 }
  );

  platforms.forEach((platform) => {
    platform.providerCounts.forEach((item) => {
      providerCounts.set(item.provider, (providerCounts.get(item.provider) || 0) + item.count);
    });
  });

  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    totals: {
      ...totals,
      imagePct: pct(totals.images, totals.total),
      providerPct: pct(totals.withProvider, totals.images),
      sourcePct: pct(totals.withSource, totals.images),
      reviewedPct: pct(totals.reviewedImages, totals.images),
      missingImages: Math.max(0, totals.total - totals.images - totals.knownUnavailableImages),
      unresolvedMissingImages: Math.max(0, totals.total - totals.images - totals.knownUnavailableImages),
      missingProvider: Math.max(0, totals.images - totals.withProvider),
      missingSource: Math.max(0, totals.images - totals.withSource),
    },
    topProviders: [...providerCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 16)
      .map(([provider, count]) => ({ provider, count })),
    topMissingProviderPlatforms: platforms
      .filter((platform) => platform.missingProvider)
      .sort((a, b) => b.missingProvider - a.missingProvider || a.platform.localeCompare(b.platform))
      .slice(0, 12)
      .map(({ platform, images, missingProvider, providerPct, samplesMissingProvider }) => ({ platform, images, missingProvider, providerPct, samplesMissingProvider })),
    platforms,
  };

  writeJsonAtomic(fs, outputPath, report);
  console.log(JSON.stringify({ ...report, platforms: undefined }, null, 2));
}

main();
