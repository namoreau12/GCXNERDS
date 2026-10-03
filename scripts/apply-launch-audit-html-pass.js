const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const siteUrl = "https://gcxnerds.com";
const majorPages = new Set([
  "index.html",
  "about.html",
  "privacy.html",
  "terms.html",
  "marketplace-rules.html",
  "contact.html",
  "news.html",
  "article.html",
  "games.html",
  "pokemon.html",
  "magic.html",
  "yugioh.html",
  "community.html",
  "streamers.html",
  "sponsors.html",
  "trust.html",
  "search.html",
]);

const header = `    <header class="site-header has-mobile-nav">
      <a class="brand" href="index.html" aria-label="GCXNerds home">
        <span class="brand-mark">GCX</span>
        <span class="brand-wordmark" aria-label="GCXNerds"><span class="brand-wordmark-gcx">GCX</span><span class="brand-wordmark-nerds">Nerds</span></span>
      </a>
      <button class="mobile-nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">Menu</button>
      <nav class="nav" id="primary-nav" aria-label="Primary navigation">
        <a href="news.html">News</a>
        <a href="games.html">Games</a>
        <div class="nav-menu">
          <button class="nav-trigger" type="button">Cards</button>
          <div class="nav-dropdown">
            <a href="pokemon.html">Pokemon Cards</a>
            <a href="magic.html">Magic Cards</a>
            <a href="yugioh.html">Yu-Gi-Oh! Cards</a>
            <a href="index.html#cards">Marketplace Beta</a>
          </div>
        </div>
        <div class="nav-menu">
          <button class="nav-trigger" type="button">Community</button>
          <div class="nav-dropdown">
            <a href="community.html">Community Feed</a>
            <a href="community-members.html">Members</a>
            <a href="community-groups.html">Groups</a>
            <a href="community-events.html">Events</a>
            <a href="streamers.html">Streamer Highlights</a>
          </div>
        </div>
        <a href="search.html">Search</a>
      </nav>
      <div class="header-actions">
        <form class="search" role="search" action="search.html" method="get">
          <label class="sr-only" for="site-search">Search GCX</label>
          <input id="site-search" name="q" type="search" placeholder="Search games, cards, news" />
        </form>
        <a class="account-link" href="auth.html">Sign In</a>
      </div>
    </header>`;

const footer = `    <footer class="site-footer">
      <div>
        <p><strong>GCXNerds</strong></p>
        <p>Games, cards, movies, streaming, community, and collector-first marketplace tools.</p>
      </div>
      <nav class="footer-links" aria-label="Footer navigation">
        <a href="trust.html">Trust</a>
        <a href="sponsors.html">Sponsors</a>
        <a href="about.html">About</a>
        <a href="trust.html#editorial">Editorial Standards</a>
        <a href="privacy.html">Privacy</a>
        <a href="terms.html">Terms</a>
        <a href="marketplace-rules.html">Marketplace Rules</a>
        <a href="contact.html">Contact</a>
        <a href="news.html">Newsroom</a>
      </nav>
    </footer>`;

function descriptionFromHead(html) {
  return html.match(/<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/i)?.[1] || "GCXNerds gaming, cards, community, and collector coverage.";
}

function titleFromHead(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim() || "GCXNerds";
}

function removeMeta(html, pattern) {
  return html.replace(pattern, "");
}

function ensureHeadMeta(html, fileName) {
  if (!majorPages.has(fileName)) return html;
  const title = titleFromHead(html);
  const description = descriptionFromHead(html);
  const pathName = fileName === "index.html" ? "/" : `/${fileName}`;
  const canonical = `${siteUrl}${pathName}`;
  const ogType = fileName === "article.html" ? "article" : "website";
  const image = `${siteUrl}/assets/news/pokemon-tcg-30th-celebration.jpg`;

  html = removeMeta(html, /\s*<link\s+rel="canonical"[^>]*>\s*/gi);
  html = removeMeta(html, /\s*<meta\s+property="og:(title|description|type|url|image)"[^>]*>\s*/gi);
  html = removeMeta(html, /\s*<meta\s+name="twitter:(card|title|description|image)"[^>]*>\s*/gi);

  const meta = [
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].map((line) => `    ${line}`).join("\n");

  html = html.replace(/(\s*<link rel="stylesheet" href="styles\.css" \/>)/, `\n${meta}$1`);
  return html;
}

function ensureSiteScript(html) {
  if (html.includes('src="site.js"')) return html;
  if (/<script src="[^"]+\.js(?:\?[^"]*)?"><\/script>/.test(html)) {
    return html.replace(/\s*(<script src="[^"]+\.js(?:\?[^"]*)?"><\/script>)/, `\n    <script src="site.js"></script>\n    $1`);
  }
  return html.replace(/\s*<\/body>/, `\n    <script src="site.js"></script>\n  </body>`);
}

function updateFooter(html) {
  if (/<footer class="site-footer">[\s\S]*?<\/footer>/.test(html)) {
    return html.replace(/    <footer class="site-footer">[\s\S]*?<\/footer>/, footer);
  }
  return html.replace(/\s*(<script src=)/, `\n${footer}\n\n    $1`);
}

function updateHeader(html) {
  if (/    <header class="site-header[^"]*">[\s\S]*?<\/header>/.test(html)) {
    return html.replace(/    <header class="site-header[^"]*">[\s\S]*?<\/header>/, header);
  }
  return html.replace(/\s*(<main\b)/, `\n${header}\n\n    $1`);
}

const htmlFiles = fs.readdirSync(rootDir).filter((file) => file.endsWith(".html"));
htmlFiles.forEach((fileName) => {
  const filePath = path.join(rootDir, fileName);
  let html = fs.readFileSync(filePath, "utf8");
  html = updateHeader(html);
  html = ensureHeadMeta(html, fileName);
  html = updateFooter(html);
  html = ensureSiteScript(html);
  fs.writeFileSync(filePath, html);
});

const newsroom = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "newsroom.json"), "utf8"));
const sitemapUrls = [
  "",
  "news.html",
  "about.html",
  "privacy.html",
  "terms.html",
  "marketplace-rules.html",
  "contact.html",
  "games.html",
  "pokemon.html",
  "magic.html",
  "yugioh.html",
  "community.html",
  "streamers.html",
  "sponsors.html",
  "trust.html",
  "search.html",
  ...newsroom.map((story) => `article.html?id=${encodeURIComponent(story.id)}`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url>
    <loc>${siteUrl}/${url}</loc>
    <lastmod>2026-08-22</lastmod>
  </url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(rootDir, "robots.txt"), `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`);
fs.writeFileSync(path.join(rootDir, "sitemap.xml"), sitemap);
