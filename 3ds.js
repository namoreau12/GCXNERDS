const threeDsSearch = document.querySelector("#threeds-search");
const publisherFilter = document.querySelector("#threeds-publisher-filter");
const imageFilter = document.querySelector("#threeds-image-filter");
const editorialFilter = document.querySelector("#threeds-editorial-filter");
const threeDsGrid = document.querySelector("#threeds-grid");
const threeDsSummary = document.querySelector("#threeds-summary");
const threeDsAlphabet = document.querySelector("#threeds-alphabet");
const threeDsLoadMore = document.querySelector("#threeds-load-more");

let threeDsGames = [];
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

function threeDsMatches(game) {
  const query = normalize(threeDsSearch.value);
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
  const counts = threeDsGames.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});
  threeDsAlphabet.innerHTML = alphabet
    .map((letter) => `<button class="letter-chip${letter === activeLetter ? " is-active" : ""}" type="button" data-letter="${letter}" ${(counts[letter] || 0) ? "" : "disabled"}>${letter}<span>${counts[letter] || 0}</span></button>`)
    .join("");
}

function renderThreeDsGames() {
  const visible = threeDsGames.filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter).filter(threeDsMatches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  threeDsSummary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} 3DS records (${threeDsGames.length} total)`;
  threeDsLoadMore.hidden = activeLetter !== "All" || shown >= visible.length;
  if (!visible.length) {
    threeDsGrid.innerHTML = `<div class="index-message">No ${activeLetter} 3DS games matched those filters.</div>`;
    return;
  }
  threeDsGrid.innerHTML = visible.slice(0, activeLetter === "All" ? visibleLimit : visible.length).map((game) => {
    const detailUrl = `3ds-game.html?id=${encodeURIComponent(game.id)}`;
    const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
    const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
    const status = editorialStatus(game);
    const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "3DS") || "Editorial overview in progress.";
    return `
      <article class="game-db-card" data-three-ds-card-id="${escapeHtml(game.id)}">
        <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">${imageMarkup}</a>
        <div class="game-db-copy">
          <div class="console-card-topline"><span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span><span>3DS</span></div>
          <div class="console-tags"><span>${escapeHtml(editorialStatusLabel(status))}</span></div>
          <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
          <p>${escapeHtml(overview)}</p>
          <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
          <p>${escapeHtml(game.format || "Nintendo 3DS Game Card / Nintendo eShop")}</p>
          <div class="console-trade"><strong>${escapeHtml(game.demandTier)}</strong><p>${escapeHtml(game.tradeNotes)}</p></div>
          <button class="button" type="button" data-three-ds-id="${escapeHtml(game.id)}">Join beta waitlist</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadThreeDsGames() {
  try {
    const response = await fetch("data/games/3ds.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load 3DS data: ${response.status}`);
    threeDsGames = await response.json();
    if (!Array.isArray(threeDsGames)) throw new Error("3DS data was not an array.");
    fillFilter(publisherFilter, uniqueList(threeDsGames.map((game) => game.publishers)));
    renderAlphabet();
    renderThreeDsGames();
  } catch (error) {
    console.error("3DS data load failed", error);
    threeDsSummary.textContent = "3DS data could not be loaded.";
    threeDsGrid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/3ds.html instead.</div>`;
  }
}

[threeDsSearch, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderThreeDsGames();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderThreeDsGames();
  });
});

threeDsAlphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderThreeDsGames();
});

threeDsLoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderThreeDsGames();
});

threeDsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-three-ds-id]");
  if (!button) return;
  window.location.href = `index.html?trade3dsGame=${encodeURIComponent(button.dataset.threeDsId)}#cards`;
});

loadThreeDsGames();
