const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const cssPath = path.join(rootDir, "styles.css");
const source = fs.readFileSync(cssPath, "utf8");

function lineForIndex(index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function maxClampRem(value) {
  const clampMatch = String(value || "").match(/clamp\(([^)]*)\)/i);
  if (!clampMatch) {
    const direct = String(value || "").match(/([\d.]+)rem/i);
    return direct ? Number(direct[1]) : 0;
  }
  const remValues = [...clampMatch[1].matchAll(/([\d.]+)rem/gi)].map((match) => Number(match[1]));
  return remValues.length ? Math.max(...remValues) : 0;
}

function numericLineHeight(value) {
  const normalized = String(value || "").trim();
  if (!/^[\d.]+$/.test(normalized)) return null;
  return Number(normalized);
}

function declarationsFor(body) {
  const declarations = {};
  body.split(";").forEach((part) => {
    const separator = part.indexOf(":");
    if (separator === -1) return;
    const property = part.slice(0, separator).trim().toLowerCase();
    const value = part.slice(separator + 1).trim();
    if (property) declarations[property] = value;
  });
  return declarations;
}

const displayHeadingSelectorPattern = /\bh1\b|hero|feature-hero|console-detail-copy|card-page-copy|post-detail-card|sponsor-hero/i;
const failures = [];

const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
let match;
while ((match = rulePattern.exec(source))) {
  const selector = match[1].trim();
  if (!displayHeadingSelectorPattern.test(selector)) continue;

  const declarations = declarationsFor(match[2]);
  const maxRem = maxClampRem(declarations["font-size"]);
  const lineHeight = numericLineHeight(declarations["line-height"]);
  const isLargeDisplayHeading = maxRem >= 3.5 || /\bh1\b/.test(selector);

  if (isLargeDisplayHeading && lineHeight !== null && lineHeight < 1.08) {
    failures.push({
      selector,
      line: lineForIndex(match.index),
      fontSize: declarations["font-size"] || "",
      lineHeight: declarations["line-height"],
      detail: "Large display headings need breathing room so wrapped lines cannot collide.",
    });
  }
}

const report = {
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  checkedFile: path.relative(rootDir, cssPath).replace(/\\/g, "/"),
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
