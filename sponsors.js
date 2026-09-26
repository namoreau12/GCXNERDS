const sponsorForm = document.querySelector("#sponsor-lead-form");
const sponsorStatus = document.querySelector("#sponsor-form-status");
const sponsorPlacementTemplate = document.querySelector("#sponsor-placement-template");
let sponsorPlacementForm = document.querySelector("#sponsor-placement-form");
let sponsorPlacementStatus = document.querySelector("#sponsor-placement-status");
let sponsorPlacementPanel = document.querySelector(".sponsor-placement-panel");
const sponsorInventory = document.querySelector("#sponsor-inventory");
const sponsorPerformance = document.querySelector("#sponsor-performance");
const sessionStorageKey = "gcx-session-token-v1";

function authHeaders() {
  const token = localStorage.getItem(sessionStorageKey);
  return token ? { "X-GCX-Session": token } : {};
}

function referralCode() {
  return new URLSearchParams(window.location.search).get("ref") || "direct";
}

function requestedPackage() {
  return new URLSearchParams(window.location.search).get("package") || "";
}

async function revealSponsorPlacementForStaff() {
  if (!sponsorPlacementTemplate && !sponsorPlacementPanel) return;
  const token = localStorage.getItem(sessionStorageKey);
  if (!token) return;

  try {
    const response = await fetch("/api/auth/staff-status", { headers: authHeaders() });
    const result = await response.json();
    if (response.ok && result.staff) {
      if (!sponsorPlacementPanel && sponsorPlacementTemplate) {
        const fragment = sponsorPlacementTemplate.content.cloneNode(true);
        document.querySelector(".sponsor-layout")?.insertAdjacentElement("afterend", fragment.firstElementChild);
        sponsorPlacementPanel = document.querySelector(".sponsor-placement-panel");
        sponsorPlacementForm = document.querySelector("#sponsor-placement-form");
        sponsorPlacementStatus = document.querySelector("#sponsor-placement-status");
        bindSponsorPlacementForm();
      }
    }
  } catch (error) {
    if (sponsorPlacementPanel) sponsorPlacementPanel.remove();
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function preselectPackage() {
  const packageName = requestedPackage();
  const select = sponsorForm?.querySelector('[name="packageInterest"]');
  if (!packageName || !select) return;
  const matchingOption = Array.from(select.options).find((option) => option.value === packageName || option.textContent === packageName);
  if (matchingOption) select.value = matchingOption.value;
}

function renderPackageCard(item) {
  const deliverables = (item.deliverables || []).map((deliverable) => `<li>${escapeHtml(deliverable)}</li>`).join("");
  const image = item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.creatorName || item.packageName)} sponsor placement" loading="lazy" />` : "";
  return `
    <article class="sponsor-inventory-card">
      ${image}
      <div>
        <span>${escapeHtml(item.suggestedBudget || "Budget TBD")}</span>
        <h3>${escapeHtml(item.packageName)}</h3>
        ${item.creatorName ? `<p class="meta">${escapeHtml(item.creatorName)} ${item.creatorHandle ? `- ${escapeHtml(item.creatorHandle)}` : ""}</p>` : ""}
        <p>${escapeHtml(item.pitch || "A sponsor placement tied to GCX community traffic and collector intent.")}</p>
        <div class="sponsor-inventory-stats">
          ${typeof item.weeklyVotes === "number" ? `<strong>${item.weeklyVotes.toLocaleString()}<small>weekly votes</small></strong>` : ""}
          ${typeof item.trafficEvents === "number" ? `<strong>${item.trafficEvents.toLocaleString()}<small>tracked events</small></strong>` : ""}
          ${typeof item.shareCopies === "number" ? `<strong>${item.shareCopies.toLocaleString()}<small>share copies</small></strong>` : ""}
        </div>
        <ul class="check-list">${deliverables}</ul>
        <div class="streamer-actions">
          ${item.campaignUrl ? `<a class="button secondary" href="${escapeHtml(item.campaignUrl)}">View campaign</a>` : ""}
          <a class="button" href="${escapeHtml(item.sponsorUrl || "#sponsor-form")}">Sponsor this</a>
        </div>
      </div>
    </article>
  `;
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function performanceList(title, rows, emptyText) {
  return `
    <article class="sponsor-performance-card">
      <strong>${escapeHtml(title)}</strong>
      ${(rows || []).length
        ? rows
            .map(
              (row) => `
                <div>
                  <span>${escapeHtml(row.label || row.sponsorName || row.packageInterest || "Unknown")}</span>
                  <b>${number(row.count ?? row.clicks ?? row.total ?? 0)}</b>
                </div>
              `
            )
            .join("")
        : `<p>${escapeHtml(emptyText)}</p>`}
    </article>
  `;
}

function renderSponsorPerformance(data) {
  if (!sponsorPerformance) return;
  const totals = data.totals || {};
  sponsorPerformance.innerHTML = `
    <article class="sponsor-performance-card is-summary">
      <strong>${number(totals.activePromotions)}</strong>
      <span>active placements</span>
      <p>${number(totals.promotionClicks)} tracked sponsor clicks and ${number(totals.openLeads)} open sponsor leads.</p>
    </article>
    <article class="sponsor-performance-card is-summary">
      <strong>${number(totals.streamerPackageEvents)}</strong>
      <span>streamer package events</span>
      <p>${number(totals.streamerPackageVotes)} weekly creator votes attached to available spotlight inventory.</p>
    </article>
    ${performanceList("Package interest", data.byPackage, "Sponsor inquiries will appear here.")}
    ${performanceList("Placement clicks", data.topPromotions, "Promotion clicks will appear after placements are active.")}
  `;
}

async function loadSponsorInventory() {
  if (!sponsorInventory) return;
  try {
    const response = await fetch("/api/community/sponsor-packages");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Sponsor inventory could not be loaded.");
    const packages = result.data || {};
    const streamerPackages = packages.streamerPackages || [];
    sponsorInventory.innerHTML = streamerPackages.length
      ? streamerPackages.map(renderPackageCard).join("")
      : `<div class="index-message">Streamer sponsor packages will appear once creator voting is active.</div>`;
  } catch (error) {
    sponsorInventory.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
  }
}

async function loadSponsorPerformance() {
  if (!sponsorPerformance) return;
  try {
    const response = await fetch("/api/community/sponsor-performance");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Sponsor performance could not be loaded.");
    renderSponsorPerformance(result.data || {});
  } catch (error) {
    sponsorPerformance.innerHTML = `<div class="index-message">${escapeHtml(error.message)}</div>`;
  }
}

function recordSponsorPageView() {
  fetch("/api/community/traffic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "sponsor_page_view",
      source: "sponsor_page",
      targetType: "page",
      targetId: "sponsors",
      ref: referralCode(),
      path: `${window.location.pathname}${window.location.search}`,
      campaignUrl: "sponsors.html",
    }),
  }).catch(() => {
    // Sponsor tracking should never block the page.
  });
}

sponsorForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  sponsorStatus.textContent = "Submitting...";
  const formData = new FormData(sponsorForm);

  try {
    const response = await fetch("/api/community/sponsor-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        company: formData.get("company"),
        packageInterest: formData.get("packageInterest"),
        budgetRange: formData.get("budgetRange"),
        goal: formData.get("goal"),
        source: "sponsor-page",
        ref: referralCode(),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Sponsor inquiry could not be saved.");
    sponsorForm.reset();
    sponsorStatus.textContent = `Thanks, ${result.data.name}. Your sponsor inquiry was saved.`;
  } catch (error) {
    sponsorStatus.textContent = error.message;
  }
});

function bindSponsorPlacementForm() {
  if (!sponsorPlacementForm || sponsorPlacementForm.dataset.bound === "true") return;
  sponsorPlacementForm.dataset.bound = "true";
  sponsorPlacementForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    sponsorPlacementStatus.textContent = "Launching placement...";
    const formData = new FormData(sponsorPlacementForm);

    try {
      const response = await fetch("/api/community/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          sponsorName: formData.get("sponsorName"),
          title: formData.get("title"),
          body: formData.get("body"),
          imageUrl: formData.get("imageUrl"),
          destinationUrl: formData.get("destinationUrl"),
          placement: formData.get("placement"),
          packageType: formData.get("packageType"),
          ctaLabel: formData.get("ctaLabel") || "Open sponsor offer",
          priority: formData.get("priority"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sponsored placement could not be launched.");
      sponsorPlacementForm.reset();
      sponsorPlacementStatus.innerHTML = `Placement launched. <a class="feed-link" href="community.html">Open community feed</a>`;
      await loadSponsorPerformance();
    } catch (error) {
      sponsorPlacementStatus.textContent = error.message;
    }
  });
}

preselectPackage();
revealSponsorPlacementForStaff();
loadSponsorInventory();
loadSponsorPerformance();
recordSponsorPageView();
