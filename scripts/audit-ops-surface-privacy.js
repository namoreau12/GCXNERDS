const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "ops-surface-privacy.json");
const runtimeBase = process.env.GCX_AUDIT_BASE_URL || "";

const opsPages = [
  "community-admin.html",
  "data-health.html",
  "image-queue.html",
  "newsroom.html",
  "overview-queue.html",
];

const allowedPublicMentions = new Set([
  "data-health.html",
]);

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function rootHtmlFiles() {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => entry.name)
    .sort();
}

function noindexHtmlFiles() {
  return rootHtmlFiles().filter((file) => /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(read(file)));
}

function hrefs(html) {
  return [...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map((match) => match[1]);
}

async function runtimeHeaderChecks() {
  if (!runtimeBase) return [];
  const checks = [];
  for (const file of noindexHtmlFiles()) {
    try {
      const response = await fetch(`${runtimeBase.replace(/\/+$/, "")}/${file}`, { headers: { Accept: "text/html" } });
      const header = response.headers.get("x-robots-tag") || "";
      const cacheControl = response.headers.get("cache-control") || "";
      checks.push({
        file,
        status: response.status,
        xRobotsTag: header,
        cacheControl,
        ok:
          response.status === 200 &&
          /\bnoindex\b/i.test(header) &&
          /\bnofollow\b/i.test(header) &&
          /\bprivate\b/i.test(cacheControl) &&
          /\bno-store\b/i.test(cacheControl),
      });
    } catch (error) {
      checks.push({
        file,
        status: 0,
        xRobotsTag: "",
        cacheControl: "",
        ok: false,
        error: error.message || String(error),
      });
    }
  }
  return checks;
}

async function main() {
  const sitemap = read("sitemap.xml");
  const failures = [];
  const warnings = [];
  const noindexPages = noindexHtmlFiles();
  const runtimeHeaders = await runtimeHeaderChecks();
  const pageChecks = opsPages.map((file) => {
    const exists = fs.existsSync(path.join(rootDir, file));
    const html = exists ? read(file) : "";
    const hasNoindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
    const hasNofollow = /<meta\s+name="robots"\s+content="[^"]*nofollow/i.test(html);
    const inSitemap = sitemap.includes(`/${file}`);
    const hasHeader = /<header\b/i.test(html);
    const hasFooter = /<footer\b/i.test(html);

    if (!exists) failures.push(`${file} is missing.`);
    if (exists && !hasNoindex) failures.push(`${file} must include robots noindex.`);
    if (exists && !hasNofollow) failures.push(`${file} must include robots nofollow.`);
    if (inSitemap) failures.push(`${file} must not be included in sitemap.xml.`);
    if (exists && (!hasHeader || !hasFooter)) warnings.push(`${file} does not have the standard header/footer shell.`);

    return {
      file,
      exists,
      hasNoindex,
      hasNofollow,
      inSitemap,
      hasHeader,
      hasFooter,
    };
  });

  const publicLinkHits = [];
  rootHtmlFiles()
    .filter((file) => !opsPages.includes(file))
    .forEach((file) => {
      const html = read(file);
      hrefs(html).forEach((href) => {
        const cleanHref = href.split("#")[0].split("?")[0];
        if (opsPages.includes(cleanHref) && !allowedPublicMentions.has(cleanHref)) {
          publicLinkHits.push({ file, href });
        }
      });
    });

  if (publicLinkHits.length) {
    failures.push(`${publicLinkHits.length} public link(s) point to staff/ops-only pages.`);
  }

  runtimeHeaders
    .filter((check) => !check.ok)
    .forEach((check) =>
      failures.push(`${check.file} must return X-Robots-Tag: noindex, nofollow and Cache-Control: private, no-store from the running server.`)
    );

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedPages: opsPages.length,
    checkedNoindexPages: noindexPages.length,
    pageChecks,
    runtimeBase,
    runtimeHeaders,
    publicLinkHits,
    allowedPublicMentions: [...allowedPublicMentions],
    failures,
    warnings,
  };

  writeJsonAtomic(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  const report = {
    ok: false,
    generatedAt: new Date().toISOString(),
    checkedPages: opsPages.length,
    runtimeBase,
    failures: [error.message || String(error)],
  };
  writeJsonAtomic(outputPath, report);
  console.error(error.message || error);
  process.exit(1);
});
