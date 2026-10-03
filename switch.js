const switchSearch = document.querySelector("#switch-search");
const publisherFilter = document.querySelector("#switch-publisher-filter");
const imageFilter = document.querySelector("#switch-image-filter");
const editorialFilter = document.querySelector("#switch-editorial-filter");
const switchGrid = document.querySelector("#switch-grid");
const switchSummary = document.querySelector("#switch-summary");
const switchAlphabet = document.querySelector("#switch-alphabet");
const switchLoadMore = document.querySelector("#switch-load-more");

let switchGames = [];
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
  return window.GCX_GAME_COPY?.statusLabel(status) || (status === "published" ? "Published overview" : "Needs overview");
}

function formatDate(game) {
  return game.releaseDateDisplay || game.releaseYears?.[0] || "Date unknown";
}

function switchMatches(game) {
  const query = normalize(switchSearch.value);
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
  const counts = switchGames.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});
  switchAlphabet.innerHTML = alphabet
    .map((letter) => `<button class="letter-chip${letter === activeLetter ? " is-active" : ""}" type="button" data-letter="${letter}" ${(counts[letter] || 0) ? "" : "disabled"}>${letter}<span>${counts[letter] || 0}</span></button>`)
    .join("");
}

function renderSwitchGames() {
  const visible = switchGames.filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter).filter(switchMatches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  switchSummary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} Switch records (${switchGames.length} total)`;
  switchLoadMore.hidden = activeLetter !== "All" || shown >= visible.length;
  if (!visible.length) {
    switchGrid.innerHTML = `<div class="index-message">No ${activeLetter} Switch games matched those filters.</div>`;
    return;
  }
  switchGrid.innerHTML = visible.slice(0, activeLetter === "All" ? visibleLimit : visible.length).map((game) => {
    const detailUrl = `switch-game.html?id=${encodeURIComponent(game.id)}`;
    const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
    const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} image" loading="lazy" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
    const status = editorialStatus(game);
    const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Switch") || "Editorial overview in progress.";
    return `
      <article class="game-db-card" data-switch-card-id="${escapeHtml(game.id)}">
        <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">${imageMarkup}</a>
        <div class="game-db-copy">
          <div class="console-card-topline"><span>${escapeHtml(formatDate(game))}</span><span>Switch</span></div>
          <div class="console-tags"><span>${escapeHtml(editorialStatusLabel(status))}</span></div>
          <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
          <p>${escapeHtml(overview)}</p>
          <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
          <p>${escapeHtml(game.format || "Nintendo Switch game")}</p>
          <div class="console-trade"><strong>${escapeHtml(game.demandTier)}</strong><p>${escapeHtml(game.tradeNotes)}</p></div>
          <button class="button" type="button" data-switch-id="${escapeHtml(game.id)}">Join beta waitlist</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadSwitchGames() {
  try {
    const response = await fetch("data/games/switch.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load Switch data: ${response.status}`);
    switchGames = await response.json();
    if (!Array.isArray(switchGames)) throw new Error("Switch data was not an array.");
    fillFilter(publisherFilter, uniqueList(switchGames.map((game) => game.publishers)));
    renderAlphabet();
    renderSwitchGames();
  } catch (error) {
    console.error("Switch data load failed", error);
    switchSummary.textContent = "Switch data could not be loaded.";
    switchGrid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/switch.html instead.</div>`;
  }
}

[switchSearch, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderSwitchGames();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderSwitchGames();
  });
});

switchAlphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderSwitchGames();
});

switchLoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderSwitchGames();
});

switchGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-switch-id]");
  if (!button) return;
  window.location.href = `index.html?tradeSwitchGame=${encodeURIComponent(button.dataset.switchId)}#cards`;
});

loadSwitchGames();
