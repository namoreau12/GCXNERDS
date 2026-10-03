const ps3Search = document.querySelector("#ps3-search");
const developerFilter = document.querySelector("#ps3-developer-filter");
const imageFilter = document.querySelector("#ps3-image-filter");
const editorialFilter = document.querySelector("#ps3-editorial-filter");
const ps3Grid = document.querySelector("#ps3-grid");
const ps3Summary = document.querySelector("#ps3-summary");
const ps3Alphabet = document.querySelector("#ps3-alphabet");
const ps3LoadMore = document.querySelector("#ps3-load-more");

let ps3Games = [];
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

function ps3Matches(game) {
  const query = normalize(ps3Search.value);
  const developer = developerFilter.value;
  const imageMode = imageFilter.value;
  const editorial = editorialFilter.value;
  return (
    (!query || normalize(game.searchText).includes(query)) &&
    (developer === "all" || game.developers?.includes(developer)) &&
    (imageMode === "all" || (imageMode === "with" ? Boolean(game.imageUrl) : !game.imageUrl)) &&
    (editorial === "all" || editorialStatus(game) === editorial)
  );
}

function renderAlphabet() {
  const counts = ps3Games.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});
  ps3Alphabet.innerHTML = alphabet
    .map((letter) => `<button class="letter-chip${letter === activeLetter ? " is-active" : ""}" type="button" data-letter="${letter}" ${(counts[letter] || 0) ? "" : "disabled"}>${letter}<span>${counts[letter] || 0}</span></button>`)
    .join("");
}

function renderPs3Games() {
  const visible = ps3Games.filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter).filter(ps3Matches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  ps3Summary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} PS3 records (${ps3Games.length} total)`;
  ps3LoadMore.hidden = activeLetter !== "All" || shown >= visible.length;
  if (!visible.length) {
    ps3Grid.innerHTML = `<div class="index-message">No ${activeLetter} PS3 games matched those filters.</div>`;
    return;
  }
  ps3Grid.innerHTML = visible.slice(0, activeLetter === "All" ? visibleLimit : visible.length).map((game) => {
    const detailUrl = `ps3-game.html?id=${encodeURIComponent(game.id)}`;
    const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
    const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art approval pending">${escapeHtml(initials)}</span>`;
    const status = editorialStatus(game);
    const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "PS3") || "Editorial overview in progress.";
    return `
      <article class="game-db-card" data-ps3-card-id="${escapeHtml(game.id)}">
        <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">${imageMarkup}</a>
        <div class="game-db-copy">
          <div class="console-card-topline"><span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span><span>PS3</span></div>
          <div class="console-tags"><span>${escapeHtml(editorialStatusLabel(status))}</span></div>
          <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
          <p>${escapeHtml(overview)}</p>
          <p>${escapeHtml((game.developers || []).slice(0, 2).join(", ") || "Developer unknown")}</p>
          <p>${escapeHtml((game.options || []).slice(0, 3).join(", ") || "Retail/digital release")}</p>
          <div class="console-trade"><strong>${escapeHtml(game.demandTier)}</strong><p>${escapeHtml(game.tradeNotes)}</p></div>
          <button class="button" type="button" data-ps3-id="${escapeHtml(game.id)}">Join beta waitlist</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadPs3Games() {
  try {
    const response = await fetch("data/games/ps3.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load PS3 data: ${response.status}`);
    ps3Games = await response.json();
    if (!Array.isArray(ps3Games)) throw new Error("PS3 data was not an array.");
    fillFilter(developerFilter, uniqueList(ps3Games.map((game) => game.developers)));
    renderAlphabet();
    renderPs3Games();
  } catch (error) {
    console.error("PS3 data load failed", error);
    ps3Summary.textContent = "PS3 data could not be loaded.";
    ps3Grid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/ps3.html instead.</div>`;
  }
}

[ps3Search, developerFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderPs3Games();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderPs3Games();
  });
});

ps3Alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderPs3Games();
});

ps3LoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderPs3Games();
});

ps3Grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ps3-id]");
  if (!button) return;
  window.location.href = `index.html?tradePs3Game=${encodeURIComponent(button.dataset.ps3Id)}#cards`;
});

loadPs3Games();
