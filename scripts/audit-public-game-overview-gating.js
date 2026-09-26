const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./playwright-loader");
const { isGameDatasetFile } = require("./game-dataset-utils");

const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "data", "games");
const outputPath = path.join(rootDir, "data", "launch-readiness", "public-game-overview-gating.json");
const executablePath = process.env.CHROME_EXECUTABLE_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const base = process.env.GCX_AUDIT_BASE_URL || "http://localhost:3000";

const weakPatterns = [
  /officially released/i,
  /official release/i,
  /game record/i,
  /licensed north american/i,
  /software list/i,
  /\bbelongs to the .{0,80}\blibrary published by .{0,160}\bfirst appearing in \d{4}\b/i,
  /\bits identity comes from the .{0,80}\bcatalog'?s mix of handheld spin-offs, imports, ports, compilations, and smaller experiments\b/i,
  /\bregion, exact edition, manual, and cover-art details\b/i,
  /\bwhere publisher context, region, and\b/i,
  /\bfor players comparing listings,? the important checks are\b/i,
  /\bfor trading,? the safest listing should spell out region, format, edition, included extras, condition\b/i,
  /\bit translates (?:a sport|sports|a hobby|hobby) (?:or hobby )?into\b/i,
  /for collectors,? the key identifiers are/i,
  /released around \d{4}/i,
  /is a (?:party|shooter|strategy|visual novel|role-playing|racing|sports|simulation|action) game for/i,
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function overviewText(game) {
  return String(game.description || game.gcxOverview || game.overview || "").replace(/\s+/g, " ").trim();
}

function weakOverview(game) {
  const overview = overviewText(game);
  return overview.length > 0 && weakPatterns.some((pattern) => pattern.test(overview));
}

function weakProbeText(game) {
  const overview = overviewText(game);
  const match = weakPatterns.map((pattern) => overview.match(pattern)?.[0]).find(Boolean);
  return String(match || overview).replace(/\s+/g, " ").trim().slice(0, 120);
}

function samples() {
  return fs
    .readdirSync(dataDir)
    .filter(isGameDatasetFile)
    .sort()
    .flatMap((fileName) => {
      const slug = fileName.replace(/\.json$/, "");
      const games = readJson(path.join(dataDir, fileName));
      if (!Array.isArray(games)) return [];
      return games
        .filter((game) => game.id && weakOverview(game))
        .slice(0, 2)
        .map((game) => ({ slug, id: game.id, title: game.title || game.name || game.id, weakText: overviewText(game).slice(0, 180), weakProbe: weakProbeText(game) }));
    });
}

async function inspectPage(page, target) {
  const pagePath = `/${target.slug}-game.html?id=${encodeURIComponent(target.id)}&auditBust=${Date.now()}`;
  const response = await page.goto(`${base}${pagePath}`, { waitUntil: "networkidle", timeout: 30000 });
  const result = await page.evaluate((weakProbe) => {
    const bodyText = document.body.innerText.replace(/\s+/g, " ");
    const overviewText = Array.from(document.querySelectorAll(".console-detail-note"))
      .map((node) => node.innerText || "")
      .join(" ")
      .replace(/\s+/g, " ");
    const weakFragments = [
      "officially released",
      "official release",
      "game record",
      "region, exact edition",
      "where publisher context",
      "for players comparing listings",
      "catalog's mix of handheld spin-offs",
      "for trading, the safest listing should spell out",
      "for collectors, the key identifiers are",
      "software list",
      "should appeal to players looking for character growth",
      "asks players to plan around units",
      "is built around direct control",
      "is best approached as a story-first release",
      "is a thinking-game entry built around",
    ];
    return {
      title: document.querySelector("h1")?.textContent.trim() || "",
      bodyHasOriginalWeakText: weakProbe && overviewText.includes(weakProbe.replace(/\s+/g, " ").slice(0, 60)),
      bodyHasWeakPhrase: weakFragments.some((fragment) => bodyText.toLowerCase().includes(fragment)),
      hasReviewLabel: /in editorial review|needs overview/i.test(bodyText),
      hasObjectLeak: bodyText.includes("[object Object]"),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  }, target.weakProbe);

  return {
    ...target,
    path: pagePath,
    status: response?.status() || 0,
    ...result,
  };
}

async function inspectListPage(page, slug) {
  const pagePath = `/${slug}.html?auditBust=${Date.now()}`;
  const response = await page.goto(`${base}${pagePath}`, { waitUntil: "networkidle", timeout: 30000 });
  const result = await page.evaluate(() => {
    const cardText = Array.from(document.querySelectorAll(".game-db-card"))
      .map((card) => card.innerText)
      .join(" ")
      .replace(/\s+/g, " ");
    const bodyText = document.body.innerText.replace(/\s+/g, " ");
    const weakFragments = [
      "officially released",
      "official release",
      "game record",
      "region, exact edition",
      "where publisher context",
      "for players comparing listings",
      "catalog's mix of handheld spin-offs",
      "for trading, the safest listing should spell out",
      "for collectors, the key identifiers are",
      "software list",
      "should appeal to players looking for character growth",
      "asks players to plan around units",
      "is built around direct control",
      "is best approached as a story-first release",
      "is a thinking-game entry built around",
    ];
    return {
      bodyHasWeakPhrase: weakFragments.some((fragment) => cardText.toLowerCase().includes(fragment)),
      hasReviewLabel: /in editorial review|needs overview|published overview/i.test(cardText || bodyText),
      hasObjectLeak: bodyText.includes("[object Object]"),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });

  return {
    slug,
    path: pagePath,
    status: response?.status() || 0,
    ...result,
  };
}

async function main() {
  const targets = samples();
  const listSlugs = Array.from(new Set(targets.map((target) => target.slug))).sort();
  const failures = [];
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const results = [];
  const listResults = [];

  for (const slug of listSlugs) {
    const result = await inspectListPage(page, slug);
    listResults.push(result);
    if (result.status !== 200) failures.push({ path: result.path, issue: `Expected 200, got ${result.status}` });
    if (result.bodyHasWeakPhrase) failures.push({ path: result.path, issue: "Weak/template overview text is visible on the platform list page." });
    if (!result.hasReviewLabel) failures.push({ path: result.path, issue: "Platform list page does not show editorial status labels." });
    if (result.hasObjectLeak) failures.push({ path: result.path, issue: "Rendered list leaked [object Object]." });
    if (result.overflow) failures.push({ path: result.path, issue: "Mobile horizontal overflow detected." });
  }

  for (const target of targets) {
    const result = await inspectPage(page, target);
    results.push(result);
    if (result.status !== 200) failures.push({ path: result.path, issue: `Expected 200, got ${result.status}` });
    if (result.bodyHasOriginalWeakText) failures.push({ path: result.path, issue: "Original weak/template overview text is visible to readers." });
    if (result.bodyHasWeakPhrase) failures.push({ path: result.path, issue: "Weak/template overview text is visible to readers." });
    if (!result.hasReviewLabel) failures.push({ path: result.path, issue: "Weak overview is not labeled as editorial review." });
    if (result.hasObjectLeak) failures.push({ path: result.path, issue: "Rendered detail leaked [object Object]." });
    if (result.overflow) failures.push({ path: result.path, issue: "Mobile horizontal overflow detected." });
  }

  await browser.close();

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    base,
    checkedListPages: listResults.length,
    checkedPages: results.length,
    listResults,
    results,
    failures,
  };

  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
