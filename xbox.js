const xboxSearch = document.querySelector("#xbox-search");
const publisherFilter = document.querySelector("#xbox-publisher-filter");
const imageFilter = document.querySelector("#xbox-image-filter");
const editorialFilter = document.querySelector("#xbox-editorial-filter");
const xboxGrid = document.querySelector("#xbox-grid");
const xboxSummary = document.querySelector("#xbox-summary");
const xboxAlphabet = document.querySelector("#xbox-alphabet");
const xboxLoadMore = document.querySelector("#xbox-load-more");

let xboxGames = [];
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

function xboxMatches(game) {
  const query = normalize(xboxSearch.value);
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
  const counts = xboxGames.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});
  xboxAlphabet.innerHTML = alphabet
    .map((letter) => `<button class="letter-chip${letter === activeLetter ? " is-active" : ""}" type="button" data-letter="${letter}" ${(counts[letter] || 0) ? "" : "disabled"}>${letter}<span>${counts[letter] || 0}</span></button>`)
    .join("");
}

function renderXboxGames() {
  const visible = xboxGames.filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter).filter(xboxMatches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  xboxSummary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} Original Xbox records (${xboxGames.length} total)`;
  xboxLoadMore.hidden = activeLetter !== "All" || shown >= visible.length;
  if (!visible.length) {
    xboxGrid.innerHTML = `<div class="index-message">No ${activeLetter} Original Xbox games matched those filters.</div>`;
    return;
  }
  xboxGrid.innerHTML = visible.slice(0, activeLetter === "All" ? visibleLimit : visible.length).map((game) => {
    const detailUrl = `xbox-game.html?id=${encodeURIComponent(game.id)}`;
    const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
    const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
    const status = editorialStatus(game);
    const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Original Xbox") || "Editorial overview in review.";
    return `
      <article class="game-db-card" data-xbox-card-id="${escapeHtml(game.id)}">
        <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">${imageMarkup}</a>
        <div class="game-db-copy">
          <div class="console-card-topline"><span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span><span>Original Xbox</span></div>
          <div class="console-tags"><span>${escapeHtml(editorialStatusLabel(status))}</span></div>
          <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
          <p>${escapeHtml(overview)}</p>
          <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
          <p>${escapeHtml(game.format || "Xbox DVD")}</p>
          <div class="console-trade"><strong>${escapeHtml(game.demandTier)}</strong><p>${escapeHtml(game.tradeNotes)}</p></div>
          <button class="button" type="button" data-xbox-id="${escapeHtml(game.id)}">Join beta waitlist</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadXboxGames() {
  try {
    const response = await fetch("data/games/xbox.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load Original Xbox data: ${response.status}`);
    xboxGames = await response.json();
    if (!Array.isArray(xboxGames)) throw new Error("Original Xbox data was not an array.");
    fillFilter(publisherFilter, uniqueList(xboxGames.map((game) => game.publishers)));
    renderAlphabet();
    renderXboxGames();
  } catch (error) {
    console.error("Original Xbox data load failed", error);
    xboxSummary.textContent = "Original Xbox data could not be loaded.";
    xboxGrid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/xbox.html instead.</div>`;
  }
}

[xboxSearch, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderXboxGames();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderXboxGames();
  });
});

xboxAlphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderXboxGames();
});

xboxLoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderXboxGames();
});

xboxGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-xbox-id]");
  if (!button) return;
  window.location.href = `index.html?tradeXboxGame=${encodeURIComponent(button.dataset.xboxId)}#cards`;
});

loadXboxGames();
