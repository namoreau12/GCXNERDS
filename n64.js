const n64Search = document.querySelector("#n64-search");
const publisherFilter = document.querySelector("#n64-publisher-filter");
const imageFilter = document.querySelector("#n64-image-filter");
const editorialFilter = document.querySelector("#n64-editorial-filter");
const n64Grid = document.querySelector("#n64-grid");
const n64Summary = document.querySelector("#n64-summary");
const n64Alphabet = document.querySelector("#n64-alphabet");
const n64LoadMore = document.querySelector("#n64-load-more");

let n64Games = [];
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
  values.filter(Boolean).slice(0, limit).forEach((value) => {
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
  return window.GCX_GAME_COPY?.statusLabel(status) || (status === "published" ? "Published overview" : "In editorial review");
}

function n64Matches(game) {
  const query = normalize(n64Search.value);
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
  const counts = n64Games.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});

  n64Alphabet.innerHTML = alphabet
    .map((letter) => {
      const count = counts[letter] || 0;
      const activeClass = letter === activeLetter ? " is-active" : "";
      return `<button class="letter-chip${activeClass}" type="button" data-letter="${letter}" ${count ? "" : "disabled"}>${letter}<span>${count}</span></button>`;
    })
    .join("");
}

function renderN64Games() {
  const visible = n64Games
    .filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter)
    .filter(n64Matches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  n64Summary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} N64 records (${n64Games.length} total)`;
  n64LoadMore.hidden = activeLetter !== "All" || shown >= visible.length;

  if (!visible.length) {
    n64Grid.innerHTML = `<div class="index-message">No ${activeLetter} N64 games matched those filters.</div>`;
    return;
  }

  n64Grid.innerHTML = visible
    .slice(0, activeLetter === "All" ? visibleLimit : visible.length)
    .map((game) => {
      const detailUrl = `n64-game.html?id=${encodeURIComponent(game.id)}`;
      const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
      const imageMarkup = game.imageUrl
        ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />`
        : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
      const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "N64") || "Editorial overview in review.";
      const status = editorialStatus(game);

      return `
        <article class="game-db-card" data-n64-card-id="${escapeHtml(game.id)}">
          <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">
            ${imageMarkup}
          </a>
          <div class="game-db-copy">
            <div class="console-card-topline">
              <span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span>
              <span>N64</span>
            </div>
            <div class="console-tags">
              <span>${escapeHtml(editorialStatusLabel(status))}</span>
            </div>
            <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
            <p>${escapeHtml(overview)}</p>
            <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
            <p>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</p>
            <div class="console-trade">
              <strong>${escapeHtml(game.demandTier)}</strong>
              <p>${escapeHtml(game.tradeNotes)}</p>
            </div>
            <button class="button" type="button" data-n64-id="${escapeHtml(game.id)}">Join beta waitlist</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadN64Games() {
  try {
    const response = await fetch("data/games/n64.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load N64 data: ${response.status}`);

    n64Games = await response.json();
    if (!Array.isArray(n64Games)) throw new Error("N64 data was not an array.");
    fillFilter(publisherFilter, uniqueList(n64Games.map((game) => game.publishers)));
    renderAlphabet();
    renderN64Games();
  } catch (error) {
    console.error("N64 data load failed", error);
    n64Summary.textContent = "N64 data could not be loaded.";
    n64Grid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/n64.html instead.</div>`;
  }
}

[n64Search, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderN64Games();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderN64Games();
  });
});

n64Alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderN64Games();
});

n64LoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderN64Games();
});

n64Grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-n64-id]");
  if (!button) return;
  const game = n64Games.find((item) => item.id === button.dataset.n64Id);
  if (!game) return;
  window.location.href = `index.html?tradeN64Game=${encodeURIComponent(game.id)}#cards`;
});

loadN64Games();
