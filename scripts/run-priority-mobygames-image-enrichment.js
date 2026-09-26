const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const queuePath = path.join(rootDir, "data", "games", "library-cleanup-queue.json");
const envPath = path.join(rootDir, ".env");

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const dryRun = flags.has("--dry-run");
const limitPerPlatform = Number((args.find((arg) => arg.startsWith("--limit-per-platform=")) || "").split("=")[1] || 0);
const limitPlatforms = Number((args.find((arg) => arg.startsWith("--limit-platforms=")) || "").split("=")[1] || 0);
const requestedPlatforms = args.filter((arg) => !arg.startsWith("--"));

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) return;
      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    });
}

function hasUsableKey(key) {
  const value = String(process.env[key] || "").trim();
  return Boolean(value && !/^(replace_with_|your_)/i.test(value));
}

function runNode(script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

function main() {
  loadEnvFile();
  if (process.env.GCX_PROVIDER_DRY_RUN_AUDIT === "true") {
    const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));
    const priorityPlatforms = (queue.priority || [])
      .filter((item) => item.missingImages > 0)
      .map((item) => item.slug);
    let platforms = requestedPlatforms.length ? requestedPlatforms : priorityPlatforms;
    if (limitPlatforms > 0) platforms = platforms.slice(0, limitPlatforms);
    console.log(
      JSON.stringify(
        {
          provider: "MobyGames",
          auditOnly: true,
          dryRun,
          limitPlatforms,
          limitPerPlatform,
          platforms,
          plannedArgs: [
            ...platforms,
            ...(dryRun ? ["--dry-run", "--sample"] : []),
            ...(limitPerPlatform ? [`--limit=${limitPerPlatform}`] : []),
          ],
        },
        null,
        2
      )
    );
    return;
  }

  if (!hasUsableKey("MOBYGAMES_API_KEY")) {
    console.error("Missing MOBYGAMES_API_KEY in .env. Add it, then rerun this priority image enrichment script.");
    process.exitCode = 1;
    return;
  }

  const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));
  const priorityPlatforms = (queue.priority || [])
    .filter((item) => item.missingImages > 0)
    .map((item) => item.slug);
  let platforms = requestedPlatforms.length ? requestedPlatforms : priorityPlatforms;
  if (limitPlatforms > 0) platforms = platforms.slice(0, limitPlatforms);
  const mobyArgs = [
    ...platforms,
    ...(dryRun ? ["--dry-run", "--sample"] : []),
    ...(limitPerPlatform ? [`--limit=${limitPerPlatform}`] : []),
  ];

  console.log(`Running MobyGames image enrichment for: ${platforms.join(", ")}`);
  if (dryRun) console.log("Dry run only; no game files will be changed.");
  if (limitPlatforms) console.log(`Limit platforms: ${limitPlatforms}`);
  if (limitPerPlatform) console.log(`Limit per platform: ${limitPerPlatform}`);

  runNode(path.join("scripts", "enrich-mobygames-game-images.js"), mobyArgs);

  if (!dryRun) {
    runNode(path.join("scripts", "audit-game-library-completeness.js"));
    runNode(path.join("scripts", "build-data-health-cleanup-queue.js"));
    runNode(path.join("scripts", "export-game-image-queues.js"));
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
