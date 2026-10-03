const xbox360Search = document.querySelector("#xbox360-search");
const genreFilter = document.querySelector("#xbox360-genre-filter");
const publisherFilter = document.querySelector("#xbox360-publisher-filter");
const imageFilter = document.querySelector("#xbox360-image-filter");
const editorialFilter = document.querySelector("#xbox360-editorial-filter");
const xbox360Grid = document.querySelector("#xbox360-grid");
const xbox360Summary = document.querySelector("#xbox360-summary");
const xbox360Alphabet = document.querySelector("#xbox360-alphabet");
const xbox360LoadMore = document.querySelector("#xbox360-load-more");

let xbox360Games = [];
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

function xbox360Matches(game) {
  const query = normalize(xbox360Search.value);
  const genre = genreFilter.value;
  const publisher = publisherFilter.value;
  const imageMode = imageFilter.value;
  const editorial = editorialFilter.value;
  return (
    (!query || normalize(game.searchText).includes(query)) &&
    (genre === "all" || game.genres?.includes(genre)) &&
    (publisher === "all" || game.publishers?.includes(publisher)) &&
    (imageMode === "all" || (imageMode === "with" ? Boolean(game.imageUrl) : !game.imageUrl)) &&
    (editorial === "all" || editorialStatus(game) === editorial)
  );
}

function renderAlphabet() {
  const counts = xbox360Games.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});
  xbox360Alphabet.innerHTML = alphabet
    .map((letter) => `<button class="letter-chip${letter === activeLetter ? " is-active" : ""}" type="button" data-letter="${letter}" ${(counts[letter] || 0) ? "" : "disabled"}>${letter}<span>${counts[letter] || 0}</span></button>`)
    .join("");
}

function renderXbox360Games() {
  const visible = xbox360Games.filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter).filter(xbox360Matches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  xbox360Summary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} Xbox 360 records (${xbox360Games.length} total)`;
  xbox360LoadMore.hidden = activeLetter !== "All" || shown >= visible.length;
  if (!visible.length) {
    xbox360Grid.innerHTML = `<div class="index-message">No ${activeLetter} Xbox 360 games matched those filters.</div>`;
    return;
  }
  xbox360Grid.innerHTML = visible.slice(0, activeLetter === "All" ? visibleLimit : visible.length).map((game) => {
    const detailUrl = `xbox360-game.html?id=${encodeURIComponent(game.id)}`;
    const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
    const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} image" loading="lazy" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
    const status = editorialStatus(game);
    const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Xbox 360") || "Editorial overview in progress.";
    return `
      <article class="game-db-card" data-xbox360-card-id="${escapeHtml(game.id)}">
        <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">${imageMarkup}</a>
        <div class="game-db-copy">
          <div class="console-card-topline"><span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span><span>Xbox 360</span></div>
          <div class="console-tags"><span>${escapeHtml(editorialStatusLabel(status))}</span></div>
          <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
          <p>${escapeHtml(overview)}</p>
          <p>${escapeHtml((game.genres || []).slice(0, 2).join(", ") || "Genre unknown")}</p>
          <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
          <div class="console-trade"><strong>${escapeHtml(game.demandTier)}</strong><p>${escapeHtml(game.tradeNotes)}</p></div>
          <button class="button" type="button" data-xbox360-id="${escapeHtml(game.id)}">Join beta waitlist</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadXbox360Games() {
  try {
    const response = await fetch("data/games/xbox360.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load Xbox 360 data: ${response.status}`);
    xbox360Games = await response.json();
    if (!Array.isArray(xbox360Games)) throw new Error("Xbox 360 data was not an array.");
    fillFilter(genreFilter, uniqueList(xbox360Games.map((game) => game.genres)));
    fillFilter(publisherFilter, uniqueList(xbox360Games.map((game) => game.publishers)));
    renderAlphabet();
    renderXbox360Games();
  } catch (error) {
    console.error("Xbox 360 data load failed", error);
    xbox360Summary.textContent = "Xbox 360 data could not be loaded.";
    xbox360Grid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/xbox360.html instead.</div>`;
  }
}

[xbox360Search, genreFilter, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderXbox360Games();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderXbox360Games();
  });
});

xbox360Alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderXbox360Games();
});

xbox360LoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderXbox360Games();
});

xbox360Grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-xbox360-id]");
  if (!button) return;
  window.location.href = `index.html?tradeXbox360Game=${encodeURIComponent(button.dataset.xbox360Id)}#cards`;
});

loadXbox360Games();
