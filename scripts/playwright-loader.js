const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const bundledNodeModules = path.join(
  process.env.USERPROFILE || "C:\\Users\\namor",
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "node",
  "node_modules"
);

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (error) {
    if (error?.code !== "MODULE_NOT_FOUND") throw error;
    const packagePath = path.join(bundledNodeModules, "playwright", "package.json");
    if (!fs.existsSync(packagePath)) throw error;
    return createRequire(packagePath)("playwright");
  }
}

module.exports = loadPlaywright();
