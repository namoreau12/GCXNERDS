const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");

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

function splitMarkdownTableCells(line) {
  return String(line || "")
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim().replace(/\s+/g, " "));
}

function isMarkdownTableSeparatorLine(line) {
  const cells = splitMarkdownTableCells(line).map((cell) =>
    cell.replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\s+/g, "")
  );
  return cells.length > 1 && cells.every(isMarkdownTableSeparatorCell);
}

function parseMarkdownTableBlock(block) {
  const lines = repairFlattenedMarkdownTableRows(block)
    .replace(/\u00a0/g, " ")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const tableStart = lines.findIndex((line, index) => line.includes("|") && isMarkdownTableSeparatorLine(lines[index + 1] || ""));
  if (tableStart === -1) return null;

  const before = lines.slice(0, tableStart).join(" ").trim();
  const tableLines = [];
  let index = tableStart;
  while (index < lines.length && lines[index].includes("|")) {
    tableLines.push(lines[index]);
    index += 1;
  }
  const after = lines.slice(index).join(" ").trim();
  if (after) return null;

  const headers = splitMarkdownTableCells(tableLines[0]).filter(Boolean);
  const rows = tableLines
    .slice(2)
    .filter((line) => line.includes("|") && !isMarkdownTableSeparatorLine(line))
    .map(splitMarkdownTableCells)
    .map((row) => row.slice(0, headers.length));

  if (!headers.length || !rows.length) return null;
  return {
    type: "table",
    caption: before,
    headers,
    rows,
  };
}

function hasMarkdownTable(value) {
  if (typeof value !== "string" || !value.includes("|")) return false;
  const normalized = repairFlattenedMarkdownTableRows(value);
  return /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(normalized);
}

function writeJson(filePath, value) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function main() {
  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  const converted = [];

  stories.forEach((story) => {
    if (!Array.isArray(story.body)) return;
    story.body = story.body.map((block, blockIndex) => {
      if (!hasMarkdownTable(block)) return block;
      const table = parseMarkdownTableBlock(block);
      if (!table) return block;
      converted.push({ storyId: story.id, blockIndex, columns: table.headers.length, rows: table.rows.length });
      return table;
    });
  });

  if (converted.length) writeJson(newsroomPath, stories);
  console.log(JSON.stringify({ convertedCount: converted.length, converted }, null, 2));
}

main();
