const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const outputPath = path.join(rootDir, "data", "launch-readiness", "editorial-credibility.json");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");

const policyChecks = [
  {
    file: "docs/editorial-corrections-policy.md",
    required: [
      "GCX Editorial Corrections And Updates Policy",
      "Official information",
      "Verified reporting",
      "Reported or unofficial information",
      "Rumors, leaks, and unverified claims",
      "Presale asking prices",
      "source count",
      "last reviewed or last updated",
      "update policy",
      "Material corrections",
      "Reader Feedback",
    ],
  },
  {
    file: "article.js",
    required: [
      "Last updated",
      "sourceCount",
      "View source links",
      "Corrections policy",
      "Sources Used",
      "article:modified_time",
      "NewsArticle",
    ],
  },
  {
    file: "trust.html",
    required: ["Presale pricing is never described as settled market value", "Corrections and update policy"],
  },
];

const requiredStoryFields = [
  "id",
  "title",
  "excerpt",
  "body",
  "publishedAt",
  "lastReviewedAt",
  "lastUpdated",
  "editorialOwner",
  "claimStatus",
  "updatePolicy",
  "editorialStatus",
  "sourceLinks",
];

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").toLowerCase();
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempPath, filePath);
}

function validDate(value) {
  return Boolean(value && !Number.isNaN(new Date(value).getTime()));
}

function auditPolicyFiles() {
  const failures = [];
  const checkedFiles = [];
  for (const check of policyChecks) {
    const filePath = path.join(rootDir, check.file);
    if (!fs.existsSync(filePath)) {
      failures.push({ file: check.file, issue: "Missing file" });
      continue;
    }
    const text = fs.readFileSync(filePath, "utf8");
    const normalized = normalize(text);
    const missing = check.required.filter((phrase) => !normalized.includes(normalize(phrase)));
    missing.forEach((phrase) => failures.push({ file: check.file, issue: `Missing required phrase: ${phrase}` }));
    checkedFiles.push({ file: check.file, required: check.required.length, missing: missing.length });
  }
  return { checkedFiles, failures };
}

function auditNewsroomStories() {
  const failures = [];
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  stories.forEach((story) => {
    requiredStoryFields.forEach((field) => {
      const value = story[field];
      if (Array.isArray(value) ? value.length === 0 : !value) {
        failures.push({ storyId: story.id || "unknown", issue: `Missing ${field}` });
      }
    });
    if (!Array.isArray(story.body) || story.body.length < 2) failures.push({ storyId: story.id, issue: "Article body is too short for publication review" });
    if (!Array.isArray(story.sourceLinks) || story.sourceLinks.some((source) => !source.label || !source.url)) {
      failures.push({ storyId: story.id, issue: "Source links must include label and URL" });
    }
    if (!validDate(story.publishedAt)) failures.push({ storyId: story.id, issue: "publishedAt is not a valid date" });
    if (!validDate(story.lastReviewedAt)) failures.push({ storyId: story.id, issue: "lastReviewedAt is not a valid date" });
    if (!validDate(story.lastUpdated)) failures.push({ storyId: story.id, issue: "lastUpdated is not a valid date" });
  });
  return {
    storyCount: stories.length,
    storiesWithSources: stories.filter((story) => Array.isArray(story.sourceLinks) && story.sourceLinks.length > 0).length,
    storiesWithClaimStatus: stories.filter((story) => story.claimStatus).length,
    failures,
  };
}

function main() {
  const policy = auditPolicyFiles();
  const newsroom = auditNewsroomStories();
  const failures = [...policy.failures, ...newsroom.failures];
  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedFiles: policy.checkedFiles,
    storyCount: newsroom.storyCount,
    storiesWithSources: newsroom.storiesWithSources,
    storiesWithClaimStatus: newsroom.storiesWithClaimStatus,
    failures,
  };
  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
