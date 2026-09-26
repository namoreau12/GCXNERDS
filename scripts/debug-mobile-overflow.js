const { chromium } = require("./playwright-loader");

const targetPath = process.argv[2] || "/";
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  try {
    await page.goto(`${base}${targetPath}`, { waitUntil: "networkidle", timeout: 20000 });
    const result = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const offenders = [...document.querySelectorAll("body *")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            className: String(element.className || ""),
            text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            display: style.display,
            position: style.position,
            whiteSpace: style.whiteSpace,
            overflowX: style.overflowX,
          };
        })
        .filter((item) => item.right > viewportWidth + 1 || item.left < -1)
        .sort((a, b) => b.right - a.right)
        .slice(0, 40);
      return {
        path: location.pathname,
        viewportWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        offenders,
      };
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
