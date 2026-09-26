const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "accessibility-basics.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const pages = [
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
  "/auth.html",
];

async function auditPage(browser, pagePath) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    const response = await page.goto(`${base}${pagePath}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(900);
    const result = await page.evaluate(() => {
      const hasAccessibleName = (element) => {
        const text = element.textContent?.trim();
        const labelledBy = (element.getAttribute("aria-labelledby") || "")
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim())
          .filter(Boolean)
          .join(" ");
        const childLabels = Array.from(element.querySelectorAll("[aria-label]"))
          .map((node) => node.getAttribute("aria-label")?.trim())
          .filter(Boolean)
          .join(" ");
        const childImageAlt = Array.from(element.querySelectorAll("img[alt]"))
          .map((image) => image.getAttribute("alt")?.trim())
          .filter(Boolean)
          .join(" ");
        return Boolean(
          text ||
            labelledBy ||
            childLabels ||
            childImageAlt ||
            element.getAttribute("aria-label") ||
            element.getAttribute("title") ||
            element.getAttribute("alt")
        );
      };
      const hasInputLabel = (element) => {
        if (element.type === "hidden") return true;
        if (element.closest("label")) return true;
        if (element.getAttribute("aria-label") || element.getAttribute("placeholder")) return true;
        const id = element.getAttribute("id");
        return Boolean(id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
      };
      const selectorFor = (element) => {
        const tag = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : "";
        const name = element.getAttribute("name") ? `[name="${element.getAttribute("name")}"]` : "";
        const cls = element.className && typeof element.className === "string" ? `.${element.className.trim().split(/\s+/).slice(0, 2).join(".")}` : "";
        return `${tag}${id}${name}${cls}`;
      };

      const h1s = Array.from(document.querySelectorAll("h1")).map((node) => node.textContent.trim()).filter(Boolean);
      const imageFailures = Array.from(document.images)
        .filter((image) => !image.getAttribute("alt"))
        .map(selectorFor)
        .slice(0, 10);
      const inputFailures = Array.from(document.querySelectorAll("input, select, textarea"))
        .filter((element) => !hasInputLabel(element))
        .map(selectorFor)
        .slice(0, 10);
      const buttonFailures = Array.from(document.querySelectorAll("button"))
        .filter((element) => !hasAccessibleName(element))
        .map(selectorFor)
        .slice(0, 10);
      const linkFailures = Array.from(document.querySelectorAll("a[href]"))
        .filter((element) => !hasAccessibleName(element))
        .map(selectorFor)
        .slice(0, 10);

      return {
        title: document.title.trim(),
        h1s,
        lang: document.documentElement.getAttribute("lang") || "",
        viewport: document.querySelector("meta[name='viewport']")?.getAttribute("content") || "",
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1,
        imageFailures,
        inputFailures,
        buttonFailures,
        linkFailures,
      };
    });

    return {
      path: pagePath,
      status: response?.status(),
      consoleErrors,
      ...result,
      ok:
        response?.status() === 200 &&
        result.title.length > 0 &&
        result.h1s.length === 1 &&
        result.lang === "en" &&
        result.viewport.includes("width=device-width") &&
        !result.overflow &&
        result.imageFailures.length === 0 &&
        result.inputFailures.length === 0 &&
        result.buttonFailures.length === 0 &&
        result.linkFailures.length === 0 &&
        consoleErrors.length === 0,
    };
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const results = [];
    for (const pagePath of pages) {
      results.push(await auditPage(browser, pagePath));
    }
    const failures = results.filter((result) => !result.ok);
    const report = {
      generatedAt: new Date().toISOString(),
      ok: failures.length === 0,
      base,
      checkedPages: results.length,
      pages: results,
      failures,
    };

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
