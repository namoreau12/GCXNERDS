const ps4Search = document.querySelector("#ps4-search");
const publisherFilter = document.querySelector("#ps4-publisher-filter");
const imageFilter = document.querySelector("#ps4-image-filter");
const editorialFilter = document.querySelector("#ps4-editorial-filter");
const ps4Grid = document.querySelector("#ps4-grid");
const ps4Summary = document.querySelector("#ps4-summary");
const ps4Alphabet = document.querySelector("#ps4-alphabet");
const ps4LoadMore = document.querySelector("#ps4-load-more");

let ps4Games = [];
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
  return window.GCX_GAME_COPY?.statusLabel(status) || (status === "published" ? "Published overview" : "In editorial review");
}

function ps4Matches(game) {
  const query = normalize(ps4Search.value);
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
  const counts = ps4Games.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});
  ps4Alphabet.innerHTML = alphabet
    .map((letter) => `<button class="letter-chip${letter === activeLetter ? " is-active" : ""}" type="button" data-letter="${letter}" ${(counts[letter] || 0) ? "" : "disabled"}>${letter}<span>${counts[letter] || 0}</span></button>`)
    .join("");
}

function renderPs4Games() {
  const visible = ps4Games.filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter).filter(ps4Matches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  ps4Summary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} PS4 records (${ps4Games.length} total)`;
  ps4LoadMore.hidden = activeLetter !== "All" || shown >= visible.length;
  if (!visible.length) {
    ps4Grid.innerHTML = `<div class="index-message">No ${activeLetter} PS4 games matched those filters.</div>`;
    return;
  }
  ps4Grid.innerHTML = visible.slice(0, activeLetter === "All" ? visibleLimit : visible.length).map((game) => {
    const detailUrl = `ps4-game.html?id=${encodeURIComponent(game.id)}`;
    const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
    const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
    const status = editorialStatus(game);
    const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PS4") || "Editorial overview in review.";
    return `
      <article class="game-db-card" data-ps4-card-id="${escapeHtml(game.id)}">
        <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">${imageMarkup}</a>
        <div class="game-db-copy">
          <div class="console-card-topline"><span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span><span>PS4</span></div>
          <div class="console-tags"><span>${escapeHtml(editorialStatusLabel(status))}</span></div>
          <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
          <p>${escapeHtml(overview)}</p>
          <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
          <p>${escapeHtml((game.genres || []).slice(0, 3).join(", ") || "Genre unknown")}</p>
          <div class="console-trade"><strong>${escapeHtml(game.demandTier)}</strong><p>${escapeHtml(game.tradeNotes)}</p></div>
          <button class="button" type="button" data-ps4-id="${escapeHtml(game.id)}">Join beta waitlist</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadPs4Games() {
  try {
    const response = await fetch("data/games/ps4.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load PS4 data: ${response.status}`);
    ps4Games = await response.json();
    if (!Array.isArray(ps4Games)) throw new Error("PS4 data was not an array.");
    fillFilter(publisherFilter, uniqueList(ps4Games.map((game) => game.publishers)));
    renderAlphabet();
    renderPs4Games();
  } catch (error) {
    console.error("PS4 data load failed", error);
    ps4Summary.textContent = "PS4 data could not be loaded.";
    ps4Grid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/ps4.html instead.</div>`;
  }
}

[ps4Search, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderPs4Games();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderPs4Games();
  });
});

ps4Alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderPs4Games();
});

ps4LoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderPs4Games();
});

ps4Grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ps4-id]");
  if (!button) return;
  window.location.href = `index.html?tradePs4Game=${encodeURIComponent(button.dataset.ps4Id)}#cards`;
});

loadPs4Games();
