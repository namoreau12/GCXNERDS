const { chromium } = require("./playwright-loader");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "overview-queue-workflow-ui.json");

function writeJson(value) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, outputPath);
}

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    const response = await page.goto(`${base}/overview-queue.html`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.locator("#overview-summary article").first().waitFor({ timeout: 20000 });
    await page.locator("#overview-import-health .queue-import-card").first().waitFor({ timeout: 20000 });

    const summaryText = await page.locator("#overview-summary").innerText();
    const workflowText = await page.locator(".queue-milestone-card").innerText();
    const importHealthText = await page.locator("#overview-import-health").innerText();
    const workplanText = await page
      .locator("#overview-import-health .queue-import-card")
      .filter({ hasText: "Overview Workplan" })
      .first()
      .innerText()
      .catch(() => "");
    const batchDownloadCount = await page.locator("#overview-batches a").count();
    const platformCount = await page.locator("#overview-platforms .queue-platform-card").count();
    const initialRecordCount = await page.locator(".overview-record").count();
    const firstPlatform = platformCount
      ? await page.locator("#overview-platforms .queue-platform-card").first().getAttribute("data-platform")
      : "";
    if (firstPlatform) {
      await page.locator("#overview-platforms .queue-platform-card").first().click();
    }
    const selectedPlatform = await page.locator("#overview-platform").inputValue();
    const filteredText = await page.locator("#overview-records").innerText();
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1);
    const completedState =
      /batches\s+0/i.test(summaryText) &&
      /rows staged\s+0/i.test(summaryText) &&
      /weak overviews\s+0/i.test(summaryText) &&
      /no weak\/template-style overviews remain/i.test(importHealthText);
    await page.locator("#overview-search").fill(completedState ? "metadata" : "weak-template");
    const searchedRecordCount = await page.locator(".overview-record").count();

    const ok =
      response?.status() === 200 &&
      /rows staged/i.test(summaryText) &&
      /import ready/i.test(summaryText) &&
      /approved/i.test(summaryText) &&
      /pending approved imports/i.test(summaryText) &&
      /already applied/i.test(summaryText) &&
      /weak rate/i.test(summaryText) &&
      /safe import workflow/i.test(workflowText) &&
      /freshness audit/i.test(workflowText) &&
      /dry-run/i.test(workflowText) &&
      /import health/i.test(importHealthText) &&
      /overview workplan/i.test(workplanText) &&
      /next rewrite batch/i.test(workplanText) &&
      /data\/games\/overview-rewrite-batches\//i.test(workplanText) &&
      /dry-run/i.test(workplanText) &&
      /approved rows ready/i.test(importHealthText) &&
      /rejected/i.test(importHealthText) &&
      /repair reasons/i.test(importHealthText) &&
      /open repair csv/i.test(importHealthText) &&
      /open refresh packet/i.test(importHealthText) &&
      (completedState || batchDownloadCount >= 8) &&
      (completedState || platformCount >= 8) &&
      (completedState || initialRecordCount > 0) &&
      (!firstPlatform || selectedPlatform === firstPlatform) &&
      (!firstPlatform || filteredText.toLowerCase().includes(firstPlatform.toLowerCase())) &&
      (completedState || searchedRecordCount > 0) &&
      !overflow &&
      consoleErrors.length === 0;

    const report = {
      generatedAt: new Date().toISOString(),
      base,
      ok,
      status: response?.status(),
      hasSummary: /rows staged/i.test(summaryText) && /import ready/i.test(summaryText),
      hasProgressMetrics:
        /approved/i.test(summaryText) &&
        /pending approved imports/i.test(summaryText) &&
        /already applied/i.test(summaryText) &&
        /weak rate/i.test(summaryText),
      hasImportWorkflow: /safe import workflow/i.test(workflowText) && /freshness audit/i.test(workflowText) && /dry-run/i.test(workflowText),
      hasImportHealth:
        /import health/i.test(importHealthText) &&
        /approved rows ready/i.test(importHealthText) &&
        /rejected/i.test(importHealthText) &&
        /repair reasons/i.test(importHealthText) &&
        /open repair csv/i.test(importHealthText) &&
        /open refresh packet/i.test(importHealthText),
      hasWorkplanNextRewrite:
        /overview workplan/i.test(workplanText) &&
        /next rewrite batch/i.test(workplanText) &&
        /data\/games\/overview-rewrite-batches\//i.test(workplanText) &&
        /dry-run/i.test(workplanText),
      batchDownloadCount,
      platformCount,
      initialRecordCount,
      completedState,
      firstPlatform,
      selectedPlatform,
      searchedRecordCount,
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
