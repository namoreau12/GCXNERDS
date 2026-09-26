const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const scriptPath = path.join("scripts", "migrate-data-to-supabase.js");
const outputPath = path.join(rootDir, "data", "launch-readiness", "supabase-migration-cli-safety.json");

function run(args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    encoding: "utf8",
  });
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function main() {
  const failures = [];
  const help = run(["--help"]);
  assert(help.status === 0, "--help should exit successfully.", failures);
  assert(/Usage:/i.test(help.stdout), "--help should print usage text.", failures);
  assert(!/Importing \d[\d,]* JSON files to Supabase/i.test(help.stdout), "--help should not start an import.", failures);

  const shortHelp = run(["-h"]);
  assert(shortHelp.status === 0, "-h should exit successfully.", failures);
  assert(/Usage:/i.test(shortHelp.stdout), "-h should print usage text.", failures);
  assert(!/Importing \d[\d,]* JSON files to Supabase/i.test(shortHelp.stdout), "-h should not start an import.", failures);

  const refreshWithoutPaths = run(["--refresh-selected"]);
  assert(refreshWithoutPaths.status !== 0, "--refresh-selected without --paths should fail.", failures);
  assert(/requires --paths/i.test(refreshWithoutPaths.stderr || refreshWithoutPaths.stdout), "--refresh-selected failure should explain that --paths is required.", failures);

  const report = {
    ok: failures.length === 0,
    generatedAt: new Date().toISOString(),
    checks: {
      helpExitCode: help.status,
      shortHelpExitCode: shortHelp.status,
      refreshWithoutPathsExitCode: refreshWithoutPaths.status,
    },
    failures,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main();
