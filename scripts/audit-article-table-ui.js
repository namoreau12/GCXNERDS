const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const outputPath = path.join(rootDir, "data", "launch-readiness", "article-table-ui.json");
const baseArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const base = (baseArg ? baseArg.slice("--base-url=".length) : process.env.GCX_AUDIT_BASE_URL) || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function storyHasMarkdownTable(story) {
  return (story.body || []).some((block) => {
    if (block && typeof block === "object" && block.type === "table") return true;
    const text = String(block || "")
      .replace(/\u00a0/g, " ")
      .replace(/&#x20;|&nbsp;/gi, " ")
      .replace(/\u00e2\u20ac[\u201c\u201d]/g, "-")
      .replace(/[\u2010-\u2015\u2212]/g, "-");
    return text.includes("|") && (/\|\s*:?-{3,}:?\s*\|/.test(text) || /\|\s*\|\s*:?-{3,}:?/.test(text) || /\|\s*[^|\n]{2,}\s*\|\s*[^|\n]{2,}\s*\|/.test(text));
  });
}

function isIgnorableConsoleMessage(message) {
  return /Permissions policy violation: compute-pressure is not allowed/i.test(message);
}

async function main() {
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8")).filter(storyHasMarkdownTable);
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  const results = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(`${page.url()} :: ${message.text()}`);
  });

  for (const story of stories) {
    const articlePath = `/article.html?id=${encodeURIComponent(story.id)}`;
    try {
      const response = await page.goto(`${base}${articlePath}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForFunction(
        () =>
          document.querySelector(".article-data-table, .article-table-wrap--fallback, .article-markdown-fallback") ||
          /article not found/i.test(document.body.textContent || ""),
        null,
        { timeout: 15000 }
      ).catch(() => {});
      const result = await page.evaluate(() => {
        const bodyText = document.body.textContent.replace(/\s+/g, " ");
        const articleTables = Array.from(document.querySelectorAll(".article-data-table"));
        return {
          articleTableCount: articleTables.length,
          fallbackTableCount: document.querySelectorAll(".article-table-wrap--fallback, .article-markdown-fallback").length,
          visibleMarkdownSeparator: /\|\s*:?-{3,}:?\s*\|/.test(bodyText) || /\|\s*[\u2010-\u2015\u2212]{3,}\s*\|/.test(bodyText),
          leakedPipeTableText: /\|\s*[^|]{2,}\s*\|\s*[^|]{2,}\s*\|/.test(bodyText),
          renderedRows: articleTables.reduce((sum, table) => sum + table.querySelectorAll("tbody tr").length, 0),
        };
      });

      results.push({
        storyId: story.id,
        path: articlePath,
        status: response?.status() || 0,
        ...result,
      });
    } catch (error) {
      results.push({
        storyId: story.id,
        path: articlePath,
        status: 0,
        articleTableCount: 0,
        fallbackTableCount: 0,
        visibleMarkdownSeparator: false,
        leakedPipeTableText: false,
        renderedRows: 0,
        loadError: error.message || String(error),
      });
    }
  }

  await browser.close();

  const failures = [];
  results.forEach((result) => {
    if (result.loadError) failures.push({ storyId: result.storyId, issue: result.loadError });
    if (result.status !== 200) failures.push({ storyId: result.storyId, issue: `Article returned ${result.status}` });
    if (!result.articleTableCount) failures.push({ storyId: result.storyId, issue: "No rendered article tables found." });
    if (!result.renderedRows) failures.push({ storyId: result.storyId, issue: "Rendered article tables have no body rows." });
    if (result.fallbackTableCount) failures.push({ storyId: result.storyId, issue: "Article used Markdown table fallback instead of parsed table markup." });
    if (result.visibleMarkdownSeparator) failures.push({ storyId: result.storyId, issue: "Visible Markdown table separator leaked into article body." });
    if (result.leakedPipeTableText) failures.push({ storyId: result.storyId, issue: "Pipe-delimited table text appears visible instead of rendered markup." });
  });
  consoleErrors
    .filter((message) => !isIgnorableConsoleMessage(message))
    .forEach((message) => failures.push({ issue: "Browser console error", message }));

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    base,
    storyCount: stories.length,
    results,
    ignoredConsoleMessages: consoleErrors.filter(isIgnorableConsoleMessage),
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
    storyCount: 0,
    results: [],
    failures: [{ issue: error.message || String(error) }],
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
