const consoleSearch = document.querySelector("#console-search");
const makerFilter = document.querySelector("#console-maker-filter");
const typeFilter = document.querySelector("#console-type-filter");
const demandFilter = document.querySelector("#console-demand-filter");
const consoleGrid = document.querySelector("#console-grid");
const consoleSummary = document.querySelector("#console-summary");

let consoles = [];
const imageCacheKey = "gcx-console-images-v1";
const wikiTitlesByConsoleId = {
  "nintendo-switch-2": "Nintendo Switch 2",
  "nintendo-switch-oled": "Nintendo Switch OLED Model",
  "nintendo-switch": "Nintendo Switch",
  "nintendo-switch-lite": "Nintendo Switch Lite",
  "playstation-5": "PlayStation 5",
  "playstation-5-slim": "PlayStation 5",
  "playstation-5-pro": "PlayStation 5 Pro",
  "xbox-series-x": "Xbox Series X and Series S",
  "xbox-series-s": "Xbox Series X and Series S",
  "steam-deck-oled": "Steam Deck",
  "steam-deck": "Steam Deck",
  "asus-rog-ally": "ROG Ally",
  "playstation-4-pro": "PlayStation 4 Pro",
  "playstation-4": "PlayStation 4",
  "xbox-one-x": "Xbox One X",
  "wii-u": "Wii U",
  "nintendo-3ds-xl": "New Nintendo 3DS",
  "playstation-vita": "PlayStation Vita",
  "playstation-3": "PlayStation 3",
  "xbox-360": "Xbox 360",
  "nintendo-wii": "Wii",
  "nintendo-ds-lite": "Nintendo DS Lite",
  psp: "PlayStation Portable",
  "playstation-2": "PlayStation 2",
  "nintendo-gamecube": "GameCube",
  "original-xbox": "Xbox (console)",
  "sega-dreamcast": "Dreamcast",
  "game-boy-advance-sp": "Game Boy Advance SP",
  "game-boy-advance": "Game Boy Advance",
  playstation: "PlayStation (console)",
  "nintendo-64": "Nintendo 64",
  "sega-saturn": "Sega Saturn",
  "atari-jaguar": "Atari Jaguar",
  "game-boy-color": "Game Boy Color",
  "super-nintendo": "Super Nintendo Entertainment System",
  "sega-genesis": "Sega Genesis",
  "turbografx-16": "TurboGrafx-16",
  "neo-geo-aes": "Neo Geo (system)",
  "game-boy": "Game Boy",
  nes: "Nintendo Entertainment System",
  "sega-master-system": "Master System",
  "atari-7800": "Atari 7800",
  "atari-2600": "Atari 2600",
  intellivision: "Intellivision",
  colecovision: "ColecoVision",
};

const gameLibraryByConsoleId = {
  "nintendo-switch-2": { label: "Switch 2 game library", url: "switch2.html" },
  "nintendo-switch-oled": { label: "Switch game library", url: "switch.html" },
  "nintendo-switch": { label: "Switch game library", url: "switch.html" },
  "nintendo-switch-lite": { label: "Switch game library", url: "switch.html" },
  "playstation-5": { label: "PS5 game library", url: "ps5.html" },
  "playstation-5-slim": { label: "PS5 game library", url: "ps5.html" },
  "playstation-5-pro": { label: "PS5 game library", url: "ps5.html" },
  "playstation-4-pro": { label: "PS4 game library", url: "ps4.html" },
  "playstation-4": { label: "PS4 game library", url: "ps4.html" },
  "nintendo-3ds-xl": { label: "Nintendo 3DS game library", url: "3ds.html" },
  "playstation-vita": { label: "Vita game library", url: "vita.html" },
  "playstation-3": { label: "PS3 game library", url: "ps3.html" },
  "xbox-360": { label: "Xbox 360 game library", url: "xbox360.html" },
  "nintendo-wii": { label: "Wii game library", url: "wii.html" },
  "nintendo-ds-lite": { label: "Nintendo DS game library", url: "ds.html" },
  psp: { label: "PSP game library", url: "psp.html" },
  "playstation-2": { label: "PS2 game library", url: "ps2.html" },
  "nintendo-gamecube": { label: "GameCube game library", url: "gamecube.html" },
  "original-xbox": { label: "Original Xbox game library", url: "xbox.html" },
  "sega-dreamcast": { label: "Dreamcast game library", url: "dreamcast.html" },
  "game-boy-advance-sp": { label: "Game Boy Advance game library", url: "gba.html" },
  "game-boy-advance": { label: "Game Boy Advance game library", url: "gba.html" },
  playstation: { label: "PS1 game library", url: "ps1.html" },
  "nintendo-64": { label: "Nintendo 64 game library", url: "n64.html" },
  "sega-saturn": { label: "Sega Saturn game library", url: "saturn.html" },
  "game-boy-color": { label: "Game Boy / Color game library", url: "gameboy.html" },
  "super-nintendo": { label: "SNES game library", url: "snes.html" },
  "sega-genesis": { label: "Genesis game library", url: "genesis.html" },
  "game-boy": { label: "Game Boy / Color game library", url: "gameboy.html" },
  nes: { label: "NES game library", url: "nes.html" },
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

function uniqueValues(key) {
  return Array.from(new Set(consoles.map((item) => item[key]).filter(Boolean))).sort();
}

function fillFilter(select, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  });
}

function getGameLibraryLink(consoleItem) {
  return gameLibraryByConsoleId[consoleItem.id] || null;
}

function readImageCache() {
  try {
    return JSON.parse(localStorage.getItem(imageCacheKey) || "{}");
  } catch (error) {
    return {};
  }
}

function writeImageCache(cache) {
  try {
    localStorage.setItem(imageCacheKey, JSON.stringify(cache));
  } catch (error) {
    // Images still work for this session if localStorage is unavailable.
  }
}

async function fetchConsoleImage(consoleItem, cache) {
  if (consoleItem.imageUrl) {
    return {
      imageUrl: consoleItem.imageUrl,
      sourceUrl: consoleItem.imageSourceUrl || "",
    };
  }

  if (cache[consoleItem.id]) {
    return cache[consoleItem.id];
  }

  const title = wikiTitlesByConsoleId[consoleItem.id] || consoleItem.name;
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

  cache[consoleItem.id] = {
    imageUrl,
    sourceUrl,
  };

  return cache[consoleItem.id];
}

async function hydrateConsoleImages() {
  const cache = readImageCache();
  const imageResults = await Promise.allSettled(consoles.map((item) => fetchConsoleImage(item, cache)));

  imageResults.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      consoles[index].imageUrl = result.value.imageUrl;
      consoles[index].imageSourceUrl = result.value.sourceUrl;
    }
  });

  writeImageCache(cache);
  renderConsoles();
}

function consoleMatches(consoleItem) {
  const query = normalize(consoleSearch.value);
  const maker = makerFilter.value;
  const type = typeFilter.value;
  const demand = demandFilter.value;
  const haystack = normalize(
    [
      consoleItem.name,
      consoleItem.manufacturer,
      consoleItem.type,
      consoleItem.generation,
      consoleItem.releaseYear,
      consoleItem.media,
      consoleItem.marketTier,
      consoleItem.tags?.join(" "),
      consoleItem.tradeNotes,
    ].join(" ")
  );

  return (
    (!query || haystack.includes(query)) &&
    (maker === "all" || consoleItem.manufacturer === maker) &&
    (type === "all" || consoleItem.type === type) &&
    (demand === "all" || consoleItem.marketTier === demand)
  );
}

function renderConsoles() {
  const visible = consoles.filter(consoleMatches);
  consoleSummary.textContent = `${visible.length} of ${consoles.length} consoles shown`;

  if (!visible.length) {
    consoleGrid.innerHTML = `<div class="index-message">No consoles matched those filters.</div>`;
    return;
  }

  consoleGrid.innerHTML = visible
    .map((item) => {
      const initials = item.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((word) => word[0])
        .join("");
      const tags = (item.tags || []).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
      const detailUrl = `console.html?id=${encodeURIComponent(item.id)}`;
      const imageMarkup = item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)} console image" loading="lazy" />`
        : `<span class="image-fallback image-fallback-console" role="img" aria-label="${escapeHtml(item.name)} console image approval pending">${escapeHtml(initials)}</span>`;
      const sourceMarkup = item.imageSourceUrl
        ? `<a href="${escapeHtml(item.imageSourceUrl)}" target="_blank" rel="noreferrer">Image source</a>`
        : "";
      const libraryLink = getGameLibraryLink(item);
      const libraryMarkup = libraryLink
        ? `<a class="button secondary" href="${escapeHtml(libraryLink.url)}">${escapeHtml(libraryLink.label)}</a>`
        : "";

      return `
        <article class="console-card">
          <a class="console-art" href="${detailUrl}" aria-label="View ${escapeHtml(item.name)} details">
            ${imageMarkup}
          </a>
          <div class="console-card-copy">
            <div class="console-card-topline">
              <span>${escapeHtml(item.manufacturer)}</span>
              <span>${escapeHtml(item.releaseYear)}</span>
            </div>
            <h2><a href="${detailUrl}">${escapeHtml(item.name)}</a></h2>
            <p>${escapeHtml(item.type)} - ${escapeHtml(item.generation)} - ${escapeHtml(item.media)}</p>
            <div class="console-tags">${tags}</div>
            <div class="console-trade">
              <strong>${escapeHtml(item.marketTier)}</strong>
              <p>${escapeHtml(item.tradeNotes)}</p>
            </div>
            ${sourceMarkup ? `<div class="console-source">${sourceMarkup}</div>` : ""}
            <div class="console-card-actions">
              ${libraryMarkup}
              <button class="button" type="button" data-console-id="${escapeHtml(item.id)}">Join beta waitlist</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadConsoles() {
  try {
    const response = await fetch("data/consoles.json");

    if (!response.ok) {
      throw new Error(`Could not load consoles: ${response.status}`);
    }

    consoles = await response.json();
    fillFilter(makerFilter, uniqueValues("manufacturer"));
    fillFilter(typeFilter, uniqueValues("type"));
    fillFilter(demandFilter, uniqueValues("marketTier"));
    renderConsoles();
    hydrateConsoleImages();
  } catch (error) {
    consoleSummary.textContent = "Console data could not be loaded.";
    consoleGrid.innerHTML = `<div class="index-message">Try refreshing the page.</div>`;
  }
}

[consoleSearch, makerFilter, typeFilter, demandFilter].forEach((control) => {
  control.addEventListener("input", renderConsoles);
  control.addEventListener("change", renderConsoles);
});

consoleGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-console-id]");
  if (!button) return;
  const consoleItem = consoles.find((item) => item.id === button.dataset.consoleId);
  if (!consoleItem) return;

  window.location.href = `index.html?tradeConsole=${encodeURIComponent(consoleItem.id)}#cards`;
});

loadConsoles();
