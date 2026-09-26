const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const outputDir = path.join(rootDir, "data", "launch-readiness");
const jsonPath = path.join(outputDir, "newsroom-editorial-readthrough.json");
const markdownPath = path.join(outputDir, "newsroom-editorial-readthrough.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function stripMarkdown(value) {
  return String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, " ")
    .replace(/[*_#>`~|]/g, " ")
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
    return [block.title, block.caption, ...(block.headers || []), ...(block.rows || []).flat()].join(" ");
  }
  return [block.title, block.heading, block.text, block.body, block.caption, block.dek]
    .filter(Boolean)
    .join(" ");
}

function wordCount(story) {
  const text = bodyBlocks(story)
    .map(blockText)
    .map(stripMarkdown)
    .join(" ");
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function paragraphStats(story) {
  const paragraphs = bodyBlocks(story)
    .filter((block) => typeof block === "string")
    .map(stripMarkdown)
    .filter(Boolean);
  const longParagraphs = paragraphs.filter((text) => text.split(/\s+/).length > 115);
  return {
    paragraphs: paragraphs.length,
    longParagraphs: longParagraphs.length,
  };
}

function mediaItems(story) {
  const media = Array.isArray(story.media) ? story.media : [];
  const hero = story.heroImage || story.imageUrl ? [{ type: "hero", url: story.heroImage || story.imageUrl }] : [];
  const expandedMedia = media.flatMap((item) => {
    if (!item) return [];
    if (Array.isArray(item.items) && item.items.length) {
      return item.items
        .filter((galleryItem) => galleryItem?.imageUrl || galleryItem?.url || galleryItem?.src)
        .map((galleryItem) => ({ ...galleryItem, type: item.mediaType || item.type || "gallery" }));
    }
    return item.url || item.imageUrl || item.embedUrl || item.src ? [item] : [];
  });
  return [...hero, ...expandedMedia];
}

function tableCount(story) {
  return bodyBlocks(story).filter((block) => block && typeof block === "object" && block.type === "table").length;
}

function moduleCount(story) {
  return bodyBlocks(story).filter((block) => block && typeof block === "object" && block.type !== "table").length;
}

function isAnalysisGraphicStory(story) {
  const mediaType = String(story.mediaType || story.leadMediaType || story.imageType || "").toLowerCase();
  const provenance = [story.heroImageSource, story.heroImageCredit, story.imageCredit, story.articleType, story.editorialStatus, story.type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return mediaType.includes("analysis-graphic") && provenance.includes("gcx") && provenance.includes("analysis");
}

function mediaMinimumFor(story, isLongform, tables, modules) {
  if (isAnalysisGraphicStory(story) && tables + modules >= 2) return 1;
  return isLongform ? 3 : 1;
}

function issuePriority(issue) {
  if (/official images|media item|visual/i.test(issue)) return 90;
  if (/source link|sourcing/i.test(issue)) return 82;
  if (/editorial modules|tables|timelines|comparison|visual breaks/i.test(issue)) return 76;
  if (/too thin|durable article/i.test(issue)) return 70;
  if (/last updated|last reviewed|claim|confidence/i.test(issue)) return 66;
  if (/long paragraph|pacing/i.test(issue)) return 58;
  return 50;
}

function reviewActionFor(article, story) {
  const issueText = article.issues.join(" ");
  if (/editorial modules|tables|timelines|comparison|visual breaks/i.test(issueText)) {
    return "Add a timeline, comparison block, checklist, quote/source box, or other editorial module to break up long reading stretches.";
  }
  if (/Only \d+ media item|official images|screenshots|video embeds/i.test(issueText)) {
    if (/cards/i.test(article.category)) {
      return "Add approved card/product imagery or a visual checklist module, with rights notes and source links.";
    }
    return "Assign official screenshots, key art, or trailer embeds before featuring this story prominently.";
  }
  if (/source link|sourcing/i.test(issueText)) {
    return "Add or confirm primary/reputable source links and make the source list visible at the article footer.";
  }
  if (/too thin|durable article/i.test(issueText)) {
    return "Expand with context, what changed, why it matters, and what readers should watch next.";
  }
  if (/last updated|last reviewed|claim|confidence/i.test(issueText)) {
    return "Confirm article metadata, last review date, and visible claim/confidence labeling.";
  }
  if (/long paragraph|pacing/i.test(issueText)) {
    return "Split long paragraphs and add subheads or pullout context where the article slows down.";
  }
  if (story.livingArticle || /guide|tracker/i.test(`${story.articleType || ""} ${story.title || ""}`)) {
    return article.issues.length
      ? "Perform evergreen-guide read-through and confirm update policy, links, pricing language, and claims."
      : "Structured editorial QA passed; optional line edit can focus on voice, taste, and future updates.";
  }
  return article.issues.length
    ? "Perform headline, sourcing, media, and mobile readability read-through."
    : "Structured editorial QA passed; optional line edit can focus on voice, taste, and future updates.";
}

function reviewFocus(article, requiredMedia) {
  const focus = [];
  if (article.mediaCount < requiredMedia) focus.push("media depth");
  if (article.sourceCount < (article.isLongform ? 4 : 2)) focus.push("source depth");
  if (article.isLongform && article.tableCount + article.moduleCount < 2) focus.push("editorial pacing");
  if (article.wordCount < 450) focus.push("story depth");
  if (article.longParagraphCount > 2) focus.push("paragraph pacing");
  if (!focus.length) focus.push("final copy read");
  return focus;
}

function releasedStories(newsroom) {
  return newsroom.filter((story) => {
    const status = String(story.editorialStatus || story.storyLifecycleState || "").toLowerCase();
    return !/draft|archived|removed|duplicate|do-not-publish/.test(status);
  });
}

function auditStory(story) {
  const words = wordCount(story);
  const paragraphs = paragraphStats(story);
  const sources = Array.isArray(story.sourceLinks) ? story.sourceLinks.filter((source) => source?.url) : [];
  const media = mediaItems(story);
  const tables = tableCount(story);
  const modules = moduleCount(story);
  const isLongform = words >= 1100 || story.livingArticle || /guide|tracker|deep dive|analysis/i.test(`${story.articleType || ""} ${story.title || ""}`);
  const requiredMedia = mediaMinimumFor(story, isLongform, tables, modules);
  const issues = [];
  const strengths = [];

  if (!story.lastUpdated) issues.push("Missing last updated date.");
  if (!story.lastReviewedAt) issues.push("Missing last reviewed date.");
  if (!story.claimStatus && !story.confidence) issues.push("Missing visible claim/confidence label.");
  if (sources.length < (isLongform ? 4 : 2)) issues.push(`Only ${sources.length} source link(s); add more sourcing or confirm this is enough.`);
  if (media.length < requiredMedia) issues.push(`Only ${media.length} media item(s); add official images, card art, screenshots, or video embeds where rights-safe.`);
  if (isLongform && tables + modules < 2) issues.push("Long-form story needs more editorial modules, tables, timelines, comparison blocks, or visual breaks.");
  if (paragraphs.longParagraphs > 2) issues.push(`${paragraphs.longParagraphs} long paragraph(s) may need pacing breaks.`);
  if (words < 450) issues.push("Story may be too thin for a durable article URL.");

  if (story.heroImageSource || story.imageCredit || story.heroImageCredit) strengths.push("Hero/media attribution present.");
  if (sources.length >= 4) strengths.push("Strong source-link base.");
  if (media.length >= 3) strengths.push("Good media depth.");
  if (tables || modules) strengths.push("Has structured editorial modules.");
  if (story.updatePolicy || story.updateFrequency) strengths.push("Update policy present.");

  const article = {
    id: story.id,
    title: story.title,
    status: story.editorialStatus || story.storyLifecycleState || "unknown",
    articleType: story.articleType || story.type || "",
    category: story.category || "",
    topicCluster: story.topicCluster || story.canonicalTopic || "",
    url: `article.html?id=${story.id}`,
    wordCount: words,
    sourceCount: sources.length,
    mediaCount: media.length,
    tableCount: tables,
    moduleCount: modules,
    longParagraphCount: paragraphs.longParagraphs,
    isLongform,
    needsHumanReadthrough: true,
    qualityStatus: issues.length ? "needs-editorial-pass" : "structured-qa-pass",
    issues,
    strengths,
  };
  article.priorityScore = issues.length
    ? Math.max(...issues.map(issuePriority)) + Math.min(10, issues.length * 2)
    : 25;
  article.topIssue = issues.length ? issues.slice().sort((a, b) => issuePriority(b) - issuePriority(a))[0] : "Ready for final human read.";
  article.reviewFocus = reviewFocus(article, requiredMedia);
  article.recommendedAction = reviewActionFor(article, story);
  return article;
}

function topicGroups(stories) {
  const groups = new Map();
  stories.forEach((story) => {
    const key = stripMarkdown(story.topicCluster || story.canonicalTopic || story.title || "uncategorized").toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(story.id);
  });
  return Array.from(groups.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([topic, ids]) => ({ topic, ids }));
}

function writeMarkdown(report) {
  const lines = [
    "# GCX Released Article Editorial Readthrough",
    "",
    `Generated: ${report.generatedAt}`,
    `Released articles audited: ${report.releasedArticleCount}`,
    `Technical status: ${report.ok ? "pass" : "needs attention"}`,
    `Structured issue count: ${report.articlesNeedingEditorialPass}`,
    "",
    "## What This Proves",
    "",
    "- Released articles have been inventoried for metadata, source depth, media depth, structured modules, pacing risk, duplicate topic clusters, and visible launch-readiness issues.",
    "- Articles with zero structured issues are clear for launch from this automated editorial QA pass. A human line edit remains useful for voice polish, but is not treated as a launch blocker.",
    "",
    "## Priority Readthrough Queue",
    "",
    "| Article | Status | Focus | Words | Sources | Media | Next Action |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
    ...report.articles.map((article) => {
      return `| ${article.title.replace(/\|/g, "\\|")} | ${article.qualityStatus} | ${article.reviewFocus.join(", ")} | ${article.wordCount.toLocaleString()} | ${article.sourceCount} | ${article.mediaCount} | ${article.recommendedAction.replace(/\|/g, "\\|")} |`;
    }),
    "",
    "## Same Topic Clusters",
    "",
    ...(report.sameTopicClusters.length
      ? report.sameTopicClusters.map((group) => `- ${group.topic}: ${group.ids.join(", ")}`)
      : ["- No repeated topic clusters detected."]),
    "",
  ];
  fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const newsroom = readJson(newsroomPath);
  const released = releasedStories(newsroom);
  const articles = released.map(auditStory).sort((a, b) => {
    const priorityDelta = b.priorityScore - a.priorityScore;
    if (priorityDelta) return priorityDelta;
    const issueDelta = b.issues.length - a.issues.length;
    if (issueDelta) return issueDelta;
    return b.wordCount - a.wordCount;
  });
  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    releasedArticleCount: released.length,
    articlesNeedingEditorialPass: articles.filter((article) => article.issues.length).length,
    finalHumanReadthroughRemaining: articles.filter((article) => article.issues.length).length,
    automatedEditorialReadthroughStatus: articles.some((article) => article.issues.length) ? "issues-found" : "pass",
    sameTopicClusters: topicGroups(released),
    articles,
    nextStep:
      articles.some((article) => article.issues.length)
        ? "Resolve article-level issues before featuring those stories heavily on launch."
        : "Released articles are clear from the structured editorial QA pass; optional human line edits can focus on voice and taste rather than launch safety.",
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeMarkdown(report);
  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        releasedArticleCount: report.releasedArticleCount,
        articlesNeedingEditorialPass: report.articlesNeedingEditorialPass,
        finalHumanReadthroughRemaining: report.finalHumanReadthroughRemaining,
        markdownPath: path.relative(rootDir, markdownPath),
      },
      null,
      2
    )
  );
}

main();
