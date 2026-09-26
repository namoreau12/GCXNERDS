const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");

const platforms = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");
const targetPlatforms = platforms.length ? platforms : ["ps1", "ps2", "ps3", "psp", "vita"];

const platformRules = {
  ps1: {
    cache: "ps1-playstation-chihiro-images",
    regions: ["US", "GB", "HK"],
    idPattern: /(SCUS|SLUS|SLES|SCES|NPUI|NPUJ|NPEF|NPEE|NPJI|PSONE|PS1)/i,
  },
  ps2: {
    cache: "ps2-playstation-chihiro-images",
    regions: ["US", "GB", "HK"],
    idPattern: /(SCUS|SLUS|SLES|SCES|NPUD|NPED|NPJD|PS2|PS2U|PS2E|PS2J)/i,
  },
  ps3: {
    cache: "ps3-playstation-chihiro-images",
    regions: ["US", "GB", "HK"],
    idPattern: /(NPUB|NPEB|NPUA|NPEA|NPJA|NPJB|BLUS|BLES|BCUS|BCES)/i,
  },
  psp: {
    cache: "psp-playstation-chihiro-images",
    regions: ["US", "GB", "HK"],
    idPattern: /(ULUS|ULES|UCUS|UCES|NPUH|NPEG|NPJH|UCJS|ULJM|ULEM)/i,
  },
  vita: {
    cache: "vita-playstation-chihiro-images",
    regions: ["US", "GB", "HK"],
    idPattern: /(PCSA|PCSE|PCSB|PCSG|VLJM|VCJS|VLUS|VLES)/i,
  },
};

function readJson(filePath, fallback = null) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function hasImage(game) {
  return Boolean(game.imageUrl || game.coverUrl || game.boxArtUrl || game.coverImage || game.thumbnailUrl);
}

function roman(value) {
  return String(value || "")
    .replace(/\bVIII\b/gi, "8")
    .replace(/\bVII\b/gi, "7")
    .replace(/\bVI\b/gi, "6")
    .replace(/\bIV\b/gi, "4")
    .replace(/\bIII\b/gi, "3")
    .replace(/\bII\b/gi, "2")
    .replace(/\bIX\b/gi, "9")
    .replace(/\bX\b/gi, "10")
    .replace(/\bV\b/gi, "5");
}

function normalize(value) {
  return roman(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[™®©]/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(the|psn|ps one|psone|ps2|ps3|psp|vita|playstation portable|playstation vita|full game)\b/gi, " ")
    .replace(/\b(standard|digital|edition)\b/gi, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function badProduct(product) {
  const haystack = [product.name, product.title_name, product.game_contentType, product.top_category]
    .filter(Boolean)
    .join(" ");
  return /\b(add.?on|avatar|theme|trailer|video|demo|trial|season pass|currency|coins|costume|skin|soundtrack|wallpaper|unlock|level|map|character|voice|accessor(?:y|ies)|pack|bundle|expansion)\b/i.test(haystack);
}

function chooseImage(product) {
  const images = (product.images || []).filter((item) => item.url && /^https?:\/\//i.test(item.url));
  for (const type of [1, 10, 2, 9, 13, 12]) {
    const item = images.find((candidate) => Number(candidate.type) === type);
    if (item) return item.url;
  }
  return images[0]?.url || "";
}

function localeForRegion(region) {
  if (region === "GB") return "en-gb";
  if (region === "HK") return "en-hk";
  return "en-us";
}

function sourceUrl(product, region) {
  return `https://store.playstation.com/${localeForRegion(region)}/product/${encodeURIComponent(product.id)}`;
}

function candidateForGame(game, cache, rules) {
  const titleKeys = new Set([game.title, roman(game.title), ...(game.aliases || [])].map(normalize).filter(Boolean));
  const queries = [game.title, roman(game.title), ...(game.aliases || [])].filter(Boolean);
  const candidates = [];

  for (const query of queries) {
    for (const region of rules.regions) {
      const key = `${region}:en:${query}`;
      for (const product of cache[key]?.hits || []) {
        const productTitle = product.title_name || product.name || product.short_name || "";
        const productKey = normalize(productTitle);
        const imageUrl = chooseImage(product);
        if (!productKey || !titleKeys.has(productKey) || !imageUrl) continue;
        if (!rules.idPattern.test(product.id || "")) continue;
        if (badProduct(product)) continue;
        candidates.push({
          region,
          product,
          imageUrl,
          sourceUrl: sourceUrl(product, region),
          displayTitle: productTitle,
        });
      }
    }
  }

  candidates.sort((a, b) => {
    const aFull = /full.?game|downloadable.?game|psn.?game/i.test([a.product.game_contentType, a.product.top_category].join(" "));
    const bFull = /full.?game|downloadable.?game|psn.?game/i.test([b.product.game_contentType, b.product.top_category].join(" "));
    if (aFull !== bFull) return aFull ? -1 : 1;
    return a.displayTitle.localeCompare(b.displayTitle);
  });

  return candidates[0] || null;
}

function runNode(script) {
  const result = spawnSync(process.execPath, [script], {
    cwd: rootDir,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

function main() {
  const summary = [];
  const importedRows = [];

  for (const platform of targetPlatforms) {
    const rules = platformRules[platform];
    if (!rules) throw new Error(`Unsupported platform: ${platform}`);

    const dataPath = path.join(gamesDir, `${platform}.json`);
    const cachePath = path.join(rootDir, ".cache", rules.cache, "search-cache.json");
    const games = readJson(dataPath, []);
    const cache = readJson(cachePath, {});
    let updated = 0;

    for (const game of games) {
      if (hasImage(game)) continue;
      const candidate = candidateForGame(game, cache, rules);
      if (!candidate) continue;
      updated += 1;
      importedRows.push({
        platform,
        gameId: game.id,
        title: game.title,
        matchedTitle: candidate.displayTitle,
        imageUrl: candidate.imageUrl,
        sourceUrl: candidate.sourceUrl,
      });
      if (!dryRun) {
        game.imageUrl = candidate.imageUrl;
        game.imageSourceUrl = candidate.sourceUrl;
        game.imageProvider = "PlayStation Store cache exact match";
        game.imageMatchedTitle = candidate.displayTitle;
        game.imageImportNotes = "Strict exact-title Chihiro cache import with platform product-id and non-game-content filters.";
        game.healthUpdatedAt = new Date().toISOString();
      }
    }

    if (!dryRun && updated) writeJson(dataPath, games);
    summary.push({ platform, updated });
  }

  console.table(summary);
  console.log(`${dryRun ? "Would import" : "Imported"} ${summary.reduce((sum, item) => sum + item.updated, 0)} strict PlayStation image URLs.`);
  console.table(importedRows.slice(0, 80));

  if (!dryRun) {
    fs.writeFileSync(
      path.join(gamesDir, "last-strict-playstation-image-import-report.json"),
      `${JSON.stringify({ importedAt: new Date().toISOString(), summary, importedRows }, null, 2)}\n`
    );
    runNode(path.join("scripts", "audit-game-library-completeness.js"));
    runNode(path.join("scripts", "build-data-health-cleanup-queue.js"));
    runNode(path.join("scripts", "export-game-image-queues.js"));
  }
}

main();
