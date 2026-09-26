const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const reportPath = path.join(rootDir, "data", "launch-readiness", "newsroom-internal-language.json");

const patterns = [
  { id: "gcx-should", pattern: /\bGCX should\b/i },
  { id: "codex-should", pattern: /\b(?:Codex|ChatGPT) should\b/i },
  { id: "internal-notes", pattern: /\bInternal Editorial Notes\b/i },
  { id: "do-not-publish", pattern: /\bDo Not Publish\b/i },
  { id: "newsroom-score", pattern: /\bNewsroom Opportunity Score\b/i },
  { id: "recommended-hero", pattern: /\bRecommended hero image\b/i },
  { id: "source-instruction", pattern: /\bshould receive one approved visual\b/i },
];

function writeJsonAtomic(filePath, value) {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tmpPath, filePath);
}

function snippet(text, index) {
  const start = Math.max(0, index - 80);
  const end = Math.min(text.length, index + 140);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function storyList(newsroom) {
  if (Array.isArray(newsroom)) return newsroom;
  if (Array.isArray(newsroom.stories)) return newsroom.stories;
  if (Array.isArray(newsroom.articles)) return newsroom.articles;
  return [];
}

function scanValue(value, story, trail, offenders) {
  if (typeof value === "string") {
    for (const { id, pattern } of patterns) {
      const match = value.match(pattern);
      if (!match) continue;
      offenders.push({
        storyId: story.id || story.slug || "",
        title: story.title || "",
        path: trail.join("."),
        issue: id,
        snippet: snippet(value, match.index || 0),
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanValue(item, story, trail.concat(index), offenders));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => scanValue(child, story, trail.concat(key), offenders));
  }
}

function main() {
  const newsroom = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  const stories = storyList(newsroom);
  const offenders = [];

  stories.forEach((story, index) => scanValue(story, story, ["stories", index], offenders));

  const report = {
    ok: offenders.length === 0,
    generatedAt: new Date().toISOString(),
    storyCount: stories.length,
    offenderCount: offenders.length,
    offenders: offenders.slice(0, 100),
    truncatedOffenders: Math.max(0, offenders.length - 100),
  };

  writeJsonAtomic(reportPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
