const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");

const platformPathSegments = {
  "3ds": "nintendo-3ds",
  ds: "nintendo-ds",
  gameboy: "gameboy",
  gba: "gameboy-advance",
  ps1: "playstation",
  ps2: "playstation-2",
  ps3: "playstation-3",
  ps4: "playstation-4",
  ps5: "playstation-5",
  psp: "psp",
  saturn: "sega-saturn",
  vita: "playstation-vita",
  wii: "wii",
  xbox: "xbox",
  xbox360: "xbox-360",
};

const platformTitleSignals = {
  "3ds": ["nintendo 3ds"],
  ds: ["nintendo ds"],
  gameboy: ["gameboy", "game boy", "gameboy color", "game boy color"],
  gba: ["gameboy advance", "game boy advance"],
  ps1: ["playstation"],
  ps2: ["playstation 2"],
  ps3: ["playstation 3"],
  ps4: ["playstation 4"],
  ps5: ["playstation 5"],
  psp: ["psp"],
  saturn: ["sega saturn"],
  switch: ["nintendo switch", "switch"],
  vita: ["playstation vita"],
  wii: ["wii"],
  xbox: ["xbox"],
  xbox360: ["xbox 360"],
};

function parseArgs() {
  const args = new Map();
  process.argv.slice(2).forEach((arg) => {
    const [key, ...valueParts] = arg.replace(/^--/, "").split("=");
    args.set(key, valueParts.join("=") || "true");
  });
  const batch = args.get("batch");
  if (!batch || args.has("help") || args.has("h")) {
    console.log(
      [
        "Usage:",
        "  node scripts/propose-pricecharting-image-candidates.js --batch=data/games/finishable-review-batches/ds-image-review-batch.csv --platform=ds --limit=25 --skip=0",
        "",
        "Writes review-only CSV/JSON files in .cache. It does not change game data.",
      ].join("\n")
    );
    process.exit(batch ? 0 : 1);
  }
  return {
    batchPath: path.resolve(rootDir, batch),
    platform: args.get("platform") || "",
    limit: Number(args.get("limit") || 0),
    skip: Number(args.get("skip") || 0),
    timeoutMs: Number(args.get("timeout-ms") || 6000),
    outputPrefix: args.get("output-prefix") || "",
  };
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
    if (char === '"') quoted = true;
    else if (char === ",") {
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

  if (cell || row.length) row.push(cell.replace(/\r$/, ""));
  return rows.filter((csvRow) => csvRow.some((value) => String(value).trim()));
}

function readCsvObjects(filePath) {
  const rows = parseCsv(fs.readFileSync(filePath, "utf8"));
  const headers = rows.shift() || [];
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows, headers) {
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n") + "\n";
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizedTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(jp|pal|usa|gameboy|game boy|nintendo|playstation|sega|xbox|wii|ds|3ds|psp|vita)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedPlatformText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleMatchStatus(rowTitle, sourceTitle) {
  const row = normalizedTitle(rowTitle);
  const source = normalizedTitle(sourceTitle);
  if (!row || !source) return "unknown";
  if (row === source) return "exact";
  if (source.startsWith(row) || row.startsWith(source)) return "close";
  return "mismatch";
}

function platformMatchStatus(platform, sourceTitle) {
  const normalized = normalizedPlatformText(sourceTitle);
  const signals = platformTitleSignals[platform] || [];
  if (!normalized || !signals.length) return "unknown";
  if (platform === "xbox" && normalized.includes("xbox 360")) return "mismatch";
  return signals.some((signal) => normalized.includes(normalizedPlatformText(signal))) ? "match" : "mismatch";
}

function platformSegmentForRow(row, fallbackPlatform) {
  if (fallbackPlatform === "gameboy") return String(row.gameId || "").startsWith("gbc-") ? "gameboy-color" : "gameboy";
  return platformPathSegments[fallbackPlatform] || fallbackPlatform;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GamesCardsExchange/0.1 (local reviewed cover candidate search)",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function inspectRow(row, platform, timeoutMs) {
  const platformSegment = platformSegmentForRow(row, platform || row.platformSlug);
  const sourceUrl = `https://www.pricecharting.com/game/${platformSegment}/${slugify(row.title)}`;
  try {
    const response = await fetchWithTimeout(sourceUrl, timeoutMs);
    const text = await response.text();
    if (!response.ok) {
      return { status: "MISS", gameId: row.gameId, title: row.title, sourceUrl, sourceTitle: "", imageUrl: "", matchStatus: "", platformMatchStatus: "" };
    }
    const sourceTitle = (text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const imageUrl = Array.from(text.matchAll(/https?:\/\/[^"']+\/1600\.(?:jpg|jpeg|png|webp)/gi)).map((match) => match[0])[0] || "";
    return {
      status: imageUrl ? "FOUND" : "NOIMG",
      gameId: row.gameId,
      title: row.title,
      sourceUrl,
      sourceTitle,
      imageUrl,
      matchStatus: imageUrl ? titleMatchStatus(row.title, sourceTitle) : "",
      platformMatchStatus: imageUrl ? platformMatchStatus(platform || row.platformSlug, sourceTitle) : "",
    };
  } catch (error) {
    return {
      status: "ERROR",
      gameId: row.gameId,
      title: row.title,
      sourceUrl,
      sourceTitle: "",
      imageUrl: "",
      matchStatus: "",
      platformMatchStatus: "",
      error: error.name === "AbortError" ? "timeout" : error.message,
    };
  }
}

async function main() {
  const options = parseArgs();
  const rows = readCsvObjects(options.batchPath).slice(options.skip, options.limit ? options.skip + options.limit : undefined);
  const inspected = [];
  for (let index = 0; index < rows.length; index += 1) {
    inspected.push(await inspectRow(rows[index], options.platform, options.timeoutMs));
    if ((index + 1) % 10 === 0) console.log(`Checked ${index + 1}/${rows.length} rows...`);
  }

  const safeCandidates = inspected.filter(
    (row) => row.status === "FOUND" && ["exact", "close"].includes(row.matchStatus) && row.platformMatchStatus === "match"
  );
  const reviewRows = safeCandidates.map((row) => ({
    platformSlug: options.platform || rows[0]?.platformSlug || "",
    gameId: row.gameId,
    title: row.title,
    imageUrl: row.imageUrl,
    imageSourceUrl: row.sourceUrl,
    imageProvider: "PriceCharting",
    notes: `Candidate ${row.matchStatus} title match from PriceCharting page: ${row.sourceTitle}. Human review required before approval.`,
    reviewStatus: "needs-review",
    reviewer: "",
  }));

  const outputBase =
    options.outputPrefix ||
    `${options.platform || rows[0]?.platformSlug || "games"}-pricecharting-candidates-${String(options.skip).padStart(4, "0")}-${rows.length}`;
  const cacheDir = path.join(rootDir, ".cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  const jsonPath = path.join(cacheDir, `${outputBase}.json`);
  const csvPath = path.join(cacheDir, `${outputBase}.csv`);
  const reviewedCsvPath = path.join(cacheDir, `${outputBase}-review-import.csv`);

  fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), options, inspected, safeCandidates }, null, 2) + "\n");
  fs.writeFileSync(
    csvPath,
    toCsv(inspected, ["status", "gameId", "title", "sourceTitle", "matchStatus", "platformMatchStatus", "sourceUrl", "imageUrl", "error"])
  );
  fs.writeFileSync(
    reviewedCsvPath,
    toCsv(reviewRows, ["platformSlug", "gameId", "title", "imageUrl", "imageSourceUrl", "imageProvider", "notes", "reviewStatus", "reviewer"])
  );

  console.log(
    JSON.stringify(
      {
        checked: inspected.length,
        found: inspected.filter((row) => row.status === "FOUND").length,
        safeCandidates: safeCandidates.length,
        jsonPath: path.relative(rootDir, jsonPath),
        csvPath: path.relative(rootDir, csvPath),
        reviewedCsvPath: path.relative(rootDir, reviewedCsvPath),
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  normalizedTitle,
  platformMatchStatus,
  titleMatchStatus,
};
