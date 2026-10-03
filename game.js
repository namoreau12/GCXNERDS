const gameDetailTarget = document.querySelector("#game-detail");
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getChecklist(game) {
  const checks = ["Verify platform and region", "Photograph front, back, spine, disc/cartridge, and inserts", "Describe case, label, manual, map, code, and box condition"];
  const format = game.format.toLowerCase();

  if (format.includes("disc") || format.includes("dvd") || format.includes("cd")) {
    checks.push("Check discs for scratches, resurfacing, cracks, and read errors");
  }

  if (format.includes("cartridge") || format.includes("game card")) {
    checks.push("Check label wear, shell damage, pins/contacts, and authenticity");
  }

  if (game.demandTier.toLowerCase().includes("collector") || game.demandTier.toLowerCase().includes("premium")) {
    checks.push("List black-label/greatest-hits/player's-choice status and any collector edition contents");
  }

  return Array.from(new Set(checks));
}

function communityShareLink({ shareUrl, title, body, category }) {
  const params = new URLSearchParams({
    shareUrl,
    title,
    body,
    category,
  });
  return `community.html?${params.toString()}`;
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

async function fetchGameImage(game) {
  const cache = readImageCache();

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
  writeImageCache(cache);

  return cache[game.id];
}

function renderGame(game, imageData) {
  document.title = `${game.title} | Games Exchange`;

  const tags = (game.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const checks = getChecklist(game).map((check) => `<li>${escapeHtml(check)}</li>`).join("");
  const gameUrl = `game.html?id=${encodeURIComponent(game.id)}`;
  const shareBody = `${game.summary || "Found this game in the GCX library."} ${game.platforms?.length ? `Platform: ${game.platforms.join(", ")}.` : ""}`.trim();
  const shareLink = communityShareLink({
    shareUrl: gameUrl,
    title: `Let's talk about ${game.title}`,
    body: shareBody,
    category: "Games",
  });
  const initials = game.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("");

  const imageMarkup = imageData?.imageUrl
    ? `<img src="${escapeHtml(imageData.imageUrl)}" alt="${escapeHtml(game.title)} box art" />`
    : `<span class="image-fallback image-fallback-game" role="img" aria-label="${escapeHtml(game.title)} box art pending review">${escapeHtml(initials)}</span>`;
  const imageSource = imageData?.sourceUrl
    ? `<a href="${escapeHtml(imageData.sourceUrl)}" target="_blank" rel="noreferrer">Image source</a>`
    : "";

  gameDetailTarget.innerHTML = `
    <div class="game-detail-art">
      ${imageMarkup}
      ${imageSource}
    </div>
    <div class="console-detail-copy">
      <p class="kicker">${escapeHtml(game.franchise)}</p>
      <h1>${escapeHtml(game.title)}</h1>
      <p>${escapeHtml(game.platforms.join(", "))} - Released ${escapeHtml(game.releaseYear)}</p>

      <div class="detail-meta">
        <span>${escapeHtml(game.developer)}</span>
        <span>${escapeHtml(game.publisher)}</span>
        <span>${escapeHtml(game.format)}</span>
        <span>${escapeHtml(game.demandTier)}</span>
      </div>

      <p class="detail-section-title">Overview</p>
      <div class="console-detail-note">${escapeHtml(game.summary)}</div>

      <p class="detail-section-title">Marketplace Notes</p>
      <div class="console-detail-note">${escapeHtml(game.tradeNotes)}</div>

      <p class="detail-section-title">Buyer/Seller Checklist</p>
      <ul class="console-checklist">${checks}</ul>

      <p class="detail-section-title">Genres & Tags</p>
      <div class="console-tags">
        ${game.genres.map((genre) => `<span>${escapeHtml(genre)}</span>`).join("")}
        ${tags}
      </div>

      <div class="detail-actions">
        <a class="button list-trade-button" href="index.html?tradeGame=${encodeURIComponent(game.id)}#cards">
          Join beta waitlist</a>
        <a class="button secondary" href="${escapeHtml(shareLink)}">Share to community</a>
      </div>
    </div>
  `;
}

async function loadGameDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    gameDetailTarget.innerHTML = `<div class="index-message">No game was selected.</div>`;
    return;
  }

  try {
    const response = await fetch("data/games.json");
    const games = await response.json();
    const game = games.find((item) => item.id === id);

    if (!game) {
      gameDetailTarget.innerHTML = `<div class="index-message">Game not found.</div>`;
      return;
    }

    const imageData = await fetchGameImage(game);
    renderGame(game, imageData);
  } catch (error) {
    gameDetailTarget.innerHTML = `<div class="index-message">This game could not be loaded right now.</div>`;
  }
}

loadGameDetail();
