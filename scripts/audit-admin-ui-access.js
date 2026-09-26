const { chromium } = require("./playwright-loader");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "admin-ui-access.json");

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
    const response = await page.goto(`${base}/community-admin.html`, { waitUntil: "networkidle", timeout: 20000 });
    const accessText = await page.locator("#moderation-summary").innerText();
    const closeoutText = await page.locator("#streamer-closeout-summary").innerText();
    const postQueueText = await page.locator("#moderation-posts").innerText();
    const commentQueueText = await page.locator("#moderation-comments").innerText();
    const nominationQueueText = await page.locator("#moderation-nominations").innerText();
    const sponsorLeadText = await page.locator("#moderation-sponsor-leads").innerText();
    const disabledControls = await page.locator("#streamer-closeout-form input:disabled, #streamer-closeout-form textarea:disabled, #streamer-closeout-form button:disabled").count();
    const totalControls = await page.locator("#streamer-closeout-form input, #streamer-closeout-form textarea, #streamer-closeout-form button").count();
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1);
    const queueText = [postQueueText, commentQueueText, nominationQueueText, sponsorLeadText].join("\n");

    const ok =
      response?.status() === 200 &&
      /sign in|staff/i.test(accessText) &&
      /sign in|staff/i.test(closeoutText) &&
      /sign in|staff/i.test(queueText) &&
      !/approve|remove|activate creator|reject|mark contacted|proposal|archive/i.test(queueText) &&
      totalControls > 0 &&
      disabledControls === totalControls &&
      !overflow &&
      consoleErrors.length === 0;

    const report = {
      generatedAt: new Date().toISOString(),
      base,
      ok,
      status: response?.status(),
      hasSignedOutSummary: /sign in|staff/i.test(accessText),
      hasSignedOutQueues: /sign in|staff/i.test(queueText),
      hidesStaffActions: !/approve|remove|activate creator|reject|mark contacted|proposal|archive/i.test(queueText),
      disabledControls,
      totalControls,
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
