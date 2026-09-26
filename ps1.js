const ps1Search = document.querySelector("#ps1-search");
const publisherFilter = document.querySelector("#ps1-publisher-filter");
const imageFilter = document.querySelector("#ps1-image-filter");
const editorialFilter = document.querySelector("#ps1-editorial-filter");
const ps1Grid = document.querySelector("#ps1-grid");
const ps1Summary = document.querySelector("#ps1-summary");
const ps1Alphabet = document.querySelector("#ps1-alphabet");
const ps1LoadMore = document.querySelector("#ps1-load-more");

let ps1Games = [];
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

function ps1Matches(game) {
  const query = normalize(ps1Search.value);
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
  const counts = ps1Games.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});

  ps1Alphabet.innerHTML = alphabet
    .map((letter) => {
      const count = counts[letter] || 0;
      const activeClass = letter === activeLetter ? " is-active" : "";
      return `<button class="letter-chip${activeClass}" type="button" data-letter="${letter}" ${count ? "" : "disabled"}>${letter}<span>${count}</span></button>`;
    })
    .join("");
}

function renderPs1Games() {
  const visible = ps1Games
    .filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter)
    .filter(ps1Matches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  ps1Summary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} PS1 records (${ps1Games.length} total)`;
  ps1LoadMore.hidden = activeLetter !== "All" || shown >= visible.length;

  if (!visible.length) {
    ps1Grid.innerHTML = `<div class="index-message">No ${activeLetter} PS1 games matched those filters.</div>`;
    return;
  }

  ps1Grid.innerHTML = visible
    .slice(0, activeLetter === "All" ? visibleLimit : visible.length)
    .map((game) => {
      const detailUrl = `ps1-game.html?id=${encodeURIComponent(game.id)}`;
      const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
      const imageMarkup = game.imageUrl
        ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />`
        : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
      const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PS1") || "Editorial overview in review.";
      const status = editorialStatus(game);

      return `
        <article class="game-db-card" data-ps1-card-id="${escapeHtml(game.id)}">
          <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">
            ${imageMarkup}
          </a>
          <div class="game-db-copy">
            <div class="console-card-topline">
              <span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span>
              <span>PS1</span>
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
            <button class="button" type="button" data-ps1-id="${escapeHtml(game.id)}">Join beta waitlist</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadPs1Games() {
  try {
    const response = await fetch("data/games/ps1.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load PS1 data: ${response.status}`);

    ps1Games = await response.json();
    if (!Array.isArray(ps1Games)) throw new Error("PS1 data was not an array.");
    fillFilter(publisherFilter, uniqueList(ps1Games.map((game) => game.publishers)));
    renderAlphabet();
    renderPs1Games();
  } catch (error) {
    console.error("PS1 data load failed", error);
    ps1Summary.textContent = "PS1 data could not be loaded.";
    ps1Grid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/ps1.html instead.</div>`;
  }
}

[ps1Search, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderPs1Games();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderPs1Games();
  });
});

ps1Alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderPs1Games();
});

ps1LoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderPs1Games();
});

ps1Grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ps1-id]");
  if (!button) return;
  const game = ps1Games.find((item) => item.id === button.dataset.ps1Id);
  if (!game) return;
  window.location.href = `index.html?tradePs1Game=${encodeURIComponent(game.id)}#cards`;
});

loadPs1Games();
