const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "game-image-fallback-ui.json");
const libraryCompletenessPath = path.join(rootDir, "data", "games", "library-completeness.json");
const base = process.env.GCX_AUDIT_BASE_URL || `http://localhost:${process.env.PORT || "3000"}`;
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const pageTargets = [
  { slug: "gamecube", path: "/gamecube.html", filter: "#gamecube-image-filter", label: "GameCube" },
  { slug: "dreamcast", path: "/dreamcast.html", filter: "#dreamcast-image-filter", label: "Dreamcast" },
  { slug: "xbox", path: "/xbox.html", filter: "#xbox-image-filter", label: "Original Xbox" },
  { slug: "snes", path: "/snes.html", filter: "#snes-image-filter", label: "SNES" },
  { slug: "gba", path: "/gba.html", filter: "#gba-image-filter", label: "GBA" },
  { slug: "saturn", path: "/saturn.html", filter: "#saturn-image-filter", label: "Saturn" },
  { slug: "gameboy", path: "/gameboy.html", filter: "#gameboy-image-filter", label: "Game Boy" },
  { slug: "ps2", path: "/ps2.html", filter: "#ps2-image-filter", label: "PS2" },
  { slug: "vita", path: "/vita.html", filter: "#vita-image-filter", label: "Vita" },
];

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function targetsWithExpectedMissing() {
  const completeness = readJson(libraryCompletenessPath, {});
  const platformRows = [...(completeness.platforms || []), ...(completeness.priority?.imageBacklog || [])];
  return pageTargets.map((target) => {
    const platform = platformRows.find((row) => row.slug === target.slug || row.platform === target.slug);
    return {
      ...target,
      expectedMissingImages: Number(platform?.missingImages || 0),
    };
  });
}

function writeJson(value) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, outputPath);
}

function isIgnorableConsoleMessage(message) {
  return /Permissions policy violation: compute-pressure is not allowed/i.test(message);
}

async function inspectPage(browser, target) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !isIgnorableConsoleMessage(message.text())) consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const response = await page.goto(`${base}${target.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll(".game-db-card, .index-message").length > 0, null, { timeout: 20000 });
  await page.selectOption(target.filter, "without");
  await page.waitForFunction(() => {
    const summary = document.querySelector('[id$="-summary"]')?.textContent || "";
    return !/loading/i.test(summary) && document.querySelectorAll(".game-db-card, .index-message").length > 0;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(250);

  const result = await page.evaluate(() => {
    const fallbacks = Array.from(document.querySelectorAll(".game-box-art .image-fallback-game"));
    const malformed = fallbacks
      .filter((fallback) => {
        const centerText = fallback.querySelector(".image-fallback-initials")?.textContent?.trim() || "";
        return (
          !fallback.querySelector(".image-fallback-eyebrow") ||
          !fallback.querySelector(".image-fallback-initials") ||
          !fallback.querySelector(".image-fallback-note") ||
          centerText === "GCX"
        );
      })
      .map((fallback) => fallback.textContent.trim().replace(/\s+/g, " ").slice(0, 100));
    return {
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1,
      fallbackCount: fallbacks.length,
      malformed,
      sampleText: fallbacks
        .slice(0, 3)
        .map((fallback) => fallback.textContent.trim().replace(/\s+/g, " ")),
    };
  });

  await page.close();
  return {
    path: target.path,
    label: target.label,
    expectedMissingImages: target.expectedMissingImages,
    status: response?.status() || 0,
    consoleErrors,
    ...result,
  };
}

async function main() {
  const browser = await chromium.launch({ executablePath, headless: true });
  const results = [];
  try {
    for (const target of targetsWithExpectedMissing()) {
      results.push(await inspectPage(browser, target));
    }
  } finally {
    await browser.close();
  }

  const failures = [];
  results.forEach((result) => {
    if (result.status !== 200) failures.push({ path: result.path, issue: `Page returned ${result.status}` });
    if (result.overflow) failures.push({ path: result.path, issue: "Mobile page has horizontal overflow." });
    if (result.expectedMissingImages > 0 && !result.fallbackCount) failures.push({ path: result.path, issue: "Missing-image filter did not render any game fallback cards." });
    if (result.expectedMissingImages === 0 && result.fallbackCount) failures.push({ path: result.path, issue: "Complete platform still rendered missing-image fallback cards." });
    result.malformed.forEach((text) => failures.push({ path: result.path, issue: "Game fallback did not use the launch-ready placeholder structure.", text }));
    result.consoleErrors.forEach((message) => failures.push({ path: result.path, issue: "Browser console error", message }));
  });

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    base,
    checkedPages: results.length,
    results,
    failures,
  };
  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  const report = {
    ok: false,
    generatedAt: new Date().toISOString(),
    base,
    checkedPages: 0,
    results: [],
    failures: [{ issue: error.message || String(error) }],
  };
  writeJson(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
});
