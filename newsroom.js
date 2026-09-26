const sessionStorageKey = "gcx-session-token-v1";
const newsroomForm = document.querySelector("#newsroom-form");
const newsroomStatus = document.querySelector("#newsroom-status");
const opsGenerated = document.querySelector("#newsroom-ops-generated");
const opsSummary = document.querySelector("#newsroom-ops-summary");
const storyQueue = document.querySelector("#newsroom-story-queue");
const clustersPanel = document.querySelector("#newsroom-clusters");
const tasksPanel = document.querySelector("#newsroom-tasks");
const sourcesPanel = document.querySelector("#newsroom-sources-registry");
const guardrailsPanel = document.querySelector("#newsroom-guardrails");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function labelize(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function scoreBadge(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return `<span class="newsroom-pill">Unscored</span>`;
  const score = Number(value);
  const tone = score >= 90 ? "is-strong" : score >= 75 ? "is-watch" : "is-risk";
  return `<span class="newsroom-pill ${tone}">${score}</span>`;
}

function renderOpsSummary(summary = {}) {
  if (!opsSummary) return;
  const items = [
    ["Write Now", summary.writeNow || 0],
    ["Needs Update", summary.needsUpdate || 0],
    ["Watching", summary.watching || 0],
    ["Deep Research", summary.deepResearch || 0],
    ["Stale Content", summary.staleContent || 0],
    ["Clusters", summary.clusters || 0],
  ];
  opsSummary.innerHTML = items
    .map(
      ([label, value]) => `
        <article>
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </article>
      `
    )
    .join("");
}

function renderStoryQueue(items = []) {
  if (!storyQueue) return;
  storyQueue.innerHTML = items.length
    ? items
        .slice(0, 6)
        .map(
          (item) => `
            <article class="newsroom-queue-card">
              <div class="newsroom-card-top">
                ${scoreBadge(item.score)}
                <span class="newsroom-pill">${escapeHtml(labelize(item.recommendation))}</span>
                <span class="newsroom-pill ${item.cannibalizationRisk === "high" ? "is-risk" : ""}">${escapeHtml(labelize(item.cannibalizationRisk || "none"))} overlap</span>
              </div>
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.recommendedAngle || item.scoreChangeReason || "")}</p>
              <div class="newsroom-card-meta">
                <span>${escapeHtml(labelize(item.updateOrNew || "decision pending"))}</span>
                <span>${escapeHtml(item.primarySearchIntent || "No search intent")}</span>
                ${item.existingArticleUrl ? `<a href="${escapeHtml(item.existingArticleUrl)}">Existing coverage</a>` : ""}
              </div>
            </article>
          `
        )
        .join("")
    : `<div class="index-message">No story opportunities are queued yet.</div>`;
}

function renderClusters(items = []) {
  if (!clustersPanel) return;
  clustersPanel.innerHTML = items.length
    ? items
        .slice(0, 6)
        .map(
          (cluster) => `
            <article class="newsroom-queue-card">
              <div class="newsroom-card-top">
                <span class="newsroom-pill ${cluster.priority === "urgent" || cluster.priority === "high" ? "is-strong" : ""}">${escapeHtml(labelize(cluster.priority || "normal"))}</span>
                <span class="newsroom-pill">${escapeHtml(labelize(cluster.status || "emerging"))}</span>
                <span class="newsroom-pill">${escapeHtml(cluster.articleCount || 0)} articles</span>
              </div>
              <h4>${escapeHtml(cluster.name)}</h4>
              <p>${escapeHtml(cluster.notes || cluster.nextRecommendedArticle || "")}</p>
              <div class="newsroom-card-meta">
                ${cluster.hubUrl ? `<a href="${escapeHtml(cluster.hubUrl)}">Open hub</a>` : `<span>No hub assigned</span>`}
                ${cluster.nextRecommendedArticle ? `<span>Next: ${escapeHtml(cluster.nextRecommendedArticle)}</span>` : ""}
              </div>
              ${
                cluster.missingIntents?.length
                  ? `<div class="newsroom-chip-row">${cluster.missingIntents
                      .slice(0, 4)
                      .map((intent) => `<span>${escapeHtml(intent)}</span>`)
                      .join("")}</div>`
                  : ""
              }
            </article>
          `
        )
        .join("")
    : `<div class="index-message">No topic clusters are configured yet.</div>`;
}

function renderTasks(items = []) {
  if (!tasksPanel) return;
  tasksPanel.innerHTML = items.length
    ? items
        .slice(0, 8)
        .map(
          (task) => `
            <article class="newsroom-task-row">
              <div>
                <strong>${escapeHtml(labelize(task.taskType || "task"))}</strong>
                <p>${escapeHtml(task.notes || "No notes yet.")}</p>
              </div>
              <div class="newsroom-task-actions">
                <span class="newsroom-pill ${task.priority === "urgent" || task.priority === "high" ? "is-risk" : ""}">${escapeHtml(labelize(task.priority || "normal"))}</span>
                <span class="newsroom-pill">${escapeHtml(labelize(task.status || "queued"))}</span>
                ${task.relatedArticleUrl ? `<a href="${escapeHtml(task.relatedArticleUrl)}">Article</a>` : ""}
              </div>
            </article>
          `
        )
        .join("")
    : `<div class="index-message">No editorial tasks are queued.</div>`;
}

function renderSources(items = []) {
  if (!sourcesPanel) return;
  sourcesPanel.innerHTML = items.length
    ? items
        .slice(0, 8)
        .map(
          (source) => `
            <article>
              <strong>${escapeHtml(source.name)}</strong>
              <span>${escapeHtml(source.domain)} - ${escapeHtml(labelize(source.primaryOrSecondary))}</span>
              <p>${escapeHtml(source.citationPreference || source.specialWarnings || "")}</p>
            </article>
          `
        )
        .join("")
    : `<div class="index-message">No source registry entries configured.</div>`;
}

function renderGuardrails(items = []) {
  if (!guardrailsPanel) return;
  guardrailsPanel.innerHTML = items.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
}

async function loadNewsroomOps() {
  if (!opsGenerated) return;
  try {
    const response = await fetch("/api/newsroom/ops", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Newsroom operating report could not be loaded.");
    opsGenerated.textContent = `Generated ${formatDate(result.generatedAt)}`;
    renderOpsSummary(result.summary);
    renderStoryQueue(result.storyQueue);
    renderClusters(result.clusters);
    renderTasks(result.editorialTasks);
    renderSources(result.sources);
    renderGuardrails(result.guardrails);
  } catch (error) {
    opsGenerated.textContent = "Newsroom ops unavailable";
    if (opsSummary) opsSummary.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
  }
}

newsroomForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  newsroomStatus.textContent = "Publishing story...";
  const token = localStorage.getItem(sessionStorageKey) || "";
  if (!token) {
    newsroomStatus.textContent = "Log in before publishing newsroom stories.";
    return;
  }

  const data = Object.fromEntries(new FormData(newsroomForm).entries());
  try {
    const response = await fetch("/api/newsroom/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GCX-Session": token,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Story could not be published.");
    newsroomStatus.innerHTML = `Published. <a href="article.html?id=${encodeURIComponent(result.data.id)}">Open story</a>`;
    newsroomForm.reset();
  } catch (error) {
    newsroomStatus.textContent = error.message;
  }
});

loadNewsroomOps();
