const { chromium } = require("./playwright-loader");
const fs = require("node:fs");
const pathModule = require("node:path");

const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const rootDir = pathModule.join(__dirname, "..");
const outputPath = pathModule.join(rootDir, "data", "launch-readiness", "runtime-links.json");

const seedPages = [
  "/",
  "/news.html",
  "/games.html",
  "/consoles.html",
  "/pokemon.html",
  "/magic.html",
  "/yugioh.html",
  "/community.html",
  "/community-groups.html",
  "/community-events.html",
  "/community-members.html",
  "/streamers.html",
  "/sponsors.html",
  "/search.html",
  "/article.html?id=gcx-newsroom-pokemon-tcg-30th-celebration-complete-guide",
  "/console.html?id=nintendo-switch",
  "/dreamcast-game.html?id=dreamcast-sonic-adventure",
  "/magic-card.html?set=10e&id=7a5cd03c-4227-4551-aa4b-7d119f0468b5",
];

function isInternal(url) {
  try {
    return new URL(url, base).origin === base;
  } catch (error) {
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const consoleErrors = [];
  const hrefs = new Map();
  const pageResults = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`${page.url()} :: ${message.text()}`);
  });

  for (const path of seedPages) {
    const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const data = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      links: Array.from(document.querySelectorAll("a[href]")).map((anchor) => ({
        href: anchor.getAttribute("href"),
        text: anchor.textContent.trim().replace(/\s+/g, " ").slice(0, 80),
      })),
    }));

    pageResults.push({ path, status: response?.status(), overflow: data.overflow, linkCount: data.links.length });

    for (const link of data.links) {
      if (!link.href || link.href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(link.href)) continue;
      const absolute = new URL(link.href, `${base}${path}`).href;
      if (!isInternal(absolute)) continue;
      const normalized = absolute.replace(/#.*$/, "");
      if (!hrefs.has(normalized)) hrefs.set(normalized, []);
      hrefs.get(normalized).push({ from: path, text: link.text });
    }
  }

  const checks = [];
  for (const [url, refs] of hrefs) {
    const response = await page.request.get(url, { maxRedirects: 0 });
    checks.push({ url: url.replace(base, ""), status: response.status(), refs: refs.slice(0, 3) });
  }

  await browser.close();

  const broken = checks.filter((item) => item.status >= 400);
  const ok = pageResults.every((item) => item.status === 200 && !item.overflow) && broken.length === 0 && consoleErrors.length === 0;
  const result = {
    generatedAt: new Date().toISOString(),
    ok,
    base,
    seedPages: pageResults,
    checkedLinks: checks.length,
    broken,
    consoleErrors,
  };
  fs.mkdirSync(pathModule.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result, null, 2));

  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
