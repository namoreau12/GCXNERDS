const snesSearch = document.querySelector("#snes-search");
const genreFilter = document.querySelector("#snes-genre-filter");
const publisherFilter = document.querySelector("#snes-publisher-filter");
const imageFilter = document.querySelector("#snes-image-filter");
const editorialFilter = document.querySelector("#snes-editorial-filter");
const snesGrid = document.querySelector("#snes-grid");
const snesSummary = document.querySelector("#snes-summary");
const snesAlphabet = document.querySelector("#snes-alphabet");
const snesLoadMore = document.querySelector("#snes-load-more");

let snesGames = [];
let activeLetter = "All";
let visibleLimit = 240;
const pageSize = 240;
const alphabet = ["All", "#", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const snesImageCacheKey = "gcx-snes-images-v1";

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

function readImageCache() {
  try {
    return JSON.parse(localStorage.getItem(snesImageCacheKey) || "{}");
  } catch (error) {
    return {};
  }
}

function writeImageCache(cache) {
  try {
    localStorage.setItem(snesImageCacheKey, JSON.stringify(cache));
  } catch (error) {
    // Fallback art still renders if localStorage is unavailable.
  }
}

function titleFromArticleUrl(articleUrl) {
  if (!articleUrl) return "";

  try {
    return decodeURIComponent(new URL(articleUrl).pathname.replace(/^\/wiki\//, ""));
  } catch (error) {
    return "";
  }
}

async function fetchSnesImage(game, cache) {
  if (game.imageUrl || cache[game.id]) {
    return game.imageUrl ? { imageUrl: game.imageUrl, sourceUrl: game.articleUrl || game.wikidataUrl } : cache[game.id];
  }

  const title = titleFromArticleUrl(game.articleUrl);
  if (!title) return null;

  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!response.ok) return null;

  const summary = await response.json();
  const imageUrl = summary.thumbnail?.source || summary.originalimage?.source || "";
  const sourceUrl = summary.content_urls?.desktop?.page || game.articleUrl;

  if (!imageUrl) return null;

  cache[game.id] = { imageUrl, sourceUrl };
  return cache[game.id];
}

async function hydrateVisibleSnesImages() {
  const cache = readImageCache();
  const visibleCards = Array.from(snesGrid.querySelectorAll("[data-snes-card-id]")).slice(0, 60);
  const visibleIds = new Set(visibleCards.map((card) => card.dataset.snesCardId));
  const visibleGames = snesGames.filter((game) => visibleIds.has(game.id));
  const results = await Promise.allSettled(visibleGames.map((game) => fetchSnesImage(game, cache)));

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      visibleGames[index].imageUrl = result.value.imageUrl;
      visibleGames[index].articleUrl = result.value.sourceUrl || visibleGames[index].articleUrl;
    }
  });

  writeImageCache(cache);

  if (results.some((result) => result.status === "fulfilled" && result.value)) {
    renderSnesGames(false);
  }
}

function snesMatches(game) {
  const query = normalize(snesSearch.value);
  const genre = genreFilter.value;
  const publisher = publisherFilter.value;
  const imageMode = imageFilter.value;
  const editorial = editorialFilter.value;

  return (
    (!query || normalize(game.searchText).includes(query)) &&
    (genre === "all" || game.genres?.includes(genre)) &&
    (publisher === "all" || game.publishers?.includes(publisher)) &&
    (imageMode === "all" || (imageMode === "with" ? Boolean(game.imageUrl) : !game.imageUrl)) &&
    (editorial === "all" || editorialStatus(game) === editorial)
  );
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

function renderAlphabet() {
  const counts = snesGames.reduce((totals, game) => {
    const bucket = titleBucket(game.title);
    totals[bucket] = (totals[bucket] || 0) + 1;
    totals.All = (totals.All || 0) + 1;
    return totals;
  }, {});

  snesAlphabet.innerHTML = alphabet
    .map((letter) => {
      const count = counts[letter] || 0;
      const activeClass = letter === activeLetter ? " is-active" : "";
      return `<button class="letter-chip${activeClass}" type="button" data-letter="${letter}" ${count ? "" : "disabled"}>${letter}<span>${count}</span></button>`;
    })
    .join("");
}

function renderSnesGames(shouldHydrateImages = true) {
  const visible = snesGames
    .filter((game) => activeLetter === "All" || titleBucket(game.title) === activeLetter)
    .filter(snesMatches);
  const shown = activeLetter === "All" ? Math.min(visible.length, visibleLimit) : visible.length;
  snesSummary.textContent = `${shown} shown of ${visible.length} matching ${activeLetter} SNES records (${snesGames.length} total)`;
  snesLoadMore.hidden = activeLetter !== "All" || shown >= visible.length;

  if (!visible.length) {
    snesGrid.innerHTML = `<div class="index-message">No ${activeLetter} SNES games matched those filters.</div>`;
    return;
  }

  snesGrid.innerHTML = visible
    .slice(0, activeLetter === "All" ? visibleLimit : visible.length)
    .map((game) => {
      const detailUrl = `snes-game.html?id=${encodeURIComponent(game.id)}`;
      const initials = game.title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((word) => word[0])
        .join("");
      const imageMarkup = game.imageUrl
        ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} image" loading="lazy" />`
        : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
      const sourceMarkup = game.articleUrl
        ? `<a href="${escapeHtml(game.articleUrl)}" target="_blank" rel="noreferrer">Source</a>`
        : "";
      const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "SNES") || "Editorial overview in review.";
      const status = editorialStatus(game);

      return `
        <article class="game-db-card" data-snes-card-id="${escapeHtml(game.id)}">
          <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">
            ${imageMarkup}
          </a>
          <div class="game-db-copy">
            <div class="console-card-topline">
              <span>${escapeHtml(game.releaseYears?.[0] || "Year unknown")}</span>
              <span>SNES</span>
            </div>
            <div class="console-tags">
              <span>${escapeHtml(editorialStatusLabel(status))}</span>
            </div>
            <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
            <p>${escapeHtml(overview)}</p>
            <p>${escapeHtml((game.genres || []).slice(0, 2).join(", ") || "Genre unknown")}</p>
            <p>${escapeHtml((game.publishers || []).slice(0, 2).join(", ") || "Publisher unknown")}</p>
            <div class="console-trade">
              <strong>${escapeHtml(game.demandTier)}</strong>
              <p>${escapeHtml(game.tradeNotes)}</p>
            </div>
            ${sourceMarkup ? `<div class="console-source">${sourceMarkup}</div>` : ""}
            <button class="button" type="button" data-snes-id="${escapeHtml(game.id)}">Join beta waitlist</button>
          </div>
        </article>
      `;
    })
    .join("");

  if (shouldHydrateImages) {
    hydrateVisibleSnesImages();
  }
}

async function loadSnesGames() {
  try {
    const response = await fetch("data/games/snes.json?v=3", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load SNES data: ${response.status}`);
    }

    snesGames = await response.json();
    fillFilter(genreFilter, uniqueList(snesGames.map((game) => game.genres)));
    fillFilter(publisherFilter, uniqueList(snesGames.map((game) => game.publishers)));
    renderAlphabet();
    renderSnesGames();
  } catch (error) {
    snesSummary.textContent = "SNES data could not be loaded.";
    snesGrid.innerHTML = `<div class="index-message">Try refreshing the page.</div>`;
  }
}

[snesSearch, genreFilter, publisherFilter, imageFilter, editorialFilter].forEach((control) => {
  control.addEventListener("input", () => {
    visibleLimit = pageSize;
    renderSnesGames();
  });
  control.addEventListener("change", () => {
    visibleLimit = pageSize;
    renderSnesGames();
  });
});

snesAlphabet.addEventListener("click", (event) => {
  const button = event.target.closest("[data-letter]");
  if (!button || button.disabled) return;
  activeLetter = button.dataset.letter;
  visibleLimit = pageSize;
  renderAlphabet();
  renderSnesGames();
});

snesLoadMore.addEventListener("click", () => {
  visibleLimit += pageSize;
  renderSnesGames();
});

snesGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-snes-id]");
  if (!button) return;
  const game = snesGames.find((item) => item.id === button.dataset.snesId);
  if (!game) return;

  window.location.href = `index.html?tradeSnesGame=${encodeURIComponent(game.id)}#cards`;
});

loadSnesGames();
