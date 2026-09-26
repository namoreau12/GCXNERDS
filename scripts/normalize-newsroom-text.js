const fs = require("node:fs");
const path = require("node:path");

const filePath = path.join(__dirname, "..", "data", "newsroom.json");
let text = fs.readFileSync(filePath, "utf8");

const replacements = new Map([
  ["PokÃ©mon", "Pokemon"],
  ["PokÃƒÂ©mon", "Pokemon"],
  ["PokÃƒÂ©", "Poke"],
  ["Ã©", "e"],
  ["Ã‰", "E"],
  ["Ã¨", "e"],
  ["Ã¡", "a"],
  ["Ã³", "o"],
  ["Ãº", "u"],
  ["Ã±", "n"],
  ["Â®", "(R)"],
  ["Â©", "(C)"],
  ["Â ", " "],
  ["â€”", "-"],
  ["â€“", "-"],
  ["â€˜", "'"],
  ["â€™", "'"],
  ["â€œ", "\""],
  ["â€�", "\""],
  ["â€¦", "..."],
  ["Ã¢â‚¬â€", "-"],
  ["Ã¢â‚¬â€œ", "-"],
  ["Ã¢â‚¬Å“", "\""],
  ["Ã¢â‚¬Â", "\""],
  ["Ã¢â‚¬Ëœ", "'"],
  ["Ã¢â‚¬â„¢", "'"],
  ["CD Projekt?s", "CD Projekt's"],
  ["publisher?s", "publisher's"],
  ["developer?s", "developer's"],
  ["collector?s", "collector's"],
  ["buyer?s", "buyer's"],
  ["seller?s", "seller's"],
  ["game?s", "game's"],
  ["site?s", "site's"],
]);

for (const [broken, fixed] of replacements) {
  text = text.split(broken).join(fixed);
}

const data = JSON.parse(text);
fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);

const updated = fs.readFileSync(filePath, "utf8");
const remaining = ["Ã", "Â", "â€"].filter((marker) => updated.includes(marker));
if (remaining.length) {
  console.warn(`Remaining possible mojibake markers: ${remaining.join(", ")}`);
  process.exitCode = 1;
}
