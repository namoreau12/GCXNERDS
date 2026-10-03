const mobileHeader = document.querySelector(".site-header");
const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
const primaryNav = document.querySelector("#primary-nav");
const fallbackImage = "assets/news/gamescom-2026-showcase.jpg";
const fallbackImageAbsolute = new URL(fallbackImage, window.location.href).href;
const accountLink = document.querySelector(".account-link");
const gcxHeaderSessionStorageKey = "gcx-session-token-v1";
const gcxHeaderRefreshStorageKey = "gcx-refresh-token-v1";
const gcxHeaderViewerStorageKey = "gcx-community-viewer-v1";
const gcxHeaderSessionSavedAtStorageKey = "gcx-session-saved-at-v1";
const gcxHeaderMaxStoredSessionAgeMs = 1000 * 60 * 60 * 24 * 14;

function escapeSharedHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const weakGameOverviewPatterns = [
  /officially released/i,
  /\bofficial release\s+(?:record|library|entry)\b/i,
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
  /\b(?:Codex|ChatGPT) should\b/i,
  /\bdo not publish\b/i,
];

function gcxGameOverviewText(game) {
  return String(game?.description || game?.gcxOverview || game?.overview || "").replace(/\s+/g, " ").trim();
}

function gcxGameOverviewIsEditorial(game) {
  const overview = gcxGameOverviewText(game);
  if (overview.length < 80) return false;
  return !weakGameOverviewPatterns.some((pattern) => pattern.test(overview));
}

function gcxGameEditorialStatus(game) {
  if (game?.overviewStatus === "needs_editorial") return "needs_editorial";
  return gcxGameOverviewIsEditorial(game) && (game?.overviewStatus === "published" || game?.descriptionProvider) ? "published" : "needs_editorial";
}

function gcxGameEditorialStatusLabel(status) {
  return status === "published" ? "Published overview" : "In editorial review";
}

function gcxGameOverviewDisplay(game, platformLabel = "game") {
  if (gcxGameEditorialStatus(game) === "published") return gcxGameOverviewText(game);
  return `Editorial overview in review. This ${platformLabel} record is being checked for source-backed gameplay context, regional notes, and collector relevance.`;
}

window.GCX_GAME_COPY = {
  overviewText: gcxGameOverviewText,
  isEditorial: gcxGameOverviewIsEditorial,
  status: gcxGameEditorialStatus,
  statusLabel: gcxGameEditorialStatusLabel,
  overviewDisplay: gcxGameOverviewDisplay,
};

async function gcxLoadGameDetail(platformSlug, gameId, fallbackDataUrl) {
  const slug = String(platformSlug || "").trim().toLowerCase();
  const id = String(gameId || "").trim();
  if (!slug || !id) return null;

  if (window.location.protocol !== "file:") {
    try {
      const response = await fetch(`/api/games/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const result = await response.json();
        if (result?.data?.id) return result.data;
      }
      if (response.status !== 404) {
        throw new Error(`Game detail API returned ${response.status}`);
      }
    } catch (error) {
      console.warn(`GCX game detail API fallback for ${slug}/${id}: ${error.message}`);
    }
  }

  if (!fallbackDataUrl) return null;
  const response = await fetch(fallbackDataUrl, { cache: "no-store" });
  const games = await response.json();
  return Array.isArray(games) ? games.find((item) => item.id === id) || null : null;
}

window.GCX_GAME_DATA = {
  loadDetail: gcxLoadGameDetail,
};

const displayableTcgImageStatuses = new Set([
  "approved",
  "official-approved",
  "permissioned",
  "api-permitted",
  "api-sourced-review-required",
]);

const hiddenTcgImageStatuses = new Set(["source-link-only", "needs-review", "blocked", "unknown"]);

function firstTcgImageUrl(item, size = "normal") {
  return (
    item?.imageUrl ||
    item?.images?.[size] ||
    item?.images?.normal ||
    item?.images?.small ||
    item?.imageUris?.[size] ||
    item?.imageUris?.normal ||
    item?.imageUris?.small ||
    item?.cardFaces?.find((face) => face.imageUris)?.imageUris?.[size] ||
    ""
  );
}

function normalizeTcgIdentitySegment(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function tcgCardNumber(item = {}) {
  return (
    item.cardNumberDisplay ||
    item.cardNumber ||
    item.collectorNumber ||
    item.number ||
    item.setCode ||
    item.printingCode ||
    ""
  );
}

function tcgSetCode(item = {}) {
  const setObject = item.set && typeof item.set === "object" ? item.set : {};
  return item.setCode || item.setId || setObject.id || setObject.code || (typeof item.set === "string" ? item.set : "") || item.setName || setObject.name || "";
}

function tcgVariantLabel(item = {}) {
  const values = [
    item.variant,
    item.rarity,
    item.setRarity,
    item.layout,
    ...(Array.isArray(item.finishes) ? item.finishes : []),
    ...(Array.isArray(item.subtypes) ? item.subtypes : []),
    item.isPromo || item.promo ? "promo" : "",
    item.isAlternateArt || item.variation ? "alternate-art" : "",
    item.isReverseHolo ? "reverse-holo" : "",
    item.isStamped ? "stamped" : "",
  ].filter(Boolean);
  return Array.from(new Set(values.map(normalizeTcgIdentitySegment))).join(" / ");
}

function canonicalTcgCardKey(item = {}, franchise = "tcg", options = {}) {
  const includeVariant = options.includeVariant !== false;
  return [
    normalizeTcgIdentitySegment(franchise),
    normalizeTcgIdentitySegment(tcgSetCode(item)),
    normalizeTcgIdentitySegment(tcgCardNumber(item)),
    normalizeTcgIdentitySegment(item.cardName || item.name || item.title),
    includeVariant ? normalizeTcgIdentitySegment(tcgVariantLabel(item)) : "",
    normalizeTcgIdentitySegment(item.language || item.lang || "en"),
  ].join("|");
}

function dedupeTcgCards(items = [], franchise = "tcg", options = {}) {
  const seen = new Map();
  const duplicates = [];

  for (const item of items) {
    const key = item.canonicalKey || canonicalTcgCardKey(item, franchise, options);
    if (!key.replace(/\|/g, "")) continue;
    if (seen.has(key)) {
      duplicates.push({ key, first: seen.get(key), duplicate: item });
      continue;
    }
    seen.set(key, item);
  }

  return {
    cards: [...seen.values()],
    duplicates,
  };
}

function renderTcgAdminWarnings(warnings = []) {
  const visibleWarnings = warnings.filter(Boolean);
  if (!visibleWarnings.length) return "";
  return `
    <div class="tcg-admin-warning" role="status">
      ${visibleWarnings.map((warning) => `<span>${escapeSharedHtml(warning)}</span>`).join("")}
    </div>
  `;
}

function tcgImageSourceUrl(item, imageUrl = "") {
  return (
    item?.imageSourceUrl ||
    item?.scryfallUri ||
    item?.ygoprodeckUrl ||
    item?.tcgplayer?.url ||
    item?.cardmarket?.url ||
    item?.sourceUrl ||
    imageUrl ||
    ""
  );
}

function inferTcgImagePolicy(item = {}, imageUrl = "") {
  const explicitStatus = String(item.imageRightsStatus || item.rightsStatus || item.mediaRightsStatus || "").trim().toLowerCase();
  const provider = String(item.imageProvider || item.mediaProvider || "").trim();
  const url = String(imageUrl || firstTcgImageUrl(item) || "");
  let host = "";

  try {
    host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch (error) {
    host = "";
  }

  if (explicitStatus) {
    return {
      status: explicitStatus,
      provider,
      sourceUrl: tcgImageSourceUrl(item, url),
      note:
        item.imageRightsNote ||
        item.rightsNote ||
        (hiddenTcgImageStatuses.has(explicitStatus)
          ? "Image held until usage rights are approved."
          : "Image display status recorded in GCX media metadata."),
    };
  }

  if (host.endsWith("scryfall.io")) {
    return {
      status: "api-permitted",
      provider: provider || "Scryfall API",
      sourceUrl: tcgImageSourceUrl(item, url),
      note: "API-provided image; preserve full card frame, artist, and copyright details.",
    };
  }

  if (host.endsWith("ygoprodeck.com")) {
    return {
      status: "api-sourced-review-required",
      provider: provider || "YGOPRODeck API",
      sourceUrl: tcgImageSourceUrl(item, url),
      note: "Source-linked API card image. Preserve the full card frame and review usage rights before launch.",
    };
  }

  if (host.endsWith("pokemontcg.io")) {
    return {
      status: "api-sourced-review-required",
      provider: provider || "Pokemon TCG API",
      sourceUrl: tcgImageSourceUrl(item, url),
      note: "Source-linked API card image. Preserve the full card frame and review usage rights before launch.",
    };
  }

  return {
    status: url ? "needs-review" : "unknown",
    provider,
    sourceUrl: tcgImageSourceUrl(item, url),
    note: url ? "Image held until usage rights are approved." : "No approved card image is available yet.",
  };
}

function canDisplayTcgImage(item = {}, imageUrl = "") {
  return displayableTcgImageStatuses.has(inferTcgImagePolicy(item, imageUrl).status);
}

function renderTcgImage(item = {}, options = {}) {
  const imageUrl = options.imageUrl || firstTcgImageUrl(item, options.size || "normal");
  const policy = inferTcgImagePolicy(item, imageUrl);
  const label = options.name || item.name || item.title || "Card";
  const alt = options.alt || `${label} card image`;
  const sourceUrl = policy.sourceUrl;
  const sourceLink = sourceUrl
    ? `<a href="${escapeSharedHtml(sourceUrl)}" target="_blank" rel="noopener">View source card page</a>`
    : "";
  const policyNote = options.showPolicyNote === false ? "" : `<p class="image-rights-note">${escapeSharedHtml(policy.note)} ${sourceLink}</p>`;

  if (imageUrl && canDisplayTcgImage(item, imageUrl)) {
    const className = options.className ? ` class="${escapeSharedHtml(options.className)}"` : "";
    return `<img${className} src="${escapeSharedHtml(imageUrl)}" alt="${escapeSharedHtml(alt)}" loading="${options.loading || "lazy"}" decoding="async" data-image-rights-status="${escapeSharedHtml(policy.status)}" data-image-provider="${escapeSharedHtml(policy.provider)}" />${policyNote}`;
  }

  const placeholderClass = ["image-fallback", "image-fallback-card", options.className].filter(Boolean).join(" ");
  return `<span class="${escapeSharedHtml(placeholderClass)}" role="img" aria-label="${escapeSharedHtml(`${label} image unavailable`)}">Image unavailable</span>${policyNote}`;
}

window.GCX_TCG_MEDIA = {
  inferPolicy: inferTcgImagePolicy,
  canDisplay: canDisplayTcgImage,
  firstImageUrl: firstTcgImageUrl,
  renderImage: renderTcgImage,
};

window.GCX_TCG_IDENTITY = {
  canonicalKey: canonicalTcgCardKey,
  dedupeCards: dedupeTcgCards,
  renderAdminWarnings: renderTcgAdminWarnings,
};

function hydrateImageCardDebugMode() {
  const isLocalDev =
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (!isLocalDev) return;

  const params = new URLSearchParams(window.location.search);
  if (params.has("debugImageCards")) {
    const shouldEnable = params.get("debugImageCards") !== "0";
    localStorage.setItem("gcx-debug-image-cards", shouldEnable ? "1" : "0");
  }

  if (localStorage.getItem("gcx-debug-image-cards") === "1") {
    document.documentElement.dataset.gcxDebugImageCards = "true";
  } else {
    delete document.documentElement.dataset.gcxDebugImageCards;
  }
}

hydrateImageCardDebugMode();

function clearHeaderSession() {
  localStorage.removeItem(gcxHeaderSessionStorageKey);
  localStorage.removeItem(gcxHeaderRefreshStorageKey);
  localStorage.removeItem(gcxHeaderViewerStorageKey);
  localStorage.removeItem(gcxHeaderSessionSavedAtStorageKey);
}

function headerStoredSessionIsStale(now = Date.now()) {
  const hasStoredToken = Boolean(localStorage.getItem(gcxHeaderSessionStorageKey) || localStorage.getItem(gcxHeaderRefreshStorageKey));
  if (!hasStoredToken) return false;
  const savedAt = Number(localStorage.getItem(gcxHeaderSessionSavedAtStorageKey) || 0);
  return !savedAt || now - savedAt > gcxHeaderMaxStoredSessionAgeMs;
}

function saveHeaderSession(result) {
  if (result?.token) localStorage.setItem(gcxHeaderSessionStorageKey, result.token);
  if (result?.refreshToken) localStorage.setItem(gcxHeaderRefreshStorageKey, result.refreshToken);
  if (result?.data?.profile?.id) localStorage.setItem(gcxHeaderViewerStorageKey, result.data.profile.id);
  localStorage.setItem(gcxHeaderSessionSavedAtStorageKey, String(Date.now()));
}

async function refreshHeaderSession() {
  if (headerStoredSessionIsStale()) {
    clearHeaderSession();
    return null;
  }
  const refreshToken = localStorage.getItem(gcxHeaderRefreshStorageKey);
  if (!refreshToken) return null;

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const result = await response.json();
    if (!response.ok || !result.token) throw new Error(result.error || "Refresh failed.");
    saveHeaderSession(result);
    return result;
  } catch (error) {
    clearHeaderSession();
    return null;
  }
}

async function loadHeaderSession() {
  if (headerStoredSessionIsStale()) {
    clearHeaderSession();
    return null;
  }
  const token = localStorage.getItem(gcxHeaderSessionStorageKey);
  if (!token) {
    if (localStorage.getItem(gcxHeaderRefreshStorageKey)) clearHeaderSession();
    return null;
  }

  try {
    const response = await fetch("/api/auth/session", {
      headers: { "X-GCX-Session": token },
      cache: "no-store",
    });
    const result = await response.json();
    if (result.authenticated) {
      if (result.data?.profile?.id) localStorage.setItem(gcxHeaderViewerStorageKey, result.data.profile.id);
      return result;
    }
    if (result.refreshAvailable) return refreshHeaderSession();
    clearHeaderSession();
    return null;
  } catch (error) {
    return null;
  }
}

async function hydrateAccountLink() {
  if (!accountLink) return;
  const result = await loadHeaderSession();
  if (!result?.authenticated && !result?.token) {
    accountLink.textContent = "Sign In";
    accountLink.href = "auth.html";
    return;
  }
  const viewerId = result?.data?.profile?.id || localStorage.getItem(gcxHeaderViewerStorageKey);
  accountLink.textContent = "Profile";
  accountLink.href = viewerId ? `profile.html?id=${encodeURIComponent(viewerId)}` : "profile.html";
}

function prepareImage(image) {
  if (!(image instanceof HTMLImageElement)) return;
  if (image.dataset.gcxImagePrepared === "true") return;
  image.dataset.gcxImagePrepared = "true";
  syncImageMediaClassification(image);
  const kind = getFallbackKind(image);
  if (kind === "game") routeLegacyGameImageThroughProxy(image);
  if (!image.hasAttribute("loading")) image.setAttribute("loading", kind === "avatar" ? "eager" : "lazy");
  if (!image.hasAttribute("decoding")) image.setAttribute("decoding", "async");
  const isSetBadge = image.closest(".set-card, .selected-set");
  const dimensions =
    image.classList.contains("article-hero-image")
      ? ["1200", "675"]
      : kind === "card" && !isSetBadge
        ? ["630", "880"]
        : isSetBadge
          ? ["160", "160"]
          : ["640", "360"];
  if (!image.hasAttribute("width")) image.setAttribute("width", dimensions[0]);
  if (!image.hasAttribute("height")) image.setAttribute("height", dimensions[1]);
  image.addEventListener("error", () => {
    if (image.dataset.gcxFallbackApplied === "true") return;
    image.dataset.gcxFallbackApplied = "true";
    replaceImageWithPlaceholder(image, kind);
  });
}

function inferImageMediaType(image) {
  const explicit =
    image.dataset.mediaType ||
    image.closest("[data-media-type]")?.getAttribute("data-media-type") ||
    image.getAttribute("data-media-type") ||
    "";
  const normalizedExplicit = explicit.trim().toLowerCase();
  if (normalizedExplicit) return normalizedExplicit;

  const source = String(image.getAttribute("src") || image.currentSrc || image.src || "").toLowerCase();
  const label = `${image.alt || ""} ${image.closest("article, figure, section")?.textContent || ""}`.toLowerCase();
  if (/\.svg(?:\?|$)/i.test(source)) return "graphic";
  if (/(chart|diagram|infographic|tracker|pricing|price|msrp|data graphic|editorial graphic)/i.test(`${source} ${label}`)) {
    return "graphic";
  }
  if (image.closest(".game-box-art, .game-detail-art")) return "game-art";
  if (image.closest(".console-art, .console-detail-media")) return "console-art";
  if (image.closest(".card-detail, .card-tile, .pokemon-card, .selected-set, .set-card, .pikachu-card-art")) return "card-art";
  return "photo";
}

function syncImageMediaClassification(image) {
  const mediaType = inferImageMediaType(image);
  image.dataset.mediaType = mediaType;

  const mediaContainer = image.closest(
    ".story-card-image, .news-card-image, .news-compact a:first-child, .news-lead, .hero-story, .image-text-card, .feature-hero, .editorial-media, .editorial-gallery"
  );
  if (mediaContainer && !mediaContainer.getAttribute("data-media-type")) {
    mediaContainer.setAttribute("data-media-type", mediaType);
  }

  const focalOwner = image.closest(".story-card-image, .news-card-image, .news-lead, .hero-story, .image-text-card, .feature-hero");
  if (focalOwner && !focalOwner.style.getPropertyValue("--image-card-focal-x")) {
    focalOwner.style.setProperty("--image-card-focal-x", "50%");
    focalOwner.style.setProperty("--image-card-focal-y", mediaType === "photo" ? "42%" : "50%");
  }
}

function getFallbackKind(image) {
  if (
    image.closest(".game-box-art, .game-detail-art") ||
    image.classList.contains("game-cover") ||
    image.classList.contains("game-box")
  ) {
    return "game";
  }

  if (
    image.closest(".card-page-detail, .card-detail, .card-tile, .pokemon-card, .selected-set, .set-card, .pikachu-card-art") ||
    image.classList.contains("card-image")
  ) {
    return "card";
  }

  if (image.closest(".console-art, .console-detail-media")) return "console";
  if (image.closest(".feed-avatar, .member-directory-avatar, .profile-avatar")) return "avatar";

  return "editorial";
}

function routeLegacyGameImageThroughProxy(image) {
  if (window.location.protocol === "file:" || image.dataset.gcxImageProxyApplied === "true") return;
  let parsed;
  try {
    parsed = new URL(image.getAttribute("src") || image.src, window.location.href);
  } catch (error) {
    return;
  }
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "download.xbox.com") return;
  if (parsed.protocol === "https:") parsed.protocol = "http:";
  image.dataset.gcxImageProxyApplied = "true";
  image.dataset.gcxOriginalSrc = image.getAttribute("src") || image.src;
  image.src = `/api/image-proxy?url=${encodeURIComponent(parsed.href)}`;
}

function fallbackLabelFor(image, kind) {
  const explicitAlt = image.getAttribute("alt")?.trim();
  if (explicitAlt) return explicitAlt;
  const parentTitle = image.closest("article, .card, .story-card, .news-card, .game-card, .streamer-card, .feed-card")
    ?.querySelector("h1, h2, h3, strong")
    ?.textContent
    ?.trim();
  if (parentTitle) return parentTitle;
  const labels = {
    avatar: "GCX member",
    card: "Card artwork",
    console: "Console image",
    game: "Game box art",
    editorial: "GCX editorial image",
  };
  return labels[kind] || "GCX image";
}

function fallbackInitials(label, kind) {
  const cleaned = label
    .replace(/\b(the|and|for|with|edition|version)\b/gi, " ")
    .replace(/[^a-z0-9\s]/gi, " ")
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (!parts.length) return kind === "card" ? "TCG" : "GCX";
  if (kind === "card") return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return parts.slice(0, 3).map((part) => part[0]).join("").toUpperCase();
}

function fallbackNoteFor(label, kind) {
  const normalized = String(label || "").toLowerCase();
  if (kind === "game") {
    return normalized.includes("not confirmed") || normalized.includes("no standard")
      ? "Retail art unconfirmed"
      : "Verified source needed";
  }
  if (kind === "card") return "Image unavailable";
  if (kind === "console") return "Image unavailable";
  return "Media unavailable";
}

function fallbackEyebrowFor(kind) {
  const labels = {
    card: "Card image",
    console: "Console image",
    game: "Cover art",
    editorial: "Media",
  };
  return labels[kind] || "Image";
}

function fallbackCenterLabel(label, kind) {
  if (kind === "game") return "Queued";
  if (kind === "editorial") return "GCX";
  return fallbackInitials(label, kind);
}

function prepareFallbackPlaceholder(element) {
  if (!(element instanceof Element)) return;
  if (!element.classList.contains("image-fallback")) return;
  if (element.dataset.gcxFallbackPrepared === "true") return;
  const kind = Array.from(element.classList)
    .find((className) => className.startsWith("image-fallback-"))
    ?.replace("image-fallback-", "") || "editorial";
  if (kind === "avatar") {
    element.dataset.gcxFallbackPrepared = "true";
    return;
  }
  const label = element.getAttribute("aria-label") || element.textContent || "";
  const centerLabel = fallbackCenterLabel(element.textContent || label, kind);
  element.dataset.gcxFallbackPrepared = "true";
  element.innerHTML = `
    <span class="image-fallback-eyebrow">${escapeHtml(fallbackEyebrowFor(kind))}</span>
    <span class="image-fallback-initials">${escapeHtml(centerLabel)}</span>
    <span class="image-fallback-note">${escapeHtml(fallbackNoteFor(label, kind))}</span>
  `;
}

function replaceImageWithPlaceholder(image, kind) {
  const label = fallbackLabelFor(image, kind);
  const placeholder = document.createElement("span");
  placeholder.className = `image-fallback image-fallback-${kind}`;
  placeholder.setAttribute("role", "img");
  placeholder.setAttribute("aria-label", `${label} image unavailable`);
  placeholder.textContent = kind === "avatar" ? fallbackInitials(label, kind).slice(0, 2) : fallbackInitials(label, kind);
  prepareFallbackPlaceholder(placeholder);
  image.replaceWith(placeholder);
}

document.querySelectorAll("img").forEach(prepareImage);
document.querySelectorAll(".image-fallback").forEach(prepareFallbackPlaceholder);

const imageObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLImageElement) prepareImage(node);
      if (node instanceof Element) {
        if (node.classList.contains("image-fallback")) prepareFallbackPlaceholder(node);
        node.querySelectorAll("img").forEach(prepareImage);
        node.querySelectorAll(".image-fallback").forEach(prepareFallbackPlaceholder);
      }
    });
  });
});

imageObserver.observe(document.documentElement, { childList: true, subtree: true });

function closeMobileNav() {
  mobileNavToggle?.setAttribute("aria-expanded", "false");
  primaryNav?.classList.remove("is-open");
}

mobileNavToggle?.addEventListener("click", () => {
  const isOpen = mobileNavToggle.getAttribute("aria-expanded") === "true";
  mobileNavToggle.setAttribute("aria-expanded", String(!isOpen));
  primaryNav?.classList.toggle("is-open", !isOpen);
});

primaryNav?.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  closeMobileNav();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileNav();
});

document.querySelectorAll(".nav-trigger").forEach((trigger) => {
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");
  const menu = trigger.closest(".nav-menu");
  menu?.addEventListener("focusin", () => trigger.setAttribute("aria-expanded", "true"));
  menu?.addEventListener("focusout", () => trigger.setAttribute("aria-expanded", "false"));
  menu?.addEventListener("mouseenter", () => trigger.setAttribute("aria-expanded", "true"));
  menu?.addEventListener("mouseleave", () => trigger.setAttribute("aria-expanded", "false"));
});

document.addEventListener(
  "error",
  (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (image.dataset.fallbackApplied === "true") return;
    image.dataset.fallbackApplied = "true";
    const kind = getFallbackKind(image);
    if (kind === "editorial" && image.currentSrc !== fallbackImageAbsolute && image.src !== fallbackImageAbsolute) {
      image.src = fallbackImage;
      image.alt = image.alt || "GCX editorial image";
      return;
    }
    replaceImageWithPlaceholder(image, kind);
  },
  true
);

async function postFormJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Submission could not be saved.");
  return result;
}

document.querySelector(".newsletter form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".newsletter-status") || form.parentElement.querySelector(".newsletter-status");
  const email = form.querySelector('input[type="email"]')?.value.trim();
  if (status) status.textContent = "Saving...";

  try {
    const result = await postFormJson("/api/newsletter", {
      email,
      sourcePage: window.location.pathname,
      referrer: document.referrer,
      consentVersion: "gcx-launch-v1",
    });
    form.reset();
    if (status) status.textContent = `Subscribed ${result.data.email}.`;
  } catch (error) {
    if (status) status.textContent = error.message;
  }
});

document.querySelector(".trade-card")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".trade-card-status");
  const item = form.querySelector('input[name="item"], input')?.value.trim();
  const intent = form.querySelector('select[name="intent"], select')?.value || "";
  const itemType = form.dataset.itemType || "collector-item";
  const sourceId = form.dataset.sourceId || "";
  if (status) status.textContent = "Saving...";

  try {
    const result = await postFormJson("/api/collector-waitlist", {
      item,
      intent,
      itemType,
      sourceId,
      sourcePage: window.location.pathname,
      referrer: document.referrer,
      consentVersion: "gcx-marketplace-beta-v1",
    });
    form.reset();
    delete form.dataset.itemType;
    delete form.dataset.sourceId;
    if (status) status.textContent = result.data.item
      ? "Interest saved for the marketplace beta waitlist. No listing or payment was created."
      : "Waitlist interest saved. Add an item next time so GCX knows what to prioritize.";
  } catch (error) {
    if (status) status.textContent = error.message;
  }
});

function hydrateMarketplaceWaitlistFromUrl() {
  const form = document.querySelector(".trade-card");
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  const item = params.get("item") || "";
  const intent = params.get("intent") || "";
  const itemType = params.get("itemType") || "";
  const legacyTradeParam = Array.from(params.entries()).find(([key, value]) => key.startsWith("trade") && value);
  const sourceId = params.get("sourceId") || params.get("tradeCard") || params.get("tradeMagicCard") || params.get("tradeYugiohCard") || legacyTradeParam?.[1] || "";
  const itemInput = form.querySelector('input[name="item"]');
  const intentSelect = form.querySelector('select[name="intent"]');
  const status = form.querySelector(".trade-card-status");

  if (item && itemInput) itemInput.value = item;
  if (intent && intentSelect) {
    const option = Array.from(intentSelect.options).find((candidate) => candidate.value === intent || candidate.textContent === intent);
    if (option) intentSelect.value = option.value;
  }
  if (itemType) form.dataset.itemType = itemType;
  if (sourceId) form.dataset.sourceId = sourceId;
  if ((item || sourceId) && status) {
    status.textContent = "Item copied into the beta waitlist form. Submitting saves interest only; no listing, payment, sale, or trade is created.";
  }
}

hydrateMarketplaceWaitlistFromUrl();
hydrateAccountLink();

mobileHeader?.classList.add("is-ready");
