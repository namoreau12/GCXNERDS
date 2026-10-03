const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const rootStaticExtensions = new Set([".html", ".js", ".css", ".ico", ".txt", ".xml"]);
const skippedDataDirs = new Set(["games", "launch-readiness", "community-uploads", "pokemon/cards-by-set", "magic/cards-by-set", "yugioh/cards-by-set"]);
const skippedDataFiles = new Set(["pokemon/cards.json", "magic/cards-search.json", "yugioh/cards-search.json"]);

function rmContents(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const item of fs.readdirSync(dir)) {
    if (item === ".gitkeep") continue;
    fs.rmSync(path.join(dir, item), { recursive: true, force: true });
  }
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDir(source, destination, shouldSkip = () => false) {
  if (!fs.existsSync(source)) return;
  for (const item of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, item.name);
    const relative = path.relative(source, sourcePath).replace(/\\/g, "/");
    if (shouldSkip(relative, item)) continue;
    const destinationPath = path.join(destination, relative);
    if (item.isDirectory()) {
      copyDir(sourcePath, destinationPath, (childRelative, childItem) => shouldSkip(`${relative}/${childRelative}`, childItem));
    } else {
      copyFile(sourcePath, destinationPath);
    }
  }
}

rmContents(publicDir);

for (const item of fs.readdirSync(rootDir, { withFileTypes: true })) {
  if (!item.isFile()) continue;
  const extension = path.extname(item.name).toLowerCase();
  if (rootStaticExtensions.has(extension)) {
    copyFile(path.join(rootDir, item.name), path.join(publicDir, item.name));
  }
}

copyDir(path.join(rootDir, "assets"), path.join(publicDir, "assets"));
copyDir(path.join(rootDir, "data"), path.join(publicDir, "data"), (relative, item) => {
  if (item.isDirectory() && skippedDataDirs.has(relative)) return true;
  if (item.isFile() && skippedDataFiles.has(relative)) return true;
  return false;
});

console.log(`Built Vercel static output in ${path.relative(rootDir, publicDir)}`);
