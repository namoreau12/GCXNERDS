const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const siteUrl = "https://gcxnerds.com";
const outputPath = path.join(rootDir, "data", "launch-readiness", "seo-infrastructure.json");

const indexablePages = new Set([
  "index.html",
  "about.html",
  "contact.html",
  "privacy.html",
  "terms.html",
  "marketplace-rules.html",
  "news.html",
  "games.html",
  "consoles.html",
  "pokemon.html",
  "magic.html",
  "yugioh.html",
  "community.html",
  "community-activity.html",
  "community-events.html",
  "community-groups.html",
  "community-members.html",
  "streamers.html",
  "sponsors.html",
  "trust.html",
  "search.html",
  "3ds.html",
  "dreamcast.html",
  "ds.html",
  "gameboy.html",
  "gamecube.html",
  "gba.html",
  "genesis.html",
  "n64.html",
  "nes.html",
  "ps1.html",
  "ps2.html",
  "ps3.html",
  "ps4.html",
  "ps5.html",
  "psp.html",
  "saturn.html",
  "snes.html",
  "switch.html",
  "switch2.html",
  "vita.html",
  "wii.html",
  "xbox.html",
  "xbox360.html",
]);

const noindexPages = new Set([
  "auth.html",
  "card.html",
  "community-admin.html",
  "community-growth.html",
  "community-inbox.html",
  "community-notifications.html",
  "community-post.html",
  "community-saved.html",
  "console.html",
  "data-health.html",
  "game.html",
  "image-queue.html",
  "magic-card.html",
  "newsroom.html",
  "overview-queue.html",
  "profile.html",
  "streamer.html",
  "yugioh-card.html",
  ...[
    "3ds",
    "dreamcast",
    "ds",
    "gameboy",
    "gamecube",
    "gba",
    "genesis",
    "n64",
    "nes",
    "ps1",
    "ps2",
    "ps3",
    "ps4",
    "ps5",
    "psp",
    "saturn",
    "snes",
    "switch",
    "switch2",
    "vita",
    "wii",
    "xbox",
    "xbox360",
  ].map((slug) => `${slug}-game.html`),
]);

const dynamicIndexableShells = new Set(["article.html"]);

function read(fileName) {
  return fs.readFileSync(path.join(rootDir, fileName), "utf8");
}

function hasMeta(html, pattern) {
  return pattern.test(html);
}

function localPathFromUrl(url) {
  const parsed = new URL(url);
  const pathname = parsed.pathname === "/" ? "/index.html" : parsed.pathname;
  return decodeURIComponent(pathname.replace(/^\//, ""));
}

function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim()).filter(Boolean);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function newsroomStoryUrls() {
  const newsroomPath = path.join(rootDir, "data", "newsroom.json");
  if (!fs.existsSync(newsroomPath)) return [];
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  if (!Array.isArray(stories)) return [];
  return stories
    .filter((story) => story?.id)
    .map((story) => `${siteUrl}/article.html?id=${encodeURIComponent(story.id)}`);
}

function main() {
  const htmlFiles = fs.readdirSync(rootDir).filter((file) => file.endsWith(".html")).sort();
  const failures = [];

  htmlFiles.forEach((file) => {
    const html = read(file);
    const isIndexable = indexablePages.has(file);
    const shouldNoindex = noindexPages.has(file);
    const isDynamicIndexable = dynamicIndexableShells.has(file);

    if (!isIndexable && !shouldNoindex && !isDynamicIndexable) {
      failures.push({ file, issue: "Page is not classified as indexable or noindex." });
    }

    if (isIndexable || isDynamicIndexable) {
      const expectedCanonical = `${siteUrl}${file === "index.html" ? "/" : `/${file}`}`;
      const checks = [
        ["title", /<title>[^<]{8,}<\/title>/i],
        ["description", /<meta\s+name="description"\s+content="[^"]{40,}"/i],
        ["canonical", new RegExp(`<link\\s+rel="canonical"\\s+href="${expectedCanonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*/?>`, "i")],
        ["og:title", /<meta\s+property="og:title"\s+content="[^"]{8,}"/i],
        ["og:description", /<meta\s+property="og:description"\s+content="[^"]{40,}"/i],
        ["og:url", new RegExp(`<meta\\s+property="og:url"\\s+content="${siteUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/?[^"]*"`, "i")],
        ["twitter:card", /<meta\s+name="twitter:card"\s+content="summary(_large_image)?"/i],
      ];
      checks.forEach(([label, pattern]) => {
        if (!hasMeta(html, pattern)) failures.push({ file, issue: `Missing or weak ${label}.` });
      });
      if (isIndexable && /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) {
        failures.push({ file, issue: "Indexable page is marked noindex." });
      }
    }

    if (shouldNoindex && !/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) {
      failures.push({ file, issue: "Internal/dynamic shell page should be noindex." });
    }
  });

  const robots = read("robots.txt");
  const sitemapPattern = new RegExp(`Sitemap:\\s*${siteUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/sitemap\\.xml`, "i");
  if (!/User-agent:\s*\*/i.test(robots) || !sitemapPattern.test(robots)) {
    failures.push({ file: "robots.txt", issue: "robots.txt must allow crawlers and point to sitemap.xml." });
  }

  const sitemapXml = read("sitemap.xml");
  const urls = sitemapLocs(sitemapXml);
  if (!/<urlset[^>]+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/i.test(sitemapXml) || !urls.length) {
    failures.push({ file: "sitemap.xml", issue: "Sitemap XML is missing urlset namespace or loc entries." });
  }

  const sitemapSet = new Set(urls);
  indexablePages.forEach((file) => {
    const url = `${siteUrl}${file === "index.html" ? "/" : `/${file}`}`;
    if (!sitemapSet.has(url)) failures.push({ file: "sitemap.xml", issue: `Missing indexable URL ${url}` });
  });

  const storyUrls = newsroomStoryUrls();
  storyUrls.forEach((url) => {
    if (!sitemapSet.has(url)) failures.push({ file: "sitemap.xml", issue: `Missing newsroom article URL ${url}` });
  });

  urls.forEach((url) => {
    const localPath = localPathFromUrl(url);
    if (!fs.existsSync(path.join(rootDir, localPath)) && !url.includes("/article.html?id=")) {
      failures.push({ file: "sitemap.xml", issue: `Sitemap URL has no local file: ${url}` });
    }
    const localFile = localPath.replace(/^\//, "");
    if (noindexPages.has(localFile)) {
      failures.push({ file: "sitemap.xml", issue: `Noindex page should not be in sitemap: ${url}` });
    }
  });

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    indexablePages: indexablePages.size,
    noindexPages: noindexPages.size,
    newsroomArticleUrls: storyUrls.length,
    sitemapUrls: urls.length,
    failures,
  };

  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));

  if (failures.length) process.exitCode = 1;
}

main();
