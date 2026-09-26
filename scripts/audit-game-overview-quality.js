const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-overview-quality.json");

const weakPatterns = [
  /officially released/i,
  /official release/i,
  /game record/i,
  /licensed north american/i,
  /software list/i,
  /\bbelongs to the .{0,80}\blibrary published by .{0,160}\bfirst appearing in \d{4}\b/i,
  /\bits identity comes from the .{0,80}\bcatalog'?s mix of handheld spin-offs, imports, ports, compilations, and smaller experiments\b/i,
  /\bregion, exact edition, manual, and cover-art details\b/i,
  /\bwhere publisher context, region, and\b/i,
  /\bfor players comparing listings,? the important checks are\b/i,
  /\bfor trading,? the safest listing should spell out region, format, edition, included extras, condition\b/i,
  /\bit translates (?:a sport|sports|a hobby|hobby) (?:or hobby )?into\b/i,
  /for collectors,? the key identifiers are/i,
  /released around \d{4}/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action) game for/i,
  /\bGCX should\b/i,
  /\bGCX should (?:frame|present|describe|label|identify|distinguish|make clear|position|highlight|flag|treat|call out|warn)\b/i,
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function overviewFor(game) {
  return game.description || game.gcxOverview || game.overview || "";
}

function providerFor(game) {
  return game.descriptionProvider || game.overviewProvider || "Unrecorded";
}

function sourceFor(game) {
  return game.descriptionSourceUrl || game.articleUrl || game.sourceUrl || "";
}

function pct(part, total) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

function summarizePlatform(fileName) {
  const slug = fileName.replace(/\.json$/, "");
  const games = readJson(path.join(gamesDir, fileName));
  if (!Array.isArray(games)) return null;

  const exactDescriptions = new Map();
  const providerCounts = new Map();
  const samples = [];
  let withOverview = 0;
  let weakTemplateCount = 0;
  let shortCount = 0;
  let missingSourceCount = 0;
  let reviewedEditorialCount = 0;
  const reviewStatusCounts = new Map();

  games.forEach((game) => {
    const overview = overviewFor(game);
    if (!overview) return;
    withOverview += 1;
    const provider = providerFor(game);
    providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);
    const reviewStatus = String(game.overviewReviewStatus || "").trim();
    if (provider === "GCX reviewed editorial overview" || reviewStatus) {
      reviewedEditorialCount += 1;
      reviewStatusCounts.set(reviewStatus || "published", (reviewStatusCounts.get(reviewStatus || "published") || 0) + 1);
    }

    const normalized = normalize(overview);
    exactDescriptions.set(normalized, [...(exactDescriptions.get(normalized) || []), game.id || game.title || "unknown"]);

    const weak = weakPatterns.some((pattern) => pattern.test(overview)) || provider === "GCX metadata editorial overview";
    if (weak) {
      weakTemplateCount += 1;
      if (samples.length < 8) samples.push({ id: game.id || "", title: game.title || game.name || "", provider, reason: "weak-template" });
    }
    if (String(overview).trim().length < 120) shortCount += 1;
    if (!sourceFor(game)) missingSourceCount += 1;
  });

  const exactDuplicateGroups = [...exactDescriptions.values()].filter((ids) => ids.length > 1);
  const exactDuplicateRows = exactDuplicateGroups.reduce((sum, ids) => sum + ids.length, 0);

  return {
    platform: slug,
    total: games.length,
    withOverview,
    overviewPct: pct(withOverview, games.length),
    weakTemplateCount,
    weakTemplatePct: pct(weakTemplateCount, withOverview),
    exactDuplicateGroups: exactDuplicateGroups.length,
    exactDuplicateRows,
    shortCount,
    missingSourceCount,
    reviewedEditorialCount,
    reviewedEditorialPct: pct(reviewedEditorialCount, withOverview),
    reviewStatusCounts: [...reviewStatusCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([status, count]) => ({ status, count })),
    topProviders: [...providerCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([provider, count]) => ({ provider, count })),
    samples,
  };
}

function main() {
  const files = fs.readdirSync(gamesDir).filter(isGameDatasetFile).sort();
  const platforms = files.map(summarizePlatform).filter(Boolean);
  const totals = platforms.reduce(
    (summary, platform) => {
      summary.total += platform.total;
      summary.withOverview += platform.withOverview;
      summary.weakTemplateCount += platform.weakTemplateCount;
      summary.exactDuplicateGroups += platform.exactDuplicateGroups;
      summary.exactDuplicateRows += platform.exactDuplicateRows;
      summary.shortCount += platform.shortCount;
      summary.missingSourceCount += platform.missingSourceCount;
      summary.reviewedEditorialCount += platform.reviewedEditorialCount;
      return summary;
    },
    {
      total: 0,
      withOverview: 0,
      weakTemplateCount: 0,
      exactDuplicateGroups: 0,
      exactDuplicateRows: 0,
      shortCount: 0,
      missingSourceCount: 0,
      reviewedEditorialCount: 0,
    }
  );

  const weakTemplatePct = pct(totals.weakTemplateCount, totals.withOverview);
  const exactDuplicatePct = pct(totals.exactDuplicateRows, totals.withOverview);
  const reviewNeeded = weakTemplatePct > 10 || exactDuplicatePct > 5 || totals.shortCount > 100;
  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    riskLevel: reviewNeeded ? "warning" : "pass",
    reviewNeeded,
    thresholds: {
      weakTemplatePctWarn: 10,
      exactDuplicatePctWarn: 5,
      shortOverviewCountWarn: 100,
    },
    totals: {
      ...totals,
      overviewPct: pct(totals.withOverview, totals.total),
      weakTemplatePct,
      exactDuplicatePct,
      reviewedEditorialPct: pct(totals.reviewedEditorialCount, totals.withOverview),
    },
    topRiskPlatforms: platforms
      .filter((platform) => platform.weakTemplateCount || platform.exactDuplicateRows || platform.shortCount)
      .sort(
        (a, b) =>
          b.weakTemplateCount - a.weakTemplateCount ||
          b.exactDuplicateRows - a.exactDuplicateRows ||
          b.shortCount - a.shortCount ||
          a.platform.localeCompare(b.platform)
      )
      .slice(0, 12),
    platforms,
  };

  writeJsonAtomic(fs, outputPath, report);
  console.log(JSON.stringify({ ...report, platforms: undefined }, null, 2));
}

main();
