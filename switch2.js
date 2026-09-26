const switch2Search = document.querySelector("#switch2-search");
const genreFilter = document.querySelector("#switch2-genre-filter");
const publisherFilter = document.querySelector("#switch2-publisher-filter");
const availabilityFilter = document.querySelector("#switch2-availability-filter");
const coverFilter = document.querySelector("#switch2-cover-filter");
const editorialFilter = document.querySelector("#switch2-editorial-filter");
const switch2Grid = document.querySelector("#switch2-grid");
const switch2Summary = document.querySelector("#switch2-summary");
const switch2Alphabet = document.querySelector("#switch2-alphabet");
const switch2LoadMore = document.querySelector("#switch2-load-more");

let switch2Games = [];
let activeLetter = "All";
let visibleLimit = 120;
const pageSize = 120;
const alphabet = ["All", "#", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function coverTypeName(value) {
  const labels = {
    digital_art: "Digital store art",
    game_key_card_case: "Game-key case art",
    physical_case: "Physical/case art",
    promo_art: "Promo or bundle art",
    unknown: "Unknown",
  };
  return labels[value] || value;
}

function fillCoverFilter(select, values) {
  values.filter(Boolean).forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = coverTypeName(value);
    select.append(option);
  });
}

function titleBucket(title) {
  const first = normalize(title).charAt(0);
  if (!first || !/[a-z]/.test(first)) return "#";
  return first.toUpperCase();
}

function editorialStatus(game) {
  return window.GCX_GAME_COPY?.status(game) || "needs_editorial";
}

function editorialStatusLabel(status) {
  return window.GCX_GAME_COPY?.statusLabel(status) || (status === "published" ? "Published overview" : "In editorial review");
}

function formatDate(game) {
  if (game.releaseDateDisplay) return game.releaseDateDisplay;
  if (!game.releaseDate) return game.releaseYear || "Date unknown";

  const date = new Date(game.releaseDate);
  if (Number.isNaN(date.getTime())) return game.releaseYear || "Date unknown";

  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function switch2Matches(game) {
  const query = normalize(switch2Search?.value);
  const genre = genreFilter?.value || "all";
  const publisher = publisherFilter?.value || "all";
  const availability = availabilityFilter?.value || "all";
  const coverType = coverFilter?.value || "all";
  const editorial = editorialFilter?.value || "all";

  return (
    (!query || normalize(game.searchText).includes(query)) &&
    (genre === "all" || game.genres?.includes(genre)) &&
    (publisher === "all" || game.publishers?.includes(publisher)) &&
    (availability === "all" || game.availability?.includes(availability)) &&
    (coverType === "all" || game.coverType === coverType) &&
    (editorial === "all" || editorialStatus(game) === editorial)
  );
}

function renderAlphabet() {
  const counts = switch2Games.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});

  switch2Alphabet.innerHTML = alphabet
    .map((letter) => {
      const count = counts[letter] || 0;
      const activeClass = letter === activeLetter ? " is-active" : "";
      return `<button class="letter-chip${activeClass}" type="button" data-letter="${letter}" ${count ? "" : "disabled"}>${letter}<span>${count}</span></button>`;
    })
    .join("");
}

function renderSwitch2Games() {
  const visible = switch2Games
    .filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter)
    .filter(switch2Matches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  switch2Summary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} Switch 2 records (${switch2Games.length} total)`;
  switch2LoadMore.hidden = activeLetter !== "All" || shown >= visible.length;

  if (!visible.length) {
    switch2Grid.innerHTML = `<div class="index-message">No ${activeLetter} Switch 2 games matched those filters.</div>`;
    return;
  }

  switch2Grid.innerHTML = visible
    .slice(0, activeLetter === "All" ? visibleLimit : visible.length)
    .map((game) => {
      const detailUrl = `switch2-game.html?id=${encodeURIComponent(game.id)}`;
      const initials = game.title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((word) => word[0])
        .join("");
      const imageMarkup = game.imageUrl
        ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />`
        : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
      const coverLabel = game.coverTypeLabel || "Cover type unknown";
      const sourceMarkup = game.sourceUrl
        ? `<a href="${escapeHtml(game.sourceUrl)}" target="_blank" rel="noreferrer">Nintendo source</a>`
        : "";
      const genres = (game.genres || []).slice(0, 2).join(", ") || "Genre unknown";
      const publishers = (game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown";
      const availability = (game.availability || []).join(", ") || "Nintendo Store recognized";
      const status = editorialStatus(game);
      const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Switch 2") || "Editorial overview in review.";

      return `
        <article class="game-db-card" data-switch2-card-id="${escapeHtml(game.id)}">
          <div class="game-art-stack">
            <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">
              ${imageMarkup}
            </a>
            <span class="cover-type-pill">${escapeHtml(coverLabel)}</span>
          </div>
          <div class="game-db-copy">
            <div class="console-card-topline">
              <span>${escapeHtml(formatDate(game))}</span>
              <span>Switch 2</span>
            </div>
            <div class="console-tags">
              <span>${escapeHtml(editorialStatusLabel(status))}</span>
            </div>
            <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
            <p>${escapeHtml(overview)}</p>
            <p>${escapeHtml(genres)}</p>
            <p>${escapeHtml(publishers)}</p>
            <div class="console-trade">
              <strong>${escapeHtml(availability)}</strong>
              <p>${escapeHtml(game.tradeNotes)}</p>
            </div>
            ${sourceMarkup ? `<div class="console-source">${sourceMarkup}</div>` : ""}
            <button class="button" type="button" data-switch2-id="${escapeHtml(game.id)}">Join beta waitlist</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadSwitch2Games() {
  try {
    const response = await fetch("data/games/switch2.json?v=6", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load Switch 2 data: ${response.status}`);
    }

    switch2Games = await response.json();
    if (!Array.isArray(switch2Games)) {
      throw new Error("Switch 2 data was not an array.");
    }
    if (genreFilter) fillFilter(genreFilter, uniqueList(switch2Games.map((game) => game.genres)));
    if (publisherFilter) fillFilter(publisherFilter, uniqueList(switch2Games.map((game) => game.publishers)));
    if (availabilityFilter) fillFilter(availabilityFilter, uniqueList(switch2Games.map((game) => game.availability)));
    if (coverFilter) fillCoverFilter(coverFilter, uniqueList(switch2Games.map((game) => [game.coverType])));
    renderAlphabet();
    renderSwitch2Games();
  } catch (error) {
    console.error("Switch 2 data load failed", error);
    switch2Summary.textContent = "Switch 2 data could not be loaded.";
    switch2Grid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/switch2.html instead.</div>`;
  }
}

[switch2Search, genreFilter, publisherFilter, availabilityFilter, coverFilter, editorialFilter].filter(Boolean).forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderSwitch2Games();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderSwitch2Games();
  });
});

switch2Alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderSwitch2Games();
});

switch2LoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderSwitch2Games();
});

switch2Grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-switch2-id]");
  if (!button) return;
  const game = switch2Games.find((item) => item.id === button.dataset.switch2Id);
  if (!game) return;

  window.location.href = `index.html?tradeSwitch2Game=${encodeURIComponent(game.id)}#cards`;
});

loadSwitch2Games();
