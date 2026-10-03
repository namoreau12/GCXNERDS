const nesSearch = document.querySelector("#nes-search");
const publisherFilter = document.querySelector("#nes-publisher-filter");
const imageFilter = document.querySelector("#nes-image-filter");
const editorialFilter = document.querySelector("#nes-editorial-filter");
const nesGrid = document.querySelector("#nes-grid");
const nesSummary = document.querySelector("#nes-summary");
const nesAlphabet = document.querySelector("#nes-alphabet");
const nesLoadMore = document.querySelector("#nes-load-more");

let nesGames = [];
let activeLetter = "All";
let visibleLimit = 240;
const pageSize = 240;
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
  values.slice(0, limit).forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
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
  return window.GCX_GAME_COPY?.statusLabel(status) || (status === "published" ? "Published overview" : "Needs overview");
}

function nesMatches(game) {
  const query = normalize(nesSearch.value);
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
  const counts = nesGames.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});

  nesAlphabet.innerHTML = alphabet
    .map((letter) => {
      const count = counts[letter] || 0;
      const activeClass = letter === activeLetter ? " is-active" : "";
      return `<button class="letter-chip${activeClass}" type="button" data-letter="${letter}" ${count ? "" : "disabled"}>${letter}<span>${count}</span></button>`;
    })
    .join("");
}

function renderNesGames() {
  const visible = nesGames
    .filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter)
    .filter(nesMatches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  nesSummary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} NES records (${nesGames.length} total)`;
  nesLoadMore.hidden = activeLetter !== "All" || shown >= visible.length;

  if (!visible.length) {
    nesGrid.innerHTML = `<div class="index-message">No ${activeLetter} NES games matched those filters.</div>`;
    return;
  }

  nesGrid.innerHTML = visible
    .slice(0, activeLetter === "All" ? visibleLimit : visible.length)
    .map((game) => {
      const detailUrl = `nes-game.html?id=${encodeURIComponent(game.id)}`;
      const initials = game.title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((word) => word[0])
        .join("");
      const imageMarkup = game.imageUrl
        ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />`
        : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
      const sourceMarkup = game.articleUrl
        ? `<a href="${escapeHtml(game.articleUrl)}" target="_blank" rel="noreferrer">Source</a>`
        : "";
      const status = editorialStatus(game);

      return `
        <article class="game-db-card" data-nes-card-id="${escapeHtml(game.id)}">
          <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">
            ${imageMarkup}
          </a>
          <div class="game-db-copy">
            <div class="console-card-topline">
              <span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span>
              <span>NES</span>
            </div>
            <div class="console-tags">
              <span>${escapeHtml(editorialStatusLabel(status))}</span>
            </div>
            <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
            <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
            <p>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</p>
            <div class="console-trade">
              <strong>${escapeHtml(game.demandTier)}</strong>
              <p>${escapeHtml(game.tradeNotes)}</p>
            </div>
            ${sourceMarkup ? `<div class="console-source">${sourceMarkup}</div>` : ""}
            <button class="button" type="button" data-nes-id="${escapeHtml(game.id)}">Join beta waitlist</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadNesGames() {
  try {
    const response = await fetch("data/games/nes.json?v=2", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load NES data: ${response.status}`);
    }

    nesGames = await response.json();
    fillFilter(publisherFilter, uniqueList(nesGames.map((game) => game.publishers)));
    renderAlphabet();
    renderNesGames();
  } catch (error) {
    console.error("NES data load failed", error);
    nesSummary.textContent = "NES data could not be loaded.";
    nesGrid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/nes.html instead.</div>`;
  }
}

[nesSearch, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderNesGames();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderNesGames();
  });
});

nesAlphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderNesGames();
});

nesLoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderNesGames();
});

nesGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-nes-id]");
  if (!button) return;
  const game = nesGames.find((item) => item.id === button.dataset.nesId);
  if (!game) return;

  window.location.href = `index.html?tradeNesGame=${encodeURIComponent(game.id)}#cards`;
});

loadNesGames();
