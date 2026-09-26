const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const queuePath = path.join(rootDir, "data", "games", "library-cleanup-queue.json");

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const dryRun = flags.has("--dry-run");
const skipKeyed = flags.has("--skip-keyed");
const skipNoKey = flags.has("--skip-no-key");
const limitPerPlatform = Number((args.find((arg) => arg.startsWith("--limit-per-platform=")) || "").split("=")[1] || 0);
const requestedPlatforms = args.filter((arg) => !arg.startsWith("--"));

const libretroPlatforms = new Set([
  "3ds",
  "dreamcast",
  "ds",
  "gameboy",
  "gamecube",
  "gba",
  "genesis",
  "n64",
  "nes",
  "ps1",
  "ps2",
  "ps3",
  "ps4",
  "psp",
  "saturn",
  "snes",
  "vita",
  "wii",
  "xbox",
  "xbox360",
]);

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

function hasUsableEnv(key) {
  const value = String(process.env[key] || "").trim();
  return Boolean(value && !/^replace_with_/i.test(value));
}

function runNode(script, scriptArgs = [], { allowFailure = false } = {}) {
  const commandArgs = [script, ...scriptArgs];
  console.log(`\n> node ${commandArgs.join(" ")}`);
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${script} exited with status ${result.status}`);
  }
  return result.status === 0;
}

function priorityPlatforms() {
  if (requestedPlatforms.length) return requestedPlatforms;
  const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));
  return (queue.priority || []).filter((item) => item.missingImages > 0).map((item) => item.slug);
}

function main() {
  loadEnvFile();
  const platforms = priorityPlatforms();
  const libretroTargets = platforms.filter((platform) => libretroPlatforms.has(platform));
  const commonLimitArgs = limitPerPlatform ? [`--limit-per-platform=${limitPerPlatform}`] : [];
  const directLimitArgs = limitPerPlatform ? [`--limit=${limitPerPlatform}`] : [];

  console.log(`Game image pipeline platforms: ${platforms.join(", ")}`);
  if (dryRun) console.log("Dry run enabled; provider scripts will not write game data.");
  if (limitPerPlatform) console.log(`Limit per platform: ${limitPerPlatform}`);

  if (!skipNoKey) {
    runNode(path.join("scripts", "clean-wikipedia-list-page-images.js"), dryRun ? ["--dry-run"] : []);
    runNode(path.join("scripts", "clean-wikipedia-logo-images.js"), dryRun ? ["--dry-run"] : []);
    runNode(path.join("scripts", "clean-duplicate-libretro-images.js"), [...(dryRun ? ["--dry-run"] : []), "--min=5"]);
    if (platforms.includes("ps1")) {
      runNode(path.join("scripts", "enrich-ps1-playstation-chihiro-images.js"), dryRun ? ["--dry-run"] : []);
    }
    if (platforms.includes("ps2")) {
      runNode(path.join("scripts", "enrich-ps2-playstation-chihiro-images.js"), dryRun ? ["--dry-run"] : []);
    }
    if (platforms.includes("ps3")) {
      runNode(path.join("scripts", "enrich-ps3-playstation-chihiro-images.js"), dryRun ? ["--dry-run"] : []);
    }
    if (platforms.includes("vita")) {
      runNode(path.join("scripts", "enrich-vita-playstation-chihiro-images.js"), dryRun ? ["--dry-run"] : []);
    }
    if (platforms.includes("psp")) {
      runNode(path.join("scripts", "enrich-psp-playstation-chihiro-images.js"), dryRun ? ["--dry-run"] : []);
    }
    for (const platform of platforms) {
      runNode(
        path.join("scripts", "enrich-wikipedia-infobox-images.js"),
        [platform, "--article-only", "--strict-title", "--batch-size=80", "--delay-ms=50", ...(dryRun ? ["--dry-run"] : [])],
        { allowFailure: true }
      );
    }
    if (libretroTargets.length) {
      runNode(path.join("scripts", "enrich-libretro-images-exact.js"), [...(dryRun ? ["--dry-run"] : []), ...libretroTargets, ...directLimitArgs]);
      runNode(path.join("scripts", "enrich-libretro-raw-filename-probe.js"), [...(dryRun ? ["--dry-run"] : []), ...libretroTargets, ...directLimitArgs], { allowFailure: true });
      runNode(path.join("scripts", "resolve-libretro-alias-image-urls.js"), [...(dryRun ? ["--dry-run"] : []), ...libretroTargets, ...directLimitArgs], { allowFailure: true });
    }
  }

  if (!skipKeyed) {
    runNode(path.join("scripts", "report-image-provider-readiness.js"));

    if (hasUsableEnv("RAWG_API_KEY")) {
      runNode(path.join("scripts", "run-priority-image-enrichment.js"), [...(dryRun ? ["--dry-run"] : []), ...commonLimitArgs, ...platforms]);
    } else {
      console.log("\nRAWG_API_KEY missing; skipping RAWG image enrichment.");
    }

    if (hasUsableEnv("MOBYGAMES_API_KEY")) {
      runNode(path.join("scripts", "run-priority-mobygames-image-enrichment.js"), [...(dryRun ? ["--dry-run"] : []), ...commonLimitArgs, ...platforms]);
    } else {
      console.log("\nMOBYGAMES_API_KEY missing; skipping MobyGames image enrichment.");
    }
  }

  if (!dryRun) {
    runNode(path.join("scripts", "audit-game-library-completeness.js"));
    runNode(path.join("scripts", "build-data-health-cleanup-queue.js"));
    runNode(path.join("scripts", "export-game-image-queues.js"));
  } else {
    console.log("\nDry run complete; audit/queue files were not regenerated.");
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
