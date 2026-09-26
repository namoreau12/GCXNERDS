const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDataDir = path.join(rootDir, "data", "games");
const outputPath = path.join(gamesDataDir, "library-cleanup-queue.json");
const missingImagesOutputPath = path.join(gamesDataDir, "missing-image-queue.json");
const finishableImagesOutputPath = path.join(gamesDataDir, "finishable-image-queue.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  writeJsonAtomic(fs, filePath, value);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function firstFilled(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim()) || "";
}

function gameImageUrl(game) {
  return firstFilled(game.imageUrl, game.boxArtUrl, game.coverUrl, game.coverImage, game.thumbnailUrl);
}

function hasResolvedImageStatus(game) {
  return ["no_standard_retail_box_art", "source_link_only", "not_applicable"].includes(
    String(game.imageAvailabilityStatus || "")
      .trim()
      .toLowerCase()
  );
}

function isDeferredImageReview(game) {
  return ["source_conflict_review_deferred", "deferred_source_conflict", "needs_better_source"].includes(
    String(game.imageReviewStatus || game.imageAvailabilityStatus || "")
      .trim()
      .toLowerCase()
  );
}

function hasUsefulGameOverview(game) {
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

function isGameDataset(fileName) {
  return isGameDatasetFile(fileName);
}

function pct(part, total) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

function healthStatus({ total, imagePct, missingImages, overviewPct, missingOverviews }) {
  if (!total) return "attention";
  if (missingImages >= 100 || imagePct < 90 || missingOverviews >= 25 || overviewPct < 95) return "needs-work";
  if (missingImages > 0 || missingOverviews > 0) return "attention";
  return "healthy";
}

function searchUrl(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
}

function providerSearches(slug, game) {
  const title = game.title || game.name || "";
  const platform = game.platform || slug.toUpperCase();
  const query = [title, platform].filter(Boolean).join(" ");
  return {
    mobyGames: searchUrl("https://www.mobygames.com/search/", { q: query }),
    rawg: searchUrl("https://rawg.io/search", { query }),
    wikipedia: searchUrl("https://en.wikipedia.org/w/index.php", { search: query }),
    webImages: searchUrl("https://www.google.com/search", { tbm: "isch", q: `${query} cover art` }),
  };
}

function providerHint(slug) {
  const official = {
    switch: "Official Nintendo US/JP catalog scripts are active but currently exhausted for strict matches.",
    "3ds": "Official Nintendo sources are limited; use MobyGames first, then Libretro/Wikipedia review for older retail titles.",
    ds: "Use MobyGames first, then Libretro/Wikipedia review for older retail titles.",
    wii: "Use MobyGames first, then Libretro/Wikipedia review for retail titles.",
    ps1: "PlayStation Chihiro cache and Libretro exact passes are active; remaining matches need MobyGames or manual review.",
    ps2: "PlayStation Chihiro cache and Libretro exact passes are active; remaining matches need MobyGames or manual review.",
    ps3: "PlayStation Chihiro cache is active but mostly exhausted; remaining matches need MobyGames or manual review.",
    ps4: "PlayStation Store cache is active but strict matches are currently exhausted; use MobyGames next.",
    ps5: "PlayStation Store cache is active but strict matches are currently exhausted; use MobyGames next.",
    psp: "PlayStation Chihiro cache and Libretro exact passes are active; remaining matches need MobyGames or manual review.",
    vita: "PlayStation Chihiro cache is active but mostly exhausted; remaining matches need MobyGames or manual review.",
    xbox360: "Microsoft catalog script is active but strict matches are currently exhausted; use MobyGames next.",
    xbox: "Libretro exact pass is active; use MobyGames for remaining gaps.",
  };
  const libretroPlatforms = new Set(["dreamcast", "gameboy", "gamecube", "gba", "genesis", "n64", "nes", "saturn", "snes"]);
  if (official[slug]) return official[slug];
  if (libretroPlatforms.has(slug)) return "Libretro exact pass is active; use MobyGames or manual review for remaining gaps.";
  return "Use MobyGames first, then RAWG/manual review if licensing and match quality are acceptable.";
}

function providerPriority(slug) {
  if (["switch", "3ds", "ds", "wii"].includes(slug)) return ["MobyGames", "Nintendo/Wikipedia review", "RAWG"];
  if (["ps1", "ps2", "ps3", "ps4", "ps5", "psp", "vita"].includes(slug)) return ["MobyGames", "PlayStation cache review", "RAWG"];
  if (["xbox", "xbox360"].includes(slug)) return ["MobyGames", "Microsoft/Libretro review", "RAWG"];
  return ["MobyGames", "Libretro review", "RAWG"];
}

function summarizeGame(slug, game) {
  return {
    id: game.id || "",
    title: game.title || game.name || "",
    platform: game.platform || slug.toUpperCase(),
    releaseDate: game.releaseDate || "",
    publishers: game.publishers || [],
    developers: game.developers || [],
    genres: game.genres || [],
    source: game.source || "",
    sourceUrl: game.articleUrl || game.descriptionSourceUrl || game.storeUrl || "",
    imageUrl: gameImageUrl(game),
    imageAvailabilityStatus: game.imageAvailabilityStatus || "",
    imageAvailabilityReason: game.imageAvailabilityReason || "",
    imageAvailabilitySourceUrl: game.imageAvailabilitySourceUrl || "",
    imageReviewStatus: game.imageReviewStatus || "",
    imageReviewNotes: game.imageReviewNotes || "",
    overviewStatus: game.overviewStatus || "",
    descriptionProvider: game.descriptionProvider || "",
    providerPriority: providerPriority(slug),
    providerHint: providerHint(slug),
    providerSearches: providerSearches(slug, game),
  };
}

function main() {
  const libraries = fs
    .readdirSync(gamesDataDir)
    .filter(isGameDataset)
    .sort()
    .map((fileName) => {
      const slug = fileName.replace(/\.json$/, "");
      const games = readJson(path.join(gamesDataDir, fileName));
      if (!Array.isArray(games)) return null;

      const missingImages = games.filter((game) => !gameImageUrl(game) && !hasResolvedImageStatus(game)).map((game) => summarizeGame(slug, game));
      const missingOverviews = games.filter((game) => !hasUsefulGameOverview(game)).map((game) => summarizeGame(slug, game));
      const actionableMissingImages = missingImages.filter((record) => !["source_conflict_review_deferred", "deferred_source_conflict", "needs_better_source"].includes(String(record.imageReviewStatus || "").trim().toLowerCase()));
      const imageCount = games.length - missingImages.length;
      const overviewCount = games.length - missingOverviews.length;
      const imagePct = pct(imageCount, games.length);
      const overviewPct = pct(overviewCount, games.length);
      const status = healthStatus({
        total: games.length,
        imagePct,
        missingImages: missingImages.length,
        actionableMissingImages: actionableMissingImages.length,
        deferredImageReviews: missingImages.length - actionableMissingImages.length,
        overviewPct,
        missingOverviews: missingOverviews.length,
      });

      return {
        slug,
        label: `${slug.toUpperCase()} Games`,
        total: games.length,
        imageCount,
        imagePct,
        missingImages: missingImages.length,
        overviewCount,
        overviewPct,
        missingOverviews: missingOverviews.length,
        status,
        priorityScore: missingImages.length + missingOverviews.length,
        recommendedPass: missingOverviews.length >= missingImages.length ? "overview" : "image",
        imageQueue: missingImages.slice(0, 250),
        overviewQueue: missingOverviews.slice(0, 250),
        fullImageQueue: missingImages,
        actionableFullImageQueue: actionableMissingImages,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.priorityScore - a.priorityScore || a.slug.localeCompare(b.slug));

  const totals = libraries.reduce(
    (summary, library) => {
      summary.total += library.total;
      summary.missingImages += library.missingImages;
      summary.missingOverviews += library.missingOverviews;
      return summary;
    },
    { total: 0, missingImages: 0, missingOverviews: 0 }
  );

  const report = {
    generatedAt: new Date().toISOString(),
    totals,
    priority: libraries.slice(0, 12).map(({ slug, label, total, missingImages, missingOverviews, imagePct, overviewPct, status, recommendedPass, priorityScore }) => ({
      slug,
      label,
      total,
      missingImages,
      missingOverviews,
      imagePct,
      overviewPct,
      status,
      recommendedPass,
      priorityScore,
    })),
    libraries: libraries.map(({ fullImageQueue, ...library }) => library),
  };
  const missingImageQueue = {
    generatedAt: report.generatedAt,
    queueVersion: "provider-hints-v1",
    totals: {
      libraries: libraries.filter((library) => library.missingImages > 0).length,
      missingImages: totals.missingImages,
    },
    platforms: libraries
      .filter((library) => library.missingImages > 0)
      .map((library) => ({
        slug: library.slug,
        label: library.label,
        total: library.total,
        missingImages: library.missingImages,
        imagePct: library.imagePct,
        records: library.fullImageQueue,
      })),
  };
  const finishableLibraries = libraries
    .filter((library) => Number(library.actionableMissingImages ?? library.missingImages) > 0)
    .sort((a, b) => Number(a.actionableMissingImages ?? a.missingImages) - Number(b.actionableMissingImages ?? b.missingImages) || b.imagePct - a.imagePct)
    .slice(0, 8);
  const finishableImageQueue = {
    generatedAt: report.generatedAt,
    queueVersion: "provider-hints-v1",
    queueMode: "finishable",
    totals: {
      libraries: finishableLibraries.length,
      missingImages: finishableLibraries.reduce((sum, library) => sum + library.missingImages, 0),
    },
    platforms: finishableLibraries.map((library) => ({
      slug: library.slug,
      label: library.label,
      total: library.total,
      missingImages: Number(library.actionableMissingImages ?? library.missingImages),
      deferredImageReviews: library.deferredImageReviews || 0,
      imagePct: library.imagePct,
      records: library.actionableFullImageQueue || library.fullImageQueue,
    })),
  };

  writeJson(outputPath, report);
  writeJson(missingImagesOutputPath, missingImageQueue);
  writeJson(finishableImagesOutputPath, finishableImageQueue);
  console.table(report.priority);
  console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
  console.log(`Wrote ${path.relative(rootDir, missingImagesOutputPath)}`);
  console.log(`Wrote ${path.relative(rootDir, finishableImagesOutputPath)}`);
}

main();
