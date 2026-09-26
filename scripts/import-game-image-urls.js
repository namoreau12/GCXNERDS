const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { isGameDatasetFile } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const dryRun = flags.has("--dry-run");
const validateRemote = flags.has("--validate-remote");
const force = flags.has("--force");
const help = flags.has("--help") || flags.has("-h");
const inputArg = args.find((arg) => !arg.startsWith("--"));
const inputPath = path.resolve(rootDir, inputArg || path.join("data", "games", "missing-image-queue.csv"));
const reportOutputArg = args.find((arg) => arg.startsWith("--report-output="));
const reportOutputPath = reportOutputArg
  ? path.resolve(rootDir, reportOutputArg.split("=").slice(1).join("="))
  : path.join(gamesDir, dryRun ? "last-image-import-preview.json" : "last-image-import-report.json");

function printHelp() {
  console.log(`
Usage:
  node scripts/import-game-image-urls.js [reviewed-csv-path] [--dry-run] [--validate-remote] [--force]
  node scripts/import-game-image-urls.js [reviewed-csv-path] --dry-run --report-output=.cache/import-preview.json

Input CSV columns:
  platformSlug, gameId, title, imageUrl, imageSourceUrl, imageProvider, notes, reviewStatus, reviewer

Safety behavior:
  - Only rows with imageUrl, platformSlug, and gameId are considered.
  - imageProvider is required for every imported row.
  - reviewStatus must be approved, verified, or reviewed when that column exists.
  - reviewer is required when a reviewed-status column exists.
  - Existing game images are not replaced unless --force is passed.
  - Row titles must match the current game title when a title is supplied.
  - --validate-remote checks that imageUrl returns image content before import.

Recommended flow:
  1. Work from data/games/review-image-batch.csv for focused review, or data/games/missing-image-queue.csv for the full backlog.
  2. Fill imageUrl, imageSourceUrl, imageProvider, and notes only for reviewed matches.
  3. Set reviewStatus to approved, verified, or reviewed, and add your reviewer name/initials.
  4. Leave uncertain rows blank; blank imageUrl rows are ignored.
  5. Run with --dry-run --validate-remote.
  6. If the report is clean, run again without --dry-run.
`.trim());
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
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((value) => String(value).trim()));
}

function readCsvObjects(filePath) {
  const rows = parseCsv(fs.readFileSync(filePath, "utf8"));
  const headers = rows.shift() || [];
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
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

function percent(part, total) {
  return total ? Math.round((part / total) * 1000) / 10 : 0;
}

function imagesNeededForTarget(totalGames, currentImages, targetPct) {
  return Math.max(0, Math.ceil((totalGames * targetPct) / 100) - currentImages);
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch (error) {
    return false;
  }
}

function imageSignature(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "webp";
  return "";
}

function approvedReviewStatus(value) {
  return ["approved", "verified", "reviewed"].includes(
    String(value || "")
      .trim()
      .toLowerCase()
  );
}

function hasReviewStatusColumn(row) {
  return Object.prototype.hasOwnProperty.call(row, "reviewStatus");
}

function suspiciousImageUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "google.com" || host === "bing.com" || host === "duckduckgo.com") return true;
    return /\/search\b/i.test(url.pathname);
  } catch (error) {
    return true;
  }
}

async function imageUrlLooksReachable(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    let contentType = String(response.headers.get("content-type") || "");
    if (response.ok && contentType.startsWith("image/")) return true;
    if (response.status === 405 || response.status === 403 || (response.ok && !contentType)) {
      response = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
      contentType = String(response.headers.get("content-type") || "");
      if (response.ok && contentType.startsWith("image/")) return true;
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return Boolean(imageSignature(new Uint8Array(buffer.slice(0, 16))));
      }
    }
    return false;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizedTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rowLooksLikeSameGame(row, game) {
  const rowTitle = normalizedTitle(row.title);
  const gameTitle = normalizedTitle(game.title || game.name);
  return !rowTitle || !gameTitle || rowTitle === gameTitle;
}

function runNode(script) {
  const result = spawnSync(process.execPath, [script], {
    cwd: rootDir,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

function currentGameImageTotals() {
  return fs
    .readdirSync(gamesDir)
    .filter(isGameDatasetFile)
    .reduce(
      (totals, fileName) => {
        const games = readJson(path.join(gamesDir, fileName));
        if (!Array.isArray(games)) return totals;
        totals.totalGames += games.length;
        totals.images += games.filter((game) => gameImageUrl(game) || hasResolvedImageStatus(game)).length;
        return totals;
      },
      { totalGames: 0, images: 0 }
    );
}

function buildCoverageImpact(importedCount) {
  const current = currentGameImageTotals();
  const projectedImages = Math.min(current.totalGames, current.images + Number(importedCount || 0));
  const milestones = [90, 95, 100].map((targetPct) => {
    const beforeNeeded = imagesNeededForTarget(current.totalGames, current.images, targetPct);
    const afterNeeded = imagesNeededForTarget(current.totalGames, projectedImages, targetPct);
    return {
      targetPct,
      beforeNeeded,
      afterNeeded,
      progressFromImport: Math.max(0, beforeNeeded - afterNeeded),
      targetMetAfterImport: afterNeeded === 0,
    };
  });
  return {
    current: {
      totalGames: current.totalGames,
      images: current.images,
      imagePct: percent(current.images, current.totalGames),
    },
    projected: {
      images: projectedImages,
      imagePct: percent(projectedImages, current.totalGames),
      addedImages: Math.max(0, projectedImages - current.images),
    },
    milestones,
  };
}

async function main() {
  if (help) {
    printHelp();
    return;
  }

  const rows = readCsvObjects(inputPath).filter((row) => row.imageUrl && row.gameId && row.platformSlug);
  const grouped = new Map();
  const rejected = [];
  const importedRows = [];
  const seen = new Set();

  for (const row of rows) {
    const rowKey = `${row.platformSlug}:${row.gameId}`;
    if (seen.has(rowKey)) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "Duplicate row for platform/gameId" });
      continue;
    }
    seen.add(rowKey);
    if (!validUrl(row.imageUrl)) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "Invalid imageUrl" });
      continue;
    }
    if (suspiciousImageUrl(row.imageUrl)) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "imageUrl looks like a search page, not a direct cover image URL" });
      continue;
    }
    if (row.imageSourceUrl && !validUrl(row.imageSourceUrl)) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "Invalid imageSourceUrl" });
      continue;
    }
    if (!String(row.imageProvider || "").trim()) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "Missing imageProvider" });
      continue;
    }
    if (hasReviewStatusColumn(row) && !approvedReviewStatus(row.reviewStatus)) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "reviewStatus must be approved, verified, or reviewed" });
      continue;
    }
    if (hasReviewStatusColumn(row) && !String(row.reviewer || "").trim()) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "Missing reviewer for reviewed image row" });
      continue;
    }
    if (validateRemote && !(await imageUrlLooksReachable(row.imageUrl))) {
      rejected.push({ platform: row.platformSlug, gameId: row.gameId, reason: "Image URL did not return an image content-type" });
      continue;
    }
    if (!grouped.has(row.platformSlug)) grouped.set(row.platformSlug, []);
    grouped.get(row.platformSlug).push(row);
  }

  const summary = [];
  for (const [slug, platformRows] of grouped) {
    const dataPath = path.join(gamesDir, `${slug}.json`);
    if (!fs.existsSync(dataPath)) {
      platformRows.forEach((row) => rejected.push({ gameId: row.gameId, reason: `Missing platform file ${slug}.json` }));
      continue;
    }

    const games = readJson(dataPath);
    if (!Array.isArray(games)) {
      platformRows.forEach((row) => rejected.push({ gameId: row.gameId, reason: `Invalid platform file ${slug}.json` }));
      continue;
    }

    const byId = new Map(games.map((game) => [game.id, game]));
    let updated = 0;
    for (const row of platformRows) {
      const game = byId.get(row.gameId);
      if (!game) {
        rejected.push({ platform: slug, gameId: row.gameId, reason: "Game id not found" });
        continue;
      }
      if (!rowLooksLikeSameGame(row, game)) {
        rejected.push({ platform: slug, gameId: row.gameId, title: row.title || "", reason: `Title mismatch with ${game.title || game.name || ""}` });
        continue;
      }
      if (!force && gameImageUrl(game)) {
        rejected.push({ platform: slug, gameId: row.gameId, reason: "Game already has an image; rerun with --force to replace" });
        continue;
      }
      if (!dryRun) {
        game.imageUrl = row.imageUrl.trim();
        game.imageSourceUrl = (row.imageSourceUrl || row.imageUrl).trim();
        game.imageProvider = row.imageProvider.trim() || "Manual image queue import";
        game.imageMatchedTitle = row.title || game.title || "";
        game.imageImportNotes = row.notes || "";
        game.imageReviewStatus = row.reviewStatus || "";
        game.imageReviewer = row.reviewer || "";
        game.healthUpdatedAt = new Date().toISOString();
      }
      importedRows.push({
        platform: slug,
        gameId: row.gameId,
        title: row.title || game.title || "",
        imageProvider: row.imageProvider || "Manual image queue import",
        imageSourceUrl: row.imageSourceUrl || row.imageUrl,
      });
      updated += 1;
    }

    if (!dryRun && updated) writeJson(dataPath, games);
    summary.push({ platform: slug, updated });
  }

  const importedCount = summary.reduce((sum, item) => sum + item.updated, 0);
  const coverageImpact = buildCoverageImpact(importedCount);

  console.table(summary);
  if (rejected.length) {
    console.log("Rejected rows:");
    console.table(rejected.slice(0, 40));
  }
  console.log(`${dryRun ? "Would import" : "Imported"} ${importedCount} image URLs.`);
  console.log(
    `Image coverage ${dryRun ? "would move" : "moved"} from ${coverageImpact.current.imagePct}% to ${coverageImpact.projected.imagePct}%.`
  );

  const report = {
    generatedAt: new Date().toISOString(),
    mode: dryRun ? "dry-run" : "import",
    inputPath,
    validateRemote,
    force,
    summary,
    rejected,
    importedRows,
    coverageImpact,
  };

  fs.mkdirSync(path.dirname(reportOutputPath), { recursive: true });
  fs.writeFileSync(reportOutputPath, `${JSON.stringify(report, null, 2)}\n`);

  if (!dryRun) {
    runNode(path.join("scripts", "audit-game-library-completeness.js"));
    runNode(path.join("scripts", "build-data-health-cleanup-queue.js"));
    runNode(path.join("scripts", "build-game-image-coverage-plan.js"));
    runNode(path.join("scripts", "export-game-image-queues.js"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
