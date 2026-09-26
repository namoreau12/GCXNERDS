const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const outputPath = path.join(rootDir, "data", "launch-readiness", "newsroom-visible-markdown-leaks.json");
const baseArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const base = (baseArg ? baseArg.slice("--base-url=".length) : process.env.GCX_AUDIT_BASE_URL) || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function normalizeTableText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/\u00e2\u20ac[\u201c\u201d]/g, "-")
    .replace(/[\u2010-\u2015\u2212]/g, "-");
}

function storyHasMarkdownTable(story) {
  return (story.body || []).some((block) => {
    if (block && typeof block === "object" && block.type === "table") return true;
    const text = normalizeTableText(block);
    return text.includes("|") && (/\|\s*:?-{3,}:?\s*\|/.test(text) || /\|\s*\|\s*:?-{3,}:?/.test(text));
  });
}

function isIgnorableConsoleMessage(message) {
  return /Permissions policy violation: compute-pressure is not allowed/i.test(message);
}

async function inspectPath(browser, targetPath, viewport) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const response = await page.goto(`${base}${targetPath}`, { waitUntil: "networkidle" });
  const visible = await page.evaluate(() => {
    const text = document.body.textContent.replace(/\s+/g, " ").trim();
    const separatorPattern = /\|\s*:?-{3,}:?\s*\|/;
    const pipeTablePattern = /\|\s*[^|]{2,}\s*\|\s*[^|]{2,}\s*\|/;
    return {
      visibleMarkdownSeparator: separatorPattern.test(text),
      visiblePipeTableText: pipeTablePattern.test(text),
      snippet: separatorPattern.test(text) || pipeTablePattern.test(text)
        ? text.slice(Math.max(0, text.search(separatorPattern) - 80), Math.max(220, text.search(separatorPattern) + 220))
        : "",
    };
  });

  await page.close();
  return {
    path: targetPath,
    viewport: `${viewport.width}x${viewport.height}`,
    status: response?.status() || 0,
    ...visible,
    consoleErrors: consoleErrors.filter((message) => !isIgnorableConsoleMessage(message)),
  };
}

async function main() {
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  const articlePaths = stories
    .filter((story) => story && story.id)
    .map((story) => `/article.html?id=${encodeURIComponent(story.id)}`);
  const tableArticlePaths = stories
    .filter(storyHasMarkdownTable)
    .map((story) => `/article.html?id=${encodeURIComponent(story.id)}`);
  const paths = [
    "/",
    "/news.html",
    "/search.html?q=Pokemon",
    "/search.html?q=console",
    ...articlePaths,
  ];
  const viewports = [
    { width: 1280, height: 900 },
    { width: 390, height: 900 },
  ];

  const browser = await chromium.launch({ executablePath, headless: true });
  const results = [];
  for (const targetPath of paths) {
    for (const viewport of viewports) {
      results.push(await inspectPath(browser, targetPath, viewport));
    }
  }
  await browser.close();

  const failures = [];
  results.forEach((result) => {
    if (result.status !== 200) failures.push({ path: result.path, viewport: result.viewport, issue: `Page returned ${result.status}` });
    if (result.visibleMarkdownSeparator) failures.push({ path: result.path, viewport: result.viewport, issue: "Visible Markdown table separator leaked.", snippet: result.snippet });
    if (result.visiblePipeTableText) failures.push({ path: result.path, viewport: result.viewport, issue: "Visible pipe-delimited table text leaked.", snippet: result.snippet });
  });
  const consoleWarnings = results.flatMap((result) =>
    result.consoleErrors.map((message) => ({
      path: result.path,
      viewport: result.viewport,
      issue: "Browser console error",
      message,
    }))
  );

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    base,
    checkedPageCount: results.length,
    articlePageCount: articlePaths.length,
    tableArticleCount: tableArticlePaths.length,
    results,
    consoleWarningCount: consoleWarnings.length,
    consoleWarnings,
    failures,
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  const report = {
    ok: false,
    generatedAt: new Date().toISOString(),
    base,
    checkedPageCount: 0,
    articlePageCount: 0,
    tableArticleCount: 0,
    results: [],
    failures: [{ issue: error.message || String(error) }],
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
