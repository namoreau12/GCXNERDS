const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");

const args = process.argv.slice(2);
const finishable = args.includes("--finishable");
const limitPlatforms = Number((args.find((arg) => arg.startsWith("--limit-platforms=")) || "").split("=")[1] || 8);
const limitRecords = Number((args.find((arg) => arg.startsWith("--limit-records=")) || "").split("=")[1] || (finishable ? 0 : 100));
const inputPath = path.join(rootDir, "data", "games", finishable ? "finishable-image-queue.json" : "missing-image-queue.json");
const outputFolderName = finishable ? "finishable-review-batches" : "review-batches";
const outputDir = path.join(rootDir, "data", "games", outputFolderName);
const indexPath = path.join(rootDir, "data", "games", finishable ? "finishable-image-review-batches.json" : "priority-image-review-batches.json");

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

function batchRows(platform, records) {
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

  for (const record of records) {
    const searches = providerSearches(record);
    rows.push([
      platform.priorityRank,
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

  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function main() {
  const queue = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  fs.mkdirSync(outputDir, { recursive: true });

  const platforms = [...(queue.platforms || [])]
    .filter((platform) => platform.missingImages > 0 && (!finishable || (platform.records || []).length > 0))
    .sort((a, b) =>
      finishable
        ? a.missingImages - b.missingImages || b.imagePct - a.imagePct
        : b.missingImages - a.missingImages || a.slug.localeCompare(b.slug)
    )
    .slice(0, limitPlatforms)
    .map((platform, index) => ({ ...platform, priorityRank: index + 1 }));

  const batches = platforms.map((platform) => {
    const records = limitRecords > 0 ? (platform.records || []).slice(0, limitRecords) : platform.records || [];
    const fileName = `${platform.slug}-image-review-batch.csv`;
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, batchRows(platform, records));
    return {
      platformSlug: platform.slug,
      platformLabel: platform.label,
      missingImages: platform.missingImages,
      imagePct: platform.imagePct,
      records: records.length,
      path: `data/games/${outputFolderName}/${fileName}`,
      generatedAt: new Date().toISOString(),
    };
  });

  const index = {
    generatedAt: new Date().toISOString(),
    batchMode: finishable ? "finishable-platforms" : "priority-platforms",
    limitPlatforms,
    limitRecords,
    totalRecords: batches.reduce((sum, batch) => sum + batch.records, 0),
    batches,
  };
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  console.table(batches.map(({ platformSlug, missingImages, imagePct, records, path }) => ({ platformSlug, missingImages, imagePct, records, path })));
  console.log(`Wrote ${batches.length} ${finishable ? "finishable" : "priority"} image review batches to ${path.relative(rootDir, outputDir)}.`);
  console.log(`Wrote ${path.relative(rootDir, indexPath)}.`);
}

main();
