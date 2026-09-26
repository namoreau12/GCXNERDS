const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const labels = {
  "3ds": "3DS",
  dreamcast: "Dreamcast",
  ds: "DS",
  gameboy: "Game Boy",
  gamecube: "GameCube",
  gba: "GBA",
  genesis: "Genesis",
  n64: "N64",
  nes: "NES",
  ps1: "PS1",
  ps2: "PS2",
  ps3: "PS3",
  ps4: "PS4",
  ps5: "PS5",
  psp: "PSP",
  saturn: "Saturn",
  snes: "SNES",
  switch: "Switch",
  switch2: "Switch 2",
  vita: "PS Vita",
  wii: "Wii",
  xbox: "Original Xbox",
  xbox360: "Xbox 360",
};

function platformSlug(fileName) {
  return fileName.replace(/-game\.js$|\.js$/g, "");
}

function replacementStatusFunctions() {
  return `function editorialStatus(game) {
  return window.GCX_GAME_COPY?.status(game) || "needs_editorial";
}

function editorialStatusLabel(status) {
  return window.GCX_GAME_COPY?.statusLabel(status) || (status === "published" ? "Published overview" : "In editorial review");
}`;
}

function apply(fileName) {
  const filePath = path.join(rootDir, fileName);
  const label = labels[platformSlug(fileName)] || "game";
  let source = fs.readFileSync(filePath, "utf8");
  const before = source;

  source = source.replace(
    /function editorialStatus\(game\) \{[\s\S]*?\n\}\n\nfunction editorialStatusLabel\(status\) \{[\s\S]*?\n\}/g,
    replacementStatusFunctions()
  );

  source = source.replace(
    /const overview = game\.descriptionProvider && game\.description \? game\.description : "Editorial overview coming soon\.";/g,
    `const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "${label}") || "Editorial overview in review.";`
  );

  source = source.replace(
    /const overview = game\.descriptionProvider && game\.description\s*\? game\.description\s*: "Editorial overview coming soon\.";/g,
    `const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "${label}") || "Editorial overview in review.";`
  );

  source = source.replace(
    /const hasPublishedOverview = game\.overviewStatus === "published" \|\| \(game\.descriptionProvider && game\.description && game\.overviewStatus !== "needs_editorial"\);\n\s*const overview = hasPublishedOverview \? game\.description : "([^"]*)";/g,
    `const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "${label}") || "$1";`
  );

  source = source.replace(
    /const hasPublishedOverview = [^;]+;\n\s*const overview = hasPublishedOverview\s*\n\s*\?\s*game\.description\s*\n\s*:\s*"([^"]*)";/g,
    `const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "${label}") || "$1";`
  );

  source = source.replace(
    /const hasPublishedOverview = game\.descriptionProvider && game\.description && game\.overviewStatus !== "needs_editorial";\n\s*const overview = hasPublishedOverview\s*\? game\.description\s*: "([^"]*)";/g,
    `const hasPublishedOverview = window.GCX_GAME_COPY?.status(game) === "published";
  const overview = window.GCX_GAME_COPY?.overviewDisplay(game, "${label}") || "$1";`
  );

  source = source.replace(
    /<div class="console-detail-note">\$\{escapeHtml\(game\.descriptionProvider \? game\.description : "([^"]*)"\)\}<\/div>/g,
    `<div class="console-detail-note">\${escapeHtml(window.GCX_GAME_COPY?.overviewDisplay(game, "${label}") || "$1")}</div>`
  );

  source = source.replace(
    /hasPublishedOverview \? "Published overview" : "Needs overview"/g,
    `window.GCX_GAME_COPY?.statusLabel(hasPublishedOverview ? "published" : "needs_editorial") || (hasPublishedOverview ? "Published overview" : "In editorial review")`
  );

  if (source !== before) fs.writeFileSync(filePath, source, "utf8");
  return source !== before;
}

function main() {
  const files = Object.keys(labels)
    .flatMap((slug) => [`${slug}.js`, `${slug}-game.js`])
    .filter((fileName) => fs.existsSync(path.join(rootDir, fileName)));
  const changed = files.filter(apply);
  console.log(JSON.stringify({ changedCount: changed.length, changed }, null, 2));
}

main();
