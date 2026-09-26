const dreamcastSearch = document.querySelector("#dreamcast-search");
const publisherFilter = document.querySelector("#dreamcast-publisher-filter");
const imageFilter = document.querySelector("#dreamcast-image-filter");
const editorialFilter = document.querySelector("#dreamcast-editorial-filter");
const dreamcastGrid = document.querySelector("#dreamcast-grid");
const dreamcastSummary = document.querySelector("#dreamcast-summary");
const dreamcastAlphabet = document.querySelector("#dreamcast-alphabet");
const dreamcastLoadMore = document.querySelector("#dreamcast-load-more");

let dreamcastGames = [];
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
  return game.overviewStatus === "published" || (game.descriptionProvider && game.description && game.overviewStatus !== "needs_editorial") ? "published" : "needs_editorial";
}

function editorialStatusLabel(status) {
  return status === "published" ? "Published overview" : "Needs overview";
}

function DreamcastMatches(game) {
  const query = normalize(dreamcastSearch.value);
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
  const counts = dreamcastGames.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});
  dreamcastAlphabet.innerHTML = alphabet
    .map((letter) => `<button class="letter-chip${letter === activeLetter ? " is-active" : ""}" type="button" data-letter="${letter}" ${(counts[letter] || 0) ? "" : "disabled"}>${letter}<span>${counts[letter] || 0}</span></button>`)
    .join("");
}

function renderDreamcastGames() {
  const visible = dreamcastGames.filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter).filter(DreamcastMatches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  dreamcastSummary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} Dreamcast records (${dreamcastGames.length} total)`;
  dreamcastLoadMore.hidden = activeLetter !== "All" || shown >= visible.length;
  if (!visible.length) {
    dreamcastGrid.innerHTML = `<div class="index-message">No ${activeLetter} Dreamcast games matched those filters.</div>`;
    return;
  }
  dreamcastGrid.innerHTML = visible.slice(0, activeLetter === "All" ? visibleLimit : visible.length).map((game) => {
    const detailUrl = `dreamcast-game.html?id=${encodeURIComponent(game.id)}`;
    const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
    const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
    const status = editorialStatus(game);
    const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Dreamcast") || "Editorial overview in review.";
    return `
      <article class="game-db-card" data-dreamcast-card-id="${escapeHtml(game.id)}">
        <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">${imageMarkup}</a>
        <div class="game-db-copy">
          <div class="console-card-topline"><span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span><span>Dreamcast</span></div>
          <div class="console-tags"><span>${escapeHtml(editorialStatusLabel(status))}</span></div>
          <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
          <p>${escapeHtml(overview)}</p>
          <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
          <p>${escapeHtml(game.format || "GD-ROM")}</p>
          <div class="console-trade"><strong>${escapeHtml(game.demandTier)}</strong><p>${escapeHtml(game.tradeNotes)}</p></div>
          <button class="button" type="button" data-dreamcast-id="${escapeHtml(game.id)}">Join beta waitlist</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadDreamcastGames() {
  try {
    const response = await fetch("data/games/dreamcast.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load Dreamcast data: ${response.status}`);
    dreamcastGames = await response.json();
    if (!Array.isArray(dreamcastGames)) throw new Error("Dreamcast data was not an array.");
    fillFilter(publisherFilter, uniqueList(dreamcastGames.map((game) => game.publishers)));
    renderAlphabet();
    renderDreamcastGames();
  } catch (error) {
    console.error("Dreamcast data load failed", error);
    dreamcastSummary.textContent = "Dreamcast data could not be loaded.";
    dreamcastGrid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/dreamcast.html instead.</div>`;
  }
}

[dreamcastSearch, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderDreamcastGames();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderDreamcastGames();
  });
});

dreamcastAlphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderDreamcastGames();
});

dreamcastLoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderDreamcastGames();
});

dreamcastGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-dreamcast-id]");
  if (!button) return;
  window.location.href = `index.html?tradeDreamcastGame=${encodeURIComponent(button.dataset.dreamcastId)}#cards`;
});

loadDreamcastGames();
