const ps2Search = document.querySelector("#ps2-search");
const publisherFilter = document.querySelector("#ps2-publisher-filter");
const imageFilter = document.querySelector("#ps2-image-filter");
const editorialFilter = document.querySelector("#ps2-editorial-filter");
const ps2Grid = document.querySelector("#ps2-grid");
const ps2Summary = document.querySelector("#ps2-summary");
const ps2Alphabet = document.querySelector("#ps2-alphabet");
const ps2LoadMore = document.querySelector("#ps2-load-more");

let ps2Games = [];
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
  return window.GCX_GAME_COPY?.statusLabel(status) || (status === "published" ? "Published overview" : "Needs overview");
}

function ps2Matches(game) {
  const query = normalize(ps2Search.value);
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
  const counts = ps2Games.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});

  ps2Alphabet.innerHTML = alphabet
    .map((letter) => {
      const count = counts[letter] || 0;
      const activeClass = letter === activeLetter ? " is-active" : "";
      return `<button class="letter-chip${activeClass}" type="button" data-letter="${letter}" ${count ? "" : "disabled"}>${letter}<span>${count}</span></button>`;
    })
    .join("");
}

function renderPs2Games() {
  const visible = ps2Games
    .filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter)
    .filter(ps2Matches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  ps2Summary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} PS2 records (${ps2Games.length} total)`;
  ps2LoadMore.hidden = activeLetter !== "All" || shown >= visible.length;

  if (!visible.length) {
    ps2Grid.innerHTML = `<div class="index-message">No ${activeLetter} PS2 games matched those filters.</div>`;
    return;
  }

  ps2Grid.innerHTML = visible
    .slice(0, activeLetter === "All" ? visibleLimit : visible.length)
    .map((game) => {
      const detailUrl = `ps2-game.html?id=${encodeURIComponent(game.id)}`;
      const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
      const imageMarkup = game.imageUrl
        ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />`
        : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
      const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PS2") || "Editorial overview in progress.";
      const status = editorialStatus(game);

      return `
        <article class="game-db-card" data-ps2-card-id="${escapeHtml(game.id)}">
          <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">
            ${imageMarkup}
          </a>
          <div class="game-db-copy">
            <div class="console-card-topline">
              <span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span>
              <span>PS2</span>
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
            <button class="button" type="button" data-ps2-id="${escapeHtml(game.id)}">Join beta waitlist</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadPs2Games() {
  try {
    const response = await fetch("data/games/ps2.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load PS2 data: ${response.status}`);

    ps2Games = await response.json();
    if (!Array.isArray(ps2Games)) throw new Error("PS2 data was not an array.");
    fillFilter(publisherFilter, uniqueList(ps2Games.map((game) => game.publishers)));
    renderAlphabet();
    renderPs2Games();
  } catch (error) {
    console.error("PS2 data load failed", error);
    ps2Summary.textContent = "PS2 data could not be loaded.";
    ps2Grid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/ps2.html instead.</div>`;
  }
}

[ps2Search, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderPs2Games();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderPs2Games();
  });
});

ps2Alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderPs2Games();
});

ps2LoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderPs2Games();
});

ps2Grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ps2-id]");
  if (!button) return;
  const game = ps2Games.find((item) => item.id === button.dataset.ps2Id);
  if (!game) return;
  window.location.href = `index.html?tradePs2Game=${encodeURIComponent(game.id)}#cards`;
});

loadPs2Games();
