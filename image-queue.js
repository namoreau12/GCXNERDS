const queueGenerated = document.querySelector("#queue-generated");
const queueSummary = document.querySelector("#queue-summary");
const queuePlatforms = document.querySelector("#queue-platforms");
const queueRecords = document.querySelector("#queue-records");
const queueSearch = document.querySelector("#queue-search");
const queueMode = document.querySelector("#queue-mode");
const queuePlatform = document.querySelector("#queue-platform");
const queueSort = document.querySelector("#queue-sort");
const queueLimit = document.querySelector("#queue-limit");
const queueCoveragePlan = document.querySelector("#queue-coverage-plan");
const queueProviderReadiness = document.querySelector("#queue-provider-readiness");
const queueWorkplan = document.querySelector("#queue-workplan");
const queueBatches = document.querySelector("#queue-batches");
const queueFinishableBatches = document.querySelector("#queue-finishable-batches");
const queueMilestoneBatches = document.querySelector("#queue-milestone-batches");
const queueImportReadiness = document.querySelector("#queue-import-readiness");

let queue = null;
let flatRecords = [];
let activeQueueMode = new URLSearchParams(window.location.search).get("queue") === "finishable" ? "finishable" : "full";

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function percent(value) {
  return `${Number(value || 0).toFixed(1).replace(".0", "")}%`;
}

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function compactText(values) {
  return values.flat().filter(Boolean).join(" ").toLowerCase();
}

function searchUrl(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
}

function queryFor(record) {
  return [record.title, record.platform].filter(Boolean).join(" ");
}

function linksFor(record) {
  const searches = record.providerSearches || {};
  if (Object.keys(searches).length) {
    return [
      ["MobyGames", searches.mobyGames],
      ["RAWG", searches.rawg],
      ["Wikipedia", searches.wikipedia],
      ["Images", searches.webImages],
    ].filter((item) => item[1]);
  }

  const query = queryFor(record);
  return [
    ["RAWG", searchUrl("https://rawg.io/search", { query })],
    ["MobyGames", searchUrl("https://www.mobygames.com/search/", { q: query })],
    ["Wikipedia", searchUrl("https://en.wikipedia.org/w/index.php", { search: query })],
    ["Images", searchUrl("https://www.google.com/search", { tbm: "isch", q: `${query} cover art` })],
  ];
}

async function copyRecord(record) {
  const text = [
    "Paste these values into the matching CSV row, then fill imageUrl/imageSourceUrl/imageProvider only after review.",
    "",
    `priorityRank,platformSlug,platformLabel,platformMissingImages,platformImagePct,gameId,title,platform,releaseDate,publishers,developers,source,sourceUrl,providerPriority,providerHint,rawgSearchUrl,mobyGamesSearchUrl,wikipediaSearchUrl,webImageSearchUrl,imageUrl,imageSourceUrl,imageProvider,notes,reviewStatus,reviewer`,
    [
      record.priorityRank,
      record.platformSlug,
      record.platformLabel,
      record.platformMissingImages,
      record.platformImagePct,
      record.id,
      record.title,
      record.platform,
      record.releaseDate || "",
      (record.publishers || []).join("; "),
      (record.developers || []).join("; "),
      record.source || "",
      record.sourceUrl || "",
      (record.providerPriority || []).join(" > "),
      record.providerHint || "",
      record.providerSearches?.rawg || "",
      record.providerSearches?.mobyGames || "",
      record.providerSearches?.wikipedia || "",
      record.providerSearches?.webImages || "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]
      .map(csvCell)
      .join(","),
  ].join("\n");
  await navigator.clipboard.writeText(text);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
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
  const headers = (rows.shift() || []).map((header) => header.replace(/^\uFEFF/, ""));
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function isApprovedStatus(value) {
  return ["approved", "verified", "reviewed"].includes(String(value || "").trim().toLowerCase());
}

function hasUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function batchReadiness(rows) {
  return rows.reduce(
    (summary, row) => {
      const hasImage = hasUrl(row.imageUrl);
      const hasSource = hasUrl(row.imageSourceUrl);
      const hasProvider = Boolean(String(row.imageProvider || "").trim());
      const hasReviewer = Boolean(String(row.reviewer || "").trim());
      const approved = isApprovedStatus(row.reviewStatus);
      summary.total += 1;
      if (hasImage) summary.withImageUrl += 1;
      if (approved) summary.approved += 1;
      if (hasImage && hasSource && hasProvider && approved && hasReviewer) summary.importReady += 1;
      return summary;
    },
    { total: 0, withImageUrl: 0, approved: 0, importReady: 0 }
  );
}

function renderSummary() {
  const totals = queue?.totals || {};
  queueSummary.innerHTML = `
    <article>
      <span>Platforms</span>
      <strong>${number(totals.libraries)}</strong>
    </article>
    <article>
      <span>Missing Images</span>
      <strong>${number(totals.missingImages)}</strong>
    </article>
    <article>
      <span>Queue Rows</span>
      <strong>${number(flatRecords.length)}</strong>
    </article>
    <article>
      <span>Queue Mode</span>
      <strong>${activeQueueMode === "finishable" ? "Closest" : "Full"}</strong>
    </article>
    <article>
      <span>First Platform</span>
      <strong>${escapeHtml(queue?.platforms?.[0]?.label || "None")}</strong>
    </article>
    <article>
      <span>Generated</span>
      <strong>${escapeHtml(formatDate(queue?.generatedAt))}</strong>
    </article>
  `;
}

function renderPlatformOptions() {
  queuePlatform.innerHTML = `<option value="all">All platforms</option>`;
  (queue?.platforms || []).forEach((platform) => {
    const option = document.createElement("option");
    option.value = platform.slug;
    option.textContent = `${platform.label} (${number(platform.missingImages)})`;
    queuePlatform.append(option);
  });
}

function renderCoveragePlan(plan) {
  if (!queueCoveragePlan) return;
  const milestones = (plan?.milestones || []).filter((milestone) => !milestone.targetMet);
  if (!milestones.length) {
    queueCoveragePlan.innerHTML = "";
    queueCoveragePlan.hidden = true;
    return;
  }

  const nextMilestone = milestones[0];
  const firstPlatforms = (nextMilestone.platformPlan || []).slice(0, 4);
  queueCoveragePlan.hidden = false;
  queueCoveragePlan.innerHTML = `
    <article class="queue-milestone-card">
      <div>
        <span>Next Coverage Milestone</span>
        <strong>${number(nextMilestone.additionalImagesNeeded)} reviewed images to ${percent(nextMilestone.targetPct)}</strong>
        <p>Current game image coverage is ${percent(plan.totals?.imagePct)} across ${number(plan.totals?.totalGames)} game records. Import only reviewed rows with image URL, source URL, provider, status, and reviewer.</p>
      </div>
      <div class="queue-milestone-steps">
        ${firstPlatforms
          .map(
            (item) => `
              <button type="button" data-platform="${escapeHtml(item.platform)}">
                <span>${escapeHtml(item.platform)}</span>
                <em>${number(item.reviewedImages)} rows</em>
              </button>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderWorkplan(workplan) {
  if (!queueWorkplan) return;
  const totals = workplan?.totals || {};
  const nextFinishable = workplan?.nextFinishable;
  const nextMilestone = workplan?.nextMilestone;
  const rules = (workplan?.rules || []).slice(0, 3);
  const readyRows = Number(totals.readyRows || 0);
  const finishableCount = Number(totals.finishableRecordCount || 0);
  const target = nextFinishable || nextMilestone;
  if (!target) {
    queueWorkplan.hidden = true;
    queueWorkplan.innerHTML = "";
    return;
  }

  queueWorkplan.hidden = false;
  queueWorkplan.innerHTML = `
    <article class="queue-workplan-card">
      <div class="queue-workplan-copy">
        <span>Next Safe Action</span>
        <strong>${
          nextFinishable
            ? `Review ${number(nextFinishable.records)} ${escapeHtml(nextFinishable.platformLabel)} image rows`
            : `Review ${number(nextMilestone.records)} rows for ${percent(nextMilestone.targetPct)} coverage`
        }</strong>
        <p>${escapeHtml(workplan.recommendedNextStep || "Review direct image URLs before importing any rows.")}</p>
      </div>
      <div class="queue-workplan-stats" aria-label="Image review workplan status">
        <div>
          <span>Ready Now</span>
          <strong>${number(readyRows)}</strong>
          <em>reviewed rows</em>
        </div>
        <div>
          <span>Finishable</span>
          <strong>${number(finishableCount)}</strong>
          <em>near-complete rows</em>
        </div>
        <div>
          <span>Coverage</span>
          <strong>${percent(totals.imagePct)}</strong>
          <em>${number(totals.missingImages)} missing</em>
        </div>
      </div>
      <div class="queue-workplan-actions">
        <a href="${escapeHtml(target.batchPath || "data/games/finishable-image-queue.csv")}">Open review batch</a>
        ${target.dryRun ? `<code>${escapeHtml(target.dryRun)}</code>` : ""}
        ${target.import ? `<code>${escapeHtml(target.import)}</code>` : ""}
        ${
          nextFinishable && nextMilestone
            ? `<a href="${escapeHtml(nextMilestone.batchPath)}">
                <span>90% coverage milestone</span>
                <em>${number(nextMilestone.records)} rows / ${escapeHtml((nextMilestone.platforms || []).join(", "))}</em>
              </a>
              <code>${escapeHtml(nextMilestone.dryRun || "")}</code>`
            : ""
        }
      </div>
      ${
        rules.length
          ? `<ul class="queue-workplan-rules">${rules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ul>`
          : ""
      }
    </article>
  `;
}

function providerStatusLabel(status) {
  if (status === "active") return "Active";
  if (status === "missing-key") return "Needs Key";
  if (status === "not-enabled") return "Not Enabled";
  return "Review";
}

function commercialFitLabel(value) {
  if (value === "best-candidate") return "Best candidate";
  if (value === "good") return "Good fit";
  if (value === "review-required") return "Review terms";
  if (value === "poor-for-marketplace") return "Avoid for launch";
  return value || "Unrated";
}

function renderProviderReadiness(report) {
  if (!queueProviderReadiness) return;
  const providers = report?.providers || [];
  if (!providers.length) {
    queueProviderReadiness.hidden = true;
    return;
  }
  const topProviders = providers.filter((provider) => ["mobygames", "rawg", "official-store-caches", "libretro-thumbnails"].includes(provider.id));
  const nextCommands = (report.nextCommands || []).filter(Boolean);
  const manualPaths = report.manualReviewPaths || {};
  const nextMilestone = report.nextMilestone;
  const launchDecision = report.launchDecision || {};
  queueProviderReadiness.hidden = false;
  queueProviderReadiness.innerHTML = `
    <article class="queue-milestone-card queue-provider-card">
      <div>
        <span>Image Provider Readiness</span>
        <strong>${number(report.missingImages || 0)} images still need reviewed sources</strong>
        <p>${escapeHtml(report.recommendedNextAction || "Use reviewed imports only and avoid unlicensed bulk artwork.")}</p>
        ${
          launchDecision.summary
            ? `<p class="queue-provider-decision"><strong>${escapeHtml(launchDecision.label || "Provider decision")}:</strong> ${escapeHtml(launchDecision.summary)}</p>`
            : ""
        }
        ${
          nextMilestone
            ? `<p><strong>${number(nextMilestone.imagesNeeded)} images</strong> needed for ${percent(nextMilestone.targetPct)}% coverage. Start with <code>${escapeHtml(nextMilestone.batchPath || "")}</code>.</p>`
            : ""
        }
        ${
          manualPaths.firstFinishableBatch
            ? `<p>Closest library batch: <code>${escapeHtml(manualPaths.firstFinishableBatch)}</code></p>`
            : ""
        }
      </div>
      <div class="queue-provider-grid">
        ${topProviders
          .map(
            (provider) => `
              <section class="queue-provider-tile is-${escapeHtml(provider.status || "review")}">
                <span>${escapeHtml(providerStatusLabel(provider.status))}</span>
                <strong>${escapeHtml(provider.label || provider.id)}</strong>
                <em>${escapeHtml(commercialFitLabel(provider.commercialFit))}</em>
                <p>${escapeHtml(provider.notes || "")}</p>
                ${provider.validationCommand ? `<code>${escapeHtml(provider.validationCommand)}</code>` : ""}
                ${provider.nextCommand ? `<code>${escapeHtml(provider.nextCommand)}</code>` : ""}
              </section>
            `
          )
          .join("")}
      </div>
      ${
        nextCommands.length
          ? `<div class="queue-command-strip">${nextCommands.map((command) => `<code>${escapeHtml(command)}</code>`).join("")}</div>`
          : ""
      }
      ${
        (launchDecision.checklist || []).length
          ? `<ul class="queue-provider-checklist">${launchDecision.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : ""
      }
    </article>
  `;
}

function renderPlatforms() {
  queuePlatforms.innerHTML = (queue?.platforms || [])
    .slice(0, 12)
    .map((platform, index) => `
      <button class="queue-platform-card" type="button" data-platform="${escapeHtml(platform.slug)}">
        <span>#${index + 1}</span>
        <strong>${escapeHtml(platform.label)}</strong>
        <em>${number(platform.missingImages)} missing / ${percent(platform.imagePct)} covered</em>
      </button>
    `)
    .join("");
}

function renderBatchDownloads(target, index, label) {
  if (!target) return;
  const batches = (index?.batches || []).slice(0, 8);
  if (!batches.length) {
    target.hidden = true;
    return;
  }
  target.hidden = false;
  target.innerHTML = [
    `<span class="queue-downloads-label">${escapeHtml(label)}</span>`,
    ...batches.map(
      (batch) =>
        `<a href="${escapeHtml(batch.path)}">${escapeHtml(batch.platformLabel || batch.platformSlug)} <small>${number(batch.records)} rows</small></a>`
    ),
  ].join("");
}

function renderMilestoneBatchDownloads(target, index) {
  if (!target) return;
  const batches = index?.batches || [];
  if (!batches.length) {
    target.hidden = true;
    return;
  }
  target.hidden = false;
  target.innerHTML = [
    `<span class="queue-downloads-label">Milestone batches</span>`,
    ...batches.map(
      (batch) =>
        `<a href="${escapeHtml(batch.path)}">${percent(batch.targetPct)} target <small>${number(batch.records)} rows</small></a>`
    ),
  ].join("");
}

function renderImportReadiness(groups, report = null, workplan = null) {
  if (!queueImportReadiness) return;
  const batches = groups.flatMap((group) => group.batches.map((batch) => ({ ...batch, groupLabel: group.label })));
  if (!batches.length) {
    queueImportReadiness.hidden = true;
    return;
  }

  const totals = batches.reduce(
    (summary, batch) => {
      summary.rows += batch.total;
      summary.withImageUrl += batch.withImageUrl;
      summary.approved += batch.approved;
      summary.importReady += batch.importReady;
      return summary;
    },
    { rows: 0, withImageUrl: 0, approved: 0, importReady: 0 }
  );
  const topReady = batches
    .filter((batch) => batch.importReady > 0)
    .sort((a, b) => b.importReady - a.importReady || a.label.localeCompare(b.label))[0];
  const nextManual = batches
    .filter((batch) => batch.importReady === 0)
    .sort((a, b) => a.total - b.total || a.label.localeCompare(b.label))[0];
  const reportTotals = report?.totals || {};
  const providerKeys = report?.providerKeys || {};
  const readyCount = report ? Number(reportTotals.readyToImport || 0) : totals.importReady;
  const rowCount = report ? Number(reportTotals.rows || 0) : totals.rows;
  const withImageUrl = report ? Number(reportTotals.rowsWithImageUrl || 0) : totals.withImageUrl;
  const reportNextAction = report?.nextAction || "";
  const workplanNextAction = workplan?.recommendedNextStep || "";
  const workplanTarget = workplan?.nextFinishable || workplan?.nextMilestone || null;
  const milestoneTarget = workplan?.nextMilestone || null;
  const nextReviewPath = workplanTarget?.batchPath || nextManual?.path || "";

  queueImportReadiness.hidden = false;
  queueImportReadiness.innerHTML = `
    <article class="queue-import-card">
      <div>
        <span>Import Readiness</span>
        <strong>${number(readyCount)} reviewed rows ready to import</strong>
        <p>${number(rowCount)} rows scanned across review batches. ${number(withImageUrl)} include image URLs and ${number(totals.approved)} are marked approved, verified, or reviewed.</p>
        ${
          report
            ? `<p class="queue-import-status">MobyGames key: ${providerKeys.mobygames ? "configured" : "not configured"} / RAWG key: ${providerKeys.rawg ? "configured" : "not configured"}</p>`
            : ""
        }
      </div>
      <div class="queue-import-next">
        ${
          readyCount && topReady
            ? `
              <span>Next safe import</span>
              <strong>${escapeHtml(topReady.label)} / ${number(topReady.importReady)} rows</strong>
              <code>node scripts/import-game-image-urls.js ${escapeHtml(topReady.path)} --dry-run --validate-remote</code>
              <code>node scripts/import-game-image-urls.js ${escapeHtml(topReady.path)} --validate-remote</code>
            `
            : `
              <span>Next review batch</span>
              <strong>${escapeHtml(workplanTarget?.platformLabel || nextManual?.label || "No batch available")}</strong>
              <p>${escapeHtml(workplanNextAction || reportNextAction || "Fill only verified direct image URLs, source URLs, provider, review status, and reviewer. A MobyGames API key is still the best bulk path before manual review.")}</p>
              ${nextReviewPath ? `<a href="${escapeHtml(nextReviewPath)}"><span>Open next batch</span><em>${escapeHtml(nextReviewPath)}</em></a>` : ""}
              ${workplanTarget?.dryRun ? `<code>${escapeHtml(workplanTarget.dryRun)}</code>` : ""}
              ${
                milestoneTarget
                  ? `<a href="${escapeHtml(milestoneTarget.batchPath)}">
                      <span>90% milestone batch</span>
                      <em>${number(milestoneTarget.records)} reviewed images needed for ${percent(milestoneTarget.targetPct)} coverage</em>
                    </a>
                    <code>${escapeHtml(milestoneTarget.dryRun || "")}</code>`
                  : ""
              }
            `
        }
      </div>
    </article>
  `;
}

async function loadBatchIndex(path, label) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${label} returned ${response.status}`);
  const index = await response.json();
  const batchRows = await Promise.all(
    (index.batches || []).map(async (batch) => {
      const csvResponse = await fetch(batch.path, { cache: "no-store" });
      if (!csvResponse.ok) {
        return {
          label: batch.platformLabel || batch.platformSlug || `${percent(batch.targetPct)} target`,
          path: batch.path,
          total: 0,
          withImageUrl: 0,
          approved: 0,
          importReady: 0,
        };
      }
      const readiness = batchReadiness(csvObjects(await csvResponse.text()));
      return {
        label: batch.platformLabel || batch.platformSlug || `${percent(batch.targetPct)} target`,
        path: batch.path,
        ...readiness,
      };
    })
  );
  return { label, batches: batchRows };
}

function filteredRecords() {
  const term = queueSearch.value.trim().toLowerCase();
  const selectedPlatform = queuePlatform.value;
  const limit = Number(queueLimit.value || 100);
  const sort = queueSort.value;

  let records = flatRecords.filter((record) => {
    if (selectedPlatform !== "all" && record.platformSlug !== selectedPlatform) return false;
    if (!term) return true;
    return compactText([record.title, record.platform, record.publishers, record.developers, record.source, record.sourceUrl]).includes(term);
  });

  records = [...records].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "platform") return a.platformLabel.localeCompare(b.platformLabel) || a.title.localeCompare(b.title);
    return a.priorityRank - b.priorityRank || a.recordRank - b.recordRank || a.title.localeCompare(b.title);
  });

  return records.slice(0, limit);
}

function renderRecords() {
  const records = filteredRecords();
  if (!records.length) {
    queueRecords.innerHTML = `<div class="index-message">No matching image records.</div>`;
    return;
  }

  queueRecords.innerHTML = records
    .map((record) => `
      <article class="queue-record" data-record-id="${escapeHtml(record.id)}">
        <div class="queue-record-main">
          <span>${escapeHtml(record.platformLabel)} / #${record.priorityRank}</span>
          <h3>${escapeHtml(record.title)}</h3>
          <p>${escapeHtml([record.publishers?.join("; "), record.developers?.join("; "), record.releaseDate].filter(Boolean).join(" / ") || record.source || "Source pending")}</p>
          <div class="queue-provider-hints">
            ${(record.providerPriority || []).map((provider) => `<b>${escapeHtml(provider)}</b>`).join("")}
            ${record.providerHint ? `<small>${escapeHtml(record.providerHint)}</small>` : ""}
          </div>
        </div>
        <div class="queue-record-links">
          ${linksFor(record).map(([label, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`).join("")}
          ${record.sourceUrl ? `<a href="${escapeHtml(record.sourceUrl)}" target="_blank" rel="noreferrer">Source</a>` : ""}
          <button type="button" data-copy="${escapeHtml(record.id)}">Copy CSV Row</button>
        </div>
      </article>
    `)
    .join("");
}

function flattenQueue() {
  flatRecords = [];
  (queue?.platforms || []).forEach((platform, platformIndex) => {
    (platform.records || []).forEach((record, recordIndex) => {
      flatRecords.push({
        ...record,
        platformSlug: platform.slug,
        platformLabel: platform.label,
        platformMissingImages: platform.missingImages,
        platformImagePct: platform.imagePct,
        priorityRank: platformIndex + 1,
        recordRank: recordIndex + 1,
      });
    });
  });
}

function bindEvents() {
  queueMode.addEventListener("change", () => {
    activeQueueMode = queueMode.value;
    const params = new URLSearchParams(window.location.search);
    if (activeQueueMode === "finishable") params.set("queue", "finishable");
    else params.delete("queue");
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
    loadQueue();
  });

  [queueSearch, queuePlatform, queueSort, queueLimit].forEach((control) => {
    control.addEventListener("input", renderRecords);
    control.addEventListener("change", renderRecords);
  });
  queuePlatforms.addEventListener("click", (event) => {
    const button = event.target.closest("[data-platform]");
    if (!button) return;
    queuePlatform.value = button.dataset.platform;
    renderRecords();
  });
  if (queueCoveragePlan) {
    queueCoveragePlan.addEventListener("click", (event) => {
      const button = event.target.closest("[data-platform]");
      const hasPlatform = [...queuePlatform.options].some((option) => option.value === button?.dataset.platform);
      if (!button || !hasPlatform) return;
      queuePlatform.value = button.dataset.platform;
      renderRecords();
      queueRecords.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  queueRecords.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const record = flatRecords.find((item) => item.id === button.dataset.copy);
    if (!record) return;
    await copyRecord(record);
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = "Copy CSV Row";
    }, 1200);
  });
}

async function loadQueue() {
  queueSummary.innerHTML = `<div class="index-message">Loading image queue...</div>`;
  try {
    queueMode.value = activeQueueMode;
    const queuePath = activeQueueMode === "finishable" ? "data/games/finishable-image-queue.json" : "data/games/missing-image-queue.json";
    const response = await fetch(queuePath, { cache: "no-store" });
    if (!response.ok) throw new Error(`Queue returned ${response.status}`);
    queue = await response.json();
    flattenQueue();
    queueGenerated.textContent = `Generated ${formatDate(queue.generatedAt)}`;
    renderSummary();
    renderPlatformOptions();
    renderPlatforms();
    renderRecords();
  } catch (error) {
    queueGenerated.textContent = "Queue unavailable";
    queueSummary.innerHTML = `<div class="index-message">The image queue could not be loaded.</div>`;
  }
}

async function loadPriorityBatches() {
  try {
    const response = await fetch("data/games/priority-image-review-batches.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Batches returned ${response.status}`);
    renderBatchDownloads(queueBatches, await response.json(), "Priority platform batches");
  } catch (error) {
    if (queueBatches) queueBatches.hidden = true;
  }
}

async function loadFinishableBatches() {
  try {
    const response = await fetch("data/games/finishable-image-review-batches.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Batches returned ${response.status}`);
    renderBatchDownloads(queueFinishableBatches, await response.json(), "Finishable platform batches");
  } catch (error) {
    if (queueFinishableBatches) queueFinishableBatches.hidden = true;
  }
}

async function loadMilestoneBatches() {
  try {
    const response = await fetch("data/games/milestone-image-review-batches.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Milestone batches returned ${response.status}`);
    renderMilestoneBatchDownloads(queueMilestoneBatches, await response.json());
  } catch (error) {
    if (queueMilestoneBatches) queueMilestoneBatches.hidden = true;
  }
}

async function loadCoveragePlan() {
  if (!queueCoveragePlan) return;
  try {
    const response = await fetch("data/games/image-coverage-plan.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Coverage plan returned ${response.status}`);
    renderCoveragePlan(await response.json());
  } catch (error) {
    queueCoveragePlan.hidden = true;
  }
}

async function loadWorkplan() {
  if (!queueWorkplan) return;
  try {
    const response = await fetch("data/launch-readiness/game-image-review-workplan.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Image workplan returned ${response.status}`);
    renderWorkplan(await response.json());
  } catch (error) {
    queueWorkplan.hidden = true;
  }
}

async function loadProviderReadiness() {
  if (!queueProviderReadiness) return;
  try {
    const response = await fetch("data/games/image-provider-readiness.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Provider readiness returned ${response.status}`);
    renderProviderReadiness(await response.json());
  } catch (error) {
    queueProviderReadiness.hidden = true;
  }
}

async function loadImportReadiness() {
  if (!queueImportReadiness) return;
  try {
    const [groups, reportResponse, workplanResponse] = await Promise.all([
      Promise.all([
        loadBatchIndex("data/games/finishable-image-review-batches.json", "Finishable batches"),
        loadBatchIndex("data/games/priority-image-review-batches.json", "Priority batches"),
        loadBatchIndex("data/games/milestone-image-review-batches.json", "Milestone batches"),
      ]),
      fetch("data/launch-readiness/game-image-import-readiness.json", { cache: "no-store" }).catch(() => null),
      fetch("data/launch-readiness/game-image-review-workplan.json", { cache: "no-store" }).catch(() => null),
    ]);
    const report = reportResponse?.ok ? await reportResponse.json() : null;
    const workplan = workplanResponse?.ok ? await workplanResponse.json() : null;
    renderImportReadiness(groups, report, workplan);
  } catch (error) {
    try {
      const groups = await Promise.all([
      loadBatchIndex("data/games/finishable-image-review-batches.json", "Finishable batches"),
      loadBatchIndex("data/games/priority-image-review-batches.json", "Priority batches"),
      loadBatchIndex("data/games/milestone-image-review-batches.json", "Milestone batches"),
      ]);
      renderImportReadiness(groups);
    } catch {
      queueImportReadiness.hidden = true;
    }
  }
}

bindEvents();
loadWorkplan();
loadCoveragePlan();
loadProviderReadiness();
loadQueue();
loadPriorityBatches();
loadFinishableBatches();
loadMilestoneBatches();
loadImportReadiness();
