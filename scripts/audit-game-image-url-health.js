const fs = require("node:fs");
const path = require("node:path");
const { isGameDatasetFile, writeJsonAtomic } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const outputPath = path.join(gamesDir, "image-url-health-report.json");

const args = process.argv.slice(2);
const limit = Number((args.find((arg) => arg.startsWith("--limit=")) || "").split("=")[1] || 0);
const perHostLimit = Number((args.find((arg) => arg.startsWith("--per-host=")) || "").split("=")[1] || 25);
const concurrency = Math.max(1, Number((args.find((arg) => arg.startsWith("--concurrency=")) || "").split("=")[1] || 6));
const timeoutMs = Math.max(1000, Number((args.find((arg) => arg.startsWith("--timeout-ms=")) || "").split("=")[1] || 9000));
const includeAll = args.includes("--all");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  writeJsonAtomic(fs, filePath, value);
}

function isGameDataset(fileName) {
  return isGameDatasetFile(fileName);
}

function firstFilled(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim()) || "";
}

function imageUrl(game) {
  return firstFilled(game.imageUrl, game.boxArtUrl, game.coverUrl, game.coverImage, game.thumbnailUrl);
}

function hostFromUrl(value) {
  try {
    return new URL(value).host;
  } catch {
    return "(invalid)";
  }
}

function collectRecords() {
  const records = [];
  for (const fileName of fs.readdirSync(gamesDir).filter(isGameDataset).sort()) {
    const slug = fileName.replace(/\.json$/, "");
    const games = readJson(path.join(gamesDir, fileName));
    if (!Array.isArray(games)) continue;
    for (const game of games) {
      const url = imageUrl(game);
      if (!url) continue;
      records.push({
        platform: slug,
        id: game.id || "",
        title: game.title || game.name || "",
        provider: game.imageProvider || "(legacy/unknown)",
        url,
        host: hostFromUrl(url),
        sourceUrl: game.imageSourceUrl || "",
      });
    }
  }
  return records;
}

function pickSample(records) {
  if (includeAll) return limit ? records.slice(0, limit) : records;
  const byHost = new Map();
  const sample = [];
  for (const record of records) {
    const count = byHost.get(record.host) || 0;
    if (count >= perHostLimit) continue;
    byHost.set(record.host, count + 1);
    sample.push(record);
    if (limit && sample.length >= limit) break;
  }
  return sample;
}

async function checkUrl(record) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(record.url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    let method = "HEAD";
    let contentType = response.headers.get("content-type") || "";
    if (response.status === 403 || response.status === 405 || response.status >= 500 || (!contentType && response.ok) || /^application\/octet-stream/i.test(contentType)) {
      response = await fetch(record.url, { method: "GET", redirect: "follow", signal: controller.signal });
      method = "GET";
      contentType = response.headers.get("content-type") || "";
    }
    const deferred = response.status === 429;
    const signature = response.ok && /^application\/octet-stream/i.test(contentType)
      ? await response.arrayBuffer().then((buffer) => imageSignature(new Uint8Array(buffer.slice(0, 16)))).catch(() => "")
      : "";
    const ok = response.ok && (/^image\//i.test(contentType) || Boolean(signature));
    return {
      ...record,
      ok,
      deferred,
      status: response.status,
      method,
      contentType,
      signature,
      finalUrl: response.url || record.url,
      issue: ok ? "" : deferred ? "Rate limited; retry later" : response.ok ? "Non-image content type" : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ...record,
      ok: false,
      deferred: true,
      status: 0,
      method: "HEAD",
      contentType: "",
      finalUrl: record.url,
      issue: error.name === "AbortError" ? "Timed out; retry later" : `${error.message}; retry later`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function imageSignature(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "webp";
  return "";
}

async function asyncPool(items, worker) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function summarize(results) {
  const byHost = {};
  const byProvider = {};
  for (const result of results) {
    for (const [bucket, key] of [
      [byHost, result.host],
      [byProvider, result.provider],
    ]) {
      if (!bucket[key]) bucket[key] = { checked: 0, ok: 0, failed: 0 };
      bucket[key].checked += 1;
      if (result.ok) bucket[key].ok += 1;
      else if (result.deferred) bucket[key].deferred = (bucket[key].deferred || 0) + 1;
      else bucket[key].failed += 1;
    }
  }
  return { byHost, byProvider };
}

async function main() {
  const records = collectRecords();
  const sample = pickSample(records);
  console.log(`Checking ${sample.length.toLocaleString()} of ${records.length.toLocaleString()} image URLs...`);
  const results = await asyncPool(sample, checkUrl);
  const deferred = results.filter((result) => !result.ok && result.deferred);
  const failed = results.filter((result) => !result.ok && !result.deferred);
  const report = {
    generatedAt: new Date().toISOString(),
    totalImageUrls: records.length,
    checked: results.length,
    ok: results.filter((result) => result.ok).length,
    deferred: deferred.length,
    failed: failed.length,
    options: { limit, perHostLimit, concurrency, timeoutMs, includeAll },
    ...summarize(results),
    failures: failed.slice(0, 250),
    deferredSamples: deferred.slice(0, 100),
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify({
    totalImageUrls: report.totalImageUrls,
    checked: report.checked,
    ok: report.ok,
    deferred: report.deferred,
    failed: report.failed,
    report: path.relative(rootDir, outputPath),
  }, null, 2));
  if (failed.length) console.table(failed.slice(0, 20).map(({ platform, title, provider, host, status, issue }) => ({ platform, title, provider, host, status, issue })));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
