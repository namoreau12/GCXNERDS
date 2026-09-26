const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const outputPath = path.join(rootDir, "data", "launch-readiness", "newsroom-preview-text.json");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function stripMarkdownTablesForPreview(value) {
  const text = String(value || "")
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

function cleanPreviewText(value, maxLength = 260) {
  return stripMarkdownTablesForPreview(value)
    .replace(/^\s*\|.+\|\s*$/gm, " ")
    .replace(/\|?\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*(?:\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*)+\|?/g, " ")
    .replace(/\|/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "")
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function storyPreviewText(story) {
  const candidates = [story.excerpt, ...(story.body || [])].filter(Boolean);
  for (const candidate of candidates) {
    const cleaned = cleanPreviewText(candidate);
    if (cleaned) return cleaned;
  }
  return "Open the full GCX story for the latest confirmed details, context, and source links.";
}

function hasPreviewLeak(value) {
  const text = String(value || "");
  return /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(text) || /\|.+\|.+\|/.test(text) || /&#x20;|&nbsp;|\u00a0/.test(text);
}

function containsRequiredCleanup(source) {
  return [
    "function stripMarkdownTablesForPreview",
    "\\u00a0",
    "&#x20;|&nbsp;",
    "^\\s*\\|.+\\|\\s*$",
    "\\|?\\s*:?[-\\u2010-\\u2015\\u2212]{3,}:?",
  ].every((fragment) => source.includes(fragment));
}

function main() {
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  const fixtureBlocks = [
    "| July 2026 U.S. hardware measure | Result | Why it matters | | --- | ---: | --- | | Hardware unit sales |\u00a0**-39% year over year**\u00a0| Demand fell sharply | &#x20;",
    "| Product | Release Date | MSRP | Packs |\n| --- | --- | --- | --- |\n| Elite Trainer Box | Sept. 16 | **$49.99** | 9 |",
    "The key numbers are below. | Measure | Result | Why it matters | | --- | ---: | --- | | ASP | **$542** | New systems cost more |",
  ];

  const failures = [];
  const checked = [];

  [...stories, { id: "__fixture_preview_cleanup", body: fixtureBlocks }].forEach((story) => {
    const blocks = [story.excerpt, ...(story.body || [])].filter(Boolean);
    blocks.forEach((block, blockIndex) => {
      if (!String(block).includes("|") && !/&#x20;|&nbsp;|\u00a0/.test(String(block))) return;
      const cleaned = cleanPreviewText(block);
      const result = {
        storyId: story.id,
        blockIndex,
        beforeLength: String(block).length,
        afterLength: cleaned.length,
        cleanedPreview: cleaned.slice(0, 160),
      };
      checked.push(result);
      if (hasPreviewLeak(cleaned)) {
        failures.push({ ...result, issue: "Preview cleanup still leaves table markdown or encoded spaces." });
      }
    });
    const storyPreview = storyPreviewText(story);
    if (!storyPreview || hasPreviewLeak(storyPreview)) {
      failures.push({
        storyId: story.id,
        issue: "Story-level preview fallback is blank or still leaks table markdown.",
        cleanedPreview: storyPreview.slice(0, 160),
      });
    }
  });

  ["article.js", "news.js", "search.js", "script.js", "server.js"].forEach((fileName) => {
    const source = fs.readFileSync(path.join(rootDir, fileName), "utf8");
    if (!containsRequiredCleanup(source)) {
      failures.push({ fileName, issue: "Preview/plain-text cleanup is missing one or more table-safety fragments." });
    }
  });
  ["news.js", "search.js", "script.js", "server.js"].forEach((fileName) => {
    const source = fs.readFileSync(path.join(rootDir, fileName), "utf8");
    if (!source.includes("function storyPreviewText") || !source.includes("Open the full GCX story")) {
      failures.push({ fileName, issue: "Story card/search preview fallback is missing." });
    }
  });

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checkedCount: checked.length,
    checked,
    failures,
  };

  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
