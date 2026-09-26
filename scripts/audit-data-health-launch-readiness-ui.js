const { chromium } = require("./playwright-loader");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "data-health-launch-readiness-ui.json");
const articleReadthroughPath = path.join(rootDir, "data", "launch-readiness", "newsroom-editorial-readthrough.json");
const officialMediaQueuePath = path.join(rootDir, "data", "launch-readiness", "newsroom-official-media-queue.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(value) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, outputPath);
}

async function main() {
  const articleReadthroughReport = readJson(articleReadthroughPath, {});
  const officialMediaQueueReport = readJson(officialMediaQueuePath, {});
  const articleIssueCount = Number(articleReadthroughReport.articlesNeedingEditorialPass || 0);
  const officialMediaQueueCount = Number(officialMediaQueueReport.queueCount || 0);
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    const response = await page.goto(`${base}/data-health.html`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.locator("#health-launch-readiness .health-readiness-card").waitFor({ timeout: 20000 });
    await page.locator("#health-article-readthrough .health-readiness-card").waitFor({ timeout: 20000 });
    await page.locator("#health-official-media-queue .health-readiness-card").waitFor({ timeout: 20000 });
    await page.locator("#health-workflow").waitFor({ timeout: 20000 });
    const launchText = await page.locator("#health-launch-readiness").innerText();
    const articleReadthroughText = await page.locator("#health-article-readthrough").innerText();
    const officialMediaText = await page.locator("#health-official-media-queue").innerText();
    const workflowText = await page.locator("#health-workflow").innerText();
    const gateCount = await page.locator(".launch-gate-card").count();
    const articleReadthroughCardCount = await page.locator(".article-readthrough-card").count();
    const officialMediaCardCount = await page.locator("#health-official-media-queue .article-readthrough-card").count();
    const nextActionCount = await page.locator(".launch-next-actions li").count();
    const hasCoverageMilestone = /coverage milestone/i.test(workflowText);
    const hasOverviewQuality = /overview quality/i.test(workflowText);
    const hasWeakOverviewCount = /\bweak\b/i.test(workflowText);
    const hasImageProvenance = /image provenance/i.test(workflowText);
    const hasProviderCoverage = /providers/i.test(workflowText);
    const hasSourceCoverage = /source url coverage/i.test(workflowText);
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1);
    const ok =
      response?.status() === 200 &&
      /launch status/i.test(launchText) &&
      /supabase launch data/i.test(launchText) &&
      /supabase auth/i.test(launchText) &&
      /released articles/i.test(articleReadthroughText) &&
      /editorial|source|media|pacing|human read/i.test(articleReadthroughText) &&
      /media replacements/i.test(officialMediaText) &&
      /official|screenshot|key art|trailer/i.test(officialMediaText) &&
      hasCoverageMilestone &&
      hasOverviewQuality &&
      hasWeakOverviewCount &&
      hasImageProvenance &&
      hasProviderCoverage &&
      hasSourceCoverage &&
      gateCount >= 8 &&
      articleReadthroughCardCount >= Math.min(1, articleIssueCount) &&
      officialMediaCardCount >= Math.min(1, officialMediaQueueCount) &&
      nextActionCount >= 2 &&
      !overflow &&
      consoleErrors.length === 0;

    const report = {
      generatedAt: new Date().toISOString(),
      base,
      ok,
      status: response?.status(),
      gateCount,
      articleReadthroughCardCount,
      officialMediaCardCount,
      articleIssueCount,
      officialMediaQueueCount,
      nextActionCount,
      hasCoverageMilestone,
      hasOverviewQuality,
      hasWeakOverviewCount,
      hasImageProvenance,
      hasProviderCoverage,
      hasSourceCoverage,
      overflow,
      consoleErrors,
    };
    writeJson(report);
    console.log(JSON.stringify(report, null, 2));

    process.exit(ok ? 0 : 1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
