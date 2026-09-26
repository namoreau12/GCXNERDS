const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "data", "games");
const outputPath = path.join(dataDir, "library-completeness.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isGameDataset(fileName) {
  return isGameDatasetFile(fileName);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasPublishedOverview(game) {
  if (game.overviewStatus === "needs_editorial") return false;
  const genericPhrases = [
    "officially released",
    "official release",
    "game record",
    "licensed north american",
    "software list",
  ];
  return [game.description, game.gcxOverview, game.overview].some((overview) => {
    if (!overview || String(overview).trim().length < 80) return false;
    const normalized = normalize(overview);
    return !genericPhrases.some((phrase) => normalized.includes(phrase));
  });
}

function hasResolvedImageStatus(game) {
  return ["no_standard_retail_box_art", "source_link_only", "not_applicable"].includes(
    String(game.imageAvailabilityStatus || "")
      .trim()
      .toLowerCase()
  );
}

function pct(part, total) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

function summarize(platform, games) {
  const total = games.length;
  const imageUnavailableCount = games.filter((game) => !game.imageUrl && hasResolvedImageStatus(game)).length;
  const imageCount = games.filter((game) => game.imageUrl || hasResolvedImageStatus(game)).length;
  const overviewCount = games.filter(hasPublishedOverview).length;
  const missingImages = games
    .filter((game) => !game.imageUrl && !hasResolvedImageStatus(game))
    .slice(0, 250)
    .map((game) => ({ id: game.id, title: game.title, articleUrl: game.articleUrl || "" }));
  const missingOverviews = games
    .filter((game) => !hasPublishedOverview(game))
    .slice(0, 250)
    .map((game) => ({ id: game.id, title: game.title, articleUrl: game.articleUrl || "", imageUrl: game.imageUrl || "" }));

  return {
    platform,
    total,
    images: imageCount,
    imageUnavailableCount,
    imagePct: pct(imageCount, total),
    missingImages: total - imageCount,
    overviews: overviewCount,
    overviewPct: pct(overviewCount, total),
    missingOverviews: total - overviewCount,
    sampleMissingImages: missingImages,
    sampleMissingOverviews: missingOverviews,
  };
}

function main() {
  const files = fs.readdirSync(dataDir).filter(isGameDataset).sort();
  const libraries = files
    .map((fileName) => {
      const value = readJson(path.join(dataDir, fileName));
      if (!Array.isArray(value)) return null;
      return summarize(fileName.replace(/\.json$/, ""), value);
    })
    .filter(Boolean);

  const totals = libraries.reduce(
    (acc, library) => {
      acc.total += library.total;
      acc.images += library.images;
      acc.imageUnavailableCount += library.imageUnavailableCount || 0;
      acc.overviews += library.overviews;
      return acc;
    },
    { total: 0, images: 0, imageUnavailableCount: 0, overviews: 0 }
  );

  const report = {
    auditedAt: new Date().toISOString(),
    libraryCount: libraries.length,
    totals: {
      totalGames: totals.total,
      images: totals.images,
      imageUnavailableCount: totals.imageUnavailableCount,
      imagePct: pct(totals.images, totals.total),
      missingImages: totals.total - totals.images,
      overviews: totals.overviews,
      overviewPct: pct(totals.overviews, totals.total),
      missingOverviews: totals.total - totals.overviews,
    },
    priority: {
      imageBacklog: libraries
        .filter((library) => library.missingImages)
        .sort((a, b) => b.missingImages - a.missingImages)
        .map(({ platform, missingImages, imagePct }) => ({ platform, missingImages, imagePct })),
      overviewBacklog: libraries
        .filter((library) => library.missingOverviews)
        .sort((a, b) => b.missingOverviews - a.missingOverviews)
        .map(({ platform, missingOverviews, overviewPct }) => ({ platform, missingOverviews, overviewPct })),
    },
    libraries,
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.table(
    libraries.map(({ platform, total, images, imageUnavailableCount, imagePct, missingImages, overviews, overviewPct, missingOverviews }) => ({
      platform,
      total,
      images,
      imageUnavailableCount,
      imagePct,
      missingImages,
      overviews,
      overviewPct,
      missingOverviews,
    }))
  );
  console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
}

main();
