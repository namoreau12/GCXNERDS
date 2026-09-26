const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const assetsDir = path.join(rootDir, "assets", "news");
const outputPath = path.join(rootDir, "data", "launch-readiness", "editorial-svg-text-fit.json");
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function listSvgFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listSvgFiles(fullPath);
      return entry.isFile() && entry.name.toLowerCase().endsWith(".svg") ? [fullPath] : [];
    })
    .sort();
}

function writeJson(report) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function inspectSvg(page, filePath) {
  await page.goto(pathToFileURL(filePath).toString(), { waitUntil: "domcontentloaded", timeout: 15000 });
  return page.evaluate(() => {
    const svg = document.querySelector("svg");
    if (!svg) return { ok: false, failures: [{ code: "missing-svg-root" }] };

    const boxFor = (element) => {
      const box = element.getBoundingClientRect();
      if (!box.width || !box.height) return null;
      return {
        x: Number(box.x.toFixed(2)),
        y: Number(box.y.toFixed(2)),
        width: Number(box.width.toFixed(2)),
        height: Number(box.height.toFixed(2)),
        right: Number(box.right.toFixed(2)),
        bottom: Number(box.bottom.toFixed(2)),
      };
    };
    const contains = (outer, inner, padding = 0) =>
      outer &&
      inner &&
      inner.x >= outer.x + padding &&
      inner.y >= outer.y + padding &&
      inner.right <= outer.right - padding &&
      inner.bottom <= outer.bottom - padding;
    const intersects = (a, b) =>
      a && b && a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
    const normalizedFill = (element) => String(element.getAttribute("fill") || getComputedStyle(element).fill || "").toLowerCase();
    const isDarkPanelText = (element) => {
      const fill = normalizedFill(element);
      return ["#15171d", "#4a4f5b", "rgb(21, 23, 29)", "rgb(74, 79, 91)"].includes(fill);
    };
    const isLightPanel = (element) => {
      const fill = normalizedFill(element);
      return fill.includes("url") || ["#fff8e8", "#fffaf0", "#f3e7d1", "#f1e6d2"].includes(fill);
    };

    const canvas = boxFor(svg);
    const lightPanels = Array.from(svg.querySelectorAll("rect")).filter(isLightPanel).map(boxFor).filter(Boolean);
    const failures = [];

    Array.from(svg.querySelectorAll("text")).forEach((text) => {
      const box = boxFor(text);
      const label = text.textContent.trim();
      if (!box || !label) return;
      if (!contains(canvas, box, 4)) {
        failures.push({ code: "svg-text-outside-canvas", text: label.slice(0, 120), box });
      }
      if (isDarkPanelText(text)) {
        const panel = lightPanels.find((candidate) => intersects(candidate, box));
        if (!panel) {
          failures.push({ code: "dark-text-missing-light-panel", text: label.slice(0, 120), box });
          return;
        }
        if (!contains(panel, box, 8)) {
          failures.push({ code: "svg-text-overflows-panel", text: label.slice(0, 120), box, panel });
        }
      }
    });

    return { ok: failures.length === 0, failures };
  });
}

async function main() {
  const files = listSvgFiles(assetsDir);
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const results = [];
  try {
    for (const filePath of files) {
      const result = await inspectSvg(page, filePath);
      results.push({
        file: path.relative(rootDir, filePath).replace(/\\/g, "/"),
        ...result,
      });
    }
  } finally {
    await browser.close();
  }

  const failures = results.flatMap((result) => result.failures.map((failure) => ({ file: result.file, ...failure })));
  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedFiles: results.length,
    failures,
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
    checkedFiles: 0,
    failures: [{ code: "audit-crash", detail: error.message || String(error) }],
    results: [],
  };
  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
