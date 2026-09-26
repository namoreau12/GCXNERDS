const healthGenerated = document.querySelector("#health-generated");
const healthSummary = document.querySelector("#health-summary");
const healthWorkflow = document.querySelector("#health-workflow");
const healthPriority = document.querySelector("#health-priority");
const healthCards = document.querySelector("#health-cards");
const healthGames = document.querySelector("#health-games");
const healthConsoles = document.querySelector("#health-consoles");
const healthProviders = document.querySelector("#health-providers");
const healthFinishable = document.querySelector("#health-finishable");
const healthSupabase = document.querySelector("#health-supabase");
const healthLaunchReadiness = document.querySelector("#health-launch-readiness");
const healthArticleReadthrough = document.querySelector("#health-article-readthrough");
const healthOfficialMediaQueue = document.querySelector("#health-official-media-queue");
const healthCardSystem = document.querySelector("#health-card-system");
const sessionStorageKey = "gcx-session-token-v1";

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

function statusLabel(status) {
  if (status === "healthy") return "Healthy";
  if (status === "needs-work") return "Needs Work";
  return "Attention";
}

function authHeaders() {
  const token = localStorage.getItem(sessionStorageKey);
  return token ? { "X-GCX-Session": token } : {};
}

function hasSessionToken() {
  return Boolean(localStorage.getItem(sessionStorageKey));
}

function recommendedPass(item) {
  if (item.kind === "cards") {
    return item.missingImages ? "Refresh card image cache from source API." : "Card cache looks ready.";
  }
  if (item.missingOverviews !== null && item.missingOverviews >= item.missingImages) {
    return "Next pass: write or import stronger game overviews.";
  }
  if (item.missingImages) {
    return "Next pass: fill box art and cover images.";
  }
  return "Next pass: spot-check quality.";
}

function progressBar(label, value) {
  const pct = Math.max(0, Math.min(100, Number(value || 0)));
  return `
    <div class="health-progress">
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${percent(pct)}</strong>
      </div>
      <span class="health-bar"><i style="width: ${pct}%"></i></span>
    </div>
  `;
}

function providerAttemptSummary(batch) {
  const attempts = batch?.recentProviderAttempts || [];
  const exhausted = attempts.filter((attempt) => String(attempt.result || "").includes("exhausted"));
  const next = batch?.providerNextRecommended || "";
  if (!exhausted.length && !next) return "";
  const tried = exhausted
    .map((attempt) => attempt.provider || attempt.script || "Provider")
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  return [
    tried ? `Already tried: ${tried}.` : "",
    next ? `Next source: ${next}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function launchGateLabel(status) {
  if (status === "pass") return "Pass";
  if (status === "warning") return "Warning";
  return "Blocker";
}

function renderLaunchReadiness(report) {
  if (!healthLaunchReadiness) return;
  if (!report) {
    healthLaunchReadiness.innerHTML = `<div class="index-message">Launch readiness report has not been generated yet.</div>`;
    return;
  }

  const blockers = report.blockers || [];
  const warnings = report.warnings || [];
  const gates = report.gates || [];
  const nextActions = report.nextActions || [];
  const statusClass = report.launchReady ? "healthy" : blockers.length ? "needs-work" : "attention";
  const statusText = report.launchReady ? "Ready" : blockers.length ? "Blocked" : "Warnings";

  healthLaunchReadiness.innerHTML = `
    <article class="health-readiness-card is-${statusClass}">
      <div>
        <span>Launch Status</span>
        <strong>${escapeHtml(statusText)}</strong>
      </div>
      <div class="health-readiness-copy">
        <p>${escapeHtml(blockers.length ? `${blockers.length} blocker${blockers.length === 1 ? "" : "s"} must be cleared before go-live.` : "No launch blockers are currently listed in the generated report.")}</p>
        <p class="health-readiness-next">Generated ${escapeHtml(formatDate(report.generatedAt))}</p>
      </div>
      <div class="health-readiness-actions">
        <code>scripts/build-launch-readiness-report.js</code>
        <span>${number(warnings.length)} warning${warnings.length === 1 ? "" : "s"}</span>
      </div>
    </article>
    <div class="launch-gate-grid">
      ${gates
        .map((gate) => `
          <article class="launch-gate-card is-${escapeHtml(gate.status)}">
            <span>${escapeHtml(launchGateLabel(gate.status))}</span>
            <strong>${escapeHtml(gate.label)}</strong>
            <p>${escapeHtml(gate.detail || "")}</p>
          </article>
        `)
        .join("")}
    </div>
    ${
      nextActions.length
        ? `<div class="launch-next-actions">
            <strong>Next actions</strong>
            <ol>${nextActions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ol>
          </div>`
        : ""
    }
  `;
}

async function loadLaunchReadiness() {
  if (!healthLaunchReadiness) return;
  try {
    const response = await fetch("/data/launch-readiness/latest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Launch readiness report returned ${response.status}`);
    renderLaunchReadiness(await response.json());
  } catch (error) {
    healthLaunchReadiness.innerHTML = `
      <article class="health-readiness-card is-attention">
        <div>
          <span>Launch Status</span>
          <strong>Unavailable</strong>
        </div>
        <p>${escapeHtml(error.message || "Run scripts/build-launch-readiness-report.js to generate a launch readiness snapshot.")}</p>
      </article>
    `;
  }
}

function renderArticleReadthrough(report) {
  if (!healthArticleReadthrough) return;
  if (!report) {
    healthArticleReadthrough.innerHTML = `<div class="index-message">Article QA report has not been generated yet.</div>`;
    return;
  }

  const articles = report.articles || [];
  const needsWork = articles.filter((article) => article.qualityStatus === "needs-editorial-pass");
  const topQueue = needsWork.slice(0, 6);
  const readyForRead = articles.filter((article) => article.qualityStatus === "ready-for-final-human-read").length;
  const structuredPass = articles.filter((article) => article.qualityStatus === "structured-qa-pass").length;

  healthArticleReadthrough.innerHTML = `
    <article class="health-readiness-card ${needsWork.length ? "is-attention" : "is-healthy"}">
      <div>
        <span>Released Articles</span>
        <strong>${number(report.releasedArticleCount)}</strong>
      </div>
      <div class="health-readiness-copy">
        <p>${
          needsWork.length
            ? `${number(needsWork.length)} article${needsWork.length === 1 ? "" : "s"} need source, media, pacing, or depth review before they should be treated as launch-polished.`
            : "All released articles passed structured editorial QA for metadata, sourcing, media depth, pacing, and visible launch issues."
        }</p>
        <p class="health-readiness-next">${
          readyForRead
            ? `${number(readyForRead)} article${readyForRead === 1 ? "" : "s"} are ready for optional final human line read.`
            : `${number(structuredPass)} article${structuredPass === 1 ? "" : "s"} are clear from automated article QA; human review can now focus on voice and taste.`
        }</p>
      </div>
      <div class="health-readiness-actions">
        <code>scripts/build-newsroom-editorial-readthrough.js</code>
        <span>Generated ${escapeHtml(formatDate(report.generatedAt))}</span>
      </div>
    </article>
    <div class="article-readthrough-list">
      ${
        topQueue.length
          ? topQueue
              .map(
                (article) => `
                  <article class="article-readthrough-card">
                    <div>
                      <span>${escapeHtml((article.reviewFocus || []).join(" / ") || article.category || article.articleType || "Article")}</span>
                      <strong><a href="${escapeHtml(article.url)}">${escapeHtml(article.title)}</a></strong>
                    </div>
                    <p>${escapeHtml(article.recommendedAction || article.topIssue || (article.issues || []).slice(0, 2).join(" "))}</p>
                    <div class="article-readthrough-meta">
                      <span>${number(article.wordCount)} words</span>
                      <span>${number(article.sourceCount)} sources</span>
                      <span>${number(article.mediaCount)} media</span>
                      <span>${number(article.priorityScore)} priority</span>
                    </div>
                  </article>
                `
              )
              .join("")
          : `<div class="index-message">No released articles currently need source, media, pacing, or depth cleanup.</div>`
      }
    </div>
  `;
}

async function loadArticleReadthrough() {
  if (!healthArticleReadthrough) return;
  try {
    const response = await fetch("/data/launch-readiness/newsroom-editorial-readthrough.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Article QA report returned ${response.status}`);
    renderArticleReadthrough(await response.json());
  } catch (error) {
    healthArticleReadthrough.innerHTML = `
      <article class="health-readiness-card is-attention">
        <div>
          <span>Article QA</span>
          <strong>Unavailable</strong>
        </div>
        <p>${escapeHtml(error.message || "Run scripts/build-newsroom-editorial-readthrough.js to generate the released article QA packet.")}</p>
      </article>
    `;
  }
}

function renderOfficialMediaQueue(report) {
  if (!healthOfficialMediaQueue) return;
  if (!report) {
    healthOfficialMediaQueue.innerHTML = `<div class="index-message">Official media queue has not been generated yet.</div>`;
    return;
  }

  const queue = report.queue || [];
  const topQueue = queue.slice(0, 6);

  healthOfficialMediaQueue.innerHTML = `
    <article class="health-readiness-card ${queue.length ? "is-attention" : "is-healthy"}">
      <div>
        <span>Media Replacements</span>
        <strong>${number(queue.length)}</strong>
      </div>
      <div class="health-readiness-copy">
        <p>${
          queue.length
            ? "These stories still use temporary fallback art. They can stay published, but should not be featured heavily until official screenshots, key art, or trailer thumbnails are assigned."
            : "No newsroom stories are currently waiting on official media replacement."
        }</p>
        <p class="health-readiness-next">${escapeHtml(report.nextStep || "")}</p>
      </div>
      <div class="health-readiness-actions">
        <code>scripts/build-newsroom-official-media-queue.js</code>
        <span>Generated ${escapeHtml(formatDate(report.generatedAt))}</span>
      </div>
    </article>
    <div class="article-readthrough-list">
      ${
        topQueue.length
          ? topQueue
              .map(
                (item) => `
                  <article class="article-readthrough-card">
                    <div>
                      <span>${escapeHtml(item.category || item.articleType || "Media")}</span>
                      <strong><a href="${escapeHtml(item.articleUrl)}">${escapeHtml(item.title)}</a></strong>
                    </div>
                    <p>${escapeHtml(item.recommendedReplacement)}</p>
                    <div class="article-readthrough-meta">
                      <span>${number(item.sourceCount)} sources</span>
                      <span>${escapeHtml(item.currentMediaType || "fallback")}</span>
                    </div>
                    <p class="media-queue-current">${escapeHtml(item.currentImage || "No current image recorded.")}</p>
                  </article>
                `
              )
              .join("")
          : `<div class="index-message">No official-media replacement work is queued.</div>`
      }
    </div>
  `;
}

async function loadOfficialMediaQueue() {
  if (!healthOfficialMediaQueue) return;
  try {
    const response = await fetch("/data/launch-readiness/newsroom-official-media-queue.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Official media queue returned ${response.status}`);
    renderOfficialMediaQueue(await response.json());
  } catch (error) {
    healthOfficialMediaQueue.innerHTML = `
      <article class="health-readiness-card is-attention">
        <div>
          <span>Media QA</span>
          <strong>Unavailable</strong>
        </div>
        <p>${escapeHtml(error.message || "Run scripts/build-newsroom-official-media-queue.js to generate the media replacement queue.")}</p>
      </article>
    `;
  }
}

function renderCardSystemHealth(report) {
  if (!healthCardSystem) return;
  if (!report) {
    healthCardSystem.innerHTML = `<div class="index-message">Card system health report has not been generated yet.</div>`;
    return;
  }

  const totals = report.totals || {};
  const franchises = Array.isArray(report.franchises)
    ? report.franchises
    : Object.entries(report.franchises || {}).map(([key, value]) => ({ key, ...value }));
  const warnings = report.warnings || [];
  const statusClass = report.ok && !Number(totals.exactDuplicateGroupCount || 0) && !Number(totals.likelyDuplicateGroupCount || 0) ? "healthy" : "needs-work";
  const warningList = warnings.length
    ? `<div class="tcg-admin-warning">${warnings.map((warning) => `<span>${escapeHtml(warning)}</span>`).join("")}</div>`
    : "";
  const franchiseRows = franchises
    .map((item) => {
      const key = item.key || item.franchise || item.slug || "";
      const displayName = item.label || (key === "pokemon" ? "Pokemon" : key === "magic" ? "Magic" : key === "yugioh" ? "Yu-Gi-Oh!" : key);
      return `
        <tr>
          <td>${escapeHtml(displayName)}</td>
          <td>${number(item.totalCards)}</td>
          <td>${number(item.missingImageCount)}</td>
          <td>${number(item.exactDuplicateGroupCount)}</td>
          <td>${number(item.likelyDuplicateGroupCount)}</td>
          <td>${number(item.variantReviewGroupCount || 0)}</td>
        </tr>
      `;
    })
    .join("");

  healthCardSystem.innerHTML = `
    <article class="health-readiness-card is-${statusClass}">
      <div>
        <span>Card Database</span>
        <strong>${report.ok ? "Guarded" : "Needs Work"}</strong>
      </div>
      <div class="health-readiness-copy">
        <p>${number(totals.totalCards)} cards audited. ${number(totals.exactDuplicateGroupCount)} exact duplicate groups and ${number(totals.likelyDuplicateGroupCount)} likely duplicate groups remain.</p>
        <p class="health-readiness-next">${number(totals.missingImageCount)} missing images and ${number(report.unresolvedManualReviewCount || totals.unresolvedManualReviewCount)} records/groups still need manual launch review.</p>
      </div>
      <div class="health-readiness-actions">
        <code>scripts/audit-card-system-health.js</code>
        <span>Generated ${escapeHtml(formatDate(report.generatedAt))}</span>
      </div>
    </article>
    ${warningList}
    <div class="health-table-wrap">
      <table class="health-table">
        <thead>
          <tr>
            <th>Library</th>
            <th>Cards</th>
            <th>Missing Images</th>
            <th>Exact Duplicates</th>
            <th>Likely Duplicates</th>
            <th>Variant Review</th>
          </tr>
        </thead>
        <tbody>${franchiseRows}</tbody>
      </table>
    </div>
  `;
}

async function loadCardSystemHealth() {
  if (!healthCardSystem) return;
  try {
    const response = await fetch("/data/launch-readiness/card-system-health.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Card system report returned ${response.status}`);
    renderCardSystemHealth(await response.json());
  } catch (error) {
    healthCardSystem.innerHTML = `
      <article class="health-readiness-card is-attention">
        <div>
          <span>Card QA</span>
          <strong>Unavailable</strong>
        </div>
        <p>${escapeHtml(error.message || "Run scripts/audit-card-system-health.js to generate the card system health report.")}</p>
      </article>
    `;
  }
}

function renderSummary(totals) {
  healthSummary.innerHTML = `
    <article>
      <span>Libraries</span>
      <strong>${number(totals.libraryCount)}</strong>
    </article>
    <article>
      <span>Total Records</span>
      <strong>${number(totals.records)}</strong>
    </article>
    <article>
      <span>Image Coverage</span>
      <strong>${percent(totals.imagePct)}</strong>
    </article>
    <article>
      <span>Overview Coverage</span>
      <strong>${percent(totals.overviewPct)}</strong>
    </article>
    <article>
      <span>Needs Work</span>
      <strong>${number(totals.needsWork)}</strong>
    </article>
  `;
}

function renderSupabaseReadiness(report) {
  if (!healthSupabase) return;
  if (!report) {
    healthSupabase.innerHTML = `
      <article class="health-readiness-card is-attention">
        <div>
          <span>Admin Check</span>
          <strong>Sign in required</strong>
        </div>
        <p>Backend readiness is staff-only. Sign in with an admin account to confirm Supabase launch tables, RLS-ready schemas, and bridge columns.</p>
        <a class="button secondary" href="auth.html?next=data-health.html">Sign in</a>
      </article>
    `;
    return;
  }

  const tables = report.tables || [];
  const publicReads = report.publicReads || [];
  const readyCount = tables.filter((table) => table.ok).length;
  const publicReadyCount = publicReads.filter((table) => table.ok).length;
  const statusClass = report.ready ? "healthy" : report.configured ? "needs-work" : "attention";
  const statusText = report.ready ? "Ready" : report.configured ? "Tables Missing" : "Not Configured";

  healthSupabase.innerHTML = `
    <article class="health-readiness-card is-${statusClass}">
      <div>
        <span>Supabase Status</span>
        <strong>${escapeHtml(statusText)}</strong>
      </div>
      <div class="health-readiness-copy">
        <p>${
          report.ready
            ? "Launch data tables and required columns are reachable. Keep local JSON fallback until a production import has been verified."
            : "The site is safely falling back to local JSON. Apply the launch SQL in Supabase, then rerun the validator before relying on relational storage."
        }</p>
        ${report.nextStep ? `<p class="health-readiness-next">${escapeHtml(report.nextStep)}</p>` : ""}
      </div>
      <div class="health-readiness-actions">
        <code>scripts/validate-supabase-launch-data-setup.js</code>
        <span>${number(readyCount)} / ${number(tables.length)} service tables ready</span>
        ${publicReads.length ? `<span>${number(publicReadyCount)} / ${number(publicReads.length)} public reads ready</span>` : ""}
        ${report.checkedAt ? `<span>Checked ${escapeHtml(new Date(report.checkedAt).toLocaleString())}</span>` : ""}
      </div>
    </article>
    <div class="health-table-wrap">
      <table class="health-table health-supabase-table">
        <thead>
          <tr>
            <th>Table</th>
            <th>Status</th>
            <th>Required Columns</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          ${tables
            .map((table) => `
              <tr>
                <td>${escapeHtml(table.table)}</td>
                <td><span class="health-status is-${table.ok ? "healthy" : "needs-work"}">${table.ok ? "Ready" : `HTTP ${escapeHtml(table.status || "n/a")}`}</span></td>
                <td>${escapeHtml((table.requiredColumns || []).join(", ") || "Table check only")}</td>
                <td>${escapeHtml(table.detail || table.error || "")}</td>
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
    ${
      publicReads.length
        ? `
          <div class="health-table-wrap">
            <table class="health-table health-supabase-table">
              <thead>
                <tr>
                  <th>Public Read Surface</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                ${publicReads
                  .map((table) => `
                    <tr>
                      <td>${escapeHtml(table.table)}</td>
                      <td><span class="health-status is-${table.ok ? "healthy" : "needs-work"}">${table.ok ? "Ready" : `HTTP ${escapeHtml(table.status || "n/a")}`}</span></td>
                      <td>${escapeHtml(table.detail || table.error || "")}</td>
                    </tr>
                  `)
                  .join("")}
              </tbody>
            </table>
          </div>
        `
        : ""
    }
  `;
}

async function loadSupabaseReadiness() {
  if (!healthSupabase) return;
  if (!hasSessionToken()) {
    renderSupabaseReadiness(null);
    return;
  }
  try {
    const response = await fetch("/api/admin/supabase-launch-readiness", {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403) {
      renderSupabaseReadiness(null);
      return;
    }
    const report = await response.json();
    if (!response.ok) throw new Error(report.error || `Readiness check returned ${response.status}`);
    renderSupabaseReadiness(report);
  } catch (error) {
    healthSupabase.innerHTML = `
      <article class="health-readiness-card is-attention">
        <div>
          <span>Supabase Status</span>
          <strong>Unavailable</strong>
        </div>
        <p>${escapeHtml(error.message || "Backend readiness could not be checked right now.")}</p>
      </article>
    `;
  }
}

function renderWorkflow(report) {
  const totals = report.totals || {};
  const games = report.games || [];
  const imageCoveragePlan = report.imageCoveragePlan || {};
  const imageProvenance = report.imageProvenance || {};
  const imageProvenanceTotals = imageProvenance.totals || {};
  const milestoneImageReviewBatches = report.milestoneImageReviewBatches || {};
  const nextCoverageMilestone = (imageCoveragePlan.milestones || []).find((milestone) => !milestone.targetMet);
  const milestoneBatchLinks = milestoneImageReviewBatches.batches || [];
  const finishableMilestones = (imageCoveragePlan.finishablePlatforms || []).slice(0, 6);
  const imageReviewBatches = report.imageReviewBatches || {};
  const finishableImageReviewBatches = report.finishableImageReviewBatches || {};
  const overviewRewriteBatches = report.overviewRewriteBatches || {};
  const overviewQuality = report.overviewQuality || {};
  const overviewQualityTotals = overviewQuality.totals || {};
  const overviewImportFreshness = report.overviewImportFreshness || {};
  const overviewImportTotals = overviewImportFreshness.totals || {};
  const batchLinks = (imageReviewBatches.batches || []).slice(0, 8);
  const finishableBatchLinks = (finishableImageReviewBatches.batches || []).slice(0, 8);
  const overviewRewriteLinks = (overviewRewriteBatches.batches || []).slice(0, 8);
  const topImageBacklog = games
    .filter((item) => item.missingImages > 0)
    .sort((a, b) => b.missingImages - a.missingImages)
    .slice(0, 6);
  const overviewComplete = Number(totals.overviewPct || 0) >= 100 || games.every((item) => !item.missingOverviews);
  const imageBacklog = games.reduce((sum, item) => sum + Number(item.missingImages || 0), 0);
  const finishableBacklog = games
    .filter((item) => item.missingImages > 0)
    .sort((a, b) => a.missingImages - b.missingImages || b.imagePct - a.imagePct)
    .slice(0, 8)
    .reduce((sum, item) => sum + Number(item.missingImages || 0), 0);

  if (!imageBacklog && overviewComplete) {
    healthWorkflow.innerHTML = `
      <article>
        <span>Library Cleanup</span>
        <strong>Complete</strong>
        <p>Game images and overviews are fully populated in the current data-health report.</p>
      </article>
    `;
    return;
  }

  healthWorkflow.innerHTML = `
    <article>
      <span>Overview Coverage</span>
      <strong>${overviewComplete ? "Complete" : "In Progress"}</strong>
      <p>${number(totals.missingOverviews || 0)} game overviews missing basic copy.</p>
    </article>
    ${
      overviewQualityTotals.weakTemplateCount !== undefined
        ? `<article>
            <span>Overview Quality</span>
            <strong>${number(overviewQualityTotals.weakTemplateCount)} Weak</strong>
            <p>${percent(overviewQualityTotals.weakTemplatePct)} of game overviews still look template-like; ${number(overviewQualityTotals.reviewedEditorialCount || 0)} reviewed editorial overviews are recorded.</p>
          </article>`
        : ""
    }
    ${
      overviewRewriteLinks.length
        ? `<article class="health-wide-card">
            <span>Overview Rewrite Queue</span>
            <strong>${number(overviewRewriteBatches.totalRecords || 0)} Rows Staged</strong>
            <p>${number(overviewRewriteBatches.totalWeakOverviews || 0)} weak/template-style game overviews are flagged for editorial cleanup. ${number(overviewImportTotals.wouldImport || 0)} reviewed row${Number(overviewImportTotals.wouldImport || 0) === 1 ? "" : "s"} are currently import-ready; blank staged rows still need original copy, review notes, status, and reviewer before import.</p>
            <div class="health-link-list">
              <a href="overview-queue.html">
                <span>Open overview queue</span>
                <em>Search, filter, copy rows, and review import guidance</em>
              </a>
            </div>
            <div class="health-link-list">${overviewRewriteLinks
              .map(
                (batch) => `
                  <a href="${escapeHtml(batch.path)}">
                    <span>${escapeHtml(batch.platformLabel || batch.platformSlug || "Platform batch")}</span>
                    <em>${number(batch.records)} rows / ${number(batch.weakOverviewCount)} weak overviews</em>
                  </a>
                `
              )
              .join("")}</div>
          </article>`
        : ""
    }
    <article>
      <span>Image Pass</span>
      <strong>${number(imageBacklog)} Missing</strong>
      <p>Remaining image work needs a bulk catalog source after official store, Wikipedia, Wikidata, and Libretro passes were exhausted.</p>
    </article>
    ${
      imageProvenanceTotals.images !== undefined
        ? `<article>
            <span>Image Provenance</span>
            <strong>${percent(imageProvenanceTotals.providerPct)} Providers</strong>
            <p>${percent(imageProvenanceTotals.sourcePct)} source URL coverage; ${number(imageProvenanceTotals.reviewedImages || 0)} reviewed image imports recorded.</p>
          </article>`
        : ""
    }
    ${
      nextCoverageMilestone
        ? `<article class="health-wide-card">
            <span>Coverage Milestone</span>
            <strong>${number(nextCoverageMilestone.additionalImagesNeeded)} Images to ${percent(nextCoverageMilestone.targetPct)}</strong>
            <p>Current game image coverage is ${percent(imageCoveragePlan.totals?.imagePct || totals.imagePct)}. Use reviewed imports only; the prepared batches currently cover ${number(imageCoveragePlan.reviewCapacity?.totalPreparedRows || 0)} candidate rows.</p>
            ${
              (nextCoverageMilestone.platformPlan || []).length
                ? `<div class="health-link-list">${nextCoverageMilestone.platformPlan
                    .slice(0, 6)
                    .map(
                      (item) => `
                        <a href="image-queue.html">
                          <span>${escapeHtml(item.platform)}</span>
                          <em>${number(item.reviewedImages)} reviewed rows toward ${percent(nextCoverageMilestone.targetPct)}</em>
                        </a>
                      `
                    )
                    .join("")}</div>`
                : ""
            }
            ${
              milestoneBatchLinks.length
                ? `<div class="health-link-list">${milestoneBatchLinks
                    .map(
                      (batch) => `
                        <a href="${escapeHtml(batch.path)}">
                          <span>${percent(batch.targetPct)} batch</span>
                          <em>${number(batch.records)} rows / ${escapeHtml((batch.platforms || []).join(", "))}</em>
                        </a>
                      `
                    )
                    .join("")}</div>`
                : ""
            }
          </article>`
        : ""
    }
    <article>
      <span>Pipeline</span>
      <strong>One Command</strong>
      <p>Run <code>scripts/run-game-image-pipeline.js</code>; it uses safe cleanup, exact Libretro, RAWG, and MobyGames when keys exist.</p>
    </article>
    <article>
      <span>Next Runner</span>
      <strong>MobyGames</strong>
      <p>Add <code>MOBYGAMES_API_KEY</code> to <code>.env</code>; the pipeline will run cover matching in health-priority order.</p>
    </article>
    <article>
      <span>Secondary Runner</span>
      <strong>RAWG</strong>
      <p>Add <code>RAWG_API_KEY</code> to <code>.env</code> for a secondary image pass after reviewing RAWG terms and match quality.</p>
    </article>
    <article>
      <span>Bulk Import</span>
      <strong>CSV Ready</strong>
      <p>Start with <code>data/games/review-image-batch.csv</code>, then import verified rows with <code>scripts/import-game-image-urls.js</code>.</p>
    </article>
    <article class="health-wide-card">
      <span>Priority Batches</span>
      <strong>${number(imageReviewBatches.totalRecords || 0)} Rows Ready</strong>
      <p>Use platform-specific review batches for the largest image gaps. Every imported row must include source/provider, approved review status, and reviewer.</p>
      ${
        batchLinks.length
          ? `<div class="health-link-list">${batchLinks
              .map(
                (batch) => `
                  <a href="${escapeHtml(batch.path)}">
                    <span>${escapeHtml(batch.platformLabel || batch.platformSlug)}</span>
                    <em>${number(batch.records)} rows / ${number(batch.missingImages)} missing</em>
                    ${providerAttemptSummary(batch) ? `<small>${escapeHtml(providerAttemptSummary(batch))}</small>` : ""}
                  </a>
                `
              )
              .join("")}</div>`
          : ""
      }
    </article>
    <article class="health-wide-card">
      <span>Finishable Batches</span>
      <strong>${number(finishableImageReviewBatches.totalRecords || finishableBacklog)} Rows Ready</strong>
      <p>Use these to close the small image gaps on libraries nearest complete coverage before returning to the largest platform backlogs.</p>
      ${
        finishableBatchLinks.length
          ? `<div class="health-link-list">${finishableBatchLinks
              .map(
                (batch) => `
                  <a href="${escapeHtml(batch.path)}">
                    <span>${escapeHtml(batch.platformLabel || batch.platformSlug)}</span>
                    <em>${number(batch.records)} rows / ${number(batch.missingImages)} missing</em>
                    ${providerAttemptSummary(batch) ? `<small>${escapeHtml(providerAttemptSummary(batch))}</small>` : ""}
                  </a>
                `
              )
              .join("")}</div>`
          : ""
      }
    </article>
    <article>
      <span>Finishable Pack</span>
      <strong>${number(finishableBacklog)} Rows</strong>
      <p>Start manual review with <code>data/games/finishable-image-queue.csv</code> to close the libraries nearest 100% image coverage.</p>
    </article>
    ${
      finishableMilestones.length
        ? `<article class="health-wide-card">
            <span>Smallest Closable Libraries</span>
            <strong>${escapeHtml(finishableMilestones.slice(0, 3).map((item) => item.platform).join(", "))}</strong>
            <p>These are the lowest-effort libraries to push to full image coverage before returning to large platform backlogs.</p>
            <div class="health-link-list">${finishableMilestones
              .map(
                (item) => `
                  <a href="image-queue.html?queue=finishable">
                    <span>${escapeHtml(item.platform)}</span>
                    <em>${number(item.imagesToComplete)} images to complete</em>
                  </a>
                `
              )
              .join("")}</div>
          </article>`
        : ""
    }
    <article>
      <span>Workbench</span>
      <strong><a href="image-queue.html">Image Queue</a></strong>
      <p>Open the priority queue for platform filters, provider searches, source links, and copy-ready game ids.</p>
    </article>
    <article>
      <span>Review Guide</span>
      <strong><a href="docs/game-image-review-workflow.md">Image Workflow</a></strong>
      <p>Use the focused batch, validate remote images, and import only personally reviewed cover-art matches.</p>
    </article>
    <article>
      <span>Top Image Queue</span>
      <strong>${escapeHtml(topImageBacklog.map((item) => item.label).join(", ") || "None")}</strong>
      <p>${escapeHtml(topImageBacklog.map((item) => `${item.label}: ${number(item.missingImages)}`).join(" / ") || "No active image queue.")}</p>
    </article>
  `;
}

function renderFinishable(items) {
  if (!healthFinishable) return;
  const finishable = (items || [])
    .filter((item) => item.missingImages > 0)
    .sort((a, b) => a.missingImages - b.missingImages || b.imagePct - a.imagePct)
    .slice(0, 10);

  if (!finishable.length) {
    healthFinishable.innerHTML = `<div class="index-message">Every game library has image coverage in the current report.</div>`;
    return;
  }

  healthFinishable.innerHTML = finishable
    .map((item, index) => `
      <a href="${escapeHtml(item.url)}" class="health-priority-row">
        <strong>${index + 1}</strong>
        <span>${escapeHtml(item.label)}</span>
        <em>${number(item.missingImages)} images missing - ${percent(item.imagePct)} image coverage</em>
      </a>
    `)
    .join("");
}

function renderHealthCard(item) {
  const overviewMarkup = item.overviewPct === null ? "" : progressBar("Overview coverage", item.overviewPct);
  const setMarkup = item.sets === null || item.sets === undefined ? "" : `<span>${number(item.sets)} sets</span>`;
  const notes = (item.notes || []).map((note) => `<li>${escapeHtml(note)}</li>`).join("");
  const samples = (item.samples || []).length ? `<p class="health-samples">Samples: ${escapeHtml(item.samples.join(", "))}</p>` : "";

  return `
    <article class="health-card is-${escapeHtml(item.status)}">
      <div class="health-card-head">
        <div>
          <p>${escapeHtml(item.kind)}</p>
          <h3>${escapeHtml(item.label)}</h3>
        </div>
        <span>${escapeHtml(statusLabel(item.status))}</span>
      </div>
      <div class="health-meta">
        <span>${number(item.total)} records</span>
        ${setMarkup}
        <span>${number(item.missingImages)} missing images</span>
        ${item.missingOverviews === null ? "" : `<span>${number(item.missingOverviews)} missing overviews</span>`}
      </div>
      ${progressBar("Image coverage", item.imagePct)}
      ${overviewMarkup}
      <p class="health-source">${escapeHtml(item.source || "Source not recorded")}</p>
      <p class="health-source">Imported: ${escapeHtml(formatDate(item.importedAt))}</p>
      <p class="health-source"><strong>${escapeHtml(recommendedPass(item))}</strong></p>
      ${notes ? `<ul class="health-notes">${notes}</ul>` : ""}
      ${samples}
      <a class="button health-link" href="${escapeHtml(item.url)}">Open library</a>
    </article>
  `;
}

function renderPriority(items) {
  if (!items.length) {
    healthPriority.innerHTML = `<div class="index-message">No cleanup backlog detected.</div>`;
    return;
  }

  healthPriority.innerHTML = items
    .map((item, index) => `
      <a href="${escapeHtml(item.url)}" class="health-priority-row">
        <strong>${index + 1}</strong>
        <span>${escapeHtml(item.label)}</span>
        <em>${number(item.missingImages)} images missing${item.missingOverviews === null ? "" : ` / ${number(item.missingOverviews)} overviews missing`} - ${escapeHtml(recommendedPass(item))}</em>
      </a>
    `)
    .join("");
}

function renderProviderReadiness(report) {
  if (!healthProviders) return;
  const providers = report?.providers || [];
  if (!providers.length) {
    healthProviders.innerHTML = `<div class="index-message">Provider readiness has not been generated yet.</div>`;
    return;
  }

  const nextCommands = (report.nextCommands || []).filter(Boolean);
  const manualPaths = report.manualReviewPaths || {};
  const nextMilestone = report.nextMilestone;
  const launchDecision = report.launchDecision || {};
  const operationsMarkup = `
    <div class="health-provider-actions">
      ${
        launchDecision.summary
          ? `<p><strong>${escapeHtml(launchDecision.label || "Provider decision")}:</strong> ${escapeHtml(launchDecision.summary)}</p>`
          : ""
      }
      ${
        nextMilestone
          ? `<p><strong>Next milestone:</strong> ${number(nextMilestone.imagesNeeded)} reviewed images for ${percent(nextMilestone.targetPct)}% coverage via <code>${escapeHtml(nextMilestone.batchPath || "")}</code></p>`
          : `<p><strong>Next milestone:</strong> Image coverage milestones are already satisfied.</p>`
      }
      ${
        manualPaths.firstFinishableBatch
          ? `<p><strong>Smallest finishable batch:</strong> <code>${escapeHtml(manualPaths.firstFinishableBatch)}</code></p>`
          : ""
      }
      ${
        manualPaths.firstPriorityBatch
          ? `<p><strong>Largest priority batch:</strong> <code>${escapeHtml(manualPaths.firstPriorityBatch)}</code></p>`
          : ""
      }
      ${
        nextCommands.length
          ? `<div class="health-command-list">${nextCommands.map((command) => `<code>${escapeHtml(command)}</code>`).join("")}</div>`
          : ""
      }
      ${
        (launchDecision.checklist || []).length
          ? `<ul class="health-provider-checklist">${launchDecision.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : ""
      }
    </div>
  `;

  healthProviders.innerHTML = `
    <div class="health-table-wrap">
      <table class="health-table">
        <thead>
          <tr>
            <th>Provider</th>
            <th>Status</th>
            <th>Commercial Fit</th>
            <th>Needed</th>
            <th>Command</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${providers
            .map((provider) => `
              <tr>
                <td>${escapeHtml(provider.label || provider.id)}</td>
                <td><span class="health-status is-${provider.status === "active" || provider.status === "configured" ? "healthy" : "needs-work"}">${escapeHtml(provider.status)}</span></td>
                <td>${escapeHtml(provider.commercialFit || "")}</td>
                <td>${escapeHtml((provider.requiredEnv || []).join(", ") || "None")}</td>
                <td>${provider.validationCommand ? `<code>${escapeHtml(provider.validationCommand)}</code>` : "None"}</td>
                <td>${escapeHtml(provider.notes || "")}</td>
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
    <p class="health-source"><strong>${escapeHtml(report.recommendedNextAction || "")}</strong></p>
    ${report.validationCommand ? `<p class="health-source">Provider check: <code>${escapeHtml(report.validationCommand)}</code></p>` : ""}
    ${operationsMarkup}
  `;
}

function renderGameTable(items) {
  healthGames.innerHTML = `
    <div class="health-table-wrap">
      <table class="health-table">
        <thead>
          <tr>
            <th>Library</th>
            <th>Records</th>
            <th>Images</th>
            <th>Overviews</th>
            <th>Missing</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map((item) => `
              <tr>
                <td><a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a></td>
                <td>${number(item.total)}</td>
                <td>${percent(item.imagePct)}</td>
                <td>${percent(item.overviewPct)}</td>
                <td>${number(item.missingImages)} images / ${number(item.missingOverviews)} overviews</td>
                <td><span class="health-status is-${escapeHtml(item.status)}">${escapeHtml(statusLabel(item.status))}</span></td>
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function loadHealthDashboard() {
  healthSummary.innerHTML = `<div class="index-message">Loading data health...</div>`;
  try {
    const response = await fetch("/api/data-health", { cache: "no-store" });
    if (!response.ok) throw new Error(`Health API returned ${response.status}`);
    const report = await response.json();

    healthGenerated.textContent = `Generated ${formatDate(report.generatedAt)}`;
    renderSummary(report.totals);
    renderWorkflow(report);
    renderProviderReadiness(report.imageProviderReadiness);
    renderFinishable(report.games || []);
    renderPriority(report.priority || []);
    healthCards.innerHTML = (report.cards || []).map(renderHealthCard).join("");
    renderGameTable(report.games || []);
    healthConsoles.innerHTML = (report.consoles || []).map(renderHealthCard).join("");
  } catch (error) {
    healthGenerated.textContent = "Report unavailable";
    healthSummary.innerHTML = `<div class="index-message">The data health report could not be loaded right now.</div>`;
    if (healthWorkflow) {
      healthWorkflow.innerHTML = `
        <article class="health-wide-card">
          <span>Workflow</span>
          <strong>Report Unavailable</strong>
          <p>The dashboard API could not load. Rebuild the launch reports, then refresh this page to restore overview quality, image provenance, and coverage milestone guidance.</p>
        </article>
      `;
    }
  }
}

loadHealthDashboard();
loadLaunchReadiness();
loadArticleReadthrough();
loadOfficialMediaQueue();
loadCardSystemHealth();
loadSupabaseReadiness();
