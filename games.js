const gameSearch = document.querySelector("#game-search");
const platformFilter = document.querySelector("#game-platform-filter");
const eraFilter = document.querySelector("#game-era-filter");
const demandFilter = document.querySelector("#game-demand-filter");
const gameGrid = document.querySelector("#game-grid");
const gameSummary = document.querySelector("#game-summary");
const gameOverviewStrip = document.querySelector("#game-overview-strip");

let games = [];
const gameImageCacheKey = "gcx-game-images-v1";
const wikiTitlesByGameId = {
  "the-legend-of-zelda-ocarina-of-time": "The Legend of Zelda: Ocarina of Time",
  "super-mario-64": "Super Mario 64",
  "pokemon-red": "Pokemon Red and Blue",
  "pokemon-blue": "Pokemon Red and Blue",
  "pokemon-yellow": "Pokemon Yellow",
  "chrono-trigger": "Chrono Trigger",
  earthbound: "EarthBound",
  "final-fantasy-vii": "Final Fantasy VII",
  "metal-gear-solid": "Metal Gear Solid (1998 video game)",
  "silent-hill-2": "Silent Hill 2",
  "resident-evil-4": "Resident Evil 4",
  "super-smash-bros-melee": "Super Smash Bros. Melee",
  "the-legend-of-zelda-the-wind-waker": "The Legend of Zelda: The Wind Waker",
  "halo-combat-evolved": "Halo: Combat Evolved",
  "halo-3": "Halo 3",
  "the-elder-scrolls-v-skyrim": "The Elder Scrolls V: Skyrim",
  "grand-theft-auto-v": "Grand Theft Auto V",
  "the-last-of-us": "The Last of Us (video game)",
  "god-of-war-2018": "God of War (2018 video game)",
  "elden-ring": "Elden Ring",
  "the-legend-of-zelda-breath-of-the-wild": "The Legend of Zelda: Breath of the Wild",
  "the-legend-of-zelda-tears-of-the-kingdom": "The Legend of Zelda: Tears of the Kingdom",
  "mario-kart-8-deluxe": "Mario Kart 8",
  "animal-crossing-new-horizons": "Animal Crossing: New Horizons",
  "super-smash-bros-ultimate": "Super Smash Bros. Ultimate",
  "pokemon-scarlet": "Pokemon Scarlet and Violet",
  "pokemon-violet": "Pokemon Scarlet and Violet",
  minecraft: "Minecraft",
  fortnite: "Fortnite",
  "counter-strike-2": "Counter-Strike 2",
  "helldivers-2": "Helldivers 2",
  "marvel-rivals": "Marvel Rivals",
  "grand-theft-auto-vi": "Grand Theft Auto VI",
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uniqueList(values) {
  return Array.from(new Set(values.flat().filter(Boolean))).sort();
}

function fillFilter(select, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function readImageCache() {
  try {
    return JSON.parse(localStorage.getItem(gameImageCacheKey) || "{}");
  } catch (error) {
    return {};
  }
}

function writeImageCache(cache) {
  try {
    localStorage.setItem(gameImageCacheKey, JSON.stringify(cache));
  } catch (error) {
    // Fallback art still renders if localStorage is unavailable.
  }
}

async function fetchGameImage(game, cache) {
  if (cache[game.id]) {
    return cache[game.id];
  }

  const title = wikiTitlesByGameId[game.id] || game.title;
  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);

  if (!response.ok) {
    return null;
  }

  const summary = await response.json();
  const imageUrl = summary.thumbnail?.source || summary.originalimage?.source || "";
  const sourceUrl = summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;

  if (!imageUrl) {
    return null;
  }

  cache[game.id] = {
    imageUrl,
    sourceUrl,
  };

  return cache[game.id];
}

async function hydrateGameImages() {
  const cache = readImageCache();
  const imageResults = await Promise.allSettled(games.map((game) => fetchGameImage(game, cache)));

  imageResults.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      games[index].imageUrl = result.value.imageUrl;
      games[index].imageSourceUrl = result.value.sourceUrl;
    }
  });

  writeImageCache(cache);
  renderGames();
}

function gameMatches(game) {
  const query = normalize(gameSearch.value);
  const platform = platformFilter.value;
  const era = eraFilter.value;
  const demand = demandFilter.value;
  const haystack = normalize(
    [
      game.title,
      game.franchise,
      game.developer,
      game.publisher,
      game.releaseYear,
      game.platforms?.join(" "),
      game.genres?.join(" "),
      game.format,
      game.era,
      game.demandTier,
      game.tags?.join(" "),
      game.summary,
      game.tradeNotes,
    ].join(" ")
  );

  return (
    (!query || haystack.includes(query)) &&
    (platform === "all" || game.platforms?.includes(platform)) &&
    (era === "all" || game.era === era) &&
    (demand === "all" || game.demandTier === demand)
  );
}

function renderGameOverview() {
  if (!gameOverviewStrip || !games.length) return;
  const platforms = uniqueList(games.map((game) => game.platforms));
  const staples = games.filter((game) => normalize(game.demandTier).includes("staple")).length;
  const recent = games
    .slice()
    .sort((a, b) => Number(b.releaseYear || 0) - Number(a.releaseYear || 0))[0]?.releaseYear;
  const values = [
    [games.length.toLocaleString(), "indexed games"],
    [platforms.length.toLocaleString(), "platforms"],
    [staples.toLocaleString(), "collector staples"],
    [recent || "Live", "recently updated"],
  ];

  gameOverviewStrip.innerHTML = values
    .map(
      ([value, label]) => `
        <article>
          <strong>${escapeHtml(value)}</strong>
          <span>${escapeHtml(label)}</span>
        </article>
      `
    )
    .join("");
}

function renderGames() {
  const visible = games.filter(gameMatches);
  gameSummary.textContent = `${visible.length} of ${games.length} games shown`;

  if (!visible.length) {
    gameGrid.innerHTML = `<div class="index-message">No games matched those filters.</div>`;
    return;
  }

  gameGrid.innerHTML = visible
    .map((game) => {
      const detailUrl = `game.html?id=${encodeURIComponent(game.id)}`;
      const initials = game.title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((word) => word[0])
        .join("");
      const tags = (game.tags || []).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
      const noStandardBoxArt = String(game.imageAvailabilityStatus || "").toLowerCase() === "no_standard_retail_box_art";
      const imageMarkup = game.imageUrl
        ? `<img src="${escapeHtml(game.imageUrl)}" alt="${escapeHtml(game.title)} box art" loading="lazy" />`
        : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} ${noStandardBoxArt ? "standard retail box art not confirmed" : "box art approval pending"}">${escapeHtml(initials)}</span>`;
      const sourceMarkup = game.imageSourceUrl
        ? `<a href="${escapeHtml(game.imageSourceUrl)}" target="_blank" rel="noreferrer">Image source</a>`
        : game.imageAvailabilitySourceUrl
        ? `<a href="${escapeHtml(game.imageAvailabilitySourceUrl)}" target="_blank" rel="noreferrer">Image status source</a>`
        : "";

      return `
        <article class="game-db-card">
          <a class="game-box-art" href="${detailUrl}" aria-label="View ${escapeHtml(game.title)} details">
            ${imageMarkup}
          </a>
          <div class="game-db-copy">
            <div class="console-card-topline">
              <span>${escapeHtml(game.releaseYear)}</span>
              <span>${escapeHtml(game.era)}</span>
            </div>
            <h2><a href="${detailUrl}">${escapeHtml(game.title)}</a></h2>
            <p>${escapeHtml(game.platforms.join(", "))}</p>
            <p>${escapeHtml(game.genres.join(", "))} - ${escapeHtml(game.format)}</p>
            ${
              noStandardBoxArt
                ? `<p class="game-image-status">${escapeHtml(game.imageAvailabilityReason || "Standard retail box art has not been confirmed for this release.")}</p>`
                : ""
            }
            <div class="console-tags">${tags}</div>
            <div class="console-trade">
              <strong>${escapeHtml(game.demandTier)}</strong>
              <p>${escapeHtml(game.tradeNotes)}</p>
            </div>
            ${sourceMarkup ? `<div class="console-source">${sourceMarkup}</div>` : ""}
            <button class="button" type="button" data-game-id="${escapeHtml(game.id)}">Join beta waitlist</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadGames() {
  try {
    const response = await fetch("data/games.json");

    if (!response.ok) {
      throw new Error(`Could not load games: ${response.status}`);
    }

    games = await response.json();
    fillFilter(platformFilter, uniqueList(games.map((game) => game.platforms)));
    fillFilter(eraFilter, uniqueList(games.map((game) => [game.era])));
    fillFilter(demandFilter, uniqueList(games.map((game) => [game.demandTier])));
    renderGameOverview();
    renderGames();
    hydrateGameImages();
  } catch (error) {
    gameSummary.textContent = "Game data could not be loaded.";
    gameGrid.innerHTML = `<div class="index-message">Try refreshing the page.</div>`;
  }
}

[gameSearch, platformFilter, eraFilter, demandFilter].forEach((control) => {
  control.addEventListener("input", renderGames);
  control.addEventListener("change", renderGames);
});

gameGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-game-id]");
  if (!button) return;
  const game = games.find((item) => item.id === button.dataset.gameId);
  if (!game) return;

  window.location.href = `index.html?tradeGame=${encodeURIComponent(game.id)}#cards`;
});

loadGames();
