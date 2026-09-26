const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");

function runNode(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: rootDir,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

runNode(path.join("scripts", "export-missing-image-queue-csv.js"));
runNode(path.join("scripts", "export-missing-image-queue-csv.js"), ["--finishable", "--limit-platforms=8"]);
runNode(path.join("scripts", "export-missing-image-queue-csv.js"), ["--review-batch", "--limit-records=50"]);
runNode(path.join("scripts", "export-priority-image-review-batches.js"), ["--limit-platforms=8", "--limit-records=100"]);
runNode(path.join("scripts", "export-priority-image-review-batches.js"), ["--finishable", "--limit-platforms=8"]);
runNode(path.join("scripts", "export-game-image-milestone-batches.js"));
