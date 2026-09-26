const { chromium } = require("./playwright-loader");

const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const pagePaths = [
  "/",
  "/news.html",
  "/article.html?id=gcx-newsroom-pokemon-tcg-30th-celebration-complete-guide",
  "/games.html",
  "/pokemon.html",
  "/magic.html",
  "/yugioh.html",
  "/community.html",
  "/streamers.html",
  "/sponsors.html",
  "/trust.html",
  "/search.html",
];

const headerChecks = [
  { path: "/", expectedStatus: 200, expectedContentType: "text/html", expectedCache: "no-cache" },
  { path: "/styles.css", expectedStatus: 200, expectedContentType: "text/css", expectedCache: "no-cache, must-revalidate" },
  { path: "/assets/news/gamescom-2026-showcase.jpg", expectedStatus: 200, expectedContentType: "image/jpeg", expectedCache: "public, max-age=604800" },
  { path: "/api/status", expectedStatus: 200, expectedContentType: "application/json", expectedCache: "no-store" },
  { path: "/robots.txt", expectedStatus: 200, expectedContentType: "text/plain", expectedCache: "no-cache" },
  { path: "/sitemap.xml", expectedStatus: 200, expectedContentType: "application/xml", expectedCache: "no-cache" },
];

const requiredSecurityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

function headerValue(headers, name) {
  return headers[name.toLowerCase()] || "";
}

async function auditHeaders(request) {
  const results = [];

  for (const check of headerChecks) {
    const response = await request.get(`${base}${check.path}`);
    const headers = response.headers();
    const contentType = headerValue(headers, "content-type");
    const cacheControl = headerValue(headers, "cache-control");
    const securityFailures = Object.entries(requiredSecurityHeaders)
      .filter(([name, expected]) => headerValue(headers, name) !== expected)
      .map(([name, expected]) => ({ name, expected, actual: headerValue(headers, name) }));

    results.push({
      path: check.path,
      status: response.status(),
      contentType,
      cacheControl,
      ok:
        response.status() === check.expectedStatus &&
        contentType.includes(check.expectedContentType) &&
        cacheControl === check.expectedCache &&
        securityFailures.length === 0,
      securityFailures,
    });
  }

  return results;
}

async function auditMobilePages(browser) {
  const results = [];

  for (const path of pagePaths) {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(700);

    const toggle = page.locator(".mobile-nav-toggle");
    const toggleCount = await toggle.count();
    let navBefore = null;
    let navAfterOpen = null;
    let navOpen = false;
    let navAfterEscape = null;

    if (toggleCount > 0) {
      navBefore = await toggle.first().getAttribute("aria-expanded");
      await toggle.first().click();
      navAfterOpen = await toggle.first().getAttribute("aria-expanded");
      navOpen = await page.locator("#primary-nav").evaluate((element) => element.classList.contains("is-open"));
      await page.keyboard.press("Escape");
      navAfterEscape = await toggle.first().getAttribute("aria-expanded");
    }

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));

    await page.close();

    const overflow = Math.max(metrics.scrollWidth, metrics.bodyScrollWidth) > metrics.clientWidth + 1;
    results.push({
      path,
      status: response?.status(),
      overflow,
      mobileNavOk: toggleCount > 0 && navBefore === "false" && navAfterOpen === "true" && navOpen && navAfterEscape === "false",
      consoleErrors,
    });
  }

  return results;
}

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext();

  try {
    const headerResults = await auditHeaders(context.request);
    const mobileResults = await auditMobilePages(browser);
    const failures = [
      ...headerResults.filter((result) => !result.ok).map((result) => ({ type: "headers", ...result })),
      ...mobileResults
        .filter((result) => result.status !== 200 || result.overflow || !result.mobileNavOk || result.consoleErrors.length)
        .map((result) => ({ type: "mobile", ...result })),
    ];

    console.log(
      JSON.stringify(
        {
          base,
          headers: headerResults,
          mobilePages: mobileResults,
          failureCount: failures.length,
          failures,
        },
        null,
        2
      )
    );

    process.exit(failures.length === 0 ? 0 : 1);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
