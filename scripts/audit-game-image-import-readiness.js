const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-image-import-readiness.json");

const batchDirs = [
  path.join(gamesDir, "finishable-review-batches"),
  path.join(gamesDir, "review-batches"),
  path.join(gamesDir, "milestone-review-batches"),
];

function readEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
}

function hasUsableKey(env, key) {
  const value = String(env[key] || "").trim();
  return Boolean(value && !/^(replace_with_|your_)/i.test(value));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((csvRow) => csvRow.some((value) => String(value || "").trim()));
}

function approvedStatus(value) {
  return /^(approved|verified|reviewed)$/i.test(String(value || "").trim());
}

function validUrl(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function gameImageUrl(game) {
  return game?.imageUrl || game?.boxArtUrl || game?.coverUrl || game?.coverImage || game?.thumbnailUrl || "";
}

const platformCache = new Map();

function platformGames(platformSlug) {
  const slug = String(platformSlug || "").trim();
  if (!slug) return [];
  if (platformCache.has(slug)) return platformCache.get(slug);
  const filePath = path.join(gamesDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    platformCache.set(slug, []);
    return [];
  }
  try {
    const games = JSON.parse(fs.readFileSync(filePath, "utf8"));
    platformCache.set(slug, Array.isArray(games) ? games : []);
    return platformCache.get(slug);
  } catch {
    platformCache.set(slug, []);
    return [];
  }
}

function liveGameHasSameImage(row, indexes) {
  const platformSlug = String(row[indexes.platformSlug] || "").trim();
  const gameId = String(row[indexes.gameId] || "").trim();
  const imageUrl = String(row[indexes.imageUrl] || "").trim();
  if (!platformSlug || !gameId || !imageUrl) return false;
  const game = platformGames(platformSlug).find((entry) => String(entry?.id || "") === gameId);
  return String(gameImageUrl(game) || "").trim() === imageUrl;
}

function scanCsv(filePath) {
  const rows = parseCsv(fs.readFileSync(filePath, "utf8"));
  const headers = rows[0] || [];
  const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
  const requiredHeaders = ["platformSlug", "gameId", "imageUrl", "imageSourceUrl", "imageProvider", "reviewStatus", "reviewer"];
  const missingHeaders = requiredHeaders.filter((header) => indexes[header] === undefined);
  const stats = {
    path: path.relative(rootDir, filePath),
    rows: Math.max(0, rows.length - 1),
    rowsWithImageUrl: 0,
    readyToImport: 0,
    incompleteReviewedRows: 0,
    invalidUrlRows: 0,
    alreadyAppliedRows: 0,
    missingHeaders,
    samplesReady: [],
    samplesAlreadyApplied: [],
    samplesIncomplete: [],
  };

  if (missingHeaders.length) return stats;

  rows.slice(1).forEach((row) => {
    const imageUrl = String(row[indexes.imageUrl] || "").trim();
    const imageSourceUrl = String(row[indexes.imageSourceUrl] || "").trim();
    const imageProvider = String(row[indexes.imageProvider] || "").trim();
    const reviewStatus = String(row[indexes.reviewStatus] || "").trim();
    const reviewer = String(row[indexes.reviewer] || "").trim();
    const hasImage = Boolean(imageUrl);
    const hasReviewSignal = Boolean(imageUrl || imageSourceUrl || imageProvider || reviewStatus || reviewer);
    const isReady = hasImage && imageSourceUrl && imageProvider && approvedStatus(reviewStatus) && reviewer && validUrl(imageUrl) && validUrl(imageSourceUrl);

    const alreadyApplied = isReady && liveGameHasSameImage(row, indexes);

    if (hasImage) stats.rowsWithImageUrl += 1;
    if (alreadyApplied) {
      stats.alreadyAppliedRows += 1;
      if (stats.samplesAlreadyApplied.length < 5) {
        stats.samplesAlreadyApplied.push({
          platformSlug: row[indexes.platformSlug],
          gameId: row[indexes.gameId],
          provider: imageProvider,
        });
      }
      return;
    }
    if (isReady) {
      stats.readyToImport += 1;
      if (stats.samplesReady.length < 5) {
        stats.samplesReady.push({
          platformSlug: row[indexes.platformSlug],
          gameId: row[indexes.gameId],
          provider: imageProvider,
        });
      }
    } else if (hasReviewSignal) {
      stats.incompleteReviewedRows += 1;
      if ((imageUrl && !validUrl(imageUrl)) || (imageSourceUrl && !validUrl(imageSourceUrl))) stats.invalidUrlRows += 1;
      if (stats.samplesIncomplete.length < 5) {
        stats.samplesIncomplete.push({
          platformSlug: row[indexes.platformSlug],
          gameId: row[indexes.gameId],
          hasImageUrl: Boolean(imageUrl),
          hasSourceUrl: Boolean(imageSourceUrl),
          hasProvider: Boolean(imageProvider),
          reviewStatus,
          hasReviewer: Boolean(reviewer),
        });
      }
    }
  });

  return stats;
}

function main() {
  const env = readEnv();
  const files = batchDirs.flatMap((dir) =>
    fs.existsSync(dir)
      ? fs
          .readdirSync(dir)
          .filter((entry) => entry.endsWith(".csv"))
          .map((entry) => path.join(dir, entry))
      : []
  );
  const batches = files.map(scanCsv);
  const totals = batches.reduce(
    (sum, batch) => ({
      rows: sum.rows + batch.rows,
      rowsWithImageUrl: sum.rowsWithImageUrl + batch.rowsWithImageUrl,
      readyToImport: sum.readyToImport + batch.readyToImport,
      incompleteReviewedRows: sum.incompleteReviewedRows + batch.incompleteReviewedRows,
      invalidUrlRows: sum.invalidUrlRows + batch.invalidUrlRows,
      alreadyAppliedRows: sum.alreadyAppliedRows + batch.alreadyAppliedRows,
    }),
    { rows: 0, rowsWithImageUrl: 0, readyToImport: 0, incompleteReviewedRows: 0, invalidUrlRows: 0, alreadyAppliedRows: 0 }
  );
  const providerKeys = {
    mobygames: hasUsableKey(env, "MOBYGAMES_API_KEY"),
    rawg: hasUsableKey(env, "RAWG_API_KEY"),
  };
  const failures = [];
  batches
    .filter((batch) => batch.missingHeaders.length)
    .forEach((batch) => failures.push(`${batch.path} is missing headers: ${batch.missingHeaders.join(", ")}`));
  if (totals.incompleteReviewedRows) failures.push(`${totals.incompleteReviewedRows} image review row(s) are partially filled but not import-ready.`);
  if (totals.invalidUrlRows) failures.push(`${totals.invalidUrlRows} image review row(s) have invalid image/source URLs.`);

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    batchCount: batches.length,
    totals,
    providerKeys,
    readyBatchCount: batches.filter((batch) => batch.readyToImport > 0).length,
    readyBatches: batches.filter((batch) => batch.readyToImport > 0).map((batch) => ({
      path: batch.path,
      readyToImport: batch.readyToImport,
      samplesReady: batch.samplesReady,
    })),
    alreadyAppliedBatches: batches.filter((batch) => batch.alreadyAppliedRows > 0).map((batch) => ({
      path: batch.path,
      alreadyAppliedRows: batch.alreadyAppliedRows,
      samplesAlreadyApplied: batch.samplesAlreadyApplied,
    })),
    failures,
    nextAction: totals.readyToImport
      ? "Run scripts/import-game-image-urls.js against ready reviewed CSV rows, then validate image provenance and URL health."
      : providerKeys.mobygames
        ? "Validate MOBYGAMES_API_KEY, confirm the provider plan permits GCX's intended use, then run the MobyGames image enrichment pipeline in dry-run mode."
        : "No approved image rows are ready to import. Add MOBYGAMES_API_KEY after confirming plan terms for GCX use, or manually fill imageUrl, imageSourceUrl, imageProvider, reviewStatus, and reviewer in the image review CSVs.",
  };

  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
