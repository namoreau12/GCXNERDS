const { chromium } = require("./playwright-loader");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "image-queue-workflow-ui.json");

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
    const response = await page.goto(`${base}/image-queue.html`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.locator("#queue-summary article").first().waitFor({ timeout: 20000 });
    await page.locator("#queue-workplan .queue-workplan-card").waitFor({ timeout: 20000 });
    await page.locator("#queue-coverage-plan .queue-milestone-card").waitFor({ timeout: 20000 });
    await page.locator("#queue-provider-readiness .queue-provider-tile").first().waitFor({ timeout: 20000 });
    await page.locator("#queue-import-readiness .queue-import-card").waitFor({ timeout: 20000 });
    await page.locator(".queue-record").first().waitFor({ timeout: 20000 });

    const workplanText = await page.locator("#queue-workplan").innerText();
    const milestoneText = await page.locator("#queue-coverage-plan").innerText();
    const providerText = await page.locator("#queue-provider-readiness").innerText();
    const importReadinessText = await page.locator("#queue-import-readiness").innerText();
    const providerTileCount = await page.locator("#queue-provider-readiness .queue-provider-tile").count();
    const milestoneBatchCount = await page.locator("#queue-milestone-batches a").count();
    const queueModeOptions = await page.locator("#queue-mode option").count();
    const initialRecordCount = await page.locator(".queue-record").count();
    const firstMilestonePlatform = await page.locator(".queue-milestone-steps button").first().getAttribute("data-platform");
    if (firstMilestonePlatform) {
      await page.locator(".queue-milestone-steps button").first().click();
    }
    const selectedPlatform = await page.locator("#queue-platform").inputValue();
    const filteredText = await page.locator("#queue-records").innerText();
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1);
    const ok =
      response?.status() === 200 &&
      /next safe action/i.test(workplanText) &&
      /ready now/i.test(workplanText) &&
      /open review batch/i.test(workplanText) &&
      /90% coverage milestone/i.test(workplanText) &&
      /next coverage milestone/i.test(milestoneText) &&
      /approved images to/i.test(milestoneText) &&
      /image provider readiness/i.test(providerText) &&
      /mobygames/i.test(providerText) &&
      /rawg/i.test(providerText) &&
      /import readiness/i.test(importReadinessText) &&
      /approved rows ready to import/i.test(importReadinessText) &&
      /mobygames key/i.test(importReadinessText) &&
      /next approval batch/i.test(importReadinessText) &&
      /gameboy/i.test(importReadinessText) &&
      /external approved source/i.test(importReadinessText) &&
      /90% milestone batch/i.test(importReadinessText) &&
      /90-pct-image-review-batch\.csv/i.test(importReadinessText) &&
      providerTileCount >= 4 &&
      milestoneBatchCount >= 3 &&
      queueModeOptions >= 2 &&
      initialRecordCount > 0 &&
      (!firstMilestonePlatform || selectedPlatform === firstMilestonePlatform) &&
      (!firstMilestonePlatform || filteredText.toLowerCase().includes(firstMilestonePlatform.toLowerCase())) &&
      !overflow &&
      consoleErrors.length === 0;

    const report = {
      generatedAt: new Date().toISOString(),
      base,
      ok,
      status: response?.status(),
          hasMilestone: /next coverage milestone/i.test(milestoneText),
          hasWorkplan: /next safe action/i.test(workplanText),
          hasWorkplanCoverageMilestone: /90% coverage milestone/i.test(workplanText),
          hasProviderReadiness: /image provider readiness/i.test(providerText),
          hasImportReadiness: /import readiness/i.test(importReadinessText),
          hasProviderKeyStatus: /mobygames key/i.test(importReadinessText),
          hasWorkplanNextReview: /next approval batch/i.test(importReadinessText) && /gameboy/i.test(importReadinessText) && /external approved source/i.test(importReadinessText),
          hasMilestoneNextReview: /90% milestone batch/i.test(importReadinessText) && /90-pct-image-review-batch\.csv/i.test(importReadinessText),
          providerTileCount,
          milestoneBatchCount,
          queueModeOptions,
      initialRecordCount,
      firstMilestonePlatform,
      selectedPlatform,
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
