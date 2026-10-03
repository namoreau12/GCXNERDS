const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "image-text-layout-system.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const pages = [
  "/",
  "/news.html",
  "/article.html?id=gcx-newsroom-gears-of-war-e-day-gamescom-hands-on",
  "/article.html?id=gcx-newsroom-mega-man-dual-override-gamescom-2026",
  "/article.html?id=gcx-newsroom-final-fantasy-vii-revelation-gamescom-2026",
  "/article.html?id=gcx-newsroom-pokemon-tcg-30th-celebration-complete-guide",
  "/games.html",
  "/consoles.html",
  "/pokemon.html",
  "/magic.html",
  "/yugioh.html",
  "/community.html",
  "/streamers.html",
  "/sponsors.html",
  "/trust.html",
  "/search.html?q=Pokemon",
];

const viewports = [
  { width: 390, height: 844, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1280, height: 720, label: "laptop-height" },
  { width: 1440, height: 900, label: "desktop" },
];

function writeJson(value) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, outputPath);
}

function isIgnorableConsoleMessage(message) {
  return /Permissions policy violation: compute-pressure is not allowed/i.test(message);
}

async function inspect(page, targetPath, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const consoleErrors = [];
  page.removeAllListeners("console");
  page.removeAllListeners("pageerror");
  page.on("console", (message) => {
    if (message.type() === "error" && !isIgnorableConsoleMessage(message.text())) consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const response = await page.goto(`${base}${targetPath}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);

  const result = await page.evaluate(() => {
    const roundedRect = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };

    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const failures = [];
    const warnings = [];
    const selectors = [
      ".hero-story",
      ".story-card",
      ".news-lead",
      ".news-card",
      ".news-compact",
      ".feature-hero",
      ".editorial-media",
      ".console-card",
      ".game-db-card",
      ".set-card",
      ".card-search-result",
      ".tcg-card-media",
    ];
    const cards = Array.from(document.querySelectorAll(selectors.join(",")));
    const mediaSelectors = [
      ".story-card-image",
      ".news-card-image",
      ".news-compact a:first-child",
      ".news-lead > a",
      ".feature-hero > img",
      ".hero-story > img",
      ".image-text-card > img",
      ".console-art",
      ".game-box-art",
      ".editorial-image > img",
      ".editorial-gallery img",
      ".tcg-card-media",
    ];

    const intersects = (a, b) =>
      a && b && a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    const normalizeMediaType = (element, source = "") => {
      const explicit = (element?.dataset?.mediaType || element?.closest("[data-media-type]")?.dataset?.mediaType || "").toLowerCase();
      if (explicit) return explicit;
      if (/\.svg(\?|$)/i.test(source)) return "graphic";
      const text = `${source} ${element?.getAttribute?.("alt") || ""} ${element?.closest?.("article, figure, section")?.textContent || ""}`.toLowerCase();
      if (/(chart|diagram|infographic|tracker|pricing|price|msrp|editorial graphic)/i.test(text)) return "graphic";
      return "photo";
    };

    if (Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > viewportWidth + 1) {
      failures.push({
        code: "horizontal-overflow",
        detail: `Page scroll width ${Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)} exceeds viewport ${viewportWidth}.`,
      });
    }

    cards.forEach((card, index) => {
      const cardRect = roundedRect(card);
      const cardLabel =
        card.querySelector("h1, h2, h3, strong")?.textContent?.trim()?.slice(0, 120) ||
        card.getAttribute("aria-label") ||
        `${card.className || card.tagName} #${index}`;
      const images = Array.from(card.querySelectorAll("img"));
      const mediaLinks = Array.from(card.querySelectorAll(mediaSelectors.join(",")));
      const textElements = Array.from(card.querySelectorAll("h1, h2, h3, p, a.button, button.button, .news-card-footer, figcaption, .meta"));
      const buttons = Array.from(card.querySelectorAll("a.button, button.button, .news-card-footer a, .console-card-actions .button"));
      const cardStyle = getComputedStyle(card);
      const isHomeLead = card.id === "home-lead-story";
      const isFeatureHero = card.classList.contains("feature-hero");
      const isNewsLead = card.classList.contains("news-lead");

      if (card.scrollWidth > card.clientWidth + 2 || card.scrollHeight > card.clientHeight + 2) {
        const overflowYAllowed = cardStyle.overflowY === "visible" || cardStyle.overflowY === "auto";
        const overflowXAllowed = cardStyle.overflowX === "visible" || cardStyle.overflowX === "clip";
        if (!overflowYAllowed || !overflowXAllowed) {
          failures.push({ code: "card-content-clipped", card: cardLabel, rect: cardRect });
        }
      }

      textElements.forEach((element) => {
        const style = getComputedStyle(element);
        const hasIntentionalLineClamp = style.webkitLineClamp && style.webkitLineClamp !== "none";
        if (element.scrollWidth > element.clientWidth + 2 && !["visible", "clip"].includes(style.overflowX)) {
          failures.push({ code: "text-clipped-x", card: cardLabel, text: element.textContent.trim().slice(0, 120), rect: roundedRect(element) });
        }
        if (element.scrollHeight > element.clientHeight + 2 && !hasIntentionalLineClamp && !["visible", "clip"].includes(style.overflowY)) {
          failures.push({ code: "text-clipped-y", card: cardLabel, text: element.textContent.trim().slice(0, 120), rect: roundedRect(element) });
        }
      });

      buttons.forEach((button) => {
        const buttonRect = roundedRect(button);
        if (
          buttonRect.left < cardRect.left - 1 ||
          buttonRect.right > cardRect.right + 1 ||
          buttonRect.top < cardRect.top - 1 ||
          buttonRect.bottom > cardRect.bottom + 1
        ) {
          failures.push({ code: "button-outside-card", card: cardLabel, button: button.textContent.trim().slice(0, 80), rect: buttonRect });
        }
      });

      mediaLinks.forEach((media) => {
        const mediaRect = roundedRect(media);
        const mediaImage = media.matches("img") ? media : media.querySelector("img");
        const mediaSource = mediaImage?.currentSrc || mediaImage?.src || mediaImage?.getAttribute("src") || "";
        const mediaType = normalizeMediaType(mediaImage || media, mediaSource);
        if (mediaType === "graphic" && (isHomeLead || isNewsLead || isFeatureHero) && card.querySelector(".hero-copy, .feature-hero-copy")) {
          const copy = card.querySelector(".hero-copy, .feature-hero-copy, .image-text-card__copy");
          if (copy && intersects(mediaRect, roundedRect(copy))) {
            failures.push({ code: "graphic-lead-copy-over-media", card: cardLabel, source: mediaSource, media: mediaRect, copy: roundedRect(copy) });
          }
        }
        textElements.forEach((element) => {
          if (media.contains(element)) {
            const safe = media.dataset.overlaySafe === "true" || element.closest("[data-overlay-safe='true']");
            if (!safe && !element.classList.contains("image-fallback")) {
              failures.push({
                code: "text-inside-media-without-safe-overlay",
                card: cardLabel,
                text: element.textContent.trim().slice(0, 120),
                media: mediaRect,
              });
            }
            return;
          }
          const style = getComputedStyle(element);
          const safe = media.dataset.overlaySafe === "true" || element.closest("[data-overlay-safe='true']");
          if (style.position !== "absolute" && style.position !== "fixed" && !safe) return;
          if (intersects(mediaRect, roundedRect(element))) {
            failures.push({
              code: safe ? "safe-overlay-text-overlaps-media" : "text-overlaps-media",
              card: cardLabel,
              text: element.textContent.trim().slice(0, 120),
              media: mediaRect,
            });
          }
        });
      });

      images.forEach((image) => {
        const source = image.currentSrc || image.getAttribute("src") || "";
        const imageRect = roundedRect(image);
        const style = getComputedStyle(image);
        const mediaType = normalizeMediaType(image, source);
        if (image.complete && image.naturalWidth === 0) {
          failures.push({ code: "broken-image", card: cardLabel, source });
        }
        if (mediaType === "graphic" && style.objectFit === "cover") {
          failures.push({ code: "graphic-cropped-as-cover", card: cardLabel, source, rect: imageRect });
        }
        if (isHomeLead && /\.svg(\?|$)/i.test(source)) {
          failures.push({ code: "svg-homepage-lead", card: cardLabel, source });
        }
      });

      if ((isHomeLead || isNewsLead || isFeatureHero) && cardRect.height > Math.min(760, viewportHeight * 0.95)) {
        failures.push({ code: "lead-card-too-tall", card: cardLabel, rect: cardRect, viewportHeight });
      }

      if (card.classList.contains("story-card") && cardRect.height > Math.min(620, viewportHeight * 0.86)) {
        failures.push({ code: "story-card-too-tall", card: cardLabel, rect: cardRect, viewportHeight });
      }

      if (card.classList.contains("news-card") && cardRect.height > Math.min(520, viewportHeight * 0.78)) {
        failures.push({ code: "news-card-too-tall", card: cardLabel, rect: cardRect, viewportHeight });
      }

      if (isHomeLead) {
        const image = card.querySelector("img");
        const copy = card.querySelector(".hero-copy, .image-text-card__copy");
        if (image && copy && intersects(roundedRect(image), roundedRect(copy))) {
          failures.push({ code: "home-lead-copy-overlaps-image", card: cardLabel });
        }
      }
    });

    return {
      location: `${location.pathname}${location.search}`,
      viewportWidth,
      viewportHeight,
      checkedComponentCount: cards.length,
      inventory: {
        homeLead: document.querySelectorAll(".hero-story").length,
        storyCards: document.querySelectorAll(".story-card").length,
        newsLeads: document.querySelectorAll(".news-lead").length,
        newsCards: document.querySelectorAll(".news-card").length,
        compactNewsCards: document.querySelectorAll(".news-compact").length,
        articleHeroes: document.querySelectorAll(".feature-hero, .article-hero-image").length,
        editorialMedia: document.querySelectorAll(".editorial-media").length,
        libraryMedia: document.querySelectorAll(".console-art, .game-box-art").length,
        cardMedia: document.querySelectorAll(".tcg-card-media, .set-card img, .card-search-result img").length,
        graphics: document.querySelectorAll('[data-media-type="graphic"], img[data-media-type="graphic"], img[src$=".svg"]').length,
      },
      failures,
      warnings,
    };
  });

  return {
    path: targetPath,
    viewport: viewport.label,
    size: `${viewport.width}x${viewport.height}`,
    status: response?.status() || 0,
    consoleErrors,
    ...result,
  };
}

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  const results = [];
  try {
    for (const targetPath of pages) {
      for (const viewport of viewports) {
        results.push(await inspect(page, targetPath, viewport));
      }
    }
  } finally {
    await browser.close();
  }

  const failures = results.flatMap((result) => [
    ...(result.status === 200 ? [] : [{ path: result.path, viewport: result.viewport, code: "page-status", detail: `HTTP ${result.status}` }]),
    ...result.failures.map((failure) => ({ path: result.path, viewport: result.viewport, ...failure })),
  ]);
  const consoleWarnings = results.flatMap((result) =>
    result.consoleErrors.map((message) => ({ path: result.path, viewport: result.viewport, code: "console-error", message }))
  );
  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    base,
    checkedPages: pages.length,
    checkedViewportCount: viewports.length,
    checkedResults: results.length,
    checkedComponentCount: results.reduce((sum, result) => sum + Number(result.checkedComponentCount || 0), 0),
    failures,
    consoleWarningCount: consoleWarnings.length,
    consoleWarnings,
    results,
  };

  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  const report = {
    ok: false,
    generatedAt: new Date().toISOString(),
    base,
    checkedPages: 0,
    checkedViewportCount: viewports.length,
    checkedResults: 0,
    checkedComponentCount: 0,
    failures: [{ code: "audit-crash", detail: error.message || String(error) }],
    consoleWarningCount: 0,
    consoleWarnings: [],
    results: [],
  };
  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
