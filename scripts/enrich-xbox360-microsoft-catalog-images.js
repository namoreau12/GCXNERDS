const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "data", "games", "xbox360.json");
const manifestPath = path.join(rootDir, "data", "games", "xbox360-manifest.json");
const cacheDir = path.join(rootDir, ".cache", "xbox360-microsoft-catalog-images");
const catalogCachePath = path.join(cacheDir, "xbox360-catalog.json");
const catalogUrl = "http://catalog-cdn.xboxlive.com/Catalog/Catalog.asmx/Query";

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
}

function ensureDirs() {
  fs.mkdirSync(cacheDir, { recursive: true });
}

function decodeXml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function tagValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] || "");
}

function liveTagValue(xml, tag) {
  return tagValue(xml, `live:${tag}`);
}

function normalizeTitle(value) {
  return String(value || "")
    .replace(/[™®©]/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(xbox 360|xbox live arcade|xbla|games on demand|arcade)\b/gi, "")
    .replace(/\b(edition|digital|download|bundle|collection)\b/gi, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizePublisher(value) {
  return normalizeTitle(value)
    .replace(/\b(inc|llc|ltd|limited|corporation|corp|co|plc|gmbh|sa|ag)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function marketplaceCatalogUrl(pageNum, pageSize = 100) {
  const params = new URLSearchParams();
  params.set("methodName", "FindGames");
  const pairs = [
    ["Locale", "en-US"],
    ["LegalLocale", "en-US"],
    ["Store", "1"],
    ["PageSize", String(pageSize)],
    ["PageNum", String(pageNum)],
    ["DetailView", "3"],
    ["AvatarBodyTypes", "3"],
    ["AvatarBodyTypes", "1"],
    ["OrderDirection", "2"],
    ["MediaTypes", "1"],
    ["MediaTypes", "21"],
    ["MediaTypes", "23"],
    ["OrderBy", "21"],
    ["ImageFormats", "4"],
    ["OfferFilterLevel", "2"],
    ["ImageSizes", "23"],
    ["UserTypes", "2"],
    ["UserTypes", "3"],
  ];
  for (const [name, value] of pairs) {
    params.append("Names", name);
    params.append("Values", value);
  }
  return `${catalogUrl}?${params}`;
}

function parseCatalogPage(xml) {
  const totalItems = Number(liveTagValue(xml, "totalItems") || 0);
  const entries = Array.from(xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)).map((match) => match[0]);
  const items = entries.map((entry) => {
    const id = tagValue(entry, "id");
    const title = tagValue(entry, "title");
    const imageUrls = Array.from(entry.matchAll(/<live:fileUrl>([\s\S]*?)<\/live:fileUrl>/gi)).map((match) =>
      decodeXml(match[1]).replace(/^http:\/\//i, "https://")
    );
    return {
      id,
      title,
      reducedTitle: liveTagValue(entry, "reducedTitle"),
      gameReducedTitle: liveTagValue(entry, "gameReducedTitle"),
      mediaType: liveTagValue(entry, "mediaType"),
      releaseDate: liveTagValue(entry, "releaseDate"),
      developer: liveTagValue(entry, "developer"),
      publisher: liveTagValue(entry, "publisher"),
      titleId: liveTagValue(entry, "titleId"),
      effectiveTitleId: liveTagValue(entry, "effectiveTitleId"),
      imageUrl: imageUrls.find((url) => /boxart/i.test(url)) || imageUrls[0] || "",
      sourceUrl: `https://marketplace.xbox.com/en-US/Product/${encodeURIComponent(title).replace(/%20/g, "-")}/${id.replace(/^urn:uuid:/i, "")}`,
    };
  });
  return { totalItems, items };
}

async function fetchCatalog(force = false) {
  if (!force) {
    const cached = readJsonIfExists(catalogCachePath, null);
    if (cached?.items?.length) return cached;
  }

  const pageSize = 100;
  const items = [];
  let totalItems = 0;
  let pageNum = 1;

  do {
    const response = await fetch(marketplaceCatalogUrl(pageNum, pageSize), {
      headers: {
        Accept: "application/atom+xml, application/xml, text/xml",
        "User-Agent": "GamesCardsExchange/0.1 (local Xbox 360 Microsoft catalog image enrichment)",
      },
    });
    const xml = await response.text();
    if (!response.ok) throw new Error(`Xbox 360 catalog returned ${response.status}: ${xml.slice(0, 160)}`);
    const page = parseCatalogPage(xml);
    totalItems = page.totalItems || totalItems;
    items.push(...page.items);
    console.log(`Fetched Xbox 360 catalog page ${pageNum}; ${items.length}/${totalItems || "?"} items...`);
    pageNum += 1;
  } while (items.length < totalItems);

  const catalog = {
    fetchedAt: new Date().toISOString(),
    source: "Microsoft Xbox Live Marketplace catalog CDN",
    sourceUrl: marketplaceCatalogUrl(1, pageSize),
    totalItems,
    items,
  };
  writeJson(catalogCachePath, catalog);
  return catalog;
}

function scoreCatalogItem(game, item) {
  if (!item?.title || !item.imageUrl) return -1;
  const gameTitle = normalizeTitle(game.title);
  const itemTitles = [item.title, item.reducedTitle, item.gameReducedTitle].map(normalizeTitle).filter(Boolean);
  const aliases = (game.aliases || []).map(normalizeTitle).filter(Boolean);
  const candidates = [gameTitle, ...aliases];
  let score = 0;

  const exact = itemTitles.some((title) => candidates.includes(title));
  const safeEdition = itemTitles.some((itemTitle) =>
    candidates.some((title) => {
      if (!itemTitle.startsWith(title) || title.length < 5) return false;
      const suffix = itemTitle.slice(title.length).trim();
      return /^(deluxe|ultimate|complete|anniversary|special|remastered|classic)\b/i.test(suffix);
    })
  );

  if (!exact && !safeEdition) return -1;
  if (exact) score += 1000;
  if (safeEdition) score += 760;

  const gamePublisher = normalizePublisher(game.publisher);
  const itemPublisher = normalizePublisher(item.publisher);
  if (gamePublisher && itemPublisher && (gamePublisher.includes(itemPublisher) || itemPublisher.includes(gamePublisher))) {
    score += 80;
  }

  const gameYears = new Set(game.releaseYears || []);
  const itemYear = String(item.releaseDate || "").match(/\b(19\d\d|20\d\d)\b/)?.[1] || "";
  if (itemYear && gameYears.has(itemYear)) score += 70;
  if (String(item.mediaType) === "23" && (game.featureFlags || []).includes("XBLA")) score += 50;
  if (String(item.mediaType) === "1" && !(game.featureFlags || []).includes("XBLA")) score += 30;

  return score;
}

function clearImage(game) {
  game.imageUrl = "";
  game.imageSourceUrl = "";
  delete game.imageProvider;
  delete game.imageMatchedTitle;
  delete game.imageMatchScore;
  delete game.imageRole;
  delete game.microsoftCatalogId;
  delete game.microsoftCatalogTitleId;
}

function parseArgs() {
  const args = new Map();
  process.argv.slice(2).forEach((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    args.set(key, value || "true");
  });
  return {
    limit: Number(args.get("limit") || 0),
    force: args.has("force"),
    refreshCatalog: args.has("refresh-catalog"),
    dryRun: args.has("dry-run"),
  };
}

async function main() {
  ensureDirs();
  const { limit, force, refreshCatalog, dryRun } = parseArgs();
  const games = readJsonIfExists(dataPath, null);
  const manifest = readJsonIfExists(manifestPath, {});
  if (!Array.isArray(games)) throw new Error("Xbox 360 game data was not found. Run the Xbox 360 importer first.");

  const catalog = await fetchCatalog(refreshCatalog);
  const candidates = games.filter((game) => force || !game.imageUrl).slice(0, limit || undefined);
  let matched = 0;
  let skipped = 0;
  let cleared = 0;
  const unmatched = [];
  const uncertain = [];

  for (const game of candidates) {
    const ranked = catalog.items
      .map((item) => ({ item, score: scoreCatalogItem(game, item) }))
      .filter((entry) => entry.score >= 700)
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best) {
      skipped += 1;
      if (force && game.imageUrl && !dryRun) {
        clearImage(game);
        cleared += 1;
      }
      if (unmatched.length < 60) unmatched.push(game.title);
      continue;
    }

    if (best.score < 900 && uncertain.length < 60) {
      uncertain.push({ title: game.title, matchedTitle: best.item.title, score: best.score });
    }

    matched += 1;
    if (!dryRun) {
      game.imageUrl = best.item.imageUrl;
      game.imageSourceUrl = best.item.sourceUrl;
      game.imageProvider = "Microsoft Xbox 360 Marketplace catalog";
      game.imageMatchedTitle = best.item.title;
      game.imageMatchScore = best.score;
      game.imageRole = "boxartlg";
      game.microsoftCatalogId = best.item.id;
      game.microsoftCatalogTitleId = best.item.titleId || "";
      game.healthUpdatedAt = new Date().toISOString();
    }
  }

  const imageCount = games.filter((game) => game.imageUrl).length;
  const report = {
    ...manifest,
    microsoftCatalogImageEnrichedAt: new Date().toISOString(),
    microsoftCatalogImageSource: "Microsoft Xbox Live Marketplace catalog CDN",
    microsoftCatalogImagePolicy:
      "Images are applied only to confident matches from Microsoft's Xbox 360 Marketplace catalog. Existing non-Microsoft images are cleared during forced refresh when no Microsoft catalog match is found.",
    microsoftCatalogImageStats: {
      total: games.length,
      catalogItems: catalog.items.length,
      candidates: candidates.length,
      matched,
      skipped,
      cleared,
      images: imageCount,
      missingImages: games.length - imageCount,
      dryRun,
    },
    microsoftCatalogImageSamples: {
      unmatched,
      uncertain,
    },
    imageCount,
    missingImageCount: games.length - imageCount,
  };

  if (!dryRun) {
    writeJson(dataPath, games);
    writeJson(manifestPath, report);
  }

  console.log(`Matched Microsoft Xbox 360 catalog images: ${matched}/${candidates.length}.`);
  console.log(`Cleared non-Microsoft unmatched images: ${cleared}.`);
  console.log(`Xbox 360 images available: ${imageCount}/${games.length}.`);
  console.log(`Still missing images: ${games.length - imageCount}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
