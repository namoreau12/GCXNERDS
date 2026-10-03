const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const siteUrl = "https://gcxnerds.com";
const sitemapPath = path.join(rootDir, "sitemap.xml");

const staticPages = [
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
  "pokemon-30th-celebration.html",
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
];

function xmlEscape(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function dateOnly(value, fallback) {
  const date = new Date(value || fallback);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString().slice(0, 10);
}

function publicUrl(page) {
  return `${siteUrl}${page === "index.html" ? "/" : `/${page}`}`;
}

function fileLastmod(page, fallback) {
  try {
    return dateOnly(fs.statSync(path.join(rootDir, page)).mtime, fallback);
  } catch {
    return fallback;
  }
}

function readNewsroomStories() {
  const newsroomPath = path.join(rootDir, "data", "newsroom.json");
  if (!fs.existsSync(newsroomPath)) return [];
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  return Array.isArray(stories) ? stories.filter((story) => story?.id) : [];
}

function buildUrls() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = staticPages
    .filter((page) => fs.existsSync(path.join(rootDir, page)))
    .map((page) => ({
      loc: publicUrl(page),
      lastmod: fileLastmod(page, today),
      changefreq: page === "index.html" || page === "news.html" ? "daily" : "weekly",
    }));

  readNewsroomStories().forEach((story) => {
    urls.push({
      loc: `${siteUrl}/article.html?id=${encodeURIComponent(story.id)}`,
      lastmod: dateOnly(story.lastUpdated || story.lastReviewedAt || story.publishedAt, today),
      changefreq: story.livingArticle ? "daily" : "weekly",
    });
  });

  return urls.sort((a, b) => a.loc.localeCompare(b.loc));
}

function main() {
  const urls = buildUrls();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${xmlEscape(url.loc)}</loc>
    <lastmod>${xmlEscape(url.lastmod)}</lastmod>
    <changefreq>${xmlEscape(url.changefreq)}</changefreq>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  const tempPath = `${sitemapPath}.tmp`;
  fs.writeFileSync(tempPath, xml, "utf8");
  fs.renameSync(tempPath, sitemapPath);
  console.log(JSON.stringify({ ok: true, sitemapUrls: urls.length, sitemapPath: "sitemap.xml" }, null, 2));
}

main();
