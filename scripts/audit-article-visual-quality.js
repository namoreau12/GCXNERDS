const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const jsonPath = path.join(outputDir, "article-visual-quality.json");
const markdownPath = path.join(outputDir, "article-visual-quality.md");

const officialMediaKeywords = [
  "official",
  "publisher",
  "developer",
  "press",
  "media kit",
  "square enix",
  "capcom",
  "xbox",
  "the coalition",
  "playstation",
  "sony",
  "nintendo",
  "pokemon",
  "the pokemon company",
  "fromsoftware",
  "cd projekt",
  "rebel wolves",
  "bandai namco",
  "rockstar",
  "guerrilla",
];

const realGameHints = [
  /blood of dawnwalker/i,
  /duskbloods/i,
  /final fantasy/i,
  /gears of war/i,
  /gta\s*(vi|6)/i,
  /horizon/i,
  /mega man/i,
  /phantom blade/i,
  /witcher/i,
];

const prohibitedGameHeroPatterns = [
  /abstract/i,
  /ai[-\s]?created/i,
  /baked[-\s]?headline/i,
  /fake[-\s]?(logo|title|visual)/i,
  /geometric/i,
  /generated[-\s]?(art|image|visual)/i,
  /original gcx editorial image/i,
  /placeholder[-\s]?(illustration|graphic|visual)/i,
  /symbolic[-\s]?art/i,
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

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, " ")
    .replace(/[*_#>`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bodyBlocks(story) {
  return Array.isArray(story.body) ? story.body : [];
}

function blockText(block) {
  if (typeof block === "string") return block;
  if (!block || typeof block !== "object") return "";
  if (block.type === "table") {
    return [block.caption, ...(block.headers || []), ...(block.rows || []).flat()].filter(Boolean).join(" ");
  }
  if (Array.isArray(block.items)) {
    return [block.title, block.heading, block.caption, ...block.items.map(blockText)].filter(Boolean).join(" ");
  }
  return [block.title, block.heading, block.text, block.body, block.caption, block.dek].filter(Boolean).join(" ");
}

function wordCount(text) {
  const cleaned = stripMarkdown(text);
  return cleaned ? cleaned.split(/\s+/).filter(Boolean).length : 0;
}

function storyWordCount(story) {
  return bodyBlocks(story).map(blockText).map(wordCount).reduce((sum, count) => sum + count, 0);
}

function isMarkdownTableSeparatorCell(value) {
  return /^:?-{3,}:?$/.test(
    String(value || "")
      .trim()
      .replace(/[\u2010-\u2015\u2212]/g, "-")
      .replace(/\s+/g, "")
  );
}

function normalizeTableText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/\u00e2\u20ac[\u201c\u201d]/g, "-")
    .replace(/[\u2010-\u2015\u2212]/g, "-");
}

function hasRawMarkdownTable(value) {
  const text = normalizeTableText(value);
  return text.includes("|") && (/\|\s*:?-{3,}:?\s*\|/.test(text) || /\|\s*\|\s*:?-{3,}:?/.test(text));
}

function hasFlattenedMarkdownTable(value) {
  const text = normalizeTableText(value);
  return text.includes("|") && !text.includes("\n") && hasRawMarkdownTable(text);
}

function structuredTableIssues(story, block, blockIndex) {
  const issues = [];
  if (!block || typeof block !== "object" || block.type !== "table") return issues;

  const headers = Array.isArray(block.headers) ? block.headers : [];
  const rows = Array.isArray(block.rows) ? block.rows : [];
  const longestCell = [block.caption, ...headers, ...rows.flat()].reduce((longest, cell) => Math.max(longest, String(cell || "").length), 0);

  if (headers.length > 5) issues.push(issue(story, "warning", "wide_table_review", `Table block ${blockIndex + 1} has ${headers.length} columns and may be cramped on mobile.`));
  if (longestCell > 180) issues.push(issue(story, "warning", "long_table_cell_review", `Table block ${blockIndex + 1} has a long cell that may need shorter editorial copy.`));
  if (!headers.length || !rows.length) issues.push(issue(story, "error", "empty_structured_table", `Table block ${blockIndex + 1} is missing headers or rows.`));
  return issues;
}

function heroImage(story) {
  return story.heroImage || story.imageUrl || "";
}

function heroMediaType(story) {
  const explicit = slug(story.mediaType || story.leadMediaType || story.imageType || "");
  const image = heroImage(story);
  if (explicit) return explicit;
  if (/\.svg(?:\?|$)/i.test(image)) return "graphic";
  return "screenshot";
}

function isGamingStory(story) {
  return slug(story.category || story.type).includes("gaming");
}

function isRealGameStory(story) {
  if (!isGamingStory(story)) return false;
  const haystack = [story.title, story.seoTitle, story.excerpt, story.canonicalTopic, ...(story.tags || [])].filter(Boolean).join(" ");
  return realGameHints.some((pattern) => pattern.test(haystack));
}

function hasOfficialHeroMedia(story) {
  const image = heroImage(story);
  const type = heroMediaType(story);
  const provenance = [story.heroImageSource, story.heroImageCredit, story.heroImageSourceUrl, story.imageSourceUrl, story.imageCredit]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!image || /\.svg(?:\?|$)/i.test(image)) return false;
  if (["graphic", "chart", "diagram", "infographic", "analysis-graphic"].includes(type)) return false;
  if (/\b(fallback|pending|required|review)\b/.test(provenance)) return false;
  return officialMediaKeywords.some((keyword) => provenance.includes(keyword));
}

function mediaItems(story) {
  const media = Array.isArray(story.media) ? story.media : [];
  return media.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    if (Array.isArray(item.items)) return item.items.map((child) => ({ ...item, ...child }));
    return [item];
  });
}

function mediaImageUrl(item) {
  return item.imageUrl || item.url || item.src || item.embedUrl || "";
}

function normalizedUrl(value) {
  return String(value || "").trim().replace(/[?#].*$/, "");
}

function isLongform(story, words) {
  const format = `${story.articleType || ""} ${story.title || ""}`;
  if (words >= 1100 || Boolean(story.livingArticle) || /guide|tracker|deep dive/i.test(format)) return true;
  return words >= 900 && /analysis/i.test(format);
}

function issue(story, severity, code, message, details = {}) {
  return {
    storyId: story.id,
    title: story.title,
    severity,
    code,
    message,
    ...details,
  };
}

function auditStory(story) {
  const issues = [];
  const words = storyWordCount(story);
  const blocks = bodyBlocks(story);
  const modules = blocks.filter((block) => block && typeof block === "object" && block.type !== "table").length;
  const tables = blocks.filter((block) => block && typeof block === "object" && block.type === "table").length;
  const media = mediaItems(story);
  const hero = heroImage(story);
  const mediaType = heroMediaType(story);
  const sourceCount = Array.isArray(story.sourceLinks) ? story.sourceLinks.filter((source) => source?.url).length : 0;

  if (!hero) issues.push(issue(story, "error", "missing_hero_image", "Article is missing a hero image."));
  if (!story.heroImageAlt) issues.push(issue(story, "warning", "missing_hero_alt", "Hero image needs specific alt text."));
  if (!story.heroImageCredit && !story.imageCredit) issues.push(issue(story, "warning", "missing_hero_credit", "Hero image needs visible credit/provenance."));
  if (isGamingStory(story) && /\.svg(?:\?|$)/i.test(hero)) issues.push(issue(story, "error", "gaming_hero_uses_svg", "Gaming stories should not use SVG/editorial graphics as hero art.", { heroImage: hero }));
  if (isRealGameStory(story) && ["graphic", "chart", "diagram", "infographic", "analysis-graphic"].includes(mediaType)) {
    issues.push(issue(story, "error", "real_game_story_uses_graphic_hero", "Real game coverage needs official game imagery, not a graphic hero.", { heroImage: hero, mediaType }));
  }

  const heroDescription = [hero, story.heroImageSource, story.heroImageCredit, story.heroImageAlt, story.imageCredit, story.title].filter(Boolean).join(" ");
  if (isGamingStory(story) && prohibitedGameHeroPatterns.some((pattern) => pattern.test(heroDescription))) {
    issues.push(issue(story, "error", "prohibited_generated_game_hero", "Gaming story hero appears to use a generated/symbolic graphic.", { heroImage: hero }));
  }
  if (isGamingStory(story) && !hasOfficialHeroMedia(story) && !["graphic", "analysis-graphic"].includes(mediaType)) {
    issues.push(issue(story, "warning", "official_media_review", "Gaming story needs confirmed official media provenance before promotion.", { heroImage: hero }));
  }

  blocks.forEach((block, index) => {
    const text = blockText(block);
    if (typeof block === "string" && hasFlattenedMarkdownTable(block)) {
      issues.push(issue(story, "error", "flattened_markdown_table_source", `Body block ${index + 1} contains a flattened markdown table that can leak ugly pipe text.`));
    } else if (typeof block === "string" && hasRawMarkdownTable(block)) {
      issues.push(issue(story, "warning", "raw_markdown_table_source", `Body block ${index + 1} contains a raw markdown table; confirm it renders as a table.`));
    }
    if (wordCount(text) > 140 && typeof block === "string" && !/^#{1,4}\s+/.test(block.trim())) {
      issues.push(issue(story, "warning", "long_text_block", `Body block ${index + 1} is a long paragraph and may need a pacing break.`));
    }
    issues.push(...structuredTableIssues(story, block, index));
  });

  if (isLongform(story, words) && media.length + modules + tables < 3) {
    issues.push(issue(story, "warning", "longform_visual_pacing", "Long-form article needs more media/modules/tables to avoid wall-of-text pacing."));
  }
  if (words >= 900 && sourceCount < 3) {
    issues.push(issue(story, "warning", "source_depth_review", "Longer article should have more visible source links."));
  }

  return {
    id: story.id,
    title: story.title,
    url: `article.html?id=${encodeURIComponent(story.id)}`,
    category: story.category || "",
    articleType: story.articleType || story.type || "",
    heroImage: hero,
    mediaType,
    wordCount: words,
    sourceCount,
    mediaCount: media.length,
    moduleCount: modules,
    tableCount: tables,
    issueCount: issues.length,
    errorCount: issues.filter((item) => item.severity === "error").length,
    warningCount: issues.filter((item) => item.severity !== "error").length,
    issues,
  };
}

function duplicateHeroIssues(stories) {
  const groups = new Map();
  stories.forEach((story) => {
    const image = normalizedUrl(heroImage(story));
    if (!image) return;
    if (!groups.has(image)) groups.set(image, []);
    groups.get(image).push(story);
  });

  const issues = [];
  groups.forEach((group, image) => {
    if (group.length < 2) return;
    group.forEach((story) => {
      issues.push(issue(story, "warning", "duplicate_hero_image", "Hero image is reused by multiple stories; confirm related articles do not look duplicated.", {
        heroImage: image,
        duplicateStoryIds: group.map((item) => item.id),
      }));
    });
  });
  return issues;
}

function duplicateInlineMediaIssues(stories) {
  const issues = [];
  stories.forEach((story) => {
    const counts = new Map();
    mediaItems(story).forEach((item) => {
      const url = normalizedUrl(mediaImageUrl(item));
      if (!url || /youtube\.com|youtu\.be/.test(url)) return;
      counts.set(url, (counts.get(url) || 0) + 1);
    });
    counts.forEach((count, url) => {
      if (count > 1) issues.push(issue(story, "warning", "duplicate_inline_media", "Same image appears multiple times inside one article.", { imageUrl: url, count }));
    });
  });
  return issues;
}

function writeMarkdown(report) {
  const lines = [
    "# GCX Article Visual Quality Audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Articles audited: ${report.articleCount}`,
    `Status: ${report.ok ? "pass" : "needs attention"}`,
    `Errors: ${report.errorCount}`,
    `Warnings: ${report.warningCount}`,
    "",
    "## What This Checks",
    "",
    "- Raw or flattened Markdown tables that can show ugly pipe text.",
    "- Missing, reused, or unsafe hero images.",
    "- Gaming stories using graphics instead of official screenshots/key art.",
    "- Long wall-of-text blocks and long-form pacing risks.",
    "- Table structures likely to be cramped or messy on mobile.",
    "",
    "## Highest Priority Issues",
    "",
  ];

  const priority = report.issues.slice(0, 30);
  if (!priority.length) {
    lines.push("- No article visual quality issues found.");
  } else {
    priority.forEach((item) => {
      lines.push(`- [${item.severity.toUpperCase()}] ${item.title}: ${item.message} (${item.code})`);
    });
  }

  lines.push("", "## Article Summary", "");
  lines.push("| Article | Errors | Warnings | Words | Media | Modules | Tables |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  report.articles.forEach((article) => {
    lines.push(
      `| ${String(article.title || "").replace(/\|/g, "\\|")} | ${article.errorCount} | ${article.warningCount} | ${article.wordCount} | ${article.mediaCount} | ${article.moduleCount} | ${article.tableCount} |`
    );
  });

  fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const stories = readJson(newsroomPath).filter((story) => story?.id);
  const articles = stories.map(auditStory);
  const crossStoryIssues = [...duplicateHeroIssues(stories), ...duplicateInlineMediaIssues(stories)];
  const storyIssues = articles.flatMap((article) => article.issues);
  const issues = [...storyIssues, ...crossStoryIssues].sort((a, b) => {
    const severityScore = { error: 2, warning: 1 };
    return (severityScore[b.severity] || 0) - (severityScore[a.severity] || 0);
  });

  const report = {
    ok: issues.every((item) => item.severity !== "error"),
    generatedAt: new Date().toISOString(),
    articleCount: stories.length,
    errorCount: issues.filter((item) => item.severity === "error").length,
    warningCount: issues.filter((item) => item.severity !== "error").length,
    issueCount: issues.length,
    articles: articles.map(({ issues: _issues, ...article }) => ({
      ...article,
      issueCount: _issues.length + crossStoryIssues.filter((item) => item.storyId === article.id).length,
    })),
    issues,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  writeJson(jsonPath, report);
  writeMarkdown(report);
  console.log(JSON.stringify({
    ok: report.ok,
    articleCount: report.articleCount,
    errorCount: report.errorCount,
    warningCount: report.warningCount,
    markdownPath: path.relative(rootDir, markdownPath),
  }, null, 2));

  if (!report.ok) process.exitCode = 1;
}

main();
