const pspSearch = document.querySelector("#psp-search");
const publisherFilter = document.querySelector("#psp-publisher-filter");
const imageFilter = document.querySelector("#psp-image-filter");
const editorialFilter = document.querySelector("#psp-editorial-filter");
const pspGrid = document.querySelector("#psp-grid");
const pspSummary = document.querySelector("#psp-summary");
const pspAlphabet = document.querySelector("#psp-alphabet");
const pspLoadMore = document.querySelector("#psp-load-more");

let pspGames = [];
let activeLetter = "All";
let visibleLimit = 240;
const pageSize = 240;
const alphabet = ["All", "#", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function uniqueList(values) {
  return Array.from(new Set(values.flat().filter(Boolean))).sort();
}

function fillFilter(select, values, limit = 300) {
  values.filter(Boolean).slice(0, limit).forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function titleBucket(title) {
  const first = normalize(title).charAt(0);
  return first && /[a-z]/.test(first) ? first.toUpperCase() : "#";
}

function editorialStatus(game) {
  return window.GCX_GAME_COPY?.status(game) || "needs_editorial";
}

function editorialStatusLabel(status) {
  return window.GCX_GAME_COPY?.statusLabel(status) || (status === "published" ? "Published overview" : "In editorial review");
}

function pspMatches(game) {
  const query = normalize(pspSearch.value);
  const publisher = publisherFilter.value;
  const imageMode = imageFilter.value;
  const editorial = editorialFilter.value;
  return (
    (!query || normalize(game.searchText).includes(query)) &&
    (publisher === "all" || game.publishers?.includes(publisher)) &&
    (imageMode === "all" || (imageMode === "with" ? Boolean(game.imageUrl) : !game.imageUrl)) &&
    (editorial === "all" || editorialStatus(game) === editorial)
  );
}

function renderAlphabet() {
  const counts = pspGames.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});
  pspAlphabet.innerHTML = alphabet
    .map((letter) => `<button class="letter-chip${letter === activeLetter ? " is-active" : ""}" type="button" data-letter="${letter}" ${(counts[letter] || 0) ? "" : "disabled"}>${letter}<span>${counts[letter] || 0}</span></button>`)
    .join("");
}

function renderPspGames() {
  const visible = pspGames.filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter).filter(pspMatches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  pspSummary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} PSP records (${pspGames.length} total)`;
  pspLoadMore.hidden = activeLetter !== "All" || shown >= visible.length;
  if (!visible.length) {
    pspGrid.innerHTML = `<div class="index-message">No ${activeLetter} PSP games matched those filters.</div>`;
    return;
  }
  pspGrid.innerHTML = visible.slice(0, activeLetter === "All" ? visibleLimit : visible.length).map((game) => {
    const detailUrl = `psp-game.html?id=${encodeURIComponent(game.id)}`;
    const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
    const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
    const status = editorialStatus(game);
    const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PSP") || "Editorial overview in review.";
    return `
      <article class="game-db-card" data-psp-card-id="${escapeHtml(game.id)}">
        <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">${imageMarkup}</a>
        <div class="game-db-copy">
          <div class="console-card-topline"><span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span><span>PSP</span></div>
          <div class="console-tags"><span>${escapeHtml(editorialStatusLabel(status))}</span></div>
          <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
          <p>${escapeHtml(overview)}</p>
          <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
          <p>${escapeHtml(game.format || "UMD / PlayStation Store")}</p>
          <div class="console-trade"><strong>${escapeHtml(game.demandTier)}</strong><p>${escapeHtml(game.tradeNotes)}</p></div>
          <button class="button" type="button" data-psp-id="${escapeHtml(game.id)}">Join beta waitlist</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadPspGames() {
  try {
    const response = await fetch("data/games/psp.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load PSP data: ${response.status}`);
    pspGames = await response.json();
    if (!Array.isArray(pspGames)) throw new Error("PSP data was not an array.");
    fillFilter(publisherFilter, uniqueList(pspGames.map((game) => game.publishers)));
    renderAlphabet();
    renderPspGames();
  } catch (error) {
    console.error("PSP data load failed", error);
    pspSummary.textContent = "PSP data could not be loaded.";
    pspGrid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/psp.html instead.</div>`;
  }
}

[pspSearch, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderPspGames();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderPspGames();
  });
});

pspAlphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderPspGames();
});

pspLoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderPspGames();
});

pspGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-psp-id]");
  if (!button) return;
  window.location.href = `index.html?tradePspGame=${encodeURIComponent(button.dataset.pspId)}#cards`;
});

loadPspGames();
