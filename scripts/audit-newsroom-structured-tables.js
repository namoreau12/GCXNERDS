const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const outputPath = path.join(rootDir, "data", "launch-readiness", "newsroom-structured-tables.json");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function isMarkdownSeparatorCell(value) {
  return /^:?-{3,}:?$/.test(
    String(value || "")
      .replace(/[\u2010-\u2015\u2212]/g, "-")
      .replace(/\s+/g, "")
  );
}

function repairFlattenedMarkdownTableRows(value) {
  const source = String(value || "");
  if (!source.includes("|") || source.includes("\n")) return source;

  const text = source.replace(/\u00a0/g, " ").replace(/&#x20;|&nbsp;/gi, " ");
  const cells = text
    .slice(Math.max(0, text.indexOf("|")))
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

  let separatorStart = -1;
  let separatorEnd = -1;
  for (let index = 0; index < cells.length; index += 1) {
    if (!isMarkdownSeparatorCell(cells[index])) continue;
    let end = index;
    while (end < cells.length && isMarkdownSeparatorCell(cells[end])) end += 1;
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
  const rowCells = cells.slice(separatorEnd);
  const rows = [];
  for (let index = 0; index + columnCount <= rowCells.length; index += columnCount) {
    rows.push(rowCells.slice(index, index + columnCount));
  }

  if (!headers.length || !rows.length) return source;
  return [
    `| ${headers.join(" | ")} |`,
    `| ${separators.join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function isRawMarkdownTable(value) {
  if (typeof value !== "string" || !value.includes("|")) return false;
  const normalized = repairFlattenedMarkdownTableRows(value)
    .replace(/\u00a0/g, " ")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/\s*\|\s*\|\s*(?=(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "|\n| ")
    .replace(/\s+\|\s*\|\s*(?=(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "\n| ")
    .replace(/\s+\|\s*\|(?=\s*(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "\n| ")
    .replace(/\|\s*\|(?=\s*(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "|\n| ");
  return /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(normalized);
}

function isStructuredTable(block) {
  return Boolean(
    block &&
      typeof block === "object" &&
      block.type === "table" &&
      Array.isArray(block.headers) &&
      block.headers.length > 1 &&
      Array.isArray(block.rows) &&
      block.rows.length > 0 &&
      block.rows.every((row) => Array.isArray(row))
  );
}

function main() {
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  const failures = [];
  const structuredTables = [];

  stories.forEach((story) => {
    (story.body || []).forEach((block, blockIndex) => {
      if (isRawMarkdownTable(block)) {
        failures.push({
          storyId: story.id,
          blockIndex,
          issue: "Raw Markdown table syntax remains in newsroom data.",
        });
      }
      if (block && typeof block === "object" && block.type === "table") {
        if (isStructuredTable(block)) {
          structuredTables.push({
            storyId: story.id,
            blockIndex,
            columns: block.headers.length,
            rows: block.rows.length,
          });
        } else {
          failures.push({
            storyId: story.id,
            blockIndex,
            issue: "Structured table block is missing headers or rows.",
          });
        }
      }
    });
  });

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    storyCount: stories.length,
    structuredTableCount: structuredTables.length,
    structuredTables,
    failures,
  };

  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
