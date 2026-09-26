const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const newsroomPath = path.join(rootDir, "data", "newsroom.json");
const articleScriptPath = path.join(rootDir, "article.js");
const serverScriptPath = path.join(rootDir, "server.js");
const outputPath = path.join(rootDir, "data", "launch-readiness", "newsroom-table-rendering.json");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  return repairFlattenedMarkdownTableRows(value)
    .replace(/\u00a0/g, " ")
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/\u00e2\u20ac[\u201c\u201d]/g, "-")
    .replace(/\r\n?/g, "\n")
    .replace(/\s*\|\s*\|\s*(?=(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "|\n| ")
    .replace(/\s+\|\s*\|(?=\s*(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "\n| ")
    .replace(/\|\s*\|(?=\s*(?:[:\-\u2010-\u2015\u2212]{3,}|[^|\n]+)\s*\|)/g, "|\n| ");
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

function rawMarkdownTableLeakFound(html) {
  const text = String(html || "").replace(/<table[\s\S]*?<\/table>/g, "");
  return /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(text) || /\|\s*\|\s*:?[-\u2010-\u2015\u2212]{3,}:?/.test(text);
}

function flattenedMarkdownTableFound(value) {
  const text = String(value || "").replace(/\u00a0/g, " ").replace(/&#x20;|&nbsp;/gi, " ");
  if (!text.includes("|") || text.includes("\n")) return false;
  return /\|\s*:?[-\u2010-\u2015\u2212]{3,}:?\s*\|/.test(text) || /\|\s*\|\s*:?[-\u2010-\u2015\u2212]{3,}:?/.test(text);
}

function renderPotentialTable(block) {
  const lines = markdownTableLines(block);
  const tableStart = lines.findIndex((line, index) => line.includes("|") && isMarkdownTableSeparator(lines[index + 1] || ""));
  if (tableStart === -1) {
    return { parsedAsTable: false, html: "" };
  }

  const tableLines = lines.slice(tableStart);
  const firstTableLine = tableLines[0] || "";
  const firstPipeIndex = firstTableLine.indexOf("|");
  if (firstPipeIndex > 0) tableLines[0] = firstTableLine.slice(firstPipeIndex).trim();

  if (tableLines.length < 3 || !tableLines[0].startsWith("|") || !isMarkdownTableSeparator(tableLines[1])) {
    return { parsedAsTable: false, html: "" };
  }

  const parseCells = (line) =>
    line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((cell) => cell.trim());
  const headers = parseCells(tableLines[0]);
  const rows = tableLines.slice(2).filter((line) => line.startsWith("|") && !isMarkdownTableSeparator(line)).map(parseCells);
  const html = `
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
  return { parsedAsTable: true, html, rows: rows.length, columns: headers.length };
}

function main() {
  const failures = [];
  const articleScript = fs.readFileSync(articleScriptPath, "utf8");
  const requiredRendererFragments = ["function normalizeMarkdownTableText", "function markdownTableLines", "function isMarkdownTableSeparator", "article-data-table"];
  requiredRendererFragments.forEach((fragment) => {
    if (!articleScript.includes(fragment)) {
      failures.push({ type: "renderer", issue: `article.js is missing ${fragment}` });
    }
  });
  const serverScript = fs.readFileSync(serverScriptPath, "utf8");
  ["function parseMarkdownTableBlock", "safeArticleBlock(tableBlock"].forEach((fragment) => {
    if (!serverScript.includes(fragment)) {
      failures.push({ type: "storage", issue: `server.js is missing ${fragment}` });
    }
  });

  const stories = JSON.parse(fs.readFileSync(newsroomPath, "utf8"));
  const checkedTables = [];
  const fixtureBlocks = [
    {
      storyId: "__fixture_flattened_table",
      body: [
        "| Measure | Result | Why it matters | | --- | ---: | --- | | Hardware units | **-39%** | Demand fell sharply | | Average selling price | **$542** | New systems cost more |",
      ],
    },
    {
      storyId: "__fixture_flattened_with_prose",
      body: [
        "The July snapshot was ugly. | July 2026 U.S. hardware measure | Result | Why it matters | | --- | ---: | --- | | Hardware unit sales | **-39% year over year** | Demand fell sharply against launch comparisons | | Average selling price | **$542** | The average system is no longer cheap late-cycle hardware |",
      ],
    },
    {
      storyId: "__fixture_unicode_dash_separator",
      body: [
        "| Measure | Result | Why it matters |\n| ——— | ———: | ——— |\n| Hardware units | **-39%** | Demand fell sharply |",
      ],
    },
    {
      storyId: "__fixture_prose_then_table",
      body: [
        "The key numbers are below. | Measure | Result | Why it matters | | --- | ---: | --- | | Hardware units | **-39%** | Demand fell sharply |",
      ],
    },
    {
      storyId: "__fixture_flattened_no_leading_space",
      body: [
        "| July 2026 U.S. hardware measure | Result | Why it matters || --- | ---: | --- || Hardware unit sales | **-39% year over year** | Demand fell sharply || Average selling price | **$542** | New systems cost more |",
      ],
    },
    {
      storyId: "__fixture_flattened_with_nbsp_and_chat_html_space",
      body: [
        "| July 2026 U.S. hardware measure | Result | Why it matters | | --- | ---: | --- | | Hardware unit sales |\u00a0**-39% year over year**\u00a0| Demand fell sharply | | Average selling price |\u00a0**$542**\u00a0| New systems cost more | &#x20;",
      ],
    },
    {
      storyId: "__fixture_user_reported_console_price_table",
      body: [
        "| July 2026 U.S. hardware measure | Result | Why it matters | | --- | ---: | --- | | Hardware unit sales |\u00a0**-39% year over year**\u00a0| Demand fell sharply against a tough Switch 2 launch comparison | | Average selling price |\u00a0**$542**\u00a0| The average new system is no longer behaving like cheap late-cycle hardware | | ASP change |\u00a0**+16% year over year**\u00a0| Buyers are paying more even as fewer systems sell | | Hardware spending |\u00a0**$282 million**\u00a0| Down 29%, the weakest July hardware spend since 2020 | &#x20;",
      ],
    },
    {
      storyId: "__fixture_flattened_without_double_pipe_boundaries",
      body: [
        "| Measure | Result | Why it matters | --- | ---: | --- | Hardware unit sales | **-39% year over year** | Demand fell sharply | Average selling price | **$542** | New systems cost more |",
      ],
    },
  ];

  [...stories, ...fixtureBlocks].forEach((story) => {
    (story.body || []).forEach((block, blockIndex) => {
      if (!String(block).includes("|")) return;
      if (story.id && flattenedMarkdownTableFound(block)) {
        failures.push({ type: "source", storyId: story.id, blockIndex, issue: "Newsroom source contains a flattened markdown table." });
      }
      const lines = markdownTableLines(block);
      const appearsToBeTable = lines.some((line, index) => line.includes("|") && isMarkdownTableSeparator(lines[index + 1] || ""));
      if (!appearsToBeTable) return;

      const result = renderPotentialTable(block);
      checkedTables.push({
        storyId: story.id,
        blockIndex,
        parsedAsTable: result.parsedAsTable,
        rows: result.rows || 0,
        columns: result.columns || 0,
      });

      if (!result.parsedAsTable) {
        failures.push({ type: "table", storyId: story.id, blockIndex, issue: "Markdown table block did not parse as a table." });
        return;
      }

      if (result.columns < 2) {
        failures.push({ type: "table", storyId: story.id, blockIndex, issue: "Rendered table has fewer than two columns." });
      }
      if (rawMarkdownTableLeakFound(result.html)) {
        failures.push({ type: "table", storyId: story.id, blockIndex, issue: "Rendered table still contains a Markdown separator row." });
      }
      if (!result.html.includes("<table") || !result.html.includes("<tbody>")) {
        failures.push({ type: "table", storyId: story.id, blockIndex, issue: "Rendered table markup is incomplete." });
      }
      if (!result.rows || !result.columns) {
        failures.push({ type: "table", storyId: story.id, blockIndex, issue: "Rendered table is missing rows or columns." });
      }
    });
  });

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    storyCount: stories.length,
    tableBlockCount: checkedTables.length,
    checkedTables,
    failures,
  };

  writeJson(outputPath, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
