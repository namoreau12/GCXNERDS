const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { isGameDatasetFile } = require("./scripts/game-dataset-utils");

const rootDir = __dirname;
const cacheDir = path.join(rootDir, ".cache", "pokemon");
const pokemonDataDir = path.join(rootDir, "data", "pokemon");
const magicDataDir = path.join(rootDir, "data", "magic");
const yugiohDataDir = path.join(rootDir, "data", "yugioh");
const gamesDataDir = path.join(rootDir, "data", "games");
const newsCacheDir = path.join(rootDir, ".cache", "news");
const newsCacheVersion = "image-hydration-v2";
const newsroomDataPath = path.join(rootDir, "data", "newsroom.json");
const newsroomOpsDataPath = path.join(rootDir, "data", "newsroom-os.json");
const communityDataPath = path.join(rootDir, "data", "community.json");
const communityUploadsDir = path.join(rootDir, "data", "community-uploads");
const launchReadinessDir = path.join(rootDir, "data", "launch-readiness");
const supabaseLaunchValidationPath = path.join(rootDir, "data", "launch-readiness", "supabase-launch-data-setup.json");
const envPath = path.join(rootDir, ".env");
const port = Number(process.env.PORT || 3000);
const pokemonApiBase = "https://api.pokemontcg.io/v2";
const cacheTtlMs = Number(process.env.POKEMON_CACHE_TTL_MS || 1000 * 60 * 60 * 12);
const newsCacheTtlMs = Number(process.env.NEWS_CACHE_TTL_MS || 1000 * 60 * 20);
let localPokemonData = null;
let localMagicData = null;
let localYugiohData = null;
let communityDataCache = null;
let communityDataCacheMtimeMs = 0;
let gameSearchCache = null;
let supabaseWriteQueue = Promise.resolve();
const rateLimitBuckets = new Map();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

const noindexStaticPages = new Set([
  "auth.html",
  "card.html",
  "community-admin.html",
  "community-growth.html",
  "community-inbox.html",
  "community-notifications.html",
  "community-post.html",
  "community-saved.html",
  "console.html",
  "data-health.html",
  "game.html",
  "image-queue.html",
  "magic-card.html",
  "newsroom.html",
  "overview-queue.html",
  "profile.html",
  "streamer.html",
  "yugioh-card.html",
  "3ds-game.html",
  "dreamcast-game.html",
  "ds-game.html",
  "gameboy-game.html",
  "gamecube-game.html",
  "gba-game.html",
  "genesis-game.html",
  "n64-game.html",
  "nes-game.html",
  "ps1-game.html",
  "ps2-game.html",
  "ps3-game.html",
  "ps4-game.html",
  "ps5-game.html",
  "psp-game.html",
  "saturn-game.html",
  "snes-game.html",
  "switch-game.html",
  "switch2-game.html",
  "vita-game.html",
  "wii-game.html",
  "xbox-game.html",
  "xbox360-game.html",
]);

let twitchTokenCache = {
  token: "",
  expiresAt: 0,
};

let twitchLiveCache = {
  key: "",
  expiresAt: 0,
  data: new Map(),
};

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) return;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  };
}

function cacheControlForStatic(filePath, requestPath = "") {
  const extension = path.extname(filePath).toLowerCase();
  const longCacheExtensions = new Set([".gif", ".ico", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
  const normalizedRequestPath = String(requestPath || "").replace(/^\/+/, "");

  if (extension === ".html" && noindexStaticPages.has(normalizedRequestPath)) {
    return "private, no-store";
  }

  if (longCacheExtensions.has(extension)) {
    return "public, max-age=604800";
  }

  if (extension === ".css" || extension === ".js") {
    return "no-cache, must-revalidate";
  }

  return "no-cache";
}

function robotsHeaderForStatic(requestPath) {
  const normalized = String(requestPath || "").replace(/^\/+/, "");
  return noindexStaticPages.has(normalized) ? "noindex, nofollow" : "";
}

function send(res, statusCode, body, type = "application/json; charset=utf-8", headers = {}) {
  res.writeHead(statusCode, {
    ...securityHeaders(),
    "Content-Type": type,
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

function sendJson(res, statusCode, value, headers = {}) {
  send(res, statusCode, JSON.stringify(value), "application/json; charset=utf-8", headers);
}

function sendBinary(res, statusCode, body, type, headers = {}) {
  res.writeHead(statusCode, {
    ...securityHeaders(),
    "Content-Type": type,
    "Cache-Control": "public, max-age=86400",
    ...headers,
  });
  res.end(body);
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local").split(",")[0].trim();
}

function rateLimit(req, key, limit = 20, windowMs = 1000 * 60 * 10) {
  const bucketKey = `${key}:${clientIp(req)}`;
  const now = Date.now();
  const bucket = rateLimitBuckets.get(bucketKey) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  rateLimitBuckets.set(bucketKey, bucket);
  return {
    ok: bucket.count <= limit,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

function sendRateLimitExceeded(res, limit, message = "Too many requests. Try again later.") {
  sendJson(res, 429, { error: message }, { "Retry-After": String(limit.retryAfter) });
}

function communityWriteRateLimit(req, route) {
  const normalizedRoute = String(route || "").replace(/\/+$/, "");
  const rules = [
    { pattern: /^uploads$/, key: "community-uploads", limit: 10, windowMs: 1000 * 60 * 15, message: "Too many uploads. Try again later." },
    { pattern: /comments\/report$/, key: "community-report", limit: 12, windowMs: 1000 * 60 * 15, message: "Too many reports. Try again later." },
    { pattern: /feed\/react$|feed\/like$/, key: "community-reactions", limit: 80, windowMs: 1000 * 60 * 10, message: "Too many reactions. Try again later." },
    { pattern: /comments$|feed$|feed\/reshare$/, key: "community-posting", limit: 24, windowMs: 1000 * 60 * 15, message: "Too much community posting. Try again later." },
    { pattern: /events\/[^/]+\/rsvp$|groups\/[^/]+\/join$|feed\/save$/, key: "community-actions", limit: 60, windowMs: 1000 * 60 * 15, message: "Too many community actions. Try again later." },
  ];
  const rule = rules.find((item) => item.pattern.test(normalizedRoute)) || {
    key: "community-write",
    limit: 90,
    windowMs: 1000 * 60 * 15,
    message: "Too many community updates. Try again later.",
  };
  return {
    ...rateLimit(req, rule.key, rule.limit, rule.windowMs),
    message: rule.message,
  };
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripMarkdownTablesForPreview(value) {
  const text = articleBlockText(value)
    .replace(/\u00a0/g, " ")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/\r\n?/g, "\n");

  if (!text.includes("|")) return text;

  if (!text.includes("\n") && /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(text)) {
    const firstPipe = text.indexOf("|");
    return firstPipe > 0 ? text.slice(0, firstPipe) : "";
  }

  const lines = text.split("\n");
  const output = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] || "";
    const isTableHeader = line.includes("|") && /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(nextLine);
    const isTableLine = line.trim().startsWith("|");
    if (isTableHeader || isTableLine) continue;
    output.push(line);
  }

  return output.join(" ");
}

function isStructuredTableBlock(block) {
  return Boolean(block && typeof block === "object" && block.type === "table" && Array.isArray(block.headers) && Array.isArray(block.rows));
}

function articleBlockText(block) {
  if (isStructuredTableBlock(block)) {
    return [
      block.caption,
      ...(block.headers || []),
      ...(block.rows || []).flat(),
    ]
      .filter(Boolean)
      .join(" ");
  }
  return String(block || "");
}

function cleanPreviewText(value, maxLength = 260) {
  return stripMarkdownTablesForPreview(value)
    .replace(/^\s*\|.+\|\s*$/gm, " ")
    .replace(/\|?\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*(?:\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*)+\|?/g, " ")
    .replace(/\|/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "")
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function storyPreviewText(story, maxLength = 500) {
  const candidates = [story?.excerpt, ...(story?.body || [])].filter(Boolean);
  for (const candidate of candidates) {
    const cleaned = cleanPreviewText(candidate, maxLength);
    if (cleaned) return cleaned;
  }
  return "Open the full GCX story for confirmed details, context, and source links.";
}

function plainMetaText(value, maxLength = 220) {
  return cleanPreviewText(value, maxLength);
}

function getCachePath(cacheKey) {
  const hash = crypto.createHash("sha256").update(cacheKey).digest("hex");
  return path.join(cacheDir, `${hash}.json`);
}

function readCache(cacheKey) {
  const filePath = getCachePath(cacheKey);
  if (!fs.existsSync(filePath)) return null;

  try {
    const cached = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const isFresh = Date.now() - cached.savedAt < cacheTtlMs;
    return {
      data: cached.data,
      fresh: isFresh,
    };
  } catch (error) {
    return null;
  }
}

function localWritesEnabled() {
  return process.env.GCX_DISABLE_LOCAL_WRITES !== "true" && process.env.VERCEL !== "1";
}

function writeCache(cacheKey, data) {
  if (!localWritesEnabled()) return false;
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    getCachePath(cacheKey),
    JSON.stringify(
      {
        savedAt: Date.now(),
        data,
      },
      null,
      2
    )
  );
  return true;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  if (!localWritesEnabled()) return false;
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(value, null, 2));
  fs.renameSync(tempPath, filePath);
  return true;
}

function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseAuthEnabled() {
  return String(process.env.SUPABASE_AUTH_ENABLED || "").toLowerCase() === "true";
}

function supabasePublicKey() {
  return String(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "").trim();
}

function supabasePersistenceMode() {
  return supabaseConfigured() ? "local+supabase" : "local";
}

function latestSupabaseLaunchValidation() {
  const report = readJsonIfExists(supabaseLaunchValidationPath);
  if (!report || typeof report !== "object") return null;
  return report;
}

function authPersistenceMode() {
  return supabaseAuthEnabled() && process.env.SUPABASE_URL && supabasePublicKey() ? "supabase-auth" : "local";
}

function launchModeStatus(data = null) {
  const communityData = data || loadCommunityData();
  const supabaseLaunchValidation = latestSupabaseLaunchValidation();
  return {
    marketplace: {
      status: "beta",
      realMoneyTradingEnabled: false,
      paymentsEnabled: false,
    },
    persistence: {
      mode: supabasePersistenceMode(),
      localFallbackEnabled: true,
      supabaseConfigured: supabaseConfigured(),
      tablesValidated: Boolean(supabaseLaunchValidation?.ready),
      tablesValidatedAt: supabaseLaunchValidation?.generatedAt || "",
      serverTablesReady: Boolean(supabaseLaunchValidation?.serviceRoleTablesReady),
      publicReadTablesReady: Boolean(supabaseLaunchValidation?.publicReadTablesReady),
      writeSurfaces: [
        "newsletter",
        "collector-waitlist",
        "news-comments",
        "community-posts",
        "community-comments",
        "moderation-reports",
        "sponsor-leads",
        "sponsor-promotions",
      ],
      localRecordCounts: {
        newsletterSubscriptions: (communityData.newsletterSubscriptions || []).length,
        collectorWaitlist: (communityData.collectorWaitlist || []).length,
        newsComments: (communityData.newsComments || []).length,
        posts: (communityData.posts || []).length,
        comments: (communityData.comments || []).length,
        moderationReports: (communityData.moderationReports || []).length,
        sponsorLeads: (communityData.sponsorLeads || []).length,
        sponsorPromotions: (communityData.sponsorPromotions || []).length,
      },
    },
    auth: {
      mode: authPersistenceMode(),
      supabaseAuthEnabled: supabaseAuthEnabled(),
      publicKeyConfigured: Boolean(supabasePublicKey()),
      localSessionFallbackEnabled: !supabaseAuthEnabled(),
      staffRoleGateConfigured: supabaseAuthEnabled(),
      localAdminAllowlistConfigured: localAdminEmails().size > 0,
      staffGateConfigured: supabaseAuthEnabled() || localAdminEmails().size > 0,
    },
  };
}

function buildPublicHealthStatus() {
  const launchReport = readJsonIfExists(path.join(launchReadinessDir, "latest.json"));
  const dataFreshness = readJsonIfExists(path.join(launchReadinessDir, "supabase-data-freshness.json"));
  const runtimeLinks = readJsonIfExists(path.join(launchReadinessDir, "runtime-links.json"));
  const status = launchReport?.status || "unknown";
  const blockers = Array.isArray(launchReport?.blockers) ? launchReport.blockers : [];
  const warnings = Array.isArray(launchReport?.warnings) ? launchReport.warnings : [];
  const currentLaunchChecksOk = process.env.GCX_CURRENT_LAUNCH_CHECKS_OK === "true";
  const currentRunSelfChecks = new Set(["launch-checks", "server-health-contract"]);
  const effectiveBlockers = currentLaunchChecksOk
    ? blockers.filter((blocker) => !currentRunSelfChecks.has(blocker?.id || ""))
    : blockers;
  const effectiveStatus = currentLaunchChecksOk && status === "blocked" && effectiveBlockers.length === 0 ? "ready-with-warnings" : status;
  const staleFiles = Array.isArray(dataFreshness?.stale) ? dataFreshness.stale : [];
  const runtimeOk = runtimeLinks ? Boolean(runtimeLinks.ok) : null;
  const dataFreshnessOk = dataFreshness ? Boolean(dataFreshness.ok && staleFiles.length === 0) : null;
  const launchReady = Boolean((launchReport?.launchReady || currentLaunchChecksOk) && effectiveBlockers.length === 0);

  return {
    ok: launchReady && dataFreshnessOk !== false && runtimeOk !== false,
    status: effectiveStatus,
    launchReady,
    generatedAt: new Date().toISOString(),
    launchReport: {
      generatedAt: launchReport?.generatedAt || "",
      blockers: effectiveBlockers.length,
      warnings: warnings.length,
      warningLabels: warnings.map((warning) => warning.label || warning.id || "Launch warning").slice(0, 8),
    },
    dataFreshness: {
      configured: Boolean(dataFreshness?.configured),
      ok: dataFreshnessOk,
      generatedAt: dataFreshness?.generatedAt || "",
      checkedFiles: Number(dataFreshness?.checkedFiles || 0),
      staleFiles: staleFiles.length,
    },
    runtimeLinks: {
      ok: runtimeOk,
      generatedAt: runtimeLinks?.generatedAt || "",
      checkedLinks: Number(runtimeLinks?.checkedLinks || 0),
      brokenLinks: Array.isArray(runtimeLinks?.broken) ? runtimeLinks.broken.length : 0,
      consoleErrors: Array.isArray(runtimeLinks?.consoleErrors) ? runtimeLinks.consoleErrors.length : 0,
    },
  };
}

function localAdminEmails() {
  return new Set(
    String(process.env.GCX_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function supabaseRestUrl(pathname) {
  return `${String(process.env.SUPABASE_URL || "").replace(/\/+$/, "")}/rest/v1/${pathname}`;
}

function supabaseAuthUrl(pathname) {
  return `${String(process.env.SUPABASE_URL || "").replace(/\/+$/, "")}/auth/v1/${pathname.replace(/^\/+/, "")}`;
}

async function supabaseRequest(pathname, options = {}) {
  if (!supabaseConfigured()) throw new Error("Supabase is not configured.");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeaders = key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` };
  const response = await fetch(supabaseRestUrl(pathname), {
    ...options,
    headers: {
      apikey: key,
      ...authHeaders,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${options.method || "GET"} ${pathname} failed with ${response.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function supabaseAuthRequest(pathname, options = {}) {
  const key = supabasePublicKey();
  if (!process.env.SUPABASE_URL || !key) throw new Error("Supabase Auth is not configured.");
  const response = await fetch(supabaseAuthUrl(pathname), {
    ...options,
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || `Supabase Auth request failed with ${response.status}.`;
    throw new Error(message);
  }
  return payload;
}

async function safeSupabaseWrite(table, rows, options = {}) {
  if (!supabaseConfigured()) return { ok: false, skipped: "not-configured" };
  const payload = Array.isArray(rows) ? rows : [rows];
  try {
    const result = await supabaseRequest(`${table}${options.query || ""}`, {
      method: options.method || "POST",
      headers: {
        Prefer: options.prefer || "resolution=merge-duplicates,return=minimal",
        ...(options.headers || {}),
      },
      body: JSON.stringify(payload),
    });
    return { ok: true, result };
  } catch (error) {
    console.warn(`Supabase ${table} write skipped: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

function supabaseTimestamp(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function uuidOrNull(value) {
  const text = String(value || "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null;
}

function encodePostgrestValue(value) {
  return encodeURIComponent(String(value || ""));
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function stripHtml(value) {
  return decodeEntities(
    String(value || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function compactPercent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function isFilled(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function firstFilled(...values) {
  return values.find(isFilled) || "";
}

function hasUsefulGameOverview(game) {
  const genericPhrases = [
    "officially released",
    "official release",
    "game record",
    "licensed north american",
    "software list",
  ];
  return [game.description, game.gcxOverview, game.overview].some((overview) => {
    if (!overview || String(overview).trim().length < 80) return false;
    const normalized = normalize(overview);
    return !genericPhrases.some((phrase) => normalized.includes(phrase));
  });
}

function gameImageUrl(game) {
  return firstFilled(game.imageUrl, game.boxArtUrl, game.coverUrl, game.coverImage, game.thumbnailUrl);
}

function cardImageUrl(card) {
  return firstFilled(
    card.images?.small,
    card.images?.large,
    card.imageUrl,
    card.imageUris?.small,
    card.imageUris?.normal,
    card.imageUris?.large
  );
}

function summarizeStatus({ kind, slug, label, url, total, images, overviews, sets, source, importedAt, notes = [], samples = [] }) {
  const imagePct = compactPercent(images, total);
  const overviewPct = overviews === null || overviews === undefined ? null : compactPercent(overviews, total);
  const missingImages = Math.max(0, total - images);
  const missingOverviews = overviewPct === null ? null : Math.max(0, total - overviews);
  const imageNeedsWork = kind === "games" ? missingImages >= 100 || imagePct < 90 : imagePct < 99;
  const overviewNeedsWork = overviewPct !== null && (missingOverviews >= 25 || overviewPct < 95);
  const hasMinorGap = missingImages > 0 || (missingOverviews || 0) > 0;
  const majorGap = total && (imageNeedsWork || overviewNeedsWork);
  const status = !total ? "attention" : majorGap ? "needs-work" : hasMinorGap ? "attention" : "healthy";
  const healthNotes = [...notes];

  if (missingImages > 0 && !healthNotes.some((note) => /missing image/i.test(note))) {
    healthNotes.push(`${missingImages.toLocaleString()} records still need reviewed image coverage.`);
  }
  if (missingOverviews > 0 && !healthNotes.some((note) => /missing overview/i.test(note))) {
    healthNotes.push(`${missingOverviews.toLocaleString()} records still need editorial overviews.`);
  }

  return {
    kind,
    slug,
    label,
    url,
    total,
    sets,
    images,
    imagePct,
    missingImages,
    overviews,
    overviewPct,
    missingOverviews,
    source: source || "",
    importedAt: importedAt || "",
    status,
    notes: healthNotes,
    samples,
  };
}

function summarizePokemonHealth() {
  const localData = loadLocalPokemonData();
  if (!localData) {
    return summarizeStatus({
      kind: "cards",
      slug: "pokemon",
      label: "Pokemon Cards",
      url: "pokemon.html",
      total: 0,
      images: 0,
      overviews: null,
      sets: 0,
      notes: ["Local Pokemon data files are missing or invalid."],
    });
  }

  const cards = localData.cards;
  const images = cards.filter((card) => cardImageUrl(card)).length;
  const priceCount = cards.filter((card) => Object.keys(card.tcgplayer?.prices || {}).length || card.cardmarket?.prices).length;
  const samples = cards
    .filter((card) => !cardImageUrl(card))
    .slice(0, 5)
    .map((card) => `${card.name} (${card.id})`);

  return summarizeStatus({
    kind: "cards",
    slug: "pokemon",
    label: "Pokemon Cards",
    url: "pokemon.html",
    total: cards.length,
    images,
    overviews: null,
    sets: localData.sets.length,
    source: localData.manifest?.source || "Pokemon TCG API local import",
    importedAt: localData.manifest?.importedAt,
    notes: [`${priceCount.toLocaleString()} cards include market-price data.`],
    samples,
  });
}

function summarizeMagicHealth() {
  const localData = loadLocalMagicData();
  if (!localData) {
    return summarizeStatus({
      kind: "cards",
      slug: "magic",
      label: "Magic Cards",
      url: "magic.html",
      total: 0,
      images: 0,
      overviews: null,
      sets: 0,
      notes: ["Local Magic data files are missing or invalid."],
    });
  }

  const manifest = localData.manifest || {};
  const total = manifest.cardCount || localData.cards.length;
  const images = manifest.imageCount ?? localData.cards.filter((card) => card.imageUrl).length;
  const setFileCount = fs.existsSync(path.join(magicDataDir, "cards-by-set"))
    ? fs.readdirSync(path.join(magicDataDir, "cards-by-set")).filter((fileName) => fileName.endsWith(".json")).length
    : 0;

  return summarizeStatus({
    kind: "cards",
    slug: "magic",
    label: "Magic Cards",
    url: "magic.html",
    total,
    images,
    overviews: null,
    sets: localData.sets.length,
    source: manifest.source || "Scryfall local import",
    importedAt: manifest.importedAt,
    notes: [`${setFileCount.toLocaleString()} per-set cache files are present.`],
    samples: [],
  });
}

function summarizeYugiohHealth() {
  const localData = loadLocalYugiohData();
  if (!localData) {
    return summarizeStatus({
      kind: "cards",
      slug: "yugioh",
      label: "Yu-Gi-Oh! Cards",
      url: "yugioh.html",
      total: 0,
      images: 0,
      overviews: null,
      sets: 0,
      notes: ["Local Yu-Gi-Oh! data files are missing or invalid."],
    });
  }

  const manifest = localData.manifest || {};
  const total = manifest.cardCount || localData.cards.length;
  const images = manifest.imageCount ?? localData.cards.filter((card) => card.imageUrl).length;

  return summarizeStatus({
    kind: "cards",
    slug: "yugioh",
    label: "Yu-Gi-Oh! Cards",
    url: "yugioh.html",
    total,
    images,
    overviews: null,
    sets: localData.sets.length,
    source: manifest.source || "YGOPRODeck local import",
    importedAt: manifest.importedAt,
    notes: manifest.databaseOnlyCount ? [`${manifest.databaseOnlyCount.toLocaleString()} cards are grouped as Database Only.`] : [],
    samples: [],
  });
}

function gameLibraryUrl(slug) {
  const directPages = new Set([
    "3ds",
    "dreamcast",
    "ds",
    "gameboy",
    "gamecube",
    "gba",
    "genesis",
    "n64",
    "nes",
    "ps1",
    "ps2",
    "ps3",
    "ps4",
    "ps5",
    "psp",
    "saturn",
    "snes",
    "switch",
    "switch2",
    "vita",
    "wii",
    "xbox",
    "xbox360",
  ]);
  return directPages.has(slug) ? `${slug}.html` : "games.html";
}

function summarizeGameLibraries() {
  if (!fs.existsSync(gamesDataDir)) return [];

  return fs
    .readdirSync(gamesDataDir)
    .filter(isGameDatasetFile)
    .sort()
    .map((fileName) => {
      const slug = fileName.replace(/\.json$/, "");
      const filePath = path.join(gamesDataDir, fileName);
      const games = readJsonIfExists(filePath) || [];
      if (!Array.isArray(games)) return null;
      const images = games.filter((game) => gameImageUrl(game)).length;
      const overviews = games.filter(hasUsefulGameOverview).length;
      const manifest = readJsonIfExists(path.join(gamesDataDir, `${slug}-manifest.json`)) || {};
      const samples = games
        .filter((game) => !gameImageUrl(game) || !hasUsefulGameOverview(game))
        .slice(0, 5)
        .map((game) => game.title || game.name || game.id);

      return summarizeStatus({
        kind: "games",
        slug,
        label: `${slug.toUpperCase()} Games`,
        url: gameLibraryUrl(slug),
        total: games.length,
        images,
        overviews,
        sets: null,
        source: manifest.source || games[0]?.source || "",
        importedAt: manifest.importedAt || manifest.generatedAt || "",
        notes: [],
        samples,
      });
    })
    .filter(Boolean);
}

function summarizeConsoleHealth() {
  const consoles = readJsonIfExists(path.join(rootDir, "data", "consoles.json")) || [];
  const images = consoles.filter((consoleItem) => firstFilled(consoleItem.imageUrl)).length;
  const overviews = consoles.filter((consoleItem) => firstFilled(consoleItem.tradeNotes)).length;
  const samples = consoles
    .filter((consoleItem) => !firstFilled(consoleItem.imageUrl) || !firstFilled(consoleItem.tradeNotes))
    .slice(0, 5)
    .map((consoleItem) => consoleItem.name || consoleItem.id);

  return summarizeStatus({
    kind: "consoles",
    slug: "consoles",
    label: "Console Database",
    url: "consoles.html",
    total: consoles.length,
    images,
    overviews,
    sets: null,
    source: "Local console marketplace index",
    importedAt: "",
    notes: [],
    samples,
  });
}

const newsSources = [
  {
    id: "polygon-gaming",
    name: "Polygon",
    category: "Gaming",
    feedUrl: "https://www.polygon.com/rss/gaming/index.xml",
    sourceUrl: "https://www.polygon.com/gaming",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1100&q=80",
  },
  {
    id: "the-verge-games",
    name: "The Verge Games",
    category: "Gaming",
    feedUrl: "https://www.theverge.com/rss/games/index.xml",
    sourceUrl: "https://www.theverge.com/games",
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1100&q=80",
  },
  {
    id: "nintendo-life",
    name: "Nintendo Life",
    category: "Nintendo",
    feedUrl: "https://www.nintendolife.com/feeds/latest",
    sourceUrl: "https://www.nintendolife.com/",
    imageUrl: "https://images.unsplash.com/photo-1612404819070-77c6da472e68?auto=format&fit=crop&w=1100&q=80",
  },
  {
    id: "pokebeach",
    name: "PokeBeach",
    category: "Cards",
    feedUrl: "https://kaprestridge.github.io/pokebeach-news-feed/feed.xml",
    sourceUrl: "https://www.pokebeach.com/",
    imageUrl: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=1100&q=80",
  },
];

const newsTopicBriefs = [
  {
    id: "gcx-brief-gta-6-watch",
    title: "GTA 6 watch: release date, preorder timing, and what collectors should track",
    category: "Gaming",
    imageUrl: "https://www.rockstargames.com/VI/-/opengraph-image.jpg?opengraph-image.0t8ty~nlmxq2s.jpg",
    imageCredit: "Rockstar Games",
    keywords: ["gta 6", "gta vi", "grand theft auto vi", "grand theft auto 6"],
    facts: [
      "Rockstar lists Grand Theft Auto VI for PlayStation 5 and Xbox Series X/S, with the current launch date set for November 19, 2026.",
      "Rockstar has already run a preorder beat and continues to publish major Newswire updates, which makes GTA 6 a natural GCX hub topic rather than a one-off headline.",
      "The useful angle is not only the trailer cycle: editions, preorder timing, platform details, collector interest, community reactions, and eventual marketplace demand all belong in one living hub.",
    ],
    gcxBody: [
      "Grand Theft Auto VI works best as a living hub, not a single post. Rockstar's own GTA VI page and Newswire posts give us the cleanest foundation: current platform targets, release timing, preorder beats, and the official marketing cadence.",
      "The GCX angle starts with the confirmed basics. Rockstar lists GTA VI for PlayStation 5 and Xbox Series X/S, with the current release date set for November 19, 2026. That matters for collectors because every date change, preorder window, and edition announcement can affect wishlists, collection plans, console demand, and future sealed-copy interest.",
      "Rockstar's Newswire is also the right anchor for updates instead of every rumor. When Rockstar publishes an extended look, preorder update, or release-date note, GCX can summarize the official facts, link readers directly to the source, and then explain what those facts mean for players, collectors, and the marketplace side of the site.",
      "For the homepage news feed, GTA VI can become a recurring pillar: trailer breakdowns, edition comparisons, preorder reminders, platform-performance notes, soundtrack or setting details, and community reaction posts. Each update can point readers into GCX discussion rather than leaving them at a headline.",
      "The marketplace tie-in is obvious but important. A game this large can drive console purchases, controller/accessory interest, collector editions, strategy guides, merch, and eventually used-copy demand. Tracking those signals early makes the article history more useful when beta marketplace tools arrive later.",
      "The rule for this kind of story is simple: official Rockstar sources first, reputable reporting second, GCX analysis always original. That keeps the article useful, source-backed, and different from a copied news rewrite.",
    ],
    sourceLinks: [
      {
        label: "Rockstar GTA VI hub",
        url: "https://www.rockstargames.com/VI/",
      },
      {
        label: "Rockstar release-date Newswire",
        url: "https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026",
      },
      {
        label: "Rockstar extended-look Newswire",
        url: "https://www.rockstargames.com/newswire/article/9k2kaa1o3297k9/grand-theft-auto-vi-an-extended-look",
      },
      {
        label: "Rockstar preorder Newswire",
        url: "https://www.rockstargames.com/newswire/article/5171972o3ak5oa/pre-order-grand-theft-auto-vi-on-june-25",
      },
    ],
  },
  {
    id: "gcx-brief-wolverine-watch",
    title: "Marvel's Wolverine watch: PS5 release, story setup, and why it belongs on GCX",
    category: "Gaming",
    imageUrl: "https://image.api.playstation.com/vulcan/ap/rnd/202605/2215/a69481c5fa50fe19f42896d84fb7cbf37ab8646801a93322.png",
    imageCredit: "PlayStation / Insomniac Games",
    keywords: ["wolverine", "marvel's wolverine", "marvels wolverine", "insomniac"],
    facts: [
      "PlayStation lists Marvel's Wolverine as a PS5-only, single-player, narrative-driven action-adventure game from Insomniac Games.",
      "The official PlayStation page lists September 15, 2026 as the launch date, while the PlayStation Store may show the local unlock date depending on region.",
      "Wolverine coverage connects the news cycle to PS5 collecting, preorder interest, edition tracking, streamer reactions, and eventual review coverage.",
    ],
    gcxBody: [
      "Marvel's Wolverine is another strong GCX news pillar because the official pages already give us a clear source base. PlayStation identifies it as a PS5-only, single-player, narrative-driven action-adventure game from Insomniac Games, developed with Marvel Games and Sony Interactive Entertainment.",
      "That official framing tells readers what kind of game to expect before the review cycle starts. It is not being positioned as an open-world checklist game; it is a focused action-adventure built around Logan, Insomniac's cinematic strengths, and PlayStation 5 hardware.",
      "The release window is also specific enough to support recurring coverage. PlayStation lists September 15, 2026 as the launch date, while storefront timing can vary by region or local unlock display. The official PlayStation page remains the main reference, with storefront nuance called out clearly.",
      "For collectors, Wolverine coverage can follow editions, preorder incentives, themed hardware, physical-copy details, and long-term PS5 library placement. A major Insomniac Marvel release can become more than a review: it can become a console-library anchor, a streamer moment, and a marketplace search term.",
      "For community, Wolverine is built for discussion. Combat impressions, character expectations, Marvel continuity questions, and comparison to Insomniac's Spider-Man games can all become comment prompts under GCX stories.",
      "The GCX approach is official-source-first: PlayStation and Marvel for facts, then GCX's own explanation of why those facts matter to players, collectors, streamers, and future marketplace-watchlist members.",
    ],
    sourceLinks: [
      {
        label: "PlayStation Marvel's Wolverine page",
        url: "https://www.playstation.com/en-us/games/marvels-wolverine/",
      },
      {
        label: "Marvel game page",
        url: "https://www.marvel.com/games/marvels-wolverine",
      },
      {
        label: "PlayStation Store listing",
        url: "https://store.playstation.com/en-us/product/UP9000-PPSA03671_00-MARVELSWOLVERINE",
      },
    ],
  },
];

function loadNewsroomStories() {
  const stories = readJsonIfExists(newsroomDataPath);
  if (!Array.isArray(stories)) return [];
  return stories
    .map((story) => ({
      ...story,
      id: safeText(story.id, 120) || `gcx-newsroom-${slugify(story.title)}`,
      title: safeText(story.title, 220),
      excerpt: storyPreviewText(story, 500),
      body: Array.isArray(story.body) ? story.body.map((paragraph) => safeArticleBlock(paragraph)).filter(Boolean) : [],
      category: safeText(story.category || "Gaming", 80),
      sourceName: safeText(story.sourceName || "GCX Newsroom", 120),
      sourceUrl: safeUrl(story.sourceUrl || "news.html"),
      externalUrl: safeUrl(story.externalUrl || ""),
      heroImage: safeUrl(story.heroImage || story.imageUrl || ""),
      heroImageSource: safeText(story.heroImageSource || "", 160),
      heroImageCredit: safeText(story.heroImageCredit || story.imageCredit || "", 180),
      heroImageAlt: safeText(story.heroImageAlt || "", 240),
      heroImageFocalX: safeText(story.heroImageFocalX || story.imageFocalX || "", 20),
      heroImageFocalY: safeText(story.heroImageFocalY || story.imageFocalY || "", 20),
      trailerUrl: safeUrl(story.trailerUrl || ""),
      mediaType: safeText(story.mediaType || story.leadMediaType || story.imageType || "", 40),
      imageUrl: safeUrl(story.imageUrl || story.heroImage || ""),
      imageCredit: safeText(story.imageCredit || story.heroImageCredit || "Original GCX editorial image", 160),
      media: sanitizeEditorialMedia(story.media),
      publishedAt: isoDateOrNow(story.publishedAt),
      type: safeText(story.type || "editorial", 80),
      topicCluster: safeText(story.topicCluster || "", 160),
      canonicalTopic: safeText(story.canonicalTopic || "", 160),
      articleType: safeText(story.articleType || story.type || "Major News", 80),
      storyLifecycleState: safeText(story.storyLifecycleState || story.editorialStatus || "", 80),
      editorialStatus: safeText(story.editorialStatus || story.storyLifecycleState || "", 80),
      opportunityScore: Number.isFinite(Number(story.opportunityScore)) ? Math.max(0, Math.min(100, Number(story.opportunityScore))) : undefined,
      qaScore: Number.isFinite(Number(story.qaScore)) ? Math.max(0, Math.min(100, Number(story.qaScore))) : undefined,
      confidence: safeText(story.confidence || story.claimStatus || "", 80),
      updateFrequency: safeText(story.updateFrequency || "", 120),
      livingArticle: Boolean(story.livingArticle),
      deepResearchUsed: Boolean(story.deepResearchUsed),
      targetSearchIntent: safeText(story.targetSearchIntent || "", 500),
      sourceLinks: Array.isArray(story.sourceLinks)
        ? story.sourceLinks
            .map((source) => ({
              label: safeText(source.label, 160),
              url: safeUrl(source.url),
            }))
            .filter((source) => source.label && source.url)
        : [],
      relatedLinks: Array.isArray(story.relatedLinks)
        ? story.relatedLinks
            .map((link) => ({
              label: safeText(link.label, 160),
              url: safeUrl(link.url),
            }))
            .filter((link) => link.label && link.url)
        : [],
    }))
    .filter((story) => story.id && story.title && story.imageUrl);
}

function sanitizeEditorialMedia(media) {
  if (!Array.isArray(media)) return [];
  const allowedTypes = new Set(["image", "screenshot", "trailer", "video", "gallery", "rights-note"]);
  const allowedRights = new Set(["approved", "press-asset", "official-embed", "licensed", "owned", "permission-granted", "fair-use-review", "source-link-only", "pending-review"]);
  return media
    .map((item) => {
      const mediaType = safeText(item.mediaType || item.type || "", 40).toLowerCase();
      const rightsStatus = safeText(item.rightsStatus || "", 40).toLowerCase();
      const sanitized = {
        id: safeText(item.id || "", 80),
        mediaType: allowedTypes.has(mediaType) ? mediaType : "",
        placement: safeText(item.placement || "", 80),
        afterBlockIndex: Number.isFinite(Number(item.afterBlockIndex)) ? Number(item.afterBlockIndex) : undefined,
        afterHeading: safeText(item.afterHeading || "", 220),
        source: safeText(item.source || "", 160),
        sourceUrl: safeUrl(item.sourceUrl || ""),
        imageUrl: safeUrl(item.imageUrl || item.url || ""),
        embedUrl: safeUrl(item.embedUrl || ""),
        caption: safeText(item.caption || "", 500),
        credit: safeText(item.credit || "", 180),
        altText: safeText(item.altText || "", 240),
        focalX: safeText(item.focalX || item.heroImageFocalX || "", 20),
        focalY: safeText(item.focalY || item.heroImageFocalY || "", 20),
        rightsStatus: allowedRights.has(rightsStatus) ? rightsStatus : "pending-review",
        rightsNote: safeText(item.rightsNote || "", 360),
        aspectRatio: safeText(item.aspectRatio || "", 20),
      };
      if (Array.isArray(item.items)) {
        sanitized.items = item.items
          .map((galleryItem) => ({
            imageUrl: safeUrl(galleryItem.imageUrl || galleryItem.url || ""),
            caption: safeText(galleryItem.caption || "", 320),
            credit: safeText(galleryItem.credit || item.credit || "", 180),
            altText: safeText(galleryItem.altText || "", 220),
            focalX: safeText(galleryItem.focalX || "", 20),
            focalY: safeText(galleryItem.focalY || "", 20),
            sourceUrl: safeUrl(galleryItem.sourceUrl || item.sourceUrl || ""),
            rightsStatus: allowedRights.has(safeText(galleryItem.rightsStatus || item.rightsStatus || "", 40).toLowerCase())
              ? safeText(galleryItem.rightsStatus || item.rightsStatus || "", 40).toLowerCase()
              : "pending-review",
          }))
          .filter((galleryItem) => galleryItem.imageUrl);
      }
      return sanitized;
    })
    .filter((item) => item.mediaType && (item.imageUrl || item.embedUrl || item.caption || (item.items || []).length));
}

function saveNewsroomStory(story) {
  const currentStories = readJsonIfExists(newsroomDataPath);
  const existingStories = Array.isArray(currentStories) ? currentStories : [];
  const baseSlug = slugify(story.title) || "story";
  const existingIds = new Set(existingStories.map((item) => item.id));
  let id = `gcx-newsroom-${baseSlug}`;
  if (existingIds.has(id)) id = `${id}-${Date.now()}`;
  const nextStory = {
    id,
    title: safeText(story.title, 220),
    excerpt: safeText(story.excerpt, 500),
    body: Array.isArray(story.body) ? story.body.map((paragraph) => safeArticleBlock(paragraph)).filter(Boolean) : [],
    category: safeText(story.category || "Gaming", 80),
    sourceName: "GCX Newsroom",
    sourceUrl: "news.html",
    externalUrl: safeUrl(story.externalUrl || ""),
    heroImage: safeUrl(story.heroImage || story.imageUrl || ""),
    heroImageSource: safeText(story.heroImageSource || "", 160),
    heroImageCredit: safeText(story.heroImageCredit || story.imageCredit || "", 180),
    heroImageAlt: safeText(story.heroImageAlt || "", 240),
    heroImageFocalX: safeText(story.heroImageFocalX || story.imageFocalX || "", 20),
    heroImageFocalY: safeText(story.heroImageFocalY || story.imageFocalY || "", 20),
    trailerUrl: safeUrl(story.trailerUrl || ""),
    mediaType: safeText(story.mediaType || story.leadMediaType || story.imageType || "", 40),
    imageUrl: safeUrl(story.imageUrl || story.heroImage || ""),
    imageCredit: safeText(story.imageCredit || story.heroImageCredit || "GCX Newsroom", 160),
    media: sanitizeEditorialMedia(story.media),
    publishedAt: story.publishedAt || new Date().toISOString(),
    type: "editorial",
    topicCluster: safeText(story.topicCluster || "", 160),
    canonicalTopic: safeText(story.canonicalTopic || "", 160),
    articleType: safeText(story.articleType || "Major News", 80),
    storyLifecycleState: safeText(story.storyLifecycleState || "Ready", 80),
    editorialStatus: safeText(story.storyLifecycleState || "Ready", 80),
    opportunityScore: Number.isFinite(Number(story.opportunityScore)) ? Math.max(0, Math.min(100, Number(story.opportunityScore))) : undefined,
    qaScore: Number.isFinite(Number(story.qaScore)) ? Math.max(0, Math.min(100, Number(story.qaScore))) : undefined,
    confidence: safeText(story.confidence || "", 80),
    updateFrequency: safeText(story.updateFrequency || "", 120),
    livingArticle: Boolean(story.livingArticle),
    deepResearchUsed: Boolean(story.deepResearchUsed),
    targetSearchIntent: safeText(story.targetSearchIntent || "", 500),
    sourceLinks: story.sourceLinks,
    relatedLinks: story.relatedLinks,
  };
  writeJson(newsroomDataPath, [nextStory, ...existingStories]);
  return loadNewsroomStories().find((item) => item.id === id) || nextStory;
}

function staticSearchDestinations() {
  return [
    {
      title: "Pokemon card database",
      excerpt: "Browse Pokemon card series, sets, card details, market fields, legalities, variants, and collector tools.",
      category: "Cards",
      url: "pokemon.html",
      keywords: "pokemon tcg pikachu cards card database collector checklist",
    },
    {
      title: "Magic card database",
      excerpt: "Explore Magic sets and cards as Games Exchange expands the trading-card index.",
      category: "Cards",
      url: "magic.html",
      keywords: "magic mtg cards trading card database",
    },
    {
      title: "Yu-Gi-Oh! card database",
      excerpt: "Browse Yu-Gi-Oh! sets and cards as the collector library grows.",
      category: "Cards",
      url: "yugioh.html",
      keywords: "yugioh yu-gi-oh cards trading card database",
    },
    {
      title: "Game database",
      excerpt: "Search console libraries, platform pages, game overviews, and collector-relevant game records.",
      category: "Games",
      url: "games.html",
      keywords: "games database consoles retro library playstation xbox nintendo sega",
    },
    {
      title: "Community feed",
      excerpt: "Join the public feed for game nights, card pulls, streaming clips, polls, and collector conversations.",
      category: "Community",
      url: "community.html",
      keywords: "community social feed posts polls clips collectors",
    },
    {
      title: "Streamer highlights",
      excerpt: "Vote for featured creators and follow community spotlight campaigns.",
      category: "Streaming",
      url: "streamers.html",
      keywords: "streamers creators twitch spotlight streaming",
    },
  ];
}

function searchScore(query, fields = []) {
  const q = normalize(query);
  if (!q) return 0;
  const haystack = normalize(fields.filter(Boolean).join(" "));
  if (!haystack) return 0;
  let score = 0;
  fields.forEach((field, index) => {
    const text = normalize(field);
    if (!text) return;
    if (text === q) score += index === 0 ? 120 : 50;
    if (text.startsWith(q)) score += index === 0 ? 70 : 25;
    if (text.includes(q)) score += index === 0 ? 45 : 12;
  });
  q.split(/\s+/).filter(Boolean).forEach((token) => {
    if (haystack.includes(token)) score += token.length > 3 ? 6 : 2;
  });
  return score;
}

function loadGameSearchRecords() {
  if (gameSearchCache) return gameSearchCache;
  const records = [];
  if (!fs.existsSync(gamesDataDir)) {
    gameSearchCache = records;
    return records;
  }

  fs.readdirSync(gamesDataDir)
    .filter(isGameDatasetFile)
    .forEach((fileName) => {
      const filePath = path.join(gamesDataDir, fileName);
      let games = [];
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
        games = Array.isArray(parsed) ? parsed : Array.isArray(parsed.games) ? parsed.games : [];
      } catch {
        games = [];
      }
      const platformSlug = path.basename(fileName, ".json");
      games.forEach((game) => {
        if (!game?.id || !game?.title) return;
        records.push({
          id: safeText(game.id, 160),
          title: safeText(game.title, 220),
          platform: safeText(game.platform || platformSlug.toUpperCase(), 80),
          genre: safeText(game.genre || (game.genres || [])[0] || "", 80),
          year: safeText((game.releaseYears || [])[0] || game.firstReleased || "", 40),
          excerpt: safeText(game.description || game.tradeNotes || "", 260),
          url: `${platformSlug}-game.html?id=${encodeURIComponent(game.id)}`,
          searchText: safeText(game.searchText || "", 1200),
        });
      });
    });

  gameSearchCache = records;
  return records;
}

function siteSearchNewsUrl(story) {
  const type = normalize(story?.type);
  const sourceName = normalize(story?.sourceName);
  if (["social", "streamer"].includes(type) || ["gcx community", "gcx streamers"].includes(sourceName)) {
    return story.externalUrl || story.articleUrl || "news.html";
  }
  return story.articleUrl || story.externalUrl || "news.html";
}

async function buildSiteSearchResults(query, limit = 24) {
  const q = safeText(query, 120);
  if (!normalize(q)) return { query: q, data: [], totalCount: 0 };
  const perTypeLimit = Math.max(3, Math.ceil(limit / 3));
  const results = [];

  const newsStories = await buildNewsStories();
  newsStories
    .map((story) => ({
      type: "news",
      category: story.category || "News",
      title: story.title,
      excerpt: storyPreviewText(story, 220),
      url: siteSearchNewsUrl(story),
      publishedAt: story.publishedAt,
      score: searchScore(q, [story.title, story.excerpt, story.category, story.type, story.sourceName, story.targetSearchIntent, ...(story.body || []).map(articleBlockText)]),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, perTypeLimit)
    .forEach((item) => results.push(item));

  const communityData = loadCommunityData();
  (communityData.posts || [])
    .filter(isPublicCommunityPost)
    .map((post) => ({
      type: "community",
      category: post.category || "Community",
      title: post.title,
      excerpt: post.body || post.linkPreview?.description || "Open the community post.",
      url: `community-post.html?id=${encodeURIComponent(post.id)}`,
      publishedAt: post.createdAt,
      score: searchScore(q, [post.title, post.body, post.author, post.category, post.linkPreview?.title, post.linkPreview?.description, ...(post.tags || [])]),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, perTypeLimit)
    .forEach((item) => results.push(item));

  loadGameSearchRecords()
    .map((game) => ({
      type: "game",
      category: game.platform || "Games",
      title: game.title,
      excerpt: [game.platform, game.genre, game.year, game.excerpt].filter(Boolean).join(" - "),
      url: game.url,
      score: searchScore(q, [game.title, game.platform, game.genre, game.year, game.searchText, game.excerpt]),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, perTypeLimit)
    .forEach((item) => results.push(item));

  staticSearchDestinations()
    .map((item) => ({
      type: "destination",
      category: item.category,
      title: item.title,
      excerpt: item.excerpt,
      url: item.url,
      score: searchScore(q, [item.title, item.category, item.excerpt, item.keywords]),
    }))
    .filter((item) => item.score > 0)
    .forEach((item) => results.push(item));

  const data = results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ score, ...item }) => ({
      ...item,
      title: safeText(item.title, 220),
      excerpt: safeText(item.excerpt, 320),
      category: safeText(item.category, 80),
      url: safeText(item.url, 260),
    }));

  return { query: q, data, totalCount: data.length };
}

function newsCachePath(sourceId) {
  return path.join(newsCacheDir, `${sourceId}-${newsCacheVersion}.json`);
}

function readNewsCache(sourceId) {
  const filePath = newsCachePath(sourceId);
  if (!fs.existsSync(filePath)) return null;
  try {
    const cached = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      data: cached.data || [],
      fresh: Date.now() - Number(cached.savedAt || 0) < newsCacheTtlMs,
    };
  } catch (error) {
    return null;
  }
}

function writeNewsCache(sourceId, data) {
  fs.mkdirSync(newsCacheDir, { recursive: true });
  writeJson(newsCachePath(sourceId), {
    savedAt: Date.now(),
    data,
  });
}

function tagValue(xml, tagName) {
  const escaped = tagName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const match = String(xml || "").match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
  return decodeEntities(match?.[1] || "");
}

function tagAttribute(xml, tagName, attributeName) {
  const escapedTag = tagName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const escapedAttribute = attributeName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const match = String(xml || "").match(new RegExp(`<${escapedTag}\\b[^>]*\\s${escapedAttribute}=["']([^"']+)["'][^>]*>`, "i"));
  return decodeEntities(match?.[1] || "");
}

function xmlBlocks(xml, tagName) {
  const escaped = tagName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  return Array.from(String(xml || "").matchAll(new RegExp(`<${escaped}\\b[^>]*>[\\s\\S]*?<\\/${escaped}>`, "gi"))).map((match) => match[0]);
}

function firstImageFromXml(block) {
  return (
    tagAttribute(block, "media:content", "url") ||
    tagAttribute(block, "media:thumbnail", "url") ||
    tagAttribute(block, "enclosure", "url") ||
    ""
  );
}

function htmlAttribute(tag, attributeName) {
  const escapedAttribute = attributeName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const match = String(tag || "").match(new RegExp(`\\s${escapedAttribute}=["']([^"']+)["']`, "i"));
  return decodeEntities(match?.[1] || "");
}

function absoluteStoryImageUrl(imageUrl, pageUrl) {
  const cleanImageUrl = decodeEntities(imageUrl);
  if (!cleanImageUrl) return "";

  try {
    return new URL(cleanImageUrl, pageUrl).toString();
  } catch (error) {
    return "";
  }
}

function firstImageFromHtml(html, pageUrl) {
  const metas = Array.from(String(html || "").matchAll(/<meta\b[^>]*>/gi)).map((match) => match[0]);
  const imageMeta = metas.find((tag) => {
    const property = normalize(htmlAttribute(tag, "property") || htmlAttribute(tag, "name"));
    return ["og:image", "og:image:url", "twitter:image", "twitter:image:src"].includes(property);
  });

  return absoluteStoryImageUrl(htmlAttribute(imageMeta, "content"), pageUrl);
}

function isStockImageUrl(imageUrl) {
  return String(imageUrl || "").includes("images.unsplash.com");
}

async function fetchArticleImage(story) {
  if (!story.externalUrl) return "";

  try {
    const response = await fetch(story.externalUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "GamesCardsExchange/0.1 (local news image reader)",
      },
    });
    if (!response.ok) return "";
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return "";
    return firstImageFromHtml(await response.text(), story.externalUrl);
  } catch (error) {
    return "";
  }
}

async function hydrateStoryImages(stories, source) {
  const hydrated = await Promise.all(
    stories.map(async (story) => {
      const articleImageUrl = story.imageUrl ? "" : await fetchArticleImage(story);
      const imageUrl = safeUrl(articleImageUrl || story.imageUrl);
      return {
        ...story,
        imageUrl,
        imageCredit: imageUrl ? story.imageCredit || story.sourceName : "",
      };
    })
  );

  return hydrated.filter((story) => story.imageUrl);
}

function storyId(sourceId, title, url) {
  return `${sourceId}-${slugify(title || url || "story")}`;
}

function isoDateOrNow(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function parseFeedStories(xml, source) {
  const rssItems = xmlBlocks(xml, "item").map((item) => {
    const title = stripHtml(tagValue(item, "title"));
    const externalUrl = safeUrl(tagValue(item, "link") || tagValue(item, "guid"));
    const description = stripHtml(tagValue(item, "description") || tagValue(item, "content:encoded"));
    const publishedAt = safeText(tagValue(item, "pubDate") || tagValue(item, "dc:date") || new Date().toISOString(), 80);
    return {
      id: storyId(source.id, title, externalUrl),
      title,
      excerpt: description.slice(0, 220),
      body: [description].filter(Boolean),
      category: source.category,
      sourceName: source.name,
      sourceUrl: source.sourceUrl,
      externalUrl,
      imageUrl: firstImageFromXml(item),
      imageCredit: firstImageFromXml(item) ? source.name : "",
      publishedAt: isoDateOrNow(publishedAt),
      type: source.category === "Cards" ? "card-news" : "gaming-news",
    };
  });

  const atomItems = xmlBlocks(xml, "entry").map((entry) => {
    const title = stripHtml(tagValue(entry, "title"));
    const externalUrl = safeUrl(tagAttribute(entry, "link", "href") || tagValue(entry, "id"));
    const description = stripHtml(tagValue(entry, "summary") || tagValue(entry, "content"));
    const publishedAt = safeText(tagValue(entry, "published") || tagValue(entry, "updated") || new Date().toISOString(), 80);
    return {
      id: storyId(source.id, title, externalUrl),
      title,
      excerpt: description.slice(0, 220),
      body: [description].filter(Boolean),
      category: source.category,
      sourceName: source.name,
      sourceUrl: source.sourceUrl,
      externalUrl,
      imageUrl: firstImageFromXml(entry),
      imageCredit: firstImageFromXml(entry) ? source.name : "",
      publishedAt: isoDateOrNow(publishedAt),
      type: source.category === "Cards" ? "card-news" : "gaming-news",
    };
  });

  return [...rssItems, ...atomItems]
    .filter((story) => story.title && story.externalUrl)
    .map((story) => ({
      ...story,
      excerpt: story.excerpt || `Read the latest from ${source.name}.`,
    }));
}

async function fetchNewsSource(source) {
  const cached = readNewsCache(source.id);
  if (cached?.fresh) return cached.data;

  try {
    const response = await fetch(source.feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "GamesCardsExchange/0.1 (local news feed reader)",
      },
    });
    if (!response.ok) throw new Error(`${source.name} returned ${response.status}`);
    const xml = await response.text();
    const stories = await hydrateStoryImages(parseFeedStories(xml, source).slice(0, 8), source);
    writeNewsCache(source.id, stories);
    return stories;
  } catch (error) {
    return cached?.data || [];
  }
}

function buildCommunityNewsStories(data) {
  const streamers = [...(data.streamers || [])]
    .sort((a, b) => Number(b.weeklyVotes || b.votes || 0) - Number(a.weeklyVotes || a.votes || 0))
    .slice(0, 2)
    .map((streamer, index) => ({
      id: `gcx-streamer-${slugify(streamer.id || streamer.name)}`,
      title: `${streamer.name} is pushing the GCX streamer spotlight race`,
      excerpt: streamer.pitch || `${streamer.name} is part of this week's GCX streamer race.`,
      body: [
        `${streamer.name} is ${index === 0 ? "leading" : "in the mix for"} this week's GCX streamer spotlight with ${Number(streamer.weeklyVotes || streamer.votes || 0).toLocaleString()} votes.`,
        streamer.pitch || streamer.specialty || "The streamer spotlight is designed to bring creator audiences back into GCX community posts, card discussions, and game library pages.",
      ],
      category: "Streamers",
      sourceName: "GCX Streamers",
      sourceUrl: "streamers.html",
      externalUrl: streamer.campaignUrl || `streamer.html?id=${encodeURIComponent(streamer.id)}`,
      imageUrl: safeUrl(streamer.imageUrl || ""),
      publishedAt: new Date().toISOString(),
      type: "streamer",
    }))
    .filter((story) => story.imageUrl && !isStockImageUrl(story.imageUrl));

  const posts = [...(data.posts || [])]
    .filter(isPublicCommunityPost)
    .sort((a, b) => Number(b.likes || 0) + Number(b.comments || 0) * 3 - (Number(a.likes || 0) + Number(a.comments || 0) * 3))
    .slice(0, 3)
    .map((post) => ({
      id: `gcx-social-${slugify(post.id || post.title)}`,
      title: `Community pulse: ${post.title}`,
      excerpt: post.body || "A GCX community story is gaining traction.",
      body: [
        post.body || "A GCX community story is gaining traction.",
        "This story links the news surface to GCX social activity so readers can move from headline scanning into comments, saves, reposts, and beta marketplace conversations.",
      ],
      category: post.category || "Community",
      sourceName: "GCX Community",
      sourceUrl: "community.html",
      externalUrl: `community-post.html?id=${encodeURIComponent(post.id)}`,
      imageUrl: safeUrl(post.imageUrl || ""),
      publishedAt: post.createdAt || new Date().toISOString(),
      type: "social",
    }))
    .filter((story) => story.imageUrl && !isStockImageUrl(story.imageUrl));

  return [...streamers, ...posts];
}

function storyMatchesTopic(story, topic) {
  const text = normalize([story.title, story.excerpt, story.category, story.sourceName].join(" "));
  return topic.keywords.some((keyword) => text.includes(normalize(keyword)));
}

function buildTopicBriefStories(externalStories) {
  return newsTopicBriefs.map((topic) => {
    const related = externalStories.filter((story) => storyMatchesTopic(story, topic)).slice(0, 5);
    const sourceLinks = [
      ...topic.sourceLinks,
      ...related.map((story) => ({
        label: `${story.sourceName}: ${story.title}`,
        url: story.externalUrl || story.sourceUrl,
      })),
    ].filter((source, index, all) => source.url && all.findIndex((candidate) => candidate.url === source.url) === index);
    const relatedLine = related.length
      ? `Live source scan found ${related.length} related headline${related.length === 1 ? "" : "s"} in the current feed mix.`
      : "No matching live-feed headline is required for this brief because the core facts are pinned to official source pages.";

    return {
      id: topic.id,
      title: topic.title,
      excerpt: `${topic.facts[0]} ${relatedLine}`,
      body: [...(topic.gcxBody || topic.facts), relatedLine],
      category: topic.category,
      sourceName: "GCX Developer Brief",
      sourceUrl: "news.html",
      externalUrl: sourceLinks[0]?.url || "news.html",
      imageUrl: topic.imageUrl,
      imageCredit: topic.imageCredit || "",
      publishedAt: new Date().toISOString(),
      type: "brief",
      sourceLinks,
      relatedStories: related.map((story) => ({
        id: story.id,
        title: story.title,
        sourceName: story.sourceName,
        externalUrl: story.externalUrl,
      })),
    };
  });
}

async function buildNewsStories() {
  const sourceResults = await Promise.all(newsSources.map(fetchNewsSource));
  const externalStories = sourceResults.flat();
  const newsroomStories = loadNewsroomStories();
  const localStories = buildCommunityNewsStories(loadCommunityData());
  const topicBriefStories = buildTopicBriefStories(externalStories);
  const stories = [...newsroomStories, ...topicBriefStories, ...localStories, ...externalStories]
    .filter((story, index, all) => all.findIndex((candidate) => candidate.id === story.id) === index)
    .sort((a, b) => {
      const aRank = a.sourceName === "GCX Newsroom" ? 1 : 0;
      const bRank = b.sourceName === "GCX Newsroom" ? 1 : 0;
      return bRank - aRank || new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    });

  return stories.map((story) => {
    const articleUrl = `article.html?id=${encodeURIComponent(story.id)}`;
    const shareUrl = `community.html?shareUrl=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(story.title)}&body=${encodeURIComponent(story.excerpt)}&category=${encodeURIComponent(story.category)}`;
    return {
      ...story,
      body: Array.isArray(story.body) ? story.body.map((block) => safeArticleBlock(block)).filter(Boolean) : [],
      articleUrl,
      shareUrl,
    };
  });
}

function loadNewsroomOpsConfig() {
  const config = readJsonIfExists(newsroomOpsDataPath);
  return config && typeof config === "object" ? config : {};
}

function daysSince(value) {
  const time = new Date(value || 0).getTime();
  if (!time || Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24)));
}

function newsroomArticleUrl(articleId) {
  return `article.html?id=${encodeURIComponent(articleId)}`;
}

function normalizedOpsStatus(value, fallback = "watching") {
  return slugify(value || fallback).replaceAll("-", "_") || fallback;
}

function newsroomQaBand(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) return "unscored";
  if (value >= 90) return "excellent";
  if (value >= 85) return "strong";
  if (value >= 75) return "needs_improvement";
  return "do_not_publish";
}

function inferNewsroomCluster(story, clusters = []) {
  const explicitCluster = safeText(story.topicCluster || story.canonicalTopic || "", 160);
  if (explicitCluster) return explicitCluster;
  const title = normalize(`${story.title} ${story.excerpt} ${(story.tags || []).join(" ")}`);
  const matched = clusters.find((cluster) => {
    const name = normalize(cluster.name || cluster.slug);
    const hubId = normalize(cluster.hubArticleId);
    return (name && title.includes(name.split(" ")[0])) || (hubId && normalize(story.id) === hubId);
  });
  if (matched?.name) return matched.name;
  return story.category || "General News";
}

function newsroomStaleReasons(story) {
  const reasons = [];
  const age = daysSince(story.lastUpdated || story.publishedAt);
  const articleType = normalize(story.articleType || story.type);
  const isLiving = Boolean(story.livingArticle) || articleType.includes("guide") || articleType.includes("tracker") || articleType.includes("hub");
  if (isLiving && age !== null && age >= 30) reasons.push("living_article_30_days_without_update");
  if (articleType.includes("tracker") && age !== null && age >= 7) reasons.push("tracker_needs_freshness_check");
  if ((story.sourceLinks || []).length === 0) reasons.push("missing_source_links");
  if (Number.isFinite(Number(story.qaScore)) && Number(story.qaScore) < 85) reasons.push("qa_score_below_strong");
  return reasons;
}

function buildNewsroomOperatingReport() {
  const config = loadNewsroomOpsConfig();
  const stories = loadNewsroomStories();
  const configuredClusters = Array.isArray(config.topicClusters) ? config.topicClusters : [];
  const configuredTopics = Array.isArray(config.topics) ? config.topics : [];
  const configuredOpportunities = Array.isArray(config.storyOpportunities) ? config.storyOpportunities : [];
  const configuredTasks = Array.isArray(config.editorialTasks) ? config.editorialTasks : [];
  const configuredSources = Array.isArray(config.sources) ? config.sources : [];

  const articles = stories.map((story) => {
    const sourceCount = (story.sourceLinks || []).length;
    const staleReasons = newsroomStaleReasons(story);
    return {
      id: story.id,
      title: story.title,
      url: newsroomArticleUrl(story.id),
      category: story.category,
      articleType: story.articleType || story.type || "editorial",
      status: normalizedOpsStatus(story.editorialStatus || story.storyLifecycleState || story.status || "published", "published"),
      lifecycleState: normalizedOpsStatus(story.storyLifecycleState || story.editorialStatus || "published", "published"),
      clusterName: inferNewsroomCluster(story, configuredClusters),
      canonicalTopic: story.canonicalTopic || "",
      sourceCount,
      confidence: story.confidence || story.claimStatus || "Unlabeled",
      qaScore: Number.isFinite(Number(story.qaScore)) ? Number(story.qaScore) : null,
      qaBand: newsroomQaBand(story.qaScore),
      opportunityScore: Number.isFinite(Number(story.opportunityScore)) ? Number(story.opportunityScore) : null,
      livingArticle: Boolean(story.livingArticle),
      deepResearchUsed: Boolean(story.deepResearchUsed),
      lastUpdated: story.lastUpdated || story.publishedAt,
      daysSinceUpdate: daysSince(story.lastUpdated || story.publishedAt),
      updatePolicy: story.updatePolicy || story.updateFrequency || "",
      staleReasons,
      needsUpdate: staleReasons.length > 0 || normalizedOpsStatus(story.editorialStatus).includes("needs_update"),
    };
  });

  const clusterMap = new Map();
  configuredClusters.forEach((cluster) => {
    clusterMap.set(cluster.name, {
      id: cluster.id || `cluster-${slugify(cluster.name)}`,
      name: cluster.name,
      slug: cluster.slug || slugify(cluster.name),
      hubArticleId: cluster.hubArticleId || "",
      hubUrl: cluster.hubArticleId ? newsroomArticleUrl(cluster.hubArticleId) : "",
      status: cluster.clusterStatus || "emerging",
      priority: cluster.priority || "normal",
      evergreenValue: cluster.evergreenValue ?? null,
      nextRecommendedArticle: cluster.nextRecommendedArticle || "",
      missingIntents: Array.isArray(cluster.missingIntents) ? cluster.missingIntents : [],
      notes: cluster.notes || "",
      articleCount: 0,
      articles: [],
    });
  });

  articles.forEach((article) => {
    if (!clusterMap.has(article.clusterName)) {
      clusterMap.set(article.clusterName, {
        id: `cluster-${slugify(article.clusterName)}`,
        name: article.clusterName,
        slug: slugify(article.clusterName),
        hubArticleId: "",
        hubUrl: "",
        status: "emerging",
        priority: "normal",
        evergreenValue: null,
        nextRecommendedArticle: "",
        missingIntents: [],
        notes: "Inferred from current newsroom article metadata.",
        articleCount: 0,
        articles: [],
      });
    }
    const cluster = clusterMap.get(article.clusterName);
    cluster.articleCount += 1;
    cluster.articles.push({
      id: article.id,
      title: article.title,
      url: article.url,
      status: article.status,
      qaScore: article.qaScore,
      sourceCount: article.sourceCount,
    });
  });

  const opportunities = configuredOpportunities
    .map((story) => ({
      id: story.id,
      title: story.titleWorking || story.title || "Untitled opportunity",
      category: story.category || "News",
      score: Number(story.scoreCurrent || story.score || 0),
      scorePrevious: Number(story.scorePrevious || 0),
      scoreChange: Number(story.scoreChange || 0),
      recommendation: story.recommendation || "watch",
      lifecycleState: story.lifecycleState || "watching",
      articleType: story.articleTypeRecommended || "",
      updateOrNew: story.updateOrNew || "",
      existingArticleId: story.existingArticleId || "",
      existingArticleUrl: story.existingArticleId ? newsroomArticleUrl(story.existingArticleId) : "",
      cannibalizationRisk: story.cannibalizationRisk || "none",
      deepResearchRecommended: Boolean(story.deepResearchRecommended),
      recommendedAngle: story.recommendedAngle || "",
      headlineMode: story.headlineMode || "",
      primarySearchIntent: story.primarySearchIntent || "",
      scoreChangeReason: story.scoreChangeReason || "",
    }))
    .sort((a, b) => b.score - a.score);

  const autoTasks = articles
    .filter((article) => article.needsUpdate)
    .map((article) => ({
      id: `auto-refresh-${article.id}`,
      taskType: "refresh_stale_content",
      relatedStoryId: "",
      relatedArticleId: article.id,
      relatedArticleUrl: article.url,
      priority: article.staleReasons.includes("missing_source_links") ? "urgent" : "high",
      status: "queued",
      assignedTo: "GCX Newsroom",
      notes: `Auto-flagged: ${article.staleReasons.join(", ")}`,
    }));

  const editorialTasks = [
    ...configuredTasks.map((task) => ({
      ...task,
      relatedArticleUrl: task.relatedArticleId ? newsroomArticleUrl(task.relatedArticleId) : "",
    })),
    ...autoTasks,
  ];

  const summary = {
    articles: articles.length,
    clusters: clusterMap.size,
    sources: configuredSources.length,
    storyOpportunities: opportunities.length,
    writeNow: opportunities.filter((story) => story.recommendation === "write_now").length,
    needsUpdate: articles.filter((article) => article.needsUpdate).length,
    watching: opportunities.filter((story) => story.recommendation === "watch" || story.lifecycleState === "watching").length,
    deepResearch: opportunities.filter((story) => story.deepResearchRecommended).length,
    readyToPublish: articles.filter((article) => article.status === "ready").length,
    staleContent: articles.filter((article) => article.staleReasons.length > 0).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    version: config.version || "newsroom-os-v1",
    scoringWeights: config.scoringWeights || {},
    summary,
    topics: configuredTopics,
    clusters: Array.from(clusterMap.values()).sort((a, b) => (b.articleCount || 0) - (a.articleCount || 0) || String(a.name).localeCompare(String(b.name))),
    storyQueue: opportunities,
    articles: articles.sort((a, b) => Number(b.needsUpdate) - Number(a.needsUpdate) || (b.opportunityScore || 0) - (a.opportunityScore || 0)),
    sources: configuredSources,
    searchIntents: Array.isArray(config.searchIntents) ? config.searchIntents : [],
    articleRelationships: Array.isArray(config.articleRelationships) ? config.articleRelationships : [],
    liveEvents: Array.isArray(config.liveEvents) ? config.liveEvents : [],
    editorialTasks,
    guardrails: [
      "Final publication stays human-controlled.",
      "Do not upgrade rumors to fact.",
      "Do not create duplicate URLs when update_existing is the stronger editorial decision.",
      "Do not treat presale asking prices as settled market value.",
      "Reddit and social chatter are community signals, not factual confirmation.",
    ],
  };
}

function buildDataHealthReport() {
  const cardLibraries = [summarizePokemonHealth(), summarizeMagicHealth(), summarizeYugiohHealth()];
  const gameLibraries = summarizeGameLibraries();
  const consoleLibraries = [summarizeConsoleHealth()];
  const allLibraries = [...cardLibraries, ...gameLibraries, ...consoleLibraries];
  const providerReadiness = readJsonIfExists(path.join(gamesDataDir, "image-provider-readiness.json")) || null;
  const imageProvenance = readJsonIfExists(path.join(__dirname, "data", "launch-readiness", "game-image-provenance.json")) || null;
  const imageCoveragePlan = readJsonIfExists(path.join(gamesDataDir, "image-coverage-plan.json")) || null;
  const milestoneImageReviewBatches = readJsonIfExists(path.join(gamesDataDir, "milestone-image-review-batches.json")) || null;
  const overviewRewriteBatches = readJsonIfExists(path.join(gamesDataDir, "overview-rewrite-batches.json")) || null;
  const overviewQuality = readJsonIfExists(path.join(__dirname, "data", "launch-readiness", "game-overview-quality.json")) || null;
  const overviewImportFreshness = readJsonIfExists(path.join(__dirname, "data", "launch-readiness", "reviewed-overview-import-freshness.json")) || null;
  const overviewImportRepairQueue = readJsonIfExists(path.join(__dirname, "data", "launch-readiness", "overview-import-repair-queue.json")) || null;
  const overviewRereviewPacket = readJsonIfExists(path.join(__dirname, "data", "launch-readiness", "overview-rereview-packet.json")) || null;
  const imageReviewBatches = readJsonIfExists(path.join(gamesDataDir, "priority-image-review-batches.json")) || null;
  const finishableImageReviewBatches = readJsonIfExists(path.join(gamesDataDir, "finishable-image-review-batches.json")) || null;
  const imageReviewWorkplan = readJsonIfExists(path.join(__dirname, "data", "launch-readiness", "game-image-review-workplan.json")) || null;
  const workplanByPlatform = new Map(
    [...(imageReviewWorkplan?.priorityTargets || []), ...(imageReviewWorkplan?.finishableTargets || [])]
      .filter((target) => target.platformSlug)
      .map((target) => [target.platformSlug, target])
  );
  const withWorkplanContext = (batchesReport) => {
    if (!batchesReport?.batches) return batchesReport;
    return {
      ...batchesReport,
      batches: batchesReport.batches.map((batch) => ({
        ...batch,
        recentProviderAttempts: workplanByPlatform.get(batch.platformSlug)?.recentProviderAttempts || [],
        providerNextRecommended: workplanByPlatform.get(batch.platformSlug)?.providerNextRecommended || "",
      })),
    };
  };
  const totals = allLibraries.reduce(
    (summary, item) => {
      summary.records += item.total || 0;
      summary.images += item.images || 0;
      summary.missingImages += item.missingImages || 0;
      if (item.overviews !== null && item.overviews !== undefined) {
        summary.overviewEligible += item.total || 0;
        summary.overviews += item.overviews || 0;
        summary.missingOverviews += item.missingOverviews || 0;
      }
      if (item.status !== "healthy") summary.needsWork += 1;
      return summary;
    },
    { records: 0, images: 0, missingImages: 0, overviewEligible: 0, overviews: 0, missingOverviews: 0, needsWork: 0 }
  );

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      ...totals,
      imagePct: compactPercent(totals.images, totals.records),
      overviewPct: compactPercent(totals.overviews, totals.overviewEligible),
      libraryCount: allLibraries.length,
    },
    cards: cardLibraries,
    games: gameLibraries,
    consoles: consoleLibraries,
    imageProviderReadiness: providerReadiness,
    imageProvenance,
    imageCoveragePlan,
    milestoneImageReviewBatches,
    overviewRewriteBatches,
    overviewQuality,
    overviewImportFreshness,
    overviewImportRepairQueue,
    overviewRereviewPacket,
    imageReviewBatches: withWorkplanContext(imageReviewBatches),
    finishableImageReviewBatches: withWorkplanContext(finishableImageReviewBatches),
    imageReviewWorkplan,
    priority: [...allLibraries]
      .filter((item) => item.missingImages || item.missingOverviews)
      .sort((a, b) => (b.missingImages + (b.missingOverviews || 0)) - (a.missingImages + (a.missingOverviews || 0)))
      .slice(0, 12),
  };
}

function loadLocalPokemonData() {
  if (localPokemonData) return localPokemonData;

  const sets = readJsonIfExists(path.join(pokemonDataDir, "sets.json"));
  const cards = readJsonIfExists(path.join(pokemonDataDir, "cards.json"));
  const manifest = readJsonIfExists(path.join(pokemonDataDir, "manifest.json"));

  if (!Array.isArray(sets) || !Array.isArray(cards)) {
    return null;
  }

  localPokemonData = {
    sets,
    cards,
    manifest,
    cardById: new Map(cards.map((card) => [card.id, card])),
  };

  return localPokemonData;
}

function loadLocalMagicData() {
  if (localMagicData) return localMagicData;

  const sets = readJsonIfExists(path.join(magicDataDir, "sets.json"));
  const cards = readJsonIfExists(path.join(magicDataDir, "cards-search.json"));
  const manifest = readJsonIfExists(path.join(magicDataDir, "manifest.json"));

  if (!Array.isArray(sets) || !Array.isArray(cards)) {
    return null;
  }

  localMagicData = {
    sets,
    cards,
    manifest,
    setByCode: new Map(sets.map((set) => [set.code, set])),
  };

  return localMagicData;
}

function loadLocalYugiohData() {
  if (localYugiohData) return localYugiohData;

  const sets = readJsonIfExists(path.join(yugiohDataDir, "sets.json"));
  const cards = readJsonIfExists(path.join(yugiohDataDir, "cards-search.json"));
  const manifest = readJsonIfExists(path.join(yugiohDataDir, "manifest.json"));

  if (!Array.isArray(sets) || !Array.isArray(cards)) {
    return null;
  }

  localYugiohData = {
    sets,
    cards,
    manifest,
    setById: new Map(sets.map((set) => [set.id, set])),
  };

  return localYugiohData;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function normalizeCardIdentitySegment(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function cardSetCode(card = {}) {
  const nestedSet = card.set && typeof card.set === "object" ? card.set : {};
  return card.setCode || card.setId || nestedSet.id || nestedSet.code || (typeof card.set === "string" ? card.set : "") || card.setName || nestedSet.name || "";
}

function cardNumberDisplay(card = {}) {
  return card.cardNumberDisplay || card.cardNumber || card.collectorNumber || card.number || card.setCode || card.printingCode || "";
}

function cardVariantLabel(card = {}) {
  const values = [
    card.variant,
    card.rarity,
    card.setRarity,
    card.layout,
    ...(Array.isArray(card.finishes) ? card.finishes : []),
    ...(Array.isArray(card.subtypes) ? card.subtypes : []),
    card.isPromo || card.promo ? "promo" : "",
    card.isAlternateArt || card.variation ? "alternate-art" : "",
    card.isReverseHolo ? "reverse-holo" : "",
    card.isStamped ? "stamped" : "",
  ].filter(Boolean);

  return Array.from(new Set(values.map(normalizeCardIdentitySegment))).join(" / ");
}

function canonicalCardKey(card = {}, franchise = "tcg", options = {}) {
  const includeVariant = options.includeVariant !== false;
  return [
    normalizeCardIdentitySegment(franchise),
    normalizeCardIdentitySegment(cardSetCode(card)),
    normalizeCardIdentitySegment(cardNumberDisplay(card)),
    normalizeCardIdentitySegment(card.cardName || card.name || card.title),
    includeVariant ? normalizeCardIdentitySegment(cardVariantLabel(card)) : "",
    normalizeCardIdentitySegment(card.language || card.lang || "en"),
  ].join("|");
}

function firstCardImage(card = {}, franchise = "tcg", size = "large") {
  if (card.imageFront) return card.imageFront;
  if (card.imageThumbnail && size !== "large") return card.imageThumbnail;
  if (franchise === "pokemon") {
    return card.images?.large || card.images?.small || card.imageUrl || "";
  }
  if (franchise === "magic") {
    return card.imageUrl || card.imageUris?.normal || card.imageUris?.large || card.imageUris?.small || "";
  }
  if (franchise === "yugioh") {
    return card.imageUrl || card.imageSmallUrl || card.images?.normal || card.images?.small || card.cardImages?.[0]?.image_url || card.cardImages?.[0]?.image_url_small || "";
  }
  return card.imageUrl || "";
}

function firstCardThumbnail(card = {}, franchise = "tcg") {
  if (card.imageThumbnail) return card.imageThumbnail;
  if (franchise === "pokemon") return card.images?.small || card.images?.large || card.imageUrl || "";
  if (franchise === "magic") return card.imageUris?.small || card.imageUrl || "";
  if (franchise === "yugioh") return card.imageSmallUrl || card.images?.small || card.imageUrl || card.images?.normal || card.cardImages?.[0]?.image_url_small || "";
  return card.imageUrl || "";
}

function cardImageSource(card = {}, franchise = "tcg") {
  if (card.imageSource) return card.imageSource;
  if (franchise === "pokemon" && (card.images?.large || card.images?.small)) return "Pokemon TCG API";
  if (franchise === "magic" && (card.imageUrl || card.imageUris)) return "Scryfall";
  if (franchise === "yugioh" && (card.imageUrl || card.imageSmallUrl || card.images?.normal || card.images?.small || card.cardImages?.length)) return "YGOPRODeck";
  return "";
}

function cardImageCredit(card = {}, franchise = "tcg") {
  if (card.imageCredit) return card.imageCredit;
  if (franchise === "pokemon" && cardImageSource(card, franchise)) return "The Pokemon Company / Pokemon TCG API";
  if (franchise === "magic" && cardImageSource(card, franchise)) return "Wizards of the Coast / Scryfall";
  if (franchise === "yugioh" && cardImageSource(card, franchise)) return "Konami / YGOPRODeck";
  return "";
}

function enrichCardIdentity(card = {}, franchise = "tcg") {
  const imageFront = firstCardImage(card, franchise);
  const imageThumbnail = firstCardThumbnail(card, franchise);
  const setObject = card.set && typeof card.set === "object" ? card.set : {};
  const variant = card.variant || cardVariantLabel(card);
  const canonicalKey = card.canonicalKey || canonicalCardKey(card, franchise, { includeVariant: true });

  return {
    ...card,
    cardId: card.cardId || card.id || card.uuid || card.scryfallId || card.dbId || "",
    franchise: card.franchise || franchise,
    game: card.game || (franchise === "pokemon" ? "Pokemon TCG" : franchise === "magic" ? "Magic: The Gathering" : franchise === "yugioh" ? "Yu-Gi-Oh!" : "Trading Cards"),
    setCode: card.setCode || setObject.id || setObject.code || (typeof card.set === "string" ? card.set : "") || "",
    setName: card.setName || setObject.name || "",
    cardNumber: card.cardNumber || card.collectorNumber || card.number || card.setCode || "",
    cardNumberDisplay: cardNumberDisplay(card),
    cardName: card.cardName || card.name || card.title || "",
    variant,
    rarity: card.rarity || card.setRarity || "",
    language: card.language || card.lang || "en",
    releaseRegion: card.releaseRegion || card.region || "",
    productAssociation: card.productAssociation || "",
    imageFront,
    imageThumbnail,
    imageSource: cardImageSource(card, franchise),
    imageCredit: cardImageCredit(card, franchise),
    imageStatus: card.imageStatus || (imageFront ? "api-sourced-review-required" : "missing"),
    isPromo: Boolean(card.isPromo || card.promo),
    isReprint: Boolean(card.isReprint || card.reprint),
    isAlternateArt: Boolean(card.isAlternateArt || card.variation),
    isReverseHolo: Boolean(card.isReverseHolo),
    isStamped: Boolean(card.isStamped),
    canonicalKey,
  };
}

function dedupeCardsForResponse(cards = [], franchise = "tcg", options = {}) {
  const seen = new Map();
  const duplicates = [];
  const data = [];

  for (const rawCard of cards) {
    const card = enrichCardIdentity(rawCard, franchise);
    const key = card.canonicalKey || canonicalCardKey(card, franchise, options);
    if (!key.replace(/\|/g, "")) {
      data.push(card);
      continue;
    }
    if (seen.has(key)) {
      duplicates.push({ key, duplicateId: card.cardId || card.id || "", firstId: seen.get(key) });
      continue;
    }
    seen.set(key, card.cardId || card.id || key);
    data.push(card);
  }

  return { data, duplicates };
}

function cardApiPayload(cards = [], url, franchise = "tcg", paginator = paginateMagicItems) {
  const deduped = dedupeCardsForResponse(cards, franchise);
  const payload = paginator(deduped.data, url);
  if (deduped.duplicates.length) {
    payload.warnings = [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden by canonical card identity`];
  }
  return payload;
}

function safeText(value, maxLength = 500) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function isMarkdownTableSeparatorCell(value) {
  return /^:?-{3,}:?$/.test(
    String(value || "")
      .trim()
      .replace(/[\u2010-\u2015\u2212]/g, "-")
      .replace(/\s+/g, "")
  );
}

function repairFlattenedMarkdownTableRows(value) {
  const source = String(value || "");
  if (!source.includes("|") || source.includes("\n")) return source;

  const text = source.replace(/\u00a0/g, " ").replace(/&#x20;|&nbsp;/gi, " ");
  const firstPipeIndex = text.indexOf("|");
  const prelude = firstPipeIndex > 0 ? text.slice(0, firstPipeIndex).trim() : "";
  const tableText = firstPipeIndex > -1 ? text.slice(firstPipeIndex) : text;
  const cells = tableText
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  let separatorStart = -1;
  let separatorEnd = -1;
  for (let index = 0; index < cells.length; index += 1) {
    if (!isMarkdownTableSeparatorCell(cells[index])) continue;
    let end = index;
    while (end < cells.length && isMarkdownTableSeparatorCell(cells[end])) end += 1;
    if (end - index >= 2) {
      separatorStart = index;
      separatorEnd = end;
      break;
    }
    index = end;
  }

  if (separatorStart === -1) return source;
  const columnCount = separatorEnd - separatorStart;
  const headerStart = separatorStart - columnCount;
  if (headerStart < 0) return source;

  const headers = cells.slice(headerStart, separatorStart);
  const separators = cells.slice(separatorStart, separatorEnd);
  const beforeHeader = cells.slice(0, headerStart).join(" | ").trim();
  const rowCells = cells.slice(separatorEnd);
  const rows = [];
  for (let index = 0; index + columnCount <= rowCells.length; index += columnCount) {
    rows.push(rowCells.slice(index, index + columnCount));
  }
  if (!headers.length || !rows.length) return source;

  return [
    prelude || beforeHeader,
    `| ${headers.join(" | ")} |`,
    `| ${separators.join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeMarkdownTableText(value) {
  const normalized = repairFlattenedMarkdownTableRows(value)
    .replace(/\u00a0/g, " ")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/\u00e2\u20ac[\u201c\u201d]/g, "-")
    .replace(/\r\n?/g, "\n")
    .replace(/\s*\|\s*\|\s*(?=(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "|\n| ")
    .replace(/\s+\|\s*\|\s*(?=(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "\n| ")
    .replace(/\s+\|\s*\|(?=\s*(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "\n| ")
    .replace(/\|\s*\|(?=\s*(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "|\n| ");

  return canonicalizeMarkdownTableText(normalized);
}

function splitMarkdownTableCells(line) {
  return String(line || "")
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim().replace(/\s+/g, " "));
}

function isMarkdownTableSeparatorLine(line) {
  const cells = splitMarkdownTableCells(line).map((cell) =>
    cell.replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\s+/g, "")
  );
  return cells.length > 1 && cells.every(isMarkdownTableSeparatorCell);
}

function parseMarkdownTableBlock(value) {
  const lines = normalizeMarkdownTableText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const tableStart = lines.findIndex((line, index) => line.includes("|") && isMarkdownTableSeparatorLine(lines[index + 1] || ""));
  if (tableStart === -1) return null;

  const before = lines.slice(0, tableStart).join(" ").trim();
  const tableLines = [];
  let index = tableStart;
  while (index < lines.length && lines[index].includes("|")) {
    tableLines.push(lines[index]);
    index += 1;
  }
  const after = lines.slice(index).join(" ").trim();
  if (after || tableLines.length < 3 || !isMarkdownTableSeparatorLine(tableLines[1])) return null;

  const firstTableLine = tableLines[0] || "";
  const firstPipeIndex = firstTableLine.indexOf("|");
  if (firstPipeIndex > 0) tableLines[0] = firstTableLine.slice(firstPipeIndex).trim();

  const headers = splitMarkdownTableCells(tableLines[0]).filter(Boolean);
  const rows = tableLines
    .slice(2)
    .filter((line) => line.startsWith("|") && !isMarkdownTableSeparatorLine(line))
    .map(splitMarkdownTableCells)
    .map((row) => row.slice(0, headers.length))
    .filter((row) => row.some(Boolean));

  if (headers.length < 2 || !rows.length) return null;
  return {
    type: "table",
    caption: before,
    headers,
    rows,
  };
}

function canonicalizeMarkdownTableLines(lines) {
  if (lines.length < 2 || !isMarkdownTableSeparatorLine(lines[1])) return lines;
  const headers = splitMarkdownTableCells(lines[0]);
  const separatorCells = splitMarkdownTableCells(lines[1]).map((cell) => {
    const value = cell.replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\s+/g, "");
    const left = value.startsWith(":") ? ":" : "";
    const right = value.endsWith(":") ? ":" : "";
    return `${left}---${right}`;
  });
  const rows = lines
    .slice(2)
    .filter((line) => line.includes("|") && !isMarkdownTableSeparatorLine(line))
    .map(splitMarkdownTableCells);

  return [
    `| ${headers.join(" | ")} |`,
    `| ${separatorCells.join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ];
}

function canonicalizeMarkdownTableText(value) {
  const lines = String(value || "").split("\n");
  const tableStart = lines.findIndex((line, index) => line.includes("|") && isMarkdownTableSeparatorLine(lines[index + 1] || ""));
  if (tableStart === -1) return String(value || "");

  const beforeLines = lines.slice(0, tableStart).filter(Boolean);
  const tableLines = [];
  let index = tableStart;
  while (index < lines.length && lines[index].includes("|")) {
    tableLines.push(lines[index]);
    index += 1;
  }
  const afterLines = lines.slice(index).filter(Boolean);

  return [
    ...beforeLines,
    ...canonicalizeMarkdownTableLines(tableLines),
    ...afterLines,
  ].join("\n").trim();
}

function safeArticleBlock(value, maxLength = 5000) {
  if (isStructuredTableBlock(value)) {
    const headers = value.headers.map((cell) => safeText(cell, 220)).filter(Boolean);
    const rows = value.rows
      .filter(Array.isArray)
      .map((row) => row.map((cell) => safeText(cell, 700)).slice(0, headers.length))
      .filter((row) => row.some(Boolean));
    if (!headers.length || !rows.length) return "";
    return {
      type: "table",
      caption: safeText(value.caption || "", 300),
      headers,
      rows,
    };
  }
  const tableBlock = parseMarkdownTableBlock(value);
  if (tableBlock) return safeArticleBlock(tableBlock, maxLength);
  return normalizeMarkdownTableText(value)
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim()
    .slice(0, maxLength);
}

function safeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw, "http://localhost");
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    if (parsed.hostname === "localhost" && !/^https?:\/\//i.test(raw)) return raw.replace(/^\/+/, "");
    return parsed.toString();
  } catch (error) {
    return "";
  }
}

function publicProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    displayName: profile.displayName,
    handle: profile.handle,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    interests: profile.interests || [],
    joinedAt: profile.joinedAt,
    status: profile.status || "active",
  };
}

function isStaffProfile(profile) {
  return ["admin", "moderator"].includes(String(profile?.role || "").toLowerCase());
}

function activeSessions(sessions) {
  const now = Date.now();
  return (sessions || []).filter((session) => !session.expiresAt || new Date(session.expiresAt).getTime() > now);
}

function scrubLocalSession(session) {
  if (!session || typeof session !== "object") return session;
  const { token, ...safeSession } = session;
  return safeSession;
}

function capAccountSessions(sessions, accountId, limit = 5) {
  const accountSessions = activeSessions(sessions)
    .filter((session) => session.accountId === accountId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const keepIds = new Set(accountSessions.slice(0, limit).map((session) => session.id));
  return activeSessions(sessions)
    .filter((session) => session.accountId !== accountId || keepIds.has(session.id))
    .map(scrubLocalSession);
}

function normalizeEmailAddress(value) {
  return safeText(value, 254).toLowerCase();
}

function emailLooksValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || ""));
}

function validateDisplayName(value) {
  const displayName = safeText(value, 80);
  if (displayName.length < 2) return { ok: false, displayName, error: "Display name must be at least 2 characters." };
  if (!/^[\p{L}\p{N}][\p{L}\p{N}\s._'-]{0,78}[\p{L}\p{N}]$/u.test(displayName)) {
    return { ok: false, displayName, error: "Display name can use letters, numbers, spaces, periods, underscores, apostrophes, and hyphens." };
  }
  return { ok: true, displayName };
}

function validatePasswordStrength(password, email = "", displayName = "") {
  const value = String(password || "");
  if (value.length < 12) return { ok: false, error: "Password must be at least 12 characters." };
  if (value.length > 128) return { ok: false, error: "Password must be 128 characters or fewer." };
  if (/\s{2,}/.test(value)) return { ok: false, error: "Password cannot contain repeated spaces." };
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length;
  if (classes < 3) return { ok: false, error: "Password must mix at least 3 of these: uppercase, lowercase, numbers, and symbols." };
  const emailName = String(email || "").split("@")[0].toLowerCase();
  const lowered = value.toLowerCase();
  if (emailName && emailName.length >= 4 && lowered.includes(emailName)) return { ok: false, error: "Password cannot include the email name." };
  const nameParts = String(displayName || "").toLowerCase().split(/[^a-z0-9]+/).filter((part) => part.length >= 4);
  if (nameParts.some((part) => lowered.includes(part))) return { ok: false, error: "Password cannot include your display name." };
  const common = ["password", "letmein", "qwerty", "dragon", "pokemon", "charizard", "nintendo", "playstation", "xbox", "gcxnerds"];
  if (common.some((term) => lowered.includes(term))) return { ok: false, error: "Password is too easy to guess." };
  return { ok: true };
}

function authEmailRateLimit(req, action, email, limit = 5, windowMs = 1000 * 60 * 30) {
  const emailKey = normalizeEmailAddress(email).replace(/[^a-z0-9@._-]/g, "").slice(0, 120) || "unknown";
  return rateLimit(req, `auth-${action}:${emailKey}`, limit, windowMs);
}

async function requireStaff(req, res, data, action = "perform this action") {
  const auth = await authenticatedAccount(req, data);
  if (!auth) {
    sendJson(res, 401, { error: `Log in to ${action}.` });
    return null;
  }
  const email = String(auth.account?.email || auth.user?.email || "").toLowerCase();
  if (!isStaffProfile(auth.profile) && !localAdminEmails().has(email)) {
    sendJson(res, 403, { error: "Moderator or admin access is required." });
    return null;
  }
  return auth;
}

async function requireAuth(req, res, data, action = "perform this action") {
  const auth = await authenticatedAccount(req, data);
  if (!auth) {
    sendJson(res, 401, { error: `Log in to ${action}.` });
    return null;
  }
  return auth;
}

function supabaseProfileRowToLocal(profile, user = {}) {
  if (!profile && !user?.id) return null;
  const emailName = String(user.email || "").split("@")[0] || "GCX Member";
  const displayName = profile?.display_name || user.user_metadata?.displayName || user.user_metadata?.display_name || emailName;
  return {
    id: profile?.id || user.id,
    displayName,
    handle: profile?.handle || `@${slugify(displayName) || "member"}`,
    bio: profile?.bio || "GCX member ready to talk games, cards, and collecting.",
    avatarUrl:
      profile?.avatar_url ||
      user.user_metadata?.avatarUrl ||
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
    interests: Array.isArray(profile?.interests) ? profile.interests : ["games", "cards"],
    role: profile?.role || "member",
    joinedAt: profile?.created_at || user.created_at || new Date().toISOString(),
    status: profile?.status || "active",
  };
}

async function loadSupabaseProfile(userId) {
  const rows = await supabaseRequest(`profiles?id=eq.${encodePostgrestValue(userId)}&select=*&limit=1`, {
    method: "GET",
    headers: { Prefer: "" },
  });
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function upsertSupabaseProfile(user, values = {}) {
  if (!user?.id) return null;
  const displayName = safeText(values.displayName || user.user_metadata?.displayName || user.user_metadata?.display_name || String(user.email || "").split("@")[0] || "GCX Member", 80);
  const handleRoot = slugify(values.handle || displayName) || "member";
  const [profile] =
    (await supabaseRequest(`profiles?on_conflict=id&select=*`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify([
        {
          id: user.id,
          display_name: displayName,
          handle: `@${handleRoot}-${String(user.id).slice(0, 8)}`,
          avatar_url: safeUrl(values.avatarUrl) || "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
          bio: safeText(values.bio || "GCX member ready to talk games, cards, and collecting.", 240),
          interests: Array.isArray(values.interests) ? values.interests.map((interest) => safeText(interest, 32)).filter(Boolean).slice(0, 5) : ["games", "cards"],
          role: "member",
          status: "active",
        },
      ]),
    })) || [];
  return profile || loadSupabaseProfile(user.id);
}

function syncSupabaseProfileToLocal(data, user, supabaseProfile) {
  const profile = supabaseProfileRowToLocal(supabaseProfile, user);
  if (!profile) return null;
  const index = data.profiles.findIndex((item) => item.id === profile.id);
  if (index === -1) {
    data.profiles.unshift(profile);
    saveCommunityData(data);
    return profile;
  }
  data.profiles[index] = {
    ...data.profiles[index],
    ...profile,
  };
  saveCommunityData(data);
  return data.profiles[index];
}

function supabaseAccountPayload(user, profile) {
  return {
    accountId: user?.id || "",
    email: user?.email || "",
    profile: publicProfile(profile),
  };
}

function passwordHash(password, salt) {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function passwordHashV2(password, salt, iterations = 210000) {
  return crypto.pbkdf2Sync(String(password || ""), salt, iterations, 32, "sha256").toString("hex");
}

function localPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 210000;
  return {
    passwordAlgorithm: "pbkdf2-sha256",
    passwordIterations: iterations,
    passwordSalt: salt,
    passwordHash: passwordHashV2(password, salt, iterations),
  };
}

function verifyLocalPassword(password, account = {}) {
  if (account.passwordAlgorithm === "pbkdf2-sha256") {
    const expected = Buffer.from(String(account.passwordHash || ""), "hex");
    const actual = Buffer.from(passwordHashV2(password, account.passwordSalt, Number(account.passwordIterations || 210000)), "hex");
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
  const expected = Buffer.from(String(account.passwordHash || ""), "hex");
  const actual = Buffer.from(passwordHash(password, account.passwordSalt), "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function sessionTokenHash(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function accountPublicPayload(data, account) {
  const profile = data.profiles.find((item) => item.id === account?.profileId);
  return {
    accountId: account?.id || "",
    email: account?.email || "",
    profile: publicProfile(profile),
  };
}

function authHeaderToken(req) {
  const raw = String(req.headers["x-gcx-session"] || req.headers.authorization || "").trim();
  return raw.replace(/^Bearer\s+/i, "");
}

function createModerationReport(data, report) {
  data.moderationReports = Array.isArray(data.moderationReports) ? data.moderationReports : [];
  const targetType = safeText(report.targetType, 40);
  const targetId = safeText(report.targetId, 160);
  const reporterProfileId = safeText(report.reporterProfileId, 120);
  const existing = data.moderationReports.find(
    (item) =>
      item.reporterProfileId === reporterProfileId &&
      item.targetType === targetType &&
      item.targetId === targetId &&
      !["resolved", "dismissed"].includes(item.status || "open")
  );
  if (existing) return { report: existing, duplicate: true };
  const created = {
    id: `moderation-report-${Date.now()}-${slugify(`${targetType}-${targetId}`) || "content"}`,
    reporterProfileId,
    targetType,
    targetId,
    reason: safeText(report.reason || "Community report", 240),
    status: "open",
    createdAt: new Date().toISOString(),
  };
  data.moderationReports.unshift(created);
  data.moderationReports = data.moderationReports.slice(0, 1000);
  return { report: created, duplicate: false };
}

function requestOrigin(req) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${port}`;
  return `${protocol}://${host}`;
}

function publicSiteOrigin() {
  const configured = String(process.env.GCX_SITE_URL || process.env.SITE_URL || "https://gcxnerds.com").trim();
  return configured.replace(/\/+$/, "");
}

async function authenticatedAccount(req, data) {
  const token = authHeaderToken(req);
  if (!token) return null;

  if (supabaseAuthEnabled()) {
    try {
      const user = await supabaseAuthRequest("user", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!user?.id || !user?.email) return null;
      const supabaseProfile = await loadSupabaseProfile(user.id);
      const profile = syncSupabaseProfileToLocal(data, user, supabaseProfile);
      if (!profile || (profile.status || "active") !== "active") return null;
      return {
        account: { id: user.id, email: user.email, profileId: profile.id, status: "active" },
        profile,
        session: { token },
        user,
      };
    } catch (error) {
      return null;
    }
  }

  const tokenHash = sessionTokenHash(token);
  const session = (data.sessions || []).find(
    (item) =>
      item.tokenHash === tokenHash &&
      (!item.expiresAt || new Date(item.expiresAt) > new Date())
  );
  if (!session) return null;
  const account = (data.accounts || []).find((item) => item.id === session.accountId && (item.status || "active") === "active");
  if (!account) return null;
  const profile = data.profiles.find((item) => item.id === account.profileId && (item.status || "active") === "active");
  if (!profile) return null;
  return { account, profile, session };
}

function readRequestJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100000) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

const syntheticCommunityRecordPatterns = [
  /gcx-smoke-member/i,
  /codex-smoke/i,
  /codex test member/i,
  /profile-codex-test/i,
  /signed-in smoke test/i,
  /rls smoke test/i,
  /profile-rls-smoke/i,
  /supabase index test/i,
  /supabase route test/i,
  /profile-supabase-/i,
  /audit-co/i,
  /audit lead/i,
  /audit@example\.com/i,
  /codex\.audit\+/i,
  /gcx-audit/i,
  /gcx-autonomous/i,
  /autonomous-smoke/i,
  /audit-smoke/i,
  /autonomous smoke/i,
  /smoke test charizard/i,
  /audit test item/i,
  /route-smoke/i,
  /route smoke/i,
  /launch-hardening/i,
  /launch auth check/i,
  /launchauthcheck/i,
  /launch-auth-check/i,
  /launch-admin-verify/i,
  /verification report reason/i,
  /verification beta card/i,
  /verification audit beta card/i,
  /verify-card/i,
];

function isSyntheticCommunityRecord(item) {
  const text = JSON.stringify(item || {});
  return syntheticCommunityRecordPatterns.some((pattern) => pattern.test(text));
}

function cleanCommunityArray(value) {
  return Array.isArray(value) ? value.filter((item) => !isSyntheticCommunityRecord(item)) : [];
}

function validLocalSessions(sessions, accounts) {
  const accountIds = new Set((accounts || []).map((account) => account.id).filter(Boolean));
  return activeSessions(cleanCommunityArray(sessions))
    .filter((session) => session.accountId && accountIds.has(session.accountId) && session.tokenHash)
    .map(scrubLocalSession);
}

function betaSafeMarketplaceText(value) {
  return String(value ?? "")
    .replace(/Card Trading Marketplace Sponsor/gi, "Card Collector Marketplace Beta Sponsor")
    .replace(/Card trading marketplace sponsor/gi, "Card collector marketplace beta sponsor")
    .replace(/marketplace listing boosts?/gi, "marketplace beta trust placements")
    .replace(/Marketplace Finds/gi, "Marketplace Watchlists")
    .replace(/Buying, selling, trading/gi, "Marketplace beta watchlists")
    .replace(/listing boosts?/gi, "beta waitlist feedback")
    .replace(/seller-fee direction/gi, "marketplace beta waitlist")
    .replace(/seller-fee discounts?/gi, "marketplace-beta campaign credits")
    .replace(/Pokemon trades/gi, "Pokemon collecting")
    .replace(/trade offers/gi, "binder updates")
    .replace(/trading finds/gi, "marketplace watchlists")
    .replace(/trade-night/gi, "collector-night")
    .replace(/trade nights/gi, "collector nights")
    .replace(/fair trade conversation/gi, "market-context conversation")
    .replace(/low-fee Pokemon card exchange planning/gi, "Pokemon card marketplace-beta planning")
    .replace(/future traders/gi, "future marketplace-watchlist members")
    .replace(/future trading paths/gi, "beta waitlist paths")
    .replace(/trading path/gi, "beta waitlist path")
    .replace(/listing options/gi, "beta waitlist tools")
    .replace(/exchange listings/gi, "collector watchlists");
}

function betaSafeCommunityItem(item, fields) {
  if (!item || typeof item !== "object") return item;
  const next = { ...item };
  fields.forEach((field) => {
    if (typeof next[field] === "string") next[field] = betaSafeMarketplaceText(next[field]);
  });
  if (Array.isArray(next.keywords)) next.keywords = next.keywords.map((keyword) => betaSafeMarketplaceText(keyword));
  if (Array.isArray(next.tags)) next.tags = next.tags.map((tag) => betaSafeMarketplaceText(tag));
  return next;
}

function betaSafeCampaign(campaign = {}) {
  const next = betaSafeCommunityItem(campaign, ["sponsorPackage"]);
  if (Array.isArray(next.revenueIdeas)) next.revenueIdeas = next.revenueIdeas.map((idea) => betaSafeMarketplaceText(idea));
  return next;
}

function normalizeCommunityData(data = {}) {
  const accounts = cleanCommunityArray(Array.isArray(data.accounts) ? data.accounts : []);
  return {
    accounts,
    sessions: validLocalSessions(data.sessions, accounts),
    profiles: cleanCommunityArray(data.profiles),
    follows: Array.isArray(data.follows) ? data.follows : [],
    savedPosts: Array.isArray(data.savedPosts) ? data.savedPosts : [],
    friendships: Array.isArray(data.friendships) ? data.friendships : [],
    messageThreads: Array.isArray(data.messageThreads) ? data.messageThreads : [],
    messages: Array.isArray(data.messages) ? data.messages : [],
    events: Array.isArray(data.events) ? data.events.map((item) => betaSafeCommunityItem(item, ["title", "type", "description", "body"])) : [],
    eventRsvps: Array.isArray(data.eventRsvps) ? data.eventRsvps : [],
    groups: Array.isArray(data.groups) ? data.groups.map((item) => betaSafeCommunityItem(item, ["name", "category", "description"])) : [],
    groupMemberships: Array.isArray(data.groupMemberships) ? data.groupMemberships : [],
    activity: cleanCommunityArray(data.activity),
    notifications: cleanCommunityArray(data.notifications),
    topics: Array.isArray(data.topics) ? data.topics.map((item) => betaSafeCommunityItem(item, ["label", "description"])) : [],
    posts: cleanCommunityArray(data.posts).map((item) => betaSafeCommunityItem(item, ["title", "body", "category"])),
    comments: cleanCommunityArray(data.comments).map((item) => betaSafeCommunityItem(item, ["body"])),
    newsComments: cleanCommunityArray(data.newsComments).map((item) => betaSafeCommunityItem(item, ["body"])),
    moderationReports: cleanCommunityArray(data.moderationReports),
    streamers: Array.isArray(data.streamers) ? data.streamers : [],
    streamingSpotlight: Array.isArray(data.streamingSpotlight) ? data.streamingSpotlight : [],
    nominations: Array.isArray(data.nominations) ? data.nominations : [],
    spotlightHistory: Array.isArray(data.spotlightHistory) ? data.spotlightHistory : [],
    trafficEvents: Array.isArray(data.trafficEvents) ? data.trafficEvents : [],
    sponsorLeads: cleanCommunityArray(data.sponsorLeads).map((item) => betaSafeCommunityItem(item, ["goal", "packageInterest"])),
    newsletterSubscriptions: cleanCommunityArray(data.newsletterSubscriptions),
    collectorWaitlist: cleanCommunityArray(data.collectorWaitlist),
    promotions: Array.isArray(data.promotions)
      ? data.promotions.map((item) => betaSafeCommunityItem(item, ["title", "body", "ctaLabel", "packageType", "sponsorName"]))
      : [],
    campaign: betaSafeCampaign(data.campaign || {}),
  };
}

function loadCommunityData() {
  const mtimeMs = fs.existsSync(communityDataPath) ? fs.statSync(communityDataPath).mtimeMs : 0;
  const shouldReload = !communityDataCache || mtimeMs !== communityDataCacheMtimeMs;
  const data = shouldReload ? readJsonIfExists(communityDataPath) || {} : communityDataCache;
  const normalizedData = normalizeCommunityData(data);
  communityDataCache = normalizedData;
  communityDataCacheMtimeMs = mtimeMs;
  return normalizedData;
}

function saveCommunityData(data) {
  const normalizedData = normalizeCommunityData(data);
  writeJson(communityDataPath, normalizedData);
  communityDataCache = normalizedData;
  communityDataCacheMtimeMs = fs.existsSync(communityDataPath) ? fs.statSync(communityDataPath).mtimeMs : Date.now();
  queueCommunitySupabaseSync(normalizedData);
}

function communityRecordRows(data) {
  return Object.entries(data).flatMap(([key, value]) => {
    if (!Array.isArray(value)) return [];
    return value.map((item, index) => ({
      collection: `community_${key}`,
      record_id: String(item.id || `${key}-${index}`),
      title: item.title || item.displayName || item.name || item.email || item.id || "",
      platform: "",
      category: item.category || item.type || "",
      source_path: "data/community.json",
      data: item,
      updated_at: new Date().toISOString(),
    }));
  });
}

async function upsertSupabaseRows(table, rows, batchSize = 200) {
  for (let index = 0; index < rows.length; index += batchSize) {
    await supabaseRequest(table, {
      method: "POST",
      body: JSON.stringify(rows.slice(index, index + batchSize)),
    });
  }
}

async function loadSupabaseRowsBySourcePath(sourcePath) {
  if (!supabaseConfigured()) return null;
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const page = await supabaseRequest(
      `gcx_records?source_path=eq.${encodePostgrestValue(sourcePath)}&select=data&limit=${pageSize}&offset=${offset}`,
      {
        method: "GET",
        headers: { Prefer: "" },
      }
    );
    if (!Array.isArray(page) || !page.length) break;
    rows.push(...page.map((row) => row.data));
    if (page.length < pageSize) break;
  }
  return rows.length ? rows : null;
}

async function loadSupabaseDataFile(sourcePath) {
  if (!supabaseConfigured()) return null;
  const rows = await supabaseRequest(`gcx_data_files?path=eq.${encodePostgrestValue(sourcePath)}&select=content&limit=1`, {
    method: "GET",
    headers: { Prefer: "" },
  });
  const content = Array.isArray(rows) ? rows[0]?.content : null;
  if (!content || content.skippedRawContent) return null;
  return content;
}

async function sendSupabaseJsonFile(req, res, requestPath) {
  if (!supabaseConfigured() || req.method !== "GET" || !requestPath.startsWith("/data/") || !requestPath.endsWith(".json")) return false;
  const sourcePath = requestPath.replace(/^\/+/, "");

  try {
    const records = await loadSupabaseRowsBySourcePath(sourcePath);
    if (records) {
      sendJson(res, 200, records, { "X-GCX-Data-Source": "supabase-records" });
      return true;
    }

    const content = await loadSupabaseDataFile(sourcePath);
    if (content) {
      sendJson(res, 200, content, { "X-GCX-Data-Source": "supabase-file" });
      return true;
    }
  } catch (error) {
    console.warn(`Supabase data file read failed for ${sourcePath}: ${error.message}`);
  }

  return false;
}

function paginateFromUrl(url, defaultPageSize = 40, maxPageSize = 250) {
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(url.searchParams.get("pageSize") || defaultPageSize)));
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}

async function loadSupabaseCollection(collection, url, options = {}) {
  if (!supabaseConfigured()) return null;
  const { page, pageSize, offset } = paginateFromUrl(url, options.defaultPageSize || 40, options.maxPageSize || 250);
  const query = safeText(url.searchParams.get("q") || "", 160);
  const filters = [`collection=eq.${encodePostgrestValue(collection)}`, "select=data"];
  if (query) filters.push(`title=ilike.*${encodePostgrestValue(query)}*`);
  filters.push(`order=title.asc`);
  filters.push(`limit=${pageSize}`);
  filters.push(`offset=${offset}`);
  const rows = await supabaseRequest(`gcx_records?${filters.join("&")}`, {
    method: "GET",
    headers: { Prefer: "" },
  });
  if (!Array.isArray(rows)) return null;
  return {
    data: rows.map((row) => row.data),
    page,
    pageSize,
    count: rows.length,
    totalCount: rows.length < pageSize ? offset + rows.length : null,
  };
}

async function loadSupabaseRecord(collection, recordId) {
  if (!supabaseConfigured()) return null;
  const rows = await supabaseRequest(
    `gcx_records?collection=eq.${encodePostgrestValue(collection)}&record_id=eq.${encodePostgrestValue(recordId)}&select=data&limit=1`,
    {
      method: "GET",
      headers: { Prefer: "" },
    }
  );
  return Array.isArray(rows) ? rows[0]?.data || null : null;
}

const gamePlatformSlugs = new Set([
  "3ds",
  "dreamcast",
  "ds",
  "gameboy",
  "gamecube",
  "gba",
  "genesis",
  "n64",
  "nes",
  "ps1",
  "ps2",
  "ps3",
  "ps4",
  "ps5",
  "psp",
  "saturn",
  "snes",
  "switch",
  "switch2",
  "vita",
  "wii",
  "xbox",
  "xbox360",
]);

function loadLocalGameRecord(platformSlug, recordId) {
  if (!gamePlatformSlugs.has(platformSlug) || !recordId) return null;
  const dataPath = path.join(gamesDataDir, `${platformSlug}.json`);
  if (!fs.existsSync(dataPath)) return null;
  const records = readJsonIfExists(dataPath) || [];
  if (!Array.isArray(records)) return null;
  return records.find((record) => record.id === recordId) || null;
}

async function handleGameDetailApi(req, res, url) {
  const match = url.pathname.match(/^\/api\/games\/([^/]+)\/([^/]+)$/);
  if (!match) return false;

  const platformSlug = decodeURIComponent(match[1]).toLowerCase();
  const recordId = decodeURIComponent(match[2]);
  if (!gamePlatformSlugs.has(platformSlug)) {
    sendJson(res, 404, { error: "Game platform not found." });
    return true;
  }

  try {
    const supabaseRecord = await loadSupabaseRecord(`game_${platformSlug}`, recordId);
    if (supabaseRecord) {
      sendJson(res, 200, { data: supabaseRecord }, { "X-GCX-Data-Source": "supabase-records" });
      return true;
    }
  } catch (error) {
    console.warn(`Supabase game detail fallback for ${platformSlug}/${recordId}: ${error.message}`);
  }

  const localRecord = loadLocalGameRecord(platformSlug, recordId);
  if (!localRecord) {
    sendJson(res, 404, { error: "Game not found." });
    return true;
  }

  sendJson(res, 200, { data: localRecord }, { "X-GCX-Data-Source": "local" });
  return true;
}

const imageProxyAllowedHosts = new Set(["download.xbox.com", "minecraft.net"]);

function imageProxySignature(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return "";
}

async function handleImageProxy(req, res, url) {
  if (url.pathname !== "/api/image-proxy") return false;
  const rawUrl = url.searchParams.get("url") || "";
  let imageUrl;
  try {
    imageUrl = new URL(rawUrl);
  } catch {
    sendJson(res, 400, { error: "A valid image URL is required." });
    return true;
  }

  const host = imageUrl.hostname.replace(/^www\./i, "").toLowerCase();
  if (!imageProxyAllowedHosts.has(host) || !["http:", "https:"].includes(imageUrl.protocol)) {
    sendJson(res, 403, { error: "Image host is not allowlisted for proxying." });
    return true;
  }

  try {
    const response = await fetch(imageUrl.href, {
      redirect: "follow",
      headers: { "User-Agent": "GamesCardsExchange/0.1 local image proxy" },
    });
    if (!response.ok) {
      sendJson(res, 502, { error: "Image source did not respond successfully." });
      return true;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = String(response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const signatureType = imageProxySignature(bytes);
    const type = contentType.startsWith("image/") ? contentType : signatureType;
    if (!type || !signatureType) {
      sendJson(res, 415, { error: "Proxied source did not return an image." });
      return true;
    }

    sendBinary(res, 200, bytes, type, {
      "X-GCX-Image-Proxy": host,
    });
    return true;
  } catch (error) {
    sendJson(res, 502, { error: "Image source could not be proxied." });
    return true;
  }
}

async function handleSupabasePokemonData(req, res, url) {
  const route = url.pathname.replace(/^\/api\/pokemon\/?/, "");
  try {
    if (route === "manifest") {
      const content = await loadSupabaseDataFile("data/pokemon/manifest.json");
      if (content) {
        sendJson(res, 200, content, { "X-GCX-Data-Source": "supabase-file" });
        return true;
      }
    }
    if (route === "sets") {
      const result = await loadSupabaseCollection("pokemon_sets", url, { defaultPageSize: 250, maxPageSize: 10000 });
      if (result) {
        sendJson(res, 200, result, { "X-GCX-Data-Source": "supabase-records" });
        return true;
      }
    }
    if (route === "cards") {
      const result = await loadSupabaseCollection("pokemon_cards", url, { defaultPageSize: 250, maxPageSize: 250 });
      if (result?.data?.length || !url.searchParams.get("q")) {
        if (Array.isArray(result?.data)) {
          const deduped = dedupeCardsForResponse(result.data, "pokemon");
          result.data = deduped.data;
          result.count = deduped.data.length;
          if (deduped.duplicates.length) {
            result.warnings = [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden by canonical card identity`];
          }
        }
        sendJson(res, 200, result, { "X-GCX-Data-Source": "supabase-records" });
        return true;
      }
    }
    if (route.startsWith("cards/")) {
      const card = await loadSupabaseRecord("pokemon_cards", decodeURIComponent(route.slice("cards/".length)));
      if (card) {
        sendJson(res, 200, { data: enrichCardIdentity(card, "pokemon") }, { "X-GCX-Data-Source": "supabase-records" });
        return true;
      }
    }
  } catch (error) {
    console.warn(`Supabase Pokemon API fallback: ${error.message}`);
  }
  return false;
}

async function handleSupabaseMagicData(req, res, url) {
  const route = url.pathname.replace(/^\/api\/magic\/?/, "");
  try {
    if (route === "manifest") {
      const content = await loadSupabaseDataFile("data/magic/manifest.json");
      if (content) {
        sendJson(res, 200, content, { "X-GCX-Data-Source": "supabase-file" });
        return true;
      }
    }
    if (route === "sets") {
      const records = await loadSupabaseRowsBySourcePath("data/magic/sets.json");
      if (records) {
        sendJson(res, 200, paginateMagicItems(records, url), { "X-GCX-Data-Source": "supabase-records" });
        return true;
      }
    }
    if (route === "cards") {
      const result = await loadSupabaseCollection("magic_cards", url, { defaultPageSize: 40, maxPageSize: 100 });
      if (result?.data?.length || !url.searchParams.get("q")) {
        if (Array.isArray(result?.data)) {
          const deduped = dedupeCardsForResponse(result.data, "magic");
          result.data = deduped.data;
          result.count = deduped.data.length;
          if (deduped.duplicates.length) {
            result.warnings = [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden by canonical card identity`];
          }
        }
        sendJson(res, 200, result, { "X-GCX-Data-Source": "supabase-records" });
        return true;
      }
    }
    if (route.startsWith("sets/")) {
      const setCode = decodeURIComponent(route.slice("sets/".length)).toLowerCase();
      const records = await loadSupabaseRowsBySourcePath(`data/magic/cards-by-set/${setCode}.json`);
      if (records) {
        const deduped = dedupeCardsForResponse(records, "magic");
        sendJson(
          res,
          200,
          {
            data: deduped.data,
            count: deduped.data.length,
            totalCount: deduped.data.length,
            warnings: deduped.duplicates.length ? [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden by canonical card identity`] : [],
          },
          { "X-GCX-Data-Source": "supabase-records" }
        );
        return true;
      }
    }
  } catch (error) {
    console.warn(`Supabase Magic API fallback: ${error.message}`);
  }
  return false;
}

async function handleSupabaseYugiohData(req, res, url) {
  const route = url.pathname.replace(/^\/api\/yugioh\/?/, "");
  try {
    if (route === "manifest") {
      const content = await loadSupabaseDataFile("data/yugioh/manifest.json");
      if (content) {
        sendJson(res, 200, content, { "X-GCX-Data-Source": "supabase-file" });
        return true;
      }
    }
    if (route === "sets") {
      const records = await loadSupabaseRowsBySourcePath("data/yugioh/sets.json");
      if (records) {
        sendJson(res, 200, paginateYugiohItems(records, url), { "X-GCX-Data-Source": "supabase-records" });
        return true;
      }
    }
    if (route === "cards") {
      const result = await loadSupabaseCollection("yugioh_cards", url, { defaultPageSize: 40, maxPageSize: 100 });
      if (result?.data?.length || !url.searchParams.get("q")) {
        if (Array.isArray(result?.data)) {
          const deduped = dedupeCardsForResponse(result.data, "yugioh");
          result.data = deduped.data;
          result.count = deduped.data.length;
          if (deduped.duplicates.length) {
            result.warnings = [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden by canonical card identity`];
          }
        }
        sendJson(res, 200, result, { "X-GCX-Data-Source": "supabase-records" });
        return true;
      }
    }
    if (route.startsWith("sets/")) {
      const setId = decodeURIComponent(route.slice("sets/".length)).toLowerCase();
      const records = await loadSupabaseRowsBySourcePath(`data/yugioh/cards-by-set/${setId}.json`);
      if (records) {
        const deduped = dedupeCardsForResponse(records, "yugioh");
        sendJson(
          res,
          200,
          {
            data: deduped.data,
            count: deduped.data.length,
            totalCount: deduped.data.length,
            warnings: deduped.duplicates.length ? [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden by canonical card identity`] : [],
          },
          { "X-GCX-Data-Source": "supabase-records" }
        );
        return true;
      }
    }
  } catch (error) {
    console.warn(`Supabase Yu-Gi-Oh API fallback: ${error.message}`);
  }
  return false;
}

async function syncCommunityDataToSupabase(data) {
  if (!supabaseConfigured()) return;
  await upsertSupabaseRows("gcx_data_files", [
    {
      path: "data/community.json",
      kind: "json",
      file_size_bytes: Buffer.byteLength(JSON.stringify(data), "utf8"),
      content: data,
      updated_at: new Date().toISOString(),
    },
  ]);
  await supabaseRequest(`gcx_records?source_path=eq.${encodePostgrestValue("data/community.json")}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  const rows = communityRecordRows(data);
  if (rows.length) await upsertSupabaseRows("gcx_records", rows);
}

function newsletterSupabaseRow(subscription) {
  return {
    email: subscription.email,
    status: subscription.status || "subscribed",
    source_page: subscription.sourcePage || "",
    referrer: subscription.referrer || "",
    consent_version: subscription.consentVersion || "gcx-launch-v1",
    interest_category: subscription.interestCategory || "daily-brief",
    created_at: supabaseTimestamp(subscription.createdAt),
    updated_at: supabaseTimestamp(subscription.updatedAt || subscription.createdAt),
  };
}

function collectorWaitlistSupabaseRow(record) {
  return {
    profile_id: uuidOrNull(record.profileId),
    item: record.item || "",
    intent: record.intent || "Marketplace beta interest",
    status: record.status || "new",
    source_page: record.sourcePage || "",
    referrer: record.referrer || "",
    consent_version: record.consentVersion || "gcx-marketplace-beta-v1",
    created_at: supabaseTimestamp(record.createdAt),
    updated_at: supabaseTimestamp(record.updatedAt || record.createdAt),
  };
}

function marketplaceIntentValue(value) {
  const text = normalize(value);
  if (text.includes("sell")) return "sell";
  if (text.includes("trade")) return "trade";
  if (text.includes("buy") || text.includes("want")) return "buy";
  if (text.includes("watch")) return "watch";
  return "watch";
}

function marketplaceIntentSupabaseRow(record) {
  return {
    local_id: record.id || "",
    profile_id: uuidOrNull(record.profileId),
    item_title: record.item || record.itemTitle || "Collector marketplace interest",
    item_type: record.itemType || "card",
    source_id: record.sourceId || "",
    intent: marketplaceIntentValue(record.intent),
    status: record.status === "archived" ? "archived" : "waitlist",
    safety_note: record.safetyNote || "Marketplace beta only. No listing, payment, or trade is live.",
    created_at: supabaseTimestamp(record.createdAt),
    updated_at: supabaseTimestamp(record.updatedAt || record.createdAt),
  };
}

function sponsorLeadSupabaseRow(lead) {
  return {
    local_id: lead.id || "",
    name: lead.name,
    email: lead.email,
    company: lead.company,
    package_interest: lead.packageInterest || "",
    budget_range: lead.budgetRange || "",
    goal: lead.goal || "",
    source: lead.source || "",
    ref: lead.ref || "",
    status: lead.status || "new",
    created_at: supabaseTimestamp(lead.createdAt),
    updated_at: supabaseTimestamp(lead.updatedAt || lead.createdAt),
  };
}

function sponsorPromotionSupabaseRow(promotion) {
  return {
    local_id: promotion.id || "",
    sponsor_name: promotion.sponsorName || "",
    title: promotion.title || "",
    body: promotion.body || "",
    image_url: promotion.imageUrl || "",
    destination_url: promotion.destinationUrl || "",
    placement: promotion.placement || "community-feed",
    package_type: promotion.packageType || "",
    cta_label: promotion.ctaLabel || "Open sponsor offer",
    priority: Number(promotion.priority || 1),
    status: promotion.status || "draft",
    clicks: Number(promotion.clicks || 0),
    starts_at: promotion.startsAt ? supabaseTimestamp(promotion.startsAt) : null,
    ends_at: promotion.endsAt ? supabaseTimestamp(promotion.endsAt) : null,
    created_at: supabaseTimestamp(promotion.createdAt),
    updated_at: supabaseTimestamp(promotion.updatedAt || promotion.createdAt),
  };
}

function newsCommentSupabaseRow(comment) {
  return {
    local_id: comment.id || "",
    story_id: comment.storyId,
    profile_id: uuidOrNull(comment.profileId),
    author: comment.author || "GCX Member",
    handle: comment.handle || "",
    body: comment.body || "",
    status: comment.status || "published",
    reports: Number(comment.reports || 0),
    created_at: supabaseTimestamp(comment.createdAt),
    updated_at: supabaseTimestamp(comment.updatedAt || comment.createdAt),
  };
}

function communityPostSupabaseRow(post) {
  return {
    local_id: post.id || "",
    profile_id: uuidOrNull(post.profileId),
    title: post.title || "",
    body: post.body || "",
    category: post.category || "",
    tags: Array.isArray(post.tags) ? post.tags.filter(Boolean).slice(0, 12) : [],
    link_url: post.linkUrl || "",
    image_url: post.imageUrl || "",
    status: post.status || "published",
    reports: Number(post.reports || 0),
    created_at: supabaseTimestamp(post.createdAt),
    updated_at: supabaseTimestamp(post.updatedAt || post.createdAt),
  };
}

function communityCommentSupabaseRow(comment) {
  return {
    local_id: comment.id || "",
    local_post_id: comment.postId || "",
    profile_id: uuidOrNull(comment.profileId),
    author: comment.author || "GCX Member",
    handle: comment.handle || "",
    body: comment.body || "",
    status: comment.status || "published",
    reports: Number(comment.reports || 0),
    created_at: supabaseTimestamp(comment.createdAt),
    updated_at: supabaseTimestamp(comment.updatedAt || comment.createdAt),
  };
}

function moderationReportSupabaseRow(report) {
  return {
    reporter_profile_id: uuidOrNull(report.reporterProfileId),
    target_type: report.targetType,
    target_id: report.targetId,
    reason: report.reason || "Community report",
    status: report.status || "open",
    created_at: supabaseTimestamp(report.createdAt),
    reviewed_at: report.reviewedAt ? supabaseTimestamp(report.reviewedAt) : null,
    reviewed_by: uuidOrNull(report.reviewedBy),
  };
}

async function persistNewsletterSubscription(subscription) {
  return safeSupabaseWrite("newsletter_subscriptions?on_conflict=email", newsletterSupabaseRow(subscription));
}

async function persistCollectorWaitlist(record) {
  const waitlistWrite = await safeSupabaseWrite("collector_waitlist", collectorWaitlistSupabaseRow(record));
  const intentWrite = record.item
    ? await safeSupabaseWrite("marketplace_listing_intents?on_conflict=local_id", marketplaceIntentSupabaseRow(record))
    : { ok: false, skipped: "empty-item" };
  return {
    ok: waitlistWrite.ok || intentWrite.ok,
    waitlistWrite,
    intentWrite,
  };
}

async function persistSponsorLead(lead) {
  return safeSupabaseWrite("sponsor_leads?on_conflict=local_id", sponsorLeadSupabaseRow(lead));
}

async function persistSponsorPromotion(promotion) {
  return safeSupabaseWrite("sponsor_promotions?on_conflict=local_id", sponsorPromotionSupabaseRow(promotion));
}

async function persistNewsComment(comment) {
  return safeSupabaseWrite("news_article_comments?on_conflict=local_id", newsCommentSupabaseRow(comment));
}

async function persistCommunityPost(post) {
  return safeSupabaseWrite("community_posts?on_conflict=local_id", communityPostSupabaseRow(post));
}

async function persistCommunityComment(comment) {
  return safeSupabaseWrite("community_comments?on_conflict=local_id", communityCommentSupabaseRow(comment));
}

async function persistModerationReport(report) {
  return safeSupabaseWrite("moderation_reports", moderationReportSupabaseRow(report));
}

const launchSupabaseTables = [
  "newsletter_subscriptions",
  "collector_waitlist",
  "news_article_comments",
  "community_posts",
  "community_comments",
  "moderation_reports",
  "sponsor_leads",
  "sponsor_promotions",
  "marketplace_listing_intents",
];

const launchSupabaseRequiredColumns = {
  newsletter_subscriptions: ["email", "status", "source_page", "referrer", "consent_version", "interest_category", "created_at", "updated_at"],
  collector_waitlist: ["profile_id", "item", "intent", "status", "source_page", "referrer", "consent_version", "created_at", "updated_at"],
  news_article_comments: ["local_id", "story_id", "profile_id", "author", "handle", "body", "status", "reports", "created_at", "updated_at"],
  community_posts: ["local_id", "profile_id", "title", "body", "category", "tags", "link_url", "image_url", "status", "reports", "created_at", "updated_at"],
  community_comments: ["local_id", "local_post_id", "profile_id", "author", "handle", "body", "status", "reports", "created_at", "updated_at"],
  moderation_reports: ["reporter_profile_id", "target_type", "target_id", "reason", "status", "created_at"],
  sponsor_leads: ["local_id", "name", "email", "company", "package_interest", "budget_range", "goal", "source", "ref", "status", "created_at", "updated_at"],
  sponsor_promotions: [
    "local_id",
    "sponsor_name",
    "title",
    "body",
    "image_url",
    "destination_url",
    "placement",
    "package_type",
    "cta_label",
    "priority",
    "status",
    "clicks",
    "starts_at",
    "ends_at",
    "created_at",
    "updated_at",
  ],
  marketplace_listing_intents: ["local_id", "profile_id", "item_title", "item_type", "source_id", "intent", "status", "safety_note", "created_at", "updated_at"],
};

const launchSupabasePublicReadTables = ["news_article_comments", "community_posts", "community_comments", "sponsor_promotions"];

function supabaseLaunchErrorDetail(error) {
  const message = String(error?.message || error || "").replace(process.env.SUPABASE_SERVICE_ROLE_KEY || "", "[redacted]");
  if (/PGRST205|schema cache|failed with 404/i.test(message)) {
    return "Missing from Supabase REST schema cache. Run supabase/gcx-launch-data-foundation.sql, then rerun the validator. If the table exists, confirm Data API exposure and grants.";
  }
  if (/failed with 400|column|relationship/i.test(message)) {
    return "Reachable, but required columns or relationships are missing. Re-run supabase/gcx-launch-data-foundation.sql to add bridge columns and indexes.";
  }
  if (/failed with 401|failed with 403/i.test(message)) {
    return "Supabase rejected the server key or grants. Check SUPABASE_SERVICE_ROLE_KEY and confirm service_role grants are present.";
  }
  return message;
}

async function checkSupabasePublicReadTable(table) {
  const key = supabasePublicKey();
  if (!key || !process.env.SUPABASE_URL) {
    return {
      table,
      ok: false,
      status: "skipped",
      detail: "SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY is missing, so public read grants were not checked.",
    };
  }

  try {
    const response = await fetch(supabaseRestUrl(`${table}?select=id&limit=0`), {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
    const text = await response.text();
    return {
      table,
      ok: response.ok,
      status: response.status,
      detail: response.ok ? "Public read endpoint is reachable; RLS still filters rows." : supabaseLaunchErrorDetail(`Supabase ${table} public read failed with ${response.status}: ${text}`),
    };
  } catch (error) {
    return {
      table,
      ok: false,
      status: "error",
      detail: supabaseLaunchErrorDetail(error),
    };
  }
}

async function checkSupabaseLaunchTables() {
  if (!supabaseConfigured()) {
    return {
      configured: false,
      ready: false,
      serviceRoleTablesReady: false,
      publicReadTablesReady: false,
      checkedAt: new Date().toISOString(),
      tables: launchSupabaseTables.map((table) => ({
        table,
        requiredColumns: launchSupabaseRequiredColumns[table] || [],
        ok: false,
        status: "not-configured",
        detail: "Supabase server credentials are not configured.",
      })),
      publicReads: launchSupabasePublicReadTables.map((table) => ({
        table,
        ok: false,
        status: "not-configured",
        detail: "Supabase public key is not configured.",
      })),
      nextStep: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env, then run scripts/validate-supabase-launch-data-setup.js.",
    };
  }
  const tables = [];
  for (const table of launchSupabaseTables) {
    const requiredColumns = launchSupabaseRequiredColumns[table] || ["*"];
    try {
      await supabaseRequest(`${table}?select=${encodeURIComponent(requiredColumns.join(","))}&limit=0`, {
        method: "GET",
        headers: { Prefer: "" },
      });
      tables.push({
        table,
        requiredColumns,
        ok: true,
        status: 200,
        detail: "Reachable with required columns.",
      });
    } catch (error) {
      tables.push({
        table,
        requiredColumns,
        ok: false,
        status: "error",
        detail: supabaseLaunchErrorDetail(error),
      });
    }
  }
  const publicReads = [];
  for (const table of launchSupabasePublicReadTables) {
    publicReads.push(await checkSupabasePublicReadTable(table));
  }
  const serviceRoleTablesReady = tables.every((table) => table.ok);
  const publicReadTablesReady = publicReads.every((table) => table.ok);
  const ready = serviceRoleTablesReady && publicReadTablesReady;
  return {
    configured: true,
    ready,
    serviceRoleTablesReady,
    publicReadTablesReady,
    checkedAt: new Date().toISOString(),
    tables,
    publicReads,
    nextStep: ready
      ? "Supabase launch tables are reachable. Run a signed-in smoke test before public traffic."
      : "Run supabase/gcx-launch-data-foundation.sql in the Supabase SQL Editor, then rerun scripts/validate-supabase-launch-data-setup.js.",
  };
}

function queueCommunitySupabaseSync(data) {
  if (!supabaseConfigured()) return;
  const snapshot = JSON.parse(JSON.stringify(data));
  supabaseWriteQueue = supabaseWriteQueue
    .catch(() => {})
    .then(() => syncCommunityDataToSupabase(snapshot))
    .catch((error) => {
      console.warn(`Supabase community sync failed: ${error.message}`);
    });
}

async function hydrateCommunityDataFromSupabase() {
  if (!supabaseConfigured()) return false;
  try {
    const rows = await supabaseRequest(`gcx_data_files?path=eq.${encodePostgrestValue("data/community.json")}&select=content&limit=1`, {
      method: "GET",
      headers: { Prefer: "" },
    });
    const content = Array.isArray(rows) ? rows[0]?.content : null;
    if (!content || typeof content !== "object") return false;
    communityDataCache = content;
    writeJson(communityDataPath, loadCommunityData());
    return true;
  } catch (error) {
    console.warn(`Supabase community hydration failed, using local JSON: ${error.message}`);
    return false;
  }
}

function defaultCommunityProfileId(data) {
  return data.profiles.find((profile) => profile.id === "profile-gcx-member")?.id || data.profiles[0]?.id || "";
}

function addNotification(data, profileId, notification) {
  if (!profileId) return;
  data.notifications.unshift({
    id: `notification-${Date.now()}-${slugify(notification.title || notification.type || "update")}`,
    profileId,
    type: safeText(notification.type || "community", 40),
    title: safeText(notification.title || "Community update", 120),
    body: safeText(notification.body || "", 300),
    url: safeUrl(notification.url || "community.html"),
    createdAt: new Date().toISOString(),
    read: false,
  });
}

function addActivity(data, activity) {
  if (!data.activity) data.activity = [];
  data.activity.unshift({
    id: `activity-${Date.now()}-${slugify(activity.title || activity.type || "update")}`,
    type: safeText(activity.type || "community", 40),
    title: safeText(activity.title || "Community activity", 140),
    body: safeText(activity.body || "", 360),
    profileId: safeText(activity.profileId || "", 100),
    actorName: safeText(activity.actorName || "", 100),
    targetType: safeText(activity.targetType || "", 60),
    targetId: safeText(activity.targetId || "", 140),
    url: safeUrl(activity.url || "community.html"),
    imageUrl: safeUrl(activity.imageUrl || ""),
    createdAt: activity.createdAt || new Date().toISOString(),
  });
  data.activity = data.activity.slice(0, 300);
}

function normalizePostReactions(post) {
  const base = post.reactions && typeof post.reactions === "object" ? post.reactions : {};
  return {
    like: Number(base.like ?? post.likes ?? 0),
    hype: Number(base.hype || 0),
    want: Number(base.want || 0),
    trade: Number(base.trade || 0),
    watch: Number(base.watch || 0),
  };
}

function communityPostDuplicateKey(post) {
  const canonicalUrl = safeUrl(post.canonicalUrl || post.linkUrl || post.sourceUrl || post.originalUrl || "");
  const sourceUrl = safeUrl(post.sourceUrl || post.originalUrl || "");
  const externalPostId = safeText(post.externalPostId || post.externalContentId || "", 160);
  const topic = safeText(post.topic || post.canonicalTopic || post.game || post.entity || "", 160);
  const title = safeText(post.title || "", 160);
  const sourceName = safeText(post.sourceName || post.linkPreview?.sourceLabel || "", 100);
  const basis = canonicalUrl || sourceUrl || externalPostId || `${sourceName}:${topic}:${title}`;
  return slugify(basis).slice(0, 180);
}

function findDuplicateCommunityPost(data, candidate) {
  const candidateKey = communityPostDuplicateKey(candidate);
  if (!candidateKey) return null;
  return (data.posts || []).find((post) => {
    if ((post.status || "published") === "deleted") return false;
    if (post.id === candidate.id) return false;
    return communityPostDuplicateKey(post) === candidateKey;
  }) || null;
}

function streamingSpotlightDuplicateKey(item) {
  const watchUrl = safeUrl(item.watch_url || item.watchUrl || "");
  const embedUrl = safeUrl(item.embed_url || item.embedUrl || "");
  const externalContentId = safeText(item.external_content_id || item.externalContentId || "", 160);
  const externalChannelId = safeText(item.external_channel_id || item.externalChannelId || "", 120);
  const title = safeText(item.title || "", 160);
  const platform = safeText(item.platform || "", 40);
  return slugify(watchUrl || embedUrl || externalContentId || `${platform}:${externalChannelId}:${title}`).slice(0, 180);
}

function findDuplicateStreamingSpotlightItem(data, candidate) {
  const candidateKey = streamingSpotlightDuplicateKey(candidate);
  if (!candidateKey) return null;
  return (data.streamingSpotlight || []).find((item) => {
    if ((item.status || "") === "deleted") return false;
    if (item.id === candidate.id) return false;
    return streamingSpotlightDuplicateKey(item) === candidateKey;
  }) || null;
}

function buildSocialEditorialPostPayload(post) {
  return {
    id: post.id,
    title: post.title || "",
    body: post.body || "",
    category: post.category || "Community",
    postType: post.postType || "community_post",
    sourceName: post.sourceName || post.linkPreview?.sourceLabel || "",
    sourceUrl: post.sourceUrl || post.linkUrl || "",
    linkUrl: post.linkUrl || "",
    status: post.status || "published",
    editorialStatus: post.editorialStatus || "",
    pipelineStage: post.pipelineStage || "publication",
    pipelineSource: post.pipelineSource || "",
    editorialPinned: Boolean(post.editorialPinned),
    editorialPriority: Number(post.editorialPriority || 0),
    markedStale: Boolean(post.markedStale),
    scheduledAt: post.scheduledAt || "",
    createdAt: post.createdAt || "",
    updatedAt: post.updatedAt || "",
    reviewedAt: post.reviewedAt || "",
    reviewedBy: post.reviewedBy || "",
    reviewNote: post.reviewNote || "",
    viewCount: Number(post.viewCount || post.views || 0),
    videoEmbedLoadCount: Number(post.videoEmbedLoadCount || 0),
    lastVideoEmbedLoadedAt: post.lastVideoEmbedLoadedAt || "",
    lastViewedAt: post.lastViewedAt || "",
    reactions: normalizePostReactions(post),
    comments: Number(post.comments || 0),
    duplicateKey: post.duplicateKey || communityPostDuplicateKey(post),
  };
}

function buildStreamingEditorialPayload(item) {
  return {
    id: item.id,
    platform: item.platform || "",
    creator: item.creator || "",
    title: item.title || "",
    game: item.game || "",
    category: item.category || "",
    status: item.status || (item.is_live === true ? "live" : item.scheduled_start ? "scheduled" : "replay"),
    editorialStatus: item.editorialStatus || "",
    pipelineStage: item.pipelineStage || "publication",
    pipelineSource: item.pipelineSource || "",
    featured: Boolean(item.featured),
    hidden: Boolean(item.hidden),
    markedStale: Boolean(item.markedStale),
    editorialPriority: Number(item.editorialPriority || 0),
    is_live: item.is_live === true,
    scheduled_start: item.scheduled_start || "",
    viewer_count: item.viewer_count ?? null,
    viewCount: Number(item.viewCount || item.views || 0),
    watchClickCount: Number(item.watchClickCount || 0),
    embedLoadCount: Number(item.embedLoadCount || 0),
    lastViewedAt: item.lastViewedAt || "",
    lastWatchClickedAt: item.lastWatchClickedAt || "",
    lastEmbedLoadedAt: item.lastEmbedLoadedAt || "",
    source: item.source || "",
    watch_url: item.watch_url || "",
    updated_at: item.updated_at || item.updatedAt || "",
    reviewedAt: item.reviewedAt || "",
    reviewedBy: item.reviewedBy || "",
    reviewNote: item.reviewNote || "",
    editorial_reason: item.editorial_reason || "",
  };
}

function buildStreamingSpotlightPublicPayload(item) {
  return {
    ...item,
    viewCount: Number(item.viewCount || item.views || 0),
    watchClickCount: Number(item.watchClickCount || 0),
    embedLoadCount: Number(item.embedLoadCount || 0),
    viewer_count: item.viewer_count ?? null,
  };
}

function buildSocialIntakePost(data, body, staffProfile) {
  const title = safeText(body.title, 140);
  const postBody = safeText(body.body || body.summary, 900);
  const linkUrl = safeUrl(body.linkUrl || body.url || "");
  const sourceUrl = safeUrl(body.sourceUrl || linkUrl || "");
  const post = {
    id: safeText(body.id, 160) || `post-social-intake-${Date.now()}-${slugify(title || "draft")}`,
    author: "GCX Social",
    handle: "@gcxsocial",
    profileId: defaultCommunityProfileId(data),
    category: safeText(body.category || "Gaming", 40),
    postType: safeText(body.postType || "quick_news", 40),
    title,
    body: postBody,
    linkUrl,
    sourceUrl,
    sourceName: safeText(body.sourceName || body.source || "", 120),
    sourceType: safeText(body.sourceType || "external", 40),
    canonicalUrl: safeUrl(body.canonicalUrl || linkUrl || sourceUrl || ""),
    externalPostId: safeText(body.externalPostId || body.externalContentId || "", 180),
    topic: safeText(body.topic || body.game || body.entity || "", 160),
    imageUrl: safeUrl(body.imageUrl || ""),
    imageAlt: safeText(body.imageAlt || title, 180),
    embedUrl: safeUrl(body.embedUrl || ""),
    mediaType: safeText(body.mediaType || "", 40),
    platform: safeText(body.platform || "", 40),
    tags: Array.isArray(body.tags) ? body.tags.map((tag) => safeText(tag, 32)).filter(Boolean).slice(0, 8) : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "needs_review",
    editorialStatus: "Intake review",
    editorialPriority: Number.isFinite(Number(body.editorialPriority)) ? Number(body.editorialPriority) : 0,
    pipelineStage: "verification",
    pipelineSource: safeText(body.pipelineSource || "staff-intake", 80),
    reviewedBy: staffProfile?.id || "",
    reviewNote: safeText(body.note || "Created through Social intake.", 240),
    likes: 0,
    reactions: { like: 0, hype: 0, want: 0, trade: 0, watch: 0 },
    comments: 0,
    reports: 0,
  };
  post.linkPreview = buildLinkPreview(data, linkUrl, title);
  post.duplicateKey = communityPostDuplicateKey(post);
  return post;
}

function buildStreamingIntakeItem(body, staffProfile) {
  const title = safeText(body.title, 160);
  const item = {
    id: safeText(body.id, 160) || `spotlight-intake-${Date.now()}-${slugify(title || "draft")}`,
    platform: safeText(body.platform || "", 40),
    external_channel_id: safeText(body.external_channel_id || body.externalChannelId || "", 120),
    external_content_id: safeText(body.external_content_id || body.externalContentId || "", 160),
    creator: safeText(body.creator || "", 120),
    title,
    game: safeText(body.game || "", 120),
    category: safeText(body.category || "GCX pick", 80),
    thumbnail_url: safeUrl(body.thumbnail_url || body.thumbnailUrl || ""),
    embed_url: safeUrl(body.embed_url || body.embedUrl || ""),
    watch_url: safeUrl(body.watch_url || body.watchUrl || body.url || ""),
    is_live: false,
    scheduled_start: safeText(body.scheduled_start || body.scheduledStart || "", 80),
    viewer_count: null,
    source: safeText(body.source || body.sourceName || "", 140),
    source_url: safeUrl(body.source_url || body.sourceUrl || body.watch_url || body.watchUrl || ""),
    editorial_reason: safeText(body.editorial_reason || body.editorialReason || "", 500),
    featured: false,
    hidden: true,
    markedStale: false,
    status: "needs_review",
    editorialStatus: "Intake review",
    editorialPriority: Number.isFinite(Number(body.editorialPriority)) ? Number(body.editorialPriority) : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    reviewedBy: staffProfile?.id || "",
    reviewNote: safeText(body.note || "Created through Streaming Spotlight intake.", 240),
    pipelineStage: "verification",
    pipelineSource: safeText(body.pipelineSource || "staff-intake", 80),
    viewCount: 0,
    watchClickCount: 0,
    embedLoadCount: 0,
  };
  item.duplicateKey = streamingSpotlightDuplicateKey(item);
  return item;
}

function buildLinkPreview(data, linkUrl, fallbackTitle = "") {
  const url = safeUrl(linkUrl);
  if (!url) return null;

  let parsed;
  try {
    parsed = new URL(url, "http://localhost");
  } catch (error) {
    return null;
  }

  const pathName = parsed.pathname.replace(/^\/+/, "");
  const host = parsed.hostname === "localhost" ? "Games Exchange" : parsed.hostname.replace(/^www\./, "");
  const preview = {
    url,
    title: safeText(fallbackTitle || host, 120),
    description: safeText(`Shared from ${host}`, 220),
    imageUrl: "",
    sourceLabel: safeText(host, 80),
    kind: "link",
  };

  if (pathName === "streamer.html") {
    const streamerId = parsed.searchParams.get("id") || parsed.searchParams.get("ref") || "";
    const streamer = (data.streamers || []).find((item) => item.id === streamerId || normalize(item.handle) === normalize(streamerId));
    preview.kind = "streamer";
    preview.sourceLabel = "GCX Streamer Campaign";
    preview.title = streamer ? `${streamer.name} streamer campaign` : "GCX streamer spotlight campaign";
    preview.description = streamer?.pitch || "Vote, share, and help decide which creators get the GCX weekly spotlight.";
    preview.imageUrl = streamer?.imageUrl || "";
  } else if (pathName === "streamers.html") {
    preview.kind = "streamer";
    preview.sourceLabel = "GCX Streamer Highlights";
    preview.title = "GCX streamer highlights";
    preview.description = "Vote for the popular streamer and rising creator of the week.";
  } else if (pathName === "sponsors.html") {
    preview.kind = "sponsor";
    preview.sourceLabel = "GCX Sponsor Path";
    preview.title = "Sponsor GCX";
    preview.description = "Reach gaming, card, retro, and creator communities through GCX placements.";
  } else if (pathName === "community-groups.html") {
    preview.kind = "group";
    preview.sourceLabel = "GCX Groups";
    preview.title = "GCX community groups";
    preview.description = "Find trading rooms, retro shelves, streamer campaign spaces, and marketplace watch groups.";
  } else if (pathName === "pokemon.html" || pathName === "magic.html" || pathName === "yugioh.html") {
    preview.kind = "cards";
    preview.sourceLabel = "GCX Card Database";
    preview.title = pathName === "pokemon.html" ? "Pokemon card index" : pathName === "magic.html" ? "Magic card index" : "Yu-Gi-Oh! card index";
    preview.description = "Browse card sets, details, market context, and beta waitlist paths.";
  } else if (pathName === "card.html" || pathName === "magic-card.html" || pathName === "yugioh-card.html") {
    preview.kind = "cards";
    preview.sourceLabel = "GCX Card Detail";
    preview.title = fallbackTitle || "GCX card detail";
    preview.description = "Card detail, market context, variants, legalities, and beta waitlist path on GCX.";
  } else if (pathName === "games.html" || pathName.endsWith("-game.html") || pathName.endsWith(".html")) {
    preview.kind = "games";
    preview.sourceLabel = "GCX Games";
    preview.title = fallbackTitle || "GCX game library";
    preview.description = "Game library, collection, and replay discovery path on GCX.";
  }

  return preview;
}

function buildCommunityPostPayload(data, post, viewerId) {
  const authorProfile = data.profiles.find((profile) => profile.id === post.profileId || profile.handle === post.handle) || null;
  const group = data.groups.find((item) => item.id === post.groupId) || null;
  const resharedPost = post.resharedPostId
    ? data.posts.find((item) => item.id === post.resharedPostId && isPublicCommunityPost(item))
    : null;
  const resharedAuthor = resharedPost
    ? data.profiles.find((profile) => profile.id === resharedPost.profileId || profile.handle === resharedPost.handle)
    : null;
  const publishedComments = (data.comments || []).filter((comment) => comment.postId === post.id && (comment.status || "published") === "published");
  const savedItems = data.savedPosts || [];
  return {
    ...post,
    linkPreview: post.linkPreview || buildLinkPreview(data, post.linkUrl, post.title),
    reactions: normalizePostReactions(post),
    likes: normalizePostReactions(post).like,
    comments: publishedComments.length || post.comments || 0,
    viewCount: Number(post.viewCount || post.views || 0),
    isSaved: savedItems.some((saved) => saved.profileId === viewerId && saved.postId === post.id),
    savedCount: savedItems.filter((saved) => saved.postId === post.id).length,
    authorProfile: authorProfile
      ? {
          id: authorProfile.id,
          displayName: authorProfile.displayName,
          handle: authorProfile.handle,
          avatarUrl: authorProfile.avatarUrl,
        }
      : null,
    group: group
      ? {
          id: group.id,
          name: group.name,
          slug: group.slug,
          category: group.category,
        }
      : null,
    resharedPost: resharedPost
      ? {
          id: resharedPost.id,
          author: resharedPost.author,
          handle: resharedPost.handle,
          title: resharedPost.title,
          body: resharedPost.body,
          category: resharedPost.category,
          imageUrl: resharedPost.imageUrl,
          linkUrl: resharedPost.linkUrl,
          createdAt: resharedPost.createdAt,
          authorProfile: resharedAuthor
            ? {
                id: resharedAuthor.id,
                displayName: resharedAuthor.displayName,
                handle: resharedAuthor.handle,
                avatarUrl: resharedAuthor.avatarUrl,
              }
            : null,
        }
      : null,
  };
}

function isPublicCommunityPost(post) {
  if (!post || (post.status || "published") !== "published") return false;
  if (post.markedStale) return false;
  if (post.scheduledAt && new Date(post.scheduledAt).getTime() > Date.now()) return false;
  return true;
}

function isPublicStreamingSpotlightItem(item) {
  if (!item || item.hidden || item.status === "deleted") return false;
  if (item.markedStale) return false;
  return true;
}

function communityPostEngagementScore(data, post) {
  const reactions = normalizePostReactions(post);
  const reactionTotal = Object.values(reactions).reduce((sum, count) => sum + Number(count || 0), 0);
  const commentCount = (data.comments || []).filter((comment) => comment.postId === post.id && (comment.status || "published") === "published").length || Number(post.comments || 0);
  const saveCount = (data.savedPosts || []).filter((saved) => saved.postId === post.id).length;
  const viewCount = Number(post.viewCount || post.views || 0);
  const recencyHours = Math.max(1, (Date.now() - new Date(post.createdAt || 0).getTime()) / 36e5);
  const recencyBoost = Math.max(0, 24 - Math.min(24, recencyHours)) / 6;
  const linkBoost = post.linkUrl ? 1 : 0;
  const imageBoost = post.imageUrl ? 1 : 0;
  const viewBoost = Math.min(5, viewCount / 20);
  return Number((reactionTotal * 2 + commentCount * 3 + saveCount * 4 + viewBoost + linkBoost + imageBoost + recencyBoost).toFixed(2));
}

function buildTrendingPosts(data, viewerId, limit = 5) {
  return [...(data.posts || [])]
    .filter(isPublicCommunityPost)
    .map((post) => ({
      ...buildCommunityPostPayload(data, post, viewerId),
      trendingScore: communityPostEngagementScore(data, post),
    }))
    .sort((a, b) => Number(b.trendingScore || 0) - Number(a.trendingScore || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit);
}

function communityPostSearchText(post) {
  return normalize([
    post.title,
    post.body,
    post.reshareNote,
    post.author,
    post.handle,
    post.category,
    post.linkPreview?.title,
    post.linkPreview?.description,
    post.linkPreview?.sourceLabel,
    ...(post.tags || []),
  ].join(" "));
}

function communityPostMatchesCategory(post, category) {
  if (category === "all") return true;
  const normalizedCategory = normalize(post.category);
  const normalizedType = normalize(post.postType);
  const normalizedSource = normalize(post.sourceType);
  const normalizedMedia = normalize(post.mediaType);
  const tagSet = new Set((post.tags || []).map((tag) => normalize(tag)));
  if (category === "videos") return normalizedType === "video-post" || normalizedType === "video_post" || normalizedMedia === "video" || Boolean(post.embedUrl);
  if (category === "gcx") return normalizedCategory === "gcx" || normalizedSource === "gcx";
  if (category === "tcg") return normalizedCategory === "tcg" || normalizedType === "tcg-card-post" || normalizedType === "tcg_card_post" || tagSet.has("tcg");
  if (category === "pokemon") return normalizedCategory === "pokemon" || tagSet.has("pokemon") || communityPostSearchText(post).includes("pokemon");
  return normalizedCategory === category || tagSet.has(category);
}

function topicMatchesPost(topic, post) {
  const haystack = communityPostSearchText(post);
  return (topic.keywords || []).some((keyword) => haystack.includes(normalize(keyword)));
}

function groupMatchesPost(group, post) {
  const haystack = communityPostSearchText(post);
  return normalize(post.groupId) === normalize(group.id) || (group.keywords || []).some((keyword) => haystack.includes(normalize(keyword)));
}

function summarizeTrafficEvents(events) {
  const countsByType = {};
  const countsByRef = {};
  const countsByTarget = {};

  events.forEach((event) => {
    const type = event.type || "visit";
    const ref = event.ref || "direct";
    const target = event.targetId || event.path || "unknown";
    countsByType[type] = (countsByType[type] || 0) + 1;
    countsByRef[ref] = (countsByRef[ref] || 0) + 1;
    countsByTarget[target] = (countsByTarget[target] || 0) + 1;
  });

  const toSortedList = (counts) =>
    Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    totalEvents: events.length,
    byType: toSortedList(countsByType),
    byRef: toSortedList(countsByRef),
    byTarget: toSortedList(countsByTarget).slice(0, 8),
    latest: [...events].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 8),
  };
}

function buildReferralLeaderboard(data) {
  const refMap = new Map();
  const streamers = data.streamers || [];
  const profiles = data.profiles || [];

  (data.trafficEvents || []).forEach((event) => {
    const ref = safeText(event.ref || "direct", 120) || "direct";
    if (ref === "direct") return;

    if (!refMap.has(ref)) {
      refMap.set(ref, {
        ref,
        totalEvents: 0,
        votes: 0,
        copiedLinks: 0,
        campaignViews: 0,
        sourceCounts: {},
        latestAt: event.createdAt || "",
        latestPath: event.campaignUrl || event.path || "",
        targetId: event.targetId || "",
      });
    }

    const item = refMap.get(ref);
    item.totalEvents += 1;
    item.votes += event.type === "campaign_vote" ? 1 : 0;
    item.copiedLinks += ["campaign_link_copy", "share_copy"].includes(event.type) ? 1 : 0;
    item.campaignViews += event.type === "campaign_view" ? 1 : 0;
    item.sourceCounts[event.source || "unknown"] = (item.sourceCounts[event.source || "unknown"] || 0) + 1;
    if (new Date(event.createdAt || 0).getTime() >= new Date(item.latestAt || 0).getTime()) {
      item.latestAt = event.createdAt || item.latestAt;
      item.latestPath = event.campaignUrl || event.path || item.latestPath;
      item.targetId = event.targetId || item.targetId;
    }
  });

  return Array.from(refMap.values())
    .map((item) => {
      const streamer =
        streamers.find(
          (candidate) =>
            candidate.id === item.ref ||
            candidate.id === item.targetId ||
            normalize(candidate.handle) === normalize(item.ref) ||
            normalize(candidate.name) === normalize(item.ref)
        ) || null;
      const profile =
        profiles.find(
          (candidate) =>
            candidate.id === item.ref ||
            normalize(candidate.handle) === normalize(item.ref) ||
            normalize(candidate.displayName) === normalize(item.ref)
        ) || null;
      const source = Object.entries(item.sourceCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "unknown";
      const campaignUrl = streamer?.campaignUrl || item.latestPath || "streamers.html";

      return {
        ...item,
        label: streamer?.name || profile?.displayName || item.ref,
        source,
        campaignUrl,
      };
    })
    .sort((a, b) => b.totalEvents - a.totalEvents || b.votes - a.votes || a.label.localeCompare(b.label))
    .map((item, index) => ({ ...item, rank: index + 1 }))
    .slice(0, 8);
}

function activePromotions(data, placement = "") {
  const now = Date.now();
  return (data.promotions || [])
    .filter((promotion) => (promotion.status || "active") === "active")
    .filter((promotion) => !promotion.startsAt || new Date(promotion.startsAt).getTime() <= now)
    .filter((promotion) => !promotion.endsAt || new Date(promotion.endsAt).getTime() >= now)
    .filter((promotion) => !placement || normalize(promotion.placement) === normalize(placement))
    .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function buildSponsorPackages(data) {
  const campaign = data.campaign || {};
  const topStreamers = buildCreatorSpotlight(data);
  const trafficEvents = data.trafficEvents || [];

  const streamerPackages = topStreamers.map((streamer, index) => {
    const streamerTraffic = summarizeTrafficEvents(trafficEvents.filter((event) => event.targetId === streamer.id || event.ref === streamer.id));
    const weeklyVotes = Number(streamer.weeklyVotes || 0);
    const suggestedLow = index === 0 ? 250 : 100;
    const suggestedHigh = index === 0 ? Math.max(500, Math.ceil(weeklyVotes / 100) * 100) : Math.max(250, Math.ceil(weeklyVotes / 120) * 100);
    return {
      id: `sponsor-package-${streamer.id}`,
      packageName: streamer.slotLabel || `Creator Spotlight ${index + 1}`,
      creatorId: streamer.id,
      creatorName: streamer.name,
      creatorHandle: streamer.handle,
      tier: streamer.tier,
      pitch: streamer.pitch,
      imageUrl: streamer.imageUrl,
      campaignUrl: streamer.campaignUrl || `streamer.html?id=${streamer.id}`,
      sponsorUrl: `sponsors.html?ref=${encodeURIComponent(streamer.id)}&package=${encodeURIComponent("Streamer spotlight sponsor")}`,
      weeklyVotes,
      totalVotes: Number(streamer.votes || 0),
      trafficEvents: streamerTraffic.totalEvents,
      shareCopies: streamerTraffic.byType.find((item) => item.label === "share_copy")?.count || 0,
      campaignViews: streamerTraffic.byType.find((item) => item.label === "campaign_view")?.count || 0,
      suggestedBudget: `$${suggestedLow.toLocaleString()}-$${suggestedHigh.toLocaleString()} weekly`,
      deliverables: [
        "Homepage creator spotlight placement",
        "Creator campaign page sponsor CTA",
        "Voting board mention",
        "Growth dashboard referral tracking",
      ],
    };
  });

  return {
    weekLabel: campaign.weekLabel || "Current voting week",
    sponsorPackage: campaign.sponsorPackage || "Weekly streamer spotlight sponsor package",
    streamerPackages,
    marketplacePackages: [
      {
        id: "sponsor-package-card-trading",
        packageName: "Card Collector Marketplace Beta Sponsor",
        suggestedBudget: "$100-$500 weekly",
        sponsorUrl: "sponsors.html?ref=card-marketplace&package=Card%20collector%20marketplace%20beta%20sponsor",
        deliverables: ["Community feed sponsored card", "Pokemon card page CTA", "Collector event mention", "Marketplace beta trust placement"],
      },
      {
        id: "sponsor-package-game-library",
        packageName: "Game Library Placement",
        suggestedBudget: "$100-$500 weekly",
        sponsorUrl: "sponsors.html?ref=game-library&package=Game%20library%20placement",
        deliverables: ["Console library placement", "Replay event tie-in", "Collector group prompt", "Growth dashboard tracking"],
      },
    ],
  };
}

function buildSponsorPerformance(data) {
  const activePromotionList = activePromotions(data);
  const promotionList = data.promotions || [];
  const openLeads = (data.sponsorLeads || []).filter((lead) => (lead.status || "new") !== "archived");
  const packageCounts = openLeads.reduce((counts, lead) => {
    const packageName = lead.packageInterest || "General";
    counts[packageName] = (counts[packageName] || 0) + 1;
    return counts;
  }, {});
  const placementCounts = activePromotionList.reduce((counts, promotion) => {
    const placement = promotion.placement || "community-feed";
    counts[placement] = (counts[placement] || 0) + 1;
    return counts;
  }, {});
  const streamerPackages = buildSponsorPackages(data).streamerPackages || [];

  const sortedCounts = (counts) =>
    Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      activePromotions: activePromotionList.length,
      pausedPromotions: promotionList.filter((promotion) => promotionStatusLabel(promotion.status) === "paused").length,
      archivedPromotions: promotionList.filter((promotion) => promotionStatusLabel(promotion.status) === "archived").length,
      promotionClicks: activePromotionList.reduce((sum, promotion) => sum + Number(promotion.clicks || 0), 0),
      openLeads: openLeads.length,
      streamerPackages: streamerPackages.length,
      streamerPackageEvents: streamerPackages.reduce((sum, item) => sum + Number(item.trafficEvents || 0), 0),
      streamerPackageVotes: streamerPackages.reduce((sum, item) => sum + Number(item.weeklyVotes || 0), 0),
    },
    byPackage: sortedCounts(packageCounts),
    byPlacement: sortedCounts(placementCounts),
    byStatus: sortedCounts(
      promotionList.reduce((counts, promotion) => {
        const status = promotionStatusLabel(promotion.status);
        counts[status] = (counts[status] || 0) + 1;
        return counts;
      }, {})
    ),
    topPromotions: activePromotionList
      .map((promotion) => ({
        id: promotion.id,
        label: promotion.title,
        sponsorName: promotion.sponsorName,
        packageType: promotion.packageType,
        placement: promotion.placement,
        clicks: Number(promotion.clicks || 0),
        destinationUrl: promotion.destinationUrl,
      }))
      .sort((a, b) => b.clicks - a.clicks || a.label.localeCompare(b.label))
      .slice(0, 6),
    latestLeads: [...openLeads].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6),
    streamerPackages,
  };
}

function sponsorLeadStatusLabel(status) {
  const allowed = new Set(["new", "contacted", "proposal", "won", "archived"]);
  const normalizedStatus = normalize(status).replace(/\s+/g, "-");
  return allowed.has(normalizedStatus) ? normalizedStatus : "new";
}

function promotionStatusLabel(status) {
  const allowed = new Set(["active", "paused", "archived"]);
  const normalizedStatus = normalize(status).replace(/\s+/g, "-");
  return allowed.has(normalizedStatus) ? normalizedStatus : "active";
}

function isRisingStreamer(streamer) {
  const text = normalize([streamer.tier, streamer.spotlight, streamer.specialty, streamer.pitch].join(" "));
  return text.includes("community pick") || text.includes("nominee") || text.includes("spotlight");
}

function creatorCampaignUrl(streamer) {
  return streamer?.campaignUrl || `streamer.html?id=${streamer?.id || ""}`;
}

function twitchLoginForStreamer(streamer) {
  const explicit = safeText(streamer?.twitchLogin || "", 80).replace(/^@+/, "").toLowerCase();
  if (explicit) return explicit;
  try {
    const parsed = new URL(streamer?.linkUrl || "");
    if (!/(^|\.)twitch\.tv$/i.test(parsed.hostname)) return "";
    return safeText(parsed.pathname.replace(/^\/+/, "").split("/")[0] || "", 80).toLowerCase();
  } catch {
    return "";
  }
}

function twitchThumbnailUrl(value, width = 640, height = 360) {
  return String(value || "").replace("{width}", String(width)).replace("{height}", String(height));
}

function twitchCredentialsConfigured() {
  return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

async function twitchAppToken() {
  if (!twitchCredentialsConfigured()) return "";
  const now = Date.now();
  if (twitchTokenCache.token && twitchTokenCache.expiresAt > now + 60 * 1000) {
    return twitchTokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials",
  });
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`Twitch token request failed with ${response.status}`);
  const result = await response.json();
  twitchTokenCache = {
    token: result.access_token || "",
    expiresAt: now + Math.max(60, Number(result.expires_in || 0) - 60) * 1000,
  };
  return twitchTokenCache.token;
}

async function fetchTwitchLiveStatus(logins) {
  const uniqueLogins = Array.from(new Set((logins || []).map((login) => safeText(login, 80).toLowerCase()).filter(Boolean))).slice(0, 100);
  if (!uniqueLogins.length || !twitchCredentialsConfigured()) return new Map();

  const cacheKey = uniqueLogins.slice().sort().join(",");
  const now = Date.now();
  if (twitchLiveCache.key === cacheKey && twitchLiveCache.expiresAt > now) {
    return twitchLiveCache.data;
  }

  const token = await twitchAppToken();
  if (!token) return new Map();

  const url = new URL("https://api.twitch.tv/helix/streams");
  uniqueLogins.forEach((login) => url.searchParams.append("user_login", login));
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID,
    },
  });
  if (!response.ok) throw new Error(`Twitch streams request failed with ${response.status}`);

  const result = await response.json();
  const liveMap = new Map();
  (result.data || []).forEach((item) => {
    const login = safeText(item.user_login || "", 80).toLowerCase();
    if (!login) return;
    liveMap.set(login, {
      isLive: item.type === "live",
      title: item.title || "",
      gameName: item.game_name || "",
      viewerCount: Number(item.viewer_count || 0),
      startedAt: item.started_at || "",
      thumbnailUrl: twitchThumbnailUrl(item.thumbnail_url, 640, 360),
      checkedAt: new Date().toISOString(),
      source: "twitch",
    });
  });

  twitchLiveCache = {
    key: cacheKey,
    expiresAt: now + 60 * 1000,
    data: liveMap,
  };
  return liveMap;
}

async function enrichStreamersWithTwitchStatus(streamers = []) {
  const base = streamers.map((streamer) => {
    const twitchLogin = twitchLoginForStreamer(streamer);
    return {
      ...streamer,
      twitchLogin,
      liveStageEnabled: streamer.liveStageEnabled !== false,
    };
  });

  const logins = base.map((streamer) => streamer.twitchLogin).filter(Boolean);
  let liveMap = new Map();
  let error = "";
  try {
    liveMap = await fetchTwitchLiveStatus(logins);
  } catch (twitchError) {
    error = safeText(twitchError.message || "Twitch live status is unavailable.", 160);
  }

  return base.map((streamer) => {
    const liveStatus = streamer.twitchLogin ? liveMap.get(streamer.twitchLogin) : null;
    return {
      ...streamer,
      liveStatus: liveStatus || {
        isLive: false,
        title: "",
        gameName: "",
        viewerCount: 0,
        thumbnailUrl: "",
        checkedAt: liveMap.size ? new Date().toISOString() : "",
        source: twitchCredentialsConfigured() ? "twitch" : "not_configured",
        error,
      },
    };
  });
}

function defaultCreatorSpotlightConfig() {
  return [
    {
      streamerId: "cohhcarnage",
      slotKey: "spotlight-lead",
      slotLabel: "Editorial Pick",
      slotDescription: "A polished variety creator who gives GCX a strong front-door creator signal.",
    },
    {
      streamerId: "lirik",
      slotKey: "spotlight-community",
      slotLabel: "Variety Pick",
      slotDescription: "A broad gaming channel for discovery, reactions, and what people are playing now.",
    },
    {
      streamerId: "shroud",
      slotKey: "spotlight-owner",
      slotLabel: "FPS Pick",
      slotDescription: "A skill-first competitive creator built for highlights and FPS conversation.",
    },
    {
      streamerId: "itmejp",
      slotKey: "spotlight-conversation",
      slotLabel: "Community Host",
      slotDescription: "A discussion-friendly creator fit for gaming culture, interviews, and community context.",
    },
    {
      streamerId: "gamesdonequick",
      slotKey: "spotlight-event",
      slotLabel: "Speedrun Pick",
      slotDescription: "Event-scale gaming culture that can drive watch parties and community moments.",
    },
    {
      streamerId: "iitztimmy",
      slotKey: "spotlight-competitive",
      slotLabel: "Competitive Pick",
      slotDescription: "High-energy competitive streaming with strong clip and discovery potential.",
    },
  ];
}

function buildCreatorSpotlight(data) {
  const ranked = [...(data.streamers || [])]
    .map((streamer) => ({
      ...streamer,
      campaignUrl: creatorCampaignUrl(streamer),
    }))
    .sort((a, b) => Number(b.weeklyVotes || b.votes || 0) - Number(a.weeklyVotes || a.votes || 0));
  const byId = new Map(ranked.map((streamer) => [streamer.id, streamer]));
  const configuredSlots = Array.isArray(data.creatorSpotlight) && data.creatorSpotlight.length ? data.creatorSpotlight : defaultCreatorSpotlightConfig();
  const usedIds = new Set();

  const resolved = configuredSlots
    .slice(0, 6)
    .map((slot, index) => {
      const streamer = byId.get(slot.streamerId);
      if (!streamer || usedIds.has(streamer.id)) return null;
      usedIds.add(streamer.id);
      return {
        ...streamer,
        slotKey: slot.slotKey || `spotlight-${index + 1}`,
        slotLabel: slot.slotLabel || slot.label || streamer.spotlight || `Creator Spotlight ${index + 1}`,
        slotDescription: slot.slotDescription || slot.description || streamer.pitch || streamer.specialty || "",
        spotlightOrder: index + 1,
      };
    })
    .filter(Boolean);

  ranked.forEach((streamer) => {
    if (resolved.length >= 6 || usedIds.has(streamer.id)) return;
    usedIds.add(streamer.id);
    resolved.push({
      ...streamer,
      slotKey: `spotlight-${resolved.length + 1}`,
      slotLabel: streamer.spotlight || `Creator Spotlight ${resolved.length + 1}`,
      slotDescription: streamer.pitch || streamer.specialty || "",
      spotlightOrder: resolved.length + 1,
    });
  });

  return resolved.slice(0, 6);
}

function buildStreamerSlots(data) {
  const creatorSpotlight = buildCreatorSpotlight(data);
  if (creatorSpotlight.length) {
    return {
      popular: creatorSpotlight[0] || null,
      rising: creatorSpotlight[1] || null,
      third: creatorSpotlight[2] || null,
      selected: creatorSpotlight,
    };
  }

  const ranked = [...(data.streamers || [])]
    .map((streamer) => ({
      ...streamer,
      campaignUrl: creatorCampaignUrl(streamer),
    }))
    .sort((a, b) => Number(b.weeklyVotes || b.votes || 0) - Number(a.weeklyVotes || a.votes || 0));
  const rising = ranked.find(isRisingStreamer) || ranked[1] || ranked[0] || null;
  const popular = ranked.find((streamer) => streamer.id !== rising?.id && !isRisingStreamer(streamer)) || ranked.find((streamer) => streamer.id !== rising?.id) || ranked[0] || null;

  return {
    popular: popular
      ? {
          ...popular,
          slotKey: "spotlight-lead",
          slotLabel: data.campaign?.popularSlot || "Lead Creator Highlight",
          slotDescription: "A lead creator highlight built to pull viewers into GCX voting, game libraries, cards, and sponsor paths.",
        }
      : null,
    rising: rising
      ? {
          ...rising,
          slotKey: "spotlight-community",
          slotLabel: data.campaign?.risingSlot || "Community Creator Highlight",
          slotDescription: "A community creator highlight designed to let viewers campaign, invite voters, and discover GCX together.",
        }
      : null,
  };
}

function buildSpotlightHistory(data) {
  return [...(data.spotlightHistory || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((week) => ({
      ...week,
      featuredCreators: Array.isArray(week.featuredCreators)
        ? week.featuredCreators
        : [week.popularWinner, week.risingWinner].filter(Boolean),
      popularWinner: week.popularWinner || null,
      risingWinner: week.risingWinner || null,
    }));
}

function closeStreamerWeek(data, options = {}) {
  const creatorSpotlight = buildCreatorSpotlight(data);
  const slots = buildStreamerSlots(data);
  const now = new Date().toISOString();
  const weekLabel = safeText(options.weekLabel || data.campaign?.weekLabel || "Current voting week", 80);
  const historyId = `spotlight-week-${slugify(weekLabel) || Date.now()}`;
  const winnerPayload = (streamer) =>
    streamer
      ? {
          id: streamer.id,
          name: streamer.name,
          handle: streamer.handle,
          campaignUrl: streamer.campaignUrl || `streamer.html?id=${streamer.id}`,
          imageUrl: streamer.imageUrl || "",
          weeklyVotes: Number(streamer.weeklyVotes || 0),
        }
      : null;

  const historyItem = {
    id: historyId,
    weekLabel,
    featuredCreators: creatorSpotlight.map(winnerPayload).filter(Boolean),
    popularWinner: winnerPayload(slots.popular),
    risingWinner: winnerPayload(slots.rising),
    summary: safeText(
      options.summary ||
        `${creatorSpotlight.map((streamer) => streamer.name).filter(Boolean).join(", ") || "The featured creators"} closed the GCX weekly creator spotlight.`,
      360
    ),
    createdAt: now,
  };

  const existingIndex = (data.spotlightHistory || []).findIndex((item) => item.id === historyItem.id || item.weekLabel === historyItem.weekLabel);
  if (existingIndex >= 0) {
    data.spotlightHistory[existingIndex] = historyItem;
  } else {
    data.spotlightHistory.unshift(historyItem);
  }

  (data.streamers || []).forEach((streamer) => {
    streamer.previousWeeklyVotes = Number(streamer.weeklyVotes || 0);
    streamer.weeklyVotes = 0;
    streamer.lastWeekClosedAt = now;
  });

  if (options.nextWeekLabel) {
    data.campaign = {
      ...(data.campaign || {}),
      weekLabel: safeText(options.nextWeekLabel, 80),
    };
  }

  return {
    historyItem,
    slots,
    streamers: data.streamers || [],
  };
}

function createStreamerFromNomination(data, nomination) {
  const streamerId = slugify(nomination.name) || `creator-${Date.now()}`;
  const existing = (data.streamers || []).find(
    (streamer) => streamer.id === streamerId || normalize(streamer.name) === normalize(nomination.name)
  );

  if (existing) return existing;

  const streamer = {
    id: streamerId,
    name: safeText(nomination.name, 80),
    handle: safeText(nomination.handle || `@${streamerId}`, 50),
    tier: "Nominee",
    specialty: safeText(nomination.specialty || "Community-nominated gaming and collecting creator", 220),
    platforms: Array.isArray(nomination.platforms) && nomination.platforms.length ? nomination.platforms : ["Community nominated"],
    linkUrl: safeUrl(nomination.linkUrl),
    imageUrl: safeUrl(nomination.imageUrl || "") || "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1100&q=80",
    votes: 0,
    weeklyVotes: 0,
    spotlight: "Voting Pool",
    campaignUrl: `streamer.html?id=${streamerId}`,
    pitch: safeText(nomination.specialty || `${nomination.name} was nominated by the GCX community for a future streamer spotlight.`, 260),
    audienceSize: safeText(nomination.audienceSize || "", 120),
    categories: Array.isArray(nomination.categories) ? nomination.categories : [],
    nominationId: nomination.id,
    createdAt: new Date().toISOString(),
    status: "active",
  };

  data.streamers.unshift(streamer);
  return streamer;
}

function friendshipBetween(data, profileId, otherProfileId) {
  return (data.friendships || []).find(
    (friendship) =>
      (friendship.requesterId === profileId && friendship.addresseeId === otherProfileId) ||
      (friendship.requesterId === otherProfileId && friendship.addresseeId === profileId)
  );
}

function friendshipStatusForViewer(data, profileId, viewerId) {
  if (!viewerId || profileId === viewerId) return "self";
  const friendship = friendshipBetween(data, profileId, viewerId);
  if (!friendship) return "none";
  if (friendship.status === "accepted") return "friends";
  if (friendship.status === "pending" && friendship.requesterId === viewerId) return "sent";
  if (friendship.status === "pending" && friendship.addresseeId === viewerId) return "received";
  return friendship.status || "none";
}

function findDirectThread(data, profileA, profileB) {
  return (data.messageThreads || []).find(
    (thread) =>
      (thread.type || "direct") === "direct" &&
      Array.isArray(thread.participantIds) &&
      thread.participantIds.includes(profileA) &&
      thread.participantIds.includes(profileB)
  );
}

function messageThreadSummary(data, thread, viewerId) {
  const messages = (data.messages || [])
    .filter((message) => message.threadId === thread.id)
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const latest = messages[messages.length - 1] || null;
  const participants = (thread.participantIds || [])
    .map((id) => data.profiles.find((profile) => profile.id === id))
    .filter(Boolean);
  const otherParticipants = participants.filter((profile) => profile.id !== viewerId);

  return {
    ...thread,
    participants,
    otherParticipants,
    latestMessage: latest,
    messageCount: messages.length,
    unreadCount: messages.filter((message) => message.senderId !== viewerId && !(message.readBy || []).includes(viewerId)).length,
  };
}

function buildCommunityGrowthData(data) {
  const publishedPosts = data.posts.filter(isPublicCommunityPost);
  const publishedComments = data.comments.filter((comment) => (comment.status || "published") === "published");
  const activeProfiles = data.profiles.filter((profile) => (profile.status || "active") === "active");
  const reportedPosts = data.posts.filter((post) => Number(post.reports || 0) > 0 || (post.status || "published") !== "published");
  const reportedComments = data.comments.filter((comment) => Number(comment.reports || 0) > 0 || (comment.status || "published") !== "published");
  const pendingNominations = data.nominations.filter((nomination) => nomination.status === "pending_review");
  const totalLikes = publishedPosts.reduce((sum, post) => sum + Number(post.likes || 0), 0);
  const photoPosts = publishedPosts.filter((post) => post.imageUrl);
  const totalVotes = data.streamers.reduce((sum, streamer) => sum + Number(streamer.votes || 0), 0);
  const weeklyVotes = data.streamers.reduce((sum, streamer) => sum + Number(streamer.weeklyVotes || 0), 0);
  const trafficSummary = summarizeTrafficEvents(data.trafficEvents || []);
  const openSponsorLeads = (data.sponsorLeads || []).filter((lead) => (lead.status || "new") !== "archived");
  const activePromotionList = activePromotions(data);
  const acceptedFriendships = (data.friendships || []).filter((friendship) => friendship.status === "accepted");
  const pendingFriendships = (data.friendships || []).filter((friendship) => friendship.status === "pending");
  const activeThreads = (data.messageThreads || []).filter((thread) => (thread.status || "active") === "active");
  const upcomingEvents = (data.events || []).filter((event) => (event.status || "scheduled") === "scheduled" && new Date(event.startsAt || 0).getTime() >= Date.now() - 24 * 60 * 60 * 1000);
  const activeRsvps = (data.eventRsvps || []).filter((rsvp) => (rsvp.status || "going") !== "cancelled");
  const totalReactions = publishedPosts.reduce((sum, post) => {
    const reactions = normalizePostReactions(post);
    return sum + Object.values(reactions).reduce((reactionSum, count) => reactionSum + Number(count || 0), 0);
  }, 0);
  const topicStats = data.topics
    .map((topic) => ({
      id: topic.id,
      label: topic.label,
      description: topic.description,
      url: topic.url,
      postCount: publishedPosts.filter((post) => topicMatchesPost(topic, post)).length,
    }))
    .sort((a, b) => b.postCount - a.postCount || a.label.localeCompare(b.label));
  const streamerLeaderboard = [...data.streamers]
    .sort((a, b) => Number(b.weeklyVotes || b.votes || 0) - Number(a.weeklyVotes || a.votes || 0))
    .map((streamer, index) => ({
      id: streamer.id,
      rank: index + 1,
      name: streamer.name,
      handle: streamer.handle,
      spotlight: streamer.spotlight,
      tier: streamer.tier,
      weeklyVotes: Number(streamer.weeklyVotes || 0),
      totalVotes: Number(streamer.votes || 0),
      campaignUrl: streamer.campaignUrl || `streamers.html?creator=${streamer.id}`,
    }));
  const streamerSlots = buildStreamerSlots(data);
  const creatorSpotlight = buildCreatorSpotlight(data);
  const spotlightHistory = buildSpotlightHistory(data);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      profiles: activeProfiles.length,
      posts: publishedPosts.length,
      photoPosts: photoPosts.length,
      comments: publishedComments.length,
      reactions: totalReactions,
      follows: data.follows.length,
      savedPosts: (data.savedPosts || []).length,
      friends: acceptedFriendships.length,
      friendRequests: pendingFriendships.length,
      messageThreads: activeThreads.length,
      messages: (data.messages || []).length,
      upcomingEvents: upcomingEvents.length,
      eventRsvps: activeRsvps.length,
      notifications: data.notifications.length,
      topics: data.topics.length,
      groups: data.groups.length,
      groupMemberships: data.groupMemberships.length,
      activity: (data.activity || []).length,
      streamers: data.streamers.length,
      trafficEvents: trafficSummary.totalEvents,
      sponsorLeads: openSponsorLeads.length,
      activePromotions: activePromotionList.length,
      totalStreamerVotes: totalVotes,
      weeklyStreamerVotes: weeklyVotes,
      nominations: data.nominations.length,
      openModeration: reportedPosts.length + reportedComments.length + pendingNominations.length,
    },
    engagement: {
      totalLikes,
      commentsPerPost: publishedPosts.length ? Number((publishedComments.length / publishedPosts.length).toFixed(2)) : 0,
      avgLikesPerPost: publishedPosts.length ? Number((totalLikes / publishedPosts.length).toFixed(2)) : 0,
      reactionsPerPost: publishedPosts.length ? Number((totalReactions / publishedPosts.length).toFixed(2)) : 0,
      photoPostPct: publishedPosts.length ? Math.round((photoPosts.length / publishedPosts.length) * 100) : 0,
      followDensity: activeProfiles.length ? Number((data.follows.length / activeProfiles.length).toFixed(2)) : 0,
      friendDensity: activeProfiles.length ? Number(((acceptedFriendships.length * 2) / activeProfiles.length).toFixed(2)) : 0,
    },
    topics: topicStats,
    trendingPosts: buildTrendingPosts(data, defaultCommunityProfileId(data), 6),
    groups: data.groups
      .filter((group) => (group.status || "active") === "active")
      .map((group) => ({
        id: group.id,
        name: group.name,
        category: group.category,
        description: group.description,
        memberCount: Number(group.memberCount || 0),
        postCount: publishedPosts.filter((post) => groupMatchesPost(group, post)).length,
        url: `community-groups.html?group=${encodeURIComponent(group.id)}`,
      }))
      .sort((a, b) => b.postCount - a.postCount || b.memberCount - a.memberCount),
    streamerLeaderboard,
    streamerSlots,
    creatorSpotlight,
    spotlightHistory,
    referralLeaderboard: buildReferralLeaderboard(data),
    moderation: {
      posts: reportedPosts.length,
      comments: reportedComments.length,
      nominations: pendingNominations.length,
    },
    traffic: trafficSummary,
    sponsorLeads: {
      total: openSponsorLeads.length,
      latest: [...openSponsorLeads].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6),
      byPackage: Object.entries(
        openSponsorLeads.reduce((counts, lead) => {
          const packageName = lead.packageInterest || "General";
          counts[packageName] = (counts[packageName] || 0) + 1;
          return counts;
        }, {})
      )
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      byStatus: Object.entries(
        (data.sponsorLeads || []).reduce((counts, lead) => {
          const status = sponsorLeadStatusLabel(lead.status);
          counts[status] = (counts[status] || 0) + 1;
          return counts;
        }, {})
      )
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    },
    promotions: {
      active: activePromotionList.length,
      latest: [...(data.promotions || [])]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        .slice(0, 8),
      byStatus: Object.entries(
        (data.promotions || []).reduce((counts, promotion) => {
          const status = promotionStatusLabel(promotion.status);
          counts[status] = (counts[status] || 0) + 1;
          return counts;
        }, {})
      )
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      byPlacement: Object.entries(
        activePromotionList.reduce((counts, promotion) => {
          const placement = promotion.placement || "community-feed";
          counts[placement] = (counts[placement] || 0) + 1;
          return counts;
        }, {})
      )
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    },
    events: {
      upcoming: upcomingEvents
        .map((event) => ({
          ...event,
          rsvpCount: activeRsvps.filter((rsvp) => rsvp.eventId === event.id).length,
        }))
        .sort((a, b) => new Date(a.startsAt || 0) - new Date(b.startsAt || 0))
        .slice(0, 6),
      byType: Object.entries(
        upcomingEvents.reduce((counts, event) => {
          const type = event.type || "Community";
          counts[type] = (counts[type] || 0) + 1;
          return counts;
        }, {})
      )
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    },
    campaign: data.campaign,
    sponsorPackages: buildSponsorPackages(data),
    campaignKit: [
      {
        title: "Streamer vote push",
        audience: "Creators and viewers",
        copy: `Vote for this week's GCX streamer spotlight and help decide which creators get featured next. ${data.campaign.weekLabel || ""}`.trim(),
        url: "streamers.html",
      },
      {
        title: "Card collector prompt",
        audience: "Pokemon and TCG collectors",
        copy: "Show your latest pulls, condition-check a card, or compare market context with the GCX card community.",
        url: "pokemon.html",
      },
      {
        title: "Retro library prompt",
        audience: "Game collectors",
        copy: "Pick a console library, find a game worth replaying, and share your shelf, pickup, or hidden-gem recommendation in the GCX feed.",
        url: "games.html",
      },
    ],
    nextActions: [
      {
        title: "Push the weekly creator spotlight",
        body: "Use the six creator highlight cards as the recurring reason creators send viewers back to GCX.",
        url: "streamers.html",
      },
      {
        title: "Turn active topics into entry points",
        body: "Promote the highest-posting topics on the community feed and route them into card, game, and marketplace pages.",
        url: "community.html",
      },
      {
        title: "Watch moderation before public launch",
        body: "Keep reported posts, comments, and pending nominations visible so the community can scale without getting messy.",
        url: "community-admin.html",
      },
    ],
  };
}

function getFieldValue(item, fieldPath) {
  return fieldPath.split(".").reduce((value, key) => value?.[key], item);
}

function comparePokemonValues(a, b, fieldPath) {
  const valueA = getFieldValue(a, fieldPath);
  const valueB = getFieldValue(b, fieldPath);

  if (fieldPath.toLowerCase().includes("date")) {
    return new Date(valueA || 0) - new Date(valueB || 0);
  }

  return String(valueA || "").localeCompare(String(valueB || ""), undefined, { numeric: true });
}

function sortPokemonItems(items, orderBy) {
  if (!orderBy) return items;

  const descending = orderBy.startsWith("-");
  const fieldPath = descending ? orderBy.slice(1) : orderBy;

  return [...items].sort((a, b) => {
    const result = comparePokemonValues(a, b, fieldPath);
    return descending ? -result : result;
  });
}

function parsePokemonQuery(query) {
  const filters = [];
  const pattern = /([\w.]+):("[^"]+"|\S+)/g;
  let match;

  while ((match = pattern.exec(query || ""))) {
    filters.push({
      field: match[1],
      value: match[2].replace(/^"|"$/g, ""),
    });
  }

  return filters;
}

function pokemonItemMatchesQuery(item, query) {
  const filters = parsePokemonQuery(query);
  if (!filters.length) {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    const searchText = normalize(
      [
        item.id,
        item.name,
        item.number,
        item.rarity,
        item.supertype,
        item.subtypes?.join(" "),
        item.types?.join(" "),
        item.set?.id,
        item.set?.name,
        item.set?.series,
        item.set?.printedTotal,
        item.set?.total,
        item.artist,
      ]
        .filter(Boolean)
        .join(" ")
    );
    return terms.every((term) => searchText.includes(term));
  }

  return filters.every(({ field, value }) => {
    const wildcard = value.endsWith("*");
    const needle = normalize(wildcard ? value.slice(0, -1) : value);
    const actual = normalize(getFieldValue(item, field));

    if (field === "id") {
      return actual === needle;
    }

    if (wildcard) {
      return actual.startsWith(needle) || actual.includes(needle);
    }

    if (field === "number" || field.endsWith(".id")) {
      return actual === needle;
    }

    return actual.includes(needle);
  });
}

function scorePokemonCardMatch(card, query) {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const name = normalize(card.name);
  const number = normalize(card.number);
  const setName = normalize(card.set?.name);
  const setId = normalize(card.set?.id);
  let score = 0;

  if (name === normalizedQuery) score += 1000;
  if (name.startsWith(normalizedQuery)) score += 700;
  if (name.includes(normalizedQuery)) score += 500;
  if (number === normalizedQuery) score += 250;
  if (setId === normalizedQuery) score += 160;
  if (setName.includes(normalizedQuery)) score += 90;

  for (const term of terms) {
    if (name === term) score += 90;
    if (name.startsWith(term)) score += 65;
    if (name.includes(term)) score += 45;
    if (number === term) score += 30;
    if (setId.includes(term) || setName.includes(term)) score += 12;
  }

  return score;
}

function paginatePokemonItems(items, url) {
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(250, Math.max(1, Number(url.searchParams.get("pageSize") || 250)));
  const totalCount = items.length;
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);

  return {
    data,
    page,
    pageSize,
    count: data.length,
    totalCount,
  };
}

function handleLocalPokemonData(req, res, url) {
  const localData = loadLocalPokemonData();
  if (!localData) return false;

  const route = url.pathname.replace(/^\/api\/pokemon\/?/, "");

  if (route === "manifest") {
    sendJson(
      res,
      200,
      localData.manifest || {
        setCount: localData.sets.length,
        cardCount: localData.cards.length,
      },
      {
        "X-GCX-Data-Source": "local",
      }
    );
    return true;
  }

  if (route === "sets") {
    const ordered = sortPokemonItems(localData.sets, url.searchParams.get("orderBy"));
    sendJson(res, 200, paginatePokemonItems(ordered, url), {
      "X-GCX-Data-Source": "local",
    });
    return true;
  }

  if (route === "cards") {
    const query = url.searchParams.get("q") || "";
    const filtered = localData.cards.filter((card) => pokemonItemMatchesQuery(card, query));
    const orderBy = url.searchParams.get("orderBy");
    const ordered = orderBy
      ? sortPokemonItems(filtered, orderBy)
      : filtered.sort((a, b) => scorePokemonCardMatch(b, query) - scorePokemonCardMatch(a, query) || a.name.localeCompare(b.name) || String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));

    sendJson(res, 200, cardApiPayload(ordered, url, "pokemon", paginatePokemonItems), {
      "X-GCX-Data-Source": "local",
    });
    return true;
  }

  if (route.startsWith("cards/")) {
    const cardId = decodeURIComponent(route.slice("cards/".length));
    const card = localData.cardById.get(cardId);

    if (!card) {
      sendJson(res, 404, { error: "Card not found." }, { "X-GCX-Data-Source": "local" });
      return true;
    }

    sendJson(res, 200, { data: enrichCardIdentity(card, "pokemon") }, { "X-GCX-Data-Source": "local" });
    return true;
  }

  return false;
}

function magicCardMatchesQuery(card, query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  return terms.every((term) => normalize(card.searchText).includes(term));
}

function scoreMagicCardMatch(card, query) {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const name = normalize(card.name);
  const set = normalize(card.set);
  const setName = normalize(card.setName);
  const collectorNumber = normalize(card.collectorNumber);
  const typeLine = normalize(card.typeLine);
  let score = 0;

  if (name === normalizedQuery) score += 1000;
  if (name.startsWith(normalizedQuery)) score += 700;
  if (name.includes(normalizedQuery)) score += 500;
  if (collectorNumber === normalizedQuery) score += 240;
  if (set === normalizedQuery) score += 200;
  if (setName.includes(normalizedQuery)) score += 90;
  if (typeLine.includes(normalizedQuery)) score += 60;

  for (const term of terms) {
    if (name === term) score += 90;
    if (name.startsWith(term)) score += 65;
    if (name.includes(term)) score += 45;
    if (collectorNumber === term) score += 25;
    if (set.includes(term) || setName.includes(term)) score += 12;
  }

  return score;
}

function paginateMagicItems(items, url) {
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 40)));
  const totalCount = items.length;
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);

  return {
    data,
    page,
    pageSize,
    count: data.length,
    totalCount,
  };
}

function handleLocalMagicData(req, res, url) {
  const localData = loadLocalMagicData();
  if (!localData) return false;

  const route = url.pathname.replace(/^\/api\/magic\/?/, "");

  if (route === "manifest") {
    sendJson(res, 200, localData.manifest || { setCount: localData.sets.length, cardCount: localData.cards.length }, {
      "X-GCX-Data-Source": "local",
    });
    return true;
  }

  if (route === "sets") {
    sendJson(res, 200, paginateMagicItems(localData.sets, url), {
      "X-GCX-Data-Source": "local",
    });
    return true;
  }

  if (route === "cards") {
    const query = url.searchParams.get("q") || "";
    const filtered = localData.cards
      .filter((card) => magicCardMatchesQuery(card, query))
      .sort((a, b) => scoreMagicCardMatch(b, query) - scoreMagicCardMatch(a, query) || a.name.localeCompare(b.name) || String(a.collectorNumber).localeCompare(String(b.collectorNumber), undefined, { numeric: true }));
    sendJson(res, 200, cardApiPayload(filtered, url, "magic", paginateMagicItems), {
      "X-GCX-Data-Source": "local",
    });
    return true;
  }

  if (route.startsWith("sets/")) {
    const setCode = decodeURIComponent(route.slice("sets/".length)).toLowerCase();
    const cards = readJsonIfExists(path.join(magicDataDir, "cards-by-set", `${setCode}.json`));
    if (!Array.isArray(cards)) {
      sendJson(res, 404, { error: "Magic set not found." }, { "X-GCX-Data-Source": "local" });
      return true;
    }
    const deduped = dedupeCardsForResponse(cards, "magic");
    sendJson(
      res,
      200,
      {
        data: deduped.data,
        count: deduped.data.length,
        totalCount: deduped.data.length,
        warnings: deduped.duplicates.length ? [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden by canonical card identity`] : [],
      },
      { "X-GCX-Data-Source": "local" }
    );
    return true;
  }

  return false;
}

function yugiohCardMatchesQuery(card, query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  return terms.every((term) => normalize(card.searchText).includes(term));
}

function scoreYugiohCardMatch(card, query) {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const name = normalize(card.name);
  const setCode = normalize(card.setCode);
  const setName = normalize(card.setName);
  const type = normalize(card.type);
  let score = 0;

  if (name === normalizedQuery) score += 1000;
  if (name.startsWith(normalizedQuery)) score += 700;
  if (name.includes(normalizedQuery)) score += 500;
  if (setCode === normalizedQuery) score += 320;
  if (setCode.includes(normalizedQuery)) score += 180;
  if (setName.includes(normalizedQuery)) score += 90;
  if (type.includes(normalizedQuery)) score += 60;

  for (const term of terms) {
    if (name === term) score += 90;
    if (name.startsWith(term)) score += 65;
    if (name.includes(term)) score += 45;
    if (setCode.includes(term)) score += 20;
    if (setName.includes(term)) score += 10;
  }

  return score;
}

function paginateYugiohItems(items, url) {
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 40)));
  const totalCount = items.length;
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);

  return {
    data,
    page,
    pageSize,
    count: data.length,
    totalCount,
  };
}

function handleLocalYugiohData(req, res, url) {
  const localData = loadLocalYugiohData();
  if (!localData) return false;

  const route = url.pathname.replace(/^\/api\/yugioh\/?/, "");

  if (route === "manifest") {
    sendJson(res, 200, localData.manifest || { setCount: localData.sets.length, cardCount: localData.cards.length }, {
      "X-GCX-Data-Source": "local",
    });
    return true;
  }

  if (route === "sets") {
    sendJson(res, 200, paginateYugiohItems(localData.sets, url), {
      "X-GCX-Data-Source": "local",
    });
    return true;
  }

  if (route === "cards") {
    const query = url.searchParams.get("q") || "";
    const filtered = localData.cards
      .filter((card) => yugiohCardMatchesQuery(card, query))
      .sort((a, b) => scoreYugiohCardMatch(b, query) - scoreYugiohCardMatch(a, query) || a.name.localeCompare(b.name) || String(a.setCode).localeCompare(String(b.setCode), undefined, { numeric: true }));
    sendJson(res, 200, cardApiPayload(filtered, url, "yugioh", paginateYugiohItems), {
      "X-GCX-Data-Source": "local",
    });
    return true;
  }

  if (route.startsWith("sets/")) {
    const setId = decodeURIComponent(route.slice("sets/".length)).toLowerCase();
    const cards = readJsonIfExists(path.join(yugiohDataDir, "cards-by-set", `${setId}.json`));
    if (!Array.isArray(cards)) {
      sendJson(res, 404, { error: "Yu-Gi-Oh! set not found." }, { "X-GCX-Data-Source": "local" });
      return true;
    }
    const deduped = dedupeCardsForResponse(cards, "yugioh");
    sendJson(
      res,
      200,
      {
        data: deduped.data,
        count: deduped.data.length,
        totalCount: deduped.data.length,
        warnings: deduped.duplicates.length ? [`DUPLICATE_RENDER_ON_PAGE: ${deduped.duplicates.length} hidden by canonical card identity`] : [],
      },
      { "X-GCX-Data-Source": "local" }
    );
    return true;
  }

  return false;
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchUpstreamJson(upstreamUrl, headers, attempts = 3) {
  let lastResult;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const upstreamResponse = await fetch(upstreamUrl, { headers });
    const text = await upstreamResponse.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      data = {
        error: `Pokemon API returned non-JSON response with status ${upstreamResponse.status}`,
      };
    }

    lastResult = {
      ok: upstreamResponse.ok,
      status: upstreamResponse.status,
      data,
    };

    if (upstreamResponse.ok || upstreamResponse.status < 500 || attempt === attempts) {
      return lastResult;
    }

    await wait(350 * attempt);
  }

  return lastResult;
}

async function handlePokemonProxy(req, res, url) {
  if (handleLocalPokemonData(req, res, url)) {
    return;
  }

  const route = url.pathname.replace(/^\/api\/pokemon\/?/, "");

  if (!route || route.includes("..")) {
    sendJson(res, 400, { error: "Invalid Pokemon API route." });
    return;
  }

  const upstreamUrl = new URL(`${pokemonApiBase}/${route}`);
  url.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const cacheKey = upstreamUrl.toString();
  const cached = readCache(cacheKey);

  if (cached?.fresh) {
    sendJson(res, 200, cached.data, {
      "X-GCX-Cache": "hit",
    });
    return;
  }

  try {
    const headers = {
      Accept: "application/json",
      "User-Agent": "GamesCardsExchange/0.1",
    };

    if (process.env.POKEMON_TCG_API_KEY) {
      headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
    }

    const upstream = await fetchUpstreamJson(upstreamUrl, headers);

    if (!upstream.ok) {
      if (cached?.data) {
        sendJson(res, 200, cached.data, {
          "X-GCX-Cache": "stale",
          "X-GCX-Upstream-Status": String(upstream.status),
        });
        return;
      }

      sendJson(res, upstream.status, upstream.data, {
        "X-GCX-Cache": "miss",
      });
      return;
    }

    writeCache(cacheKey, upstream.data);
    sendJson(res, 200, upstream.data, {
      "X-GCX-Cache": "miss",
    });
  } catch (error) {
    if (cached?.data) {
      sendJson(res, 200, cached.data, {
        "X-GCX-Cache": "stale",
      });
      return;
    }

    console.warn(`Pokemon upstream request failed: ${error.message}`);
    sendJson(res, 502, {
      error: "Pokemon data could not be loaded right now.",
      detail: "The upstream card data source did not respond successfully.",
    });
  }
}

async function handleCommunityApi(req, res, url) {
  const route = url.pathname.replace(/^\/api\/community\/?/, "");
  const data = loadCommunityData();
  const viewerId = safeText(url.searchParams.get("viewerId") || "profile-gcx-member", 100) || defaultCommunityProfileId(data);

  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && route !== "traffic" && route !== "sponsor-leads") {
    const limit = communityWriteRateLimit(req, route);
    if (!limit.ok) {
      sendRateLimitExceeded(res, limit, limit.message);
      return;
    }
  }

  if (req.method === "POST" && route === "traffic") {
    try {
      const limit = rateLimit(req, "traffic", 120, 1000 * 60 * 10);
      if (!limit.ok) {
        sendRateLimitExceeded(res, limit, "Too many tracking events. Try again later.");
        return;
      }
      const body = await readRequestJson(req);
      const event = {
        id: `traffic-${Date.now()}-${slugify(body.type || "event")}`,
        type: safeText(body.type || "visit", 40),
        source: safeText(body.source || "site", 80),
        targetType: safeText(body.targetType || "page", 60),
        targetId: safeText(body.targetId || "", 120),
        ref: safeText(body.ref || "direct", 120),
        path: safeText(body.path || "", 180),
        campaignUrl: safeUrl(body.campaignUrl || ""),
        createdAt: new Date().toISOString(),
      };

      data.trafficEvents.unshift(event);
      data.trafficEvents = data.trafficEvents.slice(0, 500);
      saveCommunityData(data);
      sendJson(res, 201, { data: event, summary: summarizeTrafficEvents(data.trafficEvents) }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "promotions") {
    const placement = safeText(url.searchParams.get("placement") || "", 80);
    const promotions = activePromotions(data, placement);
    sendJson(res, 200, { data: promotions, totalCount: promotions.length }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "POST" && route === "promotions") {
    try {
      const auth = await requireStaff(req, res, data, "create sponsored placements");
      if (!auth) return;
      const body = await readRequestJson(req);
      const sponsorName = safeText(body.sponsorName || body.company, 120);
      const title = safeText(body.title, 140);
      const destinationUrl = safeUrl(body.destinationUrl || body.url);

      if (!sponsorName || !title || !destinationUrl) {
        sendJson(res, 400, { error: "Sponsor name, title, and destination URL are required." });
        return;
      }

      const promotion = {
        id: `promotion-${Date.now()}-${slugify(title) || "placement"}`,
        sponsorName,
        title,
        body: safeText(body.body || "", 420),
        imageUrl: safeUrl(body.imageUrl || ""),
        destinationUrl,
        placement: safeText(body.placement || "community-feed", 80),
        packageType: safeText(body.packageType || "Sponsored community placement", 120),
        ctaLabel: safeText(body.ctaLabel || "Open sponsor offer", 60),
        priority: Number(body.priority || 1),
        startsAt: safeText(body.startsAt || new Date().toISOString(), 40),
        endsAt: safeText(body.endsAt || "", 40),
        status: "active",
        clicks: 0,
        createdAt: new Date().toISOString(),
      };

      data.promotions.unshift(promotion);
      addNotification(data, defaultCommunityProfileId(data), {
        type: "promotion",
        title: `${promotion.sponsorName} promotion is active`,
        body: promotion.title,
        url: "community-growth.html",
      });
      saveCommunityData(data);
      const supabaseWrite = await persistSponsorPromotion(promotion);
      sendJson(res, 201, { data: promotion }, { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if ((req.method === "PATCH" || req.method === "PUT") && route.startsWith("promotions/")) {
    try {
      const auth = await requireStaff(req, res, data, "update sponsored placements");
      if (!auth) return;
      const promotionId = safeText(decodeURIComponent(route.replace(/^promotions\//, "")), 160);
      const promotion = data.promotions.find((item) => item.id === promotionId);
      if (!promotion) {
        sendJson(res, 404, { error: "Promotion not found." });
        return;
      }

      const body = await readRequestJson(req);
      const previousStatus = promotionStatusLabel(promotion.status);
      const nextStatus = promotionStatusLabel(body.status);
      promotion.status = nextStatus;
      promotion.updatedAt = new Date().toISOString();
      promotion.statusHistory = Array.isArray(promotion.statusHistory) ? promotion.statusHistory : [];
      promotion.statusHistory.unshift({
        from: previousStatus,
        to: nextStatus,
        note: safeText(body.note || "", 240),
        createdAt: promotion.updatedAt,
      });

      addNotification(data, defaultCommunityProfileId(data), {
        type: "promotion_status",
        title: `${promotion.sponsorName} placement ${nextStatus}`,
        body: promotion.title,
        url: "community-growth.html",
      });
      addActivity(data, {
        type: "promotion_status",
        title: `${promotion.sponsorName} placement moved to ${nextStatus}`,
        body: `${promotion.title} changed from ${previousStatus}.`,
        actorName: promotion.sponsorName,
        targetType: "promotion",
        targetId: promotion.id,
        url: "community-growth.html",
        imageUrl: promotion.imageUrl,
      });
      saveCommunityData(data);
      const supabaseWrite = await persistSponsorPromotion(promotion);
      sendJson(
        res,
        200,
        { data: promotion, performance: buildSponsorPerformance(data) },
        { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "promotions/click") {
    try {
      const body = await readRequestJson(req);
      const promotionId = safeText(body.promotionId, 120);
      const promotion = data.promotions.find((item) => item.id === promotionId);

      if (!promotion) {
        sendJson(res, 404, { error: "Promotion not found." });
        return;
      }

      promotion.clicks = Number(promotion.clicks || 0) + 1;
      promotion.lastClickedAt = new Date().toISOString();
      data.trafficEvents.unshift({
        id: `traffic-${Date.now()}-promotion-click`,
        type: "promotion_click",
        source: "promotion",
        targetType: "promotion",
        targetId: promotion.id,
        ref: safeText(body.ref || promotion.sponsorName || "sponsor", 120),
        path: safeText(body.path || "", 180),
        campaignUrl: promotion.destinationUrl,
        createdAt: new Date().toISOString(),
      });
      data.trafficEvents = data.trafficEvents.slice(0, 500);
      saveCommunityData(data);
      const supabaseWrite = await persistSponsorPromotion(promotion);
      sendJson(res, 200, { data: promotion }, { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "sponsor-leads") {
    const auth = await requireStaff(req, res, data, "view sponsor leads");
    if (!auth) return;
    const leads = [...data.sponsorLeads].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    sendJson(res, 200, { data: leads, totalCount: leads.length }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if ((req.method === "PATCH" || req.method === "PUT") && route.startsWith("sponsor-leads/")) {
    try {
      const auth = await requireStaff(req, res, data, "update sponsor leads");
      if (!auth) return;
      const leadId = safeText(decodeURIComponent(route.replace(/^sponsor-leads\//, "")), 160);
      const lead = data.sponsorLeads.find((item) => item.id === leadId);
      if (!lead) {
        sendJson(res, 404, { error: "Sponsor lead not found." });
        return;
      }

      const body = await readRequestJson(req);
      const nextStatus = sponsorLeadStatusLabel(body.status);
      const previousStatus = sponsorLeadStatusLabel(lead.status);
      lead.status = nextStatus;
      lead.updatedAt = new Date().toISOString();
      lead.statusHistory = Array.isArray(lead.statusHistory) ? lead.statusHistory : [];
      lead.statusHistory.unshift({
        from: previousStatus,
        to: nextStatus,
        note: safeText(body.note || "", 240),
        createdAt: lead.updatedAt,
      });

      addNotification(data, defaultCommunityProfileId(data), {
        type: "sponsor_pipeline",
        title: `${lead.company} moved to ${nextStatus}`,
        body: `${lead.packageInterest} lead status changed from ${previousStatus} to ${nextStatus}.`,
        url: "community-growth.html",
      });
      addActivity(data, {
        type: "sponsor_pipeline",
        title: `${lead.company} sponsor lead moved to ${nextStatus}`,
        body: `${lead.packageInterest} pipeline update from ${previousStatus}.`,
        actorName: lead.company,
        targetType: "sponsor_lead",
        targetId: lead.id,
        url: "community-growth.html",
      });
      saveCommunityData(data);
      const supabaseWrite = await persistSponsorLead(lead);
      sendJson(
        res,
        200,
        { data: lead, performance: buildSponsorPerformance(data) },
        { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "sponsor-packages") {
    const packages = buildSponsorPackages(data);
    sendJson(res, 200, { data: packages }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "GET" && route === "sponsor-performance") {
    sendJson(res, 200, { data: buildSponsorPerformance(data) }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "POST" && route === "sponsor-leads") {
    try {
      const limit = rateLimit(req, "sponsor-leads", 5, 1000 * 60 * 15);
      if (!limit.ok) {
        sendRateLimitExceeded(res, limit, "Too many sponsor inquiries. Try again later.");
        return;
      }
      const body = await readRequestJson(req);
      const name = safeText(body.name, 100);
      const email = safeText(body.email, 140);
      const company = safeText(body.company || body.channel, 120);
      const packageInterest = safeText(body.packageInterest || "Streamer spotlight sponsor", 120);

      if (!name || !email || !company) {
        sendJson(res, 400, { error: "Name, email, and company or channel are required." });
        return;
      }

      const lead = {
        id: `sponsor-${Date.now()}-${slugify(company) || "lead"}`,
        name,
        email,
        company,
        packageInterest,
        budgetRange: safeText(body.budgetRange || "", 80),
        goal: safeText(body.goal || "", 500),
        source: safeText(body.source || "sponsor-page", 80),
        ref: safeText(body.ref || "direct", 120),
        status: "new",
        createdAt: new Date().toISOString(),
      };

      data.sponsorLeads.unshift(lead);
      addNotification(data, defaultCommunityProfileId(data), {
        type: "sponsor_lead",
        title: `${lead.company} asked about sponsorship`,
        body: `${lead.packageInterest} lead from ${lead.name}.`,
        url: "community-growth.html",
      });
      addActivity(data, {
        type: "sponsor_lead",
        title: `${lead.company} asked about sponsoring GCX`,
        body: `${lead.packageInterest} inquiry from ${lead.name}.`,
        actorName: lead.company,
        targetType: "sponsor_lead",
        targetId: lead.id,
        url: "sponsors.html",
      });
      saveCommunityData(data);
      const supabaseWrite = await persistSponsorLead(lead);
      sendJson(res, 201, { data: lead }, { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "groups") {
    const publishedPosts = data.posts.filter(isPublicCommunityPost);
    const viewerMemberships = new Set(data.groupMemberships.filter((membership) => membership.profileId === viewerId).map((membership) => membership.groupId));
    const groups = data.groups
      .filter((group) => (group.status || "active") === "active")
      .map((group) => {
        const directMembers = data.groupMemberships.filter((membership) => membership.groupId === group.id).length;
        return {
          ...group,
          memberCount: Math.max(Number(group.memberCount || 0), directMembers),
          postCount: publishedPosts.filter((post) => groupMatchesPost(group, post)).length,
          isMember: viewerMemberships.has(group.id),
          feedUrl: `community.html?group=${encodeURIComponent(group.id)}`,
        };
      })
      .sort((a, b) => Number(b.postCount || 0) - Number(a.postCount || 0) || Number(b.memberCount || 0) - Number(a.memberCount || 0));

    sendJson(res, 200, { data: groups, memberships: data.groupMemberships.filter((membership) => membership.profileId === viewerId), viewerId, totalCount: groups.length }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "POST" && route === "groups/join") {
    try {
      const auth = await requireAuth(req, res, data, "join community groups");
      if (!auth) return;
      const body = await readRequestJson(req);
      const profileId = auth.profile.id;
      const groupId = safeText(body.groupId, 120);
      const profile = data.profiles.find((item) => item.id === profileId);
      const group = data.groups.find((item) => item.id === groupId && (item.status || "active") === "active");

      if (!profile || !group) {
        sendJson(res, 400, { error: "A valid profile and group are required." });
        return;
      }

      let membership = data.groupMemberships.find((item) => item.profileId === profile.id && item.groupId === group.id);
      if (!membership) {
        membership = {
          id: `membership-${slugify(profile.id)}-${slugify(group.id)}`,
          groupId: group.id,
          profileId: profile.id,
          role: "member",
          createdAt: new Date().toISOString(),
        };
        data.groupMemberships.push(membership);
        group.memberCount = Number(group.memberCount || 0) + 1;
        addNotification(data, profile.id, {
          type: "group_join",
          title: `You joined ${group.name}`,
          body: "Your community feed can now focus on posts from this group.",
          url: `community-groups.html?group=${group.id}`,
        });
        addActivity(data, {
          type: "group_join",
          title: `${profile.displayName || profile.handle} joined ${group.name}`,
          body: `More activity is building around ${group.category || "community"} discussions.`,
          profileId: profile.id,
          actorName: profile.displayName || profile.handle,
          targetType: "group",
          targetId: group.id,
          url: `community-groups.html?group=${group.id}`,
          imageUrl: group.coverUrl,
        });
      }

      saveCommunityData(data);
      sendJson(res, 200, { data: { membership, group } }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "groups/leave") {
    try {
      const auth = await requireAuth(req, res, data, "leave community groups");
      if (!auth) return;
      const body = await readRequestJson(req);
      const profileId = auth.profile.id;
      const groupId = safeText(body.groupId, 120);
      const index = data.groupMemberships.findIndex((item) => item.profileId === profileId && item.groupId === groupId);

      if (index === -1) {
        sendJson(res, 404, { error: "Group membership not found." });
        return;
      }

      data.groupMemberships.splice(index, 1);
      const group = data.groups.find((item) => item.id === groupId);
      if (group) group.memberCount = Math.max(0, Number(group.memberCount || 0) - 1);
      saveCommunityData(data);
      sendJson(res, 200, { data: { profileId, groupId } }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "profiles") {
    const profiles = [...data.profiles].filter((profile) => (profile.status || "active") === "active");
    const following = new Set(data.follows.filter((follow) => follow.followerId === viewerId).map((follow) => follow.followingId));
    const publishedPosts = data.posts.filter(isPublicCommunityPost);
    sendJson(
      res,
      200,
      {
        data: profiles.map((profile) => {
          const friendship = friendshipBetween(data, profile.id, viewerId);
          const memberships = data.groupMemberships
            .filter((membership) => membership.profileId === profile.id)
            .map((membership) => data.groups.find((group) => group.id === membership.groupId))
            .filter(Boolean)
            .slice(0, 3);
          return {
            ...publicProfile(profile),
            followers: Number(profile.followers || 0),
            following: Number(profile.following || 0),
            isFollowing: following.has(profile.id),
            isViewer: profile.id === viewerId,
            friendshipStatus: friendshipStatusForViewer(data, profile.id, viewerId),
            friendshipId: friendship?.id || "",
            postCount: publishedPosts.filter((post) => post.profileId === profile.id).length,
            savedPostCount: (data.savedPosts || []).filter((saved) => saved.profileId === profile.id).length,
            groups: memberships.map((group) => ({ id: group.id, name: group.name, category: group.category })),
          };
        }),
        viewerId,
        totalCount: profiles.length,
      },
      { "X-GCX-Data-Source": "local" }
    );
    return;
  }

  if (req.method === "POST" && route === "friends/request") {
    try {
      const auth = await requireAuth(req, res, data, "send friend requests");
      if (!auth) return;
      const body = await readRequestJson(req);
      const requesterId = auth.profile.id;
      const addresseeId = safeText(body.addresseeId, 100);
      const requester = data.profiles.find((profile) => profile.id === requesterId);
      const addressee = data.profiles.find((profile) => profile.id === addresseeId);

      if (!requester || !addressee || requester.id === addressee.id) {
        sendJson(res, 400, { error: "A valid member and friend target are required." });
        return;
      }

      let friendship = friendshipBetween(data, requester.id, addressee.id);
      if (!friendship) {
        friendship = {
          id: `friendship-${slugify(requester.id)}-${slugify(addressee.id)}`,
          requesterId: requester.id,
          addresseeId: addressee.id,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        data.friendships.push(friendship);
        addNotification(data, addressee.id, {
          type: "friend_request",
          title: `${requester.displayName || requester.handle} sent a friend request`,
          body: "Accept the request to connect both profiles in the GCX community.",
          url: `profile.html?id=${requester.id}`,
        });
        addActivity(data, {
          type: "friend_request",
          title: `${requester.displayName || requester.handle} sent a friend request`,
          body: `A new collector connection is forming with ${addressee.displayName || addressee.handle}.`,
          profileId: requester.id,
          actorName: requester.displayName || requester.handle,
          targetType: "profile",
          targetId: addressee.id,
          url: `profile.html?id=${requester.id}`,
          imageUrl: requester.avatarUrl,
        });
      }

      saveCommunityData(data);
      sendJson(res, 200, { data: friendship }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "friends/accept") {
    try {
      const auth = await requireAuth(req, res, data, "accept friend requests");
      if (!auth) return;
      const body = await readRequestJson(req);
      const friendshipId = safeText(body.friendshipId, 140);
      const requesterId = safeText(body.requesterId, 100);
      const addresseeId = auth.profile.id;
      const friendship = data.friendships.find(
        (item) => item.id === friendshipId || (item.requesterId === requesterId && item.addresseeId === addresseeId)
      );

      if (!friendship || friendship.status !== "pending") {
        sendJson(res, 404, { error: "Pending friend request not found." });
        return;
      }

      friendship.status = "accepted";
      friendship.acceptedAt = new Date().toISOString();
      addNotification(data, friendship.requesterId, {
        type: "friend_accept",
        title: "Friend request accepted",
        body: "A GCX member accepted your friend request.",
        url: `profile.html?id=${friendship.addresseeId}`,
      });
      const requester = data.profiles.find((profile) => profile.id === friendship.requesterId);
      const addressee = data.profiles.find((profile) => profile.id === friendship.addresseeId);
      addActivity(data, {
        type: "friend_accept",
        title: `${addressee?.displayName || "A GCX member"} connected with ${requester?.displayName || "another member"}`,
        body: "Friend connections help GCX become a real collecting and gaming network.",
        profileId: addressee?.id || "",
        actorName: addressee?.displayName || addressee?.handle || "",
        targetType: "friendship",
        targetId: friendship.id,
        url: `profile.html?id=${friendship.addresseeId}`,
        imageUrl: addressee?.avatarUrl || "",
      });
      saveCommunityData(data);
      sendJson(res, 200, { data: friendship }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "friends/remove") {
    try {
      const auth = await requireAuth(req, res, data, "remove friend relationships");
      if (!auth) return;
      const body = await readRequestJson(req);
      const profileId = auth.profile.id;
      const otherProfileId = safeText(body.otherProfileId, 100);
      const index = data.friendships.findIndex(
        (item) =>
          (item.requesterId === profileId && item.addresseeId === otherProfileId) ||
          (item.requesterId === otherProfileId && item.addresseeId === profileId)
      );

      if (index === -1) {
        sendJson(res, 404, { error: "Friend relationship not found." });
        return;
      }

      const [removed] = data.friendships.splice(index, 1);
      saveCommunityData(data);
      sendJson(res, 200, { data: removed }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "messages") {
    const auth = await requireAuth(req, res, data, "view messages");
    if (!auth) return;
    const viewerId = auth.profile.id;
    const threads = (data.messageThreads || [])
      .filter((thread) => (thread.status || "active") === "active" && (thread.participantIds || []).includes(viewerId))
      .map((thread) => messageThreadSummary(data, thread, viewerId))
      .sort((a, b) => new Date(b.latestMessage?.createdAt || b.updatedAt || 0) - new Date(a.latestMessage?.createdAt || a.updatedAt || 0));
    sendJson(res, 200, { data: threads, viewerId, totalCount: threads.length }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "GET" && route.startsWith("messages/")) {
    const auth = await requireAuth(req, res, data, "view messages");
    if (!auth) return;
    const viewerId = auth.profile.id;
    const threadId = decodeURIComponent(route.slice("messages/".length));
    const thread = data.messageThreads.find((item) => item.id === threadId && (item.participantIds || []).includes(viewerId));
    if (!thread) {
      sendJson(res, 404, { error: "Message thread not found." });
      return;
    }

    const messages = data.messages
      .filter((message) => message.threadId === thread.id)
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    sendJson(res, 200, { data: messageThreadSummary(data, thread, viewerId), messages }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "POST" && route === "messages") {
    try {
      const auth = await requireAuth(req, res, data, "send messages");
      if (!auth) return;
      const body = await readRequestJson(req);
      const senderId = auth.profile.id;
      const recipientId = safeText(body.recipientId, 100);
      const bodyText = safeText(body.body, 700);
      const sender = data.profiles.find((profile) => profile.id === senderId);
      const recipient = data.profiles.find((profile) => profile.id === recipientId);

      if (!sender || !recipient || sender.id === recipient.id || !bodyText) {
        sendJson(res, 400, { error: "A sender, recipient, and message body are required." });
        return;
      }

      let thread = findDirectThread(data, sender.id, recipient.id);
      if (!thread) {
        thread = {
          id: `thread-${Date.now()}-${slugify(sender.id)}-${slugify(recipient.id)}`,
          type: "direct",
          participantIds: [sender.id, recipient.id],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active",
        };
        data.messageThreads.unshift(thread);
      }

      const message = {
        id: `message-${Date.now()}-${slugify(sender.id)}`,
        threadId: thread.id,
        senderId: sender.id,
        body: bodyText,
        createdAt: new Date().toISOString(),
        readBy: [sender.id],
      };

      data.messages.push(message);
      thread.updatedAt = message.createdAt;
      addNotification(data, recipient.id, {
        type: "message",
        title: `${sender.displayName || sender.handle} sent you a message`,
        body: message.body,
        url: `community-inbox.html?thread=${thread.id}`,
      });
      saveCommunityData(data);
      sendJson(res, 201, { data: message, thread: messageThreadSummary(data, thread, sender.id) }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "messages/read") {
    try {
      const auth = await requireAuth(req, res, data, "mark messages read");
      if (!auth) return;
      const viewerId = auth.profile.id;
      const body = await readRequestJson(req);
      const threadId = safeText(body.threadId, 140);
      const thread = data.messageThreads.find((item) => item.id === threadId && (item.participantIds || []).includes(viewerId));
      if (!thread) {
        sendJson(res, 404, { error: "Message thread not found." });
        return;
      }

      data.messages.forEach((message) => {
        if (message.threadId === thread.id && !(message.readBy || []).includes(viewerId)) {
          message.readBy = [...(message.readBy || []), viewerId];
        }
      });
      saveCommunityData(data);
      sendJson(res, 200, { data: messageThreadSummary(data, thread, viewerId) }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "events") {
    const groupId = safeText(url.searchParams.get("group") || "", 120);
    const viewerRsvps = new Map(data.eventRsvps.filter((rsvp) => rsvp.profileId === viewerId && (rsvp.status || "going") !== "cancelled").map((rsvp) => [rsvp.eventId, rsvp]));
    const rsvpCounts = data.eventRsvps.reduce((counts, rsvp) => {
      if ((rsvp.status || "going") !== "cancelled") counts[rsvp.eventId] = (counts[rsvp.eventId] || 0) + 1;
      return counts;
    }, {});
    const events = data.events
      .filter((event) => (event.status || "scheduled") === "scheduled")
      .filter((event) => !groupId || event.groupId === groupId)
      .map((event) => ({
        ...event,
        group: data.groups.find((group) => group.id === event.groupId) || null,
        rsvpCount: rsvpCounts[event.id] || 0,
        viewerRsvp: viewerRsvps.get(event.id)?.status || "",
      }))
      .sort((a, b) => new Date(a.startsAt || 0) - new Date(b.startsAt || 0));
    sendJson(res, 200, { data: events, viewerId, totalCount: events.length }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "POST" && route === "events") {
    try {
      const auth = await requireAuth(req, res, data, "create events");
      if (!auth) return;
      const body = await readRequestJson(req);
      const title = safeText(body.title, 140);
      const startsAt = safeText(body.startsAt, 80);
      const hostProfileId = auth.profile.id;
      const host = data.profiles.find((profile) => profile.id === hostProfileId);

      if (!title || !startsAt || !host) {
        sendJson(res, 400, { error: "Event title, start time, and valid host are required." });
        return;
      }

      const event = {
        id: `event-${Date.now()}-${slugify(title) || "community"}`,
        title,
        type: safeText(body.type || "Community", 80),
        description: safeText(body.description || "", 600),
        startsAt,
        endsAt: safeText(body.endsAt || "", 80),
        groupId: safeText(body.groupId || "", 120),
        hostProfileId,
        linkUrl: safeUrl(body.linkUrl || ""),
        imageUrl: safeUrl(body.imageUrl || ""),
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };

      data.events.unshift(event);
      data.eventRsvps.unshift({
        id: `rsvp-${slugify(event.id)}-${slugify(hostProfileId)}`,
        eventId: event.id,
        profileId: hostProfileId,
        status: "going",
        createdAt: new Date().toISOString(),
      });
      saveCommunityData(data);
      sendJson(res, 201, { data: event }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "events/rsvp") {
    try {
      const auth = await requireAuth(req, res, data, "RSVP to events");
      if (!auth) return;
      const body = await readRequestJson(req);
      const eventId = safeText(body.eventId, 140);
      const profileId = auth.profile.id;
      const status = safeText(body.status || "going", 40);
      const event = data.events.find((item) => item.id === eventId && (item.status || "scheduled") === "scheduled");
      const profile = data.profiles.find((item) => item.id === profileId);
      const allowedStatuses = new Set(["going", "interested", "cancelled"]);

      if (!event || !profile || !allowedStatuses.has(status)) {
        sendJson(res, 400, { error: "A valid event, profile, and RSVP status are required." });
        return;
      }

      let rsvp = data.eventRsvps.find((item) => item.eventId === event.id && item.profileId === profile.id);
      if (!rsvp) {
        rsvp = {
          id: `rsvp-${slugify(event.id)}-${slugify(profile.id)}`,
          eventId: event.id,
          profileId: profile.id,
          createdAt: new Date().toISOString(),
        };
        data.eventRsvps.push(rsvp);
      }
      rsvp.status = status;
      rsvp.updatedAt = new Date().toISOString();

      if (event.hostProfileId && event.hostProfileId !== profile.id && status !== "cancelled") {
        addNotification(data, event.hostProfileId, {
          type: "event_rsvp",
          title: `${profile.displayName || profile.handle} RSVP'd to your event`,
          body: event.title,
          url: "community-events.html",
        });
      }
      if (status !== "cancelled") {
        addActivity(data, {
          type: "event_rsvp",
          title: `${profile.displayName || profile.handle} RSVP'd ${status} for ${event.title}`,
          body: event.description || "Community events give members a reason to return together.",
          profileId: profile.id,
          actorName: profile.displayName || profile.handle,
          targetType: "event",
          targetId: event.id,
          url: "community-events.html",
          imageUrl: event.imageUrl,
        });
      }
      saveCommunityData(data);
      sendJson(res, 200, { data: rsvp }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "profiles") {
    try {
      const auth = await requireAuth(req, res, data, "create a community profile");
      if (!auth) return;
      sendJson(res, 409, { error: "Your account already has a GCX profile. Use account settings to update it." });
      return;
      const body = await readRequestJson(req);
      const displayName = safeText(body.displayName || body.name, 80);
      const handleBase = safeText(body.handle || displayName, 50).replace(/^@/, "");
      const handle = `@${slugify(handleBase) || `member-${Date.now()}`}`;

      if (!displayName) {
        sendJson(res, 400, { error: "Profile needs a display name." });
        return;
      }

      if (data.profiles.some((profile) => normalize(profile.handle) === normalize(handle))) {
        sendJson(res, 409, { error: "That handle is already taken." });
        return;
      }

      const profile = {
        id: `profile-${slugify(handle)}-${Date.now()}`,
        displayName,
        handle,
        bio: safeText(body.bio || "New GCX community member.", 240),
        avatarUrl: safeUrl(body.avatarUrl) || "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
        interests: Array.isArray(body.interests)
          ? body.interests.map((interest) => safeText(interest, 32)).filter(Boolean).slice(0, 5)
          : safeText(body.interests, 160).split(",").map((interest) => safeText(interest, 32)).filter(Boolean).slice(0, 5),
        followers: 0,
        following: 0,
        joinedAt: new Date().toISOString(),
        status: "active",
      };

      data.profiles.push(profile);
      addNotification(data, profile.id, {
        type: "welcome",
        title: "Your GCX profile is ready",
        body: "Start following collectors, posting finds, commenting, and voting for streamers.",
        url: "community.html",
      });
      saveCommunityData(data);
      sendJson(res, 201, { data: profile }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route.startsWith("profiles/")) {
    const profileId = decodeURIComponent(route.slice("profiles/".length));
    const profile = data.profiles.find((item) => item.id === profileId || item.handle === profileId);
    if (!profile || (profile.status || "active") !== "active") {
      sendJson(res, 404, { error: "Profile not found." });
      return;
    }

    const posts = data.posts
      .filter((post) => post.profileId === profile.id && isPublicCommunityPost(post))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const originalPosts = posts.filter((post) => !post.resharedPostId);
    const reposts = posts.filter((post) => post.resharedPostId);
    const comments = (data.comments || [])
      .filter((comment) => comment.profileId === profile.id && (comment.status || "published") === "published")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 12)
      .map((comment) => {
        const post = data.posts.find((item) => item.id === comment.postId && isPublicCommunityPost(item));
        return {
          id: comment.id,
          postId: comment.postId,
          body: comment.body,
          createdAt: comment.createdAt,
          postTitle: post?.title || "Community post",
          postCategory: post?.category || "Community",
          url: `community-post.html?id=${encodeURIComponent(comment.postId)}`,
        };
      });
    const activity = (data.activity || [])
      .filter((item) => item.profileId === profile.id || item.actorName === profile.displayName || item.actorName === profile.handle)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 12);
    const groups = (data.groupMemberships || [])
      .filter((membership) => membership.profileId === profile.id)
      .map((membership) => {
        const group = data.groups.find((item) => item.id === membership.groupId);
        return group
          ? {
              id: group.id,
              name: group.name,
              category: group.category,
              description: group.description,
              role: membership.role || "member",
              url: `community.html?group=${encodeURIComponent(group.id)}`,
            }
          : null;
      })
      .filter(Boolean);
    const reactionTotal = posts.reduce((sum, post) => sum + Object.values(normalizePostReactions(post)).reduce((reactionSum, count) => reactionSum + Number(count || 0), 0), 0);
    const commentTotal = posts.reduce(
      (sum, post) => sum + (data.comments || []).filter((comment) => comment.postId === post.id && (comment.status || "published") === "published").length,
      0
    );
    const isFollowing = data.follows.some((follow) => follow.followerId === viewerId && follow.followingId === profile.id);
    const friendship = friendshipBetween(data, profile.id, viewerId);
    sendJson(
      res,
      200,
      {
        data: {
          ...publicProfile(profile),
          followers: Number(profile.followers || 0),
          following: Number(profile.following || 0),
          isFollowing,
          isViewer: profile.id === viewerId,
          friendshipStatus: friendshipStatusForViewer(data, profile.id, viewerId),
          friendshipId: friendship?.id || "",
          posts: originalPosts.map((post) => buildCommunityPostPayload(data, post, viewerId)),
          reposts: reposts.map((post) => buildCommunityPostPayload(data, post, viewerId)),
          comments,
          activity,
          groups,
          stats: {
            posts: originalPosts.length,
            reposts: reposts.length,
            replies: comments.length,
            activity: activity.length,
            groups: groups.length,
            reactions: reactionTotal,
            comments: commentTotal,
            savedPosts: (data.savedPosts || []).filter((saved) => saved.profileId === profile.id).length,
          },
        },
      },
      { "X-GCX-Data-Source": "local" }
    );
    return;
  }

  if (req.method === "POST" && route === "profiles/follow") {
    try {
      const auth = await requireAuth(req, res, data, "follow profiles");
      if (!auth) return;
      const body = await readRequestJson(req);
      const followerId = auth.profile.id;
      const followingId = safeText(body.followingId, 100);
      const follower = data.profiles.find((profile) => profile.id === followerId);
      const following = data.profiles.find((profile) => profile.id === followingId);

      if (!follower || !following || follower.id === following.id) {
        sendJson(res, 400, { error: "A valid follower and profile to follow are required." });
        return;
      }

      let follow = data.follows.find((item) => item.followerId === follower.id && item.followingId === following.id);
      if (!follow) {
        follow = {
          id: `follow-${slugify(follower.id)}-${slugify(following.id)}`,
          followerId: follower.id,
          followingId: following.id,
          createdAt: new Date().toISOString(),
        };
        data.follows.push(follow);
        following.followers = Number(following.followers || 0) + 1;
        follower.following = Number(follower.following || 0) + 1;
        addNotification(data, following.id, {
          type: "follow",
          title: `${follower.displayName || follower.handle} followed you`,
          body: "A GCX member followed your collector profile.",
          url: "community.html",
        });
        addActivity(data, {
          type: "follow",
          title: `${follower.displayName || follower.handle} followed ${following.displayName || following.handle}`,
          body: "Follows help shape each member's community feed around collectors, creators, and traders they care about.",
          profileId: follower.id,
          actorName: follower.displayName || follower.handle,
          targetType: "profile",
          targetId: following.id,
          url: `profile.html?id=${following.id}`,
          imageUrl: follower.avatarUrl,
        });
      }

      saveCommunityData(data);
      sendJson(res, 200, { data: { follow, following } }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "profiles/unfollow") {
    try {
      const auth = await requireAuth(req, res, data, "unfollow profiles");
      if (!auth) return;
      const body = await readRequestJson(req);
      const followerId = auth.profile.id;
      const followingId = safeText(body.followingId, 100);
      const index = data.follows.findIndex((item) => item.followerId === followerId && item.followingId === followingId);
      if (index === -1) {
        sendJson(res, 404, { error: "Follow relationship not found." });
        return;
      }

      data.follows.splice(index, 1);
      const follower = data.profiles.find((profile) => profile.id === followerId);
      const following = data.profiles.find((profile) => profile.id === followingId);
      if (follower) follower.following = Math.max(0, Number(follower.following || 0) - 1);
      if (following) following.followers = Math.max(0, Number(following.followers || 0) - 1);
      saveCommunityData(data);
      sendJson(res, 200, { data: { followerId, followingId } }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "notifications") {
    const auth = await requireAuth(req, res, data, "view notifications");
    if (!auth) return;
    const viewerId = auth.profile.id;
    const notifications = data.notifications
      .filter((notification) => notification.profileId === viewerId)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    sendJson(
      res,
      200,
      {
        data: notifications,
        unreadCount: notifications.filter((notification) => !notification.read).length,
        totalCount: notifications.length,
      },
      { "X-GCX-Data-Source": "local" }
    );
    return;
  }

  if (req.method === "GET" && route === "discovery") {
    const publishedPosts = data.posts.filter(isPublicCommunityPost);
    const topics = data.topics.map((topic) => {
      const postCount = publishedPosts.filter((post) => topicMatchesPost(topic, post)).length;
      return {
        ...topic,
        postCount,
      };
    });
    const topProfiles = [...data.profiles]
      .filter((profile) => (profile.status || "active") === "active")
      .sort((a, b) => Number(b.followers || 0) - Number(a.followers || 0))
      .slice(0, 4)
      .map((profile) => ({
        ...publicProfile(profile),
        followers: Number(profile.followers || 0),
        following: Number(profile.following || 0),
      }));
    const groups = data.groups
      .filter((group) => (group.status || "active") === "active")
      .map((group) => ({
        ...group,
        postCount: publishedPosts.filter((post) => groupMatchesPost(group, post)).length,
        feedUrl: `community.html?group=${encodeURIComponent(group.id)}`,
      }))
      .sort((a, b) => Number(b.postCount || 0) - Number(a.postCount || 0))
      .slice(0, 4);

    sendJson(
      res,
      200,
      {
        data: {
          topics,
          groups,
          topProfiles,
          trendingPosts: buildTrendingPosts(data, viewerId, 5),
          trafficHooks: [
            { label: "Vote for streamers", url: "streamers.html", metric: `${data.streamers.length} creators on board` },
            { label: "Join community groups", url: "community-groups.html", metric: `${data.groups.length} launch groups` },
            { label: "Browse Pokemon cards", url: "pokemon.html", metric: "Card collector traffic" },
            { label: "Join marketplace beta waitlist", url: "index.html#cards", metric: "Beta interest path" },
            { label: "Explore game libraries", url: "games.html", metric: "Collector discovery" },
          ],
        },
      },
      { "X-GCX-Data-Source": "local" }
    );
    return;
  }

  if (req.method === "GET" && route === "growth") {
    sendJson(res, 200, { data: buildCommunityGrowthData(data) }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "GET" && route === "activity") {
    const type = safeText(url.searchParams.get("type") || "", 40);
    const limit = Math.min(80, Math.max(1, Number(url.searchParams.get("limit") || 40)));
    const profileMap = new Map(data.profiles.map((profile) => [profile.id, profile]));
    const items = (data.activity || [])
      .filter((item) => !type || item.type === type)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, limit)
      .map((item) => {
        const profile = profileMap.get(item.profileId);
        return {
          ...item,
          profile: profile
            ? {
                id: profile.id,
                displayName: profile.displayName,
                handle: profile.handle,
                avatarUrl: profile.avatarUrl,
              }
            : null,
        };
      });
    sendJson(res, 200, { data: items, totalCount: (data.activity || []).length }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "GET" && route === "saved-posts") {
    const auth = await requireAuth(req, res, data, "view saved posts");
    if (!auth) return;
    const profileId = auth.profile.id;
    const profile = data.profiles.find((item) => item.id === profileId);
    if (!profile) {
      sendJson(res, 404, { error: "Profile not found." });
      return;
    }

    const postMap = new Map(data.posts.map((post) => [post.id, post]));
    const profileMap = new Map(data.profiles.map((item) => [item.id, item]));
    const saved = (data.savedPosts || [])
      .filter((item) => item.profileId === profileId)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((item) => {
        const post = postMap.get(item.postId);
        const authorProfile = post ? profileMap.get(post.profileId) : null;
        return post
          ? {
              ...item,
              post: {
                ...post,
                linkPreview: post.linkPreview || buildLinkPreview(data, post.linkUrl, post.title),
                reactions: normalizePostReactions(post),
                likes: normalizePostReactions(post).like,
                savedCount: (data.savedPosts || []).filter((savedPost) => savedPost.postId === post.id).length,
                authorProfile: authorProfile
                  ? {
                      id: authorProfile.id,
                      displayName: authorProfile.displayName,
                      handle: authorProfile.handle,
                      avatarUrl: authorProfile.avatarUrl,
                    }
                  : null,
              },
            }
          : { ...item, post: null };
      })
      .filter((item) => item.post && (item.post.status || "published") === "published");

    sendJson(res, 200, { data: saved, profile: publicProfile(profile), viewerId, totalCount: saved.length }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "POST" && route === "notifications/read") {
    try {
      const auth = await requireAuth(req, res, data, "mark notifications read");
      if (!auth) return;
      const viewerId = auth.profile.id;
      const body = await readRequestJson(req);
      const notificationId = safeText(body.notificationId, 140);
      const notifications = data.notifications.filter((notification) => notification.profileId === viewerId);

      notifications.forEach((notification) => {
        if (!notificationId || notification.id === notificationId) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
      });

      saveCommunityData(data);
      sendJson(res, 200, { data: notifications, unreadCount: notifications.filter((notification) => !notification.read).length }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "notifications/dismiss") {
    try {
      const auth = await requireAuth(req, res, data, "dismiss notifications");
      if (!auth) return;
      const viewerId = auth.profile.id;
      const body = await readRequestJson(req);
      const notificationId = safeText(body.notificationId, 140);
      if (!notificationId) {
        sendJson(res, 400, { error: "A notification ID is required." });
        return;
      }

      const index = data.notifications.findIndex((notification) => notification.id === notificationId && notification.profileId === viewerId);
      if (index === -1) {
        sendJson(res, 404, { error: "Notification not found." });
        return;
      }

      const [dismissed] = data.notifications.splice(index, 1);
      saveCommunityData(data);
      const remaining = data.notifications.filter((notification) => notification.profileId === viewerId);
      sendJson(
        res,
        200,
        {
          data: dismissed,
          unreadCount: remaining.filter((notification) => !notification.read).length,
          totalCount: remaining.length,
        },
        { "X-GCX-Data-Source": "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "uploads") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to upload GCX community photos." });
        return;
      }
      const body = await readRequestJson(req);
      const mimeType = safeText(body.mimeType, 80).toLowerCase();
      const originalName = safeText(body.fileName || "community-photo", 120);
      const dataUrl = String(body.dataUrl || "");
      const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|gif|webp));base64,([a-z0-9+/=]+)$/i);
      const allowedTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]);

      if (!match || !allowedTypes.has(mimeType) || mimeType !== match[1].toLowerCase()) {
        sendJson(res, 400, { error: "Upload must be a PNG, JPG, GIF, or WebP image." });
        return;
      }

      const buffer = Buffer.from(match[2], "base64");
      const maxBytes = 2.5 * 1024 * 1024;
      if (!buffer.length || buffer.length > maxBytes) {
        sendJson(res, 400, { error: "Image must be smaller than 2.5 MB." });
        return;
      }

      const extensionByType = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/gif": ".gif",
        "image/webp": ".webp",
      };
      const extension = extensionByType[mimeType] || path.extname(originalName).toLowerCase() || ".jpg";
      const fileName = `${Date.now()}-${slugify(path.basename(originalName, path.extname(originalName))) || "community-photo"}${extension}`;
      fs.mkdirSync(communityUploadsDir, { recursive: true });
      fs.writeFileSync(path.join(communityUploadsDir, fileName), buffer);

      sendJson(
        res,
        201,
        {
          data: {
            fileName,
            imageUrl: `data/community-uploads/${fileName}`,
            mimeType,
            size: buffer.length,
          },
        },
        { "X-GCX-Data-Source": "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route.startsWith("posts/")) {
    const postId = decodeURIComponent(route.slice("posts/".length));
    const post = data.posts.find((item) => item.id === postId && isPublicCommunityPost(item));
    if (!post) {
      sendJson(res, 404, { error: "Post not found." });
      return;
    }

    const comments = data.comments
      .filter((comment) => comment.postId === post.id && (comment.status || "published") === "published")
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
      .map((comment) => ({
        ...comment,
        profile: publicProfile(data.profiles.find((profile) => profile.id === comment.profileId)),
      }));
    const relatedPosts = data.posts
      .filter((item) => item.id !== post.id && isPublicCommunityPost(item))
      .filter((item) => item.category === post.category || item.groupId === post.groupId || item.profileId === post.profileId)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3)
      .map((item) => buildCommunityPostPayload(data, item, viewerId));

    sendJson(
      res,
      200,
      {
        data: buildCommunityPostPayload(data, post, viewerId),
        comments,
        relatedPosts,
        viewerId,
      },
      { "X-GCX-Data-Source": "local" }
    );
    return;
  }

  if (req.method === "GET" && (route === "" || route === "feed")) {
    const category = normalize(url.searchParams.get("category") || "all");
    const feedScope = normalize(url.searchParams.get("scope") || "all");
    const feedSort = normalize(url.searchParams.get("sort") || "latest");
    const limit = Math.max(1, Math.min(30, Number(url.searchParams.get("limit") || 12)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
    const query = normalize(url.searchParams.get("q") || "");
    const topicId = safeText(url.searchParams.get("topic"), 120);
    const groupId = safeText(url.searchParams.get("group"), 120);
    const topic = data.topics.find((item) => item.id === topicId);
    const group = data.groups.find((item) => item.id === groupId && (item.status || "active") === "active");
    const followingIds = new Set(data.follows.filter((follow) => follow.followerId === viewerId).map((follow) => follow.followingId));
    const savedPostIds = new Set((data.savedPosts || []).filter((saved) => saved.profileId === viewerId).map((saved) => saved.postId));
    const posts = [...data.posts]
      .filter(isPublicCommunityPost)
      .filter((post) => communityPostMatchesCategory(post, category))
      .filter((post) => feedScope !== "following" || followingIds.has(post.profileId))
      .filter((post) => !query || communityPostSearchText(post).includes(query))
      .filter((post) => !topic || topicMatchesPost(topic, post))
      .filter((post) => !group || groupMatchesPost(group, post))
      .sort((a, b) =>
        feedSort === "trending"
          ? communityPostEngagementScore(data, b) - communityPostEngagementScore(data, a) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          : Number(b.editorialPinned || 0) - Number(a.editorialPinned || 0) ||
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    const pagedPosts = posts.slice(offset, offset + limit);
    const publishedComments = data.comments.filter((comment) => (comment.status || "published") === "published");
    const commentCounts = publishedComments.reduce((counts, comment) => {
      counts[comment.postId] = (counts[comment.postId] || 0) + 1;
      return counts;
    }, {});
    sendJson(
      res,
      200,
      {
        data: pagedPosts.map((post) => ({
          ...buildCommunityPostPayload(data, post, viewerId),
          isSaved: savedPostIds.has(post.id),
          comments: commentCounts[post.id] || post.comments || 0,
        })),
        promotions: activePromotions(data, "community-feed").slice(0, 2),
        profiles: data.profiles
          .filter((profile) => (profile.status || "active") === "active")
          .map((profile) => ({
            ...publicProfile(profile),
            followers: Number(profile.followers || 0),
            following: Number(profile.following || 0),
          })),
        follows: data.follows.filter((follow) => follow.followerId === viewerId),
        viewerId,
        scope: feedScope,
        sort: feedSort === "trending" ? "trending" : "latest",
        query,
        topic: topic?.id || "",
        group: group?.id || "",
        totalCount: posts.length,
        limit,
        offset,
        nextOffset: offset + pagedPosts.length,
        hasMore: offset + pagedPosts.length < posts.length,
      },
      { "X-GCX-Data-Source": "local" }
    );
    return;
  }

  if (req.method === "POST" && route === "feed") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to post to the GCX community." });
        return;
      }
      const body = await readRequestJson(req);
      const title = safeText(body.title, 120);
      const postBody = safeText(body.body, 700);
      const author = auth.profile.displayName;

      if (!title || !postBody) {
        sendJson(res, 400, { error: "Posts need a title and body." });
        return;
      }

      const post = {
        id: `post-${Date.now()}-${slugify(title) || "community"}`,
        author,
        handle: auth.profile.handle,
        profileId: auth.profile.id,
        category: safeText(body.category || "Community", 40),
        title,
        body: postBody,
        linkUrl: safeUrl(body.linkUrl),
        imageUrl: safeUrl(body.imageUrl),
        linkPreview: buildLinkPreview(data, body.linkUrl, title),
        groupId: safeText(body.groupId, 120),
        createdAt: new Date().toISOString(),
        status: "published",
        likes: 0,
        reactions: {
          like: 0,
          hype: 0,
          want: 0,
          trade: 0,
          watch: 0,
        },
        comments: 0,
        reports: 0,
        tags: Array.isArray(body.tags) ? body.tags.map((tag) => safeText(tag, 28)).filter(Boolean).slice(0, 5) : [],
      };
      post.duplicateKey = communityPostDuplicateKey({
        ...post,
        canonicalUrl: body.canonicalUrl,
        sourceUrl: body.sourceUrl,
        externalPostId: body.externalPostId,
        topic: body.topic,
      });

      const duplicate = findDuplicateCommunityPost(data, post);
      if (duplicate) {
        sendJson(res, 409, { error: "A GCX Social post for that story or source already exists.", duplicate: buildCommunityPostPayload(data, duplicate, viewerId) });
        return;
      }

      data.posts.unshift(post);
      addActivity(data, {
        type: "post",
        title: `${post.author} shared ${post.category || "a post"}`,
        body: post.title,
        profileId: post.profileId,
        actorName: post.author,
        targetType: "post",
        targetId: post.id,
        url: `community-post.html?id=${post.id}`,
        imageUrl: post.imageUrl,
      });
      saveCommunityData(data);
      const supabaseWrite = await persistCommunityPost(post);
      sendJson(res, 201, { data: post }, { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "feed/reshare") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to reshare GCX posts." });
        return;
      }
      const body = await readRequestJson(req);
      const sourcePostId = safeText(body.postId || body.sourcePostId, 120);
      const sourcePost = data.posts.find((item) => item.id === sourcePostId && isPublicCommunityPost(item));
      const profile = auth.profile;

      if (!sourcePost || !profile) {
        sendJson(res, 404, { error: "Post or profile not found." });
        return;
      }

      const reshareNote = safeText(body.body || body.note || `Sharing this with the GCX community.`, 500);
      const post = {
        id: `post-${Date.now()}-reshare-${slugify(sourcePost.title) || "community"}`,
        author: profile.displayName,
        handle: profile.handle,
        profileId: profile.id,
        category: safeText(body.category || sourcePost.category || "Community", 40),
        title: safeText(body.title || `Repost: ${sourcePost.title}`, 120),
        body: reshareNote,
        linkUrl: sourcePost.linkUrl,
        imageUrl: sourcePost.imageUrl,
        linkPreview: sourcePost.linkPreview || buildLinkPreview(data, sourcePost.linkUrl, sourcePost.title),
        groupId: safeText(body.groupId || sourcePost.groupId || "", 120),
        resharedPostId: sourcePost.id,
        resharedByProfileId: profile.id,
        createdAt: new Date().toISOString(),
        status: "published",
        likes: 0,
        reactions: {
          like: 0,
          hype: 0,
          want: 0,
          trade: 0,
          watch: 0,
        },
        comments: 0,
        reports: 0,
        tags: Array.from(new Set([...(sourcePost.tags || []), "reshare"].map((tag) => safeText(tag, 28)).filter(Boolean))).slice(0, 5),
      };

      data.posts.unshift(post);
      addActivity(data, {
        type: "reshare",
        title: `${post.author} reshared ${sourcePost.author}'s post`,
        body: sourcePost.title,
        profileId: post.profileId,
        actorName: post.author,
        targetType: "post",
        targetId: post.id,
        url: `community-post.html?id=${post.id}`,
        imageUrl: post.imageUrl,
      });
      if (sourcePost.profileId && sourcePost.profileId !== profile.id) {
        addNotification(data, sourcePost.profileId, {
          type: "reshare",
          title: `${post.author} reshared your post`,
          body: sourcePost.title,
          url: `community-post.html?id=${post.id}`,
        });
      }
      saveCommunityData(data);
      const supabaseWrite = await persistCommunityPost(post);
      sendJson(
        res,
        201,
        { data: buildCommunityPostPayload(data, post, viewerId) },
        { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "comments") {
    const postId = safeText(url.searchParams.get("postId"), 120);
    if (!postId) {
      sendJson(res, 400, { error: "postId is required." });
      return;
    }
    const comments = data.comments
      .filter((comment) => comment.postId === postId && (comment.status || "published") === "published")
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    sendJson(res, 200, { data: comments, totalCount: comments.length }, { "X-GCX-Data-Source": "local" });
    return;
  }

  if (req.method === "POST" && route === "comments") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to comment on GCX community posts." });
        return;
      }
      const body = await readRequestJson(req);
      const postId = safeText(body.postId, 120);
      const post = data.posts.find((item) => item.id === postId && isPublicCommunityPost(item));
      const commentBody = safeText(body.body, 500);
      const author = auth.profile.displayName;

      if (!post || !commentBody) {
        sendJson(res, 400, { error: "Comments need a published post and body." });
        return;
      }

      const comment = {
        id: `comment-${Date.now()}-${slugify(author) || "member"}`,
        postId,
        author,
        handle: auth.profile.handle,
        profileId: auth.profile.id,
        body: commentBody,
        createdAt: new Date().toISOString(),
        status: "published",
        reports: 0,
      };

      data.comments.push(comment);
      post.comments = Number(post.comments || 0) + 1;
      if (post.profileId && post.profileId !== comment.profileId) {
        addNotification(data, post.profileId, {
          type: "comment",
          title: `${comment.author} commented on your post`,
          body: comment.body,
          url: `community-post.html?id=${post.id}`,
        });
      }
      addActivity(data, {
        type: "comment",
        title: `${comment.author} commented on ${post.author || "a GCX post"}'s post`,
        body: comment.body,
        profileId: comment.profileId,
        actorName: comment.author,
        targetType: "post",
        targetId: post.id,
        url: `community-post.html?id=${post.id}`,
        imageUrl: post.imageUrl,
      });
      saveCommunityData(data);
      const supabaseWrite = await persistCommunityComment(comment);
      sendJson(res, 201, { data: comment }, { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "comments/report") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to report GCX comments." });
        return;
      }
      const body = await readRequestJson(req);
      const commentId = safeText(body.commentId, 120);
      const comment = data.comments.find((item) => item.id === commentId);

      if (!comment) {
        sendJson(res, 404, { error: "Comment not found." });
        return;
      }

      const reportResult = createModerationReport(data, {
        reporterProfileId: auth.profile.id,
        targetType: "community_comment",
        targetId: comment.id,
        reason: safeText(body.reason || "Community comment report", 240),
      });
      if (reportResult.duplicate) {
        sendJson(res, 200, { data: comment, duplicate: true }, { "X-GCX-Data-Source": "local" });
        return;
      }
      comment.reports = Number(comment.reports || 0) + 1;
      comment.lastReportedAt = new Date().toISOString();
      if (comment.reports >= 3) comment.status = "needs_review";
      saveCommunityData(data);
      const supabaseReport = await persistModerationReport(reportResult.report);
      const supabaseComment = await persistCommunityComment(comment);
      sendJson(res, 200, { data: comment }, { "X-GCX-Data-Source": supabaseReport.ok || supabaseComment.ok ? "local+supabase" : "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "feed/like") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to react to GCX posts." });
        return;
      }
      const body = await readRequestJson(req);
      const postId = safeText(body.postId, 120);
      const post = data.posts.find((item) => item.id === postId && isPublicCommunityPost(item));

      if (!post) {
        sendJson(res, 404, { error: "Post not found." });
        return;
      }

      post.reactions = normalizePostReactions(post);
      post.reactions.like = Number(post.reactions.like || 0) + 1;
      post.likes = post.reactions.like;
      post.lastReactedAt = new Date().toISOString();
      post.lastLikedAt = post.lastReactedAt;
      saveCommunityData(data);
      sendJson(res, 200, { data: post }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "feed/views") {
    try {
      const limit = rateLimit(req, "community-post-views", 180, 1000 * 60 * 10);
      if (!limit.ok) {
        sendRateLimitExceeded(res, limit, "Too many view events. Try again later.");
        return;
      }
      const body = await readRequestJson(req);
      const postIds = Array.isArray(body.postIds)
        ? Array.from(new Set(body.postIds.map((id) => safeText(id, 140)).filter(Boolean))).slice(0, 30)
        : [];
      const viewablePosts = (data.posts || []).filter((post) => postIds.includes(post.id) && isPublicCommunityPost(post));
      viewablePosts.forEach((post) => {
        post.viewCount = Number(post.viewCount || post.views || 0) + 1;
        post.lastViewedAt = new Date().toISOString();
      });
      if (viewablePosts.length) saveCommunityData(data);
      sendJson(
        res,
        200,
        {
          data: viewablePosts.map((post) => ({ id: post.id, viewCount: Number(post.viewCount || 0) })),
        },
        { "X-GCX-Data-Source": "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "feed/video-embeds") {
    try {
      const limit = rateLimit(req, "community-video-embeds", 120, 1000 * 60 * 10);
      if (!limit.ok) {
        sendRateLimitExceeded(res, limit, "Too many video engagement events. Try again later.");
        return;
      }
      const body = await readRequestJson(req);
      const postId = safeText(body.postId, 140);
      const post = (data.posts || []).find((item) => item.id === postId && isPublicCommunityPost(item));
      const isVideoPost = normalize(post?.mediaType) === "video" || normalize(post?.postType) === "video-post" || normalize(post?.postType) === "video_post" || Boolean(post?.embedUrl);
      if (!post || !isVideoPost) {
        sendJson(res, 400, { error: "A valid Social video post is required." });
        return;
      }
      post.videoEmbedLoadCount = Number(post.videoEmbedLoadCount || 0) + 1;
      post.lastVideoEmbedLoadedAt = new Date().toISOString();
      saveCommunityData(data);
      sendJson(
        res,
        200,
        {
          data: {
            id: post.id,
            videoEmbedLoadCount: Number(post.videoEmbedLoadCount || 0),
            lastVideoEmbedLoadedAt: post.lastVideoEmbedLoadedAt,
          },
        },
        { "X-GCX-Data-Source": "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "feed/react") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to react to GCX posts." });
        return;
      }
      const body = await readRequestJson(req);
      const postId = safeText(body.postId, 120);
      const reaction = safeText(body.reaction || "like", 40);
      const profileId = auth.profile.id;
      const post = data.posts.find((item) => item.id === postId && isPublicCommunityPost(item));
      const allowedReactions = new Set(["like", "hype", "want", "trade", "watch"]);

      if (!post || !allowedReactions.has(reaction)) {
        sendJson(res, 400, { error: "A valid post and reaction are required." });
        return;
      }

      post.reactions = normalizePostReactions(post);
      post.reactions[reaction] = Number(post.reactions[reaction] || 0) + 1;
      post.likes = post.reactions.like;
      post.lastReactedAt = new Date().toISOString();
      post.lastReactionType = reaction;

      const reactor = data.profiles.find((profile) => profile.id === profileId);
      if (post.profileId && post.profileId !== profileId) {
        addNotification(data, post.profileId, {
          type: "reaction",
          title: `${reactor?.displayName || "A GCX member"} reacted to your post`,
          body: `${reaction} on ${post.title}`,
          url: `community-post.html?id=${post.id}`,
        });
      }

      addActivity(data, {
        type: "reaction",
        title: `${reactor?.displayName || "A GCX member"} reacted ${reaction} to a post`,
        body: post.title,
        profileId: reactor?.id || "",
        actorName: reactor?.displayName || reactor?.handle || "GCX member",
        targetType: "post",
        targetId: post.id,
        url: `community-post.html?id=${post.id}`,
        imageUrl: post.imageUrl,
      });

      saveCommunityData(data);
      sendJson(res, 200, { data: post }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "feed/save") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to save GCX posts." });
        return;
      }
      const body = await readRequestJson(req);
      const postId = safeText(body.postId, 120);
      const profileId = auth.profile.id;
      const post = data.posts.find((item) => item.id === postId && isPublicCommunityPost(item));
      const profile = auth.profile;

      if (!post || !profile) {
        sendJson(res, 400, { error: "A valid profile and post are required." });
        return;
      }

      let saved = (data.savedPosts || []).find((item) => item.postId === post.id && item.profileId === profile.id);
      if (!saved) {
        saved = {
          id: `saved-${slugify(profile.id)}-${slugify(post.id)}`,
          profileId: profile.id,
          postId: post.id,
          createdAt: new Date().toISOString(),
        };
        data.savedPosts.push(saved);

        addActivity(data, {
          type: "saved_post",
          title: `${profile.displayName || profile.handle} saved a post`,
          body: post.title,
          profileId: profile.id,
          actorName: profile.displayName || profile.handle,
          targetType: "post",
          targetId: post.id,
          url: `community-post.html?id=${post.id}`,
          imageUrl: post.imageUrl,
        });
      }

      saveCommunityData(data);
      sendJson(
        res,
        200,
        {
          data: {
            ...post,
            reactions: normalizePostReactions(post),
            likes: normalizePostReactions(post).like,
            isSaved: true,
            savedCount: (data.savedPosts || []).filter((item) => item.postId === post.id).length,
          },
          saved,
        },
        { "X-GCX-Data-Source": "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "feed/unsave") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to unsave GCX posts." });
        return;
      }
      const body = await readRequestJson(req);
      const postId = safeText(body.postId, 120);
      const profileId = auth.profile.id;
      const index = (data.savedPosts || []).findIndex((item) => item.postId === postId && item.profileId === profileId);
      const post = data.posts.find((item) => item.id === postId);

      if (index === -1 || !post) {
        sendJson(res, 404, { error: "Saved post not found." });
        return;
      }

      const [removed] = data.savedPosts.splice(index, 1);
      saveCommunityData(data);
      const responsePost = isPublicCommunityPost(post)
        ? {
            ...post,
            reactions: normalizePostReactions(post),
            likes: normalizePostReactions(post).like,
            isSaved: false,
            savedCount: (data.savedPosts || []).filter((item) => item.postId === post.id).length,
          }
        : {
            id: post.id,
            isSaved: false,
            savedCount: (data.savedPosts || []).filter((item) => item.postId === post.id).length,
          };
      sendJson(
        res,
        200,
        {
          data: responsePost,
          removed,
        },
        { "X-GCX-Data-Source": "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "feed/report") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to report GCX posts." });
        return;
      }
      const body = await readRequestJson(req);
      const postId = safeText(body.postId, 120);
      const post = data.posts.find((item) => item.id === postId);

      if (!post) {
        sendJson(res, 404, { error: "Post not found." });
        return;
      }

      const reportResult = createModerationReport(data, {
        reporterProfileId: auth.profile.id,
        targetType: "community_post",
        targetId: post.id,
        reason: safeText(body.reason || "Community post report", 240),
      });
      if (reportResult.duplicate) {
        sendJson(res, 200, { data: post, duplicate: true }, { "X-GCX-Data-Source": "local" });
        return;
      }
      post.reports = Number(post.reports || 0) + 1;
      post.lastReportedAt = new Date().toISOString();
      if (post.reports >= 3) post.status = "needs_review";
      saveCommunityData(data);
      const supabaseReport = await persistModerationReport(reportResult.report);
      const supabasePost = await persistCommunityPost(post);
      sendJson(res, 200, { data: post }, { "X-GCX-Data-Source": supabaseReport.ok || supabasePost.ok ? "local+supabase" : "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "moderation") {
    const auth = await requireStaff(req, res, data, "view moderation queues");
    if (!auth) return;
    const reportDetailsFor = (targetType, targetId) => (data.moderationReports || [])
      .filter((report) => report.targetType === targetType && report.targetId === targetId)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const withReportDetails = (item, targetType) => {
      const reports = reportDetailsFor(targetType, item.id);
      return {
        ...item,
        reportDetails: reports.slice(0, 5).map((report) => ({
          id: report.id,
          reason: report.reason,
          status: report.status || "open",
          createdAt: report.createdAt,
        })),
        reporterCount: new Set(reports.map((report) => report.reporterProfileId).filter(Boolean)).size,
      };
    };
    const reportedPosts = data.posts
      .filter((post) => Number(post.reports || 0) > 0 || (post.status || "published") !== "published")
      .sort((a, b) => Number(b.reports || 0) - Number(a.reports || 0))
      .map((post) => withReportDetails(post, "community_post"));
    const reportedComments = data.comments
      .filter((comment) => Number(comment.reports || 0) > 0 || (comment.status || "published") !== "published")
      .sort((a, b) => Number(b.reports || 0) - Number(a.reports || 0))
      .map((comment) => withReportDetails(comment, "community_comment"));
    const pendingNominations = data.nominations.filter((nomination) => nomination.status === "pending_review");
    const openReports = (data.moderationReports || []).filter((report) => !["resolved", "dismissed"].includes(report.status || "open"));
    const latestReport = [...(data.moderationReports || [])]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

    sendJson(
      res,
      200,
      {
        data: {
          summary: {
            openReports: openReports.length,
            reportedPosts: reportedPosts.length,
            reportedComments: reportedComments.length,
            pendingNominations: pendingNominations.length,
            latestReportAt: latestReport?.createdAt || "",
            staffProfile: publicProfile(auth.profile),
          },
          posts: reportedPosts,
          comments: reportedComments,
          nominations: pendingNominations,
        },
      },
      { "X-GCX-Data-Source": "local" }
    );
    return;
  }

  if (req.method === "POST" && route === "moderation/status") {
    try {
      const auth = await requireStaff(req, res, data, "moderate community content");
      if (!auth) return;
      const body = await readRequestJson(req);
      const type = safeText(body.type, 30);
      const id = safeText(body.id, 140);
      const status = safeText(body.status, 40);
      const allowedStatuses = new Set(["published", "needs_review", "hidden", "approved", "rejected"]);
      if (!allowedStatuses.has(status)) {
        sendJson(res, 400, { error: "Unsupported moderation status." });
        return;
      }

      const collections = {
        post: data.posts,
        comment: data.comments,
        nomination: data.nominations,
      };
      const collection = collections[type];
      const item = collection?.find((candidate) => candidate.id === id);
      if (!item) {
        sendJson(res, 404, { error: "Moderation item not found." });
        return;
      }

      item.status = status;
      item.reviewedAt = new Date().toISOString();
      item.reviewedBy = auth.profile.id;
      item.reviewNote = safeText(body.note || "", 240);
      const reportTargetType = type === "post" ? "community_post" : type === "comment" ? "community_comment" : "";
      if (reportTargetType) {
        (data.moderationReports || [])
          .filter((report) => report.targetType === reportTargetType && report.targetId === id && !["resolved", "dismissed"].includes(report.status || "open"))
          .forEach((report) => {
            report.status = status === "hidden" ? "resolved" : "dismissed";
            report.reviewedAt = item.reviewedAt;
            report.reviewedBy = auth.profile.id;
            report.reviewNote = item.reviewNote;
          });
      }
      if (type === "nomination" && status === "approved") {
        const streamer = createStreamerFromNomination(data, item);
        item.streamerId = streamer.id;
        item.campaignUrl = streamer.campaignUrl;
        addNotification(data, defaultCommunityProfileId(data), {
          type: "nomination_approved",
          title: `${item.name} joined the streamer voting pool`,
          body: "The approved creator now has a campaign page and can collect GCX spotlight votes.",
          url: streamer.campaignUrl,
        });
        addActivity(data, {
          type: "streamer_nomination",
          title: `${item.name} joined the streamer voting pool`,
          body: item.specialty || "A community-nominated creator is now eligible for spotlight votes.",
          actorName: item.nominatedBy || "GCX community",
          targetType: "streamer",
          targetId: streamer.id,
          url: streamer.campaignUrl,
          imageUrl: streamer.imageUrl,
        });
      }
      saveCommunityData(data);
      sendJson(res, 200, { data: item }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "editorial/social-streaming") {
    const auth = await requireStaff(req, res, data, "review Social and Streaming editorial controls");
    if (!auth) return;
    const socialPosts = [...(data.posts || [])]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 80)
      .map(buildSocialEditorialPostPayload);
    const streamingItems = [...(data.streamingSpotlight || [])].map(buildStreamingEditorialPayload);
    sendJson(
      res,
      200,
      {
        data: {
      socialPosts,
      streamingItems,
      summary: {
        socialPosts: socialPosts.length,
        hiddenSocialPosts: socialPosts.filter((post) => post.status === "hidden").length,
        staleSocialPosts: socialPosts.filter((post) => post.markedStale).length,
        scheduledSocialPosts: socialPosts.filter((post) => post.scheduledAt && new Date(post.scheduledAt).getTime() > Date.now()).length,
        streamingItems: streamingItems.length,
        featuredStreamingItems: streamingItems.filter((item) => item.featured && !item.hidden).length,
        hiddenStreamingItems: streamingItems.filter((item) => item.hidden).length,
          },
          staffProfile: publicProfile(auth.profile),
        },
      },
      { "X-GCX-Data-Source": "local" }
    );
    return;
  }

  if (req.method === "POST" && route === "editorial/social-posts/intake") {
    try {
      const auth = await requireStaff(req, res, data, "create Social intake drafts");
      if (!auth) return;
      const body = await readRequestJson(req);
      const post = buildSocialIntakePost(data, body, auth.profile);
      const factualTypes = new Set(["external_story_share", "video_post", "quick_news", "tcg_card_post", "gcx_news_share"]);
      if (!post.title || !post.body) {
        sendJson(res, 400, { error: "Social intake drafts need a title and body." });
        return;
      }
      if (factualTypes.has(post.postType) && (!post.sourceName || (!post.sourceUrl && !post.linkUrl))) {
        sendJson(res, 400, { error: "Factual Social intake drafts need a source name and source/link URL." });
        return;
      }
      const duplicate = findDuplicateCommunityPost(data, post);
      if (duplicate) {
        sendJson(res, 409, { error: "A Social post or draft for that story/source already exists.", duplicate: buildSocialEditorialPostPayload(duplicate) });
        return;
      }
      data.posts.unshift(post);
      addActivity(data, {
        type: "social_intake",
        title: "Social intake draft created",
        body: post.title,
        profileId: auth.profile.id,
        actorName: auth.profile.displayName || auth.profile.handle || "GCX staff",
        targetType: "post",
        targetId: post.id,
        url: "community-admin.html",
        imageUrl: post.imageUrl,
      });
      saveCommunityData(data);
      sendJson(res, 201, { data: buildSocialEditorialPostPayload(post) }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "editorial/streaming-spotlight/intake") {
    try {
      const auth = await requireStaff(req, res, data, "create Streaming Spotlight intake drafts");
      if (!auth) return;
      const body = await readRequestJson(req);
      const item = buildStreamingIntakeItem(body, auth.profile);
      if (!item.title || !item.platform || !item.creator || !item.watch_url || !item.source) {
        sendJson(res, 400, { error: "Streaming intake drafts need title, platform, creator, watch URL, and source." });
        return;
      }
      const duplicate = findDuplicateStreamingSpotlightItem(data, item);
      if (duplicate) {
        sendJson(res, 409, { error: "A Streaming Spotlight item or draft for that source already exists.", duplicate: buildStreamingEditorialPayload(duplicate) });
        return;
      }
      data.streamingSpotlight.unshift(item);
      addActivity(data, {
        type: "streaming_intake",
        title: "Streaming Spotlight intake draft created",
        body: item.title,
        profileId: auth.profile.id,
        actorName: auth.profile.displayName || auth.profile.handle || "GCX staff",
        targetType: "streaming_spotlight",
        targetId: item.id,
        url: "community-admin.html",
        imageUrl: item.thumbnail_url,
      });
      saveCommunityData(data);
      sendJson(res, 201, { data: buildStreamingEditorialPayload(item) }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "PATCH" && route.startsWith("editorial/social-posts/")) {
    try {
      const auth = await requireStaff(req, res, data, "edit Social posts");
      if (!auth) return;
      const postId = decodeURIComponent(route.slice("editorial/social-posts/".length));
      const post = (data.posts || []).find((item) => item.id === postId);
      if (!post) {
        sendJson(res, 404, { error: "Social post not found." });
        return;
      }
      const body = await readRequestJson(req);
      const allowedStatuses = new Set(["published", "needs_review", "hidden", "deleted"]);
      if (body.status !== undefined) {
        const status = safeText(body.status, 40);
        if (!allowedStatuses.has(status)) {
          sendJson(res, 400, { error: "Unsupported Social post status." });
          return;
        }
        post.status = status;
        if (status === "published") {
          post.pipelineStage = "publication";
          post.editorialStatus = "Published";
          post.publishedAt = post.publishedAt || new Date().toISOString();
        }
        if (status === "needs_review") {
          post.pipelineStage = "verification";
          post.editorialStatus = "Needs review";
        }
        if (status === "deleted") {
          post.deletedAt = new Date().toISOString();
          post.deletedBy = auth.profile.id;
          post.pipelineStage = "archived";
        }
      }
      if (body.markedStale !== undefined) post.markedStale = Boolean(body.markedStale);
      if (body.editorialPinned !== undefined) post.editorialPinned = Boolean(body.editorialPinned);
      if (body.editorialStatus !== undefined) post.editorialStatus = safeText(body.editorialStatus, 80);
      if (body.title !== undefined) post.title = safeText(body.title, 140) || post.title;
      if (body.body !== undefined) post.body = safeText(body.body, 900) || post.body;
      if (body.category !== undefined) post.category = safeText(body.category, 40) || post.category;
      if (body.scheduledAt !== undefined) post.scheduledAt = safeText(body.scheduledAt, 80);
      if (body.editorialPriority !== undefined) post.editorialPriority = Number.isFinite(Number(body.editorialPriority)) ? Number(body.editorialPriority) : 0;
      post.duplicateKey = communityPostDuplicateKey(post);
      post.reviewedAt = new Date().toISOString();
      post.reviewedBy = auth.profile.id;
      post.reviewNote = safeText(body.note || post.reviewNote || "", 240);
      post.updatedAt = post.reviewedAt;
      saveCommunityData(data);
      sendJson(res, 200, { data: buildSocialEditorialPostPayload(post) }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "PATCH" && route.startsWith("editorial/streaming-spotlight/")) {
    try {
      const auth = await requireStaff(req, res, data, "edit Streaming Spotlight");
      if (!auth) return;
      const itemId = decodeURIComponent(route.slice("editorial/streaming-spotlight/".length));
      const item = (data.streamingSpotlight || []).find((candidate) => candidate.id === itemId);
      if (!item) {
        sendJson(res, 404, { error: "Streaming Spotlight item not found." });
        return;
      }
      const body = await readRequestJson(req);
      if (body.publish !== undefined && Boolean(body.publish)) {
        item.hidden = false;
        item.status = item.is_live === true ? "Live" : item.scheduled_start ? "Scheduled" : "Replay";
        item.pipelineStage = "publication";
        item.editorialStatus = "Published";
        item.publishedAt = item.publishedAt || new Date().toISOString();
      }
      if (body.featured !== undefined) {
        const shouldFeature = Boolean(body.featured);
        if (shouldFeature) {
          (data.streamingSpotlight || []).forEach((candidate) => {
            candidate.featured = candidate.id === item.id;
          });
          item.hidden = false;
          if (item.status === "needs_review" || item.status === "deleted") {
            item.status = item.is_live === true ? "Live" : item.scheduled_start ? "Scheduled" : "Replay";
          }
          item.pipelineStage = "publication";
          item.editorialStatus = "Published";
        } else {
          item.featured = false;
        }
      }
      if (body.hidden !== undefined) {
        item.hidden = Boolean(body.hidden);
        if (item.hidden) item.featured = false;
        if (!item.hidden && item.status === "deleted") {
          item.status = item.is_live === true ? "Live" : item.scheduled_start ? "Scheduled" : "Replay";
        }
      }
      if (body.deleted !== undefined && Boolean(body.deleted)) {
        item.hidden = true;
        item.featured = false;
        item.status = "deleted";
        item.deletedAt = new Date().toISOString();
        item.deletedBy = auth.profile.id;
        item.pipelineStage = "archived";
      }
      if (body.markedStale !== undefined) item.markedStale = Boolean(body.markedStale);
      if (body.status !== undefined) {
        item.status = safeText(body.status, 40);
        if (item.status === "needs_review") {
          item.pipelineStage = "verification";
          item.editorialStatus = "Needs review";
        }
      }
      if (body.editorialStatus !== undefined) item.editorialStatus = safeText(body.editorialStatus, 80);
      if (body.title !== undefined) item.title = safeText(body.title, 160) || item.title;
      if (body.editorial_reason !== undefined) item.editorial_reason = safeText(body.editorial_reason, 500);
      if (body.scheduled_start !== undefined) item.scheduled_start = safeText(body.scheduled_start, 80);
      if (body.editorialPriority !== undefined) item.editorialPriority = Number.isFinite(Number(body.editorialPriority)) ? Number(body.editorialPriority) : 0;
      item.reviewedAt = new Date().toISOString();
      item.reviewedBy = auth.profile.id;
      item.reviewNote = safeText(body.note || item.reviewNote || "", 240);
      item.updated_at = item.reviewedAt;
      saveCommunityData(data);
      sendJson(res, 200, { data: buildStreamingEditorialPayload(item) }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "streaming-spotlight/views") {
    try {
      const limit = rateLimit(req, "streaming-spotlight-views", 180, 1000 * 60 * 10);
      if (!limit.ok) {
        sendRateLimitExceeded(res, limit, "Too many spotlight view events. Try again later.");
        return;
      }
      const body = await readRequestJson(req);
      const itemIds = Array.isArray(body.itemIds)
        ? Array.from(new Set(body.itemIds.map((id) => safeText(id, 140)).filter(Boolean))).slice(0, 30)
        : [];
      const now = new Date().toISOString();
      const viewableItems = (data.streamingSpotlight || []).filter((item) => itemIds.includes(item.id) && isPublicStreamingSpotlightItem(item));
      viewableItems.forEach((item) => {
        item.viewCount = Number(item.viewCount || item.views || 0) + 1;
        item.lastViewedAt = now;
      });
      if (viewableItems.length) saveCommunityData(data);
      sendJson(
        res,
        200,
        {
          data: viewableItems.map((item) => ({
            id: item.id,
            viewCount: Number(item.viewCount || 0),
            watchClickCount: Number(item.watchClickCount || 0),
            embedLoadCount: Number(item.embedLoadCount || 0),
          })),
        },
        { "X-GCX-Data-Source": "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "streaming-spotlight/engagement") {
    try {
      const limit = rateLimit(req, "streaming-spotlight-engagement", 120, 1000 * 60 * 10);
      if (!limit.ok) {
        sendRateLimitExceeded(res, limit, "Too many spotlight engagement events. Try again later.");
        return;
      }
      const body = await readRequestJson(req);
      const itemId = safeText(body.itemId, 140);
      const action = safeText(body.action || "watch_click", 40);
      const item = (data.streamingSpotlight || []).find((candidate) => candidate.id === itemId && isPublicStreamingSpotlightItem(candidate));
      const allowedActions = new Set(["watch_click", "embed_load"]);
      if (!item || !allowedActions.has(action)) {
        sendJson(res, 400, { error: "A valid spotlight item and action are required." });
        return;
      }
      const now = new Date().toISOString();
      if (action === "embed_load") {
        item.embedLoadCount = Number(item.embedLoadCount || 0) + 1;
        item.lastEmbedLoadedAt = now;
      } else {
        item.watchClickCount = Number(item.watchClickCount || 0) + 1;
        item.lastWatchClickedAt = now;
      }
      saveCommunityData(data);
      sendJson(
        res,
        200,
        {
          data: {
            id: item.id,
            viewCount: Number(item.viewCount || 0),
            watchClickCount: Number(item.watchClickCount || 0),
            embedLoadCount: Number(item.embedLoadCount || 0),
          },
        },
        { "X-GCX-Data-Source": "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route === "streamers") {
    const enrichedData = {
      ...data,
      streamers: await enrichStreamersWithTwitchStatus(data.streamers || []),
    };
    const streamers = [...enrichedData.streamers]
      .map((streamer) => ({ ...streamer, campaignUrl: streamer.campaignUrl || `streamer.html?id=${streamer.id}` }))
      .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
    const slots = buildStreamerSlots(enrichedData);
    const creatorSpotlight = buildCreatorSpotlight(enrichedData);
    const spotlightHistory = buildSpotlightHistory(data);
    sendJson(
      res,
      200,
      {
        data: streamers,
        nominations: data.nominations,
        campaign: data.campaign,
        streamingSpotlight: (data.streamingSpotlight || [])
          .filter(isPublicStreamingSpotlightItem)
          .map(buildStreamingSpotlightPublicPayload),
        slots,
        creatorSpotlight,
        spotlightHistory,
        totalCount: streamers.length,
        liveStatus: {
          provider: "twitch",
          configured: twitchCredentialsConfigured(),
          checkedAt: new Date().toISOString(),
        },
      },
      { "X-GCX-Data-Source": "local" }
    );
    return;
  }

  if (req.method === "POST" && route === "streamers/spotlight") {
    try {
      const auth = await requireStaff(req, res, data, "update creator highlights");
      if (!auth) return;
      const body = await readRequestJson(req);
      const requestedSlots = Array.isArray(body.slots) ? body.slots : [];
      const streamerIds = new Set((data.streamers || []).map((streamer) => streamer.id));
      const usedIds = new Set();
      const slots = requestedSlots
        .slice(0, 6)
        .map((slot, index) => ({
          streamerId: safeText(slot.streamerId, 80),
          slotKey: safeText(slot.slotKey || `spotlight-${index + 1}`, 60),
          slotLabel: safeText(slot.slotLabel || `Creator Highlight ${index + 1}`, 80),
          twitchLogin: safeText(slot.twitchLogin || "", 80).replace(/^@+/, "").toLowerCase(),
          slotDescription: safeText(slot.slotDescription || "", 260),
        }))
        .filter((slot) => slot.streamerId);

      if (slots.length !== 6) {
        throw new Error("Choose exactly six creator highlights.");
      }

      for (const slot of slots) {
        if (!streamerIds.has(slot.streamerId)) {
          throw new Error("One of the selected creators could not be found.");
        }
        if (usedIds.has(slot.streamerId)) {
          throw new Error("Each creator highlight must use a different creator.");
        }
        usedIds.add(slot.streamerId);
      }

      data.streamers = (data.streamers || []).map((streamer) => {
        const matchingSlot = slots.find((slot) => slot.streamerId === streamer.id);
        return matchingSlot
          ? {
              ...streamer,
              twitchLogin: matchingSlot.twitchLogin || twitchLoginForStreamer(streamer),
              liveStageEnabled: true,
            }
          : streamer;
      });
      data.creatorSpotlight = slots.map(({ twitchLogin, ...slot }) => slot);
      saveCommunityData(data);
      sendJson(
        res,
        200,
        {
          data: data.creatorSpotlight,
          creatorSpotlight: buildCreatorSpotlight(data),
          slots: buildStreamerSlots(data),
        },
        { "X-GCX-Data-Source": "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "streamers/close-week") {
    try {
      const auth = await requireStaff(req, res, data, "close streamer spotlight weeks");
      if (!auth) return;
      const body = await readRequestJson(req);
      const result = closeStreamerWeek(data, {
        weekLabel: body.weekLabel,
        nextWeekLabel: body.nextWeekLabel,
        summary: body.summary,
      });
      const winners = (result.historyItem.featuredCreators || [result.historyItem.popularWinner, result.historyItem.risingWinner]).filter(Boolean);

      addNotification(data, defaultCommunityProfileId(data), {
        type: "streamer_week_closed",
        title: `${result.historyItem.weekLabel} streamer spotlight closed`,
        body: winners.map((winner) => winner.name).join(" and ") || "Streamer winners were archived.",
        url: "streamers.html",
      });
      addActivity(data, {
        type: "streamer_week_closed",
        title: `${result.historyItem.weekLabel} streamer winners were archived`,
        body: result.historyItem.summary,
        actorName: "GCX",
        targetType: "streamer_spotlight",
        targetId: result.historyItem.id,
        url: "streamers.html",
        imageUrl: result.historyItem.popularWinner?.imageUrl || result.historyItem.risingWinner?.imageUrl || "",
      });

      saveCommunityData(data);
      sendJson(
        res,
        200,
        {
          data: result.historyItem,
          slots: result.slots,
          creatorSpotlight: buildCreatorSpotlight(data),
          streamerCount: result.streamers.length,
          spotlightHistory: buildSpotlightHistory(data),
        },
        { "X-GCX-Data-Source": "local" }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && route.startsWith("streamers/")) {
    const streamerId = decodeURIComponent(route.slice("streamers/".length));
    const streamers = [...data.streamers].sort((a, b) => Number(b.weeklyVotes || b.votes || 0) - Number(a.weeklyVotes || a.votes || 0));
    const streamer = streamers.find((item) => item.id === streamerId || normalize(item.handle) === normalize(streamerId) || normalize(item.name) === normalize(streamerId));

    if (!streamer) {
      sendJson(res, 404, { error: "Streamer not found." });
      return;
    }

    const rank = streamers.findIndex((item) => item.id === streamer.id) + 1;
    const slots = buildStreamerSlots(data);
    const creatorSpotlight = buildCreatorSpotlight(data);
    const spotlightHistory = buildSpotlightHistory(data);
    const topSpotlight = creatorSpotlight.map((item) => ({
      id: item.id,
      name: item.name,
      weeklyVotes: Number(item.weeklyVotes || 0),
      campaignUrl: creatorCampaignUrl(item),
      slotLabel: item.slotLabel || item.spotlight || item.tier,
    }));
    const relatedPosts = data.posts
      .filter(isPublicCommunityPost)
      .filter((post) => communityPostSearchText(post).includes("stream") || communityPostSearchText(post).includes("creator") || communityPostSearchText(post).includes(normalize(streamer.name)))
      .slice(0, 3);
    const streamerTraffic = summarizeTrafficEvents(
      (data.trafficEvents || []).filter((event) => event.targetId === streamer.id || event.ref === streamer.id)
    );

    sendJson(
      res,
      200,
      {
        data: {
          ...streamer,
          rank,
          slotKey: creatorSpotlight.find((item) => item.id === streamer.id)?.slotKey || "pool",
          slotLabel: creatorSpotlight.find((item) => item.id === streamer.id)?.slotLabel || streamer.spotlight || "Voting Pool",
          campaignUrl: creatorCampaignUrl(streamer),
          shareCopy: `Vote for ${streamer.name} in the GCX streamer spotlight and help bring more gaming and collecting fans into the community.`,
        },
        campaign: data.campaign,
        slots,
        creatorSpotlight,
        spotlightHistory,
        traffic: streamerTraffic,
        shareTemplates: [
          {
            title: "Pinned creator post",
            audience: streamer.handle || "Creator audience",
            copy: `I'm in the GCX streamer spotlight vote this week. Vote for ${streamer.name}, share the campaign, and help bring more game and card collectors into the community.`,
          },
          {
            title: "Live chat prompt",
            audience: "Stream viewers",
            copy: `Chat, quick favor: vote for ${streamer.name} on GCX and help push this campaign up the weekly board.`,
          },
          {
            title: "Sponsor-friendly note",
            audience: "Brands and partners",
            copy: `${streamer.name}'s GCX campaign connects streamer votes with game libraries, card collecting, community posts, and future marketplace-beta traffic.`,
          },
        ],
        topTwo: topSpotlight,
        topSpotlight,
        relatedPosts,
      },
      { "X-GCX-Data-Source": "local" }
    );
    return;
  }

  if (req.method === "POST" && route === "streamers/vote") {
    try {
      const body = await readRequestJson(req);
      const streamerId = safeText(body.streamerId, 80);
      const streamer = data.streamers.find((item) => item.id === streamerId);

      if (!streamer) {
        sendJson(res, 404, { error: "Streamer not found." });
        return;
      }

      streamer.votes = Number(streamer.votes || 0) + 1;
      streamer.weeklyVotes = Number(streamer.weeklyVotes || 0) + 1;
      streamer.lastVotedAt = new Date().toISOString();
      addNotification(data, defaultCommunityProfileId(data), {
        type: "streamer_vote",
        title: `${streamer.name} received a vote`,
        body: "Streamer spotlight voting activity can be promoted into creator campaigns and newsletter placements.",
        url: "streamers.html",
      });
      addActivity(data, {
        type: "streamer_vote",
        title: `${streamer.name} picked up a streamer spotlight vote`,
        body: streamer.pitch || "Creator voting brings streamer audiences back to GCX.",
        actorName: streamer.name,
        targetType: "streamer",
        targetId: streamer.id,
        url: streamer.campaignUrl || `streamer.html?id=${streamer.id}`,
        imageUrl: streamer.imageUrl,
      });
      saveCommunityData(data);
      sendJson(res, 200, { data: streamer }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "streamers/nominate") {
    try {
      const limit = rateLimit(req, "streamer-nominations", 6, 1000 * 60 * 15);
      if (!limit.ok) {
        sendJson(res, 429, { error: "Too many creator nominations. Try again later." }, { "Retry-After": String(limit.retryAfter) });
        return;
      }
      const body = await readRequestJson(req);
      const name = safeText(body.name, 80);
      const email = safeText(body.email, 160);
      const linkUrl = safeUrl(body.linkUrl);
      const platforms = Array.isArray(body.platforms)
        ? body.platforms.map((platform) => safeText(platform, 40)).filter(Boolean).slice(0, 6)
        : [];
      const categories = Array.isArray(body.categories)
        ? body.categories.map((category) => safeText(category, 40)).filter(Boolean).slice(0, 8)
        : [];

      if (!name || !linkUrl) {
        sendJson(res, 400, { error: "Creator applications need a creator name and primary channel link." });
        return;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        sendJson(res, 400, { error: "Creator applications need a valid contact email." });
        return;
      }

      if (body.consent !== true) {
        sendJson(res, 400, { error: "Please confirm the creator application consent before submitting." });
        return;
      }

      const nomination = {
        id: `nomination-${Date.now()}-${slugify(name) || "creator"}`,
        name,
        handle: safeText(body.handle, 50),
        email,
        linkUrl,
        otherLinks: safeText(body.otherLinks, 500),
        audienceSize: safeText(body.audienceSize, 120),
        platforms,
        categories,
        specialty: safeText(body.specialty, 360),
        nominatedBy: safeText(body.nominatedBy || "GCX Member", 60),
        applicationType: "creator_spotlight",
        consentVersion: safeText(body.consentVersion || "gcx-creator-spotlight-launch-v1", 80),
        consentAcceptedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: "pending_review",
      };

      data.nominations.unshift(nomination);
      addNotification(data, defaultCommunityProfileId(data), {
        type: "creator_application",
        title: `${nomination.name} applied for the creator spotlight`,
        body: "Review this creator for a future GCX weekly streamer spotlight.",
        url: "community-admin.html",
      });
      saveCommunityData(data);
      sendJson(res, 201, { data: nomination }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  sendJson(res, 404, { error: "Community route not found." });
}

async function handleAuthApi(req, res, url) {
  const route = url.pathname.replace(/^\/api\/auth\/?/, "");
  const data = loadCommunityData();

  if (req.method === "GET" && route === "session") {
    const auth = await authenticatedAccount(req, data);
    if (!auth) {
      sendJson(res, 200, { authenticated: false, refreshAvailable: supabaseAuthEnabled() });
      return;
    }
    const payload = supabaseAuthEnabled() ? supabaseAccountPayload(auth.user, auth.profile) : accountPublicPayload(data, auth.account);
    sendJson(res, 200, { authenticated: true, data: payload }, { "X-GCX-Data-Source": supabaseAuthEnabled() ? "supabase-auth" : "local" });
    return;
  }

  if (req.method === "GET" && route === "staff-status") {
    const auth = await authenticatedAccount(req, data);
    if (!auth) {
      sendJson(res, 200, { authenticated: false, staff: false });
      return;
    }
    const email = String(auth.account?.email || auth.user?.email || "").toLowerCase();
    sendJson(res, 200, {
      authenticated: true,
      staff: isStaffProfile(auth.profile) || localAdminEmails().has(email),
    });
    return;
  }

  if (req.method === "POST" && route === "signup") {
    try {
      const limit = rateLimit(req, "auth-signup", 5, 1000 * 60 * 30);
      if (!limit.ok) {
        sendJson(res, 429, { error: "Too many sign-up attempts. Try again later." }, { "Retry-After": String(limit.retryAfter) });
        return;
      }
      const body = await readRequestJson(req);
      const email = normalizeEmailAddress(body.email);
      const password = String(body.password || "");
      const displayNameValidation = validateDisplayName(body.displayName);
      const displayName = displayNameValidation.displayName;
      const handleBase = safeText(body.handle || displayName, 60);
      const emailLimit = authEmailRateLimit(req, "signup-email", email, 3, 1000 * 60 * 60);

      if (!emailLimit.ok) {
        sendJson(res, 429, { error: "Too many sign-up attempts for that email. Try again later." }, { "Retry-After": String(emailLimit.retryAfter) });
        return;
      }
      if (!emailLooksValid(email)) {
        sendJson(res, 400, { error: "Enter a valid email address." });
        return;
      }
      if (!displayNameValidation.ok) {
        sendJson(res, 400, { error: displayNameValidation.error });
        return;
      }
      const passwordValidation = validatePasswordStrength(password, email, displayName);
      if (!passwordValidation.ok) {
        sendJson(res, 400, { error: passwordValidation.error });
        return;
      }

      if (supabaseAuthEnabled()) {
        const redirectTo = `${requestOrigin(req)}/auth.html?confirmed=1`;
        const result = await supabaseAuthRequest(`signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            data: {
              displayName,
              display_name: displayName,
            },
          }),
        });
        const user = result.user;
        if (user?.id) {
          const supabaseProfile = await upsertSupabaseProfile(user, body);
          const profile = syncSupabaseProfileToLocal(data, user, supabaseProfile);
          const payload = supabaseAccountPayload(user, profile);
          if (result.session?.access_token) {
            sendJson(
              res,
              201,
              {
                token: result.session.access_token,
                refreshToken: result.session.refresh_token || "",
                expiresIn: result.session.expires_in || 0,
                data: payload,
              },
              { "X-GCX-Data-Source": "supabase-auth" }
            );
            return;
          }
          sendJson(res, 201, { pendingConfirmation: true, data: payload, message: "Account created. Check your email to confirm before logging in." }, { "X-GCX-Data-Source": "supabase-auth" });
          return;
        }
        sendJson(res, 502, { error: "Supabase created no user record. Check the Auth settings and try again." });
        return;
      }

      if ((data.accounts || []).some((account) => account.email === email)) {
        sendJson(res, 409, { error: "An account with that email already exists." });
        return;
      }

      const profileIdBase = `profile-${slugify(handleBase || displayName) || "member"}`;
      let profileId = profileIdBase;
      let suffix = 2;
      while (data.profiles.some((profile) => profile.id === profileId)) {
        profileId = `${profileIdBase}-${suffix}`;
        suffix += 1;
      }

      const handleRoot = slugify(handleBase || displayName) || "member";
      let handle = `@${handleRoot}`;
      suffix = 2;
      while (data.profiles.some((profile) => normalize(profile.handle) === normalize(handle))) {
        handle = `@${handleRoot}${suffix}`;
        suffix += 1;
      }

      const profile = {
        id: profileId,
        displayName,
        handle,
        bio: safeText(body.bio || "GCX member ready to talk games, cards, and collecting.", 240),
        avatarUrl:
          safeUrl(body.avatarUrl) ||
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
        interests: Array.isArray(body.interests)
          ? body.interests.map((interest) => safeText(interest, 32)).filter(Boolean).slice(0, 5)
          : ["games", "cards"],
        followers: 0,
        following: 0,
        joinedAt: new Date().toISOString(),
        status: "active",
      };
      const passwordRecord = localPasswordRecord(password);
      const account = {
        id: `account-${Date.now()}-${slugify(displayName) || "member"}`,
        email,
        ...passwordRecord,
        profileId: profile.id,
        createdAt: new Date().toISOString(),
        status: "active",
      };
      const token = crypto.randomBytes(32).toString("hex");
      const session = {
        id: `session-${Date.now()}-${slugify(displayName) || "member"}`,
        accountId: account.id,
        tokenHash: sessionTokenHash(token),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      };

      data.profiles.unshift(profile);
      data.accounts.unshift(account);
      data.sessions.unshift(session);
      data.sessions = capAccountSessions(data.sessions, account.id);
      saveCommunityData(data);
      sendJson(res, 201, { token, data: accountPublicPayload(data, account) }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "login") {
    try {
      const limit = rateLimit(req, "auth-login", 8, 1000 * 60 * 15);
      if (!limit.ok) {
        sendJson(res, 429, { error: "Too many login attempts. Try again later." }, { "Retry-After": String(limit.retryAfter) });
        return;
      }
      const body = await readRequestJson(req);
      const email = normalizeEmailAddress(body.email);
      const password = String(body.password || "");
      const emailLimit = authEmailRateLimit(req, "login-email", email, 12, 1000 * 60 * 30);
      if (!emailLimit.ok) {
        sendJson(res, 429, { error: "Too many login attempts for that email. Try again later." }, { "Retry-After": String(emailLimit.retryAfter) });
        return;
      }

      if (supabaseAuthEnabled()) {
        let result = null;
        try {
          result = await supabaseAuthRequest("token?grant_type=password", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
        } catch (error) {
          sendJson(res, 401, { error: "Email or password did not match." });
          return;
        }
        const user = result.user;
        if (!result.access_token || !user?.id) {
          sendJson(res, 401, { error: "Email or password did not match." });
          return;
        }
        const supabaseProfile = (await loadSupabaseProfile(user.id)) || (await upsertSupabaseProfile(user, {}));
        const profile = syncSupabaseProfileToLocal(data, user, supabaseProfile);
        sendJson(
          res,
          200,
          {
            token: result.access_token,
            refreshToken: result.refresh_token || "",
            expiresIn: result.expires_in || 0,
            data: supabaseAccountPayload(user, profile),
          },
          { "X-GCX-Data-Source": "supabase-auth" }
        );
        return;
      }

      const account = (data.accounts || []).find((item) => item.email === email && (item.status || "active") === "active");

      if (!account || !verifyLocalPassword(password, account)) {
        sendJson(res, 401, { error: "Email or password did not match." });
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      const session = {
        id: `session-${Date.now()}-${slugify(account.email) || "member"}`,
        accountId: account.id,
        tokenHash: sessionTokenHash(token),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      };
      data.sessions.unshift(session);
      data.sessions = capAccountSessions(data.sessions, account.id).slice(0, 500);
      saveCommunityData(data);
      sendJson(res, 200, { token, data: accountPublicPayload(data, account) }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "refresh") {
    try {
      const limit = rateLimit(req, "auth-refresh", 20, 1000 * 60 * 15);
      if (!limit.ok) {
        sendJson(res, 429, { error: "Too many session refresh attempts. Try again later." }, { "Retry-After": String(limit.retryAfter) });
        return;
      }
      if (!supabaseAuthEnabled()) {
        sendJson(res, 404, { error: "Refresh is only available when Supabase Auth is enabled." });
        return;
      }
      const body = await readRequestJson(req);
      const refreshToken = String(body.refreshToken || "").trim();
      if (!refreshToken) {
        sendJson(res, 400, { error: "Missing refresh token." });
        return;
      }
      const result = await supabaseAuthRequest("token?grant_type=refresh_token", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const user = result.user;
      if (!result.access_token || !user?.id) {
        sendJson(res, 401, { error: "Session could not be refreshed." });
        return;
      }
      const supabaseProfile = (await loadSupabaseProfile(user.id)) || (await upsertSupabaseProfile(user, {}));
      const profile = syncSupabaseProfileToLocal(data, user, supabaseProfile);
      sendJson(
        res,
        200,
        {
          token: result.access_token,
          refreshToken: result.refresh_token || refreshToken,
          expiresIn: result.expires_in || 0,
          data: supabaseAccountPayload(user, profile),
        },
        { "X-GCX-Data-Source": "supabase-auth" }
      );
    } catch (error) {
      sendJson(res, 401, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "forgot-password") {
    try {
      const limit = rateLimit(req, "auth-forgot-password", 5, 1000 * 60 * 15);
      if (!limit.ok) {
        sendJson(res, 429, { error: "Too many password reset requests. Try again later." }, { "Retry-After": String(limit.retryAfter) });
        return;
      }
      const body = await readRequestJson(req);
      const email = normalizeEmailAddress(body.email);
      const emailLimit = authEmailRateLimit(req, "forgot-password-email", email, 3, 1000 * 60 * 60);
      if (!emailLimit.ok) {
        sendJson(res, 429, { error: "Too many password reset requests for that email. Try again later." }, { "Retry-After": String(emailLimit.retryAfter) });
        return;
      }
      if (!emailLooksValid(email)) {
        sendJson(res, 400, { error: "Enter a valid email address." });
        return;
      }

      if (supabaseAuthEnabled()) {
        const redirectTo = `${requestOrigin(req)}/auth.html?recovery=1`;
        await supabaseAuthRequest(`recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        sendJson(res, 200, { ok: true, message: "If that email has an account, a reset link is on the way." }, { "X-GCX-Data-Source": "supabase-auth" });
        return;
      }

      sendJson(res, 200, { ok: true, message: "Password reset is available after Supabase Auth is enabled." }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "update-password") {
    try {
      const limit = rateLimit(req, "auth-update-password", 6, 1000 * 60 * 15);
      if (!limit.ok) {
        sendJson(res, 429, { error: "Too many password update attempts. Try again later." }, { "Retry-After": String(limit.retryAfter) });
        return;
      }
      if (!supabaseAuthEnabled()) {
        sendJson(res, 404, { error: "Password updates are only available when Supabase Auth is enabled." });
        return;
      }
      const token = authHeaderToken(req);
      const body = await readRequestJson(req);
      const password = String(body.password || "");
      if (!token) {
        sendJson(res, 401, { error: "Open your reset link again, then choose a new password." });
        return;
      }
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.ok) {
        sendJson(res, 400, { error: passwordValidation.error });
        return;
      }
      await supabaseAuthRequest("user", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      sendJson(res, 200, { ok: true, message: "Password updated." }, { "X-GCX-Data-Source": "supabase-auth" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "profile") {
    try {
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in to update your profile." });
        return;
      }
      const body = await readRequestJson(req);
      const displayName = safeText(body.displayName, 80) || auth.profile.displayName;
      const bio = safeText(body.bio || auth.profile.bio, 240);
      const avatarUrl = safeUrl(body.avatarUrl) || auth.profile.avatarUrl;
      const interests = Array.isArray(body.interests)
        ? body.interests.map((interest) => safeText(interest, 32)).filter(Boolean).slice(0, 5)
        : safeText(body.interests, 180).split(",").map((interest) => safeText(interest, 32)).filter(Boolean).slice(0, 5);

      let updatedProfile = {
        ...auth.profile,
        displayName,
        bio,
        avatarUrl,
        interests: interests.length ? interests : auth.profile.interests || ["games", "cards"],
      };

      if (supabaseAuthEnabled()) {
        const rows = await supabaseRequest(`profiles?id=eq.${encodePostgrestValue(auth.profile.id)}&select=*`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            display_name: displayName,
            bio,
            avatar_url: avatarUrl,
            interests: updatedProfile.interests,
          }),
        });
        updatedProfile = syncSupabaseProfileToLocal(data, auth.user, Array.isArray(rows) ? rows[0] : null) || updatedProfile;
      } else {
        const index = data.profiles.findIndex((profile) => profile.id === auth.profile.id);
        if (index !== -1) data.profiles[index] = updatedProfile;
        saveCommunityData(data);
      }

      sendJson(res, 200, { data: { ...supabaseAccountPayload(auth.user || auth.account, updatedProfile), profile: publicProfile(updatedProfile) } }, { "X-GCX-Data-Source": supabaseAuthEnabled() ? "supabase-auth" : "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && route === "logout") {
    const token = authHeaderToken(req);
    if (supabaseAuthEnabled()) {
      if (token) {
        await supabaseAuthRequest("logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      sendJson(res, 200, { ok: true }, { "X-GCX-Data-Source": "supabase-auth" });
      return;
    }
    const tokenHash = sessionTokenHash(token);
    data.sessions = (data.sessions || []).filter((session) => session.tokenHash !== tokenHash);
    saveCommunityData(data);
    sendJson(res, 200, { ok: true }, { "X-GCX-Data-Source": "local" });
    return;
  }

  sendJson(res, 404, { error: "Auth route not found." });
}

async function handleStatic(req, res, url) {
  const requestPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  if (requestPath.startsWith("/internal/")) {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  if (requestPath === "/article.html" && url.searchParams.get("id")) {
    try {
      const stories = await buildNewsStories();
      const story = stories.find((item) => item.id === url.searchParams.get("id"));
      if (story) {
        const filePath = path.join(rootDir, "article.html");
        let html = fs.readFileSync(filePath, "utf8");
        const title = `${story.title} | Games Exchange`;
        const description = plainMetaText(story.excerpt || (story.body || [])[0], 220);
        const canonicalUrl = `${publicSiteOrigin()}/article.html?id=${encodeURIComponent(story.id)}`;
        const imageUrl = story.imageUrl ? new URL(story.imageUrl, `${publicSiteOrigin()}/`).href : "";
        const publishedDate = story.publishedAt ? new Date(story.publishedAt).toISOString() : "";
        const modifiedDate = story.lastUpdated ? new Date(story.lastUpdated).toISOString() : publishedDate;
        const schema = {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: story.title,
          description,
          image: imageUrl ? [imageUrl] : undefined,
          datePublished: publishedDate || undefined,
          dateModified: modifiedDate || publishedDate || undefined,
          author: {
            "@type": "Organization",
            name: story.sourceName || "Games Exchange",
          },
          publisher: {
            "@type": "Organization",
            name: "Games Exchange",
          },
          mainEntityOfPage: canonicalUrl,
        };

        html = html
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${htmlEscape(title)}</title>`)
          .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${htmlEscape(description)}" />`)
          .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${htmlEscape(title)}" />`)
          .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${htmlEscape(description)}" />`)
          .replace(/<meta name="twitter:card" content="[^"]*" \/>/, `<meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}" />`);

        const injectedMeta = [
          `<link rel="canonical" href="${htmlEscape(canonicalUrl)}" />`,
          `<meta property="og:url" content="${htmlEscape(canonicalUrl)}" />`,
          imageUrl ? `<meta property="og:image" content="${htmlEscape(imageUrl)}" />` : "",
          imageUrl ? `<meta name="twitter:image" content="${htmlEscape(imageUrl)}" />` : "",
          `<meta name="twitter:title" content="${htmlEscape(title)}" />`,
          `<meta name="twitter:description" content="${htmlEscape(description)}" />`,
          publishedDate ? `<meta property="article:published_time" content="${htmlEscape(publishedDate)}" />` : "",
          modifiedDate ? `<meta property="article:modified_time" content="${htmlEscape(modifiedDate)}" />` : "",
          `<meta property="article:section" content="${htmlEscape(story.category || "News")}" />`,
          `<script type="application/ld+json" id="article-schema-server">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`,
        ]
          .filter(Boolean)
          .join("\n    ");
        html = html.replace("</head>", `    ${injectedMeta}\n  </head>`);
        send(res, 200, html, "text/html; charset=utf-8", { "X-GCX-Article-Metadata": "server" });
        return;
      }
    } catch (error) {
      // Fall through to the static article shell if metadata hydration fails.
    }
  }

  if (await sendSupabaseJsonFile(req, res, requestPath)) return;
  const filePath = path.normalize(path.join(rootDir, requestPath));

  if (!filePath.startsWith(rootDir)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const type = contentTypes[extension] || "application/octet-stream";

    res.writeHead(200, {
      ...securityHeaders(),
      "Content-Type": type,
      "Cache-Control": cacheControlForStatic(filePath, requestPath),
      ...(robotsHeaderForStatic(requestPath) ? { "X-Robots-Tag": robotsHeaderForStatic(requestPath) } : {}),
    });
    res.end(data);
  });
}

loadEnvFile();

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/favicon.ico") {
    res.writeHead(204, {
      ...securityHeaders(),
      "Cache-Control": "public, max-age=86400",
    });
    res.end();
    return;
  }

  if (url.pathname === "/api/health") {
    const health = buildPublicHealthStatus();
    sendJson(res, health.ok ? 200 : 503, health, {
      "X-GCX-Health": health.ok ? "ok" : "warning",
    });
    return;
  }

  if (url.pathname === "/api/status") {
    const data = loadCommunityData();
    const launch = launchModeStatus(data);
    sendJson(res, 200, {
      ok: true,
      pokemonApiKeyConfigured: Boolean(process.env.POKEMON_TCG_API_KEY),
      pokemonCacheTtlMs: cacheTtlMs,
      magicLocalDataConfigured: Boolean(loadLocalMagicData()),
      yugiohLocalDataConfigured: Boolean(loadLocalYugiohData()),
      supabaseConfigured: launch.persistence.supabaseConfigured,
      supabaseAuthEnabled: launch.auth.supabaseAuthEnabled,
      launch,
    });
    return;
  }

  if (url.pathname === "/api/admin/supabase-launch-readiness") {
    const data = loadCommunityData();
    const auth = await requireStaff(req, res, data, "view Supabase launch readiness");
    if (!auth) return;
    try {
      const readiness = await checkSupabaseLaunchTables();
      sendJson(res, 200, readiness, { "X-GCX-Data-Source": "server-check" });
    } catch (error) {
      sendJson(res, 500, { error: "Supabase launch readiness check failed." });
    }
    return;
  }

  if (url.pathname === "/api/newsletter" && req.method === "POST") {
    try {
      const limit = rateLimit(req, "newsletter", 5, 1000 * 60 * 15);
      if (!limit.ok) {
        sendJson(res, 429, { error: "Too many newsletter submissions. Try again later." }, { "Retry-After": String(limit.retryAfter) });
        return;
      }
      const body = await readRequestJson(req);
      const email = safeText(body.email, 160).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        sendJson(res, 400, { error: "Enter a valid email address." });
        return;
      }

      const data = loadCommunityData();
      const existing = data.newsletterSubscriptions.find((item) => String(item.email || "").toLowerCase() === email);
      const subscription = existing || {
        id: `newsletter-${Date.now()}-${slugify(email.split("@")[0]) || "subscriber"}`,
        email,
        status: "subscribed",
        createdAt: new Date().toISOString(),
      };
      subscription.updatedAt = new Date().toISOString();
      subscription.sourcePage = safeText(body.sourcePage || "", 160);
      subscription.referrer = safeText(body.referrer || "", 300);
      subscription.consentVersion = safeText(body.consentVersion || "gcx-launch-v1", 80);
      subscription.interestCategory = safeText(body.interestCategory || "daily-brief", 80);

      if (!existing) data.newsletterSubscriptions.unshift(subscription);
      saveCommunityData(data);
      const supabaseWrite = await persistNewsletterSubscription(subscription);
      sendJson(res, existing ? 200 : 201, { data: subscription }, { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (url.pathname === "/api/collector-waitlist" && req.method === "POST") {
    try {
      const limit = rateLimit(req, "collector-waitlist", 8, 1000 * 60 * 15);
      if (!limit.ok) {
        sendJson(res, 429, { error: "Too many waitlist submissions. Try again later." }, { "Retry-After": String(limit.retryAfter) });
        return;
      }
      const body = await readRequestJson(req);
      const item = safeText(body.item || "", 180);
      const intent = safeText(body.intent || "Marketplace beta interest", 80);
      const itemType = safeText(body.itemType || "collector-item", 80);
      const sourceId = safeText(body.sourceId || "", 180);
      const data = loadCommunityData();
      const record = {
        id: `collector-waitlist-${Date.now()}-${slugify(item || intent) || "interest"}`,
        item,
        itemType,
        sourceId,
        intent,
        status: "new",
        safetyNote: "Marketplace beta only. No listing, payment, sale, or trade is created.",
        sourcePage: safeText(body.sourcePage || "", 160),
        referrer: safeText(body.referrer || "", 300),
        consentVersion: safeText(body.consentVersion || "gcx-marketplace-beta-v1", 80),
        createdAt: new Date().toISOString(),
      };
      data.collectorWaitlist.unshift(record);
      saveCommunityData(data);
      const supabaseWrite = await persistCollectorWaitlist(record);
      sendJson(res, 201, { data: record }, { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (url.pathname === "/api/data-health") {
    try {
      sendJson(res, 200, buildDataHealthReport(), {
        "X-GCX-Data-Source": "local",
      });
    } catch (error) {
      console.warn(`Data health report failed: ${error.message}`);
      sendJson(res, 500, {
        error: "Data health report could not be generated.",
        detail: "The report could not be built right now.",
      });
    }
    return;
  }

  if (url.pathname === "/api/search" && req.method === "GET") {
    try {
      const limit = Math.max(1, Math.min(40, Number(url.searchParams.get("limit") || 24)));
      const result = await buildSiteSearchResults(url.searchParams.get("q") || "", limit);
      sendJson(res, 200, { generatedAt: new Date().toISOString(), ...result }, { "X-GCX-Data-Source": "local-search" });
    } catch (error) {
      console.warn(`Search failed: ${error.message}`);
      sendJson(res, 500, { error: "Search could not be generated.", detail: "Search is temporarily unavailable." });
    }
    return;
  }

  if (url.pathname === "/api/news") {
    buildNewsStories()
      .then((stories) => {
        const limit = Math.max(1, Math.min(40, Number(url.searchParams.get("limit") || 24)));
        const category = normalize(url.searchParams.get("category") || "all");
        const filtered =
          category === "all"
            ? stories
            : stories.filter((story) => normalize(story.category) === category || normalize(story.type) === category);
        sendJson(
          res,
          200,
          {
            generatedAt: new Date().toISOString(),
            data: filtered.slice(0, limit),
            sources: newsSources.map(({ id, name, category, sourceUrl }) => ({ id, name, category, sourceUrl })),
          },
          { "X-GCX-Data-Source": "live+local" }
        );
      })
      .catch((error) => {
        console.warn(`News feed generation failed: ${error.message}`);
        sendJson(res, 500, { error: "News feed could not be generated.", detail: "The news feed could not be built right now." });
    });
    return;
  }

  if (url.pathname === "/api/newsroom/ops" && req.method === "GET") {
    try {
      sendJson(res, 200, buildNewsroomOperatingReport(), {
        "X-GCX-Data-Source": "local+newsroom-os",
      });
    } catch (error) {
      console.warn(`Newsroom operating report failed: ${error.message}`);
      sendJson(res, 500, {
        error: "Newsroom operating report could not be generated.",
        detail: "The newsroom operating report could not be built right now.",
      });
    }
    return;
  }

  if (url.pathname === "/api/newsroom/articles" && req.method === "POST") {
    try {
      const data = loadCommunityData();
      const auth = await authenticatedAccount(req, data);
      if (!auth) {
        sendJson(res, 401, { error: "Log in before publishing GCX newsroom stories." });
        return;
      }

      const body = await readRequestJson(req);
      const title = safeText(body.title, 220);
      const excerpt = safeText(body.excerpt, 500);
      const imageUrl = safeUrl(body.imageUrl);
      const paragraphs = String(body.body || "")
        .split(/\n{2,}/)
        .map((paragraph) => safeArticleBlock(paragraph, 2500))
        .filter(Boolean);
      const sourceLinks = String(body.sourceLinks || "")
        .split(/\n+/)
        .map((line) => {
          const [label, ...urlParts] = line.split("|");
          const url = safeUrl(urlParts.join("|").trim() || label);
          return {
            label: safeText(urlParts.length ? label : url, 160),
            url,
          };
        })
        .filter((source) => source.label && source.url)
        .slice(0, 8);
      const relatedLinks = String(body.relatedLinks || "")
        .split(/\n+/)
        .map((line) => {
          const [label, ...urlParts] = line.split("|");
          const url = safeUrl(urlParts.join("|").trim() || label);
          return {
            label: safeText(urlParts.length ? label : url, 160),
            url,
          };
        })
        .filter((link) => link.label && link.url)
        .slice(0, 8);

      if (!title || !excerpt || !imageUrl || !paragraphs.length) {
        sendJson(res, 400, { error: "Newsroom stories need a title, excerpt, image, and body." });
        return;
      }

      const story = saveNewsroomStory({
        title,
        excerpt,
        body: paragraphs,
        category: body.category,
        externalUrl: body.externalUrl,
        imageUrl,
        imageCredit: body.imageCredit,
        publishedAt: body.publishedAt ? isoDateOrNow(body.publishedAt) : new Date().toISOString(),
        sourceLinks,
        relatedLinks,
        topicCluster: body.topicCluster,
        canonicalTopic: body.canonicalTopic,
        articleType: body.articleType,
        storyLifecycleState: body.storyLifecycleState,
        opportunityScore: body.opportunityScore,
        qaScore: body.qaScore,
        confidence: body.confidence,
        updateFrequency: body.updateFrequency,
        livingArticle: body.livingArticle === true || body.livingArticle === "true",
        deepResearchUsed: body.deepResearchUsed === true || body.deepResearchUsed === "true",
        targetSearchIntent: body.targetSearchIntent,
      });
      sendJson(res, 201, { data: story }, { "X-GCX-Data-Source": "local" });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  const newsCommentsMatch = url.pathname.match(/^\/api\/news\/([^/]+)\/comments$/);
  if (newsCommentsMatch) {
    const storyIdParam = decodeURIComponent(newsCommentsMatch[1]);

    if (req.method === "GET") {
      const data = loadCommunityData();
      const comments = (data.newsComments || [])
        .filter((comment) => comment.storyId === storyIdParam && (comment.status || "published") === "published")
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
        .map((comment) => ({
          ...comment,
          profile: publicProfile(data.profiles.find((profile) => profile.id === comment.profileId)),
        }));
      sendJson(res, 200, { data: comments, totalCount: comments.length }, { "X-GCX-Data-Source": "local" });
      return;
    }

    if (req.method === "POST") {
      try {
        const limit = rateLimit(req, "news-comments", 20, 1000 * 60 * 15);
        if (!limit.ok) {
          sendRateLimitExceeded(res, limit, "Too many article comments. Try again later.");
          return;
        }
        const data = loadCommunityData();
        const auth = await authenticatedAccount(req, data);
        if (!auth) {
          sendJson(res, 401, { error: "Log in to comment on GCX articles." });
          return;
        }

        const stories = await buildNewsStories();
        const story = stories.find((item) => item.id === storyIdParam);
        const body = await readRequestJson(req);
        const commentBody = safeText(body.body, 800);
        if (!story || !commentBody) {
          sendJson(res, 400, { error: "Comments need a valid story and body." });
          return;
        }

        const comment = {
          id: `news-comment-${Date.now()}-${slugify(auth.profile.displayName) || "member"}`,
          storyId: story.id,
          profileId: auth.profile.id,
          author: auth.profile.displayName,
          handle: auth.profile.handle,
          body: commentBody,
          createdAt: new Date().toISOString(),
          status: "published",
          reports: 0,
        };
        data.newsComments.push(comment);
        addActivity(data, {
          type: "news_comment",
          title: `${auth.profile.displayName} commented on a GCX story`,
          body: story.title,
          actorName: auth.profile.displayName,
          targetType: "news",
          targetId: story.id,
          url: `article.html?id=${encodeURIComponent(story.id)}`,
          imageUrl: story.imageUrl,
        });
        saveCommunityData(data);
        const supabaseWrite = await persistNewsComment(comment);
        sendJson(
          res,
          201,
          {
            data: {
              ...comment,
              profile: publicProfile(auth.profile),
            },
          },
          { "X-GCX-Data-Source": supabaseWrite.ok ? "local+supabase" : "local" }
        );
      } catch (error) {
        sendJson(res, 400, { error: error.message });
      }
      return;
    }
  }

  if (url.pathname.startsWith("/api/news/")) {
    const storyIdParam = decodeURIComponent(url.pathname.replace(/^\/api\/news\//, ""));
    buildNewsStories()
      .then((stories) => {
        const story = stories.find((item) => item.id === storyIdParam);
        if (!story) {
          sendJson(res, 404, { error: "News story not found." });
          return;
        }
        sendJson(res, 200, { data: story }, { "X-GCX-Data-Source": "live+local" });
      })
      .catch((error) => {
        console.warn(`News story load failed: ${error.message}`);
        sendJson(res, 500, { error: "News story could not be loaded.", detail: "The news story could not be loaded right now." });
      });
    return;
  }

  if (url.pathname.startsWith("/api/community")) {
    handleCommunityApi(req, res, url);
    return;
  }

  if (url.pathname.startsWith("/api/auth")) {
    handleAuthApi(req, res, url);
    return;
  }

  if (url.pathname.startsWith("/api/games/")) {
    if (await handleGameDetailApi(req, res, url)) return;
  }

  if (url.pathname === "/api/image-proxy") {
    if (await handleImageProxy(req, res, url)) return;
  }

  if (url.pathname.startsWith("/api/pokemon/")) {
    if (await handleSupabasePokemonData(req, res, url)) return;
    handlePokemonProxy(req, res, url);
    return;
  }

  if (url.pathname.startsWith("/api/magic/")) {
    if (await handleSupabaseMagicData(req, res, url)) return;
    if (handleLocalMagicData(req, res, url)) return;
    sendJson(res, 404, { error: "Magic data is not available." });
    return;
  }

  if (url.pathname.startsWith("/api/yugioh/")) {
    if (await handleSupabaseYugiohData(req, res, url)) return;
    if (handleLocalYugiohData(req, res, url)) return;
    sendJson(res, 404, { error: "Yu-Gi-Oh! data is not available." });
    return;
  }

  await handleStatic(req, res, url);
}

const server = http.createServer(handleRequest);

let hydrationPromise = null;

async function ensureHydrated() {
  if (!hydrationPromise) {
    hydrationPromise = hydrateCommunityDataFromSupabase().catch((error) => {
      hydrationPromise = null;
      throw error;
    });
  }
  return hydrationPromise;
}

async function startServer() {
  const hydrated = await ensureHydrated();
  server.listen(port, () => {
    const keyStatus = process.env.POKEMON_TCG_API_KEY ? "with API key" : "without API key";
    const supabaseStatus = supabaseConfigured() ? `Supabase ${hydrated ? "hydrated" : "configured"}` : "Supabase not configured";
    console.log(`Games Exchange running at http://localhost:${port} (${keyStatus}, ${supabaseStatus})`);
  });
}

async function vercelHandler(req, res) {
  await ensureHydrated();
  return handleRequest(req, res);
}

module.exports = vercelHandler;
module.exports.server = server;
module.exports.handleRequest = handleRequest;

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Server could not start: ${error.message}`);
    process.exitCode = 1;
  });
}
