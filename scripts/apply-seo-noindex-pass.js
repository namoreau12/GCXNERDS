const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");

const noindexPages = [
  "3ds-game.html",
  "card.html",
  "console.html",
  "dreamcast-game.html",
  "ds-game.html",
  "game.html",
  "gameboy-game.html",
  "gamecube-game.html",
  "gba-game.html",
  "genesis-game.html",
  "magic-card.html",
  "n64-game.html",
  "nes-game.html",
  "ps1-game.html",
  "ps2-game.html",
  "ps3-game.html",
  "ps4-game.html",
  "ps5-game.html",
  "psp-game.html",
  "saturn-game.html",
  "snes-game.html",
  "streamer.html",
  "switch-game.html",
  "switch2-game.html",
  "vita-game.html",
  "wii-game.html",
  "xbox-game.html",
  "xbox360-game.html",
  "yugioh-card.html",
];

function ensureNoindex(html) {
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) return html;
  const robots = '    <meta name="robots" content="noindex, follow" />\n';
  if (/<meta\s+name="description"[^>]*>\s*/i.test(html)) {
    return html.replace(/(<meta\s+name="description"[^>]*>\s*)/i, `$1\n${robots}`);
  }
  return html.replace(/(<meta\s+name="viewport"[^>]*>\s*)/i, `$1\n${robots}`);
}

let changed = 0;
noindexPages.forEach((fileName) => {
  const filePath = path.join(rootDir, fileName);
  const before = fs.readFileSync(filePath, "utf8");
  const after = ensureNoindex(before);
  if (after !== before) {
    fs.writeFileSync(filePath, after);
    changed += 1;
  }
});

console.log(JSON.stringify({ changed, checked: noindexPages.length }, null, 2));
