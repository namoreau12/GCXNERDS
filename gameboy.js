const gameboySearch = document.querySelector("#gameboy-search");
const platformFilter = document.querySelector("#gameboy-platform-filter");
const imageFilter = document.querySelector("#gameboy-image-filter");
const editorialFilter = document.querySelector("#gameboy-editorial-filter");
const gameboyGrid = document.querySelector("#gameboy-grid");
const gameboySummary = document.querySelector("#gameboy-summary");
const gameboyAlphabet = document.querySelector("#gameboy-alphabet");
const gameboyLoadMore = document.querySelector("#gameboy-load-more");

let gameboyGames = [];
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

function gameboyMatches(game) {
  const query = normalize(gameboySearch.value);
  const platform = platformFilter.value;
  const imageMode = imageFilter.value;
  const editorial = editorialFilter.value;
  return (
    (!query || normalize(game.searchText).includes(query)) &&
    (platform === "all" || game.platform === platform || game.platforms?.includes(platform)) &&
    (imageMode === "all" || (imageMode === "with" ? Boolean(game.imageUrl) : !game.imageUrl)) &&
    (editorial === "all" || editorialStatus(game) === editorial)
  );
}

function renderAlphabet() {
  const counts = gameboyGames.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});
  gameboyAlphabet.innerHTML = alphabet
    .map((letter) => `<button class="letter-chip${letter === activeLetter ? " is-active" : ""}" type="button" data-letter="${letter}" ${(counts[letter] || 0) ? "" : "disabled"}>${letter}<span>${counts[letter] || 0}</span></button>`)
    .join("");
}

function renderGameboyGames() {
  const visible = gameboyGames.filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter).filter(gameboyMatches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  gameboySummary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} Game Boy records (${gameboyGames.length} total)`;
  gameboyLoadMore.hidden = activeLetter !== "All" || shown >= visible.length;
  if (!visible.length) {
    gameboyGrid.innerHTML = `<div class="index-message">No ${activeLetter} Game Boy games matched those filters.</div>`;
    return;
  }
  gameboyGrid.innerHTML = visible.slice(0, activeLetter === "All" ? visibleLimit : visible.length).map((game) => {
    const detailUrl = `gameboy-game.html?id=${encodeURIComponent(game.id)}`;
    const initials = game.title.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("");
    const imageMarkup = game.imageUrl ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />` : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
    const status = editorialStatus(game);
    const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "Game Boy") || "Editorial overview in review.";
    return `
      <article class="game-db-card" data-gameboy-card-id="${escapeHtml(game.id)}">
        <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">${imageMarkup}</a>
        <div class="game-db-copy">
          <div class="console-card-topline"><span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span><span>${escapeHtml(game.id.startsWith("gbc-") ? "GBC" : "GB")}</span></div>
          <div class="console-tags"><span>${escapeHtml(editorialStatusLabel(status))}</span></div>
          <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
          <p>${escapeHtml(overview)}</p>
          <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
          <p>${escapeHtml(game.format || "Cartridge")}</p>
          <div class="console-trade"><strong>${escapeHtml(game.demandTier)}</strong><p>${escapeHtml(game.tradeNotes)}</p></div>
          <button class="button" type="button" data-gameboy-id="${escapeHtml(game.id)}">Join beta waitlist</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadGameboyGames() {
  try {
    const response = await fetch("data/games/gameboy.json?v=1", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load Game Boy data: ${response.status}`);
    gameboyGames = await response.json();
    if (!Array.isArray(gameboyGames)) throw new Error("Game Boy data was not an array.");
    fillFilter(platformFilter, uniqueList(gameboyGames.map((game) => game.platforms)));
    renderAlphabet();
    renderGameboyGames();
  } catch (error) {
    console.error("Game Boy data load failed", error);
    gameboySummary.textContent = "Game Boy data could not be loaded.";
    gameboyGrid.innerHTML = `<div class="index-message">Try refreshing the page. If this was opened as a local file, use http://localhost:3000/gameboy.html instead.</div>`;
  }
}

[gameboySearch, platformFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderGameboyGames();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderGameboyGames();
  });
});

gameboyAlphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderGameboyGames();
});

gameboyLoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderGameboyGames();
});

gameboyGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gameboy-id]");
  if (!button) return;
  window.location.href = `index.html?tradeGameboyGame=${encodeURIComponent(button.dataset.gameboyId)}#cards`;
});

loadGameboyGames();
