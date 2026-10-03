const ps5Search = document.querySelector("#ps5-search");
const publisherFilter = document.querySelector("#ps5-publisher-filter");
const imageFilter = document.querySelector("#ps5-image-filter");
const editorialFilter = document.querySelector("#ps5-editorial-filter");
const ps5Grid = document.querySelector("#ps5-grid");
const ps5Summary = document.querySelector("#ps5-summary");
const ps5Alphabet = document.querySelector("#ps5-alphabet");
const ps5LoadMore = document.querySelector("#ps5-load-more");

let ps5Games = [];
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

function ps5Matches(game) {
  const query = normalize(ps5Search.value);
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
  const counts = ps5Games.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});
  ps5Alphabet.innerHTML = alphabet
    .map((letter) => `<button class="letter-chip${letter === activeLetter ? " is-active" : ""}" type="button" data-letter="${letter}" ${(counts[letter] || 0) ? "" : "disabled"}>${letter}<span>${counts[letter] || 0}</span></button>`)
    .join("");
}

function renderPs5Games() {
  const visible = ps5Games.filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter).filter(ps5Matches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  ps5Summary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} PS5 records (${ps5Games.length} total)`;
  ps5LoadMore.hidden = activeLetter !== "All" || shown >= visible.length;
  if (!visible.length) {
    ps5Grid.innerHTML = `<div class="index-message">No ${activeLetter} PS5 games matched those filters.</div>`;
    return;
  }
  ps5Grid.innerHTML = visible.slice(0, activeLetter === "All" ? visibleLimit : visible.length).map((game) => {
    const detailUrl = `ps5-game.html?id=${encodeURIComponent(game.id)}`;
    const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
    const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
    const status = editorialStatus(game);
    const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PS5") || "Editorial overview in progress.";
    return `
      <article class="game-db-card" data-ps5-card-id="${escapeHtml(game.id)}">
        <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">${imageMarkup}</a>
        <div class="game-db-copy">
          <div class="console-card-topline"><span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span><span>PS5</span></div>
          <div class="console-tags"><span>${escapeHtml(editorialStatusLabel(status))}</span></div>
          <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
          <p>${escapeHtml(overview)}</p>
          <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
          <p>${escapeHtml((game.genres || []).slice(0, 3).join(", ") || "Genre unknown")}</p>
          <div class="console-trade"><strong>${escapeHtml(game.demandTier)}</strong><p>${escapeHtml(game.tradeNotes)}</p></div>
          <button class="button" type="button" data-ps5-id="${escapeHtml(game.id)}">Join beta waitlist</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadPs5Games() {
  try {
    const response = await fetch("data/games/ps5.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load PS5 data: ${response.status}`);
    ps5Games = await response.json();
    if (!Array.isArray(ps5Games)) throw new Error("PS5 data was not an array.");
    fillFilter(publisherFilter, uniqueList(ps5Games.map((game) => game.publishers)));
    renderAlphabet();
    renderPs5Games();
  } catch (error) {
    console.error("PS5 data load failed", error);
    ps5Summary.textContent = "PS5 data could not be loaded.";
    ps5Grid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/ps5.html instead.</div>`;
  }
}

[ps5Search, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderPs5Games();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderPs5Games();
  });
});

ps5Alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderPs5Games();
});

ps5LoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderPs5Games();
});

ps5Grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ps5-id]");
  if (!button) return;
  window.location.href = `index.html?tradePs5Game=${encodeURIComponent(button.dataset.ps5Id)}#cards`;
});

loadPs5Games();
