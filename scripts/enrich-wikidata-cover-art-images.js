const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");
const cacheDir = path.join(rootDir, ".cache", "wikidata-cover-art-images");
const cachePath = path.join(cacheDir, "search-cache.json");

const platformQids = {
  "3ds": ["Q203597"],
  dreamcast: ["Q184198"],
  ds: ["Q170323"],
  gameboy: ["Q186437", "Q10676"],
  gamecube: ["Q182172"],
  gba: ["Q188642"],
  genesis: ["Q10676", "Q201652"],
  n64: ["Q184839"],
  nes: ["Q172742"],
  ps1: ["Q10677"],
  ps2: ["Q10680"],
  ps3: ["Q10683"],
  ps4: ["Q5014725"],
  ps5: ["Q63184502"],
  psp: ["Q170325"],
  saturn: ["Q200912"],
  snes: ["Q183259"],
  switch: ["Q19610114"],
  switch2: ["Q120525523"],
  vita: ["Q188808"],
  wii: ["Q8079"],
  xbox: ["Q132020"],
  xbox360: ["Q48263"],
};

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const dryRun = flags.has("--dry-run");
const requestedPlatforms = args.filter((arg) => !arg.startsWith("--"));
const limit = Number((args.find((arg) => arg.startsWith("--limit=")) || "").split("=")[1] || 0);
const delayMs = Number((args.find((arg) => arg.startsWith("--delay-ms=")) || "").split("=")[1] || 750);
const timeoutMs = Number((args.find((arg) => arg.startsWith("--timeout-ms=")) || "").split("=")[1] || 12000);
const progressEvery = Number((args.find((arg) => arg.startsWith("--progress-every=")) || "").split("=")[1] || 10);

function ensureDirs() {
  fs.mkdirSync(cacheDir, { recursive: true });
}

function readJson(filePath, fallback = null) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.renameSync(tempPath, filePath);
      return;
    } catch {
      if (attempt === 4) {
        fs.copyFileSync(tempPath, filePath);
        fs.unlinkSync(tempPath);
        return;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250 * (attempt + 1));
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[™®©]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasImage(game) {
  return Boolean(game.imageUrl || game.boxArtUrl || game.coverUrl || game.coverImage || game.thumbnailUrl);
}

function claimIds(entity, property) {
  return (entity.claims?.[property] || [])
    .map((claim) => claim.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);
}

function p18FileNames(entity) {
  return (entity.claims?.P18 || [])
    .map((claim) => claim.mainsnak?.datavalue?.value)
    .filter(Boolean);
}

function titleMatches(game, entity) {
  const wanted = new Set([game.title, ...(game.aliases || [])].map(normalize).filter(Boolean));
  const labels = [
    entity.labels?.en?.value,
    ...(entity.aliases?.en || []).map((alias) => alias.value),
  ].map(normalize).filter(Boolean);
  return labels.some((label) => wanted.has(label));
}

function platformMatches(entity, platform) {
  const wanted = new Set(platformQids[platform] || []);
  return claimIds(entity, "P400").some((qid) => wanted.has(qid));
}

function looksLikeCoverFile(fileName) {
  const text = decodeURIComponent(String(fileName || ""))
    .replace(/[_\-]+/g, " ")
    .toLowerCase();
  if (!/\b(cover|box art|boxart|box|front|packshot|case)\b/.test(text)) return false;
  if (/\b(logo|icon|screenshot|gameplay|poster|advert|flyer|photo|cosplay|sprite|character|manual|map)\b/.test(text)) return false;
  if (/\.svg$/i.test(fileName)) return false;
  return /\.(png|jpg|jpeg|webp)$/i.test(fileName);
}

function commonsImageUrl(fileName) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName).replace(/%20/g, "_")}`;
}

async function fetchJson(url) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "GamesCardsExchange/0.1 local Wikidata cover art enrichment",
        },
        signal: controller.signal,
      });
      const text = await response.text();
      if (response.ok) return JSON.parse(text);
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`${url} returned ${response.status}: ${text.slice(0, 160)}`);
      }
      const retryAfter = Number(response.headers.get("retry-after") || 0);
      await sleep((retryAfter ? retryAfter * 1000 : 2500 * (attempt + 1)) + 500);
    } catch (error) {
      if (attempt === 5) throw error;
      await sleep(2500 * (attempt + 1));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`${url} failed repeatedly.`);
}

async function searchEntities(title, cache) {
  const key = `search:${title}`;
  if (!cache[key]) {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("format", "json");
    url.searchParams.set("language", "en");
    url.searchParams.set("uselang", "en");
    url.searchParams.set("limit", "8");
    url.searchParams.set("search", title);
    cache[key] = { savedAt: new Date().toISOString(), result: await fetchJson(url) };
    await sleep(delayMs);
  }
  return (cache[key].result.search || []).map((item) => item.id).filter(Boolean);
}

async function fetchEntities(ids, cache) {
  const missing = ids.filter((id) => !cache[`entity:${id}`]);
  for (let index = 0; index < missing.length; index += 50) {
    const group = missing.slice(index, index + 50);
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbgetentities");
    url.searchParams.set("format", "json");
    url.searchParams.set("languages", "en");
    url.searchParams.set("props", "labels|aliases|claims");
    url.searchParams.set("ids", group.join("|"));
    const result = await fetchJson(url);
    for (const [id, entity] of Object.entries(result.entities || {})) {
      cache[`entity:${id}`] = { savedAt: new Date().toISOString(), entity };
    }
    await sleep(delayMs);
  }
  return ids.map((id) => cache[`entity:${id}`]?.entity).filter(Boolean);
}

async function matchGame(game, platform, cache) {
  const ids = new Set();
  for (const title of [game.title, ...(game.aliases || [])].filter(Boolean)) {
    for (const id of await searchEntities(title, cache)) ids.add(id);
  }
  const entities = await fetchEntities(Array.from(ids), cache);
  for (const entity of entities) {
    if (!titleMatches(game, entity)) continue;
    if (!platformMatches(entity, platform)) continue;
    const fileName = p18FileNames(entity).find(looksLikeCoverFile);
    if (!fileName) continue;
    return {
      qid: entity.id,
      matchedTitle: entity.labels?.en?.value || game.title,
      fileName,
      imageUrl: commonsImageUrl(fileName),
      sourceUrl: `https://www.wikidata.org/wiki/${entity.id}`,
    };
  }
  return null;
}

function runNode(script) {
  const result = spawnSync(process.execPath, [script], { cwd: rootDir, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

async function enrichPlatform(platform, cache) {
  const dataPath = path.join(gamesDir, `${platform}.json`);
  const manifestPath = path.join(gamesDir, `${platform}-manifest.json`);
  const games = readJson(dataPath, []);
  const manifest = readJson(manifestPath, {});
  const targets = games.filter((game) => !hasImage(game)).slice(0, limit || undefined);
  let matched = 0;
  const samples = [];

  for (let index = 0; index < targets.length; index += 1) {
    const game = targets[index];
    const match = await matchGame(game, platform, cache);
    if ((index + 1) % progressEvery === 0 || index + 1 === targets.length) {
      console.log(`${platform}: checked ${index + 1}/${targets.length}, matched ${matched}`);
    }
    if (!match) continue;
    matched += 1;
    if (samples.length < 60) samples.push({ title: game.title, ...match });
    if (!dryRun) {
      game.imageUrl = match.imageUrl;
      game.imageSourceUrl = match.sourceUrl;
      game.imageProvider = "Wikidata Commons cover art exact";
      game.imageMatchedTitle = match.matchedTitle;
      game.imageRole = "cover art";
      game.wikidataId = match.qid;
      game.healthUpdatedAt = new Date().toISOString();
    }
  }

  if (!dryRun && matched) {
    writeJson(dataPath, games);
    writeJson(manifestPath, {
      ...manifest,
      wikidataCommonsCoverArtEnrichedAt: new Date().toISOString(),
      wikidataCommonsCoverArtLatestMatchCount: matched,
      imageCount: games.filter(hasImage).length,
      missingImageCount: games.length - games.filter(hasImage).length,
    });
  }
  return { platform, targets: targets.length, matched, samples };
}

async function main() {
  ensureDirs();
  const cache = readJson(cachePath, {});
  const platforms = requestedPlatforms.length ? requestedPlatforms : Object.keys(platformQids);
  const results = [];
  for (const platform of platforms) {
    results.push(await enrichPlatform(platform, cache));
    writeJson(cachePath, cache);
  }
  console.table(results.map(({ platform, targets, matched }) => ({ platform, targets, matched })));
  for (const result of results) {
    if (!result.samples.length) continue;
    console.log(`\n${result.platform} samples:`);
    result.samples.slice(0, 20).forEach((sample) => {
      console.log(`- ${sample.title} => ${sample.matchedTitle} | ${sample.fileName}`);
    });
  }
  if (!dryRun) {
    runNode(path.join("scripts", "audit-game-library-completeness.js"));
    runNode(path.join("scripts", "build-data-health-cleanup-queue.js"));
    runNode(path.join("scripts", "export-game-image-queues.js"));
  } else {
    console.log("Dry run only; no files were changed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
