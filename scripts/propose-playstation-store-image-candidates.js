const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "data", "games");

const args = process.argv.slice(2);
const platform = args.find((arg) => !arg.startsWith("--")) || "ps5";
const minScore = Number((args.find((arg) => arg.startsWith("--min-score=")) || "").split("=")[1] || 72);
const limit = Number((args.find((arg) => arg.startsWith("--limit=")) || "").split("=")[1] || 0);

function readJson(filePath, fallback = null) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
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
    .replace(/[â„¢Â®Â©]/g, "")
    .replace(/[Ã¢â€žÂ¢Ã‚Â®Ã‚Â©]/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(ps5|playstation 5|ps4|playstation 4|digital|download|full game)\b/gi, "")
    .replace(/\b(edition|bundle|standard|game of the year|goty)\b/gi, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokens(value) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 1 || /^\d+$/.test(token))
    .filter((token) => !["the", "and", "of"].includes(token));
}

function isFullGame(product) {
  const platforms = product.platforms || [];
  const classification = String(product.storeDisplayClassification || product.localizedStoreDisplayClassification || "");
  if (platform === "ps5" && !platforms.includes("PS5")) return false;
  if (platform === "ps4" && !platforms.includes("PS4")) return false;
  if (["ps1", "ps2", "ps3", "psp", "vita"].includes(platform)) {
    const haystack = [
      product.name,
      product.title_name,
      product.game_contentType,
      product.top_category,
      product.metadata && JSON.stringify(product.metadata),
    ]
      .filter(Boolean)
      .join(" ");
    if (!/game|bundle|full.?game|downloadable.?game|psn.?game|psone|ps2|ps3|psp|vita|classic|archives/i.test(haystack)) return false;
  } else if (!/full.?game|premium.?edition|game.?bundle/i.test(classification)) return false;
  if (/\b(add.?on|upgrade|dlc|season pass|currency|coins|avatar|theme|soundtrack|costume|pack)\b/i.test(product.name || "")) return false;
  return true;
}

function chooseImage(product) {
  if (product.images) {
    const images = (product.images || []).filter((item) => item.url);
    for (const type of [1, 10, 2, 9, 13, 12]) {
      const item = images.find((candidate) => Number(candidate.type) === type);
      if (item) return item.url;
    }
    return images[0]?.url || "";
  }
  const media = (product.media || []).filter((item) => item.type === "IMAGE" && item.url);
  const roles = ["GAMEHUB_COVER_ART", "EDITION_KEY_ART", "MASTER", "PORTRAIT_BANNER", "FOUR_BY_THREE_BANNER", "BACKGROUND"];
  for (const role of roles) {
    const item = media.find((candidate) => candidate.role === role);
    if (item) return item.url;
  }
  return media.find((item) => !/SCREENSHOT|LOGO/i.test(item.role || ""))?.url || "";
}

function score(game, product) {
  if (!isFullGame(product)) return -1;
  const titleKeys = [game.title, ...(game.aliases || [])].map(normalize).filter(Boolean);
  const productTitle = product.title_name || product.name || product.short_name || "";
  const productKey = normalize(productTitle);
  if (!productKey || !chooseImage(product)) return -1;
  if (titleKeys.includes(productKey)) return 200;
  let best = 0;
  const productTokens = new Set(tokens(productTitle));
  for (const title of [game.title, ...(game.aliases || [])]) {
    const titleTokens = tokens(title);
    if (!titleTokens.length) continue;
    const overlap = titleTokens.filter((token) => productTokens.has(token)).length;
    const coverage = overlap / titleTokens.length;
    const extra = Math.max(0, productTokens.size - overlap);
    const titleNumbers = titleTokens.filter((token) => /^\d+$/.test(token));
    const productNumbers = new Set(Array.from(productTokens).filter((token) => /^\d+$/.test(token)));
    if (titleNumbers.some((number) => !productNumbers.has(number))) continue;
    let current = Math.round(coverage * 100) - extra * 8;
    if (productKey.startsWith(normalize(title))) current += 35;
    if (normalize(title).startsWith(productKey)) current += 28;
    best = Math.max(best, current);
  }
  return best;
}

function productUrl(product, key) {
  if (["ps1", "ps2", "ps3", "psp", "vita"].includes(platform)) {
    const region = key.split(":")[0];
    const locale = region === "GB" ? "en-gb" : region === "HK" ? "en-hk" : "en-us";
    return `https://store.playstation.com/${locale}/product/${encodeURIComponent(product.id)}`;
  }
  const locale = key.startsWith("GB:") ? "en-gb" : "en-us";
  return `https://store.playstation.com/${locale}/product/${encodeURIComponent(product.id)}`;
}

function cacheKeysForQuery(query) {
  if (["ps1", "ps2", "ps3", "psp", "vita"].includes(platform)) {
    return [`US:en:${query}`, `GB:en:${query}`, `HK:en:${query}`];
  }
  const keys = [`US:${query}`, `GB:${query}`];
  if (platform === "ps4") keys.unshift(query);
  return keys;
}

function main() {
  const games = readJson(path.join(gamesDir, `${platform}.json`), []);
  const cacheFolder = ["ps1", "ps2", "ps3", "psp", "vita"].includes(platform)
    ? `${platform}-playstation-chihiro-images`
    : `${platform}-playstation-store-images`;
  const cache = readJson(path.join(rootDir, ".cache", cacheFolder, "search-cache.json"), {});
  const missing = games.filter((game) => !hasImage(game)).slice(0, limit || undefined);
  for (const game of missing) {
    const variants = [game.title, roman(game.title), ...(game.aliases || [])].filter(Boolean);
    const candidates = [];
    for (const query of variants) {
      for (const key of cacheKeysForQuery(query)) {
        for (const product of cache[key]?.hits || []) {
          const candidateScore = score(game, product);
          if (candidateScore >= minScore) {
            candidates.push({
              score: candidateScore,
              key,
              name: product.name,
              id: product.id,
              imageUrl: chooseImage(product),
              sourceUrl: productUrl(product, key),
            });
          }
        }
      }
    }
    const unique = Array.from(new Map(candidates.map((item) => [item.id, item])).values())
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 5);
    if (!unique.length) continue;
    console.log(`\n${game.id}\t${game.title}`);
    unique.forEach((item) => console.log(`  ${item.score}\t${item.name}\t${item.imageUrl}\t${item.sourceUrl}`));
  }
}

main();
