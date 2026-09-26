const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const outputPath = path.join(outputDir, "client-auth-storage-hygiene.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function writeReport(report) {
  const fullReport = {
    generatedAt: new Date().toISOString(),
    base,
    ...report,
  };
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(fullReport, null, 2)}\n`);
  return fullReport;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const authJs = fs.readFileSync(path.join(rootDir, "auth.js"), "utf8");
  const siteJs = fs.readFileSync(path.join(rootDir, "site.js"), "utf8");
  const staticChecks = [
    {
      name: "auth page stores session saved-at timestamp",
      ok: /sessionSavedAtStorageKey/.test(authJs) && /localStorage\.setItem\(sessionSavedAtStorageKey,\s*String\(Date\.now\(\)\)\)/.test(authJs),
    },
    {
      name: "auth page clears session saved-at timestamp",
      ok: /localStorage\.removeItem\(sessionSavedAtStorageKey\)/.test(authJs),
    },
    {
      name: "global header checks stale session storage",
      ok: /headerStoredSessionIsStale/.test(siteJs) && /gcxHeaderMaxStoredSessionAgeMs/.test(siteJs),
    },
    {
      name: "global header clears saved-at timestamp",
      ok: /localStorage\.removeItem\(gcxHeaderSessionSavedAtStorageKey\)/.test(siteJs),
    },
  ];
  const staticFailures = staticChecks.filter((check) => !check.ok);
  assert(staticFailures.length === 0, `Static auth storage checks failed: ${staticFailures.map((check) => check.name).join("; ")}`);

  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    await page.goto(`${base}/auth.html`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.evaluate(() => {
      localStorage.setItem("gcx-session-token-v1", "stale-access-token");
      localStorage.setItem("gcx-refresh-token-v1", "stale-refresh-token");
      localStorage.setItem("gcx-community-viewer-v1", "stale-viewer");
      localStorage.setItem("gcx-session-saved-at-v1", String(Date.now() - 1000 * 60 * 60 * 24 * 30));
    });
    await page.reload({ waitUntil: "networkidle" });
    const authStorage = await page.evaluate(() => ({
      token: localStorage.getItem("gcx-session-token-v1"),
      refresh: localStorage.getItem("gcx-refresh-token-v1"),
      viewer: localStorage.getItem("gcx-community-viewer-v1"),
      savedAt: localStorage.getItem("gcx-session-saved-at-v1"),
      sessionText: document.querySelector("#auth-session")?.textContent || "",
      accountText: document.querySelector(".account-link")?.textContent || "",
    }));
    assert(!authStorage.token && !authStorage.refresh && !authStorage.viewer && !authStorage.savedAt, "Auth page should clear stale stored session values.");
    assert(/no one is logged in/i.test(authStorage.sessionText), "Auth page should render a signed-out session after stale token cleanup.");

    await page.goto(`${base}/index.html`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.evaluate(() => {
      localStorage.setItem("gcx-session-token-v1", "stale-access-token");
      localStorage.setItem("gcx-refresh-token-v1", "stale-refresh-token");
      localStorage.setItem("gcx-community-viewer-v1", "stale-viewer");
      localStorage.setItem("gcx-session-saved-at-v1", String(Date.now() - 1000 * 60 * 60 * 24 * 30));
    });
    await page.reload({ waitUntil: "networkidle" });
    const headerStorage = await page.evaluate(() => ({
      token: localStorage.getItem("gcx-session-token-v1"),
      refresh: localStorage.getItem("gcx-refresh-token-v1"),
      viewer: localStorage.getItem("gcx-community-viewer-v1"),
      savedAt: localStorage.getItem("gcx-session-saved-at-v1"),
      accountText: document.querySelector(".account-link")?.textContent || "",
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1,
    }));
    assert(!headerStorage.token && !headerStorage.refresh && !headerStorage.viewer && !headerStorage.savedAt, "Global header should clear stale stored session values.");
    assert(/sign in/i.test(headerStorage.accountText), "Global header should show Sign In after stale token cleanup.");
    assert(!headerStorage.overflow, "Home page should not overflow at 390px during auth storage audit.");

    const report = writeReport({
      ok: consoleErrors.length === 0,
      staticChecks,
      authStorageCleared: true,
      headerStorageCleared: true,
      consoleErrors,
    });
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  const report = writeReport({
    ok: false,
    error: error.message || String(error),
  });
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
