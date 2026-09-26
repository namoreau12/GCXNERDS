const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const inputPath = path.join(rootDir, "data", "games", "missing-image-queue.json");

const args = process.argv.slice(2);
const finishable = args.includes("--finishable");
const reviewBatch = args.includes("--review-batch");
const limitPlatforms = Number((args.find((arg) => arg.startsWith("--limit-platforms=")) || "").split("=")[1] || 8);
const limitRecords = Number((args.find((arg) => arg.startsWith("--limit-records=")) || "").split("=")[1] || (reviewBatch ? 50 : 0));
const platformArg = (args.find((arg) => arg.startsWith("--platform=")) || "").split("=").slice(1).join("=").trim();
const outputArg = args.find((arg) => arg.startsWith("--output="));
const outputPath = outputArg
  ? path.resolve(rootDir, outputArg.split("=").slice(1).join("="))
  : path.join(rootDir, "data", "games", reviewBatch ? "review-image-batch.csv" : finishable ? "finishable-image-queue.csv" : "missing-image-queue.csv");

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function searchUrl(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
}

function providerSearches(record) {
  if (record.providerSearches) return record.providerSearches;
  const query = [record.title, record.platform].filter(Boolean).join(" ");
  return {
    rawg: searchUrl("https://rawg.io/search", { query }),
    mobyGames: searchUrl("https://www.mobygames.com/search/", { q: query }),
    wikipedia: searchUrl("https://en.wikipedia.org/w/index.php", { search: query }),
    webImages: searchUrl("https://www.google.com/search", { tbm: "isch", q: `${query} cover art` }),
  };
}

function main() {
  const queue = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const basePlatforms = finishable || reviewBatch
    ? [...(queue.platforms || [])]
        .filter((platform) => platform.missingImages > 0)
        .sort((a, b) => (reviewBatch ? b.missingImages - a.missingImages || a.slug.localeCompare(b.slug) : a.missingImages - b.missingImages || b.imagePct - a.imagePct))
    : queue.platforms || [];
  const platforms = basePlatforms
    .filter((platform) => !platformArg || platform.slug === platformArg)
    .slice(0, reviewBatch ? 1 : finishable ? limitPlatforms : basePlatforms.length);
  const rows = [
    [
      "priorityRank",
      "platformSlug",
      "platformLabel",
      "platformMissingImages",
      "platformImagePct",
      "gameId",
      "title",
      "platform",
      "releaseDate",
      "publishers",
      "developers",
      "source",
      "sourceUrl",
      "providerPriority",
      "providerHint",
      "rawgSearchUrl",
      "mobyGamesSearchUrl",
      "wikipediaSearchUrl",
      "webImageSearchUrl",
      "imageUrl",
      "imageSourceUrl",
      "imageProvider",
      "notes",
      "reviewStatus",
      "reviewer",
    ],
  ];

  for (const [platformIndex, platform] of platforms.entries()) {
    const records = limitRecords > 0 ? (platform.records || []).slice(0, limitRecords) : platform.records || [];
    for (const record of records) {
      const searches = providerSearches(record);
      rows.push([
        platformIndex + 1,
        platform.slug,
        platform.label,
        platform.missingImages,
        platform.imagePct,
        record.id,
        record.title,
        record.platform,
        record.releaseDate,
        (record.publishers || []).join("; "),
        (record.developers || []).join("; "),
        record.source,
        record.sourceUrl,
        (record.providerPriority || []).join(" > "),
        record.providerHint || "",
        searches.rawg,
        searches.mobyGames,
        searches.wikipedia,
        searches.webImages,
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    }
  }

  fs.writeFileSync(outputPath, `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`);
  console.log(
    `Exported ${rows.length - 1} ${reviewBatch ? "review batch " : finishable ? "finishable " : ""}missing image records across ${platforms.length} platforms to ${path.relative(rootDir, outputPath)}.`
  );
}

main();
