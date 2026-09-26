const overviewGenerated = document.querySelector("#overview-generated");
const overviewSummary = document.querySelector("#overview-summary");
const overviewBatches = document.querySelector("#overview-batches");
const overviewPlatforms = document.querySelector("#overview-platforms");
const overviewRecords = document.querySelector("#overview-records");
const overviewImportHealth = document.querySelector("#overview-import-health");
const overviewSearch = document.querySelector("#overview-search");
const overviewPlatform = document.querySelector("#overview-platform");
const overviewReason = document.querySelector("#overview-reason");
const overviewSort = document.querySelector("#overview-sort");
const overviewLimit = document.querySelector("#overview-limit");

let overviewIndex = null;
let overviewQuality = null;
let overviewImportFreshness = null;
let overviewImportRepairQueue = null;
let overviewRereviewPacket = null;
let overviewRereviewClassification = null;
let overviewReviewWorkplan = null;
let overviewRows = [];

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function compactText(values) {
  return values.flat().filter(Boolean).join(" ").toLowerCase();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const clean = String(text || "").replace(/^\uFEFF/, "");

  for (let index = 0; index < clean.length; index += 1) {
    const char = clean[index];
    const next = clean[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((value) => String(value).trim()));
}

function csvObjects(text) {
  const rows = parseCsv(text);
  const headers = rows.shift() || [];
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.text();
}

function renderSummary() {
  const reasons = new Set(overviewRows.map((row) => row.reason).filter(Boolean));
  const qualityTotals = overviewQuality?.totals || {};
  const freshnessTotals = overviewImportFreshness?.totals || {};
  overviewSummary.innerHTML = `
    <article>
      <span>Batches</span>
      <strong>${number(overviewIndex?.batchCount || overviewIndex?.batches?.length || 0)}</strong>
    </article>
    <article>
      <span>Rows Staged</span>
      <strong>${number(overviewRows.length)}</strong>
    </article>
    <article>
      <span>Import Ready</span>
      <strong>${number(freshnessTotals.wouldImport || 0)}</strong>
    </article>
    <article>
      <span>Weak Overviews</span>
      <strong>${number(overviewIndex?.totalWeakOverviews || 0)}</strong>
    </article>
    <article>
      <span>Reviewed</span>
      <strong>${number(qualityTotals.reviewedEditorialCount || 0)}</strong>
    </article>
    <article>
      <span>Pending Reviewed Imports</span>
      <strong>${number(freshnessTotals.wouldImport || 0)}</strong>
    </article>
    <article>
      <span>Already Applied</span>
      <strong>${number(freshnessTotals.skipped || 0)}</strong>
    </article>
    <article>
      <span>Weak Rate</span>
      <strong>${qualityTotals.weakTemplatePct === undefined ? "n/a" : `${number(qualityTotals.weakTemplatePct)}%`}</strong>
    </article>
    <article>
      <span>Reasons</span>
      <strong>${number(reasons.size)}</strong>
    </article>
    <article>
      <span>First Platform</span>
      <strong>${escapeHtml(overviewIndex?.batches?.[0]?.platformLabel || "None")}</strong>
    </article>
    <article>
      <span>Generated</span>
      <strong>${escapeHtml(formatDate(overviewIndex?.generatedAt))}</strong>
    </article>
  `;
}

function renderBatchDownloads() {
  const batches = overviewIndex?.batches || [];
  overviewBatches.innerHTML = [
    `<span class="queue-downloads-label">Overview rewrite batches</span>`,
    ...batches.map(
      (batch) =>
        `<a href="${escapeHtml(batch.path)}">${escapeHtml(batch.platformLabel || batch.platformSlug)} <small>${number(batch.records)} rows</small></a>`
    ),
  ].join("");
}

function renderPlatformOptions() {
  overviewPlatform.innerHTML = `<option value="all">All platforms</option>`;
  (overviewIndex?.batches || []).forEach((batch) => {
    const option = document.createElement("option");
    option.value = batch.platformSlug;
    option.textContent = `${batch.platformLabel || batch.platformSlug} (${number(batch.records)})`;
    overviewPlatform.append(option);
  });

  const reasons = [...new Set(overviewRows.map((row) => row.reason).filter(Boolean))].sort();
  overviewReason.innerHTML = `<option value="all">All reasons</option>`;
  reasons.forEach((reason) => {
    const option = document.createElement("option");
    option.value = reason;
    option.textContent = reason.replaceAll("-", " ");
    overviewReason.append(option);
  });
}

function renderPlatforms() {
  overviewPlatforms.innerHTML = (overviewIndex?.batches || [])
    .map((batch, index) => `
      <button class="queue-platform-card" type="button" data-platform="${escapeHtml(batch.platformSlug)}">
        <span>#${index + 1}</span>
        <strong>${escapeHtml(batch.platformLabel || batch.platformSlug)}</strong>
        <em>${number(batch.records)} staged / ${number(batch.weakOverviewCount)} flagged</em>
      </button>
    `)
    .join("");
}

function renderImportHealth() {
  if (!overviewImportHealth) return;
  const totals = overviewImportFreshness?.totals || {};
  const topRejected = overviewImportFreshness?.topRejected || [];
  const topReasons = overviewImportRepairQueue?.topReasons || [];
  const rereviewCsv = overviewRereviewPacket?.csvPath || "data/launch-readiness/overview-rereview-packet.csv";
  const classification = overviewRereviewClassification?.summary || {};
  const classificationPath = "data/launch-readiness/overview-rereview-classification.json";
  const workplan = overviewReviewWorkplan || {};
  const nextRewriteTarget = workplan.nextRewriteTarget;
  const pending = Number(totals.wouldImport || 0);
  const rejected = Number(totals.rejected || 0);
  const skipped = Number(totals.skipped || 0);
  const superseded = Number(totals.supersededReviewedRows || 0);
  const liveReviewedSuperseded = Number(classification.liveReviewedSupersededCount || 0);
  const weakLiveSafeCandidates = Number(classification.weakLiveSafeCandidateCount || 0);

  overviewImportHealth.innerHTML = `
    ${
      workplan.ok
        ? `<article class="queue-import-card">
            <div>
              <span>Overview Workplan</span>
              <strong>${number(workplan.totals?.rewriteRowCount || 0)} Priority Rows Staged</strong>
              <p>${escapeHtml(workplan.recommendedNextStep || "Rewrite only game-specific, reviewed copy and dry-run imports before changing live data.")}</p>
            </div>
            <div class="queue-import-next">
              ${
                nextRewriteTarget
                  ? `<a href="${escapeHtml(nextRewriteTarget.batchPath)}">
                      <span>Next rewrite batch: ${escapeHtml(nextRewriteTarget.platformLabel || nextRewriteTarget.platformSlug)}</span>
                      <em>${number(nextRewriteTarget.records)} rows / ${number(nextRewriteTarget.weakOverviewCount)} weak overviews</em>
                    </a>
                    <code>Dry-run: ${escapeHtml(nextRewriteTarget.dryRun || "")}</code>`
                  : ""
              }
              <a href="data/launch-readiness/game-overview-review-workplan.json">
                <span>Open workplan JSON</span>
                <em>${number(workplan.totals?.weakTemplateCount || 0)} weak/template-style overviews tracked</em>
              </a>
            </div>
          </article>`
        : ""
    }
    <article class="queue-import-card">
      <div>
        <span>Import Health</span>
        <strong>${number(pending)} Reviewed Rows Ready</strong>
        <p>${number(rejected)} old reviewed rows are rejected by the safe importer, ${number(skipped)} rows are already skipped, and ${number(superseded)} rows are superseded by reviewed live overviews. Rejected files usually need refreshed currentOverview text, stronger newOverview copy, or complete review metadata before they should be touched.</p>
      </div>
      <div class="queue-import-next">
        <span class="queue-import-status">${pending ? "Ready rows need dry-run import" : "No reviewed imports pending"}</span>
        <code>node scripts/audit-reviewed-overview-import-freshness.js</code>
        <code>node scripts/build-overview-import-repair-queue.js</code>
        <code>node scripts/import-game-overview-rewrites.js [csv] --dry-run</code>
        ${
          overviewImportRepairQueue?.csvPath
            ? `<a href="${escapeHtml(overviewImportRepairQueue.csvPath)}">
                <span>Open repair CSV</span>
                <em>${number(overviewImportRepairQueue.rejectedRows || 0)} rejected rows grouped by reason</em>
              </a>`
            : ""
        }
        ${
          overviewRereviewPacket?.rowCount
            ? `<a href="${escapeHtml(rereviewCsv)}">
                <span>Open re-review packet</span>
                <em>${number(overviewRereviewPacket.rowCount)} rows with live overview and proposed copy</em>
              </a>`
            : ""
        }
        ${
          overviewRereviewClassification?.rowCount
            ? `<a href="${escapeHtml(classificationPath)}">
                <span>Open re-review classification</span>
                <em>${number(liveReviewedSuperseded)} superseded by reviewed live copy; ${number(weakLiveSafeCandidates)} weak-live import candidates</em>
              </a>`
            : ""
        }
      </div>
    </article>
    ${
      overviewRereviewClassification?.rowCount
        ? `<article class="queue-import-card overview-rejected-card">
            <div>
              <span>Stale Row Safety</span>
              <strong>${number(liveReviewedSuperseded)} Rows Already Have Reviewed Live Copy</strong>
              <p>The stale re-review packet is not a safe force-import queue. Use it for comparison only; future import work should target weak metadata rows and rows that pass a fresh dry run.</p>
            </div>
            <div class="queue-import-next">
              <a href="${escapeHtml(classificationPath)}">
                <span>Classification report</span>
                <em>${number(weakLiveSafeCandidates)} weak-live safe candidates currently identified</em>
              </a>
              <code>node scripts/classify-overview-rereview-packet.js</code>
            </div>
          </article>`
        : ""
    }
    ${
      topReasons.length
        ? `<article class="queue-import-card overview-rejected-card">
            <div>
              <span>Repair Reasons</span>
              <strong>${number(overviewImportRepairQueue?.reasonCount || topReasons.length)} Reason Groups</strong>
              <p>The largest rejection category should be handled first. Stale currentOverview rows need human re-review before force import; short or template-like rows need stronger original copy.</p>
            </div>
            <div class="queue-import-next">
              ${topReasons
                .slice(0, 5)
                .map(
                  (item) => `
                    <a href="${escapeHtml(overviewImportRepairQueue.csvPath || "data/launch-readiness/overview-import-repair-queue.csv")}">
                      <span>${escapeHtml(item.reason)}</span>
                      <em>${number(item.count)} rows - ${escapeHtml(item.action)}</em>
                    </a>
                  `
                )
                .join("")}
            </div>
          </article>`
        : ""
    }
    ${
      topRejected.length
        ? `<article class="queue-import-card overview-rejected-card">
            <div>
              <span>Rejected Reviewed Files</span>
              <strong>${number(overviewImportFreshness?.filesWithRejectedRows || 0)} Files Need Cleanup</strong>
              <p>These are older reviewed CSVs that no longer pass the importer guardrails. Treat them as repair candidates, not safe content.</p>
            </div>
            <div class="queue-import-next">
              ${topRejected
                .slice(0, 5)
                .map(
                  (item) => `
                    <a href="${escapeHtml(item.inputPath)}">
                      <span>${escapeHtml(item.file)}</span>
                      <em>${number(item.rejected)} rejected rows</em>
                    </a>
                  `
                )
                .join("")}
            </div>
          </article>`
        : ""
    }
  `;
}

function filteredRows() {
  const term = overviewSearch.value.trim().toLowerCase();
  const selectedPlatform = overviewPlatform.value;
  const selectedReason = overviewReason.value;
  const sort = overviewSort.value;
  const limit = Number(overviewLimit.value || 100);

  let rows = overviewRows.filter((row) => {
    if (selectedPlatform !== "all" && row.platformSlug !== selectedPlatform) return false;
    if (selectedReason !== "all" && row.reason !== selectedReason) return false;
    if (!term) return true;
    return compactText([row.title, row.platform, row.currentProvider, row.reason, row.sourceUrl, row.currentOverview]).includes(term);
  });

  rows = [...rows].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "platform") return a.platformLabel.localeCompare(b.platformLabel) || a.title.localeCompare(b.title);
    if (sort === "reason") return a.reason.localeCompare(b.reason) || a.title.localeCompare(b.title);
    return Number(a.priorityRank || 0) - Number(b.priorityRank || 0) || a.title.localeCompare(b.title);
  });

  return rows.slice(0, limit);
}

function importCommandFor(row) {
  const batch = (overviewIndex?.batches || []).find((item) => item.platformSlug === row.platformSlug);
  const path = batch?.path || "data/games/overview-rewrite-batches/selected-overview-rewrite-batch.csv";
  return `node scripts/import-game-overview-rewrites.js ${path} --dry-run`;
}

async function copyRecord(row) {
  const headers = [
    "priorityRank",
    "platformSlug",
    "gameId",
    "title",
    "platform",
    "releaseDate",
    "publishers",
    "developers",
    "genres",
    "currentProvider",
    "sourceUrl",
    "reason",
    "currentOverview",
    "rewriteNotes",
    "newOverview",
    "reviewStatus",
    "reviewer",
  ];
  const text = [
    "Paste this into the matching overview CSV row. Fill newOverview, reviewStatus, and reviewer after editorial review.",
    "",
    headers.join(","),
    headers.map((header) => csvCell(row[header] || "")).join(","),
    "",
    `Dry-run command: ${importCommandFor(row)}`,
  ].join("\n");
  await navigator.clipboard.writeText(text);
}

function renderRecords() {
  const rows = filteredRows();
  if (!rows.length) {
    overviewRecords.innerHTML = `<div class="index-message">No matching overview records.</div>`;
    return;
  }

  overviewRecords.innerHTML = rows
    .map((row) => `
      <article class="queue-record overview-record" data-record-id="${escapeHtml(row.gameId)}">
        <div class="queue-record-main">
          <span>${escapeHtml(row.platformLabel)} / ${escapeHtml(row.reason || "review")}</span>
          <h3>${escapeHtml(row.title)}</h3>
          <p>${escapeHtml([row.currentProvider, row.releaseDate, row.publishers].filter(Boolean).join(" / ") || "Provider pending")}</p>
          <div class="queue-provider-hints">
            <b>${escapeHtml(row.reason || "rewrite")}</b>
            ${row.rewriteNotes ? `<small>${escapeHtml(row.rewriteNotes)}</small>` : ""}
          </div>
          <blockquote>${escapeHtml(row.currentOverview || "Current overview unavailable.")}</blockquote>
        </div>
        <div class="queue-record-links">
          ${row.sourceUrl ? `<a href="${escapeHtml(row.sourceUrl)}" target="_blank" rel="noreferrer">Source</a>` : ""}
          <a href="game.html?id=${encodeURIComponent(row.gameId)}">Game</a>
          <button type="button" data-copy="${escapeHtml(row.platformSlug)}:${escapeHtml(row.gameId)}">Copy CSV Row</button>
        </div>
      </article>
    `)
    .join("");
}

function bindEvents() {
  [overviewSearch, overviewPlatform, overviewReason, overviewSort, overviewLimit].forEach((control) => {
    control.addEventListener("input", renderRecords);
    control.addEventListener("change", renderRecords);
  });
  overviewPlatforms.addEventListener("click", (event) => {
    const button = event.target.closest("[data-platform]");
    if (!button) return;
    overviewPlatform.value = button.dataset.platform;
    renderRecords();
  });
  overviewRecords.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const [platformSlug, gameId] = button.dataset.copy.split(":");
    const row = overviewRows.find((item) => item.platformSlug === platformSlug && item.gameId === gameId);
    if (!row) return;
    await copyRecord(row);
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = "Copy CSV Row";
    }, 1200);
  });
}

async function loadOverviewQueue() {
  overviewSummary.innerHTML = `<div class="index-message">Loading overview queue...</div>`;
  try {
    const indexResponse = await fetch("data/games/overview-rewrite-batches.json", { cache: "no-store" });
    if (!indexResponse.ok) throw new Error(`Batch index returned ${indexResponse.status}`);
    overviewIndex = await indexResponse.json();
    const qualityResponse = await fetch("data/launch-readiness/game-overview-quality.json", { cache: "no-store" });
    overviewQuality = qualityResponse.ok ? await qualityResponse.json() : null;
    const freshnessResponse = await fetch("data/launch-readiness/reviewed-overview-import-freshness.json", { cache: "no-store" });
    overviewImportFreshness = freshnessResponse.ok ? await freshnessResponse.json() : null;
    const repairResponse = await fetch("data/launch-readiness/overview-import-repair-queue.json", { cache: "no-store" });
    overviewImportRepairQueue = repairResponse.ok ? await repairResponse.json() : null;
    const rereviewResponse = await fetch("data/launch-readiness/overview-rereview-packet.json", { cache: "no-store" });
    overviewRereviewPacket = rereviewResponse.ok ? await rereviewResponse.json() : null;
    const classificationResponse = await fetch("data/launch-readiness/overview-rereview-classification.json", { cache: "no-store" });
    overviewRereviewClassification = classificationResponse.ok ? await classificationResponse.json() : null;
    const workplanResponse = await fetch("data/launch-readiness/game-overview-review-workplan.json", { cache: "no-store" });
    overviewReviewWorkplan = workplanResponse.ok ? await workplanResponse.json() : null;
    overviewRows = [];

    const batches = overviewIndex.batches || [];
    for (const batch of batches) {
      const rows = csvObjects(await fetchText(batch.path));
      rows.forEach((row, index) => {
        overviewRows.push({
          ...row,
          platformLabel: batch.platformLabel || row.platform || batch.platformSlug,
          platformWeakOverviewCount: batch.weakOverviewCount,
          rowRank: index + 1,
        });
      });
    }

    overviewGenerated.textContent = `Generated ${formatDate(overviewIndex.generatedAt)}`;
    renderSummary();
    renderBatchDownloads();
    renderPlatformOptions();
    renderPlatforms();
    renderImportHealth();
    renderRecords();
  } catch (error) {
    overviewGenerated.textContent = "Queue unavailable";
    overviewSummary.innerHTML = `<div class="index-message">The overview queue could not be loaded.</div>`;
  }
}

bindEvents();
loadOverviewQueue();
