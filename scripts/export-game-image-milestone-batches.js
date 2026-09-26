const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const queuePath = path.join(gamesDir, "missing-image-queue.json");
const planPath = path.join(gamesDir, "image-coverage-plan.json");
const outputDir = path.join(gamesDir, "milestone-review-batches");
const indexPath = path.join(gamesDir, "milestone-image-review-batches.json");

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

function csvRows(records) {
  const rows = [
    [
      "milestoneTargetPct",
      "milestoneRank",
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
      record.milestoneTargetPct,
      record.milestoneRank,
      record.platformSlug,
      record.platformLabel,
      record.platformMissingImages,
      record.platformImagePct,
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

function platformMap(queue) {
  return new Map((queue.platforms || []).map((platform) => [platform.slug, platform]));
}

function recordsForMilestone(milestone, platformsBySlug) {
  const records = [];
  for (const [rank, platformPlan] of (milestone.platformPlan || []).entries()) {
    const platform = platformsBySlug.get(platformPlan.platform);
    const platformRecords = (platform?.records || []).slice(0, Number(platformPlan.reviewedImages || 0));
    platformRecords.forEach((record) => {
      records.push({
        ...record,
        milestoneTargetPct: milestone.targetPct,
        milestoneRank: rank + 1,
        platformSlug: platform.slug,
        platformLabel: platform.label,
        platformMissingImages: platform.missingImages,
        platformImagePct: platform.imagePct,
      });
    });
  }
  return records;
}

function main() {
  const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const platformsBySlug = platformMap(queue);
  fs.mkdirSync(outputDir, { recursive: true });

  const batches = (plan.milestones || [])
    .filter((milestone) => !milestone.targetMet && Number(milestone.additionalImagesNeeded || 0) > 0)
    .map((milestone) => {
      const records = recordsForMilestone(milestone, platformsBySlug);
      const fileName = `${String(milestone.targetPct).replace(/\./g, "-")}-pct-image-review-batch.csv`;
      const outputPath = path.join(outputDir, fileName);
      fs.writeFileSync(outputPath, csvRows(records));
      return {
        targetPct: milestone.targetPct,
        currentPct: milestone.currentPct,
        additionalImagesNeeded: milestone.additionalImagesNeeded,
        records: records.length,
        platforms: [...new Set(records.map((record) => record.platformSlug))],
        path: `data/games/milestone-review-batches/${fileName}`,
        generatedAt: new Date().toISOString(),
      };
    });

  const index = {
    generatedAt: new Date().toISOString(),
    batchMode: "coverage-milestones",
    totalRecords: batches.reduce((sum, batch) => sum + Number(batch.records || 0), 0),
    batches,
  };
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  console.table(batches.map(({ targetPct, records, platforms, path }) => ({ targetPct, records, platforms: platforms.join(", "), path })));
  console.log(`Wrote ${batches.length} milestone image review batches to ${path.relative(rootDir, outputDir)}.`);
  console.log(`Wrote ${path.relative(rootDir, indexPath)}.`);
}

main();
