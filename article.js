const articleDetail = document.querySelector("#article-detail");
const sessionStorageKey = "gcx-session-token-v1";
const viewerStorageKey = "gcx-community-viewer-v1";

let activeStory = null;
let activeSession = null;
let activeComments = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
}

function stripMarkdownTablesForPreview(value) {
  let text = String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/\r\n?/g, "\n");

  if (!text.includes("|")) return text;

  if (!text.includes("\n") && /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(text)) {
    const firstPipe = text.indexOf("|");
    return firstPipe > 0 ? text.slice(0, firstPipe) : "";
  }

  const lines = text.split("\n");
  const output = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] || "";
    const isTableHeader = line.includes("|") && /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(nextLine);
    const isTableLine = line.trim().startsWith("|");
    if (isTableHeader || isTableLine) continue;
    output.push(line);
  }

  return output.join(" ");
}

function plainText(value, maxLength = 220) {
  return stripMarkdownTablesForPreview(articleBlockText(value))
    .replace(/^\s*\|.+\|\s*$/gm, " ")
    .replace(/\|?\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*(?:\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*)+\|?/g, " ")
    .replace(/\|/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "")
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isStructuredTableBlock(block) {
  return Boolean(block && typeof block === "object" && block.type === "table" && Array.isArray(block.headers) && Array.isArray(block.rows));
}

function articleBlockText(block) {
  if (isStructuredTableBlock(block)) {
    return [
      block.caption,
      ...(block.headers || []),
      ...(block.rows || []).flat(),
    ]
      .filter(Boolean)
      .join(" ");
  }
  return String(block || "");
}

function absoluteUrl(value) {
  try {
    return new URL(value || window.location.href, window.location.origin).href;
  } catch {
    return window.location.href;
  }
}

function publicSiteOrigin() {
  return "https://gcxnerds.com";
}

function publicAbsoluteUrl(value) {
  try {
    return new URL(value || "/", publicSiteOrigin()).href;
  } catch {
    return publicSiteOrigin();
  }
}

function storyHeroImageUrl(story) {
  return story?.heroImage || story?.imageUrl || "";
}

function storyHeroImageAlt(story, fallback = "") {
  return story?.heroImageAlt || story?.imageAlt || fallback || story?.title || "";
}

function storyHeroImageCredit(story) {
  return story?.heroImageCredit || story?.imageCredit || "";
}

function normalizeFocalValue(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) return `${Math.max(0, Math.min(100, value))}%`;
  const text = String(value || "").trim();
  if (/^\d+(\.\d+)?%$/.test(text)) return text;
  if (/^0?(\.\d+)$/.test(text)) return `${Math.round(Number(text) * 100)}%`;
  return fallback;
}

function heroFocalStyle(story) {
  const x = normalizeFocalValue(story?.heroImageFocalX ?? story?.imageFocalX, "50%");
  const y = normalizeFocalValue(story?.heroImageFocalY ?? story?.imageFocalY, "42%");
  return `--image-card-focal-x: ${escapeHtml(x)}; --image-card-focal-y: ${escapeHtml(y)};`;
}

function isGamingStory(story) {
  return slugId(story?.category || story?.type).includes("gaming");
}

function storyHasOfficialMedia(story) {
  const imageUrl = storyHeroImageUrl(story);
  const mediaType = articleHeroMediaType(story);
  const provenance = [
    story?.heroImageSource,
    story?.heroImageCredit,
    story?.heroImageSourceUrl,
    story?.imageSourceUrl,
    story?.imageCredit,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!imageUrl || /\.svg(?:\?|$)/i.test(imageUrl)) return false;
  if (["graphic", "chart", "diagram", "infographic"].includes(mediaType)) return false;
  if (/\b(fallback|pending|required|review)\b/.test(provenance)) return false;
  return /official|publisher|developer|press|square enix|capcom|xbox|playstation|nintendo|fromsoftware|cd projekt|rockstar/.test(provenance);
}

function shouldShowOfficialMediaWarning(story) {
  return isGamingStory(story) && !storyHasOfficialMedia(story) && ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
}

function renderOfficialMediaReviewWarning(story) {
  return shouldShowOfficialMediaWarning(story)
    ? `<aside class="article-media-warning">OFFICIAL MEDIA REQUIRED</aside>`
    : "";
}

function setMeta(selector, attribute, value) {
  if (!value) return;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    const nameMatch = selector.match(/\[name="([^"]+)"\]/);
    const propertyMatch = selector.match(/\[property="([^"]+)"\]/);
    if (nameMatch) element.setAttribute("name", nameMatch[1]);
    if (propertyMatch) element.setAttribute("property", propertyMatch[1]);
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
}

function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = url;
}

function updateArticleMetadata(story) {
  const title = `${story.title} | Games Cards Exchange`;
  const description = plainText(story.excerpt || (story.body || [])[0], 220);
  const canonicalUrl = publicAbsoluteUrl(`article.html?id=${encodeURIComponent(story.id)}`);
  const heroImage = storyHeroImageUrl(story);
  const imageUrl = heroImage ? publicAbsoluteUrl(heroImage) : "";
  const videoMedia = (story.media || []).find((item) => ["trailer", "video"].includes(slugId(item.mediaType || item.type)) && normalizeYouTubeEmbedUrl(item.embedUrl || item.sourceUrl));
  const publishedDate = story.publishedAt ? new Date(story.publishedAt).toISOString() : "";
  const modifiedDate = story.lastUpdated ? new Date(story.lastUpdated).toISOString() : publishedDate;

  document.title = title;
  setCanonical(canonicalUrl);
  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:type"]', "content", "article");
  setMeta('meta[property="og:url"]', "content", canonicalUrl);
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description);
  setMeta('meta[name="twitter:card"]', "content", imageUrl ? "summary_large_image" : "summary");
  if (imageUrl) {
    setMeta('meta[property="og:image"]', "content", imageUrl);
    setMeta('meta[name="twitter:image"]', "content", imageUrl);
  }
  if (publishedDate) setMeta('meta[property="article:published_time"]', "content", publishedDate);
  if (modifiedDate) setMeta('meta[property="article:modified_time"]', "content", modifiedDate);
  setMeta('meta[property="article:section"]', "content", story.category || "News");

  document.head.querySelector("#article-schema")?.remove();
  document.head.querySelector("#article-schema-server")?.remove();
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.id = "article-schema";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.title,
    description,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: publishedDate || undefined,
    dateModified: modifiedDate || publishedDate || undefined,
    author: {
      "@type": "Organization",
      name: story.sourceName || "Games Cards Exchange",
    },
    publisher: {
      "@type": "Organization",
      name: "Games Cards Exchange",
      logo: {
        "@type": "ImageObject",
        url: publicAbsoluteUrl("assets/news/pokemon-tcg-30th-celebration.jpg"),
      },
    },
    video: videoMedia
      ? {
          "@type": "VideoObject",
          name: videoMedia.caption || story.title,
          description: videoMedia.rightsNote || description,
          embedUrl: normalizeYouTubeEmbedUrl(videoMedia.embedUrl || videoMedia.sourceUrl),
          thumbnailUrl: imageUrl ? [imageUrl] : undefined,
          uploadDate: publishedDate || undefined,
        }
      : undefined,
    mainEntityOfPage: canonicalUrl,
  });
  document.head.appendChild(schema);
}

function articleHeroMediaType(story) {
  const explicitType = slugId(story?.mediaType || story?.leadMediaType || story?.imageType);
  if (["graphic", "chart", "diagram", "infographic"].some((term) => explicitType.includes(term))) return "graphic";
  const imageUrl = String(storyHeroImageUrl(story) || "").toLowerCase();
  const imageCredit = String(storyHeroImageCredit(story) || "").toLowerCase();
  const title = String(story?.title || "").toLowerCase();
  if (/\.svg(?:\?|$)/i.test(imageUrl)) return "graphic";
  if (/(chart|diagram|infographic|tracker|price|pricing)/i.test(`${imageUrl} ${imageCredit} ${title}`)) return "graphic";
  return slugId(story?.mediaType || "screenshot") || "screenshot";
}

function sessionToken() {
  return localStorage.getItem(sessionStorageKey) || "";
}

function authHeaders() {
  return sessionToken() ? { "X-GCX-Session": sessionToken() } : {};
}

async function loadSession() {
  const response = await fetch("/api/auth/session", {
    headers: authHeaders(),
    cache: "no-store",
  });
  const result = await response.json();
  activeSession = result.authenticated ? result.data : null;
  if (activeSession?.profile?.id) localStorage.setItem(viewerStorageKey, activeSession.profile.id);
}

async function loadComments(storyId) {
  const response = await fetch(`/api/news/${encodeURIComponent(storyId)}/comments`, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Comments could not be loaded.");
  activeComments = result.data || [];
}

function renderComments() {
  if (!activeComments.length) return `<div class="index-message">No comments yet. Be the first signed-in member to start the conversation.</div>`;
  return activeComments
    .map((comment) => {
      const profile = comment.profile || {};
      return `
        <article class="comment-card">
          <div class="comment-author-row">
            ${profile.avatarUrl ? `<img src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(comment.author)} avatar" />` : ""}
            <div>
              <strong>${escapeHtml(comment.author)}</strong>
              <span>${escapeHtml(comment.handle || "")} - ${escapeHtml(formatDate(comment.createdAt))}</span>
            </div>
          </div>
          <p>${escapeHtml(comment.body)}</p>
        </article>
      `;
    })
    .join("");
}

function renderCommentComposer() {
  if (!activeSession?.profile) {
    const next = `article.html?id=${encodeURIComponent(activeStory.id)}`;
    return `
      <div class="auth-required-box">
        <strong>Log in to comment</strong>
        <p>GCX requires an account before readers can comment or contribute to the community.</p>
        <a class="button" href="auth.html?next=${encodeURIComponent(next)}">Sign in or create account</a>
      </div>
    `;
  }

  return `
    <form id="article-comment-form" class="comment-form article-comment-form">
      <div class="auth-profile-row">
        <img src="${escapeHtml(activeSession.profile.avatarUrl)}" alt="${escapeHtml(activeSession.profile.displayName)} avatar" />
        <div>
          <strong>${escapeHtml(activeSession.profile.displayName)}</strong>
          <span>${escapeHtml(activeSession.profile.handle)}</span>
        </div>
      </div>
      <textarea name="body" rows="4" placeholder="Add to the GCX conversation" required></textarea>
      <button class="button" type="submit">Post comment</button>
      <p id="article-comment-status" class="auth-status"></p>
    </form>
  `;
}

function renderInlineMarkdown(value) {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function isMarkdownTableSeparatorCell(value) {
  return /^:?-{3,}:?$/.test(
    String(value || "")
      .trim()
      .replace(/[\u2010-\u2015\u2212]/g, "-")
      .replace(/\s+/g, "")
  );
}

function repairFlattenedMarkdownTableRows(value) {
  const source = String(value || "");
  if (!source.includes("|") || source.includes("\n")) return source;

  const text = source.replace(/\u00a0/g, " ").replace(/&#x20;|&nbsp;/gi, " ");
  const firstPipeIndex = text.indexOf("|");
  const prelude = firstPipeIndex > 0 ? text.slice(0, firstPipeIndex).trim() : "";
  const tableText = firstPipeIndex > -1 ? text.slice(firstPipeIndex) : text;
  const cells = tableText
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  let separatorStart = -1;
  let separatorEnd = -1;
  for (let index = 0; index < cells.length; index += 1) {
    if (!isMarkdownTableSeparatorCell(cells[index])) continue;
    let end = index;
    while (end < cells.length && isMarkdownTableSeparatorCell(cells[end])) end += 1;
    if (end - index >= 2) {
      separatorStart = index;
      separatorEnd = end;
      break;
    }
    index = end;
  }

  if (separatorStart === -1) return source;
  const columnCount = separatorEnd - separatorStart;
  const headerStart = separatorStart - columnCount;
  if (headerStart < 0) return source;

  const headers = cells.slice(headerStart, separatorStart);
  const separators = cells.slice(separatorStart, separatorEnd);
  const beforeHeader = cells.slice(0, headerStart).join(" | ").trim();
  const rowCells = cells.slice(separatorEnd);
  const rows = [];
  for (let index = 0; index + columnCount <= rowCells.length; index += columnCount) {
    rows.push(rowCells.slice(index, index + columnCount));
  }
  if (!headers.length || !rows.length) return source;

  return [
    prelude || beforeHeader,
    `| ${headers.join(" | ")} |`,
    `| ${separators.join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeMarkdownTableText(value) {
  const normalized = repairFlattenedMarkdownTableRows(value)
    .replace(/\u00a0/g, " ")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/\u00e2\u20ac[\u201c\u201d]/g, "-")
    .replace(/\r\n?/g, "\n")
    .replace(/\s*\|\s*\|\s*(?=(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "|\n| ")
    .replace(/\s+\|\s*\|\s*(?=(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "\n| ")
    .replace(/\s+\|\s*\|(?=\s*(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "\n| ")
    .replace(/\|\s*\|(?=\s*(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "|\n| ");

  return canonicalizeMarkdownTableText(normalized);
}

function markdownTableLines(value) {
  const normalized = normalizeMarkdownTableText(value);
  return normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isMarkdownTableSeparator(line) {
  const cells = String(line || "")
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim().replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\s+/g, ""));
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitMarkdownTableCells(line) {
  return String(line || "")
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim().replace(/\s+/g, " "));
}

function canonicalizeMarkdownTableLines(lines) {
  if (lines.length < 2 || !isMarkdownTableSeparator(lines[1])) return lines;
  const headers = splitMarkdownTableCells(lines[0]);
  const separatorCells = splitMarkdownTableCells(lines[1]).map((cell) => {
    const value = cell.replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\s+/g, "");
    const left = value.startsWith(":") ? ":" : "";
    const right = value.endsWith(":") ? ":" : "";
    return `${left}---${right}`;
  });
  const rows = lines
    .slice(2)
    .filter((line) => line.includes("|") && !isMarkdownTableSeparator(line))
    .map(splitMarkdownTableCells);

  return [
    `| ${headers.join(" | ")} |`,
    `| ${separatorCells.join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ];
}

function canonicalizeMarkdownTableText(value) {
  const lines = String(value || "").split("\n");
  const tableStart = lines.findIndex((line, index) => line.includes("|") && isMarkdownTableSeparator(lines[index + 1] || ""));
  if (tableStart === -1) return String(value || "");

  const beforeLines = lines.slice(0, tableStart).filter(Boolean);
  const tableLines = [];
  let index = tableStart;
  while (index < lines.length && lines[index].includes("|")) {
    tableLines.push(lines[index]);
    index += 1;
  }
  const afterLines = lines.slice(index).filter(Boolean);

  return [
    ...beforeLines,
    ...canonicalizeMarkdownTableLines(tableLines),
    ...afterLines,
  ].join("\n").trim();
}

function parseMarkdownTable(lines) {
  if (lines.length < 3 || !lines[0].startsWith("|") || !isMarkdownTableSeparator(lines[1])) return "";
  const parseCells = (line) =>
    line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim());
  const headers = parseCells(lines[0]);
  const rows = lines.slice(2).filter((line) => line.startsWith("|") && !isMarkdownTableSeparator(line)).map(parseCells);
  if (!headers.length || !rows.length) return "";
  return `
    <div class="article-table-wrap">
      <table class="article-data-table">
        <thead>
          <tr>${headers.map((header) => `<th>${renderInlineMarkdown(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${headers.map((_, index) => `<td>${renderInlineMarkdown(row[index] || "")}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderReadableMarkdownTableFallback(text) {
  if (!/\|\s*:?-{3,}:?\s*\|/.test(text.replace(/[\u2010-\u2015\u2212]/g, "-"))) return "";
  const cells = text
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell && !isMarkdownTableSeparatorCell(cell));
  const fallbackItems = cells.slice(0, 12);

  return `
    <div class="article-table-wrap article-table-wrap--fallback">
      <div class="article-table-fallback" role="note">
        <strong>Editorial data note</strong>
        <p>This source table is being cleaned for display. The key details are preserved below.</p>
        ${fallbackItems.length ? `<ul>${fallbackItems.map((cell) => `<li>${renderInlineMarkdown(cell)}</li>`).join("")}</ul>` : ""}
      </div>
    </div>
  `;
}

function renderStructuredTableBlock(block) {
  const headers = (block.headers || []).map((header) => String(header || "").trim()).filter(Boolean);
  const rows = (block.rows || []).filter(Array.isArray);
  if (!headers.length || !rows.length) return "";
  return `
    <div class="article-table-wrap">
      ${block.caption ? `<p class="article-table-caption">${escapeHtml(block.caption)}</p>` : ""}
      <table class="article-data-table">
        <thead>
          <tr>${headers.map((header) => `<th>${renderInlineMarkdown(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${headers.map((_, index) => `<td>${renderInlineMarkdown(row[index] || "")}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderArticleBlock(block) {
  if (isStructuredTableBlock(block)) return renderStructuredTableBlock(block);
  const text = String(block || "").trim();
  if (!text || text === "---") return "";
  const lines = markdownTableLines(text);
  const firstLine = lines[0] || "";
  const headingMatch = firstLine.match(/^(#{1,4})\s+(.+)$/);
  if (headingMatch && lines.length === 1) {
    const level = headingMatch[1].length === 1 ? 2 : Math.min(headingMatch[1].length, 4);
    return `<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`;
  }

  const embeddedTableStart = lines.findIndex((line, index) => {
    const nextLine = lines[index + 1] || "";
    return line.includes("|") && isMarkdownTableSeparator(nextLine);
  });
  if (embeddedTableStart !== -1) {
    let embeddedTableEnd = embeddedTableStart + 2;
    while (embeddedTableEnd < lines.length && lines[embeddedTableEnd].startsWith("|")) {
      embeddedTableEnd += 1;
    }

    const tableLines = lines.slice(embeddedTableStart, embeddedTableEnd);
    const firstTableLine = tableLines[0] || "";
    const firstPipeIndex = firstTableLine.indexOf("|");
    const tablePrelude = firstPipeIndex > 0 ? firstTableLine.slice(0, firstPipeIndex).trim() : "";
    if (tablePrelude) tableLines[0] = firstTableLine.slice(firstPipeIndex).trim();

    const before = [...lines.slice(0, embeddedTableStart), tablePrelude].filter(Boolean).join("\n");
    const table = tableLines.join("\n");
    const after = lines.slice(embeddedTableEnd).join("\n");
    if (before || after) {
      return [before, table, after].filter(Boolean).map(renderArticleBlock).join("");
    }
  }

  const tableHtml = parseMarkdownTable(lines);
  if (tableHtml) return tableHtml;

  const tableFallback = renderReadableMarkdownTableFallback(normalizeMarkdownTableText(text));
  if (tableFallback) return tableFallback;

  if (lines.every((line) => line.startsWith("* "))) {
    return `<ul>${lines.map((line) => `<li>${renderInlineMarkdown(line.replace(/^\*\s+/, ""))}</li>`).join("")}</ul>`;
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return `<ol>${lines.map((line) => `<li>${renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
  }

  return `<p>${renderInlineMarkdown(text.replace(/\n+/g, " "))}</p>`;
}

function slugId(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function articleHeadingTitle(block) {
  if (isStructuredTableBlock(block)) return "";
  const text = String(block || "").trim();
  const match = text.match(/^#{1,4}\s+(.+)$/);
  return match ? match[1].replace(/\*\*/g, "").trim() : "";
}

function renderArticleBlockWithId(block) {
  const title = articleHeadingTitle(block);
  if (!title) return renderArticleBlock(block);
  return renderArticleBlock(block).replace(/^(<h[2-4])>/, `$1 id="${escapeHtml(slugId(title))}">`);
}

function renderRelatedCoverage(relatedLinks) {
  return relatedLinks.length
    ? `
      <section class="article-related-card">
        <p class="kicker">Related Guide</p>
        <h2>Keep Reading</h2>
        <div>
          ${relatedLinks.map((link) => `
            <a href="${escapeHtml(link.url)}">
              <strong>${escapeHtml(link.label)}</strong>
              <span>More GCX coverage on this story</span>
            </a>
          `).join("")}
        </div>
      </section>
    `
    : "";
}

function quickVersionItems(story) {
  const explicit = story.quickVersion || story.quickFacts || story.takeaways || story.keyTakeaways;
  if (Array.isArray(explicit)) {
    return explicit
      .map((item) => (Array.isArray(item) ? item.filter(Boolean).join(": ") : String(item || "")))
      .map((item) => plainText(item, 180))
      .filter(Boolean)
      .slice(0, 5);
  }

  const body = (story.body || []).filter((block) => !isStructuredTableBlock(block)).map((block) => String(block || ""));
  const bulletItems = body
    .flatMap((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("* "))
        .map((line) => plainText(line.replace(/^\*\s+/, ""), 180))
    )
    .filter(Boolean);

  if (bulletItems.length >= 3) return bulletItems.slice(0, 5);

  return plainText(story.excerpt || body.find(Boolean) || "", 420)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24)
    .slice(0, 4);
}

function renderQuickVersion(story) {
  const items = quickVersionItems(story);
  if (!items.length) return "";
  return `
    <section class="article-quick-version" aria-label="The quick version">
      <div>
        <p class="kicker">The Quick Version</p>
        <h2>What matters first</h2>
      </div>
      <ol>
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    </section>
  `;
}

function renderCultureLoop(story) {
  const topic = story.canonicalTopic || story.topicCluster || story.category || "Gaming";
  const shareUrl = story.shareUrl || "community.html";
  const searchQuery = encodeURIComponent(topic);
  return `
    <section class="article-culture-loop" aria-label="Story discovery loop">
      <div>
        <p class="kicker">GCX Loop</p>
        <h2>Follow the story beyond the article</h2>
        <p>Use this story as a jump point into the clips, creators, and community conversation around ${escapeHtml(topic)}.</p>
      </div>
      <div class="culture-loop-grid">
        <a href="${escapeHtml(shareUrl)}">
          <span>Community</span>
          <strong>Post this story</strong>
          <small>Start or join the GCX discussion.</small>
        </a>
        <a href="streamers.html">
          <span>Creators</span>
          <strong>Find related watch picks</strong>
          <small>Open creator spotlights and official video picks.</small>
        </a>
        <a href="search.html?q=${searchQuery}">
          <span>Discovery</span>
          <strong>Search the topic</strong>
          <small>Find more GCX coverage tied to this beat.</small>
        </a>
      </div>
    </section>
  `;
}

function renderSourceSection(sourceLinks) {
  return sourceLinks.length
    ? `
      <details id="article-sources" class="article-sources article-source-drawer">
        <summary>Sources Used</summary>
        <div>
          ${sourceLinks.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a>`).join("")}
        </div>
      </details>
    `
    : "";
}

function normalizeYouTubeEmbedUrl(value) {
  try {
    const url = new URL(value || "", window.location.origin);
    const host = url.hostname.replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") videoId = url.pathname.replace(/^\/+/, "").split("/")[0];
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname.startsWith("/embed/")) videoId = url.pathname.split("/")[2] || "";
      if (!videoId) videoId = url.searchParams.get("v") || "";
      if (!videoId && url.pathname.startsWith("/shorts/")) videoId = url.pathname.split("/")[2] || "";
    }
    if (!/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) return "";
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return "";
  }
}

function editorialMediaRightsLabel(item) {
  const status = slugId(item?.rightsStatus || "");
  const labels = {
    approved: "Approved media",
    "press-asset": "Official press asset",
    "official-embed": "Official embed",
    licensed: "Licensed media",
    owned: "GCX original media",
    "permission-granted": "Permission granted",
    "fair-use-review": "Editorial fair-use review",
    "source-link-only": "Source link only",
    "pending-review": "Pending media review",
  };
  return labels[status] || "Pending media review";
}

function canDisplayEditorialImage(item) {
  return Boolean(item?.imageUrl && ["approved", "press-asset", "licensed", "owned", "permission-granted", "fair-use-review"].includes(slugId(item.rightsStatus)));
}

function normalizedEditorialImageUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const url = new URL(text, window.location.href);
    if (url.pathname !== "/api/image-proxy") url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return text.split(/[?#]/)[0];
  }
}

function duplicatesStoryHeroImage(story, item) {
  const mediaType = slugId(item?.mediaType || item?.type || "");
  if (!["image", "screenshot"].includes(mediaType)) return false;
  const heroImage = storyHeroImageUrl(story);
  return Boolean(heroImage && item?.imageUrl && normalizedEditorialImageUrl(heroImage) === normalizedEditorialImageUrl(item.imageUrl));
}

function filtersStoryHeroImage(story) {
  const heroImage = storyHeroImageUrl(story);
  return (item) => !item?.imageUrl || normalizedEditorialImageUrl(heroImage) !== normalizedEditorialImageUrl(item.imageUrl);
}

function renderMediaCredit(item) {
  const parts = [item.credit, item.source].filter(Boolean);
  const label = parts.length ? parts.join(" / ") : editorialMediaRightsLabel(item);
  return `
    <figcaption>
      ${item.caption ? `<span>${escapeHtml(item.caption)}</span>` : ""}
      <small>${escapeHtml(label)}${item.sourceUrl ? ` - <a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">Source</a>` : ""}</small>
    </figcaption>
  `;
}

function renderEditorialMediaItem(item, story = null) {
  const mediaType = slugId(item?.mediaType || item?.type || "");
  const rightsNote = item.rightsNote || "";
  if (mediaType === "trailer" || mediaType === "video") {
    const embedUrl = normalizeYouTubeEmbedUrl(item.embedUrl || item.sourceUrl);
    if (!embedUrl) return "";
    return `
      <figure class="editorial-media editorial-video" data-media-type="${escapeHtml(mediaType)}">
        <div class="editorial-video-frame">
          <iframe
            src="${escapeHtml(embedUrl)}"
            title="${escapeHtml(item.altText || item.caption || "Official video")}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen></iframe>
        </div>
        ${renderMediaCredit({ ...item, rightsStatus: item.rightsStatus || "official-embed" })}
      </figure>
    `;
  }

  if (mediaType === "gallery" && Array.isArray(item.items) && item.items.length) {
    const visibleItems = item.items.filter(canDisplayEditorialImage).filter(filtersStoryHeroImage(story));
    if (!visibleItems.length) return renderEditorialMediaItem({ ...item, mediaType: "rights-note" });
    return `
      <section class="editorial-media editorial-gallery" aria-label="${escapeHtml(item.altText || item.caption || "Editorial media gallery")}">
        ${item.caption ? `<div class="editorial-gallery-head"><span>Media Gallery</span><h2>${escapeHtml(item.caption)}</h2></div>` : ""}
        <div>
          ${visibleItems.map((galleryItem) => `
            <figure>
              <img src="${escapeHtml(galleryItem.imageUrl)}" alt="${escapeHtml(galleryItem.altText || item.altText || "")}" loading="lazy" decoding="async" />
              ${renderMediaCredit({ ...item, ...galleryItem })}
            </figure>
          `).join("")}
        </div>
      </section>
    `;
  }

  if (mediaType === "image" || mediaType === "screenshot") {
    if (!canDisplayEditorialImage(item)) {
      return `
        <aside class="editorial-media editorial-media-rights-note">
          <span>${escapeHtml(editorialMediaRightsLabel(item))}</span>
          <p>${escapeHtml(rightsNote || "Screenshot or artwork is referenced by the newsroom, but GCX is holding the image until the source path is approved for display.")}</p>
          ${item.sourceUrl ? `<a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">Open official source</a>` : ""}
        </aside>
      `;
    }
    return `
      <figure class="editorial-media editorial-image" data-media-type="${escapeHtml(mediaType)}">
        <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.altText || item.caption || "")}" loading="lazy" decoding="async" />
        ${renderMediaCredit(item)}
      </figure>
    `;
  }

  if (mediaType === "rights-note") {
    return `
      <aside class="editorial-media editorial-media-rights-note">
        <span>${escapeHtml(editorialMediaRightsLabel(item))}</span>
        <p>${escapeHtml(item.caption || rightsNote || "Media is queued for editorial review before display.")}</p>
        ${item.sourceUrl ? `<a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">Open source</a>` : ""}
      </aside>
    `;
  }

  return "";
}

function renderEditorialMediaGroup(story, predicate) {
  return (story.media || [])
    .filter(predicate)
    .filter((item) => !duplicatesStoryHeroImage(story, item))
    .map((item) => renderEditorialMediaItem(item, story))
    .filter(Boolean)
    .join("");
}

function renderArticleBlocksWithMedia(story, blocks) {
  return blocks
    .map((block, index) => {
      const heading = articleHeadingTitle(block);
      const mediaHtml = renderEditorialMediaGroup(story, (item) => {
        if (Number.isFinite(Number(item.afterBlockIndex)) && Number(item.afterBlockIndex) === index) return true;
        return item.afterHeading && heading && slugId(item.afterHeading) === slugId(heading);
      });
      return `${renderArticleBlockWithId(block)}${mediaHtml}`;
    })
    .join("");
}

function renderArticleMetaPanel(story, sourceLinks = []) {
  const lastUpdated = story.lastUpdated || story.lastReviewedAt || story.publishedAt;
  const sourceCount = sourceLinks.length;
  return `
    <div class="article-meta-panel">
      <span>Last updated ${escapeHtml(formatDate(lastUpdated))}</span>
      <span>${Number(sourceCount).toLocaleString()} ${sourceCount === 1 ? "source" : "sources"}</span>
      ${story.articleType ? `<span>${escapeHtml(story.articleType)}</span>` : ""}
      ${story.editorialStatus ? `<span>Status: ${escapeHtml(story.editorialStatus)}</span>` : ""}
      ${story.confidence ? `<span>Confidence: ${escapeHtml(story.confidence)}</span>` : ""}
      ${Number.isFinite(Number(story.opportunityScore)) ? `<span>Opportunity ${Number(story.opportunityScore).toLocaleString()}/100</span>` : ""}
      ${Number.isFinite(Number(story.qaScore)) ? `<span>QA ${Number(story.qaScore).toLocaleString()}/100</span>` : ""}
      ${sourceCount ? `<a href="#article-sources">View source links</a>` : ""}
      <a href="docs/editorial-corrections-policy.md">Corrections policy</a>
    </div>
  `;
}

function renderCommentsSection() {
  return `
    <section class="article-comments">
      <div class="section-heading">
        <div>
          <p class="kicker">Conversation</p>
          <h2>Comments</h2>
        </div>
        <span>${Number(activeComments.length).toLocaleString()} comments</span>
      </div>
      <div class="comment-list">${renderComments()}</div>
      ${renderCommentComposer()}
    </section>
  `;
}

function renderPremiumPokemonGuide(story) {
  const sourceLinks = story.sourceLinks || [];
  const relatedLinks = story.relatedLinks || [];
  const tocItems = [
    ["when-does-pokemon-tcg-30th-celebration-release", "Release Date"],
    ["every-booster-pack-has-a-pikachu", "Pikachu Cards"],
    ["pokemon-is-introducing-a-brand-new-rarity-futuristic-rare", "Futuristic Rare"],
    ["what-is-the-30th-celebration-classic-collection", "Classic Collection"],
    ["pokemon-tcg-30th-celebration-products", "Products"],
    ["what-could-be-the-biggest-chase-cards", "Chase Cards"],
    ["pokemon-tcg-30th-celebration-faq", "FAQ"],
    ["latest-30th-celebration-updates", "Latest Updates"],
  ];
  const quickFacts = [
    ["Release", "September 16, 2026"],
    ["Set identity", "30 Pikachu cards, one guaranteed in every standard booster"],
    ["Pack contents", "5 foil cards, 1 foil Basic Energy, 1 code card"],
    ["New rarity", "Futuristic Rare debuts with Mew and Mewtwo"],
    ["Product waves", "September 16, October 2, October 30, November 6"],
    ["Tracker", "MSRP and preorder guide is now live"],
  ];
  const productCards = [
    ["Elite Trainer Box", "Sept. 16", "9 packs, Nidorina promo, sleeves, dice, guide, storage box"],
    ["Poster Collection", "Sept. 16", "Legendary bird promos, 3 packs, large set poster"],
    ["Tech Sticker Collection", "Sept. 16", "Lucario or Alolan Exeggutor promo, sticker sheet, 3 packs"],
    ["Booster Bundle", "Oct. 2", "6 packs with no extra accessories"],
    ["Binder Collection", "Oct. 2", "9-pocket binder and 5 packs"],
    ["Day/Night UPCs", "Nov. 6", "29 packs, Classic Collection booster, Pikachu ex, Espeon or Umbreon"],
  ];
  const chaseCards = [
    ["Pikachu ex - Day", "Mascot appeal plus special illustration treatment."],
    ["Pikachu ex - Night", "Night theme connects directly to Umbreon demand."],
    ["Mew Futuristic Rare", "New rarity, iconic Pokemon, YOSHIROTTEN artwork."],
    ["Mewtwo Futuristic Rare", "A natural flagship for the future-facing treatment."],
    ["Lugia", "Historical callback gives it extra collector weight."],
    ["Charizard Classic Collection", "It is Charizard. That still matters."],
  ];
  const timelineItems = [
    ["Sept. 16", "Main launch", "Elite Trainer Boxes, launch-day collections, ex boxes, blisters, and poster/sticker products arrive."],
    ["Oct. 2", "Pack-opening wave", "Booster Bundle, Binder Collection, and Mini Tins give collectors more ways to chase the set."],
    ["Oct. 30", "Battle decks", "Espeon ex and Umbreon ex all-foil Battle Decks arrive for players and theme collectors."],
    ["Nov. 6", "Premium wave", "Day/Night UPCs, Mew and Mewtwo Figure Collections, and Ditto Premium Collection become the major sealed focus."],
  ];
  const comparisonItems = [
    ["Booster Bundle", "6", "Reported $26.94", "Best clean pack access if supply holds."],
    ["Poster Collection", "3", "Reported $14.99", "Good if the Legendary bird promos matter."],
    ["Elite Trainer Box", "9", "Reported $49.99", "Stronger sealed shelf appeal than pure pack value."],
    ["Day/Night UPC", "29 + Classic booster", "Reported $179.99", "Premium collector centerpiece, not a budget open."],
  ];
  const revealItems = [
    ["Aug. 20", "Kyogre, Groudon, Zacian, Zamazenta", "Recent Legendary reveals broaden the set beyond first-generation nostalgia."],
    ["Aug. 19", "Lugia and Ho-Oh", "Johto's Legendary pair adds a clear historical callback for longtime TCG collectors."],
    ["Aug. 18", "Articuno, Zapdos and Moltres", "The original Legendary birds arrived alongside another anniversary Pikachu design."],
    ["Aug. 16", "Day and Night Pikachu ex", "Special illustration rare versions became early cards-to-watch for the release."],
  ];
  const bodyHtml = (story.body || [])
    .filter(Boolean)
    .map((block) => {
      const heading = articleHeadingTitle(block);
      const mediaHtml = renderEditorialMediaGroup(story, (item) => {
        return item.afterHeading && heading && slugId(item.afterHeading) === slugId(heading);
      });
      const rendered = renderArticleBlockWithId(block);
      if (heading === "Every Booster Pack Has a Pikachu") {
        return `
          ${rendered}
          ${mediaHtml}
          <aside class="feature-info-strip">
            <div><span>Guaranteed</span><strong>1 Pikachu</strong><p>Every standard booster includes one of the 30 Pikachu cards.</p></div>
            <div><span>Finish</span><strong>All Foil</strong><p>Every card in the expansion is foil, including Basic Energy.</p></div>
            <div><span>Collector Goal</span><strong>30-card subset</strong><p>The Pikachu run gives casual collectors a clear chase outside the master set.</p></div>
          </aside>
        `;
      }
      if (heading.includes("30th Celebration Release")) {
        return `
          ${rendered}
          ${mediaHtml}
          <section class="release-timeline" aria-label="30th Celebration release timeline">
            ${timelineItems.map(([date, title, detail]) => `
              <article>
                <time>${escapeHtml(date)}</time>
                <div>
                  <h3>${escapeHtml(title)}</h3>
                  <p>${escapeHtml(detail)}</p>
                </div>
              </article>
            `).join("")}
          </section>
        `;
      }
      if (heading === "Pokemon Is Introducing a Brand-New Rarity: Futuristic Rare") {
        return `
          ${rendered}
          ${mediaHtml}
          <figure class="feature-section-image">
            <img src="${escapeHtml(storyHeroImageUrl(story))}" alt="${escapeHtml(storyHeroImageAlt(story, "Pokemon 30th Celebration editorial art"))}" loading="lazy" />
            <figcaption>GCX visual note: 30th Celebration is built around past, present, and future-facing collector hooks.</figcaption>
          </figure>
        `;
      }
      if (heading === "Pokemon TCG: 30th Celebration Products") {
        return `
          ${rendered}
          ${mediaHtml}
          <section class="product-comparison-block" aria-label="30th Celebration product comparison">
            <div class="comparison-head">
              <span>Collector Math</span>
              <h3>Product Comparison</h3>
              <p>Use this as a quick read on what each product is really selling you: packs, promos, shelf appeal, or premium packaging.</p>
            </div>
            <div class="comparison-table" role="table" aria-label="30th Celebration product comparison">
              <div role="row">
                <span role="columnheader">Product</span>
                <span role="columnheader">Packs</span>
                <span role="columnheader">Baseline</span>
                <span role="columnheader">Best For</span>
              </div>
              ${comparisonItems.map(([product, packs, baseline, bestFor]) => `
                <div role="row">
                  <strong role="cell">${escapeHtml(product)}</strong>
                  <span role="cell">${escapeHtml(packs)}</span>
                  <span role="cell">${escapeHtml(baseline)}</span>
                  <span role="cell">${escapeHtml(bestFor)}</span>
                </div>
              `).join("")}
            </div>
          </section>
          <section class="product-card-grid" aria-label="30th Celebration product highlights">
            ${productCards.map(([name, date, detail]) => `
              <article>
                <span>${escapeHtml(date)}</span>
                <h3>${escapeHtml(name)}</h3>
                <p>${escapeHtml(detail)}</p>
              </article>
            `).join("")}
          </section>
        `;
      }
      if (heading === "What Could Be the Biggest Chase Cards?") {
        return `
          ${rendered}
          ${mediaHtml}
          <section class="chase-card-grid cards-to-watch-module" aria-label="30th Celebration chase cards to watch">
            ${chaseCards.map(([name, detail]) => `
              <article>
                <span>Watchlist</span>
                <h3>${escapeHtml(name)}</h3>
                <p>${escapeHtml(detail)}</p>
              </article>
            `).join("")}
          </section>
        `;
      }
      if (heading === "Latest 30th Celebration Updates") {
        return `
          ${rendered}
          ${mediaHtml}
          <section class="latest-reveals-grid" aria-label="Latest 30th Celebration reveals">
            ${revealItems.map(([date, title, detail]) => `
              <article>
                <time>${escapeHtml(date)}</time>
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(detail)}</p>
              </article>
            `).join("")}
          </section>
        `;
      }
      return `${rendered}${mediaHtml}`;
    })
    .join("");

  return `
    <article class="article-feature pokemon-guide-feature">
      <section class="feature-hero" data-media-type="${escapeHtml(articleHeroMediaType(story))}">
        <img class="article-hero-image" src="${escapeHtml(storyHeroImageUrl(story))}" alt="${escapeHtml(storyHeroImageAlt(story, story.title))}" data-media-type="${escapeHtml(articleHeroMediaType(story))}" loading="eager" decoding="async" width="1200" height="675" style="${heroFocalStyle(story)}" />
        ${renderOfficialMediaReviewWarning(story)}
        <div class="feature-hero-copy">
          <p class="meta">${escapeHtml(story.category || "Cards")} - ${escapeHtml(story.sourceName || "GCX")} - ${escapeHtml(formatDate(story.publishedAt))}</p>
          <h1>${escapeHtml(story.title)}</h1>
          <p class="article-dek">${escapeHtml(plainText(story.excerpt || (story.body || [])[0], 320))}</p>
          ${renderArticleMetaPanel(story, sourceLinks)}
          <div class="article-actions">
            <a class="button secondary" href="${escapeHtml(story.shareUrl || "community.html")}">Share to community</a>
            <a class="button secondary" href="news.html">Back to news</a>
          </div>
        </div>
      </section>

      <div class="feature-layout">
        <aside class="feature-rail">
          <nav class="feature-toc" aria-label="Article table of contents">
            <strong>In This Guide</strong>
            ${tocItems.map(([id, label]) => `<a href="#${escapeHtml(id)}">${escapeHtml(label)}</a>`).join("")}
          </nav>
          ${renderRelatedCoverage(relatedLinks)}
        </aside>

        <div class="feature-main">
          <section class="feature-update-callout">
            <span>Updated Aug. 22</span>
            <p>Lugia, Ho-Oh, Kyogre, Groudon, Zacian and Zamazenta added. GCX will keep this guide updated as Pokemon reveals more products, cards, preorder details, and availability information.</p>
          </section>

          <section class="quick-facts-grid" aria-label="30th Celebration quick facts">
            ${quickFacts.map(([label, value]) => `
              <div>
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
              </div>
            `).join("")}
          </section>

          ${renderQuickVersion(story)}
          ${renderCultureLoop(story)}

          <div class="article-body feature-body">
            ${bodyHtml}
          </div>

          ${renderSourceSection(sourceLinks)}
          ${renderCommentsSection()}
        </div>
      </div>
    </article>
  `;
}

function renderStatusBadge(status) {
  const value = String(status || "Reported").trim();
  return `<span class="event-status-badge is-${escapeHtml(slugId(value) || "reported")}">${escapeHtml(value)}</span>`;
}

const displayableImageRights = new Set([
  "approved",
  "api-permitted",
  "licensed",
  "owned",
  "permission-granted",
  "press-asset",
]);

function canDisplayRightsManagedImage(item) {
  const status = slugId(item?.rightsStatus || "");
  return Boolean(item?.imageUrl && displayableImageRights.has(status));
}

function renderRightsManagedCardArt(card) {
  if (canDisplayRightsManagedImage(card)) {
    return `
      <figure class="pikachu-card-art pikachu-card-art-image">
        <img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.imageAlt || `Pikachu ${card.subset || ""} card image`)}" loading="lazy" decoding="async" width="630" height="880" />
        <figcaption>${escapeHtml(card.imageProvider || "Approved card image")}</figcaption>
      </figure>
    `;
  }

  return `
    <div class="pikachu-card-art pikachu-card-art-unavailable" role="img" aria-label="Card image unavailable">
      <strong>Image unavailable</strong>
      <small>${escapeHtml(card.rightsStatus === "source-link-only" ? "Rights review" : "Media review")}</small>
    </div>
  `;
}

function dedupeArticleCards(cards = [], franchise = "pokemon") {
  if (window.GCX_TCG_IDENTITY?.dedupeCards) {
    return window.GCX_TCG_IDENTITY.dedupeCards(cards, franchise, { includeVariant: true });
  }
  const seen = new Set();
  const deduped = [];
  const duplicates = [];
  cards.forEach((card) => {
    const key = [
      franchise,
      card.setCode || card.setName || "article",
      card.cardNumber || card.number || card.subset || "",
      card.cardName || card.name || "pikachu",
      card.variant || card.rarity || card.illustrator || "",
      card.language || "en",
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .join("|");
    if (seen.has(key)) {
      duplicates.push(card);
      return;
    }
    seen.add(key);
    deduped.push(card);
  });
  return { cards: deduped, duplicates };
}

function renderLiveEventGuide(story) {
  const sourceLinks = story.sourceLinks || [];
  const relatedLinks = story.relatedLinks || [];
  const event = story.liveEvent || {};
  const tocItems = [
    ["gamescom-2026-quick-facts", "Quick Facts"],
    ["gamescom-2026-schedule", "Full Schedule"],
    ["games-confirmed-for-gamescom-2026", "Confirmed Games"],
    ["what-games-should-you-watch-during-opening-night-live", "Games to Watch"],
    ["xbox-is-bringing-a-major-gamescom-lineup", "Xbox"],
    ["confirmed-vs-rumored-games", "Confirmed vs. Rumored"],
    ["how-to-watch-gamescom-opening-night-live", "How to Watch"],
    ["latest-gamescom-2026-updates", "Latest Updates"],
    ["gamescom-2026-faq", "FAQ"],
  ];
  const bodyHtml = renderArticleBlocksWithMedia(story, (story.body || []).filter(Boolean));

  return `
    <article class="article-feature live-event-feature">
      <section class="feature-hero live-event-hero" data-media-type="${escapeHtml(articleHeroMediaType(story))}">
        <img class="article-hero-image" src="${escapeHtml(storyHeroImageUrl(story))}" alt="${escapeHtml(storyHeroImageAlt(story, story.title))}" data-media-type="${escapeHtml(articleHeroMediaType(story))}" loading="eager" decoding="async" width="1200" height="675" style="${heroFocalStyle(story)}" />
        ${renderOfficialMediaReviewWarning(story)}
        <div class="feature-hero-copy">
          <div class="event-hero-meta">
            <span class="event-status-pill">${escapeHtml(event.eventStatus || story.eventStatus || "UPCOMING")}</span>
            <span>${escapeHtml(event.label || "Live Event Hub")}</span>
          </div>
          <p class="meta">${escapeHtml(story.category || "Gaming")} - ${escapeHtml(story.sourceName || "GCX")} - ${escapeHtml(formatDate(story.publishedAt))}</p>
          <h1>${escapeHtml(story.title)}</h1>
          <p class="article-dek">${escapeHtml(plainText(story.excerpt || (story.body || [])[0], 320))}</p>
          ${renderArticleMetaPanel(story, sourceLinks)}
          <div class="event-watch-buttons" aria-label="Watch Gamescom streams">
            ${(event.watchLinks || []).map(([label, url]) => `<a class="button ${label.includes("official") ? "" : "secondary"}" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`).join("")}
          </div>
        </div>
      </section>

      <div class="feature-layout">
        <aside class="feature-rail">
          <nav class="feature-toc" aria-label="Article table of contents">
            <strong>In This Guide</strong>
            ${tocItems.map(([id, label]) => `<a href="#${escapeHtml(id)}">${escapeHtml(label)}</a>`).join("")}
          </nav>
          ${renderRelatedCoverage(relatedLinks)}
        </aside>

        <div class="feature-main">
          <section class="event-update-module" aria-label="Latest Gamescom updates">
            <div>
              <span>Latest Update</span>
              <h2>${escapeHtml((event.updates || [])[0]?.headline || "Gamescom coverage is being prepared")}</h2>
              <p>${escapeHtml((event.updates || [])[0]?.text || "GCX will update this hub as official announcements arrive.")}</p>
            </div>
            <time>${escapeHtml((event.updates || [])[0]?.timestamp || event.lastUpdatedLabel || story.lastUpdated || "")}</time>
          </section>

          <section id="gamescom-2026-quick-facts" class="quick-facts-grid event-quick-facts" aria-label="Gamescom quick facts">
            ${(event.quickFacts || []).map(([label, value]) => `
              <div>
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
              </div>
            `).join("")}
          </section>

          ${renderQuickVersion(story)}
          ${renderCultureLoop(story)}

          <section id="gamescom-2026-schedule" class="event-schedule" aria-label="Gamescom 2026 schedule">
            <div class="comparison-head">
              <span>Event Schedule</span>
              <h2>Gamescom 2026 Schedule</h2>
              <p>Times are listed for U.S. viewers and Cologne local time where available.</p>
            </div>
            ${(event.schedule || []).map((item) => `
              <article>
                <div>
                  <time>${escapeHtml(item.date)}</time>
                  ${renderStatusBadge(item.status)}
                </div>
                <div>
                  <h3>${escapeHtml(item.event)}</h3>
                  <p>${escapeHtml(item.time)}</p>
                  ${item.watchUrl ? `<a href="${escapeHtml(item.watchUrl)}" target="_blank" rel="noopener">${escapeHtml(item.watchLabel || "Watch")}</a>` : ""}
                </div>
              </article>
            `).join("")}
          </section>

          <section class="event-game-watch" aria-label="Gamescom games to watch">
            <div class="comparison-head">
              <span>GCX Watchlist</span>
              <h2>Biggest Games to Watch</h2>
            </div>
            <div class="event-game-list">
              ${(event.gamesToWatch || []).map(([game, status, detail]) => `
                <article>
                  ${renderStatusBadge(status)}
                  <h3>${escapeHtml(game)}</h3>
                  <p>${escapeHtml(detail)}</p>
                </article>
              `).join("")}
            </div>
          </section>

          <section class="event-announcement-feed" aria-label="Live announcement feed">
            <div class="comparison-head">
              <span>Live Feed</span>
              <h2>Announcement Feed</h2>
              <p>During Opening Night Live, GCX can add trailer, platform, release-date, and related-story updates here.</p>
            </div>
            ${(event.announcements || []).length
              ? event.announcements.map((item) => `
                  <article>
                    <time>${escapeHtml(item.timestamp || "")}</time>
                    <h3>${escapeHtml(item.gameTitle || item.title)}</h3>
                    <p>${escapeHtml(item.summary || "")}</p>
                  </article>
                `).join("")
              : `<div class="index-message">Live announcements will appear here once the event begins.</div>`}
          </section>

          <div class="article-body feature-body live-event-body">
            ${bodyHtml}
          </div>

          ${renderSourceSection(sourceLinks)}
          ${renderCommentsSection()}
        </div>
      </div>
    </article>
  `;
}

function renderPokemonPikachuChecklist(story) {
  const sourceLinks = story.sourceLinks || [];
  const relatedLinks = story.relatedLinks || [];
  const guide = story.pikachuGuide || {};
  const revealedDedupe = dedupeArticleCards(guide.revealedPikachu || [], "pokemon");
  const revealed = revealedDedupe.cards;
  const missing = guide.missingSlots || [];
  const pikachuExDedupe = dedupeArticleCards(guide.pikachuEx || [], "pokemon");
  const pikachuEx = pikachuExDedupe.cards;
  const checklistWarnings = [
    revealedDedupe.duplicates.length ? `DUPLICATE_RENDER_ON_PAGE: ${revealedDedupe.duplicates.length} checklist duplicates hidden` : "",
    pikachuExDedupe.duplicates.length ? `DUPLICATE_RENDER_ON_PAGE: ${pikachuExDedupe.duplicates.length} Pikachu ex duplicates hidden` : "",
  ].filter(Boolean);
  const tocItems = [
    ["pikachu-status", "Status"],
    ["how-the-30-pikachu-subset-works", "How It Works"],
    ["the-20-revealed-pikachu-cards", "Revealed Cards"],
    ["additional-pikachu-ex-cards", "Pikachu ex"],
    ["the-10-pikachu-still-unrevealed", "Unrevealed"],
    ["early-chase-cards-to-watch", "Watchlist"],
    ["pull-rates-prices-and-grading", "Prices"],
    ["faq", "FAQ"],
  ];
  const bodyHtml = (story.body || [])
    .filter(Boolean)
    .map((block) => {
      const heading = articleHeadingTitle(block);
      const rendered = renderArticleBlockWithId(block);
      if (heading === "The 20 Revealed Pikachu Cards") {
        return `
          ${rendered}
          <section class="pikachu-card-grid" aria-label="Revealed 30th Celebration Pikachu cards">
            ${revealed.map((card) => `
              <article class="pikachu-card-tile">
                ${renderRightsManagedCardArt(card)}
                <div>
                  <span class="pikachu-card-status">${escapeHtml(card.status || "Revealed")}</span>
                  <h3>Pikachu ${escapeHtml(card.subset)}</h3>
                  <p class="pikachu-card-number">${escapeHtml(card.number)} - ${escapeHtml(card.illustrator)}</p>
                  <p>${escapeHtml(card.note)}</p>
                  <b>${escapeHtml(card.chase)} watchlist</b>
                  <span class="image-rights-note">${escapeHtml(card.rightsStatus === "source-link-only" ? "Image held until usage rights are approved." : card.rightsNote || "Image status under review.")}</span>
                  ${card.visualUrl || card.imageSourceUrl ? `<a class="pikachu-source-link" href="${escapeHtml(card.visualUrl || card.imageSourceUrl)}" target="_blank" rel="noopener">View source card page</a>` : ""}
                </div>
              </article>
            `).join("")}
          </section>
        `;
      }
      if (heading === "Additional Pikachu ex Cards") {
        return `
          ${rendered}
          <section class="pikachu-ex-grid" aria-label="Additional Pikachu ex variants">
            ${pikachuEx.map((card) => `
              <article>
                <span>${escapeHtml(card.number)}</span>
                <h3>${escapeHtml(card.name)}</h3>
                <strong>${escapeHtml(card.rarity)}</strong>
                <p>${escapeHtml(card.note)}</p>
              </article>
            `).join("")}
          </section>
        `;
      }
      if (heading === "The 10 Pikachu Still Unrevealed") {
        return `
          ${rendered}
          <section class="pikachu-missing-grid" aria-label="Unrevealed Pikachu subset slots">
            ${missing.map((slot) => `
              <article>
                <span>${escapeHtml(slot)}</span>
                <strong>Unrevealed</strong>
                <p>Hold for official reveal. Do not publish leaked artist or artwork claims as confirmed.</p>
              </article>
            `).join("")}
          </section>
        `;
      }
      if (heading === "Early Chase Cards to Watch") {
        return `
          ${rendered}
          <section class="chase-card-grid pikachu-watchlist-grid" aria-label="Pikachu chase cards to watch">
            ${(guide.chaseWatchlist || []).map((name) => `
              <article>
                <span>GCX Watchlist</span>
                <h3>${escapeHtml(name)}</h3>
                <p>Prospective collector interest based on artwork, illustrator identity and anniversary-story value.</p>
              </article>
            `).join("")}
          </section>
        `;
      }
      return rendered;
    })
    .join("");

  return `
    <article class="article-feature pokemon-pikachu-feature">
      <section class="feature-hero pikachu-hero" data-media-type="${escapeHtml(articleHeroMediaType(story))}">
        <img class="article-hero-image" src="${escapeHtml(storyHeroImageUrl(story))}" alt="${escapeHtml(storyHeroImageAlt(story, story.title))}" data-media-type="${escapeHtml(articleHeroMediaType(story))}" loading="eager" decoding="async" width="1200" height="675" style="${heroFocalStyle(story)}" />
        ${renderOfficialMediaReviewWarning(story)}
        <div class="feature-hero-copy">
          <p class="meta">${escapeHtml(story.category || "Cards")} - ${escapeHtml(story.sourceName || "GCX")} - ${escapeHtml(formatDate(story.publishedAt))}</p>
          <h1>${escapeHtml(story.title)}</h1>
          <p class="article-dek">${escapeHtml(plainText(story.excerpt || (story.body || [])[0], 320))}</p>
          ${renderArticleMetaPanel(story, sourceLinks)}
          <div class="article-actions">
            <a class="button secondary" href="${escapeHtml(story.shareUrl || "community.html")}">Share to community</a>
            <a class="button secondary" href="news.html">Back to news</a>
          </div>
        </div>
      </section>

      <div class="feature-layout">
        <aside class="feature-rail">
          <nav class="feature-toc" aria-label="Article table of contents">
            <strong>In This Guide</strong>
            ${tocItems.map(([id, label]) => `<a href="#${escapeHtml(id)}">${escapeHtml(label)}</a>`).join("")}
          </nav>
          ${renderRelatedCoverage(relatedLinks)}
        </aside>

        <div class="feature-main">
          <section id="pikachu-status" class="pikachu-status-panel" aria-label="Pikachu checklist status">
            <div>
              <span>Revealed</span>
              <strong>${Number(guide.revealedCount || revealed.length).toLocaleString()} / ${Number(guide.totalSubsetCards || 30).toLocaleString()}</strong>
              <p>Confirmed cards in the special Pikachu subset.</p>
            </div>
            <div>
              <span>Still Hidden</span>
              <strong>${Number(guide.missingCount || missing.length).toLocaleString()}</strong>
              <p>Slots held as placeholders until official reveal.</p>
            </div>
            <div>
              <span>Booster Rule</span>
              <strong>1 per pack</strong>
              <p>Every regular booster includes one of the 30 Pikachu cards.</p>
            </div>
            <div>
              <span>Release</span>
              <strong>${escapeHtml(guide.releaseDate || "September 16, 2026")}</strong>
              <p>Market and grading claims stay cautious before retail data exists.</p>
            </div>
          </section>

          <section class="feature-update-callout pikachu-update-callout">
            <span>Living Checklist</span>
            <p>${escapeHtml(guide.lastRevealNote || "GCX will update this same article as more Pikachu cards are officially revealed.")}</p>
          </section>

          ${window.GCX_TCG_IDENTITY?.renderWarnings ? window.GCX_TCG_IDENTITY.renderWarnings(checklistWarnings) : ""}

          <section class="image-rights-callout" aria-label="GCX card image policy">
            <span>Image Policy</span>
            <p>GCX displays card images only when the source path is approved for our use. Revealed cards can still appear as source-linked placeholders until usage rights are verified.</p>
          </section>

          ${renderQuickVersion(story)}
          ${renderCultureLoop(story)}

          <div class="article-body feature-body pikachu-body">
            ${bodyHtml}
          </div>

          ${renderSourceSection(sourceLinks)}
          ${renderCommentsSection()}
        </div>
      </div>
    </article>
  `;
}

function renderArticle(story) {
  const paragraphs = (story.body || [story.excerpt]).filter(Boolean);
  const sourceLinks = story.sourceLinks || [];
  const relatedLinks = story.relatedLinks || [];
  const sourceHref = story.externalUrl || story.sourceUrl || "";
  const showSourceButton = sourceHref && sourceHref !== "news.html";
  const ledeMedia = renderEditorialMediaGroup(story, (item) => slugId(item.placement) === "after-dek" || slugId(item.placement) === "lede");
  const footerMedia = renderEditorialMediaGroup(story, (item) => slugId(item.placement) === "after-body" || slugId(item.placement) === "footer");
  updateArticleMetadata(story);
  if (story.id === "gcx-newsroom-pokemon-tcg-30th-celebration-complete-guide") {
    articleDetail.innerHTML = renderPremiumPokemonGuide(story);
    return;
  }
  if (story.articleMode === "live-event") {
    articleDetail.innerHTML = renderLiveEventGuide(story);
    return;
  }
  if (story.articleMode === "pokemon-pikachu-checklist") {
    articleDetail.innerHTML = renderPokemonPikachuChecklist(story);
    return;
  }
  articleDetail.innerHTML = `
    <article>
      <img class="article-hero-image" src="${escapeHtml(storyHeroImageUrl(story))}" alt="${escapeHtml(storyHeroImageAlt(story, story.title))}" data-media-type="${escapeHtml(articleHeroMediaType(story))}" loading="eager" decoding="async" width="1200" height="675" style="${heroFocalStyle(story)}" />
      ${renderOfficialMediaReviewWarning(story)}
      <div class="article-copy">
        <p class="meta">${escapeHtml(story.category || "News")} - ${escapeHtml(story.sourceName || "GCX")} - ${escapeHtml(formatDate(story.publishedAt))}</p>
        ${storyHeroImageCredit(story) ? `<p class="image-credit">Image: ${escapeHtml(storyHeroImageCredit(story))}</p>` : ""}
        <h1>${escapeHtml(story.title)}</h1>
        <p class="article-dek">${escapeHtml(plainText(story.excerpt || (story.body || [])[0], 320))}</p>
        ${renderArticleMetaPanel(story, sourceLinks)}
        ${renderQuickVersion(story)}
        ${ledeMedia}
        <div class="article-actions">
          ${showSourceButton ? `<a class="button" href="${escapeHtml(sourceHref)}">Open source</a>` : ""}
          <a class="button secondary" href="${escapeHtml(story.shareUrl || "community.html")}">Share to community</a>
          <a class="button secondary" href="news.html">Back to news</a>
        </div>
        ${renderCultureLoop(story)}
        <div class="article-body">
          ${renderArticleBlocksWithMedia(story, paragraphs)}
        </div>
        ${footerMedia}
        ${renderRelatedCoverage(relatedLinks)}
        ${renderSourceSection(sourceLinks)}
        ${renderCommentsSection()}
      </div>
    </article>
  `;
}

async function loadArticle() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    articleDetail.innerHTML = `<div class="index-message">Article not found.</div>`;
    return;
  }

  try {
    await loadSession();
    const response = await fetch(`/api/news/${encodeURIComponent(id)}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Article could not be loaded.");
    activeStory = result.data;
    await loadComments(activeStory.id);
    renderArticle(activeStory);
  } catch (error) {
    articleDetail.innerHTML = `<div class="index-message">${escapeHtml(error.message || "Article could not be loaded.")}</div>`;
  }
}

articleDetail?.addEventListener("submit", async (event) => {
  const form = event.target.closest("#article-comment-form");
  if (!form || !activeStory) return;
  event.preventDefault();
  const button = form.querySelector("button");
  const status = form.querySelector("#article-comment-status");
  const body = new FormData(form).get("body");
  button.disabled = true;
  button.textContent = "Posting...";
  status.textContent = "";

  try {
    const response = await fetch(`/api/news/${encodeURIComponent(activeStory.id)}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ body }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Comment could not be posted.");
    activeComments.push(result.data);
    form.reset();
    renderArticle(activeStory);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Post comment";
  }
});

loadArticle();

