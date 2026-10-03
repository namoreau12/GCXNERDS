const detailTarget = document.querySelector("#console-detail");
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
  "nintendo-switch-2": { label: "View Switch 2 game library", url: "switch2.html" },
  "nintendo-switch-oled": { label: "View Switch game library", url: "switch.html" },
  "nintendo-switch": { label: "View Switch game library", url: "switch.html" },
  "nintendo-switch-lite": { label: "View Switch game library", url: "switch.html" },
  "playstation-5": { label: "View PS5 game library", url: "ps5.html" },
  "playstation-5-slim": { label: "View PS5 game library", url: "ps5.html" },
  "playstation-5-pro": { label: "View PS5 game library", url: "ps5.html" },
  "playstation-4-pro": { label: "View PS4 game library", url: "ps4.html" },
  "playstation-4": { label: "View PS4 game library", url: "ps4.html" },
  "nintendo-3ds-xl": { label: "View Nintendo 3DS game library", url: "3ds.html" },
  "playstation-vita": { label: "View Vita game library", url: "vita.html" },
  "playstation-3": { label: "View PS3 game library", url: "ps3.html" },
  "xbox-360": { label: "View Xbox 360 game library", url: "xbox360.html" },
  "nintendo-wii": { label: "View Wii game library", url: "wii.html" },
  "nintendo-ds-lite": { label: "View Nintendo DS game library", url: "ds.html" },
  psp: { label: "View PSP game library", url: "psp.html" },
  "playstation-2": { label: "View PS2 game library", url: "ps2.html" },
  "nintendo-gamecube": { label: "View GameCube game library", url: "gamecube.html" },
  "original-xbox": { label: "View Original Xbox game library", url: "xbox.html" },
  "sega-dreamcast": { label: "View Dreamcast game library", url: "dreamcast.html" },
  "game-boy-advance-sp": { label: "View Game Boy Advance game library", url: "gba.html" },
  "game-boy-advance": { label: "View Game Boy Advance game library", url: "gba.html" },
  playstation: { label: "View PS1 game library", url: "ps1.html" },
  "nintendo-64": { label: "View Nintendo 64 game library", url: "n64.html" },
  "sega-saturn": { label: "View Sega Saturn game library", url: "saturn.html" },
  "game-boy-color": { label: "View Game Boy / Color game library", url: "gameboy.html" },
  "super-nintendo": { label: "View SNES game library", url: "snes.html" },
  "sega-genesis": { label: "View Genesis game library", url: "genesis.html" },
  "game-boy": { label: "View Game Boy / Color game library", url: "gameboy.html" },
  nes: { label: "View NES game library", url: "nes.html" },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    // The fallback artwork still renders without localStorage.
  }
}

function getGameLibraryLink(consoleItem) {
  return gameLibraryByConsoleId[consoleItem.id] || null;
}

async function fetchConsoleImage(consoleItem) {
  if (consoleItem.imageUrl) {
    return {
      imageUrl: consoleItem.imageUrl,
      sourceUrl: consoleItem.imageSourceUrl || "",
    };
  }

  const cache = readImageCache();

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
  writeImageCache(cache);

  return cache[consoleItem.id];
}

function getChecklist(consoleItem) {
  const base = ["Power on and test video/audio output", "Confirm included cables, controllers, storage, and charger", "Photograph serial/model labels and any cosmetic wear"];
  const tags = new Set(consoleItem.tags || []);
  const checks = [...base];

  if (tags.has("handheld") || consoleItem.type.includes("Handheld")) {
    checks.push("Check screen, battery, buttons, sticks, hinges, and charger port");
  }

  if (tags.has("disc") || consoleItem.media.toLowerCase().includes("disc") || consoleItem.media.toLowerCase().includes("blu-ray") || consoleItem.media.toLowerCase().includes("dvd")) {
    checks.push("Test disc drive with a known working game or movie");
  }

  if (tags.has("nintendo") || consoleItem.manufacturer === "Nintendo") {
    checks.push("List region, special edition color, controller drift, and original dock/accessories when relevant");
  }

  if (tags.has("collector") || consoleItem.marketTier.toLowerCase().includes("collector")) {
    checks.push("Include box, manuals, inserts, and authenticity notes if available");
  }

  return Array.from(new Set(checks));
}

function renderDetail(consoleItem, imageData) {
  document.title = `${consoleItem.name} | Games Exchange`;

  const tags = (consoleItem.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const checks = getChecklist(consoleItem).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const imageMarkup = imageData?.imageUrl
    ? `<img src="${escapeHtml(imageData.imageUrl)}" alt="${escapeHtml(consoleItem.name)} console image" />`
    : `<span>${escapeHtml(consoleItem.name.split(/\s+/).slice(0, 3).map((word) => word[0]).join(""))}</span>`;
  const imageSource = imageData?.sourceUrl
    ? `<a href="${escapeHtml(imageData.sourceUrl)}" target="_blank" rel="noreferrer">Image source</a>`
    : "";
  const libraryLink = getGameLibraryLink(consoleItem);
  const libraryAction = libraryLink
    ? `<a class="button secondary" href="${escapeHtml(libraryLink.url)}">${escapeHtml(libraryLink.label)}</a>`
    : "";

  detailTarget.innerHTML = `
    <div class="console-detail-media">
      ${imageMarkup}
      ${imageSource}
    </div>
    <div class="console-detail-copy">
      <p class="kicker">${escapeHtml(consoleItem.manufacturer)}</p>
      <h1>${escapeHtml(consoleItem.name)}</h1>
      <p>${escapeHtml(consoleItem.type)} - ${escapeHtml(consoleItem.generation)} generation - Released ${escapeHtml(consoleItem.releaseYear)}</p>

      <div class="detail-meta">
        <span>${escapeHtml(consoleItem.media)}</span>
        <span>${escapeHtml(consoleItem.marketTier)}</span>
      </div>

      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(consoleItem.tradeNotes)}</div>

      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>

      <p class="detail-section-title">Tags</p>
      <div class="console-tags">${tags}</div>

      <div class="detail-actions">
        ${libraryAction}
        <a class="button list-trade-button" href="index.html?tradeConsole=${encodeURIComponent(consoleItem.id)}#cards">
          Join beta waitlist
        </a>
      </div>
    </div>
  `;
}

async function loadConsoleDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    detailTarget.innerHTML = `<div class="index-message">No console was selected.</div>`;
    return;
  }

  try {
    const response = await fetch("data/consoles.json");
    const consoles = await response.json();
    const consoleItem = consoles.find((item) => item.id === id);

    if (!consoleItem) {
      detailTarget.innerHTML = `<div class="index-message">Console not found.</div>`;
      return;
    }

    const imageData = await fetchConsoleImage(consoleItem);
    renderDetail(consoleItem, imageData);
  } catch (error) {
    detailTarget.innerHTML = `<div class="index-message">This console could not be loaded right now.</div>`;
  }
}

loadConsoleDetail();
